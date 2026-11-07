/**
 * Time: reading a clock face, 12- and 24-hour clocks, and how long things take.
 * Generators and techniques together. Times are minutes after midnight.
 *
 * Technique for durations: a timeline with jumps, first to the next
 * o'clock, then whole hours, then the minutes left (Singapore P3/P4).
 * Pure and DOM-free.
 */

import { randInt, pick } from '../../core/random.js';
import { NAMES, ask, askChoice, choicesWith, clock12, clock24, duration, tidy, tidyMethod } from './shared.js';

/** "3:45" (no a.m./p.m.), as read from a clock face. */
const faceTime = (h, m) => `${h}:${String(m).padStart(2, '0')}`;
const hourAfter = (h) => (h % 12) + 1;

/* ------------------------------------------------------------------ */
/* Reading a clock face                                                */
/* ------------------------------------------------------------------ */

/**
 * @param {{step?: number}} spec Minutes between possible times: 60 (o'clock,
 *   Grade 1), 30 (and half past), 15 (quarters) or 5 (Grade 2 and up).
 */
const readClock = ({ step = 5 }, rng) => {
  const h = randInt(1, 12, rng);
  const m = step * randInt(0, 60 / step - 1, rng);
  const answer = faceTime(h, m);
  const swapped = m > 0 && m / 5 !== h ? faceTime(m / 5, (h % 12) * 5) : null; // read the hands the wrong way round
  // Wrong choices use the same kind of times the child is learning (no "3:05" in an o'clock set).
  const near = step < 60 ? [faceTime(h, (m + step) % 60), faceTime(h, (m + 60 - step) % 60)] : [faceTime(h === 12 ? 1 : h + 1, 0)];
  const choices = choicesWith(answer, [
    step <= 5 && swapped, faceTime(hourAfter(h), m), ...near, faceTime(h === 1 ? 12 : h - 1, m), step === 60 && faceTime(((h + 1) % 12) + 1, 0),
  ].filter(Boolean), rng);
  return {
    answerType: 'choice',
    prompt: 'What time does the clock show?',
    answer,
    choices,
    visual: { kind: 'clock', h, m },
    hint: 'The short hand shows the hour. The long hand shows the minutes: count in 5s.',
    method: { kind: 'readClock', h, m, choices },
  };
};

const readClockMethod = ({ h, m, choices }) => {
  const answer = faceTime(h, m);
  const face = { kind: 'clock', h, m };
  const hourText = m === 0
    ? `The short hand is the hour hand. It points at ${h}.`
    : `The short hand is the hour hand. It has gone past ${h} but not yet reached ${hourAfter(h)}, so the hour is ${h}.`;
  const minuteText = m === 0
    ? `The long hand is the minute hand. It points at 12, so it is exactly ${h} o'clock.`
    : `The long hand is the minute hand. It points at ${m / 5}. Count in 5s: ${m / 5} × 5 = ${m} minutes.`;
  return {
    name: 'Hour hand, then minute hand',
    steps: [
      { text: hourText, visual: { ...face, focus: 'hour' } },
      { text: minuteText, visual: { ...face, focus: 'minute' } },
      { text: `So the time is ${answer}.`, visual: face },
    ],
    guided: [
      ask('Which number has the short hand just passed (or is pointing at)?', h, { ...face, focus: 'hour' }),
      ...(m ? [ask(`The long hand points at ${m / 5}. Count in 5s. How many minutes?`, m, { ...face, focus: 'minute' })] : []),
      askChoice('So what time is it?', answer, choices || [answer], face),
    ],
  };
};

/* ------------------------------------------------------------------ */
/* 12-hour and 24-hour clocks                                          */
/* ------------------------------------------------------------------ */

