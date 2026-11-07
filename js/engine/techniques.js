/**
 * Singapore-method techniques. Each generator tags its question with a
 * `method` (e.g. { kind: 'makeTen', a: 8, b: 5 }); this module turns that
 * into two things:
 *
 *  - steps:  a worked solution ("Show me how"), one picture per step, so the
 *            technique is SEEN, not just the answer.
 *  - guided: small sub-questions that walk the child through the same
 *            technique ("8 needs ? to make 10"), used by "Try with help".
 *
 * Pure and DOM-free, so every technique is unit-tested against the answer.
 */

import { longDivisionSteps } from './longDivision.js';
import { addShortcut, subShortcut, mulShortcut, divShortcut } from './shortcuts.js';
import { TOPIC_METHODS } from './topics/index.js';

const fmt = (n) => Number(n).toLocaleString('en-US');
const digits = (n) => String(n).split('').reverse().map(Number); // ones first
const PLACE = ['ones', 'tens', 'hundreds', 'thousands', 'ten thousands', 'hundred thousands'];

/** A numeric sub-question. */
const ask = (prompt, answer, visual) => ({ prompt, answer, answerType: 'numeric', visual });

/** "1 hundred", "30 tens": count of a place, by index into PLACE. */
const placeCount = (n, idx) => `${fmt(n)} ${n === 1 ? PLACE[idx].replace(/s$/, '') : PLACE[idx]}`;
const capitalise = (text) => text[0].toUpperCase() + text.slice(1);

/** Two or more pictures shown together. */
const stack = (...items) => ({ kind: 'stack', items: items.filter(Boolean) });

/** Discs are drawn for numbers up to 4 digits; bigger numbers keep the plain layout. */
const discsFit = (...nums) => nums.every((n) => n < 10000);

/* ------------------------------------------------------------------ */
/* Addition and subtraction                                            */
/* ------------------------------------------------------------------ */

/** Make ten: 8 + 5 -> 8 + 2 = 10, 10 + 3 = 13. */
const makeTen = ({ a, b }) => {
  const big = Math.max(a, b);
  const small = Math.min(a, b);
  const need = 10 - big;
  const rest = small - need;
  return {
    name: 'Make ten',
    steps: [
      { text: `Start with the bigger number, ${big}. It needs ${need} more to make 10.`, visual: { kind: 'tenFrames', value: big } },
      { text: `Split ${small} into ${need} and ${rest}.`, visual: { kind: 'bond', whole: small, parts: [need, rest] } },
      { text: `${big} + ${need} = 10. The ten frame is full.`, visual: { kind: 'tenFrames', value: big, extra: need } },
      { text: `10 + ${rest} = ${big + small}.`, visual: { kind: 'tenFrames', value: 10, extra: rest } },
    ],
    guided: [
      ask(`${big} needs how many more to make 10?`, need, { kind: 'tenFrames', value: big }),
      ask(`Split ${small}: ${need} and what?`, rest, { kind: 'bond', whole: small, parts: [need, '?'] }),
      ask(`10 + ${rest} = ?`, big + small, { kind: 'tenFrames', value: 10, extra: rest }),
    ],
  };
};

/** Count on from the bigger number (sums to 10). */
const countOn = ({ a, b }) => {
  const big = Math.max(a, b);
  const small = Math.min(a, b);
  const counts = Array.from({ length: small }, (_, i) => big + i + 1);
  return {
    name: 'Count on',
    steps: [
      { text: `Start at the bigger number: ${big}.`, visual: { kind: 'numberLine', from: Math.max(0, big - 1), to: big + small + 1, mark: big } },
      { text: `Count on ${small}: ${counts.join(', ')}.`, visual: { kind: 'jumps', from: big, step: 1, count: small } },
      { text: `${big} + ${small} = ${big + small}.` },
    ],
    guided: [
      ask(`Start at ${big}. Count on ${small}. Where do you land?`, big + small, { kind: 'jumps', from: big, step: 1, count: small, hideEnd: true }),
    ],
  };
};

