/**
 * Question generators. A content pack names a generator and its parameters;
 * the generator returns a fresh question each call, so practice never runs
 * out of questions and children cannot memorise answer positions.
 *
 * Every generator is a pure function (params, rng) => Question with no DOM
 * access, so it is unit-tested in Node (see tests/).
 *
 * @typedef {Object} Question
 * @property {'numeric'|'choice'|'fraction'} answerType How the answer is entered.
 * @property {string} prompt Text shown (and read aloud).
 * @property {string|number} answer Correct answer.
 * @property {string[]} [choices] Options for 'choice' questions.
 * @property {Object} [visual] Picture spec rendered by ui/components/visuals.js.
 * @property {Object} [model] Bar model shown on request (word problems).
 * @property {string} [hint] One hint per question.
 * @property {string} [explain] Worked answer shown after a wrong answer.
 * @property {'shape'} [choiceKind] Render choices as pictures instead of text.
 * @property {boolean} [young] Pre-reader question: big tap targets, auto read-aloud.
 */

import { randInt, pick, shuffle } from '../core/random.js';
import { TOPIC_GENERATORS } from './topics/index.js';
import { withArticle } from './topics/shared.js';

/* ------------------------------------------------------------------ */
/* Shared helpers                                                      */
/* ------------------------------------------------------------------ */

const NAMES = ['Ana', 'Ben', 'Mei', 'Raj', 'Lito', 'Siti', 'Jun', 'Maya', 'Carlo', 'Aisha', 'Tomas', 'Lea'];
const ITEMS = [
  { one: 'marble', many: 'marbles' },
  { one: 'sticker', many: 'stickers' },
  { one: 'mango', many: 'mangoes' },
  { one: 'pencil', many: 'pencils' },
  { one: 'card', many: 'cards' },
  { one: 'shell', many: 'shells' },
  { one: 'book', many: 'books' },
  { one: 'egg', many: 'eggs' },
];

const fmt = (n) => n.toLocaleString('en-US');

/** Two different names. */
const twoNames = (rng) => {
  const [a, b] = shuffle(NAMES, rng);
  return [a, b];
};

/** Digits of n from ones upward: 352 -> [2, 5, 3]. */
const digitsOf = (n) => String(n).split('').reverse().map(Number);

/** True if a + b needs a carry in any column. */
const needsCarry = (a, b) => {
  const da = digitsOf(a);
  const db = digitsOf(b);
  for (let i = 0; i < Math.max(da.length, db.length); i += 1) {
    if ((da[i] || 0) + (db[i] || 0) >= 10) return true;
  }
  return false;
};

/** True if a - b (a >= b) needs a borrow in any column. */
const needsBorrow = (a, b) => {
  const da = digitsOf(a);
  const db = digitsOf(b);
  for (let i = 0; i < db.length; i += 1) if ((db[i] || 0) > (da[i] || 0)) return true;
  return false;
};

/**
 * Draw values until `accept` passes. Bounded so a bad parameter set can never
 * hang the app; falls back to the last draw.
 */
const drawUntil = (draw, accept, tries = 200) => {
  let value = draw();
  for (let i = 0; i < tries && !accept(value); i += 1) value = draw();
  return value;
};

const gcd = (a, b) => (b === 0 ? Math.abs(a) : gcd(b, a % b));

/** Build multiple-choice options: the answer plus distinct distractors, shuffled. */
const choicesWith = (answer, distractors, rng, count = 4) => {
  const unique = [...new Set(distractors.map(String).filter((d) => d !== String(answer)))];
  return shuffle([String(answer), ...shuffle(unique, rng).slice(0, count - 1)], rng);
};

/* ------------------------------------------------------------------ */
/* Numbers and place value                                             */
/* ------------------------------------------------------------------ */

/** Count objects in a picture (P1 numbers to 20). */
const count = ({ max = 20 }, rng) => {
  const n = randInt(1, max, rng);
  return {
    answerType: 'numeric',
    prompt: 'How many counters are there?',
    answer: n,
    visual: { kind: 'tenFrames', value: n },
    hint: 'Count the full ten frames first, then the ones left over.',
  };
};

/** Compare two numbers. */
const compare = ({ min = 0, max = 100, ask = 'either' }, rng) => {
  const a = randInt(min, max, rng);
  const b = drawUntil(() => randInt(min, max, rng), (v) => v !== a);
  const greater = ask === 'smaller' ? false : ask === 'greater' ? true : rng() < 0.5;
  const answer = greater ? Math.max(a, b) : Math.min(a, b);
  return {
    answerType: 'choice',
    prompt: `Which number is ${greater ? 'greater' : 'smaller'}?`,
    answer: fmt(answer),
    choices: shuffle([fmt(a), fmt(b)], rng),
    hint: 'Compare the digits from the left. The first place where they differ decides.',
  };
};

