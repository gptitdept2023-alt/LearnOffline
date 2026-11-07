// Data layer: transactions, backup validation and restore (run against an in-memory IndexedDB).
import 'fake-indexeddb/auto';
import test from 'node:test';
import assert from 'node:assert/strict';
import { saveProfile, listProfiles, setSetting, getSetting } from '../js/data/repo.js';
import { exportAll, restoreAll, validateBackup } from '../js/data/backup.js';
import { tx, STORES } from '../js/data/db.js';

const backupWith = (data) => ({
  format: 'learnoffline-backup',
  version: 1,
  data: { profiles: [], attempts: [], mastery: [], rewards: [], sessions: [], settings: [], ...data },
});

const ben = { profileId: 'ben', name: 'Ben', packId: 'math-k2', createdAt: 1 };

test('a transaction whose work throws commits nothing', async () => {
  await assert.rejects(tx(STORES.settings, 'readwrite', (s) => {
    s.settings.put({ key: 'half', value: 1 });
    throw new Error('boom');
  }));
  assert.equal(await getSetting('half'), null);
});

test('backup validation refuses files that would lose data', () => {
  assert.equal(validateBackup(backupWith({ profiles: [ben] })), null, 'a good file passes');
  assert.ok(validateBackup({ ...backupWith({ profiles: [ben] }), version: undefined }), 'no version');
  assert.ok(validateBackup(backupWith({ profiles: [] })), 'no learners');
  const noSettings = backupWith({ profiles: [ben] });
  delete noSettings.data.settings;
  assert.ok(validateBackup(noSettings), 'a missing store would wipe the PIN');
  assert.ok(validateBackup(backupWith({ profiles: [ben], settings: [{ value: 'no key' }] })), 'row with no key');
  assert.ok(validateBackup(backupWith({ profiles: [{ name: 'no id' }] })), 'learner with no id');
  assert.ok(validateBackup(backupWith({ profiles: [ben], mastery: [{ profileId: 'ben' }] })), 'mastery with no skillId');
  assert.ok(validateBackup(backupWith({ profiles: [ben], rewards: [{ profileId: 'ben', badges: null }] })), 'badges must be a list');
  assert.ok(validateBackup(backupWith({ profiles: [ben, null] })), 'null row');
});

test('a bad restore leaves the device exactly as it was; a good one replaces it', async () => {
  const ana = await saveProfile({ name: 'Ana', packId: 'math-k2' });
  await setSetting('parentPin', { salt: 'a', hash: 'b' });
  const before = await exportAll();

  // A row whose key IndexedDB would reject: refused before anything is cleared.
  const sneaky = backupWith({ profiles: [ben], settings: [{ key: 'ok', value: 1 }] });
  sneaky.data.settings.push({ key: 'x', value: 1 });
  sneaky.data.settings[1].key = { not: 'a key' };
  await assert.rejects(restoreAll(sneaky));
  const after = await exportAll();
  assert.deepEqual(after.data, before.data, 'nothing changed');

  const count = await restoreAll(backupWith({ profiles: [ben], settings: [{ key: 'voice', value: {} }] }));
  assert.equal(count, 1);
  assert.deepEqual((await listProfiles()).map((p) => p.profileId), ['ben']);
  assert.deepEqual(await getSetting('parentPin'), { salt: 'a', hash: 'b' }, 'this device keeps its own PIN');
  assert.ok(ana.profileId);
});

test('a restore keeps this device\'s own parent PIN', async () => {
  await setSetting('parentPin', { salt: 'mine', hash: 'mine' });
  const other = backupWith({ profiles: [ben], settings: [{ key: 'parentPin', value: { salt: 'theirs', hash: 'theirs' } }, { key: 'voice', value: { rate: 1 } }] });
  await restoreAll(other);
  assert.deepEqual(await getSetting('parentPin'), { salt: 'mine', hash: 'mine' });
  assert.deepEqual(await getSetting('voice'), { rate: 1 }, 'other settings come from the backup');
  await setSetting('parentPin', null);
  await restoreAll(other);
  assert.equal(await getSetting('parentPin'), null, 'no PIN here stays no PIN');
});
