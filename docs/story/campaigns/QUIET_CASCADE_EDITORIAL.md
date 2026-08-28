# Quiet Cascade editorial and production audit

Status: completed source-copy audit for `story.campaign.quiet_cascade.v1`

## Scope reviewed

- four chapter scripts and the `en` source catalog;
- four remembered, reconvergent choices and their delayed acknowledgments;
- six pre-/post-Match bridges, including completed and abandonment fallbacks;
- the nested 20/12 Story Service Point gate and all six terminal variants;
- seven established characters, six reusable backgrounds, and three technical inserts;
- deterministic transcripts for all three ending bands and the machine route matrix covering every choice option.

## Editorial findings

| Audit | Result | Production rule retained |
| --- | --- | --- |
| Voice differentiation | Pass | Inez speaks through custody/material detail; Ev through handoff scope; Malik through fixtures/conditions; Sora through discriminating Evidence; Hana through closure authority; Jonah through provenance; Priya through operational usefulness |
| Repeated exposition | Pass | The independent-fault boundary recurs at each handoff with a different operational consequence, not identical wording |
| Choice intent | Pass | Every option expresses a legitimate priority, takes an immediate route, writes typed memory, reconverges, and receives later acknowledgment |
| Terminology | Pass | Observe, Hypothesis, Test, Evidence, Isolate, Repair, Verify, Document/Worklog, Ticket, Match, Service Points, Search, and Refresh retain frozen meanings |
| Hidden-information safety | Pass | Story setups name only public symptom/subsystem/workplace context; scripts never name the hidden Fault, required diagnostic, correct Repair, or unchosen outcome before Match authorization |
| Failed Verify | Pass | No scripted failed Verify is invented; current TASK-014 content does not support that fingerprint. Dialogue only preserves the general independence of Repair and Verify |
| Technical causal claims | Pass | No common component root, supplier defect, field condition, or shared repair is asserted. The campaign-wide cascade is explicitly organizational |
| Safety framing | Pass | Abandonment and low contribution preserve bounded gaps without shaming; Gate Hold is an operational fallback |
| Privacy/provenance | Pass | SIFT sees authorized records only and cannot recover missing provenance or private Match truth |
| Localization readiness | Pass | Text is keyed, avoids raster-only meaning, expands the SIFT role in context, and does not splice grammatical fragments around variable values |
| Mobile dialogue density | Pass with production note | Source entries are generally one or two sentences. Viewer must scroll dialogue rather than truncate; no critical distinction is encoded only in a long compound sentence |
| Motion/reduced motion | Pass | Transitions communicate rhythm only. Entrances, poses, inserts, and lighting carry no unique required information |

## Technical copy checkpoints

1. A reproduced symptom is not an Isolation.
2. A negative result may narrow a Hypothesis when its target and condition are preserved.
3. Isolate is the accountable transition to an actionable fault; no cutscene performs it on behalf of the player.
4. Repair changes state. Only current required Verify plus Documentation supports closure.
5. A completed Match return can describe the normalized closure result but cannot expose hidden diagnostic details to Story.
6. Give Up/abandonment may disclose an archived answer inside the Match UI, but the Story script does not reuse it as a causal conclusion.
7. SIFT organizes authorized records; it is not omniscient, predictive, or an engine bypass.
8. Story Service Points are campaign-scoped sums of normalized gains; lifetime profile statistics remain display-only.

## Choice-language audit

| Choice | Distinct intent | Immediate evidence in script | Delayed evidence in script |
| --- | --- | --- | --- |
| Intake context | Material custody vs. authorized chronology | Separate Inez/Ev route copy | Hana names the history that survived handoffs |
| Mentor question | Reproduce a condition vs. discriminate Candidates | Malik/Sora route copy | Mentor-specific post-thermal acknowledgment |
| Record policy | Preserve negative source coverage vs. lead with a bounded summary | Jonah/Hana route copy | Policy-specific post-network acknowledgment |
| Client frame | Verified outcomes first vs. bounded uncertainty first | Priya/Ev route copy | Six terminal variants preserve the opening order |

No option promises a different Ticket, reward, score, hidden truth, or gameplay advantage.

## Choreography audit

- Character tags are stable and reused (`cast.ev`, `cast.inez`, `cast.malik`, `cast.sora`, `cast.hana`, `cast.jonah`, `cast.priya`).
- Each used character resolves to exactly two registered pose assets at most.
- Background reachability is capped at six IDs. Lighting/time differences are accomplished through the registered reusable scenes, not per-line images.
- Three transient inserts are informative and have translated alternative-text IDs. Their visible text is not required to understand dialogue.
- A new `scene` clears transient inserts; later reuse is explicit. Character changes use `show` by tag, so pose replacement does not duplicate a character.
- All transitions use the runtime enum `CUT`, `FADE`, `DISSOLVE`, or `SLIDE`; the current pack uses the first three only.
- All positions use `LEFT`, `CENTER`, `RIGHT`, or `FULL`; no pixel coordinates or layout assumptions appear in content.

## Transcript review notes

The generated canonical transcripts deliberately use the same remembered-choice combination for all three score bands so outcome language can be compared without rhetorical-order noise. The 48-route matrix separately proves both options of all four choices under release, bounded, and hold result patterns.

Expected canonical totals:

| Route band | Match pattern | Story Service Points | Ending |
| --- | --- | ---: | --- |
| Release | Six completed queues | 24 | `ending.qc01.defensible_release` |
| Bounded | Shifts 1–4 completed; shifts 5–6 abandoned | 14 | `ending.qc01.bounded_account` |
| Hold | Six abandoned queues | 0 | `ending.qc01.gate_hold` |

These synthetic route returns validate Story topology only. The separate TASK-027 automated campaign plays all six canonical Match batches through the real engine with a seat-safe policy and identical-input reruns.

## Deferred production polish

- Final recorded voice timing and subtitle line breaks belong to a later audio/localization task; no timing values are embedded in source.
- Final art may refine crop focal points within the protected zones in `BACKGROUNDS.md`, but it must keep logical asset IDs and accessible text stable.
- If future playable content introduces a proven failed-Verify scenario, it requires a new reviewed Match configuration and graph revision. It must not be retrofitted into these seeds through dialogue alone.
