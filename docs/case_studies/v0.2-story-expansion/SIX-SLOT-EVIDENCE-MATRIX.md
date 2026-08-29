# Six-slot evidence matrix

This generated matrix separates qualifying source evidence, current stable-object support, and candidate dependencies. “Present” is not “playable,” and research never creates a fingerprint, Ticket, Card, or rule.

| Slot | Case | Subsystem | Observe/Symptom | Isolated Fault | Executed Test mappings | Repair | Verify | Support boundary | Useful / required current Commands |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | ---: |
| expansion-slot-01 | exp-001 | compute | `symptom.boot.no_post` | `fault.compute.cpu_socket.contacts_damaged` | `test.compute.socket_magnified_inspection` | `repair.compute.restore_socket_contacts` | `verify.compute.socket_path` | PRESENT_DOMAIN_OBJECTS_NOT_COMPLETE_PLAYABLE_PATH | 0 / 0 |
| expansion-slot-02 | exp-002 | power | `symptom.power.voltage_out_of_range` | `fault.power.distribution_board.failed` | `test.general.minimum_configuration`, `test.power.distribution_path_isolation`, `test.power.known_good_psu` | `repair.power.replace_distribution_board` | `verify.power.distribution_path` | PRESENT_DOMAIN_OBJECTS_NOT_COMPLETE_PLAYABLE_PATH | 0 / 0 |
| expansion-slot-03 | exp-003 | storage | `symptom.storage.predictive_failure_warning` | `fault.storage.drive.predictive_failure` | `test.storage.predictive_health` | `repair.storage.replace_predictive_drive` | `verify.storage.predictive_replacement` | PRESENT_DOMAIN_OBJECTS_NOT_COMPLETE_PLAYABLE_PATH | 0 / 0 |
| expansion-slot-04 | exp-004 | management | `symptom.management.alert_persists` | `fault.management.alert.stale` | `test.management.event_log_freshness` | `repair.management.clear_stale_alert_state` | `verify.management.alert_does_not_recur` | PRESENT_DOMAIN_OBJECTS_NOT_COMPLETE_PLAYABLE_PATH | 0 / 0 |
| expansion-slot-05 | exp-005 | firmware-network | `symptom.network.link_flapping` | `fault.firmware.version_set.incompatible` | `test.firmware.version_compatibility`, `test.network.link_counter_soak` | `repair.firmware.restore_compatible_versions` | `verify.firmware.compatible_persistent` | PRESENT_DOMAIN_OBJECTS_NOT_COMPLETE_PLAYABLE_PATH | 0 / 0 |
| expansion-slot-06 | exp-006 | management-firmware | `symptom.management.bmc_not_responding` | `fault.management.bmc_firmware.corrupt` | `test.management.bmc_recovery_state` | `repair.management.recover_bmc_firmware` | `verify.management.bmc_functional` | PRESENT_DOMAIN_OBJECTS_PLUS_UNRESOLVED_INTERFACE_GAPS | 0 / 0 |

All six reductions contain ordered Observe, Hypothesize, Test, Isolate, Repair, and Verify steps. Document is absent for exp-001 through exp-005 and present only for exp-006, whose source is an intentional recovery guide. Fidelity, source locators, and absent stages remain visible below.

## expansion-slot-01 — exp-001

