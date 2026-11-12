/**
 * Tips & Tricks: a list of mental-maths tricks (#/tricks), and one trick
 * (#/trick/<id>): a worked example to watch, then a short drill where every
 * question suits the trick. #/trick/mix drills every trick open to the learner.
 *
 * Scores are saved like game scores (rewards.gameBest['trick-<id>']), so they
 * already sync between devices, travel with backups and count for the quest.
 * Questions and rules live in js/engine/tricks.js.
 */

import { h, mount, toast } from '../../core/dom.js';
import { render } from '../../core/router.js';
import { getState } from '../../core/state.js';
import { speak, stopSpeaking } from '../../core/speech.js';
import { playSfx } from '../../core/sfx.js';
import { getRewards, recordActivity } from '../../data/repo.js';
import {
  MIX_ID, TRICK_GAME_PREFIX, DRILL_LENGTH, trickById, tricksForGrade, gradeOfLevel,
  drillRound, exampleOf, trickStars,
} from '../../engine/tricks.js';
import { lookOf } from '../../engine/shop.js';
import { learnerBar } from '../components/common.js';
import { mascotSays, pickLine } from '../components/mascot.js';
import { methodPlayer } from '../components/interactive.js';
import { renderVisual } from '../components/visuals.js';
import { confetti } from '../components/celebrate.js';

/** Everything a tricks screen needs about the active learner. */
const learnerContext = async () => {
  const { profile, indexed } = getState();
  const young = Boolean(indexed.pack.young);
  const rewards = await getRewards(profile.profileId);
  return {
    profile,
    rewards,
    young,
    grade: gradeOfLevel(indexed.entry?.level),
    levelName: indexed.entry?.levelName || 'your grade',
    look: lookOf(rewards, young),
    readAloud: young || Boolean(profile.readAloud),
  };
};

const bestOf = (rewards, id) => rewards.gameBest?.[`${TRICK_GAME_PREFIX}${id}`] || 0;

/* ------------------------------------------------------------------ */
/* List of tricks                                                      */
/* ------------------------------------------------------------------ */

const trickCard = (trick, rewards, total) => {
  const best = bestOf(rewards, trick.id);
  return h('a.trick-card', { href: `#/trick/${trick.id}` },
    h('span.trick-card-icon', { 'aria-hidden': 'true' }, trick.icon),
    h('span.trick-card-body', null,
      h('strong', null, trick.title),
      h('small', null, trick.idea)),
    h(`span.trick-best${best >= total ? '.trick-best-full' : ''}`, { title: 'Best score' }, best ? `${best}/${total}` : 'New'));
};

const section = (title, tricks, rewards, total) => tricks.length > 0 && h('section.trick-section', null,
  h('h2.section-title', null, title),
  h('div.trick-list', null, tricks.map((tr) => trickCard(tr, rewards, total))));

export const renderTricks = async (view) => {
  const ctx = await learnerContext();
  const { mine, newHere, stretch } = tricksForGrade(ctx.grade);
  const earlier = mine.filter((tr) => !newHere.includes(tr)).reverse(); // newest first
  const total = ctx.young ? DRILL_LENGTH.young : DRILL_LENGTH.older;
  const intro = ctx.young
    ? 'Clever ways to add in your head. Watch a trick, then try it!'
    : 'Clever ways to work things out in your head. Watch the trick, then try it!';

  view.classList.toggle('young', ctx.young);
  view.append(...[
    learnerBar(ctx.profile, ctx.rewards, { back: '#/home' }),
    h('h1.page-title', null, '💡 Tips & Tricks'),
    mascotSays(intro, { mood: 'happy', look: ctx.look, size: 'md' }),
    mine.length >= 2 && h('a.game-card.trick-mix', { href: `#/trick/${MIX_ID}` },
      h('span.game-card-icon', { 'aria-hidden': 'true' }, '🎲'),
      h('span.game-card-body', null, h('strong', null, 'Trick mix'),
        h('small', null, 'A bit of every trick you know, all mixed up!'),
        h('small.game-best', null, `Best: ${bestOf(ctx.rewards, MIX_ID)}/${total}`)),
      h('span.mix-go', { 'aria-hidden': 'true' }, '▶')),
    section(`New for ${ctx.levelName}`, newHere, ctx.rewards, total),
    section('From earlier grades', earlier, ctx.rewards, total),
    section('Try next', stretch, ctx.rewards, total),
  ].filter(Boolean));
  if (ctx.young) speak(intro);
};

