# `sfp-076` — Shutdown under load resolved at the CPU–heatsink interface

## Pair identity

- Symptom: `symptom.thermal.shutdown_under_load` — Shutdown Under Load
- Fault: `fault.thermal.heatsink.contact_poor` — Poor Heatsink Contact

## Source

- [My power supply/motherboard nightmare](https://superuser.com/questions/268041/my-power-supply-motherboard-nightmare)
- Firsthand author: `nopcorn`, with diagnostic input from Super User contributors
- Super User, asked 2011-04-07 and last edited 2012-09-02; accessed 2026-08-18

## Selection

**Score: 9/10.** The account preserves several plausible hardware causes, a failed power-management change, a reproducible temperature/load relationship, a thermal-interface repair, and a successful temperature result. The exact attribution to poor contact is partly inferred and explicitly qualified.

## Synopsis

A computer intermittently shut off completely and required PSU switch cycling before it could restart. PSU, motherboard, graphics, sound, and overheating explanations were considered. The shutdown became reproducible during video-like CPU load while monitored temperature climbed to about 81 °C. The author then applied new thermal paste between CPU and heatsink, removed dust, and improved cable routing; the machine was reported solved and idled at 35 °C.

## Lifecycle reduction

| # | Category | What happened | Lifecycle contribution | Fidelity | Source locator | Domain phrases |
| ---: | --- | --- | --- | --- | --- | --- |
| 1 | Observe | The computer fully shut off at unpredictable times and could restart only after cycling the PSU switch. | Establishes a hard shutdown rather than an application crash. | explicit | Question opening sequence | full shutdown; PSU switch; cannot power on |
| 2 | Hypothesize | The author and responders considered overheating, PSU protection, motherboard damage, graphics, sound, and short-circuit causes. | Creates a broad candidate set instead of assuming the earlier PSU history proves a power fault. | explicit | Question and early answers/comments | overheating; PSU; motherboard; graphics; short circuit |
| 3 | Test | Enabling the motherboard’s Cool ’n’ Quiet function did not prevent another crash. | Contradicts the idea that this power-management change alone corrects the failure. | explicit | Question, first hypothesis paragraph | Cool ’n’ Quiet; firmware setting; crash |
| 4 | Observe | The author noticed shutdowns occurred mostly during YouTube or HD video playback. | Identifies load as a repeatable context and makes a thermal test practical. | explicit | First edit | video playback; CPU load; shutdown |
| 5 | Test | While running a full-screen visualization, the author watched CPU temperature rise to about 81 °C and then observed the shutdown. | Couples controlled load, temperature evidence, and the failure, strongly supporting a thermal cause over unrelated power or board candidates. | explicit | Second edit | workload; CPU temperature monitor; 81 °C; thermal shutdown |
| 6 | Test | Responders compared the result with a typical firmware thermal cutoff and suggested reviewing the BIOS threshold or using a dedicated CPU stressor. | Interprets the measured result and proposes confirmation against platform limits. | explicit | Thermal answer and comments | BIOS thermal cutoff; `cpuburn`; stress test; temperature threshold |
| 7 | Isolate | The evidence isolates inadequate CPU heat transfer as the actionable area; poor CPU–heatsink contact is the paired-fault interpretation supported by the later paste repair. | Crosses from competing subsystems to the thermal interface, while retaining the inference caused by combined repairs. | inferred | Synthesis of second edit, thermal answer, and final edit | CPU heatsink; thermal interface; poor contact |
| 8 | Repair | The author applied new thermal paste to the CPU–heatsink interface. | Restores the thermal interface associated with the paired fault. | explicit | Final edit | thermal paste; CPU; heatsink; restore contact |
| 9 | Repair | The author also removed dust and improved cable management. | Changes airflow at the same time, creating an alternative contribution to the resolution. | explicit | Final edit | dedusting; cooling path; cable management |
| 10 | Verify | The author reports the problem solved and an idle CPU temperature of 35 °C. | Confirms improved thermal state and reported resolution, though not a documented post-repair load test. | explicit | Final edit | 35 °C idle; solved; temperature verification |

## Absent stages

- **Document:** The final edit reports the outcome but does not describe a separate ticket, Worklog, report, or comparable documentation action.

## Uncertainties and inferences

- The source explicitly isolates overheating, not poor contact alone. Thermal paste, dust removal, and cable management were combined, so the specific paired fault is supported but confounded.
- The original workload was not explicitly repeated after repair. Idle temperature and the author’s “solved” report are weaker than a controlled post-repair load verification.
- `cpuburn`, CoreTemp, and BIOS-threshold checks were discussed; the reported execution used a full-screen visualization and a temperature monitor instead.

## Cross-reference analysis

- [Found database coverage](../database_cross_reference/found/sfp-076--shutdown-under-load--poor-heatsink-contact--nopcorn.md)
- [Not-found database coverage](../database_cross_reference/not_found/sfp-076--shutdown-under-load--poor-heatsink-contact--nopcorn.md)
