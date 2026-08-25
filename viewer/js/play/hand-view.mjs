export const HAND_GROUP_PAGE_SIZE = 5;
export const HAND_GROUP_MIN_DESKTOP_WIDTH = 150;

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableValue(value[key])]));
}

function signature(value) {
  return JSON.stringify(stableValue(value));
}

function visibleInstanceState(instance) {
  return Object.fromEntries(Object.entries(instance ?? {})
    .filter(([key]) => !['card_instance_id', 'card_definition_id'].includes(key)));
}

function legalStateFor(instanceId, legalIntents) {
  return legalIntents
    .filter((intent) => intent.card_instance_id === instanceId)
    .map((intent) => Object.fromEntries(Object.entries(intent)
      .filter(([key]) => !['intent_id', 'card_instance_id'].includes(key))))
    .map(signature)
    .sort();
}

export function groupHandInstances(hand = [], legalIntents = []) {
  const groups = [];
  const byPresentationState = new Map();
  for (const instance of hand) {
    const definitionId = instance?.card_definition_id;
    if (!definitionId) continue;
    const stateSignature = signature({
      definitionId,
      visible: visibleInstanceState(instance),
      legal: legalStateFor(instance.card_instance_id, legalIntents),
    });
    let group = byPresentationState.get(stateSignature);
    if (!group) {
      group = { card_definition_id: definitionId, state_signature: stateSignature, instances: [] };
      byPresentationState.set(stateSignature, group);
      groups.push(group);
    }
    group.instances.push(instance);
  }
  return groups;
}

/**
 * Resolve a stack to the first real instance with at least one projected legal
 * intent, preserving authoritative hand order. If none is currently eligible,
 * the first real instance remains the deterministic selection surface.
 */
export function firstEligibleInstance(group, legalIntents = []) {
  const eligibleIds = new Set(legalIntents.map((intent) => intent.card_instance_id).filter(Boolean));
  return group?.instances?.find((instance) => eligibleIds.has(instance.card_instance_id))
    ?? group?.instances?.[0] ?? null;
}

export function handPageSizeForViewport(viewportWidth) {
  return Number(viewportWidth) > 1180 && Number(viewportWidth) < 1700 ? 4 : HAND_GROUP_PAGE_SIZE;
}

export function pageHandGroups(groups = [], requestedPage = 1, pageSize = HAND_GROUP_PAGE_SIZE) {
  const pageCount = Math.max(1, Math.ceil(groups.length / pageSize));
  const page = Math.min(Math.max(1, Number(requestedPage) || 1), pageCount);
  const startIndex = (page - 1) * pageSize;
  return {
    page,
    pageCount,
    start: groups.length ? startIndex + 1 : 0,
    end: Math.min(startIndex + pageSize, groups.length),
    groups: groups.slice(startIndex, startIndex + pageSize),
  };
}
