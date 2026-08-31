# TASK-054-XHIGH: Productionize the Story System Resolver

## Status

**Completed 2026-08-31.** All eighteen released Story Tickets resolve through the TASK-053 V2 package into three deduplicated, version-cached, public-safe profile cores. The static player-data/service boundary is ready for TASK-055 and changes no Ticket, Story, or gameplay authority.

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

## Completion record

### Production resolution and projection

- [`src/system-models/production.mjs`](../../src/system-models/production.mjs) converts the approved resolver output into a closed player projection containing profile identity, a neutral profile-level newcomer intro, concise and extended lifecycle copy, ordered stages, accessible topology and text equivalent, component/service details, four action-rationale families, public learning references, and the explicit relevance-versus-legality boundary.
- [`build-public-projections.mjs`](../../content/system-model-story-v1/build-public-projections.mjs) resolves all eighteen bindings, applies all eighteen build-only compatibility proofs, renders every binding twice, rejects any byte drift, and writes one complete public catalog plus a separate bounded author report.
- [`system-model-service.mjs`](../../viewer/js/play/system-model-service.mjs) loads only the same-origin public artifact and returns exactly `{ status: "AVAILABLE", projection }` or the approved generic `{ status: "UNAVAILABLE", message }`. [`system-model-catalog-validator.mjs`](../../viewer/js/play/system-model-catalog-validator.mjs) recursively validates and freezes the closed render contract, finite layout, HTTPS sources, semantic references, and derived digest/cache links before the service caches anything.
- Ticket identity is reproduced from the immutable public `ticket_definition_id` and optional snapshot digest. Reload, isolated Story replay, pre-Match restart, and export/import therefore resolve the same binding without adding System state to gameplay saves.

### Coverage, size, and failure measurements

- 18/18 released Ticket IDs and snapshot digests match the released Story coverage denominator; 18/18 public resolutions and 18/18 private aggregate compatibility checks pass.
- Three shared profile cores serve the eighteen Ticket contexts. The deduplicated public JSON is 1,010,455 raw bytes and 59,221 gzip bytes; naïvely repeating all materialized projections would be 6,323,679 bytes. Deduplication avoids 5,313,224 bytes, or 84.0% of that repeated payload.
- Every resolution trace ends in `ONE_SOURCE_PROJECTION_ACCEPTED`. Every staged node, edge, path, lifecycle reference, role, rationale target, and claim-level learning reference resolves.
- Missing-binding and missing-profile cases both return no projection, `gameplay_effect: NONE`, and the one generic unavailable message. The schema, production build, and runtime require that exact approved copy; malicious catalog fallback text is never returned. No diagram is fabricated and ordinary Ticket play remains independent.
- A local benchmark built and compared two complete eighteen-Ticket passes in 2,635.97 ms. The version-cached browser service resolved 1,800 Ticket views in 167.05 ms (0.093 ms each), including the first strict validation and freeze, with zero vendor fetches, random choices, or gameplay mutations.

### Public/private and staging boundary

- [`public-system-projections-v1.json`](../../content/system-model-story-v1/public-system-projections-v1.json) is the only `content/system-model-story-v1/` file admitted to generated Play assets. Catalog V2 source models, public binding keys, private compatibility proofs, coverage, migration, relationship validation, and author traces remain unstaged.
- The player bundle contains no resolver key, validation trace, rejected profile candidate, hidden Fault binding, authored Evidence/Repair/Verify outcome, compatibility constraint, private diagnostic, Fingerprint ID, or cause-bearing Ticket focus copy. Runtime lookup needs only the public Ticket ID and an optional opaque snapshot digest.
- The base profile core is independent of hidden truth and active Evidence. No public node is marked failed, suspected, selected, or healthy, and System relevance never modifies current legal intents.

### Files and review evidence

- Production source and browser boundary: `src/system-models/production.mjs`, `viewer/js/play/system-model-service.mjs`, and `viewer/js/play/system-model-catalog-validator.mjs`.
- Strict public contract: [`system_model_player_projection_catalog.schema.json`](../../schemas/domain/system_model_player_projection_catalog.schema.json).
- Build, public output, staging change, and scripts: `content/system-model-story-v1/build-public-projections.mjs`, `public-system-projections-v1.json`, `viewer/scripts/build-play-assets.mjs`, generated Play manifest/output, and the `build:story-system-models` / `verify:story-system-models` package commands.
- Evidence and benchmark: [`task-054/README.md`](../system-models/task-054/README.md), [`production-build-report-v1.json`](../system-models/task-054/production-build-report-v1.json), and [`benchmark-production.mjs`](../system-models/task-054/benchmark-production.mjs).
- Regression coverage: [`tests/task-054-system-model-production.test.mjs`](../../tests/task-054-system-model-production.test.mjs), including malicious fallback, malformed render data, unsafe URL, broken-reference, stale digest/cache, and hostile-prototype cases.

No unresolved TASK-054 item remains. The visible control, dialog, interaction behavior, animation, and browser presentation remain TASK-055 scope.
