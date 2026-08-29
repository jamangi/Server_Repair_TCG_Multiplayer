# Campaign One domain coverage

This report is generated from the pinned Quiet Cascade characterization-v2 Story pack, exact Builder snapshots, canonical domain packs, and the solvability oracle. It measures teaching roles without treating global visibility, public relevance, distractors, or technical dependencies as actual practice. The JSON companion is authoritative for complete IDs and role locations.

## Version pins

- Story: `story.campaign.quiet_cascade.v1` / `quiet-cascade-characterization-v2`
- Rules / Builder: `first-version-v2` / `ticket-builder-v3`
- Ticket / domain: `core-ticket-parts-v3` / `core-domain-snapshot-technical-copy-v3`
- Cards / decks / parts: `core-card-catalog-technical-copy-v4` / `core-response-decks-v4` / `ticket-parts-v1`
- Playable coverage: `playable-coverage-v4`
- Case-study baseline: `0.1` at `7b8c88cd64930fc6d79e4b24307431a3759aadd9`

## Denominators

| Denominator | Count |
| --- | ---: |
| Complete domain inventory | 257 |
| Action-bearing inventory | 107 |
| Playable action inventory | 71 |
| Global Bench diagnostics | 50 |
| Supported fingerprints | 12 |
| Campaign-one Matches | 6 |
| Generated Tickets / required paths | 12 |
| Authored Isolation routes | 16 |

The complete domain contains 13 command, 25 component, 42 fault, 17 fault_causal_edge, 20 protocol, 35 repair_procedure, 33 symptom, 37 test, 13 tool, 22 validation_procedure. The 107 action-bearing records are 37 Tests, 13 Commands, 35 Repairs, and 22 Validations. Play promotes all 50 diagnostics but only 12 Repairs and 9 Validations.

## Coverage-role boundary

- **Global catalog** means present, not taught.
- **Public-graph relevant** is an advisory relationship path, not proof that a diagnostic helps.
- **Target-legal** means the generated Ticket contains an authored Evidence outcome for that diagnostic.
- **Candidate-changing** is derived from actual authored outcomes with Candidate effects, not from the narrower fingerprint plan declaration.
- **Declared fingerprint-plan source** is one of 20 authoring-index sources; it is reported separately from the 30 outcome-derived Candidate-changing diagnostics.
- **Isolation route source** means at least one valid route cites it.
- **Minimal witness** is the deterministic complete route returned by the solvability oracle.
- **Closure-required** covers Repair and current post-Repair Verify. Explicit Document Live remains optional; publishing closure records the accepted bundle.

## Shift 1

- Story Match: `story.match.qc01.shift01.wrong_device`
- Automated proof Match: `task-027-quiet-cascade-v1.story-qc01-shift-01.seed-story.quiet_cascade.s01.v1`
- Seed: `story.quiet_cascade.s01.v1`
- Tickets: 1

Narrative/training ledger:

- `text.qc01.match.shift01.setup` — MATCH_SETUP_SYMPTOM: `symptom.boot.wrong_device`
- `text.qc01.ch01.shift01.02` — LIFECYCLE_TRAINING: `HYPOTHESIZE`, `TEST`, `EVIDENCE`
- `text.qc01.v2.context.lifecycle.01` — LIFECYCLE_TRAINING: `TICKET`, `HYPOTHESIZE`, `TEST`, `EVIDENCE`
- `text.qc01.v2.context.lifecycle.02` — LIFECYCLE_TRAINING: `ISOLATE`, `REPAIR`, `VERIFY`, `DOCUMENT`

### Booting the Wrong Device

- Ticket / fingerprint: `ticket.generated.ef8a4924e707349bce5c2be7` / `fingerprint.boot.incorrect_order`
- Snapshot digest: `821769a6021482074d523c723dc08a6b9bd2885820eabe11a9011b199fc6dacb`
- Public Symptom(s): `symptom.boot.wrong_device`
- Public Candidate Faults: `fault.boot.order.incorrect`, `fault.firmware.config.reset`
- Server-only truth: `fault.boot.order.incorrect` (actionable, required to repair)
- Target-legal diagnostics: `command.linux.dmesg`, `command.linux.ethtool`, `command.linux.free_h`, `command.linux.ip_addr`, `command.linux.ip_route`, `command.linux.journalctl`, `command.linux.lsblk`, `command.linux.lspci`, `command.linux.smartctl`, `command.network.ping`, `test.boot.device_inventory`, `test.boot.post_code_analysis`, `test.boot.post_observation`, `test.electrical.continuity`, `test.firmware.settings_review`, `test.general.minimum_configuration`, `test.general.visual_inspection`, `test.memory.diagnostic`, `test.memory.known_good_substitution`, `test.memory.single_dimm_isolation`, `test.network.cable_substitution`, `test.network.dhcp_pool_audit`, `test.network.interface_config`, `test.network.link`, `test.network.ping`, `test.pcie.inventory`, `test.power.known_good_psu`, `test.power.psu_status`, `test.storage.device_inventory`, `test.storage.drive_health`, `test.storage.raid_status`, `test.system.bmc_logs`, `test.system.controlled_stress`, `test.thermal.fan_telemetry`, `test.thermal.temperature_monitoring`
- Candidate-changing authored diagnostics: `test.boot.device_inventory`, `test.firmware.settings_review`
- Declared fingerprint-plan sources: `test.boot.device_inventory`, `test.firmware.settings_review`
- Authored Isolation routes:
  - `route.fingerprint.boot.incorrect.order.01` — CORROBORATED_SUPPORT, minimum 2: `test.firmware.settings_review`, `test.boot.device_inventory`
- Optional Candidate-changing sources outside Isolation: None
- Alternate-route sources outside the minimal witness: None
- Required Repair(s): `repair.boot.correct_order`
- Required Verify(s): `verify.boot.normal_boot`
- Public Candidate Components: `component.board.rtc_battery`
- True affected Components: None
- Minimal-route Tools: None
- Minimal-route technical Command dependencies: None
- Minimal-route Protocols: None
- All authored-route Tools: None
- All authored-route technical Command dependencies: None
- All authored-route Protocols: None
- Oracle minimal route: `test.firmware.settings_review` → `test.boot.device_inventory` → Isolate `fault_instance.boot.order` → `repair.boot.correct_order` → `verify.boot.normal_boot`
- Training objective: Separate boot selection from device detection and media state.

## Shift 2

- Story Match: `story.match.qc01.shift02.power_lot`
- Automated proof Match: `task-027-quiet-cascade-v1.story-qc01-shift-02.seed-story.quiet_cascade.s02.v1`
- Seed: `story.quiet_cascade.s02.v1`
- Tickets: 2

Narrative/training ledger:

- `text.qc01.match.shift02.setup` — MATCH_SETUP_SYMPTOM: `symptom.power.redundancy_warning`
- `text.qc01.ch01.shift02.02` — LIFECYCLE_TRAINING: `EVIDENCE`, `ISOLATE`, `REPAIR`, `VERIFY`
- `text.qc01.ch01.shift02.success.02` — OUTCOME_INTERPRETATION: `SYMPTOM_IS_NOT_DIAGNOSIS`

### Redundancy Path Unavailable

