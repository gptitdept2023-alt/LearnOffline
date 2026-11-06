/**
 * Parent area: progress dashboard, learner management, PIN and backups.
 * Protected by an optional PIN so children stay in the learning screens.
 */

import { h, mount, svg, openDialog, confirmDialog, toast, withLoading } from '../../core/dom.js';
import { t } from '../../core/i18n.js';
import { render } from '../../core/router.js';
import { getState, setParentUnlocked } from '../../core/state.js';
import { hashPin, newSalt, isValidPin } from '../../core/pin.js';
import {
  listProfiles, getMasteryMap, getRewards, getSessionsSince, deleteProfile, getSetting, setSetting,
} from '../../data/repo.js';
import { loadPack } from '../../data/packs.js';
import { downloadBackup, readBackupFile, restoreAll, validateBackup } from '../../data/backup.js';
import { statusOf } from '../../engine/mastery.js';
import { dayKey, currentStreak } from '../../engine/rewards.js';
import { openProfileEditor, statusPill, toggle } from '../components/common.js';
import { listVoices, getVoiceSettings, setVoiceSettings, speak } from '../../core/speech.js';

const PIN_KEY = 'parentPin';
const ACTIVITY_DAYS = 14;
const DAY_MS = 86_400_000;

/* ------------------------------------------------------------------ */
/* PIN                                                                 */
/* ------------------------------------------------------------------ */

/** Ask for a PIN in a dialog. Resolves with the PIN string or null. */
const askPin = (title, help) => openDialog((close) => {
  const input = h('input.pin-input', { type: 'password', inputmode: 'numeric', autocomplete: 'off', maxlength: 6, autofocus: true, 'aria-label': 'PIN' });
  return h('form.dialog-body.form', { onsubmit: (e) => { e.preventDefault(); close(input.value.trim()); } },
    h('h2.dialog-title', null, title),
    help && h('p.muted', null, help),
    input,
    h('div.dialog-actions', null,
      h('button.btn.btn-ghost', { type: 'button', onclick: () => close(null) }, t('cancel')),
      h('button.btn.btn-primary', { type: 'submit' }, 'OK')));
});

const checkPin = async (pin) => {
  const stored = await getSetting(PIN_KEY);
  return Boolean(stored) && (await hashPin(pin, stored.salt)) === stored.hash;
};

const setPinFlow = async () => {
  const pin = await askPin('Set a parent PIN', '4 to 6 digits. Children will need it to open this area.');
  if (pin === null) return;
  if (!isValidPin(pin)) { toast('The PIN must be 4 to 6 digits.', 'error'); return; }
  const again = await askPin('Type the PIN again');
  if (again !== pin) { toast('The PINs did not match. Nothing was changed.', 'error'); return; }
  const salt = newSalt();
  await setSetting(PIN_KEY, { salt, hash: await hashPin(pin, salt) });
  toast('Parent PIN saved.', 'success');
  render();
};

const removePinFlow = async () => {
  if (!await confirmDialog({ title: 'Remove the PIN?', message: 'Anyone will be able to open the parent area.', confirmText: 'Remove', danger: true })) return;
  await setSetting(PIN_KEY, null);
  toast('PIN removed.', 'success');
  render();
};

/* ------------------------------------------------------------------ */
/* Dashboard pieces                                                    */
/* ------------------------------------------------------------------ */

