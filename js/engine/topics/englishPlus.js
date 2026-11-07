/**
 * English for Grades 1–3: phonics (sh/ch/th, blends, magic e, vowel teams,
 * r-controlled vowels), words (plurals, word types, opposites, synonyms,
 * prefixes and suffixes, homophones), sentences (capital letters, end marks,
 * tenses, agreement, joining words) and reading stories.
 *
 * Every question is a choice question built from the fixed lists in
 * englishData.js, so each right answer is written down by hand and checked by
 * tests/english-upper.test.mjs (one right answer, no repeated choices).
 * Pure and DOM-free.
 */

import { pick, shuffle } from '../../core/random.js';
import { choicesWith } from './shared.js';
import * as D from './englishData.js';

const capitalise = (text) => text[0].toUpperCase() + text.slice(1);
const picture = (emoji, label) => ({ kind: 'letters', emoji, label });
const sentence = (text) => ({ kind: 'letters', text, label: text.replace(/___/g, 'blank') });
const quoted = (word) => `"${word}"`;

/** A choice question from a right answer and its wrong answers (all of them, up to `count` choices). */
const choiceQuestion = ({ answer, wrong, rng, count = 3, ...rest }) => ({
  answerType: 'choice',
  answer,
  choices: choicesWith(answer, wrong, rng, count),
  ...rest,
});

/* ------------------------------------------------------------------ */
/* Phonics                                                             */
/* ------------------------------------------------------------------ */

/** Picture -> sh, ch, th or wh. */
const digraphStart = (params, rng) => {
  const w = pick(D.DIGRAPH_WORDS, rng);
  return choiceQuestion({
    rng,
    count: 4,
    answer: w.start,
    wrong: D.DIGRAPHS,
    prompt: 'Which two letters does it start with?',
    say: `${capitalise(w.word)}. Which two letters does ${w.word} start with?`,
    choiceKind: 'letter',
    visual: picture(w.emoji, w.word),
    hint: 'Say the word. sh says shh, ch says ch as in chair, th puts your tongue between your teeth, wh says w.',
    explain: `${capitalise(w.word)} starts with ${w.start}.`,
  });
};

/** Picture -> the two-letter blend it starts with (fr, st, pl…). */
const blendStart = (params, rng) => {
  const w = pick(D.BLEND_WORDS, rng);
  return choiceQuestion({
    rng,
    answer: w.start,
    wrong: D.BLENDS,
    prompt: 'Which two letters does it start with?',
    say: `${capitalise(w.word)}. Which two letters does ${w.word} start with?`,
    choiceKind: 'letter',
    visual: picture(w.emoji, w.word),
    hint: 'Say the word slowly. Listen for the first two sounds blended together.',
    explain: `${capitalise(w.word)} starts with ${w.start}: ${w.start[0]} and ${w.start[1]} blended together.`,
  });
};

/** Picture -> the word with a silent e. */
const magicE = (params, rng) => {
  const item = pick(D.MAGIC_E, rng);
  return choiceQuestion({
    rng,
    answer: item.a,
    wrong: item.w,
    prompt: 'Which word names the picture?',
    say: 'Look at the picture. Which word names it?',
    choiceKind: 'word',
    visual: picture(item.pic, 'the picture'),
    hint: 'An e at the end is quiet. It makes the vowel say its name: kit, kite.',
    explain: `${capitalise(item.a)} ends with a quiet e, so the ${item.a.match(/[aeiou]/)[0]} says its name.`,
  });
};

/** Hear a word, tap the right spelling (vowel teams). */
const vowelTeam = (params, rng) => {
  const [word, wrong] = pick(D.VOWEL_TEAMS, rng);
  return choiceQuestion({
    rng,
    answer: word,
    wrong,
    prompt: 'Tap the word you hear.',
    say: `Tap the word: ${word}.`,
    listen: true,
    young: true, // play the word as soon as the question shows
    choiceKind: 'word',
    hint: 'Two letters together often make one vowel sound: ai and ay, ee and ea, oa and ow.',
    explain: `${capitalise(word)} is spelled ${word.split('').join('-')}.`,
  });
};

