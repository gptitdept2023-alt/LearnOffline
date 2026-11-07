/**
 * Tables and bar graphs: read a value, find the most or least, compare two
 * bars, and find a total. The same data is shown as a bar graph or a table.
 * Pure and DOM-free.
 */

import { pick, shuffle } from '../../core/random.js';
import { NAMES, ask, askChoice } from './shared.js';

/** Each context words its own questions, so they read naturally. */
const CONTEXTS = [
  {
    title: 'Books read last month', unit: 'books', names: true,
    read: (l) => `How many books did ${l} read?`,
    more: (a, b) => `How many more books did ${a} read than ${b}?`,
    best: (most) => `Who read the ${most ? 'most' : 'fewest'} books?`,
  },
  {
    title: 'Fruit sold at a stall', unit: 'fruits', labels: ['apples', 'mangoes', 'pears', 'bananas', 'oranges'],
    read: (l) => `How many ${l} were sold?`,
    more: (a, b) => `How many more ${a} than ${b} were sold?`,
    best: (most) => `Which fruit sold the ${most ? 'most' : 'fewest'}?`,
  },
  {
    title: 'Favourite sport in our class', unit: 'children', labels: ['football', 'badminton', 'swimming', 'basketball', 'running'],
    read: (l) => `How many children chose ${l}?`,
    more: (a, b) => `How many more children chose ${a} than ${b}?`,
    best: (most) => `Which sport did the ${most ? 'most' : 'fewest'} children choose?`,
  },
  {
    title: 'Cars that passed the school', unit: 'cars', labels: ['red', 'blue', 'white', 'black', 'silver'],
    read: (l) => `How many ${l} cars passed?`,
    more: (a, b) => `How many more ${a} cars than ${b} cars passed?`,
    best: (most) => `Which colour had the ${most ? 'most' : 'fewest'} cars?`,
  },
];

/** @param {{forms?: ('read'|'most'|'least'|'difference'|'total')[]}} spec */
const readGraph = ({ forms = ['read', 'most', 'least', 'difference', 'total'] }, rng) => {
  const ctx = pick(CONTEXTS, rng);
  const count = 4;
  const labels = ctx.names ? shuffle(NAMES, rng).slice(0, count) : shuffle(ctx.labels, rng).slice(0, count);
  const scale = pick([2, 5, 10], rng);
  // Distinct values, so "most" and "least" always have one answer.
  const heights = shuffle(Array.from({ length: 10 }, (_, k) => k + 1), rng).slice(0, count);
  const values = heights.map((n) => n * scale);
  const asTable = rng() < 0.3;
  const form = pick(forms, rng);
  const [i, j] = shuffle([0, 1, 2, 3], rng);
  const visual = { kind: asTable ? 'table' : 'barGraph', title: ctx.title, unit: ctx.unit, labels, values, scale };
  const base = { visual, method: { kind: 'readGraph', title: ctx.title, unit: ctx.unit, labels, values, scale, form, i, j, asTable } };
  const hint = asTable ? 'Find the row in the table first.' : 'Go across from the top of the bar to the numbers on the side.';

  if (form === 'most' || form === 'least') {
    const pickIdx = values.indexOf(form === 'most' ? Math.max(...values) : Math.min(...values));
    return { ...base, answerType: 'choice', prompt: ctx.best(form === 'most'), answer: labels[pickIdx], choices: [...labels], hint };
  }
  if (form === 'difference') {
    const [hi, lo] = values[i] > values[j] ? [i, j] : [j, i];
    return { ...base, method: { ...base.method, i: hi, j: lo }, answerType: 'numeric', prompt: ctx.more(labels[hi], labels[lo]), answer: values[hi] - values[lo], hint };
  }
  if (form === 'total') {
    const total = values.reduce((a, b) => a + b, 0);
    return { ...base, answerType: 'numeric', prompt: `How many ${ctx.unit} are there altogether?`, answer: total, hint: `${hint} Then add all ${count} numbers.` };
  }
  return { ...base, answerType: 'numeric', prompt: ctx.read(labels[i]), answer: values[i], hint };
};

const readGraphMethod = ({ title, unit, labels, values, scale, form, i, j, asTable }) => {
  const pic = (focus) => ({ kind: asTable ? 'table' : 'barGraph', title, unit, labels, values, scale, focus });
  const readText = (k) => (asTable
    ? `Find ${labels[k]} in the table: ${values[k]}.`
    : `Find the bar for ${labels[k]}. Go across from its top to the scale: ${values[k]}.`);
  const scaleNote = asTable ? null : { text: `Look at the scale first: it counts in ${scale}s.`, visual: pic([]) };
  if (form === 'most' || form === 'least') {
    const best = values.indexOf(form === 'most' ? Math.max(...values) : Math.min(...values));
    return {
      name: 'Compare the bars',
      steps: [
        { text: asTable ? `Look down the numbers for the ${form === 'most' ? 'biggest' : 'smallest'} one.` : `Look for the ${form === 'most' ? 'tallest' : 'shortest'} bar.`, visual: pic([]) },
        { text: `It is ${labels[best]}, with ${values[best]}.`, visual: pic([best]) },
      ],
      guided: [askChoice(form === 'most' ? 'Which has the most?' : 'Which has the fewest?', labels[best], labels, pic([]))],
    };
  }
  if (form === 'difference') {
    return {
      name: 'Read both, then subtract',
      steps: [
        ...(scaleNote ? [scaleNote] : []),
        { text: readText(i), visual: pic([i]) },
        { text: readText(j), visual: pic([i, j]) },
        { text: `How many more: ${values[i]} − ${values[j]} = ${values[i] - values[j]}.`, visual: pic([i, j]) },
      ],
      guided: [ask(`How many for ${labels[i]}?`, values[i], pic([i])), ask(`How many for ${labels[j]}?`, values[j], pic([j])), ask(`${values[i]} − ${values[j]} = ?`, values[i] - values[j], pic([i, j]))],
    };
  }
  if (form === 'total') {
    const total = values.reduce((a, b) => a + b, 0);
    return {
      name: 'Read each, then add',
      steps: [
        ...(scaleNote ? [scaleNote] : []),
        { text: `Read every ${asTable ? 'row' : 'bar'}: ${labels.map((l, k) => `${l} ${values[k]}`).join(', ')}.`, visual: pic(labels.map((_, k) => k)) },
        { text: `Add them: ${values.join(' + ')} = ${total} ${unit}.`, visual: pic(labels.map((_, k) => k)) },
      ],
      guided: [ask(`${values.join(' + ')} = ?`, total, pic(labels.map((_, k) => k)))],
    };
  }
  return {
    name: asTable ? 'Read the table' : 'Read the bar',
    steps: [...(scaleNote ? [scaleNote] : [{ text: 'Each row of the table gives one number.', visual: pic([]) }]), { text: readText(i), visual: pic([i]) }],
    guided: [ask(`How many for ${labels[i]}?`, values[i], pic([i]))],
  };
};

export const generators = { readGraph };
export const methods = { readGraph: readGraphMethod };
