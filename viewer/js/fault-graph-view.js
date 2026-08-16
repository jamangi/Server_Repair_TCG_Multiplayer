const NODE_WIDTH = 220;
const NODE_HEIGHT = 110;
const COLUMN_WIDTH = 300;
const ROW_GAP = 140;

function normalizeText(value) {
  return String(value || '').toLowerCase().trim();
}

function buildRoles(node, selected) {
  const role = node.role || 'seed';
  if (selected === node.id) {
    return `${role} selected`;
  }
  return role;
}

function labelForRole(role) {
  if (role === 'upstream') return 'upstream context';
  if (role === 'downstream') return 'downstream context';
  if (role === 'both') return 'both upstream and downstream context';
  return 'seed';
}

function makeNodeLabel(node, faultMap) {
  const fault = faultMap.get(node.id) || node.fault || {};
  const name = fault.presentation?.display_name || fault.name || fault.id || node.id;
  return `${name} (${labelForRole(node.role)})`;
}

export function renderFaultGraphView({
  result,
  graphCanvas,
  relationshipList,
  warningList,
  controls = {},
  state = {},
  selectedNodeId = '',
  selectedEdgeId = '',
  onSelectNode,
  onSelectEdge,
}) {
  graphCanvas.innerHTML = '';
  warningList.innerHTML = '';
  relationshipList.innerHTML = '';

  const nodes = result.nodes || [];
  const edges = result.edges || [];
  const warnings = result.warnings || [];

  const faultMap = new Map();
  for (const item of nodes) {
    faultMap.set(item.id, item.fault);
  }

  const warningsHeading = document.createElement('h3');
  warningsHeading.textContent = 'Warnings';
  warningsHeading.hidden = !warnings.length;

  if (warnings.length) {
    warningList.append(warningsHeading);
    const list = document.createElement('ul');
    for (const warning of warnings) {
      const row = document.createElement('li');
      row.className = `warning warning-${warning.code}`;
      row.setAttribute('role', 'status');
      row.textContent = `${warning.code}: ${warning.message}`;
      list.append(row);
    }
    warningList.append(list);
    warningList.hidden = false;
  } else {
    warningList.hidden = true;
  }

  if (!nodes.length) {
    const status = document.createElement('p');
    status.className = 'graph-empty';
    status.textContent = nodes.length ? '' : 'No faults currently visible in the causal graph.';
    graphCanvas.append(status);
    relationshipList.hidden = true;
    return { positions: new Map(), limit: { width: 0, height: 0 } };
  }

  const maxRank = Math.max(...nodes.map((item) => item.rank));
  const rankGroups = new Map();
  for (const node of nodes) {
    if (!rankGroups.has(node.rank)) {
      rankGroups.set(node.rank, []);
    }
    rankGroups.get(node.rank).push(node);
  }
  for (const group of rankGroups.values()) {
    group.sort((a, b) => {
      if (a.order === b.order) return a.id.localeCompare(b.id);
      return a.order - b.order;
    });
  }

  const positions = new Map();
  let maxRow = 0;
  for (let rank = 0; rank <= maxRank; rank += 1) {
    const group = rankGroups.get(rank) || [];
    group.forEach((node, index) => {
      positions.set(node.id, {
        x: rank * COLUMN_WIDTH + 20,
        y: index * ROW_GAP + 20,
      });
    });
    maxRow = Math.max(maxRow, group.length);
  }
  const width = (maxRank + 1) * COLUMN_WIDTH + NODE_WIDTH + 40;
  const height = Math.max(maxRow * ROW_GAP + 160, 220);

  const surface = document.createElement('div');
  surface.className = 'graph-surface';
  surface.style.width = `${width}px`;
  surface.style.height = `${height}px`;
  surface.style.position = 'relative';
  surface.style.minWidth = `${width}px`;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'graph-lines');
  svg.setAttribute('width', String(width));
  svg.setAttribute('height', String(height));
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('aria-hidden', 'true');

  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
  marker.setAttribute('id', 'graph-arrow');
  marker.setAttribute('viewBox', '0 0 10 10');
  marker.setAttribute('refX', '10');
  marker.setAttribute('refY', '5');
  marker.setAttribute('markerWidth', '6');
  marker.setAttribute('markerHeight', '6');
  marker.setAttribute('orient', 'auto');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', 'M 0 0 L 10 5 L 0 10 z');
  marker.append(path);
  defs.append(marker);
  svg.append(defs);

  for (const edge of edges) {
    const source = positions.get(edge.causeFaultId);
    const target = positions.get(edge.effectFaultId);
    if (!source || !target) {
      continue;
    }
    const sx = source.x + NODE_WIDTH;
    const sy = source.y + NODE_HEIGHT / 2;
    const tx = target.x;
    const ty = target.y + NODE_HEIGHT / 2;
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', String(sx));
    line.setAttribute('y1', String(sy));
    line.setAttribute('x2', String(tx));
    line.setAttribute('y2', String(ty));
    line.setAttribute('class', `graph-edge ${edge.cycle ? 'graph-edge-cycle' : ''} ${selectedEdgeId === edge.id ? 'selected' : ''}`);
    line.setAttribute('marker-end', 'url(#graph-arrow)');
    svg.append(line);

    const button = document.createElement('button');
    button.className = `edge-button ${edge.cycle ? 'cycle' : ''} ${selectedEdgeId === edge.id ? 'selected' : ''}`;
    button.type = 'button';
    button.setAttribute('aria-label', `Select edge ${edge.id}`);
    button.style.left = `${(sx + tx) / 2}px`;
    button.style.top = `${(sy + ty) / 2}px`;
    button.textContent = '↗';
    button.addEventListener('click', () => onSelectEdge(edge));
    surface.append(button);
  }

  const nodeById = new Map();
  for (const node of nodes) {
    const point = positions.get(node.id);
    const button = document.createElement('button');
    const fault = faultMap.get(node.id) || {};
    const name = fault.presentation?.display_name || fault.name || fault.id || node.id;
    button.type = 'button';
    button.className = `graph-node ${buildRoles(node, selectedNodeId)}`;
    button.style.left = `${point.x}px`;
    button.style.top = `${point.y}px`;
    button.setAttribute('aria-label', `${name}, ${normalizeText(labelForRole(node.role))}`);
    button.innerHTML = `<span class="node-role">${node.role}</span><h4>${name}</h4><p>${fault?.id || node.id}</p><p>distance ${node.distance}</p>`;
    button.addEventListener('click', () => onSelectNode(node));
    surface.append(button);
    nodeById.set(node.id, button);
  }

  if (selectedEdgeId) {
    const selectedEdge = edges.find((edge) => edge.id === selectedEdgeId);
    if (selectedEdge) {
      const sourceNode = nodeById.get(selectedEdge.causeFaultId);
      const targetNode = nodeById.get(selectedEdge.effectFaultId);
      sourceNode?.classList.add('endpoint');
      targetNode?.classList.add('endpoint');
    }
  }

  for (const node of nodes) {
    const point = positions.get(node.id);
    node.x = point.x;
    node.y = point.y;
  }

  surface.append(svg);
  graphCanvas.append(surface);

  const toolbar = document.getElementById('graphToolbar');
  if (toolbar) {
    toolbar.hidden = false;
    const fitButton = document.getElementById('graphCenter');
    const plusButton = document.getElementById('graphZoomIn');
    const minusButton = document.getElementById('graphZoomOut');
    const resetButton = document.getElementById('graphResetZoom');
    if (fitButton) fitButton.disabled = false;
    if (plusButton) plusButton.disabled = false;
    if (minusButton) minusButton.disabled = false;
    if (resetButton) resetButton.disabled = false;
  }

  relationshipList.hidden = false;
  const heading = document.createElement('h3');
  heading.textContent = `Relationships (${edges.length})`;
  relationshipList.append(heading);
  const list = document.createElement('ol');
  for (const edge of edges) {
    const sourceFault = faultMap.get(edge.causeFaultId);
    const targetFault = faultMap.get(edge.effectFaultId);
    const sourceName = sourceFault?.presentation?.display_name || sourceFault?.display_name || sourceFault?.name || edge.causeFaultId;
    const targetName = targetFault?.presentation?.display_name || targetFault?.display_name || targetFault?.name || edge.effectFaultId;
    const row = document.createElement('li');
    row.textContent = `${sourceName} → ${targetName} (${edge.causeFaultId} to ${edge.effectFaultId})`;
    list.append(row);
  }
  relationshipList.append(list);

  const zoom = Math.max(0.5, Math.min(2, Number(state.zoom) || 1));
  graphCanvas.style.setProperty('--graph-zoom', String(zoom));

  return {
    positions,
    width,
    height,
  };
}

