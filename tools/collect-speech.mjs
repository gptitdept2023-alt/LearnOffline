/**
 * Lists every sentence the app can say that is worth recording, as
 * [{ key, spoken }] on stdout. Used by tools/build_voice_pack.py.
 *
 *   node tools/collect-speech.mjs > /tmp/speech.json
 *
 * Included: all lesson narration and technique steps, quick checks, praise and
 * nudges, number words, and every question/hint/technique sentence the Kinder
 * (young) packs can generate (found by sampling their generators until no new
 * sentences appear). Grade 4 questions use random large numbers, so they are
 * read by the device voice instead.
 */
import { readFileSync } from 'node:fs';
import { generate } from '../js/engine/generators.js';
import { methodFor } from '../js/engine/techniques.js';
import { toSpokenText, speechKey } from '../js/core/speech.js';
import { seededRng } from '../js/core/random.js';
import { LINES } from '../js/ui/components/mascot.js';
import { revealText } from '../js/ui/components/interactive.js';
import { CHEST_STARS } from '../js/engine/quests.js';
import { cheer } from '../js/ui/screens/resultsText.js';

const root = new URL('..', import.meta.url).pathname;
const texts = new Set();
const add = (t) => { if (t && String(t).trim()) texts.add(String(t)); };

const addMethod = (m) => {
  if (!m) return;
  m.steps.forEach((s) => add(s.text));
  (m.faster?.steps || []).forEach((s) => add(s.text));
  m.guided.forEach((g) => {
    add(g.prompt);
    add(revealText(g));
  });
};

// Fixed phrases spoken by the UI.
[
  'Correct!', 'Yes!', 'Not yet. Look at the picture and try again.', 'Not quite. Look again and try another one.',
  'You know the steps! Now try some on your own.', 'Great job! 8 plus 5 equals 13.',
].forEach(add);
for (let n = 0; n <= 30; n += 1) { add(String(n)); add(`The answer is ${n}`); }
// Results: only the cheer the results screen really picks for that score.
// Set sizes: 6 and 10 for practice, 5-12 for Kinder levels and bosses.
for (let total = 5; total <= 12; total += 1) {
  for (let c = 0; c <= total; c += 1) add(`${cheer(Math.round((c / total) * 100))} ${c} out of ${total}.`);
}
// Game over (games.js): "New best" or a line from Pip, then the score.
for (let score = 0; score <= 30; score += 1) {
  add(`New best: ${score}! You scored ${score}.`);
  for (const line of score > 0 ? LINES.good : LINES.tryAgain) add(`${line} You scored ${score}.`);
}

// Kinder games and the quest chest.
add('How many? Pop the right number!');
for (const stars of CHEST_STARS.young) add(`Quest complete! You found ${stars} stars!`);
for (let n = 0; n <= 10; n += 1) { add(`Pop the balloon with ${n}!`); add(`Where is ${n}?`); }
add('Find the pairs! Match each one to its number.');
add('Find two bubbles that make 5.');
add('Find two bubbles that make 10.');
for (let a = 0; a <= 5; a += 1) {
  for (let b = 0; b <= 5; b += 1) {
    add(`Pop the answer to ${a} + ${b}`);
    if (a >= 1) add(`${a} + ${b}`); // memory-game cards
    add(`${a} + ${b} = ?`);
    if (a >= b) add(`${a} − ${b} = ?`);
  }
}

// Lessons in every pack.
const index = JSON.parse(readFileSync(`${root}packs/index.json`, 'utf8'));
for (const entry of index.packs) {
  const pack = JSON.parse(readFileSync(`${root}packs/${entry.file}`, 'utf8'));
  for (const topic of pack.topics) {
    for (const skill of topic.skills) {
      for (const step of skill.lesson?.steps || []) {
        add(step.text);
        const it = step.interact;
        if (!it) continue;
        if (it.kind === 'check') { add(it.prompt); add(`Yes! ${it.explain || ''}`.trim()); }
        if (it.kind === 'worked' || it.kind === 'tryIt') addMethod(methodFor({ method: it.method }));
        if (it.kind === 'fillFrame') {
          add(`Yes! That shows ${it.target}.`);
          for (let f = 0; f <= 20; f += 1) {
            if (f < it.target) add(`That is ${f}. Fill ${it.target - f} more.`);
            if (f > it.target) add(`That is ${f}. Take away ${f - it.target}.`);
          }
        }
      }
      // Young packs: sample generated questions exhaustively. Challenge-zone
      // skills (numbers to 100, story sums…) have too many sentences to record,
      // so they use the device voice.
      // The Challenge zone's small sums (bonds, within 20) are finite, so they are recorded too.
      const finite = ['numberBond', 'addition'].includes(skill.generator?.type) && (skill.generator.max ?? 20) <= 20;
      if (entry.young && skill.generator && (!topic.challenge || finite)) {
        const rng = seededRng(skill.skillId.length * 7919);
        let quiet = 0;
        while (quiet < 3000) {
          const before = texts.size;
          const q = generate(skill.generator, rng);
          add(q.prompt);
          add(q.hint);
          add(`The answer is ${q.spoken || q.display || q.answer}`);
          addMethod(methodFor(q));
          quiet = texts.size === before ? quiet + 1 : 0;
        }
      }
    }
  }
}

// One clip per spoken form (different texts can sound the same).
const byKey = new Map();
for (const t of texts) {
  const spoken = toSpokenText(t);
  byKey.set(speechKey(t), spoken);
}
process.stdout.write(JSON.stringify([...byKey].map(([key, spoken]) => ({ key, spoken }))));
