# TASK-030-XHIGH: Create and integrate original Story Mode art

## Status

**Completed 2026-08-28.** STORY-006 A remains synchronized into this contract. The campaign identities and visual anchors remain production-candidate pending STORY-007; see the shared [TASK-026 through TASK-030 completion record](../story/TASK-026-030-COMPLETION.md).

## Objective

Create the original static 2D backgrounds, character portraits/expression variants, technical inserts, and transient overlays required by the validated campaign, then integrate responsive optimized variants without altering story or gameplay behavior.

## Required reading

Read completely before editing:

- `AGENTS.md`, this task, `docs/tasks/INDEX.md`, TASK-011, and completed TASK-026 through TASK-029;
- `docs/story/VISUAL_DIRECTION.md`, `BACKGROUNDS.md`, character registries, final scripts, asset-reference report, and Story player crop/layer contracts;
- all six project-owned source references in [`docs/ui-plan/ui-reference_images/`](../ui-plan/ui-reference_images/README.md#11--story-mode-composition-and-art-direction), which may guide the approved campaign's painterly lighting, environment scale, portrait cohesion, dialogue-safe composition, and choice-screen hierarchy;
- TASK-011 provenance tooling/lessons, image resolver, accessibility/performance guidance, and current asset verification.

## Production contract

- Derive a finite asset inventory from actual reachable statements. Consolidate reusable backgrounds, expressions, poses, and inserts before generation; do not generate one image per line.
- Follow the original painterly night-shift direction: grounded technical environments, visible brush character, strong value grouping, human stakes, and restrained cool/warm service lighting.
- Keep every character identifiable across expressions and scenes. Preserve approved physical details, clothing, protective equipment, role, and age; prevent unreviewed identity drift.
- Use layer-ready compositions, transparent character/foreground assets where required, protected dialogue zones, mobile-safe focal crops, and text-free imagery.
- The six project-owned Story references may be used as visual source references, but they remain planning images rather than automatically shippable scene art or canonical cast sheets. Never copy or edit other unlicensed/watermarked frames, imitate a named living artist, include third-party brands, add pseudo-text, or depict unsafe/incorrect service practice without intentional narrative correction.

## Asset and provenance requirements

- Maintain one deterministic manifest from story asset ID to master source, responsive derivatives, crop/focal metadata, alt/decorative status, labels/scenes, and fallback.
- Record brief/prompt, tool/artist, date, source inputs, edit history, review status, hashes, and approval for every master. Preserve generation references needed for coherent revisions.
- Keep masters outside runtime delivery when appropriate; commit optimized web formats and bounded fallbacks. No runtime network fetch or image-generation dependency.
- Audit licenses and repository size before committing. If the planned set exceeds a practical Pages budget, stop with a reviewed batching/compression proposal rather than degrading every image silently.

## QA and verification

- Review complete contact sheets by character, expression, location, and scene family before integration.
- Test desktop, mobile portrait/landscape, high-density, zoom/reflow, dialogue overlays, dark/bright scenes, loading failure, and reduced-data behavior.
- Verify all required references resolve, no unused production assets ship, alt/decorative semantics are correct, crops preserve subjects, performance budgets hold, and no visual contains hidden gameplay answers.
- Run asset validators, manifest/hash verification, broken-reference tests, Story route screenshots, full relevant suite, staged Pages verification, and `git diff --check`. Record commands, exit codes, pass/fail totals, changed files, and unresolved items.

## Allowed paths

- Story art masters/provenance/contact sheets and optimized Viewer assets;
- Story asset manifest/resolver and style integration;
- scripts needed to derive/validate assets;
- tests, visual QA, task/index/player documentation.

Do not rewrite story scenes, change labels/branches/Match configurations, alter gameplay art ownership, or introduce Live2D/3D/framework dependencies.

## Completion boundary

Stop when every required production scene has reviewed, provenance-complete, responsive original art and the placeholder path remains safe.
