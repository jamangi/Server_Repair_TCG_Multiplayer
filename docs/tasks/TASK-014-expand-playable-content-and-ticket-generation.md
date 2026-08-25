# TASK-014-XHIGH: Expand playable content and Ticket generation

## Status

**Completed 2026-08-24.** PT-006 D was implemented against the synchronized TASK-013 diagnostic/candidate model.

## Approved authority

PT-006 D requires at least twelve causal fingerprints—two each across storage, memory, power, boot, thermal, and network—plus promotion of all current 37 Tests and 13 Commands into the versioned Global Bench catalog once each has a complete executable contract, target compatibility, Action cost, and deterministic result coverage. Add only the Repairs and Validations needed by the twelve supported scenario paths. Recompute source counts from the pinned manifest if the library changes before implementation.

## Objective

Replace the current three-template repetition bottleneck with a coverage-driven playable catalog and materially varied deterministic Ticket generation. Make it impossible for a Match to launch when its exact available diagnostic/response resources cannot complete every selected Ticket path.

This task expands playable Card/Ticket content from the current 257-record knowledge library; it does not turn every knowledge object into a Card. Card count is an output of complete gameplay coverage, not a target by itself. If the library changes before implementation, recompute all counts and coverage from the pinned manifest rather than treating 257 as a permanent invariant.

## Required reading

Read completely before editing:

- `AGENTS.md`, root `README.md`, this task, `docs/tasks/INDEX.md`, TASK-009/TASK-010 completion records, and completed TASK-013;
- `FROZEN_RULES.md` §§1, 9–15, 18, 20, and 21 plus the approved successor version/profile;
- domain schema README/notes, Card/Ticket/Builder contracts, runtime projections, and solvability semantics;
- all `viewer/content/*.json` domain packs except the generated manifest;
- all `content/gameplay-v1/*.json`, `src/builder/**`, engine setup/projection logic, solo Worker/catalog/deck services, and automated policies;
- case-study candidate material only when it supplies evidence for an already selected subsystem; and
- current automated-game reports and Builder/content tests.

## Required artifacts

### 1. Coverage audit

Create a machine-readable and human-readable coverage matrix connecting:

```text
Symptom -> plausible Candidate Faults -> diagnostic outcomes -> Isolation route
        -> eligible Repair -> Verify conditions -> closure -> playable definitions
```

For every supported scenario identify stable domain IDs, Card/bench definitions under the approved rules, targets, machine states, Evidence dispositions, Isolation requirements, Repair outcomes, Verify outcomes, and required resources. Distinguish:

- all 257 knowledge records;
- the 107 currently action-bearing Test/Command/Repair/Validation records;
- records selected for this playable release; and
- records deferred because their relationships or authored outcomes are incomplete.

For every Test/Command the approved availability model can offer, enumerate an outcome for every eligible generated machine state. Clean, negative, unrelated, and inconclusive observations are first-class Evidence outcomes, not missing mappings. Flag any diagnostic that can be offered yet lacks exactly one deterministic outcome as a hard coverage failure.

No coverage percentage may imply that Faults, Symptoms, Components, Tools, or Protocols should become Cards merely because they exist.

### 2. Playable content expansion

Implement the approved PT-006 scope across its named subsystems.

- Add typed Card Definitions only when they expose a complete executable contract needed by supported Tickets or the approved diagnostic model.
- Under approved PT-001 D and PT-006 D, define the exact versioned Global Bench catalog and promote all current 37 Tests and 13 Commands while limiting broad Repair/Validation work to the twelve supported fingerprints. Do not display the raw knowledge-library count as playable: promote a Test/Command only after it has a complete execution contract, targets, costs, and deterministic result coverage. Relevant mode must be a public-context-only filtered view of this same catalog rather than a separate hand-authored list.
- Prefer validated reusable outcome families for technically accurate clean, not-applicable, no-relevant-finding, and inconclusive results; keep candidate-changing outcomes relationship-bound and explicit. Do not manufacture a 50 × Ticket prose matrix or silently treat every unrelated diagnostic as the same observation.
- Prefer one reusable definition referencing one domain action over Ticket-specific duplicate Cards.
- Add complete authored machine states, causal truth, outcomes, typed alternative elimination/Isolation routes, Repairs, Verify requirements, and closure paths.
- Provide multiple technically valid Isolation routes where domain evidence supports them: direct visible confirmation, definitive diagnostic, corroborated support, elimination, or recovery-derived Evidence. Route diversity is content quality, not a quota; never create a redundant test solely to claim another route.
- Enforce disposition honesty: `CONFIRM` is independently decisive for its candidate under the authored conditions, `SUPPORT` may participate in a multi-Evidence route, `CONTRADICT` is not automatically `RULE_OUT`, and confirmed non-actionable effects cannot open Repair.
- Use current technical domain relationships; do not invent a playable procedure merely to hit a count.
- Validate every selected domain reference and resolve ambiguous/missing research through an explicit content diagnostic rather than guesswork.
- Keep illustration metadata and placeholder resolution stable. Full artwork remains TASK-011 and should start only after this catalog stabilizes.

