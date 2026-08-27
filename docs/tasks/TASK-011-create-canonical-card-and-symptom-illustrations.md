# TASK-011-HIGH: Create canonical Card and symptom Ticket illustrations

## Status

**Ready.** The expanded 71-Card playable catalog, 33-Symptom Ticket vocabulary, technical action copy, board composition, and tutorial surfaces are stable enough to illustrate without designing against placeholders. This task is the active V0 task.

## Objective

Replace the family placeholders with a coherent, technically plausible, reusable illustration set for every published playable action and every Symptom that can illustrate a generated Ticket. Keep illustration knowledge on the domain object, let Card Definitions inherit it, let generated Tickets select art from public Symptom context, and preserve intentional fallbacks without copying art into runtime Card or Ticket instances.

The visual target is a realistic night-shift server-repair world: cinematic enough to make the Cards desirable, but recognizable enough to help a learner form useful associations with real hardware, tools, readouts, commands, and procedures. Illustration must never expose hidden Fault truth, predict a diagnostic result, or falsely certify that a Repair/Verify succeeded.

## Required reading

Read completely before editing:

- `AGENTS.md`, the root `README.md`, this task, and `docs/tasks/INDEX.md`;
- completed TASK-009, TASK-010, TASK-014, TASK-019, TASK-020, TASK-023, and TASK-024, focusing on Card/domain ownership, the stable catalog, current responsive card anatomy, semantic contrast, and technical copy;
- `docs/improvement_analysis/card-contract-and-build-order.md`, `schemas/README.md`, and the Card, Symptom, Test, Command, Repair Procedure, Validation Procedure, Repair Ticket, and runtime Card/Ticket schemas;
- `docs/ui-plan/ui-defense.md` and `docs/ui-plan/ui-reference_images/README.md`;
- these visual references in particular:
  - `docs/ui-plan/ui-reference_images/01-night-shift-board-desktop.png` for the preferred realistic, tactile night-shift atmosphere;
  - `docs/ui-plan/ui-reference_images/02-card-ticket-specimens.png` for family grammar, full-card/detail scale, and the difference between Card and Ticket art;
  - `docs/ui-plan/ui-reference_images/03-night-shift-board-mobile.png` for aggressive responsive crops;
  - `docs/ui-plan/ui-reference_images/task-020-global-one-row-target.png` and `task-020-relevant-one-row-target.png` for the current one-row Bench and response-hand slots; and
  - `docs/ui-plan/ui-reference_images/ui-minimum.png` only as the minimum atmosphere/material floor, not as the canonical illustration style;
- the current 71 Card Definitions and their 71 unique `primary_domain_reference` records, plus the 33 Symptoms in `content/gameplay-v1/domain-snapshot-v2.json`;
- the asset manifest, resolver, Card/Ticket/Library renderers, Play-asset staging scripts, and their tests.

Do not load all 257 domain records into one authoring context. Generate a machine-readable scoped inventory first, then work in small recorded batches by family and subsystem. The task's correctness depends on the published 71 actions and 33 Symptoms, not on illustrating every Library record.

## Verified starting contract and scope

The builder must reproduce these counts before mutation and fail rather than silently changing scope:

- 37 published Test Cards;
- 13 published Command Cards;
- 12 published Repair Cards;
- 9 published Verify Cards;
- 71 unique primary action-domain references across those 71 Cards; and
- 33 Symptoms in the current gameplay domain snapshot.

That is **104 domain-owned canonical illustration subjects**. Do not create 71 separately authored Card images plus 71 domain images. Each Card should normally inherit the illustration of its one primary domain action. Card-specific art remains an exceptional override supported by the approved Card contract.

The builder must also reproduce and resolve the current integration debt:

- some playable action records lack `presentation.illustration` metadata;
- many domain `asset_id` values do not resolve through `viewer/assets/play/assets.json`;
- registered domain IDs currently point to family placeholders instead of canonical assets;
- the Play manifest validator accepts only SVG paths even though the staging allowlist already supports efficient raster formats; and
- `resolveTicketArt` currently checks Ticket-owned art and then a generic storage placeholder; it does not inherit from a Ticket's public Symptom.

## Measured aspect-ratio contract

Use the implementation measurements rather than estimating from a screenshot:

### Action illustrations

