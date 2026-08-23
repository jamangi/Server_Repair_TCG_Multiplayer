# Unfrozen Rules

This document is the canonical inventory of Server Repair TCG rules that remain open. It also records concrete freeze recommendations and pressure against approved rules so implementation does not silently choose behavior.

Start with [`DECISION_INDEX.md`](DECISION_INDEX.md) for authority and [`FROZEN_RULES.md`](FROZEN_RULES.md) for approved behavior. This is the only active place for open rule decisions. Git history and completed task records preserve the retired candidate and synchronization ledgers.

Recommendations in this file are non-authoritative until the user approves them. The following labels are used:

- **Freeze now:** the existing direction is sufficiently specified and low-risk.
- **Adjust, then freeze:** adopt the stated narrower rule before moving it to the frozen ledger.
- **Keep unfrozen:** the choice needs explicit user judgment, prototyping, or evidence.
- **Defer outside first version:** explicitly exclude the capability from the first engine while preserving a future extension point.
- **Remove from rule ledger:** treat the item as content, interface, moderation, or production policy after its rules boundary is fixed.

<a id="0-freeze-review-summary-and-frozen-rule-pressure"></a>
## 0. Freeze-review summary and frozen-rule pressure

There are no active unsynchronized decisions to transition. `TASK-007` synchronized every former entry, so its resolved history does not become unfrozen rules. There are also no active candidates. Retiring those empty ledgers leaves `FROZEN_RULES.md` and this file as the only rule sources.

No repository-migration blocker prevents the freeze review. The remaining blockers are explicit design approvals:

1. `SCORE-001` controls Service Point event shape and is required before the scoring engine and final terminal resolver can be stable.
2. `GEN-001` controls Ticket Builder input, determinism, and failure behavior and is required before generated Tickets or versioned campaign saves can be stable.
3. Terminal precedence, departure cleanup, and the minimum Room lifecycle need small first-version decisions before authoritative multiplayer implementation.
4. The first starting-seat selection rule was left open inside the frozen ledger but omitted from the prior unfrozen inventory.

### Pressured frozen rules

| Pressure | Frozen location | Problem | Recommendation |
| --- | --- | --- | --- |
| `PRESSURE-001` | Frozen §12 | A rejected Isolation currently removes eligibility for a “Root Cause reward,” but `SCORE-001` still asks whether Root Cause is a reward at all. | Make Root Cause a statistic only. Change the frozen rejection consequence to the spent Action, a failed-attempt statistic, no truth leak, and no award for that rejected event; do not ban the Player from later valid contribution credit. |
| `PRESSURE-002` | Frozen §9 | The paragraph is labeled frozen while saying the first starting seat remains open, and the old unfrozen inventory did not track it. | Freeze seeded server selection from eligible starting seats, record it for replay, then use the already-frozen fixed seat order. |
| `PRESSURE-003` | Frozen §2 | Queue refill says it creates “random Tickets,” while `GEN-001` is converging on constraint-driven, seeded Ticket Builder output. | After `GEN-001` is approved, say refill requests Builder output from the match's pinned generation configuration; randomness is seeded selection within those constraints. |
| `PRESSURE-004` | Frozen §10 | Base Search selects any card, while the old balance inventory allowed mode-level Search restrictions that could silently weaken that rule. | Protect base Search as unrestricted within the remaining draw deck. A card may define a separate narrower search effect; modes may disable/configure tokens but must not redefine base Search. |

The other open items below extend frozen rules without contradicting them.

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

**Recommendation — Freeze now:** move this canonical vocabulary into Frozen §2/§10. The meanings and first-version deck, turn, Search, Refresh, and standard-preset values are already approved; keeping their names in the open ledger creates false uncertainty.

## 2. Match configuration and first turn

