# Server Repair Card Game — Data Architecture

This document is a foundational architecture guide. [`decisions/FROZEN_RULES.md`](decisions/FROZEN_RULES.md) controls approved behavior; illustrative field lists here are not substitutes for versioned schemas. [`decisions/UNFROZEN_RULES.md`](decisions/UNFROZEN_RULES.md) is currently empty.

## Architectural Principle

Separate **domain entities** from **cards**.

A real troubleshooting concept such as a Fault, Component, Symptom, Test, or Repair Procedure should exist as reusable structured data.

Cards reference those entities and grant players ways to interact with them.

This avoids encoding the entire technical knowledge model inside individual cards.

The architecture must also keep **Knowledge State** separate from authoritative machine state. Tests change what an authorized Player or team knows. Repairs change the machine. Documentation publishes authorized projections of existing records.

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
- fault causal relationships,
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
- PublicCandidateSet
- AuthoredEvidenceOutcome
- IsolationRequirement
- ClosureRequirement

A ticket is not merely a Fault. It is a scenario that combines:

- server/environment,
- symptoms,
- one or more faults,
- a public authored candidate set,
- server-only causal truth and authored Test outcomes,
- visibility rules,
- evidence-supported Isolation requirements,
- repair requirements,
- verification requirements,
- structured closure requirements,
- and server-only Isolation/Repair scoring-slot metadata derived from required actionable Fault instances.

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
- EvidenceRecord
- ResourcePool
- EffectStack / ResolutionQueue
- TurnState
- ActionRecord
- GameEvent
- WorklogProjection
- ContributionLedger
- ClosureRecord

## E. Rules / Services Layer

Implements game logic.

Suggested services:

- TurnEngine
- CardResolver
- TicketEngine
- DiagnosisEngine
- FaultCausalityService
- IsolationEngine
- RepairEngine
- VerificationEngine
- DocumentationEngine
- ScoringEngine
- SearchIndexService
- ValidationService
- DeckValidator

There is no account/loadout Equipment service or match-state object. Technical Tools and persistent playable-card zones are unrelated to the removed Equipment system. Qualifications are recognition-only account metadata and have no runtime match representation.

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

Fault-to-Fault causal relationships should be stored separately as directed causal edges rather than nested recursive objects.

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

The set of `causes` relationships must remain a directed acyclic graph (DAG).

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

Represents an investigative definition. Each runtime execution is a distinct immutable action and attached result that changes Knowledge State, not machine state.

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
authored_outcome_rules[]   # SUPPORT, CONTRADICT, RULE_OUT, CONFIRM, observation, INCONCLUSIVE
diagnostic_strength
cost
education_text
```

Tests should be able to return structured outcomes rather than only "pass/fail."

The Ticket's authored outcome matrix determines the eligible result for a particular target and machine-state revision. A diagnostic substitution is modeled as a Test whose temporary known-good resource reverts after comparison; a permanent change is a Repair.

---

## RepairProcedure

Represents an action intended to correct a Fault. In the ordinary core flow, execution is legal only after accepted Isolation and when the procedure targets the isolated actionable Fault.

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

Represents the domain procedure used by the gameplay **Verify** function after Repair. The stable entity name remains `ValidationProcedure`; this does not create a separate gameplay stage called Validation.

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

Each Verify execution creates a distinct immutable pass, fail, or inconclusive result. A pass is current only when it follows the latest relevant Repair. A failed or inconclusive result remains Evidence and returns the Ticket to Diagnosis without erasing earlier history or machine changes.

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

Defines a reusable authored repair scenario. Public surfaces and server-only truth live in one authoritative definition but are projected separately.

```text
id
name
difficulty
server_profile_id
initial_symptom_ids[]
public_candidate_fault_ids[]
fault_blueprint[]                    # SERVER_ONLY truth instances/causal path
authored_evidence_outcomes[]         # SERVER_ONLY outcome matrix
isolation_requirement
repair_requirements[]
verification_requirements[]
closure_requirement
time_or_action_modifiers
educational_objectives[]
scoring_slot_metadata               # one Isolation and one necessary-Repair slot per required actionable Fault
expansion_id
```

---

## TicketFaultBlueprint

Specifies how true Fault instances appear inside one Ticket. It is server-only causal truth, not the public candidate list.

```text
fault_instance_key
fault_id
role                 # root, intermediate, terminal/actionable
actionable
deepest
required_to_repair
upstream_fault_instance_keys[]
downstream_fault_instance_keys[]
```

A Ticket can reference a subset of the global Fault causal relationships. Public candidate IDs are authored separately and may include plausible non-truth candidates. Existing stable Fault IDs are never renamed to encode their Ticket role.

---

## AuthoredEvidenceOutcome

Maps an eligible Test or Command execution to a structured result under authored target and machine-state conditions.

```text
outcome_rule_id
source_entity_id
target_surface
machine_state_predicate
candidate_or_fault_instance_ref
outcome              # SUPPORT, CONTRADICT, RULE_OUT, CONFIRM, observation, INCONCLUSIVE
result_visibility
result_payload
```

The rule is content, not a runtime reveal. Only the selected authorized result becomes an Evidence record.

---

## IsolationRequirement

Defines which authored Evidence citations support committing one public candidate as an actionable Fault.

```text
requirement_id
candidate_fault_id
required_outcome_rule_ids[]
minimum_satisfied_conditions
actionable_classification
deepest_classification
eligible_repair_procedure_ids[]
```

Exact requirement encoding is schema-owned. The invariant is that accepted Isolation cites sufficient authored Evidence and gates ordinary Repair.

---

## TicketState

Runtime state for one shared active Ticket. A claim or owner exists only if an explicit effect creates one.

```text
ticket_instance_id
ticket_definition_id
status                              # queued | diagnosis | repair_ready | awaiting_verify |
                                    # returned_to_diagnosis | ready_to_close | closed
