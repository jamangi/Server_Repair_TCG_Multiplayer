# TASK-055 player-facing System Model experience

TASK-055 adds a read-only **Show system** route to the full Ticket. It is deliberately subordinate to Symptoms and public Candidates: the entry sits in the machine-state strip, labels itself **Informational · 0 Actions · not Evidence**, and appears only when TASK-054 resolves the selected Ticket to a valid public projection.

## Player contract

- The view introduces the server profile and its bounded scope without describing the Ticket's cause or current health.
- Startup/runtime stages preserve required, parallel, conditional, optional, and not-applicable language.
- A semantic SVG uses labeled relationship families and non-color line patterns. The same source is repeated as complete ordered node, connection, path, and abstraction text.
- Every public component role and serviceability note remains inspectable. Public component and action IDs link to the Domain Library in a new tab so the active Match is preserved.
- Test, Command, Repair, and Verification explanations are grouped disclosures. **◆ Relevant to this system** and the Worker's separate **✓ Legal now** / dashed **— Not currently legal** labels use different words, icons, and shapes.
- The authority notice states that relevance is not Evidence, legality, a predicted result, or a correct diagnosis. Opening, scrolling, expanding, and closing never submit an intent or alter machine state.

## Integration boundary

`viewer/js/play/system-model-view.mjs` receives only TASK-054's materialized player projection. `viewer/js/play/pages/game-page.mjs` asks `system-model-service.mjs` for that projection by public Ticket ID and optional snapshot digest. It imports no generator, compatibility proof, resolver trace, hidden authored outcome, or System-domain source.

Worker legality enters the renderer only as a separate set of public action-definition IDs. The System projection does not grant legality and the renderer provides no gameplay submission control.

When resolution is missing, incompatible, digest-mismatched, or unavailable, the full Ticket shows the approved generic notice and renders no **Show system** control or invented fallback hardware.

The optional projection catalog is loaded only after base Play has rendered. A pending request produces a truthful loading notice without blocking Home, Ticket inspection, or ordinary diagnosis. Success or failure refreshes to the valid per-Ticket available/unavailable result; if a Play dialog is open, that refresh waits until the dialog closes normally so its focus contract is not interrupted.

## Dialog, focus, motion, and sound

The System dialog is a sibling modal opened above the still-open full Ticket. Escape, backdrop, header close, and footer close dismiss only the System layer and restore the exact **Show system** opener inside the full Ticket. Closing the full Ticket then restores its own opener on the board. Route teardown closes both without focusing detached controls.

The existing motion coordinator supplies the bounded modal transition and disables it under reduced-motion preference. Existing `game.popup.open` and `game.popup.close` SFX mappings are reused through the central catalog; diagram focus, scrolling, disclosure changes, and passive rendering remain intentionally silent.

Viewport changes are handled by CSS while either modal is open. Any board pagination rerender needed after an orientation change is deferred until the modal stack closes, preserving the open System content, local topology scroll, and focused control throughout portrait/landscape transitions.

## Verification

Focused coverage lives in:

- `tests/task-055-system-model-view.test.mjs` — all 12 released episodes / 18 Tickets / three profiles, complete public-field rendering, neutral fallback, hidden-field invariance, causal-token leak checks, public-only imports, zero gameplay authority, and central SFX mappings.
- `tests/browser/task-055-system-model-view.spec.mjs` — real Story and Story-practice Matches, nested modal lifecycle, exact focus restoration, no-Action checks, ordinary gameplay afterward, selected-Ticket switching, reload/route teardown, unavailable content, keyboard/touch, 100%/200%/400% reflow, bounded topology scrolling, semantic focus targets, 44px controls, reduced motion, forced colors, and high-contrast-compatible styling.

The executed matrix and visual review are recorded in [BROWSER_QA.md](./BROWSER_QA.md).
