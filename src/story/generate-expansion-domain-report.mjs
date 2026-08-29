import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  buildTicketsV4,
  createTask042Catalogs,
  validateTask014OutcomeCoverage,
} from '../builder/task-014.mjs';
import { validateTicketSolvability } from '../builder/ticket-solvability.mjs';
import { createMatch, projectPrivatePlayer } from '../engine/index.mjs';

const ROOT = path.resolve(import.meta.dirname, '../..');
const GAMEPLAY_ROOT = path.join(ROOT, 'content/gameplay-v1');
const OUTPUT_ROOT = path.join(ROOT, 'docs/coverage');
const RESEARCH_REGISTRY_PATH = path.join(ROOT, 'docs/case_studies/v0.2-story-expansion/registry.json');
const SOURCE_PACK_PATH = path.join(ROOT, 'content/domain-v0.2/task-042-source-packs.json');

export const TASK_042_PROOF_VERSION = 'task-042-expansion-domain-proof-v1';
export const TASK_042_OUTPUTS = Object.freeze({
  json: path.join(OUTPUT_ROOT, 'task-042-expansion-domain-network-proof.json'),
  markdown: path.join(OUTPUT_ROOT, 'TASK-042-EXPANSION-DOMAIN-NETWORK.md'),
});

const EXPECTED = Object.freeze({
  versions: Object.freeze({
    ruleset: 'first-version-v2',
    parts: 'ticket-parts-v2',
    builder: 'ticket-builder-v4',
    configuration: 'ticket-builder-v4',
    tickets: 'core-ticket-parts-v4',
    domain: 'core-domain-snapshot-story-expansion-v4',
    cards: 'core-card-catalog-story-expansion-v5',
    decks: 'core-response-decks-v5',
    coverage: 'playable-coverage-v5',
  }),
  old_sha256: Object.freeze({
    'domain-snapshot-v2.json': '2e55fc92b725d869b67b3ea73c701c55db49f9b9a2f49bcff981cebaca687a2f',
    'card-catalog-v3.json': 'e2810a99ce02b1d57ef5613e3d9d09647f5fea8dd8b3b4074baacea09bc055ef',
    'decks-v3.json': '8d9fc3ef8aa5d3932dd4fbb9349b915f4087b2c357caede6f559a2c2c24467f4',
    'playable-coverage-v3.json': '87ed2e481221485aaef3221dcf2d0a1a4979971631db5284fa3e73745d20b065',
    'task-014-parts.json': '06614e06602164e54dc36737aea89d573cd0d1b76ce863a0352a2f45e1be6c56',
  }),
  fingerprints: Object.freeze([
    { case_id: 'exp-001', configuration_id: 'builder_config.task_042.001', fingerprint_id: 'fingerprint.compute.damaged_cpu_socket_contacts', seed: 'task-042-exp-001', ticket_id: 'ticket.generated.827d9729d12225e209f47117', digest: '450d9df67ef840c88f34fa73478d96c2b90db9eee68a4f983d95856ac6d4819d' },
    { case_id: 'exp-002', configuration_id: 'builder_config.task_042.002', fingerprint_id: 'fingerprint.power.failed_distribution_board', seed: 'task-042-exp-002', ticket_id: 'ticket.generated.80422a060f47ea4ce7871377', digest: '0639e89199a6968f9316443c23e222ad4ba20f3114ce72d87694df6df532b86f' },
    { case_id: 'exp-003', configuration_id: 'builder_config.task_042.003', fingerprint_id: 'fingerprint.storage.predictive_drive_failure', seed: 'task-042-exp-003', ticket_id: 'ticket.generated.46644a4accc96d5bd961b9fa', digest: 'f40eb2e706a86d54277265cd3d21b26753039ecb58287d677e51cf254a73059e' },
    { case_id: 'exp-004', configuration_id: 'builder_config.task_042.004', fingerprint_id: 'fingerprint.management.stale_alert', seed: 'task-042-exp-004', ticket_id: 'ticket.generated.b8fa37ba78fc40c286f65d2a', digest: '4f8f58bb0210c5ae7b2f11d2ea418c83d73552c8d940d88ddcd10b2a3d7632e2' },
    { case_id: 'exp-005', configuration_id: 'builder_config.task_042.005', fingerprint_id: 'fingerprint.firmware.incompatible_version_set', seed: 'task-042-exp-005', ticket_id: 'ticket.generated.b92a9e6c176464ba795f9dd5', digest: 'ecbb377dc65df8e4b96f90a35ff9541562b9a229b14e7ced92fae73994288637' },
    { case_id: 'exp-006', configuration_id: 'builder_config.task_042.006', fingerprint_id: 'fingerprint.management.corrupt_bmc_firmware', seed: 'task-042-exp-006', ticket_id: 'ticket.generated.6c878955ff0b3d7e5edbd5a0', digest: '71fcf1cae907451f7b83ca12d7370e59d770174a72c61f5f934ba27851513ce4' },
  ]),
  migrated_prior_card_id: 'card.bench.test.management.event_log_freshness',
});

const stableCompare = (left, right) => (left < right ? -1 : left > right ? 1 : 0);
const sorted = (values) => [...values].sort(stableCompare);
const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const countBy = (values) => values.reduce((counts, value) => ({ ...counts, [value]: (counts[value] ?? 0) + 1 }), {});

function normalize(value) {
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort(stableCompare).map((key) => [key, normalize(value[key])]));
  }
  return value;
}

