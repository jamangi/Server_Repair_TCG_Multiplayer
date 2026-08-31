# TASK-056-HIGH: Restore the browser baseline and investigate the tutorial focus flake

## Status

**Ready — authorized 2026-08-31.** This task owns the five reproducible legacy browser-test failures recorded by TASK-047, TASK-048, and TASK-055, plus the single TASK-015 focus failure observed only during TASK-055's concurrent repository sweep.

## Objective

Restore a zero-unexpected-failure repository-wide Playwright baseline by updating obsolete test expectations and deterministic test drivers to the current released content and public legal-intent surface, then investigate and either repair or rigorously close the concurrency-only tutorial focus observation.

Do not change product behavior merely to satisfy an old fixture. A production change is permitted only if a minimized reproduction proves a current player-facing defect independently of the legacy assertion or helper.

## Confirmed baseline

TASK-055's complete four-project audit ran 316 configured cases: 146 passed, 164 were intentionally skipped, and 6 failed under concurrent execution. The focused TASK-055 suite remained green.

Five failures are established legacy test debt rather than TASK-055 regressions:

1. TASK-010's keyboard completion driver assumes every projected Card intent can be reached through either the response-hand pager or the Diagnostic Bench. Its selected intent can belong to neither lookup, so the helper dereferences a missing Bench entry instead of exercising a visible legal control.
2. TASK-012's continuity setup searches at most 30 projected diagnostic/Isolation intents for a held response Card to become legal. The current deterministic three-Ticket fixture can exhaust that arbitrary search without reaching the alternate-target assertion that the test is intended to protect.
3. TASK-014's expanded-coverage test still expects `12 of 12`; current released content correctly presents `12 of 18` supported causal fingerprints for the active deck.
4. TASK-014's no-complete-path preflight test repeats the same obsolete `12 of 12` expectation before replacing the deck.
5. TASK-016's semantic-dialog test uses a fixed title regular expression that excludes the already released **Supply Redundancy Lost** Ticket.

The two TASK-014 cases and the TASK-016 case reproduce with one desktop worker on current `main`. The first two fail on the exact `12 of 12` assertions while the application reports `12 of 18`; the third opens the full Ticket but cannot match its accessible dialog name with the fixed title list. TASK-048's completion record and TASK-055's audit independently record the TASK-010 and TASK-012 failures, and TASK-055 proved they persist when the optional System projection is absent. They therefore predate and are independent of the System Model UI.

The sixth result requires a different classification: one TASK-015 mobile keyboard focus assertion failed only in the concurrent complete sweep and passed immediately when rerun alone during TASK-055. That is evidence of a possible concurrency or timing flake, not yet evidence of a product defect or a permanently broken test.

## Required reading

Read completely before editing:

- `AGENTS.md`, root `README.md`, this task, and `docs/tasks/INDEX.md`;
- completed TASK-010, TASK-012, TASK-014, TASK-015, TASK-016, TASK-047, TASK-048, and TASK-055;
- `docs/system-models/task-055/BROWSER_QA.md` and the relevant completion records that first identify the five legacy failures;
- `playwright.config.mjs` and the complete affected browser specs and their shared helpers; and
- current coverage, deck, Ticket, tutorial, legal-intent, accessibility-name, and public-projection sources used by those assertions.

## Work sequence

### 1. Reproduce and classify before editing

- Run each of the five legacy cases alone with one worker and record its exact project, seed/fixture, assertion or helper failure, and current player-visible state.
- Run the affected files together with the repository's ordinary concurrent worker count to expose cross-file assumptions.
- For every case, decide whether the stale element is an expectation, fixture, navigation driver, or actual product behavior. Preserve a minimized failing regression for any product defect before changing production code.
- Record a compact before/after ledger under `docs/testing/task-056/` that separates product findings from test-only findings. Do not rewrite the historical TASK-055 run totals.

### 2. Repair the five legacy failures

- **TASK-010:** make the keyboard completion driver route a selected legal intent through the actual public UI surface that owns it. The driver must either locate a valid rendered control from public projection data or reject an unsupported helper state with a diagnostic that names the action type, Card instance, Card definition, Ticket, and available UI zones. Do not fabricate a Bench entry, read hidden truth, or bypass the visible keyboard path.
- **TASK-012:** replace the 30-intent hope loop with a deterministic setup for the test's real contract: one held response Card with an explicit legal alternate Ticket target while a different Ticket is displayed. The setup may use a pinned public fixture or a bounded semantic state machine, but must fail diagnostically when its invariant is impossible. Do not merely increase the iteration cap, submit intents through private authority, or weaken the alternate-target/result/focus/scroll assertions.
- **TASK-014:** update both scenarios to the current released 18-fingerprint universe while retaining the meaningful distinction that this legal deck supports 12 unique fingerprints and repetition can begin at Ticket 13. Prefer values derived from the loaded public coverage fixture or explicit named fixture constants over duplicated unexplained literals. Preserve the later zero-compatible-path assertions.
- **TASK-016:** assert that the full-Ticket dialog is named from the currently selected Ticket's visible title. Do not maintain or broaden a hand-written allowlist of possible Ticket-title words; the test should continue to catch a missing or incorrect accessible name as new Ticket titles are added.
- Keep test descriptions aligned with what each repaired case now proves. Do not alter released content, engine authority, legal intents, Action costs, hidden truth, Story state, or accessibility semantics to accommodate legacy helpers.

