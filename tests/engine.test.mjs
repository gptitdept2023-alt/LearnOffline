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
  convertUnits: { forms: ['toSmall', 'toBig', 'whole', 'add'] }, readClock: {}, clock24h: {}, timeDuration: {},
  moneyProblem: {}, angles: {}, areaPerimeter: {}, symmetry: {}, readGraph: {},
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

test('every technique leads to the question answer', async () => {
  const { methodFor } = await import('../js/engine/techniques.js');
  const rng = seededRng(11);
  let checked = 0;
  for (const type of Object.keys(GENERATORS)) {
    for (let i = 0; i < 300; i += 1) {
      const q = generate({ type, ...PARAMS[type] }, rng);
      const m = methodFor(q);
      if (!q.method) continue;
      assert.ok(m, `${type}: method ${q.method.kind} resolves`);
      assert.ok(m.steps.length >= 2 && m.guided.length >= 1, `${type}: has steps and guided`);
      for (const s of m.steps) assert.ok(s.text && !/undefined|NaN/.test(s.text), `${type}: step text ${s.text}`);
      for (const g of m.guided) assert.ok(!/undefined|NaN/.test(g.prompt), `${type}: guided ${g.prompt}`);
      // The last guided step answers the whole question (except remainders and kinder taps, which equal it too).
      const last = m.guided[m.guided.length - 1];
      if (q.method.kind !== 'longDivide' && q.method.kind !== 'equivalentFraction' && q.method.kind !== 'sameDenominator') {
        assert.equal(String(last.answer), String(q.answer), `${type}/${q.method.kind}: ${q.prompt}`);
      }
      checked += 1;
    }
  }
  assert.ok(checked > 3000);
});

test('column subtraction renames across zeros correctly', async () => {
  const { methodFor } = await import('../js/engine/techniques.js');
  const m = methodFor({ method: { kind: 'columnSub', a: 6002, b: 2748 } });
  const digitsFromGuided = m.guided.slice(0, -1).map((g) => g.answer).reverse().join('');
  assert.equal(Number(digitsFromGuided), 6002 - 2748);
  const add = methodFor({ method: { kind: 'columnAdd', a: 9876, b: 4567 } });
  assert.equal(add.steps.at(-2).visual.result, 9876 + 4567);
});

test('generated questions are never ambiguous', () => {
  const rng = seededRng(2026);
  for (let i = 0; i < 5000; i += 1) {
    // Place value: the asked digit appears exactly once and is not zero.
    const pv = generate({ type: 'placeValue', digits: 5 }, rng);
    const m = /In ([\d,]+), the digit (\d) stands/.exec(pv.prompt);
    if (m) {
      const digitsInNumber = m[1].replace(/,/g, '').split('');
      assert.equal(digitsInNumber.filter((d) => d === m[2]).length, 1, pv.prompt);
      assert.notEqual(m[2], '0', pv.prompt);
    }
    // Shapes: a square and a rectangle never appear in the same question.
    const sh = generate({ type: 'shapes' }, rng);
    const shown = new Set([...sh.choices, sh.visual?.shape].filter(Boolean));
    assert.ok(!(shown.has('square') && shown.has('rectangle')), JSON.stringify(sh));
    // Choice questions: exactly one choice is correct.
    for (const type of ['compare', 'factorsMultiples', 'fractionOfShape', 'moreOrFewer', 'patterns', 'countPictures', 'numberOrder']) {
      const q = generate({ type }, rng);
      assert.equal(q.choices.filter((c) => isCorrect(q, c)).length, 1, `${type}: ${q.prompt} ${q.choices}`);
    }
  }
  // Fraction choices must not include a second fraction equal to the answer (e.g. 1/2 and 2/4).
  for (let i = 0; i < 3000; i += 1) {
    const q = generate({ type: 'fractionOfShape', denominators: [2, 3, 4, 6, 8] }, rng);
    const val = (f) => { const [n, d] = f.split('/').map(Number); return n / d; };
    assert.equal(q.choices.filter((c) => Math.abs(val(c) - val(q.answer)) < 1e-9).length, 1, `${q.answer} ${q.choices}`);
  }
});

