const ACTION_TYPES = new Set(['test', 'command', 'repair_procedure', 'validation_procedure']);

const text = (value) => typeof value === 'string' && value.trim() ? value.trim() : '';

export function isTechnicalAction(record) {
  return ACTION_TYPES.has(record?.entity_type);
}

export function primaryDomainRecord(card, domainById) {
  const reference = card?.primary_domain_reference;
  if (!reference?.entity_id || !domainById?.get) return null;
  const record = domainById.get(reference.entity_id) ?? null;
  if (!record) return null;
  const expectedType = card.card_type === 'verification' ? 'validation_procedure' : card.card_type;
  return record.entity_type === expectedType ? record : null;
}

export function technicalNoteLabel(record) {
  const note = text(record?.education_text);
  if (!note) return null;
  if (/\b(?:never|unsafe|safety|de-energ|electrostatic|protect production data|data loss|stop immediately|do not live-probe)\b/i.test(note)) return 'Safety note';
  if (record.entity_type === 'repair_procedure') return 'Service note';
  if (record.entity_type === 'validation_procedure') return 'Acceptance note';
  return 'Interpretation note';
}

export function gameDetails(card) {
  const contract = card?.play_contract ?? {};
  if (contract.contract_type === 'DIAGNOSTIC') {
    return {
      target: contract.target_spec?.target_kind === 'TICKET_COMPONENT'
        ? 'A compatible component on the displayed Ticket'
        : 'The displayed Ticket',
      prerequisites: 'None beyond current runnability',
      result: 'Adds one diagnostic finding to the work record',
      disposition: contract.disposition === 'remain_in_diagnostic_bench'
        ? 'Remains on the Diagnostic Bench'
        : 'Moves to discard',
    };
  }
  if (contract.contract_type === 'REPAIR') {
    return {
      target: 'An accepted Isolation this procedure can repair',
      prerequisites: 'Accepted Isolation',
      result: 'Changes the machine state; recovery is not yet proven',
      disposition: 'Moves to discard',
    };
  }
  if (contract.contract_type === 'VERIFY') {
    return {
      target: 'A listed verification requirement on the displayed Ticket',
      prerequisites: 'A Repair recorded for the Ticket',
      result: 'Records a pass, failure, or inconclusive check',
      disposition: 'Moves to discard',
    };
  }
  return { target: 'Unavailable', prerequisites: 'Unavailable', result: 'Unavailable', disposition: 'Unavailable' };
}

function referencesForIds(ids, domainById, role) {
  return [...new Set(ids ?? [])].map((id) => {
    const record = domainById?.get?.(id);
    return {
      id,
      name: text(record?.presentation?.display_name) || text(record?.name) || id,
      entityType: record?.entity_type ?? null,
      role,
      href: `#/library/${encodeURIComponent(id)}`,
    };
  });
}

export function domainMethod(record, domainById) {
  if (!record) return { facts: [], lists: [], references: [] };
  const facts = [];
  const lists = [];
  const references = [];
  const addReferences = (ids, role) => references.push(...referencesForIds(ids, domainById, role));
  if (record.entity_type === 'command') {
    facts.push(['Platform', record.platform], ['Syntax', record.syntax], ['Purpose', record.purpose]);
    if (record.capabilities?.length) lists.push(['Capabilities', record.capabilities]);
    addReferences(record.related_test_ids, 'Related Test');
  } else if (record.entity_type === 'test') {
    facts.push(['Method', record.test_type]);
    addReferences(record.target_component_ids, 'Target component');
    addReferences(record.tool_requirement_ids, 'Required tool');
    addReferences(record.command_requirement_ids, 'Required Command');
    addReferences(record.evidence_rules?.map((rule) => rule.fault_id), 'Can inform');
  } else if (record.entity_type === 'repair_procedure') {
    if (record.steps_summary?.length) lists.push(['Procedure outline', record.steps_summary]);
    addReferences(record.target_fault_ids, 'Repairs');
    addReferences(record.required_component_ids, 'Required component');
    addReferences(record.required_tool_ids, 'Required tool');
    addReferences(record.required_protocol_ids, 'Required procedure');
  } else if (record.entity_type === 'validation_procedure') {
    if (record.success_conditions?.length) lists.push(['Success conditions', record.success_conditions]);
    addReferences(record.validates_fault_ids, 'Validates');
    addReferences(record.target_component_ids, 'Target component');
    addReferences(record.required_tool_ids, 'Required tool');
  }
  return {
    facts: facts.filter(([, value]) => text(value)),
    lists,
    references,
  };
}

export function resolveCardTechnicalCopy(card, domainById) {
  const record = primaryDomainRecord(card, domainById);
  const description = text(record?.presentation?.short_description);
  if (!record || !description) return null;
  const extraReferences = (card.additional_domain_references ?? []).flatMap((reference) =>
    referencesForIds([reference.entity_id], domainById, reference.role || 'Reference'));
  return {
    record,
    description,
    note: text(record.education_text),
    noteLabel: technicalNoteLabel(record),
    method: domainMethod(record, domainById),
    game: gameDetails(card),
    references: [
      ...referencesForIds([record.id], domainById, 'Primary technical source'),
      ...extraReferences,
    ],
  };
}
