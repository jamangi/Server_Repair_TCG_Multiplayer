#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';

import { verifyCampaignArtifacts, writeCampaignArtifacts } from '../src/simulation/artifacts.mjs';
import { executeCampaign } from '../src/simulation/campaign.mjs';
import {
  createTask014CampaignSettings,
  loadTask014Catalogs,
  runAutomatedMatch,
} from '../src/simulation/simulator.mjs';

const usage = 'Usage: node tools/run-task-014-campaign.mjs --write-report|--verify-report <campaign-directory>';

async function execute(settings, catalogs) {
  return executeCampaign(settings, (input) => runAutomatedMatch(input, catalogs));
}

async function writeReport(directory) {
  const catalogs = await loadTask014Catalogs();
  const settings = createTask014CampaignSettings(catalogs);
  const campaign = await execute(settings, catalogs);
  const written = await writeCampaignArtifacts(directory, settings, campaign);
  process.stdout.write(`Wrote ${campaign.matches.length} TASK-014 rows and ${campaign.exceptions.size} exceptions to ${written.directory}.\n`);
}

async function verifyReport(directory) {
  const resolved = path.resolve(directory);
  const settings = JSON.parse(await fs.readFile(path.join(resolved, 'settings.json'), 'utf8'));
  const catalogs = await loadTask014Catalogs();
  const campaign = await execute(settings, catalogs);
  const errors = await verifyCampaignArtifacts(resolved, settings, campaign);
  if (errors.length > 0) {
    errors.forEach((error) => process.stderr.write(`${error}\n`));
    process.exitCode = 1;
    return;
  }
  process.stdout.write(`Verified ${campaign.summary.overall.requested} TASK-014 rows with ${campaign.summary.determinism.mismatches} determinism mismatches.\n`);
}

const [mode, directory, ...extra] = process.argv.slice(2);
if (extra.length > 0 || !directory || !['--write-report', '--verify-report'].includes(mode)) {
  process.stderr.write(`${usage}\n`);
  process.exitCode = 2;
} else if (mode === '--write-report') {
  await writeReport(directory);
} else {
  await verifyReport(directory);
}
