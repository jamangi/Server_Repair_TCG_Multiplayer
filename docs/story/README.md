# Story and fictional context

Status: **working story proposal; not frozen canon or game rules**

This directory gives Server Repair TCG a time, place, workplace, cast, campaign frame, and narrative voice. Its purpose is to make the troubleshooting loop feel like a lived activity performed by people whose work matters:

**Observe -> Hypothesize -> Test -> Isolate -> Repair -> Verify -> Document**

Story documents may explain why a player sees a Ticket queue, Worklog, private Evidence, team resources, or a deck-building reward. They do not determine how those systems behave. Normative and unresolved gameplay authority remains in [`docs/design/decisions/`](../design/decisions/DECISION_INDEX.md).

## Read in this order

1. [`STORY.md`](STORY.md) — the proposed time, place, company, player role, campaign premise, and story-to-gameplay mapping.
2. [`CHARACTERS.md`](CHARACTERS.md) — the player-character model and initial ensemble, including future portrait hooks.
3. [`VOICE.md`](VOICE.md) — tone, point of view, dialogue registers, terminology, and a sample campaign-to-match transition.
4. [`REAL_WORLD_INSPIRATION.md`](REAL_WORLD_INSPIRATION.md) — sourced notes on SMS InfoComm and the line between operational research and fictional adaptation.
5. [`gameplay_candidates/`](gameplay_candidates/) — story-derived card, cardless-action, and application-shell ideas that still require the normal design-decision lifecycle.

## Authority labels

- **Working premise:** the coherent default used by the other story files until user review changes it.
- **Candidate:** a possible story, gameplay, progression, or interface direction; not approved behavior.
- **Sourced reference:** an attributable real-world fact used for grounding; never an assertion about the fictional company.
- **Reserved:** deliberately unanswered so later ticket authoring or rule decisions are not preempted.

## Terminology boundary

The rules currently call the sixth lifecycle stage **Verify**. Second Current employees often call the surrounding organizational practice **Validation**, and its quality area is the **Validation Gate**. In story text, validation therefore means the in-world practice; **Verify** remains the exact gameplay-stage term.

The loop is iterative rather than a one-way conveyor. Failed Verify can reopen Diagnosis, Tests can revise Hypotheses, and one physical intervention can produce both diagnostic Evidence and a Repair state change. Department handoffs organize the work but do not redefine the lifecycle.

## Candidate directory

- [`CARDLESS_ACTIONS.md`](gameplay_candidates/CARDLESS_ACTIONS.md) — universal reasoning and recordkeeping actions suggested by the fiction and case studies.
- [`CARDS.md`](gameplay_candidates/CARDS.md) — department-flavored card and campaign-unlock concepts.
- [`APP_SHELL.md`](gameplay_candidates/APP_SHELL.md) — a campaign and workplace layer that can coexist with the provisional multiplayer application shell.

Before promoting any candidate, reconcile it with the frozen, unfrozen, candidate, and unsynchronized decisions in [`docs/design/decisions/`](../design/decisions/DECISION_INDEX.md).
