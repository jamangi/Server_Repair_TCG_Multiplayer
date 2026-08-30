# Failed power-distribution path

Status: **TASK-050 research dossier; not production Ticket data**

## 1. Stable identity

| Field | Value |
| --- | --- |
| Dossier | `model.failed-power-distribution.v1` |
| Released Ticket | `ticket.generated.3fd6eb04534f79b5b3f87f98` |
| Fingerprint | `fingerprint.power.failed_distribution_board` |
| Ticket snapshot SHA-256 | `d34f08d79c2cc2d47d16d23ec753f1e78758d0b358664d4e592ea23f25b63d73` |
| System profile | `profile.dell.poweredge-r740xd2.power-interposer.v1` |
| Real reference basis | Dell PowerEdge R740xd2 with two supported PSUs and a replaceable Power Interposer Board |
| Generation / revision | 14th generation; online service-manual topics and product technical guide |
| Exactness boundary | PSU multiplicity, 1+1 redundancy, PIB service boundary, PSU-cage placement, and board-cable connection are exact. Internal rail topology and all non-power subsystem wiring are generalized. |

## 2. Public Ticket surface

This section is the complete Ticket input available to the public projection. It contains no outcome, route, or hidden-state field.

- Symptoms: `symptom.power.voltage_out_of_range`, `symptom.power.no_power`
- Candidates: `fault.board.system.failed`, `fault.power.distribution_board.failed`, `fault.power.input.cable_loose`, `fault.power.psu.failed`, `fault.power.psu.not_seated`
- Focus: Redundant input, PSU pair, shared Power Interposer Board service path, and downstream system-board load
- Public-safe statement: The visible model separates two input/PSU branches from the shared interposer and downstream board so isolation can compare path segments without exposing the failing segment.

## 3. Private authoring requirements

This section is author-only validation evidence. It must never be an input to the public narrative or SVG.

- Hidden authored Faults: `fault.power.distribution_board.failed`
- Isolation route kinds: `TASK_043_ORACLE_WITNESS`
- Repair procedures: `repair.power.replace_distribution_board`
- Verification procedures: `verify.power.distribution_path`
- Consistency result: The private view can bind the broad game Fault to the documented PIB service role, compare upstream PSU and downstream board segments, perform the required de-energized replacement sequence, and exercise the rebuilt input-to-host path. Publicly, all five Candidates still map to distinct visible boundaries.

## 4. Real-system reference basis

All sources were accessed 2026-08-30. No source diagram, trade dress, logo, or branded UI is copied. The project schematic is original geometry derived only from the listed claims. Manufacturer pages are mutable and no local copyrighted source copy is retained.

### Fixed option constraints

- This pilot fixes two supported supplies in a 1+1 redundant arrangement.
- The exact Dell role is a Power Interposer Board (PIB); the existing game candidate says distribution board and is treated as a broader functional class, not a part-number synonym.
- The model does not combine the R740xd2 PIB with the R740xd hybrid backplane profile; cross-family composition is unproved.

### Claim ledger

