# Five-Ticket System Model atlas

Status: **TASK-050 research evidence; no production schema or gameplay change**

The atlas contains five complete released-Ticket dossiers rendered from one structured dataset. Four use one fixed R740xd hybrid-storage profile; the power-path Ticket uses one R740xd2 Power Interposer Board profile. That measured reuse is the main evidence behind the Finder-first recommendation, while the refused cross-family combinations are evidence against unconstrained composition.

| Dossier | Released Ticket | Profile | Public Candidates | Relevant actions |
| --- | --- | --- | --- | --- |
| [Missing NVMe boot device](dossiers/01-missing-nvme-boot-device.md) | `ticket.generated.3ec80b1b0e7221ac725aedf9` | `profile.dell.poweredge-r740xd.hybrid-24x2_5.v1` | 5 | 34 |
| [Loose storage cable](dossiers/02-loose-storage-cable.md) | `ticket.generated.5352abd871c2e9076be92a0b` | `profile.dell.poweredge-r740xd.hybrid-24x2_5.v1` | 5 | 30 |
| [Failed power-distribution path](dossiers/03-failed-power-distribution-board.md) | `ticket.generated.3fd6eb04534f79b5b3f87f98` | `profile.dell.poweredge-r740xd2.power-interposer.v1` | 5 | 10 |
| [Incompatible firmware set with network symptoms](dossiers/04-incompatible-firmware-set-network.md) | `ticket.generated.b34238282822e93980b5f1ad` | `profile.dell.poweredge-r740xd.hybrid-24x2_5.v1` | 4 | 9 |
| [Corrupt BMC firmware recovery](dossiers/05-corrupt-bmc-firmware.md) | `ticket.generated.f32b85cbf2054fdf0114f42a` | `profile.dell.poweredge-r740xd.hybrid-24x2_5.v1` | 2 | 4 |

## Measured result

- Dossiers: 5/5.
- Original deterministic SVG illustrations: 5/5.
- Source-backed profiles: 2.
- Profile reuse: `profile.dell.poweredge-r740xd.hybrid-24x2_5.v1` × 4; `profile.dell.poweredge-r740xd2.power-interposer.v1` × 1.
- Public equivalence classes: 5 (the five released public Ticket surfaces are distinct).
- Public projection inputs: profile public structure plus released Ticket ID, Symptoms, and Candidates only.
- Private validation: authored Faults, outcome references, Isolation route, Repair, and Verification remain confined to dossier authoring proof.

See [the component and relationship audit](COMPONENT_RELATIONSHIP_AUDIT.md), [architecture evaluation](ARCHITECTURE_EVALUATION.md), [source ledger](source-ledger.json), and [browser/human review record](BROWSER_QA.md).
