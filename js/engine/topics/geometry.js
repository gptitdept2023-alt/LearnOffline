/**
 * Geometry: kinds of angles and turns, perimeter and area of rectangles,
 * and lines of symmetry. Generators and techniques together.
 * Shape outlines and their fold lines live here (not in the UI) so the
 * answer and the picture always come from the same data.
 * Pure and DOM-free.
 */

import { randInt, pick } from '../../core/random.js';
import { ask, askChoice, withArticle } from './shared.js';

const capitalise = (text) => text[0].toUpperCase() + text.slice(1);

/* ------------------------------------------------------------------ */
/* Angles and turns                                                    */
/* ------------------------------------------------------------------ */

export const ANGLE_TYPES = ['acute angle', 'right angle', 'obtuse angle'];
const TURNS = { 1: '1/4 turn', 2: '1/2 turn', 3: '3/4 turn', 4: 'full turn' };

/** @param {{forms?: ('classify'|'turns')[]}} spec */
const angles = ({ forms = ['classify', 'turns'] }, rng) => {
  if (pick(forms, rng) === 'turns') {
    const quarters = randInt(1, 4, rng);
    const inDegrees = rng() < 0.6;
    return {
      answerType: 'numeric',
      prompt: inDegrees ? `How many degrees is a ${TURNS[quarters]}?` : `How many right angles make a ${TURNS[quarters]}?`,
      answer: inDegrees ? quarters * 90 : quarters,
      visual: { kind: 'angle', deg: quarters * 90, turn: true },
      hint: 'A 1/4 turn is one right angle, 90°.',
      method: { kind: 'turns', quarters, inDegrees },
    };
  }
  const type = pick(ANGLE_TYPES, rng);
  const deg = type === 'right angle' ? 90 : type === 'acute angle' ? 5 * randInt(4, 16, rng) : 5 * randInt(20, 34, rng);
  const rotate = 15 * randInt(0, 5, rng);
  return {
    answerType: 'choice',
    prompt: 'What kind of angle is this?',
    answer: type,
    choices: [...ANGLE_TYPES],
    visual: { kind: 'angle', deg, rotate },
    hint: 'Compare it with a right angle, a square corner.',
    method: { kind: 'angleType', deg, rotate },
  };
};

const angleTypeMethod = ({ deg, rotate = 0 }) => {
  const type = deg === 90 ? 'right angle' : deg < 90 ? 'acute angle' : 'obtuse angle';
  const compare = deg === 90 ? 'exactly the same as' : deg < 90 ? 'smaller than' : 'bigger than';
  const pic = { kind: 'angle', deg, rotate };
  const withRef = { ...pic, ref: true };
  const compared = { ...withRef, highlight: 'compare' };
  const why = deg > 90
    ? 'The orange part sticks out past the square corner, so the angle is bigger than a right angle.'
    : deg < 90
      ? 'The angle fits inside the square corner and leaves a yellow gap, so it is smaller than a right angle.'
      : 'The angle fits the square corner exactly.';
  return {
    name: 'Compare with a right angle',
    steps: [
      { text: 'A right angle is a square corner, like the corner of a book. It is 90°.', visual: { kind: 'angle', deg: 90, rotate, ref: true, label: '90°' } },
      { text: `Put the square corner on the angle: its corner on the point, and its bottom edge along one arm. Look at the other arm. The angle is ${compare} a right angle.`, visual: withRef },
      { text: `${why} Smaller than a right angle is acute. Bigger is obtuse. So this is ${type === 'right angle' ? 'a right angle' : `an ${type}`}.`, visual: compared },
    ],
    guided: [
      askChoice('Is the angle smaller than, the same as, or bigger than a right angle?', compare.replace('exactly ', ''), ['smaller than', 'the same as', 'bigger than'], withRef),
      askChoice('So what kind of angle is it?', type, ANGLE_TYPES, withRef),
    ],
  };
};

