// Grade 4 measurement, time, money, geometry and graph topics.
import test from 'node:test';
import assert from 'node:assert/strict';
import { generate } from '../js/engine/generators.js';
import { methodFor } from '../js/engine/techniques.js';
import { seededRng } from '../js/core/random.js';
import { toSpokenText } from '../js/core/speech.js';
import { isCorrect } from '../js/engine/answers.js';
import { timeJumps } from '../js/engine/topics/time.js';
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
        assert.ok(!/undefined|NaN|\.\.(\s|$)|\b0 (min|cm|g|ml|m)\b|and 0\b|\ba [aeiou]/.test(t), `${type}: "${t}"`);
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

test('money keeps cents exact and accepts a typed $', () => {
  assert.equal(money(1000 - 735), '$2.65');
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
  assert.equal(toSpokenText('$7.35 + 65¢ = $8.00.'), '7 dollars 35 cents plus 65 cents equals 8 dollars.');
  assert.equal(toSpokenText('He pays with a $10 note.'), 'He pays with a 10 dollar note.');
  assert.equal(toSpokenText('How many degrees is a 3/4 turn?'), 'How many degrees is a 3 quarter turn?');
  assert.equal(toSpokenText('What is its area, in cm²?'), 'What is its area, in square centimetres?');
  assert.equal(toSpokenText('It lasts 1 h 40 min.'), 'It lasts 1 hour 40 minutes.');
  assert.equal(toSpokenText('Ana has 3 marbles.'), 'Ana has 3 marbles.', 'ordinary words are untouched');
});
