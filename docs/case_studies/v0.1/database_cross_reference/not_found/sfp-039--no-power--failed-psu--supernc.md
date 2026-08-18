# Not-found database coverage — `sfp-039`

| Source phrase | Step / category | Likely category | Nearest existing entities | Why insufficient | Gap kind |
| --- | --- | --- | --- | --- | --- |
| ATX paperclip self-start test | 3 / Test | Test or Protocol | `test.power.psu_status`, `test.power.known_good_psu` | Status inspection and substitution do not model jumpering the ATX control pin, loading the supply safely, or interpreting fan/output behavior. | missing object |
| zero-RPM PSU fan mode / internal PSU fan | 4 / Hypothesize | Component or educational detail | `component.cooling.fan`, `component.power.hot_swap_psu` | The existing fan is a chassis fan, and the PSU entity does not encode fan-control behavior. The distinction matters mainly to interpreting the paperclip test. | educational detail |
| measure 24-pin output voltages against the ATX pinout | 4 / Hypothesize | Test and Protocol | `tool.electrical.multimeter`, `test.power.psu_status` | The measuring tool exists, but no test defines rail measurements or a protocol defines the connector/pinout and expected values. | missing object |
| dedicated PSU tester | 4 / Hypothesize | Tool | `tool.electrical.multimeter`, `tool.known_good.psu` | The existing tools can diagnose the PSU differently but do not represent the dedicated tester named in the thread. | missing object |
