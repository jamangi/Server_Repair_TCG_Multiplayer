# Story foundation

Status: **working premise for review**

## The one-sentence version

In 2049, at a North Texas recovery depot where discarded servers are returned to service, a newly selected crossline technician follows failures across departmental handoffs and discovers that the most dangerous fault in the building may be the information everyone stopped carrying forward.

## Creative north star

**Earth is not post-apocalyptic. It is post-disposable.**

Server Repair TCG is a grounded workplace mystery about maintenance as a form of care. The machines matter because people and communities depend on them, but the people repairing them are never reduced to operators standing beside miraculous technology. They notice, argue, test, teach, make mistakes, record what happened, and inherit the consequences of one another's work.

The intended feeling is:

- blue-collar and engineering-adjacent science fiction rather than space opera;
- hopeful without becoming corporate propaganda;
- technically specific without turning dialogue into a certification textbook;
- funny in the dry, observant way of people sharing a long shift;
- suspenseful because the evidence is incomplete, not because every Ticket hides a villain;
- attentive to the entire lifecycle of a machine, including the people at the dock, quality gate, parts cages, and shipping lanes.

The thematic proposition is simple: **a repair is not a replaced part; it is an explanation that survives contact with reality and with the next person in the chain.**

## Time: 2049

2049 is close enough that ECC memory, RAID arrays, Linux commands, management controllers, familiar network protocols, component substitution, and board-level electronics remain recognizable. It is far enough ahead for today's trends to have changed the social importance of repair.

During the 2030s and 2040s, several pressures converged:

- AI and edge-compute expansion created an enormous, heterogeneous installed base of servers.
- Climate adaptation moved more public services onto regional compute cooperatives while heat, dust, flooding, and grid instability made that hardware harder to keep alive.
- Material accounting, producer-responsibility laws, and volatile access to refined metals made disposal expensive and politically visible.
- Manufacturers continued to guard parts, firmware, and service knowledge, but customers demanded repairable systems and auditable device histories.
- Automated triage became excellent at common failures. The work left for human teams became more ambiguous, intermittent, cross-domain, and consequential.

There was no single collapse and no clean recovery. Wealthy regions replace equipment more easily; others run mixed fleets spanning decades. Global supply chains still function, but they are costly, conditional, and frequently rerouted. A working fifteen-year-old storage node can be more valuable than a new server stranded behind a missing proprietary module.

This state of Earth makes the game's activity credible. Repair is no longer a niche alternative to replacement. It is part of the infrastructure economy.

## Place: the Trinity Hub

The campaign begins at **Trinity Hub**, a Second Current Serviceworks campus in the logistics corridor between Dallas and Fort Worth. The location is fictional, though its depot character is informed by real repair and reverse-logistics operations in the region.

Trinity Hub occupies a converted distribution complex expanded in mismatched eras. The receiving side faces cargo lanes and weather. The Core Floor is climate controlled but never quiet. Quality and Outflow sit at the far end, where repaired units become client property again.

Recurring sensory anchors include:

- the pressure change when the dock doors open into summer heat;
- rolling cages, antistatic curtains, barcode chirps, and the low chord of test racks;
- amber indicators bright enough to color a technician's fingertips;
- alcohol, dust, warm plastic, flux, cardboard, and cold conditioned air;
- handwritten cautions beside immaculate automated stations;
- an old break-room corkboard beside a wall-sized production dashboard;
- thunderstorms that interrupt conversation before they threaten power.

The facility is visually dense but not cyberpunk clutter. Every label, light, tote, floor stripe, and screen exists because someone once lost time—or a machine—without it.

## The company: Second Current Serviceworks

**Second Current Serviceworks**, usually shortened to **Second Current**, is the working fictional-company name. It requires normal name and trademark review before public release.

Second Current is a global product-lifecycle company. Manufacturers, infrastructure operators, insurers, public agencies, and fleet owners send it returned equipment that must be triaged, repaired, refurbished, harvested, audited, or responsibly retired. Trinity Hub specializes in enterprise computers, storage, networking equipment, and high-density compute.

