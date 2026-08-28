# Post-TASK-010 playtest approvals

Status: **PT-001 D, PT-002 A, PT-003 D, PT-004 A, PT-005 A, PT-006 D, and PT-007 A approved — 2026-08-24. UI-001 A and UI-002 A approved — 2026-08-25. PT-008 B approved — 2026-08-26. STORY-001 A through STORY-006 A approved — 2026-08-27; STORY-007 A and STORY-008 A approved — 2026-08-28. TASK-025 and the TASK-026 through TASK-030 Story sequence are complete; TASK-033 through TASK-036 form the planned characterization sequence. Migration choices MS-001 A through MS-005 A and MS-007 A remain approved, but TASK-017 is deferred; MS-006 A's earlier parking sequence is superseded.**

## Post-TASK-016 UI approvals

These choices govern TASK-019 presentation only. They do not alter Card instances, hand/deck order, diagnostic availability, relevance authority, legal intents, costs, or results. TASK-018's modal/Ticket/contrast defects require no approval.

### UI-001 — Diagnostic tile anatomy — **A approved 2026-08-25**

- **A — One shared compact tile in both Bench Views (approved).** The shelf/grid tile shows type, cost, an undistorted illustration, and the complete title. Category, description, technical detail, and `Why relevant?`/Global catalog explanation move to Inspect. Relevant and Global may size the shared component differently but do not fork its semantic markup or interaction behavior.
- **B — Compact Relevant tile and richer Global tile.** Relevant uses the anatomy above; Global additionally keeps category and a short description visible in every tile. This exposes more information but recreates the density pressure that clipped the Ticket and hand.
- **C — Keep the current tile information and only repair sizing.** Preserve type, cost, narrow art, title, rules excerpt, and inline relevance/catalog disclosure. This is the smallest change but retains competing information at shelf scale.

### UI-002 — Response-hand behavior — **A approved 2026-08-25**

- **A — Shared adaptive hand with grouping, paging, and expansion (approved).** Both Bench Views use one component. The collapsed hand shows up to five definition groups per page with full family/title, duplicate stacks/quantity, Card count, Deck/Discard counts, and Inspect. Expansion raises readable illustrated Cards over the center Bench while preserving the right rail. Grouping never merges authoritative instances, and every play resolves an explicit instance.
- **B — Shared readable horizontal hand without grouping or expansion.** Increase every mini-Card enough to show family/title and use horizontal scrolling for overflow. This is simpler but makes six-plus Cards slower to survey and does not use Relevant-mode height as effectively.
- **C — Separate hand layouts by Bench View.** Relevant uses illustrated mini-Cards while Global uses title chips. This can maximize each mode independently but duplicates component behavior and increases continuity/selection defects.

The B/C alternatives remain decision provenance and are not implementation authority.

This is the retained decision-provenance packet for the first hands-on solo-play findings. TASK-013 synchronized PT-001 D through PT-005 A into `first-version-v2` on 2026-08-24. Normative behavior now lives in `FROZEN_RULES.md`; existing `first-version-v1` artifacts remain pinned rather than reinterpreted.

The canonical remaining open-rule entry lives in [`UNFROZEN_RULES.md`](UNFROZEN_RULES.md). This file supplies reviewable lettered choices without creating a second rules ledger. The selected PT-001 through PT-005 behavior belongs in `FROZEN_RULES.md`; the alternatives below are non-authoritative provenance.

## Approved V0 record

The project owner approved `PT-001 D`, `PT-002 A`, `PT-003 D`, `PT-004 A`, `PT-005 A`, `PT-006 D`, and `PT-007 A` on 2026-08-24, then approved `UI-001 A` and `UI-002 A` on 2026-08-25. TASK-012 and TASK-013 are complete: PT-001 D through PT-005 A now govern `first-version-v2`, `solo-pages-v2`, `ticket-builder-v2`, and the diagnosis-v2 content contracts. TASK-014 implements PT-006 D; TASK-016 establishes the board composition; TASK-018/TASK-019 correct its post-playtest regressions under the approved UI contracts; and TASK-015 implements PT-007 A plus the polished PT-005 A reveal experience. The alternatives below remain decision provenance, not open implementation choices.

## Verified current facts

