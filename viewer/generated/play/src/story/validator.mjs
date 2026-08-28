import {
  ASSET_LAYERS,
  DEFAULT_MAX_CALL_DEPTH,
  DEFAULT_MAX_SETTLE_STEPS,
  MATCH_RESULT_FIELDS,
  NUMERIC_MATCH_RESULT_FIELDS,
  POSITIONS,
  STABLE_ID,
  STATEMENT_TYPES,
  STORY_PACK_VERSION,
  STORY_REGISTRY_VERSION,
  STORY_SCRIPT_VERSION,
  STORY_TEXT_CATALOG_VERSION,
  STYLE_KEYS,
  TRANSITIONS,
  StoryError,
} from './constants.mjs';

const OWN = (value, key) => Object.hasOwn(value, key);
const isObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const isSafeInteger = (value) => Number.isSafeInteger(value);

function exactKeys(value, required, optional, path, issues) {
  if (!isObject(value)) {
    issues.push({ code: 'TYPE', path, message: 'Expected an object.' });
    return false;
  }
  const allowed = new Set([...required, ...optional]);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) issues.push({ code: 'EXTRA_FIELD', path: `${path}.${key}`, message: 'Unknown field.' });
  }
  for (const key of required) {
    if (!OWN(value, key)) issues.push({ code: 'MISSING_FIELD', path: `${path}.${key}`, message: 'Required field is missing.' });
  }
  return true;
}

function stableId(value, path, issues) {
  if (typeof value !== 'string' || !STABLE_ID.test(value)) {
    issues.push({ code: 'INVALID_ID', path, message: 'Expected a stable lowercase identifier.' });
    return false;
  }
  return true;
}

function member(value, values, path, issues) {
  if (!values.includes(value)) {
    issues.push({ code: 'ENUM', path, message: `Expected one of: ${values.join(', ')}.` });
    return false;
  }
  return true;
}

function array(value, path, issues) {
  if (!Array.isArray(value)) {
    issues.push({ code: 'TYPE', path, message: 'Expected an array.' });
    return [];
  }
  return value;
}

function checkTypedValue(value, valueType) {
  if (valueType === 'BOOLEAN') return typeof value === 'boolean';
  if (valueType === 'STRING') return typeof value === 'string';
  if (valueType === 'INTEGER') return isSafeInteger(value);
  return false;
}

function addUnique(map, id, value, path, issues, code = 'DUPLICATE_ID') {
  if (map.has(id)) issues.push({ code, path, message: `Duplicate stable ID: ${id}.` });
  else map.set(id, value);
}

function validateCondition(condition, path, context, issues) {
  if (!isObject(condition) || typeof condition.op !== 'string') {
    issues.push({ code: 'INVALID_CONDITION', path, message: 'Condition must declare an operator.' });
    return;
  }
  switch (condition.op) {
    case 'ALL':
    case 'ANY':
      exactKeys(condition, ['op', 'conditions'], [], path, issues);
      if (array(condition.conditions, `${path}.conditions`, issues).length === 0) {
        issues.push({ code: 'INVALID_CONDITION', path: `${path}.conditions`, message: 'Condition list cannot be empty.' });
      }
      for (const [index, child] of (condition.conditions || []).entries()) {
        validateCondition(child, `${path}.conditions[${index}]`, context, issues);
      }
      break;
    case 'NOT':
      exactKeys(condition, ['op', 'condition'], [], path, issues);
      validateCondition(condition.condition, `${path}.condition`, context, issues);
      break;
    case 'VARIABLE_EQUALS': {
      exactKeys(condition, ['op', 'variable_id', 'value'], [], path, issues);
      const variable = context.variables.get(condition.variable_id);
      if (!variable) issues.push({ code: 'MISSING_VARIABLE', path: `${path}.variable_id`, message: 'Unknown Story variable.' });
      else if (!checkTypedValue(condition.value, variable.value_type)) {
        issues.push({ code: 'INVALID_CONDITION_OPERAND', path: `${path}.value`, message: `Expected ${variable.value_type}.` });
      }
      break;
    }
    case 'CHOICE_IS':
      exactKeys(condition, ['op', 'choice_id', 'option_id'], [], path, issues);
      stableId(condition.choice_id, `${path}.choice_id`, issues);
      stableId(condition.option_id, `${path}.option_id`, issues);
      break;
    case 'STORY_POINTS_AT_LEAST':
      exactKeys(condition, ['op', 'value'], [], path, issues);
      if (!isSafeInteger(condition.value) || condition.value < 0) {
        issues.push({ code: 'INVALID_CONDITION_OPERAND', path: `${path}.value`, message: 'Expected a non-negative safe integer.' });
      }
      break;
    case 'MATCH_RESULT':
      exactKeys(condition, ['op', 'match_ref', 'field', 'comparator', 'value'], [], path, issues);
      if (!context.matches.has(condition.match_ref)) issues.push({ code: 'MISSING_MATCH', path: `${path}.match_ref`, message: 'Unknown Story Match reference.' });
      member(condition.field, MATCH_RESULT_FIELDS, `${path}.field`, issues);
      member(condition.comparator, ['EQUALS', 'AT_LEAST'], `${path}.comparator`, issues);
      if (condition.comparator === 'AT_LEAST') {
        if (!NUMERIC_MATCH_RESULT_FIELDS.includes(condition.field) || !isSafeInteger(condition.value) || condition.value < 0) {
          issues.push({ code: 'INVALID_CONDITION_OPERAND', path: `${path}.value`, message: 'AT_LEAST requires a non-negative numeric Match field and value.' });
        }
      } else if (condition.field === 'valid' || condition.field === 'documented_outcome' || condition.field === 'verified_outcome') {
        if (typeof condition.value !== 'boolean') issues.push({ code: 'INVALID_CONDITION_OPERAND', path: `${path}.value`, message: 'Expected a boolean.' });
      } else if (condition.field === 'completion') {
        if (!['COMPLETED', 'ABANDONED', 'INVALID'].includes(condition.value)) {
          issues.push({ code: 'INVALID_CONDITION_OPERAND', path: `${path}.value`, message: 'Expected a Match completion value.' });
        }
      } else if (!isSafeInteger(condition.value) || condition.value < 0) {
        issues.push({ code: 'INVALID_CONDITION_OPERAND', path: `${path}.value`, message: 'Expected a non-negative safe integer.' });
      }
      break;
    default:
      issues.push({ code: 'INVALID_CONDITION', path: `${path}.op`, message: `Unknown condition operator: ${condition.op}.` });
  }
}

