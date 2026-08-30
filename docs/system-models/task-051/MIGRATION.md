# System Model pilot V1 migration

TASK-051 uses a **versioned successor overlay**. It does not edit any released Repair Ticket, Builder catalog, Card/deck catalog, campaign manifest, checkpoint, replay, Evidence table, or engine rule.

## Before and after

```text
released Ticket snapshot + public Ticket surface
        |
        +-- unchanged gameplay and Story authority
        |
        `-- external public binding (new)
                -> pinned profile ID/revision/digest
                -> public capability requirements
                -> public-Candidate closure

complete authored Ticket (build/server only)
        `-- separate private compatibility proof (new)
                -> accept or reject the already-bound profile
                -> never changes public selection or projection
```

The exact migration rows and prior SHA-256 inputs are in [`migration-v1.json`](../../../content/system-model-pilot-v1/migration-v1.json). Every build/check fails if those immutable inputs drift. The five `prior_ticket_snapshot_digest` values are identical to the released coverage and the TASK-050 atlas.

## Public contract additions

- Added stable Component IDs `component.firmware.system_bios` and `component.storage.pcie_nvme_interconnect` in a new Viewer domain pack.
- Added stable `profile.*`, `binding.*`, role/node/edge/path/stage/surface/observation/capability/attachment/template IDs under `system-model-contract-v1`.
- Added six schema `$id` contracts and deterministic `canonical-json-v1` SHA-256 digests.

No existing stable entity ID was renamed or rebound. Unsupported Tickets remain valid gameplay content and simply have no System Model binding.

## Compatibility

- Ticket/Builder/engine behavior: unchanged.
- Active response decks and Diagnostic Bench: unchanged.
- Evidence, Isolation, Repair, Verify, and closure authority: unchanged.
- Story checkpoints, results, migration, and replay identity: unchanged.
- Public projection inputs: public profile/binding data only.
- Private compatibility details: build/server-only and absent from the public binding schema.

TASK-052 may consume these contracts to prove deterministic resolution and derived views. It must not silently rebind these released snapshots or treat the explanatory graph as deferred TASK-017 dependency-inference authority.
