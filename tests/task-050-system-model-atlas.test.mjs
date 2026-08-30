import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

import {
  renderAll,
  renderPublicBundle,
  validateAtlas,
} from '../docs/system-models/task-050/generate-atlas.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const TASK_ROOT = path.join(ROOT, 'docs/system-models/task-050');
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'));
const atlas = readJson('docs/system-models/task-050/atlas-data.json');
const ledger = readJson('docs/system-models/task-050/source-ledger.json');
const audit = readJson('docs/system-models/task-050/component-relationship-audit.json');
const architecture = readJson('docs/system-models/task-050/architecture-evaluation.json');
const coverage = readJson(atlas.release_coverage_path);

function collectTicketRecords(value, found = new Map()) {
  if (!value || typeof value !== 'object') return found;
  if (Array.isArray(value)) {
    for (const item of value) collectTicketRecords(item, found);
    return found;
  }
  if (typeof value.ticket_id === 'string' && Array.isArray(value.public_candidate_fault_ids)) found.set(value.ticket_id, value);
  for (const child of Object.values(value)) collectTicketRecords(child, found);
  return found;
}

const tickets = collectTicketRecords(coverage);
const profiles = new Map(atlas.profiles.map((profile) => [profile.profile_id, profile]));

test('TASK-050 validates five selected dossiers and exactly five generated illustrations', () => {
  assert.deepEqual(validateAtlas(), []);
  assert.equal(atlas.dossiers.length, 5);
  assert.equal(new Set(atlas.dossiers.map((dossier) => dossier.ticket_id)).size, 5);
  assert.equal([...renderAll().keys()].filter((file) => file.endsWith('.svg')).length, 5);
  const reuse = Object.fromEntries(atlas.profiles.map((profile) => [
    profile.profile_id,
    atlas.dossiers.filter((dossier) => dossier.profile_id === profile.profile_id).length,
  ]));
  assert.deepEqual(reuse, {
    'profile.dell.poweredge-r740xd.hybrid-24x2_5.v1': 4,
    'profile.dell.poweredge-r740xd2.power-interposer.v1': 1,
  });
});

test('generated atlas files are committed and byte-stable across two reconstructions', () => {
  const first = renderAll();
  const second = renderAll();
  assert.deepEqual([...first.keys()], [...second.keys()]);
  for (const [file, content] of first) {
    assert.equal(content, second.get(file), `${file} changed between in-memory renders`);
    assert.equal(fs.readFileSync(path.join(TASK_ROOT, file), 'utf8'), content, `${file} is stale`);
  }
  const result = spawnSync(process.execPath, ['docs/system-models/task-050/generate-atlas.mjs', '--check'], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /Checked 15 TASK-050 files/);
});

test('each reusable public projection is byte-identical across every synthetic hidden-truth variant', () => {
  for (const dossier of atlas.dossiers) {
    const profile = profiles.get(dossier.profile_id);
    const ticket = tickets.get(dossier.ticket_id);
    const publicInput = {
      ticket_id: ticket.ticket_id,
      public_symptom_ids: ticket.public_symptom_ids,
      public_candidate_fault_ids: ticket.public_candidate_fault_ids,
    };
    const baseline = JSON.stringify(renderPublicBundle(dossier, profile, publicInput));
    for (const syntheticHiddenTruth of dossier.differential_variants) {
      const mutated = structuredClone(dossier);
      mutated.hidden_consistency_summary = `synthetic private truth: ${syntheticHiddenTruth}`;
      mutated.private_role_bindings = { [`private.${syntheticHiddenTruth}`]: [dossier.focus_node_ids[0]] };
      mutated.differential_variants = [syntheticHiddenTruth];
      assert.equal(JSON.stringify(renderPublicBundle(mutated, profile, publicInput)), baseline, `${dossier.dossier_id} leaked ${syntheticHiddenTruth}`);
    }
  }
});

test('all five public Candidate sets close over truthful public nodes and no private outcome enters SVG', () => {
  const generated = renderAll();
  for (const dossier of atlas.dossiers) {
    const ticket = tickets.get(dossier.ticket_id);
    assert.deepEqual(
      dossier.candidate_closure.map((entry) => entry.candidate_id).sort(),
      [...ticket.public_candidate_fault_ids].sort(),
    );
    const svg = generated.get(`diagrams/${dossier.slug}.svg`);
    for (const step of ticket.oracle_witness) {
      for (const privateValue of [step.evidence_outcome_id, step.repair_outcome_id, step.verification_outcome_id, step.target_fault_instance_key].filter(Boolean)) {
        assert.equal(svg.includes(privateValue), false, `${dossier.dossier_id} SVG exposed ${privateValue}`);
      }
    }
    for (const route of ticket.diagnostics.authored_isolation_routes) assert.equal(svg.includes(route.route_kind), false);
  }
});

