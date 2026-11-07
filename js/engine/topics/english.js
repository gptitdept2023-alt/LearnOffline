/**
 * English for early readers (Kinder 2): letters, first sounds, short-vowel
 * (CVC) words, rhymes, sight words and short sentences.
 *
 * Questions follow the same CPA idea as Math: a picture of a real thing
 * (concrete), letter tiles (pictorial), then the written word (abstract).
 * Every prompt a pre-reader needs is read aloud (`say`); listening questions
 * ("Tap the word you hear") set `listen` so a device with no voice shows the
 * spoken words instead.
 *
 * Word lists are small and fixed, so every sentence can be pre-recorded
 * (tools/collect-speech.mjs) and every answer is checked by tests.
 * Pure and DOM-free.
 */

import { pick, shuffle } from '../../core/random.js';
import { askChoice, choicesWith, withArticle } from './shared.js';

/* ------------------------------------------------------------------ */
/* Word bank                                                           */
/* ------------------------------------------------------------------ */

/**
 * Words with a clear picture. `rhyme` groups words that end with the same
 * sound. Words whose first sound is not the usual sound of their first
 * letter (wh-, sh-, kn-, or-) are left out, so "starts with" is never a trick.
 */
const WORDS = [
  ['ant', '🐜'], ['apple', '🍎'], ['egg', '🥚', 'eg'], ['elephant', '🐘'], ['octopus', '🐙'], ['umbrella', '☂️'],
  ['ball', '⚽'], ['bee', '🐝', 'ee'], ['bus', '🚌'], ['bed', '🛏️'], ['bat', '🦇', 'at'], ['bug', '🐛', 'ug'],
  ['box', '📦', 'ox'], ['bear', '🐻', 'ear'], ['boat', '⛵', 'oat'],
  ['cat', '🐱', 'at'], ['cake', '🎂', 'ake'], ['cup', '🥤'], ['car', '🚗', 'ar'], ['coat', '🧥', 'oat'],
  ['clock', '🕰️', 'ock'], ['can', '🥫', 'an'],
  ['dog', '🐶', 'og'], ['duck', '🦆'],
  ['fish', '🐟'], ['fox', '🦊', 'ox'], ['frog', '🐸', 'og'],
  ['goat', '🐐', 'oat'], ['grapes', '🍇'],
  ['hat', '🎩', 'at'], ['hen', '🐔', 'en'], ['horse', '🐴'],
  ['juice', '🧃'],
  ['key', '🔑', 'ee'], ['kite', '🪁'], ['king', '🤴', 'ing'],
  ['lion', '🦁'], ['leaf', '🍃'], ['lip', '👄'], ['leg', '🦵', 'eg'],
  ['moon', '🌙'], ['monkey', '🐵'], ['mouse', '🐭'], ['mug', '☕', 'ug'], ['map', '🗺️'],
  ['nose', '👃'], ['nut', '🥜'], ['net', '🥅'],
  ['pig', '🐷'], ['pen', '🖊️', 'en'], ['pear', '🍐', 'ear'], ['pin', '📌'],
  ['rabbit', '🐰'], ['ring', '💍', 'ing'], ['rat', '🐀', 'at'],
  ['sun', '☀️'], ['sock', '🧦', 'ock'], ['star', '⭐', 'ar'], ['snake', '🐍', 'ake'], ['snail', '🐌'],
  ['tiger', '🐯'], ['tree', '🌳', 'ee'], ['ten', '🔟', 'en'],
  ['van', '🚐', 'an'], ['violin', '🎻'],
  ['watch', '⌚'], ['web', '🕸️'],
  ['yarn', '🧶'], ['yo-yo', '🪀'],
  ['zebra', '🦓'],
].map(([word, emoji, rhyme = null]) => ({ word, emoji, rhyme }));

const VOWELS = ['a', 'e', 'i', 'o', 'u'];
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

/**
 * Short-vowel words (consonant, vowel, consonant): cat, bed, pig, dog, sun.
 * Listed by hand: "car" and "key" have three letters but not a short vowel.
 */
const CVC_LIST = new Set(['bat', 'cat', 'hat', 'rat', 'van', 'map', 'can', 'bed', 'hen', 'leg', 'net', 'pen', 'ten', 'web',
  'lip', 'pig', 'pin', 'box', 'dog', 'fox', 'bus', 'bug', 'cup', 'mug', 'nut', 'sun']);
const CVC = WORDS.filter((w) => CVC_LIST.has(w.word));