export const stableTask042Json = (value) => `${JSON.stringify(normalize(value), null, 2)}\n`;

function proofError(code, detail) {
  const error = new Error(`${code}: ${detail}`);
  error.code = code;
  return error;
}

function assertProof(condition, code, detail) {
  if (!condition) throw proofError(code, detail);
}

function exact(actual, expected, label) {
  assertProof(actual === expected, 'PIN_MISMATCH', `${label} expected ${expected}; received ${actual}.`);
}

const contractDomainId = (card) => card.play_contract?.source_definition_id
  ?? card.play_contract?.repair_procedure_id
  ?? card.play_contract?.validation_procedure_id
  ?? null;

function counts(ids) {
  const result = {};
  for (const id of ids) result[id] = (result[id] ?? 0) + 1;
  return result;
}

function bounds(minimum, maximum) {
  return { minimum, maximum };
}

function builderConfiguration({ raw, benchIds, expansionDeck, configurationId, fingerprintId, seed }) {
  const available = counts(expansionDeck.card_definition_ids);
  return {
    id: configurationId,
    entity_type: 'ticket_builder_configuration',
    configuration_version: raw.parts.configuration_version,
    scenario_or_mode_context: 'TRAINING',
    requested_ticket_count: 1,
    seed,
    generator_version: raw.parts.generator_version,
    content_version: raw.parts.ticket_content_version,
    domain_content_version: raw.parts.domain_content_version,
    card_catalog_version: raw.parts.card_catalog_version,
    allowed_domain_ids: [], excluded_domain_ids: [], allowed_tags: [], excluded_tags: [],
    guaranteed_categories: [], required_teaching_beats: [],
    authored_difficulty_bounds: bounds(1, 4),
    fault_count_bounds: bounds(1, 3),
    required_actionable_fault_count_bounds: bounds(1, 2),
    causal_depth_bounds: bounds(0, 1),
    inbound_branching_bounds: bounds(0, 2),
    outbound_branching_bounds: bounds(0, 2),
    progressive_difficulty_profile: {
      profile_id: 'progressive.task_042_expansion',
      profile_version: 'task-042',
      explicit_ceiling: 4,
      bands: [{ start_generated_index: 0, end_generated_index: 0, target: 2, minimum: 1, maximum: 4 }],
    },
    generation_index_start: 0,
    allow_duplicate_causal_fingerprints: false,
    active_causal_fingerprints: [],
    allowed_fingerprint_ids: [fingerprintId],
    legal_card_definition_ids: sorted(new Set([...benchIds, ...Object.keys(available)])),
    diagnostic_card_definition_ids: [...benchIds],
    available_card_definition_counts: available,
    fallback_configuration_id: null,
  };
}

function selectedAttempt(result) {
  return result.attempts.find((attempt) => attempt.attempt_id === result.selected_attempt_id);
}

function learnerCopy(record) {
  return {
    short_description: record.presentation?.short_description ?? '',
    education_text: record.education_text ?? null,
    purpose: record.purpose ?? null,
    capabilities: record.capabilities ?? null,
    steps_summary: record.steps_summary ?? null,
    success_conditions: record.success_conditions ?? null,
  };
}

function textContainsName(text, name) {
  return String(text).toLocaleLowerCase().includes(String(name).toLocaleLowerCase());
}

function validateExpandedTechnicalCopy({ raw, newCards, domainById, research, sourcePacks }) {
  const records = new Map(raw.technical.records.map((entry) => [entry.domain_id, entry]));
  const sourceIds = new Set(raw.technical.sources.map((entry) => entry.id));
  const researchByCase = new Map(research.selected_cases.map((entry) => [entry.case_id, entry]));
  const packsByCase = new Map(sourcePacks.packs.map((entry) => [entry.case_id, entry]));
  exact(records.size, 83, 'Technical-copy review record count');
  exact(sourcePacks.catalog_version, 'story-expansion-domain-sources-v1', 'Source-pack version');
  exact(sourcePacks.packs.length, 6, 'Source-pack count');
  exact(packsByCase.size, 6, 'Unique source-pack case count');
  for (const id of raw.coverage.selected_action_definition_ids) {
    const entity = domainById.get(id);
    const review = records.get(id);
    assertProof(entity && review, 'TECHNICAL_COPY_GAP', `${id} lacks a domain record or review entry.`);
    exact(review.review_status, 'reviewed', `${id} technical-copy status`);
    assertProof(review.source_ids.length > 0 && review.source_ids.every((sourceId) => sourceIds.has(sourceId)), 'PROVENANCE_GAP', `${id} has unresolved technical sources.`);
    exact(review.technical_copy_sha256, sha256(JSON.stringify(learnerCopy(entity))), `${id} technical-copy digest`);
    assertProof(entity.presentation?.short_description?.trim(), 'TECHNICAL_COPY_GAP', `${id} lacks learner-facing technical copy.`);
  }
  for (const card of newCards) {
    const domainId = card.primary_domain_reference?.entity_id;
    const entity = domainById.get(domainId);
    const matchingPacks = sourcePacks.packs.filter((pack) => pack.entity_overrides
      .some((override) => override.entity_id === domainId && override.reuse_illustration_from));
    exact(matchingPacks.length, 1, `${card.id} response source-pack mapping count`);
    const pack = matchingPacks[0];
    const override = pack.entity_overrides.find((entry) => entry.entity_id === domainId);
    const artSource = domainById.get(override.reuse_illustration_from);
    const researchCase = researchByCase.get(pack.case_id);
    const sourceReview = raw.technical.sources.find((entry) => entry.id === pack.source_id);
    const review = records.get(domainId);
    assertProof(entity, 'ART_REUSE_GAP', `${card.id} has no primary domain record.`);
    assertProof(artSource, 'ART_REUSE_GAP', `${card.id} has no paired Test art source.`);
    exact(domainId, contractDomainId(card), `${card.id} primary binding`);
    exact(card.primary_domain_reference.inherit_illustration, true, `${card.id} illustration inheritance`);
    assertProof(entity.presentation?.illustration?.asset_id && entity.presentation?.illustration?.alt_text, 'ART_REUSE_GAP', `${card.id} cannot reuse accessible primary-domain art.`);
    assertProof(card.presentation?.illustration === undefined, 'ART_REUSE_GAP', `${card.id} duplicates rather than inherits response art.`);
    exact(entity.presentation.illustration.asset_id, artSource.presentation?.illustration?.asset_id, `${card.id} paired Test asset reuse`);
    assertProof(textContainsName(entity.presentation.illustration.alt_text, entity.presentation.display_name), 'ART_REUSE_GAP', `${card.id} inherited art alt text does not name the response action.`);
    assertProof(textContainsName(entity.presentation.illustration.caption, entity.presentation.display_name), 'ART_REUSE_GAP', `${card.id} inherited art caption does not name the response action.`);
    exact(card.presentation.short_description, entity.presentation.short_description, `${card.id} technical description`);
    assertProof(researchCase, 'PROVENANCE_GAP', `${pack.case_id} is absent from the TASK-041 registry.`);
    exact(pack.source_url, researchCase.source.url, `${pack.case_id} source-pack URL`);
    exact(sourceReview?.url, researchCase.source.url, `${pack.case_id} review-ledger URL`);
    assertProof(review.source_ids.includes(pack.source_id), 'PROVENANCE_GAP', `${domainId} does not cite ${pack.source_id}.`);
  }
}

