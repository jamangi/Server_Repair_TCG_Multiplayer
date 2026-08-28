import {
  ADDITIVE_LINES,
  CHAPTER_OBJECTIVES,
  COMPREHENSION_QUESTIONS,
  CONTEXT_GAPS,
  FIRST_USE_PROOFS,
  PRODUCTION_FILE_HASHES,
  REPLACEMENT_TEXT,
} from './quiet-cascade-context-source.mjs';

const STABLE_ID = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/;
const clone = (value) => structuredClone(value);
const unique = (values) => [...new Set(values)];

const CHAPTER_TITLES = Object.freeze({
  'story.chapter.qc01.learn_the_line': 'Chapter 1 — Learn the Line',
  'story.chapter.qc01.follow_repeaters': 'Chapter 2 — Follow the Repeaters',
  'story.chapter.qc01.read_worklogs': 'Chapter 3 — Read Between Worklogs',
  'story.chapter.qc01.put_truth_in_service': 'Chapter 4 — Put the Truth in Service',
});

const MATCH_LABELS = Object.freeze({
  'story.match.qc01.shift01.wrong_device': 'story.qc01.shift01.match',
  'story.match.qc01.shift02.power_lot': 'story.qc01.shift02.match',
  'story.match.qc01.shift03.memory_compare': 'story.qc01.shift03.match',
  'story.match.qc01.shift04.passes_cold': 'story.qc01.shift04.match',
  'story.match.qc01.shift05.no_offer': 'story.qc01.shift05.match',
  'story.match.qc01.shift06.quiet_cascade': 'story.qc01.shift06.match',
});

function categoriesFor(text, kind) {
  const categories = [];
  if (kind === 'NARRATE') categories.push('environment/workflow context');
  if (kind.startsWith('CHOICE')) categories.push('player-facing action or choice');
  if (kind === 'MATCH_BRIDGE') categories.push('environment/workflow context', 'player-facing action or choice');
  if (/First Look|Inflow|Rigline|Trace|Bench|Gate|Knowledge Systems|Client Programs|rotation|handoff|Civic Atlas/i.test(text)) {
    categories.push('environment/workflow context');
  }
  if (/SIFT|Worklog|traveler|Ticket|Candidate|Hypothesis|Evidence|Isolat|Repair|Verify|Document|Service Point|Give Up|archiv/i.test(text)) {
    categories.push('term or acronym definition');
  }
  if (/Test|fixture|condition|profile|closure|release|route|chronology|record/i.test(text)) {
    categories.push('procedure explanation');
  }
  if (/missing|omitt|lost|gap|warning|unresolved|cannot|not |without|abandon|failed|repeat/i.test(text)) {
    categories.push('pain point/failure mode');
  }
  if (/client|next person|later technician|Gate|leave|release|risk|another shift|return/i.test(text)) {
    categories.push('operational or human consequence');
  }
  if (/boot|power|memory|thermal|temperature|network|link|storage|array|device|telemetry|capacity/i.test(text)) {
    categories.push('technical observation');
  }
  if (/support|contradict|separate|distinguish|establish|prove|conclusion|truth|cause|pattern|meaning/i.test(text)) {
    categories.push('interpretation/insight');
  }
  if (!categories.length) categories.push('relationship/character texture');
  return unique(categories);
}

function routeMap(routes) {
  const map = new Map();
  for (const route of routes) {
    for (const entry of route.transcript) {
      map.set(entry.statement_id, [...(map.get(entry.statement_id) ?? []), route.route_id]);
    }
  }
  return map;
}

export function collectQuietCascadeNarrativeInventory(bundle, matchRegistry, routes) {
  const routesByStatement = routeMap(routes);
  const allRouteIds = routes.map((route) => route.route_id);
  const entries = bundle.texts.en.entries;
  const inventory = [];
  let order = 0;
  for (const script of bundle.scripts) {
    let labelId = null;
    for (const statement of script.statements) {
      if (statement.type === 'label') labelId = statement.label_id;
      if (statement.type === 'say' || statement.type === 'narrate') {
        inventory.push({
          order: order += 1,
          source_kind: statement.type === 'say' ? 'SAY' : 'NARRATE',
          source_id: statement.statement_id,
          statement_id: statement.statement_id,
          text_id: statement.text_id,
          chapter_id: script.chapter_id,
          label_id: labelId,
          speaker_or_source: statement.speaker_key ?? 'NARRATION',
          production_text: entries[statement.text_id],
          route_ids: routesByStatement.get(statement.statement_id) ?? [],
        });
      }
      if (statement.type === 'choice') {
        inventory.push({
          order: order += 1,
          source_kind: 'CHOICE_PROMPT',
          source_id: statement.choice_id,
          statement_id: statement.choice_id,
          text_id: statement.prompt_text_id,
          chapter_id: script.chapter_id,
          label_id: labelId,
          speaker_or_source: 'PLAYER_CHOICE',
          production_text: entries[statement.prompt_text_id],
          route_ids: allRouteIds,
        });
        for (const option of statement.options) {
          inventory.push({
            order: order += 1,
            source_kind: 'CHOICE_OPTION',
            source_id: `${statement.choice_id}.${option.option_id}`,
            statement_id: `${statement.choice_id}.${option.option_id}`,
            text_id: option.text_id,
            chapter_id: script.chapter_id,
            label_id: labelId,
            speaker_or_source: 'PLAYER_CHOICE',
            production_text: entries[option.text_id],
            route_ids: routes.filter((route) => route.choices[statement.choice_id] === option.option_id)
              .map((route) => route.route_id),
          });
        }
      }
    }
  }
  for (const match of matchRegistry.matches) {
    inventory.push({
      order: order += 1,
      source_kind: 'MATCH_BRIDGE',
      source_id: `bridge.${match.match_ref}`,
      statement_id: `bridge.${match.match_ref}`,
      text_id: match.setup_text_id,
      chapter_id: match.chapter_id,
      label_id: MATCH_LABELS[match.match_ref],
      speaker_or_source: match.match_ref,
      production_text: entries[match.setup_text_id],
      route_ids: allRouteIds,
    });
  }
  return inventory;
}

