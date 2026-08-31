import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

import { canonicalJson, sha256 } from '../src/builder/canonical.mjs';
import {
  createResolverRequest,
  resolvePublicSystemModel,
  SYSTEM_MODEL_REASON_CODES,
  validateAuthoringCompatibility,
} from '../src/system-models/resolver.mjs';
import {
  buildPublicSystemProjection,
  publicProjectionSafetyIssues,
  validateProjectionReferences,
} from '../src/system-models/projections.mjs';
import {
  buildProofArtifacts,
  materializeInvalidFixture,
} from '../docs/system-models/task-052/generate-proof.mjs';
import {
  loadSchemaRegistry,
  validateJsonSchema,
} from './helpers/json-schema-validator.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'));
const catalog = readJson('content/system-model-pilot-v1/system-model-catalog-v1.json');
const bindingCatalog = readJson('content/system-model-pilot-v1/ticket-system-bindings-v1.json');
const privateCatalog = readJson('content/system-model-pilot-v1/private-compatibility-v1.json');
const fixtureCatalog = readJson('docs/system-models/task-052/invalid-profile-fixtures-v1.json');
const proof = readJson('docs/system-models/task-052/resolver-proof-v1.json');
const schemaRegistry = loadSchemaRegistry(ROOT);
const schemas = new Map(schemaRegistry.schemas.map(({ filePath, schema }) => [path.basename(filePath, '.schema.json'), schema]));

function resolve(binding, overrides = {}, catalogs = {}) {
  return resolvePublicSystemModel({
    request: createResolverRequest(binding, overrides),
    catalog: catalogs.catalog ?? catalog,
    bindingCatalog: catalogs.bindingCatalog ?? bindingCatalog,
  });
}

function assertResolverResultSchema(result, context) {
  const errors = validateJsonSchema(result, schemas.get('system_model_resolver_result'), schemaRegistry);
  assert.deepEqual(errors, [], `${context}\n${errors.join('\n')}`);
}

function subsets(values) {
  const result = [];
  for (let mask = 1; mask < 2 ** values.length; mask += 1) {
    result.push(values.filter((_, index) => (mask & (1 << index)) !== 0));
  }
  return result;
}

function withoutSerialization(value) {
  const copy = structuredClone(value);
  delete copy.serialization;
  return copy;
}

test('the fixture catalog, proof, and all five public projections satisfy closed schemas', () => {
  const fixturesErrors = validateJsonSchema(fixtureCatalog, schemas.get('system_model_resolver_fixture_catalog'), schemaRegistry);
  assert.deepEqual(fixturesErrors, [], fixturesErrors.join('\n'));
  const proofErrors = validateJsonSchema(proof, schemas.get('system_model_resolver_proof'), schemaRegistry);
  assert.deepEqual(proofErrors, [], proofErrors.join('\n'));
  assert.equal(proof.cases.length, 5);
  for (const caseRecord of proof.cases) {
    const projection = readJson(caseRecord.public_projection_path);
    const errors = validateJsonSchema(projection, schemas.get('system_model_public_projection'), schemaRegistry);
    assert.deepEqual(errors, [], `${caseRecord.public_projection_path}\n${errors.join('\n')}`);
  }
});

test('the resolver deterministically selects the pinned profile for all five public Ticket inputs', () => {
  assert.equal(bindingCatalog.bindings.length, 5);
  for (const binding of bindingCatalog.bindings) {
    const first = resolve(binding);
    const second = resolve(binding);
    assertResolverResultSchema(first, binding.binding_id);
    assert.equal(first.status, 'RESOLVED', binding.binding_id);
    assert.equal(first.reason_code, SYSTEM_MODEL_REASON_CODES.RESOLVED);
    assert.equal(first.selected_profile_id, binding.profile_ref.profile_id);
    assert.equal(first.selected_profile_revision, binding.profile_ref.profile_revision);
    assert.equal(first.public_binding_digest, binding.serialization.content_digest);
    assert.equal(first.gameplay_effect, 'NONE');
    assert.equal(canonicalJson(first), canonicalJson(second));
    assert.equal(first.serialization.content_digest, sha256(canonicalJson(withoutSerialization(first))));
    assert.deepEqual(first.validation_trace.map((step) => step.code), [
      'PUBLIC_INPUTS_ACCEPTED',
      'EXACTLY_ONE_BINDING',
      'PUBLIC_SURFACE_AND_ACTIVE_CANDIDATES_ACCEPTED',
      'PROFILE_ID_REVISION_ACCEPTED',
      'PUBLIC_CAPABILITY_TOPOLOGY_AND_CLOSURE_ACCEPTED',
      'PROFILE_DIGEST_ACCEPTED',
      'ONE_SOURCE_PROJECTION_ACCEPTED',
    ]);
  }
});

