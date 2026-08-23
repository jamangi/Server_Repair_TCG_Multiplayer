# Unfrozen Rules

This document is the canonical inventory of game rules that remain open to design, balance testing, or production-policy selection. It prevents unresolved decisions from being silently embedded in schemas, cards, user-interface code, or server behavior.

Start with [`DECISION_INDEX.md`](DECISION_INDEX.md) for the decision hierarchy. Approved behavior lives in [`FROZEN_RULES.md`](FROZEN_RULES.md). Newly proposed options remain in [`CANDIDATE_DECISIONS.md`](CANDIDATE_DECISIONS.md) until accepted into this inventory. Known migration work and conflicts are tracked in [`UNSYNCHRONIZED_DECISIONS.md`](UNSYNCHRONIZED_DECISIONS.md).

The 2026-08-22 Candidate-Frozen Example Profile review resolved the Diagnosis, Test, Isolation, Repair, Verify, Documentation, Worklog, first-version turn, and utility-resource foundations. Those questions have been removed from this inventory rather than left as duplicate open wording.

<a id="4-search-and-deck-refresh-resources"></a>
## 1. Canonical configuration vocabulary

| Symbol | Recommended field name | Meaning |
| --- | --- | --- |
| `X` | `termination_score` | Score objective. `-1` disables score-based termination. |
| `S` | `starting_ticket_count` | Number of active Tickets created at match start. |
| `Q` | `queue_minimum` | Refill floor. Zero disables replenishment. |
| `H(p)` | `starting_service_points_by_player[p]` | Starting Service Points for Player `p`. |
| `T` | `turn_time_limit_seconds` | Maximum wall-clock duration of one turn; `null` disables it. |
| `PT(p)` | `match_time_limit_seconds_by_player[p]` | Player chess-clock budget; `null` disables it. |
| `SL` | `seat_limit` | Maximum Player seats offered by the match. |
| `Players` | `player_count` | Occupied Player seats when the match starts. |
| `Mode` | `collaboration_mode` | `competitive` or `cooperative`. |
| `W` | `disconnect_grace_seconds` | Server-administered grace period before automatic concession. |
| `M` | `max_players_per_match` | Server-administered upper bound on `SL`. |
| `SSC` | `starting_search_tokens` | Search Tokens granted to each Player at setup. |
| `TSC` | `ticket_search_tokens` | Search Tokens granted to each active Player at closure. |
| `MSC` | `max_search_tokens` | Maximum Search Tokens a Player may hold. |
| `SRT` | `starting_refresh_tokens` | Refresh Tokens granted to each Player at setup. |
| `MRF` | `max_refresh_tokens` | Maximum Refresh Tokens a Player may hold. |

Deck size, copy limit, opening hand, draw cadence, Actions, Search behavior, Refresh behavior, and the standard first-version token values are frozen. They are not reopened merely because a future rules version might intentionally migrate them.

## 2. Remaining match-configuration questions

- Which settings Room creators may customize and which are supplied only through approved presets.
- Whether public matchmaking permits Custom configurations.
- Production limits for large `S`, `Q`, Player, Spectator, and expected-duration values.
- Default and permitted ranges for `T`, `PT`, and administrator-controlled `W`.
- Whether turn time and player time may both be enabled and which expiration wins if they coincide.
- Whether clocks pause during modal decisions. Server-resolution and reconnect pauses are already frozen.
- Whether a match may start below `SL`, and its minimum occupancy.
- Whether all new numeric settings use integer values and what their schema ranges are.
- Whether configurable Search and Refresh values use the broad schema limits or preset-specific limits.
- Whether the standard preset's first-version values are also mandatory in ranked or campaign play.

Room creation should distinguish player-facing match settings from server safety capabilities. Exact interface grouping remains a product decision, not an engine rule.

## 3. Ticket generation and campaign selection

<a id="gen-001"></a>
### GEN-001 — Constraint-driven Ticket Builder

**Status:** Unfrozen

One reusable Ticket Builder should generate Ticket instances for campaign, mission, challenge, training, cooperative, and competitive modes. Its semantic input should be a generation-constraint configuration rather than a preselected eligible Ticket pool.

The accepted direction requires the configuration to express, when relevant:

- causal-chain shapes and fault-count/depth constraints;
- difficulty range;
- required teaching beats;
- guaranteed Ticket categories;
- configurable exclusions, especially for story state and campaign replayability;
- Progressive Difficulty (`PD`) behavior;
- mode or scenario context; and
- a seed and generator version for reproducible saves, replays, and tests.

An authored campaign scenario supplies bounded constraints, allowing its Tickets to vary on replay without violating its teaching or story purpose. Mission and challenge modes may use different bounded configurations. Training and competitive modes may use broad configurations for genuinely random Ticket pools. Fixed authored Ticket fixtures remain valid for tutorials, audits, and worked examples.

