import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { validateStoryPack } from './index.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const BASE_ROOT = path.join(ROOT, 'content/story-v1/campaigns/quiet-cascade-characterization-v2');
const EXPANSION_ROOT = path.join(ROOT, 'content/story-v1/candidates/quiet-cascade-expansion-v3');
const OUTPUT_ROOT = path.join(ROOT, 'content/story-v1/campaigns/quiet-cascade-expansion-v3');
const BLUEPRINT_PATH = path.join(ROOT, 'docs/story/revisions/quiet-cascade-expansion-v3/blueprint.json');
const REPORT_ROOT = path.join(ROOT, 'docs/story/releases/quiet-cascade-expansion-v3');
const CONTENT_VERSION = 'quiet-cascade-expansion-v3';
const EXPANSION_ENTRY_LABEL = 'story.qc02.entry';
const EXPANSION_ENTRY_CHECKPOINT = 'checkpoint.qc02.entry';

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));
const jsonText = (value) => `${JSON.stringify(value, null, 2)}\n`;
const clone = (value) => structuredClone(value);
const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');

function directoryDigest(root) {
  const files = [];
  const visit = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })
      .sort((left, right) => left.name.localeCompare(right.name))) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) visit(absolute);
      else files.push(path.relative(root, absolute).replaceAll('\\', '/'));
    }
  };
  visit(root);
  const hash = crypto.createHash('sha256');
  for (const relative of files) {
    hash.update(relative);
    hash.update('\0');
    hash.update(fs.readFileSync(path.join(root, relative)));
    hash.update('\0');
  }
  return { file_count: files.length, sha256: hash.digest('hex') };
}

function mergeRecords(base, expansion, key, label) {
  const merged = base.map(clone);
  const byId = new Map(merged.map((entry) => [entry[key], entry]));
  for (const entry of expansion) {
    const previous = byId.get(entry[key]);
    if (previous) {
      if (JSON.stringify(previous) !== JSON.stringify(entry)) {
        throw new Error(`Conflicting ${label} contract for ${entry[key]}`);
      }
      continue;
    }
    const copied = clone(entry);
    merged.push(copied);
    byId.set(copied[key], copied);
  }
  return merged;
}

function mergeTextEntries(base, expansion) {
  const merged = { ...base };
  for (const [textId, text] of Object.entries(expansion)) {
    if (Object.hasOwn(merged, textId) && merged[textId] !== text) {
      throw new Error(`Conflicting localized text contract for ${textId}`);
    }
    merged[textId] = text;
  }
  return merged;
}

function releaseChapterFour(script) {
  const formerEndings = [];
  const statements = script.statements.map((statement) => {
    if (statement.type !== 'end') return clone(statement);
    formerEndings.push({ ending_id: statement.ending_id, checkpoint_id: statement.checkpoint_id });
    return {
      type: 'checkpoint',
      checkpoint_id: statement.checkpoint_id,
      resume_label: EXPANSION_ENTRY_LABEL,
    };
  });
  if (formerEndings.length !== 6 || new Set(formerEndings.map((entry) => entry.checkpoint_id)).size !== 6) {
    throw new Error('Campaign one must expose exactly six distinct terminal checkpoint variants.');
  }
  return { script: { ...clone(script), statements }, formerEndings };
}

function outputDigestMap(outputs) {
  return Object.fromEntries([...outputs.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([relativePath, value]) => [relativePath, sha256(jsonText(value))]));
}

