import {
  ClientDataError,
  STORAGE_KEY,
  MAX_IMPORT_BYTES,
  applyMatchResult as applyStatisticsResult,
  assertValidLocalState,
  createDeckDraft as createPureDeckDraft,
  createDefaultState,
  createExportBundle,
  createImportPreview,
  deleteDeck as deletePureDeck,
  localStateFromExport,
  migrateLocalState,
  parseImportBundle,
  recordMatchStart as recordStatisticsMatchStart,
  recordTutorialCompletion as recordPureTutorialCompletion,
  saveDeck as savePureDeck,
  setActiveDeck as setPureActiveDeck,
  stableStringify,
  validateProfile,
  validateSettings,
  validateStoryProgress,
  byteLength,
} from './data/client-data.mjs';

function clone(value) {
  return JSON.parse(stableStringify(value));
}

function timestampFrom(now) {
  const value = now();
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) throw new ClientDataError('INVALID_TIMESTAMP', 'The storage clock returned an invalid time.');
  return date.toISOString();
}

function storageFailure(error, action) {
  const quota = error?.name === 'QuotaExceededError'
    || error?.name === 'NS_ERROR_DOM_QUOTA_REACHED'
    || error?.code === 22
    || error?.code === 1014;
  return new ClientDataError(
    quota ? 'STORAGE_QUOTA_EXCEEDED' : 'STORAGE_UNAVAILABLE',
    quota
      ? `Local storage is full; ${action} preserved the previous data.`
      : `Local storage is unavailable; ${action} could not be persisted.`,
  );
}

