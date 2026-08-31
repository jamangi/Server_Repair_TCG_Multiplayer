# Released Story System Model coverage

Status: **candidate-frozen TASK-053 domain package; explanatory only**

The declared denominator is 18 Ticket instances and 18 unique fingerprints across 12 released Story Matches. All 18 bind to one of three fixed source-backed profiles; the five TASK-051 pilot bindings and their two profiles remain byte-identical, while one R740xd Story variant covers the 13 non-pilot Tickets.

## Coverage gates

| Measure | Covered | Denominator |
| --- | ---: | ---: |
| Ticket instances | 18 | 18 |
| Unique fingerprints | 18 | 18 |
| Hidden authored paths | 18 | 18 |
| Public Candidate sets closed | 18 | 18 |
| Relevant Fault/Symptom/action objects dispositioned | 131 | 131 |
| Unique relevant actions with justified paths | 76 | 76 |

## Exact released denominator

| Shift | Match | Ticket | Fingerprint | Binding | Profile |
| ---: | --- | --- | --- | --- | --- |
| 1 | `story.match.qc01.shift01.wrong_device` | `ticket.generated.ef8a4924e707349bce5c2be7` | `fingerprint.boot.incorrect_order` | `binding.fingerprint.boot.incorrect_order.system-model.story-v1` | `profile.dell.poweredge-r740xd.hybrid-24x2_5.story-v1` |
| 2 | `story.match.qc01.shift02.power_lot` | `ticket.generated.a10b8767580c9453c679a326` | `fingerprint.power.unseated_psu` | `binding.fingerprint.power.unseated_psu.system-model.story-v1` | `profile.dell.poweredge-r740xd.hybrid-24x2_5.story-v1` |
| 2 | `story.match.qc01.shift02.power_lot` | `ticket.generated.8ee2c08bae1e3d005b35bff5` | `fingerprint.power.failed_psu` | `binding.fingerprint.power.failed_psu.system-model.story-v1` | `profile.dell.poweredge-r740xd.hybrid-24x2_5.story-v1` |
| 3 | `story.match.qc01.shift03.memory_compare` | `ticket.generated.75ea6ec9e60d64c7cac4caa5` | `fingerprint.memory.failed_dimm` | `binding.fingerprint.memory.failed_dimm.system-model.story-v1` | `profile.dell.poweredge-r740xd.hybrid-24x2_5.story-v1` |
| 3 | `story.match.qc01.shift03.memory_compare` | `ticket.generated.424c8fab1db6aed25058ab78` | `fingerprint.memory.unseated_dimm` | `binding.fingerprint.memory.unseated_dimm.system-model.story-v1` | `profile.dell.poweredge-r740xd.hybrid-24x2_5.story-v1` |
| 4 | `story.match.qc01.shift04.passes_cold` | `ticket.generated.6e55cf55154d356da2e91126` | `fingerprint.thermal.clogged_heatsink` | `binding.fingerprint.thermal.clogged_heatsink.system-model.story-v1` | `profile.dell.poweredge-r740xd.hybrid-24x2_5.story-v1` |
| 4 | `story.match.qc01.shift04.passes_cold` | `ticket.generated.f60b9ce132c74c33f607df6d` | `fingerprint.thermal.failed_fan` | `binding.fingerprint.thermal.failed_fan.system-model.story-v1` | `profile.dell.poweredge-r740xd.hybrid-24x2_5.story-v1` |
| 5 | `story.match.qc01.shift05.no_offer` | `ticket.generated.759fd75d6ac043a57d6673d7` | `fingerprint.network.incorrect_static_ip` | `binding.fingerprint.network.incorrect_static_ip.system-model.story-v1` | `profile.dell.poweredge-r740xd.hybrid-24x2_5.story-v1` |
| 5 | `story.match.qc01.shift05.no_offer` | `ticket.generated.cbc8003979ffdaca83b41d7d` | `fingerprint.network.failed_cable` | `binding.fingerprint.network.failed_cable.system-model.story-v1` | `profile.dell.poweredge-r740xd.hybrid-24x2_5.story-v1` |
| 6 | `story.match.qc01.shift06.quiet_cascade` | `ticket.generated.3ec80b1b0e7221ac725aedf9` | `fingerprint.boot.missing_nvme` | `binding.fingerprint.boot.missing_nvme.system-model.v1` | `profile.dell.poweredge-r740xd.hybrid-24x2_5.v1` |
| 6 | `story.match.qc01.shift06.quiet_cascade` | `ticket.generated.45a70010dd4752f864990575` | `fingerprint.storage.failed_sas_member` | `binding.fingerprint.storage.failed_sas_member.system-model.story-v1` | `profile.dell.poweredge-r740xd.hybrid-24x2_5.story-v1` |
| 6 | `story.match.qc01.shift06.quiet_cascade` | `ticket.generated.5352abd871c2e9076be92a0b` | `fingerprint.storage.loose_cable` | `binding.fingerprint.storage.loose_cable.system-model.v1` | `profile.dell.poweredge-r740xd.hybrid-24x2_5.v1` |
| 7 | `story.match.qc02.shift07.socket_contacts` | `ticket.generated.4f237a22c35d46166044b2c7` | `fingerprint.compute.damaged_cpu_socket_contacts` | `binding.fingerprint.compute.damaged_cpu_socket_contacts.system-model.story-v1` | `profile.dell.poweredge-r740xd.hybrid-24x2_5.story-v1` |
| 8 | `story.match.qc02.shift08.power_distribution` | `ticket.generated.3fd6eb04534f79b5b3f87f98` | `fingerprint.power.failed_distribution_board` | `binding.fingerprint.power.failed_distribution_board.system-model.v1` | `profile.dell.poweredge-r740xd2.power-interposer.v1` |
| 9 | `story.match.qc02.shift09.predictive_drive` | `ticket.generated.36ba2ae8958431194a7e1fef` | `fingerprint.storage.predictive_drive_failure` | `binding.fingerprint.storage.predictive_drive_failure.system-model.story-v1` | `profile.dell.poweredge-r740xd.hybrid-24x2_5.story-v1` |
| 10 | `story.match.qc02.shift10.stale_alert` | `ticket.generated.b68505324c44f11977fcda07` | `fingerprint.management.stale_alert` | `binding.fingerprint.management.stale_alert.system-model.story-v1` | `profile.dell.poweredge-r740xd.hybrid-24x2_5.story-v1` |
| 11 | `story.match.qc02.shift11.firmware_regression` | `ticket.generated.b34238282822e93980b5f1ad` | `fingerprint.firmware.incompatible_version_set` | `binding.fingerprint.firmware.incompatible_version_set.system-model.v1` | `profile.dell.poweredge-r740xd.hybrid-24x2_5.v1` |
| 12 | `story.match.qc02.shift12.bmc_recovery` | `ticket.generated.f32b85cbf2054fdf0114f42a` | `fingerprint.management.corrupt_bmc_firmware` | `binding.fingerprint.management.corrupt_bmc_firmware.system-model.v1` | `profile.dell.poweredge-r740xd.hybrid-24x2_5.v1` |

