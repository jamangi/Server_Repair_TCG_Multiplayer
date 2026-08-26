import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import {
  loadSchemaRegistry,
  validateJsonSchema,
} from './helpers/json-schema-validator.mjs';

const repositoryRoot = path.resolve(import.meta.dirname, '..');
const readJson = (relativePath) => JSON.parse(
  fs.readFileSync(path.join(repositoryRoot, relativePath), 'utf8'),
);

const registry = loadSchemaRegistry(repositoryRoot);
const schemaByTitle = new Map(registry.schemas.map(({ schema }) => [schema.title, schema]));
const cardSchema = schemaByTitle.get('Card Definition');
const cardInstanceSchema = schemaByTitle.get('Authoritative Card Instance');

const domainSnapshot = readJson('content/gameplay-v1/domain-snapshot.json');
const cardCatalog = readJson('content/gameplay-v1/card-catalog.json');
const decks = readJson('content/gameplay-v1/decks.json');
const domainById = new Map(domainSnapshot.entities.map((entity) => [entity.id, entity]));
const cardById = new Map(cardCatalog.cards.map((card) => [card.id, card]));

function loadViewerEntities() {
  const directory = path.join(repositoryRoot, 'viewer/content');
  const entities = [];
  for (const filename of fs.readdirSync(directory).filter((name) => name.endsWith('.json') && name !== 'manifest.json')) {
    const pack = JSON.parse(fs.readFileSync(path.join(directory, filename), 'utf8'));
    for (const entity of pack.entities) entities.push(entity);
  }
  return new Map(entities.map((entity) => [entity.id, entity]));
}

function validateExecutableCard(card, domainRecords) {
  const errors = [];
  const primary = domainRecords.get(card.primary_domain_reference.entity_id);
  if (!primary) {
    errors.push(`${card.id}: missing primary domain reference ${card.primary_domain_reference.entity_id}`);
  } else if (primary.entity_type !== card.primary_domain_reference.entity_type) {
    errors.push(`${card.id}: primary domain reference type does not match`);
  }
  if (card.primary_domain_reference.role !== 'execution') {
    errors.push(`${card.id}: primary domain reference is not the execution binding`);
  }

  for (const reference of card.additional_domain_references) {
    const entity = domainRecords.get(reference.entity_id);
    if (!entity) errors.push(`${card.id}: missing additional domain reference ${reference.entity_id}`);
    else if (entity.entity_type !== reference.entity_type) errors.push(`${card.id}: ${reference.entity_id} type does not match`);
  }

  const cardIllustration = card.presentation.illustration;
  const inheritedIllustration = card.primary_domain_reference.inherit_illustration
    ? primary?.presentation?.illustration
    : null;
  const resolvedIllustration = cardIllustration ?? inheritedIllustration;
  if (!resolvedIllustration?.asset_id || !resolvedIllustration?.alt_text) {
    errors.push(`${card.id}: illustration and nonempty alt text do not resolve`);
  }

  const contract = card.play_contract;
  if (contract.contract_type === 'DIAGNOSTIC') {
    if (contract.source_definition_id !== card.primary_domain_reference.entity_id) {
      errors.push(`${card.id}: diagnostic source differs from primary execution reference`);
    }
    if (contract.source_entity_type !== card.primary_domain_reference.entity_type) {
      errors.push(`${card.id}: diagnostic source type differs from primary execution reference`);
    }
    if (contract.resolution[0].source_definition_id !== contract.source_definition_id) {
      errors.push(`${card.id}: diagnostic resolution source differs from contract source`);
    }
    for (const componentId of contract.target_spec.allowed_component_definition_ids) {
      if (domainRecords.get(componentId)?.entity_type !== 'component') {
        errors.push(`${card.id}: diagnostic target ${componentId} is not a Component`);
      }
    }
  } else if (contract.contract_type === 'REPAIR') {
    if (contract.repair_procedure_id !== card.primary_domain_reference.entity_id) {
      errors.push(`${card.id}: Repair Procedure differs from primary execution reference`);
    }
    if (contract.resolution[0].repair_procedure_id !== contract.repair_procedure_id) {
      errors.push(`${card.id}: Repair resolution differs from contract procedure`);
    }
    for (const faultId of contract.target_spec.allowed_fault_definition_ids) {
      if (domainRecords.get(faultId)?.entity_type !== 'fault') {
        errors.push(`${card.id}: Repair target ${faultId} is not a Fault`);
      }
    }
  } else if (contract.contract_type === 'VERIFY') {
    if (contract.validation_procedure_id !== card.primary_domain_reference.entity_id) {
      errors.push(`${card.id}: Validation Procedure differs from primary execution reference`);
    }
    if (contract.resolution[0].validation_procedure_id !== contract.validation_procedure_id) {
      errors.push(`${card.id}: Verify resolution differs from contract procedure`);
    }
  } else {
    errors.push(`${card.id}: unsupported play-contract discriminator`);
  }

  return errors;
}

