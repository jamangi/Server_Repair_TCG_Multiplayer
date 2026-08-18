# Unfrozen Rules

This document is the canonical inventory of game rules that remain open to design or playtesting. It prevents unresolved decisions from being silently embedded in schemas, cards, user-interface code, or server behavior.

## 1. Canonical boundary

Approved behavior now lives in `FROZEN_RULES.md`. This file contains only decisions that still require design, balance testing, or production-policy selection.

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

## 2. Remaining configuration questions

- Whether all numeric settings must be integers in every rules version.
- Production admission limits for large `S`, `Q`, player, and spectator values.
- Whether custom public rooms may use the broad schema limits or only approved presets.
- Default values and permitted ranges for `T`, `PT`, spectator capacity, and search/refresh resources.

### Recommended room-creation presentation

Room creation should use two layers:

1. **Basic settings** expose the decisions most players understand before their first match: preset, collaboration mode, Player seats, Spectator seats, score objective, and ticket-queue shape.
2. **Advanced settings** expose optional pacing and economy controls without crowding the initial form.

Recommended Advanced settings are:

- starting hand size,
- cards drawn per draw step,
- draw-step cadence,
- Actions per turn,
- maximum hand size, if the rules later adopt one,
- Starting Search Tokens (`SSC`),
- Search Tokens per ticket closure (`TSC`),
- Starting Refresh Tokens (`SRT`),
- Maximum Refresh Tokens (`MRF`),
- Root Cause Bonus magnitude,
- turn timer (`T`),
- player match clock (`PT`),
- minimum and maximum faults per generated ticket (`MnD` and `MxD`),
- Progressive Difficulty (`PD`).

The form should begin with a named preset. Opening Advanced settings shows the preset's concrete values. Editing an Advanced value marks the configuration as **Custom** without losing the preset it originated from.

The following are server/game-system policy rather than Room settings:

- legal deck size,
- per-card copy limit,
- disconnect grace (`W`),
- maximum Players per match (`M`),
- absolute Spectator capacity,
- production admission and resource limits.

This distinction lets players customize a match without letting one Room redefine deck legality or server safety.

## 3. New ticket-generation settings

Candidate room settings:

- `min_faults_per_ticket` (`MnD`): minimum randomized fault count, greater than zero.
- `max_faults_per_ticket` (`MxD`): maximum randomized fault count, greater than or equal to `MnD`.
- `progressive_difficulty` (`PD`): whether generated-ticket difficulty grows during the match.
- Future `min_fault_depth` and `max_fault_depth` settings once the content catalog contains enough deep causal chains.

Unfrozen questions:

- Exact supported ranges and production caps.
- Whether difficulty counts distinct faults, total fault instances, or actionable root faults.
- How minimum and maximum fault depth are calculated for branching graphs.
- The progression cadence, formula, and ceiling for `PD`.
- Whether progression is based on tickets created, tickets closed, rounds, score, or elapsed time.
- How generation behaves when the catalog cannot satisfy the requested range.
- Whether a room falls back to the closest valid ticket or rejects the configuration.

One server-side `max_faults_per_ticket` capability is sufficient to bound both `MnD` and `MxD`; a separate "highest minimum" capability is redundant as long as validation enforces `MnD <= MxD <= server_max_faults_per_ticket`.

## 4. Search and deck-refresh resources

Candidate settings:

- `starting_search_tokens` (`SSC`): utility searches granted at setup; proposed schema range 0 through 5.
- `ticket_search_tokens` (`TSC`): utility searches granted when a ticket closes; proposed schema range 0 through 5.
- `starting_refresh_tokens` (`SRT`): Deck Refresh Tokens granted to each Player at setup.
- `max_refresh_tokens` (`MRF`): maximum Deck Refresh Tokens a Player may hold.

Proposed validation:

- `0 <= MRF <= 2`
- `0 <= SRT <= MRF`
- the standard preset uses `MRF = 1` and `SRT = 1`
- after every ticket closure, each active Player gains one Deck Refresh Token, up to `MRF`
- `MRF = 0` disables starting and earned refresh tokens and intentionally creates a harder room configuration

These should be utility resources rather than ordinary cards in hand. They do not count toward starting hand size or deck size.

Unfrozen questions:

- Exact search behavior: entire deck, top cards, eligible family, or filtered selection.
- Whether using a Search Token consumes an Action.
- Whether `TSC` is awarded to every player, contributors only, the closing player, or a cooperative team pool.
- Whether Search Tokens have a storage cap.
- Whether the recommended preset is `SSC = 2` or `SSC = 3`; the current design proposal favors 3.
- Whether the recommended `TSC` should be 1 rather than 3 to preserve draw uncertainty and reduce repetitive search.
- Whether a Deck Refresh Token belongs to each player or to the team. The current recommendation is per Player.
- Whether using a Deck Refresh Token consumes an Action.
- Whether refresh shuffles only discard into deck or combines discard with the remaining deck and shuffles everything.

## 5. Recommended starting balance for playtesting

