import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { validateStoryPack } from './index.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const OUTPUT_ROOT = path.join(ROOT, 'content/story-v1/candidates/quiet-cascade-expansion-v3');
const BLUEPRINT_PATH = path.join(ROOT, 'docs/story/revisions/quiet-cascade-expansion-v3/blueprint.json');
const GRAPH_REPORT_PATH = path.join(ROOT, 'docs/story/revisions/quiet-cascade-expansion-v3/GRAPH_REPORT.json');
const MATCHES_PATH = path.join(ROOT, 'automated_games/task-043-quiet-cascade-expansion-v3/match-registry.json');
const BUILDER_PROOF_PATH = path.join(ROOT, 'automated_games/task-043-quiet-cascade-expansion-v3/builder-proof.json');
const BASE_ROOT = path.join(ROOT, 'content/story-v1/campaigns/quiet-cascade-characterization-v2');
const CONTENT_VERSION = 'quiet-cascade-expansion-v3';
const STATUS = 'CANDIDATE_NON_LIVE';

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));
const jsonText = (value) => `${JSON.stringify(value, null, 2)}\n`;
const blueprint = readJson(BLUEPRINT_PATH);
const graphReport = readJson(GRAPH_REPORT_PATH);
const matchRegistry = readJson(MATCHES_PATH);
const builderProof = readJson(BUILDER_PROOF_PATH);
const baseRegistry = readJson(path.join(BASE_ROOT, 'registry.json'));
const baseTexts = readJson(path.join(BASE_ROOT, 'texts/en.json')).entries;

const episodeByShift = new Map(blueprint.episodes.map((episode) => [episode.shift_number, episode]));
const matchByRef = new Map(matchRegistry.matches.map((match) => [match.match_ref, match]));
const proofByCase = new Map(builderProof.matches.map((match) => [match.case_id, match]));
const textEntries = {};
const displays = [];

const character = {
  sora: 'story.character.sora_chen',
  malik: 'story.character.malik_okoye',
  hana: 'story.character.hana_park',
  jonah: 'story.character.jonah_reed',
};

const castTag = {
  [character.sora]: 'cast.sora',
  [character.malik]: 'cast.malik',
  [character.hana]: 'cast.hana',
  [character.jonah]: 'cast.jonah',
};

const voiceFingerprint = {
  [character.sora]: 'CONDITIONAL_COMPARISON',
  [character.malik]: 'CONTROLLED_DEMONSTRATION',
  [character.hana]: 'AUDITABLE_CRITERIA',
  [character.jonah]: 'PROVENANCE_CHAIN',
};

const preMatchLeakageContracts = {
  'exp-001': [
    {
      concept_id: 'REQUIRED_SOCKET_CONTACT_DIAGNOSTIC_OR_RESPONSE',
      forbidden_phrases: ['magnified socket inspection', 'inspect the socket contacts', 'restore the socket contacts'],
    },
  ],
  'exp-002': [
    {
      concept_id: 'REQUIRED_DISTRIBUTION_PATH_DIAGNOSTIC_OR_RESPONSE',
      forbidden_phrases: ['distribution path isolation', 'each supply in each bay', 'replace the distribution board'],
    },
  ],
  'exp-003': [
    {
      concept_id: 'REQUIRED_PREDICTIVE_HEALTH_DIAGNOSTIC_OR_RESPONSE',
      forbidden_phrases: ['predictive health test', 'replace the predictive drive', 'replace the drive'],
    },
  ],
  'exp-004': [
    {
      concept_id: 'REQUIRED_EVENT_FRESHNESS_DIAGNOSTIC_OR_RESPONSE',
      forbidden_phrases: ['event-log freshness', 'event log freshness', 'clear the stale alert'],
    },
  ],
  'exp-005': [
    {
      concept_id: 'REQUIRED_VERSION_AND_LINK_DIAGNOSTIC_PAIR_OR_RESPONSE',
      forbidden_phrases: ['version compatibility test', 'link-counter soak', 'link counter soak', 'two independent observations', 'restore compatible versions'],
    },
  ],
  'exp-006': [
    {
      concept_id: 'REQUIRED_RECOVERY_STATE_DIAGNOSTIC_OR_RESPONSE',
      forbidden_phrases: ['bmc recovery-state test', 'bmc recovery state test', 'inspect the recovery interface', 'recover bmc firmware'],
    },
  ],
};

