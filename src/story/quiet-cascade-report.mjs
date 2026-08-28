import { buildTicketsV3 } from '../builder/task-014.mjs';
import { createStoryState, reduceStory } from './index.mjs';

export const QUIET_CASCADE_AUTOMATED_CAMPAIGN_ID = 'task-027-quiet-cascade-v1';

const clone = (value) => structuredClone(value);

function selectedAttempt(result) {
  return result.attempts.find((attempt) => attempt.attempt_id === result.selected_attempt_id) ?? null;
}

function builderConfiguration(baseConfiguration, definition) {
  const shift = definition.shift_id.split('.').at(-1);
  return {
    ...clone(baseConfiguration),
    id: `builder.story.quiet_cascade.s${shift}`,
    scenario_or_mode_context: 'CAMPAIGN',
    requested_ticket_count: definition.requested_ticket_count,
    seed: definition.seed,
    allowed_fingerprint_ids: [...definition.allowed_fingerprint_ids],
    allow_duplicate_causal_fingerprints: false,
    progressive_difficulty_profile: {
      ...clone(baseConfiguration.progressive_difficulty_profile),
      profile_id: 'progressive.story.quiet_cascade.v1',
      profile_version: 'story-campaign-v1',
      bands: [{
        start_generated_index: 0,
        end_generated_index: definition.requested_ticket_count - 1,
        target: 2,
        minimum: 1,
        maximum: 4,
      }],
    },
  };
}

export function createQuietCascadeCampaignSettings(matchRegistry, baselineSettings) {
  const base = baselineSettings?.setting_groups?.[0];
  if (!base?.ticket_source?.builder_configuration) {
    throw new TypeError('Quiet Cascade proof requires the TASK-014 canonical Builder baseline.');
  }
  return {
    campaign_id: QUIET_CASCADE_AUTOMATED_CAMPAIGN_ID,
    harness_version: baselineSettings.harness_version,
    version_pins: clone(baselineSettings.version_pins),
    setting_groups: matchRegistry.matches.map((definition) => {
      const shift = definition.shift_id.split('.').at(-1);
      return {
        caps: {
          closures: definition.requested_ticket_count,
          policy_stall_consecutive_passes: null,
          turns: 220,
        },
        collaboration_mode: 'cooperative',
        description: `Canonical active-deck construction and seat-safe play proof for ${definition.match_ref}.`,
        fixture_kind: 'ORDINARY',
        legal_card_pool_ids: [matchRegistry.deck_policy.canonical_proof_deck_id],
        match_configuration: {
          ...clone(matchRegistry.match_profile),
          starting_ticket_count: definition.requested_ticket_count,
        },
        seats: clone(base.seats),
        seeds: [definition.seed],
        setting_group_id: `story-qc01-shift-${shift}`,
        ticket_source: {
          builder_configuration: builderConfiguration(base.ticket_source.builder_configuration, definition),
          source_type: 'generated',
        },
      };
    }),
  };
}

export function proveQuietCascadeBatches(matchRegistry, settings, catalogs) {
  return settings.setting_groups.map((group, index) => {
    const result = buildTicketsV3({
      configuration: clone(group.ticket_source.builder_configuration),
      catalogs,
    });
    const attempt = selectedAttempt(result);
    const definition = matchRegistry.matches[index];
    const matchRef = definition?.match_ref;
    const ticketDefinitionIds = attempt?.ticket_snapshots.map((ticket) => ticket.id) ?? [];
    const ticketSnapshotDigests = attempt?.ticket_snapshot_digests ?? [];
    const expectedIds = definition?.expected_ticket_definition_ids ?? [];
    const expectedDigests = definition?.expected_ticket_snapshot_digests ?? [];
    return {
      match_ref: matchRef,
      configuration_id: group.ticket_source.builder_configuration.id,
      seed: group.ticket_source.builder_configuration.seed,
      status: result.status,
      builder_result_id: result.id,
      selected_attempt_id: result.selected_attempt_id,
      ticket_definition_ids: ticketDefinitionIds,
      ticket_snapshot_digests: ticketSnapshotDigests,
      expected_ticket_definition_ids: [...expectedIds],
      expected_ticket_snapshot_digests: [...expectedDigests],
      exact_pin_match: result.status === 'SUCCESS'
        && JSON.stringify(ticketDefinitionIds) === JSON.stringify(expectedIds)
        && JSON.stringify(ticketSnapshotDigests) === JSON.stringify(expectedDigests),
      diagnostics: attempt?.diagnostics ?? [],
    };
  });
}

