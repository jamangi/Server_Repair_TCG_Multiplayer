# Found database coverage — `sfp-039`

The paired Symptom and Fault are intentionally excluded from target categories.

| Source phrase | Step | Stable entity and type | Classification | Confidence and rationale |
| --- | ---: | --- | --- | --- |
| motherboard | 2 | `component.board.system` — Component | `generic_semantic` | High: “motherboard” and generic system board have the same candidate role here. |
| ATX PSU | 1–8 | `component.power.hot_swap_psu` — Component | `uncertain` | Medium: both are replaceable power supplies for the diagnostic sequence, but the source unit is not hot-swappable and uses an ATX interface. |
| multimeter / DC voltmeter | 4 | `tool.electrical.multimeter` — Tool | `exact` | High: commenters explicitly propose connector-voltage measurement. |
| replacement PSU used to test the motherboard | 5 | `tool.known_good.psu` — Tool | `generic_semantic` | High: the new PSU functions as a known-good substitution part. |
| source a PSU and see whether the machine works | 5 | `test.power.known_good_psu` — Test | `exact` | High: the successful substitution distinguishes the old PSU from the board. |
| replace the failed PSU | 7 | `repair.power.replace_psu` — Repair Procedure | `exact` | High: the failed unit is replaced. |
| replacement solved the no-power problem | 8 | `verify.power.stable` — Validation Procedure | `generic_semantic` | High: restored operation after replacement verifies power at the level preserved in the source. |
