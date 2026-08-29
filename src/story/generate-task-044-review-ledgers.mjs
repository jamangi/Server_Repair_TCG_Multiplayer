import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../..');
const CANDIDATE_ROOT = path.join(ROOT, 'content/story-v1/candidates/quiet-cascade-expansion-v3');
const REVISION_ROOT = path.join(ROOT, 'docs/story/revisions/quiet-cascade-expansion-v3');
const CHECK = process.argv.includes('--check');

const INPUTS = {
  blueprint: 'docs/story/revisions/quiet-cascade-expansion-v3/blueprint.json',
  graph_report: 'docs/story/revisions/quiet-cascade-expansion-v3/GRAPH_REPORT.json',
  research_registry: 'docs/case_studies/v0.2-story-expansion/registry.json',
  domain_proof: 'docs/coverage/task-042-expansion-domain-network-proof.json',
  candidate_manifest: 'content/story-v1/candidates/quiet-cascade-expansion-v3/manifest.json',
  candidate_registry: 'content/story-v1/candidates/quiet-cascade-expansion-v3/registry.json',
  candidate_metadata: 'content/story-v1/candidates/quiet-cascade-expansion-v3/authored-metadata.json',
};

const OUTPUTS = {
  payload: 'docs/story/revisions/quiet-cascade-expansion-v3/CONTEXT_PAYLOAD_LEDGER.json',
  choices: 'docs/story/revisions/quiet-cascade-expansion-v3/CHOICE_CONSEQUENCE_MAP.md',
  continuity: 'docs/story/revisions/quiet-cascade-expansion-v3/CONTINUITY_UPDATE.md',
  trace_json: 'docs/story/revisions/quiet-cascade-expansion-v3/SOURCE_TO_LINE_TRACE.json',
  trace_md: 'docs/story/revisions/quiet-cascade-expansion-v3/SOURCE_TO_LINE_TRACE.md',
};

const FORBIDDEN_OVERREACH = {
  'exp-001': [
    'Do not turn the reported contact manipulation into a transferable repair procedure.',
    'Do not claim a preserved torque value, complete CPU/memory inventory, or post-repair stress interval.',
    'Do not treat the displayed voltage/failsafe wording as proof of a regulator fault.',
  ],
  'exp-002': [
    'Do not claim a decisive pre-repair PDB-only measurement; Isolation remains explicitly inferred.',
    'Do not present a failed capacitor as an observed finding or generalize connector voltages/pinouts.',
    'Do not turn the case reduction into authority for energized proprietary-connector probing.',
  ],
  'exp-003': [
    'Do not invent SMART attributes, a controller-event export, or a long post-rebuild soak.',
    'Do not imply that every advised backup, consistency, offlining, or compatibility step was reported as executed.',
    'Do not claim the exact drive interface or that every array permits live replacement.',
  ],
  'exp-004': [
    'The source combines the fresh probe and state clear in one DSET event; do not claim it separately proved the candidate Test/Repair sequence.',
    'Do not claim a prolonged nonrecurrence interval or that ordinary log clearing alone resolved the condition.',
    'Preserve logs and current evidence before state-changing cleanup; alert clearance cannot prove a live FRU never existed.',
  ],
  'exp-005': [
    'The preserved clean interval is forty-five minutes; do not inflate it into a production-length soak.',
    'The case reports management-visible link transitions, not packet-loss and switch-counter proof on every system.',
    'Do not generalize one known-good firmware version or rollback order to another platform.',
  ],
  'exp-006': [
    'The source is community evidence for one board/controller generation, not service authority or a portable recovery guide.',
    'Do not publish raw commands, addresses, pin mappings, electrical details, flash offsets, or a TFTP Diagnostic Command.',
    'Do not claim an independently preserved post-reset login, inventory, sensor, or persistence test beyond the reported acceptance boundary.',
  ],
};

const readRaw = async (relativePath) => fs.readFile(path.join(ROOT, relativePath), 'utf8');
const readJson = async (relativePath) => JSON.parse(await readRaw(relativePath));
const sha256 = (value) => createHash('sha256').update(value).digest('hex');

function normalize(value) {
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, normalize(value[key])]));
  }
  return value;
}

