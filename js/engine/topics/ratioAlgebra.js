/**
 * Grades 5 and 6: ratio (bar-model units), average, order of operations,
 * simple algebra and speed. Generators and techniques together.
 *
 * Order of operations is worked by one small evaluator (evaluateSteps), so
 * the worked solution, "Try with help" and the answer all come from the
 * same steps: brackets first, then × and ÷, then + and −, left to right.
 * Pure and DOM-free.
 */

import { randInt, pick, shuffle } from '../../core/random.js';
import { NAMES, ask, askChoice, gcd, drawUntil, fmt } from './shared.js';

const ITEMS = ['marbles', 'stickers', 'stamps', 'cards', 'beads', 'shells'];
const capital = (text) => text[0].toUpperCase() + text.slice(1);
const units = (n) => `${n} ${n === 1 ? 'unit' : 'units'}`;

/* ------------------------------------------------------------------ */
/* Ratio                                                               */
/* ------------------------------------------------------------------ */

/** A bar model with x units for the first person and y for the second. */
const ratioBar = (names, x, y, braces = []) => ({
  kind: 'bar',
  rows: [
    { label: names[0], segments: Array.from({ length: x }, () => ({ units: 1, text: '' })) },
    { label: names[1], segments: Array.from({ length: y }, () => ({ units: 1, text: '' })) },
  ],
  braces,
});

/**
 * @param {{forms?: ('simplify'|'share'|'findPart'|'total'|'difference')[], maxUnit?: number}} spec
 */
const ratio = ({ forms = ['simplify', 'share', 'findPart'], maxUnit = 12 }, rng) => {
  const form = pick(forms, rng);
  const [x, y] = drawUntil(() => [randInt(1, 9, rng), randInt(1, 9, rng)], ([a, b]) => a !== b && gcd(a, b) === 1 && (form !== 'difference' || a > b));
  if (form === 'simplify') {
    const k = randInt(2, 9, rng);
    const answer = `${x} : ${y}`;
    const wrong = [[y, x], [x + 1, y], [x, y + 1], [x - 1, y], [x + 2, y], [x, y + 2]];
    const seen = new Set([x / y]);
    const choices = [answer];
    for (const [a, b] of wrong) {
      if (a > 0 && b > 0 && !seen.has(a / b) && gcd(a, b) === 1) { seen.add(a / b); choices.push(`${a} : ${b}`); }
      if (choices.length === 4) break;
    }
    return {
      answerType: 'choice',
      prompt: `Write ${x * k} : ${y * k} in simplest form.`,
      answer,
      choices: shuffle(choices, rng),
      hint: 'Divide both numbers by the biggest number that goes into both.',
      method: { kind: 'simplifyRatio', a: x * k, b: y * k },
    };
  }
  const names = shuffle(NAMES, rng).slice(0, 2);
  const item = pick(ITEMS, rng);
  const u = randInt(2, maxUnit, rng);
  const [A, B] = [x * u, y * u];
  const intro = `The ratio of ${names[0]}'s ${item} to ${names[1]}'s ${item} is ${x} : ${y}.`;
  if (form === 'share') {
    const who = rng() < 0.5 ? 0 : 1;
    return {
      answerType: 'numeric',
      prompt: `${names[0]} and ${names[1]} share ${fmt(A + B)} ${item} in the ratio ${x} : ${y}. How many ${item} does ${names[who]} get?`,
      answer: who ? B : A,
      model: ratioBar(names, x, y, [{ side: 'right', rows: [0, 1], text: fmt(A + B) }]),
      hint: `${x} + ${y} = ${x + y} units make ${fmt(A + B)}. Find 1 unit first.`,
      method: { kind: 'ratioUnits', names, x, y, known: 'total', value: A + B, find: who },
    };
  }
  if (form === 'difference') {
    return {
      answerType: 'numeric',
      prompt: `${intro} ${names[0]} has ${fmt(A - B)} more ${item} than ${names[1]}. How many ${item} does ${names[0]} have?`,
      answer: A,
      model: ratioBar(names, x, y),
      hint: `${names[0]} has ${x} − ${y} = ${x - y} more units. Find 1 unit first.`,
      method: { kind: 'ratioUnits', names, x, y, known: 'difference', value: A - B, find: 0 },
    };
  }
  const total = form === 'total';
  return {
    answerType: 'numeric',
    prompt: `${intro} ${names[0]} has ${fmt(A)} ${item}. ${total ? 'How many do they have altogether?' : `How many ${item} does ${names[1]} have?`}`,
    answer: total ? A + B : B,
    model: ratioBar(names, x, y),
    hint: `${names[0]}'s ${x} ${x === 1 ? 'unit is' : 'units are'} ${fmt(A)}. Find 1 unit first.`,
    method: { kind: 'ratioUnits', names, x, y, known: 'first', value: A, find: total ? 'total' : 1 },
  };
};

