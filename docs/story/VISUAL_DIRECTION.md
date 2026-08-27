# Story Mode visual direction

Status: **working art direction; not frozen canon, licensed source material, or a production-asset set**

Story Mode should feel like an illustrated night-shift chronicle: grounded server-service environments rendered with the emotional weight and selective detail of a traditional painting. The goal is not to imitate a named artist or reproduce an existing frame. Every production image must be original, server-repair-specific, free of third-party marks, and covered by the repository's normal provenance record.

## Visual grammar

- Use painterly realism, visible brush texture, restrained chiaroscuro, and a graphite/earth palette interrupted by cold rack light, cyan instruments, amber work lamps, and occasional safety color.
- Favor strong silhouettes and readable value grouping over photorealistic clutter. A scene must remain legible beneath dialogue and at mobile crops.
- Treat server rooms, receiving bays, repair benches, corridors, operations desks, loading areas, and quiet break rooms as dramatic places shaped by people and accumulated work.
- Let technical objects carry narrative meaning: a tagged failed drive, an open chassis, an oscilloscope trace, a handwritten intake sheet, a cable route, or a sealed outgoing unit.
- Avoid fantasy architecture, military command imagery, magical interfaces, generic cyberpunk neon, floating holograms, illegible pseudo-text, real company branding, and unsafe service practice.

## Scene families

The first art plan should be able to request these reusable asset families:

1. **Environmental establishing paintings** — wide views that establish a location, shift, weather, staffing level, and operational mood.
2. **Ensemble scenes** — two or more characters arranged around a decision, handoff, disagreement, teaching moment, or debrief.
3. **Character portraits and expression variants** — consistent static 2D figures or busts with neutral, focused, concerned, relieved, amused, and exhausted states as the script requires.
4. **Technical still lifes** — tools, parts, forms, failed hardware, tagged evidence, and workbench details used for inserts or quiet transitions.
5. **Intimate narrative moments** — a single technician thinking, documenting, or confronting the human consequence of a technical choice.
6. **System/topology tableaux** — physical boards, cable maps, rack layouts, or operational diagrams that suggest connected systems without becoming a magical world map.

## Layer-ready composition

Story art must support a browser-native layered display:

- `background`: one persistent environment or establishing image;
- `characters`: independently replaceable character/expression assets with stable tags and positions;
- `transient`: temporary foreground inserts, lighting accents, notifications, and transitions; and
- `screens`: accessible HTML dialogue, speaker names, choices, history, controls, and status.

Backgrounds need protected negative space for dialogue and mobile-safe focal crops. Character assets should use transparent backgrounds where separation is required. Important information may never exist only inside rasterized text or a character expression.

## Production and provenance boundary

- Use descriptive scene briefs and this art direction as the production source. Do not feed unlicensed or watermarked third-party frames into a generation/edit workflow.
- Record prompt/brief, generator or artist, date, source inputs, edits, asset owner, intended labels/scenes, crop guidance, hash, and approval status.
- Generate or paint at a master size suitable for responsive crops; derive optimized web variants without replacing the master.
- Require desktop, narrow/mobile, reduced-motion, high-contrast, and text-overlay review before publication.
- Placeholder gradients and existing neutral server imagery are acceptable while the engine and scripts are built. Placeholder choice must not become story canon.

## Relationship to gameplay art

The 16:9 action illustrations and 10:3 Symptom panoramas remain the canonical gameplay assets. Story backgrounds, characters, and inserts form a separate asset namespace and provenance ledger. They may share the night-shift palette and technical accuracy, but a story scene must not silently become a Card or Ticket illustration, or vice versa.