/** Place value: value of a digit, or how many tens/hundreds. */
const placeValue = ({ digits = 3 }, rng) => {
  const min = 10 ** (digits - 1);
  const n = randInt(min, 10 ** digits - 1, rng);
  const places = ['ones', 'tens', 'hundreds', 'thousands', 'ten thousands', 'hundred thousands'];
  const placeHint = `Count places from the right: ${places.slice(0, Math.max(3, digits)).join(', ')}.`;
  const ds = digitsOf(n);
  const pos = randInt(0, digits - 1, rng);
  const variant = rng() < 0.5 ? 'value' : 'digit';
  if (variant === 'digit') {
    return {
      answerType: 'numeric',
      prompt: `What digit is in the ${places[pos]} place in ${fmt(n)}?`,
      answer: ds[pos],
      visual: digits <= 3 ? { kind: 'blocks', value: n } : undefined,
      hint: placeHint,
    };
  }
  // "What does the digit 9 stand for?" is only fair if 9 appears once and is not 0.
  // Pick such a digit; if the number has none (e.g. 55,055), ask about a place instead.
  const uniquePositions = ds
    .map((d, i) => i)
    .filter((i) => ds[i] !== 0 && ds.filter((d) => d === ds[i]).length === 1);
  if (!uniquePositions.length) {
    return {
      answerType: 'numeric',
      prompt: `What digit is in the ${places[pos]} place in ${fmt(n)}?`,
      answer: ds[pos],
      visual: digits <= 3 ? { kind: 'blocks', value: n } : undefined,
      hint: placeHint,
    };
  }
  const at = pick(uniquePositions, rng);
  const value = ds[at] * 10 ** at;
  return {
    answerType: 'numeric',
    prompt: `In ${fmt(n)}, the digit ${ds[at]} stands for what value?`,
    answer: value,
    visual: digits <= 3 ? { kind: 'blocks', value: n } : undefined,
    hint: at === 0 ? 'The digit is in the ones place, so it stands for itself.' : `The digit is in the ${places[at]} place, so multiply it by ${fmt(10 ** at)}.`,
    explain: `${ds[at]} ${ds[at] === 1 ? places[at].replace(/s$/, '') : places[at]} = ${fmt(value)}`,
  };
};

/** Number bonds: whole and one part known, find the other part. */
const numberBond = ({ maxWhole = 10, minWhole = 5 }, rng) => {
  const whole = randInt(minWhole, maxWhole, rng);
  const part = randInt(1, whole - 1, rng);
  return {
    answerType: 'numeric',
    prompt: `${whole} is made of ${part} and what number?`,
    answer: whole - part,
    visual: { kind: 'bond', whole, parts: [part, '?'] },
    hint: `Start at ${part} and count on until you reach ${whole}.`,
    explain: `${part} + ${whole - part} = ${whole}`,
    method: { kind: 'bondPart', a: whole, b: part },
  };
};

/* ------------------------------------------------------------------ */
/* Addition and subtraction                                            */
/* ------------------------------------------------------------------ */

/**
 * Addition. `regroup`: true = must carry, false = no carry, omitted = either.
 */
const addition = ({ min = 0, max = 10, maxSum, regroup }, rng) => {
  const [a, b] = drawUntil(
    () => [randInt(min, max, rng), randInt(min, max, rng)],
    ([x, y]) => (maxSum === undefined || x + y <= maxSum) && (regroup === undefined || needsCarry(x, y) === regroup),
  );
  const sum = a + b;
  return {
    answerType: 'numeric',
    prompt: `${fmt(a)} + ${fmt(b)} = ?`,
    answer: sum,
    visual: sum <= 20 ? { kind: 'tenFrames', value: a, extra: b } : undefined,
    hint: ADD_HINTS[additionMethod(a, b).kind],
    explain: `${fmt(a)} + ${fmt(b)} = ${fmt(sum)}`,
    method: additionMethod(a, b),
  };
};

const ADD_HINTS = {
  countOn: 'Start at the bigger number and count on.',
  makeTen: 'Make a ten first, then add what is left.',
  columnAdd: 'Add the ones first, then the tens. Carry if the ones make 10 or more.',
};

