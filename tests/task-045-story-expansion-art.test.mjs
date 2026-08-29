import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  TASK_045_ART_AUDIT_OUTPUTS,
  TASK_045_IMMUTABLE_BASELINE,
  buildTask045ArtAudit,
  generateTask045ArtAudit,
  loadTask045ArtAuditInputs,
  renderTask045ArtAudit,
  stableTask045ArtAuditJson,
} from '../src/story/generate-task-045-art-audit.mjs';

let audit;
let inputs;

test.before(async () => {
  inputs = await loadTask045ArtAuditInputs();
  audit = await buildTask045ArtAudit(inputs);
});

test('joins every candidate visual statement to six exact TASK-043 episode and Ticket pins', () => {
  const join = audit.candidate_reference_join;
  assert.equal(join.episode_count, 6);
  assert.equal(join.statement_reference_count, 70);
  assert.equal(join.scene_reference_count, 24);
  assert.equal(join.character_show_reference_count, 46);
  assert.equal(join.transient_show_reference_count, 0);
  assert.equal(join.every_reference_joined, true);
  assert.ok(join.episodes.every((episode) => episode.exact_task_043_pin && episode.exact_task_044_art_request));
  assert.equal(new Set(join.episodes.map((episode) => episode.match_ref)).size, 6);
  assert.equal(new Set(join.episodes.map((episode) => episode.ticket_definition_id)).size, 6);
  assert.ok(join.episodes.every((episode) => /^[a-f0-9]{64}$/.test(episode.ticket_snapshot_digest)));
  assert.deepEqual(join.episodes.map((episode) => episode.reference_counts.total), [11, 11, 12, 12, 12, 12]);
});

test('proves the exact zero-gap 4-background plus 8-pose production set', () => {
  assert.deepEqual(audit.asset_audit.production_counts, {
    backgrounds: 4,
    characters: 8,
    transients: 0,
    total: 12,
  });
  assert.equal(audit.asset_audit.assets.length, 12);
  assert.equal(audit.asset_audit.same_layer_fallback_count, 2);
  assert.deepEqual(audit.asset_audit.candidate_unused_registered_asset_ids, []);
  assert.deepEqual(audit.asset_audit.new_master_asset_ids, []);
  assert.deepEqual(audit.asset_audit.replaced_master_asset_ids, []);
  assert.deepEqual(audit.asset_audit.transient_asset_ids, []);
  assert.equal(audit.asset_audit.gap_count, 0);
  assert.equal(audit.asset_audit.generation_count, 0);
});

test('verifies every master, responsive derivative, crop, alt, and same-layer fallback join', () => {
  assert.equal(audit.asset_audit.responsive_production_file_count, 36);
  assert.equal(audit.asset_audit.responsive_fallback_file_count, 6);
  assert.ok(audit.asset_audit.assets.every((asset) => asset.exact_existing_reuse
    && asset.derivatives.length === 3
    && asset.alt_text.length > 0
    && asset.decorative === false
    && asset.master.bytes > 0
    && /^[a-f0-9]{64}$/.test(asset.master.sha256)));
  assert.deepEqual(audit.asset_audit.fallbacks.map((entry) => entry.asset_id), [
    'story.fallback.background',
    'story.fallback.character',
  ]);
  assert.ok(audit.asset_audit.fallbacks.every((entry) => entry.decorative
    && entry.alt_text === '' && entry.same_layer_only && entry.derivatives.length === 3));
  assert.equal(audit.resolver_contract.production_resolutions_verified, 36);
  assert.equal(audit.resolver_contract.missing_id_same_layer_fallbacks_verified, 2);
});

test('preserves approved provenance, licensing, safety review, and Pages budget', () => {
  const provenance = audit.provenance_and_license;
  assert.equal(provenance.selected_asset_review_count, 12);
  assert.equal(provenance.all_selected_assets_approved, true);
  assert.equal(provenance.source_pixels_used_count, 0);
  assert.equal(provenance.license_audit.result, 'pass');
  assert.equal(provenance.license_audit.project_owned_reference_count, 6);
  assert.deepEqual(provenance.review_findings, {
    no_hidden_solution: true,
    no_pseudo_text: true,
    no_third_party_brand_claim: true,
    no_named_artist_imitation: true,
    safe_technical_practice: true,
  });
  assert.equal(audit.repository_budget.result, 'pass');
  assert.ok(audit.repository_budget.complete_task_030_delivery_bytes < audit.repository_budget.pages_budget_bytes);
  assert.ok(audit.repository_budget.remaining_pages_budget_bytes > 0);
});

test('pins the unchanged TASK-030 manifest, resolver, inventory, and provenance', () => {
  assert.deepEqual(Object.fromEntries(audit.immutable_task_030_runtime_baseline.map((entry) => [
    entry.path,
    entry.sha256,
  ])), TASK_045_IMMUTABLE_BASELINE);
  assert.ok(audit.immutable_task_030_runtime_baseline.every((entry) => entry.unchanged));
  assert.deepEqual(audit.task_030_baseline_verification.errors, []);
  assert.deepEqual({
    production: audit.task_030_baseline_verification.summary.production,
    fallback: audit.task_030_baseline_verification.summary.fallback,
    approved: audit.task_030_baseline_verification.summary.approved,
  }, { production: 23, fallback: 3, approved: 26 });
});

test('keeps candidate content outside live loaders and authorizes no unrelated mutation', () => {
  assert.deepEqual(audit.release_boundary.candidate_staging_entries, []);
  assert.deepEqual(audit.release_boundary.candidate_loader_references, []);
  assert.equal(audit.release_boundary.task_043_live_loader_eligible, false);
  assert.equal(audit.release_boundary.live_release_owner, 'TASK-046');
  assert.deepEqual(audit.disposition, {
    mode: 'VERIFICATION_ONLY',
    generate_or_edit_raster_art: false,
    update_manifest_or_resolver: false,
    update_story_topology_or_dialogue: false,
    update_domain_or_gameplay: false,
    stage_candidate_content: false,
    unresolved_items: [],
    owner_approval_required: false,
  });
});

test('fails closed on a new art request or a TASK-043 Ticket-pin drift', async () => {
  const requestDrift = structuredClone(inputs);
  requestDrift.artRequests.value.art_request_disposition.request_count = 1;
  requestDrift.artRequests.value.art_request_disposition.requests = [{ asset_id: 'story.new.unapproved' }];
  await assert.rejects(() => buildTask045ArtAudit(requestDrift), /zero-generation art disposition/);

  const ticketDrift = structuredClone(inputs);
  ticketDrift.matchRegistry.value.matches[0].expected_ticket_snapshot_digests[0] = '0'.repeat(64);
  await assert.rejects(() => buildTask045ArtAudit(ticketDrift), /Ticket digest diverges/);
});

test('commits byte-stable machine and Markdown audit outputs', async () => {
  assert.equal(await readFile(TASK_045_ART_AUDIT_OUTPUTS.json, 'utf8'), stableTask045ArtAuditJson(audit));
  assert.equal(await readFile(TASK_045_ART_AUDIT_OUTPUTS.markdown, 'utf8'), renderTask045ArtAudit(audit));
  const checked = await generateTask045ArtAudit({ check: true });
  assert.equal(checked.asset_audit.gap_count, 0);
  assert.equal(checked.asset_audit.generation_count, 0);
});