test('long division steps rebuild the quotient and remainder', async () => {
  const { longDivisionSteps } = await import('../js/engine/longDivision.js');
  const { methodFor } = await import('../js/engine/techniques.js');
  for (let divisor = 2; divisor <= 9; divisor += 1) {
    for (const dividend of [17, 84, 305, 612, 600, 847, 999, 1000, 9876]) {
      const steps = longDivisionSteps(dividend, divisor);
      const quotient = Number(steps.filter((s) => !s.lead).map((s) => s.q).join(''));
      assert.equal(quotient, Math.floor(dividend / divisor), `${dividend} ÷ ${divisor}`);
      assert.equal(steps[steps.length - 1].rem, dividend % divisor, `${dividend} ÷ ${divisor} remainder`);
      const m = methodFor({ method: { kind: 'longDivide', dividend, divisor } });
      for (const s of m.steps) assert.ok(!/undefined|NaN/.test(s.text), s.text);
      const placeAnswers = m.guided.filter((g) => / in each group\?$/.test(g.prompt)).map((g) => g.answer).join('');
      assert.equal(Number(placeAnswers), Math.floor(dividend / divisor), `guided digits for ${dividend} ÷ ${divisor}`);
    }
  }
});

test('multiplication methods never split off a zero part', async () => {
  const { methodFor } = await import('../js/engine/techniques.js');
  const ZERO_PART = /\band 0\b|\+ 0 =|= 0 \+|× 0 =|\b0 × /;
  for (const a of [7, 40, 305, 745, 1000, 2408]) {
    for (let b = 2; b <= 99; b += 1) {
      const m = methodFor({ method: { kind: 'splitMultiply', a, b } });
      for (const s of m.steps) assert.ok(!ZERO_PART.test(s.text), `${a} × ${b}: ${s.text}`);
      for (const g of m.guided) assert.ok(!ZERO_PART.test(g.prompt), `${a} × ${b}: ${g.prompt}`);
      assert.equal(String(m.guided.at(-1).answer), String(a * b), `${a} × ${b} ends on the answer`);
    }
  }
  const tens = methodFor({ method: { kind: 'splitMultiply', a: 745, b: 40 } });
  assert.equal(tens.name, 'Multiply by tens');
  assert.equal(tens.steps.at(-1).visual.kind, 'shift');
  assert.ok(tens.guided.some((g) => g.prompt === '2,980 × 10 = ?' && g.answer === 29800));
});

test('faster-way tricks agree with the answer and come after the main method', async () => {
  const { methodFor } = await import('../js/engine/techniques.js');
  const fmt = (n) => n.toLocaleString('en-US');
  const cases = [];
  for (let a = 10; a <= 9999; a += 37) {
    for (const b of [2, 4, 5, 7, 8, 9, 19, 25, 29, 98, 199, 298]) {
      cases.push({ kind: 'columnAdd', a, b, answer: a + b });
      if (a > b) cases.push({ kind: 'columnSub', a, b, answer: a - b });
      cases.push({ kind: 'splitMultiply', a, b, answer: a * b });
      if (b < 10) cases.push({ kind: 'longDivide', dividend: a * b, divisor: b, answer: a });
    }
  }
  for (const a of [6002, 4005, 700, 503]) cases.push({ kind: 'columnSub', a, b: 248, answer: a - 248 });
  let tricks = 0;
  for (const { answer, ...method } of cases) {
    const m = methodFor({ method });
    assert.ok(m.steps.length >= 2, 'the main method is always there');
    if (!m.faster) continue;
    tricks += 1;
    const label = JSON.stringify(method);
    assert.equal(m.faster.answer, answer, label);
    assert.ok(m.faster.steps.length >= 1 && m.faster.why, label);
    for (const st of m.faster.steps) assert.ok(!/undefined|NaN|Infinity/.test(st.text), `${label}: ${st.text}`);
    assert.ok(m.faster.steps.at(-1).text.includes(fmt(answer)), `${label} ends on the answer: ${m.faster.steps.at(-1).text}`);
  }
  assert.ok(tricks > 1000, `tricks found: ${tricks}`);
  const named = (method) => methodFor({ method }).faster?.name;
  assert.equal(named({ kind: 'longDivide', dividend: 795, divisor: 5 }), 'Use a friendly number');
  assert.equal(named({ kind: 'columnAdd', a: 456, b: 298 }), 'Round and adjust');
  assert.equal(named({ kind: 'columnSub', a: 532, b: 198 }), 'Round and adjust');
  assert.equal(named({ kind: 'columnSub', a: 6002, b: 2743 }), 'Same difference');
  assert.equal(named({ kind: 'splitMultiply', a: 745, b: 9 }), 'One group too many');
  assert.equal(named({ kind: 'splitMultiply', a: 745, b: 40 }), undefined, '× tens is already the quick way');
});