These are recommendations, not frozen rules. They provide one coherent baseline for the first playable prototype.

| Area | Recommended baseline | Reason |
|---|---|---|
| Deck size | 30 cards | Large enough for specialization without making relevant cards too rare. |
| Copy limit | 3 copies per card ID | Supports consistency without allowing a deck to collapse into one repeated action. |
| Starting hand | 5 deck cards | Keeps the opening readable. Search Tokens are displayed separately and do not turn this into an eight-card hand. |
| Draw cadence | Draw 1 deck card at the start of each turn | Predictable pacing and simple reconnect reconstruction. |
| Actions per turn | 2 Actions | Permits a test-and-follow-up rhythm while requiring prioritization. |
| Generic card cost | Actions only; no second universal card currency | Avoids preventing knowledgeable play merely because a separate resource was not drawn. |
| Typical action cost | 1 Action | The content currently contains `action_cost`; treat it as Action consumption, not money or energy. Audit 0-, 2-, and 3-Action outliers before freezing. |
| Hand limit | No rules-level maximum in the first prototype | Avoids forced discards before deck/search pacing is observed. The UI must remain usable with large hands. |
| Starting Search Tokens (`SSC`) | 3 per player | Makes a 30-card deck dependable without replacing all draw uncertainty. |
| Search Tokens on closure (`TSC`) | 1 per active player; storage cap 5 | Prevents the game from stalling while avoiding three guaranteed searches after every closure. |
| Search Token use | Spend 1 token and 1 Action; select one eligible card from the deck, add it to hand, then shuffle | Strong and legible, but not a free action. Eligibility may later be narrowed by effects. |
| Deck Refresh Token use | Spend 1 token and 1 Action; combine discard with remaining draw deck and shuffle | Prevents endless-run exhaustion while preserving an action tradeoff. |
| Refresh resources | `SRT = 1`, `MRF = 1`; each active Player returns to the cap after every ticket closure | Makes deck cycling fundamental in standard play while allowing `MRF = 0` challenge rooms and avoiding accumulation. |
| Ticket Service Points | Use each ticket's authored Service Point value; initial baseline 1 per ordinary ticket | Preserves ticket-level balancing and keeps a 10-point preset understandable. |
| Root Cause Bonus | +1 Service Point once per ticket | Meaningful relative to a 1-point ordinary ticket without overwhelming ticket completion. |
| Ordinary mistakes | Do not subtract Service Points by default | A bad action already spends a card and Action and may reveal information or forfeit efficiency bonuses. Explicit high-risk cards may define additional penalties. |
| Turn timer (`T`) | 120 seconds when enabled | Gives unfamiliar players time to read technical material. Expiration auto-passes. |
| Player clock (`PT`) | 1,200 seconds per player when enabled | A 20-minute decision budget discourages indefinite matches without rushing each turn. |
| Disconnect grace (`W`) | 60 seconds | Long enough for a routine reconnect and short enough to release abandoned live matches. |

Recommended player-count presets should be explicit data rather than hidden formulas. As a starting point:

- 1-player training: `SL = 1`, `S = 3`, `Q = 3`, `X = 10`, timers disabled.
- 2-player competitive: `SL = 2`, `S = 3`, `Q = 3`, `X = 10`.
- 2–4-player cooperative: `SL = 4`, `S = 3`, `Q = 3`, shared `X = 10`.
- 3–4-player competitive: `SL = 4`, `S = 4`, `Q = 4`, `X = 15`.
- 5–8-player large-room trial: `SL = 8`, `S = 6`, `Q = 6`, `X = 20`; keep administrator-gated until load and pacing are measured.

## 6. Currently unfrozen rules

### 6.1 Match configuration and setup

- Which configuration values players may customize and which are supplied only through presets.
- Whether public matchmaking permits arbitrary settings or only administrator-approved presets.
- Whether `S`, `Q`, and `SL` receive lower production limits than their schema limits for resource protection.
- How the server estimates and rejects configurations whose expected memory, CPU, bandwidth, or match duration exceeds a safe budget.
- Whether a match may start below `seat_limit`, and its minimum required occupancy.
- Whether late joining or spectator seats are permitted.
- How the starting player and initial turn order are selected.
- Whether competitive play is free-for-all only or should support teams.
- How cooperative team membership is represented in anticipation of possible multi-team play.

### 6.2 Score and handicaps

- Whether Service Points are awarded per qualifying action, per ticket stage, or only at ticket closure.
- How multiple contributors divide or independently earn Service Points.
- Whether cooperative Service Points are written directly to a team ledger or aggregated from player awards.
- Whether individual points in cooperative play are gameplay values, statistics only, or both.
- Whether penalties may reduce Service Points below a player's starting value or below zero.
- Whether a handicap belongs to a player, seat, team, or some combination.
- Whether cooperative starting team score is the sum of `H(p)`, a separate team value, or another formula.
- Exact Root Cause Bonus value and attribution.
- Tie handling when the queue becomes empty in competitive play.

### 6.3 Ticket queue and contention

