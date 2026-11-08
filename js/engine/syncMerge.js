/**
 * Merge a sync file from another device into this device's data.
 * Pure and DOM-free: js/data/sync.js reads and writes the database.
 *
 * The rules, so that no work is lost and nothing is counted twice:
 *  - Practice sets (sessions) are combined by their unique id.
 *  - Answers (attempts) are combined by learner + time + skill; a set's
 *    answers carry distinct times, so the key is unique per device.
 *  - Skill progress (mastery) is worked out again from all answers in time
 *    order, so both devices end up with exactly the same score.
 *  - Star counters are a "grow-only counter" per device: each rewards record
 *    remembers how much every OTHER device has contributed (syncedFrom), so
 *    this device's own part is total − others. Merging keeps the largest known
 *    part of every device and adds them up. Merging the same file twice, or in
 *    any order, gives the same totals.
 *  - The first time two devices meet, if they already share history (one was
 *    restored from the other's backup), their parts cannot be told apart; the
 *    larger total is kept so nothing is counted twice.
 *  - Badges and bought items are combined; best scores and level stars keep
 *    the best; looks, goals and settings take the most recent change.
 *  - Nothing is ever deleted by a sync.
 */

import { applyAnswer, emptyMastery } from './mastery.js';
import { emptyRewards } from './rewards.js';

export const SYNC_FORMAT = 'learnoffline-sync';
export const SYNC_VERSION = 1;

/** Rewards fields that only ever grow, merged per device. */
export const COUNTERS = Object.freeze(['stars', 'spentStars', 'setsCompleted', 'perfectSets', 'questsDone', 'bossesBeaten']);

/** Rewards fields with their own rule (everything else: the newer record wins). */
const UNION_LISTS = ['badges', 'owned'];
const BEST_MAPS = ['gameBest', 'levels'];
const SPECIAL = new Set([...COUNTERS, ...UNION_LISTS, ...BEST_MAPS, 'profileId', 'bestStreak', 'streak', 'lastActiveDay', 'quest', 'syncedFrom', 'updatedAt']);

/** Settings that travel with sync: the parent's own question packs. Device settings (PIN, voice, sound) stay put. */
export const isSyncedSetting = (key) => typeof key === 'string' && key.startsWith('customPack:');

/** The unique key of an answer across devices. */
export const attemptKey = (a) => `${a.profileId}|${a.answeredAt}|${a.skillId}`;

const num = (value) => (Number.isFinite(value) ? value : 0);
const isPlainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

/* ------------------------------------------------------------------ */
/* Star counters                                                       */
/* ------------------------------------------------------------------ */

const zeroCounts = () => Object.fromEntries(COUNTERS.map((f) => [f, 0]));

/** Other devices' parts, as recorded on this rewards record. */
const othersOf = (rewards) => (isPlainObject(rewards?.syncedFrom) ? rewards.syncedFrom : {});

/**
 * A record as seen by the device `selfId`: a part listed under its own id
 * (possible after restoring a backup made elsewhere) is folded into its own part.
 */
const asSeenBy = (rewards, selfId) => {
  if (!rewards || !(selfId in othersOf(rewards))) return rewards;
  const { [selfId]: _self, ...others } = othersOf(rewards);
  return { ...rewards, syncedFrom: others };
};

/**
 * True when the two devices have never merged with each other for this
 * learner: neither record lists the other device's part.
 */
export const firstMeeting = (local, incoming, myId, fromId) =>
  !(fromId in othersOf(asSeenBy(local, myId))) && !(myId in othersOf(asSeenBy(incoming, fromId)));

/** This device's own part of each counter: total minus every other device's part. */
export const ownCounts = (rewards) => {
  const own = {};
  for (const f of COUNTERS) {
    own[f] = num(rewards?.[f]) - Object.values(othersOf(rewards)).reduce((sum, part) => sum + num(part?.[f]), 0);
  }
  return own;
};

/** Every device's part as this record knows it, including its own (deviceId). */
export const contributions = (rewards, deviceId) => ({ ...othersOf(rewards), [deviceId]: ownCounts(rewards) });

const maxCounts = (a = {}, b = {}) => Object.fromEntries(COUNTERS.map((f) => [f, Math.max(num(a[f]), num(b[f]))]));

/* ------------------------------------------------------------------ */
/* Rewards                                                             */
/* ------------------------------------------------------------------ */

const union = (a = [], b = []) => [...new Set([...(Array.isArray(a) ? a : []), ...(Array.isArray(b) ? b : [])])];

const bestOf = (a = {}, b = {}) => {
  const out = { ...(isPlainObject(a) ? a : {}) };
  for (const [k, v] of Object.entries(isPlainObject(b) ? b : {})) out[k] = Math.max(num(out[k]), num(v));
  return out;
};