/** Letters that can make the same first sound: never offer one as a wrong answer for the other. */
const SOUND_ALIKE = { c: ['k', 'q'], k: ['c', 'q'], q: ['c', 'k'] };
const soundsAlike = (a, b) => a === b || (SOUND_ALIKE[a] || []).includes(b);

/** Words a pre-reader may hear as rhyming by accident (long words ending "-ee", "-a"…) never join rhyme questions. */
const ONE_SYLLABLE = new Set(WORDS.filter((w) => !/^(apple|elephant|octopus|umbrella|monkey|rabbit|tiger|violin|zebra|lion|yo-yo|juice|grapes|horse)$/.test(w.word)).map((w) => w.word));

export const SIGHT_WORDS = ['the', 'and', 'is', 'I', 'see', 'can', 'my', 'we', 'go', 'to', 'it', 'in', 'you', 'like', 'look', 'up', 'me', 'he', 'she'];

const capitalise = (text) => text[0].toUpperCase() + text.slice(1);
const byWord = new Map(WORDS.map((w) => [w.word, w]));
const lettersOf = (word) => word.split('');
const picture = (w, extra = {}) => ({ kind: 'letters', emoji: w.emoji, label: w.word, ...extra });

/** Emoji choices for words, plus what each picture is called (for the screen reader and the answer line). */
const pictureChoices = (answer, distractors, rng, count = 3) => {
  const chosen = shuffle([answer, ...shuffle(distractors.filter((d) => d.emoji !== answer.emoji), rng).slice(0, count - 1)], rng);
  return {
    choices: chosen.map((w) => w.emoji),
    choiceLabels: Object.fromEntries(chosen.map((w) => [w.emoji, w.word])),
    choiceKind: 'picture',
  };
};

/** A picture answer: tapped as its emoji, shown and read as its word. */
const pictureAnswer = (w) => ({ answer: w.emoji, display: `${w.emoji} ${w.word}`, spoken: w.word });

/** Letters a-z or A-Z from a param such as "A-M" (default all). */
const letterSet = (range = 'A-Z') => {
  const [from, to] = range.toUpperCase().split('-');
  return ALPHABET.slice(ALPHABET.indexOf(from), ALPHABET.indexOf(to || from) + 1);
};

/* ------------------------------------------------------------------ */
/* Letters                                                             */
/* ------------------------------------------------------------------ */

/** Hear a letter's name, tap it. `letters` is a range like "A-M"; `small` uses lowercase. */
const letterFind = ({ letters = 'A-Z', small = false }, rng) => {
  const set = letterSet(letters).map((l) => (small ? l.toLowerCase() : l));
  const answer = pick(set, rng);
  return {
    answerType: 'choice',
    prompt: small ? 'Tap the small letter you hear.' : 'Tap the letter you hear.',
    say: small ? `Tap the small letter ${answer}.` : `Tap the letter ${answer}.`,
    listen: true,
    answer,
    choices: choicesWith(answer, set, rng, 3),
    choiceKind: 'letter',
    hint: 'Tap the speaker to hear it again. Then look at each letter.',
    young: true,
  };
};

/** See a big letter, tap its small letter (or the other way round). */
const letterMatch = ({ letters = 'A-Z', toSmall = true }, rng) => {
  const set = letterSet(letters);
  const big = pick(set, rng);
  const shown = toSmall ? big : big.toLowerCase();
  const answer = toSmall ? big.toLowerCase() : big;
  const pool = set.map((l) => (toSmall ? l.toLowerCase() : l));
  return {
    answerType: 'choice',
    prompt: toSmall ? 'Tap the small letter that matches.' : 'Tap the big letter that matches.',
    say: toSmall ? `This is big ${big}. Tap its small letter.` : `This is small ${shown}. Tap its big letter.`,
    answer,
    choices: choicesWith(answer, pool, rng, 3),
    choiceKind: 'letter',
    visual: { kind: 'letters', tiles: [shown], label: toSmall ? `big ${big}` : `small ${shown}` },
    hint: toSmall ? 'Say the letter name. Then find its small letter.' : 'Say the letter name. Then find its big letter.',
    young: true,
  };
};

