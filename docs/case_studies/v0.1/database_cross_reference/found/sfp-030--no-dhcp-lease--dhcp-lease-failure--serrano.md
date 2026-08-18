# Found database coverage — `sfp-030`

The paired Symptom and Fault are intentionally excluded from target categories.

| Source phrase | Step | Stable entity and type | Classification | Confidence and rationale |
| --- | ---: | --- | --- | --- |
| DHCP configuration, discovery, offers, and leases | 1–3, 7–9 | `protocol.network.dhcp` — Protocol | `exact` | High: the transaction and repair concern DHCP directly. |
| inspect `eth0`, assigned addresses, and DHCP configuration | 2 | `test.network.interface_config` — Test | `exact` | High: the source inspects interface state and address configuration to diagnose the lease failure. |
| `ifconfig` output | 2 | `command.linux.ip_addr` — Command | `generic_semantic` | High: the literal command differs, but the existing command provides the same modern Linux interface/address inspection function. |
| virtual cable / virtual network path | 5 | `component.network.ethernet_cable` — Component | `uncertain` | Low: both represent the link path, but a hypervisor virtual link is not a physical Ethernet cable. |
| use `ethtool` to inspect the link | 5 | `command.linux.ethtool` — Command | `exact` | High: the source names the command directly, although it was suggested rather than executed. |
| cleanup worked and address service returned | 9 | `verify.network.connectivity` — Validation Procedure | `generic_semantic` | High: this validation explicitly covers `fault.network.dhcp.no_lease`; the source’s success report is less detailed than a formal connectivity check. |
