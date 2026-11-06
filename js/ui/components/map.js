/**
 * Learning map: the pack's topics as levels along a winding path. Each level
 * shows its progress ring and up to 3 stars; Pip stands on the level the
 * child is working on now. Levels are never locked, so a child can follow
 * school order, but the path makes "what's next" obvious.
 */

import { h, svg } from '../../core/dom.js';
import { statusOf } from '../../engine/mastery.js';
import { mascot } from './mascot.js';

const ROW = 132;                   // px per level
const XS = [50, 76, 50, 24];       // zig-zag positions, % of width

/** Progress of one topic from the mastery map (no DB access). */
export const levelProgress = (topic, mastery) => {
  let mastered = 0;
  let started = 0;
  for (const s of topic.skills) {
    const status = statusOf(mastery.get(s.skillId));
    if (status === 'mastered') mastered += 1;
    if (status !== 'notStarted') started += 1;
  }
  const total = topic.skills.length;
  // Stars: 1 for starting, 2 for half mastered, 3 for all mastered.
  const stars = mastered === total ? 3 : mastered * 2 >= total && mastered > 0 ? 2 : started > 0 ? 1 : 0;
  return { total, mastered, started, stars, done: total > 0 && mastered === total };
};

/**
 * @param {Object[]} topics
 * @param {Map} mastery
 * @param {Object} look Pip's look (from the shop).
 */
export const learningMap = (topics, mastery, look) => {
  const progress = topics.map((t) => levelProgress(t, mastery));
  const current = Math.max(0, progress.findIndex((p) => !p.done));
  const height = topics.length * ROW;
  const point = (i) => ({ x: XS[i % XS.length], y: i * ROW + ROW / 2 });

  // The path, drawn behind the levels.
  let d = '';
  topics.forEach((_, i) => {
    const p = point(i);
    if (i === 0) { d = `M${p.x} ${p.y}`; return; }
    const q = point(i - 1);
    d += ` C${q.x} ${q.y + ROW / 2} ${p.x} ${p.y - ROW / 2} ${p.x} ${p.y}`;
  });
  const path = svg('svg', { class: 'map-path', viewBox: `0 0 100 ${height}`, preserveAspectRatio: 'none', 'aria-hidden': 'true' },
    svg('path', { d, class: 'map-road' }),
    svg('path', { d, class: 'map-dash' }));

  const levels = topics.map((topic, i) => {
    const p = point(i);
    const pr = progress[i];
    const state = pr.done ? 'done' : i === current ? 'current' : i < current ? 'open' : 'ahead';
    return h(`li.map-level.map-${state}`, { style: { '--x': `${p.x}%`, '--y': `${p.y}px` } },
      h('a.map-node', { href: `#/topic/${encodeURIComponent(topic.topicId)}`, 'aria-label': `Level ${i + 1}: ${topic.title}. ${pr.mastered} of ${pr.total} skills mastered.` },
        h('span.map-ring', { style: { '--pct': `${pr.total ? Math.round((pr.mastered / pr.total) * 100) : 0}%` } },
          h('span.map-icon', { 'aria-hidden': 'true' }, pr.done ? '🏆' : topic.icon || i + 1))),
      h('span.map-stars', { 'aria-hidden': 'true' }, [0, 1, 2].map((k) => h(`span${k < pr.stars ? '.on' : ''}`, null, '★'))),
      h('span.map-label', null, h('small', null, `Level ${i + 1}`), h('strong', null, topic.title)),
      i === current && h(`span.map-pip${p.x > 50 ? '.map-pip-left' : ''}`, null, mascot({ mood: 'happy', look, size: 'sm' })));
  });

  return h('div.map', { style: { '--h': `${height}px` } }, path, h('ol.map-levels', null, levels));
};
