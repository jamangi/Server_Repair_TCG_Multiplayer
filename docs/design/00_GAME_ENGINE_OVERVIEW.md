# Server Repair Card Game — Core Engine Overview

## Authority and purpose

This document summarizes the engine direction. [`decisions/FROZEN_RULES.md`](decisions/FROZEN_RULES.md) is authoritative where this overview is less detailed. [`decisions/UNFROZEN_RULES.md`](decisions/UNFROZEN_RULES.md) identifies rules that must not be selected implicitly through content, schemas, or implementation.

The game teaches a practical troubleshooting loop:

```text
Observe -> Diagnosis [Hypothesize <-> Test -> Isolate] -> Repair -> Verify -> Document
                        ^                                  |
                        `------ failed Verify -------------'
```

These labels are evidentiary functions, not seven departments, board lanes, or a permanently one-way state machine. Hypothesize and Test form the iterative heart of Diagnosis. Isolate is the accountable transition from possibilities to an actionable Fault. Repair changes machine state but does not prove the diagnosis. Failed Verify can return a Ticket to Diagnosis without erasing what already happened. Document preserves the attributable explanation throughout the work and at closure.

Players act as server-repair technicians. They may compete or cooperate, but they do not attack one another directly. The engine should remain simple enough that later sets based on A+, Network+, Linux+, Server+, Security+, cloud, electronics, or vendor-specific server topics can add content without replacing the fundamental rules.

---

## One configurable match system

Competitive and cooperative play use one configurable match system. There is no single universal ten-point or two-player game definition.

Important configuration includes:

- `termination_score` (`X`), where `-1` disables score termination;
- `starting_ticket_count` (`S`);
- `queue_minimum` (`Q`), where zero disables replenishment;
- ordered Player seats and collaboration mode;
- starting Service Points;
- optional turn and Player clocks; and
- starting and capped Search/Refresh resources.

A two-Player race to 10 Service Points remains a recommended preset, not a core rule. Exact causal-contribution classes, values, visibility, duplicate handling, Root Cause policy, and cooperative aggregation remain unresolved under [`SCORE-001`](decisions/UNFROZEN_RULES.md#score-001).

For finite matches with `Q = 0`, an empty active queue ends the match after the complete closure transaction. A cooperative team wins by closing the queue. In competitive play, the highest final Service Point total wins and equal highest totals are co-winners. Precedence involving other terminal conditions remains unfrozen.

---

## Shared Repair Queue

The match contains a shared queue of jointly actionable Repair Tickets unless an explicit effect creates a claim.

- Setup creates `S` active Tickets.
- When `Q > 0`, a completed resolution that leaves fewer than `Q` active Tickets replenishes the queue back to `Q` on the authoritative server.
- When `Q = 0`, closure does not replenish the queue.
- Ticket progress belongs to the Ticket, not to the most recent Player.
- An action must identify its exact legal Ticket, card instance or named basic action, and target. The engine never infers an unspecified “other Player.”

Initial Tickets may be fixed authored fixtures or may eventually come from an approved generation policy. The constraint-driven Ticket Builder, configuration schema, solver, and generator algorithm remain unresolved under [`GEN-001`](decisions/UNFROZEN_RULES.md#gen-001).

---

## Authored Ticket contract

Each Ticket provides a deliberately authored troubleshooting problem rather than asking the engine to improvise truth from generic Fault links at action time.

A Ticket exposes:

- visible intake symptoms and observations;
- a public authored candidate-Fault set;
- authored Isolation requirements;
- eligible Repair Procedures for actionable Faults;
- explicit Verification procedures and success conditions; and
- a structured closure requirement.

The authoritative server separately retains:

- the true Fault instances or causal chain;
- the candidate/outcome matrix for Tests and Commands;
- machine state and every machine-state revision; and
- hidden scoring metadata only after the unresolved scoring policy defines it.

Generated content, if later approved, must still be assembled from validated authored domain relationships and rule templates. This overview does not define a Ticket Builder.

---

## Knowledge State and machine state

The machine has one authoritative state. Each Player or cooperative team has only the Knowledge State produced by Evidence they are allowed to see.

- Tests and Commands produce Evidence and change Knowledge State.
- A diagnostic substitution is a Test; its temporary known-good resource reverts after comparison.
- Repairs create durable machine-state changes and Repair history.
- Documentation publishes authorized projections of existing structured records.

The client must never infer or receive hidden truth merely because a candidate is public. Competitive Evidence is private to its acting Player by default. Cooperative Evidence is team-visible by default. Explicit content may choose another authorized visibility.

---

## Troubleshooting functions

### Observe

Read authorized symptoms, server state, diagnostics, indicators, logs, environmental clues, and the public Worklog. Observation establishes the problem surface; it does not reveal the hidden answer.

### Diagnosis: Hypothesize and Test

A Player may revise a lightweight Hypothesis on their turn, selecting up to two unresolved public candidates. This costs no Action, scores nothing, and receives no truth-revealing response. It is private in competitive play and team-visible in cooperative play unless voluntarily documented.

Tests, Commands, Tools, and inspections gather Evidence. Every execution is a distinct immutable action/result pair. An authored result may `SUPPORT`, `CONTRADICT`, `RULE_OUT`, or `CONFIRM` a candidate or Fault instance, reveal another observation, or be `INCONCLUSIVE`.

A repeated Test may be useful after its target or relevant machine state changes. An identical same-target, same-state execution with no eligible new outcome is rejected before payment.

### Isolate

**Commit Isolation** is a universal one-Action basic action. The Player selects one public candidate and cites Evidence events that satisfy the Ticket's authored Isolation requirement.

- Acceptance requires a true actionable Fault and sufficient cited Evidence.
- Accepted Isolation becomes public, Ticket-owned progress and records contributor, citations, actionable/deepest classification, and time.
- A false or insufficient commitment spends the Action, changes no machine state, and returns only `ISOLATION_NOT_SUPPORTED`.
- Rejection removes that Player's Root Cause reward eligibility for the Ticket, although whether Root Cause ever scores remains unresolved.

### Repair

Ordinary Repair is legal only after accepted Isolation and only when an eligible Repair Procedure targets the isolated Fault. Unsupported or speculative Repair is rejected before payment; the core game has no parts-cannon exception.

A legal Repair consumes its printed Actions and one-shot card where applicable, changes machine state, and appends Repair history. It does not prove Verify or Documentation complete.

### Verify

Each Ticket defines explicit Verification procedures and success conditions. Every Verify creates a distinct immutable result and consumes its printed Actions.

All required conditions need current passes after the latest relevant Repair. A failed or inconclusive Verify:

- becomes Evidence and remains in history;
- preserves earlier Evidence, Worklog events, accepted Isolation, and machine changes;
- invalidates passes made stale by the changed path; and
- returns the Ticket to Diagnosis.

Players resume Hypothesize and Test. A new accepted Isolation gates any further Repair. A later successful Verify never erases the earlier failure.

### Document

Documentation is incremental rather than end-only.

**Document Live** is a universal one-Action basic action. It publishes one undocumented authoritative card action and eligible result as a `PUBLIC_MATCH` projection, enriches the original Worklog placeholder in place, records a later publication event, and returns the exact source card from discard to its owner once. The source record remains intact; replaying the recovered card creates a new action and Evidence event.

After all current Verify requirements pass, the Ticket still requires one structured bundle containing the accepted Isolation, decisive cited Evidence, all Repairs in the accepted path, every failed Verify in that path, and all current passing Verify results.

Publishing that bundle:

- costs zero Actions;
- recovers no card;
- opens immediately after successful Verify, before automatic end-turn even if Verify spent the last Action;
- remains jointly available later if the immediate window closes;
- gives no protected closure claim;
- attributes closure to the Player and team statistically;
- awards no Service Points for closure itself; and
- completes the Ticket exactly once.

---

## Worklog, visibility, and chronology

The public progress record of a Ticket is its **Worklog**. Evidence and events use four authorization categories:

- `SERVER_ONLY`
- `PRIVATE_PLAYER`
- `TEAM`
- `PUBLIC_MATCH`

Every accepted paid action immediately creates a public Worklog placeholder in authoritative event order. It identifies sequence, actor, Ticket, exact card or named basic action, public target surface, Action cost, and action time. Concealed targets and detailed results retain their authorized visibility.

Later Documentation enriches the original placeholder rather than moving it. A publication event at the current end links back to that action and records publication time and publisher. Successful and failed Verify summaries are immediately public because they change Ticket eligibility. Closed records are immutable.

Spectators, reconnecting clients, computer Players, accessibility announcements, and presentation effects receive only the same player-safe projections allowed for their role.

---

## First-version deck, round, and turn envelope

The first-version card-game envelope is frozen:

- exactly 30 cards per legal deck;
- no more than three copies of one card ID;
- five cards drawn for the opening hand;
- one turn for each active Player per round, in fixed seat order;
- one card drawn at the start of every turn when the draw deck is nonempty;
- two Actions received at the start of every turn;
- no rules-level maximum hand size;
- card costs of 0, 1, or 2 Actions;
- at most one copy of the same 0-Action card name played per turn unless explicit text overrides it; and
- no loss, concession, or exhaustion merely because the draw deck is empty.

The first starting seat remains unresolved. One-shot cards enter discard after resolution. Installed or persistent playable cards remain in their defined match zone until removed by an effect. “Installed” here is a card zone, not account Equipment.

Reviewing authorized information, revising a Hypothesis, Commit Isolation, Document Live, publishing an eligible closure bundle, passing, Search, and Deck Refresh are basic system actions; they do not require a card to be drawn.

---

## Search and Deck Refresh

Search Tokens and Deck Refresh Tokens are public utility resources, not hand cards.

- **Search:** spend one Search Token and one Action; choose one card from the remaining draw deck, add it to hand, then shuffle the remaining draw deck.
- **Deck Refresh:** spend one Refresh Token and one Action; combine discard and the remaining draw deck, then shuffle them into a new draw deck. Hand and Installed playable cards do not move.
- After closure, each active Player gains the configured Search grant up to its cap and one Refresh Token up to its cap.
- A zero Refresh cap disables both starting and earned Refresh Tokens.

The standard first-version preset starts each Player at three Search Tokens and one Refresh Token, caps them at five and one, and grants one Search Token per Ticket closure.

---

## Closure transaction and scoring boundary

A valid closure resolves atomically in this order:

1. validate the complete authored Isolation, Repair, and Verify path;
2. enrich and lock Worklog records;
3. create score events required by the eventual scoring policy;
4. archive and remove the Ticket;
5. grant configured Search and Refresh resources;
6. reconcile the queue after every closure effect;
7. evaluate terminal conditions against the complete transaction; and
8. end the closer's turn.

Closure grants no separate draw and no Service Point reward. Service Points may come only from the unresolved causal-contribution policy and settle, if eligible, as part of closure. Content and implementation must not assume exact contribution classes, weights, duplicate suppression, visibility, Root Cause value, handicap policy, or cooperative aggregation before `SCORE-001` is resolved.

---

## Fault chains

The engine supports causal Fault chains from the first version, even if most initial Tickets use one actionable Fault.

Example:

```text
Dust-clogged heatsink
    -> CPU overheating
        -> thermal throttling
            -> unexpected shutdown under load
