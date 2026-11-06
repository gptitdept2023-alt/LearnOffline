/**
 * Stars, daily streaks and badges. Pure functions over a rewards record:
 * { profileId, stars, streak, bestStreak, lastActiveDay, badges: string[], setsCompleted, perfectSets,
 *   spentStars, owned: string[], equipped: {slot: itemId}, quest, questsDone, gameBest: {gameId: score} }
 *
 * `stars` is the lifetime total (badges use it); stars spent in the shop are
 * tracked in `spentStars`, so the child's wallet is stars − spentStars.
 */

export const PERFECT_BONUS = 5;

/** Badge catalogue. `test` gets the updated rewards record plus facts about the set just finished. */
export const BADGES = Object.freeze([
  { id: 'first-set', icon: '🎉', title: 'First steps', description: 'Finish your first practice set.', test: (r) => r.setsCompleted >= 1 },
  { id: 'perfect-set', icon: '💯', title: 'Perfect!', description: 'Get every question right in a set.', test: (r) => r.perfectSets >= 1 },
  { id: 'ten-sets', icon: '🏃', title: 'Keep going', description: 'Finish 10 practice sets.', test: (r) => r.setsCompleted >= 10 },
  { id: 'streak-3', icon: '🔥', title: '3-day streak', description: 'Practise 3 days in a row.', test: (r) => r.streak >= 3 },
  { id: 'streak-7', icon: '🌟', title: '7-day streak', description: 'Practise 7 days in a row.', test: (r) => r.streak >= 7 },
  { id: 'stars-100', icon: '⭐', title: '100 stars', description: 'Collect 100 stars.', test: (r) => r.stars >= 100 },
  { id: 'stars-500', icon: '🏆', title: '500 stars', description: 'Collect 500 stars.', test: (r) => r.stars >= 500 },
  { id: 'first-mastered', icon: '🧠', title: 'Skill master', description: 'Master your first skill.', test: (r, ctx) => ctx.masteredCount >= 1 },
  { id: 'topic-complete', icon: '🗺️', title: 'Topic champion', description: 'Master every skill in a topic.', test: (r, ctx) => ctx.topicCompleted },
  { id: 'quest-1', icon: '🎁', title: 'Quest done', description: 'Open your first quest chest.', test: (r) => (r.questsDone || 0) >= 1 },
  { id: 'quest-10', icon: '👑', title: 'Quest hero', description: 'Open 10 quest chests.', test: (r) => (r.questsDone || 0) >= 10 },
  { id: 'first-buy', icon: '🛍️', title: 'Dress up', description: 'Buy something in the shop.', test: (r) => (r.owned || []).length >= 1 },
  { id: 'gamer', icon: '🎮', title: 'Game time', description: 'Play a game.', test: (r) => Object.keys(r.gameBest || {}).length >= 1 },
  { id: 'speedy', icon: '⚡', title: 'Lightning fast', description: 'Score 20 in Speed Round.', test: (r) => (r.gameBest?.speed || 0) >= 20 },
  { id: 'boss-1', icon: '🛡️', title: 'Boss beater', description: 'Beat your first boss level.', test: (r) => (r.bossesBeaten || 0) >= 1 },
  { id: 'level-50', icon: '🧗', title: 'Halfway hero', description: 'Pass level 50.', test: (r) => (r.levels?.[50] || 0) > 0 },
  { id: 'level-100', icon: '🌠', title: 'Level legend', description: 'Pass all 100 levels.', test: (r) => (r.levels?.[100] || 0) > 0 },
]);

export const emptyRewards = (profileId) => ({
  profileId,
  stars: 0,
  streak: 0,
  bestStreak: 0,
  lastActiveDay: '',
  badges: [],
  setsCompleted: 0,
  perfectSets: 0,
  spentStars: 0,
  owned: [],
  equipped: {},
  quest: null,
  questsDone: 0,
  gameBest: {},
  levels: {},
  bossesBeaten: 0,
});

/** Stars the child can spend in the shop. */
export const walletOf = (rewards) => Math.max(0, rewards.stars - (rewards.spentStars || 0));

/** Local calendar day as YYYY-MM-DD (streaks follow the child's day, not UTC). */
export const dayKey = (date = new Date()) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** Day key of the day before `key`. */
const previousDay = (key) => {
  const [y, m, d] = key.split('-').map(Number);
  return dayKey(new Date(y, m - 1, d - 1));
};

/** Stars for a set: one per correct answer, plus a bonus for a perfect set. */
export const starsForSet = (correct, total) => correct + (total > 0 && correct === total ? PERFECT_BONUS : 0);

/**
 * Apply a finished set. Returns { rewards, earnedStars, newBadges }.
 * @param {Object} rewards Current record.
 * @param {{correct: number, total: number, masteredCount: number, topicCompleted: boolean}} set
 * @param {string} [today] Day key, injectable for tests.
 */
export const applySet = (rewards, set, today = dayKey()) => {
  const earnedStars = starsForSet(set.correct, set.total);
  const next = {
    ...touchDay(rewards, today),
    stars: rewards.stars + earnedStars,
    setsCompleted: rewards.setsCompleted + 1,
    perfectSets: rewards.perfectSets + (set.total > 0 && set.correct === set.total ? 1 : 0),
  };
  return { ...awardBadges(next, set), earnedStars };
};

/** Mark today as active: keeps or grows the streak (any activity counts). */
export const touchDay = (rewards, today = dayKey()) => {
  if (rewards.lastActiveDay === today) return rewards;
  const streak = rewards.lastActiveDay === previousDay(today) ? rewards.streak + 1 : 1;
  return { ...rewards, streak, bestStreak: Math.max(rewards.bestStreak, streak), lastActiveDay: today };
};

/** Add any newly earned badges. Returns { rewards, newBadges }. */
export const awardBadges = (rewards, ctx = {}) => {
  const owned = new Set(rewards.badges);
  const newBadges = BADGES.filter((b) => !owned.has(b.id) && b.test(rewards, ctx)).map((b) => b.id);
  return { rewards: { ...rewards, badges: [...rewards.badges, ...newBadges] }, newBadges };
};

/**
 * A lesson, guided practice or game finished: count the day for the streak
 * and add any stars it earned. Returns { rewards, earnedStars, newBadges }.
 */
export const applyActivity = (rewards, { stars = 0 } = {}, today = dayKey()) => {
  const next = { ...touchDay(rewards, today), stars: rewards.stars + stars };
  return { ...awardBadges(next), earnedStars: stars };
};

/** Streak shown today: if the child missed yesterday, the streak has lapsed. */
export const currentStreak = (rewards, today = dayKey()) =>
  rewards.lastActiveDay === today || rewards.lastActiveDay === previousDay(today) ? rewards.streak : 0;

export const badgeById = (id) => BADGES.find((b) => b.id === id);
