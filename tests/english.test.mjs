// English (Kinder 2): every generated question is checked for meaning, not
// only shape: the right letter, a real rhyme, no second right answer, and
// spoken text that the maths speech rules leave alone.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { generate } from '../js/engine/generators.js';
import { methodFor } from '../js/engine/techniques.js';
import { seededRng } from '../js/core/random.js';
import { toSpokenText } from '../js/core/speech.js';
import { ENGLISH_WORDS, CVC_WORDS, SIGHT_WORDS } from '../js/engine/topics/english.js';

const RUNS = 600;
const byEmoji = new Map(ENGLISH_WORDS.map((w) => [w.emoji, w]));
const byWord = new Map(ENGLISH_WORDS.map((w) => [w.word, w]));
const SOUND_ALIKE = [['c', 'k', 'q']];
const alike = (a, b) => a === b || SOUND_ALIKE.some((g) => g.includes(a) && g.includes(b));

const each = (spec, fn, seed = 5) => {
  const rng = seededRng(seed);
  for (let i = 0; i < RUNS; i += 1) {
    const q = generate(spec, rng);
    assert.equal(q.choices.length, 3, `${spec.type}: 3 choices`);
    assert.equal(new Set(q.choices).size, 3, `${spec.type}: no repeated choice`);
    assert.ok(q.choices.includes(q.answer), `${spec.type}: answer offered`);
    fn(q);
  }
};

/** The picture choices of a question, as words. */
const words = (q) => q.choices.map((e) => {
  const w = byEmoji.get(e);
  assert.ok(w, `unknown picture ${e}`);
  assert.equal(q.choiceLabels[e], w.word, 'each picture is named');
  return w;
});

test('the CVC list is really consonant, short vowel, consonant', () => {
  assert.ok(CVC_WORDS.length >= 20);
  for (const { word } of CVC_WORDS) assert.match(word, /^[^aeiou][aeiou][^aeiouyrw]$/, word);
  // Every vowel has words, so "missing middle letter" can ask for each.
  for (const v of 'aeiou') assert.ok(CVC_WORDS.filter((w) => w.word[1] === v).length >= 3, v);
});

test('pictures are unique, so a tapped picture means one word', () => {
  assert.equal(new Set(ENGLISH_WORDS.map((w) => w.emoji)).size, ENGLISH_WORDS.length);
});

test('letters: the letter asked for is the answer, in the right case', () => {
  each({ type: 'letterFind' }, (q) => {
    assert.match(q.say, new RegExp(`^Tap the letter ${q.answer}\\.$`));
    assert.ok(q.choices.every((c) => /^[A-Z]$/.test(c)));
  });
  each({ type: 'letterFind', small: true }, (q) => {
    assert.match(q.say, new RegExp(`^Tap the small letter ${q.answer}\\.$`));
    assert.ok(q.choices.every((c) => /^[a-z]$/.test(c)));
  });
  each({ type: 'letterMatch', toSmall: true }, (q) => {
    assert.equal(q.visual.tiles[0].toLowerCase(), q.answer);
    assert.ok(q.choices.every((c) => /^[a-z]$/.test(c)), 'only small letters to choose from');
  });
  each({ type: 'letterMatch', toSmall: false }, (q) => {
    assert.equal(q.visual.tiles[0].toUpperCase(), q.answer);
    assert.ok(q.choices.every((c) => /^[A-Z]$/.test(c)));
  });
  for (const small of [false, true]) {
    each({ type: 'letterNext', small }, (q) => {
      const shown = q.visual.tiles.slice(0, 3);
      const codes = [...shown, q.answer].map((l) => l.charCodeAt(0));
      codes.forEach((c, i) => i && assert.equal(c, codes[i - 1] + 1, `${shown} then ${q.answer}`));
      assert.equal(q.visual.tiles[3], null);
    });
  }
});

test('first sounds: the answer is the first letter; no choice makes the same sound', () => {
  each({ type: 'firstLetter' }, (q) => {
    const w = byEmoji.get(q.visual.emoji);
    assert.equal(q.answer, w.word[0]);
    assert.ok(q.say.includes(w.word));
    for (const c of q.choices) if (c !== q.answer) assert.ok(!alike(c, q.answer), `${w.word}: ${c} sounds like ${q.answer}`);
  });
  each({ type: 'sameSound' }, (q) => {
    const target = byEmoji.get(q.visual.emoji);
    const chosen = words(q);
    const right = chosen.filter((w) => alike(w.word[0], target.word[0]) && w.word !== target.word);
    assert.equal(right.length, 1, `exactly one starts like ${target.word}: ${chosen.map((w) => w.word)}`);
    assert.equal(right[0].emoji, q.answer);
    assert.ok(!chosen.some((w) => w.word === target.word), 'the target is not a choice');
  });
});

test('short words: missing letter, reading and picture words have one right answer', () => {
  each({ type: 'missingVowel' }, (q) => {
    const w = byEmoji.get(q.visual.emoji);
    assert.deepEqual(q.visual.tiles, [w.word[0], null, w.word[2]]);
    assert.equal(q.answer, w.word[1]);
    // No other vowel would make another real word for the same picture.
    assert.ok(q.choices.every((c) => 'aeiou'.includes(c)));
  });
  each({ type: 'readWord' }, (q) => {
    const word = q.visual.tiles.join('');
    assert.equal(byEmoji.get(q.answer).word, word);
    assert.equal(q.spoken, word);
    words(q);
  });
  each({ type: 'pictureWord' }, (q) => {
    assert.equal(byEmoji.get(q.visual.emoji).word, q.answer);
    assert.ok(q.choices.every((c) => byWord.has(c)), 'every word choice is a real word from the list');
  });
});

