# TASK-050 atlas browser and human review

Review date: 2026-08-30

Surface: [`review.html`](review.html) and five standalone SVGs

Authority: research-only; no production Viewer surface

## Automated matrix

The focused Playwright suite renders the committed review page directly and runs three checks in each repository viewport project:

| Project | Viewport / mode | Checks |
| --- | --- | --- |
| `chromium-desktop` | 1600 × 1000 | responsive width and 200% text reflow; forced colors/focus; keyboard and text-equivalent order |
| `chromium-tablet` | 1024 × 768 touch | same three checks |
| `chromium-mobile` | 390 × 844 mobile/touch | same three checks |
| `chromium-reduced-motion` | 390 × 844 mobile/touch, reduced motion | same three checks; the static research page has no animation |

Result after the final rendering pass: **12 passed, 0 failed**. Five articles and five `role="img"` SVGs render at every viewport. The page has no horizontal overflow before or after 200% root-text scaling; each SVG remains bounded by its figure.

## Human visual review

The full desktop contact page and the first storage-focused SVG were rendered in Chromium and inspected at native resolution. The first pass exposed overlapping long relation labels around the hybrid storage branches. The generator was corrected to:

- end connectors at node boundaries rather than near node centers;
- show the short typed relation (`POWER`, `DATA`, `CONTROL`, `LIFECYCLE`, or `CONTAINMENT`) on canvas;
- retain the complete relation and endpoints in the SVG accessible description;
- offset the parallel power and management paths; and
- use relation-specific dash patterns and triangle/diamond/square markers as redundant non-color cues.

The corrected pass preserves the host/BMC separation, distinct SAS and PCIe/NVMe branches, two-upstream-to-one-shared power path, and firmware/NIC/physical-link boundaries. No drawing contains a failed, suspect, correct, compatible, missing, or repaired state.

## Accessibility review

- **Phone and reflow:** all five diagrams scale to the content column at 390 CSS pixels; captions and Candidate IDs wrap instead of widening the page.
- **200%:** root text was scaled to 32 CSS pixels in every viewport; headings, captions, and controls reflow without horizontal scrolling.
- **Forced colors:** nodes use Canvas/CanvasText, focused nodes use Highlight, and edge dash/marker shapes remain present when authored colors collapse.
- **Keyboard:** each semantic component group is focusable in the same numbered order used to build the text equivalent; visible focus increases the node outline to 5 pixels.
- **Screen-reader order:** every SVG has one title and one long description. The adjacent `figcaption` is byte-equal to that description. Human review confirmed the order is Ticket public surface, focused components, typed connections, then the explicit no-hidden-state boundary; it does not depend on drawing coordinates.
- **Meaning beyond pixels:** complete components, edges, lifecycle, Candidates, actions, and hidden authoring proof remain available in the generated dossier Markdown even if the SVG cannot be displayed.

## Exceptions and unresolved items

- Browser automation is a semantic proxy rather than a certification by every assistive-technology/browser pair.
- Dell's mutable online-manual topics may redirect by locale. Claim scope, product context, exposed revision, access date, and exceptions are preserved in [`source-ledger.json`](source-ledger.json); copyrighted manuals were not copied into the repository.
- The R740xd PCIe cable labels do not prove one universal controller topology, so the atlas stops at a PCIe/NVMe-path abstraction.
- The R740xd2 exact service role is a Power Interposer Board; the game's broader distribution-board Component remains an audited ambiguity.
- `SYSTEM-001` is unresolved. TASK-051 must not begin until the project owner approves A, B, C, or D.
