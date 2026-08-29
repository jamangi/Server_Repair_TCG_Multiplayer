import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  createStoryArtResolver,
  validateStoryArtManifest,
} from '../../viewer/js/play/story-art-resolver.mjs';
import { readWebpDimensions } from '../../viewer/scripts/verify-task-011-art.mjs';
import { verifyTask030Art } from '../../viewer/scripts/verify-task-030-art.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CANDIDATE_ROOT = 'content/story-v1/candidates/quiet-cascade-expansion-v3';
const PROFILES = Object.freeze(['desktop', 'mobile', 'reduced_data']);
const EXPECTED_COUNTS = Object.freeze({ backgrounds: 4, characters: 8, transients: 0, total: 12 });

const INPUT_PATHS = Object.freeze({
  candidateManifest: `${CANDIDATE_ROOT}/manifest.json`,
  candidateRegistry: `${CANDIDATE_ROOT}/registry.json`,
  candidateTexts: `${CANDIDATE_ROOT}/texts/en.json`,
  candidateMatches: `${CANDIDATE_ROOT}/matches.json`,
  blueprint: 'docs/story/revisions/quiet-cascade-expansion-v3/blueprint.json',
  artRequests: 'docs/story/revisions/quiet-cascade-expansion-v3/ART_REQUESTS.json',
  planningAudit: 'docs/story/reports/story-expansion-planning-audit.json',
  matchRegistry: 'automated_games/task-043-quiet-cascade-expansion-v3/match-registry.json',
  runtimeManifest: 'viewer/assets/story/manifest.json',
  inventory: 'docs/art/task-030-story-art-inventory.json',
  provenance: 'art_sources/task-030/generation-log.json',
  resolver: 'viewer/js/play/story-art-resolver.mjs',
  stagingManifest: 'viewer/generated/play/manifest.json',
  storyClient: 'viewer/js/play/story-client.mjs',
});

export const TASK_045_IMMUTABLE_BASELINE = Object.freeze({
  'viewer/assets/story/manifest.json': '7a6cae7ed58f1a167e282bc9e91975f5978c1a59786426814fd28037bb186db0',
  'viewer/js/play/story-art-resolver.mjs': 'f8a85d14d328ffa5c702efd6b89755d5c2d48ffd15e7e051e62021ce8639a1a8',
  'docs/art/task-030-story-art-inventory.json': '2355d1654d4ddf76befe93d6ffa6e3df77312b28b8aab0f02fd4523f86abb5b3',
  'art_sources/task-030/generation-log.json': '364740ac2ddf4f2aef7e8bbb9651f435d3f1bc9fe6916248d05a8376bfd0db87',
});

export const TASK_045_ART_AUDIT_OUTPUTS = Object.freeze({
  json: path.join(ROOT, 'docs/art/task-045-story-expansion-art-audit.json'),
  markdown: path.join(ROOT, 'docs/art/TASK-045-STORY-EXPANSION-ART.md'),
});

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function sortedUnique(values) {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, canonical(entry)]));
  }
  return value;
}

function exact(left, right) {
  return JSON.stringify(canonical(left)) === JSON.stringify(canonical(right));
}

function exactSet(left, right) {
  return exact(sortedUnique(left), sortedUnique(right));
}

function assertion(condition, message) {
  if (!condition) throw new Error(`TASK-045 art audit failed: ${message}`);
}

async function loadSource(relativePath, { json = true } = {}) {
  const bytes = await readFile(path.join(ROOT, relativePath));
  return {
    path: relativePath.replaceAll('\\', '/'),
    bytes: bytes.length,
    sha256: sha256(bytes),
    value: json ? JSON.parse(bytes.toString('utf8')) : bytes.toString('utf8'),
  };
}

export async function loadTask045ArtAuditInputs() {
  const fixed = Object.fromEntries(await Promise.all(Object.entries(INPUT_PATHS).map(async ([key, relativePath]) => [
    key,
    await loadSource(relativePath, { json: !['resolver', 'storyClient'].includes(key) }),
  ])));
  const scripts = await Promise.all(fixed.candidateManifest.value.scripts.map((relativePath) => loadSource(
    `${CANDIDATE_ROOT}/${relativePath}`,
  )));
  return { ...fixed, scripts };
}

