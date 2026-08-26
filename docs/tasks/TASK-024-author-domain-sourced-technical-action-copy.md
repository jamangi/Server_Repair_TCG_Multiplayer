# TASK-024-XHIGH: Author domain-sourced technical action copy

## Status

**Complete — 2026-08-26.** All 71 published playable actions now use reviewed domain-owned technical descriptions, Cards and Library details share that source, mechanics remain structurally separate, and the quality/review-ledger gates reject placeholders, internal vocabulary, drift, and incomplete provenance.

## Objective

Give every published playable Test, Command, Repair Procedure, and Validation Procedure concise, technically useful, in-universe learning copy sourced from its domain object. Cards and the Library must present that shared technical meaning consistently, while game mechanics remain separately labeled and structurally derived from the Card play contract.

Do not hand-author 71 disconnected Card descriptions. The current playable catalog contains 50 Bench diagnostics (37 Tests and 13 Commands) plus 12 selected Repairs and 9 selected Validations. Fix their 71 referenced domain records and the deterministic projection/generation path, then validate that Card, Deck, Bench Inspect, expanded hand, and Library views agree.

## Required reading

Read completely before editing:

- `AGENTS.md`, root `README.md`, this task, `docs/tasks/INDEX.md`, completed TASK-009, TASK-014, TASK-019 through TASK-021, TASK-023, queued TASK-015, and the approved Card contract analysis;
- `schemas/README.md`; Test, Command, Repair Procedure, Validation Procedure, Card, playable-coverage, and relevant pack schemas; and domain schema notes;
- all 257 Viewer domain records, but use the TASK-014 coverage inventory to focus technical authoring on the 71 domain objects referenced by the published playable catalog;
- `viewer/scripts/build-task-014-content.mjs`, the canonical gameplay domain snapshot/Card catalog, staging scripts, and content/version migration tests;
- Library description/detail rendering, Card views, Bench Inspect, Deck builder Inspect, expanded/collapsed hand, art/reference resolver, and related responsive/accessibility tests; and
- existing technical relationships, tools, components, protocols, command syntax/purpose, Test outcome notes, Repair steps, Verify success conditions, education text, and available provenance before researching missing claims.

## Verified current content debt

The builder must reproduce and record the baseline rather than assuming every record has the same defect:

- 24 Test descriptions use the formula `<name> gathers troubleshooting evidence.`;
- the same 24 Tests repeat `Tests change the technician knowledge state; they do not directly repair the machine.` as their education text;
- 38 Repair/Validation descriptions use formulaic `corrective procedure` or `confirms the repaired state` copy;
- 62 of 71 generated Card rules strings expose internal phrases such as `compatible active Ticket` and `single authored current-state Evidence outcome`; and
- useful exceptions already exist, including Power Distribution Path Isolation's method description and de-energization warning. Preserve and use good records as authoring exemplars instead of flattening them into a new template.

## Information ownership

- The domain object is authoritative for real-world technical meaning, terminology, requirements, cautions, and learning value.
- A Card Definition owns gameplay packaging: Card ID, family, cost, deck/Bench placement, executable play contract, and only genuinely Card-specific presentation.
- A Card Instance owns no prose.
- The gameplay snapshot may pin/project domain copy for deterministic deployment, but generated Card copy must not become a second independently authored technical source. Use one named resolver/projection path and validate equality/provenance.
- The Library reads the canonical Viewer domain records. Play reads its version-pinned domain snapshot. The content builder must prove those selected records are semantically equivalent for the pinned version.

Do not rename stable entity IDs. If existing `presentation.short_description`, `education_text`, `purpose`, `steps_summary`, and `success_conditions` can carry the clarified meanings, prefer documenting and validating them over adding parallel near-synonym fields. A schema change is justified only when two genuinely distinct required concepts cannot be represented without overloading a field; version it and migrate all selected records atomically.

## Action-copy authoring contract

Create a concise authoring guide and machine-checkable quality rules for published playable actions.

### Description: what the action does

