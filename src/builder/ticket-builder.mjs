import { canonicalJson, sha256, weightedChoice } from './canonical.mjs';
import { validateTicketSolvability } from './ticket-solvability.mjs';

export const TICKET_BUILDER_VERSION = 'ticket-builder-v1';
export const TICKET_BUILDER_CONFIGURATION_VERSION = 'ticket-builder-v1';

const stableCompare = (left, right) => (left < right ? -1 : left > right ? 1 : 0);
const sorted = (values) => [...values].sort(stableCompare);
const STABLE_ID_PATTERN = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/;
const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const MODE_CONTEXTS = new Set([
  'CAMPAIGN', 'MISSION', 'CHALLENGE', 'TRAINING', 'COOPERATIVE', 'COMPETITIVE', 'SIMULATION',
]);

function diagnostic(code, constraint, detail, {
  templateIds = [], requestedCount = null, eligibleCount = null, generatedIndex = null,
} = {}) {
  return {
    code,
    constraint,
    detail,
    template_ids: sorted(new Set(templateIds)),
    requested_count: requestedCount,
    eligible_count: eligibleCount,
    generated_index: generatedIndex,
  };
}

function diagnosticSort(left, right) {
  return stableCompare(
    `${left.code}\u0000${left.constraint}\u0000${left.detail}`,
    `${right.code}\u0000${right.constraint}\u0000${right.detail}`,
  );
}

function within(value, bounds) {
  return value >= bounds.minimum && value <= bounds.maximum;
}

function normalizeConfigurations(configurations) {
  if (configurations instanceof Map) return configurations;
  if (Array.isArray(configurations)) return new Map(configurations.map((item) => [item.id, item]));
  return new Map(Object.entries(configurations ?? {}));
}

