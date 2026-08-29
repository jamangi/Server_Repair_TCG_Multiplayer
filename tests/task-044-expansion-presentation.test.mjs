import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';

const ROOT = path.resolve(import.meta.dirname, '..');
const REVISION_ROOT = path.join(ROOT, 'docs/story/revisions/quiet-cascade-expansion-v3');
const REPORT_PATH = path.join(REVISION_ROOT, 'ART_REQUESTS.json');
const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));
const readText = (filePath) => fs.readFileSync(filePath, 'utf8');
const uniqueSorted = (values) => [...new Set(values)].sort((left, right) => left.localeCompare(right));

const report = readJson(REPORT_PATH);
const blueprint = readJson(path.join(REVISION_ROOT, 'blueprint.json'));
const graphReport = readJson(path.join(REVISION_ROOT, 'GRAPH_REPORT.json'));

test('TASK-044 presentation artifacts are deterministic and generator-clean', () => {
  const output = execFileSync(process.execPath, [
    path.join(ROOT, 'src/story/generate-task-044-presentation.mjs'),
    '--check',
  ], { cwd: ROOT, encoding: 'utf8' });
  const summary = JSON.parse(output);
  assert.equal(summary.mode, 'check');
  assert.equal(summary.routes, 256);
  assert.equal(summary.unique_route_digests, 256);
  assert.equal(summary.speaker_visibility_violations, 0);
  assert.equal(summary.new_art_requests, 0);
  assert.equal(summary.episode_topology_matches, 6);
  assert.equal(summary.delayed_ack_variants, 4);
  assert.equal(summary.canonical_graph_joins, 256);
});

test('all 256 choice and Match-outcome routes reach one current-content ending', () => {
  const audit = report.presentation_audit;
  assert.equal(audit.route_count, 256);
  assert.equal(audit.choice_combination_count, 4);
  assert.equal(audit.outcome_pattern_count, 64);
  assert.equal(audit.deterministic_digest_count, 256);
  assert.equal(audit.ending_id, 'ending.qc02.current_content');
  assert.equal(audit.ending_route_count, 256);
  assert.equal(audit.routes.length, 256);
  assert.equal(new Set(audit.routes.map((route) => route.canonical_digest)).size, 256);
  assert.equal(new Set(audit.routes.map((route) => route.runtime_final_digest)).size, 256);
  assert.deepEqual(audit.speaker_visibility_violations, []);
  assert.equal(audit.canonical_graph_report.route_count, 256);
  assert.equal(audit.canonical_graph_report.exact_route_id_digest_join_count, 256);
  assert.deepEqual(audit.canonical_graph_report.missing_route_ids, []);

  const canonicalById = new Map(graphReport.routes.map((route) => [route.route_id, route]));
  for (const route of audit.routes) {
    const canonical = canonicalById.get(route.route_id);
    assert.ok(canonical, route.route_id);
    assert.equal(route.canonical_digest, canonical.digest, route.route_id);
    assert.deepEqual(route.choices, canonical.choices, route.route_id);
    assert.deepEqual(Object.fromEntries(route.match_results.map((result) =>
      [result.match_ref, result.completion])), canonical.match_outcomes, route.route_id);
    assert.match(route.runtime_final_digest, /^[a-f0-9]{64}$/u, route.route_id);
    assert.equal(route.ending_id, audit.ending_id, route.route_id);
    assert.equal(Object.keys(route.choices).length, 2, route.route_id);
    assert.equal(route.event_counts.CHOICE, 2, route.route_id);
    assert.equal(route.event_counts.ENDING, 1, route.route_id);
    assert.equal(route.match_history_count, 6, route.route_id);
    assert.equal(route.match_results.length, 6, route.route_id);
    assert.equal(route.start_match_effect_count, 6, route.route_id);
    assert.equal(route.event_counts.MATCH_START, 6, route.route_id);
    assert.equal(route.event_counts.MATCH_RETURN, 6, route.route_id);
    assert.equal(route.checkpoint_effect_count, 20, route.route_id);
    assert.equal(route.final_story_service_points,
      route.inherited_story_points_sentinel + route.expansion_story_points_gained, route.route_id);
    assert.deepEqual(route.speaker_visibility_violations, [], route.route_id);
  }
});

