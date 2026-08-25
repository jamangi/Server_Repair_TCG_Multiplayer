const CONTENT_ROOT = new URL('../../generated/play/content/gameplay-v1/', import.meta.url);

let catalogPromise = null;

async function fetchJson(name, { fetchImpl, contentRoot }) {
  if (typeof fetchImpl !== 'function') throw new TypeError('No fetch implementation is available for Play content.');
  const response = await fetchImpl(new URL(name, contentRoot), { cache: 'no-cache' });
  if (!response.ok) throw new Error(`Play content ${name} returned ${response.status}.`);
  return response.json();
}

function freezeCatalog({ cards, decks, domain }) {
  const cardById = new Map(cards.cards.map((card) => [card.id, card]));
  const deckById = new Map(decks.decks.map((deck) => [deck.id, deck]));
  const domainById = new Map(domain.entities.map((entity) => [entity.id, entity]));
  return Object.freeze({ cards, decks, domain, cardById, deckById, domainById });
}

function applyDiagnosisMigration({ cards, decks, domain, migration }) {
  const nextCards = structuredClone(cards);
  nextCards.ruleset_version = migration.successor_ruleset_version;
  nextCards.card_catalog_version = migration.card_catalog_version;
  nextCards.cards = nextCards.cards.map((card) => card.play_contract?.contract_type === 'DIAGNOSTIC'
    ? { ...card, play_contract: { ...card.play_contract, placement: 'diagnostic_bench', disposition: 'remain_in_diagnostic_bench' } }
    : card);
  const byId = new Map(nextCards.cards.map((card) => [card.id, card]));
  const source = decks.decks.find((deck) => deck.id === migration.response_deck.source_deck_id);
  if (!source) throw new Error('The response-deck migration source is missing.');
  const response = source.card_definition_ids.filter((id) =>
    byId.get(id)?.play_contract?.contract_type !== 'DIAGNOSTIC');
  const counts = new Map(response.map((id) => [id, 0]));
  const migrated = [];
  while (migrated.length < migration.response_deck.size) {
    let added = false;
    for (const id of response) {
      if (migrated.length === migration.response_deck.size) break;
      if ((counts.get(id) ?? 0) >= migration.response_deck.max_copies_per_card_id) continue;
      migrated.push(id);
      counts.set(id, (counts.get(id) ?? 0) + 1);
      added = true;
    }
    if (!added) throw new Error('The pinned response-deck migration cannot produce a legal deck.');
  }
  return {
    cards: nextCards,
    decks: {
      ruleset_version: migration.successor_ruleset_version,
      card_catalog_version: migration.card_catalog_version,
      decks: [{
        id: migration.response_deck.successor_deck_id,
        entity_type: 'deck',
        display_name: 'Storage Response Deck v2',
        card_definition_ids: migrated,
      }],
    },
    domain,
  };
}

export async function loadPlayCatalog({
  fetchImpl = globalThis.fetch,
  contentRoot = CONTENT_ROOT,
  cache = true,
} = {}) {
  const load = () => Promise.all([
    fetchJson('card-catalog.json', { fetchImpl, contentRoot }),
    fetchJson('decks.json', { fetchImpl, contentRoot }),
    fetchJson('domain-snapshot.json', { fetchImpl, contentRoot }),
    fetchJson('diagnosis-v2-migration.json', { fetchImpl, contentRoot }),
  ]).then(([cards, decks, domain, migration]) => {
    if (migration.successor_ruleset_version !== 'first-version-v2') throw new Error('Diagnosis migration version is incompatible.');
    return freezeCatalog(applyDiagnosisMigration({ cards, decks, domain, migration }));
  });
  if (!cache) return load();
  catalogPromise ||= load().catch((error) => {
    catalogPromise = null;
    throw error;
  });
  return catalogPromise;
}

export function cardName(card) {
  return card?.presentation?.display_name || card?.id || 'Unknown Card';
}

export function cardDescription(card) {
  return card?.presentation?.short_description || card?.rules_text || 'No description available.';
}

export function cardFamily(card) {
  if (card?.card_type === 'repair_procedure') return 'repair';
  if (card?.card_type === 'verification') return 'verify';
  return card?.card_type || 'generic';
}

export function domainName(catalog, id) {
  const record = catalog?.domainById?.get(id);
  return record?.presentation?.display_name || record?.name || id;
}

export function expandDeckEntries(entries) {
  return entries.flatMap((entry) => Array.from({ length: entry.quantity }, () => entry.card_definition_id));
}

export function compactDeckCards(cardDefinitionIds) {
  const quantities = new Map();
  for (const id of cardDefinitionIds) quantities.set(id, (quantities.get(id) ?? 0) + 1);
  return [...quantities.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([card_definition_id, quantity]) => ({ card_definition_id, quantity }));
}

export function deckComposition(catalog, entries) {
  const result = { test: 0, command: 0, repair: 0, verify: 0 };
  for (const entry of entries) {
    const family = cardFamily(catalog.cardById.get(entry.card_definition_id));
    result[family] = (result[family] ?? 0) + entry.quantity;
  }
  return result;
}
