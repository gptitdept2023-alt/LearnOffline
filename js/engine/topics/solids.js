/**
 * Geometry for Grades 5 and 6: area of a triangle, angles in a triangle,
 * volume of cubes and cuboids (and litres), and circles (π = 3.14).
 * Generators and techniques together; the pictures are drawn by
 * ui/components/visualsSolids.js from the specs made here.
 * Pure and DOM-free.
 */

import { randInt, pick } from '../../core/random.js';
import { ask, askChoice, drawUntil, dec, fmt, tidyNumber } from './shared.js';

/* ------------------------------------------------------------------ */
/* Area of a triangle                                                  */
/* ------------------------------------------------------------------ */

/** @param {{forms?: ('area'|'height')[], max?: number}} spec */
const triangleArea = ({ forms = ['area'], max = 16 }, rng) => {
  const [b, h] = drawUntil(() => [randInt(3, max, rng), randInt(2, max, rng)], ([x, y]) => (x * y) % 2 === 0);
  const apex = pick([0, 0.3, 0.5, 0.7, 1], rng);
  const A = (b * h) / 2;
  const form = pick(forms, rng);
  if (form === 'height') {
    return {
      answerType: 'numeric',
      prompt: `A triangle has an area of ${A} cm² and a base of ${b} cm. What is its height, in cm?`,
      answer: h,
      visual: { kind: 'triangle', base: b, height: h, apex, hideHeight: true },
      hint: 'Area = base × height ÷ 2. Double the area first.',
      method: { kind: 'triangleArea', b, h, apex, form },
    };
  }
  return {
    answerType: 'numeric',
    prompt: `A triangle has a base of ${b} cm and a height of ${h} cm. What is its area, in cm²?`,
    answer: A,
    visual: { kind: 'triangle', base: b, height: h, apex },
    hint: 'The triangle is half of a rectangle. Area = base × height ÷ 2.',
    explain: `${b} × ${h} ÷ 2 = ${A} cm²`,
    method: { kind: 'triangleArea', b, h, apex, form },
  };
};

const triangleAreaMethod = ({ b, h, apex, form }) => {
  const A = (b * h) / 2;
  const pic = { kind: 'triangle', base: b, height: h, apex, box: true };
  if (form === 'height') {
    return {
      name: 'Work backwards from the area',
      steps: [
        { text: 'The triangle is half of a rectangle with the same base and height. Area = base × height ÷ 2.', visual: { ...pic, hideHeight: true } },
        { text: `The rectangle has double the area: ${A} × 2 = ${A * 2} cm².` },
        { text: `Rectangle area = base × height, so height = ${A * 2} ÷ ${b} = ${h} cm.`, visual: pic },
      ],
      guided: [ask(`Double the area: ${A} × 2 = ?`, A * 2), ask(`${A * 2} ÷ ${b} = ?`, h)],
    };
  }
  return {
    name: 'Half of a rectangle',
    steps: [
      { text: `Draw a rectangle round the triangle, ${b} cm by ${h} cm.`, visual: pic },
      { text: `The rectangle's area is ${b} × ${h} = ${b * h} cm². The triangle fills exactly half of it.` },
      { text: `Half of ${b * h} is ${b * h} ÷ 2 = ${A}. The area is ${A} cm².` },
    ],
    guided: [ask(`Rectangle: ${b} × ${h} = ?`, b * h), ask(`Half: ${b * h} ÷ 2 = ?`, A)],
  };
};

/* ------------------------------------------------------------------ */
/* Angles in a triangle                                                */
/* ------------------------------------------------------------------ */