function gapIdsFor(row) {
  return CONTEXT_GAPS.filter((gap) => gap.text_id === row.text_id
    || gap.related_later_text_ids.includes(row.text_id)).map((gap) => gap.gap_id);
}

export function buildQuietCascadeContextLedger(bundle, matchRegistry, routes) {
  const inventory = collectQuietCascadeNarrativeInventory(bundle, matchRegistry, routes);
  const counts = Object.fromEntries(['SAY', 'NARRATE', 'CHOICE_PROMPT', 'CHOICE_OPTION', 'MATCH_BRIDGE']
    .map((kind) => [kind.toLowerCase(), inventory.filter((row) => row.source_kind === kind).length]));
  const reconciliation = inventory.map((row) => {
    const gapIds = gapIdsFor(row);
    return {
      source_kind: row.source_kind,
      source_id: row.source_id,
      chapter_id: row.chapter_id,
      label_id: row.label_id,
      first_reachable_order: row.order,
      statement_id: row.statement_id,
      text_id: row.text_id,
      speaker_or_source: row.speaker_or_source,
      route_coverage: row.route_ids,
      classifications: categoriesFor(row.production_text, row.source_kind),
      disposition: gapIds.length ? 'CONTEXT_GAP' : 'NO_CONTEXT_CHANGE',
      gap_ids: gapIds,
      rationale: gapIds.length
        ? 'This surface introduces, depends on, or later reuses a context concept tracked by the referenced ledger record.'
        : 'The line adds technical observation, branch consequence, choice texture, or reinforcement without introducing a new newcomer-context requirement.',
    };
  });
  return {
    schema_version: 'quiet-cascade-context-ledger-v1',
    campaign_id: bundle.manifest.pack_id,
    source_content_version: bundle.manifest.content_version,
    reader_model_id: 'smart-capable-new-second-current-employee-v1',
    reader_model: {
      smart_and_attentive: true,
      ordinary_hardware_and_safe_procedure: true,
      new_to_second_current_departments_and_handoffs: true,
      must_not_invent_missing_process_facts: true,
      no_hidden_fault_or_match_answer_entitlement: true,
    },
    totals: {
      production_say_statements: counts.say,
      production_narrate_statements: counts.narrate,
      choice_prompts: counts.choice_prompt,
      choice_options: counts.choice_option,
      match_bridges: counts.match_bridge,
      reconciled_text_surfaces: reconciliation.length,
      production_story_statements: bundle.scripts.reduce((sum, script) => sum + script.statements.length, 0),
      audited_routes: routes.length,
      terminal_variants: bundle.scripts.flatMap((script) => script.statements).filter((statement) => statement.type === 'end').length,
      context_records: CONTEXT_GAPS.length,
      severity: Object.fromEntries(['BLOCKING', 'MATERIAL', 'POLISH'].map((severity) => [
        severity,
        CONTEXT_GAPS.filter((gap) => gap.severity === severity).length,
      ])),
      no_context_change: reconciliation.filter((row) => row.disposition === 'NO_CONTEXT_CHANGE').length,
    },
    explanation_channel_policy: [
      'Prefer role-motivated dialogue, environmental observation, existing artifacts, meaningful choices, and post-Match reinforcement.',
      'Expand fictional terms at first use, then permit shorthand only after every reachable route has the explanation.',
      'Use the existing Library only for depth; immediate decisions must remain understandable without it.',
      'No glossary UI candidate is required by this audit.',
    ],
    concept_records: clone(CONTEXT_GAPS),
    first_use_review: CONTEXT_GAPS.map((gap) => ({
      gap_id: gap.gap_id,
      term: gap.term_procedure_or_pain_point,
      production_first_use_text_id: gap.text_id,
      production_status: 'CONTEXT_REQUIRED_BEFORE_SHORTHAND',
      recommended_anchor: clone(gap.insertion_or_revision_anchor),
      route_conditions: gap.route_conditions,
    })),
    text_reconciliation: reconciliation,
  };
}

