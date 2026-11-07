// Builds packs/math-g5.json and math-g6.json:  node tools/build-math-g5-g6.mjs
// Lessons are made by tools/packBuilder.mjs: hand-written CPA intro steps, then a
// worked example and a "your turn" from the skill's own generator, so every
// number in a lesson is produced and checked by the same code as practice.
// Topics follow the Singapore P5–P6 syllabus, matched to Philippine Grades 5–6.
import { skill, topic, challenge, writePack } from './packBuilder.mjs';

const bar = (numerator, denominator, label) => ({ kind: 'fraction', numerator, denominator, shape: 'bar', label: label || `${numerator}/${denominator}` });
const stack = (...items) => ({ kind: 'stack', items });
const units = (n, whole, below) => ({
  kind: 'bar',
  rows: [{ label: '', segments: Array.from({ length: n }, () => ({ units: 1, text: '' })) }],
  braces: [{ row: 0, from: 0, to: n, side: 'above', text: whole }, ...(below ? [{ row: 0, from: 0, to: below[0], side: 'below', text: below[1] }] : [])],
});
const twoBars = (a, b, x, y, total) => ({
  kind: 'bar',
  rows: [
    { label: a, segments: Array.from({ length: x }, () => ({ units: 1, text: '' })) },
    { label: b, segments: Array.from({ length: y }, () => ({ units: 1, text: '' })) },
  ],
  braces: total ? [{ side: 'right', rows: [0, 1], text: total }] : [],
});

