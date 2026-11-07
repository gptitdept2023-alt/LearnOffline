/**
 * Daily quest: three small goals a day ("Finish 2 practice sets", "Play a
 * game"…). Finishing all three unlocks a chest of bonus stars.
 *
 * Quests come in tiers. Opening a chest unlocks the next, harder tier the
 * same day: 1 Today's quest -> 2 Bonus quest (Challenge sets, a perfect set)
 * -> 3 Champion quest. Targets are smaller for Kinder.
 *
 * The quest for a day is chosen from the day itself, so it is the same all
 * day on every device, needs no network and no stored schedule.
 * Pure and DOM-free.
 */

import { t } from '../core/i18n.js';

/** What each kind of task counts, and its wording (a label key in core/i18n.js). `need` is [young, older]. */
const TASKS = {
  sets: { icon: '✏️', need: [1, 2], label: 'taskSets' },
  lessons: { icon: '📖', need: [1, 1], label: 'taskLessons' },
  games: { icon: '🎮', need: [1, 1], label: 'taskGames' },
  correct: { icon: '✅', need: [5, 15], label: 'taskCorrect' },
  stars: { icon: '⭐', need: [10, 20], label: 'taskStars' },
  challenge: { icon: '🚀', need: [1, 1], label: 'taskChallenge' },
  perfect: { icon: '💯', need: [1, 1], label: 'taskPerfect' },
};

export const MAX_TIER = 3;

/** Name shown on the card for a tier (1 Today's quest, 2 Bonus quest, 3 Champion quest). */
export const tierName = (tier) => t(`questTier${Math.min(MAX_TIER, Math.max(1, tier))}`);

/** Harder tiers: [type, need] for [young, older]. */
const TIER_TASKS = {
  2: {
    young: [['challenge', 1], ['perfect', 1], ['games', 2]],
    older: [['challenge', 1], ['perfect', 1], ['games', 2]],
  },
  3: {
    young: [['challenge', 2], ['correct', 20], ['games', 3]],
    older: [['challenge', 2], ['perfect', 2], ['correct', 40]],
  },
};

/** Optional tasks; "sets" is always in the quest so practice stays central. */
const OPTIONAL = ['lessons', 'games', 'correct', 'stars'];

/** Chest size by tier: bigger chests for harder quests. */
export const CHEST_STARS = { young: [10, 20, 30], older: [15, 30, 45] };

/** Small stable number from a day key (YYYY-MM-DD). */
const daySeed = (day) => [...day].reduce((n, ch) => (n * 31 + ch.charCodeAt(0)) >>> 0, 7);

/**
 * Today's quest.
 * @param {string} day Day key.
 * @param {boolean} young Kinder packs get smaller targets.
 */
export const newQuest = (day, young, tier = 1) => {
  if (tier > 1) {
    const tasks = TIER_TASKS[tier][young ? 'young' : 'older'].map(([type, need]) => ({ type, need, have: 0 }));
    return { day, young: Boolean(young), tier, tasks, claimed: false };
  }
  const seed = daySeed(day);
  const first = OPTIONAL[seed % OPTIONAL.length];
  const rest = OPTIONAL.filter((t) => t !== first);
  const second = rest[Math.floor(seed / 7) % rest.length];
  const tasks = ['sets', first, second].map((type) => ({ type, need: TASKS[type].need[young ? 0 : 1], have: 0 }));
  return { day, young: Boolean(young), tier: 1, tasks, claimed: false };
};

/**
 * After a chest is opened: the next tier's quest, or the same quest marked
 * claimed when the last tier is done for the day.
 */
export const afterClaim = (quest) => {
  const tier = quest.tier || 1;
  return tier < MAX_TIER ? newQuest(quest.day, quest.young, tier + 1) : { ...quest, claimed: true };
};

/** The rewards record with a quest for `day` (a new one if the stored one is old). */
export const ensureQuest = (rewards, day, young) =>
  (rewards.quest?.day === day ? rewards : { ...rewards, quest: newQuest(day, young) });

/**
 * Count an event towards the quest.
 * @param {Object} quest
 * @param {{kind: 'set'|'lesson'|'game', stars?: number, correct?: number}} event
 */
export const progressQuest = (quest, event) => {
  const add = {
    sets: event.kind === 'set' ? 1 : 0,
    lessons: event.kind === 'lesson' ? 1 : 0,
    games: event.kind === 'game' ? 1 : 0,
    correct: event.correct || 0,
    stars: event.stars || 0,
    challenge: event.kind === 'set' && event.challenge ? 1 : 0,
    perfect: event.kind === 'set' && event.perfect ? 1 : 0,
  };
  return { ...quest, tasks: quest.tasks.map((t) => ({ ...t, have: Math.min(t.need, t.have + (add[t.type] || 0)) })) };
};

export const questComplete = (quest) => Boolean(quest) && quest.tasks.every((t) => t.have >= t.need);

/** Wording and icon for a task, for the screen. */
export const describeTask = (task) => ({ icon: TASKS[task.type].icon, text: t(TASKS[task.type].label, task.need) });

export const chestStarsFor = (young, tier = 1) => (young ? CHEST_STARS.young : CHEST_STARS.older)[Math.min(MAX_TIER, tier) - 1];
