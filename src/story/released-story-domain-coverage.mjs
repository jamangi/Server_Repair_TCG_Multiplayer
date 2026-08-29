import { stableCoverageJson, validateCampaignOneCoverageLedger } from './campaign-one-domain-coverage.mjs';

export const RELEASED_STORY_COVERAGE_VERSION = 'released-story-domain-coverage-v1';

const EXPECTED = Object.freeze({
  pack_id: 'story.campaign.quiet_cascade.v1',
  content_version: 'quiet-cascade-expansion-v3',
  domain_content_version: 'core-domain-snapshot-story-expansion-v4',
  card_catalog_version: 'core-card-catalog-story-expansion-v5',
  deck_catalog_version: 'core-response-decks-v5',
  coverage_version: 'playable-coverage-v5',
  ticket_content_version: 'core-ticket-parts-v4',
  matches: 12,
  tickets: 18,
  fingerprints: 18,
  domain_entities: 257,
  cards: 83,
  diagnostics: 50,
  selected_repairs: 18,
  selected_validations: 15,
});

const clone = (value) => structuredClone(value);
const sorted = (values) => [...new Set(values)].sort((left, right) => left.localeCompare(right));
const sameIds = (left, right) => JSON.stringify(sorted(left)) === JSON.stringify(sorted(right));
const sum = (values) => values.reduce((total, value) => total + value, 0);

function fail(code, message) {
  const error = new Error(`${code}: ${message}`);
  error.code = code;
  throw error;
}

function requireCondition(condition, code, message) {
  if (!condition) fail(code, message);
}

function requireEqual(actual, expected, label) {
  requireCondition(actual === expected, 'PIN_MISMATCH', `${label}: expected ${expected}; received ${actual}.`);
}

function countBy(values) {
  const counts = {};
  for (const value of values) counts[value] = (counts[value] ?? 0) + 1;
  return Object.fromEntries(Object.entries(counts).sort(([left], [right]) => left.localeCompare(right)));
}

function roleSummary(values) {
  const counts = countBy(values);
  return {
    unique_count: Object.keys(counts).length,
    ticket_role_occurrences: values.length,
    ids: Object.keys(counts),
    repeated: Object.entries(counts)
      .filter(([, count]) => count > 1)
      .map(([id, count]) => ({ id, count }))
      .sort((left, right) => right.count - left.count || left.id.localeCompare(right.id)),
  };
}

function diagnosticSource(card) {
  return card.play_contract?.source_definition_id ?? null;
}

function cardSource(card) {
  return diagnosticSource(card)
    ?? card.play_contract?.repair_procedure_id
    ?? card.play_contract?.validation_procedure_id
    ?? null;
}

function proofStatusForOldMatch(match, campaignLedger, builderProof, summary) {
  const shift = campaignLedger.shifts.find((entry) => entry.match_ref === match.match_ref);
  const builder = builderProof.batches.find((entry) => entry.match_ref === match.match_ref);
  const shiftNumber = Number(match.shift_id.split('.').at(-1));
  const settingGroup = summary.by_setting_group.find((entry) =>
    entry.setting_group_id === `story-qc01-shift-${String(shiftNumber).padStart(2, '0')}`);
  requireCondition(shift && builder && settingGroup, 'PROOF_MISSING', `Campaign-one proof is missing for ${match.match_ref}.`);
  requireCondition(builder.status === 'SUCCESS' && builder.exact_pin_match,
    'BUILDER_PROOF_FAILED', `${match.match_ref} is not constructible at its exact pins.`);
  requireCondition(builder.seed === match.seed && shift.seed === match.seed,
    'MATCH_CONFIGURATION_DRIFT', `${match.match_ref} seed differs across the release and proof artifacts.`);
  requireCondition(settingGroup.counts.succeeded === 1 && settingGroup.counts.requested === 1,
    'ENGINE_PROOF_FAILED', `${match.match_ref} does not have one successful engine proof.`);
  requireCondition(JSON.stringify(builder.expected_ticket_definition_ids) === JSON.stringify(match.expected_ticket_definition_ids)
    && JSON.stringify(builder.expected_ticket_snapshot_digests) === JSON.stringify(match.expected_ticket_snapshot_digests)
    && settingGroup.seeds.length === 1 && settingGroup.seeds[0] === match.seed,
  'TICKET_PIN_MISMATCH', `${match.match_ref} release pins differ from the campaign-one Builder proof.`);
  requireCondition(shift.tickets.length === match.requested_ticket_count,
    'TICKET_PIN_MISMATCH', `${match.match_ref} coverage Ticket count differs from the release registry.`);
  return { shift, builder, settingGroup, shiftNumber };
}