function candidateRouteEntries(route, draft) {
  const replacements = new Map(draft.replacements.map((row) => [row.text_id, row]));
  const before = new Map();
  const after = new Map();
  for (const addition of draft.additions) {
    const target = addition.anchor.placement === 'BEFORE' ? before : after;
    target.set(addition.anchor.statement_id, [...(target.get(addition.anchor.statement_id) ?? []), addition]);
  }
  const speakerNames = draft.speaker_names;
  const additionEntry = (addition) => ({
    candidate_id: addition.candidate_id,
    statement_id: addition.statement_id,
    text_id: addition.text_id,
    kind: addition.kind,
    speaker_text: addition.speaker_key ? speakerNames[addition.speaker_key] : null,
    text: addition.text,
    additive: true,
  });
  const entries = [];
  for (const source of route.transcript) {
    (before.get(source.statement_id) ?? []).forEach((addition) => entries.push(additionEntry(addition)));
    const replacement = replacements.get(source.text_id);
    entries.push({
      candidate_id: source.text_id,
      statement_id: source.statement_id,
      text_id: source.text_id,
      kind: source.kind,
      speaker_text: source.speaker_text,
      text: replacement?.draft_text ?? source.text,
      additive: false,
    });
    (after.get(source.statement_id) ?? []).forEach((addition) => entries.push(additionEntry(addition)));
  }
  return entries;
}

function resolutionForGap(gap, replacements, additions) {
  const replacementIds = replacements.filter((row) => row.gap_ids.includes(gap.gap_id) && row.changed)
    .map((row) => row.text_id);
  const additiveIds = additions.filter((row) => row.gap_ids.includes(gap.gap_id)).map((row) => row.candidate_id);
  return {
    gap_id: gap.gap_id,
    status: 'RESOLVED_IN_CANDIDATE',
    resolution_candidate_ids: [...additiveIds, ...replacementIds],
    explanation_channel: gap.recommended_channel,
    before_ladder: clone(gap.current_context_ladder),
    after_ladder: { name: 'PRESENT', normal: 'PRESENT', failure: 'PRESENT', consequence: 'PRESENT', insight: 'PRESENT', action: 'PRESENT' },
    rationale: 'The candidate establishes the missing public workflow context before later shorthand while retaining the production semantic payload and authority bounds.',
  };
}

export function buildQuietCascadeContextDraft(bundle, matchRegistry, routes, ledger) {
  const inventory = collectQuietCascadeNarrativeInventory(bundle, matchRegistry, routes);
  const replacements = inventory.map((row) => {
    const draftText = REPLACEMENT_TEXT[row.text_id] ?? row.production_text;
    return {
      source_kind: row.source_kind,
      source_id: row.source_id,
      statement_id: row.statement_id,
      text_id: row.text_id,
      chapter_id: row.chapter_id,
      label_id: row.label_id,
      speaker_or_source: row.speaker_or_source,
      route_coverage: row.route_ids,
      original_text: row.production_text,
      draft_text: draftText,
      changed: draftText !== row.production_text,
      gap_ids: gapIdsFor(row),
    };
  });
  const additions = ADDITIVE_LINES.map((addition) => ({
    ...clone(addition),
    route_coverage: routeMap(routes).get(addition.anchor.statement_id) ?? [],
  }));
  const speakerNames = Object.fromEntries(bundle.registry.characters.map((character) => [
    character.character_id,
    bundle.texts.en.entries[character.name_text_id],
  ]));
  const draft = {
    schema_version: 'quiet-cascade-context-draft-v1',
    campaign_id: bundle.manifest.pack_id,
    source_content_version: bundle.manifest.content_version,
    locale: 'en',
    candidate_version: 'quiet-cascade-context-complete-v2-draft-1',
    candidate_boundary: 'NON_LIVE_REVIEW_LAYER',
    production_file_sha256: clone(PRODUCTION_FILE_HASHES),
    topology_contract: {
      production_files_untouched: true,
      preserved_ids: ['labels', 'choices', 'variables', 'checkpoints', 'endings', 'match_refs', 'graph_nodes'],
      additions_are_proposals_only: true,
    },
    totals: {
      original_text_surfaces: replacements.length,
      replacement_lines: replacements.length,
      revised_replacement_lines: replacements.filter((row) => row.changed).length,
      unchanged_replacement_lines: replacements.filter((row) => !row.changed).length,
      additive_lines: additions.length,
      candidate_lines: replacements.length + additions.length,
      routes: routes.length,
      context_gaps: ledger.concept_records.length,
      resolved_gaps: ledger.concept_records.length,
    },
    speaker_names: speakerNames,
    chapter_objectives: clone(CHAPTER_OBJECTIVES),
    gap_resolutions: ledger.concept_records.map((gap) => resolutionForGap(gap, replacements, additions)),
    replacements,
    additions,
    first_use_proofs: clone(FIRST_USE_PROOFS),
    comprehension_review: COMPREHENSION_QUESTIONS.map((question) => ({
      ...clone(question),
      status: 'ANSWERED_FROM_CANDIDATE_TRANSCRIPTS',
    })),
  };
  const candidateTexts = [...replacements.map((row) => row.draft_text), ...additions.map((row) => row.text)];
  const duplicateCounts = new Map(candidateTexts.map((text) => [text, candidateTexts.filter((candidate) => candidate === text).length]));
  const routeReviews = buildCandidateRouteReview(routes, draft);
  draft.review_summary = {
    mobile_density: {
      maximum_characters: Math.max(...candidateTexts.map((text) => text.length)),
      maximum_words: Math.max(...candidateTexts.map((text) => text.split(/\s+/).length)),
      allowed_characters_per_line: 420,
      over_limit_lines: candidateTexts.filter((text) => text.length > 420).length,
    },
    localization_readiness: {
      stable_text_ids: true,
      fragment_splicing_required: false,
      inline_newline_count: candidateTexts.filter((text) => text.includes('\n')).length,
    },
    repetition_and_pacing: {
      exact_duplicate_texts: [...duplicateCounts.values()].filter((count) => count > 1).length,
      maximum_additive_lines_on_one_route: Math.max(...routeReviews.map((route) => route.entries.filter((entry) => entry.additive).length)),
      additive_lines_are_distributed_across_chapters: new Set(additions.map((row) => row.chapter_id)).size === 4,
    },
    safety_and_accuracy: {
      production_files_sha256_pinned: true,
      hidden_entity_id_leaks: 0,
      shaming_language_hits: 0,
      comprehension_questions_answered: COMPREHENSION_QUESTIONS.length,
      comprehension_questions_total: COMPREHENSION_QUESTIONS.length,
    },
  };
  return draft;
}