const simplifyRatio = ({ a, b }) => {
  const g = gcd(a, b);
  return {
    name: 'Divide both by the same number',
    steps: [
      { text: `Find the biggest number that goes into both ${a} and ${b}. It is ${g}.` },
      { text: `${a} ÷ ${g} = ${a / g} and ${b} ÷ ${g} = ${b / g}.` },
      { text: `So ${a} : ${b} = ${a / g} : ${b / g}. Nothing else goes into both, so it is in simplest form.` },
    ],
    guided: [
      ask(`What is the biggest number that goes into both ${a} and ${b}?`, g),
      ask(`${a} ÷ ${g} = ?`, a / g),
      askChoice(`So ${a} : ${b} in simplest form is?`, `${a / g} : ${b / g}`, [`${a / g} : ${b / g}`, `${b / g} : ${a / g}`]),
    ],
  };
};

const ratioUnits = ({ names, x, y, known, value, find }) => {
  const knownUnits = known === 'total' ? x + y : known === 'difference' ? x - y : x;
  const u = value / knownUnits;
  const findUnits = find === 'total' ? x + y : find === 0 ? x : y;
  const answer = findUnits * u;
  const what = find === 'total' ? 'altogether' : names[find];
  const knownText = known === 'total' ? `${x} + ${y} = ${units(x + y)} make ${fmt(value)}`
    : known === 'difference' ? `${names[0]} has ${x} − ${y} = ${units(x - y)} more, and that is ${fmt(value)}`
      : `${names[0]}'s ${units(x)} ${x === 1 ? 'is' : 'are'} ${fmt(value)}`;
  return {
    name: 'Bar model: find 1 unit',
    steps: [
      // No side brace here: the picture stays wide enough to read inside the narrow "Show me how" panel.
      { text: `Draw ${units(x)} for ${names[0]} and ${units(y)} for ${names[1]}. All the units are the same size.`, visual: ratioBar(names, x, y) },
      { text: `${capital(knownText)}.` },
      { text: knownUnits === 1 ? `So 1 unit = ${fmt(u)}.` : `1 unit = ${fmt(value)} ÷ ${knownUnits} = ${fmt(u)}.` },
      { text: findUnits === 1 ? `${capital(what)}: 1 unit = ${fmt(answer)}.` : `${capital(what)}: ${units(findUnits)} = ${findUnits} × ${fmt(u)} = ${fmt(answer)}.` },
    ],
    guided: [
      ask(known === 'total' ? 'How many units are there altogether?' : known === 'difference' ? `How many more units does ${names[0]} have?` : `How many units does ${names[0]} have?`, knownUnits),
      ...(knownUnits === 1 ? [] : [ask(`1 unit = ${fmt(value)} ÷ ${knownUnits} = ?`, u)]),
      ...(findUnits === 1 ? [] : [ask(`${findUnits} units = ${findUnits} × ${fmt(u)} = ?`, answer)]),
    ],
  };
};

/* ------------------------------------------------------------------ */
/* Average                                                             */
/* ------------------------------------------------------------------ */

const listText = (values) => (values.length === 1 ? String(values[0]) : `${values.slice(0, -1).join(', ')} and ${values.at(-1)}`);

