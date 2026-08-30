import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../..');

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'));
}

const atlas = readJson('docs/system-models/task-050/atlas-data.json');
const ledger = readJson('docs/system-models/task-050/source-ledger.json');
const componentAudit = readJson('docs/system-models/task-050/component-relationship-audit.json');
const architectureEvaluation = readJson('docs/system-models/task-050/architecture-evaluation.json');
const coverage = readJson(atlas.release_coverage_path);

const domainComponentIds = new Set();
for (const file of fs.readdirSync(path.join(ROOT, 'viewer/content')).filter((name) => name.endsWith('.json'))) {
  const value = readJson(`viewer/content/${file}`);
  (function collectComponentIds(current) {
    if (!current || typeof current !== 'object') return;
    if (Array.isArray(current)) {
      for (const item of current) collectComponentIds(item);
      return;
    }
    if (typeof current.id === 'string' && current.id.startsWith('component.')) domainComponentIds.add(current.id);
    for (const child of Object.values(current)) collectComponentIds(child);
  }(value));
}

const profileById = new Map(atlas.profiles.map((profile) => [profile.profile_id, profile]));
const sourceByClaim = new Map();
for (const source of ledger.sources) {
  for (const claimId of source.claim_ids) {
    if (sourceByClaim.has(claimId)) throw new Error(`Duplicate claim ${claimId}`);
    sourceByClaim.set(claimId, source);
  }
}

function collectTicketRecords(value, found = new Map()) {
  if (!value || typeof value !== 'object') return found;
  if (Array.isArray(value)) {
    for (const item of value) collectTicketRecords(item, found);
    return found;
  }
  if (typeof value.ticket_id === 'string' && Array.isArray(value.public_candidate_fault_ids)) {
    found.set(value.ticket_id, value);
  }
  for (const child of Object.values(value)) collectTicketRecords(child, found);
  return found;
}

const releasedTickets = collectTicketRecords(coverage);

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function escapeHtml(value) {
  return escapeXml(value);
}