test('long division shows divide, multiply, subtract, bring down and a check at every place', async () => {
  const { longDivisionSteps } = await import('../js/engine/longDivision.js');
  const { methodFor } = await import('../js/engine/techniques.js');
  const fmt = (n) => n.toLocaleString('en-US');
  const cases = [[795, 5], [305, 5], [612, 6], [847, 4], [1000, 8], [100, 7], [9876, 9], [4005, 5], [1024, 12], [9999, 25], [17, 3]];
  for (const [dividend, divisor] of cases) {
    const label = `${dividend} ÷ ${divisor}`;
    const plan = longDivisionSteps(dividend, divisor);
    const m = methodFor({ method: { kind: 'longDivide', dividend, divisor } });
    const text = m.steps.map((st) => st.text);
    const worked = plan.filter((p) => !p.lead);
    worked.forEach((p, w) => {
      assert.ok(text.some((t) => t.startsWith(`Multiply: ${p.q} × ${divisor} = ${fmt(p.product)}.`) && t.includes(`Subtract: ${fmt(p.cur)} − ${fmt(p.product)} = ${fmt(p.rem)}.`)),
        `${label}: multiply and subtract for ${p.cur}`);
      if (w > 0) assert.ok(text.some((t) => t.includes(`bring down the ${p.digit}`)), `${label}: bring down ${p.digit}`);
      assert.ok(text.some((t) => t.includes(`Write ${p.q} on top`)), `${label}: write ${p.q} on top`);
    });
    // Two steps per worked place, one per leading place, plus intro and check.
    assert.equal(m.steps.length, 2 + worked.length * 2 + (plan.length - worked.length), label);
    const q = Math.floor(dividend / divisor);
    const r = dividend % divisor;
    assert.ok(text.at(-1).includes(`${fmt(q)} × ${divisor} = ${fmt(q * divisor)}`) && text.at(-1).includes('It matches'), `${label}: check`);
    if (r) assert.ok(text.at(-1).includes(`+ ${r} = ${fmt(dividend)}`), `${label}: check adds the remainder`);
    for (const t of text) assert.ok(!/undefined|NaN/.test(t), `${label}: ${t}`);
    for (const g of m.guided) {
      const mul = g.prompt.match(/^Multiply: (\d+) × (\d+) = \?$/);
      if (mul) assert.equal(g.answer, Number(mul[1]) * Number(mul[2]), g.prompt);
      const sub = g.prompt.match(/^Subtract: ([\d,]+) − ([\d,]+) = \?$/);
      if (sub) assert.equal(g.answer, Number(sub[1].replace(/,/g, '')) - Number(sub[2].replace(/,/g, '')), g.prompt);
    }
  }
});

test('spoken maths reads naturally, with pauses in chains', async () => {
  const { toSpokenText } = await import('../js/core/speech.js');
  assert.equal(toSpokenText('Use facts you know: 7 × 8 = 7 × 4 × 2 = 28 × 2 = 56.'),
    'Use facts you know. 7 times 8 equals 7 times 4 times 2, equals 28 times 2, equals 56.');
  assert.equal(toSpokenText('8 + 5 = 13.'), '8 plus 5 equals 13.');
  assert.equal(toSpokenText('305 ÷ 5 = ?'), '305 divided by 5 equals what?');
  assert.equal(toSpokenText('2/3 = ?/6'), '2 thirds equals how many sixths?');
  assert.equal(toSpokenText('1/2 + 1/4'), '1 half plus 1 fourth');
  assert.equal(toSpokenText('The parts stay 8ths.'), 'The parts stay eighths.');
  assert.equal(toSpokenText('3 × ? = 12'), '3 times what equals 12');
});

test('spoken maths keeps separate clauses separate', async () => {
  const { toSpokenText } = await import('../js/core/speech.js');
  assert.equal(toSpokenText('3 = 3, 8 = 8, then 4 > 1.'), '3 equals 3, 8 equals 8, then 4 is greater than 1.');
});

test('daily mix is never empty, even when every skill is mastered and not due', async () => {
  const { pickDailyMix } = await import('../js/engine/mastery.js');
  const now = Date.now();
  const ids = ['a', 'b', 'c'];
  const mastered = (skillId, inDays) => ({ skillId, score: 95, attempts: 12, correct: 11, level: 3, nextReviewAt: now + inDays * 86_400_000 });
  const mastery = new Map([['a', mastered('a', 5)], ['b', mastered('b', 2)], ['c', mastered('c', 9)]]);
  assert.deepEqual(pickDailyMix(ids, mastery, 2, now), ['b', 'a'], 'soonest review first');
  // Mixed: learning skills still come before mastered ones.
  mastery.set('c', { skillId: 'c', score: 40, attempts: 3, correct: 1, level: 0, nextReviewAt: now + 86_400_000 });
  assert.equal(pickDailyMix(ids, mastery, 2, now)[0], 'c');
});