export function validateBuilderConfiguration(configuration) {
  const errors = [];
  if (!configuration || typeof configuration !== 'object' || Array.isArray(configuration)) {
    return [diagnostic('INVALID_CONFIGURATION', 'CONFIGURATION', 'Builder configuration must be an object.')];
  }
  const arrayFields = [
    'allowed_domain_ids',
    'excluded_domain_ids',
    'allowed_tags',
    'excluded_tags',
    'guaranteed_categories',
    'required_teaching_beats',
    'active_causal_fingerprints',
    'legal_card_definition_ids',
  ];
  for (const field of arrayFields) {
    const values = configuration[field];
    if (!Array.isArray(values)) {
      errors.push(diagnostic('INVALID_CONFIGURATION', 'CONFIGURATION', `${field} must be an array.`));
    } else if (new Set(values).size !== values.length) {
      errors.push(diagnostic('INVALID_CONFIGURATION', 'CONFIGURATION', `${field} values must be unique.`));
    } else if (field === 'active_causal_fingerprints'
      ? values.some((value) => typeof value !== 'string' || !SHA256_PATTERN.test(value))
      : values.some((value) => typeof value !== 'string' || !STABLE_ID_PATTERN.test(value))) {
      errors.push(diagnostic('INVALID_CONFIGURATION', 'CONFIGURATION', `${field} contains an invalid stable identifier.`));
    }
  }
  const bounds = [
    ['authored_difficulty_bounds', configuration.authored_difficulty_bounds],
    ['fault_count_bounds', configuration.fault_count_bounds],
    ['required_actionable_fault_count_bounds', configuration.required_actionable_fault_count_bounds],
    ['causal_depth_bounds', configuration.causal_depth_bounds],
    ['inbound_branching_bounds', configuration.inbound_branching_bounds],
    ['outbound_branching_bounds', configuration.outbound_branching_bounds],
  ];
  for (const [name, range] of bounds) {
    if (!range || !Number.isInteger(range.minimum) || !Number.isInteger(range.maximum)
      || range.minimum < 0 || range.maximum < range.minimum) {
      errors.push(diagnostic('INVALID_CONFIGURATION', 'CONFIGURATION', `${name} is not an ordered nonnegative integer range.`));
    }
  }
  if (!Number.isInteger(configuration.requested_ticket_count)
    || configuration.requested_ticket_count < 1 || configuration.requested_ticket_count > 99) {
    errors.push(diagnostic('INVALID_CONFIGURATION', 'CONFIGURATION', 'requested_ticket_count must be a positive integer.'));
  }
  if (!Number.isInteger(configuration.generation_index_start) || configuration.generation_index_start < 0) {
    errors.push(diagnostic('INVALID_CONFIGURATION', 'CONFIGURATION', 'generation_index_start must be a nonnegative integer.'));
  }
  if (configuration.generator_version !== TICKET_BUILDER_VERSION) {
    errors.push(diagnostic('VERSION_MISMATCH', 'VERSION', `Unsupported generator version ${configuration.generator_version}.`));
  }
  if (configuration.configuration_version !== TICKET_BUILDER_CONFIGURATION_VERSION) {
    errors.push(diagnostic('VERSION_MISMATCH', 'VERSION', `Unsupported configuration version ${configuration.configuration_version}.`));
  }
  if (typeof configuration.seed !== 'string' || configuration.seed.length === 0) {
    errors.push(diagnostic('INVALID_CONFIGURATION', 'CONFIGURATION', 'seed must be a nonempty string.'));
  }
  if (typeof configuration.allow_duplicate_causal_fingerprints !== 'boolean') {
    errors.push(diagnostic('INVALID_CONFIGURATION', 'CONFIGURATION', 'allow_duplicate_causal_fingerprints must be boolean.'));
  }
  if (!MODE_CONTEXTS.has(configuration.scenario_or_mode_context)) {
    errors.push(diagnostic('INVALID_CONFIGURATION', 'CONFIGURATION', 'scenario_or_mode_context is unsupported.'));
  }
  if (Array.isArray(configuration.legal_card_definition_ids)
    && configuration.legal_card_definition_ids.length === 0) {
    errors.push(diagnostic('INVALID_CONFIGURATION', 'CARD_POOL', 'legal_card_definition_ids must not be empty.'));
  }
  const profile = configuration.progressive_difficulty_profile;
  if (!profile || !Array.isArray(profile.bands) || profile.bands.length === 0) {
    errors.push(diagnostic('INVALID_CONFIGURATION', 'CONFIGURATION', 'A versioned Progressive Difficulty profile requires at least one band.'));
  } else {
    if (!STABLE_ID_PATTERN.test(profile.profile_id ?? '')
      || !STABLE_ID_PATTERN.test(profile.profile_version ?? '')
      || !Number.isInteger(profile.explicit_ceiling)
      || profile.explicit_ceiling < 1 || profile.explicit_ceiling > 10) {
      errors.push(diagnostic('INVALID_CONFIGURATION', 'PROGRESSIVE_DIFFICULTY', 'Progressive Difficulty profile identity and ceiling must be valid.'));
    }
    const bands = [...profile.bands]
      .filter((band) => band && typeof band === 'object' && !Array.isArray(band))
      .sort((left, right) => left.start_generated_index - right.start_generated_index);
    if (bands.length !== profile.bands.length) {
      errors.push(diagnostic('INVALID_CONFIGURATION', 'PROGRESSIVE_DIFFICULTY', 'Every Progressive Difficulty band must be an object.'));
    }
    for (const band of bands) {
      if (!Number.isInteger(band.start_generated_index) || band.start_generated_index < 0
        || !Number.isInteger(band.end_generated_index) || band.end_generated_index < band.start_generated_index
        || !Number.isInteger(band.minimum) || !Number.isInteger(band.target) || !Number.isInteger(band.maximum)
        || band.minimum < 1 || band.maximum > 10
        || band.minimum > band.target || band.target > band.maximum
        || band.maximum > profile.explicit_ceiling) {
        errors.push(diagnostic('INVALID_CONFIGURATION', 'PROGRESSIVE_DIFFICULTY', 'Progressive Difficulty bands must be ordered and remain within their explicit ceiling.'));
      }
    }
    for (let index = configuration.generation_index_start;
      index < configuration.generation_index_start + configuration.requested_ticket_count; index += 1) {
      const matching = bands.filter((band) => index >= band.start_generated_index && index <= band.end_generated_index);
      if (matching.length !== 1) {
        errors.push(diagnostic(
          'INVALID_CONFIGURATION',
          'PROGRESSIVE_DIFFICULTY',
          `Generated index ${index} must be covered by exactly one Progressive Difficulty band.`,
          { generatedIndex: index },
        ));
      }
    }
  }
  const active = Array.isArray(configuration.active_causal_fingerprints)
    ? configuration.active_causal_fingerprints : [];
  if (new Set(active).size !== active.length) {
    errors.push(diagnostic('INVALID_CONFIGURATION', 'DUPLICATE_FINGERPRINT', 'Active causal fingerprints must be unique.'));
  }
  if (configuration.fallback_configuration_id === configuration.id) {
    errors.push(diagnostic('INVALID_CONFIGURATION', 'FALLBACK', 'A Builder configuration cannot name itself as fallback.'));
  }
  if (configuration.fallback_configuration_id !== null
    && (typeof configuration.fallback_configuration_id !== 'string'
      || !STABLE_ID_PATTERN.test(configuration.fallback_configuration_id))) {
    errors.push(diagnostic('INVALID_CONFIGURATION', 'FALLBACK', 'fallback_configuration_id must be null or a stable identifier.'));
  }
  return errors.sort(diagnosticSort);
}

