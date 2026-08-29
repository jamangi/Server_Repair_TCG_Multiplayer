# Found database coverage — `exp-005`

Case focus: network-interface link alerts begin after a management-firmware change and stop after restoration of a known compatible version.

| Source phrase | Lifecycle step | Stable entity and type | Classification | Confidence and rationale |
| --- | --- | --- | --- | --- |
| repeated NIC link-down/link-up alerts | Observe | `symptom.network.link_flapping` — Symptom | `exact` | High: repeated carrier transitions are the canonical observation. |
| iDRAC management firmware | Observe / Hypothesize | `component.management.bmc` — Component | `alias` | High: iDRAC is the vendor management-controller implementation; the domain stays vendor-neutral. |
| NIC slot/port named by the alert | Observe / Hypothesize | `component.network.nic` — Component | `generic_semantic` | High: the source identifies a network-interface port without requiring a vendor-specific NIC object. |
| compare the onset of alerts with the firmware-version change | Test | `test.firmware.version_compatibility` — Test | `exact` | High: version correlation against a known compatible baseline is the Test's core function. |
| observe whether link transitions recur over time | Test / Verify | `test.network.link_counter_soak` — Test | `generic_semantic` | Medium: the source demonstrates non-recurrence of management link messages; it does not preserve every interface counter. |
| incompatible or regressed firmware set | Isolate | `fault.firmware.version_set.incompatible` — Fault | `exact` | High: behavior begins after the change and ceases after rollback, isolating version state rather than NIC hardware. |
| restore the compatible iDRAC firmware version | Repair | `repair.firmware.restore_compatible_versions` — Repair Procedure | `exact` | High: rollback is explicitly included in the current repair contract. |
| controlled firmware rollback and recovery | Repair | `protocol.service.firmware_change_control` — Protocol | `generic_semantic` | Medium: the source performs a rollback, while the complete protocol adds backup, dependency, power, and recovery controls. |
| link-flap alerts remain absent after rollback | Verify | `verify.firmware.compatible_persistent` — Validation Procedure | `exact` | High: persistence and affected-device initialization without regression are the current validation goal. |
| management interface used for version work | Test / Repair | `tool.management.bmc_console` — Tool | `generic_semantic` | High: the vendor interface is a concrete management-console path. |

## Command role audit

| Source or stable Command | Catalog exposure | Useful evidence-gathering role here | Required Isolation role here | Rationale |
| --- | --- | --- | --- | --- |
| `command.linux.ethtool` | Yes | Potentially, for carrier/counter corroboration; not source-executed | No | The source's decisive evidence is version correlation and rollback/non-recurrence. Do not manufacture an `ethtool` requirement. |
