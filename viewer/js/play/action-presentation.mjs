const DIAGNOSTIC_RESULT_TYPES = new Set(['EVIDENCE_CREATED']);

function cardSourceDefinitionId(cardDefinition) {
  return cardDefinition?.play_contract?.source_definition_id ?? null;
}

function targetKind(cardDefinition) {
  return cardDefinition?.play_contract?.target_spec?.target_kind ?? null;
}

export function isBenchDiagnosticInstance(cardInstanceId, diagnosticBench = []) {
  return Boolean(cardInstanceId
    && diagnosticBench.some((entry) => entry.card_instance_id === cardInstanceId));
}

export function intentsForCardOnTicket(legalIntents = [], cardInstanceId, ticketInstanceId) {
  if (!cardInstanceId || !ticketInstanceId) return [];
  return legalIntents.filter((intent) => intent.card_instance_id === cardInstanceId
    && intent.ticket_instance_id === ticketInstanceId);
}

export function isDiagnosticRunnableOnTicket(legalIntents = [], cardInstanceId, ticketInstanceId) {
  return intentsForCardOnTicket(legalIntents, cardInstanceId, ticketInstanceId).length > 0;
}

export function currentDiagnosticResult({
  authorizedEvents = [],
  cardDefinition,
  ticketInstanceId,
  machineRevision,
} = {}) {
  const sourceDefinitionId = cardSourceDefinitionId(cardDefinition);
  if (targetKind(cardDefinition) !== 'ACTIVE_TICKET'
    || !sourceDefinitionId
    || !ticketInstanceId
    || !Number.isInteger(machineRevision)) return null;
  return authorizedEvents
    .filter((event) => DIAGNOSTIC_RESULT_TYPES.has(event.event_type)
      && event.ticket_instance_id === ticketInstanceId
      && event.payload?.source_definition_id === sourceDefinitionId
      && event.payload?.machine_revision === machineRevision)
    .sort((left, right) => (left.sequence ?? 0) - (right.sequence ?? 0))
    .at(-1) ?? null;
}

/**
 * Keep persistent Bench diagnostics scoped to the displayed Ticket while
 * retaining TASK-012's explicit alternate-Ticket behavior for held response
 * Cards. This model is presentation-only; every action remains an opaque
 * engine-projected intent.
 */
export function buildSelectedActionPresentation({
  selectedCard,
  diagnosticBench = [],
  legalIntents = [],
  selectedTicket = null,
  cardDefinition = null,
  authorizedEvents = [],
} = {}) {
  if (!selectedCard) {
    return Object.freeze({
      selectionKind: 'NONE',
      actionIntents: [],
      alternateTicketIds: [],
      statusCode: 'NO_SELECTION',
      statusMessage: null,
      completedResultEventId: null,
      targetKind: null,
    });
  }

  const selectedTicketId = selectedTicket?.ticket_instance_id ?? null;
  const allCardIntents = legalIntents.filter((intent) =>
    intent.card_instance_id === selectedCard.card_instance_id);
  const selectedTicketIntents = intentsForCardOnTicket(
    allCardIntents,
    selectedCard.card_instance_id,
    selectedTicketId,
  );
  const diagnostic = isBenchDiagnosticInstance(selectedCard.card_instance_id, diagnosticBench);

  if (!diagnostic) {
    const targetsDisplayedTicket = selectedTicketIntents.length > 0;
    const actionIntents = targetsDisplayedTicket ? selectedTicketIntents : allCardIntents;
    return Object.freeze({
      selectionKind: 'RESPONSE_CARD',
      actionIntents,
      alternateTicketIds: targetsDisplayedTicket ? [] : [...new Set(actionIntents
        .map((intent) => intent.ticket_instance_id)
        .filter((ticketId) => ticketId && ticketId !== selectedTicketId))],
      statusCode: actionIntents.length ? 'RUNNABLE' : 'UNAVAILABLE',
      statusMessage: actionIntents.length ? null : 'No legal play for this Card and machine revision.',
      completedResultEventId: null,
      targetKind: targetKind(cardDefinition),
    });
  }

  const diagnosticTargetKind = targetKind(cardDefinition);
  const invalidActiveTicketMultiplicity = diagnosticTargetKind === 'ACTIVE_TICKET'
    && selectedTicketIntents.length > 1;
  const actionIntents = invalidActiveTicketMultiplicity ? [] : selectedTicketIntents;
  const completed = actionIntents.length === 0 && !invalidActiveTicketMultiplicity
    ? currentDiagnosticResult({
      authorizedEvents,
      cardDefinition,
      ticketInstanceId: selectedTicketId,
      machineRevision: selectedTicket?.machine_revision,
    })
    : null;
  const statusCode = actionIntents.length
    ? 'RUNNABLE'
    : completed
      ? 'COMPLETED_CURRENT_REVISION'
      : invalidActiveTicketMultiplicity
        ? 'INVALID_ACTIVE_TICKET_MULTIPLICITY'
        : 'UNAVAILABLE';
  const statusMessage = statusCode === 'COMPLETED_CURRENT_REVISION'
    ? 'Completed for this machine revision. No Action was spent on this unavailable selection.'
    : actionIntents.length
      ? null
      : 'Not currently runnable on this Ticket — no Action spent.';

  return Object.freeze({
    selectionKind: 'BENCH_DIAGNOSTIC',
    actionIntents,
    alternateTicketIds: [],
    statusCode,
    statusMessage,
    completedResultEventId: completed?.event_id ?? null,
    targetKind: diagnosticTargetKind,
  });
}

export function projectedDropIntent({
  legalIntents = [],
  diagnosticBench = [],
  cardInstanceId,
  ticketInstanceId,
  selectedTicketId,
} = {}) {
  if (isBenchDiagnosticInstance(cardInstanceId, diagnosticBench)
    && ticketInstanceId !== selectedTicketId) return null;
  return legalIntents.find((intent) => intent.card_instance_id === cardInstanceId
    && intent.ticket_instance_id === ticketInstanceId) ?? null;
}
