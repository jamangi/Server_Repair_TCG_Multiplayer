# Not-found database coverage — `exp-003`

These source details remain aliases or educational context. The selected evidence must retain the stronger Dell R620 source (`647f7b52…`) with amber/green indication, management predictive status, replacement, and successful rebuild.

| Source phrase | Lifecycle step | Classification | Nearest existing entities | Why no direct match / disposition |
| --- | --- | --- | --- | --- |
| Dell PowerEdge R620 and controller model | Observe | `educational_detail` | `component.storage.raid_controller`, `component.storage.sas_hdd` | Platform/controller names do not require vendor-specific Components. |
| exact amber/green drive-light convention | Observe / Test | `educational_detail` | `component.chassis.diagnostics`, `symptom.storage.predictive_failure_warning` | The color convention is useful scenario copy; the stable observation is a predictive warning, not a new indicator type. |
| vendor controller diagnostic command or screen name | Test | `alias` | `test.storage.predictive_health`, `tool.storage.raid_console` | The function is already represented. Do not create a Command for a product screen or harmless syntax variation. |
| exact bay, serial, and replacement-part identifiers | Repair / Verify | `educational_detail` | `repair.storage.replace_predictive_drive`, `verify.storage.predictive_replacement` | They belong in a Ticket snapshot/work record, not reusable domain IDs. |
