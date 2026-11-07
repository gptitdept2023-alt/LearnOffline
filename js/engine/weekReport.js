/**
 * The weekly report for parents: what a learner did from Monday to Sunday.
 * Pure and DOM-free, so it is tested in Node; js/ui/screens/report.js draws it.
 *
 * It reads only the week's own rows (sessions and attempts found through
 * their [profileId, date] indexes), never the whole history, so it stays
 * fast after years of practice.
 */

import { weekStart, WEEK_LABELS, normaliseGoal } from './goals.js';
import { dayKey } from './rewards.js';
import { statusOf } from './mastery.js';

const WRONG_LIST_SIZE = 8;
const STRONG_MIN_QUESTIONS = 5;
const WEAK_MIN_QUESTIONS = 3;

/**
 * Monday 00:00 of the week `weeksAgo` weeks before this one, and the next Monday.
 * Built from calendar dates (not 7 × 24 hours), so a clock change cannot shift it.
 * @returns {{start: Date, end: Date}}
 */
export const weekRange = (weeksAgo = 0, now = new Date()) => {
  const monday = weekStart(now);
  const start = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() - 7 * weeksAgo);
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7);
  return { start, end };
};

const pct = (correct, total) => (total ? Math.round((correct / total) * 100) : null);

/**
 * Sum up one learner's week.
 * @param {Object} args
 * @param {{finishedAt: number, total: number, correct: number, durationMs?: number}[]} args.sessions Sets finished in the week.
 * @param {{skillId: string, correct: boolean, prompt?: string, given?: string, answeredAt: number}[]} args.attempts Answers in the week, oldest first.
 * @param {Map<string, Object>} args.mastery skillId -> mastery record (for each skill's status now).
 * @param {(skillId: string) => ({title: string, subject: string}|null)} args.skillInfo Names from the packs; null for a skill no longer installed.
 * @param {Object} [args.goal] The learner's goal.
 * @param {Date} args.start Monday 00:00 of the week.
 * @param {Date} [args.now] For days that have not happened yet.
 */
export const summariseWeek = ({ sessions, attempts, mastery, skillInfo, goal, start, now = new Date() }) => {
  const g = normaliseGoal(goal);
  const todayKey = dayKey(now);
  const days = WEEK_LABELS.map((label, i) => {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    return { label, date, key: dayKey(date), sets: 0, questions: 0, correct: 0, ms: 0, future: dayKey(date) > todayKey };
  });
  const byKey = new Map(days.map((d) => [d.key, d]));
  for (const s of sessions) {
    const day = byKey.get(dayKey(s.finishedAt));
    if (!day) continue; // outside the week
    day.sets += 1;
    day.questions += s.total;
    day.correct += s.correct;
    day.ms += s.durationMs || 0;
  }
  for (const d of days) {
    d.minutes = Math.round(d.ms / 60000);
    d.accuracy = pct(d.correct, d.questions);
    d.met = g.setsPerDay > 0 && d.sets >= g.setsPerDay;
  }

  const sum = (key) => days.reduce((n, d) => n + d[key], 0);
  const totals = {
    sets: sum('sets'),
    questions: sum('questions'),
    correct: sum('correct'),
    minutes: Math.round(sum('ms') / 60000),
    daysPractised: days.filter((d) => d.sets > 0).length,
  };
  totals.accuracy = pct(totals.correct, totals.questions);

  // Per skill, from the answers themselves (a Daily mix covers several skills).
  const perSkill = new Map();
  for (const a of attempts) {
    const row = perSkill.get(a.skillId) || { skillId: a.skillId, questions: 0, correct: 0 };
    row.questions += 1;
    row.correct += a.correct ? 1 : 0;
    perSkill.set(a.skillId, row);
  }
  const skills = [...perSkill.values()].map((row) => {
    const info = skillInfo(row.skillId);
    return {
      ...row,
      title: info?.title || 'A removed skill',
      subject: info?.subject || '',
      accuracy: pct(row.correct, row.questions),
      status: statusOf(mastery.get(row.skillId)),
    };
  }).sort((a, b) => (!a.subject - !b.subject) || a.subject.localeCompare(b.subject) || b.questions - a.questions || a.title.localeCompare(b.title));

  // Newest wrong answers first, one per question, to go over together.
  const seen = new Set();
  const wrong = [];
  for (let i = attempts.length - 1; i >= 0 && wrong.length < WRONG_LIST_SIZE; i -= 1) {
    const a = attempts[i];
    if (a.correct || !a.prompt || seen.has(a.prompt)) continue;
    seen.add(a.prompt);
    wrong.push({ prompt: a.prompt, given: a.given ?? '', title: skillInfo(a.skillId)?.title || '', answeredAt: a.answeredAt });
  }

  const known = skills.filter((s) => s.title !== 'A removed skill');
  const strong = known.filter((s) => s.questions >= STRONG_MIN_QUESTIONS && s.accuracy >= 80)
    .sort((a, b) => b.accuracy - a.accuracy || b.questions - a.questions)[0] || null;
  const weak = known.filter((s) => s.questions >= WEAK_MIN_QUESTIONS && s.accuracy < 70 && s !== strong)
    .sort((a, b) => a.accuracy - b.accuracy || b.questions - a.questions)[0] || null;

  const goalSummary = g.setsPerDay > 0
    ? { setsPerDay: g.setsPerDay, daysPerWeek: g.daysPerWeek, daysMet: days.filter((d) => d.met).length, reward: g.reward }
    : null;
  if (goalSummary) goalSummary.done = goalSummary.daysMet >= goalSummary.daysPerWeek;

  return { days, totals, skills, wrong, strong, weak, goal: goalSummary };
};
