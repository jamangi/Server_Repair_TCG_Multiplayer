export const BENCH_TILE_MIN_DESKTOP_WIDTH = 144;

/**
 * Bound the one-row desktop shelf by a tested usable tile width. Responsive
 * document-flow layouts retain six semantic tiles and may wrap them.
 */
export function benchPageSizeForViewport(viewportWidth) {
  const width = Number(viewportWidth) || 0;
  if (width <= 1180) return 6;
  if (width < 1450) return 4;
  if (width < 1700) return 5;
  return 6;
}
