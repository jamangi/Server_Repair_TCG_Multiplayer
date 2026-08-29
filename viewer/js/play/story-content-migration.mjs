export const QUIET_CASCADE_V1_CONTENT_VERSION = 'quiet-cascade-content-v1';
export const QUIET_CASCADE_CHARACTERIZATION_CONTENT_VERSION = 'quiet-cascade-characterization-v2';
export const QUIET_CASCADE_EXPANSION_CONTENT_VERSION = 'quiet-cascade-expansion-v3';
export const QUIET_CASCADE_PACK_ID = 'story.campaign.quiet_cascade.v1';

const clone = (value) => value === undefined ? undefined : structuredClone(value);

function checkpointForVersion(checkpoint, contentVersion, runtime, variables = null) {
  if (checkpoint === null) return null;
  const { digest: _oldDigest, ...body } = checkpoint;
  const migratedBody = {
    ...clone(body),
    content_version: contentVersion,
    ...(variables ? { variables: clone(variables) } : {}),
  };
  return { ...migratedBody, digest: runtime.storyDigest(migratedBody) };
}

function predecessorBundle(predecessorBundles, contentVersion) {
  return predecessorBundles?.get?.(contentVersion)
    ?? predecessorBundles?.[contentVersion]
    ?? null;
}

function authoredEndingAtCheckpoint(bundle, checkpointId) {
  if (checkpointId === null) return null;
  return bundle.scripts
    .flatMap((script) => script.statements)
    .find((statement) => statement.type === 'end'
      && statement.checkpoint_id === checkpointId)?.ending_id ?? null;
}

function validateSourceRecord(candidate, sourceBundle, runtime) {
  if (candidate.checkpoint !== null) runtime.restoreStoryCheckpoint(candidate.checkpoint, sourceBundle);
  const authoredEnding = candidate.checkpoint === null
    ? null
    : authoredEndingAtCheckpoint(sourceBundle, candidate.checkpoint.checkpoint_id);
  if (candidate.completed_ending_id !== authoredEnding) {
    throw new Error('Story completion marker does not match its predecessor content checkpoint.');
  }
}

function targetVariables(sourceVariables, bundle) {
  const migrated = clone(sourceVariables);
  for (const descriptor of bundle.registry.variables) {
    if (!Object.hasOwn(migrated, descriptor.variable_id)) {
      migrated[descriptor.variable_id] = clone(descriptor.default);
    }
  }
  return migrated;
}

/**
 * Migrate only the reviewed Quiet Cascade v1 -> v2 -> expansion-v3 chain.
 * Every predecessor checkpoint is restored against its original complete pack
 * before stable values are carried forward and the target digest is computed.
 */
export function migrateStoryProgress(candidate, { bundle, runtime, predecessorBundles = null }) {
  if (candidate?.pack_id !== QUIET_CASCADE_PACK_ID
      || bundle?.manifest?.pack_id !== QUIET_CASCADE_PACK_ID
      || candidate.content_version === bundle.manifest.content_version) {
    return { value: clone(candidate), migrated_from: null };
  }

  const targetVersion = bundle.manifest.content_version;
  if (targetVersion === QUIET_CASCADE_CHARACTERIZATION_CONTENT_VERSION
      && candidate.content_version === QUIET_CASCADE_V1_CONTENT_VERSION) {
    const sourceBundle = clone(bundle);
    sourceBundle.manifest.content_version = QUIET_CASCADE_V1_CONTENT_VERSION;
    validateSourceRecord(candidate, sourceBundle, runtime);
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

  if (targetVersion !== QUIET_CASCADE_EXPANSION_CONTENT_VERSION
      || ![
        QUIET_CASCADE_V1_CONTENT_VERSION,
        QUIET_CASCADE_CHARACTERIZATION_CONTENT_VERSION,
      ].includes(candidate.content_version)) {
    return { value: clone(candidate), migrated_from: null };
  }

  const originalVersion = candidate.content_version;
  let working = clone(candidate);

  if (working.content_version === QUIET_CASCADE_V1_CONTENT_VERSION) {
    const v1Bundle = predecessorBundle(predecessorBundles, QUIET_CASCADE_V1_CONTENT_VERSION);
    const v2Bundle = predecessorBundle(
      predecessorBundles,
      QUIET_CASCADE_CHARACTERIZATION_CONTENT_VERSION,
    );
    if (!v1Bundle || !v2Bundle) {
      throw new Error('Quiet Cascade v1-to-v3 migration content is unavailable.');
    }
    validateSourceRecord(working, v1Bundle, runtime);
    working = {
      ...working,
      content_version: QUIET_CASCADE_CHARACTERIZATION_CONTENT_VERSION,
      checkpoint: checkpointForVersion(
        working.checkpoint,
        QUIET_CASCADE_CHARACTERIZATION_CONTENT_VERSION,
        runtime,
      ),
    };
    validateSourceRecord(working, v2Bundle, runtime);
  } else {
    const v2Bundle = predecessorBundle(
      predecessorBundles,
      QUIET_CASCADE_CHARACTERIZATION_CONTENT_VERSION,
    );
    if (!v2Bundle) throw new Error('Quiet Cascade v2-to-v3 migration content is unavailable.');
    validateSourceRecord(working, v2Bundle, runtime);
  }

  return {
    value: {
      ...working,
      content_version: QUIET_CASCADE_EXPANSION_CONTENT_VERSION,
      checkpoint: checkpointForVersion(
        working.checkpoint,
        QUIET_CASCADE_EXPANSION_CONTENT_VERSION,
        runtime,
        working.checkpoint ? targetVariables(working.checkpoint.variables, bundle) : null,
      ),
      // The predecessor ending remains derivable from its preserved points,
      // choices, branch history, and six accepted Match results. It is no
      // longer terminal once the reviewed expansion is installed.
      completed_ending_id: null,
    },
    migrated_from: originalVersion,
  };
}
