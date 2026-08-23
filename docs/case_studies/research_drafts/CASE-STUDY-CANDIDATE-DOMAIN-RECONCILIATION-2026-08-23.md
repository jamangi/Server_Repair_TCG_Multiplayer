# Case-study candidate domain reconciliation

Date: 2026-08-23

Status: Implemented as draft Core v0.1 domain content.

## Research inputs

- [`v0.1/candidate_materials/domain-objects.md`](../v0.1/candidate_materials/domain-objects.md), the deduplicated domain candidates from five case-study reductions.
- [`v0.0_ex1_board_and_cards.md`](../../candidate_flows/v0.0_ex1_board_and_cards.md), specifically **Tests and Commands**, **Repairs**, and **Verify cards** in the exact example catalog.

These files are research and design inputs, not domain authority. The JSON content records and their stable IDs become the machine-readable domain representation after schema and reference validation.

## Example-card comparison

The three requested catalog sections contain 34 example cards: 18 Tests and Commands, 8 Repairs, and 8 Verify cards. Thirty-one already linked to stable domain records with the same technical function. The three entries explicitly marked as gap-backed fixtures had no stable procedure ID:

| Example-local fixture | Missing technical object | Added stable domain object |
| --- | --- | --- |
| `EX1-CARD-DHCP-TRACE` | DHCP transaction/offer analysis | `test.network.dhcp_transaction_trace` |
| `EX1-CARD-DHCP-POOL-AUDIT` | DHCP pool-capacity and reservation inspection | `test.network.dhcp_pool_audit` |
| `EX1-CARD-CLEAR-RESERVATIONS` | Removal of stale DHCP reservations | `repair.network.clear_stale_dhcp_reservations` |

The `EX1-CARD` labels were not carried into domain names or IDs. They remain example-fixture identifiers only.

The repair fixture also exposed a deeper dependency: its target, `EX1-CAUSE-DHCP-POOL-EXHAUSTED`, was example-local rather than an actionable stable Fault. The implementation therefore adds `fault.network.dhcp.pool_exhausted` and `edge.network.dhcp_pool_to_no_lease`, connecting the server-side cause to the existing client-visible `fault.network.dhcp.no_lease`.

## Candidate-material comparison

| Research candidate | Prior coverage | Disposition |
| --- | --- | --- |
| IPv4 and IPv6 protocol representations | Missing; DHCP alone did not distinguish the two network-layer states | Added `protocol.network.ipv4` and `protocol.network.ipv6` |
| Virtual network adapter and link path | Missing | Deferred as the source draft recommends until virtualization is an intentional expansion |
| Residual-power drain diagnostic procedure | Safety protocol existed, but no Test turned the before/after state into Evidence | Added `test.power.residual_power_drain`, with explicit reference to the existing de-energization protocol in its education text |
| Standalone PSU self-start test | Missing | Deferred because the evidence is ATX-specific, the candidate warns against generalizing it to server hot-swap PSUs, and a safe interface/load contract is not yet authored |
| PSU output-voltage measurement | Multimeter existed, but no Test interpreted rail measurements | Added `test.power.output_voltage_measurement` with model-specific pinout and safety limits |
| Dedicated PSU tester | Missing | Deferred as the source marks it lower priority and the current voltage-measurement and known-good-substitution paths already provide distinct coverage |
| DHCP client release/renew command | Missing | Added `command.linux.dhclient` |
| DHCP transaction/offer analysis | Missing | Added `test.network.dhcp_transaction_trace` |
| Packet capture and DHCP packet inspection | Missing | Deferred because the case only recommends this unexecuted path and the source marks it lower-confidence |
| DHCP pool-capacity and reservation inspection | Missing | Added `test.network.dhcp_pool_audit` |
| Operating-system temperature telemetry tool | Temperature Test existed, but only the BMC Console represented its instrumentation | Added `tool.monitoring.os_temperature` for non-BMC sensor telemetry |
| RAID controller firmware inspection/update | Functionally covered by the later `test.firmware.version_compatibility` and `repair.firmware.restore_compatible_versions` records | No duplicate objects; added the RAID controller to the existing compatibility Test's target relationships |
| Remove stale DHCP reservations | Missing | Added `repair.network.clear_stale_dhcp_reservations` |
| Backup-and-restore recovery procedure | Missing; RAID parity rebuild was not equivalent | Added `repair.storage.backup_rebuild_restore` as a distinct high-effort recovery path |
| DHCP lease verification | Generic connectivity validation existed but did not require lease provenance or options | Added `verify.network.dhcp_lease` |

The source's **Reviewed gaps not promoted** remain unpromoted. Platform names and measured scenario values remain educational facts; `ifconfig` remains functionally covered by `ip addr`; `cpuburn` remains covered by the generic Controlled Stress Test; and discarded graphics or sound hypotheses do not justify immediate component expansion.

## Added domain records

The implementation adds 13 records in `viewer/content/core-v0.1-case-study-gaps.json`:

- 1 Fault: DHCP Address Pool Exhausted;
- 4 Tests: Residual-Power Drain, Power Output Voltage Measurement, DHCP Transaction Trace, and DHCP Address Pool Audit;
- 1 Tool: Operating-System Temperature Monitor;
- 1 Command: `dhclient` Lease Request;
- 2 Repairs: Clear Stale DHCP Reservations and Backup, Rebuild, and Restore System;
- 1 Validation: DHCP Lease Verification;
- 2 Protocols: IPv4 and IPv6; and
- 1 causal edge: exhausted DHCP pool causes DHCP lease failure.

## Network reconciliation

The new objects are connected to existing content rather than added as isolated labels:

- the deeper DHCP pool Fault owns the repair path, while both DHCP Faults reference appropriate Tests, symptoms, and validation;
- DHCP and IPv4 reference the capacity Fault and its repair/validation procedures;
- the `dhclient` Command points to the transaction Test, and that Test consumes the Command;
- the pool audit can confirm the deeper capacity Fault while the transaction trace can support but not by itself confirm it;
- the causal edge distinguishes the actionable server-side cause from its client-visible effect;
- the two new power Tests are referenced by the existing PSU and power-distribution Faults;
- the OS temperature tool references the existing CPU/heatsink components and thermal Faults;
- the backup/rebuild/restore recovery is connected to SAS-member and degraded-array Faults and to the existing storage-data-preservation protocol; and
- the existing firmware-compatibility Test now explicitly targets the RAID controller, avoiding a redundant controller-specific copy.

All authored Test outcomes use the frozen vocabulary, and every action-bearing procedure stays within the frozen 0/1/2 Action envelope.
