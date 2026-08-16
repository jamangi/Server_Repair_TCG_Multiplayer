const VALID_DIRECTIONS = new Set(['both', 'causes', 'effects']);

const DEFAULT = {
  category: 'all',
  depth: 1,
  direction: 'both',
  softLimit: 40,
  hardLimit: 60,
  absoluteLimit: 100,
  query: '',
};

const toLower = (value) => String(value || '').toLowerCase();
const toLowerTrim = (value) => toLower(value).trim();

const normalizeName = (record) => String(
  record?.presentation?.display_name || record?.display_name || record?.name || record?.id || '',
).toLowerCase().trim();

const matchCategory = (record, category) => {
  if (!category || category === 'all') return true;
  return toLowerTrim(record?.category || record?.subsystem || '') === toLowerTrim(category);
};

const matchQuery = (record, query) => {
  if (!query) return false;
  const sourceTags = Array.isArray(record?.source?.search_tags) ? record.source.search_tags : [];
  const recordTags = Array.isArray(record?.search_tags) ? record.search_tags : [];
  const tags = [...sourceTags, ...recordTags];
  const searchTarget = [
    record?.presentation?.display_name || record?.display_name || record?.name || '',
    record?.id || '',
    record?.presentation?.short_description || '',
    record?.short_description || '',
    record?.education_text || '',
    record?.category || '',
    record?.subsystem || '',
    ...tags,
  ].map(toLower).join('\n');
  return searchTarget.includes(query);
};

const seedWarning = (map, code, message, relatedIds = []) => {
  const existing = map.get(code);
  if (!existing) {
    map.set(code, {code, message, relatedIds: []});
  }
  const entry = map.get(code);
  for (const id of relatedIds) {
    if (!entry.relatedIds.includes(id)) {
      entry.relatedIds.push(id);
    }
  }
};

function detectCycles(nodeIds, edges) {
  const nodeSet = new Set(nodeIds);
  const outgoing = new Map();
  for (const edge of edges) {
    if (!nodeSet.has(edge.cause_fault_id) || !nodeSet.has(edge.effect_fault_id)) {
      continue;
    }
    if (!outgoing.has(edge.cause_fault_id)) {
      outgoing.set(edge.cause_fault_id, []);
    }
    outgoing.get(edge.cause_fault_id).push(edge);
  }
  const cycleEdgeIds = new Set();

  for (const edge of edges) {
    const start = edge.cause_fault_id;
    const target = edge.effect_fault_id;
    const visited = new Set([target]);
    const parentNode = new Map();
    const parentEdge = new Map();
    const queue = [target];
    let found = false;

    while (queue.length) {
      const current = queue.shift();
      if (current === start) {
        found = true;
        break;
      }
      for (const candidate of outgoing.get(current) || []) {
        const next = candidate.effect_fault_id;
        if (visited.has(next)) continue;
        visited.add(next);
        parentNode.set(next, current);
        parentEdge.set(next, candidate.id);
        queue.push(next);
      }
    }

    if (!found) {
      continue;
    }
    cycleEdgeIds.add(edge.id);
    let cursor = start;
    while (cursor && cursor !== target) {
      const parent = parentNode.get(cursor);
      const parentEdgeId = parentEdge.get(cursor);
      if (!parentEdgeId || !parent) break;
      cycleEdgeIds.add(parentEdgeId);
      cursor = parent;
    }
  }

  return cycleEdgeIds;
}

