/**
 * Science for Grades 1–6, taught the Singapore way: observe, ask why, then
 * apply, across the themes Diversity, Cycles, Systems, Energy and
 * Interactions. Every question is original.
 *
 * Question makers:
 * - sciQuiz        a hand-written question bank (one right answer, written by hand)
 * - sciSort        classify things into groups (living or non-living, animal groups, materials…)
 * - sciOrder       sequences and cycles (life cycles, the water cycle, the path of food, air, blood)
 * - magnetPoles    which ends of two magnets attract or repel
 * - foodChain      producers, consumers and what happens when one population dies out
 * - experiment     read a fair test: what was changed, measured, kept the same, and what it shows
 * - stateAtTemp    solid, liquid or gas from melting and boiling points
 * - displacement   volume of an object from the water level in a measuring cylinder
 * - springStretch  a spring's length and extension from a results table
 * - circuit        will the bulb light? (series switches, conductors in a gap, parallel branches)
 *
 * The fixed lists live in scienceData.js (Grades 1–3) and scienceDataUpper.js
 * (Grades 4–6). tests/science.test.mjs checks each list for one right answer.
 * Pure and DOM-free.
 */

import { pick, shuffle, randInt } from '../../core/random.js';
import { NAMES, choicesWith } from './shared.js';
import * as D from './scienceData.js';
import * as U from './scienceDataUpper.js';

export const QUIZ_BANKS = { ...D.QUIZ, ...U.QUIZ };
export const SORT_SETS = { ...D.SORTS, ...U.SORTS };
export const SEQUENCES = { ...D.SEQUENCES, ...U.SEQUENCES };
export const FOOD_CHAINS = U.FOOD_CHAINS;
export const EXPERIMENTS = U.EXPERIMENTS;

const capitalise = (text) => text[0].toUpperCase() + text.slice(1);
const picture = (emoji, label) => ({ kind: 'letters', emoji, label });
const textCard = (text, emoji) => ({ kind: 'letters', text, ...(emoji ? { emoji } : {}), label: text });
/** Long answers are listed one per line; short ones as big buttons. */
const kindOf = (choices) => (choices.some((c) => c.length > 26) ? 'sentence' : 'phrase');
const YES = 'Yes, it lights up.';
const NO = 'No, it does not light up.';

/** Look up a named list, with a clear error for a typo in a pack. */
const lookup = (table, key, what) => {
  const found = table[key];
  if (!found) throw new Error(`Unknown science ${what} "${key}"`);
  return found;
};

/* ------------------------------------------------------------------ */
/* Question banks                                                       */
/* ------------------------------------------------------------------ */

/** One question from a hand-written bank: { q, a, w, e, pic }. */
const sciQuiz = ({ bank }, rng) => {
  const b = lookup(QUIZ_BANKS, bank, 'question bank');
  const item = pick(b.items, rng);
  const choices = shuffle([item.a, ...item.w], rng);
  return {
    answerType: 'choice',
    answer: item.a,
    choices,
    prompt: item.q,
    choiceKind: kindOf(choices),
    ...(item.pic ? { visual: picture(item.pic, 'a picture') } : {}),
    hint: item.h || b.hint,
    explain: item.e,
  };
};

/* ------------------------------------------------------------------ */
/* Sorting into groups                                                  */
/* ------------------------------------------------------------------ */

/** "🐶 dog" on a button, "dog" for screen readers and the voice. */
const itemText = (item) => (item.emoji ? `${item.emoji} ${item.name}` : item.name);
/** "A carabao", "Water", "The air around us": mass nouns (item.mass) and names with their own article take none. */
const subjectOf = (item) => (item.mass || /^(a|an|the) /i.test(item.name) ? capitalise(item.name) : `${/^[aeiou]/i.test(item.name) ? 'An' : 'A'} ${item.name}`);
const whyOf = (item, group) => item.why || `${subjectOf(item)} ${group.is || `is ${group.name}`}: ${group.why}.`;
/** "Which one floats?" when the group words its own question, else "Which one is a mammal?". */
export const pickPrompt = (group) => group.pick || `Which one is ${group.name}?`;

