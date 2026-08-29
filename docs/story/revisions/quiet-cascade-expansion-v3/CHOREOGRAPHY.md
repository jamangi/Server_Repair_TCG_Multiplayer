# Quiet Cascade expansion choreography

Status: **TASK-044 non-live candidate review**

## Presentation contract

- Exact reuse: 4 approved backgrounds, 8 approved character poses, and 0 transients. All 6 episode inventories independently equal their locked blueprint lists; no asset can be borrowed from another episode to satisfy only the flattened union. No pixel coordinates, new masters, or unregistered pose inference appears in content.
- Speaker visibility: all speaking statements were replayed through all 256 choice/outcome routes; no speaker is absent from the character layer when their line is displayed.
- Motion: authored transitions use `CUT`, `DISSOLVE`, `FADE` only. Reduced motion replaces every transition immediately while retaining the same scene, pose, text, focus order, Match boundary, checkpoint, and announcement. Animation completion never advances Story authority.
- Reduced data: every referenced production asset has an approved reduced-data derivative. Asset failure falls back within the same layer; dialogue and Match actions remain usable.
- Mobile/reflow: the 420-character editorial review ceiling applies to each localized display surface. Long copy scrolls in the HTML screen layer; no required fact depends on crop, lighting, pose, or audio.
- Match handoff: `start_match` persists pre-Match state, launches the ordinary Worker-authoritative Match, accepts one valid normalized result, persists post-Match state, then enters the explicit return label. Active Match state is never presented as resumable.

## Transition vocabulary

| Transition | Full-motion cue | Reduced-motion equivalent | Semantic authority |
| --- | --- | --- | --- |
| `CUT` | Immediate editorial replacement | Same immediate replacement | none |
| `FADE` | Short opacity crossfade | Immediate replacement with focus/announcement retained | none |
| `DISSOLVE` | Gentle scene/pose dissolve | Immediate replacement with text retained | none |
| `SLIDE` | Directional layer arrival where authored | Immediate replacement without travel | none |
| `RUNTIME_HANDOFF` | Story surface yields to Match, then returns after acceptance | Identical route/focus transition without motion | Match and checkpoint authority remains runtime-owned |

## Shift 7: The Fourth Pair

- Match: `story.match.qc02.shift07.socket_contacts`; return label `story.qc02.shift07.return`
- Per-episode topology lock: **exact blueprint equality**
- Background reuse: `story.bg.trinity.core_floor.night_storm`, `story.bg.trinity.trace.night`
- Character-pose reuse: `story.character.malik_okoye:focused`, `story.character.sora_chen:approving`, `story.character.sora_chen:focused`
- Transients: none
- Longest localized display surface: 189 characters / 28 words at `text.qc02.s07.entry.04`
- Exhaustive speaker-visibility violations: 0

