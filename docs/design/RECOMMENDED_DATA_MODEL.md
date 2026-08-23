# Recommended Configurable-Match Data Model

## Status and authority

This is an architectural recommendation, not a frozen runtime schema. [`decisions/FROZEN_RULES.md`](decisions/FROZEN_RULES.md) controls approved behavior. [`decisions/UNFROZEN_RULES.md`](decisions/UNFROZEN_RULES.md) controls open policy. Field names and shapes below identify implementation opportunities; versioned JSON Schemas remain the machine-readable contracts.

In particular:

- `SCORE-001` does not yet define eligible contribution classes, values, visibility, duplicate handling, Root Cause treatment, handicap policy, or cooperative aggregation.
- `GEN-001` does not yet define a Ticket Builder configuration, constraint solver, generation algorithm, failure behavior, or migration policy.
- no recommendation below creates an account/loadout Equipment system or a runtime Qualification effect.

## Design principles

- Represent Players as ordered collections keyed by stable IDs; never use `player1`, `player2`, or a hardcoded seat shape.
- Keep technical domain definitions, authored Ticket content, cards, authoritative runtime state, and player-safe views separate.
- Keep Knowledge State separate from machine state.
- Give every intent, accepted action, result, semantic event, Worklog entry, publication, contribution, score event, and closure stable immutable identity.
- Derive public/team/private projections from one authoritative state and the four frozen visibility categories.
- Compose queue, scoring, clocks, and termination as policies rather than one monolithic mode switch.
- Treat frozen first-version deck/turn behavior as part of `rules_version`, not Room customization.
- Use fixed authored Ticket fixtures until a later `GEN-001` decision defines generation. Seeded/versioned generation remains a future contract opportunity only.

## Versioned first-version rules profile

The following frozen values belong to the rules profile selected by `rules_version`:

```text
FirstVersionRulesProfile
  legal_deck_size: 30
  max_copies_per_card_id: 3
  opening_hand_size: 5
  cards_drawn_at_start_of_turn: 1
  actions_per_turn: 2
  legal_printed_action_costs: [0, 1, 2]
  max_hand_size: null
  empty_draw_is_loss: false
  max_same_name_zero_action_plays_per_turn: 1
```

An empty draw deck skips the draw. It never creates loss, exhaustion, or concession by itself. The first starting-seat selection policy remains unresolved even though seat order after selection is fixed.

## Server capabilities

```text
ServerMatchCapabilities
  max_players_per_match: integer                 // M
  max_spectators_per_room: integer
  disconnect_grace_seconds: integer              // W
  max_starting_tickets: integer
  max_queue_minimum: integer
  allowed_presets: MatchPresetId[]
  allow_custom_matches: boolean
```

`M` and `W` are server-administered. Resource limits may be stricter than broad ranges accepted by offline tools. Ticket Builder capabilities are deliberately absent while `GEN-001` remains unfrozen.

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
  starting_search_tokens: integer                // SSC
  ticket_search_tokens: integer                  // TSC closure grant
  max_search_tokens: integer                     // MSC
  starting_refresh_tokens: integer               // SRT
  max_refresh_tokens: integer                    // MRF; 0 disables starting/earned Refresh
  player_overrides: PlayerSetup[]
  preset_id: string | null
  rules_version: string
```

The server validates `player_count <= seat_limit <= max_players_per_match` before starting. Deck size, copy limit, opening hand, draw cadence, Actions, hand limit, and empty-draw behavior come from the versioned rules profile. Disconnect grace belongs to capabilities.

No `min_faults_per_ticket`, `max_faults_per_ticket`, `progressive_difficulty`, Root Cause bonus, or other Ticket Builder/scoring-policy field belongs in this current configuration recommendation. Those fields require `GEN-001` or `SCORE-001` decisions first.

```text
PlayerSetup
  player_id: PlayerId
  seat_index: integer
  team_id: TeamId
  starting_service_points: integer               // H(p)
  player_time_limit_seconds: integer | null       // optional PT(p)
  controller_type: human | computer
```

## Authoritative match state

```text
MatchState
  match_id: MatchId
  rules_version: string
  configuration: MatchConfiguration
  status: setup | active | resolving | complete | invalidated
  ordered_player_ids: PlayerId[]
  players_by_id: Map<PlayerId, PlayerState>
  teams_by_id: Map<TeamId, TeamState>
  active_ticket_ids: TicketInstanceId[]
  tickets_by_id: Map<TicketInstanceId, TicketState>
  knowledge_states_by_id: Map<KnowledgeStateId, KnowledgeState>
  action_records_by_id: Map<ActionId, ActionRecord>
  events_by_id: Map<EventId, GameEvent>
  ordered_event_ids: EventId[]
  worklog_entries_by_id: Map<WorklogEntryId, WorklogEntry>
  contribution_records_by_id: Map<ContributionId, ContributionRecord>
  score_event_ids: EventId[]
  closure_records_by_id: Map<ClosureId, ClosureRecord>
  ticket_policy_state: TicketPolicyState
  turn_state: TurnState
  result: MatchResult | null
  revision: integer