/** @param {{forms?: ('two'|'right'|'isosceles')[]}} spec */
const triangleAngles = ({ forms = ['two', 'right'] }, rng) => {
  const form = pick(forms, rng);
  if (form === 'isosceles') {
    const top = 2 * drawUntil(() => randInt(10, 70, rng), (t) => t !== 30);
    const base = (180 - top) / 2;
    return {
      answerType: 'numeric',
      prompt: `In an isosceles triangle, the top angle is ${top}°. The two base angles are equal. What is one base angle, in degrees?`,
      answer: base,
      visual: { kind: 'triangle', angles: [base, base, top], labels: ['?', '', `${top}°`], equal: true },
      hint: 'The 3 angles add up to 180°. The two base angles share what is left equally.',
      method: { kind: 'angleSum', known: [top], isosceles: true },
    };
  }
  const right = form === 'right';
  const a = right ? 90 : 5 * randInt(4, 22, rng);
  const b = right ? 5 * randInt(4, 14, rng) : 5 * drawUntil(() => randInt(4, 22, rng), (x) => 180 - a - 5 * x >= 20 && 5 * x !== a);
  const c = 180 - a - b;
  return {
    answerType: 'numeric',
    prompt: right
      ? `A triangle has a right angle and an angle of ${b}°. What is the third angle, in degrees?`
      : `Two angles of a triangle are ${a}° and ${b}°. What is the third angle, in degrees?`,
    answer: c,
    visual: { kind: 'triangle', angles: [a, b, c], labels: [right ? '90°' : `${a}°`, `${b}°`, '?'], rightAt: right ? 0 : undefined },
    hint: 'The 3 angles of a triangle add up to 180°.',
    method: { kind: 'angleSum', known: [a, b] },
  };
};

const angleSum = ({ known, isosceles = false }) => {
  if (isosceles) {
    const [top] = known;
    const left = 180 - top;
    return {
      name: 'Angles add up to 180°',
      steps: [
        { text: 'The 3 angles of any triangle add up to 180°.' },
        { text: `Take away the top angle: 180 − ${top} = ${left}°. That is left for the two base angles.` },
        { text: `They are equal, so each one is ${left} ÷ 2 = ${left / 2}°.` },
      ],
      guided: [ask(`180 − ${top} = ?`, left), ask(`${left} ÷ 2 = ?`, left / 2)],
    };
  }
  const sum = known[0] + known[1];
  return {
    name: 'Angles add up to 180°',
    steps: [
      { text: 'The 3 angles of any triangle add up to 180°. Tear off the corners and they make a straight line.' },
      { text: `Add the angles we know: ${known[0]} + ${known[1]} = ${sum}°.` },
      { text: `The third angle is 180 − ${sum} = ${180 - sum}°.` },
    ],
    guided: [ask(`${known[0]} + ${known[1]} = ?`, sum), ask(`180 − ${sum} = ?`, 180 - sum)],
  };
};

/* ------------------------------------------------------------------ */
/* Volume                                                              */
/* ------------------------------------------------------------------ */

/** @param {{forms?: ('cuboid'|'cube'|'missing'|'litres')[]}} spec */
const volume = ({ forms = ['cuboid', 'cube'] }, rng) => {
  const form = pick(forms, rng);
  if (form === 'litres') {
    const [l, w, h] = [10 * randInt(2, 6, rng), 10 * randInt(2, 5, rng), 10 * randInt(2, 5, rng)];
    const V = l * w * h;
    return {
      answerType: 'numeric',
      prompt: `A tank is ${l} cm long, ${w} cm wide and ${h} cm high. How many litres of water does it hold when full? (1 ℓ = 1,000 cm³)`,
      answer: V / 1000,
      visual: { kind: 'cuboid', l, w, h },
      hint: 'Find the volume in cm³ first. Every 1,000 cm³ is 1 litre.',
      method: { kind: 'volumeLayers', l, w, h, form },
    };
  }
  if (form === 'cube') {
    const s = randInt(2, 10, rng);
    return {
      answerType: 'numeric',
      prompt: `A cube has edges of ${s} cm. What is its volume, in cm³?`,
      answer: s ** 3,
      visual: { kind: 'cuboid', l: s, w: s, h: s, cubes: s <= 6 },
      hint: 'Volume = length × width × height. All the edges of a cube are the same.',
      method: { kind: 'volumeLayers', l: s, w: s, h: s, form },
    };
  }
  const [l, w, h] = [randInt(2, 12, rng), randInt(2, 8, rng), randInt(2, 10, rng)];
  if (form === 'missing') {
    return {
      answerType: 'numeric',
      prompt: `A box has a volume of ${fmt(l * w * h)} cm³. It is ${l} cm long and ${w} cm wide. How high is it, in cm?`,
      answer: h,
      visual: { kind: 'cuboid', l, w, h, unknown: 'h' },
      hint: `Find the area of the bottom layer first: ${l} × ${w}.`,
      method: { kind: 'volumeLayers', l, w, h, form },
    };
  }
  return {
    answerType: 'numeric',
    prompt: `A box is ${l} cm long, ${w} cm wide and ${h} cm high. What is its volume, in cm³?`,
    answer: l * w * h,
    visual: { kind: 'cuboid', l, w, h, cubes: l <= 8 && w <= 6 && h <= 8 },
    hint: 'Volume = length × width × height.',
    explain: `${l} × ${w} × ${h} = ${fmt(l * w * h)} cm³`,
    method: { kind: 'volumeLayers', l, w, h, form },
  };
};