| # | Nearest label | Action | Stable tag/ID | Asset, pose, or target | Position | Transition | Checkpoint |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 4 | story.qc02.shift07.entry | SCENE | story.scene.qc02.shift07.entry | story.bg.trinity.trace.night | FULL | DISSOLVE | checkpoint.qc02.shift07.entry |
| 5 | story.qc02.shift07.entry | HIDE_CHARACTERS | cast.sora | cast.sora | N/A | CUT | — |
| 6 | story.qc02.shift07.entry | HIDE_CHARACTERS | cast.malik | cast.malik | N/A | CUT | — |
| 7 | story.qc02.shift07.entry | HIDE_CHARACTERS | cast.hana | cast.hana | N/A | CUT | — |
| 8 | story.qc02.shift07.entry | HIDE_CHARACTERS | cast.jonah | cast.jonah | N/A | CUT | — |
| 9 | story.qc02.shift07.entry | SHOW_CHARACTER | cast.sora | story.character.sora_chen:focused | RIGHT | FADE | — |
| 10 | story.qc02.shift07.entry | SHOW_CHARACTER | cast.malik | story.character.malik_okoye:focused | LEFT | FADE | — |
| 24 | story.qc02.shift07.match | MATCH_BOUNDARY | story.match.qc02.shift07.socket_contacts | story.qc02.shift07.return | N/A | RUNTIME_HANDOFF | checkpoint.qc02.shift07.pre_match / checkpoint.qc02.shift07.post_match |
| 28 | story.qc02.shift07.success | SCENE | story.scene.qc02.shift07.success | story.bg.trinity.core_floor.night_storm | FULL | DISSOLVE | — |
| 29 | story.qc02.shift07.success | HIDE_CHARACTERS | cast.sora | cast.sora | N/A | CUT | — |
| 30 | story.qc02.shift07.success | HIDE_CHARACTERS | cast.malik | cast.malik | N/A | CUT | — |
| 31 | story.qc02.shift07.success | HIDE_CHARACTERS | cast.hana | cast.hana | N/A | CUT | — |
| 32 | story.qc02.shift07.success | HIDE_CHARACTERS | cast.jonah | cast.jonah | N/A | CUT | — |
| 33 | story.qc02.shift07.success | SHOW_CHARACTER | cast.sora | story.character.sora_chen:approving | RIGHT | FADE | — |
| 34 | story.qc02.shift07.success | SHOW_CHARACTER | cast.malik | story.character.malik_okoye:focused | LEFT | FADE | — |
| 39 | story.qc02.shift07.abandon | SCENE | story.scene.qc02.shift07.abandon | story.bg.trinity.core_floor.night_storm | FULL | DISSOLVE | — |
| 40 | story.qc02.shift07.abandon | HIDE_CHARACTERS | cast.sora | cast.sora | N/A | CUT | — |
| 41 | story.qc02.shift07.abandon | HIDE_CHARACTERS | cast.malik | cast.malik | N/A | CUT | — |
| 42 | story.qc02.shift07.abandon | HIDE_CHARACTERS | cast.hana | cast.hana | N/A | CUT | — |
| 43 | story.qc02.shift07.abandon | HIDE_CHARACTERS | cast.jonah | cast.jonah | N/A | CUT | — |
| 44 | story.qc02.shift07.abandon | SHOW_CHARACTER | cast.sora | story.character.sora_chen:focused | RIGHT | FADE | — |
| 45 | story.qc02.shift07.abandon | SHOW_CHARACTER | cast.malik | story.character.malik_okoye:focused | LEFT | FADE | — |
| 50 | story.qc02.shift07.follow_on | SCENE | story.scene.qc02.shift07.follow_on | story.bg.trinity.core_floor.night_storm | FULL | DISSOLVE | — |
| 51 | story.qc02.shift07.follow_on | HIDE_CHARACTERS | cast.sora | cast.sora | N/A | CUT | — |
| 52 | story.qc02.shift07.follow_on | HIDE_CHARACTERS | cast.malik | cast.malik | N/A | CUT | — |
| 53 | story.qc02.shift07.follow_on | HIDE_CHARACTERS | cast.hana | cast.hana | N/A | CUT | — |
| 54 | story.qc02.shift07.follow_on | HIDE_CHARACTERS | cast.jonah | cast.jonah | N/A | CUT | — |
| 55 | story.qc02.shift07.follow_on | SHOW_CHARACTER | cast.malik | story.character.malik_okoye:focused | LEFT | FADE | — |

## Shift 8: Across Both Bays

- Match: `story.match.qc02.shift08.power_distribution`; return label `story.qc02.shift08.return`
- Per-episode topology lock: **exact blueprint equality**
- Background reuse: `story.bg.trinity.core_floor.night_storm`, `story.bg.trinity.validation_gate.predawn`
- Character-pose reuse: `story.character.hana_park:relief`, `story.character.hana_park:skeptical`, `story.character.malik_okoye:defensive`, `story.character.malik_okoye:focused`
- Transients: none
- Longest localized display surface: 240 characters / 36 words at `text.qc02.s08.entry.02`
- Exhaustive speaker-visibility violations: 0

