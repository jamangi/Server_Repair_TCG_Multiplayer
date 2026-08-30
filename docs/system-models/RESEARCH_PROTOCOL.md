# System Model research and architecture-comparison protocol

Status: **TASK-049 protocol for TASK-050; no case research has been performed here**

TASK-050 applies this protocol to the five Tickets in [`PILOT_SELECTION.md`](PILOT_SELECTION.md). A source can support a bounded claim; it does not approve an architecture, a whole profile, or a gameplay rule.

## Research unit and claim ledger

Research is performed against a **profile claim**, not against an attractive machine diagram. Each material model statement receives a stable claim ID before it can appear in a profile. The machine-readable ledger and human review render contain:

| Field | Requirement |
| --- | --- |
| `claim_id` | Stable ID; never reused for a different assertion. |
| `profile_candidate_id` | Candidate architecture/profile to which the claim applies. |
| `claim_text` | One falsifiable statement, narrow enough for a reviewer to verify. |
| `claim_kind` | `IDENTITY`, `OPTION_COMPATIBILITY`, `TOPOLOGY`, `LIFECYCLE`, `SERVICEABILITY`, `CONTROL`, `OBSERVATION`, `ACTION_PREREQUISITE`, or `GENERAL_STANDARD`. |
| `scope` | Exact manufacturer/model/configuration/revision/era, or an explicit generalized family/standard boundary. |
| `exactness` | `EXACT`, `GENERALIZED`, or `UNRESOLVED`; unresolved claims cannot support release. |
| `source_id` and location | Stable source record plus page, section, figure, table, anchor, or quoted locator; page-only citation is insufficient when a section is available. |
| `source_revision` | Publication number, edition, firmware era, product generation, and language where available. |
| `accessed_on` | ISO date of retrieval or physical consultation. |
| `archive` | Lawful stable URL, manufacturer archive URL, repository metadata record, or a reason no redistribution/archive is permitted. |
| `support_status` | `SUPPORTED`, `CONTRADICTED`, `PARTIAL`, `SUPERSEDED`, or `WITHDRAWN`. |
| `review` | Researcher, independent reviewer, decision, date, and notes on option/era limits. |

One source record contains title, issuing organization, document type, canonical URL or catalog identity, revision, publication date if known, access date, language, checksum of a lawfully retained local copy when allowed, archive locator, redistribution restrictions, and supersession relation. Citations are claim-level many-to-many: a claim can require multiple sources, and one source can support multiple individually located claims.

## Source priority

Use the highest source tier that can establish the claim:

1. Manufacturer service manual, technical guide, installation/service procedure, wiring/block diagram, supported-option matrix, or platform-specific firmware dependency document for the exact product and revision.
2. Manufacturer product/configuration guide, release note, field notice, knowledge-base article, or officially maintained parts/service catalog for the same product generation.
3. The applicable standards body or specification owner for a connector, protocol, management interface, form factor, or normative lifecycle behavior. Standards establish the standard, not that a vendor implemented every optional feature.
4. Government, academic, or independent laboratory material for a bounded general safety or physical principle when primary vendor/standards material does not cover it.
5. Secondary technical material only to discover primary sources or record an unresolved conflict. It cannot independently release an exact topology or supported option set.

Search snippets, generated summaries, forum posts, retailer/reseller listings, marketplace compatibility claims, stock photographs, teardowns without exact identity, and “commonly works” anecdotes are discovery aids only. Current repository domain records and Story Tickets define the pilot need; they are not proof that a real server supports the proposed arrangement.

## Exact versus generalized claims

