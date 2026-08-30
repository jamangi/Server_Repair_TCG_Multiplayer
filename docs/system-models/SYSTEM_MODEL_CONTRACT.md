# System Model V0 planning contract

Status: **TASK-049 implementation-neutral contract; no production schema or architecture approval**

This document defines what a future System Model must mean. It does not create a production model, select a production architecture, or change any Match rule. The current Ticket, Builder, engine, and projection contracts remain authoritative.

## Vocabulary and boundaries

| Term | Exact meaning in this sequence | Boundary |
| --- | --- | --- |
| **System profile** | A versioned, source-backed description of one real server archetype or an explicitly bounded generalized family, including options that affect service topology. | It is a type-level capability description, not the live health or hidden state of a Ticket. |
| **Component role** | A stable semantic slot such as host processor, management controller, boot device, or power-distribution unit. | A role can be realized by different parts; it is not automatically a Component record or FRU. |
| **Component instance** | One addressable occurrence of a role in a profile, with a stable profile-local ID and an optional stable Component definition reference. | It describes presence and connection, never “the failed part.” |
| **Serviceable unit** | The smallest assembly the cited service procedure permits the intended operator to remove, replace, reseat, clean, configure, or recover as one action. | Physical containment does not imply serviceability. A soldered BMC may be modeled as a role but serviced through its board FRU. |
| **Topology node / edge** | A typed thing and a typed relation in the profile. Nodes may be instances, control surfaces, observation points, buses, logical groups, or honest abstractions. | An edge states structure or supported flow, not diagnosis, Evidence, causality, or current operability. |
| **Lifecycle stage** | A named, ordered or partially ordered phase in which roles become powered, initialized, discovered, handed off, observed, or exercised. | Stages may be required, optional, conditional, parallel, or not applicable. There is no universal linear boot sequence. |
| **Control surface** | A documented interface through which an operator or subsystem can query or change system state: for example a BMC console, firmware setup, service jumper, OS command surface, or front panel. | Mere access does not make an action legal in a Match. |
| **Observation point** | A location or interface at which a documented signal, inventory item, event, counter, status, or physical condition can be observed. | It explains where an observation comes from, not what Evidence disposition it earns. |
| **Path** | An ordered or partially ordered set of nodes and edges that carries power, control, data, cooling, boot selection, or an observation. | A path may branch or be redundant; a visible path cannot be labeled healthy, failed, or causal from private truth. |
| **System-relevant action** | A Test, Command, Repair, or Verification whose documented target and prerequisites can apply to the profile. | This is explanatory discoverability only. It does not place a Card on the Bench or in a hand. |
| **Legal action** | An intent currently exposed by the authoritative private player projection for a specific Ticket revision and actor. | Only the engine/projection contract defines legality, cost, target, and result. |
| **Public projection** | A deterministic, player-visible view derived from an approved public profile, public Ticket state, and already authorized public events. | It cannot read hidden truth, authored outcome matrices, unrevealed Evidence, or private validation diagnostics. |
| **Private validation view** | An authoring-only view that may compare a candidate profile with the complete authored Ticket solely to accept or reject compatibility. | It cannot alter the profile presented to the player, rank Candidates, generate outcomes, or become runtime inference. |

The host and BMC concept reference usefully separates two control domains that can share a motherboard. It is not evidence that every platform has that exact containment, processor, memory, operating system, initialization order, or service boundary.

## Minimum explanatory planes

Every profile declares each plane `PRESENT`, `NOT_APPLICABLE`, or `OUT_OF_SCOPE_WITH_REASON`; omission is invalid. A plane can have multiple paths and can share nodes with other planes.

| Plane | Minimum question the model must answer |
| --- | --- |
| Power | What receives standby and switched power, through which supported distribution/redundancy path, and at what lifecycle phase? |
| Management | What initializes out of band, what it can observe/control, and which host functions remain distinct? |
| Host firmware / POST | How reset, CPU/chipset initialization, firmware, POST, and boot policy relate without claiming one universal order. |
| Memory | Where memory roles attach, when training/inventory occurs, and which observation surfaces can report it. |
| Storage | How device, connector/cable, backplane, controller, array/logical member, and boot-media roles connect when applicable. |
| Network | How adapter, physical link, firmware/driver boundary, and management-versus-host interfaces are distinguished. |
| OS handoff | Where firmware selection ends and loader/kernel/driver ownership begins. |
| Bounded runtime / service | Only the load, thermal, intermittent, service, and verification behavior needed by the supported teaching scope. |

Cross-plane relations are explicit. For example, a BMC can observe host power or storage alerts while not being the host processor, and a NIC can have host data, management control, firmware, and physical-link relations at once.

## Candidate typed package

The notation below is a design record, not a JSON Schema. TASK-051 may implement it only after `SYSTEM-001` chooses an architecture.

