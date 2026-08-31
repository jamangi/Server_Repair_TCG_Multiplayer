import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import { escapeHtml } from '../viewer/js/play/dom-utils.mjs';
import {
  getTicketSystemProjection,
  SYSTEM_MODEL_UNAVAILABLE_MESSAGE,
} from '../viewer/js/play/system-model-service.mjs';
import { systemModelDialogMarkup } from '../viewer/js/play/system-model-view.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
const readJson = (relativePath) => JSON.parse(read(relativePath));

const FORBIDDEN_PLAYER_TEXT = [
  'authored_action_requirements',
  'candidate_closure',
  'compatibility_proofs',
  'fingerprint\\.',
  'hidden_fault_bindings',
  'private-compatibility',
  'public_resolver_key',
  'resolver_key',
  'server_only_truth',
  'validation_result',
  'validation_trace',
];

function assertRendered(markup, value, context) {
  assert.ok(markup.includes(escapeHtml(String(value))), `${context}: ${value}`);
}

test('all 18 released Story Tickets render every public System narrative, topology, component, rationale, and learning reference', () => {
  const catalog = readJson('content/system-model-story-v1/public-system-projections-v1.json');
  const coverage = readJson('docs/story/coverage/released-story-domain-coverage-v3.json');
  assert.equal(coverage.matches.length, 12);
  assert.equal(coverage.matches.flatMap((episode) => episode.tickets).length, 18);
  assert.equal(catalog.ticket_bindings.length, 18);
  assert.equal(catalog.profile_projections.length, 3);

  for (const episode of coverage.matches) {
    for (const ticket of episode.tickets) {
      const resolution = getTicketSystemProjection(catalog, {
        ticketDefinitionId: ticket.ticket_id,
        ticketSnapshotDigest: ticket.ticket_snapshot_digest,
      });
      assert.equal(resolution.status, 'AVAILABLE', `${episode.match_ref}: ${ticket.ticket_id}`);
      assert.match(systemModelDialogMarkup(resolution.projection), /data-close-dialog="system"/u);
    }
  }

  const renderedProfiles = new Set();
  for (const binding of catalog.ticket_bindings) {
    const resolution = getTicketSystemProjection(catalog, {
      ticketDefinitionId: binding.ticket_id,
      ticketSnapshotDigest: binding.ticket_snapshot_digest,
    });
    assert.equal(resolution.status, 'AVAILABLE', binding.ticket_id);
    const { projection } = resolution;
    renderedProfiles.add(projection.profile.profile_id);
    const firstRationale = Object.values(projection.rationales).flat()[0];
    const legal = new Set(firstRationale ? [firstRationale.action_definition_id] : []);
    const markup = systemModelDialogMarkup(projection, { legalActionDefinitionIds: legal });

    assertRendered(markup, projection.profile.display_name, `${binding.ticket_id} profile`);
    assertRendered(markup, projection.profile.model_scope, `${binding.ticket_id} scope`);
    assertRendered(markup, projection.intro, `${binding.ticket_id} intro`);
    assertRendered(markup, projection.descriptions.concise, `${binding.ticket_id} concise description`);
    assertRendered(markup, projection.descriptions.extended, `${binding.ticket_id} extended description`);
    assertRendered(markup, projection.lifecycle.heading, `${binding.ticket_id} lifecycle heading`);
    assertRendered(markup, projection.lifecycle.not_applicable_note, `${binding.ticket_id} lifecycle note`);
    for (const stage of projection.lifecycle.entries) {
      assertRendered(markup, stage.text, `${binding.ticket_id} lifecycle ${stage.stage_id}`);
      if (stage.condition) assertRendered(markup, stage.condition, `${binding.ticket_id} lifecycle condition ${stage.stage_id}`);
    }

    assert.equal((markup.match(/class="system-topology__node"/gu) ?? []).length, projection.topology.nodes.length);
    for (const node of projection.topology.nodes) {
      assertRendered(markup, node.label, `${binding.ticket_id} topology node ${node.node_id}`);
    }
    for (const sentence of projection.topology.text_equivalent.ordered_node_sentences) {
      assertRendered(markup, sentence, `${binding.ticket_id} node text equivalent`);
    }
    for (const sentence of projection.topology.text_equivalent.ordered_edge_sentences) {
      assertRendered(markup, sentence, `${binding.ticket_id} edge text equivalent`);
    }
    for (const sentence of projection.topology.text_equivalent.ordered_path_sentences) {
      assertRendered(markup, sentence, `${binding.ticket_id} path text equivalent`);
    }
    for (const sentence of projection.topology.text_equivalent.abstraction_sentences) {
      assertRendered(markup, sentence, `${binding.ticket_id} abstraction text equivalent`);
    }

    for (const component of projection.components) {
      assertRendered(markup, component.label, `${binding.ticket_id} component ${component.role_id}`);
      assertRendered(markup, component.purpose, `${binding.ticket_id} component purpose ${component.role_id}`);
      assertRendered(markup, component.serviceability_note, `${binding.ticket_id} serviceability ${component.role_id}`);
      if (component.component_definition_id) {
        assert.ok(markup.includes(`href="#/library/${encodeURIComponent(component.component_definition_id)}"`));
      }
    }

    assert.deepEqual(Object.keys(projection.rationales).sort(), ['COMMAND', 'REPAIR', 'TEST', 'VERIFICATION']);
    for (const [kind, graphs] of Object.entries(projection.rationales)) {
      assert.ok(markup.includes(`id="system-rationale-${kind.toLowerCase()}"`));
      for (const graph of graphs) {
        assertRendered(markup, graph.sentence, `${binding.ticket_id} rationale ${graph.attachment_id}`);
        assertRendered(markup, graph.legality_label, `${binding.ticket_id} legality ${graph.attachment_id}`);
        assert.ok(markup.includes(`data-action-definition-id="${escapeHtml(graph.action_definition_id)}"`));
      }
    }
    for (const reference of projection.learning_references) {
      assertRendered(markup, reference.title, `${binding.ticket_id} learning reference ${reference.source_id}`);
      assert.ok(markup.includes(`href="${escapeHtml(reference.url)}"`));
    }

    assert.match(markup, /Informational · 0 Actions/u);
    assert.match(markup, /A map, not Evidence/u);
    assert.match(markup, /Relevant to this system/u);
    assert.match(markup, /Legal now for this Ticket/u);
    assert.match(markup, /Not currently legal for this Ticket/u);
    assert.match(markup, /do not predict a result, count as Evidence, identify the correct diagnosis, or make an action legal/u);
    for (const forbidden of FORBIDDEN_PLAYER_TEXT) assert.doesNotMatch(markup, new RegExp(forbidden, 'iu'));
  }
  assert.equal(renderedProfiles.size, 3);
});

