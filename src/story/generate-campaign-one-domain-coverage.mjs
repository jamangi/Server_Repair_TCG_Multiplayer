import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadTask014Catalogs } from '../simulation/simulator.mjs';
import {
  buildCampaignOneDomainCoverage,
  renderCampaignOneDomainCoverageMarkdown,
  stableCoverageJson,
} from './campaign-one-domain-coverage.mjs';

const ROOT = path.resolve(import.meta.dirname, '../..');
const STORY_ROOT = path.join(ROOT, 'content/story-v1/campaigns/quiet-cascade-characterization-v2');
const COVERAGE_ROOT = path.join(ROOT, 'docs/story/coverage');

export const CAMPAIGN_ONE_COVERAGE_OUTPUTS = Object.freeze({
  json: path.join(COVERAGE_ROOT, 'campaign-one-domain-coverage.json'),
  markdown: path.join(COVERAGE_ROOT, 'CAMPAIGN_ONE_DOMAIN_COVERAGE.md'),
});

const readJson = async (filePath) => JSON.parse(await fs.readFile(filePath, 'utf8'));

export async function loadCampaignOneCoverageInputs() {
  const manifest = await readJson(path.join(STORY_ROOT, 'manifest.json'));
  const coverage = await readJson(path.join(ROOT, 'content/gameplay-v1/playable-coverage-v3.json'));
  const canonicalPacks = await Promise.all(coverage.source_manifest_files.map((relativePath) =>
    readJson(path.join(ROOT, 'viewer/content', relativePath.replace(/^\.\//, '')))));
  const canonicalEntities = canonicalPacks.flatMap((pack) => pack.entities);

  return {
    manifest,
    matchRegistry: await readJson(path.join(STORY_ROOT, 'matches.json')),
    textCatalog: await readJson(path.join(STORY_ROOT, manifest.text_catalogs.en)),
    baselineSettings: await readJson(path.join(ROOT, 'automated_games/task-014-playable-coverage-v3/settings.json')),
    catalogs: await loadTask014Catalogs(),
    coverage,
    canonicalEntities,
    caseStudyRegistry: await readJson(path.join(ROOT, 'docs/case_studies/v0.1/symptom-fault-associations.json')),
  };
}

export async function generateCampaignOneDomainCoverage({ check = false } = {}) {
  const ledger = buildCampaignOneDomainCoverage(await loadCampaignOneCoverageInputs());
  const artifacts = new Map([
    [CAMPAIGN_ONE_COVERAGE_OUTPUTS.json, stableCoverageJson(ledger)],
    [CAMPAIGN_ONE_COVERAGE_OUTPUTS.markdown, renderCampaignOneDomainCoverageMarkdown(ledger)],
  ]);

  if (check) {
    const stale = [];
    for (const [filePath, expected] of artifacts) {
      let actual = null;
      try {
        actual = await fs.readFile(filePath, 'utf8');
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
      if (actual !== expected) stale.push(path.relative(ROOT, filePath).replaceAll('\\', '/'));
    }
    if (stale.length > 0) {
      const error = new Error(`STALE_COVERAGE_OUTPUT: regenerate ${stale.join(', ')}`);
      error.code = 'STALE_COVERAGE_OUTPUT';
      throw error;
    }
  } else {
    await fs.mkdir(COVERAGE_ROOT, { recursive: true });
    await Promise.all([...artifacts].map(([filePath, contents]) => fs.writeFile(filePath, contents, 'utf8')));
  }

  return {
    check,
    files: [...artifacts.keys()].map((filePath) => path.relative(ROOT, filePath).replaceAll('\\', '/')),
    matches: ledger.deterministic_totals.matches,
    tickets: ledger.deterministic_totals.generated_tickets,
    authored_isolation_routes: ledger.deterministic_totals.authored_isolation_routes,
  };
}

const isEntryPoint = process.argv[1]
  && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isEntryPoint) {
  try {
    const summary = await generateCampaignOneDomainCoverage({ check: process.argv.includes('--check') });
    console.log(JSON.stringify(summary, null, 2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