```

Fault-to-Fault `causes` relationships form a directed acyclic graph. A Fault may cause another Fault, one or more Symptoms, or changes to machine state. A downstream state may therefore be both an effect of a deeper Fault and a cause of another state or Symptom.

Content balance may begin with mostly single-Fault Tickets and a smaller number of short chains. Exact generation and campaign replay policy remains under `GEN-001`.

---

## Account boundary

The game has no account-owned or pre-match **Equipment** system: no Equipment slots, inventory, Store category, effects, or starting Installed Equipment objects. Technical Tools and server hardware remain part of the domain and card game.

Qualifications are non-mechanical honor badges only. They may recognize campaign accomplishments or standing, but they never change Actions, decks, cards, Tests, Isolation, Repair, Verify, Documentation, Ticket or story access, matchmaking, or any other gameplay rule.

---

## Core design principle

The game should teach causal troubleshooting rather than trivia recall or indiscriminate replacement. A good card effect reflects what the real tool, command, component, procedure, or concept actually helps a technician accomplish:

- `lsblk` reveals storage-device information.
- POST codes narrow startup Faults.
- a multimeter measures permitted electrical states.
- a known-good DIMM supports a temporary diagnostic comparison.
- a burn-in procedure verifies stability after Repair.
- Documentation preserves attributable reasoning for teammates, auditors, later returns, and institutional learning.

The closer gameplay semantics track real troubleshooting semantics, the more the Player learns by becoming better at the game.