const publicOutcomePrinciples = {
  S07_COMPLETED_SCOPE: {
    copy: 'This Match returned COMPLETED. That status belongs to this Ticket and does not decide why another machine behaves differently.',
    summary: 'Confine completed status to this Ticket and reject applying it to another machine.',
  },
  S07_COMPLETED_FORWARD: {
    copy: 'For the next Ticket, record what moved, what stayed fixed, and which conditions surrounded each new comparison.',
    summary: 'Teach controlled-comparison framing as a forward-looking public principle.',
  },
  S07_ABANDONED_SCOPE: {
    copy: 'This Match returned ABANDONED. This handoff adds no diagnosis, action, or closure beyond that bounded result.',
    summary: 'State abandonment while adding no private diagnosis, action, or closure.',
  },
  S07_ABANDONED_FORWARD: {
    copy: 'For any fresh attempt, treat its observation window as new work and name what changed versus what stayed fixed.',
    summary: 'Teach fresh-window comparison discipline without claiming prior Match work.',
  },
  S08_COMPLETED_SCOPE: {
    copy: 'This Match returned COMPLETED. Gate accepts that status for this Ticket without extending its explanation to another case.',
    summary: 'Confine completed status to this Ticket.',
  },
  S08_COMPLETED_FORWARD: {
    copy: 'For the next Ticket, keep what was reported separate from the explanation being proposed, and require new Evidence before choosing between local and shared context.',
    summary: 'Teach report-versus-explanation discipline prospectively.',
  },
  S08_ABANDONED_SCOPE: {
    copy: 'This Match returned ABANDONED. This handoff adds no tested configuration, isolated part, or closure beyond that bounded result.',
    summary: 'State abandonment without inventing tests, Isolation, or closure.',
  },
  S08_ABANDONED_FORWARD: {
    copy: 'A fresh attempt must earn its own distinction between the report, its location, and any shared context.',
    summary: 'Teach fresh report-location-context discrimination without claiming prior Match work.',
  },
  S09_COMPLETED_SCOPE: {
    copy: 'This Match returned COMPLETED. That status is scoped to this Ticket and does not dictate the same diagnosis or response for another one.',
    summary: 'Confine completed status to this Ticket.',
  },
  S09_COMPLETED_FORWARD: {
    copy: 'I keep old transit maps because routes stay legible when their stops remain distinct. On the next warning, keep intervention and acceptance as separate stops.',
    summary: 'Teach separate intervention and acceptance boundaries prospectively with restrained Jonah texture.',
  },
  S09_ABANDONED_SCOPE: {
    copy: 'This Match returned ABANDONED. This handoff adds no action, accepted state, or closure beyond that bounded result.',
    summary: 'State abandonment without inventing action, acceptance, or closure details.',
  },
  S09_ABANDONED_FORWARD: {
    copy: 'On a fresh attempt, protect what the Ticket says is at risk and decide separately what would count as acceptance.',
    summary: 'Teach prospective risk protection and independent acceptance.',
  },
  S10_COMPLETED_SCOPE: {
    copy: 'This Match returned COMPLETED. Gate accepts that status for this Ticket without turning it into a verdict for another case.',
    summary: 'Confine completed status to this Ticket.',
  },
  S10_COMPLETED_FORWARD: {
    copy: 'For a later review, preserve the before-state and time before changing any record; a tidy after-state is not a substitute for provenance.',
    summary: 'Teach preserve-before-change provenance prospectively.',
  },
  S10_ABANDONED_SCOPE: {
    copy: 'This Match returned ABANDONED. This scene adds no explanation, change, or closure beyond that bounded result.',
    summary: 'State abandonment without inventing an explanation, change, or closure.',
  },
  S10_ABANDONED_FORWARD: {
    copy: 'A fresh review should preserve source, target, condition, output, and time before any state changes.',
    summary: 'Teach prospective provenance capture without claiming prior observations.',
  },
  S11_COMPLETED_SCOPE: {
    copy: 'This Match returned COMPLETED. That status is scoped to this Ticket and does not make a sequence into a cause somewhere else.',
    summary: 'Confine completed status and causal meaning to this Ticket.',
  },
  S11_COMPLETED_FORWARD: {
    copy: 'For a later correlation, keep prior state, intervening change, observation window, and result together; sequence may open a question, but it cannot settle one.',
    summary: 'Teach prospective corroboration without claiming private observations.',
  },
  S11_ABANDONED_SCOPE: {
    copy: 'This Match returned ABANDONED. This scene adds no elimination, observation count, or causal claim beyond that result.',
    summary: 'State abandonment without inventing eliminations, observations, or cause.',
  },
  S11_ABANDONED_FORWARD: {
    copy: 'A fresh attempt begins a new observation window; prior context may guide it, but cannot count as a test that survived interruption.',
    summary: 'Teach fresh-window interruption discipline without claiming prior tests.',
  },
  S12_COMPLETED_SCOPE: {
    copy: 'This Match returned COMPLETED. Gate accepts that status for this Ticket without inventing which private steps produced it.',
    summary: 'Confine completed status to this Ticket without inventing its sequence.',
  },
  S12_COMPLETED_FORWARD: {
    copy: 'For a later high-risk Ticket, keep observation, authorized action, and independent acceptance as separate entries; the explanation should survive transfer without becoming an instruction.',
    summary: 'Teach prospective authority and acceptance separation without claiming private Match details.',
  },
  S12_ABANDONED_SCOPE: {
    copy: 'This Match returned ABANDONED. This scene adds no state finding, action, or successful acceptance beyond that bounded result.',
    summary: 'State abandonment without inventing a finding, action, or acceptance.',
  },
  S12_ABANDONED_FORWARD: {
    copy: 'On a fresh attempt, record what is known, what authority is missing, and which acceptance boundary must be met before work can be called complete.',
    summary: 'Teach prospective authority and acceptance bounds without claiming prior work.',
  },
};

const scenes = {
  trace: {
    background: 'story.bg.trinity.trace.night',
    location: 'text.qc01.location.trace',
    time: 'text.qc01.time.late_shift',
  },
  core: {
    background: 'story.bg.trinity.core_floor.night_storm',
    location: 'text.qc01.location.core_floor',
    time: 'text.qc01.time.late_shift',
  },
  knowledge: {
    background: 'story.bg.trinity.knowledge_systems.night',
    location: 'text.qc01.location.knowledge',
    time: 'text.qc01.time.late_shift',
  },
  gate: {
    background: 'story.bg.trinity.validation_gate.predawn',
    location: 'text.qc01.location.gate',
    time: 'text.qc01.time.predawn',
  },
};

function line(key, speaker, text, semanticPayload, contextRungs, sourceEvents = [], authorityBound = 'PUBLIC_CONTEXT_ONLY', textureSource = null, sourceCaseId = null) {
  return {
    key,
    kind: speaker ? 'SAY' : 'NARRATE',
    speaker,
    text,
    semanticPayload,
    contextRungs,
    technicalClaim: sourceEvents.length > 0,
    sourceEvents,
    authorityBound,
    textureSource,
    sourceCaseId,
  };
}

function outcomeLine(key, speaker, completion, publicPrincipleId, contextRungs, textureSource = null) {
  const principle = publicOutcomePrinciples[publicPrincipleId];
  if (!principle) throw new Error(`Unknown public outcome principle ${publicPrincipleId}`);
  return {
    ...line(
      key,
      speaker,
      principle.copy,
      `Use normalized result field completion=${completion} only; ${principle.summary} No private Match Evidence, diagnosis, action sequence, or technical outcome is asserted.`,
      contextRungs,
      [],
      'NORMALIZED_MATCH_RESULT_ONLY',
      textureSource,
    ),
    outcomeContract: {
      normalizedResultFields: ['completion'],
      expectedCompletion: completion,
      publicProcessPrincipleId: publicPrincipleId,
      privateMatchDetailsClaimed: false,
    },
  };
}

