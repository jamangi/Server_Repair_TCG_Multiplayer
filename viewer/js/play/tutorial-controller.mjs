const TARGET_SELECTORS = Object.freeze({
  TICKET: '.ticket-sheet',
  RESOURCES: '.game-resources',
  CANDIDATES: '.candidate-tray, .view-full-ticket',
  BENCH: '.diagnostic-bench',
  EVIDENCE: '.evidence-panel',
  ISOLATION_GUIDANCE: '.isolation-guidance, .view-full-ticket',
  HAND: '.hand-rail',
  DOCUMENTATION: '.documentation-workflow',
  BASIC_ACTIONS: '.basic-actions-panel',
  RESULT: '.result-panel',
});

export const TUTORIAL_RECOVERY_ATTEMPT_LIMIT = 6;

const ACTION_LABELS = Object.freeze({
  SEARCH: 'Search',
  REFRESH: 'Refresh',
  PASS_TURN: 'Pass',
});

function cardSource(intent, catalog) {
  const cardId = intent?.card_definition_id ?? intent?.selected_card_definition_id;
  return catalog?.cardById?.get(cardId)?.primary_domain_reference?.entity_id ?? null;
}

function intentCardId(intent) {
  return intent?.card_definition_id ?? intent?.selected_card_definition_id ?? null;
}

function latestConfirmedCandidate(projection) {
  const events = projection?.view?.authorized_events ?? [];
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const confirmed = events[index].payload?.candidate_effects?.find((effect) => effect.disposition === 'CONFIRM');
    if (confirmed) return confirmed.candidate_fault_id;
  }
  return null;
}

function expectedIntent(checkpoint, intent, projection, catalog) {
  if (!checkpoint || checkpoint.checkpoint_kind !== 'ACTION' || intent?.action_type !== checkpoint.action_type) return false;
  if (checkpoint.card_definition_id && intentCardId(intent) !== checkpoint.card_definition_id) return false;
  if (checkpoint.source_definition_id && cardSource(intent, catalog) !== checkpoint.source_definition_id) return false;
  if (checkpoint.candidate_source === 'LATEST_CONFIRM'
      && intent.candidate_fault_id !== latestConfirmedCandidate(projection)) return false;
  return true;
}

function supportIntent(checkpoint, intent, projection, catalog) {
  if (!checkpoint?.support_action_types?.includes(intent?.action_type)) return false;
  if (intent.action_type === 'SEARCH' && (checkpoint.card_definition_id || checkpoint.source_definition_id)) {
    return checkpoint.card_definition_id
      ? intentCardId(intent) === checkpoint.card_definition_id
      : cardSource(intent, catalog) === checkpoint.source_definition_id;
  }
  if (intent.action_type === 'REFRESH' && checkpoint.source_definition_id) {
    const expectedAvailable = projection?.legal_intents?.some((candidate) => expectedIntent(checkpoint, candidate, projection, catalog));
    return !expectedAvailable;
  }
  return true;
}

function recoveryIntent(checkpoint, projection, catalog) {
  for (const actionType of checkpoint?.support_action_types ?? []) {
    const intent = projection?.legal_intents?.find((candidate) =>
      candidate.action_type === actionType && supportIntent(checkpoint, candidate, projection, catalog));
    if (intent) return intent;
  }
  return null;
}

function projectedStateSignature(checkpoint, projection) {
  const view = projection?.view ?? {};
  const turn = view.public_match?.turn ?? {};
  const relevantIntents = (projection?.legal_intents ?? [])
    .filter((intent) => intent.action_type === checkpoint?.action_type
      || checkpoint?.support_action_types?.includes(intent.action_type))
    .map((intent) => ({
      action_type: intent.action_type,
      card_definition_id: intent.card_definition_id ?? null,
      selected_card_definition_id: intent.selected_card_definition_id ?? null,
      candidate_fault_id: intent.candidate_fault_id ?? null,
      source_action_event_id: intent.source_action_event_id ?? null,
    }))
    .sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));
  return JSON.stringify({
    checkpoint_id: checkpoint?.id ?? null,
    actions_remaining: turn.actions_remaining ?? null,
    active_ticket_states: (view.public_match?.repair_queue ?? []).map((ticket) => ({
      ticket_instance_id: ticket.ticket_instance_id,
      status: ticket.status,
      machine_revision: ticket.machine_revision,
      diagnosis_revision: ticket.diagnosis_revision,
    })),
    hand: (view.hand ?? []).map((card) => card.card_definition_id).sort(),
    discard: [...(view.discard_card_instance_ids ?? [])].sort(),
    documentable_sources: (view.documentable_actions ?? [])
      .map((record) => record.source_action_event_id).sort(),
    relevant_intents: relevantIntents,
  });
}