function resolveDefaultStorage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function createStorageService(options) {
  if (!options?.context) throw new ClientDataError('MISSING_CONTENT_CONTEXT', 'Storage service requires a client-data context.');
  const context = options.context;
  const key = options.key ?? STORAGE_KEY;
  const now = options.now ?? (() => new Date());
  const idFactory = options.idFactory;
  const storage = Object.hasOwn(options, 'storage') ? options.storage : resolveDefaultStorage();
  let storageDisabled = storage === null;
  let memoryState = createDefaultState(context);
  let lastDiagnostic = storageDisabled
    ? { code: 'STORAGE_UNAVAILABLE', message: 'Local storage is unavailable; this session is using memory only.' }
    : null;
  let recoveryRequired = false;
  let storyImportValidator = options.storyImportValidator ?? null;
  if (storyImportValidator !== null && typeof storyImportValidator !== 'function') {
    throw new ClientDataError('INVALID_STORY_VALIDATOR', 'Story import validator must be a function.');
  }

  function validateImportedStory(progress) {
    if (!storyImportValidator) return;
    try {
      storyImportValidator(clone(progress));
    } catch (error) {
      throw new ClientDataError(
        'INVALID_IMPORT',
        'Imported Story progress is incompatible with the installed campaign content.',
        [{
          path: '$.records.story',
          code: 'STORY_CONTENT_MISMATCH',
          message: error instanceof Error ? error.message : 'Story progress failed campaign validation.',
        }],
      );
    }
  }

  function snapshot() {
    return {
      state: clone(memoryState),
      persistence: storageDisabled ? 'MEMORY' : 'LOCAL_STORAGE',
      diagnostic: lastDiagnostic === null ? null : { ...lastDiagnostic },
      recovery_required: recoveryRequired,
    };
  }

  function write(candidate, { allowRecovery = false } = {}) {
    if (recoveryRequired && !allowRecovery) {
      throw new ClientDataError('RECOVERY_REQUIRED', 'Reset or confirmed import is required before overwriting corrupt local data.');
    }
    const valid = assertValidLocalState(candidate, context);
    const serialized = stableStringify(valid);
    if (byteLength(serialized) > MAX_IMPORT_BYTES) {
      throw new ClientDataError('OVERSIZED_DATA', `Local data exceeds ${MAX_IMPORT_BYTES} bytes.`);
    }
    if (!storageDisabled) {
      try {
        storage.setItem(key, serialized);
      } catch (error) {
        throw storageFailure(error, 'the write');
      }
    }
    memoryState = valid;
    recoveryRequired = false;
    lastDiagnostic = storageDisabled
      ? { code: 'STORAGE_UNAVAILABLE', message: 'Changes are available only for this memory-backed session.' }
      : null;
    return snapshot();
  }

  function load() {
    if (storageDisabled) return snapshot();
    let raw;
    try {
      raw = storage.getItem(key);
    } catch (error) {
      storageDisabled = true;
      lastDiagnostic = { code: 'STORAGE_UNAVAILABLE', message: storageFailure(error, 'the read').message };
      return snapshot();
    }
    if (raw === null) {
      try {
        return write(createDefaultState(context));
      } catch (error) {
        if (!(error instanceof ClientDataError)) throw error;
        lastDiagnostic = { code: error.code, message: error.message };
        return snapshot();
      }
    }
    if (byteLength(raw) > MAX_IMPORT_BYTES) {
      recoveryRequired = true;
      lastDiagnostic = { code: 'OVERSIZED_DATA', message: 'Stored local data is oversized and was not loaded.' };
      return snapshot();
    }
    try {
      const parsed = JSON.parse(raw);
      memoryState = migrateLocalState(parsed, context);
      recoveryRequired = false;
      lastDiagnostic = null;
    } catch (error) {
      recoveryRequired = true;
      lastDiagnostic = {
        code: error instanceof ClientDataError ? error.code : 'CORRUPT_DATA',
        message: error instanceof ClientDataError ? error.message : 'Stored local data is corrupt and was not loaded.',
      };
    }
    return snapshot();
  }

  function update(mutator) {
    const current = load();
    if (current.recovery_required) {
      throw new ClientDataError('RECOVERY_REQUIRED', 'Reset or confirmed import is required before changing corrupt local data.');
    }
    const candidate = clone(current.state);
    const replacement = mutator(candidate) ?? candidate;
    return write(replacement);
  }

  function exportBackup() {
    const current = load();
    const bundle = createExportBundle(current.state, context, timestampFrom(now));
    return {
      filename: `server-repair-solo-backup-${bundle.exported_at.slice(0, 10)}.json`,
      json: `${stableStringify(bundle, 2)}\n`,
      bundle,
      diagnostic: current.diagnostic,
    };
  }

  function prepareImport(jsonText) {
    const bundle = parseImportBundle(jsonText, context);
    validateImportedStory(bundle.records.story);
    return {
      bundle,
      preview: createImportPreview(bundle, context),
      current_backup: exportBackup(),
    };
  }

  function replaceFromImport(prepared, { confirmed = false } = {}) {
    if (!confirmed) throw new ClientDataError('CONFIRMATION_REQUIRED', 'Import replacement requires explicit confirmation.');
    if (!prepared || !prepared.bundle) throw new ClientDataError('INVALID_IMPORT', 'A validated import preview is required.');
    const candidate = localStateFromExport(clone(prepared.bundle), context);
    validateImportedStory(candidate.records.story);
    return write(candidate, { allowRecovery: true });
  }

  function setStoryImportValidator(validator) {
    if (typeof validator !== 'function') {
      throw new ClientDataError('INVALID_STORY_VALIDATOR', 'Story import validator must be a function.');
    }
    storyImportValidator = validator;
  }

  function reset({ confirmed = false } = {}) {
    if (!confirmed) throw new ClientDataError('CONFIRMATION_REQUIRED', 'Reset Local Data requires explicit confirmation.');
    return write(createDefaultState(context), { allowRecovery: true });
  }

  function saveProfile(profile) {
    const errors = validateProfile(profile, context);
    if (errors.length > 0) throw new ClientDataError('INVALID_PROFILE', 'Profile failed validation.', errors);
    return update((state) => {
      state.records.profile = clone(profile);
      return state;
    });
  }

  function saveSettings(settings) {
    const errors = validateSettings(settings, context);
    if (errors.length > 0) throw new ClientDataError('INVALID_SETTINGS', 'Settings failed validation.', errors);
    return update((state) => {
      state.records.settings = clone(settings);
      return state;
    });
  }

  function createDeckDraft(options = {}) {
    const current = load();
    if (current.recovery_required) throw new ClientDataError('RECOVERY_REQUIRED', 'Recover local data before creating a deck.');
    return createPureDeckDraft(current.state.records.decks, context, {
      ...options,
      ...(idFactory ? { idFactory } : {}),
    });
  }

  function saveDeck(draft) {
    return update((state) => {
      state.records.decks = savePureDeck(state.records.decks, draft, context);
      return state;
    });
  }

  function makeActive(deckId) {
    return update((state) => {
      state.records.decks = setPureActiveDeck(state.records.decks, deckId, context);
      return state;
    });
  }

  function deleteDeck(deckId, { confirmed = false } = {}) {
    if (!confirmed) throw new ClientDataError('CONFIRMATION_REQUIRED', 'Delete Deck requires explicit confirmation.');
    return update((state) => {
      state.records.decks = deletePureDeck(state.records.decks, deckId, context);
      return state;
    });
  }

  function recordMatchStart(matchId) {
    let applied = false;
    const result = update((state) => {
      const operation = recordStatisticsMatchStart(state.records.statistics, matchId, context);
      state.records.statistics = operation.value;
      applied = operation.applied;
      return state;
    });
    return { ...result, applied };
  }

  function applyMatchResult(resultSummary) {
    let applied = false;
    const result = update((state) => {
      const operation = applyStatisticsResult(state.records.statistics, resultSummary, context);
      state.records.statistics = operation.value;
      applied = operation.applied;
      return state;
    });
    return { ...result, applied };
  }

  function recordTutorialCompletion(tutorialId) {
    return update((state) => {
      state.records.tutorials = recordPureTutorialCompletion(state.records.tutorials, tutorialId, context);
      return state;
    });
  }

  function saveStoryProgress(progress) {
    const errors = validateStoryProgress(progress, context);
    if (errors.length > 0) throw new ClientDataError('INVALID_STORY_PROGRESS', 'Story progress failed validation.', errors);
    return update((state) => {
      state.records.story = clone(progress);
      return state;
    });
  }

  return Object.freeze({
    key,
    load,
    exportBackup,
    prepareImport,
    replaceFromImport,
    reset,
    saveProfile,
    saveSettings,
    createDeckDraft,
    saveDeck,
    makeActive,
    deleteDeck,
    recordMatchStart,
    applyMatchResult,
    recordTutorialCompletion,
    saveStoryProgress,
    setStoryImportValidator,
  });
}
