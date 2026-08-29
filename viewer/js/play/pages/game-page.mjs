import { bindResolvedImage } from '../art-resolver.mjs';
import {
  buildSelectedActionPresentation,
  currentDiagnosticResult,
  isDiagnosticRunnableOnTicket,
  projectedDropIntent,
} from '../action-presentation.mjs';
import { benchPageSizeForViewport } from '../bench-view.mjs';
import { createCardDetailView, createCardView, setCardViewState } from '../card-view.mjs';
import { cardName, domainName } from '../catalog-service.mjs';
import { escapeHtml, formatDuration, formatInteger } from '../dom-utils.mjs';
import { firstEligibleInstance, groupHandInstances, handPageSizeForViewport, pageHandGroups } from '../hand-view.mjs';
import { closePlayDialog, openPlayDialog } from '../motion-coordinator.mjs';

const STATUS_LABELS = Object.freeze({
  DIAGNOSIS: 'Diagnosis open',
  RETURNED_TO_DIAGNOSIS: 'Returned to Diagnosis',
  REPAIR_READY: 'Repair ready',
  AWAITING_VERIFY: 'Awaiting Verify',
  READY_TO_CLOSE: 'Ready to close',
  CLOSED: 'Closed',
  ABANDONED: 'Abandoned',
});

const ACTION_LABELS = Object.freeze({
  RUN_TEST: 'Run Test',
  PLAY_CARD: 'Run Command',
  PERFORM_REPAIR: 'Perform Repair',
  PERFORM_VERIFY: 'Perform Verify',
  REVISE_HYPOTHESIS: 'Revise Hypothesis',
  COMMIT_ISOLATION: 'Commit Isolation',
  DOCUMENT_LIVE: 'Document Live',
  PUBLISH_CLOSURE: 'Document & Close',
  SEARCH: 'Search',
  REFRESH: 'Refresh',
  PASS_TURN: 'Pass turn',
  SET_ELIMINATION: 'Update elimination',
  GIVE_UP_TICKET: 'Give Up Ticket',
});

function ticketName(projection, ticketId) {
  return projection.ticket_presentations[ticketId]?.display_name || ticketId;
}

function playerName(publicMatch, playerId) {
  return publicMatch.players.find((player) => player.player_id === playerId)?.display_name || playerId || 'Unknown contributor';
}

function readableTimestamp(value) {
  if (!value) return 'Time unavailable';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) return value;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsed);
}

function timestampMarkup(value) {
  if (!value) return '<span>Time unavailable</span>';
  return `<time datetime="${escapeHtml(value)}" title="${escapeHtml(value)}">${escapeHtml(readableTimestamp(value))}</time>`;
}

function visibilityLabel(visibility) {
  if (visibility === 'PRIVATE_PLAYER') return 'Private to this Player';
  if (visibility === 'TEAM') return 'Team';
  if (visibility === 'PUBLIC_MATCH') return 'Public Match';
  return visibility?.replaceAll('_', ' ') || 'Authorized visibility';
}

export function buildDocumentPreviewModels(projection) {
  const view = projection.view;
  const queue = view.public_match.repair_queue;
  const intents = projection.legal_intents.filter((intent) => intent.action_type === 'DOCUMENT_LIVE');
  return view.documentable_actions
    .map((source) => {
      const intent = intents.find((candidate) =>
        candidate.ticket_instance_id === source.ticket_instance_id
          && candidate.source_action_event_id === source.source_action_event_id);
      const ticket = queue.find((record) => record.ticket_instance_id === source.ticket_instance_id);
      const worklog = ticket?.worklog.find((entry) =>
        entry.placeholder_event_id === source.worklog_placeholder_event_id);
      const result = view.authorized_events.find((event) =>
        event.event_id === source.source_result_event_id
          && event.ticket_instance_id === source.ticket_instance_id);
      const publicSummary = typeof result?.payload?.public_summary === 'string'
        && result.payload.public_summary.trim()
        ? result.payload.public_summary
        : null;
      if (!source || !ticket || !worklog || !result) return null;
      return {
        intent_id: intent?.intent_id ?? null,
        document_live_legal: Boolean(intent),
        ticket_instance_id: ticket.ticket_instance_id,
        source_action_event_id: source.source_action_event_id,
        source_result_event_id: source.source_result_event_id,
        worklog_placeholder_event_id: source.worklog_placeholder_event_id,
        worklog_sequence: worklog.sequence,
        source_name: worklog.source_name,
        source_actor_player_id: worklog.actor_player_id,
        action_time: worklog.action_time,
        result_visibility: result.visibility,
        public_summary: publicSummary,
        recovery_available: source.recovery_available === true,
        preview_complete: publicSummary !== null,
      };
    })
    .filter(Boolean)
    .sort((left, right) => left.worklog_sequence - right.worklog_sequence
      || left.source_action_event_id.localeCompare(right.source_action_event_id));
}

function actionLabel(intent, projection, catalog) {
  const base = ACTION_LABELS[intent.action_type] || intent.action_type.replaceAll('_', ' ');
  const ticket = intent.ticket_instance_id ? ticketName(projection, intent.ticket_instance_id) : '';
  const card = intent.card_definition_id ? cardName(catalog.cardById.get(intent.card_definition_id)) : '';
  if (intent.action_type === 'SEARCH') return `Search for ${card}`;
  if (intent.action_type === 'DOCUMENT_LIVE') return `${base} · ${ticket}`;
  if (card && ticket) return `${base}: ${card} → ${ticket}`;
  return ticket ? `${base}: ${ticket}` : base;
}

function selectedActionMarkup({
  selectedCard,
  selectedCardDefinition,
  selectedCost,
  presentation,
  selectedTicketId,
  projection,
  catalog,
  resolving,
}) {
  if (!selectedCard) return '<span>Select a diagnostic or response Card to inspect its projected target and cost.</span>';
  const diagnostic = presentation.selectionKind === 'BENCH_DIAGNOSTIC';
  const targetId = presentation.actionIntents[0]?.ticket_instance_id
    ?? (diagnostic ? selectedTicketId : null);
  const target = targetId ? ticketName(projection, targetId) : 'No projected target';
  const alternateTargetNames = presentation.alternateTicketIds.map((ticketId) => ticketName(projection, ticketId));
  const status = presentation.statusMessage
    ? diagnostic
      ? `<p class="target-scope target-scope--status" data-diagnostic-status="${escapeHtml(presentation.statusCode)}" data-continuity-key="game:selected-diagnostic-action" tabindex="-1" role="status"><strong>Selected Ticket status.</strong> ${escapeHtml(presentation.statusMessage)}</p>`
      : `<span>${escapeHtml(presentation.statusMessage)}</span>`
    : '';
  const choices = presentation.actionIntents.map((intent, index) => {
    const componentChoice = diagnostic && presentation.targetKind === 'TICKET_COMPONENT'
      && presentation.actionIntents.length > 1;
    const label = componentChoice
      ? `${actionLabel(intent, projection, catalog)} · Component target ${index + 1}`
      : actionLabel(intent, projection, catalog);
    const continuity = diagnostic && index === 0 ? ' data-continuity-key="game:selected-diagnostic-action"' : '';
    return `<button type="button" class="play-button play-button--primary" data-intent-id="${escapeHtml(intent.intent_id)}" data-target-ticket-id="${escapeHtml(intent.ticket_instance_id || '')}"${componentChoice ? ` data-component-target-choice="${index + 1}"` : ''}${continuity}${resolving ? ' disabled' : ''}>${diagnostic ? 'Confirm &amp; ' : ''}${escapeHtml(label)}</button>`;
  }).join('');
  const actionChoices = diagnostic && presentation.targetKind === 'TICKET_COMPONENT'
    && presentation.actionIntents.length > 1
    ? `<fieldset class="diagnostic-target-choices"><legend>Choose a component target on ${escapeHtml(target)}</legend>${choices}</fieldset>`
    : choices;
  return `<header><strong>${escapeHtml(cardName(selectedCardDefinition))}</strong><span>${escapeHtml(diagnostic ? selectedCard.diagnostic_type : 'RESPONSE CARD')}</span></header><dl><div><dt>Target</dt><dd>${escapeHtml(target)}</dd></div><div><dt>Cost</dt><dd>${selectedCost} Action${selectedCost === 1 ? '' : 's'}</dd></div></dl><button type="button" class="play-button play-button--quiet" data-inspect-selected>Inspect</button>${alternateTargetNames.length ? `<p class="target-scope target-scope--alternate" data-alternate-target><strong>Alternate target only.</strong> This response Card cannot apply to the displayed Ticket, ${escapeHtml(ticketName(projection, selectedTicketId))}. Submitting targets ${escapeHtml(alternateTargetNames.join(' or '))}.</p>` : ''}${status}${actionChoices}`;
}

function eventSummary(event, catalog) {
  const type = event.event_type.replaceAll('_', ' ').toLowerCase().replace(/^./, (letter) => letter.toUpperCase());
  const source = event.payload?.source_definition_id ? domainName(catalog, event.payload.source_definition_id) : null;
  const summary = event.payload?.public_summary || event.payload?.response_code || event.payload?.result || '';
  const effects = (event.payload?.candidate_effects || []).map((effect) => `${effect.disposition}: ${domainName(catalog, effect.candidate_fault_id)}`).join(' · ');
  return { type, source, summary, effects };
}

export function paymentSummary(result, accepted) {
  if (!accepted) return '0 Actions · 0 Search tokens · 0 Refresh tokens · no Card spent';
  const actions = result?.actions_spent ?? 0;
  const search = result?.utility_resources_spent?.search_tokens ?? 0;
  const refresh = result?.utility_resources_spent?.refresh_tokens ?? 0;
  return `${actions} Action${actions === 1 ? '' : 's'} · ${search} Search token${search === 1 ? '' : 's'} · ${refresh} Refresh token${refresh === 1 ? '' : 's'}`;
}

function actionResultMarkup(session, projection, catalog) {
  const record = session.lastAction;
  if (!record) return '';
  const { intent, result } = record;
  const target = record.target_ticket_id ? ticketName(projection, record.target_ticket_id) : 'the current Match';
  const card = intent.card_definition_id ? catalog.cardById.get(intent.card_definition_id) : null;
  const cardLabel = card ? cardName(card) : 'No Card used';
  const disposition = card && intent.card_instance_id
    ? `${card.play_contract?.disposition?.replaceAll('_', ' ') || 'resolved by the engine'}`
    : intent.action_type === 'SEARCH' ? 'selected Card moved to hand' : 'no Card disposition';
  const targetEvents = session.lastEvents.filter((event) => event.ticket_instance_id === record.target_ticket_id);
  const resultEvent = targetEvents.find((event) => event.event_id === record.result_event_id) ?? targetEvents[0];
  const plainResult = result?.accepted === false
    ? `Rejected: ${result.error_message || result.error_code || 'the authority rejected this action'}.`
    : result?.result_summary
      || resultEvent?.payload?.public_summary
      || (result?.resolution_code === 'ISOLATION_NOT_SUPPORTED'
        ? 'Isolation was not supported by the cited public Evidence.'
        : `Accepted with resolution ${result?.resolution_code?.replaceAll('_', ' ').toLowerCase() || 'resolved'}.`);
  const candidateEffects = resultEvent?.payload?.candidate_effects ?? [];
  const isDiagnostic = ['RUN_TEST', 'PLAY_CARD'].includes(intent.action_type);
  const candidateEffect = isDiagnostic
    ? candidateEffects.length
      ? candidateEffects.map((effect) => `${effect.disposition.replaceAll('_', ' ').toLowerCase()}: ${domainName(catalog, effect.candidate_fault_id)}`).join(' · ')
      : 'No candidate effect was recorded.'
    : '';
  const activeTarget = projection.view.public_match.repair_queue
    .some((ticket) => ticket.ticket_instance_id === record.target_ticket_id);
  return `<section class="action-result-notice" data-action-result="${record.accepted ? 'accepted' : 'rejected'}" aria-labelledby="action-result-heading">
    <div><p class="play-eyebrow">Persistent action result</p><h2 id="action-result-heading">${escapeHtml(ACTION_LABELS[intent.action_type] || intent.action_type.replaceAll('_', ' '))} · ${escapeHtml(target)}</h2></div>
    <dl><div><dt>Target</dt><dd>${escapeHtml(target)}</dd></div><div><dt>Card / disposition</dt><dd>${escapeHtml(cardLabel)} · ${escapeHtml(disposition)}</dd></div><div><dt>Payment</dt><dd>${escapeHtml(paymentSummary(result, record.accepted))}</dd></div><div><dt>Result</dt><dd>${escapeHtml(plainResult)}${candidateEffect ? ` <span>${escapeHtml(candidateEffect)}</span>` : ''}</dd></div></dl>
    ${activeTarget && record.result_event_id ? '<button type="button" class="play-button" data-view-action-result>View result</button>' : ''}
  </section>`;
}