/* ------------------------------------------------------------------ */
/* Grade 5                                                             */
/* ------------------------------------------------------------------ */
const g5 = [
  topic('g5-numbers', 'Numbers to 10 million', '🔢', 'Big numbers, × by 10, 100 and 1,000, and the order of operations.', [
    skill('g5-place-value', 'Place value to millions', { type: 'placeValue', digits: 7 }, [
      ['pictorial', 'Group the digits in threes from the right. 4,250,000 is 4 millions, 250 thousands.'],
      ['abstract', 'In 4,250,000 the 4 is in the millions place, so it stands for 4,000,000.'],
    ]),
    skill('g5-times-tens', 'Multiply by 10, 100 and 1,000', { type: 'powersOfTen', ops: ['×'], decimals: false }, [
      ['concrete', '10 tens make 100. Multiplying by 10 makes every digit worth 10 times as much.'],
      ['pictorial', '× 10: each digit moves 1 place to the left. × 100: 2 places. × 1,000: 3 places. Empty places get a 0.'],
      ['abstract', '36 × 100 = 3,600. 36 × 1,000 = 36,000.'],
    ]),
    skill('g5-order-ops', 'Order of operations', { type: 'orderOps', templates: ['basic'] }, [
      ['pictorial', 'Some sums have more than one step. Everyone must do them in the same order, or we get different answers.'],
      ['abstract', 'Brackets first. Then × and ÷ from left to right. Then + and − from left to right.\n10 − 2 × 3 = 10 − 6 = 4, not 24.'],
    ]),
  ]),
  topic('g5-fractions', 'Fractions', '🍕', 'Add and subtract unlike fractions, mixed numbers, a fraction of an amount, and multiplying.', [
    skill('g5-frac-related', 'Add and subtract: one bottom is a multiple', { type: 'fractionUnlike', related: true }, [
      ['concrete', 'Halves and fourths are different sizes. Cut each half into 2, and 1/2 becomes 2/4.', stack(bar(1, 2), bar(2, 4))],
      ['abstract', 'Now both are fourths: 2/4 + 1/4 = 3/4.'],
    ]),
    skill('g5-frac-unlike', 'Add and subtract unlike fractions', { type: 'fractionUnlike', maxDen: 10 }, [
      ['pictorial', '1/3 and 1/4: thirds and fourths. Both 3 and 4 go into 12, so change both into twelfths.', stack(bar(1, 3), bar(1, 4))],
      ['abstract', '1/3 = 4/12 and 1/4 = 3/12. So 1/3 + 1/4 = 4/12 + 3/12 = 7/12.', stack(bar(4, 12), bar(3, 12))],
    ]),
    skill('g5-mixed', 'Mixed numbers', { type: 'mixedNumbers', maxDen: 8 }, [
      ['concrete', '7/4 is 7 fourths. 4 fourths make 1 whole, and 3 fourths are left over.', stack(bar(4, 4, '1 whole'), bar(3, 4))],
      ['abstract', 'So 7/4 = 1 3/4. A mixed number is a whole number and a fraction.'],
    ]),
    skill('g5-frac-of', 'Fraction of an amount', { type: 'fractionOf' }, [
      ['pictorial', '3/4 of 20: draw 20 as a bar cut into 4 equal units.', units(4, '20', [3, '?'])],
      ['abstract', '4 units = 20, so 1 unit = 20 ÷ 4 = 5. 3 units = 3 × 5 = 15.'],
    ]),
    skill('g5-frac-times', 'Multiply fractions', { type: 'fractionMultiply', maxDen: 8 }, [
      ['pictorial', '1/2 × 1/3 means half of a third. Cut a third in half: each piece is 1/6.', bar(1, 3)],
      ['abstract', 'Multiply the tops and multiply the bottoms: 1/2 × 1/3 = 1/6. 2/3 × 6 = 12/3 = 4.'],
    ]),
  ]),
  topic('g5-decimals', 'Decimals', '🔟', 'Add, subtract, multiply and divide decimals, and round them.', [
    skill('g5-dec-add-sub', 'Add and subtract decimals', { type: 'decimalOps', forms: ['add', 'sub'], places: 2, max: 50 }, [
      ['pictorial', 'Line up the decimal points, one under the other. 4.5 + 2.36: write 4.5 as 4.50.'],
      ['abstract', '450 hundredths + 236 hundredths = 686 hundredths = 6.86.'],
    ]),
    skill('g5-dec-by-whole', 'Multiply and divide by a whole number', { type: 'decimalOps', forms: ['mulWhole', 'divWhole'] }, [
      ['concrete', '1.2 is 12 tenths. 12 tenths × 3 = 36 tenths.'],
      ['abstract', '36 tenths = 3.6. So 1.2 × 3 = 3.6, and 3.6 ÷ 3 = 1.2.'],
    ]),
    skill('g5-dec-tens', 'Decimals × and ÷ 10, 100, 1,000', { type: 'powersOfTen' }, [
      ['pictorial', '× 10 moves each digit 1 place to the left: 2.35 × 10 = 23.5. ÷ 10 moves each digit 1 place to the right: 2.35 ÷ 10 = 0.235.'],
      ['abstract', 'The number of zeros tells you how many places to move: 2.35 × 100 = 235.'],
    ]),
    skill('g5-dec-round', 'Round decimals', { type: 'decimalOps', forms: ['round'] }, [
      ['pictorial', 'Round 3.47 to 1 decimal place. It is between 3.4 and 3.5. Look at the next digit, 7.'],
      ['abstract', '7 is 5 or more, so round up: 3.47 is about 3.5.'],
    ]),
  ]),
  topic('g5-percent', 'Percentage', '💯', 'Percent means out of 100.', [
    skill('g5-percent-meaning', 'What is a percentage?', { type: 'percentage', forms: ['toPercent', 'whatPercent'] }, [
      ['concrete', 'A 10 by 10 grid has 100 squares. 25 squares shaded is 25 out of 100: 25%.', { kind: 'hundredSquare', filled: 25 }],
      ['abstract', 'To change a fraction, make it out of 100: 3/4 = 75/100 = 75%. 0.4 = 40/100 = 40%.'],
    ]),
    skill('g5-percent-of', 'Percentage of an amount', { type: 'percentage', forms: ['ofQuantity'], max: 600 }, [
      ['pictorial', '25% of 80: 100% is 80. 25% is 1 of 4 equal parts.', units(4, '100% = 80', [1, '25%'])],
      ['abstract', '1 part = 80 ÷ 4 = 20. So 25% of 80 = 20.'],
    ]),
  ]),
  topic('g5-ratio', 'Ratio', '⚖️', 'Compare amounts in units, with bar models.', [
    skill('g5-ratio-simplify', 'Ratio in simplest form', { type: 'ratio', forms: ['simplify'] }, [
      ['concrete', '6 red beads and 4 blue beads: the ratio of red to blue is 6 : 4.'],
      ['abstract', 'Divide both by 2: 6 : 4 = 3 : 2. For every 3 red there are 2 blue.'],
    ]),
    skill('g5-ratio-units', 'Ratio word problems', { type: 'ratio', forms: ['share', 'findPart', 'total'], maxUnit: 10 }, [
      ['pictorial', 'Ana and Ben share in the ratio 2 : 3. Ana gets 2 units and Ben gets 3 units. All units are the same size.', twoBars('Ana', 'Ben', 2, 3, '?')],
      ['abstract', 'If they share 40, then 5 units = 40, so 1 unit = 8. Ana gets 2 × 8 = 16 and Ben gets 3 × 8 = 24.'],
    ]),
  ]),
  topic('g5-average', 'Average', '📊', 'Share the total out equally.', [
    skill('g5-average', 'Find the average', { type: 'average', forms: ['mean'], max: 40 }, [
      ['concrete', 'Towers of 3, 5 and 7 cubes. Move cubes so the towers are the same height: each has 5.'],
      ['abstract', 'Average = total ÷ how many. (3 + 5 + 7) ÷ 3 = 15 ÷ 3 = 5.'],
    ]),
  ]),
  topic('g5-geometry', 'Triangles and volume', '📐', 'Area and angles of a triangle, and volume of boxes.', [
    skill('g5-triangle-area', 'Area of a triangle', { type: 'triangleArea', forms: ['area'], max: 14 }, [
      ['pictorial', 'Draw a rectangle round a triangle. The triangle fills exactly half of it.', { kind: 'triangle', base: 8, height: 6, apex: 0.5, box: true }],
      ['abstract', 'Area of a triangle = base × height ÷ 2. The height goes straight up from the base, at a right angle.'],
    ]),
    skill('g5-triangle-angles', 'Angles in a triangle', { type: 'triangleAngles', forms: ['two', 'right'] }, [
      ['concrete', 'Cut out a paper triangle and tear off its 3 corners. Put them together: they make a straight line, 180°.', { kind: 'triangle', angles: [70, 50, 60], labels: ['70°', '50°', '60°'] }],
      ['abstract', 'The 3 angles of a triangle always add up to 180°. 70 + 50 + 60 = 180.'],
    ]),
    skill('g5-volume', 'Volume of cubes and cuboids', { type: 'volume', forms: ['cuboid', 'cube'] }, [
      ['concrete', 'Volume is how much space a solid takes up. We count it in 1 cm cubes: cm³.', { kind: 'cuboid', l: 4, w: 3, h: 2, cubes: true }],
      ['abstract', 'The bottom layer is 4 × 3 = 12 cubes. 2 layers make 12 × 2 = 24 cm³. Volume = length × width × height.'],
    ]),
  ]),
  topic('g5-word-problems', 'Word problems', '📝', 'Bar models with big numbers.', [
    skill('g5-wp-mixed', 'Mixed word problems', { type: 'wordProblem', kinds: ['partWhole', 'compare', 'multiply'], max: 50000, maxTimes: 9 }, [
      ['pictorial', 'Read the story. Draw the bars. Put ? on what you must find.'],
      ['abstract', 'Decide: is a part missing, the whole, or the difference? Then choose +, −, × or ÷.'],
    ]),
  ]),
  challenge('g5', [
    ['g5-ch-frac-divide', 'Divide with fractions', { type: 'fractionDivide', forms: ['wholeByUnit', 'fracByWhole'] }],
    ['g5-ch-percent', 'Discounts', { type: 'percentage', forms: ['discount'] }],
    ['g5-ch-ratio', 'Ratio: more than', { type: 'ratio', forms: ['difference'] }],
    ['g5-ch-litres', 'Volume in litres', { type: 'volume', forms: ['litres'] }],
  ]),
];

