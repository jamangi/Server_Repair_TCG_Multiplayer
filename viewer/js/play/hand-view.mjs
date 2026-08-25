export const HAND_GROUP_PAGE_SIZE = 5;

export function groupHandInstances(hand = []) {
  const groups = [];
  const byDefinition = new Map();
  for (const instance of hand) {
    const definitionId = instance?.card_definition_id;
    if (!definitionId) continue;
    let group = byDefinition.get(definitionId);
    if (!group) {
      group = { card_definition_id: definitionId, instances: [] };
      byDefinition.set(definitionId, group);
      groups.push(group);
    }
    group.instances.push(instance);
  }
  return groups;
}

export function instanceForGroup(group, selectedCardInstanceId = null) {
  return group?.instances?.find((instance) => instance.card_instance_id === selectedCardInstanceId)
    ?? group?.instances?.[0]
    ?? null;
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
