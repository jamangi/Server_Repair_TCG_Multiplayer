export const STORY_PACK_VERSION = 'story-pack-v1';
export const STORY_SCRIPT_VERSION = 'story-script-v1';
export const STORY_REGISTRY_VERSION = 'story-registry-v1';
export const STORY_TEXT_CATALOG_VERSION = 'story-text-catalog-v1';
export const STORY_STATE_VERSION = 'story-state-v1';
export const STORY_DISPLAY_VERSION = 'story-display-v1';
export const STORY_CHECKPOINT_VERSION = 'story-checkpoint-v1';
export const STORY_MATCH_CONTEXT_VERSION = 'story-match-context-v1';
export const STORY_MATCH_RESULT_VERSION = 'story-match-result-v1';

export const STABLE_ID = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/;
export const STATEMENT_TYPES = Object.freeze([
  'label', 'scene', 'show', 'hide', 'say', 'narrate', 'choice', 'set', 'if',
  'jump', 'call', 'return', 'checkpoint', 'start_match', 'end',
]);
export const TRANSITIONS = Object.freeze(['CUT', 'FADE', 'DISSOLVE', 'SLIDE']);
export const POSITIONS = Object.freeze(['LEFT', 'CENTER', 'RIGHT', 'FULL']);
export const STYLE_KEYS = Object.freeze(['DIALOGUE', 'NARRATION', 'SYSTEM', 'THOUGHT']);
export const ASSET_LAYERS = Object.freeze(['BACKGROUND', 'CHARACTER', 'TRANSIENT']);
export const MATCH_RESULT_FIELDS = Object.freeze([
  'completion',
  'valid',
  'story_service_points_gained',
  'tickets_closed',
  'tickets_given_up',
  'documented_outcome',
  'verified_outcome',
]);
export const NUMERIC_MATCH_RESULT_FIELDS = Object.freeze([
  'story_service_points_gained', 'tickets_closed', 'tickets_given_up',
]);
export const DEFAULT_MAX_CALL_DEPTH = 16;
export const DEFAULT_MAX_SETTLE_STEPS = 256;
export const MAX_BRANCH_HISTORY = 4096;
export const MAX_MATCH_HISTORY = 1024;

export function createEmptyStoryDisplay() {
  return {
    schema_version: STORY_DISPLAY_VERSION,
    background: null,
    characters: [],
    transient: [],
    screens: {
      dialogue: null,
      choices: null,
      transcript: [],
      controls: { can_advance: false, awaiting_choice: false },
    },
  };
}

export class StoryError extends Error {
  constructor(code, message, details = []) {
    super(message);
    this.name = 'StoryError';
    this.code = code;
    this.details = details;
  }
}
