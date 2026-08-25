import { bindResolvedImage } from '../art-resolver.mjs';
import { createCardDetailView, createCardView, setCardViewState } from '../card-view.mjs';
import { cardName, domainName } from '../catalog-service.mjs';
import { dialogWithRestore, escapeHtml, formatDuration, formatInteger } from '../dom-utils.mjs';
import { closeDialogWithMotion } from '../motion-coordinator.mjs';

const STATUS_LABELS = Object.freeze({
  DIAGNOSIS: 'Diagnosis open',
  RETURNED_TO_DIAGNOSIS: 'Returned to Diagnosis',
  REPAIR_READY: 'Repair ready',
  AWAITING_VERIFY: 'Awaiting Verify',
  READY_TO_CLOSE: 'Ready to close',
  CLOSED: 'Closed',
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

function actionLabel(intent, projection, catalog) {
  const base = ACTION_LABELS[intent.action_type] || intent.action_type.replaceAll('_', ' ');
  const ticket = intent.ticket_instance_id ? ticketName(projection, intent.ticket_instance_id) : '';
  const card = intent.card_definition_id ? cardName(catalog.cardById.get(intent.card_definition_id)) : '';
  if (intent.action_type === 'SEARCH') return `Search for ${card}`;
  if (intent.action_type === 'DOCUMENT_LIVE') return `${base} · ${ticket}`;
  if (card && ticket) return `${base}: ${card} → ${ticket}`;
  return ticket ? `${base}: ${ticket}` : base;
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
    return `<article class="evidence-entry${newIds.has(event.event_id) ? ' is-new' : ''}${resultEventId === event.event_id ? ' is-result-target' : ''}" data-event-id="${escapeHtml(event.event_id)}"${resultEventId === event.event_id ? ' tabindex="-1"' : ''}><header><span>#${event.sequence}</span><strong>${escapeHtml(summary.type)}</strong></header>${summary.source ? `<p class="evidence-source">${escapeHtml(summary.source)}</p>` : ''}${summary.summary ? `<p>${escapeHtml(summary.summary)}</p>` : ''}${summary.effects ? `<p class="evidence-effects">${escapeHtml(summary.effects)}</p>` : ''}</article>`;
  }).join('');
}

function renderWorklog(ticket, lastEvents, resultEventId = null) {
  if (!ticket.worklog.length) return '<div class="empty-intelligence"><p>The Worklog is empty.</p><small>Accepted actions appear here in immutable sequence.</small></div>';
  const newIds = new Set(lastEvents.map((event) => event.event_id));
  return ticket.worklog.map((entry, index) => `<article class="worklog-entry${index === ticket.worklog.length - 1 && lastEvents.length ? ' is-new' : ''}${resultEventId === entry.placeholder_event_id ? ' is-result-target' : ''}" data-placeholder-id="${escapeHtml(entry.placeholder_event_id)}" data-event-id="${escapeHtml(entry.placeholder_event_id)}"${resultEventId === entry.placeholder_event_id ? ' tabindex="-1"' : ''}><header><span>#${entry.sequence}</span><strong>${escapeHtml(entry.source_name)}</strong><span>${entry.action_cost} Action${entry.action_cost === 1 ? '' : 's'}</span></header><p>${escapeHtml(entry.public_result_summary || 'Result retained at its authorized visibility.')}</p><footer>${entry.publication_event_id ? `Published later · ${escapeHtml(entry.publisher_player_id)}` : 'Live placeholder'}${entry.locked ? ' · Locked' : ''}</footer></article>`).join('');
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
    return `<li class="candidate-row${current ? ' is-hypothesis' : ''}${eliminated ? ' is-eliminated' : ''}"><div><span>${escapeHtml(domainName(context.catalog, candidateId))}</span><code>${escapeHtml(candidateId)}</code>${eliminated ? '<small>Ruled out for this diagnosis stage</small>' : ''}</div><div class="candidate-actions">${hypothesis ? `<button type="button" class="basic-action basic-action--hypothesis" data-intent-id="${hypothesis.intent_id}"${session.resolving ? ' disabled' : ''}>Hypothesize</button>` : current ? '<span class="candidate-marker">Current hypothesis</span>' : ''}${elimination ? `<button type="button" class="basic-action" data-intent-id="${elimination.intent_id}"${session.resolving ? ' disabled' : ''}>${eliminated ? 'Reinstate' : 'Rule out'}</button>` : ''}${isolation ? `<button type="button" class="basic-action basic-action--isolate" data-intent-id="${isolation.intent_id}"${session.resolving ? ' disabled' : ''}>Isolate</button>` : ''}</div></li>`;
  }).join('');
}

