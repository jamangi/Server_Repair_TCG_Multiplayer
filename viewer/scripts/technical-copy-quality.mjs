import { createHash } from 'node:crypto';

export const PLAYABLE_ACTION_COUNTS = Object.freeze({
  test: 37,
  command: 13,
  repair_procedure: 12,
  validation_procedure: 9,
});

const PLACEHOLDER_PATTERNS = [
  /gathers troubleshooting evidence/i,
  /tests change the technician knowledge state/i,
  /corrective procedure/i,
  /confirms the repaired state/i,
  /verification evaluates whether the repair produced/i,
];
const ENGINE_PATTERNS = [
  /\bcompatible active Ticket\b/i,
  /\bauthored (?:current-state )?(?:Evidence )?outcome\b/i,
  /\bKnowledge State\b/i,
  /\bresolver\b/i,
  /\bprojection\b/i,
  /\bschema\b/i,
];
const RAW_ID = /\b(?:card|command|component|fault|protocol|repair|symptom|test|tool|verify)\.[a-z0-9_.-]+\b/i;

const expectedEntityType = (card) => card.card_type === 'verification' ? 'validation_procedure' : card.card_type;
const clean = (value) => typeof value === 'string' ? value.trim() : '';

function learnerCopy(record) {
  return {
    short_description: record.presentation?.short_description ?? '',
    education_text: record.education_text ?? null,
    purpose: record.purpose ?? null,
    capabilities: record.capabilities ?? null,
    steps_summary: record.steps_summary ?? null,
    success_conditions: record.success_conditions ?? null,
  };
}

function digest(value) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function learnerStrings(record) {
  const copy = learnerCopy(record);
  return Object.entries(copy).flatMap(([field, value]) => {
    if (Array.isArray(value)) return value.map((text) => [field, text]);
    return value == null ? [] : [[field, value]];
  });
}

function containsTerm(value, term) {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^A-Za-z0-9])${escaped}([^A-Za-z0-9]|$)`).test(value);
}

export function validateTask024TechnicalCopy({ entities, cards, selectedIds, glossary, ledger }) {
  const errors = [];
  const selected = new Set(selectedIds ?? []);
  const byId = new Map((entities ?? []).map((record) => [record.id, record]));
  const selectedRecords = [...selected].map((id) => byId.get(id)).filter(Boolean);
  if (selected.size !== 71 || selectedRecords.length !== 71) errors.push(`Expected 71 selected playable domain records; found ${selectedRecords.length}.`);
  for (const [type, expected] of Object.entries(PLAYABLE_ACTION_COUNTS)) {
    const actual = selectedRecords.filter((record) => record.entity_type === type).length;
    if (actual !== expected) errors.push(`Expected ${expected} selected ${type} records; found ${actual}.`);
  }

  const glossaryById = new Map((glossary?.terms ?? []).map((term) => [term.id, term]));
  const reviewById = new Map((ledger?.records ?? []).map((entry) => [entry.domain_id, entry]));
  const sourceIds = new Set((ledger?.sources ?? []).map((source) => source.id));
  for (const record of selectedRecords) {
    const description = clean(record.presentation?.short_description);
    if (!description) errors.push(`${record.id} lacks a required technical description.`);
    for (const pattern of PLACEHOLDER_PATTERNS) {
      if (pattern.test(description) || pattern.test(clean(record.education_text))) errors.push(`${record.id} contains placeholder copy matching ${pattern}.`);
    }
    for (const [field, value] of learnerStrings(record)) {
      if (RAW_ID.test(value)) errors.push(`${record.id} exposes a raw stable ID in ${field}.`);
      for (const pattern of ENGINE_PATTERNS) if (pattern.test(value)) errors.push(`${record.id} exposes engine vocabulary in ${field}.`);
    }
    const detailedCopy = [record.presentation?.display_name, ...learnerStrings(record).map(([, value]) => value)].join(' ');
    for (const term of glossary?.terms ?? []) {
      if (containsTerm(detailedCopy, term.term) && !detailedCopy.toLocaleLowerCase().includes(term.expansion.toLocaleLowerCase())) {
        errors.push(`${record.id} uses ${term.term} without the reviewed ${term.expansion} expansion.`);
      }
    }
    const review = reviewById.get(record.id);
    if (!review || review.review_status !== 'reviewed') errors.push(`${record.id} lacks a reviewed provenance entry.`);
    else {
      if (!review.source_ids?.length || review.source_ids.some((id) => !sourceIds.has(id))) errors.push(`${record.id} has invalid provenance sources.`);
      if (review.acronym_ids?.some((id) => !glossaryById.has(id))) errors.push(`${record.id} has an unknown glossary reference.`);
      if (review.technical_copy_sha256 !== digest(learnerCopy(record))) errors.push(`${record.id} review digest does not match its technical copy.`);
    }
  }
  if (reviewById.size !== 71 || [...reviewById.keys()].some((id) => !selected.has(id))) errors.push('The review ledger must map exactly the 71 selected playable domain IDs.');

  const selectedCards = (cards ?? []).filter((card) => selected.has(card.primary_domain_reference?.entity_id));
  if (selectedCards.length !== 71) errors.push(`Expected 71 generated playable Cards; found ${selectedCards.length}.`);
  if (new Set(selectedCards.map((card) => card.primary_domain_reference.entity_id)).size !== 71) errors.push('Each selected domain record must resolve from exactly one generated Card.');
  for (const card of selectedCards) {
    const domain = byId.get(card.primary_domain_reference.entity_id);
    if (!domain || domain.entity_type !== expectedEntityType(card)) errors.push(`${card.id} has the wrong primary domain family.`);
    if (card.presentation?.short_description !== domain?.presentation?.short_description) errors.push(`${card.id} technical description drifted from its primary domain record.`);
    if ((card.educational_text ?? null) !== (domain?.education_text ?? null)) errors.push(`${card.id} technical note drifted from its primary domain record.`);
    if (RAW_ID.test(card.rules_text ?? '')) errors.push(`${card.id} exposes a raw stable ID in ordinary game text.`);
    for (const pattern of ENGINE_PATTERNS) if (pattern.test(card.rules_text ?? '')) errors.push(`${card.id} exposes engine vocabulary in ordinary game text.`);
  }
  return errors;
}

export function assertTask024TechnicalCopy(input) {
  const errors = validateTask024TechnicalCopy(input);
  if (errors.length) throw new Error(`TASK-024 technical-copy validation failed:\n- ${errors.join('\n- ')}`);
  return input;
}
