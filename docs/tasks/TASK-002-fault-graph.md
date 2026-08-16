# TASK-002: Fault graph

## Status

Ready for Spark. TASK-001 is complete and this task is now independently implementable.

## Objective

Add a query-driven, dependency-free Fault-to-Fault causal graph to the existing static viewer. Preserve all existing list views and dialogs.

## Normative contract

Every `SHALL` in [`../contracts/FAULT_GRAPH_UI_CONTRACT.md`](../contracts/FAULT_GRAPH_UI_CONTRACT.md) is part of this task. If this task card and that contract differ, the contract governs.

## Required behavior

1. Build the graph exclusively from Fault records and `causes` Fault causal edges.
2. Implement the public `buildFaultGraphView` interface documented in the contract.
3. Make search, traversal direction, depth, category filtering, ordering, diagnostics, and capacity limiting deterministic.
4. Add a graph view with independent controls, left-to-right causal meaning, selectable nodes and edges, inspectors, warnings, empty states, and a textual relationship equivalent.
5. Preserve usability on narrow screens and for keyboard and reduced-motion users.
6. Do not modify domain content, schemas, stable IDs, manifest generation, or deployment architecture.

## Acceptance

- `tests/task-002-fault-graph.acceptance.mjs` SHALL pass unchanged except to correct a demonstrable defect in the test itself.
- All pre-existing viewer and TASK-001 tests SHALL continue to pass.
- The desktop and narrow-viewport checks in [`TASK-002-SPARK-CARD.md`](TASK-002-SPARK-CARD.md) SHALL be completed.
- No required warning, accessibility path, or capacity boundary may be deferred without being reported as an incomplete requirement.

## Builder handoff

Use [`TASK-002-SPARK-CARD.md`](TASK-002-SPARK-CARD.md) as the imperative execution sequence. It constrains files, verification, and stop conditions without replacing the normative contract.
