/**
 * Service worker: precaches the whole app and all content packs at install,
 * then serves everything cache-first, so the app runs with no internet.
 *
 * To ship an update: change files, bump CACHE_VERSION. Browsers download the
 * new version in the background and the app offers a "Reload" button.
 * tests/packs.test.mjs fails if a file is missing from PRECACHE.
 */

const CACHE_VERSION = 'v16';
const VOICE_MANIFEST = './audio/voice/manifest.json';
const CACHE_NAME = `learnoffline-${CACHE_VERSION}`;

const PRECACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/base.css',
  './css/components.css',
  './css/screens.css',
  './css/visuals.css',
  './css/interactive.css',
  './css/engage.css',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/icon.svg',
  './js/app.js',
  './js/core/dom.js',
  './js/core/hash.js',
  './js/core/i18n.js',
  './js/core/pin.js',
  './js/core/random.js',
  './js/core/router.js',
  './js/core/sfx.js',
  './js/core/speech.js',
  './js/core/state.js',
  './js/data/backup.js',
  './js/data/db.js',
  './js/data/packs.js',
  './js/data/repo.js',
  './js/engine/answers.js',
  './js/engine/games.js',
  './js/engine/goals.js',
  './js/engine/levels.js',
  './js/engine/generators.js',
  './js/engine/longDivision.js',
  './js/engine/shortcuts.js',
  './js/engine/mastery.js',
  './js/engine/practice.js',
  './js/engine/quests.js',
  './js/engine/rewards.js',
  './js/engine/shop.js',
  './js/engine/techniques.js',
  './js/engine/topics/geometry.js',
  './js/engine/topics/graphs.js',
  './js/engine/topics/index.js',
  './js/engine/topics/measurement.js',
  './js/engine/topics/money.js',
  './js/engine/topics/shared.js',
  './js/engine/topics/time.js',
  './js/ui/components/cards.js',
  './js/ui/components/celebrate.js',
  './js/ui/components/common.js',
  './js/ui/components/interactive.js',
  './js/ui/components/map.js',
  './js/ui/components/mascot.js',
  './js/ui/components/visuals.js',
  './js/ui/components/visualsTopics.js',
  './js/ui/screens/badges.js',
  './js/ui/screens/games.js',
  './js/ui/screens/guided.js',
  './js/ui/screens/home.js',
  './js/ui/screens/lesson.js',
  './js/ui/screens/levels.js',
  './js/ui/screens/parent.js',
  './js/ui/screens/practice.js',
  './js/ui/screens/results.js',
  './js/ui/screens/resultsText.js',
  './js/ui/screens/shop.js',
  './js/ui/screens/start.js',
  './js/ui/screens/topic.js',
  './packs/index.json',
  './packs/math-k2.json',
  './packs/math-g4.json',
];

self.addEventListener('install', (event) => {
  // cache: 'reload' bypasses the HTTP cache so a new version never stores stale files.
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(PRECACHE.map((url) => new Request(url, { cache: 'reload' })));
    await cacheVoicePack(cache);
  })());
});

/**
 * Cache the recorded voice clips listed in the voice manifest. Clips are
 * fetched in small batches so a slow phone connection is not flooded. A clip
 * that fails is skipped: the app falls back to the device voice for it.
 */
const cacheVoicePack = async (cache) => {
  try {
    const response = await fetch(VOICE_MANIFEST, { cache: 'reload' });
    if (!response.ok) return;
    await cache.put(VOICE_MANIFEST, response.clone());
    const { keys = [] } = await response.json();
    const BATCH = 24;
    for (let i = 0; i < keys.length; i += BATCH) {
      await Promise.all(keys.slice(i, i + BATCH).map((key) =>
        cache.add(new Request(`./audio/voice/${key}.ogg`, { cache: 'reload' })).catch(() => {})));
    }
  } catch { /* voice pack is optional */ }
};

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith('learnoffline-') && k !== CACHE_NAME).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    // Page loads always get the app shell (hash routing means one HTML file).
    if (request.mode === 'navigate') {
      return (await cache.match('./index.html')) || fetch(request);
    }
    const cached = await cache.match(request, { ignoreSearch: true });
    if (cached) return cached;
    try {
      const response = await fetch(request);
      if (response.ok) cache.put(request, response.clone());
      return response;
    } catch {
      return new Response('Offline and not cached.', { status: 503, statusText: 'Offline' });
    }
  })());
});
