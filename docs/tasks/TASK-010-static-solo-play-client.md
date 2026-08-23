# TASK-010: Add Library and local Solo Play to the static Viewer

## Status

**Ready — A1 through A7 approved 2026-08-23.** This task is a scoped static-client enhancement built on completed TASK-009. Implementation may begin within the boundaries below.

## Objective

Extend the GitHub Pages application rooted at `viewer/` into two stable top-level areas:

- **Library** — the current Domain Library, preserving all existing behavior; and
- **Play** — an original Server Repair application shell with Home, Decks, Profile, Settings, and a complete local solo game driven by the TASK-009 engine and Ticket Builder.

The Play experience remains dependency-light vanilla HTML, CSS, and ES modules. It stores versioned decks, profile choices, settings, and lifetime statistics locally; supports validated export/import; uses one active legal 30-card deck; and completes a finite single-human game entirely in the browser.

This is not the production multiplayer client. The browser contains the local authority, hidden Ticket truth, and saved profile. A user with developer tools can inspect or modify those values. TASK-010 makes no anti-cheat, account-integrity, competitive-security, or server-persistence claim.

## Why this is a profile, not another Frozen Rules ledger

Create a versioned `solo-pages-v1` **implementation profile** that references `first-version-v1`; do not copy and fork the complete Frozen Rules ledger.

The profile must identify:

- inherited gameplay behavior;
- fixed solo configuration and allowed user settings;
- browser-only authority and persistence limitations;
- server/Room/timer/reconnect/multiplayer features that do not apply; and
- presentation or product choices that are not gameplay rules.

The profile cannot silently override a frozen gameplay rule. If implementation needs a real gameplay difference, record pressure in `UNFROZEN_RULES.md` and stop only the affected work. Reduced security is an environment limitation, not permission to change deck, turn, Evidence, Isolation, Repair, Verify, Documentation, closure, scoring, or Ticket Builder behavior.

## Approved decisions

The user approved A1 through A7 together on 2026-08-23. They are implementation requirements, not open questions.

### A1 — Solo match profile

Approved `solo-pages-v1` as:

- one human Player in cooperative training mode, with no computer opponent;
- a finite queue with `queue_minimum = 0` and score termination disabled;
- user-selectable `starting_ticket_count` from 1 through 10;
- the ordinary 30-card deck, opening five, start-turn draw, two Actions, Search/Refresh, troubleshooting lifecycle, causal scoring, closure, and result statistics from `first-version-v1`;
- no Room, spectator, chat, matchmaking, disconnect grace, Player clock, turn timer, concession, account reward, or rating behavior; and
- `allow_duplicate_causal_fingerprints = true` for this training profile so the current three Ticket templates can satisfy a request of up to 10 Tickets. The UI must disclose that a larger queue may repeat scenario structures.

### A2 — Local authority and active-match persistence

Approved a dedicated module Web Worker as the in-browser local authority. The DOM sends identifier-based intents and receives player-safe projections/events; it never mutates Match State directly. This is architectural isolation and responsiveness, not a security boundary.

Recommended scope: TASK-010 does **not** resume an in-progress match after reload or browser close. Navigating away from an active game requires confirmation, and export excludes active Match State. A future task may define the deliberate versioned save serializer required for safe resume.

### A3 — Local data and import behavior

Approved versioned `localStorage` for profile, decks, active deck ID, settings, processed Match-start/result IDs, and aggregate statistics.

- Export produces one human-downloadable JSON backup containing only those local application records and version metadata.
- Import validates and previews the file, then replaces local data only after explicit confirmation. It does not silently merge.
- Before replacement, offer the current data as a download.
- Corrupt, oversized, incompatible, prototype-polluting, unknown-field, invalid-deck, or unknown-ID input is rejected without changing current data.
- Imported statistics are user-controlled and therefore non-competitive. The application labels them local.

### A4 — Profile Level and statistics

Approved `level = max(0, floor(lifetime_service_points_gained / 10))`, with no stored Level field and no initial maximum. Thus 5 Service Points gives Level 0 and 100 gives Level 10; a negative lifetime total never produces a negative Level.

Lifetime statistics are updated exactly once per completed Match ID from the authoritative local result/event ledger. The stored/displayable set includes:

- matches started/completed and solo wins/losses/stalemates/invalid or capped results;
- Tickets closed;
- starting, final, and gained Service Points;
- Tests, accepted/rejected Isolations, Repairs, Verify attempts/passes/failures/inconclusive results, Documentation, and assists;
- failed Verify, redundant/superseded actions, turns, and authoritative elapsed time; and
- Search and Refresh uses as useful local-only operational statistics.

Disconnect and concession statistics are omitted from the solo display because the profile cannot produce them.

### A5 — Anime.js dependency and interaction rule

Approved one exact pinned Anime.js v4 release as a vendored ESM dependency, with its license, source/version record, and integrity checksum committed. Do not load executable code from a runtime CDN.

Use native CSS/WAAPI or Anime.js `waapi.animate()` for simple transform/opacity motion; import the JavaScript timeline, spring, staggering, or draggable modules only where they materially improve the interaction. Official documentation describes direct ESM download, granular modules, vanilla-JavaScript use, a lighter WAAPI API, and a separate draggable module:

- <https://animejs.com/documentation/getting-started/installation/>
- <https://animejs.com/documentation/getting-started/module-imports/>
- <https://animejs.com/documentation/web-animation-api/when-to-use-waapi/>
- <https://animejs.com/documentation/draggable/>

Dragging is an optional input method. Every drag interaction requires a complete click/tap and keyboard alternative. A drop submits an ordinary engine intent and cannot decide legality, cost, target, or result.

### A6 — Illustration architecture and TASK-011 split

Approved TASK-010 to build the resolver, responsive card-art slots, accessible alt-text behavior, loading/error fallbacks, and intentional category-specific placeholder visuals. Do not create the full card illustration set in this task.

Reserve TASK-011 for canonical card illustrations and their validation. Canonical assets should live outside UI component code under stable `asset_id` control and be staged into the Viewer deployment so a later full client can reuse them. Published art must never be addressed by card title or array position.

### A7 — Browser acceptance dependency

Approved a dev-only Playwright dependency and pinned browser acceptance workflow. It has no production runtime cost. Node tests remain responsible for pure state, storage, routing, schema, and deterministic behavior; Playwright verifies actual navigation, dialogs, local storage, import/export, keyboard operation, responsive layout, reduced motion, drag fallback, gameplay, and GitHub Pages asset loading.

## Visual-reference boundary and quality target

The earlier user-supplied Honeyfoot screenshots are layout and interaction references only. Do not copy Honeyfoot branding, prose, art, currency, Shop, Tutorial, matchmaking, ownership economy, XP system, exact colors, or proprietary visual identity.

Borrow only these useful shell qualities:

- a polished framed shell with persistent navigation;
- a strong two-column Home composition with an illustration/visual anchor and clear play controls;
- a deck gallery with a selected-deck inspector;
- a dense but legible card grid with a persistent edit summary;
- a large accessible card-inspection dialog; and
- a profile split between identity/summary and editable cosmetic choices.

The committed Night-Shift references are the direct gameplay-surface quality set:

- `docs/ui-plan/ui-reference_images/ui-minimum.png` — the implementation floor, captured from the supplied standalone vanilla HTML/CSS/JavaScript proof of concept;
- `docs/ui-plan/ui-reference_images/ui-minimum-demo.html` — the exact standalone source behind that floor, useful for studying lightweight layering, responsive structure, hover tilt, and native Web Animations usage;
- `docs/ui-plan/ui-reference_images/01-night-shift-board-desktop.png` — the desktop composition and material target;
- `docs/ui-plan/ui-reference_images/02-card-ticket-specimens.png` — the Card/Ticket scale, family grammar, texture, and detail target;
- `docs/ui-plan/ui-reference_images/03-night-shift-board-mobile.png` — the mobile recomposition and touch hierarchy target; and
- `docs/ui-plan/ui-defense.md` — the rules, information-design, responsive, interaction, and accessibility defense behind the images.

All six are references, not executable requirements, authoritative fixtures, or sources of rules/content. The demo's hard-coded text, costs, IDs, candidate states, counters, action behavior, and toast are illustrative and must never be copied into application data or rules. The engine's player-safe projections and pinned content remain authoritative.

`ui-minimum.png` establishes the lowest acceptable material and atmosphere bar: layered panels, tactile Ticket/Card separation, restrained pseudo-texture, directional lighting, shadow, glow, slight perspective, clear family color, and polished transitions. A flat recoloring of generic rectangles does not meet this task. The three advanced images are the intended target: implementation must make a serious, recognizable attempt at their composition, density, material depth, card presence, and desktop/mobile hierarchy even while TASK-011 art is represented by intentional placeholders.

