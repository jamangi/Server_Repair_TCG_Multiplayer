import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(here, '..', '..');
const selectionPath = path.join(here, 'pilot-selection-v1.json');

let passed = 0;
const failures = [];

async function check(name, operation) {
  try {
    await operation();
    passed += 1;
  } catch (error) {
    failures.push(`${name}: ${error.message}`);
  }
}

function sorted(values) {
  return [...values].sort((left, right) => left.localeCompare(right));
}

function combinations(values, size, start = 0, prefix = [], output = []) {
  if (prefix.length === size) {
    output.push(prefix);
    return output;
  }
  for (let index = start; index <= values.length - (size - prefix.length); index += 1) {
    combinations(values, size, index + 1, [...prefix, values[index]], output);
  }
  return output;
}

function scoreCombination(entries, pressureOrder) {
  const counts = new Map(pressureOrder.map((pressure) => [pressure, 0]));
  for (const entry of entries) {
    for (const pressure of entry.pressure_tags) {
      counts.set(pressure, counts.get(pressure) + 1);
    }
  }
  const values = [...counts.values()];
  return {
    covered_pressure_count: values.filter((count) => count > 0).length,
    balanced_depth_sum: values.reduce((total, count) => total + Math.min(2, count), 0),
    pressure_occurrence_count: values.reduce((total, count) => total + count, 0),
    distinct_shift_count: new Set(entries.map((entry) => entry.shift)).size,
    signature: sorted(entries.map((entry) => entry.ticket_id)).join('|'),
  };
}

function compareScores(left, right) {
  for (const field of ['covered_pressure_count', 'balanced_depth_sum', 'pressure_occurrence_count', 'distinct_shift_count']) {
    if (left[field] !== right[field]) return right[field] - left[field];
  }
  return left.signature.localeCompare(right.signature);
}

function ticketPublicBasisIds(ticket) {
  return new Set([
    ...ticket.public_symptom_ids,
    ...ticket.public_candidate_fault_ids,
    ...ticket.diagnostics.minimal_witness_source_ids,
    ...ticket.repair_procedure_ids,
    ...ticket.validation_procedure_ids,
  ]);
}

async function validateMarkdownLinks(markdownPath) {
  const source = await readFile(markdownPath, 'utf8');
  const matches = source.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/g);
  for (const match of matches) {
    let target = match[1].trim();
    if (target.startsWith('<') && target.endsWith('>')) target = target.slice(1, -1);
    if (/^(?:https?:|mailto:|data:)/i.test(target) || target.startsWith('#')) continue;
    target = decodeURIComponent(target.split('#')[0]);
    if (!target) continue;
    await access(path.resolve(path.dirname(markdownPath), target));
  }
}

const selectionBytes = await readFile(selectionPath);
const selection = JSON.parse(selectionBytes);
const coveragePath = path.resolve(repositoryRoot, selection.source.path);
const coverageBytes = await readFile(coveragePath);
const coverage = JSON.parse(coverageBytes);
const coverageTickets = coverage.matches.flatMap((match) => match.tickets.map((ticket) => ({
  ...ticket,
  shift: match.shift_number,
})));
const coverageById = new Map(coverageTickets.map((ticket) => [ticket.ticket_id, ticket]));

