# Technical action copy

This guide governs published playable Tests, Commands, Repair Procedures, and Validation Procedures.

## Ownership and labels

The domain record owns technical meaning. `presentation.short_description` is the required **What it does** copy. `education_text` is an optional second layer and appears only when it adds a durable safety, interpretation, service, preservation, platform-variation, or acceptance point. A Card owns cost and its structured `play_contract`; it does not independently author the domain explanation.

Card and Library detail present information in this order:

1. **What it does** — one or two plain-language sentences from the primary domain record.
2. A context label such as **Safety note**, **Interpretation note**, **Service note**, or **Acceptance note** when `education_text` is present.
3. **Technical method** — existing structured purpose, syntax, requirements, procedure steps, or success conditions.
4. **In this game** — target, cost, prerequisite, result, and disposition derived from `play_contract`.
5. Named, navigable technical relationships. Stable IDs remain in the advanced disclosure.

## Family requirements

- A Test says what is exercised or observed, what status or measurement is collected, and what comparison the technician can make.
- A Command says what it queries or reports and names its platform context. Output informs diagnosis; it is not described as the diagnosis.
- A Repair says which physical or configuration state changes and its intended correction. It never claims recovery before Verify.
- A Validation Procedure says which post-Repair capability or state is exercised and lists observable success conditions.

Descriptions and notes must not contain Card-engine language, raw stable IDs, or generic publication fillers. In particular, do not use “gathers troubleshooting evidence,” “corrective procedure,” “confirms the repaired state,” “compatible active Ticket,” “authored outcome,” “Knowledge State,” “resolver,” “projection,” or “schema” as learner-facing copy.

## Acronyms, safety, and scope

Use [`technical-action-glossary-v1.json`](../../content/gameplay-v1/technical-action-glossary-v1.json) as the reviewed expansion source. Titles may keep familiar abbreviations, but detailed copy expands the first learner-facing use. Preserve distinctions such as inventory versus health, physical link versus Internet Protocol connectivity, and memory inventory versus a full memory diagnostic.

Keep instructions at training-reference depth. Exact thresholds, pinouts, slot maps, hot-swap conditions, and destructive procedures remain controlled by approved platform documentation. Cite primary manuals or standards in the review ledger and retain scoped uncertainty instead of guessing across vendors.

## Publication gate

The TASK-024 quality validator checks all 71 selected primary domain records and their generated Cards. Publication fails for missing or placeholder descriptions, prohibited engine vocabulary, copy drift, incorrect family links, unresolved acronym expansion, missing provenance, raw IDs in ordinary Card copy, or independently authored Card technical notes.
