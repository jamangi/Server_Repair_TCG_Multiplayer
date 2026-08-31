# TASK-052-XHIGH: Prove the five-Ticket System Resolver

## Status

**Completed 2026-08-30.** Uses approved `SYSTEM-001 A`, proves exactly the five integrated pilot bindings, and leaves `SYSTEM-002` pending before any scale work.

## Objective

Build a deterministic proof of concept that resolves a valid System Model for each pilot Ticket, rejects incompatible models, and derives the plain-English lifecycle, accessible topology diagram, component inventory, and action-rationale graphs from structured data.

This task proves the architecture on five Tickets outside the production Ticket UI. It must expose counterexamples cheaply before all released Story content is migrated.

## Required reading

Read completely before editing:

- `AGENTS.md`, root `README.md`, this task, completed TASK-049 through TASK-051, approved `SYSTEM-001`, and the five accepted atlas/model artifacts;
- System Model schemas/validators, domain relationship contracts, Ticket Builder snapshots, private/public projections, deterministic serialization, static Viewer conventions, and applicable source ledgers;
- V0 gameplay authority and TASK-017's deferred dependency-inference boundary; and
- all five pilot Tickets' public and hidden authoring variants.

## Resolver contract

Implement the approved strategy while retaining these architecture-neutral guarantees:

- resolution occurs deterministically during content/Ticket construction or another approved pre-Match boundary, never through live internet search during play;
- the resolver accepts explicit Ticket/profile/version inputs and produces a selected profile ID, validation trace, public model projection, and bounded failure diagnostics;
- hidden authoring content may reject incompatible profiles but may not cause observably different public output within one public equivalence class;
- candidate profiles are source-backed production data, not models synthesized from unreviewed prose;
- ties and absence have deterministic policies; no random “plausible enough” fallback is allowed; and
- a failure to find a consistent model leaves the Ticket playable under its existing contract and reports the missing model honestly rather than inventing one.

If `SYSTEM-001 C` authorized composition, prove every generated combination against the approved closed compatibility rules and source basis. Any open-world or post-generation web search remains out of scope.

## Derived-view builder

From the selected public model, deterministically build:

- a newcomer-readable lifecycle narrative with required, optional, conditional, parallel, and not-applicable stages rendered honestly;
- an accessible node/edge diagram model and text equivalent;
- a component inventory with plain-language roles and serviceability;
- one concise rationale graph per relevant Test, Command, Repair, and Verification; and
- explicit labels distinguishing “relevant to this system” from “legal now in this Match.”

One semantic source must drive every representation. Do not maintain independent prose, diagram, and relevance truths that can drift.

Rationale paths must be bounded and explainable, for example `Drive Health Test → observes → NVMe device → participates in → boot/storage path`. They may use public profile/domain relations only. They may not disclose the actual failed node or predict an authored result.

## Proof harness and review surface

- Provide a repository-local proof viewer/report for the five Tickets using dependency-free HTML/CSS/JavaScript or static generated artifacts consistent with repository policy.
- Render public and authoring-validation views separately and label the private view as design/test evidence that can never ship to the Player.
- Support side-by-side source claim, component mapping, lifecycle narrative, diagram, rationale graph, and validation trace review.
- Include deliberately invalid profiles covering missing devices, incompatible controller/path assumptions, public-Candidate elimination, unsupported vendor options, and incomplete domain relationships.

## Scale-readiness gate

At completion, add `SYSTEM-002` to `docs/design/decisions/APPROVALS.md` using measured pilot results:

- **A — Approve mass production with the proved resolver (recommended only if all gates pass).**
- **B — Expand/correct the curated profile and component library, then repeat the pilot.**
- **C — Reopen the architecture choice because the approved strategy does not scale or preserve safety.**
- **D — Defer player-facing System Models while retaining the research artifacts.**

TASK-053 is blocked until the owner approves a scale path.

## Verification

