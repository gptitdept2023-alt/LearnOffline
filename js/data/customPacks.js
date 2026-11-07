/**
 * Packs a parent makes in Google Sheets (tools/sheets/LearnOfflinePacks.gs)
 * and imports under Parents → Your own questions.
 *
 * An imported pack is checked field by field and rebuilt from whitelisted
 * fields only (never stored as given), then kept in the settings store under
 * "customPack:<packId>". Settings are already part of every backup, so own
 * packs move with a backup to another device without any schema change.
 *
 * The pack file format (made by the sheet):
 *   { format: 'learnoffline-pack', version: 1, packId: 'custom-…', title,
 *     subjectName, icon, level: 'G4', topics: [{ topicId, title, icon,
 *     skills: [{ skillId, title, lesson?: { steps: [{ text }] },
 *                questions: [{ type, prompt, answer, choices?, hint?, explain? }] }] }] }
 */

import { STORES, getAll, put, del } from './db.js';
import { getSetting, setSetting, listProfiles } from './repo.js';
import { parseNumber, parseFraction } from '../engine/answers.js';

export const PACK_FORMAT = 'learnoffline-pack';
export const PACK_FORMAT_VERSION = 1;
const KEY_PREFIX = 'customPack:';

/** Size limits keep a mistaken file from filling the device or freezing the screen. */
export const LIMITS = Object.freeze({
  fileBytes: 5 * 1024 * 1024,
  topics: 50,
  skillsPerTopic: 50,
  questionsPerSkill: 300,
  questions: 5000,
  stepsPerLesson: 20,
  text: 400,
  choices: 6,
});

const QUESTION_TYPES = ['multiple-choice', 'numeric', 'fraction', 'true-false'];
const PACK_ID_RE = /^custom-[a-z0-9-]{1,48}$/;

/** A trimmed string, or '' when missing. */
const str = (value) => (value === undefined || value === null ? '' : String(value).trim());

/**
 * Check a parsed pack file and rebuild it from known fields only.
 * @param {Object} raw The parsed JSON.
 * @param {{levels: Map<string, string>}} options Grades this app has: level -> level name.
 * @returns {{entry: Object, pack: Object, questionCount: number}}
 * @throws {Error} With up to 5 problems listed, in words a parent understands.
 */
export const normalizeCustomPack = (raw, { levels }) => {
  const problems = [];
  const problem = (text) => { if (problems.length < 5) problems.push(text); };
  const text = (value, where, { required = true, max = LIMITS.text } = {}) => {
    const s = str(value);
    if (required && !s) problem(`${where} is empty.`);
    if (s.length > max) problem(`${where} is longer than ${max} letters.`);
    return s.slice(0, max);
  };

  if (!raw || raw.format !== PACK_FORMAT) throw new Error('This file is not a LearnOffline question pack.');
  if (raw.version > PACK_FORMAT_VERSION) throw new Error('This pack was made by a newer version. Please update the app first.');

  const packId = str(raw.packId);
  if (!PACK_ID_RE.test(packId)) problem('The pack ID is missing or damaged. Make the pack file again from the sheet.');
  const level = str(raw.level);
  if (!levels.has(level)) problem(`The grade "${level}" is not in this app.`);
  const title = text(raw.title, 'The pack name', { max: 60 });
  const subjectName = text(raw.subjectName, 'The subject name', { max: 24 });
  const icon = str(raw.icon).slice(0, 8) || '📝';
  const topicsIn = Array.isArray(raw.topics) ? raw.topics : [];
  if (!topicsIn.length) problem('The pack has no topics.');
  if (topicsIn.length > LIMITS.topics) problem(`A pack can have up to ${LIMITS.topics} topics.`);

  let questionCount = 0;
  const skillIds = new Set();
  const topicIds = new Set();
  const topics = topicsIn.slice(0, LIMITS.topics).map((t, ti) => {
    const topicTitle = text(t?.title, `Topic ${ti + 1}'s name`, { max: 60 });
    const topicId = str(t?.topicId);
    if (!topicId.startsWith(`${packId}-`) || topicIds.has(topicId)) problem(`Topic "${topicTitle}" has a missing or repeated ID.`);
    topicIds.add(topicId);
    const skillsIn = Array.isArray(t?.skills) ? t.skills : [];
    if (!skillsIn.length) problem(`Topic "${topicTitle}" has no skills.`);
    if (skillsIn.length > LIMITS.skillsPerTopic) problem(`Topic "${topicTitle}" has more than ${LIMITS.skillsPerTopic} skills.`);
    const skills = skillsIn.slice(0, LIMITS.skillsPerTopic).map((s, si) => {
      const skillTitle = text(s?.title, `Skill ${si + 1} in "${topicTitle}"`, { max: 60 });
      const skillId = str(s?.skillId);
      if (!skillId.startsWith(`${packId}-`) || skillIds.has(skillId)) problem(`Skill "${skillTitle}" has a missing or repeated ID.`);
      skillIds.add(skillId);
      const questionsIn = Array.isArray(s?.questions) ? s.questions : [];
      if (!questionsIn.length) problem(`Skill "${skillTitle}" has no questions.`);
      if (questionsIn.length > LIMITS.questionsPerSkill) problem(`Skill "${skillTitle}" has more than ${LIMITS.questionsPerSkill} questions.`);
      const questions = questionsIn.slice(0, LIMITS.questionsPerSkill).map((q, qi) => normalizeQuestion(q, `"${skillTitle}" question ${qi + 1}`, problem, text));
      questionCount += questions.length;
      const stepsIn = Array.isArray(s?.lesson?.steps) ? s.lesson.steps.slice(0, LIMITS.stepsPerLesson) : [];
      const steps = stepsIn.map((step, k) => ({ text: text(step?.text, `"${skillTitle}" lesson step ${k + 1}`) })).filter((step) => step.text);
      return { skillId, title: skillTitle, ...(steps.length ? { lesson: { steps } } : {}), questions };
    });
    return { topicId, title: topicTitle, icon: str(t?.icon).slice(0, 8) || icon, summary: text(t?.summary, 'A topic summary', { required: false, max: 120 }), skills };
  });
  if (questionCount > LIMITS.questions) problem(`A pack can have up to ${LIMITS.questions} questions.`);
  if (problems.length) throw new Error(`This pack has problems:\n• ${problems.join('\n• ')}`);

  const entry = {
    packId,
    subject: packId,
    subjectName,
    icon,
    level,
    levelName: levels.get(level),
    title,
    file: null,
    young: level === 'K2',
    custom: true,
  };
  return { entry, pack: { packId, version: '1.0.0', subject: packId, title, topics }, questionCount };
};

