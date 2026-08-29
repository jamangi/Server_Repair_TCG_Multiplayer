# `exp-003` — Predictive drive failure

## Research boundary

This is a source-preserving TASK-041 reduction. It supports later review of a distinct episode but does not authorize domain, gameplay, or Story content.

## Source and eligibility

- **Primary source:** [PowerEdge R620 — drive predicted failure](https://www.dell.com/community/en/conversations/poweredge-hardware-general/poweredge-r620-drive-predicted-failure/647f7b52f4ccf8a8de9878d4)
- **Firsthand author / publisher:** `braunhtf`, with Dell community responders; Dell Technologies Community
- **Source period / access:** 2018-07-13 through 2018-07-19; accessed 2026-08-28
- **Eligibility:** Eligible. It identifies an online member through both a bay indicator and management status, records replacement, and explicitly reports a completed rebuild.
- **Lifecycle score:** 9/10; Document is absent.

## Copyright-safe paraphrase

One member of a two-drive operating-system RAID 1 remained online but alternated amber and green at the bay while management software reported predicted failure for member 0:1:0. The operator asked whether a matched replacement would rebuild. Contributors emphasized a tested backup, consistency checking where supported, correct media compatibility, and controller-safe replacement. The operator later reported replacing the member and a successfully completed rebuild.

## Lifecycle reduction

| # | Category | Atomic source event | Lifecycle contribution | Fidelity | Source locator | Current stable-object cross-reference |
| ---: | --- | --- | --- | --- | --- | --- |
| 1 | Observe | Drive 0:1:0 alternated amber and green while the server and RAID-1 volume remained operational. | Establishes a warning state before total media loss and identifies the physical bay. | explicit | Opening post | `symptom.storage.drive_fault_led`; `component.storage.sas_hdd` as a generic server-drive match |
| 2 | Hypothesize | The operator proposed that the warned member needed replacement and asked whether the array would rebuild onto a compatible new drive. | Treats the warning as a degradation hypothesis to be confirmed, not yet a completed failure. | explicit | Opening post | `fault.storage.drive.predictive_failure`; `repair.storage.replace_predictive_drive` as a candidate mapping only |
| 3 | Test | Management software reported “Failure Predicted” for the same member identified by the bay indicator. | Correlates physical location with controller/management health evidence. | explicit | Opening post | `symptom.storage.predictive_failure_warning`; `test.storage.predictive_health` as the closest current Test |
| 4 | Isolate | The online member at 0:1:0 was selected as the predictively failing drive from the matching location and management evidence. | Crosses from a generic array concern to one actionable member. | explicit | Opening post and responder interpretation | `fault.storage.drive.predictive_failure` |
| 5 | Repair | The operator replaced the identified drive. | Changes the isolated media state. | explicit | Final author update dated 2018-07-19 | `repair.storage.replace_predictive_drive` |
| 6 | Verify | The replacement rebuild started and completed successfully. | Confirms that the new member was incorporated and the reported rebuild reached completion. | explicit | Final author update | `verify.storage.predictive_replacement` |

## Absent stage

- **Document:** The thread contains a closing update, but no separate worklog, saved controller report, serial/bay record, or acceptance report is described.

## Uncertainties, alternate source, and safety boundary

- No SMART attribute, controller event export, or post-rebuild soak interval is preserved.
- The exact drive interface is not stated in the selected prose, so `component.storage.sas_hdd` is only a generic server-drive cross-reference, not an exact source claim.
- A valid tested backup, a supported consistency check, safe offlining, media compatibility, and foreign-configuration handling were guidance. The final update does not confirm that every advised step occurred.
- [PowerEdge 2800 RAID disk problem](https://www.dell.com/community/en/conversations/poweredge-hddscsiraid/poweredge-2800-raid-disk-problem/647f3a8bf4ccf8a8de193bf0) was retained as an alternate because its repeat-failure evidence is educational, but the R620 source has a clearer successful rebuild endpoint.
- Never infer that all arrays permit live removal. Preserve current data, capture the exact controller/member identity, follow the controller and platform procedure, and stop on ambiguous foreign, ready, failed, or rebuild state.

## Distinct-episode value

The case can support an episode about acting on predictive evidence while service still works, then requiring rebuild completion rather than treating physical replacement as proof. That differs from an already-offline failed-member episode. It authorizes no Card, fault relationship, or gameplay rule.