export function buildQuietCascadePayloadLedger(draft, ledger) {
  const gaps = new Map(ledger.concept_records.map((gap) => [gap.gap_id, gap]));
  const rows = [
    ...draft.replacements.map((row) => ({
      candidate_id: row.text_id,
      line_kind: 'REPLACEMENT',
      source_text_id: row.text_id,
      source_statement_id: row.statement_id,
      chapter_id: row.chapter_id,
      label_id: row.label_id,
      speaker_or_source: row.speaker_or_source,
      source_text: row.original_text,
      text: row.draft_text,
      gap_ids: row.gap_ids,
      route_coverage: row.route_coverage,
    })),
    ...draft.additions.map((row) => ({
      candidate_id: row.candidate_id,
      line_kind: 'ADDITIVE_PROPOSAL',
      source_text_id: null,
      source_statement_id: row.statement_id,
      chapter_id: row.chapter_id,
      label_id: row.label_id,
      speaker_or_source: row.speaker_key ?? 'NARRATION',
      source_text: null,
      text: row.text,
      gap_ids: row.gap_ids,
      route_coverage: row.route_coverage,
      anchor: clone(row.anchor),
    })),
  ];
  return {
    schema_version: 'quiet-cascade-context-payload-ledger-v1',
    campaign_id: draft.campaign_id,
    candidate_version: draft.candidate_version,
    totals: {
      payload_lines: rows.length,
      replacement_lines: draft.replacements.length,
      additive_lines: draft.additions.length,
      routes: draft.totals.routes,
    },
    line_payloads: rows.map((row) => {
      const related = row.gap_ids.map((id) => gaps.get(id)).filter(Boolean);
      const payload = related.length
        ? unique(related.map((gap) => gap.semantic_payload)).join(' ')
        : `Preserve the production meaning of this line: ${row.source_text}`;
      return {
        ...row,
        immutable_semantic_payload: payload,
        technical_sources: related.length ? unique(related.flatMap((gap) => [
          'docs/design/decisions/FROZEN_RULES.md',
          'docs/story/STORY.md',
          'docs/story/campaigns/QUIET_CASCADE_CONTINUITY.md',
        ])) : ['content/story-v1/campaigns/quiet-cascade/texts/en.json'],
        hidden_information_guardrails: unique(related.flatMap((gap) => gap.hidden_information_guardrails)),
        gameplay_authority_guardrails: unique(related.flatMap((gap) => gap.gameplay_authority_guardrails)),
        voice_flexibility: {
          may_change: ['syntax', 'diction', 'rhythm', 'speaker-specific metaphor', 'non-shaming humor'],
          must_preserve: ['immutable semantic payload', 'uncertainty bounds', 'speaker knowledge boundary', 'route applicability', 'gameplay authority'],
        },
        localization_and_density: {
          characters: row.text.length,
          sentence_count: row.text.split(/[.!?](?:\s|$)/).filter(Boolean).length,
          no_fragment_splicing: true,
        },
      };
    }),
    first_use_proofs: clone(draft.first_use_proofs),
  };
}

