# TASK-013-XHIGH: Synchronize approved post-playtest diagnosis rules

## Status

**Completed — 2026-08-24.** PT-001 D, PT-002 A, PT-003 D, PT-004 A, and PT-005 A were approved by the project owner on 2026-08-24 and are synchronized under `first-version-v2`. `first-version-v1` artifacts remain pinned and reproducible.

## Approved authority

- **PT-001 D:** one globally available playable diagnostic catalog with switchable Relevant/Global Bench Views; relevance is an advisory, public-graph-derived filter available in either view and never a difficulty or Match setting.
- **PT-002 A:** deterministically derive 2–5 public candidates from Symptoms plus component/subsystem/causal context; always include hidden actionable Faults and require every distractor to be plausible and differentiable.
- **PT-003 D:** replace flat citation counting with typed alternative Isolation routes and decisive candidate-specific `CONFIRM`; support direct observation, definitive diagnostics, corroborated support, Evidence-backed elimination, and recovery-derived routes with deterministic validation and contribution attribution.
- **PT-004 A:** retain accepted Isolation as the Repair gateway; do not implement speculative Repair in this revision.
- **PT-005 A:** in solo/training, confirmed Give Up atomically abandons and reveals one Ticket, voids its pending contributions, records the give-up, prevents play on revealed truth, and permits the remaining queue to continue without recording the Match as a solo win.

These choices are V0 successor-rule authority for this task. They do not import the deferred V2 dependency-inference architecture, expand content under PT-006, or pre-implement the tutorial under PT-007.

## Objective

Convert the approved diagnostic-availability, candidate-generation, elimination/Isolation, speculative-Repair, and Give-Up choices into one coherent rules-version migration before content expansion or tutorial scripting depends on them.

This is the semantic task. It updates authority, contracts, engine behavior, projections, policies, and migrations. TASK-014 supplies broad new playable content; TASK-015 supplies the polished tutorial/reveal experience.

## Required reading

Read completely before editing:

- `AGENTS.md`, root `README.md`, this task, `docs/tasks/INDEX.md`, and TASK-009/TASK-010 completion records;
- `docs/design/decisions/{DECISION_INDEX,FROZEN_RULES,UNFROZEN_RULES,APPROVALS}.md`;
- `docs/design/SOLO_PAGES_PROFILE.md`;
- `docs/ui-plan/ui-reference_images/{README.md,relevant_diagnostic_bench.png,global_diagnostic_bench.png}` for information hierarchy and responsive composition only;
- Card/Ticket/Builder domain schemas, all runtime schemas, and their schema notes;
- every file under `src/engine/` and `src/builder/`;
- the playable catalogs, templates, decks, examples, engine/Builder tests, automated policies, and solo Worker/projection adapter; and
- only the gameplay portions of candidate flows needed to identify synchronized examples. Candidate behavior remains non-authoritative.

## Decision record and versioning

- Record the exact approved PT-001 through PT-005 options at the top of this task before implementation.
- Create an explicit successor rules version; do not mutate persisted `first-version-v1` behavior while continuing to label it `first-version-v1`.
- Update `FROZEN_RULES.md` with normative behavior and rationale, then remove `PRESSURE-005` through `PRESSURE-008` from `UNFROZEN_RULES.md` only after every affected surface is synchronized.
- Update `DECISION_INDEX.md`, `APPROVALS.md`, presets/profiles, examples, tests, and release/migration notes.
- Existing TASK-009 reports/replays and `solo-pages-v1` saves remain pinned to their recorded versions. Define whether local deck/profile/statistic records migrate, coexist, or fail with an actionable compatibility message.

## Semantic requirements

Implement only the approved choices, but the synchronized result must explicitly define:

### Diagnostic availability

- which Test/Command definitions are offered, how relevance is derived, their runtime placement/zone, whether they occupy the 30-card response deck, and how existing decks migrate;
- under approved PT-001 D, one authoritative globally available playable diagnostic catalog plus switchable `RELEVANT`/`GLOBAL` local Bench Views over identical legal intents;
- default/preferred view persistence and export, mid-Match switching, filter/sort/page continuity, and proof that view changes do not mutate Match state, replay provenance, legality, scoring, or statistics;
- public-context-only relevance membership and player-safe `Why relevant?` relationship paths, plus an explicit incomplete-graph disclaimer and the same optional Relevant filter inside Global view;
- Action costs, repetition rules, disposition, Documentation behavior, statistics, visibility, and Search/Refresh interaction;
- how every offered diagnostic obtains exactly one deterministic typed Evidence outcome for the current Ticket target and machine revision; and
- how irrelevant, clean, inconclusive, support, contradiction, rule-out, and confirmation results differ without exposing hidden truth prematurely.