visible_symptom_ids[]
public_candidate_fault_ids[]
machine_state_revision
accepted_isolation_history[]         # contributor + cited Evidence + classification + time
current_accepted_isolation_id
repair_history[]
verification_history[]               # current/stale passes plus preserved failures/inconclusives
current_verify_pass_ids[]
worklog_entry_ids[]
published_record_ids[]
contribution_record_ids[]             # frozen Isolation/Repair slot records
closure_record_id_optional
```

Failed Verify appends history, invalidates affected current passes, preserves prior Evidence and machine changes, and sets `returned_to_diagnosis`. It never resets the Ticket to a blank state. A later pass does not delete the earlier failure.

---

## KnowledgeState

Tracks what one authorized Player or cooperative team knows about one Ticket.

This is important because the real ticket state and the player's information are different things.

```text
knowledge_state_id
subject_player_id_or_team_id
visibility_scope                    # PRIVATE_PLAYER | TEAM
ticket_instance_id
known_symptom_ids[]
candidate_annotations[]             # supported, contradicted, ruled out, confirmed
evidence_event_ids[]
current_hypothesis_candidate_ids[]   # zero to two public candidates
hypothesis_history[]
```

Knowledge State references Evidence that the subject is authorized to see. It never embeds machine state, server-only causal truth, or a truth response to a Hypothesis marker.

---

## Action, event, and Worklog identity

Every accepted intent produces stable immutable identity before projections are derived.

```text
ActionIntent
  intent_id
  actor_player_id
  action_or_card_instance_id
  target_ref
  expected_match_revision

ActionRecord
  action_id
  intent_id
  sequence
  actor_player_id
  ticket_instance_id
  action_or_card_instance_id
  target_ref
  action_cost
  action_time
  result_event_id_optional
```

Stale or otherwise pre-payment rejection creates no Action record, card movement, Action spend, or Worklog entry.

```text
GameEvent
  event_id
  sequence
  revision
  event_type
  visibility                    # SERVER_ONLY | PRIVATE_PLAYER | TEAM | PUBLIC_MATCH
  source_action_id_optional
  payload
  created_at

WorklogEntry
  worklog_entry_id
  sequence
  source_action_id
  public_placeholder
  action_time
  publication_event_ids[]
  published_projection_optional
  locked_at_closure
