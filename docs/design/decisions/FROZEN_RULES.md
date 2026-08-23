# Frozen Rules

This document records directions explicitly approved for the Server Repair TCG. "Frozen" means implementations and tests may rely on the rule. A frozen rule may still be changed deliberately through a documented rules-version migration.

The consolidated rules version approved on 2026-08-23 is `first-version-v1`.

Start with [`DECISION_INDEX.md`](DECISION_INDEX.md) for the decision hierarchy. Accepted unresolved decisions, new proposals that require rules review, and pressure against this ledger belong in [`UNFROZEN_RULES.md`](UNFROZEN_RULES.md). Git history and completed task records preserve the retired candidate and synchronization ledgers.

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

Canonical configuration fields are `termination_score` (`X`), `starting_ticket_count` (`S`), `queue_minimum` (`Q`), `starting_service_points_by_player[p]` (`H(p)`), `turn_time_limit_seconds` (`T`), `match_time_limit_seconds_by_player[p]` (`PT(p)`), `seat_limit` (`SL`), `player_count` (`Players`), `collaboration_mode` (`Mode`), `disconnect_grace_seconds` (`W`), `max_players_per_match` (`M`), `starting_search_tokens` (`SSC`), `ticket_search_tokens` (`TSC`), `max_search_tokens` (`MSC`), `starting_refresh_tokens` (`SRT`), and `max_refresh_tokens` (`MRF`).

- `termination_score` (`X`) is `-1` to disable score termination or an integer from 1 through 99.
- `starting_ticket_count` (`S`) is an integer from 1 through 99.
- `queue_minimum` (`Q`) is an integer from 0 through 99 and cannot exceed `S`.
- `Q = 0` disables automatic replenishment.
- When `Q > 0`, a completed resolution that leaves fewer than `Q` active Tickets requests deterministic seeded Ticket Builder output from the match's pinned generation configuration until the queue again contains `Q`.
- Queue-empty termination is possible only when the active Ticket queue reaches zero while `Q = 0`.
- `starting_service_points_by_player[p]` (`H(p)`) may be an integer from -99 through 99.
- When score termination is enabled, every eligible scoring entity must start below `X`.
- `seat_limit` (`SL`) cannot exceed the server-administered `max_players_per_match` (`M`).
- `disconnect_grace_seconds` (`W`) and `M` are controlled by server administrators rather than Room creators.
- `W` is a positive integral number of seconds supplied by the server.
- `turn_time_limit_seconds` (`T`) and player match clocks (`PT`) may be disabled during setup. Enabled time values are positive integral seconds.
- `T` and `PT` may both run. If both expire on the same authoritative instant, player-clock concession takes precedence over turn auto-pass.
- No client modal pauses a clock. An actionable authoritative decision window consumes its owner's time; only server resolution and reconnect synchronization use the frozen pauses.
- `SL` is capacity rather than required occupancy. Cooperative and training matches require at least one Player; competitive matches require at least two. A mode-owned preset may require more.
- A finite cooperative match wins when the team closes the queue with `Q = 0`.
- A finite competitive match with `Q = 0` ends when the queue is empty; the highest final Service Point total wins and equal highest totals are co-winners.

Initial Tickets may be fixed authored fixtures or deterministic Ticket Builder output under §18. Public matchmaking uses server-owned versioned presets and does not admit Custom configurations in the first version. Private Rooms may use validated Custom configurations. Ranked and campaign modes use their own approved versioned presets; the standard preset is a default, not an implicit mandate for every mode.

Counts, points, token quantities, and seconds are integers. Ratios and authored weights need not be. Every configuration field has its own validated range. The server rejects configurations outside administrator-owned capacity and safety caps before Room creation or match start; exact deployment ceilings are not game rules.

<a id="3-collaboration"></a>
## 3. Collaboration and contribution

