# Not-found database coverage — `sfp-076`

| Source phrase | Step / category | Likely category | Nearest existing entities | Why insufficient | Gap kind |
| --- | --- | --- | --- | --- | --- |
| graphics card and sound device as competing candidates | 2 / Hypothesize | Component | `component.pcie.card` | A generic PCIe card can cover some graphics hardware, but there is no sound-device representation and the alternatives are incidental to this resolved thermal case. | educational detail |
| Cool ’n’ Quiet change | 3 / Test | Test or educational detail | `test.firmware.settings_review` | Reviewing settings does not model changing a CPU power-management feature and observing whether the symptom recurs. The named feature is platform-specific. | educational detail |
| OS temperature-monitor application | 5 / Test | Tool or Command | `tool.management.bmc_console`, `test.thermal.temperature_monitoring` | The temperature test exists but currently requires a management controller console; the source obtains telemetry from an operating-system sensor tool on non-BMC hardware. | missing object |
| `cpuburn` | 6 / Test | Command or Tool | `test.system.controlled_stress` | The generic stress test covers the action, but no executable stress command/tool is represented. Since the source only recommends it, this may be an alias rather than a required core object. | alias |
| BIOS thermal cutoff threshold | 6 / Test | Protocol or educational detail | `test.firmware.settings_review` | The test can inspect settings, but no reusable platform rule defines safe threshold interpretation. Hardware-specific limits may belong in education/scenario data instead of a protocol. | educational detail |
| post-repair idle temperature without repeated load | 10 / Verify | Validation Procedure | `verify.thermal.load_test` | The existing validation is stronger than the source evidence. A weaker idle-only validation would not demonstrate that shutdown under load is gone. | educational detail |
