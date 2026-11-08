// Builds packs/english-g1.json, english-g2.json, english-g3.json:  node tools/build-english-g1-g3.mjs
// Lessons are made by tools/packBuilder.mjs: hand-written intro steps, then a
// "your turn" question from the skill's own generator. The word lists and
// stories are in js/engine/topics/englishData.js.
import { skill, topic, challenge, writePack } from './packBuilder.mjs';
import { SIGHT_G1 } from '../js/engine/topics/englishData.js';

const L = (text, tiles, emoji, highlight) => ({ kind: 'letters', text, tiles, emoji, highlight, label: text || (tiles || []).join('') });
const say = (text) => ({ kind: 'letters', text, label: text });
const SUBJECT = 'english';

/* ------------------------------------------------------------------ */
/* Grade 1                                                             */
/* ------------------------------------------------------------------ */
const g1 = [
  topic('en1-phonics', 'Letter teams', '🔤', 'Two letters, one sound: sh, ch, th, wh, and blends like fr and st.', [
    skill('en1-digraphs', 'sh, ch, th, wh', { type: 'digraphStart' }, [
      ['concrete', 'Some letters work as a team to make one new sound. s and h together say shh, like in ship.', L(null, ['s', 'h', 'i', 'p'], '🚢', [0, 1])],
      ['pictorial', 'ch says ch, like in chair. th puts your tongue between your teeth, like in three. wh says w, like in whale.', L(null, ['c', 'h'], '💺 3️⃣ 🐋')],
    ]),
    skill('en1-blends', 'Blends', { type: 'blendStart' }, [
      ['concrete', 'In a blend, you hear both letters, said quickly together. f and r make fr, like in frog.', L(null, ['f', 'r', 'o', 'g'], '🐸', [0, 1])],
      ['pictorial', 'More blends: st as in star, tr as in tree, fl as in flag, sn as in snake.', L(null, ['s', 't', 'a', 'r'], '⭐ 🌳 🚩 🐍', [0, 1])],
    ]),
    skill('en1-magic-e', 'Magic e', { type: 'magicE' }, [
      ['concrete', 'Kit has a short i. Add an e at the end and you get kite. The e is quiet, but it makes the i say its name.', L(null, ['k', 'i', 't', 'e'], '🪁', [3])],
      ['pictorial', 'The same thing happens with other vowels: cub becomes cube, and hop becomes hope.', L(null, ['c', 'u', 'b', 'e'], '🧊', [3])],
    ]),
  ]),
  topic('en1-sight', 'Sight words', '👀', 'Words to know by heart, so reading gets fast.', [
    skill('en1-sight-1', 'Sight words 1', { type: 'sightWord', words: SIGHT_G1[0] }, [
      ['concrete', 'Some words are used so often that we learn to read them in one look. Say each word as you see it.', say(SIGHT_G1[0].slice(0, 5).join('  '))],
    ]),
    skill('en1-sight-2', 'Sight words 2', { type: 'sightWord', words: SIGHT_G1[1] }, [
      ['concrete', 'Here are more words to know by heart. Read them three times, faster each time.', say(SIGHT_G1[1].slice(0, 5).join('  '))],
    ]),
  ]),
  topic('en1-words', 'Words', '📚', 'Naming words, action words, opposites and more than one.', [
    skill('en1-nouns', 'Naming words', { type: 'wordType', kind: 'noun' }, [
      ['concrete', 'A naming word names a person, an animal, a place or a thing. Teacher, bird, school and ball are naming words.', L(null, null, '👩‍🏫 🐦 🏫 ⚽')],
    ]),
    skill('en1-verbs', 'Action words', { type: 'wordType', kind: 'verb' }, [
      ['concrete', 'An action word tells what someone does. Jump, eat, sing and swim are action words. Can you jump?', L(null, null, '🤸 🍽️ 🎤 🏊')],
    ]),
    skill('en1-plurals', 'One and more', { type: 'plural' }, [
      ['concrete', 'One cat, two cats. Add -s to show more than one.', L(null, null, '🐱 🐱')],
      ['pictorial', 'Words that end in s, x, sh or ch add -es, because it is easier to say: one box, two boxes. One dish, two dishes.', say('box → boxes')],
    ]),
    skill('en1-opposites', 'Opposites', { type: 'pairWord', kind: 'opposite' }, [
      ['concrete', 'Opposites are as different as can be. Hot and cold are opposites. So are up and down.', L(null, null, '🔥 🧊')],
    ]),
  ]),
  topic('en1-sentences', 'Sentences', '✏️', 'Capital letters, full stops and question marks.', [
    skill('en1-capitals', 'Capital letter and full stop', { type: 'capitalStop' }, [
      ['pictorial', 'A sentence starts with a capital letter and ends with a full stop.', say('The cat is on the mat.')],
      ['abstract', 'Check both ends: Is the first letter big? Is there a dot at the end?'],
    ]),
    skill('en1-end-marks', 'Telling or asking?', { type: 'endMark' }, [
      ['pictorial', 'A telling sentence ends with a full stop: My hat is red.', say('My hat is red.')],
      ['pictorial', 'An asking sentence ends with a question mark: Where is my hat?', say('Where is my hat?')],
    ]),
  ]),
  topic('en1-reading', 'Reading', '📖', 'Read short stories and answer questions.', [
    skill('en1-stories', 'Read and answer', { type: 'story', grade: 1 }, [
      ['pictorial', 'Read the whole story first. Then read the question.', { kind: 'passage', title: 'The red ball', text: 'Ben has a red ball. He kicks it to his dog. The dog runs to get the ball.' }],
      ['abstract', 'Look back at the story to find the answer. What color is the ball? The story says: a red ball.'],
    ]),
  ]),
  challenge('en1', [
    ['en1-ch-rhymes', 'Rhyming words', { type: 'rhymeWord' }],
    ['en1-ch-abc', 'ABC order', { type: 'abcOrder' }],
  ]),
];