- A match is competitive or cooperative.
- Cooperative play uses a shared team Service Point pool for victory.
- Player contributions remain individually attributable even when points enter a shared pool.
- A cooperative match does not end merely because all but one human teammate leaves or concedes.
- Every remaining cooperative human may choose to continue or concede.
- A departed player stops receiving turns and cannot reclaim the seat after departure becomes a concession.
- Tests, Isolation, Repairs, Verify, Documentation, and assists are recorded as distinct contributions.
- Each required actionable Fault instance has one Isolation scoring slot and one necessary-Repair scoring slot, each worth one Service Point.
- The earliest qualifying event in each `(Ticket, Fault instance, contribution class)` slot owns that slot if it remains on the final closure-valid causal path. Later equivalent events and assists remain statistics.
- Qualifying records remain pending until valid Ticket closure. Failed Verify preserves still-relevant pending records; superseded work remains statistical history but does not score.
- Closure atomically settles every eligible slot. Closure itself, Tests, Verify, Documentation, assists, and Root Cause/deepest-cause classification award no separate Service Points in the first version.
- The global scoring rule is public. A Ticket's exact slot identities and point budget remain server-only until closure so scoring does not reveal hidden causal shape. Settled score events are public.
- Competitive points go to the contributing Player. Cooperative points are written directly to the shared team score while every event retains its contributing Player ID; individual cooperative totals are statistics only.
- First-version Service Points never decrease. Penalties use Actions, cards, resources, or statistics instead.
- `H(p)` belongs to a Player seat. Cooperative starting team score is the sum of active Players' snapshotted `H(p)` values at match start and is not recalculated after departure.

## 4. Live and offline execution

- A live server match terminates when no human players remain, even if computer players or spectators remain. This prevents abandoned matches from consuming resources indefinitely.
- Spectators do not keep a live match alive.
- An offline training or simulation match may contain only computer players and may continue without a human player.
- Computer players never voluntarily concede.
- Computer players receive only the player-safe information available to their seat; they do not inspect hidden authoritative faults, causal chains, or random state directly.
- Computer Players are permitted in offline training/simulations and unranked private Rooms, in either collaboration mode, up to ordinary seat capacity. They are excluded from public/ranked matchmaking.
- Computer Players may be added or configured only before match start and never replace a departed Player mid-match.
- Their match contributions score normally and are marked as computer-authored. They receive no account progression, currency, rating, achievement, or other account reward.
- AI difficulty and presentation delay are product tuning, but every level remains subject to legal intents, seat-safe information, and authoritative timers.

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
- A Ready Player's deck is snapshotted for match setup. A Player must explicitly leave Ready before changing it and must pass legality checks before becoming Ready again. The game has no separate Equipment loadout.
- First-version Rooms are either public/listed or private/invite-or-code. There is no separate unlisted category.
- The creator begins as host. If the host leaves, hosting transfers to the longest-present eligible human member; an empty Room closes. Match authority always remains with the server.
- Every seated human must be Ready before a private match starts; computer Players are setup-ready. The host starts after minimum occupancy. Matchmaking presets may start automatically.
- The host may edit settings only while no match is active. A legality-relevant edit clears every Player's Ready state with a reason.
- Player seats are not reservable except for an active disconnected Player during `W`.
- A member may join an active Room as Spectator when capacity permits, but no Player may join an active Match. Between matches, a Spectator may explicitly request a vacant seat and then complete ordinary deck validation and Ready.
- A Room remains after results while members remain. A rematch creates a new Match and clears Ready. Empty/idle retention duration is administrator policy.
- Host computer-player controls are available only before a private unranked Match and within ordinary seat limits.
- Offline simulation uses a smaller local match configuration and does not require a network Room.
- Chat is not required by the first-version game rules. Any future chat and moderation contract is separate product/safety work.

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
- During `W`, the seat remains reserved, authoritative timers and automatic passes continue, and the disconnected socket may submit no intents. Reconnect before `W` resumes after snapshot installation without another seat confirmation and resets that disconnect's grace deadline.
- Three consecutive turn-time expirations concede the Player. A voluntary Pass or a completed intervening turn resets the count. A preset without `T` has no timeout-pass counter and relies on `PT` and `W`.
- Repeated disconnects do not accumulate a hidden gameplay penalty. Abuse controls are production policy.
- When one eligible competitive Player remains, the match ends after current resolution cleanup and that Player wins by forfeit.
- When a cooperative Player leaves or concedes, remove their hand, deck, discard, personal resources, and future turns; cancel unresolved intents; and release claims. Preserve resolved Ticket/team effects and historical attribution. A Player-controlled Installed object with no valid controller is discarded unless its resolved effect explicitly made it Ticket- or team-owned.

