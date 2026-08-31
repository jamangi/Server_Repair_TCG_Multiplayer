import { escapeHtml } from './dom-utils.mjs';

const ACTION_GROUP_LABELS = Object.freeze({
  TEST: 'Tests',
  COMMAND: 'Commands',
  REPAIR: 'Repairs',
  VERIFICATION: 'Verifications',
});

const LINE_DASH = Object.freeze({
  SOLID: '',
  DOUBLE: '2 3',
  DOTTED: '2 7',
  DASHED: '10 6',
  DASH_DOT: '12 5 2 5',
  LONG_DASH: '18 7',
  SHORT_DASH: '6 5',
  DOUBLE_DASH: '14 4 4 4',
});

function humanize(value) {
  return String(value ?? '')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function wrapLabel(value, limit = 22) {
  const words = String(value).split(/\s+/u);
  const lines = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (line && next.length > limit) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines.slice(0, 3);
}

function libraryLink(entityId, label = entityId) {
  if (!entityId) return escapeHtml(label);
  return `<a href="#/library/${encodeURIComponent(entityId)}" target="_blank" rel="noopener" data-system-library-link="${escapeHtml(entityId)}">${escapeHtml(label)}<span class="play-sr-only"> (opens Domain Library in a new tab)</span></a>`;
}

function renderLifecycle(lifecycle) {
  return `<section class="system-section system-lifecycle" aria-labelledby="system-lifecycle-heading">
    <div class="system-section__heading"><p class="play-eyebrow">Startup and runtime</p><h3 id="system-lifecycle-heading">${escapeHtml(lifecycle.heading)}</h3></div>
    <ol>${lifecycle.entries.map((entry) => `<li data-applicability="${escapeHtml(entry.applicability)}">
      <span class="system-applicability">${escapeHtml(humanize(entry.applicability))}</span>
      <p>${escapeHtml(entry.text)}</p>
      ${entry.condition ? `<small>Condition: ${escapeHtml(entry.condition)}</small>` : ''}
    </li>`).join('')}</ol>
    <p class="system-scope-note">${escapeHtml(lifecycle.not_applicable_note)}</p>
  </section>`;
}

function renderTopology(topology) {
  const nodes = new Map(topology.nodes.map((node) => [node.node_id, node]));
  const edges = topology.edges.map((edge) => {
    const fromNode = nodes.get(edge.from_node_id);
    const toNode = nodes.get(edge.to_node_id);
    const from = fromNode.layout;
    const to = toNode.layout;
    const x1 = from.x + from.width / 2;
    const y1 = from.y + from.height / 2;
    const x2 = to.x + to.width / 2;
    const y2 = to.y + to.height / 2;
    const dash = LINE_DASH[edge.line_pattern] ?? '';
    return `<g class="system-topology__edge" aria-hidden="true" data-relation-family="${escapeHtml(edge.relation_family)}">
      <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"${dash ? ` stroke-dasharray="${dash}"` : ''} marker-end="url(#system-topology-arrow)" />
      <text x="${(x1 + x2) / 2}" y="${(y1 + y2) / 2 - 7}">${escapeHtml(edge.relation_family)}</text>
    </g>`;
  }).join('');
  const nodeMarkup = topology.nodes.map((node) => {
    const lines = wrapLabel(node.label);
    const label = lines.map((line, index) => `<tspan x="${node.layout.x + node.layout.width / 2}" dy="${index === 0 ? 0 : 16}">${escapeHtml(line)}</tspan>`).join('');
    return `<g class="system-topology__node" tabindex="0" role="listitem" data-node-id="${escapeHtml(node.node_id)}" data-plane="${escapeHtml(node.plane)}" data-reading-order="${node.layout.reading_order}" aria-label="${escapeHtml(`${node.label}; ${humanize(node.node_kind)}; ${humanize(node.plane)} plane`)}">
      <rect x="${node.layout.x}" y="${node.layout.y}" width="${node.layout.width}" height="${node.layout.height}" rx="12" />
      <text x="${node.layout.x + node.layout.width / 2}" y="${node.layout.y + 29}" text-anchor="middle">${label}</text>
    </g>`;
  }).join('');
  const legend = topology.legend.map((item) => `<li data-relation-family="${escapeHtml(item.relation_family)}"><span class="system-line-sample" data-line-pattern="${escapeHtml(item.line_pattern)}" aria-hidden="true"></span><span>${escapeHtml(humanize(item.relation_family))}</span><small>${escapeHtml(humanize(item.line_pattern))} line</small></li>`).join('');
  const text = topology.text_equivalent;
  return `<section class="system-section system-topology" aria-labelledby="system-topology-heading">
    <div class="system-section__heading"><p class="play-eyebrow">One public semantic source</p><h3 id="system-topology-heading">Topology</h3></div>
    <p id="system-topology-scope">${escapeHtml(topology.scope_statement)}</p>
    <ul class="system-topology__legend" aria-label="Relationship line legend">${legend}</ul>
    <figure>
      <div class="system-topology__canvas" role="region" aria-label="Scrollable system topology diagram" tabindex="0">
        <svg viewBox="0 0 ${topology.canvas.width} ${topology.canvas.height}" role="img" aria-labelledby="system-topology-svg-title system-topology-scope">
          <title id="system-topology-svg-title">${escapeHtml(topology.title)}</title>
          <defs><marker id="system-topology-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" /></marker></defs>
          ${edges}
          <g role="list" aria-label="System topology nodes">${nodeMarkup}</g>
        </svg>
      </div>
      <figcaption>Diagram positions explain relationships; they do not show current health, cause, or a physical service layout.</figcaption>
    </figure>
    <section class="system-text-equivalent" aria-labelledby="system-text-equivalent-heading">
      <h4 id="system-text-equivalent-heading">Complete topology text equivalent</h4>
      <h5>Nodes, in reading order</h5><ol>${text.ordered_node_sentences.map((sentence) => `<li>${escapeHtml(sentence)}</li>`).join('')}</ol>
      <h5>Connections, in reading order</h5><ol>${text.ordered_edge_sentences.map((sentence) => `<li>${escapeHtml(sentence)}</li>`).join('')}</ol>
      <h5>Paths, in reading order</h5><ol class="system-path-list">${text.ordered_path_sentences.map((sentence, index) => `<li tabindex="0" data-path-order="${index + 1}">${escapeHtml(sentence)}</li>`).join('')}</ol>
      <h5>Declared abstractions</h5><ul>${text.abstraction_sentences.map((sentence) => `<li>${escapeHtml(sentence)}</li>`).join('')}</ul>
    </section>
  </section>`;
}

function renderComponents(components) {
  return `<section class="system-section system-components" aria-labelledby="system-components-heading">
    <div class="system-section__heading"><p class="play-eyebrow">Roles and service boundaries</p><h3 id="system-components-heading">Major components</h3></div>
    <ul>${components.map((component) => `<li data-component-role="${escapeHtml(component.role_id)}">
      <header><strong>${escapeHtml(component.label)}</strong><span>${escapeHtml(humanize(component.optionality))}</span></header>
      <p>${escapeHtml(component.purpose)}</p>
      <dl><div><dt>Amount</dt><dd>${escapeHtml(component.multiplicity)}</dd></div><div><dt>Service type</dt><dd>${escapeHtml(humanize(component.replaceability))}</dd></div><div><dt>Service note</dt><dd>${escapeHtml(component.serviceability_note)}</dd></div><div><dt>Domain record</dt><dd>${component.component_definition_id ? libraryLink(component.component_definition_id) : 'Honest public abstraction'}</dd></div></dl>
    </li>`).join('')}</ul>
  </section>`;
}

function rationaleSteps(graph) {
  const nodeById = new Map(graph.graph_nodes.map((node) => [node.graph_node_id, node]));
  return graph.graph_edges.map((edge) => {
    const from = nodeById.get(edge.from_graph_node_id)?.label ?? edge.from_graph_node_id;
    const to = nodeById.get(edge.to_graph_node_id)?.label ?? edge.to_graph_node_id;
    return `${from} → ${edge.relation} → ${to}`;
  });
}

function renderRationales(rationales, legalActionDefinitionIds) {
  const groups = Object.entries(ACTION_GROUP_LABELS).map(([kind, label]) => {
    const graphs = rationales[kind] ?? [];
    return `<section class="system-rationale-group" aria-labelledby="system-rationale-${kind.toLowerCase()}">
      <h4 id="system-rationale-${kind.toLowerCase()}">${escapeHtml(label)} <span>${graphs.length}</span></h4>
      <div>${graphs.map((graph) => {
        const actionName = graph.graph_nodes.find((node) => node.kind === 'ACTION')?.label ?? graph.action_definition_id;
        const legalNow = legalActionDefinitionIds.has(graph.action_definition_id);
        return `<details data-action-kind="${escapeHtml(kind)}" data-action-definition-id="${escapeHtml(graph.action_definition_id)}" data-legal-now="${legalNow}">
          <summary><span class="system-action-kind">${escapeHtml(kind)}</span><strong>${escapeHtml(actionName)}</strong><span class="system-action-chevron" aria-hidden="true">⌄</span></summary>
          <div class="system-rationale__body">
            <p>${escapeHtml(graph.sentence)}</p>
            <ol>${rationaleSteps(graph).map((step) => `<li>${escapeHtml(step)}</li>`).join('')}</ol>
            <div class="system-status-row"><span class="system-status system-status--relevant"><span aria-hidden="true">◆</span> Relevant to this system</span><span class="system-status system-status--legal" data-legal-now="${legalNow}"><span aria-hidden="true">${legalNow ? '✓' : '—'}</span> ${legalNow ? 'Legal now for this Ticket' : 'Not currently legal for this Ticket'}</span></div>
            <p class="system-rationale__authority">${escapeHtml(graph.legality_label)}</p>
            <p>${libraryLink(graph.action_definition_id, `Open ${actionName} in the Domain Library`)}</p>
          </div>
        </details>`;
      }).join('') || '<p>No actions in this family are attached to the public profile.</p>'}</div>
    </section>`;
  }).join('');
  return `<section class="system-section system-rationales" aria-labelledby="system-rationales-heading">
    <div class="system-section__heading"><p class="play-eyebrow">Inspectable explanation paths</p><h3 id="system-rationales-heading">Why actions can be relevant</h3></div>
    <p>These paths explain educational applicability to the system. They do not predict a result, count as Evidence, identify the correct diagnosis, or make an action legal.</p>
    <div class="system-rationale-groups">${groups}</div>
  </section>`;
}

function renderLearningReferences(references) {
  return `<section class="system-section system-learning" aria-labelledby="system-learning-heading">
    <div class="system-section__heading"><p class="play-eyebrow">Public learning sources</p><h3 id="system-learning-heading">Learn from the source basis</h3></div>
    <ul>${references.map((reference) => `<li><strong>${escapeHtml(reference.title)}</strong><span>${escapeHtml(reference.publisher)} · ${escapeHtml(reference.product_scope)}</span><span>${escapeHtml(reference.revision)} · ${escapeHtml(humanize(reference.claim_scope))}</span><a href="${escapeHtml(reference.url)}" target="_blank" rel="noopener noreferrer">Open public source<span class="play-sr-only"> in a new tab</span></a></li>`).join('')}</ul>
  </section>`;
}

/**
 * Render only TASK-054's public player projection. Worker legality enters as a
 * separate set of public action-definition IDs and never changes model data.
 */
export function systemModelDialogMarkup(projection, {
  legalActionDefinitionIds = new Set(),
} = {}) {
  return `<header class="play-dialog__header system-dialog__header"><div><p class="play-eyebrow">Informational · 0 Actions</p><h2 id="system-model-heading">${escapeHtml(projection.profile.display_name)} system</h2><p>${escapeHtml(projection.profile.model_scope)}</p></div><button type="button" class="dialog-close" data-close-dialog="system" aria-label="Close system view">×</button></header>
    <div class="play-dialog__body system-dialog__body" data-system-projection-version="${escapeHtml(projection.projection_version)}" data-system-cache-key="${escapeHtml(projection.cache_key)}">
      <section class="system-intro" aria-labelledby="system-intro-heading"><div><p class="play-eyebrow">What kind of system is this?</p><h3 id="system-intro-heading">${escapeHtml(projection.profile.display_name)}</h3></div><p>${escapeHtml(projection.intro)}</p><p class="system-description--concise">${escapeHtml(projection.descriptions.concise)}</p></section>
      <aside class="system-authority" aria-labelledby="system-authority-heading"><h3 id="system-authority-heading">A map, not Evidence</h3><ul><li>${escapeHtml(projection.authority_boundary.system_relevance)}</li><li>${escapeHtml(projection.authority_boundary.legal_now)}</li><li>Opening, inspecting, or closing this view spends no Action and changes no machine state.</li></ul></aside>
      ${renderLifecycle(projection.lifecycle)}
      ${renderTopology(projection.topology)}
      ${renderComponents(projection.components)}
      ${renderRationales(projection.rationales, legalActionDefinitionIds)}
      <details class="system-extended-description"><summary>Extended system and option notes</summary><p>${escapeHtml(projection.descriptions.extended)}</p></details>
      ${renderLearningReferences(projection.learning_references)}
    </div>
    <footer class="play-dialog__footer system-dialog__footer"><span>System relevance never means “correct for this Ticket.”</span><button type="button" class="play-button" data-close-dialog="system">Close system view</button></footer>`;
}