function sourceCaseFor({ parts, fingerprintId, ticket, research, sourcePacks }) {
  const root = parts.fingerprint_roots.find((entry) => entry.fingerprint_id === fingerprintId);
  assertProof(root, 'FINGERPRINT_MISSING', `${fingerprintId} has no authored root.`);
  const match = EXPECTED.fingerprints.find((entry) => entry.fingerprint_id === fingerprintId);
  const researchCase = research.selected_cases.find((entry) => entry.case_id === match.case_id);
  const slot = research.evidence_slots.find((entry) => entry.case_id === match.case_id);
  const pack = sourcePacks.packs.find((entry) => entry.case_id === match.case_id);
  assertProof(researchCase && slot && pack, 'PROVENANCE_GAP', `${fingerprintId} lacks a complete TASK-041 registry/source-pack chain.`);
  exact(researchCase.source.access_date, '2026-08-28', `${match.case_id} source access date`);
  exact(researchCase.source.directly_opened, true, `${match.case_id} directly-opened source flag`);
  exact(pack.source_id, `source.case.${match.case_id}`, `${match.case_id} stable source ID`);
  exact(pack.source_url, researchCase.source.url, `${match.case_id} source URL`);
  exact(slot.learning_objective_key, researchCase.learning_objective_key, `${match.case_id} objective provenance`);
  exact(slot.fingerprint_candidate_key, researchCase.fingerprint_candidate_key, `${match.case_id} candidate provenance`);
  exact(root.response_deck_id, 'deck.story.expansion_response_v1', `${fingerprintId} response deck`);
  assertProof(parts.teaching_parts.some((entry) => entry.part_id === root.teaching_part_id), 'PROVENANCE_GAP', `${fingerprintId} lacks its explicit teaching part.`);

  const support = researchCase.stable_support;
  const truthIds = ticket.server_only_truth.fault_instances.map((entry) => entry.fault_id);
  const initialOutcomes = ticket.authored_evidence_outcomes.filter((entry) =>
    entry.eligible_machine_state_key === ticket.server_only_truth.initial_machine_state_key);
  const routeSourceIds = ticket.isolation_requirements.flatMap((requirement) => requirement.routes.flatMap((route) =>
    route.eligible_outcome_ids.map((outcomeId) => initialOutcomes.find((outcome) => outcome.outcome_id === outcomeId)?.source_definition_id).filter(Boolean)));
  assertProof(support.symptom_ids.some((id) => ticket.initial_symptom_ids.includes(id)), 'PROVENANCE_GAP', `${fingerprintId} does not preserve its source-backed Symptom.`);
  assertProof(support.fault_ids.some((id) => truthIds.includes(id) && ticket.public_candidate_fault_ids.includes(id)), 'PROVENANCE_GAP', `${fingerprintId} does not preserve its source-backed Fault.`);
  assertProof(support.test_ids.some((id) => routeSourceIds.includes(id)), 'PROVENANCE_GAP', `${fingerprintId} has no source-backed Test on an Isolation route.`);
  assertProof(support.repair_ids.every((id) => ticket.repair_requirements.some((requirement) => requirement.eligible_repair_procedure_ids.includes(id))), 'PROVENANCE_GAP', `${fingerprintId} does not preserve its source-backed Repair.`);
  assertProof(support.validation_ids.every((id) => ticket.verification_requirements.some((requirement) => requirement.validation_procedure_id === id)), 'PROVENANCE_GAP', `${fingerprintId} does not preserve its source-backed Verify.`);
  return {
    case_id: match.case_id,
    slot_id: researchCase.slot_id,
    learning_objective_key: researchCase.learning_objective_key,
    fingerprint_candidate_key: researchCase.fingerprint_candidate_key,
    source_id: pack.source_id,
    source_url: pack.source_url,
    accessed_on: researchCase.source.access_date,
  };
}