```

The authoritative match may reference server-only Ticket truth and random state. It is never sent directly to a client.

## Room state

```text
RoomState
  room_id: RoomId
  status: lobby | in_match | post_match | closed
  visibility: public | unlisted | private
  creator_member_id: MemberId
  members_by_id: Map<MemberId, RoomMember>
  player_seat_assignments: Map<SeatIndex, MemberId>
  spectator_member_ids: MemberId[]
  seat_limit: integer
  spectator_limit: integer
  pending_match_configuration: MatchConfiguration
  active_match_id: MatchId | null
  revision: integer
```

```text
RoomMember
  member_id: MemberId
  account_id: AccountId
  role: unassigned | player | spectator
  connection_status: connected | reconnecting | disconnected
  ready: boolean
  selected_deck_snapshot_id: DeckSnapshotId | null
```

A Ready Player's legal deck is snapshotted for match setup. The snapshot contains no Equipment or Qualification state. Room commands include `CREATE_ROOM`, `JOIN_ROOM`, `TAKE_SEAT`, `BECOME_SPECTATOR`, `CONCEDE_MATCH`, and `LEAVE_ROOM`; gameplay-card commands remain a separate family.

## Players, teams, cards, and utility resources

```text
PlayerState
  player_id: PlayerId
  seat_index: integer
  team_id: TeamId
  controller_type: human | computer
  status: active | disconnected | conceded
  starting_service_points: integer
  displayed_service_points: integer
  hand: private CardInstance[]
  draw_deck: private CardInstance[]
  discard: CardInstance[]
  installed_playable_cards: CardInstance[]
  clock: PlayerClockState
  disconnect_deadline: timestamp | null
  search_tokens: integer
  max_search_tokens: integer
  refresh_tokens: integer
  max_refresh_tokens: integer
  private_knowledge_state_ids: KnowledgeStateId[]
```

`installed_playable_cards` contains persistent card-game objects only. It is not account Equipment and is never pre-seeded by an Equipment loadout.

```text
TeamState
  team_id: TeamId
  member_player_ids: PlayerId[]
  displayed_service_points: integer
  status: active | conceded
  team_knowledge_state_ids: KnowledgeStateId[]
```

Competitive matches may create one team per Player while cooperative matches create one shared team. Exact cooperative score aggregation remains unresolved.

Search and Refresh are named basic actions:

```text
Search
  cost: 1 Action + 1 Search Token
  result: choose one card from remaining draw deck, add to hand, shuffle remainder

DeckRefresh
  cost: 1 Action + 1 Refresh Token
  result: combine discard + remaining draw deck, shuffle into new draw deck
  unchanged: hand + installed playable cards
```

The standard first-version preset uses Search start/cap/grant `3/5/1` and Refresh start/cap `1/1`.

## Authored Ticket state

The domain Ticket definition supplies a public candidate set plus server-only causal truth, authored Evidence outcomes, Isolation requirements, eligible Repairs, Verify conditions, and structured closure membership. Runtime state should reference those authored records rather than recalculate truth from general Fault associations.

```text
TicketState
  ticket_instance_id: TicketInstanceId
  ticket_definition_id: RepairTicketDefinitionId
  lifecycle_state: queued | diagnosis | repair_ready | awaiting_verify |
                   returned_to_diagnosis | ready_to_close | closed
  visible_symptom_ids: StableId[]
  public_candidate_fault_ids: StableId[]
  machine_state_revision: integer
  fault_instance_state_refs: server-only FaultInstanceStateRef[]
  accepted_isolation_history: IsolationRecord[]
  current_accepted_isolation_id: IsolationId | null
  repair_action_ids: ActionId[]
  verification_result_event_ids: EventId[]
  current_verify_pass_event_ids: EventId[]
  failed_or_inconclusive_verify_event_ids: EventId[]
  worklog_entry_ids: WorklogEntryId[]
  contribution_record_ids: ContributionId[]
  closure_record_id: ClosureId | null
```

Accepted Isolation is public Ticket-owned progress containing the Fault reference, contributor, cited Evidence event IDs, actionable/deepest classification, and acceptance time. It gates ordinary Repair.

Failed or inconclusive Verify appends Evidence and history, invalidates affected current passes, preserves earlier Evidence/Worklog/Repair/machine changes, and moves the Ticket to `returned_to_diagnosis`. A new accepted Isolation gates later Repair. A later pass never deletes the earlier failure.

## Knowledge State and Evidence

```text
KnowledgeState
  knowledge_state_id: KnowledgeStateId
  subject_player_id: PlayerId | null
  subject_team_id: TeamId | null
  visibility: PRIVATE_PLAYER | TEAM
  ticket_instance_id: TicketInstanceId
  evidence_event_ids: EventId[]
  candidate_annotations: CandidateAnnotation[]
  current_hypothesis_candidate_ids: StableId[]       // zero to two public candidates
  hypothesis_history: HypothesisRevision[]
