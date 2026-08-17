# UI Plan — Working TODO

Status: **provisional and intentionally mutable**

This document preserves the current UI planning discussion while additional visual references are gathered. It is not yet a frozen architecture, requirements contract, or implementation task. Revise it freely until the product structure and visual direction are approved.

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
- A player who concedes becomes a spectator unless they leave the room.
- The lobby must remain comprehensible without animation and under reduced-motion preferences.

## Character strategy notes

- Begin cheaper than a 3D character system.
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

