import { loadAllContent } from './data-loader.js';
import {
  ENTITY_TYPE_LABELS as labels,
  ENTITY_TYPE_ORDER as order,
  categoryFor,
} from './entity-types.js';

const state = {
  records: [],
  packs: [],
  manifest: null,
  tab: 'fault',
  query: '',
  sort: 'name',
  category: '',
  openRecordId: null,
  scrollY: 0,
  loaded: false,
  error: null,
};

let loadPromise = null;
let mountedRoot = null;

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}[character]));

const displayName = (record) => record.presentation?.display_name || record.name || record.id;
const description = (record) => record.presentation?.short_description
  || record.description
  || record.education_text
  || 'No description yet.';

async function ensureContent() {
  if (!loadPromise) {
    loadPromise = loadAllContent()
      .then(({ manifest, packs, records }) => {
        state.records = records;
        state.packs = packs;
        state.manifest = manifest;
        state.loaded = true;
      })
      .catch((error) => {
        state.error = error;
        state.loaded = true;
      });
  }
  await loadPromise;
}

function categoryOptions() {
  return [...new Set(state.records
    .filter((record) => state.tab === 'everything' || record.entity_type === state.tab)
    .map(categoryFor)
    .filter(Boolean))].sort();
}

function visibleRecords() {
  let rows = state.records.filter((record) => state.tab === 'everything' || record.entity_type === state.tab);
  if (state.category) rows = rows.filter((record) => categoryFor(record) === state.category);
  if (state.query) rows = rows.filter((record) => JSON.stringify(record).toLowerCase().includes(state.query));
  const comparators = {
    name: (left, right) => displayName(left).localeCompare(displayName(right)),
    type: (left, right) => left.entity_type.localeCompare(right.entity_type)
      || displayName(left).localeCompare(displayName(right)),
    category: (left, right) => categoryFor(left).localeCompare(categoryFor(right))
      || displayName(left).localeCompare(displayName(right)),
    id: (left, right) => left.id.localeCompare(right.id),
  };
  return [...rows].sort(comparators[state.sort]);
}

function formatValue(value) {
  if (Array.isArray(value)) return `<ul>${value.map((item) => `<li>${formatValue(item)}</li>`).join('')}</ul>`;
  if (value && typeof value === 'object') return `<pre>${escapeHtml(JSON.stringify(value, null, 2))}</pre>`;
  return escapeHtml(value ?? '');
}

function detailMarkup(record) {
  const skipped = new Set(['presentation', 'source', 'entity_type', '_pack_id', '_pack_name']);
  const illustration = record.presentation?.illustration;
  return `
    <span class="library-pill">${escapeHtml(labels[record.entity_type] || record.entity_type)}</span>
    <h2 id="library-detail-title">${escapeHtml(displayName(record))}</h2>
    <p>${escapeHtml(description(record))}</p>
    ${illustration ? `<h3>Illustration</h3><p><code>${escapeHtml(illustration.asset_id)}</code><br>${escapeHtml(illustration.alt_text || '')}</p>` : ''}
    <h3>Domain data</h3>
    <table>${Object.entries(record)
    .filter(([key]) => !skipped.has(key))
    .map(([key, value]) => `<tr><th scope="row">${escapeHtml(key.replaceAll('_', ' '))}</th><td>${formatValue(value)}</td></tr>`)
    .join('')}</table>
    <p>Pack: ${escapeHtml(record._pack_name || '')}</p>`;
}