/** One question, rebuilt from known fields. Problems are reported, not thrown. */
const normalizeQuestion = (q, where, problem, text) => {
  const type = str(q?.type);
  if (!QUESTION_TYPES.includes(type)) problem(`${where} has an unknown type "${type}".`);
  const prompt = text(q?.prompt, `${where}'s question`);
  const out = { type, prompt };
  if (type === 'numeric') {
    const n = parseNumber(q?.answer);
    if (!Number.isFinite(n)) problem(`${where}: the answer "${str(q?.answer)}" is not a number.`);
    out.answer = n;
  } else if (type === 'fraction') {
    if (!parseFraction(q?.answer)) problem(`${where}: the answer "${str(q?.answer)}" is not a fraction like 3/4.`);
    out.answer = str(q?.answer);
  } else if (type === 'true-false') {
    const a = str(q?.answer).toLowerCase();
    if (a !== 'true' && a !== 'false') problem(`${where}: the answer must be true or false.`);
    out.answer = a;
  } else if (type === 'multiple-choice') {
    const choices = (Array.isArray(q?.choices) ? q.choices : []).map(str).filter(Boolean);
    const answer = str(q?.answer);
    if (choices.length < 2) problem(`${where} needs at least one wrong choice.`);
    if (choices.length > LIMITS.choices) problem(`${where} has more than ${LIMITS.choices} choices.`);
    if (new Set(choices).size !== choices.length) problem(`${where} has the same choice twice.`);
    if (!choices.includes(answer)) problem(`${where}: the answer is not one of the choices.`);
    if (choices.some((c) => c.length > 80)) problem(`${where} has a choice longer than 80 letters.`);
    Object.assign(out, { answer, choices: choices.slice(0, LIMITS.choices), shuffle: true });
  }
  const hint = text(q?.hint, `${where}'s hint`, { required: false });
  const explain = text(q?.explain, `${where}'s explanation`, { required: false });
  if (hint) out.hint = hint;
  if (explain) out.explain = explain;
  return out;
};

/* ------------------------------------------------------------------ */
/* Storage                                                             */
/* ------------------------------------------------------------------ */

/** Index entries of every imported pack (small: the questions are not loaded). */
export const listCustomPackEntries = async () => {
  const rows = await getAll(STORES.settings);
  return rows.filter((r) => String(r.key).startsWith(KEY_PREFIX) && r.value?.entry)
    .map((r) => ({ ...r.value.entry, questionCount: r.value.questionCount, importedAt: r.value.importedAt }));
};

/** The full pack, or null. */
export const getCustomPack = async (packId) => (await getSetting(`${KEY_PREFIX}${packId}`))?.pack || null;

/** True when a pack with this ID is already on the device (importing again replaces it). */
export const hasCustomPack = async (packId) => Boolean(await getSetting(`${KEY_PREFIX}${packId}`));

/** Save (or replace) an imported pack. Progress is kept for skills whose IDs did not change. */
export const saveCustomPack = ({ entry, pack, questionCount }) =>
  setSetting(`${KEY_PREFIX}${entry.packId}`, { entry, pack, questionCount, importedAt: Date.now() });

/**
 * Remove an imported pack. Learners who were on it move to `fallbackPackId`
 * (the first built-in subject at the same grade) so the app never opens a
 * missing pack. Their answers stay in the history.
 */
export const removeCustomPack = async (packId, fallbackPackId) => {
  const moved = (await listProfiles()).filter((p) => p.packId === packId);
  await Promise.all(moved.map((p) => put(STORES.profiles, { ...p, packId: fallbackPackId })));
  await del(STORES.settings, `${KEY_PREFIX}${packId}`);
  return moved.length;
};
