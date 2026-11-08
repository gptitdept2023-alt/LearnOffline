// PC and phone sync: the merge engine (pure, with simulated devices) and the
// database side (merge in one transaction, undo, device id, backups).
import 'fake-indexeddb/auto';
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  planMerge, buildSyncFile, suggestLinks, validateSyncFile, mergeRewards, firstMeeting, SYNC_FORMAT,
} from '../js/engine/syncMerge.js';
import { applyAnswer, applySetResult, emptyMastery } from '../js/engine/mastery.js';
import { emptyRewards } from '../js/engine/rewards.js';
import { saveProfile, setSetting, getSetting } from '../js/data/repo.js';
import { exportAll, restoreAll } from '../js/data/backup.js';
import { tx, STORES } from '../js/data/db.js';
import {
  getDeviceId, makeSyncFile, readSyncFile, previewMerge, applyMerge, syncStatus, undoLastMerge, suggestLinksFor,
} from '../js/data/sync.js';

/* ------------------------------------------------------------------ */
/* A tiny in-memory device that practises the way the app does         */
/* ------------------------------------------------------------------ */

let clock = 1_700_000_000_000;
let seq = 0;
const clone = (value) => JSON.parse(JSON.stringify(value));

const device = (id) => ({
  id,
  data: { profiles: [], attempts: [], mastery: [], rewards: [], sessions: [], settings: [] },
});

const addLearner = (dev, profileId, name) => {
  dev.data.profiles.push({ profileId, name, packId: 'math-g4', createdAt: clock, updatedAt: clock });
  dev.data.rewards.push({ ...emptyRewards(profileId), updatedAt: clock });
};

const upsert = (rows, row, keyOf) => {
  const i = rows.findIndex((r) => keyOf(r) === keyOf(row));
  if (i >= 0) rows[i] = row; else rows.push(row);
};

/** One practice set: answers, mastery, stars, exactly like repo.saveSetResult does it. */
const practise = (dev, profileId, { stars = 3, results = [true, true, false], skillId = 's1', spend = 0 } = {}) => {
  clock += 60_000;
  const now = clock;
  results.forEach((correct, i) => dev.data.attempts.push({
    attemptId: dev.data.attempts.length + 1, profileId, packId: 'math-g4', skillId, correct, given: '1', prompt: 'q', timeMs: 900, answeredAt: now + i,
  }));
  const key = (m) => `${m.profileId}|${m.skillId}`;
  let rec = dev.data.mastery.find((m) => key(m) === `${profileId}|${skillId}`) || emptyMastery(profileId, skillId);
  for (const correct of results) rec = applyAnswer(rec, correct, now);
  rec = applySetResult(rec, results.filter(Boolean).length / results.length, now);
  upsert(dev.data.mastery, rec, key);
  dev.data.sessions.push({ sessionId: `${dev.id}-set-${seq += 1}`, profileId, at: now, correct: results.filter(Boolean).length, total: results.length });
  const r = dev.data.rewards.find((x) => x.profileId === profileId);
  Object.assign(r, { stars: r.stars + stars, setsCompleted: r.setsCompleted + 1, spentStars: r.spentStars + spend, updatedAt: now });
};

const fileOf = (dev) => clone(buildSyncFile(dev.data, dev.id));

/** Merge `src`'s sync file into `dev`, like the Sync panel with the suggested matches. */
const merge = (dev, src, { links, skip } = {}) => {
  const file = fileOf(src);
  assert.equal(validateSyncFile(file, dev.id), null);
  const plan = planMerge(dev.data, file, {
    myId: dev.id, links: links || suggestLinks(dev.data.profiles, file.data.profiles), skip, newId: () => `new-${seq += 1}`,
  });
  const w = clone(plan.writes);
  for (const row of w.profiles) upsert(dev.data.profiles, row, (r) => r.profileId);
  for (const row of w.sessions) upsert(dev.data.sessions, row, (r) => r.sessionId);
  for (const row of w.mastery) upsert(dev.data.mastery, row, (r) => `${r.profileId}|${r.skillId}`);
  for (const row of w.rewards) upsert(dev.data.rewards, row, (r) => r.profileId);
  for (const row of w.settings) upsert(dev.data.settings, row, (r) => r.key);
  for (const row of w.attempts) dev.data.attempts.push({ ...row, attemptId: dev.data.attempts.length + 1 });
  return plan;
};

const rewardsOf = (dev, profileId) => dev.data.rewards.find((r) => r.profileId === profileId);
const nothingWritten = (plan) => Object.values(plan.writes).every((rows) => rows.length === 0);
const strip = (rows) => rows.map(({ attemptId, ...rest }) => rest).sort((a, b) => a.answeredAt - b.answeredAt);

/* ------------------------------------------------------------------ */
/* Merge engine                                                        */
/* ------------------------------------------------------------------ */

