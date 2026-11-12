/**
 * Tips & Tricks: short mental-maths strategies, each with a picture-by-picture
 * explanation and a quick drill whose numbers are chosen so the trick really
 * helps (a "+ 9" drill always adds 9, a "× 11" drill always uses a 2-digit number).
 *
 * The ideas are the classic number-sense strategies taught in Singapore-style
 * maths (make ten, doubles, grouping, round and adjust, halve and double…).
 * All names, wording and numbers here are original to this app.
 *
 * Pure and DOM-free. Every question carries its `answer`, and tests check that
 * the steps end on that answer for thousands of random seeds.
 *
 * @typedef {{text: string, visual?: Object}} Step
 * @typedef {{prompt: string, say: string, answer: number, steps: Step[], choices?: number[]}} TrickQuestion
 * @typedef {{id: string, icon: string, title: string, grade: number, idea: string,
 *            make: (rng?: () => number) => TrickQuestion}} Trick
 */

import { randInt, pick, shuffle } from '../core/random.js';
import { addShortcut, mulShortcut, equalBar } from './shortcuts.js';

const fmt = (n) => Number(n).toLocaleString('en-US');
const hops = (start, moves) => ({ kind: 'hops', start, moves });
const bond = (whole, parts) => ({ kind: 'bond', whole, parts });
const frames = (value, extra = 0) => ({ kind: 'tenFrames', value, extra });
const stack = (...items) => ({ kind: 'stack', items: items.filter(Boolean) });

/** Questions in a drill; Kinder gets a shorter set. */
export const DRILL_LENGTH = { young: 5, older: 8 };
/** Gamebest key prefix: trick scores live in rewards.gameBest, so they sync and back up already. */
export const TRICK_GAME_PREFIX = 'trick-';
/** Id of the drill that mixes every trick open to the learner. */
export const MIX_ID = 'mix';

/** Four different whole-number choices around the answer (Kinder taps instead of typing). */
const choicesFor = (answer, rng) => {
  const set = new Set([answer]);
  const max = Math.max(10, answer); // Kinder works within 10: no 11 or 12 as a decoy
  for (const c of shuffle([answer - 2, answer - 1, answer + 1, answer + 2, answer + 3, answer - 3], rng)) {
    if (set.size === 3) break;
    if (c >= 0 && c <= max) set.add(c);
  }
  return shuffle([...set], rng);
};

/** "3 + 6" read as "3 plus 6". */
const sayOf = (prompt) => prompt.replace(/\+/g, 'plus').replace(/−/g, 'minus').replace(/×/g, 'times')
  .replace(/÷/g, 'divided by').replace(/%/g, ' percent').replace(/=/g, 'makes').replace(/\?/g, 'what');

/** Build a question; Kinder questions also get tap choices. */
const question = (prompt, answer, steps, { young = false, rng = Math.random, reveal, say } = {}) => ({
  prompt,
  say: say || (prompt.includes('?') ? `${sayOf(prompt)}?` : `What is ${sayOf(prompt)}?`),
  answer,
  steps,
  // The finished sentence shown after a wrong answer: "7 + 3 = 10", or the given one for word questions.
  reveal: reveal || (prompt.includes('?') ? prompt.replace('?', fmt(answer)) : `${prompt} = ${fmt(answer)}`),
  ...(young ? { choices: choicesFor(answer, rng) } : {}),
});

/** A shortcut from shortcuts.js as drill steps (the same tricks the practice screen offers as "Faster way"). */
const fromShortcut = (prompt, shortcut) => question(prompt, shortcut.answer, [{ text: shortcut.why }, ...shortcut.steps]);

/* ------------------------------------------------------------------ */
/* Kinder 2                                                            */
/* ------------------------------------------------------------------ */

/** 2 + 6: start with the bigger number and count on. */
const bigFirst = (rng = Math.random) => {
  const big = randInt(4, 8, rng);
  const small = randInt(1, Math.min(3, 10 - big), rng);
  const [a, b] = rng() < 0.6 ? [small, big] : [big, small];
  const counts = Array.from({ length: small }, (_, i) => big + i + 1).join(', ');
  return question(`${a} + ${b}`, big + small, [
    { text: `Start with the bigger number, ${big}. Keep it in your head.`, visual: frames(big) },
    { text: `Count on ${small} more: ${counts}.`, visual: frames(big, small) },
    { text: `${a} + ${b} = ${big + small}.` },
  ], { young: true, rng });
};

/** 7 + ? = 10: the numbers that make ten together. */
const tenFriends = (rng = Math.random) => {
  const a = randInt(1, 9, rng);
  const b = 10 - a;
  return question(`${a} + ? = 10`, b, [
    { text: `Put ${a} in a ten frame.`, visual: frames(a) },
    { text: `Count the empty boxes: ${b}.`, visual: frames(a, b) },
    { text: `${a} and ${b} are ten friends. Together they make 10.`, visual: bond(10, [a, b]) },
  ], { young: true, rng });
};

