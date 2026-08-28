import {
  MAX_MATCH_HISTORY,
  STABLE_ID,
  STORY_MATCH_RESULT_VERSION,
  StoryError,
} from './constants.mjs';

const RESULT_KEYS = Object.freeze([
  'schema_version', 'result_id', 'match_id', 'match_ref', 'completion', 'valid', 'reason_codes',
  'story_service_points_gained', 'tickets_closed', 'tickets_given_up', 'documented_outcome',
  'verified_outcome', 'contributions',
]);
const CONTRIBUTION_KEYS = Object.freeze([
  'tests_run', 'isolations_accepted', 'repairs_performed', 'verify_passes', 'documentation_actions',
]);
const clone = (value) => JSON.parse(JSON.stringify(value));
const natural = (value) => Number.isSafeInteger(value) && value >= 0;

function requireNatural(value, field) {
  if (!natural(value)) throw new StoryError('INVALID_MATCH_RESULT', `${field} must be a non-negative safe integer.`);
  return value;
}

function validateNormalized(result, expectedMatchRef) {
  if (!result || typeof result !== 'object' || Array.isArray(result)
      || Object.keys(result).some((key) => !RESULT_KEYS.includes(key))
      || RESULT_KEYS.some((key) => !Object.hasOwn(result, key))) {
    throw new StoryError('INVALID_MATCH_RESULT', 'Normalized Story Match result has an invalid shape.');
  }
  if (result.schema_version !== STORY_MATCH_RESULT_VERSION) throw new StoryError('MATCH_RESULT_VERSION', 'Unsupported Story Match result version.');
  for (const field of ['result_id', 'match_id', 'match_ref']) {
    if (typeof result[field] !== 'string' || !STABLE_ID.test(result[field])) throw new StoryError('INVALID_MATCH_RESULT', `${field} must be a stable ID.`);
  }
  if (expectedMatchRef && result.match_ref !== expectedMatchRef) throw new StoryError('MATCH_RESULT_REF', 'Match result does not match the pending Story Match.');
  if (!['COMPLETED', 'ABANDONED', 'INVALID'].includes(result.completion)) throw new StoryError('INVALID_MATCH_RESULT', 'Unknown Match completion value.');
  if (typeof result.valid !== 'boolean') throw new StoryError('INVALID_MATCH_RESULT', 'valid must be boolean.');
  if (result.completion === 'INVALID' && result.valid) throw new StoryError('INVALID_MATCH_RESULT', 'An INVALID completion cannot be valid.');
  if (!Array.isArray(result.reason_codes) || result.reason_codes.length < 1
      || result.reason_codes.some((code) => typeof code !== 'string' || !/^[A-Z0-9_]+$/.test(code))
      || new Set(result.reason_codes).size !== result.reason_codes.length) {
    throw new StoryError('INVALID_MATCH_RESULT', 'reason_codes must be unique stable reason codes.');
  }
  for (const field of ['story_service_points_gained', 'tickets_closed', 'tickets_given_up']) requireNatural(result[field], field);
  for (const field of ['documented_outcome', 'verified_outcome']) {
    if (typeof result[field] !== 'boolean') throw new StoryError('INVALID_MATCH_RESULT', `${field} must be boolean.`);
  }
  if (!result.contributions || typeof result.contributions !== 'object' || Array.isArray(result.contributions)
      || Object.keys(result.contributions).some((key) => !CONTRIBUTION_KEYS.includes(key))
      || CONTRIBUTION_KEYS.some((key) => !Object.hasOwn(result.contributions, key))) {
    throw new StoryError('INVALID_MATCH_RESULT', 'Match contributions have an invalid shape.');
  }
  for (const field of CONTRIBUTION_KEYS) requireNatural(result.contributions[field], `contributions.${field}`);
  return clone(result);
}