- Ticket / fingerprint: `ticket.generated.a10b8767580c9453c679a326` / `fingerprint.power.unseated_psu`
- Snapshot digest: `c55b2fb6c7aee2644929ecdd803b3b3f5155b5ec4426b43e4953d0082391e0f7`
- Public Symptom(s): `symptom.power.redundancy_warning`
- Public Candidate Faults: `fault.power.input.cable_loose`, `fault.power.psu.failed`, `fault.power.psu.not_seated`
- Server-only truth: `fault.power.psu.not_seated` (actionable, required to repair)
- Target-legal diagnostics: `command.linux.dmesg`, `command.linux.ethtool`, `command.linux.free_h`, `command.linux.ip_addr`, `command.linux.ip_route`, `command.linux.journalctl`, `command.linux.lsblk`, `command.linux.lspci`, `command.linux.smartctl`, `command.network.ping`, `test.boot.device_inventory`, `test.boot.post_code_analysis`, `test.boot.post_observation`, `test.electrical.continuity`, `test.firmware.settings_review`, `test.general.minimum_configuration`, `test.general.visual_inspection`, `test.memory.diagnostic`, `test.memory.known_good_substitution`, `test.memory.single_dimm_isolation`, `test.network.cable_substitution`, `test.network.dhcp_pool_audit`, `test.network.interface_config`, `test.network.link`, `test.network.ping`, `test.pcie.inventory`, `test.power.distribution_path_isolation`, `test.power.known_good_psu`, `test.power.output_voltage_measurement`, `test.power.psu_status`, `test.power.residual_power_drain`, `test.storage.device_inventory`, `test.storage.drive_health`, `test.storage.raid_status`, `test.system.bmc_logs`, `test.system.controlled_stress`, `test.thermal.fan_telemetry`, `test.thermal.temperature_monitoring`
- Candidate-changing authored diagnostics: `test.general.visual_inspection`, `test.power.distribution_path_isolation`, `test.power.known_good_psu`, `test.power.output_voltage_measurement`, `test.power.psu_status`, `test.power.residual_power_drain`, `test.system.bmc_logs`
- Declared fingerprint-plan sources: `test.general.visual_inspection`, `test.power.psu_status`
- Authored Isolation routes:
  - `route.fingerprint.power.unseated.psu.01` — CORROBORATED_SUPPORT, minimum 2: `test.general.visual_inspection`, `test.power.psu_status`
- Optional Candidate-changing sources outside Isolation: `test.power.distribution_path_isolation`, `test.power.known_good_psu`, `test.power.output_voltage_measurement`, `test.power.residual_power_drain`, `test.system.bmc_logs`
- Alternate-route sources outside the minimal witness: None
- Required Repair(s): `repair.power.reseat_psu`
- Required Verify(s): `verify.power.stable`
- Public Candidate Components: `component.power.hot_swap_psu`, `component.power.input_cable`
- True affected Components: `component.power.hot_swap_psu`
- Minimal-route Tools: None
- Minimal-route technical Command dependencies: None
- Minimal-route Protocols: None
- All authored-route Tools: None
- All authored-route technical Command dependencies: None
- All authored-route Protocols: None
- Oracle minimal route: `test.general.visual_inspection` → `test.power.psu_status` → Isolate `fault_instance.power.unseated_psu` → `repair.power.reseat_psu` → `verify.power.stable`
- Training objective: Distinguish a connection state from a failed supply.

### Supply Redundancy Lost

- Ticket / fingerprint: `ticket.generated.8ee2c08bae1e3d005b35bff5` / `fingerprint.power.failed_psu`
- Snapshot digest: `8c7810616e535b8f62d3303e501bfcfdf8c9071df23903e2727b6fcb476e0d4b`
- Public Symptom(s): `symptom.power.redundancy_warning`
- Public Candidate Faults: `fault.power.input.cable_loose`, `fault.power.psu.failed`, `fault.power.psu.not_seated`
- Server-only truth: `fault.power.psu.failed` (actionable, required to repair)
- Target-legal diagnostics: `command.linux.dmesg`, `command.linux.ethtool`, `command.linux.free_h`, `command.linux.ip_addr`, `command.linux.ip_route`, `command.linux.journalctl`, `command.linux.lsblk`, `command.linux.lspci`, `command.linux.smartctl`, `command.network.ping`, `test.boot.device_inventory`, `test.boot.post_code_analysis`, `test.boot.post_observation`, `test.electrical.continuity`, `test.firmware.settings_review`, `test.general.minimum_configuration`, `test.general.visual_inspection`, `test.memory.diagnostic`, `test.memory.known_good_substitution`, `test.memory.single_dimm_isolation`, `test.network.cable_substitution`, `test.network.dhcp_pool_audit`, `test.network.interface_config`, `test.network.link`, `test.network.ping`, `test.pcie.inventory`, `test.power.distribution_path_isolation`, `test.power.known_good_psu`, `test.power.output_voltage_measurement`, `test.power.psu_status`, `test.power.residual_power_drain`, `test.storage.device_inventory`, `test.storage.drive_health`, `test.storage.raid_status`, `test.system.bmc_logs`, `test.system.controlled_stress`, `test.thermal.fan_telemetry`, `test.thermal.temperature_monitoring`
- Candidate-changing authored diagnostics: `test.general.visual_inspection`, `test.power.known_good_psu`, `test.power.output_voltage_measurement`, `test.power.psu_status`
- Declared fingerprint-plan sources: `test.power.known_good_psu`, `test.power.output_voltage_measurement`, `test.power.psu_status`
- Authored Isolation routes:
  - `route.fingerprint.power.failed.psu.01` — DEFINITIVE_DIAGNOSTIC, minimum 1: `test.power.known_good_psu`
  - `route.fingerprint.power.failed.psu.02` — CORROBORATED_SUPPORT, minimum 2: `test.power.psu_status`, `test.power.output_voltage_measurement`
- Optional Candidate-changing sources outside Isolation: `test.general.visual_inspection`
- Alternate-route sources outside the minimal witness: `test.power.output_voltage_measurement`, `test.power.psu_status`
- Required Repair(s): `repair.power.replace_psu`
- Required Verify(s): `verify.power.stable`
- Public Candidate Components: `component.power.hot_swap_psu`, `component.power.input_cable`
- True affected Components: `component.power.hot_swap_psu`
- Minimal-route Tools: `tool.known_good.psu`
- Minimal-route technical Command dependencies: None
- Minimal-route Protocols: None
- All authored-route Tools: `tool.electrical.multimeter`, `tool.known_good.psu`
- All authored-route technical Command dependencies: None
- All authored-route Protocols: None
- Oracle minimal route: `test.power.known_good_psu` → Isolate `fault_instance.power.failed_psu` → `repair.power.replace_psu` → `verify.power.stable`
- Training objective: Distinguish a connection state from a failed supply.

## Shift 3

- Story Match: `story.match.qc01.shift03.memory_compare`
- Automated proof Match: `task-027-quiet-cascade-v1.story-qc01-shift-03.seed-story.quiet_cascade.s03.v1`
- Seed: `story.quiet_cascade.s03.v1`
- Tickets: 2

Narrative/training ledger:

- `text.qc01.match.shift03.setup` — MATCH_SETUP_SYMPTOM: `symptom.system.intermittent_crash`, `symptom.boot.memory_warning`
- `text.qc01.ch02.shift03.02` — LIFECYCLE_TRAINING: `EVIDENCE`, `REPAIR`, `VERIFY`

### Intermittent Memory Crash

- Ticket / fingerprint: `ticket.generated.75ea6ec9e60d64c7cac4caa5` / `fingerprint.memory.failed_dimm`
- Snapshot digest: `1bd3ccabc476313a0420cb9889ab5e7b84c60c250aa32f3d4f009f614f2c47e5`
- Public Symptom(s): `symptom.system.intermittent_crash`
- Public Candidate Faults: `fault.memory.dimm.failed`, `fault.system.intermittent_memory_instability`
- Server-only truth: `fault.memory.dimm.failed` (actionable, required to repair); `fault.system.intermittent_memory_instability` (terminal)
- Target-legal diagnostics: `command.linux.dmesg`, `command.linux.ethtool`, `command.linux.free_h`, `command.linux.ip_addr`, `command.linux.ip_route`, `command.linux.journalctl`, `command.linux.lsblk`, `command.linux.lspci`, `command.linux.smartctl`, `command.network.ping`, `test.boot.device_inventory`, `test.boot.post_code_analysis`, `test.boot.post_observation`, `test.electrical.continuity`, `test.firmware.settings_review`, `test.general.minimum_configuration`, `test.general.visual_inspection`, `test.memory.diagnostic`, `test.memory.known_good_substitution`, `test.memory.single_dimm_isolation`, `test.network.cable_substitution`, `test.network.dhcp_pool_audit`, `test.network.interface_config`, `test.network.link`, `test.network.ping`, `test.pcie.inventory`, `test.power.known_good_psu`, `test.power.psu_status`, `test.storage.device_inventory`, `test.storage.drive_health`, `test.storage.raid_status`, `test.system.bmc_logs`, `test.system.controlled_stress`, `test.thermal.fan_telemetry`, `test.thermal.temperature_monitoring`
- Candidate-changing authored diagnostics: `test.memory.diagnostic`, `test.memory.single_dimm_isolation`, `test.system.bmc_logs`
- Declared fingerprint-plan sources: `test.memory.diagnostic`, `test.memory.single_dimm_isolation`, `test.system.bmc_logs`
- Authored Isolation routes:
  - `route.fingerprint.memory.failed.dimm.01` — DEFINITIVE_DIAGNOSTIC, minimum 1: `test.memory.diagnostic`
  - `route.fingerprint.memory.failed.dimm.02` — CORROBORATED_SUPPORT, minimum 2: `test.memory.single_dimm_isolation`, `test.system.bmc_logs`
