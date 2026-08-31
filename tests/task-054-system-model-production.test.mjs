import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import { canonicalJson, sha256 } from '../src/builder/canonical.mjs';
import {
  buildProductionProjectionCatalog,
  materializePlayerSystemProjection,
  productionProjectionSafetyIssues,
  SYSTEM_MODEL_PROFILE_INTRO,
  SYSTEM_MODEL_UNAVAILABLE_MESSAGE,
} from '../src/system-models/production.mjs';
import { buildPublicProjectionArtifacts } from '../content/system-model-story-v1/build-public-projections.mjs';
import { createExpectedPlayManifest } from '../viewer/scripts/build-play-assets.mjs';
import {
  clearSystemModelProjectionCache,
  getTicketSystemProjection,
  loadSystemModelProjectionCatalog,
  loadTicketSystemProjection,
} from '../viewer/js/play/system-model-service.mjs';
import {
  loadSchemaRegistry,
  validateJsonSchema,
} from './helpers/json-schema-validator.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'));
const BUILT_ARTIFACTS = buildPublicProjectionArtifacts();

function collectValuesByKey(value, key, result = []) {
  if (Array.isArray(value)) {
    value.forEach((item) => collectValuesByKey(item, key, result));
  } else if (value && typeof value === 'object') {
    for (const [childKey, child] of Object.entries(value)) {
      if (childKey === key && Array.isArray(child)) result.push(...child);
      collectValuesByKey(child, key, result);
    }
  }
  return result;
}

function withoutProjectionCache(projection) {
  const copy = structuredClone(projection);
  delete copy.cache_key;
  delete copy.projection_digest;
  return copy;
}

function withoutSerialization(value) {
  const copy = structuredClone(value);
  delete copy.serialization;
  return copy;
}

function withCatalogDigest(catalog) {
  catalog.serialization.content_digest = sha256(canonicalJson(withoutSerialization(catalog)));
  return catalog;
}

function genericUnavailable() {
  return { status: 'UNAVAILABLE', message: SYSTEM_MODEL_UNAVAILABLE_MESSAGE };
}

test('all released Story System projections build twice, satisfy the closed public schema, and match the exact denominator', () => {
  const first = BUILT_ARTIFACTS;
  const second = buildPublicProjectionArtifacts();
  assert.equal(first.source, second.source);
  assert.equal(first.reportSource, second.reportSource);
  assert.equal(first.projectionCatalog.ticket_bindings.length, 18);
  assert.equal(first.projectionCatalog.profile_projections.length, 3);
  assert.deepEqual(productionProjectionSafetyIssues(first.projectionCatalog), []);
  assert.doesNotMatch(first.source, /fingerprint\./iu);
  assert.doesNotMatch(first.source, /fingerprint_id|ticket_focus_statement/iu);
  const privateBindings = readJson('content/system-model-story-v1/ticket-system-bindings-v2.json').bindings;
  for (const binding of privateBindings) {
    assert.equal(first.source.includes(binding.ticket_focus_statement), false, binding.ticket_id);
  }
  assert.equal(
    first.projectionCatalog.serialization.content_digest,
    sha256(canonicalJson(withoutSerialization(first.projectionCatalog))),
  );
  for (const profile of first.projectionCatalog.profile_projections) {
    assert.equal(profile.intro, SYSTEM_MODEL_PROFILE_INTRO);
    assert.equal(profile.serialization.content_digest, sha256(canonicalJson(withoutSerialization(profile))));
  }
  assert.equal(first.report.totals.tickets_resolved, 18);
  assert.equal(first.report.totals.compatibility_proofs_passed, 18);
  assert.equal(first.report.totals.deterministic_builds_compared, 2);
  assert.equal(first.report.serialization.content_digest, sha256(canonicalJson(withoutSerialization(first.report))));
  assert.ok(first.report.ticket_results.every((entry) =>
    entry.resolution.steps.at(-1).code === 'ONE_SOURCE_PROJECTION_ACCEPTED'));
  assert.ok(first.report.fallback_results.every((entry) =>
    entry.status === 'UNAVAILABLE'
      && entry.public_message === SYSTEM_MODEL_UNAVAILABLE_MESSAGE
      && entry.fabricated_projection === false
      && entry.gameplay_effect === 'NONE'));

  const registry = loadSchemaRegistry(ROOT);
  const schema = registry.schemas.find(({ filePath }) =>
    filePath.endsWith('system_model_player_projection_catalog.schema.json'))?.schema;
  assert.ok(schema);
  assert.deepEqual(validateJsonSchema(first.projectionCatalog, schema, registry), []);
  const playerSchema = { $id: schema.$id, ...schema.$defs.playerProjection };
  for (const ticketBinding of first.projectionCatalog.ticket_bindings) {
    const projection = materializePlayerSystemProjection({
      catalog: first.projectionCatalog,
      ticketBinding,
    });
    assert.deepEqual(validateJsonSchema(projection, playerSchema, registry), [], ticketBinding.ticket_id);
  }

  const coverage = readJson('docs/story/coverage/released-story-domain-coverage-v3.json');
  const releasedTickets = coverage.matches.flatMap((match) => match.tickets)
    .map((ticket) => [ticket.ticket_id, ticket.ticket_snapshot_digest])
    .sort(([left], [right]) => left.localeCompare(right));
  const projectedTickets = first.projectionCatalog.ticket_bindings
    .map((ticket) => [ticket.ticket_id, ticket.ticket_snapshot_digest])
    .sort(([left], [right]) => left.localeCompare(right));
  assert.deepEqual(projectedTickets, releasedTickets);
});

