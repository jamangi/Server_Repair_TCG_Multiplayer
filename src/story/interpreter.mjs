import {
  MAX_BRANCH_HISTORY,
  STORY_MATCH_CONTEXT_VERSION,
  STORY_STATE_VERSION,
  StoryError,
  createEmptyStoryDisplay,
} from './constants.mjs';
import { evaluateStoryCondition } from './conditions.mjs';
import { createDurableCheckpoint, storyDigest } from './checkpoint.mjs';
import { acceptStoryMatchResult } from './match-boundary.mjs';
import { compileStoryPack } from './validator.mjs';

const clone = (value) => value === undefined ? undefined : JSON.parse(JSON.stringify(value));

function locationAfter(compiled, location) {
  const script = compiled.scripts.get(location.script_id);
  if (location.index + 1 >= script.statements.length) return null;
  return { script_id: location.script_id, index: location.index + 1 };
}

function requireLabel(compiled, label) {
  const location = compiled.labels.get(label);
  if (!location) throw new StoryError('MISSING_LABEL', `Unknown Story label: ${label}.`);
  return { ...location };
}

function statementAt(compiled, location) {
  const script = compiled.scripts.get(location?.script_id);
  const statement = script?.statements[location?.index];
  if (!statement) throw new StoryError('INVALID_PROGRAM_COUNTER', 'Story runtime reached an invalid statement location.');
  return statement;
}

function text(compiled, textId) {
  const value = compiled.text_catalog.entries[textId];
  if (typeof value !== 'string') throw new StoryError('MISSING_TEXT', `Missing Story text: ${textId}.`);
  return value;
}

function clearScreen(state) {
  state.current_statement = null;
  state.display.screens.dialogue = null;
  state.display.screens.choices = null;
  state.display.screens.controls = { can_advance: false, awaiting_choice: false };
}

function appendTranscript(state, entry) {
  state.display.screens.transcript = [...state.display.screens.transcript, entry];
}

function replaceByTag(collection, value) {
  const index = collection.findIndex((item) => item.tag === value.tag);
  if (index < 0) collection.push(value);
  else collection[index] = value;
}

function checkpointEffect(state, checkpointId, bundle) {
  return { type: 'PERSIST_CHECKPOINT', checkpoint: createDurableCheckpoint(state, checkpointId, bundle) };
}

function activeCallDepth(callStack) {
  return callStack.length - (callStack[0] === null ? 1 : 0);
}