/** Column addition with carrying, one place at a time. */
const columnAdd = ({ a, b }) => {
  const da = digits(a);
  const db = digits(b);
  const places = Math.max(da.length, db.length);
  const toNumber = (ds) => (ds.length ? Number(ds.slice().reverse().join('')) : undefined);
  const firstColumn = { kind: 'column', a, b, op: '+', shown: 0, carries: [] };
  const steps = [{
    text: 'Line up the numbers by place value. Start with the ones.',
    visual: discsFit(a, b) ? stack({ kind: 'placeChart', rows: [{ value: a }, { value: b, label: '+' }] }, firstColumn) : firstColumn,
  }];
  const guided = [];
  const carries = [];
  const written = []; // result digits, ones first
  let carry = 0;
  for (let i = 0; i < places; i += 1) {
    const x = da[i] || 0;
    const y = db[i] || 0;
    const sum = x + y + carry;
    // A place only one number has (e.g. the tens of 12 + 6) is not "1 + 0": just bring it down.
    const onlyOne = i >= Math.min(da.length, db.length);
    const parts = onlyOne
      ? (carry ? `${x || y} + 1 carried` : `${x || y}`)
      : (carry ? `${x} + ${y} + 1 carried` : `${x} + ${y}`);
    const place = PLACE[i][0].toUpperCase() + PLACE[i].slice(1);
    if (!onlyOne || carry) {
      guided.push(ask(`Add the ${PLACE[i]}: ${parts} = ?`, sum,
        { kind: 'column', a, b, op: '+', shown: i, carries: carries.slice(), focus: i, result: toNumber(written) }));
    }
    const last = i === places - 1;
    if (sum >= 10 && !last) {
      written.push(sum % 10);
      carries[i + 1] = 1;
      const columnView = { kind: 'column', a, b, op: '+', shown: i + 1, carries: carries.slice(), focus: i, result: toNumber(written) };
      steps.push({
        text: `${place}: ${parts} = ${sum}. That is 10 ${PLACE[i]}${sum % 10 ? ` and ${sum % 10} more` : ''}. Change 10 ${PLACE[i]} for 1 ${PLACE[i + 1].replace(/s$/, '')}: write ${sum % 10}, carry 1.`,
        visual: discsFit(a, b) ? stack({ kind: 'trade', from: 10 ** i, count: 10, into: 10 ** (i + 1) }, columnView) : columnView,
      });
    } else {
      written.push(sum % 10);
      if (sum >= 10) written.push(1);
      const text = onlyOne && !carry ? `${place}: only one number has ${PLACE[i]}. Bring down ${x || y}.` : `${place}: ${parts} = ${sum}.`;
      steps.push({ text, visual: { kind: 'column', a, b, op: '+', shown: i + 1, carries: carries.slice(), focus: i, result: toNumber(written) } });
    }
    carry = sum >= 10 ? 1 : 0;
  }
  steps.push({ text: `${fmt(a)} + ${fmt(b)} = ${fmt(a + b)}.` });
  guided.push(ask(`So ${fmt(a)} + ${fmt(b)} = ?`, a + b, { kind: 'column', a, b, op: '+', shown: places, carries, result: a + b }));
  return { name: 'Column method', steps, guided };
};

/** Column subtraction with renaming (regrouping). */
const columnSub = ({ a, b }) => {
  const da = digits(a);
  const db = digits(b);
  const top = da.slice();
  const firstColumn = { kind: 'column', a, b, op: '−', shown: 0 };
  const steps = [{
    text: `Show ${fmt(a)} with place-value discs. Take away ${fmt(b)}, starting with the ones.`,
    visual: discsFit(a) ? stack({ kind: 'placeChart', rows: [{ value: a }] }, firstColumn) : firstColumn,
  }];
  const guided = [];
  const resultDigits = [];
  const renamed = [];
  for (let i = 0; i < da.length; i += 1) {
    const y = db[i] || 0;
    let note = '';
    let renameFrom = i + 1;
    if (top[i] < y) {
      // Rename 1 from the next place that has something to give.
      let j = i + 1;
      while (top[j] === 0) j += 1;
      top[j] -= 1;
      renameFrom = j; // the picture shows the first trade (e.g. 1 thousand into hundreds)
      for (let k = j - 1; k > i; k -= 1) top[k] = 9;
      top[i] += 10;
      const one = (k) => PLACE[k].replace(/s$/, '');
      note = j === i + 1
        ? `${top[i] - 10} is less than ${y}, so rename 1 ${one(i + 1)} as 10 ${PLACE[i]}. `
        : `${top[i] - 10} is less than ${y}. There are no ${PLACE[i + 1]} to rename, so rename 1 ${one(j)} first, then 1 ${one(i + 1)} as 10 ${PLACE[i]}. `;
      renamed.push(i);
    }
    const diff = top[i] - y;
    resultDigits.push(diff);
    const resultSoFar = Number(resultDigits.slice().reverse().join(''));
    const columnView = { kind: 'column', a, b, op: '−', shown: i + 1, focus: i, top: top.slice(), result: resultSoFar };
    const renamedHere = renamed[renamed.length - 1] === i;
    steps.push({
      text: i >= db.length && !note
        ? (top[i] === 0 && i === da.length - 1
          ? `${PLACE[i][0].toUpperCase() + PLACE[i].slice(1)}: the ${PLACE[i].replace(/s$/, '')} was renamed, so there are none left.`
          : `${PLACE[i][0].toUpperCase() + PLACE[i].slice(1)}: nothing to take away, so write ${top[i]}.`)
        : `${note}${PLACE[i][0].toUpperCase() + PLACE[i].slice(1)}: ${top[i]} − ${y} = ${diff}.`,
      visual: renamedHere && discsFit(a) ? stack({ kind: 'trade', from: 10 ** renameFrom, count: 1 }, columnView) : columnView,
    });
    const onlyTop = i >= db.length && !note;
    if (onlyTop && top[i] === 0 && i === da.length - 1) continue; // nothing left in the last place: no question
    guided.push(ask(onlyTop
      ? `${PLACE[i][0].toUpperCase() + PLACE[i].slice(1)}: nothing to take away. What do you write?`
      : `${note}${PLACE[i][0].toUpperCase() + PLACE[i].slice(1)}: ${top[i]} − ${y} = ?`, diff, { kind: 'column', a, b, op: '−', shown: i, focus: i, top: top.slice(), result: i ? Number(resultDigits.slice(0, i).reverse().join('')) : undefined }));
  }
  steps.push({ text: `${fmt(a)} − ${fmt(b)} = ${fmt(a - b)}.` });
  guided.push(ask(`So ${fmt(a)} − ${fmt(b)} = ?`, a - b));
  return { name: renamed.length ? 'Column method with renaming' : 'Column method', steps, guided };
};

