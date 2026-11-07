/**
 * Pip, the learner's companion: a round, friendly character drawn in SVG
 * (no image files, so it works offline and stays sharp at any size).
 * Pip reacts to answers, wears what the child buys in the shop, and says
 * short encouraging lines in a speech bubble.
 */

import { h, svg } from '../../core/dom.js';
import { t, getLanguage } from '../../core/i18n.js';

export const MASCOT_NAME = 'Pip';
const DEFAULT_COLOR = '#ff9f43';

/** Short lines Pip says. Picked at random so they stay fresh. */
export const LINES = {
  correct: ['Yay!', 'You got it!', 'Super!', 'Brilliant!', 'High five!', 'Wow, smart!', 'Nailed it!'],
  wrong: ['Almost! Let’s look together.', 'Good try! Watch how.', 'Mistakes help us learn.', 'That’s OK! Let’s see.'],
  streak: ['You’re on fire!', 'Unstoppable!', 'So many in a row!'],
  great: ['You did amazing!', 'I’m so proud of you!', 'What a star!'],
  good: ['Nice work!', 'You’re getting better!', 'Keep it up!'],
  tryAgain: ['Practice makes us strong!', 'Let’s try again together.', 'Every try helps you learn.'],
};

/** The same lines in Filipino, for learners who chose Filipino labels. */
export const LINES_FIL = {
  correct: ['Yehey!', 'Tama ka!', 'Ang galing!', 'Napakahusay!', 'Apir!', 'Wow, ang talino!', 'Sakto!'],
  wrong: ['Malapit na! Tingnan natin.', 'Ayos lang ’yan! Panoorin natin kung paano.', 'Natututo tayo sa pagkakamali.', 'Okay lang! Tingnan natin.'],
  streak: ['Tuloy-tuloy ka!', 'Walang makakapigil sa iyo!', 'Sunod-sunod na tama!'],
  great: ['Ang galing-galing mo!', 'Proud na proud ako sa iyo!', 'Isa kang bituin!'],
  good: ['Magaling!', 'Gumagaling ka na!', 'Ituloy mo lang!'],
  tryAgain: ['Gumagaling tayo sa pagsasanay!', 'Subukan natin ulit nang magkasama.', 'Sa bawat subok, may natututunan tayo.'],
};

/**
 * A random line of one kind. Lines that are also spoken (the games) pass
 * lang 'en', so the words match the English voice.
 */
export const pickLine = (kind, lang = getLanguage()) => {
  const lines = lang === 'fil' ? LINES_FIL : LINES;
  const list = lines[kind] || lines.good;
  return list[Math.floor(Math.random() * list.length)];
};

/** A greeting that fits the time of day. */
export const greeting = (name) => {
  const hour = new Date().getHours();
  return t(hour < 12 ? 'greetMorning' : hour < 18 ? 'greetAfternoon' : 'greetEvening', name);
};

/** Label keys for how Pip looks, read by screen readers. */
const MOOD_KEYS = { happy: 'moodHappy', cheer: 'moodCheer', think: 'moodThink', oops: 'moodOops', sleep: 'moodSleep' };

/** Face parts for each mood. */
const face = (mood) => {
  const eyes = {
    happy: [svg('circle', { cx: 42, cy: 52, r: 6, class: 'pip-eye' }), svg('circle', { cx: 78, cy: 52, r: 6, class: 'pip-eye' })],
    cheer: [svg('path', { d: 'M35 54 Q42 44 49 54', class: 'pip-line' }), svg('path', { d: 'M71 54 Q78 44 85 54', class: 'pip-line' })],
    think: [svg('circle', { cx: 44, cy: 48, r: 6, class: 'pip-eye' }), svg('circle', { cx: 80, cy: 48, r: 6, class: 'pip-eye' })],
    oops: [svg('circle', { cx: 42, cy: 54, r: 6, class: 'pip-eye' }), svg('circle', { cx: 78, cy: 54, r: 6, class: 'pip-eye' }),
      svg('path', { d: 'M34 42 L48 46', class: 'pip-line' }), svg('path', { d: 'M86 42 L72 46', class: 'pip-line' })],
    sleep: [svg('path', { d: 'M35 52 Q42 58 49 52', class: 'pip-line' }), svg('path', { d: 'M71 52 Q78 58 85 52', class: 'pip-line' })],
  }[mood] || [];
  const mouth = {
    happy: svg('path', { d: 'M48 68 Q60 80 72 68', class: 'pip-line' }),
    cheer: svg('path', { d: 'M45 66 Q60 88 75 66 Z', class: 'pip-mouth' }),
    think: svg('circle', { cx: 66, cy: 72, r: 4, class: 'pip-mouth' }),
    oops: svg('path', { d: 'M48 74 Q54 70 60 74 Q66 78 72 74', class: 'pip-line' }),
    sleep: svg('ellipse', { cx: 60, cy: 72, rx: 5, ry: 3, class: 'pip-mouth' }),
  }[mood];
  return [eyes, mouth];
};

