# TASK-038-HIGH: Add completed Story chapter replay

## Status

**Planned; blocked only by `STORY-009`.** TASK-037 is a prerequisite.

## Objective

Turn Chapter history into a useful review surface. A Player must be able to select a completed learning episode and replay its cutscene and, under the approved policy, its Match without resetting or corrupting later canonical Story progress.

For this task, a replayable episode is an authored Story segment paired with one Match. Display names may remain `Shift 1` through `Shift 6`; do not assume the current four script files are six player-facing chapters.

## Required reading

Read completely before editing `AGENTS.md`, this task, TASK-026 through TASK-030, TASK-037, `STORY-001 A` through `STORY-009`, current Story Home/history/reset/storage/export code, Match result/statistics handling, tutorial replay precedent, and browser tests.

## Replay contract

- Implement only the `STORY-009` choice approved by the owner.
- List only episodes proven complete by accepted durable Match results; derive titles and boundaries from authored metadata rather than `index + 1` assumptions.
- Clearly distinguish canonical Continue, review replay, whole-Story reset, and any destructive rewind policy.
- Preserve the canonical checkpoint, branch choices, Match results, ending, Story Service Points, and next-episode eligibility unless the approved option explicitly authorizes rewind.
- A review Match must use the ordinary engine and authored configuration. Any non-scoring/practice boundary must be enforced outside the engine result rather than by weakening engine authority.
- Route leave, reload, interruption, Give Up, completion, import/export, and content migration must return to a coherent replay or canonical-home state.
- Replay must never duplicate canonical Match acceptance, Profile statistics, Story rewards, or completion history accidentally.
- Provide accessible chapter controls, current/replayed state, confirmation where destructive, focus restoration, keyboard/touch behavior, and mobile/reflow layout.

## Verification

Test every completed Shift, incomplete/locked episodes, replay interruption, replay completion/abandonment, canonical Continue afterward, reset afterward, duplicate clicks, reload, export/import, and version migration. Prove original Story records and ordinary Local solo statistics remain unchanged wherever the selected policy requires. Run focused Story/browser suites, staging verification, baseline Viewer checks, documentation links, and `git diff --check`.

## Allowed paths

Story Home/scene/client/storage/Match-context code, Story metadata needed for stable replay boundaries, focused tests, generated/staged Viewer assets, approvals/task/index, and concise Story/root documentation.

Do not alter Match rules, domain content, campaign dialogue, graph outcomes, or implement the expansion sequence.

## Completion boundary

Stop when a Player can intentionally review any completed episode under the approved semantics and return to exactly the same canonical campaign position without hidden progression or statistics side effects.