test('phone to PC and back: no work lost, nothing counted twice, both devices end the same', () => {
  const phone = device('phone');
  const pc = device('pc');
  addLearner(phone, 'ana', 'Ana');
  practise(phone, 'ana', { stars: 10 });

  const first = merge(pc, phone);
  assert.equal(first.summary[0].isNew, true);
  assert.equal(rewardsOf(pc, 'ana').stars, 10);

  // Both keep practising, then sync both ways. They now share Ana's first set,
  // but that is NOT a restored backup: the stars must add up, not take the larger.
  practise(pc, 'ana', { stars: 5 });
  practise(phone, 'ana', { stars: 3 });
  const back = merge(phone, pc);
  assert.equal(back.summary[0].sharedHistory, false);
  assert.equal(rewardsOf(phone, 'ana').stars, 18);
  merge(pc, phone);
  assert.equal(rewardsOf(pc, 'ana').stars, 18);
  assert.equal(rewardsOf(pc, 'ana').setsCompleted, 3);

  assert.deepEqual(strip(pc.data.attempts), strip(phone.data.attempts), 'same answers on both');
  assert.equal(pc.data.attempts.length, 9);
  assert.deepEqual(pc.data.mastery, phone.data.mastery, 'same skill progress on both');
  assert.equal(pc.data.sessions.length, 3);

  // Merging again, either way, changes nothing.
  assert.ok(nothingWritten(merge(pc, phone)));
  assert.ok(nothingWritten(merge(phone, pc)));
  assert.equal(rewardsOf(phone, 'ana').stars, 18);
});

test('merging the same file twice changes nothing the second time', () => {
  const phone = device('phone');
  const pc = device('pc');
  addLearner(phone, 'ana', 'Ana');
  practise(phone, 'ana');
  merge(pc, phone);
  practise(pc, 'ana');
  merge(phone, pc);
  const again = merge(phone, pc);
  assert.ok(nothingWritten(again));
  assert.deepEqual(again.summary[0], { ...again.summary[0], newSets: 0, newAnswers: 0, starsBefore: again.summary[0].starsAfter });
});

test('three devices merged in any order give the same totals', () => {
  const build = () => {
    const a = device('a'); const b = device('b'); const c = device('c');
    addLearner(a, 'ana', 'Ana');
    merge(b, a); merge(c, a);
    practise(a, 'ana', { stars: 4 });
    practise(b, 'ana', { stars: 7, spend: 2 });
    practise(c, 'ana', { stars: 1 });
    return { a, b, c };
  };
  const one = build();
  merge(one.a, one.b); merge(one.a, one.c);
  const two = build();
  merge(two.a, two.c); merge(two.a, two.b); merge(two.a, two.c);
  for (const field of ['stars', 'spentStars', 'setsCompleted']) {
    assert.equal(rewardsOf(one.a, 'ana')[field], rewardsOf(two.a, 'ana')[field], field);
  }
  assert.equal(rewardsOf(one.a, 'ana').stars, 12);
  assert.equal(rewardsOf(one.a, 'ana').spentStars, 2);
  // Hand-me-down: c learns b's stars through a, then a direct b → c merge adds nothing more.
  merge(one.c, one.a);
  merge(one.c, one.b);
  assert.equal(rewardsOf(one.c, 'ana').stars, 12);
});

test('a phone restored from the PC backup: shared stars are counted once, later syncs add normally', () => {
  const pc = device('pc');
  addLearner(pc, 'ana', 'Ana');
  practise(pc, 'ana', { stars: 20 });
  const phone = { id: 'phone', data: clone(pc.data) }; // restored backup, own device id
  practise(phone, 'ana', { stars: 5 });

  assert.equal(firstMeeting(rewardsOf(pc, 'ana'), rewardsOf(phone, 'ana'), 'pc', 'phone'), true);
  const plan = merge(pc, phone);
  assert.equal(plan.summary[0].sharedHistory, true);
  assert.equal(rewardsOf(pc, 'ana').stars, 25, 'larger total, not 20 + 25');
  assert.equal(plan.summary[0].newSets, 1);

  practise(pc, 'ana', { stars: 3 });
  merge(phone, pc);
  assert.equal(rewardsOf(phone, 'ana').stars, 28);
  merge(pc, phone);
  assert.equal(rewardsOf(pc, 'ana').stars, 28);
  assert.ok(nothingWritten(merge(phone, pc)));
});

