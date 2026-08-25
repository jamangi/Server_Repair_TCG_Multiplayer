# TASK-019 human visual-QA checklist

Reviewed on 2026-08-25 against the TASK-016 post-pass defect captures, approved Card/response-hand references, and the deterministic after-captures in `tests/visual/task-019/`.

## Diagnostic Bench

- [x] Relevant and Global use the same tile anatomy and event path; only density and available height differ.
- [x] Every visible tile retains the complete `TEST` or `COMMAND` family label, action cost, a bounded landscape illustration, and a complete title wrapping to at most two lines.
- [x] Art keeps its intrinsic proportions through deliberate cover cropping. The TASK-016 narrow vertical illustration strip is gone.
- [x] Shelf tiles do not contain clipped rules prose, subsystem detail, or hover-only relevance information.
- [x] Every tile has a persistent keyboard/touch/click Inspect route.
- [x] Relevant Inspect shows `Why relevant?`, the player-safe public path, and the incomplete-graph disclaimer. Global/non-marked Inspect explains catalog availability without declaring the diagnostic useless or illegal.

## Adaptive response hand

- [x] Collapsed groups show full `REPAIR`/`VERIFY` family labels, complete titles, cost, quantity, and Inspect. No in-hand `DISCARD` affordance is rendered.
- [x] The header shows total Cards, Deck, Discard, range, and page. Five groups are shown per desktop page, and paging appears only when required.
- [x] Duplicate definitions are visually stacked while each underlying instance remains individually selectable; the chosen copy is announced.
- [x] The expanded hand is an opaque center-work-surface overlay below the Ticket and left of the action rail. It exposes readable family, cost, art, complete title, concise description, and Inspect.
- [x] Expanded selection does not clip a Card header. Opening a real Inspect dialog leaves the hand expanded; dialog Escape belongs to the dialog. Hand Escape applies only with focus inside the non-modal hand and restores focus to Collapse/Expand.

## Height, reflow, and motion

- [x] Relevant 1920×1080 and 1920×960 use the saved shelf height for the hand and full-height Evidence/Worklog rather than leaving the TASK-016 lower dead band.
- [x] Global 1920×1080 and 1920×960 retain the complete selected-Ticket summary, full-Ticket route, hand top edge, and action rail.
- [x] Desktop checks pass at 1366×768, 1920×1080, 1920×960, and 2560×1300. Required child anatomy intersects its owning tile/card and no document-width overflow appears.
- [x] Tablet uses a readable queue → Ticket → Evidence → Bench → hand → Legal Action → Basic Actions flow with three-column tiles/cards.
- [x] Phone reduces to one-column tiles/cards so family, cost, art, title, and Inspect remain readable without horizontal clipping.
- [x] The simulated 200% root text-size composition preserves Ticket and hand controls; reduced-motion produces the same settled geometry with nonessential transitions disabled.

## Evidence set

- `relevant-1920x1080-chromium-desktop.png` and `relevant-1920x960-chromium-desktop.png`
- `global-1920x1080-chromium-desktop.png` and `global-1920x960-chromium-desktop.png`
- `expanded-global-1920x1080-chromium-desktop.png`
- Relevant/Global `1024x768-chromium-tablet.png`
- Relevant/Global `390x844-chromium-mobile.png`
- Relevant/Global `390x844-chromium-reduced-motion.png`

Result: pass. The accepted after-captures repair the clipped family/title, distorted art, hidden relevance explanation, unreadable hand identity, and unused-height defects visible in the TASK-016 post-pass images without changing gameplay authority.
