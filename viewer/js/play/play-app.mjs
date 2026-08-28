import { createArtResolver, loadArtManifest } from './art-resolver.mjs';
import { loadPlayCatalog, loadTutorialCatalog } from './catalog-service.mjs';
import { createClientDataContext } from './data/client-data.mjs';
import { SoloGameSession, preflightStoryMatch } from './game-session.mjs';
import { configureMotion, runMotion, teardownPlayDialogs } from './motion-coordinator.mjs';
import { renderDeckEditor, renderDecks } from './pages/decks-page.mjs';
import { renderGame } from './pages/game-page.mjs';
import { renderHome } from './pages/home-page.mjs';
import { renderProfile } from './pages/profile-page.mjs';
import { renderStoryHome } from './pages/story-home-page.mjs';
import { renderStoryScene } from './pages/story-scene-page.mjs';
import { closeSettingsDialog, openSettingsDialog } from './settings-dialog.mjs';
import { createStorageService } from './storage-service.mjs';
import { createStoryArtResolver, loadStoryArtManifest } from './story-art-resolver.mjs';
import { createStoryClient } from './story-client.mjs';
import { createUiContinuity } from './ui-continuity.mjs';
import { TutorialController } from './tutorial-controller.mjs';

let root = null;
let route = null;
let pageRoot = null;
let pageCleanup = null;
let catalog = null;
let tutorialCatalog = null;
let artResolver = null;
let storage = null;
let story = null;
let initializePromise = null;
let navigate = (hash) => { location.hash = hash; };
let announce = () => {};
let game = null;
let pendingStart = null;
let gameStartInitiated = false;
const continuity = createUiContinuity();

const ui = {
  selectedDeckId: null,
  editorDraft: null,
  editorOriginal: null,
  editorDirty: false,
  deckFilters: null,
  profileDraft: null,
  profileSavedId: null,
  profileDirty: false,
  storageWarning: null,
  storyPreflightNotice: null,
};

function applyMotionPreference(preference) {
  configureMotion(() => preference);
  if (root) root.dataset.motion = preference.toLowerCase();
}

function currentActiveDeck() {
  if (!storage) return null;
  const snapshot = storage.load();
  const collection = snapshot.state.records.decks;
  const deck = collection.decks.find((entry) => entry.deck_id === collection.active_deck_id) ?? null;
  return deck ? { ...deck, legal: true } : null;
}

function unavailableStory(error) {
  const message = error instanceof Error ? error.message : 'Story content is unavailable.';
  return Object.freeze({
    homeModel: () => ({
      status: 'RECOVERY_REQUIRED', chapter: 'Quiet Cascade', shift: 'Content recovery',
      checkpoint: 'No compatible checkpoint', progress: 'Other Play destinations remain available.',
      primaryLabel: 'Story unavailable', explanation: 'Story progress was not changed.', canOpen: false,
      activeDeck: currentActiveDeck(), history: [], error: message,
    }),
    sceneModel: () => ({
      displayVersion: '', sceneId: '', location: 'Story recovery', time: '', background: null,
      characters: [], transient: [], statement: null, choices: [], transcript: [],
      controls: { advance: false, auto: false, transcript: false }, pending: false,
      auto: false, error: message,
    }),
    async openPrimary() { throw new Error(message); },
    async recover() { throw new Error(message); },
    async replay() { throw new Error(message); },
    async reset() { throw new Error(message); },
    validateProgress(progress) {
      if (progress?.pack_id === null
          && progress?.content_version === null
          && progress?.checkpoint === null
          && progress?.pending_result === null
          && progress?.completed_ending_id === null) return structuredClone(progress);
      throw new Error('Story content is unavailable, so non-empty Story progress cannot be validated.');
    },
  });
}