- A legal deck contains 30 **instances/copies**, but the pinned playable catalog contains only 11 distinct Card Definitions.
- The Viewer knowledge library contains 257 records, including 37 Tests, 13 Commands, 35 Repair Procedures, and 22 Validation Procedures. Faults, Symptoms, Components, Tools, and Protocols are knowledge objects and should not automatically become Cards.
- The solo Worker passes the exact active 30-card deck IDs to the Ticket Builder, and the Builder rejects a batch whose declared required Card path is unreachable. A Match therefore should not start with a Ticket whose correctly declared required Cards are absent from that deck.
- The current content pack has only three complete storage/RAID templates. `solo-pages-v1` permits duplicate fingerprints from the first selection, so a seeded queue may repeat one template even before all three have appeared.
- The current Builder selects and snapshots complete authored templates. It does not yet assemble materially novel scenarios from smaller compatible authored parts.
- A diagnostic is currently legal only when its Card is in hand and the active Ticket has exactly one authored outcome for that diagnostic and machine state.
- Every currently accepted diagnostic already appends a Worklog entry and an `EVIDENCE_CREATED` event before payment resolution completes. In the reported screenshot, however, the selected Ticket is `One Member Down` while the legal-action button targets `The Missing Storage Path`; the Evidence panel remains filtered to the selected Ticket. Follow-up inspection confirmed that the action correctly created Evidence #21 on `The Missing Storage Path`. This is a cross-Ticket result-discoverability issue, not a silent engine resolution.
- A Hypothesis is a free private/team marker for up to two candidates. It is not an elimination ledger and receives no truth feedback.
- Commit Isolation costs one Action and succeeds through positive authored citation requirements. The current rules do not require eliminating other candidates and forbid speculative Repair before accepted Isolation.

These facts make the observed concern credible even though exact-deck solvability is already intended: undeclared or incomplete outcome coverage, poor explanation of Search/citations, and extreme content repetition can still make a valid path feel absent.

## Required invariant — no silent paid actions

This is a cross-cutting acceptance requirement, not an A/B/C choice:

- Every accepted Test or Command creates exactly one typed diagnostic result for the chosen Ticket and machine revision. A clean result, unrelated finding, negative result, or inconclusive result is still Evidence and must say what was observed and whether it changes any public candidate assessment.
- Every other accepted action that spends an Action, Card, Search/Refresh token, or other limited resource emits a typed result event and an immediately visible explanation of the outcome. Rejected actions remain rejection-before-payment and explicitly say that nothing was spent.
- The UI must identify the action's target before confirmation and make its result visible afterward. If the target is not the currently displayed Ticket, the client must either switch to that Ticket/result or present a persistent “View result” affordance. A transient announcement alone is insufficient.
- “No candidate effect” is a legitimate result; “no feedback” is not. The engine, projection, UI, automated policies, and tests must preserve that distinction.

TASK-012 addresses the current cross-Ticket result-discoverability weakness without changing rules. TASK-013 makes this invariant explicit in the successor contracts and rules. TASK-014 requires complete authored/assembled diagnostic-result coverage.

## PT-001 — Diagnostic availability

Which diagnostic catalog and view model should play use? Review the original project mockups [`relevant_diagnostic_bench.png`](../../ui-plan/ui-reference_images/relevant_diagnostic_bench.png) and [`global_diagnostic_bench.png`](../../ui-plan/ui-reference_images/global_diagnostic_bench.png) as compositional references, not authoritative state.

### A — Relevant Diagnostic Bench only

Every published Test or Command connected to the active Ticket's **public context** is available from a persistent Diagnostic Bench from the beginning. Public context means its observed Symptoms, public Candidate Faults, exposed components/subsystem, or an authored prerequisite/control needed to distinguish those candidates. Relevance must be derivable without consulting hidden truth, so the offered set cannot itself leak the answer. A diagnostic that has no valid relationship to those surfaces is not contextually relevant.

The Diagnostic Bench is a proposed persistent, non-random palette of these Test/Command affordances outside the 30-card response deck. It is not the current `Legal actions` panel. In the present UI, the hand supplies Cards and the action panel shows engine-projected targets for the selected Card. Under this option, the Bench would supply always-available diagnostics—probably as a searchable/filterable panel, drawer, or tray—while the Legal actions panel could remain the final target/inspect/run surface for the selected Bench item.

Bench items remain typed Card Definitions and spend their printed Actions, but they do not depend on draw order or consume response-deck slots for this rules/profile revision. Every offered diagnostic must have exactly one deterministic authored or Builder-assembled Evidence outcome for every machine state in which it can be run. The outcome may support, contradict, rule out, confirm, or explicitly report a clean/inconclusive/no-relevant-finding result. Repair and Verify remain response-deck Cards and retain their gates.

This meets the educational intent without presenting all 50 current diagnostics on every Ticket. It requires deck migration, a new Card placement/availability contract, Builder outcome coverage, projections, UI, and automated-game changes.

### B — Global Diagnostic Bench

Make every published **playable** Test and Command visible on every Ticket from the beginning. Search, Test/Command tabs, subsystem/category filters, deterministic sorting, and bounded pagination keep the catalog navigable. “Published playable” is important: a knowledge-library Test/Command does not enter this Bench until it has a complete typed execution contract and outcome coverage.