test('every authored Evidence, Isolation, Repair, and Verification witness step has a profile realization', () => {
  const generated = renderAll();
  for (const dossier of atlas.dossiers) {
    const ticket = tickets.get(dossier.ticket_id);
    const markdown = generated.get(`dossiers/${dossier.slug}.md`);
    assert.equal(ticket.oracle_witness.length >= 4, true);
    for (const [index, step] of ticket.oracle_witness.entries()) {
      assert.match(markdown, new RegExp(`\\| ${index + 1} \\| ${step.action} \\|`));
      const authoredReference = step.evidence_outcome_id ?? step.repair_outcome_id ?? step.verification_outcome_id ?? step.target_fault_instance_key;
      assert.equal(markdown.includes(authoredReference), true, `${dossier.dossier_id} omitted ${authoredReference}`);
    }
  }
});

test('every Ticket-relevant Test, Command, Repair, and Verification has a rationale row', () => {
  const generated = renderAll();
  for (const dossier of atlas.dossiers) {
    const ticket = tickets.get(dossier.ticket_id);
    const markdown = generated.get(`dossiers/${dossier.slug}.md`);
    const actionIds = [
      ...ticket.diagnostics.relevant_source_ids,
      ...ticket.repair_procedure_ids,
      ...ticket.validation_procedure_ids,
    ];
    for (const id of actionIds) assert.equal(markdown.includes(`\`${id}\``), true, `${dossier.dossier_id} omitted ${id}`);
  }
});

test('all model technical claims resolve uniquely to accessible primary-source ledger entries', () => {
  const claims = new Map();
  for (const source of ledger.sources) {
    assert.match(source.url, /^https:\/\//);
    assert.equal(source.access_status, 'accessible');
    assert.match(source.kind, /manufacturer|primary_standard/);
    for (const claimId of source.claim_ids) {
      assert.equal(claims.has(claimId), false, `duplicate source claim ${claimId}`);
      claims.set(claimId, source.source_id);
    }
  }
  for (const profile of atlas.profiles) {
    const claimIds = [
      ...profile.claim_ids,
      ...profile.components.flatMap((item) => item.claim_ids),
      ...profile.nodes.flatMap((item) => item.claim_ids),
      ...profile.edges.flatMap((item) => item.claim_ids),
      ...profile.lifecycle.flatMap((item) => item.claim_ids),
    ];
    for (const claimId of claimIds) assert.equal(claims.has(claimId), true, `${profile.profile_id} has unsourced ${claimId}`);
  }
});

test('component and relationship audit is exhaustive, concrete, and makes no production mutation', () => {
  const validRoleClasses = new Set(['existing_sufficient', 'existing_but_broad', 'missing_required', 'optional_outside_scope', 'rejected_unjustified']);
  assert.equal(audit.component_roles.length, audit.summary.modeled_role_rows);
  const classificationCounts = Object.fromEntries([...validRoleClasses].map((classification) => [
    classification,
    audit.component_roles.filter((role) => role.classification === classification).length,
  ]));
  assert.equal(classificationCounts.existing_sufficient, audit.summary.existing_sufficient);
  assert.equal(classificationCounts.existing_but_broad, audit.summary.existing_but_broad);
  assert.equal(classificationCounts.missing_required, audit.summary.missing_required);
  assert.equal(classificationCounts.optional_outside_scope, audit.summary.optional_outside_scope);
  assert.equal(classificationCounts.rejected_unjustified, audit.summary.rejected_unjustified);
  for (const role of audit.component_roles) {
    assert.equal(validRoleClasses.has(role.classification), true);
    assert.deepEqual(Object.keys(role.object_audit).sort(), ['faults_symptoms', 'repairs_verifications', 'tests_commands']);
  }
  assert.equal(audit.relationship_findings.length, audit.summary.relationship_findings);
  for (const finding of audit.relationship_findings) {
    assert.equal(finding.domain_object_ids.length > 0, true);
    assert.equal(finding.dossier_ids.length > 0, true);
    assert.equal(finding.need.length > 40, true);
    for (const id of finding.dossier_ids) assert.equal(atlas.dossiers.some((dossier) => dossier.dossier_id === id), true);
  }
  assert.equal(audit.summary.production_edits_made, 0);
});

test('every referenced existing Component ID resolves in the unchanged Viewer domain catalogs', () => {
  const componentIds = new Set();
  const collect = (value) => {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) return value.forEach(collect);
    if (typeof value.id === 'string' && value.id.startsWith('component.')) componentIds.add(value.id);
    Object.values(value).forEach(collect);
  };
  for (const file of fs.readdirSync(path.join(ROOT, 'viewer/content')).filter((name) => name.endsWith('.json'))) collect(readJson(`viewer/content/${file}`));
  for (const profile of atlas.profiles) {
    for (const item of [...profile.components, ...profile.nodes]) {
      if (item.domain_component_id) assert.equal(componentIds.has(item.domain_component_id), true, `${profile.profile_id} references unknown ${item.domain_component_id}`);
    }
  }
  for (const role of audit.component_roles.filter((entry) => entry.domain_component_id)) {
    assert.equal(componentIds.has(role.domain_component_id), true, `${role.role} references unknown ${role.domain_component_id}`);
  }
});

