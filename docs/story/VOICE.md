# Voice and narrative style

Status: **implemented campaign-one voice guide; STORY-007 A canonizes the surrounding campaign package**

## Voice promise

The story sounds like competent people trying to tell the truth about a machine while time, incomplete records, and one another make that harder.

It should be precise, humane, lightly funny, and suspicious of easy certainty. Technical language is welcome when a character has a reason to use it. Empty futurism, generic hero speeches, and corporate superlatives are not.

## Point of view

Recommended campaign presentation:

- concise close-second-person scene direction for the customizable protagonist;
- fully voiced or text-authored ensemble characters;
- short player response choices that express attitude or investigative priority without rewriting authoritative technical facts;
- Worklogs, messages, traveler notes, test output, and lot summaries used as story artifacts;
- no narrator who knows hidden Fault state before gameplay reveals it.

The protagonist does not need a permanently voiced internal monologue. Let players supply some of their own temperament while the ensemble provides dramatic specificity.

## Four language registers

| Register | Used by | Sound | Avoid |
| --- | --- | --- | --- |
| Floor speech | Technicians, receiving, quality, shipping | Short, concrete, contextual; acronyms only when they save time. | Everyone speaking in polished tutorials. |
| Engineering analysis | Trace, Rigline, Reliability | Conditional claims, comparisons, measurements, named uncertainty. | Genius monologues and unexplained certainty. |
| Client and management speech | Programs, supervisors, formal meetings | Scope, risk, dates, outcome, defensibility; tension hidden inside careful wording. | Cartoon greed and meaningless buzzword chains. |
| System language | Worklog, SIFT, test stations, application shell | Neutral, attributable, time-stamped, explicit about source and confidence. | A computer pretending inference is fact or speaking like an oracle. |

Characters can switch registers. A manager on the dock should sound different from the same manager in a client review.

## Technical exposition pattern

When teaching a concept, prefer this sequence:

1. **Evidence:** show the indicator, state, log, measurement, or failed condition.
2. **Question:** let a character ask what candidates it supports or contradicts.
3. **Action:** make the next Test or comparison a player-relevant choice.
4. **Consequence:** allow the result to change the Ticket, relationship, or next scene.

Do not have a character recite every possible fault merely to prove the script did research. Name the candidates that matter to the decision in front of the player.

Good:

> “Bay one is new. The rebuild still stopped. What has to be readable for parity to finish?”

Weak:

> “RAID stands for Redundant Array of Independent Disks, and there are many RAID levels...”

The educational reference layer can hold comprehensive definitions. Story dialogue should create reasons to consult or remember them.

## Vocabulary

Prefer:

- **unit**, **server**, **board**, **array**, **client**, **lot**, **Ticket**, **traveler**, **Worklog**, **bench**, **rig**, **Gate**;
- **supports**, **contradicts**, **narrows**, **reproduces**, **isolates**, and **does not establish** when interpreting Evidence;
- **Verify** for the exact gameplay stage and **validation** for the surrounding in-world quality practice;
- **return to Diagnosis** or **reopen Diagnosis** after a failed Verify;
- **actionable fault** when the repair target is established but the deepest cause is not.

Use cautiously:

- **root cause**, only when Evidence earns that depth;
- **fixed**, until Verify proves the required state;
- **no fault found**, because it often means no fault reproduced under stated conditions;
- **customer-induced damage**, with clear attention to evidence, authority, and consequences;
- **AI**, specifying whether the speaker means a workload, server class, model, automation system, or recommendation tool.

Avoid as default story language:

- enemy, attack, damage points, kill, or battlefield metaphors for ordinary repair competition;
- technobabble assembled only to sound futuristic;
- “the computer says” when a named tool, test, rule, or person interpreted the result;
- “obviously,” especially before Isolation;
- treating a person as unskilled because their job is outside the Core Floor.

## Humor

Humor comes from recognition, not incompetence:

- the label placed directly over the screw a person must remove;
- the test called “quick” that takes forty-seven minutes;
- a traveler field whose permitted values cannot describe the unit;
- the veteran who owns the one cable everyone borrows and no one admits exists;
- an auditor's collection of phrases that mean “we did not record it.”

Do not make safety, disability, language fluency, or a junior person's good-faith question the joke.

## Corporate voice

Second Current's public language should be plausible and slightly too smooth:

> “Second Current extends the useful life of critical technology through integrated recovery, engineering, and circular service operations.”

