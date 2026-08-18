# Found database coverage — `sfp-012`

The paired Symptom and Fault are intentionally excluded from target categories. Confidence is `high`, `medium`, or `low` and applies to the stated mapping, not to the source’s truthfulness.

| Source phrase | Step | Stable entity and type | Classification | Confidence and rationale |
| --- | ---: | --- | --- | --- |
| DIMM / single 8 GB DIMM | 1, 2 | `component.memory.ecc_dimm` — Component | `generic_semantic` | Medium: the source establishes a server DIMM but does not spell out ECC. |
| flashing amber LED in the four-LED display | 1, 3 | `component.chassis.diagnostics` — Component | `generic_semantic` | High: the generic diagnostic-indicator component covers this vendor-specific LED bank. |
| fan activity returned | 4 | `component.cooling.fan` — Component | `generic_semantic` | High: the observed fans serve the same chassis-cooling role. |
| ESD wrist strap / ESD handling | 3 | `tool.safety.esd_strap` — Tool | `exact` | High: the responder explicitly asks whether an ESD wrist strap was used. |
| ESD precautions | 3 | `protocol.safety.esd` — Protocol | `exact` | High: the source discusses electrostatic-discharge risk during component handling. |
| remove peripherals and try the essential system | 2 | `test.general.minimum_configuration` — Test | `generic_semantic` | Medium: the operator reports broad peripheral removal; the responder’s complete minimum-to-POST list was recommended but not fully confirmed. |
| replace the single DIMM with another | 5 | `test.memory.known_good_substitution` — Test | `exact` | High: substituting another DIMM and comparing POST is the defined diagnostic function. |
| another DIMM used for substitution | 5 | `tool.known_good.dimm` — Tool | `generic_semantic` | High: the replacement functions as a known-good diagnostic part even though its prior validation is unstated. |
| single-DIMM comparison | 5, 6 | `test.memory.single_dimm_isolation` — Test | `generic_semantic` | High: one module is tested in isolation and distinguished by substitution. |
| replace failed DIMM | 7 | `repair.memory.replace_dimm` — Repair Procedure | `exact` | High: the isolated memory module is replaced. |
| POST returned | 8 | `verify.boot.post` — Validation Procedure | `exact` | High: restored POST is the explicit success condition. |
| running with four 8 GB DIMMs | 8 | `verify.memory.inventory` — Validation Procedure | `generic_semantic` | Medium: the report confirms the installed capacity/configuration operates, though it does not show a formal inventory screen. |
