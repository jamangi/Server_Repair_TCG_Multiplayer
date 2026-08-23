# Server Repair Card Game — Card Types

The game should distinguish **technical knowledge entities** from **playable cards**. A card can reference one or more entities and grant game actions involving them.

[`decisions/FROZEN_RULES.md`](decisions/FROZEN_RULES.md) controls card-game behavior. The families below are content categories, not seven troubleshooting departments, and no card is required to use universal Hypothesis, Commit Isolation, Document Live, closure, Search, Refresh, or Pass actions.

---

## 1. Repair Ticket Cards

Represent work orders / malfunctioning systems.

Contain or reference:

- reported issue,
- visible symptoms,
- server profile,
- public authored candidate-Fault set,
- hidden server-only Fault blueprint or causal chain,
- authored Test/Command outcome matrix,
- authored Isolation requirements,
- eligible Repair path,
- difficulty,
- Verification requirements,
- structured closure requirements,
- and server-only scoring-slot metadata for required actionable Fault Isolation and necessary Repair.

These are supplied to the shared Repair Queue rather than Player decks. A Ticket has no fixed closer point: closure is zero-Action, non-scoring, and statistically attributable. Each required actionable Fault instead supplies one one-point Isolation slot and one one-point necessary-Repair slot, settled at closure.

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
- provide a temporary known-good resource for a diagnostic-substitution Test,
- satisfy repair requirements,
- create compatibility or server-specific effects.

A diagnostic substitution reverts after comparison and changes Knowledge State. A permanent Component change is a Repair and is legal only after accepted Isolation through an eligible Repair Procedure.

This is the natural home of much of the Hardware / Server Hardware archetypes.

---

## 3. Tool Cards

Reusable or semi-reusable diagnostic resources.

These are technical **Tools** in the domain/card model. They are not account-owned **Equipment**; the game has no Equipment inventory, slot, Store category, loadout, or starting Equipment effect.

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

- produce authorized authored Evidence,
- support, contradict, rule out, or confirm public candidates,
- reveal an authored observation,
- expose components,
- follow causal chains.

Tests are among the most important educational card types.

Each Test execution is a distinct immutable action with one attached result. The result changes Knowledge State, not machine state, and may be `SUPPORT`, `CONTRADICT`, `RULE_OUT`, `CONFIRM`, an observation, or `INCONCLUSIVE`. A card named “Single-DIMM Isolation” remains a Test; it is not the universal accepted **Commit Isolation** action.

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

Ordinary Repair is legal only after the Ticket has an accepted evidence-supported Isolation and the procedure targets that isolated actionable Fault. Unsupported or speculative Repair is rejected before payment; the core game has no parts-cannon exception. A Repair changes machine state and records history, but it never proves Verify or Documentation complete.

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

A Ticket cannot become ready to close until all required Verification conditions have current passes after the latest relevant Repair. Every Verify execution creates a distinct immutable result.

A failed or inconclusive Verify remains Evidence, invalidates affected stale passes, preserves earlier Evidence and machine changes, and returns the Ticket to Diagnosis. A later pass never erases the earlier failure.

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
- supplement structured Documentation effects.

Ordinary Documentation is never draw-dependent. **Document Live** is a universal one-Action basic action available throughout an active Ticket. It publishes one eligible authoritative action/result, enriches that action's original public Worklog placeholder in place, appends a linked publication event, and returns the exact source card from discard to its owner once.

After all current Verify requirements pass, a mandatory structured closure bundle remains. Publishing it costs zero Actions, recovers no card, awards no Service Points for closure, and retains Player/team closure attribution as statistics. Successful Verify opens an immediate closure-resolution window before automatic end-turn, including when Verify used the last Action.

Workflow cards may interact with these systems only through explicit card text. They do not replace Document Live, the immutable Worklog chronology, or structured closure.

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

No frozen first-version rule currently grants passive bonuses or deck-building permissions through technician identity. Adopting that behavior would require its own explicit design decision.

Technician Cards are not Qualifications. Qualifications are non-mechanical honor badges and can never grant a passive bonus, deck permission, content access, procedure, matchmaking effect, or other gameplay benefit.

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

# First-version card envelope and system actions

- A legal deck contains exactly 30 cards and no more than three copies of one card ID.
- Each Player opens with five cards, then draws one at the start of every turn when the draw deck is nonempty.
- An empty draw deck skips the draw and is not itself loss, exhaustion, or concession.
- Each turn supplies two Actions; printed card costs are 0, 1, or 2.
- There is no rules-level maximum hand size.
- A Player may play no more than one copy of the same 0-Action card name per turn unless explicit text overrides the limit.
- One-shot cards enter discard after resolution. Installed or persistent playable cards remain in their defined match zone until removed by an effect; this is not account Equipment.

Search Tokens and Deck Refresh Tokens are public utility resources rather than cards in hand. Search spends one token and one Action to select a card from the remaining draw deck, add it to hand, and shuffle the rest. Refresh spends one token and one Action to combine discard with the remaining draw deck and shuffle a new draw deck; hand and Installed playable cards do not move. Closure grants configured utility resources only after the complete closure transaction.

Every card or basic action identifies an exact legal Ticket, Player zone, card/action record, or other explicit target. Target relationships remain effect-specific; the engine does not infer an unnamed “other Player.”

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
