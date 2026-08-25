import { createCardDetailView, createDeckCardTile } from '../card-view.mjs';
import { cardFamily, cardName, compactDeckCards, deckComposition } from '../catalog-service.mjs';
import { cloneJson, dialogWithRestore, escapeHtml, setInlineNotice } from '../dom-utils.mjs';
import { closeDialogWithMotion } from '../motion-coordinator.mjs';
import { MAX_COPIES_PER_CARD_ID } from '../data/client-data.mjs';

function deckReasons(deck) {
  const reasons = [];
  if (!deck.display_name.trim()) reasons.push('Deck name is required.');
  if (deck.display_name.length > 48) reasons.push('Deck name must be 48 characters or fewer.');
  if (deck.card_definition_ids.length !== 30) reasons.push(`Add ${30 - deck.card_definition_ids.length} more Card${Math.abs(30 - deck.card_definition_ids.length) === 1 ? '' : 's'} to reach exactly 30.`);
  const counts = new Map();
  for (const id of deck.card_definition_ids) counts.set(id, (counts.get(id) ?? 0) + 1);
  for (const [id, count] of counts) if (count > MAX_COPIES_PER_CARD_ID) reasons.push(`${id} has ${count} copies; maximum is ${MAX_COPIES_PER_CARD_ID}.`);
  return reasons;
}

function compositionMarkup(catalog, deck) {
  const composition = deckComposition(catalog, compactDeckCards(deck.card_definition_ids));
  return [['test', 'Test'], ['command', 'Command'], ['repair', 'Repair'], ['verify', 'Verify']]
    .map(([key, label]) => `<span class="composition-chip composition-chip--${key}"><b>${composition[key] || 0}</b>${label}</span>`).join('');
}

function ensureSelected(context, decks) {
  const current = decks.find((deck) => deck.deck_id === context.ui.selectedDeckId);
  const selected = current || decks.find((deck) => deck.deck_id === context.snapshot.state.records.decks.active_deck_id) || decks[0] || null;
  context.ui.selectedDeckId = selected?.deck_id ?? null;
  return selected;
}