const turnsMethod = ({ quarters, inDegrees }) => {
  const pic = { kind: 'angle', deg: quarters * 90, turn: true };
  return {
    name: 'Count the right angles',
    steps: [
      { text: 'A full turn is 360°. A 1/4 turn is one right angle, 90°.', visual: { kind: 'angle', deg: 90, turn: true } },
      { text: `A ${TURNS[quarters]} is ${quarters} right angle${quarters === 1 ? '' : 's'}.`, visual: pic },
      ...(inDegrees ? [{ text: `${quarters} × 90° = ${quarters * 90}°.`, visual: pic }] : []),
    ],
    guided: inDegrees
      ? [ask(`How many right angles make a ${TURNS[quarters]}?`, quarters, pic), ask(`${quarters} × 90 = ?`, quarters * 90, pic)]
      : [ask(`How many right angles make a ${TURNS[quarters]}?`, quarters, pic)],
  };
};

/* ------------------------------------------------------------------ */
/* Perimeter and area                                                  */
/* ------------------------------------------------------------------ */

/** @param {{forms?: ('perimeter'|'area'|'side')[], max?: number}} spec */
const areaPerimeter = ({ forms = ['perimeter', 'area', 'side'], max = 12 }, rng) => {
  // Length is the longer side (w >= h), as in textbooks.
  const a = randInt(3, max, rng);
  const square = rng() < 0.2;
  const b = square ? a : randInt(2, Math.min(10, max), rng);
  const [w, h] = a >= b ? [a, b] : [b, a];
  const form = pick(forms, rng);
  const shape = w === h ? 'square' : 'rectangle';
  const sides = w === h ? `has sides of ${w} cm` : `is ${w} cm long and ${h} cm wide`;
  if (form === 'perimeter') {
    return {
      answerType: 'numeric',
      prompt: `A ${shape} ${sides}. What is its perimeter, in cm?`,
      answer: 2 * (w + h),
      visual: { kind: 'rectGrid', w, h, mode: 'perimeter' },
      hint: 'Perimeter is the distance all the way round. Add all 4 sides.',
      explain: `${w} + ${h} + ${w} + ${h} = ${2 * (w + h)} cm`,
      method: { kind: 'areaPerimeter', w, h, form },
    };
  }
  if (form === 'area') {
    return {
      answerType: 'numeric',
      prompt: `A ${shape} ${sides}. What is its area, in cm²?`,
      answer: w * h,
      visual: { kind: 'rectGrid', w, h, mode: 'area' },
      hint: 'Area is how many 1 cm squares cover it: rows × squares in each row.',
      explain: `${h} × ${w} = ${w * h} cm²`,
      method: { kind: 'areaPerimeter', w, h, form },
    };
  }
  return {
    answerType: 'numeric',
    prompt: `A rectangle has an area of ${w * h} cm². It is ${w} cm long. How wide is it, in cm?`,
    answer: h,
    visual: { kind: 'rectGrid', w, h, mode: 'side' },
    hint: 'Area = length × width. Which number times the length makes the area?',
    explain: `${w * h} ÷ ${w} = ${h} cm`,
    method: { kind: 'areaPerimeter', w, h, form: 'side' },
  };
};