Its public motto is **“Nothing useful is finished.”** On the floor, the more common phrase is **“Put it back in service.”**

Second Current is neither a secret laboratory nor a simple repair shop. It is simultaneously:

- a reverse-logistics operation receiving property with legal, warranty, security, and chain-of-custody constraints;
- a production floor measured by throughput, yield, repeat-return rate, and client-specific requirements;
- an engineering service capable of component-level Failure Analysis and rework;
- a quality system that must prove a unit matches its traveler, repair record, and release criteria;
- a parts, reclamation, and fulfillment network;
- a workplace where good intentions are continually pressured by schedules, contracts, incomplete data, and uneven authority.

The company does real social good by extending equipment life and reducing waste. It can also turn that mission into a slogan while asking people to meet incompatible targets. The story should be interested in that contradiction rather than deciding in advance that the company is heroic or corrupt.

## The operational world

The named areas below are the stable fictional workflow map, not a claim that every real depot uses the same org chart. Roles overlap, project cells vary, and experienced people cross-train.

| Area | Floor name | Primary story function | What it contributes to a Ticket |
| --- | --- | --- | --- |
| Logistics, returns, and receiving | **Inflow** | Establish where a unit came from and what happened before it reached the bench. | Identity, custody, packaging condition, accessories, client complaint, transit and environmental context. |
| Intake inspection and triage | **First Look** | Decide whether the unit is safe, complete, economically repairable, or affected by customer-induced damage. | Physical observations, visible damage, configuration baseline, disposition questions, initial candidate boundaries. |
| Systems test | **Rigline** | Reproduce the complaint and gather structured results with fixtures, software, scripts, diagnostics, and stress profiles. | Test executions, logs, measurements, pass/fail conditions, reproducibility, comparison data. |
| Failure Analysis | **Trace** | Interpret conflicting Evidence and locate the actionable fault or root causal chain. | Candidate reasoning, schematics, signal tracing, experiment design, Isolation, escalation, formal analysis. |
| Repair and rework | **Bench** | Change the unit: disassemble, replace, reseat, reconfigure, solder, clean, and rebuild. | Corrective procedures, parts consumption, repair quality, physical state changes, practical feedback about the diagnosis. |
| Total quality, audit, and release | **Validation Gate**, usually **Gate** | Independently check function, workmanship, unit identity, accessories, and the completeness of the record. | Post-repair Verify Evidence, documentation audit, rejection or release, repeat-return prevention. |
| Packing, fulfillment, and dispatch | **Outflow** | Return the correct, complete, protected unit to the correct destination with the correct record. | Final identity and accessory reconciliation, packaging profile, ship status, and later return-history clues. |

Supporting teams widen the world without requiring separate gameplay modes:

- **Materials and Parts Control** manages compatibility, consigned inventory, quarantined lots, known-good stock, and reclaimed components.
- **Reliability Engineering** studies patterns across Tickets and improves fixtures, procedures, and corrective actions.
- **Knowledge Systems** maintains the Worklog platform, searchable histories, test integrations, and the SIFT diagnostic assistant.
- **Client Programs** translates contracts, warranty rules, field descriptions, release criteria, and uncomfortable client conversations.
- **Reclamation** harvests, requalifies, and routes material from units that cannot return to service.
- **Global Desk** connects Trinity Hub to other service centers, specialists, and time zones.

These groups create story entrances. An episode can begin because Inflow finds a seal mismatch, Parts Control quarantines a DIMM lot, Gate rejects a supposedly repaired server, Outflow recognizes a serial number, or a remote engineer posts a test result at the end of their day. The playable repair activity can still remain on the Core Floor.

## The player's position

### Home team: First Look

The recommended protagonist begins in Intake Inspection, or **First Look**.

That position gives a new player a natural relationship to Observe. They encounter the machine before anyone has simplified its story, learn the difference between a symptom and a cause, and see the physical and documentary clues that later teams can lose. It also keeps the protagonist junior enough to learn from specialists without making them implausibly ignorant of the workplace.

### Role: Crossline Technician

