import { test } from 'node:test';
import { readFileSync } from 'node:fs';
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

test('quest tiers: opening a chest unlocks a harder quest, up to the champion quest', async () => {
  const { afterClaim, chestStarsFor, MAX_TIER } = await import('../js/engine/quests.js');
  let q = newQuest('2026-11-06', true);
  assert.equal(q.tier, 1);
  q = afterClaim(q);
  assert.equal(q.tier, 2);
  assert.ok(q.tasks.some((t) => t.type === 'challenge'), 'bonus quest asks for a Challenge set');
  assert.ok(!questComplete(q));
  // Plain sets do not count as Challenge sets.
  q = progressQuest(q, { kind: 'set', correct: 6, perfect: false });
  assert.equal(q.tasks.find((t) => t.type === 'challenge').have, 0);
  q = progressQuest(q, { kind: 'set', correct: 6, perfect: true, challenge: true });
  q = progressQuest(q, { kind: 'game' });
  q = progressQuest(q, { kind: 'game' });
  assert.ok(questComplete(q));
  q = afterClaim(afterClaim(q));
  assert.equal(q.tier, MAX_TIER);
  assert.ok(q.claimed, 'the last tier stays claimed for the day');
  assert.ok(chestStarsFor(true, 3) > chestStarsFor(true, 1));
  assert.ok(chestStarsFor(false, 2) > chestStarsFor(true, 2));
});

test('more games: memory, bond bubbles and number line rounds are fair', async () => {
  const { memoryPairs, memoryScore, bondRound, lineRound, linePoints } = await import('../js/engine/games.js');
  const rng = seededRng(7);
  for (let i = 0; i < 200; i += 1) {
    for (const young of [true, false]) {
      const pairs = memoryPairs(young, rng);
      assert.equal(pairs.length, young ? 4 : 6);
      assert.equal(new Set(pairs.map((p) => p.answer)).size, pairs.length, 'each answer card matches one question');
      for (const p of pairs) {
        if (p.picture) assert.equal(String(p.picture.count), p.answer);
        else assert.equal(String(Function(`return ${p.question.replace('×', '*').replace('÷', '/')}`)()), p.answer, p.question);
      }
      const b = bondRound(young, rng);
      assert.equal(b.bubbles.length, 6);
      const values = b.bubbles.map((x) => x.value).sort((x, y) => x - y);
      for (let k = 0; k < 3; k += 1) assert.equal(values[k] + values[5 - k], b.target, 'bubbles pair up to the target');
      const l = lineRound(young, rng);
      assert.ok(l.target >= l.min && l.target <= l.max);
      assert.equal(linePoints(l, l.target), 3);
      assert.equal(linePoints(l, l.target - l.min > l.max - l.target ? l.min : l.max), 0);
    }
  }
  assert.equal(memoryScore(6, 6), 10);
  assert.equal(memoryScore(6, 30), 2);
});

test('100 levels: built from every pack, a boss every 10th level, ramping up', async () => {
  const { buildLevels, levelStars, applyLevel, currentLevel, isUnlocked, LEVEL_COUNT } = await import('../js/engine/levels.js');
  const loadPackForTest = (file, young) => {
    const pack = JSON.parse(readFileSync(new URL(`../packs/${file}`, import.meta.url), 'utf8'));
    return { pack: { ...pack, young }, skillById: new Map(pack.topics.flatMap((t) => t.skills.map((s) => [s.skillId, s]))) };
  };
  const { questionsForSkill } = await import('../js/engine/practice.js');
  for (const [file, young] of [['math-k2.json', true], ['math-g4.json', false]]) {
    const indexed = loadPackForTest(file, young);
    const levels = buildLevels(indexed);
    assert.equal(levels.length, LEVEL_COUNT);
    const allSkills = new Set();
    for (const l of levels) {
      assert.equal(l.boss, l.n % 10 === 0, `level ${l.n} boss flag`);
      assert.ok(l.skillIds.length >= 1 && l.skillIds.every((id) => indexed.skillById.has(id)), `level ${l.n} skills exist`);
      l.skillIds.forEach((id) => allSkills.add(id));
      if (l.boss) assert.ok(l.size > levels[l.n - 2].size && l.pass >= 0.7, `boss ${l.n} is harder`);
      // Every skill can fill its share of the set.
      for (const id of l.skillIds) assert.ok(questionsForSkill(indexed.skillById.get(id), Math.ceil(l.size / l.skillIds.length)).length > 0);
    }
    assert.equal(allSkills.size, indexed.skillById.size, `${file}: every skill appears in some level`);
    assert.ok(levels[95].size >= levels[0].size, 'sets do not get shorter');
    assert.ok(levels[95].skillIds.length > levels[0].skillIds.length, 'later levels mix in review');
  }
  const boss = { n: 10, pass: 0.7 };
  assert.equal(levelStars(boss, 6, 10), 0, 'a boss needs 70%');
  assert.equal(levelStars({ n: 3, pass: 0.5 }, 5, 10), 1);
  assert.equal(levelStars({ n: 3, pass: 0.5 }, 9, 10), 3);
  let r = { ...emptyRewards('p') };
  ({ rewards: r } = applyLevel(r, 1, 2, true));
  assert.ok(isUnlocked(2, r.levels) && !isUnlocked(3, r.levels));
  assert.equal(currentLevel(r.levels), 2);
  const first = applyLevel({ ...r, levels: { ...r.levels, 9: 1 } }, 10, 3, true);
  assert.ok(first.firstClear && first.bonus >= 20 && first.rewards.bossesBeaten === 1);
  const again = applyLevel(first.rewards, 10, 3, true);
  assert.equal(again.bonus, 0, 'bonus only the first time');
});
