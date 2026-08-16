import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ENTITY_TYPE_LABELS,
  ENTITY_TYPE_ORDER,
  categoryFor,
} from '../viewer/js/entity-types.js';
import { loadViewerContent } from './helpers/load-viewer-content.mjs';

test('Validation and Protocol are first-class tabs in the required order', () => {
  assert.equal(ENTITY_TYPE_LABELS.validation_procedure, 'Validations');
  assert.equal(ENTITY_TYPE_LABELS.protocol, 'Protocols');
  assert.deepEqual(
    ENTITY_TYPE_ORDER.slice(-3),
    ['validation_procedure', 'protocol', 'everything'],
  );
});

test('Protocol category filtering uses protocol_type', () => {
  assert.equal(
    categoryFor({ entity_type: 'protocol', protocol_type: 'change_control' }),
    'change_control',
  );
});

test('current content exposes the accepted tab counts', async () => {
  const { records } = await loadViewerContent();
  const count = (entityType) => records.filter((record) => record.entity_type === entityType).length;

  assert.equal(count('validation_procedure'), 13);
  assert.equal(count('protocol'), 12);
  assert.equal(records.length, 201);
});