/* ------------------------------------------------------------------ */
/* Grade 2                                                             */
/* ------------------------------------------------------------------ */
const g2 = [
  topic('en2-phonics', 'Vowel teams', '🔤', 'ai, ay, ee, ea, oa, ow, and vowels with r.', [
    skill('en2-vowel-teams', 'Vowel teams', { type: 'vowelTeam' }, [
      ['concrete', 'Two letters can team up to make one vowel sound. In rain, a and i together say the name of a.', L(null, ['r', 'a', 'i', 'n'], '🌧️', [1, 2])],
      ['pictorial', 'Teams that say the same sound: ai and ay (rain, play), ee and ea (tree, leaf), oa and ow (boat, snow).', say('ai ay · ee ea · oa ow')],
    ]),
    skill('en2-r-vowels', 'Vowels with r', { type: 'rControlled' }, [
      ['concrete', 'When r comes after a vowel, they make a new sound together. a and r say ar, like in car.', L(null, ['c', 'a', 'r'], '🚗', [1, 2])],
      ['pictorial', 'or is in fork. ir, ur and er all sound the same: bird, turtle, her. You learn which one by reading the word often.', L(null, ['b', 'i', 'r', 'd'], '🐦', [1, 2])],
    ]),
    skill('en2-compound', 'Compound words', { type: 'compound' }, [
      ['concrete', 'Two small words can join to make a new word. Rain + bow = rainbow.', say('rain + bow = rainbow 🌈')],
      ['abstract', 'Can you split it into two real words? Sun + flower = sunflower. Tiger cannot be split, so it is not a compound word.'],
    ]),
  ]),
  topic('en2-words', 'Word study', '📚', 'Special plurals, the past, short forms and same-meaning words.', [
    skill('en2-plurals', 'Special plurals', { type: 'plural', irregular: true }, [
      ['concrete', 'Some words change in a special way for more than one: one child, two children. One mouse, two mice.', L(null, null, '🐭 🐭')],
      ['pictorial', 'Words ending in a consonant and y change y to i and add -es: one baby, two babies. Some do not change at all: one sheep, many sheep.', say('baby → babies')],
    ]),
    skill('en2-past', 'Past tense', { type: 'fillBlank', bank: 'past' }, [
      ['pictorial', 'For things that already happened, many words add -ed: play → played, walk → walked.', say('Yesterday, I played.')],
      ['abstract', 'Some words change in a special way: go → went, eat → ate, see → saw, run → ran.'],
    ]),
    skill('en2-contractions', 'Short forms', { type: 'contraction' }, [
      ['pictorial', 'A short form joins two words. An apostrophe takes the place of the missing letters: do not → don\'t.', say("do not → don't")],
      ['abstract', "Careful: it's means it is. its (no apostrophe) means belonging to it."],
    ]),
    skill('en2-synonyms', 'Same meaning', { type: 'pairWord', kind: 'synonym' }, [
      ['pictorial', 'Some words mean the same, or nearly the same. Big and large mean the same. Happy and glad mean the same.', say('big = large')],
    ]),
  ]),
  topic('en2-grammar', 'Grammar', '✏️', 'Pronouns, describing words and capital letters for names.', [
    skill('en2-pronouns', 'Pronouns', { type: 'fillBlank', bank: 'pronoun' }, [
      ['pictorial', 'A pronoun takes the place of a name. Mia is my sister. She likes to dance. She means Mia.', say('Mia → she')],
      ['abstract', 'A boy is he, a girl is she, a thing is it, and more than one is they. Talking about yourself and others: we.'],
    ]),
    skill('en2-adjectives', 'Describing words', { type: 'wordInSentence', bank: 'adjective' }, [
      ['pictorial', 'A describing word tells what something is like. In "the brown dog", brown describes the dog.', say('the brown dog')],
    ]),
    skill('en2-names', 'Capital letters for names', { type: 'properNoun' }, [
      ['pictorial', 'Names of people, places, days and months start with a capital letter: Carlo, Manila, Monday, June.', say('Carlo · Manila · Monday · June')],
    ]),
  ]),
  topic('en2-reading', 'Reading', '📖', 'Read stories; find details, word meanings and what happened first.', [
    skill('en2-stories', 'Read and answer', { type: 'story', grade: 2 }, [
      ['pictorial', 'Read the story. Then read the question and look back for the answer.', { kind: 'passage', title: 'Paper boats', text: 'Rain fell all morning, so Nina could not play outside. She was bored. Her brother showed her how to fold a paper boat.' }],
      ['abstract', 'If a word is new, read the sentences around it. They give clues to what it means.'],
    ]),
  ]),
  challenge('en2', [
    ['en2-ch-abc', 'ABC order: second letter', { type: 'abcOrder', sameFirst: true }],
    ['en2-ch-order', 'Make a sentence', { type: 'sentenceOrder' }],
  ]),
];