/** @param {{forms?: ('mean'|'missing')[], max?: number}} spec */
const average = ({ forms = ['mean'], max = 50 }, rng) => {
  const form = pick(forms, rng);
  const count = randInt(3, 5, rng);
  const mean = randInt(5, max - 5, rng);
  // count − 1 values near the mean, then the last makes the total exact.
  const values = drawUntil(() => {
    const vs = Array.from({ length: count - 1 }, () => randInt(Math.max(1, mean - 10), mean + 10, rng));
    return [...vs, count * mean - vs.reduce((s, v) => s + v, 0)];
  }, (vs) => vs.at(-1) >= 1 && vs.at(-1) <= max + 10 && new Set(vs).size > 1);
  if (form === 'missing') {
    const known = values.slice(0, -1);
    return {
      answerType: 'numeric',
      prompt: `The average of ${count} numbers is ${mean}. ${count - 1 === 1 ? 'One of them is' : `${count - 1} of them are`} ${listText(known)}. What is the other number?`,
      answer: values.at(-1),
      hint: `The total of all ${count} numbers is ${count} × ${mean}.`,
      method: { kind: 'averageMissing', known, mean, count },
    };
  }
  const name = pick(NAMES, rng);
  const story = rng() < 0.5;
  return {
    answerType: 'numeric',
    prompt: story ? `${name} scored ${listText(values)} points in ${count} games. What is the average score?` : `Find the average of ${listText(values)}.`,
    answer: mean,
    hint: 'Add them all, then divide by how many there are.',
    method: { kind: 'averageOf', values },
  };
};

const averageOf = ({ values }) => {
  const total = values.reduce((s, v) => s + v, 0);
  return {
    name: 'Total, then share equally',
    steps: [
      { text: 'The average shares the total out equally. Average = total ÷ how many numbers.' },
      { text: `Total: ${values.join(' + ')} = ${total}.` },
      { text: `There are ${values.length} numbers: ${total} ÷ ${values.length} = ${total / values.length}.` },
    ],
    guided: [ask(`${values.join(' + ')} = ?`, total), ask(`${total} ÷ ${values.length} = ?`, total / values.length)],
  };
};

const averageMissing = ({ known, mean, count }) => {
  const total = mean * count;
  const sum = known.reduce((s, v) => s + v, 0);
  return {
    name: 'Find the total first',
    steps: [
      { text: `The average is ${mean}, so the total of all ${count} numbers is ${count} × ${mean} = ${total}.` },
      { text: `The numbers we know add up to ${known.join(' + ')} = ${sum}.` },
      { text: `The other number is ${total} − ${sum} = ${total - sum}.` },
    ],
    guided: [
      ask(`Total = ${count} × ${mean} = ?`, total),
      ask(`${known.join(' + ')} = ?`, sum),
      ask(`${total} − ${sum} = ?`, total - sum),
    ],
  };
};

/* ------------------------------------------------------------------ */
/* Order of operations                                                 */
/* ------------------------------------------------------------------ */

const OPS = { '+': (a, b) => a + b, '−': (a, b) => a - b, '×': (a, b) => a * b, '÷': (a, b) => a / b };

/** [8, '+', 4] -> "8 + 4", with brackets hugging their numbers: "(8 + 4) × 3". */
export const exprText = (tokens) => tokens.join(' ').replace(/\( /g, '(').replace(/ \)/g, ')');

/**
 * Work an expression one operation at a time: innermost brackets first, then
 * × and ÷ from left to right, then + and − from left to right.
 * Returns null when a step would leave whole numbers (a remainder or a
 * negative), so generated questions stay within primary maths.
 * @returns {{steps: {a: number, op: string, b: number, r: number, reason: string, after: (number|string)[]}[], value: number}|null}
 */
