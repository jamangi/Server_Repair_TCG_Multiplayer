import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import {
  buildTicketsV3,
  buildTicketsV4,
  createTask014Catalogs,
  createTask042Catalogs,
} from '../src/builder/task-014.mjs';
import { loadPlayCatalog } from '../viewer/js/play/catalog-service.mjs';
import {
  createDefaultState,
  createExportBundle,
  createClientDataContext,
  migrateExportBundle,
  migrateLocalState,
  saveDeck,
} from '../viewer/js/play/data/client-data.mjs';
import {
  createStoryBuilderConfiguration,
  preflightStoryDeck,
  validateStoryMatchRegistry,
} from '../viewer/js/play/story-match-registry.mjs';
import { createExpectedPlayManifest } from '../viewer/scripts/build-play-assets.mjs';

const repositoryRootUrl = new URL('../', import.meta.url);
const repositoryRoot = fileURLToPath(repositoryRootUrl);

async function json(relativePath) {
  return JSON.parse(await readFile(new URL(relativePath, repositoryRootUrl), 'utf8'));
}

async function fileFetch(input) {
  try {
    const value = JSON.parse(await readFile(fileURLToPath(input instanceof URL ? input : new URL(input)), 'utf8'));
    return { ok: true, status: 200, async json() { return structuredClone(value); } };
  } catch {
    return { ok: false, status: 404, async json() { throw new Error('not found'); } };
  }
}

async function task014Catalogs() {
  const [cards, decks, domain, parts, coverage] = await Promise.all([
    json('content/gameplay-v1/card-catalog-v3.json'),
    json('content/gameplay-v1/decks-v3.json'),
    json('content/gameplay-v1/domain-snapshot-v2.json'),
    json('content/gameplay-v1/task-014-parts.json'),
    json('content/gameplay-v1/playable-coverage-v3.json'),
  ]);
  return createTask014Catalogs({ cards, decks, domain, parts, coverage });
}

async function task042Catalogs() {
  const [cards, decks, domain, parts, coverage] = await Promise.all([
    json('content/gameplay-v1/card-catalog-v4.json'),
    json('content/gameplay-v1/decks-v4.json'),
    json('content/gameplay-v1/domain-snapshot-v3.json'),
    json('content/gameplay-v1/task-042-parts.json'),
    json('content/gameplay-v1/playable-coverage-v4.json'),
  ]);
  return createTask042Catalogs({ cards, decks, domain, parts, coverage });
}

function diagnosticIds(catalogs) {
  return catalogs.cards.cards
    .filter((card) => card.play_contract?.contract_type === 'DIAGNOSTIC')
    .map((card) => card.id)
    .sort();
}

function selectedAttempt(result) {
  return result.attempts.find((attempt) => attempt.attempt_id === result.selected_attempt_id) ?? null;
}

test('ordinary Play loads the additive TASK-042 catalogs without changing Tutorial sources', async () => {
  const requested = [];
  const contentRoot = new URL('content/gameplay-v1/', repositoryRootUrl);
  const catalog = await loadPlayCatalog({
    cache: false,
    contentRoot,
    async fetchImpl(input) {
      requested.push(new URL(input).pathname.split('/').at(-1));
      return fileFetch(input);
    },
  });
  assert.deepEqual(requested.sort(), [
    'card-catalog-v4.json',
    'decks-v4.json',
    'domain-snapshot-v3.json',
    'playable-coverage-v4.json',
    'task-042-parts.json',
  ]);
  assert.equal(catalog.cards.card_catalog_version, 'core-card-catalog-story-expansion-v5');
  assert.equal(catalog.decks.deck_catalog_version, 'core-response-decks-v5');
  assert.equal(catalog.domain.domain_content_version, 'core-domain-snapshot-story-expansion-v4');
  assert.equal(catalog.parts.part_catalog_version, 'ticket-parts-v2');
  assert.equal(catalog.coverage.coverage_version, 'playable-coverage-v5');
  assert.equal(catalog.cards.cards.length, 83);
  assert.equal(catalog.coverage.fingerprints.length, 18);
  assert.ok(catalog.deckById.has('deck.story.expansion_response_v1'));

  const source = await readFile(new URL('viewer/js/play/catalog-service.mjs', repositoryRootUrl), 'utf8');
  const tutorialSection = source.slice(source.indexOf('export async function loadTutorialCatalog'));
  for (const legacyTutorialSource of [
    'card-catalog.json',
    'decks.json',
    'domain-snapshot.json',
    'ticket-templates.json',
    'domain-snapshot-v2.json',
    'tutorials-v1.json',
  ]) assert.match(tutorialSection, new RegExp(legacyTutorialSource.replaceAll('.', '\\.')));
});

