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
import {
  GAMES, SPEED_SECONDS, POP_ROUNDS, BOND_ROUNDS, LINE_ROUNDS, gameStars, speedQuestion, popRound,
  memoryPairs, memoryScore, bondRound, lineRound, linePoints,
} from '../../engine/games.js';
import { shuffle } from '../../core/random.js';
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
  const line = result.newBest ? `New best: ${score}!` : score > 0 ? pickLine('good', 'en') : pickLine('tryAgain', 'en');
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
          status.textContent = pickLine('correct', 'en');
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
/* Memory Match                                                        */
/* ------------------------------------------------------------------ */

/** Front of a memory card: a sum, an answer, or pictures to count. */
const cardFace = (card) => (card.picture
  ? h('span.mem-pics', null, Array.from({ length: card.picture.count }, () => card.picture.emoji))
  : h('span.mem-text', null, card.text));

const memoryGame = (stage, ctx) => () => {
  const pairs = memoryPairs(ctx.young);
  const cards = shuffle(pairs.flatMap((p) => [
    { pairId: p.id, text: p.question, picture: p.picture, say: p.picture ? null : p.question },
    { pairId: p.id, text: p.answer, say: p.answer },
  ]));
  let open = [];
  let matched = 0;
  let moves = 0;
  let busy = false;
  const movesEl = h('strong', null, '0');
  const status = h('p.game-status', { 'aria-live': 'polite' }, 'Find the pairs!');

  const buttons = cards.map((card, i) => {
    const btn = h('button.mem-card', {
      type: 'button',
      'aria-label': `Card ${i + 1}`,
      onclick: () => {
        if (busy || btn.classList.contains('flipped')) return;
        btn.classList.add('flipped');
        btn.setAttribute('aria-label', card.picture ? `${card.picture.count} pictures` : card.text);
        playSfx('tap');
        if (ctx.young && card.say) speak(card.say);
        open.push({ card, btn });
        if (open.length < 2) return;
        moves += 1;
        movesEl.textContent = String(moves);
        const [a, b] = open;
        open = [];
        if (a.card.pairId === b.card.pairId) {
          a.btn.classList.add('matched');
          b.btn.classList.add('matched');
          matched += 1;
          playSfx('correct');
          status.textContent = pickLine('correct', 'en');
          if (matched === pairs.length) setTimeout(() => finishGame(stage, { ...ctx, score: memoryScore(pairs.length, moves) }), 700);
        } else {
          busy = true;
          playSfx('wrong');
          status.textContent = 'Not a pair. Remember where they are!';
          setTimeout(() => {
            for (const x of [a, b]) { x.btn.classList.remove('flipped'); x.btn.setAttribute('aria-label', 'Hidden card'); }
            busy = false;
          }, 1000);
        }
      },
    }, h('span.mem-back', { 'aria-hidden': 'true' }, '?'), h('span.mem-front', null, cardFace(card)));
    return btn;
  });

  mount(stage, h('section.game-panel', null,
    h('div.game-hud', null, h('span', null, `${pairs.length} pairs`), h('span', null, 'Turns ', movesEl)),
    h(`div.mem-grid${ctx.young ? '.mem-grid-young' : ''}`, null, buttons),
    status));
  if (ctx.young) speak('Find the pairs! Match each one to its number.');
};

/* ------------------------------------------------------------------ */
/* Bond Bubbles                                                        */
/* ------------------------------------------------------------------ */

