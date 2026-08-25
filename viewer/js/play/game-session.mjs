export class SoloGameSession {
  constructor({ onChange, onAnnounce, onStarted, onCompleted } = {}) {
    this.worker = null;
    this.projection = null;
    this.terminalResult = null;
    this.error = null;
    this.resolving = false;
    this.active = false;
    this.selectedTicketId = null;
    this.selectedCardInstanceId = null;
    this.benchView = null;
    this.benchSearch = '';
    this.benchTypeFilter = 'ALL';
    this.benchCategory = 'ALL';
    this.benchRelevantOnly = false;
    this.benchRunnableOnly = false;
    this.benchSort = 'NAME';
    this.benchPage = 1;
    this.handPage = 1;
    this.handExpanded = false;
    this.restoreHandToggleFocus = false;
    this.panelTab = 'evidence';
    this.lastEvents = [];
    this.lastResult = null;
    this.lastAction = null;
    this.pendingIntent = null;
    this.lastMotion = null;
    this.resultApplied = null;
    this.cancelPointerDrag = null;
    this.onChange = onChange ?? (() => {});
    this.onAnnounce = onAnnounce ?? (() => {});
    this.onStarted = onStarted ?? (() => {});
    this.onCompleted = onCompleted ?? (() => {});
    this.startPromise = null;
  }

  start(payload) {
    if (this.worker) throw new Error('A solo Worker session already exists.');
    if (typeof Worker !== 'function') {
      this.error = 'This browser does not support the module Worker required for local authority.';
      this.onChange();
      return Promise.reject(new Error(this.error));
    }
    this.worker = new Worker(new URL('./solo-worker.mjs', import.meta.url), {
      type: 'module',
      name: 'server-repair-solo-authority',
    });
    this.worker.addEventListener('message', (event) => this.handleMessage(event.data));
    this.worker.addEventListener('error', (event) => {
      this.error = event.message || 'The local Match Worker stopped unexpectedly.';
      this.worker?.terminate();
      this.worker = null;
      this.active = false;
      this.resolving = false;
      this.rejectStart?.(new Error(this.error));
      this.resolveStart = null;
      this.rejectStart = null;
      this.onAnnounce(this.error);
      this.onChange();
    });
    this.startPromise = new Promise((resolve, reject) => {
      this.resolveStart = resolve;
      this.rejectStart = reject;
    });
    this.worker.postMessage({ type: 'START_MATCH', payload });
    return this.startPromise;
  }

  handleMessage(message) {
    if (message.type === 'MATCH_STARTED') {
      this.projection = message.projection;
      this.active = true;
      this.selectedTicketId = message.projection.view.public_match.repair_queue[0]?.ticket_instance_id ?? null;
      this.lastMotion = 'route';
      this.onStarted(message.projection);
      const startingActions = message.projection.view.public_match.turn?.actions_remaining;
      this.onAnnounce(`Solo Match started. Opening hand drawn and first turn ready${Number.isSafeInteger(startingActions) ? ` with ${startingActions} Actions` : ''}.`);
      this.resolveStart?.(message.projection);
      this.resolveStart = null;
      this.rejectStart = null;
      this.onChange();
      return;
    }
    if (message.type === 'INTENT_RESOLVED') {
      const previousActions = this.projection?.view.public_match.turn?.actions_remaining;
      const submittedIntent = this.pendingIntent;
      this.pendingIntent = null;
      this.resolving = false;
      this.projection = message.projection;
      this.lastEvents = message.events || [];
      this.lastResult = message.result;
      const targetTicketId = submittedIntent?.ticket_instance_id ?? null;
      const resultEvent = this.lastEvents.find((event) => event.ticket_instance_id === targetTicketId
        && ['EVIDENCE_CREATED', 'VERIFY_RESOLVED', 'VERIFY_EVIDENCE_CREATED', 'ISOLATION_ACCEPTED', 'ISOLATION_NOT_SUPPORTED'].includes(event.event_type))
        ?? this.lastEvents.find((event) => event.ticket_instance_id === targetTicketId)
        ?? null;
      this.lastAction = submittedIntent ? {
        accepted: message.result?.accepted === true,
        intent: submittedIntent,
        result: message.result,
        target_ticket_id: targetTicketId,
        result_event_id: resultEvent?.event_id ?? null,
        result_event_type: resultEvent?.event_type ?? null,
      } : null;
      this.terminalResult = message.terminal_result;
      const activeTicketIds = message.projection.view.public_match.repair_queue
        .map((ticket) => ticket.ticket_instance_id);
      if (this.lastAction?.accepted && targetTicketId && targetTicketId !== this.selectedTicketId
        && activeTicketIds.includes(targetTicketId)) {
        this.selectedTicketId = targetTicketId;
        if (['EVIDENCE_CREATED', 'VERIFY_RESOLVED', 'VERIFY_EVIDENCE_CREATED', 'ISOLATION_ACCEPTED', 'ISOLATION_NOT_SUPPORTED']
          .includes(this.lastAction.result_event_type)) this.panelTab = 'evidence';
        else this.panelTab = 'worklog';
      }
      this.selectAvailableTicket();
      this.lastMotion = this.motionFromEvents(this.lastEvents, this.terminalResult, message.result);
      this.announceEvents(this.lastEvents, message.result, this.terminalResult, previousActions);
      if (this.terminalResult) {
        this.active = false;
        this.onCompleted(this.terminalResult);
      }
      this.onChange();
      return;
    }
    if (message.type === 'WORKER_ERROR') {
      this.error = message.message;
      this.resolving = false;
      this.pendingIntent = null;
      this.rejectStart?.(new Error(message.message));
      this.resolveStart = null;
      this.rejectStart = null;
      this.onAnnounce(`Local authority error: ${message.message}`);
      this.onChange();
      return;
    }
    if (message.type === 'SESSION_ENDED') this.terminate();
  }

  selectAvailableTicket() {
    const activeIds = this.projection?.view.public_match.repair_queue.map((ticket) => ticket.ticket_instance_id) ?? [];
    if (!activeIds.includes(this.selectedTicketId)) this.selectedTicketId = activeIds[0] ?? null;
    const selectableIds = [
      ...(this.projection?.view.hand ?? []),
      ...(this.projection?.view.diagnostic_bench ?? []),
    ].map((card) => card.card_instance_id);
    if (!selectableIds.includes(this.selectedCardInstanceId)) this.selectedCardInstanceId = null;
  }

  motionFromEvents(events, terminal, result) {
    if (terminal) return 'result';
    if (events.some((event) => event.event_type === 'TICKET_RETURNED_TO_DIAGNOSIS')) return 'failedVerify';
    if (events.some((event) => event.event_type === 'CLOSURE_PUBLISHED')) return 'ticketClosed';
    if (events.some((event) => event.event_type === 'TICKET_GIVEN_UP')) return 'ticketClosed';
    if (result?.accepted === false || result?.resolution_code === 'ISOLATION_NOT_SUPPORTED') return 'rejection';
    return 'actionResolved';
  }

  announceEvents(events, result, terminal, previousActions) {
    const messages = [];
    const currentActions = this.projection?.view.public_match.turn?.actions_remaining;
    if (Number.isSafeInteger(previousActions) && Number.isSafeInteger(currentActions) && currentActions !== previousActions) {
      messages.push(currentActions > previousActions
        ? `Actions refreshed to ${currentActions}.`
        : `${currentActions} Action${currentActions === 1 ? '' : 's'} remaining.`);
    }
    const draw = events.find((event) => event.event_type === 'CARD_DRAWN');
    if (draw) messages.push('A Card was drawn for the new turn.');
    const evidence = events.find((event) => event.event_type === 'EVIDENCE_CREATED');
    if (evidence) messages.push(evidence.payload.public_summary || 'New Evidence was recorded.');
    const verify = events.find((event) => event.event_type === 'VERIFY_RESOLVED');
    if (verify) messages.push(`Verify ${verify.payload.result.toLowerCase()}: ${verify.payload.public_summary}`);
    if (events.some((event) => event.event_type === 'TICKET_RETURNED_TO_DIAGNOSIS')) messages.push('Failed Verify returned the Ticket to Diagnosis. Prior machine changes and history remain.');
    if (events.some((event) => event.event_type === 'CLOSURE_PUBLISHED')) messages.push('Ticket documented, closed, and archived.');
    if (events.some((event) => event.event_type === 'TICKET_GIVEN_UP')) messages.push('Ticket abandoned. Its solution is revealed and no further actions can target it.');
    if (events.some((event) => event.event_type === 'CANDIDATE_ELIMINATION_SET')) messages.push('Candidate elimination record updated for the current diagnosis stage.');
    if (result?.accepted === false) messages.push(`Action rejected: ${result.error_code}. No cost was paid.`);
    if (result?.resolution_code === 'ISOLATION_NOT_SUPPORTED') messages.push('Isolation was not supported. The Action was spent; hidden truth was not disclosed.');
    if (terminal) messages.push('Solo Match complete. Local result statistics are ready.');
    if (messages.length) this.onAnnounce(messages.join(' '));
  }

  submit(intentId) {
    if (!this.worker || !this.active || this.resolving) return false;
    if (!this.projection?.legal_intents.some((intent) => intent.intent_id === intentId)) return false;
    const selected = this.projection.legal_intents.find((intent) => intent.intent_id === intentId);
    this.selectedCardInstanceId = selected.card_instance_id ?? this.selectedCardInstanceId;
    this.pendingIntent = structuredClone(selected);
    this.resolving = true;
    this.lastMotion = null;
    this.worker.postMessage({ type: 'SUBMIT_INTENT', intent_id: intentId });
    this.onChange();
    return true;
  }

  terminate() {
    this.cancelPointerDrag?.();
    this.cancelPointerDrag = null;
    this.worker?.terminate();
    this.worker = null;
    this.active = false;
    this.resolving = false;
    this.pendingIntent = null;
    this.handExpanded = false;
  }

  endSession() {
    if (!this.worker) return;
    this.worker.postMessage({ type: 'END_SESSION' });
    this.terminate();
  }

  hasActiveMatch() {
    return Boolean(this.active && !this.terminalResult);
  }
}
