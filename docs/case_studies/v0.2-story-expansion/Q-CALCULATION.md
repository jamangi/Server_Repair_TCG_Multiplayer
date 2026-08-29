# Q calculation — Story expansion v0.2

Status: **research calculation only; no source, domain object, fingerprint, Ticket, gameplay path, or episode is approved by this report**

## Pinned inputs

- TASK-039 audit: `campaign-one-domain-coverage-v1`
- TASK-039 JSON SHA-256: `24bee750c6067c5241f49f5e30d47c33ec32ab03cece2e8a1f507e17878a5c3c`
- Domain: `core-domain-snapshot-technical-copy-v3`
- Playable coverage: `playable-coverage-v4`
- Ruleset: `first-version-v2`

## Existing-arc result

TASK-039 contains zero uncovered existing arcs that already combine a complete fingerprint, distinct required diagnostic work, Isolation, Repair, Verify, and closure witness. Its 16 Candidate-changing/non-minimal, 13 target-legal/Candidate-neutral, and 7 not-target-legal Bench diagnostics are opportunities, not complete episodes. Therefore `R = 0`.

## Arithmetic

```text
N  = 6
R  = 0
Q0 = max(0, N - R) = 6
adjustments = 0
Q  = Q0 + sum(adjustment.increment) = 6
```

No adjustment applies: Six qualifying cases fill six distinct subsystem/objective slots; no selected case fails lifecycle qualification and no objective/subsystem diversity collision remains.

## Six missing slots

| Slot | Qualifying case | Subsystem | Distinct objective | Fingerprint candidate | Current status |
| --- | --- | --- | --- | --- | --- |
| expansion-slot-01 | exp-001 | compute | `objective.compute.socket_contact_isolation` | `fingerprint-candidate.compute.bent_socket_contacts` | Case-backed; candidate path required |
| expansion-slot-02 | exp-002 | power | `objective.power.distribution_board_vs_mainboard` | `fingerprint-candidate.power.failed_distribution_board` | Case-backed; candidate path required |
| expansion-slot-03 | exp-003 | storage | `objective.storage.predictive_replacement_before_failure` | `fingerprint-candidate.storage.predictive_drive_failure` | Case-backed; candidate path required |
| expansion-slot-04 | exp-004 | management | `objective.management.stale_alert_vs_live_backplane_fault` | `fingerprint-candidate.management.stale_backplane_alert` | Case-backed; candidate path required |
| expansion-slot-05 | exp-005 | firmware-network | `objective.firmware.regression_vs_physical_link` | `fingerprint-candidate.firmware.idrac_link_flap_regression` | Case-backed; candidate path required |
| expansion-slot-06 | exp-006 | management-firmware | `objective.management.bmc_recovery_state_before_board_replacement` | `fingerprint-candidate.management.bmc_firmware_corruption` | Case-backed; candidate path required |

Exactly six qualifying primary cases are selected for six missing slots. A case remains research evidence until the later domain, authority, Builder, and Story gates pass.

## Commands

The pinned catalog exposes 13 Commands. This research registry authorizes 0 as useful current-Ticket Evidence and requires 0 for Isolation. Source utilities and transports are recorded without changing their type or current Command semantics.
