# Candidate Decisions

This document stages proposed rule decisions before they enter the canonical unfrozen inventory. Candidates are organized by the troubleshooting loop, followed by cross-stage questions and ideas pruned beneath their controlling parent decisions.

Candidate status is not permission to implement an option. See [`DECISION_INDEX.md`](DECISION_INDEX.md) for authority and lifecycle rules.

## Observe

<a id="obs-001"></a>
### OBS-001 — Visibility at action creation

**Status:** Candidate

**Pressures:** Frozen Worklog examples and Evidence visibility defaults

What becomes visible when an investigative action occurs? Decide separately whether participants can see:

- that an action occurred;
- which card, Test, Tool, or Command was used;
- the target of the action;
- the detailed result or Evidence;
- the acting Player's conclusion.

This boundary is more fundamental than deciding what a later Document action publishes.

## Hypothesize

<a id="hyp-001"></a>
### HYP-001 — Candidate-fault universe

**Status:** Candidate

**Blocks:** `TST-001`, `ISO-001`

How is the candidate-fault universe for a Ticket determined?

Possible models include:

- every globally associated Fault in the domain database;
- a server-generated Ticket-specific candidate set;
- candidates derived dynamically from revealed symptoms;
- an authored candidate list belonging to the Ticket;
- a hybrid of authored and generated candidates.

The answer determines whether complete elimination is computationally and practically achievable.

<a id="hyp-002"></a>
### HYP-002 — Hypothesis and Diagnosis state

**Status:** Candidate

**Depends on:** `HYP-001`

Is a Hypothesis or Diagnosis an explicit game action or only private Player reasoning? If explicit, decide:

- whether a Player selects one or several candidate Faults;
- whether hypotheses are private, team-visible, or public;
- whether hypotheses have mechanical effects;
- whether committing to a Diagnosis differs from forming a Hypothesis.

## Test

<a id="tst-001"></a>
### TST-001 — Test effects on candidate state

**Status:** Candidate

**Depends on:** `HYP-001`, `ISO-001`

How do Tests modify the candidate-fault state? A Test might:

- reveal Evidence;
- eliminate specific candidates;
- confirm a category or Component;
- directly confirm a Fault;
- contribute toward an Isolation threshold.

<a id="tst-002"></a>
### TST-002 — Repeated Test executions

**Status:** Candidate

**Depends on:** `TST-001`, `DOC-008`, `CROSS-002`

How are repeated executions of the same Test represented? Decide whether each execution creates a distinct action and Evidence record when:

- the target changed;
- server state changed after a Repair;
- the result is identical;
- the same Player repeats it without an intervening change.

Resolve the technical event semantics before attaching draw or recovery effects.

## Isolate

<a id="iso-001"></a>
### ISO-001 — Mechanical definition of Isolation

**Status:** Candidate

**Depends on:** `HYP-001`

**Blocks:** `TST-001`, `ISO-002`, `ISO-003`, `ISO-004`

What mechanically constitutes Isolation?

Possible models include:

- server-confirmed elimination of every other legal candidate;
- satisfaction of authored Ticket evidence requirements;
- reaching an Isolation-progress threshold;
- a Player committing to a Fault and being correct;
- identifying an actionable Fault without proving it is the deepest root cause.

<a id="iso-002"></a>
### ISO-002 — Isolation visibility

**Status:** Candidate

**Depends on:** `OBS-001`, `ISO-001`, `DOC-003`

When a Player achieves Isolation, does the isolated Fault become private to that Player, team-visible in cooperative play, immediately public, or public only after Documentation?

<a id="iso-003"></a>
### ISO-003 — Speculative Repair before Isolation

**Status:** Candidate

**Depends on:** `ISO-001`

**Blocks:** `REP-001`, `ISO-004`

May a Player attempt a Repair before Isolation? If allowed, decide whether a correct speculative Repair succeeds and whether any attempt:

- consumes cards, Actions, Components, or other resources;
- reveals information;
- counts as unnecessary work;
- forfeits Root Cause or efficiency rewards.

<a id="iso-004"></a>
### ISO-004 — Root Cause Bonus requirements

**Status:** Candidate

**Depends on:** `ISO-001`, `ISO-003`, `DOC-003`, `CROSS-002`

What earns the Root Cause Bonus? Decide:

- whether it is awarded per Ticket or per Fault;
- which event earns it: Hypothesis, Test, Isolation, Repair, or Documentation;
- whether the deepest cause or merely the actionable cause is required;
- whether unnecessary attempts disqualify it;
- whether the qualifying result must be documented;
- how multiple contributors share or independently earn it.

