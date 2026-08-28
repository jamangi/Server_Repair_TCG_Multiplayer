import assert from 'node:assert/strict';
import test from 'node:test';

import { createStoryArtResolver, validateStoryArtManifest } from '../viewer/js/play/story-art-resolver.mjs';
import { buildStoryHomeModel, buildStorySceneModel } from '../viewer/js/play/story-ui-model.mjs';

test('TASK-028 Story art uses logical IDs and safe placeholders without filename derivation', () => {
  const calls = [];
  const resolver = createStoryArtResolver({
    playArtResolver: {
      resolveAssetById(assetId) {
        calls.push(assetId);
        if (assetId === 'decorative.home.night_shift_desk') {
          return { assetId, src: 'https://example.invalid/night.webp', alt: '', decorative: true };
        }
        return null;
      },
    },
  });
  const background = resolver.resolveBackground({
    asset_id: 'story.bg.trinity.inflow.predawn_storm',
  });
  const character = resolver.resolveCharacter({
    asset_id: 'story.char.inez_calder.focused',
    position: 'RIGHT',
  });

  assert.deepEqual(calls, ['decorative.home.night_shift_desk']);
  assert.equal(background.source, 'story-placeholder');
  assert.equal(background.requestedAssetId, 'story.bg.trinity.inflow.predawn_storm');
  assert.equal(character.src, null);
  assert.equal(character.position, 'right');
  assert.doesNotMatch(JSON.stringify(character), /inez-calder|focused\.(?:png|webp)/);
});

test('TASK-028 Story art manifest selects a responsive source and stays within its layer fallback', () => {
  const base = {
    layer: 'BACKGROUND',
    kind: 'fallback',
    sources: { desktop: 'fallback/desk.webp', mobile: 'fallback/desk_mobile.webp', reduced_data: 'fallback/desk_small.webp' },
    alt_text: '', decorative: true, fallback_asset_id: null,
    focal_point: { x: 0.5, y: 0.5 }, protected_zones: [],
  };
  const manifest = validateStoryArtManifest({
    asset_manifest_version: 'story-art-v1',
    campaign_id: 'story.campaign.quiet_cascade.v1',
    assets: {
      'story.fallback.background': base,
      'story.bg.trinity.inflow.predawn_storm': {
        ...base,
        kind: 'production',
        sources: { desktop: 'backgrounds/inflow.webp', mobile: 'backgrounds/inflow_mobile.webp', reduced_data: 'backgrounds/inflow_small.webp' },
        fallback_asset_id: 'story.fallback.background',
      },
    },
  });
  const resolver = createStoryArtResolver({
    manifest,
    manifestUrl: new URL('https://example.invalid/assets/story/manifest.json'),
    matchMediaImpl: () => ({ matches: true }),
    saveData: false,
  });
  const resolved = resolver.resolveBackground({ asset_id: 'story.bg.trinity.inflow.predawn_storm' });
  assert.equal(resolver.sourceProfile, 'mobile');
  assert.equal(resolved.src, 'https://example.invalid/assets/story/backgrounds/inflow_mobile.webp');
  assert.equal(resolved.fallback.assetId, 'story.fallback.background');
});

test('TASK-028 Story Home labels an interrupted Match as restart rather than resume', () => {
  const model = buildStoryHomeModel({
    status: 'INTERRUPTED_MATCH',
    chapter_title: 'Chapter Two',
    shift_title: 'Trace rotation',
    checkpoint_label: 'Before the thermal profile',
    interrupted_match: true,
  }, {
    activeDeck: { deck_id: 'deck.local.one', display_name: 'Response kit', legal: true },
  });

  assert.equal(model.primaryLabel, 'Restart Story Match');
  assert.match(model.explanation, /not saved/i);
  assert.match(model.explanation, /restart/i);
  assert.match(model.explanation, /does not resume/i);
  assert.equal(model.activeDeck.name, 'Response kit');
});

test('TASK-028 scene model exposes only the current display statement and deterministic choices', () => {
  const text = new Map([
    ['location.inflow', 'Inflow'],
    ['time.predawn', '05:42'],
    ['speaker.inez', 'Inez Calder'],
    ['line.current', 'The seal and the case file disagree.'],
    ['choice.observe', 'Record the packaging conflict.'],
  ]);
  const artResolver = {
    resolveBackground: (asset) => ({ assetId: asset.asset_id }),
    resolveCharacter: (asset) => ({ assetId: asset.asset_id }),
    resolveTransient: (asset) => ({ assetId: asset.asset_id }),
  };
  const model = buildStorySceneModel({
    schema_version: 'story-display-v1',
    background: {
      scene_id: 'scene.inflow.arrival',
      asset_id: 'story.bg.trinity.inflow.predawn_storm',
      location_text_id: 'location.inflow',
      time_text_id: 'time.predawn',
    },
    characters: [{
      tag: 'lead',
      character_id: 'story.char.inez_calder',
      name_text_id: 'speaker.inez',
      pose_id: 'focused',
      asset_id: 'story.char.inez_calder.focused',
      position: 'RIGHT',
    }],
    transient: [],
    screens: {
      dialogue: {
        kind: 'DIALOGUE',
        statement_id: 'statement.current',
        speaker_key: 'story.char.inez_calder',
        speaker_text_id: 'speaker.inez',
        text_id: 'line.current',
        style_key: 'dialogue',
      },
      choices: {
        choice_id: 'choice.arrival',
        prompt_text_id: 'choice.observe',
        options: [{ option_id: 'observe', text_id: 'choice.observe' }],
      },
      transcript: [],
      controls: { can_advance: false, awaiting_choice: true },
    },
  }, {
    resolveText: (id) => text.get(id) ?? id,
    resolveCharacterName: () => 'Unresolved character',
    artResolver,
  });

  assert.equal(model.location, 'Inflow');
  assert.equal(model.statement.text, 'The seal and the case file disagree.');
  assert.deepEqual(model.choices.map(({ optionId, text: optionText }) => ({ optionId, optionText })), [{
    optionId: 'observe',
    optionText: 'Record the packaging conflict.',
  }]);
  assert.equal(model.controls.advance, false);
  assert.equal(model.characters[0].position, 'right');
  assert.doesNotMatch(JSON.stringify(model), /future|hidden_fault|return_label/);
});
