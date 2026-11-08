/**
 * Service worker: precaches the whole app and all content packs at install,
 * then serves everything cache-first, so the app runs with no internet.
 *
 * To ship an update: change files, bump CACHE_VERSION. Browsers download the
 * new version in the background and the app offers a "Reload" button.
 *
 * The recorded voice clips are NOT part of the install: they live in their own
 * cache (VOICE_CACHE), kept across versions and filled in the background by the
 * page (js/core/voiceCache.js). That keeps an update small and quick, so it
 * cannot time out on a slow phone connection.
 * tests/packs.test.mjs fails if a file is missing from PRECACHE.
 */

const CACHE_VERSION = 'v29';
const CACHE_NAME = `learnoffline-${CACHE_VERSION}`;
const VOICE_CACHE = 'learnoffline-voice'; // same name as js/core/voiceCache.js
const VOICE_CLIP = /\/audio\/voice\/[^/]+\.ogg$/;

const PRECACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './audio/voice/manifest.json', // the list of clips; the clips themselves: see VOICE_CACHE
  './css/base.css',
  './css/components.css',
  './css/screens.css',
  './css/visuals.css',
  './css/interactive.css',
  './css/engage.css',
  './css/report.css',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/icon.svg',
  './js/app.js',
  './js/core/dom.js',
  './js/core/hash.js',
  './js/core/i18n.js',
  './js/core/voiceCache.js',
  './js/core/pin.js',
  './js/core/random.js',
  './js/core/router.js',
  './js/core/sfx.js',
  './js/core/speech.js',
  './js/core/state.js',
  './js/data/backup.js',
  './js/data/db.js',
  './js/data/packs.js',
  './js/data/customPacks.js',
  './js/data/repo.js',
  './js/engine/answers.js',
  './js/engine/games.js',
  './js/engine/goals.js',
  './js/engine/weekReport.js',
  './js/engine/levels.js',
  './js/engine/generators.js',
  './js/engine/longDivision.js',
  './js/engine/shortcuts.js',
  './js/engine/mastery.js',
  './js/engine/practice.js',
  './js/engine/quests.js',
  './js/engine/rewards.js',
  './js/engine/shop.js',
  './js/engine/robot.js',
  './js/engine/crew.js',
  './js/engine/techniques.js',
  './js/engine/topics/geometry.js',
  './js/engine/topics/graphs.js',
  './js/engine/topics/english.js',
  './js/engine/topics/englishData.js',
  './js/engine/topics/englishPlus.js',
  './js/engine/topics/decimalsPercent.js',
  './js/engine/topics/fractionsPlus.js',
  './js/engine/topics/index.js',
  './js/engine/topics/measurement.js',
  './js/engine/topics/money.js',
  './js/engine/topics/ratioAlgebra.js',
  './js/engine/topics/shared.js',
  './js/engine/topics/solids.js',
  './js/engine/topics/science.js',
  './js/engine/topics/scienceData.js',
  './js/engine/topics/scienceDataUpper.js',
  './js/engine/topics/time.js',
  './js/ui/components/cards.js',
  './js/ui/components/celebrate.js',
  './js/ui/components/common.js',
  './js/ui/components/interactive.js',
  './js/ui/components/map.js',
  './js/ui/components/mascot.js',
  './js/ui/components/robot.js',
  './js/ui/components/crew.js',
  './js/ui/components/crewPicker.js',
  './js/ui/components/visuals.js',
  './js/ui/components/visualsTopics.js',
  './js/ui/components/visualsWords.js',
  './js/ui/components/visualsSolids.js',
  './js/ui/screens/badges.js',
  './js/ui/screens/games.js',
  './js/ui/screens/guided.js',
  './js/ui/screens/home.js',
  './js/ui/screens/lesson.js',
  './js/ui/screens/levels.js',
  './js/ui/screens/parent.js',
  './js/ui/screens/parentPacks.js',
  './js/ui/screens/report.js',
  './js/ui/screens/practice.js',
  './js/ui/screens/results.js',
  './js/ui/screens/resultsText.js',
  './js/ui/screens/shop.js',
  './js/ui/screens/workshop.js',
  './js/ui/screens/crewWorkshop.js',
  './js/ui/screens/start.js',
  './js/ui/screens/topic.js',
  './packs/index.json',
  './packs/math-k2.json',
  './packs/english-k2.json',
  './packs/english-g1.json',
  './packs/english-g2.json',
  './packs/english-g3.json',
  './packs/math-g1.json',
  './packs/math-g2.json',
  './packs/math-g3.json',
  './packs/math-g4.json',
  './packs/math-g5.json',
  './packs/math-g6.json',
  './packs/science-g1.json',
  './packs/science-g2.json',
  './packs/science-g3.json',
  './packs/science-g4.json',
  './packs/science-g5.json',
  './packs/science-g6.json',
];

self.addEventListener('install', (event) => {
  // cache: 'reload' bypasses the HTTP cache so a new version never stores stale files.
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(PRECACHE.map((url) => new Request(url, { cache: 'reload' })));
  })());
});

/**
 * Move voice clips that older versions kept in their own caches into the
 * shared voice cache, so an update never downloads them again.
 */
const keepOldVoiceClips = async (oldCacheName) => {
  const [oldCache, voice] = await Promise.all([caches.open(oldCacheName), caches.open(VOICE_CACHE)]);
  const clips = (await oldCache.keys()).filter((r) => VOICE_CLIP.test(new URL(r.url).pathname));
  const BATCH = 50;
  for (let i = 0; i < clips.length; i += BATCH) {
    await Promise.all(clips.slice(i, i + BATCH).map(async (request) => {
      if (await voice.match(request)) return;
      const response = await oldCache.match(request);
      if (response) await voice.put(request, response);
    }));
  }
};

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const old = (await caches.keys()).filter((k) => k.startsWith('learnoffline-') && k !== CACHE_NAME && k !== VOICE_CACHE);
    for (const name of old) {
      try { await keepOldVoiceClips(name); } catch { /* the page downloads any clip still missing */ }
      await caches.delete(name);
    }
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  // Voice clips: from the shared voice cache, else the network (and keep it).
  if (VOICE_CLIP.test(new URL(request.url).pathname)) {
    event.respondWith((async () => {
      const voice = await caches.open(VOICE_CACHE);
      const cached = await voice.match(request, { ignoreSearch: true });
      if (cached) return cached;
      try {
        const response = await fetch(request);
        if (response.ok && response.status === 200) voice.put(request, response.clone());
        return response;
      } catch {
        return new Response('Offline and not cached.', { status: 503, statusText: 'Offline' });
      }
    })());
    return;
  }

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