/**
 * Classify things. Two forms:
 * - name: a picture of one thing; choose its group.
 * - pick: "Which one is a mammal?"; one thing from that group among things from the others.
 * @param {{set: string, groups?: string[], forms?: ('name'|'pick')[]}} spec
 */
const sciSort = ({ set, groups, forms = ['name', 'pick'] }, rng) => {
  const s = lookup(SORT_SETS, set, 'sorting set');
  const keys = groups || Object.keys(s.groups);
  const group = s.groups[pick(keys, rng)];
  const item = pick(group.items, rng);
  const form = pick(forms, rng);

  if (form === 'name') {
    // Up to 4 choices: the answer and the next groups in the list, so the same thing always gets the same choices.
    const labels = keys.map((k) => s.groups[k].label);
    const at = labels.indexOf(group.label);
    const offered = labels.length <= 4 ? labels : [0, 1, 2, 3].map((k) => labels[(at + k) % labels.length]);
    const choices = shuffle(offered, rng);
    return {
      answerType: 'choice',
      answer: group.label,
      choices,
      prompt: s.ask,
      say: `${capitalise(item.name)}. ${s.ask}`,
      choiceKind: kindOf(choices),
      visual: { kind: 'letters', ...(item.emoji ? { emoji: item.emoji } : {}), text: item.name, label: item.name },
      hint: s.hint,
      explain: whyOf(item, group),
    };
  }

  // pick: the answer plus up to three things from the other groups.
  const others = shuffle(keys.filter((k) => s.groups[k] !== group).flatMap((k) => s.groups[k].items), rng).slice(0, 3);
  const all = [item, ...others];
  const choices = shuffle(all.map(itemText), rng);
  return {
    answerType: 'choice',
    answer: itemText(item),
    choices,
    choiceLabels: Object.fromEntries(all.map((i) => [itemText(i), i.name])),
    spoken: item.name,
    prompt: pickPrompt(group),
    choiceKind: kindOf(choices),
    hint: s.hint,
    explain: whyOf(item, group),
  };
};

/* ------------------------------------------------------------------ */
/* Sequences and cycles                                                 */
/* ------------------------------------------------------------------ */

const arrowJoin = (steps) => steps.join(' → ');
const isRotation = (a, b) => a.length === b.length && a.some((_, k) => a.every((x, i) => x === b[(i + k) % b.length]));

/** Wrong orders: swap two neighbouring steps (never another starting point of the same cycle). */
const wrongOrders = (seq, rng) => {
  const out = [];
  for (const i of shuffle([...Array(seq.steps.length - 1).keys()], rng)) {
    const w = [...seq.steps];
    [w[i], w[i + 1]] = [w[i + 1], w[i]];
    if (seq.cycle && isRotation(w, seq.steps)) continue;
    out.push(arrowJoin(w));
    if (out.length === 2) break;
  }
  return out;
};

/**
 * @param {{seqs: string[], forms?: ('next'|'before'|'order')[]}} spec
 * In a cycle, the step after the last is the first again ("the adult lays eggs").
 */
