/**
 * Reusable UI pieces shared by several screens.
 */

import { h, openDialog } from '../../core/dom.js';
import { t } from '../../core/i18n.js';
import { currentStreak } from '../../engine/rewards.js';
import { saveProfile } from '../../data/repo.js';
import { loadPackIndex } from '../../data/packs.js';

export const AVATARS = ['🦊', '🐼', '🐯', '🐸', '🐵', '🦁', '🐨', '🐙', '🦄', '🐢', '🐧', '🦉'];

/** Top bar for a learner's screens: who is learning, stars, streak. */
export const learnerBar = (profile, rewards, { back } = {}) =>
  h('header.learner-bar', null,
    back
      ? h('a.icon-btn', { href: back, 'aria-label': t('back') }, '←')
      : h('a.icon-btn', { href: '#/', 'aria-label': t('switchLearner'), title: t('switchLearner') }, '⇄'),
    h('span.avatar.avatar-sm', { 'aria-hidden': 'true' }, profile.avatar),
    h('strong.learner-name', null, profile.name),
    h('span.spacer'),
    h('a.chip', { href: '#/badges', title: t('stars') }, '⭐ ', h('span', null, rewards.stars)),
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

    const gradeSelect = h('select', { name: 'packId', required: true },
      packs.map((p) => h('option', { value: p.packId, selected: p.packId === existing?.packId }, p.title)));

    const readAloud = toggle('readAloud', 'Read questions aloud automatically', existing ? existing.readAloud : false);
    // Pre-readers get read-aloud on by default when a young pack is chosen.
    gradeSelect.addEventListener('change', () => {
      if (existing) return;
      const pack = packs.find((p) => p.packId === gradeSelect.value);
      readAloud.querySelector('input').checked = Boolean(pack?.young);
    });
    gradeSelect.dispatchEvent(new Event('change'));

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
            packId: data.get('packId'),
            readAloud: data.get('readAloud') === 'on',
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
    readAloud,
    error,
    h('div.dialog-actions', null,
      h('button.btn.btn-ghost', { type: 'button', onclick: () => close(null) }, t('cancel')),
      h('button.btn.btn-primary', { type: 'submit' }, t('save'))),
    );
    return form;
  });
};
