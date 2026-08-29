# v0.2 story-expansion source ledger

Access date for every source in this ledger: **2026-08-28**.

This ledger preserves research evidence for TASK-041. It does not approve a domain object, relationship, Card, fingerprint, Ticket, rule, or Story implementation. Later gates must decide whether and how any case is represented.

Scores use the TASK-004 lifecycle rubric: Observe 1, Hypothesize 2, Test 2, Isolate 2, Repair 1, Verify 1, and Document 1. A reported forum update is not counted as Document unless the source describes a distinct evidence-preservation or documentation action.

## Selected sources

| Case | Candidate episode | Selected firsthand source | Eligibility | Lifecycle coverage | Access result |
| --- | --- | --- | --- | --- | --- |
| [`exp-001`](cases/exp-001--damaged-cpu-socket-contacts.md) | Damaged CPU socket contacts | [Dell PowerEdge R910: four-processor boot failure](https://www.dell.com/community/en/conversations/rack-servers/r910-will-not-power-on-with-4-processors/647f7d25f4ccf8a8deb93b08) | Eligible: firsthand troubleshooting, location isolation, observed damage, repair, and reported four-CPU boot | 9/10; Document absent | Direct page opened successfully |
| [`exp-002`](cases/exp-002--failed-power-distribution-board.md) | Failed power distribution board | [Dell PowerEdge T420: VLT0204 and immediate shutdown](https://www.dell.com/community/en/conversations/poweredge-hardware-general/t420-poweredge-vlt0204-main-board-voltage-outside-of-range/67fd91b469e6265ea77af6ab) | Eligible: firsthand symptom, component reduction, cross-bay PSU tests, PDB replacement, and restored boot | 9/10; Isolation partly inferred; Document absent | Direct page opened successfully |
| [`exp-003`](cases/exp-003--predictive-drive-failure.md) | Predictive drive failure | [Dell PowerEdge R620: drive predicted failure](https://www.dell.com/community/en/conversations/poweredge-hardware-general/poweredge-r620-drive-predicted-failure/647f7b52f4ccf8a8de9878d4) | Eligible: firsthand warning and bay indicator, management status, replacement, and completed rebuild | 9/10; Document absent | Direct page opened successfully |
| [`exp-004`](cases/exp-004--stale-management-alert.md) | Stale management alert | [Dell PowerEdge 2900/1950/2950: backplane degraded](https://www.dell.com/community/en/conversations/poweredge-hddscsiraid/pe2900-backplane-degraded/647e8b20f4ccf8a8dede59e9) | Eligible: multiple firsthand reports distinguish healthy hardware from stale management state and report the alert clearing | 9/10; combined probe/clear pressure; Document absent | Direct page opened successfully |
| [`exp-005`](cases/exp-005--incompatible-firmware-versions.md) | Incompatible firmware versions | [Dell PowerEdge systems: NIC link messages after iDRAC 5](https://www.dell.com/community/en/conversations/poweredge-hardware-general/idrac-keeps-messaging-the-nic-in-slot-4-port-1-network-link-is-started/647f94b2f4ccf8a8de70eaff) | Eligible: multi-system firsthand reports, hardware/cable swaps, repeated version A/B behavior, rollback, and soak evidence | 9/10; Document absent | Direct page opened successfully |
| [`exp-006`](cases/exp-006--corrupt-bmc-firmware.md) | Corrupt BMC firmware | [GA-7PESH2 BMC Recovery](https://forums.serverbuilds.net/t/ga-7pesh2-bmc-recovery/882) | Eligible: firsthand failed update, bootloader and image checks, completed flash, author-reported success with a reset/normal-start boundary, and intentional guide-writing | 10/10 | Direct page opened successfully |

## Source-selection notes

### `exp-001`

- **Author / publisher / period:** `OWEN SPARKES 69`; Dell Technologies Community; 2018-10-26 through 2018-10-28.
- **Copyright-safe preservation:** A four-socket R910 worked with two processors but failed with four. Pair and mixed-pair trials showed the processors could boot. An unsupported three-processor placement localized the problem to socket 3; slightly displaced contacts were then seen and corrected, after which all four processors booted.
- **Uncertainty:** The repair was performed with an improvised hand tool. The source does not document torque, post-repair stress testing, or a complete CPU/memory inventory.
- **Rejected alternative:** [E1245 and E1000 on an R910](https://www.dell.com/community/en/conversations/poweredge-hardware-general/e1245-e1000-on-r910/647f7bd0f4ccf8a8dea1a3c9) has related symptoms but no completed, verified socket-contact repair.

### `exp-002`

- **Author / publisher / period:** `JSHome`, with Dell community moderators; Dell Technologies Community; 2025-04-14 through 2025-05-26.
- **Copyright-safe preservation:** A T420 shut off almost immediately with a voltage-range alert after a redundant-power conversion. Removing added load and testing each supply in each bay did not change the failure. The owner later replaced the PDB and reported normal boot.
- **Uncertainty:** The author says there was additional testing but does not preserve a decisive PDB-only measurement. A failed capacitor is speculation, not a reported finding.
- **Rejected alternative:** [A later T420 VLT0204 report](https://www.dell.com/community/pt/conversations/servidores/vlt0204-system-board-voltage-outside-of-range/65b9343942e0c52e7e18419c) ends with a board-replacement recommendation and no reported repair verification.

### `exp-003`

- **Author / publisher / period:** `braunhtf`, with Dell community contributors; Dell Technologies Community; 2018-07-13 through 2018-07-19.
- **Copyright-safe preservation:** An online RAID-1 member showed an alternating amber/green indicator and a predicted-failure status. The operator identified the member, replaced it, and later reported that the rebuild completed successfully. Backup, consistency-check, compatibility, and safe-offline precautions were advice, not all confirmed actions.
- **Uncertainty:** The source does not publish SMART attributes or a separate diagnostic test report. It verifies rebuild completion but does not preserve a longer post-rebuild acceptance interval.
- **Rejected alternative:** [PowerEdge 2800 RAID disk problem](https://www.dell.com/community/en/conversations/poweredge-hddscsiraid/poweredge-2800-raid-disk-problem/647f3a8bf4ccf8a8de193bf0) contains useful replacement and repeat-failure pressure, but the selected R620 thread has the clearer reported rebuild completion for this slot.

### `exp-004`

- **Authors / publisher / period:** `byurick`, `ghri-bh`, `chrisnella`, and Dell community contributors; Dell Technologies Community; 2007-12-28 through 2012-05-01.
- **Copyright-safe preservation:** Several systems showed a degraded-backplane indication after drive recovery even though drives, enclosures, and indicators were healthy. One reporter states that ordinary log clearing did not remove it. A DSET run both freshly probed hardware and cleared stale state, after which the indication disappeared.
- **Uncertainty:** The successful DSET act combines observation and mutation. The source cannot prove that a read-only probe alone would have isolated the stale state or that a separate clear alone would have repaired it.
- **Alternate:** A later [PowerEdge 2900 backplane-warning thread](https://www.dell.com/community/en/conversations/north-america-english-poweredge-out-of-warranty-support/poweredge-2900-perc-6i-backplane-degraded-driver-out-of-date/647f759df4ccf8a8de3a00af) reports resolution after updating management software, but gives a less useful probe/clear lifecycle.

### `exp-005`

- **Authors / publisher / period:** `linux-tg`, `J0sephus1`, and Dell moderators; Dell Technologies Community; 2021-07-05 through 2021-09-16.
- **Copyright-safe preservation:** Link-down/up messages appeared across multiple systems after iDRAC 5.x updates. Hardware and cabling swaps did not carry the problem away. Rolling back to 4.40.40 stopped it, a later 5.00.10 upgrade reproduced it, and another rollback was required.
- **Uncertainty:** A 45-minute clean interval is useful but short. The thread establishes management-reported flapping and firmware correlation; it does not provide packet-loss or switch-counter proof for every system.
- **Rejected alternatives:** Generic iDRAC release and rollback pages describe supported operations but do not preserve this case's repeated A/B behavior or hardware-elimination evidence.

### `exp-006`

- **Author / publisher / date:** `Johannes`; serverbuilds.net Forums; 2019-07-16.
- **Copyright-safe preservation:** Power was lost during a BMC update, leaving the board otherwise unresponsive. The author reached the embedded controller through its board-specific serial header, transferred the correct image, checked platform identity and image integrity, and flashed it. The author says this method worked and gives reset followed by normal BMC/board startup as the acceptance boundary.
- **Uncertainty:** The source does not preserve an independent post-reset login, inventory, sensor check, or persistence test. This is a community procedure for one Gigabyte board and controller generation, not vendor service authority; later replies show that superficially similar boards, headers, banks, and images behave differently.
- **Explicitly rejected primary:** [Dell R720xd motherboard initialization error](https://www.dell.com/community/en/conversations/rack-servers/720xd-motherboard-initialization-error-fix-or-replace/64d7d8a1e76b0831726869a4). The owner reports replacing the board but does not report post-repair BMC or system verification.
- **Alternate with weaker execution evidence:** [Dell C6100 / XS23-TY BMC recovery procedure](https://www.dell.com/community/en/conversations/poweredge-hardware-general/pe-c6100-xs23-ty-bmc-not-alivenot-present-recovery-procedure/647f5c4af4ccf8a8de73f10b). It gives a recovery procedure and mechanism, but the initiating post does not narrate the author's own executed before/after recovery as explicitly as `exp-006`.

## Shared safety and authority boundary

These sources are evidence, not service instructions. CPU-contact manipulation, energized power measurement, RAID member replacement, management-state clearing, firmware rollback, and bootloader-level firmware recovery all require platform-specific procedures, protected data and configuration, suitable tools, authorization, and a rollback or replacement plan. The selected cases justify distinct educational reasoning arcs only. They do not authorize copying a procedure, creating an object, or changing gameplay.
