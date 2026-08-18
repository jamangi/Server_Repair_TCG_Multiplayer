# v0.1 source ledger

Access date for every selected source: 2026-08-18.

Scores use the TASK-004 rubric: Observe 1, Hypothesize 2, Test 2, Isolate 2, Repair 1, Verify 1, and Document 1. The exact symptom and fault match are eligibility requirements, not points.

## `sfp-012` — No POST → Failed ECC DIMM

- **Selected source:** [R210 II no fan, no POST just a single amber flashing light](https://www.dell.com/community/en/conversations/poweredge-hardware-general/r210-ii-no-fan-no-post-just-a-single-amber-flashing-light/647f87bbf4ccf8a8de6f8bcb)
- **Author:** `quistian`, with troubleshooting assistance from Dell community operator `DiegoLopez`
- **Publisher / type:** Dell Technologies Community; firsthand support thread
- **Published / resolved:** 2020-04-22 / 2020-04-24
- **Selection score:** 9/10 — Observe 1, Hypothesize 2, Test 2, Isolate 2, Repair 1, Verify 1, Document 0
- **Rationale:** The thread preserves the no-POST observation, an ESD/electrical alternative, an interpreted diagnostic LED, unsuccessful rollback and peripheral-removal tests, a partial power-drain result, and a conclusive single-DIMM substitution followed by restored POST.
- **Rejected alternatives:** Generic vendor no-POST and memory checklists lacked a firsthand sequence with a confirmed failed DIMM. Threads that ended after reseating memory established a different fault.
- **Preservation concern:** The Dell URL is directly accessible, but community migrations can change formatting. The source says “DIMM,” not “ECC DIMM”; the server context and authoritative pair make the domain match reasonable, while the case records that wording difference.

## `sfp-030` — No DHCP Lease → DHCP Lease Failure

- **Selected source:** [Ubuntu 16.04 LTS - DHCP deliver IPv6 but not IPV4](https://serverfault.com/questions/973255/ubuntu-16-04-lts-dhcp-deliver-ipv6-but-not-ipv4)
- **Author:** Alexandre Serrano, with diagnostic input from Dennis Nolte
- **Publisher / type:** Server Fault; firsthand question-and-answer thread
- **Published / resolved:** 2019-06-28 / 2019-07-01
- **Selection score:** 10/10 — Observe 1, Hypothesize 2, Test 2, Isolate 2, Repair 1, Verify 1, Document 1
- **Rationale:** The account preserves the interface state and command outputs, tests DHCP both by broadcast and against the known server, considers server/link alternatives, and confirms that an exhausted IPv4 pool was corrected by removing stale reservations.
- **Rejected alternatives:** Generic Ubuntu DHCP guides supplied commands but no confirmed cause. Other lease-failure threads ended with speculative network-service causes or a static-address workaround rather than isolating DHCP availability.
- **Preservation concern:** The resolution first appears as a comment and is then copied into the accepted answer. The wording is informal, but the cause, repair, and success report are explicit.

## `sfp-039` — No Power → Failed PSU

- **Selected source:** [How to tell for sure if my PSU has died?](https://www.reddit.com/r/techsupport/comments/g5sjp7/how_to_tell_for_sure_if_my_psu_has_died/)
- **Author:** `superNC`, with community diagnostic input
- **Publisher / type:** Reddit `r/techsupport`; firsthand support thread
- **Published / resolved:** 2020-04-22 / 2020-04-22
- **Selection score:** 9/10 — Observe 1, Hypothesize 2, Test 2, Isolate 2, Repair 1, Verify 1, Document 0
- **Rationale:** The source begins with a suddenly dead machine, explicitly weighs motherboard versus PSU, records an ambiguous paperclip test, discusses voltage testing and zero-RPM behavior, and confirms the PSU through successful substitution and replacement.
- **Rejected alternatives:** Manufacturer paperclip-test pages and PSU tester guides were generic procedures. Other firsthand posts lacked a confirmed replacement outcome or resolved to a motherboard fault.
- **Preservation concern:** Reddit preserves the direct thread today but relative date labels can obscure the date; its day is corroborated by the thread archive links. The hardware is an ATX desktop PSU rather than a server hot-swap unit, so that component mapping remains generic rather than exact.

## `sfp-057` — RAID Degraded → Failed SAS Drive

- **Selected source:** [Rebuild RAID5 in HP PROLIANT ML370 G5](https://community.hpe.com/t5/hpe-proliant-servers-ml-dl-sl/rebuild-raid5-in-hp-proliant-ml370-g5/td-p/5544761)
- **Author:** S. Swaminathan, with report analysis from HPE community expert Vijayasarathy
- **Publisher / type:** Hewlett Packard Enterprise Community; firsthand support thread with attached diagnostic report
- **Published / final resolution:** 2012-02-09 / 2012-02-19
- **Selection score:** 10/10 — Observe 1, Hypothesize 2, Test 2, Isolate 2, Repair 1, Verify 1, Document 1
- **Rationale:** The source explicitly identifies a three-member RAID 5 made from 146 GB SAS drives, records the initial member replacement and failed rebuild, tests member and controller states, attaches an ADU report, isolates a second drive with hard read errors and predictive failure, and finishes with a rebuilt server restored from backup.
- **Rejected alternatives:** [Smart Array 6i controller - Drive failure](https://community.hpe.com/t5/hpe-proliant-servers-ml-dl-sl/smart-array-6i-controller-drive-failure/td-p/4260557) has a cleaner automatic-rebuild verification but does not establish SAS media. Other degraded-array threads did not confirm which component caused the state.
- **Preservation concern:** The final post confirms a from-scratch rebuild and backup restore but does not explicitly say that Bay 3 was replaced or that the logical drive returned to a healthy state. The reduction preserves that gap. HPE adds a `nobounce` query during some redirects, but the canonical URL remains directly accessible.

## `sfp-076` — Shutdown Under Load → Poor Heatsink Contact

- **Selected source:** [My power supply/motherboard nightmare](https://superuser.com/questions/268041/my-power-supply-motherboard-nightmare)
- **Author:** `nopcorn`, with diagnostic input from several Super User contributors
- **Publisher / type:** Super User; firsthand question-and-answer thread
- **Published / last source edit:** 2011-04-07 / 2012-09-02
- **Selection score:** 9/10 — Observe 1, Hypothesize 2, Test 2, Isolate 2, Repair 1, Verify 1, Document 0
- **Rationale:** The account compares power, board, and thermal explanations, reproduces shutdown while CPU temperature rises under load, and reports resolution after renewing the CPU–heatsink thermal interface, cleaning, and improving airflow.
- **Rejected alternatives:** Generic overheating guides lacked a real competing-hypothesis sequence. Cases solved only by fan replacement or dust removal established different paired faults.
- **Preservation concern:** Overheating is explicit, but poor heatsink contact is inferred from the successful thermal-paste repair. Dust removal and cable management occurred at the same time, so attribution to contact alone is confounded and is not overstated in the case.