function readPngDimensions(bytes) {
  assertion(bytes.length >= 33
    && bytes.subarray(0, 8).toString('hex') === '89504e470d0a1a0a'
    && bytes.toString('ascii', 12, 16) === 'IHDR', 'master is not a supported PNG');
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

async function verifyFileRecord(record, kind) {
  const payload = await readFile(path.join(ROOT, record.path));
  const dimensions = kind === 'png' ? readPngDimensions(payload) : readWebpDimensions(payload);
  assertion(payload.length === record.bytes, `${record.path} byte count differs from its record`);
  assertion(sha256(payload) === record.sha256, `${record.path} hash differs from its record`);
  assertion(dimensions.width === record.width && dimensions.height === record.height,
    `${record.path} dimensions differ from its record`);
  return { bytes: payload.length, sha256: sha256(payload), ...dimensions };
}

function poseMap(registry) {
  return new Map(registry.characters.flatMap((character) => character.poses.map((pose) => [
    `${character.character_id}:${pose.pose_id}`,
    pose.asset_id,
  ])));
}

function collectScriptReferences(script, registry) {
  const poses = poseMap(registry);
  const references = [];
  let nearestLabel = null;
  script.statements.forEach((statement, statementIndex) => {
    if (statement.type === 'label') nearestLabel = statement.label_id;
    if (statement.type === 'scene') {
      references.push({
        statement_index: statementIndex,
        nearest_label: nearestLabel,
        statement_type: 'scene',
        layer: 'BACKGROUND',
        asset_id: statement.background_asset_id,
      });
    }
    if (statement.type === 'show' && statement.layer === 'characters') {
      const poseId = `${statement.character_id}:${statement.pose_id}`;
      const assetId = poses.get(poseId);
      assertion(assetId, `${script.script_id} statement ${statementIndex} uses an unregistered pose ${poseId}`);
      references.push({
        statement_index: statementIndex,
        nearest_label: nearestLabel,
        statement_type: 'show',
        layer: 'CHARACTER',
        pose_id: poseId,
        asset_id: assetId,
      });
    }
    if (statement.type === 'show' && statement.layer === 'transients') {
      references.push({
        statement_index: statementIndex,
        nearest_label: nearestLabel,
        statement_type: 'show',
        layer: 'TRANSIENT',
        asset_id: statement.asset_id,
      });
    }
  });
  return references;
}

function assertImmutablePins(inputs) {
  const byPath = new Map(Object.values(inputs)
    .filter((entry) => entry && !Array.isArray(entry) && entry.path)
    .map((entry) => [entry.path, entry]));
  for (const [relativePath, expectedHash] of Object.entries(TASK_045_IMMUTABLE_BASELINE)) {
    assertion(byPath.get(relativePath)?.sha256 === expectedHash, `${relativePath} changed from the TASK-045 baseline`);
  }
}

function assertPromptAndReviewPolicy(provenance, assetId) {
  const record = provenance.assets[assetId];
  const direction = provenance.shared_art_direction.toLowerCase();
  const notes = record.review_notes.join(' ').toLowerCase();
  assertion(direction.includes('no named-artist imitation'), 'shared direction lost the named-artist prohibition');
  assertion(direction.includes('brands') && direction.includes('logos'), 'shared direction lost the brand/logo prohibition');
  assertion(direction.includes('readable or pseudo text'), 'shared direction lost the pseudo-text prohibition');
  assertion(direction.includes('hidden gameplay answers'), 'shared direction lost the hidden-answer prohibition');
  assertion(direction.includes('unsafe handling'), 'shared direction lost the unsafe-practice prohibition');
  assertion(notes.includes('text-free composition'), `${assetId} lacks a text-free review finding`);
  assertion(notes.includes('technical safety'), `${assetId} lacks a technical-safety review finding`);
  assertion(notes.includes('absence of hidden gameplay answers'), `${assetId} lacks a hidden-answer review finding`);
  return {
    no_named_artist_imitation: true,
    no_third_party_brand_or_logo: true,
    no_readable_or_pseudo_text: true,
    no_hidden_gameplay_answer: true,
    technical_safety_reviewed: true,
  };
}

function resolveForLayer(resolver, layer, assetId) {
  if (layer === 'BACKGROUND') return resolver.resolveBackground(assetId);
  if (layer === 'CHARACTER') return resolver.resolveCharacter(assetId);
  return resolver.resolveTransient(assetId);
}

function verifyResolverProfiles(manifest, assetIds) {
  const base = new URL('https://example.invalid/viewer/assets/story/manifest.json');
  const resolvers = {
    desktop: createStoryArtResolver({
      manifest,
      manifestUrl: base,
      matchMediaImpl: () => ({ matches: false }),
      saveData: false,
    }),
    mobile: createStoryArtResolver({
      manifest,
      manifestUrl: base,
      matchMediaImpl: () => ({ matches: true }),
      saveData: false,
    }),
    reduced_data: createStoryArtResolver({
      manifest,
      manifestUrl: base,
      matchMediaImpl: () => ({ matches: true }),
      saveData: true,
    }),
  };
  for (const assetId of assetIds) {
    const manifestAsset = manifest.assets[assetId];
    for (const profile of PROFILES) {
      const resolution = resolveForLayer(resolvers[profile], manifestAsset.layer, assetId);
      assertion(resolution.assetId === assetId, `${assetId} does not resolve in ${profile}`);
      assertion(resolution.src.endsWith(manifestAsset.sources[profile]), `${assetId} selects the wrong ${profile} source`);
      assertion(resolution.fallback?.assetId === manifestAsset.fallback_asset_id,
        `${assetId} does not retain its same-layer fallback in ${profile}`);
    }
  }
  for (const layer of ['BACKGROUND', 'CHARACTER']) {
    const missing = resolveForLayer(resolvers.desktop, layer, `story.missing.${layer.toLowerCase()}`);
    assertion(missing.assetId === `story.fallback.${layer.toLowerCase()}`,
      `${layer} missing-ID resolution does not remain within layer`);
    assertion(missing.alt === '' && missing.decorative === true,
      `${layer} fallback is not decorative with empty alt text`);
  }
  return {
    profiles_verified: PROFILES,
    production_resolutions_verified: assetIds.length * PROFILES.length,
    missing_id_same_layer_fallbacks_verified: 2,
    reduced_motion_contract: 'Resolver selection and text/focus authority are independent of animation timing.',
  };
}

function buildEpisodeJoins(raw, inputs) {
  const matchByShift = new Map(raw.matchRegistry.matches.map((entry) => [entry.shift_id, entry]));
  const planningByShift = new Map(raw.planningAudit.episode_assignments.map((entry) => [entry.episode_id, entry]));
  const candidateMatchByShift = new Map(raw.candidateMatches.matches.map((entry) => [entry.shift_id, entry]));
  const artByShift = new Map(raw.artRequests.asset_reuse.per_episode.map((entry) => [entry.episode_id, entry]));
  const blueprintByShift = new Map(raw.blueprint.episodes.map((entry) => [entry.episode_id, entry]));
  assertion(inputs.scripts.length === 6, 'candidate manifest does not name exactly six scripts');

  return inputs.scripts.map((loaded) => {
    const script = loaded.value;
    const episodeId = script.chapter_id;
    const references = collectScriptReferences(script, raw.candidateRegistry);
    const backgrounds = sortedUnique(references.filter((entry) => entry.layer === 'BACKGROUND').map((entry) => entry.asset_id));
    const characterPoses = sortedUnique(references.filter((entry) => entry.layer === 'CHARACTER').map((entry) => entry.pose_id));
    const transients = sortedUnique(references.filter((entry) => entry.layer === 'TRANSIENT').map((entry) => entry.asset_id));
    const startMatches = script.statements.filter((statement) => statement.type === 'start_match');
    const match = matchByShift.get(episodeId);
    const planning = planningByShift.get(episodeId);
    const candidateMatch = candidateMatchByShift.get(episodeId);
    const art = artByShift.get(episodeId);
    const blueprint = blueprintByShift.get(episodeId);
    assertion(match && candidateMatch && planning && art && blueprint, `${episodeId} is absent from a TASK-043/044 source`);
    assertion(startMatches.length === 1, `${episodeId} does not contain exactly one Match launch`);
    const launch = startMatches[0];
    assertion(match.expected_ticket_definition_ids.length === 1
      && match.expected_ticket_snapshot_digests.length === 1, `${episodeId} does not pin exactly one generated Ticket`);
    assertion(launch.match_ref === match.match_ref && launch.match_ref === planning.match_ref
      && launch.match_ref === blueprint.match_ref, `${episodeId} Match reference diverges from TASK-043`);
    assertion(match.seed === planning.seed, `${episodeId} seed diverges from TASK-043 planning`);
    assertion(exact(match.expected_ticket_definition_ids, candidateMatch.expected_ticket_definition_ids),
      `${episodeId} Ticket ID diverges from the TASK-043 Match proof`);
    assertion(exact(match.expected_ticket_snapshot_digests, candidateMatch.expected_ticket_snapshot_digests),
      `${episodeId} Ticket digest diverges from the TASK-043 Match proof`);
    assertion(planning.case_id === match.source_case_id && planning.fingerprint_id === blueprint.fingerprint_id,
      `${episodeId} upstream planning assignment diverges from the final Match proof`);
    assertion(launch.return_label === match.return_label
      && launch.pre_match_checkpoint_id === match.pre_match_checkpoint_id
      && launch.post_match_checkpoint_id === match.post_match_checkpoint_id,
    `${episodeId} Match checkpoint/return boundary diverges from TASK-043`);
    assertion(exactSet(backgrounds, art.backgrounds) && exactSet(backgrounds, blueprint.art.background_asset_ids),
      `${episodeId} background references diverge from TASK-043/044`);
    assertion(exactSet(characterPoses, art.character_poses) && exactSet(characterPoses, blueprint.art.character_pose_ids),
      `${episodeId} character references diverge from TASK-043/044`);
    assertion(exactSet(transients, art.transient_asset_ids) && exactSet(transients, blueprint.art.transient_asset_ids),
      `${episodeId} transient references diverge from TASK-043/044`);
    assertion(art.exact_blueprint_match === true, `${episodeId} lacks the exact topology-lock finding`);

    return {
      episode_id: episodeId,
      script_id: script.script_id,
      script_path: loaded.path,
      script_sha256: loaded.sha256,
      match_ref: match.match_ref,
      match_seed: match.seed,
      ticket_definition_id: match.expected_ticket_definition_ids[0],
      ticket_snapshot_digest: match.expected_ticket_snapshot_digests[0],
      planning_source_ticket_definition_id: planning.source_ticket_id,
      planning_source_ticket_snapshot_digest: planning.source_ticket_snapshot_digest,
      source_case_id: match.source_case_id,
      pre_match_checkpoint_id: match.pre_match_checkpoint_id,
      post_match_checkpoint_id: match.post_match_checkpoint_id,
      backgrounds,
      character_poses: characterPoses,
      transient_asset_ids: transients,
      reference_counts: {
        scenes: references.filter((entry) => entry.layer === 'BACKGROUND').length,
        character_shows: references.filter((entry) => entry.layer === 'CHARACTER').length,
        transient_shows: references.filter((entry) => entry.layer === 'TRANSIENT').length,
        total: references.length,
      },
      references,
      exact_task_043_pin: true,
      exact_task_044_art_request: true,
    };
  });
}

async function buildAssetRecord({ assetId, raw, referenceEpisodes, referenceCount }) {
  const manifest = raw.runtimeManifest.assets[assetId];
  const registry = raw.candidateRegistry.assets.find((entry) => entry.asset_id === assetId);
  const request = raw.artRequests.asset_reuse.assets.find((entry) => entry.asset_id === assetId);
  const inventory = raw.inventory.assets.find((entry) => entry.asset_id === assetId);
  const provenance = raw.provenance.assets[assetId];
  assertion(manifest && registry && request && inventory && provenance, `${assetId} lacks a joined record`);
  assertion(manifest.kind === 'production' && inventory.kind === 'production', `${assetId} is not production art`);
  assertion(manifest.layer === registry.layer && manifest.layer === request.layer && manifest.layer === inventory.layer,
    `${assetId} layer differs across records`);
  assertion(registry.required === true, `${assetId} is not required in the candidate registry`);
  assertion(raw.candidateTexts.entries[registry.alt_text_id] === manifest.alt_text
    && request.alt_text === manifest.alt_text && inventory.alt_text === manifest.alt_text,
  `${assetId} localized alt text differs across records`);
  assertion(manifest.decorative === false && request.decorative === false && inventory.decorative === false,
    `${assetId} production art is incorrectly decorative`);
  assertion(manifest.fallback_asset_id === request.fallback_asset_id
    && manifest.fallback_asset_id === inventory.fallback_asset_id,
  `${assetId} fallback differs across records`);
  assertion(exact(manifest.focal_point, request.focal_point) && exact(manifest.focal_point, inventory.focal_point),
    `${assetId} focal point differs across records`);
  assertion(exact(manifest.protected_zones, request.protected_zones)
    && exact(manifest.protected_zones, inventory.protected_zones),
  `${assetId} protected zones differ across records`);
  assertion(inventory.review_state === 'approved' && provenance.review_state === 'approved'
    && provenance.approval?.status === 'approved', `${assetId} review/approval is incomplete`);
  assertion(exact(inventory.master, provenance.master), `${assetId} master provenance differs from inventory`);
  assertion(exact(inventory.derivatives, provenance.derivatives), `${assetId} derivative provenance differs from inventory`);
  assertion(provenance.source_pixels_used === false, `${assetId} unexpectedly uses reference pixels`);
  assertion(exactSet(provenance.source_inputs, raw.provenance.project_owned_reference_inputs.map((entry) => entry.path)),
    `${assetId} source-input set differs from the licensed reference ledger`);
  await verifyFileRecord(inventory.master, 'png');

  const derivatives = [];
  for (const profile of PROFILES) {
    const derivative = inventory.derivatives[profile];
    assertion(manifest.sources[profile] === derivative.path.replace('viewer/assets/story/', ''),
      `${assetId} ${profile} manifest path differs from inventory`);
    const requestVariant = request.responsive_variants.find((entry) => entry.variant === profile);
    assertion(requestVariant && requestVariant.path === derivative.path
      && requestVariant.sha256 === derivative.sha256 && requestVariant.bytes === derivative.bytes
      && requestVariant.width === derivative.width && requestVariant.height === derivative.height,
    `${assetId} ${profile} TASK-044 brief differs from TASK-030`);
    await verifyFileRecord(derivative, 'webp');
    assertion(derivative.bytes <= derivative.byte_budget, `${assetId} ${profile} exceeds its byte budget`);
    derivatives.push({ profile, ...structuredClone(derivative) });
  }

  return {
    asset_id: assetId,
    layer: manifest.layer,
    reference_count: referenceCount,
    referenced_by_episode_ids: referenceEpisodes,
    registry_alt_text_id: registry.alt_text_id,
    alt_text: manifest.alt_text,
    decorative: false,
    fallback_asset_id: manifest.fallback_asset_id,
    focal_point: structuredClone(manifest.focal_point),
    protected_zones: structuredClone(manifest.protected_zones),
    master: structuredClone(inventory.master),
    derivatives,
    provenance: {
      brief: provenance.brief,
      prompt_sha256: sha256(Buffer.from(provenance.prompt, 'utf8')),
      tool_or_artist: provenance.tool_or_artist,
      date: provenance.date,
      generation_reference: provenance.generation_reference,
      source_generation_references: provenance.source_generation_references,
      source_inputs: provenance.source_inputs,
      source_pixels_used: provenance.source_pixels_used,
      edit_history: provenance.edit_history,
      review_state: provenance.review_state,
      review_notes: provenance.review_notes,
      approval: provenance.approval,
    },
    content_safety_review: assertPromptAndReviewPolicy(raw.provenance, assetId),
    exact_existing_reuse: true,
  };
}

async function buildFallbackRecord(assetId, raw) {
  const manifest = raw.runtimeManifest.assets[assetId];
  const inventory = raw.inventory.assets.find((entry) => entry.asset_id === assetId);
  const provenance = raw.provenance.assets[assetId];
  assertion(manifest && inventory && provenance, `${assetId} fallback record is incomplete`);
  assertion(manifest.kind === 'fallback' && inventory.kind === 'fallback', `${assetId} is not a fallback`);
  assertion(manifest.layer === inventory.layer, `${assetId} fallback layer differs`);
  assertion(manifest.decorative === true && manifest.alt_text === '' && manifest.fallback_asset_id === null,
    `${assetId} fallback semantics are invalid`);
  assertion(inventory.review_state === 'approved' && provenance.review_state === 'approved'
    && provenance.approval?.status === 'approved', `${assetId} fallback is not approved`);
  assertion(exact(inventory.master, provenance.master) && exact(inventory.derivatives, provenance.derivatives),
    `${assetId} fallback provenance differs from inventory`);
  await verifyFileRecord(inventory.master, 'png');
  const derivatives = [];
  for (const profile of PROFILES) {
    const derivative = inventory.derivatives[profile];
    assertion(manifest.sources[profile] === derivative.path.replace('viewer/assets/story/', ''),
      `${assetId} ${profile} fallback path differs`);
    await verifyFileRecord(derivative, 'webp');
    assertion(derivative.bytes <= derivative.byte_budget, `${assetId} ${profile} fallback exceeds budget`);
    derivatives.push({ profile, ...structuredClone(derivative) });
  }
  return {
    asset_id: assetId,
    layer: manifest.layer,
    decorative: true,
    alt_text: '',
    master: structuredClone(inventory.master),
    derivatives,
    review_state: 'approved',
    same_layer_only: true,
  };
}

async function buildReferenceLicenseAudit(raw) {
  const references = [];
  for (const entry of raw.provenance.project_owned_reference_inputs) {
    const actual = await loadSource(entry.path, { json: false });
    assertion(actual.sha256 === entry.sha256, `${entry.path} differs from the licensed reference pin`);
    assertion(entry.source_pixels_used === false, `${entry.path} is marked as copied source pixels`);
    references.push(structuredClone(entry));
  }
  const license = raw.provenance.license_audit;
  assertion(license.result === 'pass' && license.third_party_brands_or_marks === false
    && license.named_artist_imitation === false && license.runtime_network_dependency === false,
  'TASK-030 license audit is incomplete or failed');
  return { ...structuredClone(license), project_owned_reference_count: references.length, references };
}

function sourcePins(inputs) {
  const excluded = new Set(['stagingManifest', 'storyClient']);
  const records = Object.entries(inputs)
    .filter(([key, value]) => !excluded.has(key) && !Array.isArray(value))
    .map(([, value]) => ({ path: value.path, bytes: value.bytes, sha256: value.sha256 }));
  records.push(...inputs.scripts.map(({ path: sourcePath, bytes, sha256: digest }) => ({
    path: sourcePath,
    bytes,
    sha256: digest,
  })));
  return records.sort((left, right) => left.path.localeCompare(right.path));
}

export async function buildTask045ArtAudit(inputs) {
  assertImmutablePins(inputs);
  const raw = Object.fromEntries(Object.entries(inputs)
    .filter(([, value]) => !Array.isArray(value))
    .map(([key, value]) => [key, value.value]));
  const validatedManifest = validateStoryArtManifest(raw.runtimeManifest);
  raw.runtimeManifest = validatedManifest;
  assertion(raw.candidateManifest.pack_id === 'story.campaign.quiet_cascade.v1'
    && raw.candidateManifest.content_version === 'quiet-cascade-expansion-v3', 'candidate identity is unexpected');
  assertion(raw.artRequests.status === 'ZERO_NEW_ART_REQUESTS_EXISTING_INVENTORY_COMPLETE'
    && raw.artRequests.art_request_disposition.gap_count === 0
    && raw.artRequests.art_request_disposition.request_count === 0
    && exact(raw.artRequests.art_request_disposition.requests, [])
    && raw.artRequests.art_request_disposition.task_045_mode === 'VERIFY_EXISTING_ASSETS_DO_NOT_GENERATE',
  'TASK-044 did not hand off a zero-generation art disposition');
  assertion(raw.matchRegistry.live_loader_eligible === false
    && raw.matchRegistry.status === 'CANDIDATE_NON_LIVE', 'TASK-043 Match proof is unexpectedly live');

  const task030 = verifyTask030Art({ root: ROOT });
  assertion(task030.errors.length === 0, `TASK-030 baseline verification failed: ${task030.errors.join('; ')}`);
  const episodes = buildEpisodeJoins(raw, inputs);
  const allReferences = episodes.flatMap((episode) => episode.references.map((entry) => ({
    episode_id: episode.episode_id,
    script_path: episode.script_path,
    ...entry,
  })));
  const usedAssetIds = sortedUnique(allReferences.map((entry) => entry.asset_id));
  const usedBackgrounds = usedAssetIds.filter((assetId) => raw.runtimeManifest.assets[assetId]?.layer === 'BACKGROUND');
  const usedCharacters = usedAssetIds.filter((assetId) => raw.runtimeManifest.assets[assetId]?.layer === 'CHARACTER');
  const usedTransients = usedAssetIds.filter((assetId) => raw.runtimeManifest.assets[assetId]?.layer === 'TRANSIENT');
  assertion(exact({
    backgrounds: usedBackgrounds.length,
    characters: usedCharacters.length,
    transients: usedTransients.length,
    total: usedAssetIds.length,
  }, EXPECTED_COUNTS), 'candidate production counts are not 4 backgrounds + 8 poses + 0 transients');
  const registeredAssetIds = raw.candidateRegistry.assets.filter((entry) => entry.required).map((entry) => entry.asset_id);
  const requestedReuseIds = raw.artRequests.asset_reuse.assets.map((entry) => entry.asset_id);
  const plannedIds = raw.planningAudit.asset_plan.production_assets.map((entry) => entry.asset_id);
  assertion(exactSet(usedAssetIds, registeredAssetIds), 'candidate registry has unused or unreferenced production assets');
  assertion(exactSet(usedAssetIds, requestedReuseIds), 'TASK-044 reuse ledger differs from script references');
  assertion(exactSet(usedAssetIds, plannedIds), 'TASK-043 asset plan differs from script references');

  const assets = [];
  for (const assetId of usedAssetIds) {
    const references = allReferences.filter((entry) => entry.asset_id === assetId);
    assets.push(await buildAssetRecord({
      assetId,
      raw,
      referenceEpisodes: sortedUnique(references.map((entry) => entry.episode_id)),
      referenceCount: references.length,
    }));
  }
  const fallbackIds = sortedUnique(assets.map((entry) => entry.fallback_asset_id));
  assertion(exactSet(fallbackIds, ['story.fallback.background', 'story.fallback.character']),
    'candidate art does not use exactly the two required same-layer fallbacks');
  const fallbacks = [];
  for (const fallbackId of fallbackIds) fallbacks.push(await buildFallbackRecord(fallbackId, raw));
  const resolverContract = verifyResolverProfiles(raw.runtimeManifest, usedAssetIds);
  const licenseAudit = await buildReferenceLicenseAudit(raw);

  const candidateStagingEntries = raw.stagingManifest.files.filter((entry) => [entry.path, entry.source]
    .some((value) => value?.includes('content/story-v1/candidates/')));
  const candidateLoaderReferences = raw.storyClient.includes('content/story-v1/candidates/')
    ? ['viewer/js/play/story-client.mjs'] : [];
  assertion(candidateStagingEntries.length === 0, 'candidate Story content is present in the staged Pages manifest');
  assertion(candidateLoaderReferences.length === 0, 'Story client references a candidate directory');

  const selectedDeliveryBytes = assets.flatMap((entry) => entry.derivatives)
    .reduce((total, entry) => total + entry.bytes, 0);
  const fallbackDeliveryBytes = fallbacks.flatMap((entry) => entry.derivatives)
    .reduce((total, entry) => total + entry.bytes, 0);
  const selectedMasterBytes = assets.reduce((total, entry) => total + entry.master.bytes, 0);
  const fallbackMasterBytes = fallbacks.reduce((total, entry) => total + entry.master.bytes, 0);
  assertion(raw.inventory.total_delivery_bytes === raw.provenance.repository_size_audit.delivery_bytes
    && raw.inventory.pages_budget_bytes === raw.provenance.repository_size_audit.pages_budget_bytes
    && raw.inventory.total_delivery_bytes < raw.inventory.pages_budget_bytes
    && raw.provenance.repository_size_audit.result === 'pass', 'repository-size audit is inconsistent or failed');

  return {
    audit_version: 'task-045-story-expansion-art-audit-v1',
    status: 'VERIFIED_ZERO_GENERATION_COMPLETE_NON_LIVE',
    campaign_id: raw.candidateManifest.pack_id,
    candidate_content_version: raw.candidateManifest.content_version,
    generated_from: sourcePins(inputs),
    immutable_task_030_runtime_baseline: Object.entries(TASK_045_IMMUTABLE_BASELINE).map(([sourcePath, digest]) => ({
      path: sourcePath,
      sha256: digest,
      unchanged: true,
    })),
    candidate_reference_join: {
      episode_count: episodes.length,
      statement_reference_count: allReferences.length,
      scene_reference_count: allReferences.filter((entry) => entry.layer === 'BACKGROUND').length,
      character_show_reference_count: allReferences.filter((entry) => entry.layer === 'CHARACTER').length,
      transient_show_reference_count: allReferences.filter((entry) => entry.layer === 'TRANSIENT').length,
      every_reference_joined: true,
      episodes,
    },
    asset_audit: {
      production_counts: EXPECTED_COUNTS,
      production_asset_ids: usedAssetIds,
      assets,
      same_layer_fallback_count: fallbacks.length,
      fallbacks,
      responsive_production_file_count: assets.length * PROFILES.length,
      responsive_fallback_file_count: fallbacks.length * PROFILES.length,
      candidate_unused_registered_asset_ids: registeredAssetIds.filter((assetId) => !usedAssetIds.includes(assetId)),
      existing_campaign_one_assets_intentionally_not_selected: raw.inventory.assets
        .filter((entry) => entry.kind === 'production' && !usedAssetIds.includes(entry.asset_id))
        .map((entry) => entry.asset_id).sort((left, right) => left.localeCompare(right)),
      new_master_asset_ids: [],
      replaced_master_asset_ids: [],
      transient_asset_ids: [],
      gap_count: 0,
      generation_count: 0,
    },
    resolver_contract: resolverContract,
    provenance_and_license: {
      provenance_version: raw.provenance.provenance_version,
      selected_asset_review_count: assets.length,
      all_selected_assets_approved: true,
      source_pixels_used_count: assets.filter((entry) => entry.provenance.source_pixels_used).length,
      license_audit: licenseAudit,
      review_findings: {
        no_hidden_solution: true,
        no_pseudo_text: true,
        no_third_party_brand_claim: true,
        no_named_artist_imitation: true,
        safe_technical_practice: true,
      },
    },
    repository_budget: {
      selected_production_master_bytes: selectedMasterBytes,
      selected_fallback_master_bytes: fallbackMasterBytes,
      selected_production_delivery_bytes: selectedDeliveryBytes,
      selected_fallback_delivery_bytes: fallbackDeliveryBytes,
      complete_task_030_delivery_bytes: raw.inventory.total_delivery_bytes,
      pages_budget_bytes: raw.inventory.pages_budget_bytes,
      remaining_pages_budget_bytes: raw.inventory.pages_budget_bytes - raw.inventory.total_delivery_bytes,
      budget_percent_used: Number(((raw.inventory.total_delivery_bytes / raw.inventory.pages_budget_bytes) * 100).toFixed(2)),
      result: 'pass',
    },
    task_030_baseline_verification: {
      errors: [],
      summary: task030.summary,
    },
    release_boundary: {
      candidate_directory: CANDIDATE_ROOT,
      candidate_staging_entries: [],
      candidate_loader_references: [],
      task_043_live_loader_eligible: false,
      live_release_owner: 'TASK-046',
      result: 'CANDIDATE_REMAINS_OUTSIDE_LIVE_STORY_LOADERS',
    },
    disposition: {
      mode: 'VERIFICATION_ONLY',
      generate_or_edit_raster_art: false,
      update_manifest_or_resolver: false,
      update_story_topology_or_dialogue: false,
      update_domain_or_gameplay: false,
      stage_candidate_content: false,
      unresolved_items: [],
      owner_approval_required: false,
    },
  };
}

function code(value) {
  return `\`${value}\``;
}

export function renderTask045ArtAudit(audit) {
  const episodeRows = audit.candidate_reference_join.episodes.map((episode) => `| ${code(episode.episode_id)} | ${code(episode.match_ref)} | ${code(episode.ticket_definition_id)} | ${code(episode.ticket_snapshot_digest)} | ${episode.backgrounds.length} | ${episode.character_poses.length} | ${episode.reference_counts.total} |`).join('\n');
  const assetRows = audit.asset_audit.assets.map((asset) => `| ${code(asset.asset_id)} | ${asset.layer} | ${asset.reference_count} | ${asset.derivatives.length}/3 | ${code(asset.fallback_asset_id)} | ${asset.master.bytes.toLocaleString('en-US')} |`).join('\n');
  const pinRows = audit.immutable_task_030_runtime_baseline.map((entry) => `- ${code(entry.path)} — ${code(entry.sha256)} (unchanged)`).join('\n');
  return `# TASK-045 Story expansion art audit\n\nStatus: **verified zero-generation completion; candidate remains non-live**\n\nTASK-045 found no production gap. Every reachable visual reference in the six TASK-044 candidate scripts joins to exact TASK-043 episode/Match/Ticket pins, the zero-gap art-request ledger, and reviewed TASK-030 production pixels. No image was generated, edited, replaced, staged, or promoted.\n\n## Exact result\n\n- Episodes: **${audit.candidate_reference_join.episode_count}/6**\n- Script visual references: **${audit.candidate_reference_join.statement_reference_count}** (${audit.candidate_reference_join.scene_reference_count} scene backgrounds, ${audit.candidate_reference_join.character_show_reference_count} character shows, ${audit.candidate_reference_join.transient_show_reference_count} transients)\n- Unique production reuse: **${audit.asset_audit.production_counts.backgrounds} backgrounds + ${audit.asset_audit.production_counts.characters} character poses + ${audit.asset_audit.production_counts.transients} transients = ${audit.asset_audit.production_counts.total} assets**\n- Responsive production files: **${audit.asset_audit.responsive_production_file_count}/36**; same-layer fallback files: **${audit.asset_audit.responsive_fallback_file_count}/6**\n- New masters: **0**; replaced masters: **0**; candidate-unused registered assets: **0**; gaps: **0**\n\n## Episode-to-pin join\n\n| Episode | TASK-043 Match | Exact generated Ticket | Snapshot digest | Backgrounds | Poses | References |\n| --- | --- | --- | --- | ---: | ---: | ---: |\n${episodeRows}\n\nEvery row also matches its TASK-043 seed and pre/post-Match checkpoints plus the exact TASK-044 per-episode background, pose, and zero-transient set. The JSON companion retains all ${audit.candidate_reference_join.statement_reference_count} statement-indexed joins.\n\n## Production reuse\n\n| Asset | Layer | Script refs | Responsive | Same-layer fallback | Master bytes |\n| --- | --- | ---: | ---: | --- | ---: |\n${assetRows}\n\nAll masters and derivatives match their committed SHA-256, byte, dimension, crop/focal, protected-zone, alternative-text, and byte-budget records. The ${audit.asset_audit.existing_campaign_one_assets_intentionally_not_selected.length} other production assets remain intentional campaign-one inventory rather than QC02 requests; none is falsely staged as expansion art.\n\n## Provenance, review, and licensing\n\nAll ${audit.provenance_and_license.selected_asset_review_count} selected assets retain approved TASK-030 provenance, original-generation references, edit history, source-input records, and approval. The six project-owned planning references match their hashes and contributed no source pixels. The approved review ledger confirms text-free imagery, technical safety, no hidden solution, no pseudo-text, no third-party brand claim, and no named-artist imitation. No runtime generation or network dependency exists.\n\nThe complete TASK-030 delivery is **${audit.repository_budget.complete_task_030_delivery_bytes.toLocaleString('en-US')} / ${audit.repository_budget.pages_budget_bytes.toLocaleString('en-US')} bytes (${audit.repository_budget.budget_percent_used}%)**, leaving ${audit.repository_budget.remaining_pages_budget_bytes.toLocaleString('en-US')} bytes of the reviewed Pages budget.\n\n## Responsive, fallback, and release boundary\n\nThe resolver selected every production asset under desktop, mobile, and reduced-data profiles (${audit.resolver_contract.production_resolutions_verified} checks). Missing backgrounds and characters resolve to approved same-layer decorative fallbacks with empty alt text; Story meaning, Match authority, focus order, and reduced-motion behavior remain in HTML/runtime state.\n\nNo ${code('content/story-v1/candidates/')} path appears in the Pages staging manifest or live Story client. TASK-046 alone owns publication and migration.\n\n## Immutable TASK-030 runtime pins\n\n${pinRows}\n\n## Disposition\n\nTASK-045 is complete as a deterministic verification-only pass. It changed no topology, dialogue, domain content, gameplay, art pixels, manifest, resolver, contact sheet, or live staging. No owner approval or unresolved item remains.\n`;
}

export function stableTask045ArtAuditJson(audit) {
  return `${JSON.stringify(audit, null, 2)}\n`;
}

export async function generateTask045ArtAudit({ check = false } = {}) {
  const audit = await buildTask045ArtAudit(await loadTask045ArtAuditInputs());
  const outputs = new Map([
    [TASK_045_ART_AUDIT_OUTPUTS.json, stableTask045ArtAuditJson(audit)],
    [TASK_045_ART_AUDIT_OUTPUTS.markdown, renderTask045ArtAudit(audit)],
  ]);
  if (check) {
    const stale = [];
    for (const [outputPath, expected] of outputs) {
      const actual = await readFile(outputPath, 'utf8').catch(() => null);
      if (actual !== expected) stale.push(path.relative(ROOT, outputPath).replaceAll('\\', '/'));
    }
    if (stale.length) throw new Error(`TASK-045 art audit outputs are stale or missing: ${stale.join(', ')}.`);
  } else {
    await mkdir(path.dirname(TASK_045_ART_AUDIT_OUTPUTS.json), { recursive: true });
    await Promise.all([...outputs].map(([outputPath, contents]) => writeFile(outputPath, contents)));
  }
  return audit;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const check = process.argv.includes('--check');
  const audit = await generateTask045ArtAudit({ check });
  console.log(`${check ? 'Checked' : 'Generated'} ${audit.candidate_reference_join.statement_reference_count} Story references across ${audit.asset_audit.production_counts.total} approved production assets with ${audit.asset_audit.gap_count} gaps.`);
}
