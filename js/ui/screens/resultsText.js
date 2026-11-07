/**
 * Words for the results screen, kept DOM-free so the voice-pack collector
 * (tools/collect-speech.mjs) records exactly what the screen says.
 */

import { t, tEn } from '../../core/i18n.js';

const cheerKey = (pct) => (pct === 100 ? 'cheerPerfect' : pct >= 80 ? 'cheerGreat' : pct >= 50 ? 'cheerGood' : 'cheerKeep');

/** The cheer for a score in percent, as spoken (always English, to match the voice). */
export const cheer = (pct) => tEn(cheerKey(pct));

/** The cheer as shown, in the learner's label language. */
export const cheerShown = (pct) => t(cheerKey(pct));
