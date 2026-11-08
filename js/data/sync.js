/**
 * PC and phone sync with a file: make a sync file on one device, merge it on
 * the other. Merging adds what is missing and never deletes anything (rules in
 * js/engine/syncMerge.js). Before every merge the device keeps a copy of its
 * data, so the last merge can be undone with one tap.
 */

import { STORES, tx, promisify } from './db.js';
import { exportAll } from './backup.js';
import { getSetting, setSetting } from './repo.js';
import { uid } from '../core/random.js';
import { buildSyncFile, planMerge, suggestLinks, validateSyncFile } from '../engine/syncMerge.js';

const DEVICE_KEY = 'deviceId';
const UNDO_KEY = 'syncUndo';
const LAST_SYNC_KEY = 'lastSync';
const MAX_FILE_BYTES = 50 * 1024 * 1024;
const ALL_STORES = Object.values(STORES);

/** This device's id, made once. It tells devices apart in the star counters. */
export const getDeviceId = async () => {
  const existing = await getSetting(DEVICE_KEY);
  if (typeof existing === 'string' && existing) return existing;
  const id = uid('d');
  await setSetting(DEVICE_KEY, id);
  return id;
};

/** A plain name for this kind of device, shown on the other device ("from the phone"). */
const deviceLabel = () => (/Android|iPhone|iPad|Mobile/i.test(navigator.userAgent || '') ? 'the phone or tablet' : 'the computer');

/** Build this device's sync file (as an object). */
export const makeSyncFile = async () => {
  const [backup, deviceId] = await Promise.all([exportAll(), getDeviceId()]);
  return { ...buildSyncFile(backup.data, deviceId), deviceLabel: deviceLabel() };
};

/**
 * Hand the sync file to the parent: the share sheet where the device has one
 * (Android: Nearby Share, Messenger, Drive…), else a download.
 * @returns {Promise<'shared'|'downloaded'|'cancelled'>}
 */
export const shareSyncFile = async () => {
  const file = await makeSyncFile();
  const name = `learnoffline-sync-${file.exportedAt.slice(0, 10)}.json`;
  const blob = new Blob([JSON.stringify(file)], { type: 'application/json' });
  const shareable = typeof File !== 'undefined' ? new File([blob], name, { type: 'application/json' }) : null;
  if (shareable && navigator.canShare?.({ files: [shareable] })) {
    try {
      await navigator.share({ files: [shareable], title: 'LearnOffline sync file' });
      return 'shared';
    } catch (error) {
      if (error?.name === 'AbortError') return 'cancelled';
      // Sharing failed (some browsers refuse JSON files): fall back to a download.
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return 'downloaded';
};

/** Read and check a sync file the parent picked. Throws a friendly error. */
export const readSyncFile = async (file) => {
  if (file.size > MAX_FILE_BYTES) throw new Error('That file is too large to be a sync file.');
  let parsed;
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    throw new Error('This file could not be read as a sync file.');
  }
  const problem = validateSyncFile(parsed, await getDeviceId());
  if (problem) throw new Error(problem);
  return parsed;
};

/** This device's learners and the suggested match for each learner in the file. */
export const suggestLinksFor = async (file) => {
  const local = await exportAll();
  return { localProfiles: local.data.profiles, links: suggestLinks(local.data.profiles, file.data.profiles) };
};

/** Work out the merge without changing anything (for the preview). */
export const previewMerge = async (file, links, skip = new Set()) => {
  const [local, myId] = await Promise.all([exportAll(), getDeviceId()]);
  return planMerge(local.data, file, { myId, links, skip, newId: () => uid('p') });
};

/**
 * Merge for real, in one transaction (all or nothing), after keeping a copy
 * of this device's data for "Undo last merge".
 * @param {{writes: Object}} plan From previewMerge.
 */
export const applyMerge = async (plan, fromLabel) => {
  const before = await exportAll();
  await tx(ALL_STORES, 'readwrite', async (s) => {
    s[STORES.settings].put({ key: UNDO_KEY, value: { at: Date.now(), data: before.data } });
    for (const row of plan.writes.profiles) s[STORES.profiles].put(row);
    for (const row of plan.writes.sessions) s[STORES.sessions].put(row);
    for (const row of plan.writes.mastery) s[STORES.mastery].put(row);
    for (const row of plan.writes.rewards) s[STORES.rewards].put(row);
    for (const row of plan.writes.settings) s[STORES.settings].put(row);
    for (const row of plan.writes.attempts) s[STORES.attempts].add(row);
    s[STORES.settings].put({ key: LAST_SYNC_KEY, value: { at: Date.now(), from: fromLabel || '' } });
  });
};

/** When the last merge happened and whether it can be undone. */
export const syncStatus = async () => {
  const [undo, last] = await Promise.all([getSetting(UNDO_KEY), getSetting(LAST_SYNC_KEY)]);
  return { canUndo: Boolean(undo?.data), lastAt: last?.at || 0, undoAt: undo?.at || 0 };
};

/** Put this device back exactly as it was before the last merge. */
export const undoLastMerge = async () => {
  const undo = await getSetting(UNDO_KEY);
  if (!undo?.data) throw new Error('There is no merge to undo.');
  await tx(ALL_STORES, 'readwrite', async (s) => {
    const deviceId = await promisify(s[STORES.settings].get(DEVICE_KEY));
    for (const name of ALL_STORES) {
      s[name].clear();
      for (const row of undo.data[name] || []) s[name].put(row);
    }
    if (deviceId) s[STORES.settings].put(deviceId); // this device stays this device
    s[STORES.settings].delete(UNDO_KEY);
  });
};
