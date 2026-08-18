# Found database coverage — `sfp-076`

The paired Symptom and Fault are intentionally excluded from target categories.

| Source phrase | Step | Stable entity and type | Classification | Confidence and rationale |
| --- | ---: | --- | --- | --- |
| CPU | 5, 7, 8 | `component.compute.cpu` — Component | `exact` | High: the monitored and serviced processor is the CPU. |
| CPU heatsink | 7, 8 | `component.cooling.cpu_heatsink` — Component | `exact` | High: the source identifies the heatsink directly. |
| thermal paste | 8 | `component.cooling.tim` — Component | `exact` | High: thermal paste is the represented thermal interface material. |
| motherboard | 2, 3 | `component.board.system` — Component | `generic_semantic` | High: this is the existing generic system-board candidate. |
| PSU | 1, 2 | `component.power.hot_swap_psu` — Component | `uncertain` | Medium: diagnostic role matches, but the source uses a desktop ATX unit rather than hot-swap server hardware. |
| watch CPU temperature rise to about 81 °C | 5 | `test.thermal.temperature_monitoring` — Test | `exact` | High: collecting temperature telemetry under load is the test’s function. |
| full-screen visualization / suggested `cpuburn` | 5, 6 | `test.system.controlled_stress` — Test | `generic_semantic` | High: both intentionally load the processor to reproduce the failure. |
| review BIOS thermal cutoff | 6 | `test.firmware.settings_review` — Test | `generic_semantic` | High: the suggested inspection concerns a firmware threshold. |
| apply new thermal paste to CPU and heatsink | 8 | `repair.thermal.restore_heatsink_contact` — Repair Procedure | `exact` | High: renewing the interface restores contact/heat transfer. |
| dedust and improve airflow | 9 | `repair.thermal.clean_cooling_path` — Repair Procedure | `generic_semantic` | High for dedusting and medium for cable routing; both aim to clear cooling airflow. |
| report solved and 35 °C idle | 10 | `verify.thermal.load_test` — Validation Procedure | `uncertain` | Low: the original load symptom is reported solved, but only an idle temperature is quantified and no post-repair controlled load is shown. |
