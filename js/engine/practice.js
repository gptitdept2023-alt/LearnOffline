/**
 * Builds practice sets from content-pack skills. Pure and DOM-free.
 *
 * A skill can provide fixed `questions`, a `generator`, or both. Fixed
 * questions are used first (shuffled), then the generator fills the set.
 */

import { generate } from './generators.js';
import { shuffle } from '../core/random.js';

export const SET_SIZE = 10;
export const YOUNG_SET_SIZE = 6; // Shorter sets for pre-readers.

/** Normalise a fixed question from a pack to the generator Question shape. */
const fromFixed = (q) => ({
  answerType: q.type === 'multiple-choice' || q.type === 'true-false' ? 'choice'
    : q.type === 'fraction' ? 'fraction' : 'numeric',
  prompt: q.prompt,
  answer: q.type === 'true-false' ? String(q.answer) : q.answer,
  choices: q.type === 'true-false' ? ['true', 'false'] : q.choices,
  visual: q.visual,
  model: q.model,
  hint: q.hint,
  explain: q.explain,
  method: q.method,
});

/**
 * Up to `count` questions for one skill, avoiding repeated prompts.
 * @returns {Array<Object>} Questions tagged with skillId.
 */
export const questionsForSkill = (skill, count, rng = Math.random) => {
  const out = [];
  const seen = new Set();
  // Same prompt with different numbers in the picture or choices is a different question.
  const keyOf = (q) => `${q.prompt}|${JSON.stringify(q.visual ?? '')}|${(q.choices || []).join(',')}|${q.answer}`;
  const add = (q) => {
    const key = keyOf(q);
    if (seen.has(key)) return false;
    seen.add(key);
    out.push({ ...q, skillId: skill.skillId });
    return true;
  };
  for (const q of shuffle(skill.questions || [], rng)) {
    if (out.length >= count) break;
    add(fromFixed(q));
  }
  if (skill.generator) {
    // Bounded retries: small skills (e.g. "count to 5") may have few unique questions.
    for (let tries = 0; out.length < count && tries < count * 10; tries += 1) {
      add(generate(skill.generator, rng));
    }
  }
  return out;
};

/** Set size for a skill or grade: shorter for pre-readers. */
export const setSizeFor = (young) => (young ? YOUNG_SET_SIZE : SET_SIZE);

/**
 * A practice set for a single skill.
 */
export const buildSkillSet = (skill, young = false, rng = Math.random) =>
  questionsForSkill(skill, setSizeFor(young), rng);

/**
 * A Daily mix: questions spread across several skills, then shuffled.
 * @param {Object[]} skills Skills chosen by pickDailyMix, highest priority first.
 */
export const buildMixSet = (skills, young = false, rng = Math.random) => {
  const size = setSizeFor(young);
  if (!skills.length) return [];
  const per = Math.ceil(size / skills.length);
  const all = skills.flatMap((s) => questionsForSkill(s, per, rng));
  return shuffle(all, rng).slice(0, size);
};

/**
 * Per-skill accuracy for a finished set.
 * @param {{skillId: string, correct: boolean}[]} answers
 * @returns {Map<string, {correct: number, total: number}>}
 */
export const summarizeBySkill = (answers) => {
  const map = new Map();
  for (const a of answers) {
    const s = map.get(a.skillId) || { correct: 0, total: 0 };
    s.total += 1;
    if (a.correct) s.correct += 1;
    map.set(a.skillId, s);
  }
  return map;
};
