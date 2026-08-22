# Story-facing application-shell candidates

Status: **candidate interface material only; not a UI contract or implementation task**

This document adds a campaign and workplace lens to the provisional [`docs/ui-plan/`](../../ui-plan/TODO.md). It does not replace the existing application-shell, room, lobby, identity, social, or client-authority recommendations.

## Candidate shell identity

The existing “Operations Deck” shell can become the player's **Second Current Shift Desk** during campaign play. It is an application metaphor, not a claim that cards are literal workplace objects.

The stable shell still has:

- a top identity and current-presence strip;
- a replaceable central stage;
- persistent high-frequency navigation;
- an optional social drawer;
- the same technician identity across campaign, rooms, lobby, match, profile, and results.

Campaign becomes one destination inside that shell rather than a separate app with incompatible navigation.

## Candidate primary destinations

| Destination | Purpose | Relationship to current UI plan |
| --- | --- | --- |
| Shift | Continue campaign, see the current episode, rotation, lot brief, and unresolved story threads. | New campaign stage in the existing shell. |
| Rooms | Browse, create, join, play, or spectate multiplayer rooms. | Preserve the planned social room browser and lobby. |
| Decks | Prepare legal decks and inspect which procedures, tools, and cards are available. | Expands the likely deck destination without deciding legality. |
| Qualifications | See rotation progress, learned practices, mentors, and campaign access. | Could share space with My Info if a separate destination is too heavy. |
| Records | Browse authorized Worklogs, closed campaign cases, technical references, and repeat-return links. | Combines story history with the existing educational reference boundary; must preserve visibility. |
| My Info | Technician portrait, cosmetics, statistics, accessibility, and identity. | Preserve the planned identity strategy. |
| Social | Friends, invitations, messages, room chat, and later community features. | Preserve the independent social-domain boundary. |

The first implementation need not expose all destinations. “Qualifications” and “Records” can begin as panels within Shift or My Info.

## Campaign home: Shift Desk

The Shift Desk should answer five questions at a glance:

1. Where am I in the story?
2. Which team am I currently rotating with?
3. What lot, incident, or human problem is waiting?
4. What preparation can I change before gameplay?
5. What will begin the next match?

Candidate regions:

- **Current shift:** episode title, time, location, and one-sentence premise.
- **Active lot:** client-safe summary, visible unit count, authorized context, and urgency.
- **Rotation badge:** home team, current shadow team, mentor, and next qualification opportunity.
- **Story threads:** two or three short unresolved items such as a repeat serial, quarantined lot, or missing field report.
- **Prepare:** deck selection, allowed changes, and a plain-language warning if requirements are unmet.
- **Begin work:** the clear transition into the authoritative match.

Do not show the hidden Fault, causal chain, unrevealed Evidence, or a narrative hint generated from authoritative server state.

## Episode transition

Candidate sequence:

```text
Cold open
  -> Shift brief
  -> Authorized context review
  -> Deck / qualification preparation
  -> Match synchronization
  -> Repair Ticket gameplay
  -> Gate review and results
  -> After-shift scene
  -> Worklog archive / progression
```

The existing loading-and-synchronization concept remains useful. For campaign, its readiness checks can be framed as content, deck, player-safe snapshot, and local/remote engine readiness without inventing a fake spinner.

## The facility map

A small stylized Trinity Hub map can act as chapter navigation:

```text
Inflow -> First Look -> Rigline -> Trace -> Bench -> Gate -> Outflow
                         |                    |
                    Knowledge            Materials
                         \---- Global Desk --/
```

This is a story and relationship map, not a forced one-way Ticket state machine. A failed Verify can visibly route a Ticket from Gate back toward Diagnosis. Supporting teams can open as panels or scene nodes without becoming separate game modes.

The map should emphasize people and current work rather than simulate walking. Selecting Rigline might open Malik's scene, current qualification, and related Worklogs; it should not add traversal time between the player and the next meaningful decision.

## Match story surfaces

### Ticket header

May show client-safe lot, unit identity, reported issue, visible symptoms, service constraints, and revision. It must not expose hidden technical state.

### Private notebook

Candidate home for private Evidence, explicit Hypotheses if adopted, unpublished results, and comparison notes. In cooperative play, team-visible Evidence needs a distinct presentation from both private notes and the public Worklog.

### Worklog

Show authoritative chronology, actor, source action, target as permitted, stage changes, published Evidence, repair records, Verify results, and later Documentation enrichment. Preserve action time and publication time if both matter.

### Team presence

Named campaign characters or multiplayer technicians can appear as compact presence portraits associated with a legal action, consultation, or current turn. A portrait is not proof that the character knows hidden state.

