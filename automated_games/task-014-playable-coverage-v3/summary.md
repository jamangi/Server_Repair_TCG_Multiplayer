# task-014-playable-coverage-v3 automated-game summary

This committed campaign requested **13** runs. **13** matches started; **13** succeeded and **0** were retained as deliberate or unexpected exception cases.

## Outcomes

- Invalidated: 0
- Proven stalemate: 0
- Simulation cap: 0
- Policy stall: 0
- Builder unsatisfiable before match start: 0
- No legal progress move (Pass excluded): 0

## Turn distribution

Across started matches: minimum 3, median 19, p95 27, maximum 27, mean 18. The p95 uses the nearest-rank definition.

| Setting group | Requested | Started | Succeeded | Failed | Min | Median | P95 | Max | Mean |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| task-014-boot-incorrect_order | 1 | 1 | 1 | 0 | 3 | 3 | 3 | 3 | 3 |
| task-014-boot-missing_nvme | 1 | 1 | 1 | 0 | 27 | 27 | 27 | 27 | 27 |
| task-014-memory-failed_dimm | 1 | 1 | 1 | 0 | 11 | 11 | 11 | 11 | 11 |
| task-014-memory-unseated_dimm | 1 | 1 | 1 | 0 | 19 | 19 | 19 | 19 | 19 |
| task-014-network-failed_cable | 1 | 1 | 1 | 0 | 22 | 22 | 22 | 22 | 22 |
| task-014-network-incorrect_static_ip | 1 | 1 | 1 | 0 | 17 | 17 | 17 | 17 | 17 |
| task-014-power-failed_psu | 1 | 1 | 1 | 0 | 23 | 23 | 23 | 23 | 23 |
| task-014-power-unseated_psu | 1 | 1 | 1 | 0 | 7 | 7 | 7 | 7 | 7 |
| task-014-storage-failed_sas_member | 1 | 1 | 1 | 0 | 20 | 20 | 20 | 20 | 20 |
| task-014-storage-loose_cable | 1 | 1 | 1 | 0 | 23 | 23 | 23 | 23 | 23 |
| task-014-thermal-clogged_heatsink | 1 | 1 | 1 | 0 | 19 | 19 | 19 | 19 | 19 |
| task-014-thermal-failed_fan | 1 | 1 | 1 | 0 | 19 | 19 | 19 | 19 | 19 |
| task-014-multi-ticket-resource-path | 1 | 1 | 1 | 0 | 24 | 24 | 24 | 24 | 24 |

## Results by setting and seed

| Setting group | Classification | Terminal reasons | Seeds |
| --- | --- | --- | --- |
| task-014-boot-incorrect_order | SUCCEEDED | QUEUE_EMPTY | 14001 |
| task-014-boot-missing_nvme | SUCCEEDED | QUEUE_EMPTY | 14002 |
| task-014-memory-failed_dimm | SUCCEEDED | QUEUE_EMPTY | 14003 |
| task-014-memory-unseated_dimm | SUCCEEDED | QUEUE_EMPTY | 14004 |
| task-014-network-failed_cable | SUCCEEDED | QUEUE_EMPTY | 14005 |
| task-014-network-incorrect_static_ip | SUCCEEDED | QUEUE_EMPTY | 14006 |
| task-014-power-failed_psu | SUCCEEDED | QUEUE_EMPTY | 14007 |
| task-014-power-unseated_psu | SUCCEEDED | QUEUE_EMPTY | 14008 |
| task-014-storage-failed_sas_member | SUCCEEDED | QUEUE_EMPTY | 14009 |
| task-014-storage-loose_cable | SUCCEEDED | QUEUE_EMPTY | 14010 |
| task-014-thermal-clogged_heatsink | SUCCEEDED | QUEUE_EMPTY | 14011 |
| task-014-thermal-failed_fan | SUCCEEDED | QUEUE_EMPTY | 14012 |
| task-014-multi-ticket-resource-path | SUCCEEDED | QUEUE_EMPTY | 14998 |

## Service Points

Rows with identical starting/final/net values are grouped by seed. Competitive Player scores and cooperative team scores are gameplay totals; cooperative Player rows remain attributable individual statistics.

| Setting group | Scope | Participant | Start | Final | Net | Seeds |
| --- | --- | --- | ---: | ---: | ---: | --- |
| task-014-boot-incorrect_order | Player | player_a | 0 | 0 | 0 | 14001 |
| task-014-boot-missing_nvme | Player | player_a | 0 | 0 | 0 | 14002 |
| task-014-memory-failed_dimm | Player | player_a | 0 | 0 | 0 | 14003 |
| task-014-memory-unseated_dimm | Player | player_a | 0 | 0 | 0 | 14004 |
| task-014-multi-ticket-resource-path | Player | player_a | 0 | 0 | 0 | 14998 |
| task-014-network-failed_cable | Player | player_a | 0 | 0 | 0 | 14005 |
| task-014-network-incorrect_static_ip | Player | player_a | 0 | 0 | 0 | 14006 |
| task-014-power-failed_psu | Player | player_a | 0 | 0 | 0 | 14007 |
| task-014-power-unseated_psu | Player | player_a | 0 | 0 | 0 | 14008 |
| task-014-storage-failed_sas_member | Player | player_a | 0 | 0 | 0 | 14009 |
| task-014-storage-loose_cable | Player | player_a | 0 | 0 | 0 | 14010 |
| task-014-thermal-clogged_heatsink | Player | player_a | 0 | 0 | 0 | 14011 |
| task-014-thermal-failed_fan | Player | player_a | 0 | 0 | 0 | 14012 |
| task-014-boot-incorrect_order | Team | team.cooperative | 0 | 2 | 2 | 14001 |
| task-014-boot-missing_nvme | Team | team.cooperative | 0 | 2 | 2 | 14002 |
| task-014-memory-failed_dimm | Team | team.cooperative | 0 | 2 | 2 | 14003 |
| task-014-memory-unseated_dimm | Team | team.cooperative | 0 | 2 | 2 | 14004 |
| task-014-multi-ticket-resource-path | Team | team.cooperative | 0 | 4 | 4 | 14998 |
| task-014-network-failed_cable | Team | team.cooperative | 0 | 2 | 2 | 14005 |
| task-014-network-incorrect_static_ip | Team | team.cooperative | 0 | 2 | 2 | 14006 |
| task-014-power-failed_psu | Team | team.cooperative | 0 | 2 | 2 | 14007 |
| task-014-power-unseated_psu | Team | team.cooperative | 0 | 2 | 2 | 14008 |
| task-014-storage-failed_sas_member | Team | team.cooperative | 0 | 2 | 2 | 14009 |
| task-014-storage-loose_cable | Team | team.cooperative | 0 | 2 | 2 | 14010 |
| task-014-thermal-clogged_heatsink | Team | team.cooperative | 0 | 2 | 2 | 14011 |
| task-014-thermal-failed_fan | Team | team.cooperative | 0 | 2 | 2 | 14012 |

## Reproducibility

13 identical-input reruns were compared across Ticket snapshots, replay digests, outcomes, scores, and turn counts. Mismatches: **0**.

Successful rows are reproducible from one setting-group reference plus their seed. Expanded files in `exceptions/` cover only Builder failure, invalidation, stalemate, policy stall, cap, nondeterminism, or another failed classification.
