# Not-found database coverage — `sfp-030`

| Source phrase | Step / category | Likely category | Nearest existing entities | Why insufficient | Gap kind |
| --- | --- | --- | --- | --- | --- |
| IPv4 and IPv6 | 1, 4 / Observe, Test | Protocol | `protocol.network.dhcp` | DHCP can operate within the scenario but does not represent either network-layer protocol or their distinct address states. | missing object |
| Ubuntu VM / ESX virtual NIC path | 1, 5 / Observe, Hypothesize | Component | `component.network.nic`, `component.network.ethernet_cable` | Physical NIC and cable entities cannot precisely target a VM’s virtual adapter or port-group connection. This may be a future virtualization expansion rather than a core gap. | missing object |
| `dhclient -4 -r -v`, `dhclient -4 -v`, and direct-server request | 3 / Test | Command | `command.linux.ip_addr`, `protocol.network.dhcp` | Existing entries inspect addresses or name the protocol; none executes DHCP release/renew with verbose transaction output. | missing object |
| interpret DHCPDISCOVER with no DHCPOFFER | 3 / Test | Test | `test.network.interface_config` | Interface inspection can confirm a missing address but does not model a DHCP transaction test or interpret absent offers. | missing object |
| traffic dump and DHCP packet analysis | 5 / Hypothesize | Command or Test | `command.linux.ethtool`, `test.network.link` | Link inspection cannot capture or analyze DHCP packets. The suggestion implies a packet-capture command/tool plus a protocol-analysis test. | missing object |
| record configuration files and command transcripts for collaborators | 6 / Document | `cardless_action` | None | No allowed domain-object type represents selecting an action and publishing its attached configuration and Evidence record. | mechanic |
| inspect available IPv4 addresses and stale reservations | 7 / Isolate | Test | `test.network.interface_config` | Client interface state does not inspect server-side address-pool capacity or reservation occupancy. | missing object |
| remove old DHCP reservations | 8 / Repair | Repair Procedure | `repair.network.correct_static_ip` | Correcting one client’s static IP does not free addresses in a DHCP server’s pool. | missing object |
| obtain and inspect a post-repair DHCP lease | 9 / Verify | Validation Procedure | `verify.network.connectivity` | The existing validation can accept general connectivity, but it does not require evidence of the expected lease, server, address, or lease options. | missing object |
