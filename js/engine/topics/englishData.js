/**
 * Word lists, sentences and short stories for English Grades 1–3
 * (englishPlus.js turns them into questions). Data only, no logic.
 *
 * Every list is small and fixed so each item can be checked by a person and
 * by tests/english-upper.test.mjs, and early-grade sentences can be recorded.
 * All stories are original and set in everyday Filipino life.
 *
 * Question items use short keys: q = question, a = right answer,
 * w = wrong answers, pic = picture (emoji), e = why (shown after a wrong answer).
 */

/* ------------------------------------------------------------------ */
/* Grade 1: phonics                                                    */
/* ------------------------------------------------------------------ */

/** Words that start with sh, ch, th or wh, each with a picture. */
export const DIGRAPH_WORDS = [
  ['ship', '🚢'], ['shell', '🐚'], ['sheep', '🐑'], ['shoe', '👟'], ['shark', '🦈'],
  ['chair', '💺'], ['cheese', '🧀'], ['cherry', '🍒'],
  ['thread', '🧵'], ['three', '3️⃣'], ['whale', '🐋'],
].map(([word, emoji]) => ({ word, emoji, start: word.slice(0, 2) }));
export const DIGRAPHS = ['sh', 'ch', 'th', 'wh'];

/** Words that start with two consonants blended together. */
export const BLEND_WORDS = [
  ['frog', '🐸'], ['flag', '🚩'], ['flower', '🌸'], ['plug', '🔌'],
  ['crab', '🦀'], ['crown', '👑'], ['drum', '🥁'], ['dress', '👗'], ['grapes', '🍇'],
  ['star', '⭐'], ['stop', '🛑'], ['snake', '🐍'], ['snail', '🐌'],
  ['tree', '🌳'], ['train', '🚆'], ['truck', '🚚'], ['bread', '🍞'], ['broom', '🧹'], ['brick', '🧱'],
  ['clock', '🕰️'], ['cloud', '☁️'], ['glove', '🧤'], ['swim', '🏊'], ['spoon', '🥄'], ['spider', '🕷️'],
].map(([word, emoji]) => ({ word, emoji, start: word.slice(0, 2) }));
export const BLENDS = ['fr', 'fl', 'pl', 'cr', 'dr', 'gr', 'st', 'sn', 'sl', 'tr', 'br', 'cl', 'gl', 'sw', 'sp'];

/**
 * Magic e: a picture whose word ends in a silent e, the same word without the
 * e (a real word where there is one), and another short word.
 */
export const MAGIC_E = [
  { pic: '🪁', a: 'kite', w: ['kit', 'kid'] },
  { pic: '🧊', a: 'cube', w: ['cub', 'cup'] },
  { pic: '🎂', a: 'cake', w: ['cap', 'cat'] },
  { pic: '🌹', a: 'rose', w: ['rod', 'rob'] },
  { pic: '👃', a: 'nose', w: ['not', 'nod'] },
  { pic: '🎲', a: 'dice', w: ['dig', 'dip'] },
  { pic: '🦴', a: 'bone', w: ['bun', 'box'] },
  { pic: '🏠', a: 'home', w: ['hop', 'hot'] },
  { pic: '5️⃣', a: 'five', w: ['fig', 'fix'] },
  { pic: '9️⃣', a: 'nine', w: ['nip', 'net'] },
  { pic: '⛸️', a: 'skate', w: ['sack', 'set'] },
  { pic: '✈️', a: 'plane', w: ['plan', 'plant'] },
];

/** First-grade sight words, in two lists of ten. */
export const SIGHT_G1 = [
  ['after', 'again', 'could', 'every', 'from', 'give', 'going', 'know', 'once', 'thank'],
  ['were', 'when', 'them', 'then', 'think', 'walk', 'over', 'some', 'take', 'open'],
];

/* ------------------------------------------------------------------ */
/* Grade 1: words and sentences                                        */
/* ------------------------------------------------------------------ */

/** One and more than one: [one, many, wrong spellings]. */
export const PLURALS = [
  ['cat', 'cats', ['cat', 'cates']], ['dog', 'dogs', ['dog', 'doges']], ['pen', 'pens', ['pen', 'penes']],
  ['book', 'books', ['book', 'bookes']], ['hat', 'hats', ['hat', 'hattes']], ['cup', 'cups', ['cup', 'cupes']],
  ['box', 'boxes', ['boxs', 'box']], ['fox', 'foxes', ['foxs', 'fox']], ['bus', 'buses', ['buss', 'bus']],
  ['dish', 'dishes', ['dishs', 'dish']], ['brush', 'brushes', ['brushs', 'brush']], ['bench', 'benches', ['benchs', 'bench']],
  ['glass', 'glasses', ['glasss', 'glass']], ['watch', 'watches', ['watchs', 'watch']], ['peach', 'peaches', ['peachs', 'peach']],
];

/**
 * Naming words (nouns) and words that are never naming words here.
 * Words that can also be a noun ("a run", "a jump") are left out of WORDS_NOT_NOUN.
 */
export const NOUNS = ['ball', 'teacher', 'school', 'apple', 'park', 'bag', 'chair', 'river', 'pencil', 'mango', 'house', 'boy', 'girl', 'bird'];
export const WORDS_NOT_NOUN = ['happy', 'big', 'soft', 'tall', 'sad', 'eat', 'sing', 'sit', 'go', 'slow', 'hot', 'give', 'pretty', 'thin'];

/** Action words (verbs), and words that are never action words here. */
export const VERBS = ['eat', 'sing', 'sit', 'go', 'read', 'write', 'swim', 'jump', 'run', 'hop', 'clap', 'sleep', 'cry', 'draw'];
export const WORDS_NOT_VERB = ['cat', 'apple', 'girl', 'boy', 'desk', 'banana', 'happy', 'blue', 'tall', 'red', 'soft', 'big', 'sad', 'pretty'];

/**
 * Opposites. Words in the same `group` are never used as each other's wrong
 * answers (tall/short and big/small are all about size).
 */
