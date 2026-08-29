import { buildStoryHomeModel, buildStorySceneModel } from './story-ui-model.mjs';
import { migrateStoryProgress } from './story-content-migration.mjs';
import { loadStoryMatchRegistry, resolveStoryMatch } from './story-match-registry.mjs';

export const STORY_PROGRESS_RECORD_VERSION = 'story-progress-record-v1';
export const STORY_PROGRESS_BACKUP_VERSION = 'story-progress-backup-v1';
export const STORY_PROGRESS_STORAGE_KEY = 'server-repair-tcg:story-progress-v1';
export const STORY_REVIEW_SESSION_VERSION = 'story-review-session-v1';
export const STORY_REVIEW_SESSION_STORAGE_KEY = 'server-repair-tcg:story-review-v1';

const DEFAULT_ROOT = new URL(
  '../../generated/play/content/story-v1/campaigns/quiet-cascade-characterization-v2/',
  import.meta.url,
);
const DEFAULT_RUNTIME_URL = new URL('../../generated/play/src/story/index.mjs', import.meta.url);
const SAFE_ID = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/;
const clone = (value) => value === undefined ? undefined : structuredClone(value);

function record(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function exactKeys(value, keys) {
  if (!record(value)) return false;
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length
    && actual.every((key, index) => key === expected[index]);
}

async function fetchJson(url, fetchImpl, label) {
  const response = await fetchImpl(url, { cache: 'no-store' });
  if (!response?.ok) throw new Error(`${label} failed to load (${response?.status ?? 'network error'}).`);
  return response.json();
}

async function loadBundle({ rootUrl, fetchImpl }) {
  const manifest = await fetchJson(new URL('manifest.json', rootUrl), fetchImpl, 'Story manifest');
  if (!record(manifest) || !Array.isArray(manifest.scripts) || !record(manifest.text_catalogs)) {
    throw new Error('Story manifest is malformed.');
  }
  const registryPromise = fetchJson(new URL(manifest.registry, rootUrl), fetchImpl, 'Story registry');
  const scriptsPromise = Promise.all(manifest.scripts.map((path) =>
    fetchJson(new URL(path, rootUrl), fetchImpl, `Story script ${path}`)));
  const textPairsPromise = Promise.all(Object.entries(manifest.text_catalogs).map(async ([locale, path]) => [
    locale,
    await fetchJson(new URL(path, rootUrl), fetchImpl, `Story text catalog ${locale}`),
  ]));
  const [registry, scripts, textPairs] = await Promise.all([
    registryPromise,
    scriptsPromise,
    textPairsPromise,
  ]);
  return { manifest, registry, scripts, texts: Object.fromEntries(textPairs) };
}

async function loadReviewEpisodes({ rootUrl, fetchImpl }) {
  const response = await fetchImpl(new URL('review-episodes.json', rootUrl), { cache: 'no-store' });
  if (!response?.ok) return null;
  const source = await response.json();
  if (!exactKeys(source, ['schema_version', 'campaign_id', 'content_version', 'episodes'])
      || source.schema_version !== 'story-review-episodes-v1'
      || typeof source.campaign_id !== 'string' || !SAFE_ID.test(source.campaign_id)
      || typeof source.content_version !== 'string' || !SAFE_ID.test(source.content_version)
      || !Array.isArray(source.episodes)) {
    throw new Error('Story review metadata is malformed or unsupported.');
  }
  const episodes = new Map();
  for (const entry of source.episodes) {
    if (!exactKeys(entry, ['match_ref', 'replay_entry_checkpoint_id'])
        || typeof entry.match_ref !== 'string' || !SAFE_ID.test(entry.match_ref)
        || typeof entry.replay_entry_checkpoint_id !== 'string'
        || !SAFE_ID.test(entry.replay_entry_checkpoint_id)
        || episodes.has(entry.match_ref)) {
      throw new Error('Story review episode metadata is malformed or duplicated.');
    }
    episodes.set(entry.match_ref, Object.freeze(clone(entry)));
  }
  return Object.freeze({
    campaignId: source.campaign_id,
    contentVersion: source.content_version,
    episodes,
  });
}

function emptyRecord(bundle) {
  return {
    schema_version: STORY_PROGRESS_RECORD_VERSION,
    pack_id: bundle.manifest.pack_id,
    content_version: bundle.manifest.content_version,
    checkpoint: null,
    pending_result: null,
    completed_ending_id: null,
  };
}

function validateProgressRecord(candidate, { bundle, runtime }) {
  if (!exactKeys(candidate, [
    'schema_version', 'pack_id', 'content_version', 'checkpoint', 'pending_result',
    'completed_ending_id',
  ])
      || candidate.schema_version !== STORY_PROGRESS_RECORD_VERSION
      || candidate.pack_id !== bundle.manifest.pack_id
      || candidate.content_version !== bundle.manifest.content_version) {
    throw new Error('Story progress belongs to an unsupported version or content pack.');
  }
  if (candidate.completed_ending_id !== null
      && (typeof candidate.completed_ending_id !== 'string' || !SAFE_ID.test(candidate.completed_ending_id))) {
    throw new Error('Story completion marker is malformed.');
  }
  let restored = null;
  if (candidate.checkpoint !== null) restored = runtime.restoreStoryCheckpoint(candidate.checkpoint, bundle);
  const authoredEnding = candidate.checkpoint === null ? null : bundle.scripts
    .flatMap((script) => script.statements)
    .find((statement) => statement.type === 'end'
      && statement.checkpoint_id === candidate.checkpoint.checkpoint_id)?.ending_id ?? null;
  if (candidate.completed_ending_id !== authoredEnding
      || (candidate.completed_ending_id !== null
        && (candidate.pending_result !== null || restored?.pending_match))) {
    throw new Error('Story completion marker does not match its authored ending checkpoint.');
  }
  if (candidate.pending_result !== null) {
    if (!restored?.pending_match
        || !exactKeys(candidate.pending_result, ['result', 'checkpoint_id', 'return_label'])
        || candidate.pending_result.checkpoint_id !== restored.pending_match.pre_match_checkpoint_id
        || candidate.pending_result.return_label !== restored.pending_match.return_label) {
      throw new Error('Stored Story Match result does not match the durable pre-Match checkpoint.');
    }
    runtime.normalizeStoryMatchResult(candidate.pending_result.result, {
      expectedMatchRef: restored.pending_match.match_ref,
    });
  }
  return { value: clone(candidate), restored };
}

function prepareProgressRecord(candidate, { bundle, runtime }) {
  const migration = migrateStoryProgress(candidate, { bundle, runtime });
  const validated = validateProgressRecord(migration.value, { bundle, runtime });
  return { ...validated, migrated_from: migration.migrated_from };
}

function createContextToken() {
  const random = globalThis.crypto?.randomUUID?.().toLowerCase()
    || `${Date.now()}-${Math.random().toString(16).slice(2)}-${Math.random().toString(16).slice(2)}`;
  return `story.context.${random}`.replace(/[^a-z0-9._-]/g, '-');
}

function titleFromStableId(value, fallback) {
  const segment = typeof value === 'string' ? value.split('.').at(-1) : '';
  if (!segment) return fallback;
  const minorWords = new Set(['a', 'an', 'and', 'at', 'for', 'in', 'of', 'on', 'or', 'the', 'to']);
  return segment.replaceAll('_', ' ').replaceAll('-', ' ').split(/\s+/)
    .map((word, index) => index > 0 && minorWords.has(word)
      ? word
      : `${word[0]?.toUpperCase() ?? ''}${word.slice(1)}`)
    .join(' ');
}

export async function createStoryClient({
  playArtResolver,
  storyArtResolver,
  activeDeck = () => null,
  onStartMatch = async () => {},
  onChange = () => {},
  announce = () => {},
  progressStore = null,
  storageImpl = globalThis.localStorage,
  sessionStorageImpl = globalThis.sessionStorage,
  fetchImpl = globalThis.fetch,
  rootUrl = DEFAULT_ROOT,
  runtimeUrl = DEFAULT_RUNTIME_URL,
} = {}) {
  if (typeof fetchImpl !== 'function') throw new TypeError('Story requires fetch.');
  const [runtime, bundle, matchRegistry] = await Promise.all([
    import(runtimeUrl.href),
    loadBundle({ rootUrl, fetchImpl }),
    loadStoryMatchRegistry({ url: new URL('matches.json', rootUrl), fetchImpl }),
  ]);
  const reviewRegistry = await loadReviewEpisodes({ rootUrl, fetchImpl });
  const issues = runtime.validateStoryPack(bundle);
  if (issues.length) {
    const error = new Error(`Story content has ${issues.length} validation issue${issues.length === 1 ? '' : 's'}.`);
    error.details = issues;
    throw error;
  }
  if (matchRegistry.campaignId !== bundle.manifest.pack_id) {
    throw new Error('Story Match registry belongs to a different campaign pack.');
  }
  if (reviewRegistry
      && (reviewRegistry.campaignId !== bundle.manifest.pack_id
        || reviewRegistry.contentVersion !== bundle.manifest.content_version)) {
    throw new Error('Story review metadata belongs to a different campaign pack or content version.');
  }
  const reviewEntries = reviewRegistry?.episodes ?? new Map();
  const reviewMetadataRequired = bundle.manifest.content_version === 'quiet-cascade-characterization-v2';
  if (reviewMetadataRequired && reviewEntries.size !== matchRegistry.matches.size) {
    throw new Error('Current Story content must declare one reviewed episode boundary per Match.');
  }
  for (const matchRef of reviewEntries.keys()) {
    if (!matchRegistry.matches.has(matchRef)) {
      throw new Error(`Story review metadata references an unregistered Match: ${matchRef}.`);
    }
  }
  const reviewEntryFor = (matchRef) => reviewEntries.get(matchRef) ?? null;

  const authoredMatchBoundaries = new Map();
  const authoredCheckpoints = new Set();
  for (const script of bundle.scripts) {
    for (const statement of script.statements) {
      for (const checkpointId of [
        statement.checkpoint_id,
        statement.pre_match_checkpoint_id,
        statement.post_match_checkpoint_id,
      ]) {
        if (checkpointId) authoredCheckpoints.add(checkpointId);
      }
      if (statement.type !== 'start_match') continue;
      authoredMatchBoundaries.set(statement.match_ref, {
        return_label: statement.return_label,
        pre_match_checkpoint_id: statement.pre_match_checkpoint_id,
        post_match_checkpoint_id: statement.post_match_checkpoint_id,
      });
    }
  }
  if (authoredMatchBoundaries.size !== matchRegistry.matches.size) {
    throw new Error('Story scripts and Match registry declare different reviewed Match sets.');
  }
  for (const [matchRef, definition] of matchRegistry.matches) {
    const authored = authoredMatchBoundaries.get(matchRef);
    if (!authored
        || authored.return_label !== definition.return_label
        || authored.pre_match_checkpoint_id !== definition.pre_match_checkpoint_id
        || authored.post_match_checkpoint_id !== definition.post_match_checkpoint_id
        || (reviewMetadataRequired
          && !authoredCheckpoints.has(reviewEntryFor(matchRef)?.replay_entry_checkpoint_id))) {
      throw new Error(`Story Match boundary ${matchRef} is inconsistent across reviewed content.`);
    }
  }

  const textCatalog = bundle.texts[bundle.manifest.default_locale].entries;
  const characterNames = new Map(bundle.registry.characters.map((character) => [
    character.character_id,
    textCatalog[character.name_text_id] || character.character_id,
  ]));
  const assetAltText = new Map(bundle.registry.assets.map((asset) => [
    asset.asset_id,
    asset.alt_text_id || null,
  ]));
  const chapterByCheckpoint = new Map();
  for (const script of bundle.scripts) {
    for (const statement of script.statements) {
      for (const checkpointId of [
        statement.checkpoint_id,
        statement.pre_match_checkpoint_id,
        statement.post_match_checkpoint_id,
      ]) {
        if (checkpointId) chapterByCheckpoint.set(checkpointId, script.chapter_id);
      }
    }
  }
  let progress = emptyRecord(bundle);
  let state = null;
  let display = null;
  let auto = false;
  let error = null;
  let activeMatchContext = null;
  let review = null;
  let reviewNotice = null;
  let reviewInterrupted = false;

  const storedProgress = () => {
    if (progressStore?.load) return clone(progressStore.load());
    const raw = storageImpl?.getItem(STORY_PROGRESS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  };

  const persistProgress = (next) => {
    if (progressStore?.save) progressStore.save(clone(next));
    else if (storageImpl) storageImpl.setItem(STORY_PROGRESS_STORAGE_KEY, JSON.stringify(next));
  };

  const clearReviewMarker = () => {
    try {
      sessionStorageImpl?.removeItem(STORY_REVIEW_SESSION_STORAGE_KEY);
    } catch {
      // A blocked session store cannot affect canonical Story authority.
    }
  };

  const writeReviewMarker = (definition, phase) => {
    if (!sessionStorageImpl) return;
    const marker = {
      schema_version: STORY_REVIEW_SESSION_VERSION,
      pack_id: bundle.manifest.pack_id,
      content_version: bundle.manifest.content_version,
      match_ref: definition.match_ref,
      phase,
    };
    sessionStorageImpl.setItem(STORY_REVIEW_SESSION_STORAGE_KEY, JSON.stringify(marker));
  };

  const readStored = () => {
    try {
      const candidate = storedProgress();
      if (!candidate || candidate.pack_id === null) return;
      const validated = prepareProgressRecord(candidate, { bundle, runtime });
      if (validated.migrated_from !== null) persistProgress(validated.value);
      progress = validated.value;
      state = validated.restored;
    } catch (storageError) {
      error = `Stored Story progress could not be restored: ${storageError.message}`;
      progress = emptyRecord(bundle);
      state = null;
    }
  };

  const writeProgress = (next) => {
    validateProgressRecord(next, { bundle, runtime });
    persistProgress(next);
    progress = clone(next);
  };

  const checkpointFromEffects = (effects) => effects
    .filter((effect) => effect.type === 'PERSIST_CHECKPOINT')
    .at(-1)?.checkpoint ?? null;

  const persistOutcome = (outcome, { pendingResult = progress.pending_result } = {}) => {
    const checkpoint = checkpointFromEffects(outcome.effects);
    const ending = outcome.effects.find((effect) => effect.type === 'STORY_ENDED');
    if (!checkpoint && !ending) return;
    writeProgress({
      ...progress,
      checkpoint: checkpoint ? clone(checkpoint) : progress.checkpoint,
      pending_result: pendingResult,
      completed_ending_id: ending?.ending_id ?? progress.completed_ending_id,
    });
  };

  const launchMatch = async (context, pendingMatch) => {
    const definition = resolveStoryMatch(matchRegistry, context.match_ref);
    if (context.schema_version !== 'story-match-context-v1'
        || context.checkpoint_id !== definition.pre_match_checkpoint_id
        || !pendingMatch
        || pendingMatch.schema_version !== context.schema_version
        || pendingMatch.match_ref !== definition.match_ref
        || pendingMatch.return_label !== definition.return_label
        || pendingMatch.pre_match_checkpoint_id !== definition.pre_match_checkpoint_id
        || pendingMatch.post_match_checkpoint_id !== definition.post_match_checkpoint_id) {
      throw new Error('Story runtime requested an unreviewed or mismatched Match boundary.');
    }
    activeMatchContext = Object.freeze({
      schema_version: context.schema_version,
      context_token: createContextToken(),
      match_ref: definition.match_ref,
      checkpoint_id: definition.pre_match_checkpoint_id,
      return_label: definition.return_label,
    });
    await onStartMatch({
      context: clone(activeMatchContext),
      definition: clone(definition),
      deck: clone(activeDeck()),
    });
  };

  const completedResultFor = (matchRef) => (progress.checkpoint?.match_results ?? [])
    .find((result) => result.match_ref === matchRef) ?? null;

  const reviewLabel = (definition) => {
    const shift = Number(definition.shift_id.split('.').at(-1));
    const title = textCatalog[definition.title_text_id] || titleFromStableId(definition.match_ref, 'Story episode');
    return `Shift ${shift} · ${title}`;
  };

  const createReview = (definition) => {
    if (!progress.checkpoint || !completedResultFor(definition.match_ref)) {
      throw new Error('Only episodes with an accepted durable Match result can be reviewed.');
    }
    const reviewEntry = reviewEntryFor(definition.match_ref);
    if (!reviewEntry) {
      throw new Error('This episode has no approved review entry boundary.');
    }
    return {
      definition,
      state: runtime.createStoryReviewState(
        progress.checkpoint,
        reviewEntry.replay_entry_checkpoint_id,
        bundle,
      ),
      display: null,
    };
  };

  const launchReviewMatch = async (context, pendingMatch) => {
    const definition = review?.definition;
    if (!definition
        || context.schema_version !== 'story-match-context-v1'
        || context.match_ref !== definition.match_ref
        || context.checkpoint_id !== definition.pre_match_checkpoint_id
        || !pendingMatch
        || pendingMatch.match_ref !== definition.match_ref
        || pendingMatch.return_label !== definition.return_label
        || pendingMatch.pre_match_checkpoint_id !== definition.pre_match_checkpoint_id
        || pendingMatch.post_match_checkpoint_id !== definition.post_match_checkpoint_id) {
      throw new Error('Story review reached an unapproved Match boundary.');
    }
    writeReviewMarker(definition, 'MATCH');
    await onStartMatch({
      context: null,
      review: {
        schema_version: STORY_REVIEW_SESSION_VERSION,
        match_ref: definition.match_ref,
        label: reviewLabel(definition),
      },
      definition: clone(definition),
      deck: clone(activeDeck()),
    });
  };

  const applyReviewIntent = async (intent, { notify = true } = {}) => {
    if (!review) throw new Error('No Story review is active.');
    const outcome = runtime.reduceStory(review.state, intent, bundle);
    review.state = outcome.state;
    review.display = outcome.display;
    const start = outcome.effects.find((effect) => effect.type === 'START_MATCH');
    if (start) {
      try {
        await launchReviewMatch(start.context, review.state.pending_match);
      } catch (launchError) {
        clearReviewMarker();
        review = null;
        reviewNotice = 'Story practice could not start. Canonical Story progress was preserved.';
        throw launchError;
      }
    }
    if (notify) onChange();
    return outcome;
  };

  const applyIntent = async (intent) => {
    if (review) return applyReviewIntent(intent);
    const currentState = state ?? runtime.createStoryState(bundle);
    const outcome = runtime.reduceStory(currentState, intent, bundle);
    // A checkpoint is the authority to cross a durable boundary. Commit it
    // before exposing the corresponding in-memory state or launching a Match.
    persistOutcome(outcome);
    state = outcome.state;
    display = outcome.display;
    const start = outcome.effects.find((effect) => effect.type === 'START_MATCH');
    if (start) await launchMatch(start.context, state.pending_match);
    onChange();
    return outcome;
  };

  const restoreForOpen = () => {
    if (state) return;
    state = progress.checkpoint
      ? runtime.restoreStoryCheckpoint(progress.checkpoint, bundle)
      : runtime.createStoryState(bundle);
  };

  readStored();
  try {
    const rawMarker = sessionStorageImpl?.getItem(STORY_REVIEW_SESSION_STORAGE_KEY);
    if (rawMarker) {
      const marker = JSON.parse(rawMarker);
      if (!exactKeys(marker, ['schema_version', 'pack_id', 'content_version', 'match_ref', 'phase'])
          || marker.schema_version !== STORY_REVIEW_SESSION_VERSION
          || marker.pack_id !== bundle.manifest.pack_id
          || marker.content_version !== bundle.manifest.content_version
          || !['SCENE', 'MATCH'].includes(marker.phase)) {
        throw new Error('Stored Story review marker is malformed.');
      }
      const definition = resolveStoryMatch(matchRegistry, marker.match_ref);
      if (!completedResultFor(definition.match_ref)) throw new Error('Stored Story review is no longer eligible.');
      if (marker.phase === 'SCENE') {
        review = createReview(definition);
        await applyReviewIntent({ type: 'BEGIN' }, { notify: false });
      } else {
        reviewInterrupted = true;
        reviewNotice = `${reviewLabel(definition)} practice was interrupted. Canonical Story progress is unchanged.`;
        clearReviewMarker();
      }
    }
  } catch {
    review = null;
    reviewInterrupted = false;
    clearReviewMarker();
  }

  return Object.freeze({
    get pack() { return clone(bundle.manifest); },
    get activeMatchContext() { return clone(activeMatchContext); },
    get error() { return error; },

    validateProgress(candidate) {
      return prepareProgressRecord(candidate, { bundle, runtime }).value;
    },

    homeModel() {
      const pending = progress.checkpoint?.pending_match ?? state?.pending_match ?? null;
      const pendingResult = progress.pending_result;
      const deck = activeDeck();
      const history = [...matchRegistry.matches.values()].flatMap((entry) => {
        const result = completedResultFor(entry.match_ref);
        if (!result) return [];
        return [{
          id: entry.match_ref,
          label: `${reviewLabel(entry)} · ${result.completion.toLowerCase()}`,
          replayable: Boolean(reviewEntryFor(entry.match_ref)),
        }];
      });
      const checkpointId = progress.checkpoint?.checkpoint_id ?? null;
      const definition = pending
        ? resolveStoryMatch(matchRegistry, pending.match_ref)
        : [...matchRegistry.matches.values()].find((entry) =>
          entry.pre_match_checkpoint_id === checkpointId
            || entry.post_match_checkpoint_id === checkpointId) ?? null;
      const chapterId = definition?.chapter_id ?? chapterByCheckpoint.get(checkpointId) ?? null;
      const matchTitle = definition ? textCatalog[definition.title_text_id] : null;
      return buildStoryHomeModel({
        status: error ? 'RECOVERY_REQUIRED'
          : progress.completed_ending_id ? 'COMPLETE'
            : pendingResult ? 'RESULT_READY'
              : pending ? 'INTERRUPTED_MATCH'
                : progress.checkpoint ? 'READY' : 'NEW',
        checkpoint: progress.checkpoint,
        checkpoint_label: progress.checkpoint?.checkpoint_id,
        chapter_title: titleFromStableId(chapterId, 'Quiet Cascade'),
        shift_title: definition?.shift_id
          ? `Shift ${Number(definition.shift_id.split('.').at(-1))}${matchTitle ? ` · ${matchTitle}` : ''}`
          : progress.completed_ending_id ? 'Campaign complete'
            : checkpointId ? 'Chapter handoff' : 'The first handoff',
        progress_summary: pendingResult
          ? 'An authoritative Story Match result is ready to cross the durable return boundary exactly once.'
          : progress.completed_ending_id
            ? 'Campaign one is complete. More Story content is in development.'
            : undefined,
        interrupted_match: Boolean(pending && !pendingResult),
        review_interrupted: reviewInterrupted,
        review_notice: reviewNotice,
        can_open: !error && !progress.completed_ending_id,
        history,
        error,
      }, { activeDeck: deck });
    },

    sceneModel() {
      const activeDisplay = review?.display ?? display;
      const decorated = activeDisplay ? {
        ...activeDisplay,
        background: activeDisplay.background ? {
          ...activeDisplay.background,
          alt_text_id: assetAltText.get(activeDisplay.background.asset_id) || null,
        } : null,
        characters: activeDisplay.characters.map((item) => ({
          ...item,
          alt_text_id: assetAltText.get(item.asset_id) || null,
        })),
        transient: activeDisplay.transient.map((item) => ({
          ...item,
          alt_text_id: assetAltText.get(item.asset_id) || null,
        })),
      } : null;
      return buildStorySceneModel(decorated, {
        resolveText: (textId) => textCatalog[textId] || textId,
        resolveCharacterName: (characterId) => characterNames.get(characterId) || characterId,
        artResolver: storyArtResolver,
        transcript: decorated?.screens?.transcript ?? [],
        auto,
        review: review ? { active: true, label: reviewLabel(review.definition) } : null,
        error: error || (!decorated ? 'Return to Story Home to begin or restore this segment.' : null),
      });
    },

    async openPrimary() {
      if (error) throw new Error(error);
      if (review) {
        clearReviewMarker();
        review = null;
      }
      reviewInterrupted = false;
      reviewNotice = null;
      restoreForOpen();
      if (progress.pending_result) {
        await this.continueFromMatch();
        return { route: '#/play/story/scene' };
      }
      if (state.status === 'AWAITING_MATCH' && state.pending_match) {
        const definition = resolveStoryMatch(matchRegistry, state.pending_match.match_ref);
        await launchMatch({
          schema_version: state.pending_match.schema_version,
          match_ref: state.pending_match.match_ref,
          checkpoint_id: definition.pre_match_checkpoint_id,
        }, state.pending_match);
        return { route: '#/play/game' };
      }
      if (state.status === 'READY') await applyIntent({ type: 'BEGIN' });
      return { route: '#/play/story/scene' };
    },

    async advance() {
      return applyIntent({ type: 'ADVANCE' });
    },

    async choose(optionId) {
      return applyIntent({ type: 'CHOOSE', option_id: optionId });
    },

    setAuto(next) {
      auto = Boolean(next);
      onChange();
    },

    async stageMatchResult(candidate, returnedContext) {
      if (!activeMatchContext
          || !exactKeys(returnedContext, [
            'schema_version', 'context_token', 'match_ref', 'checkpoint_id', 'return_label',
          ])
          || returnedContext.schema_version !== activeMatchContext.schema_version
          || returnedContext.context_token !== activeMatchContext.context_token
          || returnedContext.match_ref !== activeMatchContext.match_ref
          || returnedContext.checkpoint_id !== activeMatchContext.checkpoint_id
          || returnedContext.return_label !== activeMatchContext.return_label) {
        throw new Error('Story Match result context is stale or mismatched.');
      }
      restoreForOpen();
      if (state.status !== 'AWAITING_MATCH' || !state.pending_match) {
        throw new Error('Story is not awaiting this Match result.');
      }
      const normalized = runtime.normalizeStoryMatchResult(candidate, {
        expectedMatchRef: state.pending_match.match_ref,
      });
      if (progress.checkpoint?.match_results?.some((result) =>
        result.result_id === normalized.result_id || result.match_id === normalized.match_id)) {
        throw new Error('This Story Match result was already accepted.');
      }
      if (progress.pending_result) {
        throw new Error('A validated Story Match result is already waiting at this checkpoint.');
      }
      writeProgress({
        ...progress,
        pending_result: {
          result: normalized,
          checkpoint_id: state.pending_match.pre_match_checkpoint_id,
          return_label: state.pending_match.return_label,
        },
      });
      activeMatchContext = null;
      onChange();
      return clone(normalized);
    },

    async continueFromMatch() {
      if (!progress.pending_result) throw new Error('No validated Story Match result is waiting.');
      restoreForOpen();
      const outcome = runtime.reduceStory(state, {
        type: 'ACCEPT_MATCH_RESULT',
        result: progress.pending_result.result,
      }, bundle);
      const checkpoint = checkpointFromEffects(outcome.effects);
      if (!checkpoint) throw new Error('Story runtime did not provide the required post-Match checkpoint.');
      const nextProgress = {
        ...progress,
        checkpoint: clone(checkpoint),
        pending_result: null,
      };
      validateProgressRecord(nextProgress, { bundle, runtime });
      persistProgress(nextProgress);
      progress = nextProgress;
      state = outcome.state;
      display = outcome.display;
      onChange();
      return outcome;
    },

    async recover() {
      if (review) {
        const definition = review.definition;
        review = createReview(definition);
        writeReviewMarker(definition, 'SCENE');
        await applyReviewIntent({ type: 'BEGIN' });
        return;
      }
      error = null;
      state = progress.checkpoint
        ? runtime.restoreStoryCheckpoint(progress.checkpoint, bundle)
        : runtime.createStoryState(bundle);
      display = null;
      if (state.status === 'READY') await applyIntent({ type: 'BEGIN' });
      else onChange();
    },

    async replay(matchRef) {
      if (review) throw new Error('A Story review is already active.');
      const definition = resolveStoryMatch(matchRegistry, matchRef);
      review = createReview(definition);
      reviewInterrupted = false;
      reviewNotice = null;
      try {
        writeReviewMarker(definition, 'SCENE');
        await applyReviewIntent({ type: 'BEGIN' });
      } catch (reviewError) {
        clearReviewMarker();
        review = null;
        throw reviewError;
      }
    },

    completeReviewMatch(matchRef) {
      if (review?.definition.match_ref !== matchRef) {
        throw new Error('Story practice completion does not match the active review episode.');
      }
      const label = reviewLabel(review.definition);
      clearReviewMarker();
      review = null;
      reviewNotice = `${label} practice finished. Canonical Story progress and Profile statistics are unchanged.`;
      reviewInterrupted = false;
      onChange();
    },

    cancelReview({ notify = true } = {}) {
      if (!review && !reviewInterrupted) return;
      clearReviewMarker();
      review = null;
      reviewInterrupted = false;
      reviewNotice = 'Story practice ended. Canonical Story progress is unchanged.';
      if (notify) onChange();
    },

    async reset() {
      clearReviewMarker();
      const next = emptyRecord(bundle);
      persistProgress(next);
      progress = next;
      state = null;
      display = null;
      auto = false;
      error = null;
      activeMatchContext = null;
      review = null;
      reviewNotice = null;
      reviewInterrupted = false;
      onChange();
    },

    exportProgress() {
      const backup = {
        backup_version: STORY_PROGRESS_BACKUP_VERSION,
        exported_at: new Date().toISOString(),
        progress: clone(progress),
      };
      return {
        filename: `server-repair-story-${bundle.manifest.pack_id}.json`,
        json: `${JSON.stringify(backup, null, 2)}\n`,
      };
    },

    prepareImport(source) {
      const candidate = typeof source === 'string' ? JSON.parse(source) : source;
      if (!exactKeys(candidate, ['backup_version', 'exported_at', 'progress'])
          || candidate.backup_version !== STORY_PROGRESS_BACKUP_VERSION
          || typeof candidate.exported_at !== 'string') {
        throw new Error('Story backup is malformed or unsupported.');
      }
      const validated = prepareProgressRecord(candidate.progress, { bundle, runtime });
      return Object.freeze({
        value: validated.value,
        preview: Object.freeze({
          checkpoint: validated.value.checkpoint?.checkpoint_id ?? 'No checkpoint',
          completed_matches: validated.value.checkpoint?.match_results?.length ?? 0,
          result_waiting: Boolean(validated.value.pending_result),
          ending: validated.value.completed_ending_id,
        }),
      });
    },

    replaceFromImport(prepared, { confirmed = false } = {}) {
      if (!confirmed) throw new Error('Story backup replacement requires confirmation.');
      const validated = validateProgressRecord(prepared?.value, { bundle, runtime });
      const previous = storedProgress();
      try {
        persistProgress(validated.value);
      } catch (replaceError) {
        if (previous !== null) persistProgress(previous);
        throw replaceError;
      }
      progress = validated.value;
      state = validated.restored;
      display = null;
      error = null;
      activeMatchContext = null;
      clearReviewMarker();
      review = null;
      reviewNotice = null;
      reviewInterrupted = false;
      onChange();
    },

    reloadProgress({ notify = true } = {}) {
      clearReviewMarker();
      progress = emptyRecord(bundle);
      state = null;
      display = null;
      auto = false;
      error = null;
      activeMatchContext = null;
      review = null;
      reviewNotice = null;
      reviewInterrupted = false;
      readStored();
      if (notify) onChange();
    },
  });
}
