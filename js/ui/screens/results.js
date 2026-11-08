/**
 * Results of the set just finished: score, stars, new badges, skill status.
 */

import { h } from '../../core/dom.js';
import { cheer, cheerShown } from './resultsText.js';
import { t, badgeText } from '../../core/i18n.js';
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
      ? `${bossInfo.icon} ${passed ? t('youBeat', bossInfo.name) : t('bossWins', bossInfo.name)}`
      : (passed ? t('levelComplete', lv.n) : t('levelNotYet', lv.n))),
    h('p.level-stars', { 'aria-label': t('starsOf3', lv.stars) }, [0, 1, 2].map((k) => h(`span${k < lv.stars ? '.on' : ''}`, null, '★'))),
    passed
      ? lv.bonus > 0 && h('p.results-stars', null, t('levelBonus', lv.bonus))
      : h('p', null, t('needToPass', lv.needed)),
    h('div.results-actions', null,
      h('a.btn.btn-secondary', { href: `#/practice/level-${lv.n}` }, `↻ ${t('tryAgain')}`),
      passed && lv.n < LEVEL_COUNT && h('a.btn.btn-primary.btn-lg', { href: `#/practice/level-${lv.n + 1}` }, `${t('levelN', lv.n + 1)} ▶`),
      h('a.btn.btn-ghost', { href: '#/levels' }, `🗺️ ${t('allLevels')}`)));
};


export const renderResults = async (view) => {
  const { lastResult, indexed, profile } = getState();
  if (!lastResult) {
    view.append(h('p', null, t('noResults')), h('a.btn.btn-primary', { href: '#/home' }, t('continue')));
    return;
  }
  const correct = lastResult.answers.filter((a) => a.correct).length;
  const total = lastResult.answers.length;
  const pct = Math.round((correct / total) * 100);

  const look = lookOf(await getRewards(profile.profileId), Boolean(indexed.pack.young));
  const lv = lastResult.level;
  const pipLine = lv?.boss && lv.stars > 0 ? t('bossBeatenPip') : pickLine(pct >= 80 ? 'great' : pct >= 50 ? 'good' : 'tryAgain');

  view.append(
    h('section.results-card', null,
      mascotSays(pipLine, { mood: pct >= 50 ? 'cheer' : 'happy', look, size: 'lg', below: true }),
      h('h1', null, lv?.boss && lv.stars > 0 ? t('bossBeaten') : `${pct === 100 ? '🏆 ' : pct >= 80 ? '🌟 ' : ''}${cheerShown(pct)}`),
      h('p.results-score', null, t('scoreOutOf', correct, total)),
      lastResult.level && levelBlock(lastResult.level),
      h('p.results-stars', null, `+${lastResult.earnedStars} ⭐`),
      lastResult.questJustCompleted && h('p.game-quest', null, t('questDoneOpenChest')),
      lastResult.newBadges.length > 0 && h('div.new-badges', null,
        h('h2', null, t('newBadge')),
        lastResult.newBadges.map((id) => {
          const b = badgeById(id);
          const { title, description } = badgeText(b);
          return h('div.badge.badge-earned', null, h('span.badge-icon', null, b.icon), h('strong', null, title), h('small', null, description));
        })),
      h('ul.result-skills', null, lastResult.skillIds.map((id) => {
        const skill = indexed.skillById.get(id);
        return h('li', null, h('span', null, skill?.title || id), statusPill(statusOf(lastResult.mastery.get(id))));
      })),
      h('div.results-actions', null,
        h('a.btn.btn-secondary', { href: `#/practice/${encodeURIComponent(lastResult.retry)}` }, '↻ ', t('practiseAgain')),
        h('a.btn.btn-primary', { href: '#/home' }, t('continue'), ' ▶'))),
  );
  if (lv?.boss && lv.stars > 0) { confetti({ count: 140 }); playSfx('fanfare'); setTimeout(() => confetti({ count: 80 }), 700); } else if (pct >= 80 || lastResult.newBadges.length) { confetti(); playSfx('fanfare'); } else playSfx('coin');
  if (profile.readAloud || indexed.pack.young) speak(`${cheer(pct)} ${correct} out of ${total}.`);
};
