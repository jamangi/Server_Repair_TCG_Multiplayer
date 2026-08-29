# task-043-quiet-cascade-expansion-v3 automated-game summary

This committed campaign requested **6** runs. **6** matches started; **6** succeeded and **0** were retained as deliberate or unexpected exception cases.

## Outcomes

- Invalidated: 0
- Proven stalemate: 0
- Simulation cap: 0
- Policy stall: 0
- Builder unsatisfiable before match start: 0
- No legal progress move (Pass excluded): 0

## Turn distribution

Across started matches: minimum 6, median 10.5, p95 14, maximum 14, mean 10.33. The p95 uses the nearest-rank definition.

| Setting group | Requested | Started | Succeeded | Failed | Min | Median | P95 | Max | Mean |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| story-qc02-shift-07 | 1 | 1 | 1 | 0 | 12 | 12 | 12 | 12 | 12 |
| story-qc02-shift-08 | 1 | 1 | 1 | 0 | 9 | 9 | 9 | 9 | 9 |
| story-qc02-shift-09 | 1 | 1 | 1 | 0 | 12 | 12 | 12 | 12 | 12 |
| story-qc02-shift-10 | 1 | 1 | 1 | 0 | 9 | 9 | 9 | 9 | 9 |
| story-qc02-shift-11 | 1 | 1 | 1 | 0 | 14 | 14 | 14 | 14 | 14 |
| story-qc02-shift-12 | 1 | 1 | 1 | 0 | 6 | 6 | 6 | 6 | 6 |

## Results by setting and seed

| Setting group | Classification | Terminal reasons | Seeds |
| --- | --- | --- | --- |
| story-qc02-shift-07 | SUCCEEDED | QUEUE_EMPTY | story.quiet_cascade.expansion.s07.v1 |
| story-qc02-shift-08 | SUCCEEDED | QUEUE_EMPTY | story.quiet_cascade.expansion.s08.v1 |
| story-qc02-shift-09 | SUCCEEDED | QUEUE_EMPTY | story.quiet_cascade.expansion.s09.v1 |
| story-qc02-shift-10 | SUCCEEDED | QUEUE_EMPTY | story.quiet_cascade.expansion.s10.v1 |
| story-qc02-shift-11 | SUCCEEDED | QUEUE_EMPTY | story.quiet_cascade.expansion.s11.v1 |
| story-qc02-shift-12 | SUCCEEDED | QUEUE_EMPTY | story.quiet_cascade.expansion.s12.v1 |

## Service Points

Rows with identical starting/final/net values are grouped by seed. Competitive Player scores and cooperative team scores are gameplay totals; cooperative Player rows remain attributable individual statistics.

| Setting group | Scope | Participant | Start | Final | Net | Seeds |
| --- | --- | --- | ---: | ---: | ---: | --- |
| story-qc02-shift-07 | Player | player_a | 0 | 0 | 0 | story.quiet_cascade.expansion.s07.v1 |
| story-qc02-shift-08 | Player | player_a | 0 | 0 | 0 | story.quiet_cascade.expansion.s08.v1 |
| story-qc02-shift-09 | Player | player_a | 0 | 0 | 0 | story.quiet_cascade.expansion.s09.v1 |
| story-qc02-shift-10 | Player | player_a | 0 | 0 | 0 | story.quiet_cascade.expansion.s10.v1 |
| story-qc02-shift-11 | Player | player_a | 0 | 0 | 0 | story.quiet_cascade.expansion.s11.v1 |
| story-qc02-shift-12 | Player | player_a | 0 | 0 | 0 | story.quiet_cascade.expansion.s12.v1 |
| story-qc02-shift-07 | Team | team.cooperative | 0 | 2 | 2 | story.quiet_cascade.expansion.s07.v1 |
| story-qc02-shift-08 | Team | team.cooperative | 0 | 2 | 2 | story.quiet_cascade.expansion.s08.v1 |
| story-qc02-shift-09 | Team | team.cooperative | 0 | 2 | 2 | story.quiet_cascade.expansion.s09.v1 |
| story-qc02-shift-10 | Team | team.cooperative | 0 | 2 | 2 | story.quiet_cascade.expansion.s10.v1 |
| story-qc02-shift-11 | Team | team.cooperative | 0 | 2 | 2 | story.quiet_cascade.expansion.s11.v1 |
| story-qc02-shift-12 | Team | team.cooperative | 0 | 2 | 2 | story.quiet_cascade.expansion.s12.v1 |

## Reproducibility

6 identical-input reruns were compared across Ticket snapshots, replay digests, outcomes, scores, and turn counts. Mismatches: **0**.

Successful rows are reproducible from one setting-group reference plus their seed. Expanded files in `exceptions/` cover only Builder failure, invalidation, stalemate, policy stall, cap, nondeterminism, or another failed classification.