export const evaluateSteps = (input) => {
  let t = [...input];
  const steps = [];
  const unwrap = () => {
    for (let i = 0; i + 2 < t.length; i += 1) {
      if (t[i] === '(' && typeof t[i + 1] === 'number' && t[i + 2] === ')') t.splice(i, 3, t[i + 1]);
    }
  };
  while (t.length > 1) {
    const close = t.indexOf(')');
    const open = close === -1 ? -1 : t.lastIndexOf('(', close);
    const [from, to] = close === -1 ? [0, t.length] : [open + 1, close];
    const part = t.slice(from, to);
    let k = part.findIndex((x) => x === '×' || x === '÷');
    if (k === -1) k = part.findIndex((x) => x === '+' || x === '−');
    if (k === -1) return null;
    const at = from + k;
    const [a, op, b] = [t[at - 1], t[at], t[at + 1]];
    const r = OPS[op](a, b);
    if (!Number.isInteger(r) || r < 0) return null;
    const reason = close !== -1 ? 'Brackets first' : op === '×' || op === '÷' ? '× and ÷ next' : '+ and − last';
    t.splice(at - 1, 3, r);
    unwrap();
    steps.push({ a, op, b, r, reason, after: [...t] });
  }
  return { steps, value: t[0] };
};

/** The wrong answer from working straight from left to right, ignoring the rules. */
const leftToRight = (tokens) => {
  const flat = tokens.filter((x) => x !== '(' && x !== ')');
  let v = flat[0];
  for (let i = 1; i < flat.length; i += 2) v = OPS[flat[i]](v, flat[i + 1]);
  return v;
};

const TEMPLATES = {
  basic: ['a + b × c', 'a − b × c', 'a × b + c', 'a × b − c', 'a + b ÷ c', 'a − b ÷ c', 'a ÷ b + c', '(a + b) × c', '(a − b) × c', 'a × (b + c)', '(a + b) ÷ c'],
  more: ['a + b × c − d', 'a × b − c ÷ d', '(a + b) × c − d', 'a ÷ (b − c) + d', 'a − (b + c) ÷ d', '(a − b) × (c + d)'],
};

/** Turn "a + b × c" into tokens with fitting random numbers: small divisors and factors. */
const fillTemplate = (template, rng) => {
  const raw = template.replace(/\(/g, '( ').replace(/\)/g, ' )').split(' ');
  return raw.map((x, i) => {
    if (!/^[a-d]$/.test(x)) return x;
    const before = raw[i - 1];
    const after = raw[i + 1];
    if (before === '÷') return randInt(2, 9, rng);
    if (before === '×' || after === '×') return randInt(2, 12, rng);
    if (after === '÷') return randInt(2, 9, rng) * randInt(2, 12, rng);
    return randInt(2, 60, rng);
  });
};

/** @param {{templates?: ('basic'|'more')[]}} spec */
const orderOps = ({ templates = ['basic'] }, rng) => {
  const pool = templates.flatMap((k) => TEMPLATES[k] || []);
  let best = null;
  for (let i = 0; i < 300; i += 1) {
    const tokens = fillTemplate(pick(pool, rng), rng);
    const res = evaluateSteps(tokens);
    if (!res || res.value > 999) continue;
    best = { tokens, res };
    if (leftToRight(tokens) !== res.value) break; // prefer a question where the rules change the answer
  }
  if (!best) best = { tokens: [18, '−', 4, '×', 3], res: evaluateSteps([18, '−', 4, '×', 3]) };
  return {
    answerType: 'numeric',
    prompt: `${exprText(best.tokens)} = ?`,
    answer: best.res.value,
    hint: 'Brackets first. Then × and ÷ from left to right. Then + and − from left to right.',
    explain: best.res.steps.map((s) => exprText(s.after)).join(' = '),
    method: { kind: 'orderOfOperations', tokens: best.tokens },
  };
};

/** Steps and guided questions for an expression (shared with algebra). */
const operationSteps = (tokens) => {
  const res = evaluateSteps(tokens);
  return {
    steps: res.steps.map((s) => ({ text: `${s.reason}: ${s.a} ${s.op} ${s.b} = ${s.r}.${s.after.length > 1 ? ` Now it is ${exprText(s.after)}.` : ''}` })),
    guided: res.steps.map((s) => ask(`${s.reason}: ${s.a} ${s.op} ${s.b} = ?`, s.r)),
    value: res.value,
  };
};

