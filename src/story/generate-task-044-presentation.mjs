import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  createStoryState,
  reduceStory,
  validateStoryPack,
} from './index.mjs';

const ROOT = path.resolve(import.meta.dirname, '../..');
const CANDIDATE_ROOT = path.join(ROOT, 'content/story-v1/candidates/quiet-cascade-expansion-v3');
const REVISION_ROOT = path.join(ROOT, 'docs/story/revisions/quiet-cascade-expansion-v3');
const BLUEPRINT_PATH = path.join(REVISION_ROOT, 'blueprint.json');
const GRAPH_REPORT_PATH = path.join(REVISION_ROOT, 'GRAPH_REPORT.json');
const ART_MANIFEST_PATH = path.join(ROOT, 'viewer/assets/story/manifest.json');
const ART_INVENTORY_PATH = path.join(ROOT, 'docs/art/task-030-story-art-inventory.json');
const AUTHORED_METADATA_PATH = path.join(CANDIDATE_ROOT, 'authored-metadata.json');
const INHERITED_STORY_POINT_SENTINEL = 17;
const MOBILE_CHARACTER_REVIEW_LIMIT = 420;
const EXPECTED_ROUTE_COUNT = 256;

const OUTPUT_PATHS = Object.freeze({
  transcripts: path.join(REVISION_ROOT, 'FULL_ROUTE_TRANSCRIPTS.md'),
  choreography: path.join(REVISION_ROOT, 'CHOREOGRAPHY.md'),
  altText: path.join(REVISION_ROOT, 'ALT_TEXT_BRIEFS.md'),
  artRequestsMarkdown: path.join(REVISION_ROOT, 'ART_REQUESTS.md'),
  artRequestsJson: path.join(REVISION_ROOT, 'ART_REQUESTS.json'),
});

const clone = (value) => structuredClone(value);
const cleanPath = (value) => value.replaceAll('\\', '/');
const sorted = (values) => [...values].sort((left, right) => left.localeCompare(right));
const uniqueSorted = (values) => sorted(new Set(values));
const code = (value) => `\`${value}\``;
const list = (values) => values.length ? values.map(code).join(', ') : 'none';
const escapeCell = (value) => String(value).replaceAll('|', '\\|').replaceAll('\n', ' ');

function normalize(value) {
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, normalize(value[key])]));
  }
  return value;
}

const stableJson = (value) => `${JSON.stringify(normalize(value), null, 2)}\n`;
const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');
const readJson = async (filePath) => JSON.parse(await fs.readFile(filePath, 'utf8'));

function assertion(condition, message) {
  if (!condition) throw new Error(message);
}

async function fileRecord(filePath) {
  const bytes = await fs.readFile(filePath);
  return {
    path: cleanPath(path.relative(ROOT, filePath)),
    bytes: bytes.length,
    sha256: sha256(bytes),
  };
}

async function loadBundle() {
  const manifest = await readJson(path.join(CANDIDATE_ROOT, 'manifest.json'));
  return {
    manifest,
    registry: await readJson(path.join(CANDIDATE_ROOT, manifest.registry)),
    texts: {
      en: await readJson(path.join(CANDIDATE_ROOT, manifest.text_catalogs.en)),
    },
    scripts: await Promise.all(manifest.scripts.map((filename) => readJson(path.join(CANDIDATE_ROOT, filename)))),
  };
}

function statementRows(bundle) {
  return bundle.scripts.flatMap((script) => {
    let nearestLabel = null;
    return script.statements.map((statement, index) => {
      if (statement.type === 'label') nearestLabel = statement.label_id;
      return {
        script_id: script.script_id,
        chapter_id: script.chapter_id,
        index,
        nearest_label: nearestLabel,
        statement,
      };
    });
  });
}

function choiceCombinations(blueprint) {
  const choices = blueprint.remembered_choices;
  const combinations = [];
  for (let bits = 0; bits < 2 ** choices.length; bits += 1) {
    combinations.push(Object.fromEntries(choices.map((choice, index) => [
      choice.choice_id,
      choice.options[(bits >> index) & 1].option_id,
    ])));
  }
  return combinations;
}

function outcomePatterns(blueprint) {
  const episodes = blueprint.episodes;
  const patterns = [];
  for (let bits = 0; bits < 2 ** episodes.length; bits += 1) {
    const outcomes = Object.fromEntries(episodes.map((episode, index) => [
      episode.match_ref,
      ((bits >> index) & 1) === 1 ? 'COMPLETED' : 'ABANDONED',
    ]));
    patterns.push({
      pattern_index: bits,
      vector: episodes.map((episode) => outcomes[episode.match_ref] === 'COMPLETED' ? 'C' : 'A').join(''),
      outcomes,
    });
  }
  return patterns;
}

function routeMatchResult(routeKey, episode, completion) {
  const completed = completion === 'COMPLETED';
  const shift = String(episode.shift_number).padStart(2, '0');
  return {
    schema_version: 'story-match-result-v1',
    result_id: `result.qc02.${routeKey}.s${shift}`,
    match_id: `match.qc02.${routeKey}.s${shift}`,
    match_ref: episode.match_ref,
    completion,
    valid: true,
    reason_codes: [completed ? 'QUEUE_EMPTY' : 'GIVE_UP'],
    story_service_points_gained: completed ? 2 : 0,
    tickets_closed: completed ? 1 : 0,
    tickets_given_up: completed ? 0 : 1,
    documented_outcome: completed,
    verified_outcome: completed,
    contributions: {
      tests_run: completed ? 1 : 0,
      isolations_accepted: completed ? 1 : 0,
      repairs_performed: completed ? 1 : 0,
      verify_passes: completed ? 1 : 0,
      documentation_actions: completed ? 1 : 0,
    },
  };
}

function presentationState(state) {
  return {
    scene_id: state.display.background?.scene_id ?? null,
    background_asset_id: state.display.background?.asset_id ?? null,
    location_text: state.display.background?.location_text ?? null,
    time_text: state.display.background?.time_text ?? null,
    visible_character_pose_ids: state.display.characters.map((character) =>
      `${character.character_id}:${character.pose_id}`),
  };
}

