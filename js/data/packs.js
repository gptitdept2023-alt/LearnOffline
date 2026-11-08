/**
 * Content packs: read-only JSON files under /packs, cached by the service
 * worker so they load offline, plus packs a parent imported (customPacks.js,
 * kept on the device). Each pack is indexed once into lookup maps so
 * screens never search arrays repeatedly.
 */

import { listCustomPackEntries, getCustomPack } from './customPacks.js';

const INDEX_URL = './packs/index.json';

let builtInPromise = null;
let indexPromise = null;
const packCache = new Map();

const fetchJson = async (url) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not load ${url} (${response.status}).`);
  return response.json();
};

/** The packs that ship with the app (packs/index.json). */
export const loadBuiltInIndex = () => {
  if (!builtInPromise) {
    builtInPromise = fetchJson(INDEX_URL).then((data) => data.packs);
    builtInPromise.catch(() => { builtInPromise = null; });
  }
  return builtInPromise;
};

/**
 * Imported packs whose grade is still in the app, each placed right after the
 * built-in packs of its grade, so a grade's own subjects always come first.
 * A storage error leaves out the imported packs instead of breaking the app.
 */
const mergeCustom = (builtIn, custom) => {
  const levels = new Set(builtIn.map((p) => p.level));
  const ids = new Set(builtIn.map((p) => p.packId));
  const usable = custom.filter((c) => levels.has(c.level) && !ids.has(c.packId))
    .sort((a, b) => (a.importedAt || 0) - (b.importedAt || 0));
  const out = [];
  builtIn.forEach((p, i) => {
    out.push(p);
    if (builtIn[i + 1]?.level !== p.level) out.push(...usable.filter((c) => c.level === p.level));
  });
  return out;
};

/** The list of installed packs: [{ packId, subject, level, title, file, young, custom? }]. */
export const loadPackIndex = () => {
  if (!indexPromise) {
    indexPromise = Promise.all([loadBuiltInIndex(), listCustomPackEntries().catch(() => [])])
      .then(([builtIn, custom]) => mergeCustom(builtIn, custom));
    indexPromise.catch(() => { indexPromise = null; });
  }
  return indexPromise;
};

/** Forget the merged index and an imported pack after it is imported again or removed. */
export const resetPackCaches = (packId) => {
  indexPromise = null;
  if (packId) packCache.delete(packId);
};

/**
 * Subjects (packs) at the same level as `packId`, in index order: Math and
 * English for Kinder 2, and so on. A learner has one level and switches subject.
 * @returns {Promise<Object[]>}
 */
export const subjectsAtLevel = async (packId) => {
  const index = await loadPackIndex();
  const own = index.find((p) => p.packId === packId);
  return own ? index.filter((p) => p.level === own.level) : [];
};

/** One entry per level for the grade picker: [{ level, levelName, packs }], in index order. */
export const levelsOf = (index) => {
  const byLevel = new Map();
  for (const p of index) {
    if (!byLevel.has(p.level)) byLevel.set(p.level, { level: p.level, levelName: p.levelName || p.title, packs: [] });
    byLevel.get(p.level).packs.push(p);
  }
  return [...byLevel.values()];
};

/** Throw a clear error if a pack is malformed, instead of failing deep in a screen. */
const validatePack = (pack) => {
  if (!pack?.packId || !Array.isArray(pack.topics)) throw new Error('Content pack is missing its topics.');
  const seen = new Set();
  for (const topic of pack.topics) {
    if (!topic.topicId || !Array.isArray(topic.skills)) throw new Error(`Topic "${topic.title}" is malformed.`);
    for (const skill of topic.skills) {
      if (!skill.skillId) throw new Error(`A skill in "${topic.title}" has no id.`);
      if (seen.has(skill.skillId)) throw new Error(`Skill id "${skill.skillId}" is used twice.`);
      if (!skill.generator && !(skill.questions || []).length) throw new Error(`Skill "${skill.title}" has no questions.`);
      seen.add(skill.skillId);
    }
  }
};

/**
 * Load a pack and index it.
 * @returns {Promise<{pack: Object, skillById: Map, topicBySkill: Map, skillOrder: string[]}>}
 */
export const loadPack = async (packId) => {
  if (packCache.has(packId)) return packCache.get(packId);
  const index = await loadPackIndex();
  const entry = index.find((p) => p.packId === packId);
  if (!entry) throw new Error('This grade is not installed.');
  const source = entry.custom
    ? getCustomPack(packId).then((pack) => { if (!pack) throw new Error('This question pack was removed.'); return pack; })
    : fetchJson(`./packs/${entry.file}`);
  const promise = source.then((pack) => {
    validatePack(pack);
    const skillById = new Map();
    const topicBySkill = new Map();
    const skillOrder = [];
    for (const topic of pack.topics) {
      for (const skill of topic.skills) {
        skillById.set(skill.skillId, skill);
        topicBySkill.set(skill.skillId, topic);
        skillOrder.push(skill.skillId);
      }
    }
    return { pack: { ...pack, young: Boolean(entry.young) }, entry, skillById, topicBySkill, skillOrder };
  });
  packCache.set(packId, promise);
  promise.catch(() => packCache.delete(packId));
  return promise;
};

/** topicId -> skillIds for the topics touched by a list of skills. */
export const topicSkillsFor = (indexed, skillIds) => {
  const map = new Map();
  for (const id of skillIds) {
    const topic = indexed.topicBySkill.get(id);
    if (topic && !map.has(topic.topicId)) map.set(topic.topicId, topic.skills.map((s) => s.skillId));
  }
  return map;
};