/** 4 + 4: a double is the same number twice. */
const doubles = (rng = Math.random) => {
  const n = randInt(1, 5, rng);
  const emoji = pick(['🍎', '⭐', '🐟', '🌸', '🐤'], rng);
  return question(`${n} + ${n}`, n * 2, [
    { text: `Two rows that are the same: ${n} and ${n}.`, visual: { kind: 'pictureRows', rows: [{ emoji, count: n }, { emoji, count: n }] } },
    { text: `That is a double! ${n} + ${n} = ${n * 2}.`, visual: frames(n, n) },
  ], { young: true, rng });
};

/** 5 + 3: the top row of a ten frame is 5, so 5 and some more is easy to see. */
const fiveAndMore = (rng = Math.random) => {
  const k = randInt(1, 4, rng);
  return question(`5 + ${k}`, 5 + k, [
    { text: 'The top row of a ten frame holds 5.', visual: frames(5) },
    { text: `Put ${k} more on the next row.`, visual: frames(5, k) },
    { text: `5 and ${k} more is ${5 + k}.` },
  ], { young: true, rng });
};

/** ? + 2 = 5: the pairs that make five (one hand). */
const fiveFriends = (rng = Math.random) => {
  const a = randInt(1, 4, rng);
  const b = 5 - a;
  return question(`${a} + ? = 5`, b, [
    { text: `One hand has 5 fingers. Put ${a} on the top row.`, visual: frames(a) },
    { text: `${b} more fill the row of 5.`, visual: frames(a, b) },
    { text: `${a} and ${b} are five friends. Together they make 5.`, visual: bond(5, [a, b]) },
  ], { young: true, rng });
};

/** 1 more than 6, 1 less than 6: just say the next number, or the one before. */
const oneMoreLess = (rng = Math.random) => {
  const more = rng() < 0.5;
  const n = more ? randInt(1, 9, rng) : randInt(2, 10, rng);
  const ans = more ? n + 1 : n - 1;
  return question(`1 ${more ? 'more' : 'less'} than ${n}`, ans, [
    { text: more ? `1 more is the next number when you count. Count: ${n}, ${ans}.` : `1 less is the number just before. Count back: ${n}, ${ans}.`, visual: { kind: 'numberLine', from: 0, to: 10, mark: ans } },
    { text: `1 ${more ? 'more' : 'less'} than ${n} is ${ans}.`, visual: more ? frames(n, 1) : { kind: 'pictureTakeAway', emoji: '⭐', a: n, b: 1 } },
  ], { young: true, rng, reveal: `1 ${more ? 'more' : 'less'} than ${n} is ${ans}` });
};

/** 7 − 2: take away a small number by counting back. */
const countBack = (rng = Math.random) => {
  const a = randInt(4, 10, rng);
  const b = randInt(1, 3, rng);
  const emoji = pick(['🍎', '🐟', '🌸', '🐤', '🍓'], rng);
  const back = Array.from({ length: b }, (_, i) => a - i - 1).join(', ');
  return question(`${a} − ${b}`, a - b, [
    { text: `Start at ${a}. Take away ${b}, so count back ${b}.`, visual: { kind: 'pictures', emoji, count: a } },
    { text: `Count back: ${back}.`, visual: { kind: 'pictureTakeAway', emoji, a, b } },
    { text: `${a} − ${b} = ${a - b}.` },
  ], { young: true, rng });
};

/** 10 − 3: the answer is 3's ten friend. */
const takeFromTen = (rng = Math.random) => {
  const k = randInt(1, 9, rng);
  return question(`10 − ${k}`, 10 - k, [
    { text: 'A full ten frame is 10.', visual: frames(10) },
    { text: `Take ${k} away. ${10 - k} are left.`, visual: frames(10 - k) },
    { text: `${k} and ${10 - k} are ten friends, so 10 − ${k} = ${10 - k}.`, visual: bond(10, [k, 10 - k]) },
  ], { young: true, rng });
};

