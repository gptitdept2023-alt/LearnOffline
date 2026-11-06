/**
 * "Try with help": a few questions solved step by step with the skill's
 * technique (make ten, column method, bar model…). Mistakes here are part of
 * learning, so they are not recorded against mastery; independent practice
 * comes next.
 */

import { h, mount } from '../../core/dom.js';
import { getState } from '../../core/state.js';
import { speak, stopSpeaking } from '../../core/speech.js';
import { getRewards, recordActivity } from '../../data/repo.js';
import { playSfx } from '../../core/sfx.js';
import { confetti } from '../components/celebrate.js';
import { questionsForSkill } from '../../engine/practice.js';
import { methodFor } from '../../engine/techniques.js';
import { learnerBar, progressBar } from '../components/common.js';
import { renderVisual, renderBarModel } from '../components/visuals.js';
import { guidedRunner } from '../components/interactive.js';

const GUIDED_COUNT = 3;
const YOUNG_GUIDED_COUNT = 2;

export const renderGuided = async (view, skillId) => {
  const { profile, indexed } = getState();
  const skill = indexed.skillById.get(skillId);
  if (!skill) throw new Error('That skill was not found.');
  const young = indexed.pack.young;
  const rewards = await getRewards(profile.profileId);
  const id = encodeURIComponent(skillId);

  const questions = questionsForSkill(skill, young ? YOUNG_GUIDED_COUNT : GUIDED_COUNT)
    .map((q) => ({ q, method: methodFor(q) }))
    .filter((x) => x.method);
  if (!questions.length) {
    window.location.hash = `#/practice/${id}`;
    return;
  }

  let index = 0;
  const stage = h('section.practice-card');
  const progressHost = h('div.practice-progress');

  const finish = () => {
    stopSpeaking();
    recordActivity(profile.profileId, { kind: 'lesson' }, young).catch((e) => console.error(e));
    confetti({ count: 40 });
    playSfx('fanfare');
    mount(stage,
      h('div.results-emoji', { 'aria-hidden': 'true' }, '🌟'),
      h('h2', null, 'You know the steps!'),
      h('p', null, 'Now try some on your own. You can still tap “Show me how” if you get stuck.'),
      h('div.results-actions', null,
        h('a.btn.btn-secondary', { href: `#/guided/${id}` }, '↻ More with help'),
        h('a.btn.btn-primary.btn-lg', { href: `#/practice/${id}` }, 'Practise on my own ▶')));
    speak('You know the steps! Now try some on your own.');
  };

  const show = () => {
    const { q, method } = questions[index];
    mount(progressHost, progressBar(index, questions.length, `Example ${index + 1} of ${questions.length}`),
      h('small.muted', null, `${index + 1} / ${questions.length}`));
    const nextArea = h('div.guided-next');
    const runner = guidedRunner(method, () => {
      const last = index === questions.length - 1;
      mount(nextArea,
        h('div.feedback.feedback-good', null,
          h('strong.feedback-title', null, `✓ Answer: ${typeof q.answer === 'number' ? q.answer.toLocaleString('en-US') : q.answer}`),
          h('button.btn.btn-primary.btn-lg', { type: 'button', onclick: () => { if (last) finish(); else { index += 1; show(); } } },
            last ? 'Done' : 'Next example', ' ▶')));
      nextArea.querySelector('button').focus();
    });
    mount(stage,
      h('p.prompt', { class: young ? 'prompt-young' : '' }, q.prompt),
      // Bar-model techniques draw the model inside the steps, so it is not shown twice.
      q.method?.kind === 'barModel' ? null : (q.model ? renderBarModel(q.model) : renderVisual(q.visual)),
      runner,
      nextArea);
  };

  view.classList.toggle('young', Boolean(young));
  view.append(
    learnerBar(profile, rewards, { back: `#/topic/${encodeURIComponent(indexed.topicBySkill.get(skillId).topicId)}` }),
    h('header.practice-bar', null, h('span.stage.stage-try', null, 'Try with help'), h('h1.practice-title', null, skill.title), progressHost),
    stage,
  );
  show();
};