test('the System renderer is invariant to injected private-looking fields and unknown Tickets fail to the one honest message', () => {
  const catalog = readJson('content/system-model-story-v1/public-system-projections-v1.json');
  const binding = catalog.ticket_bindings[0];
  const resolution = getTicketSystemProjection(catalog, { ticketDefinitionId: binding.ticket_id });
  assert.equal(resolution.status, 'AVAILABLE');
  const baseline = systemModelDialogMarkup(resolution.projection);
  const poisoned = structuredClone(resolution.projection);
  poisoned.validation_trace = { hidden_fault_id: 'fault.private.do-not-render' };
  poisoned.server_only_truth = { solution_id: 'solution.private.do-not-render' };
  poisoned.profile.private_note = 'private profile text must not render';
  assert.equal(systemModelDialogMarkup(poisoned), baseline);

  const uncovered = getTicketSystemProjection(catalog, { ticketDefinitionId: 'ticket.uncovered.fixture' });
  assert.deepEqual(uncovered, { status: 'UNAVAILABLE', message: SYSTEM_MODEL_UNAVAILABLE_MESSAGE });
});

test('the canonical and staged public payloads contain zero causal fingerprint tokens', () => {
  const source = read('content/system-model-story-v1/public-system-projections-v1.json');
  const staged = read('viewer/generated/play/content/system-model-story-v1/public-system-projections-v1.json');
  assert.doesNotMatch(source, /fingerprint\./iu);
  assert.doesNotMatch(staged, /fingerprint\./iu);
  assert.doesNotMatch(source, /ticket_focus_statement|fingerprint_id/iu);
  assert.doesNotMatch(staged, /ticket_focus_statement|fingerprint_id/iu);
});