function commandSourceIds(ids, domainById) {
  return sorted(new Set(ids.filter((id) => domainById.get(id)?.entity_type === 'command')));
}

export function buildTask042Proof(inputs) {
  const { raw, oldRaw, oldText, catalogs, research, sourcePacks, provenanceText } = inputs;
  for (const [filename, expected] of Object.entries(EXPECTED.old_sha256)) exact(sha256(oldText[filename]), expected, `Immutable ${filename} SHA-256`);

  exact(raw.parts.part_catalog_version, EXPECTED.versions.parts, 'Part catalog version');
  exact(raw.parts.ruleset_version, EXPECTED.versions.ruleset, 'Ruleset version');
  exact(raw.parts.generator_version, EXPECTED.versions.builder, 'Builder version');
  exact(raw.parts.configuration_version, EXPECTED.versions.configuration, 'Configuration version');
  exact(raw.parts.ticket_content_version, EXPECTED.versions.tickets, 'Ticket content version');
  exact(raw.parts.domain_content_version, EXPECTED.versions.domain, 'Part domain version');
  exact(raw.parts.card_catalog_version, EXPECTED.versions.cards, 'Part Card version');
  exact(raw.parts.deck_catalog_version, EXPECTED.versions.decks, 'Part deck version');
  exact(raw.domain.domain_content_version, EXPECTED.versions.domain, 'Domain version');
  exact(raw.cards.card_catalog_version, EXPECTED.versions.cards, 'Card version');
  exact(raw.decks.deck_catalog_version, EXPECTED.versions.decks, 'Deck version');
  exact(raw.coverage.coverage_version, EXPECTED.versions.coverage, 'Coverage version');

  exact(raw.domain.entities.length, 257, 'Knowledge record count');
  exact(raw.coverage.inventory.knowledge_records, 257, 'Coverage knowledge count');
  exact(raw.coverage.inventory.action_bearing_records, 107, 'Action-bearing count');
  exact(raw.coverage.inventory.tests, 37, 'Test count');
  exact(raw.coverage.inventory.commands, 13, 'Command count');
  exact(raw.coverage.inventory.promoted_diagnostics, 50, 'Diagnostic count');
  exact(raw.coverage.inventory.selected_repairs, 18, 'Selected Repair count');
  exact(raw.coverage.inventory.selected_validations, 15, 'Selected Verify count');
  exact(raw.coverage.inventory.playable_card_definitions, 83, 'Playable Card count');
  exact(raw.coverage.inventory.supported_fingerprints, 18, 'Fingerprint count');
  exact(raw.coverage.deferred_action_definition_ids.length, 24, 'Deferred action count');
  exact(raw.coverage.selected_action_definition_ids.length, 83, 'Selected action count');
  assertProof(new Set([...raw.coverage.selected_action_definition_ids, ...raw.coverage.deferred_action_definition_ids]).size === 107, 'COVERAGE_PARTITION_DRIFT', 'Selected and deferred actions must partition all 107 action-bearing records.');

  const domainById = new Map(raw.domain.entities.map((entity) => [entity.id, entity]));
  exact(domainById.size, 257, 'Unique domain stable-ID count');
  assertProof(JSON.stringify(sorted(domainById.keys())) === JSON.stringify(sorted(oldRaw.domain.entities.map((entity) => entity.id))), 'DOMAIN_ID_DRIFT', 'TASK-042 must reuse the exact 257 stable domain IDs.');
  const actionTypes = new Set(['test', 'command', 'repair_procedure', 'validation_procedure']);
  const actionIds = sorted(raw.domain.entities.filter((entity) => actionTypes.has(entity.entity_type)).map((entity) => entity.id));
  assertProof(JSON.stringify(sorted(new Set([...raw.coverage.selected_action_definition_ids, ...raw.coverage.deferred_action_definition_ids]))) === JSON.stringify(actionIds), 'COVERAGE_PARTITION_DRIFT', 'Selected and deferred IDs must exactly partition the 107 action-bearing records.');
  const selectedByType = countBy(raw.coverage.selected_action_definition_ids.map((id) => domainById.get(id)?.entity_type));
  exact(selectedByType.test, 37, 'Selected Test count');
  exact(selectedByType.command, 13, 'Selected Command count');
  exact(selectedByType.repair_procedure, 18, 'Selected Repair family count');
  exact(selectedByType.validation_procedure, 15, 'Selected Verify family count');

  exact(raw.cards.cards.length, 83, 'Card catalog count');
  const oldCardById = new Map(oldRaw.cards.cards.map((card) => [card.id, card]));
  const newCards = raw.cards.cards.filter((card) => !oldCardById.has(card.id));
  exact(newCards.length, 12, 'New response Card count');
  assertProof(newCards.every((card) => ['REPAIR', 'VERIFY'].includes(card.play_contract?.contract_type)), 'CARD_FAMILY_DRIFT', 'Every new Card must be a Repair or Verify response Card.');
  const migratedPriorCardIds = [];
  for (const card of raw.cards.cards.filter((entry) => oldCardById.has(entry.id))) {
    if (JSON.stringify(card) !== JSON.stringify(oldCardById.get(card.id))) migratedPriorCardIds.push(card.id);
  }
  assertProof(JSON.stringify(sorted(migratedPriorCardIds)) === JSON.stringify([EXPECTED.migrated_prior_card_id]), 'OLD_CARD_DRIFT', `Expected only ${EXPECTED.migrated_prior_card_id} to migrate; received ${migratedPriorCardIds.join(', ') || 'none'}.`);
  const migratedCard = raw.cards.cards.find((card) => card.id === EXPECTED.migrated_prior_card_id);
  exact(migratedCard.play_contract?.contract_type, 'DIAGNOSTIC', 'N4 migrated Card family');
  exact(migratedCard.play_contract?.source_definition_id, 'test.management.event_log_freshness', 'N4 migrated Card Test binding');
  assertProof(/without clearing or resetting/i.test(migratedCard.educational_text), 'N4_BOUNDARY_DRIFT', 'N4 diagnostic copy must preserve state rather than clear it.');

  const oldStarter = oldRaw.decks.decks.find((deck) => deck.id === 'deck.core.multisystem_response_v3');
  const starter = raw.decks.decks.find((deck) => deck.id === 'deck.core.multisystem_response_v3');
  assertProof(oldStarter && starter && JSON.stringify(starter) === JSON.stringify(oldStarter), 'OLD_DECK_DRIFT', 'The old starter deck changed.');
  const expansionDeck = raw.decks.decks.find((deck) => deck.id === 'deck.story.expansion_response_v1');
  assertProof(expansionDeck, 'EXPANSION_DECK_MISSING', 'Missing deck.story.expansion_response_v1.');
  exact(expansionDeck.card_definition_ids.length, 30, 'Expansion deck size');
  assertProof(newCards.every((card) => expansionDeck.card_definition_ids.includes(card.id)), 'EXPANSION_DECK_UNREACHABLE', 'Every new response Card must be reachable in the expansion deck.');

  const selectedCardDomainIds = raw.cards.cards.map((card) => card.primary_domain_reference?.entity_id);
  assertProof(JSON.stringify(sorted(selectedCardDomainIds)) === JSON.stringify(sorted(raw.coverage.selected_action_definition_ids)), 'CARD_FAMILY_DRIFT', 'Cards must map one-to-one to the 83 selected action records.');
  validateExpandedTechnicalCopy({ raw, newCards, domainById, research, sourcePacks });

  const diagnosticCards = raw.cards.cards.filter((card) => card.play_contract?.contract_type === 'DIAGNOSTIC');
  exact(diagnosticCards.length, 50, 'Global Diagnostic Bench size');
  const benchIds = sorted(diagnosticCards.map((card) => card.id));
  const fingerprintIds = raw.coverage.fingerprints.map((entry) => entry.fingerprint_id);
  exact(fingerprintIds.length, 18, 'Coverage fingerprint row count');
  exact(new Set(fingerprintIds).size, 18, 'Unique coverage fingerprint count');
  for (const expected of EXPECTED.fingerprints) {
    assertProof(fingerprintIds.includes(expected.fingerprint_id), 'FINGERPRINT_MISSING', `${expected.fingerprint_id} is absent from coverage.`);
  }

  const ticketProofs = [];
  const objectives = [];
  const commandUse = [];
  const commandRoute = [];
  const commandWitness = [];
  for (const expected of EXPECTED.fingerprints) {
    const configuration = builderConfiguration({ raw, benchIds, expansionDeck, configurationId: expected.configuration_id, fingerprintId: expected.fingerprint_id, seed: expected.seed });
    const result = buildTicketsV4({ configuration, catalogs });
    const repeat = buildTicketsV4({ configuration: structuredClone(configuration), catalogs });
    assertProof(result.status === 'SUCCESS', 'BUILDER_FAILURE', `${expected.fingerprint_id}: ${JSON.stringify(result.attempts?.[0]?.diagnostics ?? [])}`);
    assertProof(JSON.stringify(result) === JSON.stringify(repeat), 'NONDETERMINISTIC_BUILD', `${expected.fingerprint_id} changed across identical builds.`);
    const attempt = selectedAttempt(result);
    assertProof(attempt?.ticket_snapshots?.length === 1, 'BUILDER_FAILURE', `${expected.fingerprint_id} did not produce exactly one Ticket.`);
    const ticket = attempt.ticket_snapshots[0];
    exact(ticket.generation_provenance.fingerprint_id, expected.fingerprint_id, `${expected.fingerprint_id} provenance`);
    exact(ticket.id, expected.ticket_id, `${expected.fingerprint_id} deterministic Ticket ID`);
    exact(attempt.ticket_snapshot_digests[0], expected.digest, `${expected.fingerprint_id} deterministic Ticket digest`);
    const outcomeCoverage = validateTask014OutcomeCoverage(ticket, {
      domainCatalog: catalogs.domain,
      cardCatalog: catalogs.cards,
      diagnosticCardDefinitionIds: benchIds,
    });
    assertProof(outcomeCoverage.valid, 'OUTCOME_COVERAGE_GAP', `${expected.fingerprint_id}: ${JSON.stringify(outcomeCoverage.errors)}`);
    const solvability = validateTicketSolvability(ticket, {
      domainCatalog: catalogs.domain,
      cardCatalog: catalogs.cards,
      legalCardDefinitionIds: configuration.legal_card_definition_ids,
    });
    assertProof(solvability.valid && solvability.witness?.length >= 4, 'SOLVABILITY_FAILURE', `${expected.fingerprint_id}: ${JSON.stringify(solvability.errors)}`);
    const objective = ticket.educational_objectives.join(' | ');
    objectives.push(objective);

    const initialStateOutcomes = ticket.authored_evidence_outcomes.filter((outcome) =>
      outcome.eligible_machine_state_key === ticket.server_only_truth.initial_machine_state_key);
    const usefulCommandIds = commandSourceIds(initialStateOutcomes
      .filter((outcome) => outcome.candidate_effects.length > 0)
      .map((outcome) => outcome.source_definition_id), domainById);
    const routeCommandIds = commandSourceIds(ticket.isolation_requirements.flatMap((requirement) =>
      requirement.routes.flatMap((route) => route.eligible_outcome_ids.map((outcomeId) =>
        ticket.authored_evidence_outcomes.find((outcome) => outcome.outcome_id === outcomeId)?.source_definition_id).filter(Boolean))), domainById);
    const witnessCommandIds = commandSourceIds(solvability.witness
      .filter((step) => step.action === 'RUN_DIAGNOSTIC')
      .map((step) => step.source_definition_id), domainById);
    commandUse.push(...usefulCommandIds);
    commandRoute.push(...routeCommandIds);
    commandWitness.push(...witnessCommandIds);

    const state = createMatch({
      matchId: `match.task-042.proof.${expected.case_id}`,
      players: [{ player_id: 'player.one', display_name: 'One', controller_type: 'human', team_id: 'team.one', seat_number: 1 }],
      decksByPlayer: { 'player.one': expansionDeck.card_definition_ids },
      ticketSnapshots: [ticket],
      catalogs: catalogs.engineCatalogs,
      configuration: { collaboration_mode: 'cooperative', execution_mode: 'offline' },
      seed: expected.seed,
      now: '2042-01-01T00:00:00.000Z',
      ticketSource: { source_type: 'generated', content_version: raw.parts.ticket_content_version, generator_version: raw.parts.generator_version, configuration_id: configuration.id, seed: expected.seed, builder_result_id: result.id },
      rulesetVersion: raw.parts.ruleset_version,
    });
    const publicView = projectPrivatePlayer(state, 'player.one', catalogs.engineCatalogs);
    const serializedView = JSON.stringify(publicView);
    assertProof(publicView.diagnostic_bench.length === 50, 'BENCH_PROJECTION_DRIFT', `${expected.fingerprint_id} did not expose the 50-card Bench.`);
    assertProof(!/server_only_truth|fault_instances|authored_evidence_outcomes|actual_present/.test(serializedView), 'HIDDEN_TRUTH_LEAK', `${expected.fingerprint_id} leaked server-only truth.`);

    const sourceCase = sourceCaseFor({ parts: raw.parts, fingerprintId: expected.fingerprint_id, ticket, research, sourcePacks });
    ticketProofs.push({
      ...sourceCase,
      fingerprint_id: expected.fingerprint_id,
      seed: expected.seed,
      ticket_id: ticket.id,
      ticket_snapshot_digest: attempt.ticket_snapshot_digests[0],
      learning_objectives: [...ticket.educational_objectives],
      symptom_ids: [...ticket.initial_symptom_ids],
      public_candidate_fault_ids: [...ticket.public_candidate_fault_ids],
      true_fault_ids: ticket.server_only_truth.fault_instances.map((entry) => entry.fault_id),
      isolation_route_ids: ticket.isolation_requirements.flatMap((requirement) => requirement.routes.map((route) => route.route_id)),
      repair_procedure_ids: sorted(new Set(ticket.repair_requirements.flatMap((requirement) => requirement.eligible_repair_procedure_ids))),
      validation_procedure_ids: sorted(new Set(ticket.verification_requirements.map((requirement) => requirement.validation_procedure_id))),
      authored_evidence_outcomes: ticket.authored_evidence_outcomes.length,
      target_legal_diagnostics_with_complete_outcomes: initialStateOutcomes.length,
      solvability_witness: structuredClone(solvability.witness),
      commands: { useful_candidate_changing_ids: usefulCommandIds, isolation_route_source_ids: routeCommandIds, minimal_witness_ids: witnessCommandIds },
      public_projection_hidden_truth_leaks: 0,
    });
  }

  exact(new Set(objectives).size, 6, 'Distinct teaching objective count');
  exact(new Set(ticketProofs.map((entry) => entry.ticket_id)).size, 6, 'Deterministic Ticket ID count');
  exact(new Set(ticketProofs.map((entry) => entry.ticket_snapshot_digest)).size, 6, 'Deterministic Ticket digest count');

  const n6 = ticketProofs.find((entry) => entry.case_id === 'exp-006');
  assertProof(n6, 'N6_BOUNDARY_DRIFT', 'Missing exp-006 proof.');
  assertProof(n6.solvability_witness.some((step) => step.action === 'RUN_DIAGNOSTIC' && step.source_definition_id === 'test.management.bmc_recovery_state'), 'N6_BOUNDARY_DRIFT', 'N6 must use the BMC recovery-state Test.');
  assertProof(n6.repair_procedure_ids.includes('repair.management.recover_bmc_firmware'), 'N6_BOUNDARY_DRIFT', 'N6 must perform BMC firmware recovery as Repair.');
  assertProof(!/tftp/i.test(JSON.stringify(n6.commands)), 'N6_BOUNDARY_DRIFT', 'TFTP transport must not become diagnostic Command evidence.');

  const n4 = ticketProofs.find((entry) => entry.case_id === 'exp-004');
  assertProof(n4, 'N4_BOUNDARY_DRIFT', 'Missing exp-004 proof.');
  assertProof(n4.solvability_witness.some((step) => step.action === 'RUN_DIAGNOSTIC' && step.source_definition_id === 'test.management.event_log_freshness'), 'N4_BOUNDARY_DRIFT', 'N4 must preserve and compare current state with Event Log Freshness Test.');
  assertProof(n4.repair_procedure_ids.includes('repair.management.clear_stale_alert_state'), 'N4_BOUNDARY_DRIFT', 'N4 must clear stale alert state only as Repair.');

  return {
    proof_version: TASK_042_PROOF_VERSION,
    pins: {
      ...EXPECTED.versions,
      old_artifact_sha256: { ...EXPECTED.old_sha256 },
      task_041_registry_sha256: sha256(provenanceText.research),
      task_042_source_pack_sha256: sha256(provenanceText.sourcePacks),
    },
    inventory: {
      knowledge_records: 257,
      action_bearing_records: 107,
      diagnostics: 50,
      selected_repairs: 18,
      selected_validations: 15,
      playable_cards: 83,
      deferred_actions: 24,
      fingerprints: 18,
      new_response_cards: 12,
      expansion_deck_cards: 30,
    },
    compatibility: {
      stable_domain_ids_preserved: 257,
      old_card_definitions_unchanged: oldRaw.cards.cards.length - migratedPriorCardIds.length,
      explicitly_migrated_prior_card_ids: sorted(migratedPriorCardIds),
      old_starter_deck_unchanged: true,
    },
    tickets: ticketProofs,
    teaching_objectives: sorted(objectives),
    commands: {
      catalog_exposure_ids: sorted(diagnosticCards.filter((card) => domainById.get(card.play_contract.source_definition_id)?.entity_type === 'command').map((card) => card.play_contract.source_definition_id)),
      useful_candidate_changing_ids: sorted(new Set(commandUse)),
      authored_isolation_route_source_ids: sorted(new Set(commandRoute)),
      minimal_witness_required_ids: sorted(new Set(commandWitness)),
    },
    n6_test_repair_boundary: {
      test_id: 'test.management.bmc_recovery_state',
      repair_id: 'repair.management.recover_bmc_firmware',
      tftp_is_diagnostic_command: false,
    },
    n4_test_repair_boundary: {
      migrated_card_id: EXPECTED.migrated_prior_card_id,
      test_id: 'test.management.event_log_freshness',
      repair_id: 'repair.management.clear_stale_alert_state',
      diagnostic_changes_machine_state: false,
    },
    quality: {
      technical_copy_review_records: raw.technical.records.length,
      new_response_cards_reusing_paired_test_art: newCards.length,
      complete_outcome_coverage_tickets: ticketProofs.length,
      solvable_tickets: ticketProofs.length,
      hidden_truth_leaks: 0,
    },
  };
}

