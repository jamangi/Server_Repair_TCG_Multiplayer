export const QUIET_CASCADE_CHARACTERIZATION_VERSION = 'quiet-cascade-characterization-v2';

// Overrides are keyed by the TASK-034 candidate ID: existing text IDs for
// replacements and candidate IDs for proposed additions. Candidate text that
// is absent here was already compatible with its speaker's reviewed card.
export const QUIET_CASCADE_FINAL_OVERRIDES = Object.freeze({
  'candidate.qc01.v2.context.inflow.01': 'Before First Look gets the machine, I marry five things to the traveler: serial, route, box condition, accessories, and the complaint. Miss one and the next team inherits a mystery we made.',
  'candidate.qc01.v2.context.records.01': 'Traveler for where it went and what went with it. Worklog for who did what, what came back, and what we accepted. Different histories; later teams need both to hold.',
  'candidate.qc01.v2.context.lifecycle.01': 'One unit, one Ticket. Which plausible Candidate are you willing to call the Hypothesis? Good. Now choose a Test that can separate it from the rest; activity is not Evidence by itself.',
  'candidate.qc01.v2.context.lifecycle.02': 'Commit Isolation only when this Ticket’s Evidence makes a fault actionable. Repair changes the machine; Verify independently checks the required state; Documentation carries the path to Gate. Give Up archives the Ticket, and its private answer stays there.',
  'candidate.qc01.v2.context.points.success.01': 'Story Service Points count only closure-settled Isolation and necessary Repair contributions. Tests, Verify, Documentation, and closure are still required. Essential is not the same as separately scored; please spare me “administratively optional.”',
  'candidate.qc01.v2.context.points.abandon.01': 'Story Service Points count only Isolation and necessary Repair contributions settled at closure. A gap earns no invented points. Keeping it visible is still responsible work.',
  'candidate.qc01.v2.context.specialists.01': 'Bench changes physical or configured state. We owe Bench the Evidence that makes the work supportable; Bench owes Gate the exact change and what it could have disturbed. Skip either half and a vanished symptom becomes an incomplete explanation.',
  'candidate.qc01.v2.context.repeaters.01': 'Define repeater before the word starts doing our thinking. Here it means a unit returned after release. We have one confirmed serial and a repeated handoff habit—not a repeated symptom, an electronics device, or one proven technical cause.',
  'candidate.qc01.v2.context.sift.01': 'Normally the rig publishes source, target, condition, output, and time. Strip those fields and SIFT can still echo the conclusion—cleanly, unfortunately—but the next technician cannot reconstruct the question.',
  'candidate.qc01.v2.context.client.01': 'Civic Atlas will use this account to decide what returns to service, what stays under review, and which uncertainty follows the unit to its operators. Make it readable, yes. Do not make it smoother than Gate and the Worklogs permit.',

  'text.qc01.ch01.open.03': 'Inflow meets every unit before the repair floor does. The case file gives me one history; the box gives me another. Even my scanner knows better than to call either one the diagnosis.',
  'text.qc01.ch01.open.04': 'Ev wants the Continuity Rotation to carry useful context across every handoff. Which history leads the first brief?',
  'text.qc01.ch01.package.02': 'None of that names a fault. It tells First Look which observations arrived with the unit and which may have joined it in transit.',
  'text.qc01.ch01.worklog.02': 'That closure is chronology, not present truth. Carry what changed and the conditions that supported it. Investigate the unit in front of you.',
  'text.qc01.ch01.converge.01': 'Good. Public context chooses the next question. It does not answer the Ticket.',
  'text.qc01.ch01.shift01.02': 'Use the public observations to form a working Hypothesis. Then choose Tests that can make the Evidence support, contradict, or separate the Candidates. Which result would change your mind?',
  'text.qc01.ch01.shift01.success.01': 'Gate has two things it can audit: a current, independent Verify of the required state and a Worklog that names the supported change. This unit may leave review.',
  'text.qc01.ch01.shift01.abandon.02': 'Carry the gap forward. Do not turn it into a guess about the next unit.',
  'text.qc01.ch01.shift02.success.02': 'Same warning, different Repair. That is why the warning was never the diagnosis.',
  'text.qc01.ch01.shift02.abandon.02': 'Gate can hold a bounded unknown for another shift. It cannot release a confident sentence that outruns the record.',
  'text.qc01.ch01.gate.earned.02': 'Autonomy does not mean fewer checks. It means knowing which check must stay independent.',
  'text.qc01.ch01.gate.support.01': 'The rotation continues with closer review. Fewer Story Service Points mean less causal work settled at closure. They do not measure the learner as a person.',

  'text.qc01.ch02.rigline.01': 'A fixture is the rig plus the setup that made the result. Lose the target and operating condition and you have a very well-labeled souvenir. Yes, I own a label maker; no, it cannot restore missing context.',
  'text.qc01.ch02.rigline.02': 'Condition first. Then the Evidence can tell us whether that condition matters.',
  'text.qc01.ch02.trace.01': 'Possible is cheap. I have filled enough agenda margins with possibilities. Choose the observation that would make one Candidate different from the others.',
  'text.qc01.ch02.trace.02': 'Negative is not empty. If the Test reached the named target under the named condition, it can close one branch of the tree. Detach either, and we no longer know which branch moved.',
  'text.qc01.ch02.converge.01': 'Reproduction and discrimination answer different questions. Rigline makes the event available; Trace asks which result would make it useful.',
  'text.qc01.ch02.shift03.02': 'A shared subsystem does not flatten different Symptoms or Candidates. Support each Repair, then Verify the required state on its own Ticket.',
  'text.qc01.ch02.shift03.abandon.02': 'Bounded is a result. It is not permission to copy the other Ticket’s explanation across the gap.',
  'text.qc01.ch02.shift04.01': 'Same shape on both records: short idle stays inside range; sustained processor load climbs past it. The rig reproduced that change. It has not named what caused it.',
  'text.qc01.ch02.shift04.02': 'The rise does not choose among airflow, contact, or a moving part. Ask Bench for work the Evidence supports, not work the atmosphere suggests.',
  'text.qc01.ch02.shift04.success.02': 'The current load Verify matters because the Worklog keeps its load and duration attached. A detached green badge tells Gate only that something, somewhere, passed.',
  'text.qc01.ch02.ack.reproduce.01': 'You led with reproducibility. Each Worklog now names fixture and operating condition, so the next reader can tell a pass from a question the rig never asked.',
  'text.qc01.ch02.ack.discriminate.01': 'You led with discrimination. Each Worklog names the Candidate an observation separated. More data is not automatically better data.',

  'text.qc01.ch03.entry.02': 'SIFT indexes authorized words, serials, outcomes, and dates, then recommends related records. It cannot reconstruct a field nobody kept or decide what an old result proves now. I moved here from Rigline to build a map, not an oracle.',
  'text.qc01.ch03.entry.03': 'A missing source field is not Evidence of a secret shared fault. It is a stop sign on how far the explanation may travel.',
  'text.qc01.ch03.preserve.01': 'A negative result closes only the branch it tested. I will keep source, target, condition, output, and time together instead of burying them under “no issue found.”',
  'text.qc01.ch03.summary.01': 'The receiving technician needs the supported conclusion before the event stream. I will state its scope, then link to the Evidence and chronology beneath it. Summary as map, not trapdoor.',
  'text.qc01.ch03.shift05.02': 'Keep link-state Evidence separate from address-configuration Evidence. Commit Isolation only when this Ticket’s current Evidence makes one public Candidate actionable.',
  'text.qc01.ch03.debrief.01': 'SIFT surfaced a provenance gap by comparing authorized Worklogs. It did not diagnose a machine, restore an omitted result, or reveal hidden Ticket truth. That distinction is my responsibility too.',
  'text.qc01.ch03.debrief.02': 'The defensible pattern is procedural: independent ordinary faults become a quiet cascade when their explanations lose source context at handoffs.',

  'text.qc01.ch04.entry.02': 'I translate the floor’s authorized record into client decisions about scope, timing, and risk. I need a useful account, not one cause stretched over unrelated machines.',
  'text.qc01.ch04.entry.03': 'Priya, choose the order. We can disagree about the opening; the same Evidence, verified outcomes, and unresolved bounds must survive it.',
  'text.qc01.ch04.outcomes.01': 'I will open with units whose named required states were independently verified, then point to the Worklogs that preserve each causal path. Outcome first; boundary attached.',
  'text.qc01.ch04.uncertainty.01': 'I will open with the bound: the reviewed record supports no common technical root, and unresolved Tickets remain explicitly separate.',
  'text.qc01.ch04.converge.01': 'Good. The client can act on a service risk created by lost handoff context. We do not need to invent a supplier defect, field condition, or shared component failure to make that useful.',
  'text.qc01.ch04.shift06.02': 'No case lends its Isolation to another. Close only the causal path supported inside each Ticket, then document the limit the next handoff must retain.',
  'text.qc01.ch04.shift06.success.02': 'That is an account I can defend. The coordination lesson connects the records; it does not collapse their technical causes.',
  'text.qc01.ch04.shift06.abandon.02': 'We can give the client a bounded account of completed work and open risk. We cannot call the whole queue verified.',
  'text.qc01.ch04.ending.release.02': 'No single dramatic culprit. You made twelve independent explanations survive Inflow, First Look, Rigline, Trace, Bench, Gate, Knowledge Systems, and Client Programs. That is less theatrical and more useful.',
  'text.qc01.ch04.ending.bounded.01': 'Bounded Account. The client gets three clearly separated sets: closure-valid work, private archived outcomes, and operating conditions that remain unverified. Useful does not require pretending those sets are one.',
  'text.qc01.ch04.ending.hold.01': 'Gate Hold — Continue Training. Fewer than 12 of 24 possible Story Service Points support release, so the queue stays under Trinity Hub review—without shame and without invented certainty.',
});

// Exactly seven of the final campaign's 100 speaking moments (7%) carry a
// marked personal, habitual, humorous, or relational texture beat: one for
// every campaign-one speaker.
export const QUIET_CASCADE_PERSONAL_TEXTURE_IDS = Object.freeze([
  'text.qc01.ch01.open.03',
  'text.qc01.ch02.rigline.01',
  'text.qc01.ch02.trace.01',
  'candidate.qc01.v2.context.points.success.01',
  'text.qc01.ch03.entry.02',
  'candidate.qc01.v2.context.client.01',
  'text.qc01.ch04.entry.03',
]);