Floor language quietly restores the missing complexity:

> “They want it back by Thursday, they did not send the rail kit, and their word for the symptom is ‘weird.’”

Neither register is automatically false. The friction between them creates texture.

## SIFT voice

SIFT is a diagnostic recommendation and retrieval system, not a character pretending to know the authoritative hidden state.

Its interface should distinguish:

- observed fact from imported client claim;
- Test output from technician interpretation;
- correlation from causal conclusion;
- missing data from negative Evidence;
- recommendation confidence from truth;
- source event time from later Documentation time.

Good system copy:

> Candidate ranking updated from three documented results. Two referenced actions have unpublished outputs.

Bad system copy:

> I have discovered the root cause.

If SIFT ever uses conversational language, it should remain attributable and bounded rather than witty enough to compete with the human cast.

## Lifecycle dialogue cues

- **Observe:** “What do we have before we name it?”
- **Hypothesize:** “If that were true, what else should we see?”
- **Test:** “Which result would separate those two?”
- **Isolate:** “What can you defend now that you could not defend before?”
- **Repair:** “What state are you changing, and what could this work disturb?”
- **Verify:** “Which operating condition has to hold for this to leave Gate?”
- **Document:** “What does the next person need in order not to repeat us?”

These are tonal models, not mandatory repeated catchphrases.

## Result writing

Action results should report observation before interpretation.

Better:

> Fans start after the residual-power drain. POST does not begin. The original no-POST condition remains.

Worse:

> Power issue fixed, test failed.

Better:

> The replacement member is detected. Rebuild reaches 15% and returns to Ready for Rebuild. The array remains degraded.

Worse:

> The repair didn't work.

When the player makes an unsupported choice, avoid mocking them. State what the action cost, changed, or failed to establish, then let the consequence teach.

## Sample cold open and match handoff

This sample demonstrates rhythm and voice. It does not define a Ticket, hidden Fault, or interface contract.

### 05:42 — Inflow, Trinity Hub

The dock door is halfway open when the heat finds you.

Inez Calder stands between two return cages, one hand on a scanner and the other pressed flat against a shipping case the size of a kitchen table. The case is tagged for Civic Atlas. A new label covers an older one badly enough that both barcodes still show.

“Before you ask,” she says, “the dent is old, the seal is new, and their return note says *intermittent instability*.”

You look down the row. Six servers. Three case numbers. One corner guard missing.

“How intermittent?”

“They sent no timestamps.” Inez scans the nearest serial. The handheld chirps twice. “But this one has been here before.”

The Worklog opens on your tablet. Last month's case ended with a power-supply replacement, a successful boot, and a release. The verification field contains one line: *Unit tested good.*

Ev Shaw arrives without hurrying. That generally means everyone else should.

“Gate has a hold on bench twelve,” she says. “Different serial. Same client. It passes the short profile and shuts down under their load.”

Inez tips the scanner toward the cages. “And Receiving was told these all came from the same edge site. The case files say three sites.”

Ev looks at you. “What do you know?”

The dent, the labels, the repeat serial, the incomplete Verify, the conflicting site history. None of it is a root cause. All of it belongs in the problem.

“I know the lot story doesn't agree with itself.”

“Good,” Ev says. “Don't repair the disagreement. Carry it with you.”

The shift board assigns three Tickets to the Continuity cell. Rigline begins reserving fixtures. A message from Hana at Gate adds the held unit's test history to the authorized context.

The dock door closes. The heat disappears. The questions do not.

### Suggested transition copy

> **CIVIC ATLAS RETURN LOT — CONTINUITY REVIEW**<br>
> Three units are ready for action. Packaging condition, repeat-return history, and the client-provided site conflict have been recorded as visible context. Underlying faults remain unknown.

The player then enters gameplay. The story has supplied stakes and observations without solving the Tickets.

## Scene-review checklist

Before approving a campaign scene, ask:

1. Does every technical claim have a speaker, source, or visible basis?
2. Does the scene preserve hidden state required by gameplay?
3. Is uncertainty named rather than smoothed into false certainty?
4. Does at least one person want something besides “advance the plot”?
5. Could the same information be conveyed through a choice, result, Worklog, or environment instead of a lecture?
6. Does humor preserve everyone's competence and dignity?
7. If the scene starts a match, is the player's primary activity clearly the repair work that follows?
8. If the scene follows a match, does it react to what the player actually established rather than an assumed perfect solution?