Early in the campaign, the player is selected for Second Current's **Continuity Rotation**, a pilot intended to reduce repeat returns and information loss between teams. Participants retain a home team but rotate through Rigline, Trace, Bench, and Gate and shadow Inflow and Outflow. The campaign may recognize completed learning with honor-only Qualification badges, but those badges never grant cards, procedures, story access, deck legality, or match power.

Second Current created the program for practical reasons: a good handoff is cheaper than a second repair. The player's supervisor has a less comfortable reason: too many units are passing local metrics while failing the complete lifecycle.

The rotation solves several narrative and gameplay problems at once:

- one protagonist can build meaningful relationships in every part of the facility;
- new cards can be separately authored campaign rewards for learned procedures, technical Tools, and contacts; certification or Qualification recognition never grants or legalizes them;
- department identity can shape specialization without making ordinary reasoning impossible off-team;
- campaign chapters can change scenery and social pressure while the same troubleshooting loop remains legible;
- evidence gathered at one stage can matter several episodes later.

The protagonist is customizable in name, appearance, and pronouns. The campaign writes around a defined professional position and growth arc rather than a fixed face. If a fully authored lead is preferred later, the operational structure does not need to change.

### What the player learns

At the start, the protagonist is inclined to equate a restored symptom with a finished job. Their campaign growth is not “becoming the chosen genius.” It is learning to carry an explanation end to end:

1. notice without prematurely naming the cause;
2. make a useful Hypothesis rather than an exhaustive list;
3. choose a Test that can distinguish candidates;
4. state what the Evidence actually isolated;
5. repair the supported fault without hiding uncertainty;
6. verify the required operational state, not merely the disappearance of one symptom;
7. leave a record another person can trust.

## Why the gameplay happens

A narrative scene ends at a gameplay checkpoint when a **lot**, **incident queue**, or **repair shift** becomes actionable. The match is not a metaphorical battle. It is the work itself, compressed into authoritative decisions.

One episode might begin with Inflow announcing a rush batch of AI servers. Another might begin when Gate returns three units that passed a weak verification profile. A Client Programs scene may reveal a field condition, after which the player enters a match to investigate affected machines. A post-match scene interprets the Worklogs and connects local outcomes to the larger plot.

Campaign scenes should not reveal hidden faults the match expects the player to diagnose. They supply human stakes, admissible context, client constraints, and observations that the Ticket definition intentionally exposes.

## Story-to-gameplay mapping

| Gameplay concept | In-world reading | Boundary |
| --- | --- | --- |
| Repair Ticket | One unit, case, or authored service problem within a client lot. | A Ticket remains a scenario, not merely a Fault. |
| Shared Ticket queue | The active shift board or set of benches currently ready for action. | Tickets are jointly actionable unless an explicit effect says otherwise. |
| Hidden faults and causal chains | The machine's real state, which no character knows merely because the server does. | Narrative AI and computer technicians receive only player-safe information. |
| Visible Symptoms | Client complaints, condition notes, indicators, logs, and initial state available at intake. | Story scenes cannot leak authoritative hidden state. |
| Private Evidence | A technician's notebook, unsent result, or locally visible bench record. | Exact visibility follows the frozen defaults and later decisions. |
| Team Evidence | Results shared within a cooperative service cell. | Team visibility is not automatically public Documentation. |
| Worklog | The official chronological service record, including public actions and conclusions. | Later Documentation should not falsify event order. |
| Player deck | A prepared shift repertoire: procedures, available technical Tools, parts access, Commands, and trained workflows. | Cards are not literally a pack of cardboard carried on the floor. The frozen first-version deck economy applies; honor badges and cosmetics are not deck entries. |
| Drawing and searching | Which parts of that repertoire become available under limited time, attention, parts, and bench access. | This is a narrative metaphor, not a frozen explanation of draw rules. |
| Service Points | A readable gameplay measure of closure-settled causal Isolation and necessary Repair contributions. | Ticket closure itself is non-scoring. The fiction should not turn every human interaction into a KPI or imply that Tests, Verify, Documentation, assists, or Root Cause labels award separate first-version points. |
| Competitive play | Technicians working the same queue under an evaluation, certification trial, contract sprint, or friendly shift challenge. | Competition is about service quality and efficiency, not sabotage. |
| Cooperative play | A service cell responding to a shared workload or incident. | Individual contributions can remain attributable without breaking the team fiction. |
| Spectators | Trainees, remote specialists, auditors, or viewers of a sanctioned simulation. | Spectators receive only `PUBLIC_MATCH` state; presentation remains a UI question. |