Create an original Server Repair visual system coherent with the existing dark technical Library. Home, Decks, Profile, Settings, and results may be calmer than the game board, but must share its typography, graphite/navy surfaces, vellum accents, family colors, lighting logic, depth scale, controls, and motion language. Appearance has priority, while accessibility, responsiveness, and bounded resource use remain non-negotiable.

## Current implementation facts and blockers

- `viewer/` is the only GitHub Pages artifact currently uploaded. Root `src/` and `content/gameplay-v1/` are not browser-visible.
- `src/engine/determinism.mjs` and `src/builder/canonical.mjs` import `node:crypto`; the engine and Builder are not currently browser-loadable.
- The stable gameplay pack contains 11 Card Definitions, two 30-card deck fixtures, and three Ticket templates. Its Cards declare domain illustration inheritance and stable asset IDs, but no published image files or browser resolver currently satisfy those references.
- The Viewer currently has one compact page module with no router, application state boundary, local persistence, or browser game adapter.
- TASK-009 simulation modules use Node filesystem APIs and must not be shipped to the browser.

These are implementation work, not reasons to weaken the engine or duplicate it in handwritten client logic.

## Required reading

Read before changing code:

- `AGENTS.md`, the root `README.md`, this task, and `docs/tasks/INDEX.md`;
- `docs/design/decisions/DECISION_INDEX.md`, complete `FROZEN_RULES.md`, and `UNFROZEN_RULES.md`, with implementation focus on Frozen §§1–3, 7–15, 18, 20, and 21;
- the TASK-009 objective, authority boundary, completion record, and changed-file inventory;
- `docs/schema-notes/SERVER_AUTHORITY.md`, `RUNTIME_SCHEMAS.md`, and the approved Card contract analysis;
- domain Card/Ticket/Builder schemas and runtime Action Request/Result, Card Instance, Match, Player, Ticket, Turn, and projection schemas;
- every file under `src/engine/` and `src/builder/`, but only the public boundaries of `src/simulation/` needed to avoid shipping Node-only code;
- `content/gameplay-v1/{card-catalog,decks,domain-snapshot,ticket-templates}.json`;
- `viewer/{README.md,index.html,styles.css}`, every current `viewer/js/*.js` module, both Viewer workflows, and Viewer tests;
- `docs/ui-plan/README.md`, complete `docs/ui-plan/ui-defense.md`, complete `docs/ui-plan/ui-reference_images/README.md`, complete `docs/ui-plan/ui-reference_images/ui-minimum-demo.html`, and visually inspect all four committed PNG references at full resolution;
- the application-shell and profile sections of `docs/ui-plan/TODO.md` and `docs/ui-plan/wireframes/INDEX.md`, using the newer Night-Shift references for the match surface; and
- only the board surface, Player zones, card grammar, and deterministic gameplay-example sections of the candidate-flow package. Candidate fixtures remain non-authoritative.

Do not load unrelated story, case-study, social, Room, Store, campaign, or full-journey documents.

## Required artifacts

### 1. Derived profile and client schemas

Create:

- `docs/design/SOLO_PAGES_PROFILE.md` for `solo-pages-v1`;
- versioned schemas/examples for local profile, deck collection, settings, aggregate statistics, and export bundle; and
- pure validation/migration modules that reject unsupported future versions instead of guessing.

Profile/deck records reference stable IDs and versions. They never copy complete Card Definitions, Ticket truth, or rules text into local storage.

### 2. Browser packaging and portability

Preserve `viewer/` as the deployment root.

- Refactor deterministic hashing/random helpers into a browser-compatible shared implementation without changing TASK-009 Ticket snapshots, replay digests, outcomes, scores, or turn counts.
- Keep engine and Builder source canonical; do not maintain a manually edited second implementation inside `viewer/`.
- Add a deterministic staging script that prepares only browser-safe engine/Builder modules, gameplay JSON, approved static assets, and vendored Anime.js modules beneath a generated Viewer subtree.
- Never stage `src/simulation/`, Node filesystem tools, automated-game exception data, tests, server notes, or unrelated repository content.
- Update Pages workflow path triggers and build steps so changes to canonical engine, Builder, gameplay pack, vendor lock, assets, or staging script deploy the Play client.
- Verify staged-file hashes and fail when generated assets are stale, missing, or unexpected.

