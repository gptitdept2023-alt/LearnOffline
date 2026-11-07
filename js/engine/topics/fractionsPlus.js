/**
 * Fractions for Grades 5 and 6: adding and subtracting unlike fractions,
 * mixed numbers, a fraction of an amount (bar model), multiplying and
 * dividing fractions. Generators and techniques together.
 *
 * Every answer is given in simplest form (fracText), and every wrong choice
 * is checked to have a DIFFERENT value from the answer, so 2/4 can never sit
 * next to 1/2 as a "wrong" option.
 * Pure and DOM-free.
 */

import { randInt, pick, shuffle } from '../../core/random.js';
import { NAMES, ask, askChoice, stack, gcd, lcm, drawUntil, fracText } from './shared.js';

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const PLURALS = {
  1: 'wholes', 2: 'halves', 3: 'thirds', 4: 'fourths', 5: 'fifths', 6: 'sixths', 7: 'sevenths', 8: 'eighths', 9: 'ninths', 10: 'tenths', 11: 'elevenths', 12: 'twelfths',
  13: 'thirteenths', 14: 'fourteenths', 15: 'fifteenths', 16: 'sixteenths', 17: 'seventeenths', 18: 'eighteenths', 19: 'nineteenths', 20: 'twentieths',
  21: 'twenty-firsts', 22: 'twenty-seconds', 23: 'twenty-thirds', 24: 'twenty-fourths',
};
const SINGULAR = { 2: 'half', 3: 'third', 4: 'fourth', 5: 'fifth', 6: 'sixth', 7: 'seventh', 8: 'eighth', 9: 'ninth', 10: 'tenth', 11: 'eleventh', 12: 'twelfth' };
const pieces = (d) => PLURALS[d] || `${d}ths`;

/** A numerator from 1 to d − 1 that shares no factor with d (so the fraction is in simplest form). */
const properNumerator = (d, rng) => drawUntil(() => randInt(1, d - 1, rng), (n) => gcd(n, d) === 1);

/** A shaded fraction bar. */
const bar = (n, d, extra = {}) => ({ kind: 'fraction', numerator: n, denominator: d, shape: 'bar', label: `${n}/${d}`, ...extra });

/** Value of "3/4", "2" or "1 1/2". */
const valueOf = (text) => {
  const m = /^(?:(\d+) )?(\d+)(?:\/(\d+))?$/.exec(text);
  if (!m) return NaN;
  if (m[3] === undefined) return Number(m[2]);
  return Number(m[1] || 0) + Number(m[2]) / Number(m[3]);
};

/**
 * The answer plus wrong options whose VALUES all differ from it and from
 * each other. `wrong` is a list of [numerator, denominator] pairs.
 */
const fractionChoices = (answer, wrong, rng, { mixed = true } = {}) => {
  const seen = new Set([valueOf(answer).toFixed(9)]);
  const options = [];
  for (const [n, d] of shuffle(wrong, rng)) {
    if (!(n > 0 && d > 0 && Number.isInteger(n) && Number.isInteger(d))) continue;
    const text = fracText(n, d, { mixed });
    const key = valueOf(text).toFixed(9);
    if (seen.has(key)) continue;
    seen.add(key);
    options.push(text);
    if (options.length === 3) break;
  }
  return shuffle([answer, ...options], rng);
};

/** Question fields for a fraction answer: a whole number is typed as a number. */
const fractionAnswer = (n, d) => {
  const text = fracText(n, d);
  if (n % d === 0) return { answerType: 'numeric', answer: n / d };
  return { answerType: 'fraction', answer: text, mixed: n > d };
};

/** The last guided step: write the result in simplest form (or as a number). */
const finalStep = (n, d, rng, prompt) => {
  if (n % d === 0) return ask(prompt || `${n} ÷ ${d} = ?`, n / d);
  const text = fracText(n, d);
  const wrong = [[n + d, d], [n, d + 1], [Math.max(1, n - 1), d], [n + 1, d], [d, n]];
  return askChoice(prompt || (text === `${n}/${d}` ? `So the answer is?` : `Write ${n}/${d} in simplest form.`), text, fractionChoices(text, wrong, rng));
};