export const OPPOSITES = [
  ['big', 'small', 'size'], ['tall', 'short', 'size'], ['hot', 'cold', 'heat'], ['up', 'down', 'place'], ['in', 'out', 'place'],
  ['happy', 'sad', 'mood'], ['fast', 'slow', 'speed'], ['day', 'night', 'time'], ['wet', 'dry', 'wet'], ['full', 'empty', 'full'],
  ['push', 'pull', 'move'], ['open', 'shut', 'open'], ['first', 'last', 'order'], ['sit', 'stand', 'place'], ['loud', 'quiet', 'sound'],
];

/** Simple sentences for capital letters and full stops (each starts with a capital and ends with "."). */
export const SIMPLE_SENTENCES = [
  'The cat is on the mat.', 'We like to play.', 'My dog can run fast.', 'The sun is hot.', 'Mia has a red bag.',
  'I can see a bird.', 'Dad is at home.', 'The fish can swim.', 'It is a big tree.', 'Ben reads a book.',
  'I like mangoes.', 'We go to school.',
];

/** Telling sentences (.) and asking sentences (?), without the end mark. */
export const END_MARKS = [
  ['Where is my hat', '?'], ['Can you help me', '?'], ['What is your name', '?'], ['Do you like rice', '?'],
  ['Who is at the door', '?'], ['Is it raining', '?'], ['How old are you', '?'], ['Are you hungry', '?'],
  ['My hat is red', '.'], ['I can help you', '.'], ['My name is Ana', '.'], ['I like rice', '.'],
  ['Lola is at the door', '.'], ['It is raining', '.'], ['I am seven years old', '.'], ['The baby is sleeping', '.'],
];

/** Word families for "Which word rhymes with …?" (written words, Grade 1). */
export const WORD_FAMILIES = {
  at: ['cat', 'hat', 'bat', 'mat', 'rat', 'sat'],
  an: ['can', 'fan', 'man', 'pan', 'van', 'ran'],
  ig: ['big', 'dig', 'pig', 'wig', 'fig'],
  op: ['hop', 'mop', 'top', 'pop', 'stop'],
  ug: ['bug', 'hug', 'mug', 'rug', 'jug'],
  en: ['hen', 'pen', 'ten', 'men'],
  ake: ['cake', 'lake', 'make', 'bake', 'rake'],
  ing: ['king', 'ring', 'sing', 'wing'],
};

/** Words for ABC order (Grade 1 uses different first letters; Grade 2 also the same first letter). */
export const ORDER_WORDS = [
  'apple', 'ant', 'arm', 'ball', 'bed', 'bird', 'boat', 'cat', 'cake', 'cup', 'dog', 'desk', 'duck', 'egg', 'eel',
  'fan', 'fish', 'frog', 'goat', 'gift', 'hat', 'hen', 'house', 'ink', 'jam', 'jar', 'kite', 'king', 'lamp', 'leaf',
  'map', 'milk', 'moon', 'nest', 'net', 'owl', 'pen', 'pig', 'pot', 'queen', 'rain', 'ring', 'rock', 'sun', 'sock',
  'tree', 'top', 'tub', 'van', 'vest', 'web', 'wing', 'yak', 'zoo',
];

/* ------------------------------------------------------------------ */
/* Grade 2                                                             */
/* ------------------------------------------------------------------ */

/** Vowel teams: the word, and two spellings that sound alike but are wrong (never a real word). */
export const VOWEL_TEAMS = [
  ['rain', ['rane', 'rayn']], ['train', ['trane', 'trayn']], ['snail', ['snale', 'snayl']], ['paint', ['paynt', 'pante']],
  ['play', ['plai', 'plae']], ['day', ['dai', 'dae']], ['tree', ['trea', 'tre']], ['sheep', ['sheap', 'shepe']],
  ['green', ['grean', 'grene']], ['leaf', ['leef', 'lefe']], ['eat', ['eet', 'ete']], ['teach', ['teech', 'teche']],
  ['boat', ['bote', 'bowt']], ['coat', ['cowt', 'coet']], ['road', ['roed', 'rowd']], ['snow', ['snoa', 'sno']],
  ['slow', ['slo', 'sloa']], ['soap', ['sope', 'sowp']],
];

/** R-controlled vowels: the word split at the missing letters. */
export const R_CONTROLLED = [
  ['car', '🚗', 'c', 'ar', ''], ['star', '⭐', 'st', 'ar', ''], ['shark', '🦈', 'sh', 'ar', 'k'],
  ['horse', '🐴', 'h', 'or', 'se'], ['fork', '🍴', 'f', 'or', 'k'], ['corn', '🌽', 'c', 'or', 'n'], ['storm', '⛈️', 'st', 'or', 'm'],
  ['bird', '🐦', 'b', 'ir', 'd'], ['girl', '👧', 'g', 'ir', 'l'], ['shirt', '👕', 'sh', 'ir', 't'],
  ['turtle', '🐢', 't', 'ur', 'tle'], ['purse', '👛', 'p', 'ur', 'se'], ['burger', '🍔', 'b', 'ur', 'ger'],
].map(([word, emoji, before, team, after]) => ({ word, emoji, before, team, after }));
export const R_TEAMS = ['ar', 'or', 'ir', 'ur', 'er'];

/** Compound words (two words joined) and words that are not compound words. */
export const COMPOUNDS = [
  ['rainbow', 'rain', 'bow'], ['sunflower', 'sun', 'flower'], ['football', 'foot', 'ball'], ['toothbrush', 'tooth', 'brush'],
  ['cupcake', 'cup', 'cake'], ['starfish', 'star', 'fish'], ['bedroom', 'bed', 'room'], ['goldfish', 'gold', 'fish'],
  ['popcorn', 'pop', 'corn'], ['raincoat', 'rain', 'coat'], ['snowman', 'snow', 'man'], ['homework', 'home', 'work'],
  ['playground', 'play', 'ground'], ['seashell', 'sea', 'shell'], ['backpack', 'back', 'pack'], ['pancake', 'pan', 'cake'],
];
export const NOT_COMPOUNDS = ['happy', 'tiger', 'yellow', 'lemon', 'rabbit', 'river', 'orange', 'paper', 'table', 'water',
  'dinner', 'pencil', 'jacket', 'puzzle', 'turtle', 'apple', 'zebra', 'purple', 'cookie', 'giraffe'];

