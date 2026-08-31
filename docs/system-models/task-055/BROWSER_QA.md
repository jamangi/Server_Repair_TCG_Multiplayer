# TASK-055 browser, accessibility, and visual QA

## Automated matrix

| Surface | Viewport / input | Text | Media mode | Assertions |
|---|---:|---:|---|---|
| Story Match | 1600 × 1000, keyboard + mouse | 100% | normal | Complete public content; System-over-full-Ticket modal interruption; Escape/header/footer/backdrop close; exact two-level focus restoration; repeated reopen; no Worker request, Action, or machine-revision change; ordinary diagnostic remains playable; route teardown |
| Story Shift 2 | 1600 × 1000, mouse | 100% | normal | Two covered Tickets switch independently and preserve selected-Ticket continuity; distinct pinned projection cache identities |
| Story practice replay | 1600 × 1000, mouse | 100% | normal | Isolated replay exposes the same public view; reload removes both dialogs and returns through the established interrupted-practice recovery |
| Story Match | 768 × 1024 → 1024 × 768 → 768 × 1024, touch | 200% | normal | Touch entry/close, live portrait/landscape reflow without modal teardown, bounded topology scroll, no System-introduced document overflow, dialog containment, 44 × 44 targets, and preserved focus |
| Story Match | 390 × 844 → 844 × 390 → 390 × 844, touch | 400% | normal | Single-column reflow, live orientation changes, no System-introduced document overflow, bounded local topology scroll, dialog containment, preserved focus, and reachable close control |
| Story Match | 390 × 844 → 844 × 390 → 390 × 844, touch | 200% | reduced motion | No active descendant animations; same orientation, focus, scroll, and target-size contracts |
| Story Match | 1600 × 1000, keyboard + mouse | 100% | forced colors | System boundaries, topology nodes/edges/focus, authority notice, and status shapes remain visible |
| Local solo failure fixture | 1600 × 1000, mouse | 100% | projection fetch failure | Exact generic unavailable notice; no Show control; no System dialog or fabricated server |
| Local solo delayed fixture | 1600 × 1000, mouse | 100% | held projection fetch | Home and Ticket become ready while the optional request remains pending; an ordinary Test resolves; delayed catalog settlement does not close the full Ticket or move focus; closing normally restores focus and refreshes loading to the honest per-Ticket available/unavailable result |

The browser assertions also serve as the focused semantic accessibility audit: the dialog has an accessible name; headings form named regions; topology nodes and paths are focusable and named; the diagram has a complete ordered text equivalent; relationship families remain distinguishable without color; disclosures and links are native controls; and every System-view interactive target computes to at least 44 × 44 CSS pixels.

An independent Chromium accessibility-tree inspection confirmed a named SVG, a named `System topology nodes` list with 19 named `listitem` nodes for the Shift 1 R740xd profile, and a separate, complete topology text-equivalent region. This complements the dependency-free semantic browser assertions; no accessibility dependency was added.

## Human visual review

The accepted review checks the full System surface rather than treating one screenshot as layout authority:

- machine-state entry remains secondary to Symptoms and Candidates in the full Ticket;
- sticky header and footer preserve identity, authority reminder, and a reachable close action through a long projection;
- lifecycle tiles, topology, text equivalent, component cards, and rationale groups have one logical reading order;
- relationship patterns and status icons remain distinct in monochrome/forced colors;
- only the topology owns horizontal scrolling at phone and zoomed widths; and
- no component, path, stage, or rationale is clipped or hidden behind hover-only behavior.

The independent hands-on pass used real Story Shift 1 data. Desktop review accepted the entry hierarchy, topology, rationale/legal distinction, source links, nested-modal visuals, and exact `Show system` → `View full Ticket` focus restoration. At 390 × 844, the open dialog measured 337px inside the 390px viewport, document horizontal overflow measured 0, and the topology measured 268px client width / 736px scroll width. Its horizontal scroll remained locally bounded and the close action remained reachable.

Optional accepted evidence is regenerated with `UPDATE_TASK_055_VISUALS=1` and stored under `tests/visual/task-055/`. Screenshots are evidence of presentation only; Node assertions remain the authority for all 12 episodes and 18 Ticket projections.

## Final run record

All commands ran from the repository root on 2026-08-31.

| Command | Exit | Result |
|---|---:|---|
| `node viewer/scripts/build-play-assets.mjs` | 0 | Staged 198 deterministic Play assets, including the neutral TASK-054 public bundle |
| `node viewer/scripts/build-sfx-assets.mjs` | 0 | Generated 12 central SFX recipes / 33,254-character runtime catalog |
| `node --check viewer/js/app.js` plus `data-loader.js`, `entity-types.js`, `play/play-app.mjs`, `play/pages/game-page.mjs`, `play/system-model-view.mjs`, and `play/system-model-service.mjs` | 0 each | Syntax clean |
| `node --test tests/viewer-baseline.test.mjs` | 0 | 3 passed, 0 failed |
| `node --test tests/task-053-system-model-story-domain.test.mjs tests/task-054-system-model-production.test.mjs tests/task-055-system-model-view.test.mjs` | 0 | 24 passed, 0 failed |
| `node viewer/scripts/verify-play-assets.mjs` | 0 | Verified 198 deterministic Play assets |
| `node viewer/scripts/verify-sfx-assets.mjs` | 0 | Verified the 33,254-character deterministic SFX catalog |
| `$env:PLAYWRIGHT_BASE_URL='http://127.0.0.1:4173'; node node_modules/@playwright/test/cli.js test tests/browser/task-055-system-model-view.spec.mjs --workers=1 --reporter=line --trace=off` | 0 | 9 passed, 0 failed, 15 intentional cross-project skips in 1.9 minutes |
| `git diff --check` | 0 | No whitespace errors |

There are no accepted visual, accessibility, content, or leak exceptions. Optional screenshots can be regenerated as described above; the executable semantic/coverage assertions and the recorded independent hands-on pass are the accepted evidence.

## Repository-wide browser audit

The additional complete `playwright test --reporter=dot --trace=off` audit executed all 316 configured cross-project cases: 146 passed, 164 intentionally skipped, and six reported failure in the concurrent run. The TASK-055 spec remained green. One older TASK-015 mobile focus case passed immediately when rerun alone and is classified as a concurrency flake. The other five failures reproduce serially or are directly pinned to pre-existing expectations:

- TASK-010's keyboard completion helper selects an intent whose Card is in neither its hand pager nor diagnostic lookup;
- TASK-012's older continuity fixture exhausts thirty projected setup intents without making a held response Card legal;
- two TASK-014 checks still expect `12 of 12`, while the clean pre-sprint `main` content already reports `12 of 18` supported causal fingerprints after the released expansion; and
- TASK-016's fixed dialog-name regular expression does not include the existing **Supply Redundancy Lost** Ticket title.

The TASK-010 and TASK-012 cases reproduced with the new staged System projection temporarily absent, proving that optional catalog loading and System rendering are not their cause. This sprint does not change those legacy tests, their engine/Builder inputs, or gameplay authority; they remain repository baseline test debt outside TASK-053 through TASK-055 rather than accepted exceptions in the new experience.

## Successor ownership

The project owner authorized [`TASK-056-HIGH`](../../tasks/TASK-056-restore-browser-baseline-and-investigate-focus-flake.md) on 2026-08-31 to restore the five legacy cases and investigate the concurrency-only TASK-015 focus result. This pointer assigns follow-up ownership without changing the historical TASK-055 totals or reclassifying any result as an accepted product exception.
