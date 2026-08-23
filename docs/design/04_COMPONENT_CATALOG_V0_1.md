# Server Repair Card Game — Prototype Component Catalog

The prototype Component catalog should cover enough internal server hardware to support diverse Repair Tickets without trying to be exhaustive.

Components are technical machine/domain entities scoped through a Ticket or server profile, not account-owned Equipment. This catalog creates no Equipment inventory, slot, Store, loadout, or effect. Existing dotted IDs are retained; entries not yet materialized in current domain JSON remain planned content and require an explicit content/schema migration before becoming public data contracts.

---

# Component Definition Template

```text
ID
Name
Type
Subsystem
Purpose
Common Interfaces
Common Faults
Effective Tests
Compatible Repair Procedures
Hot Swappable?
Search Tags
Education Text
Expansion
```

---

## Compute / Board

### CPU

**ID:** `component.compute.cpu`

Purpose:
- executes instructions
- interfaces with memory and platform resources

Relevant faults:
- improper seating
- thermal faults
- socket-related problems

---

### System Board

**ID:** `component.board.system`

Purpose:
- main electrical/logical interconnect for server components

Relevant faults:
- board failure
- damaged slots/connectors
- onboard-controller failure

---

### CMOS / RTC Battery

**ID:** `component.board.rtc_battery`

Purpose:
- supports persistent clock/configuration on applicable systems

Relevant symptoms:
- time/configuration reset

---

## Memory

### ECC DIMM

**ID:** `component.memory.ecc_dimm`

Purpose:
- system memory with error-correcting capability

Relevant faults:
- failed DIMM
- improper seating
- population mismatch

---

### DIMM Slot / Memory Channel

**ID:** `component.memory.channel`

Purpose:
- logical/electrical path between memory and processor/platform

Relevant faults:
- unavailable channel
- socket/board interaction issues

---

## Storage

### SAS HDD

**ID:** `component.storage.sas_hdd`

Properties:
- enterprise storage
- often used behind RAID/HBA infrastructure
- may support hot swap depending on chassis/configuration

---

### SAS SSD

**ID:** `component.storage.sas_ssd`

---

### SATA HDD

**ID:** `component.storage.sata_hdd`

---

### SATA SSD

**ID:** `component.storage.sata_ssd`

---

### NVMe SSD

**ID:** `component.storage.nvme_ssd`

Relevant interfaces:
- PCIe / NVMe

---

### RAID Controller

**ID:** `component.storage.raid_controller`

Purpose:
- manages RAID arrays where hardware RAID is used

---

### HBA

**ID:** `component.storage.hba`

Purpose:
- exposes attached storage devices with less abstraction than a hardware RAID controller

---

### Drive Backplane

**ID:** `component.storage.backplane`

Purpose:
- connects hot-swap drive bays to storage/power infrastructure

---

### SAS/SATA Cable

**ID:** `component.storage.data_cable`

---

## Power

### Hot-Swap PSU

**ID:** `component.power.hot_swap_psu`

Purpose:
- supplies DC power
- often participates in redundancy

---

### Power Cable

**ID:** `component.power.input_cable`

---

### Power Distribution / Internal Power Path

**ID:** `component.power.distribution`

Could represent chassis power boards, distribution boards, or equivalent platform-specific subsystems.

---

## Cooling

### Chassis Fan

**ID:** `component.cooling.fan`

---

### CPU Heatsink

**ID:** `component.cooling.cpu_heatsink`

---

### Thermal Interface Material

**ID:** `component.cooling.tim`

---

## Network

### Ethernet NIC

**ID:** `component.network.nic`

---

### Ethernet Cable

**ID:** `component.network.ethernet_cable`

---

## Expansion

### PCIe Riser

**ID:** `component.pcie.riser`

---

### PCIe Expansion Card

**ID:** `component.pcie.card`

A generic base component that specialized cards such as NICs, HBAs, accelerators, etc. can derive from or tag against.

---

## Chassis / Management

### Chassis

**ID:** `component.chassis.server`

---

### Management Controller

**ID:** `component.management.bmc`

Purpose:
- out-of-band monitoring and management
- logs, sensor telemetry, power control, inventory

Generic domain name is preferable even if cards later feature vendor-specific implementations such as iDRAC or iLO.

---

### Front-Panel Diagnostic Indicators

**ID:** `component.chassis.diagnostics`

Purpose:
- expose LEDs, codes, or other quick diagnostic state.

---

# Important Component Relationships

The domain model should support:

```text
Component --contains--> Component
Component --connects_to--> Component
Component --compatible_with--> Component
Component --uses_interface--> ProtocolOrStandard
Fault --affects--> Component
Test --targets--> Component
RepairProcedure --replaces_or_modifies--> Component
```

Examples:

```text
server chassis contains hot-swap PSU
RAID controller connects_to drive backplane
drive backplane contains/hosts SAS drives
NVMe SSD uses_interface NVMe/PCIe
ECC DIMM installed_in memory channel
```

These relationships can later power:

- legality checking,
- contextual search,
- procedural hints,
- authored public candidate-Fault sets,
- server-specific scenario generation.

Future generated scenarios remain an opportunity under unresolved [`GEN-001`](decisions/UNFROZEN_RULES.md#gen-001). This catalog does not define a Ticket Builder configuration, constraint solver, or generator algorithm.