/** Plurals that do not just add -s: [one, many, wrong]. */
export const IRREGULAR_PLURALS = [
  ['child', 'children', ['childs', 'childrens']], ['mouse', 'mice', ['mouses', 'mices']], ['foot', 'feet', ['foots', 'feets']],
  ['tooth', 'teeth', ['tooths', 'teeths']], ['man', 'men', ['mans', 'mens']], ['woman', 'women', ['womans', 'womens']],
  ['goose', 'geese', ['gooses', 'geeses']], ['sheep', 'sheep', ['sheeps', 'sheepes']], ['deer', 'deer', ['deers', 'deeres']],
  ['leaf', 'leaves', ['leafs', 'leafes']], ['knife', 'knives', ['knifes', 'knifs']], ['wolf', 'wolves', ['wolfs', 'wolfes']],
  ['baby', 'babies', ['babys', 'babyes']], ['puppy', 'puppies', ['puppys', 'puppyes']], ['city', 'cities', ['citys', 'cityes']],
  ['party', 'parties', ['partys', 'partyes']],
];

/** Past tense in a sentence: [sentence with ___, right, wrong]. */
export const PAST_TENSE = [
  ['Yesterday, I ___ to the park.', 'went', ['goed', 'go']],
  ['Last night, we ___ fish for dinner.', 'ate', ['eated', 'eat']],
  ['Yesterday, Ben ___ a big rainbow.', 'saw', ['seen', 'see']],
  ['This morning, the dog ___ after the ball.', 'ran', ['runned', 'runs']],
  ['Last Sunday, we ___ in the sea.', 'swam', ['swimmed', 'swims']],
  ['Yesterday, Mia ___ a card for Mama.', 'made', ['maked', 'makes']],
  ['Last week, Lolo ___ to visit us.', 'came', ['comed', 'comes']],
  ['Yesterday, I ___ a letter to my friend.', 'wrote', ['writed', 'writes']],
  ['Last night at the party, we ___ a happy song.', 'sang', ['singed', 'sings']],
  ['After the game, Carlo ___ a glass of water.', 'drank', ['drinked', 'drinks']],
  ['Last Saturday, Papa ___ us to the zoo.', 'took', ['taked', 'takes']],
  ['Yesterday, Ana ___ me a pencil.', 'gave', ['gived', 'gives']],
  ['Last week, Mama ___ new shoes for me.', 'bought', ['buyed', 'buys']],
  ['Yesterday, I ___ my room.', 'cleaned', ['cleaning', 'clean']],
  ['Last night, the baby ___ a lot.', 'cried', ['cryed', 'crys']],
  ['This morning, we ___ to music.', 'danced', ['danceed', 'dance']],
];

/** Pronouns: [sentence with ___, right, wrong]. */
export const PRONOUNS = [
  ['Mia is my sister. ___ likes to dance.', 'She', ['He', 'They']],
  ['Jose is my brother. ___ plays basketball.', 'He', ['She', 'We']],
  ['Ana and Ben are friends. ___ walk to school together.', 'They', ['He', 'She']],
  ['My cat is hungry. ___ wants some fish.', 'It', ['They', 'We']],
  ['Lola Rosa bakes bread. ___ gets up early.', 'She', ['He', 'It']],
  ['Papa is a driver. ___ drives a jeepney.', 'He', ['She', 'It']],
  ['My friends and I like games. ___ play after school.', 'We', ['They', 'He']],
  ['The birds sing in the morning. ___ sit in the tree.', 'They', ['It', 'He']],
  ['The ball is flat. ___ needs air.', 'It', ['They', 'He']],
  ['Carlo gave the book to Mia. He gave it to ___.', 'her', ['him', 'them']],
  ['Ana called her brothers. She called ___ for lunch.', 'them', ['him', 'her']],
  ['Ben lost his pen. Can you help ___ find it?', 'him', ['her', 'them']],
];

/** Describing words: [sentence, the describing word, two other words from the sentence]. */
export const ADJECTIVES = [
  ['The brown dog barked.', 'brown', ['dog', 'barked']],
  ['Mia wore a pretty dress.', 'pretty', ['Mia', 'wore']],
  ['The tall tree gives shade.', 'tall', ['tree', 'gives']],
  ['I ate a sweet mango.', 'sweet', ['ate', 'mango']],
  ['A tiny ant carried a crumb.', 'tiny', ['ant', 'carried']],
  ['We swam in the cold water.', 'cold', ['swam', 'water']],
  ['The noisy rooster woke me up.', 'noisy', ['rooster', 'woke']],
  ['Ben has a new bike.', 'new', ['Ben', 'bike']],
  ['The soft pillow is on the bed.', 'soft', ['pillow', 'bed']],
  ['A happy baby smiled at me.', 'happy', ['baby', 'smiled']],
  ['The old jeepney stopped.', 'old', ['jeepney', 'stopped']],
  ['Lola cooked hot soup.', 'hot', ['cooked', 'soup']],
];

/** Contractions: [two words, contraction, wrong]. */
export const CONTRACTIONS = [
  ['do not', "don't", ['dont', "do'nt"]], ['cannot', "can't", ['cant', "ca'nt"]], ['is not', "isn't", ['isnt', "is'nt"]],
  ['it is', "it's", ['its', "it'is"]], ['I am', "I'm", ['Im', "I'am"]], ['you are', "you're", ['your', "you'r"]],
  ['we are', "we're", ['were', "w'ere"]], ['they are', "they're", ['there', 'their']], ['let us', "let's", ['lets', "let'us"]],
  ['did not', "didn't", ['didnt', "did'nt"]], ['was not', "wasn't", ['wasnt', "was'nt"]], ['I will', "I'll", ['Ill', "I'wil"]],
  ['she is', "she's", ['shes', "she'is"]], ['are not', "aren't", ['arent', "are'nt"]], ['does not', "doesn't", ['doesnt', "does'nt"]],
];

