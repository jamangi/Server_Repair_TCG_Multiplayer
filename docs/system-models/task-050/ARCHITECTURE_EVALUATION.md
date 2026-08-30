# SYSTEM-001 architecture evaluation

Status: **pending project-owner approval; TASK-051 is blocked**

## Pilot evidence

| Measure | Observed |
| --- | --- |
| tickets | 5 |
| public equivalence classes | 5 |
| source backed profiles | 2 |
| profile ticket bindings | 5 |
| primary source entries | 18 |
| component gap roles | 2 |
| broad or ambiguous component roles | 3 |
| relationship findings | 16 |
| fixed option constraints | 7 |

Profile reuse is `profile.dell.poweredge-r740xd.hybrid-24x2_5.v1` for 4 Tickets; `profile.dell.poweredge-r740xd2.power-interposer.v1` for 1 Ticket. The five public Ticket surfaces form five equivalence classes even though four share one physical profile. A private compatibility check therefore need not create five public physical models.

## Side-by-side measures

| Measure | A: Curated Finder plus deterministic projection builder | B: Authored profile per Ticket or Ticket family | C: Constrained composition Builder | D: Stop or defer |
| --- | --- | --- | --- | --- |
| Full profiles/models authored | 2 | 5 | 2 | 0 |
| Ticket bindings authored | 5 | 0 | 5 | 0 |
| Reused bindings | 3 | 0 | 3 | 0 |
| Fixed option constraints | 7 | 7 | 7 | 0 |
| Component gap roles | 2 | 2 | 2 | 0 |
| Relationship findings | 16 | 16 | 16 | 0 |
| Unproved combinations | 0 | 0 | 2 | 0 |

### A — Curated Finder plus deterministic projection builder (recommended)

- Assessment: `recommended`.
- Manual authoring burden: Two source-backed profile packages plus five small Ticket compatibility/closure bindings; common lifecycle, topology, descriptions, and action rationale mappings are rendered once per profile.
- Source burden: 18 primary-source ledger entries support two fixed configurations; Ticket bindings reuse claim IDs without duplicating source interpretation.
- Deterministic selection: Yes. The complete private Ticket may validate compatibility, then a stable profile ID is selected; public projection receives only that public profile and public Ticket fields.

Consequences:

- Production work must curate versioned fixed profiles and deterministic compatibility predicates before a Ticket can resolve.
- A private validator may reject an incompatible profile but may not alter the public projection using hidden truth.
- Descriptions, diagrams, text equivalents, and rationale views must be projections of typed profile/binding data rather than independent copy.
- Unsupported systems fail closed to an honest no-model fallback; the Finder never improvises a component combination.
- TASK-051 may implement the approved typed contract and the five pilot profiles only; it may not infer Evidence or change gameplay authority.

### B — Authored profile per Ticket or Ticket family

- Assessment: `viable_but_not_preferred`.
- Manual authoring burden: Five complete models. Four would duplicate the same R740xd structure, lifecycle, citations, accessibility semantics, and most action mappings, creating three avoidable full-profile copies in this pilot.
- Source burden: The same 18 sources still suffice, but their claim interpretations must be synchronized across four duplicated R740xd records.
- Deterministic selection: Yes, by direct Ticket-to-model assignment; no general Finder logic is needed.

Consequences:

- Reality proof is simple because every Ticket points to one manually reviewed model.
- Public non-leak remains straightforward, but each copied model needs independent deterministic and accessibility checks.
- Corrections to a shared real platform, source revision, or diagram grammar must be applied consistently to every duplicate.
- This option trades selection complexity for measurable duplication and drift risk; the pilot already demonstrates 4-to-1 reuse that it would discard.

### C — Constrained composition Builder

- Assessment: `not_proved_by_pilot`.
- Manual authoring burden: At minimum the same two base profiles and five bindings, plus compatibility rules and rule-level sources for every swappable storage, power, management, firmware, and network bundle.
- Source burden: 18 sources prove only the two original family/configuration pairings. No source in the pilot proves cross-family bundle exchange or a closed compatibility matrix.
- Deterministic selection: Possible only after canonical rule ordering and closed constraints exist; the pilot does not provide those rules.
- Unproved-combination evidence: Treating the two profile bases and their two distinct power/storage bundles as independently swappable yields four pairings. Only the two original manufacturer-family pairings are proved; the two cross-pairings are unproved and must be rejected.

Consequences:

- Approval would authorize only a closed compatibility rule set with independent primary-source proof for each allowed combination.
- The current pilot is insufficient to implement the Builder because it found no lawful evidence for two obvious cross-combinations and no complete option matrix.
- Every generated combination would need stable canonical serialization, provenance, public non-leak proof, and a reject-by-default rule.
- Composition must never use plausibility, visual similarity, a reseller list, or hidden Ticket truth as compatibility evidence.

### D — Stop or defer

- Assessment: `available_gate_option`.
- Manual authoring burden: No production implementation; retain the atlas as research evidence.
- Source burden: No additional source work until the owner reopens the sequence.
- Deterministic selection: Not applicable.

Consequences:

- TASK-051 and every later System Model production/UI task remain blocked.
- Current gameplay, domain content, Viewer behavior, and public Tickets remain unchanged.
- The research package can be resumed later without treating any unapproved architecture as authoritative.


## Recommendation and gate

**Recommend A.** The pilot realizes five Tickets with two fixed source-backed profiles, reusing one profile four times while preserving five distinct public equivalence classes. It avoids three duplicated full models relative to B and rejects two unproved cross-combinations exposed by C. No pilot evidence disproves the Finder-first contract.

This recommendation is not approval. The project owner must reply **`SYSTEM-001 A, B, C, or D`**. Until then, `SYSTEM-001` is pending, TASK-051 remains blocked, and none of the candidate architecture is production authority.
