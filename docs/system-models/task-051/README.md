# System Model pilot V1 production contract

Status: **released by TASK-051 on 2026-08-30 under approved `SYSTEM-001 A`**

The pilot implements the curated Finder architecture as trusted production data without implementing the resolver, projection builder, or Ticket UI. Two source-backed profiles are reused through five explicit public Ticket bindings. Private compatibility proofs are stored in a separate build/server-only catalog and can reject a binding; they cannot choose or alter the player-visible profile.

## Production package

| Artifact | Responsibility |
| --- | --- |
| [`system-model-catalog-v1.json`](../../../content/system-model-pilot-v1/system-model-catalog-v1.json) | Two versioned profiles with exact/generalized identity, eight-plane declarations, roles, stable Component references, typed nodes/edges/paths, lifecycle, surfaces, observation points, Finder capabilities, 51 sourced action attachments, templates, provenance, and canonical digests. |
| [`ticket-system-bindings-v1.json`](../../../content/system-model-pilot-v1/ticket-system-bindings-v1.json) | Five public-only resolver keys, exact Ticket/fingerprint/snapshot pins, profile references, public requirements, and complete public-Candidate closure. |
| [`private-compatibility-v1.json`](../../../content/system-model-pilot-v1/private-compatibility-v1.json) | Five build/server-only hidden-Fault and authored-action compatibility proofs plus differential non-leak variants. |
| [`domain-relationship-overlay-v1.json`](../../../content/system-model-pilot-v1/domain-relationship-overlay-v1.json) | The exact sixteen TASK-050 relationship findings, each applied as a sourced profile-scoped relation or deliberately preserved as unbound. |
| [`migration-v1.json`](../../../content/system-model-pilot-v1/migration-v1.json) | Versioned successor-overlay migration, five immutable Ticket pins, two added Component IDs, prior-content hashes, and unchanged gameplay/Story compatibility. |
| [`RELEASE-MANIFEST.json`](../../../content/system-model-pilot-v1/RELEASE-MANIFEST.json) | Deterministic generator, schema, artifact, immutable-input, and denominator hashes. |
| [`system-model-pilot-v1-components.json`](../../../viewer/content/system-model-pilot-v1-components.json) | The two justified successor Component definitions: System BIOS / UEFI Firmware and PCIe / NVMe Interconnect. |

Six closed JSON Schemas live under [`schemas/domain/`](../../../schemas/domain/), and the committed [valid](../../../examples/system-models/valid/) and [invalid](../../../examples/system-models/invalid/) fixtures cover shape plus semantic failures. `build-release.mjs --check` proves canonical byte stability; `validate-release.mjs` enforces reference integrity, cycles, lifecycle reachability, provenance, candidate closure, hidden/public separation, migration hashes, and complete-or-none acceptance.

## Finder boundary

The public binding is an explicit, deterministic lookup key over already public Ticket identity. It is not a runtime search or a trial-and-error compatibility oracle. The build-only proof may compare the complete authored Ticket with the already selected profile and return only pass or rejection. An unsupported Ticket has no binding and uses the stable text-only fallback; ordinary gameplay continues unchanged.

System relevance remains explanatory. An action attachment can say which role, path, surface, observation point, or lifecycle stage makes an action meaningful for this archetype. It cannot assign Action cost, expose a legal intent, derive Evidence, rank Candidates, accept Isolation, or decide Repair/Verify results.

## Reviewed abstraction exceptions

- `component.power.distribution_board` remains the stable broad Component definition. The R740xd2 profile's exact `role.pib` explicitly realizes the documented Power Interposer Board service role and keeps de-energization in typed service/lifecycle data; no unproved universal PIB Component was added.
- The grouped SAS/SATA bays continue to reference the existing broad `component.storage.sas_hdd` definition. This pilot does not claim a complete option inventory or exact bay-to-controller map.
- Grouped R740xd2 host loads remain an explicit `OUT_OF_SCOPE_ABSTRACTION` with no invented Component definition.
- Manufacturer pages remain mutable external sources. The release pins the reviewed TASK-050 ledger metadata and hash; it stores no copied manufacturer diagram or service-manual text.

There are no unresolved pilot consistency blockers. TASK-052 subsequently proved deterministic resolution and public view generation, and the owner approved `SYSTEM-002 A` on 2026-08-31. Story-wide domain synchronization, production rollout, and the Ticket UI remain isolated to TASK-053 through TASK-055.
