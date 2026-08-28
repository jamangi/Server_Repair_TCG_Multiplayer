import { sha256Hex } from '../shared/sha256.mjs';
import {
  MAX_BRANCH_HISTORY,
  MAX_MATCH_HISTORY,
  STORY_CHECKPOINT_VERSION,
  STORY_MATCH_CONTEXT_VERSION,
  STORY_STATE_VERSION,
  StoryError,
  createEmptyStoryDisplay,
} from './constants.mjs';
import { normalizeStoryMatchResult } from './match-boundary.mjs';
import { compileStoryPack } from './validator.mjs';

const clone = (value) => value === undefined ? undefined : JSON.parse(JSON.stringify(value));

export function canonicalStoryJson(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalStoryJson).join(',')}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalStoryJson(value[key])}`).join(',')}}`;
}

export function storyDigest(value) {
  return sha256Hex(canonicalStoryJson(value));
}

function checkpointBody(state, checkpointId, compiled) {
  return {
    schema_version: STORY_CHECKPOINT_VERSION,
    pack_id: compiled.manifest.pack_id,
    content_version: compiled.manifest.content_version,
    checkpoint_id: checkpointId,
    variables: clone(state.variables),
    choices: clone(state.choices),
    story_service_points: state.story_service_points,
    branch_history: clone(state.branch_history),
    match_results: clone(state.match_results),
    pending_match: clone(state.pending_match),
    returned_match: clone(state.returned_match),
  };
}

export function createDurableCheckpoint(state, checkpointId, bundle) {
  const compiled = compileStoryPack(bundle);
  if (!compiled.checkpoints.has(checkpointId)) {
    throw new StoryError('UNKNOWN_CHECKPOINT', `Unknown Story checkpoint: ${checkpointId}.`);
  }
  if (!state || state.schema_version !== STORY_STATE_VERSION
      || state.pack_id !== compiled.manifest.pack_id
      || state.content_version !== compiled.manifest.content_version) {
    throw new StoryError('CHECKPOINT_STATE_MISMATCH', 'Story state does not belong to this content version.');
  }
  const body = checkpointBody(state, checkpointId, compiled);
  return { ...body, digest: storyDigest(body) };
}

function validateCheckpointShape(checkpoint) {
  const expected = [
    'schema_version', 'pack_id', 'content_version', 'checkpoint_id', 'variables', 'choices',
    'story_service_points', 'branch_history', 'match_results', 'pending_match', 'returned_match', 'digest',
  ];
  if (!checkpoint || typeof checkpoint !== 'object' || Array.isArray(checkpoint)
      || Object.keys(checkpoint).some((key) => !expected.includes(key))
      || expected.some((key) => !Object.hasOwn(checkpoint, key))) {
    throw new StoryError('INVALID_CHECKPOINT', 'Story checkpoint has an invalid shape.');
  }
}

function matchesAuthoredPendingBoundary(pending, compiled) {
  for (const script of compiled.scripts.values()) {
    for (const statement of script.statements) {
      if (statement.type === 'start_match'
          && statement.match_ref === pending.match_ref
          && statement.return_label === pending.return_label
          && statement.pre_match_checkpoint_id === pending.pre_match_checkpoint_id
          && statement.post_match_checkpoint_id === pending.post_match_checkpoint_id) return true;
    }
  }
  return false;
}

