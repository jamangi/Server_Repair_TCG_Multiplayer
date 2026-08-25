# TASK-014 playable coverage

This report is generated deterministically from the pinned Viewer manifest and `task-014-parts.json`. Knowledge records are not assumed to be Cards.

## Inventory

- Knowledge records: **257**
- Action-bearing records: **107** (37 Tests, 13 Commands, 35 Repairs, 22 Validations)
- Global Bench definitions: **50** (37 Tests and 13 Commands)
- Selected response definitions: **12** Repairs and **9** Validations
- Supported causal fingerprints: **12**
- Deferred action-bearing records: **36** because they are outside the twelve complete scenario paths

## Complete playable paths

| Fingerprint | Subsystem | Public Symptom | Public candidates | Actionable truth | Isolation routes | Repair | Verify |
|---|---|---|---|---|---|---|---|
| fingerprint.storage.loose_cable | storage | symptom.storage.io_errors | fault.storage.backplane.path_failed<br>fault.storage.cable.failed<br>fault.storage.cable.loose<br>fault.storage.nvme.device_failed<br>fault.storage.sas.drive_failed | fault.storage.cable.loose | CORROBORATED_SUPPORT | repair.storage.reseat_cable | verify.storage.device_detected |
| fingerprint.storage.failed_sas_member | storage | symptom.storage.raid_degraded | fault.storage.raid.degraded<br>fault.storage.sas.drive_failed<br>fault.storage.sata.drive_failed | fault.storage.sas.drive_failed | CORROBORATED_SUPPORT, DEFINITIVE_DIAGNOSTIC | repair.storage.replace_raid_member | verify.storage.raid_healthy |
| fingerprint.memory.unseated_dimm | memory | symptom.boot.memory_warning | fault.memory.channel.unavailable<br>fault.memory.dimm.not_seated<br>fault.memory.population.invalid | fault.memory.dimm.not_seated | DEFINITIVE_DIAGNOSTIC | repair.memory.reseat_dimm | verify.memory.inventory<br>verify.memory.full_test |
| fingerprint.memory.failed_dimm | memory | symptom.system.intermittent_crash | fault.memory.dimm.failed<br>fault.system.intermittent_memory_instability | fault.memory.dimm.failed | CORROBORATED_SUPPORT, DEFINITIVE_DIAGNOSTIC | repair.memory.replace_dimm | verify.memory.full_test |
| fingerprint.power.unseated_psu | power | symptom.power.redundancy_warning | fault.power.input.cable_loose<br>fault.power.psu.failed<br>fault.power.psu.not_seated | fault.power.psu.not_seated | CORROBORATED_SUPPORT | repair.power.reseat_psu | verify.power.stable |
| fingerprint.power.failed_psu | power | symptom.power.redundancy_warning | fault.power.input.cable_loose<br>fault.power.psu.failed<br>fault.power.psu.not_seated | fault.power.psu.failed | CORROBORATED_SUPPORT, DEFINITIVE_DIAGNOSTIC | repair.power.replace_psu | verify.power.stable |
| fingerprint.boot.incorrect_order | boot | symptom.boot.wrong_device | fault.boot.order.incorrect<br>fault.firmware.config.reset | fault.boot.order.incorrect | CORROBORATED_SUPPORT | repair.boot.correct_order | verify.boot.normal_boot |
| fingerprint.boot.missing_nvme | boot | symptom.boot.no_boot_device | fault.boot.device.not_detected<br>fault.boot.order.incorrect<br>fault.storage.cable.loose<br>fault.storage.nvme.device_failed<br>fault.storage.raid.controller_failed | fault.storage.nvme.device_failed | DEFINITIVE_DIAGNOSTIC | repair.storage.replace_nvme | verify.storage.device_detected<br>verify.boot.normal_boot |
| fingerprint.thermal.failed_fan | thermal | symptom.thermal.high_cpu_temp | fault.thermal.cpu.overheating<br>fault.thermal.fan.failed<br>fault.thermal.heatsink.clogged<br>fault.thermal.heatsink.contact_poor | fault.thermal.fan.failed | DEFINITIVE_DIAGNOSTIC | repair.thermal.replace_fan | verify.thermal.load_test |
| fingerprint.thermal.clogged_heatsink | thermal | symptom.thermal.high_cpu_temp | fault.thermal.cpu.overheating<br>fault.thermal.fan.failed<br>fault.thermal.heatsink.clogged<br>fault.thermal.heatsink.contact_poor | fault.thermal.heatsink.clogged | DEFINITIVE_DIAGNOSTIC | repair.thermal.clean_cooling_path | verify.thermal.load_test |
| fingerprint.network.failed_cable | network | symptom.network.no_connectivity | fault.network.cable.disconnected<br>fault.network.cable.failed<br>fault.network.dhcp.no_lease<br>fault.network.ip.static_incorrect<br>fault.network.nic.failed | fault.network.cable.failed | DEFINITIVE_DIAGNOSTIC | repair.network.replace_cable | verify.network.link<br>verify.network.connectivity |
| fingerprint.network.incorrect_static_ip | network | symptom.network.no_connectivity | fault.network.cable.disconnected<br>fault.network.cable.failed<br>fault.network.dhcp.no_lease<br>fault.network.ip.static_incorrect<br>fault.network.nic.failed | fault.network.ip.static_incorrect | DEFINITIVE_DIAGNOSTIC | repair.network.correct_static_ip | verify.network.connectivity |

## Outcome completeness

Every globally promoted diagnostic has a complete executable Card contract. Ticket assembly emits exactly one outcome for each target-compatible diagnostic in both the initial and repaired machine states. Explicit relationship-bound findings are used where authored; all other eligible executions resolve through the versioned clean, unrelated, or inconclusive families. Assembly fails on a missing or duplicate source/state outcome.

The machine-readable matrix is `content/gameplay-v1/playable-coverage-v3.json`. It distinguishes the complete 257-record knowledge inventory, all 107 action-bearing records, selected playable definitions, deferred actions, source parts, required resources, machine states, and closure paths.