function solutionRevealMarkup(reveals, catalog, projection) {
  if (!reveals.length) return '';
  return reveals.map((entry) => {
    const reveal = entry.solution_reveal;
    return `<details class="solution-reveal" open><summary>Solution revealed · ${escapeHtml(ticketName(projection, entry.ticket_instance_id))}</summary><div class="solution-reveal__grid"><section><h3>Causal truth</h3><ul>${reveal.faults.map((fault) => `<li><strong>${escapeHtml(domainName(catalog, fault.fault_id))}</strong> · ${escapeHtml(fault.role.toLowerCase())}${fault.actionable ? ' · actionable' : ''}</li>`).join('')}</ul>${reveal.causal_links.length ? `<p>${reveal.causal_links.map((link) => `${domainName(catalog, link.cause_fault_id)} → ${domainName(catalog, link.effect_fault_id)}`).map(escapeHtml).join('<br>')}</p>` : '<p>Single-fault path.</p>'}</section><section><h3>Required Evidence</h3><ul>${reveal.evidence_solution.map((route) => `<li><strong>${escapeHtml(route.route_kind.replaceAll('_', ' '))}</strong>${route.evidence.map((item) => `<span>${escapeHtml(item.summary)}</span>`).join('')}</li>`).join('')}</ul></section><section><h3>Repair</h3><ul>${reveal.repair_solution.map((item) => `<li>${escapeHtml(item.summary)}</li>`).join('')}</ul></section><section><h3>Verify</h3><ul>${reveal.verification_solution.map((item) => `<li>${escapeHtml(item.summary)}</li>`).join('')}</ul></section></div><p>No further play can target this archived Ticket.</p></details>`;
  }).join('');
}

function resultMarkup(session, context) {
  const result = session.terminalResult;
  const won = result.solo_wins === 1;
  const status = won ? 'Queue cleared' : result.solo_stalemates ? 'Proven stalemate' : result.invalid_or_capped_results ? 'Invalid or capped' : 'Shift ended';
  return `
    <section class="play-route result-route" aria-labelledby="result-heading">
      <div class="result-panel">
        <p class="play-eyebrow" data-result-reveal>Local solo result</p>
        <h1 id="result-heading" tabindex="-1" data-result-reveal>${status}</h1>
        <p data-result-reveal>${won ? 'Every Ticket was closed through an Evidence-backed causal record.' : 'Review the terminal reasons and preserve the useful history.'}</p>
        ${solutionRevealMarkup(session.projection?.view.solution_reveals ?? [], context.catalog, session.projection)}
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
        <p class="result-record-status" data-result-reveal>${session.resultApplied === false ? 'This result was already present; lifetime totals were not incremented twice.' : 'Result recorded exactly once in this local Profile.'}</p>
        <div class="button-row" data-result-reveal><button type="button" class="play-button play-button--primary" data-finish-game="#/play/home">Return Home</button><button type="button" class="play-button" data-finish-game="#/play/profile">View Profile</button></div>
        <p class="authority-note" data-result-reveal>Local statistics are user-controlled and are not competitive records.</p>
      </div>
    </section>`;
}