test('absence, binding/profile ambiguity, resolver-key drift, and version drift fail closed without selecting a fallback profile', () => {
  const binding = bindingCatalog.bindings[0];
  const cases = [
    [
      resolvePublicSystemModel({
        request: createResolverRequest(binding, { ticket_id: 'ticket.generated.no-public-binding' }),
        catalog,
        bindingCatalog,
      }),
      SYSTEM_MODEL_REASON_CODES.NO_PUBLIC_BINDING,
    ],
    [
      resolvePublicSystemModel({
        request: createResolverRequest(binding),
        catalog,
        bindingCatalog: { ...bindingCatalog, bindings: [...bindingCatalog.bindings, structuredClone(binding)] },
      }),
      SYSTEM_MODEL_REASON_CODES.AMBIGUOUS_PUBLIC_BINDING,
    ],
    [resolve(binding, { public_resolver_key: 'resolver.invalid.public-key.v1' }), SYSTEM_MODEL_REASON_CODES.RESOLVER_KEY_MISMATCH],
    [resolve(binding, { profile_revision: 2 }), SYSTEM_MODEL_REASON_CODES.PROFILE_PIN_MISMATCH],
    [
      resolve(binding, {}, {
        catalog: { ...catalog, profiles: [...catalog.profiles, structuredClone(catalog.profiles[0])] },
      }),
      SYSTEM_MODEL_REASON_CODES.AMBIGUOUS_PROFILE_PIN,
    ],
  ];
  const messages = new Set();
  for (const [result, reason] of cases) {
    assertResolverResultSchema(result, reason);
    assert.equal(result.status, 'UNAVAILABLE');
    assert.equal(result.reason_code, reason);
    assert.equal(result.selected_profile_id, null);
    assert.equal(result.public_projection, null);
    assert.equal(result.gameplay_effect, 'NONE');
    messages.add(result.fallback.public_message);
  }
  assert.equal(messages.size, 1);
});

test('all five deliberately invalid profiles reject with their stable public-safe reason codes', () => {
  assert.equal(fixtureCatalog.fixtures.length, 5);
  const results = fixtureCatalog.fixtures.map((fixture) => {
    const materialized = materializeInvalidFixture({ fixture, catalog, bindingCatalog });
    const result = resolvePublicSystemModel({
      request: materialized.request,
      catalog: materialized.catalog,
      bindingCatalog: materialized.bindingCatalog,
    });
    assertResolverResultSchema(result, fixture.fixture_id);
    assert.equal(result.status, 'UNAVAILABLE', fixture.fixture_id);
    assert.equal(result.reason_code, fixture.expected_reason_code, fixture.fixture_id);
    assert.equal(result.selected_profile_id, null);
    assert.equal(result.gameplay_effect, 'NONE');
    assert.equal(result.validation_trace.at(-1).code, fixture.expected_reason_code);
    return result;
  });
  assert.equal(new Set(results.map((result) => result.reason_code)).size, 5);
  assert.equal(new Set(results.map((result) => result.fallback.public_message)).size, 1);
});

test('21 authoring variants cannot change any byte of their public projections', () => {
  let variantCount = 0;
  for (const binding of bindingCatalog.bindings) {
    const base = resolve(binding);
    const publicBytes = canonicalJson(base.public_projection);
    const compatibilityProof = privateCatalog.compatibility_proofs.find((candidate) => candidate.binding_id === binding.binding_id);
    const validation = validateAuthoringCompatibility({ resolution: base, compatibilityProof });
    assert.equal(validation.status, 'PASS');
    assert.equal(validation.public_projection_digest, base.public_projection.serialization.content_digest);
    for (const variant of compatibilityProof.differential_variants) {
      variantCount += 1;
      assert.ok(variant.variant_id);
      const repeated = resolve(binding);
      assert.equal(canonicalJson(repeated.public_projection), publicBytes);
    }
  }
  assert.equal(variantCount, 21);
  const binding = bindingCatalog.bindings[0];
  const base = resolve(binding);
  const mismatched = structuredClone(privateCatalog.compatibility_proofs[0]);
  mismatched.differential_variants[0].expected_public_binding_digest = '0'.repeat(64);
  assert.equal(validateAuthoringCompatibility({ resolution: base, compatibilityProof: mismatched }).status, 'REJECTED');
});

