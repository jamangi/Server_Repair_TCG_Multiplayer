# TASK-004: Case-study research pilot v0.1

## Status

Completed on 2026-08-18.

## Objective

Establish a repeatable, evidence-preserving development cycle for converting real troubleshooting accounts into game-design case studies. Inventory every authoritative symptom–fault association, then research five representative associations end to end before expanding the process to the full inventory.

This task creates research and candidate material only. It does not change domain data, schemas, viewer behavior, or living decision documents.

## Authoritative data snapshot

Use repository commit `7b8c88cd64930fc6d79e4b24307431a3759aadd9` as the v0.1 domain baseline.

The authoritative content is the seven JSON packs generated into `viewer/content/manifest.json`. Obsolete `*.sample.json` packs are excluded.

Baseline counts:

| Entity type | Count |
| --- | ---: |
| Component | 22 |
| Tool | 8 |
| Command | 10 |
| Test | 24 |
| Fault causal relationship | 16 |
| Fault | 33 |
| Protocol | 12 |
| Repair Procedure | 25 |
| Validation Procedure | 13 |
| Symptom | 26 |
| **All records** | **189** |

The 26 Symptoms contain 77 unique, resolving symptom–fault associations. Every Symptom has at least one associated Fault.

Stable entity IDs are authoritative contracts. Do not rename or reinterpret them during research.

## Pilot associations

Research these five associations first:

1. `symptom.power.no_power` → `fault.power.psu.failed`
2. `symptom.boot.no_post` → `fault.memory.dimm.failed`
3. `symptom.storage.raid_degraded` → `fault.storage.sas.drive_failed`
4. `symptom.network.no_dhcp_lease` → `fault.network.dhcp.no_lease`
5. `symptom.thermal.shutdown_under_load` → `fault.thermal.heatsink.contact_poor`

These exercise different subsystems and should expose weaknesses in source selection, lifecycle reduction, and database cross-referencing before 72 more associations are researched.

## Required artifacts

Create:

```text
docs/case_studies/
├── README.md
└── v0.1/
    ├── symptom-fault-associations.json
    ├── source-ledger.md
    ├── cases/
    │   └── one Markdown file per completed pilot association
    ├── database_cross_reference/
    │   ├── found/
    │   │   └── one Markdown file per completed pilot association
    │   └── not_found/
    │       └── one Markdown file per completed pilot association
    └── candidate_materials/
        ├── domain-objects.md
        ├── cardless-actions.md
        └── decision-observations.md
```

Use Markdown for human-readable research and JSON for the machine-checkable association registry.

## Association registry

`symptom-fault-associations.json` must enumerate all 77 authoritative associations, not only the pilot.

Each entry must contain:

- a deterministic pair ID such as `sfp-001`, assigned after sorting by `symptom_id` and then `fault_id`;
- `symptom_id` and current display name;
- `fault_id` and current display name;
- research status: `backlog`, `source_selected`, `case_complete`, or `blocked`;
- whether the entry belongs to the pilot;
- case-study and cross-reference paths when those artifacts exist;
- a blocker note when status is `blocked`.

Do not copy the domain definitions into this registry. IDs and display names are sufficient for traceability.

## Source eligibility

A selected source must:

1. describe the same initial Symptom or a clearly equivalent real-world observation;
2. conclude that the paired Fault, or a clearly equivalent concrete cause, was responsible;
3. contain an actual troubleshooting or repair sequence rather than only a generic checklist;
4. have a stable, directly accessible URL;
5. provide enough evidence to distinguish source statements from researcher inference.

Prefer primary technical sources:

- a technician's or administrator's firsthand case report;
- a forum or question-and-answer thread where the original problem and confirmed resolution are preserved;
- an official vendor case, knowledge-base article, or troubleshooting narrative that reaches the paired cause.

Do not use search-result snippets, content farms, unattributed summaries, AI-generated articles, or generic listicles as case-study sources.

If no qualifying source can be found after reasonable searches, mark the association `blocked` and record the search terms and why the best candidates failed. Do not weaken the symptom–fault match or fabricate a case.