function validateRegistry(registry, context, issues) {
  if (!exactKeys(registry, ['registry_version', 'variables', 'assets', 'characters', 'matches', 'declared_loops'], [], 'registry', issues)) return;
  if (registry.registry_version !== STORY_REGISTRY_VERSION) issues.push({ code: 'VERSION', path: 'registry.registry_version', message: 'Unsupported Story registry version.' });

  for (const [index, variable] of array(registry.variables, 'registry.variables', issues).entries()) {
    const path = `registry.variables[${index}]`;
    if (!exactKeys(variable, ['variable_id', 'value_type', 'default'], [], path, issues)) continue;
    stableId(variable.variable_id, `${path}.variable_id`, issues);
    member(variable.value_type, ['BOOLEAN', 'STRING', 'INTEGER'], `${path}.value_type`, issues);
    if (!checkTypedValue(variable.default, variable.value_type)) issues.push({ code: 'TYPE', path: `${path}.default`, message: 'Default does not match value_type.' });
    addUnique(context.variables, variable.variable_id, variable, `${path}.variable_id`, issues);
  }

  for (const [index, asset] of array(registry.assets, 'registry.assets', issues).entries()) {
    const path = `registry.assets[${index}]`;
    if (!exactKeys(asset, ['asset_id', 'layer', 'required', 'alt_text_id'], [], path, issues)) continue;
    stableId(asset.asset_id, `${path}.asset_id`, issues);
    member(asset.layer, ASSET_LAYERS, `${path}.layer`, issues);
    if (typeof asset.required !== 'boolean') issues.push({ code: 'TYPE', path: `${path}.required`, message: 'Expected a boolean.' });
    if (asset.alt_text_id !== null && stableId(asset.alt_text_id, `${path}.alt_text_id`, issues)) {
      context.textRefs.push({ id: asset.alt_text_id, path: `${path}.alt_text_id` });
    }
    addUnique(context.assets, asset.asset_id, asset, `${path}.asset_id`, issues);
  }

  for (const [index, character] of array(registry.characters, 'registry.characters', issues).entries()) {
    const path = `registry.characters[${index}]`;
    if (!exactKeys(character, ['character_id', 'name_text_id', 'poses'], [], path, issues)) continue;
    stableId(character.character_id, `${path}.character_id`, issues);
    if (stableId(character.name_text_id, `${path}.name_text_id`, issues)) {
      context.textRefs.push({ id: character.name_text_id, path: `${path}.name_text_id` });
    }
    const poses = new Map();
    for (const [poseIndex, pose] of array(character.poses, `${path}.poses`, issues).entries()) {
      const posePath = `${path}.poses[${poseIndex}]`;
      if (!exactKeys(pose, ['pose_id', 'asset_id'], [], posePath, issues)) continue;
      stableId(pose.pose_id, `${posePath}.pose_id`, issues);
      stableId(pose.asset_id, `${posePath}.asset_id`, issues);
      addUnique(poses, pose.pose_id, pose, `${posePath}.pose_id`, issues);
    }
    addUnique(context.characters, character.character_id, { ...character, pose_map: poses }, `${path}.character_id`, issues);
  }

  for (const [index, match] of array(registry.matches, 'registry.matches', issues).entries()) {
    const path = `registry.matches[${index}]`;
    if (!exactKeys(match, ['match_ref'], [], path, issues)) continue;
    stableId(match.match_ref, `${path}.match_ref`, issues);
    addUnique(context.matches, match.match_ref, match, `${path}.match_ref`, issues);
  }

  for (const [index, loop] of array(registry.declared_loops, 'registry.declared_loops', issues).entries()) {
    const path = `registry.declared_loops[${index}]`;
    if (!exactKeys(loop, ['loop_id', 'entry_label', 'maximum_visits'], [], path, issues)) continue;
    stableId(loop.loop_id, `${path}.loop_id`, issues);
    stableId(loop.entry_label, `${path}.entry_label`, issues);
    if (!isSafeInteger(loop.maximum_visits) || loop.maximum_visits < 1) issues.push({ code: 'TYPE', path: `${path}.maximum_visits`, message: 'Expected a positive safe integer.' });
    addUnique(context.loops, loop.loop_id, loop, `${path}.loop_id`, issues);
  }
}

