/**
 * Interactive lesson: short steps that move Concrete -> Pictorial -> Abstract.
 * A step can be plain (text + animated picture) or interactive:
 *   interact.kind = 'tapCount' | 'fillFrame' | 'check' | 'worked' | 'tryIt'
 * Interactive steps unlock "Next" only when the child has done them.
 * The lesson ends by leading into "Try with help", then independent practice.
 */

import { h, mount } from '../../core/dom.js';
import { t } from '../../core/i18n.js';
import { getState } from '../../core/state.js';
import { speak, canSpeak, stopSpeaking } from '../../core/speech.js';
import { getRewards, recordActivity } from '../../data/repo.js';
import { methodFor } from '../../engine/techniques.js';
import { generate } from '../../engine/generators.js';
import { learnerBar, progressBar } from '../components/common.js';
import { renderVisual } from '../components/visuals.js';
import { tapCount, fillFrame, pickAnswer, methodPlayer, guidedRunner } from '../components/interactive.js';

/** Label keys for the Concrete -> Pictorial -> Abstract stage chip. */
const STAGE_KEY = { concrete: 'stageConcrete', pictorial: 'stagePictorial', abstract: 'stageAbstract', technique: 'stageTechnique', try: 'stageTry' };

/** True if this skill has a technique to practise with help. */
export const skillHasGuided = (skill) => {
  if (!skill.generator) return false;
  try { return Boolean(generate(skill.generator).method); } catch { return false; }
};

/** Build the interactive part of a step. Calls `done` when finished. */
const buildInteraction = (interact, done) => {
  switch (interact.kind) {
    case 'tapCount': return tapCount(interact, done);
    case 'fillFrame': return fillFrame(interact, done);
    case 'check': return pickAnswer(interact, done);
    case 'worked': {
      const method = methodFor({ method: interact.method });
      return method ? methodPlayer(method, { onDone: done }) : null;
    }
    case 'tryIt': {
      const method = methodFor({ method: interact.method });
      return method ? guidedRunner(method, done) : null;
    }
    default:
      console.warn(`Unknown lesson interaction "${interact.kind}"`);
      done();
      return null;
  }
};

export const renderLesson = async (view, skillId) => {
  const { profile, indexed } = getState();
  const skill = indexed.skillById.get(skillId);
  if (!skill?.lesson) throw new Error('This skill has no lesson.');
  const topic = indexed.topicBySkill.get(skillId);
  const rewards = await getRewards(profile.profileId);
  const steps = skill.lesson.steps;
  const id = encodeURIComponent(skillId);
  const afterLesson = skillHasGuided(skill)
    ? { href: `#/guided/${id}`, label: t('tryWithHelp') }
    : { href: `#/practice/${id}`, label: t('practice') };
  let index = 0;
  let counted = false; // the lesson counts for the quest and streak once per visit

  const card = h('section.lesson-card');

  const show = () => {
    stopSpeaking();
    const step = steps[index];
    const last = index === steps.length - 1;
    const countLesson = () => {
      if (counted) return;
      counted = true;
      recordActivity(profile.profileId, { kind: 'lesson' }, Boolean(indexed.pack.young)).catch((e) => console.error(e));
    };
    const nextBtn = last
      ? h('a.btn.btn-primary', { href: afterLesson.href }, afterLesson.label, ' ▶')
      : h('button.btn.btn-primary', { type: 'button', onclick: () => { index += 1; show(); } }, t('next'), ' ▶');

    let interaction = null;
    if (step.interact) {
      nextBtn.classList.add('is-locked');
      nextBtn.setAttribute('aria-disabled', 'true');
      if (nextBtn.tagName === 'BUTTON') nextBtn.disabled = true;
      const unlock = () => {
        if (last) countLesson();
        nextBtn.classList.remove('is-locked');
        nextBtn.removeAttribute('aria-disabled');
        nextBtn.disabled = false;
        nextBtn.classList.add('pulse');
      };
      interaction = buildInteraction(step.interact, unlock);
      if (!interaction) unlock();
    } else if (last) {
      countLesson(); // a last step with nothing to do is done once it is shown
    }

    mount(card,
      progressBar(index + 1, steps.length, t('stepOf', index + 1, steps.length)),
      step.stage && h(`span.stage.stage-${step.stage}`, null, STAGE_KEY[step.stage] ? t(STAGE_KEY[step.stage]) : step.stage),
      step.text && h('p.lesson-text', null, step.text),
      renderVisual(step.visual),
      interaction,
      h('div.lesson-actions', null,
        canSpeak() && step.text && h('button.icon-btn', { type: 'button', 'aria-label': t('listen'), title: t('listen'), onclick: () => speak(step.say || step.text) }, '🔊'),
        h('span.spacer'),
        index > 0 && h('button.btn.btn-secondary', { type: 'button', onclick: () => { index -= 1; show(); } }, t('back')),
        nextBtn),
    );
    // Narrate the step (interactive pieces narrate themselves).
    if (step.text && (profile.readAloud || indexed.pack.young) && step.interact?.kind !== 'worked' && step.interact?.kind !== 'tryIt') speak(step.say || step.text);
  };

  view.append(
    learnerBar(profile, rewards, { back: `#/topic/${encodeURIComponent(topic.topicId)}` }),
    h('h1.page-title', null, skill.title),
    card,
  );
  show();
};