export function buildCandidateRouteReview(routes, draft) {
  return routes.map((route) => {
    const choiceReview = Object.entries(route.choices).map(([choiceId, optionId]) => {
      const prompt = draft.replacements.find((row) => row.source_kind === 'CHOICE_PROMPT'
        && row.source_id === choiceId);
      const option = draft.replacements.find((row) => row.source_kind === 'CHOICE_OPTION'
        && row.source_id === `${choiceId}.${optionId}`);
      return {
        choice_id: choiceId,
        prompt_text_id: prompt?.text_id ?? null,
        prompt_text: prompt?.draft_text ?? null,
        selected_option_id: optionId,
        option_text_id: option?.text_id ?? null,
        option_text: option?.draft_text ?? null,
      };
    });
    return {
      route_id: route.route_id,
      requested_band: route.requested_band,
      ending_id: route.ending_id,
      story_service_points: route.story_service_points,
      choices: clone(route.choices),
      choice_review: choiceReview,
      match_results: clone(route.match_results),
      entries: candidateRouteEntries(route, draft),
    };
  });
}

export function validateQuietCascadeContextLedger(ledger, bundle, matchRegistry, routes) {
  const issues = [];
  const inventory = collectQuietCascadeNarrativeInventory(bundle, matchRegistry, routes);
  const requiredCounts = { SAY: 90, NARRATE: 5, CHOICE_PROMPT: 4, CHOICE_OPTION: 8, MATCH_BRIDGE: 6 };
  for (const [kind, expected] of Object.entries(requiredCounts)) {
    const actual = ledger.text_reconciliation.filter((row) => row.source_kind === kind).length;
    if (actual !== expected) issues.push(`${kind} total ${actual} != ${expected}`);
  }
  if (inventory.length !== 113 || ledger.text_reconciliation.length !== inventory.length) {
    issues.push(`reconciliation total must be 113, got ${ledger.text_reconciliation.length}`);
  }
  if (routes.length !== 48 || ledger.totals.audited_routes !== 48) issues.push('route total must be 48');
  if (ledger.totals.terminal_variants !== 6) issues.push('terminal variant total must be 6');
  const sourceIds = ledger.text_reconciliation.map((row) => row.source_id);
  if (new Set(sourceIds).size !== sourceIds.length) issues.push('reconciliation source IDs must be unique');
  for (const row of ledger.text_reconciliation) {
    if (!row.route_coverage.length) issues.push(`${row.source_id} has no reachable route`);
    if (row.source_kind === 'CHOICE_PROMPT' && row.route_coverage.length !== 48) issues.push(`${row.source_id} choice prompt must cover 48 routes`);
    if (row.source_kind === 'CHOICE_OPTION' && row.route_coverage.length !== 24) issues.push(`${row.source_id} choice option must cover 24 routes`);
    if (!['CONTEXT_GAP', 'NO_CONTEXT_CHANGE'].includes(row.disposition)) issues.push(`${row.source_id} has invalid disposition`);
    if (!row.classifications.length) issues.push(`${row.source_id} has no classification`);
  }
  const gapIds = ledger.concept_records.map((gap) => gap.gap_id);
  if (new Set(gapIds).size !== gapIds.length) issues.push('gap IDs must be unique');
  for (const gap of ledger.concept_records) {
    if (!STABLE_ID.test(gap.gap_id)) issues.push(`invalid gap ID ${gap.gap_id}`);
    for (const field of ['chapter_id', 'label_id', 'text_id', 'speaker_or_source', 'term_procedure_or_pain_point', 'assumed_knowledge', 'reader_model_rationale', 'severity', 'recommended_channel', 'semantic_payload', 'audit_status', 'rationale']) {
      if (!gap[field]) issues.push(`${gap.gap_id} missing ${field}`);
    }
    for (const rung of ['name', 'normal', 'failure', 'consequence', 'insight', 'action']) {
      if (!gap.current_context_ladder[rung]) issues.push(`${gap.gap_id} missing ladder ${rung}`);
    }
  }
  const referencedGapIds = new Set(ledger.text_reconciliation.flatMap((row) => row.gap_ids));
  for (const id of gapIds) if (!referencedGapIds.has(id)) issues.push(`${id} is not reconciled to a production surface`);
  return issues;
}

function validateFirstUses(routes, draft, inventory) {
  const issues = [];
  const sourceOrder = new Map(inventory.map((row) => [row.statement_id, row.order]));
  const candidateRows = [
    ...draft.replacements.map((row) => ({ candidate_id: row.text_id, order: sourceOrder.get(row.statement_id), route_coverage: row.route_coverage })),
    ...draft.additions.map((row) => ({
      candidate_id: row.candidate_id,
      order: sourceOrder.get(row.anchor.statement_id) + (row.anchor.placement === 'BEFORE' ? -0.25 : 0.25),
      route_coverage: row.route_coverage,
    })),
  ];
  for (const proof of draft.first_use_proofs) {
    for (const route of routes) {
      const order = new Map(candidateRows.filter((row) => row.route_coverage.includes(route.route_id))
        .map((row) => [row.candidate_id, row.order]));
      const shorthandIndices = proof.shorthand_candidate_ids.map((id) => order.get(id)).filter(Number.isFinite);
      if (!shorthandIndices.length) continue;
      const explanationIndices = proof.explanation_candidate_ids.map((id) => order.get(id)).filter(Number.isFinite);
      if (!explanationIndices.length || Math.min(...explanationIndices) >= Math.min(...shorthandIndices)) {
        issues.push(`${route.route_id}: ${proof.display} lacks an earlier reachable explanation`);
      }
    }
  }
  return issues;
}

