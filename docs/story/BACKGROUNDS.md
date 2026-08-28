# Story background registry

Status: **campaign-one production plan; identifiers are stable Story content contracts**

This registry defines the reusable locations required by *The Quiet Cascade*. It plans responsive Story assets; it does not contain production art. Exact dialogue and critical technical facts remain accessible HTML in the screen layer rather than raster text.

## Composition rules

- The lower 34% is treated as the primary dialogue-safe zone on desktop. Important faces, tools, indicators, and physical clues stay above it unless a scene explicitly clears the dialogue layer.
- The center 46% is the default portrait-mobile crop. A background may preserve atmosphere outside that crop, but no critical fact may exist only at an edge.
- Character positions use the runtime IDs `LEFT`, `CENTER`, and `RIGHT`. Background focal subjects avoid all three portrait anchors when the scene expects a three-person ensemble.
- Lighting and weather variants communicate time and mood only. They never carry a branch predicate, Match result, or safety instruction by themselves.
- Incidental labels remain abstract and non-semantic. Exact serials, Worklog facts, and client copy use transient inserts with matching text alternatives.

## Campaign-one backgrounds

The production set is deliberately capped at six heavily reused paintings. Shift-specific identity comes from character tags, accessible location/time copy, and at most three transient inserts rather than per-line or per-Ticket scenery.

| Stable asset ID | Location and variant | Narrative use | Protected overlay zones | Mobile crop | Future production brief |
| --- | --- | --- | --- | --- | --- |
| `story.bg.trinity.inflow.predawn_storm` | Inflow dock, predawn after rain | Opening return cages, provenance choice, Civic Atlas lot arrival | Lower third; upper-left location marker | Return cage and open dock centered; keep scanner station readable | Wet concrete, dark return cases, amber dock lamps against cold predawn, no legible client marks |
| `story.bg.trinity.core_floor.night_storm` | Reconfigurable Core Floor view spanning First Look, Rigline, and Bench | Home-team brief; boot, power, memory, thermal, network, and final-queue preparation | Lower third; left and right portrait lanes | One instrumented rack and open chassis centered | Wide floor with inspection bench, restrained rig light, safe repair station, and storm windows; scene copy names the current work area |
| `story.bg.trinity.trace.night` | Trace analysis bench, late night | Sora's discriminating-question route and causal debriefs | Lower third; center-left notebook space | Bench instruments and paper fault tree centered | Oscilloscope, notebook, board-safe handling, warm task lamp against cool rack light |
| `story.bg.trinity.validation_gate.predawn` | Validation Gate, predawn | Hana's independent review, Story-point fallback, final outcome gate | Lower third; upper-right hold/release tag area | Audit desk and unit identity station centered | Clean but lived-in quality area, green release and red hold materials without color-only meaning |
| `story.bg.trinity.knowledge_systems.night` | Knowledge Systems desk, night | Jonah, SIFT provenance disagreement, record-policy choice | Lower third; left timeline wall protected | Human workstation and source-history display centered | Timelines and attributable record blocks, no holographic or anthropomorphic AI imagery |
| `story.bg.trinity.client_review.dawn` | Client Programs review room, morning | Priya's bounded client brief and three ending bands | Lower third; upper-center neutral presentation wall | Priya and Ev portrait anchors survive the center crop | Modest operational meeting room, physical lot summary, no futuristic boardroom spectacle |

## Asset boundary

TASK-030 owns original image production, optimization, hashes, and provenance. Until those assets exist, the Story player may resolve these IDs to accessible neutral placeholders. Missing optional pixels may not prevent script validation, checkpoint recovery, or Match launch; a missing stable registry reference remains a content error.