function campaignOneTicket(ticket) {
  return {
    ticket_id: ticket.ticket_id,
    ticket_snapshot_digest: ticket.ticket_snapshot_digest,
    fingerprint_id: ticket.fingerprint_id,
    public_symptom_ids: clone(ticket.public.symptom_ids),
    public_candidate_fault_ids: clone(ticket.public.candidate_fault_ids),
    hidden_true_fault_ids: ticket.server_only_truth.fault_instances.map((entry) => entry.fault_id),
    diagnostics: {
      relevant_source_ids: clone(ticket.diagnostics.public_graph_relevant_source_ids),
      target_legal_source_ids: clone(ticket.diagnostics.target_legal_source_ids),
      proven_candidate_changing_source_ids: clone(ticket.diagnostics.candidate_changing_source_ids),
      minimal_witness_source_ids: clone(ticket.diagnostics.minimal_witness_source_ids),
      optional_relevant_source_ids: ticket.diagnostics.public_graph_relevant_source_ids
        .filter((id) => !ticket.diagnostics.minimal_witness_source_ids.includes(id)),
      authored_isolation_routes: clone(ticket.diagnostics.isolation_routes),
    },
    repair_procedure_ids: clone(ticket.closure.repair_procedure_ids),
    validation_procedure_ids: clone(ticket.closure.validation_procedure_ids),
    document_contract: {
      action: 'PUBLISH_CLOSURE',
      explicit_document_live_required: ticket.closure.explicit_document_live_required,
      closure_publication_required: ticket.closure.closure_publication_required,
    },
    oracle_witness: clone(ticket.minimal_authored_route),
  };
}

function expansionTicket(proof) {
  const diagnostics = proof.legal_relevant_required_optional_diagnostics;
  const minimal = proof.response_path.oracle_witness
    .filter((entry) => entry.action === 'RUN_DIAGNOSTIC')
    .map((entry) => entry.source_definition_id);
  requireCondition(sameIds(minimal, diagnostics.required.source_definition_ids),
    'SOLVABILITY_ROLE_DRIFT', `${proof.match_ref} required diagnostics differ from its oracle witness.`);
  return {
    ticket_id: proof.ticket_id,
    ticket_snapshot_digest: proof.ticket_snapshot_digest,
    fingerprint_id: proof.fingerprint_id,
    public_symptom_ids: clone(proof.public_symptom_ids),
    public_candidate_fault_ids: clone(proof.public_candidate_fault_ids),
    hidden_true_fault_ids: clone(proof.hidden_true_fault_ids),
    diagnostics: {
      relevant_source_ids: clone(diagnostics.relevant.source_definition_ids),
      target_legal_source_ids: null,
      proven_candidate_changing_source_ids: clone(diagnostics.required.source_definition_ids),
      minimal_witness_source_ids: minimal,
      optional_relevant_source_ids: clone(diagnostics.optional_relevant.source_definition_ids),
      authored_isolation_routes: [{
        route_kind: 'TASK_043_ORACLE_WITNESS',
        source_definition_ids: minimal,
      }],
    },
    repair_procedure_ids: [proof.response_path.repair.repair_procedure_id],
    validation_procedure_ids: [proof.response_path.verify.validation_procedure_id],
    document_contract: clone(proof.response_path.document),
    oracle_witness: clone(proof.response_path.oracle_witness),
  };
}

function validateCatalogPins({ manifest, releaseMatches, domain, cards, decks, coverage }) {
  requireEqual(manifest.pack_id, EXPECTED.pack_id, 'Story pack ID');
  requireEqual(manifest.content_version, EXPECTED.content_version, 'Story content version');
  requireEqual(releaseMatches.campaign_id, EXPECTED.pack_id, 'Match registry campaign ID');
  requireEqual(releaseMatches.content_version, EXPECTED.content_version, 'Match registry content version');
  requireEqual(domain.domain_content_version, EXPECTED.domain_content_version, 'Domain version');
  requireEqual(cards.card_catalog_version, EXPECTED.card_catalog_version, 'Card version');
  requireEqual(cards.domain_content_version, EXPECTED.domain_content_version, 'Card domain version');
  requireEqual(decks.deck_catalog_version, EXPECTED.deck_catalog_version, 'Deck version');
  requireEqual(coverage.coverage_version, EXPECTED.coverage_version, 'Playable coverage version');
  requireEqual(coverage.ticket_content_version, EXPECTED.ticket_content_version, 'Ticket content version');
  requireEqual(coverage.domain_content_version, EXPECTED.domain_content_version, 'Coverage domain version');
  requireEqual(coverage.card_catalog_version, EXPECTED.card_catalog_version, 'Coverage Card version');
  requireEqual(domain.entities.length, EXPECTED.domain_entities, 'Domain inventory');
  requireEqual(cards.cards.length, EXPECTED.cards, 'Card inventory');
  requireEqual(coverage.inventory.promoted_diagnostics, EXPECTED.diagnostics, 'Diagnostic inventory');
  requireEqual(coverage.inventory.selected_repairs, EXPECTED.selected_repairs, 'Selected Repair inventory');
  requireEqual(coverage.inventory.selected_validations, EXPECTED.selected_validations, 'Selected Verify inventory');
  requireEqual(coverage.inventory.supported_fingerprints, EXPECTED.fingerprints, 'Fingerprint inventory');
}