const sciOrder = ({ seqs, forms = ['next', 'before', 'order'] }, rng) => {
  const seq = lookup(SEQUENCES, pick(seqs, rng), 'sequence');
  const n = seq.steps.length;
  const form = pick(forms, rng);
  const visual = seq.pic ? picture(seq.pic, seq.name) : undefined;
  const hint = seq.hint || `Think through ${seq.name} from the start.`;

  if (form === 'order') {
    const answer = arrowJoin(seq.steps);
    const choices = shuffle([answer, ...wrongOrders(seq, rng)], rng);
    return {
      answerType: 'choice', answer, choices, prompt: `Which shows the right order for ${seq.name}?`,
      choiceKind: 'sentence', ...(visual ? { visual } : {}), hint, explain: `${capitalise(seq.name)}: ${answer}.`,
    };
  }
  // next: any step but the last of a one-way sequence. before: any step but the first.
  const i = seq.cycle ? randInt(0, n - 1, rng) : form === 'next' ? randInt(0, n - 2, rng) : randInt(1, n - 1, rng);
  const j = form === 'next' ? (i + 1) % n : (i - 1 + n) % n;
  const answer = seq.steps[j];
  const choices = choicesWith(answer, seq.steps.filter((_, k) => k !== i), rng, 4);
  const wraps = seq.cycle && ((form === 'next' && i === n - 1) || (form === 'before' && i === 0));
  return {
    answerType: 'choice',
    answer,
    choices,
    prompt: form === 'next'
      ? `In ${seq.name}, what comes right after "${seq.steps[i]}"?`
      : `In ${seq.name}, what comes just before "${seq.steps[i]}"?`,
    choiceKind: kindOf(choices),
    ...(visual ? { visual } : {}),
    hint,
    explain: `${capitalise(seq.name)}: ${arrowJoin(seq.steps)}${seq.cycle ? ', and then it starts again' : ''}.${wraps ? ` ${seq.loop || ''}` : ''}`.trim(),
  };
};

/* ------------------------------------------------------------------ */
/* Magnets                                                              */
/* ------------------------------------------------------------------ */

const flip = (pole) => (pole === 'N' ? 'S' : 'N');
const magnetText = (left, right) => `${left} ━━ ${flip(left)}     ${right} ━━ ${flip(right)}`;
const ATTRACT = 'They attract (pull together).';
const REPEL = 'They repel (push apart).';

/**
 * - pair: two bar magnets end to end; do they attract or repel?
 * - unknown: a pole is brought near end X and they attract or repel; what is X?
 * - iron: either pole near an iron bar always attracts.
 */
const magnetPoles = ({ forms = ['pair', 'pair', 'unknown', 'iron'] }, rng) => {
  const form = pick(forms, rng);
  const hint = 'Like poles (N and N, or S and S) repel. Unlike poles (N and S) attract.';
  if (form === 'pair') {
    // The left magnet's left end and the right magnet's left end; the facing ends are the middle two.
    const a = pick(['N', 'S'], rng);
    const b = pick(['N', 'S'], rng);
    const facingA = flip(a);
    const same = facingA === b;
    return {
      answerType: 'choice',
      answer: same ? REPEL : ATTRACT,
      choices: [ATTRACT, REPEL, 'Nothing happens.'],
      prompt: 'Two bar magnets are placed end to end, as shown. What will they do?',
      choiceKind: 'sentence',
      visual: textCard(magnetText(a, b), '🧲'),
      hint,
      explain: `The ends facing each other are ${facingA} and ${b}. ${same ? 'Like poles repel.' : 'Unlike poles attract.'}`,
    };
  }
  if (form === 'unknown') {
    const pole = pick(['N', 'S'], rng);
    const attract = rng() < 0.5;
    const answer = attract ? `${flip(pole)} pole` : `${pole} pole`;
    return {
      answerType: 'choice',
      answer,
      choices: ['N pole', 'S pole'],
      prompt: `The ${pole} pole of a magnet is brought near end X of another magnet. They ${attract ? 'attract' : 'repel'}. What is end X?`,
      choiceKind: 'phrase',
      visual: textCard(`${flip(pole)} ━━ ${pole}     X ━━ ?`, '🧲'),
      hint,
      explain: attract ? `Unlike poles attract, so X is the ${flip(pole)} pole.` : `Like poles repel, so X is the ${pole} pole.`,
    };
  }
  const pole = pick(['N', 'S'], rng);
  return {
    answerType: 'choice',
    answer: ATTRACT,
    choices: [ATTRACT, REPEL, 'Nothing happens.'],
    prompt: `An iron bar is not a magnet. The ${pole} pole of a magnet is brought near one end of it. What happens?`,
    choiceKind: 'sentence',
    hint: 'A magnet attracts iron with either pole. Only another magnet can repel.',
    explain: 'Either pole of a magnet attracts iron. Repelling only happens between two magnets, so it is the test for a magnet.',
  };
};

