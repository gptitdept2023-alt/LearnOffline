/**
 * Renders the pictures that make lessons and questions concrete and
 * pictorial (the "C" and "P" in Concrete-Pictorial-Abstract).
 * Every visual is drawn from a small JSON spec, so packs stay tiny and
 * everything works offline with no image files.
 */

import { h, svg } from '../../core/dom.js';

/* ------------------------------------------------------------------ */
/* Pictures (Kinder)                                                   */
/* ------------------------------------------------------------------ */

/** A row of emoji pictures, grouped in fives so they are easy to count. */
const pictureGroup = (emoji, count, { crossed = 0 } = {}) => {
  const items = [];
  for (let i = 0; i < count; i += 1) {
    const isCrossed = i >= count - crossed;
    items.push(h(`span.pic${isCrossed ? '.pic-crossed' : ''}`, { 'aria-hidden': 'true' }, emoji));
    if ((i + 1) % 5 === 0 && i + 1 < count) items.push(h('span.pic-gap'));
  }
  return h('div.pic-group', null, items);
};

const renderPictures = ({ emoji, count }) =>
  h('div.visual.visual-pictures', { role: 'img', 'aria-label': `${count} pictures` }, pictureGroup(emoji, count));

const renderPictureRows = ({ rows }) =>
  h('div.visual.visual-picture-rows', { role: 'img', 'aria-label': 'Two rows of pictures' },
    rows.map((r) => h('div.pic-row', null, pictureGroup(r.emoji, r.count))));

const renderPictureAdd = ({ emoji, a, b }) =>
  h('div.visual.visual-picture-op', { role: 'img', 'aria-label': `${a} and ${b}` },
    pictureGroup(emoji, a), h('span.op-sign', null, '+'), pictureGroup(emoji, b));

const renderPictureTakeAway = ({ emoji, a, b }) =>
  h('div.visual.visual-pictures', { role: 'img', 'aria-label': `${a} take away ${b}` }, pictureGroup(emoji, a, { crossed: b }));

const renderSequence = ({ items }) =>
  h('div.visual.visual-sequence', { role: 'img', 'aria-label': 'A pattern' },
    items.map((it) => h(`span.seq-item${it === '?' ? '.seq-unknown' : ''}`, null, it)));

/* ------------------------------------------------------------------ */
/* Shapes                                                              */
/* ------------------------------------------------------------------ */

const SHAPE_PATHS = {
  circle: () => svg('circle', { cx: 50, cy: 50, r: 40 }),
  square: () => svg('rect', { x: 14, y: 14, width: 72, height: 72, rx: 2 }),
  rectangle: () => svg('rect', { x: 6, y: 26, width: 88, height: 48, rx: 2 }),
  triangle: () => svg('polygon', { points: '50,10 90,86 10,86' }),
  star: () => svg('polygon', { points: '50,6 61,38 95,38 67,58 78,92 50,72 22,92 33,58 5,38 39,38' }),
  heart: () => svg('path', { d: 'M50 88 C20 66 6 50 6 32 C6 18 17 8 30 8 C40 8 46 14 50 22 C54 14 60 8 70 8 C83 8 94 18 94 32 C94 50 80 66 50 88 Z' }),
};

/** One shape as an SVG. Also used for picture choices. */
export const shapeSvg = (shape) => {
  const draw = SHAPE_PATHS[shape];
  return svg('svg', { viewBox: '0 0 100 100', class: `shape shape-${shape}`, role: 'img', 'aria-label': shape },
    draw ? draw() : svg('text', { x: 50, y: 55 }, shape));
};

const renderShape = ({ shape }) => h('div.visual.visual-shape', null, shapeSvg(shape));

/* ------------------------------------------------------------------ */
/* Numbers                                                             */
/* ------------------------------------------------------------------ */

/** Ten frames: 2 rows of 5. `extra` counters are shown in a second colour. */
const renderTenFrames = ({ value, extra = 0 }) => {
  const total = value + extra;
  const frames = Math.max(1, Math.ceil(total / 10));
  const nodes = [];
  for (let f = 0; f < frames; f += 1) {
    const cells = [];
    for (let c = 0; c < 10; c += 1) {
      const n = f * 10 + c;
      const cls = n < value ? 'cell.filled' : n < total ? 'cell.filled-extra' : 'cell';
      cells.push(h(`span.${cls}`));
    }
    nodes.push(h('div.ten-frame', null, cells));
  }
  return h('div.visual.visual-ten-frames', { role: 'img', 'aria-label': extra ? `${value} and ${extra} counters` : `${value} counters` }, nodes);
};