## Source selection priority

When several eligible sources exist, prefer the one that preserves the richest diagnostic reasoning. Compare candidates using:

| Criterion | Points |
| --- | ---: |
| Explicit initial observation or identification | 1 |
| Explicit competing hypothesis or suspected cause | 2 |
| One or more described Tests with interpreted results | 2 |
| Meaningful Isolation of the paired Fault | 2 |
| Described Repair | 1 |
| Explicit post-Repair Verification | 1 |
| Explicit work record or Documentation | 1 |

The exact symptom and final Fault are eligibility requirements rather than score bonuses. Record the chosen source's score and a short selection rationale in `source-ledger.md`.

The same source may support more than one association if it genuinely establishes each pair, but each association retains a separate case-study file and analysis.

## Source ledger

For each researched association record:

- pair ID;
- source title;
- author or username, when available;
- publisher or site;
- publication or update date, when available;
- access date;
- direct URL;
- source type;
- selection score;
- selection rationale;
- rejected alternatives and concise rejection reasons;
- any access, ambiguity, or preservation concern.

Do not reproduce substantial copyrighted text. Paraphrase the troubleshooting account and use only short quotations when a precise phrase is necessary.

## Lifecycle reduction rubric

Reduce the chosen account into atomic, ordered steps. Assign exactly one lifecycle category to each step:

- **Observe:** identifies what is happening, including initial symptoms, indicators, logs, or state. Treat “Identify” as Observe rather than a separate lifecycle category.
- **Hypothesize:** proposes one or more candidate explanations for the observations.
- **Test:** gathers or interprets Evidence intended to support, contradict, or distinguish candidates.
- **Isolate:** narrows the candidates to the paired actionable Fault and represents the possible transition out of Diagnosis.
- **Repair:** changes machine state to correct the isolated Fault.
- **Verify:** checks after Repair that the symptom is gone and the intended function is restored.
- **Document:** explicitly records the action, result, cause, repair, or verification in a ticket, Worklog, report, or comparable record.

Diagnosis is the umbrella process `Hypothesize ↔ Test → Isolate`; do not add Diagnose as an eighth step category.

For every step record:

- ordinal number;
- lifecycle category;
- concise paraphrase of what happened;
- how the step observes, advances Diagnosis, crosses the Isolation gateway, repairs, verifies, or documents;
- fidelity: `explicit` or `inferred`;
- a source locator such as section heading, post position, or paragraph context;
- domain phrases that should enter cross-reference analysis.

Split a source sentence into multiple case-study steps when it performs multiple lifecycle functions. Do not assign multiple categories to one step.

Do not invent missing stages. Record absent stages in a dedicated section. The publication of an article is not automatically an in-game Document step; count Document only when the troubleshooting account records work or findings explicitly.

A successful Repair does not automatically prove prior Isolation. Mark Isolate only when the source meaningfully narrows the cause through evidence, comparison, elimination, substitution, inspection, or an explicit supported conclusion.

## Case-study files

Name files with the pair ID, normalized symptom and Fault slugs, and author or username when available, for example:

```text
sfp-001--no-power--failed-psu--writer.md
```

Each file must contain:

1. pair identity using stable database IDs and display names;
2. source metadata and direct link;
3. selection rationale and score;
4. a short case synopsis;
5. the ordered lifecycle reduction;
6. lifecycle stages absent from the source;
7. explicit uncertainties and researcher inferences;
8. links to its found and not-found cross-reference files.

## Database cross-reference analysis

Cross-reference case-study phrases against the authoritative Components, Tests, Tools, Commands, Repair Procedures, Validation Procedures, and Protocols.

Do not treat Symptoms, Faults, causal relationships, or cards as cross-reference target categories in this task; the pair already identifies the Symptom and Fault.

Every found entry must include:

- source phrase;
- case-study step number;
- matched stable entity ID and entity type;
- match classification: `exact`, `generic_semantic`, or `uncertain`;
- confidence and rationale.