function locationKey(location) {
  return `${location.script_id}:${location.index}`;
}

function storyProgram(bundle) {
  const scripts = new Map(bundle.scripts.map((script) => [script.script_id, script]));
  const labels = new Map();
  for (const script of bundle.scripts) {
    script.statements.forEach((statement, index) => {
      if (statement.type === 'label') labels.set(statement.label_id, { script_id: script.script_id, index });
    });
  }
  const after = (location) => {
    const script = scripts.get(location.script_id);
    return location.index + 1 < script.statements.length
      ? { script_id: location.script_id, index: location.index + 1 }
      : null;
  };
  const target = (label) => labels.get(label) ?? null;
  const edges = (location) => {
    const statement = scripts.get(location.script_id).statements[location.index];
    const next = after(location);
    if (statement.type === 'jump') return [{ kind: 'JUMP', target: target(statement.label_id), label_id: statement.label_id }];
    if (statement.type === 'if') return [
      { kind: 'THEN', target: target(statement.then_label), label_id: statement.then_label },
      { kind: 'ELSE', target: target(statement.else_label), label_id: statement.else_label },
    ];
    if (statement.type === 'choice') return statement.options.map((option) => ({
      kind: 'OPTION', target: target(option.jump_label), label_id: option.jump_label, option_id: option.option_id,
    }));
    if (statement.type === 'start_match') return [{
      kind: 'MATCH_RETURN', target: target(statement.return_label), label_id: statement.return_label,
    }];
    if (statement.type === 'checkpoint') return [{
      kind: 'CHECKPOINT_RESUME', target: target(statement.resume_label), label_id: statement.resume_label,
    }];
    if (statement.type === 'call') return [
      { kind: 'CALL', target: target(statement.label_id), label_id: statement.label_id },
      ...(next ? [{ kind: 'RETURN_SITE', target: next }] : []),
    ];
    if (statement.type === 'return' || statement.type === 'end') return [];
    return next ? [{ kind: 'NEXT', target: next }] : [];
  };
  return { scripts, labels, edges };
}

function countBy(values, key) {
  const counts = {};
  for (const value of values) counts[value[key]] = (counts[value[key]] ?? 0) + 1;
  return counts;
}

