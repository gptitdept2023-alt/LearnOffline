// Grade 4 measurement, time, money, geometry and graph topics.
import test from 'node:test';
import assert from 'node:assert/strict';
import { generate } from '../js/engine/generators.js';
import { methodFor } from '../js/engine/techniques.js';
import { seededRng } from '../js/core/random.js';
import { toSpokenText } from '../js/core/speech.js';
import { isCorrect } from '../js/engine/answers.js';
import { timeJumps } from '../js/engine/topics/time.js';
import { changeJumps } from '../js/engine/topics/money.js';
import { SYMMETRY_SHAPES } from '../js/engine/topics/geometry.js';
import { clock12, clock24, duration, money } from '../js/engine/topics/shared.js';

const TYPES = [
  ['convertUnits', { forms: ['toSmall', 'toBig', 'whole', 'add'] }], ['readClock', {}], ['clock24h', {}], ['timeDuration', {}],
  ['moneyProblem', {}], ['angles', {}], ['areaPerimeter', {}], ['symmetry', {}], ['readGraph', {}],
];

test('new topics: every question and worked step reads cleanly', () => {
  const rng = seededRng(21);
  for (const [type, params] of TYPES) {
    for (let i = 0; i < 400; i += 1) {
      const q = generate({ type, ...params }, rng);
      const m = methodFor(q);
      assert.ok(m, `${type} has a method`);
      const texts = [q.prompt, ...m.steps.map((s) => s.text), ...m.guided.map((g) => g.prompt)];
      for (const t of texts) {
        assert.ok(!/undefined|NaN|\.\.(\s|$)|\b0 (min|cm|g|ml|m)\b|and 0\b|(^|\s)0¢|\ba [aeiou]/.test(t), `${type}: "${t}"`);
      }
      assert.equal(String(m.guided.at(-1).answer), String(q.answer), `${type}: guided ends on the answer (${q.prompt})`);
    }
  }
});

test('time helpers and timeline jumps', () => {
  assert.equal(clock12(13 * 60 + 5), '1:05 p.m.');
  assert.equal(clock12(0), '12:00 a.m.');
  assert.equal(clock24(19 * 60 + 15), '19:15');
  assert.equal(clock24(7 * 60), '07:00');
  assert.equal(duration(95), '1 h 35 min');
  assert.equal(duration(60), '1 h');
  assert.deepEqual(timeJumps(9 * 60 + 45, 11 * 60 + 20), [15, 60, 20]);
  assert.deepEqual(timeJumps(10 * 60, 12 * 60), [120], 'no zero jumps');
  assert.deepEqual(timeJumps(9 * 60 + 5, 9 * 60 + 50), [45], 'within one hour');
  for (let s = 420; s < 700; s += 5) {
    for (let e = s + 5; e < s + 200; e += 5) assert.equal(timeJumps(s, e).reduce((a, b) => a + b, 0), e - s);
  }
});

test('money keeps centavos exact and accepts a typed ₱', () => {
  assert.equal(money(10000 - 3775), '₱62.25');
  assert.equal(money(123750), '₱1,237.50');
  assert.deepEqual(changeJumps(3775, 10000), [25, 200, 6000], 'next peso, next ₱10, then the bill');
  const rng = seededRng(4);
  for (let i = 0; i < 300; i += 1) {
    const q = generate({ type: 'moneyProblem' }, rng);
    assert.equal(q.answer, Math.round(q.answer * 100) / 100, `${q.prompt} -> ${q.answer}`);
    assert.ok(isCorrect(q, q.display), `typed ${q.display} is accepted`);
  }
});

test('symmetry data: true lines, tempting lines that are not', () => {
  const expected = { square: 4, rectangle: 2, 'equilateral triangle': 3, pentagon: 5, hexagon: 6, kite: 1, parallelogram: 0, heart: 1 };
  for (const [shape, n] of Object.entries(expected)) {
    assert.equal(SYMMETRY_SHAPES[shape].lines.length, n, shape);
    assert.ok(SYMMETRY_SHAPES[shape].notLines.length >= 1, `${shape} has a "no" line`);
  }
});

test('measures, money and turns are read aloud as words', () => {
  assert.equal(toSpokenText('3 m 45 cm = ? cm'), '3 metres 45 centimetres equals how many centimetres?');
  assert.equal(toSpokenText('₱37.75 + 25¢ = ₱38.00.'), '37 pesos 75 centavos plus 25 centavos equals 38 pesos.');
  assert.equal(toSpokenText('He pays with a ₱1,000 bill.'), 'He pays with a 1000 peso bill.');
  assert.equal(toSpokenText('How many degrees is a 3/4 turn?'), 'How many degrees is a three-quarter turn?');
  assert.equal(toSpokenText('What is its area, in cm²?'), 'What is its area, in square centimetres?');
  assert.equal(toSpokenText('It lasts 1 h 40 min.'), 'It lasts 1 hour 40 minutes.');
  assert.equal(toSpokenText('Ana has 3 marbles.'), 'Ana has 3 marbles.', 'ordinary words are untouched');
});

