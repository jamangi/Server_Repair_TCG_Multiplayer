# Released Story domain coverage — Quiet Cascade expansion v3

This post-release audit measures the exact twelve-Match live registry against the additive v4 domain and v5 Card catalogs. It composes the already-real six-Match campaign-one and six-Match expansion Builder/solvability/engine proofs only after validating every release Match, seed, Ticket ID, snapshot digest, source entity, and required Card. It does not turn catalog presence or one proof policy's extra actions into claimed teaching.

## Version boundary

- Story: `story.campaign.quiet_cascade.v1` / `quiet-cascade-expansion-v3`
- Domain / Cards / decks: `core-domain-snapshot-story-expansion-v4` / `core-card-catalog-story-expansion-v5` / `core-response-decks-v5`
- Tickets / coverage: `core-ticket-parts-v4` / `playable-coverage-v5`
- Campaign-one proof provenance remains `quiet-cascade-characterization-v2`; its reviewed v3 Ticket snapshots are not relabeled as v4 builds.

## Twelve-Match integration proof

| Shift | Segment | Match | Tickets | Builder contract | Engine |
| ---: | --- | --- | ---: | --- | --- |
| 1 | Campaign one | `story.match.qc01.shift01.wrong_device` | 1 | legacy v3 | SUCCEEDED |
| 2 | Campaign one | `story.match.qc01.shift02.power_lot` | 2 | legacy v3 | SUCCEEDED |
| 3 | Campaign one | `story.match.qc01.shift03.memory_compare` | 2 | legacy v3 | SUCCEEDED |
| 4 | Campaign one | `story.match.qc01.shift04.passes_cold` | 2 | legacy v3 | SUCCEEDED |
| 5 | Campaign one | `story.match.qc01.shift05.no_offer` | 2 | legacy v3 | SUCCEEDED |
| 6 | Campaign one | `story.match.qc01.shift06.quiet_cascade` | 3 | legacy v3 | SUCCEEDED |
| 7 | Expansion | `story.match.qc02.shift07.socket_contacts` | 1 | embedded v4 | SUCCEEDED |
| 8 | Expansion | `story.match.qc02.shift08.power_distribution` | 1 | embedded v4 | SUCCEEDED |
| 9 | Expansion | `story.match.qc02.shift09.predictive_drive` | 1 | embedded v4 | SUCCEEDED |
| 10 | Expansion | `story.match.qc02.shift10.stale_alert` | 1 | embedded v4 | SUCCEEDED |
| 11 | Expansion | `story.match.qc02.shift11.firmware_regression` | 1 | embedded v4 | SUCCEEDED |
| 12 | Expansion | `story.match.qc02.shift12.bmc_recovery` | 1 | embedded v4 | SUCCEEDED |

All 12 registry Matches constructed at exact pins, all 18 Tickets have complete solvability witnesses, all 12 real engine Matches succeeded, and all 12 reruns were identical. Campaign one uses its retained legacy v3 top-level profile; Shifts 7–12 use their embedded v4 configurations. Exact release integration is proved without rebuilding or mutating either reviewed source proof.

## Catalog denominators and actual required-path reach

The v4 domain contains 257 records. The v5 playable catalog contains 83 Cards: 50 diagnostics, 18 selected Repairs, and 15 selected Verifications. The release authors 18 Tickets across 12 Matches.

| Role | Unique / catalog | Coverage | Ticket-role occurrences |
| --- | ---: | ---: | ---: |
| Public Symptoms | 19 / 33 | 57.6% | 22 |
| Public Candidate Faults | 36 / 42 | 85.7% | 64 |
| Hidden true Faults | 24 / 42 | 57.1% | 25 |
| Supported fingerprints | 18 / 18 | 100.0% | 18 |
| Minimal-witness diagnostics | 21 / 50 | 42.0% | 22 |
| Required Repairs | 18 / 18 | 100.0% | 18 |
| Required Verifications | 15 / 15 | 100.0% | 21 |

The combined minimal witnesses require 54 distinct Cards out of 83: 21 diagnostics, all 18 selected Repairs, and all 15 selected Verifications. Closure publication is required for all 18 Tickets; explicit Document Live is required for 0.

## Diagnostic role boundary

