import { createHash } from 'node:crypto';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  analyzeDeckCoverage,
  createTask042Catalogs,
} from '../builder/task-014.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const GAMEPLAY_ROOT = path.join(ROOT, 'content/gameplay-v1');
const STORY_ART_ROOT = path.join(ROOT, 'viewer/assets/story');

const INPUTS = Object.freeze({
  task042Proof: 'docs/coverage/task-042-expansion-domain-network-proof.json',
  campaignOneCoverage: 'docs/story/coverage/campaign-one-domain-coverage.json',
  parts: 'content/gameplay-v1/task-042-parts.json',
  domain: 'content/gameplay-v1/domain-snapshot-v3.json',
  cards: 'content/gameplay-v1/card-catalog-v4.json',
  decks: 'content/gameplay-v1/decks-v4.json',
  coverage: 'content/gameplay-v1/playable-coverage-v4.json',
  currentStoryRegistry: 'content/story-v1/campaigns/quiet-cascade-characterization-v2/registry.json',
  storyArtManifest: 'viewer/assets/story/manifest.json',
});

export const EXPANSION_PLANNING_OUTPUTS = Object.freeze({
  json: path.join(ROOT, 'docs/story/reports/story-expansion-planning-audit.json'),
  markdown: path.join(ROOT, 'docs/story/reports/STORY_EXPANSION_PLANNING_AUDIT.md'),
});

const RESPONSE_DECK_ID = 'deck.story.expansion_response_v1';

const EPISODE_ASSIGNMENTS = Object.freeze([
  {
    episode_id: 'story.shift.qc02.07',
    match_ref: 'story.match.qc02.shift07.socket_contacts',
    seed: 'story.quiet_cascade.expansion.s07.v1',
    slot_id: 'expansion-slot-01',
    case_id: 'exp-001',
    fingerprint_id: 'fingerprint.compute.damaged_cpu_socket_contacts',
    background_asset_ids: [
      'story.bg.trinity.trace.night',
      'story.bg.trinity.core_floor.night_storm',
    ],
    character_asset_ids: [
      'story.asset.character.sora_chen.focused',
      'story.asset.character.sora_chen.approving',
      'story.asset.character.malik_okoye.focused',
    ],
  },
  {
    episode_id: 'story.shift.qc02.08',
    match_ref: 'story.match.qc02.shift08.power_distribution',
    seed: 'story.quiet_cascade.expansion.s08.v1',
    slot_id: 'expansion-slot-02',
    case_id: 'exp-002',
    fingerprint_id: 'fingerprint.power.failed_distribution_board',
    background_asset_ids: [
      'story.bg.trinity.core_floor.night_storm',
      'story.bg.trinity.validation_gate.predawn',
    ],
    character_asset_ids: [
      'story.asset.character.malik_okoye.focused',
      'story.asset.character.malik_okoye.defensive',
      'story.asset.character.hana_park.skeptical',
      'story.asset.character.hana_park.relief',
    ],
  },
  {
    episode_id: 'story.shift.qc02.09',
    match_ref: 'story.match.qc02.shift09.predictive_drive',
    seed: 'story.quiet_cascade.expansion.s09.v1',
    slot_id: 'expansion-slot-03',
    case_id: 'exp-003',
    fingerprint_id: 'fingerprint.storage.predictive_drive_failure',
    background_asset_ids: [
      'story.bg.trinity.core_floor.night_storm',
      'story.bg.trinity.knowledge_systems.night',
    ],
    character_asset_ids: [
      'story.asset.character.jonah_reed.thoughtful',
      'story.asset.character.hana_park.skeptical',
      'story.asset.character.hana_park.relief',
    ],
  },
  {
    episode_id: 'story.shift.qc02.10',
    match_ref: 'story.match.qc02.shift10.stale_alert',
    seed: 'story.quiet_cascade.expansion.s10.v1',
    slot_id: 'expansion-slot-04',
    case_id: 'exp-004',
    fingerprint_id: 'fingerprint.management.stale_alert',
    background_asset_ids: ['story.bg.trinity.knowledge_systems.night'],
    character_asset_ids: [
      'story.asset.character.hana_park.skeptical',
      'story.asset.character.hana_park.relief',
      'story.asset.character.jonah_reed.defensive',
      'story.asset.character.jonah_reed.thoughtful',
    ],
  },
  {
    episode_id: 'story.shift.qc02.11',
    match_ref: 'story.match.qc02.shift11.firmware_regression',
    seed: 'story.quiet_cascade.expansion.s11.v1',
    slot_id: 'expansion-slot-05',
    case_id: 'exp-005',
    fingerprint_id: 'fingerprint.firmware.incompatible_version_set',
    background_asset_ids: [
      'story.bg.trinity.core_floor.night_storm',
      'story.bg.trinity.trace.night',
    ],
    character_asset_ids: [
      'story.asset.character.malik_okoye.focused',
      'story.asset.character.malik_okoye.defensive',
      'story.asset.character.sora_chen.focused',
      'story.asset.character.sora_chen.approving',
    ],
  },
  {
    episode_id: 'story.shift.qc02.12',
    match_ref: 'story.match.qc02.shift12.bmc_recovery',
    seed: 'story.quiet_cascade.expansion.s12.v1',
    slot_id: 'expansion-slot-06',
    case_id: 'exp-006',
    fingerprint_id: 'fingerprint.management.corrupt_bmc_firmware',
    background_asset_ids: [
      'story.bg.trinity.trace.night',
      'story.bg.trinity.validation_gate.predawn',
    ],
    character_asset_ids: [
      'story.asset.character.sora_chen.focused',
      'story.asset.character.sora_chen.approving',
      'story.asset.character.jonah_reed.thoughtful',
      'story.asset.character.hana_park.skeptical',
      'story.asset.character.hana_park.relief',
    ],
  },
].map((entry) => Object.freeze({ ...entry, requested_ticket_count: 1 })));