| Open item | Recommendation | Proposed first-version boundary |
| --- | --- | --- |
| Creator-customizable settings versus presets | **Adjust, then freeze** | Public matchmaking uses server-owned, versioned presets. Private Rooms may use validated custom settings. `W`, `M`, and production safety caps remain administrator-owned. |
| Custom configurations in public matchmaking | **Freeze now** | Do not permit them in first-version public matchmaking. |
| Production limits for large queues, capacities, and duration | **Remove from rule ledger** | Freeze only that the server enforces caps before Room creation or match start. Keep exact deploy-specific ceilings in administrator configuration. |
| Permitted `T`, `PT`, and `W` values | **Adjust, then freeze** | Enabled values are positive integral seconds; `T` and `PT` may be `null`; `W` is always administrator-supplied. Deployment caps are production policy. |
| Enabling both `T` and `PT` and simultaneous expiration | **Freeze now** | Both may run. If both expire on the same authoritative instant, player-clock concession takes precedence over turn auto-pass. |
| Clock behavior during modal decisions | **Freeze now** | No client modal pauses a clock. Time pauses only for frozen server-resolution and reconnect synchronization boundaries; an actionable authoritative decision window consumes its owner's time. |
| Starting below `SL` and minimum occupancy | **Adjust, then freeze** | `SL` is capacity, not required occupancy. Cooperative/training matches require at least one Player; competitive matches require at least two. Mode-owned presets may require more. |
| Numeric representation and schema ranges | **Freeze now** | Counts, points, token quantities, and seconds are integers. Ratios and authored weights need not be. Every field has its own validated range. |
| Search/Refresh custom ranges | **Adjust, then freeze** | Token starts, closure grants, and caps are nonnegative integers; starts and grants may exceed remaining capacity but storage always clamps to the cap. The standard preset remains unchanged. |
| Standard preset in ranked and campaign modes | **Adjust, then freeze** | Ranked and campaign modes use their own versioned approved presets. The standard preset is the default, not an implicit mandate for every mode. |
| Room-creation interface grouping | **Remove from rule ledger** | The interface must distinguish player settings from administrator limits, but layout is an application-shell decision. |
| First starting seat | **Adjust, then freeze** | The authoritative server selects uniformly from eligible starting seats using the match seed, records the result, and then follows fixed seat order for every round. |

## 3. Ticket generation and campaign selection

<a id="gen-001"></a>
### GEN-001 — Constraint-driven Ticket Builder

**Status:** Unfrozen; foundation blocker for generated Tickets and versioned campaign saves.

One reusable Ticket Builder should generate Ticket instances for campaign, mission, challenge, training, cooperative, and competitive modes. It consumes a generation-constraint configuration rather than a preselected eligible whole-Ticket pool. Fixed authored fixtures remain valid for tutorials, audits, and examples.

Generated Tickets must provide the frozen authored surfaces: public candidates, server-only causal truth, authored Evidence outcomes, Isolation requirements, Repair paths, Verify conditions, and closure requirements. Generated content is assembled from validated authored domain relationships and rule templates; it is not unconstrained procedural prose.