const orderOfOperations = ({ tokens }) => {
  const { steps, guided } = operationSteps(tokens);
  return {
    name: 'Brackets, then × ÷, then + −',
    steps: [{ text: `${exprText(tokens)}: work out brackets first, then × and ÷, then + and −. Go from left to right.` }, ...steps],
    guided,
  };
};

/* ------------------------------------------------------------------ */
/* Algebra (Grade 6)                                                   */
/* ------------------------------------------------------------------ */

const LETTERS = ['n', 'k', 'y'];

/**
 * Algebra text: "3 × n + 4" is written "3n + 4". `V` in the tokens is the
 * letter; numbers stay numbers.
 */
const algebraText = (tokens, v) => exprText(tokens.map((x) => (x === 'V' ? v : x))).replace(new RegExp(`(\\d+) × ${v}\\b`, 'g'), `$1${v}`);

/** The number written in front of the letter ("3" in 45 − 3n), or null. */
const coefOf = (tokens) => {
  const i = tokens.indexOf('V');
  return i >= 2 && tokens[i - 1] === '×' && typeof tokens[i - 2] === 'number' ? tokens[i - 2] : null;
};

const EVAL_TEMPLATES = [
  (c, d) => [c, '×', 'V', '+', d],
  (c, d) => [c, '×', 'V', '−', d],
  (c, d) => ['(', 'V', '+', d, ')', '×', c],
  (c, d) => ['V', '÷', c, '+', d],
  (c, d) => [d * 3, '−', c, '×', 'V'],
];

/**
 * @param {{forms?: ('evaluate'|'solve'|'likeTerms'|'write')[]}} spec
 */
