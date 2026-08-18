# Found database coverage — `sfp-057`

The paired Symptom and Fault are intentionally excluded from target categories.

| Source phrase | Step | Stable entity and type | Classification | Confidence and rationale |
| --- | ---: | --- | --- | --- |
| 146 GB SAS drive / failed bay member | 1, 2, 7, 8 | `component.storage.sas_hdd` — Component | `exact` | High: the source explicitly identifies SAS hard drives. |
| P400 RAID controller | 4, 6 | `component.storage.raid_controller` — Component | `generic_semantic` | High: the vendor model is a RAID controller. |
| HP System Management Homepage, ACU, and ADU | 3, 5–7 | `tool.storage.raid_console` — Tool | `generic_semantic` | High: these vendor utilities expose array/member state and diagnostic reports; the existing tool intentionally abstracts product branding. |
| inspect logical-drive, bay, and rebuild status | 3, 5 | `test.storage.raid_status` — Test | `exact` | High: the observed status, percent, and bay state are RAID status inspection. |
| predictive failure and hard read errors | 7 | `test.storage.drive_health` — Test | `generic_semantic` | High: ADU rather than `smartctl` produces the evidence, but the test function is drive-health diagnosis. |
| SAS | 1 | `protocol.interface.sas` — Protocol | `exact` | High: the source names the drive interface. |
| RAID 5 | 1, 8 | `protocol.raid.raid5` — Protocol | `exact` | High: the source names the array level and its single-failure tolerance is central to the explanation. |
| hot-plug a replacement member | 2, 9 | `repair.storage.replace_raid_member` — Repair Procedure | `exact` | High: the initial replacement is executed and replacement of the second failed member is prescribed. |
| rebuild the array | 3, 5, 9 | `repair.storage.rebuild_array` — Repair Procedure | `exact` | High: automatic/manual rebuild attempts and recovery concern RAID reconstruction. |
| check rebuild completion and logical-drive status | 3, 10 | `verify.storage.raid_healthy` — Validation Procedure | `exact` | High for the intended validation: step 3 records a failed result. Step 10 does not provide enough evidence to claim a later pass. |
