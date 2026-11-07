/**
 * "Faster way" tricks (mental-maths strategies), shown AFTER the main
 * Singapore method so the fundamentals always come first.
 *
 * Each trick only applies when it really is faster for those numbers
 * (e.g. 456 + 298 -> 456 + 300 − 2). When no trick helps, the result is
 * null and the app shows the main method alone.
 *
 * Pure and DOM-free. Every trick carries its `answer` so tests can prove
 * it agrees with the question.
 *
 * @typedef {{name: string, why: string, steps: {text: string, visual?: Object}[], answer: number}} Shortcut
 */

const fmt = (n) => Number(n).toLocaleString('en-US');

/** Number line with labelled hops, e.g. 456 → +300 → 756 → −2 → 754. */
const hops = (start, moves) => ({ kind: 'hops', start, moves });

/** Bar of `parts` equal pieces, each labelled `each`, with the whole above. */
const equalBar = (whole, parts, each, label = '') => ({
  kind: 'bar',
  rows: [{ label, segments: Array.from({ length: parts }, () => ({ units: 1, text: fmt(each) })) }],
  braces: [{ row: 0, from: 0, to: parts, side: 'above', text: fmt(whole) }],
});

/** Bars that double each time: 1, 2, 4, 8 copies of `a`. */
const doublingBars = (a, times) => ({
  kind: 'bar',
  rows: Array.from({ length: times + 1 }, (_, i) => ({
    label: i ? `×${2 ** i}` : '×1',
    segments: [{ units: 2 ** i, text: fmt(a * 2 ** i) }],
  })),
});

/**
 * The nearest "friendly" number above n (next ten or hundred), when n is
 * just below it. Returns null when n is not close to one.
 * @returns {{round: number, gap: number}|null}
 */
const roundUp = (n) => {
  if (n >= 100 && n % 100 >= 95) return { round: n + (100 - (n % 100)), gap: 100 - (n % 100) };
  if (n >= 17 && n % 10 >= 7) return { round: n + (10 - (n % 10)), gap: 10 - (n % 10) };
  return null;
};

/* ------------------------------------------------------------------ */
/* Addition                                                            */
/* ------------------------------------------------------------------ */

/** a + b: make the next ten (small addend), or round one number up and give back the extra. */
export const addShortcut = ({ a, b }) => {
  // Make the next ten: 38 + 7 = 38 + 2 + 5.
  const small = Math.min(a, b);
  const big = Math.max(a, b);
  const need = 10 - (big % 10);
  if (big >= 10 && small < 10 && need < 10 && small > need) {
    const ten = big + need;
    return {
      name: 'Make the next ten',
      why: `Getting to ${fmt(ten)} first makes the rest easy.`,
      answer: a + b,
      steps: [
        { text: `${fmt(big)} needs ${need} to make ${fmt(ten)}. Split ${small} into ${need} and ${small - need}.`, visual: { kind: 'bond', whole: small, parts: [need, small - need] } },
        { text: `${fmt(big)} + ${need} = ${fmt(ten)}, then ${fmt(ten)} + ${small - need} = ${fmt(a + b)}.`, visual: hops(big, [need, small - need]) },
      ],
    };
  }
  for (const [x, y] of [[a, b], [b, a]]) {
    const r = roundUp(y);
    if (!r) continue;
    const mid = x + r.round;
    return {
      name: 'Round and adjust',
      why: `${fmt(y)} is just ${r.gap} less than ${fmt(r.round)}, and adding ${fmt(r.round)} is easy.`,
      answer: a + b,
      steps: [
        { text: `${fmt(y)} is close to ${fmt(r.round)}. Add ${fmt(r.round)} instead: ${fmt(x)} + ${fmt(r.round)} = ${fmt(mid)}.`, visual: hops(x, [r.round]) },
        { text: `That was ${r.gap} too many, so take ${r.gap} away: ${fmt(mid)} − ${r.gap} = ${fmt(a + b)}.`, visual: hops(x, [r.round, -r.gap]) },
      ],
    };
  }
  return null;
};