function validateTemplateEnvelope(template) {
  const errors = [];
  const expectedKeys = [
    'categories',
    'domain_reference_ids',
    'generation_tags',
    'required_card_definition_ids',
    'selection_weight',
    'teaching_beats',
    'template_id',
    'ticket',
  ];
  const actualKeys = Object.keys(template).sort();
  if (canonicalJson(actualKeys) !== canonicalJson(expectedKeys)) {
    errors.push(`Template ${template.template_id ?? '<missing>'} has an unexpected envelope shape.`);
  }
  if (!Number.isFinite(template.selection_weight) || template.selection_weight <= 0) {
    errors.push(`Template ${template.template_id} has a nonpositive or non-finite selection weight.`);
  }
  for (const field of ['categories', 'teaching_beats', 'generation_tags', 'domain_reference_ids', 'required_card_definition_ids']) {
    if (!Array.isArray(template[field]) || new Set(template[field]).size !== template[field].length) {
      errors.push(`Template ${template.template_id} ${field} must be a unique array.`);
    }
  }
  if (template.ticket?.generation_provenance !== null) {
    errors.push(`Template ${template.template_id} must retain null generation provenance before compilation.`);
  }
  return errors;
}

function ticketDomainReferenceIds(ticket) {
  const references = new Set([
    ...(ticket.initial_symptom_ids ?? []),
    ...(ticket.public_candidate_fault_ids ?? []),
    ...(ticket.server_only_truth?.fault_instances ?? []).map((instance) => instance.fault_id),
    ...(ticket.server_only_truth?.causal_edge_ids ?? []),
  ]);
  for (const outcome of ticket.authored_evidence_outcomes ?? []) {
    references.add(outcome.source_definition_id);
    if (outcome.observation_id) references.add(outcome.observation_id);
    for (const effect of outcome.candidate_effects ?? []) references.add(effect.candidate_fault_id);
  }
  for (const requirement of ticket.repair_requirements ?? []) {
    references.add(requirement.fault_id);
    for (const procedureId of requirement.eligible_repair_procedure_ids ?? []) references.add(procedureId);
  }
  for (const outcome of ticket.authored_repair_outcomes ?? []) references.add(outcome.repair_procedure_id);
  for (const requirement of ticket.verification_requirements ?? []) {
    references.add(requirement.validation_procedure_id);
  }
  for (const outcome of ticket.authored_verification_outcomes ?? []) {
    references.add(outcome.validation_procedure_id);
    for (const faultId of outcome.revealed_candidate_fault_ids ?? []) references.add(faultId);
    for (const effect of outcome.candidate_effects ?? []) references.add(effect.candidate_fault_id);
  }
  return references;
}

