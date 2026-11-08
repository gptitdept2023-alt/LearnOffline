// Filipino labels: every label has both languages, every template fills in
// cleanly, spoken words stay English, and a learner's choice is saved.
import 'fake-indexeddb/auto';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { t, tEn, setLanguage, getLanguage, isLanguage, LANGUAGES, dictionaryEntries } from '../js/core/i18n.js';
import { describeTask, newQuest, tierName } from '../js/engine/quests.js';
import { cheer, cheerShown } from '../js/ui/screens/resultsText.js';
import { saveProfile, getProfile } from '../js/data/repo.js';

const root = new URL('../', import.meta.url);

/** English-only labels: shown only on the start screen, the parent area or the update bar. */
const ENGLISH_ONLY = new Set(['appName', 'labelLanguage', 'offlineReady', 'updateReady', 'reload']);

const SAMPLE_ARGS = ['Ana', 3, 7, 12];
const render = (value) => (typeof value === 'function' ? value(...SAMPLE_ARGS) : value);

test('every Filipino label has an English one of the same shape', () => {
  const en = new Map(dictionaryEntries('en'));
  for (const [key, value] of dictionaryEntries('fil')) {
    assert.ok(en.has(key), `fil has a label English lacks: ${key}`);
    assert.equal(typeof value, typeof en.get(key), `${key}: one is a template, the other is not`);
    if (typeof value === 'function') assert.equal(value.length, en.get(key).length, `${key}: templates take different values`);
  }
});

test('every learner label is translated to Filipino', () => {
  const fil = new Set(dictionaryEntries('fil').map(([key]) => key));
  const missing = dictionaryEntries('en').map(([key]) => key).filter((key) => !ENGLISH_ONLY.has(key) && !fil.has(key));
  assert.deepEqual(missing, []);
});

test('templates fill in cleanly in both languages', () => {
  for (const lang of ['en', 'fil']) {
    for (const [key, value] of dictionaryEntries(lang)) {
      const text = render(value);
      assert.equal(typeof text, 'string', `${lang}.${key}`);
      assert.ok(text.trim().length > 0, `${lang}.${key} is empty`);
      assert.ok(!/undefined|NaN|\$\{|\[object/.test(text), `${lang}.${key}: ${text}`);
      assert.ok(!/ {2}/.test(text), `${lang}.${key} has a double space: ${text}`);
    }
  }
});

test('English plurals agree with the count', () => {
  setLanguage('en');
  assert.equal(t('scoreLine', 80, 1), 'Score 80 · 1 question answered');
  assert.equal(t('scoreLine', 80, 2), 'Score 80 · 2 questions answered');
  assert.equal(t('goalToday', 0, 1), 'Today: 0 of 1 practice set');
  assert.equal(t('goalToday', 1, 2), 'Today: 1 of 2 practice sets');
});

test('setLanguage falls back to English; unknown keys show themselves', () => {
  setLanguage('xx');
  assert.equal(getLanguage(), 'en');
  setLanguage(undefined);
  assert.equal(getLanguage(), 'en');
  assert.equal(t('no-such-label'), 'no-such-label');
  assert.ok(isLanguage('fil') && !isLanguage('toString') && !isLanguage(null));
  assert.deepEqual(LANGUAGES.map((l) => l.code), ['en', 'fil']);
});

test('Filipino shows Filipino, while spoken words stay English', () => {
  setLanguage('fil');
  try {
    assert.equal(t('correct'), 'Tama!');
    assert.equal(tEn('correct'), 'Correct!');
    assert.equal(t('appName'), 'LearnOffline'); // English-only labels fall back
    assert.equal(cheer(100), 'Perfect!');
    assert.equal(cheerShown(100), 'Perpekto!');
    assert.equal(tierName(2), 'Bonus na misyon');
    assert.equal(tierName(9), 'Misyon ng kampeon');
    const quest = newQuest('2026-11-07', false);
    for (const task of quest.tasks) {
      const { text } = describeTask(task);
      assert.ok(text && !/undefined|Finish|Get |Play|Earn/.test(text), text);
    }
  } finally {
    setLanguage('en');
  }
});

test('cheer() keeps the exact English the voice pack recorded', () => {
  setLanguage('fil');
  try {
    assert.deepEqual([100, 80, 50, 0].map(cheer), ['Perfect!', 'Great work!', 'Good effort!', 'Keep practising!']);
  } finally {
    setLanguage('en');
  }
});

test('a learner keeps their label language; bad codes become English', async () => {
  const fil = await saveProfile({ name: 'Ana', avatar: '🦊', packId: 'math-g4', language: 'fil' });
  assert.equal((await getProfile(fil.profileId)).language, 'fil');
  // The subject tabs save {...profile, packId}: the language stays.
  await saveProfile({ ...fil, packId: 'english-g3' });
  assert.equal((await getProfile(fil.profileId)).language, 'fil');
  // An edit that sends an unknown code keeps the current language.
  await saveProfile({ ...fil, language: 'xx' });
  assert.equal((await getProfile(fil.profileId)).language, 'fil');
  const plain = await saveProfile({ name: 'Ben', avatar: '🐼', packId: 'math-k2' });
  assert.equal(plain.language, 'en');
});

test('learner screens have no leftover English labels in quotes', () => {
  // Words that were labels before; they must now come from t(). Spoken text
  // (speak(...)) and console messages are allowed to stay English.
  const LABELS = ['Try with help', 'On my own', 'Watch and do', 'Practise again', 'New badge!', 'Stars earned', 'Next step',
    'Show all', 'Hide picture', 'Type an answer first', 'Stop practice', 'Bonus topic', 'My goal', 'Open me!', 'Wear it',
    'Take it off', 'All levels', 'Show me how', 'Opening…', 'Saving…'];
  const dirs = ['js/ui/screens/', 'js/ui/components/'];
  const skip = new Set(['parent.js', 'parentPacks.js', 'report.js', 'games.js']);
  for (const dir of dirs) {
    for (const file of readdirSync(new URL(dir, root))) {
      if (!file.endsWith('.js') || skip.has(file)) continue;
      const lines = readFileSync(new URL(dir + file, root), 'utf8').split('\n')
        .filter((line) => !/speak\(|console\.|^\s*(\*|\/\/)/.test(line));
      for (const label of LABELS) {
        const hit = lines.find((line) => line.includes(`'${label}`) || line.includes(`\`${label}`) || line.includes(`'↻ ${label}`));
        assert.ok(!hit, `${file} still has "${label}": ${hit?.trim()}`);
      }
    }
  }
});