/* ------------------------------------------------------------------ */
/* Grade 3                                                             */
/* ------------------------------------------------------------------ */
const g3 = [
  topic('en3-words', 'Word parts', '🧩', 'Prefixes, suffixes and syllables.', [
    skill('en3-prefixes', 'Prefixes', { type: 'affix', kind: 'prefix' }, [
      ['pictorial', 'A prefix is added to the start of a word and changes its meaning. un- means not: unhappy means not happy.', say('un + happy = unhappy')],
      ['abstract', 're- means again (redo), dis- means not (dislike), pre- means before (preheat), mis- means wrongly (misspell).'],
    ]),
    skill('en3-suffixes', 'Suffixes', { type: 'affix', kind: 'suffix' }, [
      ['pictorial', 'A suffix is added to the end of a word. -ful means full of: careful means full of care.', say('care + ful = careful')],
      ['abstract', '-less means without (careless), -er can mean a person who (teacher), -ly means in a way (slowly).'],
    ]),
    skill('en3-syllables', 'Syllables', { type: 'syllables' }, [
      ['concrete', 'A syllable is a beat in a word. Clap as you say ba-na-na: 3 claps, so 3 syllables.', say('ba · na · na')],
    ]),
  ]),
  topic('en3-usage', 'Using words', '🗣️', 'Homophones, a or an, and words that compare.', [
    skill('en3-homophones', 'Sound-alike words', { type: 'fillBlank', bank: 'homophone' }, [
      ['pictorial', 'Homophones sound the same but have different spellings and meanings: hear (with your ears) and here (this place).', say('hear 👂 · here 📍')],
      ['abstract', 'their = belongs to them, there = that place, they\'re = they are.'],
    ]),
    skill('en3-articles', 'a or an', { type: 'article' }, [
      ['pictorial', 'Use an before a vowel sound: an apple, an egg. Use a before other sounds: a ball, a dog.', say('an apple · a ball')],
      ['abstract', 'Listen to the sound, not the letter: an hour (the h is quiet), but a uniform (it starts with a y sound).'],
    ]),
    skill('en3-compare', 'Comparing words', { type: 'fillBlank', bank: 'compare' }, [
      ['pictorial', 'Comparing two things: add -er. Comparing three or more: add -est. tall, taller, tallest.', say('tall · taller · tallest')],
      ['abstract', 'Long words use more and most: more beautiful, most beautiful. Some words change: good, better, best; bad, worse, worst.'],
    ]),
  ]),
  topic('en3-grammar', 'Grammar', '✏️', 'Verb tenses, agreement, adverbs and joining words.', [
    skill('en3-tenses', 'Past, present, future', { type: 'fillBlank', bank: 'tense' }, [
      ['pictorial', 'Time words tell you the tense. Yesterday, I cleaned (past). Right now, I am cleaning (present). Tomorrow, I will clean (future).', say('cleaned · am cleaning · will clean')],
    ]),
    skill('en3-agreement', 'Is or are?', { type: 'fillBlank', bank: 'agreement' }, [
      ['pictorial', 'One person or thing: The dog is barking. More than one: The dogs are barking.', say('The dog is · The dogs are')],
      ['abstract', 'With he, she or one name, many action words add -s: He walks. They walk.'],
    ]),
    skill('en3-adverbs', 'Adverbs', { type: 'wordInSentence', bank: 'adverb' }, [
      ['pictorial', 'An adverb tells more about an action: how, when or where. The turtle walked slowly. Slowly tells how.', say('walked slowly')],
    ]),
    skill('en3-conjunctions', 'Joining words', { type: 'fillBlank', bank: 'conjunction' }, [
      ['pictorial', 'Joining words connect ideas. and adds, but shows a difference, so tells what happened because of it, because tells why.', say('and · but · so · because')],
    ]),
  ]),
  topic('en3-reading', 'Reading', '📖', 'Main idea, details, word meanings and reasons.', [
    skill('en3-stories', 'Read and answer', { type: 'story', grade: 3 }, [
      ['pictorial', 'The main idea is what the whole story is mostly about. Details are small facts that support it.', { kind: 'passage', title: 'The tree of life', text: 'Many people call the coconut tree the "tree of life" because almost every part is useful.' }],
      ['abstract', 'For "why" questions, look for words like because and so in the story.'],
    ]),
  ]),
  challenge('en3', [
    ['en3-ch-idioms', 'Sayings', { type: 'idiom' }],
    ['en3-ch-abc', 'ABC order', { type: 'abcOrder', sameFirst: true }],
  ]),
];

writePack('english-g1', 'English · Grade 1', g1, '1.0.0', SUBJECT);
writePack('english-g2', 'English · Grade 2', g2, '1.0.0', SUBJECT);
writePack('english-g3', 'English · Grade 3', g3, '1.0.0', SUBJECT);
