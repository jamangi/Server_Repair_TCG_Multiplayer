# Candidate gameplay flows v0.0

> **Status: non-authoritative example package.** These documents apply the [Candidate-Frozen Example Profile v0.0](v0.0_ex1_decisions.md) only to the named fixtures. They do not freeze rules, approve balance, add stable domain IDs, define schemas, settle canon, or require an implementation.

This directory is a replayable design probe for Server Repair TCG. It asks whether one finite card-game ruleset can support an iterative troubleshooting practice, a campaign journey, and synchronized multiplayer without turning the lifecycle into seven isolated departments or a one-way state machine.

```text
Observe -> Hypothesize <-> Test -> Isolate -> Repair -> Verify -> Document
                         ^                         |
                         `---- failed Verify -----'
```

Hypothesize and Test are the repeatable heart of Diagnosis. Isolate is an evidence-citing commitment to an actionable fault. Repair changes machine state but does not prove the explanation. A failed Verify is a valid event that can preserve the repair and reopen Diagnosis. Document publishes an attributable account without rewriting the order in which events happened.

The synchronized replays use frozen zero-Action, non-scoring closure and instantiate the frozen causal rubric: one point for the required actionable Isolation and one for its necessary Repair, settled only at closure. The package contains no account/loadout Equipment mechanic. Qualifications appear only as recognition-only honor badges, while cosmetics remain non-mechanical.

## Recommended reading order

1. [`v0.0_ex1_decisions.md`](v0.0_ex1_decisions.md) — the temporary decisions, inherited authority, alternatives, risks, and review boundary.
2. [`v0.0_ex1_board_and_cards.md`](v0.0_ex1_board_and_cards.md) — the shared board, card grammar, Ticket fixtures, decks, and deterministic shuffles.
3. [`v0.0_ex1_cards_gameplay_examples.md`](v0.0_ex1_cards_gameplay_examples.md) — two complete tabletop-style card games, one cooperative and one competitive.
4. Focused application flows:
   - [`v0.0_ex1_deckbuilding_examples.md`](v0.0_ex1_deckbuilding_examples.md)
   - [`v0.0_ex1_equipping_examples.md`](v0.0_ex1_equipping_examples.md)
   - [`v0.0_ex1_story_gameplay_examples.md`](v0.0_ex1_story_gameplay_examples.md)
   - [`v0.0_ex1_multiplayer_gameplay_examples.md`](v0.0_ex1_multiplayer_gameplay_examples.md)
5. End-to-end journeys:
   - [`v0.0_ex1_full_campaign.md`](v0.0_ex1_full_campaign.md)
   - [`v0.0_ex1_full_multiplayer.md`](v0.0_ex1_full_multiplayer.md)
   - [`v0.0_ex1_full.md`](v0.0_ex1_full.md), the combined product walkthrough.

The focused documents expose one subject at a useful level of detail. The full journeys reuse the same named fixtures but repeat the state needed to understand each journey without opening another file. If a summary differs from the decisions document, the summary is an error in this example package; neither document can override the repository's frozen rules.

## Shared fixture index

All identifiers beginning `EX1-` are local to this package and non-contractual.

| Fixture | Purpose | Defined in |
| --- | --- | --- |
| `EX1-PROFILE-V0.0` | Temporary configuration and action rules | [Decisions](v0.0_ex1_decisions.md) |
| `EX1-BOARD` | Shared Ticket surface plus per-player zones; not seven lifecycle lanes | [Board and cards](v0.0_ex1_board_and_cards.md) |
| `EX1-DECK-BENCH-HARDWARE` | Thirty-card hardware-oriented repertoire | [Board and cards](v0.0_ex1_board_and_cards.md) |
| `EX1-DECK-SYSTEMS-FIELD` | Thirty-card network, storage, and field repertoire | [Board and cards](v0.0_ex1_board_and_cards.md) |
| `EX1-SHUFFLE-G1-A` / `G1-B` | Cooperative card-game deterministic hands and draws | [Board and cards](v0.0_ex1_board_and_cards.md) |
| `EX1-SHUFFLE-G2-A` / `G2-B` | Competitive card-game deterministic hands and draws | [Board and cards](v0.0_ex1_board_and_cards.md) |
| `EX1-TICKET-SFP012-NO-POST` | Case-backed failed-DIMM Ticket | [Board and cards](v0.0_ex1_board_and_cards.md) |
| `EX1-TICKET-SFP030-NO-DHCP` | Case-backed exhausted-DHCP-pool Ticket | [Board and cards](v0.0_ex1_board_and_cards.md) |
| `EX1-TICKET-SFP039-NO-POWER` | Case-backed failed-PSU Ticket | [Board and cards](v0.0_ex1_board_and_cards.md) |
| `EX1-TICKET-SFP057-RAID-CASCADE` | Case-backed multi-member RAID Ticket and failed-Verify loop | [Board and cards](v0.0_ex1_board_and_cards.md) |
| `EX1-TICKET-SFP076-THERMAL-CONTACT` | Case-adapted thermal-contact Ticket with authored disambiguation | [Board and cards](v0.0_ex1_board_and_cards.md) |
| `EX1-TICKET-SYNTH-BOOT-CABLE` | Clearly synthetic stable-domain-data Ticket | [Board and cards](v0.0_ex1_board_and_cards.md) |
| `EX1-ACCOUNT-MARA` / `EX1-ACCOUNT-DEV` | Example-local campaign and multiplayer accounts | [Full campaign](v0.0_ex1_full_campaign.md) / [full multiplayer](v0.0_ex1_full_multiplayer.md) |
| `M-01` through `M-15` | Semantic Motion patterns and reduced-motion equivalents | [Decisions](v0.0_ex1_decisions.md#presentation-and-motion-contract-for-the-examples) |

The five `SFP` Tickets preserve their case-study provenance. Outcomes strengthened or separated to make deterministic play possible are labeled **Authored fixture**, not attributed to the source. The sixth Ticket is synthetic; it uses existing domain concepts but is not a researched case.

## How to use the examples

- Use the decisions document to challenge the temporary rules, not to promote them silently.
- Use the deterministic deck orders and final-state audits to reproduce arithmetic or locate contradictions.
- Use focused UI flows to discuss one interaction without inheriting an entire product specification.
- Use the full journeys to check continuity: ownership, deck choice, recognition and appearance, story context, match synchronization, results, return paths, and logout.
- Send any accepted change back through the normal decision, content, schema, story, or implementation lifecycle.

## Deliberate boundaries

TASK-007 supplies generic runtime contracts for team-only visibility, returned Diagnosis, Commit Isolation, Document Live, Search, Refresh, zero-Action closure, and winner arrays. This package remains a non-authoritative set of fixture-specific replays and UI hypotheses: it does not define production content, client behavior, configurable-match policy, or viewer data.

The future React client and Motion behavior are descriptive interaction hypotheses. Authoritative events come from game state; animation callbacks never decide rules, spend resources, or advance a turn. Every material motion has a reduced-motion equivalent, and state is also conveyed through text, shape, placement, and accessible announcements.

The campaign's *Quiet Cascade* remains technically unresolved. SIFT, story dialogue, AI assistance, spectators, and decorative interface behavior receive only player-safe projections and cannot disclose the server-only answer.

## Package contract

This package was produced under [`TASK-006`](../tasks/TASK-006-candidate-gameplay-flows-v0.0.md) and synchronized to approved rules under [`TASK-007`](../tasks/TASK-007-synchronize-approved-gameplay-rules.md). Its completion checks cover link resolution, domain-reference resolution, deck and Action arithmetic, zero-Action closure, pending-contribution settlement, Ticket counts, round and turn order, visibility, reconnect and stale-action behavior, Worklog chronology, full-journey continuity, removal of account Equipment, non-mechanical Qualifications, reserved story truth, and changed-file scope.