function progressiveBand(configuration, generatedIndex) {
  return configuration.progressive_difficulty_profile.bands.find((band) =>
    generatedIndex >= band.start_generated_index && generatedIndex <= band.end_generated_index);
}

function templateConstraintFailures(template, analysis, configuration, generatedIndex) {
  const failures = [];
  const domainIds = new Set(template.domain_reference_ids);
  const tags = new Set(template.generation_tags);
  const allowedIds = new Set(configuration.allowed_domain_ids);
  const excludedIds = new Set(configuration.excluded_domain_ids);
  const allowedTags = new Set(configuration.allowed_tags);
  const excludedTags = new Set(configuration.excluded_tags);
  if (allowedIds.size > 0 && [...domainIds].some((id) => !allowedIds.has(id))) failures.push('ALLOWED_EXCLUDED');
  if ([...domainIds].some((id) => excludedIds.has(id))) failures.push('ALLOWED_EXCLUDED');
  if (allowedTags.size > 0 && ![...tags].some((tag) => allowedTags.has(tag))) failures.push('ALLOWED_EXCLUDED');
  if ([...tags].some((tag) => excludedTags.has(tag))) failures.push('ALLOWED_EXCLUDED');
  if (!within(template.ticket.difficulty, configuration.authored_difficulty_bounds)) failures.push('DIFFICULTY');
  if (!within(analysis.metrics.fault_count, configuration.fault_count_bounds)) failures.push('FAULT_COUNT');
  if (!within(analysis.metrics.required_actionable_fault_count, configuration.required_actionable_fault_count_bounds)) {
    failures.push('ACTIONABLE_FAULT_COUNT');
  }
  if (!within(analysis.metrics.causal_depth, configuration.causal_depth_bounds)) failures.push('CAUSAL_DEPTH');
  if (!within(analysis.metrics.inbound_branching, configuration.inbound_branching_bounds)) failures.push('INBOUND_BRANCHING');
  if (!within(analysis.metrics.outbound_branching, configuration.outbound_branching_bounds)) failures.push('OUTBOUND_BRANCHING');
  const band = progressiveBand(configuration, generatedIndex);
  if (!band || template.ticket.difficulty < band.minimum || template.ticket.difficulty > band.maximum
    || template.ticket.difficulty > configuration.progressive_difficulty_profile.explicit_ceiling) {
    failures.push('PROGRESSIVE_DIFFICULTY');
  }
  if (template.required_card_definition_ids.some((id) => !configuration.legal_card_definition_ids.includes(id))) {
    failures.push('CARD_POOL');
  }
  return sorted(new Set(failures));
}

const CONSTRAINT_DETAILS = {
  ALLOWED_EXCLUDED: 'No authored template satisfies the allowed/excluded domain and tag filters.',
  DIFFICULTY: 'No authored template satisfies the authored difficulty bounds.',
  FAULT_COUNT: 'No authored template satisfies the Fault-count bounds.',
  ACTIONABLE_FAULT_COUNT: 'No authored template satisfies the required actionable-Fault-count bounds.',
  CAUSAL_DEPTH: 'No authored template satisfies the causal-depth bounds.',
  INBOUND_BRANCHING: 'No authored template satisfies the inbound-branching bounds.',
  OUTBOUND_BRANCHING: 'No authored template satisfies the outbound-branching bounds.',
  PROGRESSIVE_DIFFICULTY: 'No authored template satisfies the indexed Progressive Difficulty band.',
  CARD_POOL: 'No authored template has a complete path in the legal Card pool.',
};

function covered(needed, actual) {
  return needed.every((value) => actual.has(value));
}

