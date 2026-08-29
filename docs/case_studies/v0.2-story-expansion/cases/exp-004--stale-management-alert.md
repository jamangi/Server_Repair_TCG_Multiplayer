# `exp-004` — Stale management alert

## Research boundary

This is a source-preserving TASK-041 reduction. It supports later review of a distinct episode but does not authorize domain, gameplay, or Story content.

## Source and eligibility

- **Primary source:** [PE2900 backplane degraded](https://www.dell.com/community/en/conversations/poweredge-hddscsiraid/pe2900-backplane-degraded/647e8b20f4ccf8a8dede59e9)
- **Firsthand reporters / publisher:** `byurick`, `ghri-bh`, `chrisnella`, with Dell community contributors; Dell Technologies Community
- **Source period / access:** 2007-12-28 through 2012-05-01; accessed 2026-08-28
- **Eligibility:** Eligible as a multi-reporter thread. Healthy live state is compared with a persistent warning, an ordinary clear fails for one reporter, and a fresh DSET probe plus clear removes the obsolete condition.
- **Lifecycle score:** 9/10; Document is absent.

## Copyright-safe paraphrase

After a failed drive had been replaced and array operation recovered, management software continued to mark a backplane or enclosure as degraded even though drives, indicators, and detailed hardware state were healthy. One reporter says clearing the management logs alone did not remove the condition. A DSET run performed a fresh hardware probe while also clearing logs/status; the warning disappeared, and the reporter concluded that the backplane was healthy and the displayed condition was stale.

## Lifecycle reduction

| # | Category | Atomic source event | Lifecycle contribution | Fidelity | Source locator | Current stable-object cross-reference |
| ---: | --- | --- | --- | --- | --- | --- |
| 1 | Observe | After drive replacement and successful rebuild or recognition, management still displayed a degraded backplane while drives, detailed parts, and physical indicators were healthy. | Establishes a disagreement between the alert and current hardware evidence. | explicit | Opening post and 2012 follow-ups | `symptom.management.alert_persists`; `component.chassis.diagnostics`; `component.storage.backplane` |
| 2 | Hypothesize | Contributors considered an actual backplane/interposer condition, old management state, firmware/software state, and the prior drive event. | Preserves a live-FRU alternative while introducing a stale-state explanation. | explicit | Replies dated 2007-12-28 and 2012-05-01 | `fault.storage.backplane.path_failed`; `fault.management.alert.stale` |
| 3 | Test | A reporter cleared the ordinary management logs and the degraded indication persisted. | Contradicts a simple log-entry-only explanation while leaving broader cached/controller state plausible. | explicit | `ghri-bh` follow-up dated 2012-05-01 | Generic management log clear; not an exact existing Command execution |
| 4 | Test | DSET freshly probed the server hardware during the successful run. | Re-evaluates current hardware instead of relying only on the displayed historical state. | explicit | `ghri-bh` resolution posts | `test.management.event_log_freshness` as the closest current Test; DSET itself has no stable object |
| 5 | Isolate | The reporter concluded that the backplane was healthy and the degraded condition was obsolete state left by the earlier drive failure. | Crosses from a possible backplane FRU fault to stale management state. | explicit | `ghri-bh` resolution | `fault.management.alert.stale`; rules out `fault.storage.backplane.path_failed` for this occurrence |
| 6 | Repair | The same successful DSET invocation cleared logs/status while it performed the fresh probe. | Changes the obsolete management state, but is not separable from the preceding Test in the source. | explicit | `ghri-bh` resolution | `repair.management.clear_stale_alert_state` as a generic equivalent |
| 7 | Verify | The degraded-backplane indication cleared after that run. | Confirms that the reported management state no longer showed the obsolete condition. | explicit | `chrisnella` and `ghri-bh` resolution posts | `verify.management.alert_does_not_recur`, with no long recurrence interval reported |

## Absent stage

- **Document:** DSET produces a report by design, but the source does not say the operator saved, attached, or handed off that report as a distinct documentation action.

## Combined probe/clear pressure

Rows 4 and 6 describe two functions of one source event, not two independently executed actions. The case therefore supplies valuable evidence but pressures any later design that requires Test to be read-only and Repair to occur only after Isolation. Later work must preserve that limitation rather than silently converting the DSET run into two source-backed operations.

## Uncertainties, alternate source, and safety boundary

- The thread combines several machines and reporters; not every preliminary step belongs to the same server.
- The source verifies alert clearance, not a prolonged recurrence test under a defined workload.
- DSET and OMSA are vendor aliases, not automatic candidates for new domain objects or Commands.
- A [later PE2900 warning thread](https://www.dell.com/community/en/conversations/north-america-english-poweredge-out-of-warranty-support/poweredge-2900-perc-6i-backplane-degraded-driver-out-of-date/647f759df4ccf8a8de3a00af) reports resolution after a management-software update but lacks this source's explicit stale-state explanation.
- Preserve logs before clearing them. Clearing or resetting management state can destroy evidence and can mask a recurring hardware fault; current hardware must be re-exercised and observed afterward.

## Distinct-episode value

The case can support an episode in which the accountable outcome is “no current FRU fault” and the work is evidence preservation, refresh, and recurrence checking—not unnecessary backplane replacement. It does not authorize a no-fault rule, a new relationship, or gameplay semantics.
