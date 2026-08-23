# Server Repair Card Game — Implementation and Content Validation

[`decisions/FROZEN_RULES.md`](decisions/FROZEN_RULES.md) controls required behavior. This file recommends validation strategy for the frozen scoring and deterministic Ticket-generation policies.

## Recommendation for v0.1

Implement the **ability** to model Fault chains immediately.

Do not make deep chains mandatory for ordinary prototype gameplay.

Recommended content distribution:

- ~70% single-Fault tickets
- ~25% two-level causal tickets
- ~5% three-level causal tickets

These ratios are only starting points for playtesting.

They may guide manually authored content sets. They are not automatically Ticket Builder constraints. A scenario must encode any desired distribution in its versioned difficulty profile and structural bounds.

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

# Causal-Relationship Representation

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

The set of fault causal relationships must be acyclic.

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

- every public candidate ID resolves and does not itself reveal server-only causal truth;
- every required Test/Command and target has an authored structured Evidence outcome;
- at least one reachable Evidence set satisfies each intended Isolation requirement;
- accepted Isolation selects a true actionable Fault and opens at least one eligible Repair path;
- false or insufficient Isolation is indistinguishable as `ISOLATION_NOT_SUPPORTED` and changes no machine state;
- every ordinary Repair path is unreachable before accepted Isolation and its prerequisites can exist in a legal card pool;
- each required Repair has suitable Verification procedures and explicit success conditions;
- current passes occur after the latest relevant Repair;
- failed or inconclusive Verify returns to Diagnosis while preserving Evidence, Repair history, machine state, and the failed result;
- a later successful path remains reachable without deleting the earlier failure;
- the mandatory closure bundle can cite accepted Isolation, decisive Evidence, every Repair and failed Verify in the accepted path, and all current passing Verify results;
- Worklog placeholders, attached results, publication links, action times, and publication times remain internally consistent; and
- `SERVER_ONLY`, `PRIVATE_PLAYER`, `TEAM`, and `PUBLIC_MATCH` projections reveal no unauthorized information.

The Ticket Builder must run the same solvability checks after deterministic assembly. Identical configuration, content version, generator version, and seed must reproduce the same validated Ticket snapshots; a content version therefore identifies an immutable authored input set for generation. Unsatisfiable configurations fail with structured diagnostics and never silently relax guarantees.

---

## Frozen behavior matrix

Behavior-focused validation should cover at least:

- iterative Hypothesis/Test work followed by accepted and rejected Commit Isolation;
- Repair allowed only after accepted Isolation and rejected before payment otherwise;
- failed Verify returning to Diagnosis with preserved history, then later successful Verify;
- incremental Document Live, card recovery exactly once, and immutable Worklog enrichment;
- zero-Action closure during the immediate post-Verify window, including when Verify spends the last Action;
- no closure Service Point, with separate Player/team closure statistics and unique one-point Isolation/necessary-Repair slots;
- the atomic closure order: validate, lock records, settle eligible Isolation/Repair score events, archive, grant resources, reconcile queue, evaluate termination, end turn;
- competitive private Evidence, cooperative team Evidence, and public Documentation;
- stale-revision rejection before payment;
- legal 30-card decks, maximum three copies, opening five, start-turn draw, two Actions, costs 0–2, no hand limit, and same-name 0-Action limit;
- empty draw skipping without loss, exhaustion, or concession;
- Search and Refresh costs, shuffles, caps, and post-closure grants; and
- absence of account/loadout Equipment plus absence of any Qualification gameplay or access effect.

Scoring tests must verify one Isolation and one necessary-Repair slot per required actionable Fault, earliest-event ownership, final-path eligibility, closure-only settlement, public settled events, no Root Cause bonus, and direct cooperative team credit with individual attribution.

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
3. Implement fault causal relationships and cycle validation.
4. Implement authored Repair Ticket definitions: public candidates, server-only causal truth/outcomes, Isolation, Repair, Verify, and closure requirements.
5. Implement match state, Knowledge State, immutable action/event identity, player-safe projections, and the shared Ticket queue.
6. Implement iterative Diagnosis (`Hypothesize <-> Test -> Isolate`), the ordinary Repair gateway, failed-Verify return, incremental Documentation, and zero-Action closure.
7. Implement the frozen deck/turn/Search/Refresh envelope, causal scoring slots, and complete closure transaction.
8. Implement the deterministic constraint-driven Ticket Builder and snapshot/version persistence.
9. Implement generic card effects with explicit targets and Worklog projection.
10. Implement Fault/Card browser search and filtering without access to live hidden truth.
11. Add starter authored content and automated content/behavior validation to CI.

The important principle is that **content expansion should mostly mean adding data, not rewriting engine code**.