/** "… = 25/18" followed by " = 1 7/18" only when the simplest form is different. */
const withSimplest = (text, n, d) => (fracText(n, d) === `${n}/${d}` ? text : `${text} = ${fracText(n, d)}`);

/** Steps that simplify n/d, or nothing when it is already in simplest form. */
const simplifySteps = (n, d) => {
  if (n % d === 0) return [{ text: `${n}/${d} = ${n} ÷ ${d} = ${n / d}.` }];
  const g = gcd(n, d);
  const text = fracText(n, d);
  const out = [];
  if (g > 1) out.push({ text: `Simplify: divide the top and the bottom by ${g}. ${n}/${d} = ${n / g}/${d / g}.` });
  const [a, b] = [n / g, d / g];
  if (a > b) out.push({ text: `${a}/${b} is more than 1. ${b}/${b} make 1 whole, so ${a}/${b} = ${text}.` });
  return out;
};

/* ------------------------------------------------------------------ */
/* Add and subtract unlike fractions                                   */
/* ------------------------------------------------------------------ */

/**
 * 2/3 + 1/4 = ? Different denominators. `related` makes one denominator a
 * multiple of the other (1/2 + 3/8), the first step in Singapore P4–P5.
 * @param {{maxDen?: number, related?: boolean, ops?: string[], maxLcm?: number}} spec
 */
const fractionUnlike = ({ maxDen = 12, related = false, ops = ['+', '−'], maxLcm = 24 }, rng) => {
  const [d1, d2] = drawUntil(
    () => {
      const a = randInt(2, related ? Math.floor(maxDen / 2) : maxDen, rng);
      return [a, related ? a * randInt(2, 4, rng) : randInt(2, maxDen, rng)];
    },
    ([a, b]) => a !== b && b <= maxDen && lcm(a, b) <= maxLcm && (related ? b % a === 0 : lcm(a, b) > Math.max(a, b)),
  );
  let p = [properNumerator(d1, rng), d1];
  let q = [properNumerator(d2, rng), d2];
  if (rng() < 0.5) [p, q] = [q, p];
  const op = pick(ops, rng);
  if (op === '−' && p[0] * q[1] < q[0] * p[1]) [p, q] = [q, p];
  const [n1, e1] = p;
  const [n2, e2] = q;
  const L = lcm(e1, e2);
  const N = op === '+' ? n1 * (L / e1) + n2 * (L / e2) : n1 * (L / e1) - n2 * (L / e2);
  return {
    ...fractionAnswer(N, L),
    prompt: `${n1}/${e1} ${op} ${n2}/${e2} = ?`,
    hint: `The parts are different sizes. Rename both fractions as ${pieces(L)} first.`,
    explain: withSimplest(`${n1}/${e1} ${op} ${n2}/${e2} = ${n1 * (L / e1)}/${L} ${op} ${n2 * (L / e2)}/${L} = ${N}/${L}`, N, L),
    method: { kind: 'unlikeDenominator', n1, d1: e1, n2, d2: e2, op },
  };
};

