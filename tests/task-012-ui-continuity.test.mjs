import assert from 'node:assert/strict';
import test from 'node:test';

import { SoloGameSession } from '../viewer/js/play/game-session.mjs';
import { paymentSummary } from '../viewer/js/play/pages/game-page.mjs';

function projection({ selectedActions = 2 } = {}) {
  return {
    legal_intents: [{
      intent_id: 'intent.1.0001',
      action_type: 'RUN_TEST',
      ticket_instance_id: 'match.ticket.002',
      card_instance_id: 'match.card.001',
      card_definition_id: 'card.core.storage_device_inventory',
    }],
    ticket_presentations: {
      'match.ticket.001': { display_name: 'Displayed Ticket' },
      'match.ticket.002': { display_name: 'Alternate Ticket' },
    },
    view: {
      hand: [{
        card_instance_id: 'match.card.001',
        card_definition_id: 'card.core.storage_device_inventory',
      }],
      public_match: {
        repair_queue: [
          { ticket_instance_id: 'match.ticket.001' },
          { ticket_instance_id: 'match.ticket.002' },
        ],
        turn: { actions_remaining: selectedActions },
      },
    },
  };
}

test('cross-Ticket accepted results select their authoritative target and retain an Evidence route', () => {
  const session = new SoloGameSession();
  session.worker = { postMessage() {} };
  session.active = true;
  session.projection = projection();
  session.selectedTicketId = 'match.ticket.001';

  assert.equal(session.submit('intent.1.0001'), true);
  session.handleMessage({
    type: 'INTENT_RESOLVED',
    projection: projection({ selectedActions: 1 }),
    events: [{
      event_id: 'event.evidence.001',
      event_type: 'EVIDENCE_CREATED',
      ticket_instance_id: 'match.ticket.002',
      payload: { public_summary: 'Storage inventory completed.', candidate_effects: [] },
    }],
    result: {
      accepted: true,
      actions_spent: 1,
      utility_resources_spent: { search_tokens: 0, refresh_tokens: 0 },
      resolution_code: 'RESOLVED',
    },
    terminal_result: null,
  });

  assert.equal(session.selectedTicketId, 'match.ticket.002');
  assert.equal(session.panelTab, 'evidence');
  assert.equal(session.lastAction.target_ticket_id, 'match.ticket.002');
  assert.equal(session.lastAction.result_event_id, 'event.evidence.001');
  assert.equal(session.lastAction.accepted, true);
});

test('payment presentation reports authoritative spend and forces rejected actions to zero payment', () => {
  assert.equal(
    paymentSummary({
      actions_spent: 1,
      utility_resources_spent: { search_tokens: 0, refresh_tokens: 1 },
    }, true),
    '1 Action · 0 Search tokens · 1 Refresh token',
  );
  assert.equal(
    paymentSummary({
      actions_spent: 9,
      utility_resources_spent: { search_tokens: 9, refresh_tokens: 9 },
    }, false),
    '0 Actions · 0 Search tokens · 0 Refresh tokens · no Card spent',
  );
});

function documentationProjection({ legal = true, actions = 1 } = {}) {
  const ticketId = 'match.ticket.001';
  return {
    legal_intents: legal ? [{
      intent_id: 'intent.4.0001',
      action_type: 'DOCUMENT_LIVE',
      ticket_instance_id: ticketId,
      source_action_event_id: 'event.worklog.005',
    }] : [],
    ticket_presentations: { [ticketId]: { display_name: 'Documentation Ticket' } },
    view: {
      hand: [],
      diagnostic_bench: [],
      public_match: {
        repair_queue: [{ ticket_instance_id: ticketId }],
        turn: { actions_remaining: actions },
      },
    },
  };
}

test('Document Live settlement retains rejection context and routes accepted focus to the original Worklog entry', () => {
  const submissions = [];
  const session = new SoloGameSession();
  session.worker = { postMessage: (message) => submissions.push(message) };
  session.active = true;
  session.projection = documentationProjection();
  session.selectedTicketId = 'match.ticket.001';
  session.documentPreview = {
    intent_id: 'intent.4.0001',
    ticket_instance_id: 'match.ticket.001',
    source_action_event_id: 'event.worklog.005',
    public_summary: 'Exact authorized summary.',
  };

  assert.equal(session.submit('intent.4.0001'), true);
  assert.equal(session.submit('intent.4.0001'), false);
  assert.deepEqual(submissions, [{ type: 'SUBMIT_INTENT', intent_id: 'intent.4.0001' }]);
  session.handleMessage({
    type: 'INTENT_RESOLVED',
    projection: documentationProjection(),
    events: [],
    result: { accepted: false, error_code: 'ILLEGAL_DOCUMENT_SOURCE' },
    terminal_result: null,
  });
  assert.equal(session.documentPreview.rejection.error_code, 'ILLEGAL_DOCUMENT_SOURCE');
  assert.equal(session.lastAction.accepted, false);
  assert.equal(session.lastAction.result_event_id, 'event.worklog.005');

  assert.equal(session.submit('intent.4.0001'), true);
  session.handleMessage({
    type: 'INTENT_RESOLVED',
    projection: documentationProjection({ legal: false, actions: 0 }),
    events: [{
      event_id: 'event.publication.009',
      event_type: 'WORKLOG_PUBLICATION',
      ticket_instance_id: 'match.ticket.001',
      payload: {},
    }],
    result: { accepted: true, actions_spent: 1 },
    terminal_result: null,
  });
  assert.equal(session.documentPreview, null);
  assert.equal(session.panelTab, 'worklog');
  assert.equal(session.lastAction.result_event_id, 'event.worklog.005');
  assert.equal(session.restoreDocumentedWorklogFocus, 'event.worklog.005');
});
