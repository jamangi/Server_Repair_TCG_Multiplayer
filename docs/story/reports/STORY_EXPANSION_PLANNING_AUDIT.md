# Story expansion planning audit

Status: **candidate QC02 blueprint input; staged gameplay is not live**

This generated audit fixes the deck, coverage, and art assumptions for six player-facing episodes, Shifts 7–12. It does not write the graph, scripts, final dialogue, production art, or release migration.

## Version pins

- ruleset: `first-version-v2`
- builder: `ticket-builder-v4`
- parts: `ticket-parts-v2`
- tickets: `core-ticket-parts-v4`
- domain: `core-domain-snapshot-story-expansion-v4`
- cards: `core-card-catalog-story-expansion-v5`
- decks: `core-response-decks-v5`
- coverage: `playable-coverage-v5`
- campaign one coverage: `campaign-one-domain-coverage-v1`
- story art: `story-art-v1`

## Deck feasibility

Owner: **Gameplay/Builder owner**. Release switch: **TASK-046 release/migration owner**.

`deck.story.expansion_response_v1` is an exact 30-Card response Deck with 12 definitions and at most 3 copies of one definition. The real Builder coverage analysis finds 6 individually compatible fingerprints and can fund all 6 together. The 50 Diagnostics consume no response-deck slots.

| Episode | Case / fingerprint | Minimal Diagnostic Bench witness | Repair Card (copies) | Verify Card (copies) | Feasible |
| --- | --- | --- | --- | --- | --- |
| `story.shift.qc02.07` | `exp-001` / `fingerprint.compute.damaged_cpu_socket_contacts` | `test.compute.socket_magnified_inspection` | `card.response.repair.compute.restore_socket_contacts` (3) | `card.response.verify.compute.socket_path` (2) | Yes |
| `story.shift.qc02.08` | `exp-002` / `fingerprint.power.failed_distribution_board` | `test.power.distribution_path_isolation` | `card.response.repair.power.replace_distribution_board` (3) | `card.response.verify.power.distribution_path` (2) | Yes |
| `story.shift.qc02.09` | `exp-003` / `fingerprint.storage.predictive_drive_failure` | `test.storage.predictive_health` | `card.response.repair.storage.replace_predictive_drive` (3) | `card.response.verify.storage.predictive_replacement` (2) | Yes |
| `story.shift.qc02.10` | `exp-004` / `fingerprint.management.stale_alert` | `test.management.event_log_freshness` | `card.response.repair.management.clear_stale_alert_state` (3) | `card.response.verify.management.alert_does_not_recur` (2) | Yes |
| `story.shift.qc02.11` | `exp-005` / `fingerprint.firmware.incompatible_version_set` | `test.firmware.version_compatibility`, `test.network.link_counter_soak` | `card.response.repair.firmware.restore_compatible_versions` (3) | `card.response.verify.firmware.compatible_persistent` (2) | Yes |
| `story.shift.qc02.12` | `exp-006` / `fingerprint.management.corrupt_bmc_firmware` | `test.management.bmc_recovery_state` | `card.response.repair.management.recover_bmc_firmware` (3) | `card.response.verify.management.bmc_functional` (2) | Yes |

Each episode requests one Ticket. Every Repair has two surplus copies and every Verify has one surplus copy after that episode's closure need. The source Ticket IDs/digests remain TASK-042 proof pins; the QC02 graph owns the final seed-specific Match build and must not silently substitute another assignment.

## Coverage-delta forecast

Owner: **Coverage owner; TASK-046 release/migration owner must replace this forecast with the post-release audit**. This is a forecast of six assigned minimal witnesses, not a claim that catalog visibility equals teaching.

| Coverage role | Campaign one unique | Expansion unique | Newly exercised | Combined / denominator | Practice occurrences |
| --- | ---: | ---: | ---: | ---: | ---: |
| symptoms | 9 | 10 | +10 | 19/33 (57.6%) | 12 → 22 |
| public candidate faults | 28 | 18 | +8 | 36/42 (85.7%) | 44 → 64 |
| truth faults | 18 | 6 | +6 | 24/42 (57.1%) | 19 → 25 |
| minimal witness diagnostics | 14 | 7 | +7 | 21/50 (42%) | 15 → 22 |
| repairs | 12 | 6 | +6 | 18/18 (100%) | 12 → 18 |
| verifications | 9 | 6 | +6 | 15/15 (100%) | 15 → 21 |
| supported fingerprints | 12 | 6 | +6 | 18/18 (100%) | 12 → 18 |

The combined minimal-witness action forecast is **54/83 (65.1%)** playable definitions. TASK-046 must regenerate the authoritative post-release audit from the published graph and real Match proofs.

### Commands stay separate

- Catalog exposure: 13
- Useful Candidate-changing Evidence in the expansion: `command.linux.lsblk`, `command.linux.lspci`, `command.linux.smartctl`
- Authored expansion Isolation-route Commands: None
- Oracle-minimal required expansion Commands: None

