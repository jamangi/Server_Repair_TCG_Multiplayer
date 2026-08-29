import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const ROOT = path.resolve(import.meta.dirname, '..');
const REVISION_ROOT = path.join(ROOT, 'docs/story/revisions/quiet-cascade-expansion-v3');
const CANDIDATE_ROOT = path.join(ROOT, 'content/story-v1/candidates/quiet-cascade-expansion-v3');
const CASE_ROOT = path.join(ROOT, 'docs/case_studies/v0.2-story-expansion/cases');
const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));

const payload = readJson(path.join(REVISION_ROOT, 'CONTEXT_PAYLOAD_LEDGER.json'));
const trace = readJson(path.join(REVISION_ROOT, 'SOURCE_TO_LINE_TRACE.json'));
const choiceMap = fs.readFileSync(path.join(REVISION_ROOT, 'CHOICE_CONSEQUENCE_MAP.md'), 'utf8');
const continuity = fs.readFileSync(path.join(REVISION_ROOT, 'CONTINUITY_UPDATE.md'), 'utf8');
const traceMarkdown = fs.readFileSync(path.join(REVISION_ROOT, 'SOURCE_TO_LINE_TRACE.md'), 'utf8');
const blueprint = readJson(path.join(REVISION_ROOT, 'blueprint.json'));
const graphReport = readJson(path.join(REVISION_ROOT, 'GRAPH_REPORT.json'));
const manifest = readJson(path.join(CANDIDATE_ROOT, 'manifest.json'));
const metadata = readJson(path.join(CANDIDATE_ROOT, 'authored-metadata.json'));
const texts = readJson(path.join(CANDIDATE_ROOT, manifest.text_catalogs.en));
const scripts = manifest.scripts.map((relativePath) => readJson(path.join(CANDIDATE_ROOT, relativePath)));
const research = readJson(path.join(ROOT, 'docs/case_studies/v0.2-story-expansion/registry.json'));
const domainProof = readJson(path.join(ROOT, 'docs/coverage/task-042-expansion-domain-network-proof.json'));

function sourceEventsFor(caseId) {
  const filename = fs.readdirSync(CASE_ROOT).find((name) => name.startsWith(`${caseId}--`) && name.endsWith('.md'));
  assert.ok(filename, `missing detailed case reduction for ${caseId}`);
  const rows = fs.readFileSync(path.join(CASE_ROOT, filename), 'utf8').split(/\r?\n/u)
    .filter((line) => /^\|\s*\d+\s*\|/u.test(line))
    .map((line) => {
      const cells = line.split('|').slice(1, -1).map((cell) => cell.trim());
      assert.equal(cells.length, 7, `${caseId} source-event column count`);
      const [number, category, paraphrase, lifecycleContribution, fidelity, locator, stableObjectCrossReference] = cells;
      return {
        category,
        event_number: Number(number),
        fidelity,
        lifecycle_contribution: lifecycleContribution,
        locator,
        paraphrase,
        stable_object_cross_reference: stableObjectCrossReference,
      };
    });
  return new Map(rows.map((row) => [row.event_number, row]));
}

function statementIndexByTextId() {
  const result = new Map();
  for (const script of scripts) {
    script.statements.forEach((statement, statementIndex) => {
      if (statement.type === 'say' || statement.type === 'narrate') result.set(statement.text_id, statementIndex);
      if (statement.type === 'choice') {
        result.set(statement.prompt_text_id, statementIndex);
        for (const option of statement.options) result.set(option.text_id, statementIndex);
      }
    });
  }
  return result;
}

