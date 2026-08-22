# TASK-006: Candidate gameplay flows v0.0

## Status

Completed 2026-08-22.

## Objective

Create a coherent, deliberately non-authoritative example package showing how Server Repair TCG could work as a learnable card game, campaign experience, and multiplayer application.

The package must choose one internally consistent set of temporary rules from the frozen, unfrozen, candidate, unsynchronized, recommended, case-study, story, and UI materials. Call those choices the **Candidate-Frozen Example Profile v0.0**. They are fixtures for reasoning and review, not promoted rules, schemas, canon, balance contracts, or implementation requirements.

The examples should make the troubleshooting lifecycle playable as an iterative evidence loop:

```text
Observe -> Hypothesize <-> Test -> Isolate -> Repair -> Verify -> Document
                         ^                         |
                         `---- failed Verify -----'
```

Diagnosis is the umbrella `Hypothesize <-> Test -> Isolate`. Isolate is the accountable transition from possibilities to an actionable fault. Repair changes machine state without proving the explanation. Failed Verify may preserve prior work and reopen Diagnosis. Document preserves an attributable explanation for teammates, auditors, future returns, and institutional learning.

## Required inputs

Read before drafting:

- `AGENTS.md` and the root `README.md`;
- every document in the root README's `docs/design/` source-of-truth order;
- the complete `docs/case_studies/` v0.1 pilot, including candidate materials and cross-references;
- the complete `docs/story/` foundation and gameplay candidates;
- `docs/ui-plan/TODO.md`, every wireframe, and the wireframe index;
- current `viewer/content/*.json` domain records used by the example cards and Tickets;
- current schemas and examples when they help identify legacy assumptions, without treating them as synchronized final contracts.

## Authority and terminology boundary

- Frozen rules remain authoritative and must be preserved.
- Temporary resolutions of open decisions apply only to this example package.
- Every document must link to the decisions document and carry a visible non-authoritative status statement.
- Do not edit living decision documents, domain content, schemas, runtime examples, viewer files, or tests.
- Use **Verify** for the gameplay stage. **Validation Gate** or **Gate** may describe the fictional quality organization only.
- Treat the seven lifecycle labels as a conceptual and evidentiary vocabulary, not seven departments or a permanently one-way state machine.
- Preserve player-safe information. Story scenes, SIFT, computer technicians, spectators, and UI animation must not reveal hidden authoritative faults.
- Cards represent a prepared shift repertoire and technical affordances; ordinary observation, reasoning, evidence-supported commitment, and recordkeeping must not become impossible merely because a card was not drawn.
- Example-local card, deck, Ticket, account, currency, equipment, and UI details may be invented when required to make a complete flow, but must be labeled as example fixtures rather than stable IDs or approved content.
- The technical resolution of *The Quiet Cascade* remains reserved.

## Required artifacts

Create:

```text
docs/candidate_flows/
|-- README.md
|-- v0.0_ex1_decisions.md
|-- v0.0_ex1_board_and_cards.md
|-- v0.0_ex1_cards_gameplay_examples.md
|-- v0.0_ex1_deckbuilding_examples.md
|-- v0.0_ex1_equipping_examples.md
|-- v0.0_ex1_story_gameplay_examples.md
|-- v0.0_ex1_multiplayer_gameplay_examples.md
|-- v0.0_ex1_full_campaign.md
|-- v0.0_ex1_full_multiplayer.md
`-- v0.0_ex1_full.md
```

Update `docs/tasks/INDEX.md` to mark this task active during work and completed only after verification. Update the root `README.md` at completion so the repository guide explains the purpose and authority of `docs/candidate_flows/`.

## Artifact requirements

### `README.md`

Provide the reading order, authority labels, shared fixture index, and a clear explanation of how the focused examples relate to the three full journeys.

### `v0.0_ex1_decisions.md`

- State every temporary rule needed to replay the flows.
- Separate inherited frozen behavior from temporary open-rule choices and example-only content/UI assumptions.
- For each temporary choice, cite the relevant frozen, unfrozen, candidate, unsynchronized, recommended, case-study, story, or UI source.
- Record alternatives considered, reasons for the selected option, risks exposed by the examples, and questions that should return to the normal decision lifecycle.
- Define configuration, setup, round/turn structure, actions, candidate and Evidence behavior, Isolation, Repair legality, Verify failure, Documentation, visibility, Worklog chronology, scoring, closure, replenishment, exhaustion boundary, targeting, computer knowledge, spectators, reconnect, and terminal behavior used by the examples.

### `v0.0_ex1_board_and_cards.md`

- Define the board without presenting seven isolated lifecycle departments.
- Explain shared Ticket surfaces, player zones, private/team/public information, Worklog, machine state, acceptance requirements, hand, deck, discard, installed/persistent cards, Actions, and utility resources.
- Define the temporary card grammar, card families, costs, timing, targets, disposition, and linked domain references.
- Provide every example-local card definition used anywhere in the package.
- Provide every example Ticket fixture, its player-visible setup, server-only answer, candidate set, authored Evidence outcomes, Isolation requirement, Repair, Verify conditions, Documentation requirements, and rewards.
- Provide complete deck lists and named opening-hand fixtures used by the examples.
- Distinguish equipment, cosmetics, qualifications, owned cards, deck contents, and match-time installed assets.

### `v0.0_ex1_cards_gameplay_examples.md`

- Include at least two complete games of exactly three Tickets each.
- At least one game must demonstrate failed Verify reopening Diagnosis.
- At least one game must demonstrate cooperative Evidence and contribution attribution.
- At least one game must show competitive private Evidence and the information cost of Documentation.
- Begin every game with configuration, Ticket queue, turn order, full deck lists by reference, opening hands, utility resources, scores, and visibility state.
- Organize play by round and turn. For every action, state card/basic action, target, cost, authoritative result, visibility, Worklog change, hand/discard/installed state, Actions remaining, Ticket state, and score/resource changes.
- End with a reconciled final-state audit.

### Deckbuilding, equipping, story, and multiplayer example documents

- Give each flow a narrative preamble: what the player wants, why, what information they inspect, and how they choose a plan.
- Deckbuilding examples must cover creating, editing, validating, saving, selecting, and recovering from at least one legality or compatibility problem.
- Equipping examples must cover acquiring or locating an owned item, previewing, equipping, comparing, committing, undoing or replacing, and distinguishing cosmetic from mechanical preparation.
- Story examples must cover cold open, shift brief, admissible context, preparation, match handoff, Gate review, after-shift consequence, progression, and thread-forward continuity without revealing reserved campaign truth.
- Multiplayer examples must include at least two three-Ticket matches across cooperative and competitive contexts and must cover explicit Play/Spectate choice, room/lobby/readiness, player-safe synchronization, results, reconnect or stale-action handling, and return to the Room.

### Full journeys

- `v0.0_ex1_full_campaign.md` must follow one player from landing, sign-in, onboarding or resume, shell arrival, inspection of owned resources, preparation, story, a complete three-Ticket campaign match, debrief, progression, optional post-match management, and logout.
- `v0.0_ex1_full_multiplayer.md` must follow one player from landing and sign-in through social/Rooms, deck selection, Room membership and explicit role selection, lobby, synchronization, a complete three-Ticket multiplayer match, results, rematch/leave behavior, and logout.
- `v0.0_ex1_full.md` must be the navigable combined product walkthrough. It may reuse focused-flow step identifiers by reference, but it must remain readable without opening another file and must identify every screen, modal, cutscene, dialogue choice, app destination, intent, authoritative request/result boundary, animation, error/recovery state, and logout outcome.

## Motion and accessibility requirements

- Describe Motion for React behavior in terms of semantic events, not rules hidden in animation callbacks.
- Cover shell transitions, shared identity, room/lobby presence, card movement, Evidence visibility, Hypothesis revision, Isolation commitment, machine-state change, failed Verify, Worklog enrichment, store preview, equip/unequip, loading, rejection, reconnect, and deterministic settling.
- State the reduced-motion equivalent for every material animation pattern.
- Do not let narrative reading or decorative animation consume authoritative turn time.
- Do not use color, movement, portraits, or sound as the only carrier of game state.

## Case-study and content discipline

- Prefer the five completed pilot cases as evidence-bearing foundations.
- Because only five case studies are complete, either reuse a completed case in a materially different mode/deck context or label any sixth Ticket as a synthetic domain-data fixture. Do not present backlog associations as researched cases.
- Preserve case uncertainties: do not turn a successful repair into unsupported Isolation or a weak service-restoration report into a stronger Verify result.
- When an example needs stronger or cleaner Evidence than a source preserved, identify it as an authored game-fixture outcome.
- Reference existing stable domain IDs when appropriate. Example-local identifiers must be visibly scoped and must not look like new public domain contracts.

## Files allowed to change

- `README.md`
- `docs/tasks/INDEX.md`
- `docs/tasks/TASK-006-candidate-gameplay-flows-v0.0.md`
- `docs/candidate_flows/*.md`

## Prohibited work

- Do not edit `viewer/`, `schemas/`, `examples/`, `tests/`, `docs/design/`, `docs/case_studies/`, `docs/story/`, or `docs/ui-plan/`.
- Do not promote the example profile into frozen or unfrozen rules.
- Do not create implementation code, production UI requirements, art assets, schemas, migrations, stable domain IDs, or final card balance.
- Do not fetch or reproduce copyrighted third-party art or interface screenshots.
- Do not resolve the reserved technical truth of *The Quiet Cascade*.

## Verification

Before completion:

1. Confirm every required artifact exists and every repository-relative Markdown link added by this task resolves.
2. Confirm each artifact contains a visible non-authoritative label and links to `v0.0_ex1_decisions.md`.
3. Confirm all referenced stable domain IDs resolve against current `viewer/content/*.json`, and every example-local item is labeled non-contractual.
4. Confirm deck totals, copy limits, opening hands, draws, searches, discards, installed cards, and utility-resource arithmetic reconcile at every audited game boundary.
5. Confirm both card-gameplay games and both multiplayer games contain exactly three closed Tickets, with valid round and turn ordering.
6. Confirm at least one failed Verify reopens Diagnosis while preserving prior events and machine state.
7. Confirm competitive, cooperative, private, team, public, spectator, reconnect, and stale-action behavior matches the example decisions and does not leak hidden state.
8. Confirm Worklogs preserve authoritative event order when Documentation publishes older private or team-visible results.
9. Confirm the full campaign and multiplayer journeys account for every navigation transition, deck/equipment selection, match handoff, result, return path, and logout.
10. Confirm exact lifecycle terminology, especially **Verify**, is used consistently and that departments are not presented as lifecycle ownership gates.
11. Confirm *The Quiet Cascade* remains unresolved and SIFT uses only player-safe information.
12. Run any purpose-built consistency checker created outside the repository or as an ephemeral command; do not add implementation tooling in this task.
13. Run `git diff --check`.
14. Verify only allowed files changed.

Report commands, exit codes, pass/fail totals, changed files, and unresolved items.

## Completion boundary

Stop after the documentation package, verification, root README integration, and completion record. Rule promotion, playtesting balance changes, card/domain implementation, UI architecture, application code, campaign-state contracts, networking, commerce, art, and additional case-study research require user review and separately scoped tasks.

## Completion record

Completed 2026-08-22 with all eleven required files in `docs/candidate_flows/`, root README integration, and no changes outside the task's allowed paths.

Verification summary:

- required artifact and authority checks: 22 passed, 0 failed;
- repository-relative links: 166 paths and 60 fragments resolved, 0 failed;
- stable domain references: 85 unique IDs resolved, 0 missing;
- example catalog: 34 cards and 6 Tickets defined, 0 unknown references;
- deck fixtures: both 30-card decks and all four 5-opening-plus-25-draw permutations reconciled, 0 multiset differences;
- complete match ledgers: 4 passed, 0 failed; each has exactly 3 closures, contiguous Worklog IDs, and valid round/turn counts;
- final-zone/resource/score checks: both focused games, both networked renderings, both full journeys, and the combined walkthrough reconciled;
- full journeys: campaign FC-001–FC-025 and multiplayer MP-001–MP-022 account for landing, sign-in, preparation, match handoff, results, return paths, and sign-out;
- Motion registry: M-01–M-15 present with reduced-motion treatment in every UI-focused/full document;
- encoding/clean-text checks: 11 UTF-8 files with final newlines, no trailing whitespace, conflict markers, or unfinished placeholders;
- `git diff --check`: exit 0; and
- changed-file scope: 0 out-of-task paths.

The package intentionally leaves balance, rule promotion, current-schema migration, Room lifecycle, spectator policy, commerce, UI architecture, and *The Quiet Cascade* technical truth unresolved. These are documented review boundaries, not incomplete TASK-006 deliverables.
