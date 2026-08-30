# TASK-051-XHIGH: Integrate the approved pilot System Model contract

## Status

**Completed 2026-08-30.** `SYSTEM-001` Option A was explicitly approved by the project owner, and the bounded Finder-first contract plus deterministic public binding data are released for exactly the five TASK-050 pilots.

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

## Completion record

### Released contract

- Two canonical profiles are published under `content/system-model-pilot-v1/`: Dell PowerEdge R740xd Hybrid 24x2.5 and Dell PowerEdge R740xd2 Power Interposer.
- Exactly five immutable released Ticket snapshots receive public bindings; their hidden compatibility proofs remain in a separate build/server-only artifact.
- The public contract covers eight declared planes, typed profile-local roles/nodes/edges/paths, lifecycle stages, observation and service surfaces, Finder capabilities, deterministic presentation tokens/templates, source claims, and 51 authority-bounded action attachments.
- The exact sixteen TASK-050 relationship findings are dispositioned by the versioned overlay. Fifteen are profile-scoped and one symptom relationship remains deliberately unbound because symptom relevance does not justify Component authority.
- Complete-or-none validation rejects structural, reference, cycle, lifecycle, provenance, compatibility, candidate-closure, migration, determinism, and public/private-boundary failures.

### Changed public IDs and migration

- Added `component.firmware.system_bios`.
- Added `component.storage.pcie_nvme_interconnect`.
- Preserved `component.power.distribution_board` for the exact Power Interposer Board profile role rather than creating an overlapping Component definition.
- No existing stable ID, Ticket snapshot, Builder output, gameplay catalog, Evidence outcome, Story snapshot, or replay artifact changed. `migration-v1.json` pins the prior hashes and records the successor-overlay mapping.

### Files

- Contract, bindings, private proofs, relationship overlay, migration, manifest, deterministic generator, and validator: `content/system-model-pilot-v1/**`.
- Strict schemas: `schemas/domain/system_model_catalog.schema.json`, `ticket_system_binding_catalog.schema.json`, `system_model_private_validation_catalog.schema.json`, `system_model_relationship_overlay.schema.json`, `system_model_migration.schema.json`, and `system_model_release_manifest.schema.json`.
- Strict examples: `examples/system-models/valid/**` and `examples/system-models/invalid/**`.
- Generated Viewer Component successor pack: `viewer/content/system-model-pilot-v1-components.json` plus regenerated `viewer/content/manifest.json`.
- Release and migration documentation: `docs/system-models/task-051/**`; synchronized approval, decision, task, schema, domain, Story, and root indexes/readmes.
- Focused regression coverage: `tests/task-051-system-model-contract.test.mjs`, with schema-count/status synchronization in the existing TASK-007/TASK-050 suites.

### Source and abstraction exceptions

- The exact R740xd2 Power Interposer Board role uses the existing broader `component.power.distribution_board` definition; the profile-local role carries the exact label and de-energization constraint.
- The R740xd SAS HDD role intentionally retains the established grouped SAS/SATA Component definition, while source claims constrain this profile to SAS HDD behavior.
- Grouped host loads remain a bounded topology abstraction rather than invented rail-level electrical detail.
- Manufacturer web sources are mutable external publications, but every used claim, revision/access date, scope, and committed TASK-050 ledger hash is pinned.

No unresolved TASK-051 item remains. A production resolver/view generator, Ticket UI, broader rollout, and any later `SYSTEM-002` policy remain explicitly outside this task.

### Verification

All commands completed with exit code 0:

- `node viewer/scripts/build-manifest.mjs` — generated 10 Viewer packs.
- `node content/system-model-pilot-v1/build-release.mjs --check` — 19 deterministic files matched.
- `node content/system-model-pilot-v1/validate-release.mjs` — accepted 2 profiles, 5 public bindings, 5 private proofs, 16 relationship findings, and 2 added Components.
- `node --check viewer/js/app.js`, `node --check viewer/js/data-loader.js`, and `node --check viewer/js/entity-types.js` — syntax clean.
- `node --test tests/viewer-baseline.test.mjs` — 3 passed, 0 failed.
- `node --test tests/task-007-schema-contracts.test.mjs tests/viewer-content-schema.test.mjs tests/task-050-system-model-atlas.test.mjs tests/task-051-system-model-contract.test.mjs` — 46 passed, 0 failed.
- `node --test --test-reporter=tap tests/*.test.mjs` — 383 passed, 0 failed.
- `node viewer/scripts/build-play-assets.mjs` and `node viewer/scripts/verify-play-assets.mjs` — 197 deterministic staged Play assets built and verified.
- `node tools/run-automated-games.mjs --verify-report automated_games/task-009-foundation-v1` — 22 rows verified (12 successes, 10 retained exceptions), 0 deterministic mismatches.
- `node tools/run-task-014-campaign.mjs --verify-report automated_games/task-014-playable-coverage-v3` — 13 rows verified, 0 deterministic mismatches.
- `git diff --check` — clean.