- Optional Candidate-changing sources outside Isolation: None
- Alternate-route sources outside the minimal witness: `test.memory.single_dimm_isolation`, `test.system.bmc_logs`
- Required Repair(s): `repair.memory.replace_dimm`
- Required Verify(s): `verify.memory.full_test`
- Public Candidate Components: `component.memory.ecc_dimm`
- True affected Components: `component.memory.ecc_dimm`
- Minimal-route Tools: None
- Minimal-route technical Command dependencies: None
- Minimal-route Protocols: `protocol.safety.esd`
- All authored-route Tools: `tool.management.bmc_console`
- All authored-route technical Command dependencies: None
- All authored-route Protocols: `protocol.safety.esd`
- Oracle minimal route: `test.memory.diagnostic` → Isolate `fault_instance.memory.failed_dimm` → `repair.memory.replace_dimm` → `verify.memory.full_test`
- Training objective: Distinguish seating and population evidence from a failed DIMM.

### Memory Capacity Missing

- Ticket / fingerprint: `ticket.generated.424c8fab1db6aed25058ab78` / `fingerprint.memory.unseated_dimm`
- Snapshot digest: `268c91a53ad795437e6690b2a5cc843071eea627671f2168b7a0dca00941a9c7`
- Public Symptom(s): `symptom.boot.memory_warning`
- Public Candidate Faults: `fault.memory.channel.unavailable`, `fault.memory.dimm.not_seated`, `fault.memory.population.invalid`
- Server-only truth: `fault.memory.dimm.not_seated` (actionable, required to repair); `fault.memory.channel.unavailable` (terminal)
- Target-legal diagnostics: `command.linux.dmesg`, `command.linux.ethtool`, `command.linux.free_h`, `command.linux.ip_addr`, `command.linux.ip_route`, `command.linux.journalctl`, `command.linux.lsblk`, `command.linux.lspci`, `command.linux.smartctl`, `command.network.ping`, `test.boot.device_inventory`, `test.boot.post_code_analysis`, `test.boot.post_observation`, `test.electrical.continuity`, `test.firmware.settings_review`, `test.firmware.version_compatibility`, `test.general.minimum_configuration`, `test.general.visual_inspection`, `test.memory.diagnostic`, `test.memory.known_good_substitution`, `test.memory.single_dimm_isolation`, `test.network.cable_substitution`, `test.network.dhcp_pool_audit`, `test.network.interface_config`, `test.network.link`, `test.network.ping`, `test.pcie.inventory`, `test.power.known_good_psu`, `test.power.psu_status`, `test.power.residual_power_drain`, `test.storage.device_inventory`, `test.storage.drive_health`, `test.storage.raid_status`, `test.system.bmc_logs`, `test.system.controlled_stress`, `test.thermal.fan_telemetry`, `test.thermal.temperature_monitoring`
- Candidate-changing authored diagnostics: `test.general.visual_inspection`, `test.memory.single_dimm_isolation`
- Declared fingerprint-plan sources: `test.general.visual_inspection`, `test.memory.single_dimm_isolation`
- Authored Isolation routes:
  - `route.fingerprint.memory.unseated.dimm.01` — DEFINITIVE_DIAGNOSTIC, minimum 1: `test.memory.single_dimm_isolation`
- Optional Candidate-changing sources outside Isolation: `test.general.visual_inspection`
- Alternate-route sources outside the minimal witness: None
- Required Repair(s): `repair.memory.reseat_dimm`
- Required Verify(s): `verify.memory.full_test`, `verify.memory.inventory`
- Public Candidate Components: `component.board.system`, `component.compute.cpu`, `component.memory.channel`, `component.memory.ecc_dimm`
- True affected Components: `component.board.system`, `component.compute.cpu`, `component.memory.channel`, `component.memory.ecc_dimm`
- Minimal-route Tools: None
- Minimal-route technical Command dependencies: None
- Minimal-route Protocols: `protocol.safety.esd`
- All authored-route Tools: None
- All authored-route technical Command dependencies: None
- All authored-route Protocols: `protocol.safety.esd`
- Oracle minimal route: `test.memory.single_dimm_isolation` → Isolate `fault_instance.memory.dimm` → `repair.memory.reseat_dimm` → `verify.memory.inventory` → `verify.memory.full_test`
- Training objective: Distinguish seating and population evidence from a failed DIMM.

## Shift 4

- Story Match: `story.match.qc01.shift04.passes_cold`
- Automated proof Match: `task-027-quiet-cascade-v1.story-qc01-shift-04.seed-story.quiet_cascade.s04.v1`
- Seed: `story.quiet_cascade.s04.v1`
- Tickets: 2

Narrative/training ledger:

- `text.qc01.match.shift04.setup` — MATCH_SETUP_SYMPTOM: `symptom.thermal.high_cpu_temp`
- `text.qc01.ch02.shift04.02` — LIFECYCLE_TRAINING: `HYPOTHESIZE`, `EVIDENCE`, `REPAIR`

### Cooling Path Restricted

- Ticket / fingerprint: `ticket.generated.6e55cf55154d356da2e91126` / `fingerprint.thermal.clogged_heatsink`
- Snapshot digest: `ce86a008060199c2f5c5cb2ed763385e8766315e35a2ce1b9b3e19fa39627a95`
- Public Symptom(s): `symptom.thermal.high_cpu_temp`
- Public Candidate Faults: `fault.thermal.cpu.overheating`, `fault.thermal.fan.failed`, `fault.thermal.heatsink.clogged`, `fault.thermal.heatsink.contact_poor`
- Server-only truth: `fault.thermal.heatsink.clogged` (actionable, required to repair); `fault.thermal.cpu.overheating` (terminal)
- Target-legal diagnostics: `command.linux.dmesg`, `command.linux.ethtool`, `command.linux.free_h`, `command.linux.ip_addr`, `command.linux.ip_route`, `command.linux.journalctl`, `command.linux.lsblk`, `command.linux.lspci`, `command.linux.smartctl`, `command.network.ping`, `test.boot.device_inventory`, `test.boot.post_code_analysis`, `test.boot.post_observation`, `test.electrical.continuity`, `test.firmware.settings_review`, `test.general.minimum_configuration`, `test.general.visual_inspection`, `test.memory.diagnostic`, `test.memory.known_good_substitution`, `test.memory.single_dimm_isolation`, `test.network.cable_substitution`, `test.network.dhcp_pool_audit`, `test.network.interface_config`, `test.network.link`, `test.network.ping`, `test.pcie.inventory`, `test.power.known_good_psu`, `test.power.psu_status`, `test.storage.device_inventory`, `test.storage.drive_health`, `test.storage.raid_status`, `test.system.bmc_logs`, `test.system.controlled_stress`, `test.thermal.fan_telemetry`, `test.thermal.temperature_monitoring`
- Candidate-changing authored diagnostics: `test.general.visual_inspection`, `test.thermal.fan_telemetry`, `test.thermal.temperature_monitoring`
- Declared fingerprint-plan sources: `test.general.visual_inspection`, `test.thermal.temperature_monitoring`
- Authored Isolation routes:
  - `route.fingerprint.thermal.clogged.heatsink.01` — DEFINITIVE_DIAGNOSTIC, minimum 1: `test.thermal.temperature_monitoring`
- Optional Candidate-changing sources outside Isolation: `test.general.visual_inspection`, `test.thermal.fan_telemetry`
- Alternate-route sources outside the minimal witness: None
- Required Repair(s): `repair.thermal.clean_cooling_path`
- Required Verify(s): `verify.thermal.load_test`
- Public Candidate Components: `component.compute.cpu`, `component.cooling.cpu_heatsink`, `component.cooling.fan`, `component.cooling.tim`
- True affected Components: `component.compute.cpu`, `component.cooling.cpu_heatsink`
- Minimal-route Tools: `tool.management.bmc_console`
- Minimal-route technical Command dependencies: None
- Minimal-route Protocols: None
- All authored-route Tools: `tool.management.bmc_console`
- All authored-route technical Command dependencies: None
- All authored-route Protocols: None
- Oracle minimal route: `test.thermal.temperature_monitoring` → Isolate `fault_instance.thermal.heatsink` → `repair.thermal.clean_cooling_path` → `verify.thermal.load_test`
- Training objective: Use telemetry and physical evidence to isolate the cooling path.

