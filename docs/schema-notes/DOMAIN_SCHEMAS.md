# Domain schema package

The domain package describes reusable authored technical knowledge and authored Repair Ticket content. It does not describe mutable match state. The synchronized contracts implement the approved gameplay surfaces in [`FROZEN_RULES.md`](../design/decisions/FROZEN_RULES.md); the Unfrozen ledger is currently empty.

## Architectural boundary

- Tests create authored Evidence and change Knowledge State.
- Repair Procedures change authoritative machine/Fault state only after accepted Isolation opens the ordinary Repair gateway.
- Validation Procedures produce named Verify results; they do not close a Ticket themselves.
- Cards reference technical entities instead of duplicating their definitions. First-version Action costs are limited to zero, one, or two.
- Technical Tools remain a domain category. They are unrelated to the removed account/loadout Equipment mechanic.
- Qualifications have no domain or runtime gameplay contract because they are recognition-only account badges.

## Authored Repair Ticket contract

[`repair_ticket.schema.json`](../../schemas/domain/repair_ticket.schema.json) separates content that different audiences may eventually see:

- `initial_symptom_ids` and `public_candidate_fault_ids` are authored public surfaces.
- `server_only_truth` stores the causal Fault-instance blueprint and edge references. It must never enter a player-safe projection.
- `authored_evidence_outcomes` maps an eligible source, target, and machine-state key to `SUPPORT`, `CONTRADICT`, `RULE_OUT`, `CONFIRM`, or `INCONCLUSIVE` candidate effects. An unexecuted outcome remains server-only.
- `isolation_requirements` identify the Evidence outcomes and minimum citation count for an actionable/deepest classification.
- `repair_requirements` bind an isolated Fault to eligible Repair Procedures.
- `verification_requirements` require current passes after the latest relevant Repair.
- `closure_requirements` require the accepted Isolation, decisive Evidence, accepted-path Repairs, preserved failed Verifies, and all current passing Verifies.

The Ticket definition intentionally has no flat closure Service Point value. Closure itself is non-scoring. Runtime scoring derives one Isolation and one necessary-Repair slot for every required actionable Fault instance in the final valid path.

This is the authored output contract shared by fixed fixtures and deterministic Ticket Builder output. The Builder's pinned configuration, solver, seed/version provenance, failure behavior, and stored snapshots sit outside an individual Ticket definition.

## Included schemas

- `fault.schema.json`
- `symptom.schema.json`
- `component.schema.json`
- `tool.schema.json`
- `test.schema.json`
- `repair_procedure.schema.json`
- `validation_procedure.schema.json`
- `command.schema.json`
- `protocol.schema.json`
- `fault_causal_edge.schema.json`
- `repair_ticket.schema.json`
- `card.schema.json`

## Validation beyond JSON Schema

A content validator must also confirm that:

1. every referenced stable domain ID exists and has the expected entity type;
2. candidate effects and Isolation requirements reference candidates declared by the Ticket;
3. authored outcome IDs and Fault-instance keys are unique within a Ticket;
4. cited outcome IDs exist and can satisfy their requirement at the selected machine state;
5. Repair and Verify references are compatible with their target Faults;
6. causal edges contain no self-loop and the selected relationship set is acyclic;
7. every required closure member can be produced by the authored path; and
8. server-only truth and unexecuted outcomes are absent from all player-safe views.

Stable entity IDs and existing schema `$id` values remain public contracts. TASK-007 changes the shape of Repair Ticket content without renaming those IDs.