const unlikeDenominator = ({ n1, d1, n2, d2, op }) => {
  const L = lcm(d1, d2);
  const [A, B] = [n1 * (L / d1), n2 * (L / d2)];
  const N = op === '+' ? A + B : A - B;
  const big = Math.max(d1, d2);
  const small = Math.min(d1, d2);
  const multiples = Array.from({ length: L / big }, (_, i) => big * (i + 1));
  const rename = (n, d, m) => (d === L ? `${n}/${d} already has ${L} parts.` : `${n}/${d} = ${n} × ${L / d} over ${d} × ${L / d} = ${n * (L / d)}/${L}.`);
  const rng = () => 0.37; // fixed order, so the worked example and "Try with help" match
  const guided = [
    ask(`What is the smallest number that both ${d1} and ${d2} go into?`, L),
    ...(d1 === L ? [] : [ask(`${n1}/${d1} = ?/${L}`, A, bar(n1, d1))]),
    ...(d2 === L ? [] : [ask(`${n2}/${d2} = ?/${L}`, B, bar(n2, d2))]),
  ];
  if (fracText(N, L) === `${N}/${L}`) {
    guided.push(finalStep(N, L, rng, `${A}/${L} ${op} ${B}/${L} = ?`));
  } else {
    guided.push(ask(`${A}/${L} ${op} ${B}/${L} = ?/${L}`, N), finalStep(N, L, rng, N > L && gcd(N, L) === 1 ? `Write ${N}/${L} as a mixed number.` : undefined));
  }
  return {
    name: 'Make the parts the same size',
    steps: [
      { text: `${capital(pieces(d1))} and ${pieces(d2)} are different sizes, so we cannot ${op === '+' ? 'add' : 'subtract'} them yet.`, visual: stack(bar(n1, d1), bar(n2, d2)) },
      { text: `Find a number both ${d1} and ${d2} go into. Count in ${big}s: ${multiples.join(', ')}. ${small} goes into ${L}, so use ${pieces(L)}.` },
      { text: `${rename(n1, d1)} ${rename(n2, d2)}`, visual: stack(bar(A, L), bar(B, L)) },
      { text: `Now the parts are the same size: ${A}/${L} ${op} ${B}/${L} = ${N}/${L}.`, visual: N <= L ? bar(N, L) : undefined },
      ...simplifySteps(N, L),
    ],
    guided,
  };
};

const capital = (text) => text[0].toUpperCase() + text.slice(1);

/* ------------------------------------------------------------------ */
/* Mixed numbers and improper fractions                                */
/* ------------------------------------------------------------------ */

/** @param {{maxDen?: number, maxWhole?: number, forms?: ('toMixed'|'toImproper')[]}} spec */
const mixedNumbers = ({ maxDen = 9, maxWhole = 4, forms = ['toMixed', 'toImproper'] }, rng) => {
  const d = randInt(2, maxDen, rng);
  const n = properNumerator(d, rng);
  const w = randInt(1, maxWhole, rng);
  const I = w * d + n;
  const form = pick(forms, rng);
  if (form === 'toMixed') {
    const answer = `${w} ${n}/${d}`;
    const wrong = [[(w + 1) * d + n, d], [w * d + (d - n), d], [(w - 1) * d + n, d], [n * d + w, d], [w * d + n, d + 1]];
    return {
      answerType: 'choice',
      prompt: `Write ${I}/${d} as a mixed number.`,
      answer,
      choices: fractionChoices(answer, wrong, rng),
      hint: `${d}/${d} make 1 whole. How many wholes are in ${I}/${d}?`,
      explain: `${I} ÷ ${d} = ${w} remainder ${n}, so ${I}/${d} = ${answer}`,
      method: { kind: 'mixedNumber', w, n, d, form },
    };
  }
  return {
    answerType: 'fraction',
    prompt: `Write ${w} ${n}/${d} as an improper fraction.`,
    answer: `${I}/${d}`,
    hint: `Each whole is ${d}/${d}. Change the wholes into ${pieces(d)}, then add the ${n} more.`,
    explain: `${w} × ${d} + ${n} = ${I}, so ${w} ${n}/${d} = ${I}/${d}`,
    method: { kind: 'mixedNumber', w, n, d, form },
  };
};

