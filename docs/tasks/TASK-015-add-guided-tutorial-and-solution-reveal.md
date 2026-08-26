# TASK-015-HIGH: Add guided tutorials and the solo solution-reveal experience

## Status

**Approved scope — queued after TASK-023 and TASK-024.** PT-007 A and the prerequisite PT-005 A reveal behavior were approved by the project owner on 2026-08-24. TASK-013, TASK-014, TASK-016, and corrective TASK-018 through TASK-021 are complete. TASK-023 first restores Ticket-state legibility; TASK-024 then establishes the reusable technical descriptions, notes, and mechanic/learning separation that tutorial copy must consume rather than duplicate.

## Approved authority

PT-007 A requires two engine-driven tutorials: a fundamentals path and a failed-Verify/recovery path. Both use pinned versions/seeds and real engine/Builder legal intents; pause at semantic checkpoints; highlight and announce exact controls; support replay, keyboard, touch, screen readers, and reduced motion; and never fabricate tutorial-only authority. PT-005 A supplies the solo one-Ticket Give Up/reveal behavior rendered by this task.

## Objective

Make the troubleshooting loop learnable and auditable through one or more deterministic, replayable tutorials plus the approved solo Give Up / Show Answer experience. A Player should understand why an Isolation is or is not currently supportable and be able to confirm after giving up that the Ticket had a valid authored solution.

Tutorials are not substitutes for tests. They demonstrate the real engine path; behavior-focused engine/Builder/browser tests prove it.

## Required reading

Read completely before editing:

- `AGENTS.md`, root `README.md`, this task, `docs/tasks/INDEX.md`, completed TASK-012 through TASK-014 plus TASK-016 and TASK-018 through TASK-021, then prerequisite TASK-023 and TASK-024;
- the approved rules/profile, Ticket/Card/Knowledge/Event/projection schemas, and solution-reveal contract;
- the final playable catalog, coverage matrix, seeded Ticket provenance, and automated-game paths;
- all solo Play pages/session/Worker/motion/accessibility modules and TASK-010 visual references;
- current browser tests, reduced-motion/touch/keyboard coverage, and visual-QA record; and
- candidate gameplay examples only for instructional sequencing, never authority.

## Tutorial architecture

- Add a clearly labeled **Tutorial** entry from Play Home and a replay path from Help/Settings or results.
- Use pinned content versions, seeds, decks/resources, and actual engine/Builder legal intents. Do not mock success, mutate Match state from overlay code, or advance by CSS selector alone.
- Model each tutorial as versioned semantic checkpoints: expected projection/event predicate, instructional copy, allowed intent set, focus/highlight target, optional demonstration, recovery/repeat text, and completion condition.
- Overlay state may constrain which already-legal intent the learner can choose, but cannot make an illegal action legal or inspect hidden truth.
- If content/rules versions do not match, fail closed with a useful compatibility message rather than running stale instructions.
- Tutorial completion is local cosmetic/progress data and must be versioned/exportable without affecting cards, score, matchmaking, or gameplay legality.

## What the fundamentals tutorial must explain

In the approved order and terminology:

1. **Observe:** Symptoms, public Candidates, machine-state summary, Ticket selection, queue, Evidence, and immutable Worklog are different information surfaces.
2. **Turn resources:** opening availability, two Actions, Card/bench costs, hand/response deck, Search/Refresh if retained, discard, and Pass.
3. **Hypothesis:** a private/team working belief is not a guess submission and receives no truth feedback.
4. **Diagnostics:** how to select the highlighted Test/Command, verify that the displayed Ticket is its target, spend Actions, follow its persistent result, understand completed/current-revision availability, and read `SUPPORT`, `CONTRADICT`, `RULE_OUT`, `CONFIRM`, and `INCONCLUSIVE` under their approved normative meanings. Explain that clean, negative, unrelated, and inconclusive findings are still recorded Evidence; a result with no candidate effect is not missing feedback. Bench diagnostics never silently redirect to another Ticket; any deliberately demonstrated cross-Ticket result must use the separately explicit private response-Card contract.
5. **Candidate management:** how the approved elimination/notebook model works, whether it costs an Action, what Evidence is cited, and why a remaining candidate is not automatically revealed as true.
6. **Isolation:** direct observation, definitive diagnostic, corroborated support, elimination, and recovery-derived routes where approved; how citations are chosen; why candidate-specific `CONFIRM` is decisive for an active actionable Fault; why a confirmed non-actionable condition does not open Repair; how multiple Players may contribute Evidence but only one accepted event owns a Fault/stage; why an unsupported attempt remains generic; and why the current UI may withhold or disable a legal-looking action.
7. **Repair:** machine-state change, Card disposition, accepted-Isolation or approved speculative threshold, and why Repair does not prove success.
8. **Verify:** named requirements, current passes, failure/inconclusive return to Diagnosis, and preserved history.
9. **Documentation and closure:** Document Live versus final closure bundle, recovery behavior, Worklog enrichment, score settlement, and Ticket archive.
10. **Help and trust:** how to reopen explanations and how the approved Give Up / Show Answer path affects the Ticket, Match, score, and statistics.