## Asset reuse and gap inventory

Owner: **TASK-045 Art/accessibility owner validates reuse, fallbacks, crops, hashes, and browser behavior; TASK-044 owns accessible textual comprehension**. Policy: **REUSE_ONLY_NO_TRANSIENT_INSERTS**.

| Episode | Existing backgrounds | Existing character poses | New masters |
| --- | --- | --- | ---: |
| `story.shift.qc02.07` | `story.bg.trinity.trace.night`, `story.bg.trinity.core_floor.night_storm` | `story.character.sora_chen:focused`, `story.character.sora_chen:approving`, `story.character.malik_okoye:focused` | 0 |
| `story.shift.qc02.08` | `story.bg.trinity.core_floor.night_storm`, `story.bg.trinity.validation_gate.predawn` | `story.character.malik_okoye:focused`, `story.character.malik_okoye:defensive`, `story.character.hana_park:skeptical`, `story.character.hana_park:relief` | 0 |
| `story.shift.qc02.09` | `story.bg.trinity.core_floor.night_storm`, `story.bg.trinity.knowledge_systems.night` | `story.character.jonah_reed:thoughtful`, `story.character.hana_park:skeptical`, `story.character.hana_park:relief` | 0 |
| `story.shift.qc02.10` | `story.bg.trinity.knowledge_systems.night` | `story.character.hana_park:skeptical`, `story.character.hana_park:relief`, `story.character.jonah_reed:defensive`, `story.character.jonah_reed:thoughtful` | 0 |
| `story.shift.qc02.11` | `story.bg.trinity.core_floor.night_storm`, `story.bg.trinity.trace.night` | `story.character.malik_okoye:focused`, `story.character.malik_okoye:defensive`, `story.character.sora_chen:focused`, `story.character.sora_chen:approving` | 0 |
| `story.shift.qc02.12` | `story.bg.trinity.trace.night`, `story.bg.trinity.validation_gate.predawn` | `story.character.sora_chen:focused`, `story.character.sora_chen:approving`, `story.character.jonah_reed:thoughtful`, `story.character.hana_park:skeptical`, `story.character.hana_park:relief` | 0 |

The plan reuses **4 backgrounds** and **8 character poses**. It references no transient insert, requests no new master, and has **0 true asset gaps**. All selected production assets and their background/character fallbacks have desktop, mobile, and reduced-data files with pinned hashes in the JSON companion.

The three QC01-specific transient inserts were considered and rejected for reuse because their raster content describes a different campaign segment. QC02 comprehension remains in localized HTML Story text and player-safe gameplay projections. Two existing backgrounds and six existing poses are available but not needed by the current cast/location plan.

TASK-045 is therefore a real zero-generation verification pass unless reachable TASK-044 prose proves a new comprehension requirement. Its owner must recheck hashes, fallbacks, crops, reduced-data behavior, localized alt text, and supported browser/accessibility states.

## Assignment and release boundary

- `story.shift.qc02.07` → `story.match.qc02.shift07.socket_contacts`; seed `story.quiet_cascade.expansion.s07.v1`; `exp-001` / `fingerprint.compute.damaged_cpu_socket_contacts`.
- `story.shift.qc02.08` → `story.match.qc02.shift08.power_distribution`; seed `story.quiet_cascade.expansion.s08.v1`; `exp-002` / `fingerprint.power.failed_distribution_board`.
- `story.shift.qc02.09` → `story.match.qc02.shift09.predictive_drive`; seed `story.quiet_cascade.expansion.s09.v1`; `exp-003` / `fingerprint.storage.predictive_drive_failure`.
- `story.shift.qc02.10` → `story.match.qc02.shift10.stale_alert`; seed `story.quiet_cascade.expansion.s10.v1`; `exp-004` / `fingerprint.management.stale_alert`.
- `story.shift.qc02.11` → `story.match.qc02.shift11.firmware_regression`; seed `story.quiet_cascade.expansion.s11.v1`; `exp-005` / `fingerprint.firmware.incompatible_version_set`.
- `story.shift.qc02.12` → `story.match.qc02.shift12.bmc_recovery`; seed `story.quiet_cascade.expansion.s12.v1`; `exp-006` / `fingerprint.management.corrupt_bmc_firmware`.

The graph validator must compare its six assignments and asset references with the machine ledger and fail closed on divergence. TASK-042 gameplay remains staged only; TASK-046 owns the atomic live loader/content composition and migration.

## Stop conditions

- A blueprint episode changes case, fingerprint, Match reference, seed, Ticket count, or planned art without regenerating and reviewing this audit.
- The active response Deck cannot fund all six assigned fingerprints or any required Repair/Verify Card becomes unreachable.
- Catalog visibility, useful Command Evidence, or a public Candidate is counted as practiced without an authored minimal route.
- A transient insert or new master is requested without a reachable, text-insufficient comprehension need.
- The staged TASK-042 gameplay generation is treated as live before TASK-046 performs the release and migration boundary.
