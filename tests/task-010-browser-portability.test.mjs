import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  cp,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  buildTickets as buildCanonicalTickets,
} from '../src/builder/ticket-builder.mjs';
import {
  canonicalJson as canonicalBuilderJson,
  deterministicUnitInterval,
  sha256,
} from '../src/builder/canonical.mjs';
import {
  deterministicShuffle,
  digest,
} from '../src/engine/determinism.mjs';
import { sha256Hex } from '../src/shared/sha256.mjs';
import {
  bindResolvedImage,
  loadArtManifest,
  validateArtManifest,
} from '../viewer/js/play/art-resolver.mjs';
import { loadPlayCatalog } from '../viewer/js/play/catalog-service.mjs';
import {
  buildTickets as buildStagedTickets,
} from '../viewer/generated/play/src/builder/ticket-builder.mjs';
import {
  canonicalJson as stagedBuilderJson,
  deterministicUnitInterval as stagedUnitInterval,
  sha256 as stagedSha256,
} from '../viewer/generated/play/src/builder/canonical.mjs';
import {
  deterministicShuffle as stagedShuffle,
  digest as stagedDigest,
} from '../viewer/generated/play/src/engine/determinism.mjs';
import {
  GENERATED_PLAY_MANIFEST,
  GENERATED_PLAY_ROOT,
  REPOSITORY_ROOT,
  createExpectedPlayManifest,
} from '../viewer/scripts/build-play-assets.mjs';
import { verifyPlayAssets } from '../viewer/scripts/verify-play-assets.mjs';

const readJson = async (relativePath) => JSON.parse(
  await readFile(path.join(REPOSITORY_ROOT, ...relativePath.split('/')), 'utf8'),
);