/** Small subtraction: count back a few, or think of the part-whole bond. */
const subtractBond = ({ a, b }) => {
  if (b === 0) {
    return {
      name: 'Take away nothing',
      steps: [
        { text: `Take away 0 means take nothing away.`, visual: { kind: 'bond', whole: a, parts: [0, '?'] } },
        { text: `${a} − 0 = ${a}. The number stays the same.` },
      ],
      guided: [ask(`${a} − 0 = ?`, a)],
    };
  }
  if (b <= 3 || b < a - b) {
    // 20 − 2: two hops back is quicker than counting on 18.
    const counts = Array.from({ length: b }, (_, i) => a - i - 1);
    const back = (shown) => ({ kind: 'hops', start: a, moves: Array.from({ length: shown }, () => -1) });
    return {
      name: 'Count back',
      steps: [
        { text: `Start at ${a}. Take away ${b} by counting back ${b}.`, visual: back(0) },
        { text: `Count back: ${counts.join(', ')}.`, visual: back(b) },
        { text: `${a} − ${b} = ${a - b}.`, visual: back(b) },
      ],
      guided: [ask(`Start at ${a}. Count back ${b}. Where do you land?`, a - b, back(0))],
    };
  }
  return subtractByBond({ a, b });
};

/** Think: b + ? = a, and count on (when the part taken away is big). */
const subtractByBond = ({ a, b }) => ({
  name: 'Number bond',
  steps: [
    { text: `${a} is the whole. ${b} is one part.`, visual: { kind: 'bond', whole: a, parts: [b, '?'] } },
    { text: `Think: ${b} + ? = ${a}. Count on from ${b} to ${a}.`, visual: { kind: 'jumps', from: b, step: 1, count: a - b } },
    { text: `${a} − ${b} = ${a - b}.`, visual: { kind: 'bond', whole: a, parts: [b, a - b] } },
  ],
  guided: [
    ask(`${b} + ? = ${a}`, a - b, { kind: 'bond', whole: a, parts: [b, '?'] }),
  ],
});

/* ------------------------------------------------------------------ */
/* Multiplication and division                                         */
/* ------------------------------------------------------------------ */

/** Skip counting for times tables. */
const skipCount = ({ groups, each }) => {
  const counts = Array.from({ length: groups }, (_, i) => each * (i + 1));
  if (groups === 1) {
    return {
      name: 'One group',
      steps: [
        { text: `1 × ${each} means 1 group of ${each}.`, visual: { kind: 'groups', groups: 1, each } },
        { text: `One group of ${each} is just ${each}. So 1 × ${each} = ${each}.` },
      ],
      guided: [ask(`1 group of ${each} is how many?`, each, { kind: 'groups', groups: 1, each })],
    };
  }
  return {
    name: 'Skip counting',
    steps: [
      { text: `${groups} × ${each} means ${groups} groups of ${each}.`, visual: groups * each <= 40 ? { kind: 'groups', groups, each } : undefined },
      { text: `Skip-count by ${each}, ${groups} times: ${counts.join(', ')}.`, visual: { kind: 'jumps', from: 0, step: each, count: groups } },
      { text: `${groups} × ${each} = ${groups * each}.` },
    ],
    guided: groups >= 3
      ? [
        ask(`Skip-count by ${each}: ${counts.slice(0, 2).join(', ')}, … What is the ${groups === 3 ? 'next' : `${ordinal(groups)}`} number?`, groups * each, { kind: 'jumps', from: 0, step: each, count: groups, hideEnd: true }),
      ]
      : [ask(`${each} + ${each} = ?`, groups * each, { kind: 'groups', groups, each })],
  };
};

