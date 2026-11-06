/**
 * Quick games: a hub (#/games) and two games (#/game/speed, #/game/pop).
 * Games are short, give a few stars (capped, so practice stays the main way
 * to earn) and count for the streak and the daily quest.
 */

import { h, mount, toast } from '../../core/dom.js';
import { render } from '../../core/router.js';
import { getState } from '../../core/state.js';
import { speak, stopSpeaking } from '../../core/speech.js';
import { playSfx } from '../../core/sfx.js';
import { getRewards, recordActivity } from '../../data/repo.js';
import { GAMES, SPEED_SECONDS, POP_ROUNDS, gameStars, speedQuestion, popRound } from '../../engine/games.js';
import { lookOf } from '../../engine/shop.js';
import { learnerBar } from '../components/common.js';
import { mascotSays, pickLine } from '../components/mascot.js';
import { confetti } from '../components/celebrate.js';

/* ------------------------------------------------------------------ */
/* Hub                                                                 */
/* ------------------------------------------------------------------ */

export const renderGames = async (view) => {
  const { profile, indexed } = getState();
  const rewards = await getRewards(profile.profileId);
  view.classList.toggle('young', Boolean(indexed.pack.young));
  view.append(
    learnerBar(profile, rewards, { back: '#/home' }),
    h('h1.page-title', null, '🎮 Games'),
    h('div.game-list', null, GAMES.map((g) => h(`a.game-card.game-${g.id}`, { href: `#/game/${g.id}` },
      h('span.game-card-icon', { 'aria-hidden': 'true' }, g.icon),
      h('span.game-card-body', null, h('strong', null, g.title), h('small', null, g.blurb),
        h('small.game-best', null, `Best: ${rewards.gameBest?.[g.id] || 0}`)),
      h('span.mix-go', { 'aria-hidden': 'true' }, '▶')))),
  );
};

/* ------------------------------------------------------------------ */
/* Shared: start and end screens                                       */
/* ------------------------------------------------------------------ */

const startPanel = (game, best, look, onStart) => h('section.game-panel', null,
  mascotSays(game.blurb, { mood: 'cheer', look, size: 'md' }),
  h('p.game-best-big', null, `Your best: ${best}`),
  h('button.btn.btn-primary.btn-lg.game-start', { type: 'button', autofocus: true, onclick: onStart }, '▶ Start'));

/** Save the result, then show the end screen. */
const finishGame = async (stage, { game, score, profile, young, look }) => {
  stopSpeaking();
  const stars = gameStars(game.id, score);
  let result = { earnedStars: stars, newBest: false };
  try {
    result = await recordActivity(profile.profileId, { kind: 'game', gameId: game.id, score, stars }, young);
  } catch (error) {
    console.error(error);
    toast(`Could not save your score: ${error.message}`, 'error');
  }
  const line = result.newBest ? `New best: ${score}!` : score > 0 ? pickLine('good') : pickLine('tryAgain');
  if (result.newBest || score >= 10) { confetti(); playSfx('fanfare'); } else playSfx('coin');
  speak(`${line} You scored ${score}.`);
  mount(stage, h('section.game-panel.game-over', null,
    mascotSays(line, { mood: result.newBest || score >= 5 ? 'cheer' : 'happy', look, size: 'lg' }),
    h('p.game-score-big', null, score),
    h('p.results-stars', null, `+${result.earnedStars} ⭐`),
    result.questJustCompleted && h('p.game-quest', null, '🎁 Quest complete! Open your chest on the home screen.'),
    h('div.results-actions', null,
      h('a.btn.btn-secondary', { href: '#/games' }, 'More games'),
      h('button.btn.btn-primary.btn-lg', { type: 'button', onclick: () => render() }, '↻ Play again'))));
};

/* ------------------------------------------------------------------ */
/* Speed Round                                                         */
/* ------------------------------------------------------------------ */