```

Document Live enriches the existing `WorklogEntry` in place. Its later publication event links back to the source action and records publication time and publisher; it does not reorder history.

---

## Contribution and closure records

Contribution storage represents the frozen closure-settled scoring rule:

```text
ContributionRecord
  contribution_id
  source_action_id
  ticket_instance_id
  contributor_player_id
  contributor_team_id_optional
  fault_instance_id
  contribution_class             # isolation | repair
  slot_key                        # unique Ticket + Fault instance + class
  point_value                     # 1 in the first version
  settlement_status             # pending | awarded | ineligible | superseded
  score_event_ids[]

ClosureRecord
  closure_id
  ticket_instance_id
  closer_player_id
  closer_team_id_optional
  accepted_isolation_id
  decisive_evidence_event_ids[]
  repair_action_ids[]
  failed_verify_event_ids[]
  current_passing_verify_event_ids[]
  closed_at
```

Closure costs zero Actions, recovers no card, awards no Service Points for closing, and retains Player/team closure attribution as statistics. The earliest qualifying final-path event owns each slot. Root Cause, Tests, Verify, Documentation, assists, and repeated equivalents remain statistics. Cooperative settlements credit the shared team score and retain the contributing Player ID.

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
ADD_EVIDENCE
ANNOTATE_CANDIDATE
REPAIR_FAULT
VERIFY
REDUCE_COST
GAIN_ACTION
RECOVER_CARD
INSPECT_COMPONENT
MOVE_TICKET
MODIFY_TEST
PREVENT_EFFECT
```

The `SEARCH` effect primitive is card content and remains distinct from the universal Search Token basic action. `REPAIR_FAULT` always enforces the accepted-Isolation gateway. `VERIFY` creates a distinct immutable result; it never rewrites an earlier result. Effects that add Evidence must resolve through the Ticket's authored outcome rules and authorized visibility.

Avoid creating a unique hard-coded function for every card unless necessary. Do not make universal actions draw-dependent: reviewing authorized information, revising a Hypothesis, Commit Isolation, Document Live, zero-Action closure publication, passing, Search, and Deck Refresh belong to the rules service even when cards can modify them.

---

# 5. Rule Mapping to the Troubleshooting Loop

| Evidentiary function | Concrete architecture |
|---|---|
| Observe | Symptom, authorized Ticket projection, public Worklog |
| Diagnosis — Hypothesize | public candidate set, private/team KnowledgeState, DiagnosisEngine |
| Diagnosis — Test | Test, Tool, Command, AuthoredEvidenceOutcome, CardResolver |
| Diagnosis — Isolate | IsolationRequirement, cited Evidence, IsolationEngine, public Ticket progress |
| Repair | accepted Isolation gateway, RepairProcedure, machine state, RepairEngine |
| Verify | ValidationProcedure, current/stale pass tracking, VerificationEngine |
| Failed Verify return | preserved Evidence/Repair/Verify history, `returned_to_diagnosis` Ticket state |
| Document | WorklogEntry, Document Live publication, ClosureRecord, DocumentationEngine |
| Score | unique one-point Isolation/Repair ContributionRecords settled into public ScoreEvents at closure |
| Compete/cooperate | RepairQueueState, MatchState, team/player-safe projections |
| Expand | CardDefinition + stable Domain Knowledge IDs + expansion metadata |

The mapping is not a one-way pipeline. Hypothesize and Test iterate; accepted Isolation gates ordinary Repair; failed Verify returns to Diagnosis; Documentation may occur throughout and remains mandatory at closure.

## First-version match-state invariants

The rules version, rather than Room customization, supplies the frozen first-version card envelope: a 30-card deck, maximum three copies per card ID, opening hand five, one start-turn draw when possible, two Actions, costs 0–2, no hand limit, and no empty-draw loss. Player state records public Search/Refresh amounts and caps. The standard preset uses Search `3/5` with a one-token closure grant and Refresh `1/1`.

Turn state needs an explicit immediate closure-resolution window so a successful Verify that spends the last Action can still reach zero-Action closure before automatic end-turn.

---

# 6. Fault Causal-Relationship Validation

Every content build should validate the global set of fault causal relationships.

Minimum checks:

1. every referenced Fault ID exists,
2. no self-loop exists,
3. no duplicate causal edge exists,
4. no directed cycle exists,
5. every ticket's causal relationships exist in the global relationship set,
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
