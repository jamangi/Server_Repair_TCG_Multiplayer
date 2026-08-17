# Documents To Update For Configurable Matches

This is a migration map, not a second source of game rules. Normative decisions should live in a dedicated match contract, while unresolved decisions remain in `UNFROZEN_RULES.md`.

## Recommended new normative document

Create `08_MATCH_CONFIGURATION_AND_RESULTS.md` after the currently unfrozen match rules are sufficiently decided. It should own:

- match configuration and validation,
- competitive and cooperative scoring,
- ticket replenishment,
- turn order for arbitrary player counts,
- timers and disconnection,
- concession and exhaustion,
- terminal-condition precedence,
- winners and ties,
- end-of-match statistics.

Create `09_ROOM_LIFECYCLE_AND_COMMANDS.md` to own Room membership, Player and Spectator roles, capacity, readiness, socket subscription, concession-to-spectator transitions, leaving, bots, and live-versus-offline lifecycle rules.

## Existing design documents

### `00_GAME_ENGINE_OVERVIEW.md`

Replace fixed two-player, 10-point, and mandatory-draw-loss language with a summary that references the new match contract. Preserve the troubleshooting loop. Add configuration-driven victory and queue behavior.

### `01_DATA_ARCHITECTURE.md`

Add the structures proposed in `RECOMMENDED_DATA_MODEL.md`. Replace singular winner and two-player assumptions with rosters, teams, score ledgers, ticket policy state, clocks, concessions, and result records.

### `02_CARD_TYPES.md`

Audit prose and structured effects for assumptions such as "the other player." Define explicit target relationships: self, ally, opponent, own team, opposing team, any player, and ticket targets. Technical card families otherwise remain valid.

Clarify that Search Tokens and Deck Refresh Tokens are system utility resources rather than ordinary cards unless a later rule explicitly creates card versions of those effects.

### `03_FAULT_CATALOG_V0_1.md`

No fundamental technical change. Audit any scoring, ticket ownership, or single-investigator language introduced later.

### `04_COMPONENT_CATALOG_V0_1.md`

No fundamental technical change. Ensure component state is ticket-scoped rather than player-count dependent.

### `05_TESTS_TOOLS_COMMANDS_V0_1.md`

Audit gameplay effects for shared tickets, team-visible evidence, contribution attribution, and target legality with more than two players.

### `06_IMPLEMENTATION_AND_CONTENT_VALIDATION.md`

Add configuration validation and a behavior matrix covering:

- competitive and cooperative matches,
- finite queues (`Q = 0`) and replenishing queues (`Q > 0`),
- score targets enabled and disabled,
- positive and negative handicaps,
- timer combinations,
- disconnection and concession,
- player counts from one through the supported server maximum,
- ties, simultaneous score events, exhaustion, and stalemates.

Tests should use small representative player counts plus boundary tests rather than exhaustively simulating every value through 99.

### `07_FAULT_BROWSER_AND_SEARCH.md`

Define whether discoveries and browser access are private, team-shared, public, or mode-dependent. The underlying technical graph does not change.

## Schema notes

### `docs/schema-notes/RUNTIME_SCHEMAS.md`

Document configuration, teams, score events, clocks, player status, ticket policy state, terminal evaluation, and results. Remove wording that implies exactly two players.

### `docs/schema-notes/SERVER_AUTHORITY.md`

State that the server owns clocks, disconnect deadlines, random ticket generation, queue replenishment, scoring, concessions, and terminal-condition ordering. Clients submit intentions and display player-safe projections only.

### `docs/schema-notes/DOMAIN_SCHEMAS.md`

No core change unless ticket generation gains new weighting or mode-eligibility metadata.

## Runtime schemas

The following schemas require a later, explicitly scoped migration:

| Schema | Expected change |
|---|---|
| `match_state.schema.json` | Configuration, teams, roster order, ticket policy state, multiple winners/results, and clocks. |
| `player_state.schema.json` | Team, seat, status, handicap/effective starting score, clocks, concession metadata, and performance counters if not derived separately. |
| `turn_state.schema.json` | Arbitrary roster order, round semantics, deadline, and clock state. |
| `public_match_view.schema.json` | Safe configuration, roster/team scores, player statuses, public deadlines, and terminal result. |
| `private_player_view.schema.json` | Player-specific clock, legal actions, private evidence, and reconnect information. |
| `game_event.schema.json` | Team/score/timer/disconnect/concession/termination events and visibility. |
| `action_request.schema.json` | Concede and any timer- or ticket-claim-related intentions. |
| `action_result.schema.json` | Configuration-aware rejection reasons and terminal results. |
| `ticket_state.schema.json` | Contribution attribution, claim/control rules, and replenishment provenance if required. |

Stable IDs must not be renamed without an explicit migration task.

## Examples and tests

- Add valid and invalid match-configuration fixtures.
- Add solo, competitive, and cooperative runtime examples.
- Add finite, replenishing, and endless-by-configuration match examples.
- Add negative-handicap and near-target starting-score examples.
- Add timer, disconnect, concession, and reconnect event sequences.
- Add deterministic seeded ticket-generation fixtures.
- Add result and statistics fixtures derived from event logs.

## UI documents to add later

- Match setup requirements, including presets and advanced settings.
- Queue virtualization/pagination behavior for large `S` and `Q`.
- Multiplayer roster, team, clocks, and connection-state display.
- Result and statistics screen behavior.
- Warnings for potentially long or resource-intensive configurations.

## Recommended implementation order

1. Resolve the terminal-condition and cooperative concession questions in `UNFROZEN_RULES.md`.
2. Write `08_MATCH_CONFIGURATION_AND_RESULTS.md` as a SHALL-based contract.
3. Add schema fixtures and failing validation tests.
4. Migrate runtime schemas without changing the domain catalogs.
5. Implement a pure configuration validator.
6. Implement composable `TicketPolicy`, `ScoringPolicy`, `ClockPolicy`, and `TerminationPolicy` functions.
7. Update public/private projections.
8. Add setup and result UI only after engine behavior is proven.