function renderEvidence(events, ticketId, catalog, lastEvents = [], resultEventId = null) {
  const evidence = events.filter((event) => event.ticket_instance_id === ticketId
    && ['EVIDENCE_CREATED', 'VERIFY_RESOLVED', 'VERIFY_EVIDENCE_CREATED', 'ISOLATION_ACCEPTED', 'ISOLATION_NOT_SUPPORTED'].includes(event.event_type));
  if (!evidence.length) return '<div class="empty-intelligence"><p>No authorized Evidence yet.</p><small>Run a legal Test before committing Isolation.</small></div>';
  const newIds = new Set(lastEvents.map((event) => event.event_id));
  return [...evidence].sort((left, right) => left.sequence - right.sequence).map((event) => {
    const summary = eventSummary(event, catalog);
    const dispositions = (event.payload?.candidate_effects || []).map((effect) => `<span class="evidence-disposition evidence-disposition--${escapeHtml(effect.disposition.toLowerCase())}" data-disposition="${escapeHtml(effect.disposition)}"><strong>${escapeHtml(effect.disposition)}</strong>${escapeHtml(domainName(catalog, effect.candidate_fault_id))}</span>`).join('');
    const isolation = event.event_type === 'ISOLATION_ACCEPTED'
      ? '<p class="repair-gate"><strong>Accepted Isolation</strong> Repair is now unlocked by the authoritative projection.</p>'
      : '';
    return `<article class="evidence-entry${newIds.has(event.event_id) ? ' is-new' : ''}${resultEventId === event.event_id ? ' is-result-target' : ''}" data-event-id="${escapeHtml(event.event_id)}"${resultEventId === event.event_id ? ' tabindex="-1"' : ''}><header><span>#${event.sequence}</span><strong>${escapeHtml(summary.type)}</strong></header>${summary.source ? `<p class="evidence-source">${escapeHtml(summary.source)}</p>` : ''}${summary.summary ? `<p>${escapeHtml(summary.summary)}</p>` : ''}${dispositions ? `<div class="evidence-dispositions" aria-label="Candidate dispositions">${dispositions}</div>` : ''}${isolation}</article>`;
  }).join('');
}

function worklogStatusMarkup(entry, publicMatch) {
  const actor = playerName(publicMatch, entry.actor_player_id);
  if (entry.source_name === 'Document Live') {
    return `Documentation action · ${timestampMarkup(entry.action_time)} · by ${escapeHtml(actor)}`;
  }
  if (entry.publication_event_id) {
    return `Published ${timestampMarkup(entry.publication_time)} · by ${escapeHtml(playerName(publicMatch, entry.publisher_player_id))}`;
  }
  return `Awaiting documentation · recorded ${timestampMarkup(entry.action_time)} · result remains at its authorized visibility`;
}

function renderWorklog(ticket, lastEvents, resultEventId = null, publicMatch) {
  if (!ticket.worklog.length) return '<div class="empty-intelligence"><p>The Worklog is empty.</p><small>Accepted actions appear here in immutable sequence.</small></div>';
  const newIds = new Set(lastEvents.map((event) => event.event_id));
  return ticket.worklog.map((entry, index) => {
    const state = entry.source_name === 'Document Live'
      ? 'documentation-action'
      : entry.publication_event_id ? 'published' : 'awaiting-documentation';
    const summary = entry.public_result_summary || 'The technical result remains at its authorized visibility until documented.';
    return `<article class="worklog-entry${index === ticket.worklog.length - 1 && lastEvents.length ? ' is-new' : ''}${resultEventId === entry.placeholder_event_id ? ' is-result-target' : ''}" data-worklog-state="${state}" data-placeholder-id="${escapeHtml(entry.placeholder_event_id)}" data-event-id="${escapeHtml(entry.placeholder_event_id)}"${resultEventId === entry.placeholder_event_id ? ' tabindex="-1"' : ''}><header><span>#${entry.sequence}</span><strong>${escapeHtml(entry.source_name)}</strong><span>${entry.action_cost} Action${entry.action_cost === 1 ? '' : 's'}</span></header><p>${escapeHtml(summary)}</p><footer>${worklogStatusMarkup(entry, publicMatch)}${entry.locked ? ' · Locked' : ''}</footer></article>`;
  }).join('');
}

function candidateMarkup(ticket, session, context) {
  return ticket.public_candidate_fault_ids.map((candidateId) => {
    const hypothesis = session.projection.legal_intents.find((intent) => intent.action_type === 'REVISE_HYPOTHESIS'
      && intent.ticket_instance_id === ticket.ticket_instance_id && intent.candidate_fault_id === candidateId);
    const isolation = session.projection.legal_intents.find((intent) => intent.action_type === 'COMMIT_ISOLATION'
      && intent.ticket_instance_id === ticket.ticket_instance_id && intent.candidate_fault_id === candidateId);
    const current = session.projection.view.hypotheses[ticket.ticket_instance_id]?.includes(candidateId);
    const elimination = session.projection.legal_intents.find((intent) => intent.action_type === 'SET_ELIMINATION'
      && intent.ticket_instance_id === ticket.ticket_instance_id && intent.candidate_fault_id === candidateId);
    const eliminated = [...session.projection.view.eliminations].reverse().find((record) =>
      record.ticket_instance_id === ticket.ticket_instance_id
        && record.candidate_fault_id === candidateId
        && record.diagnosis_revision === ticket.diagnosis_revision)?.eliminated === true;
    const state = eliminated ? 'ruled-out' : current ? 'hypothesis' : 'candidate';
    return `<li class="candidate-row${current ? ' is-hypothesis' : ''}${eliminated ? ' is-eliminated' : ''}" data-candidate-state="${state}" data-candidate-id="${escapeHtml(candidateId)}"><div><span>${escapeHtml(domainName(context.catalog, candidateId))}</span><code>${escapeHtml(candidateId)}</code>${eliminated ? '<small>Ruled out for this diagnosis stage</small>' : ''}</div><div class="candidate-actions">${hypothesis ? `<button type="button" class="basic-action basic-action--hypothesis" data-intent-id="${hypothesis.intent_id}"${session.resolving ? ' disabled' : ''}>Hypothesize</button>` : current ? '<span class="candidate-marker">Current hypothesis</span>' : ''}${elimination ? `<button type="button" class="basic-action" data-intent-id="${elimination.intent_id}"${session.resolving ? ' disabled' : ''}>${eliminated ? 'Reinstate' : 'Rule out'}</button>` : ''}${isolation ? `<button type="button" class="basic-action basic-action--isolate" data-intent-id="${isolation.intent_id}"${session.resolving ? ' disabled' : ''}>Isolate</button>` : ''}</div></li>`;
  }).join('');
}

function candidateSummaryMarkup(ticket, session, context) {
  const hypotheses = new Set(session.projection.view.hypotheses[ticket.ticket_instance_id] ?? []);
  return ticket.public_candidate_fault_ids.map((candidateId) => {
    const eliminated = [...session.projection.view.eliminations].reverse().find((record) =>
      record.ticket_instance_id === ticket.ticket_instance_id
        && record.candidate_fault_id === candidateId
        && record.diagnosis_revision === ticket.diagnosis_revision)?.eliminated === true;
    const state = eliminated ? 'ruled-out' : hypotheses.has(candidateId) ? 'hypothesis' : 'candidate';
    const stateLabel = state === 'hypothesis' ? '<small>Hypothesis</small>' : state === 'ruled-out' ? '<small>Ruled out</small>' : '';
    return `<li class="candidate-chip${state === 'hypothesis' ? ' is-hypothesis' : ''}${state === 'ruled-out' ? ' is-eliminated' : ''}" data-candidate-state="${state}" data-candidate-id="${escapeHtml(candidateId)}"><span>${escapeHtml(domainName(context.catalog, candidateId))}</span>${stateLabel}</li>`;
  }).join('');
}

function ticketWorkflowMarkup(documentModels, closureIntent, session, headingId) {
  const selectedTicket = session.projection?.view?.public_match?.repair_queue?.find((ticket) =>
    ticket.ticket_instance_id === session.selectedTicketId);
  const hasResultHistory = selectedTicket?.worklog?.some((entry) => entry.source_result_event_id);
  if (!documentModels.length && !closureIntent && !hasResultHistory) return '';
  const actions = session.projection?.view?.public_match?.turn?.actions_remaining;
  const legalCount = documentModels.filter((model) => model.document_live_legal).length;
  const pendingCount = documentModels.length - legalCount;
  const stateCopy = legalCount
    ? 'Preview the exact authorized record before spending 1 Action.'
    : pendingCount
      ? `${pendingCount} eligible ${pendingCount === 1 ? 'record remains' : 'records remain'} for Document Live, which costs 1 Action. ${actions === 0 ? 'No Actions remain this turn.' : 'The authority does not currently expose a legal Document Live intent.'}`
      : 'No documentable records remain for this Ticket. Passing does not create a record.';
  const sourceControls = documentModels.map((model) => model.document_live_legal
    ? `<button type="button" class="basic-action basic-action--document" data-preview-document="${escapeHtml(model.intent_id)}" data-document-source="${escapeHtml(model.source_action_event_id)}"${session.resolving ? ' disabled' : ''}>Document ${escapeHtml(model.source_name)} · Worklog #${model.worklog_sequence}</button>`
    : `<button type="button" class="basic-action basic-action--document" data-document-pending="${escapeHtml(model.source_action_event_id)}" disabled>Document ${escapeHtml(model.source_name)} · Worklog #${model.worklog_sequence} · requires 1 Action</button>`).join('');
  const closureCopy = closureIntent
    ? '<p class="documentation-workflow__closure-note">Ready to close separately: Document &amp; Close costs 0 Actions and remains independently validated.</p>'
    : '<p class="documentation-workflow__closure-note">Document &amp; Close becomes available only when the separate closure bundle is legal.</p>';
  return `<section class="documentation-workflow" aria-labelledby="${escapeHtml(headingId)}" data-documentable-state="${legalCount ? 'legal' : pendingCount ? 'pending-actions' : 'none'}"><h3 id="${escapeHtml(headingId)}">Documentation workflow</h3><p role="status">${escapeHtml(stateCopy)}</p>${closureCopy}<div class="candidate-actions">${sourceControls}${closureIntent ? `<button type="button" class="basic-action basic-action--close" data-intent-id="${closureIntent.intent_id}"${session.resolving ? ' disabled' : ''}>Document &amp; Close · 0 Actions</button>` : ''}</div></section>`;
}