const volumeLayers = ({ l, w, h, form }) => {
  const layer = l * w;
  const V = layer * h;
  const cubes = l <= 8 && w <= 6 && h <= 8;
  const pic = { kind: 'cuboid', l, w, h, cubes };
  if (form === 'missing') {
    return {
      name: 'Bottom layer, then layers',
      steps: [
        { text: `The bottom layer is ${l} × ${w} = ${layer} cubes of 1 cm³.`, visual: { ...pic, unknown: 'h' } },
        { text: `Each layer is ${layer} cm³. How many layers make ${fmt(V)} cm³? ${fmt(V)} ÷ ${layer} = ${h}.` },
        { text: `So the box is ${h} cm high.`, visual: pic },
      ],
      guided: [ask(`Bottom layer: ${l} × ${w} = ?`, layer), ask(`${fmt(V)} ÷ ${layer} = ?`, h)],
    };
  }
  const steps = [
    { text: `Fill the box with 1 cm cubes. The bottom layer has ${l} × ${w} = ${layer} cubes.`, visual: pic },
    { text: `There are ${h} layers: ${layer} × ${h} = ${fmt(V)}. The volume is ${fmt(V)} cm³.` },
  ];
  const guided = [ask(`Bottom layer: ${l} × ${w} = ?`, layer), ask(`${layer} × ${h} = ?`, V)];
  if (form === 'litres') {
    steps.push({ text: `1,000 cm³ = 1 ℓ, so ${fmt(V)} cm³ = ${fmt(V)} ÷ 1,000 = ${V / 1000} ℓ.` });
    guided.push(ask(`${fmt(V)} ÷ 1,000 = ?`, V / 1000));
  }
  return { name: 'Count the layers', steps, guided };
};

/* ------------------------------------------------------------------ */
/* Circles                                                             */
/* ------------------------------------------------------------------ */

const PI_TEXT = 'Use π = 3.14.';