function validateCardInstanceSemantics(instance) {
  const errors = [];
  if (instance.zone !== 'in_play' && instance.controller_player_id !== instance.owner_player_id) {
    errors.push('non-persistent Card controller must equal its owner');
  }
  if (instance.zone === 'in_play' && instance.in_play_placement.scope === 'PLAYER'
      && instance.controller_player_id !== instance.in_play_placement.player_id) {
    errors.push('Player-scoped Card controller must equal placement Player');
  }
  return errors;
}

test('approved Card Definition and Card Instance schema IDs remain stable', () => {
  assert.equal(cardSchema.$id, 'https://example.local/schemas/card.schema.json');
  assert.equal(cardInstanceSchema.$id, 'https://example.local/runtime/card_instance.schema.json');
});

test('server-side domain snapshot is the exact selected 20-record illustrated identity subset', () => {
  assert.equal(domainSnapshot.domain_content_version, 'core-domain-snapshot-v1');
  assert.equal(domainSnapshot.entities.length, 20);
  assert.equal(domainById.size, 20);

  const expectedIds = [
    'command.linux.smartctl',
    'component.storage.raid_controller',
    'component.storage.sas_hdd',
    'edge.storage.sas_to_degraded',
    'fault.storage.cable.loose',
    'fault.storage.raid.controller_failed',
    'fault.storage.raid.degraded',
    'fault.storage.sas.drive_failed',
    'repair.storage.rebuild_array',
    'repair.storage.replace_raid_member',
    'repair.storage.reseat_cable',
    'symptom.storage.drive_missing',
    'symptom.storage.raid_degraded',
    'test.general.visual_inspection',
    'test.storage.device_inventory',
    'test.storage.drive_health',
    'test.storage.raid_status',
    'tool.storage.raid_console',
    'verify.storage.device_detected',
    'verify.storage.raid_healthy',
  ];
  assert.deepEqual([...domainById.keys()].sort(), expectedIds);

  const viewerById = loadViewerEntities();
  for (const entity of domainSnapshot.entities) {
    const source = viewerById.get(entity.id);
    assert.ok(source, `${entity.id} is absent from the selected viewer input`);
    assert.equal(entity.entity_type, source.entity_type, `${entity.id} type changed during snapshotting`);
    const { short_description: _legacyDescription, ...legacyPresentation } = entity.presentation;
    const { short_description: _currentDescription, ...currentPresentation } = source.presentation;
    assert.deepEqual(legacyPresentation, currentPresentation, `${entity.id} stable presentation changed during snapshotting`);
    assert.ok(entity.presentation.illustration.asset_id);
    assert.ok(entity.presentation.illustration.alt_text);
    for (const relationship of entity.relationships) {
      assert.ok(domainById.has(relationship.entity_id), `${entity.id} has unresolved relationship ${relationship.entity_id}`);
    }
  }
});

test('the published foundation catalog has eleven typed cards with exact executable bindings and illustrations', () => {
  assert.equal(cardCatalog.card_catalog_version, 'core-card-catalog-v1');
  assert.equal(cardCatalog.domain_content_version, domainSnapshot.domain_content_version);
  assert.equal(cardCatalog.ruleset_version, 'first-version-v1');
  assert.equal(cardCatalog.cards.length, 11);
  assert.equal(cardById.size, 11);

  const contractCounts = new Map();
  for (const card of cardCatalog.cards) {
    const schemaErrors = validateJsonSchema(card, cardSchema, registry);
    assert.deepEqual(schemaErrors, [], `${card.id}\n${schemaErrors.join('\n')}`);
    assert.equal(card.source.status, 'published');
    assert.doesNotMatch(card.id, /EX1/i);
    assert.equal(Object.hasOwn(card, 'effects'), false);
    assert.equal(Object.hasOwn(card, 'reference_entity_ids'), false);
    assert.deepEqual(validateExecutableCard(card, domainById), []);
    contractCounts.set(card.play_contract.contract_type, (contractCounts.get(card.play_contract.contract_type) ?? 0) + 1);
  }
  assert.deepEqual(Object.fromEntries(contractCounts), {
    DIAGNOSTIC: 6,
    REPAIR: 3,
    VERIFY: 2,
  });
});