- Resolve 5/5 pilot Tickets deterministically and reject every incompatible fixture with stable reason codes.
- Prove hidden authored outcomes, Evidence dispositions, and solution IDs are absent from public model data, prose, diagrams, rationale graphs, logs, errors, and filenames.
- Run differential public-projection tests across hidden-truth variants and public Candidate combinations.
- Prove all generated prose/diagram/rationale references resolve to the same canonical nodes/edges and reproduce byte-for-byte.
- Verify no derived “system relevance” modifies legal intents, Bench filtering, Evidence, Isolation, Repair, Verify, scoring, or Story progress.
- Browser-review the proof surface at desktop, mobile, keyboard, touch, screen reader, forced colors, reduced motion, and 200% zoom/reflow.
- Run focused System Model/domain/Ticket/Builder/projection tests, frozen replays, Viewer baseline/staging checks, Markdown links, and `git diff --check`.
- Report commands, exit codes, pass/fail totals, resolution traces, invalid-fixture results, performance, changed files, and unresolved items.

## Allowed paths

- System Model resolver, validators, deterministic projection builders, and proof-only viewer/report code;
- pilot data/provenance from TASK-051;
- focused tests/fixtures and `docs/system-models/**` evidence;
- `docs/design/decisions/APPROVALS.md`, decision status, this task, `docs/tasks/INDEX.md`, and concise root/system documentation;
- staged Viewer files only when the proof surface is deliberately hosted under the static boundary and clearly excluded from production navigation.

Do not scale beyond five Tickets, add production Ticket controls, alter gameplay authority, search the internet at runtime, or implement hidden failure highlighting.

## Completion boundary

Stop when all five pilots resolve and render from one typed source, invalid systems are rejected, public output is demonstrably non-leaking, measured scale evidence is published, and `SYSTEM-002` is ready for owner choice.

## Completion record

### Resolver and one-source projection

- `src/system-models/resolver.mjs` accepts explicit public Ticket/profile/version inputs, selects exactly one pinned public binding, validates the public profile, and returns a bounded trace plus either a strict projection or one generic honest fallback.
- `src/system-models/projections.mjs` derives lifecycle prose, accessible topology geometry/text, component inventory, public-Candidate closure, and Test/Command/Repair/Verification rationale graphs from the same canonical public profile.
- Authoring-only compatibility is a separate reject-only call. It reports status and aggregate check counts but cannot select a profile, vary public bytes, reveal private identifiers, or change failure text.
- Resolver/projection code has no engine, Builder, Story, Evidence, legal-action, scoring, or network dependency. Every failure reports `gameplay_effect: NONE`; existing Tickets remain playable.

### Measured proof

- 5/5 immutable pilot Tickets resolve deterministically to exactly one of two curated profiles, and all traces end in `ONE_SOURCE_PROJECTION_ACCEPTED`.
- 5/5 deliberate incompatible profiles reject with the stable codes `MISSING_REQUIRED_DEVICE`, `INCOMPATIBLE_CONTROLLER_PATH`, `PUBLIC_CANDIDATE_CLOSURE_FAILED`, `UNSUPPORTED_VENDOR_OPTION`, and `INCOMPLETE_DOMAIN_RELATIONSHIPS`.
- 21 authoring variants preserve byte-identical public projections within their public equivalence classes.
- 111 non-empty authorized public-Candidate combinations preserve the canonical lifecycle/topology/inventory/rationale semantic digest while changing only public Candidate context.
- 51 unique sourced public attachments produce 174 per-Ticket rationale graphs. Every graph and generated representation resolves to canonical nodes, edges, paths, roles, and source claims.
- A 250-resolution benchmark completed in 2,167.74 ms (8.671 ms per resolution), with zero network requests and zero random choices.
- The focused four-project browser matrix passed 20/20 checks, and a hands-on desktop/mobile review found no overflow, console, interaction, or accessibility blocker.

### Files

