import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const recipePath = path.join(repositoryRoot, 'docs/audio/sfx-recipe-catalog.json');
const uiPath = path.join(repositoryRoot, 'docs/audio/sfx-ui-catalog.json');

const REQUIRED_INTERACTION_FIELDS = [
  'id', 'destination', 'page', 'region', 'source_modules', 'control_family', 'inputs',
  'trigger_phase', 'event_type', 'eligibility', 'intent', 'priority', 'precedence',
  'cooldown_ms', 'dedupe_group', 'overlap_policy', 'suppression', 'recipe_id',
  'selector', 'audit_status', 'rationale',
];
const REQUIRED_RECIPE_FIELDS = [
  'id', 'prototype_id', 'label', 'family', 'status', 'duration_ms', 'attack_ms',
  'release_ms', 'filter', 'delay', 'gain_trim', 'maximum_simultaneous_voices',
  'interruption_group', 'sources', 'listening_note', 'production_use',
];
const REQUIRED_SOURCE_FIELDS = ['type', 'gain', 'start_frequency_hz', 'end_frequency_hz'];
const REQUIRED_FILTER_FIELDS = ['type', 'frequency_hz', 'q'];
const REQUIRED_DELAY_FIELDS = ['time_ms', 'wet_mix', 'feedback'];
const RECIPE_CATALOG_FIELDS = [
  'schema_version', 'source_prototype', 'prototype_recipe_count',
  'production_extension_count', 'runtime_policy', 'recipes',
];
const UI_CATALOG_FIELDS = ['schema_version', 'audit_date', 'scope', 'intent_precedence', 'interactions'];
const RUNTIME_POLICY_FIELDS = ['global_max_voices', 'family_max_voices', 'interruption_groups'];
const INTENTS = new Set(['CURSOR', 'SELECT', 'CANCEL', 'POPUP_OPEN', 'POPUP_CLOSE', 'ERROR', 'SWIPE', 'NO_SFX']);
const PROTOTYPE_IDS = new Set([
  'cancel1', 'cancel2', 'cursor1', 'cursor2', 'cursor3', 'cursor4', 'popupClose',
  'popupOpen', 'select1', 'select2', 'swipe1', 'swipe2',
]);
const REQUIRED_DESTINATIONS = new Set([
  'GLOBAL', 'LIBRARY', 'PLAY_HOME', 'PLAY_DECKS', 'PLAY_DECK_EDITOR', 'PLAY_PROFILE',
  'PLAY_STORY_HOME', 'PLAY_STORY_SCENE', 'PLAY_GAME', 'PLAY_GAME_RESULT', 'PLAY_ALL',
]);

async function parseJson(relativePath) {
  const absolutePath = path.join(repositoryRoot, relativePath);
  return JSON.parse(await readFile(absolutePath, 'utf8'));
}

function uniqueIds(records, label) {
  const ids = records.map((record) => record.id);
  assert.equal(new Set(ids).size, ids.length, `${label} IDs must be unique`);
}

function exactFields(record, fields, label) {
  assert.ok(record && typeof record === 'object' && !Array.isArray(record), `${label} must be an object`);
  assert.deepEqual(Object.keys(record).sort(), [...fields].sort(), `${label} fields`);
}

function validateRecipe(recipe, runtimePolicy) {
  exactFields(recipe, REQUIRED_RECIPE_FIELDS, recipe?.id ?? 'Recipe');
  assert.match(recipe.id, /^sfx\.[a-z]+\.[a-z]+$/);
  assert.ok(INTENTS.has(recipe.family) && recipe.family !== 'NO_SFX');
  assert.ok(['APPROVED', 'RETAINED_VARIANT', 'EXCLUDED', 'PRODUCTION_EXTENSION'].includes(recipe.status));
  assert.ok(recipe.duration_ms >= 10 && recipe.duration_ms <= 250);
  assert.ok(recipe.attack_ms >= 0 && recipe.attack_ms <= 30);
  assert.ok(recipe.release_ms > 0 && recipe.release_ms <= recipe.duration_ms);
  exactFields(recipe.filter, REQUIRED_FILTER_FIELDS, `${recipe.id} filter`);
  assert.ok(['highpass', 'lowpass', 'bandpass'].includes(recipe.filter.type));
  assert.ok(recipe.filter.frequency_hz >= 20 && recipe.filter.frequency_hz <= 20_000);
  assert.ok(recipe.filter.q > 0 && recipe.filter.q <= 20);
  exactFields(recipe.delay, REQUIRED_DELAY_FIELDS, `${recipe.id} delay`);
  assert.ok(recipe.delay.time_ms >= 0 && recipe.delay.time_ms <= 100);
  assert.ok(recipe.delay.wet_mix >= 0 && recipe.delay.wet_mix <= 0.3);
  assert.ok(recipe.delay.feedback >= 0 && recipe.delay.feedback <= 0.25);
  assert.ok(recipe.gain_trim > 0 && recipe.gain_trim <= 1);
  assert.equal(recipe.maximum_simultaneous_voices, runtimePolicy.family_max_voices[recipe.family]);
  assert.ok(recipe.maximum_simultaneous_voices <= runtimePolicy.global_max_voices);
  assert.equal(recipe.interruption_group, runtimePolicy.interruption_groups[recipe.family]);
  assert.ok(recipe.sources.length >= 1 && recipe.sources.length <= 3);
  for (const [index, source] of recipe.sources.entries()) {
    exactFields(source, REQUIRED_SOURCE_FIELDS, `${recipe.id} source ${index}`);
    assert.ok(['noise', 'sine', 'square', 'triangle'].includes(source.type));
    assert.ok(source.gain > 0 && source.gain <= 1);
    assert.ok(source.start_frequency_hz >= 0 && source.start_frequency_hz <= 20_000);
    assert.ok(source.end_frequency_hz >= 0 && source.end_frequency_hz <= 20_000);
    if (source.type === 'noise') {
      assert.equal(source.start_frequency_hz, 0);
      assert.equal(source.end_frequency_hz, 0);
    } else {
      assert.ok(source.start_frequency_hz >= 20);
      assert.ok(source.end_frequency_hz >= 20);
    }
  }
  assert.ok(recipe.listening_note.trim());
  assert.ok(recipe.production_use.trim());
}

