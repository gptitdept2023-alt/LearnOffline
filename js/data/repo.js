/**
 * Repository: every read and write the app makes, expressed in app terms.
 * Screens call these functions and never see IndexedDB.
 */

import { STORES, tx, get, getAll, getAllByIndex, put, promisify } from './db.js';
import { applyAnswer, applySetResult, emptyMastery, statusOf } from '../engine/mastery.js';
import { applySet, applyActivity, awardBadges, emptyRewards, dayKey } from '../engine/rewards.js';
import { ensureQuest, progressQuest, questComplete, chestStarsFor, afterClaim } from '../engine/quests.js';
import { buy, equip } from '../engine/shop.js';
import { normaliseGoal, weekStart } from '../engine/goals.js';
import { applyLevel } from '../engine/levels.js';
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

/** Rewards record, with fields added by newer versions filled in. */
export const getRewards = async (profileId) => ({ ...emptyRewards(profileId), ...(await get(STORES.rewards, profileId)) });

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
 * @param {boolean} [args.young] Kinder pack (smaller daily-quest targets).
 * @param {boolean} [args.challenge] A Challenge-zone set (counts for the bonus quest).
 * @returns {Promise<{rewards: Object, earnedStars: number, newBadges: string[], mastery: Map}>}
 */
export const saveSetResult = ({ profileId, packId, label, answers, topicSkills, young = false, challenge = false }) =>
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
    const current = { ...emptyRewards(profileId), ...(await promisify(s[STORES.rewards].get(profileId))) };
    const result = applySet(current, { correct, total: answers.length, masteredCount, topicCompleted });
    // 6. Daily quest progress, in the same write.
    const perfect = answers.length > 0 && correct === answers.length;
    const quest = withQuestEvent(result.rewards, { kind: 'set', correct, stars: result.earnedStars, perfect, challenge }, young);
    result.rewards = quest.rewards;
    result.questJustCompleted = quest.justCompleted;
    s[STORES.rewards].put(result.rewards);
    s[STORES.sessions].put({
      sessionId: uid('s'), profileId, packId, label, finishedAt: now,
      correct, total: answers.length, stars: result.earnedStars,
      durationMs: answers.reduce((sum, a) => sum + (a.timeMs || 0), 0),
    });

    return { ...result, mastery: after };
  });

/* ------------------------------------------------------------------ */
/* Daily quest, activities, shop and goals                             */
/* ------------------------------------------------------------------ */

/** Apply a quest event to a rewards record. Pure helper used inside transactions. */
const withQuestEvent = (rewards, event, young) => {
  const withQuest = ensureQuest(rewards, dayKey(), young);
  const wasDone = questComplete(withQuest.quest);
  const quest = progressQuest(withQuest.quest, event);
  return { rewards: { ...withQuest, quest }, justCompleted: !wasDone && questComplete(quest) };
};

/**
 * Read-modify-write the rewards record in ONE transaction, so two quick taps
 * (or two tabs) can never lose an update.
 * @param {(rewards: Object) => {rewards: Object}} change
 */
const updateRewards = (profileId, change) => tx(STORES.rewards, 'readwrite', async (s) => {
  const current = { ...emptyRewards(profileId), ...(await promisify(s[STORES.rewards].get(profileId))) };
  const result = change(current);
  s[STORES.rewards].put(result.rewards);
  return result;
});

/** Today's quest, created if needed (saved so it stays the same all day). */
export const getRewardsWithQuest = (profileId, young) =>
  updateRewards(profileId, (r) => ({ rewards: ensureQuest(r, dayKey(), young) })).then((x) => x.rewards);

/**
 * A lesson, "Try with help" or game was finished: streak, stars, quest, best score.
 * @param {{kind: 'lesson'|'game', stars?: number, correct?: number, gameId?: string, score?: number}} event
 * @returns {Promise<{rewards: Object, earnedStars: number, newBadges: string[], questJustCompleted: boolean, newBest: boolean}>}
 */
export const recordActivity = (profileId, event, young) => updateRewards(profileId, (current) => {
  let newBest = false;
  let base = current;
  if (event.gameId) {
    const best = current.gameBest?.[event.gameId] || 0;
    newBest = (event.score || 0) > best;
    base = { ...current, gameBest: { ...current.gameBest, [event.gameId]: Math.max(best, event.score || 0) } };
  }
  const applied = applyActivity(base, { stars: event.stars || 0 });
  const quest = withQuestEvent(applied.rewards, event, young);
  // Badges again: the best score above may have earned one.
  const badges = awardBadges(quest.rewards);
  return {
    rewards: badges.rewards,
    earnedStars: applied.earnedStars,
    newBadges: [...applied.newBadges, ...badges.newBadges],
    questJustCompleted: quest.justCompleted,
    newBest,
  };
});

/**
 * Open the quest chest. Resolves with the stars inside; throws if not ready.
 * `day` is the day of the quest on screen, so a chest finished before midnight can still be opened after it.
 */
export const claimQuestChest = (profileId, young, day = dayKey()) => updateRewards(profileId, (current) => {
  if (current.quest && current.quest.day !== day && day !== dayKey()) throw new Error('That quest has ended. A new one is ready!');
  const r = ensureQuest(current, day, young);
  if (!questComplete(r.quest)) throw new Error('Finish all three quest goals first.');
  if (r.quest.claimed) throw new Error('You already opened today’s chest.');
  const tier = r.quest.tier || 1;
  const stars = chestStarsFor(young, tier);
  const next = afterClaim(r.quest);
  const { rewards, newBadges } = awardBadges({
    ...r,
    stars: r.stars + stars,
    questsDone: (r.questsDone || 0) + 1,
    quest: next,
  });
  return { rewards, stars, newBadges, unlockedTier: next.tier !== tier ? next.tier : null };
});

/** Buy a shop item (and wear it). Throws a friendly error if not enough stars. */
export const buyShopItem = (profileId, itemId) => updateRewards(profileId, (current) => awardBadges(buy(current, itemId)));

/** Wear an owned item, or take one off (itemId null). */
export const equipShopItem = (profileId, slot, itemId) => updateRewards(profileId, (current) => ({ rewards: equip(current, slot, itemId) }));

/**
 * Save a level result: best stars, first-clear bonus (bigger for bosses), badges.
 * @returns {Promise<{rewards: Object, bonus: number, firstClear: boolean, best: number, newBadges: string[]}>}
 */
export const recordLevel = (profileId, n, stars, young) => updateRewards(profileId, (current) => {
  const level = applyLevel(current, n, stars, young);
  const badges = awardBadges(level.rewards);
  return { ...level, rewards: badges.rewards, newBadges: badges.newBadges };
});

/** Save a parent-set goal on the learner's profile. */
export const saveGoal = async (profileId, goal) => {
  const profile = await getProfile(profileId);
  if (!profile) throw new Error('That learner no longer exists.');
  const next = { ...profile, goal: normaliseGoal(goal) };
  await put(STORES.profiles, next);
  return next;
};

/** Finished sets since Monday, for goal progress. */
export const getWeekSessions = (profileId) => getSessionsSince(profileId, weekStart().getTime());

/* ------------------------------------------------------------------ */
/* Settings                                                            */
/* ------------------------------------------------------------------ */

export const getSetting = async (key, fallback = null) => (await get(STORES.settings, key))?.value ?? fallback;

export const setSetting = (key, value) => put(STORES.settings, { key, value });
