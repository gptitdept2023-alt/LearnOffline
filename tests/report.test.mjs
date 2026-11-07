// Weekly parent report: the week's days, totals, skills and wrong answers,
// checked against hand-counted numbers, plus the indexed range reads.
import 'fake-indexeddb/auto';
import test from 'node:test';
import assert from 'node:assert/strict';
import { weekRange, summariseWeek } from '../js/engine/weekReport.js';
import { saveProfile, saveSetResult, getSessionsBetween, getAttemptsBetween } from '../js/data/repo.js';

const at = (y, m, d, hh = 10) => new Date(y, m - 1, d, hh).getTime();
// Wednesday 11 November 2026; the week starts Monday 9 November.
const NOW = new Date(2026, 10, 11, 18);
const NAMES = new Map([['add', { title: 'Add to 100', subject: 'Math' }], ['sub', { title: 'Take away', subject: 'Math' }], ['cvc', { title: 'CVC words', subject: 'English' }]]);
const info = (id) => NAMES.get(id) || null;
const attempt = (skillId, correct, when, prompt = `${skillId} q`, given = '1') => ({ skillId, correct, answeredAt: when, prompt, given });

test('weeks run Monday to Monday, by calendar date', () => {
  const { start, end } = weekRange(0, NOW);
  assert.equal(start.getTime(), new Date(2026, 10, 9).getTime());
  assert.equal(end.getTime(), new Date(2026, 10, 16).getTime());
  const last = weekRange(1, NOW);
  assert.equal(last.start.getTime(), new Date(2026, 10, 2).getTime());
  assert.equal(last.end.getTime(), start.getTime());
  // A Sunday belongs to the week that started six days before.
  assert.equal(weekRange(0, new Date(2026, 10, 15, 23)).start.getTime(), start.getTime());
  // Across a month and a year end.
  assert.equal(weekRange(0, new Date(2027, 0, 1)).start.getTime(), new Date(2026, 11, 28).getTime());
});

test('a week is summed per day, per skill, and against the goal', () => {
  const { start } = weekRange(0, NOW);
  const sessions = [
    { finishedAt: at(2026, 11, 9, 8), total: 10, correct: 8, durationMs: 300000 },
    { finishedAt: at(2026, 11, 9, 19), total: 10, correct: 10, durationMs: 240000 },
    { finishedAt: at(2026, 11, 11, 9), total: 6, correct: 3, durationMs: 90000 },
    { finishedAt: at(2026, 11, 8, 9), total: 10, correct: 10, durationMs: 1 }, // the Sunday before: not counted
  ];
  const attempts = [
    ...Array.from({ length: 6 }, (_, i) => attempt('add', true, at(2026, 11, 9, 8) + i)),
    attempt('sub', false, at(2026, 11, 9, 9), '50 − 20 = ?', '70'),
    attempt('sub', false, at(2026, 11, 9, 9) + 1, '50 − 20 = ?', '20'), // same question: listed once
    attempt('sub', true, at(2026, 11, 9, 9) + 2),
    attempt('sub', false, at(2026, 11, 11, 9), '80 − 30 = ?', '40'),
    attempt('cvc', true, at(2026, 11, 11, 9) + 1),
    attempt('gone', false, at(2026, 11, 11, 9) + 2, 'Old question', '3'),
  ];
  const mastery = new Map([['add', { attempts: 20, score: 90, correct: 18 }], ['sub', { attempts: 4, score: 30, correct: 1 }]]);
  const w = summariseWeek({ sessions, attempts, mastery, skillInfo: info, goal: { setsPerDay: 2, daysPerWeek: 3 }, start, now: NOW });

  assert.deepEqual(w.days.map((d) => d.sets), [2, 0, 1, 0, 0, 0, 0]);
  assert.deepEqual(w.days.map((d) => d.future), [false, false, false, true, true, true, true]);
  assert.equal(w.days[0].accuracy, 90);
  assert.equal(w.days[0].minutes, 9);
  assert.equal(w.days[1].accuracy, null);
  assert.deepEqual(w.totals, { sets: 3, questions: 26, correct: 21, minutes: 11, daysPractised: 2, accuracy: 81 });
  assert.deepEqual(w.goal, { setsPerDay: 2, daysPerWeek: 3, daysMet: 1, reward: '', done: false });

  assert.deepEqual(w.skills.map((s) => [s.subject, s.title, s.questions, s.accuracy, s.status]), [
    ['English', 'CVC words', 1, 100, 'notStarted'],
    ['Math', 'Add to 100', 6, 100, 'mastered'],
    ['Math', 'Take away', 4, 25, 'learning'],
    ['', 'A removed skill', 1, 0, 'notStarted'], // removed packs go last
  ]);
  assert.equal(w.strong.title, 'Add to 100');
  assert.equal(w.weak.title, 'Take away');
  assert.deepEqual(w.wrong.map((x) => [x.prompt, x.given, x.title]), [
    ['Old question', '3', ''],
    ['80 − 30 = ?', '40', 'Take away'],
    ['50 − 20 = ?', '20', 'Take away'],
  ]);
});

test('an empty week and no goal give zeros, not errors', () => {
  const { start } = weekRange(2, NOW);
  const w = summariseWeek({ sessions: [], attempts: [], mastery: new Map(), skillInfo: info, goal: undefined, start, now: NOW });
  assert.equal(w.totals.sets, 0);
  assert.equal(w.totals.accuracy, null);
  assert.equal(w.goal, null);
  assert.equal(w.strong, null);
  assert.deepEqual(w.wrong, []);
  assert.ok(w.days.every((d) => !d.future && d.sets === 0));
});

test('the week is read with range reads that stop at Monday', async () => {
  const kid = await saveProfile({ name: 'Rio', packId: 'math-g4' });
  const other = await saveProfile({ name: 'Sol', packId: 'math-k2' });
  const answers = [{ skillId: 'g4-add', correct: true, given: '5', prompt: '2 + 3', timeMs: 4000 }];
  await saveSetResult({ profileId: kid.profileId, packId: 'math-g4', label: 'x', answers, topicSkills: new Map() });
  await saveSetResult({ profileId: other.profileId, packId: 'math-k2', label: 'x', answers, topicSkills: new Map() });
  const now = Date.now();
  assert.equal((await getSessionsBetween(kid.profileId, now - 60000, now + 60000)).length, 1);
  assert.equal((await getAttemptsBetween(kid.profileId, now - 60000, now + 60000)).length, 1);
  assert.equal((await getAttemptsBetween(kid.profileId, now + 60000, now + 120000)).length, 0);
  // The end is not included.
  const [row] = await getSessionsBetween(kid.profileId, 0, now + 60000);
  assert.equal((await getSessionsBetween(kid.profileId, 0, row.finishedAt)).length, 0);
});