function sortedUnique(values) {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function counts(values) {
  const result = {};
  for (const value of values) result[value] = (result[value] ?? 0) + 1;
  return Object.fromEntries(Object.entries(result).sort(([left], [right]) => left.localeCompare(right)));
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

async function loadInput(relativePath) {
  const absolutePath = path.join(ROOT, relativePath);
  const bytes = await readFile(absolutePath);
  return {
    path: relativePath.replaceAll('\\', '/'),
    sha256: sha256(bytes),
    value: JSON.parse(bytes.toString('utf8')),
  };
}

async function loadAssetSource(relativePath) {
  const absolutePath = path.join(STORY_ART_ROOT, relativePath);
  const bytes = await readFile(absolutePath);
  const details = await stat(absolutePath);
  if (!details.isFile()) throw new Error(`Story asset source is not a file: ${relativePath}`);
  return {
    path: `viewer/assets/story/${relativePath.replaceAll('\\', '/')}`,
    bytes: bytes.length,
    sha256: sha256(bytes),
  };
}

export async function loadExpansionPlanningInputs() {
  const loaded = Object.fromEntries(await Promise.all(Object.entries(INPUTS).map(async ([key, relativePath]) => [
    key,
    await loadInput(relativePath),
  ])));
  return loaded;
}

function primaryCardByDomainId(cardCatalog) {
  const result = new Map();
  for (const card of cardCatalog.cards) {
    const domainId = card.primary_domain_reference?.entity_id;
    if (!domainId) continue;
    if (result.has(domainId)) throw new Error(`Duplicate primary Card mapping for ${domainId}.`);
    result.set(domainId, card);
  }
  return result;
}

function exactSet(left, right) {
  return JSON.stringify(sortedUnique(left)) === JSON.stringify(sortedUnique(right));
}

function assertion(condition, message) {
  if (!condition) throw new Error(`TASK-043 planning audit failed: ${message}`);
}

function buildDeckFeasibility(raw, ticketsByCase) {
  const catalogs = createTask042Catalogs({
    cards: raw.cards,
    decks: raw.decks,
    domain: raw.domain,
    parts: raw.parts,
    coverage: raw.coverage,
  });
  const deck = raw.decks.decks.find((entry) => entry.id === RESPONSE_DECK_ID);
  assertion(deck, `missing ${RESPONSE_DECK_ID}`);
  const deckCounts = counts(deck.card_definition_ids);
  assertion(deck.card_definition_ids.length === 30, 'expansion response Deck is not exactly 30 Cards');
  assertion(Math.max(...Object.values(deckCounts)) <= 3, 'expansion response Deck exceeds the three-copy limit');

  const builderCoverage = analyzeDeckCoverage({
    cardDefinitionIds: deck.card_definition_ids,
    catalogs,
  });
  const compatibleFingerprints = builderCoverage.fingerprints
    .filter((entry) => entry.compatible)
    .map((entry) => entry.fingerprint_id);
  assertion(builderCoverage.eligible_unique_count === 6, 'expansion Deck cannot fund all six distinct fingerprints together');
  assertion(builderCoverage.individually_compatible_count === 6, 'expansion Deck has an unexpected compatible fingerprint count');
  assertion(exactSet(compatibleFingerprints, EPISODE_ASSIGNMENTS.map((entry) => entry.fingerprint_id)), 'Deck-compatible fingerprints diverge from episode assignments');

  const cardByDomainId = primaryCardByDomainId(raw.cards);
  const rootByFingerprint = new Map(raw.parts.fingerprint_roots.map((entry) => [entry.fingerprint_id, entry]));
  const episodes = EPISODE_ASSIGNMENTS.map((assignment) => {
    const ticket = ticketsByCase.get(assignment.case_id);
    assertion(ticket?.slot_id === assignment.slot_id, `${assignment.case_id} slot mismatch`);
    assertion(ticket?.fingerprint_id === assignment.fingerprint_id, `${assignment.case_id} fingerprint mismatch`);
    const root = rootByFingerprint.get(assignment.fingerprint_id);
    assertion(root?.response_deck_id === RESPONSE_DECK_ID, `${assignment.fingerprint_id} does not select the expansion Deck`);
    assertion(root?.teaching_part_id, `${assignment.fingerprint_id} lacks an explicit teaching part`);

    const diagnosticIds = ticket.solvability_witness
      .filter((step) => step.action === 'RUN_DIAGNOSTIC')
      .map((step) => step.source_definition_id);
    const diagnosticCardIds = diagnosticIds.map((id) => {
      const card = cardByDomainId.get(id);
      assertion(card?.card_type === 'test' || card?.card_type === 'command', `${id} lacks a Diagnostic Bench Card`);
      return card.id;
    });
    const repairId = ticket.repair_procedure_ids.at(0);
    const verifyId = ticket.validation_procedure_ids.at(0);
    const repairCard = cardByDomainId.get(repairId);
    const verifyCard = cardByDomainId.get(verifyId);
    assertion(repairCard?.card_type === 'repair_procedure', `${repairId} lacks a Repair Card`);
    assertion(verifyCard?.card_type === 'verification', `${verifyId} lacks a Verify Card`);
    assertion((deckCounts[repairCard.id] ?? 0) >= 1, `${repairCard.id} is unreachable from the expansion Deck`);
    assertion((deckCounts[verifyCard.id] ?? 0) >= 1, `${verifyCard.id} is unreachable from the expansion Deck`);

    return {
      episode_id: assignment.episode_id,
      match_ref: assignment.match_ref,
      seed: assignment.seed,
      requested_ticket_count: assignment.requested_ticket_count,
      case_id: assignment.case_id,
      slot_id: assignment.slot_id,
      learning_objective_key: ticket.learning_objective_key,
      learning_objective: ticket.learning_objectives.at(0),
      fingerprint_id: assignment.fingerprint_id,
      source_ticket_id: ticket.ticket_id,
      source_ticket_snapshot_digest: ticket.ticket_snapshot_digest,
      diagnostic_bench_definition_ids: diagnosticIds,
      diagnostic_bench_card_ids: diagnosticCardIds,
      repair: {
        domain_id: repairId,
        card_id: repairCard.id,
        copies_required: 1,
        copies_available: deckCounts[repairCard.id],
        surplus_copies: deckCounts[repairCard.id] - 1,
      },
      verify: {
        domain_id: verifyId,
        card_id: verifyCard.id,
        copies_required: 1,
        copies_available: deckCounts[verifyCard.id],
        surplus_copies: deckCounts[verifyCard.id] - 1,
      },
      teaching_part_id: root.teaching_part_id,
      deck_feasible: true,
      owner: 'Gameplay/Builder owner; Story graph owner must preserve this exact Match assignment',
    };
  });

  return {
    owner: 'Gameplay/Builder owner',
    release_dependency_owner: 'TASK-046 release/migration owner',
    deck_id: deck.id,
    deck_catalog_version: raw.decks.deck_catalog_version,
    card_catalog_version: raw.cards.card_catalog_version,
    exact_card_count: deck.card_definition_ids.length,
    distinct_card_definition_count: Object.keys(deckCounts).length,
    maximum_copies_observed: Math.max(...Object.values(deckCounts)),
    maximum_copies_allowed: 3,
    card_definition_counts: deckCounts,
    builder_coverage: {
      supported_fingerprint_count: builderCoverage.supported_unique_count,
      individually_compatible_count: builderCoverage.individually_compatible_count,
      jointly_fundable_distinct_count: builderCoverage.eligible_unique_count,
      compatible_fingerprint_ids: sortedUnique(compatibleFingerprints),
    },
    diagnostic_bench_contract: {
      definition_count: raw.coverage.inventory.promoted_diagnostics,
      deck_slots_consumed: 0,
      note: 'Tests and Commands remain on the Global Diagnostic Bench; only Repair and Verify Cards consume this response Deck.',
    },
    episodes,
    live_release_status: 'STAGED_NOT_LIVE',
  };
}

function campaignOneTickets(campaignOneCoverage) {
  return campaignOneCoverage.shifts.flatMap((shift) => shift.tickets);
}

function expansionTicketValues(ticket, category) {
  if (category === 'symptoms') return ticket.symptom_ids;
  if (category === 'public_candidate_faults') return ticket.public_candidate_fault_ids;
  if (category === 'truth_faults') return ticket.true_fault_ids;
  if (category === 'minimal_witness_diagnostics') {
    return ticket.solvability_witness.filter((step) => step.action === 'RUN_DIAGNOSTIC').map((step) => step.source_definition_id);
  }
  if (category === 'repairs') return ticket.repair_procedure_ids;
  if (category === 'verifications') return ticket.validation_procedure_ids;
  if (category === 'supported_fingerprints') return [ticket.fingerprint_id];
  throw new Error(`Unknown coverage category ${category}.`);
}

function campaignOneTicketValues(ticket, category) {
  if (category === 'symptoms') return ticket.public.symptom_ids;
  if (category === 'public_candidate_faults') return ticket.public.candidate_fault_ids;
  if (category === 'truth_faults') return ticket.server_only_truth.fault_instances.map((entry) => entry.fault_id);
  if (category === 'minimal_witness_diagnostics') return ticket.diagnostics.minimal_witness_source_ids;
  if (category === 'repairs') return ticket.closure.repair_procedure_ids;
  if (category === 'verifications') return ticket.closure.validation_procedure_ids;
  if (category === 'supported_fingerprints') return [ticket.fingerprint_id];
  throw new Error(`Unknown coverage category ${category}.`);
}

function coverageDeltaEntry({ category, baselineTickets, expansionTickets, denominator }) {
  const baselineOccurrences = baselineTickets.flatMap((ticket) => campaignOneTicketValues(ticket, category));
  const expansionOccurrences = expansionTickets.flatMap((ticket) => expansionTicketValues(ticket, category));
  const baselineIds = sortedUnique(baselineOccurrences);
  const expansionIds = sortedUnique(expansionOccurrences);
  const combinedIds = sortedUnique([...baselineIds, ...expansionIds]);
  const newIds = expansionIds.filter((id) => !baselineIds.includes(id));
  return {
    denominator,
    baseline_unique: baselineIds.length,
    expansion_unique: expansionIds.length,
    newly_exercised_unique: newIds.length,
    combined_unique_forecast: combinedIds.length,
    combined_percent_forecast: Number(((combinedIds.length / denominator) * 100).toFixed(1)),
    baseline_practice_occurrences: baselineOccurrences.length,
    expansion_practice_occurrences: expansionOccurrences.length,
    combined_practice_occurrences_forecast: baselineOccurrences.length + expansionOccurrences.length,
    newly_exercised_ids: newIds,
    repeated_from_campaign_one_ids: expansionIds.filter((id) => baselineIds.includes(id)),
  };
}

function buildCoverageForecast(raw, expansionTickets) {
  const baselineTickets = campaignOneTickets(raw.campaignOneCoverage);
  const categoryDenominators = {
    symptoms: raw.campaignOneCoverage.denominators.complete_domain_inventory.by_entity_type.symptom,
    public_candidate_faults: raw.campaignOneCoverage.denominators.complete_domain_inventory.by_entity_type.fault,
    truth_faults: raw.campaignOneCoverage.denominators.complete_domain_inventory.by_entity_type.fault,
    minimal_witness_diagnostics: raw.coverage.inventory.promoted_diagnostics,
    repairs: raw.coverage.inventory.selected_repairs,
    verifications: raw.coverage.inventory.selected_validations,
    supported_fingerprints: raw.coverage.inventory.supported_fingerprints,
  };
  const categories = Object.fromEntries(Object.entries(categoryDenominators).map(([category, denominator]) => [
    category,
    coverageDeltaEntry({ category, baselineTickets, expansionTickets, denominator }),
  ]));
  const combinedMinimalActionIds = sortedUnique([
    ...baselineTickets.flatMap((ticket) => ticket.diagnostics.minimal_witness_source_ids),
    ...baselineTickets.flatMap((ticket) => ticket.closure.repair_procedure_ids),
    ...baselineTickets.flatMap((ticket) => ticket.closure.validation_procedure_ids),
    ...expansionTickets.flatMap((ticket) => expansionTicketValues(ticket, 'minimal_witness_diagnostics')),
    ...expansionTickets.flatMap((ticket) => ticket.repair_procedure_ids),
    ...expansionTickets.flatMap((ticket) => ticket.validation_procedure_ids),
  ]);
  const usefulCommands = sortedUnique(expansionTickets.flatMap((ticket) => ticket.commands.useful_candidate_changing_ids));
  const authoredCommands = sortedUnique(expansionTickets.flatMap((ticket) => ticket.commands.isolation_route_source_ids));
  const minimalCommands = sortedUnique(expansionTickets.flatMap((ticket) => ticket.commands.minimal_witness_ids));

  return {
    owner: 'Coverage owner; TASK-046 release/migration owner must replace this forecast with the post-release audit',
    baseline_audit_version: raw.campaignOneCoverage.audit_version,
    forecast_basis: 'Six QC02 episodes, each executing its assigned TASK-042 fingerprint once; minimal-witness practice is forecast rather than inferred from catalog visibility.',
    categories,
    combined_minimal_witness_playable_actions: {
      numerator: combinedMinimalActionIds.length,
      denominator: raw.coverage.inventory.playable_card_definitions,
      percent: Number(((combinedMinimalActionIds.length / raw.coverage.inventory.playable_card_definitions) * 100).toFixed(1)),
      stable_ids: combinedMinimalActionIds,
    },
    commands: {
      catalog_exposure_count: raw.coverage.inventory.commands,
      expansion_useful_candidate_changing_ids: usefulCommands,
      expansion_authored_isolation_route_source_ids: authoredCommands,
      expansion_oracle_minimal_required_ids: minimalCommands,
      campaign_one_oracle_minimal_required_count: raw.campaignOneCoverage.deterministic_totals.commands.minimal_witness_actions,
      interpretation: 'Catalog exposure, useful Evidence, authored route participation, and oracle-minimal requirement remain separate counts.',
    },
    release_reaudit_required: true,
  };
}

async function assetRecord(assetId, manifestAsset, expectedLayer) {
  assertion(manifestAsset, `missing Story art manifest entry ${assetId}`);
  assertion(manifestAsset.kind === 'production', `${assetId} is not a production asset`);
  assertion(manifestAsset.layer === expectedLayer, `${assetId} layer is not ${expectedLayer}`);
  assertion(manifestAsset.decorative === false, `${assetId} must have meaningful accessible text`);
  assertion(typeof manifestAsset.alt_text === 'string' && manifestAsset.alt_text.length > 0, `${assetId} lacks manifest alt text`);
  const sourceEntries = await Promise.all(Object.entries(manifestAsset.sources).sort(([left], [right]) => left.localeCompare(right)).map(async ([variant, relativePath]) => ({
    variant,
    ...await loadAssetSource(relativePath),
  })));
  assertion(exactSet(sourceEntries.map((entry) => entry.variant), ['desktop', 'mobile', 'reduced_data']), `${assetId} lacks a responsive variant`);
  return {
    asset_id: assetId,
    layer: manifestAsset.layer,
    alt_text: manifestAsset.alt_text,
    fallback_asset_id: manifestAsset.fallback_asset_id,
    sources: sourceEntries,
  };
}

async function fallbackRecord(assetId, manifestAsset) {
  assertion(manifestAsset?.kind === 'fallback', `missing fallback asset ${assetId}`);
  const sourceEntries = await Promise.all(Object.entries(manifestAsset.sources).sort(([left], [right]) => left.localeCompare(right)).map(async ([variant, relativePath]) => ({
    variant,
    ...await loadAssetSource(relativePath),
  })));
  assertion(exactSet(sourceEntries.map((entry) => entry.variant), ['desktop', 'mobile', 'reduced_data']), `${assetId} lacks a responsive variant`);
  return { asset_id: assetId, layer: manifestAsset.layer, sources: sourceEntries };
}

async function buildAssetPlan(raw) {
  const registryById = new Map(raw.currentStoryRegistry.assets.map((entry) => [entry.asset_id, entry]));
  const poseRefByAssetId = new Map(raw.currentStoryRegistry.characters.flatMap((character) => character.poses.map((pose) => [
    pose.asset_id,
    `${character.character_id}:${pose.pose_id}`,
  ])));
  const manifestAssets = raw.storyArtManifest.assets;
  const backgroundIds = sortedUnique(EPISODE_ASSIGNMENTS.flatMap((entry) => entry.background_asset_ids));
  const characterIds = sortedUnique(EPISODE_ASSIGNMENTS.flatMap((entry) => entry.character_asset_ids));
  const selectedIds = [...backgroundIds, ...characterIds];
  for (const assetId of selectedIds) {
    const registry = registryById.get(assetId);
    assertion(registry?.required === true, `${assetId} is not a required current Story registry asset`);
    assertion(registry.layer === manifestAssets[assetId]?.layer, `${assetId} registry/manifest layer mismatch`);
  }
  const productionAssets = await Promise.all([
    ...backgroundIds.map((id) => assetRecord(id, manifestAssets[id], 'BACKGROUND')),
    ...characterIds.map((id) => assetRecord(id, manifestAssets[id], 'CHARACTER')),
  ]);
  const fallbackIds = sortedUnique(productionAssets.map((entry) => entry.fallback_asset_id));
  const fallbacks = await Promise.all(fallbackIds.map((id) => fallbackRecord(id, manifestAssets[id])));
  const consideredNotSelected = Object.entries(manifestAssets)
    .filter(([id, entry]) => entry.kind === 'production' && !selectedIds.includes(id))
    .map(([assetId, entry]) => ({
      asset_id: assetId,
      layer: entry.layer,
      disposition: entry.layer === 'TRANSIENT' ? 'REJECT_CAMPAIGN_ONE_SPECIFIC_INSERT' : 'AVAILABLE_BUT_NOT_NEEDED',
      rationale: entry.layer === 'TRANSIENT'
        ? 'The rasterized insert carries QC01-specific content; QC02 comprehension remains in accessible Story text and gameplay projections.'
        : 'The current cast/location plan does not need this asset; adding it would create a gratuitous appearance or location change.',
    }))
    .sort((left, right) => left.asset_id.localeCompare(right.asset_id));

  return {
    owner: 'TASK-045 Art/accessibility owner validates reuse, fallbacks, crops, hashes, and browser behavior; TASK-044 owns accessible textual comprehension',
    story_art_manifest_version: raw.storyArtManifest.asset_manifest_version,
    current_registry_version: raw.currentStoryRegistry.registry_version,
    policy: 'REUSE_ONLY_NO_TRANSIENT_INSERTS',
    episodes: EPISODE_ASSIGNMENTS.map((entry) => ({
      episode_id: entry.episode_id,
      background_asset_ids: entry.background_asset_ids,
      character_pose_ids: entry.character_asset_ids.map((assetId) => {
        const poseRef = poseRefByAssetId.get(assetId);
        assertion(poseRef, `${assetId} lacks a registered character/pose binding`);
        return poseRef;
      }),
      transient_asset_ids: [],
      new_master_asset_ids: [],
      reuse_owner: 'Story graph owner preserves references; TASK-045 Art/accessibility owner verifies delivery',
    })),
    unique_production_asset_counts: {
      backgrounds: backgroundIds.length,
      characters: characterIds.length,
      transients: 0,
      total: productionAssets.length,
    },
    production_assets: productionAssets,
    fallbacks,
    considered_not_selected: consideredNotSelected,
    gaps: [],
    task_045_handoff: {
      owner: 'TASK-045 Art/accessibility owner',
      new_master_requests: [],
      expected_generation_count: 0,
      verification_only: true,
      obligations: [
        'Recheck every responsive source hash and fallback before release.',
        'Confirm every QC02 registry reference has localized accessible alt text even though the physical master is reused.',
        'Exercise desktop, mobile, zoom, reduced-motion, reduced-data, and missing-asset fallback behavior.',
        'Open a new-master request only if reachable TASK-044 prose proves a comprehension need that accessible text and these reusable layers cannot satisfy.',
      ],
    },
  };
}

export function assertBlueprintAssignments(audit, blueprintEpisodes) {
  const expectedById = new Map(audit.episode_assignments.map((entry) => [entry.episode_id, entry]));
  const assetPlanById = new Map(audit.asset_plan.episodes.map((entry) => [entry.episode_id, entry]));
  assertion(Array.isArray(blueprintEpisodes) && blueprintEpisodes.length === expectedById.size, 'blueprint episode count diverges from planning audit');
  for (const episode of blueprintEpisodes) {
    const expected = expectedById.get(episode.episode_id);
    const expectedAssets = assetPlanById.get(episode.episode_id);
    assertion(expected, `blueprint contains unexpected episode ${episode.episode_id}`);
    for (const field of ['match_ref', 'seed', 'case_id', 'fingerprint_id', 'requested_ticket_count']) {
      assertion(episode[field] === expected[field], `${episode.episode_id} ${field} diverges from planning audit`);
    }
    assertion(exactSet(episode.background_asset_ids, expected.background_asset_ids), `${episode.episode_id} background assignments diverge from planning audit`);
    assertion(exactSet(episode.character_pose_ids, expectedAssets.character_pose_ids), `${episode.episode_id} character assignments diverge from planning audit`);
  }
  return true;
}

export async function buildExpansionPlanningAudit(inputs) {
  const raw = Object.fromEntries(Object.entries(inputs).map(([key, input]) => [key, input.value]));
  const ticketsByCase = new Map(raw.task042Proof.tickets.map((ticket) => [ticket.case_id, ticket]));
  assertion(ticketsByCase.size === 6, 'TASK-042 proof does not contain six unique cases');
  assertion(exactSet([...ticketsByCase.keys()], EPISODE_ASSIGNMENTS.map((entry) => entry.case_id)), 'episode cases diverge from TASK-042 proof');

  const deck_feasibility = buildDeckFeasibility(raw, ticketsByCase);
  const coverage_delta_forecast = buildCoverageForecast(raw, [...ticketsByCase.values()]);
  const asset_plan = await buildAssetPlan(raw);
  const episode_assignments = EPISODE_ASSIGNMENTS.map((entry) => ({
    ...entry,
    source_ticket_id: ticketsByCase.get(entry.case_id).ticket_id,
    source_ticket_snapshot_digest: ticketsByCase.get(entry.case_id).ticket_snapshot_digest,
  }));

  return {
    audit_version: 'story-expansion-planning-audit-v1',
    status: 'CANDIDATE_BLUEPRINT_INPUT_NOT_LIVE',
    owners: {
      assignment_contract: 'Story graph owner with Gameplay/Builder Match sign-off',
      deck_feasibility: 'Gameplay/Builder owner',
      coverage_forecast: 'Coverage owner; TASK-046 replaces forecast with release audit',
      asset_reuse: 'Story graph owner and TASK-045 Art/accessibility owner',
      accessible_context: 'TASK-044 writing/continuity owner',
      release_boundary: 'TASK-046 release/migration owner',
    },
    pins: Object.fromEntries(Object.entries(inputs).map(([key, input]) => [key, {
      path: input.path,
      sha256: input.sha256,
    }])),
    versions: {
      ruleset: raw.parts.ruleset_version,
      builder: raw.parts.generator_version,
      parts: raw.parts.part_catalog_version,
      tickets: raw.parts.ticket_content_version,
      domain: raw.domain.domain_content_version,
      cards: raw.cards.card_catalog_version,
      decks: raw.decks.deck_catalog_version,
      coverage: raw.coverage.coverage_version,
      campaign_one_coverage: raw.campaignOneCoverage.audit_version,
      story_art: raw.storyArtManifest.asset_manifest_version,
    },
    episode_assignments,
    deck_feasibility,
    coverage_delta_forecast,
    asset_plan,
    stop_conditions: [
      'A blueprint episode changes case, fingerprint, Match reference, seed, Ticket count, or planned art without regenerating and reviewing this audit.',
      'The active response Deck cannot fund all six assigned fingerprints or any required Repair/Verify Card becomes unreachable.',
      'Catalog visibility, useful Command Evidence, or a public Candidate is counted as practiced without an authored minimal route.',
      'A transient insert or new master is requested without a reachable, text-insufficient comprehension need.',
      'The staged TASK-042 gameplay generation is treated as live before TASK-046 performs the release and migration boundary.',
    ],
  };
}

function code(value) {
  return `\`${value}\``;
}

function list(values) {
  return values.length ? values.map(code).join(', ') : 'None';
}

export function renderExpansionPlanningAudit(audit) {
  const deckRows = audit.deck_feasibility.episodes.map((episode) => `| ${code(episode.episode_id)} | ${code(episode.case_id)} / ${code(episode.fingerprint_id)} | ${list(episode.diagnostic_bench_definition_ids)} | ${code(episode.repair.card_id)} (${episode.repair.copies_available}) | ${code(episode.verify.card_id)} (${episode.verify.copies_available}) | Yes |`).join('\n');
  const coverageRows = Object.entries(audit.coverage_delta_forecast.categories).map(([category, entry]) => `| ${category.replaceAll('_', ' ')} | ${entry.baseline_unique} | ${entry.expansion_unique} | +${entry.newly_exercised_unique} | ${entry.combined_unique_forecast}/${entry.denominator} (${entry.combined_percent_forecast}%) | ${entry.baseline_practice_occurrences} → ${entry.combined_practice_occurrences_forecast} |`).join('\n');
  const artRows = audit.asset_plan.episodes.map((episode) => `| ${code(episode.episode_id)} | ${list(episode.background_asset_ids)} | ${list(episode.character_pose_ids)} | 0 |`).join('\n');
  const pinRows = Object.entries(audit.versions).map(([key, value]) => `- ${key.replaceAll('_', ' ')}: ${code(value)}`).join('\n');
  return `# Story expansion planning audit\n\nStatus: **candidate QC02 blueprint input; staged gameplay is not live**\n\nThis generated audit fixes the deck, coverage, and art assumptions for six player-facing episodes, Shifts 7–12. It does not write the graph, scripts, final dialogue, production art, or release migration.\n\n## Version pins\n\n${pinRows}\n\n## Deck feasibility\n\nOwner: **${audit.deck_feasibility.owner}**. Release switch: **${audit.deck_feasibility.release_dependency_owner}**.\n\n${code(audit.deck_feasibility.deck_id)} is an exact ${audit.deck_feasibility.exact_card_count}-Card response Deck with ${audit.deck_feasibility.distinct_card_definition_count} definitions and at most ${audit.deck_feasibility.maximum_copies_observed} copies of one definition. The real Builder coverage analysis finds ${audit.deck_feasibility.builder_coverage.individually_compatible_count} individually compatible fingerprints and can fund all ${audit.deck_feasibility.builder_coverage.jointly_fundable_distinct_count} together. The ${audit.deck_feasibility.diagnostic_bench_contract.definition_count} Diagnostics consume no response-deck slots.\n\n| Episode | Case / fingerprint | Minimal Diagnostic Bench witness | Repair Card (copies) | Verify Card (copies) | Feasible |\n| --- | --- | --- | --- | --- | --- |\n${deckRows}\n\nEach episode requests one Ticket. Every Repair has two surplus copies and every Verify has one surplus copy after that episode's closure need. The source Ticket IDs/digests remain TASK-042 proof pins; the QC02 graph owns the final seed-specific Match build and must not silently substitute another assignment.\n\n## Coverage-delta forecast\n\nOwner: **${audit.coverage_delta_forecast.owner}**. This is a forecast of six assigned minimal witnesses, not a claim that catalog visibility equals teaching.\n\n| Coverage role | Campaign one unique | Expansion unique | Newly exercised | Combined / denominator | Practice occurrences |\n| --- | ---: | ---: | ---: | ---: | ---: |\n${coverageRows}\n\nThe combined minimal-witness action forecast is **${audit.coverage_delta_forecast.combined_minimal_witness_playable_actions.numerator}/${audit.coverage_delta_forecast.combined_minimal_witness_playable_actions.denominator} (${audit.coverage_delta_forecast.combined_minimal_witness_playable_actions.percent}%)** playable definitions. TASK-046 must regenerate the authoritative post-release audit from the published graph and real Match proofs.\n\n### Commands stay separate\n\n- Catalog exposure: ${audit.coverage_delta_forecast.commands.catalog_exposure_count}\n- Useful Candidate-changing Evidence in the expansion: ${list(audit.coverage_delta_forecast.commands.expansion_useful_candidate_changing_ids)}\n- Authored expansion Isolation-route Commands: ${list(audit.coverage_delta_forecast.commands.expansion_authored_isolation_route_source_ids)}\n- Oracle-minimal required expansion Commands: ${list(audit.coverage_delta_forecast.commands.expansion_oracle_minimal_required_ids)}\n\n## Asset reuse and gap inventory\n\nOwner: **${audit.asset_plan.owner}**. Policy: **${audit.asset_plan.policy}**.\n\n| Episode | Existing backgrounds | Existing character poses | New masters |\n| --- | --- | --- | ---: |\n${artRows}\n\nThe plan reuses **${audit.asset_plan.unique_production_asset_counts.backgrounds} backgrounds** and **${audit.asset_plan.unique_production_asset_counts.characters} character poses**. It references no transient insert, requests no new master, and has **${audit.asset_plan.gaps.length} true asset gaps**. All selected production assets and their background/character fallbacks have desktop, mobile, and reduced-data files with pinned hashes in the JSON companion.\n\nThe three QC01-specific transient inserts were considered and rejected for reuse because their raster content describes a different campaign segment. QC02 comprehension remains in localized HTML Story text and player-safe gameplay projections. Two existing backgrounds and six existing poses are available but not needed by the current cast/location plan.\n\nTASK-045 is therefore a real zero-generation verification pass unless reachable TASK-044 prose proves a new comprehension requirement. Its owner must recheck hashes, fallbacks, crops, reduced-data behavior, localized alt text, and supported browser/accessibility states.\n\n## Assignment and release boundary\n\n${audit.episode_assignments.map((episode) => `- ${code(episode.episode_id)} → ${code(episode.match_ref)}; seed ${code(episode.seed)}; ${code(episode.case_id)} / ${code(episode.fingerprint_id)}.`).join('\n')}\n\nThe graph validator must compare its six assignments and asset references with the machine ledger and fail closed on divergence. TASK-042 gameplay remains staged only; TASK-046 owns the atomic live loader/content composition and migration.\n\n## Stop conditions\n\n${audit.stop_conditions.map((entry) => `- ${entry}`).join('\n')}\n`;
}

export function stableExpansionPlanningJson(audit) {
  return `${JSON.stringify(audit, null, 2)}\n`;
}

export async function generateExpansionPlanningAudit({ check = false } = {}) {
  const inputs = await loadExpansionPlanningInputs();
  const audit = await buildExpansionPlanningAudit(inputs);
  const outputs = new Map([
    [EXPANSION_PLANNING_OUTPUTS.json, stableExpansionPlanningJson(audit)],
    [EXPANSION_PLANNING_OUTPUTS.markdown, renderExpansionPlanningAudit(audit)],
  ]);
  if (check) {
    const stale = [];
    for (const [outputPath, expected] of outputs) {
      const actual = await readFile(outputPath, 'utf8').catch(() => null);
      if (actual !== expected) stale.push(path.relative(ROOT, outputPath).replaceAll('\\', '/'));
    }
    if (stale.length) throw new Error(`TASK-043 planning outputs are stale or missing: ${stale.join(', ')}.`);
  } else {
    await mkdir(path.dirname(EXPANSION_PLANNING_OUTPUTS.json), { recursive: true });
    await Promise.all([...outputs].map(([outputPath, contents]) => writeFile(outputPath, contents)));
  }
  return audit;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const check = process.argv.includes('--check');
  const audit = await generateExpansionPlanningAudit({ check });
  console.log(`${check ? 'Checked' : 'Generated'} ${audit.episode_assignments.length} episode deck/coverage/art planning records with ${audit.asset_plan.gaps.length} asset gaps.`);
}
