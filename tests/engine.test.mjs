// Unit tests for the DOM-free engine. Run with: node --test tests/
import test from 'node:test';
import assert from 'node:assert/strict';
import { GENERATORS, generate } from '../js/engine/generators.js';
import { isCorrect, isBlank, parseNumber } from '../js/engine/answers.js';
import { applyAnswer, applySetResult, emptyMastery, statusOf, pickDailyMix } from '../js/engine/mastery.js';
import { applySet, emptyRewards, currentStreak } from '../js/engine/rewards.js';
import { questionsForSkill, buildMixSet } from '../js/engine/practice.js';
import { seededRng } from '../js/core/random.js';

const PARAMS = {
  count: { max: 20 }, compare: { max: 1000 }, placeValue: { digits: 5 }, numberBond: {},
  addition: { min: 10, max: 99, regroup: true }, subtraction: { min: 10, max: 99, regroup: false },
  multiplication: { tables: [6, 7, 8, 9] }, division: { tables: [3, 4] },
  multiplyLong: { digits: 3, byDigits: 2 }, divideLong: { digits: 3, remainder: true },
  factorsMultiples: {}, fractionOfShape: {}, equivalentFraction: {}, fractionSameDen: {}, decimals: {},
  wordProblem: { kinds: ['partWhole', 'compare', 'multiply'], max: 500, maxTimes: 6 },
  countPictures: {}, numberOrder: {}, moreOrFewer: {}, shapes: {}, patterns: {}, addPictures: {}, takeAwayPictures: {},
};

test('every generator produces 500 well-formed, self-consistent questions', () => {
  const rng = seededRng(42);
  for (const type of Object.keys(GENERATORS)) {
    assert.ok(PARAMS[type], `test params missing for ${type}`);
    for (let i = 0; i < 500; i += 1) {
      const q = generate({ type, ...PARAMS[type] }, rng);
      assert.ok(q.prompt, `${type} has prompt`);
      assert.ok(['numeric', 'choice', 'fraction'].includes(q.answerType), `${type} answerType`);
      if (q.answerType === 'choice') {
        assert.ok(q.choices.includes(String(q.answer)), `${type}: answer ${q.answer} in choices ${q.choices}`);
        assert.equal(new Set(q.choices).size, q.choices.length, `${type}: duplicate choices ${q.choices}`);
        assert.ok(q.choices.length >= 2, `${type}: at least 2 choices`);
      }
      if (q.answerType === 'numeric') {
        assert.ok(Number.isFinite(Number(q.answer)) && Number(q.answer) >= 0, `${type}: numeric answer ${q.answer}`);
      }
      // The stated answer must be accepted by the checker.
      assert.ok(isCorrect(q, String(q.answer)), `${type}: own answer accepted (${q.prompt} -> ${q.answer})`);
    }
  }
});

test('addition regroup flag is honoured', () => {
  const rng = seededRng(1);
  for (let i = 0; i < 200; i += 1) {
    const q = generate({ type: 'addition', min: 10, max: 99, regroup: false }, rng);
    const [a, b] = q.prompt.split(' = ')[0].split(' + ').map(Number);
    assert.ok((a % 10) + (b % 10) < 10 && Math.floor(a / 10) % 10 + Math.floor(b / 10) % 10 < 10, q.prompt);
  }
});

test('word problem answers match their arithmetic', () => {
  const rng = seededRng(7);
  for (let i = 0; i < 300; i += 1) {
    const q = generate({ type: 'wordProblem', kinds: ['partWhole', 'compare', 'multiply'], max: 100 }, rng);
    assert.ok(q.model && q.model.rows.length >= 1);
    const lastNumber = Number(q.explain.split('= ').pop().replace(/,/g, ''));
    assert.equal(lastNumber, q.answer, q.prompt);
  }
});

test('answer checking is forgiving on format, strict on value', () => {
  assert.equal(parseNumber('1,250'), 1250);
  assert.ok(isCorrect({ answerType: 'numeric', answer: 0.5 }, '.5'));
  assert.ok(isCorrect({ answerType: 'numeric', answer: 0.5 }, '0.50'));
  assert.ok(!isCorrect({ answerType: 'numeric', answer: 12 }, '13'));
  assert.ok(isCorrect({ answerType: 'fraction', answer: '1/2' }, '2/4'));
  assert.ok(!isCorrect({ answerType: 'fraction', answer: '1/2' }, '2/3'));
  assert.ok(isBlank({ answerType: 'numeric' }, 'abc'));
  assert.ok(isBlank({ answerType: 'fraction' }, '3/0'));
});

test('mastery rises with correct answers and schedules review', () => {
  let rec = emptyMastery('p', 's');
  assert.equal(statusOf(rec), 'notStarted');
  for (let i = 0; i < 10; i += 1) rec = applyAnswer(rec, true, 1000);
  assert.equal(statusOf(rec), 'mastered');
  rec = applySetResult(rec, 1, 1000);
  assert.equal(rec.level, 1);
  assert.ok(rec.nextReviewAt > 1000);
  const weak = applyAnswer(applyAnswer(emptyMastery('p', 'w'), false), true);
  assert.equal(statusOf(weak), 'learning');
});

test('daily mix puts due reviews first, then weakest, then new skills', () => {
  const now = 10_000;
  const m = new Map([
    ['a', { skillId: 'a', score: 90, attempts: 10, nextReviewAt: now + 5 }],
    ['b', { skillId: 'b', score: 30, attempts: 3, nextReviewAt: now + 5 }],
    ['c', { skillId: 'c', score: 95, attempts: 12, nextReviewAt: now - 1 }],
  ]);
  assert.deepEqual(pickDailyMix(['a', 'b', 'c', 'd', 'e'], m, 3, now), ['c', 'b', 'd']);
});

test('streaks continue on consecutive days and reset after a gap', () => {
  let r = emptyRewards('p');
  ({ rewards: r } = applySet(r, { correct: 10, total: 10, masteredCount: 0 }, '2026-01-01'));
  assert.equal(r.stars, 15);
  assert.ok(r.badges.includes('first-set') && r.badges.includes('perfect-set'));
  ({ rewards: r } = applySet(r, { correct: 5, total: 10, masteredCount: 0 }, '2026-01-02'));
  assert.equal(r.streak, 2);
  ({ rewards: r } = applySet(r, { correct: 5, total: 10, masteredCount: 0 }, '2026-01-02'));
  assert.equal(r.streak, 2);
  assert.equal(currentStreak(r, '2026-01-05'), 0);
  ({ rewards: r } = applySet(r, { correct: 5, total: 10, masteredCount: 0 }, '2026-01-05'));
  assert.equal(r.streak, 1);
  assert.equal(r.bestStreak, 2);
});

test('practice sets have the requested size and no repeated prompts', () => {
  const rng = seededRng(3);
  const skill = { skillId: 'x', generator: { type: 'multiplication', tables: [2, 3] } };
  const qs = questionsForSkill(skill, 10, rng);
  assert.equal(qs.length, 10);
  assert.equal(new Set(qs.map((q) => q.prompt)).size, 10);
  const mix = buildMixSet([skill, { skillId: 'y', questions: [{ type: 'numeric', prompt: '1+1', answer: 2 }] }], false, rng);
  assert.ok(mix.length <= 10 && mix.some((q) => q.skillId === 'y'));
});
