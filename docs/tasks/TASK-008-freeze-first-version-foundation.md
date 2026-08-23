# TASK-008 — Freeze the first-version foundation

Status: **Completed — 2026-08-23**

## Objective

Apply the user's 2026-08-23 approval of every recommendation in `UNFROZEN_RULES.md`: resolve all 89 open items, remove all four frozen-rule pressures, leave the unfrozen ledger empty, synchronize affected normative and explanatory artifacts, verify the repository, and push the completed work to `main`.

## Approved authority

- Adopt every “Freeze now,” “Adjust, then freeze,” “Defer outside first version,” and “Remove from rule ledger” disposition in the reviewed matrix.
- `SCORE-001`: use closure-settled, one-point unique Isolation and necessary-Repair slots for required actionable Fault instances; Root Cause is statistical only.
- `GEN-001`: randomness is deterministic—identical configuration, content version, generator version, and seed produce identical Ticket snapshots.
- Adopt the proposed terminal, departure-cleanup, Room-lifecycle, and all four pressure resolutions.

## Required work

1. Promote all approved rules and first-version exclusions into `FROZEN_RULES.md` without leaving contradictory open wording there.
2. Reduce `UNFROZEN_RULES.md` to an explicit empty-state ledger and update `DECISION_INDEX.md`.
3. Update current design, schema-note, schema-description, preset, story, and candidate-flow wording that still calls `SCORE-001`, `GEN-001`, terminal policy, Room lifecycle, or a resolved pressure open.
4. Remove obsolete Root Cause reward state from runtime contracts and examples.
5. Keep individual content balance, UI layout, deployment caps, moderation, and other accepted non-rule work outside the rule ledger.
6. Preserve completed-task history as historical context unless a live link or current-status statement needs correction.
7. Preserve the unrelated untracked root research draft.

## Allowed paths

- `README.md`
- `docs/design/**`
- `docs/schema-notes/**`
- `docs/candidate_flows/**`
- `docs/story/**`
- `docs/case_studies/v0.1/candidate_materials/decision-observations.md`
- `docs/tasks/INDEX.md`
- `docs/tasks/TASK-008-freeze-first-version-foundation.md`
- `schemas/domain/**`
- `schemas/runtime/**`
- `examples/domain/**`
- `examples/runtime/**`
- `tests/task-007-document-sync.test.mjs`
- `tests/task-007-schema-contracts.test.mjs`
- `tests/helpers/task-007-semantics.mjs`

Do not change `viewer/`, application code, or the untracked domain-expansion draft.

## Verification

Run:

```powershell
node --check tests/helpers/task-007-semantics.mjs
node --check tests/task-007-schema-contracts.test.mjs
node --check tests/task-007-document-sync.test.mjs
node --test tests/*.mjs
git diff --check
```

Also verify:

- the decision directory contains only the index plus Frozen and Unfrozen ledgers;
- the unfrozen ledger contains no active rule;
- current non-task sources no longer describe `SCORE-001`, `GEN-001`, the four pressures, terminal policy, departure cleanup, or Room lifecycle as unresolved;
- all changed JSON parses and every schema/fixture test passes;
- only allowed paths are committed; and
- `main` and `origin/main` point to the completed commit.

## Completion record

- Promoted all 89 reviewed open items and the approved adjustments into `FROZEN_RULES.md`; resolved `PRESSURE-001` through `PRESSURE-004`; left `UNFROZEN_RULES.md` explicitly empty.
- Froze closure-settled one-point Isolation and necessary-Repair slots per required actionable Fault, with no Root Cause bonus and no Service Point for closure itself.
- Froze deterministic Ticket Builder behavior: identical configuration, content version, generator version, and seed produce identical Ticket snapshots; each content version pins an immutable authored input set.
- Froze terminal precedence/results, cooperative and competitive departure cleanup, Room lifecycle/roles, first-seat selection, base Search, configuration boundaries, computer-player scope, result statistics, and explicit first-version exclusions.
- Removed obsolete Root Cause reward state and generic scoring hooks from runtime contracts. Updated result/configuration contracts, public/private projections, examples, design guidance, story/application candidates, and the candidate-flow package.
- Corrected the two-Fault RAID replay to settle four causal points, making the cooperative example total 8 while preserving the competitive example's 3–3 result.
- Verified all changed JSON, 227 local Markdown paths, 52 fragments, schema/fixture semantics, replay ledgers, and viewer baselines. The full test run passed 30 of 30 tests; all required syntax checks and `git diff --check` passed.
- Changed 40 in-scope tracked/new files. Preserved `SERVER-REPAIR-DOMAIN-EXPANSION-DRAFT-2026-08-23.txt` as an unrelated untracked file.
- No unresolved first-version rule, pressure, contradiction, or synchronization blocker remains.
