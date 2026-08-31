# System Models and the proposed System Resolver

## Status

This directory is the entry point for the System Model / System Finder capability. TASK-049 through TASK-055 are complete. The project owner approved the curated Finder architecture as `SYSTEM-001 A` on 2026-08-30 and its bounded released-Story scale path as `SYSTEM-002 A` on 2026-08-31. The resulting release covers all 18 immutable Tickets in the twelve-Match Story campaign, productionizes their public-safe projections, and exposes them through the accessible zero-Action **Show system** Ticket experience. Existing V0 Ticket outcomes, Evidence dispositions, legal intents, Diagnostic Bench relevance, and hidden-truth boundaries remain authoritative; no successor System Model task is currently authorized.

The TASK-049 package is:

- [`SYSTEM_MODEL_CONTRACT.md`](SYSTEM_MODEL_CONTRACT.md) — vocabulary, planes, candidate typed model, projections, authority boundaries, consistency definitions, versioning, fallback, and field ownership;
- [`RESEARCH_PROTOCOL.md`](RESEARCH_PROTOCOL.md) — claim-level sourcing, architecture-comparison evidence, stop rules, and TASK-050 handoff;
- [`PILOT_SELECTION.md`](PILOT_SELECTION.md) and [`pilot-selection-v1.json`](pilot-selection-v1.json) — the reproducible five-Ticket pilot and its committed classification ledger;
- [`WORKED_EXAMPLES.md`](WORKED_EXAMPLES.md) — storage and non-storage contract walks plus reality and non-leak counterexamples; and
- [`verify-task-049.mjs`](verify-task-049.mjs) — denominator, selection, field-ownership, acceptance, and repository-relative Markdown-link checks.

The TASK-050 package is:

- [`task-050/ATLAS.md`](task-050/ATLAS.md) — five complete Ticket dossiers generated from two fixed source-backed profiles;
- [`task-050/review.html`](task-050/review.html) — responsive review of five original public-safe SVG schematics and exact text equivalents;
- [`task-050/COMPONENT_RELATIONSHIP_AUDIT.md`](task-050/COMPONENT_RELATIONSHIP_AUDIT.md) — every modeled role plus sixteen concrete, authority-bounded relationship findings;
- [`task-050/ARCHITECTURE_EVALUATION.md`](task-050/ARCHITECTURE_EVALUATION.md) — measured A/B/C/D comparison and Finder-first recommendation; and
- [`task-050/source-ledger.json`](task-050/source-ledger.json) — eighteen primary-source entries with revisions, claim scope, access status, exact/generalized boundaries, and exceptions.

The TASK-051 production package is:

- [`task-051/README.md`](task-051/README.md) — architecture, artifact inventory, source/abstraction exceptions, and remaining boundary;
- [`task-051/MIGRATION.md`](task-051/MIGRATION.md) — immutable successor-overlay and public/private compatibility contract;
- [`../../content/system-model-pilot-v1/`](../../content/system-model-pilot-v1/) — two canonical profiles, five public bindings, five build/server-only compatibility proofs, sixteen relationship dispositions, deterministic migration/manifest data, and executable build/validation; and
- [`../../viewer/content/system-model-pilot-v1-components.json`](../../viewer/content/system-model-pilot-v1-components.json) — the two justified pilot Component definitions.

The TASK-052 proof package is:

- [`task-052/README.md`](task-052/README.md) — resolver/projection boundary, measured results, artifact inventory, and exclusions;
- [`task-052/REPORT.md`](task-052/REPORT.md) — generated 5/5 resolution, invalid-fixture, differential, and one-source measurements;
- [`task-052/review.html`](task-052/review.html) and [`task-052/BROWSER_QA.md`](task-052/BROWSER_QA.md) — proof-only accessible review surface and browser matrix;
- [`task-052/resolver-proof-v1.json`](task-052/resolver-proof-v1.json) and [`task-052/public-projections/`](task-052/public-projections/) — strict aggregate and per-Ticket public proof artifacts; and
- [`../../src/system-models/`](../../src/system-models/) — the public-input-only deterministic resolver and one-source projection builder.