/* ------------------------------------------------------------------ */
/* Food chains                                                          */
/* ------------------------------------------------------------------ */

/**
 * A chain is [producer, consumer, …], each as [singular, plural].
 * Arrows mean "is eaten by".
 * @param {{forms?: ('producer'|'eats'|'eatenBy'|'top'|'removePrey'|'removePredator')[]}} spec
 */
const foodChain = ({ forms = ['producer', 'eats', 'eatenBy', 'top', 'removePrey', 'removePredator'] }, rng) => {
  const chain = pick(FOOD_CHAINS, rng);
  const names = chain.map(([one]) => one);
  const n = chain.length;
  const form = pick(forms, rng);
  const visual = textCard(arrowJoin(names), '🌿');
  const hint = 'The arrow points to the eater: "grass → grasshopper" means the grasshopper eats the grass.';
  const ask = (prompt, answer, pool, explain) => {
    const choices = choicesWith(answer, pool, rng, 4);
    return { answerType: 'choice', answer, choices, prompt, choiceKind: kindOf(choices), visual, hint, explain };
  };

  if (form === 'producer') {
    return ask('Which is the producer in this food chain?', names[0], names.slice(1), `${capitalise(names[0])} makes its own food from sunlight, so it is the producer.`);
  }
  if (form === 'top') {
    return ask('Which animal in this food chain is not eaten by any other?', names[n - 1], names.slice(1, n - 1), `Nothing in this chain eats the ${names[n - 1]}. It is at the end of the chain.`);
  }
  if (form === 'eats') {
    const i = randInt(1, n - 1, rng);
    return ask(`In this food chain, what does the ${names[i]} eat?`, names[i - 1], names.filter((_, k) => k !== i - 1 && k !== i), `The arrow goes from the ${names[i - 1]} to the ${names[i]}, so the ${names[i]} eats the ${names[i - 1]}.`);
  }
  if (form === 'eatenBy') {
    const i = randInt(0, n - 2, rng);
    return ask(`In this food chain, what eats the ${names[i]}?`, names[i + 1], names.filter((_, k) => k !== i + 1 && k !== i), `The arrow goes from the ${names[i]} to the ${names[i + 1]}, so the ${names[i + 1]} eats the ${names[i]}.`);
  }
  // What happens at first when one population dies out. Choose a consumer with something on the needed side.
  const UP = 'It would go up.';
  const DOWN = 'It would go down.';
  const SAME = 'It would stay the same.';
  if (form === 'removePrey') {
    // The removed animal eats i-1, which now has fewer predators.
    const i = randInt(1, n - 1, rng);
    const [, gone] = chain[i];
    const [, prey] = chain[i - 1];
    return {
      answerType: 'choice', answer: UP, choices: [UP, DOWN, SAME],
      prompt: `If all the ${gone} died, what would happen to the number of ${prey} at first?`,
      choiceKind: 'sentence', visual, hint,
      explain: `The ${gone} eat the ${prey}. With no ${gone} left, fewer ${prey} are eaten, so the number of ${prey} goes up.`,
    };
  }
  const i = randInt(0, n - 2, rng);
  const [, gone] = chain[i];
  const [, eater] = chain[i + 1];
  return {
    answerType: 'choice', answer: DOWN, choices: [UP, DOWN, SAME],
    prompt: `If all the ${gone} died, what would happen to the number of ${eater} at first?`,
    choiceKind: 'sentence', visual, hint,
    explain: `The ${eater} eat the ${gone}. With no ${gone} left, the ${eater} have less food, so their number goes down.`,
  };
};