- `EXACT` means the cited source names or unambiguously identifies the product family, generation, option, and relevant revision/era represented. The profile must stay inside that scope.
- `GENERALIZED` means the claim describes a standard, common architecture, or intentionally abstract public role. The visible copy must label the abstraction and must not inherit exact vendor details.
- Generalized sources can explain that BMC and host domains are distinct concepts. Only product-specific evidence can establish how a selected machine powers, contains, wires, initializes, observes, or services them.
- A source about option A and a different source about option B do not prove A+B coexist. The combination needs a supported-option matrix, exact configuration example, or equivalent primary evidence.
- Revision/era mismatch is a contradiction until bounded. “Same model name” is not enough when board, backplane, firmware, or service procedures changed.

## Research workflow for each pilot Ticket

1. Copy only the released Ticket's stable ID and public pressure fields from the pinned coverage ledger. Do not search for the hidden answer to select a public model.
2. Define a public requirement envelope broad enough for all Candidates: planes, role abstractions, service targets, observation kinds, and lifecycle phases. Keep the Candidate list intact.
3. Propose one or more real profile candidates using public requirements only. Record rejected candidates rather than silently narrowing the view.
4. Create claims for identity, option coexistence, topology, lifecycle, serviceability, controls, observations, and action prerequisites.
5. Collect and locate primary sources; label each claim exact, generalized, or unresolved. Record revision/era and access date immediately.
6. Run reality validation. A profile with an unresolved material claim remains a research candidate, not an atlas model.
7. In a separate private pass, test the complete authored Ticket against the same candidate. The validator may only accept or reject. A rejection sends research back to the public requirement envelope; its reason cannot select or modify the public view at runtime.
8. Build the manual description, diagram/text equivalent, and rationale graph from one provisional typed record. Record any place where manual outputs need data the contract does not name.
9. Run public-candidate closure and differential non-leak fixtures before evaluating presentation quality.
10. Record author time, source count/tier, unresolved claims, rejected profiles, abstraction decisions, and fallback result for architecture comparison.

## Archive and citation handling

- Prefer stable manufacturer document libraries and standards permalinks. Record both the canonical document URL and the exact accessed revision.
- When licensing permits, retain a checksum-addressed research copy outside production assets and record its checksum; do not commit copyrighted manuals merely for convenience.
- When redistribution is prohibited, retain bibliographic metadata, exact locator, access date, and lawful archive/catalog link. Never evade access controls.
- For mutable HTML, record a lawful archival locator when available and a short non-copyrightable claim paraphrase. A web archive supplements rather than upgrades source authority.
- If a source disappears, an independently reviewable archived revision may continue to support its scoped claim. If neither source nor lawful archive is reviewable, mark the claim `WITHDRAWN` and apply the profile stop/fallback rule.
- Quotations are short and only where exact wording matters; model copy remains a reviewed paraphrase with the same certainty and scope.

## Architecture candidates and TASK-050 evidence

TASK-050 must build the same five manual outputs under each viable architecture concept far enough to collect comparable evidence. A blocking safety, provenance, non-leak, or deterministic failure makes an architecture ineligible; numeric convenience cannot offset it.

| Dimension | Finder-first curated archetypes + deterministic projection | Completely authored Ticket-specific profiles | Constraint-generated composition + reality validator |
| --- | --- | --- | --- |
| Authoring cost | Research/profile time, Finder binding time, and reuse across Tickets. | Per-Ticket research and divergence time, including repeated structures. | Constraint/rule authoring, solver/debug time, and per-output review. |
| Reuse | Tickets per unchanged profile and claim ledger; legitimate abstraction reuse. | Shared fragments without hidden coupling; duplicate-claim drift. | Reused role/constraint primitives and proportion of generated combinations accepted. |
| Source burden | Claims and sources per curated profile and per reuse. | Claims and sources per Ticket; duplicated evidence. | Claims for every primitive **and** proof that generated combinations are supported together. |
| Constraint closure | Finder rejects every incompatible Ticket and resolves public requirements deterministically. | Each authored profile satisfies its one Ticket and remains public-safe. | All variables/domains/constraints are closed; no unvalidated residual combination exists. |
| Contradiction risk | Rejected profiles, option conflicts, revision mismatches. | Cross-Ticket inconsistencies and copy/topology drift. | Invalid-but-plausible generations, constraint interactions, validator false acceptance. |
| Information leakage | Same-public-surface differential bytes and Candidate closure. | Author knowledge accidentally encoded in each layout/detail choice. | Hidden inputs or accept/reject search influencing generated public composition. |
| Determinism | Same public resolver key yields identical profile/projections across reruns and environments. | Same authored snapshot serializes identically. | Same public inputs and pinned generator/constraints produce the same valid model; enumeration order cannot choose a different model. |
| Migration cost | Profile revisions/bindings/replays and shared-profile blast radius. | Many Ticket-specific snapshots and duplication migrations. | Generator, constraint, validator, seed, and output snapshot migrations. |
| Failure/fallback | No compatible curated profile, deprecated source, or closure failure. | Missing/incomplete Ticket profile. | Unsatisfied, multiple, timed-out, or reality-unproven composition. |