function md(value) {
  return String(value).replaceAll('|', '\\|').replaceAll('\n', ' ');
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function list(values) {
  return values.map((value) => `- ${value}`).join('\n');
}

function table(headers, rows) {
  return [
    `| ${headers.join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map((row) => `| ${row.map(md).join(' | ')} |`),
  ].join('\n');
}

function publicTicket(ticket) {
  return Object.freeze({
    ticket_id: ticket.ticket_id,
    public_symptom_ids: [...ticket.public_symptom_ids],
    public_candidate_fault_ids: [...ticket.public_candidate_fault_ids],
  });
}

function nodesForRule(rule, profile) {
  const nodeIds = new Set(profile.nodes.map((node) => node.node_id));
  return rule.target_nodes.filter((nodeId) => nodeIds.has(nodeId));
}

function ruleForAction(actionId) {
  return atlas.action_mapping_rules.find((rule) => (
    rule.match === actionId || (rule.match_prefix && actionId.startsWith(rule.match_prefix))
  ));
}

function relevantActions(ticket, profile) {
  const ids = [
    ...ticket.diagnostics.relevant_source_ids,
    ...ticket.repair_procedure_ids,
    ...ticket.validation_procedure_ids,
  ];
  return ids.map((actionId) => {
    const rule = ruleForAction(actionId);
    if (!rule) throw new Error(`No action mapping rule for ${actionId}`);
    const targetNodes = nodesForRule(rule, profile);
    if (targetNodes.length === 0) throw new Error(`Action ${actionId} has no target in ${profile.profile_id}`);
    return {
      action_id: actionId,
      kind: actionId.startsWith('command.') ? 'Command'
        : actionId.startsWith('test.') ? 'Test'
          : actionId.startsWith('repair.') ? 'Repair' : 'Verification',
      target_nodes: targetNodes,
      relation: rule.relation,
    };
  });
}

function publicNarrative(profile, dossier) {
  const stages = [...profile.lifecycle].sort((a, b) => a.order - b.order);
  return `${stages.map((stage) => stage.label.replace(/\.$/, '')).join('. ')}. ${dossier.public_focus_sentence}`;
}

function publicTextEquivalent(profile, dossier, ticketPublic) {
  const focus = new Set(dossier.focus_node_ids);
  const nodes = profile.nodes
    .filter((node) => focus.has(node.node_id))
    .map((node) => `${node.label} (${node.plane.replaceAll('_', ' ')})`);
  const edges = profile.edges
    .filter((edge) => focus.has(edge.from) && focus.has(edge.to))
    .map((edge) => {
      const from = profile.nodes.find((node) => node.node_id === edge.from).label;
      const to = profile.nodes.find((node) => node.node_id === edge.to).label;
      return `${edge.type.toLowerCase()} relation from ${from} to ${to}: ${edge.label}`;
    });
  return [
    `Ticket ${ticketPublic.ticket_id} has public Symptoms ${ticketPublic.public_symptom_ids.join(', ')}.`,
    `Its public Candidates are ${ticketPublic.public_candidate_fault_ids.join(', ')}.`,
    `The schematic focus contains ${nodes.join('; ')}.`,
    `Connections, in reading order: ${edges.join('; ')}.`,
    'Line labels and dash patterns distinguish relation types; no node or edge states which Candidate is true.',
  ].join(' ');
}

function edgeStyle(type) {
  return {
    POWER: { cls: 'power', marker: 'triangle', dash: '' },
    DATA: { cls: 'data', marker: 'triangle', dash: '10 4' },
    CONTROL: { cls: 'control', marker: 'diamond', dash: '3 5' },
    LIFECYCLE: { cls: 'lifecycle', marker: 'triangle', dash: '2 5' },
    CONTAINMENT: { cls: 'containment', marker: 'square', dash: '12 4 2 4' },
    COOLING: { cls: 'cooling', marker: 'triangle', dash: '1 4' },
  }[type];
}

function lineBetween(from, to) {
  const x1 = from.x + from.w / 2;
  const y1 = from.y + from.h / 2;
  const x2 = to.x + to.w / 2;
  const y2 = to.y + to.h / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const fromScale = Math.min(
    Math.abs(dx) < 0.001 ? Number.POSITIVE_INFINITY : (from.w / 2 + 5) / Math.abs(dx),
    Math.abs(dy) < 0.001 ? Number.POSITIVE_INFINITY : (from.h / 2 + 5) / Math.abs(dy),
  );
  const toScale = Math.min(
    Math.abs(dx) < 0.001 ? Number.POSITIVE_INFINITY : (to.w / 2 + 5) / Math.abs(dx),
    Math.abs(dy) < 0.001 ? Number.POSITIVE_INFINITY : (to.h / 2 + 5) / Math.abs(dy),
  );
  return {
    x1: x1 + dx * fromScale,
    y1: y1 + dy * fromScale,
    x2: x2 - dx * toScale,
    y2: y2 - dy * toScale,
  };
}

function renderSvg(profile, dossier, ticketPublic) {
  const focus = new Set(dossier.focus_node_ids);
  const nodes = profile.nodes.filter((node) => focus.has(node.node_id));
  const nodeById = new Map(profile.nodes.map((node) => [node.node_id, node]));
  const edges = profile.edges.filter((edge) => focus.has(edge.from) && focus.has(edge.to));
  const title = `Public-safe system context for ${ticketPublic.ticket_id}`;
  const description = publicTextEquivalent(profile, dossier, ticketPublic);
  const edgeMarkup = edges.map((edge) => {
    const from = nodeById.get(edge.from);
    const to = nodeById.get(edge.to);
    const baseLine = lineBetween(from, to);
    const line = {
      x1: baseLine.x1 + (edge.x_offset ?? 0),
      y1: baseLine.y1 + (edge.y_offset ?? 0),
      x2: baseLine.x2 + (edge.x_offset ?? 0),
      y2: baseLine.y2 + (edge.y_offset ?? 0),
    };
    const style = edgeStyle(edge.type);
    const labelX = (line.x1 + line.x2) / 2 + (edge.label_dx ?? 0);
    const labelY = (line.y1 + line.y2) / 2 - 7 + (edge.label_dy ?? 0);
    return `<g class="edge ${style.cls}" aria-label="${escapeXml(`${edge.type}: ${from.label} to ${to.label}, ${edge.label}`)}">
      <line x1="${line.x1}" y1="${line.y1}" x2="${line.x2}" y2="${line.y2}"${style.dash ? ` stroke-dasharray="${style.dash}"` : ''} marker-end="url(#${style.marker})" />
      <text x="${labelX}" y="${labelY}">${escapeXml(edge.type)}</text>
    </g>`;
  }).join('\n    ');
  const nodeMarkup = nodes.map((node, index) => `<g class="node plane-${node.plane}" tabindex="0" role="group" aria-label="${escapeXml(`${node.label}; ${node.kind}; ${node.plane.replaceAll('_', ' ')} plane`)}" data-reading-order="${index + 1}">
      <rect x="${node.x}" y="${node.y}" width="${node.w}" height="${node.h}" rx="10" />
      <text x="${node.x + node.w / 2}" y="${node.y + node.h / 2 - 4}" class="node-label">${escapeXml(node.label)}</text>
      <text x="${node.x + node.w / 2}" y="${node.y + node.h / 2 + 17}" class="node-kind">${escapeXml(node.plane.replaceAll('_', ' '))}</text>
    </g>`).join('\n    ');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1160 470" role="img" aria-labelledby="title desc" data-ticket-id="${escapeXml(ticketPublic.ticket_id)}">
  <title id="title">${escapeXml(title)}</title>
  <desc id="desc">${escapeXml(description)}</desc>
  <defs>
    <marker id="triangle" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke" stroke="context-stroke" /></marker>
    <marker id="diamond" viewBox="0 0 12 12" refX="11" refY="6" markerWidth="8" markerHeight="8" orient="auto"><path d="M 0 6 L 6 0 L 12 6 L 6 12 z" fill="context-stroke" stroke="context-stroke" /></marker>
    <marker id="square" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M 1 1 H 9 V 9 H 1 z" fill="context-stroke" stroke="context-stroke" /></marker>
    <style>
      :root { color-scheme: dark; }
      svg { background: #07131b; font-family: ui-sans-serif, system-ui, sans-serif; }
      .node rect { fill: #102b39; stroke: #cfeaf2; stroke-width: 2; }
      .node:focus rect { stroke: #ffd166; stroke-width: 5; }
      .node-label { fill: #f7fbfc; font-size: 15px; font-weight: 700; text-anchor: middle; }
      .node-kind { fill: #b8dce8; font-size: 11px; text-anchor: middle; }
      .edge line { fill: none; stroke-width: 3; }
      .edge text { fill: #f7fbfc; font-size: 11px; font-weight: 700; text-anchor: middle; paint-order: stroke; stroke: #07131b; stroke-width: 5; stroke-linejoin: round; }
      .power line { stroke: #ffcf5c; } .data line { stroke: #5ee6ff; }
      .control line { stroke: #f58cff; } .lifecycle line { stroke: #9ce47a; }
      .containment line { stroke: #f2a366; } .cooling line { stroke: #b6adff; }
      @media (forced-colors: active) {
        svg { background: Canvas; }
        .node rect { fill: Canvas; stroke: CanvasText; }
        .node-label, .node-kind, .edge text { fill: CanvasText; stroke: Canvas; }
        .edge line { stroke: CanvasText; }
        marker path { fill: CanvasText !important; }
        .node:focus rect { stroke: Highlight; }
      }
    </style>
  </defs>
  <g aria-hidden="true">${edgeMarkup}</g>
  <g aria-label="System components in text-equivalent reading order">${nodeMarkup}</g>
</svg>
`;
}

export function renderPublicBundle(dossier, profile, ticketPublic) {
  return Object.freeze({
    narrative: publicNarrative(profile, dossier),
    text_equivalent: publicTextEquivalent(profile, dossier, ticketPublic),
    svg: renderSvg(profile, dossier, ticketPublic),
  });
}

function sourceRows(profile) {
  const sources = new Map();
  const claimIds = new Set([
    ...profile.claim_ids,
    ...profile.components.flatMap((component) => component.claim_ids),
    ...profile.nodes.flatMap((node) => node.claim_ids),
    ...profile.edges.flatMap((edge) => edge.claim_ids),
    ...profile.lifecycle.flatMap((stage) => stage.claim_ids),
  ]);
  for (const claimId of claimIds) {
    const source = sourceByClaim.get(claimId);
    if (!source) throw new Error(`Unresolved claim ${claimId}`);
    const entry = sources.get(source.source_id) ?? { source, claims: [] };
    entry.claims.push(claimId);
    sources.set(source.source_id, entry);
  }
  return [...sources.values()].sort((a, b) => a.source.source_id.localeCompare(b.source.source_id));
}

function nodeLabels(profile, ids) {
  const byId = new Map(profile.nodes.map((node) => [node.node_id, node.label]));
  return ids.map((id) => byId.get(id) ?? id).join(' → ');
}

function hiddenProofRows(dossier, profile, ticket) {
  let repairIndex = 0;
  let verifyIndex = 0;
  return ticket.oracle_witness.map((step, index) => {
    const sourceId = step.source_definition_id
      ?? (step.action === 'PERFORM_REPAIR' ? ticket.repair_procedure_ids[repairIndex++] : null)
      ?? (step.action === 'PERFORM_VERIFY' ? ticket.validation_procedure_ids[verifyIndex++] : null);
    let nodeIds = sourceId ? dossier.private_role_bindings[sourceId] : null;
    if (!nodeIds && step.action === 'COMMIT_ISOLATION') {
      nodeIds = [...new Set(ticket.hidden_true_fault_ids.flatMap((faultId) => dossier.private_role_bindings[faultId] ?? []))];
    }
    if (!nodeIds?.length) throw new Error(`No private realization for ${dossier.dossier_id} witness step ${index + 1}`);
    const authoredResult = step.evidence_outcome_id ?? step.repair_outcome_id ?? step.verification_outcome_id
      ?? step.target_fault_instance_key ?? step.result;
    return [index + 1, step.action, sourceId ?? step.target_fault_instance_key, nodeLabels(profile, nodeIds), authoredResult];
  });
}

function renderDossier(dossier, profile, ticket, publicBundle) {
  const actionRows = relevantActions(ticket, profile).map((action) => [
    action.kind,
    `\`${action.action_id}\``,
    nodeLabels(profile, action.target_nodes),
    action.relation,
  ]);
  const sourceLedgerRows = sourceRows(profile).map(({ source, claims }) => [
    `\`${source.source_id}\``,
    `[${source.title}](${source.url})`,
    `${source.product_scope}; ${source.revision}`,
    claims.map((claim) => `\`${claim}\``).join(', '),
    source.claim_scope,
  ]);
  const topologyRows = profile.edges
    .filter((edge) => dossier.focus_node_ids.includes(edge.from) && dossier.focus_node_ids.includes(edge.to))
    .map((edge) => [edge.type, nodeLabels(profile, [edge.from, edge.to]), edge.label, edge.claim_ids.map((id) => `\`${id}\``).join(', ')]);
  const candidateRows = dossier.candidate_closure.map((candidate) => [
    `\`${candidate.candidate_id}\``,
    nodeLabels(profile, candidate.public_nodes),
    candidate.reason,
  ]);
  const componentRows = profile.components.map((component) => [
    component.label,
    component.role,
    component.multiplicity,
    component.replaceability,
    component.optionality,
    component.domain_component_id ? `\`${component.domain_component_id}\`` : `— (${component.gap_id ?? 'not a domain Component'})`,
    component.gap_status.replaceAll('_', ' '),
  ]);
  return `# ${dossier.title}

Status: **TASK-050 research dossier; not production Ticket data**

## 1. Stable identity

${table(['Field', 'Value'], [
    ['Dossier', `\`${dossier.dossier_id}\``],
    ['Released Ticket', `\`${ticket.ticket_id}\``],
    ['Fingerprint', `\`${ticket.fingerprint_id}\``],
    ['Ticket snapshot SHA-256', `\`${ticket.ticket_snapshot_digest}\``],
    ['System profile', `\`${profile.profile_id}\``],
    ['Real reference basis', profile.reference_identity],
    ['Generation / revision', profile.generation_or_revision],
    ['Exactness boundary', profile.exactness],
  ])}