/** Picture + word with two letters missing: ar, or, ir, ur. */
const rControlled = (params, rng) => {
  const w = pick(D.R_CONTROLLED, rng);
  const tiles = [...w.before.split(''), null, ...w.after.split('')];
  return choiceQuestion({
    rng,
    answer: w.team,
    wrong: D.R_TEAMS,
    prompt: 'Which two letters are missing?',
    say: `${capitalise(w.word)}. Which two letters are missing in ${w.word}?`,
    choiceKind: 'letter',
    visual: { kind: 'letters', emoji: w.emoji, tiles, label: w.word },
    hint: 'When r comes after a vowel, they make a new sound together: ar as in car, or as in fork, ir, ur and er as in bird, turtle and her.',
    explain: `${capitalise(w.word)} is spelled with ${w.team}.`,
  });
};

/* ------------------------------------------------------------------ */
/* Words                                                               */
/* ------------------------------------------------------------------ */

/** "One box, two ___." Regular (-s, -es) or irregular plurals. */
const plural = ({ irregular = false }, rng) => {
  const [one, many, wrong] = pick(irregular ? D.IRREGULAR_PLURALS : D.PLURALS, rng);
  const two = one === many ? 'many' : 'two';
  return choiceQuestion({
    rng,
    answer: many,
    wrong,
    prompt: `One ${one}, ${two} ___.`,
    say: `One ${one}, ${two}… what?`,
    choiceKind: 'word',
    hint: irregular
      ? 'Some words change in a special way: one child, two children. Say it out loud: which sounds right?'
      : 'Most words add -s. Words that end in s, x, sh or ch add -es.',
    explain: `One ${one}, ${two} ${many}.`,
  });
};

/** Which word is a naming word (noun) or an action word (verb)? */
const wordType = ({ kind = 'noun' }, rng) => {
  const noun = kind === 'noun';
  return choiceQuestion({
    rng,
    answer: pick(noun ? D.NOUNS : D.VERBS, rng),
    wrong: noun ? D.WORDS_NOT_NOUN : D.WORDS_NOT_VERB,
    prompt: noun ? 'Which word is a naming word?' : 'Which word is an action word?',
    choiceKind: 'word',
    hint: noun ? 'A naming word names a person, animal, place or thing.' : 'An action word tells what someone does. Can you do it?',
    explain: noun ? 'It names a person, animal, place or thing.' : 'It is something you can do.',
  });
};

/** Opposites or same-meaning words, from [word, other word, group] pairs. Either word can be asked. */
const pairWord = ({ kind = 'opposite' }, rng) => {
  const pairs = kind === 'opposite' ? D.OPPOSITES : D.SYNONYMS;
  const [a, b, group] = pick(pairs, rng);
  const [word, answer] = rng() < 0.5 ? [a, b] : [b, a];
  const wrong = pairs.filter((p) => p[2] !== group).flatMap((p) => [p[0], p[1]]);
  const opposite = kind === 'opposite';
  return choiceQuestion({
    rng,
    answer,
    wrong,
    prompt: opposite ? `What is the opposite of ${quoted(word)}?` : `Which word means the same as ${quoted(word)}?`,
    choiceKind: 'word',
    hint: opposite ? 'Opposites mean very different things, like up and down.' : 'Try each word in a sentence. Which one keeps the meaning?',
    explain: opposite ? `${capitalise(word)} and ${answer} are opposites.` : `${capitalise(word)} and ${answer} mean the same.`,
  });
};

/** Which word is a compound word (two words joined)? */
const compound = (params, rng) => {
  const [word, first, second] = pick(D.COMPOUNDS, rng);
  return choiceQuestion({
    rng,
    answer: word,
    wrong: D.NOT_COMPOUNDS,
    prompt: 'Which word is a compound word?',
    choiceKind: 'word',
    hint: 'A compound word is two small words joined together, like sun + set = sunset.',
    explain: `${capitalise(word)} = ${first} + ${second}.`,
  });
};

