/**
 * Pictures for the Grade 5–6 geometry topics: triangles (base and height,
 * or angles), cuboids made of 1 cm cubes, and circles with a radius or
 * diameter, and a hundred square for percentages. Each renderer takes a JSON spec made by js/engine/topics/solids.js
 * and returns one element. Registered in visuals.js.
 */

import { h, svg } from '../../core/dom.js';

const rad = (deg) => (deg * Math.PI) / 180;

/** A viewBox around all the points with a margin. */
const fitBox = (points, pad) => {
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const [x0, y0] = [Math.min(...xs) - pad, Math.min(...ys) - pad];
  return { box: `${x0} ${y0} ${Math.max(...xs) + pad - x0} ${Math.max(...ys) + pad - y0}`, width: Math.max(...xs) - x0 + pad };
};

const label = (x, y, text, cls = '') => svg('text', { x, y, class: `sol-label${cls}` }, text);

/* ------------------------------------------------------------------ */
/* Triangle                                                            */
/* ------------------------------------------------------------------ */

/** Base and height (area questions). `apex` is where the top sits along the base, 0 to 1. */
const triangleByHeight = ({ base, height, apex = 0.5, box = false, hideHeight = false }) => {
  const s = Math.min(220 / base, 140 / height);
  const W = Math.max(80, base * s);
  const H = Math.max(56, height * s);
  const [x0, y0] = [0, H];
  const top = [apex * W, 0];
  const nodes = [];
  if (box) nodes.push(svg('rect', { x: 0, y: 0, width: W, height: H, class: 'sol-box' }));
  nodes.push(svg('polygon', { points: `${x0},${y0} ${W},${H} ${top[0]},${top[1]}`, class: 'tri-fill' }));
  // Height: a dashed line from the top straight down, with a square corner at its foot.
  const hx = top[0];
  nodes.push(svg('line', { x1: hx, y1: 0, x2: hx, y2: H, class: 'sol-height' }));
  const dir = apex > 0.5 ? -1 : 1;
  nodes.push(svg('path', { d: `M${hx + 10 * dir} ${H} V${H - 10} H${hx}`, class: 'sol-corner' }));
  const heightText = hideHeight ? '? cm' : `${height} cm`;
  nodes.push(label(hx + (apex > 0.5 ? -8 : 8), H / 2 + 5, heightText, apex > 0.5 ? ' sol-end' : ' sol-start'));
  nodes.push(label(W / 2, H + 22, `${base} cm`));
  const { box: viewBox, width } = fitBox([[0, 0], [W, H + 26], [hx - 60, 0], [hx + 60, 0]], 8);
  return h('div.visual.visual-solid', null,
    svg('svg', { viewBox, role: 'img', 'aria-label': `A triangle with base ${base} centimetres and height ${hideHeight ? 'unknown' : `${height} centimetres`}`, style: `max-width:${Math.round(width * 1.3)}px` }, nodes));
};

