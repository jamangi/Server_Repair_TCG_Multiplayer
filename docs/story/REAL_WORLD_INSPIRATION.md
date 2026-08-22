# Real-world operational inspiration

Status: **sourced research boundary; not fiction canon and not an SMS InfoComm org chart**<br>
Sources last checked: **2026-08-21**

## Why this file exists

Second Current Serviceworks is fictional. SMS InfoComm, Wistron, their employees, clients, facilities, and programs are real. This file records which broad operational ideas are grounded in public sources and which team boundaries are fictional adaptations.

Job postings describe particular projects at a particular time. They are useful evidence of responsibilities and handoffs, but they do not prove that every SMS location or client program uses the same structure.

## What SMS InfoComm is

SMS InfoComm presents itself as a global product- and device-lifecycle services business within the Wistron group. Its public material spans reverse logistics, returns management, warranty and case management, whole-unit and component repair, motherboard and GPU work, refurbishment and remanufacture, parts reclamation, warehousing, spare-parts fulfillment, and configure-to-order services.

The official global-operations page says its Service & Recycling Business Group leadership is based in Taipei. It describes the Americas hub as providing logistics, parts distribution, repair, and refurbishment, with Texas operations dating to 1996 and Grapevine operations to 2005. Other centers offer different combinations of repair, RMA/RTV management, warehousing, fulfillment, recycling, field service, and customer support.

Useful first-party summaries:

- [SMS InfoComm — company overview](https://www.smsinfocomm.com/index.html)
- [SMS InfoComm — solutions](https://www.smsinfocomm.com/Solutions.html)
- [SMS InfoComm — whole-unit and component repair](https://www.smsinfocomm.com/Solutions_1.html)
- [SMS InfoComm — global operations](https://www.smsinfocomm.com/GlobalOperation.html)
- [SMS InfoComm — careers and cross-training](https://www.smsinfocomm.com/Careers.html)
- [Wistron — company profile](https://www.wistron.com/en/AboutWistron/CompanyProfile)

The most accurate short description for story research is therefore:

> SMS InfoComm is a Wistron-group lifecycle-services operation that receives, tracks, tests, repairs, refurbishes, audits, fulfills, and recovers value from electronic and ICT products through client-specific service programs.

That is broader than a server-repair floor. Server, switch, router, motherboard, component-level, BGA, x-ray, and Failure Analysis work are important subsets of a larger reverse-logistics and after-sales system.

## Does the proposed workflow hold up?

Broadly, yes. The proposed sequence is a strong fictional abstraction of a depot flow. The public evidence is less supportive of treating every step as a permanently separate team.

| Proposed area | Public evidence | Story-research conclusion |
| --- | --- | --- |
| Logistics and Receiving / Inflow | SMS publicly offers return-device logistics, RMA processing, case tracking, inventory management, auto receiving, hub warehousing, and return-flow track/trace/transport/test/triage. | Strong workflow boundary. Exact receiving-team names are program-specific. |
| Inspect | Public material names triage and grading. A current L3 server-motherboard role checks customer-induced damage and repairability before repair. TQC and out-of-box roles also perform visual inspection. | Inspection is real, but public evidence does not establish one universal standalone “Inspect Team.” Inspection can occur at intake, repair, and quality. |
| Test | SMS describes automated testing and grading, standalone or designated test environments, test-result visibility, and test automation. The L3 board role performs a quick test before sending work to a Test team. A Test Engineer posting describes test-procedure design, execution, data analysis, defect identification, and technical reporting. | Strong functional and, in at least one program, explicit team boundary. Test engineering and production test should not be conflated automatically. |
| Diagnostic / Failure Analysis | Current Failure Analysis roles investigate root causes, inspect systems and components, perform component-level troubleshooting, analyze test data, use instruments, reproduce failures, document results, and communicate findings to clients and internal teams. | Strong named specialty. Its responsibilities overlap inspection, Test, Repair, and Document. |
| Repair | SMS advertises whole-unit, motherboard, GPU, component-level, BGA, fine-pitch soldering, and Level 0–4 repair. Current server roles include disassembly, parts replacement, troubleshooting, isolation, soldering, cleaning, and quick test. | Strong central function with skill/repair levels and project-specific divisions. |
| TQC and Audit | Current TQC and out-of-box roles visually inspect workmanship and cosmetics, perform hardware/software checks, compare the physical unit with its traveler, check the customer complaint and technician repair action, verify accessories, and release or reject sampled work. | Strong independent quality/release function combining Verify and Documentation audit. |
| Packing, Fulfillment, and Outflow | SMS publicly offers procurement, warehousing, spare-parts fulfillment, device swap, pick/pack/kitting, hub distribution, and return/replacement logistics. TQC postings explicitly mention repackaging and movement to outbound shipping stations. | Strong workflow boundary. Exact packing and fulfillment teams vary by program. |

## The most important correction: responsibility overlaps

The [current L3 Server MB Repair posting](https://www.linkedin.com/jobs/view/tech-l3-server-mb-repair-at-sms-infocomm-4453362274) is especially informative. It assigns one technician to:

- identify and narrow a server-motherboard problem;
- check customer-induced damage and repairability;
- troubleshoot and repair the board;
- perform component-level solder work and inspect workmanship;
- perform a quick test before sending the board to the Test team;
- keep ESD and production records;
- rotate into inspection, soldering, testing, or data input when project needs change.

That is Observe, Test, Isolate, Repair, a limited Verify handoff, and Document responsibility within one role. It argues against a fiction where every technician can perform only one lifecycle verb.

The [Failure Analysis Engineer posting](https://www.linkedin.com/jobs/view/engineer-failure-analysis-at-sms-infocomm-4388741741) similarly combines visual inspection, system and component troubleshooting, repair when required, root-cause research, record development, formal reporting, and client communication. A more specialized [Failure Analysis L2 posting](https://www.linkedin.com/jobs/view/engineer-failure-analysis-l2-at-sms-infocomm-4435887423) adds experiment design, x-ray, oscilloscope, multimeter, thermal-camera work, micro-soldering, corrective action, and training.

The current [TQC clerk description](https://www.linkedin.com/jobs/view/clerk-tqc-mid-shift-depot-dept-iii-at-sms-infocomm-4432432279) and [out-of-box auditor description](https://www.linkedin.com/jobs/view/auditor-out-of-box-mid-shift-at-sms-infocomm-4416405478) both combine visual, functional, and documentation checks. Quality is therefore not simply “run one last stress test.” It verifies that the unit, work, accessories, traveler, problem description, and repair action agree.

A current [Test Engineer L2 description](https://www.ziprecruiter.com/c/SMS-INFOCOMM/Job/Engineer-Test-L2/-in-Grapevine%2CTX?jid=f16763726fd5134f) covers establishing procedures, coordinating quality-control tests, developing digital data collection, evaluating results, identifying defects, continuing until requirements are satisfied, and writing technical reports. Like every posting, it supports the responsibilities of one role rather than a universal policy statement.

## Repair levels are not the same as teams

SMS's official repair page describes a Level 0–4 capability model:

- Level 0: dead-on-arrival/no-trouble-found handling and accessory replacement;
- Level 1: screen, clean, and software or firmware work;
- Level 2: component or part replacement and basic electronic/PCB fault work;
- Level 3: multi-solder-point work and motherboard replacement;
- Level 4: debugging, troubleshooting, BGA, and Failure Analysis.

These are capability or repair-complexity bands. They should not be copied into fiction as five guaranteed departments. Job titles also vary: a “Tech L3” can describe senior component work, while a separate Failure Analysis engineer may still own the formal root-cause process.

## Cross-training is directly supported

SMS's [careers page](https://www.smsinfocomm.com/Careers.html) explicitly emphasizes training, cross-training, mentorship, promotion from within, global collaboration, digital tools, and hiring across Logistics, Quality, Engineering, and Sustainability. The L3 job description also allows reassignment among inspection, soldering, testing, and data entry according to project need.

This makes a fictional rotation program more grounded than an unrestricted “chosen technician” who somehow outranks every specialist. A participant can retain a home team, earn scoped qualifications, and move with the work while still depending on mentors and formal handoffs.

## Fictional adaptation used by this story package

The fiction keeps the real operational logic and changes the identifying particulars:

| Grounded inspiration | Fictional transformation |
| --- | --- |
| Global lifecycle and reverse-logistics service network | Second Current Serviceworks, a wholly fictional company with invented history, clients, systems, and culture. |
| Texas logistics/repair presence | Trinity Hub, a fictional North Texas campus with no copied address, layout, client program, or personnel. |
| Client-specific service cells and overlapping duties | A stable story map—Inflow, First Look, Rigline, Trace, Bench, Gate, Outflow—with explicit role overlap. |
| Cross-training and internal development | The invented Continuity Rotation, designed to reduce information loss between handoffs. |
| Test automation, data systems, and AI interest | SIFT, an invented non-sentient recommendation system limited to recorded, player-safe information. |
| Triage, CID, repairability, testing, Failure Analysis, repair, audit, and fulfillment | The campaign's sources of scenes and character relationships, not copied procedures or confidential operating details. |
| Product-life extension and sustainability | The “post-disposable” 2049 setting and the company's morally mixed public mission. |

## Safe-use rules for later writers

- Do not use SMS, Wistron, real facility project codes, client names, logos, addresses, quotas, or identifiable employees as fictional canon.
- Do not present a current job posting as a complete corporate org chart or permanent policy.
- Do not copy proprietary procedure wording or imply access to nonpublic service data.
- Preserve the insight that inspection, test, analysis, repair, quality, and documentation overlap.
- Use real responsibilities to improve plausibility, then invent company-specific names, conflicts, relationships, and events.
- Recheck external links before publication; job postings are especially likely to expire.

## Answer to the original team question

The four-sector model is a sound worldbuilding map:

1. Inflow;
2. a Core Technical Floor containing inspection/triage, systems Test, Failure Analysis, and Repair specialties;
3. an independent quality and audit gate;
4. Outflow and fulfillment.

The evidence supports all of those **functions**. It does not establish that SMS universally organizes them as exactly those eight fixed teams. The most realistic fictional version keeps the spatial flow, gives people home functions, and lets assignments and qualifications overlap. That is the model adopted in [`STORY.md`](STORY.md).
