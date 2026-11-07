/**
 * Money: totals and change in pesos and centavos (100¢ = ₱1). Amounts are
 * kept in centavos internally so there is never a floating-point surprise
 * (0.1 + 0.2). Prices move in 25-centavo steps, like real coins.
 *
 * Techniques: add the pesos, then the centavos (trade 100¢ for ₱1); give
 * change by counting up from the price in friendly jumps: to the next peso,
 * the next ₱10, the next ₱100, then the bill.
 * Pure and DOM-free.
 */

import { randInt, pick } from '../../core/random.js';
import { NAMES, ask, money, pesos, withArticle } from './shared.js';

const SHOP = ['pen', 'ruler', 'notebook', 'eraser', 'sandwich', 'juice box', 'storybook', 'water bottle', 'pencil case', 'ball', 'umbrella', 'lunch box'];
/** Peso bills, in centavos. */
const BILLS = [2000, 5000, 10000, 20000, 50000, 100000];

/** "75¢" under a peso, "₱2.00" otherwise. */
const amount = (c) => (c < 100 ? `${c}¢` : money(c));

/** "₱100" for a bill (no centavos). */
const bill = (c) => money(c).replace('.00', '');

/** @param {{forms?: ('total'|'change')[], max?: number}} spec max = highest price in pesos. */
const moneyProblem = ({ forms = ['total', 'change'], max = 300 }, rng) => {
  const price = () => 25 * randInt(41, max * 4 - 1, rng); // ₱10.25 .. just under max
  const name = pick(NAMES, rng);
  if (pick(forms, rng) === 'total') {
    const [itemA, itemB] = [pick(SHOP, rng), pick(SHOP, rng)];
    const [a, b] = [price(), price()];
    const second = itemA === itemB ? `another ${itemB}` : withArticle(itemB);
    return {
      answerType: 'numeric',
      prompt: `${name} buys ${withArticle(itemA)} for ${money(a)} and ${second} for ${money(b)}. How much does ${name} pay altogether, in pesos?`,
      answer: pesos(a + b),
      display: money(a + b),
      hint: 'Add the pesos, then add the centavos. 100 centavos make ₱1.',
      explain: `${money(a)} + ${money(b)} = ${money(a + b)}`,
      method: { kind: 'moneyTotal', a, b },
    };
  }
  const cost = price();
  const paid = BILLS.find((n) => n > cost);
  const item = pick(SHOP, rng);
  return {
    answerType: 'numeric',
    prompt: `${name} buys ${withArticle(item)} for ${money(cost)} and pays with a ${bill(paid)} bill. How much change does ${name} get, in pesos?`,
    answer: pesos(paid - cost),
    display: money(paid - cost),
    hint: 'Count up from the price: to the next peso, then to friendly numbers, then to the bill.',
    explain: `${money(paid)} − ${money(cost)} = ${money(paid - cost)}`,
    method: { kind: 'moneyChange', cost, paid },
  };
};

const priceBar = (a, b, total) => ({
  kind: 'bar',
  rows: [{ label: '', segments: [{ units: a, text: money(a) }, { units: b, text: money(b) }] }],
  braces: [{ row: 0, from: 0, to: 2, side: 'above', text: total }],
});

const moneyTotalMethod = ({ a, b }) => {
  const [pa, pb] = [Math.floor(a / 100), Math.floor(b / 100)];
  const [ca, cb] = [a % 100, b % 100];
  const centavos = ca + cb;
  const total = a + b;
  const peso = (n) => `₱${n.toLocaleString('en-US')}`;
  const steps = [
    { text: `Draw the two prices as a bar. We want the whole: ${money(a)} + ${money(b)}.`, visual: priceBar(a, b, '?') },
    { text: `Add the pesos: ${peso(pa)} + ${peso(pb)} = ${peso(pa + pb)}.`, visual: priceBar(a, b, '?') },
  ];
  const guided = [ask(`${peso(pa)} + ${peso(pb)} = ₱?`, pa + pb, priceBar(a, b, '?'))];
  if (centavos && (!ca || !cb)) {
    // Only one price has centavos: no "0¢ + 50¢".
    steps.push({ text: `Only ${money(ca ? a : b)} has centavos: ${centavos}¢.`, visual: priceBar(a, b, '?') });
  } else if (centavos) {
    steps.push({
      text: centavos >= 100
        ? `Add the centavos: ${ca}¢ + ${cb}¢ = ${centavos}¢. 100 centavos make ₱1, so ${centavos}¢ = ${money(centavos)}.`
        : `Add the centavos: ${ca}¢ + ${cb}¢ = ${centavos}¢.`,
      visual: priceBar(a, b, '?'),
    });
    guided.push(ask(`${ca}¢ + ${cb}¢ = ?¢`, centavos, priceBar(a, b, '?')));
  }
  steps.push({
    text: centavos ? `Put them together: ${peso(pa + pb)} + ${amount(centavos)} = ${money(total)}.` : `So the total is ${money(total)}.`,
    visual: priceBar(a, b, money(total)),
  });
  guided.push(ask(`So how much altogether, in pesos? (${money(a)} + ${money(b)})`, pesos(total), priceBar(a, b, '?')));
  return { name: 'Pesos, then centavos', steps, guided };
};

/** Friendly jumps from the price up to the bill: next peso, next ₱10, next ₱100, the bill. Never a 0 jump. */
export const changeJumps = (cost, paid) => {
  const jumps = [];
  let at = cost;
  for (const step of [100, 1000, 10000]) {
    const next = Math.ceil(at / step) * step;
    if (next > at && next < paid) { jumps.push(next - at); at = next; }
  }
  if (paid > at) jumps.push(paid - at);
  return jumps;
};

const moneyChangeMethod = ({ cost, paid }) => {
  const moves = changeJumps(cost, paid);
  const hops = (m) => ({ kind: 'hops', start: cost, moves: m, format: 'money' });
  const steps = [{ text: `Change is what is left: ${money(paid)} − ${money(cost)}. Count up from the price to ${money(paid)}.`, visual: hops([]) }];
  const guided = [];
  let at = cost;
  moves.forEach((m, k) => {
    steps.push({ text: `${money(at)} + ${amount(m)} = ${money(at + m)}.`, visual: hops(moves.slice(0, k + 1)) });
    // A single jump is the whole answer, so it is asked in pesos like the question.
    const inCentavos = m < 100 && moves.length > 1;
    guided.push(ask(`From ${money(at)} to ${money(at + m)}: how much, in ${inCentavos ? 'centavos' : 'pesos'}?`, inCentavos ? m : pesos(m), hops(moves.slice(0, k))));
    at += m;
  });
  steps.push({
    text: moves.length > 1 ? `Add the jumps: ${moves.map(amount).join(' + ')} = ${money(paid - cost)}. That is the change.` : `So the change is ${money(paid - cost)}.`,
    visual: hops(moves),
  });
  if (moves.length > 1) guided.push(ask(`So the change is how much, in pesos? (${moves.map(amount).join(' + ')})`, pesos(paid - cost), hops(moves)));
  return { name: 'Count up to give change', steps, guided };
};

export const generators = { moneyProblem };
export const methods = { moneyTotal: moneyTotalMethod, moneyChange: moneyChangeMethod };
