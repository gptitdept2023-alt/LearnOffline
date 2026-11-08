/**
 * Start screen: "Who is learning today?" One tap picks a learner.
 */

import { h, toast } from '../../core/dom.js';
import { t } from '../../core/i18n.js';
import { navigate } from '../../core/router.js';
import { activateProfile, clearProfile } from '../../core/state.js';
import { listProfiles, MAX_PROFILES } from '../../data/repo.js';
import { openProfileEditor, avatarBadge, looksFor } from '../components/common.js';

export const renderStart = async (view) => {
  clearProfile();
  const profiles = await listProfiles();
  const looks = await looksFor(profiles);

  const choose = async (profileId) => {
    try {
      await activateProfile(profileId);
      navigate('home');
    } catch (error) {
      toast(error.message, 'error');
    }
  };

  const add = async () => {
    const saved = await openProfileEditor();
    if (saved) choose(saved.profileId);
  };

  // Native append() would print false, so the optional hint is filtered out.
  view.append(...[
    h('div.start-hero', null,
      h('div.brand', null, h('span.brand-mark', { 'aria-hidden': 'true' }, '✏️'), t('appName')),
      h('h1', null, t('whoIsLearning'))),
    h('div.learner-grid', null,
      profiles.map((p) => h('button.learner-card', { type: 'button', onclick: () => choose(p.profileId) },
        avatarBadge(p, looks.get(p.profileId), 'lg'),
        h('span.learner-card-name', null, p.name))),
      profiles.length < MAX_PROFILES && h('button.learner-card.learner-card-add', { type: 'button', onclick: add },
        h('span.avatar.avatar-lg', { 'aria-hidden': 'true' }, '+'),
        h('span.learner-card-name', null, t('addLearner')))),
    profiles.length === 0 && h('p.muted.center', null, 'Add each child as a learner. Their progress is saved on this device.'),
    h('div.start-footer', null, h('a.btn.btn-ghost', { href: '#/parent' }, '🔒 ', t('parents'))),
  ].filter(Boolean));
};
