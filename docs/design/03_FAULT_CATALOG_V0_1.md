# Server Repair Card Game — Prototype Fault Catalog

This is a deliberately finite starter catalog. It is not intended to model every real-world server failure.

The prototype should be robust enough to demonstrate:

- hardware faults,
- configuration faults,
- storage faults,
- boot faults,
- networking faults,
- thermal faults,
- electrical faults,
- causal Fault chains.

---

# Fault Definition Template

Each Fault should support:

```text
ID
Name
Category
Affected Component / Subsystem
Summary
Symptoms
Common Causes
Possible Downstream Faults
Effective Inspections
Effective Tests
Repair Methods
Verification Methods
Search Tags
Difficulty
Expansion
```

Not every field must appear on the face of a card. The full data should be available in the browser/reference view.

---

# Memory Faults

## 1. DIMM Not Fully Seated

**ID:** `fault.memory.dimm.not_seated`

**Component:** DIMM / memory slot

**Symptoms:**
- no POST
- reduced detected memory
- memory diagnostic LED
- intermittent memory errors

**Effective inspection/tests:**
- visual inspection
- firmware memory inventory
- reseat-and-retest
- single-DIMM isolation

**Repair:**
- properly reseat DIMM

**Verification:**
- successful POST
- expected memory detected
- memory diagnostic passes

**Possible downstream faults:**
- `fault.memory.channel.unavailable`

---

## 2. Failed DIMM

**ID:** `fault.memory.dimm.failed`

**Component:** ECC DIMM

**Symptoms:**
- corrected/uncorrected ECC errors
- no POST
- intermittent crashes
- reduced available memory

**Tests:**
- memory diagnostic
- swap with known-good DIMM
- single-DIMM isolation
- management-controller logs

**Repair:**
- replace DIMM

**Verification:**
- POST
- full memory test
- error log remains clear

---

## 3. DIMM Installed in Invalid Slot Population

**ID:** `fault.memory.population.invalid`

**Component:** memory subsystem

**Symptoms:**
- no POST
- reduced memory
- memory configuration warning

**Tests:**
- compare slot population with server documentation
- firmware memory inventory

**Repair:**
- reinstall DIMMs according to population rules

**Verification:**
- POST
- correct total memory detected

---

## 4. Memory Channel Unavailable

**ID:** `fault.memory.channel.unavailable`

**Component:** memory channel / CPU / system board

**Symptoms:**
- several DIMMs absent
- memory warning
- reduced capacity

**Potential causes:**
- improperly seated DIMM
- CPU/socket issue
- board fault

**Tests:**
- inspect DIMM population
- isolate DIMMs
- inspect CPU/socket when appropriate

**Repair:**
- depends on root cause

**Verification:**
- expected channels and capacity detected

---

# Power Faults

## 5. Failed PSU

**ID:** `fault.power.psu.failed`

**Component:** power supply

**Symptoms:**
- no power
- PSU warning LED
- redundant-power warning
- unexpected shutdown

**Tests:**
- PSU indicator inspection
- known-good PSU
- power telemetry
- multimeter where procedure permits

**Repair:**
- replace PSU

**Verification:**
- stable power
- redundancy restored
- no power alerts

---

## 6. PSU Not Fully Seated

**ID:** `fault.power.psu.not_seated`

**Component:** hot-swap PSU

**Symptoms:**
- PSU missing
- redundancy warning
- intermittent power

**Inspection/tests:**
- visual/physical seating inspection
- management telemetry

**Repair:**
- reseat PSU

**Verification:**
- PSU detected and healthy

---

## 7. Power Cable Disconnected or Loose

**ID:** `fault.power.input.cable_loose`

**Component:** input power path

**Symptoms:**
- no power
- one redundant PSU offline

**Tests:**
- cable inspection
- alternate known-good cable/outlet as permitted

**Repair:**
- reconnect or replace cable

**Verification:**
- stable PSU input

---

# Storage / RAID Faults

## 8. Failed SAS Drive

**ID:** `fault.storage.sas.drive_failed`

**Component:** SAS HDD/SSD

**Symptoms:**
- RAID degraded
- drive failure indicator
- missing drive
- I/O errors

**Tests:**
- RAID controller status
- drive health data
- management logs

**Repair:**
- replace failed drive

