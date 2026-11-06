/**
 * Questions for the quick games. Pure and DOM-free, so they are unit-tested.
 *  - Speed Round: fast facts typed on a number pad (60 s; 90 s for Kinder).
 *  - Pop the Balloon: tap the balloon with the right number (10 rounds).
 * Kinder gets counting and facts within 10; Grade 4 gets times and division facts.
 */

import { generate } from './generators.js';
import { randInt, pick, shuffle } from '../core/random.js';

export const GAMES = Object.freeze([
  { id: 'speed', icon: '⚡', title: 'Speed Round', blurb: 'Answer as many as you can before time runs out!' },
  { id: 'pop', icon: '🎈', title: 'Pop the Balloon', blurb: 'Find the right number and pop it!' },
]);

export const SPEED_SECONDS = { young: 90, older: 60 };
export const POP_ROUNDS = 10;
const TABLES = [2, 3, 4, 5, 6, 7, 8, 9];
const EMOJI = ['🍎', '⭐', '🐟', '🌸', '🚗', '🐤', '🍓', '⚽'];

/** Stars for a game score: generous but capped so games never replace practice. */
export const gameStars = (gameId, score) => (gameId === 'speed' ? Math.min(15, Math.ceil(score / 2)) : Math.min(10, score));

/** A Speed Round question: { prompt, answer }. */
export const speedQuestion = (young, rng = Math.random) => {
  const q = young
    ? generate(rng() < 0.6 ? { type: 'addition', min: 0, max: 5 } : { type: 'subtraction', min: 0, max: 5 }, rng)
    : generate(rng() < 0.75 ? { type: 'multiplication', tables: TABLES, maxFactor: 10 } : { type: 'division', tables: TABLES, maxFactor: 10 }, rng);
  return { prompt: q.prompt.replace(/\s*=\s*\?$/, ''), answer: Number(q.answer) };
};

/** Four different numbers including the answer, all >= 0. */
const choicesAround = (answer, candidates, rng) => {
  const set = new Set([answer]);
  for (const c of shuffle(candidates.filter((n) => n >= 0 && n !== answer), rng)) {
    if (set.size === 4) break;
    set.add(c);
  }
  let step = 1;
  while (set.size < 4) { set.add(answer + step); step += 1; }
  return shuffle([...set], rng);
};

/**
 * A Pop the Balloon round.
 * @returns {{prompt: string, say: string, answer: number, choices: number[], picture?: {emoji: string, count: number}}}
 */
export const popRound = (young, rng = Math.random) => {
  if (young) {
    const kind = pick(['number', 'count', 'add'], rng);
    if (kind === 'number') {
      const answer = randInt(0, 10, rng);
      return { prompt: `Pop ${answer}!`, say: `Pop the balloon with ${answer}!`, answer, choices: choicesAround(answer, Array.from({ length: 11 }, (_, i) => i), rng) };
    }
    if (kind === 'count') {
      const count = randInt(1, 9, rng);
      const emoji = pick(EMOJI, rng);
      return { prompt: 'How many?', say: 'How many? Pop the right number!', answer: count, picture: { emoji, count }, choices: choicesAround(count, [count - 2, count - 1, count + 1, count + 2], rng) };
    }
    const a = randInt(0, 5, rng);
    const b = randInt(0, 5, rng);
    return { prompt: `${a} + ${b}`, say: `Pop the answer to ${a} + ${b}`, answer: a + b, choices: choicesAround(a + b, [a + b - 2, a + b - 1, a + b + 1, a + b + 2], rng) };
  }
  const a = pick(TABLES, rng);
  const b = randInt(2, 10, rng);
  const answer = a * b;
  return {
    prompt: `${a} × ${b}`,
    say: `Pop the answer to ${a} × ${b}`,
    answer,
    choices: choicesAround(answer, [a * (b - 1), a * (b + 1), (a - 1) * b, (a + 1) * b, answer + 1, answer - 1], rng),
  };
};
