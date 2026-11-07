/**
 * Measurement: converting and adding lengths, masses and volumes
 * (km/m, m/cm, cm/mm, kg/g, ℓ/ml). Generators and techniques together.
 *
 * Technique: change everything into the smaller unit with a bar model
 * (each big unit is one long piece, e.g. 1 m = 100 cm), then add or take away.
 * Pure and DOM-free.
 */

import { randInt, pick } from '../../core/random.js';
import { fmt, ask } from './shared.js';

/** Unit pairs: one big unit = `factor` small units. */
export const UNIT_PAIRS = {
  length: [
    { big: 'km', small: 'm', factor: 1000, bigName: 'kilometre', smallName: 'metre' },
    { big: 'm', small: 'cm', factor: 100, bigName: 'metre', smallName: 'centimetre' },
    { big: 'cm', small: 'mm', factor: 10, bigName: 'centimetre', smallName: 'millimetre' },
  ],
  mass: [{ big: 'kg', small: 'g', factor: 1000, bigName: 'kilogram', smallName: 'gram' }],
  volume: [{ big: 'ℓ', small: 'ml', factor: 1000, bigName: 'litre', smallName: 'millilitre' }],
};

/** "3 m 45 cm", or "3 m" / "45 cm" when one part is 0 (never "and 0 cm"). */
const compound = (bigCount, smallCount, pair) =>
  [bigCount && `${fmt(bigCount)} ${pair.big}`, (smallCount || !bigCount) && `${fmt(smallCount)} ${pair.small}`].filter(Boolean).join(' ');

/** Bar: one piece per big unit (when few enough to draw) plus the small part. */
const unitBar = (bigCount, smallCount, pair, braceText) => {
  const pieces = bigCount <= 6
    ? Array.from({ length: bigCount }, () => ({ units: pair.factor, text: `${fmt(pair.factor)} ${pair.small}` }))
    : [{ units: pair.factor * bigCount, text: `${bigCount} × ${fmt(pair.factor)} ${pair.small}` }];
  const segments = smallCount ? [...pieces, { units: Math.max(smallCount, pair.factor * 0.15), text: `${fmt(smallCount)} ${pair.small}` }] : pieces;
  return {
    kind: 'bar',
    rows: [{ label: '', segments }],
    braces: [{ row: 0, from: 0, to: segments.length, side: 'above', text: braceText }],
  };
};

/* ------------------------------------------------------------------ */
/* Generator                                                           */
/* ------------------------------------------------------------------ */

/**
 * @param {{kinds?: string[], forms?: string[]}} spec
 *   forms: 'toSmall' (3 m 45 cm = ? cm), 'toBig' (2,350 g = 2 kg ? g),
 *          'whole' (4 kg = ? g), 'add' (2 kg 450 g + 1 kg 700 g = ? g).
 */
const convertUnits = ({ kinds = ['length', 'mass', 'volume'], forms = ['toSmall', 'toBig', 'whole'] }, rng) => {
  const pair = pick(UNIT_PAIRS[pick(kinds, rng)], rng);
  const form = pick(forms, rng);
  const maxBig = pair.factor === 10 ? 20 : 9;
  const small = () => randInt(1, pair.factor - 1, rng);
  const method = (extra) => ({ kind: 'convertUnits', form, factor: pair.factor, big: pair.big, small: pair.small, ...extra });

  if (form === 'add') {
    const [b1, s1, b2, s2] = [randInt(1, 5, rng), small(), randInt(1, 4, rng), small()];
    const total = (b1 + b2) * pair.factor + s1 + s2;
    return {
      answerType: 'numeric',
      prompt: `${compound(b1, s1, pair)} + ${compound(b2, s2, pair)} = ? ${pair.small}`,
      answer: total,
      hint: `Change both into ${pair.small} first. 1 ${pair.big} = ${fmt(pair.factor)} ${pair.small}.`,
      explain: `${fmt(b1 * pair.factor + s1)} ${pair.small} + ${fmt(b2 * pair.factor + s2)} ${pair.small} = ${fmt(total)} ${pair.small}`,
      method: method({ parts: [[b1, s1], [b2, s2]] }),
    };
  }
  if (form === 'toBig') {
    const [b, s] = [randInt(1, maxBig, rng), small()];
    const total = b * pair.factor + s;
    return {
      answerType: 'numeric',
      prompt: `${fmt(total)} ${pair.small} = ${b} ${pair.big} ? ${pair.small}`,
      answer: s,
      hint: `1 ${pair.big} = ${fmt(pair.factor)} ${pair.small}. Take away the whole ${pair.big} first.`,
      explain: `${fmt(total)} ${pair.small} = ${compound(b, s, pair)}`,
      method: method({ parts: [[b, s]] }),
    };
  }
  const b = randInt(1, maxBig, rng);
  const s = form === 'whole' ? 0 : small();
  return {
    answerType: 'numeric',
    prompt: `${compound(b, s, pair)} = ? ${pair.small}`,
    answer: b * pair.factor + s,
    hint: `1 ${pair.big} = ${fmt(pair.factor)} ${pair.small}.`,
    explain: `${compound(b, s, pair)} = ${fmt(b * pair.factor + s)} ${pair.small}`,
    method: method({ form: 'toSmall', parts: [[b, s]] }),
  };
};

