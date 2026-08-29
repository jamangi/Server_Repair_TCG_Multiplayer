# Case-study research

This directory turns real troubleshooting accounts into evidence-preserving design inputs. It is research material, not a source of frozen rules or domain data.

## Current scope

Version `v0.1` is the five-association pilot defined by [`TASK-004`](../tasks/TASK-004-case-study-pilot-v0.1.md). Its registry inventories all 77 symptom–fault associations in the authoritative domain snapshot at commit `7b8c88cd64930fc6d79e4b24307431a3759aadd9`; five are complete and 72 remain backlog.

Start with:

- [`symptom-fault-associations.json`](v0.1/symptom-fault-associations.json) for machine-checkable coverage and status;
- [`source-ledger.md`](v0.1/source-ledger.md) for source selection and preservation concerns;
- [`cases/`](v0.1/cases/) for lifecycle reductions;
- [`database_cross_reference/`](v0.1/database_cross_reference/) for found and missing domain coverage;
- [`candidate_materials/`](v0.1/candidate_materials/) for deduplicated follow-up candidates and rule observations.

## Post-freeze research drafts

[`research_drafts/`](research_drafts/) preserves the source-grounded research drafts on which post-freeze domain objects are based. These drafts provide a trace from real-world repair knowledge to the authored objects without making the research files themselves authoritative domain data.

Freezing the first-version rules streamlined this work. The broader pre-freeze candidate-idea process remains useful historical material, but ordinary post-freeze expansion can follow a shorter path:

1. Research real inspection, diagnosis, repair, validation, and documentation patterns.
2. Reconcile candidate objects with the frozen rules, current schemas, and existing stable IDs.
3. Add linked domain records and validate their schemas, references, relationships, and viewer behavior.
4. Preserve the supporting research draft here for provenance.

Research that exposes a rule question still belongs in the rule-evolution process rather than being resolved through domain content alone.

Current research drafts:

- [`SERVER-REPAIR-DOMAIN-EXPANSION-DRAFT-2026-08-23.txt`](research_drafts/SERVER-REPAIR-DOMAIN-EXPANSION-DRAFT-2026-08-23.txt) surveys post-market repair-bench cases and records the reconciliation behind the Core v0.1 expansion.
- [`CASE-STUDY-CANDIDATE-DOMAIN-RECONCILIATION-2026-08-23.md`](research_drafts/CASE-STUDY-CANDIDATE-DOMAIN-RECONCILIATION-2026-08-23.md) compares the v0.1 case-study candidates and example card catalog with the live domain database, documenting the gaps promoted into Core v0.1.

The planned Story expansion deliberately reuses this inventory. TASK-039 measures what campaign one actually teaches, and TASK-040's [expansion protocol](../story/EXPANSION_PROTOCOL.md) defines how measured gaps determine Q. TASK-041 began with the 72-entry v0.1 backlog and added only the minimum qualifying cases needed to support six distinct Story+Match episodes. TASK-042 has now completed the required schema, relationship, provenance, Card/Ticket, deck-reachability, and solvability review; its generated [domain-network proof](../coverage/TASK-042-EXPANSION-DOMAIN-NETWORK.md) is the authoritative promotion record, while the original research reductions remain evidence-preserving inputs.

## Story-expansion research v0.2

TASK-041 completed the research gate in [`v0.2-story-expansion/`](v0.2-story-expansion/). The generated [`Q-CALCULATION.md`](v0.2-story-expansion/Q-CALCULATION.md) records `R = 0`, no adjustments, and `Q = 6`; the [`SIX-SLOT-EVIDENCE-MATRIX.md`](v0.2-story-expansion/SIX-SLOT-EVIDENCE-MATRIX.md) connects six directly opened qualifying sources to distinct objectives while keeping domain and gameplay additions candidate-only. The versioned [`registry.json`](v0.2-story-expansion/registry.json), [`source-ledger.md`](v0.2-story-expansion/source-ledger.md), lifecycle reductions, found/not-found cross-references, deduplicated candidate materials, and [`COMPLETION.md`](v0.2-story-expansion/COMPLETION.md) form the reproducible handoff to TASK-042 without rewriting v0.1 history.

## Method

Each qualifying source must establish the initial symptom, the paired fault or a clearly equivalent concrete cause, and a real troubleshooting sequence. The reduction assigns exactly one category to every atomic step: Observe, Hypothesize, Test, Isolate, Repair, Verify, or Document. Diagnosis remains the umbrella process `Hypothesize ↔ Test → Isolate`.

Every reduction distinguishes explicit source statements from researcher inference. Missing lifecycle stages stay missing. Cross-references preserve the source phrase, map it to an existing stable entity only when justified, and keep uncovered material separate from proposed additions.

Candidate materials are not approved objects or mechanics. Domain additions still require schema review and validation; cardless actions and rules still require the decision lifecycle.
