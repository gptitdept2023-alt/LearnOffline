/**
 * Randomness helpers used by question generators.
 *
 * Generators take an `rng` function (default Math.random) so tests can pass a
 * seeded one and get the same questions every run.
 */

/** Small, fast seeded PRNG (mulberry32). Returns floats in [0, 1). */
export const seededRng = (seed) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/** Integer in [min, max], inclusive. */
export const randInt = (min, max, rng = Math.random) => Math.floor(rng() * (max - min + 1)) + min;

/** One random element of a non-empty array. */
export const pick = (items, rng = Math.random) => items[Math.floor(rng() * items.length)];

/** New array with the items in random order (Fisher-Yates). */
export const shuffle = (items, rng = Math.random) => {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

/** Unique id that sorts by creation time. */
export const uid = (prefix = 'id') =>
  `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
