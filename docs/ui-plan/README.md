# Gameplay UI design references

This directory now contains two different generations of UI thinking:

- [`ui-defense.md`](./ui-defense.md) and [`ui-reference_images/`](./ui-reference_images/) define a proposed visual and interaction direction for the **gameplay surface itself**: the board, Repair Tickets, cards, Evidence, Worklog, player resources, and responsive behavior.
- [`wireframes/`](./wireframes/) contains older, low-fidelity structural studies for the **application shell around gameplay**: rooms, lobby, identity, social surfaces, store concepts, and loading. Those wireframes remain useful as historical layout studies, but they do not specify the match table and do not override current rules or TASK-010.

[`TODO.md`](./TODO.md) remains a provisional collection of broader product notes. The gameplay references here narrow only the match-facing visual direction; they do not freeze the complete client architecture.

## Status and authority

These artifacts are original design references, not executable UI, canonical content, or rules.

- Frozen gameplay authority remains [`FROZEN_RULES.md`](../design/decisions/FROZEN_RULES.md).
- The local solo client remains proposed in [`TASK-010`](../tasks/TASK-010-static-solo-play-client.md) and still requires its listed approvals before implementation.
- Text and state shown inside generated images are compositional examples. Implementations must render authoritative player-safe projections and current content rather than copying pixels or treating image microcopy as data.
- The supplied third-party screenshots were used only to identify general qualities—illustration value, tactile variety, card inspection, and screen-density opportunities. They are not committed here and are not redistribution assets.

## Recommended direction

The proposed design language is **Night-Shift Operations Desk**: a calm, premium technical workspace built from graphite, midnight navy, vellum work orders, blueprint traces, cool rack light, and warm inspection-lamp highlights.

The design deliberately makes three object classes feel different:

1. **Repair Tickets** are tactile landscape work orders. They own symptoms, candidates, machine state, accepted progress, and closure readiness.
2. **Playable cards** are collectible technical affordances with large illustrations, strong family grammar, and explicit Action cost.
3. **Evidence and Worklog records** are notes and immutable chronology, not cards and not hidden answers.

That distinction is the central aesthetic and information-design decision. See [`ui-defense.md`](./ui-defense.md) for the rule-by-rule defense and implementation guidance.

## Reference set

| Artifact | Purpose |
| --- | --- |
| [`01-night-shift-board-desktop.png`](./ui-reference_images/01-night-shift-board-desktop.png) | Wide desktop composition: Ticket queue, selected Ticket, Worklog, hand, resources, and basic-action rail. |
| [`02-card-ticket-specimens.png`](./ui-reference_images/02-card-ticket-specimens.png) | Card families, hand/detail scales, material palette, and the categorical difference between a card and a Ticket. |
| [`03-night-shift-board-mobile.png`](./ui-reference_images/03-night-shift-board-mobile.png) | Mobile recomposition with Ticket strip, Evidence/Worklog switch, touch targeting, fanned hand, and labeled counters. |
| [`ui-reference_images/README.md`](./ui-reference_images/README.md) | Reference-specific notes, limitations, generation provenance, and prompt specifications. |

## Approval boundary

This design pass found no new contradiction requiring a gameplay-rule decision, so no `APPROVALS_NEEDED.md` is added. The existing TASK-010 approvals remain unresolved exactly as written; these references neither approve nor amend them.

The palette, material language, card proportions, and responsive composition are proposed product-design choices. They can be approved, revised, or implemented without changing frozen gameplay so long as the invariants in `ui-defense.md` are preserved.