## 2. Public Ticket surface

This section is the complete Ticket input available to the public projection. It contains no outcome, route, or hidden-state field.

- Symptoms: ${ticket.public_symptom_ids.map((id) => `\`${id}\``).join(', ')}
- Candidates: ${ticket.public_candidate_fault_ids.map((id) => `\`${id}\``).join(', ')}
- Focus: ${dossier.focus}
- Public-safe statement: ${dossier.public_focus_sentence}

## 3. Private authoring requirements

This section is author-only validation evidence. It must never be an input to the public narrative or SVG.

- Hidden authored Faults: ${ticket.hidden_true_fault_ids.map((id) => `\`${id}\``).join(', ')}
- Isolation route kinds: ${ticket.diagnostics.authored_isolation_routes.map((route) => `\`${route.route_kind}\``).join(', ')}
- Repair procedures: ${ticket.repair_procedure_ids.map((id) => `\`${id}\``).join(', ')}
- Verification procedures: ${ticket.validation_procedure_ids.map((id) => `\`${id}\``).join(', ')}
- Consistency result: ${dossier.hidden_consistency_summary}

## 4. Real-system reference basis

All sources were accessed ${ledger.access_date}. No source diagram, trade dress, logo, or branded UI is copied. The project schematic is original geometry derived only from the listed claims. Manufacturer pages are mutable and no local copyrighted source copy is retained.