### Temperature Rising

- Ticket / fingerprint: `ticket.generated.f60b9ce132c74c33f607df6d` / `fingerprint.thermal.failed_fan`
- Snapshot digest: `b8f877726a0d4356575d9efeb51c8226c674687ba0806ba067142ffc3f90c8cd`
- Public Symptom(s): `symptom.thermal.high_cpu_temp`
- Public Candidate Faults: `fault.thermal.cpu.overheating`, `fault.thermal.fan.failed`, `fault.thermal.heatsink.clogged`, `fault.thermal.heatsink.contact_poor`
- Server-only truth: `fault.thermal.fan.failed` (actionable, required to repair); `fault.thermal.cpu.overheating` (terminal)
- Target-legal diagnostics: `command.linux.dmesg`, `command.linux.ethtool`, `command.linux.free_h`, `command.linux.ip_addr`, `command.linux.ip_route`, `command.linux.journalctl`, `command.linux.lsblk`, `command.linux.lspci`, `command.linux.smartctl`, `command.network.ping`, `test.boot.device_inventory`, `test.boot.post_code_analysis`, `test.boot.post_observation`, `test.cooling.location_cross_substitution`, `test.electrical.continuity`, `test.firmware.settings_review`, `test.general.minimum_configuration`, `test.general.visual_inspection`, `test.memory.diagnostic`, `test.memory.known_good_substitution`, `test.memory.single_dimm_isolation`, `test.network.cable_substitution`, `test.network.dhcp_pool_audit`, `test.network.interface_config`, `test.network.link`, `test.network.ping`, `test.pcie.inventory`, `test.power.known_good_psu`, `test.power.psu_status`, `test.storage.device_inventory`, `test.storage.drive_health`, `test.storage.raid_status`, `test.system.bmc_logs`, `test.system.controlled_stress`, `test.thermal.fan_telemetry`, `test.thermal.temperature_monitoring`
- Candidate-changing authored diagnostics: `test.cooling.location_cross_substitution`, `test.general.visual_inspection`, `test.thermal.fan_telemetry`, `test.thermal.temperature_monitoring`
- Declared fingerprint-plan sources: `test.cooling.location_cross_substitution`, `test.thermal.fan_telemetry`
- Authored Isolation routes:
  - `route.fingerprint.thermal.failed.fan.01` — DEFINITIVE_DIAGNOSTIC, minimum 1: `test.thermal.fan_telemetry`
  - `route.fingerprint.thermal.failed.fan.02` — DEFINITIVE_DIAGNOSTIC, minimum 1: `test.cooling.location_cross_substitution`
- Optional Candidate-changing sources outside Isolation: `test.general.visual_inspection`, `test.thermal.temperature_monitoring`
- Alternate-route sources outside the minimal witness: `test.cooling.location_cross_substitution`
- Required Repair(s): `repair.thermal.replace_fan`
- Required Verify(s): `verify.thermal.load_test`
- Public Candidate Components: `component.compute.cpu`, `component.cooling.cpu_heatsink`, `component.cooling.fan`, `component.cooling.tim`
- True affected Components: `component.compute.cpu`, `component.cooling.cpu_heatsink`, `component.cooling.fan`
- Minimal-route Tools: `tool.management.bmc_console`
- Minimal-route technical Command dependencies: None
- Minimal-route Protocols: None
- All authored-route Tools: `tool.hand.basic_set`, `tool.management.bmc_console`, `tool.safety.esd_strap`
- All authored-route technical Command dependencies: None
- All authored-route Protocols: None
- Oracle minimal route: `test.thermal.fan_telemetry` → Isolate `fault_instance.thermal.fan` → `repair.thermal.replace_fan` → `verify.thermal.load_test`
- Training objective: Use telemetry and physical evidence to isolate the cooling path.

## Shift 5

- Story Match: `story.match.qc01.shift05.no_offer`
- Automated proof Match: `task-027-quiet-cascade-v1.story-qc01-shift-05.seed-story.quiet_cascade.s05.v1`
- Seed: `story.quiet_cascade.s05.v1`
- Tickets: 2

Narrative/training ledger:

- `text.qc01.match.shift05.setup` — MATCH_SETUP_SYMPTOM: `symptom.network.no_connectivity`
- `text.qc01.ch03.shift05.02` — LIFECYCLE_TRAINING: `EVIDENCE`, `ISOLATE`

### Addressed but Unreachable

- Ticket / fingerprint: `ticket.generated.759fd75d6ac043a57d6673d7` / `fingerprint.network.incorrect_static_ip`
- Snapshot digest: `45f7e05c9d9a57f0e324c34d21dd1420d7c0f76ec0c4753b1494414a292697bd`
- Public Symptom(s): `symptom.network.no_connectivity`
- Public Candidate Faults: `fault.network.cable.disconnected`, `fault.network.cable.failed`, `fault.network.dhcp.no_lease`, `fault.network.ip.static_incorrect`, `fault.network.nic.failed`
- Server-only truth: `fault.network.ip.static_incorrect` (actionable, required to repair)
- Target-legal diagnostics: `command.linux.dmesg`, `command.linux.ethtool`, `command.linux.free_h`, `command.linux.ip_addr`, `command.linux.ip_route`, `command.linux.journalctl`, `command.linux.lsblk`, `command.linux.lspci`, `command.linux.smartctl`, `command.network.ping`, `test.boot.device_inventory`, `test.boot.post_code_analysis`, `test.boot.post_observation`, `test.electrical.continuity`, `test.firmware.settings_review`, `test.general.minimum_configuration`, `test.general.visual_inspection`, `test.memory.diagnostic`, `test.memory.known_good_substitution`, `test.memory.single_dimm_isolation`, `test.network.cable_substitution`, `test.network.dhcp_pool_audit`, `test.network.interface_config`, `test.network.link`, `test.network.ping`, `test.pcie.inventory`, `test.power.known_good_psu`, `test.power.psu_status`, `test.storage.device_inventory`, `test.storage.drive_health`, `test.storage.raid_status`, `test.system.bmc_logs`, `test.system.controlled_stress`, `test.thermal.fan_telemetry`, `test.thermal.temperature_monitoring`
- Candidate-changing authored diagnostics: `command.linux.ip_addr`, `command.linux.ip_route`, `command.linux.lspci`, `command.network.ping`, `test.general.visual_inspection`, `test.network.cable_substitution`, `test.network.dhcp_pool_audit`, `test.network.interface_config`, `test.network.link`, `test.network.ping`, `test.pcie.inventory`
- Declared fingerprint-plan sources: `test.network.interface_config`, `test.network.ping`
- Authored Isolation routes:
  - `route.fingerprint.network.incorrect.static.ip.01` — DEFINITIVE_DIAGNOSTIC, minimum 1: `test.network.interface_config`
- Optional Candidate-changing sources outside Isolation: `command.linux.ip_addr`, `command.linux.ip_route`, `command.linux.lspci`, `command.network.ping`, `test.general.visual_inspection`, `test.network.cable_substitution`, `test.network.dhcp_pool_audit`, `test.network.link`, `test.network.ping`, `test.pcie.inventory`
- Alternate-route sources outside the minimal witness: None
- Required Repair(s): `repair.network.correct_static_ip`
- Required Verify(s): `verify.network.connectivity`
- Public Candidate Components: `component.network.ethernet_cable`, `component.network.nic`
- True affected Components: None
- Minimal-route Tools: None
- Minimal-route technical Command dependencies: `command.linux.ip_addr`, `command.linux.ip_route`
- Minimal-route Protocols: None
- All authored-route Tools: None
- All authored-route technical Command dependencies: `command.linux.ip_addr`, `command.linux.ip_route`
- All authored-route Protocols: None
- Oracle minimal route: `test.network.interface_config` → Isolate `fault_instance.network.static_ip` → `repair.network.correct_static_ip` → `verify.network.connectivity`
- Training objective: Separate physical link evidence from address configuration.

### Network Path Down