**Verification:**
- replacement detected
- rebuild completes
- array healthy

**Possible downstream faults:**
- `fault.storage.raid.degraded`

---

## 9. Failed SATA Drive

**ID:** `fault.storage.sata.drive_failed`

Similar to failed SAS drive, but associated with SATA storage.

---

## 10. NVMe Device Failure

**ID:** `fault.storage.nvme.device_failed`

**Symptoms:**
- drive missing
- I/O errors
- boot failure if boot device
- health warnings

**Tests:**
- firmware inventory
- OS block-device inspection
- NVMe health information

**Repair:**
- replace device

**Verification:**
- device detected
- health test
- storage/application test

---

## 11. Loose SAS/SATA Cable

**ID:** `fault.storage.cable.loose`

**Component:** storage cable

**Symptoms:**
- drive intermittently missing
- I/O errors
- boot device unavailable

**Tests:**
- physical inspection
- cable reseat
- known-good cable

**Repair:**
- reseat or replace cable

**Verification:**
- stable device detection

**Possible downstream faults:**
- `fault.boot.device.not_detected`

---

## 12. RAID Array Degraded

**ID:** `fault.storage.raid.degraded`

**Component:** RAID array

**Symptoms:**
- degraded status
- warning LED
- reduced redundancy

**Common causes:**
- failed member drive
- missing member drive

**Tests:**
- RAID controller status
- management logs

**Repair:**
- resolve failed member and rebuild

**Verification:**
- rebuild complete
- array optimal

---

## 13. RAID Controller Failure

**ID:** `fault.storage.raid.controller_failed`

**Symptoms:**
- arrays absent
- drives inaccessible through controller
- controller warning
- boot failure

**Tests:**
- controller detection
- firmware diagnostics
- known-good controller where appropriate

**Repair:**
- replace/reseat controller

**Verification:**
- controller healthy
- arrays visible
- boot/storage test

---

# Boot / Firmware Faults

## 14. Incorrect Boot Order

**ID:** `fault.boot.order.incorrect`

**Component:** BIOS/UEFI configuration

**Symptoms:**
- no bootable device selected
- boots from wrong device

**Tests:**
- inspect boot order
- confirm expected boot device exists

**Repair:**
- correct boot order

**Verification:**
- successful expected boot

---

## 15. Boot Drive Not Detected

**ID:** `fault.boot.device.not_detected`

**Subsystem:** boot/storage

**Symptoms:**
- POST succeeds
- no boot device
- expected drive absent

**Potential causes:**
- failed drive
- loose cable
- RAID/controller fault

**Tests:**
- BIOS/UEFI storage inventory
- RAID status
- `lsblk` when OS/environment available
- physical inspection

**Repair:**
- resolve root cause

**Verification:**
- expected device detected
- successful boot

---

## 16. Corrupt Bootloader

**ID:** `fault.boot.bootloader.corrupt`

**Symptoms:**
- storage device detected
- OS does not start
- bootloader error/recovery prompt

**Tests:**
- verify drive detection
- boot/recovery diagnostics

**Repair:**
- repair/reinstall bootloader

**Verification:**
- normal boot

---

## 17. Firmware Configuration Reset

**ID:** `fault.firmware.config.reset`

**Symptoms:**
- unexpected boot order
- date/time reset
- hardware settings reverted

**Possible causes:**
- CMOS/NVRAM issue
- deliberate reset

**Tests:**
- inspect firmware configuration and logs

**Repair:**
- restore correct settings
- resolve battery/hardware cause if applicable

**Verification:**
- settings persist across reboot

---

# Thermal / Cooling Faults

## 18. Failed Chassis Fan

**ID:** `fault.thermal.fan.failed`

**Symptoms:**
- fan warning
- elevated temperature
- loud remaining fans
- shutdown under load

**Tests:**
- fan telemetry
- visual inspection

**Repair:**
- replace fan

**Verification:**
- normal fan status
- acceptable temperature under load

**Possible downstream faults:**
- `fault.thermal.chassis.overheating`

---

## 19. Dust-Clogged Heatsink

**ID:** `fault.thermal.heatsink.clogged`

**Symptoms:**
- elevated CPU temperature
- fan speed increase

**Tests:**
- visual inspection
- temperature monitoring

**Repair:**
- clean cooling path according to procedure

**Verification:**
- normal temperatures

