# Found database coverage — `exp-004`

Case focus: stale management “backplane degraded” alert after the failed drive is replaced and the array is healthy.

| Source phrase | Lifecycle step | Stable entity and type | Classification | Confidence and rationale |
| --- | --- | --- | --- | --- |
| backplane-degraded message persists after hardware recovery | Observe | `symptom.management.alert_persists` — Symptom | `exact` | High: the management indication remains after fresh hardware checks show recovery. |
| storage backplane named by the alert | Observe / Hypothesize | `component.storage.backplane` — Component | `exact` | High: this is the FRU named by the vendor alert, not proof that it is faulty. |
| replacement drive is healthy and the array is no longer degraded | Test | `test.storage.raid_status` — Test | `exact` | High: current array/member health contradicts the stale management indication. |
| Dell System E-Support Tool (DSET) collection/probe refreshes management state | Test | `test.management.event_log_freshness` — Test | `generic_semantic` | High: preserving/refreshing management data and asking whether the target indication is current are the Test's exact diagnostic function. |
| management controller retains obsolete hardware state | Isolate | `fault.management.alert.stale` — Fault | `exact` | High: the alert clears without replacing the implicated backplane after the underlying drive repair. |
| DSET / vendor management diagnostics | Test / Repair | `tool.management.bmc_console` — Tool | `alias` | Medium: DSET is vendor-specific software, while the generic tool represents the management access surface rather than that product name. |
| clear or refresh obsolete alert state after evidence capture | Repair | `repair.management.clear_stale_alert_state` — Repair Procedure | `exact` | High: the current procedure deliberately separates state correction from hardware replacement. |
| preserve evidence, refresh, reproduce, and require a clean exit | Test / Verify | `protocol.service.ntf_screening` — Protocol | `exact` | High: this is the current no-trouble-found/stale-state sequence. |
| target backplane alert does not return after refresh | Verify | `verify.management.alert_does_not_recur` — Validation Procedure | `exact` | High: non-recurrence under the complaint conditions is the validation's explicit requirement. |

## Command role audit

| Source or stable Command | Catalog exposure | Useful evidence-gathering role here | Required Isolation role here | Rationale |
| --- | --- | --- | --- | --- |
| `command.ipmi.sel_elist` | Yes | Potentially, as an equivalent timestamped event-log acquisition path; not source-executed | No | DSET is not an alias for this Command. The source's combined probe/refresh maps to Test plus Repair and does not authorize a required Command. |
