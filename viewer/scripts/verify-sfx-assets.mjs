import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { GENERATED_SFX_MODULE, expectedSfxModule } from './build-sfx-assets.mjs';

export async function verifySfxAssets() {
  const [actual, expected] = await Promise.all([
    readFile(GENERATED_SFX_MODULE, 'utf8'),
    expectedSfxModule(),
  ]);
  if (actual !== expected) throw new Error('Generated SFX runtime catalog is stale. Run node viewer/scripts/build-sfx-assets.mjs.');
  if (/https?:\/\//i.test(actual) || /\.(?:mp3|wav|ogg|aac|flac)\b/i.test(actual)) {
    throw new Error('Generated SFX runtime catalog contains a network or binary-audio reference.');
  }
  return actual.length;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const bytes = await verifySfxAssets();
    console.log(`Verified deterministic SFX runtime catalog (${bytes} characters).`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
