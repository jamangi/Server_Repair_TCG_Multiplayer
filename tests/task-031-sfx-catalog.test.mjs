import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { catalogTotals, validateSfxCatalogs } from '../tools/validate-sfx-catalog.mjs';
import { validateJsonSchema } from './helpers/json-schema-validator.mjs';

test('TASK-031 catalogs are complete, internally consistent, and source-backed', async () => {
  const { recipeCatalog, uiCatalog, totals } = await validateSfxCatalogs();

  assert.equal(recipeCatalog.prototype_recipe_count, 12);
  assert.equal(recipeCatalog.recipes.filter((recipe) => recipe.prototype_id).length, 12);
  assert.deepEqual(catalogTotals(uiCatalog), totals);
  assert.equal(totals.total, 68);
  assert.equal(totals.silent, 13);
  const [recipeSchema, uiSchema] = await Promise.all([
    readFile(new URL('../schemas/client/sfx_recipe_catalog.schema.json', import.meta.url), 'utf8').then(JSON.parse),
    readFile(new URL('../schemas/client/sfx_ui_catalog.schema.json', import.meta.url), 'utf8').then(JSON.parse),
  ]);
  const registry = {
    schemas: [{ schema: recipeSchema }, { schema: uiSchema }],
    byId: new Map([[recipeSchema.$id, recipeSchema], [uiSchema.$id, uiSchema]]),
  };
  assert.deepEqual(validateJsonSchema(recipeCatalog, recipeSchema, registry), []);
  assert.deepEqual(validateJsonSchema(uiCatalog, uiSchema, registry), []);
});

test('the audit names representative mouse, keyboard, touch, value, dialog, error, and spatial routes', async () => {
  const { uiCatalog } = await validateSfxCatalogs();
  const interactions = uiCatalog.interactions;

  for (const input of ['mouse', 'keyboard', 'touch', 'programmatic']) {
    assert.ok(interactions.some((entry) => entry.inputs.includes(input)), `${input} is audited`);
  }
  for (const eventType of ['click', 'change', 'input', 'pointerover', 'focusin', 'drop', 'custom', 'none']) {
    assert.ok(interactions.some((entry) => entry.event_type === eventType), `${eventType} is audited`);
  }
  assert.ok(interactions.some((entry) => entry.intent === 'ERROR' && entry.trigger_phase === 'feedback'));
  assert.ok(interactions.some((entry) => entry.intent === 'SWIPE' && entry.trigger_phase === 'spatial_commit'));
  assert.ok(interactions.some((entry) => entry.intent === 'NO_SFX' && entry.id === 'story.scene.auto'));
});

test('all source-level interactive families are called out by the audit', async () => {
  const { uiCatalog } = await validateSfxCatalogs();
  const source = await Promise.all([
    'viewer/js/library-view.js',
    'viewer/js/play/settings-dialog.mjs',
    'viewer/js/play/pages/home-page.mjs',
    'viewer/js/play/pages/decks-page.mjs',
    'viewer/js/play/pages/profile-page.mjs',
    'viewer/js/play/pages/story-home-page.mjs',
    'viewer/js/play/pages/story-scene-page.mjs',
    'viewer/js/play/pages/game-page.mjs',
  ].map(async (file) => [file, await readFile(new URL(`../${file}`, import.meta.url), 'utf8')]));
  const coveredModules = new Set(uiCatalog.interactions.flatMap((entry) => entry.source_modules));

  for (const [file, text] of source) {
    assert.match(text, /<button|<a |<select|<input|<summary|createCardView/);
    assert.ok(coveredModules.has(file), `${file} has at least one catalog family`);
  }
});
