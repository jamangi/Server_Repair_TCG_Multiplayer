# Quiet Cascade candidate comprehension review

Status: **20/20 public-context questions answered from the non-live candidate transcripts.** No answer depends on a hidden Fault, required diagnostic, correct Repair, unchosen outcome, character sheet, campaign blueprint, or implementation code.

## Chapter 1 — Learn the Line

### `question.qc01.ch01.01`

**Question:** What does Second Current do at Trinity Hub, and what is your role?

**Answer from candidate transcripts:** Second Current returns equipment to service at Trinity Hub. You are a capable new First Look technician in a rotation that follows information across team handoffs.

**Candidate evidence:**

- `candidate.qc01.v2.context.role.01`: You are a new First Look technician at Second Current’s Trinity Hub, trained to handle hardware safely but new to the depot’s handoffs. The Continuity Rotation will follow what each team needs from the next.

Status: **ANSWERED_FROM_CANDIDATE_TRANSCRIPTS**

### `question.qc01.ch01.02`

**Question:** What does Inflow record before First Look triage?

**Answer from candidate transcripts:** Identity, custody route, packaging condition, accessories, and the client complaint—not a technical diagnosis.

**Candidate evidence:**

- `candidate.qc01.v2.context.inflow.01`: My Inflow handoff matches the serial, custody route, packaging condition, accessories, and client complaint to the traveler before First Look triages the machine.

Status: **ANSWERED_FROM_CANDIDATE_TRANSCRIPTS**

### `question.qc01.ch01.03`

**Question:** How do the traveler and Worklog differ?

**Answer from candidate transcripts:** The traveler follows identity, routing, accessories, and release checks; the Worklog preserves the official chronology of accepted service work and results.

**Candidate evidence:**

- `candidate.qc01.v2.context.records.01`: The traveler follows identity, routing, accessories, and release checks. The Worklog is the official chronology of accepted actions, results, and conclusions that later teams must be able to trust.

Status: **ANSWERED_FROM_CANDIDATE_TRANSCRIPTS**

### `question.qc01.ch01.04`

**Question:** What must happen between a Hypothesis and release?

**Answer from candidate transcripts:** Tests must create Ticket-specific Evidence, accepted Isolation must support Repair, Verify must independently prove the named required state, and Documentation must preserve the path for Gate.

**Candidate evidence:**

- `candidate.qc01.v2.context.lifecycle.01`: A Ticket is one unit’s service case. Mark a plausible Candidate as your Hypothesis, then use Tests to gather Evidence that actually separates it from the alternatives.
- `candidate.qc01.v2.context.lifecycle.02`: Commit Isolation only when that Ticket’s Evidence makes a fault actionable. Repair changes machine state; Verify independently checks the required state; Documentation preserves the path for Gate. If you Give Up, the Ticket is archived and its private answer cannot be reused elsewhere.

Status: **ANSWERED_FROM_CANDIDATE_TRANSCRIPTS**

### `question.qc01.ch01.05`

**Question:** What remains unknown before each Match?

**Answer from candidate transcripts:** The underlying fault, decisive diagnostic route, correct Repair, and outcome remain unknown until authorized gameplay establishes or reveals them.

**Candidate evidence:**

- `text.qc01.match.shift01.setup`: First Look has opened one Repair Ticket for a server that consistently selects an unintended boot source. Public Symptoms and Candidates are available; the underlying fault, decisive diagnostic path, required response, and eventual outcome remain unknown.

Status: **ANSWERED_FROM_CANDIDATE_TRANSCRIPTS**

## Chapter 2 — Follow the Repeaters

### `question.qc01.ch02.01`

**Question:** What do Rigline, Trace, and Bench each contribute?

**Answer from candidate transcripts:** Rigline reproduces under named conditions, Trace designs discriminating comparisons and supports Isolation, and Bench performs supported state changes and reports what changed.

**Candidate evidence:**

- `text.qc01.ch02.entry.02`: Rigline reproduces complaints under named test profiles. Trace compares Candidates and designs observations that can support an accountable Isolation.
- `candidate.qc01.v2.context.specialists.01`: Bench performs the supported physical or configuration change. Our handoff must tell Bench why the work is justified, and Bench must tell Gate what changed and what the work may have disturbed.

