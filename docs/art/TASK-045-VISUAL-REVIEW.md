# TASK-045 Story expansion visual reuse review

Status: **approved verification-only reuse review — zero new masters and zero new derivatives**

The six-episode expansion is visually complete with the twelve already-approved TASK-030 assets named by TASK-044. The contact sheet at [`task-045-contact-sheets/expansion-reuse.jpg`](task-045-contact-sheets/expansion-reuse.jpg) renders one exact reachable state from each episode using the current Story player’s desktop and mobile placement geometry. Source pixels are read-only; labels and review copy sit outside every image panel.

No image generation or image editing was performed. This record approves reuse of byte-identical production art; it does not create a new visual canon or expand TASK-044 topology.

## Review result

| Check | Mechanical evidence | Result |
| --- | --- | ---: |
| Crop, focal point, and dialogue-safe composition | 4/4 backgrounds retain 1600×900 desktop and 720×960 mobile families, centered focal metadata, the lower-34% dialogue zone, and the upper-left location zone. Across 8 background/profile checks, lower-zone mean luminance is 13.85–30.29/255 and focal-region deviation is 10.85–59.28. | PASS |
| Identity and pose cohesion | 8/8 character poses retain their approved identity reference, portrait-band scale, top anchor, center, and visible-area bounds across 16 desktop/mobile pair checks. | PASS |
| Transparent edges | All 16 character/profile decodes retain alpha, antialiased transition pixels, and clear top/side margins matching the TASK-030 inventory. Character thumbnails are reviewed against both dark and light matte values. | PASS |
| Hidden solution, pseudo-text, brand, and unsafe-action boundary | All 24 image inputs are hash-identical to approved TASK-030 derivatives. Their provenance retains the no-brand, no-readable-or-pseudo-text, no-hidden-answer, and no-unsafe-handling prompt constraints; review notes and the passed license audit remain intact. Direct inspection of this sheet found no hidden Fault/required diagnostic, pseudo-writing, third-party mark, or unsafe service action. | PASS |
| Exact episode use | 6/6 sheet states are reconstructed from the named candidate-script label before any dialogue; their background, pose, and LEFT/RIGHT placement exactly match the authored statements. | PASS |
| Zero-new-art boundary | TASK-044 reports 0 gaps, 0 requests, and 0 transients. This builder writes only this review JPEG and this Markdown record; production masters, derivatives, manifests, provenance, Story content, and gameplay remain untouched. | PASS |

## Episode compositions

| Shift | Exact reachable state | Background | Characters |
| ---: | --- | --- | --- |
| 7 — The Fourth Pair | `story.qc02.shift07.entry` (entry) | `story.bg.trinity.trace.night` | `story.asset.character.sora_chen.focused` (RIGHT); `story.asset.character.malik_okoye.focused` (LEFT) |
| 8 — Across Both Bays | `story.qc02.shift08.success` (completed return) | `story.bg.trinity.validation_gate.predawn` | `story.asset.character.malik_okoye.focused` (LEFT); `story.asset.character.hana_park.relief` (RIGHT) |
| 9 — Before the Drop | `story.qc02.shift09.abandon` (bounded abandonment return) | `story.bg.trinity.knowledge_systems.night` | `story.asset.character.jonah_reed.thoughtful` (LEFT); `story.asset.character.hana_park.skeptical` (RIGHT) |
| 10 — The Alert That Stayed | `story.qc02.shift10.entry` (entry) | `story.bg.trinity.knowledge_systems.night` | `story.asset.character.jonah_reed.defensive` (LEFT); `story.asset.character.hana_park.skeptical` (RIGHT) |
| 11 — Version A, Version B | `story.qc02.shift11.entry` (entry) | `story.bg.trinity.core_floor.night_storm` | `story.asset.character.malik_okoye.defensive` (LEFT); `story.asset.character.sora_chen.focused` (RIGHT) |
| 12 — Recovery State | `story.qc02.shift12.follow_on` (current-content handoff) | `story.bg.trinity.validation_gate.predawn` | `story.asset.character.hana_park.relief` (RIGHT); `story.asset.character.sora_chen.approving` (LEFT) |