export function renderDecks(root, context) {
  const collection = context.snapshot.state.records.decks;
  const selected = ensureSelected(context, collection.decks);
  root.innerHTML = `
    <section class="play-route decks-route" aria-labelledby="decks-heading">
      <header class="play-page-heading" data-route-reveal>
        <div><p class="play-eyebrow">Response kits</p><h1 id="decks-heading">Your Decks</h1><p>Saved decks contain exactly 30 Repair/Verify response Cards with no more than ${MAX_COPIES_PER_CARD_ID} copies of a definition. Diagnostics live on the global Bench.</p></div>
        <button id="create-deck" type="button" class="play-button play-button--primary">Create empty draft</button>
      </header>
      <div class="decks-layout">
        <section class="deck-gallery" aria-label="Saved decks" data-route-reveal>
          ${collection.decks.map((deck) => {
    const active = deck.deck_id === collection.active_deck_id;
    const picked = deck.deck_id === selected?.deck_id;
    return `<button type="button" class="deck-gallery-card${picked ? ' is-selected' : ''}" data-select-deck="${escapeHtml(deck.deck_id)}" aria-pressed="${picked}">
              <span class="deck-gallery-card__status">${active ? 'Active' : 'Saved'}</span>
              <strong>${escapeHtml(deck.display_name)}</strong>
              <span>${deck.card_definition_ids.length} Cards · legal</span>
              <span class="composition-row">${compositionMarkup(context.catalog, deck)}</span>
            </button>`;
  }).join('') || '<div class="empty-panel"><h2>No saved decks</h2><p>Create an empty draft and add exactly 30 Cards.</p></div>'}
        </section>
        <aside class="deck-inspector" data-route-reveal>
          ${selected ? `
            <p class="play-eyebrow">Selected deck</p>
            <h2>${escapeHtml(selected.display_name)}</h2>
            <p><code>${escapeHtml(selected.deck_id)}</code></p>
            <div class="composition-row">${compositionMarkup(context.catalog, selected)}</div>
            <dl class="inspector-facts"><div><dt>Cards</dt><dd>${selected.card_definition_ids.length} / 30</dd></div><div><dt>Validity</dt><dd>Legal</dd></div><div><dt>Status</dt><dd>${selected.deck_id === collection.active_deck_id ? 'Active' : 'Available'}</dd></div></dl>
            <div class="inspector-card-list">${compactDeckCards(selected.card_definition_ids).map((entry) => `<button type="button" data-inspect-card="${escapeHtml(entry.card_definition_id)}"><span>${entry.quantity}×</span>${escapeHtml(cardName(context.catalog.cardById.get(entry.card_definition_id)))}</button>`).join('')}</div>
            <div class="button-row">
              <button type="button" class="play-button play-button--primary" data-activate-deck="${escapeHtml(selected.deck_id)}"${selected.deck_id === collection.active_deck_id ? ' disabled' : ''}>${selected.deck_id === collection.active_deck_id ? 'Active deck' : 'Make active'}</button>
              <button type="button" class="play-button" data-edit-deck="${escapeHtml(selected.deck_id)}">Edit</button>
              <button type="button" class="play-button play-button--danger" data-delete-deck="${escapeHtml(selected.deck_id)}">Delete</button>
            </div>` : '<p>Select or create a deck.</p>'}
        </aside>
      </div>
      <p data-inline-notice class="inline-notice" hidden></p>
      <dialog id="deck-card-dialog" class="play-dialog card-detail-dialog" aria-label="Card details"><button type="button" class="dialog-close" data-close-dialog aria-label="Close Card details">×</button><div data-dialog-content></div></dialog>
    </section>`;

  const inspect = (cardId, opener) => {
    const card = context.catalog.cardById.get(cardId);
    if (!card) return;
    const dialog = root.querySelector('#deck-card-dialog');
    const content = dialog.querySelector('[data-dialog-content]');
    content.replaceChildren(createCardDetailView(card, { artResolver: context.artResolver }));
    dialogWithRestore(dialog, opener);
    context.motion('dialog', dialog);
  };

  const onClick = (event) => {
    const selectedButton = event.target.closest('[data-select-deck]');
    if (selectedButton) {
      context.ui.selectedDeckId = selectedButton.dataset.selectDeck;
      context.rerender();
      return;
    }
    if (event.target.closest('#create-deck')) {
      const draft = context.storage.createDeckDraft();
      context.ui.editorDraft = draft;
      context.ui.editorOriginal = null;
      context.ui.editorDirty = true;
      context.navigate(`#/play/decks/${draft.deck_id}/edit`);
      return;
    }
    const activate = event.target.closest('[data-activate-deck]');
    if (activate) {
      context.storage.makeActive(activate.dataset.activateDeck);
      context.announce(`${selected.display_name} is now the active deck.`);
      context.rerender();
      return;
    }
    const edit = event.target.closest('[data-edit-deck]');
    if (edit) {
      const deck = collection.decks.find((item) => item.deck_id === edit.dataset.editDeck);
      context.ui.editorDraft = cloneJson(deck);
      context.ui.editorOriginal = cloneJson(deck);
      context.ui.editorDirty = false;
      context.navigate(`#/play/decks/${deck.deck_id}/edit`);
      return;
    }
    const remove = event.target.closest('[data-delete-deck]');
    if (remove) {
      const deck = collection.decks.find((item) => item.deck_id === remove.dataset.deleteDeck);
      if (!confirm(`Delete “${deck.display_name}”? This cannot be undone.`)) return;
      context.storage.deleteDeck(deck.deck_id, { confirmed: true });
      context.ui.selectedDeckId = null;
      context.announce(`${deck.display_name} deleted.`);
      context.rerender();
      return;
    }
    const inspectButton = event.target.closest('[data-inspect-card]');
    if (inspectButton) inspect(inspectButton.dataset.inspectCard, inspectButton);
    if (event.target.closest('[data-close-dialog]')) closeDialogWithMotion(root.querySelector('#deck-card-dialog'));
  };
  root.addEventListener('click', onClick);
  return () => root.removeEventListener('click', onClick);
}

function ensureDraft(context, deckId) {
  if (context.ui.editorDraft?.deck_id === deckId) return context.ui.editorDraft;
  const stored = context.snapshot.state.records.decks.decks.find((deck) => deck.deck_id === deckId);
  if (!stored) return null;
  context.ui.editorDraft = cloneJson(stored);
  context.ui.editorOriginal = cloneJson(stored);
  context.ui.editorDirty = false;
  return context.ui.editorDraft;
}

function matchesFilters(card, filters) {
  const query = filters.query.toLowerCase();
  if (query && !JSON.stringify(card).toLowerCase().includes(query)) return false;
  if (filters.family && cardFamily(card) !== filters.family) return false;
  if (filters.archetype && !card.archetypes?.includes(filters.archetype)) return false;
  if (filters.cost !== '' && card.cost !== Number(filters.cost)) return false;
  return true;
}