const episodeCopy = {
  7: {
    scene: 'trace',
    cast: [[character.sora, 'focused', 'RIGHT'], [character.malik, 'focused', 'LEFT']],
    intro: [
      line('entry.01', null, 'Night shift leaves Trace quiet enough to hear the four-socket server restart, stop during its startup self-check, and return to silence.', 'The environment exposes the reported full-population no-POST condition before anyone interprets it.', ['ENVIRONMENT', 'PAIN_POINT'], [1]),
      line('entry.02', character.sora, 'POST is the machine’s power-on self-test. This one completes it with two processors, but not with the full four. That difference opens a question; it does not condemn a processor.', 'Define POST, ordinary startup behavior, and the limit of the population-dependent symptom.', ['NAME', 'NORMAL', 'FAILURE', 'INSIGHT'], [1, 2]),
      line('entry.03', character.malik, 'A processor can move. A socket cannot. The processors have worked in other supported pairings, so keep part identity separate from the fixed location and the board path around it.', 'Explain component-versus-location comparison without supplying the required diagnostic.', ['PROCEDURE', 'INSIGHT', 'ACTION'], [3, 6]),
      line('entry.04', character.sora, 'The live Candidates still include processor seating, memory, the socket path, and the wider board. We need Evidence that makes one location behave differently under a controlled comparison.', 'Preserve the public Candidate set and the need for discriminating Evidence.', ['NAME', 'ACTION'], [2, 3, 6]),
    ],
    choice: {
      id: 'choice.qc02.initial_evidence_frame',
      variable: 'story.qc02.initial_evidence_frame',
      promptKey: 'choice.initial.prompt',
      prompt: 'Which evidence should lead the handoff?',
      options: [
        {
          id: 'location_context_first', value: 'LOCATION_CONTEXT_FIRST', label: 'story.qc02.shift07.frame.location_context_first', key: 'choice.initial.location',
          text: 'Lead with the fixed location and population context.',
          branchLine: line('frame.location.01', character.sora, 'Lead with where the failure follows the configuration. Then attach every comparison that keeps known-good parts from inheriting the blame.', 'The selected presentation order leads with location context while preserving comparisons.', ['ACTION'], [], 'PRESENTATION_ORDER_ONLY'),
        },
        {
          id: 'controlled_comparison_first', value: 'CONTROLLED_COMPARISON_FIRST', label: 'story.qc02.shift07.frame.controlled_comparison_first', key: 'choice.initial.comparison',
          text: 'Lead with the controlled part and population comparisons.',
          branchLine: line('frame.comparison.01', character.malik, 'Lead with the controlled comparisons. I like a tidy table—monthly puzzle night has consequences—but name the fixed location it leaves behind.', 'The selected presentation order leads with comparisons while preserving location context.', ['ACTION'], [], 'PRESENTATION_ORDER_ONLY', 'malik_monthly_puzzle_night'),
        },
      ],
    },
    launch: line('match.01', character.sora, 'The Ticket owns the diagnosis. Use the deck to Observe, test competing Hypotheses, and Isolate an actionable fault before any Repair.', 'Story yields all diagnostic and response authority to the Match.', ['ACTION'], [], 'NO_GAMEPLAY_AUTHORITY'),
    successCast: [[character.sora, 'approving', 'RIGHT'], [character.malik, 'focused', 'LEFT']],
    success: [
      outcomeLine('success.01', character.sora, 'COMPLETED', 'S07_COMPLETED_SCOPE', ['CONSEQUENCE', 'INSIGHT']),
      outcomeLine('success.02', character.malik, 'COMPLETED', 'S07_COMPLETED_FORWARD', ['REINFORCEMENT']),
    ],
    abandonCast: [[character.sora, 'focused', 'RIGHT'], [character.malik, 'focused', 'LEFT']],
    abandon: [
      outcomeLine('abandon.01', character.sora, 'ABANDONED', 'S07_ABANDONED_SCOPE', ['CONSEQUENCE', 'ACTION']),
      outcomeLine('abandon.02', character.malik, 'ABANDONED', 'S07_ABANDONED_FORWARD', ['CONSEQUENCE']),
    ],
    followScene: 'core',
    followCast: [[character.malik, 'focused', 'LEFT']],
    follow: [line('follow.01', character.malik, 'The next unit also asks whether a replaceable part failed or whether the shared path around it did. This time the path carries redundant power.', 'Carry component-versus-shared-path practice into Shift 8.', ['REINFORCEMENT'], [2, 4], 'PUBLIC_CONTEXT_ONLY', null, 'exp-002')],
  },
  8: {
    scene: 'core',
    cast: [[character.malik, 'focused', 'LEFT'], [character.hana, 'skeptical', 'RIGHT']],
    intro: [
      line('entry.01', null, 'A redundant-power server starts for a moment, reports voltage outside its allowed range, and shuts down before useful work can begin.', 'Establish the voltage-alert and immediate-shutdown symptom before interpretation.', ['ENVIRONMENT', 'FAILURE', 'CONSEQUENCE'], [1]),
      line('entry.02', character.malik, 'Two power supplies sit in separate bays, but their paths eventually meet inside the chassis. Useful Evidence must distinguish a removable part, one location, and something shared downstream without assuming which safe comparison will do it.', 'Explain ordinary redundant-power layout and the discrimination goal without prescribing the required diagnostic.', ['NORMAL', 'PROCEDURE', 'ACTION'], [4]),
      line('entry.03', character.hana, 'The alert names a measured voltage condition. It does not name the failed part. If the record turns the alert label into a diagnosis, Gate cannot tell what was actually ruled out.', 'Explain the pain caused by treating an alert label as causal proof.', ['PAIN_POINT', 'CONSEQUENCE', 'INSIGHT'], [1, 2]),
      line('entry.04', character.malik, 'The minimum configuration still fails, and the live Candidates include supply, seating or input, distribution path, and system board. Preserve every arrangement and result.', 'Present source-supported public comparisons and remaining Candidates.', ['PROCEDURE', 'ACTION'], [2, 3, 4, 5]),
    ],
    launch: line('match.01', character.hana, 'Locate the fault through Match Evidence. A familiar warning earns no shortcut through Isolate.', 'Yield diagnostic authority to the Match.', ['ACTION'], [], 'NO_GAMEPLAY_AUTHORITY'),
    successCast: [[character.malik, 'focused', 'LEFT'], [character.hana, 'relief', 'RIGHT']],
    success: [
      outcomeLine('success.01', character.hana, 'COMPLETED', 'S08_COMPLETED_SCOPE', ['CONSEQUENCE', 'INSIGHT']),
      outcomeLine('success.02', character.malik, 'COMPLETED', 'S08_COMPLETED_FORWARD', ['REINFORCEMENT']),
    ],
    abandonCast: [[character.malik, 'defensive', 'LEFT'], [character.hana, 'skeptical', 'RIGHT']],
    abandon: [
      outcomeLine('abandon.01', character.hana, 'ABANDONED', 'S08_ABANDONED_SCOPE', ['CONSEQUENCE', 'ACTION']),
      outcomeLine('abandon.02', character.malik, 'ABANDONED', 'S08_ABANDONED_FORWARD', ['REINFORCEMENT']),
    ],
    followScene: 'gate',
    followCast: [[character.hana, 'relief', 'RIGHT']],
    follow: [line('follow.01', character.hana, 'The next warning arrives before the service disappears. Acting early still requires an accountable fault, a protected repair, and proof that recovery finished.', 'Introduce predictive failure as actionable before outage.', ['FOLLOW_ON'], [1, 5, 6], 'PUBLIC_CONTEXT_ONLY', null, 'exp-003')],
    ack: {
      variable: 'story.qc02.initial_evidence_frame',
      thenValue: 'LOCATION_CONTEXT_FIRST',
      elseValue: 'CONTROLLED_COMPARISON_FIRST',
      thenLabel: 'story.qc02.shift08.initial_frame_ack.location_context_first',
      elseLabel: 'story.qc02.shift08.initial_frame_ack.controlled_comparison_first',
      thenLine: line('ack.initial.location.01', character.hana, 'You led the first brief with the fixed location. This handoff kept that location visible while adding the controlled comparisons beside it; presentation order changed no Match authority.', 'Acknowledge the remembered location-first framing and its presentation-only consequence.', ['REINFORCEMENT'], [], 'PRESENTATION_ORDER_ONLY'),
      elseLine: line('ack.initial.comparison.01', character.hana, 'You led the first brief with controlled comparisons. This handoff kept those conditions visible while naming the fixed location beside them; presentation order changed no Match authority.', 'Acknowledge the remembered comparison-first framing and its presentation-only consequence.', ['REINFORCEMENT'], [], 'PRESENTATION_ORDER_ONLY'),
    },
  },
  9: {
    scene: 'core',
    cast: [[character.jonah, 'thoughtful', 'LEFT'], [character.hana, 'skeptical', 'RIGHT']],
    intro: [
      line('entry.01', null, 'One member of a mirrored storage array remains online while its bay alternates amber and green and management reports predictive failure.', 'Establish the still-operating member and matching predictive warning.', ['ENVIRONMENT', 'FAILURE'], [1, 3]),
      line('entry.02', character.jonah, 'A mirrored array keeps equivalent data on more than one member so one path can fail without immediate service loss. Predictive means the controller sees risk before the member is fully offline; it is not a completed outage.', 'Define the storage environment and predictive state for a newcomer.', ['NAME', 'NORMAL', 'FAILURE'], [1, 3]),
      line('entry.03', character.hana, 'Early action is responsible only if member identity, current data protection, change authorization, and an independently checked array state remain explicit. “Action taken” is not an acceptance test.', 'Explain the safe change and independent-acceptance boundary without prescribing the Repair or Verify.', ['PROCEDURE', 'PAIN_POINT', 'CONSEQUENCE'], [4, 5, 6]),
      line('entry.04', character.jonah, 'The warning, bay indicator, and controller member record point to the same location. The Match must still distinguish predictive media risk from a member that has already failed.', 'Present source-supported correlation while preserving the exact two public Candidates.', ['INSIGHT', 'ACTION'], [1, 2, 3]),
    ],
    launch: line('match.01', character.hana, 'Protect the data first. Then let current Evidence support Isolate, Repair, independent Verify, and Documentation in that order.', 'Yield action authority to the Match under a data-preservation boundary.', ['ACTION'], [], 'NO_GAMEPLAY_AUTHORITY'),
    successCast: [[character.jonah, 'thoughtful', 'LEFT'], [character.hana, 'relief', 'RIGHT']],
    success: [
      outcomeLine('success.01', character.hana, 'COMPLETED', 'S09_COMPLETED_SCOPE', ['CONSEQUENCE', 'INSIGHT']),
      outcomeLine('success.02', character.jonah, 'COMPLETED', 'S09_COMPLETED_FORWARD', ['REINFORCEMENT'], 'jonah_transit_map_archive'),
    ],
    abandonCast: [[character.jonah, 'thoughtful', 'LEFT'], [character.hana, 'skeptical', 'RIGHT']],
    abandon: [
      outcomeLine('abandon.01', character.hana, 'ABANDONED', 'S09_ABANDONED_SCOPE', ['CONSEQUENCE', 'ACTION']),
      outcomeLine('abandon.02', character.jonah, 'ABANDONED', 'S09_ABANDONED_FORWARD', ['INSIGHT']),
    ],
    followScene: 'knowledge',
    followCast: [[character.jonah, 'thoughtful', 'LEFT'], [character.hana, 'skeptical', 'RIGHT']],
    follow: [line('follow.01', character.jonah, 'Now we have the opposite problem: the hardware looks healthy while a management warning refuses to leave. Current state and recorded history have to be compared before either is trusted as the complete account.', 'Transition from predictive current evidence to a potentially historical alert.', ['FOLLOW_ON'], [1], 'PUBLIC_CONTEXT_ONLY', null, 'exp-004')],
  },
  10: {
    scene: 'knowledge',
    cast: [[character.jonah, 'defensive', 'LEFT'], [character.hana, 'skeptical', 'RIGHT']],
    intro: [
      line('entry.01', null, 'The management console still marks the storage backplane degraded. Current drive inventory and physical indicators show no matching present failure.', 'Establish the conflict between persistent alert and current hardware evidence.', ['ENVIRONMENT', 'FAILURE'], [1]),
      line('entry.02', character.jonah, 'A management alert is a recorded state, not the hardware itself. It may describe a live condition, an earlier event, or state that was never refreshed after the machine changed.', 'Explain the management surface and its possible temporal meanings.', ['NAME', 'NORMAL', 'FAILURE'], [1, 2]),
      line('entry.03', character.hana, 'At the community orchestra, I reconcile the ledger after the event, not instead of it. Here, changing management state first would alter the record we need to judge. Preserve current chronology and device state before any action rewrites that surface.', 'Explain preserve-before-change and the Test-versus-Repair boundary.', ['PROCEDURE', 'PAIN_POINT', 'ACTION'], [3, 4], 'PUBLIC_CONTEXT_ONLY', 'hana_community_orchestra_treasurer'),
      line('entry.04', character.jonah, 'The live Candidates are a current backplane-path problem and obsolete management state. Search can organize what exists; it cannot recover state we erase before comparison.', 'Preserve Candidate uncertainty and SIFT limits.', ['INSIGHT', 'CONSEQUENCE'], [2, 3, 4]),
    ],
    choice: {
      id: 'choice.qc02.change_evidence_frame',
      variable: 'story.qc02.change_evidence_frame',
      promptKey: 'choice.change.prompt',
      prompt: 'Which evidence should lead the comparison?',
      options: [
        {
          id: 'current_state_first', value: 'CURRENT_STATE_FIRST', label: 'story.qc02.shift10.frame.current_state_first', key: 'choice.change.current',
          text: 'Lead with current device and enclosure state.',
          branchLine: line('frame.current.01', character.hana, 'Lead with what the machine shows now, then place the alert chronology beside it. Current does not mean complete; it gives the comparison a time anchor.', 'The chosen presentation order leads with current state.', ['ACTION'], [], 'PRESENTATION_ORDER_ONLY'),
        },
        {
          id: 'change_history_first', value: 'CHANGE_HISTORY_FIRST', label: 'story.qc02.shift10.frame.change_history_first', key: 'choice.change.history',
          text: 'Lead with the change and alert chronology.',
          branchLine: line('frame.history.01', character.jonah, 'Lead with what changed and when, then attach the current inventory. Chronology is a map of the question, not a verdict about the hardware.', 'The chosen presentation order leads with change history.', ['ACTION'], [], 'PRESENTATION_ORDER_ONLY'),
        },
      ],
    },
    launch: line('match.01', character.hana, 'Preserve before you change. The Match owns whether the comparison supports an Isolation and whether any later clear is justified.', 'Yield all fault and repair authority to the Match.', ['ACTION'], [], 'NO_GAMEPLAY_AUTHORITY'),
    successCast: [[character.jonah, 'thoughtful', 'LEFT'], [character.hana, 'relief', 'RIGHT']],
    success: [
      outcomeLine('success.01', character.hana, 'COMPLETED', 'S10_COMPLETED_SCOPE', ['CONSEQUENCE', 'INSIGHT']),
      outcomeLine('success.02', character.jonah, 'COMPLETED', 'S10_COMPLETED_FORWARD', ['REINFORCEMENT']),
    ],
    abandonCast: [[character.jonah, 'thoughtful', 'LEFT'], [character.hana, 'skeptical', 'RIGHT']],
    abandon: [
      outcomeLine('abandon.01', character.hana, 'ABANDONED', 'S10_ABANDONED_SCOPE', ['CONSEQUENCE', 'ACTION']),
      outcomeLine('abandon.02', character.jonah, 'ABANDONED', 'S10_ABANDONED_FORWARD', ['REINFORCEMENT']),
    ],
    followScene: 'knowledge',
    followCast: [[character.jonah, 'thoughtful', 'LEFT'], [character.hana, 'relief', 'RIGHT']],
    follow: [line('follow.01', character.jonah, 'The next record pairs a management-firmware change with a network link that repeatedly drops and returns. The chronology is suspicious; it still needs corroboration before it can support cause.', 'Introduce the version-change and link-flap setup without declaring cause.', ['FOLLOW_ON'], [1, 2, 3], 'PUBLIC_CONTEXT_ONLY', null, 'exp-005')],
  },
  11: {
    scene: 'core',
    cast: [[character.malik, 'defensive', 'LEFT'], [character.sora, 'focused', 'RIGHT']],
    intro: [
      line('entry.01', null, 'Across several systems, a network port begins reporting repeated link-down and link-up events after a management-firmware change.', 'Establish the repeated link-flap behavior and temporal firmware context.', ['ENVIRONMENT', 'FAILURE'], [1]),
      line('entry.02', character.malik, 'Link is the physical connection state between interfaces. Flapping means it repeatedly drops and returns; each return can look healthy while the repeated transitions remain the symptom.', 'Define link flapping without claiming an unobserved service consequence.', ['NAME', 'NORMAL', 'FAILURE'], [1]),
      line('entry.03', character.sora, 'At the public observatory, a cloud arriving after a lens change earns another observation, not a verdict on the lens. Here, cabling and interface hardware have been exchanged without carrying the behavior away, but version compatibility remains only a Candidate.', 'Explain temporal correlation, hardware elimination, and need for corroboration.', ['PROCEDURE', 'INSIGHT', 'ACTION'], [2, 3], 'PUBLIC_CONTEXT_ONLY', 'sora_public_astronomy_night'),
      line('entry.04', character.malik, 'A clean comparison keeps configured state, physical path, observation window, and result named. Chronology alone is not enough; the Match must find safe Evidence that makes one Candidate differ.', 'Explain the corroboration goal without naming either required diagnostic.', ['PROCEDURE', 'ACTION'], [3]),
    ],
    launch: line('match.01', character.sora, 'Use the Match to test the Candidates. Neither timing nor healthy replacement hardware can perform Isolate by itself.', 'Yield causal authority to the Match.', ['ACTION'], [], 'NO_GAMEPLAY_AUTHORITY'),
    successCast: [[character.malik, 'focused', 'LEFT'], [character.sora, 'approving', 'RIGHT']],
    success: [
      outcomeLine('success.01', character.sora, 'COMPLETED', 'S11_COMPLETED_SCOPE', ['CONSEQUENCE', 'INSIGHT']),
      outcomeLine('success.02', character.malik, 'COMPLETED', 'S11_COMPLETED_FORWARD', ['REINFORCEMENT']),
    ],
    abandonCast: [[character.malik, 'focused', 'LEFT'], [character.sora, 'focused', 'RIGHT']],
    abandon: [
      outcomeLine('abandon.01', character.sora, 'ABANDONED', 'S11_ABANDONED_SCOPE', ['CONSEQUENCE', 'ACTION']),
      outcomeLine('abandon.02', character.malik, 'ABANDONED', 'S11_ABANDONED_FORWARD', ['CONSEQUENCE']),
    ],
    followScene: 'trace',
    followCast: [[character.sora, 'focused', 'RIGHT'], [character.malik, 'focused', 'LEFT']],
    follow: [line('follow.01', character.sora, 'The final case sharpens the boundary: a recovery-capable layer can yield read-only Evidence, and an image can reach volatile memory without writing flash. The approved transfer-and-write flow belongs to Repair authority; writing firmware is the machine-state change.', 'Transition to BMC recovery while distinguishing read-only recovery evidence, volatile image transfer, and the state-changing firmware write.', ['FOLLOW_ON'], [3, 4, 5, 7], 'PUBLIC_CONTEXT_ONLY', null, 'exp-006')],
    ack: {
      variable: 'story.qc02.change_evidence_frame',
      thenValue: 'CURRENT_STATE_FIRST',
      elseValue: 'CHANGE_HISTORY_FIRST',
      thenLabel: 'story.qc02.shift11.change_frame_ack.current_state_first',
      elseLabel: 'story.qc02.shift11.change_frame_ack.change_history_first',
      thenLine: line('ack.change.current.01', character.sora, 'You led with current state in the alert review. Here that habit kept the present link behavior visible before the version chronology was compared; it changed framing, not Evidence.', 'Acknowledge the remembered current-state-first framing and its presentation-only consequence.', ['REINFORCEMENT'], [], 'PRESENTATION_ORDER_ONLY'),
      elseLine: line('ack.change.history.01', character.sora, 'You led with change history in the alert review. Here that habit kept the version chronology visible before current link behavior was compared; it changed framing, not Evidence.', 'Acknowledge the remembered change-history-first framing and its presentation-only consequence.', ['REINFORCEMENT'], [], 'PRESENTATION_ORDER_ONLY'),
    },
  },
  12: {
    scene: 'trace',
    cast: [[character.jonah, 'thoughtful', 'LEFT'], [character.sora, 'focused', 'RIGHT']],
    intro: [
      line('entry.01', null, 'A baseboard management controller stopped responding after power was lost during a firmware operation. The rest of the board now waits behind a management path that cannot start normally.', 'Establish the interrupted-update and unavailable-controller state.', ['ENVIRONMENT', 'FAILURE', 'CONSEQUENCE'], [1]),
      line('entry.02', character.jonah, 'The BMC is a management controller on the board. Here its indicator remains lit while the board otherwise does not respond. The team does not yet know whether any controller layer remains reachable.', 'Define the BMC only to the bounded source record and state the unresolved recovery-layer uncertainty without drawing a conclusion.', ['NAME', 'FAILURE', 'PAIN_POINT'], [1, 2]),
      line('entry.03', character.sora, 'A recoverable firmware state and a broader version-set problem remain different Candidates. Read-only state can gather Evidence; receiving an image does not by itself prove either Candidate. The bounded recovery flow remains Repair authority, and writing firmware is the state change. The Match determines which authorized observation applies.', 'Distinguish read-only recovery evidence, volatile image receipt, and the state-changing firmware write without naming the sole required diagnostic.', ['PROCEDURE', 'INSIGHT', 'ACTION'], [2, 3, 4, 5, 7]),
      line('entry.04', character.jonah, 'An image-transfer tool is not diagnostic Evidence merely because it is available. Moving an image into volatile memory does not write flash, but it remains inside the authorized recovery flow; no generic command authorizes board-specific firmware work.', 'Bound transport tooling by distinguishing volatile transfer from the later state-changing flash write while preserving platform-specific authority.', ['PAIN_POINT', 'ACTION'], [4, 5, 7]),
      line('entry.05', character.sora, 'Before any state-changing procedure: confirm exact platform identity, an authorized and integrity-checked artifact, protected configuration, and a fallback boundary. After any Repair, use a separate Verify against the defined acceptance boundary.', 'Explain general firmware safety and separate post-repair acceptance without claiming the source proved persistence.', ['PROCEDURE', 'ACTION'], [3, 5, 8]),
    ],
    launch: line('match.01', character.sora, 'The Match owns the recovery decision. Observe first, isolate only what the Evidence supports, change state only through the approved Repair, then Verify and Document separately.', 'Yield recovery authority to the Match and restate lifecycle order.', ['ACTION'], [], 'NO_GAMEPLAY_AUTHORITY'),
    successCast: [[character.jonah, 'thoughtful', 'LEFT'], [character.hana, 'relief', 'RIGHT']],
    success: [
      outcomeLine('success.01', character.hana, 'COMPLETED', 'S12_COMPLETED_SCOPE', ['CONSEQUENCE', 'INSIGHT']),
      outcomeLine('success.02', character.jonah, 'COMPLETED', 'S12_COMPLETED_FORWARD', ['REINFORCEMENT']),
    ],
    abandonCast: [[character.jonah, 'thoughtful', 'LEFT'], [character.hana, 'skeptical', 'RIGHT']],
    abandon: [
      outcomeLine('abandon.01', character.hana, 'ABANDONED', 'S12_ABANDONED_SCOPE', ['CONSEQUENCE', 'ACTION']),
      outcomeLine('abandon.02', character.jonah, 'ABANDONED', 'S12_ABANDONED_FORWARD', ['CONSEQUENCE']),
    ],
    followScene: 'gate',
    followCast: [[character.hana, 'relief', 'RIGHT'], [character.sora, 'approving', 'LEFT']],
    follow: [
      line('follow.01', character.hana, 'Six new Tickets are now either documented closures or honestly bounded gaps. Their Service Points record accepted contributions; they do not decide access to the next lesson, and the points already earned remain unchanged.', 'Summarize expansion completion without a cumulative gate.', ['CONSEQUENCE'], [], 'NORMALIZED_MATCH_HISTORY_ONLY'),
      line('follow.02', character.sora, 'The cases do not share a hidden technical cause. What they share is the discipline to keep observations, changes, proof, and explanations distinct enough for the next person to trust.', 'Close on the institutional learning without inventing a common fault.', ['INSIGHT'], [], 'PUBLIC_STORY_CONTEXT_ONLY'),
    ],
  },
};

