/**
 * Lesson: short steps that move Concrete -> Pictorial -> Abstract,
 * then lead straight into practice.
 */

import { h, mount } from '../../core/dom.js';
import { t } from '../../core/i18n.js';
import { getState } from '../../core/state.js';
import { speak, canSpeak, stopSpeaking } from '../../core/speech.js';
import { getRewards } from '../../data/repo.js';
import { learnerBar, progressBar } from '../components/common.js';
import { renderVisual } from '../components/visuals.js';

const STAGE_LABEL = { concrete: 'Use objects', pictorial: 'Draw it', abstract: 'Use numbers' };

export const renderLesson = async (view, skillId) => {
  const { profile, indexed } = getState();
  const skill = indexed.skillById.get(skillId);
  if (!skill?.lesson) throw new Error('This skill has no lesson.');
  const topic = indexed.topicBySkill.get(skillId);
  const rewards = await getRewards(profile.profileId);
  const steps = skill.lesson.steps;
  let index = 0;

  const card = h('section.lesson-card');

  const show = () => {
    stopSpeaking();
    const step = steps[index];
    const last = index === steps.length - 1;
    mount(card,
      progressBar(index + 1, steps.length, `Step ${index + 1} of ${steps.length}`),
      step.stage && h(`span.stage.stage-${step.stage}`, null, STAGE_LABEL[step.stage] || step.stage),
      h('p.lesson-text', null, step.text),
      renderVisual(step.visual),
      h('div.lesson-actions', null,
        canSpeak() && h('button.btn.btn-ghost', { type: 'button', onclick: () => speak(step.text) }, '🔊 ', t('listen')),
        h('span.spacer'),
        index > 0 && h('button.btn.btn-secondary', { type: 'button', onclick: () => { index -= 1; show(); } }, t('back')),
        last
          ? h('a.btn.btn-primary', { href: `#/practice/${encodeURIComponent(skillId)}` }, t('practice'), ' ▶')
          : h('button.btn.btn-primary', { type: 'button', onclick: () => { index += 1; show(); } }, t('next'), ' ▶')),
    );
    if (profile.readAloud) speak(step.text);
  };

  view.append(
    learnerBar(profile, rewards, { back: `#/topic/${encodeURIComponent(topic.topicId)}` }),
    h('h1.page-title', null, skill.title),
    card,
  );
  show();
};