test('v5 client context preserves valid v4 custom decks and v4 export imports', async () => {
  const [v4Cards, v4Decks, v5Cards, v5Decks] = await Promise.all([
    json('content/gameplay-v1/card-catalog-v3.json'),
    json('content/gameplay-v1/decks-v3.json'),
    json('content/gameplay-v1/card-catalog-v4.json'),
    json('content/gameplay-v1/decks-v4.json'),
  ]);
  const v4Context = createClientDataContext({ cardCatalog: v4Cards, deckCatalog: v4Decks });
  const v5Context = createClientDataContext({ cardCatalog: v5Cards, deckCatalog: v5Decks });
  const fresh = createDefaultState(v5Context);
  assert.equal(fresh.records.decks.card_catalog_version, 'core-card-catalog-story-expansion-v5');
  assert.equal(fresh.records.decks.decks[0].source_deck_id, 'deck.core.multisystem_response_v3');
  assert.ok(v5Context.knownCardIds.has('card.response.repair.compute.restore_socket_contacts'));

  const prior = createDefaultState(v4Context);
  const starter = prior.records.decks.decks[0];
  const custom = {
    deck_id: 'deck.local.task046.preserved',
    display_name: 'Preserved v4 custom deck',
    source_deck_id: null,
    card_definition_ids: [...starter.card_definition_ids],
  };
  prior.records.decks = saveDeck(prior.records.decks, custom, v4Context);
  prior.records.decks.active_deck_id = custom.deck_id;

  const migratedState = migrateLocalState(prior, v5Context);
  assert.equal(migratedState.records.decks.card_catalog_version, 'core-card-catalog-story-expansion-v5');
  assert.equal(migratedState.records.decks.active_deck_id, custom.deck_id);
  assert.deepEqual(
    migratedState.records.decks.decks.find((deck) => deck.deck_id === custom.deck_id),
    custom,
  );

  const priorExport = createExportBundle(prior, v4Context, '2026-08-29T12:00:00.000Z');
  const migratedExport = migrateExportBundle(priorExport, v5Context);
  assert.equal(migratedExport.records.decks.card_catalog_version, 'core-card-catalog-story-expansion-v5');
  assert.equal(migratedExport.records.decks.active_deck_id, custom.deck_id);
  assert.deepEqual(
    migratedExport.records.decks.decks.find((deck) => deck.deck_id === custom.deck_id),
    custom,
  );
});

test('combined registry preserves QC01 v3 pins and proves all six QC02 embedded v4 pins', async () => {
  const raw = await json('content/story-v1/campaigns/quiet-cascade-expansion-v3/matches.json');
  const registry = validateStoryMatchRegistry(raw);
  const [legacyCatalogs, currentCatalogs] = await Promise.all([task014Catalogs(), task042Catalogs()]);
  assert.equal(registry.matches.size, 12);

  const qc01 = registry.matches.get('story.match.qc01.shift01.wrong_device');
  assert.equal(qc01.builder_configuration, undefined);
  const legacyDeck = legacyCatalogs.decks.decks.find(
    (deck) => deck.id === registry.deckPolicy.canonical_proof_deck_id,
  );
  const qc01Configuration = createStoryBuilderConfiguration({
    registry,
    definition: qc01,
    cardDefinitionIds: legacyDeck.card_definition_ids,
    diagnosticCardIds: diagnosticIds(legacyCatalogs),
  });
  assert.equal(qc01Configuration.generator_version, 'ticket-builder-v3');
  const legacyResult = buildTicketsV3({ configuration: qc01Configuration, catalogs: legacyCatalogs });
  const legacyAttempt = selectedAttempt(legacyResult);
  assert.equal(legacyResult.status, 'SUCCESS');
  assert.deepEqual(legacyAttempt.ticket_snapshots.map((ticket) => ticket.id), qc01.expected_ticket_definition_ids);
  assert.deepEqual(legacyAttempt.ticket_snapshot_digests, qc01.expected_ticket_snapshot_digests);

  const expansionDeck = currentCatalogs.decks.decks.find(
    (deck) => deck.id === 'deck.story.expansion_response_v1',
  );
  for (const definition of [...registry.matches.values()].slice(6)) {
    assert.equal(definition.builder_configuration.configuration_version, 'ticket-builder-v4');
    assert.equal(preflightStoryDeck(definition, expansionDeck.card_definition_ids).ok, true);
    const configuration = createStoryBuilderConfiguration({
      registry,
      definition,
      cardDefinitionIds: expansionDeck.card_definition_ids,
      diagnosticCardIds: diagnosticIds(currentCatalogs),
    });
    assert.deepEqual(configuration, definition.builder_configuration);
    const result = buildTicketsV4({ configuration, catalogs: currentCatalogs });
    const attempt = selectedAttempt(result);
    assert.equal(result.status, 'SUCCESS', definition.match_ref);
    assert.deepEqual(attempt.ticket_snapshots.map((ticket) => ticket.id), definition.expected_ticket_definition_ids);
    assert.deepEqual(attempt.ticket_snapshot_digests, definition.expected_ticket_snapshot_digests);
  }

  const corrupt = structuredClone(raw);
  corrupt.matches[6].builder_configuration.available_card_definition_counts[
    'card.response.repair.compute.restore_socket_contacts'
  ] = 0;
  assert.throws(() => validateStoryMatchRegistry(corrupt), /cannot satisfy|integer from 1/);
});