Global mode may label/filter by relevance derived from public graph relationships and explain those paths, but it must not consult or imply hidden-truth relevance. Unrelated choices resolve to an authored/assembled clean, inconclusive, not-applicable, or no-relevant-finding Evidence result rather than silence. The selected diagnostic surface must show target, cost, and expected target compatibility before confirmation without revealing hidden truth.

This most literally satisfies “all Tests and Commands,” but the current domain already contains 50 such objects. It creates substantial choice overload and a much larger outcome-authoring/validation surface.

### C — Guaranteed deck access

Keep Tests and Commands in the 30-card draw deck, but guarantee that every diagnostic required by the active Ticket is immediately discoverable through a free or separately provisioned diagnostic Search affordance. Ordinary play, discard, Refresh, and copy limits otherwise remain intact.

This is the smallest migration, but diagnostics are still not literally all available and deck construction continues to govern knowledge access.

### D — Global availability with selectable Bench View (recommended)

Make the complete versioned playable diagnostic catalog authoritative and available regardless of presentation. Provide `RELEVANT` and `GLOBAL` as switchable Bench Views over that same catalog and identical legal intents. `RELEVANT` defaults to Option A's public-context filter and compact shelf. `GLOBAL` exposes Option B's complete search/filter/pagination layout and may include the same optional Relevant filter. Switching views changes no Match state, legality, cost, result, difficulty designation, scoring, or statistics.

Relevance is advisory rather than authoritative expertise. It must be derived only from public graph paths such as observed Symptom -> public Candidate Fault -> diagnostic Evidence target, exposed component/subsystem relationships, or published diagnostic prerequisites. Each relevance marker should offer a player-safe `Why relevant?` explanation showing the relationship path. The UI must also explain that the graph is curated and incomplete: an unmarked diagnostic is not declared useless, and expert judgment may reasonably inspect connections the current content graph does not represent. Running an unmarked diagnostic still produces its authored clean, negative, unrelated, inconclusive, or candidate-changing Evidence result.

The Player may switch Bench Views or apply/clear the Relevant filter during a Match because this is a comfort and information-organization preference, not a rules preset. Local settings may remember the preferred default and export/import it. Global search, category, sort, page, and Relevant-filter state should persist across rerenders without altering replay provenance. Automated policies operate on legal intents, not the human view preference, so results do not need to be grouped by Bench View.

Use **Bench View** (or the user-facing label **Bench Type**) rather than restoring account Equipment. Equipment previously implied owned mechanical loadouts, progression, or character power; this is a local view of one shared diagnostic workspace.

TASK-013 should establish Global diagnostic availability, public-only relevance derivation/explanation, deck migration, projections, and a functional switchable UI using the currently playable catalog. TASK-014 expands and validates playable diagnostic/content coverage; pairing PT-001 D with PT-006 D is the recommendation if Global is intended to include all 50 current Test/Command knowledge records. Until promotion is complete, the UI must report the exact playable count and must not claim the raw library is fully runnable. TASK-016 then performs the dedicated board-density and visual-composition pass against final representative data sizes.

## PT-002 — Public candidate generation

How should a generated Ticket choose Candidate Faults?

### A — Relevant deterministic subset of 2–5 (recommended)

Start from Faults associated with the observed Symptoms, filter by the Ticket's component/subsystem/causal context, always include every hidden actionable Fault represented by the Ticket, and deterministically select plausible distractors up to a five-candidate maximum. Every distractor must have at least one authored differentiating Evidence path; arbitrary or impossible candidates are forbidden.

### B — Every relevant associated Fault

Show the complete validated set produced by the same relationship rules, with no five-candidate cap. This is exhaustive but can overwhelm broad Symptoms such as no power or no POST.

### C — Fully authored lists

Retain the current rule that each complete Ticket/template directly authors its public candidate list. The Builder may validate relationships but does not select candidates from them. This maximizes author control and minimizes novelty.

## PT-003 — Manual elimination and successful Isolation

How should candidate elimination relate to Isolation?

### Verified current behavior and the `CONFIRM` mismatch

Current Commit Isolation accepts a public candidate plus one or more authorized same-Ticket Evidence citations, spends one Action, and then looks for one authored Isolation requirement whose candidate is the selected true active actionable Fault and whose flat `minimum_citations` count is met by eligible outcome IDs. The engine does not interpret `CONFIRM` as intrinsically sufficient; disposition and Isolation eligibility are separate fields.

