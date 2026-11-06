// Validates every content pack and the service worker precache list.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { generate } from '../js/engine/generators.js';
import { isCorrect } from '../js/engine/answers.js';
import { questionsForSkill } from '../js/engine/practice.js';
import { seededRng } from '../js/core/random.js';

const root = new URL('..', import.meta.url).pathname;
const read = (p) => readFileSync(join(root, p), 'utf8');
const index = JSON.parse(read('packs/index.json'));
const VISUALS = new Set(['pictures', 'pictureRows', 'pictureAdd', 'pictureTakeAway', 'sequence', 'shape', 'tenFrames', 'bond', 'blocks', 'groups', 'numberLine', 'fraction', 'bar']);

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
  for (const f of files) assert.ok(sw.includes(`'./${f}'`), `${f} missing from sw.js PRECACHE`);
});