/* ------------------------------------------------------------------ */
/* Subtraction                                                         */
/* ------------------------------------------------------------------ */

/** a − b: round b up and give back; or move both numbers to avoid renaming across zeros. */
export const subShortcut = ({ a, b }) => {
  const r = roundUp(b);
  if (r && r.round <= a) {
    const mid = a - r.round;
    return {
      name: 'Round and adjust',
      why: `Taking away ${fmt(r.round)} is easier than taking away ${fmt(b)}.`,
      answer: a - b,
      steps: [
        { text: `${fmt(b)} is close to ${fmt(r.round)}. Take away ${fmt(r.round)} instead: ${fmt(a)} − ${fmt(r.round)} = ${fmt(mid)}.`, visual: hops(a, [-r.round]) },
        { text: `That took away ${r.gap} too many, so add ${r.gap} back: ${fmt(mid)} + ${r.gap} = ${fmt(a - b)}.`, visual: hops(a, [-r.round, r.gap]) },
      ],
    };
  }
  // Same difference: 6002 − 2748 = 5999 − 2745 (no renaming across zeros).
  const k = String(a).length - 1;
  const low = a % 10 ** k;
  const needsRenaming = String(b).padStart(String(a).length, '0').split('').some((d, i) => Number(d) > Number(String(a)[i]));
  if (k >= 2 && low <= 9 && b > low && needsRenaming) {
    const d = low + 1;
    return {
      name: 'Same difference',
      why: 'Moving both numbers down by the same amount keeps the difference the same, and 9s never need renaming.',
      answer: a - b,
      steps: [
        { text: `Take ${d} from both numbers. The gap between them stays the same: ${fmt(a)} − ${fmt(b)} = ${fmt(a - d)} − ${fmt(b - d)}.`, visual: { kind: 'column', a: a - d, b: b - d, op: '−', shown: 0, carries: [] } },
        { text: `${fmt(a - d)} − ${fmt(b - d)} needs no renaming: ${fmt(a - b)}.`, visual: { kind: 'column', a: a - d, b: b - d, op: '−', shown: String(a - d).length, carries: [], result: a - b } },
      ],
    };
  }
  return null;
};

/* ------------------------------------------------------------------ */
/* Multiplication                                                      */
/* ------------------------------------------------------------------ */

/** a × b: ×5 = ×10 ÷ 2, ×25 = ×100 ÷ 4, ×9 = ×10 − once, doubling, or round a. */
export const mulShortcut = ({ a, b }) => {
  const ans = a * b;
  if (b === 5) {
    return {
      name: 'Times 10, then halve',
      why: '5 is half of 10, so × 5 is the same as × 10 then half.',
      answer: ans,
      steps: [
        { text: `× 10 first: ${fmt(a)} × 10 = ${fmt(a * 10)}.`, visual: { kind: 'shift', value: a } },
        { text: `5 is half of 10, so halve it: ${fmt(a * 10)} ÷ 2 = ${fmt(ans)}.`, visual: equalBar(a * 10, 2, ans) },
      ],
    };
  }
  if (b === 25) {
    return {
      name: 'Times 100, then quarter',
      why: '25 is a quarter of 100.',
      answer: ans,
      steps: [
        { text: `× 100 first: ${fmt(a)} × 100 = ${fmt(a * 100)}.` },
        { text: `25 is a quarter of 100, so share into 4: ${fmt(a * 100)} ÷ 4 = ${fmt(ans)}.`, visual: equalBar(a * 100, 4, ans) },
      ],
    };
  }
  if (b % 10 === 9 && b < 100) {
    const up = b + 1;
    return {
      name: 'One group too many',
      why: `${b} groups is 1 group less than ${up} groups, and × ${up} is easy.`,
      answer: ans,
      steps: [
        { text: `Find ${up} groups: ${fmt(a)} × ${up} = ${fmt(a * up)}.` },
        { text: `${b} groups is 1 group less, so take away one ${fmt(a)}: ${fmt(a * up)} − ${fmt(a)} = ${fmt(ans)}.`, visual: hops(a * up, [-a]) },
      ],
    };
  }
  if (b === 4 || b === 8) {
    const times = b === 4 ? 2 : 3;
    const steps = [];
    for (let i = 1; i <= times; i += 1) steps.push({ text: `Double: ${fmt(a * 2 ** (i - 1))} × 2 = ${fmt(a * 2 ** i)}.` });
    steps[steps.length - 1].visual = doublingBars(a, times);
    return {
      name: b === 4 ? 'Double, double' : 'Double, double, double',
      why: `× ${b} is doubling ${times} times, and doubling is quick.`,
      answer: ans,
      steps,
    };
  }
  const r = a >= 18 ? roundUp(a) : null;
  if (r && b < 10) {
    return {
      name: 'Round and adjust',
      why: `${fmt(a)} is just ${r.gap} less than ${fmt(r.round)}.`,
      answer: ans,
      steps: [
        { text: `${fmt(a)} is close to ${fmt(r.round)}. Multiply that: ${fmt(r.round)} × ${b} = ${fmt(r.round * b)}.` },
        { text: `Each of the ${b} groups had ${r.gap} too many, so take away ${r.gap} × ${b} = ${r.gap * b}: ${fmt(r.round * b)} − ${r.gap * b} = ${fmt(ans)}.`, visual: hops(r.round * b, [-(r.gap * b)]) },
      ],
    };
  }
  return null;
};