/** Bar chart of questions answered per day for the last 14 days. */
const activityChart = (sessions) => {
  const today = new Date();
  const days = Array.from({ length: ACTIVITY_DAYS }, (_, i) => dayKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() - (ACTIVITY_DAYS - 1 - i))));
  const perDay = new Map(days.map((d) => [d, 0]));
  for (const s of sessions) {
    const key = dayKey(s.finishedAt);
    if (perDay.has(key)) perDay.set(key, perDay.get(key) + s.total);
  }
  const max = Math.max(10, ...perDay.values());
  const w = 300 / ACTIVITY_DAYS;
  const bars = days.map((d, i) => {
    const v = perDay.get(d);
    const bh = (v / max) * 80;
    return [
      svg('rect', { x: i * w + 3, y: 90 - bh, width: w - 6, height: Math.max(bh, v ? 2 : 0), rx: 2, class: 'chart-bar' },
        svg('title', {}, `${d}: ${v} questions`)),
      (i % 2 === 1 || i === ACTIVITY_DAYS - 1) && svg('text', { x: i * w + w / 2, y: 104, class: 'chart-label' }, d.slice(8)),
    ];
  });
  return h('figure.chart', null,
    svg('svg', { viewBox: '0 0 300 110', role: 'img', 'aria-label': 'Questions answered per day, last 14 days' },
      svg('line', { x1: 0, y1: 90, x2: 300, y2: 90, class: 'chart-axis' }), bars),
    h('figcaption.muted', null, 'Questions answered per day, last 14 days'));
};

/** Per-topic accuracy and mastery for one child, from mastery records (no attempt scan). */
const topicRows = (indexed, mastery) => indexed.pack.topics.map((topic) => {
  let attempts = 0;
  let correct = 0;
  let mastered = 0;
  for (const s of topic.skills) {
    const rec = mastery.get(s.skillId);
    if (!rec) continue;
    attempts += rec.attempts;
    correct += rec.correct;
    if (statusOf(rec) === 'mastered') mastered += 1;
  }
  return { topic, attempts, accuracy: attempts ? Math.round((correct / attempts) * 100) : null, mastered };
});

const childReport = async (profile) => {
  const [indexed, mastery, rewards, sessions] = await Promise.all([
    loadPack(profile.packId),
    getMasteryMap(profile.profileId),
    getRewards(profile.profileId),
    getSessionsSince(profile.profileId, Date.now() - ACTIVITY_DAYS * DAY_MS),
  ]);
  const rows = topicRows(indexed, mastery);
  const weak = [...mastery.values()]
    .filter((r) => statusOf(r) === 'learning' && indexed.skillById.has(r.skillId))
    .sort((a, b) => a.score - b.score)
    .slice(0, 5);
  const weekAgo = Date.now() - 7 * DAY_MS;
  const week = sessions.filter((s) => s.finishedAt >= weekAgo);
  const weekQuestions = week.reduce((n, s) => n + s.total, 0);
  const weekCorrect = week.reduce((n, s) => n + s.correct, 0);
  const weekMinutes = Math.round(week.reduce((n, s) => n + (s.durationMs || 0), 0) / 60000);

  return h('section.report', null,
    h('div.report-head', null,
      h('span.avatar.avatar-md', { 'aria-hidden': 'true' }, profile.avatar),
      h('div', null, h('h2', null, profile.name), h('small.muted', null, indexed.pack.title))),
    h('div.stat-row', null,
      h('div.stat', null, h('strong', null, weekQuestions), h('small', null, 'Questions this week')),
      h('div.stat', null, h('strong', null, weekQuestions ? `${Math.round((weekCorrect / weekQuestions) * 100)}%` : '–'), h('small', null, 'Accuracy this week')),
      h('div.stat', null, h('strong', null, weekMinutes), h('small', null, 'Minutes this week')),
      h('div.stat', null, h('strong', null, currentStreak(rewards)), h('small', null, t('streak')))),
    activityChart(sessions),
    h('h3', null, 'Topics'),
    h('div.table-wrap', null, h('table.data-table', null,
      h('thead', null, h('tr', null, h('th', null, 'Topic'), h('th', null, 'Mastered'), h('th', null, 'Accuracy'), h('th', null, 'Answered'))),
      h('tbody', null, rows.map((r) => h('tr', null,
        h('td', null, r.topic.title),
        h('td', null, `${r.mastered} / ${r.topic.skills.length}`),
        h('td', null, r.accuracy === null ? '–' : `${r.accuracy}%`),
        h('td', null, r.attempts)))))),
    h('h3', null, 'Needs practice'),
    weak.length
      ? h('ul.weak-list', null, weak.map((r) => h('li', null,
        h('span', null, indexed.skillById.get(r.skillId).title), statusPill('learning'), h('small.muted', null, `score ${Math.round(r.score)}`))))
      : h('p.muted', null, 'Nothing flagged yet. Skills appear here when the score is low.'),
  );
};

