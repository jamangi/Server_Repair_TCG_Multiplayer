# Quiet Cascade expansion choice consequence map

Status: **non-live TASK-044 review record**

Both choices are remembered, presentation-only ordering decisions. They change the order and acknowledgment of the briefing, then reconverge before Match authority. They never change a Ticket, seed, hidden truth, required action, deck, Story Service Point gain, or ending.

| Choice | Remembered variable | Options and values | Reconvergence | Delayed acknowledgment | Route coverage |
| --- | --- | --- | --- | --- | ---: |
| `choice.qc02.initial_evidence_frame` | `story.qc02.initial_evidence_frame` (default `UNSET`) | `location_context_first` → `LOCATION_CONTEXT_FIRST` via `story.qc02.shift07.frame.location_context_first`<br>`controlled_comparison_first` → `CONTROLLED_COMPARISON_FIRST` via `story.qc02.shift07.frame.controlled_comparison_first` | `story.qc02.shift07.match` | story.shift.qc02.08: `LOCATION_CONTEXT_FIRST` → `story.qc02.shift08.initial_frame_ack.location_context_first` → `text.qc02.s08.ack.initial.location.01`<br>`CONTROLLED_COMPARISON_FIRST` → `story.qc02.shift08.initial_frame_ack.controlled_comparison_first` → `text.qc02.s08.ack.initial.comparison.01`<br>reconverges at `story.qc02.shift08.initial_frame_ack`, then `story.qc02.shift09.entry` | 128 routes per option |
| `choice.qc02.change_evidence_frame` | `story.qc02.change_evidence_frame` (default `UNSET`) | `current_state_first` → `CURRENT_STATE_FIRST` via `story.qc02.shift10.frame.current_state_first`<br>`change_history_first` → `CHANGE_HISTORY_FIRST` via `story.qc02.shift10.frame.change_history_first` | `story.qc02.shift10.match` | story.shift.qc02.11: `CURRENT_STATE_FIRST` → `story.qc02.shift11.change_frame_ack.current_state_first` → `text.qc02.s11.ack.change.current.01`<br>`CHANGE_HISTORY_FIRST` → `story.qc02.shift11.change_frame_ack.change_history_first` → `text.qc02.s11.ack.change.history.01`<br>reconverges at `story.qc02.shift11.change_frame_ack`, then `story.qc02.shift12.entry` | 128 routes per option |

## Authority and consequence proof

- Both option values are typed `STRING` writes declared in the candidate registry and match the locked blueprint exactly.
- Every immediate option branch performs presentation copy and jumps to its planned Match label. No branch writes Service Points, selects a Ticket, changes a seed, grants Evidence, or chooses an outcome.
- Each delayed acknowledgment executes one `VARIABLE_EQUALS` read of its remembered variable, selects value-specific localized copy, writes no state, and reconverges before continuation.
- The exhaustive TASK-043 matrix contains 256 routes: two initial-frame options × six binary Match outcomes × two change-frame options. Every option appears on 128 routes, and every route reaches `ending.qc02.current_content`.
- Choice language remains protagonist-flexible: options express investigative presentation priority, not personality, biography, competence, or an authoritative diagnosis.

## Review boundary

A later release may preserve these values in checkpoint history, but it may not reinterpret them as gameplay authority or a score modifier. Changing an option promise, write, branch label, reconvergence, or delayed acknowledgment requires a topology/continuity review rather than a prose-only edit.