The exact point value remains a later balance decision.

## Repair

<a id="rep-001"></a>
### REP-001 — Unsuccessful and unnecessary Repair attempts

**Status:** Candidate

**Depends on:** `ISO-003`

If speculative or unnecessary Repairs are legal, define their:

- success and failure conditions;
- resource consumption;
- state changes;
- information revealed by failure;
- Worklog treatment;
- efficiency and scoring consequences.

## Verify

The current candidate batch introduces no independent Verify-specific question. Verification remains part of Ticket completion; its relationship to closure and Documentation is governed by `DOC-001`, `DOC-006`, and `CROSS-001`.

## Document

<a id="doc-001"></a>
### DOC-001 — Documentation requirement for closure

**Status:** Candidate

**Pressures:** Frozen troubleshooting sequence

**Blocks:** `DOC-004`, `DOC-006`, `DOC-007`, `CROSS-001`

Is Documentation mandatory for Ticket closure?

Possible models include:

- mandatory before closure;
- automatically satisfied during closure;
- optional but strongly rewarded;
- optional with a penalty for closing without it;
- authored per Ticket as a mandatory or optional requirement.

<a id="doc-002"></a>
### DOC-002 — Documentable elements

**Status:** Candidate

**Depends on:** `OBS-001`

Which authoritative elements may be documented?

- actions and their targets;
- Tools, Tests, Repairs, Commands, and Verification procedures used;
- Evidence and results;
- Hypotheses and conclusions;
- Isolation events;
- replaced parts;
- failed and unnecessary attempts.

Documentation should project authoritative records rather than allow rule-significant free-text claims.

<a id="doc-003"></a>
### DOC-003 — Documentation visibility transition

**Status:** Candidate

**Depends on:** `OBS-001`, `DOC-002`

**Pressures:** Frozen Evidence visibility defaults

What visibility transition does Documentation perform?

Possible outcomes include:

- promote an element to `PUBLIC_MATCH`;
- promote it to `TEAM` in cooperative play;
- preserve the private record while creating a public projection;
- reveal an action but not its result;
- reveal both the action and its result.

<a id="doc-004"></a>
### DOC-004 — Documentation invocation

**Status:** Candidate

**Depends on:** `DOC-001`, `DOC-003`

How is Documentation invoked?

- automatic end-of-turn system step;
- manual interface action;
- normal Action;
- turn-ending action;
- part of Ticket closure;
- playable card effect;
- a basic system action enhanced by specialized cards.

The basic ability to document should be decided separately from cards that improve it.

<a id="doc-005"></a>
### DOC-005 — Manual Documentation selection scope

**Status:** Candidate

**Depends on:** `DOC-002`, `DOC-004`

If Documentation is manual, may a Player publish:

- all undocumented elements;
- all undocumented actions;
- all undocumented Evidence;
- selected individual elements;
- every element since the previous Documentation event?

Selective disclosure may create a deliberate competitive information cost.

<a id="doc-006"></a>
### DOC-006 — Documentation timing and closed Tickets

**Status:** Candidate

**Depends on:** `DOC-001`, `DOC-004`, `CROSS-001`

When may a Ticket be documented?

- throughout investigation;
- only at the end of a turn;
- during closure;
- after successful Verification;
- after the Ticket has closed;
- only while the Ticket remains active.

This determines when a closed Ticket becomes an immutable historical record.

<a id="doc-007"></a>
### DOC-007 — Documentation economy

**Status:** Candidate

**Depends on:** `DOC-001`, `DOC-004`, `CROSS-002`

Choose the primary benefit or cost channel before selecting exact values:

- draw new cards;
- recover documented cards from discard;
- gain another resource;
- regain spent Actions;
- receive Service Points;
- preserve eligibility for Ticket or Root Cause rewards;
- avoid a non-Documentation penalty.

<a id="doc-008"></a>
### DOC-008 — Worklog chronology and repeat publication

**Status:** Candidate

**Depends on:** `DOC-002`, `DOC-005`, `TST-002`

Decide whether:

- the Worklog always uses authoritative event order;
- later publication inserts an older event at its original sequence position;
- one event can be documented more than once;
- repeated executions of the same Test are separate documentable events;
- published records become immutable.

## Cross-stage decisions

<a id="cross-001"></a>
### CROSS-001 — Complete Ticket-closure transaction