/** Words that mean the same: [word, same meaning, group]. Words in a group are never wrong answers for each other. */
export const SYNONYMS = [
  ['big', 'large', 'size'], ['small', 'little', 'size'], ['happy', 'glad', 'mood'], ['fast', 'quick', 'speed'],
  ['start', 'begin', 'start'], ['shout', 'yell', 'voice'], ['close', 'shut', 'end'], ['end', 'finish', 'end'],
  ['smart', 'clever', 'mind'], ['angry', 'mad', 'mood2'], ['tired', 'sleepy', 'body'], ['scared', 'afraid', 'mood3'],
  ['gift', 'present', 'thing'], ['pretty', 'beautiful', 'look'], ['talk', 'speak', 'voice'], ['jump', 'leap', 'move'],
];

/** Proper nouns for capital letters: [sentence with {} for the name, the name]. */
export const PROPER_NOUNS = [
  ['We went to {} last summer.', 'Manila'], ['My best friend is {}.', 'Carlo'], ['School starts on {}.', 'Monday'],
  ['My birthday is in {}.', 'June'], ['We swam at a beach in {}.', 'Cebu'], ['Our teacher is Mrs. {}.', 'Santos'],
  ['We have no school on {}.', 'Sunday'], ['Christmas is in {}.', 'December'], ['My cousin lives in {}.', 'Davao'],
  ['I gave the book to {}.', 'Ana'], ['We have a test on {}.', 'Friday'], ['Lolo was born in {}.', 'Iloilo'],
];

/**
 * Sentences to put in order (Grade 2 challenge): [right, two mixed-up orders].
 * The wrong orders are written by hand, start with a capital letter and end
 * with a full stop like the right one, so only the word order gives them away.
 */
export const ORDER_SENTENCES = [
  ['The dog is very big.', 'The dog very is big.', 'Big the dog is very.'],
  ['We play after school.', 'We after play school.', 'Play school we after.'],
  ['My mother cooks rice.', 'My rice cooks mother.', 'Cooks my mother rice.'],
  ['The bird can fly high.', 'The bird high can fly.', 'Fly the bird can high.'],
  ['I like to read books.', 'I books to like read.', 'Read like I to books.'],
  ['Ana has a green kite.', 'Ana a green has kite.', 'Green kite Ana has a.'],
  ['The baby is asleep now.', 'The asleep baby now is.', 'Now asleep the is baby.'],
  ['Papa drives to work.', 'Papa to drives work.', 'Work drives Papa to.'],
  ['We eat mangoes in summer.', 'We mangoes in eat summer.', 'Summer in we mangoes eat.'],
  ['The rain is falling.', 'The falling is rain.', 'Falling the is rain.'],
];

/* ------------------------------------------------------------------ */
/* Grade 3                                                             */
/* ------------------------------------------------------------------ */

/** Prefixes: [word, meaning, wrong meanings]. */
export const PREFIXES = [
  ['unhappy', 'not happy', ['very happy', 'happy again']], ['unkind', 'not kind', ['kind again', 'very kind']],
  ['unlock', 'open a lock', ['lock again', 'lock before']], ['untie', 'loosen a knot', ['tie again', 'tie tightly']],
  ['redo', 'do again', ['not do', 'do before']], ['reread', 'read again', ['not read', 'read before']],
  ['refill', 'fill again', ['not fill', 'fill before']], ['rebuild', 'build again', ['not build', 'build before']],
  ['preheat', 'heat before', ['heat again', 'not heat']], ['preschool', 'school before grade school', ['school again', 'no school']],
  ['dislike', 'not like', ['like again', 'like a lot']], ['disagree', 'not agree', ['agree again', 'agree before']],
  ['misspell', 'spell wrongly', ['spell again', 'spell well']], ['misplace', 'put in the wrong place', ['place again', 'place before']],
];

/** Suffixes: [word, meaning, wrong meanings]. */
export const SUFFIXES = [
  ['careful', 'full of care', ['without care', 'care again']], ['careless', 'without care', ['full of care', 'care before']],
  ['helpful', 'full of help', ['without help', 'help again']], ['hopeless', 'without hope', ['full of hope', 'hope again']],
  ['fearless', 'without fear', ['full of fear', 'fear again']], ['playful', 'full of play', ['without play', 'play again']],
  ['painless', 'without pain', ['full of pain', 'pain again']], ['teacher', 'a person who teaches', ['a place to teach', 'teaching again']],
  ['singer', 'a person who sings', ['a song', 'singing again']], ['slowly', 'in a slow way', ['very slow', 'not slow']],
  ['softly', 'in a soft way', ['very soft', 'not soft']], ['kindness', 'being kind', ['not kind', 'kind again']],
];

/** Homophones in sentences: [sentence with ___, right, wrong]. */
export const HOMOPHONES = [
  ['I can ___ the birds singing.', 'hear', ['here']], ['Please come over ___.', 'here', ['hear']],
  ['They left ___ bags at school.', 'their', ['there', "they're"]], ['Put the box over ___.', 'there', ['their', "they're"]],
  ['___ going to the beach today.', "They're", ['Their', 'There']], ['I have ___ pencils.', 'two', ['to', 'too']],
  ['We are going ___ school.', 'to', ['two', 'too']], ['It is ___ hot to play outside.', 'too', ['to', 'two']],
  ['The wind ___ my hat away.', 'blew', ['blue']], ['The sky is ___.', 'blue', ['blew']],
  ['I ___ the answer.', 'knew', ['new']], ['I have a ___ bag.', 'new', ['knew']],
  ['Our team ___ the game!', 'won', ['one']], ['I ate a ___ as a snack.', 'pear', ['pair']],
  ['I need a ___ of socks.', 'pair', ['pear']], ['My dog wagged ___ tail.', 'its', ["it's"]],
  ['___ raining outside.', "It's", ['Its']], ['Do you ___ the moon?', 'see', ['sea']],
  ['We swam in the ___.', 'sea', ['see']], ['This is ___ house.', 'our', ['hour']],
  ['We waited for one ___.', 'hour', ['our']], ['Please ___ your name here.', 'write', ['right']],
  ['Turn ___ at the corner.', 'right', ['write']], ['I like to ___ books.', 'read', ['red']],
];