Local development documentation must give one command to prepare the Viewer artifact before serving `viewer/` over HTTP.

### 3. Routing and outer Library/Play switch

Use GitHub Pages-safe hash routes so refresh and browser Back/Forward do not require server rewrites:

```text
#/library
#/play/home
#/play/decks
#/play/decks/<deck_id>/edit
#/play/profile
#/play/game
```

- Library and Play are the persistent top-level tabs.
- Selecting the already-active top-level tab is a no-op: no state reset, scroll jump, refetch, dialog closure, animation replay, or history entry.
- Returning to Library restores its tab, search, sort, category, dialog selection where practical, and scroll position.
- Play owns a nested app shell with Home, Decks, and Profile. Settings is reached from a clearly labeled top-right button/menu rather than another primary tab.
- Navigation uses semantic links/buttons, visible focus, `aria-current`, and reliable deep links.

Refactor the current Library into its own module without changing its search, sort, category, record count, tabs, details, manifest loading, or failure behavior.

### 4. Local data service and Settings

Provide one storage service; UI modules must not call `localStorage` ad hoc.

The service must implement:

- namespaced, versioned records and deterministic serialization;
- schema validation on every read/import;
- migration tests from every supported prior local version;
- atomic write-or-preserve-current behavior;
- quota/corruption recovery and a reset path;
- Match-start/result-ID idempotency so neither starting nor completing a Match increments statistics twice;
- Export, Import, and Reset Local Data controls; and
- import preview showing profile name/icon, deck count, active deck, statistics summary, versions, warnings, and whether replacement is allowed.

Never inject imported strings as HTML. Apply input length limits and safe deck/profile names. Local data contains no password, token, email address, or other sensitive account credential.

### 5. Decks

All published cards in the pinned catalog are available; TASK-010 adds no collection ownership or Shop economy.

#### Your Decks

- First run creates an editable local copy of the stable Storage Foundation deck and makes it active.
- **Create Deck** makes a uniquely identified empty draft and enters Edit Deck.
- Selecting a deck updates the inspector without editing it.
- **Edit Deck** opens the selected deck's draft.
- **Make Active** is enabled only for a saved legal deck.
- **Delete Deck** requires confirmation. If the active deck is deleted, select another saved legal deck deterministically or leave no active deck and disable Play.
- Show name, card count, validity, active state, compact composition, and invalid reasons.

#### Edit Deck

- Edit a draft copy so cancel/back cannot partially mutate the saved deck.
- Save name plus card composition only after validation.
- A legal deck has exactly 30 cards and at most three copies of each Card Definition ID.
- Provide search and useful filters for Card type/category/archetype and Action cost.
- Each Card tile shows title, category/type, cost, resolved illustration or placeholder, concise rules description, quantity, and accessible increment/decrement controls.
- Inspect opens a large modal with larger art, title, cost, categorization, detailed rules text, educational text where available, and technical references.
- Prevent adding a fourth copy. Allow removing to zero. Show `n / 30` and live validity reasons.
- Warn before leaving an unsaved draft. Saving a previously active deck preserves active status only if it remains legal.

### 6. Profile

Provide:

- a bounded display name;
- a small selection of bundled, labeled SVG profile icons with no gameplay effect;
- Save Profile with validation and unsaved-change handling;
- derived Level and lifetime Service Points;
- active deck summary; and
- the approved lifetime statistic set, grouped into Matches, Troubleshooting, Contributions, and Efficiency rather than one undifferentiated number wall.

Profile icons are cosmetic and are not Technician cards, Qualifications, character abilities, or a character creator. TASK-010 does not add a portrait generator.

### 7. Home

Use the Play shell's persistent Home/Decks/Profile navigation and an original two-column composition:

- left: an intentional responsive visual anchor that works with placeholder art and has correct decorative/alt behavior;
- right: derived Level in a hexagonal or comparably strong badge, active deck, solo profile summary, starting Ticket selector 1–10, scenario-repeat disclosure for larger queues, and a dominant **Play** button; and
- lower shortcuts to Decks and Profile that navigate to the same routes as their shell counterparts.

Do not add Shop, currency, account XP, sign-in, matchmaking, or a computer-opponent selector. Play is disabled with a clear repair path when there is no legal active deck or required content failed to load.