function isolationGuidanceMarkup(ticket, session, context) {
  const projection = session.projection;
  const evidence = projection.view.authorized_events.filter((event) =>
    event.ticket_instance_id === ticket.ticket_instance_id
      && ['EVIDENCE_CREATED', 'VERIFY_EVIDENCE_CREATED'].includes(event.event_type));
  const isolationIntents = projection.legal_intents.filter((intent) =>
    intent.action_type === 'COMMIT_ISOLATION' && intent.ticket_instance_id === ticket.ticket_instance_id);
  const cited = new Set(isolationIntents.flatMap((intent) => intent.cited_evidence_event_ids ?? []));
  const dispositions = evidence.flatMap((event) => (event.payload?.candidate_effects ?? []).map((effect) => ({
    sequence: event.sequence,
    disposition: effect.disposition,
    candidate: domainName(context.catalog, effect.candidate_fault_id),
    cited: cited.has(event.event_id),
  })));
  const phaseAccepts = ['DIAGNOSIS', 'RETURNED_TO_DIAGNOSIS'].includes(ticket.status);
  return `<details class="isolation-guidance"><summary>Why can’t I isolate?</summary><div>
    <p><strong>Current phase:</strong> ${phaseAccepts ? 'Diagnosis accepts Isolation attempts.' : `${escapeHtml(STATUS_LABELS[ticket.status] || ticket.status)} does not accept a new Isolation.`}</p>
    <p><strong>Projected route:</strong> ${isolationIntents.length ? `${isolationIntents.length} candidate route${isolationIntents.length === 1 ? ' is' : 's are'} supported by currently authorized information.` : 'No candidate route is currently supported by the authorized Evidence, valid current-stage eliminations, and public prerequisites.'}</p>
    <p><strong>Projected citations:</strong> ${cited.size ? [...cited].map((id) => evidence.find((event) => event.event_id === id)?.sequence).filter(Number.isFinite).map((sequence) => `Evidence #${sequence}`).join(', ') : 'None selected by a projected legal Isolation.'}</p>
    ${dispositions.length ? `<ul>${dispositions.map((item) => `<li><strong>${escapeHtml(item.disposition)}</strong> · ${escapeHtml(item.candidate)} · Evidence #${item.sequence}${item.cited ? ' · selected citation' : ''}</li>`).join('')}</ul>` : '<p>No candidate-changing disposition has been recorded yet. Clean, unrelated, and inconclusive findings still remain Evidence.</p>'}
    <p>CONFIRM is decisive only for its named Candidate; SUPPORT may need corroboration; CONTRADICT and RULE_OUT weigh against a Candidate; INCONCLUSIVE does not decide it. A confirmed non-actionable condition does not open Repair.</p>
    <p>An unsupported attempt deliberately does not say whether the Candidate was wrong or the Evidence was insufficient. Inspect Evidence, run another relevant diagnostic, update a cited notebook elimination, or use Give Up if you want to abandon this Ticket and authorize its private solution reveal.</p>
  </div></details>`;
}

function fullTicketMarkup(ticket, presentation, session, context, documentModels, closureIntent) {
  if (!ticket) return '<p>No active Ticket.</p>';
  return `<div class="full-ticket-detail" data-semantic-surface="paper">
    <header><p class="ticket-code">${escapeHtml(ticket.ticket_instance_id)}</p><h2 id="full-ticket-heading">${escapeHtml(presentation?.display_name || ticket.ticket_definition_id)}</h2><p>${escapeHtml(presentation?.short_description || 'Generated repair scenario')}</p><span class="ticket-status" data-status="${ticket.status}">${escapeHtml(STATUS_LABELS[ticket.status] || ticket.status)}</span></header>
    <figure class="full-ticket-art play-art-slot"><img id="full-ticket-art" width="1200" height="360" alt=""></figure>
    <section class="ticket-symptoms"><h3>Observe · visible symptoms</h3><ul>${ticket.visible_symptom_ids.map((id) => `<li>${escapeHtml(domainName(context.catalog, id))}<code>${escapeHtml(id)}</code></li>`).join('')}</ul></section>
    <section class="machine-state-strip"><span>Machine state</span><strong>${escapeHtml(presentation?.machine_state_summary || 'No authorized machine-state change recorded.')}</strong><small>Machine revision ${ticket.machine_revision} · diagnosis stage ${ticket.diagnosis_revision} · Repair changes state; Verify proves recovery.</small></section>
    <section class="candidate-tray"${ticket.status === 'RETURNED_TO_DIAGNOSIS' ? ' data-diagnosis-reopened="true"' : ''}><div class="section-heading"><div><p class="play-eyebrow">Hypothesize ↔ Test</p><h3>Candidate faults</h3></div><span>${ticket.public_candidate_fault_ids.length}</span></div><ul>${candidateMarkup(ticket, session, context)}</ul></section>
    <section class="accepted-isolation" data-isolation-state="${ticket.accepted_isolations.length ? 'accepted' : 'pending'}"><h3>Accepted Isolation</h3>${ticket.accepted_isolations.length ? ticket.accepted_isolations.map((record) => `<article><strong>${escapeHtml(domainName(context.catalog, record.candidate_fault_id))}</strong><span>${escapeHtml(record.classification.replaceAll('_', ' '))}</span><small>${record.cited_public_evidence_event_ids.length} public citation${record.cited_public_evidence_event_ids.length === 1 ? '' : 's'}</small></article>`).join('') : '<p>No actionable fault accepted yet. CONFIRM Evidence is decisive, but only an Accepted Isolation opens Repair.</p>'}</section>
    ${isolationGuidanceMarkup(ticket, session, context)}
    ${ticketWorkflowMarkup(documentModels, closureIntent, session, 'full-ticket-documentation-heading')}
  </div>`;
}

function documentPreviewMarkup(model, projection, session) {
  const ticket = ticketName(projection, model.ticket_instance_id);
  const actor = playerName(projection.view.public_match, model.source_actor_player_id);
  const rejection = session.documentPreview?.rejection;
  const consequence = model.recovery_available
    ? 'The source response Card returns from discard to its owner’s hand after successful publication.'
    : 'The persistent Diagnostic Bench item remains available; no Card changes zones.';
  return `<header class="play-dialog__header"><div><p class="play-eyebrow">Exact publication preview</p><h2 id="document-preview-heading">Document ${escapeHtml(model.source_name)}</h2></div><button type="button" class="dialog-close" data-close-dialog="document-preview" aria-label="Cancel Documentation preview"${session.resolving ? ' disabled' : ''}>×</button></header>
    <div class="play-dialog__body document-preview__body">
      ${rejection ? `<section class="document-preview__rejection" role="alert"><h3>Documentation was not submitted</h3><p>${escapeHtml(rejection.error_message || rejection.error_code)}</p><p><strong>Nothing was spent:</strong> 0 Actions and no Card movement.</p></section>` : ''}
      <dl class="document-preview__facts">
        <div><dt>Ticket</dt><dd>${escapeHtml(ticket)}<code>${escapeHtml(model.ticket_instance_id)}</code></dd></div>
        <div><dt>Original Worklog</dt><dd>#${model.worklog_sequence} · ${timestampMarkup(model.action_time)}</dd></div>
        <div><dt>Source action</dt><dd>${escapeHtml(model.source_name)}<code>${escapeHtml(model.source_action_event_id)}</code></dd></div>
        <div><dt>Authorized result</dt><dd>${escapeHtml(visibilityLabel(model.result_visibility))}<code>${escapeHtml(model.source_result_event_id)}</code></dd></div>
        <div><dt>Recorded by</dt><dd>${escapeHtml(actor)}</dd></div>
        <div><dt>Cost</dt><dd>1 Action</dd></div>
      </dl>
      <section class="document-preview__summary" aria-labelledby="document-summary-heading"><h3 id="document-summary-heading">Public summary to publish</h3>${model.public_summary ? `<blockquote>${escapeHtml(model.public_summary)}</blockquote>` : '<p role="alert">The authenticated projection does not contain an exact public summary. Documentation is unavailable until authority supplies one.</p>'}</section>
      <p class="document-preview__consequence"><strong>Card consequence:</strong> ${escapeHtml(consequence)}</p>
    </div>
    <footer class="play-dialog__footer document-preview__actions"><button type="button" class="play-button" data-cancel-document${session.resolving ? ' disabled' : ''}>Cancel</button><button type="button" class="play-button play-button--primary" data-submit-document="${escapeHtml(model.intent_id)}"${session.resolving || !model.preview_complete ? ' disabled' : ''}>${session.resolving ? 'Documenting…' : 'Document'}</button></footer>`;
}

export function buildArchivedTicketRecords(projection) {
  const publicMatch = projection.view.public_match;
  const revealIds = new Set((projection.view.solution_reveals ?? []).map((entry) => entry.ticket_instance_id));
  return [
    ...(publicMatch.closed_tickets ?? []).map((ticket) => ({
      state: 'closed',
      state_label: 'Closed',
      ticket,
      outcome_actor_player_id: ticket.closure?.closer_player_id ?? null,
      outcome_time: ticket.closure?.closed_at ?? null,
      solution_reveal_authorized: false,
    })),
    ...(publicMatch.abandoned_tickets ?? []).map((ticket) => ({
      state: 'abandoned',
      state_label: 'Given up',
      ticket,
      outcome_actor_player_id: ticket.abandonment?.player_id ?? null,
      outcome_time: ticket.abandonment?.abandoned_at ?? null,
      solution_reveal_authorized: revealIds.has(ticket.ticket_instance_id),
    })),
  ];
}

function archivedTicketButtonsMarkup(records, projection) {
  if (!records.length) return '<p class="archive-empty">No archived Tickets yet.</p>';
  return records.map((record) => `<button type="button" class="closure-chip archive-ticket-button${record.state === 'abandoned' ? ' closure-chip--abandoned' : ''}" data-archive-ticket-id="${escapeHtml(record.ticket.ticket_instance_id)}"><span>${escapeHtml(record.state_label)}</span><strong>${escapeHtml(ticketName(projection, record.ticket.ticket_instance_id))}</strong><code>${escapeHtml(record.ticket.ticket_instance_id)}</code></button>`).join('');
}

function archivedEvidenceMarkup(record, projection, catalog) {
  const publicMatch = projection.view.public_match;
  const events = projection.view.authorized_events.filter((event) =>
    event.ticket_instance_id === record.ticket.ticket_instance_id
      && ['EVIDENCE_CREATED', 'VERIFY_RESOLVED', 'VERIFY_EVIDENCE_CREATED'].includes(event.event_type))
    .sort((left, right) => left.sequence - right.sequence);
  if (!events.length) return '<p>No authorized Evidence is available in this archived projection.</p>';
  return events.map((event) => {
    const summary = eventSummary(event, catalog);
    return `<article class="archive-evidence" data-event-id="${escapeHtml(event.event_id)}"><header><strong>Evidence #${event.sequence}</strong><span>${escapeHtml(visibilityLabel(event.visibility))}</span></header><p>${summary.source ? `<strong>${escapeHtml(summary.source)}</strong> · ` : ''}${escapeHtml(summary.summary || 'Authorized result retained without a public summary.')}</p><footer>${escapeHtml(playerName(publicMatch, event.actor_player_id))} · ${timestampMarkup(event.created_at)}</footer></article>`;
  }).join('');
}

function archivedMilestonesMarkup(record, projection, catalog) {
  const publicMatch = projection.view.public_match;
  const authorizedById = new Map(projection.view.authorized_events
    .filter((event) => event.ticket_instance_id === record.ticket.ticket_instance_id)
    .map((event) => [event.event_id, event]));
  const milestones = [];
  for (const isolation of record.ticket.accepted_isolations ?? []) {
    const event = authorizedById.get(isolation.isolation_event_id);
    milestones.push({
      sequence: event?.sequence ?? Number.MAX_SAFE_INTEGER,
      time: event?.created_at ?? null,
      label: 'Isolation accepted',
      summary: domainName(catalog, isolation.candidate_fault_id),
      contributor: playerName(publicMatch, isolation.contributor_player_id),
    });
  }
  for (const repair of record.ticket.repair_summaries ?? []) {
    const event = authorizedById.get(repair.repair_event_id);
    milestones.push({
      sequence: event?.sequence ?? Number.MAX_SAFE_INTEGER,
      time: event?.created_at ?? null,
      label: 'Repair performed',
      summary: `${domainName(catalog, repair.repair_procedure_id)} · ${repair.public_summary}`,
      contributor: playerName(publicMatch, repair.player_id),
    });
  }
  for (const verify of record.ticket.verify_summaries ?? []) {
    const event = authorizedById.get(verify.verify_event_id);
    milestones.push({
      sequence: event?.sequence ?? Number.MAX_SAFE_INTEGER,
      time: event?.created_at ?? null,
      label: `Verify ${verify.result.toLowerCase()}`,
      summary: `${domainName(catalog, verify.validation_procedure_id)}${verify.is_current ? ' · current machine revision' : ' · preserved earlier revision'}`,
      contributor: playerName(publicMatch, verify.player_id),
    });
  }
  for (const entry of (record.ticket.worklog ?? []).filter((worklog) => worklog.publication_event_id)) {
    const event = authorizedById.get(entry.publication_event_id);
    milestones.push({
      sequence: event?.sequence ?? Number.MAX_SAFE_INTEGER,
      time: entry.publication_time,
      label: 'Result documented',
      summary: `${entry.source_name} from Worklog #${entry.sequence}`,
      contributor: playerName(publicMatch, entry.publisher_player_id),
    });
  }
  milestones.sort((left, right) => left.sequence - right.sequence
    || String(left.time).localeCompare(String(right.time)));
  if (!milestones.length) return '<p>No isolate, repair, verify, or document milestone is available in this archived projection.</p>';
  return `<ol>${milestones.map((milestone) => `<li><span>${milestone.sequence === Number.MAX_SAFE_INTEGER ? 'Sequence unavailable' : `Event #${milestone.sequence}`}</span><strong>${escapeHtml(milestone.label)}</strong><p>${escapeHtml(milestone.summary)}</p><small>${escapeHtml(milestone.contributor)} · ${timestampMarkup(milestone.time)}</small></li>`).join('')}</ol>`;
}

