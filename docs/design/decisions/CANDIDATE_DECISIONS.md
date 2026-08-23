# Candidate Decisions

This document stages proposed rule decisions before they enter the canonical unfrozen inventory. Candidate status is not permission to implement an option. See [`DECISION_INDEX.md`](DECISION_INDEX.md) for authority and lifecycle rules.

## Current state

There are **no active candidate decisions** after the 2026-08-22 resolution pass.

- `SCORE-001` and `GEN-001` were accepted into [`UNFROZEN_RULES.md`](UNFROZEN_RULES.md) without changing their IDs.
- `DOC-009` and the non-mechanical Qualification boundary were approved in [`FROZEN_RULES.md`](FROZEN_RULES.md).
- `SCORE-002` was pruned because a rewarded manual closure conflicts spiritually with the approved zero-Action closure model.
- `EQP-001`, `EQP-002`, and `EQP-003` were pruned by the more fundamental frozen decision to remove the account/loadout Equipment system entirely.

New proposals may be added here later. The empty active bucket does not mean every rule is decided; accepted open questions remain in [`UNFROZEN_RULES.md`](UNFROZEN_RULES.md).

## Spiritual-conflict disposition

`SCORE-002` and `DOC-009` offered individually coherent but incompatible incentives:

- awarding a Service Point for closure makes the closing action scarce and competitively valuable, which supports charging an Action; while
- using closure as a zero-Action completion convenience makes it a recordkeeping endpoint rather than a scoring contest.

The selected direction is the second model. Closure costs zero Actions, awards no Service Points, and remains attributable as a Player/team statistic. Service Points follow causal work under the unresolved `SCORE-001` policy and settle only if the Ticket actually closes.

## 2026-08-22 resolution record

The legacy anchors below are retained so existing research and candidate-flow links continue to resolve to a decision-history record:

<a id="score-001"></a>
<a id="score-002"></a>
<a id="doc-009"></a>
<a id="eqp-001"></a>
<a id="eqp-002"></a>
<a id="eqp-003"></a>
<a id="qual-001"></a>
<a id="gen-001"></a>
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

| Former candidate | Disposition | Current authority |
| --- | --- | --- |
| `SCORE-001` | Accepted as an unresolved fundamental decision, revised so pending causal contributions settle at Ticket closure rather than successful Verify alone. | [`UNFROZEN_RULES.md`](UNFROZEN_RULES.md#score-001) |
| `SCORE-002` | Pruned. Closure has statistical attribution but no Service Point reward. | Frozen Rules §§14–15 |
| `DOC-009` | Frozen as zero-Action closure with an immediate post-Verify window, no protected claim, and no Service Point reward. | Frozen Rules §§14–15 |
| `EQP-001`–`EQP-003` | Pruned by the root decision to remove Equipment from the game. | Frozen Rules §16 |
| `QUAL-001` | Frozen as non-mechanical honor badges only. | Frozen Rules §16 |
| `GEN-001` | Accepted as the unresolved constraint-driven Ticket Builder decision. | [`UNFROZEN_RULES.md`](UNFROZEN_RULES.md#gen-001) |
| `OBS-001` | Immediate public action placeholder with authorized detail visibility. | Frozen Rules §8 |
| `HYP-001`, `HYP-002` | Public authored candidate universe and lightweight private/team Hypothesis. | Frozen Rules §11 |
| `TST-001`, `TST-002` | Authored Evidence outcomes and distinct immutable executions. | Frozen Rules §11 |
| `ISO-001`, `ISO-002` | Evidence-citing Isolation and public Ticket-owned acceptance. | Frozen Rules §12 |
| `ISO-003`, `REP-001`, `CROSS-004` | Diagnosis gateway; speculative Repair rejected before payment. | Frozen Rules §§1, 12 |
| `DOC-001`–`DOC-008` | Mandatory structured closure, incremental Document Live, public projection, recovery, and chronology. | Frozen Rules §14 |
| `CROSS-001` | Atomic closure transaction. | Frozen Rules §15 |
| `CROSS-002` | First-version deck/draw/Search/Refresh economy. | Frozen Rules §§9–10 |
| `CROSS-003` | Mode-aware Evidence plus public Documentation. | Frozen Rules §§8, 14 |

The former one-point Root Cause model in `ISO-004` remains superseded by `SCORE-001`; it was not frozen implicitly.

## Pruned ideas retained for history

| Pruned idea | Controlling decision | Reason |
| --- | --- | --- |
| Award a Service Point for publishing the closure bundle. | Frozen zero-Action closure | Would recreate closure sniping and make a convenience endpoint competitively scarce. |
| Charge an Action for closure. | Frozen zero-Action closure | Honest Repair + Verify play must be able to complete the Ticket in the same two-Action turn. |
| Give a Player first refusal or ownership of closure. | Frozen shared closure | Closure has no Service Point reward, so a special claim adds complexity without protecting causal credit. |
| Pay pending causal contributions at successful Verify. | `SCORE-001` | The company receives value only when the verified Ticket is also documented and closed. |
| Erase pending credit when Verify fails. | `SCORE-001` | A later successful resolution may still depend on earlier valid work. |
| Every technically useful action scores. | `SCORE-001` | Exact eligible contribution classes and duplicate suppression remain the fundamental scoring questions. |
| Any Equipment slot, inventory, effect, or Store category. | Frozen Equipment removal | The entire account/loadout mechanic adds unnecessary complexity. |
| Qualification gates Equipment, decks, procedures, story, or matchmaking. | Frozen Qualification boundary | Qualifications are recognition-only honor badges. |
| Qualification doubles as matchmaking rank. | Frozen Qualification boundary | Competitive rating requires a separate future decision and data model. |

## Candidate-review procedure

For any future candidate:

1. Confirm that its parent decisions cannot determine it automatically.
2. Identify spiritual conflicts as well as direct mechanical contradictions.
3. Identify frozen rules, unfrozen questions, and implementation artifacts it pressures.
4. Prune derivative options beneath the controlling decision.
5. Accept the fundamental question into `UNFROZEN_RULES.md` without changing its ID, freeze an explicitly approved answer, or retain a documented prune.
6. Update `DECISION_INDEX.md` and `UNSYNCHRONIZED_DECISIONS.md` when its status changes.
