# Server Repair Card Game — Implementation and Content Validation

## Recommendation for v0.1

Implement the **ability** to model Fault chains immediately.

Do not make deep chains mandatory for ordinary prototype gameplay.

Recommended content distribution:

- ~70% single-Fault tickets
- ~25% two-level causal tickets
- ~5% three-level causal tickets

These ratios are only starting points for playtesting.

---

# Why Fault Chains Belong in the Architecture

Real troubleshooting often involves different levels of description.

Example:

```text
Failed fan
    -> CPU overheating
        -> thermal shutdown
            -> unexpected shutdown under load
```

A technician may initially observe only the final symptom.

Different tools reveal different depths of the causal structure.

This is useful educationally because it teaches the distinction between:

- symptom,
- immediate failure state,
- contributing cause,
- root/actionable cause.

However, forcing every case into a long chain would create busywork.

---

# Graph Representation

Recommended representation:

```text
Faults: dictionary/map by stable ID

Edges:
[
  { cause_fault_id, effect_fault_id, relationship_type: "causes" },
  ...
]
```

Runtime adjacency maps can be generated:

```text
outgoing[cause] -> effects[]
incoming[effect] -> causes[]
```

---

# Cycle Detection

A causal graph must be acyclic.

## Build-Time Validation

Use one of:

- DFS three-color cycle detection,
- Kahn topological sort.

Content loading should fail if a cycle exists.

## Edge-Insertion Validation

Before accepting a new causal edge `A -> B`:

1. reject `A == B`,
2. search whether `B` can already reach `A`,
3. if yes, reject the edge,
4. otherwise insert.

This permits editors to give immediate feedback.

---

# Other Content Validation Rules

## Referential Integrity

Every referenced entity ID must exist.

Examples:

- Fault references Component
- Test references Fault
- Repair Procedure references Fault
- Ticket references Fault
- Card references Test

All must resolve.

---

## Ticket Solvability

Every Repair Ticket should have at least one valid solution path.

Automated content tests should attempt to verify:

- each required Fault has a Repair Procedure,
- required repair prerequisites can exist in legal card pools,
- each required repair has at least one suitable Verification Procedure,
- hidden information can theoretically be uncovered,
- no mandatory Test depends on an unavailable entity.

This may evolve into a scenario solver later.

---

## Searchability

Every Fault should contain enough metadata to support:

- free-text search,
- category filtering,
- component filtering,
- symptom filtering,
- test/tool filtering,
- repair filtering,
- verification filtering,
- difficulty filtering,
- expansion filtering.

---

# Suggested Repository Structure

```text
/docs
    00_GAME_ENGINE_OVERVIEW.md
    01_DATA_ARCHITECTURE.md
    02_CARD_TYPES.md

/content
    faults/
    symptoms/
    components/
    tools/
    tests/
    commands/
    repair_procedures/
    verification_procedures/
    protocols/
    tickets/
    cards/

/schemas
    fault.schema.json
    component.schema.json
    ticket.schema.json
    card.schema.json

/src
    engine/
    domain/
    rules/
    search/
    validation/

/tests
    content/
        test_no_fault_cycles
        test_references_resolve
        test_ticket_solvability
    engine/

/expansions
    core_v0_1/
```

For an early JavaScript implementation, content can simply be JSON or JS objects validated by schemas/tests.

---

# Recommended Development Order

1. Define stable IDs and content schemas.
2. Implement Fault, Symptom, Component, Test, Repair, Verification entities.
3. Implement causal graph and cycle validator.
4. Implement Repair Ticket definitions.
5. Implement match state and shared ticket queue.
6. Implement Observe/Test/Diagnose/Repair/Verify/Document state transitions.
7. Implement generic card effects.
8. Implement Fault/Card browser search and filtering.
9. Add starter content.
10. Add automated content validation to CI.

The important principle is that **content expansion should mostly mean adding data, not rewriting engine code**.