function captureInteractiveEvent(state, selectedChoices) {
  const presentation = presentationState(state);
  if (state.current_statement?.type === 'say' || state.current_statement?.type === 'narrate') {
    return {
      event: state.current_statement.type === 'say' ? 'DIALOGUE' : 'NARRATION',
      ...clone(state.display.screens.dialogue),
      presentation,
    };
  }
  if (state.current_statement?.type === 'choice') {
    const choice = state.display.screens.choices;
    const selectedOptionId = selectedChoices[choice.choice_id];
    const selectedOption = choice.options.find((option) => option.option_id === selectedOptionId);
    assertion(selectedOption, `Route has no selected option for ${choice.choice_id}.`);
    return {
      event: 'CHOICE',
      choice_id: choice.choice_id,
      prompt_text_id: choice.prompt_text_id,
      prompt_text: choice.prompt_text,
      options: clone(choice.options),
      selected_option_id: selectedOptionId,
      selected_text: selectedOption.text,
      presentation,
    };
  }
  return null;
}

function effectsSummary(effects) {
  return {
    checkpoint_effect_count: effects.filter((effect) => effect.type === 'PERSIST_CHECKPOINT').length,
    start_match_effect_count: effects.filter((effect) => effect.type === 'START_MATCH').length,
    story_ended_effect_count: effects.filter((effect) => effect.type === 'STORY_ENDED').length,
    checkpoint_ids: effects
      .filter((effect) => effect.type === 'PERSIST_CHECKPOINT')
      .map((effect) => effect.checkpoint.checkpoint_id),
  };
}

function traverseRoute(bundle, blueprint, canonicalRoute, canonicalRouteIndex) {
  const routeId = canonicalRoute.route_id;
  const routeKey = canonicalRoute.digest.slice(0, 24);
  const choices = canonicalRoute.choices;
  const outcomes = canonicalRoute.match_outcomes;
  const outcomeVector = blueprint.episodes
    .map((episode) => outcomes[episode.match_ref] === 'COMPLETED' ? 'C' : 'A')
    .join('');
  assertion(typeof routeId === 'string' && routeId.startsWith('route.qc02.'),
    `Canonical route ${canonicalRouteIndex} lacks a stable TASK-043 route ID.`);
  assertion(/^[a-f0-9]{64}$/u.test(canonicalRoute.digest), `${routeId} lacks a canonical TASK-043 digest.`);
  const episodeByMatch = new Map(blueprint.episodes.map((episode) => [episode.match_ref, episode]));
  let state = createStoryState(bundle);
  state.story_service_points = INHERITED_STORY_POINT_SENTINEL;
  let transition = reduceStory(state, { type: 'BEGIN' }, bundle);
  state = transition.state;
  const effects = [...transition.effects];
  const events = [];
  const speakerVisibilityViolations = [];
  let steps = 1;

  while (state.status !== 'COMPLETE' && steps < 2048) {
    const interactive = captureInteractiveEvent(state, choices);
    if (interactive) events.push(interactive);
    if (state.current_statement?.type === 'say') {
      const dialogue = state.display.screens.dialogue;
      const visible = state.display.characters.some((character) => character.character_id === dialogue.speaker_key);
      if (!visible) speakerVisibilityViolations.push(dialogue.statement_id);
    }

    if (state.status === 'AWAITING_MATCH') {
      const pending = clone(state.pending_match);
      const episode = episodeByMatch.get(pending.match_ref);
      assertion(episode, `Unknown pending Match ${pending.match_ref}.`);
      const completion = outcomes[pending.match_ref];
      const result = routeMatchResult(routeKey, episode, completion);
      events.push({
        event: 'MATCH_START',
        match_ref: pending.match_ref,
        pre_match_checkpoint_id: pending.pre_match_checkpoint_id,
        post_match_checkpoint_id: pending.post_match_checkpoint_id,
        presentation: presentationState(state),
      });
      transition = reduceStory(state, { type: 'ACCEPT_MATCH_RESULT', result }, bundle);
      events.push({
        event: 'MATCH_RETURN',
        match_ref: pending.match_ref,
        completion,
        story_service_points_gained: result.story_service_points_gained,
        documented_outcome: result.documented_outcome,
        verified_outcome: result.verified_outcome,
        post_match_checkpoint_id: pending.post_match_checkpoint_id,
      });
    } else if (state.current_statement?.type === 'choice') {
      const choiceId = state.display.screens.choices.choice_id;
      transition = reduceStory(state, { type: 'CHOOSE', option_id: choices[choiceId] }, bundle);
    } else {
      transition = reduceStory(state, { type: 'ADVANCE' }, bundle);
    }
    state = transition.state;
    effects.push(...transition.effects);
    steps += 1;
  }

  assertion(state.status === 'COMPLETE', `${routeId} did not terminate.`);
  events.push({
    event: 'ENDING',
    ending_id: state.ending_id,
    final_story_service_points: state.story_service_points,
    presentation: presentationState(state),
  });

  const completedCount = Object.values(outcomes).filter((outcome) => outcome === 'COMPLETED').length;
  const effectAudit = effectsSummary(effects);
  return {
    route_id: routeId,
    canonical_route_index: canonicalRouteIndex,
    canonical_digest: canonicalRoute.digest,
    outcome_vector: outcomeVector,
    choices: clone(choices),
    match_results: blueprint.episodes.map((episode) => ({
      match_ref: episode.match_ref,
      completion: outcomes[episode.match_ref],
      story_service_points_gained: outcomes[episode.match_ref] === 'COMPLETED' ? 2 : 0,
    })),
    completed_match_count: completedCount,
    inherited_story_points_sentinel: INHERITED_STORY_POINT_SENTINEL,
    expansion_story_points_gained: completedCount * 2,
    final_story_service_points: state.story_service_points,
    ending_id: state.ending_id,
    steps,
    branch_history: clone(state.branch_history),
    match_history_count: state.match_results.length,
    speaker_visibility_violations: uniqueSorted(speakerVisibilityViolations),
    runtime_final_digest: transition.digest,
    event_counts: Object.fromEntries(uniqueSorted(events.map((event) => event.event)).map((kind) => [
      kind,
      events.filter((event) => event.event === kind).length,
    ])),
    ...effectAudit,
    events,
  };
}

function traverseAllRoutes(bundle, blueprint, graphReport) {
  assertion(graphReport.blueprint_id === blueprint.blueprint_id,
    'TASK-043 graph report and locked blueprint IDs diverge.');
  assertion(graphReport.totals.routes === EXPECTED_ROUTE_COUNT
    && graphReport.route_summary.route_count === EXPECTED_ROUTE_COUNT,
  'TASK-043 graph report does not declare the required 256 routes.');
  assertion(graphReport.routes.length === EXPECTED_ROUTE_COUNT,
    `TASK-043 graph report contains ${graphReport.routes.length}, not ${EXPECTED_ROUTE_COUNT}, routes.`);
  assertion(new Set(graphReport.routes.map((route) => route.route_id)).size === EXPECTED_ROUTE_COUNT,
    'TASK-043 graph report route IDs are not unique.');
  assertion(new Set(graphReport.routes.map((route) => route.digest)).size === EXPECTED_ROUTE_COUNT,
    'TASK-043 graph report route digests are not unique.');
  const routes = graphReport.routes.map((route, index) => traverseRoute(bundle, blueprint, route, index));
  assertion(routes.length === EXPECTED_ROUTE_COUNT, `Expected ${EXPECTED_ROUTE_COUNT} routes, found ${routes.length}.`);
  return routes;
}

