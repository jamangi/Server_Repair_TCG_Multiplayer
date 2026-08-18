# `sfp-057` — Degraded RAID 5 with failed SAS members

## Pair identity

- Symptom: `symptom.storage.raid_degraded` — RAID Degraded
- Fault: `fault.storage.sas.drive_failed` — Failed SAS Drive

## Source

- [Rebuild RAID5 in HP PROLIANT ML370 G5](https://community.hpe.com/t5/hpe-proliant-servers-ml-dl-sl/rebuild-raid5-in-hp-proliant-ml370-g5/td-p/5544761)
- Firsthand author: S. Swaminathan; diagnostic report interpreted by Vijayasarathy
- Hewlett Packard Enterprise Community, 2012-02-09 through 2012-02-19; accessed 2026-08-18

## Selection

**Score: 10/10.** The thread gives an exact SAS/RAID 5 match, competing controller and member explanations, repeated state inspections and substitutions, an attached controller diagnostic report, slot-level Isolation, corrective recovery, and a final restored-server report. Some final array-health detail remains absent.

## Synopsis

A three-member RAID 5 made from 146 GB SAS drives degraded. The operator hot-plugged a new drive for a failed Bay 1 member, but rebuild progress stopped and returned to “Ready for Rebuild.” Reinsertions and management-utility status produced confusing Bay 1/Bay 3 evidence. An attached Array Diagnostic Utility report showed hard read errors and predictive failure in Bay 3, explaining why parity reconstruction could not complete after the first failure. The operator backed up the system, rebuilt the server from scratch, and restored the backup.

## Lifecycle reduction

| # | Category | What happened | Lifecycle contribution | Fidelity | Source locator | Domain phrases |
| ---: | --- | --- | --- | --- | --- | --- |
| 1 | Observe | The three-drive, 146 GB SAS RAID 5 had degraded and showed a yellow/down state. | Establishes the exact degraded-array and SAS-member context. | explicit | Original post | SAS drive; RAID 5; degraded logical drive; yellow status |
| 2 | Repair | The operator hot-plugged a new drive in place of the failed Bay 1 member. | Performs the initial member replacement intended to repair the degraded array. | explicit | Original post and later clarification | hot-plug replacement; Bay 1; failed RAID member |
| 3 | Verify | Rebuild reached 15 percent, stalled, and returned to “Ready for Rebuild”; the degraded indicator remained. | Negative verification proves that the first repair did not restore the required array state. | explicit | Original post and first follow-up | rebuild progress; Ready for Rebuild; degraded status |
| 4 | Hypothesize | Participants considered controller firmware, a misleading status, the wrong bay, or another member failure as explanations for the stalled rebuild. | Reopens Diagnosis after the failed repair and identifies controller-versus-member candidates. | explicit | Replies and author follow-ups before the report | controller firmware; Bay 1; Bay 3; second drive |
| 5 | Test | The operator inspected Array Configuration Utility status, restarted once, reinserted the old drive and then the new drive, and compared rebuild behavior and bay indicators. | Generates comparative member and controller-state evidence; the conflicting Bay 3 indicator survives the Bay 1 replacement. | explicit | Follow-ups on 2012-02-09 and 2012-02-10 | RAID management utility; status code 776; identify drive; member substitution; bay indicator |
| 6 | Document | The operator generated and attached the P400 controller’s ADU diagnostic report to the support record. | Preserves detailed diagnostic evidence for another participant to interpret. | explicit | Post on 2012-02-13 | Array Diagnostic Utility report; controller report; attachment |
| 7 | Test | The report was interpreted as showing Bay 3 in predictive failure with hard read errors and no additional read/write errors elsewhere. | Converts the recorded diagnostic output into evidence that distinguishes the remaining members. | explicit | Accepted solution and clarification | predictive failure; hard read errors; physical drive 1I:1:3 |
| 8 | Isolate | Bay 3 was identified as a second failed SAS member whose read errors prevented RAID 5 reconstruction. | Crosses the Isolation gateway at slot level and explains the stalled rebuild causally. | explicit | Accepted solution and clarification | Bay 3 failed drive; RAID 5 reconstruction; replace drive |
| 9 | Repair | The source recommends replacing Bay 3; the operator then initiated a full backup, rebuilt the server from scratch, and restored that backup. | Records the prescribed component repair and the broader recovery actually reported, without claiming which unstated hardware action occurred during the rebuild. | explicit | Accepted solution; final author updates | replace RAID member; backup; rebuild server; restore data |
| 10 | Verify | The operator reports that the server was rebuilt and the full backup restored. | Confirms service-level recovery, but not an explicit healthy-array status or completed member rebuild. | explicit | Final resolution post, 2012-02-19 | server restored; backup restored |

## Absent stages

All seven categories appear. A full **Verify** of RAID health is absent: the final report does not state the logical-drive status, rebuild completion, or Bay 3 replacement outcome.

## Uncertainties and inferences

- The first failed Bay 1 member clearly caused the initial degraded state. The later report isolates a second failed Bay 3 member as the reason the replacement rebuild could not finish.
- Bay 3 replacement is recommended but not explicitly confirmed as executed. “Rebuilt from scratch” and “restored the full backup” must not be expanded into an invented drive-replacement sequence.
- The final server recovery is not equivalent to explicit `verify.storage.raid_healthy` evidence.

## Cross-reference analysis

- [Found database coverage](../database_cross_reference/found/sfp-057--raid-degraded--failed-sas-drive--s-swaminathan.md)
- [Not-found database coverage](../database_cross_reference/not_found/sfp-057--raid-degraded--failed-sas-drive--s-swaminathan.md)
