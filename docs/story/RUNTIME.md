# Story runtime

The Story runtime is a deterministic, headless interpreter for versioned declarative content. It is a structural foundation, not authority for campaign canon or new card-game rules. Authored JSON chooses dialogue and branches; JavaScript owns validation and state transitions. Story data is never evaluated as code.

## Package boundary

A loaded bundle has exactly four keys:

```js
{
  manifest,
  registry,
  texts: { en: textCatalog },
  scripts: [chapterOne, chapterTwo]
}
```

The manifest pins the pack/content versions, default locale, global entry label, explicitly callable library entries, deterministic interpreter bounds, script paths, text catalogs, and registry. The registry declares typed variables, layered assets, characters and poses, Match references, and bounded authored loops. Labels and checkpoint IDs are globally unique public content contracts.

The normative JSON shapes live in [`schemas/story/`](../../schemas/story/). `validateStoryPack(bundle)` adds cross-file semantic checks that JSON Schema alone cannot express: reference resolution, translation completeness, reachability, return safety, call depth, declared cycles, typed writes and predicates, and registry-layer compatibility.

## Statements and conditions

Version `story-script-v1` supports:

- `label`, `jump`, `call`, and `return` for explicit control flow;
- `scene`, `show`, and `hide` for persistent background, tagged character, and transient layers;
- `say`, `narrate`, and `choice` for accessible screens and transcript entries;
- `set` and `if` for typed remembered state;
- `checkpoint` for an authored durable restart boundary;
- `start_match` for a typed Match handoff and return label; and
- `end` for a terminal authored outcome.

Conditions are a closed AST: `ALL`, `ANY`, `NOT`, `VARIABLE_EQUALS`, `CHOICE_IS`, `STORY_POINTS_AT_LEAST`, and `MATCH_RESULT`. They cannot call functions, access global profile statistics, inspect hidden Match truth, or evaluate arbitrary expressions. `MATCH_RESULT` exposes only the normalized allowlist in `story-match-result-v1`.

## Runtime API

The public surface is exported by [`src/story/index.mjs`](../../src/story/index.mjs):

- `validateStoryPack(bundle)` returns deterministic validation issues.
- `createStoryState(bundle, { entryLabel? })` creates a detached initial state. An explicit `entryLabel` may select only the pack entry or a declared library entry; the outer `return` from a detached library invocation completes that segment without inventing an authored ending.
- `reduceStory(state, intent, bundle)` returns `{ state, display, effects, digest }` without mutating its inputs.
- `createDurableCheckpoint(state, checkpointId, bundle)` produces a versioned, digested safe-boundary record.
- `restoreStoryCheckpoint(checkpoint, bundle)` validates and restarts the authored segment.
- `createStoryReviewState(checkpoint, reviewCheckpointId, bundle)` validates canonical progress and creates an isolated runtime state at an authored episode-review boundary.
- `normalizeStoryMatchResult(summary, { expectedMatchRef })` reduces a terminal Worker summary to the Story allowlist.
- `acceptStoryMatchResult(state, result)` accepts one result for one pending Match exactly once.

Player intents are closed and small:

```js
{ type: 'BEGIN' }
{ type: 'ADVANCE' }
{ type: 'CHOOSE', option_id: 'stable.option' }
{ type: 'ACCEPT_MATCH_RESULT', result }
```

The reducer settles noninteractive transitions until it reaches dialogue, a choice, a Match boundary, an ending, or a deterministic guard. Its typed effects are `PERSIST_CHECKPOINT`, `START_MATCH`, and `STORY_ENDED`. DOM events never advance Story authority by themselves.

## Display projection

The display projection contains only already-authorized information:

1. `background` persists the current scene, location, and time;
2. `characters` contains tagged replaceable character/pose projections;
3. `transient` contains temporary inserts or overlays; and
4. `screens` contains current dialogue or choices, completed transcript entries, and control availability.

Choice destinations, writes, future statements, unchosen prose, Match configuration, and hidden Ticket truth are absent from the display model. Tagged `show` commands replace an existing figure deterministically rather than appending visual duplicates.

