# Story-derived cardless-action candidates

Status: **candidate material only; not approved mechanics**

This file adapts the story premise without overriding the existing [case-study cardless-action research](../../case_studies/v0.1/candidate_materials/cardless-actions.md) or the [design-decision lifecycle](../../design/decisions/DECISION_INDEX.md).

## Working recommendation

The player's home team and campaign rotation should enrich **how** they troubleshoot, not decide whether they are capable of ordinary reasoning.

The strongest current candidate is:

- keep Observe-recording, Hypothesis revision, evidence-supported Isolation, and Documentation available as universal or automatic system capabilities if the resolved engine needs them;
- let cards, tools, tests, procedures, qualifications, and team relationships change scope, access, efficiency, or information quality;
- keep Repair and Verify tied to appropriate domain objects and requirements rather than granting unsupported free universal actions.

This preserves the educational loop and the case-study evidence while still giving campaign progression something meaningful to unlock.

## Core candidates

### Capture an observation

**Candidate form:** automatic authoritative result, universal cardless action, or both depending on the source of the observation

**Story reading:** First Look records what is physically present before the building turns it into a diagnosis: reported symptom, indicator, packaging state, installed configuration, visible damage, log, measurement, or machine state.

**Purpose:** retain a sourced, timed observation without requiring the player to draw a generic “notice something” card.

**Possible team enrichment:**

- Inflow may add provenance, packaging, custody, and client-history context.
- First Look may add physical-condition and CID-oriented fields.
- Rigline may attach structured outputs from a Test execution.
- Gate may record independent post-repair observations.

**Boundary:** a Tool, Command, or Test can create the Evidence. It does not own the engine's ability to retain that Evidence.

**Decision pressure:** visibility and placeholder behavior remain controlled by `OBS-001`, `DOC-002`, `DOC-003`, and the frozen Evidence defaults.

### Create or revise a Hypothesis set

**Candidate form:** universal cardless reasoning action, if explicit Hypothesis state is adopted

**Story reading:** the technician names the candidates worth distinguishing now, revises their ranking after Evidence, and may keep that reasoning private until they choose to publish or commit.

**Purpose:** make causal reasoning legible without pretending that thinking requires a consumable card.

**Possible team enrichment:**

- mentor, history, and domain cards may add eligible candidates or show relationships;
- Failure Analysis qualifications may improve comparison views or allow more structured commitments;
- SIFT may rank candidates only from legitimately visible records and must not inspect hidden authoritative state.

**Boundary:** free-form prose should not become authoritative technical truth. If the engine does not need explicit Hypothesis records, player reasoning can remain in the player's head while Evidence and Isolation stay authoritative.

**Decision pressure:** `HYP-001`, `HYP-002`, `TST-001`, `ISO-001`, and `CROSS-004`.

### Commit an evidence-supported Isolation

**Candidate form:** universal cardless action or server-created transition

**Story reading:** the technician becomes accountable for an actionable Fault, component, category, or causal depth after Evidence has meaningfully distinguished the candidates.

**Purpose:** separate the Test that produced Evidence from the conclusion the Evidence supports. A Test card should not automatically grant a root-cause claim in every scenario.

**Possible team enrichment:**

- Trace rotations may expose better causal-comparison tools or additional eligible depths;
- a mentor or workflow card may protect against premature commitment or help document bounded uncertainty;
- authored Tickets may require different Isolation standards.

**Boundary:** a successful Repair does not silently fabricate a prior Isolation. A substitution that both repairs and diagnoses still needs an unambiguous event or linked-event model.

**Decision pressure:** `HYP-001`, `ISO-001`, `ISO-002`, `ISO-003`, `ISO-004`, `TST-001`, and `CROSS-004`.

### Document an authoritative action and attached result

**Candidate form:** universal cardless action; cards may enhance it

**Story reading:** the player selects a real action record and publishes the allowed identity, target, interpretation, and attached Evidence into the Worklog while preserving original event chronology and later publication time.

**Purpose:** make Documentation a basic professional capability rather than something a technician can perform only after drawing a paperwork card.

**Possible team enrichment:**

- First Look may document condition and disposition evidence.
- Rigline may attach a diagnostic bundle.
- Trace may attach a bounded causal conclusion.
- Bench may attach part identity and repair detail.
- Gate may audit completeness or require missing elements before release.

**Boundary:** specialized cards can change cost, scope, audience, timing, or reward only after those rules are resolved. Documentation should project authoritative records, not let a player type a mechanically binding false claim.

**Decision pressure:** `OBS-001`, `DOC-001` through `DOC-008`, `CROSS-001`, `CROSS-002`, and `CROSS-003`.

## Campaign-level cardless candidates

These belong between matches or in narrative preparation. They should not be mistaken for in-match lifecycle rules.

### Select a rotation assignment

Choose which team the player shadows for the next campaign segment. A rotation may change the offered mentors, story scenes, deck-building pool, or qualification opportunities.

It should not remove universal core-loop capabilities or silently change multiplayer deck-legality rules.

### Request a crossline consultation

Ask an established character or team to review visible Evidence. Possible implementations include a story choice, a temporary campaign resource, a card-search opportunity, or a pre-match context unlock.

The consultation must use player-safe information and should not become a narrative button that reveals the hidden Fault.

### Review prior Worklogs

Search closed and active records for serials, symptoms, tests, parts, and return history. This is primarily an application/reference capability, though a campaign may gate which client records the protagonist is authorized to inspect.

Viewing an existing authorized record should not consume an in-match Action merely to make the application feel game-like. Any search-resource cost remains a separate unresolved rules question.

## Team access model candidates

### Recommended: universal core, specialized leverage

Every technician can participate in the reasoning loop. Team affiliation changes prepared resources, evidence scope, and campaign unlocks.

Benefits:

- matches remain understandable across story chapters;
- players are not stranded because their current department cannot perform a required lifecycle stage;
- specializations can be expressed through cards and authored Ticket opportunities;
- cooperative teams still benefit from complementary decks.

### Alternative: qualification gates for specialized procedures

Certain tools, tests, commands, rework procedures, or formal disposition actions require a campaign qualification or teammate.

This is plausible for safety and expertise, but it should gate the specialized **method**, not basic Observe, Hypothesize, Isolate, or Document capability. It also requires a plan for campaign replay, cooperative composition, and legally solvable Tickets.

### Not recommended: department-locked lifecycle verbs

Making only Inspect able to Observe, only Trace able to Isolate, or only Gate able to Document would turn the workflow map into rigid character classes. It conflicts with real role overlap, weakens solo play, and makes the loop less educational.

## Explicit non-candidates from current evidence

- **No generic cardless Repair:** the case-study Repairs map naturally to Components and Repair Procedures with requirements and risks.
- **No generic cardless Verify:** authored Validation Procedures and Ticket-specific success conditions should establish the required state.
- **No automatic root-cause credit for a successful part swap:** combined interventions and diagnostic substitutions can confound attribution.
- **No mandatory card for ordinary thought:** cards may represent structured methods, references, tools, or advantages, not the human capacity to form a Hypothesis.
- **No free-form authoritative conclusion:** rule-significant claims should point to eligible domain records and Evidence.
- **No story-only exception to hidden state:** mentors, SIFT, computer technicians, and narrative scenes receive only legitimately visible information.

## Promotion checklist

Before any item becomes a rule or interface requirement:

1. resolve its parent candidate decisions;
2. define authoritative action and Evidence records;
3. define collaboration-mode visibility;
4. prove Ticket solvability with and without campaign progression;
5. decide cost and economy only within `CROSS-002`;
6. add schema, event, projection, and behavior tests in a separate task.