test('skill progress is replayed from every answer in time order', () => {
  const phone = device('phone');
  const pc = device('pc');
  addLearner(phone, 'ana', 'Ana');
  practise(phone, 'ana', { results: [true, true, true] });
  merge(pc, phone);
  practise(pc, 'ana', { results: [false, false, true] });
  practise(phone, 'ana', { results: [true, false, true] });
  merge(pc, phone);

  let expected = emptyMastery('ana', 's1');
  for (const a of strip(pc.data.attempts)) expected = applyAnswer(expected, a.correct, a.answeredAt);
  const rec = pc.data.mastery.find((m) => m.skillId === 's1');
  assert.equal(rec.score, expected.score);
  assert.equal(rec.attempts, 9);
  assert.equal(rec.correct, 6);
  assert.equal(rec.lastPracticedAt, Math.max(...pc.data.sessions.map((s) => s.at)), 'latest practice time');
});

test('rewards: badges and bought items combine, bests keep the best, looks take the newer change', () => {
  const mine = { ...emptyRewards('ana'), stars: 5, badges: ['first'], owned: ['hat'], gameBest: { pop: 9 }, levels: { 1: 3 }, equipped: { hat: 'hat' }, updatedAt: 10 };
  const theirs = { ...emptyRewards('ana'), stars: 2, badges: ['streak3'], owned: ['cape'], gameBest: { pop: 4, race: 7 }, levels: { 1: 1, 2: 2 }, equipped: { cape: 'cape' }, updatedAt: 20 };
  const out = mergeRewards(mine, theirs, { myId: 'pc', fromId: 'phone' });
  assert.deepEqual(out.badges.sort(), ['first', 'streak3']);
  assert.deepEqual(out.owned.sort(), ['cape', 'hat']);
  assert.deepEqual(out.gameBest, { pop: 9, race: 7 });
  assert.deepEqual(out.levels, { 1: 3, 2: 2 });
  assert.deepEqual(out.equipped, { cape: 'cape' });
  assert.equal(out.stars, 7);
  assert.deepEqual(out.syncedFrom.phone.stars, 2);
});

test('learners: matched by id, then by a single same name; clashing ids get a new id; left-out learners stay out', () => {
  const pc = device('pc');
  const phone = device('phone');
  addLearner(pc, 'p-ana', 'Ana');
  addLearner(pc, 'p-ben', 'Ben');
  addLearner(phone, 'f-ana', 'ana ');
  addLearner(phone, 'p-ben', 'Mia'); // same hidden id as Ben by chance
  addLearner(phone, 'f-cy', 'Cy');
  practise(phone, 'f-ana', { stars: 4 });
  practise(phone, 'f-cy', { stars: 2 });

  const links = suggestLinks(pc.data.profiles, phone.data.profiles);
  assert.equal(links.get('f-ana'), 'p-ana', 'same name, any case and spaces');
  assert.equal(links.get('p-ben'), 'p-ben', 'same id');
  assert.equal(links.get('f-cy'), null, 'new learner');

  // The parent says Mia is a new child, and leaves Cy out.
  links.set('p-ben', null);
  const plan = merge(pc, phone, { links, skip: new Set(['f-cy']) });
  const mia = pc.data.profiles.find((p) => p.name === 'Mia');
  assert.ok(mia && mia.profileId !== 'p-ben', 'Mia gets her own id');
  assert.equal(pc.data.profiles.find((p) => p.profileId === 'p-ben').name, 'Ben', 'Ben is untouched');
  assert.equal(pc.data.profiles.some((p) => p.name === 'Cy'), false);
  assert.equal(pc.data.attempts.filter((a) => a.profileId === 'p-ana').length, 3, "Ana's answers moved to Ana here");
  assert.equal(pc.data.attempts.some((a) => a.profileId === 'f-cy'), false);
  assert.equal(rewardsOf(pc, 'p-ana').stars, 4);
  assert.equal(plan.summary.length, 2);

  // Two people with the same name here: no guess.
  addLearner(pc, 'p-ana2', 'Ana');
  assert.equal(suggestLinks(pc.data.profiles, phone.data.profiles).get('f-ana'), null);
});

test('question packs travel with sync; the PIN, voice and sound settings stay on each device', () => {
  const pc = device('pc');
  const phone = device('phone');
  addLearner(phone, 'ana', 'Ana');
  phone.data.settings.push(
    { key: 'customPack:abc', value: { title: 'Spelling' } },
    { key: 'parentPin', value: 'hash' },
    { key: 'voice', value: { rate: 2 } },
    { key: 'deviceId', value: 'phone' },
  );
  const file = fileOf(phone);
  assert.deepEqual(file.data.settings.map((s) => s.key), ['customPack:abc']);
  merge(pc, phone);
  assert.deepEqual(pc.data.settings.map((s) => s.key), ['customPack:abc']);
});