/** The short way to write two words. */
const contraction = (params, rng) => {
  const [full, short, wrong] = pick(D.CONTRACTIONS, rng);
  return choiceQuestion({
    rng,
    answer: short,
    wrong,
    prompt: `What is the short way to write ${quoted(full)}?`,
    choiceKind: 'word',
    hint: 'An apostrophe (\') takes the place of the missing letters.',
    explain: `${capitalise(full)} → ${short}. The apostrophe shows where letters were taken out.`,
  });
};

/** What a word with a prefix or suffix means. */
const affix = ({ kind = 'prefix' }, rng) => {
  const [word, meaning, wrong] = pick(kind === 'prefix' ? D.PREFIXES : D.SUFFIXES, rng);
  return choiceQuestion({
    rng,
    answer: meaning,
    wrong,
    prompt: `What does ${quoted(word)} mean?`,
    choiceKind: 'phrase',
    hint: kind === 'prefix'
      ? 'A prefix goes at the start: un- and dis- mean not (un- can also mean undo, as in unlock), re- means again, pre- means before, mis- means wrongly.'
      : 'A suffix goes at the end: -ful means full of, -less means without, -er means a person who, -ly means in a way, -ness means being.',
    explain: `${capitalise(word)} means ${meaning}.`,
  });
};

/** How many beats (syllables) a word has. */
const syllables = (params, rng) => {
  const [word, count] = pick(D.SYLLABLES, rng);
  return {
    answerType: 'choice',
    answer: String(count),
    choices: ['1', '2', '3', '4'],
    prompt: `How many syllables are in ${quoted(word)}?`,
    say: `How many syllables, or beats, are in the word ${word}?`,
    choiceKind: 'letter',
    hint: 'Clap as you say the word. Each clap is one syllable.',
    explain: `${capitalise(word)} has ${count} syllable${count === 1 ? '' : 's'}.`,
  };
};

/** "a" or "an" before a word: it is the first SOUND that matters. */
const article = (params, rng) => {
  const [words, answer] = pick(D.ARTICLES, rng);
  return {
    answerType: 'choice',
    answer,
    choices: ['a', 'an'],
    prompt: `Which goes before ${quoted(words)}?`,
    say: `Which goes before ${words}: a, or an?`,
    choiceKind: 'letter',
    visual: sentence(`___ ${words}`),
    hint: 'Use an before a vowel SOUND (an egg, an hour). Use a before other sounds (a ball, a uniform).',
    explain: `${capitalise(answer)} ${words}.`,
  };
};

/** Which word rhymes with this word? (Written words, one word family.) */
const rhymeWord = (params, rng) => {
  const families = Object.entries(D.WORD_FAMILIES);
  const [family, words] = pick(families, rng);
  const [word, answer] = shuffle(words, rng);
  const wrong = families.filter(([f]) => f !== family).flatMap(([, ws]) => ws);
  return choiceQuestion({
    rng,
    answer,
    wrong,
    prompt: `Which word rhymes with ${quoted(word)}?`,
    choiceKind: 'word',
    hint: 'Rhyming words end the same way, like cat and hat.',
    explain: `${capitalise(word)} and ${answer} both end with -${family}.`,
  });
};

/** Which word comes first in ABC order? `sameFirst` uses words with the same first letter (look at the second). */
const abcOrder = ({ sameFirst = false }, rng) => {
  let words;
  if (sameFirst) {
    const byFirst = new Map();
    for (const w of D.ORDER_WORDS) byFirst.set(w[0], [...(byFirst.get(w[0]) || []), w]);
    // Groups whose words differ in the second letter, so the second letter decides.
    const groups = [...byFirst.values()].filter((g) => new Set(g.map((w) => w[1])).size >= 3);
    const group = pick(groups, rng);
    const bySecond = new Map(shuffle(group, rng).map((w) => [w[1], w]));
    words = shuffle([...bySecond.values()], rng).slice(0, 3);
  } else {
    const byFirst = new Map(shuffle(D.ORDER_WORDS, rng).map((w) => [w[0], w]));
    words = shuffle([...byFirst.values()], rng).slice(0, 3);
  }
  const answer = [...words].sort()[0];
  return {
    answerType: 'choice',
    answer,
    choices: shuffle(words, rng),
    prompt: 'Which word comes first in ABC order?',
    choiceKind: 'word',
    hint: sameFirst ? 'The first letters are the same, so look at the second letter.' : 'Look at the first letter of each word. Which comes first in the alphabet?',
    explain: sameFirst
      ? `${capitalise(answer)} comes first: its second letter, ${answer[1]}, comes first in the alphabet.`
      : `${capitalise(answer)} comes first: ${answer[0]} comes first in the alphabet.`,
  };
};

