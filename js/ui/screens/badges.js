/**
 * Badge collection: earned badges in colour, the rest locked with how to earn them.
 */

import { h } from '../../core/dom.js';
import { t } from '../../core/i18n.js';
import { getState } from '../../core/state.js';
import { getRewards } from '../../data/repo.js';
import { BADGES } from '../../engine/rewards.js';
import { learnerBar } from '../components/common.js';

export const renderBadges = async (view) => {
  const { profile } = getState();
  const rewards = await getRewards(profile.profileId);
  const owned = new Set(rewards.badges);
  view.append(
    learnerBar(profile, rewards, { back: '#/home' }),
    h('h1.page-title', null, t('badges')),
    h('div.stat-row', null,
      h('div.stat', null, h('strong', null, rewards.stars), h('small', null, t('stars'))),
      h('div.stat', null, h('strong', null, rewards.bestStreak), h('small', null, 'Best streak')),
      h('div.stat', null, h('strong', null, rewards.setsCompleted), h('small', null, 'Sets done'))),
    h('div.badge-grid', null, BADGES.map((b) => h(`div.badge${owned.has(b.id) ? '.badge-earned' : '.badge-locked'}`, null,
      h('span.badge-icon', { 'aria-hidden': 'true' }, owned.has(b.id) ? b.icon : '🔒'),
      h('strong', null, b.title),
      h('small', null, b.description)))),
  );
};
