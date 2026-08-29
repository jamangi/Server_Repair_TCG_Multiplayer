# Found database coverage — `exp-006`

Case focus: GA-7PESH2 baseboard-management-controller recovery. Source: [GA-7PESH2 BMC Recovery](https://forums.serverbuilds.net/t/ga-7pesh2-bmc-recovery/882).

| Source phrase | Lifecycle step | Stable entity and type | Classification | Confidence and rationale |
| --- | --- | --- | --- | --- |
| baseboard management interface is unavailable or does not initialize | Observe | `symptom.management.bmc_not_responding` — Symptom | `exact` | High: loss of controller reachability is the canonical observation. |
| management/lifecycle functions are unavailable | Observe | `symptom.management.lifecycle_unavailable` — Symptom | `generic_semantic` | Medium: the board is not a Dell Lifecycle Controller platform, but the same management capability is unavailable. |
| failed or damaged BMC firmware state | Hypothesize / Isolate | `fault.management.bmc_firmware.corrupt` — Fault | `exact` | High: successful firmware recovery without replacing unrelated hardware supports this concrete cause. |
| AST-family onboard management controller | Observe / Repair | `component.management.bmc` — Component | `alias` | High: the chip/platform name is a vendor implementation of the generic embedded BMC. |
| determine whether the controller responds and accepts recovery mode | Test | `test.management.bmc_recovery_state` — Test | `exact` | High: reachable/resettable/recovery/unrecoverable state is the Test's defined decision. |
| UART output exposes a recoverable controller boot state | Test | `tool.management.bmc_console` — Tool | `uncertain` | Medium: the current generic console is the nearest management access surface, but UART hardware/access is not itself a current Tool or Command. |
| recover or reflash the BMC firmware | Repair | `repair.management.recover_bmc_firmware` — Repair Procedure | `exact` | High: the source's successful intervention is the current procedure's central recovery path. |
| controlled image selection and recovery path | Repair | `protocol.service.firmware_change_control` — Protocol | `generic_semantic` | Medium: the source supplies a platform path, while the protocol adds the broader compatibility and rollback controls. |
| management access and normal controller functions return | Verify | `verify.management.bmc_functional` — Validation Procedure | `exact` | High: restored access/function after recovery is the required validation boundary. |
| restored management UI/console | Verify | `tool.management.bmc_console` — Tool | `generic_semantic` | High: the specific web/management interface fits the generic console surface. The source's TFTP transfer is Repair transport, not diagnostic evidence. |

## Command role audit

| Source or stable Command | Catalog exposure | Useful evidence-gathering role here | Required Isolation role here | Rationale |
| --- | --- | --- | --- | --- |
| vendor firmware-flash utility | No matching Diagnostic Command | No; it changes firmware state as part of Repair | No | A recovery executable is not automatically a gameplay Command. It maps to the approved recovery procedure/tooling and does not change Command semantics. |
| `command.ipmi.sel_elist` | Yes | No while the BMC is unreachable; optional only after recovery | No | Listing events neither performs recovery nor supplies the source's Isolation proof. |
