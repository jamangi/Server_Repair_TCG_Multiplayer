# Server Repair Card Game — Core Engine Overview

## Purpose

The game teaches the troubleshooting loop:

**Observe → Hypothesize → Test → Isolate → Repair → Verify → Document**

Players act as competing server-repair technicians. They do not attack one another directly. They compete to diagnose and close repair work more effectively.

The engine should remain simple enough that later sets based on A+, Network+, Linux+, Server+, Security+, cloud, electronics, or vendor-specific server topics can introduce new cards without replacing the fundamental rules.

---

## Primary Win Condition

A player wins by reaching the required number of **Service Points**.

Service Points are primarily earned by successfully closing Repair Tickets.

A Repair Ticket is closed when the player:

1. observes its available symptoms,
2. gathers enough information to identify the relevant fault or fault chain,
3. performs the required repair,
4. successfully verifies operation, and
5. completes any mandatory documentation requirement.

A prototype target is **10 Service Points**, subject to playtesting.

---

## Secondary Win Condition

If a player must perform their mandatory draw and cannot, that player loses.

Additional alternate loss conditions, such as SLA failure or excessive downtime, may be introduced later.

---

## Shared Repair Queue

The battlefield contains a shared queue of Repair Tickets.

Recommended prototype:

- 3 active Repair Tickets
- each ticket has a Service Point value
- each ticket describes one or more observable symptoms
- underlying faults may begin hidden
- when a ticket closes, replace it from the Ticket Deck

Both players may potentially investigate the same ticket unless a card or rules effect establishes ownership.

---

## Universal Troubleshooting Loop

### 1. Observe

Read visible symptoms, server state, diagnostics, indicators, logs, and environmental clues.

Typical game objects:

- Symptoms
- Repair Tickets
- Server state
- visible Fault evidence
- inspection effects

### 2. Hypothesize

The player develops candidate explanations for the observed symptoms.

The engine may represent these as:

- possible faults,
- revealed fault categories,
- fault tags,
- candidate sets,
- or player knowledge state.

The game should reward narrowing possibilities rather than replacing random parts.

### 3. Test

Use Tools, Commands, Procedures, or built-in diagnostics to gain information.

Tests may:

- reveal a Fault,
- eliminate candidate Faults,
- reveal a component,
- reveal a fault category,
- traverse one step of a causal chain,
- produce measurements,
- or add Diagnosis progress.

### 4. Isolate

Determine the root cause, actionable fault, or required repair target.

A ticket may require:

- exact Fault identification,
- identification of the root Fault,
- identification only to a sufficient category,
- or a threshold of Diagnosis progress.

The requirement belongs to the Repair Ticket or scenario rules.

### 5. Repair

Perform a corrective action.

Examples:

- reseat a DIMM,
- replace a PSU,
- replace a failed drive,
- reconnect a cable,
- correct BIOS boot order,
- rebuild a RAID array,
- restore a bootloader,
- clean a heatsink,
- replace a fan.

Repairs should generally require the appropriate Component, Procedure, Tool, resource cost, or combination thereof.

### 6. Verify

A repair is not complete merely because a corrective action was attempted.

Verification may include:

- successful POST,
- memory diagnostic,
- SMART/drive test,
- RAID status check,
- boot test,
- network connectivity test,
- stress test,
- burn-in test,
- temperature observation.

### 7. Document

Complete the service record.

Documentation can be lightweight in the base rules and expanded later.

Possible effects:

- close the ticket,
- gain efficiency bonuses,
- recover resources,
- improve later repairs,
- generate history that Documentation cards can reference.

---

## Fault Chains

The engine should support causal Fault chains from v0.1, even if most prototype tickets contain only one Fault.

Example:

**Dust-clogged heatsink**
→ causes **CPU overheating**
→ causes **thermal throttling**
→ may cause **unexpected shutdown under load**

The graph must be **directed and acyclic** for causal relationships.

A Fault may cause:

- another Fault,
- one or more Symptoms,
- changes to Server State.

A shallower Fault can therefore function as both:

- an effect of a deeper/root Fault, and
- a cause of another downstream Fault or Symptom.

### Recommended v0.1 restraint

Support the data model and validation for chains, but use:

- mostly single-Fault tickets,
- some 2-Fault chains,
- very few 3-Fault chains.

This lets the prototype test causal reasoning without making every repair puzzle cumbersome.

---

## Efficiency / Root Cause Reward

The game should discourage "parts cannon" troubleshooting.

Possible rule:

**Root Cause Bonus:** If the player correctly isolates the root actionable Fault before performing an unnecessary replacement, gain an efficiency reward.

The reward could later be:

- +1 Service Point,
- a card draw,
- reduced repair cost,
- Technician reputation,
- or another resource.

This rule should be playtested carefully because it directly affects scoring speed.

---

## Core Resources

The prototype should minimize bookkeeping.

Recommended initial resource:

### Actions

Each player receives a small number of Actions per turn.

Cards and effects may consume Actions.

Later expansions may introduce:

- Time,
- Budget,
- Tool availability,
- Bench capacity,
- Downtime,
- Parts inventory,
- Technician skill.

These should not all be core resources in v0.1.

---

## Core Design Principle

The game should teach causal troubleshooting rather than trivia recall.

A good card effect should usually reflect what the real tool, command, component, procedure, or concept actually helps a technician accomplish.

Examples:

- `lsblk` reveals storage-device information.
- POST codes narrow startup faults.
- a multimeter tests electrical states.
- a known-good DIMM helps isolate memory faults.
- a burn-in test verifies stability.
- documentation improves traceability or future information.

The closer gameplay semantics track real troubleshooting semantics, the more the player learns simply by becoming better at the game.
