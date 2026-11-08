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
  listProfiles, getMasteryMap, getRewards, getSessionsSince, deleteProfile, getSetting, setSetting, saveGoal,
} from '../../data/repo.js';
import { normaliseGoal } from '../../engine/goals.js';
import { setSfxEnabled, sfxEnabled, playSfx } from '../../core/sfx.js';
import { loadPack, subjectsAtLevel, resetPackCaches } from '../../data/packs.js';
import { downloadBackup, readBackupFile, restoreAll, validateBackup } from '../../data/backup.js';
import { statusOf } from '../../engine/mastery.js';
import { dayKey, currentStreak } from '../../engine/rewards.js';
import { openProfileEditor, statusPill, toggle, avatarBadge, looksFor } from '../components/common.js';
import { listVoices, getVoiceSettings, setVoiceSettings, speak } from '../../core/speech.js';
import { customPacksPanel } from './parentPacks.js';
import { renderWeeklyReport } from './report.js';

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

/**
 * Run a parent action and show a clear message if it fails (e.g. storage is
 * full, or the browser has no secure crypto because the app is on plain http).
 */
const safely = (action) => async (...args) => {
  try {
    await action(...args);
  } catch (error) {
    console.error(error);
    toast(`That did not work: ${error.message || error}`, 'error');
  }
};

const checkPin = async (pin) => {
  const stored = await getSetting(PIN_KEY);
  return Boolean(stored) && (await hashPin(pin, stored.salt)) === stored.hash;
};

const setPinFlow = safely(async () => {
  const pin = await askPin('Set a parent PIN', '4 to 6 digits. Children will need it to open this area.');
  if (pin === null) return;
  if (!isValidPin(pin)) { toast('The PIN must be 4 to 6 digits.', 'error'); return; }
  const again = await askPin('Type the PIN again');
  if (again !== pin) { toast('The PINs did not match. Nothing was changed.', 'error'); return; }
  const salt = newSalt();
  await setSetting(PIN_KEY, { salt, hash: await hashPin(pin, salt) });
  toast('Parent PIN saved.', 'success');
  setParentUnlocked(true); // the parent who just set it stays in
  render();
});

const removePinFlow = safely(async () => {
  if (!await confirmDialog({ title: 'Remove the PIN?', message: 'Anyone will be able to open the parent area.', confirmText: 'Remove', danger: true })) return;
  await setSetting(PIN_KEY, null);
  toast('PIN removed.', 'success');
  render();
});

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

/** One topics table per subject at the child's level (Math, English…). */
const topicsTable = (indexed, mastery, withSubject) => [
  h('h3', null, withSubject ? `${indexed.entry.subjectName || indexed.pack.title} topics` : 'Topics'),
  h('div.table-wrap', null, h('table.data-table', null,
    h('thead', null, h('tr', null, h('th', null, 'Topic'), h('th', null, 'Mastered'), h('th', null, 'Accuracy'), h('th', null, 'Answered'))),
    h('tbody', null, topicRows(indexed, mastery).map((r) => h('tr', null,
      h('td', null, r.topic.title),
      h('td', null, `${r.mastered} / ${r.topic.skills.length}`),
      h('td', null, r.accuracy === null ? '–' : `${r.accuracy}%`),
      h('td', null, r.attempts)))))),
];

