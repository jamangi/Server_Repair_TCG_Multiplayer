# Candidate Decisions

This document stages proposed rule decisions before they enter the canonical unfrozen inventory. Candidate status is not permission to implement an option. See [`DECISION_INDEX.md`](DECISION_INDEX.md) for authority and lifecycle rules.

The 2026-08-22 review approved the gameplay structure tested by the Candidate-Frozen Example Profile v0.0. Those resolved rules now live in [`FROZEN_RULES.md`](FROZEN_RULES.md). This file retains only questions that the review left in contention or newly exposed.

## Score and closure

<a id="score-001"></a>
### SCORE-001 — Verification-conditioned contribution scoring

**Status:** Candidate

**Depends on:** Frozen Isolation, Repair, Verify, Documentation, and closure records

**Blocks:** `SCORE-002`, exact score termination tests, and final statistics

Should useful causal contributions earn Service Points only after the Ticket's Verification requirements succeed?

The leading candidate is a **pending contribution ledger**:

1. An accepted Isolation and each necessary Repair create attributable pending contribution records, not immediate points.
2. The Ticket's server-only authored causal chain and scoring rubric identify which Isolation and Repair events belong to a valid resolution path.
3. Failed or inconclusive Verify pays nothing and returns the Ticket to Diagnosis. Prior pending contributions remain in history rather than being discarded.
4. When a later Verify succeeds, every still-relevant causal contribution in the successful path becomes payable, including valid work completed before an earlier failed Verify.
5. Ineligible, redundant, or superseded actions remain statistics but do not score.
6. Score events settle atomically during closure so score termination cannot end the match before the verified Ticket is documented and archived.
7. Competitive points go to the recorded contributors. Cooperative points enter the shared team pool while retaining individual attribution.

This model rewards the troubleshooting work that repaired the machine, makes closure sniping a small finalization reward rather than the whole meal, and avoids paying for a plausible Isolation or Repair that Verification later disproves.

Decide:

- whether only Isolation and Repair score, or whether decisive Tests and Verify may also carry authored contribution values;
- whether every Ticket exposes its possible point budget or keeps some scoring metadata server-only;
- whether multi-fault Tickets pay once per stage, once per distinct causal element, or according to authored weights;
- whether an earlier contribution remains eligible after later work revises the causal path;
- whether repeated equivalent actions can ever score more than once; and
- whether Root Cause is a separate bonus or simply the highest-valued Isolation contribution.

<a id="score-002"></a>
### SCORE-002 — Closure reward size and recipient

**Status:** Candidate

**Depends on:** `SCORE-001`, `DOC-009`

Should a valid closure bundle still award one Service Point to its publisher?

The leading candidate keeps a one-point closure reward but requires the Ticket's verified causal-contribution budget to be worth more than closure alone. For an ordinary single-fault Ticket, an authored baseline could be:

| Contribution | Candidate value |
| --- | ---: |
| Accepted causal Isolation | 1 |
| Necessary Repair | 1 |
| Valid closure bundle | 1 |

This preserves a reason to complete the record while limiting a non-contributor's steal to one third of the ordinary Ticket's total. More complex Tickets could award additional authored causal contributions without increasing the closure reward.

Alternatives still worth testing:

- no Service Point for closure; Documentation recovery and statistics are sufficient;
- award closure credit to the successful verifier rather than the publisher;
- split the closure point among the bundle's contributors; or
- treat closure as a team/statistical credit only while all Service Points follow causal work.

Exact values are balance decisions. The engine question is which event owns the award and whether a closer can receive points without another qualifying contribution.

<a id="doc-009"></a>
### DOC-009 — Zero-Action closure bundle and same-turn completion

**Status:** Candidate

**Depends on:** Frozen two-Action turns and mandatory closure bundles

**Pressures:** Existing candidate-flow replays that spend one Action on `Document Close`

Should publishing a valid closure bundle cost zero Actions?

The leading candidate is:

- Document Live remains a one-Action basic action and keeps its one-time source-card recovery benefit.
- A closure bundle becomes eligible only after all current Verify conditions pass.
- Successful Verify opens an immediate closure-resolution window before the normal zero-Actions automatic end-turn check.
- Publishing an eligible closure bundle in that window costs zero Actions, is limited to once for that Ticket, resolves the frozen closure transaction, and ends the active Player's turn.
- Because the bundle is free, a Player can spend the standard two Actions on Repair and Verify, then close the Ticket in that same turn.
- A closure attempt that fails validation is rejected before changing state and cannot be used as a truth oracle.

