# Not-found database coverage — `exp-001`

These phrases have no separate canonical object. None is a new-object recommendation.

| Source phrase | Lifecycle step | Classification | Nearest existing entities | Why no direct match / disposition |
| --- | --- | --- | --- | --- |
| Dell PowerEdge R910 platform | Observe | `educational_detail` | `component.board.system`, `component.compute.cpu_socket` | Whole platform/model identity is scenario context, not a separately serviceable generic object. |
| E1410/failsafe event code | Observe | `educational_detail` | `symptom.boot.no_post`, `component.chassis.diagnostics` | The vendor code can flavor public context; its reusable observation is already the no-POST/diagnostic-indicator state. |
| every CPU/RAM socket-population permutation used during comparison | Test | `uncertain` | `test.general.minimum_configuration`, `test.compute.socket_magnified_inspection` | The exact permutation sequence is incompletely represented by one Test, but the selected evidence route can use staged configuration plus decisive inspection. Do not invent a new object from platform-specific population rules. |
| exact hand technique used to realign individual contacts | Repair | `educational_detail` | `repair.compute.restore_socket_contacts`, `protocol.service.cpu_socket_handling` | The existing repair intentionally requires qualification or board-FRU replacement. A forum technique cannot become an unsupported procedure. |
