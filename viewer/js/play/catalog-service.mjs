const CONTENT_ROOT = new URL('../../generated/play/content/gameplay-v1/', import.meta.url);

let catalogPromise = null;

async function fetchJson(name, { fetchImpl, contentRoot }) {
  if (typeof fetchImpl !== 'function') throw new TypeError('No fetch implementation is available for Play content.');
  const response = await fetchImpl(new URL(name, contentRoot), { cache: 'no-cache' });
  if (!response.ok) throw new Error(`Play content ${name} returned ${response.status}.`);
  return response.json();
}

function freezeCatalog({ cards, decks, domain, parts, coverage }) {
  const cardById = new Map(cards.cards.map((card) => [card.id, card]));
  const deckById = new Map(decks.decks.map((deck) => [deck.id, deck]));
  const domainById = new Map(domain.entities.map((entity) => [entity.id, entity]));
  return Object.freeze({ cards, decks, domain, parts, coverage, cardById, deckById, domainById });
}

export async function loadPlayCatalog({
  fetchImpl = globalThis.fetch,
  contentRoot = CONTENT_ROOT,
  cache = true,
} = {}) {
  const load = () => Promise.all([
    fetchJson('card-catalog-v3.json', { fetchImpl, contentRoot }),
    fetchJson('decks-v3.json', { fetchImpl, contentRoot }),
    fetchJson('domain-snapshot-v2.json', { fetchImpl, contentRoot }),
    fetchJson('task-014-parts.json', { fetchImpl, contentRoot }),
    fetchJson('playable-coverage-v3.json', { fetchImpl, contentRoot }),
  ]).then(([cards, decks, domain, parts, coverage]) => {
    if (cards.ruleset_version !== 'first-version-v2'
        || cards.card_catalog_version !== 'core-card-catalog-coverage-v3'
        || decks.deck_catalog_version !== 'core-response-decks-v3'
        || parts.part_catalog_version !== 'ticket-parts-v1'
        || coverage.coverage_version !== 'playable-coverage-v3') {
      throw new Error('TASK-014 playable content versions are incompatible.');
    }
    return freezeCatalog({ cards, decks, domain, parts, coverage });
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

export function deckCoverage(catalog, cardDefinitionIds) {
  const counts = new Map();
  for (const id of cardDefinitionIds) counts.set(id, (counts.get(id) ?? 0) + 1);
  const fingerprints = (catalog.coverage?.fingerprints ?? []).map((entry) => {
    const needed = new Map();
    for (const id of entry.required_response_card_definition_ids) needed.set(id, (needed.get(id) ?? 0) + 1);
    const missing = [...needed]
      .filter(([id, count]) => (counts.get(id) ?? 0) < count)
      .map(([id]) => id);
    return {
      fingerprint_id: entry.fingerprint_id,
      subsystem: entry.subsystem,
      compatible: missing.length === 0,
      missing_card_definition_ids: missing,
      required_counts: needed,
    };
  });
  let maximumDistinct = 0;
  const eligible = fingerprints.filter((entry) => entry.compatible);
  const visit = (index, selected, remaining) => {
    if (selected + (eligible.length - index) <= maximumDistinct) return;
    if (index === eligible.length) {
      maximumDistinct = Math.max(maximumDistinct, selected);
      return;
    }
    const next = new Map(remaining);
    let fits = true;
    for (const [id, count] of eligible[index].required_counts) {
      if ((next.get(id) ?? 0) < count) {
        fits = false;
        break;
      }
      next.set(id, next.get(id) - count);
    }
    if (fits) visit(index + 1, selected + 1, next);
    visit(index + 1, selected, remaining);
  };
  visit(0, 0, counts);
  const subsystemNames = [...new Set(fingerprints.map((entry) => entry.subsystem))].sort();
  return {
    eligible_unique_count: maximumDistinct,
    individually_compatible_count: eligible.length,
    supported_unique_count: fingerprints.length,
    subsystems: Object.fromEntries(subsystemNames.map((name) => [
      name,
      fingerprints.filter((entry) => entry.subsystem === name && entry.compatible).length,
    ])),
    fingerprints: fingerprints.map(({ required_counts: _, ...entry }) => entry),
  };
}
