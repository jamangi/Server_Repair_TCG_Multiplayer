export const STORY_MATCH_CONFIGURATION_VERSION = 'story-match-configuration-v1';
export const STORY_MATCH_RESULT_VERSION = 'story-match-result-v1';
export const DEFAULT_STORY_MATCH_REGISTRY_URL = new URL(
  '../../generated/play/content/story-v1/campaigns/quiet-cascade/matches.json',
  import.meta.url,
);

const SAFE_ID = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/;
const clone = (value) => structuredClone(value);

function record(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function stableId(value, label) {
  if (typeof value !== 'string' || !SAFE_ID.test(value)) throw new TypeError(`${label} is invalid.`);
  return value;
}

function positiveInteger(value, label, maximum = 10) {
  if (!Number.isSafeInteger(value) || value < 1 || value > maximum) {
    throw new TypeError(`${label} must be an integer from 1 through ${maximum}.`);
  }
  return value;
}

export function validateStoryMatchRegistry(candidate) {
  if (!record(candidate)
      || candidate.match_configuration_version !== STORY_MATCH_CONFIGURATION_VERSION
      || !record(candidate.builder_profile)
      || !record(candidate.match_profile)
      || !record(candidate.deck_policy)
      || !record(candidate.normalized_result_contract)
      || !Array.isArray(candidate.matches)) {
    throw new TypeError('Story Match registry is malformed or unsupported.');
  }
  stableId(candidate.campaign_id, 'Campaign ID');
  if (candidate.deck_policy.policy !== 'ACTIVE_PLAYER_DECK_PREFLIGHT') {
    throw new TypeError('Story Match registry has an unsupported deck policy.');
  }
  if (candidate.normalized_result_contract.schema_version !== STORY_MATCH_RESULT_VERSION) {
    throw new TypeError('Story Match result contract is unsupported.');
  }
  const matches = new Map();
  for (const source of candidate.matches) {
    if (!record(source)) throw new TypeError('Story Match entry must be an object.');
    const matchRef = stableId(source.match_ref, 'Story Match reference');
    if (matches.has(matchRef)) throw new TypeError(`Duplicate Story Match reference ${matchRef}.`);
    positiveInteger(source.requested_ticket_count, `${matchRef} Ticket count`);
    if (typeof source.seed !== 'string' || source.seed.length < 1 || source.seed.length > 160) {
      throw new TypeError(`${matchRef} seed is invalid.`);
    }
    for (const field of [
      'chapter_id', 'shift_id', 'pre_match_checkpoint_id', 'post_match_checkpoint_id',
      'launch_label', 'return_label', 'completed_label', 'abandoned_label',
    ]) stableId(source[field], `${matchRef} ${field}`);
    if (!Array.isArray(source.allowed_fingerprint_ids)
        || source.allowed_fingerprint_ids.length !== source.requested_ticket_count
        || new Set(source.allowed_fingerprint_ids).size !== source.allowed_fingerprint_ids.length) {
      throw new TypeError(`${matchRef} must pin one unique fingerprint per requested Ticket.`);
    }
    source.allowed_fingerprint_ids.forEach((id) => stableId(id, `${matchRef} fingerprint`));
    if (!record(source.required_response_card_counts)
        || Object.keys(source.required_response_card_counts).length < 1) {
      throw new TypeError(`${matchRef} response requirements are missing.`);
    }
    for (const [cardId, count] of Object.entries(source.required_response_card_counts)) {
      stableId(cardId, `${matchRef} required Card`);
      positiveInteger(count, `${matchRef} required Card count`, 6);
    }
    if (!Array.isArray(source.expected_ticket_definition_ids)
        || !Array.isArray(source.expected_ticket_snapshot_digests)
        || source.expected_ticket_definition_ids.length !== source.requested_ticket_count
        || source.expected_ticket_snapshot_digests.length !== source.requested_ticket_count
        || source.expected_ticket_snapshot_digests.some((digest) => !/^[a-f0-9]{64}$/.test(digest))) {
      throw new TypeError(`${matchRef} expected Builder output is invalid.`);
    }
    matches.set(matchRef, Object.freeze(clone(source)));
  }
  return Object.freeze({
    version: candidate.match_configuration_version,
    campaignId: candidate.campaign_id,
    builderProfile: Object.freeze(clone(candidate.builder_profile)),
    matchProfile: Object.freeze(clone(candidate.match_profile)),
    deckPolicy: Object.freeze(clone(candidate.deck_policy)),
    resultContract: Object.freeze(clone(candidate.normalized_result_contract)),
    matches,
  });
}

export async function loadStoryMatchRegistry({
  url = DEFAULT_STORY_MATCH_REGISTRY_URL,
  fetchImpl = globalThis.fetch,
} = {}) {
  if (typeof fetchImpl !== 'function') throw new TypeError('Story Match registry requires fetch.');
  const response = await fetchImpl(url, { cache: 'no-store' });
  if (!response?.ok) throw new Error(`Story Match registry failed to load (${response?.status ?? 'network error'}).`);
  return validateStoryMatchRegistry(await response.json());
}

export function resolveStoryMatch(registry, matchRef) {
  stableId(matchRef, 'Story Match reference');
  const definition = registry?.matches?.get?.(matchRef) ?? null;
  if (!definition) throw new Error('The requested Story Match is not in the reviewed registry.');
  return definition;
}

export function preflightStoryDeck(definition, cardDefinitionIds) {
  if (!Array.isArray(cardDefinitionIds) || cardDefinitionIds.length !== 30) {
    return Object.freeze({ ok: false, code: 'INVALID_DECK', missing: [] });
  }
  const counts = new Map();
  for (const id of cardDefinitionIds) counts.set(id, (counts.get(id) ?? 0) + 1);
  const missing = Object.entries(definition.required_response_card_counts)
    .filter(([id, count]) => (counts.get(id) ?? 0) < count)
    .map(([card_definition_id, required_count]) => Object.freeze({
      card_definition_id,
      required_count,
      available_count: counts.get(card_definition_id) ?? 0,
    }));
  return Object.freeze({
    ok: missing.length === 0,
    code: missing.length ? 'DECK_REQUIREMENTS_UNMET' : 'READY',
    missing: Object.freeze(missing),
  });
}

function storyConfigurationId(definition) {
  const shift = definition.shift_id.split('.').at(-1);
  if (!/^\d{2}$/.test(shift)) throw new TypeError('Story Match shift ID cannot produce a reviewed Builder configuration ID.');
  return `builder.story.quiet_cascade.s${shift}`;
}

export function createStoryBuilderConfiguration({
  registry,
  definition,
  cardDefinitionIds,
  diagnosticCardIds,
  configurationId = storyConfigurationId(definition),
}) {
  const profile = registry.builderProfile;
  return {
    id: configurationId,
    entity_type: 'ticket_builder_configuration',
    configuration_version: profile.configuration_version,
    scenario_or_mode_context: profile.scenario_or_mode_context,
    requested_ticket_count: definition.requested_ticket_count,
    seed: definition.seed,
    generator_version: profile.generator_version,
    content_version: profile.ticket_content_version,
    domain_content_version: profile.domain_content_version,
    card_catalog_version: profile.card_catalog_version,
    allowed_domain_ids: [],
    excluded_domain_ids: [],
    allowed_tags: [],
    excluded_tags: [],
    guaranteed_categories: [],
    required_teaching_beats: [],
    authored_difficulty_bounds: clone(profile.authored_difficulty_bounds),
    fault_count_bounds: clone(profile.fault_count_bounds),
    required_actionable_fault_count_bounds: clone(profile.required_actionable_fault_count_bounds),
    causal_depth_bounds: clone(profile.causal_depth_bounds),
    inbound_branching_bounds: clone(profile.inbound_branching_bounds),
    outbound_branching_bounds: clone(profile.outbound_branching_bounds),
    progressive_difficulty_profile: {
      profile_id: profile.progressive_difficulty_profile_id,
      profile_version: profile.progressive_difficulty_profile_version,
      explicit_ceiling: profile.progressive_difficulty_ceiling,
      bands: [{
        start_generated_index: 0,
        end_generated_index: definition.requested_ticket_count - 1,
        target: profile.progressive_difficulty_target,
        minimum: profile.authored_difficulty_bounds.minimum,
        maximum: profile.authored_difficulty_bounds.maximum,
      }],
    },
    generation_index_start: profile.generation_index_start,
    allow_duplicate_causal_fingerprints: profile.allow_duplicate_causal_fingerprints,
    active_causal_fingerprints: [],
    allowed_fingerprint_ids: [...definition.allowed_fingerprint_ids],
    legal_card_definition_ids: [...new Set([...diagnosticCardIds, ...cardDefinitionIds])].sort(),
    diagnostic_card_definition_ids: [...diagnosticCardIds].sort(),
    available_card_definition_counts: cardDefinitionIds.reduce((counts, id) => {
      counts[id] = (counts[id] ?? 0) + 1;
      return counts;
    }, {}),
    fallback_configuration_id: null,
  };
}
