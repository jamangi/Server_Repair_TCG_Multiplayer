# Story and domain expansion protocol

Status: **process contract for the six-episode expansion train; not approval of any case, domain object, gameplay rule, Story line, or asset**

This protocol turns measured campaign gaps into a reviewable release without allowing research, domain authoring, gameplay authoring, Story writing, art, and migration to collapse into one untraceable change. It is the required handoff sequence after the [campaign-one coverage audit](coverage/CAMPAIGN_ONE_DOMAIN_COVERAGE.md). The machine-readable baseline is [`campaign-one-domain-coverage.json`](coverage/campaign-one-domain-coverage.json).

Normative gameplay authority remains in [Frozen Rules](../design/decisions/FROZEN_RULES.md). Pressure against that authority belongs in [Unfrozen Rules](../design/decisions/UNFROZEN_RULES.md) and the decision lifecycle; this document cannot resolve it. Research follows the [case-study method](../case_studies/README.md), domain records follow the [schema contracts](../../schemas/README.md), and playable content must retain the complete-or-none Builder and solvability guarantees summarized by the [TASK-014 coverage report](../coverage/TASK-014-PLAYABLE-COVERAGE.md).

## Fixed terminology and release unit

- The target is exactly **six player-facing episodes**.
- One **episode** contains one cutscene-style Story sequence plus one real, ordinary, independently solvable Match. Its sequence may include setup and debrief labels, but it has one Match boundary.
- A **script file**, **chapter**, or **act** is an authoring container, not an episode. Reports and UI must state container counts and episode/Match counts separately. Four containers holding six Matches are four containers and six episodes, never “four/six chapters.”
- A **campaign-one Shift** is one of Quiet Cascade's existing six Story-plus-Match units. It is baseline evidence, not a new expansion episode.
- An **arc** in this protocol is a complete playable learning path: public context and candidates, useful diagnostic evidence, an authored Isolation route, the required Repair, current passing Verify, and closure publication. A globally visible diagnostic, a candidate effect, a source anecdote, or a Fault ID alone is not an arc.
- `Q` is the reproducibly calculated minimum number of additional qualifying real-world cases to research after distinct reusable existing arcs are counted. It is an output of Gate 3, not an advance quota.

The release must preserve the iterative troubleshooting loop:

```text
Observe -> Diagnosis [Hypothesize <-> Test -> Isolate] -> Repair -> Verify -> Document
                        ^                                  |
                        `------ failed Verify -------------'