/** "A, B, C, ?": the next letter in the alphabet. */
const letterNext = ({ small = false }, rng) => {
  const start = Math.floor(rng() * (ALPHABET.length - 3));
  const set = ALPHABET.map((l) => (small ? l.toLowerCase() : l));
  const shown = set.slice(start, start + 3);
  const answer = set[start + 3];
  // Wrong choices: a letter just shown, and one further on, so the order matters.
  const near = [set[start + 4], set[start + 2], set[start + 1], set[start + 5]].filter(Boolean);
  return {
    answerType: 'choice',
    prompt: 'Which letter comes next?',
    say: `${shown.join(', ')}. Which letter comes next?`,
    answer,
    choices: choicesWith(answer, near, rng, 3),
    choiceKind: 'letter',
    visual: { kind: 'letters', tiles: [...shown, null], label: `${shown.join(', ')}, then what?` },
    hint: 'Sing the ABC song in your head.',
    young: true,
  };
};

/* ------------------------------------------------------------------ */
/* Sounds                                                              */
/* ------------------------------------------------------------------ */

/** Other words that start with this letter (for "Show me how"). Fixed order, so it is the same every time. */
const sameStart = (w) => WORDS.filter((o) => o.word !== w.word && o.word[0] === w.word[0]).slice(0, 2).map((o) => o.word);

/** Picture -> the letter its name starts with. */
const firstLetter = (params, rng) => {
  const w = pick(WORDS, rng);
  const letter = w.word[0];
  const wrong = 'abcdefghijklmnopqrstuvwyz'.split('').filter((l) => !soundsAlike(l, letter));
  const choices = choicesWith(letter, wrong, rng, 3);
  return {
    answerType: 'choice',
    prompt: 'Which letter does it start with?',
    say: `${capitalise(w.word)}. Which letter does ${w.word} start with?`,
    answer: letter,
    choices,
    choiceKind: 'letter',
    visual: picture(w),
    hint: 'Say the word slowly. Listen to the very first sound.',
    method: { kind: 'firstSound', word: w.word, choices },
    young: true,
  };
};

/** Which picture starts with the same sound as this one? (Consonants only: vowels have more than one sound.) */
const sameSound = (params, rng) => {
  const starters = WORDS.filter((w) => !VOWELS.includes(w.word[0]));
  const target = pick(starters.filter((w) => sameStart(w).length), rng);
  const letter = target.word[0];
  const answer = pick(starters.filter((w) => w.word !== target.word && w.word[0] === letter), rng);
  const others = starters.filter((w) => !soundsAlike(w.word[0], letter));
  const pics = pictureChoices(answer, others, rng);
  return {
    answerType: 'choice',
    prompt: `Which one starts like ${target.word}?`,
    say: `Which one starts with the same sound as ${target.word}?`,
    ...pictureAnswer(answer),
    ...pics,
    visual: picture(target),
    hint: `Say each word. Which one starts like ${target.word}?`,
    method: { kind: 'sameStart', word: target.word, answer: answer.word, choices: pics.choices.map((e) => pics.choiceLabels[e]) },
    young: true,
  };
};

/** Picture + letter tiles with the vowel missing: c _ t. */
const missingVowel = (params, rng) => {
  const w = pick(CVC, rng);
  const vowel = w.word[1];
  const choices = choicesWith(vowel, VOWELS, rng, 3);
  return {
    answerType: 'choice',
    prompt: 'Which letter is missing?',
    say: `${capitalise(w.word)}. Which letter is missing in ${w.word}?`,
    answer: vowel,
    choices,
    choiceKind: 'letter',
    visual: picture(w, { tiles: [w.word[0], null, w.word[2]] }),
    hint: 'Say the word slowly. Listen to the sound in the middle.',
    method: { kind: 'middleSound', word: w.word, choices },
    young: true,
  };
};

/** Words for "which word is it?": same first letter or same vowel first, so each letter matters. */
const lookAlikeWords = (w, rng) => {
  const close = CVC.filter((o) => o.word !== w.word && (o.word[0] === w.word[0] || o.word[1] === w.word[1] || o.word[2] === w.word[2]));
  const rest = CVC.filter((o) => o.word !== w.word && !close.includes(o));
  return [...shuffle(close, rng), ...shuffle(rest, rng)];
};

/** Read a CVC word, tap its picture. */
const readWord = (params, rng) => {
  const w = pick(CVC, rng);
  const pics = pictureChoices(w, lookAlikeWords(w, rng).slice(0, 4), rng);
  return {
    answerType: 'choice',
    prompt: 'Read the word. Tap its picture.',
    say: 'Read the word. Then tap its picture.',
    ...pictureAnswer(w),
    ...pics,
    visual: { kind: 'letters', tiles: lettersOf(w.word), label: w.word },
    hint: 'Say the sound of each letter. Then say them fast to read the word.',
    method: { kind: 'blendWord', word: w.word, choices: shuffle([w.word, ...pics.choices.filter((e) => e !== w.emoji).map((e) => pics.choiceLabels[e])], rng) },
    young: true,
  };
};