const STATEMENT_KEYS = Object.freeze({
  label: [['type', 'label_id'], []],
  scene: [['type', 'scene_id', 'background_asset_id', 'location_text_id', 'time_text_id', 'transition'], ['checkpoint_id']],
  show: [['type', 'tag', 'layer', 'position', 'transition'], ['character_id', 'pose_id', 'asset_id']],
  hide: [['type', 'tag', 'layer', 'transition'], []],
  say: [['type', 'statement_id', 'speaker_key', 'text_id', 'style_key'], []],
  narrate: [['type', 'statement_id', 'text_id', 'style_key'], []],
  choice: [['type', 'choice_id', 'prompt_text_id', 'options'], []],
  set: [['type', 'variable_id', 'value'], []],
  if: [['type', 'condition', 'then_label', 'else_label'], []],
  jump: [['type', 'label_id'], ['loop_id']],
  call: [['type', 'label_id'], []],
  return: [['type'], []],
  checkpoint: [['type', 'checkpoint_id', 'resume_label'], []],
  start_match: [['type', 'match_ref', 'return_label', 'pre_match_checkpoint_id', 'post_match_checkpoint_id'], []],
  end: [['type', 'ending_id', 'checkpoint_id'], []],
});

function validateStatement(statement, path, context, issues) {
  if (!isObject(statement) || !STATEMENT_TYPES.includes(statement.type)) {
    issues.push({ code: 'STATEMENT_TYPE', path, message: 'Unknown or missing Story statement type.' });
    return;
  }
  const [required, optional] = STATEMENT_KEYS[statement.type];
  exactKeys(statement, required, optional, path, issues);
  const textRef = (id, suffix) => {
    if (stableId(id, `${path}.${suffix}`, issues)) context.textRefs.push({ id, path: `${path}.${suffix}` });
  };
  switch (statement.type) {
    case 'label':
      stableId(statement.label_id, `${path}.label_id`, issues);
      break;
    case 'scene':
      stableId(statement.scene_id, `${path}.scene_id`, issues);
      stableId(statement.background_asset_id, `${path}.background_asset_id`, issues);
      textRef(statement.location_text_id, 'location_text_id');
      textRef(statement.time_text_id, 'time_text_id');
      member(statement.transition, TRANSITIONS, `${path}.transition`, issues);
      if (statement.checkpoint_id !== undefined) stableId(statement.checkpoint_id, `${path}.checkpoint_id`, issues);
      break;
    case 'show':
      stableId(statement.tag, `${path}.tag`, issues);
      member(statement.layer, ['characters', 'transient'], `${path}.layer`, issues);
      member(statement.position, POSITIONS, `${path}.position`, issues);
      member(statement.transition, TRANSITIONS, `${path}.transition`, issues);
      if (statement.layer === 'characters') {
        if (!stableId(statement.character_id, `${path}.character_id`, issues)) break;
        stableId(statement.pose_id, `${path}.pose_id`, issues);
        if (statement.asset_id !== undefined) issues.push({ code: 'STATEMENT_SHAPE', path: `${path}.asset_id`, message: 'Character show resolves through character_id and pose_id.' });
      } else {
        stableId(statement.asset_id, `${path}.asset_id`, issues);
        if (statement.character_id !== undefined || statement.pose_id !== undefined) issues.push({ code: 'STATEMENT_SHAPE', path, message: 'Transient show resolves through asset_id.' });
      }
      break;
    case 'hide':
      stableId(statement.tag, `${path}.tag`, issues);
      member(statement.layer, ['characters', 'transient'], `${path}.layer`, issues);
      member(statement.transition, TRANSITIONS, `${path}.transition`, issues);
      break;
    case 'say':
      stableId(statement.statement_id, `${path}.statement_id`, issues);
      stableId(statement.speaker_key, `${path}.speaker_key`, issues);
      textRef(statement.text_id, 'text_id');
      member(statement.style_key, STYLE_KEYS, `${path}.style_key`, issues);
      break;
    case 'narrate':
      stableId(statement.statement_id, `${path}.statement_id`, issues);
      textRef(statement.text_id, 'text_id');
      member(statement.style_key, STYLE_KEYS, `${path}.style_key`, issues);
      break;
    case 'choice':
      stableId(statement.choice_id, `${path}.choice_id`, issues);
      textRef(statement.prompt_text_id, 'prompt_text_id');
      if (array(statement.options, `${path}.options`, issues).length < 2) issues.push({ code: 'MALFORMED_CHOICE', path: `${path}.options`, message: 'A choice needs at least two options.' });
      {
        const options = new Set();
        for (const [index, option] of (statement.options || []).entries()) {
          const optionPath = `${path}.options[${index}]`;
          if (!exactKeys(option, ['option_id', 'text_id', 'jump_label', 'writes'], [], optionPath, issues)) continue;
          stableId(option.option_id, `${optionPath}.option_id`, issues);
          if (options.has(option.option_id)) issues.push({ code: 'DUPLICATE_ID', path: `${optionPath}.option_id`, message: 'Duplicate option ID.' });
          options.add(option.option_id);
          textRef(option.text_id, `options[${index}].text_id`);
          stableId(option.jump_label, `${optionPath}.jump_label`, issues);
          for (const [writeIndex, write] of array(option.writes, `${optionPath}.writes`, issues).entries()) {
            const writePath = `${optionPath}.writes[${writeIndex}]`;
            if (!exactKeys(write, ['variable_id', 'value'], [], writePath, issues)) continue;
            const variable = context.variables.get(write.variable_id);
            if (!variable) issues.push({ code: 'MISSING_VARIABLE', path: `${writePath}.variable_id`, message: 'Unknown Story variable.' });
            else if (!checkTypedValue(write.value, variable.value_type)) issues.push({ code: 'TYPE', path: `${writePath}.value`, message: `Expected ${variable.value_type}.` });
          }
        }
      }
      break;
    case 'set': {
      const variable = context.variables.get(statement.variable_id);
      if (!variable) issues.push({ code: 'MISSING_VARIABLE', path: `${path}.variable_id`, message: 'Unknown Story variable.' });
      else if (!checkTypedValue(statement.value, variable.value_type)) issues.push({ code: 'TYPE', path: `${path}.value`, message: `Expected ${variable.value_type}.` });
      break;
    }
    case 'if':
      validateCondition(statement.condition, `${path}.condition`, context, issues);
      stableId(statement.then_label, `${path}.then_label`, issues);
      stableId(statement.else_label, `${path}.else_label`, issues);
      break;
    case 'jump':
      stableId(statement.label_id, `${path}.label_id`, issues);
      if (statement.loop_id !== undefined) stableId(statement.loop_id, `${path}.loop_id`, issues);
      break;
    case 'call':
      stableId(statement.label_id, `${path}.label_id`, issues);
      break;
    case 'checkpoint':
      stableId(statement.checkpoint_id, `${path}.checkpoint_id`, issues);
      stableId(statement.resume_label, `${path}.resume_label`, issues);
      break;
    case 'start_match':
      stableId(statement.match_ref, `${path}.match_ref`, issues);
      stableId(statement.return_label, `${path}.return_label`, issues);
      stableId(statement.pre_match_checkpoint_id, `${path}.pre_match_checkpoint_id`, issues);
      stableId(statement.post_match_checkpoint_id, `${path}.post_match_checkpoint_id`, issues);
      break;
    case 'end':
      stableId(statement.ending_id, `${path}.ending_id`, issues);
      stableId(statement.checkpoint_id, `${path}.checkpoint_id`, issues);
      break;
    default:
  }
}

