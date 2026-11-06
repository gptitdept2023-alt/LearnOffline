/**
 * Learner home: Pip and today's greeting, quick actions (Daily mix, games,
 * shop, badges), the parent's goal, today's quest and the learning map.
 */

import { h } from '../../core/dom.js';
import { t } from '../../core/i18n.js';
import { render } from '../../core/router.js';
import { getState } from '../../core/state.js';
import { getMasteryMap, getRewardsWithQuest, getWeekSessions } from '../../data/repo.js';
import { lookOf } from '../../engine/shop.js';
import { learnerBar } from '../components/common.js';
import { mascotSays, greeting } from '../components/mascot.js';
import { questCard, goalCard } from '../components/cards.js';
import { learningMap } from '../components/map.js';
import { buildLevels, currentLevel, WORLDS } from '../../engine/levels.js';

/** "Level 12 · Sandy Beach ▶" card: one tap to the next level. */
const levelCard = (indexed, rewards) => {
  const levels = buildLevels(indexed);
  if (!levels.length) return null;
  const n = currentLevel(rewards.levels);
  const level = levels[n - 1];
  const world = WORLDS[level.world - 1];
  const done = Object.values(rewards.levels || {}).filter((s) => s > 0).length;
  return h(`section.level-card${level.boss ? '.level-card-boss' : ''}`, null,
    h('a.level-card-main', { href: `#/practice/level-${n}` },
      h('span.level-card-icon', { 'aria-hidden': 'true' }, level.boss ? world.boss.icon : world.icon),
      h('span.level-card-text', null,
        h('small', null, `World ${level.world}: ${world.name}`),
        h('strong', null, level.boss ? `Boss level ${n}: ${level.title}` : `Level ${n}`),
        h('small', null, level.boss ? 'Harder questions, no hints, big bonus!' : level.title)),
      h('span.mix-go', { 'aria-hidden': 'true' }, '▶')),
    h('a.level-card-all', { href: '#/levels' }, `🗺️ All 100 levels · ${done} passed`));
};

const action = (href, icon, label, cls = '') => h(`a.home-action${cls}`, { href },
  h('span.home-action-icon', { 'aria-hidden': 'true' }, icon), h('span', null, label));

export const renderHome = async (view) => {
  const { profile, indexed } = getState();
  const young = Boolean(indexed.pack.young);
  const goalOn = profile.goal?.setsPerDay > 0;
  const [mastery, rewards, weekSessions] = await Promise.all([
    getMasteryMap(profile.profileId),
    getRewardsWithQuest(profile.profileId, young),
    goalOn ? getWeekSessions(profile.profileId) : [],
  ]);
  const look = lookOf(rewards);
  const { pack } = indexed;

  view.classList.toggle('young', young);
  // Native append() would print false/null, so optional cards are filtered out.
  view.append(...[
    learnerBar(profile, rewards),
    h(`section.home-hero.scene-${look.scene || 'default'}`, null,
      mascotSays(greeting(profile.name), { mood: 'happy', look, size: 'lg' }),
      h('div.home-actions', null,
        action('#/practice/mix', '🎯', t('dailyMix'), '.home-action-main'),
        action('#/games', '🎮', 'Games'),
        action('#/practice/challenge', '🚀', 'Challenge'),
        action('#/shop', '🛍️', 'Shop'),
        action('#/badges', '🏅', t('badges')))),
    levelCard(indexed, rewards),
    goalOn && goalCard(profile.goal, weekSessions),
    questCard(rewards.quest, { profileId: profile.profileId, young, onChange: render }),
    h('h2.section-title', null, `${pack.title}: topics`),
    learningMap(pack.topics, mastery, look),
  ].filter(Boolean));
};
