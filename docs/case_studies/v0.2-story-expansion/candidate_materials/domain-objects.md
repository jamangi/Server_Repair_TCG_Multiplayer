# Deduplicated domain-object reconciliation

Status: **research reconciliation only; no new stable IDs or domain mutations are proposed**

The six selected cases were reconciled against domain content version `core-domain-snapshot-technical-copy-v3`. Their primary Symptom, Fault, Test, Repair, and Validation concepts already exist in the draft canonical domain. Vendor names, event strings, versions, utilities, and exact part identities remain aliases, educational details, or Ticket/source provenance.

## Primary lifecycle bundles

| Case | Symptom | Fault | Primary diagnostic | Repair | Validation | Deduplication result |
| --- | --- | --- | --- | --- | --- | --- |
| `exp-001` damaged CPU-socket contacts | `symptom.boot.no_post` | `fault.compute.cpu_socket.contacts_damaged` | `test.compute.socket_magnified_inspection` | `repair.compute.restore_socket_contacts` | `verify.compute.socket_path` | Complete existing domain bundle; no new object. |
| `exp-002` failed PDB | `symptom.power.voltage_out_of_range` | `fault.power.distribution_board.failed` | `test.power.distribution_path_isolation` | `repair.power.replace_distribution_board` | `verify.power.distribution_path` | Complete existing domain bundle; “PDB” and “PSU backplane” are aliases of the existing Component boundary. |
| `exp-003` predictive drive failure | `symptom.storage.predictive_failure_warning` | `fault.storage.drive.predictive_failure` | `test.storage.predictive_health` | `repair.storage.replace_predictive_drive` | `verify.storage.predictive_replacement` | Complete existing domain bundle; controller acquisition names do not require duplicate Tests or Commands, and the selected source does not prove a `smartctl` execution. |
| `exp-004` stale management alert | `symptom.management.alert_persists` | `fault.management.alert.stale` | `test.management.event_log_freshness` | `repair.management.clear_stale_alert_state` | `verify.management.alert_does_not_recur` | Complete existing domain bundle; DSET is a vendor implementation, not a new object. Its combined probe/clear behavior is recorded as modeling pressure. |
| `exp-005` incompatible firmware causing NIC flaps | `symptom.network.link_flapping` | `fault.firmware.version_set.incompatible` | `test.firmware.version_compatibility` | `repair.firmware.restore_compatible_versions` | `verify.firmware.compatible_persistent` | Complete existing domain bundle; iDRAC and the exact rollback version remain alias/provenance data. |
| `exp-006` corrupt BMC firmware recovery | `symptom.management.bmc_not_responding` | `fault.management.bmc_firmware.corrupt` | `test.management.bmc_recovery_state` | `repair.management.recover_bmc_firmware` | `verify.management.bmc_functional` | Complete existing domain bundle; GA-7PESH2, controller family, recovery executable, and image remain platform evidence. |

The per-case evidence is in [`found/`](../database_cross_reference/found/) and [`not_found/`](../database_cross_reference/not_found/). Every nearest-existing analysis terminates in one of the bundles above or in a non-object disposition. Nothing in the six cases justifies another Component, Tool, Command, Test, Repair, Validation, Protocol, Symptom, or Fault solely for count balance.

## Existing supporting objects retained

| Lifecycle/support role | Existing stable IDs | Research disposition |
| --- | --- | --- |
| Physical/service boundaries | `component.compute.cpu_socket`, `component.power.distribution_board`, `component.storage.sas_hdd`, `component.storage.backplane`, `component.management.bmc`, `component.network.nic` | Exact or generic reusable boundaries. |
| Supporting diagnostics | `test.general.minimum_configuration`, `test.power.known_good_psu`, `test.power.output_voltage_measurement`, `test.storage.raid_status`, `test.network.link_counter_soak` | Reuse where the eventual authored route and outcomes make them truthful; no automatic “required” claim. |
| Tools | `tool.inspection.magnifier`, `tool.storage.raid_console`, `tool.management.bmc_console`, `tool.diagnostics.bootable_media` | Vendor products map to generic capability boundaries. |
| Protocols | `protocol.service.cpu_socket_handling`, `protocol.safety.deenergize_discharge`, `protocol.service.storage_data_preservation`, `protocol.service.ntf_screening`, `protocol.service.firmware_change_control` | Safety/service context already exists; a source's brevity does not weaken the protocol. |
| Commands | `command.linux.smartctl`, `command.ipmi.sel_elist`, `command.linux.ethtool` | Cataloged acquisition options only. Useful/required status is case- and route-specific; see the relationship-impact ledger. |

## Not domain-object candidates: later integration work

The following are genuine consumers of this research, but they are not missing research-domain objects and must not be assigned new IDs in TASK-041:

1. **Six causal fingerprints and Ticket-part assemblies.** Each selected case needs a versioned playable fingerprint with candidates, truth, current-state outcomes, typed Isolation route, Repair/Verify closure, seedable Builder parts, and a player-safe witness. That belongs to later domain/gameplay integration.
2. **Twelve response Card Definitions.** All six primary Tests are already published Diagnostic Bench definitions. The six existing Repair Procedures and six existing Validation Procedures listed below are not in the current response-card catalog and need later Card authoring, deck quantities, copy/cost review, technical copy, and deterministic contracts:

   | Case | Repair Card must reference | Verify Card must reference |
   | --- | --- | --- |
   | `exp-001` | `repair.compute.restore_socket_contacts` | `verify.compute.socket_path` |
   | `exp-002` | `repair.power.replace_distribution_board` | `verify.power.distribution_path` |
   | `exp-003` | `repair.storage.replace_predictive_drive` | `verify.storage.predictive_replacement` |
   | `exp-004` | `repair.management.clear_stale_alert_state` | `verify.management.alert_does_not_recur` |
   | `exp-005` | `repair.firmware.restore_compatible_versions` | `verify.firmware.compatible_persistent` |
   | `exp-006` | `repair.management.recover_bmc_firmware` | `verify.management.bmc_functional` |

3. **Teaching and route selection.** Research supports discriminations, but it does not choose final distractors, Evidence dispositions, required Isolation routes, Action costs, deck composition, episode order, or Story emphasis.
4. **Provenance review.** The current primary records originated in the draft post-market domain expansion. TASK-042 must reconcile their stored provenance with these six selected, directly reviewed case sources before publication; this is review of existing records, not evidence for duplicate objects.

## Reviewed details not promoted

- Dell platform names, iDRAC/DSET product names, vendor event codes, link-message text, LED colors, firmware versions, bay/serial values, controller screens, and recovery filenames remain source/Ticket facts.
- A vendor diagnostic screen is not automatically a Command. A firmware flashing executable changes state through a Repair and is not a Diagnostic Command merely because it runs from a console.
- `exp-004`'s one DSET invocation both probes/logs and clears stale state in the real account. The existing Test and Repair objects remain separate; this is lifecycle/modeling pressure, not a missing combined object.
- Exact unsafe or platform-specific contact, live-rail, jumper, and firmware-flash techniques are not generalized beyond the current safety and service protocols.
