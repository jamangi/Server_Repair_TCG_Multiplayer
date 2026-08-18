# `sfp-012` — No POST caused by a failed DIMM

## Pair identity

- Symptom: `symptom.boot.no_post` — No POST
- Fault: `fault.memory.dimm.failed` — Failed ECC DIMM

## Source

- [R210 II no fan, no POST just a single amber flashing light](https://www.dell.com/community/en/conversations/poweredge-hardware-general/r210-ii-no-fan-no-post-just-a-single-amber-flashing-light/647f87bbf4ccf8a8de6f8bcb)
- Firsthand author: `quistian`; diagnostic responder: `DiegoLopez`
- Dell Technologies Community, 2020-04-22 through 2020-04-24; accessed 2026-08-18

## Selection

**Score: 9/10.** This source was selected because it preserves competing electrical and memory explanations, several interpreted test results, conclusive component substitution, repair, and restored POST. It does not show a separate work-record action.

## Synopsis

After adding memory to a previously working PowerEdge R210 II, the operator found no fans, video, or POST and one flashing amber diagnostic indicator. Restoring the previous configuration and removing peripherals did not help. Draining residual power restored fan activity but not POST. The indicator meaning redirected Diagnosis to memory; substituting another DIMM restored POST, and the server then ran with four working DIMMs.

## Lifecycle reduction

| # | Category | What happened | Lifecycle contribution | Fidelity | Source locator | Domain phrases |
| ---: | --- | --- | --- | --- | --- | --- |
| 1 | Observe | Following a memory upgrade, the server produced no fan activity, video, boot, or POST and flashed one amber indicator. | Establishes the initial no-POST state and a visible diagnostic signal. | explicit | Original post, opening paragraphs | server; DIMM; no POST; amber diagnostic LED |
| 2 | Test | The operator restored the original single-DIMM configuration and removed USB, storage, optical, and network peripherals; the state did not change. | Contradicts a simple peripheral conflict and shows that rollback alone did not restore operation. | explicit | Original post, final paragraphs | single DIMM; peripheral removal; minimum configuration |
| 3 | Hypothesize | The responder proposed electrical or physical damage during the intervention, including possible ESD, while also noting that the indicator could mean no memory was detected. | Creates competing intervention-damage and memory-subsystem explanations. | explicit | First response | ESD; electrical damage; memory subsystem; diagnostic indicator |
| 4 | Test | The operator reset and drained residual power. Fans returned, but POST did not. | Splits the original observation: it corrects the fan state while leaving the decisive no-POST symptom, so Diagnosis must continue. | explicit | Final reply, first two sentences | reset and drain power; fans; no POST |
| 5 | Test | The operator replaced the installed single DIMM with another and POST returned. | A component-substitution result strongly distinguishes the installed DIMM from system-board and persistent power explanations. | explicit | Final reply, second sentence | single-DIMM substitution; replacement DIMM; POST |
| 6 | Isolate | The paired DIMM is treated as failed because the same server POSTs when that DIMM is replaced by another. | Crosses the Isolation gateway through controlled substitution rather than through repair success alone. | inferred | Inference from final reply and unchanged platform | failed DIMM; known-good substitution |
| 7 | Repair | The failed DIMM was removed and working DIMMs were installed. | Changes machine state by replacing the isolated memory module. | explicit | Final reply, last two sentences | replace failed DIMM; four 8 GB DIMMs |
| 8 | Verify | POST returned and the server was running with four 8 GB DIMMs. | Confirms the original boot-stage failure is gone and the intended memory configuration operates. | explicit | Final reply, last two sentences | POST verification; memory inventory |

## Absent stages

- **Document:** The thread communicates results, but it does not describe a separate ticket, Worklog, report, or comparable documentation action.

## Uncertainties and inferences

- The source calls the module a DIMM, not an ECC DIMM. The platform and authoritative pair support the mapping, but the narrower ECC property is not independently proven by the prose.
- The source does not identify a slot-level electrical test or memory-diagnostic result. Isolation rests on substitution in the same server.
- Minimum-to-POST was recommended, but the operator reports peripheral removal rather than confirming every element of the responder’s proposed minimum configuration.

## Cross-reference analysis

- [Found database coverage](../database_cross_reference/found/sfp-012--no-post--failed-ecc-dimm--quistian.md)
- [Not-found database coverage](../database_cross_reference/not_found/sfp-012--no-post--failed-ecc-dimm--quistian.md)