export function normalizeStoryMatchResult(candidate, { expectedMatchRef } = {}) {
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
    throw new StoryError('INVALID_MATCH_RESULT', 'Match result must be an object.');
  }
  if (candidate.schema_version === STORY_MATCH_RESULT_VERSION) return validateNormalized(candidate, expectedMatchRef);
  const matchRef = expectedMatchRef ?? candidate.match_ref;
  if (typeof matchRef !== 'string' || !STABLE_ID.test(matchRef)) {
    throw new StoryError('MATCH_RESULT_REF', 'A stable expectedMatchRef is required for an engine summary.');
  }
  for (const field of ['result_id', 'match_id']) {
    if (typeof candidate[field] !== 'string' || !STABLE_ID.test(candidate[field])) throw new StoryError('INVALID_MATCH_RESULT', `${field} must be a stable ID.`);
  }
  if (typeof candidate.valid !== 'boolean' || !Array.isArray(candidate.reason_codes) || candidate.reason_codes.length < 1) {
    throw new StoryError('INVALID_MATCH_RESULT', 'Engine summary is missing its terminal validity or reason codes.');
  }
  const abandoned = candidate.reason_codes.includes('GIVE_UP') || candidate.reason_codes.includes('ABANDONED');
  const normalized = {
    schema_version: STORY_MATCH_RESULT_VERSION,
    result_id: candidate.result_id,
    match_id: candidate.match_id,
    match_ref: matchRef,
    completion: candidate.valid ? (abandoned ? 'ABANDONED' : 'COMPLETED') : 'INVALID',
    valid: candidate.valid,
    reason_codes: [...candidate.reason_codes],
    story_service_points_gained: requireNatural(candidate.service_points_gained ?? candidate.story_service_points_gained, 'service_points_gained'),
    tickets_closed: requireNatural(candidate.tickets_closed, 'tickets_closed'),
    tickets_given_up: requireNatural(candidate.tickets_given_up, 'tickets_given_up'),
    documented_outcome: requireNatural(candidate.documentation_actions, 'documentation_actions') > 0,
    verified_outcome: requireNatural(candidate.verify_passes, 'verify_passes') > 0,
    contributions: {
      tests_run: requireNatural(candidate.tests_run, 'tests_run'),
      isolations_accepted: requireNatural(candidate.isolations_accepted, 'isolations_accepted'),
      repairs_performed: requireNatural(candidate.repairs_performed, 'repairs_performed'),
      verify_passes: candidate.verify_passes,
      documentation_actions: candidate.documentation_actions,
    },
  };
  return validateNormalized(normalized, expectedMatchRef);
}

export function acceptStoryMatchResult(state, candidate) {
  if (!state || state.status !== 'AWAITING_MATCH' || !state.pending_match) {
    throw new StoryError('NO_PENDING_MATCH', 'Story is not awaiting a Match result.');
  }
  const result = normalizeStoryMatchResult(candidate, { expectedMatchRef: state.pending_match.match_ref });
  if (state.match_results.some((existing) => existing.result_id === result.result_id || existing.match_id === result.match_id)) {
    throw new StoryError('DUPLICATE_MATCH_RESULT', 'This Match result was already accepted.');
  }
  if (state.match_results.length >= MAX_MATCH_HISTORY) {
    throw new StoryError('MATCH_HISTORY_LIMIT', `Story Match history cannot exceed ${MAX_MATCH_HISTORY} accepted results.`);
  }
  const points = state.story_service_points + result.story_service_points_gained;
  if (!Number.isSafeInteger(points)) throw new StoryError('STORY_POINTS_OVERFLOW', 'Story Service Points exceed the safe integer range.');
  const next = clone(state);
  next.story_service_points = points;
  next.match_results = [...next.match_results, result];
  next.returned_match = {
    schema_version: state.pending_match.schema_version,
    match_ref: result.match_ref,
    result_id: result.result_id,
    match_id: result.match_id,
  };
  next.pending_match = null;
  next.status = 'ACTIVE';
  return next;
}
