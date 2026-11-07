/**
 * Decimals and percentages for Grades 5 and 6: adding, subtracting,
 * multiplying and dividing decimals, multiplying and dividing by 10, 100 and
 * 1,000, rounding, and percentages (of an amount, discounts, increases,
 * finding the whole). Generators and techniques together.
 *
 * Decimals are worked in whole numbers of tenths, hundredths or thousandths,
 * so no answer ever carries floating-point noise (0.1 + 0.2 is 0.3 here).
 * Pure and DOM-free.
 */

import { randInt, pick } from '../../core/random.js';
import { NAMES, ask, askChoice, gcd, drawUntil, dec, fmt, tidyNumber } from './shared.js';

const PLACE_NAME = { 1: 'tenths', 2: 'hundredths', 3: 'thousandths' };

/** Decimal places in a number written as text: 2.35 -> 2. */
const placesOf = (x) => (String(tidyNumber(x)).split('.')[1] || '').length;

/** 2.5 with 2 places -> "2.50", so the decimal points line up. */
const padded = (x, places) => Number(x).toFixed(places);

/** ". Write 0 in any empty place" when either number has fewer decimal places. */
const padNote = (x, y, places) => (placesOf(x) < places || placesOf(y) < places ? '. Write 0 in any empty place' : '');

/* ------------------------------------------------------------------ */
/* Decimal operations                                                  */
/* ------------------------------------------------------------------ */

/**
 * @param {{forms?: ('add'|'sub'|'mulWhole'|'divWhole'|'mulDec'|'divDec'|'round')[], places?: number, max?: number}} spec
 */
const decimalOps = ({ forms = ['add', 'sub'], places = 2, max = 100 }, rng) => {
  const form = pick(forms, rng);
  const scale = 10 ** places;
  if (form === 'add' || form === 'sub') {
    // Whole numbers of hundredths (or tenths). Sometimes one number has fewer places: 4.5 + 2.36.
    let a = randInt(scale / 10 + 1, max * scale, rng);
    let b = randInt(scale / 10 + 1, max * scale, rng);
    if (places > 1 && rng() < 0.4) b = Math.max(10, b - (b % 10));
    if (form === 'sub' && a === b) a += 7;
    if (form === 'sub' && a < b) [a, b] = [b, a];
    const r = form === 'add' ? a + b : a - b;
    const op = form === 'add' ? '+' : '−';
    return {
      answerType: 'numeric',
      prompt: `${dec(a / scale)} ${op} ${dec(b / scale)} = ?`,
      answer: tidyNumber(r / scale),
      hint: 'Line up the decimal points. Fill empty places with 0, then work like whole numbers.',
      explain: `${padded(a / scale, places)} ${op} ${padded(b / scale, places)} = ${padded(r / scale, places)}`,
      method: { kind: 'decimalColumn', a, b, op, places },
    };
  }
  if (form === 'mulWhole' || form === 'divWhole') {
    const w = randInt(2, 9, rng);
    const p = rng() < 0.5 ? 1 : places;
    const s = 10 ** p;
    const x = drawUntil(() => randInt(s / 10 + 1, 20 * s, rng), (v) => v % 10 !== 0);
    if (form === 'mulWhole') {
      return {
        answerType: 'numeric',
        prompt: `${dec(x / s)} × ${w} = ?`,
        answer: tidyNumber((x * w) / s),
        hint: `Think of ${dec(x / s)} as ${fmt(x)} ${PLACE_NAME[p]}. Multiply, then change back.`,
        explain: `${fmt(x)} ${PLACE_NAME[p]} × ${w} = ${fmt(x * w)} ${PLACE_NAME[p]} = ${dec((x * w) / s)}`,
        method: { kind: 'decimalByWhole', x, w, p, op: '×' },
      };
    }
    return {
      answerType: 'numeric',
      prompt: `${dec((x * w) / s)} ÷ ${w} = ?`,
      answer: tidyNumber(x / s),
      hint: `Think of ${dec((x * w) / s)} as ${fmt(x * w)} ${PLACE_NAME[p]}. Divide, then change back.`,
      explain: `${fmt(x * w)} ${PLACE_NAME[p]} ÷ ${w} = ${fmt(x)} ${PLACE_NAME[p]} = ${dec(x / s)}`,
      method: { kind: 'decimalByWhole', x: x * w, w, p, op: '÷' },
    };
  }
  if (form === 'mulDec') {
    const pa = rng() < 0.6 ? 1 : 2;
    const a = drawUntil(() => randInt(2, pa === 1 ? 99 : 300, rng), (v) => v % 10 !== 0);
    const b = randInt(2, 9, rng);
    return {
      answerType: 'numeric',
      prompt: `${dec(a / 10 ** pa)} × ${dec(b / 10)} = ?`,
      answer: tidyNumber((a * b) / 10 ** (pa + 1)),
      hint: 'Multiply without the decimal points. Then count the decimal places in the question.',
      explain: `${a} × ${b} = ${a * b}, with ${pa + 1} decimal places: ${dec((a * b) / 10 ** (pa + 1))}`,
      method: { kind: 'decimalMultiply', a, pa, b, pb: 1 },
    };
  }
  if (form === 'divDec') {
    const b = randInt(2, 9, rng);
    const q = randInt(2, 12, rng);
    return {
      answerType: 'numeric',
      prompt: `${dec((b * q) / 10)} ÷ ${dec(b / 10)} = ?`,
      answer: q,
      hint: 'Multiply both numbers by 10, so you divide by a whole number.',
      explain: `${dec((b * q) / 10)} ÷ ${dec(b / 10)} = ${b * q} ÷ ${b} = ${q}`,
      method: { kind: 'decimalDivide', b, q },
    };
  }
  // round: a number with 3 decimal places to a whole number, 1 or 2 places.
  const value = drawUntil(() => randInt(1001, 99999, rng), (v) => v % 10 !== 0);
  const to = pick([0, 1, 2], rng);
  const target = to === 0 ? 'the nearest whole number' : `${to} decimal ${to === 1 ? 'place' : 'places'}`;
  return {
    answerType: 'numeric',
    prompt: `Round ${dec(value / 1000)} to ${target}.`,
    answer: roundTo(value, to),
    hint: 'Look at the digit just after the place you round to. 5 or more: round up. Less than 5: keep it.',
    method: { kind: 'roundDecimal', value, to },
  };
};