function textSurfaceRows(bundle, rows) {
  const entries = bundle.texts.en.entries;
  const surfaces = [];
  const add = (row, kind, textId) => {
    const text = entries[textId];
    assertion(typeof text === 'string' && text.length > 0, `Missing displayed text ${textId}.`);
    surfaces.push({
      chapter_id: row.chapter_id,
      script_id: row.script_id,
      nearest_label: row.nearest_label,
      kind,
      text_id: textId,
      text,
      characters: [...text].length,
      words: text.trim().split(/\s+/u).filter(Boolean).length,
      inline_newlines: (text.match(/\r?\n/gu) ?? []).length,
    });
  };
  for (const row of rows) {
    const statement = row.statement;
    if (statement.type === 'say' || statement.type === 'narrate') add(row, statement.type.toUpperCase(), statement.text_id);
    if (statement.type === 'choice') {
      add(row, 'CHOICE_PROMPT', statement.prompt_text_id);
      for (const option of statement.options) add(row, 'CHOICE_OPTION', option.text_id);
    }
    if (statement.type === 'scene') {
      add(row, 'LOCATION', statement.location_text_id);
      add(row, 'TIME', statement.time_text_id);
    }
  }
  return surfaces;
}

function choreographyRows(rows) {
  return rows.flatMap((row) => {
    const statement = row.statement;
    const shared = {
      chapter_id: row.chapter_id,
      script_id: row.script_id,
      nearest_label: row.nearest_label,
      statement_index: row.index,
    };
    if (statement.type === 'scene') return [{
      ...shared,
      action: 'SCENE',
      stable_id: statement.scene_id,
      asset_or_target: statement.background_asset_id,
      position: 'FULL',
      transition: statement.transition,
      checkpoint_id: statement.checkpoint_id ?? null,
    }];
    if (statement.type === 'show' && statement.layer === 'characters') return [{
      ...shared,
      action: 'SHOW_CHARACTER',
      stable_id: statement.tag,
      asset_or_target: `${statement.character_id}:${statement.pose_id}`,
      position: statement.position,
      transition: statement.transition,
      checkpoint_id: null,
    }];
    if (statement.type === 'show' && statement.layer === 'transient') return [{
      ...shared,
      action: 'SHOW_TRANSIENT',
      stable_id: statement.tag,
      asset_or_target: statement.asset_id,
      position: statement.position,
      transition: statement.transition,
      checkpoint_id: null,
    }];
    if (statement.type === 'hide') return [{
      ...shared,
      action: `HIDE_${statement.layer.toUpperCase()}`,
      stable_id: statement.tag,
      asset_or_target: statement.tag,
      position: 'N/A',
      transition: statement.transition,
      checkpoint_id: null,
    }];
    if (statement.type === 'start_match') return [{
      ...shared,
      action: 'MATCH_BOUNDARY',
      stable_id: statement.match_ref,
      asset_or_target: statement.return_label,
      position: 'N/A',
      transition: 'RUNTIME_HANDOFF',
      checkpoint_id: `${statement.pre_match_checkpoint_id} / ${statement.post_match_checkpoint_id}`,
    }];
    return [];
  });
}

function reachableArt(bundle, blueprint, rows) {
  const characterMap = new Map(bundle.registry.characters.map((character) => [character.character_id, character]));
  const perEpisode = blueprint.episodes.map((episode) => {
    const episodeRows = rows.filter((row) => row.chapter_id === episode.episode_id);
    assertion(episodeRows.length > 0, `${episode.episode_id} has no authored presentation statements.`);
    const backgrounds = uniqueSorted(episodeRows.filter((row) => row.statement.type === 'scene')
      .map((row) => row.statement.background_asset_id));
    const characterPoses = uniqueSorted(episodeRows
      .filter((row) => row.statement.type === 'show' && row.statement.layer === 'characters')
      .map((row) => `${row.statement.character_id}:${row.statement.pose_id}`));
    const transientAssets = uniqueSorted(episodeRows
      .filter((row) => row.statement.type === 'show' && row.statement.layer === 'transient')
      .map((row) => row.statement.asset_id));
    const expectedBackgrounds = uniqueSorted(episode.art.background_asset_ids);
    const expectedCharacterPoses = uniqueSorted(episode.art.character_pose_ids);
    const expectedTransients = uniqueSorted(episode.art.transient_asset_ids);
    assertion(JSON.stringify(backgrounds) === JSON.stringify(expectedBackgrounds),
      `${episode.episode_id} background use diverges from its topology-locked blueprint.`);
    assertion(JSON.stringify(characterPoses) === JSON.stringify(expectedCharacterPoses),
      `${episode.episode_id} character-pose use diverges from its topology-locked blueprint.`);
    assertion(JSON.stringify(transientAssets) === JSON.stringify(expectedTransients),
      `${episode.episode_id} transient use diverges from its topology-locked blueprint.`);
    return {
      episode_id: episode.episode_id,
      shift_number: episode.shift_number,
      backgrounds,
      character_poses: characterPoses,
      transient_asset_ids: transientAssets,
      exact_blueprint_match: true,
    };
  });
  const backgrounds = uniqueSorted(perEpisode.flatMap((episode) => episode.backgrounds));
  const transientAssets = uniqueSorted(perEpisode.flatMap((episode) => episode.transient_asset_ids));
  const characterPoses = uniqueSorted(perEpisode.flatMap((episode) => episode.character_poses));
  const characterAssets = uniqueSorted(rows.filter((row) => row.statement.type === 'show' && row.statement.layer === 'characters')
    .map((row) => {
      const character = characterMap.get(row.statement.character_id);
      const pose = character?.poses.find((entry) => entry.pose_id === row.statement.pose_id);
      assertion(pose, `Unknown character pose ${row.statement.character_id}:${row.statement.pose_id}.`);
      return pose.asset_id;
    }));
  return {
    per_episode: perEpisode,
    backgrounds,
    character_poses: characterPoses,
    character_assets: characterAssets,
    transient_assets: transientAssets,
    all_production_asset_ids: uniqueSorted([...backgrounds, ...characterAssets, ...transientAssets]),
  };
}