The Ticket Builder must produce the already frozen authored gameplay surfaces: a public candidate set, server-only causal truth, authored Evidence outcomes, Isolation requirements, Repair path, Verify conditions, and closure requirements. “Authored” means that generated content must be assembled from validated authored domain relationships and rule templates; it does not require selecting one prewritten whole Ticket from a list.

Still decide:

- the exact configuration schema, ranges, and server production caps;
- whether difficulty counts Faults, Fault instances, actionable causes, causal depth, or an authored composite rating;
- how branching-graph shape and depth constraints are evaluated;
- the progression cadence, formula, and ceiling for `PD`;
- the constraint-solving and weighted-randomization algorithm;
- how unsatisfiable configurations fail, relax, or fall back without silently violating scenario guarantees;
- whether duplicate generated Ticket structures may be active simultaneously;
- which exclusions and story-state inputs are safe to persist or reveal; and
- how generator-version migrations preserve saved campaigns and replay determinism.

<a id="62-score-and-handicaps"></a>
## 4. Scoring and closure contention

<a id="score-001"></a>
### SCORE-001 — Closure-settled causal contribution scoring

**Status:** Unfrozen

The scoring policy must reward causal troubleshooting without teaching that technical work is complete before the Ticket is closed. Closure itself is already frozen as a zero-Action, non-scoring event with Player/team statistical attribution.

The leading unresolved model is a **pending causal-contribution ledger**:

1. Qualifying causal actions create attributable pending contribution records rather than immediate Service Points.
2. The Ticket's server-only causal chain and scoring rubric determine which records belong to a valid resolution path.
3. Successful Verify does not pay points by itself. Failed or inconclusive Verify pays nothing and returns the Ticket to Diagnosis while preserving prior pending records.
4. Publishing a valid closure bundle settles every still-relevant pending contribution in the completed causal path atomically.
5. An unclosed Ticket pays no Service Points, even if some technical requirements have passed.
6. Ineligible, redundant, or superseded actions remain statistics but do not score.
7. Competitive awards go to recorded contributors. Cooperative awards enter the shared pool while retaining individual attribution.

This settlement boundary gives every Player a reason for the company-visible result—the closed Ticket—without making closure itself worth stealing. It also lets an underdog rationally move to another workload when their expected remaining causal contribution is low.

Still decide:

- whether only accepted Isolation and necessary Repair score, or whether decisive Tests and Verify may also carry authored values;
- whether the possible point budget and rubric are public, partially visible, or server-only;
- whether multi-fault Tickets pay once per stage, once per distinct causal element, or according to authored weights;
- when an earlier contribution remains eligible after later work revises the causal path;
- how repeated equivalent actions and assists avoid duplicate awards;
- whether Root Cause is a separate bonus, an authored Isolation value, or only a statistic;
- how rejected Isolation affects score eligibility beyond the frozen Root Cause consequence;
- whether cooperative points are written directly to the team ledger or aggregated from Player awards;
- whether individual cooperative points are gameplay values, statistics only, or both;
- whether penalties may reduce scores below their starting values or below zero;
- whether a handicap belongs to a Player, seat, team, or some combination; and
- how cooperative starting team score is derived from `H(p)`.

## 5. Ticket queue and contention

- Whether an explicit effect may claim a shared Ticket and how long that claim lasts.
- Whether allies and opponents may contribute to a claimed Ticket.
- How large queues are paginated or spatially represented without hiding public state.
- Whether impossible or corrupted Tickets can be replaced, and what penalty or audit record applies.
- Whether a contribution-scoring policy needs temporary locks while a closure transaction resolves. Server serialization and stale-revision rejection are already frozen.

<a id="64-turn-structure-and-card-economy"></a>
## 6. Card content and balance

The first-version deck and turn envelope is frozen. Content-level balance still requires playtesting:

- Which individual cards cost 0, 1, or 2 Actions.
- Whether any effect justifies a higher cost in a later rules version.
- Whether each 0-Action card remains safe under the same-name once-per-turn limit.
- Effect-specific targets, prerequisites, and use limits.
- Search eligibility restrictions created by particular cards or modes.
- Whether any explicit high-risk card imposes an additional penalty.
- How Player-count scaling affects Ticket difficulty, rewards, or event frequency without changing the two-Action turn.
- Exact definition and handling of a Player who has cards but no useful legal action. An empty draw deck alone is not loss or exhaustion.

## 7. Terminal conditions and results

