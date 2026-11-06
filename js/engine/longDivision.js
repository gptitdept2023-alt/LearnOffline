/**
 * Long division, one place at a time (biggest place first).
 *
 * Shared by the technique text (techniques.js) and the long-division picture
 * (visuals.js), so the words and the layout can never disagree.
 * Pure and DOM-free.
 */

/**
 * @param {number} dividend Whole number >= 0.
 * @param {number} divisor  Whole number >= 1.
 * @returns {{i: number, digit: number, cur: number, q: number, product: number, rem: number, lead: boolean}[]}
 *   One entry per digit of the dividend (left to right):
 *   - cur:     the number being shared at this place (carried + this digit)
 *   - q:       how many each group gets (the quotient digit)
 *   - product: q × divisor (what is used up)
 *   - rem:     what is left over and carried to the next place
 *   - lead:    true for leading places too small to share (nothing written on top)
 */
export const longDivisionSteps = (dividend, divisor) => {
  const digits = String(dividend).split('').map(Number);
  const steps = [];
  let carried = 0;
  let started = false;
  digits.forEach((digit, i) => {
    const cur = carried * 10 + digit;
    const q = Math.floor(cur / divisor);
    const lead = !started && q === 0 && i < digits.length - 1;
    if (!lead) started = true;
    const product = q * divisor;
    const rem = cur - product;
    steps.push({ i, digit, cur, q, product, rem, lead });
    carried = rem;
  });
  return steps;
};