export function restoreStoryCheckpoint(checkpoint, bundle) {
  validateCheckpointShape(checkpoint);
  const compiled = compileStoryPack(bundle);
  if (checkpoint.schema_version !== STORY_CHECKPOINT_VERSION) throw new StoryError('CHECKPOINT_VERSION', 'Unsupported Story checkpoint version.');
  if (checkpoint.pack_id !== compiled.manifest.pack_id || checkpoint.content_version !== compiled.manifest.content_version) {
    throw new StoryError('CHECKPOINT_CONTENT_MISMATCH', 'Story checkpoint belongs to different content.');
  }
  const location = compiled.checkpoints.get(checkpoint.checkpoint_id);
  if (!location) throw new StoryError('UNKNOWN_CHECKPOINT', `Unknown Story checkpoint: ${checkpoint.checkpoint_id}.`);
  const { digest, ...body } = checkpoint;
  if (digest !== storyDigest(body)) throw new StoryError('CHECKPOINT_DIGEST', 'Story checkpoint digest does not match its data.');

  const expectedVariables = new Map(compiled.registry.variables.map((item) => [item.variable_id, item]));
  if (!checkpoint.variables || typeof checkpoint.variables !== 'object' || Array.isArray(checkpoint.variables)
      || Object.keys(checkpoint.variables).length !== expectedVariables.size) {
    throw new StoryError('CHECKPOINT_VARIABLES', 'Story checkpoint variables do not match the registry.');
  }
  for (const [id, descriptor] of expectedVariables) {
    const value = checkpoint.variables[id];
    const valid = descriptor.value_type === 'BOOLEAN' ? typeof value === 'boolean'
      : descriptor.value_type === 'STRING' ? typeof value === 'string'
        : Number.isSafeInteger(value);
    if (!valid) throw new StoryError('CHECKPOINT_VARIABLES', `Invalid checkpoint variable: ${id}.`);
  }
  if (!Number.isSafeInteger(checkpoint.story_service_points) || checkpoint.story_service_points < 0) {
    throw new StoryError('CHECKPOINT_POINTS', 'Story Service Points must be a non-negative safe integer.');
  }
  if (!Array.isArray(checkpoint.branch_history) || !Array.isArray(checkpoint.match_results)) {
    throw new StoryError('INVALID_CHECKPOINT', 'Checkpoint histories must be arrays.');
  }
  if (!checkpoint.choices || typeof checkpoint.choices !== 'object' || Array.isArray(checkpoint.choices)) {
    throw new StoryError('CHECKPOINT_CHOICES', 'Checkpoint choices must be an object.');
  }
  if (checkpoint.branch_history.length > MAX_BRANCH_HISTORY || checkpoint.match_results.length > MAX_MATCH_HISTORY) {
    throw new StoryError('INVALID_CHECKPOINT', 'Checkpoint history exceeds its bounded size.');
  }
  for (const entry of checkpoint.branch_history) {
    const keys = ['sequence', 'choice_id', 'option_id'];
    const choice = compiled.choices.get(entry?.choice_id);
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)
        || Object.keys(entry).some((key) => !keys.includes(key)) || keys.some((key) => !Object.hasOwn(entry, key))
        || !Number.isSafeInteger(entry.sequence) || entry.sequence < 1 || !choice
        || !choice.options.some((option) => option.option_id === entry.option_id)) {
      throw new StoryError('CHECKPOINT_BRANCH_HISTORY', 'Checkpoint contains an invalid branch-history entry.');
    }
  }
  for (const result of checkpoint.match_results) {
    const normalized = normalizeStoryMatchResult(result);
    if (!compiled.matches.has(normalized.match_ref)) {
      throw new StoryError('CHECKPOINT_MATCH_RESULTS', `Checkpoint result references an unregistered Story Match: ${normalized.match_ref}.`);
    }
  }
  const earnedPoints = checkpoint.match_results.reduce((total, result) => {
    const next = total + result.story_service_points_gained;
    if (!Number.isSafeInteger(next)) throw new StoryError('CHECKPOINT_POINTS', 'Story Match point history exceeds the safe integer range.');
    return next;
  }, 0);
  if (earnedPoints !== checkpoint.story_service_points) {
    throw new StoryError('CHECKPOINT_POINTS', 'Story Service Points must equal the normalized Match-result history.');
  }
  const resultIds = new Set(checkpoint.match_results.map((result) => result.result_id));
  const matchIds = new Set(checkpoint.match_results.map((result) => result.match_id));
  if (resultIds.size !== checkpoint.match_results.length || matchIds.size !== checkpoint.match_results.length) {
    throw new StoryError('CHECKPOINT_MATCH_RESULTS', 'Checkpoint contains duplicate Match results.');
  }
  for (const [choiceId, optionId] of Object.entries(checkpoint.choices)) {
    const choice = compiled.choices.get(choiceId);
    if (!choice || !choice.options.some((option) => option.option_id === optionId)) {
      throw new StoryError('CHECKPOINT_CHOICES', `Invalid remembered choice: ${choiceId}.`);
    }
  }
  if (checkpoint.pending_match !== null) {
    const pendingKeys = ['schema_version', 'match_ref', 'return_label', 'pre_match_checkpoint_id', 'post_match_checkpoint_id'];
    const pending = checkpoint.pending_match;
    if (!pending || typeof pending !== 'object' || Array.isArray(pending)
        || Object.keys(pending).some((key) => !pendingKeys.includes(key))
        || pendingKeys.some((key) => !Object.hasOwn(pending, key))
        || pending.schema_version !== STORY_MATCH_CONTEXT_VERSION
        || !compiled.matches.has(pending.match_ref)
        || !compiled.labels.has(pending.return_label)
        || !compiled.checkpoints.has(pending.pre_match_checkpoint_id)
        || !compiled.checkpoints.has(pending.post_match_checkpoint_id)
        || !matchesAuthoredPendingBoundary(pending, compiled)) {
      throw new StoryError('CHECKPOINT_PENDING_MATCH', 'Checkpoint contains an invalid pending Match context.');
    }
  }
  if (checkpoint.returned_match !== null) {
    const returnedKeys = ['schema_version', 'match_ref', 'result_id', 'match_id'];
    const returned = checkpoint.returned_match;
    const result = checkpoint.match_results.find((item) => item.result_id === returned?.result_id);
    if (!returned || typeof returned !== 'object' || Array.isArray(returned)
        || Object.keys(returned).some((key) => !returnedKeys.includes(key))
        || returnedKeys.some((key) => !Object.hasOwn(returned, key))
        || returned.schema_version !== STORY_MATCH_CONTEXT_VERSION || !result
        || result.match_ref !== returned.match_ref || result.match_id !== returned.match_id) {
      throw new StoryError('CHECKPOINT_RETURNED_MATCH', 'Checkpoint contains an invalid returned Match context.');
    }
  }
  if (checkpoint.pending_match !== null && checkpoint.returned_match !== null) {
    throw new StoryError('INVALID_CHECKPOINT', 'A checkpoint cannot contain pending and returned Match contexts together.');
  }

  return {
    schema_version: STORY_STATE_VERSION,
    pack_id: compiled.manifest.pack_id,
    content_version: compiled.manifest.content_version,
    status: checkpoint.pending_match ? 'AWAITING_MATCH' : 'READY',
    location: { script_id: location.script_id, index: location.index },
    call_stack: [],
    variables: clone(checkpoint.variables),
    choices: clone(checkpoint.choices),
    story_service_points: checkpoint.story_service_points,
    branch_history: clone(checkpoint.branch_history),
    match_results: clone(checkpoint.match_results),
    pending_match: clone(checkpoint.pending_match),
    returned_match: clone(checkpoint.returned_match),
    display: createEmptyStoryDisplay(),
    current_statement: null,
    loop_visits: {},
    transition_sequence: 0,
  };
}
