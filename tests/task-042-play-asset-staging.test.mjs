import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  createExpectedPlayManifest,
} from '../viewer/scripts/build-play-assets.mjs';
import { verifyPlayAssets } from '../viewer/scripts/verify-play-assets.mjs';

const CONTENT_PREFIX = 'content/gameplay-v1/';
const OLD_LIVE_FILES = Object.freeze([
  'task-014-parts.json',
  'domain-snapshot-v2.json',
  'card-catalog-v3.json',
  'decks-v3.json',
  'playable-coverage-v3.json',
  'technical-copy-review-v1.json',
]);
const TASK_042_FILES = Object.freeze([
  'task-042-parts.json',
  'domain-snapshot-v3.json',
  'card-catalog-v4.json',
  'decks-v4.json',
  'playable-coverage-v4.json',
  'technical-copy-review-v2.json',
]);

test('stages TASK-042 content beside immutable current-live gameplay content', async () => {
  const manifest = await createExpectedPlayManifest();
  const byOutput = new Map(manifest.files.map((entry) => [entry.path, entry]));

  for (const filename of [...OLD_LIVE_FILES, ...TASK_042_FILES]) {
    const output = `${CONTENT_PREFIX}${filename}`;
    const entry = byOutput.get(output);
    assert.ok(entry, `missing staged gameplay artifact ${output}`);
    assert.equal(entry.source, output);
    assert.match(entry.sha256, /^[a-f0-9]{64}$/);
    assert.ok(entry.bytes > 0);
  }

  await verifyPlayAssets();
});

test('TASK-046 switches ordinary Play to TASK-042 while retaining QC01 legacy Builder inputs', async () => {
  const [catalogService, soloWorker] = await Promise.all([
    readFile('viewer/js/play/catalog-service.mjs', 'utf8'),
    readFile('viewer/js/play/solo-worker.mjs', 'utf8'),
  ]);

  for (const source of [catalogService, soloWorker]) {
    for (const filename of TASK_042_FILES.slice(0, 5)) {
      assert.match(source, new RegExp(filename.replaceAll('.', '\\.')));
    }
  }
  for (const filename of [
    'task-014-parts.json',
    'card-catalog-v3.json',
    'decks-v3.json',
    'playable-coverage-v3.json',
  ]) assert.doesNotMatch(catalogService, new RegExp(filename.replaceAll('.', '\\.')));
  for (const filename of OLD_LIVE_FILES.slice(0, 5)) {
    assert.match(soloWorker, new RegExp(filename.replaceAll('.', '\\.')));
  }
});