test('every choice option and every Match completion receives exhaustive balanced coverage', () => {
  const routes = report.presentation_audit.routes;
  for (const choice of blueprint.remembered_choices) {
    const counts = Object.fromEntries(choice.options.map((option) => [option.option_id, 0]));
    for (const route of routes) counts[route.choices[choice.choice_id]] += 1;
    assert.deepEqual(counts, Object.fromEntries(choice.options.map((option) => [option.option_id, 128])));
  }
  for (const episode of blueprint.episodes) {
    const counts = { COMPLETED: 0, ABANDONED: 0 };
    for (const route of routes) {
      const result = route.match_results.find((entry) => entry.match_ref === episode.match_ref);
      counts[result.completion] += 1;
    }
    assert.deepEqual(counts, { COMPLETED: 128, ABANDONED: 128 }, episode.match_ref);
  }
  assert.equal(new Set(routes.map((route) => route.outcome_vector)).size, 64);
});

test('speaker visibility and exact topology-locked art reuse have no gaps', () => {
  assert.equal(report.status, 'ZERO_NEW_ART_REQUESTS_EXISTING_INVENTORY_COMPLETE');
  assert.equal(report.asset_reuse.background_count, 4);
  assert.equal(report.asset_reuse.character_pose_count, 8);
  assert.equal(report.asset_reuse.transient_count, 0);
  assert.deepEqual(report.asset_reuse.backgrounds, [
    'story.bg.trinity.core_floor.night_storm',
    'story.bg.trinity.knowledge_systems.night',
    'story.bg.trinity.trace.night',
    'story.bg.trinity.validation_gate.predawn',
  ]);
  assert.deepEqual(report.asset_reuse.character_poses, [
    'story.character.hana_park:relief',
    'story.character.hana_park:skeptical',
    'story.character.jonah_reed:defensive',
    'story.character.jonah_reed:thoughtful',
    'story.character.malik_okoye:defensive',
    'story.character.malik_okoye:focused',
    'story.character.sora_chen:approving',
    'story.character.sora_chen:focused',
  ]);
  assert.deepEqual(report.asset_reuse.transient_asset_ids, []);
  assert.equal(report.asset_reuse.per_episode.length, blueprint.episodes.length);
  for (const episode of blueprint.episodes) {
    const actual = report.asset_reuse.per_episode.find((entry) => entry.episode_id === episode.episode_id);
    assert.ok(actual, episode.episode_id);
    assert.equal(actual.shift_number, episode.shift_number, episode.episode_id);
    assert.equal(actual.exact_blueprint_match, true, episode.episode_id);
    assert.deepEqual(actual.backgrounds, uniqueSorted(episode.art.background_asset_ids), episode.episode_id);
    assert.deepEqual(actual.character_poses, uniqueSorted(episode.art.character_pose_ids), episode.episode_id);
    assert.deepEqual(actual.transient_asset_ids, uniqueSorted(episode.art.transient_asset_ids), episode.episode_id);
  }
  assert.equal(report.asset_reuse.assets.length, 12);
  for (const asset of report.asset_reuse.assets) {
    assert.equal(asset.exact_existing_reuse, true, asset.asset_id);
    assert.equal(asset.review_state, 'approved', asset.asset_id);
    assert.ok(asset.alt_text.length > 0, asset.asset_id);
    assert.ok(asset.registry_alt_text_id.startsWith('text.'), asset.asset_id);
    assert.equal(asset.responsive_variants.length, 3, asset.asset_id);
    assert.deepEqual(asset.responsive_variants.map((variant) => variant.variant), [
      'desktop', 'mobile', 'reduced_data',
    ], asset.asset_id);
    assert.ok(asset.fallback_asset_id.startsWith('story.fallback.'), asset.asset_id);
    for (const variant of asset.responsive_variants) {
      assert.equal(variant.sha256.length, 64, `${asset.asset_id}:${variant.variant}`);
      assert.ok(fs.existsSync(path.join(ROOT, variant.path)), variant.path);
    }
  }
});

