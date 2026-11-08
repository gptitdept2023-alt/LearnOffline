/**
 * A topic: its skills, each with a lesson and practice.
 */

import { h } from '../../core/dom.js';
import { t } from '../../core/i18n.js';
import { getState } from '../../core/state.js';
import { getMasteryMap, getRewards } from '../../data/repo.js';
import { statusOf } from '../../engine/mastery.js';
import { learnerBar, statusPill } from '../components/common.js';
import { skillHasGuided } from './lesson.js';

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
        rec && h('small.muted', null, t('scoreLine', Math.round(rec.score), rec.attempts)),
        // The learning path: watch and do, try with help, then practise alone.
        h('ol.skill-path', null,
          skill.lesson && h('li', null, h('a.path-step.path-learn', { href: `#/lesson/${id}` }, h('span.path-icon', null, '📖'), h('span', null, h('strong', null, t('learn')), h('small', null, t('learnHelp'))))),
          skillHasGuided(skill) && h('li', null, h('a.path-step.path-guided', { href: `#/guided/${id}` }, h('span.path-icon', null, '🧭'), h('span', null, h('strong', null, t('tryWithHelp')), h('small', null, t('tryWithHelpHelp'))))),
          h('li', null, h('a.path-step.path-practice', { href: `#/practice/${id}` }, h('span.path-icon', null, '✏️'), h('span', null, h('strong', null, t('practice')), h('small', null, t('onMyOwn')))))));
    })),
  );
};
