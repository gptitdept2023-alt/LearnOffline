/**
 * Read-aloud using the device's built-in voices (Web Speech API).
 * Works offline on Android and Windows because the voices are installed locally.
 */

const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;

/** Pick an English voice, preferring local (offline) ones. Cached after first lookup. */
let cachedVoice = null;
const getVoice = () => {
  if (cachedVoice || !supported) return cachedVoice;
  const voices = window.speechSynthesis.getVoices();
  const english = voices.filter((v) => v.lang && v.lang.toLowerCase().startsWith('en'));
  cachedVoice = english.find((v) => v.localService) || english[0] || null;
  return cachedVoice;
};

export const canSpeak = () => supported;

/**
 * Speak text, cancelling anything already being read.
 * @param {string} text
 */
export const speak = (text) => {
  if (!supported || !text) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  const voice = getVoice();
  if (voice) utterance.voice = voice;
  utterance.rate = 0.9; // A little slower for young readers.
  window.speechSynthesis.speak(utterance);
};

export const stopSpeaking = () => {
  if (supported) window.speechSynthesis.cancel();
};
