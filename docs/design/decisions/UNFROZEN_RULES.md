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

Candidate configuration fields remain:

- `min_faults_per_ticket` (`MnD`);
- `max_faults_per_ticket` (`MxD`);
- `progressive_difficulty` (`PD`); and
- future minimum and maximum fault-depth settings when the content catalog supports them.

Unfrozen questions:

- Exact supported ranges and production caps.
- Whether difficulty counts distinct Faults, Fault instances, actionable causes, or authored causal complexity.
- How minimum and maximum depth work for branching causal graphs.
- The progression cadence, formula, and ceiling for `PD`.
- Whether progression is based on Tickets created, Tickets closed, rounds, score, or elapsed time.
- How generation behaves when the catalog cannot satisfy the requested range.
- Whether random selection samples with replacement, without replacement, or through weighted generation.
- Whether duplicate Ticket definitions may be active simultaneously.
- How story scenarios constrain random selection without leaking reserved truth.

[`GEN-001`](CANDIDATE_DECISIONS.md#gen-001) stages bounded campaign randomization as one proposed answer. Fixed authored Tickets remain valid for tutorials and audited examples.

<a id="62-score-and-handicaps"></a>
## 4. Scoring and closure contention

The fundamental scoring model remains unfrozen. The approved structure guarantees individual attribution, a cooperative team pool, immutable contribution records, and atomic closure settlement, but not which records award points.

Decide:

- whether Service Points are awarded per verified causal contribution, per Ticket stage, or through another authored rubric;
- which Tests, Isolation events, Repairs, Verify events, Documentation events, or assists qualify;
- how failed Verify defers, invalidates, or preserves pending credit;
- how multiple contributors divide or independently earn Service Points;
- whether cooperative points are written directly to the team ledger or aggregated from player awards;
- whether individual cooperative points are gameplay values, statistics only, or both;
- whether Root Cause is a separate bonus, an authored Isolation value, or only a statistic;
- whether rejected Isolation permanently removes only Root Cause eligibility or other score eligibility;
- whether closure awards a Service Point, who receives it, and how small it must remain relative to causal work;
- whether the zero-Action closure-bundle proposal is adopted and whether anyone receives first refusal;
- whether penalties may reduce scores below their starting values or below zero;
- whether a handicap belongs to a Player, seat, team, or some combination; and
- how cooperative starting team score is derived from `H(p)`.

The leading proposals are [`SCORE-001`](CANDIDATE_DECISIONS.md#score-001), [`SCORE-002`](CANDIDATE_DECISIONS.md#score-002), and [`DOC-009`](CANDIDATE_DECISIONS.md#doc-009). Until they are approved, implementations must not preserve the example profile's “base point to closer plus Root Cause point” model as a rule.

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

## 13. Equipment, Qualifications, and ranking

No Equipment effect model or Qualification-to-gameplay relationship is frozen. The review specifically rejected treating the candidate-flow equipment fixture as approved behavior.

Staged proposals:

- [`EQP-001`](CANDIDATE_DECISIONS.md#eqp-001) — one separate Equipment slot installed at match start;
- [`EQP-002`](CANDIDATE_DECISIONS.md#eqp-002) — bounded passive or Action-costed effects;
- [`EQP-003`](CANDIDATE_DECISIONS.md#eqp-003) — ownership and multiplayer equality;
- [`QUAL-001`](CANDIDATE_DECISIONS.md#qual-001) — campaign progress with no board or Equipment effect.

An experience-based matchmaking rating is deferred and is not part of the first rules version.

## 14. Rules removed from the unfrozen inventory

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
- queue-empty winners and ties for finite matches.

## 15. Change discipline

When an unfrozen rule is decided:

1. Remove it from the unfrozen list.
2. Add the normative decision to the appropriate frozen design contract.
3. Update schemas and examples if the decision changes persisted or transmitted data.
4. Add behavior-focused tests before relying on it in implementation.
5. Record any migration required for saved presets or matches.
