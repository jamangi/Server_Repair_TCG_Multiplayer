# `sfp-039` — No power caused by a failed PSU

## Pair identity

- Symptom: `symptom.power.no_power` — No Power
- Fault: `fault.power.psu.failed` — Failed PSU

## Source

- [How to tell for sure if my PSU has died?](https://www.reddit.com/r/techsupport/comments/g5sjp7/how_to_tell_for_sure_if_my_psu_has_died/)
- Firsthand author: `superNC`, with community diagnostic input
- Reddit `r/techsupport`, 2020-04-22; accessed 2026-08-18

## Selection

**Score: 9/10.** The source explicitly compares PSU and motherboard hypotheses, exposes ambiguity in an initial self-start test, discusses measurement alternatives, and confirms the failed PSU through successful substitution and replacement. It does not describe a separate work record.

## Synopsis

A previously operating PC died suddenly and would not power. The operator suspected the motherboard or PSU and attempted an ATX paperclip self-start test; the fan did not move and a small arcing sound was heard. Zero-RPM behavior made that result less than conclusive, while commenters proposed voltage measurement under the ATX pinout. Installing a new PSU restored the machine, isolating the old PSU as failed.

## Lifecycle reduction

| # | Category | What happened | Lifecycle contribution | Fidelity | Source locator | Domain phrases |
| ---: | --- | --- | --- | --- | --- | --- |
| 1 | Observe | The PC died suddenly and no longer powered on. | Establishes the initial no-power symptom. | explicit | Original post, opening | PC; no power; PSU |
| 2 | Hypothesize | The operator named either the motherboard or PSU as the cause. | Creates an explicit two-candidate Diagnosis. | explicit | Original post, opening | motherboard; PSU |
| 3 | Test | The operator performed a paperclip self-start test; the PSU fan did not move and only a small arcing sound occurred at the switch. | Produces evidence that supports a PSU problem, but does not yet eliminate model-specific fan behavior. | explicit | Original post, middle | paperclip test; PSU fan; arcing sound; power switch |
| 4 | Hypothesize | The operator and commenters noted that a zero-RPM fan mode could make non-spinning ambiguous; commenters proposed attaching a load or measuring connector voltages. | Revises interpretation of the first test and proposes stronger discriminating tests. | explicit | Original post and top comments | zero-RPM mode; attached load; multimeter; ATX pinout; PSU tester |
| 5 | Test | A new PSU was installed as a substitution and the machine powered successfully. | Directly distinguishes the old PSU from the motherboard under the observed conditions. | explicit | Original-post update | known-good PSU substitution; system powers on |
| 6 | Isolate | The old PSU is concluded to be failed because replacing only that candidate restores power. | Crosses the Isolation gateway using the substitution comparison. | explicit | Original-post update | failed PSU; substitution result |
| 7 | Repair | The failed PSU was replaced and the new unit remained installed. | Corrects the isolated power-supply fault. | explicit | Update and author follow-up | replace PSU |
| 8 | Verify | The author reports that the replacement solved the problem and did not take other components with it. | Confirms stable power at the level reported by the source. | explicit | Update and author follow-up | power restored; components operational |

## Absent stages

- **Document:** The source contains a conversational update but no distinct ticket, Worklog, diagnostic report, or documentation action.

## Uncertainties and inferences

- The source system uses a consumer ATX PSU, while the existing component is a server hot-swap PSU. Their diagnostic role is equivalent for substitution and replacement, but their interfaces and safety procedures differ.
- The paperclip result was deliberately treated as ambiguous. The replacement result, not fan non-movement alone, supports Isolation.
- Suggested multimeter, load, and dedicated-tester checks were not reported as executed.

## Cross-reference analysis

- [Found database coverage](../database_cross_reference/found/sfp-039--no-power--failed-psu--supernc.md)
- [Not-found database coverage](../database_cross_reference/not_found/sfp-039--no-power--failed-psu--supernc.md)