test('QC02 active proof derives response resources from the actual deck, not fixture surplus', async () => {
  const [raw, catalogs] = await Promise.all([
    json('content/story-v1/campaigns/quiet-cascade-expansion-v3/matches.json'),
    task042Catalogs(),
  ]);
  const registry = validateStoryMatchRegistry(raw);
  const definition = registry.matches.get('story.match.qc02.shift07.socket_contacts');
  const canonical = catalogs.decks.decks.find((deck) => deck.id === definition.deck_pressure.deck_id);
  const actualDeck = [...canonical.card_definition_ids];
  const removedCard = 'card.response.repair.power.replace_distribution_board';
  const removedIndex = actualDeck.indexOf(removedCard);
  actualDeck[removedIndex] = 'card.response.verify.boot.normal_boot';
  assert.equal(preflightStoryDeck(definition, actualDeck).ok, true);

  const configuration = createStoryBuilderConfiguration({
    registry,
    definition,
    cardDefinitionIds: actualDeck,
    diagnosticCardIds: diagnosticIds(catalogs),
    configurationId: 'builder.story.preflight.07',
  });
  assert.equal(configuration.available_card_definition_counts[removedCard], 2);
  assert.equal(configuration.available_card_definition_counts['card.response.verify.boot.normal_boot'], 1);
  assert.equal(configuration.legal_card_definition_ids.includes('card.response.verify.boot.normal_boot'), true);
  assert.deepEqual(configuration.allowed_fingerprint_ids, definition.allowed_fingerprint_ids);
  assert.deepEqual(configuration.authored_difficulty_bounds, definition.builder_configuration.authored_difficulty_bounds);
  assert.deepEqual(configuration.diagnostic_card_definition_ids, definition.builder_configuration.diagnostic_card_definition_ids);
  const result = buildTicketsV4({ configuration, catalogs });
  assert.equal(result.status, 'SUCCESS');
  assert.equal(selectedAttempt(result).ticket_snapshots.length, 1);
});

