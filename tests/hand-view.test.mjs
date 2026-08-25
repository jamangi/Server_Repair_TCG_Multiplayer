import assert from 'node:assert/strict';
import test from 'node:test';

import {
  HAND_GROUP_PAGE_SIZE,
  HAND_GROUP_MIN_DESKTOP_WIDTH,
  firstEligibleInstance,
  groupHandInstances,
  handPageSizeForViewport,
  pageHandGroups,
} from '../viewer/js/play/hand-view.mjs';

test('hand grouping preserves first-definition order and every authoritative instance', () => {
  const hand = [
    { card_instance_id: 'instance.a1', card_definition_id: 'card.a' },
    { card_instance_id: 'instance.b1', card_definition_id: 'card.b' },
    { card_instance_id: 'instance.a2', card_definition_id: 'card.a' },
  ];
  const groups = groupHandInstances(hand);
  assert.deepEqual(groups.map((group) => group.card_definition_id), ['card.a', 'card.b']);
  assert.deepEqual(groups[0].instances, [hand[0], hand[2]]);
  assert.equal(groups.flatMap((group) => group.instances).length, hand.length);
  assert.equal(firstEligibleInstance(groups[0]), hand[0]);
});

test('hand groups only combine instances with the same visible and projected legal state', () => {
  const hand = [
    { card_instance_id: 'instance.a1', card_definition_id: 'card.a', visible_mode: 'ready' },
    { card_instance_id: 'instance.a2', card_definition_id: 'card.a', visible_mode: 'ready' },
    { card_instance_id: 'instance.a3', card_definition_id: 'card.a', visible_mode: 'locked' },
    { card_instance_id: 'instance.a4', card_definition_id: 'card.a', visible_mode: 'ready' },
  ];
  const legalIntents = [
    { intent_id: 'intent.1', card_instance_id: 'instance.a1', action_type: 'PLAY', ticket_instance_id: 'ticket.1' },
    { intent_id: 'intent.2', card_instance_id: 'instance.a2', action_type: 'PLAY', ticket_instance_id: 'ticket.1' },
    { intent_id: 'intent.4', card_instance_id: 'instance.a4', action_type: 'PLAY', ticket_instance_id: 'ticket.2' },
  ];

  const groups = groupHandInstances(hand, legalIntents);
  assert.deepEqual(groups.map((group) => group.instances.map((instance) => instance.card_instance_id)), [
    ['instance.a1', 'instance.a2'],
    ['instance.a3'],
    ['instance.a4'],
  ]);
  assert.equal(firstEligibleInstance(groups[0], legalIntents), hand[0]);
});

test('deterministic stack resolution keeps original hand order', () => {
  const hand = [
    { card_instance_id: 'instance.a2', card_definition_id: 'card.a' },
    { card_instance_id: 'instance.a1', card_definition_id: 'card.a' },
  ];
  const legalIntents = [
    { intent_id: 'intent.second', card_instance_id: 'instance.a1', action_type: 'PLAY' },
    { intent_id: 'intent.first', card_instance_id: 'instance.a2', action_type: 'PLAY' },
  ];
  const [group] = groupHandInstances(hand, legalIntents);
  assert.equal(firstEligibleInstance(group, legalIntents).card_instance_id, 'instance.a2');
  assert.deepEqual(group.instances.map((instance) => instance.card_instance_id), ['instance.a2', 'instance.a1']);
});

test('hand pages clamp deterministically at five definition groups', () => {
  const groups = Array.from({ length: 12 }, (_, index) => ({
    card_definition_id: `card.${index + 1}`,
    instances: [{ card_instance_id: `instance.${index + 1}` }],
  }));
  const first = pageHandGroups(groups, 1);
  const last = pageHandGroups(groups, 99);
  assert.equal(HAND_GROUP_PAGE_SIZE, 5);
  assert.deepEqual([first.start, first.end, first.page, first.pageCount], [1, 5, 1, 3]);
  assert.deepEqual([last.start, last.end, last.page, last.pageCount], [11, 12, 3, 3]);
  assert.deepEqual(last.groups.map((group) => group.card_definition_id), ['card.11', 'card.12']);
});

test('desktop hand capacity preserves the minimum usable card width', () => {
  assert.equal(HAND_GROUP_MIN_DESKTOP_WIDTH, 150);
  assert.equal(handPageSizeForViewport(1366), 4);
  assert.equal(handPageSizeForViewport(1699), 4);
  assert.equal(handPageSizeForViewport(1700), 5);
  assert.equal(handPageSizeForViewport(1920), 5);
  assert.equal(handPageSizeForViewport(2560), 5);
  assert.equal(handPageSizeForViewport(760), 5);
});
