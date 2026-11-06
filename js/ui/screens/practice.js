/**
 * Practice: one question at a time, instant feedback, one hint, optional
 * bar model, read-aloud. Answers are kept in memory and saved in a single
 * transaction when the set ends (see repo.saveSetResult).
 */

import { h, mount, confirmDialog, toast, withLoading } from '../../core/dom.js';
import { t } from '../../core/i18n.js';
import { navigate } from '../../core/router.js';
import { getState, setLastResult } from '../../core/state.js';
import { speak, canSpeak, stopSpeaking } from '../../core/speech.js';
import { getMasteryMap, saveSetResult } from '../../data/repo.js';
import { topicSkillsFor } from '../../data/packs.js';
import { isCorrect, isBlank } from '../../engine/answers.js';
import { pickDailyMix } from '../../engine/mastery.js';
import { buildSkillSet, buildMixSet } from '../../engine/practice.js';
import { progressBar } from '../components/common.js';
import { renderVisual, renderBarModel, shapeSvg } from '../components/visuals.js';
import { methodPlayer } from '../components/interactive.js';
import { methodFor } from '../../engine/techniques.js';

const MIX_ID = 'mix';

/** Build the questions for this route. */
const buildQuestions = async (profile, indexed, skillId) => {
  const young = indexed.pack.young;
  if (skillId === MIX_ID) {
    const mastery = await getMasteryMap(profile.profileId);
    const ids = pickDailyMix(indexed.skillOrder, mastery, young ? 2 : 4);
    return { label: t('dailyMix'), questions: buildMixSet(ids.map((id) => indexed.skillById.get(id)), young) };
  }
  const skill = indexed.skillById.get(skillId);
  if (!skill) throw new Error('That skill was not found.');
  return { label: skill.title, questions: buildSkillSet(skill, young) };
};

/** Input controls for one question. Returns { el, read(), focus() }. */
const answerInput = (question, onSubmit) => {
  if (question.answerType === 'choice') {
    const el = h(`div.choices${question.choiceKind === 'shape' ? '.choices-pictures' : ''}`, null,
      question.choices.map((c) => h('button.choice', {
        type: 'button',
        'aria-label': c,
        onclick: () => onSubmit(c),
      }, question.choiceKind === 'shape' ? shapeSvg(c) : c)));
    return { el, read: () => '', focus: () => el.querySelector('button')?.focus() };
  }

  if (question.answerType === 'fraction') {
    const num = h('input.frac-input', { inputmode: 'numeric', 'aria-label': 'Top number', autocomplete: 'off' });
    const den = h('input.frac-input', { inputmode: 'numeric', 'aria-label': 'Bottom number', autocomplete: 'off' });
    const form = h('form.answer-form', { onsubmit: (e) => { e.preventDefault(); onSubmit(`${num.value.trim()}/${den.value.trim()}`); } },
      h('div.frac-entry', null, num, h('span.frac-bar'), den),
      h('button.btn.btn-primary.btn-lg', { type: 'submit' }, t('check')));
    return { el: form, read: () => `${num.value}/${den.value}`, focus: () => num.focus() };
  }

  const input = h('input.answer-input', { inputmode: 'decimal', 'aria-label': t('yourAnswer'), autocomplete: 'off', enterkeyhint: 'done' });
  const form = h('form.answer-form', { onsubmit: (e) => { e.preventDefault(); onSubmit(input.value); } },
    input, h('button.btn.btn-primary.btn-lg', { type: 'submit' }, t('check')));
  return { el: form, read: () => input.value, focus: () => input.focus() };
};

