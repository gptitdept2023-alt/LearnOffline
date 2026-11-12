import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  TRICKS, MIX_ID, trickById, tricksForGrade, gradeOfLevel, drillQuestion, exampleOf, trickStars,
} from '../js/engine/tricks.js';
import { seededRng } from '../js/core/random.js';

/** Every number written in a step, commas removed. */
const numbersIn = (text) => (text.match(/\d[\d,]*/g) || []).map((n) => Number(n.replace(/,/g, '')));

/** Work out a prompt like "17 + 6 + 3 + 4", "72 − 38", "16% of 50" or "7 + ? = 10" independently of the trick. */
const solve = (prompt) => {
  const p = prompt.replace(/,/g, '');
  let m = /^(\d+) \+ \? = (\d+)$/.exec(p);
  if (m) return Number(m[2]) - Number(m[1]);
  m = /^(\d+)% of (\d+)$/.exec(p);
  if (m) return (Number(m[1]) * Number(m[2])) / 100;
  const js = p.replace(/−/g, '-').replace(/×/g, '*').replace(/÷/g, '/');
  assert.match(js, /^[\d +\-*/]+$/, `unexpected prompt ${prompt}`);
  return Function(`return (${js});`)();
};

test('tricks: ids are unique, every grade from Kinder 2 to 6 has some', () => {
  assert.equal(new Set(TRICKS.map((tr) => tr.id)).size, TRICKS.length);
  assert.ok(!trickById(MIX_ID), 'mix is not a trick id');
  for (let g = 0; g <= 6; g += 1) assert.ok(tricksForGrade(g).mine.length > 0, `grade ${g}`);
  assert.equal(tricksForGrade(0).mine.length, 4, 'Kinder sees only its own tricks');
  assert.ok(tricksForGrade(4).stretch.every((tr) => tr.grade === 5));
});

test('tricks: answers are right and the steps reach the answer (2,000 questions each)', () => {
  for (const trick of TRICKS) {
    const rng = seededRng(trick.id.length * 977);
    for (let i = 0; i < 2000; i += 1) {
      const q = trick.make(rng);
      const where = `${trick.id}: ${q.prompt}`;
      assert.ok(Number.isInteger(q.answer) && q.answer >= 0, `${where} -> ${q.answer}`);
      assert.equal(q.answer, solve(q.prompt), where);
      assert.ok(q.steps.length >= 2, where);
      for (const st of q.steps) assert.ok(!/undefined|NaN|Infinity/.test(st.text), `${where}: ${st.text}`);
      // The worked steps must say the answer (the last one, or the one before "why it works").
      const said = q.steps.flatMap((st) => numbersIn(st.text));
      assert.ok(said.includes(q.answer), `${where}: steps never reach ${q.answer}`);
      assert.ok(q.say && !/undefined/.test(q.say), where);
      if (trick.grade === 0) {
        assert.ok(q.answer <= 10, `${where}: Kinder stays within 10`);
        assert.ok(q.choices.includes(q.answer) && new Set(q.choices).size === q.choices.length && q.choices.length === 3, where);
        assert.ok(q.choices.every((c) => c >= 0 && c <= 10), `${where}: choices ${q.choices}`);
      } else {
        assert.equal(q.choices, undefined, `${where}: older learners type the answer`);
      }
    }
  }
});

test('tricks: each drill really suits its trick', () => {
  const rng = seededRng(7);
  for (let i = 0; i < 500; i += 1) {
    assert.match(trickById('add-nine').make(rng).prompt, /^\d+ \+ 9$/);
    assert.match(trickById('times-eleven').make(rng).prompt, /^\d\d × 11$/);
    const sd = trickById('same-difference').make(rng).prompt.split(' − ').map(Number);
    assert.ok(sd[0] % 10 < sd[1] % 10, `same gap only when the ones need renaming: ${sd}`);
    const mt = trickById('make-ten').make(rng).prompt.split(' + ').map(Number);
    assert.ok(mt[0] + mt[1] > 10 && Math.max(...mt) >= 7, `make ten crosses 10: ${mt}`);
    const g = trickById('group-tens').make(rng).prompt.split(' + ').map(Number);
    assert.equal((g[0] + g[2]) % 10, 0, 'first and third make a ten');
    assert.equal(g[1] + g[3], 10, 'second and fourth make ten');
    const hd = trickById('halve-double').make(rng);
    assert.ok(/(10|100) × \d+ = /.test(hd.steps.at(-1).text), `halving ends on × 10 or × 100: ${hd.steps.at(-1).text}`);
    for (const id of ['times-five', 'times-nine', 'double-double', 'round-adjust', 'times-quarter']) {
      const q = trickById(id).make(rng);
      assert.ok(q.steps.length >= 3, `${id} uses its shortcut: ${q.prompt}`);
    }
  }
});

test('tricks: mix draws from the learner\'s tricks; levels map to grades', () => {
  assert.equal(gradeOfLevel('K2'), 0);
  assert.equal(gradeOfLevel('G4'), 4);
  assert.equal(gradeOfLevel('custom'), 1);
  const rng = seededRng(11);
  const kinderIds = new Set(tricksForGrade(0).mine.map((tr) => tr.id));
  for (let i = 0; i < 200; i += 1) {
    assert.ok(kinderIds.has(drillQuestion(MIX_ID, 0, rng).trickId));
    assert.ok(trickById(drillQuestion(MIX_ID, 4, rng).trickId).grade <= 4);
  }
  assert.throws(() => drillQuestion('nope', 4), /not found/);
  assert.throws(() => exampleOf('nope'), /not found/);
  assert.equal(trickStars(8), 8);
  assert.equal(trickStars(20), 8, 'stars are capped');
});

test('tricks: screens are routed and precached', () => {
  const app = readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');
  assert.match(app, /route\('tricks', renderTricks\)/);
  assert.match(app, /route\('trick', renderTrick\)/);
  const sw = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
  for (const f of ['./js/engine/tricks.js', './js/ui/screens/tricks.js']) assert.ok(sw.includes(`'${f}'`), f);
});
