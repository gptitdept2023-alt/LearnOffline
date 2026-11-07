/**
 * Renders the pictures that make lessons and questions concrete and
 * pictorial (the "C" and "P" in Concrete-Pictorial-Abstract).
 * Every visual is drawn from a small JSON spec, so packs stay tiny and
 * everything works offline with no image files.
 */

import { h, svg } from '../../core/dom.js';
import { longDivisionSteps } from '../../engine/longDivision.js';

/* ------------------------------------------------------------------ */
/* Pictures (Kinder)                                                   */
/* ------------------------------------------------------------------ */

/** A row of emoji pictures, grouped in fives so they are easy to count. */
const pictureGroup = (emoji, count, { crossed = 0 } = {}) => {
  const items = [];
  for (let i = 0; i < count; i += 1) {
    const isCrossed = i >= count - crossed;
    items.push(h(`span.pic${isCrossed ? '.pic-crossed' : ''}`, { 'aria-hidden': 'true', style: { '--i': i } }, emoji));
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
      cells.push(h(`span.${cls}`, { style: { '--i': n } }));
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

/**
 * A fraction as a shaded bar or circle.
 * Bars also support `extra` (parts added, in a second colour), `crossed`
 * (shaded parts taken away) and a `label` under the bar.
 */
const renderFraction = ({ numerator, denominator, shape = 'bar', extra = 0, crossed = 0, label }) => {
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
    const x = 10 + i * w;
    const cls = i < numerator ? 'frac-on' : i < numerator + extra ? 'frac-extra' : 'frac-off';
    parts.push(svg('rect', { x, y: 10, width: w, height: 40, class: cls, style: `--i:${i}` }));
    if (i < numerator && i >= numerator - crossed) {
      parts.push(svg('path', { d: `M${x + 4} 14 L${x + w - 4} 46 M${x + w - 4} 14 L${x + 4} 46`, class: 'frac-cross' }));
    }
  }
  const chart = svg('svg', { viewBox: '0 0 260 60', role: 'img', 'aria-label': `${numerator} out of ${denominator} parts shaded` }, parts);
  return h('div.visual.visual-fraction', null, label ? h('figure.frac-figure', null, chart, h('figcaption.frac-label', null, label)) : chart);
};

/* ------------------------------------------------------------------ */
/* Techniques: column method and skip-count jumps                      */
/* ------------------------------------------------------------------ */

/**
 * Column method layout. `shown` = how many places (from the ones) are done,
 * `focus` = the place being worked on, `top` = renamed top digits (ones first),
 * `carries` = carried 1s by place, `result` = the answer written so far.
 */
const renderColumn = ({ a, b, op, shown = 0, focus, top, carries = [], result }) => {
  const da = String(a).split('').reverse();
  const db = String(b).split('').reverse();
  const dr = result === undefined ? [] : String(result).split('').reverse();
  const cols = Math.max(da.length, db.length, dr.length) + 1; // +1 for the operator column
  const cell = (text, cls = '') => h(`span.col-cell${cls}`, null, text ?? '');
  const rowOf = (fn) => Array.from({ length: cols }, (_, k) => fn(cols - 1 - k)); // k: left to right, place = cols-1-k
  const focusCls = (place) => (place === focus ? '.col-focus' : '');

  const carryRow = rowOf((place) => {
    const renamed = top && top[place] !== undefined && String(top[place]) !== da[place];
    if (renamed) return cell(String(top[place]), `.col-small.col-renamed${focusCls(place)}`);
    return cell(carries[place] ? '1' : '', `.col-small${focusCls(place)}`);
  });
  const aRow = rowOf((place) => {
    const renamed = top && top[place] !== undefined && String(top[place]) !== da[place];
    return cell(da[place], `${renamed ? '.col-struck' : ''}${focusCls(place)}`);
  });
  const bRow = rowOf((place) => (place === cols - 1 ? cell(op, '.col-op') : cell(db[place], focusCls(place))));
  const rRow = rowOf((place) => cell(place < shown || place >= Math.max(da.length, db.length) ? dr[place] : '', `.col-result${focusCls(place)}`));

  return h('div.visual.visual-column', { role: 'img', 'aria-label': `${a} ${op} ${b} in columns` },
    h('div.col-grid', { style: { '--cols': cols } }, carryRow, aRow, bRow, h('span.col-line'), rRow));
};

/** Jumps along a number line: skip counting, counting on. */
const renderJumps = ({ from = 0, step = 1, count = 1, hideEnd = false }) => {
  const end = from + step * count;
  const x = (n) => 20 + ((n - from) / Math.max(1, end - from)) * 300;
  const nodes = [svg('line', { x1: 10, y1: 70, x2: 330, y2: 70, class: 'nl-axis' })];
  for (let i = 0; i <= count; i += 1) {
    const n = from + step * i;
    const label = hideEnd && i === count ? '?' : n;
    nodes.push(svg('line', { x1: x(n), y1: 64, x2: x(n), y2: 76, class: 'nl-tick' }));
    nodes.push(svg('text', { x: x(n), y: 96, class: `nl-label${i === count ? ' nl-mark' : ''}` }, label));
    if (i > 0) {
      const p = from + step * (i - 1);
      const mid = (x(p) + x(n)) / 2;
      nodes.push(svg('path', { d: `M${x(p)} 62 Q${mid} ${Math.max(14, 62 - (x(n) - x(p)) * 0.6)} ${x(n)} 62`, class: 'jump-arc', style: `--i:${i}` }));
      if (step > 1 && count <= 10) nodes.push(svg('text', { x: mid, y: Math.max(22, 50 - (x(n) - x(p)) * 0.3), class: 'jump-label' }, `+${step}`));
    }
  }
  return h('div.visual.visual-jumps', null,
    svg('svg', { viewBox: '0 0 340 106', role: 'img', 'aria-label': `${count} jumps of ${step} from ${from}` }, nodes));
};

/* ------------------------------------------------------------------ */
/* Place-value discs: chart, trading, sharing into groups              */
/* ------------------------------------------------------------------ */

const PLACE_NAMES = { 1: ['one', 'ones'], 10: ['ten', 'tens'], 100: ['hundred', 'hundreds'], 1000: ['thousand', 'thousands'], 10000: ['ten thousand', 'ten thousands'], 100000: ['hundred thousand', 'hundred thousands'] };

/** "3 hundreds", "1 ten". */
const placeCount = (n, place) => `${n.toLocaleString('en-US')} ${(PLACE_NAMES[place] || ['', ''])[n === 1 ? 0 : 1]}`;

/** One place-value disc ("100", "10", "1"). `i` staggers the pop-in animation. */
const disc = (place, i = 0) => h(`span.disc.disc-${place}`, { style: { '--i': i }, 'aria-hidden': 'true' }, place);

/** `count` discs; big piles are bundled in tens so they stay easy to count. */
const discPile = (place, count) => {
  if (count <= 10) return h('span.disc-pile', null, Array.from({ length: count }, (_, i) => disc(place, i)));
  const bundles = [];
  for (let start = 0; start < count; start += 10) {
    bundles.push(h('span.disc-bundle', null,
      Array.from({ length: Math.min(10, count - start) }, (_, i) => disc(place, start + i))));
  }
  return h('span.disc-pile.disc-pile-big', null, bundles);
};

/** Places used by a number, biggest first: 305 -> [100, 10, 1]. */
const placesOf = (value) => {
  const count = String(Math.max(0, value)).length;
  return Array.from({ length: count }, (_, k) => 10 ** (count - 1 - k));
};

/**
 * Place-value chart with discs. One row per number.
 * @param {{rows: {value: number, label?: string}[]}} spec
 */
const renderPlaceChart = ({ rows }) => {
  const places = placesOf(Math.max(...rows.map((r) => r.value)));
  const labelled = rows.some((r) => r.label);
  const header = [labelled && h('span.pv-head'), places.map((p) => h(`span.pv-head.pv-head-${p}`, null, PLACE_NAMES[p]?.[1] || p))];
  const body = rows.map((r) => {
    const ds = String(r.value).padStart(places.length, ' ').split('');
    return [
      labelled && h('span.pv-label', null, r.label || ''),
      places.map((p, k) => {
        const n = Number(ds[k]) || 0;
        return h('span.pv-cell', null, h('span.pv-discs', null, Array.from({ length: n }, (_, i) => disc(p, i))), h('b.pv-digit', null, n));
      }),
    ];
  });
  return h('div.visual.visual-place-chart', { role: 'img', 'aria-label': rows.map((r) => r.value).join(' and ') + ' in a place-value chart' },
    h(`div.pv-grid${labelled ? '.pv-labelled' : ''}`, { style: { '--cols': places.length } }, header, body));
};

/**
 * Multiplying by 10 as a place-value shift: every digit moves one place to
 * the left and a 0 fills the ones. Digits only (no discs), so it stays
 * readable for big numbers such as 2,980 -> 29,800.
 * @param {{value: number, hideResult?: boolean}} spec The number before multiplying by 10.
 *   hideResult shows "?" in the answer row (used when the child is asked for it).
 */
const renderShift = ({ value, hideResult = false }) => {
  const result = value * 10;
  const places = placesOf(result);
  const row = (n, label, isResult) => {
    const ds = String(n).padStart(places.length, ' ').split('');
    return [
      h('span.pv-label', null, label),
      places.map((p, k) => h(`span.pv-cell.shift-cell${isResult && p === 1 && !hideResult ? '.shift-new' : ''}`, null,
        h('b.pv-digit', null, isResult && hideResult ? '?' : ds[k].trim()))),
    ];
  };
  const caption = '× 10: each digit moves one place to the left, and a 0 goes in the ones place.';
  const label = hideResult ? `${value} times 10` : `${value} times 10 is ${result}`;
  return h('div.visual.visual-place-chart.visual-shift', { role: 'img', 'aria-label': label },
    h('div.pv-grid.pv-labelled', { style: { '--cols': places.length } },
      h('span.pv-head'), places.map((p) => h(`span.pv-head.pv-head-${p}`, null, PLACE_NAMES[p]?.[1] || p)),
      row(value, ''), row(result, '×10', true)),
    h('p.visual-caption', null, caption));
};

/**
 * Trading (renaming): change `count` discs of `from` into discs of `into`.
 * 3 hundreds -> 30 tens (sharing, borrowing) or 10 ones -> 1 ten (carrying).
 * @param {{from: number, count: number, into?: number}} spec
 */
const renderTrade = ({ from, count, into = from / 10 }) => {
  const result = (count * from) / into;
  const caption = `${placeCount(count, from)} = ${placeCount(result, into)}`;
  return h('div.visual.visual-trade', { role: 'img', 'aria-label': caption },
    h('div.trade-row', null, discPile(from, count), h('span.trade-arrow', { 'aria-hidden': 'true' }, '→'), discPile(into, result)),
    h('p.visual-caption', null, caption));
};

/**
 * Equal groups of place-value discs (sharing for division, groups for multiplication).
 * The place being worked on (`focus`) shows every disc; earlier places are
 * shown as "6 × (10)" chips so the picture stays readable.
 * @param {{groups: number, each: {place: number, n: number}[], focus?: number,
 *          left?: {place: number, count: number, into?: number}}} spec
 */
const renderShare = ({ groups, each, focus, left }) => {
  const groupEl = (g) => h('div.share-group', { style: { '--i': g } },
    h('span.share-num', { 'aria-hidden': 'true' }, g + 1),
    each.filter((e) => e.n > 0 || e.place === focus).map((e) => (e.place === focus
      ? h('span.share-place', null, e.n ? Array.from({ length: e.n }, (_, i) => disc(e.place, g * 2 + i)) : h('span.share-zero', null, '0'))
      : h('span.disc-chip', null, disc(e.place), `× ${e.n}`))));
  const total = each.reduce((s, e) => s + e.place * e.n, 0);
  return h('div.visual.visual-share', { role: 'img', 'aria-label': `${groups} groups of ${total}` },
    h('div.share-groups', null, Array.from({ length: groups }, (_, g) => groupEl(g))),
    left && left.count > 0 && h('div.share-left', null,
      h('span.share-left-title', null, 'Left over'),
      discPile(left.place, left.count),
      left.into && h('span.share-left-note', null, `→ ${placeCount((left.count * left.place) / left.into, left.into)}`)));
};

/* ------------------------------------------------------------------ */
/* Long division layout, built step by step                            */
/* ------------------------------------------------------------------ */

/**
 * The written long-division layout (divisor, bracket, quotient on top,
 * subtract and bring down), drawn up to step `upto` (exclusive). The step
 * being worked on (`focus`) and the number it shares are highlighted.
 * @param {{dividend: number, divisor: number, upto?: number, focus?: number}} spec
 */
const renderLongDivision = ({ dividend, divisor, upto, focus }) => {
  const steps = longDivisionSteps(dividend, divisor);
  const digitsText = String(dividend);
  const shown = upto ?? steps.length;
  const cols = steps.length + 1; // column 0 holds the divisor and minus signs
  const firstWork = steps.findIndex((s) => !s.lead);
  const cells = [];

  /** Emit one grid row from a Map(col -> {text, cls}). */
  const row = (map) => {
    for (let c = 0; c < cols; c += 1) {
      const x = map.get(c);
      cells.push(h(`span.ld-cell${x?.cls || ''}`, null, x?.text ?? ''));
    }
  };
  /** Digits of `num`, right-aligned so the last digit sits in column `end`. */
  const digitsAt = (num, end, cls = '') => {
    const map = new Map();
    String(num).split('').reverse().forEach((d, k) => map.set(end - k, { text: d, cls }));
    return map;
  };
  const hot = (k) => (k === focus ? '.ld-hot' : '');

  // Quotient on top.
  const top = new Map();
  steps.forEach((s, k) => { if (k < shown && !s.lead) top.set(s.i + 1, { text: String(s.q), cls: `.ld-quotient${hot(k)}` }); });
  row(top);

  // Divisor and dividend under the bracket. Highlight the digits being shared
  // while the work still happens in this row (the first sharing step).
  const inDividend = focus !== undefined && focus <= firstWork;
  const dividendRow = new Map([[0, { text: String(divisor), cls: '.ld-divisor' }]]);
  digitsText.split('').forEach((d, k) => dividendRow.set(k + 1, {
    text: d,
    cls: `.ld-dividend${k === 0 ? '.ld-first' : ''}${inDividend && k <= steps[focus].i ? '.ld-hot' : ''}`,
  }));
  row(dividendRow);

  // Subtract, then the remainder with the next digit brought down.
  steps.forEach((s, k) => {
    if (s.lead || k >= shown) return;
    const end = s.i + 1;
    const used = digitsAt(s.product, end, hot(k));
    used.set(end - String(s.product).length, { text: '−', cls: `.ld-minus${hot(k)}` });
    row(used);

    const nextShown = s.i < steps.length - 1 && (k + 1 < shown || k + 1 === focus);
    const nextHot = hot(k + 1);
    const rest = s.rem > 0 || !nextShown ? digitsAt(s.rem, end, nextHot) : new Map();
    if (nextShown) rest.set(end + 1, { text: digitsText[s.i + 1], cls: `.ld-down${nextHot}` });
    for (let c = end - String(s.cur).length + 1; c <= end; c += 1) {
      const x = rest.get(c) || { text: '', cls: '' };
      rest.set(c, { ...x, cls: `${x.cls}.ld-rule` });
    }
    row(rest);
  });

  return h('div.visual.visual-long-division', { role: 'img', 'aria-label': `${dividend} divided by ${divisor}, written as long division` },
    h('div.ld-grid', { style: { '--cols': cols } }, cells));
};

/* ------------------------------------------------------------------ */
/* Area model for multiplication                                       */
/* ------------------------------------------------------------------ */

/**
 * Rectangle split by place value: column headers × row headers.
 * Cells are filled in reading order up to `filled`; `focus` is highlighted.
 * @param {{cols: number[], rows: number[], filled?: number, focus?: number}} spec
 */
const renderArea = ({ cols, rows, filled = 0, focus }) => {
  const f = (n) => n.toLocaleString('en-US');
  const cells = [h('span.area-corner', null, '×'), cols.map((c) => h('span.area-head', null, f(c)))];
  rows.forEach((r, ri) => {
    cells.push(h('span.area-head.area-row-head', null, f(r)));
    cols.forEach((c, ci) => {
      const k = ri * cols.length + ci;
      cells.push(h(`span.area-cell${k === focus ? '.area-hot' : ''}${k < filled ? '.area-done' : ''}`, null, k < filled ? f(c * r) : ''));
    });
  });
  return h('div.visual.visual-area', { role: 'img', 'aria-label': `Area model: ${cols.map(f).join(' + ')} times ${rows.map(f).join(' + ')}` },
    h('div.area-grid', { style: { '--cols': cols.length } }, cells));
};

/* ------------------------------------------------------------------ */
/* Several pictures side by side (or stacked)                          */
/* ------------------------------------------------------------------ */

/** @param {{items: Object[], column?: boolean}} spec */
const renderStack = ({ items, column = false }) =>
  h(`div.visual-stack${column ? '.visual-stack-column' : ''}`, null, items.map((item) => renderVisual(item)));

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
      nodes.push(svg('rect', { x: x0, y, width: Math.max(2, x1 - x0), height: rowH, style: `--i:${i * 3 + j}`, class: `bm-seg${g.text === '?' || g.text?.endsWith(': ?') ? ' bm-unknown' : ''}` }));
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
  column: renderColumn,
  jumps: renderJumps,
  placeChart: renderPlaceChart,
  shift: renderShift,
  trade: renderTrade,
  share: renderShare,
  longDivision: renderLongDivision,
  area: renderArea,
  stack: renderStack,
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
