# Server Repair Card Game — Prototype Tests, Tools, Commands, and Procedures

This starter set supports the initial Fault catalog and establishes reusable vocabulary.

---

# Tools

## ESD Strap

**ID:** `tool.safety.esd_strap`

Role:
- supports safe handling of electronic components

Game identity:
- prevention / repair-quality support

---

## Multimeter

**ID:** `tool.electrical.multimeter`

Role:
- voltage, resistance, continuity, and other electrical measurements as permitted by procedure

Game identity:
- high-precision electrical diagnosis

---

## Screwdriver / Hand Tool Set

**ID:** `tool.hand.basic_set`

Role:
- disassembly and reassembly

Game identity:
- enables certain repair procedures

---

## Known-Good DIMM

**ID:** `tool.known_good.dimm`

Role:
- comparison/substitution during memory isolation

Game identity:
- eliminates or confirms memory candidates

---

## Known-Good PSU

**ID:** `tool.known_good.psu`

Role:
- isolate PSU faults

---

## Vendor Management Interface

**ID:** `tool.management.bmc_console`

Role:
- inspect hardware inventory, sensors, event logs, power state

Game identity:
- broad information tool

---

# Tests

## Visual Inspection

**ID:** `test.general.visual_inspection`

Applicable to:
- cables
- seating
- LEDs
- fans
- dust
- obvious physical damage

Game identity:
- cheap broad information, low specificity

---

## Minimum Configuration Test

**ID:** `test.general.minimum_configuration`

Purpose:
- remove nonessential devices and isolate core POST/power faults

---

## Single-DIMM Isolation

**ID:** `test.memory.single_dimm_isolation`

Purpose:
- isolate memory/DIMM-related failures

---

## Memory Diagnostic

**ID:** `test.memory.diagnostic`

Purpose:
- identify memory errors

---

## PSU Substitution Test

**ID:** `test.power.known_good_psu`

Purpose:
- isolate failed PSU

---

## Continuity Test

**ID:** `test.electrical.continuity`

Requires:
- multimeter

Purpose:
- determine whether a path is electrically continuous where procedure permits

---

## RAID Status Inspection

**ID:** `test.storage.raid_status`

Purpose:
- inspect array/member state

---

## Drive Health Test

**ID:** `test.storage.drive_health`

Purpose:
- inspect health/error data

---

## POST Code Analysis

**ID:** `test.boot.post_code_analysis`

Purpose:
- narrow failures occurring during POST

---

## Boot Device Inventory

**ID:** `test.boot.device_inventory`

Purpose:
- confirm expected storage device appears to firmware

---

## Network Link Test

**ID:** `test.network.link`

Purpose:
- verify physical/link-layer connectivity

---

## Ping Connectivity Test

**ID:** `test.network.ping`

Purpose:
- test IP reachability when appropriate

---

## Temperature Monitoring

**ID:** `test.thermal.temperature_monitoring`

Purpose:
- identify elevated thermal state

---

## Controlled Stress Test

**ID:** `test.system.stress`

Purpose:
- reproduce faults under load and/or verify repaired stability

---

# Linux / Software Commands

## lsblk

**ID:** `command.linux.lsblk`

Purpose:
- list block devices

Game identity:
- reveal storage-device information

---

## lspci

**ID:** `command.linux.lspci`

Purpose:
- list PCI/PCIe devices

Game identity:
- reveal expansion-controller/NIC presence

---

## dmesg

**ID:** `command.linux.dmesg`

Purpose:
- inspect kernel messages

Game identity:
- broad evidence generation, especially hardware/device initialization

---

## ip addr

**ID:** `command.linux.ip_addr`

Purpose:
- inspect network interfaces and addresses

---

## ping

**ID:** `command.network.ping`

Purpose:
- test reachability

---

## free -h

**ID:** `command.linux.free_h`

Purpose:
- inspect memory availability/use

---

## smartctl

**ID:** `command.linux.smartctl`

Purpose:
- inspect drive health where supported and appropriately configured

---

# Repair Procedures

## Reseat DIMM

**ID:** `repair.memory.reseat_dimm`

Resolves:
- improperly seated DIMM

---

## Replace DIMM

**ID:** `repair.memory.replace_dimm`

Resolves:
- failed DIMM

---

## Correct DIMM Population

**ID:** `repair.memory.correct_population`

---

## Reseat PSU

**ID:** `repair.power.reseat_psu`

---

## Replace PSU

**ID:** `repair.power.replace_psu`

---

## Reconnect Power Cable

**ID:** `repair.power.reconnect_input`

---

## Replace Failed RAID Member

**ID:** `repair.storage.replace_raid_member`

---

## Rebuild RAID Array

**ID:** `repair.storage.rebuild_array`

---

## Reseat Storage Cable

**ID:** `repair.storage.reseat_cable`

---

## Replace Storage Cable

**ID:** `repair.storage.replace_cable`

---

## Correct Boot Order

**ID:** `repair.boot.correct_order`

---

## Repair Bootloader

**ID:** `repair.boot.repair_bootloader`

---

## Replace Chassis Fan

**ID:** `repair.thermal.replace_fan`

---

## Clean Cooling Path

**ID:** `repair.thermal.clean_cooling_path`

---

## Correct Static IP Configuration

**ID:** `repair.network.correct_static_ip`

---

## Reseat PCIe Card

**ID:** `repair.pcie.reseat_card`

---

# Verification Procedures

## POST Verification

**ID:** `verify.boot.post`

---

## Memory Verification

**ID:** `verify.memory.full_test`

---

## Storage Detection Verification

**ID:** `verify.storage.device_detected`

---

## RAID Healthy Verification

**ID:** `verify.storage.raid_healthy`

---

## Normal Boot Verification

**ID:** `verify.boot.normal_boot`

---

## Network Connectivity Verification

**ID:** `verify.network.connectivity`

---

## Thermal Load Verification

**ID:** `verify.thermal.load_test`

---

## Burn-In Verification

**ID:** `verify.system.burn_in`

---

# Workflow / Documentation Procedures

## Record Repair Action

**ID:** `workflow.document.repair_action`

---

## Record Replaced Part

**ID:** `workflow.document.part_trace`

---

## Record Verification Result

**ID:** `workflow.document.verification`

---

## Escalate Unresolved Fault

**ID:** `workflow.escalate.unresolved`

---

## No Fault Found Procedure

**ID:** `workflow.nff.standard`

These procedures can initially be represented with lightweight cards/effects and later expanded into a richer production-workflow archetype.
