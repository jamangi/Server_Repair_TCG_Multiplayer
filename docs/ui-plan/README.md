# Gameplay UI design references

This directory now contains two different generations of UI thinking:

- [`ui-defense.md`](./ui-defense.md) and [`ui-reference_images/`](./ui-reference_images/) define the TASK-010-approved visual and interaction direction for the **gameplay surface itself**: the board, Repair Tickets, cards, Evidence, Worklog, player resources, and responsive behavior.
- [`wireframes/`](./wireframes/) contains older, low-fidelity structural studies for the **application shell around gameplay**: rooms, lobby, identity, social surfaces, store concepts, and loading. Those wireframes remain useful as historical layout studies, but they do not specify the match table and do not override current rules or TASK-010.

[`TODO.md`](./TODO.md) remains a provisional collection of broader product notes. The gameplay references here narrow only the match-facing visual direction; they do not freeze the complete client architecture.

## Status and authority

These artifacts are design references, not production UI, canonical content, or rules. The standalone minimum HTML is executable only as a visual proof of concept and is not part of the Viewer runtime.

- Frozen gameplay authority remains [`FROZEN_RULES.md`](../design/decisions/FROZEN_RULES.md).
- The local solo client is ready for implementation in [`TASK-010`](../tasks/TASK-010-static-solo-play-client.md); A1 through A7 were approved on 2026-08-23.
- Text and state shown inside generated images are compositional examples. Implementations must render authoritative player-safe projections and current content rather than copying pixels or treating image microcopy as data.
- Earlier third-party screenshots were used only to identify general shell qualities—illustration value, tactile variety, card inspection, and screen-density opportunities. They are not committed here and are not redistribution assets. `ui-minimum.png` is instead a project-owner-supplied capture of the standalone Server Repair proof of concept and is committed as the minimum implementation reference.

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
| [`ui-minimum.png`](./ui-reference_images/ui-minimum.png) | Minimum material/atmosphere floor demonstrated with vanilla HTML/CSS/JavaScript: layered panels, tactile Tickets/Cards, texture, light, shadow, glow, slight perspective, and motion. |
| [`ui-minimum-demo.html`](./ui-reference_images/ui-minimum-demo.html) | Exact standalone source behind the minimum screenshot; visual implementation evidence only, not production code or authoritative gameplay. |
| [`01-night-shift-board-desktop.png`](./ui-reference_images/01-night-shift-board-desktop.png) | Wide desktop composition: Ticket queue, selected Ticket, Worklog, hand, resources, and basic-action rail. |
| [`02-card-ticket-specimens.png`](./ui-reference_images/02-card-ticket-specimens.png) | Card families, hand/detail scales, material palette, and the categorical difference between a card and a Ticket. |
| [`03-night-shift-board-mobile.png`](./ui-reference_images/03-night-shift-board-mobile.png) | Mobile recomposition with Ticket strip, Evidence/Worklog switch, touch targeting, fanned hand, and labeled counters. |
| [`ui-reference_images/README.md`](./ui-reference_images/README.md) | Reference-specific notes, limitations, generation provenance, and prompt specifications. |

## TASK-010 approval boundary

The user approved TASK-010 A1 through A7 on 2026-08-23 and directed the implementation to treat `ui-minimum.png` as its visual floor and the three higher-fidelity references as its desktop, specimen, and mobile targets. This visual direction does not amend frozen gameplay.

The images remain non-authoritative. The implementation must preserve the invariants in `ui-defense.md`, render current content and player-safe engine projections, and document unavoidable visual deviations rather than copying incidental pixel text or state.
