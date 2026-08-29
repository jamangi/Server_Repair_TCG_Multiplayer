# TASK-042 expansion domain network proof

This generated report proves the six reviewed research slots against the real Builder, outcome-coverage validator, solvability oracle, engine projection, expansion response deck, and unchanged 50-card Diagnostic Bench. It does not design Story graph or dialogue.

## Version and immutable-input pins

- Ruleset / Builder: `first-version-v2` / `ticket-builder-v4`
- Parts / Tickets: `ticket-parts-v2` / `core-ticket-parts-v4`
- Domain / Cards / decks / coverage: `core-domain-snapshot-story-expansion-v4` / `core-card-catalog-story-expansion-v5` / `core-response-decks-v5` / `playable-coverage-v5`
- Immutable prior SHA-256 values: `domain-snapshot-v2.json` `2e55fc92b725d869b67b3ea73c701c55db49f9b9a2f49bcff981cebaca687a2f`; `card-catalog-v3.json` `e2810a99ce02b1d57ef5613e3d9d09647f5fea8dd8b3b4074baacea09bc055ef`; `decks-v3.json` `8d9fc3ef8aa5d3932dd4fbb9349b915f4087b2c357caede6f559a2c2c24467f4`; `playable-coverage-v3.json` `87ed2e481221485aaef3221dcf2d0a1a4979971631db5284fa3e73745d20b065`; `task-014-parts.json` `06614e06602164e54dc36737aea89d573cd0d1b76ce863a0352a2f45e1be6c56`

## Inventory and compatibility

| Measure | Count |
| --- | ---: |
| knowledge records | 257 |
| action bearing records | 107 |
| diagnostics | 50 |
| selected repairs | 18 |
| selected validations | 15 |
| playable cards | 83 |
| deferred actions | 24 |
| fingerprints | 18 |
| new response cards | 12 |
| expansion deck cards | 30 |

All 257 stable domain IDs remain present, 70 prior Cards remain byte-equivalent as parsed definitions, and exactly `card.bench.test.management.event_log_freshness` is explicitly migrated for the N4 Test/Repair boundary. The old v3 catalog file and `deck.core.multisystem_response_v3` remain unchanged. The expansion deck contains exactly 30 Cards and reaches all 12 new response Cards.

## Six deterministic Ticket proofs

| Case | Fingerprint | Ticket | Snapshot digest | Distinct objective | Provenance |
| --- | --- | --- | --- | --- | --- |
| exp-001 | `fingerprint.compute.damaged_cpu_socket_contacts` | `ticket.generated.827d9729d12225e209f47117` | `450d9df67ef840c88f34fa73478d96c2b90db9eee68a4f983d95856ac6d4819d` | Identify a socket-location fault without condemning known-good processors or memory. | [source](https://www.dell.com/community/en/conversations/rack-servers/r910-will-not-power-on-with-4-processors/647f7d25f4ccf8a8deb93b08) |
| exp-002 | `fingerprint.power.failed_distribution_board` | `ticket.generated.80422a060f47ea4ce7871377` | `0639e89199a6968f9316443c23e222ad4ba20f3114ce72d87694df6df532b86f` | Use cross-bay known-good comparisons to isolate a shared distribution fault. | [source](https://www.dell.com/community/en/conversations/poweredge-hardware-general/t420-poweredge-vlt0204-main-board-voltage-outside-of-range/67fd91b469e6265ea77af6ab) |
| exp-003 | `fingerprint.storage.predictive_drive_failure` | `ticket.generated.46644a4accc96d5bd961b9fa` | `f40eb2e706a86d54277265cd3d21b26753039ecb58287d677e51cf254a73059e` | Treat predictive failure as actionable while protecting data and proving completed recovery. | [source](https://www.dell.com/community/en/conversations/poweredge-hardware-general/poweredge-r620-drive-predicted-failure/647f7b52f4ccf8a8de9878d4) |
| exp-004 | `fingerprint.management.stale_alert` | `ticket.generated.b8fa37ba78fc40c286f65d2a` | `4f8f58bb0210c5ae7b2f11d2ea418c83d73552c8d940d88ddcd10b2a3d7632e2` | Separate read-only evidence preservation from the state-changing Repair that clears a stale alert. | [source](https://www.dell.com/community/en/conversations/poweredge-hddscsiraid/pe2900-backplane-degraded/647e8b20f4ccf8a8dede59e9) |
| exp-005 | `fingerprint.firmware.incompatible_version_set` | `ticket.generated.b92a9e6c176464ba795f9dd5` | `ecbb377dc65df8e4b96f90a35ff9541562b9a229b14e7ced92fae73994288637` | Use repeated version A/B behavior and hardware elimination to diagnose a firmware regression. | [source](https://www.dell.com/community/en/conversations/poweredge-hardware-general/idrac-keeps-messaging-the-nic-in-slot-4-port-1-network-link-is-started/647f94b2f4ccf8a8de70eaff) |
| exp-006 | `fingerprint.management.corrupt_bmc_firmware` | `ticket.generated.6c878955ff0b3d7e5edbd5a0` | `71fcf1cae907451f7b83ca12d7370e59d770174a72c61f5f934ba27851513ce4` | Bound dangerous controller recovery to approved platform methods and verify recovery separately from the flash action. | [source](https://forums.serverbuilds.net/t/ga-7pesh2-bmc-recovery/882) |

Every Ticket exposes the unchanged 50-card Bench, has complete authored outcomes for every target-legal diagnostic, a player-safe solvability witness through Isolation, Repair, and Verify, and zero server-only fields in its projected player view.

## Commands remain separate questions

- Catalog exposure (13): `command.ipmi.sel_elist`, `command.linux.dhclient`, `command.linux.dmesg`, `command.linux.ethtool`, `command.linux.free_h`, `command.linux.ip_addr`, `command.linux.ip_route`, `command.linux.journalctl`, `command.linux.lsblk`, `command.linux.lspci`, `command.linux.nvme_smart_log`, `command.linux.smartctl`, `command.network.ping`
- Useful Candidate-changing Evidence in these six Tickets (3): `command.linux.lsblk`, `command.linux.lspci`, `command.linux.smartctl`
- Authored Isolation-route sources (0): None
- Oracle-minimal required Commands (0): None

No count is promoted into another category.

## N6 Test/Repair boundary

`test.management.bmc_recovery_state` supplies diagnostic Evidence. `repair.management.recover_bmc_firmware` changes BMC firmware state. TFTP remains Repair transport and is not a Diagnostic Command.

## N4 Test/Repair boundary

`test.management.event_log_freshness` preserves and compares current state without clearing it. `repair.management.clear_stale_alert_state` performs the state-changing cleanup. `card.bench.test.management.event_log_freshness` is the only prior Card definition intentionally migrated into v5.

## Technical copy, provenance, and art

All 83 selected actions have reviewed technical-copy provenance and matching digests. The 12 new response Cards bind one-to-one to their Repair/Verify domain records. Those primary records deliberately reuse paired-Test asset IDs with response-specific accessible alt text and captions; Cards inherit that reviewed primary-domain art. Each Ticket is bound to its directly opened TASK-041 source through the registry, source pack, source ledger, stable support, explicit teaching part, and expansion response deck.