function validateInteraction(interaction, recipesById) {
  assert.deepEqual(Object.keys(interaction).sort(), [...REQUIRED_INTERACTION_FIELDS].sort(), `${interaction.id} fields`);
  assert.match(interaction.id, /^[a-z][a-z0-9]*(?:\.[a-z0-9]+)+$/);
  assert.ok(INTENTS.has(interaction.intent), `${interaction.id} intent`);
  assert.ok(Number.isInteger(interaction.priority) && interaction.priority >= 0 && interaction.priority <= 100);
  assert.ok(Number.isInteger(interaction.cooldown_ms) && interaction.cooldown_ms >= 0 && interaction.cooldown_ms <= 1_000);
  assert.ok(['drop', 'interrupt', 'mix', 'none'].includes(interaction.overlap_policy));
  assert.ok(interaction.source_modules.length > 0);
  assert.ok(interaction.inputs.length > 0);
  assert.ok(interaction.rationale.trim());

  if (interaction.intent === 'NO_SFX') {
    assert.equal(interaction.recipe_id, null, `${interaction.id} must not reference a recipe`);
    assert.equal(interaction.audit_status, 'NO_SFX');
  } else {
    assert.equal(interaction.audit_status, 'MAPPED');
    const recipe = recipesById.get(interaction.recipe_id);
    assert.ok(recipe, `${interaction.id} references a known recipe`);
    assert.notEqual(recipe.status, 'EXCLUDED', `${interaction.id} cannot reference an excluded recipe`);
    assert.equal(recipe.family, interaction.intent, `${interaction.id} recipe family matches intent`);
  }
}

export function catalogTotals(uiCatalog) {
  const intents = {};
  const destinations = {};
  for (const interaction of uiCatalog.interactions) {
    intents[interaction.intent] = (intents[interaction.intent] ?? 0) + 1;
    destinations[interaction.destination] = (destinations[interaction.destination] ?? 0) + 1;
  }
  return {
    total: uiCatalog.interactions.length,
    audible: uiCatalog.interactions.filter((entry) => entry.intent !== 'NO_SFX').length,
    silent: uiCatalog.interactions.filter((entry) => entry.intent === 'NO_SFX').length,
    intents,
    destinations,
  };
}