### Fixed option constraints

${list(profile.supported_option_constraints)}

### Claim ledger

${table(['Source ID', 'Primary source', 'Product / revision', 'Claims used', 'Scope and exception'], sourceLedgerRows)}

## 5. Component inventory

${table(['Role', 'Purpose', 'Multiplicity', 'Replaceability', 'Optionality', 'Domain Component / gap', 'Audit class'], componentRows)}

## 6. Typed topology

The diagram is an explanatory graph, not a physical board layout. Edge type, written label, dash pattern, and marker shape carry the relation so color is never the only cue.

${table(['Relation type', 'From → to', 'Meaning', 'Claims'], topologyRows)}

Every minimum plane is explicitly declared in the shared profile:

${table(['Plane', 'Declaration', 'Boundary'], profile.planes.map((plane) => [plane.plane, plane.status, plane.summary]))}

## 7. Lifecycle and newcomer narrative

${table(['Order', 'Stage', 'Relation', 'Claims'], [...profile.lifecycle].sort((a, b) => a.order - b.order).map((stage) => [stage.order, stage.label, stage.relation, stage.claim_ids.map((id) => `\`${id}\``).join(', ')]))}

**Generated public description:** ${publicBundle.narrative}

This follows TASK-049's clause boundary: each sentence is a sourced stage or an explicitly public Ticket-focus clause. The renderer may omit at clause boundaries, but it may not convert optional/parallel behavior into a universal linear boot claim.

