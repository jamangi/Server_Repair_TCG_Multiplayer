# TASK-005: Story foundation and gameplay candidates

## Status

Completed on 2026-08-21.

## Objective

Create a grounded fictional setting, company, campaign frame, protagonist role, ensemble, and voice for Server Repair TCG. The story must make the existing troubleshooting loop feel like meaningful work while preserving the authority boundaries in `docs/design/`.

This task may also record story-derived card, cardless-action, and application-shell ideas as candidates. It does not approve mechanics, change living rule decisions, or implement a playable client.

## Required inputs

Read before drafting:

- the root `README.md`;
- the complete `docs/design/` reading order named by that README;
- `docs/case_studies/README.md`;
- the v0.1 case-study candidate materials and completed lifecycle reductions;
- the provisional UI plan and application-shell reference;
- current first-party information about SMS InfoComm's services, global operations, careers, and cross-training;
- directly attributable role descriptions for repair, Test, Failure Analysis, and quality-control work.

## Required artifacts

Create:

```text
docs/story/
|-- README.md
|-- STORY.md
|-- CHARACTERS.md
|-- VOICE.md
|-- REAL_WORLD_INSPIRATION.md
`-- gameplay_candidates/
    |-- CARDLESS_ACTIONS.md
    |-- CARDS.md
    `-- APP_SHELL.md
```

Update the root `README.md` repository guide to explain the purpose and authority of `docs/story/`.

## Canon boundary

- Treat the setting as a coherent working proposal, not frozen canon.
- Keep the fictional company and characters distinct from SMS InfoComm, Wistron, their clients, and their employees.
- Distinguish sourced operational facts from inference and fictional adaptation.
- Preserve **Verify** as the current rules term. The fiction may use **Validation** as an in-world department or workflow term only when the mapping is explicit.
- Preserve the loop as iterative. Do not imply that failed verification, new evidence, or a cross-team handoff can never reopen Diagnosis.
- Do not make a card literally necessary for ordinary human reasoning unless an approved rule later requires it.

## Candidate boundary

- Do not assign stable IDs, costs, balance values, schema fields, or final effect text.
- Cross-reference pressured frozen, unfrozen, candidate, and unsynchronized decisions.
- Keep campaign progression, team permissions, unlocks, and interface ideas explicitly non-normative.
- Do not modify living decision documents during this task.

## Files allowed to change

- `README.md`
- `docs/tasks/INDEX.md`
- `docs/tasks/TASK-005-story-foundation.md`
- `docs/story/**/*.md`

## Prohibited work

- Do not edit `viewer/`, `schemas/`, `examples/`, `tests/`, domain content, the UI plan, or living design decisions.
- Do not implement cards, cardless actions, campaign systems, application-shell behavior, or game-engine behavior.
- Do not create character portraits in this task.
- Do not represent a proposed story explanation as a settled engine rule.

## Verification

Before completion:

1. Confirm every required artifact exists.
2. Confirm every repository-relative Markdown link added by this task resolves.
3. Confirm real-world claims are linked to attributable sources and fictional additions are labeled.
4. Confirm the gameplay candidates contain no stable IDs or asserted rule approvals.
5. Run `git diff --check`.
6. Verify only allowed files changed.

## Completion boundary

Stop after delivering the story foundation and candidate documents for user review. Character portraits, finalized canon, rule promotion, UI requirements, and campaign implementation require later review and separately scoped work.

## Completion record

- Created all eight required story and gameplay-candidate artifacts.
- Established the working 2049 setting, Second Current Serviceworks, Trinity Hub, the Crossline Technician role, and *The Quiet Cascade* campaign frame.
- Created an initial ensemble and voice guide with future portrait hooks but no generated character assets.
- Recorded sourced SMS InfoComm operational research and separated functions, role overlap, repair levels, cross-training, and fictional adaptation.
- Preserved `Verify` as the rules term, the iterative Diagnosis loop, player-safe information, and the authority of living design decisions.
- Added no stable domain IDs, final effects, costs, balance values, schema fields, or approved mechanics.
- Confirmed all repository-relative links resolve and `git diff --check` passes.
- Changed only files allowed by this task; no viewer, schema, example, test, domain-content, UI-plan, or living decision files changed.