function markdownReport(report) {
  const endingRows = report.transition.former_campaign_one_endings
    .map((entry) => `| \`${entry.ending_id}\` | \`${entry.checkpoint_id}\` | \`${entry.replacement.resume_label}\` |`)
    .join('\n');
  const episodeRows = report.review_episodes
    .map((entry) => `| ${entry.shift_number} | \`${entry.match_ref}\` | \`${entry.replay_entry_checkpoint_id}\` |`)
    .join('\n');
  const objectives = report.coverage.expansion_learning_objectives
    .map((entry) => `- Shift ${entry.shift_number}, **${entry.title}**: ${entry.learning_objectives.join(' ')}`)
    .join('\n');
  return `# Quiet Cascade expansion v3 release content pack

This deterministic report describes the authored content boundary released as \`${report.content_version}\`. It measures what the pack contains; it does not claim that globally available content was exercised when it is absent from an authored Match.

## Release boundary

- Pack ID remains \`${report.pack_id}\`; stable campaign-one IDs are retained.
- New and reset profiles still enter at \`${report.entry_label}\` and traverse campaign one before the expansion.
- The six former campaign-one ending variants retain their public checkpoint IDs. Each is now an explicit durable checkpoint whose authored resume label is \`${report.transition.expansion_entry_label}\`.
- Expansion entry immediately persists \`${report.transition.expansion_entry_checkpoint_id}\` before Shift 7.
- The only terminal ending in this release is \`${report.current_content_ending.ending_id}\` at \`${report.current_content_ending.checkpoint_id}\`.
- Already-completed characterization-v2 records require the client migration described below; content does not fabricate or replay any Match result.

| Former ending | Preserved checkpoint | Resume label |
| --- | --- | --- |
${endingRows}

## Migration assumption

The client migration from \`quiet-cascade-characterization-v2\` must retain the checkpoint's six accepted Match results, Story Service Points, four remembered campaign-one choices, and branch history; add only the two new registry-variable defaults; clear the obsolete terminal completion marker; and restore the preserved ending checkpoint so its v3 digest resolves to \`${report.transition.expansion_entry_label}\`. Clearing the marker is lossless: preserved Story Service Points reproduce the Release (20+), Bounded (12–19), or Hold (0–11) band, while the exact preserved ending checkpoint ID reproduces its outcomes-first or uncertainty-first variant. The marker is cleared only because campaign one is no longer terminal. No result, reward, choice, or replay record may be synthesized.

## Exact content merge

| Measure | Campaign one | Expansion | Released total |
| --- | ---: | ---: | ---: |
| Player-facing episodes / Matches | ${report.counts.campaign_one_matches} | ${report.counts.expansion_matches} | ${report.counts.total_matches} |
| Requested Tickets | ${report.counts.campaign_one_requested_tickets} | ${report.counts.expansion_requested_tickets} | ${report.counts.total_requested_tickets} |
| Script files | ${report.counts.campaign_one_scripts} | ${report.counts.expansion_scripts} | ${report.counts.total_scripts} |
| Remembered variables | ${report.counts.campaign_one_variables} | ${report.counts.expansion_variables} | ${report.counts.total_variables} |
| Localized source entries | ${report.counts.campaign_one_text_entries} | ${report.counts.expansion_distinct_text_entries} distinct additions | ${report.counts.total_text_entries} |

Campaign-one Match definitions remain byte-equivalent as JSON values and keep the legacy v3 Builder profile. Shifts 7–12 retain their reviewed embedded v4 Builder configurations and exact deck-pressure records. The live loader must select an embedded \`builder_configuration\` when present; Shifts 1–6 continue through the legacy registry profile.

## Reviewed replay boundaries

| Shift | Match | Replay entry checkpoint |
| ---: | --- | --- |
${episodeRows}

## Teaching reach added by the released Matches

The six expansion Matches add six distinct sourced fingerprints, six generated Tickets, and one real Match per episode. This is authored exposure, not proof of learner mastery or minimal-route action use.

${objectives}

## Reproducibility

- Campaign-one source tree: ${report.source_trees.campaign_one.file_count} files, \`${report.source_trees.campaign_one.sha256}\`.
- Expansion candidate source tree: ${report.source_trees.expansion_candidate.file_count} files, \`${report.source_trees.expansion_candidate.sha256}\`.
- Generator: \`node src/story/generate-quiet-cascade-expansion-release.mjs\`.
- Drift check: \`node src/story/generate-quiet-cascade-expansion-release.mjs --check\`.

The machine-readable sibling report pins every generated core-file digest, transition, replay boundary, source case, fingerprint, Ticket definition, and learning objective.
`;
}

