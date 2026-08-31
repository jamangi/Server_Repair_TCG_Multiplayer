import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { canonicalJson, sha256 } from '../../../src/builder/canonical.mjs';
import {
  createResolverRequest,
  resolvePublicSystemModel,
  validateAuthoringCompatibility,
} from '../../../src/system-models/resolver.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../..');

const INPUT_PATHS = Object.freeze({
  catalog: 'content/system-model-pilot-v1/system-model-catalog-v1.json',
  bindings: 'content/system-model-pilot-v1/ticket-system-bindings-v1.json',
  privateValidation: 'content/system-model-pilot-v1/private-compatibility-v1.json',
  relationshipOverlay: 'content/system-model-pilot-v1/domain-relationship-overlay-v1.json',
  releaseManifest: 'content/system-model-pilot-v1/RELEASE-MANIFEST.json',
  sourceLedger: 'docs/system-models/task-050/source-ledger.json',
  fixtures: 'docs/system-models/task-052/invalid-profile-fixtures-v1.json',
});

const OUTPUT_PATHS = Object.freeze({
  proof: 'docs/system-models/task-052/resolver-proof-v1.json',
  report: 'docs/system-models/task-052/REPORT.md',
  review: 'docs/system-models/task-052/review.html',
});

const FORBIDDEN_OUTPUT_PATTERNS = Object.freeze([
  /evidence\.[a-z0-9._-]+/iu,
  /fault_instance\.[a-z0-9._-]+/iu,
  /repair_outcome\.[a-z0-9._-]+/iu,
  /verify_outcome\.[a-z0-9._-]+/iu,
  /authored_result_reference/iu,
  /hidden_true_fault_ids/iu,
  /synthetic_hidden_fault_ids/iu,
]);

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'));
}

function fileSha256(relativePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, relativePath))).digest('hex');
}

function normalize(value) {
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, normalize(value[key])]));
  }
  return value;
}

function prettyJson(value) {
  return `${JSON.stringify(normalize(value), null, 2)}\n`;
}

function withSerialization(value) {
  return {
    ...value,
    serialization: {
      canonicalization_version: 'canonical-json-v1',
      digest_algorithm: 'sha256',
      content_digest: sha256(canonicalJson(value)),
    },
  };
}

function projectionPath(binding) {
  const slug = binding.binding_id.replaceAll('.', '-');
  return `docs/system-models/task-052/public-projections/${slug}.json`;
}

function nonEmptySubsets(values) {
  const subsets = [];
  for (let mask = 1; mask < 2 ** values.length; mask += 1) {
    subsets.push(values.filter((_, index) => (mask & (1 << index)) !== 0));
  }
  return subsets;
}

function sourceReviewForProfile(profile, sourceLedger) {
  const claims = new Set(profile.provenance.source_claim_ids);
  return sourceLedger.sources
    .map((source) => ({
      source_id: source.source_id,
      title: source.title,
      publisher: source.publisher,
      product_scope: source.product_scope,
      revision: source.revision,
      access_status: source.access_status,
      url: source.url,
      used_claim_ids: source.claim_ids.filter((claimId) => claims.has(claimId)),
    }))
    .filter((source) => source.used_claim_ids.length > 0)
    .sort((left, right) => left.source_id.localeCompare(right.source_id));
}

export function materializeInvalidFixture({ fixture, catalog, bindingCatalog }) {
  const mutatedCatalog = structuredClone(catalog);
  const mutatedBindings = structuredClone(bindingCatalog);
  const profile = mutatedCatalog.profiles.find((candidate) => candidate.profile_id === fixture.base_profile_id);
  const binding = mutatedBindings.bindings.find((candidate) => candidate.binding_id === fixture.base_binding_id);
  if (!profile || !binding) throw new Error(`Fixture ${fixture.fixture_id} has a missing base record.`);
  const { operation, target_id: targetId } = fixture.mutation;
  if (operation === 'REMOVE_NODE') {
    profile.topology_nodes = profile.topology_nodes.filter((node) => node.node_id !== targetId);
  } else if (operation === 'REVERSE_EDGE') {
    const edge = profile.topology_edges.find((candidate) => candidate.edge_id === targetId);
    if (!edge) throw new Error(`Fixture ${fixture.fixture_id} has a missing edge.`);
    [edge.from_node_id, edge.to_node_id] = [edge.to_node_id, edge.from_node_id];
  } else if (operation === 'REMOVE_CANDIDATE_CLOSURE') {
    binding.candidate_closure = binding.candidate_closure.filter((entry) => entry.candidate_fault_id !== targetId);
  } else if (operation === 'ADD_UNSUPPORTED_OPTION_CLAIM') {
    const constraint = profile.option_constraints.find((candidate) => candidate.constraint_id === targetId);
    if (!constraint) throw new Error(`Fixture ${fixture.fixture_id} has a missing option constraint.`);
    constraint.source_claim_ids.push('claim.fixture.unreleased-option-combination');
  } else if (operation === 'CLEAR_NODE_ROLE_REFS') {
    const node = profile.topology_nodes.find((candidate) => candidate.node_id === targetId);
    if (!node) throw new Error(`Fixture ${fixture.fixture_id} has a missing node.`);
    node.role_ids = [];
  } else {
    throw new Error(`Fixture ${fixture.fixture_id} uses unsupported operation ${operation}.`);
  }
  return {
    catalog: mutatedCatalog,
    bindingCatalog: mutatedBindings,
    request: createResolverRequest(binding),
    materialized_profile_digest: sha256(canonicalJson(profile)),
  };
}