/** Progress made on a quest: tier first, then opened, then goals ticked off. */
const questProgress = (q) => num(q?.tier || 1) * 10000 + (q?.claimed ? 1000 : 0)
  + (Array.isArray(q?.tasks) ? q.tasks.reduce((s, t) => s + Math.min(num(t.have), num(t.need)), 0) : 0);

/** The later day's quest; on the same day, the one further along. */
const pickQuest = (a, b) => {
  if (!a) return b ?? null;
  if (!b) return a;
  if (a.day !== b.day) return String(a.day) > String(b.day) ? a : b;
  return questProgress(b) > questProgress(a) ? b : a;
};

/**
 * Merge one learner's rewards.
 * @param {Object|null} local This device's record (null for a new learner).
 * @param {Object} incoming The record from the sync file (profileId already mapped).
 * @param {{myId: string, fromId: string, sharedHistory?: boolean}} ctx
 */
export const mergeRewards = (local, incoming, { myId, fromId, sharedHistory = false }) => {
  const mine = asSeenBy({ ...emptyRewards(incoming.profileId), ...(local || {}) }, myId);
  const theirs = asSeenBy({ ...emptyRewards(incoming.profileId), ...incoming }, fromId);
  const theirParts = contributions(theirs, fromId);
  // Overlapping history only needs the "larger total" rule when the parts cannot be told apart.
  const metBefore = !firstMeeting(mine, theirs, myId, fromId);

  const known = { ...othersOf(mine) };
  for (const [device, part] of Object.entries(theirParts)) {
    if (device !== myId) known[device] = maxCounts(known[device], part);
  }

  const counts = {};
  if (sharedHistory && !metBefore && local) {
    // Shared history from a backup: the parts overlap, so keep the larger total.
    for (const f of COUNTERS) counts[f] = Math.max(num(mine[f]), num(theirs[f]));
  } else {
    const own = ownCounts(mine);
    for (const f of COUNTERS) counts[f] = own[f] + Object.values(known).reduce((sum, part) => sum + num(part[f]), 0);
  }

  // Looks, companion, equipped items and other settings: the newer record wins.
  const newer = num(theirs.updatedAt) > num(mine.updatedAt) ? theirs : mine;
  const rest = {};
  for (const key of new Set([...Object.keys(mine), ...Object.keys(theirs)])) {
    if (SPECIAL.has(key)) continue;
    rest[key] = key in newer ? newer[key] : (key in mine ? mine[key] : theirs[key]);
  }

  const laterDay = String(theirs.lastActiveDay || '') > String(mine.lastActiveDay || '') ? theirs : mine;
  const sameDay = theirs.lastActiveDay === mine.lastActiveDay;
  return {
    ...rest,
    profileId: mine.profileId,
    ...counts,
    badges: union(mine.badges, theirs.badges),
    owned: union(mine.owned, theirs.owned),
    gameBest: bestOf(mine.gameBest, theirs.gameBest),
    levels: bestOf(mine.levels, theirs.levels),
    bestStreak: Math.max(num(mine.bestStreak), num(theirs.bestStreak)),
    streak: sameDay ? Math.max(num(mine.streak), num(theirs.streak)) : num(laterDay.streak),
    lastActiveDay: laterDay.lastActiveDay || '',
    quest: pickQuest(mine.quest, theirs.quest),
    syncedFrom: known,
    updatedAt: Math.max(num(mine.updatedAt), num(theirs.updatedAt)),
  };
};

/* ------------------------------------------------------------------ */
/* Mastery                                                             */
/* ------------------------------------------------------------------ */

/**
 * Merge one skill's progress. With every answer on hand, the score is
 * replayed in time order (exactly what each device would have computed);
 * the review schedule comes from whichever side practised last.
 * @param {Object|null} local
 * @param {Object|null} incoming
 * @param {Object[]} answers Every known answer for this learner and skill.
 */
export const mergeMastery = (local, incoming, answers) => {
  if (!incoming) return local;
  if (!local) return incoming;
  const later = num(incoming.lastPracticedAt) > num(local.lastPracticedAt) ? incoming : local;
  const most = Math.max(num(local.attempts), num(incoming.attempts));
  if (!answers.length || answers.length < most) return { ...later, profileId: local.profileId };
  const sorted = [...answers].sort((a, b) => a.answeredAt - b.answeredAt);
  let rec = emptyMastery(local.profileId, local.skillId);
  for (const a of sorted) rec = applyAnswer(rec, Boolean(a.correct), a.answeredAt);
  // Times come from the records: a set stamps every answer with the same practice time.
  return { ...rec, lastPracticedAt: Math.max(num(local.lastPracticedAt), num(incoming.lastPracticedAt)), level: num(later.level), nextReviewAt: num(later.nextReviewAt) };
};