export function analyzeQuietCascadeGraph(bundle) {
  const program = storyProgram(bundle);
  const entry = program.labels.get(bundle.manifest.entry_label);
  const reachable = new Set();
  const stack = entry ? [entry] : [];
  while (stack.length) {
    const location = stack.pop();
    const key = locationKey(location);
    if (reachable.has(key)) continue;
    reachable.add(key);
    program.edges(location).forEach((edge) => {
      if (edge.target) stack.push(edge.target);
    });
  }
  const colors = new Map();
  const cycleLocations = new Set();
  function visit(location) {
    const key = locationKey(location);
    if (colors.get(key) === 1) {
      cycleLocations.add(key);
      return;
    }
    if (colors.get(key) === 2) return;
    colors.set(key, 1);
    program.edges(location).forEach((edge) => {
      if (edge.target) visit(edge.target);
    });
    colors.set(key, 2);
  }
  if (entry) visit(entry);

  const statements = bundle.scripts.flatMap((script) => script.statements.map((statement, index) => ({
    script_id: script.script_id,
    index,
    statement,
  })));
  const refs = statements.flatMap(({ statement }) => {
    if (statement.type === 'jump' || statement.type === 'call') return [statement.label_id];
    if (statement.type === 'if') return [statement.then_label, statement.else_label];
    if (statement.type === 'choice') return statement.options.map((option) => option.jump_label);
    if (statement.type === 'checkpoint') return [statement.resume_label];
    if (statement.type === 'start_match') return [statement.return_label];
    return [];
  });
  const incoming = refs.reduce((counts, label) => {
    counts[label] = (counts[label] ?? 0) + 1;
    return counts;
  }, {});
  const checkpoints = statements.flatMap(({ statement }) => {
    if (statement.type === 'scene' && statement.checkpoint_id) return [{ checkpoint_id: statement.checkpoint_id, kind: 'SCENE' }];
    if (statement.type === 'checkpoint') return [{ checkpoint_id: statement.checkpoint_id, kind: 'EXPLICIT' }];
    if (statement.type === 'start_match') return [
      { checkpoint_id: statement.pre_match_checkpoint_id, kind: 'PRE_MATCH' },
      { checkpoint_id: statement.post_match_checkpoint_id, kind: 'POST_MATCH' },
    ];
    if (statement.type === 'end') return [{ checkpoint_id: statement.checkpoint_id, kind: 'END' }];
    return [];
  });
  const assets = new Set();
  const characters = new Set();
  statements.forEach(({ statement }) => {
    if (statement.type === 'scene') assets.add(statement.background_asset_id);
    if (statement.type === 'show' && statement.layer === 'transient') assets.add(statement.asset_id);
    if (statement.type === 'show' && statement.layer === 'characters') characters.add(statement.character_id);
  });
  const endings = statements.filter(({ statement }) => statement.type === 'end').map(({ script_id, index, statement }) => ({
    ending_id: statement.ending_id,
    checkpoint_id: statement.checkpoint_id,
    location: `${script_id}:${index}`,
  }));
  const choices = statements.filter(({ statement }) => statement.type === 'choice').map(({ statement }) => ({
    choice_id: statement.choice_id,
    option_ids: statement.options.map((option) => option.option_id),
    jump_labels: statement.options.map((option) => option.jump_label),
  }));
  const matches = statements.filter(({ statement }) => statement.type === 'start_match').map(({ statement }) => ({
    match_ref: statement.match_ref,
    return_label: statement.return_label,
    pre_match_checkpoint_id: statement.pre_match_checkpoint_id,
    post_match_checkpoint_id: statement.post_match_checkpoint_id,
  }));
  const labelRows = [...program.labels].map(([label_id, location]) => ({
    label_id,
    location: locationKey(location),
    reachable: reachable.has(locationKey(location)),
    incoming_references: incoming[label_id] ?? 0,
  }));
  return {
    report_version: 'story-graph-report-v1',
    pack_id: bundle.manifest.pack_id,
    entry_labels: [bundle.manifest.entry_label, ...bundle.manifest.library_entry_labels],
    counts: {
      scripts: bundle.scripts.length,
      statements: statements.length,
      labels: labelRows.length,
      scenes: statements.filter(({ statement }) => statement.type === 'scene').length,
      dialogue: statements.filter(({ statement }) => statement.type === 'say').length,
      narration: statements.filter(({ statement }) => statement.type === 'narrate').length,
      choices: choices.length,
      conditionals: statements.filter(({ statement }) => statement.type === 'if').length,
      matches: matches.length,
      checkpoints: checkpoints.length,
      calls: statements.filter(({ statement }) => statement.type === 'call').length,
      returns: statements.filter(({ statement }) => statement.type === 'return').length,
      terminal_statements: endings.length,
    },
    reachable_statement_count: reachable.size,
    unreachable_labels: labelRows.filter((row) => !row.reachable).map((row) => row.label_id),
    dead_ends: endings.map((ending) => ending.location),
    cycles: [...cycleLocations].sort(),
    convergence_labels: labelRows.filter((row) => row.incoming_references > 1),
    endings,
    unique_ending_ids: [...new Set(endings.map((ending) => ending.ending_id))].sort(),
    choices,
    matches,
    checkpoint_distribution: countBy(checkpoints, 'kind'),
    checkpoint_ids: checkpoints.map((checkpoint) => checkpoint.checkpoint_id),
    reachable_asset_ids: [...assets].sort(),
    reachable_character_ids: [...characters].sort(),
    labels: labelRows,
  };
}

const choiceOptions = Object.freeze({
  'choice.qc01.intake_context': ['package_provenance', 'prior_worklog'],
  'choice.qc01.mentor_question': ['reproduce_condition', 'discriminate_candidates'],
  'choice.qc01.record_policy': ['preserve_negative_results', 'lead_with_summary'],
  'choice.qc01.client_frame': ['verified_outcomes_first', 'bounded_uncertainty_first'],
});