| Open item | Recommendation | Proposed resolution |
| --- | --- | --- |
| Exact configuration contract | **Adjust, then freeze** | Version the config and include scenario/mode context, requested count, seed, generator version, allowed and excluded domain IDs/tags, category guarantees, difficulty bounds, causal shape bounds, teaching beats, Progressive Difficulty profile, and duplicate policy. |
| Difficulty definition | **Adjust, then freeze** | Use an authored composite difficulty rating for content selection. Keep fault count, actionable-cause count, and causal depth as separate structural constraints rather than pretending one automatically measures difficulty. |
| Branching shape and depth | **Adjust, then freeze** | Evaluate a validated actionable causal DAG: node count is distinct actionable Fault instances, depth is the longest required causal path, and branch limits apply to required inbound/outbound causal edges. |
| Progressive Difficulty (`PD`) | **Adjust, then freeze** | A scenario supplies a versioned difficulty target or band by generated Ticket index, with an explicit ceiling. Do not embed one universal progression formula in the Builder. |
| Solver and weighted randomization | **Adjust, then freeze** | Canonically order eligible authored parts, filter by hard constraints, assemble/validate complete candidates, then choose by seeded weighted randomization. Identical config, content version, generator version, and seed must produce identical Ticket snapshots. |
| Unsatisfiable configurations | **Freeze now** | Fail with structured diagnostics and create no partial Ticket. Never silently relax a guarantee. A scenario may name an explicit fallback configuration, which is a separate auditable generation attempt. |
| Duplicate active structures | **Adjust, then freeze** | Default to no duplicate causal fingerprint in one active queue. Training/simulation configs may explicitly allow duplicates. |
| Exclusions and story-state safety | **Adjust, then freeze** | Inputs use stable server-owned domain IDs/tags. Player-visible saves retain scenario-safe constraints, never hidden causal selections or author-only exclusion rationale. |
| Generator migrations and deterministic saves | **Freeze now** | Persist generator version, content version, seed, config, and the produced Ticket snapshot. Existing saves/replays use the stored snapshot; new generation uses the pinned version until an explicit migration. |

## 4. Scoring and closure contention

<a id="score-001"></a>
### SCORE-001 — Closure-settled causal contribution scoring

**Status:** Unfrozen; foundation blocker for scoring events and terminal resolution.

The accepted model is a pending causal-contribution ledger. Qualifying causal events create attributable pending records. Successful Verify does not pay by itself. Publishing a valid closure bundle atomically settles still-relevant records in the final causal path. An unclosed Ticket pays nothing, closure itself awards no Service Point, and rejected, redundant, or superseded work remains statistical history.

| Open item | Recommendation | Proposed first-version resolution |
| --- | --- | --- |
| Eligible contribution classes | **Adjust, then freeze** | Award one Service Point for each accepted Isolation of a required actionable Fault and one for each necessary Repair of that Fault in the final valid causal path. Tests, Verify, Documentation, and assists remain attributed statistics in the first version. |
| Rubric and budget visibility | **Adjust, then freeze** | Publish the global scoring rule. Keep a Ticket's exact eligible slots and total budget server-only until closure so scoring does not reveal hidden fault count or causal shape; publish settled awards at closure. |
| Multi-fault granularity and weights | **Freeze now** | Use one unique Isolation slot and one unique Repair slot per required actionable Fault instance, each worth one point. Do not use authored variable weights in the first version. |
| Revised causal paths | **Freeze now** | A record remains eligible only if its event belongs to the final closure-valid causal path. Failed Verify preserves pending records; a later superseding path may make them statistical-only. |
| Repeats, assists, and duplicates | **Adjust, then freeze** | Uniqueness key is `(Ticket, Fault instance, contribution class)`. The earliest qualifying event on the final path owns the slot. Later equivalent events and assists remain statistics and cannot duplicate the award. |
| Root Cause treatment | **Adjust, then freeze** | Root Cause/deepest-cause identification is a statistic only, not a separate point or bonus. Required deep Faults already score through the normal Isolation slot. |
| Rejected Isolation | **Adjust Frozen §12, then freeze** | Spend the Action, record the rejected attempt, reveal only `ISOLATION_NOT_SUPPORTED`, and award nothing for that event. Do not permanently bar the Player from later valid slots on the Ticket. |
| Pending-record visibility | **Adjust, then freeze** | Preserve the source event's normal visibility, but keep pending eligibility and slot identity server-only until closure. Settled score events are public. |
| Cooperative aggregation | **Freeze now** | Write settled points directly to the shared team score while retaining the contributing Player ID on each score event. |
| Individual cooperative points | **Freeze now** | Statistics only; they are not a second gameplay score. |
| Negative scoring | **Freeze now** | First-version Service Points never decrease and cannot fall below their configured starting value. Penalties use Actions, cards, resources, or statistics instead. |
| Handicap ownership | **Adjust, then freeze** | `H(p)` belongs to a Player seat. In cooperative play, snapshot the team's starting score as the sum of active Players' `H(p)` values at match start; departures do not recalculate it. |

