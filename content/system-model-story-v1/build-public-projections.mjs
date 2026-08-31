import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

import { canonicalJson, sha256 } from '../../src/builder/canonical.mjs';
import {
  buildProductionProjectionCatalog,
  materializePlayerSystemProjection,
} from '../../src/system-models/production.mjs';
import {
  createResolverRequest,
  resolvePublicSystemModel,
  validateAuthoringCompatibility,
} from '../../src/system-models/resolver.mjs';

const scriptPath = fileURLToPath(import.meta.url);
const releaseRoot = path.dirname(scriptPath);
const repositoryRoot = path.resolve(releaseRoot, '..', '..');
const outputPath = path.join(releaseRoot, 'public-system-projections-v1.json');
const reportPath = path.join(repositoryRoot, 'docs', 'system-models', 'task-054', 'production-build-report-v1.json');

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(repositoryRoot, relativePath), 'utf8'));
}

function sourceLedgerPath(catalog) {
  const relativePath = catalog?.source_manifest?.source_ledger_path;
  if (typeof relativePath !== 'string' || relativePath.length === 0) {
    throw new Error('System Model catalog does not pin a source ledger path.');
  }
  const resolved = path.resolve(repositoryRoot, relativePath);
  const repositoryPrefix = `${repositoryRoot}${path.sep}`;
  if (!resolved.startsWith(repositoryPrefix)) throw new Error('System Model source ledger escaped the repository.');
  return resolved;
}