/* ------------------------------------------------------------------ */
/* Sentences                                                           */
/* ------------------------------------------------------------------ */

const SENTENCE_BANKS = {
  past: { items: D.PAST_TENSE, prompt: 'Which word fits?', hint: 'The sentence happened in the past. Which word tells about the past?' },
  pronoun: { items: D.PRONOUNS, prompt: 'Which word fits?', hint: 'Who is the sentence about? A girl is she, a boy is he, a thing is it, more than one is they.' },
  homophone: { items: D.HOMOPHONES, prompt: 'Which word fits?', hint: 'These words sound the same but mean different things. Read the whole sentence first.' },
  agreement: { items: D.AGREEMENT, prompt: 'Which word fits?', hint: 'One person or thing: is, was, has, walks. More than one: are, were, have, walk. With I: am, was, have, walk.' },
  tense: { items: D.TENSES, prompt: 'Which words fit?', hint: 'Look at the time words: yesterday is past, right now is happening, tomorrow is future.' },
  compare: { items: D.COMPARISONS, prompt: 'Which word fits?', hint: 'Comparing two things: add -er (or use more). Comparing three or more: add -est (or use most).' },
  conjunction: { items: D.CONJUNCTIONS, prompt: 'Which joining word fits?', hint: 'and adds, but shows a difference, so tells what happened because of it, because tells why.' },
};

/** A sentence with a blank, and the word that fits. */
const fillBlank = ({ bank = 'past' }, rng) => {
  const { items, prompt, hint } = SENTENCE_BANKS[bank];
  const [text, answer, wrong] = pick(items, rng);
  const filled = text.replace('___', answer);
  return choiceQuestion({
    rng,
    answer,
    wrong,
    prompt,
    say: `${text.replace('___', 'blank')} ${prompt}`,
    choiceKind: 'word',
    visual: sentence(text),
    hint,
    explain: filled[0] === filled[0].toLowerCase() ? capitalise(filled) : filled,
  });
};

const WORD_IN_SENTENCE = {
  adjective: { items: D.ADJECTIVES, prompt: 'Which word describes something?', hint: 'A describing word tells what something is like: its color, size or feeling.' },
  adverb: { items: D.ADVERBS, prompt: 'Which word tells how, when or where?', hint: 'Many of these words end in -ly, like slowly. Ask: how did it happen?' },
};

/** Find the describing word (adjective) or the adverb in a sentence. */
const wordInSentence = ({ bank = 'adjective' }, rng) => {
  const { items, prompt, hint } = WORD_IN_SENTENCE[bank];
  const [text, answer, wrong] = pick(items, rng);
  return choiceQuestion({
    rng,
    answer,
    wrong,
    prompt,
    say: `${text} ${prompt}`,
    choiceKind: 'word',
    visual: sentence(text),
    hint,
    explain: bank === 'adjective' ? `${capitalise(answer)} describes something in the sentence.` : `${capitalise(answer)} tells more about the action.`,
  });
};

/** Which sentence is written correctly? A capital letter at the start and a full stop at the end. */
const capitalStop = (params, rng) => {
  const right = pick(D.SIMPLE_SENTENCES, rng);
  const noCapital = right[0].toLowerCase() + right.slice(1);
  const noStop = right.slice(0, -1);
  return {
    answerType: 'choice',
    answer: right,
    choices: shuffle([right, noCapital, noStop], rng),
    prompt: 'Which sentence is written the right way?',
    choiceKind: 'sentence',
    hint: 'A sentence starts with a capital letter and ends with a full stop.',
    explain: 'It starts with a capital letter and ends with a full stop.',
  };
};

