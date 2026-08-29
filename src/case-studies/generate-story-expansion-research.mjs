import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const STORY_EXPANSION_RESEARCH_VERSION = 'story-expansion-research-registry-v1';

const ROOT = path.resolve(import.meta.dirname, '../..');
const RESEARCH_ROOT = path.join(ROOT, 'docs/case_studies/v0.2-story-expansion');
const REGISTRY_PATH = path.join(RESEARCH_ROOT, 'registry.json');
const COVERAGE_PATH = path.join(ROOT, 'docs/story/coverage/campaign-one-domain-coverage.json');
const DOMAIN_PATH = path.join(ROOT, 'content/gameplay-v1/domain-snapshot-v2.json');

export const STORY_EXPANSION_RESEARCH_OUTPUTS = Object.freeze({
  q: path.join(RESEARCH_ROOT, 'Q-CALCULATION.md'),
  matrix: path.join(RESEARCH_ROOT, 'SIX-SLOT-EVIDENCE-MATRIX.md'),
  completion: path.join(RESEARCH_ROOT, 'COMPLETION.md'),
});

const EXPECTED_CASE_IDS = Object.freeze(['exp-001', 'exp-002', 'exp-003', 'exp-004', 'exp-005', 'exp-006']);
const EXPECTED_SLOT_IDS = Object.freeze(['expansion-slot-01', 'expansion-slot-02', 'expansion-slot-03', 'expansion-slot-04', 'expansion-slot-05', 'expansion-slot-06']);
const EXPECTED_URLS = Object.freeze([
  'https://www.dell.com/community/en/conversations/rack-servers/r910-will-not-power-on-with-4-processors/647f7d25f4ccf8a8deb93b08',
  'https://www.dell.com/community/en/conversations/poweredge-hardware-general/t420-poweredge-vlt0204-main-board-voltage-outside-of-range/67fd91b469e6265ea77af6ab',
  'https://www.dell.com/community/en/conversations/poweredge-hardware-general/poweredge-r620-drive-predicted-failure/647f7b52f4ccf8a8de9878d4',
  'https://www.dell.com/community/en/conversations/poweredge-hddscsiraid/pe2900-backplane-degraded/647e8b20f4ccf8a8dede59e9',
  'https://www.dell.com/community/en/conversations/poweredge-hardware-general/idrac-keeps-messaging-the-nic-in-slot-4-port-1-network-link-is-started/647f94b2f4ccf8a8de70eaff',
  'https://forums.serverbuilds.net/t/ga-7pesh2-bmc-recovery/882',
]);
const LIFECYCLE = Object.freeze(['Observe', 'Hypothesize', 'Test', 'Isolate', 'Repair', 'Verify', 'Document']);
const FIDELITIES = new Set(['explicit', 'inferred']);
const CLASSIFICATIONS = new Set(['exact', 'generic_semantic', 'uncertain']);
const SUPPORT_TYPES = Object.freeze({
  symptom_ids: 'symptom',
  fault_ids: 'fault',
  test_ids: 'test',
  repair_ids: 'repair_procedure',
  validation_ids: 'validation_procedure',
  component_ids: 'component',
  tool_ids: 'tool',
  protocol_ids: 'protocol',
});

const stableCompare = (left, right) => (left < right ? -1 : left > right ? 1 : 0);
const sorted = (values) => [...values].sort(stableCompare);
const unique = (values) => new Set(values).size === values.length;
const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const sum = (values) => values.reduce((total, value) => total + value, 0);

function normalize(value) {
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort(stableCompare).map((key) => [key, normalize(value[key])]));
  }
  return value;
}

export const stableResearchJson = (value) => `${JSON.stringify(normalize(value), null, 2)}\n`;

function fail(code, detail) {
  const error = new Error(`${code}: ${detail}`);
  error.code = code;
  throw error;
}

function assertResearch(condition, code, detail) {
  if (!condition) fail(code, detail);
}

