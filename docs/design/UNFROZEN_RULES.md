# Unfrozen Rules

This document is the canonical inventory of game rules that remain open to design or playtesting. It prevents unresolved decisions from being silently embedded in schemas, cards, user-interface code, or server behavior.

## 1. Frozen direction: one configurable match system

There is no separate Ace Mode or Cleaner Mode in the rules engine. A match is configured through one `MatchConfiguration`. "Ace" may remain an informal development nickname for this configurable system.

The current configuration vocabulary is:

| Symbol | Recommended field name | Meaning |
|---|---|---|
| `X` | `termination_score` | Score objective. `-1` disables score-based termination. Otherwise the first eligible player or team to reach it wins. |
| `S` | `starting_ticket_count` | Number of active tickets created at match start. |
| `Q` | `queue_minimum` | Refill floor. After resolution, the server creates tickets until the active queue contains at least this many. Zero disables replenishment. |
| `H(p)` | `starting_service_points_by_player[p]` | Starting Service Points for player `p`. |
| `T` | `turn_time_limit_seconds` | Maximum wall-clock duration of one turn. `null` disables it. |
| `PT(p)` | `match_time_limit_seconds_by_player[p]` | Player-specific chess-clock budget, consumed only during that player's turn. `null` disables it. |
| `SL` | `seat_limit` | Maximum seats offered by this match. |
| `Players` | `player_count` | Occupied player seats when the match starts. |
| `Mode` | `collaboration_mode` | `competitive` or `cooperative`. |
| `W` | `disconnect_grace_seconds` | Server-administered disconnection grace period before automatic concession. |
| `M` | `max_players_per_match` | Server-administered upper bound on `seat_limit`. Initially expected to be 8, but never hardcoded into game logic. |

## 2. Proposed configuration invariants

These constraints are recommended but remain unfrozen until accepted in the normative match contract:

- All numeric settings are integers unless a later rule explicitly permits fractions.
- `termination_score` SHALL be `-1` or an integer from `1` through `99`. Zero is excluded because a player starting at the default zero score would already satisfy it.
- `starting_ticket_count` SHALL be an integer from `1` through `99`.
- `queue_minimum` SHALL be an integer from `0` through `99`.
- `starting_ticket_count >= queue_minimum`. This avoids beginning a match by unexpectedly creating additional tickets.
- Each starting Service Point value SHALL be an integer from `-99` through `99`.
- When `termination_score >= 1`, every eligible player's or team's effective starting score SHALL be less than `termination_score`. Merely requiring `H(p) != X` is insufficient because `H(p) > X` would also begin beyond the target.
- `player_count >= 1`.
- `player_count <= seat_limit <= max_players_per_match`.
- Time limits SHALL be positive whole seconds or `null` when disabled.
- `disconnect_grace_seconds` SHALL be a positive whole number chosen by server administrators.

## 3. Proposed queue semantics

The following interpretation removes the need for a separate finite-ticket mode:

1. Create exactly `starting_ticket_count` active tickets during setup.
2. Resolve ticket closures and all events they cause.
3. If `queue_minimum > 0` and the active count is below it, create random tickets until the active count equals `queue_minimum`.
4. If `queue_minimum == 0`, do not replenish automatically.
5. If the active queue becomes empty while `queue_minimum == 0`, evaluate the queue-empty termination rule.

Thus:

- A finite queue match is expressed with `X = -1`, `S = desired finite ticket count`, and `Q = 0`.
- An endless-by-configuration match is expressed with `X = -1` and `Q > 0`.
- The earlier prototype is not fully described until its replenishment intent is chosen. "Always keep three tickets" is `X = 10, S = 3, Q = 3`; "only three tickets" is `X = 10, S = 3, Q = 0`.

## 4. Frozen cooperative continuity direction

Cooperative matches do not end merely because all but one human player has conceded, disconnected beyond `W`, or otherwise left the active roster. Every remaining active human may choose to continue the match or concede.

This direction anticipates cooperative matchmaking with unfamiliar players, where a departing teammate must not force a loss upon players who wish to finish. Departed players stop receiving turns and cannot rejoin after their departure becomes a concession. The exact treatment of their private cards, controlled resources, ticket contributions, clocks, and statistics remains unfrozen.

## 5. Currently unfrozen rules

### 4.1 Match configuration and setup

- Which configuration values players may customize and which are supplied only through presets.
- Whether public matchmaking permits arbitrary settings or only administrator-approved presets.
- Whether `S`, `Q`, and `SL` receive lower production limits than their schema limits for resource protection.
- How the server estimates and rejects configurations whose expected memory, CPU, bandwidth, or match duration exceeds a safe budget.
- Whether a match may start below `seat_limit`, and its minimum required occupancy.
- Whether late joining or spectator seats are permitted.
- How the starting player and initial turn order are selected.
- Whether competitive play is free-for-all only or should support teams.
- How cooperative team membership is represented in anticipation of possible multi-team play.

### 4.2 Score and handicaps

- Whether Service Points are awarded per qualifying action, per ticket stage, or only at ticket closure.
- How multiple contributors divide or independently earn Service Points.
- Whether cooperative Service Points are written directly to a team ledger or aggregated from player awards.
- Whether individual points in cooperative play are gameplay values, statistics only, or both.
- Whether penalties may reduce Service Points below a player's starting value or below zero.
- Whether a handicap belongs to a player, seat, team, or some combination.
- Whether cooperative starting team score is the sum of `H(p)`, a separate team value, or another formula.
- Exact Root Cause Bonus value and attribution.
- Tie handling when the queue becomes empty in competitive play.