async function auditAsset(assetId, bundle, artManifest, artInventory) {
  const manifestAsset = artManifest.assets[assetId];
  const inventoryAsset = artInventory.assets.find((entry) => entry.asset_id === assetId);
  const registryAsset = bundle.registry.assets.find((entry) => entry.asset_id === assetId);
  assertion(manifestAsset?.kind === 'production', `${assetId} is not an existing production asset.`);
  assertion(inventoryAsset?.kind === 'production', `${assetId} is absent from the approved TASK-030 inventory.`);
  assertion(registryAsset, `${assetId} is absent from the candidate registry.`);
  assertion(registryAsset.layer === manifestAsset.layer && manifestAsset.layer === inventoryAsset.layer,
    `${assetId} has a layer mismatch.`);
  assertion(typeof registryAsset.alt_text_id === 'string', `${assetId} lacks a localized alt-text ID.`);
  const localizedAlt = bundle.texts.en.entries[registryAsset.alt_text_id];
  assertion(typeof localizedAlt === 'string' && localizedAlt.length > 0, `${assetId} lacks localized alternative text.`);
  assertion(localizedAlt === manifestAsset.alt_text, `${assetId} localized alt text diverges from the approved pixels.`);
  assertion(inventoryAsset.alt_text === manifestAsset.alt_text, `${assetId} inventory and runtime alt text diverge.`);
  const variants = [];
  for (const variant of ['desktop', 'mobile', 'reduced_data']) {
    const relativePath = manifestAsset.sources[variant];
    const derivative = inventoryAsset.derivatives[variant];
    assertion(typeof relativePath === 'string' && derivative, `${assetId} lacks ${variant}.`);
    const absolutePath = path.join(ROOT, 'viewer/assets/story', relativePath);
    const record = await fileRecord(absolutePath);
    assertion(record.path === cleanPath(derivative.path), `${assetId} ${variant} path diverges from inventory.`);
    assertion(record.sha256 === derivative.sha256, `${assetId} ${variant} hash diverges from inventory.`);
    assertion(record.bytes === derivative.bytes, `${assetId} ${variant} byte count diverges from inventory.`);
    variants.push({ variant, ...record, width: derivative.width, height: derivative.height });
  }
  const fallback = artManifest.assets[manifestAsset.fallback_asset_id];
  const fallbackInventory = artInventory.assets.find((entry) => entry.asset_id === manifestAsset.fallback_asset_id);
  assertion(fallback?.kind === 'fallback' && fallback.layer === manifestAsset.layer,
    `${assetId} lacks a same-layer runtime fallback.`);
  assertion(fallbackInventory?.kind === 'fallback' && fallbackInventory.layer === manifestAsset.layer,
    `${assetId} lacks a same-layer inventory fallback.`);
  for (const variant of ['desktop', 'mobile', 'reduced_data']) {
    const fallbackPath = path.join(ROOT, 'viewer/assets/story', fallback.sources[variant]);
    const record = await fileRecord(fallbackPath);
    assertion(record.sha256 === fallbackInventory.derivatives[variant].sha256,
      `${assetId} fallback ${variant} hash diverges from inventory.`);
  }
  return {
    asset_id: assetId,
    layer: manifestAsset.layer,
    registry_alt_text_id: registryAsset.alt_text_id,
    alt_text: localizedAlt,
    decorative: manifestAsset.decorative,
    focal_point: clone(manifestAsset.focal_point),
    protected_zones: clone(manifestAsset.protected_zones),
    fallback_asset_id: manifestAsset.fallback_asset_id,
    responsive_variants: variants,
    review_state: inventoryAsset.review_state,
    exact_existing_reuse: true,
  };
}

function delayedAcknowledgementAudit(routes, blueprint, authoredMetadata, bundle) {
  const expectedRoutesPerVariant = EXPECTED_ROUTE_COUNT / 2;
  const choices = blueprint.remembered_choices.map((choice) => {
    const displays = authoredMetadata.displays
      .filter((display) => display.phase === 'DELAYED_CHOICE_ACK'
        && display.episode_id === choice.delayed_ack_episode_id
        && display.nearest_label.startsWith(`${choice.delayed_ack_label}.`))
      .sort((left, right) => left.statement_id.localeCompare(right.statement_id));
    assertion(displays.length === 2,
      `${choice.choice_id} must have exactly two delayed acknowledgement variants.`);
    const variants = displays.map((display) => {
      const option = choice.options.find((candidate) =>
        display.nearest_label === `${choice.delayed_ack_label}.${candidate.option_id}`);
      assertion(option, `${display.statement_id} does not map to a value of ${choice.choice_id}.`);
      const text = bundle.texts.en.entries[display.text_id];
      assertion(typeof text === 'string' && text.length > 0,
        `${display.statement_id} delayed acknowledgement text is missing.`);
      const routeCount = routes.filter((route) => route.events.some((event) =>
        event.event === 'DIALOGUE' && event.statement_id === display.statement_id)).length;
      assertion(routeCount === expectedRoutesPerVariant,
        `${display.statement_id} appears on ${routeCount}, not ${expectedRoutesPerVariant}, routes.`);
      const wrongValueRoutes = routes.filter((route) => route.events.some((event) =>
        event.event === 'DIALOGUE' && event.statement_id === display.statement_id)
        && route.choices[choice.choice_id] !== option.option_id);
      const missingValueRoutes = routes.filter((route) => route.choices[choice.choice_id] === option.option_id
        && !route.events.some((event) => event.event === 'DIALOGUE'
          && event.statement_id === display.statement_id));
      assertion(wrongValueRoutes.length === 0,
        `${display.statement_id} appears outside its ${option.option_id} routes.`);
      assertion(missingValueRoutes.length === 0,
        `${display.statement_id} is missing from ${missingValueRoutes.length} ${option.option_id} routes.`);
      return {
        option_id: option.option_id,
        statement_id: display.statement_id,
        text_id: display.text_id,
        nearest_label: display.nearest_label,
        text,
        route_count: routeCount,
        wrong_value_route_count: wrongValueRoutes.length,
        missing_value_route_count: missingValueRoutes.length,
      };
    });
    assertion(new Set(variants.map((variant) => variant.text)).size === 2,
      `${choice.choice_id} delayed acknowledgement variants are not distinct.`);
    return {
      choice_id: choice.choice_id,
      delayed_ack_episode_id: choice.delayed_ack_episode_id,
      delayed_ack_label: choice.delayed_ack_label,
      variant_count: variants.length,
      variants,
    };
  });
  assertion(choices.length === 2, `Expected two delayed choice acknowledgements, found ${choices.length}.`);
  return {
    choice_count: choices.length,
    variant_count: choices.reduce((total, choice) => total + choice.variant_count, 0),
    routes_per_variant: expectedRoutesPerVariant,
    choices,
  };
}