/** Round a number given in thousandths to `to` decimal places. Halves go up. */
const roundTo = (thousandths, to) => {
  const step = 10 ** (3 - to);
  return tidyNumber((Math.floor((thousandths + step / 2) / step) * step) / 1000);
};

const decimalColumn = ({ a, b, op, places }) => {
  const scale = 10 ** places;
  const r = op === '+' ? a + b : a - b;
  const name = PLACE_NAME[places];
  const [A, B, R] = [padded(a / scale, places), padded(b / scale, places), padded(r / scale, places)];
  return {
    name: 'Line up the decimal points',
    steps: [
      { text: `Line up the decimal points, one under the other${padNote(a / scale, b / scale, places)}: ${A} and ${B}.` },
      { text: `Work in ${name}: ${A} is ${fmt(a)} ${name} and ${B} is ${fmt(b)} ${name}. ${fmt(a)} ${op} ${fmt(b)} = ${fmt(r)}.` },
      { text: `${fmt(r)} ${name} = ${R}. The decimal point stays in line: ${A} ${op} ${B} = ${R}.` },
    ],
    guided: [
      ask(`${A} = how many ${name}?`, a),
      ask(`${B} = how many ${name}?`, b),
      ask(`${fmt(a)} ${op} ${fmt(b)} = ?`, r),
      ask(`${fmt(r)} ${name} as a decimal = ?`, tidyNumber(r / scale)),
    ],
  };
};