test('all 111 non-empty public Candidate combinations retain one canonical semantic model', () => {
  let combinationCount = 0;
  for (const binding of bindingCatalog.bindings) {
    const base = resolve(binding);
    for (const activeCandidates of subsets(binding.public_surface.public_candidate_fault_ids)) {
      combinationCount += 1;
      const result = resolve(binding, { active_public_candidate_fault_ids: activeCandidates });
      assert.equal(result.status, 'RESOLVED');
      assert.equal(result.public_projection.semantic_model_digest, base.public_projection.semantic_model_digest);
      assert.deepEqual(result.public_projection.ticket_context.active_candidate_fault_ids, activeCandidates);
      assert.deepEqual(result.public_projection.candidate_closure.map((entry) => entry.candidate_fault_id), activeCandidates);
    }
  }
  assert.equal(combinationCount, 111);
});

test('lifecycle prose renders required, optional, conditional, parallel, and not-applicable qualifiers honestly', () => {
  const powerBinding = bindingCatalog.bindings.find((binding) => binding.fingerprint_id.includes('power.failed_distribution_board'));
  const powerProjection = resolve(powerBinding).public_projection;
  assert.ok(powerProjection.lifecycle.entries.some((entry) => entry.applicability === 'REQUIRED' && entry.text.startsWith('Required:')));
  assert.ok(powerProjection.lifecycle.entries.some((entry) => entry.applicability === 'PARALLEL' && entry.text.startsWith('In parallel:')));
  assert.ok(powerProjection.lifecycle.entries.some((entry) => entry.applicability === 'OPTIONAL_CONDITIONAL' && entry.text.startsWith('Optional when applicable')));

  const binding = bindingCatalog.bindings[0];
  const profile = structuredClone(catalog.profiles.find((candidate) => candidate.profile_id === binding.profile_ref.profile_id));
  profile.description_program.sections[0].clauses[0].clause_kind = 'NOT_APPLICABLE';
  const synthetic = buildPublicSystemProjection({
    profile,
    binding,
    activeCandidateFaultIds: binding.public_surface.public_candidate_fault_ids,
    templates: catalog.templates,
  });
  assert.equal(synthetic.lifecycle.entries[0].applicability, 'NOT_APPLICABLE');
  assert.match(synthetic.lifecycle.entries[0].text, /^Not applicable:/);
});

test('prose, diagrams, inventories, and 174 rationale graphs resolve to one canonical semantic source', () => {
  const uniqueAttachments = new Set();
  let renderedGraphs = 0;
  for (const caseRecord of proof.cases) {
    const projection = readJson(caseRecord.public_projection_path);
    const profile = catalog.profiles.find((candidate) => candidate.profile_id === caseRecord.profile_id);
    assert.deepEqual(validateProjectionReferences(projection, profile), []);
    assert.deepEqual(publicProjectionSafetyIssues(projection), []);
    assert.equal(projection.diagram.nodes.length, profile.topology_nodes.length);
    assert.equal(projection.diagram.edges.length, profile.topology_edges.length);
    assert.equal(projection.component_inventory.length, profile.role_instances.length);
    assert.equal(projection.lifecycle.entries.length, profile.description_program.sections.flatMap((section) => section.clauses).length);
    assert.equal(projection.diagram.text_equivalent.ordered_node_sentences.length, projection.diagram.nodes.length);
    assert.equal(projection.diagram.text_equivalent.ordered_edge_sentences.length, projection.diagram.edges.length);
    for (const graph of projection.rationale_graphs) {
      renderedGraphs += 1;
      uniqueAttachments.add(graph.attachment_id);
      assert.equal(graph.relevance_label, 'Relevant to this system profile');
      assert.equal(graph.legality_label, 'Legal now is evaluated separately by the authoritative Match engine.');
    }
  }
  assert.equal(uniqueAttachments.size, 51);
  assert.equal(renderedGraphs, 174);
});

