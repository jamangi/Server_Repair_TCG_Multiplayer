# Card contract and gameplay-foundation build order

Status: **Approved direction — 2026-08-23.** This analysis does not itself replace a schema, promote candidate-flow fixtures into stable content, or change a frozen rule. TASK-009 is authorized to synchronize the approved direction into versioned schemas, examples, semantic tests, and implementation.

## Approval record

The user approved the Card Definition/Card Instance contract on 2026-08-23, including the clarification that Card Instances are authoritative server state. Clients may receive audience-safe projections and submit identifier-based intents, but they cannot write owner, controller, zone, placement, or effect state.

## Recommendation

Do not build the four requested systems as four isolated, strictly sequential projects. Use a thin vertical slice, then widen it:

1. Synchronize the approved Card Definition/Card Instance contracts and author the smallest complete, stable card-and-Ticket fixture set.
2. Build the deterministic server-authoritative game engine against those fixed fixtures.
3. Add the automated-game harness as soon as that vertical slice can finish a match.
4. Build the Ticket Builder on the already-tested authored Ticket contract and engine solvability checks.
5. Expand the stable card catalog from domain objects, then run the full fixed/generated automated-game matrix and record its statistics.

This order resolves a circular dependency instead of pretending it does not exist. The engine needs executable cards and complete Tickets. Cards need an engine contract to make their effects testable. The Ticket Builder needs the authored Ticket contract plus a legal card pool and engine-level solvability oracle. Automated games are most valuable when introduced early as a regression tool, but their report is meaningful only after the Builder and representative cards exist.

The current candidate-flow cards and replays are excellent executable acceptance fixtures. Their `EX1-*` IDs and balance remain non-authoritative and must not be promoted silently.

## What a Card is

Three separate objects are easy to conflate:

| Object | Meaning | Owns |
| --- | --- | --- |
| Domain object | Reusable technical knowledge, such as `test.memory.diagnostic` or a Repair Procedure | Technical identity, relationships, educational facts, and optional technical presentation |
| Card Definition | Authored game content that lets a Player use one or more technical concepts | Stable card ID, printed cost/text, deck/archetype metadata, explicit action/target/effect binding, card presentation, and references to domain objects |
| Card Instance | One copy of a Card Definition inside one match | Match identity, owner, current location/control, and only the mutable state that the engine actually needs |

A Test domain object says what the diagnostic is capable of and what it may target. A Card Definition says how access to that diagnostic is packaged and balanced in the card game. A Card Instance says that Player A's particular copy is currently in hand, discard, deck, or an approved persistent zone.

The domain object must remain useful without the card. The Card Definition must not copy the complete technical record. The Card Instance must not copy either the technical record or the printed card definition.

## Illustration ownership and resolution

The current [`card.schema.json`](../../schemas/domain/card.schema.json) already permits `presentation.illustration`; the runtime Card Instance correctly contains no illustration. The example Card Definition also says that it reuses its referenced Test's illustration.

What is missing is a machine-readable inheritance rule. `reference_entity_ids` may contain several IDs and does not identify the primary visual source. In addition, 68 records across the current `viewer/content` packs have no illustration, so inheritance cannot be assumed to succeed for every future card.

Approved rule for publishable Card Definitions:

1. use a card-specific `presentation.illustration` when supplied;
2. otherwise inherit from an explicitly designated primary domain reference;
3. fail published-content validation when neither source resolves to an illustration with nonempty alt text.

Draft cards may use an explicit placeholder asset under content policy. The renderer may resolve presentation data, but a runtime Card Instance should still carry only `card_definition_id`.

## Assessment of the current Card Instance schema

[`card_instance.schema.json`](../../schemas/runtime/card_instance.schema.json) can represent the current simple fixture decks, hands, discards, and `in_play` list. It is not sufficient as the first-version engine contract.

### Stale or misleading vocabulary

- `exile` has no frozen first-version rule.
- `revealed` is modeled as a zone even though revealing information is an event/projection concern.
- `face_up` and `face_down` do not express authorization. The current fixture marks a private hand `face_up` and a hidden deck `face_down`, while the frozen model requires audience-safe projections regardless of a visual orientation flag.
- `ticket_area` is not the frozen name or ownership model for persistent cards.

These values should be removed unless a later rules decision gives them independent gameplay meaning. A UI may still render a card back without writing `face_down` into authoritative game state.

### Required fields

The current required list is simultaneously too broad and not strong enough:

- `counters` and `runtime_tags` are required arbitrary extension bags. Empty bags add noise, while nonempty untyped values can silently become an undocumented rules engine.
- `controller_player_id` is always required and non-null, so it cannot clearly represent the frozen cleanup case where a resolved persistent object becomes Ticket- or team-owned.
- `zone`, owner, and controller relationships are not conditionally validated.
- there is no recorded creation/source event for a persistent card.
- a Card Instance points only to a stable Card Definition ID. The match/deck snapshot does not currently pin a card-catalog content version, so a later definition edit could change an old replay's meaning.

The fields are enough to count and move simple one-shot fixture cards, but they are not sufficient to support authoritative persistence, replay, and ownership semantics.

## Approved replacement contract

The following direction is approved for synchronization during TASK-009.

### Card Definition

Retain authored identity, source/version metadata, card presentation, archetypes, cost, human-readable rules/educational text, and technical references. Replace the loose executable portion with a discriminated play contract:

```text
CardDefinition
  id
  entity_type = card
  source
  presentation
  card_type
  archetypes[]
  tags[]
  cost: 0 | 1 | 2
  rules_text
  primary_domain_reference
    entity_id
    entity_type
    role: execution | subject | requirement | reference
    inherit_illustration: boolean
  additional_domain_references[]
    entity_id
    entity_type
    role
  play_contract
    action_type
    target_spec
    prerequisites[]
    resolution[]
    disposition: discard | in_play
  educational_text_optional
  rarity_optional
```

Requirements:

- `rules_text` is presentation; the structured `play_contract` is authoritative for execution.
- `action_type` must map deliberately to the runtime intent vocabulary (`RUN_TEST`, `PERFORM_REPAIR`, `PERFORM_VERIFY`, or a narrowly defined `PLAY_CARD` effect).
- Technical execution must identify the exact Test, Command, Repair Procedure, Validation Procedure, Tool, Component, or other domain definition used by the resolver.
- `target_spec` must use explicit frozen relationships and surfaces rather than a free string or implied “other Player.”
- Each `resolution` variant must have its own allowed fields. Do not keep a generic `parameters` object as the normal escape hatch.
- Remove first-version-prohibited or nonexistent primitives such as `claim_ticket` from the accepted first-version union.
- Distinguish a Player-deck card from a Repair Ticket queue definition. A `repair_ticket` content category must not imply deck legality.
- If Technician cards ever gain mechanical behavior, first record and approve the required new rule; Qualifications remain non-mechanical.

### Card Instance

Use a small authoritative instance and make persistent placement explicit:

```text
CardInstance
  card_instance_id
  card_definition_id
  owner_player_id
  zone: deck | hand | discard | in_play
  controller_player_id: PlayerId | null
  in_play_placement: null | {
    scope: PLAYER | TEAM | TICKET
    player_id: PlayerId | null
    team_id: TeamId | null
    ticket_instance_id: TicketInstanceId | null
    created_by_event_id: EventId
  }
  effect_state: null | one approved, typed state variant
```

Conditional validation should require `in_play_placement` only in `in_play`, require exactly the identifier matching its scope, and reject it in deck/hand/discard. `controller_player_id` may be null only where the approved scope or cleanup rules permit it. If the first stable card set contains only one-shot cards, start with `effect_state: null` and add typed variants only when an approved persistent card needs them.

At the Match or immutable Ready/deck-snapshot boundary, add a pinned `card_catalog_version` (and retain `ruleset_version`). Do not repeat the catalog version on all 60 instances. The catalog version must identify immutable Card Definitions so saved games and replays cannot change when a stable card ID receives a later version.

### Server-authoritative instance boundary

`CardInstance` is authoritative server state and is never client-writable.

- A client submits an identifier-based, revision-bound intent. It does not submit a replacement Card Instance or trusted owner/controller/zone fields.
- The server derives the actor from the authenticated connection and verifies any request `player_id`; possession of an ID does not grant authority.
- The server loads the current Card Instance, validates actor, zone, controller, target, prerequisites, costs, and match revision, and then applies an approved transition.
- Owner, controller, zone, placement, and effect state may change only through server rules/effect resolution recorded in authoritative state and immutable events.
- Player and spectator clients receive only audience-safe projections. Local client tampering can at most falsify that client's temporary display; it cannot change the match and is overwritten by the next authoritative result or snapshot.
- Action-request schemas should reject unexpected Card Instance mutation fields. Server handlers must also use an explicit allowlist rather than merging client payloads into authoritative objects.

A legal control-changing card effect may request a change, but only the server decides whether that effect is approved and legal. Editing `controller_player_id` on a client never transfers control.

### Related contracts that must change together

A Card Instance replacement cannot be safe as an isolated edit. The implementation task must synchronize:

- `player_state.schema.json` zone registries or replace duplicated zone arrays with one canonical placement model;
- `match_state.schema.json` Card Definition/catalog version pinning;
- `private_player_view.schema.json` and `public_match_view.schema.json` projections;
- `action_request.schema.json` action discriminators and execution-definition binding;
- examples and semantic checks for zone exclusivity, ownership, catalog resolution, and hidden information; and
- deck validation, Search, Refresh, Document Live recovery, departure cleanup, and replay serialization.

## Ticket Builder relationship

The Ticket Builder creates validated Repair Ticket definition snapshots; it does not create Card Instances, illustrations, prose, or arbitrary card effects. It consumes authored domain relationships and rule templates under the frozen generation configuration.

The Builder should also receive or resolve an approved card-pool/deck-capability profile for solvability validation. A generated Ticket is invalid when its required Test, Isolation Evidence path, Repair, or Verify cannot be reached by the legal card pool for the selected mode. This validation is why a minimal stable card set and engine resolver should precede Builder implementation.

## Automated-game interpretation of “stall”

Pass/end turn is always legal, so “no valid moves” is not literally a frozen game state. Automated reports should distinguish:

- **proven gameplay stalemate**: the frozen §15 proof says no progress action, deterministic draw/resource change, or Ticket path can create progress;
- **policy stall**: the computer policy repeatedly passes or cycles despite a legal progress action;
- **simulation-cap stop**: an offline cap ends the run without declaring a gameplay winner;
- **invalid match**: corruption, impossible content, or failed deterministic replacement invalidates the match; and
- **successful terminal result**: the match completes through a frozen terminal condition.

This distinction answers whether play got stuck without incorrectly treating the always-legal Pass action as progress.

## Approval status and remaining blockers

The Card Definition/Card Instance and related version-pinning direction is approved. The frozen and unfrozen ledgers contain no unresolved first-version rule that blocks implementation. Content balance, AI policy quality, deployment caps, and UI layout remain their own workstreams.