function settle(state, compiled, bundle, effects) {
  for (let step = 0; step < compiled.max_settle_steps; step += 1) {
    if (state.status === 'AWAITING_MATCH' || state.status === 'COMPLETE' || state.current_statement) return;
    const statement = statementAt(compiled, state.location);
    const next = locationAfter(compiled, state.location);

    switch (statement.type) {
      case 'label':
        if (!next) throw new StoryError('SCRIPT_FALLOFF', `Label ${statement.label_id} has no following statement.`);
        state.location = next;
        break;
      case 'scene': {
        const asset = compiled.assets.get(statement.background_asset_id);
        state.display.background = {
          scene_id: statement.scene_id,
          asset_id: asset.asset_id,
          location_text_id: statement.location_text_id,
          location_text: text(compiled, statement.location_text_id),
          time_text_id: statement.time_text_id,
          time_text: text(compiled, statement.time_text_id),
          transition: statement.transition,
        };
        state.display.transient = [];
        if (!next) throw new StoryError('SCRIPT_FALLOFF', `Scene ${statement.scene_id} has no following statement.`);
        state.location = next;
        if (statement.checkpoint_id) effects.push(checkpointEffect(state, statement.checkpoint_id, bundle));
        break;
      }
      case 'show':
        if (statement.layer === 'characters') {
          const character = compiled.characters.get(statement.character_id);
          const pose = character.pose_map.get(statement.pose_id);
          replaceByTag(state.display.characters, {
            tag: statement.tag,
            character_id: statement.character_id,
            pose_id: statement.pose_id,
            asset_id: pose.asset_id,
            position: statement.position,
            transition: statement.transition,
          });
        } else {
          replaceByTag(state.display.transient, {
            tag: statement.tag,
            asset_id: statement.asset_id,
            position: statement.position,
            transition: statement.transition,
          });
        }
        if (!next) throw new StoryError('SCRIPT_FALLOFF', 'Show statement has no following statement.');
        state.location = next;
        break;
      case 'hide': {
        const target = statement.layer === 'characters' ? state.display.characters : state.display.transient;
        const index = target.findIndex((item) => item.tag === statement.tag);
        if (index >= 0) target.splice(index, 1);
        if (!next) throw new StoryError('SCRIPT_FALLOFF', 'Hide statement has no following statement.');
        state.location = next;
        break;
      }
      case 'say': {
        const character = compiled.characters.get(statement.speaker_key);
        const speakerTextId = character?.name_text_id ?? null;
        const entry = {
          kind: 'DIALOGUE',
          statement_id: statement.statement_id,
          speaker_key: statement.speaker_key,
          speaker_text_id: speakerTextId,
          speaker_text: speakerTextId ? text(compiled, speakerTextId) : statement.speaker_key,
          text_id: statement.text_id,
          text: text(compiled, statement.text_id),
          style_key: statement.style_key,
        };
        state.current_statement = { type: 'say', statement_id: statement.statement_id };
        state.display.screens.dialogue = entry;
        state.display.screens.controls = { can_advance: true, awaiting_choice: false };
        appendTranscript(state, entry);
        return;
      }
      case 'narrate': {
        const entry = {
          kind: 'NARRATION',
          statement_id: statement.statement_id,
          speaker_key: null,
          speaker_text_id: null,
          speaker_text: null,
          text_id: statement.text_id,
          text: text(compiled, statement.text_id),
          style_key: statement.style_key,
        };
        state.current_statement = { type: 'narrate', statement_id: statement.statement_id };
        state.display.screens.dialogue = entry;
        state.display.screens.controls = { can_advance: true, awaiting_choice: false };
        appendTranscript(state, entry);
        return;
      }
      case 'choice': {
        state.current_statement = { type: 'choice', choice_id: statement.choice_id };
        state.display.screens.choices = {
          choice_id: statement.choice_id,
          prompt_text_id: statement.prompt_text_id,
          prompt_text: text(compiled, statement.prompt_text_id),
          options: statement.options.map((option) => ({
            option_id: option.option_id,
            text_id: option.text_id,
            text: text(compiled, option.text_id),
          })),
        };
        state.display.screens.controls = { can_advance: false, awaiting_choice: true };
        return;
      }
      case 'set':
        state.variables[statement.variable_id] = clone(statement.value);
        if (!next) throw new StoryError('SCRIPT_FALLOFF', 'Set statement has no following statement.');
        state.location = next;
        break;
      case 'if':
        state.location = requireLabel(compiled, evaluateStoryCondition(statement.condition, state) ? statement.then_label : statement.else_label);
        break;
      case 'jump':
        if (statement.loop_id) {
          const descriptor = compiled.loops.get(statement.loop_id);
          const visits = (state.loop_visits[statement.loop_id] ?? 0) + 1;
          if (visits > descriptor.maximum_visits) throw new StoryError('LOOP_LIMIT', `Declared loop exceeded its maximum visits: ${statement.loop_id}.`);
          state.loop_visits[statement.loop_id] = visits;
        }
        state.location = requireLabel(compiled, statement.label_id);
        break;
      case 'call':
        if (!next) throw new StoryError('CALL_WITHOUT_RETURN_SITE', `Call to ${statement.label_id} has no return site.`);
        if (activeCallDepth(state.call_stack) >= compiled.max_call_depth) throw new StoryError('CALL_STACK_OVERFLOW', `Story call depth exceeds ${compiled.max_call_depth}.`);
        state.call_stack.push(next);
        state.location = requireLabel(compiled, statement.label_id);
        break;
      case 'return': {
        if (state.call_stack.length === 0) throw new StoryError('CALL_STACK_UNDERFLOW', 'Story return has no matching call.');
        const returnLocation = state.call_stack.pop();
        if (returnLocation === null) {
          state.status = 'COMPLETE';
          return;
        }
        state.location = returnLocation;
        break;
      }
      case 'checkpoint':
        effects.push(checkpointEffect(state, statement.checkpoint_id, bundle));
        state.location = requireLabel(compiled, statement.resume_label);
        break;
      case 'start_match': {
        state.pending_match = {
          schema_version: STORY_MATCH_CONTEXT_VERSION,
          match_ref: statement.match_ref,
          return_label: statement.return_label,
          pre_match_checkpoint_id: statement.pre_match_checkpoint_id,
          post_match_checkpoint_id: statement.post_match_checkpoint_id,
        };
        state.returned_match = null;
        state.status = 'AWAITING_MATCH';
        effects.push(checkpointEffect(state, statement.pre_match_checkpoint_id, bundle));
        effects.push({
          type: 'START_MATCH',
          context: {
            schema_version: STORY_MATCH_CONTEXT_VERSION,
            match_ref: statement.match_ref,
            checkpoint_id: statement.pre_match_checkpoint_id,
          },
        });
        return;
      }
      case 'end':
        state.status = 'COMPLETE';
        state.ending_id = statement.ending_id;
        effects.push(checkpointEffect(state, statement.checkpoint_id, bundle));
        effects.push({ type: 'STORY_ENDED', ending_id: statement.ending_id });
        return;
      default:
        throw new StoryError('STATEMENT_TYPE', `Unsupported Story statement: ${statement.type}.`);
    }
  }
  throw new StoryError('SETTLE_LIMIT', `Story transition did not settle within ${compiled.max_settle_steps} steps.`);
}