function addText(textId, value, metadata) {
  if (textEntries[textId] !== undefined && textEntries[textId] !== value) {
    throw new Error(`Conflicting text value for ${textId}`);
  }
  textEntries[textId] = value;
  if (metadata) displays.push({ text_id: textId, ...metadata });
  return textId;
}

function displayStatement(episode, item, phase, nearestLabel, routeSelector = { kind: 'ALL_ROUTES' }) {
  const prefix = `s${String(episode.shift_number).padStart(2, '0')}`;
  const statementId = `story.qc02.${prefix}.${item.key}`;
  const textId = `text.qc02.${prefix}.${item.key}`;
  const sourceCaseId = item.technicalClaim ? (item.sourceCaseId ?? episode.case_id) : null;
  const candidateCaseId = item.technicalClaim ? sourceCaseId : episode.case_id;
  addText(textId, item.text, {
    statement_id: statementId,
    display_kind: item.kind,
    episode_id: episode.episode_id,
    shift_number: episode.shift_number,
    nearest_label: nearestLabel,
    phase,
    speaker_key: item.speaker ?? null,
    technical_claim: item.technicalClaim,
    source_case_id: sourceCaseId,
    source_event_numbers: item.sourceEvents,
    semantic_key: `${sourceCaseId ?? episode.case_id}.${item.key}`,
    semantic_payload: item.semanticPayload,
    context_rungs: item.contextRungs,
    authority_bound: item.authorityBound,
    public_candidate_fault_ids: [...proofByCase.get(candidateCaseId).public_candidate_fault_ids],
    voice_fingerprint: item.speaker ? voiceFingerprint[item.speaker] : null,
    personal_texture: item.textureSource !== null,
    texture_source: item.textureSource,
    normalized_result_fields: item.outcomeContract?.normalizedResultFields ?? [],
    normalized_result_expectations: item.outcomeContract
      ? { completion: item.outcomeContract.expectedCompletion }
      : null,
    public_process_principle_id: item.outcomeContract?.publicProcessPrincipleId ?? null,
    private_match_details_claimed: item.outcomeContract?.privateMatchDetailsClaimed ?? null,
    route_selector: routeSelector,
  });
  if (item.kind === 'NARRATE') return { type: 'narrate', statement_id: statementId, text_id: textId, style_key: 'NARRATION' };
  return { type: 'say', statement_id: statementId, speaker_key: item.speaker, text_id: textId, style_key: 'DIALOGUE' };
}