function nextIndex(context, location) {
  const script = context.scripts.get(location.script_id);
  return location.index + 1 < script.statements.length
    ? { script_id: location.script_id, index: location.index + 1 }
    : null;
}

function locationKey(location) {
  return `${location.script_id}:${location.index}`;
}

function flowStateKey(state) {
  const returns = state.returns.map((location) => location === null ? '@library' : locationKey(location));
  return `${locationKey(state.location)}|${returns.join(',')}`;
}

function flowTransitions(context, state, maxDepth, report) {
  const statement = context.scripts.get(state.location.script_id).statements[state.location.index];
  const next = nextIndex(context, state.location);
  const target = (label) => context.labels.get(label) || null;
  const edge = (location, returns = state.returns, declared = false) => location
    ? [{ state: { location, returns }, declared }]
    : [];

  if (statement.type === 'jump') return edge(target(statement.label_id), state.returns, Boolean(statement.loop_id));
  if (statement.type === 'if') {
    return [target(statement.then_label), target(statement.else_label)]
      .flatMap((location) => edge(location));
  }
  if (statement.type === 'choice') {
    return statement.options.flatMap((option) => edge(target(option.jump_label)));
  }
  if (statement.type === 'call') {
    if (!next) {
      report('CALL_WITHOUT_RETURN_SITE', locationKey(state.location), 'Call has no return site.');
      return [];
    }
    const activeDepth = state.returns.length - (state.returns[0] === null ? 1 : 0);
    if (activeDepth >= maxDepth) {
      report('CALL_DEPTH', locationKey(state.location), 'Call graph exceeds max_call_depth.');
      return [];
    }
    return edge(target(statement.label_id), [...state.returns, next]);
  }
  if (statement.type === 'return') {
    if (state.returns.length === 0) {
      report('RETURN_UNDERFLOW', locationKey(state.location), 'Return is reachable without a matching call.');
      return [];
    }
    const returnLocation = state.returns.at(-1);
    return returnLocation === null ? [] : edge(returnLocation, state.returns.slice(0, -1));
  }
  if (statement.type === 'checkpoint') return edge(target(statement.resume_label));
  if (statement.type === 'start_match') return edge(target(statement.return_label));
  if (statement.type === 'end') return [];
  return edge(next);
}

