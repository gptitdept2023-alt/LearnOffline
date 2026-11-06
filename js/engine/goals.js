/**
 * Parent-set goals: practice sets per day, days per week, and an optional
 * real-life reward when the week is complete. Progress is worked out from
 * the finished-sets log, so nothing extra is stored. Pure and DOM-free.
 */

import { dayKey } from './rewards.js';

export const DEFAULT_GOAL = Object.freeze({ setsPerDay: 0, daysPerWeek: 5, reward: '' });
export const WEEK_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** Clean a goal from a form or an old record. setsPerDay 0 means "no goal". */
export const normaliseGoal = (goal) => ({
  setsPerDay: Math.min(10, Math.max(0, Math.round(Number(goal?.setsPerDay) || 0))),
  daysPerWeek: Math.min(7, Math.max(1, Math.round(Number(goal?.daysPerWeek) || DEFAULT_GOAL.daysPerWeek))),
  reward: String(goal?.reward || '').trim().slice(0, 60),
});

/** Monday 00:00 (local) of the week containing `date`. */
export const weekStart = (date = new Date()) => {
  const d = new Date(date);
  const back = (d.getDay() + 6) % 7; // Monday = 0
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - back);
};

/**
 * Progress against the goal this week.
 * @param {{finishedAt: number}[]} sessions Finished sets since the week started.
 * @returns {{today: number, target: number, days: {label: string, key: string, sets: number, met: boolean, isToday: boolean, future: boolean}[], daysMet: number, weekDone: boolean}}
 */
export const weekProgress = (sessions, goal, now = new Date()) => {
  const g = normaliseGoal(goal);
  const start = weekStart(now);
  const todayKey = dayKey(now);
  const perDay = new Map();
  for (const s of sessions) {
    const key = dayKey(s.finishedAt);
    perDay.set(key, (perDay.get(key) || 0) + 1);
  }
  const days = WEEK_LABELS.map((label, i) => {
    const key = dayKey(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
    const sets = perDay.get(key) || 0;
    return { label, key, sets, met: g.setsPerDay > 0 && sets >= g.setsPerDay, isToday: key === todayKey, future: key > todayKey };
  });
  const daysMet = days.filter((d) => d.met).length;
  return { today: perDay.get(todayKey) || 0, target: g.setsPerDay, days, daysMet, weekDone: g.setsPerDay > 0 && daysMet >= g.daysPerWeek };
};
