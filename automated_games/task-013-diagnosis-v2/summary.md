# task-013-diagnosis-v2 automated-game summary

This committed campaign requested **4** runs. **4** matches started; **4** succeeded and **0** were retained as deliberate or unexpected exception cases.

## Outcomes

- Invalidated: 0
- Proven stalemate: 0
- Simulation cap: 0
- Policy stall: 0
- Builder unsatisfiable before match start: 0
- No legal progress move (Pass excluded): 0

## Turn distribution

Across started matches: minimum 3, median 4, p95 7, maximum 7, mean 4.5. The p95 uses the nearest-rank definition.

| Setting group | Requested | Started | Succeeded | Failed | Min | Median | P95 | Max | Mean |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| diagnosis-v2-fixed-direct-solo | 2 | 2 | 2 | 0 | 4 | 4 | 4 | 4 | 4 |
| diagnosis-v2-generated-recovery-team | 2 | 2 | 2 | 0 | 3 | 5 | 7 | 7 | 5 |

## Results by setting and seed

| Setting group | Classification | Terminal reasons | Seeds |
| --- | --- | --- | --- |
| diagnosis-v2-fixed-direct-solo | SUCCEEDED | QUEUE_EMPTY | 13001, 13002 |
| diagnosis-v2-generated-recovery-team | SUCCEEDED | QUEUE_EMPTY | 13101, 13102 |

## Service Points

Rows with identical starting/final/net values are grouped by seed. Competitive Player scores and cooperative team scores are gameplay totals; cooperative Player rows remain attributable individual statistics.

| Setting group | Scope | Participant | Start | Final | Net | Seeds |
| --- | --- | --- | ---: | ---: | ---: | --- |
| diagnosis-v2-fixed-direct-solo | Player | player_a | 0 | 0 | 0 | 13001, 13002 |
| diagnosis-v2-generated-recovery-team | Player | player_a | 0 | 0 | 0 | 13101, 13102 |
| diagnosis-v2-generated-recovery-team | Player | player_b | 0 | 0 | 0 | 13101, 13102 |
| diagnosis-v2-fixed-direct-solo | Team | team.cooperative | 0 | 2 | 2 | 13001, 13002 |
| diagnosis-v2-generated-recovery-team | Team | team.cooperative | 0 | 2 | 2 | 13101 |
| diagnosis-v2-generated-recovery-team | Team | team.cooperative | 0 | 4 | 4 | 13102 |

## Reproducibility

4 identical-input reruns were compared across Ticket snapshots, replay digests, outcomes, scores, and turn counts. Mismatches: **0**.

Successful rows are reproducible from one setting-group reference plus their seed. Expanded files in `exceptions/` cover only Builder failure, invalidation, stalemate, policy stall, cap, nondeterminism, or another failed classification.
