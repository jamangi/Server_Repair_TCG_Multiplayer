# Not-found database coverage — `exp-004`

The central objects already exist. One source operation exposes lifecycle/modeling pressure rather than a missing research object.

| Source phrase | Lifecycle step | Classification | Nearest existing entities | Why no direct match / disposition |
| --- | --- | --- | --- | --- |
| Dell System E-Support Tool (DSET) product name | Test / Repair | `alias` | `tool.management.bmc_console`, `test.management.event_log_freshness` | The product is one vendor acquisition/refresh implementation, not a reason for a new Tool or Command ID. |
| one DSET probe/log-collection operation also clears the stale indication | Test / Repair | `not_found` | `test.management.event_log_freshness`, `repair.management.clear_stale_alert_state` | No single current object should both create diagnostic Evidence and mutate machine/management state. Preserve the source's combined operation as lifecycle/modeling pressure; later gameplay integration must keep Test and Repair authority explicit rather than minting a research object. |
| “backplane degraded” vendor state string | Observe | `alias` | `symptom.management.alert_persists`, `component.storage.backplane` | The string names the implicated FRU, while fresh array health and clearing without FRU work establish stale alert state. |
| exact DSET package/version and collection filename | Document | `educational_detail` | `protocol.service.ntf_screening` | These may be provenance/work-record details, not reusable domain entities. |