/** Which Singapore technique fits an addition: count on, make ten, or column method. */
const additionMethod = (a, b) => {
  if (a + b <= 10) return { kind: 'countOn', a, b };
  if (a <= 9 && b <= 9) return { kind: 'makeTen', a, b };
  if (a + b <= 20) return { kind: 'countOn', a, b }; // 10 + 5, 12 + 6: count on from the bigger
  return { kind: 'columnAdd', a, b };
};

/** Subtraction with a non-negative answer. */
const subtraction = ({ min = 0, max = 10, regroup }, rng) => {
  const [a, b] = drawUntil(
    () => {
      const x = randInt(min, max, rng);
      const y = randInt(min, max, rng);
      return x >= y ? [x, y] : [y, x];
    },
    ([x, y]) => (regroup === undefined || needsBorrow(x, y) === regroup) && !(x === y && max <= 20 && min > 0),
  );
  return {
    answerType: 'numeric',
    prompt: `${fmt(a)} − ${fmt(b)} = ?`,
    answer: a - b,
    hint: a <= 20 ? `Count back ${b} from ${a}, or think: ${b} + ? = ${a}.` : 'Subtract the ones first. If you cannot, rename 1 ten as 10 ones.',
    explain: `${fmt(a)} − ${fmt(b)} = ${fmt(a - b)}`,
    method: a <= 20 ? { kind: 'subtractBond', a, b } : { kind: 'columnSub', a, b },
  };
};

/* ------------------------------------------------------------------ */
/* Multiplication and division                                         */
/* ------------------------------------------------------------------ */

/** Times tables. `tables` lists which tables to use (e.g. [2, 5, 10]). */
const multiplication = ({ tables = [2, 5, 10], maxFactor = 10 }, rng) => {
  const a = pick(tables, rng);
  const b = randInt(1, maxFactor, rng);
  const groupsFirst = rng() < 0.5;
  const [x, y] = groupsFirst ? [b, a] : [a, b];
  return {
    answerType: 'numeric',
    prompt: `${x} × ${y} = ?`,
    answer: a * b,
    visual: a * b <= 40 ? { kind: 'groups', groups: x, each: y } : undefined,
    hint: `Think of ${x} ${x === 1 ? 'group' : 'groups'} of ${y}. Skip-count by ${y}.`,
    explain: `${x} × ${y} = ${a * b}`,
    method: { kind: 'skipCount', groups: x, each: y },
  };
};

/** Exact division from the times tables. */
const division = ({ tables = [2, 5, 10], maxFactor = 10 }, rng) => {
  const divisor = pick(tables, rng);
  const quotient = randInt(1, maxFactor, rng);
  const dividend = divisor * quotient;
  return {
    answerType: 'numeric',
    prompt: `${dividend} ÷ ${divisor} = ?`,
    answer: quotient,
    visual: dividend <= 40 ? { kind: 'groups', groups: quotient, each: divisor, shareView: true } : undefined,
    hint: `Which number times ${divisor} makes ${dividend}?`,
    explain: `${divisor} × ${quotient} = ${dividend}, so ${dividend} ÷ ${divisor} = ${quotient}`,
    method: { kind: 'divideByFact', dividend, divisor },
  };
};

/** Multi-digit multiplication: `digits`-digit number × `by` (1 or 2 digit). */
const multiplyLong = ({ digits = 2, byDigits = 1 }, rng) => {
  const a = randInt(10 ** (digits - 1), 10 ** digits - 1, rng);
  const b = byDigits === 1 ? randInt(2, 9, rng) : randInt(11, 99, rng);
  return {
    answerType: 'numeric',
    prompt: `${fmt(a)} × ${b} = ?`,
    answer: a * b,
    hint: byDigits === 1 ? 'Multiply the ones, then the tens, then the hundreds. Remember to carry.'
      : b % 10 === 0 ? `${b} is ${b / 10} tens. Multiply by ${b / 10}, then by 10.`
        : `Split ${b} into ${Math.floor(b / 10) * 10} and ${b % 10}, multiply each, then add.`,
    explain: `${fmt(a)} × ${b} = ${fmt(a * b)}`,
    method: { kind: 'splitMultiply', a, b },
  };
};

