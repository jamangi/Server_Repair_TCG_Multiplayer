# TASK-028-HIGH: Integrate the Story player and Match bridge

## Status

**Completed 2026-08-28.** STORY-002 A, STORY-004 A, and STORY-005 A remain synchronized into this contract. See the shared [TASK-026 through TASK-030 completion record](../story/TASK-026-030-COMPLETION.md).

## Objective

Add a polished, accessible Story destination to the static Play shell and connect the declarative runtime to real local Matches without weakening the Worker authority boundary or claiming that active Matches are resumable.

## Navigation and home

- Add `Story` after `Profile` and before `Local solo` in the Play sub-navigation. Preserve Library/Play top-level behavior and current Home, Decks, Profile, and Local solo routes.
- Story Home shows current chapter/shift, last durable checkpoint, active deck/preflight state, a clear Continue/Begin control, chapter/history access permitted by authored state, and replay choices where approved.
- Navigating away, closing, refreshing, or losing the page never advances a scene or fabricates completion. Returning uses the durable checkpoint contract and explains when an interrupted segment will restart.

## Story scene player

- Review the project-owned [`choice/dialogue reference`](../ui-plan/ui-reference_images/story-mode-choice-dialogue-reference.png) and [`dialogue screen reference`](../ui-plan/ui-reference_images/story-mode-dialogue-inflow-reference.png) as composition targets. Their exact text, pictured people, controls, and scene state are illustrative rather than canonical.
- Render TASK-026's display model: persistent background, replaceable tagged characters, transient overlays, and accessible HTML screen layer.
- Support speaker/name box, dialogue/narration, choices, transcript/history, auto/advance controls only where safe, keyboard/touch, focus visibility, readable zoom/reflow, captions/text alternatives, reduced motion, and motion cancellation.
- Use original placeholders/resolvers until TASK-030. Missing optional art must not block the story; missing required statements, characters, or Match references fail with a useful recovery path.
- The player cannot skip through a pending choice, double-advance a statement, or activate obscured controls during a transition. Selecting a choice records the typed decision and follows the interpreter's explicit destination atomically; DOM routing cannot choose the branch independently.

## Match bridge

- `start_match` resolves one reviewed scenario reference, runs deck/preflight/solvability checks, persists the pre-Match checkpoint, and starts the ordinary Worker-authoritative Match through the existing route.
- Carry a versioned Story context token containing only approved identifiers and return labels. It grants no gameplay authority and cannot be forged through query parameters or local DOM state.
- A Story Match uses the same engine, Builder, Cards, tutorials/help, Evidence visibility, Worklog, score settlement, Give Up, and result projection as Local solo.
- The end screen shows `Continue Story` only for a validated Story-origin context after an authoritative terminal result. Continuing records the normalized result atomically, writes the post-Match checkpoint, and resumes the approved return label exactly once.
- Local solo never displays the Story continuation. A stale/mismatched Story token fails closed without losing the Match record.
- Under the recommended interruption policy, leaving/reloading an active Story Match discards that non-resumable Match and offers to restart it from the pre-Match Story checkpoint. Do not label this as resuming the Match.

## Persistence and portability

- Include versioned Story progress in Settings export/import with preview, validation, migration, atomic commit/rollback, and clear conflict behavior.
- Do not duplicate or overwrite profile lifetime statistics. Story branches consume normalized results through the Story record while the engine/profile remain authoritative for their own facts.
- Provide reset/replay controls scoped to Story progress with explicit destructive confirmation; they do not reset decks, profile statistics, Library data, or rules content.

## Verification

Add headless/browser tests for navigation order, statement rendering, layers, character replacement, dialogue/choice focus, transcript, checkpoint restart, route interruption, export/import, reduced motion, responsive scenes, and corrupt-version recovery. Test the complete Story→real Match→result→Continue Story round trip, Story Give Up, double-submit prevention, non-Story results, deck-preflight failure, stale tokens, and active-Match reload semantics.

Run the `AGENTS.md` baseline, full relevant suite, staging/asset verification, browser matrix, visual captures on desktop/mobile/reduced-motion, and `git diff --check`. Record commands, exit codes, pass/fail totals, changed files, and unresolved items.

## Allowed paths

- Play router/shell/Story modules, styles, storage, Settings portability, and result-screen bridge;
- Story fixture content needed for integration only;
- Worker/session adapter for existing authoritative Match launch/result projections;
- generated staging assets through canonical scripts;
- tests, visual QA, task/index/user documentation.

Do not author the campaign's final prose, generate Story art, change engine authority, make active Matches resumable, or alter Local solo semantics.

## Completion boundary

Stop when reviewed fixture scenes and Matches prove the complete player journey. TASK-029 supplies production scripts; TASK-030 supplies production imagery.