const ordinal = (n) => `${n}${n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th'}`;

/** Division as the inverse of multiplication. */
const divideByFact = ({ dividend, divisor }) => {
  const q = dividend / divisor;
  return {
    name: 'Think multiplication',
    steps: [
      { text: `${dividend} ÷ ${divisor} asks: how many groups of ${divisor} make ${dividend}?`, visual: dividend <= 40 ? { kind: 'groups', groups: q, each: divisor } : undefined },
      { text: `Skip-count by ${divisor} until you reach ${dividend}.`, visual: { kind: 'jumps', from: 0, step: divisor, count: q } },
      { text: `${q} jumps, so ${dividend} ÷ ${divisor} = ${q}.` },
    ],
    guided: [ask(`? × ${divisor} = ${dividend}`, q, { kind: 'jumps', from: 0, step: divisor, count: q, hideEnd: false, hideCount: true })],
  };
};

/** Split the number by place value and multiply each part (area model). */
const splitMultiply = ({ a, b }) => {
  if (b >= 10 && b < 100 && b % 10 === 0) return multiplyByTens({ a, b });
  if (b >= 10) {
    // 2-digit multiplier: a × tens + a × ones.
    const tens = Math.floor(b / 10) * 10;
    const ones = b % 10;
    const area = (filled, focus) => ({ kind: 'area', cols: [a], rows: [tens, ones].filter(Boolean), filled, focus });
    return {
      name: 'Split and multiply',
      steps: [
        { text: `Split ${b} into ${tens} and ${ones}. Draw a box for each part.`, visual: stack({ kind: 'bond', whole: b, parts: [tens, ones] }, area(0)) },
        { text: `Top box: ${fmt(a)} × ${tens} = ${fmt(a * tens)}.`, visual: area(1, 0) },
        ...(ones ? [{ text: `Bottom box: ${fmt(a)} × ${ones} = ${fmt(a * ones)}.`, visual: area(2, 1) }] : []),
        { text: `Add the boxes: ${fmt(a * tens)} + ${fmt(a * ones)} = ${fmt(a * b)}.`, visual: area(2) },
      ],
      guided: [
        ask(`${fmt(a)} × ${tens} = ?`, a * tens, area(0, 0)),
        ...(ones ? [ask(`${fmt(a)} × ${ones} = ?`, a * ones, area(1, 1))] : []),
        ask(`${fmt(a * tens)} + ${fmt(a * ones)} = ?`, a * b, area(2)),
      ],
    };
  }
  const n = String(a).length;
  const parts = digits(a)
    .map((d, i) => ({ d, i, value: d * 10 ** i }))
    .filter((p) => p.d)
    .reverse(); // biggest place first
  const cols = parts.map((p) => p.value);
  const area = (filled, focus) => ({ kind: 'area', cols, rows: [b], filled, focus });
  if (parts.length === 1) {
    const [p] = parts;
    return {
      name: 'Multiply the place',
      steps: [
        { text: `${fmt(a)} is ${placeCount(p.d, p.i)}. Multiply the ${PLACE[p.i]} by ${b}.`, visual: stack(discsFit(a) && { kind: 'placeChart', rows: [{ value: a }] }, area(0)) },
        { text: `${b} groups of ${placeCount(p.d, p.i)} = ${placeCount(p.d * b, p.i)} = ${fmt(a * b)}.`, visual: stack(p.i < 4 && { kind: 'share', groups: b, each: [{ place: 10 ** p.i, n: p.d }], focus: 10 ** p.i }, area(1, 0)) },
      ],
      guided: [
        ask(`${p.d} × ${b} = ? (${PLACE[p.i]})`, p.d * b, area(0, 0)),
        ask(`So ${fmt(a)} × ${b} = ?`, a * b, area(1)),
      ],
    };
  }
  return {
    name: 'Split by place value',
    steps: [
      {
        text: `Split ${fmt(a)} by place value: ${cols.map(fmt).join(' + ')}. Multiply each part by ${b}.`,
        visual: stack(discsFit(a) && { kind: 'placeChart', rows: [{ value: a }] }, area(0)),
      },
      ...parts.map((p, k) => ({
        text: `${capitalise(PLACE[p.i])}: ${b} groups of ${placeCount(p.d, p.i)} = ${placeCount(p.d * b, p.i)} = ${fmt(p.value * b)}.`,
        visual: stack(p.i < 4 && { kind: 'share', groups: b, each: [{ place: 10 ** p.i, n: p.d }], focus: 10 ** p.i }, area(k + 1, k)),
      })),
      { text: `Add the parts: ${parts.map((p) => fmt(p.value * b)).join(' + ')} = ${fmt(a * b)}.`, visual: area(parts.length) },
    ],
    guided: [
      ...parts.map((p, k) => ask(`${fmt(p.value)} × ${b} = ?`, p.value * b, area(k, k))),
      ask(`${parts.map((p) => fmt(p.value * b)).join(' + ')} = ?`, a * b, area(parts.length)),
    ],
  };
};

