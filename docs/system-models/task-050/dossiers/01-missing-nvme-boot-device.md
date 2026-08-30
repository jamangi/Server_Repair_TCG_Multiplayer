# Missing NVMe boot device

Status: **TASK-050 research dossier; not production Ticket data**

## 1. Stable identity

| Field | Value |
| --- | --- |
| Dossier | `model.missing-nvme.v1` |
| Released Ticket | `ticket.generated.3ec80b1b0e7221ac725aedf9` |
| Fingerprint | `fingerprint.boot.missing_nvme` |
| Ticket snapshot SHA-256 | `1c74ad0725e500ac01d4c356f17551fee11678a88b35ca5b591ff056a2efdff2` |
| System profile | `profile.dell.poweredge-r740xd.hybrid-24x2_5.v1` |
| Real reference basis | Dell PowerEdge R740xd with documented 24-by-2.5-inch hybrid SAS/SATA/NVMe routing |
| Generation / revision | 14th generation; online service-manual topics plus iDRAC9 3.31/3.36 and 6.x/7.x management guides |
| Exactness boundary | Chassis family, hybrid backplane option, service boundaries, and cited management capabilities are exact. Diagram geometry, cable bundling, lifecycle prose, and UEFI handoff are generalized abstractions. |

## 2. Public Ticket surface

This section is the complete Ticket input available to the public projection. It contains no outcome, route, or hidden-state field.

- Symptoms: `symptom.boot.no_boot_device`
- Candidates: `fault.boot.device.not_detected`, `fault.boot.order.incorrect`, `fault.storage.cable.loose`, `fault.storage.nvme.device_failed`, `fault.storage.raid.controller_failed`
- Focus: NVMe discovery, management observation, boot policy, and OS handoff
- Public-safe statement: The visible model shows both boot-policy and physical storage-path explanations for a missing boot device; it does not identify which explanation is true.

## 3. Private authoring requirements

This section is author-only validation evidence. It must never be an input to the public narrative or SVG.

- Hidden authored Faults: `fault.storage.nvme.device_failed`, `fault.boot.device.not_detected`
- Isolation route kinds: `DEFINITIVE_DIAGNOSTIC`
- Repair procedures: `repair.storage.replace_nvme`
- Verification procedures: `verify.boot.normal_boot`, `verify.storage.device_detected`
- Consistency result: The private authoring view can realize an unavailable NVMe service unit, an indirect management event/inventory observation, replacement of that unit, renewed firmware/device discovery, and a later UEFI-to-OS handoff. Nothing in the public diagram marks the NVMe unit or path as failed.

## 4. Real-system reference basis

All sources were accessed 2026-08-30. No source diagram, trade dress, logo, or branded UI is copied. The project schematic is original geometry derived only from the listed claims. Manufacturer pages are mutable and no local copyrighted source copy is retained.

### Fixed option constraints

- Use the documented 24-by-2.5-inch hybrid backplane family; this pilot fixes the public example to the supported 20 SAS/SATA plus 4 NVMe option.
- The SAS branch reaches a documented PERC adapter path; the NVMe branch is kept as a PCIe/NVMe path because the cited cable labels do not prove one universal controller topology.
- A network daughter card is present for the network pilot; optional add-in NICs and exact port counts remain outside scope.
- Two supported power supplies are shown as one redundant pair without encoding wattage, mains phase, or exact power-distribution PCB layout.

### Claim ledger