const code = (value) => `\`${value}\``;
const list = (values) => values.length ? values.map(code).join(', ') : 'None';

export function renderTask042Report(proof) {
  const ticketRows = proof.tickets.map((ticket) =>
    `| ${ticket.case_id} | ${code(ticket.fingerprint_id)} | ${code(ticket.ticket_id)} | ${code(ticket.ticket_snapshot_digest)} | ${ticket.learning_objectives.join(' ')} | [source](${ticket.source_url}) |`).join('\n');
  const oldHashes = Object.entries(proof.pins.old_artifact_sha256)
    .map(([name, digest]) => `${code(name)} ${code(digest)}`).join('; ');
  const inventoryRows = Object.entries(proof.inventory)
    .map(([key, value]) => `| ${key.replaceAll('_', ' ')} | ${value} |`).join('\n');
  return [
    '# TASK-042 expansion domain network proof',
    '',
    'This generated report proves the six reviewed research slots against the real Builder, outcome-coverage validator, solvability oracle, engine projection, expansion response deck, and unchanged 50-card Diagnostic Bench. It does not design Story graph or dialogue.',
    '',
    '## Version and immutable-input pins',
    '',
    `- Ruleset / Builder: ${code(proof.pins.ruleset)} / ${code(proof.pins.builder)}`,
    `- Parts / Tickets: ${code(proof.pins.parts)} / ${code(proof.pins.tickets)}`,
    `- Domain / Cards / decks / coverage: ${code(proof.pins.domain)} / ${code(proof.pins.cards)} / ${code(proof.pins.decks)} / ${code(proof.pins.coverage)}`,
    `- Immutable prior SHA-256 values: ${oldHashes}`,
    '',
    '## Inventory and compatibility',
    '',
    '| Measure | Count |',
    '| --- | ---: |',
    inventoryRows,
    '',
    `All 257 stable domain IDs remain present, ${proof.compatibility.old_card_definitions_unchanged} prior Cards remain byte-equivalent as parsed definitions, and exactly ${list(proof.compatibility.explicitly_migrated_prior_card_ids)} is explicitly migrated for the N4 Test/Repair boundary. The old v3 catalog file and ${code('deck.core.multisystem_response_v3')} remain unchanged. The expansion deck contains exactly 30 Cards and reaches all 12 new response Cards.`,
    '',
    '## Six deterministic Ticket proofs',
    '',
    '| Case | Fingerprint | Ticket | Snapshot digest | Distinct objective | Provenance |',
    '| --- | --- | --- | --- | --- | --- |',
    ticketRows,
    '',
    'Every Ticket exposes the unchanged 50-card Bench, has complete authored outcomes for every target-legal diagnostic, a player-safe solvability witness through Isolation, Repair, and Verify, and zero server-only fields in its projected player view.',
    '',
    '## Commands remain separate questions',
    '',
    `- Catalog exposure (${proof.commands.catalog_exposure_ids.length}): ${list(proof.commands.catalog_exposure_ids)}`,
    `- Useful Candidate-changing Evidence in these six Tickets (${proof.commands.useful_candidate_changing_ids.length}): ${list(proof.commands.useful_candidate_changing_ids)}`,
    `- Authored Isolation-route sources (${proof.commands.authored_isolation_route_source_ids.length}): ${list(proof.commands.authored_isolation_route_source_ids)}`,
    `- Oracle-minimal required Commands (${proof.commands.minimal_witness_required_ids.length}): ${list(proof.commands.minimal_witness_required_ids)}`,
    '',
    'No count is promoted into another category.',
    '',
    '## N6 Test/Repair boundary',
    '',
    `${code(proof.n6_test_repair_boundary.test_id)} supplies diagnostic Evidence. ${code(proof.n6_test_repair_boundary.repair_id)} changes BMC firmware state. TFTP remains Repair transport and is not a Diagnostic Command.`,
    '',
    '## N4 Test/Repair boundary',
    '',
    `${code(proof.n4_test_repair_boundary.test_id)} preserves and compares current state without clearing it. ${code(proof.n4_test_repair_boundary.repair_id)} performs the state-changing cleanup. ${code(proof.n4_test_repair_boundary.migrated_card_id)} is the only prior Card definition intentionally migrated into v5.`,
    '',
    '## Technical copy, provenance, and art',
    '',
    `All ${proof.quality.technical_copy_review_records} selected actions have reviewed technical-copy provenance and matching digests. The 12 new response Cards bind one-to-one to their Repair/Verify domain records. Those primary records deliberately reuse paired-Test asset IDs with response-specific accessible alt text and captions; Cards inherit that reviewed primary-domain art. Each Ticket is bound to its directly opened TASK-041 source through the registry, source pack, source ledger, stable support, explicit teaching part, and expansion response deck.`,
    '',
  ].join('\n');
}

