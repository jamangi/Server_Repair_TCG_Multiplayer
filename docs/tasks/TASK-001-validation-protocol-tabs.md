# TASK-001: Validation and Protocol tabs

## Objective

Expose the already-loaded `validation_procedure` and `protocol` records as first-class viewer tabs without changing content, routing, deployment, or the behavior of existing entity types.

## Starting state

- The viewer loads all content packs successfully.
- Validation and Protocol records are visible only through **Everything**.
- The baseline test must pass.
- The TASK-001 acceptance test must fail only because the two entity types and Protocol category field are not registered yet.

## Required behavior

1. Register `validation_procedure` with the display label `Validations`.
2. Register `protocol` with the display label `Protocols`.
3. Preserve the existing tab order, then place `Validations` and `Protocols` immediately before `Everything`.
4. With the current committed content, display these counts:
   - Validations: 13
   - Protocols: 12
   - Everything: 201
5. Both new tabs must reuse existing search, sort, result-count, empty-state, record-card, and detail-dialog behavior.
6. Protocol category filtering must use `protocol_type`.
7. Do not invent a category for Validation records. They may show only `All categories` until the domain model supplies a classification field.
8. Update the viewer introduction so it mentions validations and protocols without removing the existing entity descriptions.

## Files allowed to change

- `viewer/js/entity-types.js`
- `viewer/index.html`
- `tests/task-001-validation-protocol-tabs.acceptance.mjs` only if a test contains a demonstrable defect; do not weaken an assertion to make it pass.

Do not change content JSON, schemas, manifest generation, deployment workflows, styles, the generic renderer, or TASK-002.

## Prohibited work

- No fault graph.
- No new dependencies or framework.
- No backend or executable content format.
- No content-field renaming.
- No visual redesign.

## Verification

Run in this order:

```powershell
node --test tests/viewer-baseline.test.mjs
node --test tests/task-001-validation-protocol-tabs.acceptance.mjs
node --check viewer/js/app.js
node --check viewer/js/data-loader.js
node --check viewer/js/entity-types.js
```

Then serve the viewer over HTTP and verify visually at both desktop and narrow viewport widths:

```powershell
python -m http.server 8080 --directory viewer
```

Visit `http://127.0.0.1:8080/` and verify:

- Both new tabs are visible and selectable.
- Their counts are 13 and 12.
- Search and sort still operate inside each tab.
- Protocol categories are available and filter correctly.
- Opening a Validation and a Protocol record shows their domain fields in the existing detail dialog.
- Existing tabs still render.

## Completion report

Return changed files, commands executed, exit codes, passed/failed/skipped totals, and unresolved items. Do not claim completion if either test command fails.