That explains the reported result but exposes a design/content mismatch. On `One Member Down`, Drive Health produces `CONFIRM: Failed SAS Drive` and says the Evidence is decisive, while the authored Isolation requirement separately requires two citations: RAID member status plus Drive Health. Citing only the confirmed Drive Health result therefore returns `ISOLATION_NOT_SUPPORTED`. The engine followed its current contract, but the word `CONFIRM`, the public summary, candidate-flow precedent, and player expectation all imply that this Evidence should be independently sufficient. Keeping both meanings would make the game appear buggy.

The current Evidence dispositions are:

- `SUPPORT`: increases confidence in a candidate but is not independently decisive unless an explicit multi-Evidence route says otherwise;
- `CONTRADICT`: evidence against a candidate, but not necessarily enough to eliminate it;
- `RULE_OUT`: decisive incompatibility with that candidate under the authored conditions;
- `CONFIRM`: currently only a strong candidate effect, but proposed below to mean independently decisive establishment of that candidate under the authored conditions; and
- `INCONCLUSIVE`: the observation does not change a candidate assessment.

These are Evidence meanings, not Isolation response codes. A syntactically/legal Commit produces either an `ISOLATION_ACCEPTED` event (the general action result is `RESOLVED`) or spends one Action and produces `ISOLATION_NOT_SUPPORTED`. The latter intentionally does not distinguish a wrong candidate from insufficient Evidence. A Commit can instead reject before payment with `ILLEGAL_TIMING` (Ticket is not in Diagnosis), `ILLEGAL_TARGET` (candidate/citations are malformed, unauthorized, or belong to another Ticket), or `INSUFFICIENT_ACTIONS`; ordinary request-envelope guards can also return `ILLEGAL_REQUEST`, `MATCH_MISMATCH`, `ACTOR_MISMATCH`, `IDEMPOTENCY_CONFLICT`, `STALE_REVISION`, or `NOT_ACTIVE_PLAYER`. Those errors do not mean the candidate was evaluated and found unsupported.

### A — Evidence-backed elimination with two valid Isolation routes

The Player may mark a candidate eliminated only by citing authorized Evidence whose authored disposition for that candidate is `RULE_OUT` or `CONTRADICT`. The mark is `PRIVATE_PLAYER` in competitive play and `TEAM` in cooperative play, costs zero Actions, is reversible, and never reveals whether the remaining candidate is true.

Commit Isolation still costs one Action and succeeds through either:

1. the current positive Evidence requirement for the selected actionable Fault; or
2. eligible Evidence-backed elimination of every other public candidate while the selected candidate remains.

This supports both confirmation and Phasmophobia-like elimination without making notebook maintenance consume scarce technical work.

### B — Elimination is a notebook aid only

Allow free, possibly incorrect private/team crossed-out markers with no server validation or gameplay effect. Successful Isolation keeps the current positive Evidence requirement. This improves organization but does not create an elimination route.

### C — Require both positive support and complete elimination

Every other candidate must be validly eliminated and the selected candidate must independently meet its positive Evidence requirement. This is clearest but likely slow and repetitive.

### D — Typed alternative Isolation routes with decisive `CONFIRM` (recommended)

Retain free Evidence-backed elimination, but replace the flat eligible-ID/minimum-count model with one or more explicit alternative Isolation routes per actionable Fault. Supported route types include:

1. **Direct observation:** an authored visual/physical observation directly sees the broken, disconnected, burned, leaking, unseated, or otherwise decisive condition and yields candidate-specific `CONFIRM`;
2. **Definitive diagnostic:** one Test/Command result yields candidate-specific `CONFIRM` under its stated target and machine-state conditions;
3. **Corroborated support:** an authored AND/threshold combination of independent `SUPPORT`/other eligible Evidence satisfies a route without mislabeling any one result as confirming;
4. **Elimination:** authorized `RULE_OUT` Evidence eliminates every other public candidate while the selected candidate remains; carefully authored combinations may use `CONTRADICT`, but `CONTRADICT` alone does not automatically mean ruled out; and
5. **Recovery-derived route:** a failed/inconclusive Verify or later machine-state observation may open a new route for a newly actionable Fault.

`CONFIRM` becomes a promise: for the referenced candidate under the current target/state conditions, that Evidence independently satisfies a positive Isolation route. If content still requires corroboration, use `SUPPORT`, not `CONFIRM`. Commit Isolation additionally requires the candidate to map to a true active actionable Fault; a confirmed non-actionable effect/condition must be labeled as such and cannot open a Repair gateway.

Multiple valid routes may coexist, so different Players or teams can reach the same conclusion through different technical reasoning. Evidence contributions from multiple Players may combine when visibility permits, and any eligible Player may commit. The first accepted commitment for a particular active Fault/stage owns the Isolation event and contribution slot; the same already-isolated Fault is not repeatedly committed or scored, while later causal stages may require new Isolation.