### 3. Materially novel deterministic Builder output

Evolve the current complete-template selector into the Frozen §18 model: assemble complete Tickets from versioned compatible authored parts and relationships, then validate and snapshot the result. It may retain fixed templates as fixtures/fallbacks, but a “generated” Ticket cannot merely clone one whole template under a new ID.

At minimum define typed authored parts for:

- public context and Symptoms;
- candidate pool inputs and deterministic distractor selection under the approved rule;
- server-only Fault instances and causal edges;
- machine-state transitions;
- diagnostic targets and Evidence outcomes for every offered diagnostic;
- typed alternative elimination/Isolation routes and contribution attribution;
- Repair requirements/outcomes;
- Verify requirements/outcomes; and
- closure requirements and teaching/difficulty metadata.

Assembly must reject incompatible combinations, missing outcomes, ambiguous source/target resolution, undifferentiable candidates, dishonest `CONFIRM`/sufficiency combinations, incomplete causal paths, and any unavailable required gameplay definition. It must never generate prose or technical claims unconstrained by authored data.

### 4. Queue diversity and deck/resource reachability

- Deterministically maximize distinct eligible causal fingerprints before any repeat.
- When requested count exceeds the eligible unique set, repeat in a balanced deterministic order; do not select the same fingerprint repeatedly while another eligible fingerprint has not appeared.
- Preserve seed replayability and record every part/template ID plus content/generator version in provenance.
- Derive required playable definitions/resources from the assembled semantic path and cross-check any declared requirement list so incomplete declarations cannot bypass solvability.
- Prove each selected Ticket against the exact active deck and/or diagnostic availability model approved in TASK-013—not merely the global catalog.
- Reject any Ticket where a projected legal diagnostic can spend resources without exactly one authored/assembled Evidence result for its target and machine revision.
- Complete-or-none remains mandatory: one unreachable Ticket rejects the entire requested batch before Match creation.
- A legal 30-card deck and a scenario-compatible deck are distinct concepts. The Deck/Home UI must show the eligible subsystem/fingerprint coverage of a saved deck and explain when a Match request has insufficient variety or no complete path.

### 5. Solo behavior

- Queues of 1–10 Tickets use distinct fingerprints until the selected content pool is exhausted.
- Relevant and Global Bench Views render the same globally available diagnostic definitions, legal intents, and outcomes. Relevant is an advisory public-graph filter that may be applied inside Global; switching views changes no Match state or result.
- Home discloses the eligible unique count and when repetition will begin for the active deck/settings.
- Builder failure identifies missing Card/diagnostic/Repair/Verify coverage in player-safe terms and offers a path back to Decks; it never leaks hidden selected truth.
- Search, Refresh, draw/discard, or any successor response-deck behavior must be proven sufficient across repeated Tickets, not just for one closure.

## Validation

Add tests that prove:

- coverage matrix references and all new Card/Ticket/part schemas are valid;
- every supported Symptom/candidate relationship follows selected domain data;
- every candidate is differentiable and every offered diagnostic has exactly one legal current-state outcome;
- every actionable Fault has at least one complete typed Isolation route, every declared alternative route is independently solvable, and representative Faults exercise direct-observation, definitive-diagnostic, corroborated-support, elimination, and recovery-derived patterns where technically supported;
- clean, negative, unrelated, and inconclusive diagnostic outcomes create typed Evidence with a useful public observation even when they change no candidate assessment;
- the Global catalog count equals the promoted playable definitions rather than the raw knowledge-library count; Relevant membership and `Why relevant?` paths derive only from public context; and neither view leaks hidden truth through filtering, ordering, explanation, or timing;
- every generated Ticket passes the same complete Ticket schema and solvability oracle as fixtures;
- fixed seeds reproduce exact assembled snapshots/provenance;
- different seeds produce the expected diversity without weakening hard constraints;
- unique-before-repeat and balanced-repeat behavior for 1–10 queues;
- exact active-deck/resource reachability, including deliberate missing-diagnostic, missing-Repair, missing-Verify, exhausted-resource, and incomplete-declaration failures;
- every fingerprint and representative deck completes through seat-safe automated play over the Global legal-intent catalog; automated policies remain independent of human Bench View/filter state;
- no policy receives hidden truth; and
- staged browser content, Deck coverage messaging, and Home preflight match canonical Builder behavior.

Run the full repository suite, a new per-fingerprint/seed/deck automated campaign with committed compact statistics, TASK-009 report verification, Viewer staging verification, representative browser starts/failures, and `git diff --check`.