async function initialize() {
  initializePromise ||= Promise.all([
    loadPlayCatalog(),
    loadTutorialCatalog(),
    loadArtManifest(),
    loadStoryArtManifest().catch(() => null),
  ]).then(async ([loadedCatalog, loadedTutorialCatalog, manifest, storyArtManifest]) => {
    catalog = loadedCatalog;
    tutorialCatalog = loadedTutorialCatalog;
    artResolver = createArtResolver({ manifest, domainEntities: catalog.domain.entities });
    storage = createStorageService({
      context: createClientDataContext({ cardCatalog: catalog.cards, deckCatalog: catalog.decks }),
    });
    const snapshot = storage.load();
    applyMotionPreference(snapshot.state.records.settings.motion_preference);
    try {
      story = await createStoryClient({
        playArtResolver: artResolver,
        storyArtResolver: createStoryArtResolver({
          manifest: storyArtManifest,
          playArtResolver: artResolver,
        }),
        progressStore: {
          load: () => freshSnapshot().state.records.story,
          save: (record) => storage.saveStoryProgress(record),
        },
        activeDeck: currentActiveDeck,
        announce,
        onChange() {
          if (route?.name === 'story' || route?.name === 'story-scene' || route?.name === 'game') rerender();
        },
        onStartMatch: beginStoryMatch,
      });
    } catch (error) {
      story = unavailableStory(error);
    }
    storage.setStoryImportValidator((progress) => story.validateProgress(progress));
  });
  return initializePromise;
}

function freshSnapshot() {
  return storage.load();
}

function contextForRender() {
  const snapshot = freshSnapshot();
  const activeCatalog = game?.catalog ?? catalog;
  return {
    snapshot,
    catalog: activeCatalog,
    tutorialCatalog,
    artResolver,
    storage,
    story,
    ui,
    game,
    navigate,
    announce,
    motion: runMotion,
    openSettings,
    saveSettings(next) {
      storage.saveSettings(next);
      applyMotionPreference(next.motion_preference);
    },
    beginMatch,
    beginTutorial,
    restartTutorial,
    finishGame,
    continueStory,
    refresh: contextForRender,
    refreshSnapshot: freshSnapshot,
    rerender,
  };
}

function playNavigationMarkup() {
  const links = [
    ['home', '#/play/home', 'Home'],
    ['decks', '#/play/decks', 'Decks'],
    ['profile', '#/play/profile', 'Profile'],
    ['story', '#/play/story', 'Story'],
  ];
  return `<nav class="play-subnav" aria-label="Play navigation">${links.map(([name, hash, label]) => `<a href="${hash}"${route.name === name || (name === 'story' && route.name === 'story-scene') || (name === 'decks' && route.name === 'deck-edit') ? ' aria-current="page"' : ''}>${label}</a>`).join('')}<span class="play-subnav__mode">${game?.tutorial ? 'Guided tutorial' : game?.storyContext ? 'Story Match' : 'Local solo'}</span></nav>`;
}

function renderShell() {
  teardownPlayDialogs(root);
  pageCleanup?.();
  pageCleanup = null;
  document.body.classList.toggle('active-match-layout', route?.name === 'game' && Boolean(game?.hasActiveMatch()));
  root.innerHTML = `<div class="play-shell">${playNavigationMarkup()}<div id="play-page"></div></div>`;
  pageRoot = root.querySelector('#play-page');
  const snapshot = freshSnapshot();
  if (snapshot.diagnostic) {
    const banner = document.createElement('div');
    banner.className = 'play-global-notice';
    banner.dataset.tone = snapshot.recovery_required ? 'error' : 'warning';
    banner.setAttribute('role', 'status');
    banner.textContent = snapshot.diagnostic.message;
    pageRoot.before(banner);
  }
  if (ui.storyPreflightNotice && ['decks', 'deck-edit', 'story'].includes(route.name)) {
    const banner = document.createElement('div');
    banner.className = 'play-global-notice';
    banner.dataset.tone = 'warning';
    banner.setAttribute('role', 'status');
    banner.textContent = ui.storyPreflightNotice;
    pageRoot.before(banner);
  }
}