| # | Nearest label | Action | Stable tag/ID | Asset, pose, or target | Position | Transition | Checkpoint |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | story.qc02.shift08.entry | SCENE | story.scene.qc02.shift08.entry | story.bg.trinity.core_floor.night_storm | FULL | DISSOLVE | checkpoint.qc02.shift08.entry |
| 2 | story.qc02.shift08.entry | HIDE_CHARACTERS | cast.sora | cast.sora | N/A | CUT | — |
| 3 | story.qc02.shift08.entry | HIDE_CHARACTERS | cast.malik | cast.malik | N/A | CUT | — |
| 4 | story.qc02.shift08.entry | HIDE_CHARACTERS | cast.hana | cast.hana | N/A | CUT | — |
| 5 | story.qc02.shift08.entry | HIDE_CHARACTERS | cast.jonah | cast.jonah | N/A | CUT | — |
| 6 | story.qc02.shift08.entry | SHOW_CHARACTER | cast.malik | story.character.malik_okoye:focused | LEFT | FADE | — |
| 7 | story.qc02.shift08.entry | SHOW_CHARACTER | cast.hana | story.character.hana_park:skeptical | RIGHT | FADE | — |
| 14 | story.qc02.shift08.match | MATCH_BOUNDARY | story.match.qc02.shift08.power_distribution | story.qc02.shift08.return | N/A | RUNTIME_HANDOFF | checkpoint.qc02.shift08.pre_match / checkpoint.qc02.shift08.post_match |
| 18 | story.qc02.shift08.success | SCENE | story.scene.qc02.shift08.success | story.bg.trinity.validation_gate.predawn | FULL | DISSOLVE | — |
| 19 | story.qc02.shift08.success | HIDE_CHARACTERS | cast.sora | cast.sora | N/A | CUT | — |
| 20 | story.qc02.shift08.success | HIDE_CHARACTERS | cast.malik | cast.malik | N/A | CUT | — |
| 21 | story.qc02.shift08.success | HIDE_CHARACTERS | cast.hana | cast.hana | N/A | CUT | — |
| 22 | story.qc02.shift08.success | HIDE_CHARACTERS | cast.jonah | cast.jonah | N/A | CUT | — |
| 23 | story.qc02.shift08.success | SHOW_CHARACTER | cast.malik | story.character.malik_okoye:focused | LEFT | FADE | — |
| 24 | story.qc02.shift08.success | SHOW_CHARACTER | cast.hana | story.character.hana_park:relief | RIGHT | FADE | — |
| 29 | story.qc02.shift08.abandon | SCENE | story.scene.qc02.shift08.abandon | story.bg.trinity.validation_gate.predawn | FULL | DISSOLVE | — |
| 30 | story.qc02.shift08.abandon | HIDE_CHARACTERS | cast.sora | cast.sora | N/A | CUT | — |
| 31 | story.qc02.shift08.abandon | HIDE_CHARACTERS | cast.malik | cast.malik | N/A | CUT | — |
| 32 | story.qc02.shift08.abandon | HIDE_CHARACTERS | cast.hana | cast.hana | N/A | CUT | — |
| 33 | story.qc02.shift08.abandon | HIDE_CHARACTERS | cast.jonah | cast.jonah | N/A | CUT | — |
| 34 | story.qc02.shift08.abandon | SHOW_CHARACTER | cast.malik | story.character.malik_okoye:defensive | LEFT | FADE | — |
| 35 | story.qc02.shift08.abandon | SHOW_CHARACTER | cast.hana | story.character.hana_park:skeptical | RIGHT | FADE | — |
| 40 | story.qc02.shift08.follow_on | SCENE | story.scene.qc02.shift08.follow_on | story.bg.trinity.validation_gate.predawn | FULL | DISSOLVE | — |
| 41 | story.qc02.shift08.follow_on | HIDE_CHARACTERS | cast.sora | cast.sora | N/A | CUT | — |
| 42 | story.qc02.shift08.follow_on | HIDE_CHARACTERS | cast.malik | cast.malik | N/A | CUT | — |
| 43 | story.qc02.shift08.follow_on | HIDE_CHARACTERS | cast.hana | cast.hana | N/A | CUT | — |
| 44 | story.qc02.shift08.follow_on | HIDE_CHARACTERS | cast.jonah | cast.jonah | N/A | CUT | — |
| 45 | story.qc02.shift08.follow_on | SHOW_CHARACTER | cast.hana | story.character.hana_park:relief | RIGHT | FADE | — |

## Shift 9: Before the Drop

