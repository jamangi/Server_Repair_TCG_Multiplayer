# TASK-046-XHIGH: Release the six-episode Story expansion

## Status

**Planned.** Depends on TASK-038 and TASK-043 through TASK-045 so expanded episodes inherit the approved replay contract.

## Objective

Integrate the domain-backed blueprint, final scripts, and art as one versioned live Story expansion following campaign one, with safe checkpoints, six real Matches, replay-aware episode metadata, portability, accessibility, and an honest end-of-current-content state.

## Requirements

Read `AGENTS.md`, this task, TASK-026 through TASK-030, TASK-037 through TASK-045, all approved Story decisions, runtime/client/storage/migration contracts, and generated reports completely.

Create one explicit content-version boundary. Preserve completed campaign-one history and route eligible Players into expansion episode 1 without replaying or fabricating results. New/imported/reset profiles must traverse deterministically. Each episode must launch and accept its real Match exactly once; interruption restarts only from the authored boundary.

Stage canonical content/art through generators, not hand edits. Update Story Home, history/replay metadata, completion messaging, portability/migration, campaign documentation, coverage audit, and root status. Do not weaken Worker authority or Local solo behavior.

## Verification

Traverse every branch and result band; run all twelve campaign Matches through the real Builder/engine; verify checkpoint/migration/import/export/replay/interruption/ending paths; run desktop/mobile/keyboard/reduced-motion/zoom browser QA; regenerate deterministic graph/transcript/coverage/art reports; run all applicable Node/Viewer tests and `git diff --check`.

## Completion boundary

Stop when six additional sourced Story+Match episodes are live after campaign one, old progress is safe, all current content ends deliberately, and the coverage report measures the new teaching reach without overstating exposure.