const decimalByWhole = ({ x, w, p, op }) => {
  const s = 10 ** p;
  const name = PLACE_NAME[p];
  const r = op === '×' ? x * w : x / w;
  return {
    name: `Count in ${name}`,
    steps: [
      { text: `${dec(x / s)} is ${fmt(x)} ${name}.` },
      { text: `${fmt(x)} ${name} ${op} ${w} = ${fmt(r)} ${name}.` },
      { text: `${fmt(r)} ${name} = ${dec(r / s)}. So ${dec(x / s)} ${op} ${w} = ${dec(r / s)}.` },
    ],
    guided: [
      ask(`${dec(x / s)} = how many ${name}?`, x),
      ask(`${fmt(x)} ${op} ${w} = ?`, r),
      ask(`${fmt(r)} ${name} as a decimal = ?`, tidyNumber(r / s)),
    ],
  };
};

const decimalMultiply = ({ a, pa, b, pb }) => {
  const total = pa + pb;
  const result = tidyNumber((a * b) / 10 ** total);
  return {
    name: 'Multiply, then count the decimal places',
    steps: [
      { text: `Multiply without the decimal points: ${a} × ${b} = ${a * b}.` },
      { text: `${dec(a / 10 ** pa)} has ${pa} decimal ${pa === 1 ? 'place' : 'places'} and ${dec(b / 10 ** pb)} has ${pb}. ${pa} + ${pb} = ${total}, so the answer has ${total} decimal places.` },
      { text: `${a * b} with ${total} decimal places is ${padded(result, total)}. So the answer is ${dec(result)}.` },
    ],
    guided: [
      ask(`Without the points: ${a} × ${b} = ?`, a * b),
      ask(`How many decimal places are in the question altogether?`, total),
      ask(`So ${dec(a / 10 ** pa)} × ${dec(b / 10 ** pb)} = ?`, result),
    ],
  };
};

const decimalDivide = ({ b, q }) => {
  const D = b * q;
  return {
    name: 'Make the divisor a whole number',
    steps: [
      { text: `Dividing by ${dec(b / 10)} is hard. Multiply both numbers by 10. The answer stays the same.` },
      { text: `${dec(D / 10)} × 10 = ${D} and ${dec(b / 10)} × 10 = ${b}.` },
      { text: `${D} ÷ ${b} = ${q}. So ${dec(D / 10)} ÷ ${dec(b / 10)} = ${q}.` },
    ],
    guided: [
      ask(`${dec(D / 10)} × 10 = ?`, D),
      ask(`${dec(b / 10)} × 10 = ?`, b),
      ask(`${D} ÷ ${b} = ?`, q),
    ],
  };
};

const roundDecimal = ({ value, to }) => {
  const digits = String(value).padStart(4, '0');
  const nextDigit = Number(digits[digits.length - 3 + to]);
  const place = to === 0 ? 'ones' : PLACE_NAME[to];
  const nextPlace = PLACE_NAME[to + 1];
  const up = nextDigit >= 5;
  const result = roundTo(value, to);
  const x = dec(value / 1000);
  return {
    name: 'Look at the next digit',
    steps: [
      { text: `We round to the ${place} place. Look at the digit just after it, in the ${nextPlace} place: ${nextDigit}.` },
      { text: up ? `${nextDigit} is 5 or more, so round up.` : `${nextDigit} is less than 5, so the ${place} digit stays the same.` },
      { text: `${x} rounded to ${to === 0 ? 'the nearest whole number' : `${to} decimal ${to === 1 ? 'place' : 'places'}`} is ${to === 0 ? result : padded(result, to)}.` },
    ],
    guided: [
      ask(`In ${x}, what digit is in the ${nextPlace} place?`, nextDigit),
      askChoice(`The digit is ${nextDigit}. Is it 5 or more?`, up ? 'yes' : 'no', ['yes', 'no']),
      ask(`So ${x} rounded is?`, result),
    ],
  };
};

/* ------------------------------------------------------------------ */
/* Multiply and divide by 10, 100 and 1,000                            */
/* ------------------------------------------------------------------ */