function chooseBatch(templates, analyses, configuration, attemptId) {
  const neededCategories = configuration.guaranteed_categories;
  const neededBeats = configuration.required_teaching_beats;
  const activeFingerprints = new Set(configuration.active_causal_fingerprints);
  const memo = new Map();

  const completionWeight = (position, used, categories, beats) => {
    if (position === configuration.requested_ticket_count) {
      return covered(neededCategories, categories) && covered(neededBeats, beats) ? 1 : 0;
    }
    const key = canonicalJson({
      position,
      used: sorted(used),
      categories: sorted(categories),
      beats: sorted(beats),
    });
    if (memo.has(key)) return memo.get(key);
    const generatedIndex = configuration.generation_index_start + position;
    let total = 0;
    for (const template of templates) {
      const analysis = analyses.get(template.template_id);
      if (templateConstraintFailures(template, analysis, configuration, generatedIndex).length > 0) continue;
      if (!configuration.allow_duplicate_causal_fingerprints
        && (activeFingerprints.has(analysis.causalFingerprint) || used.has(analysis.causalFingerprint))) continue;
      const nextUsed = new Set(used);
      if (!configuration.allow_duplicate_causal_fingerprints) nextUsed.add(analysis.causalFingerprint);
      const nextCategories = new Set([...categories, ...template.categories]);
      const nextBeats = new Set([...beats, ...template.teaching_beats]);
      total += template.selection_weight * completionWeight(position + 1, nextUsed, nextCategories, nextBeats);
    }
    memo.set(key, total);
    return total;
  };

  const rootWeight = completionWeight(0, new Set(), new Set(), new Set());
  if (rootWeight <= 0) return null;
  const chosen = [];
  let used = new Set();
  let categories = new Set();
  let beats = new Set();
  for (let position = 0; position < configuration.requested_ticket_count; position += 1) {
    const generatedIndex = configuration.generation_index_start + position;
    const choices = [];
    const weights = [];
    for (const template of templates) {
      const analysis = analyses.get(template.template_id);
      if (templateConstraintFailures(template, analysis, configuration, generatedIndex).length > 0) continue;
      if (!configuration.allow_duplicate_causal_fingerprints
        && (activeFingerprints.has(analysis.causalFingerprint) || used.has(analysis.causalFingerprint))) continue;
      const nextUsed = new Set(used);
      if (!configuration.allow_duplicate_causal_fingerprints) nextUsed.add(analysis.causalFingerprint);
      const nextCategories = new Set([...categories, ...template.categories]);
      const nextBeats = new Set([...beats, ...template.teaching_beats]);
      const branchWeight = template.selection_weight
        * completionWeight(position + 1, nextUsed, nextCategories, nextBeats);
      if (branchWeight > 0) {
        choices.push(template);
        weights.push(branchWeight);
      }
    }
    const selected = weightedChoice(choices, weights, configuration.seed, attemptId, position);
    const fingerprint = analyses.get(selected.template_id).causalFingerprint;
    chosen.push(selected);
    if (!configuration.allow_duplicate_causal_fingerprints) used = new Set([...used, fingerprint]);
    categories = new Set([...categories, ...selected.categories]);
    beats = new Set([...beats, ...selected.teaching_beats]);
  }
  return chosen;
}

export function compileTicketTemplate(template, provenance, ordinal = 0) {
  const ticket = structuredClone(template.ticket);
  const { generation_index_start: generationIndexStart, ...persistedProvenance } = provenance;
  const identity = sha256({
    template_id: template.template_id,
    generator_version: provenance.generator_version,
    content_version: provenance.content_version,
    configuration_id: provenance.configuration_id,
    attempt_id: provenance.attempt_id,
    seed: provenance.seed,
    ordinal,
  });
  ticket.id = `ticket.generated.${identity.slice(0, 24)}`;
  ticket.generation_provenance = {
    ...persistedProvenance,
    generation_index: generationIndexStart + ordinal,
    template_id: template.template_id,
  };
  return ticket;
}