- Ticket / fingerprint: `ticket.generated.cbc8003979ffdaca83b41d7d` / `fingerprint.network.failed_cable`
- Snapshot digest: `4de1801512399068fea5881be79955af674ae35eff511d7a1d75101d6c0085d2`
- Public Symptom(s): `symptom.network.no_connectivity`
- Public Candidate Faults: `fault.network.cable.disconnected`, `fault.network.cable.failed`, `fault.network.dhcp.no_lease`, `fault.network.ip.static_incorrect`, `fault.network.nic.failed`
- Server-only truth: `fault.network.cable.failed` (actionable, required to repair); `fault.network.dhcp.no_lease` (terminal)
- Target-legal diagnostics: `command.linux.dmesg`, `command.linux.ethtool`, `command.linux.free_h`, `command.linux.ip_addr`, `command.linux.ip_route`, `command.linux.journalctl`, `command.linux.lsblk`, `command.linux.lspci`, `command.linux.smartctl`, `command.network.ping`, `test.boot.device_inventory`, `test.boot.post_code_analysis`, `test.boot.post_observation`, `test.electrical.continuity`, `test.firmware.settings_review`, `test.general.minimum_configuration`, `test.general.visual_inspection`, `test.memory.diagnostic`, `test.memory.known_good_substitution`, `test.memory.single_dimm_isolation`, `test.network.cable_substitution`, `test.network.dhcp_pool_audit`, `test.network.interface_config`, `test.network.link`, `test.network.ping`, `test.pcie.inventory`, `test.power.known_good_psu`, `test.power.psu_status`, `test.storage.device_inventory`, `test.storage.drive_health`, `test.storage.raid_status`, `test.system.bmc_logs`, `test.system.controlled_stress`, `test.thermal.fan_telemetry`, `test.thermal.temperature_monitoring`
- Candidate-changing authored diagnostics: `command.linux.ip_addr`, `command.linux.ip_route`, `command.linux.lspci`, `command.network.ping`, `test.general.visual_inspection`, `test.network.cable_substitution`, `test.network.interface_config`, `test.network.link`, `test.network.ping`, `test.pcie.inventory`
- Declared fingerprint-plan sources: `test.network.cable_substitution`, `test.network.link`
- Authored Isolation routes:
  - `route.fingerprint.network.failed.cable.01` — DEFINITIVE_DIAGNOSTIC, minimum 1: `test.network.cable_substitution`
- Optional Candidate-changing sources outside Isolation: `command.linux.ip_addr`, `command.linux.ip_route`, `command.linux.lspci`, `command.network.ping`, `test.general.visual_inspection`, `test.network.interface_config`, `test.network.link`, `test.network.ping`, `test.pcie.inventory`
- Alternate-route sources outside the minimal witness: None
- Required Repair(s): `repair.network.replace_cable`
- Required Verify(s): `verify.network.connectivity`, `verify.network.link`
- Public Candidate Components: `component.network.ethernet_cable`, `component.network.nic`
- True affected Components: `component.network.ethernet_cable`
- Minimal-route Tools: `tool.network.known_good_cable`
- Minimal-route technical Command dependencies: None
- Minimal-route Protocols: None
- All authored-route Tools: `tool.network.known_good_cable`
- All authored-route technical Command dependencies: None
- All authored-route Protocols: None
- Oracle minimal route: `test.network.cable_substitution` → Isolate `fault_instance.network.cable` → `repair.network.replace_cable` → `verify.network.link` → `verify.network.connectivity`
- Training objective: Separate physical link evidence from address configuration.

## Shift 6

- Story Match: `story.match.qc01.shift06.quiet_cascade`
- Automated proof Match: `task-027-quiet-cascade-v1.story-qc01-shift-06.seed-story.quiet_cascade.s06.v1`
- Seed: `story.quiet_cascade.s06.v1`
- Tickets: 3

Narrative/training ledger:

- `text.qc01.match.shift06.setup` — MATCH_SETUP_SYMPTOM: `symptom.boot.no_boot_device`, `symptom.storage.io_errors`, `symptom.storage.raid_degraded`
- `text.qc01.ch04.shift06.02` — LIFECYCLE_TRAINING: `ISOLATE`, `DOCUMENT`

### Boot Device Missing

- Ticket / fingerprint: `ticket.generated.3ec80b1b0e7221ac725aedf9` / `fingerprint.boot.missing_nvme`
- Snapshot digest: `1c74ad0725e500ac01d4c356f17551fee11678a88b35ca5b591ff056a2efdff2`
- Public Symptom(s): `symptom.boot.no_boot_device`
- Public Candidate Faults: `fault.boot.device.not_detected`, `fault.boot.order.incorrect`, `fault.storage.cable.loose`, `fault.storage.nvme.device_failed`, `fault.storage.raid.controller_failed`
- Server-only truth: `fault.storage.nvme.device_failed` (actionable, required to repair); `fault.boot.device.not_detected` (terminal)
- Target-legal diagnostics: `command.linux.dmesg`, `command.linux.ethtool`, `command.linux.free_h`, `command.linux.ip_addr`, `command.linux.ip_route`, `command.linux.journalctl`, `command.linux.lsblk`, `command.linux.lspci`, `command.linux.nvme_smart_log`, `command.linux.smartctl`, `command.network.ping`, `test.boot.device_inventory`, `test.boot.post_code_analysis`, `test.boot.post_observation`, `test.electrical.continuity`, `test.firmware.settings_review`, `test.general.minimum_configuration`, `test.general.visual_inspection`, `test.memory.diagnostic`, `test.memory.known_good_substitution`, `test.memory.single_dimm_isolation`, `test.network.cable_substitution`, `test.network.dhcp_pool_audit`, `test.network.interface_config`, `test.network.link`, `test.network.ping`, `test.pcie.inventory`, `test.power.known_good_psu`, `test.power.psu_status`, `test.storage.device_inventory`, `test.storage.drive_health`, `test.storage.predictive_health`, `test.storage.raid_status`, `test.system.bmc_logs`, `test.system.controlled_stress`, `test.thermal.fan_telemetry`, `test.thermal.temperature_monitoring`
- Candidate-changing authored diagnostics: `command.linux.lsblk`, `command.linux.lspci`, `test.boot.device_inventory`, `test.firmware.settings_review`, `test.general.minimum_configuration`, `test.general.visual_inspection`, `test.pcie.inventory`, `test.storage.device_inventory`, `test.system.bmc_logs`
- Declared fingerprint-plan sources: `test.boot.device_inventory`, `test.storage.device_inventory`, `test.system.bmc_logs`
- Authored Isolation routes:
  - `route.fingerprint.boot.missing.nvme.01` — DEFINITIVE_DIAGNOSTIC, minimum 1: `test.system.bmc_logs`
- Optional Candidate-changing sources outside Isolation: `command.linux.lsblk`, `command.linux.lspci`, `test.boot.device_inventory`, `test.firmware.settings_review`, `test.general.minimum_configuration`, `test.general.visual_inspection`, `test.pcie.inventory`, `test.storage.device_inventory`
- Alternate-route sources outside the minimal witness: None
- Required Repair(s): `repair.storage.replace_nvme`
- Required Verify(s): `verify.boot.normal_boot`, `verify.storage.device_detected`
- Public Candidate Components: `component.storage.data_cable`, `component.storage.nvme_ssd`, `component.storage.raid_controller`
- True affected Components: `component.storage.nvme_ssd`
- Minimal-route Tools: `tool.management.bmc_console`
- Minimal-route technical Command dependencies: None
- Minimal-route Protocols: None
- All authored-route Tools: `tool.management.bmc_console`
- All authored-route technical Command dependencies: None
- All authored-route Protocols: None
- Oracle minimal route: `test.system.bmc_logs` → Isolate `fault_instance.boot.nvme` → `repair.storage.replace_nvme` → `verify.storage.device_detected` → `verify.boot.normal_boot`
- Training objective: Separate boot selection from device detection and media state.

### One Member Down

