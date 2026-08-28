import test from 'node:test';
import assert from 'node:assert/strict';

import { SFX_INTERACTIONS, SFX_RECIPES } from '../viewer/generated/sfx/catalog.mjs';
import {
  createSfxService,
  createWebAudioAdapter,
  validateRuntimeSfxCatalog,
} from '../viewer/js/sfx-service.mjs';

class FakeDocument {
  constructor() { this.listeners = new Map(); }
  addEventListener(type, listener) {
    const listeners = this.listeners.get(type) ?? [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }
  removeEventListener(type, listener) {
    this.listeners.set(type, (this.listeners.get(type) ?? []).filter((candidate) => candidate !== listener));
  }
  dispatch(type, event) {
    for (const listener of this.listeners.get(type) ?? []) listener(event);
  }
}

class FakeElement {
  constructor({ token = '', kind = 'button', disabled = false, attributes = {}, dismissal = null } = {}) {
    this.token = token;
    this.kind = kind;
    this.disabled = disabled;
    this.attributes = attributes;
    this.dismissal = dismissal;
  }
  closest(selector) {
    if (this.token && selector.includes(this.token)) return this;
    if (this.kind === 'button' && selector.startsWith('button:not')) return this;
    if (this.kind === 'button' && selector === 'button, a[href], select, input, summary') return this;
    if (this.disabled && selector.includes('button:disabled')) return this;
    return null;
  }
  matches(selector) {
    if (selector === 'dialog') return this.kind === 'dialog';
    if (selector.includes(':disabled') || selector.includes('[aria-disabled')) return this.disabled;
    if (selector === 'a[href]') return this.kind === 'a';
    return false;
  }
  getAttribute(name) { return this.attributes[name] ?? null; }
  querySelector(selector) { return this.dismissal?.closest(selector) ? this.dismissal : null; }
  get hash() { return this.attributes.hash ?? ''; }
}

function fakeEvent(target, overrides = {}) {
  return {
    target,
    relatedTarget: null,
    isTrusted: true,
    pointerType: 'mouse',
    key: '',
    metaKey: false,
    ctrlKey: false,
    altKey: false,
    shiftKey: false,
    ...overrides,
  };
}

function fakeAudioAdapter() {
  const active = [];
  const calls = { unlock: [], gains: [], plays: [], stops: 0, disposed: 0, active };
  return {
    calls,
    async unlock(gain) { calls.unlock.push(gain); return true; },
    setMasterGain(gain) { calls.gains.push(gain); },
    play(recipe, options) {
      calls.plays.push(recipe.id);
      const voice = {
        stop() {
          calls.stops += 1;
          options.onEnded();
        },
        finish() { options.onEnded(); },
      };
      active.push(voice);
      return voice;
    },
    stopAll() { active.splice(0).forEach((voice) => voice.stop()); },
    async dispose() { calls.disposed += 1; },
  };
}

test('catalog precedence emits one primary cue and per-recipe polyphony stays bounded', async () => {
  const precedenceDocument = new FakeDocument();
  const precedenceAdapter = fakeAudioAdapter();
  const popupRule = structuredClone(SFX_INTERACTIONS.find((interaction) => interaction.id === 'settings.open'));
  const fallbackRule = {
    ...structuredClone(SFX_INTERACTIONS.find((interaction) => interaction.id === 'play.route.fallback')),
    id: 'test.fallback',
    selector: popupRule.selector,
  };
  const precedenceService = createSfxService({
    documentRef: precedenceDocument,
    windowRef: { Element: FakeElement, location: { hash: '#/play/home' } },
    audioAdapter: precedenceAdapter,
    interactions: [fallbackRule, popupRule],
    initialVolumePercent: 40,
  });
  precedenceService.start();
  const openSettings = new FakeElement({ token: '[data-open-settings]' });
  precedenceDocument.dispatch('pointerdown', fakeEvent(openSettings));
  await Promise.resolve();
  precedenceDocument.dispatch('click', fakeEvent(openSettings));
  assert.deepEqual(precedenceAdapter.calls.plays, ['sfx.popup.open'], 'Popup Open supersedes lower-priority selection');
  await precedenceService.destroy();

  const polyphonyAdapter = fakeAudioAdapter();
  let now = 100;
  const mixInteraction = {
    ...structuredClone(SFX_INTERACTIONS.find((interaction) => interaction.id === 'shell.navigation')),
    id: 'test.polyphony',
    selector: '[data-polyphony]',
    cooldown_ms: 0,
    overlap_policy: 'mix',
  };
  const polyphonyService = createSfxService({
    documentRef: new FakeDocument(),
    windowRef: { Element: FakeElement, location: { hash: '#/library' } },
    audioAdapter: polyphonyAdapter,
    interactions: [mixInteraction],
    clock: () => now,
    initialVolumePercent: 40,
  });
  const trusted = fakeEvent(new FakeElement({ token: '[data-polyphony]' }));
  await polyphonyService.playInteraction('test.polyphony', { trustedEvent: trusted });
  now += 1;
  await polyphonyService.playInteraction('test.polyphony');
  now += 1;
  await polyphonyService.playInteraction('test.polyphony');
  assert.equal(polyphonyAdapter.calls.plays.length, 3);
  assert.equal(polyphonyAdapter.calls.stops, 1, 'the third Select voice interrupts the oldest at the recipe limit of two');
  await polyphonyService.destroy();
});

test('runtime catalog is bounded and the shared service unlocks without catch-up', async () => {
  assert.equal(validateRuntimeSfxCatalog(), true);
  const baseRecipe = structuredClone(SFX_RECIPES[0]);
  assert.throws(
    () => validateRuntimeSfxCatalog({ recipes: [{ ...baseRecipe, unknown: true }] }),
    /Unknown or missing field/,
  );
  assert.throws(
    () => validateRuntimeSfxCatalog({ recipes: [{ ...baseRecipe, filter: { ...baseRecipe.filter, type: 'peaking' } }] }),
    /Invalid filter/,
  );
  assert.throws(
    () => validateRuntimeSfxCatalog({ recipes: [{ ...baseRecipe, delay: { ...baseRecipe.delay, feedback: 0.9 } }] }),
    /Invalid delay/,
  );
  assert.throws(
    () => validateRuntimeSfxCatalog({ recipes: [{ ...baseRecipe, sources: [{ ...baseRecipe.sources[0], type: 'sawtooth' }] }] }),
    /Invalid source/,
  );
  const documentRef = new FakeDocument();
  const adapter = fakeAudioAdapter();
  let now = 1_000;
  const windowRef = { Element: FakeElement, location: { hash: '#/play/home' } };
  const service = createSfxService({
    documentRef,
    windowRef,
    audioAdapter: adapter,
    clock: () => now,
    initialVolumePercent: 40,
  });
  service.start();

  const close = new FakeElement({ token: '[data-close-settings]' });
  documentRef.dispatch('pointerdown', fakeEvent(close));
  await Promise.resolve();
  assert.equal(service.isUnlocked(), true);
  assert.deepEqual(adapter.calls.plays, [], 'the unlock gesture is never replayed');

  documentRef.dispatch('click', fakeEvent(close));
  assert.deepEqual(adapter.calls.plays, ['sfx.cancel.mechanical']);
  documentRef.dispatch('click', fakeEvent(close));
  assert.equal(adapter.calls.plays.length, 1, 'cooldown deduplicates the family');
  now += 100;
  documentRef.dispatch('click', fakeEvent(close));
  assert.equal(adapter.calls.plays.length, 2);

  now += 100;
  const dialog = new FakeElement({ kind: 'dialog', dismissal: close });
  documentRef.dispatch('cancel', fakeEvent(dialog));
  assert.equal(adapter.calls.plays.length, 3, 'trusted Escape dismissal uses the dialog close semantic');

  service.setVolumePercent(0);
  assert.equal(service.getVolumePercent(), 0);
  assert.ok(adapter.calls.stops >= 1);
  now += 100;
  documentRef.dispatch('click', fakeEvent(close));
  assert.equal(adapter.calls.plays.length, 3, '0 is fully off');

  await service.destroy();
  assert.equal(adapter.calls.disposed, 1);
  assert.equal(documentRef.listeners.get('click').length, 0);
});

test('Preview can unlock from an explicit trusted gesture while slider input stays silent', async () => {
  const documentRef = new FakeDocument();
  const adapter = fakeAudioAdapter();
  const service = createSfxService({
    documentRef,
    windowRef: { Element: FakeElement, location: { hash: '#/play/home' } },
    audioAdapter: adapter,
    initialVolumePercent: 0,
  });
  service.start();
  const slider = new FakeElement({ token: '#settings-sfx-volume', kind: 'input' });
  const sliderEvent = fakeEvent(slider, { pointerType: 'touch' });
  documentRef.dispatch('input', sliderEvent);
  assert.deepEqual(adapter.calls.plays, []);
  assert.deepEqual(adapter.calls.unlock, []);

  const preview = new FakeElement({ token: '[data-preview-sfx]' });
  const previewEvent = fakeEvent(preview);
  const played = await service.playInteraction('settings.volume.preview', {
    trustedEvent: previewEvent,
    volumeOverride: 100,
  });
  assert.equal(played, true);
  assert.deepEqual(adapter.calls.unlock, [0.32]);
  assert.deepEqual(adapter.calls.plays, ['sfx.select.confirm']);
  assert.equal(service.getVolumePercent(), 0, 'Preview does not persist or apply the unsaved value');
});

test('mouse entry and deliberate Tab focus cue once; touch and programmatic focus remain silent', async () => {
  const documentRef = new FakeDocument();
  const adapter = fakeAudioAdapter();
  let now = 500;
  const service = createSfxService({
    documentRef,
    windowRef: { Element: FakeElement, location: { hash: '#/library' } },
    audioAdapter: adapter,
    clock: () => now,
    initialVolumePercent: 40,
  });
  service.start();
  const control = new FakeElement();
  documentRef.dispatch('pointerdown', fakeEvent(control));
  await Promise.resolve();

  documentRef.dispatch('pointerover', fakeEvent(control, { pointerType: 'touch' }));
  assert.deepEqual(adapter.calls.plays, []);
  documentRef.dispatch('pointerover', fakeEvent(control, { pointerType: 'mouse' }));
  assert.deepEqual(adapter.calls.plays, ['sfx.cursor.mechanical']);
  adapter.calls.active[0].finish();

  const nextControl = new FakeElement();
  now += 100;
  documentRef.dispatch('keydown', fakeEvent(nextControl, { key: 'Tab' }));
  await Promise.resolve();
  documentRef.dispatch('focusin', fakeEvent(nextControl));
  assert.deepEqual(adapter.calls.plays, ['sfx.cursor.mechanical', 'sfx.cursor.rise']);
  now += 100;
  documentRef.dispatch('focusin', fakeEvent(new FakeElement(), { isTrusted: false }));
  assert.equal(adapter.calls.plays.length, 2);
});

class FakeAudioParam {
  constructor() { this.value = 0; this.events = []; }
  setValueAtTime(value, time) { this.value = value; this.events.push(['set', value, time]); }
  linearRampToValueAtTime(value, time) { this.events.push(['linear', value, time]); }
  exponentialRampToValueAtTime(value, time) { this.events.push(['exponential', value, time]); }
  setTargetAtTime(value, time, constant) { this.events.push(['target', value, time, constant]); }
  cancelScheduledValues(time) { this.events.push(['cancel', time]); }
}

class FakeAudioNode {
  constructor(kind) {
    this.kind = kind;
    this.connections = [];
    this.disconnected = false;
    this.gain = new FakeAudioParam();
    this.frequency = new FakeAudioParam();
    this.Q = new FakeAudioParam();
    this.delayTime = new FakeAudioParam();
  }
  connect(target) { this.connections.push(target); return target; }
  disconnect() { this.disconnected = true; }
  start() { this.started = true; }
  stop() { this.stopped = true; }
}

test('Web Audio adapter uses recipe parameters, creates one context, and disconnects every voice node', async () => {
  const contexts = [];
  const timers = [];
  class FakeAudioContext {
    constructor() {
      this.state = 'suspended';
      this.currentTime = 2;
      this.sampleRate = 8_000;
      this.destination = new FakeAudioNode('destination');
      this.nodes = [];
      contexts.push(this);
    }
    node(kind) { const node = new FakeAudioNode(kind); this.nodes.push(node); return node; }
    createGain() { return this.node('gain'); }
    createBiquadFilter() { return this.node('filter'); }
    createDelay() { return this.node('delay'); }
    createOscillator() { return this.node('oscillator'); }
    createBufferSource() { return this.node('buffer-source'); }
    createBuffer(channels, frames) {
      const data = new Float32Array(frames);
      return { channels, frames, getChannelData: () => data };
    }
    async resume() { this.state = 'running'; }
    async close() { this.state = 'closed'; }
  }
  let noiseSamples = 0;
  const windowRef = {
    AudioContext: FakeAudioContext,
    setTimeout(callback) { timers.push(callback); return timers.length; },
    clearTimeout() {},
  };
  const adapter = createWebAudioAdapter({
    windowRef,
    noiseSource: () => { noiseSamples += 1; return 0.25; },
  });
  assert.equal(await adapter.unlock(0.1), true);
  assert.equal(await adapter.unlock(0.2), true);
  assert.equal(contexts.length, 1, 'one adapter owns at most one AudioContext');

  const cancel = SFX_RECIPES.find((recipe) => recipe.id === 'sfx.cancel.mechanical');
  const confirm = SFX_RECIPES.find((recipe) => recipe.id === 'sfx.select.confirm');
  assert.ok(adapter.play(cancel));
  assert.ok(adapter.play(confirm));
  const context = contexts[0];
  assert.ok(noiseSamples > 0, 'seedable noise source populated the short buffer');
  assert.ok(context.nodes.some((node) => node.kind === 'filter' && node.type === cancel.filter.type));
  assert.ok(context.nodes.some((node) => node.kind === 'delay'));
  assert.ok(context.nodes.some((node) => node.kind === 'oscillator'
    && node.frequency.events.some((event) => event[0] === 'exponential')));
  assert.ok(context.nodes.some((node) => node.kind === 'gain'
    && node.gain.events.some((event) => event[0] === 'linear')));

  timers.splice(0).forEach((callback) => callback());
  await adapter.dispose();
  assert.ok(context.nodes.every((node) => node.disconnected), 'voice and master nodes are disconnected by cleanup/disposal');
  assert.equal(context.state, 'closed');
});

test('unsupported audio capability fails silently', async () => {
  const documentRef = new FakeDocument();
  const service = createSfxService({
    documentRef,
    windowRef: { Element: FakeElement, location: { hash: '#/library' } },
    initialVolumePercent: 40,
  });
  service.start();
  const control = new FakeElement();
  assert.doesNotThrow(() => documentRef.dispatch('pointerdown', fakeEvent(control)));
  await Promise.resolve();
  assert.equal(service.isUnlocked(), false);
  assert.equal(await service.playInteraction('shell.navigation'), false);
  await service.destroy();
});