export function validateReleasedStoryCoverageLedger(ledger) {
  requireEqual(ledger.coverage_version, RELEASED_STORY_COVERAGE_VERSION, 'Release coverage version');
  requireEqual(ledger.proof_totals.registry_matches, EXPECTED.matches, 'Integrated registry Match total');
  requireEqual(ledger.proof_totals.builder_constructed_at_exact_pins, EXPECTED.matches, 'Builder proof total');
  requireEqual(ledger.proof_totals.engine_matches_succeeded, EXPECTED.matches, 'Engine proof total');
  requireEqual(ledger.proof_totals.solvability_witnessed_tickets, EXPECTED.tickets, 'Solvability Ticket total');
  requireEqual(ledger.proof_totals.exact_ticket_pins_matched, EXPECTED.tickets, 'Exact Ticket pin total');
  requireEqual(ledger.authored_totals.matches, EXPECTED.matches, 'Authored Match total');
  requireEqual(ledger.authored_totals.tickets, EXPECTED.tickets, 'Authored Ticket total');
  requireEqual(ledger.authored_totals.fingerprints.unique_count, EXPECTED.fingerprints, 'Authored fingerprint total');
  requireEqual(ledger.authored_totals.minimal_witness_diagnostics.unique_count, 21, 'Minimal diagnostic total');
  requireEqual(ledger.authored_totals.repairs.unique_count, EXPECTED.selected_repairs, 'Authored Repair total');
  requireEqual(ledger.authored_totals.verifications.unique_count, EXPECTED.selected_validations, 'Authored Verify total');
  requireEqual(ledger.diagnostic_role_boundary.global_bench_count, EXPECTED.diagnostics, 'Global Bench denominator');
  requireEqual(ledger.diagnostic_role_boundary.minimal_witness_count, 21, 'Minimal witness numerator');
  requireEqual(ledger.diagnostic_role_boundary.match_relevant_count, 43, 'Match-relevant numerator');
  requireEqual(ledger.diagnostic_role_boundary.commands.minimal_witness_count, 0, 'Minimal Command count');
  requireCondition(ledger.matches.length === EXPECTED.matches
    && new Set(ledger.matches.map((entry) => entry.match_ref)).size === EXPECTED.matches,
  'MATCH_SET_DRIFT', 'Integrated Match rows must be unique and complete.');
  return [];
}