- Precedence among score threshold, queue empty, concession, exhaustion, stalemate, and administrator termination after a complete resolution transaction.
- How simultaneous threshold crossings within one closure transaction are resolved.
- Whether competitive team scores may satisfy `X` if team-versus-team play is introduced.
- Whether unresolved non-closure effects delay terminal evaluation.
- Stalemate detection when `X = -1` and `Q > 0`.
- Termination policy for offline all-computer simulations.
- Whether administrators may invalidate a match and how that affects results.
- Whether an intentionally endless configuration exposes an administrator or unanimous-vote ending mechanism.

Queue-empty competitive winners, co-winners, and cooperative victory for `Q = 0` are frozen.

## 8. Timers, inactivity, and departure cleanup

- Number of consecutive or total automatic turn passes, if any, that cause inactivity or concession.
- How repeated disconnects interact with `W`.
- Whether a competitive match ends when only one eligible Player remains or waits for another terminal condition.
- How a cooperative leaver's hand, Installed objects, controlled resources, unresolved effects, and explicit Ticket claims are released or transferred.
- Whether a disconnected Player may resume before `W` without any additional seat confirmation.

Clock authority, automatic turn pass, player-clock concession, reconnect synchronization, no-human live termination, and no seat reclamation after departure becomes concession are already frozen.

## 9. Multiplayer teams, targeting, and information exceptions

- Whether competitive play is free-for-all only or may support teams.
- How cooperative team membership is represented if multi-team play is introduced.
- Effect-specific target relationships beyond the frozen requirement for explicit targets.
- Whether an explicit card may inspect another Player's hand, Hypothesis, or unpublished Evidence and what counterplay is required.
- Whether teammate hands are visible. Cooperative Evidence and Hypotheses are already team-visible by default.
- Whether competitive spectator streams are live, delayed, or Room-configurable.
- Which result-screen statistics are private, team-visible, public, or account-persisted.

Spectators receive only `PUBLIC_MATCH` state, and reconnect views must remain player-safe.

## 10. Computer players

- Supported computer-player counts and collaboration modes.
- Whether computer players can fill empty seats or join only at setup.
- Difficulty definitions and decision-time behavior.
- How computer-player rewards and statistics are reported.
- What terminates an otherwise endless offline match containing only computer players.

Computer players are never allowed to inspect hidden authoritative answers beyond their seat's player-safe view.

## 11. End-of-match statistics

- Which statistics appear in results.
- Attribution rules for Tickets, assists, Tests, Isolation, Repairs, Verify, Documentation, failed paths, and redundant actions.
- Whether useful and redundant actions are distinguished by authored scoring metadata or retrospective analysis.
- Which statistics persist to an account record.
- Whether all statistics are derived from the authoritative event log and score ledger.

<a id="611-room-lifecycle-and-roles"></a>
## 12. Room lifecycle and roles

- Room visibility: public, unlisted, private, or invite-only.
- Room ownership, host transfer, and behavior when the creator leaves.
- Ready-state requirements and who may start a match.
- Whether settings remain editable after another member joins.
- Whether Player seats may be reserved.
- Whether late joining is ever permitted after match start.
- Whether a Spectator may request a vacated Player seat between matches.
- Spectator chat and moderation policy.
- Behavior before disconnection becomes concession.
- Room retention after a match and support for rematches.
- Host controls for adding, removing, and configuring computer players.
- Whether offline all-computer simulations use Room objects or a smaller local configuration.

Explicit Play/Spectate choice, separate capacities, concession fallback when Spectator capacity is full, and inability to reclaim a departed seat are already frozen.

## 13. Rules removed from the unfrozen inventory

The following no longer require separate decisions:

- separate Ace and Cleaner engines or policy classes;
- a separate Cleaner `Y` setting;
- whether cooperative play ends when all but one human leaves;
- whether a live match without humans may continue;
- whether turn-timer expiration immediately concedes;
- whether the public Ticket record has a stable name;
- whether candidate Faults are global, generated dynamically, or authored;
- whether Hypothesis, Test, and Isolation form a Diagnosis sub-lifecycle;
- whether speculative ordinary Repair is legal;
- whether failed Verify can reopen Diagnosis while preserving work;
- whether Documentation is mandatory or end-only;
- Documentation targets, visibility, chronology, selection, and live recovery;
- basic deck size, copy limit, hand, draw, Actions, Search, Refresh, and empty-deck behavior;
- whether successful Verify is immediately public; and
- queue-empty winners and ties for finite matches;
- whether closure costs an Action, awards Service Points, or creates a protected claim;
- whether the game contains an account/loadout Equipment system; and
- whether Qualifications affect gameplay, access, loadouts, or matchmaking.

## 14. Change discipline

When an unfrozen rule is decided:

1. Remove it from the unfrozen list.
2. Add the normative decision to the appropriate frozen design contract.
3. Update schemas and examples if the decision changes persisted or transmitted data.
4. Add behavior-focused tests before relying on it in implementation.
5. Record any migration required for saved presets or matches.