/** @param {{ops?: ('×'|'÷')[], powers?: number[], decimals?: boolean}} spec */
const powersOfTen = ({ ops = ['×', '÷'], powers = [10, 100, 1000], decimals = true }, rng) => {
  const op = pick(ops, rng);
  const p = pick(powers, rng);
  const zeros = Math.log10(p);
  // The number as an integer and its decimal places, e.g. 3.45 = 345 with 2 places.
  const [int, places] = drawUntil(
    () => (decimals && rng() < 0.6 ? [randInt(11, 999, rng), randInt(1, 2, rng)] : [randInt(2, 999, rng), 0]),
    ([n, k]) => n % 10 !== 0 && (op === '÷' ? k + zeros <= 3 : true),
  );
  const x = tidyNumber(int / 10 ** places);
  const answer = tidyNumber(op === '×' ? x * p : x / p);
  return {
    answerType: 'numeric',
    prompt: `${dec(x)} ${op} ${fmt(p)} = ?`,
    answer,
    hint: `${fmt(p)} has ${zeros} ${zeros === 1 ? 'zero' : 'zeros'}. Move each digit ${zeros} ${zeros === 1 ? 'place' : 'places'} to the ${op === '×' ? 'left' : 'right'}.`,
    explain: `${dec(x)} ${op} ${fmt(p)} = ${dec(answer)}`,
    method: { kind: 'shiftPlaces', x, p, op },
  };
};

const shiftPlaces = ({ x, p, op }) => {
  const zeros = Math.log10(p);
  const answer = tidyNumber(op === '×' ? x * p : x / p);
  const way = op === '×' ? 'left' : 'right';
  return {
    name: 'Move the digits',
    steps: [
      { text: `${fmt(p)} has ${zeros} ${zeros === 1 ? 'zero' : 'zeros'}. ${op === '×' ? 'Multiplying' : 'Dividing'} by ${fmt(p)} moves every digit ${zeros} ${zeros === 1 ? 'place' : 'places'} to the ${way}. The number gets ${op === '×' ? 'bigger' : 'smaller'}.` },
      { text: `Move the digits of ${dec(x)} ${zeros} ${zeros === 1 ? 'place' : 'places'} to the ${way}${(op === '×' ? placesOf(x) < zeros : answer < 1) ? ', and write 0 in any empty places' : ''}.` },
      { text: `${dec(x)} ${op} ${fmt(p)} = ${dec(answer)}.` },
    ],
    guided: [
      ask(`How many zeros does ${fmt(p)} have?`, zeros),
      askChoice('Which way do the digits move?', way, ['left', 'right']),
      ask(`${dec(x)} ${op} ${fmt(p)} = ?`, answer),
    ],
  };
};

/* ------------------------------------------------------------------ */
/* Percentages                                                         */
/* ------------------------------------------------------------------ */

const PERCENTS = [5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90];
/** Stories for "p% of Q": each sentence pair makes sense on its own. */
const STORIES = [
  (Q, p) => `A school has ${fmt(Q)} pupils. ${p}% of them walk to school. How many pupils walk to school?`,
  (Q, p) => `A library has ${fmt(Q)} books. ${p}% of them are storybooks. How many storybooks are there?`,
  (Q, p) => `A farm has ${fmt(Q)} animals. ${p}% of them are goats. How many goats are there?`,
  (Q, p) => `${fmt(Q)} people watched a basketball game. ${p}% of them were children. How many children watched?`,
];
const SHOP = [['bag', 'A bag'], ['pair of shoes', 'A pair of shoes'], ['fan', 'An electric fan'], ['bike', 'A bike'], ['watch', 'A watch']];

/** p% as equal parts of 100%: 15% -> 20 parts of 5%, take 3. */
const percentParts = (p) => {
  const g = gcd(p, 100);
  return { g, parts: 100 / g, take: p / g };
};

/** A whole Q that splits into the parts for p%, at most `max`. */
const wholeFor = (p, max, rng, min = 0) => {
  const { parts } = percentParts(p);
  return parts * randInt(Math.max(1, Math.ceil(min / parts)), Math.max(1, Math.floor(max / parts)), rng);
};

