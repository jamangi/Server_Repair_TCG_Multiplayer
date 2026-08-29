# Not-found database coverage — `exp-005`

These are vendor aliases or scenario facts; the generic firmware/link bundle already exists.

| Source phrase | Lifecycle step | Classification | Nearest existing entities | Why no direct match / disposition |
| --- | --- | --- | --- | --- |
| iDRAC product name | Observe / Repair | `alias` | `component.management.bmc`, `tool.management.bmc_console` | The vendor product maps to the generic management-controller boundary. |
| exact rollback version `4.40.40` | Test / Repair | `educational_detail` | `test.firmware.version_compatibility`, `repair.firmware.restore_compatible_versions` | A source-specific good version is Ticket/provenance data, not a global “correct” version or new object. |
| “NIC in slot 4 port 1 network link is started” event wording | Observe | `alias` | `symptom.network.link_flapping`, `component.network.nic` | Vendor message text identifies a generic link transition and target port. |
| internal mechanism by which management firmware triggers the link messages | Hypothesize | `uncertain` | `fault.firmware.version_set.incompatible` | Temporal correlation and rollback establish a version regression at the case's resolution level, but do not prove an electrical/driver mechanism. Do not invent one. |
| Linux interface-counter command | Test | `not_found` | `command.linux.ethtool`, `test.network.link_counter_soak` | The selected source does not execute one. Existing catalog content is available for later authored gameplay only after outcome review; research cannot claim it was required. |
