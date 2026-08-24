import { sha256Bytes, sha256Hex } from '../shared/sha256.mjs';

export function deepClone(value) {
  return structuredClone(value);
}

export function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, canonicalize(value[key])]),
  );
}

export function canonicalJson(value) {
  return JSON.stringify(canonicalize(value));
}

export function digest(value) {
  return sha256Hex(canonicalJson(value));
}

function randomWord(seed, stream, counter) {
  const bytes = sha256Bytes(`${String(seed)}\0${String(stream)}\0${String(counter)}`);
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(0, false);
}

/**
 * Deterministic, rejection-sampled integer selection. The returned counter is
 * authoritative state and must remain server-only.
 */
export function randomInt(seed, stream, counter, maximumExclusive) {
  if (!Number.isSafeInteger(maximumExclusive) || maximumExclusive <= 0) {
    throw new RangeError('maximumExclusive must be a positive safe integer');
  }
  const range = 0x1_0000_0000;
  const ceiling = Math.floor(range / maximumExclusive) * maximumExclusive;
  let cursor = counter;
  while (true) {
    const word = randomWord(seed, stream, cursor);
    cursor += 1;
    if (word < ceiling) return { value: word % maximumExclusive, counter: cursor };
  }
}

export function deterministicShuffle(values, seed, stream, counter = 0) {
  const shuffled = [...values];
  let cursor = counter;
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const selected = randomInt(seed, stream, cursor, index + 1);
    cursor = selected.counter;
    [shuffled[index], shuffled[selected.value]] = [shuffled[selected.value], shuffled[index]];
  }
  return { values: shuffled, counter: cursor };
}

export function replayDigest(state) {
  return digest({
    match_id: state.match_id,
    ruleset_version: state.ruleset_version,
    card_catalog_version: state.card_catalog_version,
    ticket_source: state.ticket_source,
    events: state.events,
    result: state.result,
  });
}