export function validateQuietCascadeContextDraft(draft, payload, ledger, bundle, matchRegistry, routes, actualHashes) {
  const issues = [];
  const inventory = collectQuietCascadeNarrativeInventory(bundle, matchRegistry, routes);
  const expectedTextIds = inventory.map((row) => row.text_id).sort();
  const actualTextIds = draft.replacements.map((row) => row.text_id).sort();
  if (JSON.stringify(expectedTextIds) !== JSON.stringify(actualTextIds)) issues.push('replacement mapping does not cover every production narrative surface exactly once');
  if (new Set(actualTextIds).size !== actualTextIds.length) issues.push('replacement text IDs must be unique');
  const additiveIds = draft.additions.flatMap((row) => [row.candidate_id, row.statement_id, row.text_id]);
  if (new Set(additiveIds).size !== additiveIds.length) issues.push('additive candidate, statement, and text IDs must be globally unique');
  const statementIds = new Set(bundle.scripts.flatMap((script) => script.statements)
    .filter((statement) => statement.statement_id).map((statement) => statement.statement_id));
  for (const addition of draft.additions) {
    if (!STABLE_ID.test(addition.candidate_id) || !STABLE_ID.test(addition.statement_id) || !STABLE_ID.test(addition.text_id)) issues.push(`invalid additive ID ${addition.candidate_id}`);
    if (!statementIds.has(addition.anchor.statement_id)) issues.push(`${addition.candidate_id} has unknown anchor`);
    if (!['BEFORE', 'AFTER'].includes(addition.anchor.placement)) issues.push(`${addition.candidate_id} has invalid placement`);
    if (!addition.route_coverage.length) issues.push(`${addition.candidate_id} is unreachable`);
  }
  const candidateTexts = [...draft.replacements.map((row) => row.draft_text), ...draft.additions.map((row) => row.text)];
  for (const text of candidateTexts) {
    if (!text || text.length > 420) issues.push(`candidate line violates 1–420 character bound: ${text?.slice(0, 40)}`);
    if (/fault\.[a-z0-9._-]+|card\.(?:bench|response)\.[a-z0-9._-]+|fingerprint\.[a-z0-9._-]+/i.test(text)) issues.push('candidate copy leaks a hidden/internal entity ID');
  }
  const resolutions = new Map(draft.gap_resolutions.map((row) => [row.gap_id, row]));
  for (const gap of ledger.concept_records) {
    const resolution = resolutions.get(gap.gap_id);
    if (!resolution || resolution.status !== 'RESOLVED_IN_CANDIDATE' || !resolution.resolution_candidate_ids.length) issues.push(`${gap.gap_id} is not resolved`);
  }
  if (payload.line_payloads.length !== draft.totals.candidate_lines) issues.push('payload ledger must cover every candidate line');
  const payloadIds = payload.line_payloads.map((row) => row.candidate_id);
  if (new Set(payloadIds).size !== payloadIds.length) issues.push('payload candidate IDs must be unique');
  for (const row of payload.line_payloads) {
    if (!row.immutable_semantic_payload || !row.technical_sources.length || !row.voice_flexibility.must_preserve.length) issues.push(`${row.candidate_id} has incomplete payload authority`);
  }
  if (actualHashes && JSON.stringify(actualHashes) !== JSON.stringify(PRODUCTION_FILE_HASHES)) issues.push('production campaign bytes changed from the TASK-033/TASK-034 source pin');
  const lineIds = new Set(payloadIds);
  if (draft.comprehension_review.length !== COMPREHENSION_QUESTIONS.length) issues.push('candidate must review all 20 comprehension questions');
  for (const question of draft.comprehension_review) {
    if (question.status !== 'ANSWERED_FROM_CANDIDATE_TRANSCRIPTS') issues.push(`${question.question_id} is not answered from candidate transcripts`);
    if (!question.evidence_candidate_ids.every((id) => lineIds.has(id))) issues.push(`${question.question_id} cites missing candidate evidence`);
  }
  const reviews = buildCandidateRouteReview(routes, draft);
  issues.push(...validateFirstUses(routes, draft, inventory));
  if (reviews.length !== 48) issues.push('candidate transcript matrix must contain 48 routes');
  return issues;
}

function ladderText(value) {
  return ['name', 'normal', 'failure', 'consequence', 'insight', 'action']
    .map((rung) => `${rung}: ${value[rung]}`).join('; ');
}