export function buildPublicProjectionArtifacts() {
  const catalog = readJson('content/system-model-story-v1/system-model-catalog-v2.json');
  const bindingCatalog = readJson('content/system-model-story-v1/ticket-system-bindings-v2.json');
  const privateCatalog = readJson('content/system-model-story-v1/private-compatibility-v2.json');
  const sourceLedger = JSON.parse(fs.readFileSync(sourceLedgerPath(catalog), 'utf8'));
  const traceByTicket = new Map();
  const compatibilityByTicket = new Map();
  let captureReport = true;
  const resolveBinding = (binding) => {
    const resolution = resolvePublicSystemModel({
      request: createResolverRequest(binding),
      catalog,
      bindingCatalog,
    });
    if (captureReport) traceByTicket.set(binding.ticket_id, {
      status: resolution.status,
      reason_code: resolution.reason_code,
      steps: resolution.validation_trace.map(({ step, code, status }) => ({ step, code, status })),
    });
    return resolution;
  };
  const validateCompatibility = (resolution, proof) => {
    const validation = validateAuthoringCompatibility({ resolution, compatibilityProof: proof });
    if (captureReport) compatibilityByTicket.set(resolution.ticket_id, {
      status: validation.status,
      reason_code: validation.reason_code,
      coverage: validation.coverage,
    });
    return validation;
  };
  const projectionCatalog = buildProductionProjectionCatalog({
    catalog,
    bindingCatalog,
    privateCatalog,
    sourceLedger,
    resolveBinding,
    validateCompatibility,
  });
  if (projectionCatalog.ticket_bindings.length !== 18) {
    throw new Error(`Expected 18 released Story Ticket projections, received ${projectionCatalog.ticket_bindings.length}.`);
  }
  captureReport = false;
  const repeated = buildProductionProjectionCatalog({
    catalog,
    bindingCatalog,
    privateCatalog,
    sourceLedger,
    resolveBinding,
    validateCompatibility,
  });
  const source = `${JSON.stringify(projectionCatalog, null, 2)}\n`;
  if (JSON.stringify(repeated) !== JSON.stringify(projectionCatalog)) {
    throw new Error('Released Story System projections were not deterministic across two builds.');
  }
  if (/\bfingerprint\./iu.test(source)) {
    throw new Error('Public System projection catalog exposed a private fingerprint identifier.');
  }
  for (const binding of bindingCatalog.bindings) {
    if (source.includes(binding.ticket_focus_statement)) {
      throw new Error(`Public System projection catalog exposed Ticket focus copy for ${binding.ticket_id}.`);
    }
  }
  const materialized = projectionCatalog.ticket_bindings.map((ticketBinding) =>
    materializePlayerSystemProjection({ catalog: projectionCatalog, ticketBinding }));
  const naiveBytes = Buffer.byteLength(JSON.stringify(materialized));
  const bytes = Buffer.byteLength(source);
  const measurements = {
    ticket_count: projectionCatalog.ticket_bindings.length,
    profile_count: projectionCatalog.profile_projections.length,
    raw_bytes: bytes,
    gzip_bytes: gzipSync(source, { level: 9 }).byteLength,
    naive_repeated_bytes: naiveBytes,
    deduplicated_bytes_saved: naiveBytes - bytes,
  };
  const firstBinding = bindingCatalog.bindings[0];
  const missingBinding = resolvePublicSystemModel({
    request: createResolverRequest(firstBinding, { ticket_id: 'ticket.generated.system-model-unavailable' }),
    catalog,
    bindingCatalog,
  });
  const missingProfile = resolvePublicSystemModel({
    request: createResolverRequest(firstBinding, { profile_id: 'profile.system-model.unavailable.v1' }),
    catalog,
    bindingCatalog,
  });
  const reportValue = {
    schema_version: 'system-model-production-build-report-v1',
    source_release_id: catalog.release_id,
    public_content_version: projectionCatalog.content_version,
    projection_version: projectionCatalog.projection_version,
    totals: {
      tickets_resolved: projectionCatalog.ticket_bindings.length,
      profile_cores: projectionCatalog.profile_projections.length,
      compatibility_proofs_passed: [...compatibilityByTicket.values()].filter((entry) => entry.status === 'PASS').length,
      deterministic_builds_compared: 2,
      fallback_cases_checked: 2,
    },
    measurements,
    ticket_results: projectionCatalog.ticket_bindings.map((binding) => ({
      ticket_id: binding.ticket_id,
      ticket_snapshot_digest: binding.ticket_snapshot_digest,
      profile_id: binding.profile_id,
      profile_revision: binding.profile_revision,
      projection_digest: binding.projection_digest,
      resolution: traceByTicket.get(binding.ticket_id),
      authoring_compatibility: compatibilityByTicket.get(binding.ticket_id),
    })),
    fallback_results: [missingBinding, missingProfile].map((result) => ({
      status: result.status,
      reason_code: result.reason_code,
      public_message: result.fallback.public_message,
      fabricated_projection: result.public_projection !== null,
      gameplay_effect: result.gameplay_effect,
    })),
  };
  const report = {
    ...reportValue,
    serialization: {
      canonicalization_version: 'canonical-json-v1',
      digest_algorithm: 'sha256',
      content_digest: sha256(canonicalJson(reportValue)),
    },
  };
  return {
    projectionCatalog,
    source,
    report,
    reportSource: `${JSON.stringify(report, null, 2)}\n`,
    measurements,
  };
}

export function writeOrCheckPublicProjectionArtifacts({ check = false } = {}) {
  const artifacts = buildPublicProjectionArtifacts();
  if (check) {
    if (!fs.existsSync(outputPath)) throw new Error('Public System projection catalog is missing.');
    const actual = fs.readFileSync(outputPath, 'utf8');
    if (actual !== artifacts.source) throw new Error('Public System projection catalog is stale.');
    if (!fs.existsSync(reportPath)) throw new Error('System projection production report is missing.');
    const actualReport = fs.readFileSync(reportPath, 'utf8');
    if (actualReport !== artifacts.reportSource) throw new Error('System projection production report is stale.');
  } else {
    fs.writeFileSync(outputPath, artifacts.source, 'utf8');
    fs.writeFileSync(reportPath, artifacts.reportSource, 'utf8');
  }
  return artifacts;
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  try {
    const { measurements } = writeOrCheckPublicProjectionArtifacts({ check: process.argv.includes('--check') });
    console.log(`${process.argv.includes('--check') ? 'Verified' : 'Built'} ${measurements.ticket_count} Ticket projections from ${measurements.profile_count} shared profile core(s).`);
    console.log(`Public bundle: ${measurements.raw_bytes} raw bytes; ${measurements.gzip_bytes} gzip bytes; ${measurements.deduplicated_bytes_saved} bytes avoided versus repeated projections.`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