function buildOutputs() {
  const baseManifest = readJson(path.join(BASE_ROOT, 'manifest.json'));
  const expansionManifest = readJson(path.join(EXPANSION_ROOT, 'manifest.json'));
  const baseRegistry = readJson(path.join(BASE_ROOT, baseManifest.registry));
  const expansionRegistry = readJson(path.join(EXPANSION_ROOT, expansionManifest.registry));
  const baseMatches = readJson(path.join(BASE_ROOT, 'matches.json'));
  const expansionMatches = readJson(path.join(EXPANSION_ROOT, 'matches.json'));
  const baseTexts = readJson(path.join(BASE_ROOT, baseManifest.text_catalogs.en));
  const expansionTexts = readJson(path.join(EXPANSION_ROOT, expansionManifest.text_catalogs.en));
  const baseGraph = readJson(path.join(BASE_ROOT, 'graph.json'));
  const expansionGraph = readJson(path.join(EXPANSION_ROOT, 'graph.json'));
  const baseReview = readJson(path.join(BASE_ROOT, 'review-episodes.json'));
  const expansionMetadata = readJson(path.join(EXPANSION_ROOT, 'authored-metadata.json'));
  const blueprint = readJson(BLUEPRINT_PATH);

  if (baseManifest.pack_id !== expansionManifest.pack_id
      || baseManifest.pack_id !== blueprint.campaign_id
      || expansionManifest.content_version !== CONTENT_VERSION) {
    throw new Error('Release inputs do not share the reviewed campaign/version boundary.');
  }

  const baseScripts = baseManifest.scripts.map((relativePath) => readJson(path.join(BASE_ROOT, relativePath)));
  const expansionScripts = expansionManifest.scripts.map((relativePath) => readJson(path.join(EXPANSION_ROOT, relativePath)));
  const releasedBaseScripts = baseScripts.map((script) => clone(script));
  const chapterFourIndex = baseManifest.scripts.indexOf('scripts/chapter-04.json');
  if (chapterFourIndex < 0) throw new Error('Campaign-one Chapter 4 is missing.');
  const chapterFour = releaseChapterFour(baseScripts[chapterFourIndex]);
  releasedBaseScripts[chapterFourIndex] = chapterFour.script;

  const registry = {
    registry_version: 'story-registry-v1',
    variables: mergeRecords(baseRegistry.variables, expansionRegistry.variables, 'variable_id', 'variable'),
    assets: mergeRecords(baseRegistry.assets, expansionRegistry.assets, 'asset_id', 'asset'),
    characters: mergeRecords(baseRegistry.characters, expansionRegistry.characters, 'character_id', 'character'),
    matches: mergeRecords(baseRegistry.matches, expansionRegistry.matches, 'match_ref', 'Match reference'),
    declared_loops: mergeRecords(baseRegistry.declared_loops, expansionRegistry.declared_loops, 'loop_id', 'loop'),
  };

  const entries = mergeTextEntries(baseTexts.entries, expansionTexts.entries);
  const episodeByMatch = new Map(blueprint.episodes.map((episode) => [episode.match_ref, episode]));
  const releasedExpansionMatches = expansionMatches.matches.map((source) => {
    const episode = episodeByMatch.get(source.match_ref);
    if (!episode) throw new Error(`Expansion Match lacks an authored episode: ${source.match_ref}`);
    const shift = String(episode.shift_number).padStart(2, '0');
    const titleTextId = `text.qc02.match.shift${shift}.title`;
    const setupTextId = `text.qc02.match.shift${shift}.setup`;
    entries[titleTextId] = episode.title;
    entries[setupTextId] = source.public_setup_summary;
    return {
      ...clone(source),
      chapter_id: episode.episode_id,
      title_text_id: titleTextId,
      setup_text_id: setupTextId,
    };
  });
  const textCatalog = {
    text_catalog_version: 'story-text-catalog-v1',
    locale: 'en',
    entries: Object.fromEntries(Object.entries(entries).sort(([left], [right]) => left.localeCompare(right))),
  };

  const matches = {
    match_configuration_version: baseMatches.match_configuration_version,
    campaign_id: baseMatches.campaign_id,
    content_version: CONTENT_VERSION,
    builder_profile: clone(baseMatches.builder_profile),
    match_profile: clone(baseMatches.match_profile),
    deck_policy: clone(baseMatches.deck_policy),
    normalized_result_contract: clone(baseMatches.normalized_result_contract),
    embedded_builder_configuration_contract: {
      applies_when_present: true,
      source_content_version: expansionMatches.content_version,
      legacy_profile_applies_when_absent: true,
    },
    matches: [...baseMatches.matches.map(clone), ...releasedExpansionMatches],
  };

  const reviewEpisodes = {
    schema_version: 'story-review-episodes-v1',
    campaign_id: baseManifest.pack_id,
    content_version: CONTENT_VERSION,
    episodes: [
      ...baseReview.episodes.map(clone),
      ...blueprint.episodes.map((episode) => ({
        match_ref: episode.match_ref,
        replay_entry_checkpoint_id: episode.checkpoints.entry,
      })),
    ],
  };

  const manifest = {
    ...clone(baseManifest),
    content_version: CONTENT_VERSION,
    scripts: [...baseManifest.scripts, ...expansionManifest.scripts],
  };
  const scripts = [...releasedBaseScripts, ...expansionScripts.map(clone)];
  const bundle = { manifest, registry, texts: { en: textCatalog }, scripts };
  const issues = validateStoryPack(bundle);
  if (issues.length) {
    throw new Error(`Generated release Story pack is invalid:\n${issues.map((issue) => JSON.stringify(issue)).join('\n')}`);
  }

  const currentEnds = scripts.flatMap((script) => script.statements.filter((statement) => statement.type === 'end'));
  if (currentEnds.length !== 1 || currentEnds[0].ending_id !== blueprint.ending.ending_id) {
    throw new Error('Release pack must have one honest current-content ending.');
  }

  const graph = {
    release_graph_version: 'story-release-graph-v1',
    pack_id: manifest.pack_id,
    content_version: CONTENT_VERSION,
    entry_node_id: baseGraph.entry_node_id,
    transition: {
      from_campaign_one_checkpoint_ids: chapterFour.formerEndings.map((entry) => entry.checkpoint_id),
      to_expansion_entry_label: EXPANSION_ENTRY_LABEL,
      expansion_entry_checkpoint_id: EXPANSION_ENTRY_CHECKPOINT,
    },
    segments: [
      {
        segment_id: 'story.segment.qc01.campaign_one',
        source_content_version: baseManifest.content_version,
        entry_node_id: baseGraph.entry_node_id,
        graph: baseGraph,
      },
      {
        segment_id: 'story.segment.qc02.expansion',
        source_content_version: expansionManifest.content_version,
        entry_node_id: expansionGraph.entry_node_id,
        graph: expansionGraph,
      },
    ],
  };

  const authoredMetadata = {
    ...clone(expansionMetadata),
    status: 'RELEASED_LIVE',
    release_scope: 'QC02_EXPANSION_DISPLAYS_ONLY_CAMPAIGN_ONE_METADATA_REMAINS_IN_ITS_PINNED_REVIEW_LEDGERS',
    source_candidate_status: expansionMetadata.status,
  };

  const coreOutputs = new Map([
    ['manifest.json', manifest],
    ['registry.json', registry],
    ['matches.json', matches],
    ['graph.json', graph],
    ['review-episodes.json', reviewEpisodes],
    ['authored-metadata.json', authoredMetadata],
    ['texts/en.json', textCatalog],
  ]);
  scripts.forEach((script, index) => coreOutputs.set(manifest.scripts[index], script));

  const requestedTicketCount = (entriesToCount) => entriesToCount
    .reduce((total, entry) => total + entry.requested_ticket_count, 0);
  const sourceCaseIds = blueprint.episodes.map((episode) => episode.case_id);
  const expansionMatchByRef = new Map(releasedExpansionMatches.map((entry) => [entry.match_ref, entry]));
  const report = {
    report_version: 'story-expansion-release-audit-v1',
    pack_id: manifest.pack_id,
    content_version: CONTENT_VERSION,
    entry_label: manifest.entry_label,
    generated_core_file_sha256: outputDigestMap(coreOutputs),
    source_trees: {
      campaign_one: { content_version: baseManifest.content_version, ...directoryDigest(BASE_ROOT) },
      expansion_candidate: { content_version: expansionManifest.content_version, ...directoryDigest(EXPANSION_ROOT) },
    },
    transition: {
      policy: 'PRESERVE_ENDING_CHECKPOINT_ID_AND_RESUME_EXPANSION_WITHOUT_REPLAY_OR_RESULT_SYNTHESIS',
      expansion_entry_label: EXPANSION_ENTRY_LABEL,
      expansion_entry_checkpoint_id: EXPANSION_ENTRY_CHECKPOINT,
      former_campaign_one_endings: chapterFour.formerEndings.map((entry) => ({
        ...entry,
        replacement: { type: 'checkpoint', checkpoint_id: entry.checkpoint_id, resume_label: EXPANSION_ENTRY_LABEL },
      })),
      migration_assumption: {
        retain: ['match_results', 'story_service_points', 'choices', 'branch_history'],
        add_variable_defaults: expansionRegistry.variables.map((entry) => ({ variable_id: entry.variable_id, default: entry.default })),
        clear_completed_ending_id: true,
        cleared_terminal_marker_derivation: {
          reason: 'QC01_IS_NO_LONGER_TERMINAL',
          ending_band_from_preserved_story_service_points: {
            release_minimum: 20,
            bounded_minimum: 12,
            hold_maximum: 11,
          },
          exact_variant_from_preserved_checkpoint_id: true,
          lossless: true,
        },
        synthesize_match_results: false,
      },
    },
    current_content_ending: {
      ending_id: currentEnds[0].ending_id,
      checkpoint_id: currentEnds[0].checkpoint_id,
    },
    counts: {
      campaign_one_matches: baseMatches.matches.length,
      expansion_matches: releasedExpansionMatches.length,
      total_matches: matches.matches.length,
      campaign_one_requested_tickets: requestedTicketCount(baseMatches.matches),
      expansion_requested_tickets: requestedTicketCount(releasedExpansionMatches),
      total_requested_tickets: requestedTicketCount(matches.matches),
      campaign_one_scripts: baseScripts.length,
      expansion_scripts: expansionScripts.length,
      total_scripts: scripts.length,
      campaign_one_variables: baseRegistry.variables.length,
      expansion_variables: expansionRegistry.variables.length,
      total_variables: registry.variables.length,
      assets: registry.assets.length,
      characters: registry.characters.length,
      campaign_one_text_entries: Object.keys(baseTexts.entries).length,
      expansion_distinct_text_entries: Object.keys(expansionTexts.entries)
        .filter((textId) => !Object.hasOwn(baseTexts.entries, textId)).length,
      release_match_metadata_text_entries: blueprint.episodes.length * 2,
      total_text_entries: Object.keys(textCatalog.entries).length,
      reviewed_replay_boundaries: reviewEpisodes.episodes.length,
    },
    review_episodes: matches.matches.map((match, index) => ({
      shift_number: index + 1,
      match_ref: match.match_ref,
      replay_entry_checkpoint_id: reviewEpisodes.episodes[index].replay_entry_checkpoint_id,
    })),
    coverage: {
      interpretation_limit: 'Counts are authored Match exposure only; they do not imply mastery, global catalog use, or minimal-route action use.',
      expansion_source_case_ids: sourceCaseIds,
      expansion_fingerprint_ids: releasedExpansionMatches.flatMap((entry) => entry.allowed_fingerprint_ids),
      expansion_ticket_definition_ids: releasedExpansionMatches.flatMap((entry) => entry.expected_ticket_definition_ids),
      expansion_learning_objectives: blueprint.episodes.map((episode) => ({
        shift_number: episode.shift_number,
        title: episode.title,
        match_ref: episode.match_ref,
        source_case_id: episode.case_id,
        fingerprint_ids: expansionMatchByRef.get(episode.match_ref).allowed_fingerprint_ids,
        ticket_definition_ids: expansionMatchByRef.get(episode.match_ref).expected_ticket_definition_ids,
        learning_objectives: expansionMatchByRef.get(episode.match_ref).learning_objectives,
      })),
    },
  };

  return {
    contentOutputs: coreOutputs,
    reportOutputs: new Map([
      ['RELEASE_CONTENT_PACK.json', report],
      ['RELEASE_CONTENT_PACK.md', markdownReport(report)],
    ]),
    bundle,
    report,
  };
}