function expectedActionName(checkpoint) {
  return checkpoint?.action_type?.replaceAll('_', ' ').toLowerCase() ?? 'required action';
}

function recoveryExplanation(checkpoint, intent, projection, catalog) {
  const actions = projection?.view?.public_match?.turn?.actions_remaining;
  if (checkpoint.action_type === 'DOCUMENT_LIVE' && intent.action_type === 'PASS_TURN') {
    return 'Document Live costs 1 Action, and you have 0 Actions remaining. Pass begins a fresh turn with 2 Actions. Choose the highlighted Pass control; the tutorial will then return to this Documentation checkpoint.';
  }
  if (intent.action_type === 'PASS_TURN') {
    return `${checkpoint.title} is not legal with ${Number.isSafeInteger(actions) ? actions : 'the current'} Actions remaining. Choose the highlighted Pass control to begin a fresh turn with 2 Actions; the tutorial will return to this checkpoint.`;
  }
  if (intent.action_type === 'SEARCH') {
    const source = cardSource(intent, catalog) ?? checkpoint.source_definition_id ?? 'the required Card';
    return `The required action is not currently available from the hand. Choose the highlighted Search for ${source}. Search costs 1 Action; the tutorial will remain on this checkpoint afterward.`;
  }
  if (intent.action_type === 'REFRESH') {
    return 'The required response Card is not currently available. Choose the highlighted Refresh control to recover eligible discard Cards; the tutorial will remain on this checkpoint afterward.';
  }
  return `Choose the highlighted ${ACTION_LABELS[intent.action_type] ?? intent.action_type.replaceAll('_', ' ')} recovery action. The tutorial will return to ${checkpoint.title}.`;
}

function blockedExplanation(checkpoint, projection, reason) {
  if (reason === 'NO_DOCUMENTABLE_SOURCE') {
    return 'No eligible documentable source remains in your authorized projection. Passing cannot create a record. Restart the tutorial to retry the pinned path, or exit safely; no hidden Ticket truth or tutorial-only action will be used.';
  }
  if (reason === 'DOCUMENTATION_PROJECTION_MISMATCH') {
    const actions = projection?.view?.public_match?.turn?.actions_remaining;
    return `Eligible documentable records are projected, but Document Live is not legal with ${Number.isSafeInteger(actions) ? actions : 'the current number of'} Actions. The tutorial cannot recover honestly from this state. Restart or exit safely.`;
  }
  if (reason === 'RECOVERY_CYCLE') {
    return 'The bounded recovery route repeated without exposing the required legal action. Restart the tutorial to retry its pinned path, or exit safely; unrelated actions remain paused.';
  }
  return `The player-safe projection exposes neither ${expectedActionName(checkpoint)} nor a supported legal recovery action. Restart the tutorial to retry its pinned path, or exit safely.`;
}

export class TutorialController {
  constructor(definition, { catalog, announce = () => {}, onComplete = () => {} } = {}) {
    this.definition = definition;
    this.catalog = catalog;
    this.announce = announce;
    this.onComplete = onComplete;
    this.index = 0;
    this.reviewIndex = null;
    this.completed = false;
    this.lastFocusKey = null;
    this.recoveryAttempts = 0;
    this.recoverySignatures = new Set();
    this.pendingRecovery = null;
    this.recoveryFailure = null;
    this.announceCurrent();
  }

  get current() {
    return this.definition.checkpoints[this.index] ?? null;
  }

  get displayed() {
    return this.reviewIndex === null ? this.current : this.definition.checkpoints[this.reviewIndex] ?? this.current;
  }

  get isReviewing() {
    return this.reviewIndex !== null;
  }