function routeAudit(routes, blueprint, authoredMetadata, bundle, graphReport) {
  const summaries = routes.map(({ events, ...route }) => route);
  const violations = uniqueSorted(routes.flatMap((route) => route.speaker_visibility_violations));
  const uniqueCanonicalDigests = new Set(routes.map((route) => route.canonical_digest)).size;
  const uniqueRuntimeDigests = new Set(routes.map((route) => route.runtime_final_digest)).size;
  const canonicalById = new Map(graphReport.routes.map((route) => [route.route_id, route]));
  const expectedCheckpointCount = 20;
  for (const route of routes) {
    const canonical = canonicalById.get(route.route_id);
    assertion(canonical, `${route.route_id} cannot join to the TASK-043 graph report.`);
    assertion(route.canonical_digest === canonical.digest,
      `${route.route_id} does not retain its exact TASK-043 digest.`);
    assertion(stableJson(route.choices) === stableJson(canonical.choices),
      `${route.route_id} choices diverge from the TASK-043 route.`);
    assertion(stableJson(Object.fromEntries(route.match_results.map((result) => [result.match_ref, result.completion])))
      === stableJson(canonical.match_outcomes),
    `${route.route_id} Match outcomes diverge from the TASK-043 route.`);
    assertion(route.expansion_story_points_gained === canonical.expansion_story_service_points_gained,
      `${route.route_id} point gain diverges from the TASK-043 route.`);
    assertion(route.match_history_count === 6, `${route.route_id} does not accept six Match results.`);
    assertion(route.start_match_effect_count === 6, `${route.route_id} does not launch six Matches.`);
    assertion(route.event_counts.MATCH_START === 6 && route.event_counts.MATCH_RETURN === 6,
      `${route.route_id} does not expose six Match transitions in its transcript.`);
    assertion(route.ending_id === blueprint.ending.ending_id, `${route.route_id} reaches an unexpected ending.`);
    assertion(route.checkpoint_effect_count === expectedCheckpointCount,
      `${route.route_id} emits ${route.checkpoint_effect_count}, not ${expectedCheckpointCount}, durable checkpoints.`);
    assertion(route.final_story_service_points === INHERITED_STORY_POINT_SENTINEL + route.expansion_story_points_gained,
      `${route.route_id} does not preserve inherited Story Service Points.`);
  }
  assertion(violations.length === 0, `Speaker visibility violations: ${violations.join(', ')}.`);
  assertion(uniqueCanonicalDigests === EXPECTED_ROUTE_COUNT,
    'Canonical TASK-043 route digests are not one-to-one with choice/outcome routes.');
  assertion(uniqueRuntimeDigests === EXPECTED_ROUTE_COUNT,
    'Candidate runtime final digests are not one-to-one with choice/outcome routes.');
  const delayedAcknowledgements = delayedAcknowledgementAudit(routes, blueprint, authoredMetadata, bundle);
  return {
    route_count: routes.length,
    choice_combination_count: new Set(routes.map((route) => stableJson(route.choices))).size,
    outcome_pattern_count: new Set(routes.map((route) => route.outcome_vector)).size,
    deterministic_digest_count: uniqueCanonicalDigests,
    runtime_digest_count: uniqueRuntimeDigests,
    canonical_graph_report: {
      report_version: graphReport.report_version,
      route_count: graphReport.routes.length,
      exact_route_id_digest_join_count: routes.filter((route) =>
        canonicalById.get(route.route_id)?.digest === route.canonical_digest).length,
      missing_route_ids: routes.filter((route) => !canonicalById.has(route.route_id))
        .map((route) => route.route_id),
    },
    ending_id: blueprint.ending.ending_id,
    ending_route_count: routes.filter((route) => route.ending_id === blueprint.ending.ending_id).length,
    match_boundaries_per_route: 6,
    durable_checkpoint_effects_per_route: expectedCheckpointCount,
    inherited_story_point_sentinel: INHERITED_STORY_POINT_SENTINEL,
    speaker_visibility_violations: violations,
    delayed_acknowledgements: delayedAcknowledgements,
    routes: summaries,
  };
}

function presentationSignature(event) {
  if (!event.presentation) return null;
  return JSON.stringify(event.presentation);
}

function renderRouteEvents(route) {
  const lines = [];
  let previousPresentation = null;
  for (const event of route.events) {
    const signature = presentationSignature(event);
    if (signature && signature !== previousPresentation) {
      const view = event.presentation;
      lines.push(`**Scene:** ${view.location_text ?? 'Unlabeled location'} — ${view.time_text ?? 'Unlabeled time'}; background ${code(view.background_asset_id ?? 'none')}; visible poses ${list(view.visible_character_pose_ids)}.`);
      previousPresentation = signature;
    }
    if (event.event === 'DIALOGUE') {
      lines.push(`**${event.speaker_text}** (${code(event.statement_id)}): ${event.text}`);
    } else if (event.event === 'NARRATION') {
      lines.push(`*${event.text}* (${code(event.statement_id)})`);
    } else if (event.event === 'CHOICE') {
      const options = event.options.map((option) =>
        `${option.option_id === event.selected_option_id ? '**selected** ' : ''}${code(option.option_id)} — ${option.text}`).join('; ');
      lines.push(`**Choice ${code(event.choice_id)}:** ${event.prompt_text} Options: ${options}.`);
    } else if (event.event === 'MATCH_START') {
      lines.push(`**Match start:** ${code(event.match_ref)} after ${code(event.pre_match_checkpoint_id)}; an interruption restores that boundary and offers a fresh launch.`);
    } else if (event.event === 'MATCH_RETURN') {
      lines.push(`**Match return:** ${code(event.match_ref)} → **${event.completion}**, +${event.story_service_points_gained} Story Service Points; accepted at ${code(event.post_match_checkpoint_id)}; documented ${event.documented_outcome ? 'yes' : 'no'}, verified ${event.verified_outcome ? 'yes' : 'no'}.`);
    } else if (event.event === 'ENDING') {
      lines.push(`**Current-content ending:** ${code(event.ending_id)} with ${event.final_story_service_points} total Story Service Points in the sentinel audit.`);
    }
  }
  return lines.join('\n\n');
}