function attempt(configuration, kind, parentAttemptId, ticketContent, domainCatalog, cardCatalog) {
  const attemptId = `builder_attempt.${sha256({ configuration, kind, parentAttemptId }).slice(0, 24)}`;
  const diagnostics = validateBuilderConfiguration(configuration);
  if (ticketContent.ticket_content_version !== configuration.content_version) {
    diagnostics.push(diagnostic('VERSION_MISMATCH', 'VERSION', 'Ticket template content version does not match the pinned configuration.'));
  }
  if (domainCatalog.domain_content_version !== configuration.domain_content_version) {
    diagnostics.push(diagnostic('VERSION_MISMATCH', 'VERSION', 'Domain content version does not match the pinned configuration.'));
  }
  if (cardCatalog.card_catalog_version !== configuration.card_catalog_version
    || cardCatalog.domain_content_version !== configuration.domain_content_version) {
    diagnostics.push(diagnostic('VERSION_MISMATCH', 'VERSION', 'Card catalog versions do not match the pinned configuration.'));
  }
  if (kind === 'FALLBACK' && configuration.fallback_configuration_id !== null) {
    diagnostics.push(diagnostic('INVALID_CONFIGURATION', 'FALLBACK', 'A separately audited fallback configuration cannot chain another fallback.'));
  }
  const templateRecords = Array.isArray(ticketContent?.templates) ? ticketContent.templates : [];
  if (!Array.isArray(ticketContent?.templates)) {
    diagnostics.push(diagnostic('INVALID_AUTHORED_INPUT', 'AUTHORED_INPUT', 'Ticket content must expose a templates array.'));
  }
  const templates = [...templateRecords].sort((left, right) => stableCompare(left.template_id, right.template_id));
  if (new Set(templates.map((template) => template.template_id)).size !== templates.length) {
    diagnostics.push(diagnostic('INVALID_AUTHORED_INPUT', 'AUTHORED_INPUT', 'Ticket template IDs must be unique.'));
  }
  const domainIds = new Set((domainCatalog?.entities ?? []).map((entity) => entity.id));
  const cardIds = new Set((cardCatalog?.cards ?? []).map((card) => card.id));
  const analyses = new Map();
  for (const template of templates) {
    const envelopeErrors = validateTemplateEnvelope(template);
    if (envelopeErrors.length > 0) {
      diagnostics.push(...envelopeErrors.map((detail) => diagnostic(
        'INVALID_AUTHORED_INPUT', 'AUTHORED_INPUT', detail, { templateIds: [template.template_id] },
      )));
      continue;
    }
    const missingDeclaredDomainIds = template.domain_reference_ids.filter((id) => !domainIds.has(id));
    const undeclaredTicketReferences = [...ticketDomainReferenceIds(template.ticket)]
      .filter((id) => !template.domain_reference_ids.includes(id));
    const missingCards = template.required_card_definition_ids.filter((id) => !cardIds.has(id));
    if (missingDeclaredDomainIds.length > 0 || undeclaredTicketReferences.length > 0 || missingCards.length > 0) {
      if (missingDeclaredDomainIds.length > 0) {
        diagnostics.push(diagnostic(
          'REFERENCE_NOT_FOUND',
          'REFERENCE',
          `Template declares missing domain IDs: ${sorted(missingDeclaredDomainIds).join(', ')}.`,
          { templateIds: [template.template_id] },
        ));
      }
      if (undeclaredTicketReferences.length > 0) {
        diagnostics.push(diagnostic(
          'INVALID_AUTHORED_INPUT',
          'AUTHORED_INPUT',
          `Template omits rule-significant Ticket references: ${sorted(undeclaredTicketReferences).join(', ')}.`,
          { templateIds: [template.template_id] },
        ));
      }
      if (missingCards.length > 0) {
        diagnostics.push(diagnostic(
          'REFERENCE_NOT_FOUND',
          'CARD_POOL',
          `Template declares missing Card Definitions: ${sorted(missingCards).join(', ')}.`,
          { templateIds: [template.template_id] },
        ));
      }
      continue;
    }
    const analysis = validateTicketSolvability(template.ticket, {
      domainCatalog,
      cardCatalog,
      legalCardDefinitionIds: template.required_card_definition_ids,
    });
    analyses.set(template.template_id, analysis);
    if (!analysis.valid) {
      diagnostics.push(...analysis.errors.map((entry) => diagnostic(
        entry.code === 'CARD_POOL_UNREACHABLE' ? 'CARD_POOL_UNREACHABLE' : 'INVALID_AUTHORED_INPUT',
        entry.code === 'CAUSAL_GRAPH_INVALID' ? 'CAUSAL_DAG'
          : entry.code === 'REFERENCE_NOT_FOUND' ? 'REFERENCE'
            : entry.code === 'CARD_POOL_UNREACHABLE' ? 'CARD_POOL' : 'AUTHORED_INPUT',
        entry.detail,
        { templateIds: [template.template_id] },
      )));
    }
  }
  if (diagnostics.length > 0) {
    return {
      attempt_id: attemptId,
      attempt_kind: kind,
      parent_attempt_id: parentAttemptId,
      configuration: structuredClone(configuration),
      status: 'FAILURE',
      diagnostics: diagnostics.sort(diagnosticSort),
      selected_template_ids: [],
      ticket_snapshot_digests: [],
      ticket_snapshots: [],
    };
  }

  const chosen = chooseBatch(templates, analyses, configuration, attemptId);
  if (!chosen) {
    const constraints = new Set();
    const eligibleTemplateIds = new Set();
    for (let position = 0; position < configuration.requested_ticket_count; position += 1) {
      for (const template of templates) {
        const failures = templateConstraintFailures(
          template,
          analyses.get(template.template_id),
          configuration,
          configuration.generation_index_start + position,
        );
        for (const failure of failures) constraints.add(failure);
        if (failures.length === 0) eligibleTemplateIds.add(template.template_id);
      }
    }
    const failureDiagnostics = [];
    for (const constraint of sorted(constraints)) {
      failureDiagnostics.push(diagnostic(
        'NO_ELIGIBLE_TEMPLATE',
        constraint,
        CONSTRAINT_DETAILS[constraint],
        {
          templateIds: templates
            .filter((template) => templateConstraintFailures(
              template,
              analyses.get(template.template_id),
              configuration,
              configuration.generation_index_start,
            ).includes(constraint))
            .map((template) => template.template_id),
          requestedCount: configuration.requested_ticket_count,
          eligibleCount: eligibleTemplateIds.size,
        },
      ));
    }
    if (constraints.has('PROGRESSIVE_DIFFICULTY')) {
      failureDiagnostics.push(diagnostic('PROGRESSIVE_BAND_UNSATISFIABLE', 'PROGRESSIVE_DIFFICULTY', 'No complete batch satisfies every indexed Progressive Difficulty band.'));
    }
    if (constraints.has('CARD_POOL')) {
      failureDiagnostics.push(diagnostic('CARD_POOL_UNREACHABLE', 'CARD_POOL', 'The legal card pool cannot reach every required template path.'));
    }
    const uniqueEligibleFingerprints = new Set([...eligibleTemplateIds]
      .map((templateId) => analyses.get(templateId).causalFingerprint)
      .filter((fingerprint) => !configuration.active_causal_fingerprints.includes(fingerprint)));
    if (eligibleTemplateIds.size > 0 && !configuration.allow_duplicate_causal_fingerprints
      && uniqueEligibleFingerprints.size < configuration.requested_ticket_count) {
      failureDiagnostics.push(diagnostic('DUPLICATE_FINGERPRINT_UNSATISFIABLE', 'DUPLICATE_FINGERPRINT', 'The requested batch cannot avoid active or within-batch duplicate causal fingerprints.'));
    }
    if (configuration.guaranteed_categories.length > 0) {
      failureDiagnostics.push(diagnostic('BATCH_GUARANTEE_UNSATISFIABLE', 'CATEGORY_GUARANTEE', 'The requested batch cannot satisfy every category guarantee.'));
    }
    if (configuration.required_teaching_beats.length > 0) {
      failureDiagnostics.push(diagnostic('BATCH_GUARANTEE_UNSATISFIABLE', 'TEACHING_BEAT_GUARANTEE', 'The requested batch cannot satisfy every teaching-beat guarantee.'));
    }
    failureDiagnostics.push(diagnostic(
      'REQUESTED_COUNT_UNSATISFIABLE',
      'REQUESTED_COUNT',
      'No complete candidate batch satisfies every hard constraint.',
      { requestedCount: configuration.requested_ticket_count, eligibleCount: 0 },
    ));
    return {
      attempt_id: attemptId,
      attempt_kind: kind,
      parent_attempt_id: parentAttemptId,
      configuration: structuredClone(configuration),
      status: 'FAILURE',
      diagnostics: failureDiagnostics.sort(diagnosticSort),
      selected_template_ids: [],
      ticket_snapshot_digests: [],
      ticket_snapshots: [],
    };
  }

  const snapshots = chosen.map((template, ordinal) => compileTicketTemplate(template, {
    generator_version: configuration.generator_version,
    content_version: configuration.content_version,
    domain_content_version: configuration.domain_content_version,
    card_catalog_version: configuration.card_catalog_version,
    configuration_version: configuration.configuration_version,
    configuration_id: configuration.id,
    attempt_id: attemptId,
    seed: configuration.seed,
    generation_index_start: configuration.generation_index_start,
    fallback_attempt_id: kind === 'FALLBACK' ? attemptId : null,
  }, ordinal));
  for (const snapshot of snapshots) {
    const check = validateTicketSolvability(snapshot, {
      domainCatalog,
      cardCatalog,
      legalCardDefinitionIds: configuration.legal_card_definition_ids,
    });
    if (!check.valid) {
      return {
        attempt_id: attemptId,
        attempt_kind: kind,
        parent_attempt_id: parentAttemptId,
        configuration: structuredClone(configuration),
        status: 'FAILURE',
        diagnostics: check.errors.map((entry) => diagnostic(
          entry.code === 'CARD_POOL_UNREACHABLE' ? 'CARD_POOL_UNREACHABLE' : 'INVALID_AUTHORED_INPUT',
          entry.code === 'CARD_POOL_UNREACHABLE' ? 'CARD_POOL' : 'AUTHORED_INPUT',
          entry.detail,
        )).sort(diagnosticSort),
        selected_template_ids: [],
        ticket_snapshot_digests: [],
        ticket_snapshots: [],
      };
    }
  }
  return {
    attempt_id: attemptId,
    attempt_kind: kind,
    parent_attempt_id: parentAttemptId,
    configuration: structuredClone(configuration),
    status: 'SUCCESS',
    diagnostics: [],
    selected_template_ids: chosen.map((template) => template.template_id),
    ticket_snapshot_digests: snapshots.map((snapshot) => sha256(snapshot)),
    ticket_snapshots: snapshots,
  };
}