- The Card renderer declares an intrinsic **800×450** slot and the standard Card face uses **16:9**.
- Author canonical action masters at **1600×900** (16:9) so detail views remain crisp on high-density displays.
- Publish an optimized **800×450** delivery asset, or an equivalent responsive source set if the implementation proves that it reduces bytes without complicating the dependency-free client.
- Bench, hand, Deck, and responsive views deliberately use `object-fit: cover` inside shallower or variable-height windows. Keep the meaningful tool/component/readout inside a central crop-safe region and review every subject at each real slot; never stretch an image to fit.

### Symptom/Ticket illustrations

- The current full Ticket art surface is about **2.15:1**; an existing responsive board state uses **3.35:1**; the compact active-Match strip can be similarly panoramic.
- Author each Symptom as a separate **10:3 panorama**, with a recommended master of **2400×720** and optimized delivery asset of **1200×360**.
- Keep all critical observed information inside a centered **2.15:1 safe region**, while allowing ambient rack/cable/environment detail to extend across the full panorama. This lets the same asset survive both the full-Ticket crop and the wide compact header.
- Update misleading intrinsic width/height hints where necessary, but let CSS crop rather than distort. If a small minority of compositions cannot remain intelligible through the required crops, use the existing `crop_hint` concept through one documented resolver path instead of hard-coded per-screen offsets.

These are delivery contracts, not permission to bake UI frames, family ribbons, titles, costs, status labels, evidence, or Ticket facts into the pixels. HTML owns all readable text and game state.

## Domain and runtime ownership

- Test, Command, Repair Procedure, Validation Procedure, and Symptom domain records own canonical illustration identity and accessible description.
- Card Definition art resolution remains: explicit Card override first, approved primary-domain inheritance second, intentional family fallback last.
- Card Instances and Ticket runtime state do not copy image paths, alt text, prompts, or binary data.
- A generated Ticket with no direct Ticket-definition illustration resolves its art from the first authoritative public `visible_symptom_ids` entry. The selection must be deterministic and must not inspect hidden Fault, authored outcome, candidate disposition, or future machine state.
- Direct Ticket-definition art retains precedence for a genuinely authored scenario-specific illustration. Symptom inheritance is the normal generated-Ticket path.
- The same Symptom must resolve to the same public illustration when paired with different hidden Faults. Add a regression that proves this non-leakage invariant.
- Library and Play consume the same stable `asset_id`; do not derive filenames from display names, array positions, card order, or Ticket IDs.

## Illustration art direction

Create one concise art bible and prompt grammar before production. It must preserve coherence without making the 104 subjects indistinguishable.

### Shared world

- Prefer realistic or restrained cinematic-realistic server rooms, service benches, enterprise hardware, tools, diagnostic displays, and technician viewpoints.
- Use the Night-Shift palette as environmental lighting: cool cyan rack light, limited warm amber task light, deep graphite/navy surroundings, plausible indicator colors, controlled glow, and tactile materials.
- Keep hardware scale, connectors, airflow, cable routing, drive form factors, tools, and service posture technically plausible. Do not show unsafe energized work, casual live probing, impossible connectors, or procedures contradicted by the domain safety note.
- Avoid brands, logos, watermarks, fantasy circuitry, weapons/combat framing, anthropomorphic servers, illegible decorative labels, and image-generated pseudo-text. Terminal glyphs may be abstract; actionable command syntax remains real HTML text in Inspect/Library.
- Do not bake the cyan/violet/amber/emerald Card border into the asset. The UI owns family color. A subtle family-consistent light accent is allowed only when it still reads as scene lighting.

### Tests

Show what is exercised or observed: a relevant component, test instrument, controlled setup, status display, telemetry trace, or inspection viewpoint. Distinguish inventory, health, connectivity, thermal, stress, substitution, and observation procedures instead of reusing a magnifying-glass server for all 37 Tests. Depict the act of testing, not a predetermined pass/fail result.

### Commands

Give all 13 Commands a coherent terminal/console family: dark service-console displays, structured rows, topology/status motifs, and nearby hardware context appropriate to the command. Vary the information shape—logs, inventory, route, interface, memory, storage health—without relying on readable generated text or numbers to carry meaning.

### Repairs

Center the affected component and the corrective physical/configuration action: reseating, replacement, cleaning, reconnecting, rebuilding, or applying the relevant correction. Show the intended procedure without implying it has already restored service. Use hands/tools only when anatomy, antistatic practice, and the service context remain credible.