export async function validateSfxCatalogs({ checkMarkdown = true } = {}) {
  const [recipeCatalog, uiCatalog] = await Promise.all([
    parseJson('docs/audio/sfx-recipe-catalog.json'),
    parseJson('docs/audio/sfx-ui-catalog.json'),
  ]);

  exactFields(recipeCatalog, RECIPE_CATALOG_FIELDS, 'Recipe catalog');
  exactFields(uiCatalog, UI_CATALOG_FIELDS, 'UI catalog');
  exactFields(recipeCatalog.runtime_policy, RUNTIME_POLICY_FIELDS, 'Runtime policy');
  assert.equal(recipeCatalog.schema_version, 'sfx-recipe-catalog-v1');
  assert.equal(uiCatalog.schema_version, 'sfx-ui-catalog-v1');
  uniqueIds(recipeCatalog.recipes, 'Recipe');
  uniqueIds(uiCatalog.interactions, 'Interaction');

  for (const recipe of recipeCatalog.recipes) validateRecipe(recipe, recipeCatalog.runtime_policy);
  const prototypeRecipes = recipeCatalog.recipes.filter((recipe) => recipe.prototype_id !== null);
  assert.equal(prototypeRecipes.length, recipeCatalog.prototype_recipe_count);
  assert.equal(recipeCatalog.recipes.length - prototypeRecipes.length, recipeCatalog.production_extension_count);
  assert.deepEqual(new Set(prototypeRecipes.map((recipe) => recipe.prototype_id)), PROTOTYPE_IDS);
  assert.ok(Number.isInteger(recipeCatalog.runtime_policy.global_max_voices));
  assert.ok(recipeCatalog.runtime_policy.global_max_voices >= 1 && recipeCatalog.runtime_policy.global_max_voices <= 16);
  for (const family of [...INTENTS].filter((intent) => intent !== 'NO_SFX')) {
    assert.ok(Number.isInteger(recipeCatalog.runtime_policy.family_max_voices[family]));
    assert.ok(recipeCatalog.runtime_policy.family_max_voices[family] >= 1);
    assert.ok(recipeCatalog.runtime_policy.interruption_groups[family]);
  }
  assert.deepEqual(
    new Set(Object.keys(recipeCatalog.runtime_policy.family_max_voices)),
    new Set([...INTENTS].filter((intent) => intent !== 'NO_SFX')),
  );
  assert.deepEqual(
    new Set(Object.keys(recipeCatalog.runtime_policy.interruption_groups)),
    new Set([...INTENTS].filter((intent) => intent !== 'NO_SFX')),
  );

  const recipesById = new Map(recipeCatalog.recipes.map((recipe) => [recipe.id, recipe]));
  for (const interaction of uiCatalog.interactions) validateInteraction(interaction, recipesById);
  assert.deepEqual(new Set(uiCatalog.interactions.map((entry) => entry.destination)), REQUIRED_DESTINATIONS);
  assert.deepEqual(uiCatalog.intent_precedence, ['ERROR', 'CANCEL', 'POPUP_OPEN', 'POPUP_CLOSE', 'SWIPE', 'SELECT', 'CURSOR', 'NO_SFX']);

  const sourceModules = new Set(uiCatalog.interactions.flatMap((entry) => entry.source_modules));
  for (const sourceModule of sourceModules) await access(path.join(repositoryRoot, sourceModule));
  for (const requiredModule of [
    'viewer/js/app.js', 'viewer/js/library-view.js', 'viewer/js/play/settings-dialog.mjs',
    'viewer/js/play/pages/home-page.mjs', 'viewer/js/play/pages/decks-page.mjs',
    'viewer/js/play/pages/profile-page.mjs', 'viewer/js/play/pages/story-home-page.mjs',
    'viewer/js/play/pages/story-scene-page.mjs', 'viewer/js/play/pages/game-page.mjs',
  ]) assert.ok(sourceModules.has(requiredModule), `${requiredModule} is covered by the audit`);

  const totals = catalogTotals(uiCatalog);
  assert.equal(totals.audible + totals.silent, totals.total);
  for (const intent of INTENTS) assert.ok(totals.intents[intent] > 0, `${intent} has at least one audited family`);

  const serializedRecipes = JSON.stringify(recipeCatalog);
  assert.doesNotMatch(serializedRecipes, /https?:\/\//i, 'recipe catalog has no network asset references');
  assert.doesNotMatch(serializedRecipes, /\.(?:mp3|wav|ogg|aac|flac)\b/i, 'recipe catalog has no audio assets');

  if (checkMarkdown) {
    const [recipeMarkdown, uiMarkdown] = await Promise.all([
      readFile(path.join(repositoryRoot, 'docs/audio/SFX_RECIPE_CATALOG.md'), 'utf8'),
      readFile(path.join(repositoryRoot, 'docs/audio/SFX_UI_CATALOG.md'), 'utf8'),
    ]);
    assert.match(recipeMarkdown, new RegExp(`Prototype recipes reviewed:\\s*\\*\\*${recipeCatalog.prototype_recipe_count}\\*\\*`));
    assert.match(recipeMarkdown, /Cancel A[\s\S]*Cancel B[\s\S]*Cursor A[\s\S]*Cursor B[\s\S]*Cursor C[\s\S]*Cursor D[\s\S]*Popup Close[\s\S]*Popup Open[\s\S]*Select A[\s\S]*Select B[\s\S]*Swipe A[\s\S]*Swipe B/);
    assert.ok(uiMarkdown.includes(`<!-- SFX_UI_TOTAL=${totals.total} -->`));
    assert.ok(uiMarkdown.includes(`<!-- SFX_UI_AUDIBLE=${totals.audible} -->`));
    assert.ok(uiMarkdown.includes(`<!-- SFX_UI_SILENT=${totals.silent} -->`));
    for (const [intent, count] of Object.entries(totals.intents)) {
      assert.ok(uiMarkdown.includes(`<!-- SFX_INTENT_${intent}=${count} -->`), `${intent} Markdown total`);
    }
  }

  return { recipeCatalog, uiCatalog, totals };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { recipeCatalog, totals } = await validateSfxCatalogs();
  console.log(`SFX catalog validation passed: ${recipeCatalog.prototype_recipe_count} prototype recipes, ${totals.total} interaction families (${totals.audible} audible, ${totals.silent} NO_SFX).`);
}