test('both delayed choices expose both distinct acknowledgement variants in transcripts', () => {
  const transcripts = readText(path.join(REVISION_ROOT, 'FULL_ROUTE_TRANSCRIPTS.md'));
  const audit = report.presentation_audit.delayed_acknowledgements;
  assert.equal(audit.choice_count, 2);
  assert.equal(audit.variant_count, 4);
  assert.equal(audit.routes_per_variant, 128);
  assert.equal(audit.choices.length, 2);
  for (const choice of audit.choices) {
    const blueprintChoice = blueprint.remembered_choices.find((entry) => entry.choice_id === choice.choice_id);
    assert.ok(blueprintChoice, choice.choice_id);
    assert.equal(choice.variant_count, 2, choice.choice_id);
    assert.equal(choice.variants.length, 2, choice.choice_id);
    assert.equal(new Set(choice.variants.map((variant) => variant.text)).size, 2, choice.choice_id);
    assert.deepEqual(uniqueSorted(choice.variants.map((variant) => variant.option_id)),
      uniqueSorted(blueprintChoice.options.map((option) => option.option_id)), choice.choice_id);
    for (const variant of choice.variants) {
      assert.equal(variant.route_count, 128, variant.statement_id);
      assert.equal(variant.wrong_value_route_count, 0, variant.statement_id);
      assert.equal(variant.missing_value_route_count, 0, variant.statement_id);
      const marker = `(\`${variant.statement_id}\`):`;
      assert.equal(transcripts.split(marker).length - 1, 128, variant.statement_id);
      assert.ok(transcripts.includes(variant.text), variant.text_id);
    }
  }
});

test('mobile, localization, motion, reduced-data, and fallback contracts remain text-complete', () => {
  const text = report.text_and_localization;
  assert.ok(text.localized_surface_count > 0);
  assert.ok(text.maximum_characters > 0 && text.maximum_characters <= 420);
  assert.equal(text.character_review_limit, 420);
  assert.deepEqual(text.over_limit_text_ids, []);
  assert.deepEqual(text.inline_newline_text_ids, []);
  assert.equal(text.stable_text_ids, true);
  assert.ok(text.unique_text_id_count > 0 && text.unique_text_id_count <= text.localized_surface_count);
  assert.equal(text.semantic_information_depends_on_art, false);

  const presentation = report.motion_and_failure_modes;
  assert.equal(presentation.motion_advances_authority, false);
  assert.equal(presentation.reduced_data_variant_required, true);
  assert.equal(presentation.missing_asset_behavior,
    'SAME_LAYER_DECORATIVE_FALLBACK_STORY_REMAINS_TEXT_COMPLETE');
  assert.ok(presentation.used_transitions.every((transition) =>
    ['CUT', 'FADE', 'DISSOLVE', 'SLIDE'].includes(transition)));
  assert.match(presentation.reduced_motion_equivalent, /Immediate replacement/);
});

test('human review documents enumerate every route and the exact zero-request disposition', () => {
  const transcripts = readText(path.join(REVISION_ROOT, 'FULL_ROUTE_TRANSCRIPTS.md'));
  const choreography = readText(path.join(REVISION_ROOT, 'CHOREOGRAPHY.md'));
  const altBriefs = readText(path.join(REVISION_ROOT, 'ALT_TEXT_BRIEFS.md'));
  const artRequests = readText(path.join(REVISION_ROOT, 'ART_REQUESTS.md'));

  assert.equal((transcripts.match(/^## route\.qc02\.(?:controlled_comparison_first|location_context_first)\.[ac]{6}\.(?:change_history_first|current_state_first) — [AC]{6}$/gmu) ?? []).length, 256);
  assert.equal((transcripts.match(/^- Canonical TASK-043 digest: `[a-f0-9]{64}`$/gmu) ?? []).length, 256);
  assert.equal((transcripts.match(/\*\*Choice `choice\.qc02\./gu) ?? []).length, 256 * 2);
  assert.equal((transcripts.match(/\*\*Match start:\*\*/gu) ?? []).length, 256 * 6);
  assert.equal((transcripts.match(/\*\*Match return:\*\*/gu) ?? []).length, 256 * 6);
  assert.equal((transcripts.match(/\*\*Current-content ending:\*\*/gu) ?? []).length, 256);
  assert.equal((choreography.match(/^## Shift (?:7|8|9|10|11|12):/gmu) ?? []).length, 6);
  assert.equal((choreography.match(/^- Per-episode topology lock: \*\*exact blueprint equality\*\*$/gmu) ?? []).length, 6);
  assert.equal((altBriefs.match(/^## story\.(?:asset\.character|bg\.)/gmu) ?? []).length, 12);
  assert.match(artRequests, /ZERO NEW ART REQUESTS/);
  assert.equal(report.art_request_disposition.request_count, 0);
  assert.equal(report.art_request_disposition.gap_count, 0);
  assert.deepEqual(report.art_request_disposition.requests, []);
  assert.equal(report.art_request_disposition.task_045_mode, 'VERIFY_EXISTING_ASSETS_DO_NOT_GENERATE');
});
