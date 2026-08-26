# TASK-022-XHIGH: Allow paid redundant diagnostic repeats

## Status

**Proposed rule implementation — blocked on PT-008 A.** Do not begin implementation until the project owner approves PT-008 A. If PT-008 B is approved, close this task without implementation. If PT-008 C is approved, revise this contract before activation because C does not create duplicate Evidence.

## Objective

Permit a deliberate new Test or Command action to repeat an equivalent deterministic diagnostic against the same target and unchanged machine revision. Spend its ordinary cost, preserve an immutable player-visible result, and identify it as a reproduction of canonical prior Evidence without allowing it to create knowledge, Isolation, elimination, score, or contribution progress.

This is a semantic rule/schema/engine change, not merely a re-enabled button. Preserve strict request idempotency, selected-Ticket targeting, hidden-information safety, deterministic replay, and anti-loop behavior.

## Required reading

Read completely before editing:

- `AGENTS.md`, root `README.md`, this task, `docs/tasks/INDEX.md`, TASK-009, completed TASK-012 through TASK-014, TASK-020, pending TASK-021, and queued TASK-015;
- PT-008 in `docs/design/decisions/APPROVALS.md`, `PRESSURE-010` in `docs/design/decisions/UNFROZEN_RULES.md`, and Frozen Rules §§3, 5, 8, 11–14, 17–20;
- domain/runtime/client schemas for action requests, game events, Ticket/Knowledge State, private projections, rules profiles, match results, and aggregate statistics;
- canonical and staged engine request handling, diagnostic resolution, projections, Evidence reducers, Isolation/elimination citation validation, Worklog publication, scoring, and replay/invariant checks;
- automated-game policies/reporting and current same-state, zero-Action, Evidence, Isolation, documentation, and deterministic-replay tests; and
- Viewer Bench selection, Legal Action, Evidence, Worklog, result continuity, and accessibility/browser tests.

## Terminology and authoritative identity

- An **equivalent diagnostic execution** has the same diagnostic source definition, authoritative target, machine revision, and any versioned execution-condition key supported by the active rules profile.
- The first accepted execution in that equivalence class creates the **canonical Evidence** result.
- A later deliberate new request in that class creates a **redundant reproduction** linked to that canonical result.
- A changed authoritative target, machine revision, or execution-condition key starts a new equivalence class and may create fresh canonical Evidence.
- An exact retry with the same request/idempotency key is not a gameplay repeat. It returns the original response without another charge, action record, event, history entry, or statistic.

Do not use display names, Ticket position, DOM state, timestamps, or hidden truth to derive equivalence. Define one deterministic server-owned equivalence/lineage key or an equivalent typed comparison and use it consistently in resolution, projections, reducers, and tests.

## Frozen-rule synchronization

After PT-008 A approval and before implementation, synchronize the approved behavior into `FROZEN_RULES.md` and remove `PRESSURE-010` from `UNFROZEN_RULES.md`. Preserve PT-008's rejected alternatives as decision provenance in `APPROVALS.md`.

The synchronized rules must say:

- a deliberate equivalent repeat is legal when ordinary timing, targeting, cost, and anti-loop requirements are met;
- it spends the printed cost and creates exactly one typed redundant result;
- it does not change machine state or authoritative candidate/knowledge assessment;
- canonical Evidence alone is eligible for Isolation, elimination, documentation contribution, scoring, and distinct-outcome/corroboration counting;
- repeat work is retained in Worklog/statistics rather than silently discarded; and
- changed state/target/conditions produce fresh Evidence, while same-idempotency-key transport retries do not repeat play.

## Runtime and schema contract

Represent reproduction status explicitly in versioned authoritative and player-safe data. The smallest coherent contract should include:

- a new result event or an extended `EVIDENCE_CREATED` payload that identifies the result as redundant and references the canonical `evidence_event_id`;
- enough typed lineage in Ticket diagnostic history to distinguish canonical and redundant executions without scanning prose;
- a player-safe projection that may show the canonical Evidence number and reproduced public observation without exposing hidden outcome data;
- an authoritative non-eligibility discriminator used by citation/scoring reducers rather than trusting the client; and
- migration/default behavior under which existing Evidence/history is canonical and existing saved matches remain valid, or an explicit rules/profile version boundary if compatible migration is unsafe.

Do not duplicate or mutate the canonical Evidence event. Do not invent a second authored outcome. A redundant reproduction may repeat the public observation for comprehension, but it must not apply candidate effects again. Schema validation must reject self-links, cross-Ticket links, forward links, missing canonical events, incompatible lineage keys, and duplicate events incorrectly marked eligible.

## Engine behavior

- Stop suppressing equivalent same-state diagnostic intents solely because their authored outcome already appears in history.
- Resolve the first execution normally. Resolve each later deliberate equivalent execution atomically as redundant: validate, spend cost, append one action/result/history record, update redundant-work statistics, and return an explicit player-safe summary.
- Preserve the existing per-name-per-turn restriction for zero-Action diagnostics so a legal repeat cannot create an infinite action/event loop.
- Preserve stale-revision, target, turn, resource, and content validation. Rejected requests spend nothing and create no result.
- Make canonical-result lookup deterministic when more than one reproduction exists: every duplicate points to the first canonical result, never to the most recent duplicate.
- Keep Tests and Commands non-mutating under the V0 contract. This task does not claim that every real-world diagnostic is physically side-effect-free or add V2 test conditions/topology inference.

