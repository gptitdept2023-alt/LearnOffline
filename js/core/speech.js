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
const VOICE_PACK_URL = './audio/voice/';

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

/** Load the list of recorded clips. Safe to call when the pack is missing. */
export const loadRecordedVoice = async () => {
  try {
    const response = await fetch(`${VOICE_PACK_URL}manifest.json`);
    if (!response.ok) return;
    const manifest = await response.json();
    recordedKeys = new Set(manifest.keys || []);
  } catch {
    recordedKeys = new Set();
  }
};

const stopAudio = () => {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
};

const playRecorded = (key) => new Promise((resolve, reject) => {
  const audio = new Audio(`${VOICE_PACK_URL}${key}.ogg`);
  currentAudio = audio;
  audio.onended = () => resolve();
  audio.onerror = () => reject(new Error('clip failed'));
  audio.play().catch(reject);
});

export const canSpeak = () => (supported || recordedKeys.size > 0) && settings.enabled;

/** Apply saved settings (called at start-up and when a parent changes them). */
export const setVoiceSettings = (next) => {
  settings = { ...DEFAULT_VOICE_SETTINGS, ...(next || {}) };
};

export const getVoiceSettings = () => ({ ...settings });

/** Turn maths notation into words a voice reads naturally. */
export const toSpokenText = (text) => String(text)
  .replace(/(\d),(\d{3})/g, '$1$2')
  .replace(/(\d+)\/(\d+)/g, '$1 over $2')
  .replace(/\s*\+\s*/g, ' plus ')
  .replace(/\s*[−-]\s+/g, ' minus ')
  .replace(/\s*×\s*/g, ' times ')
  .replace(/\s*÷\s*/g, ' divided by ')
  .replace(/\s*=\s*\?/g, ' equals what?')
  .replace(/\s*=\s*/g, ' equals ')
  .replace(/\?\s*(plus|minus|times|divided by|equals)/g, 'what $1')
  .replace(/\s+/g, ' ')
  .trim();

/**
 * Speak text, cancelling anything already being read.
 * @returns {Promise<void>} Resolves when speech ends (or immediately if muted).
 */
export const speak = async (text, overrides = {}) => {
  if (!canSpeak() || !text) return;
  stopSpeaking();
  const key = speechKey(text);
  if (settings.recorded && recordedKeys.has(key)) {
    try {
      await playRecorded(key);
      return;
    } catch { /* fall back to the device voice below */ }
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
  stopAudio();
  if (supported) window.speechSynthesis.cancel();
};