Map a vendor-specific product to an existing generic entity when their relevant game function is equivalent. Preserve the original phrase and explain the mapping rather than creating a false gap.

Every not-found entry must include:

- source phrase;
- case-study step number and lifecycle category;
- likely domain category or `cardless_action`;
- nearest existing entities, if any;
- why those entities are insufficient;
- whether the gap appears to be a missing object, alias, educational detail, or mechanic.

Do not create domain IDs or edit domain content during cross-referencing.

## Candidate-material generation

After all five pilot cross-references are complete, deduplicate the not-found material across cases.

`domain-objects.md` must group plausible new Components, Tests, Tools, Commands, Repair Procedures, Validation Procedures, and Protocols by lifecycle stage. Each candidate must cite the supporting case IDs, explain why existing objects are insufficient, and identify the likely schema type without inventing final fields or IDs.

`cardless-actions.md` must group possible Observe, Hypothesize, Isolate, and Document mechanics that do not fit existing domain-object schemas. Distinguish a universal action from a card-producing domain object or card enhancement.

Do not promote brand aliases, incidental narrative details, or ordinary wording differences into candidate objects.

`decision-observations.md` must collect potential rule questions exposed by the cases, including dependencies and pressured frozen or unfrozen rules. These remain research observations. Do not modify `CANDIDATE_DECISIONS.md`, `UNFROZEN_RULES.md`, `FROZEN_RULES.md`, or `UNSYNCHRONIZED_DECISIONS.md` until the user reviews them.

## Files allowed to change

- `docs/tasks/INDEX.md`
- `docs/tasks/TASK-004-case-study-pilot-v0.1.md`
- `docs/case_studies/README.md`
- `docs/case_studies/v0.1/symptom-fault-associations.json`
- `docs/case_studies/v0.1/source-ledger.md`
- `docs/case_studies/v0.1/cases/*.md`
- `docs/case_studies/v0.1/database_cross_reference/found/*.md`
- `docs/case_studies/v0.1/database_cross_reference/not_found/*.md`
- `docs/case_studies/v0.1/candidate_materials/*.md`

## Prohibited work

- Do not edit `viewer/`, `schemas/`, `tests/`, or any domain content.
- Do not rename stable entity IDs or alter the 77 baseline associations.
- Do not edit living decision documents.
- Do not add cards, domain objects, or cardless mechanics.
- Do not expand research beyond the five pilot associations in this task.
- Do not silently substitute a merely similar Fault when no exact or clearly equivalent case can be sourced.

## Verification

Before completion:

1. Parse `symptom-fault-associations.json` successfully.
2. Confirm exactly 77 unique pair IDs and unique `(symptom_id, fault_id)` combinations.
3. Confirm every registry reference resolves against the authoritative snapshot.
4. Confirm all 26 Symptoms appear in the registry.
5. Confirm exactly five entries are marked as pilot.
6. Confirm each completed pilot has one case file, one found analysis, and one not-found analysis, and that their paths agree with the registry.
7. Confirm every selected source URL was directly opened during research.
8. Confirm every lifecycle step has one permitted category and an `explicit` or `inferred` fidelity marker.
9. Confirm every cross-reference target uses an existing stable ID from an allowed entity type.
10. Run `git diff --check` and verify only allowed files changed.

Report completed, blocked, and backlog association totals separately. A blocked pilot is an acceptable research result only when its search record and rejection reasons are complete; never fabricate completion to satisfy the count.

## Completion boundary

Stop after the five-association pilot and candidate-material synthesis. Review the methodology and outputs with the user before creating a follow-on task for the remaining 72 associations.

## Completion record

- Association registry: 77 unique pairs across all 26 Symptoms.
- Pilot results: 5 `case_complete`, 0 `blocked`.
- Remaining inventory: 72 `backlog`.
- Research artifacts: five case reductions, five found analyses, five not-found analyses, one source ledger, and three candidate-material syntheses.
- Scope boundary preserved: no viewer, schema, test, domain-content, or living decision document changes.
- Follow-on research for the remaining 72 associations requires user review and a new task.