function exact(actual, expected, label) {
  assertResearch(actual === expected, 'PIN_MISMATCH', `${label} expected ${expected}; received ${actual}.`);
}

function same(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function validateStableRef(reference, entityById, location) {
  const entity = entityById.get(reference.id);
  assertResearch(entity, 'STALE_STABLE_ID', `${location} references missing ${reference.id}.`);
  exact(reference.entity_type, entity.entity_type, `${location} entity type for ${reference.id}`);
  assertResearch(CLASSIFICATIONS.has(reference.classification), 'INVALID_CLASSIFICATION', `${location} uses ${reference.classification}.`);
}

export function validateStoryExpansionResearchRegistry(registry, { coverageRaw, coverage, domain }) {
  exact(registry.registry_version, STORY_EXPANSION_RESEARCH_VERSION, 'Registry version');
  exact(registry.research_set_id, 'case-study.story-expansion.v0.2', 'Research set ID');
  exact(registry.access_date, '2026-08-28', 'Access date');
  exact(registry.status, 'RESEARCH_ONLY_NOT_DOMAIN_OR_GAMEPLAY_AUTHORITY', 'Registry authority status');
  exact(sha256(coverageRaw), registry.pins.task_039_json_sha256, 'TASK-039 JSON SHA-256');
  exact(coverage.audit_version, registry.pins.task_039_audit_version, 'TASK-039 audit version');
  exact(coverage.pins.domain_content_version, registry.pins.domain_content_version, 'Domain content pin');
  exact(coverage.pins.playable_coverage_version, registry.pins.playable_coverage_version, 'Playable coverage pin');
  exact(coverage.pins.ruleset_version, registry.pins.ruleset_version, 'Ruleset pin');
  exact(domain.domain_content_version, registry.pins.domain_content_version, 'Loaded domain version');

  const entityById = new Map(domain.entities.map((entity) => [entity.id, entity]));
  exact(entityById.size, domain.entities.length, 'Canonical stable-ID count');

  const q = registry.q_calculation;
  exact(q.target_episode_slots, 6, 'Target episode slots');
  exact(q.validated_distinct_existing_complete_arc_count, 0, 'Validated existing complete arcs');
  assertResearch(same(q.validated_existing_arc_ids, []), 'Q_ARITHMETIC', 'No existing complete arc IDs may be counted.');
  exact(q.q0, Math.max(0, q.target_episode_slots - q.validated_distinct_existing_complete_arc_count), 'Q0');
  for (const adjustment of q.adjustments) {
    assertResearch(['MISSING_LIFECYCLE', 'SUBSYSTEM_DIVERSITY_COLLISION'].includes(adjustment.reason_code), 'INVALID_ADJUSTMENT', `Unknown adjustment ${adjustment.reason_code}.`);
    assertResearch(Number.isInteger(adjustment.increment) && adjustment.increment > 0, 'INVALID_ADJUSTMENT', 'Adjustment increments must be positive integers.');
  }
  exact(q.adjustments.length, 0, 'Q adjustment count');
  exact(q.final_q, q.q0 + sum(q.adjustments.map((entry) => entry.increment)), 'Final Q');
  exact(q.final_q, 6, 'Pinned final Q');

  const globalCommands = sorted(domain.entities.filter((entity) => entity.entity_type === 'command').map((entity) => entity.id));
  exact(registry.command_audit.catalog_exposure_count, 13, 'Command exposure count');
  assertResearch(same(registry.command_audit.catalog_exposure_ids, globalCommands), 'COMMAND_AUDIT_DRIFT', 'Command exposure IDs must exhaust the pinned 13-Command catalog.');
  assertResearch(same(registry.command_audit.source_supported_useful_current_command_ids, []), 'COMMAND_AUDIT_DRIFT', 'Research does not authorize a current Command as useful for these future Tickets.');
  assertResearch(same(registry.command_audit.required_isolation_current_command_ids, []), 'COMMAND_AUDIT_DRIFT', 'No selected research case requires a current Command under current semantics.');
  exact(registry.command_audit.required_isolation_current_command_count, 0, 'Required current Command count');

  assertResearch(Array.isArray(registry.selected_cases), 'INVALID_REGISTRY', 'selected_cases must be an array.');
  exact(registry.selected_cases.length, q.final_q, 'Qualifying selected case count');
  assertResearch(same(registry.selected_cases.map((entry) => entry.case_id), EXPECTED_CASE_IDS), 'CASE_SET_DRIFT', 'Selected case IDs or ordering changed.');
  assertResearch(same(registry.selected_cases.map((entry) => entry.slot_id), EXPECTED_SLOT_IDS), 'SLOT_SET_DRIFT', 'Case slot IDs or ordering changed.');
  assertResearch(same(registry.selected_cases.map((entry) => entry.source.url), EXPECTED_URLS), 'SOURCE_SET_DRIFT', 'Selected source URLs or ordering changed.');
  assertResearch(unique(registry.selected_cases.map((entry) => entry.learning_objective_key)), 'DUPLICATE_OBJECTIVE', 'Learning-objective keys must be unique.');
  assertResearch(unique(registry.selected_cases.map((entry) => entry.fingerprint_candidate_key)), 'DUPLICATE_FINGERPRINT_CANDIDATE', 'Fingerprint candidate keys must be unique.');
  assertResearch(unique(registry.selected_cases.map((entry) => entry.subsystem)), 'SUBSYSTEM_DIVERSITY_COLLISION', 'Selected subsystem labels must be unique.');

  for (const entry of registry.selected_cases) {
    const location = entry.case_id;
    exact(entry.source.access_date, registry.access_date, `${location} source access date`);
    exact(entry.source.directly_opened, true, `${location} directly-opened flag`);
    assertResearch(entry.source.url.startsWith('https://'), 'INVALID_SOURCE_URL', `${location} does not use a direct HTTPS URL.`);
    assertResearch(entry.source.copyright_safe_paraphrase.length >= 80, 'INVALID_SOURCE_SUMMARY', `${location} lacks a useful copyright-safe paraphrase.`);
    assertResearch(Object.values(entry.source.eligibility).every((value) => value === true), 'SOURCE_NOT_QUALIFYING', `${location} fails at least one source eligibility predicate.`);
    const score = entry.source.selection_rubric;
    exact(score.total, sum(['observe', 'hypothesis', 'test', 'isolate', 'repair', 'verify', 'document'].map((key) => score[key])), `${location} selection score`);
    const categories = entry.lifecycle_steps.map((step) => step.category);
    assertResearch(categories.every((category) => LIFECYCLE.includes(category)), 'LIFECYCLE_DRIFT', `${location} uses an unsupported lifecycle category.`);
    assertResearch(unique(categories), 'LIFECYCLE_DRIFT', `${location} repeats a lifecycle category.`);
    assertResearch(same(categories, LIFECYCLE.filter((category) => categories.includes(category))), 'LIFECYCLE_DRIFT', `${location} lifecycle categories are out of order.`);
    assertResearch(LIFECYCLE.slice(0, 6).every((category) => categories.includes(category)), 'INCOMPLETE_LIFECYCLE_PATH', `${location} lacks an Observe-through-Verify stage.`);
    assertResearch(same(entry.lifecycle_steps.map((step) => step.ordinal), entry.lifecycle_steps.map((_, index) => index + 1)), 'LIFECYCLE_DRIFT', `${location} lifecycle ordinals changed.`);
    assertResearch(unique(entry.lifecycle_steps.map((step) => step.step_id)), 'DUPLICATE_STEP_ID', `${location} repeats a lifecycle step ID.`);
    const absentCategories = LIFECYCLE.filter((category) => !categories.includes(category));
    assertResearch(same(entry.absent_lifecycle_categories, absentCategories), 'LIFECYCLE_DRIFT', `${location} absent lifecycle categories are stale.`);
    const hasDocument = categories.includes('Document');
    exact(score.observe, 1, `${location} Observe score`);
    exact(score.hypothesis, 2, `${location} Hypothesize score`);
    exact(score.test, 2, `${location} Test score`);
    exact(score.isolate, 2, `${location} Isolate score`);
    exact(score.repair, 1, `${location} Repair score`);
    exact(score.verify, 1, `${location} Verify score`);
    exact(score.document, hasDocument ? 1 : 0, `${location} Document score`);
    exact(score.total, hasDocument ? 10 : 9, `${location} qualifying selection score`);
    for (const step of entry.lifecycle_steps) {
      exact(step.step_id, `${entry.case_id}.step.${step.category.toLowerCase()}`, `${location} ${step.category} step ID`);
      assertResearch(FIDELITIES.has(step.fidelity), 'INVALID_FIDELITY', `${step.step_id} uses ${step.fidelity}.`);
      assertResearch(step.paraphrase.length > 20 && step.locator.length > 5, 'INCOMPLETE_LIFECYCLE_STEP', `${step.step_id} lacks a paraphrase or locator.`);
      for (const reference of step.stable_refs) validateStableRef(reference, entityById, step.step_id);
    }
    for (const discussed of entry.source.discussed_not_executed ?? []) validateStableRef(discussed.stable_ref, entityById, `${location} discussed_not_executed`);

    for (const [field, entityType] of Object.entries(SUPPORT_TYPES)) {
      const ids = entry.stable_support[field];
      assertResearch(Array.isArray(ids) && unique(ids), 'INVALID_STABLE_SUPPORT', `${location}.${field} must contain unique IDs.`);
      for (const id of ids) {
        const entity = entityById.get(id);
        assertResearch(entity, 'STALE_STABLE_ID', `${location}.${field} references missing ${id}.`);
        exact(entity.entity_type, entityType, `${location}.${field} type for ${id}`);
      }
    }
    assertResearch(entry.stable_support.symptom_ids.length > 0
      && entry.stable_support.fault_ids.length > 0
      && entry.stable_support.test_ids.length > 0
      && entry.stable_support.repair_ids.length > 0
      && entry.stable_support.validation_ids.length > 0,
    'INCOMPLETE_LIFECYCLE_PATH', `${location} lacks current stable support for the complete playable-path families.`);

    for (const id of entry.commands.catalog_exposure_ids_considered) assertResearch(globalCommands.includes(id), 'COMMAND_AUDIT_DRIFT', `${location} considers non-catalog Command ${id}.`);
    for (const id of entry.commands.useful_evidence_current_ids) assertResearch(globalCommands.includes(id), 'COMMAND_AUDIT_DRIFT', `${location} cites non-catalog useful Command ${id}.`);
    assertResearch(same(entry.commands.useful_evidence_current_ids, []), 'COMMAND_AUTHORITY_OVERREACH', `${location} may not authorize a useful current Command before gameplay integration.`);
    assertResearch(same(entry.commands.required_isolation_current_ids, []), 'COMMAND_AUTHORITY_OVERREACH', `${location} may not require a current Command under current semantics.`);
    assertResearch(entry.candidate_dependencies.includes(entry.fingerprint_candidate_key), 'MISSING_FINGERPRINT_DEPENDENCY', `${location} omits its fingerprint candidate dependency.`);
  }

  exact(registry.evidence_slots.length, 6, 'Evidence slot count');
  assertResearch(same(registry.evidence_slots.map((entry) => entry.slot_id), EXPECTED_SLOT_IDS), 'SLOT_SET_DRIFT', 'Evidence slot IDs or ordering changed.');
  const caseById = new Map(registry.selected_cases.map((entry) => [entry.case_id, entry]));
  for (const slot of registry.evidence_slots) {
    const entry = caseById.get(slot.case_id);
    assertResearch(entry, 'UNRESOLVED_SLOT', `${slot.slot_id} references missing ${slot.case_id}.`);
    exact(slot.slot_id, entry.slot_id, `${slot.case_id} slot identity`);
    exact(slot.learning_objective_key, entry.learning_objective_key, `${slot.case_id} objective identity`);
    exact(slot.fingerprint_candidate_key, entry.fingerprint_candidate_key, `${slot.case_id} fingerprint candidate identity`);
    exact(slot.case_evidence, 'QUALIFYING_COMPLETE_REDUCTION', `${slot.case_id} evidence status`);
    exact(slot.existing_complete_playable_arc, false, `${slot.case_id} existing arc status`);
    assertResearch(slot.candidate_addition_keys.includes(entry.fingerprint_candidate_key), 'UNRESOLVED_SLOT', `${slot.slot_id} omits its fingerprint dependency.`);
    assertResearch(same(slot.required_current_command_ids, []), 'COMMAND_AUTHORITY_OVERREACH', `${slot.slot_id} requires a current Command.`);
  }

  return {
    registry_version: registry.registry_version,
    qualifying_cases: registry.selected_cases.length,
    evidence_slots: registry.evidence_slots.length,
    existing_complete_arcs: q.validated_distinct_existing_complete_arc_count,
    final_q: q.final_q,
    required_current_commands: registry.command_audit.required_isolation_current_command_count,
  };
}

const code = (value) => `\`${value}\``;
const codeList = (values) => values.length ? values.map(code).join(', ') : 'None';

export function renderQCalculation(registry) {
  const q = registry.q_calculation;
  const rows = registry.evidence_slots.map((slot) => {
    const entry = registry.selected_cases.find((candidate) => candidate.case_id === slot.case_id);
    return `| ${slot.slot_id} | ${entry.case_id} | ${entry.subsystem} | ${code(entry.learning_objective_key)} | ${code(entry.fingerprint_candidate_key)} | Case-backed; candidate path required |`;
  }).join('\n');
  return `# Q calculation — Story expansion v0.2\n\nStatus: **research calculation only; no source, domain object, fingerprint, Ticket, gameplay path, or episode is approved by this report**\n\n## Pinned inputs\n\n- TASK-039 audit: ${code(registry.pins.task_039_audit_version)}\n- TASK-039 JSON SHA-256: ${code(registry.pins.task_039_json_sha256)}\n- Domain: ${code(registry.pins.domain_content_version)}\n- Playable coverage: ${code(registry.pins.playable_coverage_version)}\n- Ruleset: ${code(registry.pins.ruleset_version)}\n\n## Existing-arc result\n\nTASK-039 contains zero uncovered existing arcs that already combine a complete fingerprint, distinct required diagnostic work, Isolation, Repair, Verify, and closure witness. Its 16 Candidate-changing/non-minimal, 13 target-legal/Candidate-neutral, and 7 not-target-legal Bench diagnostics are opportunities, not complete episodes. Therefore ${code('R = 0')}.\n\n## Arithmetic\n\n\`\`\`text\nN  = ${q.target_episode_slots}\nR  = ${q.validated_distinct_existing_complete_arc_count}\nQ0 = max(0, N - R) = ${q.q0}\nadjustments = ${q.adjustments.length}\nQ  = Q0 + sum(adjustment.increment) = ${q.final_q}\n\`\`\`\n\nNo adjustment applies: ${q.no_adjustment_reason}\n\n## Six missing slots\n\n| Slot | Qualifying case | Subsystem | Distinct objective | Fingerprint candidate | Current status |\n| --- | --- | --- | --- | --- | --- |\n${rows}\n\nExactly six qualifying primary cases are selected for six missing slots. A case remains research evidence until the later domain, authority, Builder, and Story gates pass.\n\n## Commands\n\nThe pinned catalog exposes ${registry.command_audit.catalog_exposure_count} Commands. This research registry authorizes ${registry.command_audit.source_supported_useful_current_command_ids.length} as useful current-Ticket Evidence and requires ${registry.command_audit.required_isolation_current_command_count} for Isolation. Source utilities and transports are recorded without changing their type or current Command semantics.\n`;
}

export function renderSixSlotEvidenceMatrix(registry) {
  const rows = registry.evidence_slots.map((slot) => {
    const entry = registry.selected_cases.find((candidate) => candidate.case_id === slot.case_id);
    return `| ${slot.slot_id} | ${entry.case_id} | ${entry.subsystem} | ${codeList(entry.stable_support.symptom_ids)} | ${codeList(entry.stable_support.fault_ids)} | ${codeList(entry.stable_support.test_ids)} | ${codeList(entry.stable_support.repair_ids)} | ${codeList(entry.stable_support.validation_ids)} | ${slot.current_support} | ${entry.commands.useful_evidence_current_ids.length} / ${entry.commands.required_isolation_current_ids.length} |`;
  }).join('\n');
  const reductions = registry.selected_cases.map((entry) => {
    const steps = entry.lifecycle_steps.map((step) =>
      `${step.ordinal}. **${step.category}** (${step.fidelity}) — ${step.paraphrase} Locator: ${step.locator}.`).join('\n');
    const interfaces = entry.commands.encountered_source_interfaces.length
      ? entry.commands.encountered_source_interfaces.map((item) => `- ${item.phrase} — ${item.classification}: ${item.diagnostic_contribution}`).join('\n')
      : '- None recorded.';
    return `## ${entry.slot_id} — ${entry.case_id}\n\n- Source: [${entry.source.title}](${entry.source.url}) (opened ${entry.source.access_date})\n- Objective: ${code(entry.learning_objective_key)}\n- Fingerprint candidate: ${code(entry.fingerprint_candidate_key)}\n- Selection score: ${entry.source.selection_rubric.total}/10\n- Lifecycle absent from source: ${entry.absent_lifecycle_categories.join(', ') || 'None'}\n- Current stable Components: ${codeList(entry.stable_support.component_ids)}\n- Current stable Tools: ${codeList(entry.stable_support.tool_ids)}\n- Current stable Protocols: ${codeList(entry.stable_support.protocol_ids)}\n- Candidate dependencies: ${codeList(entry.candidate_dependencies)}\n\n${steps}\n\nCommand/interface observations:\n\n${interfaces}\n\nCurrent Commands considered for catalog exposure: ${codeList(entry.commands.catalog_exposure_ids_considered)}. Useful current Commands authorized by this research: ${codeList(entry.commands.useful_evidence_current_ids)}. Required current Commands: ${codeList(entry.commands.required_isolation_current_ids)}.`;
  }).join('\n\n');
  return `# Six-slot evidence matrix\n\nThis generated matrix separates qualifying source evidence, current stable-object support, and candidate dependencies. “Present” is not “playable,” and research never creates a fingerprint, Ticket, Card, or rule.\n\n| Slot | Case | Subsystem | Observe/Symptom | Isolated Fault | Executed Test mappings | Repair | Verify | Support boundary | Useful / required current Commands |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- | ---: |\n${rows}\n\nAll six reductions contain ordered Observe, Hypothesize, Test, Isolate, Repair, and Verify steps. Document is absent for exp-001 through exp-005 and present only for exp-006, whose source is an intentional recovery guide. Fidelity, source locators, and absent stages remain visible below.\n\n${reductions}\n`;
}

export function renderResearchCompletion(registry, summary, registryDigest) {
  const sources = registry.selected_cases.map((entry) =>
    `- ${entry.case_id}: [${entry.source.title}](${entry.source.url}) — ${entry.learning_objective_key}`).join('\n');
  return `# TASK-041 machine-checkable research completion\n\nStatus: **the six-case research gate core is reproducible; downstream domain, gameplay, Story, and release gates remain unapproved**\n\n## Result\n\n- Registry: ${code(registry.registry_version)}\n- Registry SHA-256: ${code(registryDigest)}\n- Qualifying selected cases: ${summary.qualifying_cases}\n- Evidence slots: ${summary.evidence_slots}\n- Existing uncovered complete playable arcs: ${summary.existing_complete_arcs}\n- Final Q: ${summary.final_q}\n- Q adjustments: 0\n- Required current Command actions: ${summary.required_current_commands}\n- Access date for every selected source: ${registry.access_date}\n\n## Selected primary sources\n\n${sources}\n\n## Machine-enforced boundaries\n\n- Exact case IDs ${code('exp-001')} through ${code('exp-006')}, source URLs, slots, objective keys, and fingerprint candidate keys are unique and pinned.\n- Every selected source passes all recorded eligibility predicates and has an ordered Observe-through-Verify reduction; Document presence or absence is explicit and affects its selection score.\n- Every current stable reference resolves with the recorded entity type against ${code(registry.pins.domain_content_version)}.\n- Q recomputes as ${code('max(0, 6 - 0) + 0 = 6')}.\n- Command catalog exposure, useful Evidence, and required Isolation remain separate; source utilities are not silently promoted.\n- Candidate keys are research handles only. No stable ID, Card, fingerprint, Ticket, Story node, or rule is created here.\n\n## Remaining downstream work\n\nCross-reference/deduplication, authority pressure, domain integration, Builder solvability, six-episode graphing, writing, art, migration, and release remain governed by the later gates in the Story expansion protocol.\n`;
}

export async function loadStoryExpansionResearchInputs() {
  const [registryRaw, coverageRaw, domainRaw] = await Promise.all([
    fs.readFile(REGISTRY_PATH, 'utf8'),
    fs.readFile(COVERAGE_PATH, 'utf8'),
    fs.readFile(DOMAIN_PATH, 'utf8'),
  ]);
  return {
    registryRaw,
    registry: JSON.parse(registryRaw),
    coverageRaw,
    coverage: JSON.parse(coverageRaw),
    domain: JSON.parse(domainRaw),
  };
}

export async function generateStoryExpansionResearch({ check = false } = {}) {
  const inputs = await loadStoryExpansionResearchInputs();
  const summary = validateStoryExpansionResearchRegistry(inputs.registry, inputs);
  const registryDigest = sha256(inputs.registryRaw);
  const artifacts = new Map([
    [STORY_EXPANSION_RESEARCH_OUTPUTS.q, renderQCalculation(inputs.registry)],
    [STORY_EXPANSION_RESEARCH_OUTPUTS.matrix, renderSixSlotEvidenceMatrix(inputs.registry)],
    [STORY_EXPANSION_RESEARCH_OUTPUTS.completion, renderResearchCompletion(inputs.registry, summary, registryDigest)],
  ]);

  if (check) {
    const stale = [];
    for (const [filePath, expected] of artifacts) {
      let actual = null;
      try {
        actual = await fs.readFile(filePath, 'utf8');
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
      if (actual !== expected) stale.push(path.relative(ROOT, filePath).replaceAll('\\', '/'));
    }
    if (stale.length) fail('STALE_RESEARCH_OUTPUT', `Regenerate ${stale.join(', ')}.`);
  } else {
    await fs.mkdir(RESEARCH_ROOT, { recursive: true });
    await Promise.all([...artifacts].map(([filePath, contents]) => fs.writeFile(filePath, contents, 'utf8')));
  }

  return {
    ...summary,
    check,
    outputs: [...artifacts.keys()].map((filePath) => path.relative(ROOT, filePath).replaceAll('\\', '/')),
  };
}

const isEntryPoint = process.argv[1]
  && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isEntryPoint) {
  try {
    console.log(stableResearchJson(await generateStoryExpansionResearch({ check: process.argv.includes('--check') })).trimEnd());
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