This recommendation intentionally starts with the narrow Isolation/Repair rubric already exercised by the audited examples. Decisive Tests or Verify can gain values only through a later rules-version and balance migration.

## 5. Ticket queue and contention

| Open item | Recommendation | Proposed first-version boundary |
| --- | --- | --- |
| Explicit Ticket claims | **Defer outside first version** | Do not author claim or ownership effects. Tickets remain shared. |
| Contributions to claimed Tickets | **Defer outside first version** | Remove with claims; revisit both together if claims are introduced later. |
| Large-queue pagination | **Remove from rule ledger** | All public Ticket state must remain accessible; spatial layout and pagination are interface concerns. |
| Impossible or corrupted Tickets | **Adjust, then freeze** | Quarantine the Ticket, award no penalty or score, preserve an audit record, and attempt deterministic replacement from the pinned Builder config. If replacement fails, pause/invalidate the match rather than silently weaken constraints. |
| Closure scoring locks | **Freeze now** | Add no special claim or lock. Existing authoritative serialization, expected revisions, and one atomic closure transaction are sufficient. |

## 6. Card content and balance

| Open item | Recommendation | Proposed first-version boundary |
| --- | --- | --- |
| Individual 0/1/2 Action costs | **Remove from rule ledger** | Keep costs in validated card content and balance tests. |
| Costs above two in later versions | **Defer outside first version** | The first-version engine accepts only the frozen 0/1/2 envelope. |
| Safety of individual 0-Action cards | **Remove from rule ledger** | Enforce the frozen same-name limit; evaluate each card in content review and simulations. |
| Effect targets, prerequisites, and limits | **Remove from rule ledger** | Card definitions must use explicit engine-supported target/effect contracts; individual choices are content. |
| Search restrictions | **Adjust Frozen §10, then freeze** | Base Search always selects any card in the remaining draw deck. Cards may define separately named narrower search effects; modes may configure token availability but not alter base Search. |
| High-risk card penalties | **Defer outside first version** | Do not introduce score penalties. Any first-version risk must be explicit card/resource/Action behavior. |
| Player-count scaling | **Adjust, then freeze** | Scale Ticket Builder constraints and mode presets, not the two-Action turn or core card text. Exact curves are content/balance data. |
| No useful legal action | **Freeze now** | Pass/end turn is always legal. Having no useful paid action is not exhaustion, loss, or stalemate by itself. |

## 7. Terminal conditions and results

| Open item | Recommendation | Proposed first-version resolution |
| --- | --- | --- |
| Terminal precedence | **Adjust, then freeze** | Resolve the current atomic transaction/window first. Then apply: administrator invalidation; live no-human abandonment; last-eligible competitive forfeit; queue/score objectives; proven stalemate. Record every simultaneously satisfied gameplay trigger. |
| Simultaneous score crossings | **Freeze now** | Apply all score events in the transaction, then compare final totals. Highest total wins; equal highest totals are co-winners. Crossing order inside the transaction has no effect. |
| Queue-empty and score trigger together | **Freeze now** | Record both reasons. Competitive result still uses highest final Service Points; cooperative result is a team win. |
| Competitive teams satisfying `X` | **Defer outside first version** | First-version competitive play is free-for-all. |
| Unresolved non-closure effects | **Freeze now** | Delay normal terminal evaluation until the authoritative resolution stack/window is empty. Administrator invalidation and no-human resource cleanup may interrupt. |
| Stalemate | **Adjust, then freeze** | Stalemate exists only when the server can prove that every active Player can only Pass, no queued resolution or future deterministic draw/resource change can create progress, and no active Ticket can reach closure. Competitive result uses highest current score; cooperative result is a loss. |
| Offline all-computer termination | **Adjust, then freeze** | Require a finite queue, score target, or configured simulation turn/closure cap. Reaching only the simulation cap stops without declaring a gameplay winner. |
| Administrator invalidation | **Freeze now** | End with an invalid/no-contest result, no account rewards or rating changes, and a retained audit record. |
| Intentionally endless live configurations | **Defer outside first version** | Do not admit them to public play. Private/admin test matches may be stopped as no-contest; no unanimous-vote protocol is needed initially. |