/** Subject and verb agreement: [sentence with ___, right, wrong]. */
export const AGREEMENT = [
  ['The dogs ___ barking.', 'are', ['is']], ['My sister ___ a bike.', 'has', ['have']], ['They ___ at home yesterday.', 'were', ['was']],
  ['Ben and Mia ___ friends.', 'are', ['is']], ['He ___ to school every day.', 'walks', ['walk']], ['The cat ___ milk.', 'drinks', ['drink']],
  ['We ___ happy today.', 'are', ['is']], ['Each child ___ a book.', 'has', ['have']], ['The children ___ playing.', 'are', ['is']],
  ['She ___ not like rice.', 'does', ['do']], ['My friends ___ me with my homework.', 'help', ['helps']], ['There ___ three apples.', 'are', ['is']],
  ['I ___ in Grade 3.', 'am', ['is']], ['The bird ___ in the tree yesterday.', 'was', ['were']],
];

/** Tense from a time word: [sentence with ___, right, wrong]. */
export const TENSES = [
  ['Yesterday, I ___ my room.', 'cleaned', ['will clean', 'am cleaning']],
  ['Tomorrow, we ___ Lola.', 'will visit', ['visited', 'were visiting']],
  ['Right now, Ana ___ a book.', 'is reading', ['was reading', 'will read']],
  ['Last night, it ___ hard.', 'rained', ['will rain', 'is raining']],
  ['Next week, our class ___ a trip.', 'will take', ['took', 'was taking']],
  ['Right now, the boys ___ ball.', 'are playing', ['played', 'were playing']],
  ['Yesterday, Papa ___ the car.', 'washed', ['will wash', 'is washing']],
  ['Tomorrow, I ___ my friend.', 'will call', ['called', 'was calling']],
  ['Right now, the baby ___.', 'is sleeping', ['slept', 'was sleeping']],
  ['Last Monday, we ___ a play.', 'watched', ['will watch', 'are watching']],
];

/** Adverbs: [sentence, the word that tells how/when/where, two other words]. */
export const ADVERBS = [
  ['The turtle walked slowly.', 'slowly', ['turtle', 'walked']], ['Mia sang softly.', 'softly', ['Mia', 'sang']],
  ['The rabbit ran quickly.', 'quickly', ['rabbit', 'ran']], ['Ben finished his work carefully.', 'carefully', ['finished', 'work']],
  ['The baby laughed loudly.', 'loudly', ['baby', 'laughed']], ['We waited patiently.', 'patiently', ['We', 'waited']],
  ['The children played happily.', 'happily', ['children', 'played']], ['Lolo walks slowly to the store.', 'slowly', ['Lolo', 'walks']],
  ['The bird flew away.', 'away', ['bird', 'flew']], ['We sat quietly in class.', 'quietly', ['We', 'sat']],
];

/** Comparing words: [sentence with ___, right, wrong]. */
export const COMPARISONS = [
  ['This rope is ___ than that one. (long)', 'longer', ['longest', 'more long']],
  ['Mount Apo is the ___ mountain in the Philippines. (high)', 'highest', ['higher', 'most high']],
  ['An elephant is ___ than a dog. (big)', 'bigger', ['biggest', 'more big']],
  ['A cheetah is the ___ land animal. (fast)', 'fastest', ['faster', 'most fast']],
  ['I am ___ today than yesterday. (happy)', 'happier', ['happiest', 'more happy']],
  ['This is the ___ mango I have ever eaten! (good)', 'best', ['better', 'goodest']],
  ['My cold is ___ today than yesterday. (bad)', 'worse', ['worst', 'badder']],
  ['That is the ___ flower in the garden. (beautiful)', 'most beautiful', ['more beautiful', 'beautifulest']],
  ['A rock is ___ than a leaf. (heavy)', 'heavier', ['heaviest', 'more heavy']],
  ['Ana is the ___ girl in her class. (tall)', 'tallest', ['taller', 'most tall']],
  ['Today is ___ than yesterday. (hot)', 'hotter', ['hottest', 'more hot']],
  ['This puzzle is ___ than the last one. (easy)', 'easier', ['easiest', 'more easy']],
];

/** a or an: [the words after the gap, right]. Sound decides, not spelling (an hour, a uniform). */
export const ARTICLES = [
  ['orange', 'an'], ['umbrella', 'an'], ['egg', 'an'], ['elephant', 'an'], ['ant', 'an'], ['ice cream', 'an'], ['hour', 'an'],
  ['owl', 'an'], ['banana', 'a'], ['house', 'a'], ['uniform', 'a'], ['unicorn', 'a'], ['dog', 'a'], ['yellow bag', 'a'],
  ['old book', 'an'], ['big apple', 'a'], ['one-peso coin', 'a'], ['honest boy', 'an'],
];

/** Joining words: [sentence with ___, right, wrong]. Only one choice makes sense. */
export const CONJUNCTIONS = [
  ['I was hungry, ___ I ate a sandwich.', 'so', ['but', 'because']],
  ['I wanted to play outside, ___ it was raining.', 'but', ['so', 'because']],
  ['We stayed inside ___ it was raining.', 'because', ['but', 'so']],
  ['I like mangoes ___ bananas.', 'and', ['but', 'because']],
  ['Ana was tired, ___ she went to bed early.', 'so', ['but', 'because']],
  ['Ben studied hard ___ he wanted to pass.', 'because', ['but', 'so']],
  ['The soup was hot, ___ I waited.', 'so', ['but', 'because']],
  ['Carlo can swim, ___ he cannot dive.', 'but', ['so', 'because']],
  ['Mia brought an umbrella ___ the sky was dark.', 'because', ['but', 'so']],
  ['We bought rice ___ eggs at the store.', 'and', ['because', 'so']],
];

/** Syllables (beats). Words that people say with different beats (family, chocolate, fire) are left out. */
export const SYLLABLES = [
  ['cat', 1], ['dog', 1], ['school', 1], ['fish', 1], ['tiger', 2], ['pencil', 2], ['rainbow', 2], ['mango', 2], ['teacher', 2],
  ['apple', 2], ['banana', 3], ['elephant', 3], ['butterfly', 3], ['umbrella', 3], ['computer', 3], ['papaya', 3],
  ['watermelon', 4], ['caterpillar', 4], ['alligator', 4], ['television', 4],
];