test('public files, projection values, traces, errors, and filenames contain no private authoring identifiers', () => {
  const generatedPaths = [
    'docs/system-models/task-052/resolver-proof-v1.json',
    'docs/system-models/task-052/REPORT.md',
    'docs/system-models/task-052/review.html',
    ...proof.cases.map((item) => item.public_projection_path),
  ];
  const forbidden = [
    /evidence\.[a-z0-9._-]+/iu,
    /fault_instance\.[a-z0-9._-]+/iu,
    /repair_outcome\.[a-z0-9._-]+/iu,
    /verify_outcome\.[a-z0-9._-]+/iu,
    /authored_result_reference/iu,
    /hidden_true_fault_ids/iu,
    /synthetic_hidden_fault_ids/iu,
  ];
  for (const relativePath of generatedPaths) {
    const source = fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
    for (const pattern of forbidden) {
      assert.equal(pattern.test(relativePath), false, `${relativePath} filename leaked ${pattern}`);
      assert.equal(pattern.test(source), false, `${relativePath} leaked ${pattern}`);
    }
  }
  for (const result of proof.invalid_profile_results) {
    assert.doesNotMatch(result.public_message, /profile|component|controller|candidate|vendor|relationship/iu);
  }
  assert.deepEqual(publicProjectionSafetyIssues({ note: 'Embedded evidence.private-id is forbidden.' }), [
    'note exposes a private authoring identifier',
  ]);
});

test('the resolver has no engine, Bench, Evidence, scoring, or Story authority dependency', () => {
  const resolverSource = fs.readFileSync(path.join(ROOT, 'src/system-models/resolver.mjs'), 'utf8');
  const projectionSource = fs.readFileSync(path.join(ROOT, 'src/system-models/projections.mjs'), 'utf8');
  for (const source of [resolverSource, projectionSource]) {
    assert.doesNotMatch(source, /from ['"]\.\.\/engine\//u);
    assert.doesNotMatch(source, /from ['"]\.\.\/story\//u);
    assert.doesNotMatch(source, /deriveDiagnosticRelevance|legal_intents|service_points|checkpoint/iu);
  }
  for (const caseRecord of proof.cases) {
    const projection = readJson(caseRecord.public_projection_path);
    assert.equal(projection.authority_boundary.gameplay_effect, 'NONE');
  }
  const migration = readJson('content/system-model-pilot-v1/migration-v1.json');
  for (const input of migration.immutable_inputs) {
    const bytes = fs.readFileSync(path.join(ROOT, input.path));
    assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), input.sha256, input.path);
  }
});

test('the proof package regenerates byte-for-byte with the measured five-pilot totals', () => {
  const rebuilt = buildProofArtifacts();
  assert.deepEqual(rebuilt.issues, []);
  assert.deepEqual(rebuilt.proof.totals, {
    resolved_tickets: 5,
    unique_profiles: 2,
    public_projections: 5,
    invalid_profiles_rejected: 5,
    differential_cases: 21,
    public_candidate_combinations: 111,
    unique_rationale_attachments: 51,
    rendered_rationale_graphs: 174,
  });
  for (const [relativePath, source] of rebuilt.outputs) {
    assert.equal(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'), source, relativePath);
  }
  const result = spawnSync(process.execPath, ['docs/system-models/task-052/generate-proof.mjs', '--check'], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /5\/5 Tickets resolved, 5\/5 invalid profiles rejected/);
});

test('TASK-052 proof and synchronized roadmap Markdown links resolve repository-locally', () => {
  const markdownPaths = [
    'README.md',
    'schemas/README.md',
    'docs/schema-notes/DOMAIN_SCHEMAS.md',
    'docs/design/decisions/APPROVALS.md',
    'docs/design/decisions/DECISION_INDEX.md',
    'docs/tasks/INDEX.md',
    'docs/tasks/TASK-052-prove-five-ticket-system-resolver.md',
    'docs/system-models/README.md',
    'docs/system-models/task-052/README.md',
    'docs/system-models/task-052/REPORT.md',
    'docs/system-models/task-052/BROWSER_QA.md',
  ];
  for (const relativePath of markdownPaths) {
    const absolutePath = path.join(ROOT, relativePath);
    const source = fs.readFileSync(absolutePath, 'utf8');
    for (const match of source.matchAll(/\[[^\]]*\]\(([^)]+)\)/gu)) {
      const href = match[1].trim().replace(/^<|>$/gu, '');
      if (/^(?:https?:|mailto:|#)/iu.test(href)) continue;
      const target = decodeURIComponent(href.split('#')[0]);
      assert.equal(fs.existsSync(path.resolve(path.dirname(absolutePath), target)), true, `${relativePath} has missing link ${href}`);
    }
  }
});
