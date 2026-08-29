import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';

import {
  STORY_EXPANSION_RESEARCH_OUTPUTS,
  generateStoryExpansionResearch,
  loadStoryExpansionResearchInputs,
  renderQCalculation,
  renderResearchCompletion,
  renderSixSlotEvidenceMatrix,
  validateStoryExpansionResearchRegistry,
} from '../src/case-studies/generate-story-expansion-research.mjs';

const EXPECTED_CASE_IDS = ['exp-001', 'exp-002', 'exp-003', 'exp-004', 'exp-005', 'exp-006'];
const LIFECYCLE = ['Observe', 'Hypothesize', 'Test', 'Isolate', 'Repair', 'Verify', 'Document'];

let inputs;
let summary;

test.before(async () => {
  inputs = await loadStoryExpansionResearchInputs();
  summary = validateStoryExpansionResearchRegistry(inputs.registry, inputs);
});

test('pins six qualifying sources, six unique objectives, and six fingerprint candidates', () => {
  const cases = inputs.registry.selected_cases;
  assert.deepEqual(cases.map((entry) => entry.case_id), EXPECTED_CASE_IDS);
  assert.equal(cases.length, 6);
  assert.equal(new Set(cases.map((entry) => entry.source.url)).size, 6);
  assert.equal(new Set(cases.map((entry) => entry.learning_objective_key)).size, 6);
  assert.equal(new Set(cases.map((entry) => entry.fingerprint_candidate_key)).size, 6);
  assert.ok(cases.every((entry) => entry.source.directly_opened && entry.source.access_date === '2026-08-28'));
  assert.ok(cases.every((entry) => Object.values(entry.source.eligibility).every(Boolean)));
  assert.deepEqual(summary, {
    registry_version: 'story-expansion-research-registry-v1',
    qualifying_cases: 6,
    evidence_slots: 6,
    existing_complete_arcs: 0,
    final_q: 6,
    required_current_commands: 0,
  });
});

test('recomputes Q=6 from zero complete existing arcs and zero adjustments', () => {
  const q = inputs.registry.q_calculation;
  assert.equal(q.target_episode_slots, 6);
  assert.equal(q.validated_distinct_existing_complete_arc_count, 0);
  assert.deepEqual(q.validated_existing_arc_ids, []);
  assert.equal(q.q0, 6);
  assert.deepEqual(q.adjustments, []);
  assert.equal(q.final_q, 6);
  assert.ok(inputs.registry.evidence_slots.every((slot) => slot.existing_complete_playable_arc === false));
  assert.ok(inputs.registry.evidence_slots.every((slot) => slot.case_evidence === 'QUALIFYING_COMPLETE_REDUCTION'));
});

test('preserves Observe-through-Verify and records Document only where sourced', () => {
  for (const entry of inputs.registry.selected_cases) {
    const expected = entry.case_id === 'exp-006' ? LIFECYCLE : LIFECYCLE.slice(0, 6);
    assert.deepEqual(entry.lifecycle_steps.map((step) => step.category), expected);
    assert.deepEqual(entry.lifecycle_steps.map((step) => step.ordinal), expected.map((_, index) => index + 1));
    assert.deepEqual(entry.absent_lifecycle_categories, entry.case_id === 'exp-006' ? [] : ['Document']);
    assert.equal(entry.source.selection_rubric.document, entry.case_id === 'exp-006' ? 1 : 0);
    assert.equal(entry.source.selection_rubric.total, entry.case_id === 'exp-006' ? 10 : 9);
    assert.ok(entry.lifecycle_steps.every((step) => ['explicit', 'inferred'].includes(step.fidelity)));
    assert.ok(entry.lifecycle_steps.every((step) => step.locator.length > 5));
  }
});