/* ------------------------------------------------------------------ */
/* One trick: example, then drill                                      */
/* ------------------------------------------------------------------ */

/** The steps of a trick, all at once (after a wrong answer, or on "Show the trick"). */
const stepsList = (steps) => h('ol.method-steps.trick-steps', null, steps.map((st, i) => h('li.method-step', null,
  h('span.method-num', { 'aria-hidden': 'true' }, i + 1),
  h('div.method-body', null, h('p', null, st.text), renderVisual(st.visual)))));

/** Watch the trick on one example, as many examples as the child likes. */
const learnPanel = (stage, trick, ctx, onTry) => {
  const example = exampleOf(trick.id);
  mount(stage, h('section.game-panel.trick-learn', null,
    mascotSays(trick.idea, { mood: 'happy', look: ctx.look, size: 'md' }),
    h('p.trick-example', null, 'Example: ', h('strong', null, example.prompt.includes('?') ? example.prompt : `${example.prompt} = ?`)),
    methodPlayer({ name: trick.title, steps: example.steps }, { autoSpeak: ctx.readAloud, compact: true }),
    h('div.results-actions', null,
      h('button.btn.btn-secondary', { type: 'button', onclick: () => learnPanel(stage, trick, ctx, onTry) }, '↻ Another example'),
      h('button.btn.btn-primary.btn-lg', { type: 'button', onclick: onTry }, '▶ Try it'))));
  if (ctx.readAloud) speak(trick.idea);
};

/** Save the score and show the end of the drill. */
const finishDrill = async (stage, { id, score, total, ctx }) => {
  stopSpeaking();
  const stars = trickStars(score);
  let result = { earnedStars: stars, newBest: false };
  try {
    result = await recordActivity(ctx.profile.profileId, { kind: 'game', gameId: `${TRICK_GAME_PREFIX}${id}`, score, stars }, ctx.young);
  } catch (error) {
    console.error(error);
    toast(`Could not save your score: ${error.message}`, 'error');
  }
  const perfect = score === total;
  const line = perfect ? 'Every one right! You are a trick master!' : result.newBest ? `New best: ${score}!` : score > 0 ? pickLine('good', 'en') : pickLine('tryAgain', 'en');
  if (perfect || result.newBest) { confetti(); playSfx('fanfare'); } else playSfx('coin');
  speak(`${line} You got ${score} out of ${total}.`);
  mount(stage, h('section.game-panel.game-over', null,
    mascotSays(line, { mood: score * 2 >= total ? 'cheer' : 'happy', look: ctx.look, size: 'lg' }),
    h('p.game-score-big', null, `${score}/${total}`),
    h('p.results-stars', null, `+${result.earnedStars} ⭐`),
    result.questJustCompleted && h('p.game-quest', null, '🎁 Quest complete! Open your chest on the home screen.'),
    h('div.results-actions', null,
      h('a.btn.btn-secondary', { href: '#/tricks' }, 'More tricks'),
      h('button.btn.btn-primary.btn-lg', { type: 'button', onclick: () => render() }, '↻ Play again'))));
};

/**
 * The drill: a fixed number of questions. A right answer without peeking at
 * the trick scores 1. A wrong answer shows the right one and the trick's steps.
 */