## No Evidence farming

A redundant reproduction must not:

- be accepted as an Isolation or elimination citation;
- count toward `minimum_distinct_outcomes`, corroborated support, direct observation, successful Verify, or any other proof threshold;
- upgrade/downgrade a candidate assessment or add a second supporting Evidence identity;
- fill a Documentation or contribution slot already represented by its canonical result;
- award Service Points, contributor credit, or another once-only reward; or
- allow a Player or bot to avoid stalemate/turn-cap policy by repeatedly selecting known-redundant work.

Prefer one central eligibility predicate shared by Isolation, elimination, scoring, documentation, and solvability/replay checks. Do not scatter special-case `duplicate` exclusions across individual route types.

## Viewer behavior

- A previously run diagnostic remains runnable on the displayed Ticket when the Player can pay its cost. Label the confirmation or selected-detail state so the Player knows the result will be a paid reproduction, not new isolation progress.
- Before submission, state the cost and identify the canonical Evidence number when authorized. Do not reveal the result text before the repeat is accepted unless it is already visible to that Player.
- After resolution, keep the selected Ticket and new result visible. Evidence/Worklog should say that the prior result was reproduced and link/focus the canonical Evidence entry.
- Never use TASK-012's private-response alternate-Ticket fallback for a persistent Bench diagnostic. TASK-021 completes selected-Ticket scope after this semantic change.
- Maintain keyboard, touch, drag/drop, focus, reduced-motion, responsive, and screen-reader parity.

## Automated policy and statistics

- Record each accepted reproduction in `redundant_or_superseded_actions` (or a more specific versioned counter that rolls up to it) and nowhere as useful diagnostic progress.
- Human legal-intent projections may include the repeat. Default automated policies must deterministically prefer fresh useful actions and must not select a redundant repeat while any progress-making legal intent exists.
- Add a bounded explicit simulator policy/test that may choose a repeat to verify charging and reporting, then prove it cannot inflate score, citations, or success.
- Re-run the campaign/report matrix and compare success, turns, stalls, Service Points, and redundant-action counts with the prior baseline. Explain any expected change; do not accept new stalls or unbounded matches.

## Validation

Add canonical/staged and engine/browser regressions proving:

- first execution creates canonical Evidence and spends exactly its projected cost;
- a second deliberate request with a new request ID remains projected/legal, spends the same cost, creates exactly one redundant result, references the first Evidence event, and increments redundant work once;
- third and later repeats still reference the first canonical event;
- replaying the same request/idempotency key creates and spends nothing new;
- insufficient Actions, stale revision, illegal target, invalid lineage, and repeated zero-Action name fail closed at the correct boundary;
- changed target and changed machine revision create fresh canonical Evidence rather than a duplicate;
- candidate assessments, eliminations, Isolation route progress, Documentation/contribution slots, score, and Service Points are identical before and after a redundant reproduction except for the explicit redundant-work record;
- citation attempts using only or additionally using duplicate event IDs are rejected or canonicalized without increasing proof strength, according to the synchronized rule wording;
- selected-Ticket UI presents one correct repeat action and never substitutes other queued Tickets;
- Evidence/Worklog/results explain the duplicate and can navigate to the canonical result accessibly; and
- deterministic replay, saved-match compatibility/migration, player-safe redaction, full Node tests, automated games, complete browser matrix, responsive visuals, accessibility/performance checks, and `git diff --check` pass.

Run every repository baseline required by `AGENTS.md` plus every affected engine, Builder/solvability, simulator, schema, Worker-boundary, browser, and staged-deployment check. Record commands, exit codes, pass/fail totals, changed files, and unresolved items.

## Allowed paths

- `docs/design/decisions/{FROZEN_RULES,UNFROZEN_RULES,APPROVALS}.md`, this task, TASK-021 dependency wording, `docs/tasks/INDEX.md`, and directly affected user documentation
- affected domain/runtime/client schemas and versioned rules/profile fixtures
- canonical engine events, resolution, projections, reducers, invariants, scoring, replay, Worker/session boundaries, and staged generated Play modules rebuilt from canonical sources
- Viewer game-page/Bench/Legal Action/Evidence/Worklog/result-continuity code and Play CSS
- simulator policies, automated-game reporting/fixtures, and affected tests

Do not change diagnostic authored outcomes, relevance derivation, Ticket generation, candidate sets, costs, Card zones/disposition, Isolation route content, Repair/Verify rules, V2 dependency inference, or multiplayer visibility beyond what the approved repetition contract strictly requires.

## Completion boundary

Complete only when paid same-state diagnostic repetition is an explicit deterministic rule; request retry and gameplay repetition cannot be confused; every repeat produces a traceable redundant result linked to canonical Evidence; duplicates cannot strengthen knowledge, proof, score, or contribution; selected-Ticket UI and automated policies remain coherent; saved/replayed Matches are deterministic; automated games do not regress; and the synchronized docs, schemas, canonical/staged code, and tests agree.