## 8. Timers, inactivity, and departure cleanup

| Open item | Recommendation | Proposed first-version resolution |
| --- | --- | --- |
| Repeated automatic turn passes | **Adjust, then freeze** | Three consecutive turn-time expirations concede the Player. A voluntary Pass or a completed intervening turn resets the count. Mode presets without `T` rely on `PT`/`W` and have no timeout-pass counter. |
| Repeated disconnects | **Freeze now** | Each reconnect before `W` restores the seat and resets that disconnect's grace deadline. Repetition does not accumulate a hidden gameplay penalty; abuse controls are production policy. |
| Last eligible competitive Player | **Freeze now** | End immediately after current resolution cleanup and award that Player a forfeit win. |
| Cooperative leaver cleanup | **Adjust, then freeze** | Remove the leaver's hand, deck, discard, personal resources, and future turns; cancel unresolved intents; release claims; preserve already-resolved Ticket/team effects and historical attribution. Player-controlled Installed objects with no valid controller are discarded unless their explicit effect says they became Ticket/team-owned on resolution. |
| Resume before `W` | **Freeze now** | Reinstall the player-safe snapshot and resume without another seat confirmation. The seat remains reserved during grace. |

## 9. Multiplayer teams, targeting, and information exceptions

| Open item | Recommendation | Proposed first-version boundary |
| --- | --- | --- |
| Competitive teams | **Defer outside first version** | Competitive is free-for-all; cooperative uses one shared team. |
| Multiple cooperative teams | **Defer outside first version** | One cooperative team only. |
| Effect target relationships | **Adjust, then freeze** | The engine supports explicit `SELF`, `ALLY`, `OPPONENT`, `ANY_PLAYER`, `ACTIVE_TICKET`, and defined zone/Worklog targets; each effect chooses from this contract. |
| Inspecting another Player's private state | **Defer outside first version** | No card may inspect another hand, private Hypothesis, or unpublished Evidence. |
| Teammate hand visibility | **Freeze now** | Hands remain private to their owners. Cooperative Evidence and Hypotheses retain the frozen team visibility. |
| Competitive spectator delay | **Freeze now** | First-version spectator projection is live because it contains only `PUBLIC_MATCH` information. Delay may be added later as a broadcast policy without changing visibility. |
| Result-screen visibility | **Adjust, then freeze** | Public match facts, settled score events, closure attribution, and public contribution statistics are public. Private/team Evidence does not become public merely because the match ended. A Player may persist their own private detail and account aggregates. |

## 10. Computer players

| Open item | Recommendation | Proposed first-version boundary |
| --- | --- | --- |
| Counts and modes | **Adjust, then freeze** | Allow computer Players in offline simulations/training and unranked private Rooms, in either collaboration mode, up to ordinary seat capacity. Exclude them from public/ranked matchmaking. |
| Filling seats | **Freeze now** | Add/configure them only before match start; never insert a replacement computer Player mid-match. |
| Difficulty and decision time | **Remove from rule ledger** | All levels use only seat-safe information and legal intents. Heuristics and presentation delay are AI/product tuning; authoritative timers still apply. |
| Rewards and statistics | **Adjust, then freeze** | Computer contributions score normally inside the match and are marked as computer-authored. Computer accounts receive no progression, currency, rating, or achievement rewards. |
| Endless offline match | **Freeze with Terminal §7** | Require a finite gameplay objective or simulation cap. |

## 11. End-of-match statistics

