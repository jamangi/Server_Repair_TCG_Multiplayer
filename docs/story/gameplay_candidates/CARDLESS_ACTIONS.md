# Story-derived cardless-action candidates

Status: **candidate story presentation around approved system actions; not a new mechanics source**

This file adapts the story premise without overriding the existing [case-study cardless-action research](../../case_studies/v0.1/candidate_materials/cardless-actions.md) or the [design-decision lifecycle](../../design/decisions/DECISION_INDEX.md).

## Working recommendation

The player's home team and campaign rotation should enrich **how** they troubleshoot, not decide whether they are capable of ordinary reasoning.

The synchronized boundary is:

- preserve authorized review, Hypothesis revision, Commit Isolation, Document Live, and eligible zero-Action closure publication as universal or automatic system capabilities under the frozen rules;
- let cards, technical Tools, Tests, procedures, and team relationships change scope, efficiency, or information quality;
- keep Qualifications as honor-only account recognition with no gameplay, access, deck, procedure, story, or matchmaking effect;
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

**Rules boundary:** visibility, immutable action results, and public placeholder behavior follow [`FROZEN_RULES.md` §§7–8](../../design/decisions/FROZEN_RULES.md#7-ticket-and-action-authority).

### Create or revise a Hypothesis set

**Approved system form:** free on-turn revision of a private competitive or team cooperative marker naming up to two unresolved public candidates

**Story reading:** the technician names the candidates worth distinguishing now, revises their ranking after Evidence, and may keep that reasoning private until they choose to publish or commit.

**Purpose:** make causal reasoning legible without pretending that thinking requires a consumable card.

**Possible team enrichment:**

- mentor, history, and domain cards may compare or show relationships among the Ticket's existing authored public candidates;
- visible Evidence and eligible card effects may improve comparison views or allow more structured commitments;
- SIFT may rank candidates only from legitimately visible records and must not inspect hidden authoritative state.

**Boundary:** the marker is explicit but free-form prose does not become authoritative technical truth. It costs no Action, creates no score, and receives no truth response; Evidence and accepted Isolation remain authoritative.

**Rules boundary:** candidate, Hypothesis, Test, and Isolation behavior follows [`FROZEN_RULES.md` §§11–12](../../design/decisions/FROZEN_RULES.md#11-candidate-faults-hypotheses-and-tests).

### Commit an evidence-supported Isolation

**Approved system form:** universal one-Action `Commit Isolation` intent selecting one public candidate and citing Evidence

**Story reading:** the technician becomes accountable for an actionable Fault, component, category, or causal depth after Evidence has meaningfully distinguished the candidates.

**Purpose:** separate the Test that produced Evidence from the conclusion the Evidence supports. A Test card should not automatically grant a root-cause claim in every scenario.

**Possible team enrichment:**

- Trace rotations may expose better causal-comparison tools or additional eligible depths;
- a mentor or workflow card may protect against premature commitment or help document bounded uncertainty;
- authored Tickets may require different Isolation standards.

**Boundary:** a successful Repair does not silently fabricate a prior Isolation. Diagnostic substitution is a Test whose temporary resource reverts; a permanent machine change requires a separate legal Repair event.

**Rules boundary:** false or insufficient commitment spends its Action, returns only `ISOLATION_NOT_SUPPORTED`, and follows the frozen eligibility consequence without exposing hidden truth.

### Document an authoritative action and attached result

**Approved system form:** universal one-Action `Document Live`; explicit future card text may modify only what later rules permit

**Story reading:** the player selects a real action record and publishes the allowed identity, target, interpretation, and attached Evidence into the Worklog while preserving original event chronology and later publication time.

**Purpose:** make Documentation a basic professional capability rather than something a technician can perform only after drawing a paperwork card.

**Possible team enrichment:**

- First Look may document condition and disposition evidence.
- Rigline may attach a diagnostic bundle.
- Trace may attach a bounded causal conclusion.
- Bench may attach part identity and repair detail.
- Gate may audit completeness or require missing elements before release.

**Boundary:** Document Live selects one undocumented authoritative card action and attached eligible result, publishes the authorized projection, enriches the original placeholder, and recovers the exact source card once. Documentation projects authoritative records rather than accepting mechanically binding free-text claims.

**Rules boundary:** incremental Documentation and structured closure follow [`FROZEN_RULES.md` §§14–15](../../design/decisions/FROZEN_RULES.md#14-incremental-documentation-and-closure-record).

## Campaign-level cardless candidates

These belong between matches or in narrative preparation. They should not be mistaken for in-match lifecycle rules.

### Select a rotation assignment

Choose which team the player shadows for the next campaign segment. A rotation may change the offered mentors, story scenes, or authored deck-building rewards. It may also award an honor-only Qualification badge that records the milestone without causing any of those changes.

It should not remove universal core-loop capabilities or silently change multiplayer deck-legality rules.

### Request a crossline consultation

Ask an established character or team to review visible Evidence. Possible implementations include a story choice, a temporary campaign resource, a card-search opportunity, or a pre-match context unlock.

The consultation must use player-safe information and should not become a narrative button that reveals the hidden Fault.

### Review prior Worklogs

Search closed and active records for serials, symptoms, tests, parts, and return history. This is primarily an application/reference capability, though a campaign may gate which client records the protagonist is authorized to inspect.

Viewing an existing authorized record should not consume an in-match Action merely to make the application feel game-like. Reference/history lookup is distinct from the frozen deck **Search** action, which spends one Action and one Search Token to retrieve a card from the remaining draw deck.

## Team access model candidates

### Recommended: universal core, specialized leverage

Every technician can participate in the reasoning loop. Authored team preparation may change available resources, Tests, or campaign rewards, but affiliation alone never changes frozen Evidence visibility, projection rules, or hidden outcomes.

Benefits:

- matches remain understandable across story chapters;
- players are not stranded because their current department cannot perform a required lifecycle stage;
- specializations can be expressed through cards and authored Ticket opportunities;
- cooperative teams still benefit from complementary decks.

### Rejected: Qualification gates for specialized procedures

Qualifications do not gate technical Tools, Tests, Commands, rework procedures, disposition actions, campaign scenes, deck construction, or matchmaking. Specialized methods may still carry authored domain prerequisites or card requirements, but those requirements must not be represented by an account badge.

### Not recommended: department-locked lifecycle verbs

Making only Inspect able to Observe, only Trace able to Isolate, or only Gate able to Document would turn the workflow map into rigid character classes. It conflicts with real role overlap, weakens solo play, and makes the loop less educational.

## Explicit non-candidates from current evidence

- **No generic cardless Repair:** the case-study Repairs map naturally to Components and Repair Procedures with requirements and risks.
- **No generic cardless Verify:** authored Validation Procedures and Ticket-specific success conditions should establish the required state.
- **No automatic root-cause credit for a successful part swap:** combined interventions and diagnostic substitutions can confound attribution.
- **No mandatory card for ordinary thought:** cards may represent structured methods, references, tools, or advantages, not the human capacity to form a Hypothesis.
- **No free-form authoritative conclusion:** rule-significant claims should point to eligible domain records and Evidence.
- **No story-only exception to hidden state:** mentors, SIFT, computer technicians, and narrative scenes receive only legitimately visible information.
- **No mechanical Qualification:** the account badge records recognition only and never changes a legal action or available experience.

## Promotion checklist

Before any item becomes a rule or interface requirement:

1. classify it as presentation around an existing frozen system action or as genuinely new behavior requiring the decision lifecycle;
2. reuse the authoritative action, result, Evidence, and Worklog records rather than creating story-only truth;
3. preserve the frozen collaboration-mode visibility categories;
4. prove Ticket solvability independently of honor-only Qualifications;
5. do not alter frozen Action/resource costs through candidate prose or implied card text;
6. add schema, event, projection, and behavior tests in a separate task.
