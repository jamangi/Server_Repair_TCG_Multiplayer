# `exp-005` — Incompatible firmware versions

## Research boundary

This is a source-preserving TASK-041 reduction. It supports later review of a distinct episode but does not authorize domain, gameplay, or Story content.

## Source and eligibility

- **Primary source:** [iDRAC keeps messaging: the NIC link is started](https://www.dell.com/community/en/conversations/poweredge-hardware-general/idrac-keeps-messaging-the-nic-in-slot-4-port-1-network-link-is-started/647f94b2f4ccf8a8de70eaff)
- **Firsthand reporters / publisher:** `linux-tg` and `J0sephus1`, with Dell moderators; Dell Technologies Community
- **Source period / access:** 2021-07-05 through 2021-09-16; accessed 2026-08-28
- **Eligibility:** Eligible as a corroborated multi-system thread. It records onset after iDRAC 5.x, hardware/cable substitution, rollback behavior, a clean interval, later reintroduction by upgrade, and another rollback.
- **Lifecycle score:** 9/10; Document is absent.

## Copyright-safe paraphrase

After iDRAC 5.x was installed, multiple PowerEdge systems began reporting repeated NIC link-down/link-up transitions. Updating adapter firmware did not help, and another reporter found that swapped hardware and cabling remained healthy. Returning to iDRAC 4.40.40 stopped the messages; one reporter observed no flaps for 45 minutes. A later upgrade to 5.00.10 brought the behavior back, after which the systems were rolled back again. Dell later acknowledged a development issue.

## Lifecycle reduction

| # | Category | Atomic source event | Lifecycle contribution | Fidelity | Source locator | Current stable-object cross-reference |
| ---: | --- | --- | --- | --- | --- | --- |
| 1 | Observe | Repeated NIC down/up messages began on multiple systems after installation of iDRAC 5.00.00.00. | Establishes firmware-change timing, fleet scope, and the link-flapping complaint. | explicit | Opening post | `symptom.network.link_flapping`; `component.management.bmc`; `component.network.nic` |
| 2 | Hypothesize | Participants considered switch port, cable, NIC hardware, adapter firmware, and the iDRAC version as competing explanations. | Prevents management messages alone from proving either a physical link fault or firmware regression. | explicit | Opening post and first responses | `fault.network.cable.failed`; `fault.network.nic.failed`; `fault.firmware.version_set.incompatible` |
| 3 | Test | A second reporter swapped hardware and cabling and found them operating correctly while the complaint remained associated with the affected version context. | Contradicts a simple NIC or cable defect. | explicit | `J0sephus1` post dated 2021-08-23 | Generic component/cable substitution; no exact current combined Test |
| 4 | Test | Downgrading to iDRAC 4.40.40 stopped the messages, and one reporter observed no further flaps for 45 minutes. | Supplies a version A/B comparison and a defined, though short, clean interval. | explicit | Posts dated 2021-07-07 and 2021-08-23 | `test.firmware.version_compatibility`; `test.network.link_counter_soak` |
| 5 | Test | A later upgrade to 5.00.10 caused the port-up/down behavior to return. | Reproduces the complaint when the suspect version family is reintroduced. | explicit | `J0sephus1` post dated 2021-09-16 | `test.firmware.version_compatibility`; `test.network.link_counter_soak` |
| 6 | Isolate | The repeated old-version/new-version comparison, physical-path substitutions, and Dell development acknowledgment isolate the incompatible firmware set as the actionable cause. | Crosses from NIC/cable possibilities to a repeatable firmware regression; Dell's explicit acknowledgment corroborates the inference. | inferred | Thread through 2021-09-16 | `fault.firmware.version_set.incompatible` |
| 7 | Repair | The affected systems were returned to iDRAC 4.40.40 after the later reproduction. | Restores the known non-flapping version set. | explicit | Posts dated 2021-09-16 | `repair.firmware.restore_compatible_versions` |
| 8 | Verify | Reporters state that messages stayed away on 4.40.40; one preserved a 45-minute no-flap interval. | Confirms the complaint does not occur during the source's reported rollback interval. | explicit | Posts dated 2021-07-07 and 2021-08-23 | `verify.firmware.compatible_persistent`, with a limited acceptance interval |

## Absent stage

- **Document:** Logs and a Dell support case are mentioned, but the source does not describe a distinct operator-authored worklog or handoff record containing the final diagnostic explanation.

## Uncertainties, alternate sources, and safety boundary

- The source establishes management-reported transitions. It does not preserve packet loss, switch telemetry, or interface-error counters for every affected system.
- The 45-minute observation is explicit but shorter than a production acceptance soak might require.
- Evidence comes from multiple reporters and models, so it supports a version-family regression pattern rather than universal incompatibility on every platform.
- Generic firmware release notes and rollback pages were not selected because they lack the thread's hardware elimination and repeated A/B reproduction.
- Firmware rollback must use a platform-supported dependency order, correct image, protected power, preserved configuration, and a recovery plan. A known-good version for these systems is not automatically appropriate for another model.

## Distinct-episode value

The case can support an episode where hardware substitution is clean but version correlation and a timed soak isolate a management-firmware regression. That differs from a broken cable or NIC episode and rewards reopening Diagnosis when a later upgrade reproduces the fault. It does not authorize firmware mechanics, version numbers, or a rollback Card.