test('SVGs expose accessible semantics and redundant non-color relation cues', () => {
  const generated = renderAll();
  for (const dossier of atlas.dossiers) {
    const svg = generated.get(`diagrams/${dossier.slug}.svg`);
    assert.match(svg, /role="img" aria-labelledby="title desc"/);
    assert.match(svg, /<title id="title">/);
    assert.match(svg, /<desc id="desc">/);
    assert.match(svg, /tabindex="0" role="group"/);
    assert.match(svg, /stroke-dasharray=/);
    assert.match(svg, /marker-end=/);
    assert.match(svg, /@media \(forced-colors: active\)/);
    assert.match(svg, />POWER<|>DATA<|>CONTROL<|>LIFECYCLE<|>CONTAINMENT</);
  }
});

test('SYSTEM-001 comparison uses measured pilot evidence and leaves TASK-051 blocked', () => {
  assert.equal(architecture.pilot_denominator.tickets, 5);
  assert.equal(architecture.pilot_denominator.source_backed_profiles, 2);
  assert.equal(architecture.pilot_denominator.public_equivalence_classes, 5);
  assert.equal(architecture.strategies.length, 4);
  assert.equal(architecture.recommended_option, 'A');
  assert.equal(architecture.strategies.find((entry) => entry.option === 'B').profiles_or_full_models_authored, 5);
  assert.equal(architecture.strategies.find((entry) => entry.option === 'C').combinations_cannot_be_proved_real, 2);
  assert.equal(architecture.approval_gate.status, 'pending_owner_approval');
  assert.equal(architecture.approval_gate.blocked_task, 'TASK-051');
});

test('all TASK-050 and updated roadmap Markdown links resolve repository-locally', () => {
  const markdownFiles = [
    'README.md',
    'docs/tasks/INDEX.md',
    'docs/tasks/TASK-050-create-five-ticket-system-model-atlas.md',
    'docs/system-models/README.md',
    'docs/design/decisions/APPROVALS.md',
    'docs/design/decisions/DECISION_INDEX.md',
    ...fs.readdirSync(TASK_ROOT).filter((file) => file.endsWith('.md')).map((file) => `docs/system-models/task-050/${file}`),
    ...fs.readdirSync(path.join(TASK_ROOT, 'dossiers')).filter((file) => file.endsWith('.md')).map((file) => `docs/system-models/task-050/dossiers/${file}`),
  ];
  for (const relativePath of markdownFiles) {
    const absolutePath = path.join(ROOT, relativePath);
    const source = fs.readFileSync(absolutePath, 'utf8');
    for (const match of source.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/g)) {
      let target = match[1].trim();
      if (target.startsWith('<') && target.endsWith('>')) target = target.slice(1, -1);
      if (/^(?:https?:|mailto:|data:)/i.test(target) || target.startsWith('#')) continue;
      target = decodeURIComponent(target.split('#')[0]);
      if (!target) continue;
      assert.equal(fs.existsSync(path.resolve(path.dirname(absolutePath), target)), true, `${relativePath} has missing link ${target}`);
    }
  }
});