async function listFiles(root, relativeDirectory = '') {
  const entries = await readdir(path.join(root, relativeDirectory), { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const relative = path.join(relativeDirectory, entry.name);
    if (entry.isDirectory()) files.push(...await listFiles(root, relative));
    else if (entry.isFile()) files.push(relative.split(path.sep).join('/'));
  }
  return files.sort();
}

function soloBuilderConfiguration(cardDefinitionIds, requestedTicketCount = 10) {
  return {
    id: 'builder_config.solo_pages_portability',
    entity_type: 'ticket_builder_configuration',
    configuration_version: 'ticket-builder-v1',
    scenario_or_mode_context: 'TRAINING',
    requested_ticket_count: requestedTicketCount,
    seed: 'task-010-browser-portability-seed',
    generator_version: 'ticket-builder-v1',
    content_version: 'core-ticket-templates-v1',
    domain_content_version: 'core-domain-snapshot-v1',
    card_catalog_version: 'core-card-catalog-v1',
    allowed_domain_ids: [],
    excluded_domain_ids: [],
    allowed_tags: [],
    excluded_tags: [],
    guaranteed_categories: [],
    required_teaching_beats: [],
    authored_difficulty_bounds: { minimum: 1, maximum: 4 },
    fault_count_bounds: { minimum: 1, maximum: 2 },
    required_actionable_fault_count_bounds: { minimum: 1, maximum: 2 },
    causal_depth_bounds: { minimum: 0, maximum: 1 },
    inbound_branching_bounds: { minimum: 0, maximum: 1 },
    outbound_branching_bounds: { minimum: 0, maximum: 1 },
    progressive_difficulty_profile: {
      profile_id: 'profile.solo_pages_portability',
      profile_version: 'v1',
      explicit_ceiling: 4,
      bands: [{
        start_generated_index: 0,
        end_generated_index: requestedTicketCount - 1,
        target: 2,
        minimum: 1,
        maximum: 4,
      }],
    },
    generation_index_start: 0,
    allow_duplicate_causal_fingerprints: true,
    active_causal_fingerprints: [],
    legal_card_definition_ids: cardDefinitionIds,
    fallback_configuration_id: null,
  };
}

test('shared synchronous SHA-256 matches Node and preserves TASK-009 deterministic vectors', () => {
  const vectors = [
    '',
    'abc',
    'night-🌙-shift',
    '\ud800',
    'a'.repeat(1024),
  ];
  for (const value of vectors) {
    const expected = createHash('sha256').update(value, 'utf8').digest('hex');
    assert.equal(sha256Hex(value), expected, JSON.stringify(value));
    assert.equal(sha256(value), expected, JSON.stringify(value));
    assert.equal(stagedSha256(value), expected, JSON.stringify(value));
  }

  const object = { z: 1, a: [3, { y: 'x', b: true }] };
  assert.equal(canonicalBuilderJson(object), '{"a":[3,{"b":true,"y":"x"}],"z":1}');
  assert.equal(stagedBuilderJson(object), canonicalBuilderJson(object));
  assert.equal(sha256(object), '963dcaca4a7940a6cd54c0d2a5430d43be4e6617a6cb36f976641d1239fc2217');
  assert.equal(digest(object), '963dcaca4a7940a6cd54c0d2a5430d43be4e6617a6cb36f976641d1239fc2217');
  assert.equal(stagedDigest(object), digest(object));
  assert.throws(() => sha256(undefined), TypeError);
  assert.throws(() => digest(undefined), TypeError);
  assert.throws(() => stagedSha256(undefined), TypeError);
  assert.throws(() => stagedDigest(undefined), TypeError);
  assert.equal(deterministicUnitInterval('seed', 'namespace', 7), 0.14207822241222506);
  assert.equal(stagedUnitInterval('seed', 'namespace', 7), deterministicUnitInterval('seed', 'namespace', 7));
  assert.deepEqual(deterministicShuffle(['a', 'b', 'c', 'd', 'e'], 'seed', 'stream'), {
    values: ['e', 'd', 'c', 'b', 'a'],
    counter: 4,
  });
  assert.deepEqual(stagedShuffle(['a', 'b', 'c', 'd', 'e'], 'seed', 'stream'),
    deterministicShuffle(['a', 'b', 'c', 'd', 'e'], 'seed', 'stream'));
});

test('canonical and staged Builder modules produce snapshot-identical 1- and 10-Ticket batches', async () => {
  const [ticketContent, domainCatalog, cardCatalog] = await Promise.all([
    readJson('content/gameplay-v1/ticket-templates.json'),
    readJson('content/gameplay-v1/domain-snapshot.json'),
    readJson('content/gameplay-v1/card-catalog.json'),
  ]);
  const cardDefinitionIds = cardCatalog.cards.map((card) => card.id);
  for (const requestedTicketCount of [1, 10]) {
    const configuration = soloBuilderConfiguration(cardDefinitionIds, requestedTicketCount);
    const input = { configuration, ticketContent, domainCatalog, cardCatalog };
    const canonical = buildCanonicalTickets(input);
    const staged = buildStagedTickets(structuredClone(input));
    assert.equal(canonical.status, 'SUCCESS');
    assert.equal(canonical.attempts[0].ticket_snapshots.length, requestedTicketCount);
    assert.deepEqual(staged, canonical);
  }
});

test('generated Play manifest is deterministic, complete, denylist-clean, and free of Node-only runtime imports', async () => {
  const expected = await createExpectedPlayManifest();
  assert.deepEqual(await createExpectedPlayManifest(), expected);
  assert.deepEqual(JSON.parse(await readFile(GENERATED_PLAY_MANIFEST, 'utf8')), expected);

  const manifestSources = new Set(expected.files.map((entry) => entry.source));
  for (const sourceDirectory of ['src/engine', 'src/builder', 'src/shared']) {
    const sourceFiles = await listFiles(path.join(REPOSITORY_ROOT, ...sourceDirectory.split('/')));
    for (const relative of sourceFiles.filter((file) => file.endsWith('.mjs'))) {
      assert.ok(manifestSources.has(`${sourceDirectory}/${relative}`), `${sourceDirectory}/${relative}`);
    }
  }
  for (const gameplayFile of [
    'card-catalog.json',
    'decks.json',
    'domain-snapshot.json',
    'ticket-templates.json',
  ]) {
    assert.ok(manifestSources.has(`content/gameplay-v1/${gameplayFile}`));
  }
  for (const relative of await listFiles(path.join(REPOSITORY_ROOT, 'viewer', 'assets', 'play'))) {
    assert.ok(manifestSources.has(`viewer/assets/play/${relative}`), `viewer/assets/play/${relative}`);
  }

  const denylisted = /(^|\/)(?:simulation|tests?|tools?|reports?|automated_games)(?:\/|$)/;
  assert.ok(expected.files.every((entry) => !denylisted.test(entry.path)),
    'server/simulation/test/report material must not be staged');
  for (const entry of expected.files.filter((file) => file.path.endsWith('.mjs'))) {
    const source = await readFile(path.join(GENERATED_PLAY_ROOT, ...entry.path.split('/')), 'utf8');
    assert.doesNotMatch(source, /\b(?:from|import)\s*['"]node:/, entry.path);
  }
  await verifyPlayAssets();
});

test('Play asset verification rejects missing, unexpected, and corrupted generated files', async () => {
  const temporaryParent = await mkdtemp(path.join(os.tmpdir(), 'server-repair-play-assets-'));
  const temporaryRoot = path.join(temporaryParent, 'play');
  const temporaryManifest = path.join(temporaryRoot, 'manifest.json');
  try {
    await cp(GENERATED_PLAY_ROOT, temporaryRoot, { recursive: true });
    await verifyPlayAssets({ generatedRoot: temporaryRoot, generatedManifest: temporaryManifest });

    const unexpectedPath = path.join(temporaryRoot, 'simulation', 'secret.mjs');
    await mkdir(path.dirname(unexpectedPath), { recursive: true });
    await writeFile(unexpectedPath, 'export default true;\n', 'utf8');
    await assert.rejects(
      verifyPlayAssets({ generatedRoot: temporaryRoot, generatedManifest: temporaryManifest }),
      /unexpected generated asset/,
    );
    await rm(path.dirname(unexpectedPath), { recursive: true, force: true });

    const modulePath = path.join(temporaryRoot, 'src', 'engine', 'determinism.mjs');
    await writeFile(modulePath, `${await readFile(modulePath, 'utf8')}\n// corrupt\n`, 'utf8');
    await assert.rejects(
      verifyPlayAssets({ generatedRoot: temporaryRoot, generatedManifest: temporaryManifest }),
      /size mismatch|hash mismatch/,
    );
    await rm(modulePath);
    await assert.rejects(
      verifyPlayAssets({ generatedRoot: temporaryRoot, generatedManifest: temporaryManifest }),
      /missing generated asset/,
    );
  } finally {
    await rm(temporaryParent, { recursive: true, force: true });
  }
});

test('Pages deployment rebuilds and freshness-checks every canonical Play dependency', async () => {
  const workflow = await readFile(path.join(REPOSITORY_ROOT, '.github', 'workflows', 'deploy-pages.yml'), 'utf8');
  for (const trigger of [
    'viewer/**',
    'src/engine/**',
    'src/builder/**',
    'src/shared/**',
    'content/gameplay-v1/**',
    'assets/**',
    'package.json',
    'pnpm-lock.yaml',
  ]) {
    assert.match(workflow, new RegExp(trigger.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.match(workflow, /node viewer\/scripts\/build-play-assets\.mjs/);
  assert.match(workflow, /node viewer\/scripts\/verify-play-assets\.mjs/);
  const buildIndex = workflow.indexOf('node viewer/scripts/build-play-assets.mjs');
  assert.ok(workflow.indexOf('node viewer/scripts/verify-play-assets.mjs') < buildIndex,
    'committed assets are checked before a build can repair stale output');
  assert.ok(workflow.lastIndexOf('node viewer/scripts/verify-play-assets.mjs') > buildIndex,
    'the freshly built artifact is checked again');
  assert.match(workflow, /git diff --exit-code -- viewer\/generated\/play/);
  assert.match(workflow, /path: viewer/);
});

test('missing or corrupt Play content and art fail closed with intentional image fallback', async () => {
  const contentRoot = new URL('https://content.invalid/gameplay-v1/');
  await assert.rejects(
    loadPlayCatalog({
      cache: false,
      contentRoot,
      fetchImpl: async () => ({ ok: false, status: 404 }),
    }),
    /returned 404/,
  );
  await assert.rejects(
    loadPlayCatalog({
      cache: false,
      contentRoot,
      fetchImpl: async () => ({ ok: true, status: 200, json: async () => ({}) }),
    }),
    /incompatible|missing/i,
  );
  await assert.rejects(
    loadArtManifest({ fetchImpl: async () => ({ ok: false, status: 503 }) }),
    /failed to load \(503\)/,
  );
  assert.throws(() => validateArtManifest({}), /plain object with known fields|Unsupported/);

  const listeners = new Map();
  const image = {
    alt: '',
    dataset: {},
    hidden: false,
    _src: '',
    addEventListener(type, handler) { listeners.set(type, handler); },
    removeEventListener(type) { listeners.delete(type); },
    setAttribute() {},
    removeAttribute(name) { if (name === 'src') this._src = ''; },
    get src() { return this._src; },
    set src(value) { this._src = value; },
  };
  const unbind = bindResolvedImage(image, {
    assetId: 'card.primary',
    src: 'https://assets.invalid/primary.svg',
    alt: 'Primary technical illustration.',
    decorative: false,
    fallback: {
      assetId: 'placeholder.card.generic',
      src: 'https://assets.invalid/fallback.svg',
      alt: 'Generic server placeholder.',
    },
  });
  listeners.get('error')();
  assert.equal(image.src, 'https://assets.invalid/fallback.svg');
  assert.equal(image.dataset.assetId, 'placeholder.card.generic');
  listeners.get('error')();
  assert.equal(image.hidden, true);
  assert.equal(image.dataset.artStatus, 'error');
  assert.equal(image.src, '');
  unbind();
});

test('semantic motion degrades to immediate state when Anime.js cannot load', async () => {
  const source = await readFile(path.join(
    REPOSITORY_ROOT,
    'viewer',
    'js',
    'play',
    'motion-coordinator.mjs',
  ), 'utf8');
  const dataUrl = `data:text/javascript;base64,${Buffer.from(source).toString('base64')}#missing-anime`;
  const originalWarn = console.warn;
  const originalAnimationFrame = globalThis.requestAnimationFrame;
  const warnings = [];
  let cleared = 0;
  console.warn = (...values) => warnings.push(values.join(' '));
  globalThis.requestAnimationFrame = (callback) => {
    callback();
    return 1;
  };
  try {
    const motion = await import(dataUrl);
    motion.configureMotion(() => 'FULL');
    const animatedElement = { removeAttribute: () => { cleared += 1; } };
    const root = {
      querySelector: () => null,
      querySelectorAll: (selector) => (selector === '[data-route-reveal]' || selector === '[data-motion-state]'
        ? [animatedElement]
        : []),
    };
    assert.equal(motion.runMotion('route', root), null);
    assert.equal(cleared, 1);
    assert.ok(warnings.some((warning) => warning.includes('semantic motion is disabled')));
  } finally {
    console.warn = originalWarn;
    if (originalAnimationFrame === undefined) delete globalThis.requestAnimationFrame;
    else globalThis.requestAnimationFrame = originalAnimationFrame;
  }
});