- Ticket / fingerprint: `ticket.generated.45a70010dd4752f864990575` / `fingerprint.storage.failed_sas_member`
- Snapshot digest: `863ca5c0e0a72f9440e3352c80b070f4bde1ca166c801e79425821adfa7f4420`
- Public Symptom(s): `symptom.storage.raid_degraded`
- Public Candidate Faults: `fault.storage.raid.degraded`, `fault.storage.sas.drive_failed`, `fault.storage.sata.drive_failed`
- Server-only truth: `fault.storage.sas.drive_failed` (actionable, required to repair); `fault.storage.raid.degraded` (terminal)
- Target-legal diagnostics: `command.linux.dmesg`, `command.linux.ethtool`, `command.linux.free_h`, `command.linux.ip_addr`, `command.linux.ip_route`, `command.linux.journalctl`, `command.linux.lsblk`, `command.linux.lspci`, `command.linux.nvme_smart_log`, `command.linux.smartctl`, `command.network.ping`, `test.boot.device_inventory`, `test.boot.post_code_analysis`, `test.boot.post_observation`, `test.electrical.continuity`, `test.firmware.settings_review`, `test.firmware.version_compatibility`, `test.general.minimum_configuration`, `test.general.visual_inspection`, `test.memory.diagnostic`, `test.memory.known_good_substitution`, `test.memory.single_dimm_isolation`, `test.network.cable_substitution`, `test.network.dhcp_pool_audit`, `test.network.interface_config`, `test.network.link`, `test.network.ping`, `test.pcie.inventory`, `test.power.known_good_psu`, `test.power.psu_status`, `test.storage.bay_path_isolation`, `test.storage.device_inventory`, `test.storage.drive_health`, `test.storage.predictive_health`, `test.storage.raid_status`, `test.system.bmc_logs`, `test.system.controlled_stress`, `test.thermal.fan_telemetry`, `test.thermal.temperature_monitoring`
- Candidate-changing authored diagnostics: `command.linux.lsblk`, `command.linux.smartctl`, `test.storage.device_inventory`, `test.storage.drive_health`, `test.storage.raid_status`
- Declared fingerprint-plan sources: `command.linux.smartctl`, `test.storage.drive_health`, `test.storage.raid_status`
- Authored Isolation routes:
  - `route.fingerprint.storage.failed.sas.member.01` — DEFINITIVE_DIAGNOSTIC, minimum 1: `test.storage.drive_health`
  - `route.fingerprint.storage.failed.sas.member.02` — CORROBORATED_SUPPORT, minimum 2: `test.storage.raid_status`, `command.linux.smartctl`
- Optional Candidate-changing sources outside Isolation: `command.linux.lsblk`, `test.storage.device_inventory`
- Alternate-route sources outside the minimal witness: `command.linux.smartctl`, `test.storage.raid_status`
- Required Repair(s): `repair.storage.replace_raid_member`
- Required Verify(s): `verify.storage.raid_healthy`
- Public Candidate Components: `component.storage.raid_controller`, `component.storage.sas_hdd`, `component.storage.sata_ssd`
- True affected Components: `component.storage.raid_controller`, `component.storage.sas_hdd`
- Minimal-route Tools: None
- Minimal-route technical Command dependencies: `command.linux.smartctl`
- Minimal-route Protocols: None
- All authored-route Tools: `tool.storage.raid_console`
- All authored-route technical Command dependencies: `command.linux.smartctl`
- All authored-route Protocols: None
- Oracle minimal route: `test.storage.drive_health` → Isolate `fault_instance.storage.sas` → `repair.storage.replace_raid_member` → `verify.storage.raid_healthy`
- Training objective: Separate storage path, media, and array-state evidence.

### Intermittent Storage Path

- Ticket / fingerprint: `ticket.generated.5352abd871c2e9076be92a0b` / `fingerprint.storage.loose_cable`
- Snapshot digest: `b06dc5a7d12c29af78edd71f7a82a611d971844e6e71863e142bc293f4e6af27`
- Public Symptom(s): `symptom.storage.io_errors`
- Public Candidate Faults: `fault.storage.backplane.path_failed`, `fault.storage.cable.failed`, `fault.storage.cable.loose`, `fault.storage.nvme.device_failed`, `fault.storage.sas.drive_failed`
- Server-only truth: `fault.storage.cable.loose` (actionable, required to repair)
- Target-legal diagnostics: `command.linux.dmesg`, `command.linux.ethtool`, `command.linux.free_h`, `command.linux.ip_addr`, `command.linux.ip_route`, `command.linux.journalctl`, `command.linux.lsblk`, `command.linux.lspci`, `command.linux.smartctl`, `command.network.ping`, `test.boot.device_inventory`, `test.boot.post_code_analysis`, `test.boot.post_observation`, `test.electrical.continuity`, `test.firmware.settings_review`, `test.general.minimum_configuration`, `test.general.visual_inspection`, `test.memory.diagnostic`, `test.memory.known_good_substitution`, `test.memory.single_dimm_isolation`, `test.network.cable_substitution`, `test.network.dhcp_pool_audit`, `test.network.interface_config`, `test.network.link`, `test.network.ping`, `test.pcie.inventory`, `test.power.known_good_psu`, `test.power.psu_status`, `test.storage.device_inventory`, `test.storage.drive_health`, `test.storage.raid_status`, `test.system.bmc_logs`, `test.system.controlled_stress`, `test.thermal.fan_telemetry`, `test.thermal.temperature_monitoring`
- Candidate-changing authored diagnostics: `command.linux.lsblk`, `command.linux.smartctl`, `test.general.visual_inspection`, `test.storage.device_inventory`, `test.storage.drive_health`, `test.storage.raid_status`, `test.system.bmc_logs`
- Declared fingerprint-plan sources: `test.general.visual_inspection`, `test.storage.device_inventory`
- Authored Isolation routes:
  - `route.fingerprint.storage.loose.cable.01` — CORROBORATED_SUPPORT, minimum 2: `test.general.visual_inspection`, `test.storage.device_inventory`
- Optional Candidate-changing sources outside Isolation: `command.linux.lsblk`, `command.linux.smartctl`, `test.storage.drive_health`, `test.storage.raid_status`, `test.system.bmc_logs`
- Alternate-route sources outside the minimal witness: None
- Required Repair(s): `repair.storage.reseat_cable`
- Required Verify(s): `verify.storage.device_detected`
- Public Candidate Components: `component.storage.backplane`, `component.storage.data_cable`, `component.storage.nvme_ssd`, `component.storage.sas_hdd`
- True affected Components: `component.storage.data_cable`
- Minimal-route Tools: None
- Minimal-route technical Command dependencies: `command.linux.lsblk`
- Minimal-route Protocols: None
- All authored-route Tools: None
- All authored-route technical Command dependencies: `command.linux.lsblk`
- All authored-route Protocols: None
- Oracle minimal route: `test.general.visual_inspection` → `test.storage.device_inventory` → Isolate `fault_instance.storage.cable` → `repair.storage.reseat_cable` → `verify.storage.device_detected`
- Training objective: Separate storage path, media, and array-state evidence.

## Deterministic totals

| Measure | Unique | Practice occurrences |
| --- | ---: | ---: |
| Symptoms | 9 | 12 |
| Public Candidate Faults | 28 | 44 |
| Truth Faults / instances | 18 | 19 |
| Minimal-witness diagnostics | 14 | 15 |
| Required Repairs | 12 | 12 |
| Required Verifications | 9 | 15 |

There are 30 unique diagnostics with actual Candidate-changing authored outcomes, 20 separately declared fingerprint-plan sources, and 18 unique Isolation-route sources. One current alternate route requires a Command action: `command.linux.smartctl`. The oracle-selected minimal paths require 0 Command actions.

## Disjoint Global Bench diagnostic partition

Every one of the 50 playable diagnostics appears exactly once below. “Minimal witness” is actual practice; the other classes are opportunities, not taught actions.