### 8. Visual system and gameplay-board fidelity

Build the Night-Shift Operations Desk as a reusable presentation system, not one oversized screenshot or a set of isolated page mockups.

- Define documented CSS tokens for graphite/navy structure, vellum/ink surfaces, cyan Test, violet Command, amber Repair, emerald Verify, semantic states, typography, spacing, radii, depth, glow, and motion.
- Prefer semantic HTML, layered CSS, pseudo-elements, gradients, restrained repeat textures, small reusable SVG details, and transform-based depth. Do not bake interface text or state into raster images.
- Preserve categorical silhouette as well as color: landscape clipped work-order Tickets, portrait playable Cards, note-like Evidence, chronological Worklog records, and tool-like basic actions.
- Build art slots at the proportions shown in the specimen/board references. Until TASK-011, intentional category-aware placeholders must contribute composition, lighting, and focal hierarchy rather than appearing as broken, blank, or generic gray boxes.
- On wide desktop, prioritize the selected Ticket, visible queue, Worklog, hand, resources, deck/discard, and basic-action rail with the density and hierarchy of `01-night-shift-board-desktop.png`.
- On narrow mobile, genuinely recompose into the Ticket strip, selected Ticket, Evidence/Worklog switch, touch-sized citable rows, hand/selection focus, sticky primary controls, and labeled resource counters demonstrated by `03-night-shift-board-mobile.png`. Do not merely shrink or horizontally clip the desktop grid.
- Use layering, lighting, shadow, glow, and modest perspective to at least match `ui-minimum.png`; aim for the tactile depth and controlled glamor of the advanced references without sacrificing legibility.
- Card hover/selection tilt, parallax, and lighting response must be subtle, bounded, input-aware, cancellable, and absent for reduced motion or where coarse-pointer ergonomics make them harmful.
- Prevent decorative layers from intercepting input or entering the accessibility tree. Texture, family color, glow, depth, and illustration can reinforce information but cannot be its sole carrier.

Capability order is: HTML/CSS/SVG first, the approved Anime.js modules second. Do not add GSAP, PixiJS, Three.js, a canvas/WebGL renderer, or another visual runtime merely to imitate static lighting or texture. If the builder can demonstrate a required target that the approved stack cannot reasonably achieve, stop that optional enhancement and propose a narrowly scoped, pinned dependency amendment with bundle/performance/accessibility evidence; the rest of TASK-010 should continue.

### 9. Solo game and results

The game screen must use the same engine/Builder contracts as TASK-009:

- create `solo-pages-v1` Builder configuration from the selected Ticket count and a recorded seed;
- instantiate the active 30-card deck and fixed single Player identity;
- submit only engine-projected legal identifier-based intents through the local-authority Worker;
- display active Ticket queue/selection, public symptoms/candidates, accepted Isolation, machine-state summary, Evidence/Knowledge State, immutable Worklog, hand, deck/discard counts, Actions, Search/Refresh resources, Service Points, phase, and explicit legal targets;
- support Hypothesis, diagnostic Card plays, Commit Isolation with Evidence citations, Repair, Verify, Document Live, closure, Search, Refresh, and Pass without constructing unprojected secret actions;
- render rejected intents and failed Verify honestly without deleting history;
- confirm leaving an active match; and
- on terminal result, show reasons, score, Ticket and contribution statistics, turns/time, then apply the result to Profile exactly once.

The browser ships hidden truth because this is local-only. Keep it out of ordinary DOM/projections to preserve honest play, while documenting that developer tools can inspect it.

### 10. Motion and interaction feel

Create one semantic animation coordinator. Engine state/events decide what happened; animation only explains it.

Required motion patterns include:

- route/panel transitions that preserve focus and scroll expectations;
- deck/card-grid entrance with restrained staggering;
- card inspection open/close;
- start-turn draw from deck to hand with slight rotation and spring settle;
- card selection/lift and legal-target emphasis;
- accepted play to Ticket, Ticket pulse, Evidence/result appearance, then discard or approved persistent placement;
- rejected intent snapback plus readable reason;
- failed Verify return-to-Diagnosis treatment;
- Documentation linking/enrichment without reordering Worklog chronology;
- Ticket closure, resource/score settlement, result transition, and victory/loss/stalemate distinction; and
- safe cancellation/settling when navigating, reducing motion, resizing, or receiving a newer projection.