Every route is typed, versioned, Builder-proved, and player-safe. The UI explains disposition meanings and can show public route concepts, but it does not preview hidden truth or guarantee acceptance for a false candidate. The `One Member Down` regression must prove that its decisive Drive Health `CONFIRM` succeeds alone—or the content must be relabeled/re-authored as non-confirming.

## PT-004 — Speculative Repair

Should a Player be able to Repair before accepted Isolation?

### A — Keep the accepted-Isolation gate (recommended for the first experiment)

Do not add speculative Repair yet. PT-003 D already permits Isolation through direct confirmation, corroborated support, or elimination, so a Player has flexible evidence paths without using Repair as the diagnostic oracle. This preserves the game's causal-accountability lesson.

### B — Permit a guess with two candidates remaining

When no more than two non-eliminated candidates remain, allow an eligible Repair guess. It spends the printed Card and Actions. A wrong guess changes no machine state, returns one generic unsupported-repair result, receives no score, and records a speculative-repair statistic without revealing whether the candidate or procedure was wrong.

### C — Permit Repair at any time

Allow any eligible-looking Repair before Isolation, with an explicit additional Action/resource penalty and the same generic failure response. This is the strongest parts-cannon model and the largest departure from the educational loop.

## PT-005 — Give Up and Show Answer

What should the solo-only reveal do?

### A — Abandon one Ticket, reveal, and continue (recommended)

After confirmation, atomically mark the selected Ticket `ABANDONED_REVEALED`, void its pending contributions, archive it without closure or points, and reveal its hidden Fault/causal path, required Isolation Evidence, eligible Repair, and Verify/closure path. The remaining queue continues. A Match containing any abandoned Ticket is not recorded as a solo win, and Profile tracks Ticket give-ups separately. No play can continue on the revealed Ticket.

### B — End and reveal the whole Match

Give Up ends the entire Match as a solo loss/no-contest and reveals every active Ticket solution. This is simpler and safest for hidden information, but punishes a Player who only needs help with one Ticket in a longer queue.

### C — Progressive hints only

Keep the Ticket active and reveal increasingly specific hints, never the full hidden truth. This preserves the Match but does not fully answer whether a valid authored solution existed.

## PT-006 — Initial playable-content breadth

How large should the first expansion be?

### A — Twelve fingerprints across six subsystems

Support at least two distinct causal fingerprints each for storage, memory, power, boot, thermal, and network. Add however many Card Definitions and authored/assemblable parts are required for complete diagnostic, Isolation, Repair, and Verify coverage; do not chase an arbitrary Card count. Queues must exhaust eligible unique fingerprints before balanced repetition.

### B — Six fingerprints across three subsystems

Ship a smaller slice with two fingerprints each in storage, memory, and power. This is faster but may still feel repetitive and postpones boot, thermal, and network coverage.

### C — Convert all action-bearing library records

Attempt playable contracts for all current 37 Tests, 13 Commands, 35 Repairs, and 22 Validations, then build Ticket coverage around them. This is comprehensive but much too large for one safe content task without staged releases.

### D — Twelve fingerprints plus all 50 Bench diagnostics (recommended with PT-001 D)

Support Option A's twelve causal fingerprints across storage, memory, power, boot, thermal, and network, while also promoting all current 37 Tests and 13 Commands into the versioned Global Bench catalog. Add only the Repairs and Validations needed by the twelve supported scenario paths; do not expand all 107 action-bearing records in one task.

Each promoted diagnostic needs a complete typed execution contract, target-compatibility rules, and deterministic Evidence behavior. Reuse validated outcome families for clean, not-applicable, no-relevant-finding, and inconclusive results where technically accurate instead of hand-authoring 50 × every Ticket combinations or inventing claims. Scenario-specific support/contradiction/rule-out/confirmation remains explicitly authored or assembled from validated domain relationships. This is materially larger than A, but it fulfills the pictured Global Bench without coupling it to full Repair/Validation conversion.

## PT-007 — Tutorial scope

What tutorial package should follow the rule/content work?

### A — Two engine-driven tutorials (recommended)

Create a short fundamentals tutorial and a second failed-Verify/recovery tutorial. Both use pinned seeds and real engine/Builder intents, pause between checkpoints, highlight the exact current control, provide replayable explanations, support keyboard/touch/reduced motion, and can be restarted independently.

### B — One fundamentals tutorial

Cover Observe, diagnostics, Evidence, candidate management, Isolation, Repair, Verify, Documentation, and closure in one fixed Ticket. Defer failed Verify and recovery.

### C — Contextual help only

Add a rules reference and dismissible callouts without a locked guided sequence. This is lighter but does not prove a complete path through the actual engine.

