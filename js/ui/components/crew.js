/**
 * Draws the robot crew characters (see engine/crew.js) in SVG: three body
 * designs, each with a girl version, plus shared upgrades (finishes, hard-light
 * hair, back gear, gear, decals, auras), 12 LED-screen expressions and emotes.
 *
 * Markup is built as a string and parsed once per drawing, which is far
 * faster than creating hundreds of nodes one by one. Every value that reaches
 * the markup comes from the fixed catalogue (colours, style names) or from
 * numbers computed here; learner-typed text (the robot's name) is never drawn.
 *
 * Animation lives in css/engage.css: idle motion on .crew-idle, blinking on
 * .crew-blink, emotes on .crew-fig.emote-<name>, arms on .crew-arm-l/-r.
 */

import { svg } from '../../core/dom.js';

const W = 220;
const OUT = 'rgba(4,8,18,.72)';
const SCREEN = '#05080f';
const METAL = '#c9d1dc';

let drawings = 0;

/* ------------------------------------------------------------------ */
/* Colour helpers                                                      */
/* ------------------------------------------------------------------ */

/** Lighten (amt > 0) or darken (amt < 0) a #rrggbb colour. */
export const shade = (hex, amt) => {
  const n = /^#([0-9a-f]{6})$/i.exec(String(hex));
  if (!n) return hex;
  const v = parseInt(n[1], 16);
  const ch = (shift) => {
    const c = (v >> shift) & 255;
    const out = amt >= 0 ? c + (255 - c) * amt : c * (1 + amt);
    return Math.round(Math.max(0, Math.min(255, out))).toString(16).padStart(2, '0');
  };
  return `#${ch(16)}${ch(8)}${ch(0)}`;
};

const RAINBOW = ['#ff5d5d', '#ffb703', '#3cc9a0', '#4f9dff', '#9a6cf0'];
const PLASMA = ['#ff3df2', '#9a6cff', '#38e1ff'];

const gradient = (id, stops, vertical = false) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="${vertical ? 0 : 1}" y2="1">${stops.map((c, i) => `<stop offset="${Math.round((i / (stops.length - 1)) * 100)}%" stop-color="${c}"/>`).join('')}</linearGradient>`;

/**
 * Paints for one drawing: the main colour with its finish, the glow (a colour
 * or a gradient), and the defs they need.
 */
const paints = (c) => {
  drawings += 1;
  const p = `cr${drawings}`;
  const { main, dark, trim } = c.palette;
  const defs = [];
  let fill = main;
  switch (c.finish) {
    case 'metal':
      defs.push(gradient(`${p}m`, [shade(main, 0.4), main, shade(main, -0.25), shade(main, 0.15)]));
      fill = `url(#${p}m)`;
      break;
    case 'carbon':
      defs.push(`<pattern id="${p}m" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="${main}"/><rect width="3" height="6" fill="${shade(main, -0.22)}"/></pattern>`);
      fill = `url(#${p}m)`;
      break;
    case 'camo':
      defs.push(`<pattern id="${p}m" width="40" height="40" patternUnits="userSpaceOnUse"><rect width="40" height="40" fill="${main}"/><path d="M2 6 Q12 0 18 8 Q14 16 4 14 Z M22 22 Q34 16 38 26 Q30 34 22 30 Z" fill="${shade(main, -0.28)}"/><path d="M24 2 Q32 4 30 12 Q22 12 24 2 Z M4 26 Q14 24 12 36 Q4 36 4 26 Z" fill="${shade(main, 0.2)}"/></pattern>`);
      fill = `url(#${p}m)`;
      break;
    case 'holo':
      defs.push(gradient(`${p}m`, [main, '#ffd1f1', '#bdf6ff', '#e8ffd0', main]));
      fill = `url(#${p}m)`;
      break;
    default:
      break;
  }
  let glow = c.glow;
  if (c.glow === 'rainbow' || c.glow === 'plasma') {
    defs.push(gradient(`${p}g`, c.glow === 'rainbow' ? RAINBOW : PLASMA));
    glow = `url(#${p}g)`;
  }
  // A plain colour for places that cannot take a gradient well (soft halos).
  const glowSolid = c.glow === 'rainbow' ? '#9a6cf0' : c.glow === 'plasma' ? '#ff3df2' : c.glow;
  return { p, defs, fill, dark, trim, glow, glowSolid, main };
};

/* ------------------------------------------------------------------ */
/* Faces                                                               */
/* ------------------------------------------------------------------ */

