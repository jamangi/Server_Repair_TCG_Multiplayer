# Frozen Rules

This document records directions explicitly approved for the Server Repair TCG. "Frozen" means implementations and tests may rely on the rule. A frozen rule may still be changed deliberately through a documented rules-version migration.

Start with [`DECISION_INDEX.md`](DECISION_INDEX.md) for the decision hierarchy. Accepted unresolved decisions belong in [`UNFROZEN_RULES.md`](UNFROZEN_RULES.md); new proposals belong in [`CANDIDATE_DECISIONS.md`](CANDIDATE_DECISIONS.md). Known migration work and conflicts belong in [`UNSYNCHRONIZED_DECISIONS.md`](UNSYNCHRONIZED_DECISIONS.md).

The rules in §§9–15 were approved from the Candidate-Frozen Example Profile v0.0 review on 2026-08-22. The example package's named Tickets, deterministic deck orders, account fixtures, balance audits, screens, and animations remain non-authoritative fixtures.

## 1. Core educational loop

Players solve Repair Tickets through this practical troubleshooting loop:

```text
Observe -> Diagnosis [Hypothesize <-> Test -> Isolate] -> Repair -> Verify -> Document
                        ^                                  |
                        `------ failed Verify -------------'
```

- Diagnosis is the umbrella for iterative Hypothesize and Test work followed by an evidence-supported Isolation. It is not an eighth peer-level action.
- The labels describe evidentiary functions, not departments, board lanes, or a permanently one-way state machine.
- Repair changes machine state but does not prove the diagnosis.
- Failed Verify may preserve prior work and return the Ticket to Diagnosis.
- Documentation may occur incrementally while a Ticket is active. A final structured closure bundle is still required after successful Verify. The sequence does not require end-only documentation.

## 2. One configurable match system

There are no separate Ace and Cleaner rules engines. A match is described by one configuration.

- `termination_score` (`X`) is `-1` to disable score termination or an integer from 1 through 99.
- `starting_ticket_count` (`S`) is an integer from 1 through 99.
- `queue_minimum` (`Q`) is an integer from 0 through 99 and cannot exceed `S`.
- `Q = 0` disables automatic replenishment.
- When `Q > 0`, a completed resolution that leaves fewer than `Q` active Tickets creates random Tickets until the queue again contains `Q`.
- Queue-empty termination is possible only when the active Ticket queue reaches zero while `Q = 0`.
- `starting_service_points_by_player[p]` (`H(p)`) may be an integer from -99 through 99.
- When score termination is enabled, every eligible scoring entity must start below `X`.
- `seat_limit` (`SL`) cannot exceed the server-administered `max_players_per_match` (`M`).
- `disconnect_grace_seconds` (`W`) and `M` are controlled by server administrators rather than Room creators.
- `turn_time_limit_seconds` (`T`) and player match clocks (`PT`) may be disabled during setup.
- A finite cooperative match wins when the team closes the queue with `Q = 0`.
- A finite competitive match with `Q = 0` ends when the queue is empty; the highest final Service Point total wins and equal highest totals are co-winners.

Initial Tickets may be authored fixtures or generated according to the match or campaign configuration. Exact campaign selection and replay-randomization policy remains open.

<a id="3-collaboration"></a>
## 3. Collaboration and contribution

- A match is competitive or cooperative.
- Cooperative play uses a shared team Service Point pool for victory.
- Player contributions remain individually attributable even when points enter a shared pool.
- A cooperative match does not end merely because all but one human teammate leaves or concedes.
- Every remaining cooperative human may choose to continue or concede.
- A departed player stops receiving turns and cannot reclaim the seat after departure becomes a concession.
- Tests, Isolation, Repairs, Verify, Documentation, and assists are recorded as distinct contributions. Which contributions award Service Points and when those points settle remains unfrozen.

## 4. Live and offline execution

- A live server match terminates when no human players remain, even if computer players or spectators remain. This prevents abandoned matches from consuming resources indefinitely.
- Spectators do not keep a live match alive.
- An offline training or simulation match may contain only computer players and may continue without a human player.
- Computer players never voluntarily concede.
- Computer players receive only the player-safe information available to their seat; they do not inspect hidden authoritative faults, causal chains, or random state directly.

## 5. Room and match boundary

A Room is the membership, role, configuration, and socket container. A Match is one authoritative game conducted inside a Room.

- Creating a Room joins its creator to the Room but does not inherently make the creator a Player.
- Room creation may include an explicit option to take a Player seat immediately.
- Joining a Room establishes Room membership and subscribes the authenticated socket to the Room's allowed event stream.
- Joining does not silently assign a spectator role when the user wanted an unavailable Player seat.
- Before joining, discoverable Room summaries expose whether Player and Spectator capacity is available.
- A joined Room member may explicitly take an available Player seat or become a Spectator.
- Conceding converts a Player into a Spectator if spectator capacity and Room policy permit; otherwise the member remains joined without a gameplay role.
- Voluntary concession requires explicit confirmation.
- Leaving removes Room membership and also concedes if the member was an active Player.
- Player seat capacity and spectator capacity are separate.
- `spectator_limit` is configured per Room within the server-administered `max_spectators_per_room`.
- A Ready Player's deck and other mechanical loadout state are snapshotted for match setup. A Player must explicitly leave Ready before changing that state and must pass legality checks before becoming Ready again.

Internal commands use unambiguous names even when the UI uses friendlier labels:

| UI label | Command intent |
| --- | --- |
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
- Player match-clock expiration concedes that Player.
- Remaining player time decreases only while that Player owns an actionable turn.
- Player time pauses during server resolution and reconnect synchronization.
- Narrative reading and decorative animation do not consume authoritative turn time.
- A Player disconnected longer than `W` concedes.
- Reconnect first installs the latest player-safe snapshot, then applies only explicitly supplied unseen semantic events. Duplicate event IDs are ignored.

## 7. Ticket and action authority

- Tickets are shared and jointly actionable unless an explicit effect creates ownership or a claim.
- Ticket progress belongs to the Ticket rather than to the most recent Player.
- Each authoritative intent identifies the actor, action or card instance, target, intent ID, and expected match revision.
- The server serializes actions, validates target revisions, and rejects stale actions before payment against current authoritative state.
- A rejected stale action moves no card, spends no Action, and creates no Worklog event.
- Replenishment and random Ticket generation occur on the authoritative server in live play.
- Technical faults and causal chains remain hidden authoritative state until rules legitimately reveal them.
- A card or basic action identifies its legal active Ticket, Player zone, or Worklog target. No implied "other player" target is allowed in the engine contract.

<a id="8-evidence-and-worklog"></a>
## 8. Evidence visibility and Worklog

The public progress record of a Ticket is its **Worklog**. Evidence visibility uses:

- `SERVER_ONLY`
- `PRIVATE_PLAYER`
- `TEAM`
- `PUBLIC_MATCH`

In cooperative play, newly earned Evidence is team-visible by default. In competitive play, it is private to the acting Player by default unless a Test or another explicit rule says otherwise.

Every accepted paid action immediately creates a public Worklog placeholder in authoritative event order. It identifies the sequence, actor, Ticket, exact card or named basic action, public target surface, Action cost, and action time. Concealed component or fault targets and detailed results retain their authorized private or team visibility until a rule publishes them.

The Worklog may also show:

- public stage and Ticket-status changes;
- accepted Isolation and its cited public Evidence references;
- public machine-state summaries;
- successful or failed Verify summaries;
- public conclusions and documented Evidence; and
- contribution history needed for scoring and review.

Successful and failed Verify summaries are public immediately because they change Ticket eligibility. Detailed supporting results still follow their Evidence visibility.

Spectators receive only `PUBLIC_MATCH` state. Reconnect snapshots, computer-player input, accessibility announcements, and presentation effects use the same player-safe projections.

## 9. First-version deck, round, and turn rules

- A legal first-version deck contains exactly 30 cards and no more than three copies of one card ID.
- Each Player draws five deck cards for the opening hand.
- A round contains one turn for each currently active Player in fixed seat order. How the first starting seat is selected remains open.
- At the start of each turn, the Player draws one card if the draw deck is nonempty, then receives two Actions.
- An empty draw deck skips that draw. It does not itself cause exhaustion, concession, or loss.
- The Player may take legal paid actions in any order. The turn ends voluntarily or automatically when no Actions remain, except while an explicit resolution window is open.
- Card costs may be 0, 1, or 2 Actions. A Player may play no more than one copy of the same 0-Action card name in one turn unless explicit card text says otherwise.
- There is no rules-level maximum hand size in the first version.
- One-shot cards enter discard after resolution. Installed or persistent cards remain in their defined match zone until an effect removes them.
- Cards represent prepared technical affordances. Reviewing authorized information, revising a Hypothesis, committing an evidence-supported Isolation, documenting, passing, and using configured utility resources remain basic system actions rather than draw-dependent permissions.

## 10. Search and Deck Refresh

Search Tokens and Deck Refresh Tokens are public utility resources, not cards in hand. Their starting amounts, closure grants, and storage caps are match configuration or preset values.

- Search costs one Search Token and one Action. The Player selects one card from their remaining draw deck, adds it to hand, and shuffles the remaining draw deck.
- Deck Refresh costs one Refresh Token and one Action. The Player combines discard with the remaining draw deck and shuffles them into a new draw deck. Cards in hand and Installed cards do not move.
- After a Ticket closure, each active Player gains the configured Search Token closure grant up to the configured cap and gains one Refresh Token up to the configured cap.
- A zero Refresh Token cap disables starting and earned Refresh Tokens.

The standard first-version preset starts each Player with three Search Tokens and one Refresh Token, caps Search Tokens at five and Refresh Tokens at one, and grants one Search Token per Ticket closure.

## 11. Candidate faults, Hypotheses, and Tests

- Each Ticket exposes a public authored candidate set. The server separately holds the true Fault instance or causal chain.
- A Player may freely revise a Hypothesis marker on their turn to identify up to two unresolved public candidates. The marker costs no Action, creates no score, and receives no truth-revealing response.
- A competitive Hypothesis is `PRIVATE_PLAYER`; a cooperative Hypothesis is `TEAM`. It may be documented voluntarily. Free-form conclusions are not authoritative rule objects.
- Each Test or Command execution creates one immutable action event and one attached result, even when the same card name was used before.
- An authored Test result may `SUPPORT`, `CONTRADICT`, `RULE_OUT`, or `CONFIRM` a candidate or Fault instance, reveal another observation, or be `INCONCLUSIVE`.
- Test Evidence changes Knowledge State, not machine state.
- A repeated Test is legal when its target or relevant machine state changed. The server rejects an identical same-target, same-state execution before payment when no new eligible outcome exists.
- A diagnostic substitution is a Test: its temporary known-good resource reverts after comparison. A permanent machine change requires a legal Repair. The core game does not combine Test and Repair into one event.

## 12. Evidence-supported Isolation and Repair gateway

**Commit Isolation** is a universal one-Action basic action. The Player selects one public candidate and cites the Evidence events that satisfy the Ticket's authored Isolation requirement.

- Isolation succeeds only when the selected candidate is a true actionable Fault and the cited authored requirements are satisfied.
- Accepted Isolation becomes Ticket-owned `PUBLIC_MATCH` progress and records the Fault, contributor, cited Evidence, actionable/deepest classification, and acceptance time.
- A false or insufficient commitment spends the Action, returns only `ISOLATION_NOT_SUPPORTED`, changes no machine state, and removes that Player's eligibility for any Root Cause reward on that Ticket. The response does not distinguish a wrong candidate from insufficient Evidence.
- Accepted Isolation moves the Ticket out of Diagnosis for the matching Repair gateway. Other Players may still run legal Tests.
- An ordinary Repair is legal only after accepted Isolation and when an eligible Repair Procedure targets that isolated Fault.
- Unsupported and speculative Repairs are rejected before payment. The core game contains no parts-cannon exception.
- A Repair consumes its printed Actions and one-shot card, records a machine-state change and repair history, and never proves Verify or Documentation complete.

## 13. Verify and return to Diagnosis

- Each Ticket defines explicit Verification procedures and success conditions.
- A Verify execution creates a distinct immutable result and costs its printed Actions.
- A pass satisfies only its named condition. All required conditions must have current passes after the latest relevant Repair.
- A failure or inconclusive result becomes Evidence, remains in history, preserves prior events and machine changes, invalidates now-stale passes, and returns the Ticket to Diagnosis.
- The Ticket may reveal only the new candidate or Fault-instance context legitimately implied by that failed condition.
- Players then resume Hypothesize and Test. A new accepted Isolation gates any further Repair.
- A later pass never erases the earlier failure.

## 14. Incremental Documentation and closure record

Documentation projects authoritative structured records; it does not create rule-significant free-text claims.

- **Document Live** is a universal one-Action basic action available throughout an active Ticket, including Diagnosis and after failed Verify.
- Document Live selects one undocumented authoritative card action and its attached eligible result.
- Publishing creates a `PUBLIC_MATCH` projection while preserving the source record and its prior private or team visibility.
- The original Worklog placeholder is enriched in place. A current publication event links to it, preserving event sequence, action time, publication time, and publisher.
- Published records are immutable and cannot be documented twice for another reward.
- Document Live returns the published action's exact source card from discard to its owner's hand once. The recovered card retains no prior private result; replaying it creates a new action and Evidence event.
- After all current Verify requirements pass, closure requires one structured bundle containing the accepted Isolation, cited decisive Evidence, every Repair in the accepted path, every failed Verify in that path, and all current passing Verify results.
- The closure bundle does not recover cards. Its exact Action cost and whether a Player receives a protected same-turn closure opportunity remain candidate decisions.
- A closed Ticket's structured record is immutable.

## 15. Complete closure transaction

A valid closure bundle resolves atomically in this order:

1. validate that the current Isolation, Repairs, and Verify passes form a complete authored causal path;
2. enrich and lock the Worklog records;
3. create the score events required by the resolved scoring policy;
4. archive and remove the Ticket from the active queue;
5. grant configured Search and Refresh resources to active Players;
6. reconcile the active queue after every closure effect finishes;
7. evaluate terminal conditions against the complete transaction; and
8. end the closer's turn.

Closure grants no separate card draw. Score termination is not evaluated between contingent contribution awards belonging to the same closure transaction. Exact contribution awards, the closure reward, and the closure-bundle Action cost remain unresolved.

## 16. Rule evolution

Changes to frozen behavior require:

1. an explicit design decision;
2. an updated rules version;
3. behavior-focused tests;
4. schema or saved-preset migration where applicable; and
5. release notes when player-visible behavior changes.
