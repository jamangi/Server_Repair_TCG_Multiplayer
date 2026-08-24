# UI Plan — Working TODO

Status: **provisional and intentionally mutable**

This document preserves the current UI planning discussion while additional visual references are gathered. It is not yet a frozen architecture, requirements contract, or implementation task. Revise it freely until the product structure and visual direction are approved.

Original generalized references now live in [`wireframes/INDEX.md`](./wireframes/INDEX.md). They are working visual studies, not frozen specifications.

## Solo Diagnostic Bench and board-composition backlog

Two project-owner layout studies now live in `ui-reference_images/`:

- `relevant_diagnostic_bench.png` explores a compact public-context-filtered shelf, split illustration/Ticket details, expanded queue, separate response hand, and fully visible Legal Action.
- `global_diagnostic_bench.png` explores a searchable/filterable/paginated complete playable catalog, compressed Ticket summary, selected-diagnostic inspector, and compact response hand.

Current recommendation: approve PT-001 D as a pre-Match **Bench Profile** choice between `RELEVANT` and `GLOBAL`, default Relevant, and pin it for the Match. Do not model this as owned Equipment; it is a workspace/access profile with no inventory, progression, or technician power. Group results by profile because the modes represent different amounts of guidance.

Functional rules/contracts and a usable first Bench belong to TASK-013. Catalog/outcome breadth belongs to TASK-014. Whole-board responsive density/polish belongs to TASK-016 after representative data stabilizes. Key TASK-016 backlog:

- reclaim active-Match masthead whitespace and make the board consume available viewport height;
- give a 1–10 Ticket queue more vertical room, compact its cards, and collapse Archived by default;
- keep selected Ticket status/candidates visible, using a split Relevant hero and compressed Global summary plus an accessible full-Ticket view;
- keep the selected Legal Action completely visible at normal desktop heights;
- keep Bench diagnostics distinct from the private Repair/Verify response hand;
- preserve Evidence/Worklog, queue, Bench, and input continuity from TASK-012;
- use bounded pagination/filtering for Global rather than one enormous Card scroller; and
- recompose for mobile instead of shrinking the desktop grid.

Do not add a `Relevant` hint/filter to Global mode, derive client-side relevance, hide basic symptom access, or display raw knowledge-library counts as playable catalog counts.

## Recommended UI-plan structure

When the plan is mature enough to split into durable documents, the likely structure is:

```text
docs/ui-plan/
  README.md
  UI_ARCHITECTURE.md
  DESIGN_LANGUAGE.md
  MOTION_ARCHITECTURE.md
  VIEW_STATE_CONTRACTS.md
  RESPONSIVE_ACCESSIBILITY.md
  REFERENCE_POLICY.md
  01-application-shell/
  02-room-browser/
  03-room-creation/
  04-room-lobby/
  05-player-identity/
  06-social/
  07-match-table/
  08-results-history/
```

Each view folder may eventually contain:

- `PLAN.md` — purpose, hierarchy, interactions, and unresolved decisions.
- `COMPONENTS.md` — reusable components and their state contracts.
- `visual-references/REFERENCE_NOTES.md` — lessons derived from references, source links, and approved original mockups.

Do not create this full structure until the remaining references have been reviewed and the boundaries are stable.

## Application shell notes

- Use React for declarative, state-driven UI and Motion for React (`motion/react`) for layout transitions, presence, focus, inspection, and card movement.
- Keep the playable application separate from the existing dependency-free domain viewer. A likely future boundary is `apps/game-web/`, with reusable packages for engine, contracts, clients, presentation, and content.
- The UI reads an immutable player-safe view, sends typed player intents, and consumes semantic presentation events. It must not contain authoritative rules.
- A generic `GameClient` boundary should permit the same UI to use either:
  - a local engine and local persistence; or
  - HTTP/WebSocket communication with a server-authoritative engine.
- Separate durable game state from transient animation events. A card arriving in a hand is state; how it flies, glows, or settles is presentation.
- Use a persistent footer or compact application dock for high-frequency destinations. Likely destinations include rooms, profile/technician, decks, social/messages, settings, and exit/sign-out.
- The shell should preserve room presence and communication state while panels open and close.

## Room browser notes

Central principle: **turn multiplayer configuration into a social place, not a technical form.**

- Room cards should communicate their emotional premise before their detailed variables.
- Use large, energetic labels such as `COMPETITIVE` and `CO-OP`.
- Use smaller badges or icons for supporting facts:
  - solo or team;
  - occupied and total player seats;
  - human and computer participants;
  - password protection;
  - spectator capacity;
  - timers enabled or disabled;
  - room status such as open, in progress, or full.