```

Repair changes machine state but does not prove the diagnosis. Failed Verify may reopen Diagnosis. Documentation preserves the accountable explanation and closure record.

## Roles, records, and gate rule

One person may hold several roles, but every gate record names the role that signed it. “Owner” below means the accountable reviewer, not merely the file author.

| Role | Accountable surface |
| --- | --- |
| Coverage owner | Pinned audit interpretation, denominators, gap classifications, and re-audit |
| Research owner | Source eligibility, preservation, lifecycle reduction, and explicit/inferred distinction |
| Domain curator | Stable IDs, provenance, schemas, relationships, and technical review |
| Rules owner | Frozen-rule interpretation and disposition of genuine rule pressure |
| Gameplay/Builder owner | Fingerprints, Cards, deterministic outcomes, deck reachability, and solvability |
| Story graph owner | Six episode boundaries, checkpoints, branches, Match handoffs, and replay semantics |
| Writing/continuity owner | Context, characterization, technical copy, choreography, and route transcripts |
| Art/accessibility owner | Reuse audit, provenance, responsive assets, fallbacks, and nonvisual equivalents |
| Release/migration owner | Version composition, saved progress, import/export, replay metadata, release QA, and rollback |

Every gate produces a signed record containing: input versions and artifact hashes; entry-evidence links; decision and reason codes; owner; outputs and their consumers; validation commands/results; stop conditions encountered; approval/authority relied on; and unresolved items. A gate passes only when its required output exists and its named consumer can use it. A stopped candidate does not stop unrelated candidates unless the shared ruleset, schema, pack, or migration contract is affected.

No later gate may silently repair an earlier omission. It returns the candidate to the earliest failed gate, preserves the rejected record, and reruns downstream validation after correction.

## Gate 1 — interpret measured coverage

- **Entry evidence:** the byte-validated TASK-039 Markdown and JSON outputs, including all values under `pins`, the five denominators, the six Shift maps, minimal witnesses, authored alternate routes, and all three `opportunity_inventory` groups. Record the JSON SHA-256; never copy only its prose totals.
- **Owner:** Coverage owner.
- **Outputs:** a coverage-interpretation ledger whose rows retain the TASK-039 stable IDs and classify each proposed teaching gap as `CAMPAIGN_EXERCISED`, `PLAYABLE_NOT_EXERCISED`, `PRESENT_NOT_COMPLETE`, or `ABSENT_DOMAIN`. Each row states the exact desired learner discrimination or closure skill, not merely a subsystem noun.
- **Validation:** regenerate TASK-039, compare its pins and digest, and prove each classification from an actual minimal witness or authored route. Global catalog presence, public-graph relevance, distractor presence, narrative mention, and automated-policy use must remain separate roles.
- **Stop:** stale pins or IDs; a denominator mismatch; a gap inferred from catalog visibility; a proposed objective that cannot be stated as observable learner work; or an attempt to treat repeated practice as unique coverage.
- **Approval/authority:** the coverage owner signs factual interpretation. Domain, gameplay, and rules authority are unchanged.
- **Consumers:** Gates 2 and 3 select arcs and compute `Q`; Gate 12 compares the post-release audit against this immutable baseline.

### The three Command questions

Commands must be reported in three separate columns throughout the train:

1. **Catalog exposure:** is the Command published in the pinned Global Diagnostic Bench? TASK-039 reports 13 exposed Commands.
2. **Useful evidence-gathering role:** for the exact Ticket and machine revision, does executing it produce an authored observation that contributes to the episode's intended discrimination? TASK-039 reports six Commands with Candidate-changing outcomes and eleven that are target-legal; target legality alone is not a claim of usefulness.
3. **Required Isolation role:** must the Player execute that Command on the selected solution route? Campaign one's oracle-selected minimal paths require **zero Command actions**. One non-minimal authored alternate route uses `command.linux.smartctl`; that does not make a Command required by the campaign's minimal Story path.

The absence of a required Command from campaign-one minimal routes is an audit result, not permission to redesign Commands or force one into an episode. A future episode may require a Command only when current authority and truthful authored evidence support that route. Any change to Command semantics, costs, availability, Evidence meaning, or Isolation authority stops at Gate 6.

## Gate 2 — select uncovered existing playable arcs

- **Entry evidence:** the Gate-1 ledger; TASK-039's `uncovered_but_already_playable` records; the pinned fingerprint, Ticket-part, Card, Bench, response-deck, and solvability artifacts.
- **Owner:** Coverage owner with Gameplay/Builder owner review.
- **Outputs:** an existing-arc candidate ledger. Each row names a stable fingerprint/Ticket construction, exact route ID and required action sequence, `learning_objective_key`, subsystem, public context, required resources, source/provenance already on record, and exclusion reason if rejected.
- **Validation:** reconstruct the Ticket from pinned parts and seed; run a player-safe witness through Isolation, Repair, Verify, and closure; prove the emphasized diagnostic or decision is required on that selected route; and compare its objective with every campaign-one minimal route and every other proposed episode. Sort accepted candidates by TASK-039 dependency rank, then `learning_objective_key`, fingerprint ID, and route ID.
- **Stop:** counting an opportunity-group item as an arc; relying on a merely target-legal or Candidate-neutral result; a duplicate campaign-one learning objective; incomplete lifecycle; unresolved reference; hidden-truth dependence; or a route that is not reachable with exact active resources.
- **Approval/authority:** Gameplay/Builder owner approves existing executable behavior; the coverage owner approves “uncovered.” No new object or rule is authorized.
- **Consumers:** Gate 3 calculates `R` and `Q`; Gate 8 re-proves the final selected set; Gate 9 assigns one accepted arc to an episode.

Underused existing content is preferred only when it forms this complete truthful arc. Objects are never added merely to make subsystem or card-family counts look balanced.

## Gate 3 — calculate `Q`

- **Entry evidence:** the exact TASK-039 JSON digest and `pins`, plus the complete Gate-2 accepted/rejected arc ledger and its digest.
- **Owner:** Coverage owner; an independent reviewer reruns the calculation.
- **Outputs:** a machine-readable and human-readable `Q` calculation showing the candidate rows, eligibility results, selected set, `R`, `Q0`, every adjustment row, and final `Q`.
- **Validation:** a clean rerun from the same inputs must be byte-stable and produce the same chosen arc signature and `Q`; the six slot records must have unique objectives and independently solvable Ticket witnesses.
- **Stop:** a hand-entered arc count; missing input pins/hashes; nondeterministic tie-breaking; a diagnostic/object counted as an episode; or an unexplained adjustment.
- **Approval/authority:** the coverage owner approves the arithmetic and the Gameplay/Builder owner approves the eligibility witnesses. `Q` does not approve sources or mutations.
- **Consumers:** Gate 4 must acquire exactly the qualifying-case load established here; Gate 9 must reconcile six episode slots to the selected existing arcs plus qualifying case-backed arcs.

### Reproducible formula

Let:

- `N = 6`, the fixed episode count;
- `E` be Gate 2's deterministically sorted rows for which all eligibility checks pass;
- `objective(e)` be the stable learner discrimination/closure key for row `e`; and
- `fingerprint(e)` be its causal fingerprint.

Choose `S` as the maximum-cardinality subset of `E`, capped at `N`, in which every `objective(e)` is unique, no row duplicates a campaign-one minimal-route objective, and no two rows name the same complete `(fingerprint, route, objective)` arc. A repeated fingerprint is not automatically a repeated lesson, but its rows need distinct required work and objective keys. If several maximum subsets exist, choose the lexicographically smallest sequence of `(dependency_rank, objective, fingerprint, route_id)` after canonical sorting. Then:

```text
R  = |S|
Q0 = max(0, N - R)
Q  = Q0 + sum(adjustment.increment)
```

An adjustment increment is a positive integer and may use only one of these reason codes:

- `MISSING_LIFECYCLE`: one nominal case cannot supply the complete truthful Observe-to-Document/closure material for its assigned missing slot; or
- `SUBSYSTEM_DIVERSITY_COLLISION`: using that case would duplicate an already selected objective/subsystem pattern and leave the reviewed six-slot diversity matrix unsatisfied.

Each adjustment row names the affected slot, rejected case or evidence class, failed predicate, replacement research need, increment, and approver. One source may support several candidate objects or factual statements, but that reuse never silently decrements `Q`: the default calculation assigns one qualifying case to each missing episode slot. Conversely, a case does not count toward `Q` until Gate 4 qualifies its lifecycle. TASK-039's opportunity arrays are inputs to eligibility; their item counts are not `R`.

## Gate 4 — select sources and reduce lifecycles

- **Entry evidence:** final `Q`; the 72-entry case-study v0.1 backlog before new web discovery; source-selection rubric; preservation requirements; and each unfilled episode objective.
- **Owner:** Research owner.
- **Outputs:** exactly `Q` qualifying primary case records plus explicit alternates, a source ledger, preserved source details, and atomic Observe/Hypothesize/Test/Isolate/Repair/Verify/Document reductions. Every step distinguishes source-explicit text from researcher inference; missing stages remain missing.
- **Validation:** apply the TASK-004 eligibility and scoring method consistently; confirm the symptom, concrete cause, real troubleshooting sequence, repair, and reported validation; check provenance and source accessibility; and reconcile the selected set with the two permitted Gate-3 adjustment reasons.
- **Stop:** a source does not establish a concrete cause or executed sequence; Repair or Verify is invented; lifecycle gaps are silently filled; an inaccessible/unstable source cannot be preserved adequately; unsafe advice is presented as procedure; or fewer than `Q` cases qualify.
- **Approval/authority:** the research owner approves only the fidelity of the reduction. Research is evidence, never domain, gameplay, safety, or rule truth.
- **Consumers:** Gate 5 performs exact/generic/uncertain cross-reference and deduplication; Gate 10 may later use approved public context, not unreconciled claims.

## Gate 5 — deduplicate candidate objects

- **Entry evidence:** qualified case reductions; current canonical domain packs and stable IDs; prior found/not-found cross-references and candidate ledgers.
- **Owner:** Domain curator with Research owner fidelity review.
- **Outputs:** per-source found/not-found cross-reference tables and a consolidated candidate ledger. Every phrase is classified `exact`, `generic_semantic`, `uncertain`, or `not_found`; every proposed addition names the nearest existing object, material distinction, relationships, provenance, and all episode consumers.
- **Validation:** search every entity type and alias; compare semantics, targets, conditions, safety, and interface boundaries rather than names alone; ensure multiple sources collapse to one candidate where appropriate; and verify no proposed stable ID collides with a public contract.
- **Stop:** an existing object is duplicated; consumer-versus-server, temporary-versus-permanent, or Test-versus-Repair differences are blurred; a nearest object is omitted; provenance is missing; or no episode needs the candidate.
- **Approval/authority:** the domain curator approves the analysis, not the mutation. Stable-ID creation remains gated by Gates 6 and 7.
- **Consumers:** Gate 6 classifies pressure; Gate 7 integrates only approved candidates; Gate 3 may be rerun if deduplication removes an assumed distinct arc.

## Gate 6 — review schema, rule, and authority pressure

- **Entry evidence:** deduplicated candidate ledger, current schemas, Frozen/Unfrozen ledgers, content-version and migration guidance, and exact proposed behaviors.
- **Owner:** Domain curator for schema/content classification; Rules owner for rule interpretation; Release/migration owner for persisted-contract effects.
- **Outputs:** one disposition per candidate: `FITS_EXISTING_AUTHORITY`, `SCHEMA_EXTENSION_REQUIRED`, `RULE_DECISION_REQUIRED`, `MIGRATION_REQUIRED`, or `REJECT`. The record names the exact schema field/rule section/version surface and whether only the affected candidate or the shared train must stop.
- **Validation:** demonstrate that every proposed effect can be represented without generic escape bags or client authority; compare new behavior against engine projections and replay persistence; and check Commands separately against the three Gate-1 questions.
- **Stop:** a schema enum would invent behavior; research is used as authority; a frozen rule would change without a new decision/version; hidden truth would reach a client; an old snapshot would be reinterpreted; or a Command redesign is smuggled in as content.
- **Approval/authority:** existing content authority permits only `FITS_EXISTING_AUTHORITY`. Schema owners approve compatible schema extensions. The Rules owner and project decision process must approve rule changes before their candidates continue. Unaffected candidates may proceed.
- **Consumers:** Gate 7 receives authorized domain shapes; Gate 8 receives authorized gameplay behavior; Gate 12 receives all version/migration obligations.

## Gate 7 — integrate domain relationships

- **Entry evidence:** only Gate-6-approved candidates, reconciled provenance, canonical schema versions, and all affected existing records.
- **Owner:** Domain curator.
- **Outputs:** versioned domain records and relationship-impact ledger covering Symptoms, Faults, causal edges, Components, Tests, Commands, Repairs, Validations, Tools, Protocols, references, aliases, and provenance as applicable. Every new object has at least one approved consumer and every changed relationship lists its affected consumers.
- **Validation:** schema validation; stable-reference resolution; causal-DAG and reciprocal relationship checks; deterministic manifest/count regeneration; technical and safety review; and orphan/unreachable-object queries.
- **Stop:** orphan object; dangling or ambiguous reference; incomplete causal relationship; unsupported diagnostic/repair/validation claim; cycle; provenance loss; mutation of an immutable prior pack; or an object added only for numerical balance.
- **Approval/authority:** Domain curator signs technical/domain truth under the approved schema and version boundary. Gameplay effects and Story claims are still unauthorized until their later gates.
- **Consumers:** Gate 8 builds executable content from the integrated graph; Gate 10 uses only reviewed terminology; Gate 12 publishes the new pinned domain version and re-audits it.

## Gate 8 — prove Ticket, fingerprint, Card, and resource reachability

- **Entry evidence:** Gate-2 reusable arcs, Gate-7 domain version, approved frozen rules, Card/Bench/response-deck catalogs, Ticket parts, Builder configuration, and exact episode resource assumptions.
- **Owner:** Gameplay/Builder owner.
- **Outputs:** six candidate gameplay packets. Each names its fingerprint and a distinct learning objective, complete deterministic Ticket snapshot(s), authored outcomes for every offered diagnostic/current state, typed Isolation routes, Repair/Verify/closure path, Card definitions, exact Bench/deck/resource requirements, seed, provenance, and player-safe solvability witness.
- **Validation:** schemas and references; causal acyclicity; deterministic rebuild/digest; all legal diagnostic outcomes; Candidate differentiability; route honesty; same oracle for fixed/generated Tickets; exact active-deck and Bench reachability; complete-or-none batch failure; seat-safe automated play; and no hidden-truth policy input. Report Command catalog/use/requirement independently.
- **Stop:** any Ticket lacks a complete path; two episodes share a learning objective or the same complete fingerprint/route/objective arc; an offered diagnostic has no unique result; selected resources cannot close the Ticket; a route overstates Evidence; a Repair precedes accepted Isolation; Verify is treated as proof-free; closure cannot be published; or Builder guarantees are relaxed.
- **Approval/authority:** Gameplay/Builder owner signs executable content under Frozen Rules. Any newly exposed rule pressure returns to Gate 6.
- **Consumers:** Gate 9 uses immutable Match references and witnesses; Gate 10 may cite only player-authorized context; Gate 12 pins and verifies the same snapshots.

## Gate 9 — blueprint six episode graphs and Matches

- **Entry evidence:** exactly six Gate-8 gameplay packets, current Story runtime/checkpoint contracts, campaign continuity, replay policy, and progression constraints.
- **Owner:** Story graph owner with Gameplay/Builder owner Match sign-off.
- **Outputs:** six episode briefs and a machine-traversable graph. Every episode declares its story-sequence entry/exit, one real Match reference, pre-Match checkpoint, normalized outcome bands, post-Match return, restart behavior, replay availability, learning objective, character/setting purpose, and downstream continuity. Container/file organization is reported separately.
- **Validation:** bounded exhaustive route traversal; unique stable labels/checkpoints; every Match handoff resolves; every episode is independently completable; interruption restarts from the durable pre-Match checkpoint; replay cannot rewrite canonical progress; and all six objectives remain distinct.
- **Stop:** fewer/more than six episode units; a fake/simulated Match; one Match shared as two episode counts; story branches that change hidden truth; unproved Match configuration; unreachable/reconverging error; or container terminology that obscures episode count.
- **Approval/authority:** Story graph owner approves topology; Gameplay/Builder owner approves Match references. The graph cannot modify engine results, rules, or domain truth.
- **Consumers:** Gate 10 writes every reachable route; Gate 11 derives reachable asset demand; Gate 12 migrates and publishes the exact graph.

## Gate 10 — write context-complete scenes and choreography

- **Entry evidence:** approved Gate-9 graph; character/voice/continuity registries; reviewed domain terminology; technical-copy guidance; and every player-authorized Match outcome band.
- **Owner:** Writing/continuity owner with Domain curator technical review.
- **Outputs:** complete declarative scripts, localized text source, choreography commands, decision acknowledgment, debrief variants, route transcripts, and continuity/context ledgers.
- **Validation:** exhaustive transcript generation; newcomer-context and voice review; branch acknowledgment; technical/safety/privacy audit; no hidden Fault or correct diagnostic disclosed early; mobile text-density and localization checks; and Match-boundary replay against the unchanged Gate-8 packet.
- **Stop:** missing context; character knowledge exceeds role/current evidence; a choice promises an unmodeled effect; prose changes a Match seed or outcome; a scene supplies hidden truth; a technical claim lacks domain review; or runtime code is changed to support a writing shortcut.
- **Approval/authority:** Writing owner approves drama/continuity; Domain curator approves technical claims. Scripts describe but never authorize gameplay.
- **Consumers:** Gate 11 derives the finite reachable asset inventory; Gate 12 validates and ships scripts/transcripts.

## Gate 11 — produce only art gaps

- **Entry evidence:** reachable Gate-10 statements, existing background/character/insert manifest, visual direction, crop/layer/accessibility contracts, provenance rules, and Pages budget.
- **Owner:** Art/accessibility owner.
- **Outputs:** an asset-reuse matrix and only the residual production inventory, followed by reviewed original masters, responsive derivatives, hashes, provenance, fallbacks, focal/crop metadata, and alt/decorative decisions.
- **Validation:** prove every requested asset is reachable and every reusable current asset was considered; contact-sheet identity review; reference/hash checks; desktop/mobile/zoom/reduced-motion/reduced-data/loading-failure tests; repository budget; and a check that no image contains raster text or hidden gameplay answers.
- **Stop:** reusable art is needlessly regenerated; one image is created per line; identity/license/provenance is unresolved; art becomes the only carrier of critical information; crop/performance budget fails; or an image changes story/gameplay meaning.
- **Approval/authority:** Art/accessibility owner approves presentation only. Art cannot repair missing writing, domain evidence, or gameplay authority.
- **Consumers:** Gate 12's resolver, accessibility, browser, performance, and release verification consume the inventory and hashes.

## Gate 12 — release, migrate, verify, and re-audit

- **Entry evidence:** passed Gates 1–11 with hashes; immutable prior Story/domain/gameplay packs; current progress/checkpoint/import-export contracts; replay/result metadata; release manifest; rollback plan; and complete QA matrix.
- **Owner:** Release/migration owner, with each upstream owner signing its surface.
- **Outputs:** a new versioned Story release composed without modifying prior packs; explicit progress/checkpoint migration and conflict/rollback behavior; updated import/export preview; immutable Match/replay provenance; release notes; accessibility/browser/performance evidence; and regenerated post-release domain coverage Markdown/JSON.
- **Validation:** pack/schema/reference validation; deterministic build twice; migration from every supported progress state including untouched, mid-campaign, completed ending, replay-only history, corrupt/unsupported version, and import conflict; old-pack replay under old pins; new six-episode traversal; real Match round trips; desktop/mobile/keyboard/zoom/screen-reader/reduced-motion/browser matrix; asset hashes; full relevant tests; link check; and `git diff --check`.
- **Stop:** an old pack or replay is reinterpreted; completed endings regress; checkpoint labels become unresolved; import partially commits; old/new content are ambiguously composed; Match provenance is lost; active Match resumption is falsely promised; accessibility or supported-browser failures remain; coverage totals are stale; or rollback is absent.
- **Approval/authority:** Release/migration owner approves composition and migration; upstream owners approve their unchanged signed artifacts. A player-visible rules change additionally requires a separately approved rules version. Failed release validation blocks publication, not the immutable prior release.
- **Consumers:** the live client consumes the new pack and migration; replay/review consumes pinned old and new metadata; the next expansion begins from the regenerated coverage audit rather than this release's planning assumptions.

## Mutation and authority matrix

| Surface | Earliest mutation gate | Required authority | Forbidden shortcut |
| --- | ---: | --- | --- |
| Coverage interpretation | 1 | Coverage owner over pinned audit artifacts | Reclassifying catalog presence as teaching |
| Case-study research | 4 | Research method and source fidelity | Treating a source as approved domain truth |
| Stable domain IDs/relationships | 7 | Gate-6 disposition, Domain curator, schemas/provenance | Creating an object during research or writing |
| Schema contract | 6/7 | Schema owner plus migration review where persisted | Adding a generic field that invents behavior |
| Frozen gameplay behavior | Separate decision before 7/8 | Rules owner, new rules version, tests/migration | Encoding a rule in Card text, Builder data, or Story |
| Cards/Tickets/fingerprints/decks | 8 | Gameplay/Builder owner under Frozen Rules | Weakening solvability to fit a plot |
| Story graph/checkpoints | 9 | Story graph owner; Match refs co-signed by Gameplay | Letting DOM/script choose authoritative results |
| Dialogue/choreography | 10 | Writing/continuity; technical claims reviewed by Domain | Revealing hidden truth or rewriting Match facts |
| Production art | 11 | Art/accessibility and provenance review | Using imagery as technical or gameplay authority |
| Live composition/saved progress | 12 | Release/migration owner and upstream signatures | Mutating old packs or silently rewriting progress |

## Artifact handoffs

| Producer | Artifact | Required consumer |
| ---: | --- | --- |
| 1 | Pinned interpretation ledger | 2, 3, and final comparison in 12 |
| 2 | Existing-arc ledger and witnesses | 3, re-proof in 8, episode assignment in 9 |
| 3 | Reproducible `Q` record | Source acquisition in 4 and six-slot reconciliation in 9 |
| 4 | Source ledger and lifecycle reductions | Cross-reference/deduplication in 5 |
| 5 | Nearest-existing/candidate ledger | Pressure review in 6 and integration plan in 7 |
| 6 | Authority/pressure dispositions | Domain integration in 7, gameplay limits in 8, migration duties in 12 |
| 7 | Versioned domain graph and impact ledger | Executable authoring in 8, terminology review in 10, content pin in 12 |
| 8 | Six gameplay packets and solvability witnesses | Graph/Match blueprint in 9 and release verification in 12 |
| 9 | Six-episode graph and Match handoffs | Script coverage in 10, reachable inventory in 11, migration in 12 |
| 10 | Scripts, context/continuity ledgers, transcripts | Asset derivation in 11 and route QA in 12 |
| 11 | Reuse matrix, asset manifest, hashes, fallbacks | Resolver/accessibility/performance checks in 12 |
| 12 | Versioned release, migration record, new audit | Live/replay clients and the next Gate-1 baseline |

An output with no named consumer is either removed or returned for explicit scope review. A consumer may reject an input, but may not mutate it silently.

## Walkthrough A — existing pilot case `sfp-039`

This is a read-only walkthrough of [No power caused by a failed PSU](../case_studies/v0.1/cases/sfp-039--no-power--failed-psu--supernc.md), its [found cross-reference](../case_studies/v0.1/database_cross_reference/found/sfp-039--no-power--failed-psu--supernc.md), and its [not-found cross-reference](../case_studies/v0.1/database_cross_reference/not_found/sfp-039--no-power--failed-psu--supernc.md). It demonstrates that a strong case is not automatically a new episode.

| Gate | Read-only result |
| ---: | --- |
| 1 | `symptom.power.no_power` is unused as a campaign-one Symptom, but `fault.power.psu.failed` and known-good PSU substitution already occur in the playable/campaign corpus. “No power” alone is not a new objective. |
| 2 | The current known-good substitution → PSU Isolation → replacement → stable-power path is playable, but its central discrimination overlaps existing power teaching. The source's potentially distinct ambiguity—the ATX paperclip/self-start interpretation—is not an existing complete playable arc, so `R` does not increase from this case. |
| 3 | The case cannot change `Q` merely because it scored well or contains several phrases. It can fill a missing-case slot only after Gate 4 and does not count as a reusable Gate-2 arc. |
| 4 | The pilot scored 9/10 and explicitly records Observe, competing hypotheses, an ambiguous Test, revised Hypothesis, known-good substitution, Isolation, Repair, and Verify. A separate work record is absent; the reduction keeps Document absent. |
| 5 | Existing exact/generic coverage includes the multimeter, known-good PSU, substitution Test, PSU replacement, and stable-power Verify. The ATX self-start procedure, voltage/pinout procedure, and dedicated tester remain not found; the ATX consumer interface versus hot-swap server PSU is explicitly uncertain. |
| 6 | Modeling the self-start path would require safety/interface/schema review and perhaps new Test/Protocol/Tool content; research cannot authorize it. Reusing the already-covered substitution path does not establish distinct teaching value. The affected candidate stops here unless later authority resolves those gaps. |
| 7 | No domain mutation is permitted by this walkthrough. |
| 8 | No new fingerprint, Card, Ticket, or deck claim is permitted. The already-supported PSU path remains governed by its existing pins. |
| 9 | No expansion episode is assigned; six-slot reconciliation must use another accepted arc/case unless this candidate later clears Gates 6–8 with a distinct objective. |
| 10 | No dialogue may convert the paperclip result into decisive proof or fabricate a Worklog action. |
| 11 | No asset is requested for a blocked episode. |
| 12 | The pilot remains provenance-preserving research; no live pack, saved progress, replay, or coverage denominator changes. |

The walkthrough exercises the intended stop behavior: lifecycle evidence survives, unresolved candidates stay visible, and unrelated expansion work may continue.

## Walkthrough B — campaign-one Shift 1 control

This is a read-only control using `story.match.qc01.shift01.wrong_device` from the [coverage audit's Shift 1 map](coverage/CAMPAIGN_ONE_DOMAIN_COVERAGE.md#shift-1) and the existing [Quiet Cascade campaign](campaigns/QUIET_CASCADE.md).

| Gate | Read-only result |
| ---: | --- |
| 1 | The pinned Ticket is `ticket.generated.ef8a4924e707349bce5c2be7`, fingerprint `fingerprint.boot.incorrect_order`, snapshot digest `821769a6021482074d523c723dc08a6b9bd2885820eabe11a9011b199fc6dacb`. It is campaign-exercised, not uncovered. |
| 2 | Its objective—separate boot selection from device detection and media state—is already taught by the minimal route, so it is excluded from the expansion existing-arc set. |
| 3 | The excluded control contributes zero to `R`; it neither increases nor decreases `Q`. |
| 4 | No new source is required to preserve or replay an already approved Match. |
| 5 | All referenced stable objects already resolve; no candidate-object request is opened. |
| 6 | The path fits `first-version-v2`: two support outcomes satisfy an authored corroborated route, Isolation gates Repair, and Verify precedes closure. It creates no new rule/schema pressure. |
| 7 | Domain remains unchanged. |
| 8 | The exact witness is `test.firmware.settings_review` → `test.boot.device_inventory` → Isolate `fault_instance.boot.order` → `repair.boot.correct_order` → `verify.boot.normal_boot`; closure then publishes the accepted bundle. No Command action is required. The existing deterministic Ticket/Match proofs remain the authority. |
| 9 | Shift 1 already demonstrates the episode-shaped handoff (Story sequence plus one real Match), but it is not counted among the six new episodes. |
| 10 | Current context-complete copy may serve as quality reference; it is not rewritten by this walkthrough. |
| 11 | Current reviewed assets are reuse candidates for later inventory comparison; none is regenerated here. |
| 12 | The old pack, checkpoint, completed result, and replay metadata remain immutable. A future release must prove this control still loads/replays under its recorded pins and must keep it in the baseline side of the coverage comparison. |

Together, the pilot and Shift controls show both safe outcomes: a source-backed candidate can stop without becoming truth, while a proven existing episode can remain intact without being miscounted as expansion coverage.

## Final train audit

Before release approval, verify all of the following:

- exactly six episode records exist, each with one Story sequence and one real Match;
- each Match has an independent complete solvability witness and a distinct learning objective; every fingerprint and route is recorded and any fingerprint reuse has distinct required work;
- `Q` recomputes from the recorded TASK-039 digest, Gate-2 ledger, and enumerated adjustments;
- the number of qualifying primary cases equals final `Q` and no research assertion bypasses Gates 5–8;
- every new or changed stable object has provenance, relationships, authority, a consumer, and a version boundary;
- Command exposure, useful Evidence, and required Isolation are separately reported;
- no blocked rule/authority candidate contaminated unrelated approved content;
- every Story line and image stays within player-authorized knowledge;
- prior packs, completed endings, checkpoints, Matches, replays, and imports retain their recorded meaning; and
- the post-release coverage audit is regenerated and becomes the next expansion's baseline.