function writeOutputs(root, outputs, { check }) {
  const drift = [];
  for (const [relativePath, value] of outputs) {
    const target = path.join(root, relativePath);
    const expected = typeof value === 'string' ? value : jsonText(value);
    if (check) {
      if (!fs.existsSync(target) || fs.readFileSync(target, 'utf8') !== expected) drift.push(relativePath);
      continue;
    }
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, expected, 'utf8');
  }
  return drift;
}

function generate({ check = false } = {}) {
  const outputs = buildOutputs();
  const contentDrift = writeOutputs(OUTPUT_ROOT, outputs.contentOutputs, { check });
  const reportDrift = writeOutputs(REPORT_ROOT, outputs.reportOutputs, { check });
  if (check && (contentDrift.length || reportDrift.length)) {
    throw new Error(`Released Story output drift: ${[
      ...contentDrift.map((entry) => `content/${entry}`),
      ...reportDrift.map((entry) => `report/${entry}`),
    ].join(', ')}`);
  }
  return outputs;
}

const check = process.argv.includes('--check');
const outputs = generate({ check });
console.log(`${check ? 'Verified' : 'Generated'} Quiet Cascade expansion release (${outputs.report.counts.total_scripts} scripts, ${outputs.report.counts.total_matches} Matches, ${outputs.report.counts.reviewed_replay_boundaries} replay boundaries).`);

export { buildOutputs, generate };
