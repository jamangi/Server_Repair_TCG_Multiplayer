import assert from "node:assert/strict";
import test from "node:test";

import { buildFaultGraphView } from "../viewer/js/fault-graph-model.js";

function fault(id, overrides = {}) {
  return {
    entity_type: "fault",
    id,
    display_name: id,
    short_description: "",
    education_text: "",
    category: "general",
    subsystem: "",
    search_tags: [],
    ...overrides,
  };
}

function edge(id, causeFaultId, effectFaultId, overrides = {}) {
  return {
    entity_type: "fault_causal_edge",
    id,
    cause_fault_id: causeFaultId,
    effect_fault_id: effectFaultId,
    relationship_type: "causes",
    notes: "",
    ...overrides,
  };
}

function build(overrides = {}) {
  return buildFaultGraphView({
    faults: [],
    edges: [],
    query: "",
    category: "all",
    depth: 1,
    direction: "both",
    softLimit: 40,
    hardLimit: 60,
    absoluteLimit: 100,
    ...overrides,
  });
}

function nodeIds(result) {
  return result.nodes.map((node) => node.id);
}

function edgeIds(result) {
  return result.edges.map((item) => item.id);
}

test("depth-one both traversal centered on B shows A, B, and C with causal roles", () => {
  const result = build({
    faults: [fault("a", { display_name: "Alpha" }), fault("b", { display_name: "Beta" }), fault("c", { display_name: "Charlie" })],
    edges: [edge("ab", "a", "b"), edge("bc", "b", "c")],
    query: "beta",
  });

  assert.deepEqual(nodeIds(result), ["a", "b", "c"]);
  assert.deepEqual(edgeIds(result), ["ab", "bc"]);
  assert.equal(result.nodes.find((node) => node.id === "a").role, "upstream");
  assert.equal(result.nodes.find((node) => node.id === "b").role, "seed");
  assert.equal(result.nodes.find((node) => node.id === "c").role, "downstream");
});

test("depth and direction bound traversal without changing seed inclusion", () => {
  const faults = [fault("a"), fault("b"), fault("c")];
  const edges = [edge("ab", "a", "b"), edge("bc", "b", "c")];

  const upstream = build({ faults, edges, query: "c", direction: "causes", depth: 1 });
  assert.deepEqual(nodeIds(upstream), ["b", "c"]);
  assert.deepEqual(edgeIds(upstream), ["bc"]);

  const seedOnly = build({ faults, edges, query: "b", direction: "both", depth: 0 });
  assert.deepEqual(nodeIds(seedOnly), ["b"]);
  assert.deepEqual(edgeIds(seedOnly), []);
});

test("query searches approved Fault fields case-insensitively but not edge notes", () => {
  const faults = [
    fault("fault-power", { display_name: "Power Loss", short_description: "Unexpected shutdown" }),
    fault("fault-storage", { education_text: "RAID degradation", category: "Storage", search_tags: ["NVMe"] }),
    fault("fault-network", { subsystem: "Packet Fabric" }),
  ];
  const edges = [edge("power-storage", "fault-power", "fault-storage", { notes: "secret-edge-only-phrase" })];

  assert.deepEqual(nodeIds(build({ faults, edges, query: "unexpected", depth: 0 })), ["fault-power"]);
  assert.deepEqual(nodeIds(build({ faults, edges, query: "raid", depth: 0 })), ["fault-storage"]);
  assert.deepEqual(nodeIds(build({ faults, edges, query: "nvme", depth: 0 })), ["fault-storage"]);
  assert.deepEqual(nodeIds(build({ faults, edges, query: "PACKET fabric", depth: 0 })), ["fault-network"]);
  assert.deepEqual(nodeIds(build({ faults, edges, query: "secret-edge-only-phrase", depth: 0 })), []);
});

