/**
 * Weekly report, made to be printed (or saved as PDF from the print dialog).
 * Opened from the parent area at #/parent/report/<weeksAgo>/<profileId|all>,
 * so it stays behind the parent PIN. One page per learner.
 */

import { h, toast } from '../../core/dom.js';
import { getMasteryMap, getSessionsBetween, getAttemptsBetween, listProfiles } from '../../data/repo.js';
import { loadPack, subjectsAtLevel } from '../../data/packs.js';
import { weekRange, summariseWeek } from '../../engine/weekReport.js';
import { statusPill } from '../components/common.js';

const WEEK_CHOICES = [[0, 'This week'], [1, 'Last week'], [2, '2 weeks ago'], [3, '3 weeks ago']];
const LOCALE = 'en-PH';

const dateText = (date, opts) => date.toLocaleDateString(LOCALE, opts);
const weekText = (start) => {
  const sunday = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
  return `${dateText(start, { weekday: 'short', day: 'numeric', month: 'short' })} – ${dateText(sunday, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}`;
};
const pctText = (value) => (value === null ? '–' : `${value}%`);

/**
 * Skill names for this learner: the subjects at their grade, plus any pack
 * they answered from this week (a grade changed mid-week). Packs are cached.
 */
const skillNamesFor = async (profile, attempts) => {
  const ids = new Set([(await subjectsAtLevel(profile.packId)).map((p) => p.packId), attempts.map((a) => a.packId)].flat().filter(Boolean));
  ids.add(profile.packId);
  const packs = (await Promise.all([...ids].map((id) => loadPack(id).catch(() => null)))).filter(Boolean);
  const names = new Map();
  for (const p of packs) {
    const subject = p.entry.subjectName || p.pack.title;
    for (const [skillId, skill] of p.skillById) names.set(skillId, { title: skill.title, subject });
  }
  return { names, levelName: packs.find((p) => p.entry.packId === profile.packId)?.entry.levelName || '' };
};

/** Read and sum up one learner's week (three indexed reads, run together). */
const learnerWeek = async (profile, start, end) => {
  const [sessions, attempts, mastery] = await Promise.all([
    getSessionsBetween(profile.profileId, start.getTime(), end.getTime()),
    getAttemptsBetween(profile.profileId, start.getTime(), end.getTime()),
    getMasteryMap(profile.profileId),
  ]);
  const { names, levelName } = await skillNamesFor(profile, attempts);
  const week = summariseWeek({ sessions, attempts, mastery, skillInfo: (id) => names.get(id) || null, goal: profile.goal, start });
  return { profile, levelName, week };
};

/* ------------------------------------------------------------------ */
/* One printed page                                                    */
/* ------------------------------------------------------------------ */

const stat = (value, label) => h('div.stat', null, h('strong', null, value), h('small', null, label));

const summaryLine = ({ totals, strong, weak, goal }, name, thisWeek) => {
  if (!totals.sets) return `${name} did not practise ${thisWeek ? 'this week yet' : 'that week'}.`;
  const parts = [`${name} practised on ${totals.daysPractised} day${totals.daysPractised === 1 ? '' : 's'} and answered ${totals.questions} questions, ${pctText(totals.accuracy)} right.`];
  if (strong) parts.push(`Strongest: ${strong.title} (${strong.accuracy}%).`);
  if (weak) parts.push(`Needs help: ${weak.title} (${weak.accuracy}%).`);
  if (goal) parts.push(goal.done ? 'Weekly goal reached! 🎉' : `Goal: ${goal.daysMet} of ${goal.daysPerWeek} days.`);
  return parts.join(' ');
};

const daysTable = (days, totals, goal) => h('table.data-table.report-table', null,
  h('thead', null, h('tr', null, h('th', null, 'Day'), h('th', null, 'Sets'), h('th', null, 'Questions'), h('th', null, 'Right'), h('th', null, 'Minutes'),
    goal && h('th', null, 'Goal'))),
  h('tbody', null, days.map((d) => h(`tr${d.sets ? '' : '.is-empty'}`, null,
    h('td', null, `${d.label} ${d.date.getDate()}`),
    h('td', null, d.future ? '' : d.sets),
    h('td', null, d.future ? '' : d.questions),
    h('td', null, d.future ? '' : pctText(d.accuracy)),
    h('td', null, d.future ? '' : d.minutes),
    goal && h('td', null, d.future ? '' : d.met ? '✓' : '–')))),
  h('tfoot', null, h('tr', null,
    h('th', null, 'Week'), h('th', null, totals.sets), h('th', null, totals.questions), h('th', null, pctText(totals.accuracy)), h('th', null, totals.minutes),
    goal && h('th', null, `${goal.daysMet}/${goal.daysPerWeek}`))));