function renderFullRouteTranscripts(routes, routeReport, bundle, blueprint) {
  const sections = routes.map((route) => {
    const choices = Object.entries(route.choices).map(([choiceId, optionId]) => `${code(choiceId)} → ${code(optionId)}`).join('; ');
    const outcomes = route.match_results.map((result) => `${code(result.match_ref)} ${result.completion}`).join('; ');
    return `## ${route.route_id} — ${route.outcome_vector}\n\n- Canonical TASK-043 route index: ${route.canonical_route_index}\n- Remembered choices: ${choices}\n- Match outcomes: ${outcomes}\n- Points: inherited sentinel ${route.inherited_story_points_sentinel}; expansion +${route.expansion_story_points_gained}; final ${route.final_story_service_points}\n- Durable transitions: ${route.checkpoint_effect_count} checkpoint effects; ${route.start_match_effect_count} Match starts; ending ${code(route.ending_id)}\n- Canonical TASK-043 digest: ${code(route.canonical_digest)}\n- Candidate runtime final digest: ${code(route.runtime_final_digest)}\n\n### Complete transcript\n\n${renderRouteEvents(route)}`;
  });
  return `# Quiet Cascade expansion full route transcripts\n\nStatus: **TASK-044 non-live candidate review**\n\nGenerated from ${code(bundle.manifest.pack_id)} / ${code(bundle.manifest.content_version)}. This document enumerates all **${routeReport.route_count}** canonical TASK-043 routes: ${routeReport.choice_combination_count} remembered-choice combinations multiplied by ${routeReport.outcome_pattern_count} six-Match COMPLETED/ABANDONED vectors. All ${routeReport.canonical_graph_report.exact_route_id_digest_join_count} route IDs and digests join exactly to ${code('GRAPH_REPORT.json')}. Every route reaches ${code(blueprint.ending.ending_id)}; no cumulative score gate exists.\n\nThe outcome vector is ordered Shift 7 through Shift 12: **C** means a valid completed closure and **A** means a valid abandonment. Every Match transition records the pre-Match restart boundary and post-Match acceptance boundary. The ${INHERITED_STORY_POINT_SENTINEL}-point inherited value is a proof sentinel, not authored campaign state: every route retains it exactly and adds only normalized Match gains.\n\nBoth delayed choice acknowledgements are exhaustive: all ${routeReport.delayed_acknowledgements.variant_count} distinct branch variants appear on ${routeReport.delayed_acknowledgements.routes_per_variant} routes apiece. Art and motion remain optional presentation. Each scene-state line identifies the exact existing background and visible poses, but all technical meaning and choice text appears again as localized text.\n\n${sections.join('\n\n')}\n`;
}

function renderChoreography(bundle, blueprint, choreography, surfaces, routes, assetAudit) {
  const usedTransitions = uniqueSorted(choreography.filter((row) => row.transition !== 'RUNTIME_HANDOFF').map((row) => row.transition));
  const episodeSections = blueprint.episodes.map((episode) => {
    const topology = assetAudit.per_episode.find((entry) => entry.episode_id === episode.episode_id);
    assertion(topology?.exact_blueprint_match, `${episode.episode_id} lacks an exact presentation topology audit.`);
    const rows = choreography.filter((row) => row.chapter_id === episode.episode_id);
    const densityRows = surfaces.filter((row) => row.chapter_id === episode.episode_id);
    const longest = densityRows.reduce((best, row) => row.characters > (best?.characters ?? -1) ? row : best, null);
    const table = rows.map((row) => `| ${row.statement_index} | ${escapeCell(row.nearest_label)} | ${row.action} | ${escapeCell(row.stable_id)} | ${escapeCell(row.asset_or_target)} | ${row.position} | ${row.transition} | ${escapeCell(row.checkpoint_id ?? '—')} |`).join('\n');
    const episodeRoutes = routes.filter((route) => route.events.some((event) => event.event === 'MATCH_START' && event.match_ref === episode.match_ref));
    const visibilityViolations = uniqueSorted(episodeRoutes.flatMap((route) => route.speaker_visibility_violations));
    return `## Shift ${episode.shift_number}: ${episode.title}\n\n- Match: ${code(episode.match_ref)}; return label ${code(episode.labels.return)}\n- Per-episode topology lock: **exact blueprint equality**\n- Background reuse: ${list(topology.backgrounds)}\n- Character-pose reuse: ${list(topology.character_poses)}\n- Transients: ${list(topology.transient_asset_ids)}\n- Longest localized display surface: ${longest?.characters ?? 0} characters / ${longest?.words ?? 0} words at ${code(longest?.text_id ?? 'none')}\n- Exhaustive speaker-visibility violations: ${visibilityViolations.length}\n\n| # | Nearest label | Action | Stable tag/ID | Asset, pose, or target | Position | Transition | Checkpoint |\n| ---: | --- | --- | --- | --- | --- | --- | --- |\n${table}`;
  });
  return `# Quiet Cascade expansion choreography\n\nStatus: **TASK-044 non-live candidate review**\n\n## Presentation contract\n\n- Exact reuse: ${assetAudit.backgrounds.length} approved backgrounds, ${assetAudit.character_poses.length} approved character poses, and ${assetAudit.transient_assets.length} transients. All ${assetAudit.per_episode.length} episode inventories independently equal their locked blueprint lists; no asset can be borrowed from another episode to satisfy only the flattened union. No pixel coordinates, new masters, or unregistered pose inference appears in content.\n- Speaker visibility: all speaking statements were replayed through all ${routes.length} choice/outcome routes; no speaker is absent from the character layer when their line is displayed.\n- Motion: authored transitions use ${list(usedTransitions)} only. Reduced motion replaces every transition immediately while retaining the same scene, pose, text, focus order, Match boundary, checkpoint, and announcement. Animation completion never advances Story authority.\n- Reduced data: every referenced production asset has an approved reduced-data derivative. Asset failure falls back within the same layer; dialogue and Match actions remain usable.\n- Mobile/reflow: the 420-character editorial review ceiling applies to each localized display surface. Long copy scrolls in the HTML screen layer; no required fact depends on crop, lighting, pose, or audio.\n- Match handoff: ${code('start_match')} persists pre-Match state, launches the ordinary Worker-authoritative Match, accepts one valid normalized result, persists post-Match state, then enters the explicit return label. Active Match state is never presented as resumable.\n\n## Transition vocabulary\n\n| Transition | Full-motion cue | Reduced-motion equivalent | Semantic authority |\n| --- | --- | --- | --- |\n| ${code('CUT')} | Immediate editorial replacement | Same immediate replacement | none |\n| ${code('FADE')} | Short opacity crossfade | Immediate replacement with focus/announcement retained | none |\n| ${code('DISSOLVE')} | Gentle scene/pose dissolve | Immediate replacement with text retained | none |\n| ${code('SLIDE')} | Directional layer arrival where authored | Immediate replacement without travel | none |\n| ${code('RUNTIME_HANDOFF')} | Story surface yields to Match, then returns after acceptance | Identical route/focus transition without motion | Match and checkpoint authority remains runtime-owned |\n\n${episodeSections.join('\n\n')}\n`;
}