## Allowed paths after prerequisites

- approved domain/content packs and their schemas/examples
- `content/gameplay-v1/**` or an explicitly versioned successor pack
- `src/builder/**`
- engine setup/projection code only where assembled content integration requires it
- solo catalog/deck/Home/Worker surfaces and deterministic staging
- coverage reports under `docs/` and compact automated reports under `automated_games/`
- `tests/**`
- task/index/release documentation

Do not create full illustrations, tutorial overlays, SLA limits, multiplayer transport, speculative mechanics beyond TASK-013, or unrelated account/campaign content.

## Completion boundary

Complete only when the approved content breadth is playable and coverage-audited; generated Tickets are materially assembled rather than whole-template clones; 1–10 queues maximize real diversity before balanced repetition; every selected path is provably reachable with the exact Match resources; no declaration can hide a missing requirement; automated games exercise every supported fingerprint; and the UI explains compatibility without exposing truth.

## Completion record — 2026-08-24

### Outcome

- Published a pinned 257-record domain snapshot and machine/human coverage audits that distinguish all 107 action-bearing definitions, the 50 promoted Test/Command diagnostics, twelve selected Repairs, nine selected Validations, twelve supported fingerprints, and 36 deferred actions.
- Added two complete causal fingerprints each for storage, memory, power, boot, thermal, and network. Every path has relationship-bound candidates and outcomes, typed Isolation routes, exact Repair/Verify requirements, closure metadata, and deterministic clean, irrelevant, inconclusive, or candidate-changing Evidence for every target-compatible Bench diagnostic and machine state.
- Replaced whole-template selection for this release with `ticket-builder-v3` assembly from independent versioned public-context, candidate, truth, causal, target, outcome, route, Repair, Verify, closure, and teaching parts. Snapshots record every part ID, fingerprint ID, content pin, generator pin, and causal digest.
- Enforced exact active-deck counts, the complete 50-definition Bench, declaration cross-checking, complete-or-none solvability, unique-before-repeat selection, and balanced deterministic repetition. Deliberately missing diagnostic, Repair, Verify, response quantity, or declared legality fails before Match creation.
- Updated local Solo Play to load the expanded catalog, instantiate all 50 diagnostics in one Relevant/Global Bench, show exact deck/fingerprint/subsystem coverage, disclose the repetition boundary, block legal-but-unsolvable decks, preserve returning profile/statistic records while replacing incompatible v2 deck definitions, and offer Deck coverage recovery on Builder failure.
- Committed a 13-row campaign: one seat-safe deterministic run per fingerprint across two response-deck orderings plus a two-Ticket exact-resource run that exercised draw, Search, Refresh, two closures, and queue completion. All 13 succeeded with zero exceptions, rejected intents, legal-progress gaps, or deterministic mismatches.

### Verification

| Command | Exit | Result |
| --- | ---: | --- |
| `node viewer/scripts/build-task-014-content.mjs` | 0 | generated 71 Cards and twelve coverage paths from 257 pinned records |
| `node --check viewer/js/app.js`; `node --check viewer/js/data-loader.js`; `node --check viewer/js/entity-types.js` | 0 | baseline Viewer syntax passed |
| `node --test tests/viewer-baseline.test.mjs` | 0 | 3 passed, 0 failed |
| `node --test tests/*.test.mjs` | 0 | 119 passed, 0 failed, 0 skipped |
| `node viewer/scripts/build-play-assets.mjs`; `node viewer/scripts/verify-play-assets.mjs` | 0 | 40 deterministic Play assets staged and verified |
| `node tools/run-automated-games.mjs --verify-report automated_games/task-009-foundation-v1` | 0 | 22 frozen foundation rows verified with 0 deterministic mismatches |
| `node tools/run-task-014-campaign.mjs --verify-report automated_games/task-014-playable-coverage-v3` | 0 | 13 expanded-content rows verified with 0 exceptions or deterministic mismatches |
| Playwright TASK-010/TASK-012/TASK-013/TASK-014 browser matrix | 0 | 22 passed, 0 failed, 34 intentional project skips |
| `git diff --check` | 0 | no whitespace errors |

### Changed-file inventory

Changes stay within the task allowlist: versioned gameplay content and generated coverage report; two new domain schemas and focused Ticket/Builder/client schema extensions; the v3 Builder and solvability proof; seat-safe simulation policy, campaign runner, settings, matches, and summaries; canonical and staged Solo content/Builder assets; catalog, Worker, local-data, Home, Deck, Settings, and game-board integration; Node and browser regression tests; release/index documentation; and this completion record.

### Unresolved items

None. TASK-011 may now create illustrations against the stable expanded catalog. TASK-016 owns the approved Bench/board composition polish, and TASK-015 owns guided tutorial/reveal presentation; neither was started here.