function analyzeFlow(context, roots, maxDepth, issues, path) {
  const issueKeys = new Set();
  const report = (code, issuePath, message) => {
    const key = `${code}|${issuePath}`;
    if (issueKeys.has(key)) return;
    issueKeys.add(key);
    issues.push({ code, path: issuePath, message });
  };
  const nodes = new Map();
  const edges = new Map();
  const work = roots.filter((root) => root.location);
  let iterations = 0;
  while (work.length && iterations < 20000) {
    iterations += 1;
    const state = work.pop();
    const key = flowStateKey(state);
    if (nodes.has(key)) continue;
    nodes.set(key, state);
    const outgoing = flowTransitions(context, state, maxDepth, report);
    edges.set(key, outgoing.map((item) => ({ key: flowStateKey(item.state), declared: item.declared })));
    for (const item of outgoing) work.push(item.state);
  }
  if (work.length) report('GRAPH_LIMIT', path, 'Static graph walk exceeded its deterministic bound.');
  return { nodes, edges };
}

function validateConditionReferences(condition, path, context, issues) {
  if (!isObject(condition)) return;
  if (condition.op === 'ALL' || condition.op === 'ANY') {
    if (Array.isArray(condition.conditions)) condition.conditions.forEach((child, index) => validateConditionReferences(child, `${path}.conditions[${index}]`, context, issues));
  } else if (condition.op === 'NOT') {
    validateConditionReferences(condition.condition, `${path}.condition`, context, issues);
  } else if (condition.op === 'CHOICE_IS') {
    const choice = context.choices.get(condition.choice_id);
    if (!choice) issues.push({ code: 'MISSING_CHOICE', path: `${path}.choice_id`, message: 'Unknown Story choice.' });
    else if (!choice.options.some((option) => option.option_id === condition.option_id)) {
      issues.push({ code: 'MISSING_CHOICE_OPTION', path: `${path}.option_id`, message: 'Unknown option for Story choice.' });
    }
  }
}