export function buildTickets({
  configuration,
  configurationsById = {},
  ticketContent,
  domainCatalog,
  cardCatalog,
}) {
  const primary = attempt(configuration, 'PRIMARY', null, ticketContent, domainCatalog, cardCatalog);
  const attempts = [primary];
  let selected = primary.status === 'SUCCESS' ? primary : null;
  if (!selected && configuration.fallback_configuration_id !== null) {
    const fallback = normalizeConfigurations(configurationsById).get(configuration.fallback_configuration_id);
    if (fallback) {
      const fallbackAttempt = attempt(fallback, 'FALLBACK', primary.attempt_id, ticketContent, domainCatalog, cardCatalog);
      attempts.push(fallbackAttempt);
      if (fallbackAttempt.status === 'SUCCESS') selected = fallbackAttempt;
    } else {
      primary.diagnostics.push(diagnostic(
        'FALLBACK_CONFIGURATION_NOT_FOUND',
        'FALLBACK',
        `Fallback configuration ${configuration.fallback_configuration_id} is not registered.`,
      ));
      primary.diagnostics.sort(diagnosticSort);
    }
  }
  return {
    id: `builder_result.${sha256(attempts).slice(0, 24)}`,
    entity_type: 'ticket_builder_result',
    status: selected ? 'SUCCESS' : 'FAILURE',
    primary_attempt_id: primary.attempt_id,
    selected_attempt_id: selected?.attempt_id ?? null,
    attempts,
  };
}