## The loop as drama

The seven stages are not seven rooms and not a mandatory straight line.

- **Observe** creates tension by showing a concrete fact that does not yet explain itself.
- **Hypothesize** reveals character: two competent people can rank the same candidates differently.
- **Test** makes a choice costly because time and access are limited and some results are ambiguous.
- **Isolate** is the moment someone becomes accountable for an explanation.
- **Repair** changes the world and can expose whether the explanation was sufficient.
- **Verify** is where optimism meets a specified operating condition.
- **Document** decides whether the learning belongs only to the current technician or survives into the institution.

Negative Verify is especially valuable. A failed rebuild, recurring thermal shutdown, or missing lease after a configuration change can send the Ticket back through Hypothesize, Test, and Isolate while preserving the earlier action and Evidence. That loop is not narrative failure; it is troubleshooting.

## Campaign form

Each campaign episode can use the following rhythm without requiring every beat to appear on screen:

1. **Cold open:** a person elsewhere in the workflow notices a problem, request, or contradiction.
2. **Shift brief:** the player learns the lot, client, visible constraints, and social stakes.
3. **Bench preparation:** the player selects a legal deck and reviews player-safe context; cosmetics and honor-only Qualifications do not alter preparation.
4. **Match:** one or more Tickets enter the authoritative troubleshooting game.
5. **Gate review:** the fiction reacts to Verify results, Documentation quality, unnecessary work, unresolved uncertainty, and contribution history.
6. **After-shift scene:** relationships change; another part of the facility reveals what the local repair meant.
7. **Progression:** a separately authored campaign reward associated with mentorship, rotation, training, a technical Tool relationship, or new responsibility may make cards available; any certification or Qualification badge remains distinct honor-only recognition.
8. **Thread forward:** a serial, part lot, symptom pattern, client statement, or missing record connects to a later episode.

The result should be authored around ranges of legitimate outcomes, not only a single perfect score. A technically correct but poorly documented shift can advance the plot differently from a meticulous root-cause resolution. Exact branching and reward rules remain candidates.

## Campaign One candidate: The Quiet Cascade

### Inciting contract

Second Current wins a high-visibility recovery contract from **Civic Atlas Cooperative**, a regional operator that supplies compute capacity to municipal forecasting, clinics, schools, transit systems, and smaller research groups. Civic Atlas has pulled several mixed-generation AI and general-purpose servers from edge sites after a season of heat, dust, and unstable utility power.

The first lots look ordinary: failed power supplies, memory faults, degraded arrays, intermittent thermal shutdowns, missing devices, and network provisioning failures. The Core Floor knows how to handle all of them.

Then repaired units begin to return.

### The mystery

No single team sees the same problem:

- Inflow sees packaging changes, field dust, and repeat serial numbers.
- First Look sees inconsistent configuration and disputed customer-induced damage.
- Rigline sees units that pass the standard profile and fail under a client workload.
- Trace sees unrelated local faults but recurring gaps in the evidence.
- Bench sees compatible replacement parts that behave differently by lot.
- Gate sees verification steps completed without proving the client's required state.
- Outflow sees the same destinations receiving and returning the same families of machines.
- Knowledge Systems sees SIFT making confident recommendations from Worklogs that rarely preserve rejected hypotheses, negative Tests, or incomplete verification.

The “quiet cascade” is initially an organizational pattern: small omissions accumulate across handoffs until the company can no longer tell a repaired machine from a temporarily silent symptom.

The campaign may eventually identify one or more technical causal chains, supplier problems, field conditions, process defects, or client omissions. Their exact combination is **reserved** until the Ticket catalog and decision model can support the reveal fairly. The story must not solve its central mystery with a hidden fact that gameplay could never discover.

