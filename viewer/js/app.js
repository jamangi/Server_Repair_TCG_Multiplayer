import { mountLibrary, unmountLibrary } from './library-view.js';
import { createSfxService } from './sfx-service.mjs';

const appRoot = document.querySelector('#app');
const announcer = document.querySelector('#announcer');
const libraryTab = document.querySelector('#library-tab');
const playTab = document.querySelector('#play-tab');
const settingsTrigger = document.querySelector('#settings-trigger');
const sfx = createSfxService({ initialVolumePercent: 0 });
sfx.start();

let activeRoute = null;
let activeArea = null;
let playModule = null;
let navigationToken = 0;
let restoringHash = false;

function announce(message) {
  announcer.textContent = '';
  requestAnimationFrame(() => { announcer.textContent = message; });
}

function normalizeRoute(hash = location.hash) {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  const path = raw.startsWith('/') ? raw : `/${raw}`;
  if (!raw || path === '/') return { hash: '#/library', area: 'library', name: 'library', params: {} };
  if (path === '/library') return { hash: '#/library', area: 'library', name: 'library', params: {} };
  const libraryRecord = path.match(/^\/library\/([a-z0-9._-]+)$/);
  if (libraryRecord) return {
    hash: `#/library/${libraryRecord[1]}`,
    area: 'library',
    name: 'library',
    params: { recordId: libraryRecord[1] },
  };
  if (path === '/play/home') return { hash: '#/play/home', area: 'play', name: 'home', params: {} };
  if (path === '/play/decks') return { hash: '#/play/decks', area: 'play', name: 'decks', params: {} };
  const deckEditor = path.match(/^\/play\/decks\/([a-z0-9._-]+)\/edit$/);
  if (deckEditor) return {
    hash: `#/play/decks/${deckEditor[1]}/edit`,
    area: 'play',
    name: 'deck-edit',
    params: { deckId: deckEditor[1] },
  };
  if (path === '/play/profile') return { hash: '#/play/profile', area: 'play', name: 'profile', params: {} };
  if (path === '/play/story') return { hash: '#/play/story', area: 'play', name: 'story', params: {} };
  if (path === '/play/story/scene') return { hash: '#/play/story/scene', area: 'play', name: 'story-scene', params: {} };
  if (path === '/play/game') return { hash: '#/play/game', area: 'play', name: 'game', params: {} };
  return { hash: '#/library', area: 'library', name: 'library', params: {}, replacedInvalid: true };
}

async function ensurePlayModule() {
  playModule ||= await import('./play/play-app.mjs');
  return playModule;
}

function updateChrome(route) {
  if (route.area === 'library') libraryTab.setAttribute('aria-current', 'page');
  else libraryTab.removeAttribute('aria-current');
  if (route.area === 'play') playTab.setAttribute('aria-current', 'page');
  else playTab.removeAttribute('aria-current');
  settingsTrigger.hidden = route.area !== 'play';
  document.body.dataset.area = route.area;
  const titles = {
    library: 'Domain Library',
    home: 'Shift Home',
    decks: 'Decks',
    'deck-edit': 'Deck Editor',
    profile: 'Profile',
    story: 'Story',
    'story-scene': 'Story Scene',
    game: 'Solo Repair',
  };
  document.title = `${titles[route.name] || 'Server Repair'} · Server Repair`;
}

async function routeApplication() {
  if (restoringHash) {
    restoringHash = false;
    return;
  }
  const next = normalizeRoute();
  if (next.replacedInvalid || location.hash !== next.hash) {
    history.replaceState(null, '', next.hash);
  }

  if (activeRoute && activeRoute.hash !== next.hash && activeArea === 'play' && playModule?.confirmNavigation) {
    const allowed = await playModule.confirmNavigation(next);
    if (!allowed) {
      restoringHash = true;
      location.hash = activeRoute.hash;
      return;
    }
  }

  const token = ++navigationToken;
  updateChrome(next);
  appRoot.setAttribute('aria-busy', 'true');

  try {
    if (next.area === 'library') {
      if (activeArea === 'play') playModule?.unmountPlay?.();
      if (activeArea === 'library') unmountLibrary();
      await mountLibrary(appRoot, { announce, route: next });
    } else {
      if (activeArea === 'library') unmountLibrary();
      const module = await ensurePlayModule();
      if (token !== navigationToken) return;
      await module.mountPlay(appRoot, {
        route: next,
        announce,
        navigate: (hash) => { location.hash = hash; },
      });
    }
    if (token !== navigationToken) return;
    activeRoute = next;
    activeArea = next.area;
    appRoot.removeAttribute('aria-busy');
    appRoot.focus({ preventScroll: true });
  } catch (error) {
    console.error(error);
    appRoot.removeAttribute('aria-busy');
    appRoot.innerHTML = `<section class="route-error" role="alert"><p class="eyebrow">Client error</p><h1>This area could not be opened</h1><p>${String(error.message || error)}</p><p>Library access remains available from the top navigation.</p></section>`;
    announce('The requested area could not be opened.');
  }
}

settingsTrigger.addEventListener('click', async () => {
  if (activeArea !== 'play') return;
  const module = await ensurePlayModule();
  module.openSettings?.();
});

libraryTab.addEventListener('click', (event) => {
  if (activeArea === 'library') event.preventDefault();
});

playTab.addEventListener('click', (event) => {
  if (activeArea === 'play') event.preventDefault();
});

window.addEventListener('hashchange', routeApplication);
window.addEventListener('beforeunload', (event) => {
  if (!playModule?.hasUnsafeExit?.()) return;
  event.preventDefault();
  event.returnValue = '';
});

await Promise.all([
  routeApplication(),
  ensurePlayModule()
    .then((module) => module.connectSfxService?.(sfx))
    .catch(() => {}),
]);