function render() {
  if (!mountedRoot) return;
  if (state.error) {
    mountedRoot.innerHTML = `
      <section class="library-error" role="alert">
        <p class="eyebrow">Library unavailable</p>
        <h1>Domain content could not be loaded</h1>
        <p>${escapeHtml(state.error.message)}</p>
        <p>Serve the viewer over HTTP; it cannot run from a <code>file://</code> address.</p>
      </section>`;
    return;
  }

  const categories = categoryOptions();
  if (!categories.includes(state.category)) state.category = '';
  const rows = visibleRecords();
  const tabLabel = state.tab === 'everything' ? 'Everything' : labels[state.tab];

  mountedRoot.innerHTML = `
    <section class="library-page" aria-labelledby="library-heading">
      <header class="library-hero">
        <div>
          <p class="eyebrow">Technical reference · read-only</p>
          <h1 id="library-heading">Domain Library</h1>
          <p>Search the faults, symptoms, components, tests, tools, commands, repairs, validations, and protocols behind the game.</p>
        </div>
        <div class="library-count" aria-label="${state.records.length} domain records"><b id="recordCount">${state.records.length}</b><span>records</span></div>
      </header>
      <section class="library-controls" aria-label="Library filters">
        <label>Search<input id="search" type="search" value="${escapeHtml(state.query)}" placeholder='Try "no POST", "DIMM", "lsblk", or "thermal"'></label>
        <label>Sort<select id="sort">
          ${[['name', 'Name'], ['type', 'Type'], ['category', 'Category'], ['id', 'Stable ID']]
    .map(([value, label]) => `<option value="${value}"${state.sort === value ? ' selected' : ''}>${label}</option>`).join('')}
        </select></label>
        <label>Category<select id="category"><option value="">All categories</option>${categories
    .map((value) => `<option${state.category === value ? ' selected' : ''}>${escapeHtml(value)}</option>`).join('')}</select></label>
      </section>
      <nav id="tabs" class="library-tabs" aria-label="Domain entity types">${order.map((type) => {
    const count = type === 'everything' ? state.records.length : state.records.filter((record) => record.entity_type === type).length;
    return `<button type="button" class="library-tab${state.tab === type ? ' active' : ''}" data-tab="${type}" aria-pressed="${state.tab === type}">${type === 'everything' ? 'Everything' : labels[type]} (${count})</button>`;
  }).join('')}</nav>
      <div class="library-meta"><b id="resultCount">${rows.length} result${rows.length === 1 ? '' : 's'}</b><span id="summary">${escapeHtml(tabLabel)}</span></div>
      <section id="results" class="library-grid" aria-label="Library results">${rows.map((record) => `
        <button type="button" class="library-card" data-record-id="${escapeHtml(record.id)}">
          <span class="library-pill">${escapeHtml(labels[record.entity_type] || record.entity_type)}</span>
          ${categoryFor(record) ? `<span class="library-pill">${escapeHtml(categoryFor(record))}</span>` : ''}
          <h2>${escapeHtml(displayName(record))}</h2><p>${escapeHtml(description(record))}</p><code>${escapeHtml(record.id)}</code>
        </button>`).join('')}</section>
      <section id="empty" class="library-empty"${rows.length ? ' hidden' : ''}><h2>No matches</h2><p>Try a broader query or remove a filter.</p></section>
      <footer id="status" class="library-status">Loaded ${state.packs.length} pack(s). Manifest: ${escapeHtml(state.manifest?.generated_at || 'prototype')}.</footer>
      <dialog id="dialog" class="library-dialog" aria-labelledby="library-detail-title">
        <button id="close" type="button" class="dialog-close" aria-label="Close details">×</button>
        <div id="detail"></div>
      </dialog>
    </section>`;

  const dialog = mountedRoot.querySelector('#dialog');
  if (state.openRecordId) {
    const record = state.records.find((candidate) => candidate.id === state.openRecordId);
    if (record) {
      mountedRoot.querySelector('#detail').innerHTML = detailMarkup(record);
      dialog.showModal();
    } else {
      state.openRecordId = null;
    }
  }
}

function onInput(event) {
  if (event.target.id !== 'search') return;
  state.query = event.target.value.trim().toLowerCase();
  render();
  mountedRoot?.querySelector('#search')?.focus();
}

function onChange(event) {
  if (event.target.id === 'sort') state.sort = event.target.value;
  if (event.target.id === 'category') state.category = event.target.value;
  render();
}

function onClick(event) {
  const tab = event.target.closest('[data-tab]');
  if (tab) {
    state.tab = tab.dataset.tab;
    state.category = '';
    render();
    return;
  }
  const card = event.target.closest('[data-record-id]');
  if (card) {
    state.openRecordId = card.dataset.recordId;
    render();
    return;
  }
  if (event.target.id === 'close') {
    state.openRecordId = null;
    mountedRoot.querySelector('#dialog')?.close();
  }
}

function onDialogClick(event) {
  if (event.target.id === 'dialog') {
    state.openRecordId = null;
    event.target.close();
  }
}

function onDialogClose(event) {
  if (event.target.id === 'dialog') state.openRecordId = null;
}

export async function mountLibrary(root, { announce = () => {} } = {}) {
  mountedRoot = root;
  root.innerHTML = '<section class="route-loading" aria-busy="true"><p>Loading Domain Library…</p></section>';
  await ensureContent();
  if (mountedRoot !== root) return;
  render();
  root.addEventListener('input', onInput);
  root.addEventListener('change', onChange);
  root.addEventListener('click', onClick);
  root.addEventListener('click', onDialogClick);
  root.addEventListener('close', onDialogClose, true);
  requestAnimationFrame(() => window.scrollTo({ top: state.scrollY, behavior: 'instant' }));
  announce('Domain Library ready.');
}

export function unmountLibrary() {
  if (!mountedRoot) return;
  state.scrollY = window.scrollY;
  mountedRoot.removeEventListener('input', onInput);
  mountedRoot.removeEventListener('change', onChange);
  mountedRoot.removeEventListener('click', onClick);
  mountedRoot.removeEventListener('click', onDialogClick);
  mountedRoot.removeEventListener('close', onDialogClose, true);
  mountedRoot = null;
}

export function libraryStateSnapshot() {
  return structuredClone({
    tab: state.tab,
    query: state.query,
    sort: state.sort,
    category: state.category,
    openRecordId: state.openRecordId,
    scrollY: state.scrollY,
  });
}