**Status:** Candidate

**Depends on:** `DOC-001`, `DOC-006`

**Pressures:** Frozen post-resolution replenishment timing

What happens within the complete Ticket-closure resolution?

- end the active Player's turn;
- award Service Points;
- draw cards or grant Search/Refresh Tokens;
- permit one final Documentation action;
- discard, preserve, or archive undocumented elements;
- reconcile the active Ticket queue after all closure effects finish.

The frozen timing remains: replenishment occurs after the completed resolution. This decision defines what belongs to that resolution.

<a id="cross-002"></a>
### CROSS-002 — Unified card-replenishment economy

**Status:** Candidate

**Blocks:** `DOC-007` and exact draw/recovery values

Balance one combined economy across:

- normal turn draws;
- card-native draw effects;
- Documentation draw or recovery;
- Ticket-closure rewards;
- Search Tokens;
- Deck Refresh Tokens;
- discard reshuffling;
- exhaustion.

This is more fundamental than deciding whether an individual Test card draws a card.

<a id="cross-003"></a>
### CROSS-003 — Competitive and cooperative Documentation

**Status:** Candidate

**Depends on:** `OBS-001`, `DOC-003`, `DOC-007`

**Pressures:** Frozen cooperative team-visible Evidence default

Determine how Documentation's information cost and reward differ by collaboration mode. Competitive publication may help opponents; cooperative Evidence is already team-visible by default. Public Documentation may still matter for scoring, spectators, final review, and persistent history.

## Pruned candidate decisions

These ideas remain recorded but are not independent questions yet.

| Pruned idea | Parent decision | Reason |
| --- | --- | --- |
| Documentation automatically occurs at turn end. | `DOC-004` | One invocation option. |
| Documentation is a manual button. | `DOC-004` | One invocation option. |
| Documentation is a card resource. | `DOC-004` | Basic action and card enhancements must be separated first. |
| Documenting always ends the turn. | `DOC-004` | One timing/cost option. |
| Document all actions, all Evidence, or selected elements. | `DOC-005` | Selection alternatives under one question. |
| Documenting an Isolation draws a card. | `DOC-007`, `ISO-004` | Reward depends on both Documentation and Root Cause economies. |
| Every documented element grants a bonus. | `DOC-007` | Reward shape and magnitude follow the primary economy. |
| Live Documentation grants a larger bonus than batch Documentation. | `DOC-006`, `DOC-007` | Depends on permitted timing and reward channel. |
| Documentation returns the used card from discard. | `DOC-007`, `CROSS-002` | Recovery cannot be balanced independently. |
| Documentation draws a replacement card. | `DOC-007`, `CROSS-002` | Draw cannot be balanced independently. |
| Tests independently draw cards. | `CROSS-002` | Individual draw effects follow the overall replenishment budget. |
| A repeated Test draws but cannot be documented again. | `TST-002`, `DOC-008`, `CROSS-002` | Mixes event identity, publication, and economy. |
| A Player chooses between documenting Isolation and personally closing the Ticket. | `DOC-004`, `DOC-006`, `CROSS-001` | Potential emergent strategy rather than an independent rule. |
| Closing without Documentation weakens the next hand. | `DOC-001`, `DOC-007`, `CROSS-002` | Potential balance consequence. |
| Documentation is a heavy fraction of the Ticket reward. | `DOC-001`, `DOC-007` | Magnitude follows requirement and reward-channel decisions. |
| Late publication automatically reorders the Worklog. | `DOC-008` | Chronology rule, likely derived from authoritative event order. |
| Documentation after closure is impossible. | `DOC-006` | One timing option. |
| Documentation occurs as part of closure. | `DOC-001`, `DOC-006` | One requirement/timing combination. |
| Closing a Ticket ends the turn. | `CROSS-001` | One closure-transaction option. |
| Closing a Ticket draws cards. | `CROSS-001`, `CROSS-002` | Closure and replenishment must be resolved together. |

## Candidate-review procedure

For each candidate:

1. Confirm that its parent decisions cannot determine it automatically.
2. Identify frozen rules, unfrozen questions, and implementation artifacts it pressures.
3. Prune derivative options beneath the controlling candidate.
4. Accept the fundamental question into `UNFROZEN_RULES.md` without changing its ID, or record why it remains a candidate.
5. Update `DECISION_INDEX.md` and `UNSYNCHRONIZED_DECISIONS.md` when its status changes.
