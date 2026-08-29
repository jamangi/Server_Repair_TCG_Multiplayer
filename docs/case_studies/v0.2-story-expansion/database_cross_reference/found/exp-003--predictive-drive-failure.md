# Found database coverage — `exp-003`

Case focus: predictive drive failure on a Dell PowerEdge R620. This reconciliation is for the stronger selected source whose Dell conversation URL has identifier `647f7b52…`; it preserves the amber/green indicator comparison, management “Failure Predicted” evidence, replacement, and successful rebuild.

| Source phrase | Lifecycle step | Stable entity and type | Classification | Confidence and rationale |
| --- | --- | --- | --- | --- |
| drive indicator changes between amber warning and green activity/healthy state | Observe / Test | `component.chassis.diagnostics` — Component | `generic_semantic` | High: the vendor LED semantics are a platform-specific instance of the generic diagnostic-indicator component. |
| predictive-failure warning while the disk remains online | Observe | `symptom.storage.predictive_failure_warning` — Symptom | `exact` | High: online-but-at-risk media is the current Symptom's defining distinction. |
| affected enterprise disk | Observe / Repair | `component.storage.sas_hdd` — Component | `generic_semantic` | Medium: the platform and RAID context support a SAS member, but the stable object deliberately remains vendor-neutral. |
| management software reports “Failure Predicted” for the same member | Test / Isolate | `test.storage.predictive_health` — Test | `generic_semantic` | High: the controller warning is within the Test's predictive evidence family; no SMART attribute or executable is claimed. |
| controller/array status and rebuild state | Test / Verify | `test.storage.raid_status` — Test | `generic_semantic` | High: the source observes member and rebuild state through the controller path. |
| RAID management interface used to identify the exact member | Test / Repair | `tool.storage.raid_console` — Tool | `generic_semantic` | High: vendor management UI/utility is a concrete implementation of the generic tool. |
| drive has crossed a predictive threshold | Isolate | `fault.storage.drive.predictive_failure` — Fault | `exact` | High: the source distinguishes a predictively failing online drive from an already absent member. |
| protect data, identify the correct bay, and replace the warned drive | Repair | `repair.storage.replace_predictive_drive` — Repair Procedure | `exact` | High: the existing procedure includes preservation and exact member identification before replacement. |
| preserve member identity and rebuild state | Repair | `protocol.service.storage_data_preservation` — Protocol | `generic_semantic` | Medium: those controls are evident in the sequence even if the source does not name a formal protocol. |
| replacement member rebuilds successfully and the warning clears | Verify | `verify.storage.predictive_replacement` — Validation Procedure | `exact` | High: successful rebuild, healthy array state, and clean predictive status are its explicit conditions. |

## Command role audit

| Source or stable Command | Catalog exposure | Useful evidence-gathering role here | Required Isolation role here | Rationale |
| --- | --- | --- | --- | --- |
| `command.linux.smartctl` | Yes | No current Command is source-supported | No | The source uses a management “Failure Predicted” state and does not establish SMART attributes or this executable. The current Test consumes controller evidence without changing Command semantics. |