function validateSemantics(context, manifest, issues) {
  const reference = (label, path) => {
    if (!context.labels.has(label)) issues.push({ code: 'MISSING_LABEL', path, message: `Unknown label: ${label}.` });
  };
  reference(manifest.entry_label, 'manifest.entry_label');
  for (const [index, label] of manifest.library_entry_labels.entries()) reference(label, `manifest.library_entry_labels[${index}]`);

  for (const [scriptId, script] of context.scripts) {
    for (const [index, statement] of script.statements.entries()) {
      const path = `scripts.${scriptId}.statements[${index}]`;
      if (statement.type === 'scene') {
        const asset = context.assets.get(statement.background_asset_id);
        if (!asset || asset.layer !== 'BACKGROUND') issues.push({ code: 'MISSING_ASSET', path: `${path}.background_asset_id`, message: 'Unknown BACKGROUND asset.' });
      } else if (statement.type === 'show' && statement.layer === 'characters') {
        const character = context.characters.get(statement.character_id);
        if (!character) issues.push({ code: 'MISSING_CHARACTER', path: `${path}.character_id`, message: 'Unknown character.' });
        else {
          const pose = character.pose_map.get(statement.pose_id);
          if (!pose) issues.push({ code: 'MISSING_POSE', path: `${path}.pose_id`, message: 'Unknown pose for character.' });
          else if (!context.assets.has(pose.asset_id) || context.assets.get(pose.asset_id).layer !== 'CHARACTER') issues.push({ code: 'MISSING_ASSET', path: `${path}.pose_id`, message: 'Pose does not resolve to a CHARACTER asset.' });
        }
      } else if (statement.type === 'show' && statement.layer === 'transient') {
        if (!context.assets.has(statement.asset_id) || context.assets.get(statement.asset_id).layer !== 'TRANSIENT') issues.push({ code: 'MISSING_ASSET', path: `${path}.asset_id`, message: 'Unknown TRANSIENT asset.' });
      } else if (statement.type === 'say') {
        if (!context.characters.has(statement.speaker_key)
            && !['speaker.narrator', 'speaker.system'].includes(statement.speaker_key)) {
          issues.push({ code: 'MISSING_SPEAKER', path: `${path}.speaker_key`, message: 'Unknown speaker key.' });
        }
      } else if (statement.type === 'choice') {
        statement.options.forEach((option, optionIndex) => reference(option.jump_label, `${path}.options[${optionIndex}].jump_label`));
      } else if (statement.type === 'if') {
        validateConditionReferences(statement.condition, `${path}.condition`, context, issues);
        reference(statement.then_label, `${path}.then_label`);
        reference(statement.else_label, `${path}.else_label`);
      } else if (statement.type === 'jump' || statement.type === 'call') {
        reference(statement.label_id, `${path}.label_id`);
        if (statement.loop_id !== undefined && !context.loops.has(statement.loop_id)) issues.push({ code: 'MISSING_LOOP', path: `${path}.loop_id`, message: 'Unknown declared loop.' });
      } else if (statement.type === 'checkpoint') {
        reference(statement.resume_label, `${path}.resume_label`);
      } else if (statement.type === 'start_match') {
        reference(statement.return_label, `${path}.return_label`);
        if (!context.matches.has(statement.match_ref)) issues.push({ code: 'MISSING_MATCH', path: `${path}.match_ref`, message: 'Unknown Story Match reference.' });
      }
    }
  }

  for (const character of context.characters.values()) {
    for (const pose of character.poses) {
      const asset = context.assets.get(pose.asset_id);
      if (!asset || asset.layer !== 'CHARACTER') {
        issues.push({ code: 'MISSING_ASSET', path: `registry.characters.${character.character_id}.poses.${pose.pose_id}`, message: 'Pose does not resolve to a CHARACTER asset.' });
      }
    }
  }

  for (const loop of context.loops.values()) reference(loop.entry_label, `registry.declared_loops.${loop.loop_id}.entry_label`);

  const catalog = context.texts.get(manifest.default_locale);
  for (const textRef of context.textRefs) {
    if (!catalog || typeof catalog.entries[textRef.id] !== 'string' || catalog.entries[textRef.id].length === 0) {
      issues.push({ code: 'UNTRANSLATED_TEXT', path: textRef.path, message: `Missing ${manifest.default_locale} text: ${textRef.id}.` });
    }
  }

  const entry = context.labels.get(manifest.entry_label);
  const storyRoots = [
    ...(entry ? [{ location: entry, returns: [] }] : []),
    ...manifest.library_entry_labels
      .map((label) => context.labels.get(label))
      .filter(Boolean)
      .map((location) => ({ location, returns: [null] })),
  ];
  const storyFlow = analyzeFlow(context, storyRoots, manifest.max_call_depth, [], 'manifest.entry_label');
  const reachable = new Set([...storyFlow.nodes.values()].map((state) => locationKey(state.location)));
  for (const [label, location] of context.labels) {
    if (!reachable.has(locationKey(location)) && !manifest.library_entry_labels.includes(label)) {
      issues.push({ code: 'UNREACHABLE_LABEL', path: `labels.${label}`, message: `Label is unreachable: ${label}.` });
    }
  }

  const checkpointRoots = [...context.checkpoints.values()]
    .map((checkpoint) => checkpoint.resume_label ? context.labels.get(checkpoint.resume_label) : checkpoint)
    .filter((location) => location && location.script_id)
    .map((location) => ({ location, returns: [] }));
  const safetyFlow = analyzeFlow(
    context,
    [...storyRoots, ...checkpointRoots],
    manifest.max_call_depth,
    issues,
    'checkpoints',
  );
  const color = new Map();
  const reportedCycles = new Set();
  function visit(key) {
    if (color.get(key) === 1) {
      const location = safetyFlow.nodes.get(key)?.location;
      const path = location ? locationKey(location) : key;
      if (!reportedCycles.has(path)) {
        reportedCycles.add(path);
        issues.push({ code: 'UNDECLARED_CYCLE', path, message: 'Control-flow cycle requires a declared loop edge.' });
      }
      return;
    }
    if (color.get(key) === 2) return;
    color.set(key, 1);
    for (const edge of safetyFlow.edges.get(key) || []) if (!edge.declared) visit(edge.key);
    color.set(key, 2);
  }
  for (const root of [...storyRoots, ...checkpointRoots]) visit(flowStateKey(root));
}