function archivedTicketReviewMarkup(record, projection, catalog) {
  const ticket = record.ticket;
  const publicMatch = projection.view.public_match;
  const outcomeActor = playerName(publicMatch, record.outcome_actor_player_id);
  const worklog = [...(ticket.worklog ?? [])].sort((left, right) => left.sequence - right.sequence);
  const finalState = STATUS_LABELS[ticket.status] || ticket.status || 'State unavailable';
  const machineRevision = Number.isInteger(ticket.machine_revision)
    ? `machine revision ${ticket.machine_revision}`
    : 'machine revision unavailable';
  const visibleSymptoms = (ticket.visible_symptom_ids ?? [])
    .map((id) => escapeHtml(domainName(catalog, id))).join(', ')
    || 'No visible symptom snapshot is available.';
  const publicCandidates = (ticket.public_candidate_fault_ids ?? [])
    .map((id) => escapeHtml(domainName(catalog, id))).join(', ')
    || 'No public Candidate snapshot is available.';
  return `<header class="play-dialog__header"><div><p class="play-eyebrow">Read-only operational record</p><h2 id="archive-review-heading">${escapeHtml(ticketName(projection, ticket.ticket_instance_id))}</h2><code>${escapeHtml(ticket.ticket_instance_id)}</code></div><button type="button" class="dialog-close" data-close-dialog="archive-review" aria-label="Close archived Ticket review">×</button></header>
    <div class="play-dialog__body archive-review__body">
      <section class="archive-review__summary" aria-labelledby="archive-summary-heading"><h3 id="archive-summary-heading">Ticket summary</h3><dl><div><dt>Outcome</dt><dd>${escapeHtml(record.state_label)} by ${escapeHtml(outcomeActor)} · ${timestampMarkup(record.outcome_time)}</dd></div><div><dt>Final state</dt><dd>${escapeHtml(finalState)} · ${escapeHtml(machineRevision)}</dd></div><div><dt>Visible symptoms</dt><dd>${visibleSymptoms}</dd></div><div><dt>Public Candidates</dt><dd>${publicCandidates}</dd></div></dl></section>
      <div class="archive-history-region" role="region" aria-label="Authorized Evidence and chronological Worklog for ${escapeHtml(ticketName(projection, ticket.ticket_instance_id))}" tabindex="0">
        <section aria-labelledby="archive-evidence-heading"><h3 id="archive-evidence-heading">Authorized Evidence</h3><div class="archive-evidence-list">${archivedEvidenceMarkup(record, projection, catalog)}</div></section>
        <section aria-labelledby="archive-worklog-heading"><h3 id="archive-worklog-heading">Chronological Worklog</h3><div class="archive-worklog-list">${worklog.length ? renderWorklog({ ...ticket, worklog }, [], null, publicMatch) : '<p>No Worklog history is available for this archived record.</p>'}</div></section>
        <section class="archive-milestones" aria-labelledby="archive-milestones-heading"><h3 id="archive-milestones-heading">Visible milestones and contributors</h3>${archivedMilestonesMarkup(record, projection, catalog)}</section>
      </div>
      ${record.solution_reveal_authorized ? `<button type="button" class="play-button archive-solution-link" data-view-solution-ticket="${escapeHtml(ticket.ticket_instance_id)}">View authorized solution reveal</button>` : ''}
      <p class="authority-note">This review uses only the current authenticated archived-Ticket projection. It cannot target or change an active Ticket.</p>
    </div>
    <footer class="play-dialog__footer"><button type="button" class="play-button" data-close-dialog="archive-review">Close</button></footer>`;
}

function solutionRevealMarkup(view, catalog, projection, expanded = false) {
  const reveals = view.solution_reveals ?? [];
  if (!reveals.length) return '';
  return reveals.map((entry) => {
    const reveal = entry.solution_reveal;
    const archived = (view.public_match.abandoned_tickets ?? []).find((ticket) => ticket.ticket_instance_id === entry.ticket_instance_id);
    const actualEvidence = view.authorized_events.filter((event) => event.ticket_instance_id === entry.ticket_instance_id
      && ['EVIDENCE_CREATED', 'VERIFY_EVIDENCE_CREATED'].includes(event.event_type));
    const requiredSources = [...new Set(reveal.evidence_solution.flatMap((route) =>
      route.evidence.map((item) => item.source_definition_id).filter(Boolean)))];
    const actualSources = new Set(actualEvidence.map((event) => event.payload?.source_definition_id).filter(Boolean));
    const missingSources = requiredSources.filter((id) => !actualSources.has(id));
    const unresolvedIds = [
      ...reveal.faults.map((fault) => fault.fault_id),
      ...requiredSources,
      ...reveal.repair_solution.map((item) => item.repair_procedure_id),
      ...reveal.verification_solution.map((item) => item.validation_procedure_id),
    ].filter((id) => id && !catalog.domainById.has(id));
    const contentError = !reveal.faults.length || !reveal.evidence_solution.length
      || !reveal.repair_solution.length || !reveal.verification_solution.length || unresolvedIds.length;
    return `<details class="solution-reveal"${expanded ? ' open' : ''} data-reveal-authorized="true" data-solution-reveal-ticket="${escapeHtml(entry.ticket_instance_id)}" tabindex="-1"><summary>Solution revealed · ${escapeHtml(ticketName(projection, entry.ticket_instance_id))}</summary>
      ${contentError ? `<section class="solution-reveal__error" role="alert" data-code="REVEAL_CONTENT_INCONSISTENT"><h3>Content consistency error</h3><p>The authored solution is incomplete or references unavailable playable content. This is a content error, not a Player failure.</p></section>` : ''}
      <ol class="solution-reveal__sequence">
        <li><section><h3>1 · Observe and original Candidates</h3><p><strong>Symptoms:</strong> ${(archived?.visible_symptom_ids ?? []).map((id) => escapeHtml(domainName(catalog, id))).join(', ') || 'No public symptom snapshot available.'}</p><p>These original Candidates came from the Ticket’s public symptom/context relationships:</p><ul>${(archived?.public_candidate_fault_ids ?? []).map((id) => `<li>${escapeHtml(domainName(catalog, id))}</li>`).join('')}</ul></section></li>
        <li><section><h3>2 · Causal truth</h3><p><strong>Hidden causal truth</strong> is shown only after Give Up is accepted.</p><ul>${reveal.faults.map((fault) => { const role = fault.role.toLowerCase(); return `<li><strong>${escapeHtml(domainName(catalog, fault.fault_id))}</strong> · ${escapeHtml(role)}${fault.actionable && role !== 'actionable' ? ' · actionable' : ''}</li>`; }).join('')}</ul>${reveal.causal_links.length ? `<p>${reveal.causal_links.map((link) => `${domainName(catalog, link.cause_fault_id)} → ${domainName(catalog, link.effect_fault_id)}`).map(escapeHtml).join('<br>')}</p>` : '<p>Single-fault path.</p>'}</section></li>
        <li><section><h3>3 · Required Evidence path</h3><ul>${reveal.evidence_solution.map((route) => `<li><strong>${escapeHtml(route.route_kind.replaceAll('_', ' '))}</strong><span>Candidate: ${escapeHtml(domainName(catalog, route.candidate_fault_id))}</span>${route.evidence.map((item) => `<span>${item.source_definition_id ? `${escapeHtml(domainName(catalog, item.source_definition_id))}: ` : ''}${escapeHtml(item.summary)}</span>`).join('')}${route.eliminated_candidate_fault_ids.length ? `<span>Eliminate: ${route.eliminated_candidate_fault_ids.map((id) => escapeHtml(domainName(catalog, id))).join(', ')}</span>` : ''}</li>`).join('')}</ul></section></li>
        <li><section><h3>4 · Eligible Repair</h3><ul>${reveal.repair_solution.map((item) => `<li><strong>${escapeHtml(domainName(catalog, item.repair_procedure_id))}</strong><span>${escapeHtml(item.summary)}</span></li>`).join('')}</ul></section></li>
        <li><section><h3>5 · Verify and closure</h3><ul>${reveal.verification_solution.map((item) => `<li><strong>${escapeHtml(domainName(catalog, item.validation_procedure_id))}</strong><span>${escapeHtml(item.summary)}</span></li>`).join('')}</ul><p>Closure requires the accepted path, its decisive citations, every necessary Repair, preserved failed Verifies, and all current passing Verify requirements.</p></section></li>
      </ol>
      <section class="solution-reveal__comparison"><h3>Your investigation compared with the required path</h3>${actualEvidence.length ? `<ul>${actualEvidence.map((event) => `<li><strong>Evidence #${event.sequence}</strong> · ${event.payload?.source_definition_id ? escapeHtml(domainName(catalog, event.payload.source_definition_id)) : 'Recorded finding'} · ${escapeHtml(event.payload?.public_summary || 'Authorized result retained.')}</li>`).join('')}</ul>` : '<p>No diagnostic Evidence was recorded before Give Up.</p>'}<p>${missingSources.length ? `Required diagnostic sources not yet recorded: ${missingSources.map((id) => escapeHtml(domainName(catalog, id))).join(', ')}.` : 'Your recorded Evidence included every diagnostic source named by at least one revealed route.'} Optional or redundant work remains valid history; it is not retroactively labeled illegal.</p><p>${archived?.worklog?.length ?? 0} immutable Worklog ${archived?.worklog?.length === 1 ? 'entry was' : 'entries were'} preserved and locked.</p></section>
      <p>No further play can target this archived Ticket. The reveal is private to this local Player and is never written into Profile or backup data.</p>
    </details>`;
  }).join('');
}

function tutorialCoachMarkup(session) {
  const tutorial = session.tutorial;
  if (!tutorial || tutorial.completed) return '';
  const checkpoint = tutorial.presentation(session.projection);
  return `<aside class="tutorial-coach" aria-labelledby="tutorial-step-heading" data-tutorial-checkpoint="${escapeHtml(checkpoint.id)}" data-tutorial-guidance="${escapeHtml(checkpoint.guidance_mode.toLowerCase())}">
    <header><p class="play-eyebrow">${tutorial.isReviewing ? 'Review · no state rewind' : `Guided step ${tutorial.index + 1} of ${tutorial.definition.checkpoints.length}`}</p><h2 id="tutorial-step-heading" tabindex="-1">${escapeHtml(checkpoint.title)}</h2></header>
    <div class="tutorial-coach__copy">${checkpoint.body.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('')}</div>
    <div class="tutorial-coach__controls">${checkpoint.checkpoint_kind === 'EXPLAIN' || tutorial.isReviewing ? `<button type="button" class="play-button play-button--primary" data-tutorial-continue>${tutorial.isReviewing ? 'Return to current step' : 'Continue'}</button>` : `<span class="tutorial-wait">${escapeHtml(checkpoint.wait_copy)}</span>`}<button type="button" class="play-button" data-tutorial-back${tutorial.index < 1 ? ' disabled' : ''}>Back / re-explain</button><button type="button" class="play-button" data-tutorial-restart>Restart</button><button type="button" class="play-button play-button--danger" data-tutorial-exit>Exit tutorial</button></div>
  </aside>`;
}

function resultMarkup(session, context) {
  const result = session.terminalResult;
  const archiveRecords = buildArchivedTicketRecords(session.projection);
  const won = result.solo_wins === 1;
  const status = won ? 'Queue cleared' : result.solo_stalemates ? 'Proven stalemate' : result.invalid_or_capped_results ? 'Invalid or capped' : 'Shift ended';
  const storyMatch = Boolean(session.storyContext);
  const storyReview = Boolean(session.storyReview);
  const storyMode = storyMatch || storyReview;
  const canContinueStory = Boolean(
    storyMatch && session.storyContinuationReady && session.storyMatchResult,
  );
  const recordStatus = storyReview
    ? 'Practice result only. It was not added to canonical Story history, rewards, or Profile statistics.'
    : session.tutorial
    ? 'Tutorial completion recorded as local replay progress only.'
    : session.resultApplied === false
      ? 'This result was already present; lifetime totals were not incremented twice.'
      : session.resultApplied === true
        ? 'Result recorded exactly once in this local Profile.'
        : `The Match is complete, but its Profile record could not be saved${context.ui?.storageWarning ? `: ${context.ui.storageWarning}` : '.'}`;
  const storyReturn = storyMatch
    ? `<div class="story-result-return" data-result-reveal>
        ${session.storyReturnError ? `<p class="play-global-notice" data-tone="error" role="alert">The Match record is safe, but Story cannot advance: ${escapeHtml(session.storyReturnError)}</p>` : ''}
        ${canContinueStory ? '<button type="button" class="play-button play-button--primary" data-continue-story>Continue Story</button>' : ''}
        <p>${canContinueStory ? 'Cross the reviewed post-Match checkpoint exactly once.' : session.storyReturnError ? 'Return to Story Home to recover from the last durable checkpoint.' : 'The result is being validated separately from Profile statistics.'}</p>
      </div>`
    : '';
  return `
    <section class="play-route result-route" aria-labelledby="result-heading">
      <div class="result-panel">
        <p class="play-eyebrow" data-result-reveal>${storyReview ? 'Story practice result' : storyMatch ? 'Story Match result' : 'Local solo result'}</p>
        <h1 id="result-heading" tabindex="-1" data-result-reveal>${status}</h1>
        <p data-result-reveal>${won ? 'Every Ticket was closed through an Evidence-backed causal record.' : 'Review the terminal reasons and preserve the useful history.'}</p>
        ${solutionRevealMarkup(session.projection?.view ?? { solution_reveals: [] }, context.catalog, session.projection, true)}
        <div class="result-score" data-result-reveal><span>Service Points</span><strong>${formatInteger(result.final_service_points)}</strong><small>+${formatInteger(result.service_points_gained)} this Match</small></div>
        <dl class="result-stat-grid" data-result-reveal>
          <div><dt>Tickets closed</dt><dd>${result.tickets_closed}</dd></div>
          <div><dt>Tickets given up</dt><dd>${result.tickets_given_up}</dd></div>
          <div><dt>Turns</dt><dd>${result.turns_elapsed}</dd></div>
          <div><dt>Elapsed</dt><dd>${formatDuration(result.elapsed_seconds)}</dd></div>
          <div><dt>Tests</dt><dd>${result.tests_run}</dd></div>
          <div><dt>Isolation</dt><dd>${result.isolations_accepted} accepted · ${result.isolations_rejected} rejected</dd></div>
          <div><dt>Repair / Verify</dt><dd>${result.repairs_performed} / ${result.verify_attempts}</dd></div>
          <div><dt>Failed Verify</dt><dd>${result.failed_verifies}</dd></div>
          <div><dt>Documentation</dt><dd>${result.documentation_actions}</dd></div>
          <div><dt>Elimination updates</dt><dd>${result.eliminations_recorded}</dd></div>
          <div><dt>Search / Refresh</dt><dd>${result.search_uses} / ${result.refresh_uses}</dd></div>
          <div><dt>Redundant / superseded</dt><dd>${result.redundant_or_superseded_actions}</dd></div>
        </dl>
        <details class="result-reasons" data-result-reveal><summary>Terminal reasons</summary><ul>${result.reason_codes.map((reason) => `<li><code>${escapeHtml(reason)}</code></li>`).join('')}</ul></details>
        <section class="result-archive" aria-labelledby="result-archive-heading" data-result-reveal><div><p class="play-eyebrow">Completed records</p><h2 id="result-archive-heading">Archived Tickets</h2></div><div class="result-archive__list">${archivedTicketButtonsMarkup(archiveRecords, session.projection)}</div></section>
        <p class="result-record-status"${session.resultApplied === null && !session.tutorial ? ' data-tone="error" role="alert"' : ''} data-result-reveal>${escapeHtml(recordStatus)}</p>
        ${storyReturn}
        <div class="button-row" data-result-reveal><button type="button" class="play-button${storyMode ? '' : ' play-button--primary'}" data-finish-game="${storyMode ? '#/play/story' : '#/play/home'}">${storyReview ? 'Return to Chapter history' : storyMatch ? 'Story Home' : 'Return Home'}</button>${session.tutorial ? `<button type="button" class="play-button" data-restart-completed-tutorial="${escapeHtml(session.tutorial.definition.id)}">Replay tutorial</button>` : storyReview ? '' : '<button type="button" class="play-button" data-finish-game="#/play/profile">View Profile</button>'}</div>
        <p class="authority-note" data-result-reveal>${storyReview ? 'The ordinary engine remains authoritative for this practice Match. The client intentionally discards its result outside the engine boundary, so it cannot change canonical Story or Profile statistics.' : session.tutorial ? 'Tutorial completion is local progress only. This Match did not change Profile points or statistics.' : storyMatch ? 'The engine remains authoritative for Match facts and Profile statistics. Story consumes only the validated, bounded result above.' : 'Local statistics are user-controlled and are not competitive records.'}</p>
      </div>
      <dialog id="archived-ticket-dialog" class="play-dialog archived-ticket-dialog" aria-labelledby="archive-review-heading"><div data-archive-dialog-content></div></dialog>
    </section>`;
}

