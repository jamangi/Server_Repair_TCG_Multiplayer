#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';

import {
  verifyCampaignArtifacts,
  writeCampaignArtifacts,
} from '../src/simulation/artifacts.mjs';
import { executeCampaign } from '../src/simulation/campaign.mjs';
import {
  createFoundationCampaignSettings,
  loadFoundationCatalogs,
  runAutomatedMatch,
} from '../src/simulation/simulator.mjs';

function usage() {
  return [
    'Usage:',
    '  node tools/run-automated-games.mjs --write-report <campaign-directory>',
    '  node tools/run-automated-games.mjs --verify-report <campaign-directory>',
  ].join('\n');
}

async function runCampaign(settings, catalogs) {
  return executeCampaign(settings, (input) => runAutomatedMatch(input, catalogs));
}

async function writeReport(directory) {
  const catalogs = await loadFoundationCatalogs();
  const settings = createFoundationCampaignSettings(catalogs.cards.cards.map((card) => card.id));
  const campaign = await runCampaign(settings, catalogs);
  const written = await writeCampaignArtifacts(directory, settings, campaign);
  process.stdout.write(
    `Wrote ${campaign.matches.length} deterministic match rows and ${campaign.exceptions.size} exception artifacts to ${written.directory}.\n`,
  );
}

async function verifyReport(directory) {
  const resolved = path.resolve(directory);
  const settings = JSON.parse(await fs.readFile(path.join(resolved, 'settings.json'), 'utf8'));
  const catalogs = await loadFoundationCatalogs();
  const campaign = await runCampaign(settings, catalogs);
  const errors = await verifyCampaignArtifacts(resolved, settings, campaign);
  if (errors.length > 0) {
    for (const error of errors) process.stderr.write(`${error}\n`);
    process.exitCode = 1;
    return;
  }
  const counts = campaign.summary.overall;
  process.stdout.write(
    `Verified ${counts.requested} rows (${counts.succeeded} successful, ${counts.failed} retained exceptions); deterministic mismatches: ${campaign.summary.determinism.mismatches}.\n`,
  );
}

const [mode, directory, ...extra] = process.argv.slice(2);
if (extra.length > 0 || !directory || !['--write-report', '--verify-report'].includes(mode)) {
  process.stderr.write(`${usage()}\n`);
  process.exitCode = 2;
} else if (mode === '--write-report') {
  await writeReport(directory);
} else {
  await verifyReport(directory);
}