| Class | Count | Stable IDs |
| --- | ---: | --- |
| Minimal-witness (actually exercised) | 14 | `test.boot.device_inventory`, `test.firmware.settings_review`, `test.general.visual_inspection`, `test.memory.diagnostic`, `test.memory.single_dimm_isolation`, `test.network.cable_substitution`, `test.network.interface_config`, `test.power.known_good_psu`, `test.power.psu_status`, `test.storage.device_inventory`, `test.storage.drive_health`, `test.system.bmc_logs`, `test.thermal.fan_telemetry`, `test.thermal.temperature_monitoring` |
| Candidate-changing but non-minimal | 16 | `command.linux.ip_addr`, `command.linux.ip_route`, `command.linux.lsblk`, `command.linux.lspci`, `command.linux.smartctl`, `command.network.ping`, `test.cooling.location_cross_substitution`, `test.general.minimum_configuration`, `test.network.dhcp_pool_audit`, `test.network.link`, `test.network.ping`, `test.pcie.inventory`, `test.power.distribution_path_isolation`, `test.power.output_voltage_measurement`, `test.power.residual_power_drain`, `test.storage.raid_status` |
| Target-legal and Candidate-neutral | 13 | `command.linux.dmesg`, `command.linux.ethtool`, `command.linux.free_h`, `command.linux.journalctl`, `command.linux.nvme_smart_log`, `test.boot.post_code_analysis`, `test.boot.post_observation`, `test.electrical.continuity`, `test.firmware.version_compatibility`, `test.memory.known_good_substitution`, `test.storage.bay_path_isolation`, `test.storage.predictive_health`, `test.system.controlled_stress` |
| Not target-legal for campaign one | 7 | `command.ipmi.sel_elist`, `command.linux.dhclient`, `test.compute.socket_magnified_inspection`, `test.management.bmc_recovery_state`, `test.management.event_log_freshness`, `test.network.dhcp_transaction_trace`, `test.network.link_counter_soak` |

## Repetition concentrations

- symptoms: `symptom.network.no_connectivity` × 2, `symptom.power.redundancy_warning` × 2, `symptom.thermal.high_cpu_temp` × 2
- public_candidate_faults: `fault.boot.order.incorrect` × 2, `fault.network.cable.disconnected` × 2, `fault.network.cable.failed` × 2, `fault.network.dhcp.no_lease` × 2, `fault.network.ip.static_incorrect` × 2, `fault.network.nic.failed` × 2, `fault.power.input.cable_loose` × 2, `fault.power.psu.failed` × 2, `fault.power.psu.not_seated` × 2, `fault.storage.cable.loose` × 2, `fault.storage.nvme.device_failed` × 2, `fault.storage.sas.drive_failed` × 2, `fault.thermal.cpu.overheating` × 2, `fault.thermal.fan.failed` × 2, `fault.thermal.heatsink.clogged` × 2, `fault.thermal.heatsink.contact_poor` × 2
- truth_faults: `fault.thermal.cpu.overheating` × 2
- minimal_witness_diagnostics: `test.general.visual_inspection` × 2
- repairs: no repeats
- verifications: `verify.boot.normal_boot` × 2, `verify.memory.full_test` × 2, `verify.network.connectivity` × 2, `verify.power.stable` × 2, `verify.storage.device_detected` × 2, `verify.thermal.load_test` × 2

## Uncovered lists

### Playable diagnostics not exercised by a minimal witness (36)

`command.ipmi.sel_elist`, `command.linux.dhclient`, `command.linux.dmesg`, `command.linux.ethtool`, `command.linux.free_h`, `command.linux.ip_addr`, `command.linux.ip_route`, `command.linux.journalctl`, `command.linux.lsblk`, `command.linux.lspci`, `command.linux.nvme_smart_log`, `command.linux.smartctl`, `command.network.ping`, `test.boot.post_code_analysis`, `test.boot.post_observation`, `test.compute.socket_magnified_inspection`, `test.cooling.location_cross_substitution`, `test.electrical.continuity`, `test.firmware.version_compatibility`, `test.general.minimum_configuration`, `test.management.bmc_recovery_state`, `test.management.event_log_freshness`, `test.memory.known_good_substitution`, `test.network.dhcp_pool_audit`, `test.network.dhcp_transaction_trace`, `test.network.link`, `test.network.link_counter_soak`, `test.network.ping`, `test.pcie.inventory`, `test.power.distribution_path_isolation`, `test.power.output_voltage_measurement`, `test.power.residual_power_drain`, `test.storage.bay_path_isolation`, `test.storage.predictive_health`, `test.storage.raid_status`, `test.system.controlled_stress`

### Symptoms not used by campaign one (24)

`symptom.boot.bootloader_error`, `symptom.boot.no_post`, `symptom.firmware.settings_reset`, `symptom.firmware.update_failed`, `symptom.management.alert_persists`, `symptom.management.bmc_not_responding`, `symptom.management.lifecycle_unavailable`, `symptom.memory.ecc_errors`, `symptom.memory.reduced_capacity`, `symptom.network.link_flapping`, `symptom.network.no_dhcp_lease`, `symptom.network.no_link`, `symptom.network.wrong_ip`, `symptom.pcie.device_missing`, `symptom.power.no_power`, `symptom.power.voltage_out_of_range`, `symptom.storage.drive_fault_led`, `symptom.storage.drive_missing`, `symptom.storage.predictive_failure_warning`, `symptom.system.device_errors`, `symptom.system.random_reboot`, `symptom.thermal.fan_warning`, `symptom.thermal.fans_loud`, `symptom.thermal.shutdown_under_load`

### Faults absent from every campaign-one Candidate pool (14)

`fault.board.rtc_battery.failed`, `fault.board.system.failed`, `fault.boot.bootloader.corrupt`, `fault.compute.cpu_socket.contacts_damaged`, `fault.cooling.fan_sense_path.intermittent`, `fault.cpu.not_seated`, `fault.firmware.version_set.incompatible`, `fault.management.alert.stale`, `fault.management.bmc_firmware.corrupt`, `fault.network.dhcp.pool_exhausted`, `fault.pcie.card.not_seated`, `fault.power.distribution_board.failed`, `fault.storage.drive.predictive_failure`, `fault.thermal.shutdown`

### Causal edges not used by a supported campaign-one fingerprint (10)

`edge.firmware.reset_to_order`, `edge.firmware.rtc_to_reset`, `edge.network.cable_to_dhcp`, `edge.network.dhcp_pool_to_no_lease`, `edge.network.nic_to_dhcp`, `edge.storage.failed_to_boot_missing`, `edge.storage.loose_to_boot_missing`, `edge.storage.sata_to_degraded`, `edge.thermal.contact_to_overheat`, `edge.thermal.overheat_to_shutdown`

### Deferred action definitions (36)

`repair.board.replace_rtc_battery`, `repair.board.replace_system_board`, `repair.boot.repair_bootloader`, `repair.compute.restore_socket_contacts`, `repair.cooling.repair_fan_connector`, `repair.firmware.restore_compatible_versions`, `repair.firmware.restore_settings`, `repair.management.clear_stale_alert_state`, `repair.management.recover_bmc_firmware`, `repair.memory.correct_population`, `repair.network.clear_stale_dhcp_reservations`, `repair.network.reconnect_cable`, `repair.network.replace_nic`, `repair.pcie.reseat_card`, `repair.power.reconnect_input`, `repair.power.replace_distribution_board`, `repair.storage.backup_rebuild_restore`, `repair.storage.rebuild_array`, `repair.storage.replace_backplane`, `repair.storage.replace_cable`, `repair.storage.replace_predictive_drive`, `repair.storage.replace_raid_controller`, `repair.thermal.restore_heatsink_contact`, `verify.boot.post`, `verify.compute.socket_path`, `verify.cooling.fan_sense_path`, `verify.firmware.compatible_persistent`, `verify.firmware.settings_persist`, `verify.management.alert_does_not_recur`, `verify.management.bmc_functional`, `verify.network.dhcp_lease`, `verify.pcie.device_present`, `verify.power.distribution_path`, `verify.storage.backplane_path`, `verify.storage.predictive_replacement`, `verify.system.burn_in`

## Dependency-ranked opportunity inventory

This inventory does not select Q, invent cases, or claim popularity.

### Uncovered but already playable