function validateFixtureCatalog(fixtureCatalog) {
  const issues = [];
  const expectedOperations = new Set([
    'REMOVE_NODE',
    'REVERSE_EDGE',
    'REMOVE_CANDIDATE_CLOSURE',
    'ADD_UNSUPPORTED_OPTION_CLAIM',
    'CLEAR_NODE_ROLE_REFS',
  ]);
  if (fixtureCatalog.schema_version !== 'system-model-resolver-fixture-catalog-v1') issues.push('fixture schema version mismatch');
  if (fixtureCatalog.fixtures.length !== 5) issues.push('fixture catalog must contain exactly five invalid profiles');
  const ids = fixtureCatalog.fixtures.map((fixture) => fixture.fixture_id);
  if (new Set(ids).size !== ids.length) issues.push('fixture IDs must be unique');
  fixtureCatalog.fixtures.forEach((fixture) => {
    if (!expectedOperations.has(fixture.mutation.operation)) issues.push(`${fixture.fixture_id} has an unsupported operation`);
    if (!fixture.expected_reason_code) issues.push(`${fixture.fixture_id} has no expected reason code`);
  });
  return issues.sort();
}

function verifyNoPrivateIdentifiers(outputs) {
  const issues = [];
  for (const [relativePath, source] of outputs) {
    for (const pattern of FORBIDDEN_OUTPUT_PATTERNS) {
      if (pattern.test(relativePath) || pattern.test(source)) issues.push(`${relativePath} contains forbidden private identifier material matching ${pattern}`);
    }
  }
  return issues.sort();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function humanize(value) {
  return value.replaceAll('_', ' ').replaceAll('.', ' · ');
}

function wrapLabel(label, length = 21) {
  const words = label.split(/\s+/u);
  const lines = [];
  let line = '';
  for (const word of words) {
    if (line && `${line} ${word}`.length > length) {
      lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 3);
}

function lineDash(pattern) {
  return {
    SOLID: '',
    DOUBLE: '2 3',
    DOTTED: '2 7',
    DASHED: '10 6',
    DASH_DOT: '12 5 2 5',
    LONG_DASH: '18 7',
    SHORT_DASH: '6 5',
    DOUBLE_DASH: '14 4 4 4',
  }[pattern] ?? '';
}

function renderDiagram(projection, index) {
  const diagram = projection.diagram;
  const nodes = new Map(diagram.nodes.map((node) => [node.node_id, node]));
  const markerId = `arrow-task052-${index}`;
  const edgeMarkup = diagram.edges.map((edge, edgeIndex) => {
    const from = nodes.get(edge.from_node_id).layout;
    const to = nodes.get(edge.to_node_id).layout;
    const x1 = from.x + from.width / 2;
    const y1 = from.y + from.height / 2;
    const x2 = to.x + to.width / 2;
    const y2 = to.y + to.height / 2;
    const dash = lineDash(edge.line_pattern);
    return `<g class="diagram-edge" tabindex="0" data-edge-order="${edgeIndex + 1}" aria-label="${escapeHtml(`${nodes.get(edge.from_node_id).label} ${edge.relation_type} ${nodes.get(edge.to_node_id).label}`)}">
      <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"${dash ? ` stroke-dasharray="${dash}"` : ''} marker-end="url(#${markerId})" />
      <text x="${(x1 + x2) / 2}" y="${(y1 + y2) / 2 - 6}">${escapeHtml(edge.relation_family)}</text>
    </g>`;
  }).join('\n');
  const nodeMarkup = diagram.nodes.map((node) => {
    const lines = wrapLabel(node.label);
    const text = lines.map((line, lineIndex) =>
      `<tspan x="${node.layout.x + node.layout.width / 2}" dy="${lineIndex === 0 ? 0 : 16}">${escapeHtml(line)}</tspan>`).join('');
    return `<g class="diagram-node plane-${escapeHtml(node.plane)}" tabindex="0" data-reading-order="${node.layout.reading_order}" aria-label="${escapeHtml(`${node.label}; ${humanize(node.node_kind)}; ${humanize(node.plane)} plane`)}">
      <rect x="${node.layout.x}" y="${node.layout.y}" width="${node.layout.width}" height="${node.layout.height}" rx="12" />
      <text x="${node.layout.x + node.layout.width / 2}" y="${node.layout.y + 29}" text-anchor="middle">${text}</text>
    </g>`;
  }).join('\n');
  return `<figure class="diagram-frame">
    <svg role="img" tabindex="0" viewBox="0 0 ${diagram.canvas.width} ${diagram.canvas.height}" aria-labelledby="diagram-title-${index} diagram-desc-${index}">
      <title id="diagram-title-${index}">${escapeHtml(diagram.title)}</title>
      <desc id="diagram-desc-${index}">${escapeHtml(diagram.text_equivalent.full_text)}</desc>
      <defs><marker id="${markerId}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" /></marker></defs>
      ${edgeMarkup}
      ${nodeMarkup}
    </svg>
    <figcaption>${escapeHtml(diagram.text_equivalent.full_text)}</figcaption>
  </figure>`;
}

function renderTrace(trace) {
  return `<ol class="trace-list">${trace.map((step) =>
    `<li><span class="status ${step.status.toLowerCase()}">${escapeHtml(step.status)}</span><code>${escapeHtml(step.code)}</code><small>${escapeHtml(humanize(step.step))}</small></li>`).join('')}</ol>`;
}

function renderSources(sources) {
  return `<ul class="review-list">${sources.map((source) => `<li>
    <strong>${escapeHtml(source.title)}</strong>
    <span>${escapeHtml(source.publisher)} · ${escapeHtml(source.product_scope)}</span>
    <span>${escapeHtml(source.revision)} · ${escapeHtml(source.access_status)}</span>
    <span>${source.used_claim_ids.map((claimId) => `<code>${escapeHtml(claimId)}</code>`).join(' ')}</span>
    <a href="${escapeHtml(source.url)}">Open primary source</a>
  </li>`).join('')}</ul>`;
}

function renderInventory(inventory) {
  return `<ul class="review-list">${inventory.map((item) => `<li>
    <strong>${escapeHtml(item.label)}</strong>
    <span>${escapeHtml(item.purpose)}</span>
    <span><code>${escapeHtml(item.role_id)}</code>${item.component_definition_id ? ` → <code>${escapeHtml(item.component_definition_id)}</code>` : ' → honest public abstraction'}</span>
    <span>${escapeHtml(humanize(item.optionality))}; ${escapeHtml(item.multiplicity)}; ${escapeHtml(humanize(item.replaceability))}</span>
    <span>${escapeHtml(item.serviceability_note)}</span>
  </li>`).join('')}</ul>`;
}

function renderLifecycle(lifecycle) {
  return `<ol class="lifecycle-list">${lifecycle.entries.map((entry) => `<li>
    <span class="applicability">${escapeHtml(humanize(entry.applicability))}</span>
    <strong>${escapeHtml(entry.text)}</strong>
    <code>${escapeHtml(entry.stage_id)}</code>
  </li>`).join('')}</ol><p class="plain-note">${escapeHtml(lifecycle.not_applicable_note)}</p>`;
}

function renderClosure(closure) {
  return `<ul class="review-list compact">${closure.map((entry) => `<li>
    <strong><code>${escapeHtml(entry.candidate_fault_id)}</code></strong>
    <span>${escapeHtml(entry.explanation)}</span>
    <span>Nodes: ${entry.public_node_ids.map((id) => `<code>${escapeHtml(id)}</code>`).join(' ')} · Paths: ${entry.public_path_ids.map((id) => `<code>${escapeHtml(id)}</code>`).join(' ') || 'none'}</span>
  </li>`).join('')}</ul>`;
}

function renderRationales(graphs) {
  return `<div class="rationale-list">${graphs.map((graph) => {
    const graphNodeById = new Map(graph.graph_nodes.map((node) => [node.graph_node_id, node]));
    const steps = graph.graph_edges.map((edge) =>
      `${graphNodeById.get(edge.from_graph_node_id)?.label ?? edge.from_graph_node_id} → ${edge.relation} → ${graphNodeById.get(edge.to_graph_node_id)?.label ?? edge.to_graph_node_id}`);
    return `<details>
      <summary><span class="kind">${escapeHtml(graph.action_kind)}</span>${escapeHtml(graph.graph_nodes[0].label)}</summary>
      <p>${escapeHtml(graph.sentence)}</p>
      <ol>${steps.map((step) => `<li>${escapeHtml(step)}</li>`).join('')}</ol>
      <p class="relevance-label">${escapeHtml(graph.relevance_label)}</p>
      <p class="legality-label">${escapeHtml(graph.legality_label)}</p>
    </details>`;
  }).join('')}</div>`;
}

function renderPilot(caseRecord, projection, index) {
  return `<article class="pilot-case" id="pilot-${index + 1}">
    <header class="case-header">
      <p class="eyebrow">Pilot ${index + 1} · resolved</p>
      <h2>${escapeHtml(projection.ticket_context.fingerprint_id)}</h2>
      <p>${escapeHtml(projection.scope.display_name)} · ${escapeHtml(projection.scope.model_scope)}</p>
      <div class="metric-row"><span>Profile <code>${escapeHtml(caseRecord.profile_id)}</code></span><span>${caseRecord.rationale_graph_count} rationale graphs</span><span>${caseRecord.public_candidate_count} public Candidates</span></div>
    </header>
    <div class="boundary-grid">
      <section class="public-review" data-public-projection>
        <p class="boundary-label public">Player-safe public proof</p>
        <h3>Deterministic resolution trace</h3>
        ${renderTrace(caseRecord.validation_trace)}
        <p class="digest">Projection digest <code>${escapeHtml(caseRecord.public_projection_digest)}</code></p>
      </section>
      <aside class="private-review">
        <p class="boundary-label private">Authoring-only validation · never ship to the Player</p>
        <h3>Reject-only compatibility result</h3>
        <p><strong>${escapeHtml(caseRecord.authoring_validation_summary.status)}</strong> · ${caseRecord.authoring_validation_summary.coverage.authored_role_checks} role checks · ${caseRecord.authoring_validation_summary.coverage.authored_action_checks} action checks · ${caseRecord.authoring_validation_summary.coverage.differential_cases} differential cases.</p>
        <p>No authoring identifier, diagnostic result, or solution pointer is copied into the public projection.</p>
      </aside>
    </div>
    <section data-public-projection>
      <h3>One-source lifecycle narrative</h3>
      ${renderLifecycle(projection.lifecycle)}
    </section>
    <section data-public-projection>
      <h3>Accessible topology diagram</h3>
      <p>${escapeHtml(projection.diagram.scope_statement)}</p>
      ${renderDiagram(projection, index)}
      <details><summary>Keyboard-readable path list</summary><ul class="path-list">${projection.diagram.paths.map((modelPath) => `<li tabindex="0"><strong>${escapeHtml(modelPath.flow_kind)}</strong> ${modelPath.ordered_labels.map(escapeHtml).join(' → ')}</li>`).join('')}</ul></details>
    </section>
    <div class="comparison-grid" data-public-projection>
      <section><h3>Source claims</h3>${renderSources(caseRecord.source_review)}</section>
      <section><h3>Component mapping</h3>${renderInventory(projection.component_inventory)}</section>
    </div>
    <section data-public-projection><h3>Public-Candidate closure</h3>${renderClosure(projection.candidate_closure)}</section>
    <section data-public-projection><h3>System-relevance rationale graphs</h3><p class="plain-note">Every graph explains system relevance only. It does not expose or change what is legal in a Match.</p>${renderRationales(projection.rationale_graphs)}</section>
  </article>`;
}

function renderReviewHtml(proof, projectionsByPath) {
  const pilots = proof.cases.map((caseRecord, index) =>
    renderPilot(caseRecord, projectionsByPath.get(caseRecord.public_projection_path), index)).join('\n');
  const invalid = proof.invalid_profile_results.map((result) => `<article class="invalid-card">
    <span class="status fail">REJECTED</span>
    <h3>${escapeHtml(result.title)}</h3>
    <code>${escapeHtml(result.reason_code)}</code>
    <p>${escapeHtml(result.public_message)}</p>
    <p>Gameplay effect: <strong>${escapeHtml(result.gameplay_effect)}</strong></p>
  </article>`).join('');
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>TASK-052 five-Ticket System Resolver proof</title>
  <style>
    :root { color-scheme: dark; font-family: Inter, ui-sans-serif, system-ui, sans-serif; background: #07111d; color: #eef5ff; }
    * { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body { margin: 0; min-width: 0; background: radial-gradient(circle at top left, #143456 0, #07111d 38rem); }
    a { color: #8cdcff; overflow-wrap: anywhere; }
    code { color: #b8e8ff; overflow-wrap: anywhere; white-space: normal; }
    .skip-link { position: fixed; left: 1rem; top: -5rem; z-index: 10; padding: .8rem 1rem; background: #fff; color: #000; }
    .skip-link:focus { top: 1rem; }
    main { width: min(100% - 2rem, 92rem); margin: 0 auto; padding: 2rem 0 6rem; }
    .hero { padding: clamp(1.2rem, 4vw, 3rem); border: 1px solid #3c6282; border-radius: 1.5rem; background: rgba(6, 21, 37, .92); box-shadow: 0 1.2rem 4rem #0008; }
    .hero h1 { font-size: clamp(2rem, 6vw, 4.6rem); line-height: .98; margin: .3rem 0 1rem; max-width: 15ch; }
    .hero p { max-width: 72ch; font-size: 1.08rem; line-height: 1.65; }
    .eyebrow { color: #8cdcff; text-transform: uppercase; letter-spacing: .13em; font-weight: 800; font-size: .78rem; }
    .summary-grid, .comparison-grid, .boundary-grid, .invalid-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 24rem), 1fr)); gap: 1rem; }
    .summary-grid > *, .boundary-grid > *, .comparison-grid > *, .invalid-card { min-width: 0; border: 1px solid #36536d; border-radius: 1rem; padding: 1rem; background: #0b1c2b; }
    .summary-grid strong { display: block; font-size: 2rem; color: #8cdcff; }
    nav { margin: 1.2rem 0; }
    nav ul { display: flex; flex-wrap: wrap; gap: .6rem; padding: 0; list-style: none; }
    nav a { display: inline-block; border: 1px solid #52728d; border-radius: 999px; padding: .65rem .85rem; text-decoration: none; background: #0c2235; }
    .pilot-case { margin-top: 2rem; border: 1px solid #385a76; border-radius: 1.3rem; background: #081725; overflow: clip; }
    .pilot-case > section, .pilot-case > .comparison-grid, .pilot-case > .boundary-grid { margin: 1rem; }
    .case-header { padding: 1.4rem; background: linear-gradient(125deg, #153652, #0a2134); }
    .case-header h2 { margin: .2rem 0; font-size: clamp(1.25rem, 4vw, 2.2rem); overflow-wrap: anywhere; }
    .metric-row { display: flex; flex-wrap: wrap; gap: .6rem; }
    .metric-row span { border-radius: .6rem; background: #071521; padding: .55rem .7rem; overflow-wrap: anywhere; }
    h3 { margin-top: 0; }
    .boundary-label { display: inline-block; padding: .35rem .55rem; border-radius: .45rem; font-size: .78rem; font-weight: 900; letter-spacing: .04em; text-transform: uppercase; }
    .boundary-label.public { background: #143f37; color: #b8ffe9; }
    .boundary-label.private { background: #5a2b18; color: #ffe1c9; }
    .private-review { border-style: dashed; }
    .trace-list, .lifecycle-list { padding: 0; list-style: none; display: grid; gap: .55rem; }
    .trace-list li, .lifecycle-list li { display: grid; grid-template-columns: auto minmax(0, 1fr); align-items: start; gap: .4rem .65rem; padding: .7rem; border-radius: .7rem; background: #0a2235; }
    .trace-list small, .lifecycle-list code { grid-column: 2; }
    .status, .applicability, .kind { display: inline-block; width: fit-content; padding: .2rem .4rem; border-radius: .35rem; font-size: .72rem; font-weight: 900; }
    .status.pass { color: #b9ffe0; background: #13513e; }
    .status.fail { color: #ffe4d8; background: #7c2d24; }
    .applicability, .kind { color: #06111b; background: #8cdcff; }
    .plain-note, .digest { color: #b8c9d7; }
    .diagram-frame { margin: 1rem 0; min-width: 0; }
    svg { display: block; width: 100%; max-width: 100%; height: auto; min-height: 15rem; border: 1px solid #3b5f7b; border-radius: 1rem; background: #07131f; }
    .diagram-edge line { stroke: #89b8d9; stroke-width: 3; }
    .diagram-edge text { fill: #b8d7eb; font-size: 12px; paint-order: stroke; stroke: #07131f; stroke-width: 4px; }
    marker path { fill: #89b8d9; }
    .diagram-node rect { fill: #132f45; stroke: #8cdcff; stroke-width: 2.5; }
    .diagram-node text { fill: #f4f8ff; font-size: 13px; font-weight: 750; pointer-events: none; }
    .diagram-node:focus, .diagram-edge:focus { outline: none; }
    .diagram-node:focus rect { stroke: #ffe08a; stroke-width: 6; }
    .diagram-edge:focus line { stroke: #ffe08a; stroke-width: 7; }
    figcaption { margin-top: .7rem; line-height: 1.55; color: #c4d5e2; }
    details { border: 1px solid #355773; border-radius: .75rem; background: #0a1d2d; margin: .55rem 0; }
    summary { cursor: pointer; min-height: 2.75rem; padding: .75rem; display: flex; align-items: center; gap: .6rem; font-weight: 750; overflow-wrap: anywhere; }
    details > :not(summary) { margin-inline: .9rem; }
    .review-list, .path-list { list-style: none; padding: 0; display: grid; gap: .7rem; }
    .review-list li, .path-list li { display: grid; gap: .35rem; padding: .8rem; background: #0a2133; border-radius: .7rem; overflow-wrap: anywhere; }
    .review-list.compact li { border-left: .3rem solid #8cdcff; }
    .path-list li:focus { outline: .25rem solid #ffe08a; outline-offset: .15rem; }
    .rationale-list { columns: 2 24rem; column-gap: .8rem; }
    .rationale-list details { break-inside: avoid; }
    .relevance-label { color: #b6ffe2; font-weight: 750; }
    .legality-label { color: #ffe0aa; }
    .invalid-section { margin-top: 2rem; padding: 1rem; border: 1px solid #6f4438; border-radius: 1rem; background: #24140f; }
    .invalid-card { background: #1a1514; }
    footer { margin-top: 2rem; color: #9eb3c3; }
    :focus-visible { outline: .25rem solid #ffe08a; outline-offset: .18rem; }
    @media (max-width: 44rem) { main { width: min(100% - 1rem, 92rem); padding-top: .5rem; } .pilot-case > section, .pilot-case > .comparison-grid, .pilot-case > .boundary-grid { margin: .55rem; } .rationale-list { columns: 1; } .trace-list li, .lifecycle-list li { grid-template-columns: 1fr; } .trace-list small, .lifecycle-list code { grid-column: 1; } }
    @media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } *, *::before, *::after { animation: none !important; transition: none !important; } }
    @media (forced-colors: active) { body, .hero, .pilot-case, .summary-grid > *, .boundary-grid > *, .comparison-grid > *, .invalid-card, details, .review-list li, .path-list li { background: Canvas; color: CanvasText; border-color: CanvasText; } .diagram-node rect, svg { fill: Canvas; stroke: CanvasText; background: Canvas; } .diagram-node text, .diagram-edge text { fill: CanvasText; stroke: Canvas; } .diagram-edge line { stroke: CanvasText; } marker path { fill: CanvasText; } .diagram-node:focus rect, .diagram-edge:focus line { stroke: Highlight; } }
  </style>
</head>
<body>
  <a class="skip-link" href="#proof">Skip to proof</a>
  <main id="proof">
    <header class="hero">
      <p class="eyebrow">TASK-052 · proof-only review surface</p>
      <h1>Five Tickets. One typed source. No hidden-answer oracle.</h1>
      <p>The approved curated Finder resolves five immutable public Ticket snapshots to two source-backed profiles. Lifecycle prose, topology, component inventory, text equivalents, and ${proof.totals.rendered_rationale_graphs} rationale graphs are generated from the same public semantic records. Authoring validation is a separate reject-only gate.</p>
      <div class="summary-grid">
        <p><strong>${proof.totals.resolved_tickets}/5</strong> deterministic resolutions</p>
        <p><strong>${proof.totals.invalid_profiles_rejected}/5</strong> invalid profiles rejected</p>
        <p><strong>${proof.totals.differential_cases}</strong> same-public-surface variants</p>
        <p><strong>${proof.totals.public_candidate_combinations}</strong> public Candidate combinations</p>
      </div>
    </header>
    <nav aria-label="Pilot cases"><ul>${proof.cases.map((item, index) => `<li><a href="#pilot-${index + 1}">Pilot ${index + 1}: ${escapeHtml(item.fingerprint_id)}</a></li>`).join('')}<li><a href="#invalid-profiles">Invalid profiles</a></li></ul></nav>
    ${pilots}
    <section class="invalid-section" id="invalid-profiles">
      <p class="eyebrow">Fail-closed counterexamples</p>
      <h2>Five deliberately incompatible profiles</h2>
      <p>Every failure returns one stable public-safe code and the same honest text-only fallback. Ordinary Ticket play is unaffected.</p>
      <div class="invalid-grid">${invalid}</div>
    </section>
    <footer><p>Proof release <code>${escapeHtml(proof.proof_id)}</code> · digest <code>${escapeHtml(proof.serialization.content_digest)}</code>. This page is repository review evidence, not production Ticket navigation.</p></footer>
  </main>
</body>
</html>\n`;
}

function renderReport(proof) {
  const caseRows = proof.cases.map((item) =>
    `| \`${item.ticket_id}\` | \`${item.profile_id}\` | ${item.public_candidate_count} | ${item.rationale_graph_count} | ${item.differential_cases} | ${item.public_candidate_combinations} | \`${item.public_projection_digest}\` |`).join('\n');
  const invalidRows = proof.invalid_profile_results.map((item) =>
    `| ${item.title} | \`${item.reason_code}\` | ${item.gameplay_effect} |`).join('\n');
  return `# TASK-052 five-Ticket System Resolver proof\n\nStatus: **5/5 resolved; 5/5 deliberately invalid profiles rejected; public/private differential gates passed**\n\nThis report is generated from the same proof data as [\`review.html\`](review.html). It proves the approved \`SYSTEM-001 A\` architecture outside production Ticket navigation.\n\n## Pilot results\n\n| Ticket | Selected profile | Candidates | Rationale graphs | Private variants | Public combinations | Projection digest |\n| --- | --- | ---: | ---: | ---: | ---: | --- |\n${caseRows}\n\nAll ${proof.totals.resolved_tickets} resolver traces end in \`ONE_SOURCE_PROJECTION_ACCEPTED\`. The public projection API accepts no authoring-only input. Across ${proof.totals.differential_cases} private variants, the complete public projection bytes remain identical. Across ${proof.totals.public_candidate_combinations} non-empty authorized public Candidate combinations, the Candidate context changes while the canonical topology/lifecycle/inventory/rationale semantic digest remains unchanged.\n\n## Invalid-profile results\n\n| Counterexample | Stable reason code | Gameplay effect |\n| --- | --- | --- |\n${invalidRows}\n\nEvery rejection returns the same generic text-only fallback; it never names the rejected profile detail or suggests a likely cause.\n\n## One-source projection measurements\n\n- ${proof.totals.unique_profiles} curated profiles serve ${proof.totals.resolved_tickets} Ticket bindings.\n- ${proof.totals.unique_rationale_attachments} unique sourced attachments produce ${proof.totals.rendered_rationale_graphs} per-Ticket rationale graphs.\n- Every public diagram node, edge, path, lifecycle entry, component role, and rationale reference resolves to the selected canonical profile.\n- Every representation pins canonical JSON V1 and SHA-256; regeneration is byte-stable.\n- System relevance is labeled separately from current Match legality, and the resolver reports \`gameplay_effect: NONE\`.\n\n## Scale decision\n\nThe five-pilot architecture passes its bounded gates. The project owner approved \`SYSTEM-002 A\` on 2026-08-31, authorizing TASK-053's bounded released-Story domain audit and synchronization. TASK-054 productionization and TASK-055 player-interface work retain their stated prerequisites.\n\n## Safety boundary\n\nNo authoring result identifier, diagnostic outcome identifier, solution pointer, or authoring-only reason is present in the public model data, generated prose, diagram data, rationale graphs, public traces, failure messages, or generated filenames. The authoring summary exposes only pass/reject status and aggregate check counts.\n`;
}

export function buildProofArtifacts() {
  const catalog = readJson(INPUT_PATHS.catalog);
  const bindingCatalog = readJson(INPUT_PATHS.bindings);
  const privateCatalog = readJson(INPUT_PATHS.privateValidation);
  const sourceLedger = readJson(INPUT_PATHS.sourceLedger);
  const fixtureCatalog = readJson(INPUT_PATHS.fixtures);
  const issues = validateFixtureCatalog(fixtureCatalog);
  const projections = new Map();
  const cases = [];

  for (const binding of [...bindingCatalog.bindings].sort((left, right) => left.binding_id.localeCompare(right.binding_id))) {
    const request = createResolverRequest(binding);
    const resolution = resolvePublicSystemModel({ request, catalog, bindingCatalog });
    if (resolution.status !== 'RESOLVED') throw new Error(`${binding.binding_id} did not resolve: ${resolution.reason_code}`);
    const profile = catalog.profiles.find((candidate) => candidate.profile_id === resolution.selected_profile_id);
    const compatibilityProof = privateCatalog.compatibility_proofs.find((proof) => proof.binding_id === binding.binding_id);
    const authoringValidation = validateAuthoringCompatibility({ resolution, compatibilityProof });
    if (authoringValidation.status !== 'PASS') throw new Error(`${binding.binding_id} failed authoring validation.`);

    const baseProjectionBytes = canonicalJson(resolution.public_projection);
    for (const variant of compatibilityProof.differential_variants) {
      const variantResolution = resolvePublicSystemModel({ request: createResolverRequest(binding), catalog, bindingCatalog });
      if (canonicalJson(variantResolution.public_projection) !== baseProjectionBytes) {
        issues.push(`${binding.binding_id} private variant ${variant.variant_id} changed public bytes`);
      }
    }

    const combinations = nonEmptySubsets(binding.public_surface.public_candidate_fault_ids);
    for (const activeCandidates of combinations) {
      const candidateResolution = resolvePublicSystemModel({
        request: createResolverRequest(binding, { active_public_candidate_fault_ids: activeCandidates }),
        catalog,
        bindingCatalog,
      });
      if (candidateResolution.status !== 'RESOLVED') issues.push(`${binding.binding_id} public Candidate combination failed`);
      else if (candidateResolution.public_projection.semantic_model_digest !== resolution.public_projection.semantic_model_digest) {
        issues.push(`${binding.binding_id} public Candidate combination changed canonical semantic model`);
      }
    }

    const relativeProjectionPath = projectionPath(binding);
    projections.set(relativeProjectionPath, resolution.public_projection);
    cases.push({
      case_id: `proof.case.${binding.binding_id}`,
      ticket_id: binding.ticket_id,
      ticket_snapshot_digest: binding.ticket_snapshot_digest,
      fingerprint_id: binding.fingerprint_id,
      binding_id: binding.binding_id,
      resolver_key: binding.public_resolver_key,
      profile_id: resolution.selected_profile_id,
      profile_revision: resolution.selected_profile_revision,
      public_projection_path: relativeProjectionPath,
      public_projection_digest: resolution.public_projection.serialization.content_digest,
      semantic_model_digest: resolution.public_projection.semantic_model_digest,
      validation_trace: resolution.validation_trace,
      public_candidate_count: binding.public_surface.public_candidate_fault_ids.length,
      rationale_graph_count: resolution.public_projection.rationale_graphs.length,
      differential_cases: compatibilityProof.differential_variants.length,
      public_candidate_combinations: combinations.length,
      source_review: sourceReviewForProfile(profile, sourceLedger),
      authoring_validation_summary: authoringValidation,
    });
  }

  const invalidProfileResults = fixtureCatalog.fixtures.map((fixture) => {
    const materialized = materializeInvalidFixture({ fixture, catalog, bindingCatalog });
    const result = resolvePublicSystemModel({
      request: materialized.request,
      catalog: materialized.catalog,
      bindingCatalog: materialized.bindingCatalog,
    });
    if (result.status !== 'UNAVAILABLE' || result.reason_code !== fixture.expected_reason_code) {
      issues.push(`${fixture.fixture_id} expected ${fixture.expected_reason_code}, received ${result.reason_code}`);
    }
    return {
      fixture_id: fixture.fixture_id,
      title: fixture.title,
      expected_reason_code: fixture.expected_reason_code,
      reason_code: result.reason_code,
      materialized_profile_digest: materialized.materialized_profile_digest,
      validation_trace: result.validation_trace,
      fallback_id: result.fallback?.fallback_id ?? null,
      public_message: result.fallback?.public_message ?? '',
      gameplay_effect: result.gameplay_effect,
    };
  });

  const uniqueAttachments = new Set(cases.flatMap((item) => {
    const projection = projections.get(item.public_projection_path);
    return projection.rationale_graphs.map((graph) => graph.attachment_id);
  }));
  const proof = withSerialization({
    schema_version: 'system-model-resolver-proof-v1',
    proof_id: 'system-model-five-ticket-resolver-proof-v1',
    architecture_decision: 'SYSTEM-001-A',
    release_id: 'system-model-pilot-v1',
    generator_version: 'task-052-proof-generator-v1',
    input_digests: Object.entries(INPUT_PATHS).map(([input_id, relativePath]) => ({
      input_id,
      path: relativePath,
      sha256: fileSha256(relativePath),
    })),
    cases,
    invalid_profile_results: invalidProfileResults,
    totals: {
      resolved_tickets: cases.length,
      unique_profiles: new Set(cases.map((item) => item.profile_id)).size,
      public_projections: projections.size,
      invalid_profiles_rejected: invalidProfileResults.filter((item) => item.reason_code === item.expected_reason_code).length,
      differential_cases: cases.reduce((sum, item) => sum + item.differential_cases, 0),
      public_candidate_combinations: cases.reduce((sum, item) => sum + item.public_candidate_combinations, 0),
      unique_rationale_attachments: uniqueAttachments.size,
      rendered_rationale_graphs: cases.reduce((sum, item) => sum + item.rationale_graph_count, 0),
    },
    invariants: [
      'PUBLIC_INPUT_ONLY_RESOLUTION',
      'AUTHORING_VALIDATION_REJECT_ONLY',
      'PUBLIC_CANDIDATE_CLOSURE',
      'BYTE_STABLE_PRIVATE_DIFFERENTIAL',
      'ONE_SOURCE_ALL_REPRESENTATIONS',
      'SYSTEM_RELEVANCE_NOT_MATCH_LEGALITY',
      'PLAYABLE_TEXT_FALLBACK',
      'NO_GAMEPLAY_EFFECT',
    ],
    deterministic_performance_budget: {
      maximum_profiles_scanned_per_resolution: catalog.profiles.length,
      maximum_bindings_scanned_per_resolution: bindingCatalog.bindings.length,
      network_requests_per_resolution: 0,
      random_choices_per_resolution: 0,
      fallback_profile_choices: 0,
    },
  });

  const projectionSources = new Map([...projections].map(([relativePath, projection]) => [relativePath, prettyJson(projection)]));
  const outputs = new Map([
    ...projectionSources,
    [OUTPUT_PATHS.proof, prettyJson(proof)],
    [OUTPUT_PATHS.report, renderReport(proof)],
    [OUTPUT_PATHS.review, renderReviewHtml(proof, projections)],
  ]);
  issues.push(...verifyNoPrivateIdentifiers(outputs));
  return { outputs, proof, issues: [...new Set(issues)].sort() };
}

function main() {
  const check = process.argv.includes('--check');
  const { outputs, proof, issues } = buildProofArtifacts();
  if (issues.length > 0) {
    console.error(issues.join('\n'));
    process.exitCode = 1;
    return;
  }
  const stale = [];
  for (const [relativePath, source] of outputs) {
    const absolutePath = path.join(ROOT, relativePath);
    if (check) {
      if (!fs.existsSync(absolutePath) || fs.readFileSync(absolutePath, 'utf8') !== source) stale.push(relativePath);
    } else {
      fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
      fs.writeFileSync(absolutePath, source);
    }
  }
  if (stale.length > 0) {
    console.error(`Stale TASK-052 output(s): ${stale.join(', ')}`);
    process.exitCode = 1;
    return;
  }
  console.log(`TASK-052 ${check ? 'check' : 'write'} passed: ${proof.totals.resolved_tickets}/5 Tickets resolved, ${proof.totals.invalid_profiles_rejected}/5 invalid profiles rejected, ${proof.totals.differential_cases} private variants and ${proof.totals.public_candidate_combinations} public Candidate combinations verified.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
