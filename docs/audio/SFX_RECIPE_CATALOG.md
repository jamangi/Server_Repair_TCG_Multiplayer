# UI sound recipe catalog

This is the reviewed production handoff for the single-file prototype in [`sound_effects/ui_sound_lab_single.html`](../../sound_effects/ui_sound_lab_single.html). It is an authoring and listening record, not runtime behavior. The machine-readable parameters live in [`sfx-recipe-catalog.json`](sfx-recipe-catalog.json); TASK-032 consumes those bounded values through a separate runtime manifest.

Prototype recipes reviewed: **12**. Production-only extensions: **1** (`Error`, added only because the source audit found reachable, visible in-app rejections).

## Listening criteria

Review used the same criteria for every recipe: semantic readability; audibility at a conservative master gain; fatigue under repetition; tonal collision with another intent; transient harshness; tail length and overlap; and whether the sound claims more success, failure, or spatial movement than the UI actually provides. The intended order of authority is `Error > Cancel > Popup Open > Popup Close > Swipe > Select > Cursor`; silence always wins when an interaction is ineligible.

The prototype parameters were normalized without changing their core shapes. `decay` was not wired into the prototype graph, so the runtime contract replaces it with explicit attack and release milliseconds. Delay dry/wet routing is now explicit, feedback is bounded, and every numeric field in the JSON has a stated synthesis role. No sample, binary asset, network request, framework, package, or Glitch family is approved.

## Reviewed prototypes

| Prototype | Stable recipe ID | Decision | Listening note and production recommendation |
| --- | --- | --- | --- |
| Cancel A | `sfx.cancel.mechanical` | Approved | A 55 ms high-passed noise/square stop is immediate and not alarm-like. Use for abandoning edits or pending actions. |
| Cancel B | `sfx.cancel.crystalline` | Retained variant | The descending triangle is clear but longer and more tonal. Keep reviewed, do not map routinely. |
| Cursor A | `sfx.cursor.mechanical` | Approved | The 28 ms dry square tick has the best mouse-position clarity. Cool down and deduplicate aggressively. |
| Cursor B | `sfx.cursor.noise` | Excluded | The 2.6 kHz noise burst becomes abrasive across dense control grids. It remains catalogued for traceability and is not referenced by UI mappings. |
| Cursor C | `sfx.cursor.rise` | Approved | A soft 40 ms sine rise distinguishes deliberate Tab focus from mouse entry. Never use for restored or scripted focus. |
| Cursor D | `sfx.cursor.fall` | Retained variant | Readable, but the descending contour competes with Cancel. Keep reviewed and unmapped. |
| Popup Close | `sfx.popup.close` | Approved | The compact noise/square fall reads as neutral layer closure. Use only when no edit is being abandoned. |
| Popup Open | `sfx.popup.open` | Approved | A 120 ms triangle rise clearly marks a newly opened modal/detail layer. It takes precedence over Select for the same gesture. |
| Select A | `sfx.select.mechanical` | Approved | A short square/noise acknowledgement remains legible at low gain. This is the routine button, link, tab, and committed-value cue. |
| Select B | `sfx.select.confirm` | Retained variant | The more positive sine rise is deliberately reserved for explicit Preview and completed durable saves/results. |
| Swipe A | `sfx.swipe.forward` | Approved | The rising triangle reads as forward spatial movement. Use for next page, manual Story advance, and accepted drag only. |
| Swipe B | `sfx.swipe.back` | Approved | The falling sine reads as backward movement. Use for previous page/review only. |

## Production Error extension

`sfx.error.rejected` is not presented as a thirteenth prototype. The UI audit found reachable profile validation/storage failures and Match/Story rejections with visible application-owned feedback. A restrained 72 ms triangle/noise fall is therefore authored for `ERROR`. It may play only after the corresponding error is visible; background exceptions, browser-owned validation UI, and duplicate unchanged messages remain silent.

## Overlap and safety recommendations

- Use one shared master bus with a conservative gain ceiling. Recipe gains are trims, not user-volume values.
- Interrupt the previous voice in the same semantic group for Select, Cancel, Popup, Swipe, and Error. Drop repeated Cursor voices during cooldown.
- Cap global and per-recipe polyphony. Stop and disconnect every completed or interrupted source, gain, filter, and delay node.
- Generate short noise buffers locally with an injectable deterministic noise source. Never fetch or decode audio files.
- Treat user volume `0` as fully off. The first trusted activation may unlock audio but must not replay earlier interactions.
- Do not add an audible-only state. Visible labels, pressed/current states, dialogs, notices, and motion remain authoritative.

## Parameter provenance

Every recipe in the JSON carries duration, attack, release, filter type/frequency/Q, delay time/wet mix/feedback, master-safe trim, per-recipe simultaneous-voice limit and interruption group, and one to three sources with type, gain, and frequency envelope. The validator rejects unknown fields and unsupported primitives, checks all numeric bounds, ensures every prototype ID appears exactly once, rejects audio/network asset references, and verifies that excluded recipes are not mapped.
