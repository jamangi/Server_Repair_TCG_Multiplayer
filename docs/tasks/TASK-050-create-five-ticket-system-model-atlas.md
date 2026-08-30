# TASK-050-XHIGH: Create the five-Ticket System Model atlas

## Status

**Completed 2026-08-30.** The manual illustration-of-concept package is in [`../system-models/task-050/`](../system-models/task-050/). `SYSTEM-001` is pending project-owner approval, so production schemas, domain integration, runtime selection, and TASK-051 remain blocked.

## Objective

Research and manually author five richly explained System Models for the reproducibly selected Story Tickets. Use them to discover real constraints, component gaps, relationship gaps, description grammar, diagram requirements, reuse opportunities, and hidden-information hazards before choosing a production architecture.

The atlas must be useful even if the eventual architecture decision rejects automated composition. It is research evidence and a blueprint, not production Ticket data.

## Required reading

Read completely before editing:

- `AGENTS.md`, root `README.md`, this task, completed TASK-049 and all of its `docs/system-models/` deliverables;
- the five selected Story Ticket snapshots, Builder provenance, public Candidates, hidden authored outcomes, solvability routes, Cards, and released coverage records;
- current domain objects and every Component relationship surface identified by TASK-049;
- source/provenance rules and relevant case-study research methods; and
- the project-owner-supplied [`system-model-host-bmc-concept.png`](../ui-plan/ui-reference_images/system-model-host-bmc-concept.png).

## Primary-source research

- For each model, start from a real documented server platform/family or a standards-defined archetype narrow enough to validate.
- Prefer manufacturer service manuals, technical guides, option/configuration matrices, firmware/management documentation, and primary standards material. Use secondary sources only to locate or contextualize primary evidence, and label them accordingly.
- Record product generation/revision, supported options, claim-level citations, access dates, exact versus generalized details, and any inaccessible or conflicting source.
- Do not treat visual resemblance, marketing copy, reseller inventories, forum anecdotes, or a search result snippet as proof that a component combination is supported.
- Do not copy vendor diagrams or branding into project illustrations. Derive original schematic diagrams from sourced facts and record that boundary.

## Five model dossiers

For each selected Ticket, create one complete dossier containing:

1. stable Ticket and proposed system-profile identity;
2. public Ticket surface and private authoring requirements in clearly separated sections;
3. real-system reference basis and source ledger;
4. component inventory with role, multiplicity, replaceability, optionality, domain Component ID, and gap status;
5. typed topology for power, management/control, host/firmware, memory, storage, network, and bounded runtime paths where applicable;
6. lifecycle from standby/management initialization through OS handoff, plus the post-boot behavior needed by the Ticket;
7. a concise newcomer-readable narrative built using TASK-049's proposed clause architecture;
8. an original accessible System Illustration and text equivalent;
9. brief rationale graphs for every Ticket-relevant Test, Command, Repair, and Verification, showing the component/path and observation/intervention reason;
10. hidden Ticket-consistency proof for all authored Evidence, Isolation, Repair, and Verification outcomes;
11. public-candidate-closure and differential non-leak analysis; and
12. known abstractions, unsupported details, and stop conditions.

The illustration may be HTML/CSS/SVG or another repository-reviewable format, but it must derive from structured dossier data rather than encode unique technical meaning only in pixels. It must distinguish containment, power, data, control/management, lifecycle order, and optional paths without relying on color alone.

## Component and relationship audit

Publish a machine-readable and human-readable matrix that classifies every modeled component role as:

- existing and sufficiently precise;
- existing but too broad or ambiguous;
- missing and required for the pilot;
- optional detail intentionally outside model scope; or
- rejected because the source or Ticket does not justify it.

For every existing or proposed Component, audit Faults, Symptoms, Tests, Commands, Repairs, and Verifications for justified missing relationships. Classify the needed relation—affected component, observed component/path, queried control surface, repair target, verified state, dependency, containment, or another TASK-049-approved type. Do not require an ID merely because an object is physically nearby.

The audit must distinguish:

- missing domain object;
- missing relationship field/schema capability;
- missing relation instance;
- relation present but too coarse;
- relation intentionally absent; and
- content that would require new gameplay authority rather than domain enrichment.

Do not mutate production domain content in this task.

## Architecture evaluation and approval gate

Use evidence from the five dossiers—not intuition alone—to compare the three TASK-049 strategies. Measure profile reuse, unique option constraints, manual authoring burden, source burden, public equivalence classes, deterministic selection, component-gap count, and the number of combinations that cannot be proved real.

Add `SYSTEM-001` to `docs/design/decisions/APPROVALS.md` with complete consequences:

- **A — Curated Finder plus deterministic projection builder (recommended unless the pilot disproves it).** Select among source-backed profiles; build prose/diagrams/rationale views from typed data.
- **B — Authored profile per Ticket or Ticket family.** Avoid general selection logic; accept greater manual duplication and simpler reality proof.
- **C — Constrained composition Builder.** Generate systems only from a closed, source-backed compatibility rule set proved by the pilot; reject unprovable combinations.

Include a stop/defer option if none is ready. TASK-051 is blocked until the project owner approves one option.

## Verification

- Validate 5/5 dossier data and render 5/5 illustrations from it.
- Reconstruct each diagram and plain-English description twice and prove byte-stable output where determinism applies.
- Prove 5/5 hidden Ticket paths are realizable and every public Candidate remains plausible in the public view.
- Run a differential hidden-truth test for each reusable public profile/equivalence class.
- Verify every technical claim maps to an accessible source ledger entry and every proposed domain relation maps to a concrete dossier need.
- Human-review diagrams at desktop, phone, 200% zoom/reflow, forced colors, keyboard, and screen-reader text-equivalent order.
- Run documentation links, any new data/schema validators, asset/provenance checks, and `git diff --check`.
- Report commands, exit codes, pass/fail totals, source exceptions, selected systems, component gaps, relationship gaps, and unresolved items.

## Allowed paths

- `docs/system-models/**` atlas, source, audit, diagram, and machine-readable pilot artifacts;
- `docs/ui-plan/ui-reference_images/**` only for derivative concept documentation, not production Viewer assets;
- `docs/design/decisions/APPROVALS.md`, decision index status, this task, `docs/tasks/INDEX.md`, and concise root documentation;
- focused validators/tests for research artifacts only.

Do not edit production domain/gameplay/Story content, engine/Builder behavior, Viewer code, generated manifests, or frozen rules. Do not implement the selected architecture before approval.

## Completion boundary

Stop when five source-backed, Ticket-consistent, public-safe illustrated models expose the real component/schema/reuse constraints; the gap matrix is reviewable; and `SYSTEM-001` gives the owner enough evidence to choose or defer a production architecture.
