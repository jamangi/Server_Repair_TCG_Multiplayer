import assert from 'node:assert/strict';
import test from 'node:test';

import {
  BENCH_TILE_MIN_DESKTOP_WIDTH,
  benchPageSizeForViewport,
} from '../viewer/js/play/bench-view.mjs';

test('desktop Bench capacity is bounded by the documented minimum tile width', () => {
  assert.equal(BENCH_TILE_MIN_DESKTOP_WIDTH, 144);
  assert.equal(benchPageSizeForViewport(1366), 4);
  assert.equal(benchPageSizeForViewport(1449), 4);
  assert.equal(benchPageSizeForViewport(1450), 5);
  assert.equal(benchPageSizeForViewport(1699), 5);
  assert.equal(benchPageSizeForViewport(1700), 6);
  assert.equal(benchPageSizeForViewport(1920), 6);
  assert.equal(benchPageSizeForViewport(2560), 6);
});

test('responsive document flow keeps the existing six-item semantic page', () => {
  assert.equal(benchPageSizeForViewport(1180), 6);
  assert.equal(benchPageSizeForViewport(760), 6);
  assert.equal(benchPageSizeForViewport(390), 6);
});