/**
 * @param {{forms?: ('toPercent'|'whatPercent'|'ofQuantity'|'discount'|'increase'|'findWhole')[], max?: number}} spec
 */
const percentage = ({ forms = ['toPercent', 'ofQuantity'], max = 600 }, rng) => {
  const form = pick(forms, rng);
  if (form === 'toPercent' || form === 'whatPercent') {
    const d = pick(form === 'toPercent' ? [2, 4, 5, 10, 20, 25, 50] : [10, 20, 25, 50], rng);
    const n = randInt(1, d - 1, rng);
    const N = (n * 100) / d;
    if (form === 'toPercent' && rng() < 0.3) {
      return {
        answerType: 'numeric',
        prompt: `Write ${dec(N / 100)} as a percentage.`,
        answer: N,
        display: `${N}%`,
        hint: 'Percent means "out of 100". How many hundredths is it?',
        method: { kind: 'toPercent', n: N, d: 100 },
      };
    }
    const name = pick(NAMES, rng);
    return {
      answerType: 'numeric',
      prompt: form === 'toPercent' ? `Write ${n}/${d} as a percentage.` : `${name} got ${n} out of ${d} in a quiz. What percentage is that?`,
      answer: N,
      display: `${N}%`,
      hint: d === 100 ? 'Percent means "out of 100".' : `Percent means "out of 100". Make the bottom number 100.`,
      method: { kind: 'toPercent', n, d },
    };
  }
  const p = pick(form === 'discount' || form === 'increase' ? [10, 15, 20, 25, 30, 40, 50] : PERCENTS, rng);
  const { parts, take } = percentParts(p);
  if (form === 'findWhole') {
    const Q = wholeFor(p, max, rng, 40);
    const part = (Q / parts) * take;
    return {
      answerType: 'numeric',
      prompt: `${p}% of a number is ${fmt(part)}. What is the number?`,
      answer: Q,
      hint: `Find 1 part first: ${percentParts(p).g}% of the number.`,
      method: { kind: 'percentWhole', p, part },
    };
  }
  if (form === 'discount' || form === 'increase') {
    const Q = wholeFor(p, Math.max(max, 1000), rng, 100);
    const change = (Q / parts) * take;
    if (form === 'discount') {
      const [thing, Thing] = pick(SHOP, rng);
      return {
        answerType: 'numeric',
        prompt: `${Thing} costs ₱${fmt(Q)}. The shop takes ${p}% off. How much does the ${thing} cost now, in pesos?`,
        answer: Q - change,
        display: `₱${fmt(Q - change)}`,
        hint: `Find ${p}% of ₱${fmt(Q)}, then take it away.`,
        method: { kind: 'percentOf', p, Q, then: 'sub', unit: '₱' },
      };
    }
    return {
      answerType: 'numeric',
      prompt: `A farm had ${fmt(Q)} chickens last year. This year it has ${p}% more. How many chickens does it have now?`,
      answer: Q + change,
      hint: `Find ${p}% of ${fmt(Q)}, then add it on.`,
      method: { kind: 'percentOf', p, Q, then: 'add' },
    };
  }
  // ofQuantity: as a sum or a story.
  const Q = wholeFor(p, max, rng, 20);
  const part = (Q / parts) * take;
  const story = rng() < 0.5;
  return {
    answerType: 'numeric',
    prompt: story ? pick(STORIES, rng)(Q, p) : `${p}% of ${fmt(Q)} = ?`,
    answer: part,
    hint: `100% is ${fmt(Q)}. Find ${percentParts(p).g}% first.`,
    method: { kind: 'percentOf', p, Q },
  };
};

/** Bar model of 100% cut into equal parts (at most 20 drawn). */
const percentBar = (p, Q, braceText) => {
  const { g, parts, take } = percentParts(p);
  return {
    kind: 'bar',
    rows: [{ label: '', segments: Array.from({ length: parts }, () => ({ units: 1, text: parts <= 10 ? `${g}%` : '' })) }],
    braces: [{ row: 0, from: 0, to: parts, side: 'above', text: Q === null ? '?' : `100% = ${fmt(Q)}` }, { row: 0, from: 0, to: take, side: 'below', text: braceText }],
  };
};

