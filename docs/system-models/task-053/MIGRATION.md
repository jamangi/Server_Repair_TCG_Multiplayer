# TASK-053 System Model migration

The `system-model-story-v1` release succeeds the five-Ticket `system-model-pilot-v1` package without mutating it. Consumers opt into the new release ID and its strict successor schemas as one atomic package; no mixed v1/v2 catalog set is valid.

## Preserved data

The migration ledger pins the old [pilot catalog](../../../content/system-model-pilot-v1/system-model-catalog-v1.json), [pilot bindings](../../../content/system-model-pilot-v1/ticket-system-bindings-v1.json), [pilot private proofs](../../../content/system-model-pilot-v1/private-compatibility-v1.json), [pilot relationship overlay](../../../content/system-model-pilot-v1/domain-relationship-overlay-v1.json), and [pilot migration](../../../content/system-model-pilot-v1/migration-v1.json). Within the successor release:

- both old profile objects are identical;
- all five old binding objects are identical;
- all five old private-proof objects are identical;
- all sixteen old relationship rows are identical;
- their Ticket IDs, snapshot digests, profile revisions, profile content digests, public resolver keys, and fallback IDs are unchanged; and
- the earlier v1 files and schemas remain unchanged on disk.

The successor [migration ledger](../../../content/system-model-story-v1/migration-v2.json) pins nineteen immutable inputs by SHA-256. Validation rejects any drift before exposing the release.

## Added release data

The successor adds thirteen Ticket bindings and thirteen private compatibility proofs for the non-pilot released Story Tickets. One new profile variant, `profile.dell.poweredge-r740xd.hybrid-24x2_5.story-v1`, supplies the public topology and action mappings required by those Tickets. It does not replace or revise the accepted pilot R740xd profile.

No new Component definition is added. `added_component_ids` is empty. The two Component IDs introduced by the pilot remain explicitly preserved:

- `component.firmware.system_bios`
- `component.storage.pcie_nvme_interconnect`

The new profile's three non-hardware roles—OS network configuration, bounded peer network service, and lifecycle/service boundary—are labeled public abstractions and cannot be resolved as replaceable Components.

## Consumer transition

1. Validate [RELEASE-MANIFEST.json](../../../content/system-model-story-v1/RELEASE-MANIFEST.json) and all immutable pins.
2. Load the [catalog](../../../content/system-model-story-v1/system-model-catalog-v2.json), [public bindings](../../../content/system-model-story-v1/ticket-system-bindings-v2.json), and [relationship overlay](../../../content/system-model-story-v1/domain-relationship-overlay-v2.json) as the public-authoring package.
3. Keep [private compatibility proofs](../../../content/system-model-story-v1/private-compatibility-v2.json) in build/server validation only. They must never enter browser assets or public resolver input.
4. Resolve by the exact Ticket ID, fingerprint, Ticket snapshot digest, profile revision, and profile content digest. Approximate fingerprint or nearest-profile matching is forbidden.
5. On a missing binding, digest mismatch, invalid source claim, dangling relationship, or failed schema/semantic gate, use `fallback.system-model.text-only.v1`. Do not infer a replacement binding.
6. Preserve the gameplay Ticket and authored state unchanged whether the System Model resolves, rejects, or falls back.

The deterministic [builder](../../../content/system-model-story-v1/build-release.mjs) and independent [validator](../../../content/system-model-story-v1/validate-release.mjs) are the authoritative reproduction path. The [coverage ledger](../../../content/system-model-story-v1/coverage-ledger-v1.json) is audit data, not a runtime resolver input.

## Compatibility promises

- Ticket Builder, engine, active-deck, checkpoint, replay, and authored outcome behavior are unchanged.
- Public Candidate closure is identical for every synthetic private differential variant.
- Repair/Verify compatibility proves only that a sourced intervention/observation path exists; it cannot prove diagnosis or action success.
- Relationship mappings remain an overlay. The immutable gameplay domain snapshot is not rewritten.
- Schema and semantic validation are complete-or-none. A consumer must not expose a partially valid catalog.

TASK-054 may derive production projections from this release but may not copy hidden compatibility data. TASK-055 may present those projections but may not reconstruct private truth or introduce new gameplay authority.
