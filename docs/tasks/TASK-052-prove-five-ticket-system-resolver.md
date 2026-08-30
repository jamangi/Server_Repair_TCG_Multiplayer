# TASK-052-XHIGH: Prove the five-Ticket System Resolver

## Status

**Planned after TASK-051.** Uses the approved `SYSTEM-001` architecture and the integrated five-model contract.

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
