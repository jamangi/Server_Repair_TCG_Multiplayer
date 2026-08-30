# TASK-049-XHIGH: Define the System Model and research protocol

## Status

**Complete.** The implementation-neutral contract, claim-level research protocol, deterministic five-Ticket selection, worked consistency/non-leak examples, field-ownership proof, and repository-relative verifier are committed under [`docs/system-models/`](../system-models/README.md). No production schema, content, runtime, Viewer, or gameplay authority changed. TASK-050 may now create the manual atlas and `SYSTEM-001` approval packet.

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

## Completion record

- Contract: [`SYSTEM_MODEL_CONTRACT.md`](../system-models/SYSTEM_MODEL_CONTRACT.md)
- Research/architecture protocol: [`RESEARCH_PROTOCOL.md`](../system-models/RESEARCH_PROTOCOL.md)
- Selection report and machine ledger: [`PILOT_SELECTION.md`](../system-models/PILOT_SELECTION.md), [`pilot-selection-v1.json`](../system-models/pilot-selection-v1.json)
- Storage/non-storage walks and counterexamples: [`WORKED_EXAMPLES.md`](../system-models/WORKED_EXAMPLES.md)
- Reproducer/link validator: [`verify-task-049.mjs`](../system-models/verify-task-049.mjs)

Selected stable released Ticket IDs:

- `ticket.generated.3ec80b1b0e7221ac725aedf9`
- `ticket.generated.3fd6eb04534f79b5b3f87f98`
- `ticket.generated.5352abd871c2e9076be92a0b`
- `ticket.generated.b34238282822e93980b5f1ad`
- `ticket.generated.f32b85cbf2054fdf0114f42a`

The deterministic calculation covers all 11 declared pressure flags, scores 20/22 balanced depth and 27 pressure occurrences across four Shifts, and evaluates all 8,568 five-Ticket combinations. There is no uncovered requested top-level category. The selected five do not contain a memory-primary or thermal-primary Ticket; those are explicit pilot-depth limits rather than invented coverage gaps.

`SYSTEM-001` remains intentionally unresolved until TASK-050 compares the three architectures with sourced manual atlas evidence. No immediate owner decision was exposed by TASK-049.

Verification from the repository root:

- `node --check docs/system-models/verify-task-049.mjs` — exit `0`.
- `node docs/system-models/verify-task-049.mjs` — exit `0`; 22 passed, 0 failed; 18 released Tickets and all 8,568 five-Ticket combinations checked; repository-relative links in the task package/index/root resolve.
- `node src/story/generate-released-story-domain-coverage.mjs --check` — exit `0`; 12 Matches, 18 Tickets, 12 engine successes, and 21 minimal diagnostics; both released coverage artifacts byte-stable.
- `node --test tests/task-046-released-story-domain-coverage.test.mjs` — exit `0`; 6 passed, 0 failed, 0 skipped/cancelled/todo.
- `git diff --check` — exit `0`.

Changed files are the four navigation/status documents (`README.md`, this task, `docs/tasks/INDEX.md`, and `docs/system-models/README.md`) plus the six TASK-049 package files listed above. Viewer baseline checks are not applicable because no Viewer file changed.

Unresolved work is deliberately assigned to TASK-050: source-backed real profile selection, exact product/option research, manual illustrations, Component/relationship gap discovery, measured architecture comparison, and the `SYSTEM-001` owner decision. The mandatory stop conditions for contradictory sources, ambiguous options, insufficient Component granularity, schema pressure, gameplay-authority pressure, Candidate-closure/non-leak failures, unreviewable provenance, and projection drift are recorded in the research protocol.
