/**
 * Sound effects, made on the fly with the Web Audio API: no audio files to
 * download or cache, so they work offline and cost no space.
 *
 * Browsers only allow sound after the child has tapped something, so the
 * audio context is created lazily on the first play (always after a tap).
 */

let enabled = true;
let ctx = null;

const audio = () => {
  if (!enabled) return null;
  const AudioCtx = globalThis.AudioContext || globalThis.webkitAudioContext;
  if (!AudioCtx) return null;
  try {
    ctx = ctx || new AudioCtx();
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  } catch {
    return null;
  }
};

/**
 * Play a short note.
 * @param {number} freq Start frequency in Hz.
 * @param {number} at Seconds from now.
 * @param {{dur?: number, type?: OscillatorType, vol?: number, slideTo?: number}} [opts]
 */
const note = (ac, freq, at, { dur = 0.12, type = 'triangle', vol = 0.16, slideTo } = {}) => {
  const t0 = ac.currentTime + at;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
};

/** Note frequencies used below. */
const C5 = 523.25; const E5 = 659.25; const G5 = 783.99; const C6 = 1046.5; const E6 = 1318.5; const G4 = 392;

/** Every sound the app makes, by name. */
const SOUNDS = {
  correct: (ac) => { note(ac, E5, 0); note(ac, G5, 0.09); note(ac, C6, 0.18, { dur: 0.2 }); },
  wrong: (ac) => { note(ac, G4, 0, { type: 'sine', dur: 0.18, vol: 0.12, slideTo: 300 }); },
  tap: (ac) => { note(ac, 880, 0, { type: 'sine', dur: 0.05, vol: 0.08 }); },
  pop: (ac) => { note(ac, 900, 0, { type: 'square', dur: 0.07, vol: 0.08, slideTo: 200 }); note(ac, 1400, 0.02, { type: 'sine', dur: 0.06, vol: 0.06 }); },
  coin: (ac) => { note(ac, 988, 0, { type: 'square', dur: 0.07, vol: 0.07 }); note(ac, E6, 0.07, { type: 'square', dur: 0.18, vol: 0.07 }); },
  tick: (ac) => { note(ac, 1200, 0, { type: 'sine', dur: 0.04, vol: 0.06 }); },
  fanfare: (ac) => {
    [C5, E5, G5, C6].forEach((f, i) => note(ac, f, i * 0.11, { dur: 0.16 }));
    note(ac, E6, 0.48, { dur: 0.4, vol: 0.14 });
    note(ac, C6, 0.48, { dur: 0.4, vol: 0.1 });
  },
  chest: (ac) => {
    note(ac, 200, 0, { type: 'sawtooth', dur: 0.25, vol: 0.05, slideTo: 600 });
    [C6, E6, G5 * 2].forEach((f, i) => note(ac, f, 0.25 + i * 0.08, { type: 'sine', dur: 0.3, vol: 0.1 }));
  },
};

/** Play a sound by name. Never throws: sound is a nice-to-have. */
export const playSfx = (name) => {
  const ac = audio();
  const sound = SOUNDS[name];
  if (!ac || !sound) return;
  try { sound(ac); } catch { /* ignore */ }
};

export const setSfxEnabled = (value) => { enabled = value !== false; };

export const sfxEnabled = () => enabled;