### Verifications

Show the repaired capability under measurement or observation: telemetry, acceptance checks, link/activity indicators, inventory confirmation, boot observation, load monitoring, or health comparison. A measurement motif can distinguish Verify from Repair, but do not hard-code a green check, successful value, or victory state into a reusable definition image.

### Symptoms and Tickets

Illustrate only the observed manifestation named by the Symptom: absent power response, missing device, unexpected reboot, link loss, rising temperature, warning indicator, degraded performance, and similar player-visible conditions. The panorama may show operational context and uncertainty; it must not point to the hidden broken component or depict one Candidate as the answer. A generic symptom shared by several Faults must remain causally neutral.

## Bounded production workflow

### Phase 1 — inventory and visual bible

Generate a deterministic illustration inventory containing domain ID, display name, family, subsystem/category, technical description, safety/interpretation note, existing asset ID, target aspect ratio, prompt summary, review state, output path, dimensions, bytes, and provenance. Reconcile it to the 104-record scope and the Card catalog before generating art.

Write a short art bible with shared negative constraints, lighting/material language, camera distance, crop-safe overlays, and family-specific prompt templates. Reuse TASK-024's domain-sourced technical meaning; do not infer a procedure from its title alone.

### Phase 2 — representative pilot

Create and integrate a representative pilot covering at least:

- two Tests with materially different methods;
- two Commands with materially different information shapes;
- two Repairs, including one physical replacement/reseat;
- two Verifications;
- four Symptoms from different subsystems and with different causal ambiguity; and
- at least one subject with a safety-sensitive technical note.

Render the pilot in Library detail, Card detail, Relevant Bench, Global Bench, collapsed and expanded response hand, compact Ticket, full Ticket, and mobile layouts. Correct realism, crop, tonal consistency, recognition, text contrast, and leakage problems in the art bible before producing the remaining set.

### Phase 3 — batch production

Produce the remaining illustrations in bounded, restartable batches grouped by family and subsystem. After every batch:

- validate record/manifest completeness and stable IDs;
- create a contact sheet with domain ID and title rendered outside the image;
- review technical subject recognition, duplicates, crop safety, accessibility text, provenance, file size, and hidden-information neutrality; and
- record pass/rework status in the inventory rather than relying on conversation memory.

Do not accept one generic image recolored dozens of times. Reuse of an environment, rack model, terminal frame, or visual motif is encouraged; reuse of the same focal composition is acceptable only when the domain concepts are genuinely the same visual subject and the inventory documents the decision.

### Phase 4 — integration and staged deployment

- Register every canonical asset through stable IDs and mark it `canonical`, while retaining family/Ticket fallbacks for load failure and future draft content.
- Version the asset-manifest contract if adding raster extensions, intrinsic dimensions, or crop metadata. Permit only an explicit safe set such as `.avif`, `.webp`, `.png`, and `.svg`; do not weaken path validation.
- Keep high-resolution editable/source material out of the staged GitHub Pages payload unless the browser actually consumes it. Preserve prompts, generation settings, source references, edit history, license/usage note, and review status in a compact repository provenance ledger.
- Regenerate `viewer/content/manifest.json` and staged Play assets through their scripts; never hand-edit generated manifests.
- Make action and Symptom illustrations visible in the Library using the shared resolver or a shared manifest-backed presentation service. Missing art for unrelated Library families must retain their current intentional behavior.
- Preserve lazy loading and reserve intrinsic space so pagination, modal opening, and Ticket switching do not cause disruptive layout shifts.

## Accessibility, truthfulness, and provenance

- Author useful, concise alt text on the domain illustration. Describe the visible technical subject/action, not the Card title repeated verbatim and never an inferred hidden answer or outcome.
- Decorative duplicate uses may use empty alt text when an adjacent accessible name already communicates the same information; the canonical domain alt text remains nonempty.
- Do not place essential distinctions only in hue. Tests, Commands, Repairs, and Verifications remain identified by rendered word/icon/border anatomy.
- Record whether each asset is generated, edited, commissioned, or otherwise sourced; include creation date, tool/model where applicable, prompt/version lineage, source references, human review status, and a repository-appropriate license/usage note.
- Use the committed UI references for art direction, not as source pixels to crop into production assets.

