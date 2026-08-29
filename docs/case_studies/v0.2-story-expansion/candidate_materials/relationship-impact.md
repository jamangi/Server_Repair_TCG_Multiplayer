# Candidate relationship-impact ledger

Status: **research handoff for later integration; no relationships are mutated here**

The six primary domain bundles already resolve in `core-domain-snapshot-technical-copy-v3`. This ledger names what later integration must consume and validate without interpreting research as gameplay authority.

## Existing relationship chains and later consumers

| Case | Current resolving chain | Later integration impact |
| --- | --- | --- |
| `exp-001` | `symptom.boot.no_post` → `fault.compute.cpu_socket.contacts_damaged` → `test.compute.socket_magnified_inspection` / `repair.compute.restore_socket_contacts` / `verify.compute.socket_path`; affected `component.compute.cpu_socket` | Author one fingerprint/Ticket path and two response Cards; review whether staged population is optional context or an authored supporting route. Preserve qualified socket repair and board-FRU fallback. |
| `exp-002` | `symptom.power.voltage_out_of_range` → `fault.power.distribution_board.failed` → `test.power.distribution_path_isolation` / `repair.power.replace_distribution_board` / `verify.power.distribution_path`; affected `component.power.distribution_board` | Author one fingerprint/Ticket path and two response Cards; ensure supply/bay results distinguish PSU from PDB and that exact deck resources close the Ticket. |
| `exp-003` | `symptom.storage.predictive_failure_warning` → `fault.storage.drive.predictive_failure` → `test.storage.predictive_health` / `repair.storage.replace_predictive_drive` / `verify.storage.predictive_replacement`; affected storage media | Author one fingerprint/Ticket path and two response Cards using the selected R620 amber/green + management “Failure Predicted” + successful-rebuild source. Preserve the distinction between predictive risk and already-failed media. |
| `exp-004` | `symptom.management.alert_persists` → `fault.management.alert.stale` → `test.management.event_log_freshness` / `repair.management.clear_stale_alert_state` / `verify.management.alert_does_not_recur`; affected BMC/diagnostics | Author one fingerprint/Ticket path and two response Cards. Resolve the source's combined DSET probe+clear through explicit Test Evidence and Repair state mutation; never hide both in one ambiguous action. |
| `exp-005` | `symptom.network.link_flapping` → `fault.firmware.version_set.incompatible` → `test.firmware.version_compatibility` / `repair.firmware.restore_compatible_versions` / `verify.firmware.compatible_persistent`; affected BMC/NIC | Author one fingerprint/Ticket path and two response Cards; retain version values as Ticket provenance and make hardware distractors differentiable without implying an unproved internal mechanism. |
| `exp-006` | `symptom.management.bmc_not_responding` → `fault.management.bmc_firmware.corrupt` → `test.management.bmc_recovery_state` / `repair.management.recover_bmc_firmware` / `verify.management.bmc_functional`; affected BMC/system board | Author one fingerprint/Ticket path and two response Cards using the GA-7PESH2 UART/TFTP recovery source; keep those interfaces as source/Ticket detail and review the existing Repair's tool/protocol applicability rather than inventing a Command. |

## Command exposure, usefulness, and requirement

These columns are intentionally independent. “Catalog exposed” means the current Global Diagnostic Bench publishes the Command. “Useful” is limited to the selected case evidence. “Required Isolation” is not inferred from usefulness.

| Case | Command | Catalog exposure | Useful evidence-gathering role | Required Isolation role | Integration note |
| --- | --- | --- | --- | --- | --- |
| `exp-001` | None executed | Not applicable | No | No | Physical comparison and inspection carry the source diagnosis. |
| `exp-002` | None executed | Not applicable | No | No | Supply/bay comparisons and power-path Tests carry the source diagnosis. |
| `exp-003` | `command.linux.smartctl` | Yes | No current Command is source-supported; management software supplies the predictive state | No | Later authoring may use controller-derived `test.storage.predictive_health`. Do not alter `smartctl` or force it into Isolation. |
| `exp-004` | `command.ipmi.sel_elist` | Yes | Potential equivalent log acquisition, but DSET—not this Command—is the source path | No | Do not alias DSET to a Command; map its diagnostic function to the Test and its state change to the Repair. |
| `exp-005` | `command.linux.ethtool` | Yes | Potential corroborating carrier/counter evidence; not executed by the selected source | No | Any Ticket outcome/route use requires later authoring and solvability review. |
| `exp-006` | vendor flash utility; `command.ipmi.sel_elist` | Flash utility: no Diagnostic Command; SEL listing: yes | Flash utility is Repair tooling; SEL listing is unavailable during the reported outage and optional after recovery | No | Do not turn recovery tooling into a Command or change current Command semantics. |

No selected case presently establishes a required Command action for Isolation. That is a research result, not a prohibition on later truthful route authoring and not a request to redesign Commands.

## Cross-cutting relationship checks for TASK-042

1. **Stable references:** confirm the six Symptoms' `associated_fault`, six Faults' `effective_test`/`eligible_repair`/`eligible_validation`, and all component/tool/protocol requirements still resolve in the version selected for integration.
2. **Provenance:** attach or reconcile each existing primary record to the reviewed case source without overwriting earlier provenance. Record source-specific scope and uncertainty, especially the R620 controller-management acquisition path and GA-7PESH2 UART/TFTP recovery compatibility.
3. **Fingerprint boundary:** create no research objects. Later fingerprints must distinguish public candidates, server-only truth, target/machine states, every offered diagnostic outcome, typed alternative routes, and closure requirements.
4. **Playable boundary:** all current Tests/Commands are already Global Bench definitions; the six Repairs and six Validations require response Cards. Prove exact response-deck quantities and complete-or-none solvability rather than counting domain actions as playable Cards.
5. **DSET boundary:** the real-world combined probe+clear action may justify linked Test/Repair events or an authoring constraint, but research cannot change the frozen action/event model. Escalate genuine pressure instead of silently encoding it.
6. **Teaching boundary:** the six episode objectives and route choices must be selected from the evidence matrix; domain presence does not establish what a player will exercise.

## Stop conditions carried forward

- A selected case is used to justify a relationship it does not execute or verify.
- A vendor alias becomes a duplicate ID.
- A Command becomes required only to satisfy a family count.
- A source-specific version, LED, event string, or recovery method is generalized as universal truth.
- A fingerprint lacks deterministic outcomes or an exact deck/Bench solution.
- Any existing draft object is published without provenance review.
