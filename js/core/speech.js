/**
 * Read-aloud using the device's own voices (Web Speech API).
 *
 * Device voices that work offline vary a lot in quality. To sound as
 * friendly as possible we:
 *  - rank the installed voices and prefer natural-sounding, female, offline
 *    ones (many devices default to a flat male voice),
 *  - speak a little slower and a little higher, which young children follow better,
 *  - turn maths symbols into words ("8 − 3 = ?" -> "8 minus 3 equals what?"),
 *  - let parents pick the voice, speed and pitch (saved in settings).
 *
 * On top of that, the app ships a RECORDED voice pack (audio/voice/): lesson
 * narration, Kinder questions, hints and praise were pre-recorded with a
 * natural-sounding open voice. When a sentence has a recording it is played;
 * anything else (e.g. a random Grade 4 sum) falls back to the device voice.
 */

import { textKey } from './hash.js';

const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;
export const VOICE_PACK_URL = './audio/voice/';

export const DEFAULT_VOICE_SETTINGS = Object.freeze({ voiceURI: '', rate: 0.9, pitch: 1.15, enabled: true, recorded: true });

let settings = { ...DEFAULT_VOICE_SETTINGS };
let voices = [];

const FRIENDLY = /(female|samantha|zira|aria|jenny|libby|sonia|natasha|karen|moira|tessa|serena|ava|allison|susan|hazel|heera|google us english|google uk english female|en-us-x-(sfg|tpc|iog)|en-gb-x-(gba|gbc))/i;
const NATURAL = /(natural|neural|enhanced|premium|wavenet)/i;
const FLAT = /(david|mark|george|james|ravi|male|espeak|robot)/i;

/** Higher is better. Offline voices always beat online ones because the app must work offline. */
const scoreVoice = (v) => {
  let score = 0;
  if (v.localService) score += 100;
  if (/^en[-_]us/i.test(v.lang)) score += 12;
  else if (/^en[-_](gb|au|ph|sg)/i.test(v.lang)) score += 10;
  else if (/^en/i.test(v.lang)) score += 6;
  else score -= 200;
  if (FRIENDLY.test(v.name) || FRIENDLY.test(v.voiceURI)) score += 25;
  if (NATURAL.test(v.name)) score += 15;
  if (FLAT.test(v.name)) score -= 20;
  return score;
};

const refreshVoices = () => {
  if (!supported) return;
  voices = window.speechSynthesis.getVoices().slice().sort((a, b) => scoreVoice(b) - scoreVoice(a));
};

if (supported) {
  refreshVoices();
  window.speechSynthesis.addEventListener?.('voiceschanged', refreshVoices);
}

/** English voices, best first, with an `offline` flag for the settings picker. */
export const listVoices = () => {
  refreshVoices();
  return voices.filter((v) => /^en/i.test(v.lang)).map((v) => ({ voiceURI: v.voiceURI, name: v.name, lang: v.lang, offline: v.localService }));
};

const chosenVoice = () => {
  if (!voices.length) refreshVoices();
  return voices.find((v) => v.voiceURI === settings.voiceURI) || voices[0] || null;
};

/* Recorded voice pack ------------------------------------------------ */

let recordedKeys = new Set();
let currentAudio = null;

/** Spoken-form key for a sentence: the same text always maps to the same clip. */
export const speechKey = (text) => textKey(toSpokenText(text).toLowerCase());

/**
 * Load the list of recorded clips. Safe to call when the pack is missing.
 * @returns {Promise<string[]>} The clip keys (empty when there is no pack).
 */
export const loadRecordedVoice = async () => {
  try {
    const response = await fetch(`${VOICE_PACK_URL}manifest.json`);
    if (!response.ok) return [];
    const manifest = await response.json();
    recordedKeys = new Set(manifest.keys || []);
  } catch {
    recordedKeys = new Set();
  }
  return [...recordedKeys];
};

const stopAudio = () => {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
};

/** Bumped on every speak/stop, so a cancelled clip never triggers a fallback. */
let speechGeneration = 0;

const playRecorded = (key) => new Promise((resolve, reject) => {
  const audio = new Audio(`${VOICE_PACK_URL}${key}.ogg`);
  currentAudio = audio;
  audio.onended = () => resolve();
  audio.onpause = () => resolve();
  audio.onerror = () => reject(new Error('clip failed'));
  audio.play().catch(reject);
});