/* ------------------------------------------------------------------ */
/* Grade 6                                                             */
/* ------------------------------------------------------------------ */
const g6 = [
  topic('g6-fractions', 'Fractions', '🍕', 'All four operations with fractions.', [
    skill('g6-frac-add-sub', 'Add and subtract fractions', { type: 'fractionUnlike', maxDen: 12 }, [
      ['pictorial', 'Make the parts the same size first. Find the smallest number both bottom numbers go into.'],
      ['abstract', '3/4 + 5/6: 4 and 6 both go into 12. 9/12 + 10/12 = 19/12 = 1 7/12.'],
    ]),
    skill('g6-frac-times', 'Multiply fractions', { type: 'fractionMultiply', maxDen: 12 }, [
      ['abstract', 'Multiply the tops and multiply the bottoms, then simplify: 3/4 × 2/5 = 6/20 = 3/10.'],
    ]),
    skill('g6-frac-divide', 'Divide fractions', { type: 'fractionDivide' }, [
      ['concrete', '2 ÷ 1/4: how many fourths are in 2 wholes? Each whole has 4, so 2 × 4 = 8.', stack(bar(4, 4, '1 whole'), bar(4, 4, '1 whole'))],
      ['pictorial', 'So dividing by 1/4 is the same as multiplying by 4, its flip.'],
      ['abstract', 'To divide by a fraction, multiply by its flip: 3/4 ÷ 3/8 = 3/4 × 8/3 = 24/12 = 2.'],
    ]),
  ]),
  topic('g6-decimals', 'Decimals', '🔟', 'Multiply and divide decimals.', [
    skill('g6-dec-multiply', 'Multiply decimals', { type: 'decimalOps', forms: ['mulDec'] }, [
      ['concrete', '0.3 × 0.2 is 3 tenths of 2 tenths. On a 10 by 10 grid that is 6 small squares out of 100: 0.06.', { kind: 'hundredSquare', filled: 6 }],
      ['abstract', 'Multiply without the points: 3 × 2 = 6. There are 2 decimal places in the question, so the answer is 0.06.'],
    ]),
    skill('g6-dec-divide', 'Divide decimals', { type: 'decimalOps', forms: ['divDec', 'divWhole'] }, [
      ['pictorial', '2.4 ÷ 0.4: how many 0.4s are in 2.4? Multiply both by 10: 24 ÷ 4.'],
      ['abstract', '24 ÷ 4 = 6, so 2.4 ÷ 0.4 = 6.'],
    ]),
  ]),
  topic('g6-percent', 'Percentage', '💯', 'Discounts, increases and finding the whole.', [
    skill('g6-percent-change', 'Discounts and increases', { type: 'percentage', forms: ['discount', 'increase'] }, [
      ['pictorial', 'A ₱500 shirt is 20% off. 100% is ₱500. 20% is 1 of 5 equal parts: ₱100.', units(5, '100% = ₱500', [1, '20%'])],
      ['abstract', 'Sale price = ₱500 − ₱100 = ₱400. For an increase, add the part on instead.'],
    ]),
    skill('g6-percent-whole', 'Find the whole', { type: 'percentage', forms: ['findWhole'] }, [
      ['pictorial', '30% of a number is 60. 10% is 1 part, so 3 parts = 60 and 1 part = 20.', units(10, '100% = ?', [3, '60'])],
      ['abstract', '100% is 10 parts: 10 × 20 = 200.'],
    ]),
  ]),
  topic('g6-ratio', 'Ratio', '⚖️', 'Harder ratio problems with units.', [
    skill('g6-ratio-units', 'Ratio problems', { type: 'ratio', forms: ['share', 'findPart', 'total', 'difference'], maxUnit: 15 }, [
      ['pictorial', 'The ratio of Ana\'s money to Ben\'s is 5 : 2. Ana has ₱30 more. The difference is 5 − 2 = 3 units.', twoBars('Ana', 'Ben', 5, 2)],
      ['abstract', '3 units = 30, so 1 unit = 10. Ana has 5 × 10 = 50.'],
    ]),
  ]),
  topic('g6-algebra', 'Algebra', '🔤', 'Use a letter for an unknown number.', [
    skill('g6-alg-write', 'Write expressions', { type: 'algebra', forms: ['write'] }, [
      ['concrete', 'A box has n pencils. We do not know how many, so we call the number n.'],
      ['abstract', '3 more than n is n + 3. 3 times as many is 3 × n, written 3n.'],
    ]),
    skill('g6-alg-evaluate', 'Find the value', { type: 'algebra', forms: ['evaluate'] }, [
      ['abstract', 'If n = 5, then 4n + 2 = 4 × 5 + 2 = 20 + 2 = 22. Put the number in place of the letter.'],
    ]),
    skill('g6-alg-simplify', 'Simplify expressions', { type: 'algebra', forms: ['likeTerms'] }, [
      ['concrete', '3n is 3 lots of n. 3n + 2n is 3 lots and 2 lots: 5 lots of n.'],
      ['abstract', '3n + 2n = 5n. A number on its own stays apart: 3n + 4 + 2n = 5n + 4.'],
    ]),
    skill('g6-alg-solve', 'Solve simple equations', { type: 'algebra', forms: ['solve'] }, [
      ['pictorial', '2n + 3 = 11. The bar is 2 units of n and 3 more, making 11.', { kind: 'bar', rows: [{ label: '', segments: [{ units: 4, text: 'n' }, { units: 4, text: 'n' }, { units: 3, text: '3' }] }], braces: [{ row: 0, from: 0, to: 3, side: 'above', text: '11' }] }],
      ['abstract', 'Undo the steps: 11 − 3 = 8, then 8 ÷ 2 = 4. So n = 4.'],
    ]),
  ]),
  topic('g6-order-ops', 'Order of operations', '🧮', 'Longer number sentences with brackets.', [
    skill('g6-order-ops', 'Order of operations', { type: 'orderOps', templates: ['more'] }, [
      ['abstract', 'Brackets first. Then × and ÷ from left to right. Then + and − from left to right.\n(6 + 4) × 3 − 5 = 10 × 3 − 5 = 30 − 5 = 25.'],
    ]),
  ]),
  topic('g6-speed', 'Speed', '🚗', 'Distance, time and speed.', [
    skill('g6-speed', 'Distance, time and speed', { type: 'speed' }, [
      ['concrete', 'A car going at 60 km/h travels 60 km in each hour.', { kind: 'bar', rows: [{ label: '', segments: [{ units: 1, text: '60 km' }, { units: 1, text: '60 km' }, { units: 1, text: '60 km' }] }], braces: [{ row: 0, from: 0, to: 3, side: 'above', text: '3 hours' }] }],
      ['abstract', 'Distance = speed × time: 60 × 3 = 180 km. Time = distance ÷ speed. Speed = distance ÷ time.'],
    ]),
  ]),
  topic('g6-circles', 'Circles', '⭕', 'Radius, diameter, circumference and area.', [
    skill('g6-circle-parts', 'Radius and diameter', { type: 'circle', forms: ['diameter', 'radius'] }, [
      ['concrete', 'The radius goes from the centre to the edge. The diameter goes right across, through the centre.', { kind: 'circle', show: 'both' }],
      ['abstract', 'The diameter is 2 radii: diameter = 2 × radius.'],
    ]),
    skill('g6-circumference', 'Circumference', { type: 'circle', forms: ['circumference'], max: 10 }, [
      ['concrete', 'Wrap a string round a can, then lay it next to the diameter. It is a little more than 3 diameters long.', { kind: 'circle', show: 'diameter', label: 'diameter' }],
      ['abstract', 'That number is π, about 3.14. Circumference = π × diameter.'],
    ]),
    skill('g6-circle-area', 'Area of a circle', { type: 'circle', forms: ['area'], max: 10 }, [
      ['pictorial', 'Cut a circle into thin slices and line them up. They make a shape close to a rectangle, π × radius long and 1 radius high.', { kind: 'circle', show: 'radius', label: 'radius' }],
      ['abstract', 'Area of a circle = π × radius × radius.'],
    ]),
  ]),
  topic('g6-volume', 'Volume', '📦', 'Find a missing edge, and litres.', [
    skill('g6-volume-missing', 'Find a missing edge', { type: 'volume', forms: ['missing'] }, [
      ['pictorial', 'Volume = bottom layer × number of layers. If you know the volume and the bottom, divide.', { kind: 'cuboid', l: 4, w: 3, h: 2, cubes: true, unknown: 'h' }],
      ['abstract', 'Volume 24 cm³, bottom 4 × 3 = 12. Height = 24 ÷ 12 = 2 cm.'],
    ]),
    skill('g6-volume-litres', 'Volume and litres', { type: 'volume', forms: ['litres'] }, [
      ['concrete', 'A 10 cm cube holds exactly 1 litre: 10 × 10 × 10 = 1,000 cm³ = 1 ℓ.', { kind: 'cuboid', l: 10, w: 10, h: 10 }],
      ['abstract', 'To change cm³ to litres, divide by 1,000.'],
    ]),
  ]),
  topic('g6-average-geometry', 'Average and triangles', '📐', 'Missing values, isosceles triangles and heights.', [
    skill('g6-average-missing', 'Average: the missing number', { type: 'average', forms: ['missing'] }, [
      ['abstract', 'If the average of 4 numbers is 10, their total is 4 × 10 = 40. Take away the numbers you know to find the last one.'],
    ]),
    skill('g6-isosceles', 'Angles in isosceles triangles', { type: 'triangleAngles', forms: ['isosceles'] }, [
      ['pictorial', 'An isosceles triangle has 2 equal sides, marked with a tick. The 2 angles at the bottom are equal too.', { kind: 'triangle', angles: [70, 70, 40], labels: ['70°', '70°', '40°'], equal: true }],
      ['abstract', '180 − 40 = 140, and 140 ÷ 2 = 70. Each base angle is 70°.'],
    ]),
    skill('g6-triangle-height', 'Triangle: find the height', { type: 'triangleArea', forms: ['height'] }, [
      ['abstract', 'Area = base × height ÷ 2. Work backwards: double the area, then divide by the base.'],
    ]),
  ]),
  challenge('g6', [
    ['g6-ch-fractions', 'Fraction ÷ fraction', { type: 'fractionDivide', forms: ['fracByFrac'], maxDen: 12 }],
    ['g6-ch-percent', 'Mixed percentage problems', { type: 'percentage', forms: ['ofQuantity', 'discount', 'increase', 'findWhole'], max: 2000 }],
    ['g6-ch-algebra', 'Algebra mix', { type: 'algebra' }],
    ['g6-ch-speed', 'Speed in m/min', { type: 'speed', units: ['mmin'] }],
  ]),
];

writePack('math-g5', 'Math · Grade 5', g5);
writePack('math-g6', 'Math · Grade 6', g6);