const mixedNumber = ({ w, n, d, form }) => {
  const I = w * d + n;
  const wholes = Array.from({ length: Math.min(w, 4) }, () => bar(d, d, { label: '1 whole' }));
  const pic = w <= 4 ? stack(...wholes, bar(n, d)) : undefined;
  const fixed = () => 0.42;
  if (form === 'toMixed') {
    const answer = `${w} ${n}/${d}`;
    const wrong = [[(w + 1) * d + n, d], [w * d + (d - n), d], [(w - 1) * d + n, d], [n * d + w, d]];
    return {
      name: 'Make wholes',
      steps: [
        { text: `${d}/${d} make 1 whole.`, visual: bar(d, d, { label: `${d}/${d} = 1` }) },
        { text: `Share the ${I} ${pieces(d)} into wholes: ${I} ÷ ${d} = ${w} remainder ${n}.`, visual: pic },
        { text: `That is ${w} ${w === 1 ? 'whole' : 'wholes'} and ${n}/${d} more. So ${I}/${d} = ${answer}.`, visual: pic },
      ],
      guided: [
        ask(`How many ${pieces(d)} make 1 whole?`, d),
        ask(`${I} ÷ ${d} = ? wholes, with some left over`, w),
        ask(`How many ${pieces(d)} are left over?`, n),
        askChoice(`So ${I}/${d} = ?`, answer, fractionChoices(answer, wrong, fixed)),
      ],
    };
  }
  const answer = `${I}/${d}`;
  const wrong = [[w * n + d, d], [w + n, d], [w * d, d + n], [I + d, d]];
  return {
    name: 'Change wholes into parts',
    steps: [
      { text: `Each whole is ${d}/${d}.`, visual: pic },
      { text: `${w} ${w === 1 ? 'whole is' : 'wholes are'} ${w} × ${d} = ${w * d} ${pieces(d)}.` },
      { text: `Add the ${n} more: ${w * d} + ${n} = ${I}. So ${w} ${n}/${d} = ${answer}.` },
    ],
    guided: [
      ask(`${w} ${w === 1 ? 'whole' : 'wholes'} = ?/${d}`, w * d, pic),
      ask(`${w * d} + ${n} = ?`, I),
      askChoice(`So ${w} ${n}/${d} = ?`, answer, fractionChoices(answer, wrong, fixed, { mixed: false })),
    ],
  };
};

/* ------------------------------------------------------------------ */
/* A fraction of an amount                                             */
/* ------------------------------------------------------------------ */

const THINGS = ['stickers', 'marbles', 'cards', 'stamps', 'beads', 'mangoes'];

/** The bar model: `d` equal units making `whole`, with a brace on the units asked about. */
const unitBar = (d, whole, from, to, text) => ({
  kind: 'bar',
  rows: [{ label: '', segments: Array.from({ length: d }, () => ({ units: 1, text: '' })) }],
  braces: [{ row: 0, from: 0, to: d, side: 'above', text: String(whole) }, { row: 0, from, to, side: 'below', text }],
});

/**
 * 3/5 of 40 = ? as a sum, or as a story ("gave away 3/5 of them").
 * @param {{maxDen?: number, maxUnit?: number, forms?: ('number'|'part'|'rest')[]}} spec
 */
const fractionOf = ({ maxDen = 10, maxUnit = 12, forms = ['number', 'part', 'rest'] }, rng) => {
  const d = randInt(2, maxDen, rng);
  const n = properNumerator(d, rng);
  const u = randInt(2, maxUnit, rng);
  const Q = d * u;
  const form = pick(forms, rng);
  const name = pick(NAMES, rng);
  const thing = pick(THINGS, rng);
  const rest = form === 'rest';
  const k = rest ? d - n : n;
  const prompt = form === 'number'
    ? `${n}/${d} of ${Q} = ?`
    : `${name} had ${Q} ${thing} and gave away ${n}/${d} of them. How many ${thing} did ${name} ${rest ? 'have left' : 'give away'}?`;
  return {
    answerType: 'numeric',
    prompt,
    answer: k * u,
    model: unitBar(d, Q, rest ? n : 0, rest ? d : n, '?'),
    hint: `Cut ${Q} into ${d} equal units. Find 1 unit first.`,
    explain: k === 1 ? `1 unit = ${Q} ÷ ${d} = ${u}` : `1 unit = ${Q} ÷ ${d} = ${u}, so ${k} units = ${k} × ${u} = ${k * u}`,
    method: { kind: 'fractionOfAmount', n, d, Q, rest },
  };
};

