# Gameplay UI defense — Night-Shift Operations Desk

Status: **approved visual direction for TASK-010, rules-aligned and non-authoritative**

This document explains how the approved reference board, Repair Tickets, cards, and motion language can look emotionally rewarding while faithfully expressing `first-version-v1`. It is a design defense, not a replacement for schemas, player-safe projections, content, or the engine.

## 1. Design thesis

The game should feel like opening a premium incident folio during a late shift: cool server light beyond the desk, warm light on the work, tactile paper and card stock, and a sense that each action leaves a trace.

The aesthetic goal is not “a dashboard with cards.” It is a **beautiful troubleshooting table** where technical reasoning has collectible-game ceremony:

- a Repair Ticket is the dramatic center of attention;
- card illustrations make even a still hand pleasurable to scan;
- Evidence accumulates like clipped notes and diagnostic readouts;
- machine-state changes feel physical and consequential;
- the Worklog gives every accepted action a durable place in history; and
- the board uses the width of a modern screen rather than stacking every region into one narrow page.

The tone is competent and focused, not militaristic. Players are technicians resolving faults, not armies reducing health. The interface therefore avoids health bars, attack language, target reticles associated with weapons, and fantasy rarity spectacle.

## 2. The object-language decision

The strongest way to keep the board legible is to give each rules-level object a different physical metaphor.

| Object | Visual metaphor | Why it helps |
| --- | --- | --- |
| Repair Ticket | Landscape vellum work order clipped to a graphite backplate | Makes the jointly actionable problem the visual center and prevents Tickets from being mistaken for cards in a deck. |
| Playable Card | Portrait matte card with large editorial illustration, family ribbon, cost medallion, and rules block | Preserves collectible pleasure while keeping cost, function, and target expectations scannable in hand. |
| Evidence | Translucent note, printout, or log slip with visibility mark and citation control | Communicates knowledge without implying machine change or hidden truth. |
| Worklog event | Numbered, time-ordered dark ledger row | Supports immutable chronology and in-place enrichment instead of a rearrangeable activity feed. |
| Machine State | Compact before/after equipment strip attached to the Ticket | Keeps physical system change separate from Knowledge State and from proof that the diagnosis is correct. |
| Basic action | Labeled tool on a utility rail, never a collectible card | Expresses that Hypothesis, Isolation, Documentation, Search, Refresh, and Pass are system actions and are not draw-dependent. |
| Deck/discard | Narrow physical stacks with explicit counts | Makes public quantities readable without implying that deck order is visible. |

This categorical separation carries more information than color alone and remains understandable in grayscale or reduced visual modes.

## 3. Desktop board composition

The wide layout uses a 12-column composition rather than a centered vertical strip:

- **Top status rail, full width:** collaboration/mode context when applicable, active seat/turn, two Action pips, Search and Refresh counts, Service Points, connection/local-authority status, and overflow controls.
- **Ticket queue, roughly 2–3 columns:** compact landscape work-order tabs with title, public status, difficulty, and contribution summary. Selection changes focus; it never claims the Ticket.
- **Selected Ticket, roughly 6–7 columns:** the largest and brightest surface. It owns illustration, symptoms, public candidates, authorized Hypothesis markers, accepted Isolation, machine state, Verify state, and closure readiness.
- **Worklog, roughly 3 columns:** a persistent chronological ledger on large screens. It may collapse to a drawer at intermediate widths, but its unread indicator and latest event remain visible.
- **Hand and action shelf, full width:** illustrated cards overlap modestly to preserve width. Hover, focus, or selection lifts a card; inspection expands it without forcing the player to read tiny hand text.

The center Ticket receives the strongest warm-paper contrast. The hand receives the most saturated family color. The surrounding chrome stays dark and quiet. This creates an intentional attention order: **problem → available affordances → history/resources**.

### Solo and multiplayer relationship

The solo reference has no opponent lane because `solo-pages-v1` proposes one human in cooperative training with no computer opponent. The full client can reuse the same center-table grammar:

- cooperative teammates appear as compact seat/hand-count/resource presence around the shared table;
- competitive players expose only public counts and public state;
- the current player's private hand and Notebook remain closest to the bottom edge;
- no symmetrical “enemy battlefield” is required because Tickets are shared and jointly actionable; and
- spectator views remove private hand/Notebook controls and retain only `PUBLIC_MATCH` state.

The composition scales by changing peripheral presence, not by inventing a second gameplay model.

## 4. Repair Ticket design

### 4.1 Shape and emotional role

A Ticket is a landscape work order, wider than it is tall. It sits on a metal backplate with clipped or tabbed layers so it feels substantial enough to carry a multi-step investigation. A cinematic server illustration occupies the header band and can expand when the Ticket is inspected.