## PT-008 — Same-state diagnostic repetition — **B approved 2026-08-26**

Frozen §11 currently rejects an identical same-diagnostic, same-target, same-machine-revision execution before payment when no new authored outcome exists. That is a defensible anti-farming shortcut, but it makes a deterministic, non-mutating diagnostic feel less repeatable than its model implies and directly produces the post-run discontinuity described by TASK-021.

This decision applies to deliberate **new** action requests. Retrying the exact same request/idempotency key remains request replay: it must return the original result without another event or charge. A changed target, machine revision, or future authoritative diagnostic condition is a fresh observation rather than a same-state duplicate.

### A — Paid redundant repeat with explicit Evidence lineage

Allow a Player to deliberately run the same Test or Command again against the same target and unchanged machine revision. The new execution:

- must satisfy ordinary timing, target, Action-cost, and zero-Action anti-loop rules;
- spends the printed Action cost and creates one new immutable typed result linked to the first equivalent Evidence event through an explicit duplicate/reproduction lineage field;
- clearly reports that the prior deterministic result was reproduced and identifies the original Evidence number in the player-safe result and Worklog;
- is classified as redundant work for statistics and earns no Service Points or contribution slot;
- does not change machine state, candidate assessment, elimination state, or isolation progress; and
- is not an eligible citation and cannot manufacture a second route, satisfy a distinct-outcome threshold, or corroborate itself.

The original Evidence remains the canonical citable observation. The duplicate is still visible Evidence of what the Player chose and what the game returned, but its non-contributing status is authoritative rather than inferred from copy. Automated policies must not loop on redundant repeats merely because they remain legal.

### B — Preserve rejection before payment and explain it (approved)

Keep the current rule. Once an equivalent outcome exists for the target and machine revision, the diagnostic remains inspectable but is not runnable until relevant state changes. The UI must say that the current revision already has this result and that no Action was spent. This avoids duplicate-Evidence lineage, citation, scoring, replay, and automated-policy complexity while retaining the existing anti-redundancy rule.

### C — Paid repeat recorded only as redundant Worklog

Allow the repeat and spend its cost, but create a typed redundant-action result only in the Worklog rather than another Evidence item. This avoids duplicate Evidence semantics, but conflicts with the established invariant that every accepted diagnostic creates a diagnostic Evidence result and makes the reproduced observation harder to find.

The project owner selected B after reviewing the complexity of Option A. Frozen §11 already expresses B, so no rules-version or engine migration is required. The proposed TASK-022 was withdrawn. TASK-021-HIGH owns the necessary selected-Ticket scoping and clear completed/current-revision explanation without changing diagnostic repetition rules.

## Story Mode architecture approvals

**Approved 2026-08-27:** `STORY-001 A`, `STORY-002 A`, `STORY-003 A`, `STORY-004 A`, `STORY-005 A`, and `STORY-006 A` govern TASK-026 through TASK-030. They establish the Story authoring, branching, persistence, Match-interruption, deck, and art-source contracts without changing current V0 gameplay. The alternatives remain decision provenance and are not implementation authority. TASK-025 does not depend on them.

### STORY-001 — Story authoring format — **A approved 2026-08-27**

- **A — Versioned declarative story packs (approved).** Author chapter-sized data files containing stable labels and typed statements. A tested JavaScript interpreter executes the contract; story content cannot run arbitrary code. This gives authors scale, validation, deterministic replay, portability, and a clean security boundary.
- **B — Trusted JavaScript modules.** Author labels and branches directly as JS functions. This is familiar and flexible but makes content capable of bypassing validation/state boundaries and makes large-scale editing/migration harder.
- **C — A custom Ren'Py-like text language.** Build a dedicated parser and pleasant prose-first syntax. This could eventually be author-friendly, but it adds a language/tooling project before the first campaign. It may remain a future authoring front end that compiles to Option A.

### STORY-002 — Durable checkpoint and interruption policy — **A approved 2026-08-27**

- **A — Stable boundaries plus explicit checkpoints (approved).** Persist at scene/chapter boundaries, authored safe checkpoints, immediately before a Story Match, and after its accepted result. Leaving mid-scene restarts that bounded segment; leaving a current non-resumable Match restarts it from the pre-Match checkpoint. The UI explains restart versus resume.
- **B — Exact statement and active-Match resume.** Serialize the program counter, layers, call stack, transition state, and full engine Match. This promises maximal continuity but greatly expands migrations, privacy, deterministic restoration, stale-content, and exploit surfaces.
- **C — Manual chapter saves only.** Smallest contract, but routine navigation/reload can lose too much progress and feels hostile in a browser application.