const fractionOfAmount = ({ n, d, Q, rest = false }) => {
  const u = Q / d;
  const k = rest ? d - n : n;
  const asked = unitBar(d, Q, rest ? n : 0, rest ? d : n, '?');
  const done = unitBar(d, Q, rest ? n : 0, rest ? d : n, String(k * u));
  return {
    name: 'Bar model: find 1 unit',
    steps: [
      { text: `Draw the whole, ${Q}, as a bar cut into ${d} equal units.`, visual: asked },
      ...(rest ? [{ text: `${n}/${d} was given away, so ${d} − ${n} = ${k} ${k === 1 ? 'unit is' : 'units are'} left.` }] : [{ text: `${n}/${d} means ${n} of the ${d} units.` }]),
      { text: `${d} units = ${Q}, so 1 unit = ${Q} ÷ ${d} = ${u}.` },
      { text: k === 1 ? `The answer is 1 unit: ${u}.` : `${k} units = ${k} × ${u} = ${k * u}.`, visual: done },
    ],
    guided: [
      ...(rest ? [ask(`How many units are left? ${d} − ${n} = ?`, k, asked)] : []),
      ask(`1 unit = ${Q} ÷ ${d} = ?`, u, asked),
      ...(k === 1 ? [] : [ask(`${k} units = ${k} × ${u} = ?`, k * u)]),
    ],
  };
};

/* ------------------------------------------------------------------ */
/* Multiply fractions                                                  */
/* ------------------------------------------------------------------ */

/** @param {{maxDen?: number, forms?: ('fracFrac'|'fracWhole')[], maxWhole?: number}} spec */
const fractionMultiply = ({ maxDen = 10, forms = ['fracFrac', 'fracWhole'], maxWhole = 12 }, rng) => {
  const form = pick(forms, rng);
  const d1 = randInt(2, maxDen, rng);
  const n1 = properNumerator(d1, rng);
  const [n2, d2] = form === 'fracWhole' ? [randInt(2, maxWhole, rng), 1] : (() => { const d = randInt(2, maxDen, rng); return [properNumerator(d, rng), d]; })();
  const second = d2 === 1 ? String(n2) : `${n2}/${d2}`;
  const [P, D] = [n1 * n2, d1 * d2];
  return {
    ...fractionAnswer(P, D),
    prompt: `${n1}/${d1} × ${second} = ?`,
    hint: d2 === 1 ? `Multiply the top by ${n2}. The bottom stays ${d1}.` : 'Multiply the tops, then multiply the bottoms. Simplify if you can.',
    explain: withSimplest(d2 === 1 ? `${n1} × ${n2} = ${P}, so the answer is ${P}/${D}` : `${n1} × ${n2} = ${P} and ${d1} × ${d2} = ${D}, so the answer is ${P}/${D}`, P, D),
    method: { kind: 'multiplyFractions', n1, d1, n2, d2 },
  };
};

const multiplyFractions = ({ n1, d1, n2, d2 }) => {
  const [P, D] = [n1 * n2, d1 * d2];
  const whole = d2 === 1;
  const fixed = () => 0.58;
  return {
    name: whole ? 'Groups of a fraction' : 'Multiply tops, multiply bottoms',
    steps: whole
      ? [
        { text: `${n1}/${d1} × ${n2} means ${n2} groups of ${n1}/${d1}.`, visual: bar(n1, d1) },
        { text: `${n2} groups of ${n1} ${n1 === 1 ? SINGULAR[d1] || pieces(d1) : pieces(d1)} is ${n2} × ${n1} = ${P} ${pieces(d1)}: ${P}/${D}.` },
        ...simplifySteps(P, D),
      ]
      : [
        { text: `${n1}/${d1} × ${n2}/${d2} means ${n1}/${d1} of ${n2}/${d2}.`, visual: bar(n2, d2) },
        { text: `Multiply the tops: ${n1} × ${n2} = ${P}. Multiply the bottoms: ${d1} × ${d2} = ${D}.` },
        { text: `So ${n1}/${d1} × ${n2}/${d2} = ${P}/${D}.` },
        ...simplifySteps(P, D),
      ],
    guided: [
      ask(`Tops: ${n1} × ${n2} = ?`, P),
      ...(whole ? [] : [ask(`Bottoms: ${d1} × ${d2} = ?`, D)]),
      finalStep(P, D, fixed, P % D === 0 ? `${P}/${D} = ?` : undefined),
    ],
  };
};