  guidance(projection) {
    const checkpoint = this.current;
    if (!checkpoint || checkpoint.checkpoint_kind !== 'ACTION' || this.isReviewing) {
      return { mode: 'STATIC', checkpoint, intent: null, explanation: null };
    }
    if (this.recoveryFailure) {
      return {
        mode: 'BLOCKED', checkpoint, intent: null,
        explanation: blockedExplanation(checkpoint, projection, this.recoveryFailure),
      };
    }
    const expected = projection?.legal_intents?.find((intent) =>
      expectedIntent(checkpoint, intent, projection, this.catalog));
    if (expected) return { mode: 'EXPECTED', checkpoint, intent: expected, explanation: null };

    if (checkpoint.action_type === 'DOCUMENT_LIVE') {
      const documentable = projection?.view?.documentable_actions ?? [];
      if (documentable.length === 0) {
        return {
          mode: 'BLOCKED', checkpoint, intent: null,
          explanation: blockedExplanation(checkpoint, projection, 'NO_DOCUMENTABLE_SOURCE'),
        };
      }
      const actions = projection?.view?.public_match?.turn?.actions_remaining;
      if (actions !== 0) {
        return {
          mode: 'BLOCKED', checkpoint, intent: null,
          explanation: blockedExplanation(checkpoint, projection, 'DOCUMENTATION_PROJECTION_MISMATCH'),
        };
      }
    }

    const recovery = recoveryIntent(checkpoint, projection, this.catalog);
    if (recovery && this.recoveryAttempts < TUTORIAL_RECOVERY_ATTEMPT_LIMIT) {
      return {
        mode: 'RECOVERY', checkpoint, intent: recovery,
        explanation: recoveryExplanation(checkpoint, recovery, projection, this.catalog),
      };
    }
    return {
      mode: 'BLOCKED', checkpoint, intent: null,
      explanation: blockedExplanation(
        checkpoint,
        projection,
        this.recoveryAttempts >= TUTORIAL_RECOVERY_ATTEMPT_LIMIT ? 'RECOVERY_CYCLE' : 'NO_RECOVERY',
      ),
    };
  }

  presentation(projection) {
    const checkpoint = this.displayed;
    const guide = this.isReviewing
      ? { mode: 'STATIC', checkpoint, explanation: null }
      : this.guidance(projection);
    return {
      ...checkpoint,
      body: guide.explanation ? [...checkpoint.body, guide.explanation] : [...checkpoint.body],
      guidance_mode: guide.mode,
      wait_copy: guide.mode === 'RECOVERY'
        ? `Complete the highlighted ${ACTION_LABELS[guide.intent.action_type] ?? 'recovery'} action to return here.`
        : guide.mode === 'BLOCKED'
          ? 'This checkpoint stopped safely. Use Restart or Exit tutorial.'
          : 'Complete the highlighted real Match action to continue.',
    };
  }

  announceCurrent(projection) {
    const checkpoint = this.presentation(projection);
    if (checkpoint) this.announce(`Tutorial step ${this.index + 1} of ${this.definition.checkpoints.length}. ${checkpoint.title}. ${checkpoint.body.join(' ')}`);
  }

  advance(projection) {
    if (this.completed) return false;
    this.reviewIndex = null;
    this.index += 1;
    this.lastFocusKey = null;
    this.recoveryAttempts = 0;
    this.recoverySignatures.clear();
    this.pendingRecovery = null;
    this.recoveryFailure = null;
    if (this.index >= this.definition.checkpoints.length) {
      this.completed = true;
      this.onComplete(this.definition.id);
      this.announce(`${this.definition.title} complete. Tutorial progress was recorded locally without changing Match statistics.`);
      return true;
    }
    this.announceCurrent(projection);
    return true;
  }

  continueExplanation(projection) {
    if (this.isReviewing) {
      this.reviewIndex = null;
      this.lastFocusKey = null;
      this.announceCurrent(projection);
      return true;
    }
    if (this.current?.checkpoint_kind !== 'EXPLAIN') return false;
    return this.advance(projection);
  }

  reviewPrevious() {
    if (this.index < 1 || this.completed) return false;
    this.reviewIndex = this.reviewIndex === null ? this.index - 1 : Math.max(0, this.reviewIndex - 1);
    this.lastFocusKey = null;
    const checkpoint = this.displayed;
    this.announce(`Reviewing: ${checkpoint.title}. No Match state was rewound.`);
    return true;
  }

  isIntentAllowed(intent, projection) {
    if (this.completed || this.isReviewing) return false;
    const guide = this.guidance(projection);
    if (guide.mode === 'EXPECTED') return expectedIntent(this.current, intent, projection, this.catalog);
    if (guide.mode !== 'RECOVERY') return false;
    if (guide.intent?.intent_id && intent?.intent_id) return guide.intent.intent_id === intent.intent_id;
    return supportIntent(this.current, intent, projection, this.catalog)
      && guide.intent?.action_type === intent?.action_type;
  }

