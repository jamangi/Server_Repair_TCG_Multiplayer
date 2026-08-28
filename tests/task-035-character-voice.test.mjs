import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const ROOT = path.resolve(import.meta.dirname, '..');
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), 'utf8');
const readJson = (relative) => JSON.parse(read(relative));

const characters = read('docs/story/CHARACTERS.md');
const voice = read('docs/story/VOICE.md');
const references = read('docs/story/CHARACTER_REFERENCE_LEDGER.md');
const cards = read('docs/story/CHARACTER_VOICE_CARDS.md');
const draft = readJson('docs/story/revisions/quiet-cascade-characterization-v2/context-draft.en.json');
const registry = readJson('content/story-v1/campaigns/quiet-cascade/registry.json');

const ensemble = [
  'ev_shaw', 'inez_calder', 'malik_okoye', 'sora_chen', 'luis_ortega',
  'hana_park', 'bea_morgan', 'priya_nayar', 'jonah_reed',
];
const speakers = [
  'inez_calder', 'ev_shaw', 'malik_okoye', 'sora_chen', 'hana_park',
  'jonah_reed', 'priya_nayar',
];

function markedSection(source, marker, nextPattern) {
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, marker);
  const rest = source.slice(start + marker.length);
  const next = rest.search(nextPattern);
  return next === -1 ? rest : rest.slice(0, next);
}

test('all nine frozen ensemble identities have complete, continuity-safe deep bibles', () => {
  for (const id of ensemble) {
    const section = markedSection(characters, `<!-- character-bible:${id} -->`, /<!-- character-bible:|## Player authorship lock/);
    for (const field of [
      'Formation and path', 'Present life and interests', 'Inner engine',
      'Contradiction, blind spot, pressure, coping', 'Attention',
      'Relationships and registers', 'Language and teaching', 'Campaign-safe',
      'Iceberg', 'Continuity and art lock',
    ]) assert.match(section, new RegExp(field.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&')), `${id}: ${field}`);
  }
  assert.match(characters, /may not establish the player's birthplace, family, housing, education/);
  assert.equal(registry.characters.length, 7);
  assert.ok(registry.characters.every((character) => character.poses.length <= 2));
});

test('each reference constellation blends at least two verified public-domain sources', () => {
  const sourceIds = [...references.matchAll(/\| `([a-z-]+)` \|/g)].map((match) => match[1]);
  assert.equal(sourceIds.length, 11);
  assert.equal(new Set(sourceIds).size, 11);
  assert.equal((references.match(/marked public domain in the USA/g) ?? []).length, 11);
  assert.doesNotMatch(references, /^>/m);
  for (const id of ensemble) {
    const marker = references.match(new RegExp(`<!-- reference-constellation:${id} sources:([^ ]+) -->`));
    assert.ok(marker, id);
    const constellation = marker[1].split(',');
    assert.ok(constellation.length >= 2, id);
    assert.ok(constellation.every((sourceId) => sourceIds.includes(sourceId)), id);
  }
});

test('seven current speakers have three-register, payload-locked translation cards', () => {
  const candidateIds = new Set([
    ...draft.replacements.map((entry) => entry.text_id),
    ...draft.additions.map((entry) => entry.candidate_id),
  ]);
  for (const id of speakers) {
    const section = markedSection(cards, `<!-- voice-card:${id} -->`, /<!-- voice-card:|## Future-use notes/);
    for (const field of [
      'Fingerprint', 'Preferred', 'Avoided', 'Ordinary floor', 'Pressure/conflict',
      'Reflective/debrief', 'Bad generic version', 'Semantic-drift warning',
      'Relational exchange',
    ]) assert.match(section, new RegExp(field.replaceAll('/', '\\/')), `${id}: ${field}`);
    const samples = [...section.matchAll(/Translation exercise \d+ — `([^`]+)`/g)].map((match) => match[1]);
    assert.ok(samples.length >= 2, id);
    assert.ok(samples.every((candidateId) => candidateIds.has(candidateId)), `${id}: ${samples.join(', ')}`);
  }
  assert.match(cards, /<!-- future-voice:luis_ortega -->/);
  assert.match(cards, /<!-- future-voice:bea_morgan -->/);
});

test('translation method fixes the texture range and semantic anti-drift boundary', () => {
  assert.match(voice, /five to ten percent/i);
  assert.match(voice, /original\/context-draft\/final/);
  assert.match(voice, /must not change who observed a fact/);
  assert.match(voice, /must not assign the player a home, family, education/);
  assert.match(cards, /All fourteen translations preserve/);
});
