import fs from 'node:fs/promises';
import path from 'node:path';

import { writeCampaignArtifacts } from '../simulation/artifacts.mjs';
import { executeCampaign } from '../simulation/campaign.mjs';
import { loadTask014Catalogs, runAutomatedMatch } from '../simulation/simulator.mjs';
import {
  analyzeQuietCascadeGraph,
  createQuietCascadeCampaignSettings,
  proveQuietCascadeBatches,
  renderQuietCascadeGraphReport,
  renderQuietCascadeTranscripts,
  summarizeQuietCascadeRoutes,
  traverseQuietCascadeRoutes,
} from './quiet-cascade-report.mjs';

const ROOT = path.resolve(import.meta.dirname, '../..');
const CAMPAIGN_ROOT = path.join(ROOT, 'content/story-v1/campaigns/quiet-cascade');
const AUTOMATED_ROOT = path.join(ROOT, 'automated_games/task-027-quiet-cascade-v1');
const REPORT_ROOT = path.join(ROOT, 'docs/story/reports');

const readJson = async (filePath) => JSON.parse(await fs.readFile(filePath, 'utf8'));

function normalize(value) {
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, normalize(value[key])]));
  }
  return value;
}

const stableJson = (value) => `${JSON.stringify(normalize(value), null, 2)}\n`;

async function loadBundle() {
  const manifest = await readJson(path.join(CAMPAIGN_ROOT, 'manifest.json'));
  return {
    manifest,
    registry: await readJson(path.join(CAMPAIGN_ROOT, manifest.registry)),
    texts: {
      en: await readJson(path.join(CAMPAIGN_ROOT, manifest.text_catalogs.en)),
    },
    scripts: await Promise.all(manifest.scripts.map((filename) => readJson(path.join(CAMPAIGN_ROOT, filename)))),
  };
}

const [bundle, matchRegistry, baselineSettings, catalogs] = await Promise.all([
  loadBundle(),
  readJson(path.join(CAMPAIGN_ROOT, 'matches.json')),
  readJson(path.join(ROOT, 'automated_games/task-014-playable-coverage-v3/settings.json')),
  loadTask014Catalogs(),
]);

const settings = createQuietCascadeCampaignSettings(matchRegistry, baselineSettings);
const reportsOnly = process.argv.includes('--reports-only');
const campaign = reportsOnly
  ? null
  : await executeCampaign(settings, (input) => runAutomatedMatch(input, catalogs));
const batchProof = proveQuietCascadeBatches(matchRegistry, settings, catalogs);
const graphReport = analyzeQuietCascadeGraph(bundle);
const routes = traverseQuietCascadeRoutes(bundle, matchRegistry);
const routeReport = summarizeQuietCascadeRoutes(routes);

await Promise.all([
  fs.mkdir(AUTOMATED_ROOT, { recursive: true }),
  fs.mkdir(REPORT_ROOT, { recursive: true }),
]);
if (campaign) await writeCampaignArtifacts(AUTOMATED_ROOT, settings, campaign);
await Promise.all([
  fs.writeFile(path.join(AUTOMATED_ROOT, 'builder-proof.json'), stableJson({
    proof_version: 'story-builder-proof-v1',
    campaign_id: matchRegistry.campaign_id,
    all_batches_constructible_and_pinned: batchProof.every((row) => row.exact_pin_match),
    batches: batchProof,
  }), 'utf8'),
  fs.writeFile(path.join(AUTOMATED_ROOT, 'route-matrix.json'), stableJson(routeReport), 'utf8'),
  fs.writeFile(path.join(REPORT_ROOT, 'QUIET_CASCADE_GRAPH_REPORT.json'), stableJson(graphReport), 'utf8'),
  fs.writeFile(path.join(REPORT_ROOT, 'QUIET_CASCADE_GRAPH_REPORT.md'), renderQuietCascadeGraphReport(graphReport), 'utf8'),
  fs.writeFile(path.join(REPORT_ROOT, 'QUIET_CASCADE_ROUTE_TRANSCRIPTS.md'), renderQuietCascadeTranscripts(routes), 'utf8'),
]);

console.log(JSON.stringify({
  automated_matches: campaign?.matches.length ?? 'preserved',
  automated_successes: campaign?.summary.overall.succeeded ?? 'preserved',
  builder_batches_pinned: batchProof.filter((row) => row.exact_pin_match).length,
  route_count: routes.length,
  ending_ids: graphReport.unique_ending_ids,
  graph_issues: graphReport.unreachable_labels.length + graphReport.cycles.length,
}, null, 2));
