# Domain schema package

The domain package describes reusable authored technical knowledge and authored Repair Ticket content. It does not describe mutable match state. The synchronized contracts implement the approved gameplay surfaces in [`FROZEN_RULES.md`](../design/decisions/FROZEN_RULES.md); only deferred V2 dependency inference remains Unfrozen.

## Architectural boundary

- Tests create authored Evidence and change Knowledge State.
- Repair Procedures change authoritative machine/Fault state only after accepted Isolation opens the ordinary Repair gateway.
- Validation Procedures produce named Verify results; they do not close a Ticket themselves.
- Cards reference technical entities instead of duplicating their definitions. First-version Action costs are limited to zero, one, or two.
- A Card's `play_contract` is the executable definition. Its `DIAGNOSTIC`, `REPAIR`, or `VERIFY` discriminator fixes the allowed source, target surface, prerequisite, authored resolution family, and one-shot disposition; prose `rules_text` cannot add behavior.
- Technical Tools remain a domain category. They are unrelated to the removed account/loadout Equipment mechanic.
- Qualifications have no domain or runtime gameplay contract because they are recognition-only account badges.

## Authored Repair Ticket contract

[`repair_ticket.schema.json`](../../schemas/domain/repair_ticket.schema.json) separates content that different audiences may eventually see:

- `initial_symptom_ids`, explicit `public_context_entity_ids`, and `public_candidate_fault_ids` are public surfaces. Under `repair-ticket-v2`, the Builder deterministically derives two through five Candidates from authored `associated_fault` relationships, always includes publicly plausible hidden Faults, and rejects indistinguishable distractors.
- `server_only_truth` stores the causal Fault-instance blueprint and edge references. It must never enter a player-safe projection.
- `authored_evidence_outcomes` maps every playable diagnostic source, target, and reachable machine-state key to exactly one typed result. Candidate effects use `SUPPORT`, `CONTRADICT`, `RULE_OUT`, `CONFIRM`, or `INCONCLUSIVE`; zero-effect outcomes are explicitly `CLEAN`, `IRRELEVANT`, or `INCONCLUSIVE`. An unexecuted outcome remains server-only.
- `isolation_requirements.routes` replace v1 flat citation counts with stable `DIRECT_OBSERVATION`, `DEFINITIVE_DIAGNOSTIC`, `CORROBORATED_SUPPORT`, `EVIDENCE_BACKED_ELIMINATION`, or `RECOVERY_DERIVED` alternatives. Each route has fixed candidate/target scope and typed fields rather than a loose expression bag.
- `repair_requirements` and `authored_repair_outcomes` bind an accepted isolated Fault instance, exact Repair Procedure, eligible machine-state key, resulting state, resolved instances, and whether the transition is necessary for closure.
- `verification_requirements` require current passes after the latest relevant Repair.
- `closure_requirements` require the accepted Isolation, decisive Evidence, accepted-path Repairs, preserved failed Verifies, and all current passing Verifies.

The Ticket definition intentionally has no flat closure Service Point value. Closure itself is non-scoring. Runtime scoring derives one Isolation and one necessary-Repair slot for every required actionable Fault instance in the final valid path.

This is the authored output contract shared by fixed fixtures and deterministic Ticket Builder output. [`ticket_builder_configuration.schema.json`](../../schemas/domain/ticket_builder_configuration.schema.json) pins every hard constraint, input version, legal card pool, generation index, seed, duplicate policy, and explicit fallback identity. [`ticket_builder_result.schema.json`](../../schemas/domain/ticket_builder_result.schema.json) retains each auditable attempt. A failed attempt has structured diagnostics and no partial Ticket; a configured fallback is a separate attempt rather than a relaxed primary result.

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
- `ticket_builder_configuration.schema.json`
- `ticket_builder_result.schema.json`
- `card.schema.json`
- `technical_action_glossary.schema.json`
- `technical_copy_review.schema.json`

## Validation beyond JSON Schema

A content validator must also confirm that:

1. every referenced stable domain ID exists and has the expected entity type;
2. candidate effects and Isolation requirements reference candidates declared by the Ticket;
3. authored outcome IDs and Fault-instance keys are unique within a Ticket;
4. cited diagnostic or failed-Verify outcome IDs exist and can satisfy their exact Isolation requirement at a reachable machine state;
5. every Repair targets its exact accepted isolated Fault, and Repair/Verify references are compatible with their domain definitions;
6. causal edges contain no self-loop and the selected relationship set is acyclic;
7. every required closure member can be produced by a legal Card pool through the authored state path;
8. Builder bounds, Progressive Difficulty bands, guarantees, duplicate fingerprints, and fallback identity are applied without relaxation; and
9. server-only truth and unexecuted outcomes are absent from all ordinary player-safe views;
10. every playable diagnostic has exactly one outcome per reachable state, every distractor has a `CONTRADICT`/`RULE_OUT` path, and every route ID and referenced outcome is unique and compatible; and
11. a v2 Builder failure returns no partial batch, including candidate/relevance/outcome migration failures.
12. every published playable action has one reviewed, family-appropriate technical description; generated Card copy equals that authoritative domain copy; glossary expansions and review-ledger hashes resolve; and learner-facing text contains neither placeholder templates nor engine-contract vocabulary.

Stable entity IDs and existing schema `$id` values remain public contracts. TASK-007 changes the shape of Repair Ticket content without renaming those IDs.