### No-silent-action invariant

- Every accepted Test/Command must produce Evidence even when it reports clean, negative, unrelated, or inconclusive findings. Define whether an outcome has no candidate effects or changes one or more assessments, and always include a player-comprehensible observation.
- Every other accepted resource-spending action must emit a typed result event. The authoritative result/projection must identify the target, payment/disposition, and outcome; clients may not infer these from local animation.
- A `RESOLVED` response with payment but no player-visible result is invalid. Rejections remain pre-payment and must explicitly project zero cost.
- Cross-Ticket results must remain persistently discoverable after rerender. Synchronize event/projection fields needed by the Viewer without exposing hidden truth.

### Functional Bench UI boundary

Under approved PT-001 D, TASK-013 must ship a usable first implementation rather than contracts with no play surface:

- Settings may remember the preferred Bench View, and the active board exposes an immediate Relevant/Global switch. It explains focused versus complete catalog organization without presenting either as a difficulty mode.
- Relevant mode presents the public-context-filtered diagnostics as a compact shelf/tray with Test/Command filtering and a visible relevant-count explanation.
- Global mode presents the full playable catalog with search, All/Test/Command filters, subsystem/category and optional Relevant filtering, deterministic sort, bounded pagination, result count, `Why relevant?` explanations, and preserved selection/filter state.
- Both modes feed one selected-diagnostic/legal-action surface that shows the target Ticket, type, Action cost, Inspect affordance, and Run confirmation without internal scrolling at ordinary desktop reference sizes.
- Diagnostics are visually and semantically separate from the private Repair/Verify response hand. Keyboard, touch, screen-reader, narrow-screen, reduced-motion, and no-JavaScript-failure behavior remain explicit.

Use the two diagnostic-bench mockups as hierarchy references. Do not copy incidental counts, Ticket text, diagnostic legality, or hidden-information assumptions from their pixels. TASK-016 owns the later whole-board density/polish pass after representative content exists.

### Candidates, Hypotheses, and elimination

- deterministic candidate derivation, hidden-Fault inclusion, distractor validity, min/max count, causal/subsystem filtering, and Builder failure diagnostics;
- the difference among a public Candidate, a private/team Hypothesis marker, an Evidence disposition, an elimination record, and authoritative hidden truth;
- exact normative meanings for `SUPPORT`, `CONTRADICT`, `RULE_OUT`, `CONFIRM`, and `INCONCLUSIVE`, including the rule that candidate-specific `CONFIRM` independently satisfies a positive route for that candidate under its authored target/state conditions;
- elimination action cost, visibility, citation requirements, reversibility, chronology, statistics, and stale-evidence behavior after Repair/failed Verify; and
- the exact accepted-Isolation predicate for every approved alternative route, including generic rejected responses that do not disclose which prerequisite failed.

### Alternative Isolation routes and attribution

- Replace or explicitly migrate the flat `eligible_outcome_ids` plus `minimum_citations` model with typed versioned alternative routes capable of direct observation, definitive diagnostic, corroborated support, elimination, and recovery-derived paths.
- Define AND/OR/threshold semantics without a loose expression language or UI-evaluated rule bag. Route IDs, eligible dispositions/outcomes, target/state scope, and required visibility/revision must be schema-valid and deterministic.
- A direct visual observation may be decisive. Do not require unrelated diagnostics after the player has authored Evidence that literally observes the active actionable fault.
- If an outcome is labeled candidate-specific `CONFIRM`, a valid Commit citing it must not fail merely because an unrelated citation count was not met. If corroboration is required, migrate the outcome to `SUPPORT` and author the corroborated route honestly.
- Permit several validated routes to the same Fault so different Players can contribute different Evidence sequences. Define how team/public Evidence combines, which Player owns the accepted Isolation event, and how all contributing Evidence remains attributable.
- Allow only one accepted Isolation contribution slot for the same active Fault/stage. Subsequent attempts after it is isolated follow ordinary timing/idempotency behavior; later newly actionable causal stages may create new Isolation work.
- Distinguish a confirmed non-actionable effect/condition from an active actionable Fault so `CONFIRM` does not automatically create an invalid Repair gateway.
- Preserve the privacy purpose of `ISOLATION_NOT_SUPPORTED`, while making Evidence-strength terminology and pre-commit education clear enough that a decisive `CONFIRM` cannot appear to be arbitrarily rejected.

### Repair gateway