/* ------------------------------------------------------------------ */
/* Learners                                                            */
/* ------------------------------------------------------------------ */

const nameKey = (name) => String(name || '').trim().toLowerCase();

/**
 * Suggest, for each learner in the file, which learner on this device they are:
 * the same hidden id, else a single learner with the same name, else new.
 * @returns {Map<string, string|null>} incoming profileId -> local profileId (null = add as new)
 */
export const suggestLinks = (localProfiles, incomingProfiles) => {
  const byId = new Map(localProfiles.map((p) => [p.profileId, p]));
  const links = new Map();
  for (const p of incomingProfiles) {
    if (byId.has(p.profileId)) { links.set(p.profileId, p.profileId); continue; }
    const sameName = localProfiles.filter((l) => nameKey(l.name) === nameKey(p.name));
    links.set(p.profileId, sameName.length === 1 && !incomingProfiles.some((o) => o.profileId === sameName[0].profileId) ? sameName[0].profileId : null);
  }
  return links;
};

/** The newer of two profile records (goal, grade, name…), keeping this device's id. */
const mergeProfile = (local, incoming, localId) => {
  if (!local) return { ...incoming, profileId: localId };
  const newer = num(incoming.updatedAt) > num(local.updatedAt) ? incoming : local;
  return { ...newer, profileId: localId, createdAt: Math.min(num(local.createdAt) || Infinity, num(incoming.createdAt) || Infinity) || Date.now() };
};

/* ------------------------------------------------------------------ */
/* Whole file                                                          */
/* ------------------------------------------------------------------ */

const groupBy = (rows, keyFn) => {
  const map = new Map();
  for (const row of rows) {
    const k = keyFn(row);
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(row);
  }
  return map;
};

/** JSON with object keys sorted, so two records with the same values compare equal whatever their key order. */
const canonical = (value) => JSON.stringify(value, (_key, v) => (isPlainObject(v)
  ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, v[k]]))
  : v));
const sameJson = (a, b) => canonical(a) === canonical(b);

/**
 * Work out what merging `file` into `local` changes, without touching anything.
 * @param {Object} local This device's data: { profiles, attempts, mastery, rewards, sessions, settings } arrays.
 * @param {Object} file A checked sync file.
 * @param {{myId: string, links: Map<string, string|null>, skip?: Set<string>}} options
 *   links: incoming profileId -> local profileId, or null to add as a new learner.
 *   skip: incoming profileIds to leave out.
 *   newId: makes a fresh learner id, used only when a new learner's id is already taken here.
 * @returns {{writes: Object<string, Object[]>, summary: Object[]}}
 */