## 7. Ticket and action authority

- Tickets are shared and jointly actionable unless an explicit effect creates ownership or a claim.
- Ticket progress belongs to the Ticket rather than to the most recent Player.
- Each authoritative intent identifies the actor, action or card instance, target, intent ID, and expected match revision.
- The server serializes actions, validates target revisions, and rejects stale actions before payment against current authoritative state.
- A rejected stale action moves no card, spends no Action, and creates no Worklog event.
- Replenishment and random Ticket generation occur on the authoritative server in live play.
- Technical faults and causal chains remain hidden authoritative state until rules legitimately reveal them.
- A card or basic action identifies its legal active Ticket, Player zone, or Worklog target. No implied "other player" target is allowed in the engine contract.
- The first-version target relationship vocabulary supports explicit `SELF`, `ALLY`, `OPPONENT`, `ANY_PLAYER`, `ACTIVE_TICKET`, and defined zone/Worklog targets.
- First-version content contains no Ticket-claim/ownership effect and no effect that inspects another Player's hand, private Hypothesis, or unpublished Evidence.
- A corrupted or impossible active Ticket is quarantined without Player penalty or score. The server retains an audit record and attempts deterministic replacement from the pinned Builder configuration. If replacement fails, it pauses and invalidates the match rather than weakening constraints.
- Closure needs no special scoring lock beyond server serialization, expected revisions, and the atomic transaction.

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
- At match setup, the authoritative server selects the first starting seat uniformly from eligible seats using the match seed and records the result for replay. A round then contains one turn for each currently active Player in fixed seat order.
- At the start of each turn, the Player draws one card if the draw deck is nonempty, then receives two Actions.
- An empty draw deck skips that draw. It does not itself cause exhaustion, concession, or loss.
- The Player may take legal paid actions in any order. The turn ends voluntarily or automatically when no Actions remain, except while an explicit resolution window is open.
- Card costs may be 0, 1, or 2 Actions. A Player may play no more than one copy of the same 0-Action card name in one turn unless explicit card text says otherwise.
- There is no rules-level maximum hand size in the first version.
- One-shot cards enter discard after resolution. Installed or persistent cards remain in their defined match zone until an effect removes them.
- Cards represent prepared technical affordances. Reviewing authorized information, revising a Hypothesis, committing an evidence-supported Isolation, documenting, passing, and using configured utility resources remain basic system actions rather than draw-dependent permissions.
- Pass/end turn is always legal. Having cards but no useful paid action is not exhaustion, loss, or stalemate by itself.

## 10. Search and Deck Refresh

Search Tokens and Deck Refresh Tokens are public utility resources, not cards in hand. Their starting amounts, closure grants, and storage caps are match configuration or preset values.

- Search costs one Search Token and one Action. The Player selects one card from their remaining draw deck, adds it to hand, and shuffles the remaining draw deck.
- Deck Refresh costs one Refresh Token and one Action. The Player combines discard with the remaining draw deck and shuffles them into a new draw deck. Cards in hand and Installed cards do not move.
- After a Ticket closure, each active Player gains the configured Search Token closure grant up to the configured cap and gains one Refresh Token up to the configured cap.
- A zero Refresh Token cap disables starting and earned Refresh Tokens.

The standard first-version preset starts each Player with three Search Tokens and one Refresh Token, caps Search Tokens at five and Refresh Tokens at one, and grants one Search Token per Ticket closure.