/** @param {{forms?: ('diameter'|'radius'|'circumference'|'area')[], max?: number}} spec */
const circle = ({ forms = ['diameter', 'radius', 'circumference', 'area'], max = 12 }, rng) => {
  const form = pick(forms, rng);
  const r = randInt(2, max, rng);
  const d = 2 * r;
  if (form === 'diameter' || form === 'radius') {
    const toD = form === 'diameter';
    return {
      answerType: 'numeric',
      prompt: toD ? `A circle has a radius of ${r} cm. What is its diameter, in cm?` : `A circle has a diameter of ${d} cm. What is its radius, in cm?`,
      answer: toD ? d : r,
      visual: { kind: 'circle', show: toD ? 'radius' : 'diameter', label: toD ? `${r} cm` : `${d} cm` },
      hint: 'The diameter goes right across, through the centre. It is 2 radii long.',
      method: { kind: 'circleFormula', r, find: form, given: toD ? 'r' : 'd' },
    };
  }
  if (form === 'circumference') {
    const given = rng() < 0.5 ? 'd' : 'r';
    return {
      answerType: 'numeric',
      prompt: `A circle has a ${given === 'd' ? `diameter of ${d}` : `radius of ${r}`} cm. ${PI_TEXT} What is its circumference, in cm?`,
      answer: tidyNumber((314 * d) / 100),
      visual: { kind: 'circle', show: given === 'd' ? 'diameter' : 'radius', label: `${given === 'd' ? d : r} cm` },
      hint: 'Circumference = π × diameter.',
      method: { kind: 'circleFormula', r, find: form, given },
    };
  }
  // Area from the radius, or (harder) from the diameter: halve it first.
  const given = rng() < 0.35 ? 'd' : 'r';
  return {
    answerType: 'numeric',
    prompt: `A circle has a ${given === 'd' ? `diameter of ${d}` : `radius of ${r}`} cm. ${PI_TEXT} What is its area, in cm²?`,
    answer: tidyNumber((314 * r * r) / 100),
    visual: { kind: 'circle', show: given === 'd' ? 'diameter' : 'radius', label: `${given === 'd' ? d : r} cm` },
    hint: given === 'd' ? 'Find the radius first: half the diameter. Area = π × radius × radius.' : 'Area = π × radius × radius.',
    method: { kind: 'circleFormula', r, find: form, given },
  };
};

const circleFormula = ({ r, find, given }) => {
  const d = 2 * r;
  const radiusPic = { kind: 'circle', show: 'radius', label: `${r} cm` };
  const diameterPic = { kind: 'circle', show: 'diameter', label: `${d} cm` };
  if (find === 'diameter' || find === 'radius') {
    const toD = find === 'diameter';
    return {
      name: 'Diameter = 2 radii',
      steps: [
        { text: 'The radius goes from the centre to the edge. The diameter goes right across, through the centre.', visual: { kind: 'circle', show: 'both' } },
        { text: toD ? `The diameter is 2 radii: 2 × ${r} = ${d} cm.` : `The radius is half the diameter: ${d} ÷ 2 = ${r} cm.`, visual: toD ? diameterPic : radiusPic },
      ],
      guided: [toD ? ask(`2 × ${r} = ?`, d) : ask(`${d} ÷ 2 = ?`, r)],
    };
  }
  if (find === 'circumference') {
    const C = tidyNumber((314 * d) / 100);
    return {
      name: 'Circumference = π × diameter',
      steps: [
        { text: 'The circumference is the distance all the way round. It is a little more than 3 diameters: π × diameter, with π = 3.14.', visual: given === 'd' ? diameterPic : radiusPic },
        ...(given === 'r' ? [{ text: `First the diameter: 2 × ${r} = ${d} cm.`, visual: diameterPic }] : []),
        { text: `3.14 × ${d} = ${dec(C)}. The circumference is ${dec(C)} cm.` },
      ],
      guided: [
        ...(given === 'r' ? [ask(`Diameter = 2 × ${r} = ?`, d)] : []),
        askChoice('Circumference = π × ?', 'diameter', ['diameter', 'radius']),
        ask(`3.14 × ${d} = ?`, C),
      ],
    };
  }
  const A = tidyNumber((314 * r * r) / 100);
  return {
    name: 'Area = π × radius × radius',
    steps: [
      { text: 'Area of a circle = π × radius × radius, with π = 3.14.', visual: given === 'd' ? diameterPic : radiusPic },
      ...(given === 'd' ? [{ text: `First the radius, half the diameter: ${d} ÷ 2 = ${r} cm.`, visual: radiusPic }] : []),
      { text: `radius × radius = ${r} × ${r} = ${r * r}.` },
      { text: `3.14 × ${r * r} = ${dec(A)}. The area is ${dec(A)} cm².` },
    ],
    guided: [...(given === 'd' ? [ask(`Radius = ${d} ÷ 2 = ?`, r)] : []), ask(`${r} × ${r} = ?`, r * r), ask(`3.14 × ${r * r} = ?`, A)],
  };
};

export const generators = { triangleArea, triangleAngles, volume, circle };
export const methods = { triangleArea: triangleAreaMethod, angleSum, volumeLayers, circleFormula };
