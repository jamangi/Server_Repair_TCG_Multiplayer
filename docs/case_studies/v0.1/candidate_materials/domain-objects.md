# Candidate domain materials from the v0.1 pilot

These are deduplicated research candidates, not approved entities. Names are descriptive only: no stable IDs, final fields, costs, outcomes, or schema changes are proposed here.

## Observe-supporting candidates

### IPv4 and IPv6 protocol representations

- **Support:** `sfp-030`
- **Likely schema type:** Protocol
- **Why existing objects are insufficient:** DHCP is represented, but the case’s decisive observation is IPv6 present while IPv4 is absent. The two network-layer protocols and their address states cannot be expressed through the DHCP protocol alone.
- **Scope note:** Useful if scenarios need protocol-specific visibility or Evidence. Otherwise they may remain educational terms rather than cards.

### Virtual network adapter and link path

- **Support:** `sfp-030`
- **Likely schema type:** Component
- **Why existing objects are insufficient:** Physical NIC and Ethernet-cable objects do not precisely model a VM adapter, virtual switch/port group, or disconnected virtual path.
- **Scope note:** Defer unless virtualization becomes an intentional expansion. The pilot source ultimately isolates DHCP capacity, so this candidate is not needed for the paired case itself.

## Test-supporting candidates

### Residual-power drain diagnostic procedure

- **Support:** `sfp-012`
- **Likely schema type:** Test or Protocol
- **Why existing objects are insufficient:** Minimum configuration and input reconnection do not model safely removing power, discharging residual state, then interpreting which symptoms return. The pilot shows that the action can produce partial evidence—fans return while POST remains absent—without being the final repair.

### Standalone PSU self-start test

- **Support:** `sfp-039`
- **Likely schema type:** Test, with an applicable safety/interface Protocol
- **Why existing objects are insufficient:** Known-good substitution and status inspection do not represent jumpering an ATX control pin, attaching a suitable load, or interpreting a zero-RPM fan. This candidate should be limited to compatible supplies and should not be generalized to server hot-swap units.

### PSU output-voltage measurement

- **Support:** `sfp-039`
- **Likely schema type:** Test; may depend on an ATX connector/pinout Protocol
- **Why existing objects are insufficient:** The Multimeter exists, but no Test converts rail measurements into Evidence and no Protocol supplies connector expectations. This is a stronger diagnostic action than treating PSU fan motion as decisive.

### Dedicated PSU tester

- **Support:** `sfp-039`
- **Likely schema type:** Tool
- **Why existing objects are insufficient:** A Multimeter and known-good PSU diagnose by different means; neither represents the dedicated tester mentioned in the case.
- **Scope note:** Lower priority. It may add little game value if voltage measurement and substitution already cover distinct trade-offs.

### DHCP client release/renew command

- **Support:** `sfp-030`
- **Likely schema type:** Command
- **Why existing objects are insufficient:** `ip addr` inspects assigned addresses but does not actively release/renew a lease or emit DHCP transaction results. The source uses verbose IPv4 and direct-server forms of `dhclient`.

### DHCP transaction/offer analysis

- **Support:** `sfp-030`
- **Likely schema type:** Test
- **Why existing objects are insufficient:** Interface Configuration Inspection can show no address, but it cannot distinguish no offer from a client configuration failure. This Test would interpret discover/offer/lease outcomes and could consume a DHCP client command or packet-capture result.

### Packet capture and DHCP packet inspection

- **Support:** `sfp-030`
- **Likely schema type:** Command or Tool plus Test
- **Why existing objects are insufficient:** `ethtool` checks link state; it does not capture DHCP exchanges at client and server endpoints.
- **Scope note:** The source recommends rather than executes this path. Treat it as a lower-confidence diagnostic expansion candidate.

### DHCP pool-capacity and reservation inspection

- **Support:** `sfp-030`
- **Likely schema type:** Test
- **Why existing objects are insufficient:** Client-side interface inspection cannot observe server-side free-address capacity or stale reservations. This is the action that supports the case’s actual Isolation.

### Operating-system temperature telemetry tool

- **Support:** `sfp-076`
- **Likely schema type:** Tool or Command
- **Why existing objects are insufficient:** Temperature Monitoring exists but currently requires the Management Controller Console. The case gathers equivalent CPU telemetry from an operating-system sensor utility on hardware without that BMC workflow.

### RAID controller firmware inspection/update

- **Support:** `sfp-057`
- **Likely schema type:** Test for version/release-note comparison and Repair Procedure for an update
- **Why existing objects are insufficient:** Firmware Settings Review and Restore Firmware Settings do not inspect or change storage-controller firmware.
- **Scope note:** The case considered this candidate but isolated failed media instead. It is valid coverage research, not evidence that the pilot needs this object immediately.

## Repair-supporting candidates

### Remove stale DHCP reservations

- **Support:** `sfp-030`
- **Likely schema type:** Repair Procedure
- **Why existing objects are insufficient:** Correct Static IP Configuration changes a client; it does not free server-side DHCP pool capacity. The case’s successful repair is therefore not representable by the current repair inventory.

### Backup-and-restore recovery procedure

- **Support:** `sfp-057`
- **Likely schema type:** Repair Procedure or Protocol
- **Why existing objects are insufficient:** Rebuild RAID Array models parity reconstruction, not the fallback of making a full backup, rebuilding a server, and restoring data when reconstruction cannot complete.
- **Scope note:** This may be a high-cost recovery path or scenario protocol rather than an ordinary repair card.

## Verify-supporting candidates

### DHCP lease verification

- **Support:** `sfp-030`
- **Likely schema type:** Validation Procedure
- **Why existing objects are insufficient:** Network Connectivity Verification covers the paired Fault generically, but it does not require evidence of a newly assigned address, expected DHCP server, lease lifetime, gateway, or options. A narrower validation would verify the repair rather than merely show some connectivity.

## Reviewed gaps not promoted

- Whole-server platform names, zero-RPM PSU fan behavior, BIOS temperature thresholds, and post-repair idle temperature are better treated as aliases, scenario facts, or educational details unless repeated cases establish reusable mechanics.
- `ifconfig` maps to the existing `ip addr` command by function; a legacy synonym does not require a second Command.
- `cpuburn` maps to Controlled Stress Test by function. A named command is optional content, not a demonstrated core gap.
- Graphics and sound candidates in `sfp-076` are discarded alternatives, not support for immediate component expansion.
