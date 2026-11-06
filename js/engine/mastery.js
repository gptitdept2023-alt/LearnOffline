/**
 * Mastery tracking and spaced review.
 *
 * Each child+skill pair keeps a running score (0 to 100), an exponentially
 * weighted average of recent answers, so recent work counts more than old
 * work and one slip does not erase a week of progress. Updating a running
 * total is O(1) per answer; reports never rescan the attempts log.
 */

export const ALPHA = 0.25;                 // Weight of the newest answer.
export const MASTERED_SCORE = 80;
export const MASTERED_MIN_ATTEMPTS = 8;
/** Days until the next review, by review level. */
export const REVIEW_INTERVAL_DAYS = [1, 2, 4, 7, 14, 30];

const DAY_MS = 24 * 60 * 60 * 1000;

/** Empty record for a skill a child has not tried yet. */
export const emptyMastery = (profileId, skillId) => ({
  profileId,
  skillId,
  score: 0,
  attempts: 0,
  correct: 0,
  level: 0,
  lastPracticedAt: 0,
  nextReviewAt: 0,
});

/**
 * Apply one answer. Returns a new record (inputs are not mutated).
 * The first answer sets the score directly so a new skill is not stuck near 0.
 */
export const applyAnswer = (record, correct, now = Date.now()) => {
  const target = correct ? 100 : 0;
  const score = record.attempts === 0 ? target : record.score * (1 - ALPHA) + target * ALPHA;
  return {
    ...record,
    score: Math.round(score * 10) / 10,
    attempts: record.attempts + 1,
    correct: record.correct + (correct ? 1 : 0),
    lastPracticedAt: now,
  };
};

/**
 * After a finished set, move the review level up (good set) or down (weak set)
 * and schedule the next review.
 * @param {Object} record
 * @param {number} accuracy 0..1 for this skill in the set.
 */
export const applySetResult = (record, accuracy, now = Date.now()) => {
  const maxLevel = REVIEW_INTERVAL_DAYS.length - 1;
  const level = accuracy >= 0.8 ? Math.min(record.level + 1, maxLevel) : Math.max(record.level - 1, 0);
  return { ...record, level, nextReviewAt: now + REVIEW_INTERVAL_DAYS[level] * DAY_MS };
};

/** 'notStarted' | 'learning' | 'mastered' */
export const statusOf = (record) => {
  if (!record || record.attempts === 0) return 'notStarted';
  return record.score >= MASTERED_SCORE && record.attempts >= MASTERED_MIN_ATTEMPTS ? 'mastered' : 'learning';
};

/**
 * Choose skills for the Daily mix, in priority order:
 *  1. skills due for review (oldest due first)
 *  2. skills being learned, weakest first
 *  3. the next skills not started yet, in course order
 * @param {string[]} skillIds All skills in course order.
 * @param {Map<string, Object>} masteryBySkill
 * @param {number} [limit] How many distinct skills to return.
 * @returns {string[]}
 */
export const pickDailyMix = (skillIds, masteryBySkill, limit = 4, now = Date.now()) => {
  const due = [];
  const learning = [];
  const fresh = [];
  for (const id of skillIds) {
    const rec = masteryBySkill.get(id);
    const status = statusOf(rec);
    if (status === 'notStarted') fresh.push(id);
    else if (rec.nextReviewAt && rec.nextReviewAt <= now) due.push(rec);
    else if (status === 'learning') learning.push(rec);
  }
  due.sort((a, b) => a.nextReviewAt - b.nextReviewAt);
  learning.sort((a, b) => a.score - b.score);
  const ordered = [...due.map((r) => r.skillId), ...learning.map((r) => r.skillId), ...fresh];
  return [...new Set(ordered)].slice(0, limit);
};
