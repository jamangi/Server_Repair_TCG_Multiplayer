export const ENTITY_TYPE_LABELS = Object.freeze({
  fault: 'Faults',
  symptom: 'Symptoms',
  component: 'Components',
  test: 'Tests',
  tool: 'Tools',
  command: 'Commands',
  repair_procedure: 'Repairs',
});

export const ENTITY_TYPE_ORDER = Object.freeze([
  ...Object.keys(ENTITY_TYPE_LABELS),
  'everything',
]);

export function categoryFor(record) {
  return record.category
    || record.subsystem
    || record.test_type
    || record.tool_type
    || record.platform
    || '';
}