/* ------------------------------------------------------------------ */
/* Divide fractions (Grade 6)                                          */
/* ------------------------------------------------------------------ */

/**
 * 3 ÷ 1/4, 2/3 ÷ 4, 3/4 ÷ 3/8.
 * @param {{maxDen?: number, forms?: ('wholeByUnit'|'fracByWhole'|'fracByFrac')[]}} spec
 */
const fractionDivide = ({ maxDen = 10, forms = ['wholeByUnit', 'fracByWhole', 'fracByFrac'] }, rng) => {
  const form = pick(forms, rng);
  let n1; let d1; let n2; let d2;
  if (form === 'wholeByUnit') {
    [n1, d1] = [randInt(2, 6, rng), 1];
    [n2, d2] = [1, randInt(2, maxDen, rng)];
  } else if (form === 'fracByWhole') {
    d1 = randInt(2, maxDen, rng);
    n1 = properNumerator(d1, rng);
    [n2, d2] = [randInt(2, 6, rng), 1];
  } else {
    d1 = randInt(2, maxDen, rng);
    n1 = properNumerator(d1, rng);
    d2 = drawUntil(() => randInt(2, maxDen, rng), (d) => d !== d1);
    n2 = properNumerator(d2, rng);
  }
  const text = (n, d) => (d === 1 ? String(n) : `${n}/${d}`);
  const [P, D] = [n1 * d2, d1 * n2];
  return {
    ...fractionAnswer(P, D),
    prompt: `${text(n1, d1)} ÷ ${text(n2, d2)} = ?`,
    hint: form === 'wholeByUnit' ? `How many ${pieces(d2)} are in ${n1} wholes?` : `Dividing by ${text(n2, d2)} is the same as multiplying by ${text(d2, n2)}.`,
    explain: D === 1 ? `${text(n1, d1)} × ${text(d2, n2)} = ${P}` : withSimplest(`${text(n1, d1)} × ${text(d2, n2)} = ${P}/${D}`, P, D),
    method: { kind: 'divideFractions', n1, d1, n2, d2 },
  };
};

const divideFractions = ({ n1, d1, n2, d2 }) => {
  const text = (n, d) => (d === 1 ? String(n) : `${n}/${d}`);
  const [P, D] = [n1 * d2, d1 * n2];
  const flip = text(d2, n2);
  const fixed = () => 0.63;
  const flipChoices = [flip, text(n2, d2)];
  const unitCase = d1 === 1 && n2 === 1;
  const steps = [
    ...(unitCase ? [{ text: `How many ${pieces(d2)} are in ${n1} wholes? Each whole has ${d2} ${pieces(d2)}.`, visual: n1 <= 4 ? stack(...Array.from({ length: n1 }, () => bar(d2, d2, { label: '1 whole' }))) : undefined }] : []),
    { text: `Dividing by a number is the same as multiplying by its flip. The flip of ${text(n2, d2)} is ${flip}.` },
    { text: `${text(n1, d1)} ÷ ${text(n2, d2)} = ${text(n1, d1)} × ${flip}.` },
    { text: D === 1 ? `${n1} × ${d2} = ${P}.` : `Multiply the tops: ${n1} × ${d2} = ${P}. Multiply the bottoms: ${d1} × ${n2} = ${D}. That makes ${P}/${D}.` },
    ...simplifySteps(P, D),
  ];
  return {
    name: 'Multiply by the flip',
    steps,
    guided: [
      askChoice(`What is the flip of ${text(n2, d2)}?`, flip, shuffle(flipChoices, fixed)),
      ask(`Tops: ${n1} × ${d2} = ?`, P),
      ...(D === 1 ? [] : [ask(`Bottoms: ${d1} × ${n2} = ?`, D)]),
      ...(D === 1 ? [] : [finalStep(P, D, fixed, P % D === 0 ? `${P}/${D} = ?` : undefined)]),
    ],
  };
};

export const generators = { fractionUnlike, mixedNumbers, fractionOf, fractionMultiply, fractionDivide };
export const methods = { unlikeDenominator, mixedNumber, fractionOfAmount, multiplyFractions, divideFractions };
