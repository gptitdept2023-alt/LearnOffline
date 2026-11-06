/**
 * A topic: its skills, each with a lesson and practice.
 */

import { h } from '../../core/dom.js';
import { t } from '../../core/i18n.js';
import { getState } from '../../core/state.js';
import { getMasteryMap, getRewards } from '../../data/repo.js';
import { statusOf } from '../../engine/mastery.js';
import { learnerBar, statusPill } from '../components/common.js';

export const renderTopic = async (view, topicId) => {
  const { profile, indexed } = getState();
  const topic = indexed.pack.topics.find((tp) => tp.topicId === topicId);
  if (!topic) throw new Error('That topic was not found.');
  const [mastery, rewards] = await Promise.all([getMasteryMap(profile.profileId), getRewards(profile.profileId)]);

  view.append(
    learnerBar(profile, rewards, { back: '#/home' }),
    h('h1.page-title', null, topic.title),
    topic.summary && h('p.muted', null, topic.summary),
    h('ul.skill-list', null, topic.skills.map((skill) => {
      const rec = mastery.get(skill.skillId);
      const status = statusOf(rec);
      const id = encodeURIComponent(skill.skillId);
      return h('li.skill-card', null,
        h('div.skill-head', null,
          h('strong', null, skill.title),
          statusPill(status)),
        rec && h('small.muted', null, `Score ${Math.round(rec.score)} · ${rec.attempts} questions answered`),
        h('div.skill-actions', null,
          skill.lesson && h('a.btn.btn-secondary', { href: `#/lesson/${id}` }, '📖 ', t('lesson')),
          h('a.btn.btn-primary', { href: `#/practice/${id}` }, '✏️ ', t('practice'))));
    })),
  );
};
