export const STORY_ART_MANIFEST_VERSION = 'story-art-v1';
export const DEFAULT_STORY_ART_MANIFEST_URL = new URL('../../assets/story/manifest.json', import.meta.url);

const POSITIONS = new Set(['LEFT', 'CENTER', 'RIGHT', 'FULL']);
const LAYERS = new Set(['BACKGROUND', 'CHARACTER', 'TRANSIENT']);
const KINDS = new Set(['production', 'fallback']);
const SAFE_ID = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/;
const SAFE_PATH = /^(?:[a-z0-9_-]+\/)*[a-z0-9_-]+\.(?:avif|png|webp)$/;
const TOP_KEYS = ['asset_manifest_version', 'campaign_id', 'assets'];
const ASSET_KEYS = [
  'layer', 'kind', 'sources', 'alt_text', 'decorative', 'fallback_asset_id',
  'focal_point', 'protected_zones',
];

function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function record(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function exactKeys(value, expected) {
  if (!record(value)) return false;
  const keys = Object.keys(value).sort();
  const sorted = [...expected].sort();
  return keys.length === sorted.length && keys.every((key, index) => key === sorted[index]);
}

function safePosition(value) {
  const normalized = clean(value).toUpperCase();
  return POSITIONS.has(normalized) ? normalized.toLowerCase() : 'center';
}

function normalized(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1;
}

export function validateStoryArtManifest(candidate) {
  if (!exactKeys(candidate, TOP_KEYS)
      || candidate.asset_manifest_version !== STORY_ART_MANIFEST_VERSION
      || !SAFE_ID.test(candidate.campaign_id)
      || !record(candidate.assets)) {
    throw new TypeError('Story art manifest is malformed or unsupported.');
  }
  const assets = {};
  for (const [assetId, asset] of Object.entries(candidate.assets)) {
    if (!SAFE_ID.test(assetId) || !exactKeys(asset, ASSET_KEYS)
        || !LAYERS.has(asset.layer) || !KINDS.has(asset.kind)
        || !exactKeys(asset.sources, ['desktop', 'mobile', 'reduced_data'])
        || Object.values(asset.sources).some((path) => !SAFE_PATH.test(path))
        || typeof asset.alt_text !== 'string'
        || typeof asset.decorative !== 'boolean'
        || (asset.fallback_asset_id !== null && !SAFE_ID.test(asset.fallback_asset_id))
        || !exactKeys(asset.focal_point, ['x', 'y'])
        || !normalized(asset.focal_point.x) || !normalized(asset.focal_point.y)
        || !Array.isArray(asset.protected_zones)) {
      throw new TypeError(`Story art record ${assetId} is invalid.`);
    }
    for (const zone of asset.protected_zones) {
      if (!exactKeys(zone, ['x', 'y', 'width', 'height'])
          || !normalized(zone.x) || !normalized(zone.y)
          || !normalized(zone.width) || !normalized(zone.height)
          || zone.x + zone.width > 1 || zone.y + zone.height > 1) {
        throw new TypeError(`Story art record ${assetId} has an invalid protected zone.`);
      }
    }
    assets[assetId] = structuredClone(asset);
  }
  for (const [assetId, asset] of Object.entries(assets)) {
    if (asset.fallback_asset_id) {
      const fallback = assets[asset.fallback_asset_id];
      if (!fallback || fallback.layer !== asset.layer || fallback.kind !== 'fallback') {
        throw new TypeError(`Story art fallback for ${assetId} is missing or crosses layers.`);
      }
    }
  }
  return Object.freeze({
    asset_manifest_version: candidate.asset_manifest_version,
    campaign_id: candidate.campaign_id,
    assets: Object.freeze(Object.fromEntries(Object.entries(assets)
      .map(([assetId, asset]) => [assetId, Object.freeze(asset)]))),
  });
}

export async function loadStoryArtManifest({
  manifestUrl = DEFAULT_STORY_ART_MANIFEST_URL,
  fetchImpl = globalThis.fetch,
} = {}) {
  if (typeof fetchImpl !== 'function') throw new TypeError('Story art manifest requires fetch.');
  const response = await fetchImpl(manifestUrl, { cache: 'no-store' });
  if (!response?.ok) throw new Error(`Story art manifest failed to load (${response?.status ?? 'network error'}).`);
  return validateStoryArtManifest(await response.json());
}

/**
 * Logical Story asset IDs are resolved only through TASK-030's manifest. When
 * that optional presentation layer is unavailable, the established desk art
 * and CSS silhouettes keep every authored statement readable.
 */
export function createStoryArtResolver({
  manifest = null,
  manifestUrl = DEFAULT_STORY_ART_MANIFEST_URL,
  playArtResolver,
  matchMediaImpl = globalThis.matchMedia?.bind(globalThis),
  saveData = globalThis.navigator?.connection?.saveData === true,
} = {}) {
  const validated = manifest ? validateStoryArtManifest(manifest) : null;
  const assets = validated?.assets ?? {};
  const baseUrl = manifestUrl instanceof URL ? manifestUrl : new URL(String(manifestUrl), import.meta.url);
  const fallbackBackground = playArtResolver?.resolveAssetById?.(
    'decorative.home.night_shift_desk',
    { decorative: true, source: 'story-placeholder' },
  ) ?? null;
  const mobile = matchMediaImpl?.('(max-width: 60rem)')?.matches === true;
  const sourceKey = saveData ? 'reduced_data' : mobile ? 'mobile' : 'desktop';
  const layerFallbacks = new Map(Object.entries(assets)
    .filter(([, asset]) => asset.kind === 'fallback')
    .map(([assetId, asset]) => [asset.layer, assetId]));

  function assetResolution(assetId, asset, layer, position, source = 'story-manifest') {
    const selected = asset.sources[sourceKey] || asset.sources.desktop;
    const fallbackId = asset.fallback_asset_id || layerFallbacks.get(asset.layer) || null;
    const fallbackAsset = fallbackId && fallbackId !== assetId ? assets[fallbackId] : null;
    return Object.freeze({
      assetId,
      requestedAssetId: assetId,
      src: new URL(selected, baseUrl).href,
      alt: asset.decorative ? '' : asset.alt_text,
      decorative: asset.decorative,
      isPlaceholder: asset.kind === 'fallback',
      layer,
      position,
      source,
      focalPoint: Object.freeze({ ...asset.focal_point }),
      protectedZones: Object.freeze(asset.protected_zones.map((zone) => Object.freeze({ ...zone }))),
      fallback: fallbackAsset ? Object.freeze({
        assetId: fallbackId,
        src: new URL(fallbackAsset.sources[sourceKey] || fallbackAsset.sources.desktop, baseUrl).href,
        alt: fallbackAsset.decorative ? '' : fallbackAsset.alt_text,
      }) : null,
    });
  }

  function resolve(asset, layer) {
    const assetId = clean(typeof asset === 'string' ? asset : asset?.asset_id);
    const position = safePosition(typeof asset === 'object' ? asset?.position : null);
    const expectedLayer = layer.toUpperCase();
    const direct = assets[assetId];
    if (direct?.layer === expectedLayer) return assetResolution(assetId, direct, layer, position);
    const fallbackId = layerFallbacks.get(expectedLayer);
    const fallback = fallbackId ? assets[fallbackId] : null;
    if (fallback) return assetResolution(fallbackId, fallback, layer, position, 'story-layer-fallback');
    if (layer === 'background' && fallbackBackground) {
      return Object.freeze({
        ...fallbackBackground,
        requestedAssetId: assetId || null,
        layer,
        position: 'full',
        source: 'story-placeholder',
      });
    }
    return Object.freeze({
      assetId: assetId || null,
      requestedAssetId: assetId || null,
      src: null,
      alt: '',
      decorative: true,
      isPlaceholder: true,
      layer,
      position,
      source: 'story-placeholder',
      fallback: null,
    });
  }

  return Object.freeze({
    manifestVersion: validated?.asset_manifest_version ?? null,
    sourceProfile: sourceKey,
    resolveBackground: (asset) => resolve(asset, 'background'),
    resolveCharacter: (asset) => resolve(asset, 'character'),
    resolveTransient: (asset) => resolve(asset, 'transient'),
  });
}
