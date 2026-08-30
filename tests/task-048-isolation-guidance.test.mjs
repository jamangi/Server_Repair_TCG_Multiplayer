import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildIsolationGuidanceModel,
  renderIsolationGuidance,
} from '../viewer/js/play/pages/game-page.mjs';

const TICKET_ID = 'ticket.instance.guidance';

function fixture({
  candidates,
  effects = [],
  legalCandidates = [],
  hypotheses = [],
  eliminations = [],
  roleHints = [],
  status = 'DIAGNOSIS',
}) {
  const ticket = {
    ticket_instance_id: TICKET_ID,
    status,
    machine_revision: 0,
    diagnosis_revision: 0,
    public_candidate_fault_ids: candidates,
    accepted_isolations: [],
  };
  const domainById = new Map(candidates.map((id) => [id, {
    id,
    presentation: { display_name: id.split('.').at(-1).replaceAll('_', ' ') },
  }]));
  const authorizedEvents = effects.map((effect, index) => ({
    event_id: `event.evidence.${index + 1}`,
    event_type: 'EVIDENCE_CREATED',
    ticket_instance_id: TICKET_ID,
    sequence: index + 1,
    payload: {
      machine_revision: 0,
      diagnosis_revision: 0,
      candidate_effects: [{
        candidate_fault_id: effect.candidate,
        disposition: effect.disposition,
      }],
    },
  }));
  const projection = {
    view: {
      player_id: 'player.guidance',
      public_match: {
        status: 'ACTIVE',
        turn: { active_player_id: 'player.guidance' },
      },
      authorized_events: authorizedEvents,
      hypotheses: { [TICKET_ID]: hypotheses },
      eliminations,
    },
    legal_intents: legalCandidates.map((candidate, index) => ({
      intent_id: `intent.isolate.${index + 1}`,
      action_type: 'COMMIT_ISOLATION',
      ticket_instance_id: TICKET_ID,
      candidate_fault_id: candidate,
      cited_evidence_event_ids: authorizedEvents
        .filter((event) => event.payload.candidate_effects.some((effect) => effect.candidate_fault_id === candidate))
        .map((event) => event.event_id),
    })),
  };
  const model = buildIsolationGuidanceModel(ticket, projection, { domainById }, {
    candidateRoleHints: roleHints,
  });
  return { model, markup: renderIsolationGuidance(model) };
}

test('reusable Isolation guidance distinguishes actionable CONFIRM from non-actionable CONFIRM', () => {
  const { model, markup } = fixture({
    candidates: ['fault.actionable', 'condition.non_actionable'],
    effects: [
      { candidate: 'fault.actionable', disposition: 'CONFIRM' },
      { candidate: 'condition.non_actionable', disposition: 'CONFIRM' },
    ],
    legalCandidates: ['fault.actionable', 'condition.non_actionable'],
    roleHints: [
      { candidate_fault_id: 'fault.actionable', role: 'ACTIONABLE' },
      { candidate_fault_id: 'condition.non_actionable', role: 'NON_ACTIONABLE' },
    ],
  });
  const actionable = model.candidates[0];
  const condition = model.candidates[1];
  assert.equal(actionable.role, 'ACTIONABLE');
  assert.equal(actionable.legal_commit_route, true);
  assert.equal(actionable.route_citation_count, 1);
  assert.equal(condition.role, 'NON_ACTIONABLE');
  assert.equal(condition.legal_commit_route, true);
  assert.match(condition.availability_explanation, /not a repairable cause/);
  assert.match(markup, /Legal · 1 projected citation/);
  assert.match(markup, /Non-actionable condition/);
});

test('reusable Isolation guidance explains corroboration, contradiction, elimination, and no Evidence', () => {
  const ruledOut = {
    ticket_instance_id: TICKET_ID,
    candidate_fault_id: 'fault.contradicted',
    diagnosis_revision: 0,
    eliminated: true,
  };
  const { model, markup } = fixture({
    candidates: ['fault.supported', 'fault.contradicted', 'fault.empty'],
    effects: [
      { candidate: 'fault.supported', disposition: 'SUPPORT' },
      { candidate: 'fault.supported', disposition: 'SUPPORT' },
      { candidate: 'fault.contradicted', disposition: 'CONTRADICT' },
    ],
    hypotheses: ['fault.supported'],
    eliminations: [ruledOut],
    roleHints: [{ candidate_fault_id: 'fault.supported', role: 'ACTIONABLE' }],
  });
  const supported = model.candidates[0];
  const contradicted = model.candidates[1];
  const empty = model.candidates[2];
  assert.equal(supported.role, 'ACTIONABLE');
  assert.equal(supported.strongest_disposition, 'SUPPORT');
  assert.equal(supported.evidence_count, 2);
  assert.equal(supported.notebook_state, 'Current hypothesis');
  assert.match(supported.availability_explanation, /corroborated route/);
  assert.equal(contradicted.strongest_disposition, 'CONTRADICT');
  assert.equal(contradicted.notebook_state, 'Ruled out');
  assert.match(contradicted.availability_explanation, /notebook state rules this Candidate out/);
  assert.equal(empty.strongest_disposition, 'NO_EVIDENCE');
  assert.equal(empty.evidence_count, 0);
  assert.match(empty.availability_explanation, /No authorized Evidence/);
  assert.match(markup, /2 authorized Evidence records/);
  assert.match(markup, /Role unresolved by current projection/);
  assert.doesNotMatch(markup, /secret|actual_present|eligible_outcome|server_only_truth/i);
});

test('reusable Isolation guidance treats RULE_OUT as elimination support rather than a commit route', () => {
  const { model } = fixture({
    candidates: ['fault.rule_out'],
    effects: [{ candidate: 'fault.rule_out', disposition: 'RULE_OUT' }],
  });
  assert.equal(model.candidates[0].strongest_disposition, 'RULE_OUT');
  assert.equal(model.candidates[0].legal_commit_route, false);
  assert.match(model.candidates[0].availability_explanation, /not an Isolation commit/);
});