| Source ID | Primary source | Product / revision | Claims used | Scope and exception |
| --- | --- | --- | --- | --- |
| `src.dell.r740xd2.pib-install` | [Installing power interposer board](https://www.dell.com/support/manuals/en-us/oth-r740xd2/per740xd2_ism_pub/installing-power-interposer-board?guid=guid-04f497da-2ae1-4593-85d2-64ef3a6b92a4&lang=en-us) | PowerEdge R740xd2; Online service-manual topic; topic revision not exposed | `claim.r740xd2.pib-service-unit`, `claim.r740xd2.pib-system-board-cables`, `claim.r740xd2.pib-deenergize`, `claim.r740xd2.pib-psu-cage` | Exact R740xd2 service boundary and connections for the power interposer board (PIB). |
| `src.dell.r740xd2.pib-remove` | [Removing the power interposer board](https://www.dell.com/support/manuals/en-us/poweredge-r740xd2/per740xd2_ism_pub/pib?guid=guid-4dd5d0c7-e3fe-408b-bca9-dfc8061c63ff&lang=en-us) | PowerEdge R740xd2; Online service-manual topic; topic revision not exposed | `claim.r740xd2.pib-remove-psus`, `claim.r740xd2.pib-disconnect-cables` | Exact removal constraints supporting the replaceable shared-distribution-path model. |
| `src.dell.r740xd2.psu-specifications` | [PowerEdge R740xd2 PSU specifications](https://www.dell.com/support/manuals/en-us/poweredge-r740xd2/per740xd2_ts_pub/psu-specifications?guid=guid-e1ac1620-e3a7-4d56-9b02-bd5de9e95dad) | PowerEdge R740xd2; Online technical-specification topic; topic revision not exposed | `claim.r740xd2.dual-psu` | Exact family PSU support. |
| `src.dell.r740xd2.technical-guide` | [PowerEdge R740xd2 Technical Guide](https://i.dell.com/sites/csdocuments/Product_Docs/en/poweredge-r740xd2-technical-guide.pdf) | PowerEdge R740xd2; Published PDF; document revision not exposed in filename | `claim.r740xd2.one-plus-one-redundancy`, `claim.r740xd2.psu-mismatch-reporting` | Exact family 1+1 PSU redundancy and management/firmware reporting behavior. |

## 5. Component inventory

| Role | Purpose | Multiplicity | Replaceability | Optionality | Domain Component / gap | Audit class |
| --- | --- | --- | --- | --- | --- | --- |
| External input leads | Feed the two PSU modules | 2 representative inputs | External cable service unit | Required | `component.power.input_cable` | existing sufficient |
| Redundant PSU pair | Converts input and supplies the shared path | 2 in 1+1 configuration | Individual PSU service units | Required by profile | `component.power.hot_swap_psu` | existing sufficient |
| Power Interposer Board | Shared serviceable distribution path from the PSU cage to system-board cables | 1 | Replaceable only after required de-energization and PSU removal | Required by profile | `component.power.distribution_board` | existing but broad |
| System-board load | Receives distributed power and contains grouped host/management roles | 1 | Board-level service unit | Required | `component.board.system` | existing sufficient |
| Management status role | Reports supported PSU mismatch/status observations | 1 grouped role | Outside this Ticket's service scope | Required observation surface | `component.management.bmc` | existing sufficient |
| Host subsystem loads | Grouped CPU, memory, storage, network, cooling, firmware, and OS consumers | Grouped | Outside this Ticket's scope | Required as a bounded load | — (not a domain Component) | optional outside scope |

## 6. Typed topology

The diagram is an explanatory graph, not a physical board layout. Edge type, written label, dash pattern, and marker shape carry the relation so color is never the only cue.

| Relation type | From → to | Meaning | Claims |
| --- | --- | --- | --- |
| POWER | Input cables → PSU A + PSU B | two inputs | `claim.r740xd2.dual-psu` |
| POWER | PSU A + PSU B → Power Interposer Board | 1+1 feed | `claim.r740xd2.one-plus-one-redundancy`, `claim.r740xd2.pib-psu-cage` |
| POWER | Power Interposer Board → System-board load | board cables | `claim.r740xd2.pib-system-board-cables` |
| POWER | System-board load → Host + bounded runtime | switched loads | `claim.r740xd2.pib-system-board-cables` |
| CONTROL | Management status → PSU A + PSU B | status / mismatch | `claim.r740xd2.psu-mismatch-reporting` |
| LIFECYCLE | De-energized service → PSU A + PSU B | remove first | `claim.r740xd2.pib-remove-psus` |
| LIFECYCLE | De-energized service → Power Interposer Board | disconnect / replace | `claim.r740xd2.pib-disconnect-cables`, `claim.r740xd2.pib-deenergize` |

Every minimum plane is explicitly declared in the shared profile:

| Plane | Declaration | Boundary |
| --- | --- | --- |
| power | PRESENT | Two PSU service units converge through the replaceable PIB before the system-board load. |
| management | PRESENT | A grouped management role can report PSU mismatch/status; internal sensor wiring is outside scope. |
| host_firmware_post | PRESENT | Host firmware/POST is a grouped load and observation boundary, not a detailed boot model in this profile. |
| memory | OUT_OF_SCOPE_WITH_REASON | Present as part of the host load but individual DIMMs are irrelevant to the power-path Ticket. |
| storage | OUT_OF_SCOPE_WITH_REASON | Present as a grouped downstream load; the Ticket does not require a storage option claim. |
| network | OUT_OF_SCOPE_WITH_REASON | Present as a grouped downstream load; exact adapter topology is not used. |
| os_handoff | PRESENT | Normal boot is bounded as one downstream state, without asserting an exact device path. |
| runtime_service | PRESENT | Power status, voltage checks, de-energized service, replacement, and post-repair path verification are modeled. |

## 7. Lifecycle and newcomer narrative

| Order | Stage | Relation | Claims |
| --- | --- | --- | --- |
| 10 | Two external inputs feed the installed PSU pair | PRECEDES | `claim.r740xd2.dual-psu` |
| 20 | The shared PIB-to-board path can supply standby management loads | PRECEDES | `claim.r740xd2.pib-system-board-cables` |
| 30 | Firmware or management can report supported PSU mismatch/status observations | PARALLEL_WITH | `claim.r740xd2.psu-mismatch-reporting` |
| 40 | The distribution path supplies grouped host loads for POST and bounded boot | ENABLES | `claim.r740xd2.pib-system-board-cables` |
| 50 | PIB replacement requires power-off, input disconnection, and PSU removal before board cables are disconnected | REQUIRES_DEENERGIZATION_BEFORE | `claim.r740xd2.pib-deenergize`, `claim.r740xd2.pib-remove-psus`, `claim.r740xd2.pib-disconnect-cables` |
| 60 | After reassembly, verification exercises the complete input-to-board distribution path | OPTIONAL_AFTER_SERVICE | `claim.r740xd2.pib-system-board-cables` |

**Generated public description:** Two external inputs feed the installed PSU pair. The shared PIB-to-board path can supply standby management loads. Firmware or management can report supported PSU mismatch/status observations. The distribution path supplies grouped host loads for POST and bounded boot. PIB replacement requires power-off, input disconnection, and PSU removal before board cables are disconnected. After reassembly, verification exercises the complete input-to-board distribution path. The visible model separates two input/PSU branches from the shared interposer and downstream board so isolation can compare path segments without exposing the failing segment.

This follows TASK-049's clause boundary: each sentence is a sourced stage or an explicitly public Ticket-focus clause. The renderer may omit at clause boundaries, but it may not convert optional/parallel behavior into a universal linear boot claim.

## 8. Accessible original illustration

[Open the standalone SVG](../diagrams/03-failed-power-distribution-board.svg). The SVG has a title and long description, labeled relation types, visible keyboard focus for semantic component groups, patterns/markers that survive monochrome or forced-colors rendering, and a deterministic view box.

**Text equivalent:** Ticket ticket.generated.3fd6eb04534f79b5b3f87f98 has public Symptoms symptom.power.voltage_out_of_range, symptom.power.no_power. Its public Candidates are fault.board.system.failed, fault.power.distribution_board.failed, fault.power.input.cable_loose, fault.power.psu.failed, fault.power.psu.not_seated. The schematic focus contains Input cables (power); PSU A + PSU B (power); Power Interposer Board (power); System-board load (host firmware post); Management status (management); Host + bounded runtime (runtime service); De-energized service (runtime service). Connections, in reading order: power relation from Input cables to PSU A + PSU B: two inputs; power relation from PSU A + PSU B to Power Interposer Board: 1+1 feed; power relation from Power Interposer Board to System-board load: board cables; power relation from System-board load to Host + bounded runtime: switched loads; control relation from Management status to PSU A + PSU B: status / mismatch; lifecycle relation from De-energized service to PSU A + PSU B: remove first; lifecycle relation from De-energized service to Power Interposer Board: disconnect / replace. Line labels and dash patterns distinguish relation types; no node or edge states which Candidate is true.

Semantic reading order is the text-equivalent component order, followed by connections. It does not depend on screen coordinates.

## 9. Why each relevant action can apply

This is system relevance only. It does not put a Card on the Bench, make an intent legal, predict an outcome, or award Evidence.

| Kind | Action ID | Component / path | Observation or intervention reason |
| --- | --- | --- | --- |
| Test | `test.general.minimum_configuration` | System-board load | bounds host dependencies without asserting which removed option is causal |
| Test | `test.general.visual_inspection` | System-board load → PSU A + PSU B | observes accessible service boundaries without turning proximity into diagnosis |
| Test | `test.power.distribution_path_isolation` | Input cables → PSU A + PSU B → Power Interposer Board → System-board load → Management status | observes or varies successive segments of the documented power path |
| Test | `test.power.known_good_psu` | Input cables → PSU A + PSU B → Power Interposer Board → System-board load → Management status | observes or varies successive segments of the documented power path |
| Test | `test.power.output_voltage_measurement` | Input cables → PSU A + PSU B → Power Interposer Board → System-board load → Management status | observes or varies successive segments of the documented power path |
| Test | `test.power.psu_status` | Input cables → PSU A + PSU B → Power Interposer Board → System-board load → Management status | observes or varies successive segments of the documented power path |
| Test | `test.power.residual_power_drain` | Input cables → PSU A + PSU B → Power Interposer Board → System-board load → Management status | observes or varies successive segments of the documented power path |
| Test | `test.system.bmc_logs` | Management status → System-board load | queries indirect lifecycle/inventory events; the Ticket authors their Evidence meaning |
| Repair | `repair.power.replace_distribution_board` | De-energized service → Power Interposer Board | de-energizes and replaces the exact PIB service role used for the broader game Candidate |
| Verification | `verify.power.distribution_path` | Input cables → PSU A + PSU B → Power Interposer Board → System-board load → Host + bounded runtime | checks the rebuilt input-to-board path under a downstream load |

## 10. Hidden Ticket-consistency proof

| Step | Authored action | Definition / target | Profile realization | Authored result reference |
| --- | --- | --- | --- | --- |
| 1 | RUN_DIAGNOSTIC | test.power.distribution_path_isolation | Input cables → PSU A + PSU B → Power Interposer Board → System-board load | evidence.fingerprint.power.failed.distribution.board.machine.power.failed.distribution.board.active.test.power.distribution.path.isolation |
| 2 | COMMIT_ISOLATION | fault_instance.power.failed_distribution_board.root | Power Interposer Board | fault_instance.power.failed_distribution_board.root |
| 3 | PERFORM_REPAIR | repair.power.replace_distribution_board | De-energized service → Power Interposer Board | repair_outcome.fingerprint.power.failed.distribution.board |
| 4 | PERFORM_VERIFY | verify.power.distribution_path | Input cables → PSU A + PSU B → Power Interposer Board → System-board load → Host + bounded runtime | verify_outcome.fingerprint.power.failed.distribution.board.01.pass |

All route steps resolve to present profile nodes. The generator validates this table but keeps it separate from the public projection function.

## 11. Candidate closure and differential non-leak

| Public Candidate | Truthful public realization | Why it remains possible |
| --- | --- | --- |
| `fault.board.system.failed` | System-board load → Host + bounded runtime | The downstream system board is a distinct service/load boundary. |
| `fault.power.distribution_board.failed` | Power Interposer Board | The exact product has a replaceable PIB serving the broader distribution-board functional role. |
| `fault.power.input.cable_loose` | Input cables → PSU A + PSU B | Two external input boundaries precede the PSU pair. |
| `fault.power.psu.failed` | PSU A + PSU B | Two individually serviceable supplies form the documented 1+1 pair. |
| `fault.power.psu.not_seated` | PSU A + PSU B → Power Interposer Board | The removable PSU-to-cage/interposer boundary is a truthful service interface. |

Differential variants tested with this exact public input: `fault.board.system.failed`, `fault.power.distribution_board.failed`, `fault.power.input.cable_loose`, `fault.power.psu.failed`, `fault.power.psu.not_seated`. The focused validator substitutes each Candidate as synthetic hidden truth and proves the public narrative, text equivalent, and SVG remain byte-identical. This proves rendering non-use of hidden truth; it does not claim every synthetic variant has an authored gameplay outcome.

## 12. Known abstractions, unsupported details, and stop conditions

### Profile-wide abstractions

- The PIB is modeled as a shared serviceable path, not as a schematic of internal rails or protection circuitry.
- Non-power subsystems are a grouped load because the exact Ticket needs only a bounded downstream consumer.
- The management-status edge records a documented observation capability, not a causal diagnosis.
- The public Candidate term distribution board is broader than Dell's exact Power Interposer Board role.

### Ticket-specific abstractions

- The game's distribution-board term is functionally broader than Dell's Power Interposer Board; the mapping is a reviewed pilot gap, not a silent rename.
- Voltage rails, pins, protection devices, and sensor circuits are outside the evidence available to this task.

### Stop conditions

- Stop if a proposed model equates every distribution-board Candidate with a PIB without product-specific documentation.
- Stop if exact voltages, rail names, connector pins, or sensor topology are needed; the cited sources do not prove them.
- Stop before combining this power bundle with the R740xd hybrid-storage profile; cross-family compatibility is not established.
- Stop before treating a management status or measured voltage as automatic Isolation authority.
- Stop if future content requires electrical measurement points or voltage limits not defined by an approved domain contract and exact service source.
- Stop if a generic distribution-board model is reused for a server without a documented equivalent service unit.
