import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const REPOSITORY_ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const LOG_PATH = path.join(REPOSITORY_ROOT, 'art_sources', 'task-011', 'generation-log.json');
const readJson = async (filename) => JSON.parse(await readFile(filename, 'utf8'));

function parseArguments(argv) {
  const argumentsMap = new Map();
  for (let index = 0; index < argv.length; index += 2) {
    argumentsMap.set(argv[index], argv[index + 1]);
  }
  return argumentsMap;
}

export async function setTask011Review({ ids, state, note }) {
  if (!['approved', 'rework'].includes(state)) throw new Error(`Unsupported review state: ${state}`);
  const log = await readJson(LOG_PATH);
  for (const id of ids) {
    const subject = log.subjects[id];
    if (!subject) throw new Error(`Cannot review missing generated subject: ${id}`);
    subject.review_state = state;
    subject.review_notes = note ? [note] : [];
  }
  await writeFile(LOG_PATH, `${JSON.stringify(log, null, 2)}\n`, 'utf8');
  return ids.length;
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  const args = parseArguments(process.argv.slice(2));
  const ids = (args.get('--ids') ?? '').split(',').map((id) => id.trim()).filter(Boolean);
  if (!ids.length) throw new Error('Pass one or more comma-separated --ids.');
  const count = await setTask011Review({
    ids,
    state: args.get('--state') ?? '',
    note: args.get('--note') ?? '',
  });
  console.log(`Recorded ${args.get('--state')} review for ${count} TASK-011 subject(s).`);
}
