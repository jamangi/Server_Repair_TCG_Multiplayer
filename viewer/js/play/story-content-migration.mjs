export const QUIET_CASCADE_V1_CONTENT_VERSION = 'quiet-cascade-content-v1';
export const QUIET_CASCADE_CHARACTERIZATION_CONTENT_VERSION = 'quiet-cascade-characterization-v2';
export const QUIET_CASCADE_PACK_ID = 'story.campaign.quiet_cascade.v1';

const clone = (value) => value === undefined ? undefined : structuredClone(value);

function checkpointForVersion(checkpoint, contentVersion, runtime) {
  if (checkpoint === null) return null;
  const { digest: _oldDigest, ...body } = checkpoint;
  const migratedBody = { ...clone(body), content_version: contentVersion };
  return { ...migratedBody, digest: runtime.storyDigest(migratedBody) };
}

/**
 * Migrate only the reviewed Quiet Cascade v1 -> characterization-v2 boundary.
 * The durable checkpoint is first restored against a v1 manifest, which proves
 * its original digest and stable authored IDs. The version is then changed and
 * the digest recomputed before the normal current-version validator runs.
 */
export function migrateStoryProgress(candidate, { bundle, runtime }) {
  if (candidate?.pack_id !== QUIET_CASCADE_PACK_ID
      || bundle?.manifest?.pack_id !== QUIET_CASCADE_PACK_ID
      || bundle.manifest.content_version !== QUIET_CASCADE_CHARACTERIZATION_CONTENT_VERSION
      || candidate.content_version === bundle.manifest.content_version) {
    return { value: clone(candidate), migrated_from: null };
  }
  if (candidate.content_version !== QUIET_CASCADE_V1_CONTENT_VERSION) {
    return { value: clone(candidate), migrated_from: null };
  }

  if (candidate.checkpoint !== null) {
    const sourceBundle = clone(bundle);
    sourceBundle.manifest.content_version = QUIET_CASCADE_V1_CONTENT_VERSION;
    runtime.restoreStoryCheckpoint(candidate.checkpoint, sourceBundle);
  }

  return {
    value: {
      ...clone(candidate),
      content_version: QUIET_CASCADE_CHARACTERIZATION_CONTENT_VERSION,
      checkpoint: checkpointForVersion(
        candidate.checkpoint,
        QUIET_CASCADE_CHARACTERIZATION_CONTENT_VERSION,
        runtime,
      ),
    },
    migrated_from: QUIET_CASCADE_V1_CONTENT_VERSION,
  };
}
