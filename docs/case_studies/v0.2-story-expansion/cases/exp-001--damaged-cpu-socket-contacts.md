# `exp-001` — Damaged CPU socket contacts

## Research boundary

This is a source-preserving TASK-041 reduction. It supports later review of a distinct episode but does not authorize domain, gameplay, or Story content.

## Source and eligibility

- **Primary source:** [r910 will not power on with 4 processors](https://www.dell.com/community/en/conversations/rack-servers/r910-will-not-power-on-with-4-processors/647f7d25f4ccf8a8deb93b08)
- **Firsthand author / publisher:** `OWEN SPARKES 69`; Dell Technologies Community
- **Source period / access:** 2018-10-26 through 2018-10-28; accessed 2026-08-28
- **Eligibility:** Eligible. It reports the initial failure, competing paths, repeatable processor and socket-location tests, observed contact damage, corrective work, and a four-processor boot.
- **Lifecycle score:** 9/10; Document is absent.

## Copyright-safe paraphrase

A four-socket PowerEdge R910 booted with two processors but failed before BIOS when all four were installed. Testing the processors in pairs and mixed combinations showed that each could boot. An unsupported population using sockets 1, 2, and 4 reached BIOS, focusing attention on socket 3. The owner then found slightly displaced contacts in that socket, corrected them, and reported that the server booted with all four processors.

## Lifecycle reduction

| # | Category | Atomic source event | Lifecycle contribution | Fidelity | Source locator | Current stable-object cross-reference |
| ---: | --- | --- | --- | --- | --- | --- |
| 1 | Observe | The server booted with two processors but failed before BIOS with four installed and displayed processor-voltage/failsafe errors. | Establishes the load/population-dependent no-POST condition. | explicit | Opening post | `symptom.boot.no_post`; `component.compute.cpu` |
| 2 | Hypothesize | The owner treated processors, power capacity or settings, firmware, memory population, and the board/socket path as plausible explanations. | Preserves multiple candidates rather than treating the displayed voltage text as proof; the candidates are reconstructed from the author's reported choices. | inferred | Opening post | `fault.cpu.not_seated`; `fault.board.system.failed`; `fault.memory.population.invalid`; `fault.compute.cpu_socket.contacts_damaged` |
| 3 | Test | Both original processor pairs and mixed pairs booted in the supported two-processor arrangement. | Contradicts a simple failed-processor explanation. | explicit | Opening post, processor-pair paragraph | Generic processor substitution; no exact current Test |
| 4 | Test | Supplying all four PSUs and reducing processor power settings did not restore four-processor boot. | Contradicts a simple external power-capacity or configured-power explanation. | explicit | Opening post, attempted-remedies list | Generic power/configuration comparison; no exact current Test |
| 5 | Test | Firmware updates and a reduced memory-riser configuration did not restore four-processor boot. | Retains the physical socket/board path after configuration alternatives fail. | explicit | Opening post, attempted-remedies list | Generic firmware and minimum-configuration tests |
| 6 | Test | With processors in sockets 1, 2, and 4, the unsupported arrangement nevertheless reached BIOS. | Localizes the failure to the path introduced by socket 3 rather than to processor count alone. | explicit | Author update | Generic location isolation; related to `test.compute.socket_magnified_inspection` but not the same act |
| 7 | Test | Visual inspection of socket 3 found slightly bent contacts. | Supplies direct physical evidence at the localized position. | explicit | Final author update | `test.compute.socket_magnified_inspection`; `component.compute.cpu_socket` |
| 8 | Isolate | Socket 3 contact damage is the actionable fault because the processors work in other combinations and damage is observed at the failing location. | Crosses from processor/power/configuration possibilities to a location-specific physical fault through synthesis of the reported evidence. | inferred | Pair and location tests plus final inspection | `fault.compute.cpu_socket.contacts_damaged` |
| 9 | Repair | The owner realigned the displaced contacts. | Changes the isolated socket state. | explicit | Final author update | `repair.compute.restore_socket_contacts` as a generic equivalent, not approval of the reported tool |
| 10 | Verify | The server then booted with all four ten-core processors installed. | Confirms restoration of the originally failing population. | explicit | Final author update | `verify.compute.socket_path` |

## Absent stage

- **Document:** No separate ticket, worklog, inventory capture, or service record is reported.

## Uncertainties, alternate source, and safety boundary

- The source does not preserve magnified images, torque values, a full processor/memory inventory, or a post-repair stress interval.
- The displayed regulator/failsafe codes are observations, not proof of a regulator failure.
- [E1245 and E1000 on an R910](https://www.dell.com/community/en/conversations/poweredge-hardware-general/e1245-e1000-on-r910/647f7bd0f4ccf8a8dea1a3c9) was rejected because it lacks a completed, verified socket-contact repair.
- The reported improvised contact manipulation is not a transferable repair instruction. Socket work requires power removal, ESD control, magnification, platform instructions, suitable tooling, and acceptance checks; otherwise board replacement or qualified service is the safe boundary.

## Distinct-episode value

The case can support an episode about evidence that follows a socket location rather than interchangeable processors. That reasoning pattern differs from generic “board failed” or “CPU failed” episodes. It remains research evidence only; later gates must decide relationships, mechanics, and narrative use.