### 3. Investigate the TASK-015 concurrency-only focus result

- Identify the exact checkpoint, target control, preceding action, expected focus owner, project, and failure message from a retained failing trace or a new reproduction.
- Exercise the exact mobile keyboard case alone, repeated alone, under forced multi-worker pressure, with its affected file peers, and in the complete repository sweep. Record worker count, repetition count, duration, and pass/fail result for each layer.
- Instrument only public DOM state and test lifecycle signals needed to distinguish: focus being stolen by a product re-render; activation occurring before the intended target is stable; focus being lost during dialog/coach replacement; a locator resolving to a replaced node; or host/resource pressure delaying an otherwise correct assertion.
- If a real focus defect reproduces through ordinary player interaction, add a focused failing regression and repair the narrow product lifecycle. If the defect is test-side, make the interaction wait for a semantic ready condition or stable intended target rather than wall-clock time.
- If the flake does not reproduce after the bounded stress matrix, preserve the focus assertion and document the non-reproduction evidence. Do not claim a product fix.

## Anti-flake and authority constraints

- Do not resolve any case by adding retries, marking it flaky, skipping it, forcing the repository suite serial, raising global timeouts, adding arbitrary sleeps, or deleting a meaningful assertion.
- Do not replace exact accessibility, keyboard, continuity, legal-intent, or public-projection checks with generic visibility checks.
- Do not use `force`, direct DOM clicks, private Worker messages, hidden authored outcomes, or engine internals to make a browser journey pass.
- Test diagnostics may expose public fixture identifiers and public projection state, but must not normalize private truth into client expectations.
- The test suite must remain deterministic and dependency-free beyond the repository's existing locked tooling.

## Verification

Run and report, with exact commands, exit codes, pass/fail/skip totals, durations, changed files, and unresolved findings:

1. each of the five repaired cases alone with `--workers=1`;
2. the complete affected TASK-010, TASK-012, TASK-014, TASK-015, and TASK-016 browser files with one worker;
3. the same affected files with four workers;
4. the exact TASK-015 mobile keyboard focus case for at least 10 isolated repetitions and at least 10 forced-concurrency repetitions, retaining a trace on any failure;
5. the complete four-project Playwright suite with `--workers=1` and again with `--workers=4`, both with zero unexpected failures;
6. every focused Node test implicated by any changed helper or production module;
7. the Viewer baseline commands from `AGENTS.md` if any Viewer file changes;
8. staged-asset build and verification if generated Viewer assets change; and
9. `git diff --check`.

A first green run is not sufficient evidence for the concurrency lane. If a production focus repair is required, repeat the exact prior failure surface after the full suite to prove it remains stable under warmed caches and repository load.

## Allowed paths

- `tests/browser/task-010-solo.spec.mjs`;
- `tests/browser/task-012-continuity.spec.mjs`;
- `tests/browser/task-014-playable-coverage.spec.mjs`;
- `tests/browser/task-015-tutorial-reveal.spec.mjs`;
- `tests/browser/task-016-board-layout.spec.mjs`;
- narrowly shared browser helpers or public fixtures used by those files;
- `playwright.config.mjs` only if evidence proves a repository-runner defect and the change does not hide failures;
- a narrowly affected Viewer focus/lifecycle module and focused tests only after a minimized ordinary-interaction reproduction proves a product defect;
- `docs/testing/task-056/`, this task, `docs/tasks/INDEX.md`, root `README.md`, and a successor pointer in the TASK-055 QA record; and
- staged Viewer output only when an authorized production repair requires it.

Do not change gameplay content, Ticket generation, decks, coverage data, Story content, System Model data or UI, frozen rules, schemas, stable IDs, or unrelated tests.

## Approval boundary

No product or design approval is required to restore assertions and test drivers to already released behavior. Stop and record a new approval question before changing any frozen gameplay rule, public data contract, player-facing workflow, or accessibility requirement.

## Completion boundary

Complete only when all five legacy cases test their original meaningful contracts against current released behavior, the TASK-015 observation has a documented root cause or a bounded non-reproduction record, and both serial and four-worker complete browser suites finish with zero unexpected failures without weakening coverage.
