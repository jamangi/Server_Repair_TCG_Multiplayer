# task-009-foundation-v1 automated-game summary

This committed campaign requested **22** runs. **20** matches started; **12** succeeded and **10** were retained as deliberate or unexpected exception cases.

## Outcomes

- Invalidated: 2
- Proven stalemate: 2
- Simulation cap: 2
- Policy stall: 2
- Builder unsatisfiable before match start: 2
- No legal progress move (Pass excluded): 6

## Turn distribution

Across started matches: minimum 3, median 8.5, p95 25, maximum 25, mean 9.55. The p95 uses the nearest-rank definition.

| Setting group | Requested | Started | Succeeded | Failed | Min | Median | P95 | Max | Mean |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| coop-fixed-finite-solo-methodical | 2 | 2 | 2 | 0 | 12 | 13 | 14 | 14 | 13 |
| coop-generated-finite-pair-publication | 2 | 2 | 2 | 0 | 7 | 7.5 | 8 | 8 | 7.5 |
| coop-fixed-replenishing-four-mixed | 2 | 2 | 2 | 0 | 4 | 9 | 14 | 14 | 9 |
| competitive-fixed-finite-pair-scripted | 2 | 2 | 2 | 0 | 9 | 10 | 11 | 11 | 10 |
| coop-fixed-failed-verify-scripted | 2 | 2 | 2 | 0 | 9 | 9.5 | 10 | 10 | 9.5 |
| competitive-generated-replenishing-three-mixed | 2 | 2 | 2 | 0 | 7 | 9.5 | 12 | 12 | 9.5 |
| fixture-builder-unsatisfiable | 2 | 0 | 0 | 2 | — | — | — | — | — |
| fixture-proven-stalemate | 2 | 2 | 0 | 2 | 25 | 25 | 25 | 25 | 25 |
| fixture-admin-invalidation | 2 | 2 | 0 | 2 | 5 | 6 | 7 | 7 | 6 |
| fixture-simulation-cap | 2 | 2 | 0 | 2 | 3 | 3 | 3 | 3 | 3 |
| fixture-policy-stall | 2 | 2 | 0 | 2 | 3 | 3 | 3 | 3 | 3 |

## Results by setting and seed

| Setting group | Classification | Terminal reasons | Seeds |
| --- | --- | --- | --- |
| coop-fixed-finite-solo-methodical | SUCCEEDED | QUEUE_EMPTY | 1001, 1002 |
| coop-generated-finite-pair-publication | SUCCEEDED | QUEUE_EMPTY | 2001, 2002 |
| coop-fixed-replenishing-four-mixed | SUCCEEDED | SCORE_THRESHOLD | 3001, 3002 |
| competitive-fixed-finite-pair-scripted | SUCCEEDED | QUEUE_EMPTY | 4001, 4002 |
| coop-fixed-failed-verify-scripted | SUCCEEDED | QUEUE_EMPTY | 4501, 4502 |
| competitive-generated-replenishing-three-mixed | SUCCEEDED | SCORE_THRESHOLD | 5001, 5002 |
| fixture-builder-unsatisfiable | BUILDER_UNSATISFIABLE | BUILDER_UNSATISFIABLE | 6001, 6002 |
| fixture-proven-stalemate | PROVEN_STALEMATE | STALEMATE | 7001, 7002 |
| fixture-admin-invalidation | INVALIDATED | ADMIN_INVALIDATION | 8001, 8002 |
| fixture-simulation-cap | SIMULATION_CAP | SIMULATION_CAP | 9001, 9002 |
| fixture-policy-stall | POLICY_STALL | POLICY_STALL + SIMULATION_CAP | 10001, 10002 |

## Service Points

Rows with identical starting/final/net values are grouped by seed. Competitive Player scores and cooperative team scores are gameplay totals; cooperative Player rows remain attributable individual statistics.