| Open item | Recommendation | Proposed first-version boundary |
| --- | --- | --- |
| Minimum result metrics | **Adjust, then freeze** | Record outcome/reasons, final scores, closure attribution, settled causal awards, counts by contribution class, rejected Isolation, failed Verify, redundant actions, turns, elapsed authoritative time, disconnects, and concessions. |
| Attribution | **Freeze now** | Attribute every statistic to its authoritative event actor, Ticket, and team where applicable; never infer ownership from who closed the Ticket. |
| Useful versus redundant work | **Freeze now** | Derive it from final-path scoring eligibility and authored metadata, not retrospective free-form analysis. |
| Account persistence | **Adjust, then freeze** | Persist the immutable match result plus per-account authorized aggregates. Do not copy hidden opponent Evidence into an account record. Retention duration is account/product policy. |
| Derivation source | **Freeze now** | Derive result statistics from the authoritative event log, Ticket records, and score ledger; client counters are projections only. |

## 12. Room lifecycle and roles

| Open item | Recommendation | Proposed first-version boundary |
| --- | --- | --- |
| Room visibility | **Adjust, then freeze** | Support public listed Rooms and private invite/code Rooms. Do not create a separate unlisted category initially. |
| Ownership and host transfer | **Adjust, then freeze** | Creator begins as host. If the host leaves, transfer to the longest-present eligible human member; close an empty Room. Host departure never transfers match authority away from the server. |
| Ready and start | **Adjust, then freeze** | Every seated human must be Ready; computer Players are setup-ready. Host starts a private Room after mode minimum occupancy; matchmaking presets may start automatically. |
| Editing settings after join | **Freeze now** | Host may edit only while no match is active. A legality-relevant change clears every Player's Ready state with a reason. |
| Reserved Player seats | **Defer outside first version** | No reservations beyond a disconnected active Player's frozen grace-period seat. |
| Late join | **Freeze now** | Members may join an active Room as Spectators if capacity permits, but no Player joins an active Match. |
| Spectator taking a vacated seat | **Freeze now** | Permit an explicit seat request only between Matches, followed by normal deck validation and Ready. |
| Spectator chat and moderation | **Remove from rule ledger** | Chat is not required for first gameplay. If added, moderation is a separate safety/product contract. |
| During disconnect grace | **Adjust, then freeze** | Reserve the seat, allow authoritative timers and automatic passes to continue, accept no intents from the disconnected socket, and restore by player-safe snapshot on reconnect. |
| Room retention and rematches | **Adjust, then freeze** | Keep the Room after results while members remain; a rematch creates a new Match and clears Ready. Empty/idle retention duration is administrator policy. |
| Host computer-player controls | **Freeze now** | Add, remove, and configure computer Players only before a private unranked Match and only within ordinary seat limits. |
| Offline simulations and Room objects | **Freeze now** | Offline simulations use a smaller local match configuration and do not require a network Room object. |

## 13. Explicitly deferred and non-rule work

The following should not block freezing the first-version engine foundation once their boundaries above are approved:

- individual card balance, effect catalogs, and exact content rewards;
- queue layout, Room-setting layout, result-screen presentation, and pagination;
- deployment capacity ceilings, abuse controls, retention durations, and broadcast delay;
- chat and moderation;
- competitive teams, multiple cooperative teams, mid-match computer replacement, Ticket claims, private-state attack cards, and Action costs above two; and
- future skill rating or matchmaking ranking, which remains separate from Qualifications.

## 14. Change discipline

When the user approves a recommendation:

1. Add the normative behavior to the appropriate frozen section and remove it here.
2. Remove any resolved pressure statement from this file.
3. Update schemas and examples when persisted or transmitted behavior changes.
4. Add behavior-focused tests before implementation relies on the rule.
5. Record migrations for saved presets, Tickets, matches, or accounts.

Newly discovered rule questions or pressure enter this file directly. Rejected or superseded options remain in discussion, completed tasks, and Git history rather than creating another permanent ledger.
