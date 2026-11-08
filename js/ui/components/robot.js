/**
 * Draws the learner's robot companion in SVG from the parts they picked
 * (see engine/robot.js). Pure SVG, no image files, so it works offline,
 * stays sharp at any size and costs nothing to download.
 *
 * Layers, back to front: back gear, hair behind the head, legs, arms,
 * torso, neck gear, head, face screen, hair in front, headgear.
 * The face is a dark screen whose glowing eyes change with the mood.
 */

import { svg } from '../../core/dom.js';

const CX = 70; // centre line of the figure
const OUTLINE = 'rgba(10, 14, 28, 0.6)';
const DARK = '#262c3a';
const SCREEN = '#0b1020';

/** Gradient ids must be unique per drawing, or a hidden copy can blank out a visible one. */
let drawingCount = 0;

/** Colour stops for the special finishes. */
const GRADIENTS = {
  chrome: ['#f4f7fb', '#9aa6b6', '#e3e8ef', '#7d8898'],
  gold: ['#fff1a8', '#e2a923', '#ffe07a', '#b97d10'],
  rainbow: ['#ff5d5d', '#ffb703', '#3cc9a0', '#4f9dff', '#9a6cf0'],
};

/** Hair that a covering hat hides (it would poke through). */
const TOP_HAIR = new Set(['antenna', 'spikes', 'mohawk']);
const COVERING_HATS = new Set(['cap', 'tophat', 'grad', 'crown']);

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */

/** A stroke with a darker outline underneath, for arms, legs and cables. */
const outlinedLine = (d, colour, width) => [
  svg('path', { d, fill: 'none', stroke: OUTLINE, 'stroke-width': width + 2.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
  svg('path', { d, fill: 'none', stroke: colour, 'stroke-width': width, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
];

const joint = (x, y, r, trim) => svg('circle', { cx: x, cy: y, r, fill: trim, stroke: OUTLINE, 'stroke-width': 1.2 });

/** Soft glow behind a light: the same colour, larger and see-through. */
const glow = (x, y, r, colour) => svg('circle', { cx: x, cy: y, r, fill: colour, opacity: 0.28 });

const flame = (x, y, length = 14) => [
  svg('path', { d: `M${x - 4.5} ${y} Q${x} ${y + length * 1.25} ${x + 4.5} ${y} Z`, fill: '#ff8a2a', opacity: 0.9 }),
  svg('path', { d: `M${x - 2.2} ${y} Q${x} ${y + length * 0.75} ${x + 2.2} ${y} Z`, fill: '#ffe07a' }),
];

const linearGradient = (id, stops, vertical = false) => svg('linearGradient', { id, x1: 0, y1: 0, x2: vertical ? 0 : 1, y2: 1 },
  stops.map((c, i) => svg('stop', { offset: `${Math.round((i / (stops.length - 1)) * 100)}%`, 'stop-color': c })));

/* ------------------------------------------------------------------ */
/* Back gear and hair                                                  */
/* ------------------------------------------------------------------ */

const backGear = (back, c) => {
  switch (back) {
    case 'cape':
      return [
        svg('path', { d: 'M48 80 Q38 116 32 146 L108 146 Q102 116 92 80 Z', fill: c.trim, stroke: OUTLINE, 'stroke-width': 2 }),
        svg('path', { d: 'M52 96 Q46 120 44 144 M88 96 Q94 120 96 144', fill: 'none', stroke: 'rgba(0,0,0,0.22)', 'stroke-width': 2 }),
      ];
    case 'jetpack':
      return [-1, 1].map((side) => {
        const x = CX + side * 34;
        return [
          flame(x, 108, 16),
          svg('rect', { x: x - 6, y: 74, width: 12, height: 30, rx: 5, fill: DARK, stroke: OUTLINE, 'stroke-width': 1.5 }),
          svg('rect', { x: x - 6, y: 80, width: 12, height: 4, fill: c.trim }),
          svg('path', { d: `M${x - 5} 104 L${x + 5} 104 L${x + 3.5} 109 L${x - 3.5} 109 Z`, fill: '#596273' }),
        ];
      });
    case 'wings':
      return [-1, 1].map((side) => {
        const x = (dx) => CX + side * dx;
        return [
          svg('path', { d: `M${x(18)} 84 L${x(60)} 54 L${x(52)} 80 L${x(64)} 86 L${x(48)} 96 L${x(56)} 108 L${x(20)} 100 Z`, fill: c.trim, opacity: 0.42, stroke: c.trim, 'stroke-width': 1.8, 'stroke-linejoin': 'round' }),
          svg('path', { d: `M${x(22)} 90 L${x(54)} 62 M${x(22)} 94 L${x(56)} 88 M${x(22)} 98 L${x(48)} 104`, stroke: '#fff', opacity: 0.55, 'stroke-width': 1.2 }),
        ];
      });
    default:
      return null;
  }
};

/** Neck gear sits in front of the torso. */
const neckGear = (back, c) => (back === 'scarf' ? [
  svg('path', { d: 'M80 76 L94 100 L86 103 L76 80 Z', fill: c.trim, stroke: OUTLINE, 'stroke-width': 1.5 }),
  svg('path', { d: 'M55 70 Q70 78 85 70 L87 78 Q70 88 53 78 Z', fill: c.trim, stroke: OUTLINE, 'stroke-width': 1.5 }),
  svg('path', { d: 'M60 76 Q70 81 80 76', fill: 'none', stroke: 'rgba(0,0,0,0.25)', 'stroke-width': 1.5 }),
] : null);

const hairBehind = (hair, c) => {
  switch (hair) {
    case 'ponytail':
      return [
        outlinedLine('M92 26 C116 26 122 54 112 82', c.trim, 7),
        [44, 58, 72].map((y, i) => svg('rect', { x: 111 + (i === 2 ? -3 : 1) - 4.5, y, width: 9, height: 4, rx: 1.5, fill: DARK })),
        joint(112, 84, 3.5, c.trim),
      ];
    case 'buns':
      return [-1, 1].map((side) => [
        svg('circle', { cx: CX + side * 25, cy: 18, r: 11, fill: c.trim, stroke: OUTLINE, 'stroke-width': 2 }),
        svg('circle', { cx: CX + side * 25, cy: 18, r: 5, fill: 'none', stroke: 'rgba(0,0,0,0.25)', 'stroke-width': 2 }),
      ]);
    case 'spikes':
      return svg('path', { d: 'M48 26 L50 0 L62 16 L70 -6 L78 16 L90 0 L92 26 Z', fill: c.trim, stroke: OUTLINE, 'stroke-width': 2, 'stroke-linejoin': 'round' });
    case 'mohawk':
      return [
        svg('path', { d: 'M56 22 L58 2 L66 12 L70 -6 L74 12 L82 2 L84 22 Z', fill: c.trim, stroke: OUTLINE, 'stroke-width': 2, 'stroke-linejoin': 'round' }),
        svg('path', { d: 'M70 -2 L70 18', stroke: 'rgba(255,255,255,0.5)', 'stroke-width': 1.5 }),
      ];
    default:
      return null;
  }
};

const hairFront = (hair, c) => {
  switch (hair) {
    case 'antenna':
      return [
        svg('path', { d: 'M70 17 L70 4', stroke: DARK, 'stroke-width': 3, 'stroke-linecap': 'round' }),
        glow(70, 3, 7, c.trim),
        svg('circle', { cx: 70, cy: 3, r: 4, fill: c.trim, stroke: OUTLINE, 'stroke-width': 1.2 }),
      ];
    case 'cables':
      return [-1, 1].map((side) => {
        const x = (dx) => CX + side * dx;
        return [
          outlinedLine(`M${x(28)} 28 C${x(42)} 48 ${x(36)} 74 ${x(32)} 96`, c.trim, 4.5),
          outlinedLine(`M${x(24)} 24 C${x(36)} 46 ${x(30)} 66 ${x(26)} 86`, c.trim, 4),
          joint(x(32), 97, 3, DARK),
          joint(x(26), 87, 2.6, DARK),
        ];
      });
    default:
      return null;
  }
};

/* ------------------------------------------------------------------ */
/* Legs, arms and torso                                                */
/* ------------------------------------------------------------------ */

const legs = (style, c) => {
  if (style === 'hover') {
    return [
      glow(CX, 134, 13, c.trim),
      flame(CX - 5, 122, 16),
      flame(CX + 5, 122, 16),
      svg('path', { d: 'M56 110 L84 110 L78 124 L62 124 Z', fill: DARK, stroke: OUTLINE, 'stroke-width': 1.5 }),
      svg('rect', { x: 61, y: 116, width: 18, height: 3, fill: c.trim }),
    ];
  }
  if (style === 'treads') {
    return [
      svg('rect', { x: 60, y: 108, width: 20, height: 12, fill: DARK }),
      svg('rect', { x: 46, y: 118, width: 48, height: 24, rx: 12, fill: DARK, stroke: OUTLINE, 'stroke-width': 2 }),
      svg('rect', { x: 49, y: 121, width: 42, height: 18, rx: 9, fill: 'none', stroke: '#596273', 'stroke-width': 2, 'stroke-dasharray': '3 3' }),
      [57, 70, 83].map((x) => [
        svg('circle', { cx: x, cy: 130, r: 6, fill: c.paint, stroke: OUTLINE, 'stroke-width': 1.5 }),
        svg('circle', { cx: x, cy: 130, r: 2, fill: c.trim }),
      ]),
    ];
  }
  return [-1, 1].map((side) => {
    const x = (dx) => CX + side * dx;
    const foot = svg('path', { d: `M${x(4)} 137 L${x(20)} 137 Q${x(22)} 143 ${x(18)} 144 L${x(5)} 144 Q${x(3)} 144 ${x(4)} 137 Z`, fill: c.paint, stroke: OUTLINE, 'stroke-width': 1.6 });
    switch (style) {
      case 'spring':
        return [
          outlinedLine(`M${x(10)} 110 L${x(12)} 120`, c.paint, 7),
          svg('path', { d: `M${x(12)} 120 L${x(7)} 123 L${x(17)} 126 L${x(7)} 129 L${x(17)} 132 L${x(12)} 136`, fill: 'none', stroke: c.trim, 'stroke-width': 2.4, 'stroke-linejoin': 'round' }),
          foot,
        ];
      case 'boots':
        return [
          outlinedLine(`M${x(10)} 110 L${x(12)} 124`, c.paint, 7),
          svg('rect', { x: x(12) - 9, y: 124, width: 18, height: 20, rx: 4, fill: c.paint, stroke: OUTLINE, 'stroke-width': 1.8 }),
          svg('rect', { x: x(12) - 9, y: 139, width: 18, height: 5, rx: 2, fill: DARK }),
          svg('rect', { x: x(12) - 7, y: 129, width: 14, height: 3, fill: c.trim }),
        ];
      default:
        return [
          outlinedLine(`M${x(10)} 110 L${x(12)} 124 L${x(12)} 137`, c.paint, 7),
          joint(x(12), 124, 3.4, c.trim),
          foot,
        ];
    }
  });
};

/** One arm from the shoulder to the hand; `up` when cheering. */
const arm = (side, up, style, c) => {
  const x = (dx) => CX + side * dx;
  const s = [x(24), 82];
  const e = up ? [x(36), 68] : [x(31), 97];
  const hand = up ? [x(39), 52] : [x(33), 111];
  const upper = `M${s[0]} ${s[1]} L${e[0]} ${e[1]}`;
  const lower = `M${e[0]} ${e[1]} L${hand[0]} ${hand[1]}`;
  const fist = (r = 5.5) => svg('circle', { cx: hand[0], cy: hand[1], r, fill: c.paint, stroke: OUTLINE, 'stroke-width': 1.6 });

  switch (style) {
    case 'piston':
      return [
        outlinedLine(upper, c.paint, 7),
        svg('path', { d: lower, stroke: '#9aa3b2', 'stroke-width': 3, 'stroke-linecap': 'round' }),
        outlinedLine(`M${e[0]} ${e[1]} L${(e[0] + hand[0]) / 2} ${(e[1] + hand[1]) / 2}`, c.paint, 8),
        joint(e[0], e[1], 3.6, c.trim),
        svg('path', { d: `M${hand[0] - 4} ${hand[1] + (up ? -2 : 2)} L${hand[0]} ${hand[1] + (up ? -7 : 7)} L${hand[0] + 4} ${hand[1] + (up ? -2 : 2)}`, fill: 'none', stroke: DARK, 'stroke-width': 2.5, 'stroke-linecap': 'round' }),
        fist(4),
      ];
    case 'gauntlet':
      return [
        outlinedLine(upper, c.paint, 7),
        outlinedLine(lower, c.paint, 12),
        svg('path', { d: lower, stroke: c.trim, 'stroke-width': 2.2, 'stroke-linecap': 'round' }),
        joint(e[0], e[1], 3.6, c.trim),
        fist(7.5),
        svg('circle', { cx: hand[0], cy: hand[1], r: 2.5, fill: c.trim }),
      ];
    case 'wrench':
      if (side === 1) {
        return [
          outlinedLine(upper, c.paint, 7),
          outlinedLine(lower, '#9aa3b2', 5),
          joint(e[0], e[1], 3.6, c.trim),
          svg('circle', { cx: hand[0], cy: hand[1], r: 7, fill: '#9aa3b2', stroke: OUTLINE, 'stroke-width': 1.6 }),
          svg('rect', { x: hand[0] - 2.5, y: hand[1] + (up ? -9 : 2), width: 5, height: 7, fill: SCREEN }),
        ];
      }
      return arm(side, up, 'basic', c);
    case 'thruster':
      return [
        arm(side, up, 'basic', c),
        flame(hand[0], hand[1] + 5, 12),
        svg('rect', { x: hand[0] - 5, y: hand[1] + 1, width: 10, height: 5, rx: 1.5, fill: DARK }),
      ];
    default:
      return [
        outlinedLine(upper, c.paint, 7),
        outlinedLine(lower, c.paint, 7),
        joint(e[0], e[1], 3.6, c.trim),
        fist(),
      ];
  }
};

const torso = (c) => [
  svg('path', { d: 'M46 80 Q46 75 51 75 L89 75 Q94 75 94 80 L90 107 Q89 113 83 113 L57 113 Q51 113 50 107 Z', fill: c.paint, stroke: OUTLINE, 'stroke-width': 2 }),
  svg('path', { d: 'M52 78 L88 78 L86 86 L54 86 Z', fill: 'rgba(255,255,255,0.28)' }),
  svg('path', { d: 'M56 99 L84 99', stroke: 'rgba(0,0,0,0.22)', 'stroke-width': 1.5 }),
  svg('rect', { x: 53, y: 103, width: 34, height: 4, rx: 2, fill: 'rgba(0,0,0,0.25)' }),
  glow(CX, 92, 9, c.trim),
  svg('circle', { cx: CX, cy: 92, r: 6, fill: SCREEN, stroke: OUTLINE, 'stroke-width': 1.2 }),
  svg('circle', { cx: CX, cy: 92, r: 3.4, fill: c.trim }),
  [-1, 1].map((side) => svg('circle', { cx: CX + side * 24, cy: 82, r: 7, fill: c.paint, stroke: OUTLINE, 'stroke-width': 1.8 })),
  [-1, 1].map((side) => svg('circle', { cx: CX + side * 24, cy: 82, r: 2.4, fill: c.trim })),
];

/* ------------------------------------------------------------------ */
/* Head and face                                                       */
/* ------------------------------------------------------------------ */

const headShape = (style, c) => {
  const shell = { fill: c.paint, stroke: OUTLINE, 'stroke-width': 2.2 };
  const ears = [-1, 1].map((side) => [
    svg('rect', { x: CX + side * 34 - 5, y: 34, width: 10, height: 20, rx: 4, fill: DARK, stroke: OUTLINE, 'stroke-width': 1.5 }),
    svg('rect', { x: CX + side * 34 - 2, y: 39, width: 4, height: 10, rx: 2, fill: c.trim }),
  ]);
  const shine = svg('path', { d: 'M46 26 Q54 19 66 19', fill: 'none', stroke: 'rgba(255,255,255,0.55)', 'stroke-width': 3, 'stroke-linecap': 'round' });
  switch (style) {
    case 'box':
      return [ears, svg('rect', { x: 38, y: 17, width: 64, height: 53, rx: 8, ...shell }), shine,
        [[43, 22], [97, 22], [43, 65], [97, 65]].map(([x, y]) => svg('circle', { cx: x, cy: y, r: 1.8, fill: 'rgba(0,0,0,0.35)' }))];
    case 'visor':
      return [svg('path', { d: 'M38 42 C38 22 52 16 70 16 C88 16 102 22 102 42 L108 46 L102 50 C101 64 88 70 70 70 C52 70 39 64 38 50 L32 46 Z', ...shell }), shine,
        svg('path', { d: 'M40 46 L32 46 M100 46 L108 46', stroke: c.trim, 'stroke-width': 2 })];
    case 'fin':
      return [
        [-1, 1].map((side) => [
          svg('path', { d: `M${CX + side * 28} 30 L${CX + side * 34} 2 L${CX + side * 12} 20 Z`, ...shell, 'stroke-linejoin': 'round' }),
          svg('path', { d: `M${CX + side * 27} 24 L${CX + side * 31} 9 L${CX + side * 19} 20 Z`, fill: c.trim }),
        ]),
        svg('rect', { x: 38, y: 16, width: 64, height: 54, rx: 24, ...shell }), shine,
      ];
    case 'dome':
      return [ears, svg('rect', { x: 38, y: 24, width: 64, height: 46, rx: 14, ...shell }),
        svg('path', { d: 'M42 32 C42 0 98 0 98 32 Z', fill: 'rgba(170, 225, 255, 0.35)', stroke: 'rgba(255,255,255,0.8)', 'stroke-width': 1.8 }),
        glow(CX, 15, 8, c.trim),
        svg('circle', { cx: CX, cy: 15, r: 4.5, fill: c.trim }),
        svg('path', { d: 'M50 24 Q54 10 66 7', fill: 'none', stroke: 'rgba(255,255,255,0.8)', 'stroke-width': 2.2, 'stroke-linecap': 'round' })];
    case 'knight':
      return [
        svg('path', { d: 'M38 40 C38 22 50 14 70 14 C90 14 102 22 102 40 L102 58 L92 70 L48 70 L38 58 Z', ...shell }),
        svg('path', { d: 'M70 2 L77 16 L63 16 Z', fill: c.trim, stroke: OUTLINE, 'stroke-width': 1.5 }),
        svg('path', { d: 'M70 15 L70 26', stroke: 'rgba(0,0,0,0.3)', 'stroke-width': 2 }),
        svg('path', { d: 'M40 58 L48 66 M100 58 L92 66', stroke: c.trim, 'stroke-width': 2.4 }),
        shine,
      ];
    default: // pod
      return [ears, svg('rect', { x: 38, y: 16, width: 64, height: 54, rx: 24, ...shell }), shine];
  }
};

const star = (x, y, r) => {
  const pts = [];
  for (let i = 0; i < 10; i += 1) {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const rr = i % 2 ? r * 0.45 : r;
    pts.push(`${(x + rr * Math.cos(a)).toFixed(1)},${(y + rr * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(' ');
};

/** One eye of a style in its resting shape, centred on (x, y). `side` -1 left, 1 right. */
const eyeShape = (style, x, y, side, fill) => {
  switch (style) {
    case 'pixel':
      return [svg('rect', { x: x - 5, y: y - 5, width: 10, height: 10, rx: 1.5, fill }), svg('rect', { x: x - 3.5, y: y - 3.5, width: 3, height: 3, fill: '#fff', opacity: 0.85 })];
    case 'sharp':
      return svg('polygon', { points: `${x - side * 7},${y - 4} ${x + side * 7},${y - 1} ${x + side * 5},${y + 5} ${x - side * 6},${y + 3}`, fill });
    case 'heart':
      return svg('path', { d: `M${x} ${y + 6} C${x - 10} ${y - 1} ${x - 5} ${y - 9} ${x} ${y - 3} C${x + 5} ${y - 9} ${x + 10} ${y - 1} ${x} ${y + 6} Z`, fill });
    case 'star':
      return svg('polygon', { points: star(x, y, 7.5), fill });
    case 'cyclops':
      return [
        svg('circle', { cx: x, cy: y, r: 11, fill: 'none', stroke: fill, 'stroke-width': 2, opacity: 0.6 }),
        svg('circle', { cx: x, cy: y, r: 8, fill }),
        svg('circle', { cx: x, cy: y, r: 3.5, fill: SCREEN }),
        svg('circle', { cx: x - 3, cy: y - 3, r: 1.8, fill: '#fff' }),
      ];
    default:
      return [svg('circle', { cx: x, cy: y, r: 6, fill }), svg('circle', { cx: x - 2, cy: y - 2, r: 1.8, fill: '#fff', opacity: 0.85 })];
  }
};

const eyeLine = (d, colour, width = 3) => svg('path', { d, fill: 'none', stroke: colour, 'stroke-width': width, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });

/** One eye in a mood. Shapes with a strong look (hearts, stars) keep their shape when cheering. */
const eye = (style, mood, x, y, side, colour) => {
  const big = style === 'cyclops' ? 1.6 : 1;
  switch (mood) {
    case 'cheer':
      return style === 'heart' || style === 'star'
        ? svg('g', { transform: `translate(${x} ${y}) scale(1.2) translate(${-x} ${-y})` }, eyeShape(style, x, y, side, colour))
        : eyeLine(`M${x - 6 * big} ${y + 2 * big} Q${x} ${y - 7 * big} ${x + 6 * big} ${y + 2 * big}`, colour);
    case 'think':
      return svg('g', { transform: 'translate(2 -3)' }, eyeShape(style, x, y, side, colour));
    case 'oops':
      return eyeLine(`M${x - side * 5 * big} ${y - 5 * big} L${x + side * 4 * big} ${y} L${x - side * 5 * big} ${y + 5 * big}`, colour);
    case 'sleep':
      return eyeLine(`M${x - 6 * big} ${y} Q${x} ${y + 4 * big} ${x + 6 * big} ${y}`, colour);
    default:
      return eyeShape(style, x, y, side, colour);
  }
};

const MOUTHS = {
  happy: (col) => eyeLine('M64 54 Q70 58 76 54', col, 2.2),
  cheer: (col) => svg('path', { d: 'M63 52 Q70 61 77 52 Z', fill: col }),
  think: (col) => svg('circle', { cx: 75, cy: 55, r: 2, fill: col }),
  oops: (col) => eyeLine('M63 56 Q66 53 69 56 Q72 59 75 56', col, 2),
  sleep: (col) => eyeLine('M66 56 L74 56', col, 2),
};

const face = (r, mood, eyeColour) => {
  const screen = r.head === 'visor'
    ? svg('rect', { x: 44, y: 29, width: 52, height: 32, rx: 14, fill: SCREEN, stroke: 'rgba(255,255,255,0.18)', 'stroke-width': 1.5 })
    : svg('rect', { x: 46, y: 28, width: 48, height: 33, rx: r.head === 'box' ? 6 : 11, fill: SCREEN, stroke: 'rgba(255,255,255,0.18)', 'stroke-width': 1.5 });
  const eyes = r.eyes === 'cyclops'
    ? [svg('circle', { cx: CX, cy: 43, r: 13, fill: eyeColour, opacity: 0.18 }), eye('cyclops', mood, CX, 43, 1, eyeColour)]
    : [-1, 1].map((side) => [
      svg('circle', { cx: CX + side * 11, cy: 43, r: 9, fill: eyeColour, opacity: 0.16 }),
      eye(r.eyes, mood, CX + side * 11, 43, side, eyeColour),
    ]);
  return [
    screen,
    eyes,
    r.eyes !== 'cyclops' && (MOUTHS[mood] || MOUTHS.happy)(eyeColour),
    svg('path', { d: 'M50 32 L60 32 L52 44 Z', fill: '#fff', opacity: 0.08 }),
  ];
};

/* ------------------------------------------------------------------ */
/* Headgear                                                            */
/* ------------------------------------------------------------------ */

const hatGear = (hat, c) => {
  switch (hat) {
    case 'headphones':
      return [
        svg('path', { d: 'M34 44 C34 4 106 4 106 44', fill: 'none', stroke: DARK, 'stroke-width': 5, 'stroke-linecap': 'round' }),
        [-1, 1].map((side) => [
          svg('rect', { x: CX + side * 35 - 7, y: 32, width: 14, height: 24, rx: 6, fill: c.trim, stroke: OUTLINE, 'stroke-width': 1.8 }),
          svg('rect', { x: CX + side * 35 - 3, y: 37, width: 6, height: 14, rx: 3, fill: DARK }),
        ]),
      ];
    case 'cap':
      return [
        svg('path', { d: 'M40 30 C40 4 100 4 100 30 Z', fill: c.trim, stroke: OUTLINE, 'stroke-width': 2 }),
        svg('path', { d: 'M88 27 Q112 24 118 33 L88 33 Z', fill: c.trim, stroke: OUTLINE, 'stroke-width': 2 }),
        svg('path', { d: 'M70 8 L70 30', stroke: 'rgba(0,0,0,0.25)', 'stroke-width': 1.5 }),
        svg('circle', { cx: CX, cy: 8, r: 2.6, fill: DARK }),
      ];
    case 'bow':
      return [
        svg('path', { d: 'M90 16 L77 7 L79 25 Z M90 16 L103 7 L101 25 Z', fill: '#ff5fa2', stroke: OUTLINE, 'stroke-width': 1.5, 'stroke-linejoin': 'round' }),
        svg('circle', { cx: 90, cy: 16, r: 3.6, fill: '#ff8fc0', stroke: OUTLINE, 'stroke-width': 1.2 }),
      ];
    case 'flower':
      return [
        [0, 72, 144, 216, 288].map((deg) => {
          const a = (deg * Math.PI) / 180;
          return svg('circle', { cx: (88 + 6 * Math.cos(a)).toFixed(1), cy: (16 + 6 * Math.sin(a)).toFixed(1), r: 5, fill: '#ffb3d1', stroke: OUTLINE, 'stroke-width': 1 });
        }),
        svg('circle', { cx: 88, cy: 16, r: 4, fill: '#ffd23a' }),
      ];
    case 'tophat':
      return [
        svg('rect', { x: 54, y: -14, width: 32, height: 32, rx: 3, fill: '#1d2230', stroke: OUTLINE, 'stroke-width': 1.5 }),
        svg('rect', { x: 54, y: 9, width: 32, height: 5, fill: c.trim }),
        svg('rect', { x: 44, y: 16, width: 52, height: 5, rx: 2.5, fill: '#1d2230', stroke: OUTLINE, 'stroke-width': 1.5 }),
      ];
    case 'grad':
      return [
        svg('path', { d: 'M52 14 L52 26 Q70 32 88 26 L88 14 Z', fill: '#1d2230', stroke: OUTLINE, 'stroke-width': 1.5 }),
        svg('path', { d: 'M38 12 L70 1 L102 12 L70 23 Z', fill: '#262c3a', stroke: OUTLINE, 'stroke-width': 1.5 }),
        svg('path', { d: 'M70 12 L98 15 L98 28', fill: 'none', stroke: '#ffcc33', 'stroke-width': 1.8 }),
        svg('circle', { cx: 98, cy: 29, r: 2.4, fill: '#ffcc33' }),
      ];
    case 'crown':
      return [
        svg('path', { d: 'M50 20 L48 2 L60 11 L70 -4 L80 11 L92 2 L90 20 Z', fill: '#ffcc33', stroke: '#9c6b05', 'stroke-width': 1.8, 'stroke-linejoin': 'round' }),
        [[58, 15, '#ff4d5e'], [70, 13, '#35e0ff'], [82, 15, '#3ed67a']].map(([x, y, col]) => svg('circle', { cx: x, cy: y, r: 2.6, fill: col })),
      ];
    case 'halo':
      return [
        svg('ellipse', { cx: CX, cy: 3, rx: 22, ry: 5.5, fill: 'none', stroke: '#ffe27a', 'stroke-width': 8, opacity: 0.3 }),
        svg('ellipse', { cx: CX, cy: 3, rx: 22, ry: 5.5, fill: 'none', stroke: '#ffe27a', 'stroke-width': 3.5 }),
      ];
    default:
      return null;
  }
};

/* ------------------------------------------------------------------ */
/* Robot pets                                                          */
/* ------------------------------------------------------------------ */

const PET_METAL = '#d3dbe6';

/** Two small screen eyes for a pet. */
const petEyes = (x1, x2, y, colour) => [x1, x2].map((x) => svg('circle', { cx: x, cy: y, r: 2.3, fill: colour }));

const PETS = {
  orb: (c) => [
    svg('path', { d: 'M24 8 L24 13 M17 7 L31 7', stroke: DARK, 'stroke-width': 2, 'stroke-linecap': 'round' }),
    svg('circle', { cx: 24, cy: 26, r: 13, fill: PET_METAL, stroke: OUTLINE, 'stroke-width': 1.8 }),
    svg('rect', { x: 14, y: 21, width: 20, height: 9, rx: 4.5, fill: SCREEN }),
    svg('circle', { cx: 24, cy: 25.5, r: 3, fill: c.eye }),
    svg('ellipse', { cx: 24, cy: 34, rx: 20, ry: 4, fill: 'none', stroke: c.trim, 'stroke-width': 2 }),
  ],
  chick: (c) => [
    svg('ellipse', { cx: 24, cy: 29, rx: 14, ry: 13, fill: '#ffd86b', stroke: OUTLINE, 'stroke-width': 1.8 }),
    svg('path', { d: 'M24 16 L24 9', stroke: DARK, 'stroke-width': 2 }), svg('circle', { cx: 24, cy: 8, r: 2.6, fill: c.trim }),
    svg('rect', { x: 15, y: 20, width: 18, height: 9, rx: 4, fill: SCREEN }),
    petEyes(20, 28, 24.5, c.eye),
    svg('path', { d: 'M21 31 L27 31 L24 36 Z', fill: '#ff8a2a' }),
    svg('path', { d: 'M11 30 Q6 34 11 38', fill: 'none', stroke: OUTLINE, 'stroke-width': 1.5 }),
  ],
  cat: (c) => [
    svg('path', { d: 'M10 20 L12 5 L21 14 Z M38 20 L36 5 L27 14 Z', fill: PET_METAL, stroke: OUTLINE, 'stroke-width': 1.6, 'stroke-linejoin': 'round' }),
    svg('path', { d: 'M13 15 L14 9 L18 13 Z M35 15 L34 9 L30 13 Z', fill: c.trim }),
    svg('rect', { x: 8, y: 12, width: 32, height: 26, rx: 11, fill: PET_METAL, stroke: OUTLINE, 'stroke-width': 1.8 }),
    svg('rect', { x: 13, y: 18, width: 22, height: 13, rx: 5, fill: SCREEN }),
    petEyes(19, 29, 24, c.eye),
    svg('path', { d: 'M4 28 L12 29 M4 33 L12 31 M44 28 L36 29 M44 33 L36 31', stroke: DARK, 'stroke-width': 1.2 }),
    svg('path', { d: 'M38 42 Q46 38 42 30', fill: 'none', stroke: c.trim, 'stroke-width': 2.5, 'stroke-linecap': 'round' }),
  ],
  dog: (c) => [
    svg('ellipse', { cx: 9, cy: 24, rx: 5, ry: 10, fill: c.trim, stroke: OUTLINE, 'stroke-width': 1.5 }),
    svg('ellipse', { cx: 39, cy: 24, rx: 5, ry: 10, fill: c.trim, stroke: OUTLINE, 'stroke-width': 1.5 }),
    svg('rect', { x: 10, y: 10, width: 28, height: 28, rx: 11, fill: PET_METAL, stroke: OUTLINE, 'stroke-width': 1.8 }),
    svg('rect', { x: 14, y: 16, width: 20, height: 11, rx: 5, fill: SCREEN }),
    petEyes(19.5, 28.5, 21.5, c.eye),
    svg('ellipse', { cx: 24, cy: 32, rx: 6, ry: 4, fill: '#9aa3b2' }), svg('circle', { cx: 24, cy: 30.5, r: 2, fill: DARK }),
  ],
  bunny: (c) => [
    [17, 31].map((x) => [
      svg('rect', { x: x - 4, y: 0, width: 8, height: 20, rx: 4, fill: PET_METAL, stroke: OUTLINE, 'stroke-width': 1.5 }),
      svg('rect', { x: x - 1.5, y: 3, width: 3, height: 13, rx: 1.5, fill: c.trim }),
    ]),
    svg('rect', { x: 9, y: 15, width: 30, height: 25, rx: 12, fill: PET_METAL, stroke: OUTLINE, 'stroke-width': 1.8 }),
    svg('rect', { x: 14, y: 20, width: 20, height: 11, rx: 5, fill: SCREEN }),
    petEyes(19.5, 28.5, 25.5, c.eye),
    svg('path', { d: 'M22 35 L26 35', stroke: DARK, 'stroke-width': 2, 'stroke-linecap': 'round' }),
  ],
  turtle: (c) => [
    svg('circle', { cx: 39, cy: 30, r: 6, fill: PET_METAL, stroke: OUTLINE, 'stroke-width': 1.5 }),
    svg('circle', { cx: 41, cy: 29, r: 1.8, fill: c.eye }),
    svg('rect', { x: 10, y: 34, width: 6, height: 7, rx: 2, fill: DARK }), svg('rect', { x: 26, y: 34, width: 6, height: 7, rx: 2, fill: DARK }),
    svg('path', { d: 'M5 36 C5 14 37 14 37 36 Z', fill: c.trim, stroke: OUTLINE, 'stroke-width': 1.8 }),
    svg('path', { d: 'M14 36 L16 26 L26 26 L28 36 M16 26 L21 19 L26 26 M8 30 L16 26 M34 30 L26 26', fill: 'none', stroke: 'rgba(0,0,0,0.35)', 'stroke-width': 1.4 }),
    svg('rect', { x: 4, y: 35, width: 34, height: 3.5, rx: 1.7, fill: PET_METAL, stroke: OUTLINE, 'stroke-width': 1 }),
  ],
  spider: (c) => [
    [-1, 1].map((side) => [10, 18, 26].map((y, i) => svg('path', {
      d: `M${24 + side * 8} ${y + 6} L${24 + side * (17 + i)} ${y} L${24 + side * (21 + i)} ${y + 14}`,
      fill: 'none', stroke: DARK, 'stroke-width': 2.2, 'stroke-linejoin': 'round',
    }))),
    svg('ellipse', { cx: 24, cy: 26, rx: 11, ry: 10, fill: PET_METAL, stroke: OUTLINE, 'stroke-width': 1.8 }),
    svg('rect', { x: 16, y: 21, width: 16, height: 8, rx: 4, fill: SCREEN }),
    [19, 23, 27].map((x, i) => svg('circle', { cx: x + 1, cy: 25, r: i === 1 ? 2.2 : 1.6, fill: c.eye })),
    svg('circle', { cx: 24, cy: 33, r: 1.8, fill: c.trim }),
  ],
  dino: (c) => [
    svg('path', { d: 'M8 36 Q0 30 4 22 Q8 32 14 32 Z', fill: PET_METAL, stroke: OUTLINE, 'stroke-width': 1.5 }),
    svg('path', { d: 'M12 22 L15 14 L19 20 L22 11 L26 18 L29 10 L31 18', fill: c.trim, stroke: OUTLINE, 'stroke-width': 1.3, 'stroke-linejoin': 'round' }),
    svg('path', { d: 'M10 38 C10 20 30 16 34 22 L44 20 Q48 28 40 31 L34 31 C34 36 30 40 24 40 Z', fill: PET_METAL, stroke: OUTLINE, 'stroke-width': 1.8, 'stroke-linejoin': 'round' }),
    svg('rect', { x: 35, y: 22, width: 8, height: 5, rx: 2, fill: SCREEN }),
    svg('circle', { cx: 39.5, cy: 24.5, r: 1.8, fill: c.eye }),
    svg('rect', { x: 15, y: 38, width: 5, height: 6, rx: 1.5, fill: DARK }), svg('rect', { x: 25, y: 38, width: 5, height: 6, rx: 1.5, fill: DARK }),
  ],
};

/* ------------------------------------------------------------------ */
/* Public drawing functions                                            */
/* ------------------------------------------------------------------ */

/**
 * Resolve colours: a plain colour, or a gradient reference for chrome, gold
 * and rainbow. Returns { colours, defs }.
 */
const resolveColours = (robot) => {
  drawingCount += 1;
  const prefix = `rb${drawingCount}`;
  const defs = [];
  const finish = (value, vertical) => {
    if (!GRADIENTS[value]) return value;
    const id = `${prefix}-${value}${vertical ? '-v' : ''}`;
    defs.push(linearGradient(id, GRADIENTS[value], vertical));
    return `url(#${id})`;
  };
  return {
    colours: { paint: finish(robot.paint, false), trim: robot.trim, eye: finish(robot.eyeColor, true) },
    defs: defs.length ? svg('defs', {}, defs) : null,
  };
};

/**
 * The robot as an <svg>.
 * @param {Object} robot Values from engine/robot.js robotLook().
 * @param {{mood?: string, headOnly?: boolean}} [options] headOnly crops to the head, for avatars.
 */
export const robotSvg = (robot, { mood = 'happy', headOnly = false } = {}) => {
  const { colours: c, defs } = resolveColours(robot);
  const hidesTopHair = COVERING_HATS.has(robot.hat) && TOP_HAIR.has(robot.hair);
  const hair = hidesTopHair ? 'none' : robot.hair;
  const up = mood === 'cheer';
  return svg('svg', {
    viewBox: headOnly ? '26 -8 88 84' : '0 -8 140 156',
    class: `robot-svg${headOnly ? ' robot-head' : ''}`,
    'aria-hidden': 'true',
  },
  defs,
  !headOnly && backGear(robot.back, c),
  hairBehind(hair, c),
  !headOnly && [
    legs(robot.legs, c),
    arm(-1, up, robot.arms, c),
    arm(1, up, robot.arms, c),
    torso(c),
    neckGear(robot.back, c),
  ],
  headShape(robot.head, c),
  face(robot, mood, c.eye),
  hairFront(hair, c),
  hatGear(robot.hat, c),
  mood === 'sleep' && !headOnly && svg('text', { x: 104, y: 22, class: 'pip-zz' }, 'z z'));
};

/** The robot's pet as a small <svg>, or null for none. */
export const robotPetSvg = (robot) => {
  const draw = PETS[robot.pet];
  if (!draw) return null;
  const { colours, defs } = resolveColours(robot);
  return svg('svg', { viewBox: '0 0 48 48', class: 'robot-pet-svg', 'aria-hidden': 'true' }, defs, draw(colours));
};