/** Division of a multi-digit number by a 1-digit number, optionally with a remainder. */
const divideLong = ({ digits = 2, remainder = false }, rng) => {
  const divisor = randInt(2, 9, rng);
  const min = 10 ** (digits - 1);
  const max = 10 ** digits - 1;
  const dividend = drawUntil(
    () => randInt(min, max, rng),
    (n) => (remainder ? n % divisor !== 0 : n % divisor === 0),
  );
  const q = Math.floor(dividend / divisor);
  const r = dividend % divisor;
  const askRemainder = remainder && rng() < 0.5;
  return {
    answerType: 'numeric',
    prompt: askRemainder
      ? `${fmt(dividend)} ÷ ${divisor} = ${fmt(q)} remainder ?`
      : remainder ? `${fmt(dividend)} ÷ ${divisor} = ? remainder ${r}` : `${fmt(dividend)} ÷ ${divisor} = ?`,
    answer: askRemainder ? r : q,
    hint: 'Divide the biggest place first. Bring down the next digit and divide again.',
    explain: `${fmt(dividend)} ÷ ${divisor} = ${fmt(q)}${r ? ` remainder ${r}` : ''}`,
    method: { kind: 'longDivide', dividend, divisor, asks: askRemainder ? 'remainder' : 'quotient' },
  };
};

/** Factors and multiples (P4). */
const factorsMultiples = ({ max = 60 }, rng) => {
  if (rng() < 0.5) {
    const n = drawUntil(() => randInt(12, max, rng), (v) => {
      let c = 0;
      for (let i = 2; i < v; i += 1) if (v % i === 0) c += 1;
      return c >= 2;
    });
    const factors = [];
    const others = [];
    for (let i = 2; i < n; i += 1) (n % i === 0 ? factors : others).push(i);
    const answer = pick(factors, rng);
    return {
      answerType: 'choice',
      prompt: `Which number is a factor of ${n}?`,
      answer: String(answer),
      choices: choicesWith(answer, shuffle(others, rng).slice(0, 6), rng),
      hint: `A factor divides ${n} exactly, with no remainder.`,
    };
  }
  const n = randInt(3, 9, rng);
  const answer = n * randInt(3, 12, rng);
  const distractors = [answer + 1, answer - 1, answer + 2, answer - 2].filter((d) => d % n !== 0 && d > 0);
  return {
    answerType: 'choice',
    prompt: `Which number is a multiple of ${n}?`,
    answer: String(answer),
    choices: choicesWith(answer, distractors, rng),
    hint: `Multiples of ${n} are in the ${n} times table: ${n}, ${n * 2}, ${n * 3}, …`,
  };
};

/* ------------------------------------------------------------------ */
/* Fractions and decimals                                              */
/* ------------------------------------------------------------------ */

/** Name the fraction of a shaded shape. */
const fractionOfShape = ({ denominators = [2, 3, 4] }, rng) => {
  const den = pick(denominators, rng);
  const num = randInt(1, den - 1, rng);
  const distractors = [`${den - num}/${den}`, `${num}/${den + 1}`, `${den}/${num}`, `${num + 1}/${den}`].filter((d) => !d.startsWith('0/'));
  return {
    answerType: 'choice',
    prompt: 'What fraction of the shape is shaded?',
    answer: `${num}/${den}`,
    choices: choicesWith(`${num}/${den}`, distractors, rng),
    visual: { kind: 'fraction', numerator: num, denominator: den, shape: rng() < 0.5 ? 'bar' : 'circle' },
    hint: 'Count the equal parts for the bottom number, and the shaded parts for the top number.',
  };
};

/** Equivalent fractions: 1/2 = ?/8. */
const equivalentFraction = ({ maxDen = 12 }, rng) => {
  const den = randInt(2, 6, rng);
  const num = drawUntil(() => randInt(1, den - 1, rng), (n) => gcd(n, den) === 1);
  const factor = drawUntil(() => randInt(2, 4, rng), (f) => den * f <= maxDen);
  return {
    answerType: 'numeric',
    prompt: `${num}/${den} = ?/${den * factor}`,
    answer: num * factor,
    visual: { kind: 'fraction', numerator: num, denominator: den, shape: 'bar' },
    hint: `The bottom was multiplied by ${factor}. Do the same to the top.`,
    explain: `${num} × ${factor} = ${num * factor}, so ${num}/${den} = ${num * factor}/${den * factor}`,
    method: { kind: 'equivalentFraction', num, den, factor },
  };
};

