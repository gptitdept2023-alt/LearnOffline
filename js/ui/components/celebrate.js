/**
 * Celebrations: a burst of confetti over the screen. Pure CSS animation on a
 * few dozen elements, removed when done. Skipped for people who ask their
 * device for reduced motion.
 */

import { h } from '../../core/dom.js';

const COLORS = ['#2f6fde', '#ffb703', '#ff7a59', '#1f9d55', '#e05297', '#9a6cf0'];

const reducedMotion = () => globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * @param {{count?: number}} [options]
 */
export const confetti = ({ count = 70 } = {}) => {
  if (reducedMotion()) return;
  const pieces = Array.from({ length: count }, (_, i) => h('span.confetti-piece', {
    style: {
      '--x': `${Math.random() * 100}vw`,
      '--drift': `${(Math.random() - 0.5) * 30}vw`,
      '--spin': `${Math.round((Math.random() - 0.5) * 1440)}deg`,
      '--delay': `${Math.random() * 0.4}s`,
      '--dur': `${1.6 + Math.random() * 1.2}s`,
      '--color': COLORS[i % COLORS.length],
    },
  }));
  const layer = h('div.confetti', { 'aria-hidden': 'true' }, pieces);
  document.body.append(layer);
  setTimeout(() => layer.remove(), 3200);
};
