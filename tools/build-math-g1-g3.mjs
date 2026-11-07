// Builds packs/math-g1.json, math-g2.json, math-g3.json:  node tools/build-math-g1-g3.mjs
// Each skill's lesson: hand-written CPA intro steps, then a worked example and
// a "your turn" taken from the skill's OWN generator (seeded), so every number
// in a lesson is produced and checked by the same code as practice.
import { writeFileSync } from 'node:fs';
import { generate } from '../js/engine/generators.js';
import { methodFor } from '../js/engine/techniques.js';
import { seededRng } from '../js/core/random.js';

const ROOT = new URL('../packs/', import.meta.url).pathname;
const fmt = (n) => Number(n).toLocaleString('en-US');

/** First generated question passing `ok`, from a seed based on the skill id. */
const example = (gen, ok = () => true, salt = 1) => {
  const rng = seededRng([...gen.type].reduce((a, c) => a + c.charCodeAt(0), 0) * 97 + salt * 7919);
  for (let i = 0; i < 2000; i += 1) {
    const q = generate(gen, rng);
    if (ok(q)) return q;
  }
  throw new Error(`no example for ${JSON.stringify(gen)}`);
};

/** A numeric answer turned into 3 choices for a quick check. */
const numericChoices = (answer) => {
  const a = Number(answer);
  const near = [a + 1, a - 1, a + 10, a - 10].filter((n) => n >= 0 && n !== a);
  return [a, near[0], near[1]].sort((x, y) => x - y).map(fmt);
};

/** Worked example + your turn from the generator; a quick check when the question has no technique. */
const practiceSteps = (gen, ok) => {
  const q1 = example(gen, ok, 1);
  const q2 = example(gen, (q) => ok(q) && `${q.prompt}${q.answer}` !== `${q1.prompt}${q1.answer}`, 2);
  if (q1.method && methodFor(q1)) {
    const answer = methodFor(q2).guided.at(-1).answer;
    return [
      { stage: 'technique', text: `Watch how: ${q1.prompt}`, interact: { kind: 'worked', method: q1.method } },
      { stage: 'try', text: `Your turn: ${q2.prompt}`, interact: { kind: 'tryIt', method: { ...q2.method, answer } } },
    ];
  }
  const choices = q2.answerType === 'choice' ? q2.choices : numericChoices(q2.answer);
  const answer = q2.answerType === 'choice' ? q2.answer : fmt(q2.answer);
  return [{
    stage: 'abstract',
    text: `Your turn: ${q2.prompt}`,
    interact: { kind: 'check', prompt: q2.prompt, ...(q2.visual ? { visual: q2.visual } : {}), choices, answer, explain: q2.explain || `The answer is ${q2.spoken || answer}.` },
  }];
};

const skill = (skillId, title, generator, intro, ok = () => true) => ({
  skillId,
  title,
  lesson: { steps: [...intro.map(([stage, text, visual]) => ({ stage, text, ...(visual ? { visual } : {}) })), ...practiceSteps(generator, ok)] },
  generator,
});
const topic = (topicId, title, icon, summary, skills, extra = {}) => ({ topicId, title, icon, summary, ...extra, skills });
const challenge = (prefix, skills) => topic(`${prefix}-challenge`, 'Challenge zone', '⭐', 'Ready for more? These go a step beyond this grade.', skills.map(([id, title, generator]) => ({ skillId: id, title, generator })), { challenge: true });

