# Spark Task Card — TASK-002 Fault Graph

## Mission

Implement the approved Fault Graph in the existing dependency-free GitHub Pages viewer. Follow `docs/contracts/FAULT_GRAPH_UI_CONTRACT.md` exactly and make all TASK-002 acceptance tests pass without weakening them.

## Read first, in order

1. `AGENTS.md`
2. `docs/contracts/FAULT_GRAPH_UI_CONTRACT.md`
3. `docs/tasks/TASK-002-fault-graph.md`
4. `docs/VIEWER_ARCHITECTURE.md`
5. `viewer/js/app.js`
6. `viewer/js/data-loader.js`
7. `viewer/js/entity-types.js`
8. `viewer/styles.css`
9. `tests/task-002-fault-graph.acceptance.mjs`
10. `tests/viewer-baseline.test.mjs`

## Starting condition

- Existing entity tabs, search, filtering, record dialogs, content loading, manifest generation, and GitHub Pages deployment work.
- `viewer/content/core-v0.1-fault-graph.json` contains causal edge records.
- TASK-001 is complete.
- TASK-002 acceptance tests fail because the Fault Graph model and UI are not implemented yet.

## Required implementation sequence

1. Create `viewer/js/fault-graph-model.js` and implement the public `buildFaultGraphView` contract.
2. Make model traversal bounded, deterministic, deduplicated, and safe for missing references and cycles.
3. Run the TASK-002 acceptance suite; correct the model until all model scenarios pass.
4. Add a Fault Graph entry point without changing the meaning or behavior of existing entity tabs.
5. Add graph-specific query, category, depth, and direction controls whose state is independent of normal list search.
6. Render a dependency-free left-to-right causal graph from the public model output.
7. Add node and edge inspectors, warnings, empty states, selection state, centering, zoom/reset, and the textual relationship-list alternative.
8. Add responsive narrow-layout behavior and keyboard/focus support.
9. Add minimal UI acceptance coverage only where it can assert behavior without coupling tests to private implementation details.
10. Run every verification command and perform the specified human visual checks.

## Files allowed to change

- `viewer/index.html`
- `viewer/styles.css`
- `viewer/js/app.js`
- `viewer/js/data-loader.js` only if causal-edge loading is demonstrably unavailable through the current loader
- `viewer/js/entity-types.js` only if graph-edge registration is required without exposing an unwanted normal tab
- `viewer/js/fault-graph-model.js`
- `viewer/js/fault-graph-view.js`
- `tests/task-002-fault-graph.acceptance.mjs` only to correct a demonstrable test defect; do not weaken requirements
- additional `tests/task-002-*.mjs` files for behavior-focused UI coverage
- `docs/tasks/TASK-002-fault-graph.md` completion notes only

## Do not change

- `viewer/content/*.json`
- stable IDs or domain fields
- JSON schemas
- manifest generation
- deployment workflows
- TASK-001 tests or behavior
- unrelated design documents

## No-speculation stop conditions

Stop and report rather than inventing a solution if:

- current content cannot be loaded without changing its schema;
- an approved requirement contradicts the committed domain data;
- implementation would require a dependency, framework, backend, or build tool;
- a required public interface is ambiguous after reading the contract;
- baseline failures exist before TASK-002 changes.

Do not stop for ordinary implementation choices that the contract intentionally leaves open.

## Verification

Run in this order:

```powershell
node --test tests/viewer-baseline.test.mjs
node --test tests/task-001-validation-protocol-tabs.acceptance.mjs
node --test tests/task-002-fault-graph.acceptance.mjs
node --check viewer/js/app.js
node --check viewer/js/data-loader.js
node --check viewer/js/entity-types.js
node --check viewer/js/fault-graph-model.js
node --check viewer/js/fault-graph-view.js
```

Then serve the viewer:

```powershell
python -m http.server 8080 --directory viewer
```

Human verification at desktop and narrow viewport SHALL cover:

- left-to-right cause/effect direction;
- independent list and graph search state;
- depths 0 through 3 and all three direction modes;
- seed/upstream/downstream/mixed/selected visual distinctions;
- isolated matches;
- node and edge inspectors;
- warning and empty states using controlled fixtures where production content does not naturally produce them;
- keyboard navigation and focus restoration;
- relationship-list equivalence;
- mobile panning, centering, zoom/reset, and bottom-sheet behavior;
- existing viewer tabs and dialogs remaining functional.

## Completion report

Report changed files, tested commit SHA, commands and exit codes, passed/failed/skipped totals, desktop and narrow-view findings, and unresolved requirements or content defects.

Do not claim completion while any required automated check fails.

