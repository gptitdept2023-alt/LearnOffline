// Shared helpers for the pack build scripts (build-math-g1-g3.mjs, build-math-g5-g6.mjs, build-english-g1-g3.mjs).
// Each skill's lesson: hand-written CPA intro steps, then a worked example and
// a "your turn" taken from the skill's OWN generator (seeded), so every number
// in a lesson is produced and checked by the same code as practice.
import { writeFileSync } from 'node:fs';
import { generate } from '../js/engine/generators.js';
import { methodFor } from '../js/engine/techniques.js';
import { seededRng } from '../js/core/random.js';

const ROOT = new URL('../packs/', import.meta.url).pathname;
const fmt = (n) => Number(n).toLocaleString('en-US', { maximumFractionDigits: 4 });

/** First generated question passing `ok`, from a seed based on the skill id. */
const example = (gen, ok = () => true, salt = 1) => {
  const rng = seededRng([...gen.type].reduce((a, c) => a + c.charCodeAt(0), 0) * 97 + salt * 7919);
  for (let i = 0; i < 2000; i += 1) {
    const q = generate(gen, rng);
    if (ok(q)) return q;
  }
  throw new Error(`no example for ${JSON.stringify(gen)}`);
};

/** A numeric answer turned into 3 choices for a quick check (near misses of the same size). */
const numericChoices = (answer) => {
  const a = Number(answer);
  if (!Number.isInteger(a)) {
    const places = (String(a).split('.')[1] || '').length;
    const step = 10 ** -places;
    const near = [a + step, a * 10, a - step, a / 10].map((n) => Number(n.toFixed(6))).filter((n) => n > 0 && n !== a);
    return [a, near[0], near[1]].sort((x, y) => x - y).map(fmt);
  }
  const near = [a + 1, a - 1, a + 10, a - 10].filter((n) => n >= 0 && n !== a);
  return [a, near[0], near[1]].sort((x, y) => x - y).map(fmt);
};

/** Worked example + your turn from the generator; a quick check when the question has no technique. */
const practiceSteps = (gen, ok) => {
  const q1 = example(gen, ok, 1);
  const q2 = example(gen, (q) => ok(q) && `${q.prompt}${q.answer}` !== `${q1.prompt}${q1.answer}`, 2);
  if (q1.method && methodFor(q1)) {
    const answer = methodFor(q2).guided.at(-1).answer;
    return [
      { stage: 'technique', text: `Watch how: ${q1.prompt}`, interact: { kind: 'worked', method: q1.method } },
      { stage: 'try', text: `Your turn: ${q2.prompt}`, interact: { kind: 'tryIt', method: { ...q2.method, answer } } },
    ];
  }
  const choices = q2.answerType === 'choice' ? q2.choices : numericChoices(q2.answer);
  const answer = q2.answerType === 'choice' ? q2.answer : fmt(q2.answer);
  return [{
    stage: 'abstract',
    text: `Your turn: ${q2.listen && q2.say ? q2.say : q2.prompt}`,
    // A listening question ("Tap the word you hear") shows what it says, since a lesson step is not played on its own.
    interact: { kind: 'check', prompt: q2.listen && q2.say ? q2.say : q2.prompt, ...(q2.visual ? { visual: q2.visual } : {}), choices, answer, explain: q2.explain || `The answer is ${q2.spoken || answer}.` },
  }];
};

export const skill = (skillId, title, generator, intro, ok = () => true) => ({
  skillId,
  title,
  lesson: { steps: [...intro.map(([stage, text, visual]) => ({ stage, text, ...(visual ? { visual } : {}) })), ...practiceSteps(generator, ok)] },
  generator,
});
export const topic = (topicId, title, icon, summary, skills, extra = {}) => ({ topicId, title, icon, summary, ...extra, skills });
export const challenge = (prefix, skills) => topic(`${prefix}-challenge`, 'Challenge zone', '⭐', 'Ready for more? These go a step beyond this grade.', skills.map(([id, title, generator]) => ({ skillId: id, title, generator })), { challenge: true });

/** Write packs/<packId>.json and report its size. */
export const writePack = (packId, title, topics, version = '1.0.0', subject = 'math') => {
  writeFileSync(`${ROOT}${packId}.json`, `${JSON.stringify({ packId, version, subject, title, topics }, null, 2)}\n`);
  console.log(packId, topics.reduce((n, t) => n + t.skills.length, 0), 'skills');
};