## Payload-to-voice translation method

TASK-034's context payload is the floor below which a line may not fall. Voice is a way of arranging and relating that meaning, not permission to replace it.

1. **Lock the payload.** Copy the observation or source, confidence, scope, temporal status, public/private boundary, technical terms, promised consequence, and newcomer context into a short checklist.
2. **Name the situation.** Record speaker, addressee, location, power relationship, pressure register, what each person wants, and what the previous displayed turn already established.
3. **Choose one voice lever.** Prefer a reasoning tactic—contrast, question, sequence, audience framing, source chain, or release criterion—over a catchphrase. A relationship beat can change address or order without adding a new fact.
4. **Draft from the payload.** Change rhythm, syntax, order within the turn, humor, hesitation, or metaphor only while every locked item remains recoverable to a newcomer.
5. **Run the subtraction test.** Remove the joke or personal clause. The technical statement must remain accurate. Remove the technical statement. The texture should still sound like the same person rather than generic decoration.
6. **Compare three columns.** Preserve a deterministic original/context-draft/final row. If final meaning differs, amend the payload ledger explicitly before integration; prose cannot silently win.
7. **Read in route context.** Check first-use explanations, neighboring turns, choice acknowledgment, result state, hidden information, mobile density, and whether the protagonist remains temperament-flexible.

### Semantic locks

A colorful rewrite must not change who observed a fact, what artifact supplied it, whether it is current or historical, whether it is verified or merely reported, what Candidate remains possible, what a Match established, what a choice promises, or what another team is authorized to do. It must not manufacture Evidence, Isolation, Repair, Verify, Documentation, closure, Service Points, or a shared cause. A private Give Up answer stays inside that archived Ticket.

Gameplay terms are capitalized when they name authored game state: Ticket, Candidate, Hypothesis, Test, Evidence, Isolation, Repair, Verify, Documentation, Worklog, Gate, Story Service Points, Give Up, Bench, Rigline, Trace, Inflow, First Look, SIFT, and Civic Atlas. Natural surrounding language should keep the explanation from reading like a glossary.

## Personal-texture policy

Across a campaign, roughly **five to ten percent of a speaking character's dialogue moments** may carry a personal nugget, off-duty concern, habitual observation, relationship beat, or idiosyncratic joke. This is a restraint range, not a quota per scene or a requirement that every person mention a hobby. Urgent safety, first-use context, and result authority come first.

Each used speaker should still receive at least one memorable non-procedural beat across the campaign. A beat counts only when it arises naturally from the room, object, relationship, or pressure and does not compete with the payload. TASK-036 may use only facts marked `Campaign-safe` in `CHARACTERS.md`; `Iceberg` facts remain explanatory material for writers and must not appear. The final comparison ledger should mark personal-texture lines so campaign-level percentage and one-per-speaker coverage are reviewable.

Good texture is removable without changing the technical conclusion, but its placement changes how the relationship feels. Poor texture is a hobby pasted onto an urgent instruction, a catchphrase repeated until it becomes a label, or private biography used to force intimacy with the customizable protagonist.

## Anti-drift and distinction review

- **Anonymized read:** hide names and job titles in a sample from each speaker. Reviewers should distinguish the reasoning tactic, rhythm, and relationship more often than chance without depending only on specialist jargon.
- **Register spread:** compare ordinary floor conversation, pressure/conflict, and reflective/debrief language. A person's priorities persist while sentence length and social tactic change.
- **Trait frequency:** no favorite construction, joke type, metaphor source, or personal object should appear in every scene. Repetition belongs to an institutional problem only when the route needs it.
- **Dignity check:** error, impatience, defensiveness, humor, and correction do not erase competence. Identity, age, trauma, disability, accent, or language fluency never substitutes for a voice design.
- **Relationship check:** a line should change when addressed upward, downward, to a peer, or to the protagonist, even when its payload does not.
- **Quiet-line permission:** connective language may simply orient, acknowledge, or let a conclusion land. Not every displayed turn needs a maxim.
- **Player boundary:** ensemble specificity must not assign the player a home, family, education, hobby, belief, fixed mood, or personal history. Player options name an investigative priority or attitude broad enough for multiple temperaments.

`CHARACTER_VOICE_CARDS.md` is the operational exercise set for these rules. Its examples translate TASK-034 context-complete payloads and are guidance; production text remains controlled by the versioned campaign and its final comparison ledger.
