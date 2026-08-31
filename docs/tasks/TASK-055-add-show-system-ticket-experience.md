# TASK-055-HIGH: Add the “Show system” Ticket experience

## Status

**Complete.** The player-facing integration consumes only TASK-054 public projections and is verified across every released Story Ticket.

## Objective

Add an accessible “Show system” route to covered Tickets so Players can inspect the server archetype, understand its startup/runtime path, see its major components and connections, and learn why actions can be relevant without being shown the hidden solution.

## Required reading

Read completely before editing:

- `AGENTS.md`, root `README.md`, this task, completed TASK-049 through TASK-054, approved System decisions, and accepted System Model visual/prose outputs;
- completed TASK-011, TASK-016, TASK-018 through TASK-021, TASK-023, TASK-025, TASK-031/TASK-032, active-Match/full-Ticket/archived-dialog lifecycle and accessibility contracts;
- current Ticket public/private projection, focus/motion/SFX services, responsive CSS, and browser/visual tests; and
- the project-owner-supplied [`system-model-host-bmc-concept.png`](../ui-plan/ui-reference_images/system-model-host-bmc-concept.png), using it for conceptual grouping only.

## Entry and information hierarchy

- Place a clearly named “Show system” control in the full Ticket near the machine-state/Candidate area where it can support hypothesis formation. Validate the final position against wide desktop, constrained desktop, tablet, phone, and 200% zoom rather than choosing from one screenshot.
- Keep Symptoms and public Candidates primary. The new route must not crowd out the diagnostic loop or imply that the diagram is Evidence.
- Show the control only when a valid public System projection exists. Use the approved honest unavailable state when a covered Ticket's model fails; do not render an invented generic server.
- Preserve selected-Ticket continuity, dialog lifecycle, focus restoration, deep-link/reload behavior, and active-Match input safety.

## System presentation

The experience must provide:

- a brief “what kind of system is this?” introduction;
- the concise startup/runtime narrative with optional/conditional stages stated plainly;
- an accessible responsive topology view distinguishing containment, data, power, management/control, and lifecycle relationships without color alone;
- a complete ordered text equivalent and component-role list;
- inspectable Test, Command, Repair, and Verification relevance explanations derived from bounded rationale paths; and
- an explicit explanation that “relevant to this system” does not mean “legal now” or “correct for this Ticket.”

Prefer repository-native semantic HTML/CSS/SVG and existing interaction/motion systems. Do not introduce canvas-only meaning, a framework, a graph dependency, vendor art, or live network lookup.

## Hidden-information and authority safeguards

- The initial model must not highlight, pulse, label, sort toward, or otherwise reveal the actual failed component/path.
- It must not omit components needed by alternative public Candidates or change across hidden-truth variants with the same public surface.
- Opening, closing, panning, expanding, or inspecting the System view is informational and spends no Action.
- The view may link to existing public Library details, but it cannot submit a gameplay intent or alter Bench membership/relevance.
- Current legal actions remain owned by the Worker projection. If displayed beside system-relevant actions, the two statuses need explicit word/icon/shape distinctions.
- Archived Ticket review may reuse the same immutable public System projection only if it does not expose new private truth; a post-solution failure overlay is outside this task.

## Responsive and accessible behavior

- Use one logical reading order shared by visual and text representations.
- Support keyboard, touch, screen reader, reduced motion, forced colors, high contrast, orientation changes, and 200%/400% reflow.
- Nodes and paths need names and relationship descriptions; hover cannot be the only disclosure method.
- Preserve 44px-class interactive targets, visible focus, bounded scroll regions, Escape/backdrop/close behavior, and correct focus restoration.
- Integrate existing procedural SFX semantics only through the central catalog/service; respect the global volume setting and intentional-silence rules.

## Verification

- Test every covered released Story Ticket and at least one uncovered/failure-state Ticket.
- Assert the UI consumes only TASK-054 public projections and never private validator traces or hidden authored content.
- Differential-screenshot/DOM-test hidden variants with the same public surface and prove no secret-dependent difference.
- Verify every component, narrative stage, rationale path, text equivalent, and Library route matches the canonical public model.
- Complete active Story Matches and isolated replays with repeated open/close/reopen, Ticket switching, reload/route leave, modal interruption, and ordinary gameplay actions.
- Run desktop/mobile/keyboard/touch/screen-reader/reduced-motion/forced-colors/zoom matrices, automated accessibility checks, human visual QA, Viewer baselines, staging/manifest verification, complete applicable Node/browser suites, Markdown links, and `git diff --check`.
- Report commands, exit codes, pass/fail/skip totals, viewport results, changed files, visual evidence, leak checks, and unresolved items.

## Allowed paths

- Ticket/full-Ticket/System-view presentation modules, existing dialog/motion/focus/SFX integration, and narrowly required CSS/tokens;
- public System projection consumers and Library links;
- focused browser/Node/accessibility/visual tests and accepted evidence;
- generated/staged Viewer output from approved scripts;
- `docs/system-models/**`, this task, `docs/tasks/INDEX.md`, and concise root/UI documentation.

Do not change System/domain truth, Ticket solutions, Candidate lists, Evidence, legal intents, Action costs, Bench relevance, Story content/progress, scoring, or archived private-truth rules.

## Completion boundary

Complete only when every covered Story Ticket offers a polished, comprehensible, responsive System view that deepens mental modeling without acting as Evidence, leaking the answer, changing gameplay, or fabricating unsupported hardware.

## Completion record

Completed on 2026-08-31. The full Ticket now offers a subordinate, zero-Action **Show system** experience for every valid released-Story projection, with an honest loading/unavailable path that never blocks ordinary Play. The separate System modal preserves two-level focus, semantic topology plus complete text equivalence, relevance-versus-legality authority, responsive/orientation behavior, reduced motion, forced colors, 44 × 44 targets, central SFX reuse, and zero gameplay authority.

Coverage and exact command totals are recorded in [`docs/system-models/task-055/BROWSER_QA.md`](../system-models/task-055/BROWSER_QA.md). Focused Node coverage proves all 12 episodes / 18 Tickets / three profiles and zero causal fingerprint tokens in canonical, staged, and rendered public content.