### STORY-003 — Branch predicate authority — **A approved 2026-08-27**

- **A — Typed story predicates (approved).** A cutscene choice may select its next label immediately and may also write a typed choice/flag that changes branches later in the story. Restricted conditions may read those remembered decisions, story-scoped Service Points, and normalized prior Match outcomes. Service Points are therefore one branch input, not the sole topology mechanism. Global lifetime statistics remain available for display but do not accidentally rewrite campaign continuity.
- **B — Service Points only.** Easy to understand but cannot express remembered choices or meaningful non-score outcomes.
- **C — Arbitrary JavaScript predicates.** Very flexible but unreviewable, difficult to migrate, and able to couple story content to internal or hidden state.

### STORY-004 — Story Match interruption — **A approved 2026-08-27**

- **A — Preserve the current no-active-Match-resume rule (approved).** Persist a pre-Match Story checkpoint; if the page is left/reloaded, clearly offer to restart that configured Match. Only an authoritative terminal result advances the Story.
- **B — Resume Story Matches only.** Add full Match serialization/restoration for campaign play while Local solo remains non-resumable. This creates two lifecycle contracts and requires a larger engine/session migration.
- **C — Treat interruption as abandonment.** Advance an authored failure/abandon branch. This is dramatic but punishes ordinary browser interruption and can distort statistics.

### STORY-005 — Story Match deck policy — **A approved 2026-08-27**

- **A — Use the active legal Player deck with preflight (approved).** Each Story Match is solvability-proved against the active deck contract. If the selected deck cannot support the scenario, route to Decks with a clear requirement summary and return path; never start an unwinnable Match.
- **B — Authored loaner deck per Match.** Guarantees a controlled teaching path and simplest proof, but weakens the purpose of deck building during the campaign.
- **C — Let the Player choose active or loaner deck each Match.** Flexible, but doubles balance, result-context, tutorial, and narrative QA for every encounter.

### STORY-006 — Production art direction and source boundary — **A approved 2026-08-27**

- **A — Original painterly static 2D assets (approved).** Use [`docs/story/VISUAL_DIRECTION.md`](../../story/VISUAL_DIRECTION.md) and the project-owned Story reference set to commission/generate original server-repair backgrounds, character variants, and inserts with complete provenance. Watermarked/uncleared third-party reference pixels are not copied or committed.
- **B — Require a user-supplied licensed reference pack before art production.** Strongest explicit source control but delays visual development even though a prose direction can support original work.
- **C — Extend the current realistic gameplay-illustration language into Story scenes.** Reuses a proven pipeline and palette, but offers less distinction between narrative scenes and Cards/Tickets.

Approved reply record:

```text
STORY-001 A
STORY-002 A
STORY-003 A
STORY-004 A
STORY-005 A
STORY-006 A
```

### STORY-007 — Campaign-one canon package — **A approved 2026-08-28**

TASK-027 through TASK-030 turned the existing Story working premise into the first complete, editable production campaign. Publication as settled canon required the explicit owner choice recorded below. That project-level canon approval does not replace ordinary name or trademark due diligence before a commercial release.

- **A — Approve the existing campaign-one package as canon (approved).** Use the 2049 Trinity Hub setting, Second Current Serviceworks, Continuity Rotation, Civic Atlas, The Quiet Cascade, SIFT, the established nine-person ensemble, and the customizable Crossline Technician as the canonical first-campaign package. TASK-030's reviewed original character art becomes the visual anchor for that ensemble; later edits require ordinary versioned content/art migration rather than silent identity replacement.
- **B — Keep the package as production-candidate content.** Ship the complete playable campaign and original art for structural/playtest use, but continue labeling its proper names and character identities as candidate material until the owner supplies revisions or approves A. Runtime, Match, checkpoint, and portability contracts remain unaffected.

Approved reply record:

```text
STORY-007 A
```

### STORY-008 — Characterization-pass creative discretion — **A approved 2026-08-28**

The project owner pre-approved the characterization pass's backstory and fictional-reference choices so TASK-035 does not require per-character option review.

- **A — Builder selects continuity-safe backstories and transformed public-domain reference constellations (approved).** Deepen the nine canonical ensemble characters and select documented public-domain fictional references as analytical inputs. Retain established names, roles, relationships, visual identities, technical competence, and the customizable protagonist boundary. Blend multiple abstract influence dimensions; do not copy source phrasing, catchphrases, plots, complete personalities, or identity stereotypes. Choices must remain compatible with current art, Story topology, gameplay authority, and the semantic payload established by TASK-033/TASK-034.
- **B — Return each character package for owner approval.** Prepare reference and backstory options but block the final voice bible until the owner selects each package.