The TASK-053 released-Story domain package is:

- [`task-053/README.md`](task-053/README.md) and [`task-053/RELEASED_STORY_SYSTEM_COVERAGE.md`](task-053/RELEASED_STORY_SYSTEM_COVERAGE.md) — exact 12-Match / 18-Ticket denominator, profile reuse, source exceptions, public Candidate closure, and zero-gap completion record;
- [`task-053/source-ledger-v2.json`](task-053/source-ledger-v2.json) — 25 bounded primary-source records and 50 claim-level mappings; and
- [`../../content/system-model-story-v1/`](../../content/system-model-story-v1/) — three source-backed profiles, 18 exact public bindings, 18 build-only compatibility proofs, 125 typed relationships, immutable migration/manifest data, deterministic generation, and strict validation.

The TASK-054 production package is:

- [`task-054/README.md`](task-054/README.md), [`task-054/production-build-report-v1.json`](task-054/production-build-report-v1.json), and [`task-054/benchmark-production.mjs`](task-054/benchmark-production.mjs) — production boundary, measured coverage, public/private audit, size, caching, fallback, and benchmark evidence;
- [`../../content/system-model-story-v1/public-system-projections-v1.json`](../../content/system-model-story-v1/public-system-projections-v1.json) — the canonical deduplicated public catalog containing three shared profile cores and eighteen opaque Ticket contexts; and
- [`../../viewer/js/play/system-model-service.mjs`](../../viewer/js/play/system-model-service.mjs) — the same-origin, version-cached, strictly validated browser consumer with one generic unavailable result.

The TASK-055 player package is:

- [`task-055/README.md`](task-055/README.md) — information hierarchy, authority boundary, dialog lifecycle, and interaction contract;
- [`task-055/BROWSER_QA.md`](task-055/BROWSER_QA.md) — desktop, tablet, phone, zoom, reduced-motion, forced-color, keyboard, touch, replay, failure, and human visual evidence; and
- [`../../viewer/js/play/system-model-view.mjs`](../../viewer/js/play/system-model-view.mjs) — the semantic lifecycle, topology plus complete text equivalent, component, rationale, legality, and learning-source presentation.

The project-owner-supplied concept image is preserved at [`system-model-host-bmc-concept.png`](../ui-plan/ui-reference_images/system-model-host-bmc-concept.png). It demonstrates the useful idea of showing the host and management subsystems as distinct but connected regions; it is not a complete topology, a real product specification, or a production layout.

## Working definition

A **System Model** is a versioned, source-backed description of one serviceable server archetype. It identifies its component roles, replaceable units, topology, startup and runtime lifecycle, management/control surfaces, observability points, and the system-level applicability of Tests, Commands, Repairs, and Verifications.

The proposed **System Resolver** has three deliberately separate jobs:

1. a **Finder** chooses a curated real-system archetype whose constraints are compatible with the complete authored Ticket;
2. a **validator** proves hidden authoring consistency, public non-contradiction, component/domain integrity, and reality provenance; and
3. a **projection builder** derives plain-English descriptions, accessible diagrams, and brief action-relevance graphs from the selected structured model.

This finder-first hybrid is the recommended starting direction. It captures most of the user's “Builder” value without claiming that arbitrary combinations of plausible parts form a real serviceable system. A generative composition Builder should be authorized only if the five-Ticket pilot proves a closed constraint system and an independently checkable reality basis.

## Scope beyond boot

A boot sequence alone is too narrow for the current Tickets. A useful model must represent at least these interacting planes where applicable:

- standby power, chassis power sequencing, and PSU delivery;
- management-plane startup and out-of-band BMC control;
- host reset, CPU/chipset initialization, firmware, POST, memory training, and NVRAM/boot policy;
- storage discovery and data paths through devices, cables/connectors, backplanes, controllers, arrays, and boot media;
- network initialization and handoff-relevant connectivity; and
- OS handoff plus bounded runtime/service behavior needed to explain post-boot symptoms, intermittent paths, cooling/load behavior, and verification.