const stableJson = (value) => `${JSON.stringify(normalize(value), null, 2)}\n`;
const words = (value) => String(value).trim().split(/\s+/u).filter(Boolean).length;
const sentences = (value) => (String(value).match(/[.!?](?:[\s"'”’]|$)/gu) ?? []).length || 1;
const escapeCell = (value) => String(value ?? '').replaceAll('|', '\\|').replaceAll('\n', '<br>');

function invariant(condition, message) {
  if (!condition) throw new Error(`TASK-044 review ledger: ${message}`);
}

function metadataRows(metadata) {
  const rows = metadata.displays ?? metadata.records ?? metadata.entries ?? metadata.display_records ?? metadata.surfaces;
  invariant(Array.isArray(rows), 'authored-metadata.json must expose displays, records, entries, display_records, or surfaces.');
  return rows;
}

function contextRungs(row) {
  const source = row.context_rungs ?? row.context_rung_tags ?? [];
  return source.map((value) => String(value).trim().toUpperCase().replaceAll(/[\s-]+/gu, '_'));
}

function sourceStepIds(row) {
  return row.source_event_numbers ?? row.source_step_ids ?? row.source_event_ids ?? row.research_step_ids ?? [];
}

function authorityBounds(row) {
  const source = row.authority_bound ?? row.authority_bounds ?? [];
  return Array.isArray(source) ? source : [source];
}

function routeIds(row, routes, rememberedChoices) {
  const explicit = row.route_ids ?? row.route_coverage;
  if (explicit) return explicit;
  const selector = row.route_selector;
  invariant(selector && typeof selector.kind === 'string', `${row.text_id} must declare a route selector`);
  if (selector.kind === 'ALL_ROUTES') return routes.map((route) => route.route_id);
  if (selector.kind === 'CHOICE_IS' || selector.kind === 'CHOICE_OPTION') {
    return routes
      .filter((route) => route.choices[selector.choice_id] === selector.option_id)
      .map((route) => route.route_id);
  }
  if (selector.kind === 'MATCH_COMPLETION') {
    return routes
      .filter((route) => route.match_outcomes[selector.match_ref] === selector.completion)
      .map((route) => route.route_id);
  }
  if (selector.kind === 'VARIABLE_EQUALS') {
    const choice = rememberedChoices.find((entry) => entry.variable_id === selector.variable_id);
    invariant(choice, `${row.text_id} route selector names unknown variable ${selector.variable_id}`);
    const option = choice.options.find((entry) => entry.value === selector.value);
    invariant(option, `${row.text_id} route selector names unknown value ${selector.value}`);
    return routes
      .filter((route) => route.choices[choice.choice_id] === option.option_id)
      .map((route) => route.route_id);
  }
  throw new Error(`TASK-044 review ledger: unsupported route selector ${selector.kind} on ${row.text_id}`);
}

function parseSourceEvents(caseId, markdown) {
  const rows = [];
  for (const line of markdown.split(/\r?\n/u)) {
    if (!/^\|\s*\d+\s*\|/u.test(line)) continue;
    const cells = line.split('|').slice(1, -1).map((cell) => cell.trim());
    invariant(cells.length === 7, `${caseId} lifecycle row must retain seven columns`);
    const [number, category, event, contribution, fidelity, locator, stableObjectCrossReference] = cells;
    rows.push({
      event_number: Number(number),
      category,
      fidelity,
      paraphrase: event,
      lifecycle_contribution: contribution,
      locator,
      stable_object_cross_reference: stableObjectCrossReference,
    });
  }
  invariant(rows.length >= 6, `${caseId} must preserve at least six atomic lifecycle events`);
  invariant(new Set(rows.map((row) => row.event_number)).size === rows.length, `${caseId} source-event numbers must be unique`);
  return rows;
}

function collectScriptSurfaces(scripts) {
  const surfaces = [];
  for (const script of scripts) {
    let labelId = null;
    script.statements.forEach((statement, statementIndex) => {
      if (statement.type === 'label') labelId = statement.label_id;
      const common = {
        script_id: script.script_id,
        chapter_id: script.chapter_id,
        label_id: labelId,
        statement_index: statementIndex,
      };
      if (statement.type === 'say' || statement.type === 'narrate') {
        surfaces.push({
          ...common,
          surface_kind: statement.type === 'say' ? 'SAY' : 'NARRATE',
          statement_id: statement.statement_id,
          text_id: statement.text_id,
          speaker_or_source: statement.speaker_key ?? 'NARRATION',
        });
      } else if (statement.type === 'choice') {
        surfaces.push({
          ...common,
          surface_kind: 'CHOICE_PROMPT',
          statement_id: statement.choice_id,
          text_id: statement.prompt_text_id,
          speaker_or_source: 'PLAYER_CHOICE',
        });
        for (const option of statement.options) {
          surfaces.push({
            ...common,
            surface_kind: 'CHOICE_OPTION',
            statement_id: statement.choice_id,
            option_id: option.option_id,
            text_id: option.text_id,
            speaker_or_source: 'PLAYER_CHOICE',
          });
        }
      }
    });
  }
  return surfaces;
}

function routeCoverageSummary(ids) {
  const sorted = [...new Set(ids)].sort();
  return {
    route_count: sorted.length,
    route_id_digest: sha256(stableJson(sorted)),
    first_route_id: sorted[0] ?? null,
    last_route_id: sorted.at(-1) ?? null,
  };
}

function buildChoiceRecords(blueprint, scripts) {
  const statements = scripts.flatMap((script) => script.statements.map((statement, index) => ({
    script_id: script.script_id,
    index,
    statement,
  })));
  const labelRows = new Map(statements
    .filter(({ statement }) => statement.type === 'label')
    .map((row) => [row.statement.label_id, row]));
  return blueprint.remembered_choices.map((planned) => {
    const authored = statements.find(({ statement }) => statement.type === 'choice' && statement.choice_id === planned.choice_id);
    invariant(authored, `missing authored choice ${planned.choice_id}`);
    invariant(authored.statement.options.length === planned.options.length, `${planned.choice_id} option count drifted`);
    const options = planned.options.map((expected) => {
      const actual = authored.statement.options.find((option) => option.option_id === expected.option_id);
      invariant(actual, `${planned.choice_id} is missing option ${expected.option_id}`);
      invariant(actual.jump_label === expected.branch_label, `${planned.choice_id}/${expected.option_id} branch drifted`);
      invariant(actual.writes.length === 1, `${planned.choice_id}/${expected.option_id} must write exactly one value`);
      invariant(actual.writes[0].variable_id === planned.variable_id, `${planned.choice_id}/${expected.option_id} variable drifted`);
      invariant(actual.writes[0].value === expected.value, `${planned.choice_id}/${expected.option_id} value drifted`);
      const branch = labelRows.get(expected.branch_label);
      invariant(branch, `missing branch label ${expected.branch_label}`);
      const branchScript = scripts.find((script) => script.script_id === branch.script_id);
      const firstTransfer = branchScript.statements.slice(branch.index + 1)
        .find((statement) => ['jump', 'start_match', 'end'].includes(statement.type));
      invariant(firstTransfer?.type === 'jump' && firstTransfer.label_id === planned.reconverge_label,
        `${planned.choice_id}/${expected.option_id} must reconverge at ${planned.reconverge_label}`);
      return {
        option_id: expected.option_id,
        remembered_value: expected.value,
        branch_label: expected.branch_label,
        reconverge_label: planned.reconverge_label,
      };
    });
    invariant(planned.options.length === 2, `${planned.choice_id} delayed acknowledgment requires exactly two values`);
    const delayedAckLabel = labelRows.get(planned.delayed_ack_label);
    invariant(delayedAckLabel, `missing delayed acknowledgment reconvergence ${planned.delayed_ack_label}`);
    const delayedAckScript = scripts.find((script) => script.script_id === delayedAckLabel.script_id);
    invariant(delayedAckScript.chapter_id === planned.delayed_ack_episode_id,
      `${planned.choice_id} delayed acknowledgment is in the wrong episode`);
    const delayedConditions = statements.filter(({ script_id: scriptId, statement }) => scriptId === delayedAckScript.script_id
      && statement.type === 'if'
      && statement.condition?.op === 'VARIABLE_EQUALS'
      && statement.condition.variable_id === planned.variable_id);
    invariant(delayedConditions.length === 1,
      `${planned.choice_id} must have exactly one delayed VARIABLE_EQUALS acknowledgment branch`);
    const delayedCondition = delayedConditions[0];
    invariant(delayedCondition.index < delayedAckLabel.index,
      `${planned.choice_id} delayed condition must execute before acknowledgment reconvergence`);
    const thenOption = planned.options.find((option) => option.value === delayedCondition.statement.condition.value);
    invariant(thenOption, `${planned.choice_id} delayed condition checks an unknown remembered value`);
    const elseOptions = planned.options.filter((option) => option.option_id !== thenOption.option_id);
    invariant(elseOptions.length === 1, `${planned.choice_id} delayed else branch must identify one remaining value`);
    const delayedTargetByOption = new Map([
      [thenOption.option_id, delayedCondition.statement.then_label],
      [elseOptions[0].option_id, delayedCondition.statement.else_label],
    ]);
    invariant(new Set(delayedTargetByOption.values()).size === 2,
      `${planned.choice_id} delayed values must select distinct acknowledgment branches`);
    const optionsWithDelayedAck = options.map((option) => {
      const branchLabel = delayedTargetByOption.get(option.option_id);
      const branch = labelRows.get(branchLabel);
      invariant(branch && branch.script_id === delayedAckScript.script_id,
        `${planned.choice_id}/${option.option_id} delayed branch ${branchLabel} is missing`);
      const branchBody = delayedAckScript.statements.slice(branch.index + 1);
      const nextLabelOffset = branchBody.findIndex((statement) => statement.type === 'label');
      const boundedBody = nextLabelOffset === -1 ? branchBody : branchBody.slice(0, nextLabelOffset);
      const transfer = boundedBody.find((statement) => ['if', 'jump', 'start_match', 'end', 'choice'].includes(statement.type));
      invariant(transfer?.type === 'jump' && transfer.label_id === planned.delayed_ack_label,
        `${planned.choice_id}/${option.option_id} delayed acknowledgment must reconverge at ${planned.delayed_ack_label}`);
      invariant(!boundedBody.some((statement) => statement.type === 'choice' || statement.writes?.length > 0),
        `${planned.choice_id}/${option.option_id} delayed acknowledgment may not write state`);
      const displayStatements = boundedBody.filter((statement) => statement.type === 'say' || statement.type === 'narrate');
      invariant(displayStatements.length > 0,
        `${planned.choice_id}/${option.option_id} delayed branch must display a value-specific acknowledgment`);
      return {
        ...option,
        delayed_ack_branch_label: branchLabel,
        delayed_ack_statement_ids: displayStatements.map((statement) => statement.statement_id),
        delayed_ack_text_ids: displayStatements.map((statement) => statement.text_id),
        delayed_ack_reconverge_label: planned.delayed_ack_label,
      };
    });
    const postAckTransfer = delayedAckScript.statements.slice(delayedAckLabel.index + 1)
      .find((statement) => ['if', 'jump', 'start_match', 'end', 'choice'].includes(statement.type));
    invariant(postAckTransfer?.type === 'jump' && postAckTransfer.label_id !== planned.delayed_ack_label,
      `${planned.choice_id} delayed acknowledgment reconvergence must continue forward`);
    return {
      choice_id: planned.choice_id,
      episode_id: planned.episode_id,
      variable_id: planned.variable_id,
      default: planned.default,
      branch_kind: planned.branch_kind,
      authority_effect: planned.authority_effect,
      options: optionsWithDelayedAck,
      delayed_ack_episode_id: planned.delayed_ack_episode_id,
      delayed_ack_label: planned.delayed_ack_label,
      delayed_ack_condition: delayedCondition.statement.condition,
      delayed_ack_continuation_label: postAckTransfer.label_id,
      presentation_only: true,
      changes_match_seed: false,
      changes_ticket_truth: false,
      changes_required_actions: false,
      changes_story_service_points: false,
      route_count_per_option: 128,
    };
  });
}

function buildReviewArtifacts({ blueprint, graphReport, research, domainProof, manifest, registry, metadata, texts, scripts, sourceEventsByCase, inputHashes }) {
  invariant(manifest.pack_id === blueprint.campaign_id, 'candidate pack ID must preserve the durable campaign ID');
  invariant(manifest.content_version === 'quiet-cascade-expansion-v3', 'candidate content version must be quiet-cascade-expansion-v3');
  invariant(manifest.entry_label === blueprint.entry_label, 'candidate entry label drifted from the blueprint');
  invariant(metadata.pack_id === manifest.pack_id, 'authored metadata pack ID must match the candidate manifest');
  invariant(metadata.content_version === manifest.content_version, 'authored metadata content version must match the candidate manifest');
  invariant(metadata.status === 'CANDIDATE_NON_LIVE', 'authored metadata must remain explicitly non-live');
  invariant(/public context and normalized-result interpretation only/iu.test(metadata.authority_policy ?? ''),
    'authored metadata must preserve the dialogue authority policy');
  invariant(/256 routes/iu.test(metadata.route_model ?? ''), 'authored metadata must declare the exhaustive route model');
  invariant(graphReport.totals.routes === 256, 'locked route matrix must contain 256 routes');
  invariant(graphReport.totals.episodes === 6 && graphReport.totals.matches === 6, 'locked topology must contain six episodes and six Matches');
  invariant(manifest.registry === 'registry.json', 'candidate manifest must retain the reviewed registry path');
  invariant(registry.variables.length === blueprint.remembered_choices.length,
    'candidate registry must declare exactly the two reviewed choice variables');
  for (const choice of blueprint.remembered_choices) {
    const variable = registry.variables.find((entry) => entry.variable_id === choice.variable_id);
    invariant(variable?.value_type === choice.value_type && variable.default === choice.default,
      `${choice.choice_id} registry declaration drifted from the locked blueprint`);
  }

  const rows = metadataRows(metadata);
  const authoredSurfaces = collectScriptSurfaces(scripts);
  const authoredTextIds = authoredSurfaces.map((row) => row.text_id).sort();
  const metadataTextIds = rows.map((row) => row.text_id).sort();
  invariant(new Set(metadataTextIds).size === metadataTextIds.length, 'metadata text IDs must be unique');
  invariant(JSON.stringify(authoredTextIds) === JSON.stringify(metadataTextIds),
    'authored metadata must reconcile every say, narrate, choice prompt, and choice option exactly once');

  const surfaceByText = new Map(authoredSurfaces.map((surface) => [surface.text_id, surface]));
  const episodeById = new Map(blueprint.episodes.map((episode) => [episode.episode_id, episode]));
  const caseById = new Map(research.selected_cases.map((record) => [record.case_id, record]));
  const proofByCase = new Map(domainProof.tickets.map((record) => [record.case_id, record]));
  const allRouteIds = graphReport.routes.map((route) => route.route_id).sort();
  const validRouteIds = new Set(allRouteIds);

  const linePayloads = rows.map((row) => {
    const surface = surfaceByText.get(row.text_id);
    const text = texts.entries[row.text_id];
    invariant(surface, `metadata references unknown text ${row.text_id}`);
    invariant(typeof text === 'string' && text.length > 0, `missing localized text ${row.text_id}`);
    invariant(text.length <= 420, `${row.text_id} exceeds the 420-character mobile review bound`);
    invariant(!text.includes('\n'), `${row.text_id} must not rely on inline newline formatting`);
    invariant(row.display_kind === surface.surface_kind, `${row.text_id} display kind does not match the script`);
    invariant(row.statement_id === surface.statement_id || (row.statement_id === null && surface.surface_kind.startsWith('CHOICE_')),
      `${row.text_id} metadata statement ${row.statement_id} does not match ${surface.statement_id}`);
    invariant(episodeById.has(row.episode_id), `${row.text_id} references unknown episode ${row.episode_id}`);
    const labelId = row.label_id ?? row.nearest_label;
    invariant(labelId === surface.label_id, `${row.text_id} metadata label does not match authored label`);
    const routes = routeIds(row, graphReport.routes, blueprint.remembered_choices);
    invariant(routes.length > 0, `${row.text_id} must declare route coverage`);
    invariant(routes.every((routeId) => validRouteIds.has(routeId)), `${row.text_id} declares an unknown route`);
    const bounds = authorityBounds(row);
    invariant(bounds.length > 0 && bounds.every(Boolean), `${row.text_id} must state an authority bound`);
    invariant(typeof row.semantic_payload === 'string' && row.semantic_payload.length > 0,
      `${row.text_id} must lock a semantic payload`);
    return {
      payload_id: `payload.${row.text_id}`,
      episode_id: row.episode_id,
      script_id: surface.script_id,
      chapter_id: surface.chapter_id,
      label_id: labelId,
      statement_id: row.statement_id ?? surface.statement_id,
      option_id: surface.option_id ?? null,
      text_id: row.text_id,
      surface_kind: surface.surface_kind,
      speaker_or_source: row.speaker_or_source ?? row.speaker_key ?? surface.speaker_or_source,
      phase: row.phase,
      outcome_scope: row.outcome_scope ?? row.route_selector?.completion ?? 'ALL',
      text,
      immutable_semantic_payload: row.semantic_payload,
      context_rungs: contextRungs(row),
      technical_claim: row.technical_claim === true,
      source_case_id: row.source_case_id ?? null,
      source_event_numbers: sourceStepIds(row),
      authority_bounds: bounds,
      route_selector: row.route_selector,
      normalized_result_fields: row.normalized_result_fields ?? [],
      normalized_result_expectations: row.normalized_result_expectations ?? null,
      public_process_principle_id: row.public_process_principle_id ?? null,
      private_match_details_claimed: row.private_match_details_claimed ?? null,
      hidden_information_guardrail: row.hidden_information_guardrail
        ?? (row.phase === 'OUTCOME'
          ? 'Use only normalized completion for this route; do not expose hidden Faults, private Evidence, counters, closure details, or the engine action sequence.'
          : 'Public context may frame symptoms, procedures, and Candidate possibilities; it may not assert a hidden Fault, required diagnostic, correct Repair, or unearned outcome.'),
      route_coverage: routeCoverageSummary(routes),
      localization_and_density: {
        characters: text.length,
        words: words(text),
        sentences: sentences(text),
        no_fragment_splicing: true,
        inline_newlines: 0,
        review_bound_characters: 420,
      },
      voice_flexibility: {
        may_change: ['syntax', 'diction', 'rhythm', 'speaker-specific relational framing', 'non-shaming removable texture'],
        must_preserve: ['semantic payload', 'source fidelity', 'uncertainty and time bounds', 'speaker knowledge', 'route scope', 'gameplay authority'],
      },
    };
  });

  const allowedAuthorityByPhase = new Map([
    ['CONTEXT', new Set(['PUBLIC_CONTEXT_ONLY'])],
    ['CHOICE', new Set(['PRESENTATION_ORDER_ONLY'])],
    ['CHOICE_BRANCH', new Set(['PRESENTATION_ORDER_ONLY'])],
    ['DELAYED_CHOICE_ACK', new Set(['PRESENTATION_ORDER_ONLY'])],
    ['MATCH_BRIDGE', new Set(['NO_GAMEPLAY_AUTHORITY'])],
    ['OUTCOME', new Set(['NORMALIZED_MATCH_RESULT_ONLY'])],
    ['FOLLOW_ON', new Set(['PUBLIC_CONTEXT_ONLY', 'NORMALIZED_MATCH_HISTORY_ONLY', 'PUBLIC_STORY_CONTEXT_ONLY', 'TRANSITION_ONLY'])],
  ]);
  for (const line of linePayloads) {
    const allowed = allowedAuthorityByPhase.get(line.phase);
    invariant(allowed, `${line.text_id} uses unsupported review phase ${line.phase}`);
    invariant(line.authority_bounds.every((bound) => allowed.has(bound)),
      `${line.text_id} authority ${line.authority_bounds.join(', ')} exceeds ${line.phase}`);
    if (line.technical_claim) {
      invariant(['CONTEXT', 'FOLLOW_ON'].includes(line.phase),
        `${line.text_id} technical claim must remain pre-Match or follow-on public context`);
      invariant(line.authority_bounds.length === 1 && line.authority_bounds[0] === 'PUBLIC_CONTEXT_ONLY',
        `${line.text_id} technical claim must be public-context-only`);
      invariant(line.source_case_id !== null && line.source_event_numbers.length > 0,
        `${line.text_id} technical claim must declare source evidence`);
      const episodeIndex = blueprint.episodes.findIndex((episode) => episode.episode_id === line.episode_id);
      const expectedSourceCase = line.phase === 'FOLLOW_ON'
        ? blueprint.episodes[episodeIndex + 1]?.case_id
        : blueprint.episodes[episodeIndex].case_id;
      invariant(expectedSourceCase === line.source_case_id,
        `${line.text_id} technical source must match ${line.phase === 'FOLLOW_ON' ? 'the next episode' : 'its episode'} case`);
    } else {
      invariant(line.source_case_id === null && line.source_event_numbers.length === 0,
        `${line.text_id} nontechnical presentation line must not borrow source authority`);
    }
    if (line.phase === 'OUTCOME') {
      invariant(line.outcome_scope !== 'ALL', `${line.text_id} outcome must be scoped to a normalized Match result`);
      invariant(JSON.stringify(line.normalized_result_fields) === JSON.stringify(['completion'])
        && line.normalized_result_expectations?.completion === line.outcome_scope,
      `${line.text_id} outcome may read only its normalized completion value`);
      invariant(typeof line.public_process_principle_id === 'string' && line.public_process_principle_id.length > 0,
        `${line.text_id} outcome must select one reviewed public-process principle`);
      invariant(line.private_match_details_claimed === false,
        `${line.text_id} outcome may not claim private Match details`);
      invariant(/No private Match Evidence, diagnosis, action sequence, or technical outcome is asserted\.$/u
        .test(line.immutable_semantic_payload),
      `${line.text_id} semantic payload must preserve the private-detail prohibition`);
    } else {
      invariant(line.normalized_result_fields.length === 0
        && line.normalized_result_expectations === null
        && line.public_process_principle_id === null
        && line.private_match_details_claimed === null,
      `${line.text_id} non-outcome line may not borrow normalized-result authority`);
    }
  }
  const outcomePrinciples = linePayloads.filter((line) => line.phase === 'OUTCOME')
    .map((line) => line.public_process_principle_id);
  invariant(outcomePrinciples.length === 24 && new Set(outcomePrinciples).size === 24,
    'outcome copy must retain the closed 24-principle allowlist');

  const forbiddenPlayerFacingIds = new Set(blueprint.episodes.flatMap((episode) => episode.public_setup.forbidden_early_reveal_ids));
  const hiddenIdDisclosures = linePayloads.filter((line) => [...forbiddenPlayerFacingIds]
    .some((hiddenId) => line.text.includes(hiddenId)));
  invariant(hiddenIdDisclosures.length === 0,
    `player-facing text exposes hidden domain IDs: ${hiddenIdDisclosures.map((line) => line.text_id).join(', ')}`);

  const contextProofs = blueprint.episodes.map((episode) => {
    const episodeRows = linePayloads
      .filter((row) => row.episode_id === episode.episode_id)
      .sort((left, right) => surfaceByText.get(left.text_id).statement_index - surfaceByText.get(right.text_id).statement_index);
    const beforeMatch = episodeRows.filter((row) => !['OUTCOME', 'FOLLOW_ON', 'ENDING'].includes(row.phase));
    const bucket = (accepted) => beforeMatch.filter((row) => row.context_rungs.some((rung) => accepted.includes(rung)));
    const environment = bucket(['ENVIRONMENT', 'ENVIRONMENT_WORKFLOW', 'WORKFLOW_CONTEXT']);
    const procedure = bucket(['PROCEDURE', 'NORMAL', 'NORMAL_PROCEDURE', 'WORKFLOW_PROCEDURE']);
    const painPoint = bucket(['PAIN_POINT', 'FAILURE', 'FAILURE_MODE', 'WORKFLOW_FAILURE']);
    const insight = episodeRows.filter((row) => row.context_rungs.includes('INSIGHT') || row.context_rungs.includes('INTERPRETATION'));
    invariant(environment.length > 0, `${episode.episode_id} lacks environment/workflow context`);
    invariant(procedure.length > 0, `${episode.episode_id} lacks normal procedure context`);
    invariant(painPoint.length > 0, `${episode.episode_id} lacks a concrete pain point`);
    invariant(insight.length > 0, `${episode.episode_id} lacks a bounded insight`);
    const firstEnvironmentIndex = Math.min(...environment.map((row) => surfaceByText.get(row.text_id).statement_index));
    const firstProcedureIndex = Math.min(...procedure.map((row) => surfaceByText.get(row.text_id).statement_index));
    const firstPainPointIndex = Math.min(...painPoint.map((row) => surfaceByText.get(row.text_id).statement_index));
    const firstContextCompleteIndex = Math.max(firstEnvironmentIndex, firstProcedureIndex, firstPainPointIndex);
    const firstInsightIndex = Math.min(...insight.map((row) => surfaceByText.get(row.text_id).statement_index));
    invariant(firstContextCompleteIndex <= firstInsightIndex,
      `${episode.episode_id} reaches its first insight before context is established`);
    return {
      episode_id: episode.episode_id,
      title: episode.title,
      source_case_id: episode.case_id,
      learning_objective: episode.learning_objective,
      environment_text_ids: environment.map((row) => row.text_id),
      procedure_text_ids: procedure.map((row) => row.text_id),
      pain_point_text_ids: painPoint.map((row) => row.text_id),
      insight_text_ids: insight.map((row) => row.text_id),
      context_precedes_or_accompanies_first_insight: true,
      first_context_complete_statement_index: firstContextCompleteIndex,
      first_insight_statement_index: firstInsightIndex,
    };
  });

  const technicalRows = linePayloads.filter((row) => row.technical_claim);
  const traces = technicalRows.map((line) => {
    const caseRecord = line.source_case_id ? caseById.get(line.source_case_id) : null;
    invariant(!line.source_case_id || caseRecord, `${line.text_id} names an unknown source case`);
    const eventNumbers = line.source_event_numbers;
    invariant(!caseRecord || eventNumbers.length > 0, `${line.text_id} technical case claim must cite at least one source event`);
    const availableEvents = new Map((sourceEventsByCase.get(line.source_case_id) ?? []).map((event) => [event.event_number, event]));
    const sourceEvents = eventNumbers.map((eventNumber) => {
      const event = availableEvents.get(eventNumber);
      invariant(event, `${line.text_id} cites unknown source event ${eventNumber}`);
      return event;
    });
    const technicalSubjectEpisode = blueprint.episodes.find((candidate) => candidate.case_id === line.source_case_id);
    const domain = proofByCase.get(line.source_case_id);
    invariant(technicalSubjectEpisode && domain, `${line.text_id} lacks TASK-042 domain proof`);
    return {
      trace_id: `trace.${line.text_id}`,
      episode_id: line.episode_id,
      technical_subject_episode_id: technicalSubjectEpisode.episode_id,
      label_id: line.label_id,
      statement_id: line.statement_id,
      text_id: line.text_id,
      phase: line.phase,
      outcome_scope: line.outcome_scope,
      speaker_or_source: line.speaker_or_source,
      player_facing_text: line.text,
      bounded_claim: line.immutable_semantic_payload,
      authority_bounds: line.authority_bounds,
      research_source: caseRecord ? {
        case_id: caseRecord.case_id,
        title: caseRecord.source.title,
        publisher: caseRecord.source.publisher,
        url: caseRecord.source.url,
        accessed_on: caseRecord.source.access_date,
        lifecycle_score: caseRecord.source.selection_rubric.total,
        absent_lifecycle_categories: caseRecord.absent_lifecycle_categories,
        source_events: sourceEvents,
        uncertainties: caseRecord.source.uncertainties,
      } : null,
      reviewed_domain_contract: {
        fingerprint_id: domain.fingerprint_id,
        public_candidate_fault_ids: domain.public_candidate_fault_ids,
        symptom_ids: domain.symptom_ids,
        required_diagnostic_ids: line.source_case_id === 'exp-005'
          ? ['test.firmware.version_compatibility', 'test.network.link_counter_soak']
          : [domain.solvability_witness.find((step) => step.action === 'RUN_DIAGNOSTIC')?.source_definition_id].filter(Boolean),
        repair_procedure_ids: domain.repair_procedure_ids,
        validation_procedure_ids: domain.validation_procedure_ids,
      },
      forbidden_overreach: [
        'Story prose is descriptive only and cannot manufacture Evidence, Isolation, Repair, Verify, Documentation, closure, or Service Points.',
        'Before Match authorization, do not assert the hidden Fault, required diagnostic, correct Repair, or result.',
        ...(FORBIDDEN_OVERREACH[line.source_case_id] ?? []),
      ],
      route_coverage: line.route_coverage,
    };
  });

  const n4Text = linePayloads.filter((row) => row.episode_id === 'story.shift.qc02.10')
    .map((row) => `${row.immutable_semantic_payload} ${row.text}`).join(' ');
  invariant(/preserv|read[- ]only|compare/iu.test(n4Text) && /clear|state-changing/iu.test(n4Text),
    'Shift 10 must explicitly distinguish preserved/read-only comparison from state-changing clear');
  const n6Text = linePayloads.filter((row) => row.episode_id === 'story.shift.qc02.12')
    .map((row) => `${row.immutable_semantic_payload} ${row.text}`).join(' ');
  invariant(/recovery state|read[- ]only|inspect/iu.test(n6Text) && /firmware (?:image )?write|write(?:s|ing)? (?:the )?(?:validated )?(?:firmware|image)|state-changing/iu.test(n6Text),
    'Shift 12 must explicitly distinguish recovery-state Test from firmware-write Repair');
  const choices = buildChoiceRecords(blueprint, scripts);
  const lineByText = new Map(linePayloads.map((line) => [line.text_id, line]));
  const expectedDelayedAckTextIds = choices.flatMap((choice) => choice.options.flatMap((option) => option.delayed_ack_text_ids)).sort();
  const actualDelayedAckTextIds = linePayloads.filter((line) => line.phase === 'DELAYED_CHOICE_ACK')
    .map((line) => line.text_id).sort();
  invariant(JSON.stringify(actualDelayedAckTextIds) === JSON.stringify(expectedDelayedAckTextIds),
    'delayed acknowledgment metadata must reconcile every value-specific branch exactly once');
  for (const choice of choices) {
    for (const option of choice.options) {
      for (const textId of option.delayed_ack_text_ids) {
        const line = lineByText.get(textId);
        invariant(line?.phase === 'DELAYED_CHOICE_ACK'
          && line.label_id === option.delayed_ack_branch_label
          && line.authority_bounds.length === 1
          && line.authority_bounds[0] === 'PRESENTATION_ORDER_ONLY',
        `${choice.choice_id}/${option.option_id} delayed copy must remain presentation-only`);
        invariant(line.route_selector?.kind === 'VARIABLE_EQUALS'
          && line.route_selector.variable_id === choice.variable_id
          && line.route_selector.value === option.remembered_value
          && line.route_coverage.route_count === 128,
        `${choice.choice_id}/${option.option_id} delayed copy must select exactly its remembered value`);
      }
    }
  }
  const payload = {
    schema_version: 'quiet-cascade-expansion-context-payload-ledger-v1',
    campaign_id: manifest.pack_id,
    candidate_content_version: manifest.content_version,
    status: 'NON_LIVE_REVIEW_CANDIDATE',
    inputs_sha256: inputHashes,
    reader_model: {
      capable_newcomer: true,
      knows_safe_hardware_handling: true,
      may_not_be_assumed_to_know: ['Second Current handoffs', 'local team shorthand', 'platform-specific recovery procedure', 'hidden Ticket truth'],
    },
    policy: {
      context_ladder: ['ENVIRONMENT', 'PROCEDURE', 'PAIN_POINT', 'CONSEQUENCE', 'INSIGHT', 'ACTION'],
      context_before_or_with_insight: true,
      technical_claims_require_trace: true,
      mobile_review_bound_characters: 420,
      no_fragment_splicing: true,
      hidden_faults_remain_engine_private: true,
      normalized_match_results_are_only_story_outcome_authority: true,
    },
    boundary_proofs: {
      shift_10: {
        test_id: 'test.management.event_log_freshness',
        repair_id: 'repair.management.clear_stale_alert_state',
        rule: 'Preserve and compare current evidence without clearing; clear stale state only as the later state-changing Repair.',
        source_limitation: 'The qualifying source combined probe and clear, so the clean separation comes from the reviewed TASK-042 domain contract, not a rewritten source event.',
      },
      shift_12: {
        test_id: 'test.management.bmc_recovery_state',
        repair_id: 'repair.management.recover_bmc_firmware',
        rule: 'Inspect recovery state without changing it; image transfer/write is Repair and independent controller-function checks are Verify.',
        tftp_role: 'REPAIR_TRANSPORT_NOT_DIAGNOSTIC_COMMAND',
      },
    },
    episode_context_proofs: contextProofs,
    totals: {
      episodes: blueprint.episodes.length,
      displayed_surfaces: linePayloads.length,
      say_surfaces: linePayloads.filter((row) => row.surface_kind === 'SAY').length,
      narrate_surfaces: linePayloads.filter((row) => row.surface_kind === 'NARRATE').length,
      choice_prompts: linePayloads.filter((row) => row.surface_kind === 'CHOICE_PROMPT').length,
      choice_options: linePayloads.filter((row) => row.surface_kind === 'CHOICE_OPTION').length,
      technical_claims: traces.length,
      routes: allRouteIds.length,
      lines_over_mobile_bound: 0,
      unresolved_context_requirements: 0,
      hidden_truth_disclosures: hiddenIdDisclosures.length,
    },
    line_payloads: linePayloads,
  };

  const trace = {
    schema_version: 'quiet-cascade-expansion-source-to-line-trace-v1',
    campaign_id: manifest.pack_id,
    candidate_content_version: manifest.content_version,
    status: 'NON_LIVE_REVIEW_CANDIDATE',
    inputs_sha256: inputHashes,
    authority_order: [
      'Frozen gameplay/runtime authority',
      'TASK-042 reviewed domain and executable Match proof',
      'TASK-041 source fidelity and uncertainty bounds',
      'TASK-043 Story topology and player-safe public setup',
      'TASK-044 prose, which may describe but never authorize',
    ],
    totals: {
      traced_technical_lines: traces.length,
      sourced_cases: new Set(traces.map((row) => row.research_source?.case_id).filter(Boolean)).size,
      source_events_cited: traces.reduce((sum, row) => sum + (row.research_source?.source_events.length ?? 0), 0),
      untraced_technical_lines: 0,
      hidden_truth_disclosures: hiddenIdDisclosures.length,
      unsupported_claims: 0,
    },
    traces,
  };

  return { payload, trace, choices };
}

function renderChoiceMap(choices) {
  const lines = [
    '# Quiet Cascade expansion choice consequence map',
    '',
    'Status: **non-live TASK-044 review record**',
    '',
    'Both choices are remembered, presentation-only ordering decisions. They change the order and acknowledgment of the briefing, then reconverge before Match authority. They never change a Ticket, seed, hidden truth, required action, deck, Story Service Point gain, or ending.',
    '',
    '| Choice | Remembered variable | Options and values | Reconvergence | Delayed acknowledgment | Route coverage |',
    '| --- | --- | --- | --- | --- | ---: |',
  ];
  for (const choice of choices) {
    const options = choice.options.map((option) => `\`${option.option_id}\` → \`${option.remembered_value}\` via \`${option.branch_label}\``).join('<br>');
    const delayed = choice.options.map((option) => `\`${option.remembered_value}\` → \`${option.delayed_ack_branch_label}\` → ${option.delayed_ack_text_ids.map((textId) => `\`${textId}\``).join(', ')}`).join('<br>');
    lines.push(`| \`${choice.choice_id}\` | \`${choice.variable_id}\` (default \`${choice.default}\`) | ${options} | \`${choice.options[0].reconverge_label}\` | ${choice.delayed_ack_episode_id}: ${delayed}<br>reconverges at \`${choice.delayed_ack_label}\`, then \`${choice.delayed_ack_continuation_label}\` | 128 routes per option |`);
  }
  lines.push(
    '',
    '## Authority and consequence proof',
    '',
    '- Both option values are typed `STRING` writes declared in the candidate registry and match the locked blueprint exactly.',
    '- Every immediate option branch performs presentation copy and jumps to its planned Match label. No branch writes Service Points, selects a Ticket, changes a seed, grants Evidence, or chooses an outcome.',
    '- Each delayed acknowledgment executes one `VARIABLE_EQUALS` read of its remembered variable, selects value-specific localized copy, writes no state, and reconverges before continuation.',
    '- The exhaustive TASK-043 matrix contains 256 routes: two initial-frame options × six binary Match outcomes × two change-frame options. Every option appears on 128 routes, and every route reaches `ending.qc02.current_content`.',
    '- Choice language remains protagonist-flexible: options express investigative presentation priority, not personality, biography, competence, or an authoritative diagnosis.',
    '',
    '## Review boundary',
    '',
    'A later release may preserve these values in checkpoint history, but it may not reinterpret them as gameplay authority or a score modifier. Changing an option promise, write, branch label, reconvergence, or delayed acknowledgment requires a topology/continuity review rather than a prose-only edit.',
  );
  return `${lines.join('\n')}\n`;
}

function renderContinuity({ blueprint, payload }) {
  const episodeRows = blueprint.episodes.map((episode) => `| ${episode.shift_number} | \`${episode.episode_id}\` | ${episode.title} | \`${episode.match_ref}\` | Completed +2; abandoned +0; invalid does not advance | \`${episode.labels.follow_on}\` |`);
  return `# Quiet Cascade expansion continuity update

Status: **non-live TASK-044 candidate continuity; TASK-046 owns release composition and migration**

## Inherited campaign continuity

- The durable campaign identity remains \`${blueprint.campaign_id}\`; the expansion uses the new \`${blueprint.namespace}.*\` namespace without repurposing any \`story.qc01.*\` label, choice, variable, checkpoint, result, or ending.
- Campaign-one choices, branch history, accepted Match results, completed ending, and Story Service Points remain historical facts. TASK-044 does not choose how a completed v2 checkpoint enters this candidate; TASK-046 must map each supported ending through an explicit versioned migration.
- The Continuity Rotation, Civic Atlas account, and seven already-illustrated speakers remain canonical. No new character, biography fact, pose, background, or gameplay rule is introduced.
- Campaign one's conclusion remains intact: the “quiet cascade” is an organizational loss of explanation across handoffs, not one shared technical root. These six Tickets remain independent causal cases.

## Expansion sequence and normalized outcomes

| Shift | Episode | Title | Match | Story Service Point consequence | Reconverged continuation |
| ---: | --- | --- | --- | --- | --- |
${episodeRows.join('\n')}

Each episode accepts exactly one valid normalized \`COMPLETED\` or \`ABANDONED\` result. Under the locked Match contract a valid \`COMPLETED\` result contributes the engine-authoritative +2 and \`ABANDONED\` contributes +0; return dialogue does not infer Ticket counters from either value. Invalid, stale, mismatched, or interrupted results do not advance. The inherited total is preserved and the expansion can add 0–12 points, but it has no cumulative score gate and never retroactively grades campaign one.

An interrupted active Match is discarded. Story restores its durable pre-Match checkpoint and offers a fresh launch of the same reviewed configuration; neither dialogue nor persistence may imply that a Test, soak, clear, flash, or engine session resumed.

## Player-safe episode continuity

- **Shift 7 — The Fourth Pair:** public continuity carries a full-population no-POST condition and known-good comparison, not a proven socket Fault. The remembered evidence-frame choice changes briefing order only.
- **Shift 8 — Across Both Bays:** public continuity carries an out-of-range voltage and shutdown that persist across component reduction and supply/bay comparison. The delayed Shift 7 acknowledgment names a reasoning habit, never a cause.
- **Shift 9 — Before the Drop:** public continuity carries an online array member with predictive warning and a mixed bay indication. Replacement is not accepted as recovery until the ordinary Match supplies its independent Verify and Documentation result.
- **Shift 10 — The Alert That Stayed:** public continuity carries disagreement between a persistent management alert and current device state. Read-only preservation/comparison precedes the state-changing clear Repair; the source's combined DSET event is not rewritten as two source-executed acts.
- **Shift 11 — Version A, Version B:** public continuity carries link changes after a management-firmware change and clean substituted hardware/cabling. The selected Match route requires corroboration, while the remembered Shift 10 choice still changes only presentation order.
- **Shift 12 — Recovery State:** public continuity carries an unresponsive controller after interrupted firmware work. Recovery-state inspection is Test, image transfer/write is Repair, TFTP is transport rather than a Diagnostic Command, and controller-function acceptance is independent Verify.

Return dialogue reads only the normalized \`completion\` field. \`COMPLETED\` and \`ABANDONED\` copy may acknowledge that route and teach its reviewed public process principle, but it may not infer a Fault, Evidence, diagnosis, action sequence, closure counter, Verify, Documentation, or point value. The engine-authoritative point consequence remains recorded separately in the continuity table. Minimal zero-counter results still support every return line.

## Remembered presentation choices

- \`story.qc02.initial_evidence_frame\` stores \`LOCATION_CONTEXT_FIRST\` or \`CONTROLLED_COMPARISON_FIRST\`, reconverges before Shift 7's Match, and is acknowledged in Shift 8.
- \`story.qc02.change_evidence_frame\` stores \`CURRENT_STATE_FIRST\` or \`CHANGE_HISTORY_FIRST\`, reconverges before Shift 10's Match, and is acknowledged in Shift 11.
- Both values survive as attributable briefing preferences only. They cannot change Ticket construction, candidates, required diagnostics, response Cards, score, or ending.

## Current-content ending

All ${payload.totals.routes} exhaustive routes reach the single \`${blueprint.ending.ending_id}\` at \`${blueprint.ending.checkpoint_id}\`. It means only that the six reviewed candidate episodes are complete or honestly bounded. It promises no later episode, names no “best” score, and does not overwrite the campaign-one ending that TASK-046 must preserve during composition.

## Ongoing locks

- The protagonist remains a smart, early-career Crossline Technician. Copy may establish work access, choices, and consequences of play; it may not assign home, family, education, hobby, belief, fixed temperament, or emotional reaction.
- Character lines may use only campaign-safe texture from \`CHARACTERS.md\`; Iceberg facts remain off-page. Technical clarity and safety outrank texture.
- Motion, pose, lighting, and art remain optional presentation. Every critical fact, choice, and result bound is in localized accessible text.
- This update is a candidate-writing record. It does not stage Viewer content, migrate a save, release a pack, generate art, or modify engine/domain authority.
`;
}

function renderTrace(trace) {
  const lines = [
    '# Quiet Cascade expansion source-to-line trace',
    '',
    'Status: **non-live TASK-044 technical review record**',
    '',
    `Every one of the ${trace.totals.traced_technical_lines} technical display lines is joined to its reviewed research and/or authority bounds. A source case supplies fidelity-limited evidence; TASK-042 supplies reviewed domain and gameplay semantics; TASK-043 supplies player-safe timing and topology. Dialogue supplies no gameplay authority.`,
    '',
    `${trace.traces.filter((row) => row.phase === 'FOLLOW_ON').length} \`FOLLOW_ON\` rows introduce the next episode and therefore trace to that next episode’s case/domain contract; the machine ledger records both the display episode and technical-subject episode.`,
    '',
    'This author-only ledger deliberately names reviewed hidden domain IDs in its Domain contract column; those IDs are not present in candidate player copy.',
    '',
    '| Text ID | Shift / phase | Bounded player-facing claim | Source event(s) | Fidelity | Domain contract |',
    '| --- | --- | --- | --- | --- | --- |',
  ];
  for (const row of trace.traces) {
    const steps = row.research_source?.source_events.map((event) => `event ${event.event_number} (${event.locator})`).join('<br>') ?? 'Gameplay/runtime authority only';
    const fidelity = row.research_source?.source_events.map((event) => event.fidelity).join(', ') ?? 'authoritative normalized projection';
    const domain = [
      row.reviewed_domain_contract.fingerprint_id,
      ...row.reviewed_domain_contract.required_diagnostic_ids,
      ...row.reviewed_domain_contract.repair_procedure_ids,
      ...row.reviewed_domain_contract.validation_procedure_ids,
    ].map((id) => `\`${id}\``).join('<br>');
    lines.push(`| \`${row.text_id}\` | ${row.episode_id} / ${row.phase}${row.outcome_scope !== 'ALL' ? ` (${row.outcome_scope})` : ''} | ${escapeCell(row.bounded_claim)} | ${steps} | ${escapeCell(fidelity)} | ${domain} |`);
  }
  lines.push(
    '',
    '## Cross-case boundaries',
    '',
    '- Research is not a service procedure. Every case retains its missing stages, uncertainty, explicit/inferred labels, and platform scope.',
    '- Pre-Match lines may name public symptoms, environment, ordinary procedure, pain, and Candidate possibilities. They may not assert hidden Faults, required diagnostics, correct Repairs, or unearned outcomes.',
    '- Return lines read only normalized `completion`; their 24 process principles form a closed allowlist. Minimal zero-counter COMPLETED and ABANDONED results support the same copy, so dialogue cannot infer private actions, closure counters, Verify, Documentation, or points.',
    "- Shift 10 deliberately improves on the source's combined probe/clear limitation: the reviewed Test preserves and compares current state; only Repair clears stale state.",
    '- Shift 12 preserves the dangerous-operation boundary: recovery-state inspection is Test, firmware transfer/write is Repair, TFTP is transport rather than a Diagnostic Command, and post-write function is separately Verified.',
    '',
    '## Machine totals',
    '',
    `- Technical lines traced: ${trace.totals.traced_technical_lines}`,
    `- Research cases represented: ${trace.totals.sourced_cases}`,
    `- Atomic source-event citations: ${trace.totals.source_events_cited}`,
    '- Untraced technical lines: 0',
    '- Unsupported claims: 0',
    '- Hidden-truth disclosures: 0',
  );
  return `${lines.join('\n')}\n`;
}

async function emit(relativePath, contents) {
  const target = path.join(ROOT, relativePath);
  if (CHECK) {
    const current = await fs.readFile(target, 'utf8').catch(() => null);
    invariant(current !== null, `missing generated output ${relativePath}`);
    invariant(current === contents, `generated output is stale: ${relativePath}`);
    return;
  }
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, contents, 'utf8');
}

const inputEntries = await Promise.all(Object.entries(INPUTS).map(async ([key, relativePath]) => {
  const raw = await readRaw(relativePath);
  return [key, { raw, value: JSON.parse(raw) }];
}));
const loaded = Object.fromEntries(inputEntries);
const manifest = loaded.candidate_manifest.value;
const sourceCaseDirectory = path.join(ROOT, 'docs/case_studies/v0.2-story-expansion/cases');
const sourceCaseNames = await fs.readdir(sourceCaseDirectory);
const sourceCaseEntries = await Promise.all(loaded.research_registry.value.selected_cases.map(async (record) => {
  const filename = sourceCaseNames.find((name) => name.startsWith(`${record.case_id}--`) && name.endsWith('.md'));
  invariant(filename, `missing source-case reduction for ${record.case_id}`);
  const relativePath = path.posix.join('docs/case_studies/v0.2-story-expansion/cases', filename);
  const raw = await readRaw(relativePath);
  return { caseId: record.case_id, relativePath, raw, events: parseSourceEvents(record.case_id, raw) };
}));
const sourceEventsByCase = new Map(sourceCaseEntries.map((entry) => [entry.caseId, entry.events]));
const scriptEntries = await Promise.all(manifest.scripts.map(async (relativePath) => {
  const fullRelativePath = path.posix.join('content/story-v1/candidates/quiet-cascade-expansion-v3', relativePath);
  const raw = await readRaw(fullRelativePath);
  return { relativePath: fullRelativePath, raw, value: JSON.parse(raw) };
}));
const textRelativePath = path.posix.join('content/story-v1/candidates/quiet-cascade-expansion-v3', manifest.text_catalogs.en);
const textRaw = await readRaw(textRelativePath);
const texts = JSON.parse(textRaw);
const inputHashes = {
  ...Object.fromEntries(Object.entries(loaded).map(([key, entry]) => [key, sha256(entry.raw)])),
  candidate_texts: sha256(textRaw),
  candidate_scripts: Object.fromEntries(scriptEntries.map((entry) => [entry.relativePath, sha256(entry.raw)])),
  source_case_reductions: Object.fromEntries(sourceCaseEntries.map((entry) => [entry.relativePath, sha256(entry.raw)])),
};

const artifacts = buildReviewArtifacts({
  blueprint: loaded.blueprint.value,
  graphReport: loaded.graph_report.value,
  research: loaded.research_registry.value,
  domainProof: loaded.domain_proof.value,
  manifest,
  registry: loaded.candidate_registry.value,
  metadata: loaded.candidate_metadata.value,
  texts,
  scripts: scriptEntries.map((entry) => entry.value),
  sourceEventsByCase,
  inputHashes,
});

await Promise.all([
  emit(OUTPUTS.payload, stableJson(artifacts.payload)),
  emit(OUTPUTS.trace_json, stableJson(artifacts.trace)),
  emit(OUTPUTS.trace_md, renderTrace(artifacts.trace)),
  emit(OUTPUTS.choices, renderChoiceMap(artifacts.choices)),
  emit(OUTPUTS.continuity, renderContinuity({ blueprint: loaded.blueprint.value, payload: artifacts.payload })),
]);

console.log(JSON.stringify({
  check: CHECK,
  displayed_surfaces: artifacts.payload.totals.displayed_surfaces,
  technical_claims: artifacts.trace.totals.traced_technical_lines,
  sourced_cases: artifacts.trace.totals.sourced_cases,
  source_events_cited: artifacts.trace.totals.source_events_cited,
  choices: artifacts.choices.length,
  episodes: artifacts.payload.totals.episodes,
  routes: artifacts.payload.totals.routes,
  unresolved: 0,
}, null, 2));
