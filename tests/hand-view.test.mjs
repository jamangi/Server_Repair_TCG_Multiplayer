import assert from 'node:assert/strict';
import test from 'node:test';

import {
  HAND_GROUP_PAGE_SIZE,
  groupHandInstances,
  instanceForGroup,
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
  assert.equal(instanceForGroup(groups[0], 'instance.a2'), hand[2]);
  assert.equal(instanceForGroup(groups[0], 'missing'), hand[0]);
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
