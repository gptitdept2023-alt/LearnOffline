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
  { id: 'memory', icon: '🃏', title: 'Memory Match', blurb: 'Flip the cards and match each sum to its answer!' },
  { id: 'bonds', icon: '🫧', title: 'Bond Bubbles', blurb: 'Pop two bubbles that make the target number!' },
  { id: 'line', icon: '📏', title: 'Number Line Jump', blurb: 'Tap where the number lives on the line!' },
]);

export const BOND_ROUNDS = 4;
export const LINE_ROUNDS = 8;

export const SPEED_SECONDS = { young: 90, older: 60 };
export const POP_ROUNDS = 10;
const TABLES = [2, 3, 4, 5, 6, 7, 8, 9];
const EMOJI = ['🍎', '⭐', '🐟', '🌸', '🚗', '🐤', '🍓', '⚽'];

/** Stars for a game score: generous but capped so games never replace practice. */
/** For Number Line Jump the score is points (max 24), so stars are scaled. */
export const gameStars = (gameId, score) => (gameId === 'speed' ? Math.min(15, Math.ceil(score / 2))
  : gameId === 'line' ? Math.min(10, Math.ceil(score / 2.4))
    : Math.min(10, Math.max(0, score)));

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

/* ------------------------------------------------------------------ */
/* Memory Match                                                        */
/* ------------------------------------------------------------------ */

/**
 * Pairs for Memory Match: a question card and its answer card. Answers are
 * all different, so every question has exactly one matching card.
 * Kinder: pictures to count and sums within 10. Grade 4: times and division facts.
 * @returns {{id: number, question: string, answer: string, picture?: {emoji: string, count: number}}[]}
 */
export const memoryPairs = (young, rng = Math.random) => {
  const count = young ? 4 : 6;
  const used = new Set();
  const pairs = [];
  for (let tries = 0; pairs.length < count && tries < 500; tries += 1) {
    let pair;
    if (young) {
      if (rng() < 0.5) {
        const n = randInt(1, 6, rng);
        pair = { question: '', answer: String(n), picture: { emoji: pick(EMOJI, rng), count: n } };
      } else {
        const a = randInt(1, 5, rng);
        const b = randInt(0, 5, rng);
        pair = { question: `${a} + ${b}`, answer: String(a + b) };
      }
    } else if (rng() < 0.7) {
      const a = pick(TABLES, rng);
      const b = randInt(2, 10, rng);
      pair = { question: `${a} × ${b}`, answer: String(a * b) };
    } else {
      const d = pick(TABLES, rng);
      const q = randInt(2, 10, rng);
      pair = { question: `${d * q} ÷ ${d}`, answer: String(q) };
    }
    if (used.has(pair.answer)) continue;
    used.add(pair.answer);
    pairs.push({ id: pairs.length, ...pair });
  }
  return pairs;
};

/** Memory score: 10 for a perfect game, minus 1 per extra pair of flips (min 2). */
export const memoryScore = (pairs, moves) => Math.max(2, 10 - Math.max(0, moves - pairs));

/* ------------------------------------------------------------------ */
/* Bond Bubbles (number bonds)                                         */
/* ------------------------------------------------------------------ */

/**
 * A round of Bond Bubbles: three pairs that each make `target`, shuffled.
 * Kinder: bonds to 5 or 10. Grade 4: bonds to 100 or 1000 (in tens / fifties).
 * @returns {{target: number, bubbles: {id: number, value: number}[]}}
 */
export const bondRound = (young, rng = Math.random) => {
  const target = young ? pick([5, 10, 10], rng) : pick([100, 100, 1000], rng);
  const step = young ? 1 : target === 100 ? 5 : 50;
  const values = [];
  const seen = new Set();
  for (let tries = 0; values.length < 6 && tries < 200; tries += 1) {
    const a = randInt(young ? 0 : 1, target / step - (young ? 0 : 1), rng) * step;
    const key = Math.min(a, target - a);
    if (seen.has(key)) continue;
    seen.add(key);
    values.push(a, target - a);
  }
  return { target, bubbles: shuffle(values.map((value, id) => ({ id, value })), rng) };
};

/* ------------------------------------------------------------------ */
/* Number Line Jump                                                    */
/* ------------------------------------------------------------------ */

/**
 * A Number Line Jump round. The child taps a point on the line.
 * Kinder: whole numbers 0–10, tap the exact tick. Grade 4: 0–1,000 (estimate)
 * or fractions on 0–1.
 * @returns {{min: number, max: number, target: number, label: string, ticks: {value: number, label: string}[], snap: boolean}}
 */
export const lineRound = (young, rng = Math.random) => {
  if (young) {
    const target = randInt(0, 10, rng);
    return { min: 0, max: 10, target, label: String(target), snap: true, ticks: Array.from({ length: 11 }, (_, i) => ({ value: i, label: i % 5 === 0 ? String(i) : '' })) };
  }
  if (rng() < 0.5) {
    const target = randInt(1, 99, rng) * 10;
    return { min: 0, max: 1000, target, label: target.toLocaleString('en-US'), snap: false, ticks: Array.from({ length: 11 }, (_, i) => ({ value: i * 100, label: i % 5 === 0 ? (i * 100).toLocaleString('en-US') : '' })) };
  }
  const den = pick([2, 3, 4, 5, 8, 10], rng);
  const num = randInt(1, den - 1, rng);
  return { min: 0, max: 1, target: num / den, label: `${num}/${den}`, snap: false, ticks: [{ value: 0, label: '0' }, { value: 0.5, label: '' }, { value: 1, label: '1' }] };
};

/** Points for a tap: 3 bullseye, 2 close, 1 near, 0 far (by share of the line). */
export const linePoints = (round, value) => {
  const off = Math.abs(value - round.target) / (round.max - round.min);
  if (round.snap) return off < 1e-9 ? 3 : 0;
  return off <= 0.02 ? 3 : off <= 0.05 ? 2 : off <= 0.1 ? 1 : 0;
};
