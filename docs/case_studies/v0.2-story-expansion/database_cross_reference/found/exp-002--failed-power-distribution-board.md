# Found database coverage — `exp-002`

Case focus: failed power distribution board (PDB). The source phrases are concise research paraphrases, not quotations.

| Source phrase | Lifecycle step | Stable entity and type | Classification | Confidence and rationale |
| --- | --- | --- | --- | --- |
| main-board voltage is reported outside range and the server shuts down | Observe | `symptom.power.voltage_out_of_range` — Symptom | `exact` | High: the current Symptom covers an out-of-range rail or power-good indication. |
| both power supplies are tried one at a time and in both bays | Test | `test.power.distribution_path_isolation` — Test | `exact` | High: the Test is defined around known-good PSUs, supported bays, and a shared distribution path. |
| individual supply substitution | Test | `test.power.known_good_psu` — Test | `generic_semantic` | High: each comparison asks whether the problem follows a supply. |
| server reduced to minimum hardware | Test | `test.general.minimum_configuration` — Test | `exact` | High: the source removes downstream load/candidates before condemning the shared path. |
| PSU backplane / PDB | Observe / Isolate | `component.power.distribution_board` — Component | `alias` | High: “PSU backplane” and “PDB” name the replaceable power-distribution boundary represented by the generic Component. |
| failed shared power-distribution board | Isolate | `fault.power.distribution_board.failed` — Fault | `exact` | High: repeated supply/bay comparisons leave the shared board as the actionable cause. |
| replace the PDB | Repair | `repair.power.replace_distribution_board` — Repair Procedure | `exact` | High: the repaired FRU and current procedure match. |
| de-energize before internal power-board service | Repair | `protocol.safety.deenergize_discharge` — Protocol | `generic_semantic` | Medium: the service action requires this safety boundary, though the post does not enumerate the full protocol. Discussion of rail measurement is not counted as an executed Test. |
| server boots after replacement with stable power | Verify | `verify.power.distribution_path` — Validation Procedure | `generic_semantic` | High: restored cold start after replacement is part of the current validation; broader bay/redundancy checks remain the authored acceptance target. |

## Command role audit

| Source or stable Command | Catalog exposure | Useful evidence-gathering role here | Required Isolation role here | Rationale |
| --- | --- | --- | --- | --- |
| None executed | Not applicable | No | No | Physical supply/bay comparison and path measurements carry the diagnosis. |
