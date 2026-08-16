# Server Repair Card Game — Data Architecture

## Architectural Principle

Separate **domain entities** from **cards**.

A real troubleshooting concept such as a Fault, Component, Symptom, Test, or Repair Procedure should exist as reusable structured data.

Cards reference those entities and grant players ways to interact with them.

This avoids encoding the entire technical knowledge model inside individual cards.

---

# 1. Major Layers

## A. Domain Knowledge Layer

Represents server-repair knowledge independent of a match.

Core entities:

- Fault
- Symptom
- Component
- Tool
- Test
- RepairProcedure
- ValidationProcedure
- ProtocolOrStandard
- Command
- ServerModel / ServerProfile
- KnowledgeTag

This layer powers:

- card creation,
- fault browsing,
- search,
- filtering,
- ticket generation,
- causal graphs,
- educational reference pages.

## B. Card Definition Layer

Represents collectible/playable game content.

Core entities:

- CardDefinition
- ComponentCard
- ToolCard
- TestCard
- ProcedureCard
- CommandCard
- WorkflowCard
- ProtocolCard
- EventCard
- TechnicianCard (optional)
- FaultCard / FaultReferenceCard
- RepairTicketCard

Cards should normally reference Domain Knowledge entities by ID.

## C. Scenario Layer

Defines repair puzzles.

Core entities:

- RepairTicketDefinition
- TicketFaultInstance
- TicketSymptomInstance
- ServerInstanceDefinition
- VerificationRequirement
- DocumentationRequirement
- RewardDefinition

A ticket is not merely a Fault. It is a scenario that combines:

- server/environment,
- symptoms,
- one or more faults,
- visibility rules,
- repair requirements,
- verification requirements,
- scoring.

## D. Runtime Match Layer

Tracks mutable game state.

Core entities:

- MatchState
- PlayerState
- DeckState
- HandState
- RepairQueueState
- TicketState
- FaultState
- KnowledgeState
- ResourcePool
- EffectStack / ResolutionQueue
- TurnState
- GameLog

## E. Rules / Services Layer

Implements game logic.

Suggested services:

- TurnEngine
- CardResolver
- TicketEngine
- DiagnosisEngine
- FaultGraphService
- RepairEngine
- VerificationEngine
- ScoringEngine
- SearchIndexService
- ValidationService
- DeckValidator

---

# 2. Core Domain Classes

## Fault

Represents an actual failure condition or misconfiguration.

Suggested fields:

```text
id
name
summary
category
severity
component_ids[]
affected_subsystem_ids[]
symptom_ids[]
effective_test_ids[]
repair_procedure_ids[]
validation_procedure_ids[]
cause_tags[]
effect_tags[]
search_tags[]
education_text
expansion_id
```

Relationships:

```text
Fault --causes--> Fault
Fault --produces--> Symptom
Fault --affects--> Component/Subsystem
Test --detects_or_eliminates--> Fault
RepairProcedure --resolves--> Fault
ValidationProcedure --verifies_resolution_of--> Fault
```

Fault-to-Fault causal relationships should be stored separately as graph edges rather than nested recursive objects.

---

## FaultCausalEdge

Represents one directed causal relationship.

```text
id
cause_fault_id
effect_fault_id
relationship_type
weight_or_probability_optional
conditions_optional
notes
```

Examples:

```text
clogged_heatsink -> cpu_overheating
cpu_overheating -> thermal_shutdown
failed_dhcp_service -> no_dhcp_lease
```

### Constraint

Adding an edge must not create a directed cycle.

The Fault graph must remain a DAG for `causes` relationships.

Other non-causal relationships do not necessarily need this restriction.

---

## Symptom

Represents observable evidence rather than underlying cause.

```text
id
name
description
category
observable_via_ids[]
associated_fault_ids[]
search_tags[]
```

Examples:

- No POST
- Fans spin
- Memory diagnostic LED illuminated
- RAID degraded
- No boot device found
- Interface has no link
- System shuts down under load
- Elevated CPU temperature

---

## Component

Represents hardware or another replaceable/configurable technical element.

```text
id
name
component_type
subsystem
interfaces[]
compatibility_tags[]
hot_swappable
replaceable
inspectable
search_tags[]
education_text
```

Examples:

- ECC DIMM
- SAS HDD
- NVMe SSD
- RAID Controller
- PSU
- System Board
- CPU
- NIC
- Fan
- Backplane
- SAS cable

---

## Tool

Represents physical or software diagnostic equipment.

```text
id
name
tool_type
capabilities[]
applicable_component_types[]
applicable_fault_tags[]
safety_notes[]
search_tags[]
```

Examples:

- Multimeter
- ESD strap
- Known-good PSU
- POST diagnostic card
- Vendor management interface
- Screwdriver set

---

## Test

Represents an investigative action.

```text
id
name
test_type
tool_requirements[]
command_requirements[]
target_types[]
detects_fault_ids[]
eliminates_fault_ids[]
reveals_symptom_ids[]
diagnostic_strength
cost
education_text
```

Tests should be able to return structured outcomes rather than only "pass/fail."

---

## RepairProcedure

Represents an action intended to correct a Fault.