/** Three angles (angle questions): drawn true to size, labelled inside each corner. */
const triangleByAngles = ({ angles, labels = [], rightAt, equal = false }) => {
  const [A, B, C] = angles;
  const side = 220 * (Math.sin(rad(B)) / Math.sin(rad(C))); // from the left corner to the top
  const P = [[0, 0], [220, 0], [side * Math.cos(rad(A)), -side * Math.sin(rad(A))]];
  // Keep a very flat or very tall triangle readable on a phone.
  const tall = Math.abs(P[2][1]);
  const k = tall > 170 ? 170 / tall : 1;
  const pts = P.map(([x, y]) => [x * k, y * k]);
  const nodes = [svg('polygon', { points: pts.map((p) => p.join(',')).join(' '), class: 'tri-fill' })];
  pts.forEach((p, i) => {
    const [q, r] = [pts[(i + 1) % 3], pts[(i + 2) % 3]];
    const u = (to) => { const dx = to[0] - p[0]; const dy = to[1] - p[1]; const len = Math.hypot(dx, dy); return [dx / len, dy / len]; };
    const [a, b] = [u(q), u(r)];
    if (rightAt === i) {
      const m = 14;
      nodes.push(svg('path', { d: `M${p[0] + a[0] * m} ${p[1] + a[1] * m} L${p[0] + (a[0] + b[0]) * m} ${p[1] + (a[1] + b[1]) * m} L${p[0] + b[0] * m} ${p[1] + b[1] * m}`, class: 'sol-corner' }));
    } else {
      const rr = 20;
      const sweep = (a[0] * b[1] - a[1] * b[0]) > 0 ? 1 : 0;
      nodes.push(svg('path', { d: `M${p[0] + a[0] * rr} ${p[1] + a[1] * rr} A${rr} ${rr} 0 0 ${sweep} ${p[0] + b[0] * rr} ${p[1] + b[1] * rr}`, class: 'tri-arc' }));
    }
    if (labels[i]) {
      // Inside the corner, along the line that splits the angle in half.
      const bis = [a[0] + b[0], a[1] + b[1]];
      const len = Math.hypot(...bis) || 1;
      // A narrow corner needs the label further in, so it does not sit on a side.
      const half = rad(angles[i] / 2);
      const dist = Math.min(90, Math.max(34, 15 / Math.sin(half)));
      const x = p[0] + (bis[0] / len) * dist;
      const y = p[1] + (bis[1] / len) * dist + 5;
      nodes.push(label(x, y, labels[i], labels[i] === '?' ? ' sol-unknown' : ''));
    }
  });
  if (equal) {
    // One tick on each of the two equal sides (left corner to top, right corner to top).
    for (const [p, q] of [[pts[0], pts[2]], [pts[1], pts[2]]]) {
      const mx = (p[0] + q[0]) / 2;
      const my = (p[1] + q[1]) / 2;
      const dx = q[0] - p[0];
      const dy = q[1] - p[1];
      const len = Math.hypot(dx, dy);
      const [nx, ny] = [(-dy / len) * 7, (dx / len) * 7];
      nodes.push(svg('line', { x1: mx - nx, y1: my - ny, x2: mx + nx, y2: my + ny, class: 'sol-tick' }));
    }
  }
  const { box: viewBox, width } = fitBox(pts, 18);
  const spoken = labels.filter(Boolean).join(', ');
  return h('div.visual.visual-solid', null,
    svg('svg', { viewBox, role: 'img', 'aria-label': `A triangle with angles ${spoken}`, style: `max-width:${Math.round(width * 1.25)}px` }, nodes));
};

const renderTriangle = (spec) => (spec.angles ? triangleByAngles(spec) : triangleByHeight(spec));

/* ------------------------------------------------------------------ */
/* Cuboid                                                              */
/* ------------------------------------------------------------------ */

/**
 * A box drawn at an angle: front face, top and right side. `cubes` draws the
 * 1 cm cubes on the three faces; `unknown: 'h'` labels the height "?".
 */