/* ------------------------------------------------------------------ */
/* Experiments (fair tests)                                             */
/* ------------------------------------------------------------------ */

/** Strictly rising or falling results: start, then steps of `step` give or take a little. */
const results = (t, rng) => {
  const out = [randInt(t.y.start[0], t.y.start[1], rng)];
  for (let k = 1; k < t.xs.length; k += 1) out.push(out[k - 1] + t.y.dir * randInt(t.y.step[0], t.y.step[1], rng));
  return out;
};

/**
 * One experiment, its results table, and a question about it.
 * @param {{forms?: ('changed'|'measured'|'same'|'best'|'worst'|'conclude'|'predict')[]}} spec
 */
const experiment = ({ forms = ['changed', 'measured', 'best', 'worst'] }, rng) => {
  const form = pick(forms, rng);
  const t = pick(form === 'predict' ? EXPERIMENTS.filter((e) => !e.noPredict) : EXPERIMENTS, rng);
  const name = pick(NAMES, rng);
  const ys = results(t, rng);
  const rows = t.xs.map((x, k) => [t.xLabel(x), String(ys[k])]);
  const table = { kind: 'table', title: t.title, head: t.head, rows };
  const visual = { kind: 'stack', column: true, items: [{ kind: 'passage', title: t.title, text: t.setup(name) }, table] };
  const hint = {
    changed: 'A fair test changes only one thing. What is different for each one in the table?',
    measured: 'What did they check or count at the end? Look at the last column of the table.',
    same: 'To be fair, everything else must be kept the same. Only one thing is changed.',
    best: 'Find the right number in the table, then read across to its row.',
    worst: 'Find the right number in the table, then read across to its row.',
    conclude: 'Look at how the results change as you go down the table.',
    predict: 'The answer fits between the two rows next to it in the table.',
  }[form];
  const ask = (prompt, answer, wrong, explain) => {
    const choices = shuffle([answer, ...wrong], rng);
    return { answerType: 'choice', answer, choices, prompt, choiceKind: kindOf(choices), visual, hint, explain };
  };

  if (form === 'changed') return ask(`What did ${name} change in this experiment?`, t.changed, [t.measured, pick(t.same, rng)], `Only ${t.changed} was different for each one, so that is what was changed.`);
  if (form === 'measured') return ask(`What did ${name} measure?`, t.measured, [t.changed, pick(t.same, rng)], `${name} measured ${t.measured}. Those are the results in the table.`);
  if (form === 'same') {
    const answer = pick(t.same, rng);
    return ask(`To make it a fair test, what must ${name} keep the same?`, answer, [t.changed, t.measured], `Only ${t.changed} should change. Keeping ${answer} the same makes the test fair.`);
  }
  if (form === 'best' || form === 'worst') {
    const goal = t[form];
    const k = ys.indexOf(goal.pick === 'max' ? Math.max(...ys) : Math.min(...ys));
    const answer = t.choiceOf(t.xLabel(t.xs[k]));
    return ask(goal.q, answer, t.xs.filter((_, i) => i !== k).map((x) => t.choiceOf(t.xLabel(x))).slice(0, 3), `${goal.why(ys[k])} That is ${answer}.`);
  }
  if (form === 'conclude') return ask('What can you conclude from the results?', t.conclude, t.notConclude, `As ${t.changed} goes up, ${t.result} goes ${t.y.dir > 0 ? 'up' : 'down'}. ${t.conclude}`);
  // predict: a value halfway between two rows lies between their results.
  const k = randInt(0, t.xs.length - 2, rng);
  const x = (t.xs[k] + t.xs[k + 1]) / 2;
  const [lo, hi] = [ys[k], ys[k + 1]].sort((p, q) => p - q);
  const unit = t.yUnit;
  const answer = `between ${lo}${unit} and ${hi}${unit}`;
  const min = Math.min(...ys);
  const max = Math.max(...ys);
  return ask(`${name} tries again with ${t.xLabel(x)}. What would the result most likely be?`, answer, [`less than ${min}${unit}`, `more than ${max}${unit}`],
    `${capitalise(t.xLabel(x))} is between ${t.xLabel(t.xs[k])} and ${t.xLabel(t.xs[k + 1])}, so the result should be between their results: ${lo}${unit} and ${hi}${unit}.`);
};