/* ------------------------------------------------------------------ */
/* Settings pieces                                                     */
/* ------------------------------------------------------------------ */

const learnersPanel = (profiles) => h('section.panel', null,
  h('h2', null, 'Learners'),
  h('ul.manage-list', null, profiles.map((p) => h('li', null,
    h('span.avatar.avatar-sm', { 'aria-hidden': 'true' }, p.avatar),
    h('span.grow', null, p.name),
    h('button.btn.btn-secondary.btn-sm', { type: 'button', onclick: async () => { if (await openProfileEditor(p)) render(); } }, 'Edit'),
    h('button.btn.btn-danger.btn-sm', {
      type: 'button',
      onclick: async () => {
        const ok = await confirmDialog({
          title: `Delete ${p.name}?`,
          message: `All of ${p.name}'s progress, stars and badges on this device will be deleted. This cannot be undone. Make a backup first if you may need it.`,
          confirmText: 'Delete',
          danger: true,
        });
        if (!ok) return;
        await withLoading(() => deleteProfile(p.profileId), 'Deleting…');
        toast(`${p.name} was deleted.`, 'success');
        render();
      },
    }, t('delete'))))),
  h('button.btn.btn-primary', { type: 'button', onclick: async () => { if (await openProfileEditor()) render(); } }, '+ ', t('addLearner')));

const backupPanel = () => {
  const fileInput = h('input', { type: 'file', accept: 'application/json,.json', hidden: true });
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files[0];
    fileInput.value = '';
    if (!file) return;
    try {
      const backup = await readBackupFile(file);
      const problem = validateBackup(backup);
      if (problem) throw new Error(problem);
      const ok = await confirmDialog({
        title: 'Restore this backup?',
        message: `This replaces ALL learners and progress on this device with the backup from ${String(backup.exportedAt).slice(0, 10)} (${backup.data.profiles.length} learners).`,
        confirmText: 'Replace and restore',
        danger: true,
      });
      if (!ok) return;
      const count = await withLoading(() => restoreAll(backup), 'Restoring…');
      toast(`Restored ${count} learner${count === 1 ? '' : 's'}.`, 'success');
      render();
    } catch (error) {
      toast(error.message, 'error');
    }
  });

  return h('section.panel', null,
    h('h2', null, 'Backup and move to another device'),
    h('p.muted', null, 'Progress is saved on this device only. Download a backup to keep it safe, or to move it between the PC and the phone: download here, then restore on the other device.'),
    h('div.button-row', null,
      h('button.btn.btn-primary', {
        type: 'button',
        onclick: async () => {
          try {
            await withLoading(downloadBackup, 'Preparing backup…');
            await setSetting('lastBackupAt', Date.now());
            toast('Backup downloaded.', 'success');
          } catch (error) {
            toast(`Backup failed: ${error.message}`, 'error');
          }
        },
      }, '⬇ Download backup'),
      h('button.btn.btn-secondary', { type: 'button', onclick: () => fileInput.click() }, '⬆ Restore from file'),
      fileInput));
};