function gameLoadingMarkup(error = null) {
  return `<section class="play-route"><div class="game-loading"${error ? ' role="alert"' : ' aria-busy="true"'}><p class="play-eyebrow">Local authority</p><h1>${error ? 'Solo Match could not start' : 'Building repair queue…'}</h1><p>${escapeHtml(error || 'The Ticket Builder and engine are preparing a complete deterministic Match in a dedicated Worker.')}</p>${error ? '<div class="button-row"><a class="play-button play-button--primary" href="#/play/decks">Review Deck coverage</a><a class="play-button" href="#/play/home">Return Home</a></div>' : ''}</div></section>`;
}

export function renderGame(root, context) {
  const session = context.game;
  if (session.error) {
    root.innerHTML = gameLoadingMarkup(session.error);
    return () => {};
  }
  if (!session.projection) {
    root.innerHTML = gameLoadingMarkup();
    return () => {};
  }
  if (session.terminalResult) {
    root.innerHTML = resultMarkup(session, context);
    const onClick = (event) => {
      const finish = event.target.closest('[data-finish-game]');
      if (finish) context.finishGame(finish.dataset.finishGame);
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
  const selectedCard = [...view.hand, ...bench].find((card) => card.card_instance_id === session.selectedCardInstanceId) ?? null;
  const selectedIsDiagnostic = bench.some((card) => card.card_instance_id === selectedCard?.card_instance_id);
  const cardIntents = selectedCard ? projection.legal_intents.filter((intent) => intent.card_instance_id === selectedCard.card_instance_id) : [];
  const cardTargetsDisplayedTicket = cardIntents.some((intent) => intent.ticket_instance_id === session.selectedTicketId);
  const prioritizedCardIntents = cardTargetsDisplayedTicket
    ? cardIntents.filter((intent) => intent.ticket_instance_id === session.selectedTicketId)
    : cardIntents;
  const alternateTargetNames = [...new Set(prioritizedCardIntents
    .map((intent) => intent.ticket_instance_id)
    .filter((ticketId) => ticketId && ticketId !== session.selectedTicketId)
    .map((ticketId) => ticketName(projection, ticketId)))];
  const documentIntents = projection.legal_intents.filter((intent) => intent.action_type === 'DOCUMENT_LIVE' && intent.ticket_instance_id === session.selectedTicketId);
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
    if (normalizedQuery && !`${entry.card_definition_id} ${cardName(card)} ${card?.rules_text ?? ''}`.toLocaleLowerCase().includes(normalizedQuery)) return false;
    return true;
  }).sort((left, right) => {
    const leftCard = context.catalog.cardById.get(left.card_definition_id);
    const rightCard = context.catalog.cardById.get(right.card_definition_id);
    if (session.benchSort === 'COST') return left.action_cost - right.action_cost || cardName(leftCard).localeCompare(cardName(rightCard));
    if (session.benchSort === 'TYPE') return left.diagnostic_type.localeCompare(right.diagnostic_type) || cardName(leftCard).localeCompare(cardName(rightCard));
    return cardName(leftCard).localeCompare(cardName(rightCard));
  });
  const benchPageSize = 8;
  const benchPageCount = Math.max(1, Math.ceil(visibleBench.length / benchPageSize));
  session.benchPage = Math.min(Math.max(1, session.benchPage), benchPageCount);
  const pagedBench = visibleBench.slice((session.benchPage - 1) * benchPageSize, session.benchPage * benchPageSize);

  root.innerHTML = `
    <section class="play-route game-route" aria-labelledby="game-heading">
      <header class="game-header" data-route-reveal>
        <div><p class="play-eyebrow">Solo cooperative training</p><h1 id="game-heading">Night-shift board</h1><p>Round ${publicMatch.turn?.round_number ?? '—'} · Turn ${publicMatch.turn?.turn_number ?? '—'} · ${escapeHtml(publicMatch.turn?.phase?.replaceAll('_', ' ') || publicMatch.status)}</p></div>
        <dl class="game-resources" data-continuity-scroll="game:resources"><div><dt>Service Points</dt><dd>${player.team_service_points ?? player.service_points}</dd></div><div><dt>Actions</dt><dd>${publicMatch.turn?.actions_remaining ?? 0} / 2</dd></div><div><dt>Search</dt><dd>${view.utility_resources.search_tokens}</dd></div><div><dt>Refresh</dt><dd>${view.utility_resources.refresh_tokens}</dd></div><div><dt>Deck / Discard</dt><dd>${view.deck_count} / ${view.discard_card_instance_ids.length}</dd></div></dl>
      </header>
      ${projection.duplicate_ticket_disclosure ? `<p class="duplicate-disclosure game-disclosure"><strong>${projection.ticket_count}-Ticket training queue:</strong> repeated causal fingerprints are intentionally permitted; each remains an independent machine state and evidence record.</p>` : ''}
      ${actionResultMarkup(session, projection, context.catalog)}
      ${solutionRevealMarkup(view.solution_reveals ?? [], context.catalog, projection)}
      <div class="game-board">
        <aside class="ticket-queue" aria-labelledby="queue-heading" data-route-reveal>
          <div class="section-heading"><div><p class="play-eyebrow">Shared queue</p><h2 id="queue-heading">Active Tickets</h2></div><span>${tickets.length}</span></div>
          <div class="ticket-queue__list" data-continuity-scroll="game:tickets">${tickets.map((ticket, index) => `<button type="button" class="ticket-card${ticket.ticket_instance_id === lastClosureTicket ? ' is-closing' : ''}" data-ticket-id="${escapeHtml(ticket.ticket_instance_id)}" aria-current="${ticket.ticket_instance_id === session.selectedTicketId}" data-drop-target="true"><span class="ticket-card__index">SR-${String(index + 1).padStart(3, '0')}</span><strong>${escapeHtml(ticketName(projection, ticket.ticket_instance_id))}</strong><span>${escapeHtml(STATUS_LABELS[ticket.status] || ticket.status)}</span><small>Machine revision ${ticket.machine_revision}</small></button>`).join('')}</div>
          <div class="closed-ticket-list"><h3>Archived</h3>${publicMatch.closed_tickets.map((ticket) => `<div class="closure-chip${ticket.ticket_instance_id === lastClosureTicket ? ' is-new' : ''}"><span>Closed</span><strong>${escapeHtml(ticketName(projection, ticket.ticket_instance_id))}</strong></div>`).join('')}${(publicMatch.abandoned_tickets ?? []).map((ticket) => `<div class="closure-chip closure-chip--abandoned"><span>Given up</span><strong>${escapeHtml(ticketName(projection, ticket.ticket_instance_id))}</strong></div>`).join('') || (!publicMatch.closed_tickets.length ? '<p>None yet.</p>' : '')}</div>
        </aside>

        <section class="ticket-sheet${selectedTicket?.status === 'RETURNED_TO_DIAGNOSIS' ? ' is-returned' : ''}" data-continuity-scroll="game:ticket:${escapeHtml(selectedTicket?.ticket_instance_id || 'none')}:sheet" aria-labelledby="selected-ticket-heading" aria-current="true" data-route-reveal>
          ${selectedTicket ? `<div class="ticket-sheet__art play-art-slot"><img id="ticket-placeholder-art" width="900" height="420" alt=""></div>
          <header><p class="ticket-code">${escapeHtml(selectedTicket.ticket_instance_id)}</p><h2 id="selected-ticket-heading">${escapeHtml(presentation?.display_name || selectedTicket.ticket_definition_id)}</h2><p>${escapeHtml(presentation?.short_description || 'Generated repair scenario')}</p><span class="ticket-status" data-status="${selectedTicket.status}">${escapeHtml(STATUS_LABELS[selectedTicket.status] || selectedTicket.status)}</span></header>
          <section class="ticket-symptoms"><h3>Observe · visible symptoms</h3><ul>${selectedTicket.visible_symptom_ids.map((id) => `<li>${escapeHtml(domainName(context.catalog, id))}<code>${escapeHtml(id)}</code></li>`).join('')}</ul></section>
          <section class="machine-state-strip"><span>Machine state</span><strong>${escapeHtml(presentation?.machine_state_summary || 'No authorized machine-state change recorded.')}</strong><small>Machine revision ${selectedTicket.machine_revision} · diagnosis stage ${selectedTicket.diagnosis_revision} · Repair changes state; Verify proves recovery.</small></section>
          <section class="candidate-tray"${selectedTicket.status === 'RETURNED_TO_DIAGNOSIS' ? ' data-diagnosis-reopened="true"' : ''}><div class="section-heading"><div><p class="play-eyebrow">Hypothesize ↔ Test</p><h3>Candidate faults</h3></div><span>${selectedTicket.public_candidate_fault_ids.length}</span></div><ul>${candidateMarkup(selectedTicket, session, context)}</ul></section>
          <section class="accepted-isolation"><h3>Accepted Isolation</h3>${selectedTicket.accepted_isolations.length ? selectedTicket.accepted_isolations.map((record) => `<article><strong>${escapeHtml(domainName(context.catalog, record.candidate_fault_id))}</strong><span>${escapeHtml(record.classification.replaceAll('_', ' '))}</span><small>${record.cited_public_evidence_event_ids.length} public citation${record.cited_public_evidence_event_ids.length === 1 ? '' : 's'}</small></article>`).join('') : '<p>No actionable fault accepted yet.</p>'}</section>` : '<p>No active Ticket.</p>'}
        </section>

        <aside class="intelligence-panel" data-route-reveal>
          <div class="intelligence-tabs" role="tablist" aria-label="Ticket intelligence"><button type="button" role="tab" data-continuity-key="game-panel-evidence" data-panel-tab="evidence" aria-selected="${session.panelTab === 'evidence'}">Evidence</button><button type="button" role="tab" data-continuity-key="game-panel-worklog" data-panel-tab="worklog" aria-selected="${session.panelTab === 'worklog'}">Worklog</button></div>
          <section class="evidence-panel" data-continuity-scroll="game:ticket:${escapeHtml(selectedTicket?.ticket_instance_id || 'none')}:evidence" role="tabpanel" data-panel="evidence"${session.panelTab === 'evidence' ? '' : ' hidden'}><div class="section-heading"><div><p class="play-eyebrow">Knowledge state</p><h2>Evidence</h2></div><span>Team</span></div>${selectedTicket ? renderEvidence(view.authorized_events, selectedTicket.ticket_instance_id, context.catalog, session.lastEvents, session.lastAction?.result_event_id) : ''}</section>
          <section class="worklog-panel" data-continuity-scroll="game:ticket:${escapeHtml(selectedTicket?.ticket_instance_id || 'none')}:worklog" role="tabpanel" data-panel="worklog"${session.panelTab === 'worklog' ? '' : ' hidden'}><div class="section-heading"><div><p class="play-eyebrow">Immutable sequence</p><h2>Worklog</h2></div><span>${selectedTicket?.worklog.length || 0}</span></div>${selectedTicket ? renderWorklog(selectedTicket, session.lastEvents, session.lastAction?.result_event_id) : ''}</section>
        </aside>
      </div>

      <section class="diagnostic-bench" aria-labelledby="diagnostic-bench-heading" data-route-reveal>
        <header class="diagnostic-bench__heading"><div><p class="play-eyebrow">Persistent shared affordances</p><h2 id="diagnostic-bench-heading">Diagnostic Bench</h2><p>${session.benchView === 'RELEVANT' ? `Focused shelf · ${relevantCount} of ${bench.length} diagnostics connected by public relationships.` : `Complete playable catalog · ${bench.length} diagnostics. Filters do not change legality.`}</p></div><div class="bench-view-switch" role="group" aria-label="Bench View"><button type="button" data-bench-view="RELEVANT" aria-pressed="${session.benchView === 'RELEVANT'}">Relevant</button><button type="button" data-bench-view="GLOBAL" aria-pressed="${session.benchView === 'GLOBAL'}">Global</button></div></header>
        <p class="diagnostic-disclaimer">${escapeHtml(view.diagnostic_relevance_notice || '')}</p>
        <div class="diagnostic-bench__controls">
          ${session.benchView === 'GLOBAL' ? `<label>Search<input type="search" data-bench-search data-continuity-key="game:bench-search" value="${escapeHtml(session.benchSearch)}" placeholder="Search diagnostics"></label>` : ''}
          <label>Type<select data-bench-type><option value="ALL">All</option><option value="TEST"${session.benchTypeFilter === 'TEST' ? ' selected' : ''}>Test</option><option value="COMMAND"${session.benchTypeFilter === 'COMMAND' ? ' selected' : ''}>Command</option></select></label>
          ${session.benchView === 'GLOBAL' ? `<label>Category<select data-bench-category><option value="ALL">All</option>${categories.map((category) => `<option value="${escapeHtml(category)}"${session.benchCategory === category ? ' selected' : ''}>${escapeHtml(category)}</option>`).join('')}</select></label><label>Sort<select data-bench-sort><option value="NAME">Name</option><option value="COST"${session.benchSort === 'COST' ? ' selected' : ''}>Cost</option><option value="TYPE"${session.benchSort === 'TYPE' ? ' selected' : ''}>Type</option></select></label><label class="switch-row"><input type="checkbox" data-bench-relevant${session.benchRelevantOnly ? ' checked' : ''}>Relevant only</label>` : ''}
        </div>
        <div class="diagnostic-bench__count" role="status">Showing ${visibleBench.length} result${visibleBench.length === 1 ? '' : 's'} · page ${session.benchPage} of ${benchPageCount}</div>
        <div class="diagnostic-shelf">${pagedBench.map((entry) => {
          const card = context.catalog.cardById.get(entry.card_definition_id);
          const relevance = relevanceFor(entry);
          const why = relevance.why_relevant_paths?.[0];
          const explanation = why
            ? why.entity_ids.map((id) => domainName(context.catalog, id)).join(' → ')
            : 'No authored public relationship path is available; use Global to run it anyway.';
          const legal = projection.legal_intents.some((intent) => intent.card_instance_id === entry.card_instance_id);
          return `<article class="diagnostic-tile${entry.card_instance_id === session.selectedCardInstanceId ? ' is-selected' : ''}" data-relevant="${relevance.relevant}"><button type="button" data-select-diagnostic="${escapeHtml(entry.card_instance_id)}"${legal ? '' : ' aria-disabled="true"'}><span>${escapeHtml(entry.diagnostic_type)} · ${entry.action_cost} Action${entry.action_cost === 1 ? '' : 's'}</span><strong>${escapeHtml(cardName(card))}</strong><small>${relevance.relevant ? 'Relevant to selected Ticket' : 'Global catalog'}</small></button><details><summary>Why relevant?</summary><p>${escapeHtml(explanation)}</p></details></article>`;
        }).join('') || '<div class="empty-panel"><p>No diagnostics match these local filters.</p></div>'}</div>
        ${benchPageCount > 1 ? `<div class="bench-pagination"><button type="button" data-bench-page="${session.benchPage - 1}"${session.benchPage === 1 ? ' disabled' : ''}>Previous</button><span>${session.benchPage} / ${benchPageCount}</span><button type="button" data-bench-page="${session.benchPage + 1}"${session.benchPage === benchPageCount ? ' disabled' : ''}>Next</button></div>` : ''}
      </section>

      <section class="hand-rail" aria-labelledby="hand-heading" data-route-reveal><div class="hand-rail__heading"><div><p class="play-eyebrow">Private hand</p><h2 id="hand-heading">Cards</h2></div><span>${view.hand.length} in hand</span></div><div class="hand-rail__cards" data-continuity-scroll="game:hand"></div></section>
      <section class="action-dock" aria-labelledby="actions-heading" data-route-reveal><div><p class="play-eyebrow">Engine-projected options</p><h2 id="actions-heading">Legal actions</h2></div>
        <div class="selected-card-actions">${selectedCard ? `<strong>${escapeHtml(cardName(context.catalog.cardById.get(selectedCard.card_definition_id)))}</strong><span>${selectedIsDiagnostic ? `Persistent Diagnostic Bench item · ${escapeHtml(selectedCard.diagnostic_type)} · ${selectedCard.action_cost} Action${selectedCard.action_cost === 1 ? '' : 's'}` : 'Private Repair/Verify response Card'}</span><button type="button" class="play-button play-button--quiet" data-inspect-selected>Inspect</button>${alternateTargetNames.length ? `<p class="target-scope target-scope--alternate" data-alternate-target><strong>Alternate target only.</strong> This Card cannot apply to the displayed Ticket, ${escapeHtml(ticketName(projection, session.selectedTicketId))}. Submitting targets ${escapeHtml(alternateTargetNames.join(' or '))}.</p>` : ''}${prioritizedCardIntents.map((intent) => `<button type="button" class="play-button play-button--primary" data-intent-id="${intent.intent_id}" data-target-ticket-id="${escapeHtml(intent.ticket_instance_id || '')}"${session.resolving ? ' disabled' : ''}>${selectedIsDiagnostic ? 'Confirm &amp; ' : ''}${escapeHtml(actionLabel(intent, projection, context.catalog))}</button>`).join('') || '<span>No legal play for this item in the selected Ticket and machine revision.</span>'}` : '<span>Select a Diagnostic Bench item or response Card to inspect its legal targets.</span>'}</div>
        <div class="basic-action-row">
          ${closureIntent ? `<button type="button" class="basic-action basic-action--close" data-intent-id="${closureIntent.intent_id}"${session.resolving ? ' disabled' : ''}>Document &amp; Close</button>` : ''}
          ${documentIntents.map((intent) => `<button type="button" class="basic-action basic-action--document" data-intent-id="${intent.intent_id}"${session.resolving ? ' disabled' : ''}>Document Live</button>`).join('')}
          ${searchIntents.length ? `<label class="search-action">Search deck<select id="search-intent">${searchIntents.map((intent) => `<option value="${intent.intent_id}">${escapeHtml(cardName(context.catalog.cardById.get(intent.selected_card_definition_id)))}</option>`).join('')}</select><button type="button" class="basic-action" data-submit-search${session.resolving ? ' disabled' : ''}>Search</button></label>` : ''}
          ${refreshIntent ? `<button type="button" class="basic-action" data-intent-id="${refreshIntent.intent_id}"${session.resolving ? ' disabled' : ''}>Refresh</button>` : ''}
          ${giveUpIntent ? `<button type="button" class="basic-action basic-action--give-up" data-give-up-intent="${giveUpIntent.intent_id}"${session.resolving ? ' disabled' : ''}>Give Up Ticket</button>` : ''}
          ${passIntent ? `<button type="button" class="basic-action basic-action--pass" data-intent-id="${passIntent.intent_id}"${session.resolving ? ' disabled' : ''}>Pass</button>` : ''}
        </div>
        ${session.resolving ? '<span class="intent-resolving" role="status">Resolving authoritative intent…</span>' : ''}
      </section>
      <dialog id="game-card-dialog" class="play-dialog card-detail-dialog" aria-label="Card details"><button type="button" class="dialog-close" data-close-dialog aria-label="Close Card details">×</button><div data-dialog-content></div></dialog>
    </section>`;

  if (selectedTicket) bindResolvedImage(root.querySelector('#ticket-placeholder-art'), context.artResolver.resolveAssetById('placeholder.ticket.storage'));
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
  for (const held of view.hand) {
    const card = context.catalog.cardById.get(held.card_definition_id);
    const hasLegal = projection.legal_intents.some((intent) => intent.card_instance_id === held.card_instance_id);
    let suppressActivation = false;
    const cardView = createCardView(card, {
      variant: 'hand',
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
        const ticketButton = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-drop-target]');
        if (ticketButton) {
          const legal = projection.legal_intents.some((intent) => intent.card_instance_id === held.card_instance_id
            && intent.ticket_instance_id === ticketButton.dataset.ticketId);
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
        const ticketButton = cancelled ? null : document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-drop-target]');
        const legal = wasActive && ticketButton
          ? projection.legal_intents.find((intent) => intent.card_instance_id === held.card_instance_id
            && intent.ticket_instance_id === ticketButton.dataset.ticketId)
          : null;
        clearDragTargets();
        session.dragCardInstanceId = null;
        if (wasActive) {
          event.preventDefault();
          if (legal) submit(legal.intent_id);
          else settleDraggedCard(cardView);
        }
      };
      cardView.addEventListener('pointerup', (event) => finishPointerDrag(event));
      cardView.addEventListener('pointercancel', (event) => finishPointerDrag(event, true));
    }
    hand.append(cardView);
  }

  const submit = (intentId) => session.submit(intentId);
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
    const benchView = event.target.closest('[data-bench-view]');
    if (benchView) {
      session.benchView = benchView.dataset.benchView;
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
    const intent = event.target.closest('[data-intent-id]');
    if (intent) submit(intent.dataset.intentId);
    const giveUp = event.target.closest('[data-give-up-intent]');
    if (giveUp && confirm(`Give up ${ticketName(projection, session.selectedTicketId)}? Pending contributions will be voided and the complete solution revealed.`)) {
      submit(giveUp.dataset.giveUpIntent);
    }
    if (event.target.closest('[data-view-action-result]')) revealActionResult();
    if (event.target.closest('[data-submit-search]')) submit(root.querySelector('#search-intent').value);
    if (event.target.closest('[data-inspect-selected]') && selectedCard) {
      const dialog = root.querySelector('#game-card-dialog');
      dialog.querySelector('[data-dialog-content]').replaceChildren(createCardDetailView(context.catalog.cardById.get(selectedCard.card_definition_id), { artResolver: context.artResolver }));
      dialogWithRestore(dialog, event.target.closest('[data-inspect-selected]'));
      context.motion('dialog', dialog);
    }
    if (event.target.closest('[data-close-dialog]')) closeDialogWithMotion(root.querySelector('#game-card-dialog'));
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
    else return;
    session.benchPage = 1;
    context.rerender();
  };
  const onDragOver = (event) => {
    const ticketButton = event.target.closest('[data-drop-target]');
    if (!ticketButton || !session.dragCardInstanceId) return;
    const legal = projection.legal_intents.some((intent) => intent.card_instance_id === session.dragCardInstanceId && intent.ticket_instance_id === ticketButton.dataset.ticketId);
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
    const legal = projection.legal_intents.find((intent) => intent.card_instance_id === session.dragCardInstanceId && intent.ticket_instance_id === ticketButton.dataset.ticketId);
    ticketButton.removeAttribute('data-drag-target');
    session.dragCardInstanceId = null;
    if (legal) {
      event.preventDefault();
      submit(legal.intent_id);
    }
  };
  const onDragCancel = (event) => {
    if (event.key !== 'Escape') return;
    if (session.cancelPointerDrag?.()) {
      event.preventDefault();
      return;
    }
    if (!session.dragCardInstanceId) return;
    session.dragCardInstanceId = null;
    clearDragTargets();
    settleDraggedCard(root.querySelector('[data-pointer-dragging="true"]'));
    event.preventDefault();
  };
  root.addEventListener('click', onClick);
  root.addEventListener('input', onBenchInput);
  root.addEventListener('change', onBenchChange);
  document.addEventListener('keydown', onDragCancel);
  root.addEventListener('dragover', onDragOver);
  root.addEventListener('dragleave', onDragLeave);
  root.addEventListener('drop', onDrop);

  const pendingMotion = session.lastMotion;
  session.lastMotion = null;
  if (pendingMotion) requestAnimationFrame(() => context.motion(pendingMotion, root));
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
  };
}
