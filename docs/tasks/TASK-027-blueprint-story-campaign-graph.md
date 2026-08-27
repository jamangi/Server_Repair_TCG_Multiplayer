# TASK-027-XHIGH: Blueprint the Story campaign graph and Match plan

## Status

**Queued; blocked by TASK-026 and STORY-003/STORY-005 approval.**

## Objective

Design the first campaign as a complete, machine-validated directed graph of story beats and playable Matches. Every node must have a concise dramatic purpose, branch contract, continuity effect, and exact player-safe Match configuration before full dialogue or production art is authored.

## Required reading

Read completely before editing:

- `AGENTS.md`, root `README.md`, this task, `docs/tasks/INDEX.md`, TASK-005, TASK-009, TASK-014, TASK-015, TASK-024, and completed TASK-026;
- all `docs/story/` material, including the cast, voice, research boundary, visual direction, and candidates;
- frozen rules, current playable catalog, Ticket Builder composition/provenance, solvability oracle, tutorials, results/statistics, deck validation, and automated-game reports;
- the Story pack/condition/Match-boundary schemas and validators created by TASK-026.

## Deliverables

- A campaign brief stating theme, chapter/shift structure, starting state, expected length, training progression, emotional arc, and ending/outcome bands.
- A canonical node/edge inventory with stable label/checkpoint IDs. Each node records: one-paragraph beat, location/time, present characters, known continuity facts, player choice, branch predicate, next labels, reusable scene/art requirements, and whether it launches or receives a Match.
- A human-readable graph plus a generated machine report of entry points, reachability, cycles, convergence, endings, dead ends, calls/returns, checkpoint distribution, and branch coverage.
- `ADDITIONAL_CHARACTERS.md` only when an essential role cannot be served honestly by the established ensemble; additions need the same depth and terminology discipline as `CHARACTERS.md`.
- `BACKGROUNDS.md` listing reusable locations, time/lighting variants, narrative uses, protected overlay zones, mobile crops, and future art briefs. This is an asset plan, not generated art.

## Match-node contract

For every `start_match` node define and validate:

- exact content/rules profile, seed policy, Ticket count/order/composition constraints, starting resources, deck policy, difficulty/content profile, and return labels;
- the client-safe story setup that foreshadows subsystem, workplace pressure, or symptoms without revealing hidden Faults, required diagnostics, or correct branches;
- normalized result fields the story may consume: completion/abandonment, story-scoped Service Points, documented/verified outcome, bounded contribution summaries, and other explicitly approved player-visible results;
- outcomes for success, abandonment, interrupted/restarted Match, and content/solvability failure; and
- a Builder proof that every configured Match is constructible and solvable under the approved deck policy.

Narrative necessity never overrides the engine. A story branch cannot silently force an illegal Card, fake Evidence, guarantee a hidden outcome, reinterpret score, or mutate a replay. If a desired beat cannot be expressed through current authority, record it as a blocked candidate rather than scripting around it.

## Branch design

- Use meaningful but bounded choices. Different routes may reveal character, operational priority, training order, or later context without pretending every decision creates wholly separate production.
- State whether a branch is exclusive, reconvergent, optional/callable, or terminal. Preserve enough history for later dialogue to acknowledge material choices.
- Service Point gates must use the approved story-scoped value and explicit thresholds. Include a fallback path at every gate; no Player is stranded by a score they can no longer change.
- Introduce mechanics in a teachable order and reuse the real tutorials/help rather than putting rules lectures into every scene.
- Keep advanced nuance optional: redundancy, intermittent/load conditions, misleading telemetry, and ambiguous results may appear later only when current V0 content and Builder can prove the scenario.

## Verification

Validate schema/reference integrity, graph reachability, branch exhaustiveness, checkpoint placement, deterministic route replay, asset/character references, Match return paths, and every configured Ticket batch. Run an automated matrix that traverses every branch/outcome band and plays every Story Match with suitable player-safe policies. Report matches, successes/abandons, turns, Service Points, stalls, exceptions, and unreachable edges.

Run the full relevant repository suite and `git diff --check`; record commands, exit codes, pass/fail totals, changed files, and unresolved items.

## Allowed paths

- versioned campaign graph/brief/Match configuration content;
- story graph schemas/validators only where TASK-026 left an evidenced gap;
- `docs/story/ADDITIONAL_CHARACTERS.md`, `docs/story/BACKGROUNDS.md`, and campaign planning documents;
- tests, automated Story route reports, task/index documentation.

Do not write final scene dialogue, create production art, expose the Story tab, or alter engine rules/content to make a plot work.

## Completion boundary

Stop when the full campaign skeleton and each Match handoff are reviewable, solvability-proved, and machine traversable. TASK-029 writes the drama from this blueprint.