/**
 * a × (k tens), e.g. 745 × 40: multiply by k first, then by 10 as a
 * place-value shift. Splitting 40 into "40 and 0" would teach nothing.
 */
const multiplyByTens = ({ a, b }) => {
  const k = b / 10;
  const partial = a * k;
  const shift = { kind: 'shift', value: partial };
  // Reuse the 1-digit method for a × k so both methods always match.
  const inner = k > 1 ? splitMultiply({ a, b: k }) : null;
  return {
    name: 'Multiply by tens',
    steps: [
      { text: `${b} is ${k} ten${k === 1 ? '' : 's'}, so ${fmt(a)} × ${b} = ${fmt(a)} × ${k} × 10. First find ${fmt(a)} × ${k}, then multiply by 10.`, visual: { kind: 'placeChart', rows: [{ value: b }] } },
      ...(inner ? inner.steps.map((s, i) => (i === inner.steps.length - 1 ? { ...s, text: `${s.text} So ${fmt(a)} × ${k} = ${fmt(partial)}.` } : s)) : []),
      { text: `Now multiply by 10: ${fmt(partial)} × 10 = ${fmt(a * b)}. Each digit moves one place to the left and a 0 goes in the ones place.`, visual: shift },
    ],
    guided: [
      ...(inner ? inner.guided : []),
      ask(`${fmt(partial)} × 10 = ?`, a * b, { kind: 'shift', value: partial, hideResult: true }),
    ],
  };
};

/**
 * Long division by sharing place-value discs, biggest place first.
 *
 * Every place follows the full written routine, in two steps:
 *   1. Divide:   (bring down the next digit,) share, write the digit on top.
 *   2. Multiply and subtract: digit × divisor, write it under, subtract to
 *      find what is left, and change what is left into the next place.
 * Then a final check: quotient × divisor (+ remainder) = dividend.
 * Each step shows the discs AND the written layout at that exact moment,
 * so the child sees why each number goes where it does.
 */