const childReport = async (profile, look) => {
  const [subjects, mastery, rewards, sessions] = await Promise.all([
    subjectsAtLevel(profile.packId),
    getMasteryMap(profile.profileId),
    getRewards(profile.profileId),
    getSessionsSince(profile.profileId, Date.now() - ACTIVITY_DAYS * DAY_MS),
  ]);
  // Every subject at this level; the learner's current one first. A pack that fails to load is skipped.
  const ordered = [...subjects].sort((a, b) => (b.packId === profile.packId) - (a.packId === profile.packId));
  const packs = (await Promise.all(ordered.map((p) => loadPack(p.packId).catch(() => null)))).filter(Boolean);
  if (!packs.length) packs.push(await loadPack(profile.packId));
  const skillTitle = (id) => packs.find((p) => p.skillById.has(id))?.skillById.get(id).title;
  const weak = [...mastery.values()]
    .filter((r) => statusOf(r) === 'learning' && skillTitle(r.skillId))
    .sort((a, b) => a.score - b.score)
    .slice(0, 5);
  const weekAgo = Date.now() - 7 * DAY_MS;
  const week = sessions.filter((s) => s.finishedAt >= weekAgo);
  const weekQuestions = week.reduce((n, s) => n + s.total, 0);
  const weekCorrect = week.reduce((n, s) => n + s.correct, 0);
  const weekMinutes = Math.round(week.reduce((n, s) => n + (s.durationMs || 0), 0) / 60000);

  return h('section.report', null,
    h('div.report-head', null,
      avatarBadge(profile, look, 'md'),
      h('div', null, h('h2', null, profile.name), h('small.muted', null, packs[0].entry.levelName || packs[0].pack.title))),
    h('div.stat-row', null,
      h('div.stat', null, h('strong', null, weekQuestions), h('small', null, 'Questions this week')),
      h('div.stat', null, h('strong', null, weekQuestions ? `${Math.round((weekCorrect / weekQuestions) * 100)}%` : '–'), h('small', null, 'Accuracy this week')),
      h('div.stat', null, h('strong', null, weekMinutes), h('small', null, 'Minutes this week')),
      h('div.stat', null, h('strong', null, currentStreak(rewards)), h('small', null, t('streak')))),
    activityChart(sessions),
    ...packs.flatMap((indexed) => topicsTable(indexed, mastery, packs.length > 1)),
    h('h3', null, 'Needs practice'),
    weak.length
      ? h('ul.weak-list', null, weak.map((r) => h('li', null,
        h('span', null, skillTitle(r.skillId)), statusPill('learning'), h('small.muted', null, `score ${Math.round(r.score)}`))))
      : h('p.muted', null, 'Nothing flagged yet. Skills appear here when the score is low.'),
  );
};

/* ------------------------------------------------------------------ */
/* Settings pieces                                                     */
/* ------------------------------------------------------------------ */

const learnersPanel = (profiles, looks) => h('section.panel', null,
  h('h2', null, 'Learners'),
  h('ul.manage-list', null, profiles.map((p) => h('li', null,
    avatarBadge(p, looks.get(p.profileId)),
    h('span.grow', null, p.name),
    h('button.btn.btn-secondary.btn-sm', { type: 'button', onclick: async () => { if (await openProfileEditor(p)) render(); } }, 'Edit'),
    h('button.btn.btn-danger.btn-sm', {
      type: 'button',
      onclick: safely(async () => {
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
      }),
    }, t('delete'))))),
  h('button.btn.btn-primary', { type: 'button', onclick: async () => { if (await openProfileEditor()) render(); } }, '+ ', t('addLearner')));

/**
 * Goals: practice sets per day, days per week and an optional reward.
 * The child sees their progress on the home screen.
 */
const goalsPanel = (profiles, looks) => h('section.panel.form', null,
  h('h2', null, 'Goals'),
  h('p.muted', null, 'Set a daily practice goal. Your child sees it on their home screen with a week tracker. Add a reward to look forward to when the week is complete.'),
  profiles.map((p) => {
    const goal = normaliseGoal(p.goal);
    const sets = h('select', { name: 'setsPerDay', 'aria-label': `Practice sets per day for ${p.name}` },
      [0, 1, 2, 3, 4, 5].map((n) => h('option', { value: n, selected: n === goal.setsPerDay }, n === 0 ? 'No goal' : `${n} set${n === 1 ? '' : 's'} a day`)));
    const days = h('select', { name: 'daysPerWeek', 'aria-label': `Days per week for ${p.name}` },
      [3, 4, 5, 6, 7].map((n) => h('option', { value: n, selected: n === goal.daysPerWeek }, `${n} days a week`)));
    const reward = h('input', { name: 'reward', maxlength: 60, placeholder: 'Reward (optional), e.g. ice cream 🍦', value: goal.reward, 'aria-label': `Reward for ${p.name}` });
    const form = h('form.goal-form', {
      onsubmit: async (event) => {
        event.preventDefault();
        const btn = form.querySelector('button');
        btn.disabled = true;
        try {
          await saveGoal(p.profileId, { setsPerDay: sets.value, daysPerWeek: days.value, reward: reward.value });
          toast(`Goal saved for ${p.name}.`, 'success');
        } catch (error) {
          toast(error.message, 'error');
        } finally {
          btn.disabled = false;
        }
      },
    },
    h('span.goal-who', null, avatarBadge(p, looks.get(p.profileId)), h('strong', null, p.name)),
    sets, days, reward,
    h('button.btn.btn-primary.btn-sm', { type: 'submit' }, t('save')));
    return form;
  }));

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
        message: `This replaces ALL learners, progress and sound settings on this device with the backup from ${String(backup.exportedAt).slice(0, 10)} (${backup.data.profiles.length} learner${backup.data.profiles.length === 1 ? '' : 's'}). This device keeps its own parent PIN.`,
        confirmText: 'Replace and restore',
        danger: true,
      });
      if (!ok) return;
      const count = await withLoading(() => restoreAll(backup), 'Restoring…');
      resetPackCaches(); // the backup may bring its own question packs
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
  const sfx = toggle('sfx', 'Sound effects and music (dings, pops, cheers)', sfxEnabled());
  sfx.addEventListener('change', async () => {
    const on = sfx.querySelector('input').checked;
    setSfxEnabled(on);
    await setSetting('sfx', on);
    if (on) playSfx('correct');
  });
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
    h('h2', null, 'Voice and sounds'),
    enabled,
    sfx,
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
/* Support (optional donation, parents only)                           */
/* ------------------------------------------------------------------ */

