/**
 * Pictures for the Grade 4 measurement, time, geometry and graph topics:
 * clock face, 24-hour day line, angles, square grids for area and
 * perimeter, symmetry folds, bar graphs and tables.
 *
 * Each renderer takes a JSON spec (made by js/engine/topics/*) and returns
 * one element. Registered in visuals.js, so renderVisual() handles them.
 */

import { h, svg } from '../../core/dom.js';
import { SYMMETRY_SHAPES } from '../../engine/topics/geometry.js';

const rad = (deg) => (deg * Math.PI) / 180;

/** A viewBox that fits all the points with a margin, so any angle stays centred. */
const fitBox = (points, pad = 22) => {
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const [x0, y0] = [Math.min(...xs) - pad, Math.min(...ys) - pad];
  return `${x0} ${y0} ${Math.max(...xs) + pad - x0} ${Math.max(...ys) + pad - y0}`;
};

/* ------------------------------------------------------------------ */
/* Time                                                                */
/* ------------------------------------------------------------------ */

/**
 * Analogue clock. `focus` ('hour' | 'minute') highlights one hand.
 * @param {{h: number, m: number, focus?: 'hour'|'minute'}} spec
 */
const renderClock = ({ h: hour, m, focus }) => {
  const c = 100;
  const nodes = [svg('circle', { cx: c, cy: c, r: 92, class: 'clk-face' })];
  for (let i = 0; i < 60; i += 1) {
    const a = rad(i * 6 - 90);
    const r1 = i % 5 ? 84 : 78;
    nodes.push(svg('line', { x1: c + r1 * Math.cos(a), y1: c + r1 * Math.sin(a), x2: c + 88 * Math.cos(a), y2: c + 88 * Math.sin(a), class: i % 5 ? 'clk-tick' : 'clk-tick-big' }));
  }
  for (let n = 1; n <= 12; n += 1) {
    const a = rad(n * 30 - 90);
    nodes.push(svg('text', { x: c + 64 * Math.cos(a), y: c + 64 * Math.sin(a) + 7, class: 'clk-num' }, n));
  }
  const hand = (deg, len, cls) => {
    const a = rad(deg - 90);
    return svg('line', { x1: c, y1: c, x2: c + len * Math.cos(a), y2: c + len * Math.sin(a), class: cls });
  };
  nodes.push(hand(((hour % 12) + m / 60) * 30, 46, `clk-hour${focus === 'hour' ? ' clk-hot' : ''}`));
  nodes.push(hand(m * 6, 74, `clk-minute${focus === 'minute' ? ' clk-hot' : ''}`));
  nodes.push(svg('circle', { cx: c, cy: c, r: 5, class: 'clk-pin' }));
  return h('div.visual.visual-clock', null,
    svg('svg', { viewBox: '0 0 200 200', role: 'img', 'aria-label': `A clock showing ${hour}:${String(m).padStart(2, '0')}` }, nodes));
};

/**
 * One day as a strip: 12-hour times above, 24-hour times below, and a
 * marker at `mins` (minutes after midnight).
 * @param {{mins: number}} spec
 */
