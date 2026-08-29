# Quiet Cascade expansion v3 release content pack

This deterministic report describes the authored content boundary released as `quiet-cascade-expansion-v3`. It measures what the pack contains; it does not claim that globally available content was exercised when it is absent from an authored Match.

## Release boundary

- Pack ID remains `story.campaign.quiet_cascade.v1`; stable campaign-one IDs are retained.
- New and reset profiles still enter at `story.qc01.entry` and traverse campaign one before the expansion.
- The six former campaign-one ending variants retain their public checkpoint IDs. Each is now an explicit durable checkpoint whose authored resume label is `story.qc02.entry`.
- Expansion entry immediately persists `checkpoint.qc02.entry` before Shift 7.
- The only terminal ending in this release is `ending.qc02.current_content` at `checkpoint.qc02.ending.current_content`.
- Already-completed characterization-v2 records require the client migration described below; content does not fabricate or replay any Match result.

| Former ending | Preserved checkpoint | Resume label |
| --- | --- | --- |
| `ending.qc01.defensible_release` | `checkpoint.qc01.ending.release.outcomes` | `story.qc02.entry` |
| `ending.qc01.defensible_release` | `checkpoint.qc01.ending.release.uncertainty` | `story.qc02.entry` |
| `ending.qc01.bounded_account` | `checkpoint.qc01.ending.bounded.outcomes` | `story.qc02.entry` |
| `ending.qc01.bounded_account` | `checkpoint.qc01.ending.bounded.uncertainty` | `story.qc02.entry` |
| `ending.qc01.gate_hold` | `checkpoint.qc01.ending.hold.outcomes` | `story.qc02.entry` |
| `ending.qc01.gate_hold` | `checkpoint.qc01.ending.hold.uncertainty` | `story.qc02.entry` |

## Migration assumption

The client migration from `quiet-cascade-characterization-v2` must retain the checkpoint's six accepted Match results, Story Service Points, four remembered campaign-one choices, and branch history; add only the two new registry-variable defaults; clear the obsolete terminal completion marker; and restore the preserved ending checkpoint so its v3 digest resolves to `story.qc02.entry`. Clearing the marker is lossless: preserved Story Service Points reproduce the Release (20+), Bounded (12–19), or Hold (0–11) band, while the exact preserved ending checkpoint ID reproduces its outcomes-first or uncertainty-first variant. The marker is cleared only because campaign one is no longer terminal. No result, reward, choice, or replay record may be synthesized.

## Exact content merge

| Measure | Campaign one | Expansion | Released total |
| --- | ---: | ---: | ---: |
| Player-facing episodes / Matches | 6 | 6 | 12 |
| Requested Tickets | 12 | 6 | 18 |
| Script files | 4 | 6 | 10 |
| Remembered variables | 4 | 2 | 6 |
| Localized source entries | 170 | 76 distinct additions | 258 |

Campaign-one Match definitions remain byte-equivalent as JSON values and keep the legacy v3 Builder profile. Shifts 7–12 retain their reviewed embedded v4 Builder configurations and exact deck-pressure records. The live loader must select an embedded `builder_configuration` when present; Shifts 1–6 continue through the legacy registry profile.

## Reviewed replay boundaries

| Shift | Match | Replay entry checkpoint |
| ---: | --- | --- |
| 1 | `story.match.qc01.shift01.wrong_device` | `checkpoint.qc01.shift01.scene` |
| 2 | `story.match.qc01.shift02.power_lot` | `checkpoint.qc01.shift02.scene` |
| 3 | `story.match.qc01.shift03.memory_compare` | `checkpoint.qc01.shift03.scene` |
| 4 | `story.match.qc01.shift04.passes_cold` | `checkpoint.qc01.shift04.scene` |
| 5 | `story.match.qc01.shift05.no_offer` | `checkpoint.qc01.shift05.scene` |
| 6 | `story.match.qc01.shift06.quiet_cascade` | `checkpoint.qc01.shift06.scene` |
| 7 | `story.match.qc02.shift07.socket_contacts` | `checkpoint.qc02.shift07.entry` |
| 8 | `story.match.qc02.shift08.power_distribution` | `checkpoint.qc02.shift08.entry` |
| 9 | `story.match.qc02.shift09.predictive_drive` | `checkpoint.qc02.shift09.entry` |
| 10 | `story.match.qc02.shift10.stale_alert` | `checkpoint.qc02.shift10.entry` |
| 11 | `story.match.qc02.shift11.firmware_regression` | `checkpoint.qc02.shift11.entry` |
| 12 | `story.match.qc02.shift12.bmc_recovery` | `checkpoint.qc02.shift12.entry` |

## Teaching reach added by the released Matches

The six expansion Matches add six distinct sourced fingerprints, six generated Tickets, and one real Match per episode. This is authored exposure, not proof of learner mastery or minimal-route action use.

- Shift 7, **The Fourth Pair**: Identify a socket-location fault without condemning known-good processors or memory.
- Shift 8, **Across Both Bays**: Use cross-bay known-good comparisons to isolate a shared distribution fault.
- Shift 9, **Before the Drop**: Treat predictive failure as actionable while protecting data and proving completed recovery.
- Shift 10, **The Alert That Stayed**: Separate read-only evidence preservation from the state-changing Repair that clears a stale alert.
- Shift 11, **Version A, Version B**: Use repeated version A/B behavior and hardware elimination to diagnose a firmware regression.
- Shift 12, **Recovery State**: Bound dangerous controller recovery to approved platform methods and verify recovery separately from the flash action.

## Reproducibility

- Campaign-one source tree: 10 files, `da465da37ff2081111db7cf0fa1ce1e7b5cb2e69e8b80c077838640a308f929d`.
- Expansion candidate source tree: 12 files, `a23cafc9a3ba1d0c5b20c40a9030d81cbc04fc8dad9fc1d49dc481bbe56be6a0`.
- Generator: `node src/story/generate-quiet-cascade-expansion-release.mjs`.
- Drift check: `node src/story/generate-quiet-cascade-expansion-release.mjs --check`.

The machine-readable sibling report pins every generated core-file digest, transition, replay boundary, source case, fingerprint, Ticket definition, and learning objective.
