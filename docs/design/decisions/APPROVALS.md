# Post-TASK-010 playtest approvals

Status: **Awaiting user choices — 2026-08-24.**

This is a non-authoritative review packet for the first hands-on solo-play findings. Approved choices must be synchronized through TASK-013 before code relies on them. Existing `first-version-v1` behavior remains authoritative until then.

The canonical open-rule entries live in [`UNFROZEN_RULES.md`](UNFROZEN_RULES.md). This file supplies reviewable lettered choices without creating a second rules ledger. After resolution, the selected behavior belongs in `FROZEN_RULES.md`; this packet remains only as decision provenance or may be retired through the approving task.

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

Which diagnostic access profile should a Match use? Review the original project mockups [`relevant_diagnostic_bench.png`](../../ui-plan/ui-reference_images/relevant_diagnostic_bench.png) and [`global_diagnostic_bench.png`](../../ui-plan/ui-reference_images/global_diagnostic_bench.png) as compositional references, not authoritative state.

### A — Relevant Diagnostic Bench only

Every published Test or Command connected to the active Ticket's **public context** is available from a persistent Diagnostic Bench from the beginning. Public context means its observed Symptoms, public Candidate Faults, exposed components/subsystem, or an authored prerequisite/control needed to distinguish those candidates. Relevance must be derivable without consulting hidden truth, so the offered set cannot itself leak the answer. A diagnostic that has no valid relationship to those surfaces is not contextually relevant.

The Diagnostic Bench is a proposed persistent, non-random palette of these Test/Command affordances outside the 30-card response deck. It is not the current `Legal actions` panel. In the present UI, the hand supplies Cards and the action panel shows engine-projected targets for the selected Card. Under this option, the Bench would supply always-available diagnostics—probably as a searchable/filterable panel, drawer, or tray—while the Legal actions panel could remain the final target/inspect/run surface for the selected Bench item.

Bench items remain typed Card Definitions and spend their printed Actions, but they do not depend on draw order or consume response-deck slots for this rules/profile revision. Every offered diagnostic must have exactly one deterministic authored or Builder-assembled Evidence outcome for every machine state in which it can be run. The outcome may support, contradict, rule out, confirm, or explicitly report a clean/inconclusive/no-relevant-finding result. Repair and Verify remain response-deck Cards and retain their gates.

This meets the educational intent without presenting all 50 current diagnostics on every Ticket. It requires deck migration, a new Card placement/availability contract, Builder outcome coverage, projections, UI, and automated-game changes.

### B — Global Diagnostic Bench

Make every published **playable** Test and Command visible on every Ticket from the beginning. Search, Test/Command tabs, subsystem/category filters, deterministic sorting, and bounded pagination keep the catalog navigable. “Published playable” is important: a knowledge-library Test/Command does not enter this Bench until it has a complete typed execution contract and outcome coverage.

Global mode must not label or rank diagnostics by hidden relevance. Unrelated choices resolve to an authored/assembled clean, inconclusive, not-applicable, or no-relevant-finding Evidence result rather than silence. The selected diagnostic surface must show target, cost, and expected target compatibility before confirmation without revealing hidden truth.

This most literally satisfies “all Tests and Commands,” but the current domain already contains 50 such objects. It creates substantial choice overload and a much larger outcome-authoring/validation surface.

### C — Guaranteed deck access

Keep Tests and Commands in the 30-card draw deck, but guarantee that every diagnostic required by the active Ticket is immediately discoverable through a free or separately provisioned diagnostic Search affordance. Ordinary play, discard, Refresh, and copy limits otherwise remain intact.

This is the smallest migration, but diagnostics are still not literally all available and deck construction continues to govern knowledge access.

### D — Player-selectable Bench Profile (recommended experiment)

Provide both `RELEVANT` and `GLOBAL` as pre-Match Bench Profiles over the same versioned playable diagnostic catalog. `RELEVANT` is the default teaching profile and uses Option A's public-context derivation and compact shelf. `GLOBAL` uses Option B's complete catalog and search/filter/pagination layout. In both profiles, diagnostics remain outside the 30-card response deck; Repair and Verify remain response-deck Cards.

The selected profile is pinned in Match configuration/provenance and cannot change during an active Match. Home explains the learning tradeoff before play, saved presets may remember the preference, and local export/import preserves it. Results and automated-game statistics are grouped by Bench Profile so curated and uncurated outcomes are not compared as if they represented the same difficulty. Relevant mode must never use hidden truth to choose its shelf; Global mode must never expose a relevance hint that defeats its purpose.

Use **Bench Profile** (or the user-facing label **Bench Type**) rather than restoring account Equipment. Equipment previously implied owned mechanical loadouts, progression, or readiness snapshots; this setting provisions a diagnostic workspace for one Match and grants no collectible, ownership, or character power.

TASK-013 should establish both authoritative access algorithms, the pinned Match setting, deck migration, projections, and a functional responsive UI using the currently playable catalog. TASK-014 expands and validates the playable diagnostic/content coverage; pairing PT-001 D with PT-006 D is the recommendation if “Global” is intended to include all 50 current Test/Command knowledge records. Until promotion is complete, the UI must report the exact playable count and must not claim the raw library is fully runnable. TASK-016 then performs the dedicated board-density and visual-composition pass against the final representative data sizes.

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

### A — Evidence-backed elimination with two valid Isolation routes (recommended)

The Player may mark a candidate eliminated only by citing authorized Evidence whose authored disposition for that candidate is `RULE_OUT` or `CONTRADICT`. The mark is `PRIVATE_PLAYER` in competitive play and `TEAM` in cooperative play, costs zero Actions, is reversible, and never reveals whether the remaining candidate is true.

Commit Isolation still costs one Action and succeeds through either:

1. the current positive Evidence requirement for the selected actionable Fault; or
2. eligible Evidence-backed elimination of every other public candidate while the selected candidate remains.

This supports both confirmation and Phasmophobia-like elimination without making notebook maintenance consume scarce technical work.

### B — Elimination is a notebook aid only

Allow free, possibly incorrect private/team crossed-out markers with no server validation or gameplay effect. Successful Isolation keeps the current positive Evidence requirement. This improves organization but does not create an elimination route.

### C — Require both positive support and complete elimination

Every other candidate must be validly eliminated and the selected candidate must independently meet its positive Evidence requirement. This is clearest but likely slow and repetitive.

## PT-004 — Speculative Repair

Should a Player be able to Repair before accepted Isolation?

### A — Keep the accepted-Isolation gate (recommended for the first experiment)

Do not add speculative Repair yet. PT-003 A already permits Isolation by elimination, so a Player can unlock Repair without a confirming Test when every alternative has been validly ruled out. This preserves the game's causal-accountability lesson and avoids using machine response as a hidden-answer oracle.

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

## Deferred: SLA / round limit

Do not implement or approve an SLA yet. A future decision should compare an authoritative round limit with the existing turn/player clocks and stalemate/cap semantics after the untimed diagnosis loop is understandable and balanced. No current task should smuggle in a deadline through UI timers or tutorial scripting.

## Reply format

Approve or amend each item by ID, for example:

```text
PT-001 D
PT-002 A
PT-003 A
PT-004 A
PT-005 A
PT-006 D
PT-007 A
```
