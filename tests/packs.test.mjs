// Validates every content pack and the service worker precache list.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { generate } from '../js/engine/generators.js';
import { isCorrect } from '../js/engine/answers.js';
import { questionsForSkill } from '../js/engine/practice.js';
import { seededRng } from '../js/core/random.js';
import { methodFor } from '../js/engine/techniques.js';

const root = new URL('..', import.meta.url).pathname;
const read = (p) => readFileSync(join(root, p), 'utf8');
const index = JSON.parse(read('packs/index.json'));
const VISUALS = new Set(['letters', 'passage', 'triangle', 'cuboid', 'circle', 'hundredSquare', 'stack', 'pictures', 'pictureRows', 'pictureAdd', 'pictureTakeAway', 'sequence', 'shape', 'tenFrames', 'bond', 'blocks', 'groups', 'numberLine', 'fraction', 'bar', 'column', 'jumps',
  'clock', 'dayline', 'angle', 'rectGrid', 'symmetry', 'barGraph', 'table']);
const INTERACT = new Set(['tapCount', 'fillFrame', 'check', 'worked', 'tryIt']);

for (const entry of index.packs) {
  test(`pack ${entry.packId} is valid and every skill produces a full set`, () => {
    const pack = JSON.parse(read(`packs/${entry.file}`));
    assert.equal(pack.packId, entry.packId);
    const ids = new Set();
    const rng = seededRng(9);
    for (const topic of pack.topics) {
      assert.ok(topic.topicId && topic.title && topic.skills.length);
      for (const skill of topic.skills) {
        assert.ok(!ids.has(skill.skillId), `duplicate ${skill.skillId}`);
        ids.add(skill.skillId);
        for (const step of skill.lesson?.steps || []) {
          assert.ok(step.text, `${skill.skillId} lesson step text`);
          if (step.visual) assert.ok(VISUALS.has(step.visual.kind), `${skill.skillId} visual ${step.visual.kind}`);
          if (step.interact) {
            const it = step.interact;
            assert.ok(INTERACT.has(it.kind), `${skill.skillId} interact ${it.kind}`);
            if (it.kind === 'worked' || it.kind === 'tryIt') {
              const m = methodFor({ method: it.method });
              assert.ok(m, `${skill.skillId} method ${it.method?.kind}`);
              if (it.method.answer !== undefined) assert.equal(String(m.guided.at(-1).answer), String(it.method.answer), `${skill.skillId} worked answer`);
            }
            if (it.kind === 'check') assert.ok(it.choices.includes(it.answer), `${skill.skillId} check answer in choices`);
          }
        }
        if (skill.generator) generate(skill.generator, rng);
        for (const q of skill.questions || []) {
          const answerType = q.type === 'multiple-choice' ? 'choice' : q.type === 'fraction' ? 'fraction' : 'numeric';
          assert.ok(isCorrect({ answerType, answer: q.answer }, String(q.answer)), `${q.id} answer`);
        }
        const size = entry.young ? 6 : 10;
        assert.equal(questionsForSkill(skill, size, rng).length, size, `${skill.skillId} fills a set`);
      }
    }
  });
}

test('service worker precaches every app file', () => {
  const sw = read('sw.js');
  const walk = (dir) => readdirSync(join(root, dir)).flatMap((name) => {
    const rel = `${dir}/${name}`;
    return statSync(join(root, rel)).isDirectory() ? walk(rel) : [rel];
  });
  const files = ['js', 'css', 'packs'].flatMap(walk);
  assert.ok(sw.includes("'./audio/voice/manifest.json'"), 'the voice manifest is precached');
  // The install must stay small: thousands of voice clips there made updates time out on phones.
  const start = sw.indexOf("addEventListener('install'");
  const install = sw.slice(start, sw.indexOf('\n});', start));
  assert.ok(install.includes('addAll(PRECACHE') && !/\.ogg|voice/i.test(install), 'install does not download voice clips');
  assert.ok(sw.includes("const VOICE_CACHE = 'learnoffline-voice'"), 'voice clips have their own cache');
  for (const f of files) assert.ok(sw.includes(`'./${f}'`), `${f} missing from sw.js PRECACHE`);
});

// A grade can have 3+ subjects (Math, English, Science, plus imported packs).
// The home subject tabs used a one-row grid, which pushed the third tab off a
// phone screen. Guard the wrapping layout that keeps every subject reachable.
test('subject tabs wrap so every subject at a grade stays on screen', () => {
  const perLevel = new Map();
  for (const p of index.packs) perLevel.set(p.level, (perLevel.get(p.level) || 0) + 1);
  assert.ok(Math.max(...perLevel.values()) >= 3, 'some grade has 3+ subjects');
  const css = read('css/engage.css');
  const rule = (sel) => (css.match(new RegExp(`^\\${sel} \\{([^}]*)\\}`, 'm')) || [])[1] || '';
  const tabs = rule('.subject-tabs');
  assert.match(tabs, /flex-wrap:\s*wrap/, '.subject-tabs must wrap');
  assert.doesNotMatch(tabs, /grid-auto-flow:\s*column/, '.subject-tabs must not force one row');
  assert.match(rule('.subject-tab'), /min-width:\s*0/, '.subject-tab must be able to shrink');
});