- Resolver and projection source: `src/system-models/resolver.mjs`, `src/system-models/projections.mjs`.
- Strict schemas: `schemas/domain/system_model_public_projection.schema.json`, `system_model_resolver_result.schema.json`, `system_model_resolver_fixture_catalog.schema.json`, and `system_model_resolver_proof.schema.json`.
- Proof source and outputs: `docs/system-models/task-052/**`, including the generator, benchmark, invalid fixtures, aggregate proof, five public projections, report, accessible review surface, release README, and browser QA.
- Regressions: `tests/task-052-system-model-resolver.test.mjs` and `tests/browser/task-052-system-resolver-proof.spec.mjs`, plus the synchronized schema-count assertion.
- Synchronized task, decision, schema, System Model, package-script, and root documentation. No production Viewer, Ticket, gameplay, Builder, engine, or Story artifact changed.

### Scale gate and unresolved item

`SYSTEM-002` now records A/B/C/D with the measured pilot results. Option A is recommended because every bounded proof gate passed, but no option is authoritative until the project owner replies. This is the only unresolved TASK-052 handoff; TASK-053 through TASK-055 remain blocked.

### Verification

Final verification commands completed with exit code 0:

- `node --check src/system-models/projections.mjs`, `node --check src/system-models/resolver.mjs`, `node --check docs/system-models/task-052/generate-proof.mjs`, and `node --check docs/system-models/task-052/benchmark-resolver.mjs` — syntax clean.
- `node content/system-model-pilot-v1/build-release.mjs --check` — all 19 deterministic TASK-051 inputs matched; `node content/system-model-pilot-v1/validate-release.mjs` — accepted 2 profiles, 5 bindings, 5 private proofs, 16 relationship findings, and 2 added Components.
- `node docs/system-models/task-052/generate-proof.mjs --check` — 5/5 Tickets, 5/5 invalid profiles, 21 private variants, and 111 public-Candidate combinations matched committed bytes.
- `node --test tests/task-052-system-model-resolver.test.mjs` — 12 passed, 0 failed, including strict schemas, canonical references, public non-leak scans, immutable-input hashes, and repository-relative Markdown links.
- `node --check viewer/js/app.js`, `node --check viewer/js/data-loader.js`, and `node --check viewer/js/entity-types.js` — syntax clean; `node --test tests/viewer-baseline.test.mjs` — 3 passed, 0 failed.
- `node --test tests/task-007-schema-contracts.test.mjs tests/viewer-content-schema.test.mjs tests/task-050-system-model-atlas.test.mjs tests/task-051-system-model-contract.test.mjs tests/task-052-system-model-resolver.test.mjs` — 58 passed, 0 failed.
- `node --test --test-reporter=tap tests/*.test.mjs` — 395 passed, 0 failed.
- `node viewer/scripts/build-play-assets.mjs` and `node viewer/scripts/verify-play-assets.mjs` — 197 deterministic staged Play assets built and verified without a tracked diff.
- `node tools/run-automated-games.mjs --verify-report automated_games/task-009-foundation-v1` — 22 rows verified (12 successful, 10 retained exceptions), 0 deterministic mismatches.
- `node tools/run-task-014-campaign.mjs --verify-report automated_games/task-014-playable-coverage-v3` — 13 rows verified, 0 deterministic mismatches.
- `node docs/system-models/task-052/benchmark-resolver.mjs` — 250 resolutions in 2,167.74 ms (8.671 ms each), 0 network requests, 0 random choices.
- `playwright test tests/browser/task-052-system-resolver-proof.spec.mjs` through the bundled Playwright 1.62.1 runtime — 20 passed, 0 failed across desktop, tablet touch, mobile touch, and reduced-motion mobile.
- `git diff --check` — clean.

Hands-on review additionally exercised the local static page at 1440×900 and 390×844, opened a native disclosure, inspected the accessibility tree, and found no horizontal overflow or console errors. The local `npx` launcher was missing its npm module (exit 1), so the identical committed Playwright specification was run through the bundled 1.62.1 CLI. An initial browser assertion treated a multi-element locator as singular (16 passed, 4 failed); the assertion was corrected and the final run passed 20/20. An initial focused integration run exposed the reserved Qualification-name collision and a stale documentation-link count (56 passed, 2 failed); both were synchronized before the final 58/58 and 395/395 runs.
