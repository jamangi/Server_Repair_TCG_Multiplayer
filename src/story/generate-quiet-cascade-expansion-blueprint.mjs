import fs from 'node:fs/promises';
import path from 'node:path';

import {
  buildExpansionBlueprintReport,
  renderBeatSheets,
  renderRouteEndingMatrix,
  sha256,
  stableJson,
} from './quiet-cascade-expansion-blueprint.mjs';

const ROOT = path.resolve(import.meta.dirname, '../..');
const REVISION_ROOT = path.join(ROOT, 'docs/story/revisions/quiet-cascade-expansion-v3');
const BLUEPRINT_PATH = path.join(REVISION_ROOT, 'blueprint.json');
const CHECK = process.argv.includes('--check');

async function readPinned(relativePath) {
  const filePath = path.join(ROOT, relativePath);
  const raw = await fs.readFile(filePath, 'utf8');
  return { raw, value: JSON.parse(raw) };
}

async function emit(filePath, contents) {
  if (CHECK) {
    let current;
    try {
      current = await fs.readFile(filePath, 'utf8');
    } catch {
      throw new Error(`Missing generated output: ${path.relative(ROOT, filePath)}`);
    }
    if (current !== contents) throw new Error(`Generated output is stale: ${path.relative(ROOT, filePath)}`);
    return;
  }
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, contents, 'utf8');
}

const blueprintInput = await readPinned(path.relative(ROOT, BLUEPRINT_PATH));
const blueprint = blueprintInput.value;
const loaded = {};
for (const [key, relativePath] of Object.entries(blueprint.inputs)) loaded[key] = await readPinned(relativePath);

const inputHashes = {
  blueprint: sha256(blueprintInput.raw),
  ...Object.fromEntries(Object.entries(loaded).map(([key, entry]) => [key, sha256(entry.raw)])),
};

const report = buildExpansionBlueprintReport({
  blueprint,
  baseGraph: loaded.base_story_graph.value,
  baseRegistry: loaded.base_story_registry.value,
  caseRegistry: loaded.case_registry.value,
  domainProof: loaded.domain_proof.value,
  matchRegistry: loaded.match_registry.value,
  builderProof: loaded.builder_proof.value,
  planningAudit: loaded.planning_audit.value,
  inputHashes,
});

await Promise.all([
  emit(path.join(REVISION_ROOT, 'GRAPH_REPORT.json'), stableJson(report)),
  emit(path.join(REVISION_ROOT, 'ROUTE_ENDING_MATRIX.md'), renderRouteEndingMatrix(report)),
  emit(path.join(REVISION_ROOT, 'BEAT_SHEETS.md'), renderBeatSheets(report)),
]);

console.log(JSON.stringify({
  check: CHECK,
  episodes: report.totals.episodes,
  matches: report.totals.matches,
  routes: report.totals.routes,
  endings: report.totals.endings,
  graph_digest: sha256(stableJson(report.graph)),
  route_digest: sha256(stableJson(report.routes)),
}, null, 2));
