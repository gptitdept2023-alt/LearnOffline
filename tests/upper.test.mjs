// Grade 5–6 topics: answers checked against independent arithmetic, and every
// worked step re-checked. Run with: npm test
import test from 'node:test';
import assert from 'node:assert/strict';
import { generate } from '../js/engine/generators.js';
import { methodFor } from '../js/engine/techniques.js';
import { isCorrect, parseFraction } from '../js/engine/answers.js';
import { toSpokenText } from '../js/core/speech.js';
import { evaluateSteps } from '../js/engine/topics/ratioAlgebra.js';
import { seededRng } from '../js/core/random.js';

const SPECS = [
  { type: 'fractionUnlike' }, { type: 'fractionUnlike', related: true }, { type: 'mixedNumbers' }, { type: 'fractionOf' },
  { type: 'fractionMultiply' }, { type: 'fractionDivide' },
  { type: 'decimalOps', forms: ['add', 'sub', 'mulWhole', 'divWhole', 'mulDec', 'divDec', 'round'] }, { type: 'decimalOps', forms: ['add', 'sub'], places: 1 },
  { type: 'powersOfTen' }, { type: 'percentage', forms: ['toPercent', 'whatPercent', 'ofQuantity', 'discount', 'increase', 'findWhole'] },
  { type: 'ratio', forms: ['simplify', 'share', 'findPart', 'total', 'difference'] }, { type: 'average', forms: ['mean', 'missing'] },
  { type: 'orderOps', templates: ['basic', 'more'] }, { type: 'algebra' }, { type: 'speed' },
  { type: 'triangleArea', forms: ['area', 'height'] }, { type: 'triangleAngles', forms: ['two', 'right', 'isosceles'] },
  { type: 'volume', forms: ['cuboid', 'cube', 'missing', 'litres'] }, { type: 'circle' },
];

const num = (s) => Number(String(s).replace(/,/g, ''));
const OPS = { '+': (a, b) => a + b, '−': (a, b) => a - b, '×': (a, b) => a * b, '÷': (a, b) => a / b };
const close = (a, b) => Math.abs(a - b) < 1e-9;
const fracValue = (text) => { const f = parseFraction(text); return f ? f.n / f.d : NaN; };

test('every "a op b = ?" in a worked method is right', () => {
  const rng = seededRng(55);
  const sum = /(?:^|: |= )([\d,.]+) ([+−×÷]) ([\d,.]+) = \?$/;
  let checked = 0;
  for (const spec of SPECS) {
    for (let i = 0; i < 400; i += 1) {
      const q = generate(spec, rng);
      const m = methodFor(q);
      assert.ok(m, `${spec.type}: has a method`);
      for (const g of m.guided) {
        const hit = sum.exec(g.prompt);
        if (!hit) continue;
        assert.ok(close(OPS[hit[2]](num(hit[1]), num(hit[3])), Number(g.answer)), `${spec.type}: ${g.prompt} -> ${g.answer}`);
        checked += 1;
      }
      for (const s of m.steps) {
        // "x op y = z" written in a step must be true too.
        for (const [, a, op, b, r] of s.text.matchAll(/(?<![\d.,/])(?<![+−×÷] )([\d,]*\d(?:\.\d+)?) ([+−×÷]) ([\d,]*\d(?:\.\d+)?) = ([\d,]*\d(?:\.\d+)?)(?![\d/]| remainder)/g)) {
          assert.ok(close(OPS[op](num(a), num(b)), num(r)), `${spec.type}: step "${s.text}"`);
          checked += 1;
        }
        assert.ok(!/undefined|NaN|null/.test(s.text), `${spec.type}: ${s.text}`);
      }
    }
  }
  assert.ok(checked > 10000, `checked ${checked}`);
});