const TEENS = ['eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];

/** 10 + 4 = 14: a teen number is a ten and some ones. */
const tenAndSome = (rng = Math.random) => {
  const k = randInt(1, 9, rng);
  return question(`10 + ${k}`, 10 + k, [
    { text: `One full ten frame is 10. ${k} more are on the next one.`, visual: frames(10, k) },
    { text: `A ten and ${k} ones make ${10 + k}, ${TEENS[k - 1]}.` },
    { text: `10 + ${k} = ${10 + k}.` },
  ], { young: true, rng });
};

/* ------------------------------------------------------------------ */
/* Grades 1 to 2                                                       */
/* ------------------------------------------------------------------ */

/** 8 + 5: fill the ten first. */
const makeTen = (rng = Math.random) => {
  const big = randInt(7, 9, rng);
  const need = 10 - big;
  const small = randInt(need + 1, 9, rng);
  const rest = small - need;
  const [a, b] = rng() < 0.5 ? [big, small] : [small, big];
  return question(`${a} + ${b}`, big + small, [
    { text: `${big} needs ${need} more to make 10.`, visual: frames(big) },
    { text: `Split ${small} into ${need} and ${rest}.`, visual: bond(small, [need, rest]) },
    { text: `${big} + ${need} = 10, then 10 + ${rest} = ${big + small}.`, visual: frames(10, rest) },
  ]);
};

/** 6 + 7: double the smaller number, then add one more. */
const nearDoubles = (rng = Math.random) => {
  const n = randInt(3, 9, rng);
  const [a, b] = rng() < 0.5 ? [n, n + 1] : [n + 1, n];
  return question(`${a} + ${b}`, 2 * n + 1, [
    { text: `${n + 1} is ${n} and 1 more.`, visual: bond(n + 1, [n, 1]) },
    { text: `Double ${n}: ${n} + ${n} = ${2 * n}.` },
    { text: `Add the 1 more: ${2 * n} + 1 = ${2 * n + 1}.` },
  ]);
};

/** 15 − 8: count up from the smaller number, through 10. */
const countUp = (rng = Math.random) => {
  const b = randInt(6, 9, rng);
  const a = randInt(11, b + 9, rng);
  const toTen = 10 - b;
  const past = a - 10;
  return question(`${a} − ${b}`, a - b, [
    { text: `Think: how far is it from ${b} up to ${a}?` },
    { text: `${b} up to 10 is ${toTen}. 10 up to ${a} is ${past}.`, visual: hops(b, [toTen, past]) },
    { text: `${toTen} + ${past} = ${a - b}, so ${a} − ${b} = ${a - b}.` },
  ]);
};

/** 46 + 9: add 10, then take 1 back. */
const addNine = (rng = Math.random) => {
  const a = randInt(12, 89, rng);
  return question(`${a} + 9`, a + 9, [
    { text: `Adding 10 is easy: ${a} + 10 = ${a + 10}.`, visual: hops(a, [10]) },
    { text: `9 is 1 less than 10, so take 1 back: ${a + 10} − 1 = ${a + 9}.`, visual: hops(a, [10, -1]) },
  ]);
};

/** 17 + 6 + 3 + 4: find the pairs that make tens, then add the tens. */
const groupTens = (rng = Math.random) => {
  const p = randInt(1, 9, rng);
  // A second, different pair (7 and 3 twice would hide the idea).
  const others = Array.from({ length: 9 }, (_, i) => i + 1).filter((n) => n !== p && n !== 10 - p);
  const q = pick(others, rng);
  const x = randInt(0, 2, rng) * 10 + p;  // 7, 17 or 27
  const pairA = [x, 10 - p];
  const pairB = [q, 10 - q];
  const numbers = [pairA[0], pairB[0], pairA[1], pairB[1]]; // partners never side by side
  const sumA = pairA[0] + pairA[1];
  const total = sumA + 10;
  return question(numbers.join(' + '), total, [
    { text: 'Do not add in order. Look for numbers that make a ten together.' },
    { text: `${pairA[0]} + ${pairA[1]} = ${sumA}.`, visual: bond(sumA, pairA) },
    { text: `${pairB[0]} + ${pairB[1]} = 10.`, visual: bond(10, pairB) },
    { text: `${sumA} + 10 = ${total}.` },
  ]);
};

/** 72 − 38: add the same to both numbers so the one you take away is a whole ten. */
const sameDifference = (rng = Math.random) => {
  for (;;) {
    const b = randInt(1, 8, rng) * 10 + randInt(7, 9, rng);
    const a = randInt(b + 3, 99, rng);
    if (a % 10 >= b % 10) continue; // only when the ones would need renaming
    const g = 10 - (b % 10);
    return question(`${a} − ${b}`, a - b, [
      { text: `${b} is ${g} away from ${b + g}. Add ${g} to BOTH numbers. The gap between them stays the same.`, visual: hops(b, [g]) },
      { text: `${a} − ${b} = ${a + g} − ${b + g}.` },
      { text: `Taking away a whole ten is easy: ${a + g} − ${b + g} = ${a - b}.` },
    ]);
  }
};

/* ------------------------------------------------------------------ */
/* Grades 3 to 4                                                       */
/* ------------------------------------------------------------------ */

/** 36 × 5: times 10, then halve. */
const timesFive = (rng = Math.random) => {
  const a = randInt(11, 49, rng);
  return fromShortcut(`${a} × 5`, mulShortcut({ a, b: 5 }));
};

/** 14 × 9: ten groups, then take one group away. */
const timesNine = (rng = Math.random) => {
  let a = randInt(12, 39, rng);
  if (a % 10 === 0) a += 1;
  return fromShortcut(`${a} × 9`, mulShortcut({ a, b: 9 }));
};

/** 23 × 4: double, double (and × 8 is double three times). */
const doubleDouble = (rng = Math.random) => {
  const b = rng() < 0.6 ? 4 : 8;
  const a = b === 4 ? randInt(12, 45, rng) : randInt(11, 25, rng);
  return fromShortcut(`${a} × ${b}`, mulShortcut({ a, b }));
};

/** 365 + 98: add 100, then give back 2. */
const roundAndAdjust = (rng = Math.random) => {
  const b = pick([98, 99, 198, 199, 299, 297, 399], rng);
  const a = randInt(121, 689, rng);
  return fromShortcut(`${fmt(a)} + ${b}`, addShortcut({ a, b }));
};

/** 43 × 11: × 10 plus one more group, which puts the digit sum in the middle. */
const timesEleven = (rng = Math.random) => {
  const a = randInt(12, 99, rng);
  const t = Math.floor(a / 10);
  const o = a % 10;
  const ans = a * 11;
  const middle = t + o;
  const steps = [
    { text: `11 groups is 10 groups and 1 more: ${a} × 11 = ${a} × 10 + ${a}.` },
    { text: `${fmt(a * 10)} + ${a} = ${fmt(ans)}.`, visual: hops(a * 10, [a]) },
    middle < 10
      ? { text: `Spot the pattern: keep ${t} and ${o} on the outside, and put ${t} + ${o} = ${middle} in the middle: ${fmt(ans)}.` }
      : { text: `Spot the pattern: ${t} + ${o} = ${middle} is too big for the middle, so the ${middle % 10} goes in the middle and 1 is carried to the ${t}: ${fmt(ans)}.` },
  ];
  return question(`${a} × 11`, ans, steps);
};

/** 25 × 16: halve one number and double the other until it is easy. */
const halveDouble = (rng = Math.random) => {
  const kind = pick(['five', 'quarter', 'fifty'], rng);
  let a;
  let b;
  if (kind === 'five') { a = 5; b = randInt(6, 24, rng) * 2; }
  else if (kind === 'quarter') { a = 25; b = randInt(3, 12, rng) * 4; }
  else { a = 50; b = randInt(6, 19, rng) * 2; }
  const steps = [{ text: 'Halve one number and double the other. The answer stays the same, and it gets easier each time.' }];
  let x = a;
  let y = b;
  while (x !== 10 && x !== 100) { // 5 -> 10, 25 -> 50 -> 100, 50 -> 100
    steps.push({ text: `Double ${x} and halve ${y}: ${x} × ${y} = ${2 * x} × ${y / 2}.` });
    x *= 2;
    y /= 2;
  }
  steps.push({ text: `${x} × ${y} = ${fmt(x * y)}.` });
  return question(`${a} × ${b}`, a * b, steps);
};

/** 7 × 46: split by place value, multiply each part, add. */
const splitMultiply = (rng = Math.random) => {
  let a = randInt(13, 98, rng);
  if (a % 10 === 0) a += 3;
  const d = randInt(3, 9, rng);
  const tens = a - (a % 10);
  const ones = a % 10;
  return question(`${d} × ${a}`, d * a, [
    { text: `Split ${a} into ${tens} and ${ones}.`, visual: bond(a, [tens, ones]) },
    { text: `${d} × ${tens} = ${d * tens}, and ${d} × ${ones} = ${d * ones}.`, visual: { kind: 'area', cols: [tens, ones], rows: [d], filled: 2 } },
    { text: `Add the parts: ${d * tens} + ${d * ones} = ${d * a}.` },
  ]);
};

/** 135 ÷ 5: double both numbers to make it ÷ 10. */
const divideByFive = (rng = Math.random) => {
  const q = randInt(12, 99, rng);
  const n = q * 5;
  return question(`${n} ÷ 5`, q, [
    { text: 'Doubling both numbers keeps the answer the same, and ÷ 10 is easy.' },
    { text: `Double both: ${n} ÷ 5 = ${n * 2} ÷ 10.` },
    { text: `÷ 10 moves each digit one place to the right: ${n * 2} ÷ 10 = ${q}.` },
  ]);
};

/* ------------------------------------------------------------------ */
/* Grades 5 to 6                                                       */
/* ------------------------------------------------------------------ */

/** 36 × 25: times 100, then share into 4. */
const timesQuarter = (rng = Math.random) => {
  const a = randInt(4, 39, rng) * 2;
  return fromShortcut(`${a} × 25`, mulShortcut({ a, b: 25 }));
};

/** 16% of 50 = 50% of 16: swap the numbers to find an easy percent. */
const percentSwap = (rng = Math.random) => {
  const y = pick([50, 25, 20], rng);
  const step = 100 / y; // x must share evenly
  const x = randInt(1, Math.floor(48 / step), rng) * step;
  const easy = { 50: 'half', 25: 'a quarter', 20: 'a fifth' }[y];
  const ans = (x * y) / 100;
  return question(`${x}% of ${y}`, ans, [
    { text: `${x}% of ${y} means ${x} × ${y} ÷ 100.` },
    { text: `You can multiply in any order, so it is the same as ${y}% of ${x}.` },
    { text: `${y}% is ${easy}, and ${easy} of ${x} is ${ans}.` },
  ]);
};

/** 15% of 340: find 10%, then build the rest from it. */
const fromTenPercent = (rng = Math.random) => {
  const n = randInt(2, 49, rng) * 20;
  const p = pick([5, 15, 20, 30, 35, 45], rng);
  const ten = n / 10;
  const tens = Math.floor(p / 10);
  const five = p % 10 === 5;
  const ans = (n * p) / 100;
  const steps = [{ text: `10% is one tenth: 10% of ${fmt(n)} = ${fmt(ten)}.` }];
  if (tens > 1) steps.push({ text: `${tens * 10}% is ${tens} lots of 10%: ${tens} × ${fmt(ten)} = ${fmt(ten * tens)}.` });
  if (five) steps.push({ text: `5% is half of 10%: ${fmt(ten)} ÷ 2 = ${fmt(ten / 2)}.` });
  if (tens >= 1 && five) steps.push({ text: `${p}% = ${tens * 10}% + 5%: ${fmt(ten * tens)} + ${fmt(ten / 2)} = ${fmt(ans)}.` });
  else steps.push({ text: `So ${p}% of ${fmt(n)} = ${fmt(ans)}.` });
  return question(`${p}% of ${fmt(n)}`, ans, steps);
};

/** 35 × 35: 3 × 4 = 12, then write 25. */
const squareFive = (rng = Math.random) => {
  const t = randInt(1, 9, rng);
  const n = t * 10 + 5;
  const ans = n * n;
  return question(`${n} × ${n}`, ans, [
    { text: `Take the tens digit, ${t}, and the number after it, ${t + 1}. Multiply: ${t} × ${t + 1} = ${t * (t + 1)}.` },
    { text: `Write 25 after it: ${fmt(ans)}.` },
    { text: `Why it works: ${n} × ${n} = ${t * 10} × ${t * 10 + 10} + 5 × 5, which is ${fmt(t * (t + 1) * 100)} + 25.` },
  ]);
};

/** 48 × 0.5: × 0.5 is halving, × 0.25 is a quarter, × 1.5 is the number and its half. */
const timesDecimal = (rng = Math.random) => {
  const kind = pick(['0.5', '0.25', '1.5'], rng);
  if (kind === '0.25') {
    const n = randInt(3, 40, rng) * 4;
    return question(`${n} × 0.25`, n / 4, [
      { text: '0.25 is a quarter, so × 0.25 means a quarter of the number.' },
      { text: `A quarter is half of a half: ${n} ÷ 2 = ${n / 2}, then ${n / 2} ÷ 2 = ${n / 4}.`, visual: equalBar(n, 4, n / 4) },
    ]);
  }
  const n = randInt(6, 60, rng) * 2;
  if (kind === '0.5') {
    return question(`${n} × 0.5`, n / 2, [
      { text: '0.5 is a half, so × 0.5 means half of the number.' },
      { text: `Half of ${n} is ${n / 2}.`, visual: equalBar(n, 2, n / 2) },
    ]);
  }
  return question(`${n} × 1.5`, n * 1.5, [
    { text: '1.5 is 1 and a half, so × 1.5 is the number plus half of it.' },
    { text: `${n} + half of ${n} = ${n} + ${n / 2} = ${n * 1.5}.` },
  ]);
};

/** 7 ÷ 0.5: how many halves fit? Twice as many. ÷ 0.25 is four times as many. */
const divideByPart = (rng = Math.random) => {
  const quarter = rng() < 0.4;
  const n = randInt(3, quarter ? 25 : 45, rng);
  const ans = quarter ? n * 4 : n * 2;
  const part = quarter ? '0.25' : '0.5';
  const each = quarter ? 4 : 2;
  return question(`${n} ÷ ${part}`, ans, [
    { text: `÷ ${part} asks: how many ${quarter ? 'quarters' : 'halves'} fit into ${n}?` },
    { text: `Each 1 holds ${each} ${quarter ? 'quarters' : 'halves'}, so ${n} holds ${n} × ${each}.`, visual: quarter || n > 12 ? null : { kind: 'groups', groups: n, each } },
    { text: `${n} ÷ ${part} = ${ans}. Dividing by a part makes the number bigger!` },
  ]);
};

/** 20% of ? = 30: find 1%, 10% or another easy piece, then build up to 100%. */
const percentWhole = (rng = Math.random) => {
  const p = pick([10, 20, 25, 50], rng);
  const parts = 100 / p;
  const whole = randInt(3, 60, rng) * 10;
  const part = (whole * p) / 100;
  if (!Number.isInteger(part)) return percentWhole(rng);
  return question(`${p}% of ? = ${fmt(part)}`, whole, [
    // The whole is the unknown, so the picture shows "?" over the bar and only the one known part.
    { text: `${p}% is 1 part out of ${parts} equal parts that make 100%.`, visual: {
      kind: 'bar',
      rows: [{ label: '', segments: Array.from({ length: parts }, (_, i) => ({ units: 1, text: i === 0 ? fmt(part) : '' })) }],
      braces: [{ row: 0, from: 0, to: parts, side: 'above', text: '100% = ?' }],
    } },
    { text: `One part is ${fmt(part)}, so all ${parts} parts are ${parts} × ${fmt(part)} = ${fmt(whole)}.` },
    { text: `Check: ${p}% of ${fmt(whole)} is ${fmt(part)}. ✓` },
  ], { say: `${p} percent of what number is ${part}?`, reveal: `${p}% of ${fmt(whole)} = ${fmt(part)}` });
};

/** 60 km/h for 20 minutes: use the part of an hour. */
const speedMinutes = (rng = Math.random) => {
  const speed = pick([30, 48, 60, 72, 90, 120], rng);
  const options = [10, 12, 15, 20, 30, 40, 45].filter((m) => (speed * m) % 60 === 0);
  const minutes = pick(options, rng);
  const km = (speed * minutes) / 60;
  const share = 60 / minutes;
  const steps = Number.isInteger(share)
    ? [
      { text: `${minutes} minutes is 1/${share} of an hour (60 ÷ ${minutes} = ${share}).` },
      { text: `In 1/${share} of an hour you go 1/${share} of ${speed} km: ${speed} ÷ ${share} = ${km} km.` },
    ]
    : [
      { text: `Find 1 minute first: ${speed} km in 60 minutes is ${speed} ÷ 60 = ${fmt(speed / 60)} km each minute.` },
      { text: `${minutes} minutes: ${minutes} × ${fmt(speed / 60)} = ${km} km.` },
    ];
  return question(`${speed} km/h for ${minutes} minutes: how many km?`, km, [
    { text: `${speed} km/h means ${speed} km in 1 hour (60 minutes).` },
    ...steps,
  ], { say: `A car goes ${speed} kilometres per hour for ${minutes} minutes. How many kilometres?`, reveal: `${speed} km/h for ${minutes} minutes is ${km} km` });
};

const gcd = (x, y) => (y ? gcd(y, x % y) : x);

/** Share ₱50 in the ratio 2 : 3: find one unit, then the bigger share. */
const ratioUnits = (rng = Math.random) => {
  const a = randInt(1, 4, rng);
  // b > a and no common factor, so the ratio is already in simplest form (no 2 : 4).
  const bs = [2, 3, 4, 5, 6, 7].filter((n) => n > a && gcd(a, n) === 1);
  const b = pick(bs, rng);
  const unit = randInt(2, 15, rng) * (rng() < 0.5 ? 5 : 2);
  const total = (a + b) * unit;
  const units = a + b;
  return question(`Share ₱${fmt(total)} in the ratio ${a} : ${b}. Bigger share?`, b * unit, [
    { text: `The ratio ${a} : ${b} has ${a} + ${b} = ${units} units.`, visual: {
      kind: 'bar',
      rows: [
        { label: 'A', segments: Array.from({ length: a }, () => ({ units: 1, text: '' })) },
        { label: 'B', segments: Array.from({ length: b }, () => ({ units: 1, text: '' })) },
      ],
      braces: [{ rows: [0, 1], side: 'right', text: `₱${fmt(total)}` }],
    } },
    { text: `1 unit = ₱${fmt(total)} ÷ ${units} = ₱${fmt(unit)}.` },
    { text: `The bigger share is ${b} units: ${b} × ₱${fmt(unit)} = ₱${fmt(b * unit)}.` },
  ], { say: `Share ${total} pesos in the ratio ${a} to ${b}. How much is the bigger share?`, reveal: `${a} : ${b} of ₱${fmt(total)}: the bigger share is ₱${fmt(b * unit)}` });
};

/** 19 × 21: one below and one above a round number. */
const aroundRound = (rng = Math.random) => {
  const n = randInt(2, 9, rng) * 10;
  const d = randInt(1, 3, rng);
  const ans = (n - d) * (n + d);
  return question(`${n - d} × ${n + d}`, ans, [
    { text: `${n - d} and ${n + d} are both ${d} away from ${n}, one below and one above.` },
    { text: `Then the answer is ${n} × ${n} take away ${d} × ${d}: ${fmt(n * n)} − ${d * d} = ${fmt(ans)}.` },
    { text: `Why: ${n - d} × ${n + d} = ${n - d} × ${n} + ${n - d} × ${d}, and ${n} × ${n} = ${n - d} × ${n} + ${d} × ${n}. The two differ by ${d} × ${n} − ${n - d} × ${d} = ${d} × ${d}.` },
  ]);
};

/* ------------------------------------------------------------------ */
/* Catalogue                                                           */
/* ------------------------------------------------------------------ */

/** Every trick, easiest first. `grade` 0 is Kinder 2. */
export const TRICKS = Object.freeze([
  { id: 'big-first', icon: '👆', title: 'Big number first', grade: 0, idea: 'Start with the bigger number and count on.', make: bigFirst },
  { id: 'ten-friends', icon: '🤝', title: 'Ten friends', grade: 0, idea: 'Pairs that make 10, like 7 and 3.', make: tenFriends },
  { id: 'doubles', icon: '👯', title: 'Doubles', grade: 0, idea: 'The same number twice, like 4 + 4.', make: doubles },
  { id: 'five-and-more', icon: '🖐️', title: 'Five and some more', grade: 0, idea: 'See 7 as 5 and 2 on a ten frame.', make: fiveAndMore },
  { id: 'five-friends', icon: '✋', title: 'Five friends', grade: 0, idea: 'Pairs that make 5, like 2 and 3.', make: fiveFriends },
  { id: 'one-more-less', icon: '🔢', title: 'One more, one less', grade: 0, idea: '1 more is the next number. 1 less is the one before.', make: oneMoreLess },
  { id: 'count-back', icon: '⏪', title: 'Count back', grade: 0, idea: '7 − 2: start at 7 and count back 2.', make: countBack },
  { id: 'take-from-ten', icon: '🧮', title: 'Take from 10', grade: 0, idea: '10 − 3 is 3’s ten friend: 7.', make: takeFromTen },
  { id: 'ten-and-some', icon: '🔟', title: 'Ten and some more', grade: 0, idea: '10 + 4 = 14: a ten and 4 ones.', make: tenAndSome },
  { id: 'make-ten', icon: '🔟', title: 'Make a ten', grade: 1, idea: '8 + 5: fill the ten first, then add the rest.', make: makeTen },
  { id: 'near-doubles', icon: '➕', title: 'Doubles plus one', grade: 1, idea: '6 + 7 is double 6, plus 1.', make: nearDoubles },
  { id: 'count-up', icon: '🪜', title: 'Count up to take away', grade: 1, idea: '15 − 8: hop from 8 to 10, then to 15.', make: countUp },
  { id: 'add-nine', icon: '9️⃣', title: 'Add 9 the quick way', grade: 2, idea: 'Add 10, then take 1 back.', make: addNine },
  { id: 'group-tens', icon: '🧺', title: 'Group the tens', grade: 2, idea: 'In a long sum, pair numbers that make tens.', make: groupTens },
  { id: 'same-difference', icon: '↔️', title: 'Same gap', grade: 3, idea: '72 − 38 = 74 − 40: move both numbers.', make: sameDifference },
  { id: 'times-five', icon: '✋', title: 'Times 5', grade: 3, idea: 'Times 10, then halve.', make: timesFive },
  { id: 'times-nine', icon: '🎯', title: 'Times 9', grade: 3, idea: 'Times 10, then take one group away.', make: timesNine },
  { id: 'double-double', icon: '⏩', title: 'Double, double', grade: 3, idea: '× 4 is doubling twice, × 8 three times.', make: doubleDouble },
  { id: 'round-adjust', icon: '🎚️', title: 'Round and adjust', grade: 3, idea: '+ 98 is + 100, then 2 back.', make: roundAndAdjust },
  { id: 'times-eleven', icon: '🪄', title: 'Times 11', grade: 4, idea: '× 10 plus one more group (and a digit pattern).', make: timesEleven },
  { id: 'halve-double', icon: '⚖️', title: 'Halve and double', grade: 4, idea: '25 × 16 = 50 × 8 = 100 × 4.', make: halveDouble },
  { id: 'split-multiply', icon: '✂️', title: 'Split and multiply', grade: 4, idea: '7 × 46 = 7 × 40 + 7 × 6.', make: splitMultiply },
  { id: 'divide-five', icon: '🔀', title: 'Divide by 5', grade: 4, idea: 'Double both numbers, then ÷ 10.', make: divideByFive },
  { id: 'times-quarter', icon: '🪙', title: 'Times 25', grade: 5, idea: '× 100, then share into 4.', make: timesQuarter },
  { id: 'percent-swap', icon: '🔁', title: 'Swap the percent', grade: 5, idea: '16% of 50 = 50% of 16 = 8.', make: percentSwap },
  { id: 'ten-percent', icon: '🧱', title: 'Build from 10%', grade: 5, idea: '15% = 10% + half of 10%.', make: fromTenPercent },
  { id: 'times-decimal', icon: '🌓', title: 'Times 0.5, 0.25, 1.5', grade: 5, idea: '× 0.5 is half, × 0.25 a quarter, × 1.5 one and a half.', make: timesDecimal },
  { id: 'square-five', icon: '🟦', title: 'Squares ending in 5', grade: 6, idea: '35 × 35: 3 × 4 = 12, then 25 → 1,225.', make: squareFive },
  { id: 'around-round', icon: '🎯', title: 'Either side of a ten', grade: 6, idea: '19 × 21 = 20 × 20 − 1 = 399.', make: aroundRound },
  { id: 'divide-part', icon: '🍕', title: 'Divide by 0.5 or 0.25', grade: 6, idea: '7 ÷ 0.5 = 14: how many halves fit?', make: divideByPart },
  { id: 'percent-whole', icon: '🧩', title: 'Find the whole', grade: 6, idea: '20% is 30, so 100% is 5 × 30 = 150.', make: percentWhole },
  { id: 'speed-minutes', icon: '🚗', title: 'Speed in minutes', grade: 6, idea: '60 km/h for 20 min = a third of 60 = 20 km.', make: speedMinutes },
  { id: 'ratio-units', icon: '🍫', title: 'Ratio units', grade: 6, idea: 'Share in 2 : 3: find 1 unit first.', make: ratioUnits },
]);

export const trickById = (id) => TRICKS.find((tr) => tr.id === id) || null;

/** Grade number of a pack level: 'K2' -> 0, 'G4' -> 4. Unknown levels count as Grade 1. */
export const gradeOfLevel = (level) => {
  const m = /^G(\d+)$/i.exec(String(level || ''));
  if (m) return Number(m[1]);
  return /^K/i.test(String(level || '')) ? 0 : 1;
};

/**
 * The tricks for a learner: everything up to their grade, plus the next
 * grade's tricks as a stretch (nothing is locked).
 * @returns {{mine: Trick[], newHere: Trick[], stretch: Trick[]}}
 */
export const tricksForGrade = (grade) => ({
  mine: TRICKS.filter((tr) => tr.grade <= grade),
  newHere: TRICKS.filter((tr) => tr.grade === grade),
  stretch: TRICKS.filter((tr) => tr.grade === grade + 1),
});

/**
 * A whole drill: `count` questions with no prompt twice. A trick with few
 * possible questions (Kinder "doubles" has 5) still gets a full round, and
 * only repeats once every different question has been used.
 * The mix takes turns across tricks, so one trick cannot fill the round.
 * @returns {Array<TrickQuestion & {trickId: string, trickTitle: string}>}
 */
export const drillRound = (trickId, grade, count, rng = Math.random) => {
  const pool = trickId === MIX_ID ? tricksForGrade(grade).mine : [trickById(trickId)].filter(Boolean);
  if (!pool.length) throw new Error('That trick was not found.');
  // Mix: walk through the tricks in a shuffled order, so the round covers as many as it can.
  const order = shuffle(pool, rng);
  const seen = new Set();
  const round = [];
  for (let i = 0; i < count; i += 1) {
    const trick = order[i % order.length];
    let q = trick.make(rng);
    for (let tries = 0; seen.has(q.prompt) && tries < 60; tries += 1) q = trick.make(rng);
    seen.add(q.prompt);
    round.push({ ...q, trickId: trick.id, trickTitle: trick.title });
  }
  return round;
};

/** An example to teach with (the lesson uses the same maker as the drill). */
export const exampleOf = (trickId, rng = Math.random) => {
  const trick = trickById(trickId);
  if (!trick) throw new Error('That trick was not found.');
  return trick.make(rng);
};

/** Stars for a drill: one per answer right without peeking, capped like games. */
export const trickStars = (score) => Math.min(8, Math.max(0, score));