await check('coverage digest is pinned', async () => {
  assert.equal(createHash('sha256').update(coverageBytes).digest('hex'), selection.source.sha256);
});
await check('released denominator is exactly 18 Tickets', async () => {
  assert.equal(coverageTickets.length, selection.source.expected_ticket_count);
  assert.equal(coverage.proof_totals.solvability_witnessed_tickets, 18);
});
await check('classification ledger covers the exact released Ticket IDs', async () => {
  assert.deepEqual(sorted(selection.tickets.map((entry) => entry.ticket_id)), sorted(coverageTickets.map((entry) => entry.ticket_id)));
});
await check('classification uses unique Ticket IDs and known pressures', async () => {
  assert.equal(new Set(selection.tickets.map((entry) => entry.ticket_id)).size, selection.tickets.length);
  const allowed = new Set(selection.pressure_order);
  for (const entry of selection.tickets) {
    assert.equal(new Set(entry.pressure_tags).size, entry.pressure_tags.length);
    assert.ok(entry.pressure_tags.every((tag) => allowed.has(tag)));
  }
});
await check('classification pins released shift and fingerprint', async () => {
  for (const entry of selection.tickets) {
    const released = coverageById.get(entry.ticket_id);
    assert.equal(entry.shift, released.shift);
    assert.equal(entry.fingerprint_id, released.fingerprint_id);
  }
});
await check('classification evidence is present in committed non-hidden coverage fields', async () => {
  for (const entry of selection.tickets) {
    const allowed = ticketPublicBasisIds(coverageById.get(entry.ticket_id));
    for (const basisId of entry.basis_ids) assert.ok(allowed.has(basisId), `${entry.ticket_id} basis ${basisId}`);
  }
});
await check('classification ledger contains no hidden-truth field', async () => {
  assert.ok(!selectionBytes.toString('utf8').includes('hidden_true_fault_ids'));
});
await check('ambiguity pressure requires multiple public Candidates', async () => {
  for (const entry of selection.tickets.filter((item) => item.pressure_tags.includes('ambiguous_public_candidates'))) {
    assert.ok(coverageById.get(entry.ticket_id).public_candidate_fault_ids.length > 1);
  }
});

const ranked = combinations(selection.tickets, selection.selection_size)
  .map((entries) => ({ entries, score: scoreCombination(entries, selection.pressure_order) }))
  .sort((left, right) => compareScores(left.score, right.score));
const best = ranked[0];
const selectedIds = sorted(best.entries.map((entry) => entry.ticket_id));

await check('selection enumerates all 8,568 five-Ticket combinations', async () => {
  assert.equal(ranked.length, 8568);
});
await check('expected selection equals the deterministic optimum', async () => {
  assert.deepEqual(selectedIds, selection.expected_selection);
});
await check('selected five cover every declared pressure', async () => {
  assert.equal(best.score.covered_pressure_count, selection.pressure_order.length);
});
await check('score order is the documented deterministic order', async () => {
  assert.deepEqual(selection.score_order, [
    'covered_pressure_count_desc',
    'balanced_depth_sum_desc',
    'pressure_occurrence_count_desc',
    'distinct_shift_count_desc',
    'sorted_ticket_id_signature_asc',
  ]);
});

const contractPath = path.join(here, 'SYSTEM_MODEL_CONTRACT.md');
const contract = await readFile(contractPath, 'utf8');
await check('contract names all four acceptance definitions', async () => {
  for (const heading of ['### Ticket-consistent', '### Public-safe', '### Reality-consistent', '### Component-DB-synchronized']) {
    assert.ok(contract.includes(heading), heading);
  }
});
await check('every field-ownership row names producer, validator, and consumer', async () => {
  const section = contract.split('## Field producer, validator, and consumer ownership')[1].split('## V0 authority boundary')[0];
  const rows = section.split('\n').filter((line) => line.startsWith('| ') && !line.includes('---') && !line.includes('Field family'));
  assert.equal(rows.length, 18);
  for (const row of rows) {
    const cells = row.split('|').slice(1, -1).map((cell) => cell.trim());
    assert.equal(cells.length, 4);
    assert.ok(cells.every(Boolean), row);
  }
});

const requiredMarkdown = [
  path.join(repositoryRoot, 'README.md'),
  path.join(repositoryRoot, 'docs', 'tasks', 'INDEX.md'),
  path.join(repositoryRoot, 'docs', 'tasks', 'TASK-049-define-system-model-and-research-protocol.md'),
  path.join(here, 'README.md'),
  path.join(here, 'SYSTEM_MODEL_CONTRACT.md'),
  path.join(here, 'RESEARCH_PROTOCOL.md'),
  path.join(here, 'PILOT_SELECTION.md'),
  path.join(here, 'WORKED_EXAMPLES.md'),
];
for (const markdownPath of requiredMarkdown) {
  await check(`repository-relative Markdown links resolve: ${path.relative(repositoryRoot, markdownPath)}`, async () => {
    await validateMarkdownLinks(markdownPath);
  });
}

console.log(JSON.stringify({
  selection_version: selection.selection_version,
  released_ticket_count: coverageTickets.length,
  combinations_evaluated: ranked.length,
  selected_ticket_ids: selectedIds,
  score: best.score,
  checks: { passed, failed: failures.length, total: passed + failures.length },
  failures,
}, null, 2));

if (failures.length > 0) process.exitCode = 1;