export function createStoryState(bundle, { entryLabel } = {}) {
  const compiled = compileStoryPack(bundle);
  const entry = entryLabel ?? compiled.manifest.entry_label;
  if (entryLabel && !compiled.manifest.library_entry_labels.includes(entryLabel) && entryLabel !== compiled.manifest.entry_label) {
    throw new StoryError('INVALID_ENTRY_LABEL', 'Only the pack entry or a declared library entry may start a Story state.');
  }
  return {
    schema_version: STORY_STATE_VERSION,
    pack_id: compiled.manifest.pack_id,
    content_version: compiled.manifest.content_version,
    status: 'READY',
    location: requireLabel(compiled, entry),
    call_stack: entry !== compiled.manifest.entry_label ? [null] : [],
    variables: Object.fromEntries(compiled.registry.variables.map((item) => [item.variable_id, clone(item.default)])),
    choices: {},
    story_service_points: 0,
    branch_history: [],
    match_results: [],
    pending_match: null,
    returned_match: null,
    display: createEmptyStoryDisplay(),
    current_statement: null,
    loop_visits: {},
    transition_sequence: 0,
  };
}

function validateState(state, compiled) {
  if (!state || state.schema_version !== STORY_STATE_VERSION
      || state.pack_id !== compiled.manifest.pack_id
      || state.content_version !== compiled.manifest.content_version) {
    throw new StoryError('STATE_CONTENT_MISMATCH', 'Story state does not match this pack.');
  }
}

export function reduceStory(state, intent, bundle) {
  const compiled = compileStoryPack(bundle);
  validateState(state, compiled);
  if (!intent || typeof intent !== 'object' || Array.isArray(intent) || typeof intent.type !== 'string') {
    throw new StoryError('INVALID_INTENT', 'Story intent must declare a type.');
  }
  let next = clone(state);
  const effects = [];
  next.transition_sequence += 1;

  if (intent.type === 'BEGIN') {
    if (Object.keys(intent).length !== 1 || next.status !== 'READY' || next.current_statement) throw new StoryError('INVALID_INTENT', 'BEGIN is only valid for a ready Story segment.');
    next.status = 'ACTIVE';
  } else if (intent.type === 'ADVANCE') {
    if (Object.keys(intent).length !== 1 || next.status !== 'ACTIVE' || !['say', 'narrate'].includes(next.current_statement?.type)) {
      throw new StoryError('INVALID_INTENT', 'ADVANCE requires visible dialogue or narration.');
    }
    const after = locationAfter(compiled, next.location);
    if (!after) throw new StoryError('SCRIPT_FALLOFF', 'Dialogue has no following statement.');
    clearScreen(next);
    next.location = after;
  } else if (intent.type === 'CHOOSE') {
    if (Object.keys(intent).some((key) => !['type', 'option_id'].includes(key)) || Object.keys(intent).length !== 2
        || next.status !== 'ACTIVE' || next.current_statement?.type !== 'choice') {
      throw new StoryError('INVALID_INTENT', 'CHOOSE requires a visible choice and one option_id.');
    }
    const statement = statementAt(compiled, next.location);
    const option = statement.options.find((item) => item.option_id === intent.option_id);
    if (!option) throw new StoryError('INVALID_CHOICE', `Unknown option for ${statement.choice_id}: ${intent.option_id}.`);
    for (const write of option.writes) next.variables[write.variable_id] = clone(write.value);
    next.choices[statement.choice_id] = option.option_id;
    next.branch_history.push({ sequence: next.transition_sequence, choice_id: statement.choice_id, option_id: option.option_id });
    next.branch_history = next.branch_history.slice(-MAX_BRANCH_HISTORY);
    clearScreen(next);
    next.location = requireLabel(compiled, option.jump_label);
  } else if (intent.type === 'ACCEPT_MATCH_RESULT') {
    if (Object.keys(intent).some((key) => !['type', 'result'].includes(key)) || Object.keys(intent).length !== 2
        || next.status !== 'AWAITING_MATCH') throw new StoryError('INVALID_INTENT', 'ACCEPT_MATCH_RESULT requires a pending Story Match.');
    const pending = clone(next.pending_match);
    next = acceptStoryMatchResult(next, intent.result);
    next.location = requireLabel(compiled, pending.return_label);
    effects.push(checkpointEffect(next, pending.post_match_checkpoint_id, bundle));
  } else {
    throw new StoryError('INVALID_INTENT', `Unsupported Story intent: ${intent.type}.`);
  }

  settle(next, compiled, bundle, effects);
  const display = clone(next.display);
  return { state: next, display, effects, digest: storyDigest(next) };
}
