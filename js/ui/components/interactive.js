/**
 * Interactive pieces used by lessons, "Try with help" and "Show me how":
 *
 *  - tapCount:     tap each picture; it shows and says its number
 *  - fillFrame:    tap ten-frame cells to show a number
 *  - pickAnswer:   a quick check with choices and instant feedback
 *  - methodPlayer: plays a technique's worked steps one at a time, with
 *                  narration and an animated picture for each step
 *  - guidedRunner: walks through a technique's sub-questions; a wrong try
 *                  shows a nudge and lets the child try again
 *
 * Every piece calls `onDone()` when the child has finished it, so the
 * screen hosting it decides what comes next.
 */

import { h, mount } from '../../core/dom.js';
import { speak } from '../../core/speech.js';
import { isCorrect, isBlank } from '../../engine/answers.js';
import { renderVisual } from './visuals.js';

/* ------------------------------------------------------------------ */
/* Tap to count                                                        */
/* ------------------------------------------------------------------ */

/**
 * @param {{emoji: string, count: number}} spec
 * @param {(count: number) => void} onDone
 */
export const tapCount = ({ emoji, count }, onDone) => {
  let counted = 0;
  const total = h('strong.tap-total', { 'aria-live': 'polite' }, '0');
  const items = Array.from({ length: count }, (_, i) => h('button.tap-item', {
    type: 'button',
    'aria-label': `Item ${i + 1}`,
    style: { '--i': i },
    onclick: (event) => {
      const el = event.currentTarget;
      if (el.classList.contains('tapped')) return;
      counted += 1;
      el.classList.add('tapped');
      el.dataset.n = String(counted);
      total.textContent = String(counted);
      speak(String(counted), { rate: 1 });
      if (counted === count) {
        el.closest('.tap-count').classList.add('done');
        setTimeout(() => onDone(count), 500);
      }
    },
  }, emoji));
  return h('div.tap-count', null,
    h('div.tap-grid', null, items),
    h('p.tap-status', null, 'Counted: ', total));
};

/* ------------------------------------------------------------------ */
/* Fill a ten frame                                                    */
/* ------------------------------------------------------------------ */

/**
 * Tap cells to show `target` (up to 20). The child presses Check when ready.
 * @param {{target: number}} spec
 */
export const fillFrame = ({ target }, onDone) => {
  const frames = target > 10 ? 2 : 1;
  const filled = new Set();
  const status = h('p.tap-status', { 'aria-live': 'polite' }, `Show ${target}. Tap the boxes.`);
  const cells = [];
  const frameEls = Array.from({ length: frames }, (_, f) => h('div.ten-frame.ten-frame-input', null,
    Array.from({ length: 10 }, (_, c) => {
      const n = f * 10 + c;
      const cell = h('button.cell', {
        type: 'button',
        'aria-label': `Box ${n + 1}`,
        'aria-pressed': 'false',
        onclick: () => {
          if (filled.has(n)) filled.delete(n); else filled.add(n);
          cell.classList.toggle('filled', filled.has(n));
          cell.setAttribute('aria-pressed', String(filled.has(n)));
          status.textContent = `${filled.size} filled`;
        },
      });
      cells.push(cell);
      return cell;
    })));
  const check = h('button.btn.btn-primary', {
    type: 'button',
    onclick: () => {
      if (filled.size === target) {
        status.textContent = `Yes! That shows ${target}.`;
        speak(`Yes! That shows ${target}.`);
        check.disabled = true;
        onDone(target);
      } else {
        const msg = filled.size < target ? `That is ${filled.size}. Fill ${target - filled.size} more.` : `That is ${filled.size}. Take away ${filled.size - target}.`;
        status.textContent = msg;
        speak(msg);
      }
    },
  }, 'Check');
  return h('div.fill-frame', null, h('div.visual.visual-ten-frames', null, frameEls), status, check);
};

/* ------------------------------------------------------------------ */
/* Quick check                                                         */
/* ------------------------------------------------------------------ */

