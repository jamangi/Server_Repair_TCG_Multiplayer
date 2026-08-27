/**
 * Stable play-art resolver.
 *
 * Asset identity is owned by viewer/assets/play/assets.json. UI modules only ask
 * for an asset_id and never derive a filename from a card title or array index.
 */

export const PLAY_ASSET_MANIFEST_VERSION = "play-assets-v2";
export const DEFAULT_PLAY_ASSET_MANIFEST_URL = new URL(
  "../../assets/play/assets.json",
  import.meta.url,
);

const STABLE_ID = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/;
const SAFE_ASSET_PATH = /^(?:[a-z0-9_-]+\/)*[a-z0-9_-]+\.(?:avif|png|svg|webp)$/;
const MANIFEST_KEYS = new Set(["asset_manifest_version", "assets", "profile_icons"]);
const ASSET_KEYS = new Set(["src", "kind", "category", "alt_text"]);
const PROFILE_ICON_KEYS = new Set(["asset_id", "label"]);

const CARD_FAMILIES = Object.freeze({
  test: Object.freeze({
    key: "test",
    label: "Test",
    icon: "⌕",
    placeholderAssetId: "placeholder.card.test",
  }),
  command: Object.freeze({
    key: "command",
    label: "Command",
    icon: ">_",
    placeholderAssetId: "placeholder.card.command",
  }),
  repair_procedure: Object.freeze({
    key: "repair",
    label: "Repair",
    icon: "⌁",
    placeholderAssetId: "placeholder.card.repair",
  }),
  verification: Object.freeze({
    key: "verify",
    label: "Verify",
    icon: "✓",
    placeholderAssetId: "placeholder.card.verify",
  }),
});

const GENERIC_FAMILY = Object.freeze({
  key: "generic",
  label: "Card",
  icon: "◇",
  placeholderAssetId: "placeholder.card.generic",
});