The primary short description must answer, in one or two plain-language sentences appropriate to the action family:

- **Test:** what is exercised or observed, what measurement/status is collected, and what a technician can learn from it;
- **Command:** what the command queries or reports, including its relevant platform/context, without pretending its output is the diagnosis;
- **Repair:** what physical/configuration state is changed and the intended correction, without claiming success before Verify; or
- **Verify:** what post-Repair capability/state is checked and what constitutes the useful operational signal.

Descriptions must not contain raw stable IDs or engine implementation language such as `Card`, `active Ticket`, `authored outcome`, `Evidence outcome`, `Knowledge State`, resolver, projection, or schema. Domain terms that also exist in the fiction—test, evidence in its ordinary technical sense, ticket/work order where natural—are allowed when used as ordinary technician language rather than engine contracts.

### Technical note: durable second-layer learning

Use the existing education/technical-note surface for information that adds value beyond the description:

- a safety warning or required service-procedure boundary;
- an interpretation caveat, false-positive/false-negative limitation, or scope condition;
- preservation/documentation guidance before destructive or state-clearing work;
- a vendor/platform variation that prevents overgeneralization; or
- a concise best-practice reminder.

Do not fill the field merely to satisfy uniformity. If there is no distinct durable note, omit it and let the UI omit the section. General one-time game rules—diagnostics change knowledge rather than machine state; Repairs require Isolation; Verify follows Repair—belong in tutorial/help and the separately labeled game-mechanics surface, not repeated as technical notes.

### Acronyms and terminology

- Expand an acronym on first use in detailed learner-facing copy, for example `dual in-line memory module (DIMM)`, `baseboard management controller (BMC)`, or `Power-On Self-Test (POST)`.
- Titles and compact labels may retain standard acronyms when space demands it; Inspect and Library detail must expose the expansion.
- Create one reviewed terminology/glossary source or deterministic expansion helper rather than allowing conflicting expansions across records.
- Preserve technically meaningful distinctions such as memory test versus inventory, controller status versus member health, and connectivity versus link state.

## Separate technical meaning from game mechanics

- Card faces, compact Bench tiles, and collapsed hand cards prioritize title/family/cost and the short technical description where space permits.
- Inspect/detail presents `What it does` first, then an optional context-appropriate label such as `Safety note`, `Interpretation note`, or `Service note`; do not label every second paragraph generically `Technical Note` if its role is known.
- Present target, Action cost, prerequisites, disposition, current runnability, and result routing in a clearly separate `In this game`/`Game details` section derived from `play_contract` and current player-safe projection. Do not expose raw IDs or internal resolution vocabulary to ordinary players.
- `Why relevant?` remains Ticket-specific public graph context and must not be merged into the domain description. A technically good description stays true in Global mode and in the Library.
- Technical references in Card Inspect should resolve raw domain IDs to human names and offer a route to the corresponding Library record where navigation permits. Raw IDs may remain in an advanced/debug disclosure, not as the primary learning surface.

## Technical accuracy and provenance

- Reuse existing authored relationships and useful notes; do not infer safety procedures or equipment behavior from names alone.
- Verify newly authored technical claims against authoritative platform/vendor documentation, standards, or primary command manuals where available. Avoid tutorial-blog copy as the sole authority for safety-sensitive claims.
- Record a review ledger mapping every changed playable domain ID to reviewer status, sources consulted, acronym expansions, and any scoped uncertainty. Do not reproduce long copyrighted text.
- Keep descriptions vendor-neutral unless the domain object is explicitly platform-specific. State when exact commands, thresholds, slot mappings, or procedures vary by platform.
- Do not turn the game into a service manual: retain the repository's training/reference boundary and direct potentially hazardous work to approved platform procedures.

## Library and Play integration

