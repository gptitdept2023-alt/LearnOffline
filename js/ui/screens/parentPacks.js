/**
 * Parents → "Your own questions": import a question pack made in the
 * LearnOffline Google Sheet, see the packs on this device, and remove one.
 * Kept apart from parent.js so the parent screen stays a list of panels.
 */

import { h, confirmDialog, toast, withLoading } from '../../core/dom.js';
import { render } from '../../core/router.js';
import { getState, activateProfile } from '../../core/state.js';
import { loadBuiltInIndex, resetPackCaches } from '../../data/packs.js';
import {
  LIMITS, normalizeCustomPack, hasCustomPack, saveCustomPack, listCustomPackEntries, removeCustomPack,
} from '../../data/customPacks.js';

const SHEET_GUIDE_URL = 'https://github.com/gptitdept2023-alt/LearnOffline/tree/main/tools/sheets';

/** Read and parse the chosen file, with messages a parent understands. */
const readPackFile = async (file) => {
  if (file.size > LIMITS.fileBytes) throw new Error('That file is too large to be a question pack (over 5 MB).');
  try {
    return JSON.parse(await file.text());
  } catch {
    throw new Error('This file could not be read. Choose the .json file the sheet made.');
  }
};

/** Grade -> grade name, from the packs that ship with the app. */
const builtInLevels = async () => {
  const index = await loadBuiltInIndex();
  const levels = new Map();
  for (const p of index) if (!levels.has(p.level)) levels.set(p.level, p.levelName || p.title);
  return { index, levels };
};

/** After a pack changes, drop cached copies and reload the active learner's pack. */
const refreshAfterChange = async (packId) => {
  resetPackCaches(packId);
  const { profile } = getState();
  if (profile) await activateProfile(profile.profileId).catch(() => {});
};

const plural = (n, word) => `${n.toLocaleString()} ${word}${n === 1 ? '' : 's'}`;

/** Import a pack file: check it, confirm a replace, save, and show what was added. */
const importPack = async (file, showProblems) => {
  showProblems('');
  try {
    const raw = await readPackFile(file);
    const { levels } = await builtInLevels();
    const result = normalizeCustomPack(raw, { levels });
    const { entry, questionCount } = result;
    const skills = result.pack.topics.reduce((n, t) => n + t.skills.length, 0);
    if (await hasCustomPack(entry.packId)) {
      const ok = await confirmDialog({
        title: 'Replace this pack?',
        message: `"${entry.title}" is already on this device. Importing replaces its questions with the ones in this file. Progress stays for skills that are still in the sheet.`,
        confirmText: 'Replace',
      });
      if (!ok) return;
    }
    await withLoading(() => saveCustomPack(result), 'Saving questions…');
    await refreshAfterChange(entry.packId);
    toast(`Added "${entry.title}" for ${entry.levelName}: ${plural(skills, 'skill')}, ${plural(questionCount, 'question')}.`, 'success');
    render();
  } catch (error) {
    // Pack problems can be a list, so they are shown in the panel, not in a toast.
    showProblems(error.message || String(error));
  }
};

/** Remove a pack after a confirm. Learners on it move to the grade's first built-in subject. */
const removePack = async (entry) => {
  const { index } = await builtInLevels();
  const fallback = index.find((p) => p.level === entry.level);
  const ok = await confirmDialog({
    title: `Remove "${entry.title}"?`,
    message: `Its ${plural(entry.questionCount || 0, 'question')} will be removed from this device. Learners using it go back to ${fallback ? fallback.subjectName || fallback.title : 'their grade'}. Their past answers stay in the reports. To get it back, import the file again.`,
    confirmText: 'Remove',
    danger: true,
  });
  if (!ok) return;
  try {
    const moved = await withLoading(() => removeCustomPack(entry.packId, fallback?.packId), 'Removing…');
    await refreshAfterChange(entry.packId);
    toast(`Removed "${entry.title}".${moved ? ` ${plural(moved, 'learner')} moved to ${fallback.subjectName || fallback.title}.` : ''}`, 'success');
    render();
  } catch (error) {
    toast(`Could not remove it: ${error.message}`, 'error');
  }
};

const packRow = (entry) => h('li.custom-pack', null,
  h('span.custom-pack-icon', { 'aria-hidden': 'true' }, entry.icon),
  h('span.custom-pack-text', null,
    h('strong', null, entry.title),
    h('span.muted', null, `${entry.levelName} · ${entry.subjectName} · ${plural(entry.questionCount || 0, 'question')}`)),
  h('button.btn.btn-ghost.btn-sm', { type: 'button', 'aria-label': `Remove ${entry.title}`, onclick: () => removePack(entry) }, 'Remove'));

/** The panel. Imported packs show as their own subject tab for learners in that grade. */
export const customPacksPanel = async () => {
  const entries = await listCustomPackEntries().catch(() => []);
  const problems = h('p.form-error.pack-problems', { role: 'alert', hidden: true });
  const showProblems = (text) => { problems.textContent = text; problems.hidden = !text; };
  const fileInput = h('input', { type: 'file', accept: 'application/json,.json', hidden: true });
  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    fileInput.value = '';
    if (file) importPack(file, showProblems);
  });

  return h('section.panel', null,
    h('h2', null, '📝 Your own questions'),
    h('p.muted', null, 'Write questions in Google Sheets, then add them here. They show as a new subject for learners in that grade and work offline.'),
    h('ol.how-to', null,
      h('li', null, 'Open the LearnOffline sheet and choose LearnOffline → Set up sheet (first time only).'),
      h('li', null, 'Type your questions, then choose LearnOffline → Make pack file and download it.'),
      h('li', null, 'Tap Import pack below and choose the file. Do this on each device.')),
    h('p.muted.small', null, h('a', { href: SHEET_GUIDE_URL, target: '_blank', rel: 'noopener' }, 'Full guide and the sheet script (needs internet)')),
    entries.length ? h('ul.custom-pack-list', null, entries.map(packRow)) : h('p.muted', null, 'No packs added yet.'),
    problems,
    h('div.button-row', null,
      h('button.btn.btn-primary', { type: 'button', onclick: () => fileInput.click() }, '⬆ Import pack'),
      fileInput));
};