/**
 * Draw Pip.
 * @param {{mood?: 'happy'|'cheer'|'think'|'oops'|'sleep', look?: {color?: string, hat?: string, pet?: string}, size?: 'sm'|'md'|'lg'}} [options]
 */
export const mascot = ({ mood = 'happy', look = {}, size = 'md' } = {}) => {
  const rainbow = look.color === 'rainbow';
  const fill = rainbow ? 'url(#pip-rainbow)' : (look.color || DEFAULT_COLOR);
  const armsUp = mood === 'cheer';
  const body = svg('svg', { viewBox: '0 0 120 120', class: 'pip-svg', 'aria-hidden': 'true' },
    rainbow && svg('defs', {}, svg('linearGradient', { id: 'pip-rainbow', x1: 0, y1: 0, x2: 1, y2: 1 },
      ['#ff5d5d', '#ffb703', '#3cc9a0', '#4f9dff', '#9a6cf0'].map((c, i) => svg('stop', { offset: `${i * 25}%`, 'stop-color': c })))),
    // Arms (behind the body): up when cheering, down otherwise.
    svg('path', { d: armsUp ? 'M22 64 Q8 44 14 30' : 'M22 70 Q10 78 12 90', class: 'pip-arm', stroke: fill }),
    svg('path', { d: armsUp ? 'M98 64 Q112 44 106 30' : 'M98 70 Q110 78 108 90', class: 'pip-arm', stroke: fill }),
    // Feet, body, belly, sprout.
    svg('ellipse', { cx: 44, cy: 108, rx: 11, ry: 6, class: 'pip-foot', fill }),
    svg('ellipse', { cx: 76, cy: 108, rx: 11, ry: 6, class: 'pip-foot', fill }),
    svg('path', { d: 'M60 12 C96 12 106 44 104 70 C102 96 84 106 60 106 C36 106 18 96 16 70 C14 44 24 12 60 12 Z', class: 'pip-body', fill }),
    svg('ellipse', { cx: 60, cy: 84, rx: 26, ry: 16, class: 'pip-belly' }),
    svg('path', { d: 'M60 14 Q58 4 66 2', class: 'pip-sprout' }),
    svg('ellipse', { cx: 70, cy: 4, rx: 7, ry: 4, class: 'pip-leaf' }),
    svg('circle', { cx: 32, cy: 66, r: 6, class: 'pip-cheek' }),
    svg('circle', { cx: 88, cy: 66, r: 6, class: 'pip-cheek' }),
    face(mood),
    mood === 'sleep' && svg('text', { x: 92, y: 30, class: 'pip-zz' }, 'z z'));

  return h(`div.pip.pip-${size}.pip-${mood}`, { role: 'img', 'aria-label': t('pipMood', MASCOT_NAME, MOOD_KEYS[mood] ? t(MOOD_KEYS[mood]) : mood) },
    body,
    look.hat && h('span.pip-hat', { 'aria-hidden': 'true' }, look.hat),
    look.pet && h('span.pip-pet', { 'aria-hidden': 'true' }, look.pet));
};

/** Pip with a speech bubble. `side` puts the bubble to the right (default) or below. */
export const mascotSays = (text, options = {}) =>
  h(`div.pip-talk${options.below ? '.pip-talk-below' : ''}`, null,
    mascot(options),
    h('p.pip-bubble', { 'aria-live': 'polite' }, text));