## Profile reuse

- `profile.dell.poweredge-r740xd.hybrid-24x2_5.story-v1`: 13 Ticket bindings.
- `profile.dell.poweredge-r740xd.hybrid-24x2_5.v1`: 4 Ticket bindings.
- `profile.dell.poweredge-r740xd2.power-interposer.v1`: 1 Ticket binding.

## Intentional exclusions and source exceptions

- `exclusion.story.public-symptom-component-bindings` (19): Public Symptoms remain observations spanning multiple Candidate-compatible roles; the overlay records explicit non-relations.
- `exclusion.story.per-pin-slot-sensor-wiring` (1): Pin, slot, sensor-bus, lane, peer-infrastructure, and unsupported-option detail is outside the sourced teaching boundary.
- `exclusion.story.gameplay-inference` (1): Topology never derives Bench relevance, legal intents, Evidence, Isolation, Repair, or Verify authority.
- Source/abstraction exception: Mutable Dell HTML topics expose no stable topic revision; product scope, exact URL, access date, and claim boundary are pinned.
- Source/abstraction exception: The R740xd power-distribution path remains an honest board-power abstraction; only the R740xd2 profile names an exact Power Interposer Board service unit.
- Source/abstraction exception: OS network configuration and bounded peer services are generalized public roles backed only to the host handoff and NDC boundary; no external-infrastructure health is asserted.
- Source/abstraction exception: The established SAS/SATA drive-group role remains broader than one exact drive technology; the fixed option and per-Ticket path constrain its use.

Blocking gaps: **0**. A future source withdrawal, Candidate-closure failure, immutable-input drift, or unsupported profile must fail closed to the existing text-only fallback without changing Ticket play.