- Match: `story.match.qc02.shift09.predictive_drive`; return label `story.qc02.shift09.return`
- Per-episode topology lock: **exact blueprint equality**
- Background reuse: `story.bg.trinity.core_floor.night_storm`, `story.bg.trinity.knowledge_systems.night`
- Character-pose reuse: `story.character.hana_park:relief`, `story.character.hana_park:skeptical`, `story.character.jonah_reed:thoughtful`
- Transients: none
- Longest localized display surface: 223 characters / 38 words at `text.qc02.s09.entry.02`
- Exhaustive speaker-visibility violations: 0

| # | Nearest label | Action | Stable tag/ID | Asset, pose, or target | Position | Transition | Checkpoint |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | story.qc02.shift09.entry | SCENE | story.scene.qc02.shift09.entry | story.bg.trinity.core_floor.night_storm | FULL | DISSOLVE | checkpoint.qc02.shift09.entry |
| 2 | story.qc02.shift09.entry | HIDE_CHARACTERS | cast.sora | cast.sora | N/A | CUT | — |
| 3 | story.qc02.shift09.entry | HIDE_CHARACTERS | cast.malik | cast.malik | N/A | CUT | — |
| 4 | story.qc02.shift09.entry | HIDE_CHARACTERS | cast.hana | cast.hana | N/A | CUT | — |
| 5 | story.qc02.shift09.entry | HIDE_CHARACTERS | cast.jonah | cast.jonah | N/A | CUT | — |
| 6 | story.qc02.shift09.entry | SHOW_CHARACTER | cast.jonah | story.character.jonah_reed:thoughtful | LEFT | FADE | — |
| 7 | story.qc02.shift09.entry | SHOW_CHARACTER | cast.hana | story.character.hana_park:skeptical | RIGHT | FADE | — |
| 14 | story.qc02.shift09.match | MATCH_BOUNDARY | story.match.qc02.shift09.predictive_drive | story.qc02.shift09.return | N/A | RUNTIME_HANDOFF | checkpoint.qc02.shift09.pre_match / checkpoint.qc02.shift09.post_match |
| 18 | story.qc02.shift09.success | SCENE | story.scene.qc02.shift09.success | story.bg.trinity.knowledge_systems.night | FULL | DISSOLVE | — |
| 19 | story.qc02.shift09.success | HIDE_CHARACTERS | cast.sora | cast.sora | N/A | CUT | — |
| 20 | story.qc02.shift09.success | HIDE_CHARACTERS | cast.malik | cast.malik | N/A | CUT | — |
| 21 | story.qc02.shift09.success | HIDE_CHARACTERS | cast.hana | cast.hana | N/A | CUT | — |
| 22 | story.qc02.shift09.success | HIDE_CHARACTERS | cast.jonah | cast.jonah | N/A | CUT | — |
| 23 | story.qc02.shift09.success | SHOW_CHARACTER | cast.jonah | story.character.jonah_reed:thoughtful | LEFT | FADE | — |
| 24 | story.qc02.shift09.success | SHOW_CHARACTER | cast.hana | story.character.hana_park:relief | RIGHT | FADE | — |
| 29 | story.qc02.shift09.abandon | SCENE | story.scene.qc02.shift09.abandon | story.bg.trinity.knowledge_systems.night | FULL | DISSOLVE | — |
| 30 | story.qc02.shift09.abandon | HIDE_CHARACTERS | cast.sora | cast.sora | N/A | CUT | — |
| 31 | story.qc02.shift09.abandon | HIDE_CHARACTERS | cast.malik | cast.malik | N/A | CUT | — |
| 32 | story.qc02.shift09.abandon | HIDE_CHARACTERS | cast.hana | cast.hana | N/A | CUT | — |
| 33 | story.qc02.shift09.abandon | HIDE_CHARACTERS | cast.jonah | cast.jonah | N/A | CUT | — |
| 34 | story.qc02.shift09.abandon | SHOW_CHARACTER | cast.jonah | story.character.jonah_reed:thoughtful | LEFT | FADE | — |
| 35 | story.qc02.shift09.abandon | SHOW_CHARACTER | cast.hana | story.character.hana_park:skeptical | RIGHT | FADE | — |
| 40 | story.qc02.shift09.follow_on | SCENE | story.scene.qc02.shift09.follow_on | story.bg.trinity.knowledge_systems.night | FULL | DISSOLVE | — |
| 41 | story.qc02.shift09.follow_on | HIDE_CHARACTERS | cast.sora | cast.sora | N/A | CUT | — |
| 42 | story.qc02.shift09.follow_on | HIDE_CHARACTERS | cast.malik | cast.malik | N/A | CUT | — |
| 43 | story.qc02.shift09.follow_on | HIDE_CHARACTERS | cast.hana | cast.hana | N/A | CUT | — |
| 44 | story.qc02.shift09.follow_on | HIDE_CHARACTERS | cast.jonah | cast.jonah | N/A | CUT | — |
| 45 | story.qc02.shift09.follow_on | SHOW_CHARACTER | cast.jonah | story.character.jonah_reed:thoughtful | LEFT | FADE | — |
| 46 | story.qc02.shift09.follow_on | SHOW_CHARACTER | cast.hana | story.character.hana_park:skeptical | RIGHT | FADE | — |