At each checkpoint, highlight the exact Card/control and its target, move focus safely, announce the instruction, and pause advancement until the expected semantic event occurs. Modal explanations between steps are allowed because this local untimed profile has no running SLA; do not generalize modal pause behavior to future timed/server matches.

## Additional tutorial scope

Implement PT-007 exactly. If the approved scope includes the recovery tutorial, it must demonstrate:

- a plausible initial path;
- accepted Isolation and Repair;
- failed or inconclusive Verify;
- preserved Evidence/Worklog/machine history;
- return to Diagnosis with changed candidate/evidence context;
- a second valid diagnosis/Isolation/Repair/Verify path; and
- final Documentation, closure, and result attribution.

Every tutorial must support restart, back/re-explain where safe, skip/exit with confirmation, keyboard-only, touch-only, click-only, screen-reader announcements, and reduced motion. Highlighting cannot be color-, glow-, pointer-, or motion-only.

## Why-can't-I-isolate guidance

Before revealing truth, provide player-safe guidance derived only from the authenticated projection:

- whether the Ticket is in a phase where Isolation is accepted;
- whether the approved route needs selected/cited Evidence, valid eliminations, or another public prerequisite;
- the public meaning of each cited disposition and whether the selected Evidence is direct `CONFIRM`, accumulated `SUPPORT`, counterevidence, or inconclusive—without evaluating hidden truth;
- which currently authorized Evidence the Player has selected;
- that rejection intentionally does not distinguish a wrong candidate from insufficient Evidence; and
- how to inspect Evidence, run another relevant diagnostic, revise the notebook, or use Give Up.

Do not expose a candidate-specific secret requirement, hidden Fault, eligible hidden outcome ID, or “correct answer” hint before the authoritative reveal transition.

## Give Up / Show Answer presentation

Render the PT-005 outcome produced by TASK-013.

- Use explicit destructive wording and confirmation that states the effect on the Ticket/Match, score, pending contributions, statistics, and continued play.
- Submit one ordinary identifier-based intent through the Worker; prevent duplicate submission.
- Reveal only after the authoritative transition event/projection arrives.
- Present the hidden Fault/causal chain, observed Symptoms, original candidate derivation, required positive/elimination Evidence, which diagnostics produce it, eligible Repair, Verify conditions, and closure path in a readable sequence.
- Compare the Player's actual Worklog/Evidence with the required path without rewriting history or claiming that optional/redundant work was illegal.
- Identify missing playable content or inconsistent authored requirements as a content error, not a Player failure, and preserve a diagnostic code suitable for tests/reporting.
- Never make solution truth available to ordinary DOM, analytics, backup, profile, or future active Tickets before reveal authorization.

## Validation

Add Node and browser tests proving:

- checkpoint definitions are versioned, schema-valid, and reference real content/intents;
- each tutorial completes through the real Worker/engine and reproduces its pinned semantic events;
- wrong actions remain unavailable or receive instructional recovery without state fabrication;
- refresh/reload/version mismatch, exit/restart, focus restoration, scroll continuity, and modal behavior are safe;
- click, keyboard, touch, reduced-motion, and live-announcement paths reach completion;
- every paid tutorial action exposes its target, payment, and persistent result, including a diagnostic with no candidate effect and, where the approved tutorial scope permits one, an intentionally demonstrated **response-Card** cross-Ticket result that does not weaken selected-Ticket Bench behavior;
- pre-reveal help contains no hidden truth;
- Give Up confirmation, one-intent submission, lifecycle/stat effects, post-transition reveal, and no-resume boundary match the approved engine contract;
- every revealed required path independently passes the Builder solvability oracle; and
- tutorial/reveal strings and highlights survive responsive desktop/mobile layouts without obscuring the targeted control.

Run the full repository suite, pinned tutorial replays, relevant automated-game verification, staged asset checks, the complete browser matrix, visual captures for each tutorial/reveal state, and `git diff --check`.

## Allowed paths after prerequisites

- versioned tutorial schemas/content/examples
- solo Home/Help/Settings/game/result/tutorial modules and styles
- Worker/session adapter for already-approved intents/projections
- local client data only for versioned tutorial-completion cosmetics
- approved asset placeholders/icons, not the full TASK-011 illustration set
- staging scripts/manifests generated from canonical changes
- tests and visual-QA artifacts
- task/index/user documentation

Do not change gameplay semantics, create alternate tutorial-only engine rules, add an SLA, expose multiplayer truth, award gameplay rewards for tutorial completion, or duplicate Ticket answers in hand-maintained UI files.

## Completion boundary

Complete only when a new Player can follow the approved tutorial scope through real legal intents, understand every major information/action boundary, recover from the covered failure path, obtain player-safe “why can't I isolate?” guidance, deliberately trigger the approved Give Up transition, and inspect a rules-faithful solution generated from authoritative Ticket data—with accessibility, versioning, tests, and no hidden-information leak.