/** Add or subtract fractions with the same denominator. Answer typed as a fraction. */
const fractionSameDen = ({ maxDen = 12 }, rng) => {
  const den = randInt(3, maxDen, rng);
  const a = randInt(1, den - 1, rng);
  const b = randInt(1, den - a, rng);
  const add = rng() < 0.5 || a === b;
  const [x, y] = add ? [a, b] : [Math.max(a, b), Math.min(a, b)];
  const num = add ? x + y : x - y;
  return {
    answerType: 'fraction',
    prompt: `${x}/${den} ${add ? '+' : '−'} ${y}/${den} = ?`,
    answer: `${num}/${den}`,
    hint: 'The parts are the same size, so keep the bottom number and work with the top numbers.',
    explain: `${x} ${add ? '+' : '−'} ${y} = ${num}, so the answer is ${num}/${den} (any equal fraction is accepted).`,
    method: { kind: 'sameDenominator', x, y, den, op: add ? '+' : '−' },
  };
};

/** Decimals to one place: convert tenths, or add/subtract. */
const decimals = ({ max = 10 }, rng) => {
  if (rng() < 0.4) {
    const tenths = randInt(1, 9, rng);
    const whole = randInt(0, 3, rng);
    const value = whole + tenths / 10;
    return {
      answerType: 'numeric',
      prompt: whole ? `Write ${whole} and ${tenths} tenths as a decimal.` : `Write ${tenths} tenths as a decimal.`,
      answer: Number(value.toFixed(1)),
      hint: 'Tenths go in the first place after the decimal point.',
    };
  }
  const a = randInt(1, max * 10, rng) / 10;
  let b = randInt(1, max * 10, rng) / 10;
  const add = rng() < 0.5;
  if (!add && a === b) b = a > 0.1 ? Number((a - 0.1).toFixed(1)) : 0.2; // never 2.3 − 2.3
  const [x, y] = add ? [a, b] : [Math.max(a, b), Math.min(a, b)];
  const result = Number((add ? x + y : x - y).toFixed(1));
  return {
    answerType: 'numeric',
    prompt: `${x.toFixed(1)} ${add ? '+' : '−'} ${y.toFixed(1)} = ?`,
    answer: result,
    hint: 'Line up the decimal points, then add or subtract like whole numbers.',
    explain: `${x.toFixed(1)} ${add ? '+' : '−'} ${y.toFixed(1)} = ${result.toFixed(1)}`,
  };
};

/* ------------------------------------------------------------------ */
/* Word problems with bar models                                       */
/* ------------------------------------------------------------------ */

/**
 * Word problems solved with a bar model. `kinds` picks the model types:
 *  - partWhole: two parts make a whole (add, or subtract to find a part)
 *  - compare:   one quantity is more/less than another
 *  - multiply:  one quantity is n times another (P2+)
 */