This directly closes the timing hole exposed by the examples: honest play no longer needs three Actions for Repair, Verify, and closure while a later Player can take the final point. The explicit resolution window is necessary because the frozen turn otherwise ends when Actions reach zero. This change does not eliminate every form of closure competition—a different Player may still perform Verify and close—but `SCORE-001` and `SCORE-002` cap what that finalizer can take.

Decide whether a further protection is needed:

- successful Verify grants only that verifier an immediate closure prompt before the turn can end;
- the most recent qualifying causal contributor receives first refusal;
- any active Player may close once eligible, relying on contribution scoring to make stealing unattractive; or
- closure occurs automatically from the verified structured bundle, with publisher attribution only when someone actively enriches the record.

The recommended first test is zero-Action, same-turn closure with no ownership reservation. It changes one cost, preserves shared Tickets, and lets contribution scoring do most of the anti-sniping work.

## Equipment and qualifications

<a id="eqp-001"></a>
### EQP-001 — Separate pre-match Equipment slot and starting installation

**Status:** Candidate

**Blocks:** `EQP-002`, equipment schemas, loadout legality, and UI flows

Should each Player bring one account-owned Equipment item in a dedicated loadout slot that is installed automatically at match start?

The leading candidate is:

- Equipment is not a deck card and consumes no deck slot.
- Each Player loadout has one Equipment slot separate from the in-match Bench.
- Ready snapshots the selected Equipment with the deck and other mechanical preparation.
- Match setup creates one Installed Equipment object for that Player before opening hands and the first turn.
- The Installed Equipment remains distinct from cards later installed into the Bench.
- A Player may select an explicit no-equipment option if the mode or collection makes the slot optional; whether every standard Player must bring one remains to be decided.

This replaces the example flow's assumption that equipment might never create a match object.

<a id="eqp-002"></a>
### EQP-002 — Equipment effect and Action-cost budget

**Status:** Candidate

**Depends on:** `EQP-001`

What small edge may starting Equipment provide without bypassing troubleshooting?

The leading candidate requires every Equipment definition to state:

- whether its effect is passive, activated, or both;
- any 0-, 1-, or 2-Action activation cost;
- legal targets and timing;
- per-turn, per-Ticket, or per-match use limits;
- visibility and Worklog behavior; and
- whether it exhausts, cools down, or remains continuously available.

Equipment may improve access, efficiency, comparison quality, or preparation. It may not reveal hidden authoritative answers, skip authored Isolation requirements, combine Test and permanent Repair, declare Verify success, or make Documentation optional.

Candidate balance guardrails:

- passive effects should be narrow and legible;
- a 0-Action activation needs an explicit frequency limit;
- stronger effects should consume one or two Actions; and
- equipment should create deck-building variety rather than a mandatory best item.

<a id="eqp-003"></a>
### EQP-003 — Equipment ownership, availability, and equality

**Status:** Candidate

**Depends on:** `EQP-001`, `EQP-002`

How do Players obtain and select Equipment without turning campaign progress or spending into an unfair multiplayer advantage?

Decide:

- whether the first version grants a common starter set to every account;
- whether campaign-only Equipment may be used in public competitive rooms;
- whether Rooms may restrict Equipment to a normalized pool, disable it, or allow owned collections;
- whether duplicate Equipment across Players is legal; and
- whether an Equipment selection must be compatible with a deck, mode, or Ticket family.

The current candidate direction favors a universally available starter item plus Room-visible equipment policy. Real-money acquisition is outside the current rules scope.

<a id="qual-001"></a>
### QUAL-001 — Qualifications as campaign progress, not board mechanics

**Status:** Candidate

**Pressures:** Candidate-flow examples that use a Qualification to gate Equipment

Should Qualifications be account indicators of campaign progress with no board-game effect?

The leading candidate is:

- Qualifications are earned campaign milestones or record markers.
- They are not equipped, drawn, consumed, or installed.
- They do not modify Actions, cards, Tests, Isolation, Repair, Verify, Documentation, deck legality, or Equipment eligibility.
- They may summarize completed instruction, unlock story or campaign access, and appear in My Info or progression views.
- Matchmaking rank is a separate future system and must not reuse Qualification state implicitly.

This keeps Equipment as the single pre-match mechanical preparation axis and prevents campaign position from quietly granting board power.

An experience-based rank for pairing Players of similar ability is deliberately deferred. If introduced later, it needs its own rating, anti-smurfing, placement, decay, queue, and privacy decisions rather than being inferred from Qualifications.

## Ticket selection