const areaPerimeterMethod = ({ w, h, form }) => {
  const grid = (mode, extra) => ({ kind: 'rectGrid', w, h, mode, ...extra });
  if (form === 'perimeter') {
    return {
      name: 'Add all the sides',
      steps: [
        { text: 'Perimeter is the distance all the way round the shape.', visual: grid('perimeter') },
        { text: `Opposite sides are equal, so the 4 sides are ${w}, ${h}, ${w} and ${h} cm.`, visual: grid('perimeter', { all: true }) },
        { text: `Add them: ${w} + ${h} + ${w} + ${h} = ${2 * (w + h)} cm. (Or 2 × (${w} + ${h}) = ${2 * (w + h)} cm.)`, visual: grid('perimeter', { all: true }) },
      ],
      guided: [ask(`${w} + ${h} = ?`, w + h, grid('perimeter')), ask(`Double it: 2 × ${w + h} = ?`, 2 * (w + h), grid('perimeter', { all: true }))],
    };
  }
  if (form === 'area') {
    return {
      name: 'Rows of squares',
      steps: [
        { text: 'Area is how many 1 cm squares cover the shape. Each square is 1 cm².', visual: grid('area') },
        { text: `There are ${h} rows, with ${w} squares in each row.`, visual: grid('area', { rows: true }) },
        { text: `${h} × ${w} = ${w * h}. The area is ${w * h} cm².`, visual: grid('area', { rows: true }) },
      ],
      guided: [ask('How many squares are in one row?', w, grid('area')), ask(`${h} rows of ${w}: ${h} × ${w} = ?`, w * h, grid('area', { rows: true }))],
    };
  }
  return {
    name: 'Area = length × width',
    steps: [
      { text: `Area = length × width, so ${w} × ? = ${w * h}.`, visual: grid('side') },
      { text: `Use division: ${w * h} ÷ ${w} = ${h}. The width is ${h} cm.`, visual: grid('area', { rows: true }) },
    ],
    guided: [ask(`${w} × ? = ${w * h}`, h, grid('side'))],
  };
};

/* ------------------------------------------------------------------ */
/* Symmetry                                                            */
/* ------------------------------------------------------------------ */

/**
 * Shapes in a 100 × 100 box. `lines` are true fold lines [x1, y1, x2, y2];
 * `notLines` look tempting but are NOT lines of symmetry (e.g. a rectangle's
 * diagonal), for "Is the dashed line a line of symmetry?".
 */
export const SYMMETRY_SHAPES = {
  square: { points: '20,20 80,20 80,80 20,80', lines: [[50, 8, 50, 92], [8, 50, 92, 50], [12, 12, 88, 88], [88, 12, 12, 88]], notLines: [[30, 8, 70, 92]] },
  rectangle: { points: '10,28 90,28 90,72 10,72', lines: [[50, 16, 50, 84], [2, 50, 98, 50]], notLines: [[6, 24, 94, 76]] },
  'equilateral triangle': { points: '50,12 90,81 10,81', lines: [[50, 4, 50, 90], [93, 85, 26, 47], [7, 85, 74, 47]], notLines: [[10, 60, 90, 60]] },
  pentagon: { points: Array.from({ length: 5 }, (_, i) => polar(i, 5)).join(' '), lines: Array.from({ length: 5 }, (_, i) => axis(i, 5)), notLines: [[8, 50, 92, 50]] },
  hexagon: { points: Array.from({ length: 6 }, (_, i) => polar(i, 6)).join(' '), lines: Array.from({ length: 6 }, (_, i) => axis(i, 6)), notLines: [[30, 10, 70, 90]] },
  kite: { points: '50,8 76,40 50,92 24,40', lines: [[50, 2, 50, 98]], notLines: [[16, 40, 84, 40]] },
  parallelogram: { points: '28,28 92,28 72,72 8,72', lines: [], notLines: [[50, 16, 50, 84], [2, 50, 98, 50]] },
  heart: { path: 'M50 88 C20 66 6 50 6 32 C6 18 17 8 30 8 C40 8 46 14 50 22 C54 14 60 8 70 8 C83 8 94 18 94 32 C94 50 80 66 50 88 Z', lines: [[50, 4, 50, 96]], notLines: [[4, 40, 96, 40]] },
};

