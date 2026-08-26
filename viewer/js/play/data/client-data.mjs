export const IMPLEMENTATION_PROFILE_ID = 'solo-pages-v2';
export const LOCAL_STATE_VERSION = 'solo-local-state-v2';
export const PROFILE_VERSION = 'solo-profile-v2';
export const DECKS_VERSION = 'solo-decks-v2';
export const SETTINGS_VERSION = 'solo-settings-v2';
export const STATISTICS_VERSION = 'solo-statistics-v2';
export const EXPORT_VERSION = 'solo-export-v2';
export const RESULT_SUMMARY_VERSION = 'solo-result-summary-v2';
export const TUTORIAL_PROGRESS_VERSION = 'solo-tutorial-progress-v1';
export const TUTORIAL_CATALOG_VERSION = 'tutorial-checkpoints-v1';
export const RULESET_VERSION = 'first-version-v2';
export const CARD_CATALOG_VERSION = 'core-card-catalog-diagnosis-v2';
export const PRIOR_EXPANDED_CARD_CATALOG_VERSION = 'core-card-catalog-coverage-v3';
export const EXPANDED_CARD_CATALOG_VERSION = 'core-card-catalog-technical-copy-v4';
export const STORAGE_KEY = 'server-repair-tcg:solo-pages-v2:state';
export const MAX_IMPORT_BYTES = 512 * 1024;
export const PROFILE_NAME_MAX_LENGTH = 40;
export const DECK_NAME_MAX_LENGTH = 48;
export const MAX_SAVED_DECKS = 64;
export const STARTER_SOURCE_DECK_ID = 'deck.core.storage_response_v2';
export const EXPANDED_STARTER_SOURCE_DECK_ID = 'deck.core.multisystem_response_v3';
export const STARTER_LOCAL_DECK_ID = 'deck.local.storage_response_v2';
export const MAX_COPIES_PER_CARD_ID = 6;
export const PROFILE_ICON_IDS = Object.freeze([
  'cosmetic.profile.console',
  'cosmetic.profile.field',
  'cosmetic.profile.storage',
  'cosmetic.profile.systems',
]);
export const SUPPORTED_PRIOR_STORAGE_VERSIONS = Object.freeze(['solo-local-state-v1']);

const PROFILE_KEYS = ['schema_version', 'profile_id', 'display_name', 'icon_id'];
const DECK_KEYS = ['deck_id', 'display_name', 'source_deck_id', 'card_definition_ids'];
const DECK_COLLECTION_KEYS = [
  'schema_version',
  'ruleset_version',
  'card_catalog_version',
  'active_deck_id',
  'decks',
];
const SETTINGS_KEYS = ['schema_version', 'starting_ticket_count', 'motion_preference', 'drag_enabled', 'preferred_bench_view'];
const PROCESSED_RESULT_KEYS = ['match_id', 'result_id'];
const STATISTIC_KEYS = [
  'matches_started',
  'matches_completed',
  'solo_wins',
  'solo_losses',
  'solo_stalemates',
  'invalid_or_capped_results',
  'tickets_closed',
  'starting_service_points_total',
  'final_service_points_total',
  'lifetime_service_points_gained',
  'tests',
  'accepted_isolations',
  'rejected_isolations',
  'repairs',
  'verify_attempts',
  'verify_passes',
  'verify_failures',
  'verify_inconclusive_results',
  'documentation',
  'assists',
  'failed_verify',
  'redundant_or_superseded_actions',
  'turns',
  'authoritative_elapsed_seconds',
  'search_uses',
  'refresh_uses',
  'eliminations_recorded',
  'tickets_given_up',
];
const POINT_STATISTIC_KEYS = new Set([
  'starting_service_points_total',
  'final_service_points_total',
  'lifetime_service_points_gained',
]);
const STATISTICS_KEYS = ['schema_version', 'processed_match_start_ids', 'processed_match_results', 'totals'];
const LOCAL_RECORD_KEYS = ['profile', 'decks', 'settings', 'statistics', 'tutorials'];
const LOCAL_STATE_KEYS = ['storage_version', 'records'];
const EXPORT_KEYS = ['schema_version', 'implementation_profile_id', 'exported_at', 'records'];
const WORKER_RESULT_COUNTER_MAP = Object.freeze({
  tickets_closed: 'tickets_closed',
  tests_run: 'tests',
  isolations_accepted: 'accepted_isolations',
  isolations_rejected: 'rejected_isolations',
  repairs_performed: 'repairs',
  verify_attempts: 'verify_attempts',
  verify_passes: 'verify_passes',
  verify_failures: 'verify_failures',
  verify_inconclusive: 'verify_inconclusive_results',
  documentation_actions: 'documentation',
  assists: 'assists',
  failed_verifies: 'failed_verify',
  redundant_or_superseded_actions: 'redundant_or_superseded_actions',
  turns_elapsed: 'turns',
  elapsed_seconds: 'authoritative_elapsed_seconds',
  search_uses: 'search_uses',
  refresh_uses: 'refresh_uses',
  eliminations_recorded: 'eliminations_recorded',
  tickets_given_up: 'tickets_given_up',
});
const RESULT_OUTCOME_KEYS = [
  'solo_wins',
  'solo_losses',
  'solo_stalemates',
  'invalid_or_capped_results',
];
const RESULT_SUMMARY_KEYS = [
  'summary_version',
  'result_id',
  'match_id',
  'reason_codes',
  'valid',
  'matches_completed',
  ...RESULT_OUTCOME_KEYS,
  'starting_service_points',
  'final_service_points',
  'service_points_gained',
  ...Object.keys(WORKER_RESULT_COUNTER_MAP),
];
const RESULT_REASON_CODES = new Set([
  'ADMIN_INVALIDATION',
  'NO_HUMANS',
  'FORFEIT',
  'QUEUE_EMPTY',
  'SCORE_THRESHOLD',
  'STALEMATE',
  'SIMULATION_CAP',
  'GIVE_UP',
]);
const FORBIDDEN_PROPERTY_NAMES = new Set(['__proto__', 'prototype', 'constructor']);
const STABLE_ID = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/;
const CONTROL_CHARACTER = /[\u0000-\u001f\u007f]/;
const RFC3339_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