const algebra = ({ forms = ['evaluate', 'solve', 'likeTerms', 'write'] }, rng) => {
  const form = pick(forms, rng);
  const v = pick(LETTERS, rng);
  if (form === 'evaluate') {
    let picked = null;
    for (let i = 0; i < 300 && !picked; i += 1) {
      const c = randInt(2, 9, rng);
      const d = randInt(1, 20, rng);
      const tpl = pick(EVAL_TEMPLATES, rng)(c, d);
      const val = tpl.includes('÷') ? c * randInt(1, 9, rng) : randInt(2, 12, rng);
      const sub = tpl.map((x) => (x === 'V' ? val : x));
      const res = evaluateSteps(sub);
      if (res && res.value > 0) picked = { tpl, val, res };
    }
    const { tpl, val, res } = picked;
    return {
      answerType: 'numeric',
      prompt: `If ${v} = ${val}, what is ${algebraText(tpl, v)}?`,
      answer: res.value,
      hint: `Put ${val} in place of ${v}. ${coefOf(tpl) ? `Remember ${coefOf(tpl)}${v} means ${coefOf(tpl)} × ${v}.` : ''}`.trim(),
      method: { kind: 'algebraEvaluate', tokens: tpl, v, val },
    };
  }
  if (form === 'solve') {
    const val = randInt(2, 15, rng);
    const kind = pick(['mulAdd', 'mulSub', 'mul', 'add', 'div'], rng);
    const c = randInt(2, 9, rng);
    const d = randInt(1, 30, rng);
    const spec = {
      mulAdd: { text: `${c}${v} + ${d}`, R: c * val + d, undo: [['−', d], ['÷', c]] },
      mulSub: { text: `${c}${v} − ${d}`, R: c * val - d, undo: [['+', d], ['÷', c]] },
      mul: { text: `${c}${v}`, R: c * val, undo: [['÷', c]] },
      add: { text: `${v} + ${d}`, R: val + d, undo: [['−', d]] },
      div: { text: `${v} ÷ ${c}`, R: val, undo: [['×', c]] },
    }[kind];
    const realVal = kind === 'div' ? val * c : val;
    if (spec.R < 0 || (kind === 'mulSub' && spec.R <= 0)) {
      return algebra({ forms: ['solve'] }, rng);
    }
    return {
      answerType: 'numeric',
      prompt: `${spec.text} = ${spec.R}. What is ${v}?`,
      answer: realVal,
      model: kind === 'mulAdd' ? {
        kind: 'bar',
        rows: [{ label: '', segments: [...Array.from({ length: c }, () => ({ units: val, text: v })), { units: d, text: String(d) }] }],
        braces: [{ row: 0, from: 0, to: c + 1, side: 'above', text: String(spec.R) }],
      } : undefined,
      hint: 'Undo the steps, the last one first.',
      method: { kind: 'algebraSolve', text: spec.text, R: spec.R, undo: spec.undo, v },
    };
  }
  if (form === 'likeTerms') {
    const withNumber = rng() < 0.5;
    const [a, b, c] = [randInt(2, 9, rng), randInt(2, 9, rng), randInt(1, 8, rng)];
    if (withNumber) {
      const answer = `${a + c}${v} + ${b}`;
      const wrong = [`${a + b + c}${v}`, `${a + b + c}`, `${a + c}${v} + ${b + 1}`, `${a}${v} + ${b + c}`, `${a + c + 1}${v} + ${b}`];
      return {
        answerType: 'choice',
        prompt: `Simplify ${a}${v} + ${b} + ${c === 1 ? '' : c}${v}.`,
        answer,
        choices: shuffle([answer, ...shuffle([...new Set(wrong)].filter((w) => w !== answer), rng).slice(0, 3)], rng),
        hint: `Add the ${v} terms together. The number on its own stays as it is.`,
        method: { kind: 'likeTerms', a, b, c, v, withNumber },
      };
    }
    const r = a + b - c;
    if (r < 2) return algebra({ forms: ['likeTerms'] }, rng);
    const answer = `${r}${v}`;
    const wrong = [`${a + b + c}${v}`, `${r + 1}${v}`, `${r}`, `${Math.max(2, r - 1)}${v}`, `${a + b}${v}`];
    return {
      answerType: 'choice',
      prompt: `Simplify ${a}${v} + ${b}${v} − ${c === 1 ? '' : c}${v}.`,
      answer,
      choices: shuffle([answer, ...shuffle([...new Set(wrong)].filter((w) => w !== answer), rng).slice(0, 3)], rng),
      hint: `${a}${v} means ${a} lots of ${v}. Add and subtract the numbers in front of ${v}.`,
      method: { kind: 'likeTerms', a, b, c, v, withNumber },
    };
  }
  // write: an expression for a story.
  const [p, q] = shuffle(NAMES, rng).slice(0, 2);
  const item = pick(ITEMS, rng);
  const m = randInt(2, 9, rng);
  const relation = pick(['more', 'fewer', 'times', 'share'], rng);
  const story = {
    more: [`${q} has ${m} more than ${p}.`, `${v} + ${m}`],
    fewer: [`${q} has ${m} fewer than ${p}.`, `${v} − ${m}`],
    times: [`${q} has ${m} times as many as ${p}.`, `${m}${v}`],
    share: [`${p} shares them equally among ${m} friends. How many does each friend get?`, `${v} ÷ ${m}`],
  }[relation];
  const prompt = relation === 'share'
    ? `${p} has ${v} ${item}. ${story[0]}`
    : `${p} has ${v} ${item}. ${story[0]} How many ${item} does ${q} have?`;
  const choices = [`${v} + ${m}`, `${v} − ${m}`, `${m}${v}`, `${v} ÷ ${m}`];
  return {
    answerType: 'choice',
    prompt,
    answer: story[1],
    choices: shuffle(choices, rng),
    hint: 'More than: add. Fewer than: subtract. Times as many: multiply. Share equally: divide.',
    method: { kind: 'writeExpression', relation, v, m },
  };
};

const algebraEvaluate = ({ tokens, v, val }) => {
  const sub = tokens.map((x) => (x === 'V' ? val : x));
  const { steps, guided } = operationSteps(sub);
  const shown = algebraText(tokens, v);
  const c = coefOf(tokens);
  return {
    name: 'Put the number in place of the letter',
    steps: [
      ...(c ? [{ text: `${c}${v} means ${c} × ${v}.` }] : []),
      { text: `Put ${val} in place of ${v}: ${shown} becomes ${exprText(sub)}.` },
      ...steps,
    ],
    guided,
  };
};

