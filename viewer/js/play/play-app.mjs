import { createArtResolver, loadArtManifest } from './art-resolver.mjs';
import { loadPlayCatalog } from './catalog-service.mjs';
import { createClientDataContext } from './data/client-data.mjs';
import { SoloGameSession } from './game-session.mjs';
import { configureMotion, runMotion, teardownPlayDialogs } from './motion-coordinator.mjs';
import { renderDeckEditor, renderDecks } from './pages/decks-page.mjs';
import { renderGame } from './pages/game-page.mjs';
import { renderHome } from './pages/home-page.mjs';
import { renderProfile } from './pages/profile-page.mjs';
import { closeSettingsDialog, openSettingsDialog } from './settings-dialog.mjs';
import { createStorageService } from './storage-service.mjs';
import { createUiContinuity } from './ui-continuity.mjs';

let root = null;
let route = null;
let pageRoot = null;
let pageCleanup = null;
let catalog = null;
let artResolver = null;
let storage = null;
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
};

function applyMotionPreference(preference) {
  configureMotion(() => preference);
  if (root) root.dataset.motion = preference.toLowerCase();
}

async function initialize() {
  initializePromise ||= Promise.all([loadPlayCatalog(), loadArtManifest()]).then(([loadedCatalog, manifest]) => {
    catalog = loadedCatalog;
    artResolver = createArtResolver({ manifest, domainEntities: catalog.domain.entities });
    storage = createStorageService({
      context: createClientDataContext({ cardCatalog: catalog.cards, deckCatalog: catalog.decks }),
    });
    const snapshot = storage.load();
    applyMotionPreference(snapshot.state.records.settings.motion_preference);
  });
  return initializePromise;
}

function freshSnapshot() {
  return storage.load();
}

function contextForRender() {
  const snapshot = freshSnapshot();
  return {
    snapshot,
    catalog,
    artResolver,
    storage,
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
    finishGame,
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
  ];
  return `<nav class="play-subnav" aria-label="Play navigation">${links.map(([name, hash, label]) => `<a href="${hash}"${route.name === name || (name === 'decks' && route.name === 'deck-edit') ? ' aria-current="page"' : ''}>${label}</a>`).join('')}<span class="play-subnav__mode">Local solo</span></nav>`;
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
}

function renderCurrent({ focus = null } = {}) {
  if (!root || !route || !storage) return;
  renderShell();
  const context = contextForRender();
  if (route.name === 'home') pageCleanup = renderHome(pageRoot, context);
  else if (route.name === 'decks') pageCleanup = renderDecks(pageRoot, context);
  else if (route.name === 'deck-edit') pageCleanup = renderDeckEditor(pageRoot, context, route.params.deckId);
  else if (route.name === 'profile') pageCleanup = renderProfile(pageRoot, context);
  else if (route.name === 'game') {
    if (!game) {
      pageRoot.innerHTML = '<section class="play-route"><div class="game-loading"><p class="play-eyebrow">No active Match</p><h1>Start from Home</h1><p>Active Match state is intentionally not resumed after a reload or completed navigation away.</p><a class="play-button" href="#/play/home">Return Home</a></div></section>';
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
    catalog,
    refreshSnapshot: freshSnapshot,
    announce,
    motion: runMotion,
    onSettingsSaved(next) {
      applyMotionPreference(next.motion_preference);
      rerender();
    },
    onDataReplaced() {
      resetTransientEditors();
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