export class ClientDataError extends Error {
  constructor(code, message, details = []) {
    super(message);
    this.name = 'ClientDataError';
    this.code = code;
    this.details = details;
  }
}

function issue(path, code, message) {
  return { path, code, message };
}

function isPlainObject(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function validateExactKeys(value, expectedKeys, path, errors) {
  if (!isPlainObject(value)) {
    errors.push(issue(path, 'EXPECTED_OBJECT', 'Expected an object.'));
    return false;
  }
  const expected = new Set(expectedKeys);
  for (const key of Object.keys(value)) {
    if (!expected.has(key)) errors.push(issue(`${path}.${key}`, 'UNKNOWN_FIELD', `Unknown field ${key}.`));
  }
  for (const key of expectedKeys) {
    if (!Object.hasOwn(value, key)) errors.push(issue(`${path}.${key}`, 'MISSING_FIELD', `Missing field ${key}.`));
  }
  return true;
}

function validateStableId(value, path, errors, { nullable = false } = {}) {
  if (nullable && value === null) return;
  if (typeof value !== 'string' || !STABLE_ID.test(value)) {
    errors.push(issue(path, 'INVALID_ID', 'Expected a stable lowercase identifier.'));
  }
}

function validateSafeName(value, path, errors, maximum) {
  if (typeof value !== 'string'
      || value.length < 1
      || value.length > maximum
      || value.trim() !== value
      || CONTROL_CHARACTER.test(value)) {
    errors.push(issue(path, 'INVALID_NAME', `Expected a trimmed name from 1 through ${maximum} characters without control characters.`));
  }
}

function validateCounter(value, path, errors, { allowNegative = false } = {}) {
  if (!Number.isSafeInteger(value) || (!allowNegative && value < 0)) {
    errors.push(issue(path, 'INVALID_INTEGER', allowNegative
      ? 'Expected a safe integer.'
      : 'Expected a nonnegative safe integer.'));
  }
}

function validateVersion(value, expected, path, errors) {
  if (value !== expected) {
    errors.push(issue(path, 'UNSUPPORTED_VERSION', `Expected ${expected}; received ${String(value)}.`));
  }
}

function validateUniqueStrings(values, path, errors) {
  if (!Array.isArray(values)) {
    errors.push(issue(path, 'EXPECTED_ARRAY', 'Expected an array.'));
    return;
  }
  const seen = new Set();
  values.forEach((value, index) => {
    validateStableId(value, `${path}[${index}]`, errors);
    if (seen.has(value)) errors.push(issue(`${path}[${index}]`, 'DUPLICATE_ID', `Duplicate identifier ${value}.`));
    seen.add(value);
  });
}

function asSet(value, label) {
  if (value instanceof Set) return new Set(value);
  if (Array.isArray(value)) return new Set(value);
  throw new ClientDataError('MISSING_CONTENT_CONTEXT', `${label} must be an array or Set.`);
}

export function createClientDataContext({ cardCatalog, deckCatalog }) {
  if (!isPlainObject(cardCatalog) || !Array.isArray(cardCatalog.cards)) {
    throw new ClientDataError('MISSING_CONTENT_CONTEXT', 'A loaded card catalog is required.');
  }
  if (!isPlainObject(deckCatalog) || !Array.isArray(deckCatalog.decks)) {
    throw new ClientDataError('MISSING_CONTENT_CONTEXT', 'A loaded deck catalog is required.');
  }
  const supportedCardCatalogVersions = new Set([CARD_CATALOG_VERSION, EXPANDED_CARD_CATALOG_VERSION]);
  if (!supportedCardCatalogVersions.has(cardCatalog.card_catalog_version)
      || cardCatalog.ruleset_version !== RULESET_VERSION) {
    throw new ClientDataError('INCOMPATIBLE_CONTENT', 'The card catalog version is not compatible with solo-pages-v2.');
  }
  if (deckCatalog.card_catalog_version !== cardCatalog.card_catalog_version
      || deckCatalog.ruleset_version !== RULESET_VERSION) {
    throw new ClientDataError('INCOMPATIBLE_CONTENT', 'The deck catalog version is not compatible with solo-pages-v2.');
  }
  const starterSourceDeckId = cardCatalog.card_catalog_version === EXPANDED_CARD_CATALOG_VERSION
    ? EXPANDED_STARTER_SOURCE_DECK_ID : STARTER_SOURCE_DECK_ID;
  const starterDeck = deckCatalog.decks.find((deck) => deck.id === starterSourceDeckId);
  if (!starterDeck) {
    throw new ClientDataError('MISSING_STARTER_DECK', `Missing ${starterSourceDeckId}.`);
  }
  return Object.freeze({
    knownCardIds: new Set(cardCatalog.cards
      .filter((card) => card.play_contract?.contract_type !== 'DIAGNOSTIC')
      .map((card) => card.id)),
    knownSourceDeckIds: new Set(deckCatalog.decks.map((deck) => deck.id)),
    knownIconIds: new Set(PROFILE_ICON_IDS),
    starterDeck: structuredClone(starterDeck),
    starterSourceDeckId,
    cardCatalogVersion: cardCatalog.card_catalog_version,
    rulesetVersion: cardCatalog.ruleset_version,
  });
}

function normalizeContext(context) {
  if (!context || !context.starterDeck) {
    throw new ClientDataError('MISSING_CONTENT_CONTEXT', 'Client data requires the loaded canonical starter deck and ID registries.');
  }
  return {
    knownCardIds: asSet(context.knownCardIds, 'knownCardIds'),
    knownSourceDeckIds: asSet(context.knownSourceDeckIds, 'knownSourceDeckIds'),
    knownIconIds: asSet(context.knownIconIds ?? PROFILE_ICON_IDS, 'knownIconIds'),
    starterDeck: context.starterDeck,
    starterSourceDeckId: context.starterSourceDeckId ?? STARTER_SOURCE_DECK_ID,
    cardCatalogVersion: context.cardCatalogVersion ?? CARD_CATALOG_VERSION,
    rulesetVersion: context.rulesetVersion ?? RULESET_VERSION,
  };
}

export function findForbiddenProperties(value) {
  const found = [];
  const seen = new Set();
  function visit(node, path) {
    if (node === null || typeof node !== 'object') return;
    if (seen.has(node)) {
      found.push(issue(path, 'CYCLIC_VALUE', 'Cyclic values cannot be stored.'));
      return;
    }
    seen.add(node);
    if (!Array.isArray(node) && !isPlainObject(node)) {
      found.push(issue(path, 'UNSAFE_PROTOTYPE', 'Only plain JSON objects are accepted.'));
      return;
    }
    for (const key of Object.keys(node)) {
      if (FORBIDDEN_PROPERTY_NAMES.has(key)) {
        found.push(issue(`${path}.${key}`, 'PROTOTYPE_POLLUTION_KEY', `Forbidden property name ${key}.`));
      }
      visit(node[key], Array.isArray(node) ? `${path}[${key}]` : `${path}.${key}`);
    }
  }
  visit(value, '$');
  return found;
}

export function stableStringify(value, space = 0) {
  const unsafe = findForbiddenProperties(value);
  if (unsafe.length > 0) throw new ClientDataError('UNSAFE_DATA', 'Data cannot be serialized safely.', unsafe);
  const seen = new Set();
  function canonical(node) {
    if (node === null || typeof node === 'string' || typeof node === 'boolean') return node;
    if (typeof node === 'number') {
      if (!Number.isFinite(node)) throw new ClientDataError('UNSERIALIZABLE_DATA', 'Only finite numbers can be serialized.');
      return node;
    }
    if (Array.isArray(node)) return node.map(canonical);
    if (!isPlainObject(node)) throw new ClientDataError('UNSERIALIZABLE_DATA', 'Only plain JSON data can be serialized.');
    if (seen.has(node)) throw new ClientDataError('UNSERIALIZABLE_DATA', 'Cyclic values cannot be serialized.');
    seen.add(node);
    const result = {};
    for (const key of Object.keys(node).sort()) {
      const child = node[key];
      if (child === undefined || typeof child === 'function' || typeof child === 'symbol') {
        throw new ClientDataError('UNSERIALIZABLE_DATA', `Field ${key} cannot be serialized.`);
      }
      result[key] = canonical(child);
    }
    seen.delete(node);
    return result;
  }
  return JSON.stringify(canonical(value), null, space);
}

function cloneJson(value) {
  return JSON.parse(stableStringify(value));
}

export function byteLength(value) {
  return new TextEncoder().encode(value).byteLength;
}

export function createEmptyStatistics() {
  return {
    schema_version: STATISTICS_VERSION,
    processed_match_start_ids: [],
    processed_match_results: [],
    totals: Object.fromEntries(STATISTIC_KEYS.map((key) => [key, 0])),
  };
}

export function createDefaultState(context) {
  const normalized = normalizeContext(context);
  const starter = normalized.starterDeck;
  if (starter.id !== normalized.starterSourceDeckId
      || typeof starter.display_name !== 'string'
      || !Array.isArray(starter.card_definition_ids)) {
    throw new ClientDataError('INVALID_STARTER_DECK', `The canonical ${normalized.starterSourceDeckId} fixture is malformed.`);
  }
  const state = {
    storage_version: LOCAL_STATE_VERSION,
    records: {
      profile: {
        schema_version: PROFILE_VERSION,
        profile_id: 'profile.local',
        display_name: 'Night Technician',
        icon_id: 'cosmetic.profile.systems',
      },
      decks: {
        schema_version: DECKS_VERSION,
        ruleset_version: normalized.rulesetVersion,
        card_catalog_version: normalized.cardCatalogVersion,
        active_deck_id: STARTER_LOCAL_DECK_ID,
        decks: [{
          deck_id: STARTER_LOCAL_DECK_ID,
          display_name: starter.display_name,
          source_deck_id: starter.id,
          card_definition_ids: [...starter.card_definition_ids],
        }],
      },
      settings: {
        schema_version: SETTINGS_VERSION,
        starting_ticket_count: 3,
        motion_preference: 'SYSTEM',
        drag_enabled: false,
        preferred_bench_view: 'RELEVANT',
      },
      statistics: createEmptyStatistics(),
      tutorials: {
        schema_version: TUTORIAL_PROGRESS_VERSION,
        catalog_version: TUTORIAL_CATALOG_VERSION,
        completed_tutorial_ids: [],
      },
    },
  };
  return assertValidLocalState(state, normalized);
}

export function validateProfile(profile, context) {
  const normalized = normalizeContext(context);
  const errors = [];
  if (!validateExactKeys(profile, PROFILE_KEYS, '$.profile', errors)) return errors;
  validateVersion(profile.schema_version, PROFILE_VERSION, '$.profile.schema_version', errors);
  if (profile.profile_id !== 'profile.local') {
    errors.push(issue('$.profile.profile_id', 'INVALID_PROFILE_ID', 'The local profile ID must be profile.local.'));
  }
  validateSafeName(profile.display_name, '$.profile.display_name', errors, PROFILE_NAME_MAX_LENGTH);
  validateStableId(profile.icon_id, '$.profile.icon_id', errors);
  if (typeof profile.icon_id === 'string' && !normalized.knownIconIds.has(profile.icon_id)) {
    errors.push(issue('$.profile.icon_id', 'UNKNOWN_ID', `Unknown profile icon ${profile.icon_id}.`));
  }
  return errors;
}

export function validateDeckDraft(deck, context, { path = '$.deck', requireLegal = false } = {}) {
  const normalized = normalizeContext(context);
  const errors = [];
  if (!validateExactKeys(deck, DECK_KEYS, path, errors)) return errors;
  validateStableId(deck.deck_id, `${path}.deck_id`, errors);
  validateSafeName(deck.display_name, `${path}.display_name`, errors, DECK_NAME_MAX_LENGTH);
  validateStableId(deck.source_deck_id, `${path}.source_deck_id`, errors, { nullable: true });
  if (typeof deck.source_deck_id === 'string' && !normalized.knownSourceDeckIds.has(deck.source_deck_id)) {
    errors.push(issue(`${path}.source_deck_id`, 'UNKNOWN_ID', `Unknown source deck ${deck.source_deck_id}.`));
  }
  if (!Array.isArray(deck.card_definition_ids)) {
    errors.push(issue(`${path}.card_definition_ids`, 'EXPECTED_ARRAY', 'Card definition IDs must be an array.'));
    return errors;
  }
  if (deck.card_definition_ids.length > 30) {
    errors.push(issue(`${path}.card_definition_ids`, 'DECK_TOO_LARGE', 'A deck cannot contain more than 30 cards.'));
  }
  if (requireLegal && deck.card_definition_ids.length !== 30) {
    errors.push(issue(`${path}.card_definition_ids`, 'DECK_SIZE', 'A saved deck must contain exactly 30 cards.'));
  }
  const counts = new Map();
  deck.card_definition_ids.forEach((cardId, index) => {
    validateStableId(cardId, `${path}.card_definition_ids[${index}]`, errors);
    if (typeof cardId === 'string' && !normalized.knownCardIds.has(cardId)) {
      errors.push(issue(`${path}.card_definition_ids[${index}]`, 'UNKNOWN_ID', `Unknown Card Definition ${cardId}.`));
    }
    const count = (counts.get(cardId) ?? 0) + 1;
    counts.set(cardId, count);
    if (count === MAX_COPIES_PER_CARD_ID + 1) {
      errors.push(issue(`${path}.card_definition_ids[${index}]`, 'DECK_COPY_LIMIT', `A response deck cannot contain more than ${MAX_COPIES_PER_CARD_ID} copies of ${cardId}.`));
    }
  });
  return errors;
}

export function validateDeckCollection(collection, context) {
  const normalized = normalizeContext(context);
  const errors = [];
  if (!validateExactKeys(collection, DECK_COLLECTION_KEYS, '$.decks', errors)) return errors;
  validateVersion(collection.schema_version, DECKS_VERSION, '$.decks.schema_version', errors);
  validateVersion(collection.ruleset_version, normalized.rulesetVersion, '$.decks.ruleset_version', errors);
  validateVersion(collection.card_catalog_version, normalized.cardCatalogVersion, '$.decks.card_catalog_version', errors);
  validateStableId(collection.active_deck_id, '$.decks.active_deck_id', errors, { nullable: true });
  if (!Array.isArray(collection.decks)) {
    errors.push(issue('$.decks.decks', 'EXPECTED_ARRAY', 'Decks must be an array.'));
    return errors;
  }
  if (collection.decks.length > MAX_SAVED_DECKS) {
    errors.push(issue('$.decks.decks', 'TOO_MANY_DECKS', `At most ${MAX_SAVED_DECKS} saved decks are supported.`));
  }
  const ids = new Set();
  collection.decks.forEach((deck, index) => {
    errors.push(...validateDeckDraft(deck, normalized, { path: `$.decks.decks[${index}]`, requireLegal: true }));
    if (isPlainObject(deck) && typeof deck.deck_id === 'string') {
      if (ids.has(deck.deck_id)) {
        errors.push(issue(`$.decks.decks[${index}].deck_id`, 'DUPLICATE_ID', `Duplicate deck ID ${deck.deck_id}.`));
      }
      ids.add(deck.deck_id);
    }
  });
  if (collection.active_deck_id !== null && !ids.has(collection.active_deck_id)) {
    errors.push(issue('$.decks.active_deck_id', 'UNKNOWN_ID', 'The active deck ID does not identify a saved legal deck.'));
  }
  return errors;
}

export function validateSettings(settings, context) {
  normalizeContext(context);
  const errors = [];
  if (!validateExactKeys(settings, SETTINGS_KEYS, '$.settings', errors)) return errors;
  validateVersion(settings.schema_version, SETTINGS_VERSION, '$.settings.schema_version', errors);
  if (!Number.isInteger(settings.starting_ticket_count)
      || settings.starting_ticket_count < 1
      || settings.starting_ticket_count > 10) {
    errors.push(issue('$.settings.starting_ticket_count', 'INVALID_TICKET_COUNT', 'Starting Ticket count must be an integer from 1 through 10.'));
  }
  if (!['SYSTEM', 'REDUCED', 'FULL'].includes(settings.motion_preference)) {
    errors.push(issue('$.settings.motion_preference', 'INVALID_MOTION_PREFERENCE', 'Motion preference must be SYSTEM, REDUCED, or FULL.'));
  }
  if (typeof settings.drag_enabled !== 'boolean') {
    errors.push(issue('$.settings.drag_enabled', 'INVALID_BOOLEAN', 'drag_enabled must be boolean.'));
  }
  if (!['RELEVANT', 'GLOBAL'].includes(settings.preferred_bench_view)) {
    errors.push(issue('$.settings.preferred_bench_view', 'INVALID_BENCH_VIEW', 'preferred_bench_view must be RELEVANT or GLOBAL.'));
  }
  return errors;
}

export function validateStatistics(statistics, context) {
  normalizeContext(context);
  const errors = [];
  if (!validateExactKeys(statistics, STATISTICS_KEYS, '$.statistics', errors)) return errors;
  validateVersion(statistics.schema_version, STATISTICS_VERSION, '$.statistics.schema_version', errors);
  validateUniqueStrings(statistics.processed_match_start_ids, '$.statistics.processed_match_start_ids', errors);
  if (!Array.isArray(statistics.processed_match_results)) {
    errors.push(issue('$.statistics.processed_match_results', 'EXPECTED_ARRAY', 'Processed Match results must be an array.'));
  } else {
    const matchIds = new Set();
    const resultIds = new Set();
    statistics.processed_match_results.forEach((entry, index) => {
      const path = `$.statistics.processed_match_results[${index}]`;
      if (!validateExactKeys(entry, PROCESSED_RESULT_KEYS, path, errors)) return;
      validateStableId(entry.match_id, `${path}.match_id`, errors);
      validateStableId(entry.result_id, `${path}.result_id`, errors);
      if (matchIds.has(entry.match_id)) errors.push(issue(`${path}.match_id`, 'DUPLICATE_ID', `Match ${entry.match_id} was already completed.`));
      if (resultIds.has(entry.result_id)) errors.push(issue(`${path}.result_id`, 'DUPLICATE_ID', `Result ${entry.result_id} was already processed.`));
      matchIds.add(entry.match_id);
      resultIds.add(entry.result_id);
    });
  }
  if (!validateExactKeys(statistics.totals, STATISTIC_KEYS, '$.statistics.totals', errors)) return errors;
  for (const key of STATISTIC_KEYS) {
    if (Object.hasOwn(statistics.totals, key)) {
      validateCounter(statistics.totals[key], `$.statistics.totals.${key}`, errors, {
        allowNegative: POINT_STATISTIC_KEYS.has(key),
      });
    }
  }
  const totals = statistics.totals;
  if (isPlainObject(totals)
      && Array.isArray(statistics.processed_match_start_ids)
      && totals.matches_started !== statistics.processed_match_start_ids.length) {
    errors.push(issue('$.statistics.totals.matches_started', 'LEDGER_MISMATCH', 'matches_started must equal the processed Match-start ledger length.'));
  }
  if (isPlainObject(totals) && Array.isArray(statistics.processed_match_results)) {
    if (totals.matches_completed !== statistics.processed_match_results.length) {
      errors.push(issue('$.statistics.totals.matches_completed', 'LEDGER_MISMATCH', 'matches_completed must equal the processed result ledger length.'));
    }
    const outcomes = totals.solo_wins + totals.solo_losses + totals.solo_stalemates + totals.invalid_or_capped_results;
    if (Number.isSafeInteger(outcomes) && outcomes !== totals.matches_completed) {
      errors.push(issue('$.statistics.totals.matches_completed', 'OUTCOME_TOTAL_MISMATCH', 'Completed Match outcomes must sum to matches_completed.'));
    }
  }
  if (isPlainObject(totals)) {
    if (totals.matches_completed > totals.matches_started) {
      errors.push(issue('$.statistics.totals.matches_completed', 'MATCH_TOTAL_MISMATCH', 'Completed Matches cannot exceed started Matches.'));
    }
    if (totals.final_service_points_total - totals.starting_service_points_total
        !== totals.lifetime_service_points_gained) {
      errors.push(issue('$.statistics.totals.lifetime_service_points_gained', 'POINT_TOTAL_MISMATCH', 'Lifetime gained Service Points must equal final minus starting totals.'));
    }
    if (totals.verify_passes + totals.verify_failures + totals.verify_inconclusive_results
        !== totals.verify_attempts) {
      errors.push(issue('$.statistics.totals.verify_attempts', 'VERIFY_TOTAL_MISMATCH', 'Verify attempts must equal pass, failure, and inconclusive totals.'));
    }
    if (totals.failed_verify !== totals.verify_failures) {
      errors.push(issue('$.statistics.totals.failed_verify', 'VERIFY_TOTAL_MISMATCH', 'failed_verify must equal Verify failures.'));
    }
  }
  return errors;
}

export function validateTutorialProgress(progress, context) {
  normalizeContext(context);
  const errors = [];
  const path = '$.tutorials';
  if (!validateExactKeys(progress, ['schema_version', 'catalog_version', 'completed_tutorial_ids'], path, errors)) return errors;
  validateVersion(progress.schema_version, TUTORIAL_PROGRESS_VERSION, `${path}.schema_version`, errors);
  validateVersion(progress.catalog_version, TUTORIAL_CATALOG_VERSION, `${path}.catalog_version`, errors);
  validateUniqueStrings(progress.completed_tutorial_ids, `${path}.completed_tutorial_ids`, errors);
  const known = new Set(['tutorial.fundamentals', 'tutorial.verify_recovery']);
  for (const [index, id] of (progress.completed_tutorial_ids ?? []).entries()) {
    if (!known.has(id)) errors.push(issue(`${path}.completed_tutorial_ids[${index}]`, 'UNKNOWN_ID', `Unknown tutorial ${id}.`));
  }
  return errors;
}

function validateRecords(records, context, path = '$.records') {
  const errors = [];
  if (!validateExactKeys(records, LOCAL_RECORD_KEYS, path, errors)) return errors;
  errors.push(...validateProfile(records.profile, context));
  errors.push(...validateDeckCollection(records.decks, context));
  errors.push(...validateSettings(records.settings, context));
  errors.push(...validateStatistics(records.statistics, context));
  errors.push(...validateTutorialProgress(records.tutorials, context));
  return errors;
}

export function validateLocalState(state, context) {
  const normalized = normalizeContext(context);
  const errors = findForbiddenProperties(state);
  if (!validateExactKeys(state, LOCAL_STATE_KEYS, '$', errors)) return errors;
  validateVersion(state.storage_version, LOCAL_STATE_VERSION, '$.storage_version', errors);
  errors.push(...validateRecords(state.records, normalized));
  try {
    const serialized = stableStringify(state);
    if (byteLength(serialized) > MAX_IMPORT_BYTES) {
      errors.push(issue('$', 'OVERSIZED_DATA', `Local data exceeds ${MAX_IMPORT_BYTES} bytes.`));
    }
  } catch (error) {
    if (error instanceof ClientDataError) errors.push(...error.details);
    else throw error;
  }
  return errors;
}

export function assertValidLocalState(state, context) {
  const errors = validateLocalState(state, context);
  if (errors.length > 0) throw new ClientDataError('INVALID_LOCAL_DATA', 'Local data failed validation.', errors);
  return cloneJson(state);
}

export function migrateLocalState(candidate, context) {
  if (!isPlainObject(candidate)) {
    throw new ClientDataError('INVALID_LOCAL_DATA', 'Local data must be an object.');
  }
  if (candidate.storage_version !== LOCAL_STATE_VERSION) {
    if (SUPPORTED_PRIOR_STORAGE_VERSIONS.includes(candidate.storage_version)) {
      throw new ClientDataError(
        'LEGACY_PROFILE_COEXISTS',
        'This solo-pages-v1 save remains pinned under its original storage key. Start a fresh solo-pages-v2 profile; no implicit deck or statistic migration is performed.',
      );
    }
    throw new ClientDataError(
      'UNSUPPORTED_VERSION',
      `Unsupported local data version ${String(candidate.storage_version)}.`,
    );
  }
  const normalized = normalizeContext(context);
  let working = cloneJson(candidate);
  if (isPlainObject(working.records) && !Object.hasOwn(working.records, 'tutorials')) {
    working.records.tutorials = createDefaultState(normalized).records.tutorials;
  }
  if (normalized.cardCatalogVersion === EXPANDED_CARD_CATALOG_VERSION
      && working.records?.decks?.card_catalog_version === CARD_CATALOG_VERSION) {
    const migrated = working;
    migrated.records.decks = createDefaultState(normalized).records.decks;
    return assertValidLocalState(migrated, normalized);
  }
  if (normalized.cardCatalogVersion === EXPANDED_CARD_CATALOG_VERSION
      && working.records?.decks?.card_catalog_version === PRIOR_EXPANDED_CARD_CATALOG_VERSION) {
    const migrated = working;
    migrated.records.decks.card_catalog_version = EXPANDED_CARD_CATALOG_VERSION;
    return assertValidLocalState(migrated, normalized);
  }
  return assertValidLocalState(working, normalized);
}

export function recordTutorialCompletion(progress, tutorialId, context) {
  const errors = validateTutorialProgress(progress, context);
  if (errors.length) throw new ClientDataError('INVALID_LOCAL_DATA', 'Tutorial progress failed validation.', errors);
  const next = cloneJson(progress);
  if (!['tutorial.fundamentals', 'tutorial.verify_recovery'].includes(tutorialId)) {
    throw new ClientDataError('UNKNOWN_TUTORIAL', `Unknown tutorial ${String(tutorialId)}.`);
  }
  if (!next.completed_tutorial_ids.includes(tutorialId)) next.completed_tutorial_ids.push(tutorialId);
  next.completed_tutorial_ids.sort();
  return next;
}

export function deriveLevel(lifetimeServicePointsGained) {
  if (!Number.isFinite(lifetimeServicePointsGained)) return 0;
  return Math.max(0, Math.floor(lifetimeServicePointsGained / 10));
}

function safeAdd(left, right, path) {
  const result = left + right;
  if (!Number.isSafeInteger(result)) {
    throw new ClientDataError('STATISTIC_OVERFLOW', `Statistic ${path} exceeds the safe integer range.`);
  }
  return result;
}

export function validateResultSummary(summary) {
  const errors = findForbiddenProperties(summary);
  if (!validateExactKeys(summary, RESULT_SUMMARY_KEYS, '$.result', errors)) return errors;
  validateVersion(summary.summary_version, RESULT_SUMMARY_VERSION, '$.result.summary_version', errors);
  validateStableId(summary.result_id, '$.result.result_id', errors);
  validateStableId(summary.match_id, '$.result.match_id', errors);
  if (!Array.isArray(summary.reason_codes) || summary.reason_codes.length < 1) {
    errors.push(issue('$.result.reason_codes', 'INVALID_REASON_CODES', 'At least one terminal reason code is required.'));
  } else {
    const reasons = new Set();
    summary.reason_codes.forEach((reason, index) => {
      if (!RESULT_REASON_CODES.has(reason)) {
        errors.push(issue(`$.result.reason_codes[${index}]`, 'INVALID_REASON_CODE', `Unknown terminal reason ${String(reason)}.`));
      }
      if (reasons.has(reason)) {
        errors.push(issue(`$.result.reason_codes[${index}]`, 'DUPLICATE_REASON_CODE', `Duplicate terminal reason ${reason}.`));
      }
      reasons.add(reason);
    });
  }
  if (typeof summary.valid !== 'boolean') errors.push(issue('$.result.valid', 'INVALID_BOOLEAN', 'valid must be boolean.'));
  if (summary.matches_completed !== 1) {
    errors.push(issue('$.result.matches_completed', 'INVALID_MATCH_COUNT', 'A result summary must complete exactly one Match.'));
  }
  validateCounter(summary.starting_service_points, '$.result.starting_service_points', errors, { allowNegative: true });
  validateCounter(summary.final_service_points, '$.result.final_service_points', errors, { allowNegative: true });
  validateCounter(summary.service_points_gained, '$.result.service_points_gained', errors);
  for (const key of [...RESULT_OUTCOME_KEYS, ...Object.keys(WORKER_RESULT_COUNTER_MAP)]) {
    validateCounter(summary[key], `$.result.${key}`, errors);
  }
  const outcomeTotal = RESULT_OUTCOME_KEYS.reduce((sum, key) => sum + summary[key], 0);
  if (Number.isSafeInteger(outcomeTotal) && outcomeTotal !== 1) {
    errors.push(issue('$.result', 'OUTCOME_TOTAL_MISMATCH', 'Exactly one solo outcome counter must equal one.'));
  }
  if (Number.isSafeInteger(summary.starting_service_points)
      && Number.isSafeInteger(summary.final_service_points)
      && Number.isSafeInteger(summary.service_points_gained)
      && summary.final_service_points - summary.starting_service_points !== summary.service_points_gained) {
    errors.push(issue('$.result.service_points_gained', 'POINT_TOTAL_MISMATCH', 'Result gained Service Points must equal final minus starting points.'));
  }
  if (Number.isSafeInteger(summary.service_points_gained) && summary.service_points_gained < 0) {
    errors.push(issue('$.result.service_points_gained', 'NEGATIVE_GAIN', 'A first-version result cannot lose Service Points.'));
  }
  if (Number.isSafeInteger(summary.verify_attempts)
      && Number.isSafeInteger(summary.verify_passes)
      && Number.isSafeInteger(summary.verify_failures)
      && Number.isSafeInteger(summary.verify_inconclusive)
      && summary.verify_passes + summary.verify_failures + summary.verify_inconclusive
        !== summary.verify_attempts) {
    errors.push(issue('$.result.verify_attempts', 'VERIFY_TOTAL_MISMATCH', 'Verify attempts must equal pass, failure, and inconclusive results.'));
  }
  if (Number.isSafeInteger(summary.failed_verifies)
      && Number.isSafeInteger(summary.verify_failures)
      && summary.failed_verifies !== summary.verify_failures) {
    errors.push(issue('$.result.failed_verifies', 'VERIFY_TOTAL_MISMATCH', 'failed_verifies must equal Verify failures.'));
  }
  return errors;
}

export function assertValidResultSummary(summary) {
  const errors = validateResultSummary(summary);
  if (errors.length > 0) throw new ClientDataError('INVALID_RESULT_SUMMARY', 'The Worker-issued safe result summary failed validation.', errors);
  return cloneJson(summary);
}

export function recordMatchStart(statistics, matchId, context) {
  const currentErrors = validateStatistics(statistics, context);
  if (currentErrors.length > 0) throw new ClientDataError('INVALID_LOCAL_DATA', 'Statistics failed validation.', currentErrors);
  const idErrors = [];
  validateStableId(matchId, '$.match_id', idErrors);
  if (idErrors.length > 0) throw new ClientDataError('INVALID_MATCH_ID', 'Match ID failed validation.', idErrors);
  if (statistics.processed_match_start_ids.includes(matchId)) {
    return { value: cloneJson(statistics), applied: false };
  }
  const next = cloneJson(statistics);
  next.processed_match_start_ids.push(matchId);
  next.totals.matches_started = safeAdd(next.totals.matches_started, 1, 'matches_started');
  const nextErrors = validateStatistics(next, context);
  if (nextErrors.length > 0) throw new ClientDataError('INVALID_LOCAL_DATA', 'Updated statistics failed validation.', nextErrors);
  return { value: next, applied: true };
}

export function applyMatchResult(statistics, resultSummary, context) {
  const currentErrors = validateStatistics(statistics, context);
  if (currentErrors.length > 0) throw new ClientDataError('INVALID_LOCAL_DATA', 'Statistics failed validation.', currentErrors);
  const summary = assertValidResultSummary(resultSummary);
  const existingByMatch = statistics.processed_match_results.find((entry) => entry.match_id === summary.match_id);
  const existingByResult = statistics.processed_match_results.find((entry) => entry.result_id === summary.result_id);
  if (existingByMatch || existingByResult) {
    if (existingByMatch?.result_id === summary.result_id && existingByResult?.match_id === summary.match_id) {
      return { value: cloneJson(statistics), applied: false };
    }
    throw new ClientDataError('RESULT_ID_CONFLICT', 'A Match or result ID is already paired with a different completion.');
  }

  let next = cloneJson(statistics);
  if (!next.processed_match_start_ids.includes(summary.match_id)) {
    next = recordMatchStart(next, summary.match_id, context).value;
  }
  next.processed_match_results.push({ match_id: summary.match_id, result_id: summary.result_id });
  const totals = next.totals;
  totals.matches_completed = safeAdd(totals.matches_completed, summary.matches_completed, 'matches_completed');
  for (const key of RESULT_OUTCOME_KEYS) {
    totals[key] = safeAdd(totals[key], summary[key], key);
  }
  totals.starting_service_points_total = safeAdd(
    totals.starting_service_points_total,
    summary.starting_service_points,
    'starting_service_points_total',
  );
  totals.final_service_points_total = safeAdd(
    totals.final_service_points_total,
    summary.final_service_points,
    'final_service_points_total',
  );
  totals.lifetime_service_points_gained = safeAdd(
    totals.lifetime_service_points_gained,
    summary.service_points_gained,
    'lifetime_service_points_gained',
  );
  for (const [workerKey, statisticKey] of Object.entries(WORKER_RESULT_COUNTER_MAP)) {
    totals[statisticKey] = safeAdd(totals[statisticKey], summary[workerKey], statisticKey);
  }
  const nextErrors = validateStatistics(next, context);
  if (nextErrors.length > 0) throw new ClientDataError('INVALID_LOCAL_DATA', 'Updated statistics failed validation.', nextErrors);
  return { value: next, applied: true };
}

function nextLocalDeckId(collection, idFactory) {
  const existing = new Set(collection.decks.map((deck) => deck.deck_id));
  for (let attempt = 0; attempt < 32; attempt += 1) {
    const generated = String(idFactory()).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const candidate = `deck.local.${generated || `draft-${attempt + 1}`}`;
    if (STABLE_ID.test(candidate) && !existing.has(candidate)) return candidate;
  }
  throw new ClientDataError('DECK_ID_EXHAUSTED', 'Could not create a unique local deck ID.');
}

export function createDeckDraft(collection, context, {
  idFactory = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  displayName = 'Untitled Deck',
} = {}) {
  const errors = validateDeckCollection(collection, context);
  if (errors.length > 0) throw new ClientDataError('INVALID_LOCAL_DATA', 'Deck collection failed validation.', errors);
  if (collection.decks.length >= MAX_SAVED_DECKS) {
    throw new ClientDataError('TOO_MANY_DECKS', `At most ${MAX_SAVED_DECKS} saved decks are supported.`);
  }
  const draft = {
    deck_id: nextLocalDeckId(collection, idFactory),
    display_name: displayName,
    source_deck_id: null,
    card_definition_ids: [],
  };
  const draftErrors = validateDeckDraft(draft, context);
  if (draftErrors.length > 0) throw new ClientDataError('INVALID_DECK_DRAFT', 'New deck draft failed validation.', draftErrors);
  return draft;
}

export function saveDeck(collection, draft, context) {
  const currentErrors = validateDeckCollection(collection, context);
  if (currentErrors.length > 0) throw new ClientDataError('INVALID_LOCAL_DATA', 'Deck collection failed validation.', currentErrors);
  const draftErrors = validateDeckDraft(draft, context, { requireLegal: true });
  if (draftErrors.length > 0) throw new ClientDataError('INVALID_DECK', 'Only a legal 30-card deck can be saved.', draftErrors);
  const next = cloneJson(collection);
  const existingIndex = next.decks.findIndex((deck) => deck.deck_id === draft.deck_id);
  if (existingIndex === -1) {
    if (next.decks.length >= MAX_SAVED_DECKS) throw new ClientDataError('TOO_MANY_DECKS', 'The deck collection is full.');
    next.decks.push(cloneJson(draft));
  } else {
    next.decks[existingIndex] = cloneJson(draft);
  }
  const nextErrors = validateDeckCollection(next, context);
  if (nextErrors.length > 0) throw new ClientDataError('INVALID_LOCAL_DATA', 'Updated deck collection failed validation.', nextErrors);
  return next;
}

export function setActiveDeck(collection, deckId, context) {
  const errors = validateDeckCollection(collection, context);
  if (errors.length > 0) throw new ClientDataError('INVALID_LOCAL_DATA', 'Deck collection failed validation.', errors);
  if (!collection.decks.some((deck) => deck.deck_id === deckId)) {
    throw new ClientDataError('UNKNOWN_DECK', `Cannot activate unknown deck ${deckId}.`);
  }
  const next = cloneJson(collection);
  next.active_deck_id = deckId;
  return next;
}

export function deleteDeck(collection, deckId, context) {
  const errors = validateDeckCollection(collection, context);
  if (errors.length > 0) throw new ClientDataError('INVALID_LOCAL_DATA', 'Deck collection failed validation.', errors);
  if (!collection.decks.some((deck) => deck.deck_id === deckId)) {
    throw new ClientDataError('UNKNOWN_DECK', `Cannot delete unknown deck ${deckId}.`);
  }
  const next = cloneJson(collection);
  next.decks = next.decks.filter((deck) => deck.deck_id !== deckId);
  if (next.active_deck_id === deckId) {
    next.active_deck_id = [...next.decks]
      .sort((left, right) => left.deck_id.localeCompare(right.deck_id))[0]?.deck_id ?? null;
  }
  return next;
}

export function createExportBundle(state, context, exportedAt = new Date().toISOString()) {
  const valid = assertValidLocalState(state, context);
  if (!isValidTimestamp(exportedAt)) {
    throw new ClientDataError('INVALID_TIMESTAMP', 'Export time must be an RFC 3339 timestamp.');
  }
  return {
    schema_version: EXPORT_VERSION,
    implementation_profile_id: IMPLEMENTATION_PROFILE_ID,
    exported_at: exportedAt,
    records: cloneJson(valid.records),
  };
}

function isValidTimestamp(value) {
  return typeof value === 'string'
    && RFC3339_TIMESTAMP.test(value)
    && Number.isFinite(Date.parse(value));
}

export function validateExportBundle(bundle, context) {
  const normalized = normalizeContext(context);
  const errors = findForbiddenProperties(bundle);
  if (!validateExactKeys(bundle, EXPORT_KEYS, '$', errors)) return errors;
  validateVersion(bundle.schema_version, EXPORT_VERSION, '$.schema_version', errors);
  validateVersion(bundle.implementation_profile_id, IMPLEMENTATION_PROFILE_ID, '$.implementation_profile_id', errors);
  if (!isValidTimestamp(bundle.exported_at)) {
    errors.push(issue('$.exported_at', 'INVALID_TIMESTAMP', 'Export time must be an RFC 3339 timestamp.'));
  }
  errors.push(...validateRecords(bundle.records, normalized));
  return errors;
}

export function parseImportBundle(jsonText, context) {
  if (typeof jsonText !== 'string') throw new ClientDataError('INVALID_IMPORT', 'Import input must be JSON text.');
  if (byteLength(jsonText) > MAX_IMPORT_BYTES) {
    throw new ClientDataError('OVERSIZED_IMPORT', `Import exceeds the ${MAX_IMPORT_BYTES}-byte limit.`);
  }
  let bundle;
  try {
    bundle = JSON.parse(jsonText);
  } catch {
    throw new ClientDataError('CORRUPT_IMPORT', 'Import is not valid JSON.');
  }
  const errors = validateExportBundle(bundle, context);
  if (errors.length > 0) {
    const code = errors.some((entry) => entry.code === 'UNSUPPORTED_VERSION')
      ? 'UNSUPPORTED_VERSION'
      : errors.some((entry) => entry.code === 'PROTOTYPE_POLLUTION_KEY' || entry.code === 'UNSAFE_PROTOTYPE')
        ? 'UNSAFE_IMPORT'
        : 'INVALID_IMPORT';
    throw new ClientDataError(code, 'Import failed validation.', errors);
  }
  return cloneJson(bundle);
}

export function createImportPreview(bundle, context) {
  const errors = validateExportBundle(bundle, context);
  if (errors.length > 0) throw new ClientDataError('INVALID_IMPORT', 'Import failed validation.', errors);
  const active = bundle.records.decks.decks.find(
    (deck) => deck.deck_id === bundle.records.decks.active_deck_id,
  ) ?? null;
  const totals = bundle.records.statistics.totals;
  return {
    replacement_allowed: true,
    profile: {
      display_name: bundle.records.profile.display_name,
      icon_id: bundle.records.profile.icon_id,
    },
    deck_count: bundle.records.decks.decks.length,
    active_deck: active === null ? null : {
      deck_id: active.deck_id,
      display_name: active.display_name,
    },
    statistics: {
      matches_started: totals.matches_started,
      matches_completed: totals.matches_completed,
      lifetime_service_points_gained: totals.lifetime_service_points_gained,
      level: deriveLevel(totals.lifetime_service_points_gained),
    },
    versions: {
      export: bundle.schema_version,
      profile: bundle.records.profile.schema_version,
      decks: bundle.records.decks.schema_version,
      settings: bundle.records.settings.schema_version,
      statistics: bundle.records.statistics.schema_version,
      ruleset: bundle.records.decks.ruleset_version,
      card_catalog: bundle.records.decks.card_catalog_version,
    },
    warnings: [
      'Import replaces all current local profile, deck, settings, and statistics records.',
      'Imported statistics are local and user-controlled; they are not competitive records.',
      'Download the current local backup before confirming replacement.',
    ],
  };
}

export function localStateFromExport(bundle, context) {
  const errors = validateExportBundle(bundle, context);
  if (errors.length > 0) throw new ClientDataError('INVALID_IMPORT', 'Import failed validation.', errors);
  return assertValidLocalState({
    storage_version: LOCAL_STATE_VERSION,
    records: cloneJson(bundle.records),
  }, context);
}