export function renderDeckEditor(root, context, deckId) {
  const draft = ensureDraft(context, deckId);
  if (!draft) {
    root.innerHTML = '<section class="play-route"><div class="empty-panel"><h1>Draft not found</h1><p>This empty draft may have been discarded.</p><a class="play-button" href="#/play/decks">Return to Decks</a></div></section>';
    return () => {};
  }
  context.ui.deckFilters ||= { query: '', family: '', archetype: '', cost: '' };
  const filters = context.ui.deckFilters;
  const archetypes = [...new Set(context.catalog.cards.cards.flatMap((card) => card.archetypes || []))].sort();
  const reasons = deckReasons(draft);
  root.innerHTML = `
    <section class="play-route deck-editor-route" aria-labelledby="deck-editor-heading">
      <header class="play-page-heading" data-route-reveal>
        <div><a class="back-link" href="#/play/decks">← Your Decks</a><p class="play-eyebrow">Deck editor</p><h1 id="deck-editor-heading">Edit response kit</h1></div>
        <div class="deck-editor-status"><strong>${draft.card_definition_ids.length} / 30</strong><span>${reasons.length ? 'Draft incomplete' : 'Legal deck'}</span></div>
      </header>
      <section class="deck-editor-tools" data-route-reveal>
        <label class="deck-name-field">Deck name<input id="deck-name" data-continuity-key="deck-name:${escapeHtml(deckId)}" value="${escapeHtml(draft.display_name)}" maxlength="48"></label>
        <label>Search<input id="deck-search" data-continuity-key="deck-search:${escapeHtml(deckId)}" type="search" value="${escapeHtml(filters.query)}" placeholder="Search Cards and rules"></label>
        <label>Family<select id="deck-family"><option value="">All families</option>${[['test', 'Test'], ['command', 'Command'], ['repair', 'Repair'], ['verify', 'Verify']].map(([value, label]) => `<option value="${value}"${filters.family === value ? ' selected' : ''}>${label}</option>`).join('')}</select></label>
        <label>Archetype<select id="deck-archetype"><option value="">All archetypes</option>${archetypes.map((value) => `<option${filters.archetype === value ? ' selected' : ''}>${escapeHtml(value.replaceAll('_', ' '))}</option>`).join('')}</select></label>
        <label>Action cost<select id="deck-cost"><option value="">Any cost</option>${[0, 1, 2].map((value) => `<option value="${value}"${filters.cost === String(value) ? ' selected' : ''}>${value}</option>`).join('')}</select></label>
      </section>
      <div class="deck-editor-layout">
        <section class="card-catalog-grid" data-continuity-scroll="deck:${escapeHtml(deckId)}:card-grid" aria-label="Available Cards" data-route-reveal></section>
        <aside class="deck-summary" data-continuity-scroll="deck:${escapeHtml(deckId)}:summary" data-route-reveal>
          <p class="play-eyebrow">Draft summary</p>
          <h2>${draft.card_definition_ids.length} of 30 Cards</h2>
          <div class="composition-row">${compositionMarkup(context.catalog, draft)}</div>
          <ul class="deck-reasons">${reasons.length ? reasons.map((reason) => `<li>${escapeHtml(reason)}</li>`).join('') : '<li class="is-valid">Exactly 30 Cards; copy limits satisfied.</li>'}</ul>
          <div class="deck-summary-list">${compactDeckCards(draft.card_definition_ids).map((entry) => `<div><span>${entry.quantity}×</span><span>${escapeHtml(cardName(context.catalog.cardById.get(entry.card_definition_id)))}</span></div>`).join('') || '<p>No Cards added yet.</p>'}</div>
          <div class="button-column"><button id="save-deck" type="button" class="play-button play-button--primary"${reasons.length ? ' disabled' : ''}>Save deck</button><a class="play-button" href="#/play/decks">Cancel</a></div>
          <p class="authority-note">Saving updates this local deck only. An active Match always keeps its start-time snapshot.</p>
        </aside>
      </div>
      <p data-inline-notice class="inline-notice" hidden></p>
      <dialog id="editor-card-dialog" class="play-dialog card-detail-dialog" aria-label="Card details"><button type="button" class="dialog-close" data-close-dialog aria-label="Close Card details">×</button><div data-dialog-content></div></dialog>
    </section>`;

  const grid = root.querySelector('.card-catalog-grid');
  const renderCardResults = () => {
    const counts = new Map(compactDeckCards(draft.card_definition_ids).map((entry) => [entry.card_definition_id, entry.quantity]));
    const cards = context.catalog.cards.cards.filter((card) =>
      card.play_contract?.contract_type !== 'DIAGNOSTIC' && matchesFilters(card, filters));
    grid.replaceChildren();
    for (const card of cards) {
      const quantity = counts.get(card.id) ?? 0;
      grid.append(createDeckCardTile(card, {
        quantity,
        canIncrement: quantity < MAX_COPIES_PER_CARD_ID && draft.card_definition_ids.length < 30,
        canDecrement: quantity > 0,
        artResolver: context.artResolver,
        onAdjust: ({ cardId, delta }) => {
          if (delta > 0 && (quantity >= MAX_COPIES_PER_CARD_ID || draft.card_definition_ids.length >= 30)) return;
          if (delta < 0) {
            const index = draft.card_definition_ids.lastIndexOf(cardId);
            if (index >= 0) draft.card_definition_ids.splice(index, 1);
          } else {
            draft.card_definition_ids.push(cardId);
          }
          context.ui.editorDirty = true;
          context.rerender();
          context.announce(`${cardName(card)} quantity ${quantity + delta}. ${draft.card_definition_ids.length} of 30 Cards.`);
        },
        onInspect: ({ cardId }) => {
          const dialog = root.querySelector('#editor-card-dialog');
          dialog.querySelector('[data-dialog-content]').replaceChildren(createCardDetailView(context.catalog.cardById.get(cardId), { artResolver: context.artResolver }));
          dialogWithRestore(dialog);
          context.motion('dialog', dialog);
        },
      }));
    }
    if (!cards.length) grid.innerHTML = '<div class="empty-panel"><h2>No Cards match</h2><p>Broaden the Card filters.</p></div>';
  };
  renderCardResults();

  let searchCompositionActive = false;

  const onInput = (event) => {
    if (event.target.id === 'deck-name') {
      draft.display_name = event.target.value;
      context.ui.editorDirty = JSON.stringify(draft) !== JSON.stringify(context.ui.editorOriginal);
      const currentReasons = deckReasons(draft);
      root.querySelector('#save-deck').disabled = currentReasons.length > 0;
      return;
    }
    if (event.target.id === 'deck-search') {
      if (searchCompositionActive || event.isComposing) return;
      filters.query = event.target.value;
      renderCardResults();
    }
  };
  const onCompositionStart = (event) => {
    if (event.target.id === 'deck-search') searchCompositionActive = true;
  };
  const onCompositionEnd = (event) => {
    if (event.target.id !== 'deck-search') return;
    searchCompositionActive = false;
    filters.query = event.target.value;
    renderCardResults();
  };
  const onChange = (event) => {
    const filterKeys = { 'deck-family': 'family', 'deck-archetype': 'archetype', 'deck-cost': 'cost' };
    if (!filterKeys[event.target.id]) return;
    filters[filterKeys[event.target.id]] = event.target.value;
    context.rerender();
  };
  const onClick = (event) => {
    if (event.target.closest('[data-close-dialog]')) closeDialogWithMotion(root.querySelector('#editor-card-dialog'));
    if (!event.target.closest('#save-deck')) return;
    draft.display_name = root.querySelector('#deck-name').value.trim();
    const errors = deckReasons(draft);
    if (errors.length) {
      setInlineNotice(root, errors.join(' '), 'error');
      return;
    }
    try {
      context.storage.saveDeck(draft);
      context.ui.selectedDeckId = draft.deck_id;
      context.ui.editorOriginal = cloneJson(draft);
      context.ui.editorDirty = false;
      context.announce(`${draft.display_name} saved.`);
      context.navigate('#/play/decks');
    } catch (error) {
      setInlineNotice(root, error.message, 'error');
    }
  };
  root.addEventListener('input', onInput);
  root.addEventListener('compositionstart', onCompositionStart);
  root.addEventListener('compositionend', onCompositionEnd);
  root.addEventListener('change', onChange);
  root.addEventListener('click', onClick);
  return () => {
    root.removeEventListener('input', onInput);
    root.removeEventListener('compositionstart', onCompositionStart);
    root.removeEventListener('compositionend', onCompositionEnd);
    root.removeEventListener('change', onChange);
    root.removeEventListener('click', onClick);
  };
}
