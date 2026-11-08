// Science Grades 1–6: every bank, sorting set and sequence is checked for one
// right answer, and every generator is checked against its own data.
// Run with: npm test
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { generate } from '../js/engine/generators.js';
import { isCorrect } from '../js/engine/answers.js';
import { questionsForSkill } from '../js/engine/practice.js';
import { seededRng } from '../js/core/random.js';
import { toSpokenText } from '../js/core/speech.js';
import { QUIZ_BANKS, SORT_SETS, SEQUENCES, FOOD_CHAINS, EXPERIMENTS, pickPrompt } from '../js/engine/topics/science.js';

const root = new URL('..', import.meta.url).pathname;
const index = JSON.parse(readFileSync(`${root}packs/index.json`, 'utf8'));
const sciencePacks = index.packs.filter((p) => p.subject === 'science')
  .map((entry) => ({ entry, pack: JSON.parse(readFileSync(`${root}packs/${entry.file}`, 'utf8')) }));
const allSkills = sciencePacks.flatMap(({ entry, pack }) => pack.topics.flatMap((t) => t.skills.map((s) => ({ entry, topic: t, skill: s }))));
const specsOf = (g) => (g.type === 'mixed' ? g.of.flatMap(specsOf) : [g]);
const BAD_TEXT = /undefined|NaN|null|\[object/;
const EMOJI = /\p{Extended_Pictographic}/u;

test('there is a Science pack for each of Grades 1 to 6, read aloud in Grades 1 and 2', () => {
  assert.deepEqual(sciencePacks.map((p) => p.entry.level), ['G1', 'G2', 'G3', 'G4', 'G5', 'G6']);
  for (const { entry, pack } of sciencePacks) {
    assert.equal(pack.subject, 'science');
    assert.equal(Boolean(entry.readAloud), ['G1', 'G2'].includes(entry.level), entry.packId);
    assert.ok(pack.topics.some((t) => t.challenge), `${entry.packId} has a Challenge zone`);
  }
});

test('question banks: one right answer, different wrong answers, and a reason for each', () => {
  for (const [name, bank] of Object.entries(QUIZ_BANKS)) {
    assert.ok(bank.hint, `${name} hint`);
    assert.ok(bank.items.length >= 10, `${name} has ${bank.items.length} questions; a set needs 10`);
    const prompts = new Set();
    for (const item of bank.items) {
      const label = `${name}: ${item.q}`;
      assert.ok(item.q && item.a && item.e, label);
      assert.ok(!prompts.has(item.q), `${label} is asked twice`);
      prompts.add(item.q);
      assert.ok(item.w.length >= 1 && item.w.length <= 3, label);
      assert.ok(!item.w.includes(item.a), `${label}: the right answer is also a wrong one`);
      assert.equal(new Set(item.w).size, item.w.length, `${label}: repeated wrong answer`);
      for (const text of [item.q, item.a, item.e, ...item.w]) assert.ok(!BAD_TEXT.test(text), `${label}: "${text}"`);
    }
  }
});

test('sorting sets: every thing is in exactly one group', () => {
  for (const [name, set] of Object.entries(SORT_SETS)) {
    assert.ok(set.ask && set.hint, name);
    const names = Object.values(set.groups).flatMap((g) => g.items.map((i) => i.name));
    assert.equal(new Set(names).size, names.length, `${name}: a thing is listed twice: ${names.filter((n, i) => names.indexOf(n) !== i)}`);
    const labels = Object.values(set.groups).map((g) => g.label);
    assert.equal(new Set(labels).size, labels.length, `${name}: two groups share a label`);
    for (const g of Object.values(set.groups)) assert.ok(g.items.length >= 3 && g.name && g.why, `${name}/${g.label}`);
  }
});

test('sequences and food chains have enough steps, none repeated', () => {
  for (const [name, seq] of Object.entries(SEQUENCES)) {
    assert.ok(seq.steps.length >= 3 && seq.name, name);
    assert.equal(new Set(seq.steps).size, seq.steps.length, name);
    if (seq.cycle) assert.ok(seq.loop, `${name}: a cycle says how it starts again`);
  }
  for (const chain of FOOD_CHAINS) {
    const names = chain.map(([one]) => one);
    assert.ok(names.length >= 3, names.join(' → '));
    assert.equal(new Set(names).size, names.length, names.join(' → '));
  }
});

test('every bank, set and sequence is used by a pack, and every pack names real ones', () => {
  const used = { bank: new Set(), set: new Set(), seq: new Set() };
  for (const { skill } of allSkills) {
    for (const spec of specsOf(skill.generator)) {
      if (spec.type === 'sciQuiz') { assert.ok(QUIZ_BANKS[spec.bank], `${skill.skillId}: bank ${spec.bank}`); used.bank.add(spec.bank); }
      if (spec.type === 'sciSort') {
        assert.ok(SORT_SETS[spec.set], `${skill.skillId}: set ${spec.set}`);
        for (const g of spec.groups || []) assert.ok(SORT_SETS[spec.set].groups[g], `${skill.skillId}: group ${g}`);
        used.set.add(spec.set);
      }
      if (spec.type === 'sciOrder') for (const s of spec.seqs) { assert.ok(SEQUENCES[s], `${skill.skillId}: sequence ${s}`); used.seq.add(s); }
    }
  }
  for (const name of Object.keys(QUIZ_BANKS)) assert.ok(used.bank.has(name), `bank ${name} is not used`);
  // electricConductors is also used by the circuit generator.
  for (const name of Object.keys(SORT_SETS)) assert.ok(used.set.has(name) || name === 'electricConductors', `set ${name} is not used`);
  for (const name of Object.keys(SEQUENCES)) assert.ok(used.seq.has(name), `sequence ${name} is not used`);
});

test('every Science skill gives well-formed questions and fills a set without repeats', () => {
  const rng = seededRng(2024);
  for (const { entry, skill } of allSkills) {
    const seen = new Set();
    for (let i = 0; i < 300; i += 1) {
      const q = generate(skill.generator, rng);
      const label = `${skill.skillId}: ${q.prompt}`;
      if (q.answerType === 'choice') {
        assert.ok(q.choices.length >= 2, label);
        assert.equal(new Set(q.choices).size, q.choices.length, `${label} repeats a choice: ${q.choices}`);
        assert.equal(q.choices.filter((c) => c === String(q.answer)).length, 1, `${label}: ${q.answer} in ${q.choices}`);
      } else {
        assert.equal(q.answerType, 'numeric', label);
        assert.ok(Number.isInteger(q.answer) && q.answer > 0, `${label}: ${q.answer}`);
      }
      assert.ok(isCorrect(q, String(q.answer)), `${label}: own answer accepted`);
      assert.ok(q.hint && q.explain, `${label}: hint and reason`);
      for (const text of [q.prompt, q.say, q.hint, q.explain, ...(q.choices || []), q.visual?.text, q.visual?.label]) {
        if (text !== undefined) assert.ok(!BAD_TEXT.test(String(text)), `${label}: "${text}"`);
      }
      // What is read aloud never has a picture symbol or a blank in it.
      const spoken = toSpokenText(q.say || q.prompt);
      assert.ok(!EMOJI.test(spoken) && !/___|[{}]/.test(spoken), `${label}: spoken "${spoken}"`);
      assert.ok(!EMOJI.test(String(q.spoken || q.answer)) || q.spoken, `${label}: the answer is said without its picture`);
      seen.add(`${q.prompt}|${q.answer}|${JSON.stringify(q.visual || '')}|${[...(q.choices || [])].sort()}`);
    }
    assert.ok(seen.size >= 10, `${skill.skillId} has only ${seen.size} different questions`);
    const size = entry.young ? 6 : 10;
    const set = questionsForSkill(skill, size, rng);
    assert.equal(set.length, size, `${skill.skillId} fills a set`);
    const keys = set.map((q) => `${q.prompt}|${JSON.stringify(q.visual || '')}|${[...(q.choices || [])].sort()}|${q.answer}`);
    assert.equal(new Set(keys).size, keys.length, `${skill.skillId}: a set asks the same question twice`);
  }
});

test('sorting answers belong to the group the question names', () => {
  const rng = seededRng(7);
  for (const [name, set] of Object.entries(SORT_SETS)) {
    const groupOf = new Map(Object.values(set.groups).flatMap((g) => g.items.map((i) => [i.name, g])));
    for (let i = 0; i < 400; i += 1) {
      const q = generate({ type: 'sciSort', set: name }, rng);
      if (q.choiceLabels) {
        // pick: only the answer is in the named group.
        const named = Object.values(set.groups).find((g) => q.prompt === pickPrompt(g));
        assert.ok(named, q.prompt);
        for (const c of q.choices) assert.equal(groupOf.get(q.choiceLabels[c]) === named, c === q.answer, `${name}: ${q.prompt} ${c}`);
      } else {
        assert.equal(groupOf.get(q.visual.text).label, q.answer, `${name}: ${q.visual.text}`);
      }
    }
  }
});

test('sequence questions: the step after or before is right, and wrong orders are really wrong', () => {
  const rng = seededRng(8);
  for (const [name, seq] of Object.entries(SEQUENCES)) {
    const n = seq.steps.length;
    for (let i = 0; i < 300; i += 1) {
      const q = generate({ type: 'sciOrder', seqs: [name] }, rng);
      const m = /"(.+)"\?$/.exec(q.prompt);
      if (!m) {
        assert.equal(q.answer, seq.steps.join(' → '));
        for (const c of q.choices) {
          if (c === q.answer) continue;
          const steps = c.split(' → ');
          const rotation = seq.steps.some((_, k) => steps.every((s, j) => s === seq.steps[(j + k) % n]));
          assert.ok(!(seq.cycle && rotation) && c !== q.answer, `${name}: ${c} is also right`);
        }
        continue;
      }
      const at = seq.steps.indexOf(m[1]);
      const want = q.prompt.includes('right after') ? seq.steps[(at + 1) % n] : seq.steps[(at - 1 + n) % n];
      assert.equal(q.answer, want, q.prompt);
      if (!seq.cycle) assert.ok(q.prompt.includes('right after') ? at < n - 1 : at > 0, q.prompt);
    }
  }
});

test('food chains: producer, eaters and population changes follow the arrows', () => {
  const rng = seededRng(9);
  for (let i = 0; i < 1500; i += 1) {
    const q = generate({ type: 'foodChain' }, rng);
    const names = q.visual.text.split(' → ');
    const chain = FOOD_CHAINS.find((c) => c.map(([one]) => one).join(' → ') === q.visual.text);
    assert.ok(chain, q.visual.text);
    let m;
    if (q.prompt.startsWith('Which is the producer')) assert.equal(q.answer, names[0]);
    else if (q.prompt.startsWith('Which animal in this food chain is not eaten')) assert.equal(q.answer, names.at(-1));
    else if ((m = /what does the (.+) eat\?$/.exec(q.prompt))) assert.equal(q.answer, names[names.indexOf(m[1]) - 1]);
    else if ((m = /what eats the (.+)\?$/.exec(q.prompt))) assert.equal(q.answer, names[names.indexOf(m[1]) + 1]);
    else {
      m = /^If all the (.+) died, what would happen to the number of (.+) at first\?$/.exec(q.prompt);
      assert.ok(m, q.prompt);
      const gone = chain.findIndex(([, many]) => many === m[1]);
      const other = chain.findIndex(([, many]) => many === m[2]);
      assert.equal(Math.abs(gone - other), 1, q.prompt);
      assert.equal(q.answer, other < gone ? 'It would go up.' : 'It would go down.', q.prompt);
    }
  }
});

test('experiments: tables rise or fall steadily, and answers match the table', () => {
  const rng = seededRng(10);
  const forms = ['changed', 'measured', 'same', 'best', 'worst', 'conclude', 'predict'];
  for (let i = 0; i < 2000; i += 1) {
    const q = generate({ type: 'experiment', forms }, rng);
    const [passage, table] = q.visual.items;
    const t = EXPERIMENTS.find((e) => e.title === passage.title);
    const ys = table.rows.map((r) => Number(r[1]));
    for (let k = 1; k < ys.length; k += 1) assert.ok((ys[k] - ys[k - 1]) * t.y.dir > 0, `${t.id}: ${ys}`);
    assert.ok(ys.every((y) => y > 0), `${t.id}: ${ys}`);
    if (q.prompt === t.best.q || q.prompt === t.worst.q) {
      const goal = q.prompt === t.best.q ? t.best : t.worst;
      const k = ys.indexOf(goal.pick === 'max' ? Math.max(...ys) : Math.min(...ys));
      assert.equal(q.answer, t.choiceOf(t.xLabel(t.xs[k])), q.prompt);
    }
    if (q.prompt.startsWith('What can you conclude')) assert.equal(q.answer, t.conclude);
    if (q.prompt.includes('must') && q.prompt.includes('keep the same')) assert.ok(t.same.includes(q.answer), q.prompt);
    if (q.prompt.includes('most likely')) {
      assert.ok(!t.noPredict, t.id);
      const [, lo, hi] = /between (\d+)\D+ and (\d+)/.exec(q.answer).map(Number);
      assert.ok(ys.includes(lo) && ys.includes(hi) && Math.abs(ys.indexOf(lo) - ys.indexOf(hi)) === 1, q.answer);
    }
  }
});

test('melting and boiling points: the state matches the table', () => {
  const rng = seededRng(11);
  for (let i = 0; i < 1500; i += 1) {
    const q = generate({ type: 'stateAtTemp' }, rng);
    const temp = Number(/at (-?\d+)\s°C/.exec(q.prompt)[1]);
    const stateOf = ([, mp, bp]) => (temp < Number(mp) ? 'solid' : temp < Number(bp) ? 'liquid' : 'gas');
    for (const [, mp, bp] of q.visual.rows) assert.ok(Number(mp) !== temp && Number(bp) !== temp && Number(bp) > Number(mp));
    if (q.prompt.startsWith('Which substance')) {
      const liquids = q.visual.rows.filter((r) => stateOf(r) === 'liquid');
      assert.equal(liquids.length, 1, q.prompt);
      assert.equal(q.answer, `Substance ${liquids[0][0]}`);
    } else {
      const label = /substance (\w) at/.exec(q.prompt)[1];
      assert.equal(q.answer, stateOf(q.visual.rows.find((r) => r[0] === label)), q.prompt);
    }
  }
});

test('springs, measuring cylinders and circuits give the right answers', () => {
  const rng = seededRng(12);
  for (let i = 0; i < 1000; i += 1) {
    const s = generate({ type: 'springStretch' }, rng);
    const lengths = s.visual.rows.map((r) => Number(r[1]));
    const per = lengths[1] - lengths[0];
    assert.ok(per > 0 && lengths.every((l, k) => l === lengths[0] + k * per));
    if (s.prompt.startsWith('How many centimetres')) assert.equal(s.answer, per);
    else if (s.prompt.startsWith('What mass')) assert.equal(lengths[0] + (s.answer / 100) * per, Number(/(\d+) cm long/.exec(s.prompt)[1]));
    else assert.equal(s.answer, lengths[0] + (Number(/with (\d+) g/.exec(s.prompt)[1]) / 100) * per);

    const d = generate({ type: 'displacement' }, rng);
    const nums = d.prompt.match(/\d+/g).map(Number);
    assert.equal(d.answer, d.prompt.includes('rises to') ? nums[1] - nums[0] : nums[0] + nums[1], d.prompt);

    const c = generate({ type: 'circuit', forms: ['switches', 'gap', 'parallel'] }, rng);
    if (c.prompt.includes('two switches')) {
      const lit = !/is open/.test(c.prompt);
      assert.equal(c.answer, lit ? 'Yes, it lights up.' : 'No, it does not light up.', c.prompt);
    } else if (c.prompt.includes('gap')) {
      const thing = /joined with (.+)\. Does/.exec(c.prompt)[1];
      const isConductor = SORT_SETS.electricConductors.groups.conductor.items.some((it) => it.name === thing);
      assert.equal(c.answer, isConductor ? 'Yes, it lights up.' : 'No, it does not light up.', c.prompt);
    } else {
      const main = /Main switch S is closed/.test(c.prompt);
      const x = main && /X's branch is closed/.test(c.prompt) && !/Bulb X has blown/.test(c.prompt);
      const y = main && /Y's branch is closed/.test(c.prompt) && !/Bulb Y has blown/.test(c.prompt);
      assert.equal(c.answer, x && y ? 'both X and Y' : x ? 'only X' : y ? 'only Y' : 'neither bulb', c.prompt);
    }
  }
});

test('magnets: like poles repel and unlike poles attract', () => {
  const rng = seededRng(13);
  for (let i = 0; i < 500; i += 1) {
    const q = generate({ type: 'magnetPoles' }, rng);
    if (q.prompt.startsWith('Two bar magnets')) {
      // The facing ends are the right end of the first magnet and the left end of the second.
      const m = /^(\w) ━━ (\w)\s+(\w) ━━ (\w)$/.exec(q.visual.text);
      assert.ok(m, q.visual.text);
      assert.equal(q.answer, m[2] === m[3] ? 'They repel (push apart).' : 'They attract (pull together).', q.visual.text);
    } else if (q.prompt.includes('end X')) {
      const pole = /The (\w) pole/.exec(q.prompt)[1];
      const other = pole === 'N' ? 'S' : 'N';
      assert.equal(q.answer, q.prompt.includes('They attract') ? `${other} pole` : `${pole} pole`, q.prompt);
    } else {
      assert.equal(q.answer, 'They attract (pull together).');
    }
  }
});
