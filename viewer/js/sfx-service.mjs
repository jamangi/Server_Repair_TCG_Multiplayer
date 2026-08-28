import {
  SFX_INTERACTIONS,
  SFX_RECIPES,
  SFX_RUNTIME_POLICY,
} from '../generated/sfx/catalog.mjs';

const INTENT_ORDER = Object.freeze({
  ERROR: 8,
  CANCEL: 7,
  POPUP_OPEN: 6,
  POPUP_CLOSE: 5,
  SWIPE: 4,
  SELECT: 3,
  CURSOR: 2,
  NO_SFX: 1,
});
const CLICK_OWNERS = new Set(['click', 'change', 'input', 'custom', 'none']);
const RECIPE_FIELDS = [
  'id', 'family', 'duration_ms', 'attack_ms', 'release_ms', 'filter', 'delay',
  'gain_trim', 'maximum_simultaneous_voices', 'interruption_group', 'sources',
];
const INTERACTION_FIELDS = [
  'id', 'intent', 'inputs', 'priority', 'cooldown_ms', 'dedupe_group',
  'overlap_policy', 'event_type', 'selector', 'recipe_id',
];
const FILTER_FIELDS = ['type', 'frequency_hz', 'q'];
const DELAY_FIELDS = ['time_ms', 'wet_mix', 'feedback'];
const SOURCE_FIELDS = ['type', 'gain', 'start_frequency_hz', 'end_frequency_hz'];
const FILTER_TYPES = new Set(['highpass', 'lowpass', 'bandpass']);
const SOURCE_TYPES = new Set(['noise', 'sine', 'square', 'triangle']);
const INPUT_TYPES = new Set(['mouse', 'keyboard', 'touch', 'programmatic']);
const EVENT_TYPES = new Set(['click', 'change', 'input', 'pointerover', 'focusin', 'drop', 'custom', 'none']);
const NOOP_PRESSED_INTERACTIONS = new Set([
  'shell.navigation', 'library.tabs', 'decks.primary.controls', 'profile.icon.select',
  'game.ticket.select', 'game.bench.controls',
]);