export function buildReleasedStoryDomainCoverage({
  manifest,
  releaseMatches,
  campaignMatchRegistry,
  expansionMatchRegistry,
  campaignLedger,
  campaignBuilderProof,
  campaignSummary,
  expansionBuilderProof,
  domain,
  cards,
  decks,
  coverage,
}) {
  validateCatalogPins({ manifest, releaseMatches, domain, cards, decks, coverage });
  validateCampaignOneCoverageLedger(campaignLedger);
  requireEqual(releaseMatches.matches.length, EXPECTED.matches, 'Release Match count');
  requireCondition(JSON.stringify(releaseMatches.builder_profile) === JSON.stringify(campaignMatchRegistry.builder_profile)
    && JSON.stringify(releaseMatches.match_profile) === JSON.stringify(campaignMatchRegistry.match_profile)
    && JSON.stringify(releaseMatches.deck_policy) === JSON.stringify(campaignMatchRegistry.deck_policy)
    && JSON.stringify(releaseMatches.normalized_result_contract) === JSON.stringify(campaignMatchRegistry.normalized_result_contract)
    && JSON.stringify(releaseMatches.matches.slice(0, 6)) === JSON.stringify(campaignMatchRegistry.matches),
  'MATCH_CONFIGURATION_DRIFT', 'Release Shifts 1–6 differ from the reviewed campaign-one registry.');
  requireCondition(expansionMatchRegistry.matches.length === 6, 'MATCH_CONFIGURATION_DRIFT', 'Expansion proof registry must contain six Matches.');
  for (const [index, released] of releaseMatches.matches.slice(6).entries()) {
    const { chapter_id: chapterId, title_text_id: titleTextId, setup_text_id: setupTextId, ...proofValue } = released;
    requireCondition(typeof chapterId === 'string' && typeof titleTextId === 'string' && typeof setupTextId === 'string'
      && JSON.stringify(proofValue) === JSON.stringify(expansionMatchRegistry.matches[index]),
    'MATCH_CONFIGURATION_DRIFT', `${released.match_ref} differs from the reviewed expansion registry.`);
  }
  requireCondition(campaignBuilderProof.all_batches_constructible_and_pinned === true,
    'BUILDER_PROOF_FAILED', 'Campaign-one proof does not pin every Builder batch.');
  requireCondition(campaignSummary.overall.succeeded === 6
    && campaignSummary.determinism.mismatches === 0,
  'ENGINE_PROOF_FAILED', 'Campaign-one proof must contain six deterministic successes.');
  requireCondition(expansionBuilderProof.all_builds_deterministic_and_pinned
    && expansionBuilderProof.all_oracle_routes_solvable
    && expansionBuilderProof.all_engine_matches_succeeded
    && expansionBuilderProof.all_engine_reruns_identical,
  'EXPANSION_PROOF_FAILED', 'Expansion proof is not fully deterministic, solvable, and successful.');

  const entityById = new Map(domain.entities.map((entry) => [entry.id, entry]));
  const cardById = new Map(cards.cards.map((entry) => [entry.id, entry]));
  const cardBySource = new Map(cards.cards.map((entry) => [cardSource(entry), entry]));
  requireEqual(entityById.size, domain.entities.length, 'Unique domain IDs');
  requireEqual(cardById.size, cards.cards.length, 'Unique Card IDs');
  requireEqual(cardBySource.size, cards.cards.length, 'Unique playable source mappings');
  const fingerprintIds = new Set(coverage.fingerprints.map((entry) => entry.fingerprint_id));
  const globalDiagnosticSourceIds = coverage.diagnostic_definition_ids.map((cardId) => {
    const card = cardById.get(cardId);
    requireCondition(card, 'CATALOG_REFERENCE_MISSING', `Diagnostic Card ${cardId} is absent.`);
    return diagnosticSource(card);
  });
  requireEqual(new Set(globalDiagnosticSourceIds).size, EXPECTED.diagnostics, 'Unique diagnostic sources');

  const proofByExpansionMatch = new Map(expansionBuilderProof.matches.map((entry) => [entry.match_ref, entry]));
  const rows = releaseMatches.matches.map((match, index) => {
    const shiftNumber = Number(match.shift_id.split('.').at(-1));
    requireEqual(shiftNumber, index + 1, `${match.match_ref} release order`);
    if (shiftNumber <= 6) {
      const proof = proofStatusForOldMatch(match, campaignLedger, campaignBuilderProof, campaignSummary);
      const tickets = proof.shift.tickets.map(campaignOneTicket);
      requireCondition(sameIds(tickets.map((entry) => entry.ticket_id), match.expected_ticket_definition_ids)
        && sameIds(tickets.map((entry) => entry.ticket_snapshot_digest), match.expected_ticket_snapshot_digests),
      'TICKET_PIN_MISMATCH', `${match.match_ref} coverage rows differ from its release pins.`);
      return {
        shift_number: shiftNumber,
        segment: 'CAMPAIGN_ONE',
        match_ref: match.match_ref,
        seed: match.seed,
        source_case_id: null,
        builder_contract: {
          kind: 'LEGACY_TOP_LEVEL_PROFILE',
          configuration_version: releaseMatches.builder_profile.configuration_version,
          ticket_content_version: releaseMatches.builder_profile.ticket_content_version,
          domain_content_version: releaseMatches.builder_profile.domain_content_version,
          card_catalog_version: releaseMatches.builder_profile.card_catalog_version,
        },
        builder_proof: {
          source: 'automated_games/task-036-quiet-cascade-characterization-v2/builder-proof.json',
          status: proof.builder.status,
          exact_pin_match: proof.builder.exact_pin_match,
        },
        solvability_proof: {
          source: 'docs/story/coverage/campaign-one-domain-coverage.json',
          ticket_witness_count: tickets.length,
        },
        engine_proof: {
          source: 'automated_games/task-036-quiet-cascade-characterization-v2/summary.json',
          classification: 'SUCCEEDED',
          deterministic_rerun_identical: true,
          turns: proof.settingGroup.turn_distribution.maximum,
        },
        tickets,
      };
    }

    const proof = proofByExpansionMatch.get(match.match_ref);
    requireCondition(proof, 'PROOF_MISSING', `Expansion proof is missing for ${match.match_ref}.`);
    requireCondition(match.builder_configuration
      && match.builder_configuration.id === proof.builder_configuration_id
      && proof.builder.status === 'SUCCESS'
      && proof.builder.deterministic_repeat_identical
      && proof.builder.solvability_valid
      && proof.engine.classification === 'SUCCEEDED'
      && proof.engine.deterministic_rerun_identical,
    'EXPANSION_PROOF_FAILED', `${match.match_ref} is not exactly Builder/engine proved.`);
    requireCondition(match.seed === proof.seed
      && match.builder_configuration.seed === proof.seed
      && sameIds(match.allowed_fingerprint_ids, [proof.fingerprint_id])
      && JSON.stringify(match.deck_pressure) === JSON.stringify(proof.deck_pressure)
      && match.required_response_card_counts[proof.response_path.repair.card_definition_id] === proof.response_path.repair.required_copies
      && match.required_response_card_counts[proof.response_path.verify.card_definition_id] === proof.response_path.verify.required_copies,
    'MATCH_CONFIGURATION_DRIFT', `${match.match_ref} release configuration differs from its real proof.`);
    requireCondition(match.expected_ticket_definition_ids.length === 1
      && match.expected_ticket_definition_ids[0] === proof.ticket_id
      && match.expected_ticket_snapshot_digests[0] === proof.ticket_snapshot_digest,
    'TICKET_PIN_MISMATCH', `${match.match_ref} release pins differ from its expansion proof.`);
    return {
      shift_number: shiftNumber,
      segment: 'EXPANSION',
      match_ref: match.match_ref,
      seed: match.seed,
      source_case_id: proof.case_id,
      builder_contract: {
        kind: 'EMBEDDED_V4_CONFIGURATION',
        configuration_version: match.builder_configuration.configuration_version,
        ticket_content_version: match.builder_configuration.content_version,
        domain_content_version: match.builder_configuration.domain_content_version,
        card_catalog_version: match.builder_configuration.card_catalog_version,
      },
      builder_proof: {
        source: 'automated_games/task-043-quiet-cascade-expansion-v3/builder-proof.json',
        status: proof.builder.status,
        exact_pin_match: true,
      },
      solvability_proof: {
        source: 'automated_games/task-043-quiet-cascade-expansion-v3/builder-proof.json',
        ticket_witness_count: 1,
      },
      engine_proof: {
        source: 'automated_games/task-043-quiet-cascade-expansion-v3/builder-proof.json',
        classification: proof.engine.classification,
        deterministic_rerun_identical: proof.engine.deterministic_rerun_identical,
        turns: proof.engine.turns,
      },
      tickets: [expansionTicket(proof)],
    };
  });

  const tickets = rows.flatMap((entry) => entry.tickets);
  const roleValues = {
    symptoms: tickets.flatMap((entry) => entry.public_symptom_ids),
    public_candidate_faults: tickets.flatMap((entry) => entry.public_candidate_fault_ids),
    truth_faults: tickets.flatMap((entry) => entry.hidden_true_fault_ids),
    relevant_diagnostics: tickets.flatMap((entry) => entry.diagnostics.relevant_source_ids),
    proven_candidate_changing_diagnostics: tickets.flatMap((entry) => entry.diagnostics.proven_candidate_changing_source_ids),
    minimal_witness_diagnostics: tickets.flatMap((entry) => entry.diagnostics.minimal_witness_source_ids),
    repairs: tickets.flatMap((entry) => entry.repair_procedure_ids),
    verifications: tickets.flatMap((entry) => entry.validation_procedure_ids),
    fingerprints: tickets.map((entry) => entry.fingerprint_id),
  };

  for (const id of [
    ...roleValues.symptoms,
    ...roleValues.public_candidate_faults,
    ...roleValues.truth_faults,
    ...roleValues.relevant_diagnostics,
    ...roleValues.proven_candidate_changing_diagnostics,
    ...roleValues.minimal_witness_diagnostics,
    ...roleValues.repairs,
    ...roleValues.verifications,
  ]) requireCondition(entityById.has(id), 'DOMAIN_REFERENCE_MISSING', `Authored role references missing v4 entity ${id}.`);
  for (const fingerprintId of roleValues.fingerprints) {
    requireCondition(fingerprintIds.has(fingerprintId), 'FINGERPRINT_REFERENCE_MISSING', `Authored fingerprint ${fingerprintId} is absent.`);
  }
  for (const match of releaseMatches.matches) {
    for (const cardId of Object.keys(match.required_response_card_counts)) {
      requireCondition(cardById.has(cardId), 'CARD_REFERENCE_MISSING', `${match.match_ref} references missing v5 Card ${cardId}.`);
    }
  }

  const minimalCardIds = sorted([
    ...roleValues.minimal_witness_diagnostics,
    ...roleValues.repairs,
    ...roleValues.verifications,
  ].map((sourceId) => {
    const card = cardBySource.get(sourceId);
    requireCondition(card, 'CARD_REFERENCE_MISSING', `Required source ${sourceId} has no v5 Card.`);
    return card.id;
  }));
  const relevant = sorted(roleValues.relevant_diagnostics);
  const minimal = sorted(roleValues.minimal_witness_diagnostics);
  const commandIds = globalDiagnosticSourceIds.filter((id) => id.startsWith('command.'));
  const isolationRouteSources = sorted(tickets.flatMap((entry) =>
    entry.diagnostics.authored_isolation_routes.flatMap((route) => route.source_definition_ids ?? [])));
  const requiredIsolationCommandIds = isolationRouteSources.filter((id) => id.startsWith('command.'));

  const ledger = {
    coverage_version: RELEASED_STORY_COVERAGE_VERSION,
    pins: {
      story_pack_id: manifest.pack_id,
      story_content_version: manifest.content_version,
      release_match_configuration_version: releaseMatches.match_configuration_version,
      ruleset_version: cards.ruleset_version,
      ticket_content_version: coverage.ticket_content_version,
      domain_content_version: domain.domain_content_version,
      card_catalog_version: cards.card_catalog_version,
      deck_catalog_version: decks.deck_catalog_version,
      playable_coverage_version: coverage.coverage_version,
      campaign_one_proof_content_version: campaignLedger.pins.story_content_version,
      expansion_proof_content_version: expansionBuilderProof.content_version,
    },
    denominators: {
      domain_entities: domain.entities.length,
      by_entity_type: countBy(domain.entities.map((entry) => entry.entity_type)),
      action_bearing_entities: coverage.inventory.action_bearing_records,
      playable_cards: cards.cards.length,
      global_bench_diagnostics: coverage.inventory.promoted_diagnostics,
      selected_repairs: coverage.inventory.selected_repairs,
      selected_validations: coverage.inventory.selected_validations,
      supported_fingerprints: coverage.inventory.supported_fingerprints,
      symptoms: coverage.inventory.records_by_entity_type.symptom,
      faults: coverage.inventory.records_by_entity_type.fault,
    },
    proof_composition: {
      method: 'Compose the two existing real six-Match Builder/solvability/engine proof sets only after exact release-registry pin validation.',
      campaign_one: {
        registry: 'content/story-v1/campaigns/quiet-cascade-characterization-v2/matches.json',
        builder: 'automated_games/task-036-quiet-cascade-characterization-v2/builder-proof.json',
        solvability: 'docs/story/coverage/campaign-one-domain-coverage.json',
        engine: 'automated_games/task-036-quiet-cascade-characterization-v2/summary.json',
        retained_legacy_builder_profile: true,
      },
      expansion: {
        registry: 'automated_games/task-043-quiet-cascade-expansion-v3/match-registry.json',
        builder_solvability_engine: 'automated_games/task-043-quiet-cascade-expansion-v3/builder-proof.json',
        embedded_v4_builder_configuration: true,
      },
      limitation: 'Campaign-one Ticket snapshots retain their reviewed v3 Builder provenance; this audit validates their entities and required Cards against the additive v4/v5 catalogs but does not relabel them as v4 builds.',
    },
    proof_totals: {
      registry_matches: rows.length,
      builder_constructed_at_exact_pins: rows.filter((entry) => entry.builder_proof.status === 'SUCCESS' && entry.builder_proof.exact_pin_match).length,
      engine_matches_succeeded: rows.filter((entry) => entry.engine_proof.classification === 'SUCCEEDED').length,
      deterministic_engine_reruns: rows.filter((entry) => entry.engine_proof.deterministic_rerun_identical).length,
      solvability_witnessed_tickets: sum(rows.map((entry) => entry.solvability_proof.ticket_witness_count)),
      exact_ticket_pins_matched: tickets.length,
    },
    matches: rows,
    authored_totals: {
      matches: rows.length,
      tickets: tickets.length,
      symptoms: roleSummary(roleValues.symptoms),
      public_candidate_faults: roleSummary(roleValues.public_candidate_faults),
      truth_faults: roleSummary(roleValues.truth_faults),
      fingerprints: roleSummary(roleValues.fingerprints),
      relevant_diagnostics: roleSummary(roleValues.relevant_diagnostics),
      proven_candidate_changing_diagnostics: roleSummary(roleValues.proven_candidate_changing_diagnostics),
      minimal_witness_diagnostics: roleSummary(roleValues.minimal_witness_diagnostics),
      repairs: roleSummary(roleValues.repairs),
      verifications: roleSummary(roleValues.verifications),
      closure_publications: tickets.length,
      explicit_document_live_requirements: tickets.filter((entry) => entry.document_contract.explicit_document_live_required).length,
      minimal_required_cards: {
        unique_count: minimalCardIds.length,
        card_definition_ids: minimalCardIds,
      },
    },
    diagnostic_role_boundary: {
      global_bench_count: globalDiagnosticSourceIds.length,
      global_bench_source_ids: sorted(globalDiagnosticSourceIds),
      match_relevant_count: relevant.length,
      match_relevant_source_ids: relevant,
      minimal_witness_count: minimal.length,
      minimal_witness_source_ids: minimal,
      proven_candidate_changing_count: sorted(roleValues.proven_candidate_changing_diagnostics).length,
      proven_candidate_changing_source_ids: sorted(roleValues.proven_candidate_changing_diagnostics),
      commands: {
        global_bench_count: commandIds.length,
        match_relevant_ids: relevant.filter((id) => id.startsWith('command.')),
        authored_isolation_route_source_ids: requiredIsolationCommandIds,
        expansion_required_isolation_ids: sorted(rows.filter((entry) => entry.segment === 'EXPANSION')
          .flatMap((entry) => entry.tickets)
          .flatMap((entry) => entry.diagnostics.minimal_witness_source_ids)
          .filter((id) => id.startsWith('command.'))),
        minimal_witness_count: minimal.filter((id) => id.startsWith('command.')).length,
      },
      definitions: {
        global_bench: 'Visible in the shared catalog; not evidence of teaching or use.',
        match_relevant: 'Public-graph relevant for campaign one or TASK-043 relevant for an expansion Ticket; not proof of execution.',
        proven_candidate_changing: 'Outcome-derived Candidate-changing in campaign one, plus only the expansion diagnostics required by the oracle witness. This intentionally underclaims optional expansion effects.',
        minimal_witness: 'Actually present in a deterministic complete solvability witness.',
      },
    },
    uncovered: {
      supported_fingerprint_ids: coverage.fingerprints.map((entry) => entry.fingerprint_id)
        .filter((id) => !roleValues.fingerprints.includes(id)),
      diagnostic_ids_not_match_relevant: globalDiagnosticSourceIds.filter((id) => !relevant.includes(id)),
      diagnostic_ids_not_in_minimal_witness: globalDiagnosticSourceIds.filter((id) => !minimal.includes(id)),
      selected_repair_ids: coverage.selected_action_definition_ids.filter((id) => entityById.get(id)?.entity_type === 'repair_procedure'
        && !roleValues.repairs.includes(id)),
      selected_validation_ids: coverage.selected_action_definition_ids.filter((id) => entityById.get(id)?.entity_type === 'validation_procedure'
        && !roleValues.verifications.includes(id)),
      symptom_ids: domain.entities.filter((entry) => entry.entity_type === 'symptom' && !roleValues.symptoms.includes(entry.id)).map((entry) => entry.id),
      public_candidate_fault_ids: domain.entities.filter((entry) => entry.entity_type === 'fault' && !roleValues.public_candidate_faults.includes(entry.id)).map((entry) => entry.id),
      truth_fault_ids: domain.entities.filter((entry) => entry.entity_type === 'fault' && !roleValues.truth_faults.includes(entry.id)).map((entry) => entry.id),
    },
    interpretation_limits: [
      'Global catalog presence, Match legality, public relevance, Candidate effects, Isolation routes, minimal-witness actions, response closure, and narrative mention are different roles.',
      'Only minimal-witness diagnostics and required Repair/Verify response Cards are counted as actual required solution-path use.',
      'The expansion engine proof policy may execute additional diagnostics; those execution counts demonstrate one proof policy, not a minimum teaching requirement.',
      'A completed authored Match exposes a concept but does not prove learner mastery or later recall.',
      'Document is represented by required closure publication; explicit Document Live remains optional in the current rules.',
    ],
  };
  validateReleasedStoryCoverageLedger(ledger);
  return ledger;
}