function choiceCombinations() {
  const entries = Object.entries(choiceOptions);
  const combinations = [];
  for (let bits = 0; bits < 2 ** entries.length; bits += 1) {
    combinations.push(Object.fromEntries(entries.map(([choiceId, options], index) => [
      choiceId,
      options[(bits >> index) & 1],
    ])));
  }
  return combinations;
}

function routeMatchResult(routeId, match, completed) {
  const shift = match.shift_id.split('.').at(-1);
  const ticketCount = match.requested_ticket_count;
  return {
    schema_version: 'story-match-result-v1',
    result_id: `result.qc01.${routeId}.${shift}`,
    match_id: `match.qc01.${routeId}.${shift}`,
    match_ref: match.match_ref,
    completion: completed ? 'COMPLETED' : 'ABANDONED',
    valid: true,
    reason_codes: [completed ? 'QUEUE_EMPTY' : 'GIVE_UP'],
    story_service_points_gained: completed ? ticketCount * 2 : 0,
    tickets_closed: completed ? ticketCount : 0,
    tickets_given_up: completed ? 0 : ticketCount,
    documented_outcome: completed,
    verified_outcome: completed,
    contributions: {
      tests_run: completed ? ticketCount * 2 : 0,
      isolations_accepted: completed ? ticketCount : 0,
      repairs_performed: completed ? ticketCount : 0,
      verify_passes: completed ? ticketCount : 0,
      documentation_actions: completed ? ticketCount : 0,
    },
  };
}

function routeCompletion(band, matchIndex) {
  if (band === 'release') return true;
  if (band === 'bounded') return matchIndex < 4;
  return false;
}

export function traverseQuietCascadeRoutes(bundle, matchRegistry) {
  const matches = matchRegistry.matches;
  const routes = [];
  for (const [choiceIndex, choices] of choiceCombinations().entries()) {
    for (const band of ['release', 'bounded', 'hold']) {
      const routeId = `${band}.${String(choiceIndex).padStart(2, '0')}`;
      let state = createStoryState(bundle);
      let transition = reduceStory(state, { type: 'BEGIN' }, bundle);
      state = transition.state;
      const effects = [...transition.effects];
      const speakerVisibilityViolations = [];
      let steps = 1;
      while (state.status !== 'COMPLETE' && steps < 1000) {
        if (state.current_statement?.type === 'say') {
          const dialogue = state.display.screens.dialogue;
          if (!state.display.characters.some((character) => character.character_id === dialogue.speaker_key)) {
            speakerVisibilityViolations.push(dialogue.statement_id);
          }
        }
        if (state.status === 'AWAITING_MATCH') {
          const matchIndex = matches.findIndex((match) => match.match_ref === state.pending_match.match_ref);
          transition = reduceStory(state, {
            type: 'ACCEPT_MATCH_RESULT',
            result: routeMatchResult(routeId, matches[matchIndex], routeCompletion(band, matchIndex)),
          }, bundle);
        } else if (state.current_statement?.type === 'choice') {
          const choiceId = state.display.screens.choices.choice_id;
          transition = reduceStory(state, { type: 'CHOOSE', option_id: choices[choiceId] }, bundle);
        } else {
          transition = reduceStory(state, { type: 'ADVANCE' }, bundle);
        }
        state = transition.state;
        effects.push(...transition.effects);
        steps += 1;
      }
      if (state.status !== 'COMPLETE') throw new Error(`Route ${routeId} did not terminate.`);
      routes.push({
        route_id: `route.qc01.${routeId}`,
        requested_band: band,
        choices,
        ending_id: state.ending_id,
        story_service_points: state.story_service_points,
        steps,
        match_results: state.match_results.map((result) => ({
          match_ref: result.match_ref,
          completion: result.completion,
          story_service_points_gained: result.story_service_points_gained,
        })),
        branch_history: state.branch_history,
        checkpoint_effect_count: effects.filter((effect) => effect.type === 'PERSIST_CHECKPOINT').length,
        start_match_effect_count: effects.filter((effect) => effect.type === 'START_MATCH').length,
        speaker_visibility_violations: [...new Set(speakerVisibilityViolations)],
        final_digest: transition.digest,
        transcript: state.display.screens.transcript,
      });
    }
  }
  return routes;
}