/** Vertex i of a regular n-gon (first vertex at the top), as "x,y". */
function polar(i, n) {
  const a = -Math.PI / 2 + (2 * Math.PI * i) / n;
  return `${(50 + 42 * Math.cos(a)).toFixed(1)},${(52 + 42 * Math.sin(a)).toFixed(1)}`;
}
/** Fold line i of a regular n-gon through the centre. */
function axis(i, n) {
  const a = -Math.PI / 2 + (Math.PI * i) / n;
  const r = 48;
  return [50 + r * Math.cos(a), 52 + r * Math.sin(a), 50 - r * Math.cos(a), 52 - r * Math.sin(a)].map((v) => Math.round(v * 10) / 10);
}

/** @param {{forms?: ('count'|'isLine')[]}} spec */
const symmetry = ({ forms = ['count', 'isLine'] }, rng) => {
  const shape = pick(Object.keys(SYMMETRY_SHAPES), rng);
  const data = SYMMETRY_SHAPES[shape];
  if (pick(forms, rng) === 'count') {
    const n = data.lines.length;
    return {
      answerType: 'numeric',
      prompt: `How many lines of symmetry does this ${shape} have?`,
      answer: n,
      visual: { kind: 'symmetry', shape },
      hint: 'Imagine folding it. A fold line where both halves match exactly is a line of symmetry.',
      method: { kind: 'symmetry', shape, form: 'count' },
    };
  }
  const yes = data.lines.length > 0 && rng() < 0.5;
  const line = yes ? pick(data.lines, rng) : pick(data.notLines, rng);
  return {
    answerType: 'choice',
    prompt: 'Is the dashed line a line of symmetry?',
    answer: yes ? 'yes' : 'no',
    choices: ['yes', 'no'],
    visual: { kind: 'symmetry', shape, line },
    hint: 'Fold along the dashed line in your head. Do the two halves fit exactly on top of each other?',
    method: { kind: 'symmetry', shape, form: 'isLine', line, yes },
  };
};

const symmetryMethod = ({ shape, form, line, yes }) => {
  const data = SYMMETRY_SHAPES[shape];
  const n = data.lines.length;
  if (form === 'isLine') {
    return {
      name: 'Fold and check',
      steps: [
        { text: 'A line of symmetry folds a shape into two halves that match exactly.', visual: { kind: 'symmetry', shape, line } },
        { text: yes
          ? 'Fold along the dashed line: one half lands exactly on the other half.'
          : 'Fold along the dashed line: the two halves do not land on each other. Parts stick out.', visual: { kind: 'symmetry', shape, line, fold: true } },
        { text: yes ? 'So yes, it is a line of symmetry.' : `So no, it is not a line of symmetry. ${n ? `The ${shape} has ${n} line${n === 1 ? '' : 's'} of symmetry, shown in green.` : `${capitalise(withArticle(shape))} has no lines of symmetry.`}`, visual: { kind: 'symmetry', shape, line, showAll: true } },
      ],
      guided: [askChoice('After the fold, do both halves match exactly?', yes ? 'yes' : 'no', ['yes', 'no'], { kind: 'symmetry', shape, line, fold: true })],
    };
  }
  return {
    name: 'Find every fold line',
    steps: [
      { text: 'A line of symmetry folds a shape into two halves that match exactly. Try folding the shape every way.', visual: { kind: 'symmetry', shape } },
      { text: n ? `These folds work. Count them: there ${n === 1 ? 'is 1 line' : `are ${n} lines`}.` : `No fold works: the halves never match. There are 0 lines of symmetry.`, visual: { kind: 'symmetry', shape, showAll: true } },
      { text: `So ${withArticle(shape)} has ${n} line${n === 1 ? '' : 's'} of symmetry.`, visual: { kind: 'symmetry', shape, showAll: true } },
    ],
    guided: [ask(`Count the fold lines. How many lines of symmetry does the ${shape} have?`, n, { kind: 'symmetry', shape, showAll: true })],
  };
};

export const generators = { angles, areaPerimeter, symmetry };
export const methods = { angleType: angleTypeMethod, turns: turnsMethod, areaPerimeter: areaPerimeterMethod, symmetry: symmetryMethod };
