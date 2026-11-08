/**
 * Reusable UI pieces shared by several screens.
 */

import { h, openDialog } from '../../core/dom.js';
import { t, LANGUAGES, DEFAULT_LANGUAGE } from '../../core/i18n.js';
import { currentStreak, walletOf } from '../../engine/rewards.js';
import { saveProfile, getAllRewards } from '../../data/repo.js';
import { loadPackIndex, levelsOf } from '../../data/packs.js';
import { getState } from '../../core/state.js';
import { lookOf } from '../../engine/shop.js';
import { robotSvg } from './robot.js';

export const AVATARS = ['🦊', '🐼', '🐯', '🐸', '🐵', '🦁', '🐨', '🐙', '🦄', '🐢', '🐧', '🦉'];

/**
 * A learner's avatar: their robot's face when they use the robot, else the
 * buddy emoji they picked.
 * @param {Object} profile
 * @param {Object} [look] From lookOf(); without it the emoji is shown.
 * @param {'sm'|'md'|'lg'} [size]
 */
export const avatarBadge = (profile, look, size = 'sm') => (look?.robot
  ? h(`span.avatar.avatar-${size}.avatar-robot`, { 'aria-hidden': 'true' }, robotSvg(look.robot, { headOnly: true }))
  : h(`span.avatar.avatar-${size}`, { 'aria-hidden': 'true' }, profile.avatar));

/**
 * Looks for several learners at once (start screen, parent area), so each
 * avatar can show that learner's robot. One read of the rewards store.
 * @returns {Promise<Map<string, Object>>} profileId -> look
 */
export const looksFor = async (profiles) => {
  const [packs, rewardsById] = await Promise.all([loadPackIndex(), getAllRewards()]);
  const young = new Map(packs.map((p) => [p.packId, Boolean(p.young)]));
  return new Map(profiles.map((p) => [p.profileId, lookOf(rewardsById.get(p.profileId), young.get(p.packId))]));
};

/** Top bar for a learner's screens: who is learning, stars, streak. */
export const learnerBar = (profile, rewards, { back } = {}) =>
  h('header.learner-bar', null,
    back
      ? h('a.icon-btn', { href: back, 'aria-label': t('back') }, '←')
      : h('a.icon-btn', { href: '#/', 'aria-label': t('switchLearner'), title: t('switchLearner') }, '⇄'),
    avatarBadge(profile, lookOf(rewards, Boolean(getState().indexed?.pack?.young))),
    h('strong.learner-name', null, profile.name),
    h('span.spacer'),
    h('a.chip', { href: '#/shop', title: t('starsToSpend') }, '⭐ ', h('span', null, walletOf(rewards))),
    h('span.chip', { title: t('streak') }, '🔥 ', h('span', null, currentStreak(rewards))),
  );

/** Horizontal progress bar. */
export const progressBar = (value, max, label) =>
  h('div.progress', { role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': max, 'aria-valuenow': value, 'aria-label': label },
    h('div.progress-fill', { style: { '--pct': `${max ? Math.round((value / max) * 100) : 0}%` } }));

/** Pill for a skill's mastery status. */
export const statusPill = (status) => h(`span.pill.pill-${status}`, null, t(status));

/** Accessible switch-style checkbox with a label. */
export const toggle = (name, label, checked) =>
  h('label.toggle', null,
    h('input', { type: 'checkbox', name, checked }),
    h('span.toggle-track', { 'aria-hidden': 'true' }),
    h('span', null, label));

/**
 * Add or edit a learner in a dialog.
 * @param {Object|null} existing Profile to edit, or null to add.
 * @returns {Promise<Object|null>} The saved profile, or null if cancelled.
 */
export const openProfileEditor = async (existing = null) => {
  const packs = await loadPackIndex();
  const levels = levelsOf(packs);
  const currentLevel = packs.find((p) => p.packId === existing?.packId)?.level;
  /** The pack to save for a level: keep the learner's subject there, else that level's first subject. */
  const packForLevel = (level) => {
    const at = levels.find((l) => l.level === level)?.packs || [];
    return (at.find((p) => p.packId === existing?.packId) || at[0])?.packId || '';
  };
  return openDialog((close) => {
    let avatar = existing?.avatar || AVATARS[0];
    const error = h('p.form-error', { role: 'alert' });

    const avatarButtons = AVATARS.map((a) => h(`button.avatar-option${a === avatar ? '.selected' : ''}`, {
      type: 'button',
      'aria-label': a,
      'aria-pressed': String(a === avatar),
      onclick: (event) => {
        avatar = a;
        for (const b of avatarButtons) {
          const on = b === event.currentTarget;
          b.classList.toggle('selected', on);
          b.setAttribute('aria-pressed', String(on));
        }
      },
    }, a));

    // One choice per grade; subjects (Math, English) are switched on the home screen.
    const gradeSelect = h('select', { name: 'level', required: true },
      levels.map((l) => h('option', { value: l.level, selected: l.level === currentLevel }, l.levelName)));

    const readAloud = toggle('readAloud', 'Read questions aloud automatically', existing ? existing.readAloud : false);
    // Pre-readers and early readers (packs marked young or readAloud) get read-aloud on by default.
    gradeSelect.addEventListener('change', () => {
      if (existing) return;
      const pack = packs.find((p) => p.packId === packForLevel(gradeSelect.value));
      readAloud.querySelector('input').checked = Boolean(pack?.young || pack?.readAloud);
    });
    gradeSelect.dispatchEvent(new Event('change'));

    // Language of the buttons and labels on this learner's screens. Questions stay in their subject's language.
    const currentLanguage = existing?.language || DEFAULT_LANGUAGE;
    const languageSelect = h('select', { name: 'language' },
      LANGUAGES.map((l) => h('option', { value: l.code, selected: l.code === currentLanguage }, l.name)));

    const form = h('form.dialog-body.form', {
      onsubmit: async (event) => {
        event.preventDefault();
        const data = new FormData(form);
        const submit = form.querySelector('button[type=submit]');
        submit.disabled = true;
        try {
          const saved = await saveProfile({
            profileId: existing?.profileId,
            name: data.get('name'),
            avatar,
            packId: packForLevel(data.get('level')),
            readAloud: data.get('readAloud') === 'on',
            language: data.get('language'),
          });
          close(saved);
        } catch (err) {
          error.textContent = err.message;
          submit.disabled = false;
        }
      },
    },
    h('h2.dialog-title', null, existing ? t('editLearner') : t('addLearner')),
    h('label.field', null, h('span', null, t('name')),
      h('input', { name: 'name', required: true, maxlength: 30, autocomplete: 'off', value: existing?.name || '', autofocus: true })),
    h('div.field', null, h('span', null, t('avatar')), h('div.avatar-grid', null, avatarButtons)),
    h('label.field', null, h('span', null, t('grade')), gradeSelect),
    h('label.field', null, h('span', null, t('labelLanguage')), languageSelect),
    readAloud,
    error,
    h('div.dialog-actions', null,
      h('button.btn.btn-ghost', { type: 'button', onclick: () => close(null) }, t('cancel')),
      h('button.btn.btn-primary', { type: 'submit' }, t('save'))),
    );
    return form;
  });
};