/** Number bond: whole on top, two parts below. */
const renderBond = ({ whole, parts }) => {
  const circle = (cx, cy, text, cls) => [
    svg('circle', { cx, cy, r: 26, class: `bond-circle ${cls}` }),
    svg('text', { x: cx, y: cy + 8, class: 'bond-text' }, text),
  ];
  return h('div.visual.visual-bond', null,
    svg('svg', { viewBox: '0 0 200 150', role: 'img', 'aria-label': `${whole} is made of ${parts.join(' and ')}` },
      svg('line', { x1: 100, y1: 40, x2: 50, y2: 110, class: 'bond-line' }),
      svg('line', { x1: 100, y1: 40, x2: 150, y2: 110, class: 'bond-line' }),
      circle(100, 34, whole, 'bond-whole'),
      circle(50, 114, parts[0], parts[0] === '?' ? 'bond-unknown' : ''),
      circle(150, 114, parts[1], parts[1] === '?' ? 'bond-unknown' : ''),
    ));
};

/** Base-ten blocks for numbers up to 999: flats (100), rods (10), cubes (1). */
const renderBlocks = ({ value }) => {
  const hundreds = Math.floor(value / 100);
  const tens = Math.floor((value % 100) / 10);
  const ones = value % 10;
  const repeat = (n, cls) => Array.from({ length: n }, () => h(`span.${cls}`));
  return h('div.visual.visual-blocks', { role: 'img', 'aria-label': `${hundreds} hundreds, ${tens} tens, ${ones} ones` },
    h('div.block-col', null, h('div.block-set', null, repeat(hundreds, 'block-flat')), h('small', null, `${hundreds} hundreds`)),
    h('div.block-col', null, h('div.block-set', null, repeat(tens, 'block-rod')), h('small', null, `${tens} tens`)),
    h('div.block-col', null, h('div.block-set', null, repeat(ones, 'block-cube')), h('small', null, `${ones} ones`)),
  );
};

/** Equal groups for multiplication and division. */
const renderGroups = ({ groups, each }) =>
  h('div.visual.visual-groups', { role: 'img', 'aria-label': `${groups} groups of ${each}` },
    Array.from({ length: groups }, () => h('div.group', null, Array.from({ length: each }, () => h('span.dot')))));

/** A short number line with one marked number. */
const renderNumberLine = ({ from, to, mark }) => {
  const span = Math.max(1, to - from);
  const x = (n) => 20 + ((n - from) / span) * 260;
  const ticks = [];
  for (let n = from; n <= to; n += 1) {
    ticks.push(svg('line', { x1: x(n), y1: 30, x2: x(n), y2: 42, class: 'nl-tick' }));
    ticks.push(svg('text', { x: x(n), y: 62, class: `nl-label${n === mark ? ' nl-mark' : ''}` }, n));
  }
  return h('div.visual.visual-number-line', null,
    svg('svg', { viewBox: '0 0 300 72', role: 'img', 'aria-label': `Number line from ${from} to ${to}` },
      svg('line', { x1: 10, y1: 36, x2: 290, y2: 36, class: 'nl-axis' }),
      ticks,
      svg('circle', { cx: x(mark), cy: 36, r: 7, class: 'nl-dot' })));
};

/** A fraction as a shaded bar or circle. */
const renderFraction = ({ numerator, denominator, shape = 'bar' }) => {
  const parts = [];
  if (shape === 'circle') {
    if (denominator === 1) {
      parts.push(svg('circle', { cx: 50, cy: 50, r: 44, class: numerator ? 'frac-on' : 'frac-off' }));
    }
    for (let i = 0; denominator > 1 && i < denominator; i += 1) {
      const a0 = (i / denominator) * 2 * Math.PI - Math.PI / 2;
      const a1 = ((i + 1) / denominator) * 2 * Math.PI - Math.PI / 2;
      const large = a1 - a0 > Math.PI ? 1 : 0;
      const p = (a) => `${50 + 44 * Math.cos(a)} ${50 + 44 * Math.sin(a)}`;
      parts.push(svg('path', { d: `M50 50 L${p(a0)} A44 44 0 ${large} 1 ${p(a1)} Z`, class: i < numerator ? 'frac-on' : 'frac-off' }));
    }
    return h('div.visual.visual-fraction', null, svg('svg', { viewBox: '0 0 100 100', role: 'img', 'aria-label': `${numerator} out of ${denominator} parts shaded` }, parts));
  }
  const w = 240 / denominator;
  for (let i = 0; i < denominator; i += 1) {
    parts.push(svg('rect', { x: 10 + i * w, y: 10, width: w, height: 40, class: i < numerator ? 'frac-on' : 'frac-off' }));
  }
  return h('div.visual.visual-fraction', null, svg('svg', { viewBox: '0 0 260 60', role: 'img', 'aria-label': `${numerator} out of ${denominator} parts shaded` }, parts));
};

/* ------------------------------------------------------------------ */
/* Bar models                                                          */
/* ------------------------------------------------------------------ */

/**
 * Draw a bar model.
 * @param {{rows: {label: string, segments: {units: number, text: string}[]}[],
 *          braces?: {row?: number, rows?: number[], from?: number, to?: number, side: 'above'|'below'|'right', text: string}[]}} model
 */