function percentage(numerator, denominator) {
  return `${((numerator / denominator) * 100).toFixed(1)}%`;
}

function codeList(values) {
  return values.length ? values.map((value) => `\`${value}\``).join(', ') : 'None.';
}

export function renderReleasedStoryDomainCoverageMarkdown(ledger) {
  const totals = ledger.authored_totals;
  const matchRows = ledger.matches.map((entry) => `| ${entry.shift_number} | ${entry.segment === 'CAMPAIGN_ONE' ? 'Campaign one' : 'Expansion'} | \`${entry.match_ref}\` | ${entry.tickets.length} | ${entry.builder_contract.kind === 'LEGACY_TOP_LEVEL_PROFILE' ? 'legacy v3' : 'embedded v4'} | ${entry.engine_proof.classification} |`).join('\n');
  const roleRows = [
    ['Public Symptoms', totals.symptoms.unique_count, ledger.denominators.symptoms, totals.symptoms.ticket_role_occurrences],
    ['Public Candidate Faults', totals.public_candidate_faults.unique_count, ledger.denominators.faults, totals.public_candidate_faults.ticket_role_occurrences],
    ['Hidden true Faults', totals.truth_faults.unique_count, ledger.denominators.faults, totals.truth_faults.ticket_role_occurrences],
    ['Supported fingerprints', totals.fingerprints.unique_count, ledger.denominators.supported_fingerprints, totals.fingerprints.ticket_role_occurrences],
    ['Minimal-witness diagnostics', totals.minimal_witness_diagnostics.unique_count, ledger.denominators.global_bench_diagnostics, totals.minimal_witness_diagnostics.ticket_role_occurrences],
    ['Required Repairs', totals.repairs.unique_count, ledger.denominators.selected_repairs, totals.repairs.ticket_role_occurrences],
    ['Required Verifications', totals.verifications.unique_count, ledger.denominators.selected_validations, totals.verifications.ticket_role_occurrences],
  ].map(([label, numerator, denominator, occurrences]) => `| ${label} | ${numerator} / ${denominator} | ${percentage(numerator, denominator)} | ${occurrences} |`).join('\n');
  const limits = ledger.interpretation_limits.map((entry) => `- ${entry}`).join('\n');
  return `# Released Story domain coverage — Quiet Cascade expansion v3

This post-release audit measures the exact twelve-Match live registry against the additive v4 domain and v5 Card catalogs. It composes the already-real six-Match campaign-one and six-Match expansion Builder/solvability/engine proofs only after validating every release Match, seed, Ticket ID, snapshot digest, source entity, and required Card. It does not turn catalog presence or one proof policy's extra actions into claimed teaching.

## Version boundary

- Story: \`${ledger.pins.story_pack_id}\` / \`${ledger.pins.story_content_version}\`
- Domain / Cards / decks: \`${ledger.pins.domain_content_version}\` / \`${ledger.pins.card_catalog_version}\` / \`${ledger.pins.deck_catalog_version}\`
- Tickets / coverage: \`${ledger.pins.ticket_content_version}\` / \`${ledger.pins.playable_coverage_version}\`
- Campaign-one proof provenance remains \`${ledger.pins.campaign_one_proof_content_version}\`; its reviewed v3 Ticket snapshots are not relabeled as v4 builds.

## Twelve-Match integration proof

| Shift | Segment | Match | Tickets | Builder contract | Engine |
| ---: | --- | --- | ---: | --- | --- |
${matchRows}

All ${ledger.proof_totals.registry_matches} registry Matches constructed at exact pins, all ${ledger.proof_totals.solvability_witnessed_tickets} Tickets have complete solvability witnesses, all ${ledger.proof_totals.engine_matches_succeeded} real engine Matches succeeded, and all ${ledger.proof_totals.deterministic_engine_reruns} reruns were identical. Campaign one uses its retained legacy v3 top-level profile; Shifts 7–12 use their embedded v4 configurations. Exact release integration is proved without rebuilding or mutating either reviewed source proof.

## Catalog denominators and actual required-path reach

The v4 domain contains ${ledger.denominators.domain_entities} records. The v5 playable catalog contains ${ledger.denominators.playable_cards} Cards: ${ledger.denominators.global_bench_diagnostics} diagnostics, ${ledger.denominators.selected_repairs} selected Repairs, and ${ledger.denominators.selected_validations} selected Verifications. The release authors ${totals.tickets} Tickets across ${totals.matches} Matches.

| Role | Unique / catalog | Coverage | Ticket-role occurrences |
| --- | ---: | ---: | ---: |
${roleRows}

The combined minimal witnesses require ${totals.minimal_required_cards.unique_count} distinct Cards out of ${ledger.denominators.playable_cards}: ${totals.minimal_witness_diagnostics.unique_count} diagnostics, all ${totals.repairs.unique_count} selected Repairs, and all ${totals.verifications.unique_count} selected Verifications. Closure publication is required for all ${totals.closure_publications} Tickets; explicit Document Live is required for ${totals.explicit_document_live_requirements}.

## Diagnostic role boundary

- **Global Bench (${ledger.diagnostic_role_boundary.global_bench_count})**: visible in the shared catalog, not taught merely by visibility.
- **Match-relevant (${ledger.diagnostic_role_boundary.match_relevant_count})**: relevant to at least one authored Ticket, not necessarily executed.
- **Proven Candidate-changing (${ledger.diagnostic_role_boundary.proven_candidate_changing_count})**: outcome-derived for campaign one plus only expansion oracle-required diagnostics; optional expansion effects are intentionally not inferred.
- **Minimal witness (${ledger.diagnostic_role_boundary.minimal_witness_count})**: actually required by a deterministic complete route.

Commands remain separate: ${ledger.diagnostic_role_boundary.commands.global_bench_count} are globally visible, ${ledger.diagnostic_role_boundary.commands.match_relevant_ids.length} are Match-relevant, ${ledger.diagnostic_role_boundary.commands.authored_isolation_route_source_ids.length} occurs in an authored Isolation route, and zero are used by a minimal witness. Expansion-required Commands: ${codeList(ledger.diagnostic_role_boundary.commands.expansion_required_isolation_ids)}

## Remaining catalog gaps

- Supported fingerprints not authored: ${codeList(ledger.uncovered.supported_fingerprint_ids)}
- Diagnostics never Match-relevant (${ledger.uncovered.diagnostic_ids_not_match_relevant.length}): ${codeList(ledger.uncovered.diagnostic_ids_not_match_relevant)}
- Diagnostics absent from every minimal witness (${ledger.uncovered.diagnostic_ids_not_in_minimal_witness.length}): ${codeList(ledger.uncovered.diagnostic_ids_not_in_minimal_witness)}
- Selected Repairs not required: ${codeList(ledger.uncovered.selected_repair_ids)}
- Selected Verifications not required: ${codeList(ledger.uncovered.selected_validation_ids)}
- Symptoms not authored (${ledger.uncovered.symptom_ids.length}): ${codeList(ledger.uncovered.symptom_ids)}
- Faults absent from every public Candidate pool (${ledger.uncovered.public_candidate_fault_ids.length}): ${codeList(ledger.uncovered.public_candidate_fault_ids)}
- Faults absent from hidden truth (${ledger.uncovered.truth_fault_ids.length}): ${codeList(ledger.uncovered.truth_fault_ids)}

## Interpretation limits

${limits}
`;
}

export { stableCoverageJson };
