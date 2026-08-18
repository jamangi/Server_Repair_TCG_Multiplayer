# Unsynchronized Decisions

This file is the active reconciliation queue for decisions that overlap, contradict, or depend on a foundation whose status has changed.

An entry here does not silently unfreeze an approved rule. [`FROZEN_RULES.md`](FROZEN_RULES.md) remains authoritative until an explicit decision changes it. See [`DECISION_INDEX.md`](DECISION_INDEX.md) for the complete lifecycle.

## Confirmed unsynchronized decisions

These items already appear as both frozen behavior and open wording in the current decision inventories.

| ID | Area | Overlap | Current authority and remaining question |
| --- | --- | --- | --- |
| `SYNC-001` | Replenishment timing | Unfrozen wording asks whether replenishment is immediate or waits for resolution. | Frozen: reconcile after the completed resolution. [`CROSS-001`](CANDIDATE_DECISIONS.md#cross-001) must define which closure effects belong to that resolution. |
| `SYNC-002` | Spectator seats | Unfrozen wording asks whether spectator seats are permitted. | Frozen: spectator seats are permitted with separate capacity. Late joining, availability policy, and spectator behavior remain open. |
| `SYNC-003` | Player-clock expiration | Unfrozen wording asks whether expiration causes concession or inactivity. | Frozen: player-clock expiration concedes the Player. Error presentation and downstream cleanup may remain open. |
| `SYNC-004` | Clock pauses | Unfrozen wording reopens pausing during server resolution and reconnect synchronization. | Frozen: both pauses are required. Animation and modal-decision pauses remain open. |
| `SYNC-005` | Ticket contention | Unfrozen wording asks whether Tickets are shared freely or claimed. | Frozen: Tickets are shared and jointly actionable by default. Only explicit claim or ownership effects remain open. |
| `SYNC-006` | Stale actions | Unfrozen wording asks how stale Ticket-close attempts are ordered and rejected. | Frozen: the server serializes actions, validates revisions, and rejects stale actions. Resolution boundaries, rejection codes, and client presentation remain open. |
| `SYNC-007` | Ticket progress | Unfrozen wording asks whether partial progress persists when control changes. | Frozen: progress belongs to the Ticket. Clarify whether explicit effects may reset progress and how private Player knowledge behaves. |
| `SYNC-008` | Evidence visibility | Unfrozen wording broadly asks which discoveries are private, team-shared, or public. | Frozen defaults: team-visible in cooperative play and private in competitive play. Card-specific exceptions, public promotion, and spectator visibility remain open. |
| `SYNC-009` | Computer-player knowledge | Unfrozen wording asks whether computers can inspect hidden authoritative information. | Frozen: computer players receive only their seat's player-safe information. Difficulty and decision policy remain open. |
| `SYNC-010` | No-human live termination | Unfrozen wording asks what occurs when every human concedes but computers remain. | Frozen: a live server match terminates; an offline simulation may continue. Only offline terminal policy remains open. |
| `SYNC-011` | Full spectator capacity after concession | Unfrozen wording asks what happens when concession cannot create a Spectator. | Frozen: the member remains joined without a gameplay role. UI and later role-selection behavior remain open. |
| `SYNC-012` | Rejoining after concession | Unfrozen wording asks about rejoining before and after concession. | Frozen: a departed Player cannot reclaim the seat after departure becomes concession. Reconnection before concession remains open. |
| `SYNC-013` | Numeric configuration types | Unfrozen wording asks whether all numeric settings must be integers. | Frozen core fields already specify integer types. The open question applies only to new settings whose types are not frozen. |

## Likely future unsynchronized decisions

These are potential conflicts. They become confirmed only if a candidate or unfrozen option pressures the frozen rule as described.

| ID | Potential pressure | Candidate foundation |
| --- | --- | --- |
| `FUTURE-SYNC-001` | The frozen troubleshooting sequence ends with Document, while optional Documentation could allow closure without it. | [`DOC-001`](CANDIDATE_DECISIONS.md#doc-001) |
| `FUTURE-SYNC-002` | The frozen sequence presents Document after Verify, while incremental Documentation could occur throughout Observe, Test, and Isolate. | [`DOC-004`](CANDIDATE_DECISIONS.md#doc-004), [`DOC-006`](CANDIDATE_DECISIONS.md#doc-006) |
| `FUTURE-SYNC-003` | The frozen Worklog example can reveal that a Test occurred while keeping its result private; delayed Documentation could hide the action itself. | [`OBS-001`](CANDIDATE_DECISIONS.md#obs-001), [`DOC-003`](CANDIDATE_DECISIONS.md#doc-003) |
| `FUTURE-SYNC-004` | Cooperative Evidence is team-visible by default; Documentation therefore cannot be the only transition from private to shared Evidence without changing that default. | [`DOC-003`](CANDIDATE_DECISIONS.md#doc-003), [`CROSS-003`](CANDIDATE_DECISIONS.md#cross-003) |
| `FUTURE-SYNC-005` | Frozen visibility uses `SERVER_ONLY`, `PRIVATE_PLAYER`, `TEAM`, and `PUBLIC_MATCH`; a binary private/public Documentation model would bypass approved categories. | [`DOC-003`](CANDIDATE_DECISIONS.md#doc-003) |
| `FUTURE-SYNC-006` | Ticket progress belongs to the Ticket, but a design that treats private Isolation, Repair, or Verification state as disposable Player state could erase authoritative progress. | [`ISO-002`](CANDIDATE_DECISIONS.md#iso-002), [`DOC-003`](CANDIDATE_DECISIONS.md#doc-003) |
| `FUTURE-SYNC-007` | The server serializes authoritative actions; a Worklog ordered by publication time rather than event sequence could falsify chronology. | [`DOC-008`](CANDIDATE_DECISIONS.md#doc-008) |

## Indirectly pressured frozen rules

A frozen rule may be internally consistent yet depend on a foundation now under review. These rules remain authoritative until the foundation is decided.

### Troubleshooting-loop order

`DOC-001`, `DOC-004`, and `DOC-006` may determine whether Observe → Hypothesize → Test → Isolate → Repair → Verify → Document is strict stage order, a conceptual educational loop, or a completion checklist that permits incremental Documentation.

### Worklog projection

`OBS-001`, `DOC-002`, `DOC-003`, and `DOC-008` may refine which authoritative actions appear immediately, which results remain private, and how later publication preserves event chronology.

### Cooperative Evidence defaults

`DOC-003` and `CROSS-003` may distinguish team-sharing from public Documentation. They must not silently reduce the frozen cooperative default.

### Ticket-owned progress

`ISO-001`, `ISO-002`, and `DOC-003` must distinguish authoritative Ticket progress from a Player's private Knowledge State without transferring or deleting progress accidentally.

### Completed-resolution boundary

`CROSS-001` may add Documentation, scoring, draws, and resource awards to Ticket closure. It must preserve the frozen rule that queue replenishment follows the complete resolution.

## Resolution record template

Use this shape when adding a synchronization item:

```markdown
### SYNC-NNN — Short title

**Sources:** Frozen section; unfrozen or candidate decision

**Authority during review:** Frozen rule or explicitly stated exception

**Fundamental dependency:** Decision ID

Describe the overlap or contradiction.

Affected artifacts:
- normative decisions;
- schemas and examples;
- presets;
- implementation and tests;
- older design documents.
```

## Synchronization checklist

When the fundamental decision is resolved:

1. Update the frozen or unfrozen rule explicitly.
2. Remove or narrow duplicate open wording.
3. Update affected schemas, examples, and presets.
4. Add behavior-focused tests before implementation relies on the new rule.
5. Update older design documents in a separately reviewed pass.
6. Record migrations for persisted or transmitted data.
7. Remove the active entry only after every affected source agrees; Git history preserves its former state.
