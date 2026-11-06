/**
 * Learner home: Daily mix plus the course map of topics.
 */

import { h } from '../../core/dom.js';
import { t } from '../../core/i18n.js';
import { getState } from '../../core/state.js';
import { getMasteryMap, getRewards } from '../../data/repo.js';
import { statusOf } from '../../engine/mastery.js';
import { learnerBar, progressBar } from '../components/common.js';

/** Count mastered skills per topic from the mastery map (no DB access in loops). */
const topicProgress = (topic, mastery) => {
  const total = topic.skills.length;
  let mastered = 0;
  let started = 0;
  for (const s of topic.skills) {
    const status = statusOf(mastery.get(s.skillId));
    if (status === 'mastered') mastered += 1;
    if (status !== 'notStarted') started += 1;
  }
  return { total, mastered, started };
};

export const renderHome = async (view) => {
  const { profile, indexed } = getState();
  const [mastery, rewards] = await Promise.all([getMasteryMap(profile.profileId), getRewards(profile.profileId)]);
  const { pack } = indexed;

  view.append(
    learnerBar(profile, rewards),
    h('h1.page-title', null, pack.title),
    h('a.mix-card', { href: '#/practice/mix' },
      h('span.mix-icon', { 'aria-hidden': 'true' }, '🎯'),
      h('span.mix-text', null, h('strong', null, t('dailyMix')), h('small', null, t('dailyMixHelp'))),
      h('span.mix-go', { 'aria-hidden': 'true' }, '▶')),
    h('h2.section-title', null, 'Topics'),
    h('ol.topic-list', null, pack.topics.map((topic, i) => {
      const p = topicProgress(topic, mastery);
      return h('li', null, h('a.topic-card', { href: `#/topic/${encodeURIComponent(topic.topicId)}` },
        h('span.topic-num', { 'aria-hidden': 'true' }, topic.icon || i + 1),
        h('span.topic-body', null,
          h('strong', null, topic.title),
          progressBar(p.mastered, p.total, `${p.mastered} of ${p.total} skills mastered`),
          h('small.muted', null, `${p.mastered} of ${p.total} skills mastered`)),
        p.mastered === p.total && h('span.topic-done', { 'aria-label': 'Complete' }, '✓')));
    })),
  );
};
