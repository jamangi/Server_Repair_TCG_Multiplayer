# Found database coverage — `exp-001`

Case focus: damaged CPU-socket contacts. The source phrases are concise research paraphrases, not quotations. Classification is one of `exact`, `generic_semantic`, `alias`, `educational_detail`, or `uncertain`; confidence applies to the mapping.

| Source phrase | Lifecycle step | Stable entity and type | Classification | Confidence and rationale |
| --- | --- | --- | --- | --- |
| server does not complete startup after the additional processors are installed | Observe | `symptom.boot.no_post` — Symptom | `generic_semantic` | High: the failed startup is the canonical no-POST observation even though the source reports a vendor event code as well. |
| processor/socket connection is the remaining location candidate | Hypothesize / Isolate | `component.compute.cpu_socket` — Component | `exact` | High: the source narrows the failure to one physical processor socket after parts work elsewhere. |
| processors and memory work when moved away from the suspect location | Test | `test.general.minimum_configuration` — Test | `generic_semantic` | Medium: staged population and removal are a minimum-configuration comparison, although the current Test does not encode every socket permutation. |
| slightly bent socket contacts are found by close inspection | Test / Isolate | `test.compute.socket_magnified_inspection` — Test | `exact` | High: contact alignment and physical damage are the Test's defined evidence target. |
| bent CPU-socket contacts | Isolate | `fault.compute.cpu_socket.contacts_damaged` — Fault | `exact` | High: the concrete cause and current Fault have the same technical boundary. |
| careful contact correction | Repair | `repair.compute.restore_socket_contacts` — Repair Procedure | `exact` | High: the source restores contact integrity rather than replacing a functional processor. |
| inspection light or magnified view | Test | `tool.inspection.magnifier` — Tool | `generic_semantic` | Medium: the source establishes close visual inspection but does not identify a specific magnifier. |
| server starts and reports all installed processors and memory | Verify | `verify.compute.socket_path` — Validation Procedure | `exact` | High: the current validation explicitly checks cold start plus expected processor and dependent memory inventory. |
| controlled processor/socket handling | Repair | `protocol.service.cpu_socket_handling` — Protocol | `generic_semantic` | Medium: the careful intervention fits the protocol's function, but the source does not document a complete torque procedure. |

## Command role audit

| Source or stable Command | Catalog exposure | Useful evidence-gathering role here | Required Isolation role here | Rationale |
| --- | --- | --- | --- | --- |
| None executed | Not applicable | No | No | The source isolates the location through part comparisons and physical inspection, not a Command action. |