const starPts = (x, y, r) => {
  const pts = [];
  for (let i = 0; i < 10; i += 1) {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const rr = i % 2 ? r * 0.45 : r;
    pts.push(`${(x + rr * Math.cos(a)).toFixed(1)},${(y + rr * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(' ');
};

const heartPath = (x, y, s) => `M${x} ${y + 6 * s} C${x - 10 * s} ${y - 1 * s} ${x - 5 * s} ${y - 9 * s} ${x} ${y - 3 * s} C${x + 5 * s} ${y - 9 * s} ${x + 10 * s} ${y - 1 * s} ${x} ${y + 6 * s} Z`;

const line = (d, g, w) => `<path d="${d}" fill="none" stroke="${g}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;

/** One eye in its resting shape for a style. h squashes it (focused). */
const eyeShape = (style, x, y, side, g, s, h = 1) => {
  switch (style) {
    case 'slit': {
      const t = side * 2 * s;
      return `<polygon points="${x - 9 * s},${y - 3 * s * h - t} ${x + 9 * s},${y - 3 * s * h + t} ${x + 8 * s},${y + 3 * s * h + t} ${x - 8 * s},${y + 3 * s * h - t}" fill="${g}"/>`;
    }
    case 'pixel': {
      const px = 3.4 * s;
      const rows = h < 1 ? [[1, 1, 1]] : [[0, 1, 0], [1, 1, 1], [1, 1, 1]];
      let out = '';
      rows.forEach((row, r) => row.forEach((on, c2) => {
        if (on) out += `<rect x="${(x + (c2 - 1.5) * px).toFixed(1)}" y="${(y + (r - rows.length / 2) * px).toFixed(1)}" width="${(px - 0.6).toFixed(1)}" height="${(px - 0.6).toFixed(1)}" fill="${g}"/>`;
      }));
      return out;
    }
    case 'heart':
      return `<path d="${heartPath(x, y, s * 0.9)}" fill="${g}"/>`;
    case 'star':
      return `<polygon points="${starPts(x, y, 8 * s)}" fill="${g}"/>`;
    default: // round
      return `<rect x="${x - 7 * s}" y="${y - 9 * s * h}" width="${14 * s}" height="${18 * s * h}" rx="${7 * s * h}" fill="${g}"/><rect x="${x - 3.5 * s}" y="${y - 6 * s * h}" width="${3.5 * s}" height="${4.5 * s * h}" rx="${1.7 * s}" fill="#fff" opacity=".8"/>`;
  }
};

/** Lashes on the outer top corner (girl versions). */
const lashes = (x, y, side, g, s) => line(`M${x + side * 6 * s} ${y - 6 * s} L${x + side * 10 * s} ${y - 10 * s} M${x + side * 8.5 * s} ${y - 2.5 * s} L${x + side * 12.5 * s} ${y - 5 * s}`, g, 1.6 * s);

const NO_LASH = new Set(['cool', 'love', 'starry', 'dizzy']);

/** Both eyes for an expression. xs = [left x, right x]. */
const eyes = (style, expr, xs, y, g, s, girl) => {
  if (expr === 'cool') {
    const x0 = xs[0] - 12 * s;
    const x1 = xs[1] + 12 * s;
    return `<rect x="${x0}" y="${y - 6 * s}" width="${x1 - x0}" height="${12 * s}" rx="${4 * s}" fill="#0a0d16" stroke="${g}" stroke-width="${1.6 * s}"/>${line(`M${x0 + 5 * s} ${y - 2 * s} L${x0 + 12 * s} ${y - 2 * s}`, '#fff', 1.6 * s)}`;
  }
  return xs.map((x, i) => {
    const side = i === 0 ? -1 : 1;
    let out;
    switch (expr) {
      case 'happy':
      case 'laugh':
        out = line(`M${x - 7 * s} ${y + 3 * s} Q${x} ${y - 7 * s} ${x + 7 * s} ${y + 3 * s}`, g, 3.2 * s);
        break;
      case 'wink':
        out = i === 1 ? line(`M${x - 7 * s} ${y + 3 * s} Q${x} ${y - 7 * s} ${x + 7 * s} ${y + 3 * s}`, g, 3.2 * s) : eyeShape(style, x, y, side, g, s);
        break;
      case 'sleepy':
        out = line(`M${x - 7 * s} ${y} Q${x} ${y + 4 * s} ${x + 7 * s} ${y}`, g, 3 * s);
        break;
      case 'surprised':
        out = `<circle cx="${x}" cy="${y}" r="${7.5 * s}" fill="none" stroke="${g}" stroke-width="${3 * s}"/><circle cx="${x}" cy="${y}" r="${2.6 * s}" fill="${g}"/>`;
        break;
      case 'love':
        out = `<path d="${heartPath(x, y, s)}" fill="${g}"/>`;
        break;
      case 'starry':
        out = `<polygon points="${starPts(x, y, 9 * s)}" fill="${g}"/>`;
        break;
      case 'dizzy':
        out = `<circle cx="${x}" cy="${y}" r="${7 * s}" fill="none" stroke="${g}" stroke-width="${2 * s}"/><circle cx="${x + 1.5 * s}" cy="${y - 1 * s}" r="${3.6 * s}" fill="none" stroke="${g}" stroke-width="${2 * s}"/><circle cx="${x + 2.5 * s}" cy="${y - 1.5 * s}" r="${1 * s}" fill="${g}"/>`;
        break;
      case 'focused':
        out = line(`M${x - 8 * s} ${y - 9 * s - side * 2 * s} L${x + 8 * s} ${y - 9 * s + side * 2 * s}`, g, 2.4 * s) + eyeShape(style, x, y, side, g, s, 0.55);
        break;
      case 'sad':
        out = line(`M${x - 8 * s} ${y - 9 * s + side * 2 * s} L${x + 8 * s} ${y - 9 * s - side * 2 * s}`, g, 2.4 * s)
          + eyeShape(style, x, y + 1.5 * s, side, g, s, 0.8)
          + (i === 0 ? `<path d="M${x - 4 * s} ${y + 7 * s} q${-2 * s} ${4 * s} 0 ${6 * s} q${2 * s} ${-2 * s} 0 ${-6 * s} Z" fill="${g}" opacity=".85"/>` : '');
        break;
      default:
        out = eyeShape(style, x, y, side, g, s);
    }
    return out + (girl && !NO_LASH.has(expr) ? lashes(x, y, side, g, s) : '');
  }).join('');
};

const MOUTHS = {
  neutral: (x, y, g, w) => line(`M${x - w / 2} ${y - 1} Q${x} ${y + 3} ${x + w / 2} ${y - 1}`, g, 2.2),
  happy: (x, y, g, w) => `<path d="M${x - w / 2 - 2} ${y - 1} Q${x} ${y + 7} ${x + w / 2 + 2} ${y - 1} Z" fill="${g}"/>`,
  laugh: (x, y, g, w) => `<path d="M${x - w / 2 - 3} ${y - 2} Q${x} ${y + 10} ${x + w / 2 + 3} ${y - 2} Z" fill="${g}"/><path d="M${x - 3} ${y + 3} Q${x} ${y + 6} ${x + 3} ${y + 3}" fill="${SCREEN}" opacity=".5"/>`,
  focused: (x, y, g, w) => line(`M${x - w / 2} ${y + 1} L${x + w / 2} ${y - 1}`, g, 2.4),
  surprised: (x, y, g) => `<ellipse cx="${x}" cy="${y + 1}" rx="3" ry="4" fill="none" stroke="${g}" stroke-width="2.2"/>`,
  wink: (x, y, g, w) => line(`M${x - w / 2} ${y} Q${x + 1} ${y + 5} ${x + w / 2 + 2} ${y - 2}`, g, 2.4),
  sleepy: (x, y, g) => line(`M${x - 3} ${y + 1} L${x + 3} ${y + 1}`, g, 2.2),
  sad: (x, y, g, w) => line(`M${x - w / 2} ${y + 3} Q${x} ${y - 3} ${x + w / 2} ${y + 3}`, g, 2.4),
  love: (x, y, g, w) => line(`M${x - w / 2} ${y - 1} Q${x} ${y + 4} ${x + w / 2} ${y - 1}`, g, 2.4),
  starry: (x, y, g, w) => `<path d="M${x - w / 2 - 2} ${y - 1} Q${x} ${y + 8} ${x + w / 2 + 2} ${y - 1} Z" fill="${g}"/>`,
  cool: (x, y, g, w) => line(`M${x - w / 2} ${y + 1} Q${x + 2} ${y + 3} ${x + w / 2 + 2} ${y - 2}`, g, 2.4),
  dizzy: (x, y, g, w) => line(`M${x - w / 2} ${y + 1} Q${x - w / 4} ${y - 2} ${x} ${y + 1} Q${x + w / 4} ${y + 4} ${x + w / 2} ${y + 1}`, g, 2.2),
};

/** Cheek blush for love. */
const blush = (xs, y, s) => xs.map((x) => `<ellipse cx="${x}" cy="${y + 9 * s}" rx="${4 * s}" ry="${2 * s}" fill="#ff7ab6" opacity=".7"/>`).join('');

/** Eyes + mouth on a screen. */
const faceMarkup = (c, k, expr, f) => {
  const g = f.glow;
  return `<g class="crew-blink">${eyes(c.eyes, expr, k.eyes, k.eyeY, g, k.s, c.girl)}</g>${expr === 'love' ? blush(k.eyes, k.eyeY, k.s) : ''}${(MOUTHS[expr] || MOUTHS.neutral)(W / 2, k.mouthY, g, k.mouthW)}`;
};

/* ------------------------------------------------------------------ */
/* Shared upgrades, drawn around a body's anchor points                */
/* ------------------------------------------------------------------ */

const hairMarkup = (style, k, f, front) => {
  const { x, y, w, h } = k.head;
  const cx = x + w / 2;
  const g = f.glow;
  const soft = (d, o = 0.45) => `<path d="${d}" fill="${g}" opacity="${o}"/>`;
  const cap = soft(`M${x - 2} ${y + 18} C${x - 2} ${y - 8} ${x + w + 2} ${y - 8} ${x + w + 2} ${y + 18} Z`, 0.4);
  const fringe = soft(`M${x + 3} ${y + 10} C${x + 12} ${y - 4} ${x + w - 12} ${y - 4} ${x + w - 3} ${y + 10} L${x + w - 12} ${y + 5} L${cx + 5} ${y + 9} L${cx - 7} ${y + 4} L${x + 12} ${y + 10} Z`, 0.62);
  if (front) {
    if (style === 'bob' || style === 'long') return fringe;
    if (style === 'cables') {
      return [-1, 1].map((sd) => {
        const ex = sd < 0 ? x : x + w;
        return line(`M${ex} ${y + 10} C${ex + sd * 12} ${y + 34} ${ex + sd * 6} ${y + 62} ${ex + sd * 2} ${y + 86}`, g, 3.4) + line(`M${ex - sd * 4} ${y + 6} C${ex + sd * 8} ${y + 30} ${ex + sd * 2} ${y + 54} ${ex - sd * 2} ${y + 74}`, g, 3) + `<circle cx="${ex + sd * 2}" cy="${y + 87}" r="3" fill="${g}"/>`;
      }).join('');
    }
    return '';
  }
  switch (style) {
    case 'swept':
      return `<g class="crew-hair">${soft(`M${cx - 14} ${y + 6} C${cx + 2} ${y - 14} ${cx + 36} ${y - 12} ${cx + 54} ${y + 10} C${cx + 40} ${y + 2} ${cx + 22} ${y} ${cx + 10} ${y + 8} Z`, 0.35)}${soft(`M${cx - 6} ${y + 2} C${cx + 12} ${y - 12} ${cx + 40} ${y - 6} ${cx + 56} ${y + 18} C${cx + 40} ${y + 8} ${cx + 24} ${y + 6} ${cx + 12} ${y + 10} Z`, 0.45)}${line(`M${cx + 2} ${y} C${cx + 20} ${y - 8} ${cx + 42} ${y + 2} ${cx + 50} ${y + 24}`, g, 1.6)}</g>`;
    case 'ponytail':
      return `${cap}<g class="crew-hair">${soft(`M${x + w - 6} ${y + 4} C${x + w + 30} ${y - 2} ${x + w + 36} ${y + 40} ${x + w + 18} ${y + 84} C${x + w + 20} ${y + 46} ${x + w + 12} ${y + 24} ${x + w - 8} ${y + 18} Z`, 0.55)}${line(`M${x + w + 4} ${y + 8} C${x + w + 26} ${y + 14} ${x + w + 26} ${y + 46} ${x + w + 18} ${y + 74}`, g, 1.4)}</g><circle cx="${x + w - 2}" cy="${y + 8}" r="4.5" fill="${g}"/>`;
    case 'bob':
      return soft(`M${x - 7} ${y + h * 0.8} C${x - 12} ${y - 8} ${x + w + 12} ${y - 8} ${x + w + 7} ${y + h * 0.8} L${x + w - 3} ${y + h * 0.8} L${x + w - 3} ${y + 12} L${x + 3} ${y + 12} L${x + 3} ${y + h * 0.8} Z`, 0.45);
    case 'long':
      return `<g class="crew-hair">${soft(`M${x - 8} ${y + h + 44} C${x - 16} ${y + h * 0.5} ${x - 14} ${y - 10} ${cx} ${y - 8} C${x + w + 14} ${y - 10} ${x + w + 16} ${y + h * 0.5} ${x + w + 8} ${y + h + 44} L${x + w - 2} ${y + h + 30} L${x + w - 2} ${y + 12} L${x + 2} ${y + 12} L${x + 2} ${y + h + 30} Z`, 0.45)}${line(`M${x - 6} ${y + 20} C${x - 10} ${y + h} ${x - 8} ${y + h + 20} ${x - 6} ${y + h + 38}`, g, 1.4)}${line(`M${x + w + 6} ${y + 20} C${x + w + 10} ${y + h} ${x + w + 8} ${y + h + 20} ${x + w + 6} ${y + h + 38}`, g, 1.4)}</g>`;
    case 'twintails':
      return `${cap}<g class="crew-hair">${[-1, 1].map((sd) => {
        const ex = sd < 0 ? x + 6 : x + w - 6;
        return soft(`M${ex} ${y + 6} C${ex + sd * 30} ${y + 10} ${ex + sd * 32} ${y + 60} ${ex + sd * 18} ${y + 98} C${ex + sd * 20} ${y + 60} ${ex + sd * 14} ${y + 30} ${ex - sd * 2} ${y + 18} Z`, 0.55) + `<circle cx="${ex}" cy="${y + 8}" r="4.5" fill="${g}"/>`;
      }).join('')}</g>`;
    case 'buns':
      return `${cap}${[x + 3, x + w - 3].map((bx) => `<circle cx="${bx}" cy="${y + 1}" r="12" fill="${g}" opacity=".5"/><circle cx="${bx}" cy="${y + 1}" r="6" fill="none" stroke="${g}" stroke-width="1.6"/>`).join('')}`;
    case 'spikes': {
      let d = `M${x + 2} ${y + 16}`;
      const n = 5;
      for (let i = 0; i <= n; i += 1) {
        const px = x + 2 + ((w - 4) * i) / n;
        d += ` L${px} ${y + 4 - (i % 2 ? 0 : 0)} L${px + (w - 4) / n / 2} ${y - 16 + Math.abs(i - n / 2) * 3}`;
      }
      d += ` L${x + w - 2} ${y + 16} Z`;
      return soft(d, 0.55);
    }
    case 'flame':
      return `<g class="crew-flame-hair">${[-18, -6, 6, 18].map((dx, i) => `<path d="M${cx + dx - 8} ${y + 8} Q${cx + dx - 6} ${y - 18 - (i % 2) * 8} ${cx + dx + 2} ${y - 30 - (i % 2) * 10} Q${cx + dx + 4} ${y - 10} ${cx + dx + 9} ${y + 8} Z" fill="${i % 2 ? '#ffb020' : '#ff5a1f'}" opacity=".8"/>`).join('')}${soft(`M${cx - 16} ${y + 8} Q${cx} ${y - 30} ${cx + 16} ${y + 8} Z`, 0.6)}</g>`;
    default:
      return '';
  }
};

const backMarkup = (style, k, f) => {
  const { sl, sr, bottom } = k;
  const sy = sl[1];
  const cx = W / 2;
  switch (style) {
    case 'cape':
      return `<path d="M${sl[0] + 8} ${sy - 4} Q${sl[0] - 8} ${sy + (bottom - sy) * 0.6} ${sl[0] - 16} ${bottom - 8} L${sr[0] + 16} ${bottom - 8} Q${sr[0] + 8} ${sy + (bottom - sy) * 0.6} ${sr[0] - 8} ${sy - 4} Z" fill="${f.trim}" stroke="${OUT}" stroke-width="1.4"/><path d="M${cx - 18} ${sy + 30} Q${cx - 24} ${bottom - 40} ${cx - 30} ${bottom - 10} M${cx + 18} ${sy + 30} Q${cx + 24} ${bottom - 40} ${cx + 30} ${bottom - 10}" fill="none" stroke="rgba(0,0,0,.25)" stroke-width="2"/>`;
    case 'jetpack':
      return [-1, 1].map((sd) => {
        const x = cx + sd * 30;
        return `<g class="crew-flame" style="transform-origin:${x}px ${sy + 38}px"><path d="M${x - 5} ${sy + 38} Q${x} ${sy + 66} ${x + 5} ${sy + 38} Z" fill="#ff8a2a"/><path d="M${x - 2.5} ${sy + 38} Q${x} ${sy + 54} ${x + 2.5} ${sy + 38} Z" fill="#ffe07a"/></g><rect x="${x - 8}" y="${sy - 6}" width="16" height="40" rx="7" fill="${f.dark}" stroke="${OUT}" stroke-width="1.4"/><rect x="${x - 8}" y="${sy + 2}" width="16" height="4" fill="${f.trim}"/>`;
      }).join('');
    case 'wings':
      return [-1, 1].map((sd) => {
        const X = (dx) => cx + sd * dx;
        return `<g class="crew-wing" style="transform-origin:${X(16)}px ${sy + 10}px"><path d="M${X(16)} ${sy + 4} L${X(96)} ${sy - 46} L${X(80)} ${sy - 6} L${X(102)} ${sy + 4} L${X(74)} ${sy + 22} L${X(88)} ${sy + 44} L${X(20)} ${sy + 30} Z" fill="${f.glowSolid}" opacity=".38" stroke="${f.glowSolid}" stroke-width="1.6" stroke-linejoin="round"/><path d="M${X(22)} ${sy + 10} L${X(90)} ${sy - 36} M${X(22)} ${sy + 16} L${X(96)} ${sy + 4} M${X(22)} ${sy + 24} L${X(82)} ${sy + 40}" stroke="#fff" opacity=".55" stroke-width="1.2"/></g>`;
      }).join('');
    case 'phoenix':
      return [-1, 1].map((sd) => {
        const X = (dx) => cx + sd * dx;
        return `<g class="crew-wing" style="transform-origin:${X(16)}px ${sy + 10}px"><path d="M${X(16)} ${sy + 6} C${X(60)} ${sy - 60} ${X(110)} ${sy - 40} ${X(104)} ${sy - 10} C${X(92)} ${sy - 18} ${X(84)} ${sy - 10} ${X(96)} ${sy + 10} C${X(80)} ${sy + 4} ${X(74)} ${sy + 14} ${X(84)} ${sy + 34} C${X(60)} ${sy + 24} ${X(36)} ${sy + 36} ${X(20)} ${sy + 30} Z" fill="#ff7a1a" opacity=".85" stroke="#ffd23a" stroke-width="1.6"/><path d="M${X(22)} ${sy + 12} C${X(56)} ${sy - 30} ${X(86)} ${sy - 26} ${X(92)} ${sy - 12}" fill="none" stroke="#fff1a8" stroke-width="2" opacity=".8"/></g>`;
      }).join('');
    case 'rotor':
      return [-1, 1].map((sd) => {
        const x = cx + sd * 40;
        return `<path d="M${cx + sd * 18} ${sy} L${x} ${sy - 30}" stroke="${f.dark}" stroke-width="5" stroke-linecap="round"/><circle cx="${x}" cy="${sy - 32}" r="4" fill="${f.trim}"/><ellipse class="crew-rotor" cx="${x}" cy="${sy - 34}" rx="26" ry="4" fill="${f.glowSolid}" opacity=".35" stroke="${f.glowSolid}" stroke-width="1.2" style="transform-origin:${x}px ${sy - 34}px"/>`;
      }).join('');
    default:
      return '';
  }
};

const neckMarkup = (style, k, f) => (style === 'scarf'
  ? `<path d="M${W / 2 + 8} ${k.neckY + 4} L${W / 2 + 26} ${k.neckY + 40} L${W / 2 + 16} ${k.neckY + 44} L${W / 2 + 4} ${k.neckY + 10} Z" fill="${f.trim}" stroke="${OUT}" stroke-width="1.2"/><path d="M${W / 2 - 18} ${k.neckY - 4} Q${W / 2} ${k.neckY + 6} ${W / 2 + 18} ${k.neckY - 4} L${W / 2 + 20} ${k.neckY + 6} Q${W / 2} ${k.neckY + 18} ${W / 2 - 20} ${k.neckY + 6} Z" fill="${f.trim}" stroke="${OUT}" stroke-width="1.2"/>`
  : '');

const gearMarkup = (style, k, f, base, layer) => {
  const { x, y, w, h } = k.head;
  if (layer === 'behind') {
    if (style === 'skateboard') {
      const gx = 186;
      const gy = k.feet - 40;
      return `<g transform="rotate(-12 ${gx} ${gy})"><rect x="${gx - 7}" y="${gy - 38}" width="14" height="76" rx="7" fill="${f.trim}" stroke="${OUT}" stroke-width="1.4"/><rect x="${gx - 4}" y="${gy - 30}" width="8" height="60" rx="4" fill="${f.dark}" opacity=".5"/><circle cx="${gx - 9}" cy="${gy - 24}" r="3.5" fill="${f.glowSolid}"/><circle cx="${gx - 9}" cy="${gy + 24}" r="3.5" fill="${f.glowSolid}"/></g>`;
    }
    if (style === 'hoverboard') {
      const by = base === 'drone' ? 246 : k.feet + 4;
      return `<ellipse cx="${W / 2}" cy="${by + 10}" rx="52" ry="7" fill="${f.glowSolid}" opacity=".35" class="crew-pulse"/><rect x="${W / 2 - 50}" y="${by - 5}" width="100" height="10" rx="5" fill="${f.trim}" stroke="${OUT}" stroke-width="1.4"/><rect x="${W / 2 - 40}" y="${by + 3}" width="80" height="3" fill="${f.glow}"/>`;
    }
    return '';
  }
  switch (style) {
    case 'headphones':
      if (base === 'street') return '';
      return `<path d="M${x - 4} ${y + h * 0.5} C${x - 4} ${y - 12} ${x + w + 4} ${y - 12} ${x + w + 4} ${y + h * 0.5}" fill="none" stroke="#1d2230" stroke-width="5" stroke-linecap="round"/>${[x - 6, x + w + 6].map((cx) => `<rect x="${cx - 6}" y="${y + h * 0.32}" width="12" height="${h * 0.36}" rx="5" fill="${f.trim}" stroke="${OUT}" stroke-width="1.2"/><circle cx="${cx}" cy="${y + h * 0.5}" r="2.6" fill="${f.glow}"/>`).join('')}`;
    case 'bag':
      return `<path d="M${k.sl[0] + 6} ${k.sl[1] - 4} L${k.hip[0] + 34} ${k.hip[1]}" stroke="#1d2230" stroke-width="4"/><rect x="${k.hip[0] + 24}" y="${k.hip[1] - 6}" width="30" height="22" rx="6" fill="${f.trim}" stroke="${OUT}" stroke-width="1.2"/><rect x="${k.hip[0] + 28}" y="${k.hip[1]}" width="22" height="3" fill="${f.glow}"/>`;
    case 'tablet': {
      const [hx, hy] = k.hand;
      return `<g class="crew-pulse"><rect x="${hx + 6}" y="${hy - 34}" width="30" height="22" rx="3" fill="${f.glowSolid}" opacity=".28" stroke="${f.glowSolid}" stroke-width="1.4"/><path d="M${hx + 11} ${hy - 26} L${hx + 31} ${hy - 26} M${hx + 11} ${hy - 21} L${hx + 25} ${hy - 21} M${hx + 11} ${hy - 16} L${hx + 28} ${hy - 16}" stroke="${f.glowSolid}" stroke-width="1.4"/></g>`;
    }
    default:
      return '';
  }
};

const decalMarkup = (style, k, f) => {
  const [x, y] = k.chest;
  const c = f.trim;
  switch (style) {
    case 'stripes':
      return `<path d="M${x - 14} ${y - 4} L${x - 4} ${y - 12} M${x - 14} ${y + 2} L${x - 4} ${y - 6}" stroke="${c}" stroke-width="3" stroke-linecap="round"/>`;
    case 'number':
      return `<text x="${x - 9}" y="${y + 4}" font-family="system-ui, sans-serif" font-size="12" font-weight="900" fill="${c}" text-anchor="middle">07</text>`;
    case 'star':
      return `<polygon points="${starPts(x - 9, y - 4, 6)}" fill="${c}"/>`;
    case 'bolt':
      return `<path d="M${x - 8} ${y - 12} L${x - 14} ${y - 2} L${x - 9} ${y - 2} L${x - 12} ${y + 6} L${x - 3} ${y - 5} L${x - 8} ${y - 5} Z" fill="${c}"/>`;
    case 'flame':
      return `<path d="M${x - 10} ${y + 6} Q${x - 18} ${y - 4} ${x - 10} ${y - 14} Q${x - 9} ${y - 6} ${x - 5} ${y - 8} Q${x - 2} ${y} ${x - 10} ${y + 6} Z" fill="#ff7a1a"/><path d="M${x - 10} ${y + 4} Q${x - 13} ${y - 2} ${x - 9} ${y - 6} Q${x - 7} ${y} ${x - 10} ${y + 4} Z" fill="#ffe07a"/>`;
    case 'crown':
      return `<path d="M${x - 18} ${y + 2} L${x - 18} ${y - 8} L${x - 13} ${y - 3} L${x - 9} ${y - 11} L${x - 5} ${y - 3} L${x} ${y - 8} L${x} ${y + 2} Z" fill="#ffcc33" stroke="#9c6b05" stroke-width="1"/>`;
    default:
      return '';
  }
};

const auraMarkup = (style, k, f, streak) => {
  if (style === 'none') return '';
  const scale = (0.85 + Math.min(streak || 0, 14) / 14 * 0.45).toFixed(2);
  const [cx, cy] = [W / 2, k.center];
  const g = f.glowSolid;
  let inner = '';
  switch (style) {
    case 'sparks':
      inner = [[-70, -60], [64, -76], [-84, 10], [82, 24], [-52, 86], [58, 92], [0, -112], [-20, 120]].map(([dx, dy], i) => `<path class="crew-twinkle" style="animation-delay:${(i * 0.23).toFixed(2)}s" d="M${cx + dx} ${cy + dy - 6} L${cx + dx + 2} ${cy + dy} L${cx + dx} ${cy + dy + 6} L${cx + dx - 2} ${cy + dy} Z" fill="${g}"/>`).join('');
      break;
    case 'rings':
      inner = `<ellipse cx="${cx}" cy="${cy}" rx="86" ry="118" fill="none" stroke="${g}" stroke-width="2" opacity=".5" class="crew-pulse"/><ellipse cx="${cx}" cy="${cy}" rx="100" ry="132" fill="none" stroke="${g}" stroke-width="1.2" opacity=".3" stroke-dasharray="6 8" class="crew-spin" style="transform-origin:${cx}px ${cy}px"/>`;
      break;
    case 'flame':
      inner = [-60, -34, -10, 14, 38, 62].map((dx, i) => `<path class="crew-flicker" style="transform-origin:${cx + dx}px ${k.feet}px;animation-delay:${(i * 0.11).toFixed(2)}s" d="M${cx + dx - 14} ${k.feet} Q${cx + dx - 8} ${k.feet - 70 - (i % 3) * 22} ${cx + dx + 2} ${k.feet - 110 - (i % 2) * 30} Q${cx + dx + 6} ${k.feet - 50} ${cx + dx + 14} ${k.feet} Z" fill="${i % 2 ? '#ffb020' : '#ff5a1f'}" opacity=".5"/>`).join('');
      break;
    case 'lightning':
      inner = [-1, 1].map((sd) => `<path class="crew-twinkle" d="M${cx + sd * 70} ${cy - 110} L${cx + sd * 54} ${cy - 50} L${cx + sd * 74} ${cy - 46} L${cx + sd * 50} ${cy + 30} L${cx + sd * 60} ${cy - 20} L${cx + sd * 42} ${cy - 24} Z" fill="#fff36b" stroke="${g}" stroke-width="1.5"/>`).join('');
      break;
    case 'rainbow':
      inner = `<ellipse cx="${cx}" cy="${cy}" rx="92" ry="126" fill="none" stroke="url(#${f.p}ra)" stroke-width="7" opacity=".55" class="crew-pulse"/>`;
      f.defs.push(gradient(`${f.p}ra`, RAINBOW));
      break;
    default:
      return '';
  }
  return `<g transform="translate(${cx} ${cy}) scale(${scale}) translate(${-cx} ${-cy})">${inner}</g>`;
};

/* ------------------------------------------------------------------ */
/* Bodies                                                              */
/* ------------------------------------------------------------------ */

const mirrorX = (x) => W - x;

/** Anchor points per body, used by the shared upgrades and the emotes. */
const ANCHORS = {
  vanguard: {
    head: { x: 84, y: 16, w: 52, h: 58 }, eyes: [100, 120], eyeY: 44, mouthY: 53, mouthW: 7, s: 0.82,
    sl: [68, 104], sr: [152, 104], neckY: 80, chest: [110, 112], hip: [110, 170], hand: [159, 206], feet: 298, bottom: 298, center: 160,
    crop: '70 0 80 82',
  },
  drone: {
    head: { x: 70, y: 38, w: 80, h: 66 }, eyes: [97, 123], eyeY: 69, mouthY: 85, mouthW: 8, s: 1,
    sl: [84, 134], sr: [136, 134], neckY: 108, chest: [110, 150], hip: [110, 186], hand: [166, 180], feet: 250, bottom: 214, center: 140,
    crop: '56 22 108 92',
  },
  street: {
    head: { x: 84, y: 20, w: 52, h: 48 }, eyes: [101, 121], eyeY: 43, mouthY: 54, mouthW: 8, s: 1,
    sl: [76, 88], sr: [144, 88], neckY: 72, chest: [110, 108], hip: [110, 166], hand: [61, 190], feet: 278, bottom: 278, center: 150,
    crop: '70 4 80 76',
  },
};

const armGroup = (side, k, inner) => {
  const [sx, sy] = side < 0 ? k.sl : k.sr;
  return `<g class="crew-arm-${side < 0 ? 'l' : 'r'}" style="transform-origin:${sx}px ${sy}px">${inner}</g>`;
};

const vanguardBody = (c, k, f, expr) => {
  const girl = c.girl;
  const X = (side, x) => (side < 0 ? x : mirrorX(x));
  const arm = (side) => armGroup(side, k, `
    <path d="M${X(side, 68)} 112 L${X(side, 61)} 152" stroke="${f.dark}" stroke-width="${girl ? 13 : 15}" stroke-linecap="round"/>
    <path d="M${X(side, 67)} 118 L${X(side, 63)} 142" stroke="${f.fill}" stroke-width="${girl ? 8 : 10}" stroke-linecap="round"/>
    <circle cx="${X(side, 61)}" cy="153" r="6" fill="${f.dark}" stroke="${f.glow}" stroke-width="1.6" class="crew-pulse"/>
    <path d="M${X(side, girl ? 54 : 52)} 158 L${X(side, girl ? 68 : 70)} 158 L${X(side, 65)} 196 L${X(side, girl ? 53 : 51)} 196 Z" fill="${f.fill}" stroke="${OUT}" stroke-width="1.2"/>
    <path d="M${X(side, 58)} 164 L${X(side, 57)} 190" stroke="${f.glow}" stroke-width="1.6" class="crew-pulse"/>
    <path d="M${X(side, girl ? 54 : 52)} 158 L${X(side, girl ? 68 : 70)} 158 L${X(side, 69)} 165 L${X(side, girl ? 54 : 52)} 165 Z" fill="${f.trim}"/>
    <path d="M${X(side, 52)} 197 L${X(side, 65)} 197 L${X(side, 67)} 209 Q${X(side, 59)} 217 ${X(side, 51)} 209 Z" fill="${f.dark}" stroke="${OUT}" stroke-width="1"/>`);
  const leg = (side) => `
    <path d="M${X(side, 98)} 182 L${X(side, 96)} 236" stroke="${f.dark}" stroke-width="${girl ? 16 : 20}" stroke-linecap="round"/>
    <path d="M${X(side, girl ? 89 : 86)} 188 L${X(side, girl ? 104 : 104)} 188 L${X(side, 102)} 224 L${X(side, girl ? 91 : 88)} 224 Z" fill="${f.fill}" stroke="${OUT}" stroke-width="1.2"/>
    <path d="M${X(side, 93)} 194 L${X(side, 93)} 218" stroke="${f.glow}" stroke-width="1.4" class="crew-pulse"/>
    <path d="M${X(side, 87)} 226 L${X(side, 105)} 226 L${X(side, 102)} 241 L${X(side, 89)} 241 Z" fill="${f.trim}" stroke="${OUT}" stroke-width="1"/>
    <path d="M${X(side, 90)} 244 L${X(side, 102)} 244 L${X(side, 100)} 282 L${X(side, 92)} 282 Z" fill="${f.fill}" stroke="${OUT}" stroke-width="1.2"/>
    <path d="M${X(side, girl ? 86 : 84)} 282 L${X(side, 104)} 282 L${X(side, girl ? 108 : 110)} 297 L${X(side, girl ? 84 : 80)} 297 Z" fill="${f.dark}" stroke="${OUT}" stroke-width="1"/>
    <path d="M${X(side, girl ? 84 : 80)} 297 L${X(side, girl ? 108 : 110)} 297" stroke="${f.glow}" stroke-width="2.4" class="crew-pulse"/>`;
  const torso = girl
    ? `<path d="M84 84 L136 84 L128 172 L92 172 Z" fill="${f.dark}"/>
       <path d="M80 90 Q110 82 140 90 L143 104 L130 128 Q110 136 90 128 L77 104 Z" fill="${f.fill}" stroke="${OUT}" stroke-width="1.4"/>
       ${[0, 1, 2].map((i) => `<path d="M${94 + i * 1.5} ${138 + i * 8} L${126 - i * 1.5} ${138 + i * 8} L${125 - i * 1.5} ${144 + i * 8} L${95 + i * 1.5} ${144 + i * 8} Z" fill="#2b3245" stroke="${OUT}" stroke-width=".8"/>`).join('')}
       <path d="M88 164 L132 164 L134 174 L86 174 Z" fill="${f.fill}" stroke="${OUT}" stroke-width="1.2"/>
       <path d="M86 174 L134 174 L148 206 L72 206 Z" fill="${f.trim}" stroke="${OUT}" stroke-width="1.2"/>
       <path d="M98 176 L92 204 M110 176 L110 205 M122 176 L128 204" stroke="rgba(0,0,0,.28)" stroke-width="1.4"/>`
    : `<path d="M80 84 L140 84 L134 172 L86 172 Z" fill="${f.dark}"/>
       <path d="M78 90 Q110 80 142 90 L146 106 L136 134 Q110 144 84 134 L74 106 Z" fill="${f.fill}" stroke="${OUT}" stroke-width="1.4"/>
       ${[0, 1, 2].map((i) => `<path d="M${88 + i * 2} ${140 + i * 8} L${132 - i * 2} ${140 + i * 8} L${131 - i * 2} ${146 + i * 8} L${89 + i * 2} ${146 + i * 8} Z" fill="#2b3245" stroke="${OUT}" stroke-width=".8"/>`).join('')}
       <path d="M84 164 L136 164 L140 178 L80 178 Z" fill="${f.fill}" stroke="${OUT}" stroke-width="1.2"/>
       <path d="M80 178 L97 178 L93 198 L78 194 Z M140 178 L123 178 L127 198 L142 194 Z" fill="${f.trim}" stroke="${OUT}" stroke-width="1"/>`;
  const pauldron = (side) => (girl
    ? `<path d="M${X(side, 82)} 88 C${X(side, 66)} 86 ${X(side, 60)} 96 ${X(side, 61)} 110 L${X(side, 77)} 110 L${X(side, 84)} 98 Z" fill="${f.fill}" stroke="${OUT}" stroke-width="1.3"/>`
    : `<path d="M${X(side, 80)} 86 C${X(side, 62)} 82 ${X(side, 54)} 96 ${X(side, 56)} 114 L${X(side, 76)} 114 L${X(side, 84)} 98 Z" fill="${f.fill}" stroke="${OUT}" stroke-width="1.4"/><path d="M${X(side, 60)} 100 L${X(side, 76)} 104" stroke="${f.trim}" stroke-width="3"/>`);
  return {
    body: `${leg(-1)}${leg(1)}${torso}
      <path d="M110 94 L110 128 M${girl ? 92 : 90} 104 L104 114 M${girl ? 128 : 130} 104 L116 114" stroke="${f.glow}" stroke-width="1.6" class="crew-pulse"/>
      <circle cx="110" cy="112" r="15" fill="${f.glowSolid}" opacity=".25" class="crew-pulse"/>
      <path d="M110 104 L117 112 L110 120 L103 112 Z" fill="${f.glow}"/>
      <path d="M92 84 L128 84 L122 94 L98 94 Z" fill="${f.trim}"/>`,
    arms: [arm(-1), arm(1)],
    shoulders: `${pauldron(-1)}${pauldron(1)}`,
    neck: `<rect x="102" y="68" width="16" height="16" fill="${f.dark}"/><path d="M105 70 L105 84 M110 70 L110 84 M115 70 L115 84" stroke="rgba(255,255,255,.2)"/>`,
    head: `${girl
      ? `<path d="M86 38 L78 28 L80 50 L87 52 Z M134 38 L142 28 L140 50 L133 52 Z" fill="${f.trim}" stroke="${OUT}" stroke-width="1"/>`
      : `<path d="M84 40 L72 32 L77 54 L86 56 Z M136 40 L148 32 L143 54 L134 56 Z" fill="${f.trim}" stroke="${OUT}" stroke-width="1"/>`}
      <path d="M84 44 C84 26 96 16 110 16 C124 16 136 26 136 44 L134 60 C132 68 122 74 110 74 C98 74 88 68 86 60 Z" fill="${f.fill}" stroke="${OUT}" stroke-width="1.5"/>
      <path d="M90 26 C96 19 104 17 112 17" stroke="#fff" stroke-opacity=".7" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      <path d="M95 63 Q110 71 125 63 L121 69 Q110 75 99 69 Z" fill="${f.dark}"/>
      <path d="M88 35 L132 35 L134 54 Q110 61 86 54 Z" fill="${SCREEN}" stroke="${f.trim}" stroke-width="1.2"/>
      <clipPath id="${f.p}v"><path d="M88 35 L132 35 L134 54 Q110 61 86 54 Z"/></clipPath>
      <g clip-path="url(#${f.p}v)">${faceMarkup(c, k, expr, f)}<rect x="104" y="34" width="5" height="24" fill="#fff" opacity=".12" class="crew-scan"/></g>`,
    idle: 'crew-breathe',
  };
};

const droneBody = (c, k, f, expr) => {
  const girl = c.girl;
  const X = (side, x) => (side < 0 ? x : mirrorX(x));
  const wing = (side) => (girl
    ? `<path d="M${X(side, 84)} 132 C${X(side, 60)} 100 ${X(side, 26)} 104 ${X(side, 28)} 124 C${X(side, 30)} 140 ${X(side, 60)} 150 ${X(side, 82)} 150 Z" fill="${f.fill}" stroke="${OUT}" stroke-width="1.3"/>
       <path d="M${X(side, 82)} 140 C${X(side, 62)} 132 ${X(side, 40)} 140 ${X(side, 36)} 152 C${X(side, 50)} 160 ${X(side, 70)} 156 ${X(side, 84)} 150 Z" fill="${f.trim}" stroke="${OUT}" stroke-width="1.1"/>
       <path d="M${X(side, 80)} 136 C${X(side, 62)} 120 ${X(side, 44)} 118 ${X(side, 36)} 124" fill="none" stroke="${f.glow}" stroke-width="1.4" class="crew-pulse"/>`
    : `<path d="M${X(side, 84)} 132 L${X(side, 34)} 114 L${X(side, 46)} 128 L${X(side, 28)} 142 L${X(side, 82)} 150 Z" fill="${f.fill}" stroke="${OUT}" stroke-width="1.3"/>
       <path d="M${X(side, 34)} 114 L${X(side, 46)} 128 L${X(side, 28)} 142" fill="none" stroke="${f.trim}" stroke-width="2.6" stroke-linejoin="round"/>
       <path d="M${X(side, 80)} 138 L${X(side, 48)} 128" stroke="${f.glow}" stroke-width="1.4" class="crew-pulse"/>`);
  const hand = (side) => armGroup(side, k, `<g class="crew-float-${side < 0 ? 'l' : 'r'}">
    <circle cx="${X(side, 54)}" cy="178" r="15" fill="${f.glowSolid}" opacity=".15"/>
    ${girl
      ? `<path d="M${X(side, 46)} 168 Q${X(side, 54)} 162 ${X(side, 62)} 168 L${X(side, 64)} 182 Q${X(side, 54)} 194 ${X(side, 44)} 184 Z" fill="${f.dark}" stroke="${OUT}" stroke-width="1.2"/>`
      : `<path d="M${X(side, 44)} 166 L${X(side, 62)} 166 L${X(side, 66)} 180 L${X(side, 58)} 194 L${X(side, 46)} 191 L${X(side, 40)} 178 Z" fill="${f.dark}" stroke="${OUT}" stroke-width="1.2"/>`}
    <path d="M${X(side, 46)} 168 L${X(side, 60)} 168 L${X(side, 62)} 174 L${X(side, 45)} 174 Z" fill="${f.fill}"/>
    ${[0, 1, 2].map((i) => `<circle cx="${X(side, 48 + i * 5)}" cy="185" r="1.6" fill="${f.glow}" class="crew-pulse"/>`).join('')}
  </g>`);
  const rx = girl ? 33 : 27;
  return {
    body: `<g class="crew-flame" style="transform-origin:110px 212px"><path d="M100 210 Q110 280 120 210 Z" fill="${f.glowSolid}" opacity=".85"/><path d="M105 210 Q110 248 115 210 Z" fill="#fff" opacity=".85"/></g>
      ${wing(-1)}${wing(1)}
      <path d="M84 118 Q110 106 136 118 L142 150 Q128 200 110 214 Q92 200 78 150 Z" fill="${f.dark}" stroke="${OUT}" stroke-width="1.5"/>
      <path d="M92 124 Q110 117 128 124 L130 150 Q120 178 110 188 Q100 178 90 150 Z" fill="${f.fill}"/>
      <path d="M100 196 L120 196 L116 212 L104 212 Z" fill="#3a4152" stroke="${OUT}" stroke-width="1"/>
      <circle cx="110" cy="148" r="17" fill="${f.glowSolid}" opacity=".25" class="crew-pulse"/>
      <circle cx="110" cy="148" r="9" fill="${SCREEN}" stroke="${f.trim}" stroke-width="2"/>
      <circle cx="110" cy="148" r="5" fill="${f.glow}" class="crew-pulse"/>
      <path d="M96 166 L110 176 L124 166" fill="none" stroke="${f.trim}" stroke-width="2.4"/>`,
    arms: [hand(-1), hand(1)],
    shoulders: '',
    neck: `<circle cx="110" cy="110" r="2.2" fill="${f.glow}" class="crew-pulse"/><circle cx="104" cy="111" r="1.6" fill="${f.glow}"/><circle cx="116" cy="111" r="1.6" fill="${f.glow}"/>`,
    head: `<ellipse cx="110" cy="70" rx="62" ry="11" fill="none" stroke="${f.glowSolid}" stroke-width="1.4" opacity=".5" class="crew-pulse"/>
      ${girl
      ? `<path d="M96 42 C80 22 66 30 80 46 Z M124 42 C140 22 154 30 140 46 Z" fill="${f.trim}" stroke="${OUT}" stroke-width="1"/><circle cx="110" cy="38" r="4" fill="${f.trim}" stroke="${OUT}" stroke-width="1"/>`
      : `<path d="M80 52 L56 22 L74 50 Z M140 52 L164 22 L146 50 Z" fill="${f.trim}" stroke="${OUT}" stroke-width="1"/><path d="M84 46 L66 30 L80 52 Z M136 46 L154 30 L140 52 Z" fill="${f.fill}" stroke="${OUT}" stroke-width="1"/>`}
      <rect x="70" y="38" width="80" height="66" rx="${rx}" fill="${f.fill}" stroke="${OUT}" stroke-width="1.6"/>
      <path d="M82 50 Q92 41 110 41" stroke="#fff" stroke-opacity=".8" stroke-width="2.6" fill="none" stroke-linecap="round"/>
      <rect x="77" y="50" width="66" height="44" rx="${girl ? 20 : 18}" fill="${SCREEN}" stroke="${f.trim}" stroke-width="1.4"/>
      ${faceMarkup(c, k, expr, f)}
      <rect x="64" y="64" width="6" height="16" rx="3" fill="${f.dark}"/><rect x="150" y="64" width="6" height="16" rx="3" fill="${f.dark}"/>`,
    idle: 'crew-bob',
  };
};

const streetBody = (c, k, f, expr) => {
  const girl = c.girl;
  const hoodie2 = shade(c.palette.main, -0.16);
  const pants = f.dark;
  const shoe = f.trim;
  const lowerBody = girl
    ? `<path d="M90 194 L104 194 L103 254 L91 254 Z M116 194 L130 194 L129 254 L117 254 Z" fill="${shade(pants, -0.2)}" stroke="${OUT}" stroke-width="1.1"/>
       <path d="M80 156 L140 156 L152 198 L68 198 Z" fill="${pants}" stroke="${OUT}" stroke-width="1.2"/>
       <path d="M90 158 L84 196 M100 158 L97 197 M110 158 L110 198 M120 158 L123 197 M130 158 L136 196" stroke="rgba(255,255,255,.12)" stroke-width="1.4"/>
       <path d="M68 196 L152 196" stroke="${f.glow}" stroke-width="2" class="crew-pulse"/>`
    : `<path d="M84 172 L108 172 L106 254 L86 254 Z M112 172 L138 172 L134 254 L114 254 Z" fill="${pants}" stroke="${OUT}" stroke-width="1.2"/>
       <path d="M88 214 L104 214 L103 232 L89 232 Z M116 214 L132 214 L131 232 L117 232 Z" fill="${METAL}" stroke="${OUT}" stroke-width="1"/>
       <path d="M92 220 L100 220 M120 220 L128 220" stroke="${f.glow}" stroke-width="1.6" class="crew-pulse"/>
       <path d="M128 186 L136 186 L135 204 L127 204 Z" fill="rgba(0,0,0,.22)"/>`;
  const leftArm = armGroup(-1, k, `
    <path d="M72 86 L86 94 L74 144 L57 140 Z" fill="${f.fill}" stroke="${OUT}" stroke-width="1.2"/>
    <rect x="56" y="136" width="18" height="9" rx="3" transform="rotate(8 65 140)" fill="${hoodie2}"/>
    <path d="M64 146 L61 182" stroke="${METAL}" stroke-width="10" stroke-linecap="round"/>
    <path d="M64 150 L62 176" stroke="#2b3245" stroke-width="3"/>
    <circle cx="63" cy="164" r="2.4" fill="${f.glow}" class="crew-pulse"/>
    <path d="M53 182 L69 182 L69 196 Q61 203 53 196 Z" fill="${METAL}" stroke="${OUT}" stroke-width="1"/>`);
  const rightArm = armGroup(1, k, `<path d="M148 86 L158 100 L148 140 L130 146 L136 100 Z" fill="${f.fill}" stroke="${OUT}" stroke-width="1.2"/>`);
  const hem = girl ? 160 : 172;
  return {
    body: `<path d="M78 92 L70 160 Q72 172 84 170 L92 100 Z M142 92 L150 160 Q148 172 136 170 L128 100 Z" fill="#20252f"/>
      ${lowerBody}
      <path d="M80 254 L108 254 L113 270 Q113 278 104 278 L80 278 Q72 278 75 266 Z M112 254 L140 254 L146 266 Q148 278 140 278 L116 278 Q108 278 109 270 Z" fill="${shoe}" stroke="${OUT}" stroke-width="1.2"/>
      <path d="M78 272 L112 272 M110 272 L146 272" stroke="${f.glow}" stroke-width="2.4" class="crew-pulse"/>
      <path d="M84 264 Q94 258 104 262 M118 262 Q128 258 138 264" stroke="${c.palette.main}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`,
    arms: [leftArm, ''],
    torsoFront: `
      <path d="M76 82 Q110 72 144 82 L150 ${hem - 22} Q150 ${hem - 4} 140 ${hem} L80 ${hem} Q70 ${hem - 4} 70 ${hem - 22} Z" fill="${f.fill}" stroke="${OUT}" stroke-width="1.4"/>
      <path d="M88 ${hem - 32} L132 ${hem - 32} L136 ${hem - 10} L84 ${hem - 10} Z" fill="${hoodie2}" stroke="${OUT}" stroke-width="1"/>
      <path d="M110 86 L110 ${hem}" stroke="${OUT}" stroke-width="1.6"/>
      <path d="M103 88 L101 114 M117 88 L119 114" stroke="#f2f4f8" stroke-width="1.6" stroke-linecap="round"/>
      <circle cx="101" cy="116" r="2" fill="#f2f4f8"/><circle cx="119" cy="116" r="2" fill="#f2f4f8"/>
      <path d="M86 82 L98 120 M134 82 L122 120" stroke="#20252f" stroke-width="5" opacity=".9"/>
      ${rightArm}
      <path d="M80 74 Q110 96 140 74 L146 86 Q110 106 74 86 Z" fill="${hoodie2}" stroke="${OUT}" stroke-width="1.2"/>`,
    shoulders: '',
    neck: `<rect x="102" y="64" width="16" height="16" fill="${METAL}" stroke="${OUT}" stroke-width="1"/>`,
    head: `<rect x="84" y="20" width="52" height="48" rx="${girl ? 18 : 15}" fill="${METAL}" stroke="${OUT}" stroke-width="1.6"/>
      <path d="M92 24 Q100 21 110 21" stroke="#fff" stroke-opacity=".75" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      <rect x="89" y="28" width="42" height="34" rx="10" fill="${SCREEN}" stroke="${c.palette.main}" stroke-width="1.2"/>
      ${faceMarkup(c, k, expr, f)}`,
    headTop: `<path d="M80 46 C80 6 140 6 140 46" fill="none" stroke="#1d2230" stroke-width="6" stroke-linecap="round"/>
      ${girl ? '<path d="M86 22 L84 8 L96 16 Z M134 22 L136 8 L124 16 Z" fill="#1d2230"/>' : ''}
      <rect x="74" y="34" width="13" height="24" rx="6" fill="${c.palette.main}" stroke="${OUT}" stroke-width="1.2"/>
      <rect x="133" y="34" width="13" height="24" rx="6" fill="${c.palette.main}" stroke="${OUT}" stroke-width="1.2"/>
      <circle cx="80.5" cy="46" r="3.4" fill="${f.glow}" class="crew-pulse"/><circle cx="139.5" cy="46" r="3.4" fill="${f.glow}" class="crew-pulse"/>`,
    idle: 'crew-sway',
  };
};

const BODIES = { vanguard: vanguardBody, drone: droneBody, street: streetBody };

/* ------------------------------------------------------------------ */
/* Public                                                              */
/* ------------------------------------------------------------------ */

/**
 * A crew character as an <svg>.
 * @param {Object} c From engine/crew.js crewLook().
 * @param {{expr?: string, emote?: string|null, headOnly?: boolean, still?: boolean}} [options]
 *   expr: LED face; emote: play this emote once; headOnly: avatar crop; still: no idle motion (thumbnails).
 */
export const crewSvg = (c, { expr = 'neutral', emote = null, headOnly = false, still = false } = {}) => {
  const k = ANCHORS[c.base] || ANCHORS.vanguard;
  const f = paints(c);
  const b = (BODIES[c.base] || vanguardBody)(c, k, f, expr);
  const sleepy = expr === 'sleepy' ? `<text x="${k.head.x + k.head.w + 4}" y="${k.head.y + 6}" font-family="system-ui, sans-serif" font-size="13" font-weight="800" fill="${f.glowSolid}">z z</text>` : '';
  const head = `<g class="crew-head" style="transform-origin:110px ${k.neckY}px">${hairMarkup(c.hair, k, f, false)}${b.head}${hairMarkup(c.hair, k, f, true)}${b.headTop || ''}${gearMarkup(c.gear, k, f, c.base, 'head')}${sleepy}</g>`;
  const inner = headOnly
    ? head
    : `${auraMarkup(c.aura, k, f, c.streak)}
      <ellipse cx="110" cy="${k.feet + 6}" rx="46" ry="6" fill="#000" opacity=".35"/>
      ${gearMarkup(c.gear, k, f, c.base, 'behind')}
      <g class="${still ? '' : b.idle}"><g class="crew-fig${emote ? ` emote-${emote}` : ''}" style="transform-origin:110px ${k.feet}px">
        ${backMarkup(c.back, k, f)}
        ${b.body}
        ${b.arms[0]}${b.arms[1]}
        ${b.torsoFront || ''}
        ${b.shoulders}
        ${b.neck}
        ${decalMarkup(c.decal, k, f)}
        ${neckMarkup(c.back, k, f)}
        ${gearMarkup(c.gear, k, f, c.base, 'body')}
        ${head}
      </g></g>`;
  const el = svg('svg', {
    // Leave room for an aura or tall hair only when there is one, so the robot fills its frame.
    viewBox: headOnly ? k.crop : c.aura !== 'none' || c.back === 'wings' || c.back === 'phoenix' ? '0 -40 220 352' : '14 -18 192 322',
    class: `crew-svg${headOnly ? ' crew-head-only' : ''}${still ? ' crew-still' : ''}`,
    'aria-hidden': 'true',
  });
  el.innerHTML = `<defs>${f.defs.join('')}</defs>${inner}`;
  return el;
};
