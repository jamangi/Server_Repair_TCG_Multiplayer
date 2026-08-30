# TASK-049-XHIGH: Define the System Model and research protocol

## Status

**Planned after TASK-048.** TASK-048 remains the only active task. This task begins the proposed System Model sequence only after the tutorial repair is complete.

## Objective

Turn the System Builder / System Finder idea into an evidence-backed, implementation-neutral contract before any schema, domain, runtime, or UI mutation. Define exactly what a System Model represents, how five pilot Story Tickets are selected, how reality and Ticket consistency are proven, how public projections avoid hidden-truth leaks, and how later tasks will be evaluated.

Begin with the finder-first hybrid described in [`docs/system-models/README.md`](../system-models/README.md) as the recommendation to test, not as approved architecture.

## Required reading

Read completely before editing:

- `AGENTS.md`, root `README.md`, this task, `docs/tasks/INDEX.md`, and `docs/system-models/README.md`;
- completed TASK-009, TASK-013, TASK-014, TASK-017's deferred V2 boundary, TASK-024, TASK-039 through TASK-046, and the released Story coverage/release artifacts;
- current Component, Fault, Symptom, Test, Command, Repair, Verification, Card, Ticket, Builder, projection, and relevance schemas/content/validators;
- frozen/unfrozen decisions, source/provenance conventions, version/migration rules, and static Viewer boundary; and
- the project-owner-supplied [`system-model-host-bmc-concept.png`](../ui-plan/ui-reference_images/system-model-host-bmc-concept.png), treating it as an idea reference rather than technical authority.

## Deliverables

Create a planning package under `docs/system-models/` that defines:

- vocabulary and boundaries for system profile, component role/instance, serviceable unit, topology node/edge, lifecycle stage, control surface, observation point, path, system-relevant action, legal action, and public/private projection;
- the minimum planes needed beyond boot: power, management, host firmware/POST, memory, storage, network, OS handoff, and bounded runtime/service behavior;
- a candidate typed data model and relationship taxonomy without yet changing production schemas;
- versioning, stable-ID, provenance, migration, deterministic serialization, and fallback requirements;
- a generic-description architecture that builds prose from typed stages/clauses/variables while preserving optional, conditional, parallel, and not-applicable behavior;
- an accessible diagram projection and a compact rationale-graph projection derived from the same data;
- exact Ticket-consistent, public-safe, reality-consistent, and Component-DB-synchronized acceptance definitions;
- a source protocol prioritizing manufacturer service/technical manuals and standards bodies, with claim-level citations, revision/era, access date, exact/generalized distinctions, and archive guidance;
- stop rules for contradictory sources, vendor-option ambiguity, insufficient Component granularity, schema pressure, and any proposal that would make the model gameplay authority; and
- a reproducible five-Ticket pilot-selection method drawn from the 18 released Story Tickets.

## Five-Ticket selection contract

Do not simply choose the first five Tickets or five visually distinct machines. Select the smallest five-Ticket set that maximizes architectural and teaching pressure across:

- management/BMC versus host control;
- pre-boot firmware/POST/memory/boot-policy behavior;
- storage device, cable/backplane/controller/array paths;
- power or thermal/load behavior;
- network or post-OS runtime symptoms;
- physical and logical Repairs;
- direct, path-based, and indirect observations; and
- ambiguous public Candidates where a system diagram could accidentally leak the hidden answer.

Use stable released Ticket IDs and publish the selection score/justification. If the current Story corpus cannot cover one category, record the gap rather than inventing a Ticket.

## Information and authority boundary

- Define a private authoring validator that may inspect hidden Ticket content solely to reject incompatible models.
- Define a public system projection that uses only stable public profile data and authorized Ticket state.
- Require **public-candidate closure**: every public Candidate remains possible in the visible topology, or the view uses an honest abstraction that does not exclude it.
- Require differential non-leak proof for Tickets with identical public surfaces and varied hidden solutions.
- Keep System action relevance explanatory. It may not alter the Diagnostic Bench, legal intents, Evidence dispositions, Isolation routes, or authoritative outcomes.
- Explicitly distinguish this V0 explanatory graph from TASK-017's deferred V2 dependency-derived inference proposal.

## Recommended-architecture comparison

Define the evidence TASK-050 must collect to compare, without pre-approving:

- curated archetype Finder plus deterministic projection builder;
- completely authored Ticket-specific system profiles; and
- constraint-generated system composition plus reality validation.

Compare authoring cost, reuse, source burden, constraint closure, contradiction risk, information leakage, deterministic reproducibility, migration cost, and failure/fallback behavior. Do not use a numeric score to hide a blocking safety or provenance failure.

## Verification

- Walk one released storage Ticket and one non-storage Ticket through the proposed contract without creating production data.
- Prove that every proposed field has a named producer, validator, and consumer.
- Prove the pilot-selection calculation is reproducible from committed Story coverage artifacts.
- Supply at least one counterexample where a plausible component combination is not sufficiently proven to be a real supported system.
- Supply at least one non-leak counterexample where choosing a model from hidden truth would eliminate a public Candidate.
- Run repository-relative Markdown link validation and `git diff --check`.
- Report commands, exit codes, pass/fail totals, changed files, selected Tickets, unresolved questions, and stop conditions.

## Allowed paths

- `docs/system-models/**` planning/research artifacts;
- this task, `docs/tasks/INDEX.md`, and concise root/UI-reference documentation;
- `docs/design/decisions/APPROVALS.md` only if the research exposes an immediate concrete choice that must precede TASK-050.

Do not edit schemas, domain/gameplay/Story content, generated manifests, Viewer/runtime code, or frozen rules. Do not start the five full illustrations or internet case research assigned to TASK-050.

## Completion boundary

Stop when a future builder can select and research five Story Tickets, model the necessary lifecycle/topology, distinguish every consistency contract, generate comparable manual outputs, and recognize authority/leakage failures without guessing what “system,” “relevant,” “real,” or “synchronized” means.