```text
SystemModelPackage
  contract_version
  profile
    profile_id, profile_revision, lifecycle_status
    identity { maker, family, model_scope, generation_or_era, exactness }
    option_constraints[]
    plane_declarations[]
    role_instances[]
    topology_nodes[]
    topology_edges[]
    paths[]
    lifecycle_stages[]
    lifecycle_relations[]
    control_surfaces[]
    observation_points[]
    action_mappings[]
    description_program
    public_abstractions[]
  provenance
    claim_ledger_id, source_manifest_version, source_claim_ids[]
  synchronization
    component_catalog_version, referenced_component_ids[], reviewed_gap_ids[]
  serialization
    canonicalization_version, content_digest
```

### Type rules

- `profile_id`, role IDs, node IDs, edge IDs, path IDs, stage IDs, surface IDs, observation IDs, abstraction IDs, claim IDs, and action-mapping IDs are stable public contracts once released. Display names are not IDs.
- A component role instance records `role_kind`, `quantity_or_slots`, `serviceability`, `planes`, lifecycle presence, a `component_definition_id` or reviewed gap, option conditions, and claim IDs. It does not record fault state.
- A topology node has one of `COMPONENT_INSTANCE`, `SERVICEABLE_UNIT`, `CONTROL_SURFACE`, `OBSERVATION_POINT`, `LOGICAL_GROUP`, `BUS_OR_LINK`, or `PUBLIC_ABSTRACTION`.
- A topology edge has one declared relation type, directionality, cardinality, lifecycle applicability, option condition, public visibility, and supporting claim IDs.
- A path identifies its flow kind, ordered/branched members, start and end, lifecycle applicability, and source claims. It does not contain `healthy`, `failed`, `suspect`, Evidence, or Candidate rank fields.
- Lifecycle relations use `PRECEDES`, `REQUIRES`, `ENABLES`, `PARALLEL_WITH`, `OPTIONAL_AFTER`, or `HANDOFF_TO`. A cycle is invalid unless it is inside an explicitly bounded repeated runtime/service stage.
- Control surfaces declare access domain (`MANAGEMENT`, `HOST_FIRMWARE`, `OS`, `PHYSICAL_SERVICE`, or `EXTERNAL_TOOL`), query/change capability, and lifecycle availability. Query/change capability is documentation, not Match permission.
- Observation points declare observation kind (`DIRECT`, `PATH_BASED`, or `INDIRECT`), subject, transport, stage, and limits. `DIRECT` observes a target itself; `PATH_BASED` varies or reads a documented path to localize a role; `INDIRECT` observes an event, sensor, counter, log, symptom, or downstream behavior.
- Action mappings join a stable action definition to documented targets, prerequisites, relevant stages, explanation claim IDs, and an optional safe fallback message. They never contain cost, Card disposition, legal intent, Evidence effect, outcome, or Isolation eligibility.

### Relationship taxonomy

| Family | Allowed V0 relations | Meaning |
| --- | --- | --- |
| Structure | `CONTAINS`, `MOUNTS`, `REALIZES_ROLE`, `SERVICE_UNIT_FOR`, `OPTION_MEMBER_OF` | Physical or profile organization. |
| Power / cooling | `DELIVERS_STANDBY_POWER_TO`, `DELIVERS_SWITCHED_POWER_TO`, `RETURNS_POWER_GOOD_TO`, `COOLS`, `EXHAUSTS_THROUGH` | Documented power or airflow relationship. |
| Data / control | `DATA_LINK_TO`, `CONTROL_LINK_TO`, `MANAGES`, `BOOT_SOURCE_FOR`, `HANDOFF_TO` | Supported communication, selection, or ownership transition. |
| Observation | `OBSERVES`, `REPORTS_INVENTORY_FOR`, `EMITS_STATUS_AT`, `MEASURES_PATH` | Where a documented observation originates or is read. |
| Logical | `MEMBER_OF`, `REDUNDANCY_PEER_OF`, `BACKED_BY`, `EXPOSES_AS` | Array, namespace, bond, redundancy, or logical presentation. |
| Service | `ACCESSED_THROUGH`, `REQUIRES_DEENERGIZATION_BEFORE`, `REQUIRES_PROTOCOL` | Source-backed service constraints. |

The following are forbidden in the V0 graph: `CAUSES_FAULT`, `PROVES_CANDIDATE`, `RULES_OUT`, `CONFIRMS`, `LEGAL_FOR_TICKET`, `REQUIRES_FOR_ISOLATION`, any hidden solution pointer, and unbounded generic `RELATED_TO`. Those meanings belong to authored domain or runtime authority, not explanatory topology.

## Lifecycle and description program

