# TASK-023-HIGH: Correct Ticket semantic-state contrast

## Status

**Complete — 2026-08-26.** Paper and dark-board semantic states now use separate, measured foreground/fill/border/focus tokens. The compact and full Ticket preserve visible Hypothesis, Ruled out, accepted-Isolation, returned-diagnosis, disabled, and focus cues; the reported hypothesized Candidate measures 8.29:1 against its solid paper-state fill without changing gameplay authority.

## Objective

Make Candidate, Hypothesis, elimination, status, and Symptom information legible on every Ticket surface without changing gameplay state or interaction. Use surface-aware semantic styles rather than one global state color that assumes a dark background.

The reported screenshot labels `Incorrect Boot Order` as `HYPOTHESIS`; this is a Candidate Fault state, not a color change to the `Symptom: Wrong Boot Device` line. Reproduce and fix the actual candidate-chip selector while auditing the neighboring semantic states that share it.

## Required reading

Read completely before editing:

- `AGENTS.md`, root `README.md`, this task, `docs/tasks/INDEX.md`, completed TASK-016 and TASK-018 through TASK-021, and queued TASK-024/TASK-015;
- the compact Ticket, full Ticket, Candidate/Hypothesis/elimination, Evidence-disposition, and status renderers;
- all active Play CSS, including repeated or late `.candidate-chip` rules and desktop/mobile active-Match overrides;
- TASK-018 contrast tests and TASK-016 through TASK-021 visual-QA records; and
- current browser accessibility, forced-colors, zoom/reflow, touch, focus, and responsive visual tests.

## Surface-aware state contract

- Define or reuse semantic foreground, background, border, and focus tokens separately for light paper and dark board surfaces. A later generic `.candidate-chip` declaration must not overwrite a light Ticket's readable foreground.
- Preserve family/state meaning—ordinary Candidate, current Hypothesis, ruled out/eliminated, accepted Isolation, returned diagnosis, and disabled/unavailable—without relying on color alone.
- Keep the visible `Hypothesis` and `Ruled out` text markers. Add shape, border, icon, or text-decoration cues where needed; do not encode state through glow alone.
- The actual Symptom label/value, Candidate name, state label, Ticket status, machine revision, and `View full Ticket` control must remain readable together on the compact sheet.
- Hover, focus-visible, selected, disabled, high-contrast/forced-colors, and reduced-motion states must not lower text contrast or erase state identity.
- Do not change wording, Candidate membership, Hypothesis authority, legal intents, or Ticket layout except for the smallest spacing adjustment required to prevent the readable state label from clipping.

## Contrast acceptance

- Normal-size text must meet WCAG AA contrast of at least 4.5:1 against its actual composited background in every tested state; target 7:1 for the small uppercase state label where the palette permits it.
- Meaningful non-text borders/focus indicators must meet at least 3:1 against adjacent colors.
- Measure final computed/composited colors, not isolated hex tokens. Semi-transparent backgrounds over paper texture must be tested in the rendered Viewer.
- Add a focused regression that fails on the reported pale-cyan-on-cream combination. Do not bless screenshots by appearance alone.

## Validation

Add focused CSS/DOM/browser and visual regressions proving:

- compact-Ticket Candidate chips remain readable before and after Hypothesis selection;
- ordinary, hypothesized, ruled-out, accepted, returned-diagnosis, disabled, hover, selected, and keyboard-focus states pass their contrast and non-color-cue requirements;
- the full-Ticket dialog and compact Ticket use the correct light-surface treatment while dark Bench/Evidence surfaces retain their intended palette;
- the Symptom line remains stable and readable, demonstrating that the fix targets the Candidate state rather than masking the wrong element;
- desktop, narrow desktop, mobile, 200% zoom/reflow, forced colors, reduced motion, keyboard, and touch retain labels without clipping or overlap; and
- no gameplay projection, intent, event, content, or staged asset changes beyond rebuilt canonical Viewer assets occur.

Run the repository Viewer baseline from `AGENTS.md`, affected syntax checks, focused and complete browser matrices, accessibility/contrast checks, responsive visual captures, staged asset verification, and `git diff --check`. Record commands, exit codes, pass/fail totals, changed files, and unresolved items.

## Allowed paths

- active Play CSS and the smallest affected Ticket/Candidate presentation helper if a semantic surface/state class is missing
- canonical staging output rebuilt from allowed Viewer changes; never hand-edit generated Play files
- focused Node/browser/accessibility/visual tests and visual-QA notes
- this task, `docs/tasks/INDEX.md`, and TASK-015/TASK-024 dependency wording

Do not change engine rules, Hypothesis/elimination/Isolation semantics, Ticket content, Card content, Evidence dispositions, or layouts unrelated to semantic-state legibility.

## Completion boundary

Complete only when the reported hypothesized Candidate is comfortably readable on the cream Ticket; all neighboring Ticket semantic states have measured accessible contrast and non-color cues; dark and light surfaces no longer fight through global selector precedence; responsive/focus behavior remains sound; and the full Viewer/browser verification matrix passes without gameplay changes.
