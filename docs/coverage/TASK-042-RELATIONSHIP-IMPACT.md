# TASK-042 relationship and release impact

Status: **candidate content is integrated and staged; it is not live until TASK-046 selects the new versions**

This ledger complements the generated [expansion domain network proof](TASK-042-EXPANSION-DOMAIN-NETWORK.md). It records the object, relationship, schema, provenance, art, copy, Command, and release effects of integrating the six TASK-041 research cases.

## Object accounting

| Surface | Reused | New | Rejected or removed | Result |
| --- | ---: | ---: | ---: | --- |
| Canonical domain IDs | 257 | 0 | 0 | Every prior ID remains present. The 30 primary lifecycle-role objects reconciled by TASK-041 are reused rather than duplicated. |
| Playable Card IDs | 71 | 12 | 0 | Six Repair and six Verify Cards are added. Seventy prior definitions remain identical; `card.bench.test.management.event_log_freshness` receives the one explicit copy-only migration described below. |
| Fingerprints | 12 | 6 | 0 | One deterministic fingerprint is added for each `exp-001` through `exp-006` case. |
| Deck IDs | 2 | 1 | 0 | `deck.story.expansion_response_v1` adds exact reachability for all 12 response Cards; the two prior deck objects remain unchanged. |
| Diagnostic definitions | 50 | 0 | 0 | The Global Diagnostic Bench remains 37 Tests plus 13 Commands. |

TASK-041 proposed no new canonical object after deduplication, so there is no countable rejected stable-ID proposal. Vendor names, event strings, interface details, versions, and recovery filenames remain aliases, provenance, educational copy, or Ticket facts; none are promoted merely to manufacture an object count.

## Reciprocal relationship delta

Normalized domain relationships increase from **752 to 754**. The only additions are the reciprocal pair needed to preserve the legacy backplane interpretation of a persistent management alert:

- `fault.storage.backplane.path_failed` — `associated_symptom` → `symptom.management.alert_persists`
- `symptom.management.alert_persists` — `associated_fault` → `fault.storage.backplane.path_failed`

No relationship is removed and no stable ID is renamed. Forty-three existing records receive versioned source, copy, art, or relationship reconciliation; 214 domain records remain byte-equivalent as parsed objects. The Builder proof rejects unresolved references, one-way required links, incomplete outcomes, and hidden-truth projection leaks.

## Provenance and schema

Six additive source packs, `domain.story.exp-001` through `domain.story.exp-006`, bind the directly reviewed cases to existing stable IDs. They are appended to the prior source-pack list; prior provenance remains intact. The selected source chain is registry → source ledger → source pack → domain/Card/Ticket proof.

Two backward-compatible schema extensions support the versioned output:

- `ticket_part_catalog.schema.json` permits optional `teaching_part_id` and `response_deck_id` fields on fingerprint roots. Older catalogs remain valid because neither field becomes globally required.
- `technical_copy_review.schema.json` pins 71 records for `technical-copy-review-v1` and 83 for `technical-copy-review-v2` instead of weakening the older ledger's exact count.

The generated validation covers all 257 domain records, all 83 Cards, the part catalog, coverage matrix, and copy ledger against the repository schemas.

## Illustration reuse and technical copy

All 12 new response Cards inherit the reviewed illustration of their paired primary Test through their existing Repair or Verify domain record. Each reused illustration has response-specific accessible alternative text and a caption disclosing the intentional reuse. No new illustration asset is added.

`technical-copy-review-v2` contains **83 reviewed records** backed by **24 source entries**. It covers every playable primary-domain record, including the 12 new response actions, and pins copy digests so Card copy cannot drift from the reviewed domain text.

## Command role separation

The three Command questions remain independent:

| Question | Result |
| --- | --- |
| Catalog exposure | 13 Commands, unchanged |
| Useful Candidate-changing Evidence in these six Tickets | 3: `command.linux.lsblk`, `command.linux.lspci`, `command.linux.smartctl` |
| Authored Isolation-route source | 0 |
| Oracle-minimal required Command | 0 |

Useful does not imply required. No Test is converted into a Command, no Command semantics change, and TFTP remains transport for `repair.management.recover_bmc_firmware`, not a Diagnostic Command. The stale-alert path likewise keeps observation-only `test.management.event_log_freshness` separate from state-changing `repair.management.clear_stale_alert_state`.

## Version and migration boundary

| Contract | Current live file/version | Staged TASK-042 file/version |
| --- | --- | --- |
| Ticket parts | `task-014-parts.json` / `ticket-parts-v1` | `task-042-parts.json` / `ticket-parts-v2` |
| Domain | `domain-snapshot-v2.json` / `core-domain-snapshot-technical-copy-v3` | `domain-snapshot-v3.json` / `core-domain-snapshot-story-expansion-v4` |
| Cards | `card-catalog-v3.json` / `core-card-catalog-technical-copy-v4` | `card-catalog-v4.json` / `core-card-catalog-story-expansion-v5` |
| Decks | `decks-v3.json` / `core-response-decks-v4` | `decks-v4.json` / `core-response-decks-v5` |
| Coverage | `playable-coverage-v3.json` / `playable-coverage-v4` | `playable-coverage-v4.json` / `playable-coverage-v5` |
| Technical copy | `technical-copy-review-v1.json` / `technical-copy-review-v1` | `technical-copy-review-v2.json` / `technical-copy-review-v2` |

The prior files remain immutable and both generations are copied into the deterministic Pages asset stage. The live catalog service and solo worker continue loading the current files. TASK-046 owns the atomic loader switch and any saved-progress/replay migration; TASK-042 does not reinterpret a saved artifact.

The sole prior Card content migration is `card.bench.test.management.event_log_freshness`: its stable ID and play contract remain unchanged, while its description and education text now make the read-only evidence boundary explicit. The matching state change remains a Repair.