```text
id
name
target_fault_ids[]
required_components[]
required_tools[]
required_protocols[]
steps_summary[]
cost
risk_tags[]
education_text
```

---

## ValidationProcedure

Represents an action used after repair to prove operational success.

```text
id
name
validates_fault_ids[]
target_subsystems[]
required_tools[]
success_conditions[]
cost
education_text
```

---

## Command

Represents a CLI command or software operation.

```text
id
name
platform
syntax
purpose
capabilities[]
related_tests[]
search_tags[]
education_text
```

Examples:

- lsblk
- lspci
- dmesg
- ip addr
- ping
- smartctl
- journalctl

---

## ProtocolOrStandard

Represents a protocol, interface standard, safety protocol, or procedural standard.

```text
id
name
protocol_type
purpose
related_components[]
related_faults[]
related_procedures[]
search_tags[]
education_text
```

Examples:

- SATA
- SAS
- NVMe
- PCIe
- DHCP
- DNS
- ESD procedure
- RAID levels

---

# 3. Scenario Classes

## RepairTicketDefinition

Defines a reusable repair scenario.

```text
id
name
difficulty
service_points
server_profile_id
initial_symptom_ids[]
fault_blueprint[]
diagnosis_requirement
repair_requirement
verification_requirement_ids[]
documentation_requirement_id
time_or_action_modifiers
educational_objectives[]
expansion_id
```

---

## TicketFaultBlueprint

Specifies how Faults appear inside one ticket.

```text
fault_id
role                 # root, intermediate, terminal/actionable
initial_visibility   # hidden, category_only, visible
required_to_identify
required_to_repair
```

A ticket can reference a subgraph of the global Fault DAG.

---

## TicketState

Runtime state for one active ticket.

```text
ticket_definition_id
assigned_player_id_optional
status
revealed_symptom_ids[]
revealed_fault_ids[]
eliminated_fault_ids[]
suspected_fault_ids[]
repaired_fault_ids[]
verification_results[]
documentation_complete
diagnosis_progress
unnecessary_repairs_count
service_points_awarded
```

---

## KnowledgeState

Tracks what a particular player knows about a particular ticket.

This is important because the real ticket state and the player's information are different things.

```text
player_id
ticket_id
known_symptoms[]
known_faults[]
eliminated_faults[]
known_categories[]
test_history[]
hypothesis_ids[]
```

The engine should not accidentally expose hidden Fault data to the UI.

---

# 4. Card Architecture

## CardDefinition

All playable cards share a common base definition.

```text
id
name
card_type
archetypes[]
cost
tags[]
rules_text
effect_ids[]
reference_entity_ids[]
rarity_optional
expansion_id
educational_text
```

The effect system should be data-driven where practical.

Example effect primitives:

```text
DRAW
SEARCH
REVEAL
ELIMINATE_CANDIDATE
ADD_DIAGNOSIS
REPAIR_FAULT
VERIFY
REDUCE_COST
GAIN_ACTION
RECOVER_CARD
INSPECT_COMPONENT
MOVE_TICKET
CLAIM_TICKET
MODIFY_TEST
PREVENT_EFFECT
```

Avoid creating a unique hard-coded function for every card unless necessary.

---

# 5. Rule Mapping to the Troubleshooting Loop

| Game Step | Concrete Architecture |
|---|---|
| Observe | Symptom, RepairTicketDefinition, TicketState |
| Hypothesize | KnowledgeState, suspected Faults, DiagnosisEngine |
| Test | Test, Tool, Command, CardResolver |
| Isolate | Fault, FaultCausalEdge, FaultGraphService |
| Repair | RepairProcedure, Component, RepairEngine |
| Verify | ValidationProcedure, VerificationEngine |
| Document | Documentation requirement, Workflow cards, TicketEngine |
| Score | RewardDefinition, ScoringEngine |
| Compete | RepairQueueState, MatchState |
| Expand | CardDefinition + Domain Knowledge IDs + Expansion metadata |

---

# 6. Fault Graph Validation

Every content build should validate the global causal graph.

Minimum checks:

1. every referenced Fault ID exists,
2. no self-loop exists,
3. no duplicate causal edge exists,
4. no directed cycle exists,
5. every ticket's fault subgraph exists inside the global graph,
6. root Faults in a ticket are actually ancestors of their stated downstream Faults,
7. repair and verification references point to valid entities.

Recommended implementation:

- adjacency-list representation,
- DFS color-state cycle detection or Kahn's topological sort,
- fail content build/CI if a cycle is introduced.

Pseudo-rule:

```text
When adding cause A -> effect B:
    reject if A == B
    reject if a path already exists from B -> A
    otherwise accept
```

This makes accidental cycles impossible even as expansions add thousands of Faults.

---

# 7. Expansion Safety

Every entity should have stable IDs independent of display names.

Example:

```text
fault.memory.dimm.not_seated
fault.storage.sas.drive_failed
symptom.boot.no_boot_device
component.memory.ecc_dimm
test.memory.single_dimm_isolation
```

Do not use card names as primary keys.

Expansion packages should add content rather than modify core engine classes whenever possible.