const skillsTable = (skills) => h('table.data-table.report-table', null,
  h('thead', null, h('tr', null, h('th', null, 'Skill'), h('th', null, 'Questions'), h('th', null, 'Right'), h('th', null, 'Now'))),
  h('tbody', null, skills.map((s) => h('tr', null,
    h('td', null, s.subject && h('small.muted.report-subject', null, s.subject), s.title),
    h('td', null, s.questions),
    h('td', null, pctText(s.accuracy)),
    h('td', null, statusPill(s.status))))));

const wrongList = (wrong) => h('ol.report-wrong', null, wrong.map((w) => h('li', null,
  h('span.report-prompt', null, w.prompt),
  h('small.muted', null, `${w.title ? `${w.title} · ` : ''}answered “${w.given || '(blank)'}”`))));

const learnerPage = ({ profile, levelName, week }, start, thisWeek) => h('article.report-page', null,
  h('header.report-page-head', null,
    h('span.avatar.avatar-md', { 'aria-hidden': 'true' }, profile.avatar),
    h('div', null,
      h('h2', null, `${profile.name}’s week`),
      h('p.muted', null, `${levelName ? `${levelName} · ` : ''}${weekText(start)}`)),
    h('span.report-brand', { 'aria-hidden': 'true' }, 'LearnOffline')),
  h('p.report-summary', null, summaryLine(week, profile.name, thisWeek)),
  h('div.stat-row', null,
    stat(`${week.totals.daysPractised}/7`, 'Days practised'),
    stat(week.totals.sets, 'Sets'),
    stat(week.totals.questions, 'Questions'),
    stat(pctText(week.totals.accuracy), 'Right'),
    stat(week.totals.minutes, 'Minutes')),
  h('h3', null, 'Day by day'),
  daysTable(week.days, week.totals, week.goal),
  week.skills.length > 0 && [h('h3', null, 'Skills practised'), skillsTable(week.skills)],
  week.wrong.length > 0 && [
    h('h3', null, 'Go over these together'),
    h('p.muted.small', null, 'Questions answered wrongly this week, newest first. Ask your child to explain how to solve each one.'),
    wrongList(week.wrong)],
  h('div.report-notes', null,
    h('h3', null, 'Notes'),
    h('div.report-lines', { 'aria-hidden': 'true' }, h('span'), h('span'), h('span')),
    h('p.report-sign', null, 'Parent: ______________________   Learner: ______________________')),
  h('footer.report-foot.muted', null, `Printed ${dateText(new Date(), { day: 'numeric', month: 'long', year: 'numeric' })}`));

/* ------------------------------------------------------------------ */
/* Screen                                                              */
/* ------------------------------------------------------------------ */

/**
 * @param {HTMLElement} view
 * @param {string} [weeksParam] '0' this week, '1' last week…
 * @param {string} [who] A profileId, or 'all'.
 */
export const renderWeeklyReport = async (view, weeksParam = '0', who = 'all') => {
  const weeksAgo = Math.min(Math.max(Number.parseInt(weeksParam, 10) || 0, 0), 52);
  const { start, end } = weekRange(weeksAgo);
  const profiles = await listProfiles();
  const chosen = who === 'all' ? profiles : profiles.filter((p) => p.profileId === who);
  const link = (w, p) => `#/parent/report/${w}/${encodeURIComponent(p)}`;

  const weekSelect = h('select', { 'aria-label': 'Week', onchange: (e) => { window.location.hash = link(e.target.value, who); } },
    WEEK_CHOICES.map(([w, label]) => h('option', { value: w, selected: w === weeksAgo }, label)));
  const whoSelect = h('select', { 'aria-label': 'Learner', onchange: (e) => { window.location.hash = link(weeksAgo, e.target.value); } },
    h('option', { value: 'all', selected: who === 'all' }, 'All learners'),
    profiles.map((p) => h('option', { value: p.profileId, selected: p.profileId === who }, p.name)));

  view.classList.add('report-screen');
  view.append(h('header.learner-bar.no-print', null,
    h('a.icon-btn', { href: '#/parent', 'aria-label': 'Back to Parents' }, '←'),
    h('strong', null, 'Weekly report')));
  view.append(h('div.report-controls.no-print', null,
    weekSelect, whoSelect,
    h('button.btn.btn-primary', {
      type: 'button',
      disabled: !chosen.length,
      onclick: () => {
        try { window.print(); } catch { toast('Printing is not available here. Use the browser menu → Print.', 'error'); }
      },
    }, '🖨 Print or save PDF')));
  view.append(h('p.muted.small.no-print', null, 'Tip: on a phone, choose Print, then "Save as PDF" to share it.'));

  if (!chosen.length) {
    view.append(h('p.muted', null, profiles.length ? 'That learner is no longer on this device.' : 'No learners yet.'));
    return;
  }
  const weeks = await Promise.all(chosen.map((p) => learnerWeek(p, start, end)));
  view.append(...weeks.map((w) => learnerPage(w, start, weeksAgo === 0)));
};