export function buildFaultGraphView({
  faults = [],
  edges = [],
  query = DEFAULT.query,
  category = DEFAULT.category,
  depth = DEFAULT.depth,
  direction = DEFAULT.direction,
  softLimit = DEFAULT.softLimit,
  hardLimit = DEFAULT.hardLimit,
  absoluteLimit = DEFAULT.absoluteLimit,
}) {
  const normalizedQuery = toLowerTrim(query);
  const normalizedDirection = VALID_DIRECTIONS.has(direction) ? direction : DEFAULT.direction;
  const normalizedDepth = Number.isFinite(depth) ? Math.max(0, Math.min(3, Math.floor(depth))) : DEFAULT.depth;
  const normalizedSoft = Number.isFinite(softLimit) ? Math.max(0, Math.floor(softLimit)) : DEFAULT.softLimit;
  const normalizedHard = Number.isFinite(hardLimit)
    ? Math.max(normalizedSoft, Math.floor(hardLimit))
    : DEFAULT.hardLimit;
  const normalizedAbsolute = Number.isFinite(absoluteLimit)
    ? Math.max(normalizedHard, Math.floor(absoluteLimit))
    : DEFAULT.absoluteLimit;

  const warnings = new Map();
  const faultsById = new Map();
  for (const fault of faults) {
    if (!fault?.id || fault.entity_type !== 'fault') continue;
    if (!faultsById.has(fault.id)) {
      faultsById.set(fault.id, fault);
    }
  }

  const validEdgesById = new Map();
  for (const edge of edges) {
    if (
      !edge?.id
      || edge.entity_type !== 'fault_causal_edge'
      || edge.relationship_type !== 'causes'
    ) {
      continue;
    }
    if (edge.cause_fault_id === edge.effect_fault_id) {
      seedWarning(
        warnings,
        'self_loop_fault_causal_edge',
        `self-loop excluded: ${edge.id}`,
        [edge.id, edge.cause_fault_id],
      );
      continue;
    }
    if (!faultsById.has(edge.cause_fault_id) || !faultsById.has(edge.effect_fault_id)) {
      const missing = [edge.cause_fault_id, edge.effect_fault_id].filter((id) => !faultsById.has(id));
      seedWarning(
        warnings,
        'missing_fault_reference',
        `missing fault reference in ${edge.id}`,
        [edge.id, ...missing],
      );
      continue;
    }
    if (!validEdgesById.has(edge.id)) {
      validEdgesById.set(edge.id, edge);
    }
  }

  const validEdges = [...validEdgesById.values()];
  const downstreamByFault = new Map();
  const upstreamByFault = new Map();
  for (const edge of validEdges) {
    if (!downstreamByFault.has(edge.cause_fault_id)) {
      downstreamByFault.set(edge.cause_fault_id, []);
    }
    if (!upstreamByFault.has(edge.effect_fault_id)) {
      upstreamByFault.set(edge.effect_fault_id, []);
    }
    downstreamByFault.get(edge.cause_fault_id).push(edge);
    upstreamByFault.get(edge.effect_fault_id).push(edge);
  }
  const edgeSort = (a, b) => {
    const byCause = a.cause_fault_id.localeCompare(b.cause_fault_id);
    if (byCause !== 0) return byCause;
    const byEffect = a.effect_fault_id.localeCompare(b.effect_fault_id);
    if (byEffect !== 0) return byEffect;
    return a.id.localeCompare(b.id);
  };
  for (const list of downstreamByFault.values()) list.sort(edgeSort);
  for (const list of upstreamByFault.values()) list.sort(edgeSort);

  const seedIds = new Set();
  if (normalizedQuery) {
    for (const fault of faultsById.values()) {
      if (matchCategory(fault, category) && matchQuery(fault, normalizedQuery)) {
        seedIds.add(fault.id);
      }
    }
  } else {
    for (const edge of validEdges) {
      const causeFault = faultsById.get(edge.cause_fault_id);
      const effectFault = faultsById.get(edge.effect_fault_id);
      if (matchCategory(causeFault, category)) {
        seedIds.add(edge.cause_fault_id);
      }
      if (matchCategory(effectFault, category)) {
        seedIds.add(edge.effect_fault_id);
      }
    }
    if (seedIds.size === 0) {
      seedWarning(
        warnings,
        'no_causal_graph_seeds',
        'No connected causal graph matches the current category.',
        [],
      );
    }
  }

  if (normalizedQuery && seedIds.size === 0) {
    seedWarning(warnings, 'no_matching_fault', `No faults match query ${query}`, [query]);
  }

  const nodeStateById = new Map();
  const visibleEdges = new Set();
  let absoluteLimitReached = false;

  const ensureNode = (faultId) => {
    if (nodeStateById.has(faultId)) return nodeStateById.get(faultId);
    const created = {
      id: faultId,
      seed: false,
      upstream: false,
      downstream: false,
      upstreamDistance: Infinity,
      downstreamDistance: Infinity,
      fault: faultsById.get(faultId),
    };
    nodeStateById.set(faultId, created);
    return created;
  };

  for (const seedId of [...seedIds].sort()) {
    if (seedId == null || !faultsById.has(seedId)) continue;
    const state = ensureNode(seedId);
    state.seed = true;
    state.upstreamDistance = 0;
    state.downstreamDistance = 0;
  }

  const expand = (mode) => {
    const queue = [...seedIds]
      .filter((id) => nodeStateById.has(id))
      .map((id) => ({id, distance: 0}));
    const seenByMode = new Map(queue.map((item) => [`${item.id}:${mode}`, 0]));

    while (queue.length) {
      const {id, distance} = queue.shift();
      if (distance >= normalizedDepth) continue;
      const edgesFromCurrent = mode === 'causes'
        ? (upstreamByFault.get(id) || [])
        : (downstreamByFault.get(id) || []);
      for (const edge of edgesFromCurrent) {
        const nextId = mode === 'causes' ? edge.cause_fault_id : edge.effect_fault_id;
        const nextDistance = distance + 1;
        const nextExists = nodeStateById.has(nextId);
        if (!nextExists && nodeStateById.size >= normalizedAbsolute) {
          absoluteLimitReached = true;
          continue;
        }
        const nextState = ensureNode(nextId);

        if (mode === 'causes') {
          nextState.upstream = true;
          if (nextDistance < nextState.upstreamDistance) {
            nextState.upstreamDistance = nextDistance;
          }
        } else {
          nextState.downstream = true;
          if (nextDistance < nextState.downstreamDistance) {
            nextState.downstreamDistance = nextDistance;
          }
        }
        visibleEdges.add(edge.id);

        const nextBest = mode === 'causes' ? nextState.upstreamDistance : nextState.downstreamDistance;
        if (!seenByMode.has(`${nextId}:${mode}`) || nextDistance < seenByMode.get(`${nextId}:${mode}`)) {
          seenByMode.set(`${nextId}:${mode}`, nextDistance);
          queue.push({id: nextId, distance: nextDistance});
        }

        if (normalizedDepth > 0 && !nextState.seed && !queue.some((entry) => entry.id === nextId && entry.distance <= nextDistance)) {
          queue.sort((a, b) => (a.distance - b.distance) || a.id.localeCompare(b.id));
        }
      }
    }
  };

  if (normalizedDirection === 'both' || normalizedDirection === 'causes') expand('causes');
  if (normalizedDirection === 'both' || normalizedDirection === 'effects') expand('effects');

  if (absoluteLimitReached) {
    seedWarning(
      warnings,
      'absolute_graph_limit',
      `Traversal reached absolute node limit of ${normalizedAbsolute}.`,
      [String(normalizedAbsolute)],
    );
  }

  const rawNodes = [...nodeStateById.values()];
  const nodeOrderWeight = (node) => {
    if (normalizedDirection === 'causes') {
      if (node.role === 'upstream') return -1 - node.rank;
      if (node.role === 'seed') return 0;
      if (node.role === 'both') return 0.5;
      return 1 + node.rank;
    }
    if (normalizedDirection === 'effects') {
      if (node.role === 'seed') return 0;
      if (node.role === 'downstream') return 1 + node.rank;
      if (node.role === 'both') return 1 + node.rank;
      return -1 - node.rank;
    }
    if (node.role === 'upstream') return -1 - node.rank;
    if (node.role === 'seed') return 0;
    if (node.role === 'both') return 0.5 + node.rank;
    return 1 + node.rank;
  };
  const nodeComparator = (a, b) => {
    const aWeight = nodeOrderWeight(a);
    const bWeight = nodeOrderWeight(b);
    if (aWeight !== bWeight) return aWeight - bWeight;
    const byName = normalizeName(a.fault).localeCompare(normalizeName(b.fault));
    if (byName !== 0) return byName;
    return a.id.localeCompare(b.id);
  };
  const ranked = rawNodes
    .map((node) => {
      const role = node.seed
        ? 'seed'
        : node.upstream && node.downstream
          ? 'both'
          : node.upstream
            ? 'upstream'
            : 'downstream';
      const distance = node.seed ? 0 : Math.min(node.upstreamDistance, node.downstreamDistance);
      return {
        id: node.id,
        role,
        distance,
        rank: Number.isFinite(distance) ? distance : Number.POSITIVE_INFINITY,
        fault: node.fault,
      };
    })
    .filter((node) => Number.isFinite(node.rank))
    .sort((a, b) => {
      const aWeight = nodeOrderWeight(a);
      const bWeight = nodeOrderWeight(b);
      if (aWeight !== bWeight) return aWeight - bWeight;
      const byName = normalizeName(a.fault).localeCompare(normalizeName(b.fault));
      if (byName !== 0) return byName;
      return a.id.localeCompare(b.id);
    });

  const seedSet = new Set(ranked.filter((node) => node.role === 'seed').map((node) => node.id));

  let limited = false;
  let finalNodes = ranked;
  if (finalNodes.length > normalizedHard) {
    limited = true;
    const seedsOnly = finalNodes.filter((node) => node.role === 'seed');
    const context = finalNodes
      .filter((node) => node.role !== 'seed')
      .sort(nodeComparator);
    finalNodes = [...seedsOnly, ...context].slice(0, normalizedHard);
    seedWarning(
      warnings,
      'graph_limited',
      'Graph was limited to the maximum safe visible node count.',
      finalNodes.map((node) => node.id),
    );
  }
  if (!limited && finalNodes.length > normalizedSoft) {
    seedWarning(
      warnings,
      'graph_soft_limit',
      `Graph candidate size ${finalNodes.length} exceeds soft limit ${normalizedSoft}.`,
      finalNodes.map((node) => node.id),
    );
  }

  const finalNodeIds = new Set(finalNodes.map((node) => node.id));
  const finalEdges = validEdges
    .filter((edge) => visibleEdges.has(edge.id)
      && finalNodeIds.has(edge.cause_fault_id)
      && finalNodeIds.has(edge.effect_fault_id))
    .map((edge) => ({
      id: edge.id,
      causeFaultId: edge.cause_fault_id,
      effectFaultId: edge.effect_fault_id,
      edge,
      cycle: false,
    }))
    .sort((a, b) => {
      const byCause = a.causeFaultId.localeCompare(b.causeFaultId);
      if (byCause !== 0) return byCause;
      const byEffect = a.effectFaultId.localeCompare(b.effectFaultId);
      if (byEffect !== 0) return byEffect;
      return a.id.localeCompare(b.id);
    });

  const cycleEdgeIds = detectCycles(finalNodeIds, finalEdges.map((item) => item.edge));
  if (cycleEdgeIds.size) {
    for (const edge of finalEdges) {
      if (cycleEdgeIds.has(edge.id)) {
        edge.cycle = true;
      }
    }
    seedWarning(
      warnings,
      'causal_cycle',
      'Causal cycle detected in visible graph.',
      [...cycleEdgeIds],
    );
  }

  const nodeList = finalNodes.map((node, index) => ({
    id: node.id,
    role: node.role,
    distance: node.distance,
    rank: node.rank,
    order: index,
    fault: node.fault,
  }));

  if (normalizedQuery && nodeList.length === 0) {
    seedWarning(
      warnings,
      'no_matching_fault_matches_no_edges',
      'Matching faults exist but no causal edges were available.',
      [...seedIds],
    );
  }

  return {
    nodes: nodeList,
    edges: finalEdges,
    warnings: [...warnings.values()],
    limited,
  };
}