const longDivide = ({ dividend, divisor, asks }) => {
  const plan = longDivisionSteps(dividend, divisor);
  const n = plan.length;
  const q = Math.floor(dividend / divisor);
  const r = dividend % divisor;
  const digitsText = String(dividend);
  // Discs only while the picture stays readable (up to 9 groups, 4-digit numbers).
  const pictures = discsFit(dividend) && divisor <= 9;
  /** Written layout: places before `upto` are done; `phase: 'divide'` hides the focus place's subtraction. */
  const layout = (upto, focus, phase) => ({ kind: 'longDivision', dividend, divisor, upto, focus, phase });
  const each = []; // what one group has so far, by place
  const steps = [{
    text: pictures
      ? `Show ${fmt(dividend)} with place-value discs. Share them into ${divisor} equal groups. Start with the biggest place.`
      : `Write ${fmt(dividend)} ÷ ${divisor} as long division. Share into ${divisor} equal groups, one place at a time. Start with the biggest place.`,
    visual: stack(pictures && { kind: 'placeChart', rows: [{ value: dividend }] }, layout(0)),
  }];
  const guided = [];

  plan.forEach((s, k) => {
    const idx = n - 1 - s.i;              // index into PLACE
    const place = 10 ** idx;
    const last = s.i === n - 1;
    const name = capitalise(PLACE[idx]);
    const prev = plan[k - 1];
    const lower = PLACE[idx - 1];
    const changeText = s.rem && !last
      ? ` Change ${s.rem === 1 ? 'it' : 'them'} into ${lower}: ${placeCount(s.rem, idx)} = ${placeCount(s.rem * 10, idx - 1)}.`
      : '';

    // A leading place too small to share: nothing is written; it joins the next place.
    if (s.lead) {
      steps.push({
        text: `${name}: ${placeCount(s.cur, idx)} ${s.cur === 1 ? 'is' : 'are'} not enough to give each of the ${divisor} groups one, so nothing goes on top yet.${changeText}`,
        visual: stack(pictures && s.cur > 0 && { kind: 'trade', from: place, count: s.cur }, layout(k, undefined)),
      });
      return;
    }

    // 1. Divide (after bringing down this digit, unless it is the first place worked).
    const carriedIn = prev ? prev.rem * 10 : 0;
    let lookAt;
    if (!prev) lookAt = `${name}: share ${placeCount(s.cur, idx)}`;
    else if (prev.lead) {
      const sum = s.digit ? `${placeCount(carriedIn, idx)} + ${placeCount(s.digit, idx)} = ${placeCount(s.cur, idx)}` : `that makes ${placeCount(s.cur, idx)}`;
      lookAt = `${name}: ${sum}. On paper, use the first ${k + 1} digits: ${fmt(s.cur)}. Share them`;
    } else if (carriedIn) {
      const now = s.digit ? `${fmt(carriedIn)} + ${s.digit} = ${placeCount(s.cur, idx)}` : placeCount(s.cur, idx);
      lookAt = `${name}: bring down the ${s.digit} next to the ${prev.rem}. Now there are ${now}. Share them`;
    } else if (s.cur === 0) {
      // Nothing at all in this place: write 0 and move on (no 0 × d = 0).
      steps.push({
        text: `${name}: bring down the 0. There are no ${PLACE[idx]} to share, so write 0 on top.${last ? ' Nothing is left over.' : ''}`,
        visual: layout(k + 1, k),
      });
      guided.push(ask(`${name}: bring down the 0. There are no ${PLACE[idx]} to share. How many ${PLACE[idx]} in each group?`, 0, layout(k, k)));
      return;
    }
    else lookAt = `${name}: bring down the ${s.digit}. Now there ${s.cur === 1 ? 'is' : 'are'} ${placeCount(s.cur, idx)}. Share ${s.cur === 1 ? 'it' : 'them'}`;
    const divideText = s.q === 0
      ? `${lookAt.replace(/\. Share (them|it)$/, '.').replace(/: share (.*)$/, ': $1.')} That is not enough to give each of the ${divisor} groups one. Write 0 on top.`
      : `${lookAt} into ${divisor} groups. Each group gets ${s.q}. Write ${s.q} on top.`;
    if (s.q) each.push({ place, n: s.q });
    steps.push({
      text: divideText,
      visual: stack(pictures && s.q > 0 && { kind: 'share', groups: divisor, each: each.slice(), focus: place }, layout(k + 1, k, 'divide')),
    });

    // 2. Multiply and subtract.
    const leftText = last
      ? (s.rem ? ` There are no more digits to bring down, so ${s.rem} is the remainder.` : ' Nothing is left over.')
      : (s.rem ? ` ${placeCount(s.rem, idx)} ${s.rem === 1 ? 'is' : 'are'} left over.${changeText}` : ` No ${PLACE[idx]} are left over.`);
    const picture = !pictures ? null
      : s.rem && !last ? { kind: 'trade', from: place, count: s.rem }
        : s.rem && last ? { kind: 'share', groups: divisor, each: each.slice(), focus: place, left: { place, count: s.rem } }
          : null;
    steps.push({
      text: `Multiply: ${s.q} × ${divisor} = ${fmt(s.product)}. Write ${fmt(s.product)} under ${fmt(s.cur)}. Subtract: ${fmt(s.cur)} − ${fmt(s.product)} = ${fmt(s.rem)}.${leftText}`,
      visual: stack(picture, layout(k + 1, k)),
    });

    // Guided: the same routine, one small question at a time.
    const bring = prev && !prev.lead ? `Bring down the ${s.digit}: ${placeCount(s.cur, idx)}. ` : '';
    guided.push(ask(`${bring}${name}: share ${placeCount(s.cur, idx)} into ${divisor} groups. How many ${PLACE[idx]} in each group?`, s.q, layout(k, k)));
    if (s.q) {
      guided.push(ask(`Multiply: ${s.q} × ${divisor} = ?`, s.product, layout(k + 1, k, 'divide')));
      guided.push(ask(`Subtract: ${fmt(s.cur)} − ${fmt(s.product)} = ?`, s.rem, layout(k + 1, k, 'divide')));
    }
  });

  const back = q * divisor;
  const check = r
    ? `Check by multiplying back: ${fmt(q)} × ${divisor} = ${fmt(back)}, and ${fmt(back)} + ${r} = ${fmt(dividend)}. It matches!`
    : `Check by multiplying back: ${fmt(q)} × ${divisor} = ${fmt(dividend)}. It matches!`;
  const bar = !r && divisor <= 9 && {
    kind: 'bar',
    rows: [{ segments: Array.from({ length: divisor }, () => ({ units: 1, text: '' })) }],
    braces: [
      { row: 0, from: 0, to: divisor, side: 'above', text: fmt(dividend) },
      { row: 0, from: 0, to: 1, side: 'below', text: fmt(q) },
    ],
  };
  steps.push({
    text: `Each group gets ${fmt(q)}. So ${fmt(dividend)} ÷ ${divisor} = ${fmt(q)}${r ? ` remainder ${r}` : ''}. ${check}`,
    visual: stack(bar, layout(n)),
  });
  guided.push(ask(`So ${fmt(dividend)} ÷ ${divisor} = ?${r ? ' (the number on top)' : ''}`, q, layout(n)));
  // "= ? remainder 4" already gives the remainder, so it is not asked again.
  if (r && asks !== 'quotient') guided.push(ask('What is left over? (the remainder)', r, layout(n)));
  return { name: 'Long division', steps, guided };
};

