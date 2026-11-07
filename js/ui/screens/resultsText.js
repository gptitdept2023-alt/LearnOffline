/**
 * Words for the results screen, kept DOM-free so the voice-pack collector
 * (tools/collect-speech.mjs) records exactly what the screen says.
 */

/** The cheer for a score in percent. */
export const cheer = (pct) => (pct === 100 ? 'Perfect!' : pct >= 80 ? 'Great work!' : pct >= 50 ? 'Good effort!' : 'Keep practising!');