**Possible downstream faults:**
- `fault.thermal.cpu.overheating`

---

## 20. CPU Overheating

**ID:** `fault.thermal.cpu.overheating`

**Symptoms:**
- high CPU temperature
- thermal throttling
- unexpected shutdown under load

**Possible causes:**
- clogged heatsink
- failed fan
- poor heatsink contact
- thermal interface problem

**Tests:**
- temperature monitoring
- fan telemetry
- cooling inspection

**Repair:**
- resolve root cooling fault

**Verification:**
- stress test with acceptable temperature

**Possible downstream faults:**
- `fault.thermal.shutdown`

---

## 21. Thermal Shutdown

**ID:** `fault.thermal.shutdown`

**Symptoms:**
- server powers off under sustained load
- thermal event recorded

**Possible causes:**
- CPU overheating
- chassis overheating

**Tests:**
- management logs
- thermal telemetry
- controlled stress test

**Repair:**
- repair underlying thermal problem

**Verification:**
- sustained load test passes

---

# Network Faults

## 22. Ethernet Cable Disconnected

**ID:** `fault.network.cable.disconnected`

**Symptoms:**
- no link light
- interface down/no carrier
- no network connectivity

**Tests:**
- physical inspection
- link state
- known-good cable

**Repair:**
- reconnect/replace cable

**Verification:**
- link restored
- connectivity test

---

## 23. NIC Failure

**ID:** `fault.network.nic.failed`

**Symptoms:**
- interface missing
- no link despite known-good cable/port
- hardware errors

**Tests:**
- `lspci`
- firmware inventory
- known-good cable/port
- loopback/vendor diagnostic

**Repair:**
- replace NIC or board component as applicable

**Verification:**
- device recognized
- link and network test succeed

---

## 24. Incorrect Static IP Configuration

**ID:** `fault.network.ip.static_incorrect`

**Symptoms:**
- local interface up
- cannot reach expected network
- incorrect subnet/gateway

**Tests:**
- `ip addr`
- route inspection
- compare required network configuration

**Repair:**
- correct IP configuration

**Verification:**
- gateway/network connectivity

---

## 25. DHCP Lease Failure

**ID:** `fault.network.dhcp.no_lease`

**Symptoms:**
- no expected dynamic address
- link may be healthy

**Potential causes:**
- DHCP unavailable
- VLAN/network path issue
- client configuration issue

**Tests:**
- inspect interface
- DHCP client logs
- test network path

**Repair:**
- depends on root cause

**Verification:**
- valid lease obtained
- connectivity succeeds

---

# CPU / Motherboard / PCIe Faults

## 26. PCIe Card Not Fully Seated

**ID:** `fault.pcie.card.not_seated`

**Symptoms:**
- expansion device missing
- intermittent device errors

**Tests:**
- firmware inventory
- `lspci`
- physical inspection

**Repair:**
- reseat card

**Verification:**
- card detected and functional

---

## 27. CPU Not Properly Seated

**ID:** `fault.cpu.not_seated`

**Symptoms:**
- no POST
- CPU/socket diagnostic error
- missing memory channels

**Tests:**
- diagnostic codes
- socket/CPU inspection according to procedure

**Repair:**
- reinstall CPU correctly if permitted

**Verification:**
- POST and CPU inventory normal

---

## 28. System Board Failure

**ID:** `fault.board.system.failed`

**Symptoms:**
- no POST
- multiple unrelated onboard devices fail
- power/diagnostic abnormalities

**Tests:**
- minimum configuration
- known-good replaceable components
- board diagnostics

**Repair:**
- replace system board

**Verification:**
- POST
- inventory
- functional/burn-in testing

---

# Example Causal Chains

## Thermal Chain

```text
fault.thermal.heatsink.clogged
    -> fault.thermal.cpu.overheating
        -> fault.thermal.shutdown
            -> symptom: unexpected shutdown under load
```

## Storage / Boot Chain

```text
fault.storage.cable.loose
    -> fault.boot.device.not_detected
        -> symptom: no boot device
```

## Drive / RAID Chain

```text
fault.storage.sas.drive_failed
    -> fault.storage.raid.degraded
        -> symptom: RAID warning
```

These chains demonstrate why Fault-to-Fault relationships are useful: the visible problem may be several causal steps away from the root repair target.