function renderCurrent({ focus = null } = {}) {
  if (!root || !route || !storage) return;
  renderShell();
  const context = contextForRender();
  if (route.name === 'home') pageCleanup = renderHome(pageRoot, context);
  else if (route.name === 'decks') pageCleanup = renderDecks(pageRoot, context);
  else if (route.name === 'deck-edit') pageCleanup = renderDeckEditor(pageRoot, context, route.params.deckId);
  else if (route.name === 'profile') pageCleanup = renderProfile(pageRoot, context);
  else if (route.name === 'story') pageCleanup = renderStoryHome(pageRoot, context);
  else if (route.name === 'story-scene') pageCleanup = renderStoryScene(pageRoot, context);
  else if (route.name === 'game') {
    if (!game) {
      const interruptedStory = story?.homeModel?.().status === 'INTERRUPTED_MATCH';
      pageRoot.innerHTML = `<section class="play-route"><div class="game-loading"><p class="play-eyebrow">No active Match</p><h1>${interruptedStory ? 'Story Match was interrupted' : 'Start from Home'}</h1><p>Active Match state is intentionally not resumed after a reload or completed navigation away.${interruptedStory ? ' Restart from the durable pre-Match Story checkpoint.' : ''}</p><a class="play-button" href="${interruptedStory ? '#/play/story' : '#/play/home'}">${interruptedStory ? 'Restart from Story Home' : 'Return Home'}</a></div></section>`;
      pageCleanup = () => {};
    } else {
      pageCleanup = renderGame(pageRoot, context);
      startPendingGame();
    }
  }
  if (route.name !== 'game') requestAnimationFrame(() => runMotion('route', pageRoot));
  if (focus) requestAnimationFrame(() => pageRoot.querySelector(focus)?.focus({ preventScroll: true }));
}

function rerender(options = {}) {
  continuity.capture(root, { scope: route?.hash ?? 'play' });
  renderCurrent(options);
  continuity.restore(root, { scope: route?.hash ?? 'play' });
}