/* ------------------------------------------------------------------ */
/* Melting and boiling points                                           */
/* ------------------------------------------------------------------ */

const stateOf = (temp, mp, bp) => (temp < mp ? 'solid' : temp < bp ? 'liquid' : 'gas');

/**
 * Four made-up substances with melting and boiling points.
 * - state: what is substance B at 40 °C?
 * - which: which one is a liquid at 30 °C? (exactly one is)
 */
const stateAtTemp = ({ forms = ['state', 'state', 'which'] }, rng) => {
  const labels = ['A', 'B', 'C', 'D'];
  const form = pick(forms, rng);
  // Temperatures are multiples of 5; test temperatures end in 2 or 7, so they never equal a melting or boiling point.
  const temp = form === 'which' ? pick([22, 27, 32, 37], rng) : randInt(-6, 22, rng) * 5 + pick([2, -3], rng);
  const draw = () => labels.map(() => {
    const mp = randInt(-20, 24, rng) * 5;
    return [mp, mp + randInt(4, 40, rng) * 5];
  });
  let subs = draw();
  for (let tries = 0; tries < 200; tries += 1) {
    const liquids = subs.filter(([mp, bp]) => stateOf(temp, mp, bp) === 'liquid').length;
    const kinds = new Set(subs.map(([mp, bp]) => stateOf(temp, mp, bp))).size;
    if (form === 'which' ? liquids === 1 : kinds >= 2) break;
    subs = draw();
  }
  const visual = {
    kind: 'table',
    title: 'Melting and boiling points',
    head: ['Substance', 'Melting point (°C)', 'Boiling point (°C)'],
    rows: subs.map(([mp, bp], k) => [labels[k], String(mp), String(bp)]),
  };
  const hint = 'Below its melting point a substance is a solid. Between its melting and boiling points it is a liquid. Above its boiling point it is a gas.';
  if (form === 'which') {
    const k = subs.findIndex(([mp, bp]) => stateOf(temp, mp, bp) === 'liquid');
    const [mp, bp] = subs[k];
    return {
      answerType: 'choice', answer: `Substance ${labels[k]}`, choices: labels.map((l) => `Substance ${l}`),
      prompt: `Which substance is a liquid at ${temp}\u00a0°C?`, choiceKind: 'phrase', visual, hint,
      explain: `${temp}\u00a0°C is above the melting point of ${labels[k]} (${mp}\u00a0°C) and below its boiling point (${bp}\u00a0°C), so it is a liquid.`,
    };
  }
  const k = randInt(0, 3, rng);
  const [mp, bp] = subs[k];
  const state = stateOf(temp, mp, bp);
  const why = state === 'solid' ? `${temp}\u00a0°C is below its melting point (${mp}\u00a0°C)`
    : state === 'liquid' ? `${temp}\u00a0°C is between its melting point (${mp}\u00a0°C) and boiling point (${bp}\u00a0°C)`
      : `${temp}\u00a0°C is above its boiling point (${bp}\u00a0°C)`;
  return {
    answerType: 'choice', answer: state, choices: ['solid', 'liquid', 'gas'],
    prompt: `What is substance ${labels[k]} at ${temp}\u00a0°C?`, choiceKind: 'phrase', visual, hint,
    explain: `${why}, so substance ${labels[k]} is a ${state}.`,
  };
};

/* ------------------------------------------------------------------ */
/* Measuring volume                                                     */
/* ------------------------------------------------------------------ */