const runDrill = (stage, id, ctx) => {
  const total = ctx.young ? DRILL_LENGTH.young : DRILL_LENGTH.older;
  let index = 0;
  let score = 0;
  let questions = [];

  const show = () => {
    // Later questions start from a timer: stop if the child has left. (The first one runs before the screen is shown.)
    if (index > 0 && !stage.isConnected) return;
    if (index >= total) { finishDrill(stage, { id, score, total, ctx }); return; }
    // A fresh round each play, made up front so no question comes twice.
    if (index === 0) questions = drillRound(id, ctx.grade, total);
    const q = questions[index];
    let peeked = false;
    let done = false;
    const feedback = h('p.check-feedback', { 'aria-live': 'polite' });
    const help = h('div.trick-help');
    const peekBtn = h('button.btn.btn-ghost.btn-sm', {
      type: 'button',
      onclick: () => {
        peeked = true;
        peekBtn.remove();
        mount(help, stepsList(q.steps));
      },
    }, '💡 Show the trick');
    const nextBtn = h('button.btn.btn-primary', { type: 'button', hidden: true, onclick: () => { index += 1; show(); } }, 'Next ▶');

    const answer = (raw, choiceEl) => {
      if (done) return;
      const value = Number(String(raw).replace(/[,\s]/g, ''));
      if (String(raw).trim() === '' || Number.isNaN(value)) { feedback.textContent = 'Type a number first.'; return; }
      done = true;
      peekBtn.remove();
      if (value === q.answer) {
        if (!peeked) score += 1;
        choiceEl?.classList.add('choice-right');
        feedback.textContent = peeked ? 'Right! Next time, try it without peeking.' : pickLine('correct', 'en');
        playSfx('correct');
        if (ctx.readAloud) speak('Yes!');
        setTimeout(() => { index += 1; show(); }, 1000);
        return;
      }
      choiceEl?.classList.add('choice-wrong');
      feedback.textContent = `Not quite. ${q.reveal}. Here is the trick:`;
      playSfx('wrong');
      mount(help, stepsList(q.steps));
      nextBtn.hidden = false;
      nextBtn.focus();
      if (ctx.readAloud) speak(q.steps.map((st) => st.text).join(' '));
    };

    let input;
    if (q.choices) {
      input = h('div.choices', null, q.choices.map((c) => h('button.choice', {
        type: 'button',
        onclick: (event) => answer(c, event.currentTarget),
      }, String(c))));
    } else {
      const field = h('input.answer-input', { inputmode: 'numeric', autocomplete: 'off', 'aria-label': 'Your answer' });
      input = h('form.answer-form.trick-answer', { onsubmit: (e) => { e.preventDefault(); answer(field.value); } },
        field, h('button.btn.btn-primary', { type: 'submit' }, 'Check'));
      setTimeout(() => field.focus(), 50);
    }

    mount(stage, h('section.game-panel.trick-drill', null,
      h('div.game-hud', null,
        h('span', null, `Question ${index + 1} of ${total}`),
        h('span', null, 'Score ', h('strong', null, score))),
      id === MIX_ID && h('p.trick-tag', null, `💡 ${q.trickTitle}`),
      h(`p.game-prompt${q.prompt.length > 16 ? '.trick-prompt-long' : ''}`, null, q.prompt.includes('?') ? q.prompt : `${q.prompt} = ?`),
      input,
      feedback,
      peekBtn,
      help,
      nextBtn));
    if (ctx.readAloud) speak(q.say);
  };

  return show;
};

export const renderTrick = async (view, id) => {
  const trick = id === MIX_ID ? null : trickById(id);
  if (id !== MIX_ID && !trick) throw new Error('That trick was not found.');
  const ctx = await learnerContext();
  const stage = h('div.game-stage');
  const drill = runDrill(stage, id, ctx);

  view.classList.toggle('young', ctx.young);
  view.append(
    learnerBar(ctx.profile, ctx.rewards, { back: '#/tricks' }),
    h('h1.page-title', null, trick ? `${trick.icon} ${trick.title}` : '🎲 Trick mix'),
    stage,
  );
  if (trick) learnPanel(stage, trick, ctx, drill);
  else drill();
};