test('Worker preflight launches QC01 with a mixed v5 deck and ordinary solo with expansion content', async () => {
  const original = {
    self: globalThis.self,
    fetch: globalThis.fetch,
    postMessage: globalThis.postMessage,
  };
  let messageListener = null;
  const messages = [];
  const generatedContentMarker = path.join('viewer', 'generated', 'play', 'content') + path.sep;

  globalThis.self = {
    addEventListener(type, listener) {
      if (type === 'message') messageListener = listener;
    },
  };
  globalThis.postMessage = (message) => messages.push(structuredClone(message));
  globalThis.fetch = async (input) => {
    const requestedPath = fileURLToPath(input instanceof URL ? input : new URL(input));
    const markerIndex = requestedPath.indexOf(generatedContentMarker);
    const canonicalPath = markerIndex === -1
      ? requestedPath
      : path.join(repositoryRoot, 'content', requestedPath.slice(markerIndex + generatedContentMarker.length));
    try {
      const value = JSON.parse(await readFile(canonicalPath, 'utf8'));
      return { ok: true, status: 200, async json() { return structuredClone(value); } };
    } catch {
      return { ok: false, status: 404, async json() { throw new Error('not found'); } };
    }
  };

  try {
    await import(`../viewer/js/play/solo-worker.mjs?task046=${Date.now()}`);
    assert.equal(typeof messageListener, 'function');
    const decks = await json('content/gameplay-v1/decks-v4.json');
    const expansionDeck = decks.decks.find((deck) => deck.id === 'deck.story.expansion_response_v1');
    const starter = decks.decks.find((deck) => deck.id === 'deck.core.multisystem_response_v3');

    await messageListener({ data: {
      type: 'PREFLIGHT_STORY_MATCH',
      payload: {
        match_ref: 'story.match.qc02.shift07.socket_contacts',
        card_definition_ids: expansionDeck.card_definition_ids,
      },
    } });
    assert.deepEqual(messages.at(-1), {
      type: 'STORY_MATCH_PREFLIGHT',
      result: {
        ok: true,
        code: 'READY',
        match_ref: 'story.match.qc02.shift07.socket_contacts',
        ticket_count: 1,
        missing: [],
      },
    });

    const mixedDeck = [...starter.card_definition_ids];
    mixedDeck[mixedDeck.length - 1] = 'card.response.repair.compute.restore_socket_contacts';
    messages.length = 0;
    await messageListener({ data: {
      type: 'START_MATCH',
      payload: {
        match_id: 'local.story.task046.qc01.mixed',
        seed: 'story.quiet_cascade.s01.v1',
        ticket_count: 1,
        display_name: 'Task 046',
        deck_id: 'deck.local.task046.mixed',
        card_definition_ids: mixedDeck,
        story_context: {
          schema_version: 'story-match-context-v1',
          context_token: 'story.context.task046.mixed',
          match_ref: 'story.match.qc01.shift01.wrong_device',
          checkpoint_id: 'checkpoint.qc01.shift01.pre_match',
          return_label: 'story.qc01.shift01.return',
        },
      },
    } });
    assert.deepEqual(messages.filter((message) => message.type === 'WORKER_ERROR'), []);
    assert.equal(messages.at(-1).type, 'MATCH_STARTED');
    assert.equal(messages.at(-1).story_context.match_ref, 'story.match.qc01.shift01.wrong_device');
    await messageListener({ data: { type: 'END_SESSION' } });
    assert.equal(messages.at(-1).type, 'SESSION_ENDED');

    messages.length = 0;
    await messageListener({ data: {
      type: 'START_MATCH',
      payload: {
        match_id: 'local.solo.task046.expansion',
        seed: 'task046.local.expansion',
        ticket_count: 1,
        display_name: 'Task 046',
        deck_id: expansionDeck.id,
        card_definition_ids: expansionDeck.card_definition_ids,
      },
    } });
    assert.deepEqual(messages.filter((message) => message.type === 'WORKER_ERROR'), []);
    assert.equal(messages.at(-1).type, 'MATCH_STARTED');
    assert.equal(messages.at(-1).story_context, null);
    await messageListener({ data: { type: 'END_SESSION' } });
  } finally {
    if (original.self === undefined) delete globalThis.self;
    else globalThis.self = original.self;
    if (original.fetch === undefined) delete globalThis.fetch;
    else globalThis.fetch = original.fetch;
    if (original.postMessage === undefined) delete globalThis.postMessage;
    else globalThis.postMessage = original.postMessage;
  }
});

test('canonical staging allowlist includes TASK-042 gameplay and the live expansion registry', async () => {
  const manifest = await createExpectedPlayManifest();
  const staged = new Map(manifest.files.map((entry) => [entry.path, entry.source]));
  for (const name of [
    'card-catalog-v4.json',
    'decks-v4.json',
    'domain-snapshot-v3.json',
    'task-042-parts.json',
    'playable-coverage-v4.json',
  ]) {
    assert.equal(staged.get(`content/gameplay-v1/${name}`), `content/gameplay-v1/${name}`);
  }
  assert.equal(
    staged.get('content/story-v1/campaigns/quiet-cascade-expansion-v3/matches.json'),
    'content/story-v1/campaigns/quiet-cascade-expansion-v3/matches.json',
  );
});