test("an isolated matching Fault appears while isolated Faults are omitted from empty-query overview", () => {
  const faults = [fault("a"), fault("b"), fault("isolated", { display_name: "Lonely Fault" })];
  const edges = [edge("ab", "a", "b")];

  const match = build({ faults, edges, query: "lonely", depth: 1 });
  assert.deepEqual(nodeIds(match), ["isolated"]);
  assert.deepEqual(edgeIds(match), []);

  const overview = build({ faults, edges, query: "", depth: 3 });
  assert.deepEqual(nodeIds(overview), ["a", "b"]);
});

test("diamond paths deduplicate nodes and produce deterministic rank and order", () => {
  const faults = [
    fault("a", { display_name: "Origin" }),
    fault("b", { display_name: "Beta" }),
    fault("c", { display_name: "Alpha" }),
    fault("d", { display_name: "Destination" }),
  ];
  const edges = [edge("ab", "a", "b"), edge("ac", "a", "c"), edge("bd", "b", "d"), edge("cd", "c", "d")];
  const options = { query: "origin", depth: 2, direction: "effects" };

  const first = build({ faults, edges, ...options });
  const second = build({ faults: [...faults].reverse(), edges: [...edges].reverse(), ...options });

  assert.deepEqual(first, second);
  assert.deepEqual(nodeIds(first), ["a", "c", "b", "d"]);
  assert.equal(new Set(nodeIds(first)).size, first.nodes.length);
  for (const node of first.nodes) {
    assert.equal(Number.isInteger(node.rank), true);
    assert.equal(Number.isInteger(node.order), true);
  }
});

test("missing Fault references are excluded from rendering and reported", () => {
  const result = build({ faults: [fault("a")], edges: [edge("a-missing", "a", "missing")] });

  assert.deepEqual(result.nodes, []);
  assert.deepEqual(result.edges, []);
  const warning = result.warnings.find((item) => item.code === "missing_fault_reference");
  assert.ok(warning);
  assert.deepEqual(warning.relatedIds, ["a-missing", "missing"]);
});

test("cyclic content terminates, remains bounded, and is visibly diagnosable", () => {
  const result = build({
    faults: [fault("a"), fault("b"), fault("c")],
    edges: [edge("ab", "a", "b"), edge("bc", "b", "c"), edge("ca", "c", "a")],
    query: "a",
    depth: 3,
  });

  assert.deepEqual(nodeIds(result), ["a", "b", "c"]);
  assert.equal(result.edges.some((item) => item.cycle === true), true);
  const warning = result.warnings.find((item) => item.code === "causal_cycle");
  assert.ok(warning);
  assert.ok(warning.relatedIds.length > 0);
});

test("capacity limiting retains seeds then nearest deterministic context", () => {
  const faults = Array.from({ length: 8 }, (_, index) => fault(`f${index}`, { display_name: `Fault ${index}` }));
  const edges = faults.slice(1).map((_, index) => edge(`e${index}`, `f${index}`, `f${index + 1}`));
  const result = build({
    faults,
    edges,
    query: "Fault 3",
    depth: 3,
    softLimit: 3,
    hardLimit: 5,
    absoluteLimit: 7,
  });

  assert.equal(result.limited, true);
  assert.equal(result.nodes.length, 5);
  assert.ok(nodeIds(result).includes("f3"));
  assert.ok(result.warnings.some((item) => item.code === "graph_limited"));
});

test("category filtering chooses seeds before causal context expansion", () => {
  const result = build({
    faults: [
      fault("storage", { display_name: "Shared Alert", category: "storage" }),
      fault("network", { display_name: "Shared Alert", category: "network" }),
      fault("effect", { display_name: "Effect", category: "compute" }),
    ],
    edges: [edge("storage-effect", "storage", "effect"), edge("network-effect", "network", "effect")],
    query: "shared alert",
    category: "storage",
    direction: "effects",
    depth: 1,
  });

  assert.deepEqual(nodeIds(result), ["storage", "effect"]);
  assert.deepEqual(edgeIds(result), ["storage-effect"]);
});