test('deduplicated profile cores materialize stable complete player projections for reload, replay, and serialized Ticket pins', () => {
  const { projectionCatalog, measurements } = BUILT_ARTIFACTS;
  assert.ok(measurements.raw_bytes < measurements.naive_repeated_bytes);
  assert.ok(measurements.deduplicated_bytes_saved > 0);
  assert.ok(measurements.gzip_bytes < measurements.raw_bytes);

  for (const ticketBinding of projectionCatalog.ticket_bindings) {
    const first = materializePlayerSystemProjection({ catalog: projectionCatalog, ticketBinding });
    const reloadedBinding = JSON.parse(JSON.stringify(ticketBinding));
    const second = materializePlayerSystemProjection({ catalog: projectionCatalog, ticketBinding: reloadedBinding });
    assert.deepEqual(second, first);
    assert.equal(first.projection_digest, sha256(canonicalJson(withoutProjectionCache(first))));
    assert.equal(first.ticket_ref.ticket_id, ticketBinding.ticket_id);
    assert.equal(first.ticket_ref.ticket_snapshot_digest, ticketBinding.ticket_snapshot_digest);
    assert.deepEqual(Object.keys(first.ticket_ref).sort(), ['ticket_id', 'ticket_snapshot_digest']);
    assert.equal(first.intro, SYSTEM_MODEL_PROFILE_INTRO);
    assert.ok(first.descriptions.concise.length > 0);
    assert.ok(first.descriptions.extended.length >= first.descriptions.concise.length);
    assert.ok(first.lifecycle.entries.length > 0);
    assert.equal(first.topology.text_equivalent.ordered_node_sentences.length, first.topology.nodes.length);
    assert.equal(first.topology.text_equivalent.ordered_edge_sentences.length, first.topology.edges.length);
    assert.ok(first.components.length > 0);
    assert.deepEqual(Object.keys(first.rationales).sort(), ['COMMAND', 'REPAIR', 'TEST', 'VERIFICATION']);
    assert.ok(first.learning_references.length > 0);
    assert.equal(first.authority_boundary.gameplay_effect, 'NONE');
  }
});