- Whether replenishment occurs immediately after each closure or once all current effects finish resolving. The recommendation is after the complete resolution transaction.
- Whether random replenishment samples with replacement, without replacement from a finite catalog, or from a weighted generator.
- Whether duplicate ticket definitions may be active simultaneously.
- How large queues are paginated or spatially represented without hiding game state.
- Whether players claim tickets, share them freely, or acquire temporary ownership through effects.
- Whether allies and opponents may contribute to a claimed ticket.
- How simultaneous or stale attempts to close the same ticket are ordered and rejected.
- How contribution history is recorded for scoring and final statistics.
- Whether impossible or corrupted tickets can be replaced, and what penalty applies.

### 6.4 Turn structure and card economy

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

### 6.5 Diagnosis, repair, and failure

- Diagnosis commitment thresholds and evidence requirements.
- Exact Root Cause Bonus requirements.
- Consequences for an incorrect diagnosis.
- Consequences for unnecessary replacement or repair.
- Consequences for failed tests, repairs, verification, or documentation.
- Whether partially completed ticket stages persist when control changes.
- Whether mandatory-draw failure causes exhaustion, concession, elimination, or match loss.
- How a cooperative team is affected when one member becomes exhausted.

### 6.6 Timers, disconnection, and concession

- Default and permitted ranges for `T`, `PT`, and administrator-controlled `W`.
- Whether turn time and player time may both be enabled and which expiration wins if they coincide.
- Whether clocks pause during server resolution, animations, reconnect synchronization, or modal decisions.
- Number of consecutive or total automatic turn passes, if any, that eventually cause concession.
- Whether player-time expiration causes concession or inactivity.
- How repeated disconnects interact with `W`.
- Whether voluntary concession requires confirmation.
- In competitive play, whether the match ends as soon as only one eligible player remains.
- How a cooperative leaver's hand, controlled resources, unresolved effects, and ticket claims are released or transferred while remaining players continue.
- How computer players affect "all human players conceded" termination; computer players never concede.

### 6.7 Terminal conditions and results

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

### 6.8 Multiplayer targeting and information

- Machine-readable effect targets: self, ally, opponent, team, any player, active ticket, claimed ticket, or any ticket.
- Which discoveries are private, team-shared, or public.
- Whether teammate hands, hypotheses, and evidence are visible.
- Whether opponents can inspect ticket progress created by another player.
- What information spectators receive.
- How private state is redacted from reconnect snapshots and event history.

### 6.9 Computer players

- Supported computer-player counts and collaboration modes.
- Whether computer players can fill empty seats or join only at setup.
- Difficulty definitions and decision-time behavior.
- Whether computer players use hidden authoritative information or only their player-safe view. The recommendation is player-safe information only.
- How computer-player rewards and statistics are reported.
- What terminates an otherwise endless match containing only computer players.

### 6.10 End-of-match statistics

- Which statistics appear in the result screen.
- Attribution rules for tickets, assists, diagnoses, tests, repairs, verification, and documentation.
- Whether useful and redundant actions are distinguished.
- Which statistics are private, team-visible, or public.
- Whether statistics are persisted to an account record.
- Whether all statistics are derived from the authoritative event log.

### 6.11 Room lifecycle and roles

- Room visibility: public, unlisted, private, or invite-only.
- Room ownership, host transfer, and behavior when the creator leaves.
- Ready-state requirements and who may start a match.
- Whether settings remain editable after another member joins.
- Whether Player seats may be reserved.
- Whether late joining is ever permitted after match start.
- Whether a Spectator may request a vacated Player seat between matches.
- Whether spectator streams are live or delayed in competitive rooms.
- Spectator chat and moderation policy.
- Rejoin semantics before and after disconnection becomes concession.
- Behavior when concession cannot convert a Player into a Spectator because spectator capacity is full.
- Room retention after a match and support for rematches.
- Host controls for adding, removing, and configuring computer players.
- Whether offline all-computer simulations use Room objects or a smaller local simulation configuration.

## 7. Rules removed from the unfrozen inventory

The following questions no longer require separate decisions:

- Whether Ace Mode and Cleaner Mode use different engines or policy classes.
- Whether Cleaner Mode has a separate `Y` runtime setting.
- How Cleaner and Ace cross-product combinations interact with competitive and cooperative play.
- Whether `AceTicketPolicy` and `CleanerTicketPolicy` should be separate abstractions.
- Whether a cooperative match automatically ends when all but one human player leaves.
- Whether a live server match containing no humans may continue because spectators or computer players remain.
- Whether turn-timer expiration immediately concedes the player.
- Whether the public ticket progress record has a stable name; it is the Worklog.

They are replaced by one configurable `TicketPolicy` governed by `starting_ticket_count`, `queue_minimum`, and `termination_score`.

## 8. Change discipline

When an unfrozen rule is decided:

1. Remove it from the unfrozen list.
2. Add the normative decision to the appropriate design contract.
3. Update schemas and examples if the decision changes persisted or transmitted data.
4. Add behavior-focused tests before relying on it in implementation.
5. Record any migration required for saved presets or matches.