/** @param {{forms?: ('to12'|'to24')[]}} spec */
const clock24h = ({ forms = ['to12', 'to24'] }, rng) => {
  // Hours 1–11 and 13–23 only: midnight and noon are taught in the lesson.
  const hour = rng() < 0.7 ? randInt(13, 23, rng) : randInt(1, 11, rng);
  const t = hour * 60 + 5 * randInt(0, 11, rng);
  const form = pick(forms, rng);
  const pm = hour >= 12;
  if (form === 'to12') {
    const answer = clock12(t);
    const choices = choicesWith(answer, [clock12(t + (pm ? -720 : 720)), clock12(t - 120), clock12(t + 120), clock12(t - 600)], rng);
    return {
      answerType: 'choice',
      prompt: `What is ${clock24(t)} in 12-hour time?`,
      answer,
      choices,
      visual: { kind: 'dayline', mins: t },
      hint: pm ? 'After 12 noon, take 12 away from the hour.' : 'Before 12 noon, the hour is the same.',
      method: { kind: 'clock24h', t, form, choices },
    };
  }
  const answer = clock24(t);
  const choices = choicesWith(answer, [clock24(t + (pm ? -720 : 720)), clock24(t - 120), clock24(t + 120), clock24(t - 60)], rng);
  return {
    answerType: 'choice',
    prompt: `What is ${clock12(t)} in 24-hour time?`,
    answer,
    choices,
    visual: { kind: 'dayline', mins: t },
    hint: pm ? 'For p.m. times, add 12 to the hour.' : 'For a.m. times, keep the hour and write it with 2 digits.',
    method: { kind: 'clock24h', t, form, choices },
  };
};

const clock24hMethod = ({ t, form, choices }) => {
  const hour = Math.floor(t / 60);
  const pm = hour >= 12;
  const h12 = hour % 12 || 12;
  const from = form === 'to12' ? clock24(t) : clock12(t);
  const answer = form === 'to12' ? clock12(t) : clock24(t);
  const line = { kind: 'dayline', mins: t };
  const rule = pm
    ? { text: 'The 24-hour clock keeps counting after 12 noon: 1 p.m. is 13:00, 2 p.m. is 14:00, and so on.', visual: line }
    : { text: 'Before 12 noon (a.m.), the hour is the same on both clocks. The 24-hour clock always writes the hour with 2 digits.', visual: line };
  const work = pm
    ? (form === 'to12'
      ? { text: `It is after noon, so take 12 away from the hour: ${hour} − 12 = ${h12}. It is p.m.`, q: ask(`${hour} − 12 = ?`, h12, line) }
      : { text: `It is p.m., so add 12 to the hour: ${h12} + 12 = ${hour}.`, q: ask(`${h12} + 12 = ?`, hour, line) })
    : (form === 'to12'
      ? { text: `${String(hour).padStart(2, '0')} is before 12, so it is ${hour} in the morning (a.m.).`, q: ask(`What hour is ${String(hour).padStart(2, '0')} on a 12-hour clock?`, hour, line) }
      : { text: `It is a.m., so the hour stays ${hour}. Write it with 2 digits: ${String(hour).padStart(2, '0')}.`, q: ask('What is the hour on the 24-hour clock?', hour, line) });
  return {
    name: '12-hour and 24-hour clocks',
    steps: [rule, { text: work.text, visual: line }, { text: `So ${from} is ${answer}.`, visual: line }],
    guided: [work.q, askChoice(`So ${from} is…`, answer, choices || [answer], line)],
  };
};

/* ------------------------------------------------------------------ */
/* How long? When does it end?                                         */
/* ------------------------------------------------------------------ */

const EVENTS = ['swimming lesson', 'piano lesson', 'football match', 'movie', 'school trip', 'art class', 'science show'];

/** @param {{forms?: ('howLong'|'endTime')[]}} spec */
const timeDuration = ({ forms = ['howLong', 'endTime'] }, rng) => {
  const morning = rng() < 0.5;
  const startHour = morning ? randInt(7, 9, rng) : randInt(13, 15, rng);
  const start = startHour * 60 + 5 * randInt(1, 11, rng);
  const lastEnd = (morning ? 11 : 17) * 60 + 55;
  const length = 5 * randInt(5, Math.min(35, Math.floor((lastEnd - start) / 5)), rng);
  const end = start + length;
  const event = pick(EVENTS, rng);
  const name = pick(NAMES, rng);
  const form = pick(forms, rng);
  if (form === 'endTime') {
    const answer = clock12(end);
    const choices = choicesWith(answer, [clock12(end + 60), clock12(end - 60), clock12(end + 10), clock12(end - 10), clock12(start + (length % 60))], rng);
    return {
      answerType: 'choice',
      prompt: `${name}'s ${event} starts at ${clock12(start)} and lasts ${duration(length)}. What time does it end?`,
      answer,
      choices,
      hint: 'Add the hours first, then count on the minutes to the next o\'clock.',
      method: { kind: 'timeDuration', start, end, form, choices },
    };
  }
  return {
    answerType: 'numeric',
    prompt: tidy(`${name}'s ${event} starts at ${clock12(start)} and ends at ${clock12(end)}. How long is it, in minutes?`),
    answer: length,
    hint: 'Draw a timeline. Jump to the next o\'clock, then whole hours, then the minutes left.',
    explain: `${clock12(start)} to ${clock12(end)} is ${duration(length)} = ${length} minutes`,
    method: { kind: 'timeDuration', start, end, form },
  };
};