function gameLoadingMarkup(error = null, { story = false } = {}) {
  return `<section class="play-route"><div class="game-loading"${error ? ' role="alert"' : ' aria-busy="true"'}><p class="play-eyebrow">Local authority</p><h1>${error ? `${story ? 'Story' : 'Solo'} Match could not start` : 'Building repair queue…'}</h1><p>${escapeHtml(error || 'The Ticket Builder and engine are preparing a complete deterministic Match in a dedicated Worker.')}</p>${error ? `<div class="button-row"><a class="play-button play-button--primary" href="#/play/decks">Review Deck coverage</a><a class="play-button" href="${story ? '#/play/story' : '#/play/home'}">${story ? 'Story Home' : 'Return Home'}</a></div>` : ''}</div></section>`;
}

function openArchivedTicketDialog(root, session, context, ticketId, opener) {
  const record = buildArchivedTicketRecords(session.projection)
    .find((entry) => entry.ticket.ticket_instance_id === ticketId);
  const dialog = root.querySelector('#archived-ticket-dialog');
  const content = dialog?.querySelector('[data-archive-dialog-content]');
  if (!record || !dialog || !content) return;
  content.innerHTML = archivedTicketReviewMarkup(record, session.projection, context.catalog);
  openPlayDialog(dialog, opener);
  context.announce(`${record.state_label} Ticket record opened. Read only.`);
}

function focusAuthorizedSolution(root, ticketId) {
  const reveal = root.querySelector(`[data-solution-reveal-ticket="${CSS.escape(ticketId)}"]`);
  if (!reveal) return;
  reveal.open = true;
  reveal.scrollIntoView({ block: 'nearest', behavior: 'auto' });
  reveal.focus({ preventScroll: true });
}

