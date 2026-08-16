import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const contentDirectory = resolve(repositoryRoot, 'viewer', 'content');

export async function loadViewerContent() {
  const manifest = JSON.parse(await readFile(resolve(contentDirectory, 'manifest.json'), 'utf8'));
  const packs = await Promise.all((manifest.files || []).map(async (file) => {
    const relativePath = file.replace(/^\.\//, '');
    return JSON.parse(await readFile(resolve(contentDirectory, relativePath), 'utf8'));
  }));
  const records = packs.flatMap((pack) => pack.entities || []);
  return { manifest, packs, records };
}

