/**
 * Answer checking. Kept separate from the UI so every rule is unit-tested.
 * Input is forgiving about formatting (spaces, commas, "0.50" vs "0.5")
 * but strict about the value.
 */

/** Parse a typed number: "1,250" -> 1250, " 0.5 " -> 0.5, "75%" -> 75. Returns NaN if not a number. */
export const parseNumber = (raw) => {
  const cleaned = String(raw ?? '').trim().replace(/[,\s]/g, '').replace(/^[₱$]/, '').replace(/%$/, '').replace(/^−/, '-');
  if (!/^-?(\d+(\.\d*)?|\.\d+)$/.test(cleaned)) return Number.NaN;
  return Number(cleaned);
};

/**
 * Parse "3/4" -> { n: 3, d: 4 }. Whole numbers are allowed ("2" -> 2/1), and
 * so are mixed numbers ("1 3/4" -> 7/4). Returns null if invalid.
 */
export const parseFraction = (raw) => {
  // A mixed number keeps its space: "1 1/2" is 3/2, never "11/2".
  const mixed = /^\s*(\d+)\s+(\d+)\s*\/\s*(\d+)\s*$/.exec(String(raw ?? ''));
  if (mixed) {
    const [w, n, d] = mixed.slice(1).map(Number);
    return d === 0 ? null : { n: w * d + n, d };
  }
  const cleaned = String(raw ?? '').replace(/\s/g, '');
  const match = /^(-?\d+)(?:\/(\d+))?$/.exec(cleaned);
  if (!match) return null;
  const d = match[2] === undefined ? 1 : Number(match[2]);
  if (d === 0) return null;
  return { n: Number(match[1]), d };
};

const EPSILON = 1e-9;

/**
 * Is the child's answer correct?
 * @param {import('./generators.js').Question} question
 * @param {string} raw What the child typed or tapped.
 * @returns {boolean}
 */
export const isCorrect = (question, raw) => {
  switch (question.answerType) {
    case 'numeric': {
      const value = parseNumber(raw);
      return Number.isFinite(value) && Math.abs(value - Number(question.answer)) < EPSILON;
    }
    case 'fraction': {
      // Any equivalent fraction is accepted: 2/4 is right when the answer is 1/2.
      const given = parseFraction(raw);
      const expected = parseFraction(question.answer);
      return Boolean(given && expected) && given.n * expected.d === expected.n * given.d;
    }
    case 'choice':
      return String(raw) === String(question.answer);
    default:
      return false;
  }
};

/** True when the input is empty or cannot be read, so the UI can ask again without marking it wrong. */
export const isBlank = (question, raw) => {
  if (String(raw ?? '').trim() === '') return true;
  if (question.answerType === 'numeric') return Number.isNaN(parseNumber(raw));
  if (question.answerType === 'fraction') return parseFraction(raw) === null;
  return false;
};
