# Server Repair Card Game — Card Types

The game should distinguish **technical knowledge entities** from **playable cards**. A card can reference one or more entities and grant game actions involving them.

---

## 1. Repair Ticket Cards

Represent work orders / malfunctioning systems.

Contain or reference:

- reported issue,
- visible symptoms,
- server profile,
- hidden Fault blueprint,
- difficulty,
- Service Point value,
- verification requirements.

These are primarily supplied by the shared Ticket Deck rather than player decks.

---

## 2. Component Cards

The foundational repair cards.

Examples:

- ECC DIMM
- SAS HDD
- NVMe SSD
- PSU
- NIC
- fan
- system board
- RAID controller

Uses:

- replace failed hardware,
- install known-good components for isolation,
- satisfy repair requirements,
- create compatibility or server-specific effects.

This is the natural home of much of the Hardware / Server Hardware archetypes.

---

## 3. Tool Cards

Reusable or semi-reusable diagnostic resources.

Examples:

- Multimeter
- ESD strap
- screwdriver kit
- POST diagnostic tool
- known-good PSU
- vendor management console

Uses:

- enable Tests,
- reduce Action costs,
- improve diagnostic certainty,
- protect against repair penalties,
- unlock otherwise unavailable observations.

---

## 4. Test Cards

Active troubleshooting actions.

Examples:

- Memory Diagnostic
- Continuity Test
- POST Code Analysis
- SMART Test
- Cable Swap Test
- Single-DIMM Isolation
- Network Loopback Test

Uses:

- reveal Fault information,
- eliminate candidates,
- add Diagnosis,
- expose components,
- follow causal chains.

Tests are among the most important educational card types.

---

## 5. Command Cards

Software / Linux / management-interface actions.

Examples:

- `lsblk`
- `lspci`
- `dmesg`
- `ip addr`
- `ping`
- `smartctl`

Command cards can behave like specialized Tests but deserve their own type because:

- players should learn command names,
- platform requirements matter,
- later expansions can support command synergies,
- search/filter UI can expose commands independently.

---

## 6. Repair Procedure Cards

Corrective actions rather than replacement parts.

Examples:

- Reseat DIMM
- Reconnect SAS Cable
- Correct Boot Order
- Rebuild RAID Array
- Reinstall Bootloader
- Clean Heatsink
- Replace Thermal Paste

Uses:

- resolve a Fault,
- alter Server State,
- consume Components or Tools,
- prepare a ticket for Verification.

---

## 7. Verification Cards

Post-repair confirmation.

Examples:

- POST Verification
- Memory Test
- Boot Test
- RAID Health Check
- Stress Test
- Burn-In Test
- Connectivity Test

A ticket cannot close until required Verification succeeds.

These cards reinforce the lesson that "part replaced" does not mean "repair finished."

---

## 8. Workflow / Documentation Cards

Represent production repair process and operational discipline.

Examples:

- Repair History
- Known Good Configuration
- Escalation Procedure
- Serial Number Trace
- QA Checklist
- No Fault Found Procedure
- Parts Log
- Shift Handoff

Uses:

- recover cards,
- improve efficiency,
- manipulate tickets,
- reduce repeat-work penalties,
- gain information from repair history,
- satisfy documentation requirements.

---

## 9. Protocol / Standard Cards

Represent standards, interfaces, procedures, or technical frameworks.

Examples:

- SATA
- SAS
- NVMe
- PCIe
- DHCP
- ESD Procedure
- RAID 1 / RAID 5 / RAID 10

Uses:

- modify compatible cards,
- unlock interactions,
- define legal repairs,
- enhance tests,
- teach vocabulary and relationships.

Some may eventually be better represented as persistent rules/assets than one-shot cards.

---

## 10. Event / Condition Cards

Represent temporary circumstances.

Examples:

- Intermittent Failure
- Parts Shortage
- Maintenance Window
- Thermal Spike
- Escalated Priority
- Repeat Return

Use sparingly in v0.1.

They add variation but should not distract from learning the core troubleshooting loop.

---

## 11. Technician Cards — Optional

Represent a player's technician identity or specialization.

Examples:

- Hardware Specialist
- Linux Technician
- Bench Repair Veteran
- Network Technician

Could provide small passive bonuses or deck-building permissions.

Not required for v0.1.

---

## 12. Fault Cards / Fault Reference Cards

Faults should exist first as domain entities.

A Fault Card can expose one Fault as a collectible/reference object for:

- educational browsing,
- scenario construction,
- special game modes,
- visible Fault states,
- draft or deck-building variants.

The engine should never require every Fault to be physically represented by a playable player-deck card.

This prevents the knowledge graph from becoming coupled to card inventory.

---

# Archetype Mapping

| Interview Topic / Archetype | Likely Card Emphasis |
|---|---|
| Hardware Identification + Troubleshooting | Components, Tests, Repair Procedures |
| Server Hardware / RAID / ECC / SAS | Components, Protocols, specialized Tests |
| POST / BIOS / Boot | Tests, Procedures, Commands |
| Linux | Commands, Tests, information effects |
| Networking | Components, Commands, Protocols, Tests |
| Multimeter / Electrical / ESD | Tools, Tests, Protocols |
| Documentation / Workflow | Workflow cards, resource efficiency, ticket manipulation |

A deck should generally rely on Components and troubleshooting actions while using the other archetypes to specialize how it gathers information and closes tickets.