- 1. **opportunity.playable.candidate_changing_but_non_minimal** — 16 item(s): `command.linux.ip_addr`, `command.linux.ip_route`, `command.linux.lsblk`, `command.linux.lspci`, `command.linux.smartctl`, `command.network.ping`, `test.cooling.location_cross_substitution`, `test.general.minimum_configuration`, `test.network.dhcp_pool_audit`, `test.network.link`, `test.network.ping`, `test.pcie.inventory`, `test.power.distribution_path_isolation`, `test.power.output_voltage_measurement`, `test.power.residual_power_drain`, `test.storage.raid_status` Target-legal diagnostics with candidate-changing authored outcomes, but not exercised by an oracle-selected minimal route.
- 2. **opportunity.playable.target_legal_candidate_neutral** — 13 item(s): `command.linux.dmesg`, `command.linux.ethtool`, `command.linux.free_h`, `command.linux.journalctl`, `command.linux.nvme_smart_log`, `test.boot.post_code_analysis`, `test.boot.post_observation`, `test.electrical.continuity`, `test.firmware.version_compatibility`, `test.memory.known_good_substitution`, `test.storage.bay_path_isolation`, `test.storage.predictive_health`, `test.system.controlled_stress` Target-legal diagnostics that produce no candidate-changing outcome in any campaign-one Ticket.
- 3. **opportunity.playable.not_target_legal** — 7 item(s): `command.ipmi.sel_elist`, `command.linux.dhclient`, `test.compute.socket_magnified_inspection`, `test.management.bmc_recovery_state`, `test.management.event_log_freshness`, `test.network.dhcp_transaction_trace`, `test.network.link_counter_soak` Playable Global Bench diagnostics with no authored Evidence outcome for any campaign-one Ticket target.

### Present but not playable in a complete Ticket path

- 1. **opportunity.present.symptoms** — 24 item(s): `symptom.boot.bootloader_error`, `symptom.boot.no_post`, `symptom.firmware.settings_reset`, `symptom.firmware.update_failed`, `symptom.management.alert_persists`, `symptom.management.bmc_not_responding`, `symptom.management.lifecycle_unavailable`, `symptom.memory.ecc_errors`, `symptom.memory.reduced_capacity`, `symptom.network.link_flapping`, `symptom.network.no_dhcp_lease`, `symptom.network.no_link`, `symptom.network.wrong_ip`, `symptom.pcie.device_missing`, `symptom.power.no_power`, `symptom.power.voltage_out_of_range`, `symptom.storage.drive_fault_led`, `symptom.storage.drive_missing`, `symptom.storage.predictive_failure_warning`, `symptom.system.device_errors`, `symptom.system.random_reboot`, `symptom.thermal.fan_warning`, `symptom.thermal.fans_loud`, `symptom.thermal.shutdown_under_load`
- 2. **opportunity.present.faults** — 14 item(s): `fault.board.rtc_battery.failed`, `fault.board.system.failed`, `fault.boot.bootloader.corrupt`, `fault.compute.cpu_socket.contacts_damaged`, `fault.cooling.fan_sense_path.intermittent`, `fault.cpu.not_seated`, `fault.firmware.version_set.incompatible`, `fault.management.alert.stale`, `fault.management.bmc_firmware.corrupt`, `fault.network.dhcp.pool_exhausted`, `fault.pcie.card.not_seated`, `fault.power.distribution_board.failed`, `fault.storage.drive.predictive_failure`, `fault.thermal.shutdown`
- 3. **opportunity.present.causal_edges** — 10 item(s): `edge.firmware.reset_to_order`, `edge.firmware.rtc_to_reset`, `edge.network.cable_to_dhcp`, `edge.network.dhcp_pool_to_no_lease`, `edge.network.nic_to_dhcp`, `edge.storage.failed_to_boot_missing`, `edge.storage.loose_to_boot_missing`, `edge.storage.sata_to_degraded`, `edge.thermal.contact_to_overheat`, `edge.thermal.overheat_to_shutdown`
- 4. **opportunity.present.deferred_repairs** — 23 item(s): `repair.board.replace_rtc_battery`, `repair.board.replace_system_board`, `repair.boot.repair_bootloader`, `repair.compute.restore_socket_contacts`, `repair.cooling.repair_fan_connector`, `repair.firmware.restore_compatible_versions`, `repair.firmware.restore_settings`, `repair.management.clear_stale_alert_state`, `repair.management.recover_bmc_firmware`, `repair.memory.correct_population`, `repair.network.clear_stale_dhcp_reservations`, `repair.network.reconnect_cable`, `repair.network.replace_nic`, `repair.pcie.reseat_card`, `repair.power.reconnect_input`, `repair.power.replace_distribution_board`, `repair.storage.backup_rebuild_restore`, `repair.storage.rebuild_array`, `repair.storage.replace_backplane`, `repair.storage.replace_cable`, `repair.storage.replace_predictive_drive`, `repair.storage.replace_raid_controller`, `repair.thermal.restore_heatsink_contact`
- 5. **opportunity.present.deferred_validations** — 13 item(s): `verify.boot.post`, `verify.compute.socket_path`, `verify.cooling.fan_sense_path`, `verify.firmware.compatible_persistent`, `verify.firmware.settings_persist`, `verify.management.alert_does_not_recur`, `verify.management.bmc_functional`, `verify.network.dhcp_lease`, `verify.pcie.device_present`, `verify.power.distribution_path`, `verify.storage.backplane_path`, `verify.storage.predictive_replacement`, `verify.system.burn_in`
- 6. **opportunity.present.components_not_in_authored_routes** — 21 item(s): `component.board.rtc_battery`, `component.board.system`, `component.chassis.diagnostics`, `component.compute.cpu`, `component.compute.cpu_socket`, `component.cooling.cpu_heatsink`, `component.cooling.tim`, `component.management.bmc`, `component.memory.channel`, `component.memory.ecc_dimm`, `component.network.ethernet_cable`, `component.network.nic`, `component.pcie.card`, `component.power.input_cable`, `component.storage.backplane`, `component.storage.data_cable`, `component.storage.hba`, `component.storage.nvme_ssd`, `component.storage.raid_controller`, `component.storage.sas_hdd`, `component.storage.sata_ssd`
- 7. **opportunity.present.tools_not_in_authored_routes** — 6 item(s): `tool.diagnostics.bootable_media`, `tool.electronics.soldering_rework_station`, `tool.hand.calibrated_torque_driver`, `tool.inspection.magnifier`, `tool.known_good.dimm`, `tool.monitoring.os_temperature`
- 8. **opportunity.present.protocols_not_in_authored_routes** — 19 item(s): `protocol.interface.nvme`, `protocol.interface.pcie`, `protocol.interface.sas`, `protocol.interface.sata`, `protocol.network.dhcp`, `protocol.network.dns`, `protocol.network.ipv4`, `protocol.network.ipv6`, `protocol.raid.raid0`, `protocol.raid.raid1`, `protocol.raid.raid10`, `protocol.raid.raid5`, `protocol.raid.raid6`, `protocol.safety.deenergize_discharge`, `protocol.service.board_rework`, `protocol.service.cpu_socket_handling`, `protocol.service.firmware_change_control`, `protocol.service.ntf_screening`, `protocol.service.storage_data_preservation`

### Absent from the current domain

- 1. **Virtual network adapter and link path** (component) — A virtualization episode needs a targetable virtual adapter or switch path before diagnostics can distinguish it from a physical NIC or cable. Source: `docs/case_studies/v0.1/candidate_materials/domain-objects.md` § “Virtual network adapter and link path”.
- 2. **Standalone PSU self-start procedure** (test / protocol) — The safety/interface contract must exist before an authored outcome or Isolation route can use this procedure. Source: `docs/case_studies/v0.1/candidate_materials/domain-objects.md` § “Standalone PSU self-start test”.
- 3. **Dedicated PSU tester** (tool) — This Tool is useful only after a compatible Test defines safe interpretation and supported targets. Source: `docs/case_studies/v0.1/candidate_materials/domain-objects.md` § “Dedicated PSU tester”.
- 4. **Packet capture and DHCP packet inspection** (command / test / tool) — The current DHCP transaction trace uses the client exchange; packet capture remains a distinct acquisition/tooling path and needs all three contracts reconciled before play. Source: `docs/case_studies/v0.1/candidate_materials/domain-objects.md` § “Packet capture and DHCP packet inspection”.

## Interpretation limits

- Global Bench legality is not teaching coverage.
- Public-graph relevance is advisory and may be broad or incomplete.
- A distractor Candidate is not a covered true Fault.
- An authored Candidate effect makes a diagnostic informative for that Ticket; it is not exercised or required unless the selected route runs it.
- The 20 sources declared by fingerprint diagnostic plans are a separate authoring index and do not define the 30-source outcome-derived Candidate-changing set.
- A technical Command dependency of a Test is not a separately executed Command action.
- The solvability witness ends at required passing Verify; explicit Document Live is optional, while closure publication writes the accepted causal bundle.
- Automated campaign action counts exercise policy robustness and are not minimal teaching routes.
- Absent-domain opportunities preserve pilot research language and do not select Q, approve cases, or authorize new entities.