## Shift 10: The Alert That Stayed

- Match: `story.match.qc02.shift10.stale_alert`; return label `story.qc02.shift10.return`
- Per-episode topology lock: **exact blueprint equality**
- Background reuse: `story.bg.trinity.knowledge_systems.night`
- Character-pose reuse: `story.character.hana_park:relief`, `story.character.hana_park:skeptical`, `story.character.jonah_reed:defensive`, `story.character.jonah_reed:thoughtful`
- Transients: none
- Longest localized display surface: 251 characters / 40 words at `text.qc02.s10.entry.03`
- Exhaustive speaker-visibility violations: 0

| # | Nearest label | Action | Stable tag/ID | Asset, pose, or target | Position | Transition | Checkpoint |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | story.qc02.shift10.entry | SCENE | story.scene.qc02.shift10.entry | story.bg.trinity.knowledge_systems.night | FULL | DISSOLVE | checkpoint.qc02.shift10.entry |
| 2 | story.qc02.shift10.entry | HIDE_CHARACTERS | cast.sora | cast.sora | N/A | CUT | — |
| 3 | story.qc02.shift10.entry | HIDE_CHARACTERS | cast.malik | cast.malik | N/A | CUT | — |
| 4 | story.qc02.shift10.entry | HIDE_CHARACTERS | cast.hana | cast.hana | N/A | CUT | — |
| 5 | story.qc02.shift10.entry | HIDE_CHARACTERS | cast.jonah | cast.jonah | N/A | CUT | — |
| 6 | story.qc02.shift10.entry | SHOW_CHARACTER | cast.jonah | story.character.jonah_reed:defensive | LEFT | FADE | — |
| 7 | story.qc02.shift10.entry | SHOW_CHARACTER | cast.hana | story.character.hana_park:skeptical | RIGHT | FADE | — |
| 21 | story.qc02.shift10.match | MATCH_BOUNDARY | story.match.qc02.shift10.stale_alert | story.qc02.shift10.return | N/A | RUNTIME_HANDOFF | checkpoint.qc02.shift10.pre_match / checkpoint.qc02.shift10.post_match |
| 25 | story.qc02.shift10.success | SCENE | story.scene.qc02.shift10.success | story.bg.trinity.knowledge_systems.night | FULL | DISSOLVE | — |
| 26 | story.qc02.shift10.success | HIDE_CHARACTERS | cast.sora | cast.sora | N/A | CUT | — |
| 27 | story.qc02.shift10.success | HIDE_CHARACTERS | cast.malik | cast.malik | N/A | CUT | — |
| 28 | story.qc02.shift10.success | HIDE_CHARACTERS | cast.hana | cast.hana | N/A | CUT | — |
| 29 | story.qc02.shift10.success | HIDE_CHARACTERS | cast.jonah | cast.jonah | N/A | CUT | — |
| 30 | story.qc02.shift10.success | SHOW_CHARACTER | cast.jonah | story.character.jonah_reed:thoughtful | LEFT | FADE | — |
| 31 | story.qc02.shift10.success | SHOW_CHARACTER | cast.hana | story.character.hana_park:relief | RIGHT | FADE | — |
| 36 | story.qc02.shift10.abandon | SCENE | story.scene.qc02.shift10.abandon | story.bg.trinity.knowledge_systems.night | FULL | DISSOLVE | — |
| 37 | story.qc02.shift10.abandon | HIDE_CHARACTERS | cast.sora | cast.sora | N/A | CUT | — |
| 38 | story.qc02.shift10.abandon | HIDE_CHARACTERS | cast.malik | cast.malik | N/A | CUT | — |
| 39 | story.qc02.shift10.abandon | HIDE_CHARACTERS | cast.hana | cast.hana | N/A | CUT | — |
| 40 | story.qc02.shift10.abandon | HIDE_CHARACTERS | cast.jonah | cast.jonah | N/A | CUT | — |
| 41 | story.qc02.shift10.abandon | SHOW_CHARACTER | cast.jonah | story.character.jonah_reed:thoughtful | LEFT | FADE | — |
| 42 | story.qc02.shift10.abandon | SHOW_CHARACTER | cast.hana | story.character.hana_park:skeptical | RIGHT | FADE | — |
| 47 | story.qc02.shift10.follow_on | SCENE | story.scene.qc02.shift10.follow_on | story.bg.trinity.knowledge_systems.night | FULL | DISSOLVE | — |
| 48 | story.qc02.shift10.follow_on | HIDE_CHARACTERS | cast.sora | cast.sora | N/A | CUT | — |
| 49 | story.qc02.shift10.follow_on | HIDE_CHARACTERS | cast.malik | cast.malik | N/A | CUT | — |
| 50 | story.qc02.shift10.follow_on | HIDE_CHARACTERS | cast.hana | cast.hana | N/A | CUT | — |
| 51 | story.qc02.shift10.follow_on | HIDE_CHARACTERS | cast.jonah | cast.jonah | N/A | CUT | — |
| 52 | story.qc02.shift10.follow_on | SHOW_CHARACTER | cast.jonah | story.character.jonah_reed:thoughtful | LEFT | FADE | — |
| 53 | story.qc02.shift10.follow_on | SHOW_CHARACTER | cast.hana | story.character.hana_park:relief | RIGHT | FADE | — |