/** See a picture, tap its word. */
const pictureWord = (params, rng) => {
  const w = pick(CVC, rng);
  const choices = choicesWith(w.word, lookAlikeWords(w, rng).slice(0, 3).map((o) => o.word), rng, 3);
  return {
    answerType: 'choice',
    prompt: 'Tap the word for this picture.',
    say: 'Look at the picture. Tap its word.',
    answer: w.word,
    choices,
    choiceKind: 'word',
    visual: picture(w),
    hint: 'Say the name of the picture slowly. Which word has those sounds?',
    method: { kind: 'blendWord', word: w.word, choices },
    young: true,
  };
};

/** Which picture rhymes with this one? */
const rhyme = (params, rng) => {
  const inFamilies = WORDS.filter((w) => w.rhyme && WORDS.some((o) => o !== w && o.rhyme === w.rhyme));
  const target = pick(inFamilies, rng);
  const answer = pick(WORDS.filter((o) => o !== target && o.rhyme === target.rhyme), rng);
  const others = WORDS.filter((o) => o.rhyme !== target.rhyme && ONE_SYLLABLE.has(o.word));
  const example = target.rhyme === 'at' ? 'dog and frog' : 'cat and hat';
  const pics = pictureChoices(answer, others, rng);
  return {
    answerType: 'choice',
    prompt: `Which one rhymes with ${target.word}?`,
    ...pictureAnswer(answer),
    ...pics,
    visual: picture(target),
    hint: `Rhyming words end with the same sound, like ${example}.`,
    method: { kind: 'rhymeEnd', word: target.word, answer: answer.word, choices: pics.choices.map((e) => pics.choiceLabels[e]) },
    young: true,
  };
};

/* ------------------------------------------------------------------ */
/* Reading                                                             */
/* ------------------------------------------------------------------ */

/** Hear a sight word, tap it. `words` limits the list (default all). */
const sightWord = ({ words = SIGHT_WORDS }, rng) => {
  const answer = pick(words, rng);
  return {
    answerType: 'choice',
    prompt: 'Tap the word you hear.',
    say: `Tap the word: ${answer}.`,
    listen: true,
    answer,
    choices: choicesWith(answer, words, rng, 3),
    choiceKind: 'word',
    hint: 'Tap the speaker to hear it again. Listen to the first sound, then look at the first letter.',
    young: true,
  };
};

/** Sentences built only from sight words and one CVC word, so a beginner can read them. */
const SENTENCES = [
  (w) => `I see a ${w}.`,
  (w) => `I like the ${w}.`,
  (w) => `Look at the ${w}!`,
  (w) => `The ${w} is big.`,
  (w) => `We can see a ${w}.`,
];

/** Read a short sentence, tap the thing it names. */
const readSentence = (params, rng) => {
  const w = pick(CVC, rng);
  const text = pick(SENTENCES, rng)(w.word);
  return {
    answerType: 'choice',
    prompt: 'Read it. Tap the picture.',
    say: 'Read the sentence. Then tap its picture.',
    ...pictureAnswer(w),
    // A word in the sentence itself ("We CAN see…") is never a wrong picture.
    ...pictureChoices(w, CVC.filter((o) => !new RegExp(`\\b${o.word}\\b`, 'i').test(text)), rng),
    visual: { kind: 'letters', text, label: text },
    hint: 'Read each word. Which thing is in the sentence?',
    young: true,
  };
};

export const generators = {
  letterFind, letterMatch, letterNext, firstLetter, sameSound, missingVowel, readWord, pictureWord, rhyme, sightWord, readSentence,
};

/* ------------------------------------------------------------------ */
/* "Show me how": phonics steps                                        */
/* ------------------------------------------------------------------ */

const wordOf = (word) => byWord.get(word) || { word, emoji: '' };

/** "This is a pig", but "some grapes" and "the number ten". */
const NAMED = { grapes: 'some grapes', ten: 'the number ten', juice: 'some juice', yarn: 'some yarn' };
const named = (word) => NAMED[word] || withArticle(word);

