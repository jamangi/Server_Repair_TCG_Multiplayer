# Candidate cardless actions from the v0.1 pilot

These observations distinguish universal engine actions from domain objects that could produce cards. They do not approve mechanics or modify the decision documents.

## Observe

### Capture an observation as an authoritative record

- **Support:** all five cases; especially the structured interface and command state in `sfp-030`
- **Candidate form:** universal/cardless action or automatic action result
- **Purpose:** preserve the initial symptom, indicator, log, or machine state with source and time, without requiring a generic “Observation card.”
- **Boundary:** Components, Tools, Commands, and Tests may produce the observation; they should not determine whether the engine can retain it.
- **Open dependency:** `OBS-001` must decide what identity, target, and result become visible when the record is created.

## Hypothesize

### Create or revise a candidate-fault set

- **Support:** `sfp-012`, `sfp-030`, `sfp-039`, `sfp-057`, and `sfp-076`
- **Candidate form:** universal/cardless reasoning action, if Hypotheses become authoritative at all
- **Purpose:** represent competing explanations and let Test Evidence narrow or reorder them. The sources repeatedly revise hypotheses without consuming a special physical tool.
- **Boundary:** Diagnostic domain cards create Evidence; they should not imply that free reasoning itself needs a card.
- **Open dependency:** `HYP-001`, `HYP-002`, and `TST-001` control whether candidate state exists and how Evidence changes it.

## Isolate

### Commit an evidence-supported Isolation

- **Support:** substitution in `sfp-012` and `sfp-039`, server-side capacity inspection in `sfp-030`, diagnostic-report analysis in `sfp-057`, and qualified thermal inference in `sfp-076`
- **Candidate form:** universal/cardless action or server-created state transition
- **Purpose:** identify the actionable Fault after evidence meaningfully distinguishes candidates and, if rules require it, leave Diagnosis.
- **Boundary:** A Test card may provide confirming Evidence, but the gateway and visibility of the isolated Fault are engine rules. A successful Repair alone should not silently fabricate prior Isolation.
- **Open dependency:** `ISO-001`, `ISO-002`, `CROSS-004`, and `ISO-003` determine threshold, visibility, Repair gating, and speculative exceptions.

## Document

### Document an undocumented action and its attached result

- **Support:** the explicit command/configuration record in `sfp-030` and the attached ADU report in `sfp-057`
- **Candidate form:** universal/cardless action; cards may enhance scope, cost, timing, or reward
- **Purpose:** select an authoritative action record, publish its identity and target as allowed, and automatically include eligible Evidence/results attached to that execution. Preserve both action time and later documentation time.
- **Boundary:** Packet capture, diagnostic utilities, and reports can be card-producing domain material. The ability to publish an already-created action record should not depend on drawing a Documentation card unless deliberately decided.
- **Open dependency:** `DOC-002`, `DOC-003`, `DOC-004`, `DOC-005`, `DOC-008`, `OBS-001`, and `CROSS-003` govern target, visibility, invocation, selection scope, chronology, and collaboration mode.

## No pilot case for cardless Repair or Verify

Repairs and validations in the five cases map naturally to existing or candidate Repair/Validation domain objects. The pilot does not support turning those stages into free universal actions. It does, however, expose a rule question about how much post-repair Evidence a validation must contain; that is recorded in `decision-observations.md`.