function renderAltTextBriefs(assetRecords) {
  const sections = assetRecords.map((asset) => {
    const protectedZones = asset.protected_zones.length
      ? asset.protected_zones.map((zone) => `x ${zone.x}, y ${zone.y}, width ${zone.width}, height ${zone.height}`).join('; ')
      : 'none';
    return `## ${asset.asset_id}\n\n- Layer: **${asset.layer}**; exact existing production reuse: **yes**\n- Localized text ID: ${code(asset.registry_alt_text_id)}\n- Approved alternative: “${asset.alt_text}”\n- Focal point: x ${asset.focal_point.x}, y ${asset.focal_point.y}; protected zones: ${protectedZones}\n- Responsive sources: ${asset.responsive_variants.map((variant) => `${variant.variant} ${variant.width}×${variant.height} (${code(variant.sha256)})`).join('; ')}\n- Failure behavior: resolve ${code(asset.fallback_asset_id)} within the same layer. The fallback is decorative and empty-alt; scene location, speaker, dialogue, choices, and technical facts remain in HTML.\n- Brief disposition: reuse the reviewed pixels and approved text unchanged. Do not infer a new expression, technical finding, or result from this image.`;
  });
  return `# Quiet Cascade expansion alternative-text briefs\n\nStatus: **TASK-044 non-live candidate review**\n\nThese briefs bind every reachable visual reference to the exact reviewed TASK-030 pixels and the English source text that describes them. They do not create raster text or new technical evidence. Background descriptions orient place; character descriptions identify the visible person/pose. Neither channel substitutes for dialogue, choices, or the Match result.\n\nThe expansion uses no transient insert. All diagnostic context therefore remains localized HTML text and player-safe Match presentation. Reduced-data selection uses the same alternative. A loading failure uses a same-layer decorative fallback without repeating or contradicting the screen copy.\n\n${sections.join('\n\n')}\n`;
}

function renderArtRequestsMarkdown(report) {
  const rows = report.asset_reuse.assets.map((asset) => `| ${code(asset.asset_id)} | ${asset.layer} | ${asset.responsive_variants.length}/3 | ${code(asset.fallback_asset_id)} | ${code(asset.registry_alt_text_id)} | exact approved reuse |`).join('\n');
  return `# Quiet Cascade expansion art requests\n\nStatus: **ZERO NEW ART REQUESTS — TASK-044 candidate presentation is fully covered by approved inventory**\n\n## Exact disposition\n\n- Requested new masters: **${report.art_request_disposition.request_count}**\n- Requests: **none**\n- Existing production reuse: ${report.asset_reuse.background_count} backgrounds and ${report.asset_reuse.character_pose_count} character poses; no transient insert.\n- Per-episode topology locks: **${report.asset_reuse.per_episode.filter((episode) => episode.exact_blueprint_match).length}/${report.asset_reuse.per_episode.length} exact**\n- Gaps after exhaustive route review: **${report.art_request_disposition.gap_count}**\n- Owner action for TASK-045: verification-only unless later topology-authorized content changes create a real comprehension gap. Do not generate optional decorative variants merely to make this ledger non-empty.\n\nThe ${report.presentation_audit.route_count} reachable routes were reviewed with all choice combinations and Match outcome vectors. Every speaker remains visible; all required meaning is present in localized text; all referenced assets have desktop, mobile, reduced-data, and same-layer fallback coverage. The three QC01-specific inserts remain intentionally unused because they depict different incidents.\n\n## Reuse ledger\n\n| Existing asset | Layer | Responsive coverage | Fallback | Localized alt | Disposition |\n| --- | --- | ---: | --- | --- | --- |\n${rows}\n\n## Request schema\n\nIf a future topology-authorized revision creates a real gap, a request must name the new stable ID, layer, exact reachable scene labels, semantic need that HTML cannot satisfy, desktop/mobile crop, dialogue-safe zone, alt brief, fallback, provenance inputs, and approval owner. This task found no such need, so ${code('ART_REQUESTS.json')} deliberately contains an empty ${code('requests')} array rather than speculative prompts.\n`;
}