test('separates Command exposure, utility contribution, and required Isolation', () => {
  const audit = inputs.registry.command_audit;
  assert.equal(audit.catalog_exposure_count, 13);
  assert.equal(audit.catalog_exposure_ids.length, 13);
  assert.deepEqual(audit.source_supported_useful_current_command_ids, []);
  assert.deepEqual(audit.required_isolation_current_command_ids, []);
  assert.equal(audit.required_isolation_current_command_count, 0);
  assert.ok(inputs.registry.selected_cases.every((entry) => entry.commands.useful_evidence_current_ids.length === 0));
  assert.ok(inputs.registry.selected_cases.every((entry) => entry.commands.required_isolation_current_ids.length === 0));
  assert.ok(inputs.registry.selected_cases.find((entry) => entry.case_id === 'exp-004')
    .commands.encountered_source_interfaces.some((item) => item.phrase === 'Dell DSET'));
  assert.ok(inputs.registry.selected_cases.find((entry) => entry.case_id === 'exp-006')
    .commands.encountered_source_interfaces.some((item) => item.phrase === 'TFTP transfer invocation'));
});

test('keeps discussed voltage measurement out of exp-002 executed evidence', () => {
  const power = inputs.registry.selected_cases.find((entry) => entry.case_id === 'exp-002');
  assert.deepEqual(power.stable_support.test_ids, [
    'test.general.minimum_configuration',
    'test.power.distribution_path_isolation',
    'test.power.known_good_psu',
  ]);
  assert.deepEqual(power.stable_support.tool_ids, []);
  assert.ok(!power.lifecycle_steps.flatMap((step) => step.stable_refs.map((ref) => ref.id))
    .includes('test.power.output_voltage_measurement'));
  assert.ok(power.source.discussed_not_executed.some((item) => item.stable_ref.id === 'test.power.output_voltage_measurement'));
  assert.ok(power.source.discussed_not_executed.some((item) => item.stable_ref.id === 'tool.electrical.multimeter'));
});

test('rejects stale IDs, duplicate objectives, source drift, Q drift, and Command overreach', () => {
  const stale = structuredClone(inputs.registry);
  stale.selected_cases[0].stable_support.symptom_ids[0] = 'symptom.missing';
  assert.throws(() => validateStoryExpansionResearchRegistry(stale, inputs), /STALE_STABLE_ID/);

  const duplicate = structuredClone(inputs.registry);
  duplicate.selected_cases[1].learning_objective_key = duplicate.selected_cases[0].learning_objective_key;
  assert.throws(() => validateStoryExpansionResearchRegistry(duplicate, inputs), /DUPLICATE_OBJECTIVE/);

  const sourceDrift = structuredClone(inputs.registry);
  sourceDrift.selected_cases[0].source.url = 'https://example.invalid/changed';
  assert.throws(() => validateStoryExpansionResearchRegistry(sourceDrift, inputs), /SOURCE_SET_DRIFT/);

  const qDrift = structuredClone(inputs.registry);
  qDrift.q_calculation.final_q = 5;
  assert.throws(() => validateStoryExpansionResearchRegistry(qDrift, inputs), /Q_ARITHMETIC|PIN_MISMATCH/);

  const commandOverreach = structuredClone(inputs.registry);
  commandOverreach.selected_cases[5].commands.required_isolation_current_ids = ['command.ipmi.sel_elist'];
  assert.throws(() => validateStoryExpansionResearchRegistry(commandOverreach, inputs), /COMMAND_AUTHORITY_OVERREACH/);
});

test('keeps generated Q, matrix, and completion reports byte-stable', async () => {
  const registryDigest = (await import('node:crypto')).createHash('sha256').update(inputs.registryRaw).digest('hex');
  assert.equal(await fs.readFile(STORY_EXPANSION_RESEARCH_OUTPUTS.q, 'utf8'), renderQCalculation(inputs.registry));
  assert.equal(await fs.readFile(STORY_EXPANSION_RESEARCH_OUTPUTS.matrix, 'utf8'), renderSixSlotEvidenceMatrix(inputs.registry));
  assert.equal(await fs.readFile(STORY_EXPANSION_RESEARCH_OUTPUTS.completion, 'utf8'), renderResearchCompletion(inputs.registry, summary, registryDigest));
  const check = await generateStoryExpansionResearch({ check: true });
  assert.equal(check.final_q, 6);
  assert.equal(check.outputs.length, 3);
});