function choiceText(episode, key, value, kind, nearestLabel, choiceId, optionId = null) {
  const prefix = `s${String(episode.shift_number).padStart(2, '0')}`;
  const textId = `text.qc02.${prefix}.${key}`;
  addText(textId, value, {
    statement_id: null,
    display_kind: kind,
    episode_id: episode.episode_id,
    shift_number: episode.shift_number,
    nearest_label: nearestLabel,
    phase: 'CHOICE',
    speaker_key: null,
    technical_claim: false,
    source_case_id: null,
    source_event_numbers: [],
    semantic_key: `${episode.case_id}.${key}`,
    semantic_payload: optionId
      ? `Presentation-order option ${optionId}; no gameplay, truth, reward, or Match effect.`
      : 'Ask which public evidence should lead the presentation without changing technical or gameplay authority.',
    context_rungs: ['ACTION'],
    authority_bound: 'PRESENTATION_ORDER_ONLY',
    public_candidate_fault_ids: [...proofByCase.get(episode.case_id).public_candidate_fault_ids],
    voice_fingerprint: null,
    personal_texture: false,
    texture_source: null,
    normalized_result_fields: [],
    normalized_result_expectations: null,
    public_process_principle_id: null,
    private_match_details_claimed: null,
    choice_id: choiceId,
    option_id: optionId,
    route_selector: { kind: 'ALL_ROUTES' },
  });
  return textId;
}

