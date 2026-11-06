/**
 * Daily quest: three small goals a day ("Finish 2 practice sets", "Play a
 * game"…). Finishing all three unlocks a chest of bonus stars.
 *
 * The quest for a day is chosen from the day itself, so it is the same all
 * day on every device, needs no network and no stored schedule.
 * Pure and DOM-free.
 */

/** What each kind of task counts, and its wording. `need` is [young, older]. */
const TASKS = {
  sets: { icon: '✏️', need: [1, 2], text: (n) => `Finish ${n} practice set${n === 1 ? '' : 's'}` },
  lessons: { icon: '📖', need: [1, 1], text: () => 'Do a lesson or Try with help' },
  games: { icon: '🎮', need: [1, 1], text: () => 'Play a game' },
  correct: { icon: '✅', need: [5, 15], text: (n) => `Get ${n} answers right` },
  stars: { icon: '⭐', need: [10, 20], text: (n) => `Earn ${n} stars` },
};

/** Optional tasks; "sets" is always in the quest so practice stays central. */
const OPTIONAL = ['lessons', 'games', 'correct', 'stars'];

export const CHEST_STARS = { young: 10, older: 15 };

/** Small stable number from a day key (YYYY-MM-DD). */
const daySeed = (day) => [...day].reduce((n, ch) => (n * 31 + ch.charCodeAt(0)) >>> 0, 7);

/**
 * Today's quest.
 * @param {string} day Day key.
 * @param {boolean} young Kinder packs get smaller targets.
 */
export const newQuest = (day, young) => {
  const seed = daySeed(day);
  const first = OPTIONAL[seed % OPTIONAL.length];
  const rest = OPTIONAL.filter((t) => t !== first);
  const second = rest[Math.floor(seed / 7) % rest.length];
  const tasks = ['sets', first, second].map((type) => ({ type, need: TASKS[type].need[young ? 0 : 1], have: 0 }));
  return { day, young: Boolean(young), tasks, claimed: false };
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
  };
  return { ...quest, tasks: quest.tasks.map((t) => ({ ...t, have: Math.min(t.need, t.have + (add[t.type] || 0)) })) };
};

export const questComplete = (quest) => Boolean(quest) && quest.tasks.every((t) => t.have >= t.need);

/** Wording and icon for a task, for the screen. */
export const describeTask = (task) => ({ icon: TASKS[task.type].icon, text: TASKS[task.type].text(task.need) });

export const chestStarsFor = (young) => (young ? CHEST_STARS.young : CHEST_STARS.older);
