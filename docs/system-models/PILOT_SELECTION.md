# Reproducible five-Ticket System Model pilot

Status: **selected from the exact released Story denominator; selection does not approve a System architecture or profile**

The machine ledger is [`pilot-selection-v1.json`](pilot-selection-v1.json). The verifier is [`verify-task-049.mjs`](verify-task-049.mjs). It pins [`released-story-domain-coverage-v3.json`](../story/coverage/released-story-domain-coverage-v3.json) at SHA-256 `cd66630f1db0362d24e3e9bb9c222fc60bfe7ec8b3facd9149bb07e43ef98013` and rejects drift.

## Denominator and classification

The denominator is all 18 released Story Tickets across the 12 Matches in `quiet-cascade-expansion-v3`. Eligibility requires presence in that committed coverage ledger and its complete solvability proof. No Ticket is added, rebuilt, renamed, or excluded.

Each Ticket is classified from its released fingerprint plus the ledger's public Symptoms, public Candidates, minimal-witness diagnostic definitions, and required Repair definition. Hidden true Faults and authored outcomes are not classification inputs. The ledger records the exact IDs supporting each reviewed classification, and the verifier requires each basis ID to occur in those non-hidden coverage fields.

The eleven pressure flags make the task's eight categories testable:

| Flag | Classification question |
| --- | --- |
| `management_host_control` | Must the model distinguish management/BMC observation, control, initialization, or firmware from the host plane? |
| `preboot_firmware_post_memory_boot_policy` | Does the Ticket pressure host firmware, POST, memory behavior, device discovery, or boot policy before OS ownership? |
| `storage_path` | Must it represent a storage device, connector/cable, backplane, controller, logical group, or boot path? |
| `power_thermal_load` | Must it explain power distribution/redundancy or thermal/load behavior? |
| `network_post_os_runtime` | Must it represent a network path, driver/firmware boundary, OS-owned configuration, or runtime symptom? |
| `physical_repair` / `logical_repair` | Is the required Repair principally a physical service action or a state/configuration/firmware change? |
| `direct_observation` | Does a required check inspect or read the target/configuration itself? |
| `path_based_observation` | Does a required check vary or traverse a supported path to localize a role? |
| `indirect_observation` | Does a required check infer through logs, telemetry, counters, symptoms, or downstream behavior? |
| `ambiguous_public_candidates` | Are at least two public Candidates active, requiring Candidate closure and non-leak review? |

These are pilot-planning labels, not new domain facts or gameplay effects. An action can exert more than one observation pressure; the future model must document the exact observation point and limitation.

## Deterministic calculation

The verifier:

1. validates the pinned source digest and exact 18-ID denominator;
2. validates every Ticket's shift, fingerprint, basis IDs, and pressure names against the committed coverage artifact;
3. enumerates all `18 choose 5 = 8,568` five-Ticket sets;
4. ranks each set by the following tuple, in order:
   1. number of the 11 pressures covered, descending;
   2. balanced depth, `sum(min(2, selected count for pressure))`, descending, so a second exercise adds resilience but repeated common flags cannot dominate;
   3. total pressure occurrences, descending;
   4. distinct released Shift count, descending; and
   5. the sorted stable Ticket-ID signature, ascending, as the final deterministic tie-break; and
5. compares the winning IDs with the committed expected selection.

The winning score is **11/11 pressure coverage, 20/22 balanced depth, 27 pressure occurrences, and 4 distinct Shifts**. Blocking provenance, reality, leakage, or authority defects discovered in TASK-050 still reject an individual model or architecture; this score cannot override them.

## Selected Tickets

| Stable released Ticket ID | Released fingerprint | Pressure contribution and reason |
| --- | --- | --- |
| `ticket.generated.3ec80b1b0e7221ac725aedf9` | `fingerprint.boot.missing_nvme` | Separates a management-log observation from the host boot/storage path; pressures preboot discovery, device/controller/cable alternatives, a physical device Repair, indirect observation, and Candidate leakage. |
| `ticket.generated.5352abd871c2e9076be92a0b` | `fingerprint.storage.loose_cable` | Forces a device–cable/connector–backplane/controller path broad enough for five public Candidates, with direct inspection, path-based inventory, and a physical reseat. |
| `ticket.generated.3fd6eb04534f79b5b3f87f98` | `fingerprint.power.failed_distribution_board` | Requires a source-backed input/PSU/bay/shared-distribution/system-board path, known-good cross-path observation, physical FRU service boundary, and five-way public ambiguity. |
| `ticket.generated.b34238282822e93980b5f1ad` | `fingerprint.firmware.incompatible_version_set` | Crosses management, host/device firmware, NIC physical alternatives, and runtime link behavior; combines direct version review, indirect soak/counters, and a logical rollback/update Repair. |
| `ticket.generated.f32b85cbf2054fdf0114f42a` | `fingerprint.management.corrupt_bmc_firmware` | Makes the host/BMC distinction unavoidable, pressures firmware/recovery lifecycle and service fallback, uses direct/indirect controller-state observation, and requires a logical recovery without revealing which of two firmware Candidates is true. |

### Coverage by selected set

| Pressure | Selected coverage |
| --- | --- |
| Management/BMC versus host | Missing NVMe, firmware version set, BMC recovery |
| Preboot firmware/POST/memory/boot policy | Missing NVMe and BMC recovery |
| Storage path | Missing NVMe and loose cable |
| Power or thermal/load | Power distribution board |
| Network or post-OS runtime | Firmware version set |
| Physical Repair | Missing NVMe, loose cable, power distribution board |
| Logical Repair | Firmware version set and BMC recovery |
| Direct observation | Loose cable, firmware version set, BMC recovery |
| Path-based observation | Loose cable and power distribution board |
| Indirect observation | Missing NVMe, firmware version set, BMC recovery |
| Ambiguous public Candidates | All five |

## Gaps and limits

The released 18-Ticket corpus can cover every requested top-level category, so no missing category is concealed with an invented Ticket. The five-set optimum does **not** contain a memory-primary or thermal/load-primary Ticket even though the denominator contains both; those behaviors remain required model planes where applicable, but TASK-050 may not claim the pilot directly validates a detailed memory-training sequence or cooling topology. The selected power Ticket covers the combined power-or-thermal category, and the selected preboot Tickets cover the combined firmware/POST/memory/boot-policy category without teaching a memory-specific repair.

Four of the five Tickets come from distinct Shifts because two complementary storage Tickets share Shift 6. Story exposure is not learner mastery, and this selection is not a content-quality ranking. It exists solely to maximize model/teaching pressure for the architecture pilot.

## Reproduction

From the repository root:

```powershell
node docs/system-models/verify-task-049.mjs
```

Success reports the source denominator, 8,568 evaluated combinations, the five stable IDs, the exact score tuple, link checks, and zero failures.
