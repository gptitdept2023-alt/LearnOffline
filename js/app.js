/**
 * App entry: registers screens, guards learner-only screens, and sets up
 * the service worker that makes the app work offline.
 */

import { h, mount, toast } from './core/dom.js';
import { setLanguage, t, DEFAULT_LANGUAGE } from './core/i18n.js';
import { route, setNotFound, setBeforeEach, startRouter } from './core/router.js';
import { getState, activateProfile, rememberedProfileId, setParentUnlocked, refreshProfile, clearProfile } from './core/state.js';
import { openDb } from './data/db.js';
import { renderStart } from './ui/screens/start.js';
import { renderHome } from './ui/screens/home.js';
import { renderTopic } from './ui/screens/topic.js';
import { renderLesson } from './ui/screens/lesson.js';
import { renderPractice } from './ui/screens/practice.js';
import { renderResults } from './ui/screens/results.js';
import { renderBadges } from './ui/screens/badges.js';
import { renderParent } from './ui/screens/parent.js';
import { renderGuided } from './ui/screens/guided.js';
import { renderShop } from './ui/screens/shop.js';
import { renderGames, renderGame } from './ui/screens/games.js';
import { renderLevels } from './ui/screens/levels.js';
import { renderTricks, renderTrick } from './ui/screens/tricks.js';
import { setSfxEnabled } from './core/sfx.js';
import { setVoiceSettings, loadRecordedVoice, VOICE_PACK_URL } from './core/speech.js';
import { fillVoiceCacheLater } from './core/voiceCache.js';
import { getSetting, getProfile } from './data/repo.js';

/** Screens that need an active learner. */
const LEARNER_SCREENS = new Set(['home', 'topic', 'lesson', 'guided', 'practice', 'results', 'badges', 'shop', 'games', 'game', 'levels', 'tricks', 'trick']);

const registerRoutes = () => {
  route('', renderStart);
  route('home', renderHome);
  route('topic', renderTopic);
  route('lesson', renderLesson);
  route('guided', renderGuided);
  route('practice', renderPractice);
  route('results', renderResults);
  route('badges', renderBadges);
  route('parent', renderParent);
  route('shop', renderShop);
  route('games', renderGames);
  route('game', renderGame);
  route('levels', renderLevels);
  route('tricks', renderTricks);
  route('trick', renderTrick);
  setNotFound(renderStart);

  setBeforeEach(async (name) => {
    const redirect = await guardRoute(name);
    // A learner's screens use the labels language they chose; the start screen and parent area stay English.
    setLanguage(redirect === null && LEARNER_SCREENS.has(name) ? getState().profile?.language : DEFAULT_LANGUAGE);
    return redirect;
  });
};

/**
 * Locks the parent area when leaving it and makes sure a learner is active on
 * learner screens. Returns null to go on, or the route to go to instead.
 */
const guardRoute = async (name) => {
  // Back button, ⇄ or a typed link all leave the parent area: lock it again.
  if (name !== 'parent') setParentUnlocked(false);
  if (!LEARNER_SCREENS.has(name)) return null;
  const active = getState().profile;
  if (active) {
    // The learner may have been deleted, edited or replaced by a restore in the parent area.
    const fresh = await getProfile(active.profileId);
    if (!fresh) { clearProfile(); return ''; }
    if (fresh.packId !== active.packId) await activateProfile(fresh.profileId);
    else refreshProfile(fresh);
    return null;
  }
  // After a reload, resume the last learner on this device if they still exist.
  const remembered = rememberedProfileId();
  if (remembered) {
    try {
      await activateProfile(remembered);
      return null;
    } catch { /* fall through to the start screen */ }
  }
  return '';
};

/** Register the service worker and offer a reload when an update is ready. */
const registerServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) return;
  try {
    // Only an UPDATE should reload the page. On the very first install the new
    // worker also takes control (clients.claim), and reloading then would
    // interrupt whatever the user is doing.
    const hadController = Boolean(navigator.serviceWorker.controller);
    let reloadRequested = false;
    const registration = await navigator.serviceWorker.register('./sw.js');
    const offerReload = (worker) => {
      const bar = h('div.update-bar', { role: 'status' },
        h('span', null, t('updateReady')),
        h('button.btn.btn-primary.btn-sm', {
          type: 'button',
          onclick: () => { reloadRequested = true; worker.postMessage({ type: 'SKIP_WAITING' }); },
        }, t('reload')));
      document.body.append(bar);
    };
    if (registration.waiting && navigator.serviceWorker.controller) offerReload(registration.waiting);
    registration.addEventListener('updatefound', () => {
      const worker = registration.installing;
      worker?.addEventListener('statechange', () => {
        if (worker.state !== 'installed') return;
        if (navigator.serviceWorker.controller) offerReload(worker);
        else toast(t('offlineReady'), 'success');
      });
    });
    let reloading = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloading || !(hadController || reloadRequested)) return;
      reloading = true;
      window.location.reload();
    });
  } catch (error) {
    console.warn('Offline support is unavailable:', error);
  }
};

const start = async () => {
  setLanguage(DEFAULT_LANGUAGE);
  try {
    await openDb();
  } catch (error) {
    mount(document.getElementById('app'),
      h('div.error-panel', null, h('h1', null, 'Cannot start'), h('p', null, error.message)));
    return;
  }
  // Ask the browser not to evict our data under storage pressure (best effort).
  navigator.storage?.persist?.().catch(() => {});
  // Voice: parent's saved choice, plus the recorded voice pack (works offline).
  setVoiceSettings(await getSetting('voice').catch(() => null));
  setSfxEnabled(await getSetting('sfx', true).catch(() => true));
  // The clips are saved for offline use in the background, after start-up (see core/voiceCache.js).
  loadRecordedVoice().then((keys) => fillVoiceCacheLater(keys, VOICE_PACK_URL));
  registerRoutes();
  startRouter();
  registerServiceWorker();
};

start();