- Expand Library detail for the four action-bearing families to show the useful fields they already own: purpose/syntax, targets, required tools/components/protocols, steps summary, success conditions, and the optional learning note. Use human names and navigable relationships rather than raw ID walls.
- Ensure Library cards and search summaries use the same improved short description.
- Ensure Deck builder, Bench Inspect, response-hand Inspect, and any tutorial/help reference use the domain-sourced technical copy through one shared presentation model where practical.
- Preserve compact density: detailed method, notes, requirements, and game mechanics belong in Inspect/Library detail, not every shelf tile.
- Missing optional notes should collapse cleanly without blank headings. Missing required descriptions for a published playable action must fail content validation/build rather than fall back to engine prose.

## Content validation and migration

- Add semantic lint that rejects the known placeholder templates and raw engine-contract phrases in learner-facing technical fields for published playable actions.
- Require nonempty, family-appropriate descriptions for all 71 selected playable domain references, with first-use acronym expansion available in detail.
- Validate that every generated Card resolves exactly one authoritative primary domain record of the expected family and that technical copy cannot drift between Viewer content, gameplay snapshot, and rendered Card.
- Version the domain snapshot/Card catalog only where required by the established immutable-content policy. Migrate local decks/settings by stable Card ID and preserve compatible saved data; fail closed with a useful message if an active Match cannot safely cross a content-version boundary.
- Regenerate derived manifests, gameplay content, coverage reports, and staged Pages assets from canonical sources. Never hand-edit generated files.
- Do not alter costs, legal targets, outcome tables, relevance paths, Ticket generation, Isolation/Repair/Verify rules, or automated policy merely to make prose sound smoother.

## Validation

Add schema/content/rendering/browser regressions proving:

- all 71 published playable Cards resolve technical descriptions from their referenced domain objects and none exposes prohibited engine vocabulary as its primary description;
- the Memory Diagnostic description says what is exercised/observed and what information it yields, expands relevant acronyms in detail, and no longer says only that it gathers Evidence;
- Power Distribution Path Isolation retains its useful method and safety warning with the warning presented under an accurate label;
- representative Test, Command, Repair, and Verify records render the same technical meaning in Library, Bench/hand/Deck Inspect, and version-pinned gameplay;
- optional notes omit their headings cleanly while required descriptions fail publication when absent or placeholder-like;
- game mechanics remain accurate, player-safe, separately labeled, and derived from structured contracts rather than technical prose;
- raw technical reference IDs are resolved to display names/routes for ordinary users;
- all acronym expansions, technical claims, review-ledger entries, pack/schema validation, deterministic generation, saved-data migration, and canonical/staged byte-equivalence checks pass; and
- full Node tests, automated-game report verification, complete browser matrix, accessibility/responsive visual QA, performance budgets, and `git diff --check` pass without gameplay-stat changes.

## Allowed paths

- the 71 selected Test/Command/Repair/Validation domain records in `viewer/content/**` and their deterministic gameplay snapshots
- affected action-domain/Card schemas, schema notes, examples, authoring guide, glossary/provenance/quality-audit artifacts, and semantic validators
- canonical TASK-014 content generation, coverage output, and staged generated Play assets rebuilt from canonical sources
- shared domain/Card presentation resolver; Library, Deck, Bench, hand, Inspect/detail, Help integration; and affected Play/Library CSS
- saved-content migration/version support only if immutable catalog policy requires it
- focused schema/content/rendering/browser/accessibility/visual tests
- this task, `docs/tasks/INDEX.md`, TASK-015 dependency/terminology wording, and directly affected user documentation

Do not change entity IDs, technical graph authority, gameplay rules, Card costs/contracts, Ticket outcomes, hidden information, scoring, profile statistics, or illustration scope reserved for TASK-011.

## Completion boundary

Complete only when each published playable action helps a Player understand what the real-world technique does; durable cautions and interpretation notes add distinct training value; acronyms expand coherently; Cards and Library share domain authority without copy drift; game mechanics remain accurate but visually separate from technical meaning; placeholder/internal prose is blocked by validation; technical claims have review provenance; generated/versioned artifacts agree; and the full gameplay/test matrix remains behaviorally unchanged.
