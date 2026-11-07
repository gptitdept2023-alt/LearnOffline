/**
 * Pictures for English: a big picture of a word, letter tiles (with a blank
 * for a missing letter) and a short sentence to read.
 *
 *   { kind: 'letters', emoji: '🐱', tiles: ['c', null, 't'], label: 'cat' }
 *   { kind: 'letters', tiles: ['G'] }                 one big letter
 *   { kind: 'letters', text: 'I see a big dog.' }      a sentence to read
 *
 * `null` in `tiles` is the blank to fill; `highlight` lists tile positions to
 * colour (the sound being taught). `label` is what a screen reader hears, so
 * a blank is never given away. Registered in visuals.js.
 */

import { h } from '../../core/dom.js';

const renderLetters = ({ emoji, tiles, text, highlight = [], label }) => {
  const spoken = label || [tiles?.map((t) => t ?? 'blank').join(', '), text].filter(Boolean).join('. ') || 'A picture';
  return h('div.visual.visual-letters', { role: 'img', 'aria-label': spoken },
    emoji && h('span.word-pic', { 'aria-hidden': 'true' }, emoji),
    tiles?.length && h(`span.letter-tiles${tiles.length === 1 ? '.letter-tiles-one' : ''}${tiles.length <= 4 ? '.letter-tiles-short' : ''}`, { 'aria-hidden': 'true' },
      tiles.map((t, i) => h(`span.letter-tile${t == null ? '.letter-blank' : ''}${highlight.includes(i) ? '.letter-hot' : ''}`, null, t ?? '?'))),
    text && h('p.read-text', { 'aria-hidden': 'true' }, text));
};

export const WORD_RENDERERS = { letters: renderLetters };
