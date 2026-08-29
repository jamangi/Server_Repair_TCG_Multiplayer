const STATEMENT_KINDS = new Set(['SAY', 'NARRATE', 'DIALOGUE', 'NARRATION']);

const clean = (value) => typeof value === 'string' ? value.trim() : '';
const list = (value) => Array.isArray(value) ? value : [];

function textFrom(resolveText, textId, fallback = '') {
  const resolved = clean(resolveText?.(textId));
  return resolved || clean(fallback) || clean(textId);
}

export function buildStorySceneModel(display, {
  resolveText = (textId) => textId,
  resolveCharacterName = (characterId) => characterId,
  artResolver,
  transcript = [],
  pending = false,
  auto = false,
  review = null,
  error = null,
} = {}) {
  const source = display && typeof display === 'object' ? display : {};
  const scene = source.scene && typeof source.scene === 'object'
    ? source.scene
    : source.background && typeof source.background === 'object' ? source.background : {};
  const screens = source.screens && typeof source.screens === 'object' ? source.screens : {};
  const statement = screens.dialogue && typeof screens.dialogue === 'object'
    ? screens.dialogue
    : screens.statement && typeof screens.statement === 'object' ? screens.statement
    : null;
  const normalizedKind = clean(statement?.kind || statement?.type).toUpperCase();
  const kind = STATEMENT_KINDS.has(normalizedKind) ? normalizedKind : null;
  const speakerKey = clean(statement?.speaker_key);
  const controls = screens.controls && typeof screens.controls === 'object'
    ? screens.controls
    : {};
  const choiceScreen = screens.choices && typeof screens.choices === 'object'
    && !Array.isArray(screens.choices) ? screens.choices : null;
  const choices = choiceScreen ? list(choiceScreen.options).map((option) => ({
    ...option,
    choice_id: choiceScreen.choice_id,
  })) : list(screens.choices);
  const backgroundArt = artResolver?.resolveBackground(source.background) ?? null;

  return Object.freeze({
    displayVersion: clean(source.schema_version || source.display_version),
    sceneId: clean(scene.scene_id),
    location: textFrom(resolveText, scene.location_text_id, 'Story scene'),
    time: textFrom(resolveText, scene.time_text_id),
    background: backgroundArt,
    backgroundAlternative: clean(backgroundArt?.alt)
      || textFrom(resolveText, source.background?.alt_text_id),
    characters: Object.freeze(list(source.characters).map((character) => {
      const art = artResolver?.resolveCharacter(character) ?? null;
      return Object.freeze({
        tag: clean(character?.tag),
        characterId: clean(character?.character_id),
        name: textFrom(resolveText, character?.name_text_id,
          resolveCharacterName?.(character?.character_id)),
        poseId: clean(character?.pose_id),
        position: clean(character?.position).toLowerCase() || 'center',
        alternative: clean(art?.alt) || textFrom(resolveText, character?.alt_text_id),
        art,
      });
    })),
    transient: Object.freeze(list(source.transient).map((item) => {
      const art = artResolver?.resolveTransient(item) ?? null;
      return Object.freeze({
        tag: clean(item?.tag),
        position: clean(item?.position).toLowerCase() || 'center',
        alternative: clean(art?.alt) || textFrom(resolveText, item?.alt_text_id),
        art,
      });
    })),
    statement: kind ? Object.freeze({
      kind,
      statementId: clean(statement.statement_id),
      speaker: speakerKey
        ? textFrom(resolveText, statement.speaker_text_id,
          resolveCharacterName?.(speakerKey) || speakerKey)
        : '',
      text: textFrom(resolveText, statement.text_id),
      styleKey: clean(statement.style_key),
    }) : null,
    choicePrompt: choiceScreen
      ? textFrom(resolveText, choiceScreen.prompt_text_id, choiceScreen.prompt_text)
      : '',
    choices: Object.freeze(choices.map((choice) => Object.freeze({
      choiceId: clean(choice?.choice_id),
      optionId: clean(choice?.option_id),
      text: textFrom(resolveText, choice?.text_id),
    })).filter((choice) => choice.optionId && choice.text)),
    transcript: Object.freeze(list(transcript.length ? transcript : screens.transcript).map((entry) => Object.freeze({
      speaker: clean(entry?.speaker) || textFrom(resolveText, entry?.speaker_text_id,
        resolveCharacterName?.(entry?.speaker_key)),
      text: clean(entry?.text) || textFrom(resolveText, entry?.text_id),
      statementId: clean(entry?.statement_id),
    })).filter((entry) => entry.text)),
    controls: Object.freeze({
      advance: (controls.can_advance === true || controls.advance_allowed === true) && !pending,
      auto: (controls.auto_allowed !== false && !choiceScreen) && !pending,
      transcript: controls.transcript_allowed !== false,
    }),
    pending: Boolean(pending),
    auto: Boolean(auto),
    review: review?.active === true ? Object.freeze({
      active: true,
      label: clean(review.label) || 'Story episode',
    }) : null,
    error: clean(error),
  });
}

export function buildStoryHomeModel(snapshot, { activeDeck = null } = {}) {
  const source = snapshot && typeof snapshot === 'object' ? snapshot : {};
  const checkpoint = source.checkpoint && typeof source.checkpoint === 'object'
    ? source.checkpoint
    : null;
  const status = clean(source.status) || (checkpoint ? 'READY' : 'NEW');
  const interrupted = source.interrupted_match === true || status === 'INTERRUPTED_MATCH';
  const restart = source.restart_segment === true || interrupted;
  return Object.freeze({
    status,
    chapter: clean(source.chapter_title) || 'Chapter One',
    shift: clean(source.shift_title) || 'Continuity Rotation',
    checkpoint: clean(source.checkpoint_label || checkpoint?.checkpoint_id) || 'No durable checkpoint yet',
    progress: clean(source.progress_summary) || (checkpoint
      ? 'Your approved Story choices and completed Match results are stored locally.'
      : 'Begin the first shift from its authored opening.'),
    primaryLabel: interrupted
      ? 'Restart Story Match'
      : checkpoint ? (restart ? 'Restart segment' : 'Continue') : 'Begin Story',
    explanation: interrupted
      ? 'The active Match was not saved. Restart from the pre-Match Story checkpoint; this does not resume the discarded Match.'
      : restart
        ? 'This segment restarts from the last durable checkpoint; it does not resume an animation or statement.'
        : 'Story progress advances only at authored durable checkpoints.',
    canOpen: source.can_open !== false,
    activeDeck: activeDeck ? Object.freeze({
      id: clean(activeDeck.deck_id || activeDeck.id),
      name: clean(activeDeck.display_name) || clean(activeDeck.id),
      legal: activeDeck.legal !== false,
      summary: clean(activeDeck.requirement_summary),
    }) : null,
    history: Object.freeze(list(source.history).map((entry) => Object.freeze({
      id: clean(entry?.id),
      label: clean(entry?.label),
      replayable: entry?.replayable === true,
    })).filter((entry) => entry.id && entry.label)),
    reviewInterrupted: source.review_interrupted === true,
    reviewNotice: clean(source.review_notice),
    error: clean(source.error),
  });
}