/** Voice settings: recorded voice on/off, device voice, speed and pitch. */
const voicePanel = () => {
  const current = getVoiceSettings();
  const voices = listVoices();
  const recorded = toggle('recorded', 'Use the recorded friendly voice (works offline)', current.recorded);
  const enabled = toggle('enabled', 'Read aloud', current.enabled);
  const select = h('select', { name: 'voiceURI' },
    h('option', { value: '' }, 'Best available (automatic)'),
    voices.map((v) => h('option', { value: v.voiceURI, selected: v.voiceURI === current.voiceURI }, `${v.name}${v.offline ? '' : ' (needs internet)'}`)));
  const rate = h('input', { type: 'range', min: 0.6, max: 1.2, step: 0.05, value: String(current.rate), 'aria-label': 'Speed' });
  const pitch = h('input', { type: 'range', min: 0.8, max: 1.5, step: 0.05, value: String(current.pitch), 'aria-label': 'Pitch' });

  const read = () => ({
    enabled: enabled.querySelector('input').checked,
    recorded: recorded.querySelector('input').checked,
    voiceURI: select.value,
    rate: Number(rate.value),
    pitch: Number(pitch.value),
  });
  const save = async () => {
    const next = read();
    setVoiceSettings(next);
    await setSetting('voice', next);
  };
  for (const el of [enabled, recorded, select, rate, pitch]) el.addEventListener('change', save);

  return h('section.panel.form', null,
    h('h2', null, 'Voice'),
    enabled,
    recorded,
    h('label.field', null, h('span', null, 'Device voice (used for sentences that are not recorded)'), select),
    h('label.field', null, h('span', null, 'Speed'), rate),
    h('label.field', null, h('span', null, 'Pitch'), pitch),
    h('div.button-row', null,
      h('button.btn.btn-secondary', { type: 'button', onclick: async () => { await save(); speak('Great job! 8 plus 5 equals 13.'); } }, '🔊 Test recorded voice'),
      h('button.btn.btn-ghost', { type: 'button', onclick: async () => { await save(); speak(`Let's count: ${Math.floor(Math.random() * 90) + 10} and 7 more.`); } }, '🔊 Test device voice')),
    h('p.muted', null, 'Tip: for a better device voice, on Android open Settings → Accessibility → Text-to-speech, choose “Speech Services by Google” and download a voice. On Windows open Settings → Time & language → Speech → Add voices.'));
};

const pinPanel = (hasPin) => h('section.panel', null,
  h('h2', null, 'Parent PIN'),
  h('p.muted', null, hasPin ? 'A PIN protects this area.' : 'No PIN set. Children can open this area.'),
  h('div.button-row', null,
    h('button.btn.btn-secondary', { type: 'button', onclick: setPinFlow }, hasPin ? 'Change PIN' : 'Set PIN'),
    hasPin && h('button.btn.btn-ghost', { type: 'button', onclick: removePinFlow }, 'Remove PIN')));

/* ------------------------------------------------------------------ */
/* Screen                                                              */
/* ------------------------------------------------------------------ */

export const renderParent = async (view) => {
  const stored = await getSetting(PIN_KEY);
  const hasPin = Boolean(stored);

  if (hasPin && !getState().parentUnlocked) {
    view.append(
      h('header.learner-bar', null, h('a.icon-btn', { href: '#/', 'aria-label': t('back') }, '←'), h('strong', null, t('parents'))),
      h('section.panel.center', null,
        h('h1', null, '🔒 Parents only'),
        h('button.btn.btn-primary.btn-lg', {
          type: 'button',
          autofocus: true,
          onclick: async () => {
            const pin = await askPin('Enter parent PIN');
            if (pin === null) return;
            if (await checkPin(pin)) { setParentUnlocked(true); render(); } else toast('Wrong PIN.', 'error');
          },
        }, 'Enter PIN')),
    );
    return;
  }

  const profiles = await listProfiles();
  const reports = h('div.reports');
  view.append(
    h('header.learner-bar', null,
      h('a.icon-btn', { href: '#/', 'aria-label': t('back'), onclick: () => setParentUnlocked(false) }, '←'),
      h('strong', null, t('parents'))),
    h('h1.page-title', null, 'Progress'),
    profiles.length ? reports : h('p.muted', null, 'No learners yet. Add one below.'),
    learnersPanel(profiles),
    voicePanel(),
    backupPanel(),
    pinPanel(hasPin),
  );
  // Reports load in parallel; each child's data is read with indexed queries only.
  mount(reports, await Promise.all(profiles.map(childReport)));
};
