/**
 * All user-facing labels live here, keyed by id, so a Filipino translation
 * can be added later by adding one more dictionary. Content text (lessons and
 * questions) lives in the content packs instead.
 */

const DICTIONARIES = {
  en: {
    appName: 'LearnOffline',
    whoIsLearning: 'Who is learning today?',
    addLearner: 'Add learner',
    editLearner: 'Edit learner',
    name: 'Name',
    grade: 'Grade',
    avatar: 'Pick a buddy',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    back: 'Back',
    start: 'Start',
    next: 'Next',
    check: 'Check',
    hint: 'Hint',
    showModel: 'Draw the model',
    listen: 'Read aloud',
    tryAgain: 'Try again',
    continue: 'Continue',
    done: 'Done',
    lesson: 'Lesson',
    practice: 'Practice',
    dailyMix: 'Daily mix',
    dailyMixHelp: 'A short set picked for you: review plus the skills that need work.',
    stars: 'Stars',
    streak: 'Day streak',
    badges: 'Badges',
    parents: 'Parents',
    settings: 'Settings',
    correct: 'Correct!',
    notQuite: 'Not quite.',
    answerWas: 'The answer is',
    yourAnswer: 'Your answer',
    resultsTitle: 'Set complete!',
    mastered: 'Mastered',
    learning: 'Learning',
    notStarted: 'Not started',
    switchLearner: 'Switch learner',
    offlineReady: 'Ready to use offline.',
    updateReady: 'A new version is ready.',
    reload: 'Reload',
  },
};

let current = 'en';

/** Set the active language; unknown codes fall back to English. */
export const setLanguage = (code) => {
  current = DICTIONARIES[code] ? code : 'en';
  document.documentElement.lang = current;
};

/** Look up a label; returns the key itself when missing so gaps are visible. */
export const t = (key) => DICTIONARIES[current][key] ?? DICTIONARIES.en[key] ?? key;
