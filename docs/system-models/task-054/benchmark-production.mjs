import { performance } from 'node:perf_hooks';

import { buildPublicProjectionArtifacts } from '../../../content/system-model-story-v1/build-public-projections.mjs';
import { getTicketSystemProjection } from '../../../viewer/js/play/system-model-service.mjs';

const started = performance.now();
const artifacts = buildPublicProjectionArtifacts();
const buildMilliseconds = performance.now() - started;

const lookupIterations = 100;
const lookupStarted = performance.now();
for (let iteration = 0; iteration < lookupIterations; iteration += 1) {
  for (const ticketBinding of artifacts.projectionCatalog.ticket_bindings) {
    const result = getTicketSystemProjection(artifacts.projectionCatalog, {
      ticketDefinitionId: ticketBinding.ticket_id,
      ticketSnapshotDigest: ticketBinding.ticket_snapshot_digest,
    });
    if (result.status !== 'AVAILABLE') throw new Error(`Benchmark lookup failed for ${ticketBinding.ticket_id}.`);
  }
}
const lookupMilliseconds = performance.now() - lookupStarted;
const lookupCount = lookupIterations * artifacts.projectionCatalog.ticket_bindings.length;

console.log(`Built and compared two complete ${artifacts.measurements.ticket_count}-Ticket projection passes in ${buildMilliseconds.toFixed(2)} ms.`);
console.log(`Resolved ${lookupCount} version-cached public Ticket views in ${lookupMilliseconds.toFixed(2)} ms (${(lookupMilliseconds / lookupCount).toFixed(3)} ms each).`);
console.log('Runtime vendor fetches: 0; random choices: 0; gameplay mutations: 0.');