function collectStoryPack(bundle, issues) {
  const context = {
    variables: new Map(), assets: new Map(), characters: new Map(), matches: new Map(), loops: new Map(),
    scripts: new Map(), labels: new Map(), checkpoints: new Map(), texts: new Map(), textRefs: [],
    choices: new Map(), statementIds: new Map(),
  };
  if (!exactKeys(bundle, ['manifest', 'registry', 'texts', 'scripts'], [], 'pack', issues)) return { context, manifest: null };
  const { manifest } = bundle;
  if (!exactKeys(manifest, ['pack_version', 'pack_id', 'content_version', 'default_locale', 'entry_label', 'library_entry_labels', 'max_call_depth', 'max_settle_steps', 'scripts', 'text_catalogs', 'registry'], [], 'manifest', issues)) return { context, manifest };
  if (manifest.pack_version !== STORY_PACK_VERSION) issues.push({ code: 'VERSION', path: 'manifest.pack_version', message: 'Unsupported Story pack version.' });
  stableId(manifest.pack_id, 'manifest.pack_id', issues);
  stableId(manifest.content_version, 'manifest.content_version', issues);
  stableId(manifest.entry_label, 'manifest.entry_label', issues);
  if (typeof manifest.default_locale !== 'string' || !/^[a-z]{2}(?:-[A-Z]{2})?$/.test(manifest.default_locale)) issues.push({ code: 'LOCALE', path: 'manifest.default_locale', message: 'Invalid locale.' });
  array(manifest.library_entry_labels, 'manifest.library_entry_labels', issues).forEach((id, index) => stableId(id, `manifest.library_entry_labels[${index}]`, issues));
  const scriptFiles = array(manifest.scripts, 'manifest.scripts', issues);
  if (new Set(scriptFiles).size !== scriptFiles.length) issues.push({ code: 'DUPLICATE_ID', path: 'manifest.scripts', message: 'Script filenames must be unique.' });
  scriptFiles.forEach((filename, index) => {
    if (typeof filename !== 'string' || !/^[a-z0-9][a-z0-9._/-]*\.json$/.test(filename) || filename.includes('..')) {
      issues.push({ code: 'PATH', path: `manifest.scripts[${index}]`, message: 'Expected a safe relative JSON filename.' });
    }
  });
  if (!isObject(manifest.text_catalogs)) issues.push({ code: 'TYPE', path: 'manifest.text_catalogs', message: 'Expected locale-to-file map.' });
  else for (const [locale, filename] of Object.entries(manifest.text_catalogs)) {
    if (!/^[a-z]{2}(?:-[A-Z]{2})?$/.test(locale) || typeof filename !== 'string' || !/^[a-z0-9][a-z0-9._/-]*\.json$/.test(filename) || filename.includes('..')) {
      issues.push({ code: 'PATH', path: `manifest.text_catalogs.${locale}`, message: 'Expected a locale and safe relative JSON filename.' });
    }
  }
  if (typeof manifest.registry !== 'string' || manifest.registry.length === 0) issues.push({ code: 'TYPE', path: 'manifest.registry', message: 'Expected a registry filename.' });
  if (!isSafeInteger(manifest.max_call_depth) || manifest.max_call_depth < 1 || manifest.max_call_depth > 64) issues.push({ code: 'BOUND', path: 'manifest.max_call_depth', message: 'Expected integer 1..64.' });
  if (!isSafeInteger(manifest.max_settle_steps) || manifest.max_settle_steps < 1 || manifest.max_settle_steps > 4096) issues.push({ code: 'BOUND', path: 'manifest.max_settle_steps', message: 'Expected integer 1..4096.' });

  validateRegistry(bundle.registry, context, issues);
  if (!isObject(bundle.texts)) issues.push({ code: 'TYPE', path: 'pack.texts', message: 'Expected locale catalog object.' });
  else for (const [locale, catalog] of Object.entries(bundle.texts)) {
    const path = `texts.${locale}`;
    if (!exactKeys(catalog, ['text_catalog_version', 'locale', 'entries'], [], path, issues)) continue;
    if (catalog.text_catalog_version !== STORY_TEXT_CATALOG_VERSION) issues.push({ code: 'VERSION', path: `${path}.text_catalog_version`, message: 'Unsupported text catalog version.' });
    if (catalog.locale !== locale) issues.push({ code: 'LOCALE', path: `${path}.locale`, message: 'Catalog locale must match its key.' });
    if (!isObject(catalog.entries)) issues.push({ code: 'TYPE', path: `${path}.entries`, message: 'Expected text ID map.' });
    else for (const [id, text] of Object.entries(catalog.entries)) {
      stableId(id, `${path}.entries.${id}`, issues);
      if (typeof text !== 'string' || text.length === 0) issues.push({ code: 'TYPE', path: `${path}.entries.${id}`, message: 'Text must be non-empty.' });
    }
    context.texts.set(locale, catalog);
  }

  for (const [scriptIndex, script] of array(bundle.scripts, 'pack.scripts', issues).entries()) {
    const path = `scripts[${scriptIndex}]`;
    if (!exactKeys(script, ['script_version', 'script_id', 'chapter_id', 'statements'], [], path, issues)) continue;
    if (script.script_version !== STORY_SCRIPT_VERSION) issues.push({ code: 'VERSION', path: `${path}.script_version`, message: 'Unsupported Story script version.' });
    stableId(script.script_id, `${path}.script_id`, issues);
    stableId(script.chapter_id, `${path}.chapter_id`, issues);
    addUnique(context.scripts, script.script_id, script, `${path}.script_id`, issues);
    const statements = array(script.statements, `${path}.statements`, issues);
    for (const [index, statement] of statements.entries()) {
      const statementPath = `${path}.statements[${index}]`;
      validateStatement(statement, statementPath, context, issues);
      if (!isObject(statement)) continue;
      const location = { script_id: script.script_id, index };
      if (statement.type === 'label' && typeof statement.label_id === 'string') addUnique(context.labels, statement.label_id, location, `${statementPath}.label_id`, issues, 'DUPLICATE_LABEL');
      if ((statement.type === 'say' || statement.type === 'narrate') && typeof statement.statement_id === 'string') {
        addUnique(context.statementIds, statement.statement_id, location, `${statementPath}.statement_id`, issues, 'DUPLICATE_STATEMENT');
      }
      if (statement.type === 'choice' && typeof statement.choice_id === 'string') {
        addUnique(context.choices, statement.choice_id, statement, `${statementPath}.choice_id`, issues, 'DUPLICATE_CHOICE');
      }
      if (statement.type === 'scene' && statement.checkpoint_id) addUnique(context.checkpoints, statement.checkpoint_id, { ...location, kind: 'SCENE' }, `${statementPath}.checkpoint_id`, issues, 'DUPLICATE_CHECKPOINT');
      if (statement.type === 'checkpoint') addUnique(context.checkpoints, statement.checkpoint_id, { resume_label: statement.resume_label, kind: 'EXPLICIT' }, `${statementPath}.checkpoint_id`, issues, 'DUPLICATE_CHECKPOINT');
      if (statement.type === 'start_match') {
        addUnique(context.checkpoints, statement.pre_match_checkpoint_id, { ...location, kind: 'PRE_MATCH' }, `${statementPath}.pre_match_checkpoint_id`, issues, 'DUPLICATE_CHECKPOINT');
        addUnique(context.checkpoints, statement.post_match_checkpoint_id, { resume_label: statement.return_label, kind: 'POST_MATCH' }, `${statementPath}.post_match_checkpoint_id`, issues, 'DUPLICATE_CHECKPOINT');
      }
      if (statement.type === 'end') addUnique(context.checkpoints, statement.checkpoint_id, { ...location, kind: 'END' }, `${statementPath}.checkpoint_id`, issues, 'DUPLICATE_CHECKPOINT');
    }
  }

  if (manifest && Array.isArray(manifest.scripts) && manifest.scripts.length !== context.scripts.size) issues.push({ code: 'SCRIPT_MANIFEST', path: 'manifest.scripts', message: 'Manifest script list must match loaded scripts.' });
  if (manifest && context.scripts.size > 0) validateSemantics(context, manifest, issues);
  return { context, manifest };
}

export function validateStoryPack(bundle) {
  const issues = [];
  try {
    collectStoryPack(bundle, issues);
  } catch (error) {
    issues.push({ code: 'VALIDATOR_FAILURE', path: 'pack', message: error instanceof Error ? error.message : String(error) });
  }
  return issues;
}

export function compileStoryPack(bundle) {
  const issues = [];
  const { context, manifest } = collectStoryPack(bundle, issues);
  if (issues.length) throw new StoryError('INVALID_STORY_PACK', `Story pack has ${issues.length} validation issue(s).`, issues);
  for (const checkpoint of context.checkpoints.values()) {
    if (checkpoint.resume_label) {
      const location = context.labels.get(checkpoint.resume_label);
      checkpoint.script_id = location.script_id;
      checkpoint.index = location.index;
    }
  }
  return {
    bundle,
    manifest,
    registry: bundle.registry,
    ...context,
    max_call_depth: manifest.max_call_depth || DEFAULT_MAX_CALL_DEPTH,
    max_settle_steps: manifest.max_settle_steps || DEFAULT_MAX_SETTLE_STEPS,
    text_catalog: context.texts.get(manifest.default_locale),
  };
}
