# Story and fictional context

Status: **working story proposal; not frozen canon or game rules**

This directory gives Server Repair TCG a time, place, workplace, cast, campaign frame, and narrative voice. Its purpose is to make the troubleshooting loop feel like a lived activity performed by people whose work matters:

**Observe -> Diagnosis [Hypothesize <-> Test -> Isolate] -> Repair -> Verify -> Document**

Story documents may explain why a player sees a Ticket queue, Worklog, private Evidence, team resources, or a deck-building reward. They do not determine how those systems behave. Normative and unresolved gameplay authority remains in [`docs/design/decisions/`](../design/decisions/DECISION_INDEX.md).

## Read in this order

1. [`STORY.md`](STORY.md) — the proposed time, place, company, player role, campaign premise, and story-to-gameplay mapping.
2. [`CHARACTERS.md`](CHARACTERS.md) — the player-character model and initial ensemble, including future portrait hooks.
3. [`VOICE.md`](VOICE.md) — tone, point of view, dialogue registers, terminology, and a sample campaign-to-match transition.
4. [`REAL_WORLD_INSPIRATION.md`](REAL_WORLD_INSPIRATION.md) — sourced notes on SMS InfoComm and the line between operational research and fictional adaptation.
5. [`VISUAL_DIRECTION.md`](VISUAL_DIRECTION.md) — an original painterly night-shift art grammar, layer-ready composition rules, and the provenance boundary for future Story Mode assets.
6. [`gameplay_candidates/`](gameplay_candidates/) — story-facing presentation and content ideas constrained by frozen system actions; genuinely new behavior still requires the normal design-decision lifecycle.

## Authority labels

- **Working premise:** the coherent default used by the other story files until user review changes it.
- **Candidate:** a possible story, gameplay, progression, or interface direction; not approved behavior.
- **Sourced reference:** an attributable real-world fact used for grounding; never an assertion about the fictional company.
- **Reserved:** deliberately unanswered so later ticket authoring or rule decisions are not preempted.

## Terminology boundary

The rules currently call the sixth lifecycle stage **Verify**. Second Current employees often call the surrounding organizational practice **Validation**, and its quality area is the **Validation Gate**. In story text, validation therefore means the in-world practice; **Verify** remains the exact gameplay-stage term.

The loop is iterative rather than a one-way conveyor. Hypothesize and Test can repeat inside Diagnosis, accepted Isolation is the accountable transition to ordinary Repair, and failed Verify can reopen Diagnosis while preserving earlier Evidence, machine changes, and Worklog history. A real-world intervention may motivate linked observations, but the core game records a reverting diagnostic substitution as a Test and a permanent machine change as a separate legal Repair. Department handoffs organize the work but do not redefine the lifecycle.

## Candidate directory

- [`CARDLESS_ACTIONS.md`](gameplay_candidates/CARDLESS_ACTIONS.md) — universal reasoning and recordkeeping actions suggested by the fiction and case studies.
- [`CARDS.md`](gameplay_candidates/CARDS.md) — department-flavored card and campaign-unlock concepts.
- [`APP_SHELL.md`](gameplay_candidates/APP_SHELL.md) — a campaign and workplace layer that can coexist with the provisional multiplayer application shell.

Before promoting any story candidate, reconcile it with the frozen rules and the open questions or pressure recorded in [`docs/design/decisions/`](../design/decisions/DECISION_INDEX.md).

## Planned implementation sequence

Story Mode is not implemented yet. The proposed sequence is intentionally separated so architecture is proven before campaign volume makes it expensive to change:

1. [`TASK-026-XHIGH`](../tasks/TASK-026-build-declarative-story-runtime.md) — versioned declarative runtime, typed conditions/statements, layer model, checkpoints, and validation.
2. [`TASK-027-XHIGH`](../tasks/TASK-027-blueprint-story-campaign-graph.md) — complete beat/branch graph and solvability-proved Match configurations.
3. [`TASK-028-HIGH`](../tasks/TASK-028-integrate-story-player-and-match-bridge.md) — Story tab, accessible scene player, persistence/portability, and authoritative Match bridge.
4. [`TASK-029-XHIGH`](../tasks/TASK-029-author-story-campaign-scripts.md) — final dialogue, choices, continuity, outcome variants, and choreography.
5. [`TASK-030-XHIGH`](../tasks/TASK-030-create-story-mode-art.md) — original painterly backgrounds, character variants, inserts, provenance, and responsive integration.

The architecture deliberately borrows useful visual-novel concepts—stable labels, jump/call/return, declarative statements, and layered rendering—without adopting executable story scripts or treating another engine's syntax as this project's contract.
