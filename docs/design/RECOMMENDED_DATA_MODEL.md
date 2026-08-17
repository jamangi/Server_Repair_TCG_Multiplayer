# Recommended Configurable-Match Data Model

This is an architectural recommendation. It is not yet a frozen runtime schema.

## Design principles

- Represent players as ordered collections keyed by stable IDs; never use `player1`, `player2`, or a hardcoded eight-seat shape.
- Separate player-selected match settings from server-administered capabilities.
- Separate authoritative state from player-safe views.
- Record scoring as immutable events and derive player/team totals and statistics from that ledger.
- Compose queue, scoring, clocks, and termination as policies rather than one monolithic mode switch.
- Use seeded or injectable randomness so ticket generation is reproducible in tests.

## Server capabilities

```text
ServerMatchCapabilities
  max_players_per_match: integer                 // M
  disconnect_grace_seconds: integer              // W
  max_starting_tickets: integer
  max_queue_minimum: integer
  allowed_presets: MatchPresetId[]
  allow_custom_matches: boolean
```

`M` and `W` are server-administered. Resource limits may be stricter than the broad domain ranges accepted by offline tools.

## Match configuration

```text
MatchConfiguration
  collaboration_mode: competitive | cooperative
  termination_score: integer                     // X; -1 disables
  starting_ticket_count: integer                 // S
  queue_minimum: integer                         // Q
  seat_limit: integer                            // SL
  turn_time_limit_seconds: integer | null        // T
  player_time_limit_seconds: integer | null      // PT default
  player_overrides: PlayerSetup[]
  preset_id: string | null
  rules_version: string
```

```text
PlayerSetup
  player_id: PlayerId
  seat_index: integer
  team_id: TeamId
  starting_service_points: integer               // H(p)
  player_time_limit_seconds: integer | null       // optional PT(p)
  controller_type: human | computer
```

The server validates `player_count <= seat_limit <= max_players_per_match` before starting.

## Match state

```text
MatchState
  match_id: MatchId
  configuration: MatchConfiguration
  status: setup | active | resolving | complete | invalidated
  ordered_player_ids: PlayerId[]
  players_by_id: Map<PlayerId, PlayerState>
  teams_by_id: Map<TeamId, TeamState>
  active_ticket_ids: TicketInstanceId[]
  tickets_by_id: Map<TicketInstanceId, TicketState>
  ticket_policy_state: TicketPolicyState
  turn_state: TurnState
  score_ledger: ScoreEvent[]
  event_log: GameEvent[]
  result: MatchResult | null
  revision: integer
```

## Players and teams

```text
PlayerState
  player_id: PlayerId
  seat_index: integer
  team_id: TeamId
  controller_type: human | computer
  status: active | disconnected | conceded | exhausted
  starting_service_points: integer
  displayed_service_points: integer
  hand: private CardInstance[]
  deck: private CardInstance[]
  discard: CardInstance[]
  clock: PlayerClockState
  disconnect_deadline: timestamp | null
```

```text
TeamState
  team_id: TeamId
  member_player_ids: PlayerId[]
  displayed_service_points: integer
  status: active | conceded | exhausted
```

For the first release, competitive matches may create one team per player while cooperative matches create one shared team. This representation leaves room for later team-versus-team formats without changing player identity.

## Ticket policy state

```text
TicketPolicyState
  created_ticket_count: integer
  closed_ticket_count: integer
  next_ticket_sequence: integer
  random_seed_reference: string
  generator_version: string
```

The queue policy is one deterministic transition:

```text
reconcileQueue(state, configuration, randomSource)
  if configuration.queue_minimum == 0:
    create nothing
  otherwise:
    create tickets until active_ticket_count >= queue_minimum
```

Setup separately creates `starting_ticket_count` tickets. There are no Ace- and Cleaner-specific policy classes.

## Scoring

```text
ScoreEvent
  score_event_id: EventId
  sequence: integer
  reason_code: string
  points: integer
  player_id: PlayerId | null
  team_id: TeamId | null
  ticket_instance_id: TicketInstanceId | null
  source_event_id: EventId
```

The exact cooperative aggregation rule remains unfrozen. Regardless of the chosen rule, totals should be projections of `ScoreEvent` records rather than independently mutable counters.

## Turns and clocks

```text
TurnState
  round_number: integer
  turn_number: integer
  active_player_id: PlayerId
  active_roster_index: integer
  phase: string
  turn_started_at: timestamp
  turn_deadline: timestamp | null
  last_clock_accounted_at: timestamp
```

```text
PlayerClockState
  enabled: boolean
  remaining_milliseconds: integer | null
  running_since: timestamp | null
```

The server, not a browser timer, is authoritative for `T`, `PT`, `W`, and all expiration events.

## Termination evaluation

Use a pure evaluator after every complete resolution transaction:

```text
evaluateTermination(matchState) ->
  continue
  | CompleteMatch(reason, winningPlayerIds, winningTeamIds)
  | InvalidMatch(reason)
```

Suggested policy composition:

```text
MatchRules
  configurationValidator
  ticketPolicy
  scoringPolicy
  clockPolicy
  concessionPolicy
  terminationPolicy
  statisticsProjector
```

The precedence among score, empty queue, concession, exhaustion, and administration remains to be frozen in the normative match contract.

## Match result and statistics

```text
MatchResult
  reason: score_reached | queue_empty | last_eligible | all_conceded |
          exhausted | administrator_terminated | invalidated
  winning_player_ids: PlayerId[]
  winning_team_ids: TeamId[]
  final_player_scores: Map<PlayerId, integer>
  final_team_scores: Map<TeamId, integer>
  completed_at: timestamp
  statistics: MatchStatistics
```

```text
MatchStatistics
  players: Map<PlayerId, PlayerPerformance>
  teams: Map<TeamId, TeamPerformance>
  match_totals: MatchTotals
```

Statistics should be derived from the authoritative event log and score ledger. The exact metric catalog remains unfrozen.

## Player-safe projections

```text
PublicMatchView
  safe configuration and preset label
  roster, teams, public statuses, and public clocks
  active tickets and public progress
  public scores
  current turn and deadlines
  public result and statistics
```

```text
PrivatePlayerView extends PublicMatchView
  authenticated player's hand and legal actions
  private knowledge and evidence
  private rejection context
  reconnect synchronization metadata
```

Neither projection may expose hidden ticket faults, another player's private hand, private hypotheses, server random state, or secrets used to resume sessions.
