# TASK-003: Remove duplicate sample content packs

## Archive status

Completed on 2026-08-18. This contract is retained as implementation history and is not an active task.

## Objective

Make the `core-v0.1-*` packs the single authoritative viewer dataset by removing three obsolete sample packs whose 12 records reused stable core entity IDs with conflicting definitions.

## Starting state

- `viewer/content/manifest.json` loaded 10 JSON packs and 201 records.
- The core packs contained 189 unique records.
- `hardware.sample.json`, `diagnostics-and-repairs.sample.json`, and `faults-and-symptoms.sample.json` contained 12 records.
- Every sample record duplicated a stable ID from a core pack, and none of the duplicate definitions was structurally identical to its core definition.
- No living file outside the generated manifest referenced a sample-pack filename.

## Required behavior

1. Delete the three obsolete sample packs rather than merge or rename their conflicting definitions.
2. Preserve every `core-v0.1-*` entity and stable ID unchanged.
3. Regenerate `viewer/content/manifest.json` with `viewer/scripts/build-manifest.mjs`; do not hand-edit it.
4. Make the baseline content test reject duplicate entity IDs across all manifest-loaded packs.
5. Update the completed viewer acceptance test's total record count from 201 to 189 without changing its feature assertions.
6. Leave schemas, viewer behavior, styles, and older archived task contracts unchanged.

## Files allowed to change

- `viewer/content/hardware.sample.json` (delete)
- `viewer/content/diagnostics-and-repairs.sample.json` (delete)
- `viewer/content/faults-and-symptoms.sample.json` (delete)
- `viewer/content/manifest.json` (generated)
- `tests/viewer-baseline.test.mjs`
- `tests/task-001-validation-protocol-tabs.acceptance.mjs`
- `docs/tasks/INDEX.md`
- `docs/tasks/TASK-003-remove-duplicate-sample-packs.md`
- `docs/archive/viewer-tasks/TASK-003-remove-duplicate-sample-packs.md`

## Prohibited work

- Do not rename, rewrite, or migrate stable core entity IDs.
- Do not merge sample fields into core definitions.
- Do not change domain schemas or introduce new entity types.
- Do not change viewer rendering or add runtime deduplication.
- Do not begin case-study research or create case-study artifacts in this task.

## Verification

The following commands completed successfully with exit code 0:

```powershell
node viewer/scripts/build-manifest.mjs
node --check viewer/js/app.js
node --check viewer/js/data-loader.js
node --check viewer/js/entity-types.js
node --test tests/viewer-baseline.test.mjs
node --test tests/task-001-validation-protocol-tabs.acceptance.mjs
```

Test totals:

- viewer baseline: 3 passed, 0 failed, 0 skipped;
- validation/protocol acceptance: 3 passed, 0 failed, 0 skipped.

Final content audit:

- 7 manifest packs;
- 189 records and 189 unique entity IDs;
- 0 duplicate IDs;
- 26 symptoms, all with at least one associated Fault;
- 77 symptom–fault associations;
- 0 missing Fault references.

## Unresolved items

None within this task.