For each cell TASK-050 records measured person-time, artifact count, source/claim count, validator outcome, deterministic hashes, fallback behavior, and qualitative review notes. It must also report whether the architecture can represent optional/conditional/parallel/not-applicable lifecycle behavior and keep diagram, prose, and rationale synchronized.

### Architecture blockers

An architecture cannot be recommended if any pilot demonstrates:

- hidden truth changes its public profile, detail, layout, text, rationale, error, or timing-visible result;
- a still-public Candidate is absent or visibly impossible;
- a material real-world combination lacks exact support and no honest generalized abstraction preserves the Ticket;
- explanatory relationships affect Bench membership, legality, Evidence, Isolation, Repair, Verify, or authoritative outcomes;
- the same pinned input has non-identical canonical output;
- failure silently chooses a less compatible or less sourced model; or
- schema pressure cannot be expressed without mutating stable public IDs or collapsing the TASK-017 authority boundary.

## Stop rules

Research or modeling stops immediately and records a typed unresolved item when:

1. **Sources contradict.** Do not majority-vote. Bound by product revision/era/options or mark the claim unresolved. If material, reject the profile.
2. **Vendor options are ambiguous.** Do not combine independently plausible options. Obtain coexistence evidence or use an honest public abstraction that makes no exact claim.
3. **Component granularity is insufficient.** Do not overload an existing Component ID or invent a production ID in TASK-050. Create a proposed gap with role, service boundary, sources, affected pilot outputs, and candidate migration owner.
4. **The model pressures schemas.** Record the required field/relation and worked example; do not edit production schemas before `SYSTEM-001` and TASK-051.
5. **The proposal becomes gameplay authority.** Stop if a field or algorithm would derive relevance membership, legal intent, cost, Evidence disposition, Candidate effect, Isolation eligibility, repair outcome, or verification result. Keep it explanatory or defer to the TASK-017 V2 process.
6. **Public-candidate closure fails.** Broaden truthfully, change the public-selected profile using public requirements, or disable the System view. Never use hidden truth to prune.
7. **Differential non-leak fails.** Treat any byte/timing-visible difference as release-blocking until removed.
8. **Provenance becomes unreviewable.** Withdraw the claim/profile from new bindings and use the fallback.
9. **Outputs drift.** If prose, diagram/text equivalent, or rationale require inconsistent facts, fix the shared model/contract; do not patch one rendering independently.

## TASK-050 completion handoff

For each selected Ticket, TASK-050 must deliver a claim ledger, source manifest, public requirement envelope, at least one accepted or explicitly stopped profile candidate, a manual typed record, description, accessible diagram plus full text equivalent, compact rationale graph, public-candidate closure table, private consistency result, differential fixture result, Component/relation gaps, architecture measurements, and fallback demonstration. The combined `SYSTEM-001` packet names blockers separately from scored tradeoffs and asks the owner to approve one architecture, request bounded research, or defer the capability.
