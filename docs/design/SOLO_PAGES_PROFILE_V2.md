# Solo Pages v2 implementation profile

> **Status:** TASK-013 successor profile. This document derives the browser-local Solo product from `first-version-v2`. It does not reinterpret `solo-pages-v1` data.

## Identity and authority

| Field | Value |
| --- | --- |
| Profile ID | `solo-pages-v2` |
| Ruleset | `first-version-v2` |
| Engine projection | `engine-projection-v2` |
| Ticket Builder | `ticket-builder-v2` |
| Card catalog | `core-card-catalog-diagnosis-v2` |
| Ticket content | `core-ticket-templates-diagnosis-v2` |
| Domain snapshot | `core-domain-snapshot-v1` |
| Starter response deck | `deck.core.storage_response_v2` |
| Runtime authority | Dedicated local module Worker |
| Persistence key | `server-repair-tcg:solo-pages-v2:state` |

The Worker owns Card Instances, the persistent Diagnostic Bench, Ticket truth, candidate derivation, relevance paths, outcomes, eliminations, Isolation routes, Repair legality, Give Up, reveal scope, payment, and statistics. The document receives player-safe projections and submits only opaque legal-intent IDs.

## Fixed Solo configuration

- One human Player on the cooperative team, one through ten starting Tickets, finite queue, no score threshold, two Actions per turn, and the existing Search/Refresh resource settings.
- Six currently playable diagnostic Card Definitions are instantiated in `diagnostic_bench` and remain available for the Match. The hand and 30-card deck contain response Cards only.
- The deterministic starter deck has six copies each of Replace RAID Member, Rebuild RAID Array, Reseat Storage Cable, RAID Health Verification, and Storage Detection Verification. The v2 response-deck copy limit is six.
- Builder duplicate causal fingerprints remain disclosed and permitted for the minimal three-template migration pack. TASK-014 owns broader unique-before-repeat content.
- `GIVE_UP_TICKET` is available with explicit confirmation. It abandons only the chosen Ticket, reveals its solution privately, and lets any remaining queue continue. A Match containing Give Up is never a Solo win.

## Diagnostic Bench presentation

The saved `preferred_bench_view` is `RELEVANT` or `GLOBAL` and defaults to `RELEVANT`. The active board can switch immediately without restarting or changing the Match.

Relevant shows the public-graph-focused shelf, its count, Test/Command filtering, and `Why relevant?` paths. Global shows the full six-item playable catalog with text search, All/Test/Command, category, optional Relevant-only filter, deterministic name/type/cost sorting, result count, and eight-item pages. Search, filters, sort, page, view, and selected item persist through ordinary rerenders. The graph-incomplete notice is always available.

Both views select the same Worker-owned Bench instance and feed the same legal-action surface. The surface identifies the target Ticket, diagnostic type, Action cost, inspection affordance, and explicit Run confirmation. Bench items remain visually separate from the private Repair/Verify hand. Click, keyboard, and touch routes are equivalent; narrow layouts wrap controls; reduced motion changes only presentation; a failed Worker or missing content fails closed.

## Local data and statistics

The v2 local record versions are `solo-profile-v2`, `solo-decks-v2`, `solo-settings-v2`, `solo-statistics-v2`, and `solo-export-v2`. Settings export `preferred_bench_view`. Result ledgers add `eliminations_recorded` and `tickets_given_up`; completed result IDs still apply exactly once. Active Match state, Bench Card Instances, eliminations, authorized Evidence, and solution reveals are never written to local storage or backup export.

The v1 and v2 storage keys coexist. The client performs no implicit profile, response-deck, or statistics conversion because diagnostic deck removal and the copy-limit change have no lossless record-level interpretation. Presenting a v1 bundle to the v2 importer returns `LEGACY_PROFILE_COEXISTS` with instructions to keep the old profile and start a fresh v2 record. Unknown future versions still fail as unsupported.

## Inherited and excluded behavior

This profile inherits the `first-version-v2` Frozen Rules, including deterministic candidate/outcome validation, typed Isolation routes, accepted-Isolation Repair gateway, no-silent-action invariant, visibility, Worklog, closure, scoring, and replay rules. It has no account Equipment, server, Room, sign-in, matchmaking, spectator, reconnect persistence, competitive reveal, speculative Repair, tutorial scripting, broad diagnostic expansion, or anti-cheat claim.