export const renderBarModel = (model) => {
  const labelW = model.rows.some((r) => r.label) ? 70 : 10;
  const barMaxW = 220; // Narrow viewBox = larger text when scaled to a phone screen.
  const rowH = 34;
  const rowGap = 46;
  const top = 52; // Room above the first row for a brace and its label.
  const maxUnits = Math.max(...model.rows.map((r) => r.segments.reduce((s, g) => s + g.units, 0)));
  const scale = barMaxW / Math.max(1, maxUnits);
  const rowY = (i) => top + i * (rowH + rowGap);

  // Segment x positions per row, for braces.
  const edges = model.rows.map((r) => {
    const xs = [labelW];
    r.segments.forEach((g) => xs.push(xs[xs.length - 1] + g.units * scale));
    return xs;
  });

  const nodes = [];
  model.rows.forEach((r, i) => {
    const y = rowY(i);
    if (r.label) nodes.push(svg('text', { x: labelW - 10, y: y + rowH / 2 + 5, class: 'bm-label' }, r.label));
    r.segments.forEach((g, j) => {
      const x0 = edges[i][j];
      const x1 = edges[i][j + 1];
      nodes.push(svg('rect', { x: x0, y, width: Math.max(2, x1 - x0), height: rowH, class: `bm-seg${g.text === '?' || g.text?.endsWith(': ?') ? ' bm-unknown' : ''}` }));
      if (g.text) {
        // Text too wide for a short segment goes under the bar instead of overflowing it.
        const fits = g.text.length * 8.5 <= x1 - x0;
        nodes.push(fits
          ? svg('text', { x: (x0 + x1) / 2, y: y + rowH / 2 + 5, class: 'bm-seg-text' }, g.text)
          : svg('text', { x: x0, y: y + rowH + 20, class: 'bm-seg-text bm-left' }, g.text));
      }
    });
  });

  let rightmost = labelW + barMaxW;
  for (const b of model.braces || []) {
    if (b.side === 'right') {
      const [r0, r1] = b.rows;
      const x = Math.max(...b.rows.map((ri) => edges[ri][edges[ri].length - 1])) + 10;
      const y0 = rowY(r0);
      const y1 = rowY(r1) + rowH;
      nodes.push(svg('path', { d: `M${x} ${y0} q8 0 8 8 V${(y0 + y1) / 2 - 6} l6 6 l-6 6 V${y1 - 8} q0 8 -8 8`, class: 'bm-brace' }));
      nodes.push(svg('text', { x: x + 22, y: (y0 + y1) / 2 + 5, class: 'bm-brace-text bm-left' }, b.text));
      rightmost = Math.max(rightmost, x + 60);
    } else {
      const xs = edges[b.row];
      const x0 = xs[b.from];
      const x1 = xs[Math.min(b.to, xs.length - 1)];
      const above = b.side === 'above';
      const y = above ? rowY(b.row) - 6 : rowY(b.row) + rowH + 6;
      const d = above ? -1 : 1;
      const mid = (x0 + x1) / 2;
      nodes.push(svg('path', { d: `M${x0} ${y} q0 ${8 * d} 8 ${8 * d} H${mid - 6} l6 ${6 * d} l6 ${-6 * d} H${x1 - 8} q8 0 8 ${-8 * d}`, class: 'bm-brace' }));
      nodes.push(svg('text', { x: mid, y: above ? y - 18 : y + 30, class: 'bm-brace-text' }, b.text));
    }
  }

  const height = rowY(model.rows.length - 1) + rowH + 44;
  return h('div.visual.visual-bar-model', null,
    svg('svg', { viewBox: `0 0 ${rightmost + 10} ${height}`, role: 'img', 'aria-label': 'Bar model' }, nodes));
};

/* ------------------------------------------------------------------ */
/* Dispatcher                                                          */
/* ------------------------------------------------------------------ */

const RENDERERS = {
  pictures: renderPictures,
  pictureRows: renderPictureRows,
  pictureAdd: renderPictureAdd,
  pictureTakeAway: renderPictureTakeAway,
  sequence: renderSequence,
  shape: renderShape,
  tenFrames: renderTenFrames,
  bond: renderBond,
  blocks: renderBlocks,
  groups: renderGroups,
  numberLine: renderNumberLine,
  fraction: renderFraction,
  bar: renderBarModel,
};

/**
 * Render any visual spec. Unknown kinds render nothing rather than crashing,
 * so an older app version can still open a newer pack.
 * @returns {HTMLElement|null}
 */
export const renderVisual = (spec) => {
  if (!spec) return null;
  const render = RENDERERS[spec.kind];
  if (!render) {
    console.warn(`Unknown visual kind "${spec.kind}"`);
    return null;
  }
  return render(spec);
};
