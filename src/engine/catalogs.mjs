export function cardMap(catalogs) {
  const source = catalogs?.cards?.cards ?? catalogs?.cards ?? catalogs?.card_catalog?.cards ?? [];
  if (Array.isArray(source)) return new Map(source.map((card) => [card.id, card]));
  return new Map(Object.entries(source));
}

export function cardCatalogVersion(catalogs) {
  return catalogs?.cards?.card_catalog_version
    ?? catalogs?.card_catalog?.card_catalog_version
    ?? catalogs?.card_catalog_version
    ?? null;
}

export function cardActionType(card) {
  return card?.play_contract?.action_type ?? null;
}

export function cardContractType(card) {
  return card?.play_contract?.contract_type ?? null;
}

export function cardSourceDefinitionId(card) {
  const contract = card?.play_contract;
  if (!contract) return null;
  if (contract.contract_type === 'DIAGNOSTIC') return contract.source_definition_id;
  if (contract.contract_type === 'REPAIR') return contract.repair_procedure_id;
  if (contract.contract_type === 'VERIFY') return contract.validation_procedure_id;
  return null;
}

export function cardName(card) {
  return card?.presentation?.display_name ?? card?.id ?? 'Unknown card';
}

export function cardCost(card) {
  return card?.cost;
}
