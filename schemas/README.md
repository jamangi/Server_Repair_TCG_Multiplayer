# Schema package

The schemas are draft, versioned contracts for three different kinds of data:

- [`domain/`](domain/) describes authored technical knowledge, card definitions, and Repair Ticket definitions that exist independently of a match.
- [`runtime/`](runtime/) describes mutable authoritative match state, immutable events, action requests/results, and player-safe projections.
- [`client/`](client/) describes browser-local profile, settings, decks, statistics, tutorial progress, and validated export data that never grants gameplay authority.

Domain data answers **what a technical concept or playable definition is**. Runtime data answers **what has happened to one match instance and what a particular audience may see**. A runtime object normally references a domain definition by stable ID instead of copying its name, illustration, educational content, or rules definition.

JSON Schema validates object shape. Cross-file references, causal acyclicity, Ticket solvability, card-zone reconciliation, visibility, chronology, and other game invariants require the semantic validation described in [`docs/schema-notes/`](../docs/schema-notes/).

## Domain schemas

| Schema | Authored responsibility |
| --- | --- |
| [`card.schema.json`](domain/card.schema.json) | An immutable playable definition with presentation, explicit technical references, cost, and a discriminated executable play contract. It is not one physical copy in a match. |
| [`command.schema.json`](domain/command.schema.json) | A command's platform, syntax, purpose, capabilities, and related Tests. |
| [`component.schema.json`](domain/component.schema.json) | A hardware/component concept, including subsystem, interfaces, compatibility, and serviceability traits. |
| [`fault.schema.json`](domain/fault.schema.json) | A reusable Fault concept and its relationships to Symptoms, Components, Tests, Repairs, and Verification. |
| [`fault_causal_edge.schema.json`](domain/fault_causal_edge.schema.json) | One authored directed causal relationship between two Fault definitions. The complete selected graph must be acyclic. |
| [`playable_coverage.schema.json`](domain/playable_coverage.schema.json) | The machine-readable playable-release audit connecting the pinned knowledge inventory to supported causal fingerprints, exact response resources, and deferred action definitions. |
| [`protocol.schema.json`](domain/protocol.schema.json) | A protocol or standard and its technical relationships. |
| [`repair_procedure.schema.json`](domain/repair_procedure.schema.json) | An authored machine-changing procedure, its Fault targets, prerequisites, and Action cost. Runtime legality still requires accepted Isolation. |
| [`repair_ticket.schema.json`](domain/repair_ticket.schema.json) | A complete authored troubleshooting scenario: v2 public context/candidates, server-only causal truth, complete typed Evidence outcomes, alternative Isolation routes, Repair/Verify requirements, and closure requirements. Fixed fixtures and Ticket Builder output share this contract. |
| [`symptom.schema.json`](domain/symptom.schema.json) | An observable symptom and its authored associations. A public symptom is not proof of a hidden Fault. |
| [`test.schema.json`](domain/test.schema.json) | An Evidence-producing diagnostic definition and its targets, requirements, strength, and Action cost. Tests change Knowledge State, not machine state. |
| [`technical_action_glossary.schema.json`](domain/technical_action_glossary.schema.json) | Reviewed first-use expansions and concise distinctions for terminology used by published playable actions. |
| [`technical_copy_review.schema.json`](domain/technical_copy_review.schema.json) | The source, acronym, uncertainty, review-status, and exact-copy digest ledger for every published playable action. |
| [`ticket_builder_configuration.schema.json`](domain/ticket_builder_configuration.schema.json) | One immutable, version-pinned set of hard generation constraints, duplicate policy, legal card pool, seed, and optional explicit fallback reference. |
| [`ticket_builder_result.schema.json`](domain/ticket_builder_result.schema.json) | The complete server-only audit of a primary and optional fallback Builder attempt, including structured diagnostics or complete Ticket snapshots—never partial output. |
| [`ticket_part_catalog.schema.json`](domain/ticket_part_catalog.schema.json) | Versioned compatible authored Ticket parts used for deterministic assembly, including fingerprints, public context, truth, outcomes, routes, Repair, Verify, closure, and teaching metadata. |
| [`tool.schema.json`](domain/tool.schema.json) | A technical Tool and its capabilities. Tools are unrelated to the removed account Equipment system. |
| [`validation_procedure.schema.json`](domain/validation_procedure.schema.json) | A post-Repair Verification procedure, its success conditions, targets, requirements, and Action cost. A pass does not close a Ticket by itself. |

See [`DOMAIN_SCHEMAS.md`](../docs/schema-notes/DOMAIN_SCHEMAS.md) for the authored Ticket boundary and semantic validation requirements.

## Runtime schemas