- Source: [R910 will not power on with 4 processors](https://www.dell.com/community/en/conversations/rack-servers/r910-will-not-power-on-with-4-processors/647f7d25f4ccf8a8deb93b08) (opened 2026-08-28)
- Objective: `objective.compute.socket_contact_isolation`
- Fingerprint candidate: `fingerprint-candidate.compute.bent_socket_contacts`
- Selection score: 9/10
- Lifecycle absent from source: Document
- Current stable Components: `component.compute.cpu_socket`
- Current stable Tools: `tool.inspection.magnifier`
- Current stable Protocols: `protocol.service.cpu_socket_handling`
- Candidate dependencies: `fingerprint-candidate.compute.bent_socket_contacts`, `ticket-path-candidate.compute.socket_contact_isolation`

1. **Observe** (explicit) — The server would not power on in the full four-processor configuration. Locator: opening post: four-processor failure.
2. **Hypothesize** (inferred) — The configuration-dependent failure made the processor, socket, and board path competing explanations. Locator: configuration comparison context.
3. **Test** (explicit) — The processor population was compared and the implicated socket was inspected for contact damage. Locator: troubleshooting and inspection posts.
4. **Isolate** (inferred) — Bent CPU-socket contacts were identified as the actionable fault. Locator: resolution: bent contacts.
5. **Repair** (explicit) — The damaged contact condition was corrected before the server was reassembled. Locator: resolution repair description.
6. **Verify** (explicit) — The system then operated with the intended four-processor population. Locator: resolution follow-up.

Command/interface observations:

- None recorded.

Current Commands considered for catalog exposure: `command.linux.lspci`. Useful current Commands authorized by this research: None. Required current Commands: None.

## expansion-slot-02 — exp-002

- Source: [T420 PowerEdge VLT0204 main board voltage outside of range](https://www.dell.com/community/en/conversations/poweredge-hardware-general/t420-poweredge-vlt0204-main-board-voltage-outside-of-range/67fd91b469e6265ea77af6ab) (opened 2026-08-28)
- Objective: `objective.power.distribution_board_vs_mainboard`
- Fingerprint candidate: `fingerprint-candidate.power.failed_distribution_board`
- Selection score: 9/10
- Lifecycle absent from source: Document
- Current stable Components: `component.power.distribution_board`
- Current stable Tools: None
- Current stable Protocols: `protocol.safety.deenergize_discharge`
- Candidate dependencies: `fingerprint-candidate.power.failed_distribution_board`, `ticket-path-candidate.power.distribution_board_vs_mainboard`

1. **Observe** (explicit) — The T420 reported a VLT0204 main-board voltage outside its allowed range. Locator: opening post: VLT0204 alert.
2. **Hypothesize** (explicit) — The investigation considered the system board, supplies, and distribution path rather than accepting the alert label as the cause. Locator: diagnostic discussion.
3. **Test** (explicit) — Both PSUs were tried in both bays and the machine was reduced to a minimum configuration, narrowing the abnormal-voltage path. Locator: reported PSU/bay swaps and minimum-configuration test.
4. **Isolate** (inferred) — The failed power-distribution board, not the alert's generic main-board wording, was identified as the actionable cause. Locator: resolution diagnosis.
5. **Repair** (explicit) — The power-distribution board was replaced under a de-energized service boundary. Locator: resolution repair.
6. **Verify** (explicit) — The server returned without the voltage fault after replacement. Locator: resolution follow-up.

Command/interface observations:

- None recorded.

Current Commands considered for catalog exposure: `command.ipmi.sel_elist`. Useful current Commands authorized by this research: None. Required current Commands: None.

## expansion-slot-03 — exp-003

- Source: [PowerEdge R620 drive predicted failure](https://www.dell.com/community/en/conversations/poweredge-hardware-general/poweredge-r620-drive-predicted-failure/647f7b52f4ccf8a8de9878d4) (opened 2026-08-28)
- Objective: `objective.storage.predictive_replacement_before_failure`
- Fingerprint candidate: `fingerprint-candidate.storage.predictive_drive_failure`
- Selection score: 9/10
- Lifecycle absent from source: Document
- Current stable Components: `component.storage.sas_hdd`
- Current stable Tools: `tool.storage.raid_console`
- Current stable Protocols: `protocol.interface.sas`, `protocol.service.storage_data_preservation`
- Candidate dependencies: `fingerprint-candidate.storage.predictive_drive_failure`, `ticket-path-candidate.storage.predictive_replacement_before_failure`

1. **Observe** (explicit) — The R620 reported that a particular array drive was predicted to fail. Locator: opening post: predictive warning.
2. **Hypothesize** (explicit) — The warning was treated as a member-health problem to distinguish from an already failed array or a controller path fault. Locator: diagnostic and replacement discussion.
3. **Test** (explicit) — The controller's predictive and member status identified which drive remained online but unhealthy. Locator: drive-status discussion.
4. **Isolate** (explicit) — The named physical drive was isolated as predictively failing before complete loss. Locator: selected member identification.
5. **Repair** (explicit) — The predictively failing drive was replaced and the array rebuild was allowed to complete. Locator: replacement and rebuild follow-up.
6. **Verify** (explicit) — The completed rebuild and healthy member state verified the replacement. Locator: completion follow-up.

Command/interface observations:

- controller drive-status interface — VENDOR_INTERFACE_NOT_CURRENT_COMMAND: Reported predictive health and the affected member.

Current Commands considered for catalog exposure: `command.linux.smartctl`. Useful current Commands authorized by this research: None. Required current Commands: None.

## expansion-slot-04 — exp-004

- Source: [PE2900 backplane degraded](https://www.dell.com/community/en/conversations/poweredge-hddscsiraid/pe2900-backplane-degraded/647e8b20f4ccf8a8dede59e9) (opened 2026-08-28)
- Objective: `objective.management.stale_alert_vs_live_backplane_fault`
- Fingerprint candidate: `fingerprint-candidate.management.stale_backplane_alert`
- Selection score: 9/10
- Lifecycle absent from source: Document
- Current stable Components: `component.management.bmc`, `component.storage.backplane`
- Current stable Tools: `tool.management.bmc_console`
- Current stable Protocols: None
- Candidate dependencies: `fingerprint-candidate.management.stale_backplane_alert`, `ticket-path-candidate.management.stale_alert_vs_live_backplane_fault`

1. **Observe** (explicit) — Management continued to report a degraded backplane condition. Locator: opening post: degraded alert.
2. **Hypothesize** (explicit) — A live backplane problem and stale alert state were treated as competing explanations. Locator: diagnostic discussion.
3. **Test** (explicit) — A Dell DSET collection compared current hardware evidence with the persistent recorded alert. Locator: DSET diagnostic exchange.
4. **Isolate** (explicit) — The remaining condition was isolated to stale alert state rather than a current backplane fault. Locator: resolution diagnosis.
5. **Repair** (explicit) — The stale management alert state was cleared. Locator: resolution action.
6. **Verify** (explicit) — Follow-up state showed that the degraded alert did not recur as a current fault. Locator: resolution follow-up.

Command/interface observations:

- Dell DSET — DIAGNOSTIC_UTILITY_NOT_CURRENT_COMMAND: Collected current state that distinguished a stale alert from a live backplane fault.

Current Commands considered for catalog exposure: `command.ipmi.sel_elist`. Useful current Commands authorized by this research: None. Required current Commands: None.

## expansion-slot-05 — exp-005

- Source: [iDRAC keeps messaging the NIC in slot 4 port 1 network link is started](https://www.dell.com/community/en/conversations/poweredge-hardware-general/idrac-keeps-messaging-the-nic-in-slot-4-port-1-network-link-is-started/647f94b2f4ccf8a8de70eaff) (opened 2026-08-28)
- Objective: `objective.firmware.regression_vs_physical_link`
- Fingerprint candidate: `fingerprint-candidate.firmware.idrac_link_flap_regression`
- Selection score: 9/10
- Lifecycle absent from source: Document
- Current stable Components: `component.management.bmc`, `component.network.nic`
- Current stable Tools: `tool.management.bmc_console`
- Current stable Protocols: `protocol.service.firmware_change_control`
- Candidate dependencies: `fingerprint-candidate.firmware.idrac_link_flap_regression`, `ticket-path-candidate.firmware.regression_vs_physical_link`

1. **Observe** (explicit) — iDRAC repeatedly logged that a NIC port link had started, exposing a link-flap pattern. Locator: opening post: recurring link messages.
2. **Hypothesize** (explicit) — Physical link hardware and a recent management-firmware regression were compared as causes. Locator: diagnostic discussion.
3. **Test** (explicit) — Event timing and firmware-version comparison tied the repeated messages to the changed iDRAC version rather than the physical path. Locator: version correlation and rollback comparison.
4. **Isolate** (inferred) — The iDRAC firmware version set was isolated as incompatible with stable link reporting. Locator: rollback-supported diagnosis.
5. **Repair** (explicit) — The affected iDRAC firmware was rolled back to the prior compatible version. Locator: rollback action.
6. **Verify** (explicit) — The link messages and flapping ceased after rollback and remained stable. Locator: post-rollback follow-up.

Command/interface observations:

- iDRAC firmware update/rollback interface — REPAIR_INTERFACE_NOT_CURRENT_COMMAND: The before/after version comparison supplied evidence; the interface itself performed Repair.

Current Commands considered for catalog exposure: `command.linux.ethtool`. Useful current Commands authorized by this research: None. Required current Commands: None.

## expansion-slot-06 — exp-006

- Source: [GA-7PESH2 BMC recovery](https://forums.serverbuilds.net/t/ga-7pesh2-bmc-recovery/882) (opened 2026-08-28)
- Objective: `objective.management.bmc_recovery_state_before_board_replacement`
- Fingerprint candidate: `fingerprint-candidate.management.bmc_firmware_corruption`
- Selection score: 10/10
- Lifecycle absent from source: None
- Current stable Components: `component.management.bmc`
- Current stable Tools: `tool.management.bmc_console`
- Current stable Protocols: `protocol.service.firmware_change_control`
- Candidate dependencies: `fingerprint-candidate.management.bmc_firmware_corruption`, `ticket-path-candidate.management.bmc_recovery_state`, `candidate-interface.uart_bmc_recovery`, `candidate-protocol.tftp_bmc_recovery`

1. **Observe** (explicit) — The board-management controller was not responding after its firmware became unusable. Locator: opening failure report.
2. **Hypothesize** (explicit) — A recoverable firmware state was considered before concluding that the board hardware required replacement. Locator: recovery investigation.
3. **Test** (explicit) — UART output exposed the BMC's recovery behavior and readiness to accept an image. Locator: UART recovery-state output.
4. **Isolate** (inferred) — The recoverable BMC firmware image, rather than the whole system board, was isolated as the actionable fault. Locator: recovery-state interpretation.
5. **Repair** (explicit) — A replacement BMC firmware image was transferred through the UART/TFTP recovery path and installed. Locator: UART/TFTP recovery procedure.
6. **Verify** (explicit) — Normal BMC access and function returned after recovery. Locator: successful recovery follow-up.
7. **Document** (explicit) — The community recovery report preserved the failure state, recovery path, and successful result. Locator: procedure and successful follow-up posts.

Command/interface observations:

- UART console interaction — SOURCE_INTERFACE_NOT_CURRENT_COMMAND: Exposed the recoverable BMC boot state during Test.
- TFTP transfer invocation — SOURCE_TRANSPORT_NOT_CURRENT_COMMAND: Delivered the replacement image during Repair; it was not diagnostic proof.

Current Commands considered for catalog exposure: `command.ipmi.sel_elist`. Useful current Commands authorized by this research: None. Required current Commands: None.