Approval A grants creative discretion inside the stated canon/originality boundary. It does not pre-approve new characters, changed identities, new art, Story branches, Match changes, or technical claims.

Approved reply record:

```text
STORY-008 A
```

## Migration Seed and Server Repair V2

The Version 2 proposal is a separate migration track, not another PT-003 option. If approved, V2 does not inherit “authored disposition” as its normal Evidence architecture. Review [`TASK-017`](../../tasks/TASK-017-create-server-repair-v2-migration-seed.md) for the complete bounded audit, ontology, proof, and repository contract.

**Approved 2026-08-24, then deferred:** `MS-001 A`, `MS-002 A`, `MS-003 A`, `MS-004 A`, `MS-005 A`, and `MS-007 A` remain the Migration Seed direction. MS-006 A's instruction to park V0 was superseded later that day when the project owner reactivated the V0 training-ready track and deferred TASK-017. The alternatives below remain decision provenance; they are not open implementation choices.

### MS-001 — New repository identity

- **A — Create `jamangi/Server_Repair_V2` as a public repository (recommended).** Verify that the name is available before creation and stop rather than reuse an unexpected existing repository.
- **B — Approve the public migration but provide a different owner or repository name.**

### MS-002 — V0 preservation boundary

- **A — Preserve V0 intact (recommended).** Do not rewrite, archive, delete, retag, or bulk-modify this repository. After V2 is online, V0 may receive one concise README/decision pointer to the new project.
- **B — Preserve code/history but permit a broader V0 migration-status documentation pass.** No V0 behavior or schema changes are implied.

### MS-003 — V2 inference authority

- **A — Dependency-derived dispositions with constrained explicit exceptions (recommended).** Capabilities, topology, dependency expressions, Fault effects, selected Test conditions, and observation coverage produce Evidence dispositions. A versioned exception is allowed only for a named technical phenomenon the typed model cannot yet express and must be justified, scoped, tested, and visible to validation.
- **B — Dependency-derived dispositions with no exception mechanism.** This is purer but may force premature ontology complexity or block legitimate technical cases.
- **C — Hybrid per-Test/per-Ticket disposition tables.** This preserves more V0 content but is not recommended because it recreates the debt the migration is meant to remove.

### MS-004 — Seed proof depth

- **A — Strict draft schemas plus executable reference semantics (recommended).** The Seed includes valid/invalid examples and a small replaceable inference evaluator proving dependency propagation, observation, candidate compatibility, disposition, derivation trace, and Isolation proof. It does not build the production engine or Viewer.
- **B — Schemas and prose blueprint only.** Faster, but logical contradictions may survive until expensive engine work.
- **C — Build the production engine inside the Seed task.** Too much scope before the ontology receives independent review.

### MS-005 — Initial domain migration depth

- **A — Provenance-rich catalog seed only (recommended).** Inventory V0 domain IDs, names, types, sources, and relationship hints; exclude V0 Evidence/Isolation tables from V2 authority. Rebuild complete domain objects later in bounded technical batches.
- **B — Structurally port every domain object immediately.** Faster apparent progress but risks translating V0 assumptions before the ontology stabilizes.
- **C — Carry no domain catalog into V2.** Cleanest surface but unnecessarily loses useful naming, research, and provenance.

### MS-006 — Existing V0 task track

- **A — Park V0 semantic expansion (recommended).** Retain TASK-013 through TASK-016 and reserved TASK-011 as historical/proposed contracts but do not implement them in V0. TASK-012 may still be executed as a contained defect-maintenance task for the preserved playable prototype.
- **B — Continue the V0 and V2 tracks in parallel.** This produces two evolving rule/content systems and significantly increases synchronization and debt risk.

### MS-007 — Complexity profiles

- **A — One typed engine model with Core, Advanced, and Expert content profiles (recommended).** The Seed must prove the nuanced semantics, while the first V2 playable content exposes only Core cases. Later profiles may introduce redundancy, conditions, intermittent behavior, telemetry failures, concurrent Faults, and deeper ambiguity without replacing the inference engine.
- **B — Model Core only and defer advanced schema support.** Smaller foundation, but may require another contract migration when richer campaign/expert content arrives.

## Deferred: SLA / round limit

Do not implement or approve an SLA yet. A future decision should compare an authoritative round limit with the existing turn/player clocks and stalemate/cap semantics after the untimed diagnosis loop is understandable and balanced. No current task should smuggle in a deadline through UI timers or tutorial scripting.

## Reply format

Historical reply format used during review:

```text
PT-001 D
PT-002 A
PT-003 D
PT-004 A
PT-005 A
PT-006 D
PT-007 A
MS-001 A
MS-002 A
MS-003 A
MS-004 A
MS-005 A
MS-006 A
MS-007 A
```