Do not block authoritative state on an animation callback. Lock only duplicate UI submission while an intent is resolving. Animations must never reveal hidden outcomes through timing, shape, or preemptive targeting cues.

Draggable Cards may be enabled only after click/keyboard targeting is complete. Drag uses pointer capture, legal drop-zone highlighting, escape/cancel, touch support, snapback, and engine validation after drop.

### 11. Accessibility, responsiveness, and performance

At minimum:

- full keyboard operation, including deck editing, card inspection, targeting, dialogs, Settings, import, and game actions;
- click/tap alternatives for every drag;
- focus containment/restoration for dialogs and focus movement after route/state changes;
- live announcements for draw, Action changes, evidence, rejection, failed Verify, closure, and results;
- `prefers-reduced-motion` plus an app setting whose reduced mode removes travel/springs/stagger while preserving immediate state and announcements;
- no color, art, hover, animation, or card position as the sole information carrier;
- responsive shell/deck/game layouts for narrow touch screens through large desktops;
- adequate contrast, readable type, 44px-class touch targets, and overflow behavior without horizontal page clipping;
- lazy image decoding/loading, responsive source sizes, and intentional placeholders without layout shift;
- transform/opacity motion where practical, bounded animation targets, no permanent per-frame loop, and no full-viewport animated filter/canvas layer;
- progressive enhancement when hover, fine pointer, backdrop filtering, masking, or advanced blend effects are unsupported; and
- graceful operation when Anime.js, one image, local storage, or optional dragging is unavailable.

Beauty remains a requirement. Performance work should protect interaction and loading quality rather than strip the visual hierarchy.

## Required implementation order

1. Implement the approved A1–A7 decisions in `solo-pages-v1` plus local-data schemas.
2. Make engine/Builder deterministic helpers browser-compatible while preserving every TASK-009 deterministic artifact.
3. Build and test Viewer staging/deployment before UI code depends on it.
4. Refactor Library and add hash routing plus the Library/Play switch.
5. Implement storage, migration, import/export/reset, and Settings.
6. Build the shared Night-Shift visual system, Play shell, Home, Decks, Profile, and compositionally useful placeholder art resolver.
7. Integrate the Worker authority, Builder, visually faithful desktop/mobile game table, results, and exactly-once statistics.
8. Add semantic animation, then optional dragging, reduced motion, and cancellation.
9. Complete responsive/accessibility/performance and reference-comparison passes plus automated browser acceptance.
10. Run the full repository, deterministic campaign, Viewer, staging, and browser verification matrix before completion.

## Allowed implementation paths

- `viewer/**`
- `src/engine/**`
- `src/builder/**`
- a narrowly scoped shared deterministic/browser-adapter directory under `src/**`
- `content/gameplay-v1/**` only for a browser/client manifest or approved asset references; do not mutate existing gameplay meaning
- `assets/**` for canonical reusable static art/icon contracts and placeholders
- `schemas/client/**`
- `examples/client/**`
- `tests/**`
- `tools/**`
- `.github/workflows/deploy-pages.yml`
- a new narrowly scoped browser-acceptance workflow
- exact dependency/lock/license files required by approved Anime.js and Playwright choices
- `docs/design/SOLO_PAGES_PROFILE.md`
- `docs/tasks/INDEX.md`
- `docs/tasks/TASK-010-static-solo-play-client.md`
- `README.md`
- `docs/design/decisions/UNFROZEN_RULES.md` only if genuine new rule pressure is discovered

Do not edit existing stable Card/Ticket definitions, Frozen Rules, completed task records, automated-game campaign artifacts, case studies, story, candidate flows, recommended models, or unrelated UI plans without a separately approved synchronization or migration.

## Prohibited work

- No backend, network Room, multiplayer transport, account authentication, cloud persistence, matchmaking, spectator mode, social system, chat, Shop, collection economy, currency, rating, campaign runtime, or character creator.
- No claim that local profile statistics, hidden truth, deck legality, or results are tamper-proof.
- No second rules engine in DOM handlers and no direct mutation of authoritative local Match/Card/Ticket state.
- No full Match State in export/import and no accidental exposure of hidden Ticket truth in ordinary UI/DOM.
- No duplicate Frozen Rules ledger or profile override of frozen gameplay.
- No silent relaxation of Builder guarantees other than the profile's explicitly approved duplicate-fingerprint permission.
- No runtime CDN dependency, unpinned executable dependency, or Node-only module in the Pages artifact.
- No animation callback, CSS class, drag position, card face, or client counter deciding game legality or progression.
- No drag-only action, motion-only result, inaccessible custom control, or unconfirmed destructive storage/deck operation.
- No broken-image layout while TASK-011 illustrations are absent.