| Source ID | Primary source | Product / revision | Claims used | Scope and exception |
| --- | --- | --- | --- | --- |
| `src.dell.idrac9.inventory` | [Viewing system inventory](https://www.dell.com/support/manuals/en-us/poweredge-r740/idrac_3.31.31.31_ug/viewing-system-inventory?guid=guid-cff6b735-2153-49a5-b1d2-34ffa1b8ab17&lang=en-us) | iDRAC9 on 14th-generation PowerEdge systems; 3.31.31.31 | `claim.idrac9.hardware-inventory` | Generalized iDRAC9-generation inventory behavior, combined with the exact R740xd iDRAC9 support source; the URL product alias is R740 rather than R740xd and is not treated as chassis-option proof. |
| `src.dell.idrac9.lifecycle-introduction` | [Lifecycle Controller introduction](https://www.dell.com/support/manuals/en-us/poweredge-r740xd/idrac9_6.xx_lc_ug/introduction) | iDRAC9 with Lifecycle Controller, including PowerEdge R740xd; iDRAC9 6.xx Lifecycle Controller User's Guide | `claim.idrac9.out-of-band-management`, `claim.idrac9.pre-os-interface`, `claim.idrac9.uefi-cooperation` | Exact product-family support for iDRAC9/Lifecycle Controller; management behavior is shared across the documented iDRAC9 generation. |
| `src.dell.idrac9.lifecycle-log` | [Viewing Lifecycle Log history](https://www.dell.com/support/manuals/en-us/oth-r740/idrac9_6.xx_lc_ug/viewing-lifecycle-log-history?guid=guid-482a7006-b457-4781-af06-589e0cdd2530&lang=en-us) | iDRAC9 with Lifecycle Controller; iDRAC9 6.xx Lifecycle Controller User's Guide | `claim.idrac9.lifecycle-log-categories` | Generalized iDRAC9-generation log behavior; no claim that a log uniquely diagnoses a Ticket Candidate. |
| `src.dell.idrac9.storage-monitoring` | [Monitoring storage devices using web interface](https://www.dell.com/support/manuals/en-us/poweredge-r740/idrac9_7.xx_ug_14g/monitoring-storage-devices-using-web-interface?guid=guid-f4650417-3e7e-456c-91bd-91f4a32b61f4&lang=en-us) | iDRAC9 on 14th-generation PowerEdge systems; iDRAC9 7.xx User's Guide | `claim.idrac9.storage-observation` | Generalized management observation of controllers, disks, enclosures, and NVMe limitations; not proof of fault causation. |
| `src.dell.r740xd.backplane-details` | [PowerEdge R740xd backplane details](https://www.dell.com/support/manuals/en-us/poweredge-r740xd/per740xd_ism_pub/backplane-details?guid=guid-5d119b25-5363-4be0-b451-e30ae7ca3f5b&lang=en-us) | PowerEdge R740xd backplane options; Online service-manual topic; topic revision not exposed | `claim.r740xd.hybrid-backplane`, `claim.r740xd.twenty-sas-four-nvme-option` | Exact supported 24-by-2.5-inch hybrid backplane family and a documented 20 SAS/SATA plus 4 NVMe option. |
| `src.dell.r740xd.backplane-install` | [Installing the backplane](https://www.dell.com/support/manuals/en-us/poweredge-r740xd/per740xd_ism_pub/installing-the-backplane?guid=guid-8dd331b7-13d7-4719-8082-53a8c956cf27&lang=en-us) | PowerEdge R740xd service procedure; Online service-manual topic; topic revision not exposed | `claim.r740xd.backplane-serviceable` | Exact service boundary: the backplane is removable and its documented cables must be reconnected. |
| `src.dell.r740xd.bios-settings` | [System BIOS Settings details](https://www.dell.com/support/manuals/en-us/poweredge-r740xd/r740xd_bios_ism_pub/system-bios-settings-details?guid=guid-62c95e9f-dca7-4314-967f-8c31b3e9edb1&lang=en-us) | PowerEdge R740xd BIOS; Online BIOS reference; topic revision not exposed | `claim.r740xd.uefi-boot-mode` | Exact R740xd firmware settings relevant to boot mode and NVMe configuration; no claim that changing a setting is authorized gameplay. |
| `src.dell.r740xd.boot-order` | [Changing boot order](https://www.dell.com/support/manuals/en-us/poweredge-r740xd/r740xd_bios_ism_pub/changing-boot-order?guid=guid-07c7df74-38ab-4c4d-9aa8-d93624c5158e&lang=en-us) | PowerEdge R740xd BIOS; Online BIOS reference; topic revision not exposed | `claim.r740xd.boot-order-configurable` | Exact existence of a configurable boot-order surface. |
| `src.dell.r740xd.cable-routing` | [PowerEdge R740xd cable routing](https://www.dell.com/support/manuals/en-us/poweredge-r740xd/per740xd_ism_pub/cable-routing?guid=guid-06637506-d7db-43e6-9c15-be4a832d4fbe) | PowerEdge R740xd 24-by-2.5-inch NVMe/hybrid routing; Online service-manual topic; Figure 16; topic revision not exposed | `claim.r740xd.sas-perc-path`, `claim.r740xd.pcie-nvme-path`, `claim.r740xd.backplane-power-signal` | Exact family cable-routing relationships. The atlas generalizes connector positions and calls the PCIe-side target a PCIe/NVMe path because the online labels do not justify a more specific controller identity. |
| `src.dell.r740xd.nic-ports` | [NIC ports](https://www.dell.com/support/manuals/en-us/poweredge-r740xd/per740xd_techspecs_pub/nic-ports?guid=guid-8ba21af1-af17-4133-85d8-442d2c1fe4f9&lang=en-us) | PowerEdge R740xd; Online technical-specification topic; topic revision not exposed | `claim.r740xd.network-daughter-card` | Exact family support for a network daughter card and optional add-in network adapters; port counts are not encoded in the public pilot diagram. |
| `src.dell.r740xd.system-overview` | [PowerEdge R740xd system overview](https://www.dell.com/support/manuals/en-us/poweredge-r740xd/per740xd_ism_pub/poweredge-r740xd-system-overview?guid=guid-db2e151c-0b4d-4f95-8c09-d0d81a59807d&lang=en-us) | PowerEdge R740xd, 14th-generation platform; Online service-manual topic; topic revision not exposed | `claim.r740xd.2u-dual-cpu-memory`, `claim.r740xd.dual-psu` | Exact family-level chassis, processor/memory, redundant-power, and NVMe capability facts; not proof of every option combination. |
| `src.uefi.2_10.boot-manager` | [UEFI Specification 2.10 — Boot Manager](https://uefi.org/specs/UEFI/2.10/03_Boot_Manager.html) | Standards-defined UEFI boot-manager behavior; 2.10 | `claim.uefi.os-loader-handoff`, `claim.uefi.boot-manager-policy`, `claim.uefi.bootorder-nvram` | Generalized standards behavior, used only where the manufacturer documentation identifies UEFI mode; not an R740xd implementation-detail claim. |

## 5. Component inventory

| Role | Purpose | Multiplicity | Replaceability | Optionality | Domain Component / gap | Audit class |
| --- | --- | --- | --- | --- | --- | --- |
| Redundant PSU pair | Converts external input and supplies standby/switched power | 2 supported supplies | Hot-plug service unit subject to documented procedure | Required by this pilot profile | `component.power.hot_swap_psu` | existing sufficient |
| System board | Contains host sockets, chipset, firmware devices, and the BMC service boundary | 1 | Board-level service unit | Required | `component.board.system` | existing sufficient |
| BMC / iDRAC role | Out-of-band management, inventory, lifecycle logs, and host coordination | 1 logical role | Not a separate pilot FRU; serviced through the system board or documented recovery path | Required | `component.management.bmc` | existing sufficient |
| Host processor sockets | Executes host firmware and OS workload | Up to 2; grouped in the atlas | Socketed service role | At least 1 | `component.compute.cpu` | existing sufficient |
| ECC DIMM population | Host working memory trained during preboot | Up to 24 slots; grouped | Individual DIMM service units | Population varies | `component.memory.ecc_dimm` | existing sufficient |
| Cooling-fan row | Moves chassis airflow under management/host load | Grouped fan row; exact count outside scope | Individual fan service units | Required | `component.cooling.fan` | existing sufficient |
| Hybrid drive backplane | Mounts front drives and connects power, signal, SAS, and PCIe/NVMe branches | 1 documented 24-bay option | Replaceable backplane service unit | Profile-defining option | `component.storage.backplane` | existing sufficient |
| SAS data-cable branch | Carries the SAS/SATA branch between backplane and PERC path | Bundled abstraction; exact connector count omitted | Cable/connector service path | Present in fixed hybrid option | `component.storage.data_cable` | existing but broad |
| PCIe/NVMe interconnect branch | Carries the direct NVMe branch from the hybrid backplane toward PCIe endpoints | Bundled abstraction | Cable/connector service path | Present in fixed hybrid option | — (gap.component.storage.pcie_nvme_interconnect) | missing required |
| PERC adapter path | Controls the SAS/SATA storage branch | 1 bounded adapter path | Adapter service unit | Present in fixed hybrid option | `component.storage.raid_controller` | existing sufficient |
| NVMe drive group | Provides direct PCIe/NVMe storage and may contain boot media | 4 bays in the fixed public option | Individual drive service units | Profile-defining option | `component.storage.nvme_ssd` | existing sufficient |
| SAS/SATA drive group | Provides controller-attached storage | 20 bays in the fixed public option | Individual drive service units | Profile-defining option | `component.storage.sas_hdd` | existing but broad |
| Host network adapter | Provides the host data link across firmware, driver, port, and cable boundaries | 1 grouped network daughter card | Daughter-card service unit | Required by network pilot | `component.network.nic` | existing sufficient |
| External network cable | Completes the physical host-network link | 1 representative active link | External replaceable cable | Required by network pilot | `component.network.ethernet_cable` | existing sufficient |

## 6. Typed topology

The diagram is an explanatory graph, not a physical board layout. Edge type, written label, dash pattern, and marker shape carry the relation so color is never the only cue.

| Relation type | From → to | Meaning | Claims |
| --- | --- | --- | --- |
| CONTROL | System board → BMC + lifecycle | host management | `claim.idrac9.uefi-cooperation` |
| CONTAINMENT | System board → UEFI / boot policy | firmware surface | `claim.r740xd.uefi-boot-mode` |
| LIFECYCLE | UEFI / boot policy → OS loader + runtime | boot handoff | `claim.uefi.os-loader-handoff` |
| POWER | System board → Hybrid backplane | power + signal | `claim.r740xd.backplane-power-signal` |
| DATA | System board → SAS cable + PERC | host storage | `claim.r740xd.sas-perc-path` |
| DATA | SAS cable + PERC → Hybrid backplane | SAS branch | `claim.r740xd.sas-perc-path` |
| DATA | System board → PCIe / NVMe path | PCIe branch | `claim.r740xd.pcie-nvme-path` |
| DATA | PCIe / NVMe path → Hybrid backplane | NVMe branch | `claim.r740xd.pcie-nvme-path` |
| CONTAINMENT | Hybrid backplane → 20 SAS/SATA + 4 NVMe | mounted bays | `claim.r740xd.twenty-sas-four-nvme-option` |
| CONTROL | BMC + lifecycle → Hybrid backplane | inventory / events | `claim.idrac9.storage-observation` |
| DATA | OS loader + runtime → 20 SAS/SATA + 4 NVMe | driver / I/O | `claim.uefi.os-loader-handoff`, `claim.r740xd.hybrid-backplane` |

Every minimum plane is explicitly declared in the shared profile:

| Plane | Declaration | Boundary |
| --- | --- | --- |
| power | PRESENT | Two PSUs feed a deliberately abstracted board-power path. |
| management | PRESENT | The BMC/iDRAC role receives standby power and exposes inventory, log, and lifecycle surfaces distinct from the host. |
| host_firmware_post | PRESENT | System board, CPU/memory, UEFI settings, POST, and boot policy are bounded stages. |
| memory | PRESENT | DIMM population/training is grouped; individual slot topology is outside scope. |
| storage | PRESENT | A hybrid backplane has separate SAS/PERC and PCIe/NVMe path abstractions. |
| network | PRESENT | A host NIC, physical link, firmware/driver boundary, and OS interface are distinct. |
| os_handoff | PRESENT | UEFI boot selection hands off to a loader and bounded OS runtime. |
| runtime_service | PRESENT | Only storage I/O, network link behavior, management observation, and thermal load needed by the five-Ticket pilot are modeled. |

## 7. Lifecycle and newcomer narrative

| Order | Stage | Relation | Claims |
| --- | --- | --- | --- |
| 10 | Standby power reaches the management domain | PRECEDES | `claim.idrac9.out-of-band-management` |
| 20 | BMC and lifecycle services initialize independently of the host OS | PARALLEL_WITH_HOST_REQUEST | `claim.idrac9.pre-os-interface` |
| 30 | A host-power request enables the switched board path | REQUIRES | `claim.idrac9.uefi-cooperation` |
| 40 | Host firmware initializes processor, memory, adapters, and device inventory | PRECEDES | `claim.idrac9.hardware-inventory`, `claim.r740xd.uefi-boot-mode` |
| 50 | UEFI applies boot policy to an available boot option | PRECEDES | `claim.uefi.boot-manager-policy`, `claim.uefi.bootorder-nvram` |
| 60 | Firmware hands control to the selected OS loader | HANDOFF_TO | `claim.uefi.os-loader-handoff` |
| 70 | The OS exercises storage and network paths while management continues telemetry and event collection | PARALLEL_WITH | `claim.idrac9.lifecycle-log-categories`, `claim.idrac9.storage-observation` |

**Generated public description:** Standby power reaches the management domain. BMC and lifecycle services initialize independently of the host OS. A host-power request enables the switched board path. Host firmware initializes processor, memory, adapters, and device inventory. UEFI applies boot policy to an available boot option. Firmware hands control to the selected OS loader. The OS exercises storage and network paths while management continues telemetry and event collection. The visible model shows both boot-policy and physical storage-path explanations for a missing boot device; it does not identify which explanation is true.

This follows TASK-049's clause boundary: each sentence is a sourced stage or an explicitly public Ticket-focus clause. The renderer may omit at clause boundaries, but it may not convert optional/parallel behavior into a universal linear boot claim.

## 8. Accessible original illustration

[Open the standalone SVG](../diagrams/01-missing-nvme-boot-device.svg). The SVG has a title and long description, labeled relation types, visible keyboard focus for semantic component groups, patterns/markers that survive monochrome or forced-colors rendering, and a deterministic view box.

**Text equivalent:** Ticket ticket.generated.3ec80b1b0e7221ac725aedf9 has public Symptoms symptom.boot.no_boot_device. Its public Candidates are fault.boot.device.not_detected, fault.boot.order.incorrect, fault.storage.cable.loose, fault.storage.nvme.device_failed, fault.storage.raid.controller_failed. The schematic focus contains System board (host firmware post); BMC + lifecycle (management); UEFI / boot policy (host firmware post); Hybrid backplane (storage); SAS cable + PERC (storage); PCIe / NVMe path (storage); 20 SAS/SATA + 4 NVMe (storage); OS loader + runtime (os handoff). Connections, in reading order: control relation from System board to BMC + lifecycle: host management; containment relation from System board to UEFI / boot policy: firmware surface; lifecycle relation from UEFI / boot policy to OS loader + runtime: boot handoff; power relation from System board to Hybrid backplane: power + signal; data relation from System board to SAS cable + PERC: host storage; data relation from SAS cable + PERC to Hybrid backplane: SAS branch; data relation from System board to PCIe / NVMe path: PCIe branch; data relation from PCIe / NVMe path to Hybrid backplane: NVMe branch; containment relation from Hybrid backplane to 20 SAS/SATA + 4 NVMe: mounted bays; control relation from BMC + lifecycle to Hybrid backplane: inventory / events; data relation from OS loader + runtime to 20 SAS/SATA + 4 NVMe: driver / I/O. Line labels and dash patterns distinguish relation types; no node or edge states which Candidate is true.

Semantic reading order is the text-equivalent component order, followed by connections. It does not depend on screen coordinates.

## 9. Why each relevant action can apply

This is system relevance only. It does not put a Card on the Bench, make an intent legal, predict an outcome, or award Evidence.

| Kind | Action ID | Component / path | Observation or intervention reason |
| --- | --- | --- | --- |
| Command | `command.linux.lsblk` | OS loader + runtime → 20 SAS/SATA + 4 NVMe | queries the OS block-device view across the storage path |
| Command | `command.linux.lspci` | OS loader + runtime → System board → Host NIC → PCIe / NVMe path | queries host-visible PCIe inventory without proving downstream health |
| Command | `command.linux.nvme_smart_log` | OS loader + runtime → PCIe / NVMe path → 20 SAS/SATA + 4 NVMe | queries a reachable NVMe device telemetry surface |
| Test | `test.boot.device_inventory` | UEFI / boot policy → System board → 20 SAS/SATA + 4 NVMe → OS loader + runtime | observes preboot discovery, POST, boot-policy, or handoff boundaries |
| Test | `test.boot.post_code_analysis` | UEFI / boot policy → System board → 20 SAS/SATA + 4 NVMe → OS loader + runtime | observes preboot discovery, POST, boot-policy, or handoff boundaries |
| Test | `test.cooling.location_cross_substitution` | Cooling + sensors → BMC + lifecycle | varies or observes the bounded cooling path under a controlled comparison |
| Test | `test.firmware.settings_review` | UEFI / boot policy | queries the documented host-firmware settings surface |
| Test | `test.firmware.version_compatibility` | BMC + lifecycle → UEFI / boot policy → Host NIC | compares documented inventory across firmware-bearing roles; compatibility remains authored content |
| Test | `test.general.minimum_configuration` | System board → CPU + ECC memory → 20 SAS/SATA + 4 NVMe → Host NIC | bounds host dependencies without asserting which removed option is causal |
| Test | `test.general.visual_inspection` | System board → Hybrid backplane → SAS cable + PERC → PCIe / NVMe path → PSU pair → Port + cable + peer | observes accessible service boundaries without turning proximity into diagnosis |
| Test | `test.memory.diagnostic` | CPU + ECC memory → System board → BMC + lifecycle | observes or varies the grouped memory-training and inventory path |
| Test | `test.memory.known_good_substitution` | CPU + ECC memory → System board → BMC + lifecycle | observes or varies the grouped memory-training and inventory path |
| Test | `test.memory.single_dimm_isolation` | CPU + ECC memory → System board → BMC + lifecycle | observes or varies the grouped memory-training and inventory path |
| Test | `test.network.cable_substitution` | OS loader + runtime → Host NIC → Port + cable + peer | observes or varies the adapter-to-physical-link path and bounded runtime counters |
| Test | `test.network.link` | OS loader + runtime → Host NIC → Port + cable + peer | observes or varies the adapter-to-physical-link path and bounded runtime counters |
| Test | `test.network.link_counter_soak` | OS loader + runtime → Host NIC → Port + cable + peer | observes or varies the adapter-to-physical-link path and bounded runtime counters |
| Test | `test.pcie.inventory` | System board → Host NIC → PCIe / NVMe path → OS loader + runtime | observes host-visible PCIe attachment boundaries |
| Test | `test.power.distribution_path_isolation` | External power → PSU pair → System board → BMC + lifecycle | observes or varies successive segments of the documented power path |
| Test | `test.power.known_good_psu` | External power → PSU pair → System board → BMC + lifecycle | observes or varies successive segments of the documented power path |
| Test | `test.power.output_voltage_measurement` | External power → PSU pair → System board → BMC + lifecycle | observes or varies successive segments of the documented power path |
| Test | `test.power.psu_status` | External power → PSU pair → System board → BMC + lifecycle | observes or varies successive segments of the documented power path |
| Test | `test.power.residual_power_drain` | External power → PSU pair → System board → BMC + lifecycle | observes or varies successive segments of the documented power path |
| Test | `test.storage.bay_path_isolation` | BMC + lifecycle → OS loader + runtime → Hybrid backplane → SAS cable + PERC → PCIe / NVMe path → 20 SAS/SATA + 4 NVMe | observes or varies device, path, backplane, and controller boundaries |
| Test | `test.storage.device_inventory` | BMC + lifecycle → OS loader + runtime → Hybrid backplane → SAS cable + PERC → PCIe / NVMe path → 20 SAS/SATA + 4 NVMe | observes or varies device, path, backplane, and controller boundaries |
| Test | `test.storage.drive_health` | BMC + lifecycle → OS loader + runtime → Hybrid backplane → SAS cable + PERC → PCIe / NVMe path → 20 SAS/SATA + 4 NVMe | observes or varies device, path, backplane, and controller boundaries |
| Test | `test.storage.predictive_health` | BMC + lifecycle → OS loader + runtime → Hybrid backplane → SAS cable + PERC → PCIe / NVMe path → 20 SAS/SATA + 4 NVMe | observes or varies device, path, backplane, and controller boundaries |
| Test | `test.storage.raid_status` | BMC + lifecycle → OS loader + runtime → Hybrid backplane → SAS cable + PERC → PCIe / NVMe path → 20 SAS/SATA + 4 NVMe | observes or varies device, path, backplane, and controller boundaries |
| Test | `test.system.bmc_logs` | BMC + lifecycle → System board → Hybrid backplane → 20 SAS/SATA + 4 NVMe | queries indirect lifecycle/inventory events; the Ticket authors their Evidence meaning |
| Test | `test.system.controlled_stress` | OS loader + runtime → CPU + ECC memory → Cooling + sensors → 20 SAS/SATA + 4 NVMe → Host NIC | exercises bounded runtime loads while telemetry remains observable |
| Test | `test.thermal.fan_telemetry` | Cooling + sensors → BMC + lifecycle → CPU + ECC memory | observes cooling telemetry and the bounded host-load path |
| Test | `test.thermal.temperature_monitoring` | Cooling + sensors → BMC + lifecycle → CPU + ECC memory | observes cooling telemetry and the bounded host-load path |
| Repair | `repair.storage.replace_nvme` | 20 SAS/SATA + 4 NVMe → Hybrid backplane | intervenes on a replaceable NVMe service unit and its bay boundary |
| Verification | `verify.boot.normal_boot` | UEFI / boot policy → 20 SAS/SATA + 4 NVMe → OS loader + runtime | checks successful boot selection and OS handoff after storage discovery |
| Verification | `verify.storage.device_detected` | BMC + lifecycle → OS loader + runtime → Hybrid backplane → SAS cable + PERC → PCIe / NVMe path → 20 SAS/SATA + 4 NVMe | checks renewed device visibility through the applicable storage path |

## 10. Hidden Ticket-consistency proof

| Step | Authored action | Definition / target | Profile realization | Authored result reference |
| --- | --- | --- | --- | --- |
| 1 | RUN_DIAGNOSTIC | test.system.bmc_logs | BMC + lifecycle → Hybrid backplane → 20 SAS/SATA + 4 NVMe | evidence.fingerprint.boot.missing.nvme.machine.boot.missing.nvme.active.test.system.bmc.logs |
| 2 | COMMIT_ISOLATION | fault_instance.boot.nvme | 20 SAS/SATA + 4 NVMe → UEFI / boot policy → PCIe / NVMe path | fault_instance.boot.nvme |
| 3 | PERFORM_REPAIR | repair.storage.replace_nvme | 20 SAS/SATA + 4 NVMe | repair_outcome.fingerprint.boot.missing.nvme |
| 4 | PERFORM_VERIFY | verify.boot.normal_boot | UEFI / boot policy → OS loader + runtime | verify_outcome.fingerprint.boot.missing.nvme.01.pass |
| 5 | PERFORM_VERIFY | verify.storage.device_detected | UEFI / boot policy → PCIe / NVMe path → 20 SAS/SATA + 4 NVMe | verify_outcome.fingerprint.boot.missing.nvme.02.pass |

All route steps resolve to present profile nodes. The generator validates this table but keeps it separate from the public projection function.

## 11. Candidate closure and differential non-leak

| Public Candidate | Truthful public realization | Why it remains possible |
| --- | --- | --- |
| `fault.boot.device.not_detected` | UEFI / boot policy → PCIe / NVMe path → 20 SAS/SATA + 4 NVMe | Discovery spans the selected device, its PCIe/NVMe path, and firmware inventory. |
| `fault.boot.order.incorrect` | UEFI / boot policy → OS loader + runtime | A configurable UEFI boot policy can select an available but unintended option. |
| `fault.storage.cable.loose` | PCIe / NVMe path → Hybrid backplane | The documented hybrid configuration contains serviceable interconnect and backplane connection boundaries. |
| `fault.storage.nvme.device_failed` | 20 SAS/SATA + 4 NVMe | The fixed public option contains replaceable NVMe devices. |
| `fault.storage.raid.controller_failed` | SAS cable + PERC → Hybrid backplane | A documented controller-attached storage branch remains visible as a plausible storage-path abstraction without claiming it hosts the boot device. |

Differential variants tested with this exact public input: `fault.boot.device.not_detected`, `fault.boot.order.incorrect`, `fault.storage.cable.loose`, `fault.storage.nvme.device_failed`, `fault.storage.raid.controller_failed`. The focused validator substitutes each Candidate as synthetic hidden truth and proves the public narrative, text equivalent, and SVG remain byte-identical. This proves rendering non-use of hidden truth; it does not claim every synthetic variant has an authored gameplay outcome.

## 12. Known abstractions, unsupported details, and stop conditions

### Profile-wide abstractions

- Diagram positions are explanatory and do not reproduce Dell physical layouts.
- The power path between PSU pair and system board is intentionally opaque; no cited source proves a specific R740xd distribution-board FRU for this option.
- The 20 SAS/SATA plus 4 NVMe option is fixed to prevent unsupported option mixing; exact bay numbering and connector counts are omitted.
- CPU sockets, memory channels, fans, sensor buses, PCIe lanes, and network ports are grouped because the Tickets do not need per-instance wiring.
- The BMC and UEFI control surfaces are logical roles; their drawing boundaries do not imply separate replaceable boards.

### Ticket-specific abstractions

- The public device group does not reveal bay number, namespace, controller ownership, or boot-device membership.
- BMC logs are represented as indirect observations; Ticket-authored Evidence, not this model, determines any diagnostic disposition.
- The controller Candidate is kept plausible through a truthful controller-attached branch, not by pretending every NVMe bay is controlled by PERC.

### Stop conditions

- Stop if a Ticket requires an exact bay-to-slot, riser, expander, lane, or controller mapping not proved by the cited configuration.
- Stop if a proposed public view would choose a different option or topology after reading hidden truth.
- Stop if a repair needs a serviceable unit not established by a manufacturer procedure.
- Stop before presenting management inventory or logs as proof of causation; they are observation paths only.
- Stop if the selected Ticket requires an exact NVMe bay/slot/controller path absent from the public snapshot.
- Stop if a diagram annotation would say missing, failed, suspect, boot device, or correct order before authorized Evidence reveals it.
