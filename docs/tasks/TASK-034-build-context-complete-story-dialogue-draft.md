# TASK-034-XHIGH: Build the context-complete Story dialogue draft

## Status

**Queued after TASK-033.** This task produces a validated candidate copy layer; it does not replace the live campaign. TASK-035 uses the context-complete lines to develop character voices, and TASK-036 performs the single production migration.

## Objective

Rewrite the Quiet Cascade narrative into a context-complete candidate draft that does both jobs of educational workplace dialogue:

1. establish the environment, terminology, ordinary procedures, handoff failures, and practical consequences; and
2. deliver the existing technical and organizational insights in language the Player can now understand and use.

Preserve the approved graph, choices, Match boundaries, normalized outcomes, technical truth, and hidden-information limits. This is a comprehension pass, not yet the final characterization pass.

## Required reading

Read completely before editing:

- `AGENTS.md`, root `README.md`, this task, completed TASK-033 and all of its deliverables;
- completed TASK-024 and TASK-026 through TASK-030;
- all Story foundation, character, voice, runtime, campaign, continuity, and editorial documents;
- every production script/text/registry/graph/Match source and all generated transcripts/reports; and
- Story validators, checkpoint/content-version contracts, and Viewer dialogue/mobile accessibility constraints.

## Candidate-first boundary

Do not edit the live `content/story-v1/campaigns/quiet-cascade/` pack in this task. Produce a deterministic candidate revision under:

`docs/story/revisions/quiet-cascade-characterization-v2/`

The candidate must map every replacement to an existing production `text_id` and every proposed additive statement to a stable insertion anchor. This keeps the context pass reviewable, lets TASK-035 translate context-complete rather than obsolete lines, and avoids two successive live Story migrations.

## Context-writing contract

Use TASK-033's newcomer reader model and context ladder. For each material concept, establish enough of the following before relying on insider shorthand:

- what the named team, artifact, or procedure is;
- what ordinarily crosses the handoff and who relies on it;
- what becomes lost, overstated, or unactionable;
- why that failure costs time, quality, trust, or repeat work;
- what the current insight corrects; and
- what the Player can do with that understanding.

Assume the protagonist is smart and new, not ignorant. Let characters explain because they are onboarding, disagreeing, correcting an artifact, comparing responsibilities, or responding to a Player question—not because they know an audience needs exposition.

Prefer distributed context:

- environmental detail before abstract claims;
- a bad or incomplete Worklog field before a principle about Documentation;
- a named handoff and receiving team before saying that context must “travel”;
- concrete examples before acronyms and internal shorthand;
- questions, corrections, and partial understandings rather than uninterrupted lectures; and
- post-Match reflection that names what the Player just experienced without pretending a perfect result.

After a term is established on every route, later speakers may use the shorter insider form. Expand acronyms and local terms at first meaningful use when the expansion helps understanding; do not make dialogue recite encyclopedia entries.

## Information architecture

For each chapter, define a small set of explicit comprehension objectives and assign each objective a first introduction, applied example, and later reinforcement. Avoid making every line an aphorism. The draft needs connective speech: observations, requests, uncertainty, misunderstanding, consequence, humor, and interpersonal reaction.

Use the existing artifact and narrative channels before proposing new UI. A full technical definition may remain in the Library when the scene supplies the minimum concept needed for the decision.

## Canon and topology constraints

- Preserve all existing label, choice, variable, checkpoint, ending, Match-reference, and graph IDs.
- Preserve choice meanings, remembered flags, route reconvergence, Service Point gates, and all normalized result handling.
- Preserve existing statement/text IDs when their semantic role remains; assign additive IDs without repurposing old public IDs.
- Do not name a hidden Fault, required diagnostic, correct Repair, unchosen outcome, or private Match detail before authority permits it.
- Do not add a new character, choice, branch, variable, reward, Match, background, pose, or technical insert.
- Do not imply that a cutscene observation supplies Evidence, Isolation, Verify, Documentation, or closure inside the engine.
- Do not change canonical character identities or attempt the final idiosyncratic voice pass; retain enough speaker attribution for TASK-035 to work.

## Draft deliverables

Create at least:

1. `context-draft.en.json` — replacement text plus additive statement proposals keyed to stable anchors;
2. `CONTEXT_CHANGELOG.md` — one entry per TASK-033 gap showing the before/after context ladder and explanation channel;
3. `CONTEXT_ROUTE_TRANSCRIPTS.md` — readable candidate transcripts for every required route/outcome review set;
4. `CONTEXT_PAYLOAD_LEDGER.json` — immutable semantic payload, technical source, hidden-information guardrail, and later voice-flexibility fields for every candidate line; and
5. validators/tests for complete TASK-033 reconciliation, production-ID mapping, additive-ID uniqueness, transcript determinism, topology immutability, and draft totals.

The payload ledger must distinguish words that may be revoiced from facts and bounds that TASK-036 must preserve exactly in meaning.

## Comprehension review

Answer TASK-033's cold-reader questions from the candidate transcripts alone. A reader should be able to explain, in plain language:

- what the relevant team or artifact does;
- what information is meant to survive each handoff;
- what failure pattern the scene is addressing;
- why the current insight matters operationally; and
- what remains unknown or reserved for gameplay.

Revise when the expected answer still requires consulting the character sheet, campaign blueprint, or implementation code. Reference-layer consultation may deepen a term, but it must not be required to understand the immediate story decision.

## Verification

- Validate every TASK-033 ledger record as resolved, deliberately deferred, or routed to the existing reference layer with rationale.
- Prove graph, choices, conditions, Match references, checkpoints, and endings are byte-for-byte unchanged because production files remain untouched.
- Generate all candidate transcripts and review first-use terms on every route.
- Review mobile density, localization readiness, repetition, pacing, hidden information, technical accuracy, dignity, and non-shaming fallback language.
- Run Story graph/validation tests, focused draft tests, documentation-link tests, and `git diff --check`.
- Report commands, exit codes, pass/fail totals, original/revised/additive line totals, changed files, and unresolved issues.

## Allowed paths

- `docs/story/revisions/quiet-cascade-characterization-v2/` candidate copy, payloads, transcripts, and reports;
- focused draft validation tooling and tests;
- task/index and concise Story documentation status.

Do not modify the live Story pack, runtime, Viewer, graph/Match authority, character bibles, art, gameplay/domain data, or checkpoint storage.

## Completion boundary

Stop when the candidate campaign is comprehensible to the defined newcomer, every material context gap is resolved without leaking gameplay truth, the semantic payload of every line is locked for revoicing, and TASK-035 can build voices from context-complete copy.