### 4.3 Ticket queue and contention

- Whether replenishment occurs immediately after each closure or once all current effects finish resolving. The recommendation is after the complete resolution transaction.
- Whether random replenishment samples with replacement, without replacement from a finite catalog, or from a weighted generator.
- Whether duplicate ticket definitions may be active simultaneously.
- How large queues are paginated or spatially represented without hiding game state.
- Whether players claim tickets, share them freely, or acquire temporary ownership through effects.
- Whether allies and opponents may contribute to a claimed ticket.
- How simultaneous or stale attempts to close the same ticket are ordered and rejected.
- How contribution history is recorded for scoring and final statistics.
- Whether impossible or corrupted tickets can be replaced, and what penalty applies.

### 4.4 Turn structure and card economy

- Deck size and copy limits.
- Starting hand size.
- Mandatory and optional draw cadence.
- Exact turn phases and phase-transition rules.
- Actions available per turn.
- Card action costs and other resource costs.
- Hand-size limit, if any.
- Discard, reshuffle, and deck-recovery rules.
- Whether a player with no legal card may pass normally.
- Exact definition of an exhausted or out-of-playable-cards player.
- Whether rounds mean one turn for every currently active player.
- Whether player-count scaling affects actions, draws, tickets, difficulty, rewards, or events.

### 4.5 Diagnosis, repair, and failure

- Diagnosis commitment thresholds and evidence requirements.
- Exact Root Cause Bonus requirements.
- Consequences for an incorrect diagnosis.
- Consequences for unnecessary replacement or repair.
- Consequences for failed tests, repairs, verification, or documentation.
- Whether partially completed ticket stages persist when control changes.
- Whether mandatory-draw failure causes exhaustion, concession, elimination, or match loss.
- How a cooperative team is affected when one member becomes exhausted.

### 4.6 Timers, disconnection, and concession

- Default and permitted ranges for `T`, `PT`, and administrator-controlled `W`.
- Whether turn time and player time may both be enabled and which expiration wins if they coincide.
- Whether clocks pause during server resolution, animations, reconnect synchronization, or modal decisions.
- Whether turn expiration causes immediate match concession, ends only the current turn, or consumes a limited timeout resource.
- Whether player-time expiration causes concession or inactivity.
- How repeated disconnects interact with `W`.
- Whether voluntary concession requires confirmation.
- In competitive play, whether the match ends as soon as only one eligible player remains.
- How a cooperative leaver's hand, controlled resources, unresolved effects, and ticket claims are released or transferred while remaining players continue.
- How computer players affect "all human players conceded" termination; computer players never concede.

### 4.7 Terminal conditions and results

- Whether reaching `termination_score` is checked after each atomic scoring event or after the entire action resolves.
- How simultaneous threshold crossings are resolved.
- Whether competitive team scores may satisfy `termination_score`.
- Exact winner selection when the queue empties at `Q = 0`.
- Whether cooperative queue-empty termination is an automatic win regardless of score.
- Whether unresolved effects delay queue-empty termination.
- Stalemate detection when `X = -1` and `Q > 0`.
- Termination when all human players concede but computer-controlled players remain.
- Whether administrators may terminate or invalidate a match and how that affects results.
- Whether an infinite configured match exposes an administrator or unanimous-vote ending mechanism.

### 4.8 Multiplayer targeting and information

- Machine-readable effect targets: self, ally, opponent, team, any player, active ticket, claimed ticket, or any ticket.
- Which discoveries are private, team-shared, or public.
- Whether teammate hands, hypotheses, and evidence are visible.
- Whether opponents can inspect ticket progress created by another player.
- What information spectators receive.
- How private state is redacted from reconnect snapshots and event history.

### 4.9 Computer players

- Supported computer-player counts and collaboration modes.
- Whether computer players can fill empty seats or join only at setup.
- Difficulty definitions and decision-time behavior.
- Whether computer players use hidden authoritative information or only their player-safe view. The recommendation is player-safe information only.
- How computer-player rewards and statistics are reported.
- What terminates an otherwise endless match containing only computer players.

### 4.10 End-of-match statistics

- Which statistics appear in the result screen.
- Attribution rules for tickets, assists, diagnoses, tests, repairs, verification, and documentation.
- Whether useful and redundant actions are distinguished.
- Which statistics are private, team-visible, or public.
- Whether statistics are persisted to an account record.
- Whether all statistics are derived from the authoritative event log.

## 6. Rules removed from the unfrozen inventory

The following questions no longer require separate decisions:

- Whether Ace Mode and Cleaner Mode use different engines or policy classes.
- Whether Cleaner Mode has a separate `Y` runtime setting.
- How Cleaner and Ace cross-product combinations interact with competitive and cooperative play.
- Whether `AceTicketPolicy` and `CleanerTicketPolicy` should be separate abstractions.
- Whether a cooperative match automatically ends when all but one human player leaves.

They are replaced by one configurable `TicketPolicy` governed by `starting_ticket_count`, `queue_minimum`, and `termination_score`.

## 7. Change discipline

When an unfrozen rule is decided:

1. Remove it from the unfrozen list.
2. Add the normative decision to the appropriate design contract.
3. Update schemas and examples if the decision changes persisted or transmitted data.
4. Add behavior-focused tests before relying on it in implementation.
5. Record any migration required for saved presets or matches.