  submit(intent, projection) {
    if (this.isIntentAllowed(intent, projection)) {
      const guide = this.guidance(projection);
      if (guide.mode === 'RECOVERY') {
        const signature = projectedStateSignature(this.current, projection);
        this.recoverySignatures.add(signature);
        this.pendingRecovery = {
          checkpointId: this.current.id,
          signature,
          actionType: guide.intent.action_type,
          intentId: guide.intent.intent_id ?? null,
        };
      }
      return true;
    }
    this.announce(`That legal Match action is paused by this tutorial step. ${this.current?.body?.[0] ?? 'Follow the highlighted control.'}`);
    return false;
  }

  handleResolution(intent, events, result, projection) {
    if (!expectedIntent(this.current, intent, projection, this.catalog)) {
      if (!this.pendingRecovery || this.pendingRecovery.checkpointId !== this.current?.id
          || this.pendingRecovery.actionType !== intent?.action_type
          || (this.pendingRecovery.intentId && intent?.intent_id
            && this.pendingRecovery.intentId !== intent.intent_id)) return false;
      this.pendingRecovery = null;
      this.recoveryAttempts += 1;
      if (result?.accepted !== true) {
        this.recoveryFailure = 'RECOVERY_CYCLE';
        this.announce(blockedExplanation(this.current, projection, this.recoveryFailure));
        return false;
      }
      const nextGuide = this.guidance(projection);
      const nextSignature = projectedStateSignature(this.current, projection);
      if (nextGuide.mode !== 'EXPECTED'
          && (this.recoverySignatures.has(nextSignature)
            || this.recoveryAttempts >= TUTORIAL_RECOVERY_ATTEMPT_LIMIT)) {
        this.recoveryFailure = 'RECOVERY_CYCLE';
        this.announce(blockedExplanation(this.current, projection, this.recoveryFailure));
        return false;
      }
      this.recoverySignatures.add(nextSignature);
      return false;
    }
    const observed = new Set((events ?? []).map((event) => event.event_type));
    const complete = result?.accepted === true
      && this.current.expected_event_types.every((type) => observed.has(type));
    if (!complete) {
      this.announce(`The tutorial is still on “${this.current.title}”. Review the persistent result and follow the highlighted recovery guidance.`);
      return false;
    }
    return this.advance(projection);
  }

  targetSelector(projection) {
    const checkpoint = this.displayed;
    if (!checkpoint) return TARGET_SELECTORS.RESULT;
    const guide = this.isReviewing ? null : this.guidance(projection);
    if (guide?.intent?.intent_id) {
      const fallback = TARGET_SELECTORS[checkpoint.target] ?? '.tutorial-coach';
      if (guide.intent.action_type === 'SEARCH') return `[data-submit-search], ${TARGET_SELECTORS.BASIC_ACTIONS}`;
      if (guide.intent.action_type === 'DOCUMENT_LIVE') {
        return `[data-preview-document="${guide.intent.intent_id}"], ${fallback}`;
      }
      return `[data-intent-id="${guide.intent.intent_id}"], ${fallback}`;
    }
    if (guide?.mode === 'BLOCKED') return '.tutorial-coach';
    if (checkpoint.target === 'BENCH' && checkpoint.source_definition_id) {
      const card = checkpoint.card_definition_id
        ? this.catalog.cardById.get(checkpoint.card_definition_id)
        : [...this.catalog.cardById.values()].find((candidate) =>
          candidate.primary_domain_reference?.entity_id === checkpoint.source_definition_id);
      if (card) return `.diagnostic-tile:has(.play-card[data-card-id="${card.id}"]), ${TARGET_SELECTORS.BENCH}`;
    }
    return TARGET_SELECTORS[checkpoint.target] ?? '.tutorial-coach';
  }