export function summarizeQuietCascadeRoutes(routes) {
  const edgeCoverage = {
    choices: {},
    match_completion: {},
    endings: {},
  };
  for (const route of routes) {
    for (const [choiceId, optionId] of Object.entries(route.choices)) {
      edgeCoverage.choices[choiceId] ??= {};
      edgeCoverage.choices[choiceId][optionId] = (edgeCoverage.choices[choiceId][optionId] ?? 0) + 1;
    }
    for (const result of route.match_results) {
      edgeCoverage.match_completion[result.match_ref] ??= {};
      edgeCoverage.match_completion[result.match_ref][result.completion] =
        (edgeCoverage.match_completion[result.match_ref][result.completion] ?? 0) + 1;
    }
    edgeCoverage.endings[route.ending_id] = (edgeCoverage.endings[route.ending_id] ?? 0) + 1;
  }
  return {
    route_report_version: 'story-route-report-v1',
    route_count: routes.length,
    deterministic_digest_count: new Set(routes.map((route) => route.final_digest)).size,
    edge_coverage: edgeCoverage,
    routes: routes.map(({ transcript, ...route }) => route),
  };
}

export function renderQuietCascadeGraphReport(report) {
  const endingLines = report.unique_ending_ids.map((id) => `- \`${id}\``).join('\n');
  const matchLines = report.matches.map((match) =>
    `- \`${match.match_ref}\` → \`${match.return_label}\``).join('\n');
  return `# Quiet Cascade generated graph report

Generated from the declarative Story pack. The JSON companion is authoritative for exact inventories.

## Inventory

- Entry labels: ${report.entry_labels.map((id) => `\`${id}\``).join(', ')}
- Scripts: ${report.counts.scripts}
- Statements: ${report.counts.statements}
- Labels: ${report.counts.labels}
- Scenes: ${report.counts.scenes}
- Dialogue / narration: ${report.counts.dialogue} / ${report.counts.narration}
- Choices / conditions: ${report.counts.choices} / ${report.counts.conditionals}
- Match nodes: ${report.counts.matches}
- Checkpoints: ${report.counts.checkpoints}
- Reachable statements: ${report.reachable_statement_count}
- Unreachable labels: ${report.unreachable_labels.length}
- Undeclared cycles: ${report.cycles.length}
- Calls / returns: ${report.counts.calls} / ${report.counts.returns}

## Endings

${endingLines}

Every score gate has a lower-band fallback. The six terminal variants preserve the remembered client-framing choice while resolving to three outcome IDs.

## Match returns

${matchLines}

Each Match owns a pre-Match and post-Match durable checkpoint through the \`start_match\` statement. No explicit checkpoint jumps wrap the boundary.

## Production reachability

- Background and transient IDs: ${report.reachable_asset_ids.length}
- Established characters: ${report.reachable_character_ids.length}
- Convergence labels: ${report.convergence_labels.length}
- Dead ends: ${report.dead_ends.length}, all terminal \`end\` statements
`;
}

export function renderQuietCascadeTranscripts(routes) {
  const selected = ['release', 'bounded', 'hold'].map((band) =>
    routes.find((route) => route.requested_band === band && route.route_id.endsWith('.00')));
  const sections = selected.map((route) => {
    const choiceLines = Object.entries(route.choices)
      .map(([choiceId, optionId]) => `- \`${choiceId}\` → \`${optionId}\``).join('\n');
    const matchLines = route.match_results
      .map((result) => `- \`${result.match_ref}\`: ${result.completion}, +${result.story_service_points_gained} Story Service Points`).join('\n');
    const lines = route.transcript.map((entry) => entry.kind === 'NARRATION'
      ? `*${entry.text}*`
      : `**${entry.speaker_text}:** ${entry.text}`);
    return `## ${route.ending_id}\n\nRoute \`${route.route_id}\`; ${route.story_service_points} Story Service Points; ${route.steps} Story intents.\n\n### Remembered choices\n\n${choiceLines}\n\n### Normalized Match returns\n\n${matchLines}\n\n### Dialogue and narration\n\n${lines.join('\n\n')}`;
  });
  return `# Quiet Cascade canonical route transcripts

These generated editorial transcripts exercise one deterministic route for each ending band. The route matrix covers every option of every remembered choice and both completion states for every Match.

${sections.join('\n\n')}
`;
}