const UNDO_WORD = { '+': 'add', '−': 'subtract', '×': 'multiply by', '÷': 'divide by' };
const DO_WORD = { '−': 'adding', '+': 'subtracting', '÷': 'multiplying by', '×': 'dividing by' };

const algebraSolve = ({ text, R, undo, v }) => {
  let value = R;
  const steps = [{ text: `${text} = ${R}. Undo each step, the last one first.` }];
  const guided = [];
  for (const [op, n] of undo) {
    const next = OPS[op](value, n);
    steps.push({ text: `Undo ${DO_WORD[op]} ${n}: ${UNDO_WORD[op]} ${n}. ${value} ${op} ${n} = ${next}.` });
    guided.push(ask(`${value} ${op} ${n} = ?`, next));
    value = next;
  }
  steps.push({ text: `So ${v} = ${value}. Check: put ${value} back into ${text} and you get ${R}.` });
  return { name: 'Undo the steps', steps, guided };
};

const likeTerms = ({ a, b, c, v, withNumber }) => {
  const term = (n) => `${n === 1 ? '' : n}${v}`;
  if (withNumber) {
    const answer = `${a + c}${v} + ${b}`;
    return {
      name: 'Collect the same letters',
      steps: [
        { text: `${term(a)} means ${a} lots of ${v}. Only ${v} terms can be added to ${v} terms.` },
        { text: `Collect the ${v} terms: ${term(a)} + ${term(c)} = ${a + c}${v}. The ${b} stays as it is.` },
        { text: `So the answer is ${answer}.` },
      ],
      guided: [
        ask(`${term(a)} + ${term(c)}: ${a} + ${c} = ?`, a + c),
        askChoice('So the answer is?', answer, [answer, `${a + b + c}${v}`, `${a + c}${v} + ${b}${v}`]),
      ],
    };
  }
  const r = a + b - c;
  return {
    name: 'Collect the same letters',
    steps: [
      { text: `${term(a)} means ${a} lots of ${v}. Work with the numbers in front of ${v}.` },
      { text: `${a} + ${b} − ${c} = ${r}.` },
      { text: `So the answer is ${r}${v}.` },
    ],
    guided: [
      ask(`${a} + ${b} − ${c} = ?`, r),
      askChoice('So the answer is?', `${r}${v}`, [`${r}${v}`, `${r}`, `${a + b + c}${v}`]),
    ],
  };
};

const RELATION_OP = { more: ['add', '+'], fewer: ['subtract', '−'], times: ['multiply', '×'], share: ['divide', '÷'] };

const writeExpression = ({ relation, v, m }) => {
  const [word] = RELATION_OP[relation];
  const answer = { more: `${v} + ${m}`, fewer: `${v} − ${m}`, times: `${m}${v}`, share: `${v} ÷ ${m}` }[relation];
  const clue = { more: `"${m} more than" means add ${m}.`, fewer: `"${m} fewer than" means subtract ${m}.`, times: `"${m} times as many" means multiply by ${m}. ${m} × ${v} is written ${m}${v}.`, share: `"Share equally among ${m}" means divide by ${m}.` }[relation];
  return {
    name: 'Turn the words into maths',
    steps: [
      { text: `We do not know the number, so we use the letter ${v} for it.` },
      { text: clue },
      { text: `So the answer is ${answer}.` },
    ],
    guided: [
      askChoice('Do we add, subtract, multiply or divide?', word, ['add', 'subtract', 'multiply', 'divide']),
      askChoice('So the answer is?', answer, [`${v} + ${m}`, `${v} − ${m}`, `${m}${v}`, `${v} ÷ ${m}`]),
    ],
  };
};

/* ------------------------------------------------------------------ */
/* Speed, distance and time (Grade 6)                                  */
/* ------------------------------------------------------------------ */