Status: **ANSWERED_FROM_CANDIDATE_TRANSCRIPTS**

### `question.qc01.ch02.02`

**Question:** Why are fixture, target, and condition attached to a result?

**Answer from candidate transcripts:** They show which setup produced the result and which question it actually answered, so a later reader does not overgeneralize a pass or failure.

**Candidate evidence:**

- `text.qc01.ch02.rigline.01`: Good. A fixture is the rig and setup that produced the result; without its target and operating condition, the result is a souvenir.

Status: **ANSWERED_FROM_CANDIDATE_TRANSCRIPTS**

### `question.qc01.ch02.03`

**Question:** What does “repeater” mean at Trinity Hub?

**Answer from candidate transcripts:** A unit that returns after release. The campaign has one confirmed repeat serial and a broader repeated handoff habit, not one proven repeating technical fault.

**Candidate evidence:**

- `candidate.qc01.v2.context.repeaters.01`: On this floor, a repeater means a unit that returns after release—not a repeated symptom and not an electronics device. We have one confirmed repeat serial; the wider record shows a repeated handoff habit, not one proven technical cause.

Status: **ANSWERED_FROM_CANDIDATE_TRANSCRIPTS**

### `question.qc01.ch02.04`

**Question:** Why can similar memory or thermal complaints need separate explanations?

**Answer from candidate transcripts:** A shared subsystem or symptom does not transfer Evidence, Isolation, Repair, or Verify between Tickets.

**Candidate evidence:**

- `text.qc01.ch02.shift03.02`: Do not let the shared subsystem flatten different Symptoms or Candidates. Each Repair must be supported, and each Ticket’s Verify must check its own required state.

Status: **ANSWERED_FROM_CANDIDATE_TRANSCRIPTS**

### `question.qc01.ch02.05`

**Question:** What can the Player do next with this context?

**Answer from candidate transcripts:** Choose whether reproduction or discrimination leads, then preserve the chosen purpose and conditions in the Worklog.

**Candidate evidence:**

- `text.qc01.ch02.choice.mentor.prompt`: Which useful question should lead this review?
- `text.qc01.ch02.ack.reproduce.01`: You led with reproducibility. The Worklogs now name each fixture and operating condition, so a later reader can tell a pass from an unasked question.

Status: **ANSWERED_FROM_CANDIDATE_TRANSCRIPTS**

## Chapter 3 — Read Between Worklogs

### `question.qc01.ch03.01`

**Question:** What does Knowledge Systems maintain, and what is SIFT?

**Answer from candidate transcripts:** Knowledge Systems maintains Worklogs, integrations, and search. SIFT is a service-record search and recommendation tool limited to authorized sources; it cannot recover omissions or decide what an old result proves now.

**Candidate evidence:**

- `text.qc01.ch03.entry.01`: Knowledge Systems maintains the Worklog platform, test-result integrations, and searchable service histories. Here, every omitted source condition becomes visible at scale.
- `text.qc01.ch03.entry.02`: SIFT is our service-record search and recommendation tool. It can compare authorized words, serials, outcomes, and dates; it cannot recover omitted provenance or decide what an old result proves now.

Status: **ANSWERED_FROM_CANDIDATE_TRANSCRIPTS**

### `question.qc01.ch03.02`

**Question:** Which fields must survive with a test result?

**Answer from candidate transcripts:** Its source, target, operating condition, output, and time, plus the later interpretation as a distinct step.

**Candidate evidence:**

- `candidate.qc01.v2.context.sift.01`: Normally, a rig publishes a result with its source, target, condition, output, and time. When those fields vanish, SIFT can repeat the conclusion but the next technician cannot tell which question the result answered.

Status: **ANSWERED_FROM_CANDIDATE_TRANSCRIPTS**

### `question.qc01.ch03.03`

**Question:** What can a negative result establish?

**Answer from candidate transcripts:** Only the branch it actually tested; it can narrow a Candidate without proving every alternative or turning missing data into Evidence.

**Candidate evidence:**

- `text.qc01.ch03.preserve.01`: A negative result can close only the branch it actually tested. I will keep its source, target, condition, output, and time together instead of burying it as “no issue found.”

Status: **ANSWERED_FROM_CANDIDATE_TRANSCRIPTS**

### `question.qc01.ch03.04`

**Question:** Why separate link-state and address-configuration Evidence?