/**
 * @param {{prompt: string, choices: string[], answer: string, explain?: string, visual?: Object}} spec
 */
export const pickAnswer = ({ prompt, choices, answer, explain, visual }, onDone) => {
  const feedback = h('p.check-feedback', { 'aria-live': 'polite' });
  const buttons = choices.map((c) => h('button.choice', {
    type: 'button',
    onclick: (event) => {
      const el = event.currentTarget;
      if (String(c) === String(answer)) {
        el.classList.add('choice-right');
        buttons.forEach((b) => { b.disabled = true; });
        feedback.textContent = `Yes! ${explain || ''}`.trim();
        speak(feedback.textContent);
        onDone(c);
      } else {
        el.classList.add('choice-wrong');
        el.disabled = true;
        feedback.textContent = 'Not quite. Look again and try another one.';
        speak(feedback.textContent);
      }
    },
  }, String(c)));
  return h('div.quick-check', null,
    h('p.check-prompt', null, prompt),
    renderVisual(visual),
    h('div.choices', null, buttons),
    feedback);
};

/* ------------------------------------------------------------------ */
/* Method player: worked steps, one at a time                          */
/* ------------------------------------------------------------------ */

/**
 * Show a technique's steps one by one. Each step animates in and is read aloud.
 * @param {{name: string, steps: {text: string, visual?: Object}[]}} method
 * @param {{autoSpeak?: boolean, onDone?: () => void, compact?: boolean}} [options]
 */
/**
 * The optional "Faster way" panel: a quicker trick for these numbers, shown
 * only after the main method so the fundamentals always come first.
 * @param {{name: string, why: string, steps: {text: string, visual?: Object}[]}} faster
 */
const fasterPanel = (faster) => h('section.method-faster', null,
  h('div.method-head', null, h('span.method-tag.method-tag-faster', null, '⚡ Faster way'), h('strong', null, faster.name)),
  h('p.method-why', null, `${faster.why} Same answer, fewer steps. Check it with the method above.`),
  h('ol.method-steps', null, faster.steps.map((st, i) => h('li.method-step', null,
    h('span.method-num.method-num-faster', { 'aria-hidden': 'true' }, i + 1),
    h('div.method-body', null, h('p', null, st.text), renderVisual(st.visual))))));

export const methodPlayer = (method, { autoSpeak = true, onDone, compact = false } = {}) => {
  let index = 0;
  const list = h('ol.method-steps');
  const next = h('button.btn.btn-secondary', { type: 'button' }, 'Next step ▶');
  const showAll = h('button.btn.btn-ghost.btn-sm', { type: 'button' }, 'Show all');

  const renderStep = (i) => {
    const step = method.steps[i];
    // Each picture builds on the one before, so only the newest step shows
    // its picture; earlier ones fold away (tap "Picture" to look again).
    // This keeps the panel short on a phone.
    list.lastElementChild?.classList.add('is-past');
    const picture = renderVisual(step.visual);
    const li = h('li.method-step', null,
      h('span.method-num', { 'aria-hidden': 'true' }, i + 1),
      h('div.method-body', null,
        h('p', null, step.text),
        picture,
        picture && h('button.method-peek', {
          type: 'button',
          onclick: (e) => {
            const open = li.classList.toggle('is-open');
            e.currentTarget.textContent = open ? 'Hide picture' : '🖼 Picture';
          },
        }, '🖼 Picture')));
    list.append(li);
    li.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
    return step;
  };

  const actions = h('div.method-actions', null, next, showAll);

  /** Main method finished: offer the optional faster trick, never before. */
  const finish = () => {
    next.remove();
    showAll.remove();
    if (method.faster) {
      actions.append(h('button.btn.btn-ghost.btn-sm.method-faster-btn', {
        type: 'button',
        onclick: (e) => {
          const panel = fasterPanel(method.faster);
          e.currentTarget.replaceWith(panel);
          panel.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
          if (autoSpeak) speak([method.faster.why, ...method.faster.steps.map((st) => st.text)].join(' '));
        },
      }, `⚡ Faster way: ${method.faster.name}`));
    }
    onDone?.();
  };

  const advance = () => {
    const step = renderStep(index);
    index += 1;
    if (autoSpeak) speak(step.text);
    if (index >= method.steps.length) finish();
  };

  next.addEventListener('click', advance);
  showAll.addEventListener('click', () => {
    while (index < method.steps.length) { renderStep(index); index += 1; }
    finish();
  });

  const el = h(`section.method${compact ? '.method-compact' : ''}`, null,
    h('div.method-head', null, h('span.method-tag', null, 'Technique'), h('strong', null, method.name)),
    list,
    actions);
  advance();
  return el;
};