const toPercent = ({ n, d }) => {
  const N = (n * 100) / d;
  if (d === 100) {
    return {
      name: 'Out of 100',
      steps: [
        { text: `Percent means "out of 100". ${dec(N / 100)} is ${N} hundredths.` },
        { text: `${N} hundredths = ${N}/100 = ${N}%.` },
      ],
      guided: [ask(`${dec(N / 100)} = how many hundredths?`, N)],
    };
  }
  const f = 100 / d;
  return {
    name: 'Make it out of 100',
    steps: [
      { text: `Percent means "out of 100". Make the bottom number 100: ${d} × ${f} = 100.` },
      { text: `Multiply the top by ${f} too: ${n} × ${f} = ${N}. So ${n}/${d} = ${N}/100.` },
      { text: `${N}/100 = ${N}%.` },
    ],
    guided: [ask(`${d} × ? = 100`, f), ask(`${n} × ${f} = ?`, N)],
  };
};

const percentOf = ({ p, Q, then, unit = '' }) => {
  const { g, parts, take } = percentParts(p);
  const u = Q / parts;
  const part = u * take;
  const money = (v) => `${unit}${fmt(v)}`;
  const final = then === 'sub' ? Q - part : then === 'add' ? Q + part : part;
  return {
    name: 'Bar model: 100% is the whole',
    steps: [
      { text: `100% is the whole: ${money(Q)}. Cut it into ${parts} equal parts of ${g}%.`, visual: percentBar(p, Q, `${p}%`) },
      { text: `1 part, ${g}%, = ${money(Q)} ÷ ${parts} = ${money(u)}.` },
      ...(take === 1 ? [] : [{ text: `${p}% is ${take} parts: ${take} × ${money(u)} = ${money(part)}.` }]),
      ...(then ? [{ text: then === 'sub' ? `Take it off: ${money(Q)} − ${money(part)} = ${money(final)}.` : `Add it on: ${fmt(Q)} + ${fmt(part)} = ${fmt(final)}.` }] : []),
    ],
    guided: [
      ask(`How many ${g}% parts make 100%?`, parts),
      ask(`1 part = ${fmt(Q)} ÷ ${parts} = ?`, u),
      ...(take === 1 ? [] : [ask(`${p}% = ${take} × ${fmt(u)} = ?`, part)]),
      ...(then ? [ask(`${fmt(Q)} ${then === 'sub' ? '−' : '+'} ${fmt(part)} = ?`, final)] : []),
    ],
  };
};

const percentWhole = ({ p, part }) => {
  const { g, parts, take } = percentParts(p);
  const u = part / take;
  const Q = u * parts;
  return {
    name: 'Bar model: find 1 part',
    steps: [
      { text: `The whole number is 100%. Cut it into ${parts} equal parts of ${g}%. ${p}% is ${take} ${take === 1 ? 'part' : 'parts'}.`, visual: percentBar(p, null, fmt(part)) },
      ...(take === 1 ? [] : [{ text: `${take} parts = ${fmt(part)}, so 1 part = ${fmt(part)} ÷ ${take} = ${fmt(u)}.` }]),
      { text: `100% is ${parts} parts: ${parts} × ${fmt(u)} = ${fmt(Q)}.` },
    ],
    guided: [
      ...(take === 1 ? [] : [ask(`${take} parts = ${fmt(part)}. 1 part = ${fmt(part)} ÷ ${take} = ?`, u)]),
      ask(`100% = ${parts} parts = ${parts} × ${fmt(u)} = ?`, Q),
    ],
  };
};

export const generators = { decimalOps, powersOfTen, percentage };
export const methods = { decimalColumn, decimalByWhole, decimalMultiply, decimalDivide, roundDecimal, shiftPlaces, toPercent, percentOf, percentWhole };
