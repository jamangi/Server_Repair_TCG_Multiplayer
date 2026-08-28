# task-027-quiet-cascade-v1 automated-game summary

This committed campaign requested **6** runs. **6** matches started; **6** succeeded and **0** were retained as deliberate or unexpected exception cases.

## Outcomes

- Invalidated: 0
- Proven stalemate: 0
- Simulation cap: 0
- Policy stall: 0
- Builder unsatisfiable before match start: 0
- No legal progress move (Pass excluded): 0

## Turn distribution

Across started matches: minimum 14, median 61, p95 217, maximum 217, mean 81. The p95 uses the nearest-rank definition.

| Setting group | Requested | Started | Succeeded | Failed | Min | Median | P95 | Max | Mean |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| story-qc01-shift-01 | 1 | 1 | 1 | 0 | 14 | 14 | 14 | 14 | 14 |
| story-qc01-shift-02 | 1 | 1 | 1 | 0 | 93 | 93 | 93 | 93 | 93 |
| story-qc01-shift-03 | 1 | 1 | 1 | 0 | 21 | 21 | 21 | 21 | 21 |
| story-qc01-shift-04 | 1 | 1 | 1 | 0 | 29 | 29 | 29 | 29 | 29 |
| story-qc01-shift-05 | 1 | 1 | 1 | 0 | 112 | 112 | 112 | 112 | 112 |
| story-qc01-shift-06 | 1 | 1 | 1 | 0 | 217 | 217 | 217 | 217 | 217 |

## Results by setting and seed

| Setting group | Classification | Terminal reasons | Seeds |
| --- | --- | --- | --- |
| story-qc01-shift-01 | SUCCEEDED | QUEUE_EMPTY | story.quiet_cascade.s01.v1 |
| story-qc01-shift-02 | SUCCEEDED | QUEUE_EMPTY | story.quiet_cascade.s02.v1 |
| story-qc01-shift-03 | SUCCEEDED | QUEUE_EMPTY | story.quiet_cascade.s03.v1 |
| story-qc01-shift-04 | SUCCEEDED | QUEUE_EMPTY | story.quiet_cascade.s04.v1 |
| story-qc01-shift-05 | SUCCEEDED | QUEUE_EMPTY | story.quiet_cascade.s05.v1 |
| story-qc01-shift-06 | SUCCEEDED | QUEUE_EMPTY | story.quiet_cascade.s06.v1 |

## Service Points

Rows with identical starting/final/net values are grouped by seed. Competitive Player scores and cooperative team scores are gameplay totals; cooperative Player rows remain attributable individual statistics.

| Setting group | Scope | Participant | Start | Final | Net | Seeds |
| --- | --- | --- | ---: | ---: | ---: | --- |
| story-qc01-shift-01 | Player | player_a | 0 | 0 | 0 | story.quiet_cascade.s01.v1 |
| story-qc01-shift-02 | Player | player_a | 0 | 0 | 0 | story.quiet_cascade.s02.v1 |
| story-qc01-shift-03 | Player | player_a | 0 | 0 | 0 | story.quiet_cascade.s03.v1 |
| story-qc01-shift-04 | Player | player_a | 0 | 0 | 0 | story.quiet_cascade.s04.v1 |
| story-qc01-shift-05 | Player | player_a | 0 | 0 | 0 | story.quiet_cascade.s05.v1 |
| story-qc01-shift-06 | Player | player_a | 0 | 0 | 0 | story.quiet_cascade.s06.v1 |
| story-qc01-shift-01 | Team | team.cooperative | 0 | 2 | 2 | story.quiet_cascade.s01.v1 |
| story-qc01-shift-02 | Team | team.cooperative | 0 | 4 | 4 | story.quiet_cascade.s02.v1 |
| story-qc01-shift-03 | Team | team.cooperative | 0 | 4 | 4 | story.quiet_cascade.s03.v1 |
| story-qc01-shift-04 | Team | team.cooperative | 0 | 4 | 4 | story.quiet_cascade.s04.v1 |
| story-qc01-shift-05 | Team | team.cooperative | 0 | 4 | 4 | story.quiet_cascade.s05.v1 |
| story-qc01-shift-06 | Team | team.cooperative | 0 | 6 | 6 | story.quiet_cascade.s06.v1 |

## Reproducibility

6 identical-input reruns were compared across Ticket snapshots, replay digests, outcomes, scores, and turn counts. Mismatches: **0**.

Successful rows are reproducible from one setting-group reference plus their seed. Expanded files in `exceptions/` cover only Builder failure, invalidation, stalemate, policy stall, cap, nondeterminism, or another failed classification.