## Performance contract

Appearance has priority, but the static client must remain disciplined:

- prefer visually lossless WebP/AVIF delivery where browser support and the simple fallback path are proven;
- target no more than 180 KiB per 800×450 action delivery image and 220 KiB per 1200×360 Symptom delivery image, with documented exceptions only where visible artifacts otherwise undermine the art target;
- keep the complete 104-image staged canonical runtime set under 30 MiB unless a measured visual review justifies a small recorded variance;
- prove that initial Home, Library, and Match startup do not eagerly download the entire catalog; and
- test slow/missing image behavior so art failure never blocks gameplay or exposes a broken-image icon.

Do not add a framework or a general-purpose asset pipeline. Small deterministic conversion/contact-sheet/validation scripts are allowed when they make the 104-asset workflow reproducible.

## Validation

Add automated and human-verifiable checks proving:

- the current 71 Card Definitions still map one-to-one to 71 unique primary domain records and all 71 resolve canonical art through the approved inheritance path;
- all 33 gameplay Symptoms resolve canonical panoramic art and a generated Ticket deterministically inherits from its first public visible Symptom when no direct Ticket art exists;
- all 104 scoped domain records have nonempty illustration metadata, a registered stable asset ID, an existing safe file, correct canonical kind/category, nonempty canonical alt text, expected dimensions/aspect family, provenance, and review status;
- no scoped canonical ID resolves to a placeholder file, while deliberate placeholder/error fallback still works;
- raster manifest paths cannot traverse directories or admit executable/unknown extensions;
- Cards and Tickets are never stretched, and representative assets retain their subject through 16:9, 2.15:1, 3.35:1, active desktop, compact hand, detail, and 390×844-class mobile crops;
- Ticket art selection is invariant under hidden-Fault changes and contains no hidden answer, outcome, Evidence disposition, or future state in DOM attributes, alt text, filenames, or resolver inputs;
- Library and Play resolve the same domain asset and alt text without duplicating illustration data into Card Instances or runtime Ticket state;
- keyboard/focus/modal behavior, reduced motion, forced colors, and readable overlaid HTML remain intact;
- a representative visual matrix and family/subsystem contact sheets receive recorded human review for realism, duplication, safety, crop, and semantic accuracy;
- initial-load and total staged-byte budgets pass; and
- all repository schema/content tests, Viewer baseline tests, Task-014 deterministic generation/campaign checks, tutorial tests, browser tests, Play-asset byte-equivalence checks, and `git diff --check` pass with no gameplay-stat changes.

Run every baseline command required by `AGENTS.md`, plus the canonical content/asset build and verification commands named in the root README. Record commands, exit codes, pass/fail totals, visual artifacts, changed files, and any approved file-size exceptions.

## Allowed paths

- the 71 selected Test/Command/Repair/Validation domain records and 33 Symptom records, plus their version-pinned/generated projections where immutable content requires synchronized updates
- Card/Symptom/Ticket illustration schema notes or narrowly required schema refinements
- canonical illustration files, asset manifest/version, art resolver/presentation service, provenance ledger, art bible, inventory/contact-sheet artifacts, and deterministic image validation/conversion scripts
- Card, Ticket, Library, Deck, Bench, hand, and Inspect rendering/CSS only where required to consume and crop canonical art correctly
- canonical Play-asset staging, generated artifacts rebuilt from canonical sources, and focused tests/visual baselines
- this task, `docs/tasks/INDEX.md`, the UI-reference README, and directly affected user documentation

Do not change stable entity IDs, gameplay contracts, costs, legal targets, outcomes, relevance, Candidate generation, Isolation/Repair/Verify rules, Ticket generation logic beyond player-safe presentation-art selection, scoring, tutorials, or profile statistics. Do not illustrate the other 153 Library-only records opportunistically.

## Completion boundary

Complete only when all 71 published playable actions and all 33 gameplay Symptoms have reviewed canonical, performant, technically plausible art; Cards inherit rather than duplicate domain illustrations; generated Tickets use deterministic public-Symptom panoramas without hidden-information leakage; the same stable assets enrich Library and Play; every real slot crops without distortion; fallbacks remain reliable; provenance and review are auditable; staged Pages bytes are deterministic; and the full gameplay/test matrix remains behaviorally unchanged.