const label = (labelId) => ({ type: 'label', label_id: labelId });
const jump = (labelId) => ({ type: 'jump', label_id: labelId });
const hideAll = () => Object.values(castTag).map((tag) => ({ type: 'hide', tag, layer: 'characters', transition: 'CUT' }));
const showCast = (cast) => cast.map(([characterId, poseId, position]) => ({
  type: 'show', tag: castTag[characterId], layer: 'characters', character_id: characterId, pose_id: poseId, position, transition: 'FADE',
}));

function sceneStatement(shift, slug, sceneKey, checkpointId = null) {
  const spec = scenes[sceneKey];
  return {
    type: 'scene',
    scene_id: `story.scene.qc02.shift${String(shift).padStart(2, '0')}.${slug}`,
    background_asset_id: spec.background,
    location_text_id: spec.location,
    time_text_id: spec.time,
    transition: 'DISSOLVE',
    ...(checkpointId ? { checkpoint_id: checkpointId } : {}),
  };
}

function buildEpisode(shift) {
  const episode = episodeByShift.get(shift);
  const copy = episodeCopy[shift];
  const match = matchByRef.get(episode.match_ref);
  if (!episode || !copy || !match) throw new Error(`Missing locked input for Shift ${shift}`);
  const statements = [];

  if (shift === 7) {
    statements.push(
      label(blueprint.entry_label),
      { type: 'checkpoint', checkpoint_id: blueprint.runtime_policy.entry_checkpoint_id, resume_label: episode.labels.entry },
      jump(episode.labels.entry),
    );
  }

  statements.push(
    label(episode.labels.entry),
    sceneStatement(shift, 'entry', copy.scene, episode.checkpoints.entry),
    ...hideAll(),
    ...showCast(copy.cast),
    ...copy.intro.map((item) => displayStatement(episode, item, 'CONTEXT', episode.labels.entry)),
  );

  if (copy.choice) {
    const promptTextId = choiceText(episode, copy.choice.promptKey, copy.choice.prompt, 'CHOICE_PROMPT', episode.labels.entry, copy.choice.id);
    statements.push({
      type: 'choice',
      choice_id: copy.choice.id,
      prompt_text_id: promptTextId,
      options: copy.choice.options.map((option) => ({
        option_id: option.id,
        text_id: choiceText(episode, option.key, option.text, 'CHOICE_OPTION', episode.labels.entry, copy.choice.id, option.id),
        jump_label: option.label,
        writes: [{ variable_id: copy.choice.variable, value: option.value }],
      })),
    });
    for (const option of copy.choice.options) {
      statements.push(
        label(option.label),
        displayStatement(episode, option.branchLine, 'CHOICE_BRANCH', option.label, { kind: 'CHOICE_IS', choice_id: copy.choice.id, option_id: option.id }),
        jump(episode.labels.match),
      );
    }
  }

  statements.push(
    label(episode.labels.match),
    displayStatement(episode, copy.launch, 'MATCH_BRIDGE', episode.labels.match),
    {
      type: 'start_match',
      match_ref: episode.match_ref,
      return_label: episode.labels.return,
      pre_match_checkpoint_id: episode.checkpoints.pre_match,
      post_match_checkpoint_id: episode.checkpoints.post_match,
    },
    label(episode.labels.return),
    {
      type: 'if',
      condition: { op: 'MATCH_RESULT', match_ref: episode.match_ref, field: 'completion', comparator: 'EQUALS', value: 'COMPLETED' },
      then_label: episode.labels.success,
      else_label: episode.labels.abandon,
    },
    label(episode.labels.success),
    sceneStatement(shift, 'success', copy.followScene),
    ...hideAll(),
    ...showCast(copy.successCast),
    ...copy.success.map((item) => displayStatement(episode, item, 'OUTCOME', episode.labels.success, { kind: 'MATCH_COMPLETION', match_ref: episode.match_ref, completion: 'COMPLETED' })),
    jump(episode.labels.follow_on),
    label(episode.labels.abandon),
    sceneStatement(shift, 'abandon', copy.followScene),
    ...hideAll(),
    ...showCast(copy.abandonCast),
    ...copy.abandon.map((item) => displayStatement(episode, item, 'OUTCOME', episode.labels.abandon, { kind: 'MATCH_COMPLETION', match_ref: episode.match_ref, completion: 'ABANDONED' })),
    jump(episode.labels.follow_on),
    label(episode.labels.follow_on),
    sceneStatement(shift, 'follow_on', copy.followScene),
    ...hideAll(),
    ...showCast(copy.followCast),
    ...copy.follow.map((item) => displayStatement(episode, item, 'FOLLOW_ON', episode.labels.follow_on)),
  );

  if (copy.ack) {
    const ackLabel = shift === 8 ? 'story.qc02.shift08.initial_frame_ack' : 'story.qc02.shift11.change_frame_ack';
    statements.push(
      {
        type: 'if',
        condition: { op: 'VARIABLE_EQUALS', variable_id: copy.ack.variable, value: copy.ack.thenValue },
        then_label: copy.ack.thenLabel,
        else_label: copy.ack.elseLabel,
      },
      label(copy.ack.thenLabel),
      displayStatement(episode, copy.ack.thenLine, 'DELAYED_CHOICE_ACK', copy.ack.thenLabel, {
        kind: 'VARIABLE_EQUALS', variable_id: copy.ack.variable, value: copy.ack.thenValue,
      }),
      jump(ackLabel),
      label(copy.ack.elseLabel),
      displayStatement(episode, copy.ack.elseLine, 'DELAYED_CHOICE_ACK', copy.ack.elseLabel, {
        kind: 'VARIABLE_EQUALS', variable_id: copy.ack.variable, value: copy.ack.elseValue,
      }),
      jump(ackLabel),
      label(ackLabel),
    );
  }

  if (shift < 12) {
    statements.push(jump(episodeByShift.get(shift + 1).labels.entry));
  } else {
    statements.push(
      jump(blueprint.ending.entry_label),
      label(blueprint.ending.entry_label),
      { type: 'end', ending_id: blueprint.ending.ending_id, checkpoint_id: blueprint.ending.checkpoint_id },
    );
  }

  return {
    script_version: 'story-script-v1',
    script_id: `story.script.qc02.shift${String(shift).padStart(2, '0')}`,
    chapter_id: episode.episode_id,
    statements,
  };
}