/* ------------------------------------------------------------------ */
/* Grade 1                                                             */
/* ------------------------------------------------------------------ */
const g1 = [
  topic('g1-numbers', 'Numbers to 100', '🔢', 'Count, read and compare numbers to 100.', [
    skill('g1-count', 'Count in tens and ones', { type: 'count', max: 50 }, [
      ['concrete', 'Count big amounts by making groups of ten. A full ten frame is 10.', { kind: 'tenFrames', value: 34 }],
      ['pictorial', '3 full frames are 3 tens: 10, 20, 30. Then count on the ones: 31, 32, 33, 34.', { kind: 'tenFrames', value: 34 }],
    ]),
    skill('g1-place-value', 'Tens and ones', { type: 'placeValue', digits: 2 }, [
      ['concrete', 'A rod is 10 cubes joined together. 47 is 4 rods and 7 cubes.', { kind: 'blocks', value: 47 }],
      ['pictorial', 'In 47, the 4 is in the tens place, so it stands for 40. The 7 is in the ones place.', { kind: 'blocks', value: 47 }],
    ]),
    skill('g1-compare', 'Greater or smaller', { type: 'compare', min: 1, max: 100 }, [
      ['pictorial', 'Compare the tens first. 52 has 5 tens and 38 has 3 tens, so 52 is greater.', { kind: 'stack', items: [{ kind: 'blocks', value: 52 }, { kind: 'blocks', value: 38 }] }],
      ['abstract', 'If the tens are the same, compare the ones: 64 is greater than 61.'],
    ]),
    skill('g1-order', 'Before and after', { type: 'numberOrder', max: 100 }, [
      ['pictorial', 'On a number line, the number after is 1 more. The number before is 1 less.', { kind: 'numberLine', from: 56, to: 62, mark: 59 }],
    ]),
  ]),
  topic('g1-bonds', 'Number bonds', '🔗', 'Two parts make a whole.', [
    skill('g1-bonds-10', 'Number bonds to 10', { type: 'numberBond', minWhole: 5, maxWhole: 10 }, [
      ['concrete', '7 counters can be split into 4 and 3. 4 and 3 make 7.', { kind: 'tenFrames', value: 7 }],
      ['pictorial', 'A number bond shows the whole on top and the two parts below.', { kind: 'bond', whole: 7, parts: [4, 3] }],
    ]),
  ]),
  topic('g1-adding', 'Addition', '➕', 'Add within 20, then within 100.', [
    skill('g1-add-20', 'Add within 20', { type: 'addition', min: 1, max: 12, maxSum: 20 }, [
      ['concrete', 'To add 8 + 5, fill the ten frame first: 8 and 2 more make 10. 3 are left: 10 + 3 = 13.', { kind: 'tenFrames', value: 8, extra: 5 }],
    ], (q) => q.method.kind === 'makeTen'),
    skill('g1-add-100', 'Add tens and ones', { type: 'addition', min: 10, max: 89, maxSum: 99, regroup: false }, [
      ['pictorial', 'Add the ones, then the tens. 32 + 25: 2 + 5 = 7 ones, 3 + 2 = 5 tens. So 57.', { kind: 'stack', items: [{ kind: 'blocks', value: 32 }, { kind: 'blocks', value: 25 }] }],
    ]),
  ]),
  topic('g1-taking', 'Subtraction', '➖', 'Take away within 20, then within 100.', [
    skill('g1-sub-20', 'Subtract within 20', { type: 'subtraction', min: 1, max: 20 }, [
      ['concrete', 'Take away means some go away. 12 − 4: start with 12, take 4 away, 8 are left.', { kind: 'tenFrames', value: 12 }],
    ], (q) => /^1\d /.test(q.prompt) && q.answer > 2),
    skill('g1-sub-100', 'Subtract tens and ones', { type: 'subtraction', min: 10, max: 99, regroup: false }, [
      ['pictorial', 'Take away the ones, then the tens. 58 − 23: 8 − 3 = 5 ones, 5 − 2 = 3 tens. So 35.', { kind: 'blocks', value: 58 }],
    ], (q) => q.answer > 10),
  ]),
  topic('g1-groups', 'Equal groups', '🧺', 'Count equal groups: the start of multiplying.', [
    skill('g1-groups-count', 'Equal groups', { type: 'multiplication', tables: [2, 5, 10], maxFactor: 5 }, [
      ['concrete', '3 plates with 2 cakes on each. Count in twos: 2, 4, 6. That is 3 groups of 2.', { kind: 'groups', groups: 3, each: 2 }],
      ['abstract', '3 groups of 2 is written 3 × 2 = 6.'],
    ], (q) => q.answer > 4),
  ]),
  topic('g1-time', 'Telling time', '🕒', "Read o'clock and half past.", [
    skill('g1-time-hour', "O'clock", { type: 'readClock', step: 60 }, [
      ['pictorial', "The short hand shows the hour. When the long hand points straight up at 12, it is o'clock. This clock shows 3 o'clock.", { kind: 'clock', h: 3, m: 0 }],
    ]),
    skill('g1-time-half', "O'clock and half past", { type: 'readClock', step: 30 }, [
      ['pictorial', 'When the long hand points down at 6, it is half past. The short hand is halfway between two numbers. This is half past 4, written 4:30.', { kind: 'clock', h: 4, m: 30 }],
    ], (q) => q.answer.endsWith(':30')),
  ]),
  topic('g1-money', 'Money', '🪙', 'Add prices and give change in pesos.', [
    skill('g1-money-total', 'How much altogether?', { type: 'moneyProblem', forms: ['total'], max: 20, whole: true }, [
      ['concrete', 'Coins come as ₱1, ₱5, ₱10 and ₱20. To pay ₱8 and ₱6, add them: ₱8 + ₱6 = ₱14.'],
    ]),
    skill('g1-money-change', 'Give change', { type: 'moneyProblem', forms: ['change'], max: 20, whole: true }, [
      ['concrete', 'Pay ₱20 for a ₱13 snack. Count up from ₱13 to ₱20: that is ₱7 change.'],
    ]),
  ]),
  topic('g1-shapes', 'Shapes and patterns', '🔺', 'Name shapes and finish patterns.', [
    skill('g1-shapes-name', 'Name the shape', { type: 'shapes' }, [
      ['pictorial', 'A triangle has 3 sides and 3 corners. A square has 4 equal sides.', { kind: 'shape', shape: 'triangle' }],
    ]),
    skill('g1-patterns', 'What comes next?', { type: 'patterns' }, [
      ['pictorial', 'A pattern repeats. Find the part that repeats, then say what comes next.', { kind: 'sequence', items: ['🔴', '🔵', '🔴', '🔵', '🔴', '?'] }],
    ]),
  ]),
  topic('g1-graphs', 'Picture graphs', '📊', 'Read a simple graph.', [
    skill('g1-graphs-read', 'Read a graph', { type: 'readGraph', forms: ['read', 'most', 'least'] }, [
      ['pictorial', 'Each bar shows how many. The tallest bar is the most. The shortest is the fewest.'],
    ]),
  ]),
  topic('g1-word-problems', 'Word problems', '📝', 'Draw a bar to see what to do.', [
    skill('g1-wp-part-whole', 'Part and whole', { type: 'wordProblem', kinds: ['partWhole'], max: 20 }, [
      ['pictorial', 'A bar shows the whole. The two parts sit side by side inside it.'],
    ]),
    skill('g1-wp-compare', 'How many more?', { type: 'wordProblem', kinds: ['compare'], max: 20 }, [
      ['pictorial', 'Draw one bar under the other. The part that sticks out is how many more.'],
    ]),
  ]),
  challenge('g1', [
    ['g1-ch-add', 'Add with renaming', { type: 'addition', min: 10, max: 89, maxSum: 100, regroup: true }],
    ['g1-ch-sub', 'Subtract with renaming', { type: 'subtraction', min: 20, max: 99, regroup: true }],
    ['g1-ch-groups', 'More equal groups', { type: 'multiplication', tables: [2, 5, 10], maxFactor: 10 }],
  ]),
];