/**
 * A stone is lowered into a measuring cylinder of water.
 * - object: the water rises from 50 ml to 65 ml; what is the stone's volume?
 * - after: 50 ml of water and a 15 cm³ stone; what is the new reading?
 */
const displacement = ({ forms = ['object', 'object', 'after'] }, rng) => {
  const before = randInt(6, 16, rng) * 5;
  const volume = randInt(1, 8, rng) * 5;
  const after = before + volume;
  // Things that sink and are big enough for 5–40 cm³ (a plastic toy would float).
  const thing = pick(['stone', 'metal padlock', 'lump of clay', 'metal toy car'], rng);
  const form = pick(forms, rng);
  const hint = 'The object pushes aside its own volume of water. 1 ml of water takes up 1 cm³.';
  if (form === 'object') {
    return {
      answerType: 'numeric', answer: volume,
      prompt: `A measuring cylinder has ${before} ml of water. A ${thing} is put in and the water rises to ${after} ml. What is the volume of the ${thing}, in cm³?`,
      visual: textCard(`${before} ml → ${after} ml`, '🧪'), hint,
      explain: `${after} ml − ${before} ml = ${volume} ml, and 1 ml takes up 1 cm³. The ${thing} has a volume of ${volume} cm³.`,
    };
  }
  return {
    answerType: 'numeric', answer: after,
    prompt: `A measuring cylinder has ${before} ml of water. A ${thing} with a volume of ${volume} cm³ is put in. What will the water level be, in ml?`,
    visual: textCard(`${before} ml + ${volume} cm³`, '🧪'), hint,
    explain: `The ${thing} pushes aside ${volume} ml of water: ${before} + ${volume} = ${after} ml.`,
  };
};

/* ------------------------------------------------------------------ */
/* Springs                                                              */
/* ------------------------------------------------------------------ */

/**
 * A spring stretches by the same amount for every 100 g (as long as it is
 * not stretched too far). Results for 0 to 300 g.
 * - length: how long with 500 g?
 * - extension: how much does it stretch for each 100 g?
 * - mass: which mass makes it L cm long?
 */
const springStretch = ({ forms = ['length', 'extension', 'mass'] }, rng) => {
  const start = randInt(5, 12, rng);
  const per = randInt(1, 4, rng);
  const masses = [0, 100, 200, 300];
  const visual = {
    kind: 'table', title: 'Masses hung on a spring',
    head: ['Mass (g)', 'Length of spring (cm)'],
    rows: masses.map((m) => [String(m), String(start + (m / 100) * per)]),
  };
  const hint = 'Find how much longer the spring gets for each extra 100 g. It is the same every time.';
  const form = pick(forms, rng);
  if (form === 'extension') {
    return {
      answerType: 'numeric', answer: per, visual, hint,
      prompt: 'How many centimetres does the spring stretch for each 100 g added?',
      explain: `From 0 g to 100 g the length goes from ${start} cm to ${start + per} cm: ${per} cm for each 100 g.`,
    };
  }
  if (form === 'length') {
    const mass = pick([400, 500, 600], rng);
    const answer = start + (mass / 100) * per;
    return {
      answerType: 'numeric', answer, visual, hint,
      prompt: `The spring is not stretched past its limit. How long will it be with ${mass} g, in cm?`,
      explain: `It stretches ${per} cm for each 100 g. ${mass} g is ${mass / 100} × 100 g, so it stretches ${(mass / 100) * per} cm: ${start} + ${(mass / 100) * per} = ${answer} cm.`,
    };
  }
  const steps = pick([4, 5, 6], rng);
  const length = start + steps * per;
  return {
    answerType: 'numeric', answer: steps * 100, visual, hint,
    prompt: `What mass will make the spring ${length} cm long, in g?`,
    explain: `It must stretch ${length} − ${start} = ${steps * per} cm. At ${per} cm for each 100 g, that is ${steps} × 100 g = ${steps * 100} g.`,
  };
};