## 8. Accessible original illustration

[Open the standalone SVG](../diagrams/${dossier.slug}.svg). The SVG has a title and long description, labeled relation types, visible keyboard focus for semantic component groups, patterns/markers that survive monochrome or forced-colors rendering, and a deterministic view box.

**Text equivalent:** ${publicBundle.text_equivalent}

Semantic reading order is the text-equivalent component order, followed by connections. It does not depend on screen coordinates.

## 9. Why each relevant action can apply

This is system relevance only. It does not put a Card on the Bench, make an intent legal, predict an outcome, or award Evidence.

${table(['Kind', 'Action ID', 'Component / path', 'Observation or intervention reason'], actionRows)}

## 10. Hidden Ticket-consistency proof

${table(['Step', 'Authored action', 'Definition / target', 'Profile realization', 'Authored result reference'], hiddenProofRows(dossier, profile, ticket))}

All route steps resolve to present profile nodes. The generator validates this table but keeps it separate from the public projection function.

## 11. Candidate closure and differential non-leak

${table(['Public Candidate', 'Truthful public realization', 'Why it remains possible'], candidateRows)}

Differential variants tested with this exact public input: ${dossier.differential_variants.map((id) => `\`${id}\``).join(', ')}. The focused validator substitutes each Candidate as synthetic hidden truth and proves the public narrative, text equivalent, and SVG remain byte-identical. This proves rendering non-use of hidden truth; it does not claim every synthetic variant has an authored gameplay outcome.

## 12. Known abstractions, unsupported details, and stop conditions

### Profile-wide abstractions

${list(profile.known_abstractions)}

### Ticket-specific abstractions

${list(dossier.known_abstractions)}

### Stop conditions

${list([...profile.stop_conditions, ...dossier.stop_conditions])}
`;
}

function renderAtlasIndex(entries) {
  const profileUse = new Map();
  for (const entry of entries) profileUse.set(entry.profile.profile_id, (profileUse.get(entry.profile.profile_id) ?? 0) + 1);
  return `# Five-Ticket System Model atlas

Status: **TASK-050 research evidence; no production schema or gameplay change**

The atlas contains five complete released-Ticket dossiers rendered from one structured dataset. Four use one fixed R740xd hybrid-storage profile; the power-path Ticket uses one R740xd2 Power Interposer Board profile. That measured reuse is the main evidence behind the Finder-first recommendation, while the refused cross-family combinations are evidence against unconstrained composition.

${table(['Dossier', 'Released Ticket', 'Profile', 'Public Candidates', 'Relevant actions'], entries.map((entry) => [
    `[${entry.dossier.title}](dossiers/${entry.dossier.slug}.md)`,
    `\`${entry.ticket.ticket_id}\``,
    `\`${entry.profile.profile_id}\``,
    entry.ticket.public_candidate_fault_ids.length,
    relevantActions(entry.ticket, entry.profile).length,
  ]))}

## Measured result

- Dossiers: 5/5.
- Original deterministic SVG illustrations: 5/5.
- Source-backed profiles: 2.
- Profile reuse: ${[...profileUse.entries()].map(([id, count]) => `\`${id}\` × ${count}`).join('; ')}.
- Public equivalence classes: 5 (the five released public Ticket surfaces are distinct).
- Public projection inputs: profile public structure plus released Ticket ID, Symptoms, and Candidates only.
- Private validation: authored Faults, outcome references, Isolation route, Repair, and Verification remain confined to dossier authoring proof.