/* ------------------------------------------------------------------ */
/* Grade 2                                                             */
/* ------------------------------------------------------------------ */
const g2 = [
  topic('g2-numbers', 'Numbers to 1,000', '🔢', 'Hundreds, tens and ones.', [
    skill('g2-place-value', 'Hundreds, tens and ones', { type: 'placeValue', digits: 3 }, [
      ['concrete', 'A flat is 100, a rod is 10 and a cube is 1. This shows 2 hundreds, 4 tens and 3 ones: 243.', { kind: 'blocks', value: 243 }],
    ]),
    skill('g2-compare', 'Compare numbers', { type: 'compare', min: 100, max: 999 }, [
      ['pictorial', 'Compare the hundreds first. If they are the same, compare the tens, then the ones.', { kind: 'stack', items: [{ kind: 'blocks', value: 352 }, { kind: 'blocks', value: 325 }] }],
    ]),
  ]),
  topic('g2-add-sub', 'Add and subtract to 1,000', '➕', 'Column addition and subtraction, with renaming.', [
    skill('g2-add', 'Add 3-digit numbers', { type: 'addition', min: 100, max: 899, maxSum: 999, regroup: true }, [
      ['pictorial', 'Line up ones under ones, tens under tens. Add from the ones. 10 ones make 1 ten: carry it.'],
    ]),
    skill('g2-sub', 'Subtract 3-digit numbers', { type: 'subtraction', min: 100, max: 999, regroup: true }, [
      ['pictorial', 'Subtract from the ones. If the top digit is too small, rename 1 ten as 10 ones.'],
    ], (q) => q.answer > 50),
  ]),
  topic('g2-times', 'Multiply and divide', '✖️', 'Tables of 2, 3, 4, 5 and 10.', [
    skill('g2-times-tables', 'Times tables 2, 3, 4, 5, 10', { type: 'multiplication', tables: [2, 3, 4, 5, 10], maxFactor: 10 }, [
      ['concrete', '4 groups of 3 is 3 + 3 + 3 + 3 = 12. We write 4 × 3 = 12.', { kind: 'groups', groups: 4, each: 3 }],
    ], (q) => q.answer > 10),
    skill('g2-divide', 'Share equally', { type: 'division', tables: [2, 3, 4, 5, 10], maxFactor: 10 }, [
      ['concrete', 'Share 12 sweets equally among 3 children. Each child gets 4. We write 12 ÷ 3 = 4.', { kind: 'groups', groups: 3, each: 4 }],
    ]),
  ]),
  topic('g2-fractions', 'Fractions', '🍕', 'Halves, thirds and quarters.', [
    skill('g2-fraction-shape', 'Name the fraction', { type: 'fractionOfShape', denominators: [2, 3, 4] }, [
      ['pictorial', 'This bar is cut into 4 equal parts. 1 part is shaded: that is 1/4, one quarter.', { kind: 'fraction', numerator: 1, denominator: 4, shape: 'bar' }],
      ['pictorial', 'The bottom number is how many equal parts. The top number is how many are shaded.', { kind: 'fraction', numerator: 2, denominator: 3, shape: 'circle' }],
    ]),
  ]),
  topic('g2-time', 'Time', '🕒', 'Read the clock to 5 minutes.', [
    skill('g2-time-clock', 'Read the clock', { type: 'readClock', step: 5 }, [
      ['pictorial', 'The long hand moves 5 minutes from one number to the next. Count in 5s: at 4 it is 20 minutes past.', { kind: 'clock', h: 2, m: 20 }],
    ], (q) => !q.answer.endsWith(':00')),
  ]),
  topic('g2-money', 'Money', '🪙', 'Totals and change up to ₱100.', [
    skill('g2-money-total', 'How much altogether?', { type: 'moneyProblem', forms: ['total'], max: 100, whole: true }, [
      ['concrete', 'Add the prices. ₱35 + ₱48: add the tens, then the ones: ₱70 + ₱13 = ₱83.'],
    ]),
    skill('g2-money-change', 'Give change', { type: 'moneyProblem', forms: ['change'], max: 100, whole: true }, [
      ['concrete', 'Count up from the price to the money paid. ₱64 to ₱70 is ₱6, and ₱70 to ₱100 is ₱30. Change: ₱36.'],
    ]),
  ]),
  topic('g2-graphs', 'Graphs', '📊', 'Read and compare bars.', [
    skill('g2-graphs-read', 'Read a bar graph', { type: 'readGraph', forms: ['read', 'most', 'least', 'difference'] }, [
      ['pictorial', 'Read the scale on the side. Go across from the top of a bar to read its number.'],
    ]),
  ]),
  topic('g2-word-problems', 'Word problems', '📝', 'Bar models for adding, subtracting and groups.', [
    skill('g2-wp-part-whole', 'Part and whole', { type: 'wordProblem', kinds: ['partWhole'], max: 500 }, [
      ['pictorial', 'Draw a bar for the whole. Split it into the parts you know.'],
    ]),
    skill('g2-wp-compare', 'More than, fewer than', { type: 'wordProblem', kinds: ['compare'], max: 500 }, [
      ['pictorial', 'Draw two bars, one under the other. The difference is the part that sticks out.'],
    ]),
    skill('g2-wp-multiply', 'Groups and times', { type: 'wordProblem', kinds: ['multiply'], max: 50, maxTimes: 5 }, [
      ['pictorial', 'When one has 3 times as many, draw 3 equal units for it and 1 unit for the other.'],
    ]),
  ]),
  challenge('g2', [
    ['g2-ch-numbers', 'Numbers to 10,000', { type: 'placeValue', digits: 4 }],
    ['g2-ch-add-sub', 'Add and subtract 4-digit numbers', { type: 'mixed', of: [{ type: 'addition', min: 1000, max: 4999, regroup: true }, { type: 'subtraction', min: 1000, max: 9999, regroup: true }] }],
    ['g2-ch-tables', 'Times tables 6 to 9', { type: 'multiplication', tables: [6, 7, 8, 9], maxFactor: 10 }],
  ]),
];

