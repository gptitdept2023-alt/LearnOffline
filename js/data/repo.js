/**
 * Repository: every read and write the app makes, expressed in app terms.
 * Screens call these functions and never see IndexedDB.
 */

import { STORES, tx, get, getAll, getAllByIndex, put, promisify } from './db.js';
import { applyAnswer, applySetResult, emptyMastery, statusOf } from '../engine/mastery.js';
import { applySet, emptyRewards } from '../engine/rewards.js';
import { uid } from '../core/random.js';

export const MAX_PROFILES = 6;

/* ------------------------------------------------------------------ */
/* Profiles                                                            */
/* ------------------------------------------------------------------ */

export const listProfiles = async () => {
  const profiles = await getAll(STORES.profiles);
  return profiles.sort((a, b) => a.createdAt - b.createdAt);
};

export const getProfile = (profileId) => get(STORES.profiles, profileId);

/**
 * Create or update a profile. Validates input so bad data never reaches the DB.
 * @param {{profileId?: string, name: string, avatar: string, packId: string, readAloud?: boolean}} input
 */
export const saveProfile = async (input) => {
  const name = String(input.name || '').trim();
  if (!name) throw new Error('Please enter a name.');
  if (name.length > 30) throw new Error('Names can be up to 30 letters.');
  if (!input.packId) throw new Error('Please pick a grade.');

  const existing = input.profileId ? await getProfile(input.profileId) : null;
  if (!existing) {
    const all = await listProfiles();
    if (all.length >= MAX_PROFILES) throw new Error(`You can have up to ${MAX_PROFILES} learners.`);
  }
  const profile = {
    ...existing,
    profileId: existing?.profileId || uid('p'),
    name,
    avatar: input.avatar || '🦊',
    packId: input.packId,
    readAloud: Boolean(input.readAloud),
    createdAt: existing?.createdAt || Date.now(),
  };
  await put(STORES.profiles, profile);
  return profile;
};

/** Delete a profile and ALL of its history in one transaction. */
export const deleteProfile = (profileId) =>
  tx([STORES.profiles, STORES.attempts, STORES.mastery, STORES.rewards, STORES.sessions], 'readwrite', async (s) => {
    s[STORES.profiles].delete(profileId);
    s[STORES.rewards].delete(profileId);
    // Compound-index ranges select every row of this child without scanning other children.
    const deleteRange = (store, indexName, range) => new Promise((resolve, reject) => {
      const request = store.index(indexName).openKeyCursor(range);
      request.onsuccess = () => {
        const cursor = request.result;
        if (!cursor) { resolve(); return; }
        store.delete(cursor.primaryKey);
        cursor.continue();
      };
      request.onerror = () => reject(request.error);
    });
    const byProfile = IDBKeyRange.bound([profileId, -Infinity], [profileId, Infinity]);
    await Promise.all([
      deleteRange(s[STORES.attempts], 'byProfileDate', byProfile),
      deleteRange(s[STORES.sessions], 'byProfileDate', byProfile),
      deleteRange(s[STORES.mastery], 'byProfile', IDBKeyRange.only(profileId)),
    ]);
  });

/* ------------------------------------------------------------------ */
/* Progress                                                            */
/* ------------------------------------------------------------------ */

/** Mastery records for one child, keyed by skillId. */
export const getMasteryMap = async (profileId) => {
  const rows = await getAllByIndex(STORES.mastery, 'byProfile', IDBKeyRange.only(profileId));
  return new Map(rows.map((r) => [r.skillId, r]));
};

export const getRewards = async (profileId) => (await get(STORES.rewards, profileId)) || emptyRewards(profileId);

/** Finished sets since `sinceMs`, oldest first. */
export const getSessionsSince = (profileId, sinceMs) =>
  getAllByIndex(STORES.sessions, 'byProfileDate', IDBKeyRange.bound([profileId, sinceMs], [profileId, Infinity]));