test('the foundation and deliberate stalemate decks are legal 30-card snapshots', () => {
  assert.equal(decks.ruleset_version, 'first-version-v1');
  assert.equal(decks.card_catalog_version, cardCatalog.card_catalog_version);
  assert.equal(decks.decks.length, 2);
  const deck = decks.decks.find((entry) => entry.id === 'deck.core.storage_foundation');
  assert.ok(deck);
  assert.equal(deck.id, 'deck.core.storage_foundation');
  assert.equal(deck.card_definition_ids.length, 30);
  assert.doesNotMatch(JSON.stringify(deck), /EX1/i);

  const counts = new Map();
  for (const cardId of deck.card_definition_ids) {
    assert.ok(cardById.has(cardId), `deck references missing ${cardId}`);
    counts.set(cardId, (counts.get(cardId) ?? 0) + 1);
  }
  assert.equal(counts.size, 10);
  assert.ok([...counts.values()].every((count) => count === 3));

  const stalemateDeck = decks.decks.find((entry) => entry.id === 'deck.fixture.storage.no_cable_repair');
  assert.ok(stalemateDeck);
  assert.equal(stalemateDeck.card_definition_ids.length, 30);
  assert.equal(stalemateDeck.card_definition_ids.includes('card.core.reseat_storage_cable'), false);
  const fixtureCounts = new Map();
  for (const cardId of stalemateDeck.card_definition_ids) {
    assert.ok(cardById.has(cardId), `fixture deck references missing ${cardId}`);
    fixtureCounts.set(cardId, (fixtureCounts.get(cardId) ?? 0) + 1);
  }
  assert.equal(fixtureCounts.size, 10);
  assert.ok([...fixtureCounts.values()].every((count) => count === 3));
});

test('legacy loose effects and mismatched executable bindings are rejected', () => {
  const source = structuredClone(cardCatalog.cards[0]);

  const legacyEffects = structuredClone(source);
  legacyEffects.effects = [{ effect_type: 'claim_ticket', parameters: {} }];
  assert.match(validateJsonSchema(legacyEffects, cardSchema, registry).join('\n'), /unexpected property effects/);

  const genericParameters = structuredClone(source);
  genericParameters.play_contract.resolution[0].parameters = { hidden_rule: true };
  assert.match(validateJsonSchema(genericParameters, cardSchema, registry).join('\n'), /unexpected property parameters/);

  const prohibitedTicketCategory = structuredClone(source);
  prohibitedTicketCategory.card_type = 'repair_ticket';
  assert.match(validateJsonSchema(prohibitedTicketCategory, cardSchema, registry).join('\n'), /not in enum/);

  const overCost = structuredClone(source);
  overCost.cost = 3;
  assert.match(validateJsonSchema(overCost, cardSchema, registry).join('\n'), /greater than maximum 2/);

  const emptyComponentTarget = structuredClone(cardById.get('card.core.drive_health_test'));
  emptyComponentTarget.play_contract.target_spec.allowed_component_definition_ids = [];
  assert.match(validateJsonSchema(emptyComponentTarget, cardSchema, registry).join('\n'), /fewer than 1 items/);

  const mismatchedSource = structuredClone(source);
  mismatchedSource.play_contract.resolution[0].source_definition_id = 'test.storage.drive_health';
  assert.match(validateExecutableCard(mismatchedSource, domainById).join('\n'), /resolution source differs/);

  const noResolvedIllustration = structuredClone(source);
  noResolvedIllustration.primary_domain_reference.inherit_illustration = false;
  assert.match(validateExecutableCard(noResolvedIllustration, domainById).join('\n'), /illustration and nonempty alt text do not resolve/);
});

test('the migrated Memory Diagnostic example uses the typed contract and explicit illustration inheritance', () => {
  const card = readJson('examples/domain/card.memory_diagnostic.json');
  assert.deepEqual(validateJsonSchema(card, cardSchema, registry), []);
  assert.equal(card.primary_domain_reference.entity_id, 'test.memory.diagnostic');
  assert.equal(card.primary_domain_reference.inherit_illustration, true);
  assert.equal(card.play_contract.source_definition_id, 'test.memory.diagnostic');
  assert.equal(card.play_contract.resolution[0].source_definition_id, 'test.memory.diagnostic');
  assert.equal(Object.hasOwn(card, 'effects'), false);
});