/* ------------------------------------------------------------------ */
/* Grade 3                                                             */
/* ------------------------------------------------------------------ */
const g3 = [
  topic('g3-numbers', 'Numbers to 10,000', '🔢', 'Thousands, and adding and subtracting big numbers.', [
    skill('g3-place-value', 'Place value to thousands', { type: 'placeValue', digits: 4 }, [
      ['pictorial', 'Each place is 10 times the place on its right: ones, tens, hundreds, thousands. In 5,284 the 5 stands for 5,000.'],
    ]),
    skill('g3-compare', 'Compare numbers', { type: 'compare', min: 1000, max: 9999 }, [
      ['abstract', 'Start from the thousands. The first place where the digits differ tells you which is greater.'],
    ]),
    skill('g3-add-sub', 'Add and subtract to 10,000', { type: 'mixed', of: [{ type: 'addition', min: 1000, max: 4999, regroup: true }, { type: 'subtraction', min: 1000, max: 9999, regroup: true }] }, [
      ['abstract', 'Line up the places. Work from the ones. Carry when a place makes 10 or more, rename when the top digit is too small.'],
    ]),
  ]),
  topic('g3-times', 'Multiply and divide', '✖️', 'Tables of 6, 7, 8 and 9, and bigger numbers.', [
    skill('g3-times-tables', 'Times tables 6 to 9', { type: 'multiplication', tables: [6, 7, 8, 9], maxFactor: 10 }, [
      ['abstract', 'Use facts you know. 6 × 7 is 5 × 7 and 1 more 7: 35 + 7 = 42.'],
    ]),
    skill('g3-divide-facts', 'Division facts', { type: 'division', tables: [6, 7, 8, 9], maxFactor: 10 }, [
      ['abstract', 'Division undoes multiplication. 56 ÷ 8 asks: 8 times what is 56? 8 × 7 = 56, so the answer is 7.'],
    ]),
    skill('g3-multiply', 'Multiply by a 1-digit number', { type: 'multiplyLong', digits: 2, byDigits: 1 }, [
      ['abstract', 'Split the number by place value, multiply each part, then add. 34 × 3 = 30 × 3 + 4 × 3 = 90 + 12 = 102.'],
    ]),
    skill('g3-divide', 'Divide by a 1-digit number', { type: 'divideLong', digits: 2, remainder: false }, [
      ['abstract', 'Share the tens first, then the ones.'],
    ]),
    skill('g3-divide-remainder', 'Division with remainder', { type: 'divideLong', digits: 2, remainder: true }, [
      ['concrete', 'Share 17 sweets among 5 children. Each gets 3, and 2 are left over. The 2 left over are the remainder.', { kind: 'stack', items: [{ kind: 'groups', groups: 5, each: 3 }, { kind: 'pictures', emoji: '🍬', count: 2 }] }],
    ]),
  ]),
  topic('g3-fractions', 'Fractions', '🍕', 'Equal fractions, and adding like fractions.', [
    skill('g3-equivalent', 'Equivalent fractions', { type: 'equivalentFraction', maxDen: 10 }, [
      ['pictorial', 'Cut each part into smaller equal parts: the shaded amount stays the same. 1/2 = 2/4.', { kind: 'fraction', numerator: 1, denominator: 2, shape: 'bar' }],
    ]),
    skill('g3-fraction-add-sub', 'Add and subtract like fractions', { type: 'fractionSameDen', maxDen: 10 }, [
      ['abstract', 'When the parts are the same size, add or subtract the top numbers. The bottom number stays the same.'],
    ]),
  ]),
  topic('g3-measurement', 'Length, mass and volume', '📏', 'Metres and centimetres, kilograms and grams, litres and millilitres.', [
    skill('g3-measure-convert', 'Change units', { type: 'convertUnits', forms: ['toSmall', 'toBig', 'whole'], bigUnits: ['m', 'kg', 'ℓ'] }, [
      ['abstract', '1 m = 100 cm. 1 kg = 1,000 g. 1 ℓ = 1,000 ml.'],
    ]),
  ]),
  topic('g3-time', 'Time', '🕒', 'Read the clock and find how long things take.', [
    skill('g3-time-clock', 'Read the clock', { type: 'readClock', step: 5 }, [
      ['pictorial', 'Read the hour hand first, then count the minutes in 5s.', { kind: 'clock', h: 9, m: 35 }],
    ]),
    skill('g3-time-duration', 'How long does it take?', { type: 'timeDuration', forms: ['howLong'] }, [
      ['abstract', 'Jump on a timeline: first to the next o\'clock, then whole hours, then the minutes left.'],
    ]),
  ]),
  topic('g3-money', 'Money', '🪙', 'Pesos and centavos.', [
    skill('g3-money-total', 'How much altogether?', { type: 'moneyProblem', forms: ['total'], max: 100 }, [
      ['abstract', '100 centavos make ₱1. Add the pesos, then the centavos.'],
    ]),
    skill('g3-money-change', 'Give change', { type: 'moneyProblem', forms: ['change'], max: 100 }, [
      ['abstract', 'Count up from the price: to the next peso, then to friendly numbers, then to the bill.'],
    ]),
  ]),
  topic('g3-geometry', 'Angles, area and perimeter', '📐', 'Right angles, perimeter and area of rectangles.', [
    skill('g3-angles', 'Right angles', { type: 'angles', forms: ['classify'] }, [
      ['concrete', 'Fold a paper twice to make a square corner. That is a right angle.', { kind: 'angle', deg: 90, rotate: 0 }],
      ['pictorial', 'Put the square corner on an angle. An angle smaller than a right angle is called acute. A bigger one is called obtuse.', { kind: 'angle', deg: 130, rotate: 10 }],
    ]),
    skill('g3-area-perimeter', 'Perimeter and area', { type: 'areaPerimeter', forms: ['perimeter', 'area'], max: 10 }, [
      ['pictorial', 'Perimeter is the distance around the edge. Area is how many squares cover the shape.', { kind: 'rectGrid', w: 5, h: 3, mode: 'area' }],
    ]),
  ]),
  topic('g3-graphs', 'Graphs', '📊', 'Read bar graphs with a scale.', [
    skill('g3-graphs-read', 'Read bar graphs', { type: 'readGraph' }, [
      ['pictorial', 'Check the scale first. Then go across from the top of each bar to the scale.'],
    ]),
  ]),
  topic('g3-word-problems', 'Word problems', '📝', 'Bar models with bigger numbers.', [
    skill('g3-wp-part-whole', 'Part and whole', { type: 'wordProblem', kinds: ['partWhole'], max: 5000 }, [
      ['pictorial', 'Draw a bar for the whole and split it into the parts.'],
    ]),
    skill('g3-wp-compare', 'Comparing', { type: 'wordProblem', kinds: ['compare'], max: 5000 }, [
      ['pictorial', 'Two bars, one under the other. The difference is the part that sticks out.'],
    ]),
    skill('g3-wp-multiply', 'Times as many', { type: 'wordProblem', kinds: ['multiply'], max: 200, maxTimes: 9 }, [
      ['pictorial', 'Draw equal units. If one has 4 times as many, it gets 4 units and the other gets 1.'],
    ]),
  ]),
  challenge('g3', [
    ['g3-ch-multiply', '3-digit × 1-digit', { type: 'multiplyLong', digits: 3, byDigits: 1 }],
    ['g3-ch-divide', 'Divide 3-digit numbers', { type: 'divideLong', digits: 3, remainder: true }],
    ['g3-ch-measure-add', 'Add measures', { type: 'convertUnits', forms: ['add'], bigUnits: ['m', 'kg', 'ℓ'] }],
  ]),
];

const write = (packId, title, topics) => {
  writeFileSync(`${ROOT}${packId}.json`, `${JSON.stringify({ packId, version: '1.0.0', subject: 'math', title, topics }, null, 2)}\n`);
  console.log(packId, topics.reduce((n, t) => n + t.skills.length, 0), 'skills');
};
write('math-g1', 'Math · Grade 1', g1);
write('math-g2', 'Math · Grade 2', g2);
write('math-g3', 'Math · Grade 3', g3);