/* ------------------------------------------------------------------ */
/* Fractions                                                           */
/* ------------------------------------------------------------------ */

const fractionBar = (numerator, denominator, extra = {}) => ({ kind: 'fraction', numerator, denominator, shape: 'bar', label: `${numerator}/${denominator}`, ...extra });

const equivalentFraction = ({ num, den, factor }) => {
  const before = fractionBar(num, den);
  const after = fractionBar(num * factor, den * factor);
  return {
    name: 'Multiply top and bottom',
    steps: [
      { text: `Shade ${num}/${den} of a bar.`, visual: before },
      { text: `Cut every part into ${factor}. Now there are ${den} × ${factor} = ${den * factor} parts.`, visual: { kind: 'stack', column: true, items: [before, { ...after, label: `${den * factor} parts` }] } },
      { text: `The shaded amount did not change. It is now ${num} × ${factor} = ${num * factor} parts. So ${num}/${den} = ${num * factor}/${den * factor}.`, visual: { kind: 'stack', column: true, items: [before, after] } },
    ],
    guided: [
      ask(`${den} × ? = ${den * factor}`, factor, { kind: 'stack', column: true, items: [before, { ...after, numerator: 0, label: `${den * factor} parts` }] }),
      ask(`Multiply the top by ${factor} too: ${num} × ${factor} = ?`, num * factor, { kind: 'stack', column: true, items: [before, { ...after, label: '?' }] }),
    ],
  };
};

const FRACTION_PLURALS = { 2: 'halves', 3: 'thirds', 4: 'fourths', 5: 'fifths', 6: 'sixths', 7: 'sevenths', 8: 'eighths', 9: 'ninths', 10: 'tenths', 11: 'elevenths', 12: 'twelfths' };
const fractionName = (den) => FRACTION_PLURALS[den] || `${den}ths`;
const partsOf = (n) => `${n} ${n === 1 ? 'part' : 'parts'}`;

const sameDenominator = ({ x, y, den, op }) => {
  const add = op === '+';
  const num = add ? x + y : x - y;
  const result = add
    ? fractionBar(x, den, { extra: y, label: `${x}/${den} + ${y}/${den} = ${num}/${den}` })
    : fractionBar(x, den, { crossed: y, label: `${x}/${den} − ${y}/${den} = ${num}/${den}` });
  return {
    name: 'Same-size parts',
    steps: [
      {
        text: `Both fractions are cut into ${den} same-size parts.`,
        visual: add
          ? { kind: 'stack', column: true, items: [fractionBar(x, den), fractionBar(y, den)] }
          : fractionBar(x, den),
      },
      {
        text: add
          ? `Put the parts together: ${x} + ${y} = ${partsOf(num)}. The parts are still ${fractionName(den)}.`
          : `Take away ${partsOf(y)}: ${x} − ${y} = ${partsOf(num)}. The parts are still ${fractionName(den)}.`,
        visual: result,
      },
      { text: num === den ? `The answer is ${num}/${den}. That is 1 whole.` : `The answer is ${num}/${den}.`, visual: fractionBar(num, den) },
    ],
    guided: [ask(`${x} ${add ? '+' : '−'} ${y} = ? (the top number)`, num, { ...result, label: `? / ${den}` })],
  };
};

/* ------------------------------------------------------------------ */
/* Word problems                                                       */
/* ------------------------------------------------------------------ */

const OPS = ['+', '−', '×', '÷'];