### Gate state

After Repair, the interface should make required Verify conditions and documentation gaps legible without implying that a green animation closes the Ticket by itself. Exact closure behavior remains controlled by `DOC-001`, `DOC-006`, and `CROSS-001`.

## Gate review and debrief

The post-match story bridge should separate:

- what was observed;
- which Fault or causal depth was isolated;
- what was repaired;
- which required state was actually verified;
- what entered the Worklog;
- what remains uncertain;
- how contributors and the campaign reacted.

This is more useful than a generic victory screen. It can still lead to Service Points, statistics, rewards, and story choices after those systems are decided.

Candidate result labels should avoid false certainty:

- **Released:** required conditions and record satisfied.
- **Held at Gate:** repair may be complete, but Verify or Documentation is insufficient.
- **Returned to Diagnosis:** a failed condition produced new Evidence.
- **Escalated:** the current service cell cannot safely or authoritatively continue.
- **Dispositioned:** unit routed to another lifecycle outcome under an authored rule.

These labels are story/UI candidates, not approved Ticket states.

## Character and rotation presentation

- Reuse the player's portrait everywhere; current rotation changes a badge, background accent, or tool context rather than the player's identity.
- Show mentors as people with availability and relationship context, not as anonymous perk dispensers.
- Present a qualification as “access to a reviewed method” rather than a claim that the player became an expert after one scene.
- Keep cosmetic identity separate from mechanical effect.
- Let characters appear in Worklog and result attribution when they actually performed or supported an authoritative action.

## SIFT presentation

SIFT can occupy a collapsible comparison panel rather than the visual center of the game.

It may show:

- eligible candidate ranking derived from visible Evidence;
- source records used;
- missing or unpublished inputs;
- similar authorized Worklogs;
- confidence and last-update time;
- clear text that the recommendation is not Isolation.

It must not:

- read hidden authoritative Faults;
- change its answer from information the player cannot see;
- publish private Evidence automatically;
- impersonate a human character;
- obscure which person interpreted a result or committed an Isolation.

## Multiplayer and campaign coexistence

Campaign fiction should not contaminate generic room rules.

- **Solo campaign:** the player can work with authored computer technicians or a local engine using player-safe views.
- **Co-op campaign candidate:** invited players occupy members of a Continuity cell and share the authored incident.
- **Competitive campaign candidate:** technicians participate in a sanctioned service trial or parallel evaluation without sabotage.
- **Open multiplayer:** rooms need not be canon events at Trinity Hub; the shell can frame them as simulations, open shifts, or simply multiplayer play.

One configurable match system should remain underneath every presentation.

## Narrative notifications

Prefer notifications that carry actionable provenance:

- “Gate attached a failed load result to Ticket 3.”
- “Inflow linked this serial to a prior return.”
- “Malik's consultation is available before the next shift.”
- “Two Worklog actions still have unpublished results.”

Avoid:

- “Something mysterious happened!”
- red badges with no accessible explanation;
- notifications that reveal a story conclusion before the player earns the Evidence;
- urgent visual treatment for routine social or store activity during a critical match.

## Accessibility and reduced motion

- Every stage transition must remain understandable with animation disabled.
- Facility-map routes need text equivalents and predictable focus order.
- Color cannot be the only distinction among private, team, public, passed, held, and failed states.
- Technical output needs readable summaries without removing access to the raw result.
- Portrait expression, voice, and sound cues need captions or text equivalents.
- Time-limited narrative reading should never consume an authoritative turn clock unless a later rule explicitly and accessibly requires it.

## Open interface questions

1. Is Shift a primary dock destination or the default Home stage?
2. Do Qualifications belong inside My Info, Decks, or a distinct campaign panel?
3. How are campaign Worklogs separated from the domain encyclopedia and multiplayer history?
4. Does co-op campaign support authored companions, human substitution, or both?
5. Which story outcome ranges can the first engine actually report without bespoke scripting?
6. How does a failed Verify transition visually without turning the conceptual lifecycle into a rigid state machine?
7. Should SIFT exist in the first campaign slice, or enter only after players understand unaided Evidence and Isolation?
8. Which shell elements persist during a match, and which collapse to protect the play area?

## Implementation boundary

Before building any of this:

1. resolve the relevant engine decisions and player-safe projections;
2. freeze the client/application boundary in the UI plan;
3. define campaign state separately from authoritative match state;
4. create fixture-driven view contracts;
5. preserve the Domain Viewer as a separate static application;
6. test keyboard, reduced-motion, reconnect, privacy, and deterministic-settling behavior;
7. scope implementation in a new task.