### Four-act spine

#### Act I — Learn the line

The player joins First Look, closes straightforward training cases, and learns why Inflow context and Gate criteria matter. A routine repair reaches Outflow. Its serial number returns before the player's rotation begins.

#### Act II — Follow the repeaters

The Continuity Rotation moves the player through Rigline, Trace, and Bench. Failed Verify reopens Diagnosis. Different mentors disagree about whether the problem is a weak test profile, rushed repair, contaminated parts, incomplete field reports, or a metric that rewards local success.

#### Act III — Read between Worklogs

The player gains enough access to compare cases across teams and sites. SIFT is revealed as useful but epistemically limited: it can rank what the company recorded, not recover what people omitted. Pressure rises to close the Civic Atlas contract before Second Current's public sustainability showcase.

#### Act IV — Put the truth in service

The final incident is a shared queue whose Tickets expose both technical faults and the consequences of earlier documentation. The climax is not defeating an evil AI. It is producing a defensible causal account, performing the necessary repairs, proving the required state, and deciding what Second Current tells its client and its own floor.

### Episode seeds

These are writing prompts rather than an approved campaign manifest:

- **One Amber Light:** a no-POST training unit teaches that restoring fan activity does not explain the remaining failure.
- **The Rush Lot:** Inflow receives mixed Civic Atlas servers with contested transit and field damage.
- **Passes Cold:** a unit succeeds on a short baseline and shuts down under sustained load.
- **Ready for Rebuild:** an apparently reasonable drive replacement fails verification and exposes a deeper storage problem.
- **No Offer:** a network Ticket reveals that the actionable repair may live in service capacity rather than in the physical unit.
- **Out of Box:** Gate rejects a functioning machine because unit identity, accessories, repair action, and traveler do not agree.
- **Same Serial, New Sticker:** Outflow recognizes a repeat return that local dashboards counted as two successful closures.
- **The Quiet Cascade:** a cooperative multi-Ticket incident requires evidence from the entire workflow.

## Sources of conflict

The story can sustain long-form tension without conventional combat:

- throughput targets versus diagnostic completeness;
- local team success versus end-to-end service outcome;
- client confidentiality versus cross-team learning;
- repairability versus CID, warranty, and economic disposition;
- reclaimed parts versus uncertain provenance;
- experienced intuition versus reproducible Evidence;
- automated recommendations versus the records used to produce them;
- documenting uncertainty versus appearing indecisive;
- public sustainability promises versus the cost of doing careful work;
- friendship across a shared queue when only one person receives visible credit.

No single manager needs to embody all institutional pressure. Most characters should have defensible reasons for what they protect.

## What this setting should avoid

- Do not turn teams into fantasy classes that prohibit a technician from observing, reasoning, or recording outside a rotation.
- Do not make every client machine essential to saving the world. Ordinary work creates contrast and credibility for critical incidents.
- Do not treat AI as omniscient, conscious by default, or automatically malicious. SIFT is a tool operating on incomplete player-safe records.
- Do not make competitive technicians sabotage machines, hide safety issues, or attack one another to score.
- Do not equate a successful part swap with proven Isolation.
- Do not make Documentation a post-episode lore dump. It is an operational act with chronology, audience, and consequences.
- Do not use fictional future technology to hand-wave away the real technical concepts the game aims to teach.

## Working premises that need user review

The following choices make the package coherent but are not frozen canon:

1. the year **2049**;
2. **Trinity Hub** as the primary North Texas location;
3. **Second Current Serviceworks** as the fictional company;
4. **First Look** as the protagonist's home team and **Continuity Rotation** as the cross-team mechanism;
5. **The Quiet Cascade** and Civic Atlas as the first campaign frame;
6. **SIFT** as a fallible, non-sentient diagnostic recommendation system built from service records;
7. a customizable player-character supported by an authored ensemble rather than one fixed protagonist.

The most important choice is not any proper noun. It is the premise that **lost context across handoffs is the story-scale version of a hidden causal chain**. That directly serves the gameplay already in the repository.
