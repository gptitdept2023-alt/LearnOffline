/**
 * Money: totals and change in dollars and cents. Prices are kept in cents
 * internally so there is never a floating-point surprise (0.1 + 0.2).
 *
 * Techniques: add dollars, then cents (trade 100¢ for $1); give change by
 * counting up from the price to the next dollar, then to the note.
 * Pure and DOM-free.
 */

import { randInt, pick } from '../../core/random.js';
import { NAMES, ask, money, dollars, withArticle } from './shared.js';

const SHOP = ['pen', 'ruler', 'notebook', 'eraser', 'sandwich', 'juice box', 'storybook', 'water bottle', 'pencil case', 'ball'];
const NOTES = [500, 1000, 2000, 5000];

/** "65¢" under a dollar, "$2.00" otherwise. */
const amount = (cents) => (cents < 100 ? `${cents}¢` : money(cents));

/** @param {{forms?: ('total'|'change')[], max?: number}} spec max = highest price in dollars. */
const moneyProblem = ({ forms = ['total', 'change'], max = 20 }, rng) => {
  const price = () => 5 * randInt(21, max * 20 - 1, rng); // $1.05 .. just under max, in 5¢ steps
  const name = pick(NAMES, rng);
  if (pick(forms, rng) === 'total') {
    const [itemA, itemB] = [pick(SHOP, rng), pick(SHOP, rng)];
    const a = price();
    const b = 5 * randInt(21, Math.min(max * 20 - 1, 199), rng);
    const second = itemA === itemB ? `another ${itemB}` : withArticle(itemB);
    return {
      answerType: 'numeric',
      prompt: `${name} buys ${withArticle(itemA)} for ${money(a)} and ${second} for ${money(b)}. How much does ${name} pay altogether, in dollars?`,
      answer: dollars(a + b),
      display: money(a + b),
      hint: 'Add the dollars, then add the cents. 100¢ make $1.',
      explain: `${money(a)} + ${money(b)} = ${money(a + b)}`,
      method: { kind: 'moneyTotal', a, b },
    };
  }
  const cost = price();
  const paid = NOTES.find((n) => n > cost);
  const item = pick(SHOP, rng);
  return {
    answerType: 'numeric',
    prompt: `${name} buys ${withArticle(item)} for ${money(cost)} and pays with a ${money(paid).replace('.00', '')} note. How much change does ${name} get, in dollars?`,
    answer: dollars(paid - cost),
    display: money(paid - cost),
    hint: 'Count up from the price to the next whole dollar, then to the note.',
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
  const [da, db] = [Math.floor(a / 100), Math.floor(b / 100)];
  const [ca, cb] = [a % 100, b % 100];
  const cents = ca + cb;
  const total = a + b;
  const steps = [
    { text: `Draw the two prices as a bar. We want the whole: ${money(a)} + ${money(b)}.`, visual: priceBar(a, b, '?') },
    { text: `Add the dollars: $${da} + $${db} = $${da + db}.`, visual: priceBar(a, b, '?') },
  ];
  const guided = [ask(`$${da} + $${db} = $?`, da + db, priceBar(a, b, '?'))];
  if (cents) {
    steps.push({
      text: cents >= 100
        ? `Add the cents: ${ca}¢ + ${cb}¢ = ${cents}¢. 100¢ make $1, so ${cents}¢ = ${money(cents)}.`
        : `Add the cents: ${ca}¢ + ${cb}¢ = ${cents}¢.`,
      visual: priceBar(a, b, '?'),
    });
    guided.push(ask(`${ca}¢ + ${cb}¢ = ?¢`, cents, priceBar(a, b, '?')));
  }
  steps.push({ text: `Put them together: $${da + db} + ${amount(cents)} = ${money(total)}.`, visual: priceBar(a, b, money(total)) });
  guided.push(ask(`So how much altogether, in dollars? (${money(a)} + ${money(b)})`, dollars(total), priceBar(a, b, '?')));
  return { name: 'Dollars, then cents', steps, guided };
};

const moneyChangeMethod = ({ cost, paid }) => {
  const nextDollar = Math.ceil(cost / 100) * 100;
  const moves = [nextDollar - cost, paid - nextDollar].filter(Boolean);
  const hops = (m) => ({ kind: 'hops', start: cost, moves: m, format: 'money' });
  const steps = [{ text: `Change is what is left: ${money(paid)} − ${money(cost)}. Count up from the price to ${money(paid)}.`, visual: hops([]) }];
  const guided = [];
  let at = cost;
  moves.forEach((m, k) => {
    steps.push({ text: `${money(at)} + ${amount(m)} = ${money(at + m)}.`, visual: hops(moves.slice(0, k + 1)) });
    guided.push(ask(`From ${money(at)} to ${money(at + m)}: how much, in ${m < 100 ? 'cents' : 'dollars'}?`, m < 100 ? m : dollars(m), hops(moves.slice(0, k))));
    at += m;
  });
  steps.push({
    text: moves.length > 1 ? `Add the jumps: ${moves.map(amount).join(' + ')} = ${money(paid - cost)}. That is the change.` : `So the change is ${money(paid - cost)}.`,
    visual: hops(moves),
  });
  guided.push(ask(`So the change is how much, in dollars? (${moves.map(amount).join(' + ')})`, dollars(paid - cost), hops(moves)));
  return { name: 'Count up to give change', steps, guided };
};

export const generators = { moneyProblem };
export const methods = { moneyTotal: moneyTotalMethod, moneyChange: moneyChangeMethod };
