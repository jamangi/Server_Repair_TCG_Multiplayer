# TASK-033-HIGH: Audit Story context and newcomer comprehension

## Status

**Ready — next task.** This is an evidence-gathering and planning task. It does not rewrite production dialogue. TASK-034 depends on its complete context ledger.

## Objective

Audit every reachable Quiet Cascade narrative line from the perspective of an intelligent, technically capable new employee who does not yet know Second Current's departments, handoffs, internal shorthand, or recurring operational pain points.

Identify where the campaign currently presents a good insider conclusion without first making its necessary context understandable. Convert those findings into a complete, machine-reconcilable context ledger that TASK-034 can use without rediscovering the campaign.

## Why this task exists

The current dialogue is strongest at compact conclusions: Evidence must retain its conditions, one Ticket cannot supply another's Isolation, and a Worklog must preserve what the next team needs. Those conclusions can be difficult for a newcomer to digest when the script has not yet established:

1. the term or procedure being discussed;
2. how the ordinary workflow is supposed to operate;
3. where information or accountability is commonly lost;
4. the practical consequence of that failure; and
5. how the character's insight changes the next decision.

The existing `QUIET_CASCADE_EDITORIAL.md` marked voice differentiation and terminology as passing. Reopen those findings rather than treating them as proof of newcomer comprehension.

## Required reading

Read completely before editing:

- `AGENTS.md`, root `README.md`, this task, `docs/tasks/INDEX.md`, completed TASK-024 and TASK-026 through TASK-030;
- `docs/story/README.md`, `STORY.md`, `CHARACTERS.md`, `VOICE.md`, `RUNTIME.md`, the Quiet Cascade campaign, continuity, and editorial documents;
- all four production script files, the English text catalogue, registry, graph, Match catalogue, generated route transcripts, and graph reports;
- the Story source validators/tests and Viewer presentation limits; and
- frozen terminology and gameplay authority for Evidence, Worklog, Ticket, Hypothesis, Test, Isolate, Repair, Verify, Document, Give Up, and archived outcomes.

## Reader model

Audit against this explicit baseline:

- smart and attentive;
- comfortable with ordinary computer hardware and safe procedure;
- new to Second Current and its internal departments;
- unfamiliar with depot-specific terms, workflow handoffs, SIFT, Gate, travelers, repeat returns, and local abbreviations;
- willing to infer, but not expected to invent missing process facts; and
- entitled to know public workplace context without receiving hidden Faults, required actions, or unearned Match answers.

Do not solve comprehension by making the protagonist incompetent or by having every character explain their own job title on arrival.

## Audit method

Start from generated transcripts and reconcile every finding to production `text_id`, statement ID, label, speaker, branch, and first reachable use. Review all 90 current `say` statements, five `narrate` statements, four choices and their options, six Match bridges, and every terminal variant across the 48-route matrix.

For each concept, use this context ladder:

1. **Name:** What term, department, artifact, procedure, or shorthand is being used?
2. **Normal:** What is supposed to happen in ordinary work?
3. **Failure:** What goes wrong, is omitted, or becomes ambiguous?
4. **Consequence:** Who or what is affected when it goes wrong?
5. **Insight:** What conclusion or corrective principle does the current dialogue offer?
6. **Action:** What can the Player notice, choose, test, preserve, or communicate next?

A scene does not need one line for every rung. It does need enough distributed context that the insight is earned and actionable.

Specifically resolve ambiguous first uses such as **repeaters**: determine whether the intended meaning is repeat-return units, a recurring lot, repeated symptoms, or another canonical concept, then require unambiguous newcomer-facing copy. Do not silently assume an electronics/networking definition.

Classify each line or concept as one or more of:

- environment/workflow context;
- term or acronym definition;
- procedure explanation;
- pain point/failure mode;
- operational or human consequence;
- technical observation;
- interpretation/insight;
- player-facing action or choice;
- relationship/character texture; or
- deliberate mystery that is safe to defer.

## Explanation-channel policy

Recommend the lightest natural delivery channel for each gap:

- dialogue between people with different responsibilities;
- concise narration or environmental observation;
- a Worklog, traveler, test output, label, or technical insert;
- a player question or meaningful choice;
- reinforcement after the relevant Match; or
- the existing Library/reference layer when a full definition would stall the scene.

Do not prescribe tutorial monologues. Prefer contextual first-use expansion and later shorthand after the meaning has been established. Record a separate future UI candidate only if a definition genuinely cannot fit the narrative without harming it; do not add a glossary interface in this task.

## Deliverables

Create:

1. `docs/story/campaigns/QUIET_CASCADE_CONTEXT_AUDIT.md` — chapter-by-chapter findings, context ladders, first-use terminology review, prioritized gaps, and recommended explanation channels;
2. `docs/story/reports/QUIET_CASCADE_CONTEXT_LEDGER.json` — deterministic machine-readable records reconciled to production IDs and all routes;
3. `docs/story/reports/QUIET_CASCADE_COMPREHENSION_QUESTIONS.md` — short cold-reader questions and expected public-context answers for each chapter, without hidden Match truth; and
4. validation/tests for ledger schema, stable references, route coverage, first-use ordering, and Markdown/JSON totals.

Each ledger record must include at least:

- stable gap/concept ID;
- chapter, label, route conditions, first reachable statement, `text_id`, and speaker/source;
- term/procedure/pain point and current context-ladder coverage;
- assumed knowledge and why the reader model cannot safely supply it;
- severity (`BLOCKING`, `MATERIAL`, or `POLISH`);
- recommended explanation channel and insertion/revision anchor;
- semantic payload that later prose must preserve;
- hidden-information and gameplay-authority guardrails;
- related later lines that may become valid shorthand after explanation; and
- audit status and rationale.

## Verification

- Reconcile every production narrative and choice text to the ledger or an explicit `NO_CONTEXT_CHANGE` disposition.
- Prove every term designated as shorthand has one earlier reachable explanation on every route where it appears.
- Generate and review all route transcripts, including both options of all four choices and all outcome bands.
- Confirm the audit does not reveal hidden Faults, prescribe correct Match actions, or redefine gameplay terms.
- Run Story graph/validation tests, documentation-link tests, focused ledger tests, and `git diff --check`.
- Report commands, exit codes, pass/fail totals, audited line/route totals, changed files, and unresolved gaps.

## Allowed paths

- `docs/story/campaigns/` audit documentation;
- `docs/story/reports/` context/comprehension reports;
- focused validation tooling and tests;
- task/index and concise Story README status.

Do not modify production scripts, text catalogues, character sheets, Story runtime, graph, Match definitions, gameplay/domain authority, art, or Viewer behavior.

## Completion boundary

Stop when every reachable narrative text is reconciled, every material newcomer-context gap has a specific safe remedy, all first-use terminology paths validate, and TASK-034 can produce a context-complete draft without rediscovering the campaign.
