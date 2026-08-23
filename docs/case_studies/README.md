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

## Method

Each qualifying source must establish the initial symptom, the paired fault or a clearly equivalent concrete cause, and a real troubleshooting sequence. The reduction assigns exactly one category to every atomic step: Observe, Hypothesize, Test, Isolate, Repair, Verify, or Document. Diagnosis remains the umbrella process `Hypothesize ↔ Test → Isolate`.

Every reduction distinguishes explicit source statements from researcher inference. Missing lifecycle stages stay missing. Cross-references preserve the source phrase, map it to an existing stable entity only when justified, and keep uncovered material separate from proposed additions.

Candidate materials are not approved objects or mechanics. Domain additions still require schema review and validation; cardless actions and rules still require the decision lifecycle.
