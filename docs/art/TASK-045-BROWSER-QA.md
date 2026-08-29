# TASK-045 Story expansion browser QA

Status: **passed 2026-08-29 — verification-only; no new art and no production changes**

## Scope and evidence boundary

TASK-044 names exactly four existing backgrounds and eight existing character poses for the six-episode expansion. Its art-request ledger has zero gaps and zero requests. This browser pass therefore verifies intentional TASK-030 reuse rather than manufacturing decorative work for a nominal production task.

The Playwright specification builds an in-memory test page on the local static Pages server. The page imports the production `story-art-resolver.mjs`, production `bindResolvedImage` helper, and committed `assets/story/manifest.json`; it does not copy resolver behavior into a fixture or alter the Viewer. The exact reference list and reviewed alternatives come from `docs/story/revisions/quiet-cascade-expansion-v3/ART_REQUESTS.json`.

No screenshots were needed for acceptance. The assertions inspect the delivered images, resolved paths, natural dimensions, computed layout, focus, and fallback state directly.

## Final browser matrix

| Surface | Evidence |
| --- | --- |
| Desktop | All 12 production references and both same-layer fallbacks load; desktop paths, focal points, protected zones, reviewed alternatives, and deterministic second resolution match. |
| Tablet landscape | The complete reference audit passes at 1024×768 without horizontal overflow or an image leaving its slot. |
| Mobile portrait | All exact references select mobile derivatives at 390×844; HTML copy and controls remain visible; touch targets are at least 44×44 CSS pixels. |
| Mobile landscape | Reinstalling at 844×390 keeps mobile derivatives, text, touch controls, and every art slot in document flow. |
| High density | A separate Chromium context at device-pixel ratio 2 loads the desktop delivery set without stretching an image outside its bounded presentation slot. |
| 200% text reflow | At 1280×800 and 200% root text size, the document has no horizontal overflow and all four Story controls remain visible and reachable. |
| Dialogue-safe composition | Each background is rendered under the manifest's lower 34% dialogue zone and upper-left 30%×12% location zone; computed overlay geometry matches the manifest. |
| Reduced motion | Explicit `prefers-reduced-motion: reduce` emulation shortens every visual arrival to 0.001 seconds while text, focus, and action acceptance remain unchanged. |
| Save Data | A browser `navigator.connection.saveData` value of `true` makes the real resolver select `reduced-data.webp` for every exact reference and fallback. |
| Loading failure | Aborting Hana Park's reduced-data production image invokes `story.fallback.character`; it remains decorative and empty-alt while critical copy and the Story action stay usable. |
| Accessibility | Production art is decorative in the composed Story surface (`alt=""`, `aria-hidden="true"`), while all 12 reviewed alternatives remain assistive text. Intentional fallbacks add no duplicate alternative. Keyboard Enter and touch activation both work with all imagery visually disabled. |
| Content authority | The harness keeps Ticket, Evidence, choice, Match result, and next action in HTML. Removing every image does not remove, disable, or alter those controls or facts. |

The final run contained ten executed cases and fourteen intentional project skips:

- complete resolver/manifest/reference audit: 4 passes, one in each configured project;
- mobile portrait/landscape/touch audit: 1 pass, 3 skips;
- high-density and 200% reflow audit: 1 pass, 3 skips;
- save-data and failed-image fallback audit: 1 pass, 3 skips;
- reduced-motion authority audit: 1 pass, 3 skips; and
- art-independent keyboard/touch audit: 2 passes, 2 skips.

## Commands and results

```powershell
node --check tests/browser/task-045-story-expansion-art.spec.mjs
```

Exit code **0**. JavaScript syntax passed.

```powershell
& .\node_modules\.bin\playwright.CMD test tests/browser/task-045-story-expansion-art.spec.mjs --grep "all exact expansion references" --reporter=line
```

Exit code **0**: **4 passed, 0 failed, 0 skipped** in 26.7 seconds.

```powershell
& .\node_modules\.bin\playwright.CMD test tests/browser/task-045-story-expansion-art.spec.mjs --reporter=line
```

Exit code **0**: **10 passed, 0 failed, 14 intentionally skipped** in 59.6 seconds.

The Windows runner printed Node's harmless notice that `NO_COLOR` was ignored because `FORCE_COLOR` was set. It did not affect browser state, assertions, server startup/shutdown, or either exit code. No responsive, fallback, semantic, or test-server blocker remains.

## Files owned by this QA slice

- `tests/browser/task-045-story-expansion-art.spec.mjs`
- `docs/art/TASK-045-BROWSER-QA.md`

No Viewer module, live Story content, manifest, raster asset, topology, dialogue, domain record, or gameplay file changed in this slice.
