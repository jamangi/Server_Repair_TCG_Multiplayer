# Not-found database coverage — `sfp-012`

| Source phrase | Step / category | Likely category | Nearest existing entities | Why insufficient | Gap kind |
| --- | --- | --- | --- | --- | --- |
| PowerEdge R210 II server | 1 / Observe | Component | `component.board.system`, `component.chassis.diagnostics` | The database models serviceable parts, not a whole server/platform object. The platform name is useful context but not evidence that a new component is needed. | educational detail |
| reset and drain power / clear flea power | 4 / Test | Test or Protocol | `test.general.minimum_configuration`, `repair.power.reconnect_input` | Neither entity represents safely removing all power, discharging residual state, and interpreting which symptoms return afterward. | missing object |
