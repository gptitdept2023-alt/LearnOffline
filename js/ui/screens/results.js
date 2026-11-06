/**
 * Results of the set just finished: score, stars, new badges, skill status.
 */

import { h } from '../../core/dom.js';
import { t } from '../../core/i18n.js';
import { getState } from '../../core/state.js';
import { speak } from '../../core/speech.js';
import { badgeById } from '../../engine/rewards.js';
import { statusOf } from '../../engine/mastery.js';
import { statusPill } from '../components/common.js';
import { playSfx } from '../../core/sfx.js';
import { getRewards } from '../../data/repo.js';
import { lookOf } from '../../engine/shop.js';
import { mascotSays, pickLine } from '../components/mascot.js';
import { confetti } from '../components/celebrate.js';

const cheer = (pct) => (pct === 100 ? 'Perfect!' : pct >= 80 ? 'Great work!' : pct >= 50 ? 'Good effort!' : 'Keep practising!');

export const renderResults = async (view) => {
  const { lastResult, indexed, profile } = getState();
  if (!lastResult) {
    view.append(h('p', null, 'No results yet.'), h('a.btn.btn-primary', { href: '#/home' }, t('continue')));
    return;
  }
  const correct = lastResult.answers.filter((a) => a.correct).length;
  const total = lastResult.answers.length;
  const pct = Math.round((correct / total) * 100);

  const look = lookOf(await getRewards(profile.profileId));
  const pipLine = pickLine(pct >= 80 ? 'great' : pct >= 50 ? 'good' : 'tryAgain');

  view.append(
    h('section.results-card', null,
      mascotSays(pipLine, { mood: pct >= 50 ? 'cheer' : 'happy', look, size: 'lg', below: true }),
      h('h1', null, `${pct === 100 ? '🏆 ' : pct >= 80 ? '🌟 ' : ''}${cheer(pct)}`),
      h('p.results-score', null, `${correct} out of ${total} correct`),
      h('p.results-stars', null, `+${lastResult.earnedStars} ⭐`),
      lastResult.questJustCompleted && h('p.game-quest', null, '🎁 Quest complete! Open your chest on the home screen.'),
      lastResult.newBadges.length > 0 && h('div.new-badges', null,
        h('h2', null, 'New badge!'),
        lastResult.newBadges.map((id) => {
          const b = badgeById(id);
          return h('div.badge.badge-earned', null, h('span.badge-icon', null, b.icon), h('strong', null, b.title), h('small', null, b.description));
        })),
      h('ul.result-skills', null, lastResult.skillIds.map((id) => {
        const skill = indexed.skillById.get(id);
        return h('li', null, h('span', null, skill?.title || id), statusPill(statusOf(lastResult.mastery.get(id))));
      })),
      h('div.results-actions', null,
        h('a.btn.btn-secondary', { href: `#/practice/${encodeURIComponent(lastResult.retry)}` }, '↻ ', 'Practise again'),
        h('a.btn.btn-primary', { href: '#/home' }, t('continue'), ' ▶'))),
  );
  if (pct >= 80 || lastResult.newBadges.length) { confetti(); playSfx('fanfare'); } else playSfx('coin');
  if (profile.readAloud || indexed.pack.young) speak(`${cheer(pct)} ${correct} out of ${total}.`);
};
