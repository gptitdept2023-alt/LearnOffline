/**
 * Stable 64-bit-ish hash (two FNV-1a variants) as 16 hex characters.
 * Used to name recorded voice clips by the text they say, so the build
 * script (tools/) and the app agree on file names without a lookup table.
 */
export const textKey = (text) => {
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193 ^ 0x5bd1e995;
  for (let i = 0; i < text.length; i += 1) {
    const c = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0;
    h2 = Math.imul(h2 ^ c, 0x5bd1e995) >>> 0;
    h2 ^= h2 >>> 13;
  }
  return h1.toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0');
};