- Make `Create room` a prominent action rather than another small list item.
- Show available seats before a person attempts to join.
- Never silently join a full room as a spectator. Let the visitor explicitly choose `Spectate` after seeing that player seats are unavailable.
- Room search and filters may include Competitive, Co-op, Solo, Team, Open Seats, Password-Free, Friends, and In Progress.
- The room browser can show the signed-in technician/avatar and lightweight presence information to reinforce that this is a shared space.
- Prefer original Jamangi visual language over directly imitating the reference game's chrome.

## Room creation notes

- Present a small, friendly basic form first and place technical tuning behind an `Advanced settings` disclosure.
- Basic settings should likely include:
  - title;
  - Competitive or Co-op;
  - player seat limit;
  - optional password;
  - whether the creator immediately takes a player seat;
  - an illustrated preset.
- Candidate illustrated presets:
  - Quick Repair;
  - Standard Shift;
  - Cooperative Incident;
  - Endless Operations;
  - Custom Room.
- Advanced settings may expose friendly labels for the design variables:
  - Service Point Goal (`X`);
  - Starting Tickets (`S`);
  - Queue Minimum (`Q`);
  - Starting Service per player (`H(p)`);
  - Turn Timer (`T`);
  - Player Clock (`PT`);
  - Player Seats (`SL`);
  - Spectator Seats (`SP`);
  - Starting Search Tokens (`SSC`);
  - Search Tokens per Closure (`TSC`);
  - Maximum Search Tokens (`MSC`);
  - Refresh Token Limit (`MRF`);
  - Starting Refresh Tokens (`SRT`).
- Prefer names, helper text, presets, sliders, steppers, toggles, and illustrations over exposing mathematical notation in the normal UI.
- Validate incompatible values immediately and explain corrections in plain language.
- Passwords are room access controls, not substitutes for account security or moderation.

## Room lobby notes

- Treat the lobby as a **presence theater**: people should feel that other humans and computer technicians occupy the room.
- Show player seats, spectator state, readiness, teams/co-op grouping, host status, computer players, and empty seats visually.
- Candidate room commands:
  - `Create`
  - `Join`
  - `Play` (take a player seat)
  - `Spectate`
  - `Concede`
  - `Leave`
  - `SetReady`
  - `SelectSeat` or `SelectTeam`
  - `AddComputerPlayer` / remove computer player, when authorized
  - `StartMatch`, when authorized
- Include room chat without letting it obscure readiness and settings.
- Show the most important settings persistently; place the complete configuration behind a gear/details panel.
- Candidate persistent summary: mode, seats, Service Point Goal, Starting Tickets, Queue Minimum, timer, and password/visibility status.
- Avatars may idle, shift pose, emote, or display speech bubbles through lightweight Motion animations.
- A Player who concedes becomes a Spectator only when spectator capacity and Room policy permit it; otherwise they remain a joined member with no gameplay role unless they leave.
- The lobby must remain comprehensible without animation and under reduced-motion preferences.

## Character strategy notes

- Begin cheaper than a 3D character system.
- Do not create an account Equipment/loadout system, mechanical ability slots, or Equipment readiness snapshot. Mechanical preparation lives in legal decks and match-time card state.
- Keep appearance choices cosmetic. Qualifications may appear as honor-only profile/history badges, with no gameplay, access, deck, procedure, story, or matchmaking effect.
- Preserve technical Tools as domain records and playable card concepts; a Tool is not character Equipment merely because artwork shows the technician holding it.
- First viable approach: selectable complete technician portraits or sprites plus an accent palette.
- Expand later into a layered 2D paper-doll system:
  - base/body pose;
  - skin tone;
  - face;
  - hair;
  - uniform/top;
  - trousers/bottom;
  - accessory;
  - diagnostic tool;
  - expression or emote.
- Reuse the same identity in the application shell, room browser, lobby seats, match presence, profile, and results.
- Motion can provide breathing, bobbing, tool glints, readiness pulses, and small pose changes without requiring a game engine.
- Character options should represent varied skin tones, hair, gender expression, and assistive devices without turning identity into gameplay power.
- Keep character assets and selection data separate from game rules and authoritative match state.

## Match interaction contract notes