test('sync file checks: wrong file, own file, newer version, damaged rows, no learners', () => {
  const phone = device('phone');
  addLearner(phone, 'ana', 'Ana');
  const good = fileOf(phone);
  assert.equal(good.format, SYNC_FORMAT);
  assert.equal(validateSyncFile(good, 'pc'), null);
  assert.match(validateSyncFile({ format: 'learnoffline-backup' }, 'pc'), /backup file/);
  assert.match(validateSyncFile({ hello: 1 }, 'pc'), /not a LearnOffline sync file/);
  assert.match(validateSyncFile(good, 'phone'), /made on this device/);
  assert.match(validateSyncFile({ ...good, version: 99 }, 'pc'), /newer version/);
  assert.match(validateSyncFile({ ...good, data: { ...good.data, attempts: [{ profileId: 'ana' }] } }, 'pc'), /damaged/);
  assert.match(validateSyncFile({ ...good, data: { ...good.data, sessions: undefined } }, 'pc'), /damaged/);
  assert.match(validateSyncFile({ ...good, data: { ...good.data, profiles: [] } }, 'pc'), /no learners/);
  assert.equal(good.data.attempts.every((a) => !('attemptId' in a)), true, 'device-only ids are left out');
});

/* ------------------------------------------------------------------ */
/* Database side                                                       */
/* ------------------------------------------------------------------ */

const clearAll = () => tx(Object.values(STORES), 'readwrite', (s) => { for (const name of Object.values(STORES)) s[name].clear(); });

/** A sync file from "the phone" with one learner who did one set. */
const phoneFile = (profileId, name) => {
  const phone = device('phone-device');
  addLearner(phone, profileId, name);
  practise(phone, profileId, { stars: 6 });
  return { ...fileOf(phone), deviceLabel: 'the phone' };
};

test('the device id is made once, survives a backup restore, and is never in the sync file data', async () => {
  await clearAll();
  const id = await getDeviceId();
  assert.match(id, /^d/);
  assert.equal(await getDeviceId(), id);
  await saveProfile({ name: 'Zed', packId: 'math-k2' });
  const backup = await exportAll();
  await setSetting('deviceId', 'someone-else');
  await restoreAll({ ...backup, data: { ...backup.data, settings: [...backup.data.settings.filter((s) => s.key !== 'deviceId'), { key: 'deviceId', value: 'from-backup' }] } });
  assert.equal(await getSetting('deviceId'), 'someone-else', "the restore keeps this device's id");
  const file = await makeSyncFile();
  assert.equal(file.deviceId, 'someone-else');
  assert.equal(file.data.settings.some((s) => s.key === 'deviceId'), false);
});

test('merge for real, then undo puts the device back exactly; backups never carry the undo copy', async () => {
  await clearAll();
  const ben = await saveProfile({ name: 'Ben', packId: 'math-k2' });
  await setSetting('parentPin', 'pin-hash');
  const myId = await getDeviceId();
  const before = await exportAll();

  const file = phoneFile('ana', 'Ana');
  const picked = new Blob([JSON.stringify(file)], { type: 'application/json' });
  const parsed = await readSyncFile(picked);
  const { localProfiles, links } = await suggestLinksFor(parsed);
  assert.deepEqual(localProfiles.map((p) => p.name), ['Ben']);
  assert.equal(links.get('ana'), null);

  const plan = await previewMerge(parsed, links);
  assert.equal(plan.summary[0].newSets, 1);
  await applyMerge(plan, 'the phone');

  const after = await exportAll();
  assert.deepEqual(after.data.profiles.map((p) => p.name).sort(), ['Ana', 'Ben']);
  assert.equal(after.data.attempts.length, 3);
  assert.equal(after.data.rewards.find((r) => r.profileId === 'ana').stars, 6);
  assert.equal(after.data.settings.some((s) => s.key === 'syncUndo'), false, 'the undo copy is not in backups');
  const status = await syncStatus();
  assert.equal(status.canUndo, true);
  assert.ok(status.lastAt > 0);

  // The same file again adds nothing.
  assert.ok(nothingWritten(await previewMerge(parsed, (await suggestLinksFor(parsed)).links)));

  await undoLastMerge();
  const undone = await exportAll();
  assert.deepEqual(undone.data, before.data, 'exactly as before the merge');
  assert.equal(await getDeviceId(), myId);
  assert.equal((await syncStatus()).canUndo, false);
  await assert.rejects(undoLastMerge(), /no merge to undo/);
  assert.ok(ben.profileId);
});

test('reading a sync file: friendly errors for junk, a backup, and this device\'s own file', async () => {
  await clearAll();
  await saveProfile({ name: 'Ben', packId: 'math-k2' });
  await assert.rejects(readSyncFile(new Blob(['not json'])), /could not be read/);
  await assert.rejects(readSyncFile(new Blob([JSON.stringify({ format: 'learnoffline-backup' })])), /backup file/);
  const own = await makeSyncFile();
  await assert.rejects(readSyncFile(new Blob([JSON.stringify(own)])), /made on this device/);
});
