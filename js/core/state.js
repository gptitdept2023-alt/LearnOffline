/**
 * App-wide state that screens share: the active learner and their pack.
 * Kept in one module (not globals) so it is easy to find and reason about.
 */

import { getProfile } from '../data/repo.js';
import { loadPack } from '../data/packs.js';

const LAST_PROFILE_KEY = 'learnoffline.lastProfile';

const state = {
  profile: null,
  indexed: null, // Result of loadPack() for the active learner.
  lastResult: null, // Result of the set just finished, read by the results screen.
  parentUnlocked: false,
};

/** Per-device convenience only; the app works the same if storage is blocked. */
const remember = (profileId) => {
  try {
    if (profileId) localStorage.setItem(LAST_PROFILE_KEY, profileId);
    else localStorage.removeItem(LAST_PROFILE_KEY);
  } catch { /* storage blocked: ignore */ }
};

export const rememberedProfileId = () => {
  try { return localStorage.getItem(LAST_PROFILE_KEY); } catch { return null; }
};

/** Make a learner active and load their pack. */
export const activateProfile = async (profileId) => {
  const profile = await getProfile(profileId);
  if (!profile) throw new Error('That learner no longer exists.');
  state.indexed = await loadPack(profile.packId);
  state.profile = profile;
  remember(profileId);
  return profile;
};

/** Keep the active learner in step with the database (after an edit in the parent area). */
export const refreshProfile = (profile) => { state.profile = profile; };

export const clearProfile = () => {
  state.profile = null;
  state.indexed = null;
  remember(null);
};

export const getState = () => state;

export const setLastResult = (result) => { state.lastResult = result; };

export const setParentUnlocked = (value) => { state.parentUnlocked = value; };