The paper metaphor is intentionally warmer and more human than the surrounding server-room chrome. It says: “this is the case people are working,” while the machine imagery preserves technical drama.

### 4.2 Information anatomy

The expanded Ticket should provide, in this order:

1. stable display title, public code, difficulty, category, and current public status;
2. visible symptoms and admissible scenario context;
3. public candidate Faults and authorized Hypothesis markers;
4. Evidence/Knowledge State available to the viewer, with visibility marks;
5. accepted Isolation and cited Evidence when one exists;
6. machine-state projection and Repair history;
7. Verify requirements and every current or failed attempt the viewer may see;
8. Documentation/closure completeness; and
9. contribution and closure attribution summaries.

The queue-sized Ticket shows only what supports selection: title, difficulty, public status, a small illustration crop, and a compact progress summary. It must not encode a hidden answer in color, image crop, tab shape, animation delay, or number of placeholders.

### 4.3 Status tabs are not lifecycle lanes

Edge tabs can communicate current public state—`Diagnosis`, `Repair ready`, `Awaiting Verify`, `Returned`, `Ready to close`, `Closed`—but they are labels on one Ticket, not seven board departments.

Diagnosis uses a looping/oscillating mark rather than a forward arrow. Failed Verify animates back to the Diagnosis treatment while leaving the machine-state strip, Evidence, prior Repair, failed result, and Worklog intact. This directly expresses Frozen §1 and §13.

### 4.4 Candidate tray and Isolation

Candidate chips are public scaffolding, not answer indicators. They use equal visual weight until player-visible Evidence supports or rules them out. Any support/rule-out decoration must be derived from the viewing Player's authorized Evidence.

Commit Isolation is a deliberate targeting mode:

1. select one public candidate;
2. select/cite eligible visible Evidence events;
3. review the one-Action cost and target summary; and
4. submit an identifier-based intent.

The interface never previews truth or hidden clauses. Rejection produces the same readable `ISOLATION_NOT_SUPPORTED` treatment whether the candidate was wrong or citations were insufficient. It spends the Action only when that is the authoritative result.

## 5. Card design

### 5.1 Card face hierarchy

At full/detail scale, a playable card uses:

1. function word and icon (`TEST`, `COMMAND`, `REPAIR`, `VERIFY`, or another approved card type);
2. 0/1/2 Action-cost medallion;
3. large illustration, approximately 42–48% of the face;
4. title;
5. concise rules text;
6. optional educational text in inspection only;
7. technical-reference affordance in inspection only; and
8. stable-ID/version microline or developer detail outside normal reading priority.

In the hand, the ribbon, cost, illustration, and title must remain visible under overlap. Full rules text may truncate because selection/inspection provides an accessible reading surface. This follows the useful pattern in the supplied references without copying their styling.

### 5.2 Family grammar

The specimen proposes the following presentation mapping:

| Family | Primary accent | Shape/icon cue | Emotional reading |
| --- | --- | --- | --- |
| Test | Cyan | magnifier or waveform; rounded notch | observation and evidence |
| Command | Violet | terminal prompt; squared notch | exact software affordance |
| Repair | Amber | wrench; chamfered corner | consequential machine change |
| Verify | Emerald | validation pulse/shield; split footer | measured acceptance check |

The mapping is redundant: word, icon, border geometry, and accent all communicate family. Color is never the only carrier. Other approved card types can extend the grammar deliberately rather than borrowing a random hue.

The palette must not imply scoring. Tests and Verify do not earn Service Points merely because they appear “successful.” Score settlement is shown only when the authoritative closure transaction settles eligible Isolation and necessary-Repair slots.

### 5.3 Illustration strategy

Illustrations should be technically grounded, cinematic close studies rather than literal screenshots of every command:

- Test: inspection light, probes, logs, cable tracing, drive bays, status patterns;
- Command: terminal glow, structured console output, an operator's viewpoint without readable secrets;
- Repair: hands/tools/components at the moment of physical change;
- Verify: stable readouts, repeated detection, healthy arrays, controlled confirmation.

Illustration may create anticipation but cannot reveal a Ticket's hidden Fault or predict an authored outcome. A loose-cable illustration on a generic inspection card must not appear only when the hidden answer is a cable fault.

TASK-010's proposed art resolver remains the correct architecture: stable `asset_id`, card-specific art first, explicit primary-domain inheritance second, accessible alt text, and intentional category placeholders. These references are not canonical TASK-011 card art.

### 5.4 Selection and inspection

Selection lifts the card 8–16 visual pixels, increases edge light, and highlights only engine-projected legal targets. It does not submit. The same state is available through click/tap and keyboard focus.