```

```text
EvidenceResult
  result_event_id: EventId
  source_action_id: ActionId
  authored_outcome_rule_id: StableId
  candidate_or_fault_instance_ref: StableId
  outcome: SUPPORT | CONTRADICT | RULE_OUT | CONFIRM | OBSERVATION | INCONCLUSIVE
  machine_state_revision_observed: integer
  visibility: PRIVATE_PLAYER | TEAM | PUBLIC_MATCH
```

Competitive Evidence defaults to `PRIVATE_PLAYER`; cooperative Evidence defaults to `TEAM`. Knowledge State never contains machine state or unrevealed server-only truth. Revising a Hypothesis costs zero Actions, scores nothing, and receives no truth response.

## Intent, action, event, and Worklog identity

```text
ActionIntent
  intent_id: IntentId
  actor_player_id: PlayerId
  action_or_card_instance_id: string
  target_ref: ExplicitTargetRef
  expected_match_revision: integer
```

The server serializes intents and rejects stale or illegal requests before payment. Rejection moves no card, spends no Action or utility token, changes no Ticket/Evidence/score/resource state, and creates no Worklog entry.

```text
ActionRecord
  action_id: ActionId
  intent_id: IntentId
  sequence: integer
  actor_player_id: PlayerId
  ticket_instance_id: TicketInstanceId | null
  action_or_card_instance_id: string
  target_ref: ExplicitTargetRef
  action_cost: integer
  action_time: timestamp
  attached_result_event_id: EventId | null
```

```text
GameEvent
  event_id: EventId
  sequence: integer
  revision: integer
  event_type: string
  actor_player_id: PlayerId | null
  visibility: SERVER_ONLY | PRIVATE_PLAYER | TEAM | PUBLIC_MATCH
  visible_to_subject_ids: string[]
  source_action_id: ActionId | null
  payload: object
  created_at: timestamp
```

Every accepted paid action immediately creates a public Worklog placeholder while concealed target/result detail stays in its authorized event.

```text
WorklogEntry
  worklog_entry_id: WorklogEntryId
  sequence: integer
  source_action_id: ActionId
  actor_player_id: PlayerId
  ticket_instance_id: TicketInstanceId
  exact_card_or_basic_action_id: string
  public_target_surface: object
  action_cost: integer
  action_time: timestamp
  published_projection: object | null
  publication_event_ids: EventId[]
  locked_at_closure: boolean
```

Document Live enriches this entry in place and appends a current publication event containing publisher and publication time. The original action/result stays immutable and retains its former private/team visibility. The exact source card returns from discard once; replaying it creates new identities.

## Turns and closure-resolution window

```text
TurnState
  round_number: integer
  turn_number: integer
  active_player_id: PlayerId
  active_roster_index: integer
  phase: start | draw | work | resolving | closure_resolution | end
  start_draw_resolved: boolean
  actions_remaining: integer
  zero_action_card_names_played: string[]
  closure_eligible_ticket_ids: TicketInstanceId[]
  turn_started_at: timestamp
  turn_deadline: timestamp | null
  last_clock_accounted_at: timestamp
```

At start of turn, draw one if possible and receive two Actions. The turn may end voluntarily or when no Actions remain, except while an explicit resolution window is open. Successful Verify opens `closure_resolution` before the normal zero-Actions automatic end-turn check. Publishing the eligible zero-Action bundle ends the closer's turn.

## Documentation and closure

```text
ClosureRecord
  closure_id: ClosureId
  ticket_instance_id: TicketInstanceId
  closer_player_id: PlayerId
  closer_team_id: TeamId | null
  accepted_isolation_id: IsolationId
  decisive_evidence_event_ids: EventId[]
  repair_action_ids: ActionId[]
  failed_verify_event_ids: EventId[]
  current_passing_verify_event_ids: EventId[]
  closed_at: timestamp
```

Closure costs zero Actions, recovers no card, gives no protected claim, awards no Service Points for closing, and remains attributable to Player/team statistics. If the immediate post-Verify window closes without publication, the eligible Ticket remains jointly actionable.

The complete closure transaction is atomic:

1. validate the current authored Isolation/Repair/Verify path;
2. enrich and lock Worklog records;
3. create score events required by the eventually resolved scoring policy;
4. archive/remove the Ticket;
5. grant configured Search/Refresh resources to active Players;
6. reconcile the queue after all closure effects;
7. evaluate terminal conditions against the complete result; and
8. end the closer's turn.

## Ticket queue and generation boundary

```text
TicketPolicyState
  created_ticket_count: integer
  closed_ticket_count: integer
  next_ticket_sequence: integer
  ticket_source_reference: opaque string | null