## Match boundary

`start_match` first emits the durable pre-Match checkpoint and then a `START_MATCH` effect containing only its version, registered `match_ref`, and checkpoint ID. Active engine state is never embedded in Story state.

On terminal settlement, the boundary normalizes the safe Worker summary. It records validity/completion, reason codes, Story-scoped Service Points, closed/given-up counts, verified/documented booleans, and five contribution counters. It does not copy a replay, private Ticket state, or profile statistics. The Story advances only after `ACCEPT_MATCH_RESULT`; acceptance emits the required post-Match checkpoint before later dialogue continues.

Leaving or reloading during a Match restores `AWAITING_MATCH` from the pre-Match checkpoint and offers a fresh launch of the same registered configuration. It never claims that the prior local engine session resumed.

## Completed-episode review

Chapter history lists an episode only when its registered `match_ref` appears in accepted durable Match results. Its title, Shift identity, and configured Match come from reviewed Match metadata; a version-matched `review-episodes.json` supplies the `replay_entry_checkpoint_id`. Nothing is inferred from result-array position or script-file count.

Review creates a detached runtime state from the validated canonical checkpoint. Its checkpoint effects, choices, and Story result are never persisted. The paired practice Match uses the same deck preflight, authored Builder configuration, Worker, and engine as canonical Story; the client omits canonical Story context and intentionally discards the terminal result outside the engine/statistics boundary. A versioned `sessionStorage` marker records only pack/content, `match_ref`, and `SCENE`/`MATCH` phase so scene reload can restart the review and Match reload can return to Chapter history. That marker is excluded from local backups and cleared by completion, Give Up, route leave, reset, or import.

## Durable progress and migration

Local data version `solo-local-state-v3` and export version `solo-export-v3` originally added one exact `records.story` value:

```js
{
  schema_version: 'story-progress-record-v1',
  pack_id,
  content_version,
  checkpoint,
  pending_result,
  completed_ending_id
}
```

The all-null form means that no Story pack has started. An active record pins pack/content versions. A pending result is normalized and must match the checkpoint's pending Match reference, return label, and pre-Match checkpoint. This intermediate record makes “Continue” reload-safe without accepting a result twice.

Durable checkpoints contain only version/content/checkpoint IDs, approved variables and choices, bounded branch and normalized-result histories, Story-scoped Service Points, pending or returned Match context, and a canonical SHA-256 digest. They exclude the DOM, display layers, transcript animation, call stack, arbitrary program counter, and active engine state.

Current local version `solo-local-state-v4` and export version `solo-export-v4` retain that Story record and add only the bounded `solo-settings-v3.sfx_volume_percent` presentation preference. Migration from local v2/v3 adds any missing empty Story record, upgrades settings with the default volume `40`, and preserves profile, decks, statistics, tutorials, and existing Story progress. V2/v3 export import does the same before strict v4 validation and preview. V1 remains pinned to its original coexistence policy. Unknown/future versions, extra fields, mismatched content, corrupt digests, duplicate results, or cross-context pending results fail before replacement. Confirmed import is one atomic replacement; failed validation or storage writes preserve the prior complete snapshot.

## Static Viewer staging

The canonical Play asset script stages `src/story/**/*.mjs` and `content/story-v1/**/*.json` under `viewer/generated/play/`, records bytes and SHA-256 hashes in the generated manifest, and rejects symlinks or unsupported extensions. Story art remains a separate reviewed source under `viewer/assets/story/`; it is deliberately not copied into generated Play assets.

## Proof material

`content/story-v1/fixtures/runtime-proof/` is intentionally non-canon. It proves sequential dialogue, background persistence, tagged character replacement, immediate and remembered choice branches, cross-file control flow, nested calls, Story-point and Match-result predicates, checkpoint/reload, transcript projection, and a mocked Match boundary. Additional portable records are under [`examples/story/`](../../examples/story/).

TASK-027 owns campaign authorship and Match planning. TASK-028 owns the player-facing Story routes. TASK-029 owns campaign validation and TASK-030 owns reviewed Story art.