test('symmetry fold lines are exact; "not a line" choices are clearly wrong', () => {
  /** Largest distance from a reflected corner to the nearest corner. */
  const mismatch = (pts, [x1, y1, x2, y2]) => {
    const [dx, dy] = [x2 - x1, y2 - y1];
    const len2 = dx * dx + dy * dy;
    return Math.max(...pts.map(([px, py]) => {
      const t = ((px - x1) * dx + (py - y1) * dy) / len2;
      const [fx, fy] = [x1 + t * dx, y1 + t * dy];
      const [rx, ry] = [2 * fx - px, 2 * fy - py];
      return Math.min(...pts.map(([qx, qy]) => Math.hypot(rx - qx, ry - qy)));
    }));
  };
  for (const [name, shape] of Object.entries(SYMMETRY_SHAPES)) {
    if (!shape.points) continue; // the heart is a curve, checked by eye
    const pts = shape.points.split(' ').map((p) => p.split(',').map(Number));
    for (const line of shape.lines) assert.ok(mismatch(pts, line) < 0.6, `${name}: fold ${line} lands exactly`);
    for (const line of shape.notLines) assert.ok(mismatch(pts, line) > 10, `${name}: ${line} is clearly not a fold`);
  }
});

test('voice audit regressions: symbols, clock times and unknowns are read as words', () => {
  const cases = [
    ['It is −. Type − to go on.', 'It is minus. Type minus to go on.'],
    ['Label what you know, and put ? on what you must find.', 'Label what you know, and put a question mark on what you must find.'],
    ['Which operation finds the ?', 'Which operation finds the question mark'],
    ['515 ÷ 4 = 128 remainder ?', '515 divided by 4 equals 128 remainder what?'],
    ['646 ÷ 4 = ? remainder 2', '646 divided by 4 equals what, remainder 2?'],
    ['₱45 + ₱28 = ₱?', '45 pesos plus 28 pesos equals how many pesos?'],
    ['75¢ + 50¢ = ?¢', '75 centavos plus 50 centavos equals how many centavos?'],
    ['Change both into g first.', 'Change both into grams first.'],
    ['40 min = 25 min + ? min', '40 minutes equals 25 minutes plus how many minutes?'],
    ['It is 1:05 p.m.. Well done', 'It is 1 oh 5 p.m. Well done'],
    ['13:00 is 1:00 p.m.', '13 hundred is 1 p.m.'],
    ['It is 4:00.', "It is 4 o'clock."],
    ['₱1, so 125¢', '1 peso, so 125 centavos'],
    ['1 kg = 1,000 g and 1 ℓ = 1,000 ml', '1 kilogram equals 1000 grams and 1 litre equals 1000 millilitres'],
  ];
  for (const [text, spoken] of cases) assert.equal(toSpokenText(text), spoken, text);
});

test('worked-solution audit regressions', () => {
  const texts = (method) => { const m = methodFor({ method }); return [...m.steps.map((s) => s.text), ...m.guided.map((g) => g.prompt)].join(' | '); };
  assert.ok(!/groups of|\+/.test(texts({ kind: 'skipCount', groups: 1, each: 6 })), '1 × 6 is one group, not 6 + 6');
  assert.ok(!/\b0 × 8|\+ 0 hundreds|30 \+ 0/.test(texts({ kind: 'longDivide', dividend: 2400, divisor: 8 }) + texts({ kind: 'longDivide', dividend: 4005, divisor: 5 }) + texts({ kind: 'longDivide', dividend: 690, divisor: 6 })));
  assert.ok(!/Add the parts/.test(texts({ kind: 'splitMultiply', a: 600, b: 3 })), 'one part needs no adding');
  assert.match(texts({ kind: 'subtractBond', a: 20, b: 2 }), /Count back: 19, 18/);
  assert.ok(!/ths\b|1 parts/.test(texts({ kind: 'sameDenominator', x: 2, y: 1, den: 3, op: '−' })));
  assert.equal(methodFor({ method: { kind: 'longDivide', dividend: 808, divisor: 6, asks: 'quotient' } }).guided.at(-1).answer, 134);
  for (const [a, b] of [[4136, 2617], [5000, 4679]]) {
    const add = methodFor({ method: { kind: 'columnAdd', a, b } }).faster;
    assert.ok(!add || !/2,620|4,680/.test(add.steps.map((s) => s.text).join(' ')), 'no rounding of big numbers to a ten');
  }
  const div = methodFor({ method: { kind: 'longDivide', dividend: 466, divisor: 2 } }).faster;
  assert.ok(!div || !/470/.test(div.steps.map((s) => s.text).join(' ')), '470 ÷ 2 is not a friendly fact');
});