/* ------------------------------------------------------------------ */
/* Division                                                            */
/* ------------------------------------------------------------------ */

/** dividend ÷ divisor (exact only): use a nearby friendly number, ÷5 as ×2 ÷ 10, or halving. */
export const divShortcut = ({ dividend, divisor }) => {
  if (dividend % divisor !== 0 || dividend < 20) return null;
  const q = dividend / divisor;
  // Friendly number: 795 ÷ 5 -> 800 ÷ 5 − 1.
  for (const unit of [100, 10]) {
    const round = Math.ceil(dividend / unit) * unit;
    const gap = round - dividend;
    if (gap > 0 && round % divisor === 0 && gap % divisor === 0 && gap / divisor <= 2 && round / divisor >= 10) {
      const less = gap / divisor;
      return {
        name: 'Use a friendly number',
        why: `${fmt(dividend)} is just ${gap} less than ${fmt(round)}, and ${fmt(round)} shares easily.`,
        answer: q,
        steps: [
          { text: `${fmt(dividend)} is close to ${fmt(round)}. Share that: ${fmt(round)} ÷ ${divisor} = ${fmt(round / divisor)}.`, visual: equalBar(round, divisor, round / divisor) },
          { text: `${fmt(dividend)} is ${gap} less, which is ${less} less in each group: ${fmt(round / divisor)} − ${less} = ${fmt(q)}.`, visual: hops(round / divisor, [-less]) },
        ],
      };
    }
  }
  if (divisor === 5) {
    return {
      name: 'Double, then ÷ 10',
      why: '÷ 5 gives the same answer as doubling both numbers, which makes it ÷ 10.',
      answer: q,
      steps: [
        { text: `Double both numbers: ${fmt(dividend)} ÷ 5 = ${fmt(dividend * 2)} ÷ 10.` },
        { text: `÷ 10 moves each digit one place to the right: ${fmt(dividend * 2)} ÷ 10 = ${fmt(q)}.` },
      ],
    };
  }
  if (divisor === 4 || divisor === 8) {
    const times = divisor === 4 ? 2 : 3;
    const steps = [];
    for (let i = 1; i <= times; i += 1) {
      const from = dividend / 2 ** (i - 1);
      steps.push({ text: `Halve: ${fmt(from)} ÷ 2 = ${fmt(from / 2)}.`, visual: equalBar(from, 2, from / 2) });
    }
    return {
      name: divisor === 4 ? 'Halve, halve' : 'Halve, halve, halve',
      why: `÷ ${divisor} is halving ${times} times.`,
      answer: q,
      steps,
    };
  }
  return null;
};