test('every staged semantic and learning reference resolves inside one public profile core', () => {
  const { projectionCatalog } = BUILT_ARTIFACTS;
  for (const core of projectionCatalog.profile_projections) {
    const nodeIds = new Set(core.topology.nodes.map((node) => node.node_id));
    const edgeIds = new Set(core.topology.edges.map((edge) => edge.edge_id));
    const pathIds = new Set(core.topology.paths.map((modelPath) => modelPath.path_id));
    const stageIds = new Set(core.lifecycle.entries.map((entry) => entry.stage_id));
    const roleIds = new Set(core.components.map((component) => component.role_id));
    for (const edge of core.topology.edges) {
      assert.ok(nodeIds.has(edge.from_node_id), edge.edge_id);
      assert.ok(nodeIds.has(edge.to_node_id), edge.edge_id);
    }
    for (const modelPath of core.topology.paths) {
      assert.ok(modelPath.node_ids.every((id) => nodeIds.has(id)), modelPath.path_id);
      assert.ok(modelPath.edge_ids.every((id) => edgeIds.has(id)), modelPath.path_id);
    }
    for (const component of core.components) assert.ok(roleIds.has(component.role_id));
    for (const graphs of Object.values(core.rationales)) {
      for (const graph of graphs) {
        assert.ok(graph.target_node_ids.every((id) => nodeIds.has(id)), graph.attachment_id);
        assert.ok(graph.target_path_ids.every((id) => pathIds.has(id)), graph.attachment_id);
        assert.ok(graph.relevant_stage_ids.every((id) => stageIds.has(id)), graph.attachment_id);
      }
    }
    const referencedClaims = new Set(collectValuesByKey(core, 'source_claim_ids'));
    const documentedClaims = new Set(core.learning_references.flatMap((source) => source.relevant_claim_ids));
    assert.deepEqual([...referencedClaims].filter((id) => !documentedClaims.has(id)), []);
    for (const source of core.learning_references) assert.match(source.url, /^https:\/\//u);
  }
});

test('the browser service caches by explicit versions and returns only AVAILABLE projection or generic UNAVAILABLE', async () => {
  const { projectionCatalog } = BUILT_ARTIFACTS;
  const binding = projectionCatalog.ticket_bindings[0];
  let fetchCount = 0;
  const fetchImpl = async () => {
    fetchCount += 1;
    return { ok: true, status: 200, json: async () => structuredClone(projectionCatalog) };
  };
  const contentRoot = new URL('../viewer/generated/play/content/system-model-story-v1/', import.meta.url);
  clearSystemModelProjectionCache();
  const firstCatalog = await loadSystemModelProjectionCatalog({ fetchImpl, contentRoot });
  const secondCatalog = await loadSystemModelProjectionCatalog({ fetchImpl, contentRoot });
  assert.equal(firstCatalog, secondCatalog);
  assert.equal(fetchCount, 1);
  const available = getTicketSystemProjection(firstCatalog, {
    ticketDefinitionId: binding.ticket_id,
    ticketSnapshotDigest: binding.ticket_snapshot_digest,
  });
  assert.equal(available.status, 'AVAILABLE');
  const cachedAvailable = getTicketSystemProjection(firstCatalog, {
    ticketDefinitionId: binding.ticket_id,
    ticketSnapshotDigest: binding.ticket_snapshot_digest,
  });
  assert.equal(cachedAvailable.projection, available.projection);
  assert.equal(Object.isFrozen(available.projection), true);
  assert.deepEqual(
    available.projection,
    materializePlayerSystemProjection({ catalog: projectionCatalog, ticketBinding: binding }),
  );
  const unknown = getTicketSystemProjection(firstCatalog, { ticketDefinitionId: 'ticket.generated.unknown' });
  const mismatched = getTicketSystemProjection(firstCatalog, {
    ticketDefinitionId: binding.ticket_id,
    ticketSnapshotDigest: '0'.repeat(64),
  });
  assert.deepEqual(unknown, { status: 'UNAVAILABLE', message: SYSTEM_MODEL_UNAVAILABLE_MESSAGE });
  assert.deepEqual(mismatched, unknown);
  const fetchFailure = await loadTicketSystemProjection({
    ticketDefinitionId: binding.ticket_id,
    contentRoot,
    cache: false,
    fetchImpl: async () => { throw new Error('network detail must not escape'); },
  });
  assert.deepEqual(fetchFailure, unknown);
});

test('fallback copy is one immutable contract across schema, production build, and malicious browser content', async () => {
  const { projectionCatalog } = BUILT_ARTIFACTS;
  const binding = projectionCatalog.ticket_bindings[0];
  const malicious = structuredClone(projectionCatalog);
  malicious.fallback.public_message = 'A plausible but attacker-controlled fallback.';
  withCatalogDigest(malicious);

  const registry = loadSchemaRegistry(ROOT);
  const schema = registry.schemas.find(({ filePath }) =>
    filePath.endsWith('system_model_player_projection_catalog.schema.json'))?.schema;
  assert.ok(validateJsonSchema(malicious, schema, registry).length > 0);
  assert.throws(() => buildProductionProjectionCatalog({
    catalog: { fallback: { public_message: malicious.fallback.public_message } },
    bindingCatalog: { bindings: [] },
    privateCatalog: { compatibility_proofs: [] },
    sourceLedger: { sources: [] },
    resolveBinding() {},
    validateCompatibility() {},
  }), /approved public message/u);
  assert.deepEqual(getTicketSystemProjection(malicious, {
    ticketDefinitionId: binding.ticket_id,
  }), genericUnavailable());

  const loaded = await loadTicketSystemProjection({
    ticketDefinitionId: binding.ticket_id,
    contentRoot: new URL('../viewer/generated/play/content/system-model-story-v1/', import.meta.url),
    cache: false,
    fetchImpl: async () => ({ ok: true, status: 200, json: async () => malicious }),
  });
  assert.deepEqual(loaded, genericUnavailable());
});

test('the browser rejects malformed render data, unsafe URLs, broken refs, and hostile object graphs before rendering', () => {
  const { projectionCatalog } = BUILT_ARTIFACTS;
  const ticketDefinitionId = projectionCatalog.ticket_bindings[0].ticket_id;
  const malformed = [];

  const nullTopology = structuredClone(projectionCatalog);
  nullTopology.profile_projections[0].topology = null;
  malformed.push(nullTopology);

  const nonFiniteLayout = structuredClone(projectionCatalog);
  nonFiniteLayout.profile_projections[0].topology.nodes[0].layout.x = Number.POSITIVE_INFINITY;
  malformed.push(nonFiniteLayout);

  const injectedLayout = structuredClone(projectionCatalog);
  injectedLayout.profile_projections[0].topology.nodes[0].layout.x = '0\" onload=\"globalThis.compromised=true';
  malformed.push(injectedLayout);

  const badUrl = structuredClone(projectionCatalog);
  badUrl.profile_projections[0].learning_references[0].url = 'javascript:globalThis.compromised=true';
  malformed.push(badUrl);

  const badNodeRef = structuredClone(projectionCatalog);
  badNodeRef.profile_projections[0].topology.edges[0].from_node_id = 'node.missing';
  malformed.push(badNodeRef);

  const wrongProfileRef = structuredClone(projectionCatalog);
  wrongProfileRef.ticket_bindings[0].profile_cache_key = wrongProfileRef.profile_projections[1].cache_key;
  malformed.push(wrongProfileRef);

  const duplicateProjectionCache = structuredClone(projectionCatalog);
  duplicateProjectionCache.ticket_bindings[1].projection_cache_key =
    duplicateProjectionCache.ticket_bindings[0].projection_cache_key;
  malformed.push(duplicateProjectionCache);

  const wrongProjectionDigest = structuredClone(projectionCatalog);
  wrongProjectionDigest.ticket_bindings[0].projection_digest = '0'.repeat(64);
  malformed.push(wrongProjectionDigest);

  const wrongProfileDigest = structuredClone(projectionCatalog);
  wrongProfileDigest.profile_projections[0].serialization.content_digest = '0'.repeat(64);
  malformed.push(wrongProfileDigest);

  const hostilePrototype = structuredClone(projectionCatalog);
  Object.setPrototypeOf(hostilePrototype.profile_projections[0].topology, { injected: true });
  malformed.push(hostilePrototype);

  const dangerousKey = structuredClone(projectionCatalog);
  Object.defineProperty(dangerousKey.profile_projections[0], '__proto__', {
    value: { injected: true },
    enumerable: true,
  });
  malformed.push(dangerousKey);

  for (const catalog of malformed) {
    assert.doesNotThrow(() => getTicketSystemProjection(catalog, { ticketDefinitionId }));
    assert.deepEqual(
      getTicketSystemProjection(catalog, { ticketDefinitionId }),
      genericUnavailable(),
    );
  }
});

test('private authoring data and validation diagnostics are absent from the browser bundle and staging allowlist', async () => {
  const { projectionCatalog, source } = BUILT_ARTIFACTS;
  const stagedSource = fs.readFileSync(
    path.join(ROOT, 'viewer/generated/play/content/system-model-story-v1/public-system-projections-v1.json'),
    'utf8',
  );
  const forbidden = [
    /validation_trace/iu,
    /public_resolver_key/iu,
    /resolver_key/iu,
    /compatibility_proofs/iu,
    /hidden_fault_bindings/iu,
    /authored_action_requirements/iu,
    /evidence\.[a-z0-9._-]+/iu,
    /fault_instance\.[a-z0-9._-]+/iu,
    /repair_outcome\.[a-z0-9._-]+/iu,
    /verify_outcome\.[a-z0-9._-]+/iu,
    /fingerprint\./iu,
    /fingerprint_id/iu,
    /ticket_focus_statement/iu,
  ];
  for (const pattern of forbidden) {
    assert.doesNotMatch(source, pattern);
    assert.doesNotMatch(stagedSource, pattern);
  }
  const privateBindings = readJson('content/system-model-story-v1/ticket-system-bindings-v2.json').bindings;
  for (const binding of privateBindings) {
    assert.equal(source.includes(binding.ticket_focus_statement), false, binding.ticket_id);
    assert.equal(stagedSource.includes(binding.ticket_focus_statement), false, binding.ticket_id);
  }
  assert.deepEqual(productionProjectionSafetyIssues(projectionCatalog), []);

  const manifest = await createExpectedPlayManifest();
  const stagedSystemFiles = manifest.files
    .filter((entry) => entry.source.startsWith('content/system-model-story-v1/'))
    .map((entry) => entry.source);
  assert.deepEqual(stagedSystemFiles, ['content/system-model-story-v1/public-system-projections-v1.json']);
});

test('System Model production code remains explanatory and does not become gameplay or runtime network authority', () => {
  const sources = [
    fs.readFileSync(path.join(ROOT, 'src/system-models/production.mjs'), 'utf8'),
    fs.readFileSync(path.join(ROOT, 'viewer/js/play/system-model-service.mjs'), 'utf8'),
    fs.readFileSync(path.join(ROOT, 'viewer/js/play/system-model-catalog-validator.mjs'), 'utf8'),
  ];
  for (const source of sources) {
    assert.doesNotMatch(source, /from ['"]\.\.\/engine\//u);
    assert.doesNotMatch(source, /from ['"]\.\.\/story\//u);
    assert.doesNotMatch(source, /legal_intents|deriveDiagnosticRelevance|service_points|evidence_disposition/iu);
    assert.doesNotMatch(source, /fetch\([^)]*(?:dell\.com|hpe\.com|lenovo\.com)/iu);
  }
});

test('TASK-054 production documentation links resolve repository-locally', () => {
  const markdownPaths = [
    'docs/tasks/TASK-054-productionize-story-system-resolver.md',
    'docs/system-models/task-054/README.md',
  ];
  for (const relativePath of markdownPaths) {
    const absolutePath = path.join(ROOT, relativePath);
    const source = fs.readFileSync(absolutePath, 'utf8');
    for (const match of source.matchAll(/\[[^\]]*\]\(([^)]+)\)/gu)) {
      const href = match[1].trim().replace(/^<|>$/gu, '');
      if (/^(?:https?:|mailto:|#)/iu.test(href)) continue;
      const target = decodeURIComponent(href.split('#')[0]);
      assert.equal(
        fs.existsSync(path.resolve(path.dirname(absolutePath), target)),
        true,
        `${relativePath} has missing link ${href}`,
      );
    }
  }
});