Together these six actual states display all four backgrounds and all eight poses in both delivery geometries. The sheet intentionally uses no dialogue rasterization, solution insert, transient, vignette, brand mark, or technical status overlay. Desktop source panels remain unobscured so the protected lower third can be inspected; mobile dialogue is correctly outside the image stage.

## Approved derivative inputs

| Asset | Desktop SHA-256 | Mobile SHA-256 |
| --- | --- | --- |
| `story.asset.character.hana_park.relief` | `ac5bc6391e8fd5d096bda25bc5987f1b11e2515e8315b1c6050427b73c7a2cb4` | `97821df11060055eac8c45d839b3fea6be5275bd4ebb448703236896add52aae` |
| `story.asset.character.hana_park.skeptical` | `cd08cb455c8b497b90d2425f1a00ef523b20e0e77f5e506a64bb3acf49e612ae` | `6b46138f95f86bc0f44ae5b44c311f6a741de370302205f607f62126598bc4d9` |
| `story.asset.character.jonah_reed.defensive` | `ebacbcbc92b255f0ae39559e834f6ea41c281c2d4ccfad8f09a52994f31e9707` | `5026cb04410b5ee4659c9df70ed26b7e5f7c3bca1ebe2804e87fd70473a8f8e4` |
| `story.asset.character.jonah_reed.thoughtful` | `91c0b0e8c7f9bd079991c3aa5e34cec2afd60630aa77dc11db9d69528caf0bd2` | `a15d103ad313e153829ebad3aa62f9cd8304083a0714d7acb0cbdc3896c2055a` |
| `story.asset.character.malik_okoye.defensive` | `be9adb433562c370e000b6710ecc9bfd1fb3a37f83f3ba03fa07c9e87cb8115a` | `e64204295fa4547ee156eff4cad0d816138e4e5f7bd0a3acb8501ddd6612848e` |
| `story.asset.character.malik_okoye.focused` | `ae06ae7f332a917861d826c7ef04c2969d9c3d29c39eed2375966d11b3797a98` | `0b82166078ddb93b4029603cc27241d10c3514db8604b8408d3a3cf0090f54a6` |
| `story.asset.character.sora_chen.approving` | `ed9c3fc46d2d3faa2f49bb1861a9b8bccc0b643b39abfc61907ef5b2c858a371` | `3017cd55315029c1e95ccc7a42358dcd257f7da0b0903176ae0bae3312df49f7` |
| `story.asset.character.sora_chen.focused` | `5b98acf3a47af81d7727577f4fc39c1d8b7151856be1f7d35163aecf1dab6b13` | `36ed91ebc79873bcb3f8a04e84db0a710257769fecf64453492bf5e176d6e51c` |
| `story.bg.trinity.core_floor.night_storm` | `0853da55c7e479d2da75eb5985620fe4d8664c3141638773b1a317b2a2b18e96` | `7634e06ea70015f5ca8da4d3f71491d86748879a5705bc17254610abac948166` |
| `story.bg.trinity.knowledge_systems.night` | `83b9091796b92f6cd6eed9c3f093a8e22699bc002d25982724929feb1c4ba624` | `0fdae3cbda90f974bef87cd5fbc5a00c217fed8550e81b230124772793a28b58` |
| `story.bg.trinity.trace.night` | `ecf09b6dd5c020d8a968ce271143733941ff8e8c194758bd6d6ae872390cdc85` | `f1fe2fc502c6cd3527d7f6b32e718b132adbd1b03852eeb2854162eb98f29e9e` |
| `story.bg.trinity.validation_gate.predawn` | `b30e1a05e60d809bb564f59a2d97f601c940ff27ea5cb6b576e15bc4e6f012e6` | `e25ea8d3fb80475488ebe06aa7927fff5b70db0e8570db07dde449825a020a1a` |

The 24 paths are the manifest-owned `desktop` and `mobile` sources under `viewer/assets/story/`; their dimensions, byte counts, hashes, and approval records agree across the TASK-030 inventory, provenance ledger, and TASK-044 reuse ledger.

## Review-input lock

Aggregate SHA-256: `98b72aa77e86d3d2fb04ffddf1471ebc5a0b3737f02a8038289df219075be85f`