Inspection opens a large panel with art, complete rules text, educational text, and technical references. On desktop it may float beside the board or use a centered dialog; on mobile it is a bottom sheet. Opening inspection must not pause authoritative clocks in multiplayer, reveal secret legality, or destroy current target selection without an explicit cancel.

### 5.5 Card movement and zones

Accepted one-shot play visually travels Hand → selected Ticket/resolution focus → Discard. Persistent cards, when approved content uses them, move to a visibly separate installed/Bench placement. The animation follows the authoritative event; it does not decide disposition.

Search and Refresh are utilities on the action rail. Search makes the selected named card arrive from the remaining deck and then represents the shuffle. Refresh visually combines discard and draw deck, never the hand or installed zone. Both show their one-Action and token costs before submission.

## 6. Evidence, Worklog, and machine state

These three surfaces should never collapse into one generic activity list.

### Evidence / Notebook

- Shows the detailed result the viewer is authorized to know.
- Marks `PRIVATE_PLAYER`, `TEAM`, or `PUBLIC_MATCH` with word + icon; `SERVER_ONLY` content is absent, not shown as a suggestive locked placeholder.
- Supports citation selection for Isolation and Documentation.
- In cooperative solo, team-visible Evidence may use the same visual layer as the player's Notebook while retaining its actual visibility label in data and accessibility text.

### Worklog

- Uses authoritative event sequence as its primary order.
- Creates a public placeholder for each accepted paid action.
- Enriches the original row in place when documented.
- Adds a linked publication event without moving the original action.
- Shows rejected intents outside the accepted chronology or in a clearly separate feedback surface when the engine creates no Worklog event.

### Machine state

- Shows authorized before/after facts caused by Repair.
- Never uses a “solved” check merely because state changed.
- Retains changes across failed Verify and visually indicates which passes became stale.
- Is attached to the Ticket rather than to the Player who most recently acted.

## 7. Action and closure choreography

The board should use semantic motion as explanation:

| Event | Full-motion treatment | Reduced-motion equivalent |
| --- | --- | --- |
| Start-turn draw | card emerges from deck with slight rotation and spring settle | instant insertion plus focus/status announcement |
| Card selected | small lift and legal-target edge emphasis | persistent outline and target labels |
| Accepted play | card travels to Ticket, Ticket pulses, result appears, card resolves to zone | ordered state updates and announcement |
| Rejected intent | short snapback with coral edge, then reason | immediate reason and stable error outline |
| Accepted Isolation | cited Evidence lines converge into public Isolation stamp | Isolation block appears with citation links |
| Repair | machine-state strip changes with warm mechanical sweep | before/after text updates and focus moves |
| Failed Verify | emerald attempt resolves to coral, Diagnosis tab returns, history remains | status changes and failure announcement without content removal |
| Document Live | note links to its original Worklog row and that row gains published detail | in-place enrichment plus linked publication label |
| Closure | structured bundle locks, eligible score slots settle, Ticket archives, utilities update | atomic ordered summary and result announcement |

Animations can be coordinated with Anime.js if TASK-010 A5 is approved, but CSS/WAAPI remains appropriate for simple opacity and transform. The semantic coordinator consumes engine events and newer projections cancel or settle older motion. No authoritative state waits for an animation callback.

## 8. Responsive behavior

### Large desktop (roughly 1280px and above)

Ticket queue, selected Ticket, and Worklog can coexist. Hand uses the full lower width. Large art is visible without scrolling the whole page.

### Tablet and compact desktop

Ticket queue becomes a horizontal strip. Worklog becomes a resizable or modal side sheet with a persistent latest-event summary. The selected Ticket remains central; the hand keeps illustration/title/cost visible.

### Narrow mobile

The mobile reference is a recomposition:

- compact Ticket carousel first;
- selected Ticket summary second;
- Evidence/Worklog segmented sheet third;
- sticky selected-card action tray above the hand;
- fanned/scrollable hand at the bottom; and
- labeled counters for Search, Refresh, deck, and discard.

Only one dense detail surface is open at a time, but no information becomes unreachable. Candidate selection, Evidence citation, inspection, play, and Pass all use 44px-class controls. Drag is optional; tap-then-target and keyboard/switch access remain complete.

## 9. Accessibility and information integrity

Beauty is constrained by the following non-negotiable behaviors:

- no color, art, hover, position, or animation is the sole carrier of state;
- card family always has text and icon in addition to color;
- focus is visible against both parchment and graphite surfaces;
- dialogs/sheets contain and restore focus;
- live announcements cover draw, Action changes, Evidence, rejection, failed Verify, closure, score settlement, and results;
- reduced motion removes travel, springs, parallax, and stagger while preserving state and reading order;
- alt text describes useful card/Ticket illustration content without inventing hidden conclusions;
- decorative desk texture and ambient rack imagery have empty alt text;
- zoom and text scaling must not clip rules or require horizontal page scrolling; and
- every legal drag path has a complete tap/click and keyboard alternative.

