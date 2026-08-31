# TASK-052 five-Ticket System Resolver proof

Status: **5/5 resolved; 5/5 deliberately invalid profiles rejected; public/private differential gates passed**

This report is generated from the same proof data as [`review.html`](review.html). It proves the approved `SYSTEM-001 A` architecture outside production Ticket navigation.

## Pilot results

| Ticket | Selected profile | Candidates | Rationale graphs | Private variants | Public combinations | Projection digest |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| `ticket.generated.3ec80b1b0e7221ac725aedf9` | `profile.dell.poweredge-r740xd.hybrid-24x2_5.v1` | 5 | 41 | 5 | 31 | `7fbc19692070ba03af59baad0a1e576ee9dcc9bfc0b41cacd708b89b59a908ba` |
| `ticket.generated.b34238282822e93980b5f1ad` | `profile.dell.poweredge-r740xd.hybrid-24x2_5.v1` | 4 | 41 | 4 | 15 | `b92fef39ea570af34c979acfc383ef8c1961e51a9069eacb3faf0ba08172bc65` |
| `ticket.generated.f32b85cbf2054fdf0114f42a` | `profile.dell.poweredge-r740xd.hybrid-24x2_5.v1` | 2 | 41 | 2 | 3 | `830e8528f905ce6bb19398f5aa285b2e82b6720230ad3c6389e7d4a5a3addc0c` |
| `ticket.generated.3fd6eb04534f79b5b3f87f98` | `profile.dell.poweredge-r740xd2.power-interposer.v1` | 5 | 10 | 5 | 31 | `1bc2bc8c8576f547455049c7de5f9f67b96b7b134235a3f6f0efd25f7e92db2c` |
| `ticket.generated.5352abd871c2e9076be92a0b` | `profile.dell.poweredge-r740xd.hybrid-24x2_5.v1` | 5 | 41 | 5 | 31 | `9a925f7d430b848230d26eeff75fe5755e6d015e4db4cc3a09c553e61d4fc6a1` |

All 5 resolver traces end in `ONE_SOURCE_PROJECTION_ACCEPTED`. The public projection API accepts no authoring-only input. Across 21 private variants, the complete public projection bytes remain identical. Across 111 non-empty authorized public Candidate combinations, the Candidate context changes while the canonical topology/lifecycle/inventory/rationale semantic digest remains unchanged.

## Invalid-profile results

| Counterexample | Stable reason code | Gameplay effect |
| --- | --- | --- |
| Required storage device is absent | `MISSING_REQUIRED_DEVICE` | NONE |
| Controller path direction contradicts its ordered path | `INCOMPATIBLE_CONTROLLER_PATH` | NONE |
| One still-public Candidate loses visible closure | `PUBLIC_CANDIDATE_CLOSURE_FAILED` | NONE |
| Vendor option claim has no released source basis | `UNSUPPORTED_VENDOR_OPTION` | NONE |
| Serviceable backplane loses its Component-role mapping | `INCOMPLETE_DOMAIN_RELATIONSHIPS` | NONE |

Every rejection returns the same generic text-only fallback; it never names the rejected profile detail or suggests a likely cause.

## One-source projection measurements

- 2 curated profiles serve 5 Ticket bindings.
- 51 unique sourced attachments produce 174 per-Ticket rationale graphs.
- Every public diagram node, edge, path, lifecycle entry, component role, and rationale reference resolves to the selected canonical profile.
- Every representation pins canonical JSON V1 and SHA-256; regeneration is byte-stable.
- System relevance is labeled separately from current Match legality, and the resolver reports `gameplay_effect: NONE`.

## Safety boundary

No authoring result identifier, diagnostic outcome identifier, solution pointer, or authoring-only reason is present in the public model data, generated prose, diagram data, rationale graphs, public traces, failure messages, or generated filenames. The authoring summary exposes only pass/reject status and aggregate check counts.

## Remaining gate

The five-pilot architecture passes its bounded gates. `SYSTEM-002` asks the owner whether to approve mass production, expand/correct the curated library, reopen the architecture, or defer the player-facing capability. TASK-053 remains blocked until that choice is recorded.
