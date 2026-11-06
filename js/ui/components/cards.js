/**
 * Home cards: today's quest (with its chest) and the parent-set goal.
 */

import { h, toast } from '../../core/dom.js';
import { describeTask, questComplete, chestStarsFor, TIER_NAMES, MAX_TIER } from '../../engine/quests.js';
import { weekProgress } from '../../engine/goals.js';
import { claimQuestChest } from '../../data/repo.js';
import { playSfx } from '../../core/sfx.js';
import { speak } from '../../core/speech.js';
import { confetti } from './celebrate.js';
import { progressBar } from './common.js';

/**
 * Daily quest card. Opening the chest adds the stars, then `onChange` re-renders.
 * @param {Object} quest
 * @param {{profileId: string, young: boolean, onChange: () => void}} ctx
 */
/** Where each kind of task can be done: one tap from the quest card. */
const TASK_LINKS = { sets: '#/practice/mix', challenge: '#/practice/challenge', perfect: '#/practice/mix', games: '#/games', correct: '#/practice/mix', stars: '#/practice/mix' };

export const questCard = (quest, { profileId, young, onChange }) => {
  const tier = quest.tier || 1;
  if (tier >= MAX_TIER && quest.claimed) {
    return h('section.quest-card.quest-all-done', null,
      h('h2', null, '👑 All quests done!'),
      h('p', null, 'You beat today\u2019s quest, bonus quest and champion quest. Come back tomorrow for new ones!'));
  }
  const done = questComplete(quest);
  const chestStars = chestStarsFor(young, tier);
  const chest = h(`button.chest${done && !quest.claimed ? '.chest-ready' : ''}${quest.claimed ? '.chest-open' : ''}`, {
    type: 'button',
    disabled: !done || quest.claimed,
    'aria-label': quest.claimed ? 'Chest opened' : done ? `Open the chest: ${chestStars} stars` : 'Finish the quest to open the chest',
    onclick: async (event) => {
      const btn = event.currentTarget;
      btn.disabled = true;
      try {
        const { stars, unlockedTier } = await claimQuestChest(profileId, young);
        btn.classList.add('chest-opening');
        playSfx('chest');
        confetti();
        speak(`Quest complete! You found ${stars} stars!`);
        toast(`Quest complete! +${stars} ⭐${unlockedTier ? ` · ${TIER_NAMES[unlockedTier]} unlocked!` : ''}`, 'success');
        setTimeout(onChange, 1400);
      } catch (error) {
        toast(error.message, 'error');
        btn.disabled = false;
      }
    },
  }, h('span.chest-icon', { 'aria-hidden': 'true' }, quest.claimed ? '🎉' : done ? '🎁' : '🔒'),
  h('small', null, quest.claimed ? 'Opened!' : done ? 'Open me!' : `${chestStars} ⭐`));

  return h(`section.quest-card.quest-tier-${tier}`, null,
    h('div.quest-head', null,
      h('div', null,
        h('h2', null, `${tier === 1 ? '🗺️' : tier === 2 ? '🚀' : '👑'} ${TIER_NAMES[tier]}`),
        tier > 1 && h('small.quest-sub', null, 'Harder goals, bigger chest!')),
      chest),
    h('ul.quest-tasks', null, quest.tasks.map((task) => {
      const { icon, text } = describeTask(task);
      const ok = task.have >= task.need;
      return h(`li${ok ? '.quest-done' : ''}`, null,
        h('span.quest-icon', { 'aria-hidden': 'true' }, ok ? '✅' : icon),
        h('span.quest-text', null,
          ok || !TASK_LINKS[task.type] ? h('span', null, text) : h('a.quest-link', { href: TASK_LINKS[task.type] }, text),
          task.need > 1 && progressBar(task.have, task.need, `${task.have} of ${task.need}`)),
        h('small.quest-count', null, `${task.have}/${task.need}`));
    })));
};

/** Parent goal card: today's sets and the week so far. Hidden when no goal is set. */
export const goalCard = (goal, sessions) => {
  const wp = weekProgress(sessions, goal);
  if (!wp.target) return null;
  const todayDone = wp.today >= wp.target;
  return h(`section.goal-card${wp.weekDone ? '.goal-won' : ''}`, null,
    h('div.goal-head', null,
      h('h2', null, '🎯 My goal'),
      h('small', null, `${wp.daysMet} of ${goal.daysPerWeek} days this week`)),
    h('p.goal-today', null, todayDone ? '✅ Done for today!' : `Today: ${Math.min(wp.today, wp.target)} of ${wp.target} practice set${wp.target === 1 ? '' : 's'}`),
    h('ol.goal-week', { 'aria-label': 'This week' }, wp.days.map((d) => h(`li${d.met ? '.met' : ''}${d.isToday ? '.today' : ''}${d.future ? '.future' : ''}`, null,
      h('span', null, d.met ? '★' : d.label.slice(0, 1)), h('small', null, d.label)))),
    goal.reward && h('p.goal-reward', null, wp.weekDone ? `🎉 You did it! Ask for: ${goal.reward}` : `🎁 Reward: ${goal.reward}`));
};
