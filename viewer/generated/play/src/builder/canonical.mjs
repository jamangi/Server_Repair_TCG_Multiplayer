import { sha256Bytes, sha256Hex } from '../shared/sha256.mjs';

function normalize(value) {
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value).sort().map((key) => [key, normalize(value[key])]),
    );
  }
  if (typeof value === 'number' && !Number.isFinite(value)) {
    throw new TypeError('Canonical JSON does not permit non-finite numbers.');
  }
  return value;
}

export function canonicalJson(value) {
  return JSON.stringify(normalize(value));
}

export function sha256(value) {
  return sha256Hex(typeof value === 'string' ? value : canonicalJson(value));
}

export function deterministicUnitInterval(seed, namespace, counter) {
  const bytes = sha256Bytes(`${seed}\u0000${namespace}\u0000${counter}`);
  let numerator = 0n;
  for (let index = 0; index < 8; index += 1) {
    numerator = (numerator << 8n) | BigInt(bytes[index]);
  }
  return Number(numerator) / 18_446_744_073_709_551_616;
}

export function weightedChoice(items, weights, seed, namespace, counter) {
  if (items.length === 0 || items.length !== weights.length) {
    throw new RangeError('Weighted selection requires equally sized nonempty item and weight lists.');
  }
  if (weights.some((weight) => !Number.isFinite(weight) || weight <= 0)) {
    throw new RangeError('Selection weights must be finite positive numbers.');
  }
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  if (!Number.isFinite(total)) throw new RangeError('Selection-weight total is not finite.');
  const threshold = deterministicUnitInterval(seed, namespace, counter) * total;
  let cursor = 0;
  for (let index = 0; index < items.length; index += 1) {
    cursor += weights[index];
    if (threshold < cursor) return items[index];
  }
  return items.at(-1);
}
