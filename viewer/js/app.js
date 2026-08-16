import {loadAllContent} from './data-loader.js';
import {ENTITY_TYPE_LABELS as labels, ENTITY_TYPE_ORDER as order, categoryFor as categoryFromLoader} from './entity-types.js';
import {buildFaultGraphView} from './fault-graph-model.js';
import {renderFaultGraphView} from './fault-graph-view.js';

const $ = (selector) => document.querySelector(selector);
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}[char]));

const parseIntSafe = (value, fallback) => {
  const candidate = Number.parseInt(value, 10);
  return Number.isFinite(candidate) ? candidate : fallback;
};
const normalize = (value) => String(value || '').toLowerCase().trim();

const S = {
  records: [],
  faults: [],
  edges: [],
  tab: 'fault',
  view: 'list',
  list: {q: '', sort: 'name', cat: ''},
  graph: {
    q: '',
    cat: 'all',
    depth: 1,
    direction: 'both',
    zoom: 1,
    selectedNodeId: '',
    selectedEdgeId: '',
    layout: null,
  },
  dialogReturnFocus: null,
};

const stateFromUrl = () => {
  const params = new URLSearchParams(location.search);
  if (params.get('view') === 'graph') {
    S.view = 'graph';
  }
  S.graph.q = normalize(params.get('q') || '');
  S.graph.depth = parseIntSafe(params.get('depth'), 1);
  if (!Number.isFinite(S.graph.depth) || S.graph.depth < 0 || S.graph.depth > 3) {
    S.graph.depth = 1;
  }
  const direction = params.get('direction') || 'both';
  S.graph.direction = ['both', 'causes', 'effects'].includes(direction) ? direction : 'both';
  S.graph.cat = params.get('category') || 'all';
};

const syncGraphStateToUrl = () => {
  const params = new URLSearchParams(location.search);
  if (S.view !== 'graph') {
    params.delete('view');
    params.delete('q');
    params.delete('depth');
    params.delete('direction');
    params.delete('category');
  } else {
    params.set('view', 'graph');
    if (S.graph.q) params.set('q', S.graph.q);
    else params.delete('q');
    params.set('depth', String(S.graph.depth));
    params.set('direction', S.graph.direction);
    params.set('category', S.graph.cat || 'all');
  }
  history.replaceState({}, '', `${location.pathname}${params.toString() ? `?${params}` : ''}`);
};

const faultName = (record) => record?.presentation?.display_name || record?.name || record?.id || '';
const faultDescription = (record) => record?.presentation?.short_description || record?.description || record?.education_text || 'No description yet.';
const faultCategory = (record) => record?.category || record?.subsystem || '';

const listTabs = () => {
  const tabs = $('#tabs');
  tabs.innerHTML = '';

  for (const tab of order) {
    const button = document.createElement('button');
    button.className = `tab ${S.view === 'list' && S.tab === tab ? 'active' : ''}`;
    button.type = 'button';
    button.textContent = `${tab === 'everything' ? 'Everything' : labels[tab]} (${tab === 'everything'
      ? S.records.length
      : S.records.filter((record) => record.entity_type === tab).length
    })`;
    button.addEventListener('click', () => {
      S.view = 'list';
      S.tab = tab;
      S.graph.selectedNodeId = '';
      S.graph.selectedEdgeId = '';
      $('#graphControls').hidden = true;
      $('#listControls').hidden = false;
      $('#search').value = S.list.q;
      render();
    });
    tabs.append(button);
  }

  const graphTab = document.createElement('button');
  graphTab.type = 'button';
  graphTab.className = `tab ${S.view === 'graph' ? 'active' : ''}`;
  graphTab.textContent = `Fault Graph (${S.faults.length})`;
  graphTab.addEventListener('click', () => {
    S.view = 'graph';
    $('#listControls').hidden = true;
    $('#graphControls').hidden = false;
    render();
    syncGraphStateToUrl();
  });
  tabs.append(graphTab);
};

