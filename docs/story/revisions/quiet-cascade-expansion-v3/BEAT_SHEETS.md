# Quiet Cascade expansion beat sheets

Status: **NON LIVE CANDIDATE NO FINAL DIALOGUE**

These are non-live structural beat summaries. They deliberately contain no final dialogue. Gameplay facts below are joined from the pinned Match registry and Builder/oracle proof, not invented by Story copy.

## Shift 7: The Fourth Pair

- Episode / Match: `story.shift.qc02.07` / `story.match.qc02.shift07.socket_contacts`
- Source: R910 will not power on with 4 processors (Dell Community), [opened 2026-08-28](https://www.dell.com/community/en/conversations/rack-servers/r910-will-not-power-on-with-4-processors/647f7d25f4ccf8a8deb93b08)
- Objective: `objective.compute.socket_contact_isolation` — Identify a socket-location fault without condemning known-good processors or memory.
- Ticket: `ticket.generated.4f237a22c35d46166044b2c7` / `dc4e0581e510fd94120fcca53ee8b25f5a8d3b456253627c7faf5603c5d8e481`
- Fingerprint: `fingerprint.compute.damaged_cpu_socket_contacts`
- Public Candidates: `fault.board.system.failed`, `fault.compute.cpu_socket.contacts_damaged`, `fault.cpu.not_seated`, `fault.memory.dimm.failed`, `fault.memory.dimm.not_seated`
- Hidden true Fault(s), author/proof only: `fault.compute.cpu_socket.contacts_damaged`
- Legal diagnostics (50): `command.ipmi.sel_elist`, `command.linux.dhclient`, `command.linux.dmesg`, `command.linux.ethtool`, `command.linux.free_h`, `command.linux.ip_addr`, `command.linux.ip_route`, `command.linux.journalctl`, `command.linux.lsblk`, `command.linux.lspci`, `command.linux.nvme_smart_log`, `command.linux.smartctl`, `command.network.ping`, `test.boot.device_inventory`, `test.boot.post_code_analysis`, `test.boot.post_observation`, `test.compute.socket_magnified_inspection`, `test.cooling.location_cross_substitution`, `test.electrical.continuity`, `test.firmware.settings_review`, `test.firmware.version_compatibility`, `test.general.minimum_configuration`, `test.general.visual_inspection`, `test.management.bmc_recovery_state`, `test.management.event_log_freshness`, `test.memory.diagnostic`, `test.memory.known_good_substitution`, `test.memory.single_dimm_isolation`, `test.network.cable_substitution`, `test.network.dhcp_pool_audit`, `test.network.dhcp_transaction_trace`, `test.network.interface_config`, `test.network.link`, `test.network.link_counter_soak`, `test.network.ping`, `test.pcie.inventory`, `test.power.distribution_path_isolation`, `test.power.known_good_psu`, `test.power.output_voltage_measurement`, `test.power.psu_status`, `test.power.residual_power_drain`, `test.storage.bay_path_isolation`, `test.storage.device_inventory`, `test.storage.drive_health`, `test.storage.predictive_health`, `test.storage.raid_status`, `test.system.bmc_logs`, `test.system.controlled_stress`, `test.thermal.fan_telemetry`, `test.thermal.temperature_monitoring`
- Relevant diagnostics (8): `test.boot.post_code_analysis`, `test.compute.socket_magnified_inspection`, `test.general.minimum_configuration`, `test.general.visual_inspection`, `test.memory.diagnostic`, `test.memory.known_good_substitution`, `test.memory.single_dimm_isolation`, `test.system.bmc_logs`
- Required diagnostics (1): `test.compute.socket_magnified_inspection`
- Optional diagnostics (7): `test.boot.post_code_analysis`, `test.general.minimum_configuration`, `test.general.visual_inspection`, `test.memory.diagnostic`, `test.memory.known_good_substitution`, `test.memory.single_dimm_isolation`, `test.system.bmc_logs`
- Repair: `repair.compute.restore_socket_contacts`
- Verify: `verify.compute.socket_path`
- Response counts: `card.response.repair.compute.restore_socket_contacts` × 1; `card.response.verify.compute.socket_path` × 1
- Deck pressure: `deck.story.expansion_response_v1`, 30 Cards; Repair headroom 2; Verify headroom 1; feasible **yes**.
- Commands — catalog exposure (13): `command.ipmi.sel_elist`, `command.linux.dhclient`, `command.linux.dmesg`, `command.linux.ethtool`, `command.linux.free_h`, `command.linux.ip_addr`, `command.linux.ip_route`, `command.linux.journalctl`, `command.linux.lsblk`, `command.linux.lspci`, `command.linux.nvme_smart_log`, `command.linux.smartctl`, `command.network.ping`
- Commands — useful/relevant Evidence (0): none
- Commands — required Isolation (0): none
- Seed / requested Tickets: `story.quiet_cascade.expansion.s07.v1` / 1
- Checkpoints: entry `checkpoint.qc02.shift07.entry`; pre-Match `checkpoint.qc02.shift07.pre_match`; post-Match `checkpoint.qc02.shift07.post_match`
- Result branches: `story.qc02.shift07.success` or `story.qc02.shift07.abandon`, reconverging at `story.qc02.shift07.follow_on`
- Branch inputs: `choice.qc02.initial_evidence_frame` plus only a valid normalized `completion` of `COMPLETED` or `ABANDONED`; hidden truth and dialogue assertions are excluded.
- Story Service Points: completed valid result +2; abandoned valid result +0; preserve inherited campaign-one total; no cumulative gate.
- Interruption/replay: fresh launch from pre-Match after interruption; accepted completed episodes are isolated non-canonical review/practice under STORY-009 A.
- Research Document stage: absent in the qualifying source reduction; Story may not attribute a source-authored handoff that did not occur.

### Public setup

A server reaches the floor after failing only when its full processor population is installed; the intake record does not establish whether a processor, memory path, socket location, or board path is responsible.

Match-safe projection: Known-good processors work in other pairings, but configurations that depend on one CPU socket do not boot.

### Intentional repeated practice

- Campaign Shift 1: a public symptom starts a question but does not name the fault.
- Campaign Shift 3: compare locations and keep otherwise known-good parts separate from the failing path.

### Ordered beats

| Kind | Beat ID | Structural intent |
| --- | --- | --- |
| PUBLIC_SETUP | `story.beat.qc02.07.public_setup` | Sora and Malik frame the population-dependent no-POST report as a location question, not a verdict on any part. |
| LEARNING | `story.beat.qc02.07.learning` | The player must support a socket-location Isolation with discriminating Evidence. |
| REPEATED_PRACTICE | `story.beat.qc02.07.practice` | Repeat campaign-one component-versus-location reasoning under a compute configuration change. |
| CUTSCENE_CHOICE | `story.beat.qc02.07.choice` | Choose whether the brief leads with location context or controlled comparison; both orders reconverge before Match authority begins. |
| CHECKPOINT | `story.beat.qc02.07.checkpoint` | Persist entry and pre-Match boundaries before the one-Ticket handoff. |
| MATCH | `story.beat.qc02.07.match` | Launch the ordinary generated socket-contact Ticket without exposing its hidden truth. |
| OUTCOME_BRANCH | `story.beat.qc02.07.branch` | Receive only valid COMPLETED or ABANDONED normalization, then reconverge without lending the result to another Ticket. |
| SERVICE_POINT | `story.beat.qc02.07.points` | Add the authoritative Match gain—two for completed closure, zero for abandonment—without testing a cumulative gate. |
| INTERRUPTION | `story.beat.qc02.07.interruption` | An interrupted active Match restarts from the pre-Match checkpoint as a fresh launch. |
| FOLLOW_ON | `story.beat.qc02.07.follow_on` | Carry the distinction between a failed part and a failed shared path into power-distribution segmentation. |

### Art reuse

- Backgrounds: `story.bg.trinity.trace.night`, `story.bg.trinity.core_floor.night_storm`
- Character poses: `story.character.sora_chen:focused`, `story.character.sora_chen:approving`, `story.character.malik_okoye:focused`
- Transient inserts/new masters: none.

## Shift 8: Across Both Bays

- Episode / Match: `story.shift.qc02.08` / `story.match.qc02.shift08.power_distribution`
- Source: T420 PowerEdge VLT0204 main board voltage outside of range (Dell Community), [opened 2026-08-28](https://www.dell.com/community/en/conversations/poweredge-hardware-general/t420-poweredge-vlt0204-main-board-voltage-outside-of-range/67fd91b469e6265ea77af6ab)
- Objective: `objective.power.distribution_board_vs_mainboard` — Use cross-bay known-good comparisons to isolate a shared distribution fault.
- Ticket: `ticket.generated.3fd6eb04534f79b5b3f87f98` / `d34f08d79c2cc2d47d16d23ec753f1e78758d0b358664d4e592ea23f25b63d73`
- Fingerprint: `fingerprint.power.failed_distribution_board`
- Public Candidates: `fault.board.system.failed`, `fault.power.distribution_board.failed`, `fault.power.input.cable_loose`, `fault.power.psu.failed`, `fault.power.psu.not_seated`
- Hidden true Fault(s), author/proof only: `fault.power.distribution_board.failed`
- Legal diagnostics (50): `command.ipmi.sel_elist`, `command.linux.dhclient`, `command.linux.dmesg`, `command.linux.ethtool`, `command.linux.free_h`, `command.linux.ip_addr`, `command.linux.ip_route`, `command.linux.journalctl`, `command.linux.lsblk`, `command.linux.lspci`, `command.linux.nvme_smart_log`, `command.linux.smartctl`, `command.network.ping`, `test.boot.device_inventory`, `test.boot.post_code_analysis`, `test.boot.post_observation`, `test.compute.socket_magnified_inspection`, `test.cooling.location_cross_substitution`, `test.electrical.continuity`, `test.firmware.settings_review`, `test.firmware.version_compatibility`, `test.general.minimum_configuration`, `test.general.visual_inspection`, `test.management.bmc_recovery_state`, `test.management.event_log_freshness`, `test.memory.diagnostic`, `test.memory.known_good_substitution`, `test.memory.single_dimm_isolation`, `test.network.cable_substitution`, `test.network.dhcp_pool_audit`, `test.network.dhcp_transaction_trace`, `test.network.interface_config`, `test.network.link`, `test.network.link_counter_soak`, `test.network.ping`, `test.pcie.inventory`, `test.power.distribution_path_isolation`, `test.power.known_good_psu`, `test.power.output_voltage_measurement`, `test.power.psu_status`, `test.power.residual_power_drain`, `test.storage.bay_path_isolation`, `test.storage.device_inventory`, `test.storage.drive_health`, `test.storage.predictive_health`, `test.storage.raid_status`, `test.system.bmc_logs`, `test.system.controlled_stress`, `test.thermal.fan_telemetry`, `test.thermal.temperature_monitoring`
- Relevant diagnostics (8): `test.general.minimum_configuration`, `test.general.visual_inspection`, `test.power.distribution_path_isolation`, `test.power.known_good_psu`, `test.power.output_voltage_measurement`, `test.power.psu_status`, `test.power.residual_power_drain`, `test.system.bmc_logs`
- Required diagnostics (1): `test.power.distribution_path_isolation`
- Optional diagnostics (7): `test.general.minimum_configuration`, `test.general.visual_inspection`, `test.power.known_good_psu`, `test.power.output_voltage_measurement`, `test.power.psu_status`, `test.power.residual_power_drain`, `test.system.bmc_logs`
- Repair: `repair.power.replace_distribution_board`
- Verify: `verify.power.distribution_path`
- Response counts: `card.response.repair.power.replace_distribution_board` × 1; `card.response.verify.power.distribution_path` × 1
- Deck pressure: `deck.story.expansion_response_v1`, 30 Cards; Repair headroom 2; Verify headroom 1; feasible **yes**.
- Commands — catalog exposure (13): `command.ipmi.sel_elist`, `command.linux.dhclient`, `command.linux.dmesg`, `command.linux.ethtool`, `command.linux.free_h`, `command.linux.ip_addr`, `command.linux.ip_route`, `command.linux.journalctl`, `command.linux.lsblk`, `command.linux.lspci`, `command.linux.nvme_smart_log`, `command.linux.smartctl`, `command.network.ping`
- Commands — useful/relevant Evidence (0): none
- Commands — required Isolation (0): none
- Seed / requested Tickets: `story.quiet_cascade.expansion.s08.v1` / 1
- Checkpoints: entry `checkpoint.qc02.shift08.entry`; pre-Match `checkpoint.qc02.shift08.pre_match`; post-Match `checkpoint.qc02.shift08.post_match`
- Result branches: `story.qc02.shift08.success` or `story.qc02.shift08.abandon`, reconverging at `story.qc02.shift08.follow_on`
- Branch inputs: no local cutscene choice plus only a valid normalized `completion` of `COMPLETED` or `ABANDONED`; hidden truth and dialogue assertions are excluded.
- Story Service Points: completed valid result +2; abandoned valid result +0; preserve inherited campaign-one total; no cumulative gate.
- Interruption/replay: fresh launch from pre-Match after interruption; accepted completed episodes are isolated non-canonical review/practice under STORY-009 A.
- Research Document stage: absent in the qualifying source reduction; Story may not attribute a source-authored handoff that did not occur.

### Public setup

A server reports an out-of-range voltage and can fail to power, while the alert wording alone cannot distinguish an individual supply, its seating/input, a shared distribution path, or the system board.

Match-safe projection: The server reports a voltage error and shuts down immediately even after component reduction and supply/bay comparison.

### Intentional repeated practice

- Campaign Shift 2: the same redundancy warning may have different actionable causes.
- Expansion Shift 7: separate the suspect part from the shared path and location around it.

### Ordered beats

| Kind | Beat ID | Structural intent |
| --- | --- | --- |
| PUBLIC_SETUP | `story.beat.qc02.08.public_setup` | Malik presents the voltage alert and bay behavior without promoting the alert label into a diagnosis. |
| LEARNING | `story.beat.qc02.08.learning` | The player must locate persistence across supplies and bays on the shared distribution path. |
| REPEATED_PRACTICE | `story.beat.qc02.08.practice` | Repeat campaign-one power-warning discrimination with explicit path segmentation rather than icon matching. |
| CHECKPOINT | `story.beat.qc02.08.checkpoint` | Persist entry and pre-Match boundaries before the one-Ticket handoff. |
| MATCH | `story.beat.qc02.08.match` | Launch the ordinary generated power-distribution Ticket. |
| OUTCOME_BRANCH | `story.beat.qc02.08.branch` | Hana receives closure or an honest bounded gap, then both routes reconverge. |
| SERVICE_POINT | `story.beat.qc02.08.points` | Add only the normalized one-Ticket Match gain and preserve the campaign-one total. |
| INTERRUPTION | `story.beat.qc02.08.interruption` | An interrupted active Match restarts from its durable pre-Match checkpoint. |
| DELAYED_CHOICE_ACK | `story.beat.qc02.08.ack` | Acknowledge the Shift 7 evidence-framing choice as a durable briefing habit, never as gameplay authority. |
| FOLLOW_ON | `story.beat.qc02.08.follow_on` | Move from fault location under failure to a warning that is actionable before outage. |

### Art reuse

- Backgrounds: `story.bg.trinity.core_floor.night_storm`, `story.bg.trinity.validation_gate.predawn`
- Character poses: `story.character.malik_okoye:focused`, `story.character.malik_okoye:defensive`, `story.character.hana_park:skeptical`, `story.character.hana_park:relief`
- Transient inserts/new masters: none.

## Shift 9: Before the Drop

- Episode / Match: `story.shift.qc02.09` / `story.match.qc02.shift09.predictive_drive`
- Source: PowerEdge R620 drive predicted failure (Dell Community), [opened 2026-08-28](https://www.dell.com/community/en/conversations/poweredge-hardware-general/poweredge-r620-drive-predicted-failure/647f7b52f4ccf8a8de9878d4)
- Objective: `objective.storage.predictive_replacement_before_failure` — Treat predictive failure as actionable while protecting data and proving completed recovery.
- Ticket: `ticket.generated.36ba2ae8958431194a7e1fef` / `c71d7e7f87b7e1177f7f8b79344293dee489778c9acfc9ba213d9cb7410aa671`
- Fingerprint: `fingerprint.storage.predictive_drive_failure`
- Public Candidates: `fault.storage.drive.predictive_failure`, `fault.storage.sas.drive_failed`
- Hidden true Fault(s), author/proof only: `fault.storage.drive.predictive_failure`
- Legal diagnostics (50): `command.ipmi.sel_elist`, `command.linux.dhclient`, `command.linux.dmesg`, `command.linux.ethtool`, `command.linux.free_h`, `command.linux.ip_addr`, `command.linux.ip_route`, `command.linux.journalctl`, `command.linux.lsblk`, `command.linux.lspci`, `command.linux.nvme_smart_log`, `command.linux.smartctl`, `command.network.ping`, `test.boot.device_inventory`, `test.boot.post_code_analysis`, `test.boot.post_observation`, `test.compute.socket_magnified_inspection`, `test.cooling.location_cross_substitution`, `test.electrical.continuity`, `test.firmware.settings_review`, `test.firmware.version_compatibility`, `test.general.minimum_configuration`, `test.general.visual_inspection`, `test.management.bmc_recovery_state`, `test.management.event_log_freshness`, `test.memory.diagnostic`, `test.memory.known_good_substitution`, `test.memory.single_dimm_isolation`, `test.network.cable_substitution`, `test.network.dhcp_pool_audit`, `test.network.dhcp_transaction_trace`, `test.network.interface_config`, `test.network.link`, `test.network.link_counter_soak`, `test.network.ping`, `test.pcie.inventory`, `test.power.distribution_path_isolation`, `test.power.known_good_psu`, `test.power.output_voltage_measurement`, `test.power.psu_status`, `test.power.residual_power_drain`, `test.storage.bay_path_isolation`, `test.storage.device_inventory`, `test.storage.drive_health`, `test.storage.predictive_health`, `test.storage.raid_status`, `test.system.bmc_logs`, `test.system.controlled_stress`, `test.thermal.fan_telemetry`, `test.thermal.temperature_monitoring`
- Relevant diagnostics (6): `command.linux.smartctl`, `test.storage.bay_path_isolation`, `test.storage.drive_health`, `test.storage.predictive_health`, `test.storage.raid_status`, `test.system.bmc_logs`
- Required diagnostics (1): `test.storage.predictive_health`
- Optional diagnostics (5): `command.linux.smartctl`, `test.storage.bay_path_isolation`, `test.storage.drive_health`, `test.storage.raid_status`, `test.system.bmc_logs`
- Repair: `repair.storage.replace_predictive_drive`
- Verify: `verify.storage.predictive_replacement`
- Response counts: `card.response.repair.storage.replace_predictive_drive` × 1; `card.response.verify.storage.predictive_replacement` × 1
- Deck pressure: `deck.story.expansion_response_v1`, 30 Cards; Repair headroom 2; Verify headroom 1; feasible **yes**.
- Commands — catalog exposure (13): `command.ipmi.sel_elist`, `command.linux.dhclient`, `command.linux.dmesg`, `command.linux.ethtool`, `command.linux.free_h`, `command.linux.ip_addr`, `command.linux.ip_route`, `command.linux.journalctl`, `command.linux.lsblk`, `command.linux.lspci`, `command.linux.nvme_smart_log`, `command.linux.smartctl`, `command.network.ping`
- Commands — useful/relevant Evidence (1): `command.linux.smartctl`
- Commands — required Isolation (0): none
- Seed / requested Tickets: `story.quiet_cascade.expansion.s09.v1` / 1
- Checkpoints: entry `checkpoint.qc02.shift09.entry`; pre-Match `checkpoint.qc02.shift09.pre_match`; post-Match `checkpoint.qc02.shift09.post_match`
- Result branches: `story.qc02.shift09.success` or `story.qc02.shift09.abandon`, reconverging at `story.qc02.shift09.follow_on`
- Branch inputs: no local cutscene choice plus only a valid normalized `completion` of `COMPLETED` or `ABANDONED`; hidden truth and dialogue assertions are excluded.
- Story Service Points: completed valid result +2; abandoned valid result +0; preserve inherited campaign-one total; no cumulative gate.
- Interruption/replay: fresh launch from pre-Match after interruption; accepted completed episodes are isolated non-canonical review/practice under STORY-009 A.
- Research Document stage: absent in the qualifying source reduction; Story may not attribute a source-authored handoff that did not occur.

### Public setup

An array member remains online but carries a predictive warning; the work must distinguish early media risk from an already failed member while protecting the array.

Match-safe projection: A drive reports predictive health warnings and a mixed amber/green bay indication while the array remains available.

### Intentional repeated practice

- Campaign Shift 6: each storage Ticket needs its own Isolation, Repair, independent Verify, and documented limit.
- Campaign-wide practice: warnings and public context are not themselves causal truth.

### Ordered beats

| Kind | Beat ID | Structural intent |
| --- | --- | --- |
| PUBLIC_SETUP | `story.beat.qc02.09.public_setup` | Jonah frames a current predictive warning as a bounded risk record rather than a completed outage. |
| LEARNING | `story.beat.qc02.09.learning` | The player must act before failure while retaining the data-preservation boundary and an independent completed-rebuild Verify. |
| REPEATED_PRACTICE | `story.beat.qc02.09.practice` | Repeat campaign-one independent storage closure with a proactive rather than already-failed member. |
| CHECKPOINT | `story.beat.qc02.09.checkpoint` | Persist entry and pre-Match boundaries before the one-Ticket handoff. |
| MATCH | `story.beat.qc02.09.match` | Launch the ordinary generated predictive-drive Ticket. |
| OUTCOME_BRANCH | `story.beat.qc02.09.branch` | Receive a verified rebuild closure or preserve unresolved risk; reconverge afterward. |
| SERVICE_POINT | `story.beat.qc02.09.points` | Add only the normalized result gain, with no threshold that blocks the next lesson. |
| INTERRUPTION | `story.beat.qc02.09.interruption` | An interrupted active Match is discarded and freshly launched from pre-Match. |
| FOLLOW_ON | `story.beat.qc02.09.follow_on` | Turn from proactive warning evidence to the harder question of whether a persistent alert describes current state at all. |

### Art reuse

- Backgrounds: `story.bg.trinity.core_floor.night_storm`, `story.bg.trinity.knowledge_systems.night`
- Character poses: `story.character.jonah_reed:thoughtful`, `story.character.hana_park:skeptical`, `story.character.hana_park:relief`
- Transient inserts/new masters: none.

## Shift 10: The Alert That Stayed

- Episode / Match: `story.shift.qc02.10` / `story.match.qc02.shift10.stale_alert`
- Source: PE2900 backplane degraded (Dell Community), [opened 2026-08-28](https://www.dell.com/community/en/conversations/poweredge-hddscsiraid/pe2900-backplane-degraded/647e8b20f4ccf8a8dede59e9)
- Objective: `objective.management.stale_alert_vs_live_backplane_fault` — Separate read-only evidence preservation from the state-changing Repair that clears a stale alert.
- Ticket: `ticket.generated.b68505324c44f11977fcda07` / `c889bd1e907f1537e8080822e7d9ded3821e0507fe8bc20f49490ae81f01f0e8`
- Fingerprint: `fingerprint.management.stale_alert`
- Public Candidates: `fault.management.alert.stale`, `fault.storage.backplane.path_failed`
- Hidden true Fault(s), author/proof only: `fault.management.alert.stale`
- Legal diagnostics (50): `command.ipmi.sel_elist`, `command.linux.dhclient`, `command.linux.dmesg`, `command.linux.ethtool`, `command.linux.free_h`, `command.linux.ip_addr`, `command.linux.ip_route`, `command.linux.journalctl`, `command.linux.lsblk`, `command.linux.lspci`, `command.linux.nvme_smart_log`, `command.linux.smartctl`, `command.network.ping`, `test.boot.device_inventory`, `test.boot.post_code_analysis`, `test.boot.post_observation`, `test.compute.socket_magnified_inspection`, `test.cooling.location_cross_substitution`, `test.electrical.continuity`, `test.firmware.settings_review`, `test.firmware.version_compatibility`, `test.general.minimum_configuration`, `test.general.visual_inspection`, `test.management.bmc_recovery_state`, `test.management.event_log_freshness`, `test.memory.diagnostic`, `test.memory.known_good_substitution`, `test.memory.single_dimm_isolation`, `test.network.cable_substitution`, `test.network.dhcp_pool_audit`, `test.network.dhcp_transaction_trace`, `test.network.interface_config`, `test.network.link`, `test.network.link_counter_soak`, `test.network.ping`, `test.pcie.inventory`, `test.power.distribution_path_isolation`, `test.power.known_good_psu`, `test.power.output_voltage_measurement`, `test.power.psu_status`, `test.power.residual_power_drain`, `test.storage.bay_path_isolation`, `test.storage.device_inventory`, `test.storage.drive_health`, `test.storage.predictive_health`, `test.storage.raid_status`, `test.system.bmc_logs`, `test.system.controlled_stress`, `test.thermal.fan_telemetry`, `test.thermal.temperature_monitoring`
- Relevant diagnostics (3): `command.linux.lsblk`, `test.management.event_log_freshness`, `test.storage.device_inventory`
- Required diagnostics (1): `test.management.event_log_freshness`
- Optional diagnostics (2): `command.linux.lsblk`, `test.storage.device_inventory`
- Repair: `repair.management.clear_stale_alert_state`
- Verify: `verify.management.alert_does_not_recur`
- Response counts: `card.response.repair.management.clear_stale_alert_state` × 1; `card.response.verify.management.alert_does_not_recur` × 1
- Deck pressure: `deck.story.expansion_response_v1`, 30 Cards; Repair headroom 2; Verify headroom 1; feasible **yes**.
- Commands — catalog exposure (13): `command.ipmi.sel_elist`, `command.linux.dhclient`, `command.linux.dmesg`, `command.linux.ethtool`, `command.linux.free_h`, `command.linux.ip_addr`, `command.linux.ip_route`, `command.linux.journalctl`, `command.linux.lsblk`, `command.linux.lspci`, `command.linux.nvme_smart_log`, `command.linux.smartctl`, `command.network.ping`
- Commands — useful/relevant Evidence (1): `command.linux.lsblk`
- Commands — required Isolation (0): none
- Seed / requested Tickets: `story.quiet_cascade.expansion.s10.v1` / 1
- Checkpoints: entry `checkpoint.qc02.shift10.entry`; pre-Match `checkpoint.qc02.shift10.pre_match`; post-Match `checkpoint.qc02.shift10.post_match`
- Result branches: `story.qc02.shift10.success` or `story.qc02.shift10.abandon`, reconverging at `story.qc02.shift10.follow_on`
- Branch inputs: `choice.qc02.change_evidence_frame` plus only a valid normalized `completion` of `COMPLETED` or `ABANDONED`; hidden truth and dialogue assertions are excluded.
- Story Service Points: completed valid result +2; abandoned valid result +0; preserve inherited campaign-one total; no cumulative gate.
- Interruption/replay: fresh launch from pre-Match after interruption; accepted completed episodes are isolated non-canonical review/practice under STORY-009 A.
- Research Document stage: absent in the qualifying source reduction; Story may not attribute a source-authored handoff that did not occur.

### Public setup

A management alert persists even though the visible device inventory does not show a matching present failure; current state and alert chronology must remain separate until tested.

Match-safe projection: Healthy drive and backplane evidence conflicts with a persistent degraded management alert.

### Intentional repeated practice

- Campaign Shift 5: preserve source, target, condition, output, and time with negative results.
- Campaign Story: a historical record is context, not current machine truth.

### Ordered beats

| Kind | Beat ID | Structural intent |
| --- | --- | --- |
| PUBLIC_SETUP | `story.beat.qc02.10.public_setup` | Hana and Jonah expose the mismatch between a persistent alert and current inventory without declaring either stale or live. |
| LEARNING | `story.beat.qc02.10.learning` | The player must preserve and compare evidence before the state-changing clear operation. |
| REPEATED_PRACTICE | `story.beat.qc02.10.practice` | Repeat campaign-one provenance discipline on a management surface where Test and Repair can look deceptively similar. |
| CUTSCENE_CHOICE | `story.beat.qc02.10.choice` | Choose whether the brief leads with current state or change history; both orders reconverge before Match authority begins. |
| CHECKPOINT | `story.beat.qc02.10.checkpoint` | Persist entry and pre-Match boundaries before the one-Ticket handoff. |
| MATCH | `story.beat.qc02.10.match` | Launch the ordinary generated stale-alert Ticket with the read-only Test/state-changing Repair boundary intact. |
| OUTCOME_BRANCH | `story.beat.qc02.10.branch` | Receive nonrecurrence closure or an unresolved alert record, then reconverge. |
| SERVICE_POINT | `story.beat.qc02.10.points` | Add only authoritative one-Ticket Story points and do not infer quality from the inherited total. |
| INTERRUPTION | `story.beat.qc02.10.interruption` | An interrupted active Match restarts from pre-Match and cannot imply that alert state was preserved or cleared. |
| FOLLOW_ON | `story.beat.qc02.10.follow_on` | Carry current-versus-historical discipline into corroborating a firmware regression across version changes. |

### Art reuse

- Backgrounds: `story.bg.trinity.knowledge_systems.night`
- Character poses: `story.character.hana_park:skeptical`, `story.character.hana_park:relief`, `story.character.jonah_reed:defensive`, `story.character.jonah_reed:thoughtful`
- Transient inserts/new masters: none.

## Shift 11: Version A, Version B

- Episode / Match: `story.shift.qc02.11` / `story.match.qc02.shift11.firmware_regression`
- Source: iDRAC keeps messaging the NIC in slot 4 port 1 network link is started (Dell Community), [opened 2026-08-28](https://www.dell.com/community/en/conversations/poweredge-hardware-general/idrac-keeps-messaging-the-nic-in-slot-4-port-1-network-link-is-started/647f94b2f4ccf8a8de70eaff)
- Objective: `objective.firmware.regression_vs_physical_link` — Use repeated version A/B behavior and hardware elimination to diagnose a firmware regression.
- Ticket: `ticket.generated.b34238282822e93980b5f1ad` / `face80b0d5c6f6c7f1ef3bb0495c0c6e4105360fa07887fb50cc2dea440cbc50`
- Fingerprint: `fingerprint.firmware.incompatible_version_set`
- Public Candidates: `fault.firmware.version_set.incompatible`, `fault.network.cable.disconnected`, `fault.network.cable.failed`, `fault.network.nic.failed`
- Hidden true Fault(s), author/proof only: `fault.firmware.version_set.incompatible`
- Legal diagnostics (50): `command.ipmi.sel_elist`, `command.linux.dhclient`, `command.linux.dmesg`, `command.linux.ethtool`, `command.linux.free_h`, `command.linux.ip_addr`, `command.linux.ip_route`, `command.linux.journalctl`, `command.linux.lsblk`, `command.linux.lspci`, `command.linux.nvme_smart_log`, `command.linux.smartctl`, `command.network.ping`, `test.boot.device_inventory`, `test.boot.post_code_analysis`, `test.boot.post_observation`, `test.compute.socket_magnified_inspection`, `test.cooling.location_cross_substitution`, `test.electrical.continuity`, `test.firmware.settings_review`, `test.firmware.version_compatibility`, `test.general.minimum_configuration`, `test.general.visual_inspection`, `test.management.bmc_recovery_state`, `test.management.event_log_freshness`, `test.memory.diagnostic`, `test.memory.known_good_substitution`, `test.memory.single_dimm_isolation`, `test.network.cable_substitution`, `test.network.dhcp_pool_audit`, `test.network.dhcp_transaction_trace`, `test.network.interface_config`, `test.network.link`, `test.network.link_counter_soak`, `test.network.ping`, `test.pcie.inventory`, `test.power.distribution_path_isolation`, `test.power.known_good_psu`, `test.power.output_voltage_measurement`, `test.power.psu_status`, `test.power.residual_power_drain`, `test.storage.bay_path_isolation`, `test.storage.device_inventory`, `test.storage.drive_health`, `test.storage.predictive_health`, `test.storage.raid_status`, `test.system.bmc_logs`, `test.system.controlled_stress`, `test.thermal.fan_telemetry`, `test.thermal.temperature_monitoring`
- Relevant diagnostics (7): `command.linux.lspci`, `test.firmware.version_compatibility`, `test.general.visual_inspection`, `test.network.cable_substitution`, `test.network.link`, `test.network.link_counter_soak`, `test.pcie.inventory`
- Required diagnostics (2): `test.firmware.version_compatibility`, `test.network.link_counter_soak`
- Optional diagnostics (5): `command.linux.lspci`, `test.general.visual_inspection`, `test.network.cable_substitution`, `test.network.link`, `test.pcie.inventory`
- Repair: `repair.firmware.restore_compatible_versions`
- Verify: `verify.firmware.compatible_persistent`
- Response counts: `card.response.repair.firmware.restore_compatible_versions` × 1; `card.response.verify.firmware.compatible_persistent` × 1
- Deck pressure: `deck.story.expansion_response_v1`, 30 Cards; Repair headroom 2; Verify headroom 1; feasible **yes**.
- Commands — catalog exposure (13): `command.ipmi.sel_elist`, `command.linux.dhclient`, `command.linux.dmesg`, `command.linux.ethtool`, `command.linux.free_h`, `command.linux.ip_addr`, `command.linux.ip_route`, `command.linux.journalctl`, `command.linux.lsblk`, `command.linux.lspci`, `command.linux.nvme_smart_log`, `command.linux.smartctl`, `command.network.ping`
- Commands — useful/relevant Evidence (1): `command.linux.lspci`
- Commands — required Isolation (0): none
- Seed / requested Tickets: `story.quiet_cascade.expansion.s11.v1` / 1
- Checkpoints: entry `checkpoint.qc02.shift11.entry`; pre-Match `checkpoint.qc02.shift11.pre_match`; post-Match `checkpoint.qc02.shift11.post_match`
- Result branches: `story.qc02.shift11.success` or `story.qc02.shift11.abandon`, reconverging at `story.qc02.shift11.follow_on`
- Branch inputs: no local cutscene choice plus only a valid normalized `completion` of `COMPLETED` or `ABANDONED`; hidden truth and dialogue assertions are excluded.
- Story Service Points: completed valid result +2; abandoned valid result +0; preserve inherited campaign-one total; no cumulative gate.
- Interruption/replay: fresh launch from pre-Match after interruption; accepted completed episodes are isolated non-canonical review/practice under STORY-009 A.
- Research Document stage: absent in the qualifying source reduction; Story may not attribute a source-authored handoff that did not occur.

### Public setup

A network port repeatedly changes link state after a management firmware change; physical media, interface hardware, and version compatibility remain public Candidates until corroborated.

Match-safe projection: Network link flaps began after a management firmware change even though swapped hardware and cabling remain healthy.

### Intentional repeated practice

- Campaign Shift 4: reproduction under named conditions does not by itself establish cause.
- Campaign Shift 5: physical-link evidence and configured-state evidence remain distinct until Isolation.

### Ordered beats

| Kind | Beat ID | Structural intent |
| --- | --- | --- |
| PUBLIC_SETUP | `story.beat.qc02.11.public_setup` | Malik and Sora frame repeatable link behavior across a version change without treating sequence as sufficient causation. |
| LEARNING | `story.beat.qc02.11.learning` | The player must cite two corroborating observations before the firmware Isolation becomes actionable. |
| REPEATED_PRACTICE | `story.beat.qc02.11.practice` | Repeat named-condition reproduction and physical-versus-configured discrimination in one corroborated route. |
| CHECKPOINT | `story.beat.qc02.11.checkpoint` | Persist entry and pre-Match boundaries before the one-Ticket handoff. |
| MATCH | `story.beat.qc02.11.match` | Launch the ordinary generated firmware-regression Ticket. |
| OUTCOME_BRANCH | `story.beat.qc02.11.branch` | Receive sustained compatible behavior or preserve the unresolved version boundary, then reconverge. |
| SERVICE_POINT | `story.beat.qc02.11.points` | Add only authoritative Match points; corroboration is required work, not a dialogue-awarded bonus. |
| INTERRUPTION | `story.beat.qc02.11.interruption` | An interrupted active Match restarts from pre-Match with no claim that a prior soak continued. |
| DELAYED_CHOICE_ACK | `story.beat.qc02.11.ack` | Acknowledge the Shift 10 current-state/change-history framing choice without changing evidence or outcome authority. |
| FOLLOW_ON | `story.beat.qc02.11.follow_on` | Escalate from compatible version restoration to a bounded controller recovery where observing recovery state must remain separate from changing firmware. |

### Art reuse

- Backgrounds: `story.bg.trinity.core_floor.night_storm`, `story.bg.trinity.trace.night`
- Character poses: `story.character.malik_okoye:focused`, `story.character.malik_okoye:defensive`, `story.character.sora_chen:focused`, `story.character.sora_chen:approving`
- Transient inserts/new masters: none.

## Shift 12: Recovery State

- Episode / Match: `story.shift.qc02.12` / `story.match.qc02.shift12.bmc_recovery`
- Source: GA-7PESH2 BMC recovery (ServerBuilds.net Forums), [opened 2026-08-28](https://forums.serverbuilds.net/t/ga-7pesh2-bmc-recovery/882)
- Objective: `objective.management.bmc_recovery_state_before_board_replacement` — Bound dangerous controller recovery to approved platform methods and verify recovery separately from the flash action.
- Ticket: `ticket.generated.f32b85cbf2054fdf0114f42a` / `761016e56ceb47a585727555f64bac47b103933cddbafc27a5c385f402851b01`
- Fingerprint: `fingerprint.management.corrupt_bmc_firmware`
- Public Candidates: `fault.firmware.version_set.incompatible`, `fault.management.bmc_firmware.corrupt`
- Hidden true Fault(s), author/proof only: `fault.management.bmc_firmware.corrupt`
- Legal diagnostics (50): `command.ipmi.sel_elist`, `command.linux.dhclient`, `command.linux.dmesg`, `command.linux.ethtool`, `command.linux.free_h`, `command.linux.ip_addr`, `command.linux.ip_route`, `command.linux.journalctl`, `command.linux.lsblk`, `command.linux.lspci`, `command.linux.nvme_smart_log`, `command.linux.smartctl`, `command.network.ping`, `test.boot.device_inventory`, `test.boot.post_code_analysis`, `test.boot.post_observation`, `test.compute.socket_magnified_inspection`, `test.cooling.location_cross_substitution`, `test.electrical.continuity`, `test.firmware.settings_review`, `test.firmware.version_compatibility`, `test.general.minimum_configuration`, `test.general.visual_inspection`, `test.management.bmc_recovery_state`, `test.management.event_log_freshness`, `test.memory.diagnostic`, `test.memory.known_good_substitution`, `test.memory.single_dimm_isolation`, `test.network.cable_substitution`, `test.network.dhcp_pool_audit`, `test.network.dhcp_transaction_trace`, `test.network.interface_config`, `test.network.link`, `test.network.link_counter_soak`, `test.network.ping`, `test.pcie.inventory`, `test.power.distribution_path_isolation`, `test.power.known_good_psu`, `test.power.output_voltage_measurement`, `test.power.psu_status`, `test.power.residual_power_drain`, `test.storage.bay_path_isolation`, `test.storage.device_inventory`, `test.storage.drive_health`, `test.storage.predictive_health`, `test.storage.raid_status`, `test.system.bmc_logs`, `test.system.controlled_stress`, `test.thermal.fan_telemetry`, `test.thermal.temperature_monitoring`
- Relevant diagnostics (2): `test.firmware.version_compatibility`, `test.management.bmc_recovery_state`
- Required diagnostics (1): `test.management.bmc_recovery_state`
- Optional diagnostics (1): `test.firmware.version_compatibility`
- Repair: `repair.management.recover_bmc_firmware`
- Verify: `verify.management.bmc_functional`
- Response counts: `card.response.repair.management.recover_bmc_firmware` × 1; `card.response.verify.management.bmc_functional` × 1
- Deck pressure: `deck.story.expansion_response_v1`, 30 Cards; Repair headroom 2; Verify headroom 1; feasible **yes**.
- Commands — catalog exposure (13): `command.ipmi.sel_elist`, `command.linux.dhclient`, `command.linux.dmesg`, `command.linux.ethtool`, `command.linux.free_h`, `command.linux.ip_addr`, `command.linux.ip_route`, `command.linux.journalctl`, `command.linux.lsblk`, `command.linux.lspci`, `command.linux.nvme_smart_log`, `command.linux.smartctl`, `command.network.ping`
- Commands — useful/relevant Evidence (0): none
- Commands — required Isolation (0): none
- Seed / requested Tickets: `story.quiet_cascade.expansion.s12.v1` / 1
- Checkpoints: entry `checkpoint.qc02.shift12.entry`; pre-Match `checkpoint.qc02.shift12.pre_match`; post-Match `checkpoint.qc02.shift12.post_match`
- Result branches: `story.qc02.shift12.success` or `story.qc02.shift12.abandon`, reconverging at `story.qc02.shift12.follow_on`
- Branch inputs: no local cutscene choice plus only a valid normalized `completion` of `COMPLETED` or `ABANDONED`; hidden truth and dialogue assertions are excluded.
- Story Service Points: completed valid result +2; abandoned valid result +0; preserve inherited campaign-one total; no cumulative gate.
- Interruption/replay: fresh launch from pre-Match after interruption; accepted completed episodes are isolated non-canonical review/practice under STORY-009 A.
- Research Document stage: present in the qualifying source reduction.

### Public setup

A management controller is nonresponsive after an interrupted firmware operation; a recoverable controller state and a version-set problem remain distinct public Candidates.

Match-safe projection: A failed controller firmware update leaves the management controller unavailable while the board requires a bounded recovery decision.

### Intentional repeated practice

- Expansion Shift 10: read-only inspection must precede the state-changing Repair it may justify.
- Campaign Shift 6: independent Verify and Documentation preserve a bounded handoff after risky work.

### Ordered beats

| Kind | Beat ID | Structural intent |
| --- | --- | --- |
| PUBLIC_SETUP | `story.beat.qc02.12.public_setup` | Sora and Jonah frame a nonresponsive BMC after interrupted firmware work without declaring recovery state or selecting a procedure. |
| LEARNING | `story.beat.qc02.12.learning` | The player must preserve the Test-versus-Repair boundary and independently verify the recovered management function. |
| REPEATED_PRACTICE | `story.beat.qc02.12.practice` | Repeat preserve-before-change discipline, then carry the accepted result and its bounds into a documented Story handoff. |
| CHECKPOINT | `story.beat.qc02.12.checkpoint` | Persist entry and pre-Match boundaries before the one-Ticket handoff. |
| MATCH | `story.beat.qc02.12.match` | Launch the ordinary generated BMC-recovery Ticket; no transport utility is promoted into a diagnostic Command. |
| OUTCOME_BRANCH | `story.beat.qc02.12.branch` | Hana receives an independently verified recovery or keeps the unsafe/unresolved state bounded; a following Story handoff may document only the accepted result and its limits. |
| SERVICE_POINT | `story.beat.qc02.12.points` | Add the authoritative final one-Ticket gain without retroactively grading campaign-one totals. |
| INTERRUPTION | `story.beat.qc02.12.interruption` | An interrupted active Match returns to pre-Match and cannot claim that a flash or recovery session resumed. |
| FOLLOW_ON | `story.beat.qc02.12.follow_on` | End at a single current-content checkpoint with the six explanations preserved for later scripting, audit, and release work. |

### Art reuse

- Backgrounds: `story.bg.trinity.trace.night`, `story.bg.trinity.validation_gate.predawn`
- Character poses: `story.character.sora_chen:focused`, `story.character.sora_chen:approving`, `story.character.jonah_reed:thoughtful`, `story.character.hana_park:skeptical`, `story.character.hana_park:relief`
- Transient inserts/new masters: none.
