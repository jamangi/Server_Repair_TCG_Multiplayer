# Story and fictional context

Status: **implemented canonical campaign-one package under `STORY-007 A`; no story document is gameplay-rule authority**

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
7. [`RUNTIME.md`](RUNTIME.md) — the implemented versioned interpreter, checkpoint, Match-boundary, and portability contracts.
8. [`campaigns/QUIET_CASCADE.md`](campaigns/QUIET_CASCADE.md) — the implemented four-chapter campaign brief, with continuity and editorial companions in the same directory.
9. [`../art/TASK-030-STORY-ART.md`](../art/TASK-030-STORY-ART.md) — the finite production-art inventory, responsive delivery, provenance, review, and fallback record.

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

## Implemented Story sequence

TASK-026 through TASK-030 now provide the complete first Story Mode foundation. The sequence remained intentionally separated so architecture, campaign topology, the player bridge, prose, and art could each be validated before the next layer depended on it:

1. [`TASK-026-XHIGH`](../tasks/TASK-026-build-declarative-story-runtime.md) — versioned declarative runtime, typed conditions/statements, layer model, checkpoints, and validation.
2. [`TASK-027-XHIGH`](../tasks/TASK-027-blueprint-story-campaign-graph.md) — complete beat/branch graph and six solvability-proved real Match configurations.
3. [`TASK-028-HIGH`](../tasks/TASK-028-integrate-story-player-and-match-bridge.md) — Story tab, accessible scene player, persistence/portability, and authoritative Story-to-Match-to-Story bridge.
4. [`TASK-029-XHIGH`](../tasks/TASK-029-author-story-campaign-scripts.md) — complete dialogue, choices, continuity, outcome variants, transcripts, and choreography.
5. [`TASK-030-XHIGH`](../tasks/TASK-030-create-story-mode-art.md) — original painterly backgrounds, character variants, inserts, deterministic provenance, fallbacks, and responsive integration.

The owner approved [`STORY-007 A`](../design/decisions/APPROVALS.md#story-007--campaign-one-canon-package--a-approved-2026-08-28) on 2026-08-28. The shipped names, identities, setting, campaign premise, and reviewed character-art anchors are canonical for campaign one. This content approval does not promote Story prose into gameplay-rule authority.

## Characterization sequence

Hands-on reading found that the campaign's compact insider conclusions could arrive before a newcomer understood the workflow, pain point, or term they addressed, and that the cast voice was more uniform than the original editorial pass claimed. The completed corrective sequence kept comprehension and personality separate until one final production migration:

1. [`TASK-033-HIGH`](../tasks/TASK-033-audit-story-context-and-comprehension.md) — completed; the [newcomer-context audit](campaigns/QUIET_CASCADE_CONTEXT_AUDIT.md), machine [context ledger](reports/QUIET_CASCADE_CONTEXT_LEDGER.json), and [cold-reader questions](reports/QUIET_CASCADE_COMPREHENSION_QUESTIONS.md) reconcile all reachable production-facing copy without changing it.
2. [`TASK-034-XHIGH`](../tasks/TASK-034-build-context-complete-story-dialogue-draft.md) — completed; the [non-live candidate revision](revisions/quiet-cascade-characterization-v2/CONTEXT_CHANGELOG.md) resolves every audited concept and locks per-line payloads across all 48 route transcripts while leaving the live campaign untouched.
3. [`TASK-035-HIGH`](../tasks/TASK-035-deepen-character-bibles-and-voice-spec.md) — completed nine canonical character bibles and practical voice-translation cards from transformed public-domain reference constellations.
4. [`TASK-036-XHIGH`](../tasks/TASK-036-integrate-story-characterization-pass.md) — shipped the context-complete payloads through those voices as one versioned campaign migration with full topology, checkpoint, Match, and transcript proof.

Production now loads `content/story-v1/campaigns/quiet-cascade-characterization-v2/`. The original `quiet-cascade/` directory remains immutable migration and comparison history. See the [final dialogue comparison](revisions/quiet-cascade-characterization-v2/FINAL_DIALOGUE_COMPARISON.md), [48 side-by-side route transcripts](revisions/quiet-cascade-characterization-v2/FINAL_ROUTE_TRANSCRIPTS.md), [character reference ledger](CHARACTER_REFERENCE_LEDGER.md), and [voice cards](CHARACTER_VOICE_CARDS.md).

The owner approved [`STORY-008 A`](../design/decisions/APPROVALS.md#story-008--characterization-pass-creative-discretion--a-approved-2026-08-28), so reference and backstory selections do not require a per-character approval stop. Canonical names, roles, visual identities, established relationships, protagonist customization, and gameplay authority remain fixed boundaries.

The architecture deliberately borrows useful visual-novel concepts—stable labels, jump/call/return, declarative statements, and layered rendering—without adopting executable story scripts or treating another engine's syntax as this project's contract.
