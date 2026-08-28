import {
  MATCH_RESULT_FIELDS,
  NUMERIC_MATCH_RESULT_FIELDS,
  StoryError,
} from './constants.mjs';

function latestResult(state, matchRef) {
  for (let index = state.match_results.length - 1; index >= 0; index -= 1) {
    if (state.match_results[index].match_ref === matchRef) return state.match_results[index];
  }
  return null;
}

export function evaluateStoryCondition(condition, state) {
  if (!condition || typeof condition !== 'object' || Array.isArray(condition)) {
    throw new StoryError('INVALID_CONDITION', 'A Story condition must be an object.');
  }

  switch (condition.op) {
    case 'ALL':
      return condition.conditions.every((child) => evaluateStoryCondition(child, state));
    case 'ANY':
      return condition.conditions.some((child) => evaluateStoryCondition(child, state));
    case 'NOT':
      return !evaluateStoryCondition(condition.condition, state);
    case 'VARIABLE_EQUALS':
      return Object.hasOwn(state.variables, condition.variable_id)
        && Object.is(state.variables[condition.variable_id], condition.value);
    case 'CHOICE_IS':
      return state.choices[condition.choice_id] === condition.option_id;
    case 'STORY_POINTS_AT_LEAST':
      return state.story_service_points >= condition.value;
    case 'MATCH_RESULT': {
      if (!MATCH_RESULT_FIELDS.includes(condition.field)) {
        throw new StoryError('INVALID_CONDITION', `Unsupported Match result field: ${condition.field}`);
      }
      const result = latestResult(state, condition.match_ref);
      if (!result) return false;
      if (condition.comparator === 'EQUALS') return Object.is(result[condition.field], condition.value);
      if (condition.comparator === 'AT_LEAST' && NUMERIC_MATCH_RESULT_FIELDS.includes(condition.field)) {
        return result[condition.field] >= condition.value;
      }
      throw new StoryError('INVALID_CONDITION', `Unsupported comparator for ${condition.field}.`);
    }
    default:
      throw new StoryError('INVALID_CONDITION', `Unsupported Story condition operator: ${condition.op}`);
  }
}
