# TASK-054-XHIGH: Productionize the Story System Resolver

## Status

**Planned after TASK-053.** Requires the complete released-Story model/domain package.

## Objective

Productionize deterministic System resolution and the plain-English, diagram, component, and action-rationale projections for every covered released Story Ticket. Integrate build/staging validation and safe runtime delivery without yet adding the “Show system” interface.

## Required reading

Read completely before editing:

- `AGENTS.md`, root `README.md`, this task, completed TASK-049 through TASK-053, approved System decisions, and all production System Model/domain/coverage artifacts;
- Ticket Builder/content versioning, Story Match registry, Worker/private/public projections, static Viewer staging/manifest boundaries, caching, error handling, and accessibility data contracts; and
- complete domain, engine, Story, migration, and browser test matrices affected by new public data.

## Production resolution

- Resolve the system profile deterministically from explicit Ticket construction inputs under the approved architecture.
- Persist or reproduce the selected public profile identity according to the approved snapshot/version contract; reload, replay, export/import, and Story migration must not silently select a different system.
- Emit bounded machine-readable validation traces for authors and safe generic errors for Players.
- A missing or invalid system model must not make the underlying Ticket unplayable, change its solution, or expose private diagnostics. Use the approved unavailable/fallback presentation contract.
- No production path may fetch vendor/source material or arbitrary code from the network.

## Production projections

Build and stage, from one canonical public model:

- concise and extended plain-English system/lifecycle descriptions;
- accessible responsive topology data plus complete text equivalent;
- component-role and serviceability details;
- bounded action-rationale graphs; and
- provenance-safe learning references appropriate for the Library/UI without exposing private authoring validation.

Label educational applicability independently from current legality. If an action is relevant to the system but unavailable in the current Match phase, the public data must not imply it can be played now.

Public output must be static with respect to hidden truth. Authorized Evidence may be discussed elsewhere in the Ticket UI, but the base System Model may not highlight or animate the secretly failed component. Any future evidence-overlay concept requires a separate projection task and approval.

## Build and staging contract

- Add deterministic source/model validation to the existing content build pipeline with complete-or-none failure.
- Preserve `viewer/` as the static Pages root and keep generated manifests generated.
- Use dependency-free production code and existing content-loading conventions.
- Cache by explicit content/profile/projection version; invalidate deterministically on migration.
- Keep private validation artifacts out of browser-delivered content unless they are proven public-safe and required.

## Verification

- Resolve and build every declared released Story Ticket/profile twice with byte-identical public output.
- Assert every public node, edge, sentence token, rationale path, Component ID, and source reference resolves.
- Prove private constraints, hidden Faults, authored outcomes, and rejected profile candidates are absent from staged/public assets.
- Complete the twelve-episode campaign, all isolated replays, reload/pre-Match restart, migration, and export/import with stable selected profiles.
- Verify invalid/missing-profile behavior leaves Matches playable and produces no fabricated diagram.
- Run all System Model/domain/source/build/staging tests, Viewer baseline checks, Story/Ticket/Builder/engine suites, frozen campaigns, asset/manifest verification, browser smoke coverage, Markdown links, and `git diff --check`.
- Report commands, exit codes, pass/fail totals, exact Ticket/profile coverage, staged files, performance/size, fallback cases, and unresolved items.

## Allowed paths

- production System resolver/projection/build/staging modules and public-safe data contracts;
- versioned System Model/domain/Story mapping content from TASK-053;
- static Viewer content/staging scripts and generated outputs required by the approved build;
- focused tests/fixtures, performance/coverage reports, and `docs/system-models/**`;
- this task, `docs/tasks/INDEX.md`, and concise root/system/Story/Viewer documentation.

Do not add the visible Ticket control/modal, change existing Ticket/Story gameplay, deliver private validation data, add runtime network access, or infer Evidence/legal actions from topology.

## Completion boundary

Complete only when every covered released Story Ticket has a stable, player-safe, build-validated System projection ready for UI consumption; private compatibility data stays private; failures degrade honestly; and all existing gameplay and Story paths remain unchanged.