test('the player integration imports only the public service and cannot submit gameplay from the System view', () => {
  const gameSource = read('viewer/js/play/pages/game-page.mjs');
  const appSource = read('viewer/js/play/play-app.mjs');
  const viewSource = read('viewer/js/play/system-model-view.mjs');
  const combined = `${gameSource}\n${appSource}\n${viewSource}`;

  assert.match(gameSource, /from ['"]\.\.\/system-model-service\.mjs['"]/u);
  assert.match(appSource, /from ['"]\.\/system-model-service\.mjs['"]/u);
  assert.doesNotMatch(combined, /src\/system-models|content\/system-model-story-v1|private-compatibility|server-runtime/iu);
  assert.doesNotMatch(viewSource, /submit\s*\(|data-intent-id|postMessage|legal_intents/iu);
  assert.match(gameSource, /context\.announce\('System view opened\. Informational only; no Action was spent\.'\)/u);
  assert.match(gameSource, /systemResolution\.status === 'AVAILABLE'/u);
  assert.match(gameSource, /SYSTEM_MODEL_UNAVAILABLE_MESSAGE/u);
  const criticalInitialization = appSource.slice(
    appSource.indexOf('async function initialize()'),
    appSource.indexOf('function loadOptionalSystemModelCatalog()'),
  );
  assert.doesNotMatch(criticalInitialization, /loadSystemModelProjectionCatalog/u);
  assert.match(appSource, /renderCurrent\(\);\s+loadOptionalSystemModelCatalog\(\);/u);
  assert.match(gameSource, /catch \{\s+systemResolution = \{ status: 'UNAVAILABLE'/u);
});

test('Show system reuses only the central popup SFX recipes and intentional inspection silence remains documented', () => {
  const catalog = readJson('docs/audio/sfx-ui-catalog.json');
  const open = catalog.interactions.find((interaction) => interaction.id === 'game.popup.open');
  const close = catalog.interactions.find((interaction) => interaction.id === 'game.popup.close');
  assert.ok(open?.selector.includes('[data-view-system]'));
  assert.ok(close?.selector.includes("[data-close-dialog='system']"));
  assert.equal(catalog.interactions.filter((interaction) => interaction.id.includes('system')).length, 0);
  assert.match(read('docs/audio/SFX_UI_CATALOG.md'), /topology focus, scrolling, rationale disclosures, and passive projection rendering add no new sound meaning/iu);
});

test('TASK-055 documentation links resolve repository-locally', () => {
  const markdownPaths = [
    'docs/tasks/TASK-055-add-show-system-ticket-experience.md',
    'docs/system-models/task-055/README.md',
    'docs/system-models/task-055/BROWSER_QA.md',
    'tests/visual/task-055/README.md',
  ];
  for (const relativePath of markdownPaths) {
    const absolutePath = path.join(ROOT, relativePath);
    const source = fs.readFileSync(absolutePath, 'utf8');
    for (const match of source.matchAll(/\[[^\]]*\]\(([^)]+)\)/gu)) {
      const href = match[1].trim().replace(/^<|>$/gu, '');
      if (/^(?:https?:|mailto:|#)/iu.test(href)) continue;
      const target = decodeURIComponent(href.split('#')[0]);
      assert.equal(
        fs.existsSync(path.resolve(path.dirname(absolutePath), target)),
        true,
        `${relativePath} has missing link ${href}`,
      );
    }
  }
});
