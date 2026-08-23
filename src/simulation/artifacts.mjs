import fs from 'node:fs/promises';
import path from 'node:path';

function normalize(value) {
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, normalize(value[key])]));
  }
  return value;
}

export function stableJson(value) {
  return `${JSON.stringify(normalize(value), null, 2)}\n`;
}

function safeExceptionName(name) {
  if (!/^[a-zA-Z0-9._-]+\.json$/.test(name)) {
    throw new Error(`Unsafe exception artifact name ${name}`);
  }
  return name;
}

export async function writeCampaignArtifacts(directory, settings, campaign) {
  const resolved = path.resolve(directory);
  const exceptionsDirectory = path.join(resolved, 'exceptions');
  await fs.mkdir(exceptionsDirectory, { recursive: true });
  const files = new Map([
    ['settings.json', stableJson(settings)],
    ['matches.json', stableJson(campaign.matches)],
    ['summary.json', stableJson(campaign.summary)],
    ['summary.md', campaign.summary_markdown],
  ]);
  for (const [name, contents] of files) await fs.writeFile(path.join(resolved, name), contents, 'utf8');
  for (const [name, contents] of campaign.exceptions) {
    await fs.writeFile(path.join(exceptionsDirectory, safeExceptionName(name)), stableJson(contents), 'utf8');
  }
  return { directory: resolved, file_count: files.size + campaign.exceptions.size };
}

async function readText(filePath) {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

export async function verifyCampaignArtifacts(directory, settings, campaign) {
  const resolved = path.resolve(directory);
  const expected = new Map([
    ['settings.json', stableJson(settings)],
    ['matches.json', stableJson(campaign.matches)],
    ['summary.json', stableJson(campaign.summary)],
    ['summary.md', campaign.summary_markdown],
  ]);
  const errors = [];
  for (const [name, contents] of expected) {
    const actual = await readText(path.join(resolved, name));
    if (actual === null) errors.push(`${name}: missing`);
    else if (actual !== contents) errors.push(`${name}: differs from deterministic recomputation`);
  }

  const exceptionsDirectory = path.join(resolved, 'exceptions');
  let actualExceptionNames = [];
  try {
    actualExceptionNames = (await fs.readdir(exceptionsDirectory)).filter((name) => name.endsWith('.json')).sort();
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  const expectedExceptionNames = [...campaign.exceptions.keys()].map(safeExceptionName).sort();
  if (JSON.stringify(actualExceptionNames) !== JSON.stringify(expectedExceptionNames)) {
    errors.push(`exceptions: expected [${expectedExceptionNames.join(', ')}], found [${actualExceptionNames.join(', ')}]`);
  }
  for (const name of expectedExceptionNames) {
    const actual = await readText(path.join(exceptionsDirectory, name));
    const expectedContents = stableJson(campaign.exceptions.get(name));
    if (actual !== expectedContents) errors.push(`exceptions/${name}: differs from deterministic recomputation`);
  }
  return errors;
}