| Schema | Runtime responsibility |
| --- | --- |
| [`action_request.schema.json`](runtime/action_request.schema.json) | A revision-bound client intent with an exact actor, action/card, Ticket, and target. |
| [`action_result.schema.json`](runtime/action_result.schema.json) | A player-safe accepted or rejected result, payment outcome, projected events, and resolution-window changes. |
| [`card_instance.schema.json`](runtime/card_instance.schema.json) | One server-owned match copy of a pinned Card Definition. It contains identity and typed placement/state only, never copied rules text, art, generic counters, or client-authoritative mutations. |
| [`fault_state.schema.json`](runtime/fault_state.schema.json) | Server-only truth and machine state for one Fault instance in one Ticket. |
| [`game_event.schema.json`](runtime/game_event.schema.json) | One append-only semantic event with ordering, visibility, actor, source, and Worklog projection links. |
| [`knowledge_state.schema.json`](runtime/knowledge_state.schema.json) | Private Player or cooperative-team beliefs and Evidence; it never substitutes for authoritative Fault state. |
| [`match_state.schema.json`](runtime/match_state.schema.json) | The complete authoritative, versioned match aggregate. It must never be sent directly to a client. |
| [`player_state.schema.json`](runtime/player_state.schema.json) | Authoritative Player seat, card zones, resources, Knowledge States, contribution links, and connection state. |
| [`private_player_view.schema.json`](runtime/private_player_view.schema.json) | An authenticated Player projection containing the public view plus hand, persistent Diagnostic Bench/relevance, authorized Evidence/eliminations, legal intents, and post-abandonment private reveals. |
| [`public_match_view.schema.json`](runtime/public_match_view.schema.json) | A `PUBLIC_MATCH`-only projection safe for Players and Spectators, including sanitized closure and abandonment state but never solution truth. |
| [`ticket_state.schema.json`](runtime/ticket_state.schema.json) | Ticket-owned lifecycle, machine/diagnosis revisions, elimination and Isolation/Repair/Verify history, Documentation, pending/void contributions, immutable closure, or terminal abandonment. |
| [`turn_state.schema.json`](runtime/turn_state.schema.json) | Draw, two-Action turn accounting, zero-Action limits, and the immediate closure-resolution window. |

See [`RUNTIME_SCHEMAS.md`](../docs/schema-notes/RUNTIME_SCHEMAS.md) for lifecycle, visibility, payment, Worklog, scoring, and fixture-validation details.

## Client schemas

| Schema | Local-client responsibility |
| --- | --- |
| [`local_profile.schema.json`](client/local_profile.schema.json) | Local display name and cosmetic icon selection. |
| [`deck_collection.schema.json`](client/deck_collection.schema.json) | Version-pinned legal local response decks. |
| [`local_settings.schema.json`](client/local_settings.schema.json) | Match setup and presentation preferences. |
| [`aggregate_statistics.schema.json`](client/aggregate_statistics.schema.json) | Idempotent local solo result aggregates. |
| [`tutorial_catalog.schema.json`](client/tutorial_catalog.schema.json) | Pinned semantic Tutorial checkpoints, expected authoritative events, and real-content references. |
| [`tutorial_progress.schema.json`](client/tutorial_progress.schema.json) | Cosmetic local completion IDs for replayable Tutorials. |
| [`export_bundle.schema.json`](client/export_bundle.schema.json) | Validated local backup envelope; active Match and solution truth are excluded. |
| [`sfx_recipe_catalog.schema.json`](client/sfx_recipe_catalog.schema.json) | Procedural UI recipe parameters, prototype provenance, and bounded runtime voice policy. |
| [`sfx_ui_catalog.schema.json`](client/sfx_ui_catalog.schema.json) | App-wide interaction-to-intent/recipe mappings and explicit `NO_SFX` dispositions. |

## Important boundaries

- Stable domain IDs and existing schema `$id` values are public contracts. Do not rename them without an explicit migration task.
- [`viewer/content/`](../viewer/content/) stores versioned packs of domain records for the static Domain Viewer. The individual records use the domain concepts above, while each viewer file also has a pack wrapper.
- A Card Definition may own card-specific presentation, including an optional illustration. A Card Instance should reference that definition and must not duplicate presentation data.
- [`content/gameplay-v1/`](../content/gameplay-v1/) is the first server-side version-pinned gameplay pack. It snapshots only the selected domain records needed by its Cards and Tickets; the engine does not import secret truth from the browser-delivered Viewer pack.
- Repair Ticket definitions contain authoring truth. Runtime Ticket State records only one instantiated Ticket's evolving history and authorized projections.
- Frozen behavior comes from [`FROZEN_RULES.md`](../docs/design/decisions/FROZEN_RULES.md), not from an example, schema description, or recommended model when they disagree.