function createLocalId(prefix) {
  const random = globalThis.crypto?.randomUUID?.().toLowerCase()
    || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}.${random}`.replace(/[^a-z0-9._-]/g, '-');
}

function beginMatch() {
  const snapshot = freshSnapshot();
  if (snapshot.recovery_required) {
    openSettings();
    announce('Recover local data before starting a Match.');
    return;
  }
  const collection = snapshot.state.records.decks;
  const activeDeck = collection.decks.find((deck) => deck.deck_id === collection.active_deck_id);
  if (!activeDeck) {
    navigate('#/play/decks');
    announce('Choose an active legal deck before starting.');
    return;
  }
  const matchId = createLocalId('local.match');
  pendingStart = {
    match_id: matchId,
    seed: createLocalId('seed'),
    ticket_count: snapshot.state.records.settings.starting_ticket_count,
    display_name: snapshot.state.records.profile.display_name,
    deck_id: activeDeck.deck_id,
    card_definition_ids: [...activeDeck.card_definition_ids],
  };
  gameStartInitiated = false;
  game = new SoloGameSession({
    catalog,
    onChange: () => {
      if (route?.name === 'game') rerender();
    },
    onAnnounce: announce,
    onStarted: () => {
      try {
        storage.recordMatchStart(matchId);
      } catch (error) {
        ui.storageWarning = error.message;
        announce(`Match started, but local statistics could not be saved: ${error.message}`);
      }
      pendingStart = null;
    },
    onCompleted: (summary) => {
      try {
        const applied = storage.applyMatchResult(summary);
        game.resultApplied = applied.applied;
      } catch (error) {
        game.resultApplied = null;
        ui.storageWarning = error.message;
        announce(`Match completed, but the local result could not be saved: ${error.message}`);
      }
    },
  });
  navigate('#/play/game');
}

async function beginStoryMatch({ context, definition }) {
  const snapshot = freshSnapshot();
  if (snapshot.recovery_required) {
    openSettings();
    throw new Error('Recover local data before starting a Story Match.');
  }
  const activeDeck = currentActiveDeck();
  if (!activeDeck) {
    ui.storyPreflightNotice = 'Choose an active legal 30-card deck before restarting this Story Match.';
    navigate('#/play/decks');
    throw new Error(ui.storyPreflightNotice);
  }
  const preflight = await preflightStoryMatch({
    match_ref: definition.match_ref,
    card_definition_ids: [...activeDeck.card_definition_ids],
  });
  if (!preflight.ok) {
    ui.storyPreflightNotice = 'Story Match preflight could not prove the complete queue with this active deck. Select the reviewed campaign-ready deck, make it active, then restart from the pre-Match Story checkpoint.';
    navigate('#/play/decks');
    throw new Error(ui.storyPreflightNotice);
  }
  ui.storyPreflightNotice = null;
  if (game?.hasActiveMatch()) game.endSession();
  const matchId = createLocalId('local.story.match');
  pendingStart = {
    match_id: matchId,
    seed: definition.seed,
    ticket_count: definition.requested_ticket_count,
    display_name: snapshot.state.records.profile.display_name,
    deck_id: activeDeck.deck_id,
    card_definition_ids: [...activeDeck.card_definition_ids],
    story_context: structuredClone(context),
  };
  gameStartInitiated = false;
  const session = new SoloGameSession({
    catalog,
    storyContext: context,
    onChange: () => {
      if (route?.name === 'game') rerender();
    },
    onAnnounce: announce,
    onStarted: () => {
      try {
        storage.recordMatchStart(matchId);
      } catch (storageError) {
        ui.storageWarning = storageError.message;
        announce(`Story Match started, but local statistics could not be saved: ${storageError.message}`);
      }
      pendingStart = null;
    },
    onCompleted: (summary, storyResult) => {
      try {
        const applied = storage.applyMatchResult(summary);
        session.resultApplied = applied.applied;
      } catch (storageError) {
        session.resultApplied = null;
        ui.storageWarning = storageError.message;
        announce(`Match completed, but the local result could not be saved: ${storageError.message}`);
      }
      session.storyContinuationReady = false;
      if (!storyResult) {
        session.storyReturnError = 'The authoritative result did not include a valid Story return context.';
        return;
      }
      story.stageMatchResult(storyResult, session.storyContext).then(() => {
        session.storyContinuationReady = true;
        session.storyReturnError = null;
        if (route?.name === 'game') rerender();
      }).catch((storyError) => {
        session.storyContinuationReady = false;
        session.storyReturnError = storyError.message;
        announce(`The Match record was preserved, but Story did not advance: ${storyError.message}`);
        if (route?.name === 'game') rerender();
      });
    },
  });
  game = session;
  navigate('#/play/game');
}

function beginTutorial(tutorialId) {
  const snapshot = freshSnapshot();
  if (snapshot.recovery_required) {
    openSettings();
    announce('Recover local data before starting a Tutorial.');
    return;
  }
  const definition = tutorialCatalog.tutorials.tutorials.find((tutorial) => tutorial.id === tutorialId);
  const deck = tutorialCatalog.decks.decks[0];
  if (!definition || !deck) {
    announce('The requested Tutorial is not compatible with the pinned content.');
    return;
  }
  if (game?.hasActiveMatch()) game.endSession();
  const matchId = createLocalId(`local.${tutorialId.replaceAll('.', '-')}`);
  const controller = new TutorialController(definition, {
    catalog: tutorialCatalog,
    announce,
    onComplete(completedId) {
      try {
        storage.recordTutorialCompletion(completedId);
      } catch (error) {
        ui.storageWarning = error.message;
        announce(`Tutorial completed, but local progress could not be saved: ${error.message}`);
      }
    },
  });
  pendingStart = {
    match_id: matchId,
    seed: definition.seed,
    ticket_count: 1,
    display_name: snapshot.state.records.profile.display_name,
    deck_id: deck.id,
    card_definition_ids: [...deck.card_definition_ids],
    tutorial_id: definition.id,
  };
  gameStartInitiated = false;
  game = new SoloGameSession({
    catalog: tutorialCatalog,
    tutorial: controller,
    onChange: () => {
      if (route?.name === 'game') rerender();
    },
    onAnnounce: announce,
    onStarted: () => { pendingStart = null; },
    onCompleted: () => {
      game.resultApplied = true;
    },
  });
  if (route?.name === 'game') rerender();
  else navigate('#/play/game');
}

function restartTutorial(tutorialId) {
  game?.endSession();
  game = null;
  pendingStart = null;
  gameStartInitiated = false;
  beginTutorial(tutorialId);
}

function startPendingGame() {
  if (!game || !pendingStart || gameStartInitiated || game.projection || game.error) return;
  gameStartInitiated = true;
  game.start(pendingStart).catch(() => {
    if (route?.name === 'game') rerender();
  });
}

function finishGame(destination) {
  game?.endSession();
  game = null;
  pendingStart = null;
  gameStartInitiated = false;
  navigate(destination);
}

async function continueStory() {
  const session = game;
  if (!session?.storyContext || !session.storyContinuationReady || !session.storyMatchResult) return;
  session.storyContinuationReady = false;
  if (route?.name === 'game') rerender();
  try {
    await story.continueFromMatch();
    finishGame('#/play/story/scene');
  } catch (error) {
    session.storyReturnError = error.message;
    announce(`Story return failed without consuming the result: ${error.message}`);
    if (route?.name === 'game') rerender();
  }
}

function resetTransientEditors() {
  ui.selectedDeckId = null;
  ui.editorDraft = null;
  ui.editorOriginal = null;
  ui.editorDirty = false;
  ui.deckFilters = null;
  ui.profileDraft = null;
  ui.profileSavedId = null;
  ui.profileDirty = false;
}

export async function mountPlay(nextRoot, options) {
  root = nextRoot;
  route = options.route;
  navigate = options.navigate;
  announce = options.announce;
  root.classList.add('play-app');
  root.innerHTML = '<section class="route-loading" aria-busy="true"><p>Loading Solo Play…</p></section>';
  await initialize();
  applyMotionPreference(freshSnapshot().state.records.settings.motion_preference);
  renderCurrent();
}

export async function confirmNavigation(nextRoute) {
  if (route?.name === 'story-scene'
      && nextRoute.name !== 'story-scene'
      && !(nextRoute.name === 'game' && game?.storyContext)) {
    story?.reloadProgress?.({ notify: false });
  }
  if (route?.name === 'deck-edit' && nextRoute.hash !== route.hash && ui.editorDirty) {
    if (!confirm('Discard unsaved deck changes?')) return false;
    ui.editorDraft = null;
    ui.editorOriginal = null;
    ui.editorDirty = false;
  }
  if (route?.name === 'profile' && nextRoute.hash !== route.hash && ui.profileDirty) {
    if (!confirm('Discard unsaved profile changes?')) return false;
    ui.profileDraft = null;
    ui.profileSavedId = null;
    ui.profileDirty = false;
  }
  if (route?.name === 'game' && nextRoute.hash !== route.hash && game?.hasActiveMatch()) {
    if (!confirm('Leave this active Match? Match state is not saved and cannot be resumed.')) return false;
    game.endSession();
    game = null;
    pendingStart = null;
    gameStartInitiated = false;
  }
  return true;
}

export function hasUnsafeExit() {
  return Boolean(ui.editorDirty || ui.profileDirty || game?.hasActiveMatch());
}

export function openSettings() {
  if (!storage) return;
  openSettingsDialog({
    storage,
    story,
    catalog,
    refreshSnapshot: freshSnapshot,
    announce,
    motion: runMotion,
    tutorials: tutorialCatalog?.tutorials?.tutorials ?? [],
    tutorialProgress: freshSnapshot().state.records.tutorials,
    onStartTutorial(tutorialId) {
      closeSettingsDialog({ restoreFocus: false, immediate: true });
      beginTutorial(tutorialId);
    },
    onSettingsSaved(next) {
      applyMotionPreference(next.motion_preference);
      rerender();
    },
    onDataReplaced() {
      resetTransientEditors();
      story?.reloadProgress?.();
      applyMotionPreference(freshSnapshot().state.records.settings.motion_preference);
      rerender();
    },
  });
}

export function unmountPlay() {
  teardownPlayDialogs(root);
  pageCleanup?.();
  pageCleanup = null;
  closeSettingsDialog({ restoreFocus: false, immediate: true });
  if (game?.hasActiveMatch()) game.endSession();
  game = null;
  pendingStart = null;
  gameStartInitiated = false;
  root?.classList.remove('play-app');
  root?.removeAttribute('data-motion');
  document.body.classList.remove('active-match-layout');
  root = null;
  route = null;
  pageRoot = null;
}