/**
 * Bar model technique: 1) draw the bars, 2) mark what is unknown,
 * 3) choose the operation, 4) calculate.
 * method: { model, op, a, b, answer, sentence }
 */
const barModel = ({ model, op, a, b, answer, timesAltogether }) => {
  const known = { rows: model.rows.map((r) => ({ ...r })), braces: [] };
  const opWord = { '+': 'add', '−': 'subtract', '×': 'multiply', '÷': 'divide' }[op];
  return {
    name: 'Bar model',
    steps: [
      { text: 'Read the problem. Draw a bar for each person or thing.', visual: { kind: 'bar', ...known } },
      { text: 'Label what you know, and put ? on what you must find.', visual: { kind: 'bar', ...model } },
      ...(timesAltogether ? [{ text: `Count the equal units: 1 unit and ${timesAltogether} units make 1 + ${timesAltogether} = ${timesAltogether + 1} units.`, visual: { kind: 'bar', ...model } }] : []),
      { text: `The model shows we must ${opWord}: ${fmt(a)} ${op} ${fmt(b)}.` },
      { text: `${fmt(a)} ${op} ${fmt(b)} = ${fmt(answer)}.` },
    ],
    guided: [
      ...(timesAltogether ? [ask(`1 + ${timesAltogether} = ? units`, timesAltogether + 1, { kind: 'bar', ...model })] : []),
      { prompt: 'Look at the bar model. Which operation finds the ?', answer: op, answerType: 'choice', choices: OPS, visual: { kind: 'bar', ...model } },
      ask(`${fmt(a)} ${op} ${fmt(b)} = ?`, answer, { kind: 'bar', ...model }),
    ],
  };
};

/* ------------------------------------------------------------------ */
/* Kinder                                                              */
/* ------------------------------------------------------------------ */

/** Count by tapping each picture. */
const tapCount = ({ emoji, count }) => ({
  name: 'Touch and count',
  steps: [
    { text: 'Touch each one and say a number. The last number you say is how many.', visual: { kind: 'pictures', emoji, count } },
    { text: count === 1 ? 'There is 1.' : `There are ${count}.` },
  ],
  guided: [{ prompt: 'Tap each one to count it.', answer: count, answerType: 'tapCount', emoji, count }],
});

/** Add two groups by counting them all. */
const countAll = ({ emoji, a, b }) => ({
  name: 'Count them all',
  steps: [
    { text: `${a} and ${b} more. Put them together.`, visual: { kind: 'pictureAdd', emoji, a, b } },
    { text: `Count them all: ${Array.from({ length: a + b }, (_, i) => i + 1).join(', ')}. There are ${a + b}.`, visual: { kind: 'pictures', emoji, count: a + b } },
  ],
  guided: [{ prompt: 'Tap each one to count them all.', answer: a + b, answerType: 'tapCount', emoji, count: a + b }],
});

const takeAwayCount = ({ emoji, a, b }) => ({
  name: 'Take away and count',
  steps: [
    { text: `Start with ${a}. Cross out ${b}.`, visual: { kind: 'pictureTakeAway', emoji, a, b } },
    { text: `Count the ones left: there ${a - b === 1 ? 'is' : 'are'} ${a - b}.`, visual: { kind: 'pictures', emoji, count: a - b } },
  ],
  guided: [{ prompt: 'Tap the ones that are left to count them.', answer: a - b, answerType: 'tapCount', emoji, count: a - b }],
});

/* ------------------------------------------------------------------ */
/* Dispatcher                                                          */
/* ------------------------------------------------------------------ */

const METHODS = {
  makeTen, countOn, columnAdd, columnSub, subtractBond, skipCount, divideByFact, splitMultiply,
  longDivide, equivalentFraction, sameDenominator, barModel, tapCount, countAll, takeAwayCount,
  // Measurement, time, money, geometry and graphs (js/engine/topics/).
  ...TOPIC_METHODS,
};

/** Optional faster tricks, shown only after the main method (see shortcuts.js). */
const SHORTCUTS = {
  columnAdd: addShortcut,
  columnSub: subShortcut,
  splitMultiply: mulShortcut,
  longDivide: divShortcut,
};

/**
 * Work out the technique for a question.
 * @returns {{name: string, steps: Object[], guided: Object[], faster: Object|null}|null}
 *   `faster` is an optional quicker trick for these numbers, or null.
 */
export const methodFor = (question) => {
  const fn = question?.method && METHODS[question.method.kind];
  if (!fn) return null;
  const shortcut = SHORTCUTS[question.method.kind];
  return { ...fn(question.method), faster: shortcut ? shortcut(question.method) : null };
};

export const METHOD_KINDS = Object.keys(METHODS);
