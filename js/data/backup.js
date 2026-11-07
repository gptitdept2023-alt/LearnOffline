/**
 * Backup and restore. Progress lives on each device, so this is how a family
 * moves a child's progress from the PC to the phone, or keeps a safe copy.
 */

import { STORES, tx, promisify } from './db.js';

const FORMAT = 'learnoffline-backup';
const FORMAT_VERSION = 1;
const ALL_STORES = Object.values(STORES);

/** The key each row must carry, per store (matches the keyPaths in db.js). */
const ROW_KEYS = {
  [STORES.profiles]: ['profileId'],
  [STORES.mastery]: ['profileId', 'skillId'],
  [STORES.rewards]: ['profileId'],
  [STORES.sessions]: ['sessionId'],
  [STORES.settings]: ['key'],
};

const isRow = (row) => row !== null && typeof row === 'object' && !Array.isArray(row);
const hasKey = (value) => typeof value === 'string' || (typeof value === 'number' && Number.isFinite(value));

/** True when a row can be stored safely in that store. */
const validRow = (name, row) => {
  if (!isRow(row)) return false;
  if (!(ROW_KEYS[name] || []).every((field) => hasKey(row[field]))) return false;
  if (name === STORES.rewards) {
    for (const field of ['badges', 'owned']) if (row[field] !== undefined && !Array.isArray(row[field])) return false;
  }
  return true;
};

/** Read every store into one plain object. */
export const exportAll = () =>
  tx(ALL_STORES, 'readonly', async (s) => {
    const entries = await Promise.all(ALL_STORES.map(async (name) => [name, await promisify(s[name].getAll())]));
    return { format: FORMAT, version: FORMAT_VERSION, exportedAt: new Date().toISOString(), data: Object.fromEntries(entries) };
  });

/** Trigger a download of the backup file. */
export const downloadBackup = async () => {
  const backup = await exportAll();
  const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `learnoffline-backup-${backup.exportedAt.slice(0, 10)}.json`;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return backup;
};

/**
 * Check a parsed file before touching the database.
 * @returns {string|null} An error message, or null if valid.
 */
export const validateBackup = (backup) => {
  if (!backup || backup.format !== FORMAT) return 'This file is not a LearnOffline backup.';
  if (typeof backup.version !== 'number') return 'The backup file is damaged.';
  if (backup.version > FORMAT_VERSION) return 'This backup comes from a newer version. Please update the app first.';
  if (!backup.data || typeof backup.data !== 'object') return 'The backup file is damaged.';
  // Every store must be present: a missing one would be wiped (e.g. the parent PIN).
  for (const name of ALL_STORES) {
    if (!Array.isArray(backup.data[name])) return 'The backup file is damaged.';
    if (!backup.data[name].every((row) => validRow(name, row))) return 'The backup file is damaged.';
  }
  if (!backup.data.profiles.length) return 'The backup has no learners in it.';
  return null;
};

/**
 * Replace ALL data with the backup, in one transaction (all or nothing).
 * The caller must confirm with the user first: this is destructive.
 */
export const restoreAll = async (backup) => {
  const error = validateBackup(backup);
  if (error) throw new Error(error);
  await tx(ALL_STORES, 'readwrite', (s) => {
    for (const name of ALL_STORES) {
      s[name].clear();
      for (const row of backup.data[name]) s[name].put(row);
    }
  });
  return backup.data.profiles.length;
};

/** Read a File chosen by the user and parse it as JSON. */
export const readBackupFile = async (file) => {
  if (file.size > 50 * 1024 * 1024) throw new Error('That file is too large to be a backup.');
  try {
    return JSON.parse(await file.text());
  } catch {
    throw new Error('This file could not be read as a backup.');
  }
};
