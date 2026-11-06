import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newQuest, ensureQuest, progressQuest, questComplete, describeTask } from '../js/engine/quests.js';
import { buy, equip, lookOf, ITEMS, itemById } from '../js/engine/shop.js';
import { weekProgress, normaliseGoal, weekStart } from '../js/engine/goals.js';
import { emptyRewards, applyActivity, applySet, walletOf, dayKey } from '../js/engine/rewards.js';
import { speedQuestion, popRound, gameStars } from '../js/engine/games.js';
import { seededRng } from '../js/core/random.js';

test('daily quest: same all day, always has practice, completes', () => {
  const a = newQuest('2026-11-06', false);
  assert.deepEqual(a, newQuest('2026-11-06', false));
  assert.equal(a.tasks.length, 3);
  assert.equal(a.tasks[0].type, 'sets');
  assert.equal(new Set(a.tasks.map((t) => t.type)).size, 3);
  for (const t of a.tasks) assert.ok(!/undefined/.test(describeTask(t).text));
  let q = a;
  for (let i = 0; i < 5; i += 1) {
    q = progressQuest(q, { kind: 'set', correct: 10, stars: 15 });
    q = progressQuest(q, { kind: 'lesson' });
    q = progressQuest(q, { kind: 'game', stars: 5 });
  }
  assert.ok(questComplete(q));
  assert.ok(q.tasks.every((t) => t.have === t.need), 'progress is capped at the target');
  const r = ensureQuest({ quest: q }, '2026-11-07', true);
  assert.equal(r.quest.day, '2026-11-07');
  assert.ok(!questComplete(r.quest), 'a new day starts a new quest');
});

test('shop: buy spends stars, equips, and refuses when short', () => {
  const rich = { ...emptyRewards('p'), stars: 100 };
  const item = itemById('hat-cap');
  const after = buy(rich, 'hat-cap');
  assert.equal(walletOf(after), 100 - item.price);
  assert.equal(after.stars, 100, 'lifetime stars (for badges) are unchanged');
  assert.deepEqual(lookOf(after), { hat: '🧢' });
  assert.throws(() => buy(after, 'hat-cap'), /already/);
  assert.throws(() => buy({ ...emptyRewards('p'), stars: 5 }, 'hat-crown'), /more stars/);
  assert.deepEqual(lookOf(equip(after, 'hat', null)), {});
  assert.throws(() => equip(after, 'hat', 'hat-crown'), /Buy it first/);
  assert.equal(new Set(ITEMS.map((i) => i.id)).size, ITEMS.length, 'item ids are unique');
});

test('activities count for the streak and stars', () => {
  const today = '2026-11-06';
  const r1 = applyActivity(emptyRewards('p'), { stars: 5 }, today).rewards;
  assert.equal(r1.streak, 1);
  assert.equal(r1.stars, 5);
  const r2 = applySet(r1, { correct: 3, total: 10, masteredCount: 0, topicCompleted: false }, '2026-11-07').rewards;
  assert.equal(r2.streak, 2);
});

test('parent goal: week progress from finished sets', () => {
  const friday = new Date(2026, 10, 6, 15, 0); // Fri 6 Nov 2026
  assert.equal(dayKey(weekStart(friday)), '2026-11-02');
  const at = (d, h = 10) => ({ finishedAt: new Date(2026, 10, d, h).getTime() });
  const sessions = [at(2), at(2, 11), at(3), at(4), at(4, 12), at(6)];
  const wp = weekProgress(sessions, { setsPerDay: 2, daysPerWeek: 2 }, friday);
  assert.equal(wp.today, 1);
  assert.equal(wp.daysMet, 2);
  assert.ok(wp.weekDone);
  assert.ok(wp.days[5].future && wp.days[4].isToday);
  assert.deepEqual(normaliseGoal({ setsPerDay: '99', daysPerWeek: 0, reward: ' x ' }), { setsPerDay: 10, daysPerWeek: 5, reward: 'x' });
  assert.equal(weekProgress(sessions, null, friday).target, 0, 'no goal by default');
});

test('games: questions are right and balloons hold the answer once', () => {
  const rng = seededRng(42);
  for (let i = 0; i < 300; i += 1) {
    for (const young of [true, false]) {
      const s = speedQuestion(young, rng);
      const expr = s.prompt.replace('×', '*').replace('÷', '/').replace('−', '-');
      assert.equal(Math.round(Function(`return ${expr}`)()), s.answer, s.prompt);
      const p = popRound(young, rng);
      assert.equal(p.choices.length, 4);
      assert.equal(new Set(p.choices).size, 4);
      assert.equal(p.choices.filter((c) => c === p.answer).length, 1);
      assert.ok(p.choices.every((c) => c >= 0));
    }
  }
  assert.equal(gameStars('speed', 100), 15);
  assert.equal(gameStars('pop', 7), 7);
});
