# `exp-002` — Failed power distribution board

## Research boundary

This is a source-preserving TASK-041 reduction. It supports later review of a distinct episode but does not authorize domain, gameplay, or Story content.

## Source and eligibility

- **Primary source:** [T420 PowerEdge “VLT0204 Main board voltage outside of range”](https://www.dell.com/community/en/conversations/poweredge-hardware-general/t420-poweredge-vlt0204-main-board-voltage-outside-of-range/67fd91b469e6265ea77af6ab)
- **Firsthand author / publisher:** `JSHome`, with Dell community responders; Dell Technologies Community
- **Source period / access:** 2025-04-14 through 2025-05-26; accessed 2026-08-28
- **Eligibility:** Eligible with an inference disclosed at Isolation. It reports the initial symptom, progressive component reduction, both supplies in both bays, PDB replacement, and restored boot.
- **Lifecycle score:** 9/10; Document is absent.

## Copyright-safe paraphrase

After a secondhand redundant-power conversion and other upgrades, a PowerEdge T420 powered for only a moment before shutting down with a voltage-range alert. Returning memory to the earlier amount, removing the GPU and second CPU, and trying both power supplies individually in both bays did not change the behavior. The owner later replaced the power distribution board and reported normal boot.

## Lifecycle reduction

| # | Category | Atomic source event | Lifecycle contribution | Fidelity | Source locator | Current stable-object cross-reference |
| ---: | --- | --- | --- | --- | --- | --- |
| 1 | Observe | Pressing power produced a brief start, immediate shutdown, and a VLT0204 main-board voltage-range alert. | Establishes the no-power/immediate-shutdown and voltage evidence. | explicit | Opening post | `symptom.power.no_power`; `symptom.power.voltage_out_of_range` |
| 2 | Hypothesize | The owner considered the PDB and PSU backplane, while responders retained added components, connections, PSUs, and the system board as alternatives. | Creates a shared-path versus individual-component Diagnosis. | explicit | Opening post and first responses | `fault.power.distribution_board.failed`; `fault.power.psu.failed`; `fault.board.system.failed`; `fault.power.input.cable_loose` |
| 3 | Test | Memory was returned to the earlier configuration, then the GPU and second CPU were removed; the shutdown persisted. | Contradicts the added memory, GPU, or second CPU as the sole trigger. | explicit | Opening post, chronological test list | Generic minimum-configuration testing |
| 4 | Test | Each of the two PSUs was tried alone in each supported bay and every arrangement failed the same way while the supply indicators remained green. | Contradicts one failed supply or one bay as a sufficient explanation and points toward a shared downstream path. | explicit | Opening post, PSU test list | `test.power.distribution_path_isolation`; `test.power.known_good_psu` as generic equivalents |
| 5 | Test | A later requested minimum state—one original CPU, one DIMM, no GPU, and one PSU—still produced the same error. | Confirms that removable load reduction does not clear the fault. | explicit | Author follow-up dated 2025-04-16 | `test.general.minimum_configuration` |
| 6 | Isolate | The PDB is treated as the actionable failed path after component reduction and cross-bay supply results, with later PDB-only replacement restoring boot. | Makes the strongest source-supported isolation while disclosing that no decisive pre-repair PDB measurement is preserved. | inferred | Synthesis of reported tests and closing update | `fault.power.distribution_board.failed` |
| 7 | Repair | The owner replaced the PDB identified as DPN KK3YX. | Changes the shared distribution path. | explicit | Closing update dated 2025-05-26 | `repair.power.replace_distribution_board`; `component.power.distribution_board` |
| 8 | Verify | The owner reports that the server then booted normally. | Confirms the original startup failure was removed. | explicit | Closing update | `verify.power.distribution_path` as the closest current validation |

## Absent stage

- **Document:** No separate service record, measured rail report, or retained acceptance evidence is reported.

## Uncertainties, alternate source, and safety boundary

- The author mentions additional testing without preserving it. A failed capacitor is offered only as a possibility.
- Visual, continuity, and voltage checks were discussed; their execution and values were not reported and are not lifecycle Test rows here.
- [A later T420 VLT0204 report](https://www.dell.com/community/pt/conversations/servidores/vlt0204-system-board-voltage-outside-of-range/65b9343942e0c52e7e18419c) was rejected because it ends at a board-replacement recommendation.
- Do not generalize connector voltages or pinouts. Shared-power-path work requires the exact service documentation, de-energization and discharge where specified, rated instruments, safe probe access, and qualified personnel. The forum discussion is not authority to live-probe a proprietary server connector.

## Distinct-episode value

The case can support an episode in which two apparently healthy interchangeable PSUs fail across both bays because the fault lies in their shared distribution path. That is distinct from a failed-PSU episode. It does not itself authorize a new relationship, diagnostic route, repair Card, or Story scene.
