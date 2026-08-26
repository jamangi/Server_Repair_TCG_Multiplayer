# TASK-021-HIGH: Fix selected-Ticket diagnostic target continuity

## Status

**Owner-directed defect correction — active.** A post-TASK-020 playtest showed a successfully run Relevant diagnostic remaining selected and the Legal Action panel immediately replacing its completed selected-Ticket action with `Alternate target only` plus one confirmation button for each other active Ticket. Correct this before TASK-015 teaches diagnostic targeting. PT-008 B preserves the current rejection-before-payment rule and requires a clear completed/current-revision explanation.

## Objective

Make the Diagnostic Bench consistently operate in the context of the displayed Ticket. Selecting a Bench Test or Command must project and present only that Ticket's diagnostic action. After the action resolves, keep its result and selected-Ticket context clear; do not silently promote remaining legal intents for other Tickets into the Legal Action panel.

Preserve the separately intentional TASK-012 behavior for private response Cards that genuinely have only alternate legal Ticket targets. This task fixes an over-broad reuse of that fallback; it does not remove cross-Ticket response-Card play or change engine legality.

## Required reading

Read completely before editing:

- `AGENTS.md`, root `README.md`, this task, `docs/tasks/INDEX.md`, completed TASK-012 through TASK-014 and TASK-018 through TASK-020, and queued TASK-015;
- `docs/design/decisions/FROZEN_RULES.md` and the approved Relevant/Global Bench decisions in `docs/design/decisions/APPROVALS.md`;
- [`task-021-post-diagnostic-alternate-target-defect.png`](../ui-plan/ui-reference_images/task-021-post-diagnostic-alternate-target-defect.png) and [`task-021-ticket-queue-context.png`](../ui-plan/ui-reference_images/task-021-ticket-queue-context.png);
- canonical and staged engine projection/intent derivation, TASK-014 diagnostic outcome coverage, game session/result continuity, game-page Card/diagnostic selection, drag/drop, and Bench filtering; and
- TASK-012 cross-Ticket tests plus current TASK-013/TASK-014/TASK-019/TASK-020 diagnostic, browser, visual, accessibility, and replay tests.

## Verified cause and meaning of the reported state

The screenshot is consistent with this exact sequence:

1. `Firmware Boot Device Inventory` is Relevant and initially runnable on displayed Ticket `Booting the Wrong Device`.
2. The Player confirms it and the engine resolves the selected-Ticket intent. The diagnostic remains in the persistent Bench and remains selected.
3. The engine correctly suppresses a repeat of the same authored outcome on the same machine revision, so that Ticket no longer has a legal intent for this diagnostic.
4. The private projection still contains legal intents for the same persistent diagnostic on `Network Path Down` and `Redundancy Path Unavailable`.
5. `game-page.mjs` sees no remaining intent for the displayed Ticket and falls back to **all** remaining intents for the selected Card. It therefore renders the generic TASK-012 `Alternate target only` warning and two confirmation buttons.

The yellow surface is a pre-submission scope warning, not an engine rejection, and the two buttons are real projected actions for the other Tickets. The first click likely succeeded on the displayed Ticket; the confusing state appears after its rerender. Confirm this with a deterministic browser fixture and raw player-safe projections before changing behavior.

TASK-012 intentionally required this fallback for a held response Card that cannot target the displayed Ticket. The renderer later applied one shared `selectedCard` fallback to both private hand Cards and persistent Bench diagnostics. That generalization is the defect.

Relevant is still an advisory public-relationship classification, not a promise that a diagnostic is presently runnable. A diagnostic may remain Relevant after it has already been run for the current machine revision. The UI must communicate relevance and current selected-Ticket availability as separate concepts without redirecting the Player.

## Selected-Ticket Bench contract

For a selected Bench diagnostic in Relevant or Global:

- Scope runnable intents to `session.selectedTicketId` before rendering Legal Action. Do not fall back to intents for other Tickets.
- An `ACTIVE_TICKET` diagnostic presents at most one confirmation action, and its visible target must equal the displayed Ticket.
- If a diagnostic has multiple legal component targets within the displayed Ticket, provide one explicit player-safe target chooser or separately labeled choices. Never represent component choices as duplicate indistinguishable buttons or use another Ticket as an implicit default.
- `Alternate target only`, other Ticket names, and cross-Ticket confirmation buttons must never appear for a Bench diagnostic merely because the displayed Ticket has no remaining intent.
- To run the same persistent diagnostic on a different Ticket, the Player first selects that Ticket from the queue. The Bench and Legal Action panel then recompute against the newly displayed Ticket.
- Clicking, keyboard activation, touch, pointer drag, and drop must obey the same contract. A Bench diagnostic may not be dropped onto an unselected Ticket to bypass selected-Ticket confirmation. Private response-Card targeting retains its existing equivalent-input behavior.

## Post-resolution and unavailable states