const bondGame = (stage, ctx) => {
  let round = 0;
  let score = 0;

  const showRound = () => {
    if (!stage.isConnected) return;
    if (round >= BOND_ROUNDS) { finishGame(stage, { ...ctx, score }); return; }
    const r = bondRound(ctx.young);
    let picked = null;
    let left = r.bubbles.length;
    const fmtN = (n) => n.toLocaleString('en-US');
    const status = h('p.game-status', { 'aria-live': 'polite' }, `Pick two that make ${fmtN(r.target)}.`);
    const scoreEl = h('strong', null, score);

    const bubbles = r.bubbles.map((b, i) => {
      const el = h('button.bubble', {
        type: 'button',
        style: { '--i': i, '--hue': `${(i * 57 + round * 40) % 360}` },
        'aria-label': `Bubble ${b.value}`,
        onclick: () => {
          if (el.classList.contains('popped')) return;
          playSfx('tap');
          if (!picked) { picked = { b, el }; el.classList.add('picked'); return; }
          if (picked.el === el) { el.classList.remove('picked'); picked = null; return; }
          const first = picked;
          picked = null;
          first.el.classList.remove('picked');
          if (first.b.value + b.value === r.target) {
            for (const x of [first.el, el]) x.classList.add('popped');
            playSfx('pop');
            score += 1;
            scoreEl.textContent = String(score);
            status.textContent = `${fmtN(first.b.value)} + ${fmtN(b.value)} = ${fmtN(r.target)}. ${pickLine('correct', 'en')}`;
            left -= 2;
            if (left === 0) { round += 1; setTimeout(showRound, 1000); }
          } else {
            for (const x of [first.el, el]) { x.classList.add('shake'); setTimeout(() => x.classList.remove('shake'), 400); }
            playSfx('wrong');
            status.textContent = `${fmtN(first.b.value)} + ${fmtN(b.value)} = ${fmtN(first.b.value + b.value)}. Try another pair!`;
          }
        },
      }, fmtN(b.value));
      return el;
    });

    mount(stage, h('section.game-panel', null,
      h('div.game-hud', null, h('span', null, `Round ${round + 1} of ${BOND_ROUNDS}`), h('span', null, 'Pairs ', scoreEl)),
      h('p.game-prompt', null, `Make ${fmtN(r.target)}`),
      h('div.visual.visual-bond-mini', { 'aria-hidden': 'true' }, h('span.bond-mini-whole', null, fmtN(r.target)), h('span.bond-mini-parts', null, h('span', null, '?'), h('span', null, '?'))),
      h('div.bubble-field', null, bubbles),
      status));
    if (ctx.young || ctx.profile.readAloud) speak(`Find two bubbles that make ${r.target}.`);
  };
  return showRound;
};

/* ------------------------------------------------------------------ */
/* Number Line Jump                                                    */
/* ------------------------------------------------------------------ */

const lineGame = (stage, ctx) => {
  let round = 0;
  let score = 0;

  const showRound = () => {
    if (!stage.isConnected) return;
    if (round >= LINE_ROUNDS) { finishGame(stage, { ...ctx, score }); return; }
    const r = lineRound(ctx.young);
    const pct = (v) => ((v - r.min) / (r.max - r.min)) * 100;
    let done = false;
    const status = h('p.game-status', { 'aria-live': 'polite' }, 'Tap the line.');
    const marker = h('span.line-marker', { hidden: true });
    const flag = h('span.line-flag', { hidden: true }, r.label);

    const answer = (value) => {
      if (done) return;
      done = true;
      const points = linePoints(r, value);
      score += points;
      marker.hidden = false;
      marker.style.setProperty('--at', `${pct(value)}%`);
      flag.hidden = false;
      flag.style.setProperty('--at', `${pct(r.target)}%`);
      status.textContent = points === 3 ? 'Bullseye! +3' : points === 2 ? 'So close! +2' : points === 1 ? 'Nearly! +1' : `It lives here, at ${r.label}.`;
      playSfx(points >= 2 ? 'correct' : points === 1 ? 'coin' : 'wrong');
      round += 1;
      setTimeout(showRound, 1500);
    };

    // Kinder taps a numbered tick; older children tap anywhere on the line (estimation).
    const track = h(`div.line-track${r.snap ? '.line-snap' : ''}`, {
      onclick: r.snap ? null : (event) => {
        const box = event.currentTarget.getBoundingClientRect();
        const share = Math.min(1, Math.max(0, (event.clientX - box.left) / box.width));
        answer(r.min + share * (r.max - r.min));
      },
    },
    h('span.line-axis'),
    r.ticks.map((t) => (r.snap
      ? h('button.line-tick.line-tick-btn', { type: 'button', style: { '--at': `${pct(t.value)}%` }, 'aria-label': String(t.value), onclick: (e) => { e.stopPropagation(); answer(t.value); } },
        h('span.line-tick-label', null, String(t.value)))
      : h('span.line-tick', { style: { '--at': `${pct(t.value)}%` } }, t.label && h('span.line-tick-label', null, t.label)))),
    marker, flag);

    mount(stage, h('section.game-panel', null,
      h('div.game-hud', null, h('span', null, `Round ${round + 1} of ${LINE_ROUNDS}`), h('span', null, 'Points ', h('strong', null, score))),
      h('p.game-prompt', null, `Where is ${r.label}?`),
      track,
      status));
    if (ctx.young || ctx.profile.readAloud) speak(`Where is ${r.label}?`);
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
  const RUNNERS = { speed: speedRound, pop: popBalloons, memory: memoryGame, bonds: bondGame, line: lineGame };
  const begin = RUNNERS[game.id](stage, ctx);

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
