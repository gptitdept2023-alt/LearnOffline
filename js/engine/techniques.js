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

const fmt = (n) => Number(n).toLocaleString('en-US');
const digits = (n) => String(n).split('').reverse().map(Number); // ones first
const PLACE = ['ones', 'tens', 'hundreds', 'thousands', 'ten thousands', 'hundred thousands'];

/** A numeric sub-question. */
const ask = (prompt, answer, visual) => ({ prompt, answer, answerType: 'numeric', visual });

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
  const steps = [{ text: 'Line up the numbers by place value. Start with the ones.', visual: { kind: 'column', a, b, op: '+', shown: 0, carries: [] } }];
  const guided = [];
  const carries = [];
  const written = []; // result digits, ones first
  let carry = 0;
  for (let i = 0; i < places; i += 1) {
    const x = da[i] || 0;
    const y = db[i] || 0;
    const sum = x + y + carry;
    const parts = carry ? `${x} + ${y} + 1 carried` : `${x} + ${y}`;
    const place = PLACE[i][0].toUpperCase() + PLACE[i].slice(1);
    guided.push(ask(`Add the ${PLACE[i]}: ${parts} = ?`, sum,
      { kind: 'column', a, b, op: '+', shown: i, carries: carries.slice(), focus: i, result: toNumber(written) }));
    const last = i === places - 1;
    if (sum >= 10 && !last) {
      written.push(sum % 10);
      carries[i + 1] = 1;
      steps.push({ text: `${place}: ${parts} = ${sum}. Write ${sum % 10}, carry 1 to the ${PLACE[i + 1]}.`, visual: { kind: 'column', a, b, op: '+', shown: i + 1, carries: carries.slice(), focus: i, result: toNumber(written) } });
    } else {
      written.push(sum % 10);
      if (sum >= 10) written.push(1);
      steps.push({ text: `${place}: ${parts} = ${sum}.`, visual: { kind: 'column', a, b, op: '+', shown: i + 1, carries: carries.slice(), focus: i, result: toNumber(written) } });
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
  const steps = [{ text: 'Line up the numbers by place value. Start with the ones.', visual: { kind: 'column', a, b, op: '−', shown: 0 } }];
  const guided = [];
  const resultDigits = [];
  const renamed = [];
  for (let i = 0; i < da.length; i += 1) {
    const y = db[i] || 0;
    let note = '';
    if (top[i] < y) {
      // Rename 1 from the next place that has something to give.
      let j = i + 1;
      while (top[j] === 0) j += 1;
      top[j] -= 1;
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
    steps.push({ text: `${note}${PLACE[i][0].toUpperCase() + PLACE[i].slice(1)}: ${top[i]} − ${y} = ${diff}.`, visual: { kind: 'column', a, b, op: '−', shown: i + 1, focus: i, top: top.slice(), result: resultSoFar } });
    guided.push(ask(`${note}${PLACE[i][0].toUpperCase() + PLACE[i].slice(1)}: ${top[i]} − ${y} = ?`, diff, { kind: 'column', a, b, op: '−', shown: i, focus: i, top: top.slice(), result: i ? Number(resultDigits.slice(0, i).reverse().join('')) : undefined }));
  }
  steps.push({ text: `${fmt(a)} − ${fmt(b)} = ${fmt(a - b)}.` });
  guided.push(ask(`So ${fmt(a)} − ${fmt(b)} = ?`, a - b));
  return { name: renamed.length ? 'Column method with renaming' : 'Column method', steps, guided };
};

/** Small subtraction: think of the part-whole bond. */
const subtractBond = ({ a, b }) => ({
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

/** Split the number by place value and multiply each part. */
const splitMultiply = ({ a, b }) => {
  if (b >= 10) {
    // 2-digit multiplier: a × tens + a × ones.
    const tens = Math.floor(b / 10) * 10;
    const ones = b % 10;
    return {
      name: 'Split and multiply',
      steps: [
        { text: `Split ${b} into ${tens} and ${ones}.`, visual: { kind: 'bond', whole: b, parts: [tens, ones] } },
        { text: `${fmt(a)} × ${tens} = ${fmt(a * tens)}.` },
        { text: `${fmt(a)} × ${ones} = ${fmt(a * ones)}.` },
        { text: `Add the parts: ${fmt(a * tens)} + ${fmt(a * ones)} = ${fmt(a * b)}.` },
      ],
      guided: [
        ask(`${fmt(a)} × ${tens} = ?`, a * tens, { kind: 'bond', whole: b, parts: [tens, ones] }),
        ask(`${fmt(a)} × ${ones} = ?`, a * ones),
        ask(`${fmt(a * tens)} + ${fmt(a * ones)} = ?`, a * b),
      ],
    };
  }
  const parts = digits(a).map((d, i) => d * 10 ** i).filter(Boolean).reverse();
  return {
    name: 'Split by place value',
    steps: [
      { text: `Split ${fmt(a)} by place value: ${parts.map(fmt).join(' + ')}.`, visual: a < 1000 ? { kind: 'blocks', value: a } : undefined },
      ...parts.map((p) => ({ text: `${fmt(p)} × ${b} = ${fmt(p * b)}.` })),
      { text: `Add: ${parts.map((p) => fmt(p * b)).join(' + ')} = ${fmt(a * b)}.` },
    ],
    guided: [
      ...parts.map((p) => ask(`${fmt(p)} × ${b} = ?`, p * b)),
      ask(`${parts.map((p) => fmt(p * b)).join(' + ')} = ?`, a * b),
    ],
  };
};

/** Long division by sharing each place, left to right. */
const longDivide = ({ dividend, divisor }) => {
  const ds = String(dividend).split('').map(Number);
  const steps = [{ text: `Share ${fmt(dividend)} into ${divisor} equal groups. Start from the biggest place.` }];
  let carry = 0;
  let quotient = '';
  ds.forEach((d, i) => {
    const place = PLACE[ds.length - 1 - i];
    const value = carry * 10 + d;
    const q = Math.floor(value / divisor);
    const r = value % divisor;
    quotient += String(q);
    steps.push({ text: `${value} ${place} ÷ ${divisor} = ${q}${r ? `, ${r} left over${i < ds.length - 1 ? ` (becomes ${r * 10} ${PLACE[ds.length - 2 - i]})` : ''}` : ''}.` });
    carry = r;
  });
  const q = Math.floor(dividend / divisor);
  const r = dividend % divisor;
  steps.push({ text: `${fmt(dividend)} ÷ ${divisor} = ${fmt(q)}${r ? ` remainder ${r}` : ''}. Check: ${divisor} × ${fmt(q)}${r ? ` + ${r}` : ''} = ${fmt(dividend)}.` });
  return {
    name: 'Long division',
    steps,
    guided: [
      ask(`${divisor} × ? is as close to ${fmt(dividend)} as possible without going over.`, q),
      ...(r ? [ask(`${fmt(dividend)} − ${divisor} × ${fmt(q)} = ? (the remainder)`, r)] : []),
    ],
  };
};

/* ------------------------------------------------------------------ */
/* Fractions                                                           */
/* ------------------------------------------------------------------ */

const equivalentFraction = ({ num, den, factor }) => ({
  name: 'Multiply top and bottom',
  steps: [
    { text: `Shade ${num}/${den}.`, visual: { kind: 'fraction', numerator: num, denominator: den, shape: 'bar' } },
    { text: `Cut every part into ${factor}. The bottom becomes ${den} × ${factor} = ${den * factor}.`, visual: { kind: 'fraction', numerator: num * factor, denominator: den * factor, shape: 'bar' } },
    { text: `The shaded amount is the same, and the top becomes ${num} × ${factor} = ${num * factor}.` },
  ],
  guided: [
    ask(`${den} × ? = ${den * factor}`, factor, { kind: 'fraction', numerator: num, denominator: den, shape: 'bar' }),
    ask(`Multiply the top by ${factor} too: ${num} × ${factor} = ?`, num * factor, { kind: 'fraction', numerator: num * factor, denominator: den * factor, shape: 'bar' }),
  ],
});

const sameDenominator = ({ x, y, den, op }) => {
  const num = op === '+' ? x + y : x - y;
  return {
    name: 'Same-size parts',
    steps: [
      { text: `Both fractions are in ${den}ths: the parts are the same size.`, visual: { kind: 'fraction', numerator: x, denominator: den, shape: 'bar' } },
      { text: `${op === '+' ? 'Add' : 'Subtract'} the tops: ${x} ${op === '+' ? '+' : '−'} ${y} = ${num}. Keep the bottom: ${den}.`, visual: { kind: 'fraction', numerator: num, denominator: den, shape: 'bar' } },
      { text: `The answer is ${num}/${den}.` },
    ],
    guided: [ask(`${x} ${op === '+' ? '+' : '−'} ${y} = ? (the top number)`, num, { kind: 'fraction', numerator: x, denominator: den, shape: 'bar' })],
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
const barModel = ({ model, op, a, b, answer }) => {
  const known = { rows: model.rows.map((r) => ({ ...r })), braces: [] };
  const opWord = { '+': 'add', '−': 'subtract', '×': 'multiply', '÷': 'divide' }[op];
  return {
    name: 'Bar model',
    steps: [
      { text: 'Read the problem. Draw a bar for each person or thing.', visual: { kind: 'bar', ...known } },
      { text: 'Label what you know, and put ? on what you must find.', visual: { kind: 'bar', ...model } },
      { text: `The model shows we must ${opWord}: ${fmt(a)} ${op} ${fmt(b)}.` },
      { text: `${fmt(a)} ${op} ${fmt(b)} = ${fmt(answer)}.` },
    ],
    guided: [
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
    { text: `There are ${count}.` },
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
    { text: `Count the ones left: there are ${a - b}.`, visual: { kind: 'pictures', emoji, count: a - b } },
  ],
  guided: [{ prompt: 'Tap the ones that are left to count them.', answer: a - b, answerType: 'tapCount', emoji, count: a - b }],
});

/* ------------------------------------------------------------------ */
/* Dispatcher                                                          */
/* ------------------------------------------------------------------ */

const METHODS = {
  makeTen, countOn, columnAdd, columnSub, subtractBond, skipCount, divideByFact, splitMultiply,
  longDivide, equivalentFraction, sameDenominator, barModel, tapCount, countAll, takeAwayCount,
};

/**
 * Work out the technique for a question.
 * @returns {{name: string, steps: Object[], guided: Object[]}|null}
 */
export const methodFor = (question) => {
  const fn = question?.method && METHODS[question.method.kind];
  return fn ? fn(question.method) : null;
};

export const METHOD_KINDS = Object.keys(METHODS);