export const renderPractice = async (view, skillId) => {
  const { profile, indexed } = getState();
  const { label, questions } = await buildQuestions(profile, indexed, skillId);
  if (!questions.length) throw new Error('No questions are available for this practice yet.');

  const young = indexed.pack.young;
  const answers = [];
  let index = 0;
  let startedAt = 0;
  let saving = false;
  const exitHref = skillId === MIX_ID ? 'home' : `topic/${encodeURIComponent(indexed.topicBySkill.get(skillId).topicId)}`;

  const stage = h('section.practice-card');
  const progressHost = h('div.practice-progress');

  const quit = async () => {
    if (answers.length === 0 || await confirmDialog({
      title: 'Stop practice?',
      message: 'Answers in this set will not be saved.',
      confirmText: 'Stop',
      danger: true,
    })) {
      stopSpeaking();
      navigate(exitHref);
    }
  };

  const finish = async () => {
    if (saving) return;
    saving = true;
    try {
      const skillIds = [...new Set(answers.map((a) => a.skillId))];
      const result = await withLoading(() => saveSetResult({
        profileId: profile.profileId,
        packId: profile.packId,
        label,
        answers,
        topicSkills: topicSkillsFor(indexed, skillIds),
      }), 'Saving…');
      setLastResult({ ...result, label, answers, skillIds, retry: skillId });
      navigate('results');
    } catch (error) {
      saving = false;
      console.error(error);
      toast(`Could not save progress: ${error.message}`, 'error');
    }
  };

  const showFeedback = (question, given, correct) => {
    const last = index === questions.length - 1;
    const next = () => {
      if (last) finish();
      else { index += 1; showQuestion(); }
    };
    const feedback = h(`div.feedback.${correct ? 'feedback-good' : 'feedback-bad'}`, { role: 'status' },
      h('strong.feedback-title', null, correct ? `✓ ${t('correct')}` : t('notQuite')),
      !correct && h('p', null, `${t('answerWas')} `, h('strong', null, typeof question.answer === 'number' ? question.answer.toLocaleString('en-US') : String(question.answer)), '.'),
      !correct && question.explain && !methodFor(question) && h('p.muted', null, question.explain),
      h('button.btn.btn-primary.btn-lg', { type: 'button', autofocus: true, onclick: next }, last ? t('done') : t('continue'), ' ▶'));
    stage.querySelector('.answer-area').replaceChildren(feedback);
    // After a wrong answer, show the technique step by step (Singapore method made visible).
    const method = !correct && methodFor(question);
    if (method && !stage.querySelector('.method')) {
      feedback.insertBefore(methodPlayer(method, { autoSpeak: false, compact: true }), feedback.lastChild);
    }
    feedback.querySelector('button').focus();
    if (profile.readAloud || young) speak(correct ? t('correct') : `${t('answerWas')} ${question.answer}`);
  };

  const submit = (question, raw) => {
    if (answers.length > index) return; // Already answered (double tap).
    if (isBlank(question, raw)) {
      toast('Type an answer first.', 'info');
      return;
    }
    const correct = isCorrect(question, raw);
    answers.push({
      skillId: question.skillId,
      correct,
      given: raw,
      prompt: question.prompt,
      timeMs: Math.round(performance.now() - startedAt),
    });
    showFeedback(question, raw, correct);
  };

  const showQuestion = () => {
    stopSpeaking();
    const question = questions[index];
    startedAt = performance.now();
    mount(progressHost, progressBar(index, questions.length, `Question ${index + 1} of ${questions.length}`),
      h('small.muted', null, `${index + 1} / ${questions.length}`));

    const input = answerInput(question, (raw) => submit(question, raw));
    const hintBox = h('p.hint', { hidden: true }, `💡 ${question.hint || ''}`);
    const modelBox = h('div.model-box', { hidden: true }, question.model ? renderBarModel(question.model) : null);

    mount(stage,
      h('div.question-head', null,
        h('p.prompt', { class: young ? 'prompt-young' : '' }, question.prompt),
        canSpeak() && h('button.icon-btn.icon-btn-lg', { type: 'button', 'aria-label': t('listen'), onclick: () => speak(question.prompt) }, '🔊')),
      renderVisual(question.visual),
      modelBox,
      hintBox,
      h('div.helper-actions', null,
        question.model && h('button.btn.btn-secondary', {
          type: 'button',
          onclick: (e) => { modelBox.hidden = false; e.currentTarget.remove(); },
        }, '📊 ', t('showModel')),
        methodFor(question) && h('button.btn.btn-secondary', {
          type: 'button',
          onclick: (e) => { e.currentTarget.replaceWith(methodPlayer(methodFor(question), { compact: true })); },
        }, '🧭 Show me how'),
        question.hint && h('button.btn.btn-ghost', {
          type: 'button',
          onclick: (e) => { hintBox.hidden = false; e.currentTarget.remove(); if (young || profile.readAloud) speak(question.hint); },
        }, '💡 ', t('hint'))),
      h('div.answer-area', null, input.el),
    );
    input.focus();
    if (profile.readAloud || question.young) speak(question.prompt);
  };

  view.classList.toggle('young', Boolean(young));
  view.append(
    h('header.practice-bar', null,
      h('button.icon-btn', { type: 'button', 'aria-label': 'Stop practice', onclick: quit }, '✕'),
      h('h1.practice-title', null, label),
      progressHost),
    stage,
  );
  showQuestion();
};