/** Sayings and what they mean (Grade 3 challenge). */
export const IDIOMS = [
  ["It's raining cats and dogs.", 'It is raining very hard.', ['Pets are falling from the sky.', 'It is a sunny day.']],
  ['That test was a piece of cake.', 'The test was very easy.', ['The test was about food.', 'The test was very hard.']],
  ['I am feeling under the weather.', 'I am feeling sick.', ['I am standing in the rain.', 'I am very happy.']],
  ['Hold your horses!', 'Wait a moment.', ['Ride a horse.', 'Hurry up.']],
  ['She has a heart of gold.', 'She is very kind.', ['She owns a lot of gold.', 'She is very strong.']],
  ['Break a leg in your show!', 'Good luck in your show!', ['Be careful not to fall.', 'Stop the show.']],
  ['It cost an arm and a leg.', 'It was very expensive.', ['It was very cheap.', 'It hurt a lot.']],
  ['Ben is all ears.', 'Ben is listening carefully.', ['Ben has big ears.', 'Ben cannot hear.']],
];

/* ------------------------------------------------------------------ */
/* Stories                                                             */
/* ------------------------------------------------------------------ */

/** Grade 1: three or four short sentences and three questions each. */
export const STORIES_G1 = [
  {
    title: 'The red ball', text: 'Ben has a red ball. He kicks it to his dog. The dog runs to get the ball.',
    qs: [
      { q: 'What color is the ball?', a: 'red', w: ['blue', 'green'] },
      { q: 'Who runs to get the ball?', a: 'the dog', w: ['Ben', 'a cat'] },
      { q: 'What does Ben do with the ball?', a: 'He kicks it.', w: ['He throws it in a box.', 'He hides it.'] },
    ],
  },
  {
    title: 'At the beach', text: 'It is a hot day. Mia and Lola go to the beach. They swim in the sea and eat mangoes.',
    qs: [
      { q: 'Where do Mia and Lola go?', a: 'to the beach', w: ['to the park', 'to school'] },
      { q: 'What do they eat?', a: 'mangoes', w: ['apples', 'bread'] },
      { q: 'What is the day like?', a: 'hot', w: ['cold', 'rainy'] },
    ],
  },
  {
    title: "Tom's fish", text: 'Tom has a little fish. The fish is orange. Tom feeds it every morning.',
    qs: [
      { q: 'What color is the fish?', a: 'orange', w: ['red', 'black'] },
      { q: 'When does Tom feed the fish?', a: 'every morning', w: ['every night', 'on Sunday'] },
      { q: 'Is the fish big or little?', a: 'little', w: ['big'] },
    ],
  },
  {
    title: 'A little seed', text: 'Ana plants a seed in a pot. She gives it water every day. Soon a green leaf comes up.',
    qs: [
      { q: 'Where does Ana plant the seed?', a: 'in a pot', w: ['in the sand', 'in a box'] },
      { q: 'What does Ana give the seed every day?', a: 'water', w: ['milk', 'juice'] },
      { q: 'What comes up?', a: 'a green leaf', w: ['a red flower', 'a big tree'] },
    ],
  },
  {
    title: 'The cat and the bug', text: 'The cat sits on the mat. A bug flies by. The cat jumps up to catch it.',
    qs: [
      { q: 'Where does the cat sit?', a: 'on the mat', w: ['on the bed', 'on a chair'] },
      { q: 'What flies by?', a: 'a bug', w: ['a bird', 'a kite'] },
      { q: 'What does the cat do?', a: 'It jumps up.', w: ['It goes to sleep.', 'It runs away.'] },
    ],
  },
  {
    title: "Jose's bike", text: 'Jose rides a bike to school. His bike is blue. He rings the bell: ring, ring!',
    qs: [
      { q: 'How does Jose go to school?', a: 'on a bike', w: ['in a car', 'on a bus'] },
      { q: 'What color is the bike?', a: 'blue', w: ['red', 'yellow'] },
      { q: 'What does Jose ring?', a: 'the bell', w: ['the phone', 'a gong'] },
    ],
  },
  {
    title: 'Splash!', text: 'It is raining. Pia takes her yellow umbrella. She jumps in a big puddle. Splash!',
    qs: [
      { q: 'What is the weather like?', a: 'It is raining.', w: ['It is sunny.', 'It is snowing.'] },
      { q: 'What color is the umbrella?', a: 'yellow', w: ['pink', 'blue'] },
      { q: 'What does Pia jump in?', a: 'a big puddle', w: ['a pool', 'a box'] },
    ],
  },
  {
    title: 'The cake', text: "Dad bakes a cake. It has six candles. Today is Kim's birthday!",
    qs: [
      { q: 'Who bakes the cake?', a: 'Dad', w: ['Mom', 'Kim'] },
      { q: 'How many candles does the cake have?', a: 'six', w: ['five', 'seven'] },
      { q: 'Why is there a cake?', a: "It is Kim's birthday.", w: ['It is Christmas.', 'Dad is hungry.'] },
    ],
  },
];

