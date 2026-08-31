import {
  createSystemModelProjectionPayload,
  validateSystemModelProjectionCatalog,
} from './system-model-catalog-validator.mjs';

export const SYSTEM_MODEL_UNAVAILABLE_MESSAGE = 'A detailed system model is not available for this Ticket. Ordinary troubleshooting remains unchanged.';
export const SYSTEM_MODEL_CONTENT_VERSION = 'released-story-system-projections-v1';
export const SYSTEM_MODEL_PROJECTION_VERSION = 'system-model-player-projection-v1';
export const DEFAULT_SYSTEM_MODEL_CONTENT_ROOT = new URL('../../generated/play/content/system-model-story-v1/', import.meta.url);

const catalogPromises = new Map();
let materializedProjectionCaches = new WeakMap();
let validatedCatalogs = new WeakSet();

function unavailable() {
  return { status: 'UNAVAILABLE', message: SYSTEM_MODEL_UNAVAILABLE_MESSAGE };
}

function trustedContentRoot(contentRoot) {
  const root = new URL(contentRoot, import.meta.url);
  const moduleUrl = new URL(import.meta.url);
  if (root.origin !== moduleUrl.origin) {
    throw new Error('System Model content must use the application origin.');
  }
  return root;
}

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
}

function assertCatalog(catalog) {
  if (catalog && typeof catalog === 'object' && validatedCatalogs.has(catalog)) return catalog;
  validateSystemModelProjectionCatalog(catalog, {
    contentVersion: SYSTEM_MODEL_CONTENT_VERSION,
    projectionVersion: SYSTEM_MODEL_PROJECTION_VERSION,
    releaseId: 'system-model-story-v1',
    fallbackMessage: SYSTEM_MODEL_UNAVAILABLE_MESSAGE,
  });
  deepFreeze(catalog);
  validatedCatalogs.add(catalog);
  return catalog;
}

function materialize(catalog, ticketBinding) {
  let cache = materializedProjectionCaches.get(catalog);
  if (!cache) {
    cache = new Map();
    materializedProjectionCaches.set(catalog, cache);
  }
  const cached = cache.get(ticketBinding.projection_cache_key);
  if (cached) return cached;
  const profile = catalog.profile_projections.find((candidate) =>
    candidate.cache_key === ticketBinding.profile_cache_key);
  if (!profile) return null;
  const projection = deepFreeze({
    ...createSystemModelProjectionPayload({ catalog, ticketBinding, profile }),
    cache_key: ticketBinding.projection_cache_key,
    projection_digest: ticketBinding.projection_digest,
  });
  cache.set(ticketBinding.projection_cache_key, projection);
  return projection;
}

export async function loadSystemModelProjectionCatalog({
  fetchImpl = globalThis.fetch,
  contentRoot = DEFAULT_SYSTEM_MODEL_CONTENT_ROOT,
  cache = true,
} = {}) {
  if (typeof fetchImpl !== 'function') throw new TypeError('No fetch implementation is available for System Model content.');
  const root = trustedContentRoot(contentRoot);
  const cacheKey = `${root.href}\u0000${SYSTEM_MODEL_CONTENT_VERSION}\u0000${SYSTEM_MODEL_PROJECTION_VERSION}`;
  const load = async () => {
    const response = await fetchImpl(new URL('public-system-projections-v1.json', root), {
      cache: 'no-cache',
      credentials: 'same-origin',
    });
    if (!response.ok) throw new Error(`System Model content returned ${response.status}.`);
    return assertCatalog(await response.json());
  };
  if (!cache) return load();
  if (!catalogPromises.has(cacheKey)) {
    catalogPromises.set(cacheKey, load().catch((error) => {
      catalogPromises.delete(cacheKey);
      throw error;
    }));
  }
  return catalogPromises.get(cacheKey);
}

export function getTicketSystemProjection(catalog, {
  ticketDefinitionId,
  ticketSnapshotDigest = null,
} = {}) {
  try {
    assertCatalog(catalog);
    if (typeof ticketDefinitionId !== 'string' || ticketDefinitionId.length === 0) return unavailable();
    const binding = catalog.ticket_bindings.find((candidate) => candidate.ticket_id === ticketDefinitionId);
    if (!binding) return unavailable();
    if (ticketSnapshotDigest !== null && ticketSnapshotDigest !== binding.ticket_snapshot_digest) {
      return unavailable();
    }
    const projection = materialize(catalog, binding);
    return projection ? { status: 'AVAILABLE', projection } : unavailable();
  } catch {
    return unavailable();
  }
}

export async function loadTicketSystemProjection({
  ticketDefinitionId,
  ticketSnapshotDigest = null,
  fetchImpl = globalThis.fetch,
  contentRoot = DEFAULT_SYSTEM_MODEL_CONTENT_ROOT,
  cache = true,
} = {}) {
  try {
    const catalog = await loadSystemModelProjectionCatalog({ fetchImpl, contentRoot, cache });
    return getTicketSystemProjection(catalog, { ticketDefinitionId, ticketSnapshotDigest });
  } catch {
    return unavailable();
  }
}

export function clearSystemModelProjectionCache() {
  catalogPromises.clear();
  materializedProjectionCaches = new WeakMap();
  validatedCatalogs = new WeakSet();
}