const wordProblemBase = ({ kinds = ['partWhole'], max = 20, maxTimes = 5 }, rng) => {
  const kind = pick(kinds, rng);
  const [p, q] = twoNames(rng);
  const item = pick(ITEMS, rng);

  if (kind === 'partWhole') {
    const a = randInt(1, Math.max(1, max - 1), rng);
    const b = randInt(1, Math.max(1, max - a), rng);
    const findTotal = rng() < 0.5;
    if (findTotal) {
      return {
        answerType: 'numeric',
        prompt: `${p} has ${fmt(a)} ${a === 1 ? item.one : item.many}. ${q} has ${fmt(b)} ${b === 1 ? item.one : item.many}. How many ${item.many} do they have altogether?`,
        answer: a + b,
        model: {
          rows: [{ label: '', segments: [{ units: a, text: `${p}: ${fmt(a)}` }, { units: b, text: `${q}: ${fmt(b)}` }] }],
          braces: [{ row: 0, from: 0, to: 2, side: 'above', text: '?' }],
        },
        hint: 'The parts are known and the whole is missing. Add the parts.',
        explain: `${fmt(a)} + ${fmt(b)} = ${fmt(a + b)}`,
        calc: [a, '+', b],
      };
    }
    return {
      answerType: 'numeric',
      prompt: `${p} and ${q} have ${fmt(a + b)} ${item.many} altogether. ${p} has ${fmt(a)}. How many ${item.many} does ${q} have?`,
      answer: b,
      model: {
        rows: [{ label: '', segments: [{ units: a, text: `${p}: ${fmt(a)}` }, { units: b, text: `${q}: ?` }] }],
        braces: [{ row: 0, from: 0, to: 2, side: 'above', text: fmt(a + b) }],
      },
      hint: 'The whole and one part are known. Subtract to find the other part.',
      explain: `${fmt(a + b)} − ${fmt(a)} = ${fmt(b)}`,
      calc: [a + b, '−', a],
    };
  }

  if (kind === 'compare') {
    const small = randInt(1, Math.max(1, Math.floor(max / 2)), rng);
    const diff = randInt(1, Math.max(1, max - small), rng);
    const big = small + diff;
    const variant = pick(['findBig', 'findSmall', 'findDiff'], rng);
    const rows = (bigText, diffText, smallText) => ({
      rows: [
        { label: p, segments: [{ units: small, text: smallText }, { units: diff, text: diffText, dashed: false }] },
        { label: q, segments: [{ units: small, text: '' }] },
      ],
      braces: [
        { row: 0, from: 0, to: 2, side: 'above', text: bigText },
        { row: 1, from: 0, to: 1, side: 'below', text: smallText },
      ],
    });
    if (variant === 'findBig') {
      const m = rows('?', fmt(diff), fmt(small));
      m.rows[0].segments[0].text = '';
      return {
        answerType: 'numeric',
        prompt: `${q} has ${fmt(small)} ${small === 1 ? item.one : item.many}. ${p} has ${fmt(diff)} more ${diff === 1 ? item.one : item.many} than ${q}. How many ${item.many} does ${p} have?`,
        answer: big,
        model: m,
        hint: `${p}'s bar is as long as ${q}'s bar plus ${fmt(diff)} more.`,
        explain: `${fmt(small)} + ${fmt(diff)} = ${fmt(big)}`,
        calc: [small, '+', diff],
      };
    }
    if (variant === 'findSmall') {
      const m = rows(fmt(big), fmt(diff), '?');
      m.rows[0].segments[0].text = '';
      return {
        answerType: 'numeric',
        prompt: `${p} has ${fmt(big)} ${big === 1 ? item.one : item.many}. ${q} has ${fmt(diff)} fewer ${diff === 1 ? item.one : item.many} than ${p}. How many ${item.many} does ${q} have?`,
        answer: small,
        model: m,
        hint: `${q}'s bar is ${p}'s bar with ${fmt(diff)} taken away.`,
        explain: `${fmt(big)} − ${fmt(diff)} = ${fmt(small)}`,
        calc: [big, '−', diff],
      };
    }
    const m = rows(fmt(big), '?', fmt(small));
    m.rows[0].segments[0].text = '';
    return {
      answerType: 'numeric',
      prompt: `${p} has ${fmt(big)} ${big === 1 ? item.one : item.many}. ${q} has ${fmt(small)} ${small === 1 ? item.one : item.many}. How many more ${item.many} does ${p} have than ${q}?`,
      answer: diff,
      model: m,
      hint: 'Line up the two bars. The extra part of the longer bar is the difference.',
      explain: `${fmt(big)} − ${fmt(small)} = ${fmt(diff)}`,
      calc: [big, '−', small],
    };
  }

  // multiply: p has n times as many as q.
  const unit = randInt(2, Math.max(2, Math.floor(max / maxTimes)), rng);
  const times = randInt(2, maxTimes, rng);
  const findTotal = rng() < 0.5;
  const unitSegs = (n, text) => Array.from({ length: n }, (_, i) => ({ units: unit, text: i === 0 ? text : '' }));
  return {
    answerType: 'numeric',
    prompt: findTotal
      ? `${q} has ${fmt(unit)} ${item.many}. ${p} has ${times} times as many ${item.many} as ${q}. How many ${item.many} do they have altogether?`
      : `${q} has ${fmt(unit)} ${item.many}. ${p} has ${times} times as many ${item.many} as ${q}. How many ${item.many} does ${p} have?`,
    answer: findTotal ? unit * (times + 1) : unit * times,
    model: {
      rows: [
        { label: p, segments: unitSegs(times, '') },
        { label: q, segments: unitSegs(1, String(unit)) },
      ],
      braces: findTotal
        ? [{ rows: [0, 1], side: 'right', text: '?' }]
        : [{ row: 0, from: 0, to: times, side: 'above', text: '?' }],
    },
    hint: `Draw 1 unit for ${q} and ${times} equal units for ${p}. Each unit is ${fmt(unit)}.`,
    explain: findTotal
      ? `${times + 1} units × ${unit} = ${unit * (times + 1)}`
      : `${times} units × ${unit} = ${unit * times}`,
    calc: findTotal ? [times + 1, '×', unit] : [times, '×', unit],
    timesAltogether: findTotal ? times : undefined,
  };
};

/** Word problem tagged with the bar-model technique (draw, label, choose operation, calculate). */
const wordProblem = (params, rng) => {
  const { calc, timesAltogether, ...q } = wordProblemBase(params, rng);
  const [a, op, b] = calc;
  return { ...q, method: { kind: 'barModel', model: q.model, op, a, b, answer: q.answer, timesAltogether } };
};