/** Grade 2: four or five sentences and four questions each, including a word meaning and an order question. */
export const STORIES_G2 = [
  {
    title: 'At the market',
    text: 'On Saturday, Lia went to the market with her grandmother. They bought fish, rice and ripe mangoes. Lia carried the bag of mangoes. It was heavy, but she did not drop it. Grandma gave her a mango as a thank-you.',
    qs: [
      { q: 'When did Lia go to the market?', a: 'on Saturday', w: ['on Sunday', 'on Monday'] },
      { q: 'Who went with Lia?', a: 'her grandmother', w: ['her father', 'her teacher'] },
      { q: 'Why did Grandma give Lia a mango?', a: 'to say thank you', w: ['because it was her birthday', 'because Lia was sick'] },
      { q: 'In the story, "ripe" mangoes are…', a: 'ready to eat', w: ['very small', 'still green and hard'] },
    ],
  },
  {
    title: 'The lost puppy',
    text: "Carlo found a small puppy near the gate. It was wet and shaking. Carlo dried it with a towel and gave it some warm milk. Then he made a sign: FOUND! SMALL BROWN PUPPY. The next day, a girl came to the house. \"That is my puppy, Choco!\" she cried.",
    qs: [
      { q: 'Where did Carlo find the puppy?', a: 'near the gate', w: ['in the park', 'at school'] },
      { q: 'What did Carlo do first to help the puppy?', a: 'He dried it with a towel.', w: ['He gave it a bath.', 'He took it to school.'] },
      { q: 'Why did Carlo make a sign?', a: "to find the puppy's owner", w: ['to sell the puppy', 'to give the puppy a name'] },
      { q: "What is the puppy's name?", a: 'Choco', w: ['Brownie', 'Spot'] },
    ],
  },
  {
    title: 'Paper boats',
    text: 'Rain fell all morning, so Nina could not play outside. She was bored. Her brother showed her how to fold a paper boat. When the rain stopped, they put their boats in a puddle and watched them float.',
    qs: [
      { q: 'Why could Nina not play outside?', a: 'It was raining.', w: ['She was sick.', 'It was night.'] },
      { q: 'How did Nina feel at first?', a: 'bored', w: ['happy', 'scared'] },
      { q: 'What did her brother show her?', a: 'how to fold a paper boat', w: ['how to draw a cat', 'how to fly a kite'] },
      { q: 'What happened last?', a: 'They watched their boats float.', w: ['Rain fell all morning.', 'Nina was bored.'] },
    ],
  },
  {
    title: 'The class garden',
    text: "Mr. Reyes's class has a garden behind the school. Each child takes care of one plant. Ben grows tomatoes and Ana grows pechay. Every Friday, the class waters the plants and pulls out the weeds.",
    qs: [
      { q: 'Where is the garden?', a: 'behind the school', w: ['at the market', 'in the park'] },
      { q: 'What does Ben grow?', a: 'tomatoes', w: ['pechay', 'corn'] },
      { q: 'When does the class water the plants?', a: 'every Friday', w: ['every Monday', 'every night'] },
      { q: 'In the story, "weeds" are…', a: 'plants that are not wanted', w: ['small bugs', 'big rocks'] },
    ],
  },
  {
    title: 'Fiesta day',
    text: 'There is a fiesta in our town today. The streets are full of colorful flags. A band plays music and people dance. My aunt cooks pancit and lumpia for our visitors. I like the fiesta because everyone is happy.',
    qs: [
      { q: 'What fills the streets?', a: 'colorful flags', w: ['cars', 'water'] },
      { q: 'What does the aunt cook?', a: 'pancit and lumpia', w: ['cake and bread', 'soup and rice'] },
      { q: 'What plays music?', a: 'a band', w: ['a radio', 'a bird'] },
      { q: 'Why does the writer like the fiesta?', a: 'Everyone is happy.', w: ['It is quiet.', 'There is no food.'] },
    ],
  },
  {
    title: 'The bird and the mouse',
    text: 'A small bird was stuck in a net. A mouse heard it chirping. The mouse chewed the net until there was a hole. The bird flew out and sang a happy song for the mouse.',
    qs: [
      { q: 'Where was the bird stuck?', a: 'in a net', w: ['in a tree', 'in a box'] },
      { q: 'Who heard the bird?', a: 'a mouse', w: ['a cat', 'a farmer'] },
      { q: 'How did the mouse help?', a: 'It chewed the net.', w: ['It called for help.', 'It pulled the wing.'] },
      { q: 'How did the bird say thank you?', a: 'It sang a happy song.', w: ['It gave the mouse a seed.', 'It built a nest.'] },
    ],
  },
  {
    title: 'Brushing teeth',
    text: 'We should brush our teeth two times a day: in the morning and before bed. Brushing takes away bits of food. If we do not brush, our teeth can get holes. Use a little toothpaste and brush for two minutes.',
    qs: [
      { q: 'How many times a day should we brush?', a: 'two times', w: ['one time', 'five times'] },
      { q: 'When should we brush?', a: 'in the morning and before bed', w: ['only at lunch', 'only on Sundays'] },
      { q: 'What can happen if we do not brush?', a: 'Our teeth can get holes.', w: ['Our hair can grow.', 'We can get taller.'] },
      { q: 'How long should we brush?', a: 'for two minutes', w: ['for ten minutes', 'for one hour'] },
    ],
  },
  {
    title: 'A jeepney ride',
    text: 'Papa and I took a jeepney to the city. The jeepney was long and painted with bright colors. I sat near the window and looked at the shops. When we wanted to get off, Papa said, "Para po!" and the driver stopped.',
    qs: [
      { q: 'How did they go to the city?', a: 'by jeepney', w: ['by boat', 'by plane'] },
      { q: 'What did the jeepney look like?', a: 'long and colorful', w: ['small and white', 'old and gray'] },
      { q: 'Where did the writer sit?', a: 'near the window', w: ['next to the driver', 'on the roof'] },
      { q: 'What did Papa say to stop the jeepney?', a: '"Para po!"', w: ['"Salamat po!"', '"Hello!"'] },
    ],
  },
];

