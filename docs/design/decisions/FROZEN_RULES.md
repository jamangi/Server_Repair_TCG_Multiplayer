# Frozen Rules

This document records directions explicitly approved for the Server Repair TCG. "Frozen" means implementations and tests may rely on the rule. A frozen rule may still be changed deliberately through a documented rules-version migration.

Start with [`DECISION_INDEX.md`](DECISION_INDEX.md) for the decision hierarchy and current engine-decision order. Accepted unresolved decisions belong in [`UNFROZEN_RULES.md`](UNFROZEN_RULES.md); new proposals belong in [`CANDIDATE_DECISIONS.md`](CANDIDATE_DECISIONS.md).

A more fundamental unresolved decision may place a frozen rule in [`UNSYNCHRONIZED_DECISIONS.md`](UNSYNCHRONIZED_DECISIONS.md). The frozen rule remains authoritative until an explicit decision changes it.

## 1. Core educational loop

Players solve Repair Tickets through the practical troubleshooting sequence:

1. Observe symptoms.
2. Form hypotheses.
3. Run tests.
4. Isolate faults and root causes.
5. Perform repairs.
6. Verify recovery.
7. Document the result.

## 2. One configurable match system

There are no separate Ace and Cleaner rules engines. A match is described by one configuration.

- `termination_score` (`X`) is `-1` to disable score termination or an integer from 1 through 99.
- `starting_ticket_count` (`S`) is an integer from 1 through 99.
- `queue_minimum` (`Q`) is an integer from 0 through 99 and cannot exceed `S`.
- `Q = 0` disables automatic replenishment.
- When `Q > 0`, a completed resolution that leaves fewer than `Q` active tickets creates random tickets until the queue again contains `Q`.
- Queue-empty termination is possible only when the active ticket queue reaches zero while `Q = 0`.
- `starting_service_points_by_player[p]` (`H(p)`) may be an integer from -99 through 99.
- When score termination is enabled, every eligible scoring entity must start below `X`.
- `seat_limit` (`SL`) cannot exceed the server-administered `max_players_per_match` (`M`).
- `disconnect_grace_seconds` (`W`) and `M` are controlled by server administrators rather than room creators.
- `turn_time_limit_seconds` (`T`) and player match clocks (`PT`) may be disabled during setup.

## 3. Collaboration

- A match is competitive or cooperative.
- Cooperative play uses a shared team Service Point pool for victory.
- Player contributions remain individually attributable for statistics.
- A cooperative match does not end merely because all but one human teammate leaves or concedes.
- Every remaining cooperative human may choose to continue or concede.
- A departed player stops receiving turns and cannot reclaim the seat after departure becomes a concession.

## 4. Live and offline execution

- A live server match terminates when no human players remain, even if computer players or spectators remain. This prevents abandoned matches from consuming resources indefinitely.
- Spectators do not keep a live match alive.
- An offline training or simulation match may contain only computer players and may continue without a human player. This permits deliberate observation of computer cooperation or competition.
- Computer players never voluntarily concede.
- Computer players receive only the player-safe information available to their seat; they do not inspect hidden authoritative faults directly.

## 5. Room and match boundary

A Room is the membership, role, configuration, and socket container. A Match is one authoritative game conducted inside a Room.

- Creating a Room joins its creator to the Room but does not inherently make the creator a Player.
- Room creation may include an explicit option to take a Player seat immediately.
- Joining a Room establishes Room membership and subscribes the authenticated socket to the Room's allowed event stream.
- Joining does not silently assign a spectator role when the user wanted an unavailable Player seat.
- Before joining, discoverable Room summaries expose whether Player and Spectator capacity is available.
- A joined Room member may explicitly take an available Player seat or become a Spectator.
- Conceding converts a Player into a Spectator if spectator capacity and room policy permit; otherwise the member remains joined without a gameplay role.
- Leaving removes Room membership and also concedes if the member was an active Player.
- Player seat capacity and spectator capacity are separate.
- `spectator_limit` is configured per Room within the server-administered `max_spectators_per_room`.

Internal commands use unambiguous names even when the UI uses friendlier labels:

| UI label | Command intent |
|---|---|
| Create | `CREATE_ROOM` |
| Join | `JOIN_ROOM` |
| Play | `TAKE_SEAT` |
| Spectate | `BECOME_SPECTATOR` |
| Concede | `CONCEDE_MATCH` |
| Leave | `LEAVE_ROOM` |

Playing a gameplay card is a different command and must not be named `PLAY` in the transport contract.

## 6. Timers and disconnection

- The server is authoritative for turn timers, player clocks, disconnect grace periods, and expiration events.
- Turn time expires into an automatic pass/end-turn rather than an immediate concession.
- Player match-clock expiration concedes that player.
- Remaining player time decreases only while that player owns an actionable turn.
- Player time pauses during server resolution and reconnect synchronization.
- A player disconnected longer than `W` concedes.

## 7. Ticket and action authority

- Tickets are shared and jointly actionable unless an explicit effect creates ownership or a claim.
- Ticket progress belongs to the ticket rather than to the most recent player.
- The server serializes actions, validates target revisions, and rejects stale actions against current authoritative state.
- Replenishment and random ticket generation occur on the authoritative server in live play.
- Technical faults and causal chains remain hidden authoritative state until rules legitimately reveal them.

## 8. Evidence and Worklog

The public progress record of a Ticket is its **Worklog**.

The Worklog may show:

- who performed a public action,
- which public card, command, tool, repair, or verification was used,
- public stage changes,
- public conclusions and revealed evidence,
- contribution history needed for scoring and review.

Private Evidence is information legitimately earned by a player but not yet visible to every participant. For example, a competitive player runs a memory test and privately learns that DIMM B produced correctable errors. The public Worklog may show that the player ran the memory test, while the detailed result appears only in that player's private notebook/workbench until revealed.

Visibility categories are:

- `SERVER_ONLY`
- `PRIVATE_PLAYER`
- `TEAM`
- `PUBLIC_MATCH`

In cooperative play, newly earned evidence is team-visible by default. In competitive play, newly earned evidence is private by default unless the test or another rule says otherwise.

## 9. Rule evolution

Changes to frozen behavior require:

1. an explicit design decision,
2. an updated rules version,
3. behavior-focused tests,
4. schema or saved-preset migration where applicable,
5. release notes when player-visible behavior changes.