const listCats = () => {
  const options = [...new Set(
    S.records
      .filter((record) => S.tab === 'everything' || record.entity_type === S.tab)
      .map(categoryFromLoader)
      .filter(Boolean),
  )].sort();
  $('#category').innerHTML = `<option value="">All categories</option>${options.map((value) => `<option>${esc(value)}</option>`).join('')}`;
  if (!options.includes(S.list.cat)) {
    S.list.cat = '';
  }
  $('#category').value = S.list.cat;
};

const graphCats = () => {
  const options = [...new Set(S.faults.map(faultCategory).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  options.unshift('all');
  $('#graphCategory').innerHTML = options.map((value) => `<option value="${esc(value)}">${esc(value)}</option>`).join('');
  const categoryValue = S.graph.cat || 'all';
  if (!options.includes(categoryValue)) {
    S.graph.cat = 'all';
  }
  $('#graphCategory').value = S.graph.cat;
};

const graphSummaryText = (result) => {
  const matchCount = result.nodes.length;
  if (!S.graph.q && result.limited) {
    return `Showing ${matchCount} causal nodes; graph is limited.`;
  }
  if (!S.graph.q && !matchCount && !result.warnings.length) {
    return 'No connected faults to display.';
  }
  if (matchCount === 0) {
    return 'No matches in the fault graph.';
  }
  return `${matchCount} causal node${matchCount === 1 ? '' : 's'}`;
};

function listRows() {
  let visible = S.records.filter((record) => S.tab === 'everything' || record.entity_type === S.tab);
  if (S.list.cat) {
    visible = visible.filter((record) => categoryFromLoader(record) === S.list.cat);
  }
  if (S.list.q) {
    visible = visible.filter((record) => JSON.stringify(record).toLowerCase().includes(S.list.q));
  }
  const comparator = {
    name: (a, b) => faultName(a).localeCompare(faultName(b)),
    type: (a, b) => a.entity_type.localeCompare(b.entity_type) || faultName(a).localeCompare(faultName(b)),
    category: (a, b) => (faultCategory(a) || '').localeCompare(faultCategory(b) || '') || faultName(a).localeCompare(faultName(b)),
    id: (a, b) => a.id.localeCompare(b.id),
  };
  return visible.sort(comparator[S.list.sort]);
}

const detailRows = (record, exclude = new Set(['presentation', 'source', 'entity_type', '_pack_id', '_pack_name'])) => {
  const stringify = (value) => {
    if (Array.isArray(value)) {
      return `<ul>${value.map((item) => `<li>${esc(stringify(item))}</li>`).join('')}</ul>`;
    }
    if (value && typeof value === 'object') {
      return `<pre>${esc(JSON.stringify(value, null, 2))}</pre>`;
    }
    return esc(value ?? '');
  };
  return Object.entries(record)
    .filter(([key]) => !exclude.has(key))
    .map(([key, value]) => `<tr><td>${esc(key.replaceAll('_', ' '))}</td><td>${stringify(value)}</td></tr>`)
    .join('');
};

const showDialog = (html, returnFocus = null) => {
  S.dialogReturnFocus = returnFocus || document.activeElement;
  $('#detail').innerHTML = html;
  $('#dialog').showModal();
};

const closeDialog = () => {
  $('#dialog').close();
};

const showFaultDetail = (record) => {
  showDialog(
    `<span class="pill">${esc(labels[record.entity_type] || record.entity_type)}</span><h2>${esc(faultName(record))}</h2><p>${esc(faultDescription(record))}</p>${record.presentation?.illustration
      ? `<h3>Illustration</h3><p><code>${esc(record.presentation.illustration.asset_id)}</code><br>${esc(record.presentation.illustration.alt_text || '')}</p>`
      : ''}<h3>Domain data</h3><table>${detailRows(record)}</table><p>Pack: ${esc(record._pack_name || '')}</p>`,
    $('#results')?.querySelector('button:focus') || $('#tabs'),
  );
};

const showGraphNodeDetail = (node) => {
  const record = node.fault;
  const buttonId = `center-${node.id}`;
  showDialog(
    `<span class="pill">${esc('Fault')}</span><h2>${esc(faultName(record))}</h2><p>${esc(faultDescription(record))}</p><h3>Role</h3><p>${esc(node.role)}</p>${record.presentation?.illustration
      ? `<h3>Illustration</h3><p><code>${esc(record.presentation?.illustration?.asset_id || '')}</code><br>${esc(record.presentation?.illustration?.alt_text || '')}</p>`
      : ''}<h3>Domain data</h3><table>${detailRows(record)}</table><button id="${buttonId}" type="button">Center this fault in graph</button>`,
    $('#graphCanvas'),
  );
  const focusNode = $('#graphCanvasWrap');
  setTimeout(() => {
    const button = $(`#${CSS.escape(buttonId)}`);
    if (button) button.addEventListener('click', () => centerGraph(node.id));
    if (focusNode) focusNode.focus();
  }, 0);
};

const showGraphEdgeDetail = (item) => {
  const edge = item.edge || {};
  showDialog(
    `<span class="pill">${esc('Fault causal edge')}</span><h2>${esc(edge.presentation?.display_name || 'Fault Causal Relationship')}</h2><p>${esc(edge.presentation?.short_description || 'Causal relationship between two fault records.')}</p><h3>Relationship detail</h3><table>${detailRows({
      id: edge.id,
      relationship_type: edge.relationship_type,
      cause_fault_id: edge.causeFaultId || edge.cause_fault_id,
      effect_fault_id: edge.effectFaultId || edge.effect_fault_id,
      notes: edge.notes || '',
      source: edge.source || {},
      status: item.cycle ? 'Cycle participant' : 'Acyclic context',
      stable_edge_id: edge.id,
    })}</table><button id="focusCause" type="button" data-id="${esc(edge.cause_fault_id)}">Focus cause</button><button id="focusEffect" type="button" data-id="${esc(edge.effect_fault_id)}">Focus effect</button>`,
    $('#graphCanvas'),
  );
  setTimeout(() => {
    const cause = document.getElementById('focusCause');
    const effect = document.getElementById('focusEffect');
    const ids = new Set(S.graph.layout ? Array.from(S.graph.layout.keys()) : []);
    if (cause) cause.addEventListener('click', () => {
      const selected = edge.cause_fault_id;
      if (!ids.has(selected)) return;
      S.graph.selectedNodeId = selected;
      S.graph.selectedEdgeId = '';
      render();
      centerGraph(selected);
    });
    if (effect) effect.addEventListener('click', () => {
      const selected = edge.effect_fault_id;
      if (!ids.has(selected)) return;
      S.graph.selectedNodeId = selected;
      S.graph.selectedEdgeId = '';
      render();
      centerGraph(selected);
    });
  }, 0);
};

function renderList() {
  $('#graphView').hidden = true;
  $('#results').hidden = false;
  const rows = listRows();
  $('#results').innerHTML = '';
  $('#resultCount').textContent = `${rows.length} result${rows.length === 1 ? '' : 's'}`;
  $('#summary').textContent = S.tab === 'everything' ? 'Everything' : labels[S.tab];
  $('#empty').hidden = !!rows.length;
  if (!rows.length) {
    $('#empty').innerHTML = '<h2>No matches</h2><p>Try a broader query or remove a filter.</p>';
    return;
  }
  $('#empty').hidden = true;
  for (const record of rows) {
    const card = document.createElement('button');
    card.className = 'card';
    card.type = 'button';
    card.innerHTML = `<span class="pill">${esc(labels[record.entity_type] || record.entity_type)}</span>${faultCategory(record) ? `<span class="pill">${esc(faultCategory(record))}</span>` : ''}<h2>${esc(faultName(record))}</h2><p>${esc(faultDescription(record))}</p><code>${esc(record.id)}</code>`;
    card.addEventListener('click', () => showFaultDetail(record));
    $('#results').append(card);
  }
}

function graphRows() {
  return buildFaultGraphView({
    faults: S.faults,
    edges: S.edges,
    query: S.graph.q,
    category: S.graph.cat || 'all',
    depth: S.graph.depth,
    direction: S.graph.direction,
    softLimit: 40,
    hardLimit: 60,
    absoluteLimit: 100,
  });
}

function centerGraph(nodeId) {
  if (!nodeId || !S.graph.layout || !S.graph.layout.has(nodeId)) {
    return;
  }
  const wrap = $('#graphCanvasWrap');
  const viewport = $('#graphCanvas');
  const pos = S.graph.layout.get(nodeId);
  const zoom = Math.max(0.5, S.graph.zoom);
  const x = (pos.x * zoom) + (220 / 2) - (wrap.clientWidth / 2);
  const y = (pos.y * zoom) + (110 / 2) - (wrap.clientHeight / 2);
  wrap.scrollTo({
    left: Math.max(0, x),
    top: Math.max(0, y),
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
  });
  S.graph.selectedNodeId = nodeId;
  render();
}

function renderGraph() {
  $('#results').hidden = true;
  $('#empty').hidden = true;
  $('#graphView').hidden = false;
  const result = graphRows();
  $('#resultCount').textContent = `${result.nodes.length} result${result.nodes.length === 1 ? '' : 's'}`;
  $('#summary').textContent = `Fault Graph (${S.graph.direction} / depth ${S.graph.depth})`;
  $('#graphCanvas').style.setProperty('--graph-scale', `${S.graph.zoom}`);

  const graphData = renderFaultGraphView({
    result,
    graphCanvas: $('#graphCanvas'),
    relationshipList: $('#graphRelationships'),
    warningList: $('#graphWarningArea'),
    state: S.graph,
    selectedNodeId: S.graph.selectedNodeId,
    selectedEdgeId: S.graph.selectedEdgeId,
    onSelectNode: (node) => {
      S.graph.selectedNodeId = node.id;
      S.graph.selectedEdgeId = '';
      showGraphNodeDetail(node);
      render();
    },
    onSelectEdge: (edge) => {
      S.graph.selectedNodeId = '';
      S.graph.selectedEdgeId = edge.id;
      showGraphEdgeDetail(edge);
      render();
    },
  });

  S.graph.layout = graphData.positions;
  if (!result.nodes.length) {
    $('#graphRelationships').hidden = true;
    if (!S.graph.q && result.warnings.find((item) => item.code === 'no_connected_fault_overview')) {
      $('#graphRelationships').innerHTML = '<p>Connected causal graph is empty for the current category and direction.</p>';
      $('#graphRelationships').hidden = false;
    }
  }

  $('#summary').textContent = graphSummaryText(result);
  $('#graphZoomLabel').textContent = `${Math.round(S.graph.zoom * 100)}%`;

  if (result.nodes.length && !S.graph.selectedNodeId && !S.graph.selectedEdgeId) {
    const first = result.nodes[0];
    const selected = $('#graphCanvas').querySelector(`.graph-node[data-id="${CSS.escape(first.id)}"]`);
    if (selected) selected.focus({preventScroll: true});
  }
}

const render = () => {
  listTabs();
  if (S.view === 'graph') {
    $('#listControls').hidden = true;
    $('#graphControls').hidden = false;
    graphCats();
    renderGraph();
  } else {
    $('#graphControls').hidden = true;
    $('#listControls').hidden = false;
    listCats();
    renderList();
  }
};

const initControl = () => {
  $('#search').addEventListener('input', (event) => {
    S.list.q = (event.target.value || '').toLowerCase().trim();
    if (S.view === 'list') render();
  });
  $('#sort').addEventListener('change', (event) => {
    S.list.sort = event.target.value;
    if (S.view === 'list') render();
  });
  $('#category').addEventListener('change', (event) => {
    S.list.cat = event.target.value;
    if (S.view === 'list') render();
  });

  $('#graphSearch').addEventListener('input', (event) => {
    S.graph.q = normalize(event.target.value);
    if (S.view === 'graph') {
      S.graph.selectedNodeId = '';
      S.graph.selectedEdgeId = '';
      syncGraphStateToUrl();
      render();
    }
  });
  $('#graphCategory').addEventListener('change', (event) => {
    S.graph.cat = event.target.value || 'all';
    if (S.view === 'graph') {
      S.graph.selectedNodeId = '';
      S.graph.selectedEdgeId = '';
      syncGraphStateToUrl();
      render();
    }
  });
  $('#graphDepth').addEventListener('change', (event) => {
    S.graph.depth = parseIntSafe(event.target.value, 1);
    if (S.view === 'graph') {
      syncGraphStateToUrl();
      render();
    }
  });
  $('#graphDirection').addEventListener('change', (event) => {
    S.graph.direction = event.target.value;
    if (S.view === 'graph') {
      syncGraphStateToUrl();
      render();
    }
  });
  $('#graphZoomIn').addEventListener('click', () => {
    S.graph.zoom = Math.min(2, +(S.graph.zoom + 0.1).toFixed(1));
    if (S.view === 'graph') render();
  });
  $('#graphZoomOut').addEventListener('click', () => {
    S.graph.zoom = Math.max(0.5, +(S.graph.zoom - 0.1).toFixed(1));
    if (S.view === 'graph') render();
  });
  $('#graphResetZoom').addEventListener('click', () => {
    S.graph.zoom = 1;
    if (S.view === 'graph') render();
  });
  $('#graphCenter').addEventListener('click', () => {
    const first = S.graph.selectedNodeId || (graphRows().nodes[0] || {}).id;
    if (first) centerGraph(first);
  });

  $('#close').addEventListener('click', closeDialog);
  $('#dialog').addEventListener('click', (event) => {
    if (event.target === $('#dialog')) {
      closeDialog();
    }
  });
  $('#dialog').addEventListener('close', () => {
    const focusTarget = S.dialogReturnFocus;
    if (focusTarget && focusTarget.focus) {
      focusTarget.focus();
    }
  });
};

const startup = async () => {
  try {
    const {manifest, packs, records} = await loadAllContent();
    S.records = records;
    S.faults = records.filter((record) => record.entity_type === 'fault');
    S.edges = records.filter((record) => record.entity_type === 'fault_causal_edge');
    stateFromUrl();
    $('#recordCount').textContent = String(records.length);
    $('#status').textContent = `Loaded ${packs.length} pack(s). Manifest: ${manifest.generated_at || 'prototype'}.`;
    initControl();
    $('#search').value = S.list.q;
    $('#graphSearch').value = S.graph.q;
    $('#graphDepth').value = String(S.graph.depth);
    $('#graphDirection').value = S.graph.direction;
    if (S.view === 'graph') {
      $('#listControls').hidden = true;
      $('#graphControls').hidden = false;
      $('#search').value = '';
    } else {
      $('#graphControls').hidden = true;
      $('#listControls').hidden = false;
    }
    render();
    syncGraphStateToUrl();
  } catch (error) {
    console.error(error);
    $('#status').textContent = `Load failed: ${error.message}`;
    $('#graphView').hidden = true;
    $('#results').innerHTML = '';
    $('#empty').hidden = false;
    $('#empty').innerHTML = '<h2>Could not load content</h2><p>Serve this folder over HTTP; do not open with file://.</p>';
  }
};

startup();
