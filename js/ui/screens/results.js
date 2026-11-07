/**
 * Results of the set just finished: score, stars, new badges, skill status.
 */

import { h } from '../../core/dom.js';
import { cheer } from './resultsText.js';
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
import { WORLDS, LEVEL_COUNT } from '../../engine/levels.js';

/** Level outcome: stars, boss win, next level. */
const levelBlock = (lv) => {
  const passed = lv.stars > 0;
  const bossInfo = lv.boss ? WORLDS[lv.world - 1].boss : null;
  return h(`div.level-result${lv.boss ? '.level-result-boss' : ''}${passed ? '' : '.level-result-fail'}`, null,
    h('p.level-result-title', null, lv.boss
      ? (passed ? `${bossInfo.icon} You beat ${bossInfo.name}!` : `${bossInfo.icon} ${bossInfo.name} wins this time!`)
      : (passed ? `Level ${lv.n} complete!` : `Level ${lv.n}: not yet`)),
    h('p.level-stars', { 'aria-label': `${lv.stars} of 3 stars` }, [0, 1, 2].map((k) => h(`span${k < lv.stars ? '.on' : ''}`, null, '★'))),
    passed
      ? lv.bonus > 0 && h('p.results-stars', null, `Level bonus +${lv.bonus} ⭐`)
      : h('p', null, `Get ${lv.needed} right to pass. You can do it!`),
    h('div.results-actions', null,
      h('a.btn.btn-secondary', { href: `#/practice/level-${lv.n}` }, '↻ Try again'),
      passed && lv.n < LEVEL_COUNT && h('a.btn.btn-primary.btn-lg', { href: `#/practice/level-${lv.n + 1}` }, `Level ${lv.n + 1} ▶`),
      h('a.btn.btn-ghost', { href: '#/levels' }, '🗺️ All levels')));
};


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
  const lv = lastResult.level;
  const pipLine = lv?.boss && lv.stars > 0 ? 'We beat the boss! You\u2019re amazing!' : pickLine(pct >= 80 ? 'great' : pct >= 50 ? 'good' : 'tryAgain');

  view.append(
    h('section.results-card', null,
      mascotSays(pipLine, { mood: pct >= 50 ? 'cheer' : 'happy', look, size: 'lg', below: true }),
      h('h1', null, lv?.boss && lv.stars > 0 ? '🏆 Boss beaten!' : `${pct === 100 ? '🏆 ' : pct >= 80 ? '🌟 ' : ''}${cheer(pct)}`),
      h('p.results-score', null, `${correct} out of ${total} correct`),
      lastResult.level && levelBlock(lastResult.level),
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
  if (lv?.boss && lv.stars > 0) { confetti({ count: 140 }); playSfx('fanfare'); setTimeout(() => confetti({ count: 80 }), 700); } else if (pct >= 80 || lastResult.newBadges.length) { confetti(); playSfx('fanfare'); } else playSfx('coin');
  if (profile.readAloud || indexed.pack.young) speak(`${cheer(pct)} ${correct} out of ${total}.`);
};
