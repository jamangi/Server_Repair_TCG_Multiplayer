# Solo Pages v1 implementation profile

> **Status:** TASK-010 implementation profile. This document derives a browser-local solo product configuration from the frozen `first-version-v1` ruleset. It does not copy, fork, or override the Frozen Rules ledger.

## Identity and authority

| Field | Value |
| --- | --- |
| Profile ID | `solo-pages-v1` |
| Ruleset | `first-version-v1` |
| Engine projection | `engine-projection-v1` |
| Ticket Builder | `ticket-builder-v1` |
| Card catalog | `core-card-catalog-v1` |
| Ticket content | `core-ticket-templates-v1` |
| Domain snapshot | `core-domain-snapshot-v1` |
| Runtime authority | A dedicated module Worker in the local browser |
| Persistence authority | A versioned, validated `localStorage` record controlled by the same browser user |

The Worker owns the authoritative Match aggregate and accepts only revision-bound legal intents selected by opaque intent identifier. The document receives player-safe projections and events. It never receives the Match aggregate, Ticket truth, deck order, or the Builder result. Browser developer tools can still inspect or alter downloaded code and local data; this profile makes no anti-cheat, account-integrity, competitive-security, or server-persistence claim.

## Inherited gameplay

Unless this document explicitly says that a server-only feature does not apply, play inherits the complete `first-version-v1` behavior, including:

- a 30-card legal deck, maximum three copies, five-card opening hand, start-turn draw, and two Actions;
- zero-Action card-name limits, deterministic Search and Refresh, discard and recovery behavior, and authoritative card zones;
- shared Tickets, Evidence-driven Hypothesis and Test iteration, accountable Isolation, machine-changing Repair, post-Repair Verify, failed Verify returning to Diagnosis without erasing history, and Documentation;
- immutable Worklog chronology, immediate closure resolution, finite-queue termination, and the frozen causal-contribution scoring rubric; and
- player-safe projections, semantic events, result reasons, contribution attribution, and statistics.

Observe, Hypothesize, Test, Isolate, Repair, Verify, and Document are labels for contributions to one evidence loop, not seven lanes or a one-way state machine.

## Fixed solo configuration

- One human Player, `player.solo`, on the single cooperative team `team.cooperative`.
- No computer-controlled seat or opponent.
- Between 1 and 10 starting Tickets, selected before Match creation.
- `queue_minimum = 0`; no replacement Tickets are added.
- `termination_score = -1`; score does not end the Match.
- Three starting Search Tokens, one Search Token granted per closure up to five, and one Refresh Token up to one.
- One active legal local deck is snapshotted at Match start.
- Builder duplicate causal fingerprints are allowed for every 1–10 Ticket request, as approved for this training profile. Queues above one disclose that structures may repeat; queues above three necessarily repeat because the pinned pack has three templates.
- The local browser clock supplies authoritative timestamps for this environment. Match state is intentionally not resumable after reload or navigation away.

## User settings

The user may change only presentation or setup choices that do not alter frozen play:

- profile display name and one bundled appearance-only SVG icon;
- active legal saved deck;
- starting Ticket count from 1 through 10;
- motion preference (`SYSTEM`, `FULL`, or `REDUCED`); and
- optional drag affordances. Every drag action has the same click and keyboard route, and the engine still decides legality.

Profile Level is derived, never stored: `max(0, floor(lifetime_service_points_gained / 10))`.

## Persistence and portability

The client stores a versioned local profile, deck collection, active deck ID, settings, processed Match-start IDs, processed result IDs, and aggregate statistics. It does not store an active Match. Every read and import is schema- and semantic-validated before use.

Backup export omits Match state. Import is an atomic whole-record replacement after validation, preview, explicit confirmation, and an offer to download the current record. Corrupt, oversized, incompatible, prototype-polluting, unknown-field, unknown-ID, and illegal-deck payloads are rejected without partial writes. Imported totals are labeled local and user-controlled.

## Features that do not apply

This profile has no server, Room, account sign-in, matchmaking, Ready state, private opponent hand, connection lifecycle, reconnect cursor, spectator, turn timer, grace window, disconnect, concession, computer replacement, shop, currency, ownership economy, or multiplayer ranking. Their absence does not relax any deck, Evidence, Isolation, Repair, Verify, Documentation, closure, scoring, or Builder rule that does apply.

## Presentation policy

Library and Play are persistent top-level areas of one static GitHub Pages client. Play uses the original Night-Shift graphite/navy, vellum, family-color, depth, and motion system documented in the TASK-010 references. Ticket/Card/Evidence/Worklog/basic-action shapes communicate different roles. Artwork may use stable, category-specific SVG placeholders until TASK-011; a missing asset degrades to an intentional fallback with useful alternate text.

Motion explains an already-resolved semantic event and never gates authoritative state. Reduced motion removes travel, spring, stagger, and pointer tilt while preserving immediate state, focus, and live announcements.

## Change control

Any gameplay behavior that conflicts with `first-version-v1` must be recorded as pressure in `UNFROZEN_RULES.md` and stopped at that boundary. Product presentation, local portability, and browser-security limitations may evolve through a new profile version without silently changing frozen gameplay.