function isRecord(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function hasOnlyKeys(record, allowedKeys) {
  return Object.keys(record).every((key) => allowedKeys.has(key));
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function cleanText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function cloneManifest(manifest) {
  const assets = Object.fromEntries(
    Object.entries(manifest.assets).map(([assetId, asset]) => [
      assetId,
      Object.freeze({ ...asset }),
    ]),
  );
  return Object.freeze({
    asset_manifest_version: manifest.asset_manifest_version,
    assets: Object.freeze(assets),
    profile_icons: Object.freeze(
      manifest.profile_icons.map((icon) => Object.freeze({ ...icon })),
    ),
  });
}

/**
 * Validate the committed manifest before any path is resolved.
 * Returns a frozen copy so callers cannot mutate the resolver's lookup table.
 */
export function validateArtManifest(candidate) {
  if (!isRecord(candidate) || !hasOnlyKeys(candidate, MANIFEST_KEYS)) {
    throw new TypeError("Play asset manifest must be a plain object with known fields.");
  }
  if (candidate.asset_manifest_version !== PLAY_ASSET_MANIFEST_VERSION) {
    throw new TypeError(
      `Unsupported play asset manifest version: ${String(candidate.asset_manifest_version)}`,
    );
  }
  if (!isRecord(candidate.assets)) {
    throw new TypeError("Play asset manifest assets must be an object.");
  }
  if (!Array.isArray(candidate.profile_icons)) {
    throw new TypeError("Play asset manifest profile_icons must be an array.");
  }

  for (const [assetId, asset] of Object.entries(candidate.assets)) {
    if (!STABLE_ID.test(assetId)) {
      throw new TypeError(`Invalid play asset ID: ${assetId}`);
    }
    if (!isRecord(asset) || !hasOnlyKeys(asset, ASSET_KEYS)) {
      throw new TypeError(`Asset ${assetId} has unsupported fields.`);
    }
    if (!SAFE_ASSET_PATH.test(asset.src ?? "")) {
      throw new TypeError(`Asset ${assetId} has an unsafe or unsupported path.`);
    }
    if (!["canonical", "placeholder", "cosmetic", "decorative"].includes(asset.kind)) {
      throw new TypeError(`Asset ${assetId} has an unsupported kind.`);
    }
    if (!isNonEmptyString(asset.category) || typeof asset.alt_text !== "string") {
      throw new TypeError(`Asset ${assetId} needs a category and alt_text string.`);
    }
  }

  const seenProfileIcons = new Set();
  for (const icon of candidate.profile_icons) {
    if (!isRecord(icon) || !hasOnlyKeys(icon, PROFILE_ICON_KEYS)) {
      throw new TypeError("Profile icon records may contain only asset_id and label.");
    }
    if (!STABLE_ID.test(icon.asset_id ?? "") || !isNonEmptyString(icon.label)) {
      throw new TypeError("Profile icon records need a stable asset_id and label.");
    }
    const asset = candidate.assets[icon.asset_id];
    if (!asset || asset.kind !== "cosmetic" || asset.category !== "profile_icon") {
      throw new TypeError(`Profile icon ${icon.asset_id} does not resolve to a cosmetic icon.`);
    }
    if (seenProfileIcons.has(icon.asset_id)) {
      throw new TypeError(`Duplicate profile icon asset ID: ${icon.asset_id}`);
    }
    seenProfileIcons.add(icon.asset_id);
  }

  for (const requiredAssetId of [
    "placeholder.card.test",
    "placeholder.card.command",
    "placeholder.card.repair",
    "placeholder.card.verify",
    "placeholder.card.generic",
    "placeholder.ticket.storage",
    "decorative.home.night_shift_desk",
  ]) {
    if (!candidate.assets[requiredAssetId]) {
      throw new TypeError(`Play asset manifest is missing ${requiredAssetId}.`);
    }
  }

  return cloneManifest(candidate);
}

export async function loadArtManifest({
  manifestUrl = DEFAULT_PLAY_ASSET_MANIFEST_URL,
  fetchImpl = globalThis.fetch,
} = {}) {
  if (typeof fetchImpl !== "function") {
    throw new TypeError("No fetch implementation is available for play assets.");
  }
  const response = await fetchImpl(manifestUrl, { cache: "no-store" });
  if (!response?.ok) {
    throw new Error(`Play asset manifest failed to load (${response?.status ?? "network error"}).`);
  }
  return validateArtManifest(await response.json());
}

export function getCardFamily(cardOrType) {
  const cardType = typeof cardOrType === "string" ? cardOrType : cardOrType?.card_type;
  return CARD_FAMILIES[cardType] ?? GENERIC_FAMILY;
}

function normalizeDomainEntities(domainEntities) {
  if (domainEntities instanceof Map) {
    return new Map(domainEntities);
  }
  if (Array.isArray(domainEntities)) {
    return new Map(
      domainEntities
        .filter((entity) => isRecord(entity) && isNonEmptyString(entity.id))
        .map((entity) => [entity.id, entity]),
    );
  }
  if (isRecord(domainEntities)) {
    return new Map(Object.entries(domainEntities));
  }
  return new Map();
}

function normalizeManifestUrl(manifestUrl) {
  return manifestUrl instanceof URL ? manifestUrl : new URL(String(manifestUrl), import.meta.url);
}

function displayNameOf(subject, fallback = "Technical card") {
  return cleanText(subject?.presentation?.display_name) || cleanText(subject?.id) || fallback;
}

function illustrationOf(subject) {
  const illustration = subject?.presentation?.illustration;
  if (!isRecord(illustration) || !isNonEmptyString(illustration.asset_id)) {
    return null;
  }
  return {
    assetId: illustration.asset_id,
    altText: cleanText(illustration.alt_text),
  };
}
/**
 * Create a synchronous resolver after the manifest and domain snapshot load.
 * The returned results contain presentation data only; no gameplay state.
 */
export function createArtResolver({
  manifest,
  manifestUrl = DEFAULT_PLAY_ASSET_MANIFEST_URL,
  domainEntities = [],
} = {}) {
  const validatedManifest = validateArtManifest(manifest);
  const assets = validatedManifest.assets;
  const baseUrl = normalizeManifestUrl(manifestUrl);
  const entityById = normalizeDomainEntities(domainEntities);

  function assetResult(assetId, { altText = "", decorative = false, source = "manifest" } = {}) {
    const asset = assets[assetId];
    if (!asset) {
      return null;
    }
    const generic = assets[GENERIC_FAMILY.placeholderAssetId];
    return Object.freeze({
      assetId,
      src: new URL(asset.src, baseUrl).href,
      alt: decorative ? "" : cleanText(altText) || cleanText(asset.alt_text),
      decorative,
      category: asset.category,
      kind: asset.kind,
      isPlaceholder: asset.kind === "placeholder",
      source,
      fallback: assetId === GENERIC_FAMILY.placeholderAssetId
        ? null
        : Object.freeze({
            assetId: GENERIC_FAMILY.placeholderAssetId,
            src: new URL(generic.src, baseUrl).href,
            alt: decorative ? "" : cleanText(generic.alt_text),
          }),
    });
  }

  function resolveAssetById(assetId, options = {}) {
    if (!isNonEmptyString(assetId)) {
      return null;
    }
    return assetResult(assetId, options);
  }

  function resolveEntityArt(entityOrId, { decorative = false } = {}) {
    const entity = typeof entityOrId === "string" ? entityById.get(entityOrId) : entityOrId;
    const illustration = illustrationOf(entity);
    if (!illustration) {
      return null;
    }
    return assetResult(illustration.assetId, {
      altText: illustration.altText,
      decorative,
      source: "domain",
    });
  }

  function resolveCardArt(card, { decorative = false } = {}) {
    const family = getCardFamily(card);
    const direct = illustrationOf(card);
    if (direct) {
      const resolved = assetResult(direct.assetId, {
        altText: direct.altText,
        decorative,
        source: "card",
      });
      if (resolved) {
        return resolved;
      }
    }

    const primary = card?.primary_domain_reference;
    if (primary?.inherit_illustration === true && isNonEmptyString(primary.entity_id)) {
      const inherited = resolveEntityArt(primary.entity_id, { decorative });
      if (inherited) {
        return inherited;
      }
    }

    const title = displayNameOf(card);
    return assetResult(family.placeholderAssetId, {
      altText: decorative
        ? ""
        : `${title}: ${assets[family.placeholderAssetId].alt_text}`,
      decorative,
      source: "family-placeholder",
    });
  }

  function resolveTicketArt(ticket, {
    decorative = false,
    visibleSymptomIds = ticket?.visible_symptom_ids ?? [],
  } = {}) {
    const direct = illustrationOf(ticket);
    if (direct) {
      const resolved = assetResult(direct.assetId, {
        altText: direct.altText,
        decorative,
        source: "ticket",
      });
      if (resolved) {
        return resolved;
      }
    }

    const publicSymptomId = Array.isArray(visibleSymptomIds)
      ? visibleSymptomIds.find((id) => isNonEmptyString(id))
      : null;
    if (publicSymptomId) {
      const inherited = resolveEntityArt(publicSymptomId, { decorative });
      if (inherited) {
        return Object.freeze({
          ...inherited,
          source: "public-symptom",
        });
      }
    }

    return assetResult("placeholder.ticket.storage", {
      altText: decorative
        ? ""
        : `${displayNameOf(ticket, "Repair Ticket")}: ${assets["placeholder.ticket.storage"].alt_text}`,
      decorative,
      source: "ticket-placeholder",
    });
  }

  function listProfileIcons() {
    return validatedManifest.profile_icons.map(({ asset_id: assetId, label }) => ({
      assetId,
      label,
      art: assetResult(assetId, { altText: `${label} profile icon.`, source: "profile" }),
    }));
  }

  return Object.freeze({
    manifestVersion: validatedManifest.asset_manifest_version,
    resolveAssetById,
    resolveCardArt,
    resolveEntityArt,
    resolveTicketArt,
    listProfileIcons,
  });
}

/**
 * Apply a resolved asset to an <img>, with a one-step generic fallback. The
 * surrounding art slot remains styled if both files fail, so no broken icon is
 * exposed. This helper intentionally has no gameplay side effects.
 */
export function bindResolvedImage(image, resolution, { eager = false } = {}) {
  if (!image || typeof image.setAttribute !== "function") {
    throw new TypeError("bindResolvedImage requires an image element.");
  }
  if (!resolution?.src) {
    image.removeAttribute("src");
    image.alt = "";
    image.hidden = true;
    image.dataset.artStatus = "missing";
    return () => {};
  }

  image.loading = eager ? "eager" : "lazy";
  image.decoding = "async";
  image.alt = resolution.alt ?? "";
  image.dataset.assetId = resolution.assetId;
  image.dataset.artStatus = "loading";
  image.hidden = false;
  if (resolution.decorative) {
    image.setAttribute("aria-hidden", "true");
  } else {
    image.removeAttribute("aria-hidden");
  }

  let usedFallback = false;
  const handleLoad = () => {
    image.dataset.artStatus = usedFallback ? "fallback" : "ready";
  };
  const handleError = () => {
    if (!usedFallback && resolution.fallback?.src && resolution.fallback.src !== image.src) {
      usedFallback = true;
      image.dataset.assetId = resolution.fallback.assetId;
      image.alt = resolution.decorative ? "" : resolution.fallback.alt;
      image.src = resolution.fallback.src;
      return;
    }
    image.dataset.artStatus = "error";
    image.removeAttribute("src");
    image.alt = "";
    image.hidden = true;
  };
  image.addEventListener("load", handleLoad);
  image.addEventListener("error", handleError);
  image.src = resolution.src;

  return () => {
    image.removeEventListener("load", handleLoad);
    image.removeEventListener("error", handleError);
  };
}