const renderDayline = ({ mins }) => {
  const x = (t) => 20 + (t / 1440) * 300;
  const nodes = [
    svg('rect', { x: 20, y: 44, width: 150, height: 18, class: 'day-am' }),
    svg('rect', { x: 170, y: 44, width: 150, height: 18, class: 'day-pm' }),
    svg('text', { x: 20 + (450 / 1440) * 300, y: 57, class: 'day-half' }, 'a.m.'),
    svg('text', { x: 20 + (1170 / 1440) * 300, y: 57, class: 'day-half' }, 'p.m.'),
  ];
  for (let hr = 0; hr <= 24; hr += 3) {
    nodes.push(svg('line', { x1: x(hr * 60), y1: 40, x2: x(hr * 60), y2: 66, class: 'nl-tick' }));
    nodes.push(svg('text', { x: x(hr * 60), y: 34, class: 'day-label' }, hr === 12 ? 'noon' : (hr % 12) || 12));
    nodes.push(svg('text', { x: x(hr * 60), y: 82, class: 'day-label day-24' }, String(hr).padStart(2, '0')));
  }
  const hh = Math.floor(mins / 60);
  const label24 = `${String(hh).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
  nodes.push(svg('path', { d: `M${x(mins)} 40 l-7 -12 h14 Z`, class: 'day-marker' }));
  nodes.push(svg('line', { x1: x(mins), y1: 40, x2: x(mins), y2: 66, class: 'day-marker-line' }));
  nodes.push(svg('text', { x: Math.min(300, Math.max(40, x(mins))), y: 102, class: 'day-now' }, label24));
  return h('div.visual.visual-dayline', null,
    svg('svg', { viewBox: '0 0 340 110', role: 'img', 'aria-label': `${label24} on a 24-hour day line` }, nodes));
};

/* ------------------------------------------------------------------ */
/* Angles                                                              */
/* ------------------------------------------------------------------ */

/**
 * An angle between two arms.
 * - `ref` lays a square-corner card (a right angle, like a book corner) with
 *   its bottom edge exactly on the first arm and its corner on the vertex.
 * - `highlight: 'compare'` then shades what decides the answer: the part of
 *   the angle sticking out past the card (obtuse) or the gap the angle
 *   leaves inside the card (acute).
 * - `label` writes text such as "90°" inside the angle.
 * - `turn` draws a turning arrow (for 1/4, 1/2, 3/4 and full turns).
 * @param {{deg: number, rotate?: number, ref?: boolean, highlight?: 'compare', label?: string, turn?: boolean}} spec
 */
const renderAngle = ({ deg, rotate = 0, ref = false, highlight, label, turn = false }) => {
  const cx = 100;
  const cy = 100;
  const len = 80;
  const at = (a, r) => [cx + r * Math.cos(rad(-a)), cy + r * Math.sin(rad(-a))];
  const [x1, y1] = at(rotate, len);
  const [x2, y2] = at(rotate + deg, len);
  const nodes = [];
  /** Filled wedge from angle a0 to a1 (degrees), radius r, at the vertex. */
  const wedge = (a0, a1, r, cls) => {
    const [sx, sy] = at(a0, r);
    const [ex, ey] = at(a1, r);
    return svg('path', { d: `M${cx} ${cy} L${sx} ${sy} A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 0 ${ex} ${ey} Z`, class: cls });
  };
  if (ref) {
    // The card goes UNDER the arms, so the arms stay easy to see on top of it.
    const s = 58;
    const [ax, ay] = at(rotate, s);
    const [bx, by] = at(rotate + 90, s);
    nodes.push(svg('path', { d: `M${cx} ${cy} L${ax} ${ay} L${ax + bx - cx} ${ay + by - cy} L${bx} ${by} Z`, class: 'ang-card' }));
    if (highlight === 'compare' && deg > 90) nodes.push(wedge(rotate + 90, rotate + deg, 52, 'ang-extra'));
    if (highlight === 'compare' && deg < 90) nodes.push(wedge(rotate + deg, rotate + 90, 52, 'ang-gap'));
  }
  if (turn) nodes.push(svg('circle', { cx, cy, r: len, class: 'ang-guide' }));
  nodes.push(svg('line', { x1: cx, y1: cy, x2: x1, y2: y1, class: 'ang-arm' }));
  if (deg % 360) nodes.push(svg('line', { x1: cx, y1: cy, x2: x2, y2: y2, class: 'ang-arm' }));
  if (deg === 90 && !turn) {
    const s = 18;
    const [ax, ay] = at(rotate, s);
    const [bx, by] = at(rotate + 90, s);
    nodes.push(svg('path', { d: `M${ax} ${ay} L${ax + bx - cx} ${ay + by - cy} L${bx} ${by}`, class: 'ang-mark' }));
  } else {
    const r = turn ? 40 : 30;
    const end = Math.min(deg, 359.5);
    const [sx, sy] = at(rotate, r);
    const [ex, ey] = at(rotate + end, r);
    nodes.push(svg('path', { d: `M${sx} ${sy} A${r} ${r} 0 ${end > 180 ? 1 : 0} 0 ${ex} ${ey}`, class: `ang-mark${turn ? ' ang-turn' : ''}` }));
    if (turn) {
      // Arrow head at the end of the turn: two short lines pointing back along the arc.
      const a = rad(-(rotate + end));
      const tx = -Math.sin(a);
      const ty = Math.cos(a);
      nodes.push(svg('path', { d: `M${ex} ${ey} l${tx * 9 + Math.cos(a) * 6} ${ty * 9 + Math.sin(a) * 6} M${ex} ${ey} l${tx * 9 - Math.cos(a) * 6} ${ty * 9 - Math.sin(a) * 6}`, class: 'ang-turn' }));
    }
  }
  if (ref) {
    // The card's upright edge, continued, so the child sees where 90° is.
    const [ux, uy] = at(rotate + 90, len);
    nodes.push(svg('line', { x1: cx, y1: cy, x2: ux, y2: uy, class: 'ang-ref' }));
  }
  if (label) {
    const [lx, ly] = at(rotate + Math.min(deg, 180) / 2, 46);
    nodes.push(svg('text', { x: lx, y: ly + 5, class: 'ang-label' }, label));
  }
  nodes.push(svg('circle', { cx, cy, r: 3.5, class: 'clk-pin' }));
  return h('div.visual.visual-angle', null,
    svg('svg', { viewBox: turn ? '0 0 200 200' : fitBox([[cx, cy], [x1, y1], [x2, y2], ...(ref ? [at(rotate + 90, len), at(rotate + 45, 58 * Math.SQRT2)] : [])]), role: 'img', 'aria-label': turn ? `A turn of ${deg} degrees` : 'An angle' }, nodes));
};

/* ------------------------------------------------------------------ */
/* Area and perimeter                                                  */
/* ------------------------------------------------------------------ */

/**
 * A w × h rectangle on 1 cm squares.
 * mode 'area' shows the squares, 'perimeter' a thick outline with side
 * lengths, 'side' the area with a missing width. `rows` shades every
 * other row; `all` labels all four sides.
 * @param {{w: number, h: number, mode: 'area'|'perimeter'|'side', rows?: boolean, all?: boolean}} spec
 */
const renderRectGrid = ({ w, h: ht, mode, rows = false, all = false }) => {
  const cell = Math.min(240 / w, 150 / ht, 30);
  const ox = 46;
  const oy = 30;
  const W = w * cell;
  const H = ht * cell;
  const nodes = [];
  if (mode !== 'perimeter') {
    for (let r = 0; r < ht; r += 1) {
      for (let c = 0; c < w; c += 1) {
        nodes.push(svg('rect', { x: ox + c * cell, y: oy + r * cell, width: cell, height: cell, class: `rg-cell${rows && r % 2 ? ' rg-alt' : ''}` }));
      }
    }
  } else {
    nodes.push(svg('rect', { x: ox, y: oy, width: W, height: H, class: 'rg-fill' }));
  }
  nodes.push(svg('rect', { x: ox, y: oy, width: W, height: H, class: `rg-outline${mode === 'perimeter' ? ' rg-thick' : ''}` }));
  nodes.push(svg('text', { x: ox + W / 2, y: oy - 9, class: 'rg-label' }, `${w} cm`));
  nodes.push(svg('text', { x: ox - 8, y: oy + H / 2 + 5, class: 'rg-label rg-left' }, mode === 'side' ? '? cm' : `${ht} cm`));
  if (all) {
    nodes.push(svg('text', { x: ox + W / 2, y: oy + H + 20, class: 'rg-label' }, `${w} cm`));
    nodes.push(svg('text', { x: ox + W + 8, y: oy + H / 2 + 5, class: 'rg-label rg-right' }, `${ht} cm`));
  }
  if (mode === 'side') {
    nodes.push(svg('text', { x: ox + W / 2, y: oy + H / 2 + 6, class: 'rg-area' }, `${w * ht} cm²`));
  }
  const width = ox + W + (all ? 56 : 16);
  const height = oy + H + (all ? 30 : 12);
  return h('div.visual.visual-rect-grid', null,
    svg('svg', { viewBox: `0 0 ${width} ${height}`, role: 'img', 'aria-label': `A rectangle ${w} centimetres by ${mode === 'side' ? 'unknown' : ht} centimetres`, style: `max-width:${Math.max(220, width * 1.1)}px` }, nodes));
};

/* ------------------------------------------------------------------ */
/* Symmetry                                                            */
/* ------------------------------------------------------------------ */

/** SVG matrix that reflects across the line through (x1,y1)-(x2,y2). */
const reflection = ([x1, y1, x2, y2]) => {
  const t = Math.atan2(y2 - y1, x2 - x1);
  const a = Math.cos(2 * t);
  const b = Math.sin(2 * t);
  const e = x1 - (a * x1 + b * y1);
  const f = y1 - (b * x1 - a * y1);
  return `matrix(${a} ${b} ${b} ${-a} ${e} ${f})`;
};

/**
 * A shape with an optional dashed fold line. `fold` shows the shape flipped
 * over the line (so the child sees whether the halves match); `showAll`
 * draws every true line of symmetry in green.
 * @param {{shape: string, line?: number[], fold?: boolean, showAll?: boolean}} spec
 */
const renderSymmetry = ({ shape, line, fold = false, showAll = false }) => {
  const data = SYMMETRY_SHAPES[shape];
  if (!data) return null;
  const outline = (cls, extra = {}) => (data.path
    ? svg('path', { d: data.path, class: cls, ...extra })
    : svg('polygon', { points: data.points, class: cls, ...extra }));
  const nodes = [outline('sym-shape')];
  if (fold && line) nodes.push(outline('sym-flip', { transform: reflection(line) }));
  if (showAll) data.lines.forEach(([x1, y1, x2, y2]) => nodes.push(svg('line', { x1, y1, x2, y2, class: 'sym-true' })));
  if (line) {
    const [x1, y1, x2, y2] = line;
    nodes.push(svg('line', { x1, y1, x2, y2, class: 'sym-line' }));
  }
  return h('div.visual.visual-symmetry', null,
    svg('svg', { viewBox: '0 0 100 100', role: 'img', 'aria-label': `A ${shape}${line ? ' with a dashed line' : ''}` }, nodes));
};

/* ------------------------------------------------------------------ */
/* Bar graphs and tables                                               */
/* ------------------------------------------------------------------ */

/**
 * Vertical bar graph. `focus` lists bar indexes to highlight, with a dashed
 * guide across to the scale so the child sees how the value is read.
 * @param {{title: string, unit: string, labels: string[], values: number[], scale: number, focus?: number[]}} spec
 */
const renderBarGraph = ({ title, unit, labels, values, scale, focus = [] }) => {
  const top = Math.ceil(Math.max(...values) / scale) * scale;
  const ticks = top / scale;
  const ox = 44;
  const oy = 30;
  const H = 160;
  const W = 280;
  const y = (v) => oy + H - (v / top) * H;
  const slot = W / labels.length;
  const nodes = [svg('text', { x: ox + W / 2, y: 16, class: 'bg-title' }, title)];
  for (let k = 0; k <= ticks; k += 1) {
    const v = k * scale;
    nodes.push(svg('line', { x1: ox, y1: y(v), x2: ox + W, y2: y(v), class: 'bg-grid' }));
    nodes.push(svg('text', { x: ox - 6, y: y(v) + 4, class: 'bg-scale' }, v));
  }
  labels.forEach((label, i) => {
    const bx = ox + i * slot + slot * 0.2;
    const hot = focus.includes(i);
    nodes.push(svg('rect', { x: bx, y: y(values[i]), width: slot * 0.6, height: (values[i] / top) * H, class: `bg-bar${hot ? ' bg-hot' : ''}`, style: `--i:${i}` }));
    nodes.push(svg('text', { x: bx + slot * 0.3, y: oy + H + 16, class: 'bg-label' }, label));
    if (hot) {
      nodes.push(svg('line', { x1: ox, y1: y(values[i]), x2: bx, y2: y(values[i]), class: 'bg-guide' }));
      nodes.push(svg('text', { x: bx + slot * 0.3, y: y(values[i]) - 6, class: 'bg-value' }, values[i]));
    }
  });
  nodes.push(svg('line', { x1: ox, y1: oy, x2: ox, y2: oy + H, class: 'bg-axis' }));
  nodes.push(svg('line', { x1: ox, y1: oy + H, x2: ox + W, y2: oy + H, class: 'bg-axis' }));
  nodes.push(svg('text', { x: 12, y: oy + H / 2, class: 'bg-unit', transform: `rotate(-90 12 ${oy + H / 2})` }, `Number of ${unit}`));
  return h('div.visual.visual-bar-graph', null,
    svg('svg', { viewBox: '0 0 336 214', role: 'img', 'aria-label': `${title}: ${labels.map((l, i) => `${l} ${values[i]}`).join(', ')}` }, nodes));
};

/** The same data as a table. */
const renderTable = ({ title, unit, labels, values, focus = [] }) =>
  h('div.visual.visual-table', null,
    h('table.data-table', null,
      h('caption', null, title),
      h('thead', null, h('tr', null, h('th', null, ''), h('th', null, `Number of ${unit}`))),
      h('tbody', null, labels.map((l, i) => h(`tr${focus.includes(i) ? '.dt-hot' : ''}`, null, h('th', null, l), h('td', null, values[i]))))));

export const TOPIC_RENDERERS = {
  clock: renderClock,
  dayline: renderDayline,
  angle: renderAngle,
  rectGrid: renderRectGrid,
  symmetry: renderSymmetry,
  barGraph: renderBarGraph,
  table: renderTable,
};