<a id="gen-001"></a>
### GEN-001 — Campaign Ticket selection within authored scenario bounds

**Status:** Candidate

Should a replayable campaign scenario draw Tickets randomly from an authored eligible pool rather than always use fixed fixtures?

The leading candidate lets a scenario define:

- an eligible Ticket pool or generation constraints;
- permitted causal-chain shapes and difficulty range;
- required teaching beats or guaranteed Ticket categories;
- exclusions based on story truth or prior completion; and
- a seeded selection policy for reproducible saves and tests.

Fixed Tickets remain appropriate for tutorials, audits, and worked examples. Bounded random selection is intended for replayability without abandoning authored candidates, Evidence outcomes, Isolation requirements, or Verify conditions.

## Resolved candidate record

The following candidate questions were answered by the 2026-08-22 review and moved into [`FROZEN_RULES.md`](FROZEN_RULES.md):

The legacy anchors below are retained so existing research and candidate-flow links resolve to this promotion record:

<a id="obs-001"></a>
<a id="hyp-001"></a>
<a id="hyp-002"></a>
<a id="tst-001"></a>
<a id="tst-002"></a>
<a id="iso-001"></a>
<a id="iso-002"></a>
<a id="iso-003"></a>
<a id="iso-004"></a>
<a id="rep-001"></a>
<a id="doc-001"></a>
<a id="doc-002"></a>
<a id="doc-003"></a>
<a id="doc-004"></a>
<a id="doc-005"></a>
<a id="doc-006"></a>
<a id="doc-007"></a>
<a id="doc-008"></a>
<a id="cross-001"></a>
<a id="cross-002"></a>
<a id="cross-003"></a>
<a id="cross-004"></a>

| Former candidate | Frozen result |
| --- | --- |
| `OBS-001` | Immediate public action placeholder with authorized detail visibility (§8). |
| `HYP-001`, `HYP-002` | Public authored candidate universe and lightweight private/team Hypothesis (§11). |
| `TST-001`, `TST-002` | Authored Evidence outcomes and distinct immutable executions (§11). |
| `ISO-001`, `ISO-002` | Evidence-citing Isolation and public Ticket-owned acceptance (§12). |
| `ISO-003`, `REP-001`, `CROSS-004` | Diagnosis gateway; speculative Repair rejected before payment (§§1, 12). |
| `DOC-001`–`DOC-008` | Mandatory structured closure, incremental Document Live, public projection, recovery, and chronology (§14). Exact closure cost moved to `DOC-009`. |
| `CROSS-001` | Atomic closure transaction (§15), with scoring hooks left open. |
| `CROSS-002` | First-version deck/draw/Search/Refresh economy (§§9–10). |
| `CROSS-003` | Mode-aware Evidence plus public Documentation (§§8, 14). |

`ISO-004` was not frozen as the old one-point Root Cause model. It is superseded for review by `SCORE-001` and `SCORE-002`.

## Ideas pruned beneath current candidates

| Pruned idea | Parent decision | Reason |
| --- | --- | --- |
| Pay Isolation and Repair immediately. | `SCORE-001` | Settlement timing must account for failed Verify and closure atomicity. |
| Erase pending credit when Verify fails. | `SCORE-001` | A later successful path may still depend on earlier valid work. |
| Every technically useful action scores. | `SCORE-001` | Exact eligible contribution classes and duplicate suppression are the fundamental questions. |
| Give the closer the entire Ticket value. | `SCORE-002` | This recreates the closure-sniping problem the new score model is meant to solve. |
| Reserve every closure for the Repairing Player. | `DOC-009` | A multi-contributor Ticket may have no single Repair owner; test the lighter same-turn rule first. |
| Put Equipment in the Bench. | `EQP-001` | The proposed dedicated Equipment slot should be decided before its in-match representation. |
| Qualification gates Equipment. | `QUAL-001` | This is the contradicted example option, not a separate decision if Qualifications have no board effect. |
| Qualification doubles as matchmaking rank. | `QUAL-001` | Campaign progress and competitive skill rating require different semantics. |

## Candidate-review procedure

For each candidate:

1. Confirm that its parent decisions cannot determine it automatically.
2. Identify frozen rules, unfrozen questions, and implementation artifacts it pressures.
3. Prune derivative options beneath the controlling candidate.
4. Accept the fundamental question into `UNFROZEN_RULES.md` without changing its ID, or record why it remains a candidate.
5. Update `DECISION_INDEX.md` and `UNSYNCHRONIZED_DECISIONS.md` when its status changes.
