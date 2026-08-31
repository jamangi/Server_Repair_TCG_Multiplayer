# TASK-053 released Story System Model domain

Status: **candidate-frozen domain release; explanatory only**

TASK-053 expands the proved five-Ticket pilot to the complete released Story denominator without changing gameplay authority, Ticket bytes, authored outcomes, active decks, or earlier release artifacts. The package covers 18 Ticket instances with 18 distinct fingerprints across 12 Matches. It reuses the two accepted pilot profiles for five Tickets and adds one source-backed R740xd Story profile variant for the other thirteen.

The System Model explains where a Candidate, action, or observation sits in a fixed machine. It never decides Bench relevance, legal intent, Evidence, Isolation, Repair success, or Verification results. Unsupported or invalid data remains a hard rejection and the established text-only fallback remains available.

## Release inventory

| Artifact | Purpose |
| --- | --- |
| [System Model catalog](../../../content/system-model-story-v1/system-model-catalog-v2.json) | Three pinned profiles, public topology, lifecycle, observation, intervention, and description data |
| [Ticket bindings](../../../content/system-model-story-v1/ticket-system-bindings-v2.json) | Exact public binding and Candidate closure for all 18 Ticket snapshots |
| [Private compatibility proofs](../../../content/system-model-story-v1/private-compatibility-v2.json) | Build-only hidden-path and differential compatibility proof |
| [Relationship overlay](../../../content/system-model-story-v1/domain-relationship-overlay-v2.json) | Typed, sourced dispositions for released-Story Faults, Symptoms, Tests, Commands, Repairs, and Verifications |
| [Migration](../../../content/system-model-story-v1/migration-v2.json) | Immutable-input pins and pilot-to-Story release mapping |
| [Machine coverage ledger](../../../content/system-model-story-v1/coverage-ledger-v1.json) | Denominators, coverage gates, intentional exclusions, and blocking gaps |
| [Release manifest](../../../content/system-model-story-v1/RELEASE-MANIFEST.json) | Generator, schema, input, and output digests |
| [Source ledger](source-ledger-v2.json) | 25 primary/accepted source records and 50 bounded claims |
| [Human coverage report](RELEASED_STORY_SYSTEM_COVERAGE.md) | Exact Ticket/fingerprint/profile table and coverage interpretation |
| [Migration guide](MIGRATION.md) | Compatibility and reuse rules for downstream consumers |

The deterministic producer is [build-release.mjs](../../../content/system-model-story-v1/build-release.mjs), and the independent semantic gate is [validate-release.mjs](../../../content/system-model-story-v1/validate-release.mjs). Seven successor schemas live under [schemas/domain](../../../schemas/domain/), while the focused proof is [task-053-system-model-story-domain.test.mjs](../../../tests/task-053-system-model-story-domain.test.mjs).

## Exact denominator and coverage

| Measure | Result |
| --- | ---: |
| Released Story Matches | 12 |
| Ticket instances | 18/18 |
| Unique fingerprints | 18/18 |
| Public Candidate occurrences | 64/64 |
| Unique public Candidate Faults | 36/36 |
| Hidden authored paths | 18/18 |
| Relevant domain objects dispositioned | 131/131 |
| Unique relevant actions with justified paths | 76/76 |
| Action-to-Ticket occurrences represented | 348/348 |
| Profiles | 3 total: 2 reused, 1 new variant |
| Component roles | 23/23: 20 Component-backed, 3 explicit abstractions |
| New Component IDs | 0 |
| Blocking gaps | 0 |

The exact stable IDs, Ticket digests, Match provenance, binding, and profile for every row are published in the [coverage report](RELEASED_STORY_SYSTEM_COVERAGE.md). The denominator comes only from the immutable [released Story domain coverage](../../story/coverage/released-story-domain-coverage-v3.json); it does not include unreleased, multiplayer, candidate, or hypothetical Tickets.

## Profile and domain decisions

- Four pilot Tickets retain `profile.dell.poweredge-r740xd.hybrid-24x2_5.v1` exactly.
- The power-distribution pilot retains `profile.dell.poweredge-r740xd2.power-interposer.v1` exactly.
- Thirteen non-pilot Tickets use `profile.dell.poweredge-r740xd.hybrid-24x2_5.story-v1`. The variant adds source-bounded CPU-socket, memory-channel, cooling, OS-network configuration, bounded peer-service, and service-lifecycle roles while retaining the accepted R740xd topology.
- The five pilot binding and private-proof objects, the two pilot profile objects, and all pilot relationship rows remain object-for-object identical.
- No Component was added. The TASK-051 successor definitions `component.firmware.system_bios` and `component.storage.pcie_nvme_interconnect` remain preserved; logical network configuration and peer-service boundaries are explicit public abstractions, not invented hardware.
- All 19 public Symptoms are intentionally unbound observations. Assigning one component would silently narrow their Candidate sets.

## Source boundary and exceptions

The source ledger carries forward TASK-050's accepted eighteen records and adds seven official Dell R740xd service/thermal records. Dell's mutable HTML topics do not expose stable topic revisions, so the ledger pins product scope, exact URL, access date, and narrow claim boundary. The model deliberately does not claim per-pin wiring, sensor-bus detail, unsupported option combinations, or health of external DHCP/gateway/peer infrastructure.

The R740xd board-power path remains a general abstraction because the sources do not establish an exact Power Interposer Board for that profile. Only the reused R740xd2 profile names that service unit. The SAS/SATA drive-group role remains broader than one drive technology and is constrained by the fixed option and Ticket path. These four exceptions are explicit, non-blocking, and must not be “filled” by inference.

## Reproduction and validation

Run from the repository root:

```powershell
node content/system-model-story-v1/build-release.mjs --check
node content/system-model-story-v1/validate-release.mjs
node --test tests/task-053-system-model-story-domain.test.mjs
node src/story/generate-released-story-domain-coverage.mjs --check
```

Generation is complete-or-none: the manifest pins all nineteen immutable inputs, eight generated release/report files, and seven strict schemas. Any source withdrawal, input drift, dangling reference, graph cycle, Candidate-closure loss, private/public boundary violation, or unsupported profile fails validation rather than reducing the denominator.

## Authority and next boundary

This release implements the domain phase described by [TASK-053](../../tasks/TASK-053-synchronize-released-story-system-domain.md) under approved `SYSTEM-001` and `SYSTEM-002`. Production resolver/staging belongs to TASK-054 and player presentation belongs to TASK-055. Neither downstream phase may treat a compatibility proof, topology relation, or diagram as gameplay truth.
