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

export async function loadPlayCatalog({
  fetchImpl = globalThis.fetch,
  contentRoot = CONTENT_ROOT,
  cache = true,
} = {}) {
  const load = () => Promise.all([
    fetchJson('card-catalog.json', { fetchImpl, contentRoot }),
    fetchJson('decks.json', { fetchImpl, contentRoot }),
    fetchJson('domain-snapshot.json', { fetchImpl, contentRoot }),
  ]).then(([cards, decks, domain]) => freezeCatalog({ cards, decks, domain }));
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