/* ------------------------------------------------------------------ */
/* Kinder: picture-based, tap-to-answer, read aloud                    */
/* ------------------------------------------------------------------ */

// Emoji render offline from the device's own font, so no image files are needed.
const PICTURES = [
  { emoji: '🍎', one: 'apple', many: 'apples' },
  { emoji: '⭐', one: 'star', many: 'stars' },
  { emoji: '🐟', one: 'fish', many: 'fish' },
  { emoji: '🌸', one: 'flower', many: 'flowers' },
  { emoji: '🚗', one: 'car', many: 'cars' },
  { emoji: '🐥', one: 'chick', many: 'chicks' },
  { emoji: '🎈', one: 'balloon', many: 'balloons' },
  { emoji: '🍌', one: 'banana', many: 'bananas' },
];

/** "1 apple", "3 apples". */
const countOf = (n, pic) => `${n} ${n === 1 ? pic.one : pic.many}`;

const SHAPES = ['circle', 'square', 'triangle', 'rectangle', 'star', 'heart'];

/** Number choices near the answer, for tap-to-answer questions. */
const nearbyNumberChoices = (answer, rng, min = 0, max = 20) => {
  const near = [answer - 2, answer - 1, answer + 1, answer + 2, answer + 3].filter((n) => n >= min && n <= max);
  return choicesWith(answer, near, rng, 3);
};

/** Count pictures and tap the number. */
const countPictures = ({ max = 10 }, rng) => {
  const n = randInt(1, max, rng);
  const pic = pick(PICTURES, rng);
  return {
    answerType: 'choice',
    prompt: `How many ${pic.many}?`,
    answer: String(n),
    choices: nearbyNumberChoices(n, rng, 1, max + 2),
    visual: { kind: 'pictures', emoji: pic.emoji, count: n },
    hint: 'Touch each one as you count. Say the numbers out loud.',
    method: { kind: 'tapCount', emoji: pic.emoji, count: n },
    young: true,
  };
};

/** What number comes after / before? */
const numberOrder = ({ max = 20 }, rng) => {
  const after = rng() < 0.6;
  const n = after ? randInt(0, max - 1, rng) : randInt(1, max, rng);
  const answer = after ? n + 1 : n - 1;
  return {
    answerType: 'choice',
    prompt: `What number comes ${after ? 'after' : 'before'} ${n}?`,
    answer: String(answer),
    choices: nearbyNumberChoices(answer, rng, 0, max + 1),
    visual: { kind: 'numberLine', from: Math.max(0, n - 3), to: Math.min(max + 1, n + 3), mark: n },
    hint: after ? `Count up: ${n}, …` : `Count down: ${n}, …`,
    young: true,
  };
};

/** Which group has more (or fewer)? */
const moreOrFewer = ({ max = 10 }, rng) => {
  const a = randInt(1, max, rng);
  const b = drawUntil(() => randInt(1, max, rng), (v) => Math.abs(v - a) >= 1);
  const [picA, picB] = shuffle(PICTURES, rng);
  const more = rng() < 0.5;
  const answerEmoji = (more ? a > b : a < b) ? picA.emoji : picB.emoji;
  return {
    answerType: 'choice',
    prompt: `Are there ${more ? 'more' : 'fewer'} ${picA.many} or ${picB.many}?`,
    answer: answerEmoji,
    spoken: answerEmoji === picA.emoji ? picA.many : picB.many,
    choices: [picA.emoji, picB.emoji],
    visual: { kind: 'pictureRows', rows: [{ emoji: picA.emoji, count: a }, { emoji: picB.emoji, count: b }] },
    hint: 'Match them one to one. The row with some left over has more.',
    young: true,
  };
};

/** Name or find a shape. */
/**
 * A square is also a rectangle, so asking "Tap the rectangle" with a square on
 * screen (or naming a square when "rectangle" is a choice) has two right answers.
 * Never show those two together.
 */
const OVERLAPPING_SHAPES = { square: 'rectangle', rectangle: 'square' };

const shapes = ({ set = SHAPES }, rng) => {
  const answer = pick(set, rng);
  // A square is also a rectangle, so never offer both: drop the overlapping
  // partner of the answer, or (if the answer is neither) one of the pair.
  const excluded = OVERLAPPING_SHAPES[answer] || (rng() < 0.5 ? 'square' : 'rectangle');
  const distractors = set.filter((s) => s !== excluded);
  if (rng() < 0.5) {
    return {
      answerType: 'choice',
      prompt: `Tap the ${answer}.`,
      answer,
      choices: choicesWith(answer, distractors, rng, 3),
      choiceKind: 'shape',
      hint: 'Look at the sides and corners.',
      young: true,
    };
  }
  return {
    answerType: 'choice',
    prompt: 'What shape is this?',
    answer,
    choices: choicesWith(answer, distractors, rng, 3),
    visual: { kind: 'shape', shape: answer },
    hint: 'Count the sides. A circle has no corners.',
    young: true,
  };
};