/** Listen for the first sound, then pick its letter. */
const firstSoundMethod = ({ word, choices }) => {
  const w = wordOf(word);
  const letter = word[0];
  const more = sameStart(w);
  return {
    name: 'Listen for the first sound',
    steps: [
      { text: `This is ${named(word)}. Say it slowly: ${word}.`, visual: picture(w) },
      { text: `${capitalise(word)} starts with the letter ${letter}.`, visual: picture(w, { tiles: lettersOf(word), highlight: [0] }) },
      // A letter is always followed by a comma or full stop, so the voice says "ay", not the word "a".
      more.length && { text: `${capitalise(more.join(' and '))} ${more.length === 1 ? 'starts' : 'start'} with the letter ${letter}, too.`, visual: { kind: 'letters', emoji: more.map((m) => wordOf(m).emoji).join(' '), label: more.join(' and ') } },
    ].filter(Boolean),
    guided: [askChoice(`Which letter does ${word} start with?`, letter, choices, picture(w))],
  };
};

/** First and last sounds are easy to hear; the vowel in the middle is the one to listen for. */
const middleSoundMethod = ({ word, choices }) => {
  const w = wordOf(word);
  const blank = [word[0], null, word[2]];
  return {
    name: 'Listen for the middle sound',
    steps: [
      { text: `This is ${named(word)}. Say it slowly: ${word}.`, visual: picture(w, { tiles: blank }) },
      { text: `It starts with ${word[0]} and ends with ${word[2]}.`, visual: picture(w, { tiles: blank, highlight: [0, 2] }) },
      { text: `The letter in the middle is ${word[1]}. ${capitalise(word)}!`, visual: picture(w, { tiles: lettersOf(word), highlight: [1] }) },
    ],
    guided: [askChoice('Which letter is missing?', word[1], choices, picture(w, { tiles: blank }))],
  };
};

/** Sound out each letter, then blend. */
const blendWordMethod = ({ word, choices }) => {
  const w = wordOf(word);
  const tiles = lettersOf(word);
  return {
    name: 'Sound it out',
    steps: [
      ...tiles.map((l, i) => ({ text: `Point to the letter ${l}. Say its sound.`, visual: { kind: 'letters', tiles, highlight: [i], label: word } })),
      { text: `Now say the sounds fast: ${word}!`, visual: picture(w, { tiles }) },
    ],
    guided: [askChoice(`Which word says ${word}?`, word, choices, { kind: 'letters', tiles, label: word })],
  };
};

/** Picture pairs: "🐱 🎩" with both names for the screen reader. */
const pair = (a, b) => ({ kind: 'letters', emoji: `${a.emoji} ${b.emoji}`, label: `${a.word}, ${b.word}` });

/**
 * Say the word, say each picture's name, and listen for the same ending.
 * The guided step answers with the picture's name (the question's `spoken` answer).
 */
const rhymeEndMethod = ({ word, answer, choices }) => {
  const a = wordOf(word);
  const b = wordOf(answer);
  return {
    name: 'Listen to the ending',
    steps: [
      { text: `Say ${word}. Listen to how it ends.`, visual: picture(a) },
      { text: 'Now say the name of each picture. Listen to how each one ends.' },
      { text: `${capitalise(answer)} ends the same way: ${word}, ${answer}. They rhyme!`, visual: pair(a, b) },
    ],
    guided: [askChoice(`Which one rhymes with ${word}?`, answer, choices, picture(a))],
  };
};

/** Hear the first sound of the word, then find the picture that starts the same way. */
const sameStartMethod = ({ word, answer, choices }) => {
  const a = wordOf(word);
  const b = wordOf(answer);
  return {
    name: 'Listen for the first sound',
    steps: [
      { text: `Say ${word}. It starts with the letter ${word[0]}.`, visual: picture(a, { tiles: lettersOf(word), highlight: [0] }) },
      { text: 'Now say the name of each picture. Listen to the first sound.' },
      { text: `${capitalise(answer)} starts with ${answer[0]} too!`, visual: pair(a, b) },
    ],
    guided: [askChoice(`Which one starts like ${word}?`, answer, choices, picture(a))],
  };
};

export const methods = {
  firstSound: firstSoundMethod,
  middleSound: middleSoundMethod,
  blendWord: blendWordMethod,
  rhymeEnd: rhymeEndMethod,
  sameStart: sameStartMethod,
};

/** For tests: the word bank and the CVC subset. */
export const ENGLISH_WORDS = WORDS;
export const CVC_WORDS = CVC;