export const canSpeak = () => (supported || recordedKeys.size > 0) && settings.enabled;

/** Apply saved settings (called at start-up and when a parent changes them). */
export const setVoiceSettings = (next) => {
  settings = { ...DEFAULT_VOICE_SETTINGS, ...(next || {}) };
};

export const getVoiceSettings = () => ({ ...settings });

/* Spoken maths ------------------------------------------------------- */

const FRACTION_NAMES = {
  2: ['half', 'halves'], 3: ['third', 'thirds'], 4: ['fourth', 'fourths'], 5: ['fifth', 'fifths'],
  6: ['sixth', 'sixths'], 7: ['seventh', 'sevenths'], 8: ['eighth', 'eighths'], 9: ['ninth', 'ninths'],
  10: ['tenth', 'tenths'], 11: ['eleventh', 'elevenths'], 12: ['twelfth', 'twelfths'],
  // Common denominators in Grade 5–6 work (2/3 + 1/4 = 11/12, 3/8 + 1/6 = 13/24).
  ...Object.fromEntries([
    [13, 'thirteenth'], [14, 'fourteenth'], [15, 'fifteenth'], [16, 'sixteenth'], [17, 'seventeenth'], [18, 'eighteenth'], [19, 'nineteenth'], [20, 'twentieth'],
    [21, 'twenty-first'], [22, 'twenty-second'], [23, 'twenty-third'], [24, 'twenty-fourth'], [25, 'twenty-fifth'], [30, 'thirtieth'], [100, 'hundredth'],
  ].map(([d, word]) => [d, [word, `${word}s`]])),
};

/** "2/3" -> "2 thirds", "1/2" -> "1 half"; denominators above 12 read as "over". */
const sayFraction = (num, den) => {
  const names = FRACTION_NAMES[Number(den)];
  return names ? `${num} ${Number(num) === 1 ? names[0] : names[1]}` : `${num} over ${den}`;
};

/** Measurement units read as words: [singular, plural]. */
const UNIT_WORDS = {
  'cm²': ['square centimetre', 'square centimetres'], 'cm³': ['cubic centimetre', 'cubic centimetres'],
  km: ['kilometre', 'kilometres'], cm: ['centimetre', 'centimetres'], mm: ['millimetre', 'millimetres'], m: ['metre', 'metres'],
  kg: ['kilogram', 'kilograms'], g: ['gram', 'grams'], ml: ['millilitre', 'millilitres'], 'ℓ': ['litre', 'litres'],
  h: ['hour', 'hours'], min: ['minute', 'minutes'],
};
const UNIT_RE = '(cm²|cm³|km|cm|mm|kg|ml|min|ℓ|m|g|h)(?![A-Za-z²³])';

/** "₱37.75" -> "37 pesos 75 centavos", "₱0.25" -> "25 centavos", "₱100.00" -> "100 pesos". */
const sayMoney = (whole, centavos = '00') => {
  const p = Number(String(whole).replace(/,/g, ''));
  const c = Number(centavos);
  const parts = [p && `${p} ${p === 1 ? 'peso' : 'pesos'}`, c && `${c} ${c === 1 ? 'centavo' : 'centavos'}`].filter(Boolean);
  return parts.join(' ') || '0 pesos';
};

/** A peso amount: "1,250" or "45", never swallowing a comma that ends a clause ("₱1, so"). */
const PESO_RE = '₱(\\d{1,3}(?:,\\d{3})+|\\d+)';

/**
 * "4:20" -> "4 20", "1:05" -> "1 oh 5", "10:00 a.m." -> "10 a.m.", "4:00" -> "4 o'clock",
 * and 24-hour times the way people say them: "13:00" -> "13 hundred", "07:15" -> "oh 7 15".
 */
const sayClock = (hours, mins, after) => {
  const twelveHour = /^\s*[ap]\.m\./.test(after);
  const is24 = !twelveHour && (hours.length === 2 && (hours[0] === '0' || Number(hours) >= 13));
  const h = hours === '00' ? 'zero zero' : hours[0] === '0' && hours.length === 2 ? `oh ${hours[1]}` : hours;
  if (mins === '00') return is24 ? `${h} hundred` : twelveHour ? h : `${h} o'clock`;
  return `${h} ${mins[0] === '0' ? `oh ${mins[1]}` : mins}`;
};