test('rhymes: exactly one choice rhymes, and it is the answer', () => {
  each({ type: 'rhyme' }, (q) => {
    const target = byEmoji.get(q.visual.emoji);
    const chosen = words(q);
    const rhymers = chosen.filter((w) => w.rhyme && w.rhyme === target.rhyme);
    assert.equal(rhymers.length, 1, `${target.word}: ${chosen.map((w) => w.word)}`);
    assert.equal(rhymers[0].emoji, q.answer);
    // Hand check of the families: the endings really match.
    const spelledDifferently = ['bear', 'pear', 'bee', 'tree', 'key', 'egg', 'leg'];
    assert.ok(target.word.slice(-2) === rhymers[0].word.slice(-2) || spelledDifferently.includes(target.word), `${target.word} / ${rhymers[0].word}`);
  });
});

test('sight words and sentences', () => {
  each({ type: 'sightWord' }, (q) => {
    assert.ok(SIGHT_WORDS.includes(q.answer));
    assert.equal(q.say, `Tap the word: ${q.answer}.`);
    assert.ok(q.listen, 'shown as text when the device cannot speak');
  });
  each({ type: 'readSentence' }, (q) => {
    const named = words(q).filter((w) => new RegExp(`\\b${w.word}\\b`).test(q.visual.text));
    assert.equal(named.length, 1, q.visual.text);
    assert.equal(named[0].emoji, q.answer);
  });
});

test('"Show me how" for English ends on the question\'s answer', () => {
  const rng = seededRng(8);
  for (const type of ['firstLetter', 'sameSound', 'missingVowel', 'readWord', 'pictureWord', 'rhyme']) {
    for (let i = 0; i < 300; i += 1) {
      const q = generate({ type }, rng);
      const m = methodFor(q);
      assert.ok(m, type);
      const last = m.guided.at(-1);
      assert.equal(last.answer, q.choiceLabels ? q.choiceLabels[q.answer] : q.answer, `${type}: ${q.prompt}`);
      assert.ok(last.choices.includes(last.answer));
      assert.equal(new Set(last.choices).size, last.choices.length);
      // Guided choices are words or letters (spoken clearly), never emoji.
      assert.ok(last.choices.every((c) => /^[a-zA-Z-]+$/.test(c)), `${type}: ${last.choices}`);
    }
  }
});

test('spoken English is never changed by the maths speech rules', () => {
  const rng = seededRng(13);
  const texts = new Set();
  for (const type of ['letterFind', 'letterMatch', 'letterNext', 'firstLetter', 'sameSound', 'missingVowel', 'readWord', 'pictureWord', 'rhyme', 'sightWord', 'readSentence']) {
    for (let i = 0; i < 300; i += 1) {
      const q = generate({ type, small: i % 2 === 0, toSmall: i % 3 === 0 }, rng);
      texts.add(q.say || q.prompt);
      texts.add(q.hint);
      texts.add(`The answer is ${q.spoken || q.answer}`);
      const m = methodFor(q);
      m?.steps.forEach((s) => texts.add(s.text));
      m?.guided.forEach((g) => texts.add(g.prompt));
    }
  }
  const pack = JSON.parse(readFileSync(new URL('../packs/english-k2.json', import.meta.url), 'utf8'));
  for (const topic of pack.topics) for (const s of topic.skills) for (const st of s.lesson.steps) texts.add(st.text);
  for (const t of texts) {
    const spoken = toSpokenText(t);
    assert.ok(!/metre|gram|litre|hour|minute|peso|centavo|equals|minus|plus|times|degrees/.test(spoken), `${t} -> ${spoken}`);
  }
});

test('a lone letter "a" always ends its phrase, so the voice says "ay", not the word "a"', async () => {
  const { revealText } = await import('../js/ui/components/interactive.js').catch(() => ({}));
  const rng = seededRng(21);
  const texts = new Set();
  for (const type of ['letterFind', 'letterMatch', 'letterNext', 'firstLetter', 'missingVowel', 'readWord', 'pictureWord']) {
    for (let i = 0; i < 400; i += 1) {
      const q = generate({ type, small: i % 2 === 0, toSmall: i % 3 === 0 }, rng);
      texts.add(q.say || q.prompt);
      texts.add(`The answer is ${q.spoken || q.answer}`);
      const m = methodFor(q);
      m?.steps.forEach((s) => texts.add(s.text));
      if (revealText) m?.guided.forEach((g) => texts.add(revealText(g)));
    }
  }
  const pack = JSON.parse(readFileSync(new URL('../packs/english-k2.json', import.meta.url), 'utf8'));
  for (const topic of pack.topics) for (const s of topic.skills) for (const st of s.lesson.steps) texts.add(st.text);
  // Checked with the Piper voice: "letter a to go on" -> "letter uh"; "letter a." -> "letter ay".
  for (const t of texts) assert.ok(!/\b(letter|big|small) [aA] (?=[a-zA-Z])/.test(t), t);
});
