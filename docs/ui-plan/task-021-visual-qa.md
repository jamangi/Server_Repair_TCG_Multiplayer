# TASK-021 human visual-QA checklist

Reviewed on 2026-08-26 against the reported post-playtest defect captures and the deterministic TASK-021 before/after captures at 1920×1080.

## Selected-Ticket continuity

- [x] Before submission, the selected Relevant Bench diagnostic shows exactly one confirmation and its visible target is the displayed Ticket.
- [x] No `Alternate target only` warning, other Ticket name, or cross-Ticket diagnostic button appears even though the private projection contains legal intents for all three Tickets.
- [x] After the accepted run, the same Ticket remains selected and the diagnostic remains available for Inspect.
- [x] The action area changes to a calm completed/current-revision status and makes clear that the unavailable presentation transition did not spend another Action.
- [x] The persistent authoritative result remains visible with its one-Action payment and a route to the created Evidence.
- [x] Selecting another Ticket recomputes the Bench and presents that newly displayed Ticket as the diagnostic target when its intent remains legal.

## Relevance, availability, and interaction

- [x] `Relevant` and `Runnable now` are visibly separate: a Relevant completed diagnostic remains present but is labeled `Completed` rather than runnable.
- [x] Global Runnable filtering follows the selected Ticket, hiding the completed diagnostic on Ticket A and showing it on Ticket B.
- [x] Click, keyboard, touch, pointer drag, HTML drag, and drop cannot redirect a Bench diagnostic to an unselected Ticket.
- [x] Multiple component intents are rendered as separately labeled choices within the selected Ticket rather than duplicate-looking or cross-Ticket actions.
- [x] Held response Cards retain the explicit alternate-target warning and cross-Ticket result continuity established by TASK-012.

## Responsive and accessible presentation

- [x] Desktop, tablet, phone, and reduced-motion browser projects preserve selected-Ticket target, result, and focus continuity.
- [x] The calm status receives focus after the accepted diagnostic and remains keyboard reachable without becoming a resubmission control.
- [x] The status remains at least 44px tall on touch/reflow compositions, and the page has no horizontal document overflow.
- [x] The completed status, selected diagnostic, action result, Ticket queue, and selected Ticket remain visually distinguishable without relying on motion.

## Accepted captures

- `tests/visual/task-021/three-ticket-before-run-1920x1080.png`
- `tests/visual/task-021/three-ticket-completed-1920x1080.png`

Result: pass. The after state preserves the reported diagnostic and selected Ticket context, exposes the accepted result, and removes the misleading automatic promotion of the other two Tickets while leaving their authoritative intents available after deliberate Ticket selection.