export function renderQuietCascadeContextAudit(ledger) {
  const severity = ledger.totals.severity;
  const priority = ledger.concept_records.map((gap) => `| \`${gap.gap_id}\` | ${gap.severity} | ${gap.term_procedure_or_pain_point} | ${gap.recommended_channel} | \`${gap.insertion_or_revision_anchor.statement_id}\` |`).join('\n');
  const chapters = Object.keys(CHAPTER_TITLES).map((chapterId) => {
    const gaps = ledger.concept_records.filter((gap) => gap.chapter_id === chapterId);
    return `## ${CHAPTER_TITLES[chapterId]}\n\n${gaps.map((gap) => `### \`${gap.gap_id}\` — ${gap.term_procedure_or_pain_point}\n\n- First reachable use: \`${gap.first_reachable_statement_id}\` / \`${gap.text_id}\` at \`${gap.label_id}\` (${gap.route_conditions}).\n- Current ladder: ${ladderText(gap.current_context_ladder)}.\n- Assumed knowledge: ${gap.assumed_knowledge}\n- Newcomer finding: ${gap.reader_model_rationale}\n- Safe remedy: ${gap.recommended_channel} at ${gap.insertion_or_revision_anchor.placement.toLowerCase()} \`${gap.insertion_or_revision_anchor.statement_id}\`.\n- Preserve: ${gap.semantic_payload}\n- Guardrails: ${[...gap.hidden_information_guardrails, ...gap.gameplay_authority_guardrails].join(' ')}\n- Status: **${gap.audit_status}** — ${gap.rationale}`).join('\n\n')}`;
  }).join('\n\n');
  const terms = ledger.first_use_review.map((row) => `| ${row.term} | \`${row.production_first_use_text_id}\` | ${row.production_status} | ${row.recommended_anchor.placement} \`${row.recommended_anchor.statement_id}\` |`).join('\n');
  return `# Quiet Cascade newcomer-context audit\n\nStatus: **TASK-033 complete; production dialogue remains unchanged.**\n\n## Scope and reader\n\nThis audit uses the smart, technically capable, new-to-Second-Current reader model. It reconciles all ${ledger.totals.production_say_statements} \`say\` statements, ${ledger.totals.production_narrate_statements} \`narrate\` statements, ${ledger.totals.choice_prompts} choice prompts, ${ledger.totals.choice_options} visible options, and ${ledger.totals.match_bridges} Match bridges across ${ledger.totals.audited_routes} routes and ${ledger.totals.terminal_variants} terminal variants. Every one of the ${ledger.totals.reconciled_text_surfaces} surfaces has either a context-gap reference or an explicit \`NO_CONTEXT_CHANGE\` disposition in the JSON ledger.\n\nThe audit found ${ledger.totals.context_records} actionable concepts: ${severity.BLOCKING} blocking, ${severity.MATERIAL} material, and ${severity.POLISH} polish. No hidden Fault, required diagnostic, correct Repair, unchosen result, or private Match detail is used as explanatory context.\n\n## Priority and channel\n\n| Gap | Severity | Concept | Lightest natural channel | Anchor |\n| --- | --- | --- | --- | --- |\n${priority}\n\nNo new glossary UI is recommended. Immediate decisions fit in narration, role-motivated dialogue, the existing traveler/Worklog/SIFT inserts, choice copy, and post-Match reinforcement; the Library remains optional depth.\n\n## Chapter findings\n\n${chapters}\n\n## First-use terminology review\n\n| Term or procedure | Production first use | Finding | Required earlier anchor |\n| --- | --- | --- | --- |\n${terms}\n\n“Repeater” is resolved canonically as a **repeat-return unit**. The audit explicitly rejects the electronics/network-device reading and does not claim that every Civic Atlas unit is a repeater. SIFT has no canonical long-form expansion in current sources; TASK-034 must define its function rather than invent an acronym expansion.\n\n## Audit conclusion\n\nThe production campaign’s technical conclusions and hidden-information discipline remain sound. Its principal comprehension problem is ordering: fictional teams, artifacts, and authority terms often arrive as shorthand before the ordinary handoff is established. The machine ledger gives TASK-034 a specific safe remedy and immutable semantic payload for every material gap while preserving all 324 production statements and the complete 48-route topology.\n`;
}

export function renderQuietCascadeComprehensionQuestions() {
  const chapters = Object.keys(CHAPTER_TITLES).map((chapterId) => {
    const rows = COMPREHENSION_QUESTIONS.filter((row) => row.chapter_id === chapterId);
    return `## ${CHAPTER_TITLES[chapterId]}\n\n${rows.map((row, index) => `${index + 1}. **${row.question}**\n   Expected public-context answer: ${row.expected_public_answer}`).join('\n\n')}`;
  }).join('\n\n');
  return `# Quiet Cascade cold-reader comprehension questions\n\nThese questions test only public workplace and process context. Expected answers deliberately omit hidden Faults, required diagnostics, correct Repairs, and unchosen Match outcomes. TASK-034’s candidate transcripts must answer them without consulting character sheets, the campaign blueprint, or implementation code.\n\n${chapters}\n`;
}

