# Diagnosis v2 migration and release notes

TASK-013 releases the post-playtest diagnosis successor as `first-version-v2` and `solo-pages-v2`. It is a parallel version boundary, not an in-place reinterpretation.

## Version map

| Surface | Pinned v1 | Successor v2 |
| --- | --- | --- |
| Rules | `first-version-v1` | `first-version-v2` |
| Solo profile | `solo-pages-v1` | `solo-pages-v2` |
| Card catalog | `core-card-catalog-v1` | `core-card-catalog-diagnosis-v2` |
| Ticket content | `core-ticket-templates-v1` | `core-ticket-templates-diagnosis-v2` |
| Builder/configuration | `ticket-builder-v1` | `ticket-builder-v2` |
| Starter deck | `deck.core.storage_foundation` | `deck.core.storage_response_v2` |
| Local storage | `server-repair-tcg:solo-pages-v1:state` | `server-repair-tcg:solo-pages-v2:state` |

The canonical minimal migration recipe is recorded in [`diagnosis-v2-migration.json`](../../content/gameplay-v1/diagnosis-v2-migration.json). It removes diagnostics from response-deck slots, creates one persistent Bench instance for each currently playable diagnostic, and deterministically repeats the five response definitions to six copies each. This preserves a legal 30-card starter without inventing TASK-014 content.

Ticket migration derives two through five public Candidates, completes exactly one diagnostic outcome per source and reachable machine state, changes misleading RAID-status `CONFIRM` to `SUPPORT` where corroboration is intended, adds deterministic distractor `RULE_OUT`, and replaces flat citation thresholds with stable typed routes. Generated snapshots pin all v2 provenance fields. Invalid authored input produces a complete Builder failure.

Local v1 and v2 data coexist. There is no automatic deck/profile/statistics migration and no active Match resume across versions. A v1 import receives an actionable coexistence error; an unknown version receives an unsupported-version error. TASK-009 reports remain reproducible with zero replay mismatches, and no v2-only event field is added to a v1 replay digest.

The first functional v2 Solo surface includes Relevant/Global Bench controls, deterministic filtering/sorting/pagination, Evidence-backed elimination controls, authoritative result summaries, confirmation-gated Give Up, and a basic private solution rendering. TASK-014 expands content, TASK-016 owns the final board-density polish, and TASK-015 owns the guided tutorial and polished reveal experience.