const speedRound = (stage, ctx) => {
  const seconds = ctx.young ? SPEED_SECONDS.young : SPEED_SECONDS.older;
  let score = 0;
  let combo = 0;
  let typed = '';
  let question = null;
  let locked = false;
  let endsAt = 0;
  let timer = 0;

  const timeBar = h('div.game-time', { role: 'timer' }, h('div.game-time-fill'));
  const scoreEl = h('strong.game-score', { 'aria-live': 'polite' }, '0');
  const comboEl = h('span.game-combo');
  const promptEl = h('p.game-prompt');
  const answerEl = h('div.game-answer', { 'aria-live': 'polite' });

  const show = () => {
    question = speedQuestion(ctx.young);
    typed = '';
    locked = false;
    promptEl.textContent = `${question.prompt} =`;
    answerEl.textContent = '';
    answerEl.className = 'game-answer';
    if (ctx.young) speak(`${question.prompt} = ?`);
  };

  const check = () => {
    if (Number(typed) === question.answer) {
      score += 1;
      combo += 1;
      scoreEl.textContent = String(score);
      comboEl.textContent = combo >= 3 ? `🔥 ${combo}` : '';
      answerEl.classList.add('right');
      playSfx('correct');
      locked = true;
      setTimeout(show, 250);
    } else {
      combo = 0;
      comboEl.textContent = '';
      answerEl.classList.add('wrong');
      answerEl.textContent = `${typed} → ${question.answer}`;
      playSfx('wrong');
      locked = true;
      setTimeout(show, 900);
    }
  };

  const press = (key) => {
    if (locked || !question) return;
    if (key === 'back') typed = typed.slice(0, -1);
    else if (/^\d$/.test(key) && typed.length < 4) typed += key;
    answerEl.textContent = typed;
    // Check as soon as enough digits are typed: no "Enter" needed, keeps it fast.
    if (typed.length >= String(question.answer).length) check();
  };

  const onKey = (event) => {
    if (/^\d$/.test(event.key)) press(event.key);
    else if (event.key === 'Backspace') press('back');
  };

  const stop = () => {
    clearInterval(timer);
    window.removeEventListener('keydown', onKey);
  };

  const tick = () => {
    if (!stage.isConnected) { stop(); return; }   // child left the screen
    const left = Math.max(0, endsAt - Date.now());
    timeBar.style.setProperty('--pct', `${(left / (seconds * 1000)) * 100}%`);
    timeBar.classList.toggle('game-time-low', left < 10_000);
    if (left <= 0) {
      stop();
      finishGame(stage, { ...ctx, score });
    }
  };

  const pad = h('div.numpad', null,
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'back', '0'].map((k) => h(`button.numpad-key${k === 'back' ? '.numpad-back' : ''}`, {
      type: 'button',
      'aria-label': k === 'back' ? 'Delete' : k,
      onclick: () => press(k),
    }, k === 'back' ? '⌫' : k)));

  const play = () => {
    mount(stage, h('section.game-panel.game-play', null,
      h('div.game-hud', null, timeBar, h('span', null, 'Score ', scoreEl), comboEl),
      promptEl, answerEl, pad));
    endsAt = Date.now() + seconds * 1000;
    timer = setInterval(tick, 200);
    window.addEventListener('keydown', onKey);
    show();
  };

  return play;
};

/* ------------------------------------------------------------------ */
/* Pop the Balloon                                                     */
/* ------------------------------------------------------------------ */

const popBalloons = (stage, ctx) => {
  let round = 0;
  let score = 0;

  const showRound = () => {
    if (!stage.isConnected) return;
    if (round >= POP_ROUNDS) { finishGame(stage, { ...ctx, score }); return; }
    const r = popRound(ctx.young);
    let misses = 0;
    let done = false;
    const balloons = r.choices.map((n, i) => h('button.balloon', {
      type: 'button',
      'aria-label': `Balloon ${n}`,
      style: { '--i': i, '--speed': `${5 + ((i * 7 + round) % 4)}s`, '--hue': `${(i * 83 + round * 37) % 360}` },
      onclick: (event) => {
        if (done) return;
        const el = event.currentTarget;
        if (n === r.answer) {
          done = true;
          if (misses === 0) score += 1;
          el.classList.add('popped');
          playSfx('pop');
          setTimeout(() => playSfx('correct'), 120);
          status.textContent = pickLine('correct');
          round += 1;
          setTimeout(showRound, 900);
        } else {
          misses += 1;
          el.classList.add('wobble');
          el.disabled = true;
          playSfx('wrong');
          status.textContent = 'Not that one. Try again!';
        }
      },
    }, h('span.balloon-num', null, n)));
    const status = h('p.game-status', { 'aria-live': 'polite' });
    mount(stage, h('section.game-panel.game-pop', null,
      h('div.game-hud', null, h('span', null, `Round ${round + 1} of ${POP_ROUNDS}`), h('span', null, 'Score ', h('strong', null, score))),
      h('p.game-prompt', null, r.prompt),
      r.picture && h('div.visual.visual-pictures', { role: 'img', 'aria-label': `${r.picture.count} pictures` },
        h('div.pic-group', null, Array.from({ length: r.picture.count }, (_, i) => h('span.pic', { style: { '--i': i } }, r.picture.emoji)))),
      h('div.balloon-sky', null, balloons),
      status));
    if (ctx.young || ctx.profile.readAloud) speak(r.say);
  };

  return showRound;
};

/* ------------------------------------------------------------------ */
/* Game screen                                                         */
/* ------------------------------------------------------------------ */

export const renderGame = async (view, gameId) => {
  const game = GAMES.find((g) => g.id === gameId);
  if (!game) throw new Error('That game was not found.');
  const { profile, indexed } = getState();
  const young = Boolean(indexed.pack.young);
  const rewards = await getRewards(profile.profileId);
  const look = lookOf(rewards);
  const stage = h('div.game-stage');
  const ctx = { game, profile, young, look };
  const begin = (game.id === 'speed' ? speedRound : popBalloons)(stage, ctx);

  // Speed Round starts with a 3-2-1 so the child is ready.
  const countdown = () => {
    let n = 3;
    const step = () => {
      if (!stage.isConnected) return;
      if (n === 0) { begin(); return; }
      mount(stage, h('div.game-countdown', { 'aria-live': 'assertive' }, n));
      playSfx('tick');
      n -= 1;
      setTimeout(step, 700);
    };
    step();
  };

  view.classList.toggle('young', young);
  view.append(
    learnerBar(profile, rewards, { back: '#/games' }),
    h('h1.page-title', null, `${game.icon} ${game.title}`),
    stage,
  );
  mount(stage, startPanel(game, rewards.gameBest?.[game.id] || 0, look, game.id === 'speed' ? countdown : begin));
};