function buildOutputs() {
  displays.length = 0;
  for (const textId of Object.keys(textEntries)) delete textEntries[textId];
  const scripts = blueprint.episodes.map((episode) => buildEpisode(episode.shift_number));
  const outcomeDisplays = displays.filter((display) => display.phase === 'OUTCOME');
  const usedOutcomePrinciples = new Set(outcomeDisplays.map((display) => display.public_process_principle_id));
  if (outcomeDisplays.length !== 24
      || usedOutcomePrinciples.size !== Object.keys(publicOutcomePrinciples).length
      || Object.keys(publicOutcomePrinciples).some((principleId) => !usedOutcomePrinciples.has(principleId))) {
    throw new Error('Every allowlisted public outcome principle must own exactly one of the 24 outcome displays.');
  }
  const usedBackgrounds = new Set(blueprint.episodes.flatMap((episode) => episode.art.background_asset_ids));
  const usedPosePairs = new Set(blueprint.episodes.flatMap((episode) => episode.art.character_pose_ids));
  const usedCharacterIds = new Set([...usedPosePairs].map((pair) => pair.slice(0, pair.lastIndexOf(':'))));
  const characters = baseRegistry.characters
    .filter((entry) => usedCharacterIds.has(entry.character_id))
    .map((entry) => ({
      ...entry,
      poses: entry.poses.filter((pose) => usedPosePairs.has(`${entry.character_id}:${pose.pose_id}`)),
    }));
  const usedCharacterAssetIds = new Set(characters.flatMap((entry) => entry.poses.map((pose) => pose.asset_id)));
  const assets = baseRegistry.assets.filter((asset) => usedBackgrounds.has(asset.asset_id) || usedCharacterAssetIds.has(asset.asset_id));
  const registry = {
    registry_version: 'story-registry-v1',
    variables: blueprint.remembered_choices.map(({ variable_id, value_type, default: defaultValue }) => ({ variable_id, value_type, default: defaultValue })),
    assets,
    characters,
    matches: matchRegistry.matches.map(({ match_ref }) => ({ match_ref })),
    declared_loops: [],
  };
  const manifest = {
    pack_version: 'story-pack-v1',
    pack_id: blueprint.campaign_id,
    content_version: CONTENT_VERSION,
    default_locale: 'en',
    entry_label: blueprint.entry_label,
    library_entry_labels: [],
    max_call_depth: 8,
    max_settle_steps: 1000,
    scripts: blueprint.episodes.map((episode) => `scripts/shift-${String(episode.shift_number).padStart(2, '0')}.json`),
    text_catalogs: { en: 'texts/en.json' },
    registry: 'registry.json',
  };

  const requiredSharedTextIds = new Set([
    ...assets.map((asset) => asset.alt_text_id).filter(Boolean),
    ...characters.map((entry) => entry.name_text_id),
    ...scripts.flatMap((script) => script.statements.flatMap((statement) => [statement.location_text_id, statement.time_text_id].filter(Boolean))),
  ]);
  for (const textId of [...requiredSharedTextIds].sort()) {
    if (!baseTexts[textId]) throw new Error(`Missing shared localized text ${textId}`);
    textEntries[textId] = baseTexts[textId];
  }

  const textCatalog = { text_catalog_version: 'story-text-catalog-v1', locale: 'en', entries: Object.fromEntries(Object.entries(textEntries).sort(([a], [b]) => a.localeCompare(b))) };
  const bundle = { manifest, registry, texts: { en: textCatalog }, scripts };
  const issues = validateStoryPack(bundle);
  if (issues.length) throw new Error(`Generated Story pack is invalid:\n${issues.map((issue) => JSON.stringify(issue)).join('\n')}`);

  const graph = {
    graph_version: 'story-expansion-graph-v1',
    pack_id: blueprint.campaign_id,
    content_version: CONTENT_VERSION,
    entry_node_id: graphReport.graph.entry_node_id,
    nodes: graphReport.graph.nodes,
    edges: graphReport.graph.edges,
  };
  const metadata = {
    metadata_version: 'story-authored-metadata-v1',
    pack_id: blueprint.campaign_id,
    content_version: CONTENT_VERSION,
    status: STATUS,
    route_model: 'Selectors are declarative; TASK-044 validation executes all 256 routes.',
    authority_policy: 'Dialogue supplies public context and normalized-result interpretation only; it never creates Match Evidence, Isolation, Repair, Verify, Documentation, or closure.',
    outcome_copy_policy: {
      allowed_normalized_result_fields: ['completion'],
      minimal_result_contract: 'Copy remains true when every normalized counter is zero and documented_outcome and verified_outcome are false.',
      private_match_detail_policy: 'Outcome copy may state its selected completion and an allowlisted public process principle; it may not infer private Evidence, diagnosis, action sequence, or technical outcome.',
      public_process_principles: Object.entries(publicOutcomePrinciples).map(([principleId, principle]) => ({
        principle_id: principleId,
        allowed_copy: principle.copy,
        semantic_summary: principle.summary,
      })),
    },
    public_candidate_copy_contracts: blueprint.episodes.map((episode) => ({
      episode_id: episode.episode_id,
      source_case_id: episode.case_id,
      allowed_public_candidate_fault_ids: [...proofByCase.get(episode.case_id).public_candidate_fault_ids],
      copy_bound: 'PRE_MATCH_COPY_MAY_NOT_ADD_OR_REMOVE_TICKET_CANDIDATES',
      pre_match_leakage_scope: ['SOURCE_CASE_FOLLOW_ON', 'CONTEXT', 'CHOICE', 'CHOICE_BRANCH', 'MATCH_BRIDGE'],
      forbidden_pre_match_concepts: preMatchLeakageContracts[episode.case_id],
    })),
    displays,
  };

  const outputs = new Map([
    ['manifest.json', manifest],
    ['registry.json', registry],
    ['matches.json', matchRegistry],
    ['graph.json', graph],
    ['authored-metadata.json', metadata],
    ['texts/en.json', textCatalog],
  ]);
  scripts.forEach((script, index) => outputs.set(manifest.scripts[index], script));
  return outputs;
}

function generate({ check = false } = {}) {
  const outputs = buildOutputs();
  const drift = [];
  for (const [relativePath, value] of outputs) {
    const target = path.join(OUTPUT_ROOT, relativePath);
    const expected = jsonText(value);
    if (check) {
      if (!fs.existsSync(target) || fs.readFileSync(target, 'utf8') !== expected) drift.push(relativePath);
      continue;
    }
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, expected, 'utf8');
  }
  if (check && drift.length) throw new Error(`Candidate Story output drift: ${drift.join(', ')}`);
  return outputs;
}

const check = process.argv.includes('--check');
generate({ check });
console.log(`${check ? 'Verified' : 'Generated'} Quiet Cascade expansion candidate (${blueprint.episodes.length} scripts, ${displays.length} localized displays).`);

export { buildOutputs, generate };
