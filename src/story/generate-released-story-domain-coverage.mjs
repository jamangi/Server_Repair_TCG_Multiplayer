import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  buildReleasedStoryDomainCoverage,
  renderReleasedStoryDomainCoverageMarkdown,
  stableCoverageJson,
} from './released-story-domain-coverage.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const STORY_ROOT = path.join(ROOT, 'content/story-v1/campaigns/quiet-cascade-expansion-v3');
const COVERAGE_ROOT = path.join(ROOT, 'docs/story/coverage');

export const RELEASED_STORY_COVERAGE_OUTPUTS = Object.freeze({
  json: path.join(COVERAGE_ROOT, 'released-story-domain-coverage-v3.json'),
  markdown: path.join(COVERAGE_ROOT, 'RELEASED_STORY_DOMAIN_COVERAGE_V3.md'),
});

const readJson = async (filePath) => JSON.parse(await fs.readFile(filePath, 'utf8'));

export async function loadReleasedStoryCoverageInputs() {
  return {
    manifest: await readJson(path.join(STORY_ROOT, 'manifest.json')),
    releaseMatches: await readJson(path.join(STORY_ROOT, 'matches.json')),
    campaignMatchRegistry: await readJson(path.join(ROOT, 'content/story-v1/campaigns/quiet-cascade-characterization-v2/matches.json')),
    expansionMatchRegistry: await readJson(path.join(ROOT, 'automated_games/task-043-quiet-cascade-expansion-v3/match-registry.json')),
    campaignLedger: await readJson(path.join(COVERAGE_ROOT, 'campaign-one-domain-coverage.json')),
    campaignBuilderProof: await readJson(path.join(ROOT, 'automated_games/task-036-quiet-cascade-characterization-v2/builder-proof.json')),
    campaignSummary: await readJson(path.join(ROOT, 'automated_games/task-036-quiet-cascade-characterization-v2/summary.json')),
    expansionBuilderProof: await readJson(path.join(ROOT, 'automated_games/task-043-quiet-cascade-expansion-v3/builder-proof.json')),
    domain: await readJson(path.join(ROOT, 'content/gameplay-v1/domain-snapshot-v3.json')),
    cards: await readJson(path.join(ROOT, 'content/gameplay-v1/card-catalog-v4.json')),
    decks: await readJson(path.join(ROOT, 'content/gameplay-v1/decks-v4.json')),
    coverage: await readJson(path.join(ROOT, 'content/gameplay-v1/playable-coverage-v4.json')),
  };
}

export async function generateReleasedStoryDomainCoverage({ check = false } = {}) {
  const ledger = buildReleasedStoryDomainCoverage(await loadReleasedStoryCoverageInputs());
  const artifacts = new Map([
    [RELEASED_STORY_COVERAGE_OUTPUTS.json, stableCoverageJson(ledger)],
    [RELEASED_STORY_COVERAGE_OUTPUTS.markdown, renderReleasedStoryDomainCoverageMarkdown(ledger)],
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
    if (stale.length) throw new Error(`STALE_RELEASED_STORY_COVERAGE: regenerate ${stale.join(', ')}`);
  } else {
    await fs.mkdir(COVERAGE_ROOT, { recursive: true });
    await Promise.all([...artifacts].map(([filePath, contents]) => fs.writeFile(filePath, contents, 'utf8')));
  }
  return {
    check,
    files: [...artifacts.keys()].map((filePath) => path.relative(ROOT, filePath).replaceAll('\\', '/')),
    matches: ledger.proof_totals.registry_matches,
    tickets: ledger.proof_totals.solvability_witnessed_tickets,
    engine_successes: ledger.proof_totals.engine_matches_succeeded,
    minimal_diagnostics: ledger.authored_totals.minimal_witness_diagnostics.unique_count,
  };
}

const isEntryPoint = process.argv[1]
  && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isEntryPoint) {
  try {
    console.log(JSON.stringify(await generateReleasedStoryDomainCoverage({ check: process.argv.includes('--check') }), null, 2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
