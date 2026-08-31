# TASK-052 five-Ticket System Resolver

Status: **proof complete; `SYSTEM-002 A` approved 2026-08-31; TASK-053 authorized**

TASK-052 proves the approved `SYSTEM-001 A` Finder architecture on exactly the five immutable pilot Tickets. Resolution and all derived views are deterministic, public-input-only build artifacts. Authoring-only compatibility remains a separate reject-only gate and can never select or vary a player-visible projection.

## Review package

- [`REPORT.md`](REPORT.md) is the generated measured result.
- [`review.html`](review.html) is the dependency-free accessible proof surface.
- [`resolver-proof-v1.json`](resolver-proof-v1.json) is the strict aggregate proof record.
- [`public-projections/`](public-projections/) contains one strict public projection per pilot Ticket.
- [`invalid-profile-fixtures-v1.json`](invalid-profile-fixtures-v1.json) defines the five bounded in-memory counterexamples.
- [`BROWSER_QA.md`](BROWSER_QA.md) records responsive and accessibility review.
- [`generate-proof.mjs`](generate-proof.mjs) regenerates or checks every proof artifact.
- [`benchmark-resolver.mjs`](benchmark-resolver.mjs) measures the fixed five-Ticket resolver without network or randomness.

Run `npm run build:system-resolver` to regenerate the package or `npm run verify:system-resolver` to check byte stability and focused semantics.

## Measured boundary

- 5/5 public Ticket requests resolve to exactly one pinned profile.
- 5/5 deliberate invalid profiles fail closed with stable, player-safe reason codes and `gameplay_effect: NONE`.
- 21 authoring variants produce byte-identical public projections for their public equivalence class.
- 111 non-empty authorized public-Candidate combinations preserve the same lifecycle, topology, inventory, and rationale semantic digest while truthfully changing only public Candidate context.
- 2 curated profiles and 51 unique public action attachments produce 174 per-Ticket rationale graphs.
- A 250-resolution local benchmark completed in 2,167.74 ms (8.671 ms per resolution), with zero network requests and zero random choices.

## Resolver and projection boundary

`src/system-models/resolver.mjs` accepts an explicit public Ticket/profile/version request, applies an exactly-one binding policy, validates the selected public profile, and returns a bounded trace plus either a strict projection or one generic honest fallback. No public request field carries hidden Fault, Evidence, Isolation, Repair, Verify, or solution data.

`src/system-models/projections.mjs` derives lifecycle prose, accessible diagram geometry and text, component inventory, Candidate closure, and action-rationale graphs from the same canonical public profile. The projection labels system relevance separately from current Match legality. It does not import the engine, Builder, Story runtime, or legal-action projector.

Authoring validation accepts private compatibility data only in the separate build path. Its public-safe summary contains status and aggregate counts; it cannot alter selection, projection bytes, trace content, or fallback wording.

## Failure policy

Absence, ambiguity, bad keys, version drift, missing required devices, incompatible paths, Candidate-closure gaps, unsupported option claims, and incomplete relationships all reject. The resolver never searches the web, guesses a close profile, composes an unproved system, or removes public possibilities based on hidden truth. An unresolved model leaves the existing Ticket playable and reports only that the detailed model is unavailable.

## Deliberate exclusions

This release does not itself scale beyond the five pilots, modify any Ticket or gameplay snapshot, add a production Ticket control, infer Evidence, rank Candidates, expose failure highlighting, or implement Story-wide production. The project owner's `SYSTEM-002 A` approval authorizes TASK-053 to perform the separate bounded released-Story domain audit and synchronization; TASK-054 and TASK-055 retain their prerequisites.
