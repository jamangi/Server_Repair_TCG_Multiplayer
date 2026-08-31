import fs from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';

import {
  createResolverRequest,
  resolvePublicSystemModel,
} from '../../../src/system-models/resolver.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../..');
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'));
const catalog = readJson('content/system-model-pilot-v1/system-model-catalog-v1.json');
const bindingCatalog = readJson('content/system-model-pilot-v1/ticket-system-bindings-v1.json');
const requests = bindingCatalog.bindings.map(createResolverRequest);
const rounds = 50;

for (const request of requests) resolvePublicSystemModel({ request, catalog, bindingCatalog });
const started = performance.now();
let resolved = 0;
for (let round = 0; round < rounds; round += 1) {
  for (const request of requests) {
    const result = resolvePublicSystemModel({ request, catalog, bindingCatalog });
    if (result.status !== 'RESOLVED') throw new Error(`Benchmark resolution failed: ${result.reason_code}`);
    resolved += 1;
  }
}
const elapsedMs = performance.now() - started;
const perResolutionMs = elapsedMs / resolved;
console.log(`Resolved ${resolved} pilot requests in ${elapsedMs.toFixed(2)} ms (${perResolutionMs.toFixed(3)} ms/resolution); network requests: 0; random choices: 0.`);
if (elapsedMs > 10_000) {
  console.error('TASK-052 bounded pilot benchmark exceeded 10 seconds.');
  process.exitCode = 1;
}