## Shift 11: Version A, Version B

- Match: `story.match.qc02.shift11.firmware_regression`; return label `story.qc02.shift11.return`
- Per-episode topology lock: **exact blueprint equality**
- Background reuse: `story.bg.trinity.core_floor.night_storm`, `story.bg.trinity.trace.night`
- Character-pose reuse: `story.character.malik_okoye:defensive`, `story.character.malik_okoye:focused`, `story.character.sora_chen:approving`, `story.character.sora_chen:focused`
- Transients: none
- Longest localized display surface: 266 characters / 37 words at `text.qc02.s11.follow.01`
- Exhaustive speaker-visibility violations: 0

| # | Nearest label | Action | Stable tag/ID | Asset, pose, or target | Position | Transition | Checkpoint |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | story.qc02.shift11.entry | SCENE | story.scene.qc02.shift11.entry | story.bg.trinity.core_floor.night_storm | FULL | DISSOLVE | checkpoint.qc02.shift11.entry |
| 2 | story.qc02.shift11.entry | HIDE_CHARACTERS | cast.sora | cast.sora | N/A | CUT | — |
| 3 | story.qc02.shift11.entry | HIDE_CHARACTERS | cast.malik | cast.malik | N/A | CUT | — |
| 4 | story.qc02.shift11.entry | HIDE_CHARACTERS | cast.hana | cast.hana | N/A | CUT | — |
| 5 | story.qc02.shift11.entry | HIDE_CHARACTERS | cast.jonah | cast.jonah | N/A | CUT | — |
| 6 | story.qc02.shift11.entry | SHOW_CHARACTER | cast.malik | story.character.malik_okoye:defensive | LEFT | FADE | — |
| 7 | story.qc02.shift11.entry | SHOW_CHARACTER | cast.sora | story.character.sora_chen:focused | RIGHT | FADE | — |
| 14 | story.qc02.shift11.match | MATCH_BOUNDARY | story.match.qc02.shift11.firmware_regression | story.qc02.shift11.return | N/A | RUNTIME_HANDOFF | checkpoint.qc02.shift11.pre_match / checkpoint.qc02.shift11.post_match |
| 18 | story.qc02.shift11.success | SCENE | story.scene.qc02.shift11.success | story.bg.trinity.trace.night | FULL | DISSOLVE | — |
| 19 | story.qc02.shift11.success | HIDE_CHARACTERS | cast.sora | cast.sora | N/A | CUT | — |
| 20 | story.qc02.shift11.success | HIDE_CHARACTERS | cast.malik | cast.malik | N/A | CUT | — |
| 21 | story.qc02.shift11.success | HIDE_CHARACTERS | cast.hana | cast.hana | N/A | CUT | — |
| 22 | story.qc02.shift11.success | HIDE_CHARACTERS | cast.jonah | cast.jonah | N/A | CUT | — |
| 23 | story.qc02.shift11.success | SHOW_CHARACTER | cast.malik | story.character.malik_okoye:focused | LEFT | FADE | — |
| 24 | story.qc02.shift11.success | SHOW_CHARACTER | cast.sora | story.character.sora_chen:approving | RIGHT | FADE | — |
| 29 | story.qc02.shift11.abandon | SCENE | story.scene.qc02.shift11.abandon | story.bg.trinity.trace.night | FULL | DISSOLVE | — |
| 30 | story.qc02.shift11.abandon | HIDE_CHARACTERS | cast.sora | cast.sora | N/A | CUT | — |
| 31 | story.qc02.shift11.abandon | HIDE_CHARACTERS | cast.malik | cast.malik | N/A | CUT | — |
| 32 | story.qc02.shift11.abandon | HIDE_CHARACTERS | cast.hana | cast.hana | N/A | CUT | — |
| 33 | story.qc02.shift11.abandon | HIDE_CHARACTERS | cast.jonah | cast.jonah | N/A | CUT | — |
| 34 | story.qc02.shift11.abandon | SHOW_CHARACTER | cast.malik | story.character.malik_okoye:focused | LEFT | FADE | — |
| 35 | story.qc02.shift11.abandon | SHOW_CHARACTER | cast.sora | story.character.sora_chen:focused | RIGHT | FADE | — |
| 40 | story.qc02.shift11.follow_on | SCENE | story.scene.qc02.shift11.follow_on | story.bg.trinity.trace.night | FULL | DISSOLVE | — |
| 41 | story.qc02.shift11.follow_on | HIDE_CHARACTERS | cast.sora | cast.sora | N/A | CUT | — |
| 42 | story.qc02.shift11.follow_on | HIDE_CHARACTERS | cast.malik | cast.malik | N/A | CUT | — |
| 43 | story.qc02.shift11.follow_on | HIDE_CHARACTERS | cast.hana | cast.hana | N/A | CUT | — |
| 44 | story.qc02.shift11.follow_on | HIDE_CHARACTERS | cast.jonah | cast.jonah | N/A | CUT | — |
| 45 | story.qc02.shift11.follow_on | SHOW_CHARACTER | cast.sora | story.character.sora_chen:focused | RIGHT | FADE | — |
| 46 | story.qc02.shift11.follow_on | SHOW_CHARACTER | cast.malik | story.character.malik_okoye:focused | LEFT | FADE | — |