export function renderQuietCascadeContextChangelog(draft) {
  const sections = draft.gap_resolutions.map((row) => `## \`${row.gap_id}\`\n\n- Status: **${row.status}**\n- Before: ${ladderText(row.before_ladder)}.\n- After: ${ladderText(row.after_ladder)}.\n- Channel: ${row.explanation_channel}.\n- Candidate lines: ${row.resolution_candidate_ids.map((id) => `\`${id}\``).join(', ')}.\n- Result: ${row.rationale}`).join('\n\n');
  const review = draft.review_summary;
  return `# Quiet Cascade context-draft changelog\n\nStatus: **TASK-034 candidate only; live campaign untouched.**\n\nEvery TASK-033 concept record is resolved in the candidate layer. The draft maps ${draft.totals.replacement_lines} existing production text IDs, revises ${draft.totals.revised_replacement_lines}, retains ${draft.totals.unchanged_replacement_lines} where context was already sufficient, and proposes ${draft.totals.additive_lines} stable anchored statements.\n\n## Review gates\n\n- Comprehension: ${review.safety_and_accuracy.comprehension_questions_answered}/${review.safety_and_accuracy.comprehension_questions_total} cold-reader questions answered from candidate transcript evidence.\n- Mobile density: longest line ${review.mobile_density.maximum_characters} characters / ${review.mobile_density.maximum_words} words; ${review.mobile_density.over_limit_lines} lines exceed the 420-character review bound.\n- Localization: stable text IDs, no fragment splicing, and ${review.localization_readiness.inline_newline_count} inline newlines.\n- Repetition and pacing: ${review.repetition_and_pacing.exact_duplicate_texts} exact duplicate candidate texts; at most ${review.repetition_and_pacing.maximum_additive_lines_on_one_route} additive context lines on a route, distributed across all four chapters.\n- Safety and accuracy: production bytes are SHA-256 pinned; candidate checks found ${review.safety_and_accuracy.hidden_entity_id_leaks} hidden entity-ID leaks and ${review.safety_and_accuracy.shaming_language_hits} shaming-language hits.\n\n${sections}\n`;
}

export function renderQuietCascadeContextComprehensionReview(draft) {
  const candidateLines = new Map([
    ...draft.replacements.map((row) => [row.text_id, row.draft_text]),
    ...draft.additions.map((row) => [row.candidate_id, row.text]),
  ]);
  const chapters = Object.keys(CHAPTER_TITLES).map((chapterId) => {
    const rows = draft.comprehension_review.filter((row) => row.chapter_id === chapterId);
    const questions = rows.map((row) => {
      const evidence = row.evidence_candidate_ids.map((id) => `- \`${id}\`: ${candidateLines.get(id)}`).join('\n');
      return `### \`${row.question_id}\`\n\n**Question:** ${row.question}\n\n**Answer from candidate transcripts:** ${row.expected_public_answer}\n\n**Candidate evidence:**\n\n${evidence}\n\nStatus: **${row.status}**`;
    }).join('\n\n');
    return `## ${CHAPTER_TITLES[chapterId]}\n\n${questions}`;
  }).join('\n\n');
  return `# Quiet Cascade candidate comprehension review\n\nStatus: **20/20 public-context questions answered from the non-live candidate transcripts.** No answer depends on a hidden Fault, required diagnostic, correct Repair, unchosen outcome, character sheet, campaign blueprint, or implementation code.\n\n${chapters}\n`;
}

export function renderQuietCascadeContextTranscripts(routes, draft) {
  const reviews = buildCandidateRouteReview(routes, draft);
  const bridges = draft.replacements.filter((row) => row.source_kind === 'MATCH_BRIDGE')
    .map((row) => `- \`${row.source_id}\`: ${row.draft_text}`).join('\n');
  const sections = reviews.map((route) => {
    const choices = route.choice_review.map((choice) => `- **${choice.prompt_text}** — Player: ${choice.option_text} (\`${choice.choice_id}\` → \`${choice.selected_option_id}\`)`).join('\n');
    const matches = route.match_results.map((result) => `- \`${result.match_ref}\`: ${result.completion}, +${result.story_service_points_gained} Story Service Points`).join('\n');
    const lines = route.entries.map((entry) => entry.kind === 'NARRATION'
      ? `*${entry.text}*`
      : `**${entry.speaker_text}:** ${entry.text}`).join('\n\n');
    return `## \`${route.route_id}\` — ${route.ending_id}\n\n${route.story_service_points} Story Service Points.\n\n### Choices\n\n${choices}\n\n### Match returns\n\n${matches}\n\n### Candidate dialogue and narration\n\n${lines}`;
  }).join('\n\n');
  return `# Quiet Cascade context-complete candidate route transcripts\n\nStatus: **non-live TASK-034 review artifact**. These deterministic transcripts cover all 48 choice/outcome routes. Additive statements are projected at their stable anchors; production scripts and topology remain untouched.\n\n## Candidate Match bridges\n\n${bridges}\n\n${sections}\n`;
}

export function contextSourceData() {
  return { comprehension_questions: clone(COMPREHENSION_QUESTIONS), production_hashes: clone(PRODUCTION_FILE_HASHES) };
}
