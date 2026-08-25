const FORBIDDEN_POLICY_KEYS = new Set([
  'server_only_truth',
  'actual_present',
  'authored_evidence_outcomes',
  'authored_repair_outcomes',
  'authored_verification_outcomes',
  'pending_contributions',
  'random_state',
  'deck_order',
]);

const DISPOSITION_WEIGHT = Object.freeze({
  CONFIRM: 8,
  SUPPORT: 3,
  INCONCLUSIVE: 0,
  CONTRADICT: -4,
  RULE_OUT: -8,
});

export const SUPPORTED_POLICY_IDS = Object.freeze([
  'methodical-seat-safe-v1',
  'methodical-seat-safe-v2',
  'publication-seat-safe-v1',
  'scripted-cooperative-v1',
  'scripted-competitive-v1',
  'pass-only-fixture-v1',
]);

function scanKeys(value, path = '$') {
  if (Array.isArray(value)) {
    return value.flatMap((entry, index) => scanKeys(entry, `${path}[${index}]`));
  }
  if (!value || typeof value !== 'object') return [];
  const errors = [];
  for (const [key, child] of Object.entries(value)) {
    if (FORBIDDEN_POLICY_KEYS.has(key)) errors.push(`${path}.${key}`);
    errors.push(...scanKeys(child, `${path}.${key}`));
  }
  return errors;
}

export function assertSeatSafePolicyInput(view) {
  const forbiddenPaths = scanKeys(view);
  if (forbiddenPaths.length > 0) {
    throw new Error(`Computer policy received forbidden authoritative fields: ${forbiddenPaths.join(', ')}`);
  }
}

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function actionType(option) {
  return option.action_type ?? option.request?.action_type ?? '';
}

function payload(option) {
  return option.payload ?? option.request?.payload ?? {};
}

function collectEvidence(value, records = []) {
  if (Array.isArray(value)) {
    for (const entry of value) collectEvidence(entry, records);
    return records;
  }
  if (!value || typeof value !== 'object') return records;
  if (typeof value.candidate_fault_id === 'string' && typeof value.disposition === 'string') {
    records.push({
      candidate_fault_id: value.candidate_fault_id,
      disposition: value.disposition,
      evidence_event_id: value.evidence_event_id ?? value.event_id ?? null,
    });
  }
  for (const child of Object.values(value)) collectEvidence(child, records);
  return records;
}

function candidateScore(view, option) {
  const candidate = payload(option).candidate_fault_id ?? option.candidate_fault_id;
  if (!candidate) return 0;
  return collectEvidence(view)
    .filter((record) => record.candidate_fault_id === candidate)
    .reduce((score, record) => score + (DISPOSITION_WEIGHT[record.disposition] ?? 0), 0);
}

function viewContains(view, token) {
  return canonical(view).includes(token);
}

function priority(policyId, view, option) {
  const type = actionType(option);
  if (type === 'PASS_TURN') return 100;
  if (type === 'PUBLISH_CLOSURE') return 0;
  if (policyId === 'pass-only-fixture-v1') return 200;

  const publicationPolicy = policyId === 'publication-seat-safe-v1'
    || policyId === 'scripted-competitive-v1';
  const scripted = policyId.startsWith('scripted-');
  const failureVisible = viewContains(view, 'VERIFY_FAILED') || viewContains(view, '"result":"FAIL"');

  if (type === 'DOCUMENT_LIVE' && (publicationPolicy || failureVisible)) return 1;
  if (type === 'PERFORM_VERIFY') return 2;
  if (type === 'PERFORM_REPAIR') return 3;
  if (type === 'SET_ELIMINATION') return 5;
  if (type === 'COMMIT_ISOLATION') {
    const score = candidateScore(view, option);
    const actorHasRejected = viewContains(view, 'ISOLATION_NOT_SUPPORTED');
    if (scripted && !actorHasRejected && score <= 0) return 4;
    return score > 0 ? 4 : 20;
  }
  if (type === 'RUN_TEST' || type === 'PLAY_CARD') {
    const sourceId = payload(option).execution_definition_id;
    const repeatedAtCurrentRevision = view.projection_version === 'engine-projection-v2'
      && view.authorized_events?.some((event) => event.event_type === 'EVIDENCE_CREATED'
        && event.payload?.source_definition_id === sourceId
        && event.payload?.machine_revision === payload(option).observed_machine_revision);
    return repeatedAtCurrentRevision ? 30 : 6;
  }
  if (type === 'DOCUMENT_LIVE') return 7;
  if (type === 'SEARCH') return 8;
  if (type === 'REFRESH') return 9;
  if (type === 'REVISE_HYPOTHESIS') return 10;
  if (type === 'GIVE_UP_TICKET') return 90;
  return 50;
}

export function choosePolicyIntent({ policyId, view, legalIntents }) {
  if (!SUPPORTED_POLICY_IDS.includes(policyId)) throw new Error(`Unsupported policy ${policyId}`);
  assertSeatSafePolicyInput(view);
  if (!Array.isArray(legalIntents) || legalIntents.length === 0) {
    throw new Error(`Policy ${policyId} received no legal intents; Pass must always be legal`);
  }

  const pass = legalIntents.find((option) => actionType(option) === 'PASS_TURN');
  if (policyId === 'pass-only-fixture-v1') {
    if (!pass) throw new Error('Pass-only fixture did not receive the always-legal Pass intent');
    return structuredClone(pass);
  }

  const ranked = legalIntents.map((option) => ({
    option,
    priority: priority(policyId, view, option),
    evidence_score: candidateScore(view, option),
    tie_breaker: canonical(option),
  })).sort((left, right) => left.priority - right.priority
    || right.evidence_score - left.evidence_score
    || left.tie_breaker.localeCompare(right.tie_breaker));
  return structuredClone(ranked[0].option);
}

export function hasLegalProgressIntent(legalIntents) {
  return legalIntents.some((option) => actionType(option) !== 'PASS_TURN');
}