The aggregate covers the manifest, TASK-030 inventory/provenance, visual direction/background registry, TASK-044 choreography/art/alt briefs, all six candidate scripts, and all 24 source derivatives. A changed input stops the builder and requires a fresh visual review before the lock can be updated.

<details><summary>Individual document hashes</summary>

| Input | SHA-256 |
| --- | --- |
| `viewer/assets/story/manifest.json` | `7a6cae7ed58f1a167e282bc9e91975f5978c1a59786426814fd28037bb186db0` |
| `docs/art/task-030-story-art-inventory.json` | `2355d1654d4ddf76befe93d6ffa6e3df77312b28b8aab0f02fd4523f86abb5b3` |
| `art_sources/task-030/generation-log.json` | `364740ac2ddf4f2aef7e8bbb9651f435d3f1bc9fe6916248d05a8376bfd0db87` |
| `docs/story/VISUAL_DIRECTION.md` | `b931e34e96e834d87e451637a75a5959c33d9ca5797cba21ea0a5e7abad3558d` |
| `docs/story/BACKGROUNDS.md` | `2eec083f1403b024dc938e47f7d20e659585c4ed844f706d4b486e35e19c7212` |
| `docs/story/revisions/quiet-cascade-expansion-v3/CHOREOGRAPHY.md` | `f77f2df1cc034ea707c0148d30871d91b8f7c52bd0e6258e0a2cddf84fb2ddd8` |
| `docs/story/revisions/quiet-cascade-expansion-v3/ART_REQUESTS.md` | `6a20624bed1b67fbead4c1eae8221776314842339bb584460fa943a43d4a0797` |
| `docs/story/revisions/quiet-cascade-expansion-v3/ART_REQUESTS.json` | `5552069749f38660f2be088d1715040602a53ac44a4f2f0d5038692a6ccb7721` |
| `docs/story/revisions/quiet-cascade-expansion-v3/ALT_TEXT_BRIEFS.md` | `08db1d3778b263c236f12929582a38a8d7a0022c72295dfcff4ffb7b55dece8b` |
| `content/story-v1/candidates/quiet-cascade-expansion-v3/scripts/shift-07.json` | `7bbb6355a73d19225cda54d5774ce72cf7ec8700b25fc8f3c9815b9e5a975acf` |
| `content/story-v1/candidates/quiet-cascade-expansion-v3/scripts/shift-08.json` | `a03abd61cdfb859a9f31691455d44429be0b313c6e1447f205254e143c3615cc` |
| `content/story-v1/candidates/quiet-cascade-expansion-v3/scripts/shift-09.json` | `e16068ebe047f555fdb946acc09ff579c2df741a470f746e52480c0231a7a770` |
| `content/story-v1/candidates/quiet-cascade-expansion-v3/scripts/shift-10.json` | `48b30304661b3a9182a576c96ebf8589d8b46307135e95dd6cee26fee858febf` |
| `content/story-v1/candidates/quiet-cascade-expansion-v3/scripts/shift-11.json` | `5cce5a910c31dfeaf0a1d40018cb1f8fb9255fb639aac9d9e6d80759c97be4c9` |
| `content/story-v1/candidates/quiet-cascade-expansion-v3/scripts/shift-12.json` | `8362c422e0e491f9de5f4157226c568087eac1c52703f24bd297c09cdc6d3bb9` |

</details>

## Output and reproduction

- Output: `docs/art/task-045-contact-sheets/expansion-reuse.jpg`
- Dimensions: 2416×3490
- Bytes: 1724536
- SHA-256: `a0a4b870d4ea33878179cf57bc717280d32ac7768c74461699be853d4e3c7816`
- Labels: rendered only in the contact-sheet canvas outside source-image panels
- Production-art mutations: 0

Rebuild and verify with the repository Python environment that supplies Pillow:

```powershell
python tools/build-task-045-story-art-review.py
python tools/build-task-045-story-art-review.py --check
node --test tests/task-045-story-expansion-visual-review.test.mjs
```

Unresolved visual items: **none**. A later topology-authorized script change that introduces a different location, pose, transient, or comprehension need must reopen the gap analysis instead of silently reusing this approval.