function assertVolume(value) {
  if (!Number.isInteger(value) || value < 0 || value > 100) {
    throw new TypeError('SFX volume must be an integer from 0 through 100.');
  }
  return value;
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function safeDisconnect(node) {
  try { node?.disconnect?.(); } catch { /* Nodes may already be disconnected. */ }
}

function hasExactFields(value, fields) {
  return value && typeof value === 'object' && !Array.isArray(value)
    && Object.keys(value).length === fields.length
    && fields.every((field) => Object.hasOwn(value, field));
}

function finiteInRange(value, minimum, maximum) {
  return Number.isFinite(value) && value >= minimum && value <= maximum;
}

export function validateRuntimeSfxCatalog({
  recipes = SFX_RECIPES,
  interactions = SFX_INTERACTIONS,
  policy = SFX_RUNTIME_POLICY,
} = {}) {
  if (!Number.isInteger(policy.global_max_voices) || policy.global_max_voices < 1 || policy.global_max_voices > 16) {
    throw new TypeError('SFX global voice limit is invalid.');
  }
  const recipeIds = new Set();
  for (const recipe of recipes) {
    if (!hasExactFields(recipe, RECIPE_FIELDS)) throw new TypeError(`Unknown or missing field in SFX recipe ${recipe?.id ?? '(unknown)'}.`);
    if (recipeIds.has(recipe.id)) throw new TypeError(`Duplicate SFX recipe ${recipe.id}.`);
    recipeIds.add(recipe.id);
    if (!Object.hasOwn(INTENT_ORDER, recipe.family)) throw new TypeError(`Unknown SFX family ${recipe.family}.`);
    if (!finiteInRange(recipe.duration_ms, 10, 250)) throw new TypeError(`Invalid duration for ${recipe.id}.`);
    if (!finiteInRange(recipe.attack_ms, 0, Math.min(30, recipe.duration_ms))) throw new TypeError(`Invalid attack for ${recipe.id}.`);
    if (!finiteInRange(recipe.release_ms, Number.MIN_VALUE, recipe.duration_ms)) throw new TypeError(`Invalid release for ${recipe.id}.`);
    if (!Array.isArray(recipe.sources) || recipe.sources.length < 1 || recipe.sources.length > 3) throw new TypeError(`Invalid sources for ${recipe.id}.`);
    if (!finiteInRange(recipe.gain_trim, Number.MIN_VALUE, 1)) throw new TypeError(`Invalid gain for ${recipe.id}.`);
    if (!hasExactFields(recipe.filter, FILTER_FIELDS) || !FILTER_TYPES.has(recipe.filter.type)
        || !finiteInRange(recipe.filter.frequency_hz, 20, 20_000)
        || !finiteInRange(recipe.filter.q, 0.01, 20)) throw new TypeError(`Invalid filter for ${recipe.id}.`);
    if (!hasExactFields(recipe.delay, DELAY_FIELDS)
        || !finiteInRange(recipe.delay.time_ms, 0, 100)
        || !finiteInRange(recipe.delay.wet_mix, 0, 0.3)
        || !finiteInRange(recipe.delay.feedback, 0, 0.25)) throw new TypeError(`Invalid delay for ${recipe.id}.`);
    for (const source of recipe.sources) {
      if (!hasExactFields(source, SOURCE_FIELDS) || !SOURCE_TYPES.has(source.type)
          || !finiteInRange(source.gain, Number.MIN_VALUE, 1)
          || !finiteInRange(source.start_frequency_hz, 0, 20_000)
          || !finiteInRange(source.end_frequency_hz, 0, 20_000)
          || (source.type === 'noise' && (source.start_frequency_hz !== 0 || source.end_frequency_hz !== 0))
          || (source.type !== 'noise' && (source.start_frequency_hz < 20 || source.end_frequency_hz < 20))) {
        throw new TypeError(`Invalid source for ${recipe.id}.`);
      }
    }
    if (!Number.isInteger(recipe.maximum_simultaneous_voices)
        || recipe.maximum_simultaneous_voices < 1
        || recipe.maximum_simultaneous_voices > policy.global_max_voices
        || recipe.maximum_simultaneous_voices !== policy.family_max_voices[recipe.family]) {
      throw new TypeError(`Invalid voice limit for ${recipe.id}.`);
    }
    if (typeof recipe.interruption_group !== 'string' || !recipe.interruption_group
        || recipe.interruption_group !== policy.interruption_groups[recipe.family]) {
      throw new TypeError(`Invalid interruption group for ${recipe.id}.`);
    }
  }
  const interactionIds = new Set();
  for (const interaction of interactions) {
    if (!hasExactFields(interaction, INTERACTION_FIELDS)) throw new TypeError(`Unknown or missing field in SFX interaction ${interaction?.id ?? '(unknown)'}.`);
    if (interactionIds.has(interaction.id)) throw new TypeError(`Duplicate SFX interaction ${interaction.id}.`);
    interactionIds.add(interaction.id);
    if (!Object.hasOwn(INTENT_ORDER, interaction.intent)) throw new TypeError(`Unknown SFX intent ${interaction.intent}.`);
    if (interaction.intent === 'NO_SFX' && interaction.recipe_id !== null) throw new TypeError(`${interaction.id} must be silent.`);
    if (interaction.intent !== 'NO_SFX' && !recipeIds.has(interaction.recipe_id)) throw new TypeError(`${interaction.id} references an unavailable recipe.`);
    if (!Array.isArray(interaction.inputs) || interaction.inputs.length < 1 || interaction.inputs.some((input) => !INPUT_TYPES.has(input))) throw new TypeError(`Invalid inputs for ${interaction.id}.`);
    if (!EVENT_TYPES.has(interaction.event_type)) throw new TypeError(`Invalid event type for ${interaction.id}.`);
    if (!Number.isInteger(interaction.priority) || interaction.priority < 0 || interaction.priority > 100) throw new TypeError(`Invalid priority for ${interaction.id}.`);
    if (!Number.isInteger(interaction.cooldown_ms) || interaction.cooldown_ms < 0 || interaction.cooldown_ms > 1_000) throw new TypeError(`Invalid cooldown for ${interaction.id}.`);
    if (typeof interaction.dedupe_group !== 'string' || !interaction.dedupe_group) throw new TypeError(`Invalid dedupe group for ${interaction.id}.`);
    if (!['drop', 'interrupt', 'mix', 'none'].includes(interaction.overlap_policy)) throw new TypeError(`Invalid overlap policy for ${interaction.id}.`);
    if (interaction.selector !== null && typeof interaction.selector !== 'string') throw new TypeError(`Invalid selector for ${interaction.id}.`);
  }
  return true;
}

export function createWebAudioAdapter({
  windowRef = globalThis,
  noiseSource = () => Math.random() * 2 - 1,
} = {}) {
  let context = null;
  let master = null;
  let gainValue = 0;
  const activeVoices = new Set();
  const schedule = windowRef.setTimeout?.bind(windowRef) ?? setTimeout;
  const cancelSchedule = windowRef.clearTimeout?.bind(windowRef) ?? clearTimeout;

  function ensureContext() {
    if (context) return context;
    const AudioContextConstructor = windowRef.AudioContext ?? windowRef.webkitAudioContext;
    if (typeof AudioContextConstructor !== 'function') return null;
    context = new AudioContextConstructor();
    master = context.createGain();
    master.gain.value = gainValue;
    master.connect(context.destination);
    return context;
  }

  async function unlock(nextGain) {
    gainValue = clamp(nextGain, 0, 0.32);
    const activeContext = ensureContext();
    if (!activeContext) return false;
    master.gain.setValueAtTime(gainValue, activeContext.currentTime);
    if (activeContext.state === 'suspended') {
      try { await activeContext.resume(); } catch { return false; }
    }
    return activeContext.state === 'running';
  }

  function setMasterGain(nextGain) {
    gainValue = clamp(nextGain, 0, 0.32);
    if (!context || !master) return;
    master.gain.cancelScheduledValues(context.currentTime);
    master.gain.setTargetAtTime(gainValue, context.currentTime, 0.008);
  }

  function play(recipe, { onEnded = () => {} } = {}) {
    if (!context || context.state !== 'running' || !master || gainValue <= 0) return null;
    const start = context.currentTime;
    const duration = recipe.duration_ms / 1000;
    const attack = Math.min(duration, recipe.attack_ms / 1000);
    const releaseStart = Math.max(start + attack, start + duration - (recipe.release_ms / 1000));
    const end = start + duration;
    const nodes = [];
    const sources = [];
    let finished = false;
    let timer = null;

    const filter = context.createBiquadFilter();
    filter.type = recipe.filter.type;
    filter.frequency.setValueAtTime(recipe.filter.frequency_hz, start);
    filter.Q.setValueAtTime(recipe.filter.q, start);
    nodes.push(filter);

    const envelope = context.createGain();
    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.linearRampToValueAtTime(recipe.gain_trim, start + attack);
    envelope.gain.setValueAtTime(recipe.gain_trim, releaseStart);
    envelope.gain.exponentialRampToValueAtTime(0.0001, end);
    nodes.push(envelope);
    filter.connect(envelope);

    const dry = context.createGain();
    dry.gain.setValueAtTime(1 - recipe.delay.wet_mix, start);
    envelope.connect(dry);
    dry.connect(master);
    nodes.push(dry);

    if (recipe.delay.wet_mix > 0 && recipe.delay.time_ms > 0) {
      const delay = context.createDelay(0.2);
      const wet = context.createGain();
      const feedback = context.createGain();
      delay.delayTime.setValueAtTime(recipe.delay.time_ms / 1000, start);
      wet.gain.setValueAtTime(recipe.delay.wet_mix, start);
      feedback.gain.setValueAtTime(recipe.delay.feedback, start);
      envelope.connect(delay);
      delay.connect(wet);
      wet.connect(master);
      delay.connect(feedback);
      feedback.connect(delay);
      nodes.push(delay, wet, feedback);
    }

    const cleanup = () => {
      if (finished) return;
      finished = true;
      if (timer !== null) cancelSchedule(timer);
      for (const source of sources) safeDisconnect(source);
      for (const node of nodes) safeDisconnect(node);
      activeVoices.delete(voice);
      onEnded();
    };
    const voice = {
      stop() {
        if (finished) return;
        for (const source of sources) {
          try { source.stop(); } catch { /* A completed source cannot be stopped twice. */ }
        }
        cleanup();
      },
    };

    recipe.sources.forEach((sourceDefinition, sourceIndex) => {
      const sourceGain = context.createGain();
      sourceGain.gain.setValueAtTime(sourceDefinition.gain, start);
      sourceGain.connect(filter);
      nodes.push(sourceGain);
      let source;
      if (sourceDefinition.type === 'noise') {
        const frameCount = Math.max(1, Math.ceil(context.sampleRate * duration));
        const buffer = context.createBuffer(1, frameCount, context.sampleRate);
        const channel = buffer.getChannelData(0);
        for (let index = 0; index < frameCount; index += 1) {
          const sample = Number(noiseSource({ recipeId: recipe.id, sourceIndex, sampleIndex: index }));
          channel[index] = clamp(Number.isFinite(sample) ? sample : 0, -1, 1);
        }
        source = context.createBufferSource();
        source.buffer = buffer;
      } else {
        source = context.createOscillator();
        source.type = sourceDefinition.type;
        source.frequency.setValueAtTime(sourceDefinition.start_frequency_hz, start);
        if (sourceDefinition.end_frequency_hz !== sourceDefinition.start_frequency_hz) {
          source.frequency.exponentialRampToValueAtTime(sourceDefinition.end_frequency_hz, end);
        }
      }
      source.connect(sourceGain);
      sources.push(source);
      source.start(start);
      source.stop(end);
    });

    const tailMilliseconds = recipe.duration_ms + (recipe.delay.time_ms * 3) + 30;
    timer = schedule(cleanup, tailMilliseconds);
    activeVoices.add(voice);
    return voice;
  }

  function stopAll() {
    for (const voice of [...activeVoices]) voice.stop();
  }

  async function dispose() {
    stopAll();
    safeDisconnect(master);
    if (context && context.state !== 'closed') {
      try { await context.close(); } catch { /* Failing closed is an inaudible safe state. */ }
    }
    context = null;
    master = null;
  }

  return Object.freeze({ unlock, setMasterGain, play, stopAll, dispose });
}

export function createSfxService({
  documentRef = globalThis.document,
  windowRef = globalThis,
  clock = () => globalThis.performance?.now?.() ?? Date.now(),
  noiseSource,
  audioAdapter = null,
  recipes = SFX_RECIPES,
  interactions = SFX_INTERACTIONS,
  policy = SFX_RUNTIME_POLICY,
  initialVolumePercent = 0,
} = {}) {
  validateRuntimeSfxCatalog({ recipes, interactions, policy });
  let volumePercent = assertVolume(initialVolumePercent);
  let adapter = audioAdapter;
  let started = false;
  let destroyed = false;
  let unlocked = false;
  let unlockPromise = null;
  let lastTabAt = Number.NEGATIVE_INFINITY;
  let suppressFocusUntil = Number.NEGATIVE_INFINITY;
  let lastModality = 'programmatic';
  let lastCursorControl = null;
  let voiceSequence = 0;
  const lastPlayedAt = new Map();
  const activeVoices = [];
  const recipeById = new Map(recipes.map((recipe) => [recipe.id, recipe]));
  const interactionById = new Map(interactions.map((interaction) => [interaction.id, interaction]));
  const sortedInteractions = [...interactions].sort((left, right) =>
    right.priority - left.priority || INTENT_ORDER[right.intent] - INTENT_ORDER[left.intent] || left.id.localeCompare(right.id));

  function masterGain(value = volumePercent) {
    return (value / 100) * 0.32;
  }

  function getAdapter() {
    if (!adapter) adapter = createWebAudioAdapter({ windowRef, noiseSource });
    return adapter;
  }

  async function unlock(event, candidateVolume = volumePercent) {
    if (destroyed || unlocked || !event?.isTrusted || candidateVolume <= 0) return unlocked;
    unlockPromise ||= Promise.resolve(getAdapter().unlock(masterGain(candidateVolume)))
      .then((result) => {
        unlocked = result === true;
        return unlocked;
      })
      .catch(() => false)
      .finally(() => { unlockPromise = null; });
    return unlockPromise;
  }

  function retireVoice(record) {
    const index = activeVoices.indexOf(record);
    if (index >= 0) activeVoices.splice(index, 1);
  }

  function interruptGroup(group) {
    for (const record of [...activeVoices]) {
      if (record.group !== group) continue;
      record.voice?.stop?.();
      retireVoice(record);
    }
  }

  function trimPolyphony(recipe) {
    const familyLimit = recipe.maximum_simultaneous_voices;
    const familyVoices = activeVoices.filter((record) => record.family === recipe.family);
    while (familyVoices.length >= familyLimit) {
      const oldest = familyVoices.shift();
      oldest.voice?.stop?.();
      retireVoice(oldest);
    }
    while (activeVoices.length >= policy.global_max_voices) {
      const oldest = activeVoices.shift();
      oldest.voice?.stop?.();
    }
  }

  function playRule(interaction, { volumeOverride = null } = {}) {
    const effectiveVolume = volumeOverride === null ? volumePercent : assertVolume(volumeOverride);
    if (destroyed || !unlocked || effectiveVolume === 0 || interaction.intent === 'NO_SFX') return false;
    const recipe = recipeById.get(interaction.recipe_id);
    if (!recipe) return false;
    const now = clock();
    const cooldownKey = `${interaction.dedupe_group}:${interaction.intent}`;
    const previous = lastPlayedAt.get(cooldownKey) ?? Number.NEGATIVE_INFINITY;
    if (now - previous < interaction.cooldown_ms) return false;
    lastPlayedAt.set(cooldownKey, now);
    const group = recipe.interruption_group;
    if (interaction.overlap_policy === 'interrupt') interruptGroup(group);
    else if (interaction.overlap_policy === 'drop' && activeVoices.some((record) => record.group === group)) return false;
    trimPolyphony(recipe);
    getAdapter().setMasterGain(masterGain(effectiveVolume));
    const record = { id: ++voiceSequence, family: recipe.family, group, voice: null };
    record.voice = getAdapter().play(recipe, { onEnded: () => retireVoice(record) });
    if (!record.voice) return false;
    activeVoices.push(record);
    return true;
  }

  function selectorMatch(target, selector) {
    if (!selector || typeof target?.closest !== 'function') return null;
    try { return target.closest(selector); } catch { return null; }
  }

  function isDisabled(control) {
    return Boolean(control?.matches?.(':disabled, [aria-disabled="true"]'));
  }

  function isSemanticNoop(interaction, control) {
    if (!NOOP_PRESSED_INTERACTIONS.has(interaction.id)) return false;
    return control?.getAttribute?.('aria-current') === 'page'
      || control?.getAttribute?.('aria-current') === 'true'
      || control?.getAttribute?.('aria-pressed') === 'true';
  }

  function matchingRule(target, allowedEventTypes, input = lastModality) {
    for (const interaction of sortedInteractions) {
      if (!allowedEventTypes.has(interaction.event_type)) continue;
      if (!interaction.inputs.includes(input)) continue;
      const control = selectorMatch(target, interaction.selector);
      if (!control) continue;
      return { interaction, control };
    }
    return null;
  }

  function matchingDialogDismissal(dialog) {
    if (!dialog || typeof dialog.querySelector !== 'function') return null;
    for (const interaction of sortedInteractions) {
      if (interaction.event_type !== 'click' || !['CANCEL', 'POPUP_CLOSE'].includes(interaction.intent)) continue;
      let control = null;
      try { control = interaction.selector ? dialog.querySelector(interaction.selector) : null; } catch { /* Invalid selectors fail closed. */ }
      if (control) return { interaction, control };
    }
    return null;
  }

  function onPointerDown(event) {
    lastModality = event.pointerType === 'touch' || event.pointerType === 'pen' ? 'touch' : 'mouse';
    suppressFocusUntil = clock() + 500;
    lastTabAt = Number.NEGATIVE_INFINITY;
    void unlock(event);
  }

  function onKeyDown(event) {
    if (!event.isTrusted || event.metaKey || event.ctrlKey || event.altKey) return;
    lastModality = 'keyboard';
    if (event.key === 'Tab') {
      lastTabAt = clock();
      suppressFocusUntil = Number.NEGATIVE_INFINITY;
    } else {
      suppressFocusUntil = clock() + 500;
      lastTabAt = Number.NEGATIVE_INFINITY;
    }
    if (!['Shift', 'Control', 'Alt', 'Meta'].includes(event.key)) void unlock(event);
  }

  function onFocusIn(event) {
    const now = clock();
    if (!event.isTrusted || now > lastTabAt + 500 || now < suppressFocusUntil) return;
    const match = matchingRule(event.target, new Set(['focusin', 'none']), 'keyboard');
    if (!match || isDisabled(match.control) || match.control === lastCursorControl) return;
    lastCursorControl = match.control;
    playRule(match.interaction);
  }

  function onPointerOver(event) {
    if (!event.isTrusted || event.pointerType !== 'mouse') return;
    const match = matchingRule(event.target, new Set(['pointerover', 'none']), 'mouse');
    if (!match || isDisabled(match.control)) return;
    const previousControl = typeof event.relatedTarget?.closest === 'function'
      ? event.relatedTarget.closest(match.interaction.selector)
      : null;
    if (previousControl === match.control || lastCursorControl === match.control) return;
    lastCursorControl = match.control;
    playRule(match.interaction);
  }

  function onClick(event) {
    if (!event.isTrusted) return;
    suppressFocusUntil = clock() + 500;
    if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
    const match = event.target?.matches?.('dialog')
      ? matchingDialogDismissal(event.target)
      : matchingRule(event.target, CLICK_OWNERS, lastModality);
    if (!match || match.interaction.event_type !== 'click' || isDisabled(match.control)) return;
    if (isSemanticNoop(match.interaction, match.control)) return;
    if (match.control.matches?.('a[href]') && match.control.hash && match.control.hash === windowRef.location?.hash) return;
    playRule(match.interaction);
  }

  function onCancel(event) {
    if (!event.isTrusted) return;
    lastModality = 'keyboard';
    const match = matchingDialogDismissal(event.target);
    if (!match) return;
    playRule(match.interaction);
  }

  function onChange(event) {
    if (!event.isTrusted) return;
    const match = matchingRule(event.target, new Set(['change', 'none']), lastModality);
    if (!match || match.interaction.event_type !== 'change' || isDisabled(match.control)) return;
    playRule(match.interaction);
  }

  function onInput(event) {
    if (!event.isTrusted) return;
    matchingRule(event.target, new Set(['input', 'none']), lastModality);
  }

  async function playInteraction(id, { trustedEvent = null, volumeOverride = null } = {}) {
    const interaction = interactionById.get(id);
    if (!interaction || interaction.intent === 'NO_SFX') return false;
    const candidateVolume = volumeOverride === null ? volumePercent : assertVolume(volumeOverride);
    if (!unlocked && trustedEvent) await unlock(trustedEvent, candidateVolume);
    return playRule(interaction, { volumeOverride });
  }

  function setVolumePercent(nextVolume) {
    volumePercent = assertVolume(nextVolume);
    if (adapter) adapter.setMasterGain(masterGain());
    if (volumePercent === 0) {
      adapter?.stopAll?.();
      activeVoices.splice(0, activeVoices.length);
    }
    return volumePercent;
  }

  function start() {
    if (started || destroyed || !documentRef?.addEventListener) return;
    started = true;
    documentRef.addEventListener('pointerdown', onPointerDown, true);
    documentRef.addEventListener('keydown', onKeyDown, true);
    documentRef.addEventListener('focusin', onFocusIn, true);
    documentRef.addEventListener('pointerover', onPointerOver, true);
    documentRef.addEventListener('click', onClick, true);
    documentRef.addEventListener('cancel', onCancel, true);
    documentRef.addEventListener('change', onChange, true);
    documentRef.addEventListener('input', onInput, true);
  }

  async function destroy() {
    if (destroyed) return;
    destroyed = true;
    if (started) {
      documentRef.removeEventListener('pointerdown', onPointerDown, true);
      documentRef.removeEventListener('keydown', onKeyDown, true);
      documentRef.removeEventListener('focusin', onFocusIn, true);
      documentRef.removeEventListener('pointerover', onPointerOver, true);
      documentRef.removeEventListener('click', onClick, true);
      documentRef.removeEventListener('cancel', onCancel, true);
      documentRef.removeEventListener('change', onChange, true);
      documentRef.removeEventListener('input', onInput, true);
    }
    activeVoices.splice(0).forEach((record) => record.voice?.stop?.());
    await adapter?.dispose?.();
    adapter = null;
  }

  return Object.freeze({
    start,
    destroy,
    playInteraction,
    setVolumePercent,
    getVolumePercent: () => volumePercent,
    isUnlocked: () => unlocked,
  });
}
