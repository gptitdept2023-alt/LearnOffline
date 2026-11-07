/**
 * Content packs: read-only JSON files under /packs, cached by the service
 * worker so they load offline. Each pack is indexed once into lookup maps so
 * screens never search arrays repeatedly.
 */

const INDEX_URL = './packs/index.json';

let indexPromise = null;
const packCache = new Map();

const fetchJson = async (url) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not load ${url} (${response.status}).`);
  return response.json();
};

/** The list of installed packs: [{ packId, subject, level, title, file, young }]. */
export const loadPackIndex = () => {
  if (!indexPromise) {
    indexPromise = fetchJson(INDEX_URL).then((data) => data.packs);
    indexPromise.catch(() => { indexPromise = null; });
  }
  return indexPromise;
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
  const promise = fetchJson(`./packs/${entry.file}`).then((pack) => {
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