See [the component and relationship audit](COMPONENT_RELATIONSHIP_AUDIT.md), [architecture evaluation](ARCHITECTURE_EVALUATION.md), [source ledger](source-ledger.json), and [browser/human review record](BROWSER_QA.md).
`;
}

function renderComponentAudit() {
  const roleRows = componentAudit.component_roles.map((entry) => [
    entry.role,
    entry.domain_component_id ? `\`${entry.domain_component_id}\`` : (entry.proposed_component_id ? `proposed \`${entry.proposed_component_id}\`` : '—'),
    entry.classification.replaceAll('_', ' '),
    entry.concrete_ticket_need.map((id) => `\`${id}\``).join(', ') || 'None; deliberately bounded',
    entry.object_audit.faults_symptoms,
    entry.object_audit.tests_commands,
    entry.object_audit.repairs_verifications,
  ]);
  const relationRows = componentAudit.relationship_findings.map((entry) => [
    `\`${entry.finding_id}\``,
    entry.domain_object_ids.map((id) => `\`${id}\``).join(', '),
    entry.needed_relation.replaceAll('_', ' '),
    entry.classification.replaceAll('_', ' '),
    entry.need,
    entry.gameplay_authority,
  ]);
  return `# Component and relationship audit

Status: **TASK-050 research audit; zero production domain edits**

This matrix covers every component role modeled or explicitly rejected by the five dossiers. A relationship is requested only when a concrete Ticket action needs it; physical proximity is not a relationship argument. Symptoms remain public observations where assigning a component would narrow the Candidate set.

## Classification key

${table(['Machine value', 'Meaning'], Object.entries(componentAudit.status_definitions).map(([key, value]) => [`\`${key}\``, value]))}

## Modeled component roles

${table(['Modeled role', 'Existing / proposed Component', 'Class', 'Concrete need', 'Faults and Symptoms', 'Tests and Commands', 'Repairs and Verifications'], roleRows)}

## Justified relationship findings

${table(['Finding', 'Concrete domain objects', 'Needed relation', 'Gap class', 'Dossier need', 'Authority boundary'], relationRows)}

## Counts and boundary

${table(['Measure', 'Count'], Object.entries(componentAudit.summary).map(([key, value]) => [key.replaceAll('_', ' '), value]))}

The two missing required pilot roles are a PCIe/NVMe interconnect Component and a system BIOS/UEFI firmware-bearing role. The exact Power Interposer Board remains classified as an existing-but-broad use of the current distribution-board Component rather than counted twice as missing. TASK-051 may change this interpretation only after \`SYSTEM-001\` is approved and the typed production contract is designed.
`;
}

function renderArchitectureEvaluation() {
  const measures = [
    ['Full profiles/models authored', 'profiles_or_full_models_authored'],
    ['Ticket bindings authored', 'ticket_bindings_authored'],
    ['Reused bindings', 'reused_bindings'],
    ['Fixed option constraints', 'unique_option_constraints'],
    ['Component gap roles', 'component_gap_count'],
    ['Relationship findings', 'relationship_gap_count'],
    ['Unproved combinations', 'combinations_cannot_be_proved_real'],
  ];
  const comparisonRows = measures.map(([label, key]) => [
    label,
    ...architectureEvaluation.strategies.map((strategy) => strategy[key]),
  ]);
  const sections = architectureEvaluation.strategies.map((strategy) => `### ${strategy.option} — ${strategy.name}${strategy.option === architectureEvaluation.recommended_option ? ' (recommended)' : ''}

- Assessment: \`${strategy.recommendation}\`.
- Manual authoring burden: ${strategy.manual_authoring_burden}
- Source burden: ${strategy.source_burden}
- Deterministic selection: ${strategy.deterministic_selection}
${strategy.unproved_combination_measure ? `- Unproved-combination evidence: ${strategy.unproved_combination_measure}\n` : ''}
Consequences:

${list(strategy.consequences)}
`).join('\n');
  return `# SYSTEM-001 architecture evaluation

Status: **pending project-owner approval; TASK-051 is blocked**

## Pilot evidence

${table(['Measure', 'Observed'], Object.entries(architectureEvaluation.pilot_denominator).map(([key, value]) => [key.replaceAll('_', ' '), value]))}

Profile reuse is ${architectureEvaluation.profile_reuse.map((entry) => `\`${entry.profile_id}\` for ${entry.ticket_count} Ticket${entry.ticket_count === 1 ? '' : 's'}`).join('; ')}. The five public Ticket surfaces form five equivalence classes even though four share one physical profile. A private compatibility check therefore need not create five public physical models.

## Side-by-side measures