- **Global Bench (50)**: visible in the shared catalog, not taught merely by visibility.
- **Match-relevant (43)**: relevant to at least one authored Ticket, not necessarily executed.
- **Proven Candidate-changing (36)**: outcome-derived for campaign one plus only expansion oracle-required diagnostics; optional expansion effects are intentionally not inferred.
- **Minimal witness (21)**: actually required by a deterministic complete route.

Commands remain separate: 13 are globally visible, 8 are Match-relevant, 1 occurs in an authored Isolation route, and zero are used by a minimal witness. Expansion-required Commands: None.

## Remaining catalog gaps

- Supported fingerprints not authored: None.
- Diagnostics never Match-relevant (7): `command.ipmi.sel_elist`, `command.linux.dmesg`, `command.linux.ethtool`, `command.linux.free_h`, `command.linux.journalctl`, `test.boot.post_observation`, `test.electrical.continuity`
- Diagnostics absent from every minimal witness (29): `command.ipmi.sel_elist`, `command.linux.dhclient`, `command.linux.dmesg`, `command.linux.ethtool`, `command.linux.free_h`, `command.linux.ip_addr`, `command.linux.ip_route`, `command.linux.journalctl`, `command.linux.lsblk`, `command.linux.lspci`, `command.linux.nvme_smart_log`, `command.linux.smartctl`, `command.network.ping`, `test.boot.post_code_analysis`, `test.boot.post_observation`, `test.cooling.location_cross_substitution`, `test.electrical.continuity`, `test.general.minimum_configuration`, `test.memory.known_good_substitution`, `test.network.dhcp_pool_audit`, `test.network.dhcp_transaction_trace`, `test.network.link`, `test.network.ping`, `test.pcie.inventory`, `test.power.output_voltage_measurement`, `test.power.residual_power_drain`, `test.storage.bay_path_isolation`, `test.storage.raid_status`, `test.system.controlled_stress`
- Selected Repairs not required: None.
- Selected Verifications not required: None.
- Symptoms not authored (14): `symptom.boot.bootloader_error`, `symptom.firmware.settings_reset`, `symptom.management.lifecycle_unavailable`, `symptom.memory.ecc_errors`, `symptom.memory.reduced_capacity`, `symptom.network.no_dhcp_lease`, `symptom.network.wrong_ip`, `symptom.pcie.device_missing`, `symptom.storage.drive_missing`, `symptom.system.device_errors`, `symptom.system.random_reboot`, `symptom.thermal.fan_warning`, `symptom.thermal.fans_loud`, `symptom.thermal.shutdown_under_load`
- Faults absent from every public Candidate pool (6): `fault.board.rtc_battery.failed`, `fault.boot.bootloader.corrupt`, `fault.cooling.fan_sense_path.intermittent`, `fault.network.dhcp.pool_exhausted`, `fault.pcie.card.not_seated`, `fault.thermal.shutdown`
- Faults absent from hidden truth (18): `fault.board.rtc_battery.failed`, `fault.board.system.failed`, `fault.boot.bootloader.corrupt`, `fault.cooling.fan_sense_path.intermittent`, `fault.cpu.not_seated`, `fault.firmware.config.reset`, `fault.memory.population.invalid`, `fault.network.cable.disconnected`, `fault.network.dhcp.pool_exhausted`, `fault.network.nic.failed`, `fault.pcie.card.not_seated`, `fault.power.input.cable_loose`, `fault.storage.backplane.path_failed`, `fault.storage.cable.failed`, `fault.storage.raid.controller_failed`, `fault.storage.sata.drive_failed`, `fault.thermal.heatsink.contact_poor`, `fault.thermal.shutdown`

## Interpretation limits

- Global catalog presence, Match legality, public relevance, Candidate effects, Isolation routes, minimal-witness actions, response closure, and narrative mention are different roles.
- Only minimal-witness diagnostics and required Repair/Verify response Cards are counted as actual required solution-path use.
- The expansion engine proof policy may execute additional diagnostics; those execution counts demonstrate one proof policy, not a minimum teaching requirement.
- A completed authored Match exposes a concept but does not prove learner mastery or later recall.
- Document is represented by required closure publication; explicit Document Live remains optional in the current rules.