Descriptions are projections of typed data, not an independently authored paragraph that can drift from a diagram. Each `description_program` contains ordered sections. Each section contains stable clause IDs with:

- a stage or path reference;
- a clause kind: `ALWAYS`, `WHEN_OPTION`, `UNLESS_OPTION`, `PARALLEL`, or `NOT_APPLICABLE`;
- a reviewed template ID and typed variables whose values are public labels from the model;
- deterministic ordering keys;
- claim IDs; and
- a short and extended form.

An optional stage is described as optional; a conditional path states its public option condition; parallel initialization uses an explicit parallel clause; and `NOT_APPLICABLE` produces a truthful omission sentence when that distinction matters. Renderers may shorten at clause boundaries only. They may not merge clauses in a way that changes order, certainty, exactness, option scope, or host/BMC separation. Missing templates or variables fail authoring validation and invoke the fallback, never improvised prose.

## Derived projections from one package

### Accessible diagram

The diagram projection consumes only public nodes, edges, paths, stages, groups, and labels. It emits a deterministic layout hint, but semantic order comes from the model rather than screen coordinates. Plane, edge type, lifecycle stage, and selection use text/icon/line-pattern redundancy rather than color alone. Every diagram has:

- a concise title and scope/option statement;
- keyboard-addressable nodes and paths;
- a complete ordered text equivalent listing groups, nodes, connections, lifecycle qualifications, and abstractions;
- zoom/reflow behavior with no information available only by hover; and
- no highlight, detail level, or arrangement chosen from hidden truth.

### Compact rationale graph

For one action definition, the rationale graph follows only `action_mapping -> documented target/prerequisite -> topology/path/stage -> claim`. It answers “why can this action be relevant to this kind of system?” The terminal banner must say whether the current engine projection separately exposes a legal intent. It cannot say an action will support, confirm, rule out, isolate, repair, or verify this Ticket unless that statement is already authorized public Match state rendered outside the System Model rationale.

Diagram, text equivalent, generic description, component detail, and rationale graph pin the same `profile_id`, `profile_revision`, `canonicalization_version`, and `content_digest`. A validation fixture rejects any referenced semantic item missing from another required projection.

## Public/private pipeline

```text
curated public profiles + public Ticket surface
                 |                     |
       public resolver inputs          |
                 v                     |
       deterministic profile choice <--+
                 |
                 v
      public projection builder ----> description / diagram / rationale

complete authored Ticket + same chosen profile
                 |
                 v
 private compatibility validator ----> accept or reject only
```

The public resolver cannot call the private validator as an oracle by trying profiles and observing which one accepts. Resolution uses only a stable public resolver key committed with the Ticket/profile binding or a deterministic function of public profile requirements. Private validation runs at authoring/build time and its failure details remain private.

### Public-candidate closure

For each public Candidate, the validator must find a visible node/path capable of representing every public affected role, or map the Candidate to a named honest abstraction whose label and text do not exclude any of those roles. Exact part count is not required when it would leak; truthful abstraction is preferred. Closure is evaluated before and after every authorized public event because a new public observation may permit a narrower view. A model fails if its visible topology makes any still-public Candidate impossible.

### Differential non-leak proof

For every fixture family with the same public Ticket surface and authorized event history but varied hidden Faults/outcomes, serialize the complete public System projection for each variant and compare bytes. They must be identical. This includes profile ID/revision, selected nodes, labels, order, layout hints, stage detail, abstractions, rationale paths, unavailable/fallback messages, and timing-independent content. Hidden-only validation errors and logs are excluded from the public payload. When public histories diverge through authorized Evidence, only the explicitly public delta may alter the System view.

## Acceptance definitions

### Ticket-consistent

A profile is Ticket-consistent only when the private authoring validator proves all of the following without modifying the Ticket:

1. every public Candidate has closure in the public projection;
2. every hidden Fault instance and accepted Isolation target has a compatible role/path/service boundary;
3. each authored diagnostic/Command outcome has the required target, surface, observation kind, and lifecycle availability;
4. each required Repair can address its authored target at the documented service-unit granularity and with no option contradiction;
5. each Verification can observe its authored post-Repair condition; and
6. all Ticket references remain governed by existing authored outcome, Evidence, Isolation, and legality contracts.

Passing means “the model does not contradict the complete authored Ticket,” not “the model derived the Ticket.”

### Public-safe

A projection is public-safe only when its entire input is public, every active Candidate has closure, differential fixtures are byte-identical, all detail/relevance is explanation-only, no label asserts current health or cause, and the fallback leaks no private validation fact. The weakest public state controls the view.

### Reality-consistent

A profile is reality-consistent only when every material identity, option, service boundary, topology relation, lifecycle relation, observation capability, and action prerequisite has one or more claim-level sources of suitable authority and scope. The exact option combination must be shown as supported together. Separate proof that a processor fits a socket and that a controller fits a bus is not proof that a named server shipped or supports both. Generalized statements must be labeled and cannot fill an exact-model option gap.