export function renderGame(root, context) {
  const session = context.game;
  if (session.error) {
    root.innerHTML = gameLoadingMarkup(session.error, { story: Boolean(session.storyContext || session.storyReview) });
    return () => {};
  }
  if (!session.projection) {
    root.innerHTML = gameLoadingMarkup(null, { story: Boolean(session.storyContext || session.storyReview) });
    return () => {};
  }
  if (session.terminalResult) {
    root.innerHTML = resultMarkup(session, context);
    const onClick = (event) => {
      const archived = event.target.closest('[data-archive-ticket-id]');
      if (archived) {
        openArchivedTicketDialog(root, session, context, archived.dataset.archiveTicketId, archived);
        return;
      }
      const solution = event.target.closest('[data-view-solution-ticket]');
      if (solution) {
        closePlayDialog(root.querySelector('#archived-ticket-dialog'), { restoreFocus: false, immediate: true });
        focusAuthorizedSolution(root, solution.dataset.viewSolutionTicket);
        return;
      }
      const closeDialog = event.target.closest('[data-close-dialog="archive-review"]');
      if (closeDialog) {
        closePlayDialog(root.querySelector('#archived-ticket-dialog'));
        return;
      }
      const finish = event.target.closest('[data-finish-game]');
      if (finish) context.finishGame(finish.dataset.finishGame);
      if (event.target.closest('[data-continue-story]')) context.continueStory();
      const replay = event.target.closest('[data-restart-completed-tutorial]');
      if (replay) context.restartTutorial(replay.dataset.restartCompletedTutorial);
    };
    root.addEventListener('click', onClick);
    requestAnimationFrame(() => {
      root.querySelector('#result-heading')?.focus();
      context.motion('result', root);
    });
    return () => root.removeEventListener('click', onClick);
  }

  const projection = session.projection;
  const view = projection.view;
  const publicMatch = view.public_match;
  const player = publicMatch.players.find((item) => item.player_id === view.player_id);
  const tickets = publicMatch.repair_queue;
  const selectedTicket = tickets.find((ticket) => ticket.ticket_instance_id === session.selectedTicketId) || tickets[0];
  session.selectedTicketId = selectedTicket?.ticket_instance_id ?? null;
  const presentation = selectedTicket ? projection.ticket_presentations[selectedTicket.ticket_instance_id] : null;
  session.benchView ||= context.snapshot.state.records.settings.preferred_bench_view;
  const bench = view.diagnostic_bench ?? [];
  const handGroups = groupHandInstances(view.hand, projection.legal_intents);
  const selectedHandGroup = handGroups.find((group) => group.instances.some((instance) =>
    instance.card_instance_id === session.selectedCardInstanceId));
  if (selectedHandGroup) {
    session.selectedCardInstanceId = firstEligibleInstance(selectedHandGroup, projection.legal_intents)?.card_instance_id ?? null;
  }
  const selectedCard = [...view.hand, ...bench].find((card) => card.card_instance_id === session.selectedCardInstanceId) ?? null;
  const selectedCardDefinition = context.catalog.cardById.get(selectedCard?.card_definition_id);
  const actionPresentation = buildSelectedActionPresentation({
    selectedCard,
    diagnosticBench: bench,
    legalIntents: projection.legal_intents,
    selectedTicket,
    cardDefinition: selectedCardDefinition,
    authorizedEvents: view.authorized_events,
  });
  const allDocumentModels = buildDocumentPreviewModels(projection);
  const documentModels = allDocumentModels
    .filter((model) => model.ticket_instance_id === session.selectedTicketId);
  const closureIntent = projection.legal_intents.find((intent) => intent.action_type === 'PUBLISH_CLOSURE' && intent.ticket_instance_id === session.selectedTicketId);
  const searchIntents = projection.legal_intents.filter((intent) => intent.action_type === 'SEARCH');
  const refreshIntent = projection.legal_intents.find((intent) => intent.action_type === 'REFRESH');
  const passIntent = projection.legal_intents.find((intent) => intent.action_type === 'PASS_TURN');
  const giveUpIntent = projection.legal_intents.find((intent) => intent.action_type === 'GIVE_UP_TICKET'
    && intent.ticket_instance_id === session.selectedTicketId);
  const lastClosureTicket = session.lastEvents.find((event) => event.event_type === 'CLOSURE_PUBLISHED')?.ticket_instance_id;
  const relevanceFor = (entry) => entry.ticket_relevance?.find((item) =>
    item.ticket_instance_id === session.selectedTicketId) ?? { relevant: false, why_relevant_paths: [] };
  const relevantCount = bench.filter((entry) => relevanceFor(entry).relevant).length;
  const categories = [...new Set(bench.map((entry) => entry.category))].sort();
  const normalizedQuery = session.benchSearch.trim().toLocaleLowerCase();
  const visibleBench = bench.filter((entry) => {
    const card = context.catalog.cardById.get(entry.card_definition_id);
    const relevant = relevanceFor(entry).relevant;
    if (session.benchView === 'RELEVANT' && !relevant) return false;
    if (session.benchView === 'GLOBAL' && session.benchRelevantOnly && !relevant) return false;
    if (session.benchTypeFilter !== 'ALL' && entry.diagnostic_type !== session.benchTypeFilter) return false;
    if (session.benchCategory !== 'ALL' && entry.category !== session.benchCategory) return false;
    if (session.benchRunnableOnly && !isDiagnosticRunnableOnTicket(
      projection.legal_intents,
      entry.card_instance_id,
      session.selectedTicketId,
    )) return false;
    if (normalizedQuery && !`${entry.card_definition_id} ${cardName(card)} ${card?.rules_text ?? ''}`.toLocaleLowerCase().includes(normalizedQuery)) return false;
    return true;
  }).sort((left, right) => {
    const leftCard = context.catalog.cardById.get(left.card_definition_id);
    const rightCard = context.catalog.cardById.get(right.card_definition_id);
    if (session.benchSort === 'COST') return left.action_cost - right.action_cost || cardName(leftCard).localeCompare(cardName(rightCard));
    if (session.benchSort === 'TYPE') return left.diagnostic_type.localeCompare(right.diagnostic_type) || cardName(leftCard).localeCompare(cardName(rightCard));
    if (session.benchSort === 'SUBSYSTEM') return left.category.localeCompare(right.category) || cardName(leftCard).localeCompare(cardName(rightCard));
    return cardName(leftCard).localeCompare(cardName(rightCard));
  });
  const benchPageSize = benchPageSizeForViewport(window.innerWidth);
  const benchPageCount = Math.max(1, Math.ceil(visibleBench.length / benchPageSize));
  session.benchPage = Math.min(Math.max(1, session.benchPage), benchPageCount);
  const pagedBench = visibleBench.slice((session.benchPage - 1) * benchPageSize, session.benchPage * benchPageSize);
  const handPageSize = handPageSizeForViewport(window.innerWidth);
  const handPage = pageHandGroups(handGroups, session.handPage, handPageSize);
  session.handPage = handPage.page;

  const archiveRecords = buildArchivedTicketRecords(projection);
  const archivedCount = archiveRecords.length;
  const benchStart = visibleBench.length ? (session.benchPage - 1) * benchPageSize + 1 : 0;
  const benchEnd = Math.min(session.benchPage * benchPageSize, visibleBench.length);
  const selectedCost = selectedCard?.action_cost ?? selectedCardDefinition?.action_cost ?? 0;
  const textReflow = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) >= 24;
  root.innerHTML = `
    <section class="play-route game-route game-route--${session.benchView.toLowerCase()}${textReflow ? ' game-route--text-reflow' : ''}" aria-labelledby="game-heading">
      <header class="game-header" data-route-reveal><div><p class="play-eyebrow">Solo training board</p><h1 id="game-heading">Night-shift board</h1><p>Round ${publicMatch.turn?.round_number ?? '—'} · Turn ${publicMatch.turn?.turn_number ?? '—'} · ${escapeHtml(publicMatch.turn?.phase?.replaceAll('_', ' ') || publicMatch.status)}</p></div><dl class="game-resources" data-continuity-scroll="game:resources"><div><dt>Points</dt><dd>${player.team_service_points ?? player.service_points}</dd></div><div><dt>Actions</dt><dd>${publicMatch.turn?.actions_remaining ?? 0} / 2</dd></div><div><dt>Search</dt><dd>${view.utility_resources.search_tokens}</dd></div><div><dt>Refresh</dt><dd>${view.utility_resources.refresh_tokens}</dd></div><div><dt>Deck / discard</dt><dd>${view.deck_count} / ${view.discard_card_instance_ids.length}</dd></div></dl></header>
      ${tutorialCoachMarkup(session)}
      ${projection.duplicate_ticket_disclosure ? `<p class="duplicate-disclosure game-disclosure"><strong>${projection.ticket_count}-Ticket queue:</strong> repeated causal fingerprints remain independent machine and Evidence records.</p>` : ''}
      ${solutionRevealMarkup(view, context.catalog, projection)}
      <div class="game-board game-board--${session.benchView.toLowerCase()}">
        <aside class="ticket-queue" aria-labelledby="queue-heading" data-route-reveal><div class="section-heading"><div><p class="play-eyebrow">Shared queue</p><h2 id="queue-heading">Active Tickets</h2></div><span>${tickets.length}</span></div><div class="ticket-queue__list" data-continuity-scroll="game:tickets">${tickets.map((ticket, index) => `<button type="button" class="ticket-card${ticket.ticket_instance_id === lastClosureTicket ? ' is-closing' : ''}" data-ticket-id="${escapeHtml(ticket.ticket_instance_id)}" aria-current="${ticket.ticket_instance_id === session.selectedTicketId}" data-drop-target="true"><span class="ticket-card__index">SR-${String(index + 1).padStart(3, '0')}</span><strong>${escapeHtml(ticketName(projection, ticket.ticket_instance_id))}</strong><span>${escapeHtml(STATUS_LABELS[ticket.status] || ticket.status)}</span><small>Revision ${ticket.machine_revision}</small></button>`).join('')}</div><details class="closed-ticket-list"><summary>Archived <span>${archivedCount}</span></summary><div>${archivedTicketButtonsMarkup(archiveRecords, projection)}</div></details></aside>
        <main class="board-center">
          <section class="ticket-sheet${selectedTicket?.status === 'RETURNED_TO_DIAGNOSIS' ? ' is-returned' : ''}" aria-labelledby="selected-ticket-heading" aria-current="true" data-semantic-surface="paper" data-ticket-state="${escapeHtml(selectedTicket?.status || 'EMPTY')}" data-route-reveal>${selectedTicket ? `<div class="ticket-sheet__art play-art-slot"><img id="ticket-art" width="1200" height="360" alt=""></div><div class="ticket-sheet__summary"><header><p class="ticket-code">${escapeHtml(selectedTicket.ticket_instance_id)}</p><h2 id="selected-ticket-heading">${escapeHtml(presentation?.display_name || selectedTicket.ticket_definition_id)}</h2><span class="ticket-status" data-status="${selectedTicket.status}">${escapeHtml(STATUS_LABELS[selectedTicket.status] || selectedTicket.status)}</span><span class="ticket-sheet__revision">Machine revision ${selectedTicket.machine_revision}</span></header><p class="ticket-sheet__symptom"><strong>Symptom:</strong> ${escapeHtml(domainName(context.catalog, selectedTicket.visible_symptom_ids[0]))}${selectedTicket.visible_symptom_ids.length > 1 ? ` +${selectedTicket.visible_symptom_ids.length - 1} more` : ''}</p><ul class="candidate-chip-row" aria-label="Candidate faults">${candidateSummaryMarkup(selectedTicket, session, context)}</ul><button type="button" class="play-button play-button--quiet view-full-ticket" data-view-full-ticket>View full Ticket</button></div>` : '<p>No active Ticket.</p>'}</section>
            <section class="diagnostic-bench" aria-labelledby="diagnostic-bench-heading" data-bench-page-size="${benchPageSize}" data-route-reveal><header class="diagnostic-bench__heading"><div><p class="play-eyebrow">Persistent catalog</p><h2 id="diagnostic-bench-heading">Diagnostic Bench</h2><p>${session.benchView === 'RELEVANT' ? `${relevantCount} of ${bench.length} connected by public relationships.` : `${bench.length} total diagnostics. Local filters never change legality.`}</p></div><div class="bench-view-switch" role="group" aria-label="Bench View"><button type="button" data-bench-view="RELEVANT" aria-pressed="${session.benchView === 'RELEVANT'}">Relevant</button><button type="button" data-bench-view="GLOBAL" aria-pressed="${session.benchView === 'GLOBAL'}">Global</button></div></header><p class="diagnostic-disclaimer">${escapeHtml(view.diagnostic_relevance_notice || '')}</p><div class="diagnostic-bench__controls">${session.benchView === 'GLOBAL' ? `<label>Search<input type="search" data-bench-search data-continuity-key="game:bench-search" value="${escapeHtml(session.benchSearch)}" placeholder="Search diagnostics"></label>` : ''}<div class="bench-type-tabs" role="group" aria-label="Diagnostic type"><button type="button" data-bench-type-button="ALL" aria-pressed="${session.benchTypeFilter === 'ALL'}">All</button><button type="button" data-bench-type-button="TEST" aria-pressed="${session.benchTypeFilter === 'TEST'}">Test</button><button type="button" data-bench-type-button="COMMAND" aria-pressed="${session.benchTypeFilter === 'COMMAND'}">Command</button></div>${session.benchView === 'GLOBAL' ? `<label>Subsystem<select data-bench-category><option value="ALL">All</option>${categories.map((category) => `<option value="${escapeHtml(category)}"${session.benchCategory === category ? ' selected' : ''}>${escapeHtml(category)}</option>`).join('')}</select></label><label>Sort<select data-bench-sort><option value="NAME">Name</option><option value="TYPE"${session.benchSort === 'TYPE' ? ' selected' : ''}>Type</option><option value="COST"${session.benchSort === 'COST' ? ' selected' : ''}>Cost</option><option value="SUBSYSTEM"${session.benchSort === 'SUBSYSTEM' ? ' selected' : ''}>Subsystem</option></select></label><label class="switch-row"><input type="checkbox" data-bench-relevant${session.benchRelevantOnly ? ' checked' : ''}>Relevant</label><label class="switch-row"><input type="checkbox" data-bench-runnable${session.benchRunnableOnly ? ' checked' : ''}>Runnable</label>` : ''}</div><div class="diagnostic-bench__count" role="status" aria-live="polite">Showing ${benchStart}–${benchEnd} of ${visibleBench.length}</div><div class="diagnostic-shelf" data-bench-card-list style="--bench-columns: ${benchPageSize}">${pagedBench.length ? '' : '<div class="empty-panel"><p>No diagnostics match these local filters.</p></div>'}</div><div class="bench-pagination"><button type="button" data-bench-page="${session.benchPage - 1}"${session.benchPage === 1 ? ' disabled' : ''}>Previous</button><span>Page ${session.benchPage} / ${benchPageCount}</span><button type="button" data-bench-page="${session.benchPage + 1}"${session.benchPage === benchPageCount ? ' disabled' : ''}>Next</button></div></section>
          <section class="hand-rail" aria-labelledby="hand-heading" data-expanded="${session.handExpanded}" data-hand-page-size="${handPageSize}"><header class="hand-rail__heading"><div><p class="play-eyebrow">Private hand</p><h2 id="hand-heading">Response hand</h2></div><p class="hand-rail__counts"><strong>${view.hand.length} Cards</strong><span>Deck ${view.deck_count}</span><span>Discard ${view.discard_card_instance_ids.length}</span></p><button type="button" class="hand-expand-toggle" data-toggle-hand data-continuity-key="game:hand-toggle" aria-expanded="${session.handExpanded}" aria-controls="response-hand-groups">${session.handExpanded ? 'Collapse hand' : 'Expand hand'}</button></header><div class="hand-rail__body"><div class="hand-rail__range" role="status" aria-live="polite">Groups ${handPage.start}–${handPage.end} of ${handGroups.length} · Page ${handPage.page} / ${handPage.pageCount}</div><div id="response-hand-groups" class="hand-rail__cards" data-continuity-scroll="game:hand" style="--hand-columns: ${handPageSize}"></div>${handPage.pageCount > 1 ? `<nav class="hand-pagination" aria-label="Response hand pages"><button type="button" data-hand-page="${handPage.page - 1}"${handPage.page === 1 ? ' disabled' : ''}>Previous</button><button type="button" data-hand-page="${handPage.page + 1}"${handPage.page === handPage.pageCount ? ' disabled' : ''}>Next</button></nav>` : ''}</div></section>
        </main>
        <aside class="investigation-rail">
          <section class="intelligence-panel" data-route-reveal><div class="intelligence-tabs" role="tablist" aria-label="Ticket intelligence"><button type="button" role="tab" data-continuity-key="game-panel-evidence" data-panel-tab="evidence" aria-selected="${session.panelTab === 'evidence'}">Evidence</button><button type="button" role="tab" data-continuity-key="game-panel-worklog" data-panel-tab="worklog" aria-selected="${session.panelTab === 'worklog'}">Worklog</button></div><section class="evidence-panel" data-continuity-scroll="game:ticket:${escapeHtml(selectedTicket?.ticket_instance_id || 'none')}:evidence" role="tabpanel" data-panel="evidence"${session.panelTab === 'evidence' ? '' : ' hidden'}><div class="section-heading"><div><p class="play-eyebrow">Knowledge state</p><h2>Evidence</h2></div><span>Team</span></div>${selectedTicket ? renderEvidence(view.authorized_events, selectedTicket.ticket_instance_id, context.catalog, session.lastEvents, session.lastAction?.result_event_id) : ''}</section><section class="worklog-panel" data-continuity-scroll="game:ticket:${escapeHtml(selectedTicket?.ticket_instance_id || 'none')}:worklog" role="tabpanel" data-panel="worklog"${session.panelTab === 'worklog' ? '' : ' hidden'}><div class="section-heading"><div><p class="play-eyebrow">Immutable sequence</p><h2>Worklog</h2></div><span>${selectedTicket?.worklog.length || 0}</span></div>${selectedTicket ? renderWorklog(selectedTicket, session.lastEvents, session.lastAction?.result_event_id, publicMatch) : ''}</section></section>
          <section class="action-dock legal-action-panel" aria-labelledby="actions-heading" data-route-reveal><div class="section-heading"><div><p class="play-eyebrow">Engine-projected</p><h2 id="actions-heading">Legal Action</h2></div><span>${session.resolving ? 'Resolving' : 'Ready'}</span></div><div class="selected-card-actions">${selectedActionMarkup({ selectedCard, selectedCardDefinition, selectedCost, presentation: actionPresentation, selectedTicketId: session.selectedTicketId, projection, catalog: context.catalog, resolving: session.resolving })}</div>${ticketWorkflowMarkup(documentModels, closureIntent, session, 'action-documentation-heading')}${actionResultMarkup(session, projection, context.catalog)}${session.resolving ? '<span class="intent-resolving" role="status">Resolving authoritative intent…</span>' : ''}</section>
          <section class="basic-actions-panel" aria-labelledby="basic-actions-heading"><div class="section-heading"><div><p class="play-eyebrow">Always available</p><h2 id="basic-actions-heading">Basic Actions</h2></div><span>${publicMatch.turn?.actions_remaining ?? 0} A</span></div><div class="basic-action-row"><label class="search-action">Search · ${view.utility_resources.search_tokens}<select id="search-intent"${searchIntents.length ? '' : ' disabled'}>${searchIntents.map((intent) => `<option value="${intent.intent_id}">${escapeHtml(cardName(context.catalog.cardById.get(intent.selected_card_definition_id)))}</option>`).join('') || '<option>Unavailable</option>'}</select><button type="button" class="basic-action" data-submit-search${!searchIntents.length || session.resolving ? ' disabled' : ''}>Search</button></label><button type="button" class="basic-action"${refreshIntent ? ` data-intent-id="${refreshIntent.intent_id}"` : ''}${!refreshIntent || session.resolving ? ' disabled' : ''}>Refresh · ${view.utility_resources.refresh_tokens}</button><button type="button" class="basic-action basic-action--give-up"${giveUpIntent ? ` data-give-up-intent="${giveUpIntent.intent_id}"` : ''}${!giveUpIntent || session.resolving ? ' disabled' : ''}>Give Up</button><button type="button" class="basic-action basic-action--pass"${passIntent ? ` data-intent-id="${passIntent.intent_id}"` : ''}${!passIntent || session.resolving ? ' disabled' : ''}>Pass</button></div></section>
        </aside>
      </div>
      <dialog id="full-ticket-dialog" class="play-dialog full-ticket-dialog" aria-labelledby="full-ticket-heading"><button type="button" class="dialog-close" data-close-dialog="full-ticket" aria-label="Close full Ticket">×</button>${fullTicketMarkup(selectedTicket, presentation, session, context, documentModels, closureIntent)}</dialog>
      <dialog id="game-card-dialog" class="play-dialog card-detail-dialog" aria-label="Card details"><button type="button" class="dialog-close" data-close-dialog="card" aria-label="Close Card details">×</button><div data-dialog-content></div></dialog>
      <dialog id="document-preview-dialog" class="play-dialog document-preview-dialog" aria-labelledby="document-preview-heading"><div data-document-dialog-content></div></dialog>
      <dialog id="archived-ticket-dialog" class="play-dialog archived-ticket-dialog" aria-labelledby="archive-review-heading"><div data-archive-dialog-content></div></dialog>
    </section>`;

  if (selectedTicket) {
    const ticketArt = context.artResolver.resolveTicketArt(selectedTicket);
    bindResolvedImage(root.querySelector('#ticket-art'), ticketArt, { eager: true });
    bindResolvedImage(root.querySelector('#full-ticket-art'), ticketArt);
  }
  const benchShelf = root.querySelector('[data-bench-card-list]');
  for (const entry of pagedBench) {
    const card = context.catalog.cardById.get(entry.card_definition_id);
    const relevance = relevanceFor(entry);
    const legal = isDiagnosticRunnableOnTicket(
      projection.legal_intents,
      entry.card_instance_id,
      session.selectedTicketId,
    );
    const completed = !legal && currentDiagnosticResult({
      authorizedEvents: view.authorized_events,
      cardDefinition: card,
      ticketInstanceId: session.selectedTicketId,
      machineRevision: selectedTicket?.machine_revision,
    });
    const availabilityLabel = legal ? 'Runnable now' : completed ? 'Completed' : 'Unavailable now';
    const tile = document.createElement('article');
    tile.className = `diagnostic-tile${entry.card_instance_id === session.selectedCardInstanceId ? ' is-selected' : ''}`;
    tile.dataset.relevant = String(relevance.relevant);
    const cardView = createCardView(card, {
      variant: 'compact',
      interactive: true,
      selected: entry.card_instance_id === session.selectedCardInstanceId,
      cardInstanceId: entry.card_instance_id,
      artResolver: context.artResolver,
    });
    cardView.dataset.selectDiagnostic = entry.card_instance_id;
    tile.dataset.runnable = String(legal);
    tile.dataset.completedCurrentRevision = String(Boolean(completed));
    setCardViewState(cardView, {
      legalTarget: legal,
      resolving: session.resolving && entry.card_instance_id === session.selectedCardInstanceId,
    });
    cardView.querySelector('.play-card__rules')?.remove();
    cardView.querySelector('.play-card__footer')?.remove();
    const inspect = document.createElement('button');
    inspect.type = 'button';
    inspect.className = 'diagnostic-tile__inspect';
    inspect.dataset.inspectDiagnostic = entry.card_instance_id;
    inspect.dataset.availability = legal ? 'RUNNABLE' : completed ? 'COMPLETED_CURRENT_REVISION' : 'UNAVAILABLE';
    inspect.textContent = `Inspect · ${availabilityLabel}`;
    inspect.setAttribute('aria-label', `Inspect ${cardName(card)}. ${availabilityLabel} on ${ticketName(projection, session.selectedTicketId)}.`);
    tile.append(cardView, inspect);
    benchShelf.append(tile);
  }
  const hand = root.querySelector('.hand-rail__cards');
  const newDrawIds = new Set(session.lastEvents.filter((event) => event.event_type === 'CARD_DRAWN').map((event) => event.payload?.card_instance_id));
  const clearDragTargets = () => {
    root.querySelectorAll('[data-drag-target], [data-drag-invalid]').forEach((target) => {
      target.removeAttribute('data-drag-target');
      target.removeAttribute('data-drag-invalid');
    });
  };
  const settleDraggedCard = (cardView) => {
    if (!cardView) return;
    cardView.dataset.dragSnapback = 'true';
    cardView.style.translate = '0px 0px';
    cardView.removeAttribute('data-pointer-dragging');
    window.setTimeout(() => {
      cardView.removeAttribute('data-drag-snapback');
      cardView.style.removeProperty('translate');
      cardView.style.removeProperty('z-index');
    }, 180);
  };
  for (const group of handPage.groups) {
    const held = firstEligibleInstance(group, projection.legal_intents);
    const card = context.catalog.cardById.get(held.card_definition_id);
    const hasLegal = projection.legal_intents.some((intent) => intent.card_instance_id === held.card_instance_id);
    let suppressActivation = false;
    const cardView = createCardView(card, {
      variant: session.handExpanded ? 'hand' : 'compact',
      interactive: true,
      selected: held.card_instance_id === session.selectedCardInstanceId,
      cardInstanceId: held.card_instance_id,
      artResolver: context.artResolver,
      onActivate: ({ cardInstanceId }) => {
        if (suppressActivation) {
          suppressActivation = false;
          return;
        }
        session.selectedCardInstanceId = cardInstanceId;
        session.lastMotion = null;
        context.rerender();
      },
    });
    cardView.querySelector('.play-card__footer')?.remove();
    const rules = cardView.querySelector('.play-card__rules');
    if (session.handExpanded && rules) rules.textContent = card?.presentation?.short_description || card.rules_text;
    else rules?.remove();
    setCardViewState(cardView, { legalTarget: hasLegal, resolving: session.resolving && held.card_instance_id === session.selectedCardInstanceId });
    if (newDrawIds.has(held.card_instance_id)) cardView.dataset.newDraw = 'true';
    if (context.snapshot.state.records.settings.drag_enabled && hasLegal) {
      cardView.draggable = true;
      cardView.addEventListener('dragstart', (event) => {
        session.dragCardInstanceId = held.card_instance_id;
        cardView.dataset.pointerDragging = 'true';
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', held.card_instance_id);
      });
      cardView.addEventListener('dragend', () => {
        clearDragTargets();
        session.dragCardInstanceId = null;
        settleDraggedCard(cardView);
      });

      let pointerDrag = null;
      const cancelPointerDrag = () => {
        if (!pointerDrag) return false;
        const pointerId = pointerDrag.pointerId;
        pointerDrag = null;
        if (typeof cardView.hasPointerCapture === 'function'
          && cardView.hasPointerCapture(pointerId)) cardView.releasePointerCapture(pointerId);
        clearDragTargets();
        session.dragCardInstanceId = null;
        if (session.cancelPointerDrag === cancelPointerDrag) session.cancelPointerDrag = null;
        suppressActivation = true;
        window.setTimeout(() => { suppressActivation = false; }, 0);
        settleDraggedCard(cardView);
        return true;
      };
      const ticketAtPoint = (x, y) => document.elementsFromPoint(x, y)
        .map((element) => element.closest('[data-drop-target]'))
        .find(Boolean) ?? null;
      cardView.addEventListener('pointerdown', (event) => {
        if (!['touch', 'pen'].includes(event.pointerType) || session.resolving) return;
        session.cancelPointerDrag?.();
        pointerDrag = {
          pointerId: event.pointerId,
          startX: event.clientX,
          startY: event.clientY,
          startScrollY: window.scrollY,
          active: false,
        };
        session.cancelPointerDrag = cancelPointerDrag;
        if (typeof cardView.setPointerCapture === 'function') cardView.setPointerCapture(event.pointerId);
      });
      cardView.addEventListener('pointermove', (event) => {
        if (!pointerDrag || event.pointerId !== pointerDrag.pointerId) return;
        const deltaX = event.clientX - pointerDrag.startX;
        const deltaY = event.clientY - pointerDrag.startY;
        if (!pointerDrag.active && Math.hypot(deltaX, deltaY) < 9) return;
        pointerDrag.active = true;
        suppressActivation = true;
        session.dragCardInstanceId = held.card_instance_id;
        cardView.dataset.pointerDragging = 'true';
        cardView.style.zIndex = '80';
        const edgeDistance = 72;
        if (event.clientY < edgeDistance) window.scrollBy({ top: -Math.min(24, edgeDistance - event.clientY), behavior: 'auto' });
        if (event.clientY > window.innerHeight - edgeDistance) window.scrollBy({ top: Math.min(24, event.clientY - (window.innerHeight - edgeDistance)), behavior: 'auto' });
        cardView.style.translate = `${deltaX}px ${deltaY + window.scrollY - pointerDrag.startScrollY}px`;
        clearDragTargets();
        const ticketButton = ticketAtPoint(event.clientX, event.clientY);
        if (ticketButton) {
          const legal = projectedDropIntent({
            legalIntents: projection.legal_intents,
            diagnosticBench: bench,
            cardInstanceId: held.card_instance_id,
            ticketInstanceId: ticketButton.dataset.ticketId,
            selectedTicketId: session.selectedTicketId,
          });
          ticketButton.dataset[legal ? 'dragTarget' : 'dragInvalid'] = 'true';
        }
        event.preventDefault();
      });
      const finishPointerDrag = (event, cancelled = false) => {
        if (!pointerDrag || event.pointerId !== pointerDrag.pointerId) return;
        const wasActive = pointerDrag.active;
        pointerDrag = null;
        if (typeof cardView.hasPointerCapture === 'function'
          && cardView.hasPointerCapture(event.pointerId)) cardView.releasePointerCapture(event.pointerId);
        if (session.cancelPointerDrag === cancelPointerDrag) session.cancelPointerDrag = null;
        const ticketButton = cancelled ? null : ticketAtPoint(event.clientX, event.clientY);
        const legal = wasActive && ticketButton
          ? projectedDropIntent({
            legalIntents: projection.legal_intents,
            diagnosticBench: bench,
            cardInstanceId: held.card_instance_id,
            ticketInstanceId: ticketButton.dataset.ticketId,
            selectedTicketId: session.selectedTicketId,
          })
          : null;
        clearDragTargets();
        session.dragCardInstanceId = null;
        if (wasActive) {
          event.preventDefault();
          if (legal) submit(legal.intent_id, { sfxInteractionId: 'game.drag.commit' });
          else settleDraggedCard(cardView);
        }
      };
      cardView.addEventListener('pointerup', (event) => finishPointerDrag(event));
      cardView.addEventListener('pointercancel', (event) => finishPointerDrag(event, true));
    }
    const groupView = document.createElement('article');
    groupView.className = `hand-group${group.instances.length > 1 ? ' hand-group--stacked' : ''}`;
    groupView.dataset.handGroup = group.card_definition_id;
    groupView.dataset.quantity = String(group.instances.length);
    groupView.dataset.cardInstanceIds = group.instances.map((instance) => instance.card_instance_id).join(' ');
    groupView.setAttribute('role', 'group');
    groupView.setAttribute('aria-label', `${cardName(card)}, ${group.instances.length} ${group.instances.length === 1 ? 'copy' : 'copies'}`);
    const groupMeta = document.createElement('div');
    groupMeta.className = 'hand-group__meta';
    const quantity = document.createElement('span');
    quantity.className = 'hand-group__quantity';
    quantity.textContent = `×${group.instances.length}`;
    quantity.setAttribute('aria-hidden', 'true');
    const inspect = document.createElement('button');
    inspect.type = 'button';
    inspect.className = 'hand-group__inspect';
    inspect.dataset.inspectHand = held.card_instance_id;
    inspect.textContent = 'Inspect';
    inspect.setAttribute('aria-label', `Inspect ${cardName(card)}, ${group.instances.length} ${group.instances.length === 1 ? 'copy' : 'copies'}`);
    groupMeta.append(quantity, inspect);
    groupView.append(cardView, groupMeta);
    hand.append(groupView);
  }

  const submit = (intentId, options) => session.submit(intentId, options);
  const openDocumentPreview = (model, opener) => {
    if (!model) return;
    session.documentPreview = {
      ...model,
      rejection: session.documentPreview?.source_action_event_id === model.source_action_event_id
        ? session.documentPreview.rejection ?? null
        : null,
    };
    const dialog = root.querySelector('#document-preview-dialog');
    dialog.querySelector('[data-document-dialog-content]').innerHTML = documentPreviewMarkup(
      session.documentPreview,
      projection,
      session,
    );
    openPlayDialog(dialog, opener);
  };
  const openCardInspect = (cardInstanceId, opener) => {
    const instance = [...view.hand, ...bench].find((entry) => entry.card_instance_id === cardInstanceId);
    if (!instance) return;
    const diagnostic = bench.find((entry) => entry.card_instance_id === cardInstanceId);
    let diagnosticContext = null;
    let handContext = null;
    if (diagnostic) {
      const relevance = relevanceFor(diagnostic);
      const path = relevance.why_relevant_paths?.[0]?.entity_ids
        ?.map((id) => domainName(context.catalog, id)).join(' → ');
      diagnosticContext = {
        relevant: relevance.relevant === true,
        category: diagnostic.category,
        path,
        notice: view.diagnostic_relevance_notice,
        catalogExplanation: 'Global keeps the complete diagnostic catalog available for investigation. A diagnostic that is not marked relevant may still become useful as public relationships or the machine state change; this label does not decide legality.',
      };
    }
    const handGroup = handGroups.find((group) => group.instances
      .some((entry) => entry.card_instance_id === cardInstanceId));
    if (handGroup) handContext = { quantity: handGroup.instances.length };
    const dialog = root.querySelector('#game-card-dialog');
    dialog.querySelector('[data-dialog-content]').replaceChildren(createCardDetailView(
      context.catalog.cardById.get(instance.card_definition_id),
      { artResolver: context.artResolver, domainById: context.catalog.domainById, diagnosticContext, handContext },
    ));
    openPlayDialog(dialog, opener);
  };
  const revealActionResult = () => {
    const record = session.lastAction;
    if (!record?.target_ticket_id || !record.result_event_id) return;
    const targetIsActive = projection.view.public_match.repair_queue
      .some((ticket) => ticket.ticket_instance_id === record.target_ticket_id);
    if (!targetIsActive) return;
    session.selectedTicketId = record.target_ticket_id;
    session.panelTab = ['EVIDENCE_CREATED', 'VERIFY_RESOLVED', 'VERIFY_EVIDENCE_CREATED', 'ISOLATION_ACCEPTED', 'ISOLATION_NOT_SUPPORTED']
      .includes(record.result_event_type) ? 'evidence' : 'worklog';
    context.rerender();
    requestAnimationFrame(() => {
      const resultEntry = document.querySelector(`#play-page [data-event-id="${CSS.escape(record.result_event_id)}"]`);
      resultEntry?.scrollIntoView({ block: 'nearest', behavior: 'auto' });
      resultEntry?.focus({ preventScroll: true });
    });
  };
  const onClick = (event) => {
    if (event.target.closest('[data-tutorial-continue]')) {
      if (session.tutorial?.continueExplanation(session.projection)) context.rerender();
      return;
    }
    if (event.target.closest('[data-tutorial-back]')) {
      if (session.tutorial?.reviewPrevious()) context.rerender();
      return;
    }
    if (event.target.closest('[data-tutorial-restart]')) {
      if (confirm('Restart this Tutorial from its pinned first checkpoint? Current Tutorial Match state will be discarded.')) {
        context.restartTutorial(session.tutorial.definition.id);
      }
      return;
    }
    if (event.target.closest('[data-tutorial-exit]')) {
      if (confirm('Exit this Tutorial? Current Tutorial Match state is not saved and no completion will be recorded.')) {
        context.finishGame('#/play/home');
      }
      return;
    }
    const handToggle = event.target.closest('[data-toggle-hand]');
    if (handToggle) {
      session.handExpanded = !session.handExpanded;
      session.restoreHandToggleFocus = true;
      session.lastMotion = null;
      context.rerender();
      return;
    }
    const handPageButton = event.target.closest('[data-hand-page]');
    if (handPageButton && !handPageButton.disabled) {
      session.handPage = Number(handPageButton.dataset.handPage);
      context.rerender();
      requestAnimationFrame(() => root.querySelector('.hand-rail__cards .play-card')?.focus({ preventScroll: true }));
      return;
    }
    const diagnosticInspect = event.target.closest('[data-inspect-diagnostic]');
    if (diagnosticInspect) {
      openCardInspect(diagnosticInspect.dataset.inspectDiagnostic, diagnosticInspect);
      return;
    }
    const handInspect = event.target.closest('[data-inspect-hand]');
    if (handInspect) {
      openCardInspect(handInspect.dataset.inspectHand, handInspect);
      return;
    }
    const benchView = event.target.closest('[data-bench-view]');
    if (benchView) {
      session.benchView = benchView.dataset.benchView;
      session.benchPage = 1;
      context.rerender();
      return;
    }
    const benchType = event.target.closest('[data-bench-type-button]');
    if (benchType) {
      session.benchTypeFilter = benchType.dataset.benchTypeButton;
      session.benchPage = 1;
      context.rerender();
      return;
    }
    const diagnostic = event.target.closest('[data-select-diagnostic]');
    if (diagnostic) {
      session.selectedCardInstanceId = diagnostic.dataset.selectDiagnostic;
      context.rerender();
      return;
    }
    const page = event.target.closest('[data-bench-page]');
    if (page && !page.disabled) {
      session.benchPage = Number(page.dataset.benchPage);
      context.rerender();
      return;
    }
    const ticketButton = event.target.closest('[data-ticket-id]');
    if (ticketButton) {
      session.selectedTicketId = ticketButton.dataset.ticketId;
      session.lastMotion = 'ticketSelected';
      context.rerender();
      return;
    }
    const tab = event.target.closest('[data-panel-tab]');
    if (tab) {
      session.panelTab = tab.dataset.panelTab;
      session.lastMotion = null;
      context.rerender();
      return;
    }
    const documentSource = event.target.closest('[data-preview-document]');
    if (documentSource) {
      const model = allDocumentModels.find((entry) => entry.intent_id === documentSource.dataset.previewDocument);
      const mainOpener = root.querySelector(`.legal-action-panel [data-document-source="${CSS.escape(documentSource.dataset.documentSource)}"]`);
      if (documentSource.closest('#full-ticket-dialog')) {
        closePlayDialog(root.querySelector('#full-ticket-dialog'), { restoreFocus: false, immediate: true });
      }
      openDocumentPreview(model, mainOpener ?? documentSource);
      return;
    }
    const submitDocument = event.target.closest('[data-submit-document]');
    if (submitDocument && !submitDocument.disabled) {
      const intentId = submitDocument.dataset.submitDocument;
      if (session.submit(intentId)) {
        submitDocument.disabled = true;
        submitDocument.textContent = 'Documenting…';
      }
      return;
    }
    const cancelDocument = event.target.closest('[data-cancel-document]');
    if (cancelDocument && !session.resolving) {
      session.documentPreview = null;
      closePlayDialog(root.querySelector('#document-preview-dialog'));
      return;
    }
    const archived = event.target.closest('[data-archive-ticket-id]');
    if (archived) {
      openArchivedTicketDialog(root, session, context, archived.dataset.archiveTicketId, archived);
      return;
    }
    const solution = event.target.closest('[data-view-solution-ticket]');
    if (solution) {
      closePlayDialog(root.querySelector('#archived-ticket-dialog'), { restoreFocus: false, immediate: true });
      focusAuthorizedSolution(root, solution.dataset.viewSolutionTicket);
      return;
    }
    const intent = event.target.closest('[data-intent-id]');
    if (intent) {
      submit(intent.dataset.intentId);
      return;
    }
    const giveUp = event.target.closest('[data-give-up-intent]');
    if (giveUp && confirm(`Give up ${ticketName(projection, session.selectedTicketId)}? This abandons and archives only this Ticket, locks its Worklog, voids pending contributions without awarding their points, records one give-up statistic, and leaves the complete solution revealed privately. Remaining Tickets continue; if this is the last Ticket, the Match ends without a solo win. This cannot be resumed.`)) {
      submit(giveUp.dataset.giveUpIntent);
    }
    if (event.target.closest('[data-view-action-result]')) revealActionResult();
    if (event.target.closest('[data-submit-search]')) submit(root.querySelector('#search-intent').value);
    if (event.target.closest('[data-view-full-ticket]')) {
      const dialog = root.querySelector('#full-ticket-dialog');
      openPlayDialog(dialog, event.target.closest('[data-view-full-ticket]'));
    }
    if (event.target.closest('[data-inspect-selected]') && selectedCard) {
      openCardInspect(selectedCard.card_instance_id, event.target.closest('[data-inspect-selected]'));
    }
    const closeDialog = event.target.closest('[data-close-dialog]');
    if (closeDialog) {
      const dialogByKind = {
        'full-ticket': '#full-ticket-dialog',
        card: '#game-card-dialog',
        'document-preview': '#document-preview-dialog',
        'archive-review': '#archived-ticket-dialog',
      };
      if (closeDialog.dataset.closeDialog === 'document-preview' && !session.resolving) session.documentPreview = null;
      closePlayDialog(root.querySelector(dialogByKind[closeDialog.dataset.closeDialog]));
    }
  };
  const onBenchInput = (event) => {
    if (!event.target.matches('[data-bench-search]')) return;
    session.benchSearch = event.target.value;
    session.benchPage = 1;
    context.rerender();
  };
  const onBenchChange = (event) => {
    if (event.target.matches('[data-bench-type]')) session.benchTypeFilter = event.target.value;
    else if (event.target.matches('[data-bench-category]')) session.benchCategory = event.target.value;
    else if (event.target.matches('[data-bench-sort]')) session.benchSort = event.target.value;
    else if (event.target.matches('[data-bench-relevant]')) session.benchRelevantOnly = event.target.checked;
    else if (event.target.matches('[data-bench-runnable]')) session.benchRunnableOnly = event.target.checked;
    else return;
    session.benchPage = 1;
    context.rerender();
  };
  const onDragOver = (event) => {
    const ticketButton = event.target.closest('[data-drop-target]');
    if (!ticketButton || !session.dragCardInstanceId) return;
    const legal = projectedDropIntent({
      legalIntents: projection.legal_intents,
      diagnosticBench: bench,
      cardInstanceId: session.dragCardInstanceId,
      ticketInstanceId: ticketButton.dataset.ticketId,
      selectedTicketId: session.selectedTicketId,
    });
    if (legal) {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
      ticketButton.dataset.dragTarget = 'true';
    }
  };
  const onDragLeave = (event) => event.target.closest('[data-drop-target]')?.removeAttribute('data-drag-target');
  const onDrop = (event) => {
    const ticketButton = event.target.closest('[data-drop-target]');
    if (!ticketButton || !session.dragCardInstanceId) return;
    const legal = projectedDropIntent({
      legalIntents: projection.legal_intents,
      diagnosticBench: bench,
      cardInstanceId: session.dragCardInstanceId,
      ticketInstanceId: ticketButton.dataset.ticketId,
      selectedTicketId: session.selectedTicketId,
    });
    ticketButton.removeAttribute('data-drag-target');
    session.dragCardInstanceId = null;
    if (legal) {
      event.preventDefault();
      submit(legal.intent_id, { sfxInteractionId: 'game.drag.commit' });
    }
  };
  const onDragCancel = (event) => {
    if (event.key !== 'Escape') return;
    if (session.cancelPointerDrag?.()) {
      event.preventDefault();
      return;
    }
    if (session.dragCardInstanceId) {
      session.dragCardInstanceId = null;
      clearDragTargets();
      settleDraggedCard(root.querySelector('[data-pointer-dragging="true"]'));
      event.preventDefault();
      return;
    }
    const handRail = root.querySelector('.hand-rail[data-expanded="true"]');
    if (!handRail?.contains(document.activeElement) || document.querySelector('dialog[open]')) return;
    session.handExpanded = false;
    session.restoreHandToggleFocus = true;
    context.rerender();
    event.preventDefault();
  };
  const documentDialog = root.querySelector('#document-preview-dialog');
  const onDocumentDialogCancel = (event) => {
    if (session.resolving) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    session.documentPreview = null;
  };
  const onDocumentDialogClick = (event) => {
    if (event.target !== documentDialog) return;
    if (session.resolving) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    session.documentPreview = null;
  };
  documentDialog.addEventListener('cancel', onDocumentDialogCancel);
  documentDialog.addEventListener('click', onDocumentDialogClick);
  root.addEventListener('click', onClick);
  root.addEventListener('input', onBenchInput);
  root.addEventListener('change', onBenchChange);
  document.addEventListener('keydown', onDragCancel);
  root.addEventListener('dragover', onDragOver);
  root.addEventListener('dragleave', onDragLeave);
  root.addEventListener('drop', onDrop);
  let resizeFrame = null;
  const onResize = () => {
    const nextBenchPageSize = benchPageSizeForViewport(window.innerWidth);
    const nextHandPageSize = handPageSizeForViewport(window.innerWidth);
    if (nextBenchPageSize === benchPageSize && nextHandPageSize === handPageSize) return;
    if (resizeFrame) cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => context.rerender());
  };
  window.addEventListener('resize', onResize);

  if (session.restoreHandToggleFocus) {
    session.restoreHandToggleFocus = false;
    root.querySelector('[data-toggle-hand]')?.focus({ preventScroll: true });
  }
  if (session.restoreDiagnosticActionFocus) {
    session.restoreDiagnosticActionFocus = false;
    root.querySelector('[data-continuity-key="game:selected-diagnostic-action"]')
      ?.focus({ preventScroll: true });
  }
  if (session.restoreDocumentedWorklogFocus) {
    const documentedWorklogId = session.restoreDocumentedWorklogFocus;
    session.restoreDocumentedWorklogFocus = null;
    requestAnimationFrame(() => {
      const entry = root.querySelector(`[data-event-id="${CSS.escape(documentedWorklogId)}"]`);
      entry?.scrollIntoView({ block: 'nearest', behavior: 'auto' });
      entry?.focus({ preventScroll: true });
    });
  }
  if (session.documentPreview) {
    const storedPreview = session.documentPreview;
    const currentPreview = allDocumentModels.find((model) =>
      model.source_action_event_id === storedPreview.source_action_event_id
        && model.ticket_instance_id === storedPreview.ticket_instance_id);
    const preview = currentPreview
      ? { ...currentPreview, rejection: storedPreview.rejection ?? null }
      : { ...storedPreview, preview_complete: false };
    session.documentPreview = preview;
    requestAnimationFrame(() => {
      if (session.documentPreview !== preview) return;
      const opener = root.querySelector(`[data-document-source="${CSS.escape(preview.source_action_event_id)}"]`);
      openDocumentPreview(preview, opener);
    });
  }

  const pendingMotion = session.lastMotion;
  session.lastMotion = null;
  if (pendingMotion) requestAnimationFrame(() => context.motion(pendingMotion, root));
  session.tutorial?.apply(root, projection);
  return () => {
    session.cancelPointerDrag?.();
    session.cancelPointerDrag = null;
    root.removeEventListener('click', onClick);
    root.removeEventListener('input', onBenchInput);
    root.removeEventListener('change', onBenchChange);
    document.removeEventListener('keydown', onDragCancel);
    root.removeEventListener('dragover', onDragOver);
    root.removeEventListener('dragleave', onDragLeave);
    root.removeEventListener('drop', onDrop);
    documentDialog.removeEventListener('cancel', onDocumentDialogCancel);
    documentDialog.removeEventListener('click', onDocumentDialogClick);
    window.removeEventListener('resize', onResize);
    if (resizeFrame) cancelAnimationFrame(resizeFrame);
  };
}