async function createPresentationArtifacts() {
  const [bundle, blueprint, graphReport, artManifest, artInventory, authoredMetadata] = await Promise.all([
    loadBundle(),
    readJson(BLUEPRINT_PATH),
    readJson(GRAPH_REPORT_PATH),
    readJson(ART_MANIFEST_PATH),
    readJson(ART_INVENTORY_PATH),
    readJson(AUTHORED_METADATA_PATH),
  ]);
  const validationIssues = validateStoryPack(bundle);
  assertion(validationIssues.length === 0, `Candidate Story validation failed: ${JSON.stringify(validationIssues)}.`);
  assertion(bundle.manifest.pack_id === blueprint.campaign_id, 'Candidate pack ID diverges from blueprint campaign ID.');
  assertion(bundle.manifest.entry_label === blueprint.entry_label, 'Candidate entry label diverges from blueprint.');

  const rows = statementRows(bundle);
  const surfaces = textSurfaceRows(bundle, rows);
  const choreography = choreographyRows(rows);
  const reachable = reachableArt(bundle, blueprint, rows);
  const assets = await Promise.all(reachable.all_production_asset_ids.map((assetId) =>
    auditAsset(assetId, bundle, artManifest, artInventory)));
  const routes = traverseAllRoutes(bundle, blueprint, graphReport);
  const routeReport = routeAudit(routes, blueprint, authoredMetadata, bundle, graphReport);
  const overLimit = surfaces.filter((surface) => surface.characters > MOBILE_CHARACTER_REVIEW_LIMIT);
  const inlineNewlines = surfaces.filter((surface) => surface.inline_newlines > 0);
  const stableTextIds = surfaces.every((surface) =>
    /^text\.[a-z0-9._-]+$/u.test(surface.text_id)
    && Object.hasOwn(bundle.texts.en.entries, surface.text_id)
    && bundle.texts.en.entries[surface.text_id] === surface.text);
  assertion(overLimit.length === 0, `Mobile density limit exceeded by ${overLimit.map((row) => row.text_id).join(', ')}.`);
  assertion(inlineNewlines.length === 0, `Localized surfaces contain inline newlines: ${inlineNewlines.map((row) => row.text_id).join(', ')}.`);
  assertion(stableTextIds, 'One or more displayed surfaces lacks a stable localized text ID.');
  const longest = surfaces.reduce((best, row) => row.characters > (best?.characters ?? -1) ? row : best, null);
  const transitions = uniqueSorted(choreography.filter((row) => row.transition !== 'RUNTIME_HANDOFF').map((row) => row.transition));
  assertion(transitions.every((transition) => ['CUT', 'FADE', 'DISSOLVE', 'SLIDE'].includes(transition)), 'Candidate uses an unsupported transition.');

  const inputPaths = [
    path.join(CANDIDATE_ROOT, 'manifest.json'),
    path.join(CANDIDATE_ROOT, bundle.manifest.registry),
    path.join(CANDIDATE_ROOT, bundle.manifest.text_catalogs.en),
    ...bundle.manifest.scripts.map((filename) => path.join(CANDIDATE_ROOT, filename)),
    path.join(CANDIDATE_ROOT, 'matches.json'),
    path.join(CANDIDATE_ROOT, 'graph.json'),
    AUTHORED_METADATA_PATH,
    BLUEPRINT_PATH,
    GRAPH_REPORT_PATH,
    ART_MANIFEST_PATH,
    ART_INVENTORY_PATH,
  ];
  const inputRecords = await Promise.all(inputPaths.map(fileRecord));
  const blueprintRecord = inputRecords.find((record) => record.path === cleanPath(path.relative(ROOT, BLUEPRINT_PATH)));
  assertion(blueprintRecord?.sha256 === graphReport.input_sha256.blueprint,
    'TASK-043 graph report is not pinned to the current locked blueprint bytes.');
  const report = {
    art_request_version: 'task-044-story-expansion-art-requests-v1',
    campaign_id: bundle.manifest.pack_id,
    candidate_content_version: bundle.manifest.content_version,
    status: 'ZERO_NEW_ART_REQUESTS_EXISTING_INVENTORY_COMPLETE',
    generated_from: inputRecords,
    authored_metadata_version: authoredMetadata.metadata_version ?? authoredMetadata.authored_metadata_version ?? null,
    presentation_audit: routeReport,
    text_and_localization: {
      localized_surface_count: surfaces.length,
      unique_text_id_count: new Set(surfaces.map((row) => row.text_id)).size,
      maximum_characters: longest?.characters ?? 0,
      maximum_words: longest?.words ?? 0,
      longest_text_id: longest?.text_id ?? null,
      character_review_limit: MOBILE_CHARACTER_REVIEW_LIMIT,
      over_limit_text_ids: overLimit.map((row) => row.text_id),
      inline_newline_text_ids: inlineNewlines.map((row) => row.text_id),
      stable_text_ids: stableTextIds,
      semantic_information_depends_on_art: false,
    },
    motion_and_failure_modes: {
      authored_transition_statement_count: choreography.filter((row) => row.transition !== 'RUNTIME_HANDOFF').length,
      used_transitions: transitions,
      reduced_motion_equivalent: 'Immediate replacement with identical text, focus order, announcements, checkpoints, and Match authority.',
      motion_advances_authority: false,
      reduced_data_variant_required: true,
      missing_asset_behavior: 'SAME_LAYER_DECORATIVE_FALLBACK_STORY_REMAINS_TEXT_COMPLETE',
    },
    asset_reuse: {
      background_count: reachable.backgrounds.length,
      character_pose_count: reachable.character_poses.length,
      transient_count: reachable.transient_assets.length,
      per_episode: reachable.per_episode,
      backgrounds: reachable.backgrounds,
      character_poses: reachable.character_poses,
      character_asset_ids: reachable.character_assets,
      transient_asset_ids: reachable.transient_assets,
      assets,
    },
    art_request_disposition: {
      request_count: 0,
      gap_count: 0,
      requests: [],
      rationale: 'Every topology-locked reachable scene and speaker pose maps to exact approved TASK-030 production pixels with desktop, mobile, reduced-data, localized alt, and same-layer fallback coverage. Localized HTML carries all technical meaning.',
      task_045_mode: 'VERIFY_EXISTING_ASSETS_DO_NOT_GENERATE',
    },
  };

  return {
    summary: {
      routes: routes.length,
      unique_route_digests: routeReport.deterministic_digest_count,
      speaker_visibility_violations: routeReport.speaker_visibility_violations.length,
      backgrounds: reachable.backgrounds.length,
      character_poses: reachable.character_poses.length,
      transients: reachable.transient_assets.length,
      episode_topology_matches: reachable.per_episode.filter((episode) => episode.exact_blueprint_match).length,
      delayed_ack_variants: routeReport.delayed_acknowledgements.variant_count,
      canonical_graph_joins: routeReport.canonical_graph_report.exact_route_id_digest_join_count,
      new_art_requests: 0,
      maximum_characters: report.text_and_localization.maximum_characters,
    },
    outputs: {
      [OUTPUT_PATHS.transcripts]: renderFullRouteTranscripts(routes, routeReport, bundle, blueprint),
      [OUTPUT_PATHS.choreography]: renderChoreography(bundle, blueprint, choreography, surfaces, routes, reachable),
      [OUTPUT_PATHS.altText]: renderAltTextBriefs(assets),
      [OUTPUT_PATHS.artRequestsMarkdown]: renderArtRequestsMarkdown(report),
      [OUTPUT_PATHS.artRequestsJson]: stableJson(report),
    },
  };
}

async function run() {
  const check = process.argv.includes('--check');
  const artifacts = await createPresentationArtifacts();
  if (check) {
    for (const [filePath, expected] of Object.entries(artifacts.outputs)) {
      const actual = await fs.readFile(filePath, 'utf8');
      assertion(actual === expected, `${cleanPath(path.relative(ROOT, filePath))} is stale; regenerate TASK-044 presentation artifacts.`);
    }
  } else {
    await fs.mkdir(REVISION_ROOT, { recursive: true });
    await Promise.all(Object.entries(artifacts.outputs).map(([filePath, contents]) => fs.writeFile(filePath, contents, 'utf8')));
  }
  process.stdout.write(`${stableJson({ mode: check ? 'check' : 'write', ...artifacts.summary })}`);
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  run().catch((error) => {
    console.error(error.stack ?? error.message);
    process.exitCode = 1;
  });
}

export {
  createPresentationArtifacts,
  outcomePatterns,
  choiceCombinations,
};