/** Money, units, clock times and degrees as words, before the rest of the maths rules run. */
const sayMeasures = (text) => text
  // Speeds before the units, so "60 km/h" is not read as "60 kilometres slash h".
  .replace(/(\d[\d,]*)\s?km\/h\b/g, (_, n) => `${n} ${n === '1' ? 'kilometre' : 'kilometres'} per hour`)
  .replace(/(\d[\d,]*)\s?m\/min\b/g, (_, n) => `${n} ${n === '1' ? 'metre' : 'metres'} per minute`)
  .replace(/\bkm\/h\b/g, 'kilometres per hour')
  .replace(/\bm\/min\b/g, 'metres per minute')
  .replace(/(\d)%/g, '$1 percent')
  .replace(/π/g, 'pi')
  // A ratio "2 : 3" is "2 to 3" (a clock time has no spaces: "2:30").
  .replace(/(\d) : (\d)/g, '$1 to $2')
  // Algebra: "3n + 4" is "3 n plus 4".
  .replace(/\b(\d+)([nky])\b/g, '$1 $2')
  .replace(/=\s*₱\?/g, 'equals how many pesos?')
  .replace(/=\s*\?¢/g, 'equals how many centavos?')
  .replace(new RegExp(`${PESO_RE} bill`, 'g'), (_, d) => `${d.replace(/,/g, '')} peso bill`)
  .replace(/\b1\/2 turn/g, 'half turn')
  .replace(/\b(\d)\/4 turn/g, (_, n) => ({ 1: 'quarter turn', 3: 'three-quarter turn' }[n] || `${n} quarter turn`))
  .replace(/\b(\d{1,2}):(\d{2})\b/g, (match, hh, mm, offset, whole) => sayClock(hh, mm, whole.slice(offset + match.length)))
  .replace(new RegExp(`${PESO_RE}(?:\\.(\\d{2}))?`, 'g'), (_, p, c) => sayMoney(p, c))
  .replace(/(\d+)¢/g, (_, c) => `${c} ${c === '1' ? 'centavo' : 'centavos'}`)
  // Temperatures: "100 °C" is "100 degrees Celsius"; angles stay "45 degrees".
  .replace(/(\d+)\s?°C/g, (_, n) => `${n} degrees Celsius`)
  .replace(/°C/g, 'degrees Celsius')
  .replace(/(\d+)°/g, (_, n) => `${n} degrees`)
  .replace(new RegExp(`=\\s*\\?\\s*${UNIT_RE}`, 'g'), (_, u) => `equals how many ${UNIT_WORDS[u][1]}?`)
  // "25 min + ? min": the operator is read later ("plus how many minutes?").
  .replace(new RegExp(`([+−×÷])\\s*\\?\\s*${UNIT_RE}`, 'g'), (_, op, u) => `${op} how many ${UNIT_WORDS[u][1]}?`)
  // "3 m ? cm": a second, unknown part of the same measure.
  .replace(new RegExp(`\\?\\s*${UNIT_RE}`, 'g'), (_, u) => `and how many ${UNIT_WORDS[u][1]}?`)
  .replace(new RegExp(`(\\d[\\d,]*)\\s?${UNIT_RE}`, 'g'), (_, n, u) => `${n} ${UNIT_WORDS[u][n === '1' ? 0 : 1]}`)
  // A unit with no number before it: "in cm", "Add the g", "into ml", "the whole kg".
  .replace(new RegExp(`\\b(in|the|into|whole|many) ${UNIT_RE}`, 'g'), (_, w, u) => `${w} ${UNIT_WORDS[u][1]}`);

/**
 * Put a short pause before each "equals" after the first in one sentence, so
 * a chain is read as steps: "7 times 8 equals 7 times 4 times 2, equals 28
 * times 2, equals 56." A single "8 plus 5 equals 13" is left as it is, and so are clauses already
 * split by commas ("3 equals 3, 8 equals 8").
 */
const pauseChains = (text) => text
  // Each sentence or clause on its own: "3 = 3, 8 = 8" is not a chain.
  // (Split after the punctuation without a lookbehind, which iOS 15 cannot parse.)
  .replace(/([.!?,])\s+/g, '$1\n')
  .replace(/\s+and\s+/g, '\nand ')
  .split('\n')
  .map((clause) => {
    let seen = 0;
    return clause.replace(/\s+equals\b/g, (match) => {
      seen += 1;
      return seen > 1 ? ', equals' : match;
    });
  })
  .join(' ');

