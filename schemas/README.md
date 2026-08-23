# Schema package

The schemas are draft, versioned contracts for two different kinds of data:

- [`domain/`](domain/) describes authored technical knowledge, card definitions, and Repair Ticket definitions that exist independently of a match.
- [`runtime/`](runtime/) describes mutable authoritative match state, immutable events, action requests/results, and player-safe projections.

Domain data answers **what a technical concept or playable definition is**. Runtime data answers **what has happened to one match instance and what a particular audience may see**. A runtime object normally references a domain definition by stable ID instead of copying its name, illustration, educational content, or rules definition.

JSON Schema validates object shape. Cross-file references, causal acyclicity, Ticket solvability, card-zone reconciliation, visibility, chronology, and other game invariants require the semantic validation described in [`docs/schema-notes/`](../docs/schema-notes/).

## Domain schemas

| Schema | Authored responsibility |
| --- | --- |
| [`card.schema.json`](domain/card.schema.json) | A playable or reference card definition: gameplay identity, presentation, cost, technical references, and structured effects. It is not one physical copy in a match. |
| [`command.schema.json`](domain/command.schema.json) | A command's platform, syntax, purpose, capabilities, and related Tests. |
| [`component.schema.json`](domain/component.schema.json) | A hardware/component concept, including subsystem, interfaces, compatibility, and serviceability traits. |
| [`fault.schema.json`](domain/fault.schema.json) | A reusable Fault concept and its relationships to Symptoms, Components, Tests, Repairs, and Verification. |
| [`fault_causal_edge.schema.json`](domain/fault_causal_edge.schema.json) | One authored directed causal relationship between two Fault definitions. The complete selected graph must be acyclic. |
| [`protocol.schema.json`](domain/protocol.schema.json) | A protocol or standard and its technical relationships. |
| [`repair_procedure.schema.json`](domain/repair_procedure.schema.json) | An authored machine-changing procedure, its Fault targets, prerequisites, and Action cost. Runtime legality still requires accepted Isolation. |
| [`repair_ticket.schema.json`](domain/repair_ticket.schema.json) | A complete authored troubleshooting scenario: public candidates, server-only causal truth, authored Evidence outcomes, Isolation/Repair/Verify requirements, and closure requirements. Fixed fixtures and Ticket Builder output share this contract. |
| [`symptom.schema.json`](domain/symptom.schema.json) | An observable symptom and its authored associations. A public symptom is not proof of a hidden Fault. |
| [`test.schema.json`](domain/test.schema.json) | An Evidence-producing diagnostic definition and its targets, requirements, strength, and Action cost. Tests change Knowledge State, not machine state. |
| [`tool.schema.json`](domain/tool.schema.json) | A technical Tool and its capabilities. Tools are unrelated to the removed account Equipment system. |
| [`validation_procedure.schema.json`](domain/validation_procedure.schema.json) | A post-Repair Verification procedure, its success conditions, targets, requirements, and Action cost. A pass does not close a Ticket by itself. |

See [`DOMAIN_SCHEMAS.md`](../docs/schema-notes/DOMAIN_SCHEMAS.md) for the authored Ticket boundary and semantic validation requirements.

## Runtime schemas

| Schema | Runtime responsibility |
| --- | --- |
| [`action_request.schema.json`](runtime/action_request.schema.json) | A revision-bound client intent with an exact actor, action/card, Ticket, and target. |
| [`action_result.schema.json`](runtime/action_result.schema.json) | A player-safe accepted or rejected result, payment outcome, projected events, and resolution-window changes. |
| [`card_instance.schema.json`](runtime/card_instance.schema.json) | One match-time copy of a Card Definition. It should contain identity and mutable placement/state only, never copied rules text or art. Its current limitations are analyzed in [`card-contract-and-build-order.md`](../docs/improvement_analysis/card-contract-and-build-order.md). |
| [`fault_state.schema.json`](runtime/fault_state.schema.json) | Server-only truth and machine state for one Fault instance in one Ticket. |
| [`game_event.schema.json`](runtime/game_event.schema.json) | One append-only semantic event with ordering, visibility, actor, source, and Worklog projection links. |
| [`knowledge_state.schema.json`](runtime/knowledge_state.schema.json) | Private Player or cooperative-team beliefs and Evidence; it never substitutes for authoritative Fault state. |
| [`match_state.schema.json`](runtime/match_state.schema.json) | The complete authoritative, versioned match aggregate. It must never be sent directly to a client. |
| [`player_state.schema.json`](runtime/player_state.schema.json) | Authoritative Player seat, card zones, resources, Knowledge States, contribution links, and connection state. |
| [`private_player_view.schema.json`](runtime/private_player_view.schema.json) | An authenticated Player projection containing the public view plus that Player's authorized hand, Evidence, events, and legal actions. |
| [`public_match_view.schema.json`](runtime/public_match_view.schema.json) | A `PUBLIC_MATCH`-only projection safe for Players and Spectators. |
| [`ticket_state.schema.json`](runtime/ticket_state.schema.json) | Ticket-owned lifecycle, machine revision, Isolation/Repair/Verify history, Documentation, pending causal contributions, and immutable closure record. |
| [`turn_state.schema.json`](runtime/turn_state.schema.json) | Draw, two-Action turn accounting, zero-Action limits, and the immediate closure-resolution window. |

See [`RUNTIME_SCHEMAS.md`](../docs/schema-notes/RUNTIME_SCHEMAS.md) for lifecycle, visibility, payment, Worklog, scoring, and fixture-validation details.

## Important boundaries

- Stable domain IDs and existing schema `$id` values are public contracts. Do not rename them without an explicit migration task.
- [`viewer/content/`](../viewer/content/) stores versioned packs of domain records for the static Domain Viewer. The individual records use the domain concepts above, while each viewer file also has a pack wrapper.
- A Card Definition may own card-specific presentation, including an optional illustration. A Card Instance should reference that definition and must not duplicate presentation data.
- Repair Ticket definitions contain authoring truth. Runtime Ticket State records only one instantiated Ticket's evolving history and authorized projections.
- Frozen behavior comes from [`FROZEN_RULES.md`](../docs/design/decisions/FROZEN_RULES.md), not from an example, schema description, or recommended model when they disagree.