  apply(root, projection) {
    if (!root) return;
    root.dataset.tutorialId = this.definition.id;
    root.querySelectorAll('[data-tutorial-target]').forEach((node) => node.removeAttribute('data-tutorial-target'));
    const guide = this.isReviewing ? null : this.guidance(projection);
    for (const button of root.querySelectorAll('[data-intent-id], [data-preview-document]')) {
      const intentId = button.dataset.intentId ?? button.dataset.previewDocument;
      const intent = projection?.legal_intents?.find((candidate) => candidate.intent_id === intentId);
      if (intent && !this.isIntentAllowed(intent, projection)) {
        button.disabled = true;
        button.dataset.tutorialPaused = 'true';
      }
    }
    const giveUp = root.querySelector('[data-give-up-intent]');
    if (giveUp) {
      giveUp.disabled = true;
      giveUp.dataset.tutorialPaused = 'true';
    }
    if (guide?.mode === 'RECOVERY' && guide.intent?.action_type === 'SEARCH') {
      const select = root.querySelector('#search-intent');
      if (select?.querySelector(`option[value="${guide.intent.intent_id}"]`)) select.value = guide.intent.intent_id;
    }
    const selectors = this.targetSelector(projection).split(',').map((value) => value.trim());
    const targets = selectors.flatMap((selector) => [...root.querySelectorAll(selector)]);
    const target = targets.find((node) => !node.closest('dialog:not([open])')) ?? root.querySelector('.tutorial-coach');
    if (target) {
      target.dataset.tutorialTarget = 'true';
      if (!target.hasAttribute('tabindex')) target.tabIndex = -1;
    }
    const focusKey = `${this.displayed?.id ?? 'complete'}:${this.isReviewing}:${guide?.mode ?? 'STATIC'}:${guide?.intent?.action_type ?? 'NONE'}`;
    if (focusKey !== this.lastFocusKey) {
      this.lastFocusKey = focusKey;
      requestAnimationFrame(() => {
        const heading = root.querySelector('#tutorial-step-heading');
        (target && !target.closest('dialog:not([open])') ? target : heading)?.focus({ preventScroll: true });
        target?.scrollIntoView?.({ block: 'nearest', behavior: 'auto' });
      });
    }
  }
}

export function validateTutorialReferences(tutorialCatalog, catalog) {
  const errors = [];
  const ids = new Set();
  const sourceIds = new Set(catalog.domain.entities.map((record) => record.id));
  const ticketIds = new Set(catalog.ticketContent.templates.map((entry) => entry.ticket.id));
  for (const tutorial of tutorialCatalog.tutorials ?? []) {
    if (ids.has(tutorial.id)) errors.push(`Duplicate tutorial ID ${tutorial.id}.`);
    ids.add(tutorial.id);
    if (!ticketIds.has(tutorial.expected_ticket_definition_id)) errors.push(`${tutorial.id} references an unknown Ticket.`);
    const tutorialTicket = catalog.ticketContent.templates.find((entry) =>
      entry.ticket.id === tutorial.expected_ticket_definition_id)?.ticket;
    const publicCandidates = new Set(tutorialTicket?.public_candidate_fault_ids ?? []);
    const hintedCandidates = new Set();
    for (const hint of tutorial.candidate_role_hints ?? []) {
      if (hintedCandidates.has(hint.candidate_fault_id)) {
        errors.push(`${tutorial.id} repeats Candidate role hint ${hint.candidate_fault_id}.`);
      }
      hintedCandidates.add(hint.candidate_fault_id);
      if (!publicCandidates.has(hint.candidate_fault_id)) {
        errors.push(`${tutorial.id} role hint ${hint.candidate_fault_id} is not a public Candidate on its pinned Ticket.`);
      }
    }
    const checkpointIds = new Set();
    for (const checkpoint of tutorial.checkpoints ?? []) {
      if (checkpointIds.has(checkpoint.id)) errors.push(`${tutorial.id} has duplicate checkpoint ${checkpoint.id}.`);
      checkpointIds.add(checkpoint.id);
      if (checkpoint.source_definition_id && !sourceIds.has(checkpoint.source_definition_id)) {
        errors.push(`${checkpoint.id} references unknown source ${checkpoint.source_definition_id}.`);
      }
      if (checkpoint.source_definition_id && ![...catalog.cardById.values()].some((card) =>
        card.primary_domain_reference?.entity_id === checkpoint.source_definition_id)) {
        errors.push(`${checkpoint.id} has no real Card for ${checkpoint.source_definition_id}.`);
      }
      if (checkpoint.card_definition_id) {
        const card = catalog.cardById.get(checkpoint.card_definition_id);
        if (!card) errors.push(`${checkpoint.id} references unknown Card ${checkpoint.card_definition_id}.`);
        else if (checkpoint.source_definition_id
            && card.primary_domain_reference?.entity_id !== checkpoint.source_definition_id) {
          errors.push(`${checkpoint.id} Card ${checkpoint.card_definition_id} does not execute ${checkpoint.source_definition_id}.`);
        }
      }
      if (checkpoint.checkpoint_kind === 'ACTION'
          && checkpoint.support_action_types?.includes(checkpoint.action_type)) {
        errors.push(`${checkpoint.id} lists its required action as its own recovery action.`);
      }
    }
  }
  return errors;
}