| Setting group | Scope | Participant | Start | Final | Net | Seeds |
| --- | --- | --- | ---: | ---: | ---: | --- |
| competitive-fixed-finite-pair-scripted | Player | player_a | 0 | 2 | 2 | 4001 |
| competitive-fixed-finite-pair-scripted | Player | player_a | 0 | 3 | 3 | 4002 |
| competitive-fixed-finite-pair-scripted | Player | player_b | 0 | 1 | 1 | 4002 |
| competitive-fixed-finite-pair-scripted | Player | player_b | 0 | 2 | 2 | 4001 |
| competitive-generated-replenishing-three-mixed | Player | player_a | 0 | 1 | 1 | 5002 |
| competitive-generated-replenishing-three-mixed | Player | player_a | 0 | 3 | 3 | 5001 |
| competitive-generated-replenishing-three-mixed | Player | player_b | 0 | 1 | 1 | 5001, 5002 |
| competitive-generated-replenishing-three-mixed | Player | player_c | 0 | 0 | 0 | 5001, 5002 |
| coop-fixed-failed-verify-scripted | Player | player_a | 0 | 0 | 0 | 4501, 4502 |
| coop-fixed-failed-verify-scripted | Player | player_b | 0 | 0 | 0 | 4501, 4502 |
| coop-fixed-finite-solo-methodical | Player | player_a | 0 | 0 | 0 | 1001, 1002 |
| coop-fixed-replenishing-four-mixed | Player | player_a | 0 | 0 | 0 | 3001, 3002 |
| coop-fixed-replenishing-four-mixed | Player | player_b | 0 | 0 | 0 | 3001, 3002 |
| coop-fixed-replenishing-four-mixed | Player | player_c | 0 | 0 | 0 | 3001, 3002 |
| coop-fixed-replenishing-four-mixed | Player | player_d | 0 | 0 | 0 | 3001, 3002 |
| coop-generated-finite-pair-publication | Player | player_a | 0 | 0 | 0 | 2001, 2002 |
| coop-generated-finite-pair-publication | Player | player_b | 0 | 0 | 0 | 2001, 2002 |
| fixture-admin-invalidation | Player | player_a | 0 | 0 | 0 | 8001, 8002 |
| fixture-builder-unsatisfiable | Player | player_a | 0 | 0 | 0 | 6001, 6002 |
| fixture-policy-stall | Player | player_a | 0 | 0 | 0 | 10001, 10002 |
| fixture-policy-stall | Player | player_b | 0 | 0 | 0 | 10001, 10002 |
| fixture-proven-stalemate | Player | player_a | 0 | 0 | 0 | 7001, 7002 |
| fixture-simulation-cap | Player | player_a | 0 | 0 | 0 | 9001, 9002 |
| coop-fixed-failed-verify-scripted | Team | team.cooperative | 0 | 4 | 4 | 4501, 4502 |
| coop-fixed-finite-solo-methodical | Team | team.cooperative | 0 | 2 | 2 | 1001, 1002 |
| coop-fixed-replenishing-four-mixed | Team | team.cooperative | 0 | 2 | 2 | 3001, 3002 |
| coop-generated-finite-pair-publication | Team | team.cooperative | 0 | 2 | 2 | 2001, 2002 |
| fixture-admin-invalidation | Team | team.cooperative | 0 | 2 | 2 | 8001, 8002 |
| fixture-builder-unsatisfiable | Team | team.cooperative | 0 | 0 | 0 | 6001, 6002 |
| fixture-proven-stalemate | Team | team.cooperative | 0 | 0 | 0 | 7001, 7002 |
| fixture-simulation-cap | Team | team.cooperative | 0 | 0 | 0 | 9001, 9002 |

## Reproducibility

22 identical-input reruns were compared across Ticket snapshots, replay digests, outcomes, scores, and turn counts. Mismatches: **0**.

Successful rows are reproducible from one setting-group reference plus their seed. Expanded files in `exceptions/` cover only Builder failure, invalidation, stalemate, policy stall, cap, nondeterminism, or another failed classification.