/* ------------------------------------------------------------------ */
/* Guided runner: sub-questions that follow the technique              */
/* ------------------------------------------------------------------ */

/**
 * Walk through `guided` sub-steps. Wrong answers do not count against the
 * child here: they get a nudge and try again, with the answer shown after
 * two misses so nobody gets stuck.
 * @param {{name: string, guided: Object[]}} method
 * @param {(stats: {firstTry: number, total: number}) => void} onDone
 */
export const guidedRunner = (method, onDone, { speakPrompts = true } = {}) => {
  let index = 0;
  let misses = 0;
  let firstTry = 0;
  const host = h('div.guided-step');
  const trail = h('ol.guided-trail');

  const finishStep = (step, firstTime) => {
    if (firstTime) firstTry += 1;
    const label = step.answerType === 'tapCount' ? 'Counted: ' : `${step.prompt.replace(/\s*\?$/, '')} → `;
    trail.append(h('li', null, h('span.guided-check', { 'aria-hidden': 'true' }, '✓'), label, h('strong', null, String(step.answer))));
    index += 1;
    misses = 0;
    if (index < method.guided.length) show();
    else {
      mount(host);
      onDone({ firstTry, total: method.guided.length });
    }
  };

  const show = () => {
    const step = method.guided[index];
    const feedback = h('p.check-feedback', { 'aria-live': 'polite' });
    let input;

    const submit = (raw) => {
      if (step.answerType !== 'choice' && isBlank({ answerType: 'numeric' }, raw)) {
        feedback.textContent = 'Type a number first.';
        return;
      }
      if (isCorrect({ answerType: step.answerType === 'choice' ? 'choice' : 'numeric', answer: step.answer }, raw)) {
        speak('Yes!');
        finishStep(step, misses === 0);
        return;
      }
      misses += 1;
      feedback.textContent = misses >= 2 ? `It is ${step.answer}. Type ${step.answer} to go on.` : 'Not yet. Look at the picture and try again.';
      speak(feedback.textContent);
      host.querySelector('.guided-input')?.classList.add('shake');
      setTimeout(() => host.querySelector('.guided-input')?.classList.remove('shake'), 400);
    };

    if (step.answerType === 'tapCount') {
      input = tapCount({ emoji: step.emoji, count: step.count }, () => finishStep(step, true));
    } else if (step.answerType === 'choice') {
      input = h('div.choices.guided-input', null, step.choices.map((c) => h('button.choice', { type: 'button', onclick: () => submit(c) }, c)));
    } else {
      const field = h('input.answer-input', { inputmode: 'decimal', autocomplete: 'off', 'aria-label': 'Your answer' });
      input = h('form.answer-form.guided-input', { onsubmit: (e) => { e.preventDefault(); submit(field.value); } },
        field, h('button.btn.btn-primary', { type: 'submit' }, 'Check'));
      setTimeout(() => field.focus(), 50);
    }

    mount(host,
      h('p.guided-count.muted', null, `Step ${index + 1} of ${method.guided.length}`),
      h('p.prompt', null, step.prompt),
      renderVisual(step.visual),
      input,
      feedback);
    if (speakPrompts) speak(step.prompt);
  };

  show();
  return h('section.guided', null,
    h('div.method-head', null, h('span.method-tag', null, 'Technique'), h('strong', null, method.name)),
    trail, host);
};
