const CONTENT_ROOT = new URL('../../generated/play/content/gameplay-v1/', import.meta.url);

const TUTORIAL_RULESET_VERSION = 'first-version-v2';
const TUTORIAL_CARD_CATALOG_VERSION = 'core-card-catalog-diagnosis-v2';
const TUTORIAL_TICKET_CONTENT_VERSION = 'core-ticket-templates-diagnosis-v2';
const TUTORIAL_RESPONSE_DECK_ID = 'deck.core.storage_response_v2';

let catalogPromise = null;
let tutorialCatalogPromise = null;

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

function createTutorialPresentationCatalog({ cards, decks, legacyDomain, ticketContent, currentDomain }) {
  const presentationCards = {
    ...cards,
    ruleset_version: TUTORIAL_RULESET_VERSION,
    card_catalog_version: TUTORIAL_CARD_CATALOG_VERSION,
    cards: cards.cards.map((card) => card.play_contract?.contract_type === 'DIAGNOSTIC' ? {
      ...card,
      play_contract: {
        ...card.play_contract,
        placement: 'diagnostic_bench',
        disposition: 'remain_in_diagnostic_bench',
      },
    } : card),
  };
  const cardById = new Map(presentationCards.cards.map((card) => [card.id, card]));
  const foundation = decks.decks.find((deck) => deck.id === 'deck.core.storage_foundation');
  if (!foundation) throw new Error('Tutorial presentation content is missing its legacy foundation deck.');
  const responsePool = foundation.card_definition_ids.filter((id) =>
    cardById.get(id)?.play_contract?.contract_type !== 'DIAGNOSTIC');
  const counts = new Map(responsePool.map((id) => [id, 0]));
  const responseCards = [];
  while (responseCards.length < 30) {
    let added = false;
    for (const id of responsePool) {
      if (responseCards.length === 30) break;
      const count = counts.get(id) ?? 0;
      if (count >= 6) continue;
      responseCards.push(id);
      counts.set(id, count + 1);
      added = true;
    }
    if (!added) throw new Error('Tutorial presentation content cannot form its pinned response deck.');
  }
  const presentationDecks = {
    ruleset_version: TUTORIAL_RULESET_VERSION,
    card_catalog_version: TUTORIAL_CARD_CATALOG_VERSION,
    decks: [{
      id: TUTORIAL_RESPONSE_DECK_ID,
      entity_type: 'deck',
      display_name: 'Storage Response Deck v2',
      card_definition_ids: responseCards,
    }],
  };
  return {
    cards: presentationCards,
    decks: presentationDecks,
    domain: currentDomain,
    ticketContent: {
      ...ticketContent,
      ruleset_version: TUTORIAL_RULESET_VERSION,
      ticket_content_version: TUTORIAL_TICKET_CONTENT_VERSION,
    },
    legacyDomain,
    rulesetVersion: TUTORIAL_RULESET_VERSION,
  };
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
        || cards.card_catalog_version !== 'core-card-catalog-technical-copy-v4'
        || decks.deck_catalog_version !== 'core-response-decks-v4'
        || parts.part_catalog_version !== 'ticket-parts-v1'
        || coverage.coverage_version !== 'playable-coverage-v4') {
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

export async function loadTutorialCatalog({
  fetchImpl = globalThis.fetch,
  contentRoot = CONTENT_ROOT,
  cache = true,
} = {}) {
  const load = () => Promise.all([
    fetchJson('card-catalog.json', { fetchImpl, contentRoot }),
    fetchJson('decks.json', { fetchImpl, contentRoot }),
    fetchJson('domain-snapshot.json', { fetchImpl, contentRoot }),
    fetchJson('ticket-templates.json', { fetchImpl, contentRoot }),
    fetchJson('domain-snapshot-v2.json', { fetchImpl, contentRoot }),
    fetchJson('tutorials-v1.json', { fetchImpl, contentRoot }),
  ]).then(([cards, decks, legacyDomain, ticketContent, currentDomain, tutorials]) => {
    const migrated = createTutorialPresentationCatalog({ cards, decks, legacyDomain, ticketContent, currentDomain });
    if (tutorials.tutorial_catalog_version !== 'tutorial-checkpoints-v1'
        || tutorials.ruleset_version !== migrated.rulesetVersion
        || tutorials.card_catalog_version !== migrated.cards.card_catalog_version
        || tutorials.ticket_content_version !== migrated.ticketContent.ticket_content_version) {
      throw new Error('Tutorial checkpoints are incompatible with the pinned engine content.');
    }
    const currentById = new Map(currentDomain.entities.map((record) => [record.id, record]));
    migrated.cards.cards = migrated.cards.cards.map((card) => {
      const record = currentById.get(card.primary_domain_reference?.entity_id);
      const description = record?.presentation?.short_description?.trim();
      const reviewed = description && !/(?:gathers troubleshooting evidence|corrective procedure|confirms the repaired state)/i.test(description);
      return reviewed ? {
        ...card,
        presentation: { ...card.presentation, short_description: description },
        ...(record.education_text?.trim() ? { educational_text: record.education_text.trim() } : {}),
      } : card;
    });
    return Object.freeze({
      ...migrated,
      tutorials,
      cardById: new Map(migrated.cards.cards.map((card) => [card.id, card])),
      deckById: new Map(migrated.decks.decks.map((deck) => [deck.id, deck])),
      domainById: currentById,
    });
  });
  if (!cache) return load();
  tutorialCatalogPromise ||= load().catch((error) => {
    tutorialCatalogPromise = null;
    throw error;
  });
  return tutorialCatalogPromise;
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
