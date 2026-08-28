# TASK-030 Story art production record

Status: **completed canonical campaign-one production package under STORY-007 A**

TASK-030 supplies the complete static 2D presentation layer for every reachable asset reference in *The Quiet Cascade*. Story behavior remains usable when this optional layer is missing: dialogue, choices, technical facts, and Match authority stay in HTML, declarative content, and the ordinary Worker-backed engine.

## Finite inventory

The reachable production set is intentionally bounded and reused across all 324 campaign statements:

| Layer | Production assets | Permanent fallback | Delivery profiles |
| --- | ---: | ---: | --- |
| Background | 6 | 1 | desktop, portrait-mobile, reduced-data |
| Character | 14 (7 identities × 2 poses) | 1 anonymous silhouette | desktop, mobile, reduced-data |
| Transient insert | 3 | 1 text-free board | desktop, mobile, reduced-data |
| **Total** | **23** | **3** | **78 optimized WebPs** |

The exact IDs, source masters, responsive derivatives, focal points, protected zones, accessible alternatives, scene labels, hashes, byte budgets, and review states are recorded in [`task-030-story-art-inventory.json`](task-030-story-art-inventory.json). The runtime mapping is [`../../viewer/assets/story/manifest.json`](../../viewer/assets/story/manifest.json).

## Original-generation and source boundary

Every master is an original image made with **OpenAI built-in image generation** on 2026-08-27. The shared prompt direction requested grounded painterly server-service environments and people; restrained cool/warm night-shift lighting; readable value groups; safe technical practice; layer-ready composition; no named-artist imitation; no brands; no legible or pseudo text; no magical UI; and no hidden gameplay answers. Each asset then used a subject-specific prompt preserved verbatim in [`../../art_sources/task-030/generation-log.json`](../../art_sources/task-030/generation-log.json).

The only visual references were the six project-owned planning images in `docs/ui-plan/ui-reference_images/`. Their hashes and usage are recorded in the ledger. They guided composition, lighting, dialogue clearance, and ensemble cohesion; their pixels were not copied or edited into a master. The ledger retains the final generation reference for every master, the source reference for identity-preserving expression edits, and the separate cleanup reference where an accidental opaque matte was removed.

Two generated environment masters initially contained pseudo-writing. Their authored masters were edited to blank geometric paper/timeline blocks before delivery. Seven expression edits initially returned an opaque matte; each was sent back through the image workflow for background removal, and the final PNGs were verified to contain real alpha rather than painted checkerboards. Discarded attempts are not delivery assets.

## Delivery and accessibility contract

- `viewer/assets/story/manifest.json` is the single strict runtime mapping. It accepts only safe relative image paths, normalized focal/protected-zone geometry, three source profiles, canonical alt/decorative semantics, and same-layer fallbacks.
- Backgrounds reserve the lower 34% for dialogue and the upper-left location marker. Portrait-mobile crops follow the reviewed focal point.
- Character and transient masters contain alpha; runtime variants preserve it. Exact story facts remain accessible text, never raster copy or expression-only meaning.
- Character delivery derivatives use a deterministic, master-preserving presentation transform. For each identity, visible alpha at threshold 8 is measured in the upper 40% portrait band; the alternate pose is uniformly scaled and anchored to its approved reference pose's head band and top edge. Factors within 3% remain untouched, transforms outside the reviewed 0.75–1.50 range fail closed, and the exact transform audit is recorded separately from master provenance.
- Production art carries text-catalog alternatives that describe the pixels which actually ship. Fallbacks are decorative and use empty alternatives.
- The resolver prefers reduced-data assets when the browser requests data saving, then mobile assets at the narrow breakpoint, then desktop assets. A missing ID or failed image falls back within its own layer.
- Delivery has no network-generation dependency. The 78 WebPs total **4,811,478 bytes**, below the reviewed **15 MiB** Pages budget; the PNG masters stay outside the Pages tree.

## Visual review

Eleven committed contact sheets cover all locations, all expressions, each character identity pair, transient inserts, and the combined scene family. They are under [`task-030-contact-sheets/`](task-030-contact-sheets/). Review confirmed:

- stable identity, workwear, role cues, and painterly treatment across each pose pair;
- consistent head scale and top alignment across expression pairs, with character, expression, and scene-family sheets rendered from the actual delivery derivatives;
- no generated pseudo-text, real brands, hidden Faults, required diagnostics, or solution disclosure;
- usable silhouettes and transparent edges on dark scene surfaces;
- dialogue-safe background value structure across storm-night, predawn, and dawn scenes;
- text-free inserts whose exact meaning remains in accessible HTML; and
- a bounded visual fallback for every layer.

The Story browser acceptance matrix additionally owns desktop, portrait-mobile, reduced-motion, zoom/reflow, keyboard/touch, loading-failure, and real Story→Match→Story composition checks. Those captures exercise these delivery files through the actual resolver rather than a mockup.

## Rebuild and verification

Use the bundled or system Python with Pillow to reproduce the optimized files and audit records from the committed masters:

```powershell
python tools/build-task-030-story-art.py
node viewer/scripts/verify-task-030-art.mjs
node --test tests/task-030-story-art.test.mjs
```

The verifier rejects missing/unused production IDs, invalid or cross-layer fallbacks, path traversal, absent alpha, mismatched dimensions/hashes, incomplete prompts/provenance/review, incorrect alt semantics, missing contact sheets, failed license/source audits, and any derivative over budget.