${table(['Measure', ...architectureEvaluation.strategies.map((strategy) => `${strategy.option}: ${strategy.name}`)], comparisonRows)}

${sections}

## Recommendation and gate

**Recommend A.** ${architectureEvaluation.recommendation_reason}

This recommendation is not approval. The project owner must reply **\`${architectureEvaluation.approval_gate.reply_format}\`**. Until then, \`SYSTEM-001\` is pending, TASK-051 remains blocked, and none of the candidate architecture is production authority.
`;
}

function renderReviewHtml(entries) {
  const cards = entries.map(({ dossier, ticket, publicBundle }) => `<article data-ticket-id="${escapeHtml(ticket.ticket_id)}">
      <h2>${escapeHtml(dossier.title)}</h2>
      <p class="public-boundary"><strong>Public projection:</strong> ${escapeHtml(dossier.public_focus_sentence)}</p>
      <figure>${publicBundle.svg}<figcaption>${escapeHtml(publicBundle.text_equivalent)}</figcaption></figure>
      <details><summary>Public Candidates</summary><ul>${ticket.public_candidate_fault_ids.map((id) => `<li><code>${escapeHtml(id)}</code></li>`).join('')}</ul></details>
    </article>`).join('\n');
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>TASK-050 System Model atlas review</title>
  <style>
    * { box-sizing: border-box; }
    :root { color-scheme: dark; font: 100%/1.55 system-ui, sans-serif; background: #030a0f; color: #eef8fb; }
    body { margin: 0; }
    main { width: min(100%, 92rem); margin-inline: auto; padding: clamp(.75rem, 2vw, 2rem); }
    header, article { border: 1px solid #6a98aa; border-radius: .75rem; background: #081822; }
    header { padding: 1rem; margin-block-end: 1rem; }
    article { padding: clamp(.75rem, 2vw, 1.5rem); margin-block: 1rem; overflow: hidden; }
    h1, h2 { line-height: 1.2; overflow-wrap: anywhere; }
    figure { margin: 0; }
    svg { display: block; width: 100%; height: auto; border: 1px solid #7faabd; border-radius: .5rem; }
    figcaption { max-width: 90ch; padding-block: .75rem; overflow-wrap: anywhere; }
    code { overflow-wrap: anywhere; }
    summary { min-height: 2.75rem; padding-block: .6rem; cursor: pointer; }
    @media (max-width: 34rem) { main { padding: .5rem; } article { padding: .55rem; } }
    @media (forced-colors: active) { header, article, svg { border-color: CanvasText; } }
  </style>
</head>
<body>
  <main>
    <header><h1>Five-Ticket System Model atlas review</h1><p>Research-only responsive review surface. Each illustration is public-safe; each written caption is its ordered text equivalent.</p></header>
    ${cards}
  </main>
</body>
</html>
`;
}

export function validateAtlas() {
  const failures = [];
  const expectedTickets = new Set(readJson(atlas.selection_path).expected_selection);
  if (atlas.dossiers.length !== 5) failures.push(`Expected 5 dossiers, found ${atlas.dossiers.length}`);
  if (new Set(atlas.dossiers.map((dossier) => dossier.ticket_id)).size !== 5) failures.push('Dossier Ticket IDs are not unique');
  for (const dossier of atlas.dossiers) {
    const profile = profileById.get(dossier.profile_id);
    const ticket = releasedTickets.get(dossier.ticket_id);
    if (!profile) failures.push(`${dossier.dossier_id}: unknown profile ${dossier.profile_id}`);
    if (!ticket) failures.push(`${dossier.dossier_id}: released Ticket not found`);
    if (!expectedTickets.has(dossier.ticket_id)) failures.push(`${dossier.dossier_id}: not in deterministic pilot selection`);
    if (!profile || !ticket) continue;
    const nodeIds = new Set(profile.nodes.map((node) => node.node_id));
    for (const id of dossier.focus_node_ids) if (!nodeIds.has(id)) failures.push(`${dossier.dossier_id}: missing focus node ${id}`);
    const closureIds = dossier.candidate_closure.map((entry) => entry.candidate_id).sort();
    const candidateIds = [...ticket.public_candidate_fault_ids].sort();
    if (JSON.stringify(closureIds) !== JSON.stringify(candidateIds)) failures.push(`${dossier.dossier_id}: Candidate closure mismatch`);
    for (const entry of dossier.candidate_closure) {
      if (!entry.public_nodes.length || entry.public_nodes.some((id) => !nodeIds.has(id))) failures.push(`${dossier.dossier_id}: invalid closure nodes for ${entry.candidate_id}`);
    }
    for (const [binding, ids] of Object.entries(dossier.private_role_bindings)) {
      if (!ids.length || ids.some((id) => !nodeIds.has(id))) failures.push(`${dossier.dossier_id}: invalid private binding ${binding}`);
    }
    try { relevantActions(ticket, profile); } catch (error) { failures.push(error.message); }
    try { hiddenProofRows(dossier, profile, ticket); } catch (error) { failures.push(error.message); }
  }
  for (const profile of atlas.profiles) {
    for (const item of [...profile.components, ...profile.nodes]) {
      if (item.domain_component_id && !domainComponentIds.has(item.domain_component_id)) failures.push(`${profile.profile_id}: unknown domain Component ${item.domain_component_id}`);
    }
  }
  const usedClaims = new Set();
  for (const profile of atlas.profiles) {
    for (const claim of profile.claim_ids) usedClaims.add(claim);
    for (const group of [profile.components, profile.nodes, profile.edges, profile.lifecycle]) {
      for (const item of group) for (const claim of item.claim_ids) usedClaims.add(claim);
    }
  }
  for (const claim of usedClaims) if (!sourceByClaim.has(claim)) failures.push(`No source ledger entry for ${claim}`);
  const auditCounts = Object.values(componentAudit.component_roles).length;
  if (auditCounts !== componentAudit.summary.modeled_role_rows) failures.push('Component audit modeled-role count mismatch');
  for (const classification of ['existing_sufficient', 'existing_but_broad', 'missing_required', 'optional_outside_scope', 'rejected_unjustified']) {
    const count = componentAudit.component_roles.filter((role) => role.classification === classification).length;
    if (count !== componentAudit.summary[classification]) failures.push(`Component audit ${classification} count mismatch`);
  }
  if (componentAudit.relationship_findings.length !== componentAudit.summary.relationship_findings) failures.push('Component audit relationship count mismatch');
  if (architectureEvaluation.pilot_denominator.tickets !== atlas.dossiers.length) failures.push('Architecture denominator does not match dossier count');
  if (architectureEvaluation.pilot_denominator.source_backed_profiles !== atlas.profiles.length) failures.push('Architecture profile count mismatch');
  if (!architectureEvaluation.strategies.some((strategy) => strategy.option === architectureEvaluation.recommended_option)) failures.push('Architecture recommendation is not an option');
  return failures;
}

export function renderAll() {
  const failures = validateAtlas();
  if (failures.length) throw new Error(failures.join('\n'));
  const entries = atlas.dossiers.map((dossier) => {
    const profile = profileById.get(dossier.profile_id);
    const ticket = releasedTickets.get(dossier.ticket_id);
    const publicBundle = renderPublicBundle(dossier, profile, publicTicket(ticket));
    return { dossier, profile, ticket, publicBundle };
  });
  const files = new Map();
  files.set('ATLAS.md', renderAtlasIndex(entries));
  files.set('COMPONENT_RELATIONSHIP_AUDIT.md', renderComponentAudit());
  files.set('ARCHITECTURE_EVALUATION.md', renderArchitectureEvaluation());
  for (const entry of entries) {
    files.set(`dossiers/${entry.dossier.slug}.md`, renderDossier(entry.dossier, entry.profile, entry.ticket, entry.publicBundle));
    files.set(`diagrams/${entry.dossier.slug}.svg`, entry.publicBundle.svg);
  }
  files.set('review.html', renderReviewHtml(entries));
  const manifestEntries = [...files.entries()].map(([file, content]) => ({ file, sha256: sha256(content), bytes: Buffer.byteLength(content) }));
  files.set('GENERATED-MANIFEST.json', `${JSON.stringify({
    manifest_version: 'task-050-generated-manifest-v1',
    generator: 'docs/system-models/task-050/generate-atlas.mjs',
    atlas_version: atlas.atlas_version,
    files: manifestEntries,
  }, null, 2)}\n`);
  return files;
}

function writeOrCheck(files, check) {
  const mismatches = [];
  for (const [relativePath, content] of files) {
    const target = path.join(HERE, relativePath);
    if (check) {
      if (!fs.existsSync(target) || fs.readFileSync(target, 'utf8') !== content) mismatches.push(relativePath);
    } else {
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, content);
    }
  }
  if (mismatches.length) throw new Error(`Generated files are stale or missing:\n${mismatches.join('\n')}`);
  return files.size;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const check = process.argv.includes('--check');
  const count = writeOrCheck(renderAll(), check);
  console.log(`${check ? 'Checked' : 'Generated'} ${count} TASK-050 files.`);
}