test('fraction answers are exact and in simplest form', () => {
  const rng = seededRng(7);
  for (let i = 0; i < 3000; i += 1) {
    const q = generate({ type: 'fractionUnlike', ops: ['+', '−'] }, rng);
    const [, a, b, op, c, d] = /^(\d+)\/(\d+) ([+−]) (\d+)\/(\d+)/.exec(q.prompt);
    const want = op === '+' ? a / b + c / d : a / b - c / d;
    assert.ok(close(fracValue(String(q.answer)), want), `${q.prompt} ${q.answer}`);
    assert.ok(want > 0, q.prompt);
    const parts = /(\d+)\/(\d+)$/.exec(String(q.answer));
    if (parts) {
      const g = (x, y) => (y ? g(y, x % y) : x);
      assert.equal(g(Number(parts[1]), Number(parts[2])), 1, `${q.answer} not simplest`);
    }
    // An improper answer typed as a mixed number (or the other way round) is right.
    if (q.mixed) {
      const f = parseFraction(String(q.answer));
      assert.ok(isCorrect(q, `${f.n}/${f.d}`), `${q.prompt} improper`);
    }
  }
  for (let i = 0; i < 2000; i += 1) {
    const q = generate({ type: 'fractionDivide' }, rng);
    const [l, r] = q.prompt.replace(' = ?', '').split(' ÷ ').map(fracValue);
    assert.ok(close(fracValue(String(q.answer)), l / r), `${q.prompt} ${q.answer}`);
    const qm = generate({ type: 'fractionMultiply' }, rng);
    const [x, y] = qm.prompt.replace(' = ?', '').split(' × ').map(fracValue);
    assert.ok(close(fracValue(String(qm.answer)), x * y), `${qm.prompt} ${qm.answer}`);
  }
});

