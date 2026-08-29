# TASK-041 machine-checkable research completion

Status: **the six-case research gate core is reproducible; downstream domain, gameplay, Story, and release gates remain unapproved**

## Result

- Registry: `story-expansion-research-registry-v1`
- Registry SHA-256: `cb89451ceff6af0d2da636e5ba34b714ebfcf3db2da3280d919900cf2bb32c75`
- Qualifying selected cases: 6
- Evidence slots: 6
- Existing uncovered complete playable arcs: 0
- Final Q: 6
- Q adjustments: 0
- Required current Command actions: 0
- Access date for every selected source: 2026-08-28

## Selected primary sources

- exp-001: [R910 will not power on with 4 processors](https://www.dell.com/community/en/conversations/rack-servers/r910-will-not-power-on-with-4-processors/647f7d25f4ccf8a8deb93b08) — objective.compute.socket_contact_isolation
- exp-002: [T420 PowerEdge VLT0204 main board voltage outside of range](https://www.dell.com/community/en/conversations/poweredge-hardware-general/t420-poweredge-vlt0204-main-board-voltage-outside-of-range/67fd91b469e6265ea77af6ab) — objective.power.distribution_board_vs_mainboard
- exp-003: [PowerEdge R620 drive predicted failure](https://www.dell.com/community/en/conversations/poweredge-hardware-general/poweredge-r620-drive-predicted-failure/647f7b52f4ccf8a8de9878d4) — objective.storage.predictive_replacement_before_failure
- exp-004: [PE2900 backplane degraded](https://www.dell.com/community/en/conversations/poweredge-hddscsiraid/pe2900-backplane-degraded/647e8b20f4ccf8a8dede59e9) — objective.management.stale_alert_vs_live_backplane_fault
- exp-005: [iDRAC keeps messaging the NIC in slot 4 port 1 network link is started](https://www.dell.com/community/en/conversations/poweredge-hardware-general/idrac-keeps-messaging-the-nic-in-slot-4-port-1-network-link-is-started/647f94b2f4ccf8a8de70eaff) — objective.firmware.regression_vs_physical_link
- exp-006: [GA-7PESH2 BMC recovery](https://forums.serverbuilds.net/t/ga-7pesh2-bmc-recovery/882) — objective.management.bmc_recovery_state_before_board_replacement

## Machine-enforced boundaries

- Exact case IDs `exp-001` through `exp-006`, source URLs, slots, objective keys, and fingerprint candidate keys are unique and pinned.
- Every selected source passes all recorded eligibility predicates and has an ordered Observe-through-Verify reduction; Document presence or absence is explicit and affects its selection score.
- Every current stable reference resolves with the recorded entity type against `core-domain-snapshot-technical-copy-v3`.
- Q recomputes as `max(0, 6 - 0) + 0 = 6`.
- Command catalog exposure, useful Evidence, and required Isolation remain separate; source utilities are not silently promoted.
- Candidate keys are research handles only. No stable ID, Card, fingerprint, Ticket, Story node, or rule is created here.

## Remaining downstream work

Cross-reference/deduplication, authority pressure, domain integration, Builder solvability, six-episode graphing, writing, art, migration, and release remain governed by the later gates in the Story expansion protocol.