/** The jumps from `start` to `end`: to the next o'clock, whole hours, the rest. Never a 0 jump. */
export const timeJumps = (start, end) => {
  const jumps = [];
  let t = start;
  const nextHour = Math.ceil(t / 60) * 60;
  if (t % 60 && nextHour <= end) { jumps.push(nextHour - t); t = nextHour; }
  const hours = Math.floor((end - t) / 60);
  if (hours) { jumps.push(hours * 60); t += hours * 60; }
  if (end > t) jumps.push(end - t);
  return jumps;
};

const timeDurationMethod = ({ start, end, form, choices }) => {
  const length = end - start;
  const hops = (moves) => ({ kind: 'hops', start, moves, format: 'time' });
  if (form === 'endTime') {
    const h = Math.floor(length / 60);
    const m = length % 60;
    const afterHours = start + h * 60;
    const steps = [];
    const guided = [];
    const moves = [];
    if (h) {
      moves.push(h * 60);
      steps.push({ text: `Add the hours first: ${clock12(start)} + ${h} h = ${clock12(afterHours)}.`, visual: hops([...moves]) });
    }
    if (m) {
      const toHour = Math.ceil(afterHours / 60) * 60 - afterHours;
      if (toHour && toHour < m) {
        moves.push(toHour, m - toHour);
        steps.push({ text: `Now add ${m} min. Split it: ${toHour} min takes us to ${clock12(afterHours + toHour)}, and ${m - toHour} min more is ${clock12(end)}.`, visual: hops([...moves]) });
        guided.push(ask(`${m} min = ${toHour} min + ? min`, m - toHour, hops(moves.slice(0, -1))));
      } else {
        moves.push(m);
        steps.push({ text: `Now add ${m} min: ${clock12(afterHours)} + ${m} min = ${clock12(end)}.`, visual: hops([...moves]) });
      }
    }
    steps.unshift({ text: `Start at ${clock12(start)} on a timeline. It lasts ${duration(length)}.`, visual: hops([]) });
    steps.push({ text: `So it ends at ${clock12(end)}.`, visual: hops(moves) });
    guided.push(askChoice('So what time does it end?', clock12(end), choices || [clock12(end)], hops(moves)));
    return { name: 'Timeline: add hours, then minutes', steps, guided };
  }
  const jumps = timeJumps(start, end);
  const steps = [{ text: `Draw a timeline from ${clock12(start)} to ${clock12(end)}. Make friendly jumps.`, visual: hops([]) }];
  const guided = [];
  let t = start;
  jumps.forEach((j, k) => {
    const to = t + j;
    const isHours = j % 60 === 0 && t % 60 === 0;
    steps.push({
      text: isHours
        ? `Jump ${j / 60} h from ${clock12(t)} to ${clock12(to)}. That is ${j} min.`
        : `Jump from ${clock12(t)} to ${clock12(to)}. That is ${j} min.`,
      visual: hops(jumps.slice(0, k + 1)),
    });
    guided.push(ask(`From ${clock12(t)} to ${clock12(to)}: how many minutes?`, j, hops(jumps.slice(0, k))));
    t = to;
  });
  const total = `${length} min${length >= 60 ? ` (${duration(length)})` : ''}`;
  steps.push({ text: jumps.length > 1 ? `Add the jumps: ${jumps.join(' + ')} = ${total}.` : `So it is ${total}.`, visual: hops(jumps) });
  if (jumps.length > 1) guided.push(ask(`${jumps.join(' + ')} = ?`, length, hops(jumps)));
  return { name: 'Timeline jumps', steps, guided };
};

export const generators = { readClock, clock24h, timeDuration };
export const methods = {
  readClock: readClockMethod,
  clock24h: (spec) => tidyMethod(clock24hMethod(spec)),
  timeDuration: (spec) => tidyMethod(timeDurationMethod(spec)),
};
