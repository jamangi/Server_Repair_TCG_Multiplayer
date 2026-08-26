const TARGET_SELECTORS = Object.freeze({
  TICKET: '.ticket-sheet',
  RESOURCES: '.game-resources',
  CANDIDATES: '.candidate-tray, .view-full-ticket',
  BENCH: '.diagnostic-bench',
  EVIDENCE: '.evidence-panel',
  ISOLATION_GUIDANCE: '.isolation-guidance, .view-full-ticket',
  HAND: '.hand-rail',
  DOCUMENTATION: '.ticket-workflow, .view-full-ticket',
  BASIC_ACTIONS: '.basic-actions-panel',
  RESULT: '.result-panel',
});

function cardSource(intent, catalog) {
  const cardId = intent?.card_definition_id ?? intent?.selected_card_definition_id;
  return catalog?.cardById?.get(cardId)?.primary_domain_reference?.entity_id ?? null;
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
  if (checkpoint.source_definition_id && cardSource(intent, catalog) !== checkpoint.source_definition_id) return false;
  if (checkpoint.candidate_source === 'LATEST_CONFIRM'
      && intent.candidate_fault_id !== latestConfirmedCandidate(projection)) return false;
  return true;
}

function supportIntent(checkpoint, intent, projection, catalog) {
  if (!checkpoint?.support_action_types?.includes(intent?.action_type)) return false;
  if (intent.action_type === 'SEARCH' && checkpoint.source_definition_id) {
    return cardSource(intent, catalog) === checkpoint.source_definition_id;
  }
  if (intent.action_type === 'REFRESH' && checkpoint.source_definition_id) {
    const expectedAvailable = projection?.legal_intents?.some((candidate) => expectedIntent(checkpoint, candidate, projection, catalog));
    return !expectedAvailable;
  }
  return true;
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

  announceCurrent() {
    const checkpoint = this.current;
    if (checkpoint) this.announce(`Tutorial step ${this.index + 1} of ${this.definition.checkpoints.length}. ${checkpoint.title}. ${checkpoint.body[0]}`);
  }

  advance() {
    if (this.completed) return false;
    this.reviewIndex = null;
    this.index += 1;
    this.lastFocusKey = null;
    if (this.index >= this.definition.checkpoints.length) {
      this.completed = true;
      this.onComplete(this.definition.id);
      this.announce(`${this.definition.title} complete. Tutorial progress was recorded locally without changing Match statistics.`);
      return true;
    }
    this.announceCurrent();
    return true;
  }

  continueExplanation() {
    if (this.isReviewing) {
      this.reviewIndex = null;
      this.lastFocusKey = null;
      this.announceCurrent();
      return true;
    }
    if (this.current?.checkpoint_kind !== 'EXPLAIN') return false;
    return this.advance();
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
    return expectedIntent(this.current, intent, projection, this.catalog)
      || supportIntent(this.current, intent, projection, this.catalog);
  }

  submit(intent, projection) {
    if (this.isIntentAllowed(intent, projection)) return true;
    this.announce(`That legal Match action is paused by this tutorial step. ${this.current?.body?.[0] ?? 'Follow the highlighted control.'}`);
    return false;
  }

  handleResolution(intent, events, result, projection) {
    if (!expectedIntent(this.current, intent, projection, this.catalog)) return false;
    const observed = new Set((events ?? []).map((event) => event.event_type));
    const complete = result?.accepted === true
      && this.current.expected_event_types.every((type) => observed.has(type));
    if (!complete) {
      this.announce(`The tutorial is still on “${this.current.title}”. Review the persistent result and follow the highlighted recovery guidance.`);
      return false;
    }
    return this.advance();
  }

  targetSelector() {
    const checkpoint = this.displayed;
    if (!checkpoint) return TARGET_SELECTORS.RESULT;
    if (checkpoint.target === 'BENCH' && checkpoint.source_definition_id) {
      const card = [...this.catalog.cardById.values()].find((candidate) =>
        candidate.primary_domain_reference?.entity_id === checkpoint.source_definition_id);
      if (card) return `.diagnostic-tile:has(.play-card[data-card-id="${card.id}"]), ${TARGET_SELECTORS.BENCH}`;
    }
    return TARGET_SELECTORS[checkpoint.target] ?? '.tutorial-coach';
  }

  apply(root, projection) {
    if (!root) return;
    root.dataset.tutorialId = this.definition.id;
    root.querySelectorAll('[data-tutorial-target]').forEach((node) => node.removeAttribute('data-tutorial-target'));
    for (const button of root.querySelectorAll('[data-intent-id]')) {
      const intent = projection?.legal_intents?.find((candidate) => candidate.intent_id === button.dataset.intentId);
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
    const selectors = this.targetSelector().split(',').map((value) => value.trim());
    const targets = selectors.flatMap((selector) => [...root.querySelectorAll(selector)]);
    const target = targets.find((node) => !node.closest('dialog:not([open])')) ?? root.querySelector('.tutorial-coach');
    if (target) {
      target.dataset.tutorialTarget = 'true';
      if (!target.hasAttribute('tabindex')) target.tabIndex = -1;
    }
    const focusKey = `${this.displayed?.id ?? 'complete'}:${this.isReviewing}`;
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
    }
  }
  return errors;
}