## Required verification

Add tests before depending on each surface and report every command, exit code, pass/fail/skip total, browser matrix, changed file, dependency/version/license, generated artifact, and unresolved item.

At minimum verify:

- all existing 74+ Node tests continue to pass;
- TASK-009 campaign regeneration remains byte/digest/outcome/score/turn identical;
- browser and Node deterministic hashing/shuffle/Builder outputs match for fixed vectors;
- staging includes the complete allowlisted Play runtime and no denylisted server/simulation material;
- Pages workflow triggers on every canonical Play dependency and serves all deep hash routes/assets;
- Library baseline behavior and content validation remain unchanged;
- local schema validation, migrations, atomic replacement, corruption/quota handling, import preview/rejection, export round trip, and reset;
- legal/illegal deck boundaries, draft cancellation, active/deleted deck behavior, stable card-ID/version migration, and first-run starter deck;
- Level/stat derivation and exactly-once result processing;
- 1- and 10-Ticket solo games, duplicate disclosure, failed Verify, Search, Refresh, Documentation recovery, closure, result statistics, and Profile update;
- Worker/DOM intent boundary and absence of direct state mutation;
- keyboard-only and click-only complete game paths, with drag disabled;
- drag/touch path when enabled, invalid snapback, and duplicate-intent prevention;
- reduced motion, focus restoration, live announcements, contrast, responsive breakpoints, import dialog, card dialog, and active-match leave confirmation;
- the minimum material/lighting/depth floor and desktop/mobile composition targets from the four committed visual references;
- missing/corrupt content, missing art, storage unavailable/full, Worker failure, and animation-disabled fallbacks; and
- no horizontal page overflow or uncaught console/page errors in supported browser sizes.

Run and report at least:

```powershell
node viewer/scripts/build-manifest.mjs
node viewer/scripts/build-play-assets.mjs
node --check viewer/js/app.js
node --check viewer/js/data-loader.js
node --check viewer/js/entity-types.js
node --test tests/*.mjs
node tools/run-automated-games.mjs --verify-report automated_games/task-009-foundation-v1
<approved Playwright command>
git diff --check
```

Visually inspect Home, Your Decks, Edit Deck, card detail, Profile, Settings/import, solo game, failed Verify, closure, and results at desktop, tablet, and narrow mobile sizes in normal and reduced-motion modes.

The visual-QA record must include:

- full-page captures at 1600×1000-class desktop, an intermediate tablet size, and 390×844-class mobile;
- side-by-side review against `ui-minimum.png`, the advanced desktop board, Card/Ticket specimen sheet, and advanced mobile board;
- a checklist covering hierarchy, material separation, texture, lighting, shadow/glow, card scale, Ticket dominance, Worklog/Evidence clarity, hand interaction, responsive recomposition, placeholder-art quality, and shell consistency; and
- documented reasons for material deviations caused by current content, missing TASK-011 illustrations, accessibility, browser support, or measured performance—not convenience alone.

Exact pixel matching is neither possible nor desired, and generated incidental text is not a target. However, if the implemented board is materially flatter, less layered, or less polished than `ui-minimum.png`, TASK-010 is incomplete. Preserve the captures and concise comparison in the completion record.

## Completion boundary

TASK-010 is complete only when:

- Library remains unchanged in capability and the active Library/Play selection is idempotent;
- the static Pages artifact can complete a deterministic local solo game with 1–10 requested Tickets using one active legal deck;
- Home, Decks, Profile, Settings, export/import, results, statistics, Level, placeholders, and accessibility requirements work across the supported browser matrix;
- the shared visual system clears the minimum reference floor and makes a documented, rules-faithful attempt at the advanced desktop/specimen/mobile targets;
- the client uses the canonical engine/Builder through the Worker intent boundary rather than duplicated UI rules;
- TASK-009 deterministic outputs remain unchanged;
- all required tests and visual checks pass;
- Pages deploys only the intended staged runtime; and
- every approved dependency, local schema, profile rule, limitation, and unresolved item is documented.
