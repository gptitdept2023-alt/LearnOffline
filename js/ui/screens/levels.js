/**
 * The 100-level map: 10 worlds of 10 levels, a boss at every 10th level.
 * Levels open one after another; the current one has Pip standing on it.
 */

import { h, toast } from '../../core/dom.js';
import { getState } from '../../core/state.js';
import { getRewards } from '../../data/repo.js';
import { buildLevels, WORLDS, WORLD_SIZE, currentLevel, isUnlocked } from '../../engine/levels.js';
import { lookOf } from '../../engine/shop.js';
import { learnerBar } from '../components/common.js';
import { mascot } from '../components/mascot.js';

/** Zig-zag across the screen, as % of the width. */
const XS = [18, 38, 58, 78, 66, 46, 26, 14, 34, 62];

const levelNode = (level, stars, state, look) => {
  const world = WORLDS[level.world - 1];
  const label = level.boss ? `Boss level ${level.n}: ${level.title}` : `Level ${level.n}: ${level.title}`;
  const inner = [
    h('span.lv-circle', null, state === 'locked' ? '🔒' : level.boss ? world.boss.icon : level.n),
    h('span.lv-stars', { 'aria-hidden': 'true' }, [0, 1, 2].map((k) => h(`span${k < stars ? '.on' : ''}`, null, '★'))),
    level.boss && h('small.lv-boss-tag', null, 'BOSS'),
    state === 'current' && h(`span.lv-pip${XS[(level.n - 1) % WORLD_SIZE] >= 58 ? '.lv-pip-left' : ''}`, null, mascot({ mood: level.boss ? 'think' : 'happy', look, size: 'sm' })),
  ];
  const cls = `.lv-node.lv-${state}${level.boss ? '.lv-boss' : ''}`;
  const style = { '--x': `${XS[(level.n - 1) % WORLD_SIZE]}%`, '--row': (level.n - 1) % WORLD_SIZE };
  return state === 'locked'
    ? h(`button${cls}`, { type: 'button', style, 'aria-label': `${label}. Locked.`, onclick: () => toast(`Pass level ${level.n - 1} to open level ${level.n}.`, 'info') }, inner)
    : h(`a${cls}`, { href: `#/practice/level-${level.n}`, style, 'aria-label': `${label}. ${stars} stars.` }, inner);
};

export const renderLevels = async (view) => {
  const { profile, indexed } = getState();
  const rewards = await getRewards(profile.profileId);
  const stars = rewards.levels || {};
  const levels = buildLevels(indexed);
  const now = currentLevel(stars);
  const look = lookOf(rewards);
  const totalStars = Object.values(stars).reduce((a, b) => a + b, 0);

  const worlds = WORLDS.map((world, w) => {
    const inWorld = levels.slice(w * WORLD_SIZE, (w + 1) * WORLD_SIZE);
    if (!inWorld.length) return null;
    const worldStars = inWorld.reduce((sum, l) => sum + (stars[l.n] || 0), 0);
    const open = isUnlocked(inWorld[0].n, stars);
    return h(`section.lv-world.lv-world-${w + 1}${open ? '' : '.lv-world-locked'}`, null,
      h('header.lv-world-head', null,
        h('span.lv-world-icon', { 'aria-hidden': 'true' }, world.icon),
        h('span', null, h('strong', null, `World ${w + 1}: ${world.name}`), h('small', null, `Levels ${inWorld[0].n}–${inWorld.at(-1).n} · ${worldStars}/${inWorld.length * 3} ★`))),
      h('ol.lv-path', null, inWorld.map((l) => {
        const state = l.n === now && !(stars[l.n] > 0) ? 'current' : stars[l.n] > 0 ? 'done' : isUnlocked(l.n, stars) ? 'open' : 'locked';
        return h('li', null, levelNode(l, stars[l.n] || 0, state, look));
      })));
  });

  view.append(
    learnerBar(profile, rewards, { back: '#/home' }),
    h('h1.page-title', null, '🗺️ 100 levels'),
    h('p.muted', null, `${totalStars} of 300 level stars. Every 10th level is a boss: harder, no hints, and a big star bonus!`),
    ...worlds.filter(Boolean),
  );
  // Scroll to the level being played now.
  requestAnimationFrame(() => view.querySelector('.lv-current')?.scrollIntoView({ block: 'center' }));
};