test('Card Instance schema enforces authoritative zones, typed placement, nullable cleanup control, and no extension bags', () => {
  const hand = {
    card_instance_id: 'cardinst_test_hand',
    card_definition_id: 'card.core.drive_health_test',
    owner_player_id: 'player_a',
    controller_player_id: 'player_a',
    zone: 'hand',
    in_play_placement: null,
    effect_state: null,
  };
  assert.deepEqual(validateJsonSchema(hand, cardInstanceSchema, registry), []);
  assert.deepEqual(validateCardInstanceSemantics(hand), []);

  const teamPersistent = {
    ...hand,
    card_instance_id: 'cardinst_test_team',
    controller_player_id: null,
    zone: 'in_play',
    in_play_placement: {
      scope: 'TEAM',
      player_id: null,
      team_id: 'team_a',
      ticket_instance_id: null,
      created_by_event_id: 'evt_install_team_001',
    },
  };
  assert.deepEqual(validateJsonSchema(teamPersistent, cardInstanceSchema, registry), []);

  const ticketPersistent = structuredClone(teamPersistent);
  ticketPersistent.card_instance_id = 'cardinst_test_ticket';
  ticketPersistent.in_play_placement.scope = 'TICKET';
  ticketPersistent.in_play_placement.team_id = null;
  ticketPersistent.in_play_placement.ticket_instance_id = 'ticketinst_1';
  assert.deepEqual(validateJsonSchema(ticketPersistent, cardInstanceSchema, registry), []);

  const staleZone = { ...hand, zone: 'exile' };
  assert.match(validateJsonSchema(staleZone, cardInstanceSchema, registry).join('\n'), /not in enum|matches 0 oneOf branches/);

  const staleOrientation = { ...hand, face_state: 'face_up' };
  assert.match(validateJsonSchema(staleOrientation, cardInstanceSchema, registry).join('\n'), /unexpected property face_state/);

  const extensionBag = { ...hand, counters: { undocumented: 1 } };
  assert.match(validateJsonSchema(extensionBag, cardInstanceSchema, registry).join('\n'), /unexpected property counters/);

  const nonPersistentPlacement = structuredClone(hand);
  nonPersistentPlacement.in_play_placement = ticketPersistent.in_play_placement;
  assert.match(validateJsonSchema(nonPersistentPlacement, cardInstanceSchema, registry).join('\n'), /matches 0 oneOf branches/);

  const nullHandController = { ...hand, controller_player_id: null };
  assert.match(validateJsonSchema(nullHandController, cardInstanceSchema, registry).join('\n'), /matches 0 oneOf branches/);

  const playerPersistentWithoutController = structuredClone(teamPersistent);
  playerPersistentWithoutController.in_play_placement.scope = 'PLAYER';
  playerPersistentWithoutController.in_play_placement.player_id = 'player_a';
  playerPersistentWithoutController.in_play_placement.team_id = null;
  assert.match(validateJsonSchema(playerPersistentWithoutController, cardInstanceSchema, registry).join('\n'), /expected type string/);

  const untypedEffectState = { ...hand, effect_state: { arbitrary: true } };
  assert.match(validateJsonSchema(untypedEffectState, cardInstanceSchema, registry).join('\n'), /expected const null/);

  const forgedController = { ...hand, controller_player_id: 'player_b' };
  assert.deepEqual(validateJsonSchema(forgedController, cardInstanceSchema, registry), []);
  assert.match(validateCardInstanceSemantics(forgedController).join('\n'), /controller must equal its owner/);
});

test('all 60 legacy authoritative Card Instances migrate without stale mutable fields', () => {
  const match = readJson('examples/runtime/match_state.after_closure.json');
  assert.equal(match.card_instances.length, 60);
  for (const instance of match.card_instances) {
    const errors = validateJsonSchema(instance, cardInstanceSchema, registry);
    assert.deepEqual(errors, [], `${instance.card_instance_id}\n${errors.join('\n')}`);
    assert.deepEqual(validateCardInstanceSemantics(instance), []);
    assert.equal(instance.in_play_placement, null);
    assert.equal(instance.effect_state, null);
    assert.equal(Object.hasOwn(instance, 'face_state'), false);
    assert.equal(Object.hasOwn(instance, 'counters'), false);
    assert.equal(Object.hasOwn(instance, 'runtime_tags'), false);
  }
});