/** Telling sentence or asking sentence: . or ? */
const endMark = (params, rng) => {
  const [text, mark] = pick(D.END_MARKS, rng);
  return {
    answerType: 'choice',
    answer: mark,
    choices: ['.', '?'],
    prompt: 'Which mark goes at the end?',
    say: `${text}. Which mark goes at the end: a full stop, or a question mark?`,
    choiceKind: 'letter',
    visual: sentence(`${text} ___`),
    hint: 'A sentence that asks something ends with a question mark (?). A sentence that tells something ends with a full stop (.).',
    display: mark === '?' ? 'a question mark (?)' : 'a full stop (.)',
    spoken: mark === '?' ? 'a question mark' : 'a full stop',
    explain: mark === '?' ? 'It asks something, so it ends with a question mark.' : 'It tells something, so it ends with a full stop.',
  };
};

/** Names of people, places, days and months start with a capital letter. */
const properNoun = (params, rng) => {
  const [template, name] = pick(D.PROPER_NOUNS, rng);
  const right = template.replace('{}', name);
  const lowerName = template.replace('{}', name.toLowerCase());
  const lowerStart = right[0].toLowerCase() + right.slice(1);
  return {
    answerType: 'choice',
    answer: right,
    choices: shuffle([right, lowerName, lowerStart], rng),
    prompt: 'Which sentence is written the right way?',
    choiceKind: 'sentence',
    hint: 'Names of people, places, days and months start with a capital letter. So does the first word.',
    explain: `${name} is a name, so it starts with a capital letter.`,
  };
};

/** Which sentence makes sense? The wrong ones are the same words in a mixed-up order (written by hand). */
const sentenceOrder = (params, rng) => {
  const [right, ...wrong] = pick(D.ORDER_SENTENCES, rng);
  return {
    answerType: 'choice',
    answer: right,
    choices: shuffle([right, ...wrong], rng),
    prompt: 'Which sentence makes sense?',
    choiceKind: 'sentence',
    hint: 'Read each one aloud. Which one sounds right?',
    explain: right,
  };
};

/** What a saying means. */
const idiom = (params, rng) => {
  const [text, meaning, wrong] = pick(D.IDIOMS, rng);
  return choiceQuestion({
    rng,
    answer: meaning,
    wrong,
    prompt: 'What does it mean?',
    say: `${text} What does it mean?`,
    choiceKind: 'sentence',
    visual: sentence(text),
    hint: 'A saying does not mean exactly what the words say. Think about when people say it.',
    explain: `"${text}" means: ${meaning}`,
  });
};

/* ------------------------------------------------------------------ */
/* Reading                                                             */
/* ------------------------------------------------------------------ */

const STORIES = { 1: D.STORIES_G1, 2: D.STORIES_G2, 3: D.STORIES_G3 };

/** A short story with one question about it. */
const story = ({ grade = 1 }, rng) => {
  const s = pick(STORIES[grade], rng);
  const item = pick(s.qs, rng);
  return choiceQuestion({
    rng,
    answer: item.a,
    wrong: item.w,
    prompt: item.q,
    choiceKind: 'sentence',
    visual: { kind: 'passage', title: s.title, text: s.text },
    hint: 'Read the story again. Some answers are in one sentence. For others, think about the whole story.',
    explain: `The answer is in the story "${s.title}".`,
  });
};

export const generators = {
  digraphStart, blendStart, magicE, vowelTeam, rControlled,
  plural, wordType, pairWord, compound, contraction, affix, syllables, article, rhymeWord, abcOrder,
  fillBlank, wordInSentence, capitalStop, endMark, properNoun, sentenceOrder, idiom, story,
};

export const methods = {};

/** For tests: the banks behind each generator. */
export const SENTENCE_BANK_NAMES = Object.keys(SENTENCE_BANKS);
export const STORY_GRADES = Object.keys(STORIES).map(Number);