- whether accepted Isolation remains mandatory;
- if speculative Repair is approved, its eligibility threshold, payment, Card disposition, machine-state behavior, generic information response, contribution/scoring eligibility, repeated-attempt rule, statistics, progress classification, and protection against hidden-answer probing; and
- how failed Verify interacts with any new elimination or speculative history.

### Give Up / solution reveal

- the authoritative intent, confirmation boundary, Ticket/Match lifecycle transition, pending contribution settlement, queue reconciliation, result classification, profile statistics, and replay event;
- the exact post-transition reveal projection, including hidden Fault/causal path, required Evidence, eligible Repair, and Verify/closure path;
- why no active play can resume on revealed truth; and
- solo/training scope. Do not accidentally expose this intent or truth projection to competitive/public multiplayer.

## Contract and engine work

- Prefer new discriminated event/action variants and typed state over extension bags or UI-only flags.
- Keep clients intent-only. The engine/Worker decides relevance, elimination validity, Isolation, Repair, abandonment, reveal, payment, and statistics.
- Update Card placement/state schemas if an approved diagnostic bench creates a new zone; keep Card Instances server/Worker-owned.
- Treat Bench View as local presentation state, not Match configuration, account Equipment, collectible ownership, technician power, a readiness/loadout snapshot, or an input to authoritative policies.
- Update Ticket, Knowledge State, Player, Match result, public/private projection, action request/result, and event schemas only where the approved semantics require it.
- Version/migrate every persisted Ticket whose disposition labels and Isolation routes disagree; do not reinterpret old `first-version-v1` replays under new `CONFIRM` semantics.
- Extend Builder solvability so its proof matches every newly legal success path and rejects content that merely looks playable.
- Update seat-safe automated policies without granting hidden truth.
- Preserve deterministic hashing, canonical order, replay identity, rejection immutability, and complete-or-none Builder behavior.

## Validation

Add focused tests for every approved route and rejected boundary, including:

- deterministic diagnostic availability and outcomes across machine revisions;
- identical legal intents and deterministic outcomes before/after switching; complete Global membership; public-context-only Relevant membership/explanations; no hidden-truth inference; and no Match/replay/statistic mutation from view/filter state;
- every accepted paid action producing exactly one persistently projectable result, including diagnostics with no candidate effect and cross-Ticket targets;
- no Action/Card/token payment on rejected intents and no paid `RESOLVED` result without visible feedback;
- no hidden truth in ordinary projections or timing;
- candidate derivation always including truth and only valid distractors;
- disposition semantics and every typed route kind, including alternate routes to the same Fault and multi-Player Evidence contribution;
- `One Member Down`: Drive Health's decisive Failed SAS Drive `CONFIRM` succeeds as a one-citation positive route, or a deliberately revised `SUPPORT` fixture proves the newly authored corroborated route instead—never the current contradictory labeling/count combination;
- direct visual `CONFIRM`, corroborated `SUPPORT`, complete `RULE_OUT` elimination, insufficient `CONTRADICT`, recovery-derived Evidence, confirmed non-actionable condition, and stale/wrong-target negative cases;
- valid/invalid/stale elimination citations and visibility;
- every accepted-Isolation route and generic rejection;
- speculative-Repair thresholds/failure privacy if approved;
- Give Up atomicity, contribution treatment, reveal scope, queue/terminal results, and exactly-once statistics;
- legacy rules/profile replay preservation and local-data migration behavior; and
- seat-safe computer decisions and deterministic automated games.

Run and report all repository tests, schema/example validation, automated-game verification plus a new migration/behavior campaign, staged Viewer verification, browser smoke coverage, and `git diff --check`.

## Allowed paths after approval

- `docs/design/decisions/**`
- `docs/design/SOLO_PAGES_PROFILE.md` or an explicitly versioned successor
- affected foundational design/schema notes and release/migration documentation
- `schemas/**`
- `examples/**`
- `src/engine/**`
- `src/builder/**`
- `src/simulation/**`
- `content/gameplay-v1/**` only for minimal migration fixtures; broad content belongs to TASK-014
- `viewer/js/play/**` and required staged contracts/adapters
- the two approved diagnostic-bench references may be read but not altered; broader visual-density planning belongs to TASK-016
- `automated_games/**`
- `tests/**`
- staging scripts/manifests generated from changed canonical sources
- `docs/tasks/INDEX.md`
- this task file

Do not add broad new Ticket/Card content, tutorial presentation, illustrations, SLA/round limits, multiplayer reveal, or unrelated balance changes.

## Completion boundary

