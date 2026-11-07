/**
 * Small helpers shared by the topic modules (measurement, time, money,
 * geometry, graphs). Kept here, not in generators.js or techniques.js, so the
 * topic modules can be imported by both without a circular import.
 * Pure and DOM-free.
 */

import { shuffle } from '../../core/random.js';

export const NAMES = ['Ana', 'Ben', 'Mei', 'Raj', 'Lito', 'Siti', 'Jun', 'Maya', 'Carlo', 'Aisha', 'Tomas', 'Lea'];

/** 12345 -> "12,345". */
export const fmt = (n) => Number(n).toLocaleString('en-US');

/** A numeric sub-question for "Try with help". */
export const ask = (prompt, answer, visual) => ({ prompt, answer, answerType: 'numeric', visual });

/** A multiple-choice sub-question for "Try with help". */
export const askChoice = (prompt, answer, choices, visual) => ({ prompt, answer: String(answer), answerType: 'choice', choices: choices.map(String), visual });

/** Two or more pictures shown together. */
export const stack = (...items) => ({ kind: 'stack', items: items.filter(Boolean) });

/** The answer plus up to `count - 1` different distractors, shuffled. */
export const choicesWith = (answer, distractors, rng, count = 4) => {
  const unique = [...new Set(distractors.map(String).filter((d) => d !== String(answer)))];
  return shuffle([String(answer), ...shuffle(unique, rng).slice(0, count - 1)], rng);
};

/** Centavos -> "₱1,237.50". Whole pesos keep the centavos ("₱20.00") so money always reads the same way. */
export const money = (centavos) => `₱${(centavos / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Centavos -> pesos as a number with 2 decimals (37.75), for numeric answers. */
export const pesos = (centavos) => Math.round(centavos) / 100;

/** Minutes after midnight -> "9:45 a.m." (12-hour clock). */
export const clock12 = (mins) => {
  const m = ((mins % 1440) + 1440) % 1440;
  const h24 = Math.floor(m / 60);
  const h = h24 % 12 || 12;
  return `${h}:${String(m % 60).padStart(2, '0')} ${h24 < 12 ? 'a.m.' : 'p.m.'}`;
};

/** Minutes after midnight -> "15:40" (24-hour clock). */
export const clock24 = (mins) => {
  const m = ((mins % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};

/** 95 -> "1 h 35 min", 60 -> "1 h", 20 -> "20 min". Never says "0 min". */
export const duration = (mins) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return [h && `${h} h`, m && `${m} min`].filter(Boolean).join(' ') || '0 min';
};

/** "a eraser" -> "an eraser". */
export const withArticle = (noun) => `${/^[aeiou]/i.test(noun) ? 'an' : 'a'} ${noun}`;

/**
 * Remove the doubled full stop left when a sentence ends with "a.m." or
 * "p.m." ("ends at 3:10 p.m.." -> "ends at 3:10 p.m.").
 */
export const tidy = (text) => text.replace(/\.\.(?=\s|$)/g, '.');

/** Apply `tidy` to every step, prompt and choice of a worked method. */
export const tidyMethod = (m) => ({
  ...m,
  steps: m.steps.map((s) => ({ ...s, text: tidy(s.text) })),
  guided: m.guided.map((g) => ({ ...g, prompt: tidy(g.prompt) })),
});
