# System Model contract worked examples

Status: **planning walkthroughs over released Tickets; no production profile data**

These examples exercise the contract at role/abstraction level. Names such as “boot-selected storage path” are illustrative prospective model roles, not new stable Component IDs or researched product facts.

## Storage walk: missing NVMe boot device

Released Ticket: `ticket.generated.3ec80b1b0e7221ac725aedf9` (`fingerprint.boot.missing_nvme`). Its public surface in the pinned coverage ledger contains `symptom.boot.no_boot_device` and five Candidates:

- `fault.boot.device.not_detected`
- `fault.boot.order.incorrect`
- `fault.storage.cable.loose`
- `fault.storage.nvme.device_failed`
- `fault.storage.raid.controller_failed`

### 1. Public requirement envelope and resolution

Before private validation, the author defines a public envelope with host firmware/boot policy, a boot-selected storage-device abstraction, a connection/path abstraction broad enough for a cable or connector, and a controller abstraction. Because the released witness uses `test.system.bmc_logs`, the model also needs a management observation point capable of reporting the host/storage event without pretending the BMC is the host.

A Finder candidate may be considered only from these public requirements and a stable public resolver key. It must not be selected because it happens to contain the hidden failed part. If exact option detail would exclude one Candidate, the public profile uses the honest “boot-selected storage path” abstraction rather than drawing a truth-specific direct-attached or controller-attached device.

### 2. Public-candidate closure

| Public Candidate | Visible possibility that must remain |
| --- | --- |
| Boot device not detected | Firmware discovery/handoff plus the boot-selected storage path. |
| Boot order incorrect | Host-firmware boot-policy control surface and selection relation. |
| Storage cable loose | A connection/path role or honest connection abstraction. |
| NVMe device failed | A serviceable boot-device role, without a failed highlight. |
| RAID controller failed | A controller/path role or abstraction that does not claim direct attachment. |

The public diagram labels all as possibilities only through ordinary Ticket Candidates; it adds no suspect styling, current-health label, or Candidate rank.

### 3. Private accept/reject pass

The private validator can inspect the authored hidden Fault instances, the `test.system.bmc_logs` outcome target, accepted Isolation, `repair.storage.replace_nvme`, and both `verify.storage.device_detected` and `verify.boot.normal_boot`. It checks that the same candidate profile can host those facts, that the NVMe role is serviceable at the required granularity, and that management observation plus both verification points exist. It returns compatible/incompatible only. Its hidden reason never changes the resolver key or public projection.

### 4. Shared-data outputs

- The description program explains management observation in parallel with host startup, host firmware selecting/discovering a boot-storage path, and OS handoff only after a usable boot device. Conditional direct-versus-controller attachment remains an explicit option clause.
- The accessible diagram and text equivalent show the same management observation edge, boot policy, device/path/controller abstractions, stages, and option scope.
- The rationale graph for Management Event Log Review says the management surface can report timestamped host/storage events on this kind of system. It does not state the log will confirm NVMe failure or make the Test legal.
- The engine's ordinary intent projection separately determines whether the action is currently legal.

## Non-storage walk: shared power-distribution path

Released Ticket: `ticket.generated.3fd6eb04534f79b5b3f87f98` (`fingerprint.power.failed_distribution_board`). Its public Symptoms are voltage out of range and no power. Its public Candidates include system board, distribution board, input cable, failed PSU, and unseated PSU.

### 1. Public requirement envelope and resolution

The envelope requires an external input/connection role, at least one serviceable PSU role with any supported bay/redundancy qualification, a shared distribution/power-good role, and a system-board power consumer. `test.power.distribution_path_isolation` requires a documented way to compare a known-good supply across supported bays or paths; the model cannot invent live-probing points or assume all PSU bays are electrically equivalent.

The public-selected profile must have primary evidence that its exact PSU, bay, distribution, and board arrangement is supported together. A generic PSU standard plus an unrelated server-board diagram is not enough.

### 2. Public-candidate closure

| Public Candidate | Visible possibility that must remain |
| --- | --- |
| System board failed | Board power-consumer/power-good endpoint. |
| Power distribution board failed | Shared distribution service unit or truthful shared-path abstraction. |
| Input cable loose | External input/connection role. |
| PSU failed | Serviceable supply role. |
| PSU not seated | Supply-to-bay mechanical/electrical attachment. |

No path is colored as failed. Cross-bay comparison is described as an available documented observation, not as its authored outcome.

### 3. Private accept/reject pass

The validator checks that the hidden distribution-board Fault, accepted path isolation, `repair.power.replace_distribution_board`, and `verify.power.distribution_path` fit the exact service boundary and lifecycle. It also checks de-energization/source constraints. Failure disables this model binding; it does not fall back to a profile that visually implies a PSU answer.

### 4. Shared-data outputs

The description, diagram/text equivalent, and action rationale all derive from the same input-to-PSU-to-distribution-to-board path and service constraints. The rationale can explain why cross-bay known-good comparison is relevant to a shared path. Only authored Evidence can say what that comparison demonstrated, and only the engine can expose Repair or Verify intents.

## Reality counterexample: plausible is not supported

Suppose one manufacturer manual proves that a server family supports an NVMe front backplane, a controller manual proves that a RAID adapter supports NVMe, and a connector standard proves that their link types can interoperate. A proposed diagram combining that exact backplane, adapter, riser, boot mode, and firmware era looks plausible. It is **not** reality-consistent unless product-specific material proves those options, cabling, firmware, and boot role are supported together in the selected server revision. The backplane might require a different riser, bypass the adapter, exclude that boot mode, or belong to a later board revision.

The validator must stop at `UNRESOLVED_OPTION_COMBINATION`. It may research an exact supported configuration or publish an explicitly generalized storage-path abstraction if that remains honest for every Candidate. It may not release the plausible detailed topology.

## Non-leak counterexample: hidden-selected topology

Consider two authored variants with the same public symptom, Candidates, and authorized event history as the loose-storage-cable Ticket. Variant A's hidden solution is a loose cable; variant B's is a failed backplane path.

An invalid private-first Finder chooses a direct cable drawing for A and a backplane drawing for B. Even without a “failed” label, A's drawing can eliminate the backplane Candidate and B's can eliminate the cable Candidate. Profile ID, node inventory, layout, rationale paths, and fallback behavior become a hidden-answer oracle.

The valid design resolves one public profile from the shared public envelope and renders the same device–connection–backplane/controller abstraction for both variants. The private validator must accept that profile for both or reject the binding entirely. A byte comparison of the two serialized public projections—including IDs, order, detail, text, layout hints, and errors—must be identical until an authorized public event changes the shared surface.

## Consistency result for these walkthroughs

Both walkthroughs can be represented by the candidate contract without production data, and every proposed output has a named producer, validator, and consumer in [`SYSTEM_MODEL_CONTRACT.md`](SYSTEM_MODEL_CONTRACT.md). They do not prove a real product profile; obtaining that proof, producing the five manual atlas entries, and exposing Component/relation gaps belong to TASK-050 under [`RESEARCH_PROTOCOL.md`](RESEARCH_PROTOCOL.md).
