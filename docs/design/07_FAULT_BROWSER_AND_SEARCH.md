# Server Repair Card Game — Fault Browser and Search Design

The Fault Browser should be useful both as:

1. an educational encyclopedia outside matches, and
2. an optional searchable reference during matches.

Whether unrestricted in-match search is competitively desirable can be decided by game mode.

This reference search is distinct from the frozen gameplay **Search** basic action, which spends one Search Token and one Action to select a card from the Player's remaining draw deck. Browser access never spends or grants Search Tokens unless an explicit future rule says so.

The Browser reads reusable domain knowledge, not live authoritative Ticket truth. It must never reveal or rank a Ticket's `SERVER_ONLY` Fault instances, causal chain, authored outcome matrix, hidden scoring metadata, or another Player's private Evidence. Conversely, every active Ticket's public authored candidate set remains available through its authorized match projection regardless of whether a mode limits the broader encyclopedia.

---

# Fault Result Card

A search result can display:

- Fault name
- Fault category
- affected component/subsystem
- common symptoms
- short description
- difficulty
- root/intermediate/terminal tags
- expansion/set

Selecting it opens the full Fault record.

---

# Full Fault Page

Recommended sections:

## Identity

- Name
- ID
- Category
- Subsystem
- Affected Components

## What You May Observe

- Symptoms
- diagnostic indicators
- logs/messages
- common state changes

## What May Cause It

- upstream Faults
- environmental/configuration causes

## What It May Cause

- downstream Faults
- downstream Symptoms

## How to Inspect/Test It

- relevant inspections
- Tests
- Tools
- Commands

## How to Repair It

- Repair Procedures
- required Components
- safety/protocol requirements

## How to Verify the Repair

- Verification Procedures

## Related Cards

- player cards referencing this Fault
- tickets that may contain it

## Educational Notes

- concise explanation
- interview-relevant vocabulary
- common mistakes

---

# Search Modes

## Free Text

Search across:

- name
- summary
- symptoms
- component names
- tool names
- command names
- repair names
- tags
- educational notes

Examples:

```text
"no post"
"memory error"
"fans loud"
"lsblk"
"SAS"
"shutdown under load"
```

---

# Filters

Recommended v0.1 filters:

### Category
- Memory
- Power
- Storage
- RAID
- Boot
- Firmware
- Thermal
- Networking
- CPU
- Motherboard
- PCIe

### Component

Select one or more components.

### Symptom

Examples:

- No POST
- No Power
- No Boot Device
- RAID Degraded
- Unexpected Shutdown
- Device Missing
- No Network Link

### Effective Tool

Examples:

- Multimeter
- Management Console
- Known-good DIMM

### Effective Test

Examples:

- Visual Inspection
- Memory Diagnostic
- POST Code Analysis

### Effective Command

Examples:

- lsblk
- lspci
- dmesg

### Repair Type

Examples:

- Reseat
- Replace
- Reconfigure
- Rebuild
- Clean
- Restore

### Fault Depth / Role

- Root-capable
- Intermediate
- Terminal/actionable

### Difficulty

### Expansion / Set

---

# Sorting

Useful sorts:

- Alphabetical
- Category
- Difficulty
- Component
- Number of associated Symptoms
- Number of causal relationships
- Recently viewed
- Most frequently encountered in tickets

---

# Causal Relationships

Fault pages should expose upstream causes and downstream effects as accessible linked records. Players should be able to follow those relationships through the standard browser and compare the Tests that discriminate between nearby candidate Faults.

A separate interactive causal-chain visualization is not planned. The reusable relationship data remains available to the browser, game, and other educational experiences.

These global relationships are educational possibilities, not proof about the active Ticket. The authoritative server continues to project live information through `SERVER_ONLY`, `PRIVATE_PLAYER`, `TEAM`, and `PUBLIC_MATCH` visibility.

---

# In-Match Reference Modes

Possible modes:

## Study Mode

Full Fault Browser access.

Good for learning.

## Competitive Mode

Only previously discovered/unlocked information or limited reference access.

Good if unrestricted lookup reduces deduction too much.

This limitation cannot hide the active Ticket's public authored candidates or expose hidden truth by omission, ordering, emphasis, or result counts.

## Interview Drill Mode

Browser hidden until after the Player revises a Hypothesis marker.

Any grading occurs after the drill/session or through an explicitly authorized reveal. In a live match, changing a Hypothesis costs no Action, returns no truth response, and is not Commit Isolation.

The same data model can support all three.