## 10. Frozen-rule defense matrix

| Contract | UI decision | Defense |
| --- | --- | --- |
| Frozen §1: Diagnosis is an iterative loop, not seven departments | One selected Ticket with state tabs; no lifecycle lanes | Avoids falsely teaching a one-way departmental conveyor. |
| Frozen §§2, 15: shared finite queue and terminal evaluation | Visible Ticket queue and atomic closure/result choreography | Makes queue state legible without evaluating termination in the UI. |
| Frozen §3: points settle only for eligible Isolation/necessary Repair slots at closure | No health bar and no points on Test/Verify/Document; settlement appears only after closure result | Prevents the visual system from teaching incorrect score timing. |
| Frozen §§7–8: authority, hidden truth, four visibility levels | Player-safe Evidence surface; no secret placeholders; UI sends identifier-based intents | Keeps presentation downstream of authority and avoids inference leaks. |
| Frozen §8: immutable Worklog with in-place enrichment | Persistent numbered ledger; documentation annotates an existing row | Expresses chronology instead of turning publication into reordered history. |
| Frozen §9: 30 cards, opening five, draw, two Actions, 0/1/2 cost | Two prominent Action pips; cost medallions limited to 0/1/2; explicit deck/hand/discard counts | Keeps the turn budget readable without adding a hand maximum or exhaustion rule. |
| Frozen §10: Search and Refresh are resources/basic actions | Utility rail with token + Action costs, not cards | Avoids implying draw-dependent permission or wrong zone movement. |
| Frozen §11: Hypothesis is free and non-revealing | Notebook marker tool with no truth-response styling | Encourages iteration without treating a guess as confirmation. |
| Frozen §12: Commit Isolation costs one Action and returns generic rejection | Candidate + Evidence citation mode and uniform failure response | Does not leak whether truth or citation sufficiency failed. |
| Frozen §12: Repair requires accepted Isolation and changes machine state | Repair targets appear only from projected legality; machine strip changes separately | Separates legal gateway, physical change, and later proof. |
| Frozen §13: failed Verify returns to Diagnosis and preserves history | Status tab returns while Worklog/Evidence/Repair remain; stale passes marked | Makes the loop emotionally clear without erasing learning. |
| Frozen §14: incremental Documentation and zero-Action closure bundle | Document tool links to existing event; closure is a separate structured sheet | Avoids representing closure as a reward card or end-only Documentation. |
| Frozen §15: closure transaction is atomic and ends turn | One ordered settlement sequence with no mid-transaction score celebration | Prevents partial UI state from implying an intermediate terminal outcome. |
| Frozen §§18, 21: Builder and interface boundaries | Ticket imagery is presentation; no image or layout determines content/legality | Keeps generated content and hidden causal truth in authoritative contracts. |
| TASK-010 solo boundary | No opponent/computer selector, timers, Room, chat, rating, or cloud claims in solo reference | Keeps the Pages client honest about local training scope. |

## 11. Explicit no-go list

Do not implement any of the following from the reference pixels:

- card cost above 2;
- Service Point rewards on Test, Verify, Documentation, or closure itself;
- seven permanent lifecycle lanes;
- a health/comfort bar or combat vocabulary;
- Ticket ownership inferred from selection;
- a hidden-answer glow, art swap, placeholder count, or timing tell;
- repair-before-Isolation affordances that are not projected legal actions;
- Worklog reordering after Documentation;
- removal of failed Verify, Evidence, Repair history, or machine changes;
- drag-only play;
- a card-like visual for Search, Refresh, Isolation, Documentation, or Pass;
- copying generated microcopy instead of rendering pinned Card/Ticket content; or
- treating any generated image as a pixel-perfect acceptance screenshot.

## 12. Implementation handoff

Begin implementation with semantic primitives, not page screenshots:

1. define theme tokens for surface, paper, family accents, failure, focus, and visibility;
2. build Ticket, Card, EvidenceRow, WorklogRow, MachineStateStrip, ResourceCounter, and BasicActionTool as independent responsive components;
3. render every component from player-safe fixture data and explicit legal-action projections;
4. implement tap/click/keyboard selection and inspection before optional drag;
5. add the semantic animation coordinator only after stable-state behavior works;
6. test failed Verify, generic Isolation rejection, Documentation enrichment, and atomic closure as first-class visual states; and
7. validate at desktop, tablet, and narrow mobile in normal and reduced-motion modes.

The goal is not to reproduce a single still. It is to preserve the still's emotional promise—texture, illustration, hierarchy, and density—through every legal and adverse gameplay state.
