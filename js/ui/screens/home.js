/**
 * Learner home: Pip and today's greeting, quick actions (Daily mix, games,
 * shop, badges), the parent's goal, today's quest and the learning map.
 */

import { h, toast, withLoading } from '../../core/dom.js';
import { t } from '../../core/i18n.js';
import { render } from '../../core/router.js';
import { getState, activateProfile } from '../../core/state.js';
import { getMasteryMap, getRewardsWithQuest, getWeekSessions, saveProfile } from '../../data/repo.js';
import { subjectsAtLevel } from '../../data/packs.js';
import { lookOf } from '../../engine/shop.js';
import { learnerBar } from '../components/common.js';
import { mascotSays, greeting } from '../components/mascot.js';
import { questCard, goalCard } from '../components/cards.js';
import { learningMap } from '../components/map.js';
import { buildLevels, currentLevel, WORLDS, levelsEnabled } from '../../engine/levels.js';

/** "Level 12 · Sandy Beach ▶" card: one tap to the next level. */
const levelCard = (indexed, rewards) => {
  if (!levelsEnabled(indexed)) return null;
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
        h('small', null, t('worldName', level.world, world.name)),
        h('strong', null, level.boss ? t('bossLevel', n, level.title) : t('levelN', n)),
        h('small', null, level.boss ? t('bossCardHelp') : level.title)),
      h('span.mix-go', { 'aria-hidden': 'true' }, '▶')),
    h('a.level-card-all', { href: '#/levels' }, t('allLevelsPassed', done)));
};

/**
 * Math / English tabs. One tap switches this learner's subject; it is saved,
 * so the app opens on the same subject next time. Progress in each subject is
 * kept separately (skills have their own ids).
 */
const subjectTabs = (profile, subjects) => {
  if (subjects.length < 2) return null;
  const choose = async (packId) => {
    if (packId === profile.packId) return;
    try {
      await withLoading(async () => {
        await saveProfile({ ...profile, packId });
        await activateProfile(profile.profileId);
      }, t('opening'));
      render();
    } catch (error) {
      toast(error.message, 'error');
    }
  };
  return h('nav.subject-tabs', { 'aria-label': t('subject') }, subjects.map((p) => {
    const on = p.packId === profile.packId;
    return h(`button.subject-tab${on ? '.active' : ''}`, { type: 'button', 'aria-pressed': String(on), onclick: () => choose(p.packId) },
      h('span.subject-tab-icon', { 'aria-hidden': 'true' }, p.icon || '📘'), h('span', null, p.subjectName || p.title));
  }));
};

const action = (href, icon, label, cls = '') => h(`a.home-action${cls}`, { href },
  h('span.home-action-icon', { 'aria-hidden': 'true' }, icon), h('span', null, label));

export const renderHome = async (view) => {
  const { profile, indexed } = getState();
  const young = Boolean(indexed.pack.young);
  const goalOn = profile.goal?.setsPerDay > 0;
  const tricksOn = indexed.entry?.subject === 'math';
  const [mastery, rewards, weekSessions, subjects] = await Promise.all([
    getMasteryMap(profile.profileId),
    getRewardsWithQuest(profile.profileId, young),
    goalOn ? getWeekSessions(profile.profileId) : [],
    subjectsAtLevel(profile.packId),
  ]);
  const look = lookOf(rewards, young);
  const { pack } = indexed;

  view.classList.toggle('young', young);
  // Native append() would print false/null, so optional cards are filtered out.
  view.append(...[
    learnerBar(profile, rewards),
    subjectTabs(profile, subjects),
    h(`section.home-hero.scene-${look.scene || 'default'}`, null,
      mascotSays(greeting(profile.name), { mood: 'happy', look, size: 'lg' }),
      h(`div.home-actions${tricksOn ? '.home-actions-tricks' : ''}`, null,
        action('#/practice/mix', '🎯', t('dailyMix'), '.home-action-main'),
        // Math tips & tricks sit beside the Daily mix, so the four small tiles stay one row.
        tricksOn && action('#/tricks', '💡', t('tricks'), '.home-action-tricks'),
        action('#/games', '🎮', t('games')),
        action('#/practice/challenge', '🚀', t('challenge')),
        action('#/shop', '🛍️', t('shop')),
        action('#/badges', '🏅', t('badges')))),
    levelCard(indexed, rewards),
    goalOn && goalCard(profile.goal, weekSessions),
    questCard(rewards.quest, { profileId: profile.profileId, young, onChange: render }),
    h('h2.section-title', null, t('topicsOf', pack.title)),
    learningMap(pack.topics, mastery, look),
  ].filter(Boolean));
};
