import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import {
  assertAllSchemaRefsResolve,
  validateJsonSchema,
} from './helpers/json-schema-validator.mjs';
import { validateStoryPack } from '../src/story/index.mjs';
import { createExpectedPlayManifest } from '../viewer/scripts/build-play-assets.mjs';

const repositoryRoot = path.resolve(import.meta.dirname, '..');
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(repositoryRoot, relativePath), 'utf8'));
const schemaFiles = ['schemas/story', 'schemas/client'].flatMap((directory) =>
  fs.readdirSync(path.join(repositoryRoot, directory))
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((name) => ({
      filePath: path.join(repositoryRoot, directory, name),
      schema: readJson(`${directory}/${name}`),
    })));
const registry = {
  schemas: schemaFiles,
  byId: new Map(schemaFiles.map(({ schema }) => [schema.$id, schema])),
};
const schema = (name) => registry.byId.get(`https://example.local/story/${name}.schema.json`);

function loadPack(relativeRoot) {
  const manifest = readJson(`${relativeRoot}/manifest.json`);
  return {
    manifest,
    registry: readJson(`${relativeRoot}/${manifest.registry}`),
    texts: Object.fromEntries(Object.entries(manifest.text_catalogs)
      .map(([locale, filename]) => [locale, readJson(`${relativeRoot}/${filename}`)])),
    scripts: manifest.scripts.map((filename) => readJson(`${relativeRoot}/${filename}`)),
  };
}

function assertPackSchemas(pack, label) {
  assert.deepEqual(validateJsonSchema(pack, schema('pack'), registry), [], `${label} loaded bundle`);
  assert.deepEqual(validateJsonSchema(pack.manifest, schema('manifest'), registry), [], `${label} manifest`);
  assert.deepEqual(validateJsonSchema(pack.registry, schema('registry'), registry), [], `${label} registry`);
  for (const [locale, catalog] of Object.entries(pack.texts)) {
    assert.deepEqual(validateJsonSchema(catalog, schema('text_catalog'), registry), [], `${label} ${locale} catalog`);
  }
  for (const script of pack.scripts) {
    assert.deepEqual(validateJsonSchema(script, schema('script'), registry), [], `${label} ${script.script_id}`);
  }
}

test('all Story and client schema references resolve from unique versioned IDs', () => {
  assert.equal(registry.byId.size, schemaFiles.length);
  assert.doesNotThrow(() => assertAllSchemaRefsResolve(registry));
  assert.equal(schema('manifest').title, 'Declarative Story pack manifest v1');
  assert.equal(schema('script').title, 'Declarative Story script v1');
  assert.equal(schema('checkpoint').title, 'Durable Story checkpoint v1');
});

test('non-canon proof and Quiet Cascade satisfy schemas plus semantic validation', () => {
  const fixture = loadPack('content/story-v1/fixtures/runtime-proof');
  const campaign = loadPack('content/story-v1/campaigns/quiet-cascade');
  assertPackSchemas(fixture, 'runtime proof');
  assertPackSchemas(campaign, 'Quiet Cascade');
  assert.deepEqual(validateStoryPack(fixture), []);
  assert.deepEqual(validateStoryPack(campaign), []);
});

test('Story checkpoint, result, and progress examples satisfy their strict schemas', () => {
  const examples = [
    ['examples/story/match-result.completed.json', schema('match_result')],
    ['examples/story/checkpoint.runtime-proof.json', schema('checkpoint')],
    ['examples/story/progress.empty.json', registry.byId.get('https://example.local/client/story_progress.schema.json')],
    ['examples/story/progress.runtime-proof.json', registry.byId.get('https://example.local/client/story_progress.schema.json')],
  ];
  for (const [filename, target] of examples) {
    assert.deepEqual(validateJsonSchema(readJson(filename), target, registry), [], filename);
  }
});

test('schemas and semantic validation reject executable, extra, or unresolved authored data', () => {
  const pack = loadPack('content/story-v1/fixtures/runtime-proof');
  const executable = structuredClone(pack.scripts[0]);
  executable.statements[3].callback = 'globalThis.alert(1)';
  assert.ok(validateJsonSchema(executable, schema('script'), registry).length > 0);

  const missingAsset = structuredClone(pack);
  missingAsset.scripts[0].statements[1].background_asset_id = 'asset.fixture.missing';
  assert.ok(validateStoryPack(missingAsset).some((entry) => entry.code === 'MISSING_ASSET'));

  const invalidCondition = structuredClone(pack.scripts[1]);
  invalidCondition.statements[6].condition = { op: 'EVAL', source: 'state.secret' };
  assert.ok(validateJsonSchema(invalidCondition, schema('script'), registry).length > 0);
});

test('canonical Play staging includes Story code and JSON but excludes Story art', async () => {
  const first = await createExpectedPlayManifest();
  const second = await createExpectedPlayManifest();
  assert.deepEqual(second, first);
  const outputs = new Set(first.files.map((entry) => entry.path));
  assert.ok(outputs.has('src/story/index.mjs'));
  assert.ok(outputs.has('content/story-v1/fixtures/runtime-proof/manifest.json'));
  assert.ok(outputs.has('content/story-v1/campaigns/quiet-cascade/manifest.json'));
  assert.equal(outputs.has('content/story-v1/campaigns/quiet-cascade/graph.json'), false);
  assert.equal(outputs.has('src/story/generate-quiet-cascade-reports.mjs'), false);
  assert.equal([...outputs].some((output) => output.startsWith('assets/story/')), false);
  assert.equal(outputs.size, first.files.length);
});
