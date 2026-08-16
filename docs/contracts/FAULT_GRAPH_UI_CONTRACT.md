# Fault Graph UI Contract

## Status and scope

This contract is approved for TASK-002. It defines the first Fault Graph release in the static Domain Library viewer.

The first release is a query-driven graph of causal Fault relationships only:

```text
Cause Fault -> Effect Fault
```

Symptoms, Components, Tests, Tools, Commands, Repairs, Validations, and Protocols SHALL NOT be graph nodes in this release. Existing Fault details MAY continue to reference related domain records.

## Vocabulary

- **seed**: a Fault that directly matches the active graph query and category filter.
- **upstream**: a Fault that can reach a seed by following one or more `causes` edges.
- **downstream**: a Fault reachable from a seed by following one or more `causes` edges.
- **depth**: shortest edge distance from a seed.
- **visible graph**: the deduplicated nodes and edges admitted by query, filters, traversal, and safety limits.

## Normative requirements

### FG-001 — Causal scope

1. The graph SHALL contain only records whose `entity_type` is `fault` as nodes.
2. The graph SHALL contain only records whose `entity_type` is `fault_causal_edge` and whose `relationship_type` is `causes` as edges.
3. An edge SHALL point from `cause_fault_id` to `effect_fault_id`.
4. The graph SHALL NOT reinterpret another relationship type as causality.

### FG-002 — Direction and layout

1. The primary layout SHALL read left to right: cause on the left and effect on the right.
2. Logical causal rank and sibling ordering SHALL be deterministic for identical input records and view options.
3. Equivalent siblings SHALL be ordered by normalized display name and then stable ID.
4. Layout calculation SHALL NOT use random initial positions.
5. Desktop and mobile coordinates MAY differ, but causal rank and sibling order SHALL remain equivalent.

### FG-003 — Query semantics

1. Graph search SHALL be case-insensitive.
2. A Fault SHALL become a seed when the query matches its display name, stable ID, short description, education text, category/subsystem, or search tags.
3. Edge notes SHALL NOT participate in search for this release.
4. Multiple seed matches SHALL be combined into one deduplicated visible graph.
5. With an empty query, the graph SHALL show the connected Fault-only causal graph, subject to category, direction, depth, and safety limits.

### FG-004 — Context depth and direction

1. The default depth SHALL be `1`.
2. Supported user-selectable depths SHALL be `0`, `1`, `2`, and `3`.
3. Depth SHALL mean edge distance from the nearest seed.
4. The default traversal direction SHALL be `both`.
5. Supported directions SHALL be `both`, `causes`, and `effects`.
6. `causes` SHALL include seeds and upstream nodes only.
7. `effects` SHALL include seeds and downstream nodes only.
8. `both` SHALL include seeds, upstream nodes, and downstream nodes.
9. In `A -> B -> C`, a depth-1, `both` query centered on B SHALL show A, B, and C.

### FG-005 — Filters and state

1. The first release SHALL apply graph query, Fault category/subsystem, depth, and direction controls.
2. Normal list sort and entity-tab state SHALL NOT determine graph positioning.
3. Graph controls SHALL retain state while the user switches between graph and list views during the same page session.
4. Graph search state SHALL be independent from normal Fault-list search state.
5. Graph state SHOULD be representable in the URL using `view`, `q`, `depth`, `direction`, and `category` parameters.

### FG-006 — Node visibility and roles

1. A matching seed SHALL remain visible even when it has no visible causal relationships.
2. With an empty query, isolated Faults SHALL be omitted from the overview.
3. Every visible node SHALL expose whether it is a seed, upstream context, downstream context, or both upstream and downstream context.
4. Seed, upstream, downstream, selected, and mixed-context states SHALL be distinguishable without relying on color alone.
5. Selecting a node SHALL open its existing Fault information without navigating away or resetting graph state.
6. The Fault inspector SHALL offer an action to center the graph on that Fault.

### FG-007 — Edge interaction

1. Every visible edge SHALL be keyboard and pointer selectable.
2. Selecting an edge SHALL show its cause Fault, effect Fault, relationship type, stable edge ID, notes, and source/expansion metadata when present.
3. Selecting an edge SHALL visually identify the edge and both endpoint nodes.
4. Node selection and edge selection SHALL be mutually exclusive in the first release.

### FG-008 — Missing references and invalid content

1. An edge with a missing cause or effect Fault SHALL NOT crash the viewer.
2. The viewer SHALL report missing referenced Fault IDs in an accessible warning.
3. Content validation SHALL reject self-loops and directed cycles in `causes` relationships.
4. If cyclic content reaches the viewer, traversal SHALL terminate through visited-node/edge tracking, depth bounds, and the absolute safety limit.
5. The viewer SHALL render unaffected bounded content and SHALL visibly warn that an invalid causal cycle was detected.
6. Cycle-producing edges SHALL be identifiable in the diagnostic warning and visually marked when rendered.
7. Invalid edges SHALL NOT be silently reinterpreted or silently removed from diagnostics.

### FG-009 — Empty, warning, and error states

The viewer SHALL distinguish:

1. no Fault matches the query;
2. matching Faults exist but are isolated;
3. an edge references a missing Fault;
4. causal content could not be loaded;
5. the visible graph was limited;
6. a causal cycle was detected.

### FG-010 — Capacity limits

1. The viewer SHALL issue a soft warning when the candidate visible graph exceeds 40 nodes.
2. The default rendered graph SHALL be limited to 60 nodes.
3. Traversal SHALL stop at an absolute safety limit of 100 nodes.
4. When limiting is required, seed nodes SHALL be retained first.
5. Remaining capacity SHALL be assigned by nearest graph distance; ties SHALL be resolved by normalized display name and then stable ID.
6. A limited view SHALL tell the user to narrow the query, category, or depth.

### FG-011 — Mobile and responsive behavior

1. Narrow layouts SHALL preserve left-to-right causal meaning.
2. Graph controls SHALL stack without obscuring their labels or values.
3. The graph canvas SHALL support horizontal panning while nodes retain a readable minimum width.
4. Initial narrow-layout focus SHALL center a seed rather than the absolute left edge.
5. Selecting a node or edge on a narrow layout SHALL open a bottom sheet or equivalently usable inspector.
6. The UI SHALL provide center/reset and zoom controls.

### FG-012 — Accessibility

1. Nodes, edges, graph controls, warnings, and inspectors SHALL be keyboard operable.
2. Keyboard focus SHALL be visible.
3. Causal direction and node role SHALL have accessible text, not color-only encoding.
4. The graph SHALL provide an equivalent textual relationship list for the visible graph.
5. Dialog or bottom-sheet focus SHALL be managed and restored on close.
6. Reduced-motion preferences SHALL be honored.

## Public graph-model interface

TASK-002 acceptance tests import `buildFaultGraphView` from `viewer/js/fault-graph-model.js`.

```js
buildFaultGraphView({
  faults,
  edges,
  query,
  category,
  depth,
  direction,
  softLimit,
  hardLimit,
  absoluteLimit,
})
```

It SHALL return a serializable object containing at least:

```js
{
  nodes: [{ id, role, distance, rank, order, fault }],
  edges: [{ id, causeFaultId, effectFaultId, cycle, edge }],
  warnings: [{ code, message, relatedIds }],
  limited: false,
}
```

The implementation MAY use any dependency-free internal data structures. Tests SHALL evaluate returned behavior rather than private names or algorithms.

## Explicit exclusions

- No general knowledge graph.
- No Symptoms as nodes.
- No graph editing.
- No content mutation.
- No backend.
- No framework or graph dependency.
- No gameplay or server-authority work.