The model also needs observability and intervention edges: what a diagnostic observes, what a Command queries or changes, what a Repair physically or logically targets, and what a Verification proves afterward. Lifecycle stages may be required, optional, conditional, parallel, or not applicable; the system must not invent one universal boot order.

## Four consistency contracts

### Ticket-consistent

The private authoring validator must prove that the selected system can realize every hidden Fault instance, authored Evidence result, accepted Isolation target, Repair outcome, and Verification outcome in the Ticket. A Ticket involving a failed NVMe device, for example, cannot resolve to a system with no compatible NVMe device or path.

### Public-safe

The player-visible topology must not contradict Symptoms, public Candidates, or already authorized Evidence. More strongly, every public Candidate must remain physically possible within the displayed system or be represented by a truthful abstraction that does not rule it out. The visible model may not be selected or simplified in a way that leaks the hidden solution. Equivalent Tickets with the same public surface but different hidden truth must produce the same public system projection unless an authorized public event justifies a difference.

### Reality-consistent

Every curated profile and any future composition rule must be supported by primary material such as manufacturer service/technical documentation or the applicable standards body. A web search result, product photograph, reseller listing, or plausible-looking collection of parts is not sufficient proof. Profiles must record source, revision or product generation, access date, claim scope, and which details are exact versus generalized.

### Component-DB-synchronized

Every modeled component role must resolve to an existing stable Component ID or an explicitly reviewed gap. Synchronization does **not** mean inserting every nearby Component ID into every domain object. The pilot must define justified typed relationships—for example, a Fault affects a component, a Test observes a component or path, a Command queries a control surface, a Repair targets a serviceable unit, and a Verification evaluates a resulting state—and add only relationships supported by semantics and sources.

## Derived player-facing views

One structured model should support:

- a concise plain-English startup/runtime narrative assembled from typed lifecycle stages;
- an accessible responsive topology diagram with text equivalent;
- component details and service roles;
- brief graphs explaining why a Test, Command, Repair, or Verification can be relevant to this kind of system; and
- a clear distinction between **system-relevant** actions and actions that are **legal now** under the authoritative Match projection.

The model is explanatory in V0. It must not derive Evidence dispositions, decide the hidden Fault, change legal intents, or replace the authored diagnosis rules. Dependency-derived Evidence authority belongs to the deferred V2 Migration Seed, not this sequence.

## Ordered delivery sequence

1. **TASK-049** defines the evidence protocol, model contract, public/private boundary, five-Ticket selection, and evaluation method.
2. **TASK-050** manually creates the five-Ticket illustrated atlas and component/relationship gap audit, then authors the `SYSTEM-001` architecture approval packet.
3. **Gate SYSTEM-001 A** approved the Finder-first hybrid on 2026-08-30.
4. **TASK-051** completed the strict typed pilot contract, five bindings, private validation boundary, Component/relationship synchronization, and immutable migration.
5. **TASK-052** completed deterministic resolution, validation, descriptions, diagrams, and relevance graphs for the pilot and authored the `SYSTEM-002` scale-readiness packet.
6. **Gate SYSTEM-002 A** approved bounded mass production with the proved resolver on 2026-08-31.
7. **TASK-053** completed the exact released-Story audit and synchronized all eighteen Ticket instances with three sourced profiles and no new Component IDs.
8. **TASK-054** completed deterministic production resolution, deduplicated public projection, static staging, strict validation, and honest fallback across that set.
9. **TASK-055** completed the public-safe **Show system** Ticket experience and its responsive, accessible, non-leak verification matrix.

This order keeps inexpensive research and manual counterexamples ahead of schema migration, domain expansion, runtime work, mass production, and UI polish.

## Non-goals for this sequence

- modeling every circuit, firmware branch, OS service, or vendor option;
- scraping or downloading live product data at runtime;
- dynamically searching the internet during a Match;
- inferring the correct hypothesis or hidden solution for the Player;
- redefining Card legality, Evidence strength, Isolation, Repair, or Verify authority;
- requiring every non-Story Ticket to have a model in the first release; or
- building a general-purpose digital twin or dependency-inference engine.