/* ------------------------------------------------------------------ */
/* Electric circuits                                                    */
/* ------------------------------------------------------------------ */

const state = (closed) => (closed ? 'closed' : 'open');

/**
 * - switches: two switches in one loop (series); the bulb lights only if both are closed.
 * - gap: a gap is joined with an object; it lights only if the object conducts electricity.
 * - parallel: a main switch and one switch on each bulb's branch.
 */
const circuit = ({ forms = ['switches', 'gap'] }, rng) => {
  const form = pick(forms, rng);
  const visual = textCard('🔋 ━━ 💡 ━━ 🔘', undefined);
  if (form === 'switches') {
    const p = rng() < 0.5;
    const q = rng() < 0.5;
    const lit = p && q;
    return {
      answerType: 'choice', answer: lit ? YES : NO, choices: [YES, NO],
      prompt: `A battery, a bulb and two switches, P and Q, are joined in one loop (a series circuit). Switch P is ${state(p)} and switch Q is ${state(q)}. Does the bulb light up?`,
      choiceKind: 'sentence', visual,
      hint: 'In one loop, every switch must be closed for electricity to flow.',
      explain: lit ? 'Both switches are closed, so the circuit is complete and the bulb lights up.' : 'An open switch leaves a gap in the loop, so no electricity flows and the bulb stays off.',
    };
  }
  if (form === 'gap') {
    const s = SORT_SETS.electricConductors;
    const conducts = rng() < 0.5;
    const item = pick(s.groups[conducts ? 'conductor' : 'insulator'].items, rng);
    return {
      answerType: 'choice', answer: conducts ? YES : NO, choices: [YES, NO],
      prompt: `A circuit has a battery, a bulb and a gap in the wire. The gap is joined with ${item.name}. Does the bulb light up?`,
      choiceKind: 'sentence', visual: textCard(`🔋 ━━ 💡 ━━ ${item.emoji || '?'}`, undefined),
      hint: 'Electricity can only flow through a conductor, such as a metal.',
      explain: item.why || (conducts ? `${capitalise(item.name)} conducts electricity, so the circuit is complete.` : `${capitalise(item.name)} is an insulator, so no electricity flows.`),
    };
  }
  const main = rng() < 0.7;
  const x = rng() < 0.5;
  const y = rng() < 0.5;
  // Sometimes one bulb has blown: its own branch is broken, but the other branch still works.
  const blown = pick([null, null, 'X', 'Y'], rng);
  const litX = main && x && blown !== 'X';
  const litY = main && y && blown !== 'Y';
  const answer = litX && litY ? 'both X and Y' : litX ? 'only X' : litY ? 'only Y' : 'neither bulb';
  const why = !main ? 'Main switch S is open, so no electricity flows to either branch.'
    : `Switch S is closed. A bulb lights when its own branch switch is closed${blown ? ` and it has not blown (bulb ${blown} has)` : ''}. So ${answer === 'neither bulb' ? 'neither bulb lights' : `${answer} light${answer.startsWith('both') ? '' : 's'} up`}.`;
  return {
    answerType: 'choice', answer, choices: ['both X and Y', 'only X', 'only Y', 'neither bulb'],
    prompt: `In a parallel circuit, bulbs X and Y are on separate branches. Main switch S is ${state(main)}. The switch on X's branch is ${state(x)} and the switch on Y's branch is ${state(y)}.${blown ? ` Bulb ${blown} has blown.` : ''} Which bulbs light up?`,
    choiceKind: 'phrase', visual: textCard('🔋 S → 💡X | 💡Y', undefined),
    hint: 'All electricity passes through the main switch first. Then each bulb needs its own branch switch closed, and a blown bulb breaks only its own branch.',
    explain: why,
  };
};

export const generators = { sciQuiz, sciSort, sciOrder, magnetPoles, foodChain, experiment, stateAtTemp, displacement, springStretch, circuit };

export const methods = {};
