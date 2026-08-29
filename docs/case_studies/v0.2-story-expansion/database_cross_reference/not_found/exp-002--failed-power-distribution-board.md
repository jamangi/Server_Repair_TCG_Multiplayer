# Not-found database coverage — `exp-002`

These phrases have no separate canonical object. None is a new-object recommendation.

| Source phrase | Lifecycle step | Classification | Nearest existing entities | Why no direct match / disposition |
| --- | --- | --- | --- | --- |
| Dell PowerEdge T420 platform | Observe | `educational_detail` | `component.board.system`, `component.power.distribution_board` | The platform name is case context; the serviceable PDB boundary already exists generically. |
| VLT0204 and exact main-board voltage wording | Observe | `alias` | `symptom.power.voltage_out_of_range`, `component.chassis.diagnostics` | The code and wording are vendor aliases for the reusable voltage/power-good observation. |
| model-specific rail/pinout values discussed but not preserved as executed readings | Test | `uncertain` | `test.power.output_voltage_measurement`, `protocol.safety.deenergize_discharge` | The existing Test requires documented platform values and safe measurement. Missing source readings stay missing rather than becoming new evidence or a new object. |
| “main board” used ambiguously for a shared power board | Hypothesize | `alias` | `component.power.distribution_board`, `component.board.system` | Reconciliation follows the replaced PDB FRU, not the colloquial board label; no duplicate board Component is needed. |
