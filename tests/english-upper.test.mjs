// English Grades 1–3: every word list and story checked for one right answer,
// and every generator checked over many questions. Run with: npm test
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { generate } from '../js/engine/generators.js';
import { seededRng } from '../js/core/random.js';
import { toSpokenText } from '../js/core/speech.js';
import * as D from '../js/engine/topics/englishData.js';
import { SENTENCE_BANK_NAMES, STORY_GRADES } from '../js/engine/topics/englishPlus.js';

const SPECS = [
  { type: 'digraphStart' }, { type: 'blendStart' }, { type: 'magicE' }, { type: 'vowelTeam' }, { type: 'rControlled' },
  { type: 'plural' }, { type: 'plural', irregular: true }, { type: 'wordType', kind: 'noun' }, { type: 'wordType', kind: 'verb' },
  { type: 'pairWord', kind: 'opposite' }, { type: 'pairWord', kind: 'synonym' }, { type: 'compound' }, { type: 'contraction' },
  { type: 'affix', kind: 'prefix' }, { type: 'affix', kind: 'suffix' }, { type: 'syllables' }, { type: 'article' },
  { type: 'rhymeWord' }, { type: 'abcOrder' }, { type: 'abcOrder', sameFirst: true },
  ...SENTENCE_BANK_NAMES.map((bank) => ({ type: 'fillBlank', bank })),
  { type: 'wordInSentence', bank: 'adjective' }, { type: 'wordInSentence', bank: 'adverb' },
  { type: 'capitalStop' }, { type: 'endMark' }, { type: 'properNoun' }, { type: 'sentenceOrder' }, { type: 'idiom' },
  ...STORY_GRADES.map((grade) => ({ type: 'story', grade })),
];
const BAD_TEXT = /undefined|NaN|null|\[object/;

test('every English generator gives one right answer among different choices', () => {
  const rng = seededRng(101);
  for (const spec of SPECS) {
    const prompts = new Set();
    for (let i = 0; i < 400; i += 1) {
      const q = generate(spec, rng);
      const label = `${JSON.stringify(spec)}: ${q.prompt}`;
      assert.equal(q.answerType, 'choice', label);
      assert.ok(q.choices.length >= 2, label);
      assert.equal(new Set(q.choices).size, q.choices.length, `${label} repeats a choice: ${q.choices}`);
      assert.equal(q.choices.filter((c) => c === q.answer).length, 1, `${label}: answer ${q.answer} in ${q.choices}`);
      for (const text of [q.prompt, q.say, q.hint, q.explain, ...q.choices, q.visual?.text, q.visual?.label]) {
        if (text !== undefined) assert.ok(!BAD_TEXT.test(String(text)), `${label}: "${text}"`);
      }
      // What is read aloud never contains the blank line or a stray symbol.
      assert.ok(!/___|[{}]/.test(toSpokenText(q.say || q.prompt)), `${label}: spoken "${q.say || q.prompt}"`);
      prompts.add(`${q.prompt}|${q.say || ''}|${q.visual?.text || q.visual?.emoji || ''}|${q.answer}`);
    }
    assert.ok(prompts.size >= 5, `${JSON.stringify(spec)} has only ${prompts.size} different questions`);
  }
});

test('phonics lists: each word really starts with or contains what it is filed under', () => {
  for (const w of D.DIGRAPH_WORDS) assert.ok(D.DIGRAPHS.includes(w.start) && w.word.startsWith(w.start), w.word);
  for (const w of D.BLEND_WORDS) assert.ok(D.BLENDS.includes(w.start) && w.word.startsWith(w.start), w.word);
  for (const m of D.MAGIC_E) {
    assert.match(m.a, /^[a-z]*[aeiou][^aeiou]e$/, `${m.a} ends in vowel, consonant, e`);
    for (const w of m.w) assert.ok(!w.endsWith('e'), `${m.a}: wrong word ${w} has a magic e too`);
  }
  for (const r of D.R_CONTROLLED) {
    assert.equal(r.before + r.team + r.after, r.word);
    assert.ok(D.R_TEAMS.includes(r.team), r.word);
  }
  for (const [word, wrong] of D.VOWEL_TEAMS) {
    assert.match(word, /ai|ay|ee|ea|oa|ow/, word);
    assert.ok(!wrong.includes(word) && new Set(wrong).size === wrong.length, word);
  }
  for (const [family, words] of Object.entries(D.WORD_FAMILIES)) for (const w of words) assert.ok(w.endsWith(family), w);
  const allFamilyWords = Object.values(D.WORD_FAMILIES).flat();
  assert.equal(new Set(allFamilyWords).size, allFamilyWords.length, 'a word in two families');
});

test('word lists: right answers are never also among the wrong ones', () => {
  const check = (rows, name) => rows.forEach(([, right, wrong]) => {
    assert.ok(!wrong.includes(right), `${name}: ${right}`);
    assert.equal(new Set(wrong).size, wrong.length, `${name}: ${wrong}`);
  });
  check(D.PLURALS, 'plurals'); check(D.IRREGULAR_PLURALS, 'irregular plurals'); check(D.PAST_TENSE, 'past'); check(D.PRONOUNS, 'pronouns');
  check(D.ADJECTIVES, 'adjectives'); check(D.CONTRACTIONS, 'contractions'); check(D.PREFIXES, 'prefixes'); check(D.SUFFIXES, 'suffixes');
  check(D.HOMOPHONES, 'homophones'); check(D.AGREEMENT, 'agreement'); check(D.TENSES, 'tenses'); check(D.ADVERBS, 'adverbs');
  check(D.COMPARISONS, 'comparisons'); check(D.CONJUNCTIONS, 'conjunctions'); check(D.IDIOMS, 'idioms');
  // Words found in a sentence really are in it.
  for (const [text, right, wrong] of [...D.ADJECTIVES, ...D.ADVERBS]) {
    for (const w of [right, ...wrong]) assert.ok(new RegExp(`\\b${w}\\b`).test(text), `${w} in "${text}"`);
  }
  // Each blank sentence has exactly one blank.
  for (const [text] of [...D.PAST_TENSE, ...D.PRONOUNS, ...D.HOMOPHONES, ...D.AGREEMENT, ...D.TENSES, ...D.COMPARISONS, ...D.CONJUNCTIONS]) {
    assert.equal(text.split('___').length, 2, text);
  }
  // Word types never overlap.
  for (const n of D.NOUNS) assert.ok(!D.WORDS_NOT_NOUN.includes(n), n);
  for (const v of D.VERBS) assert.ok(!D.WORDS_NOT_VERB.includes(v), v);
  for (const [word, a, b] of D.COMPOUNDS) assert.equal(a + b, word);
  for (const c of D.COMPOUNDS) assert.ok(!D.NOT_COMPOUNDS.includes(c[0]), c[0]);
  // Contractions: an apostrophe, and the letters are the full form's letters in order with some left out.
  for (const [full, short] of D.CONTRACTIONS) {
    assert.ok(short.includes("'"), short);
    const letters = short.replace("'", '').toLowerCase().replace(/^won/, 'willn');
    let i = 0;
    for (const ch of full.replace(' ', '').toLowerCase()) if (ch === letters[i]) i += 1;
    assert.equal(i, letters.length, `${full} -> ${short}`);
  }
  // Plurals: regular ones add -s or -es exactly.
  for (const [one, many] of D.PLURALS) assert.ok(many === `${one}s` || many === `${one}es`, many);
});

test('opposite and same-meaning pairs never offer a word from the same group as a wrong answer', () => {
  const rng = seededRng(3);
  for (const [kind, pairs] of [['opposite', D.OPPOSITES], ['synonym', D.SYNONYMS]]) {
    const words = pairs.flatMap((p) => [p[0], p[1]]);
    assert.equal(new Set(words).size, words.length, `${kind}: a word is in two pairs`);
    const groupOf = new Map(pairs.flatMap((p) => [[p[0], p[2]], [p[1], p[2]]]));
    for (let i = 0; i < 2000; i += 1) {
      const q = generate({ type: 'pairWord', kind }, rng);
      const word = /"(.+)"/.exec(q.prompt)[1];
      const pair = pairs.find((p) => p[0] === word || p[1] === word);
      assert.equal(q.answer, pair[0] === word ? pair[1] : pair[0], q.prompt);
      for (const c of q.choices) if (c !== q.answer) assert.notEqual(groupOf.get(c), groupOf.get(word), `${q.prompt}: ${c}`);
    }
  }
});

test('sentence rules: capitals, end marks, a or an, ABC order and word order', () => {
  const rng = seededRng(5);
  for (let i = 0; i < 1500; i += 1) {
    const c = generate({ type: 'capitalStop' }, rng);
    assert.deepEqual(c.choices.filter((s) => /^[A-Z].*\.$/.test(s)), [c.answer], c.choices.join(' | '));
    const p = generate({ type: 'properNoun' }, rng);
    const right = p.choices.filter((s) => /^[A-Z]/.test(s) && s === p.answer);
    assert.equal(right.length, 1);
    assert.equal(p.choices.filter((s) => s.toLowerCase() === p.answer.toLowerCase()).length, 3, 'only capitals differ');
    for (const words of [false, true]) {
      const a = generate({ type: 'abcOrder', sameFirst: words }, rng);
      assert.equal(a.answer, [...a.choices].sort()[0]);
      if (words) {
        assert.equal(new Set(a.choices.map((w) => w[0])).size, 1, 'same first letter');
        assert.equal(new Set(a.choices.map((w) => w[1])).size, 3, 'different second letters');
      } else {
        assert.equal(new Set(a.choices.map((w) => w[0])).size, 3, 'different first letters');
      }
    }
  }
  // Word order: the wrong orders use the same words, start with a capital and end with a full stop, like the right one.
  const words = (s) => s.slice(0, -1).toLowerCase().split(' ').sort();
  for (const [right, ...wrong] of D.ORDER_SENTENCES) {
    assert.equal(wrong.length, 2, right);
    for (const w of wrong) {
      assert.deepEqual(words(w), words(right), w);
      assert.match(w, /^[A-Z][^A-Z]*(?: (?:I|Ana|Papa)\b[^A-Z]*)*\.$/, `${w}: capital only at the start (and names)`);
      assert.notEqual(w, right);
    }
  }
  for (const [text, mark] of D.END_MARKS) {
    assert.equal(/^(Where|What|Who|How|Can|Do|Is|Are)\b/.test(text), mark === '?', text);
  }
  // a or an goes by the first sound: these spellings break the vowel-letter rule.
  const SOUND = { hour: 'an', honest: 'an', uniform: 'a', unicorn: 'a', 'one-peso': 'a' };
  for (const [words, answer] of D.ARTICLES) {
    const first = words.split(' ')[0];
    const expected = SOUND[first] || (/^[aeiou]/.test(first) ? 'an' : 'a');
    assert.equal(answer, expected, words);
  }
  for (const [, n] of D.SYLLABLES) assert.ok(n >= 1 && n <= 4);
});

test('stories: every question has one right answer that differs from the wrong ones', () => {
  for (const [grade, stories] of [[1, D.STORIES_G1], [2, D.STORIES_G2], [3, D.STORIES_G3]]) {
    assert.ok(stories.length >= 8, `grade ${grade} has ${stories.length} stories`);
    for (const s of stories) {
      assert.ok(s.title && s.text.length > 40, s.title);
      assert.equal(new Set(s.qs.map((q) => q.q)).size, s.qs.length, `${s.title}: repeated question`);
      for (const q of s.qs) {
        assert.ok(!q.w.includes(q.a), `${s.title}: ${q.q}`);
        assert.equal(new Set(q.w).size, q.w.length, `${s.title}: ${q.q}`);
      }
    }
  }
  // Early grades: the answer's key words appear in the story, so it can be found by looking back.
  for (const s of D.STORIES_G1) {
    for (const q of s.qs) {
      const key = q.a.replace(/[^a-z' ]/gi, '').toLowerCase().split(' ').filter((w) => w.length > 2 && !['the', 'it', 'its'].includes(w));
      for (const w of key) assert.ok(s.text.toLowerCase().includes(w.replace(/'s$/, '')), `${s.title}: "${w}" from "${q.a}"`);
    }
  }
});

test('English Grade 1–3 packs: lessons check with the right answer', () => {
  for (const g of [1, 2, 3]) {
    const pack = JSON.parse(readFileSync(new URL(`../packs/english-g${g}.json`, import.meta.url), 'utf8'));
    assert.equal(pack.subject, 'english');
    let skills = 0;
    for (const t of pack.topics) {
      for (const s of t.skills) {
        skills += 1;
        if (!s.lesson) { assert.ok(t.challenge, s.skillId); continue; }
        const check = s.lesson.steps.find((st) => st.interact?.kind === 'check');
        assert.ok(check, `${s.skillId} has a your-turn step`);
        assert.ok(check.interact.choices.includes(check.interact.answer), s.skillId);
        assert.equal(new Set(check.interact.choices).size, check.interact.choices.length, s.skillId);
        // Listening questions show the word to read in a lesson (lesson steps are not played on their own).
        assert.ok(!/you hear/.test(check.interact.prompt), `${s.skillId}: ${check.interact.prompt}`);
      }
    }
    assert.ok(skills >= 12, `grade ${g}: ${skills} skills`);
  }
});