## Shift 12: Recovery State

- Match: `story.match.qc02.shift12.bmc_recovery`; return label `story.qc02.shift12.return`
- Per-episode topology lock: **exact blueprint equality**
- Background reuse: `story.bg.trinity.trace.night`, `story.bg.trinity.validation_gate.predawn`
- Character-pose reuse: `story.character.hana_park:relief`, `story.character.hana_park:skeptical`, `story.character.jonah_reed:thoughtful`, `story.character.sora_chen:approving`, `story.character.sora_chen:focused`
- Transients: none
- Longest localized display surface: 343 characters / 48 words at `text.qc02.s12.entry.03`
- Exhaustive speaker-visibility violations: 0

| # | Nearest label | Action | Stable tag/ID | Asset, pose, or target | Position | Transition | Checkpoint |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | story.qc02.shift12.entry | SCENE | story.scene.qc02.shift12.entry | story.bg.trinity.trace.night | FULL | DISSOLVE | checkpoint.qc02.shift12.entry |
| 2 | story.qc02.shift12.entry | HIDE_CHARACTERS | cast.sora | cast.sora | N/A | CUT | — |
| 3 | story.qc02.shift12.entry | HIDE_CHARACTERS | cast.malik | cast.malik | N/A | CUT | — |
| 4 | story.qc02.shift12.entry | HIDE_CHARACTERS | cast.hana | cast.hana | N/A | CUT | — |
| 5 | story.qc02.shift12.entry | HIDE_CHARACTERS | cast.jonah | cast.jonah | N/A | CUT | — |
| 6 | story.qc02.shift12.entry | SHOW_CHARACTER | cast.jonah | story.character.jonah_reed:thoughtful | LEFT | FADE | — |
| 7 | story.qc02.shift12.entry | SHOW_CHARACTER | cast.sora | story.character.sora_chen:focused | RIGHT | FADE | — |
| 15 | story.qc02.shift12.match | MATCH_BOUNDARY | story.match.qc02.shift12.bmc_recovery | story.qc02.shift12.return | N/A | RUNTIME_HANDOFF | checkpoint.qc02.shift12.pre_match / checkpoint.qc02.shift12.post_match |
| 19 | story.qc02.shift12.success | SCENE | story.scene.qc02.shift12.success | story.bg.trinity.validation_gate.predawn | FULL | DISSOLVE | — |
| 20 | story.qc02.shift12.success | HIDE_CHARACTERS | cast.sora | cast.sora | N/A | CUT | — |
| 21 | story.qc02.shift12.success | HIDE_CHARACTERS | cast.malik | cast.malik | N/A | CUT | — |
| 22 | story.qc02.shift12.success | HIDE_CHARACTERS | cast.hana | cast.hana | N/A | CUT | — |
| 23 | story.qc02.shift12.success | HIDE_CHARACTERS | cast.jonah | cast.jonah | N/A | CUT | — |
| 24 | story.qc02.shift12.success | SHOW_CHARACTER | cast.jonah | story.character.jonah_reed:thoughtful | LEFT | FADE | — |
| 25 | story.qc02.shift12.success | SHOW_CHARACTER | cast.hana | story.character.hana_park:relief | RIGHT | FADE | — |
| 30 | story.qc02.shift12.abandon | SCENE | story.scene.qc02.shift12.abandon | story.bg.trinity.validation_gate.predawn | FULL | DISSOLVE | — |
| 31 | story.qc02.shift12.abandon | HIDE_CHARACTERS | cast.sora | cast.sora | N/A | CUT | — |
| 32 | story.qc02.shift12.abandon | HIDE_CHARACTERS | cast.malik | cast.malik | N/A | CUT | — |
| 33 | story.qc02.shift12.abandon | HIDE_CHARACTERS | cast.hana | cast.hana | N/A | CUT | — |
| 34 | story.qc02.shift12.abandon | HIDE_CHARACTERS | cast.jonah | cast.jonah | N/A | CUT | — |
| 35 | story.qc02.shift12.abandon | SHOW_CHARACTER | cast.jonah | story.character.jonah_reed:thoughtful | LEFT | FADE | — |
| 36 | story.qc02.shift12.abandon | SHOW_CHARACTER | cast.hana | story.character.hana_park:skeptical | RIGHT | FADE | — |
| 41 | story.qc02.shift12.follow_on | SCENE | story.scene.qc02.shift12.follow_on | story.bg.trinity.validation_gate.predawn | FULL | DISSOLVE | — |
| 42 | story.qc02.shift12.follow_on | HIDE_CHARACTERS | cast.sora | cast.sora | N/A | CUT | — |
| 43 | story.qc02.shift12.follow_on | HIDE_CHARACTERS | cast.malik | cast.malik | N/A | CUT | — |
| 44 | story.qc02.shift12.follow_on | HIDE_CHARACTERS | cast.hana | cast.hana | N/A | CUT | — |
| 45 | story.qc02.shift12.follow_on | HIDE_CHARACTERS | cast.jonah | cast.jonah | N/A | CUT | — |
| 46 | story.qc02.shift12.follow_on | SHOW_CHARACTER | cast.hana | story.character.hana_park:relief | RIGHT | FADE | — |
| 47 | story.qc02.shift12.follow_on | SHOW_CHARACTER | cast.sora | story.character.sora_chen:approving | LEFT | FADE | — |
