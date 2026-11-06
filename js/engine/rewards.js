/**
 * Stars, daily streaks and badges. Pure functions over a rewards record:
 * { profileId, stars, streak, bestStreak, lastActiveDay, badges: string[], setsCompleted, perfectSets }
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
});

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
  let { streak } = rewards;
  if (rewards.lastActiveDay !== today) {
    streak = rewards.lastActiveDay === previousDay(today) ? streak + 1 : 1;
  }
  const next = {
    ...rewards,
    stars: rewards.stars + earnedStars,
    streak,
    bestStreak: Math.max(rewards.bestStreak, streak),
    lastActiveDay: today,
    setsCompleted: rewards.setsCompleted + 1,
    perfectSets: rewards.perfectSets + (set.total > 0 && set.correct === set.total ? 1 : 0),
  };
  const owned = new Set(rewards.badges);
  const newBadges = BADGES.filter((b) => !owned.has(b.id) && b.test(next, set)).map((b) => b.id);
  next.badges = [...rewards.badges, ...newBadges];
  return { rewards: next, earnedStars, newBadges };
};

/** Streak shown today: if the child missed yesterday, the streak has lapsed. */
export const currentStreak = (rewards, today = dayKey()) =>
  rewards.lastActiveDay === today || rewards.lastActiveDay === previousDay(today) ? rewards.streak : 0;

export const badgeById = (id) => BADGES.find((b) => b.id === id);
