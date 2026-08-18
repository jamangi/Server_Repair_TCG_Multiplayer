import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ENTITY_TYPE_LABELS,
  ENTITY_TYPE_ORDER,
  categoryFor,
} from '../viewer/js/entity-types.js';
import { loadViewerContent } from './helpers/load-viewer-content.mjs';

test('the entity registry has a deterministic Everything terminus', () => {
  assert.deepEqual(
    ENTITY_TYPE_ORDER,
    [...Object.keys(ENTITY_TYPE_LABELS), 'everything'],
  );
});

test('existing category precedence is preserved', () => {
  assert.equal(categoryFor({ category: 'hardware', subsystem: 'memory' }), 'hardware');
  assert.equal(categoryFor({ subsystem: 'memory', platform: 'linux' }), 'memory');
  assert.equal(categoryFor({ test_type: 'diagnostic' }), 'diagnostic');
  assert.equal(categoryFor({ tool_type: 'meter' }), 'meter');
  assert.equal(categoryFor({ platform: 'linux' }), 'linux');
  assert.equal(categoryFor({}), '');
});

test('the generated manifest resolves to valid domain records', async () => {
  const { manifest, packs, records } = await loadViewerContent();

  assert.ok(manifest.files.length > 0);
  assert.equal(packs.length, manifest.files.length);
  assert.ok(records.length > 0);
  assert.ok(records.every((record) => typeof record.id === 'string' && record.id.length > 0));
  assert.ok(records.every((record) => typeof record.entity_type === 'string' && record.entity_type.length > 0));
  assert.equal(new Set(records.map((record) => record.id)).size, records.length, 'entity IDs are unique');

  for (const entityType of Object.keys(ENTITY_TYPE_LABELS)) {
    assert.ok(records.some((record) => record.entity_type === entityType), `${entityType} has content`);
  }
});
