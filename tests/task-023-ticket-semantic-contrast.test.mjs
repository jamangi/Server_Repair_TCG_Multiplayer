import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const css = await readFile(new URL('../viewer/css/play.css', import.meta.url), 'utf8');
const gamePage = await readFile(new URL('../viewer/js/play/pages/game-page.mjs', import.meta.url), 'utf8');

function luminance(hex) {
  const channels = [1, 3, 5].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16) / 255)
    .map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return channels.reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
}

function contrast(left, right) {
  const values = [luminance(left), luminance(right)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

function token(name) {
  const match = css.match(new RegExp(`--${name}:\\s*(#[0-9a-f]{6})`, 'i'));
  assert.ok(match, `missing --${name}`);
  return match[1];
}

test('paper and dark semantic-state tokens meet text and boundary contrast targets', () => {
  const states = [
    ['dark-candidate', 4.5],
    ['dark-hypothesis', 7],
    ['dark-eliminated', 4.5],
    ['paper-candidate', 4.5],
    ['paper-hypothesis', 7],
    ['paper-eliminated', 4.5],
    ['paper-accepted', 4.5],
    ['paper-returned', 4.5],
    ['paper-disabled', 4.5],
  ];
  for (const [state, minimum] of states) {
    assert.ok(
      contrast(token(`play-${state}-fg`), token(`play-${state}-bg`)) >= minimum,
      `${state} text must meet ${minimum}:1`,
    );
  }
  for (const state of ['candidate', 'hypothesis', 'eliminated', 'accepted', 'returned', 'disabled']) {
    assert.ok(
      contrast(token(`play-paper-${state}-border`), token(`play-paper-${state}-bg`)) >= 3,
      `paper ${state} border must meet 3:1`,
    );
  }
  assert.ok(
    contrast(token('play-paper-state-focus'), token('play-paper-candidate-bg')) >= 3,
    'paper focus indicator must meet 3:1',
  );
});

test('Ticket presentation exposes semantic surfaces, states, and visible non-color cues', () => {
  assert.match(gamePage, /data-semantic-surface="paper"/);
  assert.match(gamePage, /data-candidate-state="\$\{state\}"/);
  assert.match(gamePage, /<small>Hypothesis<\/small>/);
  assert.match(gamePage, /<small>Ruled out<\/small>/);
  assert.match(gamePage, /data-isolation-state=/);
  assert.match(css, /\.ticket-sheet \.candidate-chip\.is-hypothesis/);
  assert.match(css, /\.full-ticket-dialog \.candidate-row\.is-hypothesis/);
  assert.match(css, /\.candidate-chip\.is-eliminated[^}]*text-decoration:\s*line-through/s);
  assert.match(css, /ticket-status\[data-status="RETURNED_TO_DIAGNOSIS"\]::before/);
  assert.match(css, /@media \(forced-colors: active\)[\s\S]*\.ticket-sheet[\s\S]*\.candidate-chip/);
});