### Component-DB-synchronized

A package is synchronized only when every referenced stable Component ID resolves at the pinned catalog version, its role/subsystem/serviceability semantics do not contradict the model, every omitted role that needs a new Component has a reviewed gap ID, and each proposed domain relation has a specific semantic/source justification. Sync does not require putting topology into every current Component record, mutating stable IDs, or treating generic `relationships` as a substitute for the System Model taxonomy.

## Versioning, migration, determinism, and fallback

- IDs never encode mutable display copy or array positions. A semantic identity change receives a new ID; a compatible correction increments `profile_revision`; a contract-shape change increments `contract_version`.
- Released Ticket/profile bindings pin profile ID, revision, source-manifest version, Component catalog version, canonicalization version, and digest. Old replays retain their snapshot or resolve through an explicit migration table; they are never silently rebound to newest.
- Claim corrections preserve superseded records and state the replacement. Removed real-world support deprecates the profile and blocks new binding; it does not rewrite accepted historical results.
- Canonical serialization uses UTF-8, normalized line endings, lexicographically ordered object keys, type-declared array ordering, no timestamps or locale-dependent formatting, and a versioned digest algorithm. Candidate input order, filesystem order, and validator diagnostic order cannot affect output.
- A resolver returns a typed success or typed public-safe failure. It cannot choose a “close enough” model after compatibility failure.
- The V0 fallback is a stable, generic text-only public explanation at the honest abstraction level already supported by public Ticket data. It names no missing private component, failed constraint, rejected profile, or likely cause. Action legality and ordinary Ticket play continue unchanged.
- Unsupported profile, provenance lapse, Component gap, public-candidate closure failure, non-leak mismatch, or serialization mismatch disables the System view for that binding; it does not block or change the Match.

## Field producer, validator, and consumer ownership

No proposed field is ownerless. Rows cover every field or repeated field family in the candidate package.

| Field family | Producer | Validator | Consumer |
| --- | --- | --- | --- |
| `contract_version` | Contract implementer after `SYSTEM-001` | schema/package validator | loader, migration registry |
| Profile ID/revision/status | System profile author/release process | stable-ID and revision validator | resolver, replay loader, all projections |
| Identity/exactness/era | researcher from claim ledger | provenance/reality validator | Finder, scope copy, review UI |
| Option constraints | researcher/profile author | option-coexistence validator | resolver, lifecycle and topology filters |
| Plane declarations | profile author | completeness validator | description and diagram builders |
| Role instances/serviceability/Component references | profile author plus Component steward | topology, service, and Component-sync validators | diagram, detail, Ticket compatibility |
| Nodes and typed edges | profile author | taxonomy, endpoint, source, cycle, and closure validators | diagram, path builder, compatibility validator |
| Paths | profile author | continuity, direction, option, lifecycle, and source validators | diagram, descriptions, rationale graphs |
| Lifecycle stages/relations | profile author | partial-order, condition, and scope validator | descriptions, diagram, action mapping |
| Control surfaces | researcher/profile author | source and access-domain validator | action rationale, compatibility validator |
| Observation points | researcher/profile author | kind/subject/transport/source validator | descriptions, rationale, Ticket compatibility |
| Action mappings | domain action steward plus profile author | definition-resolution, prerequisite, no-authority-field validator | rationale graph only |
| Description clauses/templates/variables | technical-copy owner from typed model | template, variable, ordering, provenance, and drift validator | plain-language renderer/text equivalent |
| Public abstractions | profile author with non-leak reviewer | Candidate-closure and differential validator | public diagram and fallback |
| Claim ledger/source manifest | researcher | source-protocol and archive validator | every reality/provenance audit |
| Component sync pins/gaps | Component steward | catalog resolution and reviewed-gap validator | loader, gap report, TASK-051 migration |
| Canonicalization version/digest | deterministic release generator | independent regenerate-and-compare check | resolver cache, replay pin, drift check |
| Ticket/profile binding and public resolver key | Ticket/System release process | public-input-only and private compatibility validators | public resolver, replay loader |

## V0 authority boundary versus TASK-017

This graph is explanatory and source-backed. It may say a diagnostic observes a BMC log that reports a storage role, or that a repair targets a serviceable backplane. It cannot compute possible worlds, Candidate effects, Evidence dispositions, accepted Isolation, legal intents, or repair/verification outcomes.

TASK-017's deferred V2 proposal is different: dependency-derived inference would make component/path state and capability physics participate in authoritative gameplay. That requires its own schema family, migration, equivalence proof, and approval. No V0 field should be named or shaped so that a later implementer could silently treat explanatory edges as those authoritative dependencies.
