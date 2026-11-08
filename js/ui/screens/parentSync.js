/**
 * Parents → "Sync PC and phone": make a sync file on one device, merge it on
 * the other. Merging only adds (no learner, answer or star is ever removed),
 * shows a preview first, and the last merge can be undone with one tap.
 * The merge rules live in js/engine/syncMerge.js; storage in js/data/sync.js.
 */

import { h, openDialog, confirmDialog, toast, withLoading } from '../../core/dom.js';
import { render } from '../../core/router.js';
import { getState, activateProfile } from '../../core/state.js';
import { resetPackCaches } from '../../data/packs.js';
import {
  shareSyncFile, readSyncFile, suggestLinksFor, previewMerge, applyMerge, syncStatus, undoLastMerge,
} from '../../data/sync.js';

const ADD_NEW = '__new__';
const LEAVE_OUT = '__skip__';

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
/** The other device's name from the file; it is only ever shown as text. */
const fromText = (file) => (typeof file.deviceLabel === 'string' && file.deviceLabel ? file.deviceLabel.slice(0, 40) : 'the other device');
const dateText = (ms) => new Date(ms).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

/** After the data changed underneath the app: reload packs and the active learner, then redraw. */
const afterDataChange = async () => {
  resetPackCaches(); // the other device may have brought its own question packs
  const { profile } = getState();
  if (profile) await activateProfile(profile.profileId).catch(() => {});
  render();
};

/**
 * Step 1: for each learner in the file, choose who they are on this device.
 * @returns {Promise<{links: Map, skip: Set}|null>} null when cancelled.
 */
const chooseLinks = (file, localProfiles, suggested) => openDialog((close) => {
  const rows = file.data.profiles.map((incoming) => {
    const pick = suggested.get(incoming.profileId);
    const select = h('select', { 'aria-label': `Who is ${incoming.name} on this device?` },
      localProfiles.map((p) => h('option', { value: p.profileId, selected: p.profileId === pick }, `Same as ${p.name} here`)),
      h('option', { value: ADD_NEW, selected: !pick }, 'Add as a new learner'),
      h('option', { value: LEAVE_OUT }, 'Leave out'));
    return { incoming, select, row: h('label.field', null, h('span', null, incoming.name), select) };
  });
  const error = h('p.form-error', { role: 'alert' });

  const next = () => {
    const links = new Map();
    const skip = new Set();
    const used = new Set();
    for (const { incoming, select } of rows) {
      if (select.value === LEAVE_OUT) skip.add(incoming.profileId);
      else if (select.value === ADD_NEW) links.set(incoming.profileId, null);
      else {
        // Two learners from the file into one learner here would mix their stars up.
        if (used.has(select.value)) {
          error.textContent = 'Each learner on this device can be matched only once.';
          return;
        }
        used.add(select.value);
        links.set(incoming.profileId, select.value);
      }
    }
    if (skip.size === rows.length) {
      error.textContent = 'Choose at least one learner to bring in.';
      return;
    }
    close({ links, skip });
  };

  return h('div.dialog-body', null,
    h('h2.dialog-title', null, 'Who is who?'),
    h('p', null, `This file is from ${fromText(file)}, made ${dateText(Date.parse(file.exportedAt))}. Match each learner to the same child on this device.`),
    h('div.sync-links', null, rows.map((r) => r.row)),
    error,
    h('div.dialog-actions', null,
      h('button.btn.btn-ghost', { type: 'button', onclick: () => close(null) }, 'Cancel'),
      h('button.btn.btn-primary', { type: 'button', onclick: next }, 'Next')));
});

/** One line per learner in the preview. */
const previewLine = (s) => {
  const parts = [];
  if (s.newSets) parts.push(plural(s.newSets, 'new practice set'));
  if (s.newAnswers) parts.push(plural(s.newAnswers, 'new answer'));
  const stars = s.starsAfter === s.starsBefore
    ? `stars stay at ${s.starsAfter}`
    : `stars ${s.starsBefore} → ${s.starsAfter}`;
  if (!parts.length) parts.push('nothing new');
  parts.push(stars);
  return h('li', null,
    h('strong', null, s.isNew ? `${s.name} (new learner)` : s.name), ': ',
    parts.join(', '),
    s.sharedHistory && h('span.muted', null, ' (both devices share older history, so stars that both have are counted once)'));
};

