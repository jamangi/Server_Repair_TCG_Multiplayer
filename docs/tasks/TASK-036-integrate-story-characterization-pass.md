# TASK-036-XHIGH: Integrate the Story characterization pass

## Status

**Completed 2026-08-28.** The context-complete draft and approved voice bibles ship together as `quiet-cascade-characterization-v2`; v1 remains immutable and migrates only after digest verification at the same durable checkpoint.

## Objective

Translate the TASK-034 context-complete Quiet Cascade draft through each speaker's TASK-035 voice while preserving every locked semantic payload, technical bound, branch meaning, and hidden-information rule.

Deliver dialogue that first makes the workplace understandable and then lets distinct people inhabit it: competent characters with different rhythms, relationships, private pressures, humor, and occasional non-work texture rather than a chorus of polished technical conclusions.

## Required reading

Read completely before editing:

- `AGENTS.md`, root `README.md`, this task, `STORY-007 A`, `STORY-008 A`, and completed TASK-033 through TASK-035 with every deliverable;
- completed TASK-026 through TASK-030 and the current Story runtime/campaign/continuity/editorial contracts;
- all live Story scripts, text, registry, graph, Match references, generated transcripts/reports, validators, checkpoint/storage migrations, and Viewer scene-player tests; and
- canonical art/pose limits, mobile/reflow behavior, localization structure, and all authoritative gameplay terminology used by the campaign.

## One-migration rule

Do not perform an unversioned overwrite of canonized campaign-one content while continuing to accept old checkpoints as though their source were unchanged.

Before editing production content, audit what the current pack digest and Story checkpoint compatibility include. Then use the established versioning/migration boundary:

- if dialogue/script changes affect persisted compatibility, create the required successor content version and an explicit safe migration/restart path from the last durable boundary;
- if text-only changes are demonstrably excluded from compatibility identity, still record the content revision and prove old checkpoints resolve deterministically; and
- never accept a stored digest against different dialogue/topology by coincidence.

Preserve v1 source/history as required for deterministic fixtures and migration tests. Do not create two production releases for the context and voice passes; integrate them together here.

## Semantic-payload lock

TASK-034's payload ledger is authoritative for what each line must communicate. A voice rewrite may change rhythm, syntax, metaphor, humor, ordering within the displayed turn, and relational framing. It may not change:

- the observation or source available at that point;
- confidence, uncertainty, scope, causality, or temporal status;
- what is public, private, hidden, archived, verified, documented, or unresolved;
- choice meaning or promised consequence;
- Match/result interpretation;
- safety guidance or gameplay terminology; or
- the context ladder needed for newcomer comprehension.

Maintain a deterministic before/context-draft/final comparison for every changed line and document any intentional payload-ledger amendment before prose integration.

## Characterization contract

- Apply the correct voice card according to speaker, relationship, location, and pressure register; do not decorate every line with the same trait.
- Let characters interrupt, ask, qualify, joke, hesitate, correct themselves, remember another team's burden, or reveal a preference when the scene permits it.
- Keep the customizable protagonist's choices concise and temperament-flexible. Do not silently author a fixed biography or personality for the Player.
- Use the five-to-ten-percent personal-texture range across campaign dialogue moments as editorial guidance, not a quota. Give each of the seven speakers at least one memorable non-procedural beat without forcing one into every chapter.
- Strengthen relationship lines through how people address or misunderstand one another, not explanatory narration about their relationship.
- Preserve competence and dignity. A character may be defensive, politically constrained, impatient, or wrong without becoming a caricature.
- Do not copy public-domain source phrasing, mimic an author, import catchphrases, or mention reference characters in production.

## Context and pacing contract

Retain TASK-034's newcomer comprehension. Do not compress the context back into insider aphorisms during revoicing.

Balance scene texture across:

- concrete environment and artifacts;
- normal workflow and the specific handoff at risk;
- the pain point and its human/operational consequence;
- technical observation and bounded insight;
- Player question/action/choice;
- relationship or personal texture; and
- quiet connective language that lets conclusions land.

Not every displayed turn needs to be quotable. Preserve mobile readability and localization readiness; split dense ideas into sequential turns when appropriate rather than shrinking required context.

## Canon, topology, and presentation constraints

- Preserve approved graph topology, labels, variables, choice IDs/meanings, conditions, checkpoints, Match refs/configurations, Service Point bands, endings, and normalized result handling.
- Preserve stable public IDs or migrate them explicitly; never repurpose an old ID for a different meaning.
- Do not add a new character, branch, choice, Match, asset, pose, background, reward, or gameplay action.
- Do not reveal hidden Faults, required diagnostics, correct Repairs, or unearned outcomes.
- Do not let story dialogue manufacture engine Evidence, Isolation, Verify, Worklog publication, or closure.
- Use existing art and choreography unless a text split requires a structural statement addition. No new image generation is part of this task.
- Keep silent/reduced-motion/keyboard/touch experiences semantically complete.

## Editorial proof

Replace the earlier optimistic voice/terminology pass claims with evidence from the completed sequence. Update the campaign editorial and continuity records with:

- context-ladder coverage and first-use definitions;
- character voice fingerprints and sample evidence;
- personal-texture placements and restraint rationale;
- semantic-payload preservation;
- hidden-information and technical review;
- route-specific comprehension and choice acknowledgment;
- mobile density/localization findings; and
- content-version/checkpoint migration behavior.

Generate final route transcripts suitable for side-by-side review with both the original production copy and TASK-034 context draft.

## Verification

- Validate every TASK-033 gap, TASK-034 candidate line/payload, and TASK-035 speaking-character requirement as integrated or explicitly waived with rationale.
- Prove all graph branches, four remembered choices, 48 route/outcome traversals, six Match boundaries, three ending bands, checkpoints, and authoritative result acceptance remain valid.
- Re-run the six real Match solvability/replay proofs; prose changes may not alter inputs, outcomes, or authority.
- Test the content-version/checkpoint migration and interruption behavior at scene, pre-Match, post-Match, ending, reload, route-leave, and import/export boundaries.
- Review complete transcripts for newcomer comprehension, voice distinction, repetition, technical accuracy, hidden information, dignity, personal-texture restraint, and protagonist neutrality.
- Browser-test representative dialogue/choice/history scenes at desktop, mobile, keyboard-only, reduced-motion, zoom/reflow, and long-copy conditions; no clipping or meaning may depend on audio or art.
- Run Story validators, focused context/voice/migration tests, canonical Viewer staging/verification, relevant browser suites, full applicable Node tests, documentation-link tests, and `git diff --check`.
- Report commands, exit codes, pass/fail totals, changed/added line counts, route and character totals, migration result, changed files, and unresolved items.

## Allowed paths

- versioned canonical Quiet Cascade Story content and required manifest/digest migration;
- Story checkpoint/content migration code only when the compatibility audit proves it necessary;
- Story character/voice/continuity/editorial/revision reports and final transcripts;
- Viewer copy-layout adjustments only if longer validated dialogue exposes clipping, without redesigning the scene player;
- focused tests, generated reports, task/index, and concise root/Story documentation status.

Do not alter engine/Builder/gameplay authority, Ticket/Card/domain content, Match configurations, Story branch semantics, canonical character identities/art, or unrelated Viewer behavior.

## Completion boundary

Stop when the live campaign explains its workplace and pain points to the defined newcomer, every speaker has a distinct continuity-safe voice, restrained personal texture makes the cast feel alive, all semantic/topology/gameplay contracts remain intact, and one explicit content-version boundary safely carries existing Story progress forward.
