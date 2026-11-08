// Own question packs: the Google Sheets script (run here in Node), the app's
// pack checker, storage on the device, and how the packs join the grade list.
import 'fake-indexeddb/auto';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import {
  normalizeCustomPack, saveCustomPack, listCustomPackEntries, getCustomPack, hasCustomPack, removeCustomPack, LIMITS,
} from '../js/data/customPacks.js';
import { loadPackIndex, loadPack, resetPackCaches } from '../js/data/packs.js';
import { saveProfile, listProfiles } from '../js/data/repo.js';
import { questionsForSkill } from '../js/engine/practice.js';
import { isCorrect } from '../js/engine/answers.js';
import { seededRng } from '../js/core/random.js';

const root = new URL('../', import.meta.url);

// The built-in pack index, read from disk in place of fetch().
globalThis.fetch = async (url) => {
  const body = readFileSync(new URL(String(url).replace(/^\.\//, ''), root), 'utf8');
  return { ok: true, status: 200, json: async () => JSON.parse(body) };
};

/** The .gs file's functions, in a sandbox with no Google services. */
const sheet = (() => {
  const context = vm.createContext({});
  vm.runInContext(readFileSync(new URL('tools/sheets/LearnOfflinePacks.gs', root), 'utf8'), context);
  return context;
})();

const LEVELS = new Map([['K2', 'Kinder 2'], ['G4', 'Grade 4'], ['G6', 'Grade 6']]);
const PACK_ID = 'custom-my-own-questions-ab12';
const packRows = (overrides = {}) => Object.entries({
  'Pack name': 'My own questions', 'Subject tab name': 'Extra', Grade: 'Grade 4', Icon: '🧮', 'Pack ID (do not change)': PACK_ID, ...overrides,
}).map(([k, v]) => [k, v]);
const row = (topic, skill, type, question, answer, wrong = [], hint = '', explain = '') =>
  [topic, skill, type, question, answer, wrong[0] || '', wrong[1] || '', wrong[2] || '', hint, explain];
const GOOD_ROWS = [
  row('Money', 'Adding pesos', 'Number', 'Ana has ₱25 and gets ₱40. How much now?', '₱65', [], 'Add them.', '25 + 40 = 65'),
  row('Money', 'Adding pesos', 'Multiple choice', 'Which coins make ₱15?', '₱10 and ₱5', ['₱10 and ₱1', '₱5 and ₱5', '₱20']),
  row('Fractions', 'Half and quarter', 'Fraction', '2 slices out of 8 is what fraction?', '1/4'),
  row('Fractions', 'Half and quarter', 'True or false', '1/2 is bigger than 1/4.', 'TRUE'),
  row('', '', '', '', ''), // a blank row is skipped
  row('Money', 'Big numbers', 'Number', 'What is 999 + 1?', '1,000'),
  row('Fractions', 'Half and quarter', 'Fraction', 'Three halves as a mixed number?', '1 1/2'),
];
const LESSON_ROWS = [['Money', 'Adding pesos', 'Add the ones first.'], ['Money', 'Adding pesos', 'Then add the tens.'], ['', '', '']];

test('the sheet makes a pack the app accepts, with stable IDs', () => {
  const built = sheet.buildPack_(packRows(), GOOD_ROWS, LESSON_ROWS);
  assert.deepEqual([...built.problems], []);
  assert.equal(built.questionCount, 6);
  assert.equal(built.skillCount, 3);
  const pack = JSON.parse(JSON.stringify(built.pack)); // as written to the file
  assert.equal(pack.topics[0].skills[0].skillId, `${PACK_ID}-money-adding-pesos`);
  assert.equal(pack.topics[0].skills[0].lesson.steps.length, 2);
  assert.deepEqual(pack.topics[0].skills[0].questions[1].choices, ['₱10 and ₱5', '₱10 and ₱1', '₱5 and ₱5', '₱20']);
  // The same sheet always gives the same IDs, so progress carries over when a pack is imported again.
  assert.deepEqual(JSON.parse(JSON.stringify(sheet.buildPack_(packRows(), GOOD_ROWS, LESSON_ROWS).pack)), pack);

  const { entry, pack: saved, questionCount } = normalizeCustomPack(pack, { levels: LEVELS });
  assert.equal(questionCount, 6);
  assert.deepEqual({ ...entry }, {
    packId: PACK_ID, subject: PACK_ID, subjectName: 'Extra', icon: '🧮', level: 'G4', levelName: 'Grade 4', title: 'My own questions', file: null, young: false, custom: true,
  });
  const qs = saved.topics.flatMap((t) => t.skills.flatMap((s) => s.questions));
  assert.equal(qs[0].answer, 65);
  assert.equal(qs.find((q) => q.type === 'true-false').answer, 'true');
  assert.equal(qs.find((q) => q.prompt.startsWith('What is 999')).answer, 1000);
  assert.ok(qs.find((q) => q.type === 'multiple-choice').shuffle);
});

test('the sheet points at the row with each mistake', () => {
  const rows = [
    row('Money', 'Adding', 'Number', 'How much?', 'sixty'),
    row('Money', 'Adding', 'Multiple choice', 'Pick one', 'A'),
    row('Money', 'Adding', 'Multiple choice', 'Pick one', 'A', ['A', 'B']),
    row('Money', 'Adding', 'Fraction', 'Half?', '1/0'),
    row('Money', 'Adding', 'True or false', 'Yes?', 'Yes'),
    row('Money', '', 'Number', 'No skill', '3'),
    row('Money', 'Adding', 'Story', 'Bad type', '3'),
    row('Money', 'Adding', 'Number', 'Fine', '3'),
  ];
  const built = sheet.buildPack_(packRows(), rows, [['Money', 'Adding', 'ok'], ['Money', 'Nope', 'step']]);
  assert.deepEqual(Object.keys(built.rowProblems).map(Number), [0, 1, 2, 3, 4, 5, 6]);
  assert.match(built.rowProblems[0][0], /number/);
  assert.match(built.rowProblems[1][0], /wrong choice/);
  assert.match(built.rowProblems[2][0], /different/);
  assert.match(built.rowProblems[3][0], /fraction/);
  assert.match(built.rowProblems[4][0], /True or False/);
  assert.match(built.problems.join('\n'), /Lessons row 3/);
  assert.equal(built.questionCount, 1);
  // Two topic names that make the same ID are caught before the app sees them.
  const alike = sheet.buildPack_(packRows(), [row('Money!', 'A', 'Number', 'Q', '1'), row('Money', 'A', 'Number', 'Q', '2')], []);
  assert.match(alike.problems.join(), /too alike/);
  // Pack tab settings.
  assert.match(sheet.buildPack_(packRows({ Grade: '' }), GOOD_ROWS, []).problems.join(), /grade/);
  assert.match(sheet.buildPack_(packRows({ 'Pack ID (do not change)': 'abc' }), GOOD_ROWS, []).problems.join(), /pack ID/);
  assert.match(sheet.buildPack_(packRows(), [], []).problems.join(), /at least one question/);
});

test('sheet helpers: slugs, new pack IDs and safe script text', () => {
  assert.equal(sheet.slug_('Adding Pesos!'), 'adding-pesos');
  assert.equal(sheet.slug_('Ñiño café'), 'nino-cafe');
  assert.match(sheet.slug_('数学'), /^x[0-9a-z]+$/); // no a–z letters: a short code
  assert.notEqual(sheet.slug_('数学'), sheet.slug_('算数'));
  for (let i = 0; i < 50; i += 1) assert.match(sheet.newPackId_('My Very Long Pack Name For The Kids'), /^custom-[a-z0-9-]{1,48}$/);
  assert.ok(!sheet.scriptLiteral_('</script><b>').includes('<'));
  assert.equal(JSON.parse(sheet.scriptLiteral_('a</script>')), 'a</script>');
  assert.ok(sheet.isFraction_('3/4') && sheet.isFraction_('1 1/2') && sheet.isFraction_('2'));
  assert.ok(!sheet.isFraction_('1/0') && !sheet.isFraction_('1 2') && !sheet.isFraction_('a/b'));
});

test('the app refuses damaged or unsafe pack files with clear reasons', () => {
  const good = () => JSON.parse(JSON.stringify(sheet.buildPack_(packRows(), GOOD_ROWS, LESSON_ROWS).pack));
  assert.throws(() => normalizeCustomPack({ format: 'learnoffline-backup' }, { levels: LEVELS }), /not a LearnOffline question pack/);
  assert.throws(() => normalizeCustomPack({ ...good(), version: 9 }, { levels: LEVELS }), /newer version/);
  assert.throws(() => normalizeCustomPack({ ...good(), level: 'G9' }, { levels: LEVELS }), /grade "G9"/);
  assert.throws(() => normalizeCustomPack({ ...good(), packId: 'math-g4' }, { levels: LEVELS }), /pack ID/);
  const stolen = good();
  stolen.topics[0].skills[0].skillId = 'g4-add'; // must not reuse a built-in skill's progress
  assert.throws(() => normalizeCustomPack(stolen, { levels: LEVELS }), /missing or repeated ID/);
  const big = good();
  big.topics[0].skills[0].questions = Array.from({ length: LIMITS.questionsPerSkill + 1 }, () => ({ type: 'numeric', prompt: 'Q', answer: '1' }));
  assert.throws(() => normalizeCustomPack(big, { levels: LEVELS }), /more than 300 questions/);
  // Unknown fields (a generator, a visual, script text) are dropped, not stored.
  const extra = good();
  Object.assign(extra.topics[0].skills[0], { generator: { type: 'add' } });
  Object.assign(extra.topics[0].skills[0].questions[0], { visual: { kind: 'x' }, onclick: 'alert(1)' });
  const out = normalizeCustomPack(extra, { levels: LEVELS }).pack.topics[0].skills[0];
  assert.equal(out.generator, undefined);
  assert.deepEqual(Object.keys(out.questions[0]).sort(), ['answer', 'explain', 'hint', 'prompt', 'type']);
  // At most five problems are listed, so the message stays readable.
  const many = good();
  many.topics[0].skills[0].questions = Array.from({ length: 9 }, () => ({ type: 'numeric', prompt: '', answer: 'x' }));
  const message = (() => { try { normalizeCustomPack(many, { levels: LEVELS }); return ''; } catch (e) { return e.message; } })();
  assert.equal((message.match(/•/g) || []).length, 5);
});

test('imported packs are saved, listed after their grade, loaded and removed', async () => {
  const levels = new Map([['K2', 'Kinder 2'], ['G1', 'Grade 1'], ['G2', 'Grade 2'], ['G3', 'Grade 3'], ['G4', 'Grade 4'], ['G5', 'Grade 5'], ['G6', 'Grade 6']]);
  const result = normalizeCustomPack(JSON.parse(JSON.stringify(sheet.buildPack_(packRows(), GOOD_ROWS, LESSON_ROWS).pack)), { levels });
  assert.equal(await hasCustomPack(PACK_ID), false);
  await saveCustomPack(result);
  resetPackCaches(PACK_ID);
  assert.equal(await hasCustomPack(PACK_ID), true);
  assert.equal((await listCustomPackEntries())[0].questionCount, 6);

  const index = await loadPackIndex();
  const at = index.findIndex((p) => p.packId === PACK_ID);
  assert.equal(index[at - 1].packId, 'science-g4', 'right after the last built-in Grade 4 subject');
  assert.equal(index[at + 1].level, 'G5', 'before Grade 5');

  const indexed = await loadPack(PACK_ID);
  assert.equal(indexed.skillOrder.length, 3);
  assert.equal(indexed.entry.custom, true);
  const skill = indexed.skillById.get(`${PACK_ID}-money-adding-pesos`);
  const set = questionsForSkill(skill, 10, seededRng(4));
  assert.equal(set.length, 2);
  const number = set.find((q) => q.answerType === 'numeric');
  assert.ok(isCorrect(number, '65'));

  // A learner on the pack moves to the grade's first subject when it is removed.
  const mia = await saveProfile({ name: 'Mia', packId: PACK_ID, avatar: '🦊' });
  const moved = await removeCustomPack(PACK_ID, 'math-g4');
  resetPackCaches(PACK_ID);
  assert.equal(moved, 1);
  assert.equal((await listProfiles()).find((p) => p.profileId === mia.profileId).packId, 'math-g4');
  assert.equal(await getCustomPack(PACK_ID), null);
  assert.equal((await loadPackIndex()).some((p) => p.packId === PACK_ID), false);
  await assert.rejects(loadPack(PACK_ID), /not installed/);
});

test('sheet-made multiple choice questions show their choices in a mixed order', () => {
  const skill = { skillId: 's', questions: [{ type: 'multiple-choice', prompt: 'Pick', answer: 'A', choices: ['A', 'B', 'C', 'D'], shuffle: true }] };
  const firsts = new Set();
  const rng = seededRng(9);
  for (let i = 0; i < 200; i += 1) {
    const [q] = questionsForSkill(skill, 1, rng);
    assert.deepEqual([...q.choices].sort(), ['A', 'B', 'C', 'D']);
    assert.equal(q.answer, 'A');
    firsts.add(q.choices[0]);
  }
  assert.equal(firsts.size, 4, 'the right answer is not always first');
  // Built-in packs keep the order they were written in.
  const fixed = { skillId: 't', questions: [{ type: 'multiple-choice', prompt: 'Pick', answer: 'A', choices: ['A', 'B', 'C'] }] };
  assert.deepEqual(questionsForSkill(fixed, 1, rng)[0].choices, ['A', 'B', 'C']);
});