test('choice questions have exactly one right answer', () => {
  const rng = seededRng(11);
  for (let i = 0; i < 3000; i += 1) {
    const mixed = generate({ type: 'mixedNumbers', forms: ['toMixed'] }, rng);
    const values = mixed.choices.map(fracValue);
    assert.equal(new Set(values.map((v) => v.toFixed(9))).size, values.length, `${mixed.choices}`);
    assert.equal(values.filter((v) => close(v, fracValue(mixed.answer))).length, 1);
    const ratio = generate({ type: 'ratio', forms: ['simplify'] }, rng);
    const [a, b] = /^Write (\d+) : (\d+)/.exec(ratio.prompt).slice(1).map(Number);
    const right = ratio.choices.filter((c) => { const [x, y] = c.split(' : ').map(Number); return close(x / y, a / b); });
    assert.deepEqual(right, [ratio.answer], `${ratio.prompt} ${ratio.choices}`);
    const alg = generate({ type: 'algebra', forms: ['likeTerms', 'write'] }, rng);
    assert.equal(new Set(alg.choices).size, alg.choices.length, `${alg.prompt} ${alg.choices}`);
    assert.ok(alg.choices.includes(alg.answer));
  }
  // The final "Try with help" step offers the answer once among values that differ.
  for (let i = 0; i < 2000; i += 1) {
    const q = generate({ type: pick3(i) }, rng);
    const last = methodFor(q).guided.at(-1);
    if (last.answerType !== 'choice' || !/\//.test(last.answer)) continue;
    const vals = last.choices.map(fracValue);
    assert.equal(new Set(vals.map((v) => v.toFixed(9))).size, vals.length, `${q.prompt}: ${last.choices}`);
  }
});
const pick3 = (i) => ['fractionUnlike', 'fractionMultiply', 'fractionDivide'][i % 3];

test('order of operations follows brackets, then × ÷, then + −', () => {
  const rng = seededRng(3);
  for (let i = 0; i < 3000; i += 1) {
    const q = generate({ type: 'orderOps', templates: ['basic', 'more'] }, rng);
    // eslint-disable-next-line no-new-func
    const js = Function(`return ${q.prompt.replace(' = ?', '').replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-')}`)();
    assert.equal(q.answer, js, q.prompt);
  }
  assert.equal(evaluateSteps([7, '÷', 2]), null); // no remainders
  assert.equal(evaluateSteps([3, '−', 5]), null); // no negatives
  assert.deepEqual(evaluateSteps(['(', 8, '+', 4, ')', '×', 3]).steps.map((s) => s.r), [12, 36]);
});

test('percentages, circles, volume, speed and averages match their formulas', () => {
  const rng = seededRng(19);
  for (let i = 0; i < 3000; i += 1) {
    const p = generate({ type: 'percentage', forms: ['ofQuantity'] }, rng);
    const [, pct, whole] = /(\d+)% of ([\d,]+) = \?|has ([\d,]+)/.exec(p.prompt) || [];
    if (pct) assert.ok(close(p.answer, (Number(pct) / 100) * num(whole)), p.prompt);
    const d = generate({ type: 'percentage', forms: ['discount'] }, rng);
    const [, price, off] = /costs ₱([\d,]+)\. The shop takes (\d+)% off/.exec(d.prompt);
    assert.ok(close(d.answer, num(price) * (1 - Number(off) / 100)), d.prompt);
    const c = generate({ type: 'circle', forms: ['area', 'circumference'] }, rng);
    const r = Number(/radius of (\d+)/.exec(c.prompt)?.[1] || Number(/diameter of (\d+)/.exec(c.prompt)[1]) / 2);
    const want = /area/.test(c.prompt) ? 3.14 * r * r : 3.14 * 2 * r;
    assert.ok(close(c.answer, Number(want.toFixed(6))), `${c.prompt} ${c.answer}`);
    const v = generate({ type: 'volume', forms: ['cuboid'] }, rng);
    const [l, w, h] = /(\d+) cm long, (\d+) cm wide and (\d+) cm high/.exec(v.prompt).slice(1).map(Number);
    assert.equal(v.answer, l * w * h);
    const a = generate({ type: 'average', forms: ['mean'] }, rng);
    const nums = /(?:of|scored) ([\d, and]+?)(?: points|\.$)/.exec(a.prompt)[1].split(/, | and /).map(Number);
    assert.equal(a.answer, nums.reduce((s, x) => s + x, 0) / nums.length, a.prompt);
    const t = generate({ type: 'triangleAngles', forms: ['two', 'right', 'isosceles'] }, rng);
    assert.ok(t.answer > 0 && t.answer < 180, t.prompt);
  }
});

test('Grade 5–6 maths reads aloud as words', () => {
  const rng = seededRng(23);
  for (const spec of SPECS) {
    for (let i = 0; i < 150; i += 1) {
      const q = generate(spec, rng);
      const texts = [q.prompt, ...methodFor(q).steps.map((s) => s.text), ...methodFor(q).guided.map((g) => g.prompt)];
      for (const text of texts) {
        const spoken = toSpokenText(text);
        assert.ok(!/[%π×÷−=]|\d\/\d|\d : \d|cm³|km\/h|m\/min|\d[nky]\b/.test(spoken), `${spec.type}: "${text}" -> "${spoken}"`);
      }
    }
  }
  assert.equal(toSpokenText('2 3/4 + 1/2'), '2 and 3 fourths plus 1 half');
  assert.equal(toSpokenText('3n + 5 = 20'), '3 n plus 5 equals 20');
  assert.equal(toSpokenText('The ratio is 2 : 3.'), 'The ratio is 2 to 3.');
});

test('mixed numbers and percent signs are read when typed', () => {
  assert.deepEqual(parseFraction('1 1/2'), { n: 3, d: 2 });
  assert.deepEqual(parseFraction('11/2'), { n: 11, d: 2 });
  assert.ok(isCorrect({ answerType: 'fraction', answer: '1 1/2' }, '3/2'));
  assert.ok(isCorrect({ answerType: 'fraction', answer: '3/2' }, '1 1/2'));
  assert.ok(!isCorrect({ answerType: 'fraction', answer: '1 1/2' }, '11/2'));
  assert.ok(isCorrect({ answerType: 'numeric', answer: 75 }, '75%'));
});