/** What comes next in the pattern? (AB, AAB, ABC) */
const patterns = ({ kinds = ['AB', 'AAB', 'ABB', 'ABC'] }, rng) => {
  const kind = pick(kinds, rng);
  const letters = [...new Set(kind.split(''))];
  const chosen = shuffle(PICTURES, rng).slice(0, letters.length);
  const pics = chosen.map((p) => p.emoji);
  const map = Object.fromEntries(letters.map((l, i) => [l, pics[i]]));
  const length = kind.length * 2 + randInt(0, kind.length - 1, rng);
  const seq = Array.from({ length: length + 1 }, (_, i) => map[kind[i % kind.length]]);
  const answer = seq.pop();
  return {
    answerType: 'choice',
    prompt: 'What comes next?',
    answer,
    spoken: withArticle(chosen.find((p) => p.emoji === answer).one),
    choices: shuffle(pics.length >= 2 ? pics : [...pics, pick(PICTURES, rng).emoji], rng),
    visual: { kind: 'sequence', items: [...seq, '?'] },
    hint: 'Say the pattern out loud. What repeats?',
    young: true,
  };
};

/** Add two small groups of pictures. */
const addPictures = ({ max = 10 }, rng) => {
  const a = randInt(1, max - 1, rng);
  const b = randInt(1, max - a, rng);
  const pic = pick(PICTURES, rng);
  return {
    answerType: 'choice',
    prompt: `${countOf(a, pic)} and ${b} more. How many ${pic.many} in all?`,
    answer: String(a + b),
    choices: nearbyNumberChoices(a + b, rng, 1, max + 2),
    visual: { kind: 'pictureAdd', emoji: pic.emoji, a, b },
    method: { kind: 'countAll', emoji: pic.emoji, a, b },
    hint: `Start at ${a} and count on ${b} more.`,
    young: true,
  };
};

/** Take away from a group of pictures. */
const takeAwayPictures = ({ max = 10 }, rng) => {
  const a = randInt(2, max, rng);
  const b = randInt(1, a - 1, rng);
  const pic = pick(PICTURES, rng);
  return {
    answerType: 'choice',
    prompt: `There are ${countOf(a, pic)}. ${b} ${b === 1 ? 'goes' : 'go'} away. How many are left?`,
    answer: String(a - b),
    choices: nearbyNumberChoices(a - b, rng, 0, max),
    visual: { kind: 'pictureTakeAway', emoji: pic.emoji, a, b },
    method: { kind: 'takeAwayCount', emoji: pic.emoji, a, b },
    hint: 'Cover the ones that went away and count the rest.',
    young: true,
  };
};

/* ------------------------------------------------------------------ */
/* Registry                                                            */
/* ------------------------------------------------------------------ */

export const GENERATORS = Object.freeze({
  count,
  compare,
  placeValue,
  numberBond,
  addition,
  subtraction,
  multiplication,
  division,
  multiplyLong,
  divideLong,
  factorsMultiples,
  fractionOfShape,
  equivalentFraction,
  fractionSameDen,
  decimals,
  wordProblem,
  countPictures,
  numberOrder,
  moreOrFewer,
  shapes,
  patterns,
  addPictures,
  takeAwayPictures,
  // Measurement, time, money, geometry and graphs (js/engine/topics/).
  ...TOPIC_GENERATORS,
  // { type: 'mixed', of: [specA, specB] }: each question comes from one of the specs.
  mixed: ({ of = [] }, rng) => {
    if (!of.length) throw new Error('A "mixed" generator needs at least one spec in "of".');
    return generate(pick(of, rng), rng);
  },
});

/**
 * Generate one question from a pack's generator spec.
 * @param {{type: string}} spec e.g. { type: 'addition', min: 10, max: 99, regroup: true }
 * @param {() => number} [rng]
 * @returns {Question}
 */
export const generate = (spec, rng = Math.random) => {
  const fn = GENERATORS[spec?.type];
  if (!fn) throw new Error(`Unknown question generator "${spec?.type}"`);
  return fn(spec, rng);
};