/** Step 2: show what the merge will add, then confirm. */
const confirmPreview = (plan) => openDialog((close) => {
  const nothingNew = plan.summary.every((s) => !s.isNew && !s.newSets && !s.newAnswers && s.starsAfter === s.starsBefore)
    && Object.values(plan.writes).every((rows) => rows.length === 0);
  return h('div.dialog-body', null,
    h('h2.dialog-title', null, nothingNew ? 'Already up to date' : 'Merge this?'),
    nothingNew
      ? h('p', null, 'This device already has everything in this file. Nothing will change.')
      : h('ul.sync-preview', null, plan.summary.map(previewLine)),
    !nothingNew && h('p.muted', null, 'Nothing on this device is removed. A copy of this device is kept first, so you can undo this merge.'),
    h('div.dialog-actions', null,
      h('button.btn.btn-ghost', { type: 'button', onclick: () => close(false) }, nothingNew ? 'Close' : 'Cancel'),
      !nothingNew && h('button.btn.btn-primary', { type: 'button', autofocus: true, onclick: () => close(true) }, 'Merge')));
}).then(Boolean);

/** The whole merge flow for a file the parent picked. */
const mergeFlow = async (picked) => {
  const file = await readSyncFile(picked);
  const { localProfiles, links: suggested } = await suggestLinksFor(file);
  const choice = await chooseLinks(file, localProfiles, suggested);
  if (!choice) return;
  const plan = await withLoading(() => previewMerge(file, choice.links, choice.skip), 'Checking the file…');
  if (!(await confirmPreview(plan))) return;
  await withLoading(() => applyMerge(plan, fromText(file)), 'Merging…');
  const added = plan.summary.reduce((n, s) => n + s.newSets, 0);
  toast(`Merged. ${plural(added, 'practice set')} added.`, 'success');
  await afterDataChange();
};

const makeFile = async () => {
  try {
    const how = await withLoading(shareSyncFile, 'Preparing sync file…');
    if (how === 'shared') toast('Sync file sent. Open Parents → Merge on the other device.', 'success');
    if (how === 'downloaded') toast('Sync file downloaded. Move it to the other device, then merge it there.', 'success');
  } catch (error) {
    toast(`The sync file could not be made: ${error.message}`, 'error');
  }
};

const undo = async (undoAt) => {
  const ok = await confirmDialog({
    title: 'Undo the last merge?',
    message: `This puts this device back exactly as it was before the merge on ${dateText(undoAt)}. Practice done on this device since then is removed too.`,
    confirmText: 'Undo merge',
    danger: true,
  });
  if (!ok) return;
  try {
    await withLoading(undoLastMerge, 'Undoing…');
    toast('The last merge was undone.', 'success');
    await afterDataChange();
  } catch (error) {
    toast(error.message, 'error');
  }
};

/** The Sync panel. Async because it shows when the last merge happened. */
export const syncPanel = async () => {
  const status = await syncStatus().catch(() => ({ canUndo: false, lastAt: 0, undoAt: 0 }));
  const fileInput = h('input', { type: 'file', accept: 'application/json,.json', hidden: true });
  fileInput.addEventListener('change', async () => {
    const picked = fileInput.files[0];
    fileInput.value = '';
    if (!picked) return;
    try {
      await mergeFlow(picked);
    } catch (error) {
      toast(error.message, 'error');
    }
  });

  return h('section.panel', null,
    h('h2', null, 'Sync PC and phone'),
    h('p.muted', null, 'Use this when the children practise on both the PC and the phone. Make a sync file on one device, then merge it on the other. Merging adds what is missing and never removes anything. To get both devices fully the same, merge both ways.'),
    status.lastAt > 0 && h('p.muted', null, `Last merge on this device: ${dateText(status.lastAt)}.`),
    h('div.button-row', null,
      h('button.btn.btn-primary', { type: 'button', onclick: makeFile }, '📤 Make sync file'),
      h('button.btn.btn-secondary', { type: 'button', onclick: () => fileInput.click() }, '📥 Merge a sync file'),
      status.canUndo && h('button.btn.btn-ghost', { type: 'button', onclick: () => undo(status.undoAt) }, '↩ Undo last merge'),
      fileInput));
};
