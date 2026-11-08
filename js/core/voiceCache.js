/**
 * Recorded voice clips live in their own cache, filled in the background by
 * the page, not by the service worker install.
 *
 * Why: the install must be quick. The voice pack is thousands of small files
 * (40+ MB). Downloading it inside the install made every update fetch all of
 * it again, and on a slow phone connection the install could run out of time
 * and fail, leaving the device stuck on the old version. Clip names are
 * content hashes, so a clip never changes: once cached it is kept across app
 * versions, and only new clips are downloaded.
 */

export const VOICE_CACHE = 'learnoffline-voice';

const BATCH = 8;            // clips fetched at once: gentle on a phone connection
const START_DELAY_MS = 4000; // let the app finish starting first

const keyOf = (request) => new URL(request.url).pathname.split('/').pop().replace(/\.ogg$/, '');

/**
 * Make the voice cache hold exactly the clips in `keys`: remove clips the
 * pack no longer has, then download the missing ones in small batches.
 * Stops quietly when offline; the next app start carries on.
 * @param {string[]} keys Clip keys from the voice manifest.
 * @param {string} baseUrl Folder of the clips, e.g. './audio/voice/'.
 * @returns {Promise<{added: number, missing: number}>}
 */
export const fillVoiceCache = async (keys, baseUrl) => {
  if (typeof caches === 'undefined' || !keys.length) return { added: 0, missing: 0 };
  const cache = await caches.open(VOICE_CACHE);
  const wanted = new Set(keys);
  const stored = await cache.keys();
  await Promise.all(stored.filter((r) => !wanted.has(keyOf(r))).map((r) => cache.delete(r)));
  const have = new Set(stored.map(keyOf));
  const missing = keys.filter((k) => !have.has(k));

  let added = 0;
  for (let i = 0; i < missing.length; i += BATCH) {
    if (navigator.onLine === false) break;
    await Promise.all(missing.slice(i, i + BATCH).map(async (key) => {
      const url = new URL(`${baseUrl}${key}.ogg`, document.baseURI).href;
      try {
        // An earlier app version may still hold the clip in its own cache.
        const response = (await caches.match(url)) || await fetch(url);
        if (response.ok) {
          await cache.put(url, response);
          added += 1;
        }
      } catch { /* skipped: the device voice reads this sentence instead */ }
    }));
  }
  return { added, missing: missing.length };
};

/** Start filling the voice cache shortly after start-up, unless the device asks to save data. */
export const fillVoiceCacheLater = (keys, baseUrl) => {
  if (navigator.connection?.saveData) return;
  setTimeout(() => {
    fillVoiceCache(keys, baseUrl).catch((error) => console.warn('Voice clips were not saved for offline use:', error));
  }, START_DELAY_MS);
};