- Present Observe and Diagnosis as an evidence loop, not seven locked departments. Within Diagnosis, Hypothesize and Test remain revisitable until the player commits an evidence-supported Isolation.
- Make `Commit Isolation` an explicit one-Action intent that cites Evidence and identifies an authored candidate Fault. Show accepted Isolation as public Ticket progress and the ordinary gateway to Repair; keep private or team Knowledge State visually distinct from machine state.
- A failed Verify must visibly return the Ticket to Diagnosis without erasing earlier Evidence, Repairs, Verification attempts, or Worklog entries. A later Verify evaluates the current machine state and current passes after the latest relevant Repair.
- Support incremental `Document Live` play during the match. The Worklog is an immutable chronology: player-safe placeholders may later gain publication details, but their event identity, action time, and order do not change.
- Respect the four visibility categories—`SERVER_ONLY`, `PRIVATE_PLAYER`, `TEAM`, and `PUBLIC_MATCH`—in every match, reconnect, history, and spectator projection. Hidden content should never be inferred from animation timing, labels, or placeholder shape.
- After successful Verify makes a Ticket ready to close, open an immediate structured closure window before automatic turn end, even when Verify spent the last Action. Closure costs zero Actions, awards no Service Points, records Player/team closure statistics, performs the full server transaction, and grants only the configured utility resources.
- The first-version turn display should make the start-of-turn draw, two Actions, and remaining Search/Refresh resources legible. Empty draw is a non-loss event; Search and Refresh each cost one Action plus their own token, and legal zero-Action cards still obey their once-per-turn same-name limit.
- Every motion treatment needs an equivalent stable-state cue. Under reduced motion, use focus movement, concise status text, and ordered Worklog updates instead of relying on card flight, pulses, or timing alone.

## Friends, messages, and guilds notes

- Social features are a separate product/domain boundary from the card-game engine.
- Likely surfaces include:
  - friends list with online, offline, in-room, and in-match presence;
  - private messages;
  - room invitations;
  - guild/community roster and chat;
  - room chat;
  - notification badges in the application dock.
- A production social system also requires blocking, muting, reporting, privacy controls, moderation, rate limits, retention policy, and abuse-resistant presence rules.
- Do not make guild membership or private messaging a prerequisite for the first playable card-game slice.
- Prefer staged delivery: presence and invitations first, then private messaging, then guild/community features.
- Do not expose private room or match information through presence unless the user permits it.

## Visual references in a public repository notes

- Prefer the original generalized wireframes collected in [`wireframes/INDEX.md`](./wireframes/INDEX.md) when a public, redistributable reference is needed.

- Do not copy third-party game screenshots into the public repository unless Jamangi has redistribution permission.
- Preserve reference URLs and write original `REFERENCE_NOTES.md` files describing the reusable lessons:
  - strong mode typography;
  - instantly visible seat counts;
  - prominent room creation;
  - avatar-driven presence;
  - compact footer navigation;
  - layered chat/social panels;
  - illustrated presets that make detailed settings approachable.
- Create original wireframes and mockups that express these principles in Jamangi's own visual language.
- Every reference should record:
  - source and access date;
  - the specific lesson being extracted;
  - what must not be copied;
  - which original Jamangi artifact demonstrates the lesson.
- Visual references are evidence and inspiration, not implementation specifications by themselves.

## Recommended implementation sequence notes

1. Freeze the UI/client architecture and design-language boundaries.
2. Define immutable player views, typed intents, semantic presentation events, and the `GameClient` interface.
3. Build the application shell and navigation using static fixtures.
4. Build a fixture-driven room browser with responsive room cards and filters.
5. Build room creation with illustrated presets, basic settings, and an Advanced settings disclosure.
6. Build the room lobby, seat model, readiness, computers, spectators, settings summary, and chat shell.
7. Add a simple selectable technician portrait system; defer layered customization until the room flow proves valuable.
8. Implement a local `GameClient` and room simulator so all flows can be exercised without a server.
9. Build the match table with reusable presentation components and Motion-based semantic event handling.
10. Implement the remote `GameClient` against the future server-authoritative room and match APIs.
11. Add production social features in independently secured phases.
12. Perform responsive, reduced-motion, keyboard, screen-reader, privacy, reconnect, rejection, and deterministic-settling validation.

## Open questions before freezing the structure

- Which additional reference views are still needed: application shell, room list, room creation, lobby, character creation, social panel, or match table?
- Should the footer dock persist during a match or collapse into match-specific controls?
- Is the first identity system complete portraits or layered sprites?
- Which room settings belong in Basic versus Advanced for the first release?
- Are teams meaningful beyond Competitive versus Co-op, or should the first release model only cooperative groups and individual competitors?
- Which social capability is essential to the first public multiplayer milestone: presence, invitations, room chat, private messages, or none?
- What original visual theme should replace the reference game's metallic arcade interface?
- Which parts of the plan become reusable across future Jamangi card games, and which remain Server Repair TCG-specific?
