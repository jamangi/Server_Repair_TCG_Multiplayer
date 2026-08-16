# Server Repair Card Game — Machine-Readable Schema Package v0.1

This package converts the v0.1 design documents into JSON Schema Draft 2020-12 definitions.

## Key architectural decisions

- Domain objects own reusable technical knowledge.
- Domain objects may also own reusable presentation metadata, including illustrations.
- Cards reference domain objects instead of duplicating technical definitions.
- Tests change **Knowledge State** by producing evidence.
- Repair Procedures change **Machine/Fault State**.
- Validation Procedures evaluate whether repaired state meets requirements.
- Fault causal relationships are separate graph edges.
- Causal-cycle prevention is a graph-level validator responsibility rather than something JSON Schema can fully enforce.

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

## Illustration ownership

The `presentation.illustration` object lives on domain entities and cards may reuse the same `asset_id`.

This lets:

- encyclopedia pages display the illustration,
- search results display thumbnails,
- cards inherit/reference the same art,
- future UIs use alternate crops without duplicating the underlying technical record.

In a later implementation, cards can either duplicate the presentation reference for convenience or resolve their display art from the first referenced domain entity.

## Important validation beyond JSON Schema

JSON Schema validates shape and local field constraints, but a content build should also run semantic validation:

1. all referenced IDs exist,
2. fault causal edges contain no self-loops,
3. fault causal graph is acyclic,
4. ticket fault blueprints form valid subgraphs,
5. required repairs and validations exist,
6. cards reference compatible domain entity types,
7. asset IDs resolve in the asset manifest,
8. stable IDs are globally unique.

## Suggested next step

Add:

- `asset_manifest.schema.json`
- runtime `KnowledgeState`, `FaultState`, `TicketState`, and `MatchState` schemas
- a small validator script
- 20–30 real prototype content records
- 20–30 initial playable cards referencing those records