- After an accepted diagnostic, keep the displayed Ticket selected, reveal/highlight its persistent result, and preserve Evidence/Worklog continuity as TASK-012 requires.
- Retaining the diagnostic's visual selection is allowed, but its action area must change to a calm selected-Ticket status such as `Completed for this machine revision — no Action spent` or a player-safe generic `Not currently runnable on this Ticket — no Action spent`; it must not offer another Ticket automatically.
- Do not claim a precise reason from DOM inference. Use already authorized result/history data, or add the smallest player-safe projection discriminator if precise `completed`, `insufficient Actions`, or `unavailable` messaging cannot otherwise be stated safely. Any projection addition must be schema-versioned, deterministic, and must not expose authored outcome IDs, hidden truth, or unexecuted results.
- A Relevant-but-completed diagnostic remains available for Inspect and may stay in Relevant results. Its tile should distinguish `Relevant` from `Runnable now` and may expose a completed/current-revision state.
- Global `Runnable` filtering and any `data-runnable`/disabled styling must be evaluated for the selected Ticket, not for whether the diagnostic has an intent anywhere in the queue.
- Changing Ticket, machine revision, Action resources, or turn state recomputes availability without stale labels or selection leakage.

## Private response-Card preservation

- Keep TASK-012's explicit alternate-target warning and persistent cross-Ticket result route for held Repair/Verify Cards when applicable.
- Separate Bench-diagnostic and private-response selection policies in one named helper or typed presentation model. Do not scatter `selectedIsDiagnostic` conditionals through markup and event handlers.
- Existing response-Card tests must continue proving that the Player sees the alternate target before submission and lands on or can recover the authoritative result afterward.
- Update player-facing wording so `Card` is not used ambiguously where the selected object is specifically a persistent Bench diagnostic.

## Reproduction-first implementation discipline

Before editing, add or capture a deterministic three-Ticket fixture that proves:

- the diagnostic has a legal intent for displayed Ticket A before the run;
- the accepted run creates its result on Ticket A and spends exactly the projected cost;
- the Ticket-A intent disappears for the same machine revision afterward; and
- intents for Tickets B and C remain in the authoritative private projection.

Then fix only how the Viewer scopes and presents Bench-diagnostic choices. If Ticket A lacks an initial intent despite validated TASK-014 outcome coverage, stop and report that separate Builder/content defect rather than manufacturing a client action or hiding it with copy.

## Validation

Add Node and browser regressions proving:

- before submission, a Relevant Bench diagnostic shows exactly one selected-Ticket confirmation even when the projection contains intents for three Tickets;
- the submitted intent ID and `ticket_instance_id` belong to the displayed Ticket;
- after the accepted run, its Evidence/result remains visible for that Ticket and no `Alternate target only`, other Ticket name, or cross-Ticket diagnostic button appears;
- no second action or resource is spent by the post-resolution presentation transition;
- selecting Ticket B deliberately makes the same diagnostic target Ticket B when its projected intent is legal;
- a completed/current-revision diagnostic remains inspectable, cannot be resubmitted on that Ticket, and clearly says that no Action was spent;
- Relevant classification and selected-Ticket runnability are tested independently;
- Global `Runnable` includes only diagnostics runnable on the displayed Ticket;
- zero Actions, repeat-zero-action restrictions, changed machine revision, and unavailable outcomes fail closed without client-side truth inference;
- component-target diagnostics, keyboard, touch, click, drag/drop, focus, result reveal, responsive desktop/mobile, reduced motion, and rerender continuity obey the same scope; and
- the existing held response-Card alternate-target and cross-Ticket result tests still pass unchanged in meaning.

Run canonical/staged parity checks, the full Node suite, automated-game report verification, the complete browser matrix, focused three-Ticket visual captures, accessibility/performance checks, and `git diff --check`.

## Allowed paths

- canonical engine projection and legal-intent presentation helpers, plus corresponding schemas only if a minimal player-safe availability discriminator is required
- staged generated Play modules rebuilt from canonical sources; never hand-edit them
- Viewer game session, game page, Bench/hand presentation helpers, motion/continuity, and affected Play CSS
- Node/browser/visual/accessibility tests and deterministic fixtures
- `docs/ui-plan/**`
- this task, `docs/tasks/INDEX.md`, TASK-015 dependency/tutorial wording, and directly affected user documentation

Do not change diagnostic relevance derivation, authored outcomes, Ticket generation, action costs, once-per-machine-revision rules, Card zones/disposition, engine target legality, hidden-information policy, response-Card cross-Ticket legality, or multiplayer semantics.

## Completion boundary

Complete only when a Bench diagnostic always acts in the displayed Ticket's context; a successful run leaves an unmistakable selected-Ticket result instead of goading the Player toward other Tickets; unavailable/completed diagnostics fail closed with player-safe status; another Ticket becomes a diagnostic target only after the Player deliberately selects it; TASK-012 response-Card alternate targeting remains intact; deterministic tests reproduce the original cause and prevent recurrence; and authoritative intents/events remain unchanged.