const SPEED_UNITS = {
  kmh: { dist: 'km', speed: 'km/h', time: 'hours', one: 'hour', speeds: [20, 90, 5], times: [2, 6] },
  mmin: { dist: 'm', speed: 'm/min', time: 'minutes', one: 'minute', speeds: [40, 120, 10], times: [5, 20] },
};

/** @param {{forms?: ('distance'|'time'|'speed')[], units?: ('kmh'|'mmin')[]}} spec */
const speed = ({ forms = ['distance', 'time', 'speed'], units: unitKeys = ['kmh', 'mmin'] }, rng) => {
  const U = SPEED_UNITS[pick(unitKeys, rng)];
  const [lo, hi, step] = U.speeds;
  const s = step * randInt(lo / step, hi / step, rng);
  const t = randInt(...U.times, rng);
  const D = s * t;
  const find = pick(forms, rng);
  const name = pick(NAMES, rng);
  const mover = U.dist === 'km' ? pick(['A car', 'A bus', 'A train', 'A truck'], rng) : `${name}`;
  const moves = U.dist === 'km' ? 'travels' : 'walks';
  const prompts = {
    distance: `${mover} ${moves} at ${s} ${U.speed} for ${t} ${U.time}. How far is that, in ${U.dist}?`,
    time: `${mover} ${moves} ${fmt(D)} ${U.dist} at ${s} ${U.speed}. How many ${U.time} does it take?`,
    speed: `${mover} ${moves} ${fmt(D)} ${U.dist} in ${t} ${U.time}. What is the average speed, in ${U.speed}?`,
  };
  return {
    answerType: 'numeric',
    prompt: prompts[find],
    answer: { distance: D, time: t, speed: s }[find],
    hint: 'Distance = speed × time.',
    method: { kind: 'speedDistanceTime', s, t, find, unit: U === SPEED_UNITS.kmh ? 'kmh' : 'mmin' },
  };
};

const speedDistanceTime = ({ s, t, find, unit }) => {
  const U = SPEED_UNITS[unit];
  const D = s * t;
  const pic = t <= 12 ? {
    kind: 'bar',
    rows: [{ label: '', segments: Array.from({ length: t }, () => ({ units: 1, text: find === 'speed' ? '?' : `${s} ${U.dist}` })) }],
    braces: [{ row: 0, from: 0, to: t, side: 'above', text: find === 'distance' ? '?' : `${fmt(D)} ${U.dist}` }],
  } : undefined;
  const lines = {
    distance: [`In ${t} ${U.time}: ${t} × ${s} = ${fmt(D)} ${U.dist}.`, 'multiply', ask(`${t} × ${s} = ?`, D)],
    time: [`How many lots of ${s} ${U.dist} make ${fmt(D)} ${U.dist}? ${fmt(D)} ÷ ${s} = ${t} ${U.time}.`, 'divide', ask(`${fmt(D)} ÷ ${s} = ?`, t)],
    speed: [`Share the distance equally over the ${t} ${U.time}: ${fmt(D)} ÷ ${t} = ${s} ${U.dist} in each ${U.one}, so ${s} ${U.speed}.`, 'divide', ask(`${fmt(D)} ÷ ${t} = ?`, s)],
  }[find];
  return {
    name: 'Distance = speed × time',
    steps: [
      { text: find === 'speed' ? `Speed is how far something goes in 1 ${U.one}. We want the ${U.dist} in each ${U.one}.` : `A speed of ${s} ${U.speed} means ${s} ${U.dist} in each ${U.one}.`, visual: pic },
      { text: 'Distance = speed × time. So time = distance ÷ speed, and speed = distance ÷ time.' },
      { text: lines[0] },
    ],
    guided: [askChoice('Do we multiply or divide?', lines[1], ['multiply', 'divide']), lines[2]],
  };
};

export const generators = { ratio, average, orderOps, algebra, speed };
export const methods = { simplifyRatio, ratioUnits, averageOf, averageMissing, orderOfOperations, algebraEvaluate, algebraSolve, likeTerms, writeExpression, speedDistanceTime };