/**
 * Save a finished practice set in ONE transaction: the attempts log, mastery
 * for each skill, the session row and rewards. One transaction is faster than
 * a write per answer and guarantees progress is never half-saved.
 *
 * @param {Object} args
 * @param {string} args.profileId
 * @param {string} args.packId
 * @param {string} args.label What was practised ("Daily mix" or a skill title).
 * @param {{skillId: string, correct: boolean, given: string, prompt: string, timeMs: number}[]} args.answers
 * @param {Map<string, string[]>} args.topicSkills topicId -> skillIds, for topics touched by this set.
 * @returns {Promise<{rewards: Object, earnedStars: number, newBadges: string[], mastery: Map}>}
 */
export const saveSetResult = ({ profileId, packId, label, answers, topicSkills }) =>
  tx([STORES.attempts, STORES.mastery, STORES.rewards, STORES.sessions], 'readwrite', async (s) => {
    const now = Date.now();
    const masteryStore = s[STORES.mastery];

    // 1. Append attempts.
    answers.forEach((a, i) => {
      s[STORES.attempts].add({
        profileId, packId, skillId: a.skillId, correct: a.correct,
        given: String(a.given).slice(0, 40), prompt: String(a.prompt).slice(0, 200),
        timeMs: a.timeMs, answeredAt: now + i, // +i keeps order stable within the set.
      });
    });

    // 2. Load mastery for every skill in the set's topics (needed for topic badges).
    const relevant = new Set(answers.map((a) => a.skillId));
    for (const ids of topicSkills.values()) ids.forEach((id) => relevant.add(id));
    const before = new Map();
    await Promise.all([...relevant].map(async (skillId) => {
      const rec = await promisify(masteryStore.get([profileId, skillId]));
      before.set(skillId, rec || emptyMastery(profileId, skillId));
    }));

    // 3. Apply answers, then the set result per practised skill.
    const after = new Map(before);
    for (const a of answers) after.set(a.skillId, applyAnswer(after.get(a.skillId), a.correct, now));
    const perSkill = new Map();
    for (const a of answers) {
      const p = perSkill.get(a.skillId) || { c: 0, t: 0 };
      p.t += 1; p.c += a.correct ? 1 : 0;
      perSkill.set(a.skillId, p);
    }
    for (const [skillId, p] of perSkill) {
      const rec = applySetResult(after.get(skillId), p.c / p.t, now);
      after.set(skillId, rec);
      masteryStore.put(rec);
    }

    // 4. Badge facts.
    const allMastery = await promisify(masteryStore.index('byProfile').getAll(IDBKeyRange.only(profileId)));
    const masteredCount = allMastery.filter((r) => statusOf(r) === 'mastered').length;
    let topicCompleted = false;
    for (const ids of topicSkills.values()) {
      const wasDone = ids.every((id) => statusOf(before.get(id)) === 'mastered');
      const isDone = ids.every((id) => statusOf(after.get(id)) === 'mastered');
      if (isDone && !wasDone) topicCompleted = true;
    }

    // 5. Rewards and session row.
    const correct = answers.filter((a) => a.correct).length;
    const current = (await promisify(s[STORES.rewards].get(profileId))) || emptyRewards(profileId);
    const result = applySet(current, { correct, total: answers.length, masteredCount, topicCompleted });
    s[STORES.rewards].put(result.rewards);
    s[STORES.sessions].put({
      sessionId: uid('s'), profileId, packId, label, finishedAt: now,
      correct, total: answers.length, stars: result.earnedStars,
      durationMs: answers.reduce((sum, a) => sum + (a.timeMs || 0), 0),
    });

    return { ...result, mastery: after };
  });

/* ------------------------------------------------------------------ */
/* Settings                                                            */
/* ------------------------------------------------------------------ */

export const getSetting = async (key, fallback = null) => (await get(STORES.settings, key))?.value ?? fallback;

export const setSetting = (key, value) => put(STORES.settings, { key, value });
