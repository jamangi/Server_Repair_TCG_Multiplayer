import { loadAllContent } from './data-loader.js';
import {
  ENTITY_TYPE_LABELS as labels,
  ENTITY_TYPE_ORDER as order,
  categoryFor,
} from './entity-types.js';
import { createUiContinuity } from './play/ui-continuity.mjs';
import { domainMethod, isTechnicalAction, technicalNoteLabel } from './play/technical-action-copy.mjs';

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
let searchCompositionActive = false;
const continuity = createUiContinuity();

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
  const query = state.query.trim().toLowerCase();
  if (query) rows = rows.filter((record) => JSON.stringify(record).toLowerCase().includes(query));
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
  if (isTechnicalAction(record)) {
    const domainById = new Map(state.records.map((entry) => [entry.id, entry]));
    const method = domainMethod(record, domainById);
    const note = record.education_text?.trim();
    const referenceMarkup = method.references.length ? `<h3>Related technical records</h3><ul class="library-reference-list">${method.references.map((reference) => `<li><a href="${escapeHtml(reference.href)}">${escapeHtml(reference.name)}</a><span>${escapeHtml(reference.role)}</span></li>`).join('')}</ul>` : '';
    return `
      <span class="library-pill">${escapeHtml(labels[record.entity_type] || record.entity_type)}</span>
      <h2 id="library-detail-title">${escapeHtml(displayName(record))}</h2>
      <section class="library-learning-section"><h3>What it does</h3><p>${escapeHtml(description(record))}</p></section>
      ${note ? `<section class="library-learning-section library-learning-section--note"><h3>${escapeHtml(technicalNoteLabel(record))}</h3><p>${escapeHtml(note)}</p></section>` : ''}
      <section class="library-learning-section"><h3>Technical method</h3>
        ${method.facts.length ? `<dl class="library-facts">${method.facts.map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${label === 'Syntax' ? `<code>${escapeHtml(value)}</code>` : escapeHtml(value)}</dd></div>`).join('')}</dl>` : ''}
        ${method.lists.map(([label, values]) => `<h4>${escapeHtml(label)}</h4><${record.entity_type === 'repair_procedure' ? 'ol' : 'ul'}>${values.map((value) => `<li>${escapeHtml(value)}</li>`).join('')}</${record.entity_type === 'repair_procedure' ? 'ol' : 'ul'}>`).join('')}
      </section>
      ${referenceMarkup}
      ${illustration ? `<h3>Illustration</h3><p>${escapeHtml(illustration.alt_text || '')}</p>` : ''}
      <details class="library-advanced"><summary>Advanced IDs and authored fields</summary><p><code>${escapeHtml(record.id)}</code></p><table>${Object.entries(record)
        .filter(([key]) => !skipped.has(key) && !['education_text', 'purpose', 'capabilities', 'steps_summary', 'success_conditions'].includes(key))
        .map(([key, value]) => `<tr><th scope="row">${escapeHtml(key.replaceAll('_', ' '))}</th><td>${formatValue(value)}</td></tr>`)
        .join('')}</table><p>Pack: ${escapeHtml(record._pack_name || '')}</p></details>`;
  }
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

function resultCardsMarkup(rows) {
  return rows.map((record) => `
        <button type="button" class="library-card" data-record-id="${escapeHtml(record.id)}">
          <span class="library-pill">${escapeHtml(labels[record.entity_type] || record.entity_type)}</span>
          ${categoryFor(record) ? `<span class="library-pill">${escapeHtml(categoryFor(record))}</span>` : ''}
          <h2>${escapeHtml(displayName(record))}</h2><p>${escapeHtml(description(record))}</p>
        </button>`).join('');
}

function updateResults() {
  if (!mountedRoot) return;
  const rows = visibleRecords();
  const tabLabel = state.tab === 'everything' ? 'Everything' : labels[state.tab];
  mountedRoot.querySelector('#resultCount').textContent = `${rows.length} result${rows.length === 1 ? '' : 's'}`;
  mountedRoot.querySelector('#summary').textContent = tabLabel;
  mountedRoot.querySelector('#results').innerHTML = resultCardsMarkup(rows);
  mountedRoot.querySelector('#empty').hidden = rows.length > 0;
}

function render({ preserveContinuity = true } = {}) {
  if (!mountedRoot) return;
  if (preserveContinuity) continuity.capture(mountedRoot, { scope: 'library' });
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
        <label>Search<input id="search" data-continuity-key="library-search" type="search" value="${escapeHtml(state.query)}" placeholder='Try "no POST", "DIMM", "lsblk", or "thermal"'></label>
        <label>Sort<select id="sort">
          ${[['name', 'Name'], ['type', 'Type'], ['category', 'Category'], ['id', 'Stable ID']]
    .map(([value, label]) => `<option value="${value}"${state.sort === value ? ' selected' : ''}>${label}</option>`).join('')}
        </select></label>
        <label>Category<select id="category"><option value="">All categories</option>${categories
    .map((value) => `<option${state.category === value ? ' selected' : ''}>${escapeHtml(value)}</option>`).join('')}</select></label>
      </section>
      <nav id="tabs" class="library-tabs" data-continuity-scroll="library:tabs" aria-label="Domain entity types">${order.map((type) => {
    const count = type === 'everything' ? state.records.length : state.records.filter((record) => record.entity_type === type).length;
    return `<button type="button" class="library-tab${state.tab === type ? ' active' : ''}" data-tab="${type}" aria-pressed="${state.tab === type}">${type === 'everything' ? 'Everything' : labels[type]} (${count})</button>`;
  }).join('')}</nav>
      <div class="library-meta"><b id="resultCount">${rows.length} result${rows.length === 1 ? '' : 's'}</b><span id="summary">${escapeHtml(tabLabel)}</span></div>
      <section id="results" class="library-grid" aria-label="Library results">${resultCardsMarkup(rows)}</section>
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
  if (preserveContinuity) continuity.restore(mountedRoot, { scope: 'library' });
}

function onInput(event) {
  if (event.target.id !== 'search') return;
  if (searchCompositionActive || event.isComposing) return;
  state.query = event.target.value;
  updateResults();
}

function onCompositionStart(event) {
  if (event.target.id === 'search') searchCompositionActive = true;
}

function onCompositionEnd(event) {
  if (event.target.id !== 'search') return;
  searchCompositionActive = false;
  state.query = event.target.value;
  updateResults();
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
    location.hash = `#/library/${encodeURIComponent(card.dataset.recordId)}`;
    return;
  }
  if (event.target.id === 'close') {
    state.openRecordId = null;
    mountedRoot.querySelector('#dialog')?.close();
    if (location.hash.startsWith('#/library/')) location.hash = '#/library';
  }
}

function onDialogClick(event) {
  if (event.target.id === 'dialog') {
    state.openRecordId = null;
    event.target.close();
    if (location.hash.startsWith('#/library/')) location.hash = '#/library';
  }
}

function onDialogClose(event) {
  if (event.target.id !== 'dialog') return;
  state.openRecordId = null;
  if (location.hash.startsWith('#/library/')) location.hash = '#/library';
}

export async function mountLibrary(root, { announce = () => {}, route = null } = {}) {
  mountedRoot = root;
  root.innerHTML = '<section class="route-loading" aria-busy="true"><p>Loading Domain Library…</p></section>';
  await ensureContent();
  if (mountedRoot !== root) return;
  if (route?.params?.recordId) state.openRecordId = route.params.recordId;
  render({ preserveContinuity: false });
  root.addEventListener('input', onInput);
  root.addEventListener('compositionstart', onCompositionStart);
  root.addEventListener('compositionend', onCompositionEnd);
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
  mountedRoot.removeEventListener('compositionstart', onCompositionStart);
  mountedRoot.removeEventListener('compositionend', onCompositionEnd);
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