test('review-ledger generator is byte-stable in --check mode', () => {
  const result = spawnSync(process.execPath, ['src/story/generate-task-044-review-ledgers.mjs', '--check'], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.deepEqual(JSON.parse(result.stdout), {
    check: true,
    displayed_surfaces: 76,
    technical_claims: 30,
    sourced_cases: 6,
    source_events_cited: 66,
    choices: 2,
    episodes: 6,
    routes: 256,
    unresolved: 0,
  });
});

test('context payload ledger reconciles every display surface with bounded copy and authority', () => {
  assert.equal(payload.campaign_id, 'story.campaign.quiet_cascade.v1');
  assert.equal(payload.candidate_content_version, 'quiet-cascade-expansion-v3');
  assert.deepEqual(payload.totals, {
    choice_options: 4,
    choice_prompts: 2,
    displayed_surfaces: 76,
    episodes: 6,
    hidden_truth_disclosures: 0,
    lines_over_mobile_bound: 0,
    narrate_surfaces: 6,
    routes: 256,
    say_surfaces: 64,
    technical_claims: 30,
    unresolved_context_requirements: 0,
  });
  assert.equal(payload.line_payloads.length, metadata.displays.length);
  assert.deepEqual(
    payload.line_payloads.map((line) => line.text_id).sort(),
    metadata.displays.map((display) => display.text_id).sort(),
  );
  assert.equal(new Set(payload.line_payloads.map((line) => line.payload_id)).size, 76);
  assert.ok(payload.line_payloads.every((line) => line.text === texts.entries[line.text_id]));
  assert.ok(payload.line_payloads.every((line) => line.text.length <= 420 && !line.text.includes('\n')));
  assert.ok(payload.line_payloads.every((line) => line.localization_and_density.no_fragment_splicing));
  assert.ok(payload.line_payloads.every((line) => line.voice_flexibility.must_preserve.includes('gameplay authority')));
  assert.ok(payload.line_payloads.every((line) => line.route_coverage.route_count > 0
    && /^[a-f0-9]{64}$/u.test(line.route_coverage.route_id_digest)));

  const technical = payload.line_payloads.filter((line) => line.technical_claim);
  assert.equal(technical.length, 30);
  assert.ok(technical.every((line) => ['CONTEXT', 'FOLLOW_ON'].includes(line.phase)
    && line.authority_bounds.length === 1
    && line.authority_bounds[0] === 'PUBLIC_CONTEXT_ONLY'
    && /^exp-00[1-6]$/u.test(line.source_case_id)
    && line.source_event_numbers.length > 0));
  for (const line of technical) {
    const episodeIndex = blueprint.episodes.findIndex((episode) => episode.episode_id === line.episode_id);
    const expectedCase = line.phase === 'FOLLOW_ON'
      ? blueprint.episodes[episodeIndex + 1]?.case_id
      : blueprint.episodes[episodeIndex].case_id;
    assert.equal(line.source_case_id, expectedCase, line.text_id);
  }
  assert.ok(payload.line_payloads.filter((line) => !line.technical_claim)
    .every((line) => line.source_case_id === null && line.source_event_numbers.length === 0));
  const outcomeLines = payload.line_payloads.filter((line) => line.phase === 'OUTCOME');
  assert.equal(outcomeLines.length, 24);
  assert.ok(outcomeLines.every((line) => line.authority_bounds[0] === 'NORMALIZED_MATCH_RESULT_ONLY'
      && ['COMPLETED', 'ABANDONED'].includes(line.outcome_scope)
      && line.route_coverage.route_count === 128
      && JSON.stringify(line.normalized_result_fields) === JSON.stringify(['completion'])
      && line.normalized_result_expectations.completion === line.outcome_scope
      && line.private_match_details_claimed === false
      && /No private Match Evidence, diagnosis, action sequence, or technical outcome is asserted\.$/u
        .test(line.immutable_semantic_payload)));
  assert.equal(new Set(outcomeLines.map((line) => line.public_process_principle_id)).size, 24);
  assert.ok(payload.line_payloads.filter((line) => line.phase !== 'OUTCOME')
    .every((line) => line.normalized_result_fields.length === 0
      && line.normalized_result_expectations === null
      && line.public_process_principle_id === null
      && line.private_match_details_claimed === null));
  assert.ok(payload.line_payloads.filter((line) => line.surface_kind === 'CHOICE_OPTION')
    .every((line) => line.route_selector.kind === 'ALL_ROUTES' && line.route_coverage.route_count === 256));

  const playerCopy = payload.line_payloads.map((line) => line.text).join('\n');
  assert.doesNotMatch(playerCopy, /(?:fault|fingerprint|test|repair|verify)\.[a-z0-9._-]+/iu);
  for (const episode of blueprint.episodes) {
    for (const hiddenId of episode.public_setup.forbidden_early_reveal_ids) {
      assert.equal(playerCopy.includes(hiddenId), false, hiddenId);
    }
  }
});

test('all six episodes establish environment, procedure, and pain before or with first insight', () => {
  assert.equal(payload.episode_context_proofs.length, 6);
  const indexByText = statementIndexByTextId();
  const payloadByText = new Map(payload.line_payloads.map((line) => [line.text_id, line]));
  for (const proof of payload.episode_context_proofs) {
    assert.ok(proof.environment_text_ids.length > 0, `${proof.episode_id} environment`);
    assert.ok(proof.procedure_text_ids.length > 0, `${proof.episode_id} procedure`);
    assert.ok(proof.pain_point_text_ids.length > 0, `${proof.episode_id} pain point`);
    assert.ok(proof.insight_text_ids.length > 0, `${proof.episode_id} insight`);
    const earliest = (ids) => Math.min(...ids.map((textId) => indexByText.get(textId)));
    const independentlyCompleteAt = Math.max(
      earliest(proof.environment_text_ids),
      earliest(proof.procedure_text_ids),
      earliest(proof.pain_point_text_ids),
    );
    const independentlyFirstInsight = earliest(proof.insight_text_ids);
    assert.equal(proof.first_context_complete_statement_index, independentlyCompleteAt);
    assert.equal(proof.first_insight_statement_index, independentlyFirstInsight);
    assert.ok(independentlyCompleteAt <= independentlyFirstInsight, proof.episode_id);
    assert.ok([
      ...proof.environment_text_ids,
      ...proof.procedure_text_ids,
      ...proof.pain_point_text_ids,
      ...proof.insight_text_ids,
    ].every((textId) => payloadByText.get(textId)?.episode_id === proof.episode_id));
  }
});

test('every technical line resolves to detailed source events and reviewed TASK-042 domain bounds', () => {
  assert.deepEqual(trace.totals, {
    hidden_truth_disclosures: 0,
    sourced_cases: 6,
    source_events_cited: 66,
    traced_technical_lines: 30,
    unsupported_claims: 0,
    untraced_technical_lines: 0,
  });
  const payloadByText = new Map(payload.line_payloads.map((line) => [line.text_id, line]));
  const caseById = new Map(research.selected_cases.map((record) => [record.case_id, record]));
  const proofByCase = new Map(domainProof.tickets.map((record) => [record.case_id, record]));
  const episodeById = new Map(blueprint.episodes.map((episode) => [episode.episode_id, episode]));
  const sourceEvents = new Map(research.selected_cases.map((record) => [record.case_id, sourceEventsFor(record.case_id)]));
  assert.deepEqual(
    trace.traces.map((entry) => entry.text_id).sort(),
    payload.line_payloads.filter((line) => line.technical_claim).map((line) => line.text_id).sort(),
  );

  for (const entry of trace.traces) {
    const line = payloadByText.get(entry.text_id);
    const caseRecord = caseById.get(entry.research_source.case_id);
    const episode = episodeById.get(entry.episode_id);
    const technicalSubjectEpisode = episodeById.get(entry.technical_subject_episode_id);
    const reviewed = proofByCase.get(entry.research_source.case_id);
    assert.equal(entry.player_facing_text, line.text);
    assert.equal(entry.bounded_claim, line.immutable_semantic_payload);
    assert.equal(entry.research_source.url, caseRecord.source.url);
    assert.equal(entry.research_source.accessed_on, caseRecord.source.access_date);
    assert.equal(entry.research_source.case_id, technicalSubjectEpisode.case_id);
    assert.equal(entry.phase === 'CONTEXT', entry.episode_id === entry.technical_subject_episode_id);
    if (entry.phase === 'FOLLOW_ON') {
      assert.equal(blueprint.episodes.indexOf(technicalSubjectEpisode), blueprint.episodes.indexOf(episode) + 1);
    }
    assert.ok(entry.research_source.source_events.length > 0);
    for (const sourceEvent of entry.research_source.source_events) {
      assert.deepEqual(sourceEvent, sourceEvents.get(technicalSubjectEpisode.case_id).get(sourceEvent.event_number));
    }
    assert.deepEqual(entry.reviewed_domain_contract.fingerprint_id, reviewed.fingerprint_id);
    assert.deepEqual(entry.reviewed_domain_contract.public_candidate_fault_ids, reviewed.public_candidate_fault_ids);
    assert.deepEqual(entry.reviewed_domain_contract.symptom_ids, reviewed.symptom_ids);
    assert.deepEqual(entry.reviewed_domain_contract.repair_procedure_ids, reviewed.repair_procedure_ids);
    assert.deepEqual(entry.reviewed_domain_contract.validation_procedure_ids, reviewed.validation_procedure_ids);
    assert.ok(entry.forbidden_overreach.some((bound) => /cannot manufacture Evidence/iu.test(bound)));
  }

  assert.match(traceMarkdown, /author-only ledger deliberately names reviewed hidden domain IDs/iu);
  assert.equal((traceMarkdown.match(/^\| `text\.qc02\./gmu) ?? []).length, 30);
});

test('N4 and N6 keep read-only Test separate from state-changing Repair', () => {
  assert.deepEqual(payload.boundary_proofs.shift_10, {
    repair_id: 'repair.management.clear_stale_alert_state',
    rule: 'Preserve and compare current evidence without clearing; clear stale state only as the later state-changing Repair.',
    source_limitation: 'The qualifying source combined probe and clear, so the clean separation comes from the reviewed TASK-042 domain contract, not a rewritten source event.',
    test_id: 'test.management.event_log_freshness',
  });
  assert.deepEqual(payload.boundary_proofs.shift_12, {
    repair_id: 'repair.management.recover_bmc_firmware',
    rule: 'Inspect recovery state without changing it; image transfer/write is Repair and independent controller-function checks are Verify.',
    test_id: 'test.management.bmc_recovery_state',
    tftp_role: 'REPAIR_TRANSPORT_NOT_DIAGNOSTIC_COMMAND',
  });
  assert.equal(domainProof.n4_test_repair_boundary.diagnostic_changes_machine_state, false);
  assert.equal(domainProof.n4_test_repair_boundary.test_id, payload.boundary_proofs.shift_10.test_id);
  assert.equal(domainProof.n4_test_repair_boundary.repair_id, payload.boundary_proofs.shift_10.repair_id);
  assert.equal(domainProof.n6_test_repair_boundary.tftp_is_diagnostic_command, false);
  assert.equal(domainProof.n6_test_repair_boundary.test_id, payload.boundary_proofs.shift_12.test_id);
  assert.equal(domainProof.n6_test_repair_boundary.repair_id, payload.boundary_proofs.shift_12.repair_id);
  const n4Copy = payload.line_payloads.filter((line) => line.episode_id === 'story.shift.qc02.10')
    .map((line) => `${line.immutable_semantic_payload} ${line.text}`).join(' ');
  const n6Copy = payload.line_payloads.filter((line) => line.episode_id === 'story.shift.qc02.12')
    .map((line) => `${line.immutable_semantic_payload} ${line.text}`).join(' ');
  assert.match(n4Copy, /preserv|read[- ]only|compare/iu);
  assert.match(n4Copy, /clear|state-changing/iu);
  assert.match(n6Copy, /recovery state|read[- ]only|inspect/iu);
  assert.match(n6Copy, /firmware (?:image )?write|write(?:s|ing)? (?:the )?(?:validated )?(?:firmware|image)|state-changing/iu);
});

test('choice and continuity records preserve reconvergence, exact points, and one current ending', () => {
  assert.equal(blueprint.remembered_choices.length, 2);
  assert.equal((choiceMap.match(/128 routes per option/gu) ?? []).length, 2);
  for (const choice of blueprint.remembered_choices) {
    for (const value of [
      choice.choice_id,
      choice.variable_id,
      choice.default,
      choice.reconverge_label,
      choice.delayed_ack_label,
      ...choice.options.flatMap((option) => [option.option_id, option.value, option.branch_label]),
    ]) assert.match(choiceMap, new RegExp(value.replaceAll('.', '\\.'), 'u'));
    const delayedScript = scripts.find((script) => script.chapter_id === choice.delayed_ack_episode_id);
    const delayedConditions = delayedScript.statements.filter((statement) => statement.type === 'if'
      && statement.condition?.op === 'VARIABLE_EQUALS'
      && statement.condition.variable_id === choice.variable_id);
    assert.equal(delayedConditions.length, 1, choice.choice_id);
    const condition = delayedConditions[0];
    const thenOption = choice.options.find((option) => option.value === condition.condition.value);
    assert.ok(thenOption, condition.condition.value);
    const elseOption = choice.options.find((option) => option.option_id !== thenOption.option_id);
    const targetByOption = new Map([
      [thenOption.option_id, condition.then_label],
      [elseOption.option_id, condition.else_label],
    ]);
    assert.equal(new Set(targetByOption.values()).size, 2);
    for (const option of choice.options) {
      const branchLabel = targetByOption.get(option.option_id);
      const branchIndex = delayedScript.statements.findIndex((statement) => statement.type === 'label'
        && statement.label_id === branchLabel);
      assert.ok(branchIndex >= 0, branchLabel);
      const transfer = delayedScript.statements.slice(branchIndex + 1)
        .find((statement) => ['if', 'jump', 'start_match', 'end', 'choice'].includes(statement.type));
      assert.deepEqual(transfer, { type: 'jump', label_id: choice.delayed_ack_label });
      const ackLines = payload.line_payloads.filter((line) => line.phase === 'DELAYED_CHOICE_ACK'
        && line.label_id === branchLabel);
      assert.equal(ackLines.length, 1, branchLabel);
      assert.deepEqual(ackLines[0].route_selector, {
        kind: 'VARIABLE_EQUALS',
        value: option.value,
        variable_id: choice.variable_id,
      });
      assert.equal(ackLines[0].route_coverage.route_count, 128);
      assert.match(choiceMap, new RegExp(branchLabel.replaceAll('.', '\\.'), 'u'));
      assert.match(choiceMap, new RegExp(ackLines[0].text_id.replaceAll('.', '\\.'), 'u'));
    }
  }
  assert.match(choiceMap, /presentation-only ordering decisions/iu);
  assert.match(choiceMap, /executes one `VARIABLE_EQUALS` read/iu);
  assert.match(choiceMap, /never change a Ticket, seed, hidden truth, required action, deck, Story Service Point gain, or ending/iu);
  assert.equal(payload.line_payloads.filter((line) => ['CHOICE', 'CHOICE_BRANCH', 'DELAYED_CHOICE_ACK'].includes(line.phase))
    .every((line) => line.authority_bounds[0] === 'PRESENTATION_ORDER_ONLY'), true);

  assert.equal(graphReport.totals.routes, 256);
  assert.equal(graphReport.totals.endings, 1);
  assert.ok(blueprint.episodes.every((episode) => episode.story_service_points.completed_valid_result === 2
    && episode.story_service_points.abandoned_valid_result === 0
    && episode.story_service_points.invalid_result === 0
    && episode.story_service_points.preserve_inherited_total
    && !episode.story_service_points.gate_on_total));
  assert.match(continuity, /inherited total is preserved and the expansion can add 0–12 points/iu);
  assert.match(continuity, /Invalid, stale, mismatched, or interrupted results do not advance/iu);
  assert.match(continuity, /fresh launch of the same reviewed configuration/iu);
  assert.match(continuity, /Return dialogue reads only the normalized `completion` field/u);
  assert.match(continuity, /may not infer a Fault, Evidence, diagnosis, action sequence, closure counter, Verify, Documentation, or point value/u);
  assert.match(continuity, /Minimal zero-counter results still support every return line/u);
  assert.match(continuity, /All 256 exhaustive routes reach the single `ending\.qc02\.current_content`/u);
  assert.match(continuity, /promises no later episode/iu);
  assert.equal((continuity.match(/^\| (?:7|8|9|10|11|12) \|/gmu) ?? []).length, 6);
});