/**
 * Turn maths notation into words a voice reads naturally, with pauses where
 * a teacher would pause. Used by the device voice AND to name recorded clips,
 * so both voices say exactly the same thing.
 */
/** Lines of a lesson ("…by place value:\n38,415\n38,154") are read with a pause between them. */
const joinLines = (text) => String(text).replace(/([^.!?:,\s])[ \t]*\n+\s*/g, '$1. ').replace(/\s*\n+\s*/g, ' ');

export const toSpokenText = (text) => pauseChains(sayMeasures(joinLines(text))
  .replace(/(\d),(\d{3})/g, '$1$2')
  .replace(/\?\s*\/\s*(\d+)/g, (_, den) => `how many ${FRACTION_NAMES[Number(den)]?.[1] || `over ${den}`}?`)
  // A mixed number: "2 3/4" is "2 and 3 fourths".
  .replace(/\b(\d+) (\d+)\/(\d+)/g, (_, w, num, den) => `${w} and ${sayFraction(num, den)}`)
  .replace(/(\d+)\/(\d+)/g, (_, num, den) => sayFraction(num, den))
  .replace(/\b(\d+)ths\b/g, (match, den) => FRACTION_NAMES[Number(den)]?.[1] || match)
  .replace(/\s*\+\s*/g, ' plus ')
  .replace(/\s*−\s*/g, ' minus ') // U+2212 is always the minus sign
  .replace(/\s*-\s+/g, ' minus ')
  .replace(/\s*×\s*/g, ' times ')
  .replace(/\s*÷\s*/g, ' divided by ')
  .replace(/\s+>\s+/g, ' is greater than ')
  .replace(/\s+<\s+/g, ' is less than ')
  .replace(/\s*=\s*\?\s*remainder (\d+)/g, ' equals what, remainder $1?')
  .replace(/\bremainder \?/g, 'remainder what?')
  .replace(/\s*=\s*\?/g, ' equals what?')
  .replace(/\s*=\s*/g, ' equals ')
  .replace(/\?\s*(plus|minus|times|divided by|equals)/g, 'what $1')
  .replace(/\s*→\s*/g, ', ')
  // A colon introduces the working ("Use facts you know: 7 × 8 ..."): pause like a full stop.
  .replace(/:\s+/g, '. ')
  // A "?" standing alone is the symbol itself: "put ? on what you must find".
  .replace(/\b(the|a) \?$/g, '$1 question mark?')
  .replace(/\b(the|a) \?(?=\s|$|[.,])/g, '$1 question mark')
  .replace(/(^|\s)\?(?=\s|$|[.,])/g, '$1a question mark')
  .replace(/\s+/g, ' ')
  .replace(/ ([.,!?])/g, '$1')
  .replace(/\.\.+/g, '.')
  .replace(/\?\./g, '?')
  .trim());

/**
 * Speak text, cancelling anything already being read.
 * @returns {Promise<void>} Resolves when speech ends (or immediately if muted).
 */
export const speak = async (text, overrides = {}) => {
  if (!canSpeak() || !text) return;
  stopSpeaking();
  const generation = speechGeneration;
  const key = speechKey(text);
  if (settings.recorded && recordedKeys.has(key)) {
    try {
      await playRecorded(key);
      return;
    } catch { /* fall back to the device voice below */ }
    // Stopped or replaced while the clip was loading: say nothing more.
    if (generation !== speechGeneration) return;
  }
  await speakWithDevice(text, overrides);
};

const speakWithDevice = (text, overrides) => new Promise((resolve) => {
  if (!supported) { resolve(); return; }
  const utterance = new SpeechSynthesisUtterance(toSpokenText(text));
  const voice = chosenVoice();
  if (voice) { utterance.voice = voice; utterance.lang = voice.lang; }
  utterance.rate = overrides.rate ?? settings.rate;
  utterance.pitch = overrides.pitch ?? settings.pitch;
  utterance.onend = () => resolve();
  utterance.onerror = () => resolve();
  window.speechSynthesis.speak(utterance);
});

export const stopSpeaking = () => {
  speechGeneration += 1;
  stopAudio();
  if (supported) window.speechSynthesis.cancel();
};
