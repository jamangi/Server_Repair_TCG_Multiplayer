# `sfp-030` — No DHCP lease caused by exhausted IPv4 availability

## Pair identity

- Symptom: `symptom.network.no_dhcp_lease` — No DHCP Lease
- Fault: `fault.network.dhcp.no_lease` — DHCP Lease Failure

## Source

- [Ubuntu 16.04 LTS - DHCP deliver IPv6 but not IPV4](https://serverfault.com/questions/973255/ubuntu-16-04-lts-dhcp-deliver-ipv6-but-not-ipv4)
- Firsthand author: Alexandre Serrano; diagnostic contributor: Dennis Nolte
- Server Fault, 2019-06-28 through 2019-07-01; accessed 2026-08-18

## Selection

**Score: 10/10.** The account records the missing address and interface configuration, tests DHCP transactions, preserves competing server/link hypotheses, isolates address-pool exhaustion, records the evidence for collaborators, and confirms the reservation cleanup worked.

## Synopsis

An Ubuntu VM that had used DHCP successfully restarted with IPv6 but no IPv4 address. Interface inspection showed the link up and the interface configured for DHCP. Releasing and requesting an IPv4 lease, both by broadcast and directly from the known server, produced DHCPDISCOVER messages but no offers. A network administrator found no available IPv4 addresses, removed old reservations, and lease acquisition then worked.

## Lifecycle reduction

| # | Category | What happened | Lifecycle contribution | Fidelity | Source locator | Domain phrases |
| ---: | --- | --- | --- | --- | --- | --- |
| 1 | Observe | The restarted Ubuntu VM had an IPv6 address and working IPv6 SSH, but no IPv4 address despite having worked the previous day. | Establishes an IPv4-specific lease failure rather than total network loss. | explicit | Question opening and accepted answer | Ubuntu VM; IPv6; no IPv4; DHCP |
| 2 | Observe | Interface output showed `eth0` up and the network configuration declared IPv4 DHCP. | Adds link and configuration state to the initial observation. | explicit | Question configuration and `ifconfig` output | interface configuration; `ifconfig`; link up; DHCP client configuration |
| 3 | Test | The operator released and requested IPv4 leases, including a direct request to the known DHCP server; each request sent DHCPDISCOVER but received no DHCPOFFER and found no working lease. | Demonstrates that the client can attempt the transaction but receives no offered address, materially narrowing Diagnosis toward the DHCP service or its address supply. | explicit | Question command-output blocks | `dhclient`; DHCPDISCOVER; DHCPOFFER; lease database; DHCP server |
| 4 | Test | Disabling IPv6 still did not produce an IP address. | Contradicts the operator’s implicit idea that IPv6 behavior was blocking IPv4 configuration. | explicit | Question closing paragraph | disable IPv6; no IP address |
| 5 | Hypothesize | A responder proposed a down DHCP server or disconnected virtual network path and suggested link inspection and packet capture. | Introduces service and transport alternatives that could also explain absent offers. | explicit | First comment | DHCP server; virtual cable; `ethtool`; traffic dump; DHCP packets |
| 6 | Document | The operator placed interface files, interface output, exact commands, and command results into the troubleshooting record. | Creates an explicit evidence record that collaborators can inspect; this is more than publication alone because the action results are deliberately captured. | explicit | Question body | configuration record; command transcript; Evidence |
| 7 | Isolate | The network administrator found that the IPv4 pool had no addresses available. | Crosses the Isolation gateway from a generic lease failure to the actionable DHCP capacity cause. | explicit | Accepted answer | exhausted IPv4 pool; no addresses available |
| 8 | Repair | The network administrator removed old DHCP reservations. | Changes DHCP server state to free addresses for allocation. | explicit | Accepted answer | remove stale reservations; DHCP address pool |
| 9 | Verify | The author reports that the cleanup worked. | Confirms lease service was restored after the repair, although the exact assigned address is not recorded. | explicit | Accepted answer | DHCP lease success; IPv4 restored |

## Absent stages

All seven lifecycle categories appear. The Verify evidence is brief and does not preserve the resulting lease details.

## Uncertainties and inferences

- The stable paired fault is the generic DHCP lease failure. The source establishes a deeper scenario cause—exhausted IPv4 availability—without implying that every occurrence of the domain fault has that cause.
- `ifconfig` is present in the source but absent from the domain database. The existing `ip addr` command is functionally similar, not a literal match.
- Packet capture and `ethtool` were suggestions, not reported executions.

## Cross-reference analysis

- [Found database coverage](../database_cross_reference/found/sfp-030--no-dhcp-lease--dhcp-lease-failure--serrano.md)
- [Not-found database coverage](../database_cross_reference/not_found/sfp-030--no-dhcp-lease--dhcp-lease-failure--serrano.md)
