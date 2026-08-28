# Procedural UI sound synthesis reference

Status: **approved planning reference; no third-party audio dependency or asset pack**

Reviewed: **2026-08-28**

## Reference

The repository-owned prototype at [`sound_effects/ui_sound_lab_single.html`](../../sound_effects/ui_sound_lab_single.html) demonstrates twelve short UI cues synthesized at runtime with the browser's Web Audio API. It is a reference implementation for TASK-031 and TASK-032, not production code to copy wholesale.

The file is self-contained. It contains inline HTML, CSS, and JavaScript and has no external script, stylesheet, font, audio-file, network, framework, or package dependency. Its sound generation uses:

- one `AudioContext` and master `GainNode`;
- square, triangle, and sine oscillators;
- generated noise buffers;
- high-pass filtering;
- short amplitude and pitch envelopes; and
- a small optional delay/wet path.

The twelve examples cover two Cancel cues, four Cursor cues, one Popup Close cue, one Popup Open cue, two Select cues, and two Swipe cues. No Glitch cue is needed. TASK-032 may author one restrained Error recipe from the same primitives after TASK-031 identifies actual error interactions.

## Production boundary

TASK-032 should reuse the synthesis strategy and reviewed parameter ranges, not the prototype's page structure, visual language, event wiring, or labels. Production must:

- expose stable semantic recipe IDs through one shared audio service;
- route all voices through the persisted app-wide master volume;
- unlock on a trusted user gesture without replaying queued sounds;
- use a bounded voice pool and disconnect completed nodes;
- keep synthesized noise deterministic in tests and irrelevant to app state;
- preserve one primary cue per gesture and the catalogue's precedence rules;
- use eligible `pointerenter` and deliberate keyboard-focus transitions for Cursor rather than continuous `pointermove` regions; and
- keep every success, failure, focus, and narrative state fully understandable when audio is unavailable or set to zero.

The prototype's Confirm example can produce both Select and Popup Close for one gesture. That is useful negative evidence: production must select one primary semantic cue instead of copying the double trigger. The prototype also uses a fixed master gain and random noise; production replaces those with the stored 0–100 setting and a test-injectable or seeded noise source.

The prototype stores a `decay` value that its playback functions do not consume, resumes the context without awaiting the result, and uses a routing helper whose parameter names obscure the dry/wet graph. Production should reimplement that small graph explicitly, require every validated recipe field to affect synthesis, and complete or safely abandon audio unlock before requesting a voice. These are reference-review findings, not defects to preserve.

## Repository and rights posture

The former local audio pack was deleted before any audio file or license from it entered Git history. The procedural reference is text source owned with the repository and introduces no shipped third-party audio, audio license, attribution requirement, external service, or runtime download.

Do not add sampled audio, copied waveforms, third-party sound-identifying names, or external synthesis libraries while implementing TASK-032. If a later task proposes external assets or code, review its license and public-static-delivery terms as a new decision rather than treating this document as blanket clearance.