/* ------------------------------------------------------------------ */
/* Technique                                                           */
/* ------------------------------------------------------------------ */

const convertMethod = ({ form, factor, big, small, parts }) => {
  const pair = { factor, big, small };
  const fact = `1 ${big} = ${fmt(factor)} ${small}.`;
  /** Steps and guided questions that turn "b big s small" into small units. */
  const toSmall = ([b, s], label = '') => {
    const whole = b * factor;
    const steps = [
      { text: b === 1 ? `${label}${fact}` : `${label}${fact} So ${b} ${big} = ${b} × ${fmt(factor)} = ${fmt(whole)} ${small}.`, visual: unitBar(b, 0, pair, `${b} ${big}`) },
    ];
    const guided = [ask(`${b} × ${fmt(factor)} = ?`, whole, unitBar(b, 0, pair, `${b} ${big}`))];
    if (s) {
      steps.push({ text: `Add the ${fmt(s)} ${small}: ${fmt(whole)} + ${fmt(s)} = ${fmt(whole + s)} ${small}.`, visual: unitBar(b, s, pair, `${compound(b, s, pair)} = ${fmt(whole + s)} ${small}`) });
      guided.push(ask(`${fmt(whole)} + ${fmt(s)} = ?`, whole + s, unitBar(b, s, pair, '?')));
    }
    return { steps, guided };
  };

  if (form === 'toBig') {
    const [[b, s]] = parts;
    const total = b * factor + s;
    return {
      name: 'Take out the whole units',
      steps: [
        { text: `${fact} So ${b} ${big} = ${fmt(b * factor)} ${small}.`, visual: unitBar(b, s, pair, `${fmt(total)} ${small}`) },
        { text: `Take the ${b} ${big} away: ${fmt(total)} − ${fmt(b * factor)} = ${fmt(s)}. So ${fmt(total)} ${small} = ${compound(b, s, pair)}.`, visual: unitBar(b, s, pair, compound(b, s, pair)) },
      ],
      guided: [
        ask(`${b} × ${fmt(factor)} = ?`, b * factor, unitBar(b, s, pair, `${fmt(total)} ${small}`)),
        ask(`${fmt(total)} − ${fmt(b * factor)} = ?`, s, unitBar(b, s, pair, `${fmt(total)} ${small}`)),
      ],
    };
  }
  if (form === 'add') {
    const [p1, p2] = parts;
    const a1 = toSmall(p1, 'First: ');
    const a2 = toSmall(p2, 'Next: ');
    const v1 = p1[0] * factor + p1[1];
    const v2 = p2[0] * factor + p2[1];
    const sumBar = { kind: 'bar', rows: [{ label: '', segments: [{ units: v1, text: `${fmt(v1)} ${small}` }, { units: v2, text: `${fmt(v2)} ${small}` }] }], braces: [{ row: 0, from: 0, to: 2, side: 'above', text: '?' }] };
    return {
      name: 'Change to the smaller unit, then add',
      steps: [
        ...a1.steps,
        ...a2.steps,
        { text: `Now add: ${fmt(v1)} + ${fmt(v2)} = ${fmt(v1 + v2)} ${small}.`, visual: sumBar },
      ],
      guided: [...a1.guided, ...a2.guided, ask(`${fmt(v1)} + ${fmt(v2)} = ?`, v1 + v2, sumBar)],
    };
  }
  const [b, sm] = parts[0];
  const { steps, guided } = toSmall(parts[0]);
  return {
    name: 'Change to the smaller unit',
    steps: [{ text: b <= 6 ? `Draw ${b} ${big} as ${b} long piece${b === 1 ? '' : 's'}. Each piece is 1 ${big}, which is ${fmt(factor)} ${small}.` : `Draw ${b} ${big} as one long bar: ${b} × ${fmt(factor)} ${small}. Each 1 ${big} is ${fmt(factor)} ${small}.`, visual: unitBar(b, sm, pair, compound(b, sm, pair)) }, ...steps],
    guided,
  };
};

export const generators = { convertUnits };
export const methods = { convertUnits: convertMethod };