export const planMerge = (local, file, { myId, links, skip = new Set(), newId }) => {
  const fromId = file.deviceId;
  const incoming = file.data;
  const writes = { profiles: [], attempts: [], mastery: [], rewards: [], sessions: [], settings: [] };
  const summary = [];

  const localProfiles = new Map(local.profiles.map((p) => [p.profileId, p]));
  const localRewards = new Map(local.rewards.map((r) => [r.profileId, r]));
  const localMastery = new Map(local.mastery.map((m) => [`${m.profileId}|${m.skillId}`, m]));
  const localSessionIds = new Set(local.sessions.map((s) => s.sessionId));
  const localAttemptKeys = new Set(local.attempts.map(attemptKey));
  const localAttemptsByProfile = groupBy(local.attempts, (a) => a.profileId);
  const localSessionsByProfile = groupBy(local.sessions, (s) => s.profileId);

  // Incoming learner id -> id on this device.
  const idMap = new Map();
  for (const p of incoming.profiles) {
    if (skip.has(p.profileId)) continue;
    const linked = links.get(p.profileId);
    if (linked && localProfiles.has(linked)) idMap.set(p.profileId, linked);
    // Added as a new learner: keep their id unless this device already uses it for someone else.
    else idMap.set(p.profileId, localProfiles.has(p.profileId) ? newId(p) : p.profileId);
  }
  const mapRow = (row) => ({ ...row, profileId: idMap.get(row.profileId) });
  const keep = (row) => idMap.has(row.profileId);

  const inAttempts = groupBy(incoming.attempts.filter(keep).map(mapRow), (a) => a.profileId);
  const inSessions = groupBy(incoming.sessions.filter(keep).map(mapRow), (s) => s.profileId);
  const inMastery = groupBy(incoming.mastery.filter(keep).map(mapRow), (m) => m.profileId);
  const inRewards = new Map(incoming.rewards.filter(keep).map(mapRow).map((r) => [r.profileId, r]));

  for (const p of incoming.profiles) {
    if (!idMap.has(p.profileId)) continue;
    const id = idMap.get(p.profileId);
    const mine = localProfiles.get(id) || null;

    const profile = mergeProfile(mine, p, id);
    if (!sameJson(profile, mine)) writes.profiles.push(profile);

    const theirSessions = inSessions.get(id) || [];
    const mySessions = localSessionsByProfile.get(id) || [];
    const newSessions = theirSessions.filter((s) => !localSessionIds.has(s.sessionId));
    writes.sessions.push(...newSessions);
    const sharedHistory = theirSessions.some((s) => localSessionIds.has(s.sessionId));

    const theirAttempts = inAttempts.get(id) || [];
    const newAttempts = theirAttempts.filter((a) => !localAttemptKeys.has(attemptKey(a)));
    writes.attempts.push(...newAttempts.map(({ attemptId, ...rest }) => rest));

    // Skill progress for every skill either side has.
    const allAnswers = groupBy([...(localAttemptsByProfile.get(id) || []), ...newAttempts], (a) => a.skillId);
    for (const rec of inMastery.get(id) || []) {
      const key = `${id}|${rec.skillId}`;
      const before = localMastery.get(key) || null;
      const merged = mergeMastery(before, rec, allAnswers.get(rec.skillId) || []);
      if (!sameJson(merged, before)) writes.mastery.push(merged);
    }

    const myRewards = localRewards.get(id) || null;
    const theirRewards = inRewards.get(id);
    let rewards = myRewards;
    if (theirRewards) {
      rewards = mergeRewards(myRewards, theirRewards, { myId, fromId, sharedHistory });
      if (!sameJson(rewards, myRewards)) writes.rewards.push(rewards);
    }

    const wallet = (r) => (r ? num(r.stars) - num(r.spentStars) : 0);
    summary.push({
      profileId: id,
      incomingId: p.profileId,
      name: profile.name,
      isNew: !mine,
      newSets: newSessions.length,
      newAnswers: newAttempts.length,
      starsBefore: wallet(myRewards),
      starsAfter: wallet(rewards),
      sharedHistory: Boolean(theirRewards && myRewards) && sharedHistory && firstMeeting(myRewards, theirRewards, myId, fromId),
      setsTotal: mySessions.length + newSessions.length,
    });
  }

  // The parent's own question packs: added when this device does not have them.
  const localKeys = new Set(local.settings.map((s) => s.key));
  writes.settings.push(...incoming.settings.filter((s) => isSyncedSetting(s.key) && !localKeys.has(s.key)));

  return { writes, summary };
};

/* ------------------------------------------------------------------ */
/* File                                                                */
/* ------------------------------------------------------------------ */

/**
 * Build the sync file from this device's data.
 * @param {Object} data Every store's rows (as exportAll returns them).
 */
export const buildSyncFile = (data, deviceId, now = new Date()) => ({
  format: SYNC_FORMAT,
  version: SYNC_VERSION,
  deviceId,
  exportedAt: now.toISOString(),
  data: {
    profiles: data.profiles,
    attempts: data.attempts.map(({ attemptId, ...rest }) => rest),
    mastery: data.mastery,
    rewards: data.rewards,
    sessions: data.sessions,
    settings: data.settings.filter((s) => isSyncedSetting(s.key)),
  },
});

const ROW_CHECKS = {
  profiles: (r) => typeof r.profileId === 'string' && typeof r.name === 'string',
  attempts: (r) => typeof r.profileId === 'string' && typeof r.skillId === 'string' && Number.isFinite(r.answeredAt),
  mastery: (r) => typeof r.profileId === 'string' && typeof r.skillId === 'string',
  rewards: (r) => typeof r.profileId === 'string' && (r.badges === undefined || Array.isArray(r.badges)) && (r.owned === undefined || Array.isArray(r.owned)),
  sessions: (r) => typeof r.profileId === 'string' && typeof r.sessionId === 'string',
  settings: (r) => typeof r.key === 'string',
};

/**
 * Check a parsed sync file before using it.
 * @returns {string|null} A message for the parent, or null when it is fine.
 */
export const validateSyncFile = (file, myId) => {
  if (file?.format === 'learnoffline-backup') return 'This is a backup file, not a sync file. Use "Restore from file" for backups.';
  if (!file || file.format !== SYNC_FORMAT) return 'This file is not a LearnOffline sync file.';
  if (typeof file.version !== 'number' || !isPlainObject(file.data) || typeof file.deviceId !== 'string') return 'The sync file is damaged.';
  if (file.version > SYNC_VERSION) return 'This sync file comes from a newer version of the app. Please update this device first.';
  if (file.deviceId === myId) return 'This sync file was made on this device. Make it on the other device, then merge it here.';
  for (const [store, check] of Object.entries(ROW_CHECKS)) {
    const rows = file.data[store];
    if (!Array.isArray(rows) || !rows.every((r) => isPlainObject(r) && check(r))) return 'The sync file is damaged.';
  }
  if (!file.data.profiles.length) return 'The sync file has no learners in it.';
  return null;
};
