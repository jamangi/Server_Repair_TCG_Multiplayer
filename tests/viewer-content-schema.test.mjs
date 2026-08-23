import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

import {
  loadSchemaRegistry,
  validateJsonSchema,
} from './helpers/json-schema-validator.mjs';
import { loadViewerContent } from './helpers/load-viewer-content.mjs';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const registry = loadSchemaRegistry(repositoryRoot);
const schemaByEntityType = new Map(
  registry.schemas.map(({ filePath, schema }) => [path.basename(filePath, '.schema.json'), schema]),
);

const referenceTypes = new Map([
  ['affected_component_ids', ['component']],
  ['symptom_ids', ['symptom']],
  ['effective_test_ids', ['test']],
  ['repair_procedure_ids', ['repair_procedure']],
  ['validation_procedure_ids', ['validation_procedure']],
  ['observable_via_ids', ['test', 'tool', 'command']],
  ['associated_fault_ids', ['fault']],
  ['interfaces', ['protocol']],
  ['tool_requirement_ids', ['tool']],
  ['command_requirement_ids', ['command']],
  ['target_component_ids', ['component']],
  ['applicable_component_type_ids', ['component']],
  ['applicable_fault_ids', ['fault']],
  ['related_test_ids', ['test']],
  ['target_fault_ids', ['fault']],
  ['required_component_ids', ['component']],
  ['required_tool_ids', ['tool']],
  ['required_protocol_ids', ['protocol']],
  ['validates_fault_ids', ['fault']],
  ['related_component_ids', ['component']],
  ['related_fault_ids', ['fault']],
  ['related_procedure_ids', ['repair_procedure', 'validation_procedure']],
  ['cause_fault_id', ['fault']],
  ['effect_fault_id', ['fault']],
  ['fault_id', ['fault']],
]);

test('every viewer record validates against its domain schema', async () => {
  const { packs } = await loadViewerContent();
  const failures = [];

  for (const pack of packs) {
    assert.match(pack.pack_id, /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/);
    assert.equal(typeof pack.name, 'string');
    assert.ok(pack.name.length > 0);
    assert.equal(typeof pack.version, 'string');
    assert.ok(Array.isArray(pack.entities));

    for (const entity of pack.entities) {
      const schema = schemaByEntityType.get(entity.entity_type);
      if (!schema) {
        failures.push(`${pack.pack_id}/${entity.id}: no schema for ${entity.entity_type}`);
        continue;
      }
      const errors = validateJsonSchema(entity, schema, registry);
      failures.push(...errors.map((error) => `${pack.pack_id}/${entity.id} ${error}`));
    }
  }

  assert.deepEqual(failures, []);
});

test('viewer domain references resolve to compatible entity types', async () => {
  const { records } = await loadViewerContent();
  const byId = new Map(records.map((record) => [record.id, record]));
  const failures = [];

  for (const record of records) {
    for (const [field, allowedTypes] of referenceTypes) {
      if (!Object.hasOwn(record, field)) continue;
      const references = Array.isArray(record[field]) ? record[field] : [record[field]];
      for (const reference of references) {
        const target = byId.get(reference);
        if (!target) {
          failures.push(`${record.id}.${field} references missing ${reference}`);
        } else if (!allowedTypes.includes(target.entity_type)) {
          failures.push(
            `${record.id}.${field} references ${reference} (${target.entity_type}); expected ${allowedTypes.join('|')}`,
          );
        }
      }
    }

    for (const rule of record.evidence_rules ?? []) {
      const target = byId.get(rule.fault_id);
      if (!target) failures.push(`${record.id}.evidence_rules references missing ${rule.fault_id}`);
      else if (target.entity_type !== 'fault') {
        failures.push(`${record.id}.evidence_rules references non-Fault ${rule.fault_id}`);
      }
    }
  }

  assert.deepEqual(failures, []);
});

test('viewer causal edges are non-self-referential and acyclic', async () => {
  const { records } = await loadViewerContent();
  const edges = records.filter((record) => record.entity_type === 'fault_causal_edge');
  const adjacency = new Map();

  for (const edge of edges) {
    assert.notEqual(edge.cause_fault_id, edge.effect_fault_id, `${edge.id} is a self-loop`);
    const effects = adjacency.get(edge.cause_fault_id) ?? [];
    effects.push(edge.effect_fault_id);
    adjacency.set(edge.cause_fault_id, effects);
  }

  const visiting = new Set();
  const visited = new Set();
  function visit(faultId, pathIds) {
    if (visiting.has(faultId)) {
      assert.fail(`causal cycle: ${[...pathIds, faultId].join(' -> ')}`);
    }
    if (visited.has(faultId)) return;
    visiting.add(faultId);
    for (const effectId of adjacency.get(faultId) ?? []) visit(effectId, [...pathIds, faultId]);
    visiting.delete(faultId);
    visited.add(faultId);
  }

  for (const faultId of adjacency.keys()) visit(faultId, []);
});
