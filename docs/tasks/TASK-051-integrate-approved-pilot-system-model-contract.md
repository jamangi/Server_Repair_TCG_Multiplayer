# TASK-051-XHIGH: Integrate the approved pilot System Model contract

## Status

**Blocked on completed TASK-050 and owner approval of `SYSTEM-001`.** Do not infer the selected architecture from this task's wording.

## Objective

Implement the approved typed System Model contract and synchronize the five pilot dossiers with the domain/component network, versioned Ticket content, validators, and public/private projection boundary. Preserve prior immutable snapshots and every V0 gameplay rule.

This task establishes trusted production data. It does not yet build the full resolver/projection engine or the Ticket UI.

## Required reading

Read completely before editing:

- `AGENTS.md`, root `README.md`, this task, completed TASK-049/TASK-050, every pilot dossier/audit, and approved `SYSTEM-001`;
- current domain/runtime/client schemas, IDs, content snapshots, source records, migration/version guidance, Builder snapshots, and projection contracts;
- TASK-013/TASK-014/TASK-024 content authority, TASK-017's deferred inference boundary, and released Story immutability/migration records; and
- all schema/data/build/solvability/link tests affected by new entities or relationships.

## Typed production contract

Implement only fields justified by the pilot and approved architecture. At minimum, the contract must represent or explicitly reject the need for:

- versioned system profile identity, source/provenance basis, era/revision, and exact/generalized claim scope;
- component roles/instances or slots, stable Component IDs, multiplicity, optionality, replaceability, and public visibility;
- containment plus typed power, data, management/control, dependency, observation, and lifecycle edges;
- ordered/conditional/parallel lifecycle stages through OS handoff and bounded runtime stages;
- observation/control/intervention/verification attachment points;
- compatibility constraints and profile capabilities used by private validation;
- stable templates/tokens needed for prose, diagram, and rationale projections; and
- explicit schema/version identifiers and deterministic canonical serialization.

Do not create a second overlapping Component ontology when stable domain Component IDs suffice. If the model needs component **instances**, keep their Ticket/profile-scoped identities distinct from reusable domain Component definitions.

## Pilot domain synchronization

- Add only pilot-required Components and relationships approved from TASK-050's gap ledger.
- Preserve stable existing IDs and provide explicit migration/version records for every public contract change.
- Use typed justified relations; do not spray Component IDs across every adjacent object.
- Ensure every pilot Test/Command/Repair/Verification relation has a source-backed reason and correct directionality.
- Keep educational system relevance separate from Card legality and authored Evidence outcomes.
- Preserve earlier immutable snapshots; publish a versioned successor or overlay according to the approved migration contract rather than silently rewriting history.

## Ticket and information boundary

- Define how a Ticket snapshot carries or resolves a public system-profile identity without exposing private compatibility evidence.
- Validate hidden authored Fault/Evidence/Isolation/Repair/Verify compatibility server-side or at build time.
- Public projections may include only stable public model fields and authorized state.
- Require public-candidate closure and byte-stable public projections across hidden-truth variants in the same public equivalence class.
- Do not highlight failed components, remove alternative candidate paths, or alter a system diagram because of hidden truth.

## Validation

Add strict valid/invalid fixtures and validators for:

- referential integrity, duplicate IDs, orphan components, unsupported relation types, invalid edge endpoints, and cycles where prohibited;
- lifecycle reachability and conditional/parallel stage integrity;
- source/provenance completeness;
- Ticket hidden-path compatibility and public-candidate closure;
- private-only fields absent from public projections;
- deterministic serialization and version migration; and
- all five pilot models/components/actions exactly matching the approved atlas.

Reject complete-or-none. A model with an unresolved required component, unsupported real-world combination, dangling relation, unrenderable public field, or hidden-leak failure may not enter production content.

## Verification

- Validate all five pilot models and every new/changed domain object against strict schemas.
- Prove each pilot Ticket remains solvable through the unchanged real engine and active-deck contract.
- Prove Ticket, Builder, engine, public projection, and Story digests change only where the approved version/migration requires.
- Run schema/reference/source validators, domain and Card/Ticket suites, Builder solvability, deterministic replay, frozen campaign verification, Viewer baseline, staged-content checks, Markdown links, and `git diff --check`.
- Report commands, exit codes, pass/fail totals, changed IDs/files, migrations, source exceptions, and unresolved items.

## Allowed paths

- approved schemas/examples/validators for System Models and necessary typed domain relations;
- versioned domain/gameplay/Story overlay or successor content required for the five pilot Tickets;
- `docs/system-models/**`, provenance ledgers, migration records, focused tests/fixtures;
- generated/staged Viewer data only when required by the approved content pipeline;
- this task, `docs/tasks/INDEX.md`, approvals/decision status, and concise root/schema/domain/Story documentation.

Do not build the production resolver/view generator, change Evidence or legal-action authority, add the Ticket UI, scale beyond the five pilots, mutate prior immutable snapshots, or reactivate TASK-017.

## Completion boundary

Complete only when the approved five-system contract is strict, versioned, source-backed, domain-synchronized, migration-safe, player-safe, and independently validated while all five Tickets remain solvable under unchanged V0 authority.