**Answer from candidate transcripts:** They answer different network questions, and each Ticket needs its own current Evidence before Isolation.

**Candidate evidence:**

- `text.qc01.ch03.shift05.02`: Keep link-state Evidence and address-configuration Evidence separate. Commit Isolation only when one Ticket’s current Evidence makes one public Candidate actionable.

Status: **ANSWERED_FROM_CANDIDATE_TRANSCRIPTS**

### `question.qc01.ch03.05`

**Question:** What is the quiet cascade?

**Answer from candidate transcripts:** An organizational pattern in which independent faults become harder to explain when source context is lost across handoffs—not a shared hidden hardware fault.

**Candidate evidence:**

- `text.qc01.ch03.debrief.02`: The pattern we can defend is procedural: independent ordinary faults become a quiet cascade when their explanations lose source context at team handoffs.

Status: **ANSWERED_FROM_CANDIDATE_TRANSCRIPTS**

## Chapter 4 — Put the Truth in Service

### `question.qc01.ch04.01`

**Question:** What does Client Programs do with the final account?

**Answer from candidate transcripts:** It translates supported outcomes, scope, timing, release bounds, and remaining risk into decisions Civic Atlas can act on.

**Candidate evidence:**

- `text.qc01.ch04.entry.01`: At dawn, Client Programs prepares the supported outcomes, remaining risk, and release bounds that Civic Atlas can use. One question governs the brief: what can Trinity Hub responsibly put back in service?
- `candidate.qc01.v2.context.client.01`: Civic Atlas uses this account to decide what can return to service, what remains under review, and which uncertainty must travel to its operators. Smoother wording cannot widen what Gate and the Worklogs support.

Status: **ANSWERED_FROM_CANDIDATE_TRANSCRIPTS**

### `question.qc01.ch04.02`

**Question:** What changes when the Player chooses outcomes-first or uncertainty-first?

**Answer from candidate transcripts:** Only rhetorical order and acknowledgment change; authorized facts, bounds, Match configuration, and outcome band do not.

**Candidate evidence:**

- `text.qc01.ch04.entry.03`: Choose the order. The same Evidence, verified outcomes, and unresolved bounds must survive either opening.

Status: **ANSWERED_FROM_CANDIDATE_TRANSCRIPTS**

### `question.qc01.ch04.03`

**Question:** How should the final three-Ticket queue be handled?

**Answer from candidate transcripts:** Coordinate resources across the queue while keeping each Ticket’s Evidence, Isolation, Repair, Verify, and Worklog independent.

**Candidate evidence:**

- `text.qc01.ch04.converge.02`: Three final Tickets are ready. Coordinate the shared queue, but keep each machine’s Evidence, Isolation, Repair, Verify, and Worklog independent.

Status: **ANSWERED_FROM_CANDIDATE_TRANSCRIPTS**

### `question.qc01.ch04.04`

**Question:** What do the three ending bands authorize?

**Answer from candidate transcripts:** A client-facing reviewed release, a bounded account of closed work and open risk, or a Gate hold for continued review; none rewrites Match truth.

**Candidate evidence:**

- `text.qc01.ch04.ending.release.01`: Defensible Release. At least 20 of 24 possible Story Service Points support a client-facing account of the reviewed work while preserving every stated boundary.
- `text.qc01.ch04.ending.bounded.01`: Bounded Account. The client receives a precise separation between closure-valid work, private archived outcomes, and operating conditions that remain unverified.
- `text.qc01.ch04.ending.hold.01`: Gate Hold — Continue Training. Fewer than 12 of 24 possible Story Service Points support release, so the queue remains under Trinity Hub review without shame or invented certainty.

Status: **ANSWERED_FROM_CANDIDATE_TRANSCRIPTS**

### `question.qc01.ch04.05`

**Question:** What still remains unknown after the campaign’s organizational conclusion?

**Answer from candidate transcripts:** No common supplier defect, field condition, component failure, or shared technical root has been established; unresolved Tickets remain bounded to their own records.

**Candidate evidence:**

- `text.qc01.ch04.converge.01`: Good. The client can act on a service risk caused by lost handoff context without our inventing a supplier defect, field condition, or shared component failure.

Status: **ANSWERED_FROM_CANDIDATE_TRANSCRIPTS**