/** Grade 3: longer stories and facts; questions on main idea, details, word meaning, order and reasons. */
export const STORIES_G3 = [
  {
    title: 'Mangrove forests',
    text: 'Along many coasts in the Philippines, you can find mangrove trees. Their roots grow down into the salty water like long legs. These roots hold the mud in place, so big waves cannot wash the land away. Small fish hide among the roots, where bigger fish cannot reach them. That is why people work hard to plant new mangroves.',
    qs: [
      { q: 'What is the main idea?', a: 'Mangrove trees protect the land and the fish.', w: ['Fish are hard to catch.', 'The sea is very salty.'] },
      { q: 'What do the roots hold in place?', a: 'the mud', w: ['the boats', 'the rain'] },
      { q: 'Why do small fish hide among the roots?', a: 'Bigger fish cannot reach them there.', w: ['The water is warmer there.', 'They eat the roots.'] },
      { q: 'In the story, "coasts" are…', a: 'land next to the sea', w: ['tall mountains', 'big cities'] },
    ],
  },
  {
    title: 'The paper towel test',
    text: 'Rico wanted to know which paper towel soaks up the most water. He bought three brands: A, B and C. He poured the same amount of water on each towel and waited one minute. Then he squeezed each towel into a cup and measured the water. Brand B held the most water, so Rico wrote that it was the best at soaking.',
    qs: [
      { q: 'What did Rico want to find out?', a: 'which paper towel soaks up the most water', w: ['which towel is the softest', 'which towel costs the least'] },
      { q: 'Why did he use the same amount of water on each towel?', a: 'to make the test fair', w: ['to save water', 'because he was in a hurry'] },
      { q: 'What did Rico do right after waiting one minute?', a: 'He squeezed each towel into a cup.', w: ['He bought three brands.', 'He poured water on each towel.'] },
      { q: 'Which brand was the best at soaking?', a: 'Brand B', w: ['Brand A', 'Brand C'] },
    ],
  },
  {
    title: "Lolo Ben's bangka",
    text: 'Every morning before sunrise, Lolo Ben pushes his bangka into the sea. He paddles out past the waves and drops his net. By the time the sun is high, he comes back with his catch. He sells some fish at the market, and his family eats the rest for lunch. Lolo says the sea is generous, but only if you take care of it.',
    qs: [
      { q: 'In the story, a "bangka" is…', a: 'a small boat', w: ['a fishing net', 'a market stall'] },
      { q: 'When does Lolo Ben go out to sea?', a: 'before sunrise', w: ['at noon', 'at midnight'] },
      { q: 'What does he do with the fish?', a: 'He sells some, and his family eats the rest.', w: ['He gives all of them away.', 'He keeps them in a tank.'] },
      { q: 'What does Lolo mean when he says the sea is generous?', a: 'The sea gives a lot to people who care for it.', w: ['The sea is angry.', 'The sea has no fish.'] },
    ],
  },
  {
    title: 'Mayon Volcano',
    text: 'Mayon Volcano in Albay is famous for its almost perfect cone shape. It is one of the most active volcanoes in the country. When it erupts, hot ash and lava can flow down its sides. Scientists watch Mayon closely and tell people when they need to leave their homes.',
    qs: [
      { q: 'Where is Mayon Volcano?', a: 'in Albay', w: ['in Cebu', 'in Davao'] },
      { q: 'What is Mayon famous for?', a: 'its almost perfect cone shape', w: ['its cold lakes', 'its tall trees'] },
      { q: 'Why do scientists watch Mayon closely?', a: 'to keep people safe', w: ['to sell tickets', 'to count the trees'] },
      { q: 'In the story, "erupts" means…', a: 'throws out hot ash and lava', w: ['falls asleep', 'turns green'] },
    ],
  },
  {
    title: "Ella's gift",
    text: "Ella wanted to buy a gift for her mother's birthday, which was four weeks away. The gift cost ₱200. Ella decided to save ₱50 each week from her allowance. She put the money in a jar and did not open it. On the morning of the birthday, she had exactly enough.",
    qs: [
      { q: 'Why did Ella save money?', a: 'to buy a gift for her mother', w: ['to buy a toy for herself', 'to pay for a trip'] },
      { q: 'How much did Ella save each week?', a: '₱50', w: ['₱20', '₱100'] },
      { q: 'Which word best describes Ella?', a: 'patient', w: ['lazy', 'careless'] },
      { q: 'What did Ella do first?', a: 'She decided to save ₱50 each week.', w: ['She bought the gift.', 'She opened the jar.'] },
    ],
  },
  {
    title: 'Where rain comes from',
    text: 'The sun heats the water in seas, rivers and lakes. The water turns into a gas called water vapor and rises into the air. High up, the air is cool, so the vapor turns back into tiny drops that form clouds. When the drops get big and heavy, they fall as rain. The rain flows back into rivers and seas, and the cycle starts again.',
    qs: [
      { q: 'What heats the water?', a: 'the sun', w: ['the wind', 'the moon'] },
      { q: 'What are clouds made of?', a: 'tiny drops of water', w: ['smoke from fires', 'dust from the ground'] },
      { q: 'Why does rain fall?', a: 'The drops get big and heavy.', w: ['The clouds get too hot.', 'The moon pulls it down.'] },
      { q: 'What happens after the rain falls?', a: 'It flows back into rivers and seas.', w: ['It turns into clouds right away.', 'It stays in the sky.'] },
    ],
  },
  {
    title: 'The new classmate',
    text: 'On Monday, a new girl named Aiko joined our class. She had just moved from Japan and did not know anyone. At recess she sat alone, holding her lunch box. I walked over and asked if she wanted to play piko with us. She smiled and nodded. By Friday, Aiko was teaching us a game from Japan.',
    qs: [
      { q: 'Why did Aiko sit alone at recess?', a: 'She did not know anyone yet.', w: ['She was angry.', 'She did not like games.'] },
      { q: 'What did the writer do?', a: 'asked Aiko to play', w: ['told the teacher', 'ate her lunch'] },
      { q: 'How did Aiko feel when she was asked to play?', a: 'happy', w: ['scared', 'angry'] },
      { q: 'What lesson does the story teach?', a: 'Being kind helps new classmates feel welcome.', w: ['Recess is too short.', 'Games from Japan are hard.'] },
    ],
  },
  {
    title: 'The tree of life',
    text: 'Many people call the coconut tree the "tree of life" because almost every part is useful. The coconut water is a refreshing drink, and the white meat is used in cooking. The leaves can be woven into baskets and mats. Even the trunk can be used to build houses.',
    qs: [
      { q: 'Why is the coconut tree called the "tree of life"?', a: 'Almost every part is useful.', w: ['It lives forever.', 'It grows very fast.'] },
      { q: 'What can the leaves be woven into?', a: 'baskets and mats', w: ['chairs and tables', 'cups and plates'] },
      { q: 'Which part can be used to build houses?', a: 'the trunk', w: ['the coconut water', 'the white meat'] },
      { q: 'In the story, a "refreshing" drink…', a: 'makes you feel cool and fresh', w: ['makes you sleepy', 'is very salty'] },
    ],
  },
];