const renderCuboid = ({ l, w, h: ht, cubes = false, unknown }) => {
  const depth = 0.5; // the side going back is drawn at half length, at 30°
  const s = Math.min(200 / (l + w * depth * 0.87), 130 / (ht + w * depth * 0.5));
  const [L, H] = [l * s, ht * s];
  const [dx, dy] = [w * s * depth * 0.87, -w * s * depth * 0.5];
  const top = -dy;
  // Front face from (0, top) to (L, top + H).
  const f = { x: 0, y: top };
  const nodes = [
    svg('polygon', { points: `${f.x},${f.y} ${f.x + dx},${f.y + dy} ${f.x + L + dx},${f.y + dy} ${f.x + L},${f.y}`, class: 'sol-top' }),
    svg('polygon', { points: `${f.x + L},${f.y} ${f.x + L + dx},${f.y + dy} ${f.x + L + dx},${f.y + dy + H} ${f.x + L},${f.y + H}`, class: 'sol-side' }),
    svg('rect', { x: f.x, y: f.y, width: L, height: H, class: 'sol-face' }),
  ];
  if (cubes) {
    const grid = [];
    for (let i = 1; i < l; i += 1) {
      const x = f.x + i * s;
      grid.push(`M${x} ${f.y + H} V${f.y} l${dx} ${dy}`);
    }
    for (let j = 1; j < ht; j += 1) {
      const y = f.y + j * s;
      grid.push(`M${f.x} ${y} H${f.x + L} l${dx} ${dy}`);
    }
    for (let k = 1; k < w; k += 1) {
      const [ox, oy] = [(dx * k) / w, (dy * k) / w];
      grid.push(`M${f.x + ox} ${f.y + oy} H${f.x + L + ox} V${f.y + H + oy}`);
    }
    nodes.push(svg('path', { d: grid.join(' '), class: 'sol-grid' }));
  }
  nodes.push(label(f.x + L / 2, f.y + H + 20, `${l} cm`));
  nodes.push(label(f.x - 8, f.y + H / 2 + 5, unknown === 'h' ? '? cm' : `${ht} cm`, ' sol-end'));
  nodes.push(label(f.x + L + dx / 2 + 8, f.y + H + dy / 2 + 14, `${w} cm`, ' sol-start'));
  const { box: viewBox, width } = fitBox([[f.x - 52, 0], [f.x + L + dx + 52, f.y + H + 26]], 4);
  return h('div.visual.visual-solid', null,
    svg('svg', { viewBox, role: 'img', 'aria-label': `A box ${l} centimetres long, ${w} centimetres wide and ${unknown === 'h' ? 'unknown' : `${ht} centimetres`} high`, style: `max-width:${Math.round(width * 1.3)}px` }, nodes));
};

/* ------------------------------------------------------------------ */
/* Circle                                                              */
/* ------------------------------------------------------------------ */

/** A circle with its centre, and a radius, a diameter or both. */
const renderCircle = ({ show = 'radius', label: text = '' }) => {
  const [cx, cy, r] = [100, 90, 72];
  const nodes = [svg('circle', { cx, cy, r, class: 'circ-fill' }), svg('circle', { cx, cy, r: 3.5, class: 'circ-centre' })];
  if (show === 'radius' || show === 'both') {
    nodes.push(svg('line', { x1: cx, y1: cy, x2: cx + r, y2: cy, class: 'circ-radius' }));
    nodes.push(label(cx + r / 2, cy - 10, show === 'both' ? 'radius' : text));
  }
  if (show === 'diameter' || show === 'both') {
    const a = show === 'both' ? rad(-50) : 0;
    const [ux, uy] = [Math.cos(a) * r, Math.sin(a) * r];
    nodes.push(svg('line', { x1: cx - ux, y1: cy - uy, x2: cx + ux, y2: cy + uy, class: 'circ-diameter' }));
    nodes.push(label(show === 'both' ? cx - 30 : cx, show === 'both' ? cy + 52 : cy + 24, show === 'both' ? 'diameter' : text));
  }
  return h('div.visual.visual-solid.visual-circle', null,
    svg('svg', { viewBox: '0 0 200 180', role: 'img', 'aria-label': `A circle${text ? ` with ${show} ${text}` : ''}` }, nodes));
};

/* ------------------------------------------------------------------ */
/* Hundred square (percentages, hundredths)                            */
/* ------------------------------------------------------------------ */

/** A 10 by 10 square with the first `filled` small squares shaded: 25 shaded is 25% or 0.25. */
const renderHundredSquare = ({ filled = 0 }) => {
  const cells = [];
  for (let i = 0; i < 100; i += 1) {
    cells.push(svg('rect', { x: (i % 10) * 20, y: Math.floor(i / 10) * 20, width: 20, height: 20, class: i < filled ? 'hs-on' : 'hs-off' }));
  }
  return h('div.visual.visual-solid.visual-hundred', null,
    svg('svg', { viewBox: '-2 -2 204 204', role: 'img', 'aria-label': `${filled} out of 100 squares shaded` }, cells));
};

export const SOLID_RENDERERS = { triangle: renderTriangle, cuboid: renderCuboid, circle: renderCircle, hundredSquare: renderHundredSquare };