async function readRaw(filename) {
  const text = await fs.readFile(path.join(GAMEPLAY_ROOT, filename), 'utf8');
  return { text, value: JSON.parse(text) };
}

export async function loadTask042Inputs() {
  const [parts, domain, cards, decks, coverage, technical, oldParts, oldDomain, oldCards, oldDecks, oldCoverage, research, sourcePacks] = await Promise.all([
    readRaw('task-042-parts.json'),
    readRaw('domain-snapshot-v3.json'),
    readRaw('card-catalog-v4.json'),
    readRaw('decks-v4.json'),
    readRaw('playable-coverage-v4.json'),
    readRaw('technical-copy-review-v2.json'),
    readRaw('task-014-parts.json'),
    readRaw('domain-snapshot-v2.json'),
    readRaw('card-catalog-v3.json'),
    readRaw('decks-v3.json'),
    readRaw('playable-coverage-v3.json'),
    fs.readFile(RESEARCH_REGISTRY_PATH, 'utf8').then((text) => ({ text, value: JSON.parse(text) })),
    fs.readFile(SOURCE_PACK_PATH, 'utf8').then((text) => ({ text, value: JSON.parse(text) })),
  ]);
  const raw = { parts: parts.value, domain: domain.value, cards: cards.value, decks: decks.value, coverage: coverage.value, technical: technical.value };
  const oldRaw = { parts: oldParts.value, domain: oldDomain.value, cards: oldCards.value, decks: oldDecks.value, coverage: oldCoverage.value };
  return {
    raw,
    oldRaw,
    oldText: {
      'task-014-parts.json': oldParts.text,
      'domain-snapshot-v2.json': oldDomain.text,
      'card-catalog-v3.json': oldCards.text,
      'decks-v3.json': oldDecks.text,
      'playable-coverage-v3.json': oldCoverage.text,
    },
    research: research.value,
    sourcePacks: sourcePacks.value,
    provenanceText: { research: research.text, sourcePacks: sourcePacks.text },
    catalogs: createTask042Catalogs(raw),
  };
}

export async function generateTask042Report({ check = false } = {}) {
  const proof = buildTask042Proof(await loadTask042Inputs());
  const artifacts = new Map([
    [TASK_042_OUTPUTS.json, stableTask042Json(proof)],
    [TASK_042_OUTPUTS.markdown, renderTask042Report(proof)],
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
    if (stale.length) throw proofError('STALE_TASK_042_PROOF', `Regenerate ${stale.join(', ')}.`);
  } else {
    await fs.mkdir(OUTPUT_ROOT, { recursive: true });
    await Promise.all([...artifacts].map(([filePath, contents]) => fs.writeFile(filePath, contents, 'utf8')));
  }
  return { check, tickets: proof.tickets.length, objectives: proof.teaching_objectives.length, outputs: [...artifacts.keys()].map((filePath) => path.relative(ROOT, filePath).replaceAll('\\', '/')) };
}

const isEntryPoint = process.argv[1]
  && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isEntryPoint) {
  try {
    console.log(stableTask042Json(await generateTask042Report({ check: process.argv.includes('--check') })).trimEnd());
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