Complete only when all approved PT-001 through PT-005 decisions have one versioned normative interpretation; rules, schemas, engine, Builder proof, projections, policies, examples, migration behavior, solo adapter, and tests agree; old pinned artifacts remain reproducible; the corresponding Unfrozen pressures are removed; and no content/tutorial task must guess what the new diagnosis loop means.

## Completion record — 2026-08-24

### Outcome

- Added the explicit `first-version-v2` successor contract. Six persistent diagnostics occupy a Worker-owned `diagnostic_bench` rather than the 30-card response deck; Relevant and Global are local views over identical legal intents. Relevance and player-safe explanations derive only from public graph context, and the functional board includes the approved filters, search, sort, pagination, selection, costs, disclaimer, keyboard/touch behavior, and preferred-view persistence.
- The Builder now deterministically derives two to five publicly plausible Candidates, retains hidden actionable Faults, requires differentiable distractors, completes exactly one typed diagnostic outcome per source and reachable machine state, and fails complete-or-none with structured diagnostics. Generated template provenance receives the same v2 disposition migration as fixed Tickets.
- Replaced flat Isolation counting in v2 with typed direct-observation, definitive-diagnostic, corroborated-support, Evidence-backed-elimination, and recovery-derived routes. Candidate-specific `CONFIRM`, team-visible contributor attribution, reversible/stage-bound `RULE_OUT`, generic unsupported responses, stale-revision handling, and the accepted-Isolation Repair gate are engine-authoritative and schema-valid.
- Every accepted diagnostic creates player-visible Evidence, including clean, irrelevant, and no-effect results. Accepted resource-spending results carry authoritative target, payment/disposition, and outcome summaries; cross-Ticket diagnostic and Repair results remain reachable after rerender.
- Added solo/training `GIVE_UP_TICKET`: confirmation atomically abandons and archives one Ticket, voids pending contributions, records exactly-once statistics, privately reveals the complete solution, prevents resumed play on revealed truth, reconciles the queue, and never records a solo win. Competitive/public views receive neither the intent nor the reveal.
- Published the v2 solo/profile contract and migration note. `solo-pages-v1` storage and TASK-009 replay artifacts coexist unchanged; v2 uses a distinct storage key, response deck, schemas, statistics, campaign, staged assets, and actionable compatibility notice rather than implicit migration.

### Verification

| Command | Exit | Result |
| --- | ---: | --- |
| `node --check viewer/js/app.js`; `node --check viewer/js/data-loader.js`; `node --check viewer/js/entity-types.js` | 0 | baseline Viewer syntax passed |
| `node --test tests/viewer-baseline.test.mjs` | 0 | 3 passed, 0 failed |
| `node --check` on the changed Builder, engine, simulation, Worker, session, and Play page modules | 0 | successor modules passed syntax checks |
| `node --test --test-reporter=spec tests/*.test.mjs` | 0 | 110 passed, 0 failed, 0 skipped |
| `node --test tests/task-007-schema-contracts.test.mjs` | 0 | 21 schema, example, semantic, and reference checks passed |
| `node viewer/scripts/build-play-assets.mjs`; `node viewer/scripts/verify-play-assets.mjs` | 0 | 34 deterministic Play assets staged and verified |
| `node tools/run-automated-games.mjs --verify-report automated_games/task-009-foundation-v1` | 0 | 22 legacy rows verified; 12 successes, 10 retained exceptions, 0 deterministic mismatches |
| `node --test tests/task-013-automated-campaign.test.mjs` | 0 | 4/4 v2 campaign runs succeeded and reproduced; 0 exceptions, rejections, or deterministic mismatches |
| `.\\node_modules\\.bin\\playwright.CMD test tests/browser/task-010-solo.spec.mjs tests/browser/task-012-continuity.spec.mjs tests/browser/task-013-diagnostic-bench.spec.mjs` | 0 | 20 passed, 0 failed, 28 intentional project skips across desktop, tablet, mobile, and reduced-motion projects |
| `git diff --check` | 0 | no whitespace errors |

### Changed-file inventory

Changes stay within the task allowlist: versioned decision/profile/migration and schema notes; domain, runtime, and client schemas/examples; the focused gameplay migration fixture; Builder, engine, projection, policy, and simulation modules; the four-file TASK-013 automated campaign; canonical and generated Play modules/assets; the functional Bench/profile/settings surfaces; browser and Node regression suites; this completion record; and `docs/tasks/INDEX.md`.

### Unresolved items

None. TASK-014 may now expand content against one settled diagnosis contract. TASK-015 and TASK-016 retain their own approved presentation/tutorial scope; no PT-006 or PT-007 work was started here.