/** The app is free; parents who want to can send a tip by GCash. */
const SUPPORT = Object.freeze({ method: 'GCash', number: '09952938507' });

/** "09952938507" -> "0995 293 8507" (easier to read and type). */
const groupedNumber = (n) => n.replace(/^(\d{4})(\d{3})(\d{4})$/, '$1 $2 $3');

/** Copy text; falls back to a hidden input on browsers without the Clipboard API (e.g. plain http). */
const copyText = async (text) => {
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const input = h('input', { value: text, readonly: true, 'aria-hidden': 'true', style: { position: 'fixed', opacity: '0' } });
  document.body.append(input);
  input.select();
  const ok = document.execCommand('copy');
  input.remove();
  if (!ok) throw new Error('copy not supported');
};

const supportPanel = () => h('section.panel.support-panel', null,
  h('h2', null, '💙 Support this app'),
  h('p.muted', null, `LearnOffline is free, with no ads. If it helps your family, you can send a small tip by ${SUPPORT.method}. Thank you!`),
  h('div.support-row', null,
    h('span.support-label', null, SUPPORT.method),
    h('strong.support-number', null, groupedNumber(SUPPORT.number)),
    h('button.btn.btn-secondary.btn-sm', {
      type: 'button',
      onclick: async () => {
        try {
          await copyText(SUPPORT.number);
          toast('Number copied. Paste it in GCash → Send Money.', 'success');
        } catch {
          toast(`Could not copy. The number is ${groupedNumber(SUPPORT.number)}.`, 'error');
        }
      },
    }, '📋 Copy number')));

/* ------------------------------------------------------------------ */
/* Screen                                                              */
/* ------------------------------------------------------------------ */

export const renderParent = async (view, section, ...args) => {
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
          onclick: safely(async () => {
            const pin = await askPin('Enter parent PIN');
            if (pin === null) return;
            if (await checkPin(pin)) { setParentUnlocked(true); render(); } else toast('Wrong PIN.', 'error');
          }),
        }, 'Enter PIN')),
    );
    return;
  }

  // #/parent/report/<weeksAgo>/<who>: the printable weekly report, behind the same PIN.
  if (section === 'report') {
    await renderWeeklyReport(view, ...args);
    return;
  }

  const [profiles, packsPanel] = await Promise.all([listProfiles(), customPacksPanel()]);
  const looks = await looksFor(profiles);
  const reports = h('div.reports');
  view.append(
    h('header.learner-bar', null,
      h('a.icon-btn', { href: '#/', 'aria-label': t('back'), onclick: () => setParentUnlocked(false) }, '←'),
      h('strong', null, t('parents'))),
    h('div.page-title-row', null,
      h('h1.page-title', null, 'Progress'),
      profiles.length > 0 && h('a.btn.btn-secondary.btn-sm', { href: '#/parent/report/0/all' }, '🖨 Weekly report')),
    profiles.length ? reports : h('p.muted', null, 'No learners yet. Add one below.'),
    learnersPanel(profiles, looks),
    profiles.length > 0 && goalsPanel(profiles, looks),
    packsPanel,
    voicePanel(),
    backupPanel(),
    pinPanel(hasPin),
    supportPanel(),
  );
  // Reports load in parallel; each child's data is read with indexed queries only.
  mount(reports, await Promise.all(profiles.map((p) => childReport(p, looks.get(p.profileId)))));
};
