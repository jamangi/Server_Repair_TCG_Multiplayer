# UI sound interaction catalog

This document is the human review companion to [`sfx-ui-catalog.json`](sfx-ui-catalog.json). The JSON is the canonical source-level audit: each record includes a stable interaction ID, destination, page, region, source modules, control family, mouse/keyboard/touch/programmatic inputs, trigger phase, eligibility, intent, priority, precedence, cooldown, deduplication group, overlap policy, suppression rules, recipe or `null`, implementation selector, audit status, and rationale.

The audit covers the outer shell, Library, Settings, Play Home, Deck gallery/editor, Profile, Story Home/Scene, active Match/tutorial/result/recovery, dialogs, native disclosures, drag affordances, value controls, error paths, and passive transitions. The bounded fallback is deliberately lower priority than every specialized Play mapping; it protects a newly reachable ordinary Play control from accidental silence without overriding Cancel, Popup, Swipe, Error, or an explicit `NO_SFX` rule.

<!-- SFX_UI_TOTAL=68 -->
<!-- SFX_UI_AUDIBLE=55 -->
<!-- SFX_UI_SILENT=13 -->
<!-- SFX_INTENT_CURSOR=2 -->
<!-- SFX_INTENT_NO_SFX=13 -->
<!-- SFX_INTENT_SELECT=29 -->
<!-- SFX_INTENT_POPUP_OPEN=9 -->
<!-- SFX_INTENT_CANCEL=4 -->
<!-- SFX_INTENT_POPUP_CLOSE=4 -->
<!-- SFX_INTENT_ERROR=3 -->
<!-- SFX_INTENT_SWIPE=4 -->

## Coverage totals

| Intent | Audited families | Production rule |
| --- | ---: | --- |
| Cursor | 2 | Mouse entry and deliberate Tab focus only; touch, stationary child movement, restoration, and scripts are suppressed. |
| Select | 29 | Routine accepted activation or committed value; one primary cue per gesture. |
| Cancel | 4 | Abandoning Settings, a Deck edit, Documentation preview, or a Tutorial. Cancel takes precedence over Popup Close. |
| Popup Open | 9 | A new modal/detail/confirmation layer. Popup Open takes precedence over Select. |
| Popup Close | 4 | Neutral dismissal of read-only Library, Deck, Story-history, or Match detail. |
| Error | 3 | Settings, Profile, and Match/Story failures, only after visible feedback. Error supersedes the initiating Select. |
| Swipe | 4 | Manual forward/back page/Story movement and accepted drag commit only. |
| No SFX | 13 | Unlock, touch hover, programmatic transitions, disabled/no-op controls, continuous text/slider input, native confirmation outcomes, Story auto, drag motion, and engine presentation. |

## Destination inventory

| Destination | Interaction IDs |
| --- | --- |
| Outer shell / global | `global.cursor.mouse`, `global.cursor.keyboard`, `global.audio.unlock`, `global.touch.hover`, `global.programmatic.transitions`, `global.disabled.noop`, `global.visible.rejection`, `shell.navigation` |
| Settings | `settings.open`, `settings.close`, `settings.fields.commit`, `settings.volume.input`, `settings.volume.preview`, `settings.save`, `settings.help`, `settings.portability`, `settings.reset`, `settings.native.confirmation`; failures use `global.visible.rejection` |
| Library | `library.search.input`, `library.filters`, `library.tabs`, `library.record.open`, `library.detail.links`, `library.detail.close` |
| Play Home | `home.controls`, `home.ticket.count` |
| Deck gallery | `decks.primary.controls`, `decks.inspect.open`, `decks.dialog.close`, `decks.delete.request` |
| Deck editor | `deck.editor.filters`, `deck.editor.text`, `deck.editor.card.quantity`, `deck.editor.save`, `deck.editor.cancel` |
| Profile | `profile.name.input`, `profile.icon.select`, `profile.save`, `profile.error` |
| Story Home | `story.home.primary`, `story.home.confirmations` |
| Story Scene | `story.scene.choice`, `story.scene.advance`, `story.scene.history.open`, `story.scene.history.close`, `story.scene.misc`, `story.scene.auto` |
| Active Match | `game.ticket.select`, `game.popup.open`, `game.popup.cancel`, `game.popup.close`, `game.bench.controls`, `game.bench.values`, `game.bench.search`, `game.page.previous`, `game.page.next`, `game.cards.controls`, `game.workflow.controls`, `game.giveup`, `game.drag.commit`, `game.drag.motion`, `game.tutorial.controls`, `game.tutorial.exit`, `game.disclosures`, `game.visible.rejection`, `game.engine.passive` |
| Match result | `game.result.controls` plus the shared archive/popup/rejection families |
| Remaining Play controls | `play.route.fallback` at priority 20, below every specialized mapping |

## Source-audit conclusions

- A semantic cue belongs to an accepted user operation, not to rerendering, route restoration, focus placement, Worker results, motion, evidence reveal, or Story timers.
- Native `confirm()` buttons are browser-owned and cannot be individually mapped safely. The application cues opening the confirmation layer; the native outcome is explicit `NO_SFX`.
- Text and search `input` events are silent. Native selects and checkboxes cue once on `change`. The sound-volume range is silent on every `input`; only its explicit Preview button auditions audio.
- Popup open/close/cancel mappings name the control that owns the modal transition. Backdrop and Escape routes use the same semantic through the dialog helper, without double-playing a click mapping.
- Card drag sounds only after a legal drop commits. Pointer move, dragover, invalid targets, cancel, and snapback remain silent.
- Error cues are requested after the application has rendered the visible rejection. They do not replace status text, `role="alert"`, disabled state, or recovery links.

## Review and maintenance workflow

1. Run `node tools/validate-sfx-catalog.mjs`. It checks IDs, recipe references, intent compatibility, bounds, source-module existence, prototype provenance, destination coverage, totals, and Markdown reconciliation.
2. Run `node --test tests/task-031-sfx-catalog.test.mjs`. It checks input/event coverage and the source-level route/module inventory.
3. For a new control family, add or refine a higher-priority record rather than relying indefinitely on the fallback. Assign exactly one semantic primary intent or `NO_SFX` with a reason.
4. For runtime changes, keep stable IDs and parameter manifests aligned with this catalog. A recipe variation is data; page modules must never embed oscillator parameters.
5. Re-audit desktop mouse/keyboard and touch eligibility. Cursor behavior must remain silent for touch and programmatic focus.
