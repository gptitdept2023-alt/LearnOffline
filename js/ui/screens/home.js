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
        action('#/shop', '🛍️', 'Shop'),
        action('#/badges', '🏅', t('badges')))),
    goalOn && goalCard(profile.goal, weekSessions),
    questCard(rewards.quest, { profileId: profile.profileId, young, onChange: render }),
    h('h2.section-title', null, `${pack.title}: learning map`),
    learningMap(pack.topics, mastery, look),
  ].filter(Boolean));
};