Base Search is unrestricted within the remaining draw deck. A card may define a separately named narrower search effect. A mode may configure or disable Search Tokens but may not redefine base Search. Token starts, closure grants, and caps are nonnegative integers; grants clamp to the configured storage cap.

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
- A false or insufficient commitment spends the Action, returns only `ISOLATION_NOT_SUPPORTED`, changes no machine state, and records a rejected-attempt statistic. The rejected event fills no scoring slot, but it does not bar the Player from a later valid contribution on that Ticket. The response does not distinguish a wrong candidate from insufficient Evidence.
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
- The closure bundle costs zero Actions and does not recover cards.
- Successful Verify opens an immediate closure-resolution window before the normal zero-Actions automatic end-turn check. The active Player may publish the eligible bundle in that window.
- If the immediate window closes without closure, the eligible Ticket remains jointly actionable and any later active Player may publish its bundle. No Player receives ownership, first refusal, or a protected closure claim.
- Publishing a valid closure bundle is limited to once for that Ticket, resolves the complete closure transaction, and ends the active Player's turn.
- An invalid closure attempt is rejected before changing state and returns no hidden truth beyond the closure requirements already visible to that Player.
- Closure receives attributable team and Player statistics but awards no Service Points. Service Points may come only from the separately resolved causal-contribution scoring policy.
- A closed Ticket's structured record is immutable.

## 15. Complete closure transaction

A valid closure bundle resolves atomically in this order:

1. validate that the current Isolation, Repairs, and Verify passes form a complete authored causal path;
2. enrich and lock the Worklog records;
3. create the closure-settled Isolation and necessary-Repair score events required by §3;
4. archive and remove the Ticket from the active queue;
5. grant configured Search and Refresh resources to active Players;
6. reconcile the active queue after every closure effect finishes;
7. evaluate terminal conditions against the complete transaction; and
8. end the closer's turn.

Closure grants no separate card draw or Service Point reward. Score termination is not evaluated between causal-contribution awards belonging to the same closure transaction.

After the current atomic transaction or authoritative resolution window completes, terminal evaluation uses this precedence:

1. administrator invalidation;
2. live no-human abandonment;
3. last-eligible competitive forfeit;
4. satisfied queue-empty and/or score objectives; and
5. proven stalemate.

Every simultaneously satisfied gameplay trigger is recorded. All score events from one transaction apply before totals are compared; the highest competitive final total wins and equal highest totals are co-winners. If queue-empty and score objectives trigger together, both reasons are recorded; competitive results still use highest final Service Points and cooperative play records a team win.

Normal terminal evaluation waits until the resolution stack/window is empty. Administrator invalidation and no-human resource cleanup may interrupt. Invalidation produces an invalid/no-contest result, no account rewards or rating changes, and a retained audit record.

Stalemate exists only when the server can prove every active Player can only Pass, no queued resolution or future deterministic draw/resource change can create progress, and no active Ticket can reach closure. Competitive stalemate uses highest current score; cooperative stalemate is a loss. An offline all-computer simulation requires a finite queue, score target, or configured turn/closure cap; reaching only the simulation cap stops without declaring a gameplay winner. Public play admits no intentionally endless configuration. Private/admin test matches may be stopped as no-contest.

## 16. Equipment removal and Qualifications

- **Equipment**, as an account-owned or pre-match mechanical loadout category, is removed from the game. There are no Equipment slots, Equipment inventory, Equipment Store items, starting Installed Equipment objects, or Equipment effects.
- This removal does not remove technical **Tools** from the domain model or from cards. A diagnostic Tool is technical subject matter, not an account Equipment system.
- Qualifications are non-mechanical honor badges that record campaign accomplishments or standing.
- Qualifications are not bought, equipped, drawn, consumed, installed, or included in a match loadout.
- Qualifications do not change Actions, cards, decks, Tests, Isolation, Repair, Verify, Documentation, Ticket access, story access, matchmaking, or any other gameplay rule.
- Qualifications may be displayed in account, campaign-history, profile, or progression views as recognition only.
- Any future skill-rating or matchmaking-rank system must use a separate decision and data model rather than Qualification state.

## 17. Rule evolution

Changes to frozen behavior require:

1. an explicit design decision;
2. an updated rules version;
3. behavior-focused tests;
4. schema or saved-preset migration where applicable; and
5. release notes when player-visible behavior changes.

## 18. Constraint-driven Ticket Builder

One reusable Ticket Builder serves campaign, mission, challenge, training, cooperative, and competitive modes. It assembles valid Ticket definitions from authored domain relationships and rule templates under a versioned generation-constraint configuration; it does not generate unconstrained procedural prose.

The configuration contains, when relevant:

- scenario/mode context and requested Ticket count;
- seed, generator version, and content version;
- allowed and excluded stable domain IDs/tags;
- guaranteed Ticket categories and required teaching beats;
- authored composite difficulty bounds;
- causal shape bounds for distinct required actionable Fault-instance count, longest required causal-path depth, and required inbound/outbound branching;
- a versioned Progressive Difficulty target/band by generated Ticket index with an explicit ceiling; and
- duplicate-structure policy.

Fault count, actionable-cause count, causal depth, and authored composite difficulty remain separate constraints. Branch constraints are evaluated on the validated actionable causal DAG. A scenario owns its Progressive Difficulty profile; the Builder contains no universal progression formula.

Generation canonically orders eligible authored parts, applies hard constraints, assembles and validates complete candidates, and then performs seeded weighted selection. “Random” means deterministic pseudorandom selection: identical configuration, content version, generator version, and seed produce identical Ticket snapshots. A content version therefore identifies an immutable authored input set for generation.

An unsatisfiable configuration creates no partial Ticket and fails with structured diagnostics. Guarantees are never silently relaxed. A scenario may declare an explicit fallback configuration, which is a separate auditable generation attempt.

Duplicate causal fingerprints are forbidden in one active queue by default; training/simulation may explicitly allow them. Inputs use stable server-owned IDs/tags. Player-visible saves never expose hidden causal selections or author-only exclusion rationale.

Persist generator version, content version, seed, configuration, and produced Ticket snapshots. Existing saves and replays use their stored snapshots; new generation remains pinned to its recorded versions until an explicit migration.

Every generated Ticket must satisfy the same frozen authored contract as a fixed fixture: public candidates, server-only causal truth, authored Evidence outcomes, Isolation requirements, Repair paths, Verify conditions, and closure requirements.

## 19. First-version multiplayer and information scope

- Competitive play is free-for-all. Cooperative play has one shared team. Competitive teams and multiple cooperative teams are deferred beyond the first version.
- Player hands remain private to their owners. Cooperative Evidence and Hypotheses retain team visibility.
- Spectator projection is live and contains only `PUBLIC_MATCH` information. A later broadcast delay is product policy and does not change visibility.
- Public result information includes public match facts, settled score events, closure attribution, and public contribution statistics. Private/team Evidence does not become public at match end. A Player may persist their own authorized private detail and account aggregates.
- Costs above two Actions, Ticket claims, private-state attack cards, mid-match computer replacement, and reserved Player seats are absent from the first version.

## 20. Result statistics

The authoritative result records:

- outcome and all terminal reasons;
- final Player/team scores;
- Ticket closure attribution and settled causal awards;
- contribution counts by Tests, Isolation, Repairs, Verify, Documentation, and assists;
- rejected Isolation, failed Verify, redundant/superseded actions, turns, authoritative elapsed time, disconnects, and concessions.

Every statistic is attributed to its authoritative event actor, Ticket, and team where applicable; closure never implies ownership of earlier work. Useful versus redundant work derives from final-path scoring eligibility and authored metadata, not retrospective free-form analysis.

The immutable match result and each account's authorized aggregates may persist. Hidden opponent Evidence is never copied into an account record. Retention duration is product policy. Server results derive only from the authoritative event log, Ticket records, and score ledger; client counters are projections.

## 21. Content, interface, and production boundaries

- Individual card costs within the frozen 0/1/2 envelope, targets, prerequisites, use limits, 0-Action safety, rewards, and event-frequency curves are validated content and balance work rather than open engine rules.
- First-version high-risk cards impose no score penalty. Any risk uses explicit Action, card, or resource behavior.
- Player-count scaling selects Ticket Builder constraints and mode presets; it does not change the two-Action turn or core card text.
- Queue layout, pagination, Room-setting layout, and result presentation are interface work, provided every authorized public state remains accessible.
- Exact deployment caps, abuse controls, idle retention, AI heuristics/presentation delay, and broadcast delay are production policy.
- Chat/moderation, competitive teams, multiple cooperative teams, Ticket claims, private-state attack cards, mid-match computer replacement, and costs above two require a later rules version if introduced.