```

Queue reconciliation is frozen:

```text
reconcileQueue(state, configuration, approvedTicketSource)
  if configuration.queue_minimum == 0:
    create nothing
  otherwise:
    create tickets until active_ticket_count >= queue_minimum
```

Setup separately creates `starting_ticket_count` Tickets. An `approvedTicketSource` may be a fixed authored fixture today. A future generated source may add seed/generator-version provenance only after `GEN-001` defines the contract. This model deliberately provides no constraint configuration or solver.

## Contribution and scoring hooks

```text
ContributionRecord
  contribution_id: ContributionId
  ticket_instance_id: TicketInstanceId
  source_action_id: ActionId
  contributor_player_id: PlayerId
  contributor_team_id: TeamId | null
  policy_classification: opaque string
  settlement_state: pending | awarded | ineligible | superseded
  score_event_ids: EventId[]
```

```text
ScoreEvent
  score_event_id: EventId
  sequence: integer
  reason_code: opaque string
  points: integer
  player_id: PlayerId | null
  team_id: TeamId | null
  ticket_instance_id: TicketInstanceId | null
  source_contribution_id: ContributionId
```

These are extensibility hooks, not a scoring decision. `SCORE-001` must still decide which actions qualify, point values, rubric visibility, repeated/assist suppression, multi-Fault behavior, Root Cause treatment, rejected-Isolation consequences beyond the frozen rule, handicaps, and cooperative aggregation. An unclosed Ticket pays nothing; any eligible awards settle atomically at closure. Closure attribution is a separate statistic and never a score reason.

## Clocks and reconnect

```text
PlayerClockState
  enabled: boolean
  remaining_milliseconds: integer | null
  running_since: timestamp | null
```

The server is authoritative for turn time, Player time, disconnect grace, and expiration. Player time runs only during that Player's actionable turn and pauses during server resolution and reconnect synchronization. Reconnect installs the latest player-safe snapshot, then applies only explicitly supplied unseen semantic events; duplicate event IDs are ignored.

## Termination and results

Use a pure evaluator only after a complete resolution transaction:

```text
evaluateTermination(matchState) ->
  continue
  | CompleteMatch(reasonCode, winningPlayerIds, winningTeamIds)
  | InvalidMatch(reasonCode)
```

For `Q = 0`, queue-empty cooperative victory and competitive highest-score/co-winner behavior are frozen. Precedence among score, empty queue, concession, exhaustion, stalemate, and administration remains unfrozen, so `reasonCode` should remain versioned rather than implying a final enum here. Empty draw alone is never an exhaustion reason.

```text
MatchResult
  reason_code: string
  winning_player_ids: PlayerId[]
  winning_team_ids: TeamId[]
  final_player_scores: Map<PlayerId, integer>
  final_team_scores: Map<TeamId, integer>
  completed_at: timestamp
  statistics: MatchStatistics
```

Statistics should derive from the authoritative event, contribution, score, and closure ledgers. The exact metric catalog and persistence policy remain unfrozen.

## Player-safe projections

Projection generation uses the same categories for UI, spectators, reconnect, computer Players, accessibility announcements, and presentation effects:

- `SERVER_ONLY`: authoritative truth, never sent as player-visible state;
- `PRIVATE_PLAYER`: visible only to one authorized Player;
- `TEAM`: visible only to authorized team members; and
- `PUBLIC_MATCH`: visible to all Players and Spectators.

```text
PublicMatchView
  safe configuration and preset label
  roster, teams, public statuses, and public clocks
  active Tickets, public authored candidates, and accepted Isolation
  public Worklog placeholders/enrichments and Verify summaries
  public scores, utility resources, current turn, and deadlines
  public closure attribution and authorized results/statistics
```

```text
TeamMatchView extends PublicMatchView
  team Knowledge States, Evidence, and cooperative Hypotheses
```

```text
PrivatePlayerView extends PublicMatchView
  authenticated Player's hand, legal actions, and private Knowledge States
  private Evidence/rejection context
  reconnect synchronization metadata and last applied event identity
```

No projection exposes server-only Ticket truth, another Player's private hand or Hypothesis, unpublished Evidence outside its authorized scope, random state, or session secrets. Spectators receive `PUBLIC_MATCH` only.

## Account boundary

Match, Room, Ready, deck snapshot, and Player-state models contain no Equipment slots, inventory, Store items, compatibility, effects, or starting Installed Equipment objects. Persistent playable cards remain a normal match zone.

Qualifications may be stored by a separate account/campaign-history system as recognition-only honor badges. They have no MatchState, PlayerState, deck, action, access, story, procedure, or matchmaking representation.
