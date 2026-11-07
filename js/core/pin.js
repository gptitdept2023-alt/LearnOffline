/**
 * Parent PIN hashing. The PIN is never stored in plain text: we store a
 * random salt and SHA-256(salt + pin). This keeps kids out of the parent
 * area; it is not meant to resist a determined attacker with device access.
 */

const toHex = (buffer) => Array.from(new Uint8Array(buffer), (b) => b.toString(16).padStart(2, '0')).join('');

/** Random 16-byte salt as hex. */
export const newSalt = () => toHex(crypto.getRandomValues(new Uint8Array(16)));

/** Hash a PIN with its salt. */
export const hashPin = async (pin, salt) => {
  const data = new TextEncoder().encode(`${salt}:${pin}`);
  return toHex(await crypto.subtle.digest('SHA-256', data));
};

/** A valid PIN is 4 to 6 digits. */
export const isValidPin = (pin) => /^\d{4,6}$/.test(pin);
