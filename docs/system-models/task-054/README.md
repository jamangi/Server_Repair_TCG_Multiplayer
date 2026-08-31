# Released Story System Model production projection

Status: **released by TASK-054 on 2026-08-31**

This package productionizes the approved curated Finder for the complete released Story denominator without adding a Ticket control or changing Match authority. The build resolves and privately validates every version-pinned TASK-053 binding, then publishes only deduplicated public projection data for the static Viewer.

## Build boundary

[`build-public-projections.mjs`](../../../content/system-model-story-v1/build-public-projections.mjs) reads the TASK-053 V2 catalog, bindings, build-only compatibility proofs, and pinned source ledger. It resolves all eighteen released Tickets twice, requires byte-identical results, and writes one complete-or-none public artifact: [`public-system-projections-v1.json`](../../../content/system-model-story-v1/public-system-projections-v1.json).

The artifact stores one public core per profile plus eighteen small Ticket contexts. It does not repeat a full topology for every Ticket. Each context contains only the public Ticket ID, opaque snapshot digest, and the versioned cache links needed to select its core. Profile cores and materialized Ticket views each have explicit content, profile, projection, canonicalization, and digest identities, so a content migration deterministically changes the cache key instead of silently reusing an older model.

The build-only compatibility catalog is never copied into `viewer/`. Public output omits resolver traces, resolver keys, rejected candidates, hidden Fault bindings, authored outcomes, private constraints, validation diagnostics, Fingerprint IDs, and cause-bearing Ticket focus copy. Every materialized view reuses the same neutral intro stored on its public profile core.

The build writes a separate author-facing [`production-build-report-v1.json`](production-build-report-v1.json) with bounded step codes, aggregate private-compatibility coverage, deterministic-build counts, fallback proof, and size measurements. That report is review evidence and is not staged to the browser.

## Browser delivery contract

[`system-model-service.mjs`](../../../viewer/js/play/system-model-service.mjs) fetches only the same-origin staged public catalog. Before any projection can render, [`system-model-catalog-validator.mjs`](../../../viewer/js/play/system-model-catalog-validator.mjs) recursively requires plain JSON objects, exact closed shapes and release cardinalities, finite bounded layout numbers, HTTPS-only source links, complete semantic references, and matching catalog/profile/projection digests and cache links. Accepted catalogs are recursively frozen; dangerous keys, custom prototypes, accessors, malformed references, and stale digests fail closed. The service exposes:

- `loadSystemModelProjectionCatalog(...)` for one version-keyed shared load;
- `getTicketSystemProjection(catalog, { ticketDefinitionId, ticketSnapshotDigest })` for synchronous lookup;
- `loadTicketSystemProjection(...)` for the combined safe path; and
- `clearSystemModelProjectionCache()` for deterministic test or migration invalidation.

A successful lookup returns `{ status: "AVAILABLE", projection }`. Absence, version mismatch, snapshot mismatch, malformed data, or fetch failure returns only `{ status: "UNAVAILABLE", message }` with the approved generic text. The schema, production builder, and runtime validator require that exact message, and unavailable results always use the module constant rather than catalog-provided copy. The service does not import the engine, Story runtime, resolver, private validation data, or vendor sources.

The materialized projection contains:

- a public Ticket pin and profile identity;
- a neutral profile-level newcomer intro plus concise and extended lifecycle descriptions;
- ordered lifecycle stages and relations;
- accessible topology nodes, typed edges and paths, and the complete ordered text equivalent;
- component role, multiplicity, optionality, replacement, and serviceability details;
- bounded rationale graphs grouped as Test, Command, Repair, and Verification;
- HTTPS learning references resolved from the approved public claim ledger; and
- explicit copy separating educational system relevance from current Match legality.

The base projection is static with respect to hidden truth and authorized Evidence. It never highlights or removes a node based on the current diagnosis. Any future Evidence overlay remains a separate projection and approval boundary.

## Staging and commands

Only `content/system-model-story-v1/public-system-projections-v1.json` is admitted from the TASK-053/054 package by [`build-play-assets.mjs`](../../../viewer/scripts/build-play-assets.mjs). The V2 catalog, bindings, coverage ledger, private proofs, migration, relationship audit, and validation reports remain outside browser-delivered assets.

From the repository root:

```powershell
npm run build:story-system-models
npm run verify:story-system-models
node viewer/scripts/build-play-assets.mjs
node viewer/scripts/verify-play-assets.mjs
node --test tests/task-054-system-model-production.test.mjs
node docs/system-models/task-054/benchmark-production.mjs
```

The visible “Show system” interaction belongs to TASK-055. This package supplies only its stable public data/service boundary.

## Measured result

- 18/18 released Story Ticket bindings resolved and 18/18 build-only compatibility summaries passed.
- Three shared profile cores produced a 1,010,455-byte public catalog (59,221 bytes gzip), avoiding 5,313,224 bytes versus eighteen repeated full projections.
- Two complete builds compared byte-identically; every author trace ended in `ONE_SOURCE_PROJECTION_ACCEPTED`.
- Missing-binding and missing-profile fixtures returned the same generic message with no projection and `gameplay_effect: NONE`.
- Malicious fallback copy, null topology, non-finite or string-injected layout, non-HTTPS sources, broken references, stale/duplicate cache identities, wrong digests, and hostile prototypes all return the same generic unavailable result before rendering.
- A local benchmark built both complete passes in 2,635.97 ms and served 1,800 version-cached lookups in 167.05 ms (0.093 ms each), including the first strict validation and freeze.
