/**
 * LearnOffline question packs: write your own questions in this Google Sheet
 * and turn them into a pack file that the app imports (Parents → Your own
 * questions → Import pack).
 *
 * Install: Extensions → Apps Script, paste this whole file, save, then reload
 * the sheet. A "LearnOffline" menu appears. Full guide: tools/sheets/README.md.
 *
 * Tabs made by "Set up sheet":
 *   Pack       one setting per row (pack name, subject tab name, grade, icon, pack ID)
 *   Questions  Topic | Skill | Type | Question | Answer | Wrong choice 1–3 | Hint | Explanation | Check
 *   Lessons    Topic | Skill | Lesson step   (optional; one step per row, in order)
 *
 * Speed: each tab is read with one getDisplayValues() call and the Check
 * column is written with one setValues() and one setBackgrounds() call, so a
 * sheet with thousands of questions is checked in a few seconds. Display
 * values are used so a fraction like 3/4 or a number like 1,000 is read
 * exactly as the parent sees it, never as a date or a rounded number.
 *
 * The pure part (buildPack_ and helpers) does not touch the spreadsheet, so
 * tests/sheets.test.mjs runs it in Node and feeds the result to the app's own
 * pack checker.
 */

/* ------------------------------------------------------------------ */
/* Settings                                                            */
/* ------------------------------------------------------------------ */

var PACK_FORMAT = 'learnoffline-pack';
var PACK_FORMAT_VERSION = 1;

var TAB = { pack: 'Pack', questions: 'Questions', lessons: 'Lessons' };

/** Grades in the app: the name a parent picks -> the app's grade code. */
var GRADES = [
  ['Kinder 2', 'K2'], ['Grade 1', 'G1'], ['Grade 2', 'G2'], ['Grade 3', 'G3'],
  ['Grade 4', 'G4'], ['Grade 5', 'G5'], ['Grade 6', 'G6'],
];

/** Question types a parent picks -> the app's type. */
var TYPES = [
  ['Number', 'numeric'], ['Multiple choice', 'multiple-choice'], ['Fraction', 'fraction'], ['True or false', 'true-false'],
];

var QUESTION_HEADERS = ['Topic', 'Skill', 'Type', 'Question', 'Answer', 'Wrong choice 1', 'Wrong choice 2', 'Wrong choice 3', 'Hint', 'Explanation', 'Check'];
var COL = { topic: 0, skill: 1, type: 2, question: 3, answer: 4, wrong1: 5, wrong3: 7, hint: 8, explain: 9, check: 10 };
var LESSON_HEADERS = ['Topic', 'Skill', 'Lesson step'];
var PACK_LABELS = { title: 'Pack name', subject: 'Subject tab name', grade: 'Grade', icon: 'Icon', packId: 'Pack ID (do not change)' };

/** The same limits the app checks (js/data/customPacks.js LIMITS). */
var LIMITS = { text: 400, title: 60, subject: 24, choice: 80, questionsPerSkill: 300, questions: 5000, skillsPerTopic: 50, topics: 50, stepsPerLesson: 20 };

var OK_MARK = '✓ OK';
var COLOR_OK = '#e6f4ea';
var COLOR_BAD = '#fce8e6';

/* ------------------------------------------------------------------ */
/* Menu                                                                */
/* ------------------------------------------------------------------ */

function onOpen() {
  SpreadsheetApp.getUi().createMenu('LearnOffline')
    .addItem('Set up sheet', 'setUpSheet')
    .addItem('Check questions', 'checkQuestions')
    .addSeparator()
    .addItem('Make pack file', 'makePackFile')
    .addToUi();
}

/* ------------------------------------------------------------------ */
/* Set up                                                              */
/* ------------------------------------------------------------------ */

/** Make the three tabs with headers, dropdowns and an example. Tabs that already exist are left alone. */
function setUpSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var made = [];

  if (!ss.getSheetByName(TAB.pack)) {
    var pack = ss.insertSheet(TAB.pack);
    pack.getRange(1, 1, 6, 2).setValues([
      ['Setting', 'Value'],
      [PACK_LABELS.title, 'My own questions'],
      [PACK_LABELS.subject, 'Extra'],
      [PACK_LABELS.grade, 'Grade 4'],
      [PACK_LABELS.icon, '📝'],
      [PACK_LABELS.packId, newPackId_('My own questions')],
    ]);
    pack.getRange('B4').setDataValidation(SpreadsheetApp.newDataValidation()
      .requireValueInList(GRADES.map(function (g) { return g[0]; }), true).setAllowInvalid(false).build());
    pack.getRange('A6:B6').setFontColor('#777777');
    pack.getRange('A1:B1').setFontWeight('bold');
    pack.setColumnWidth(1, 220);
    pack.setColumnWidth(2, 320);
    made.push(TAB.pack);
  }

  if (!ss.getSheetByName(TAB.questions)) {
    var q = ss.insertSheet(TAB.questions);
    q.getRange(1, 1, 1, QUESTION_HEADERS.length).setValues([QUESTION_HEADERS]).setFontWeight('bold');
    q.setFrozenRows(1);
    // Plain text, so 3/4 stays a fraction and is never turned into a date.
    q.getRange('A2:J').setNumberFormat('@');
    q.getRange('C2:C').setDataValidation(SpreadsheetApp.newDataValidation()
      .requireValueInList(TYPES.map(function (t) { return t[0]; }), true).setAllowInvalid(false).build());
    q.getRange(2, 1, 4, 10).setValues([
      ['Money', 'Adding pesos', 'Number', 'Ana has ₱25. She gets ₱40 more. How much does she have now?', '65', '', '', '', 'Add 25 and 40.', '25 + 40 = 65'],
      ['Money', 'Adding pesos', 'Multiple choice', 'Which coins make ₱15?', '₱10 and ₱5', '₱10 and ₱1', '₱5 and ₱5', '₱20', '', ''],
      ['Fractions', 'Half and quarter', 'Fraction', 'What fraction of a pizza is 2 slices out of 8?', '1/4', '', '', '', 'Simplify 2/8.', '2/8 = 1/4'],
      ['Fractions', 'Half and quarter', 'True or false', '1/2 is bigger than 1/4.', 'True', '', '', '', '', ''],
    ]);
    q.setColumnWidth(4, 360);
    q.setColumnWidth(11, 260);
    made.push(TAB.questions);
  }

  if (!ss.getSheetByName(TAB.lessons)) {
    var l = ss.insertSheet(TAB.lessons);
    l.getRange(1, 1, 1, 3).setValues([LESSON_HEADERS]).setFontWeight('bold');
    l.setFrozenRows(1);
    l.getRange('A2:C').setNumberFormat('@');
    l.getRange(2, 1, 2, 3).setValues([
      ['Money', 'Adding pesos', 'To find how much money in all, add the amounts.'],
      ['Money', 'Adding pesos', 'Line up the ones and the tens, then add the ones first.'],
    ]);
    l.setColumnWidth(3, 480);
    made.push(TAB.lessons);
  }

  SpreadsheetApp.getUi().alert(made.length
    ? 'Made the tabs: ' + made.join(', ') + '.\n\nReplace the examples with your own questions, then choose LearnOffline → Make pack file.'
    : 'The sheet is already set up.');
}

/* ------------------------------------------------------------------ */
/* Check and make                                                      */
/* ------------------------------------------------------------------ */

/** Read all three tabs, one call each. */
function readSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var tabs = {};
  [TAB.pack, TAB.questions, TAB.lessons].forEach(function (name) {
    var sheet = ss.getSheetByName(name);
    tabs[name] = sheet;
  });
  if (!tabs[TAB.pack] || !tabs[TAB.questions]) throw new Error('Choose LearnOffline → Set up sheet first.');
  var questionSheet = tabs[TAB.questions];
  var lastQ = questionSheet.getLastRow();
  var lessonSheet = tabs[TAB.lessons];
  var lastL = lessonSheet ? lessonSheet.getLastRow() : 1;
  return {
    questionSheet: questionSheet,
    packRows: tabs[TAB.pack].getDataRange().getDisplayValues(),
    questionRows: lastQ > 1 ? questionSheet.getRange(2, 1, lastQ - 1, COL.explain + 1).getDisplayValues() : [],
    lessonRows: lastL > 1 ? lessonSheet.getRange(2, 1, lastL - 1, 3).getDisplayValues() : [],
  };
}

/** Write the Check column: one write for the text and one for the colours. */
function writeChecks_(sheet, rows, rowProblems) {
  if (!rows.length) return;
  var text = [];
  var colours = [];
  rows.forEach(function (row, i) {
    var list = rowProblems[i];
    var blank = isBlankRow_(row);
    text.push([list ? list.join(' ') : blank ? '' : OK_MARK]);
    colours.push([list ? COLOR_BAD : blank ? null : COLOR_OK]);
  });
  var range = sheet.getRange(2, COL.check + 1, rows.length, 1);
  range.setValues(text);
  range.setBackgrounds(colours);
}

/** Check every row and mark the Check column. Returns the build result. */
function runCheck_() {
  var data = readSheet_();
  var result = buildPack_(data.packRows, data.questionRows, data.lessonRows);
  writeChecks_(data.questionSheet, data.questionRows, result.rowProblems);
  return result;
}

function checkQuestions() {
  var result = runCheck_();
  SpreadsheetApp.getUi().alert(result.problems.length
    ? 'Some things need fixing:\n\n• ' + result.problems.slice(0, 10).join('\n• ') + (result.problems.length > 10 ? '\n…and ' + (result.problems.length - 10) + ' more. See the Check column.' : '')
    : 'All ' + result.questionCount + ' questions look good.');
}

/** Check, then show a dialog to download the pack file or save it to Drive. */
function makePackFile() {
  var result = runCheck_();
  var ui = SpreadsheetApp.getUi();
  if (result.problems.length) {
    ui.alert('Fix these first, then try again:\n\n• ' + result.problems.slice(0, 10).join('\n• ') + (result.problems.length > 10 ? '\n…and more. See the Check column.' : ''));
    return;
  }
  var template = HtmlService.createTemplate(DOWNLOAD_DIALOG_HTML_);
  var fileName = fileNameFor_(result.pack.title);
  template.fileName = fileName;
  // Script literals, with "<" escaped so text in a question can never close the <script> tag.
  template.jsonLiteral = scriptLiteral_(JSON.stringify(result.pack));
  template.nameLiteral = scriptLiteral_(fileName);
  template.summary = result.skillCount + ' skills, ' + result.questionCount + ' questions';
  ui.showModalDialog(template.evaluate().setWidth(420).setHeight(260), 'Pack file ready');
}

/** Called from the dialog: save the file to Drive and return a link (works when downloads are blocked). */
function savePackToDrive(json, fileName) {
  var file = DriveApp.createFile(fileName, json, 'application/json');
  return file.getUrl();
}

var DOWNLOAD_DIALOG_HTML_ = [
  '<!doctype html><html><head><style>',
  'body{font-family:Arial,sans-serif;font-size:14px;margin:0;padding:4px 8px;color:#222}',
  'button,a.btn{display:inline-block;padding:9px 14px;border-radius:8px;border:1px solid #1a73e8;font-size:14px;cursor:pointer;text-decoration:none;margin:4px 6px 4px 0}',
  '.primary{background:#1a73e8;color:#fff}.secondary{background:#fff;color:#1a73e8}#status{margin-top:10px;color:#555}',
  '</style></head><body>',
  '<p><b><?= fileName ?></b><br><?= summary ?></p>',
  '<p>Download it, then in the app open Parents → Your own questions → Import pack.</p>',
  '<a class="btn primary" id="dl" download="<?= fileName ?>">Download</a>',
  '<button class="secondary" id="drive">Save to Google Drive</button>',
  '<div id="status"></div>',
  '<script>',
  'var json = <?!= jsonLiteral ?>;',
  'var name = <?!= nameLiteral ?>;',
  'document.getElementById("dl").href = URL.createObjectURL(new Blob([json], {type: "application/json"}));',
  'document.getElementById("drive").onclick = function () {',
  '  var status = document.getElementById("status");',
  '  status.textContent = "Saving…";',
  '  google.script.run.withSuccessHandler(function (url) {',
  '    status.innerHTML = "Saved. <a target=\\"_blank\\" href=\\"" + url + "\\">Open in Drive</a>. On the phone, download it from the Drive app.";',
  '  }).withFailureHandler(function (e) { status.textContent = "Could not save: " + e.message; }).savePackToDrive(json, name);',
  '};',
  '</script></body></html>',
].join('\n');

/* ------------------------------------------------------------------ */
/* Pure helpers (no spreadsheet calls; tested in Node)                 */
/* ------------------------------------------------------------------ */

/** Lower-case words joined by "-", or a short code from the text when it has no a–z letters. */
function slug_(text) {
  var s = String(text).toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 24).replace(/-+$/, '');
  if (s) return s;
  var hash = 0;
  for (var i = 0; i < text.length; i += 1) hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  return 'x' + hash.toString(36);
}

/** A new pack ID, made once at set-up: custom-<name>-<4 random letters>. */
function newPackId_(title) {
  var chars = 'abcdefghijkmnpqrstuvwxyz23456789';
  var rand = '';
  for (var i = 0; i < 4; i += 1) rand += chars.charAt(Math.floor(Math.random() * chars.length));
  return 'custom-' + slug_(title || 'pack').slice(0, 20).replace(/-+$/, '') + '-' + rand;
}

function scriptLiteral_(text) {
  return JSON.stringify(String(text)).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
}

function fileNameFor_(title) {
  return 'learnoffline-' + slug_(title || 'pack') + '.json';
}

/** Same rules as the app: a number with optional commas, ₱ and %. */
function isNumber_(text) {
  var cleaned = String(text).trim().replace(/[,\s]/g, '').replace(/^[₱$]/, '').replace(/%$/, '').replace(/^−/, '-');
  return /^-?(\d+(\.\d*)?|\.\d+)$/.test(cleaned);
}

/** 3/4, 1 1/2 or a whole number, with a bottom number that is not 0. */
function isFraction_(text) {
  var m = /^\s*(?:(\d+)\s+)?(-?\d+)\s*(?:\/\s*(\d+))?\s*$/.exec(String(text));
  return Boolean(m) && !(m[3] !== undefined && Number(m[3]) === 0) && !(m[1] && m[3] === undefined);
}

/** A question row with nothing typed in it (the Check column is not counted). */
function isBlankRow_(row) {
  return row.slice(0, COL.explain + 1).every(function (v) { return String(v).trim() === ''; });
}

/** Pack tab rows -> { setting label: value }. */
function packSettings_(packRows) {
  var out = {};
  packRows.forEach(function (row) { out[String(row[0]).trim()] = String(row[1] === undefined ? '' : row[1]).trim(); });
  return out;
}

/**
 * Turn the three tabs' rows into a pack file.
 * @param {string[][]} packRows Pack tab, including its header row.
 * @param {string[][]} questionRows Questions tab without its header row.
 * @param {string[][]} lessonRows Lessons tab without its header row.
 * @return {{pack: Object, problems: string[], rowProblems: Object<number, string[]>, questionCount: number, skillCount: number}}
 *   rowProblems is keyed by the 0-based question row (sheet row = index + 2).
 */
function buildPack_(packRows, questionRows, lessonRows) {
  var problems = [];
  var rowProblems = {};
  var flag = function (i, text) {
    (rowProblems[i] = rowProblems[i] || []).push(text);
    problems.push('Row ' + (i + 2) + ': ' + text);
  };
  var settings = packSettings_(packRows);
  var title = settings[PACK_LABELS.title] || '';
  var subjectName = settings[PACK_LABELS.subject] || '';
  var gradeName = settings[PACK_LABELS.grade] || '';
  var packId = settings[PACK_LABELS.packId] || '';
  var grade = GRADES.filter(function (g) { return g[0] === gradeName || g[1] === gradeName; })[0];
  if (!title) problems.push('Pack tab: the pack name is empty.');
  if (title.length > LIMITS.title) problems.push('Pack tab: the pack name is longer than ' + LIMITS.title + ' letters.');
  if (!subjectName) problems.push('Pack tab: the subject tab name is empty.');
  if (subjectName.length > LIMITS.subject) problems.push('Pack tab: the subject tab name is longer than ' + LIMITS.subject + ' letters.');
  if (!grade) problems.push('Pack tab: choose a grade from the list.');
  if (!/^custom-[a-z0-9-]{1,48}$/.test(packId)) problems.push('Pack tab: the pack ID was changed. Delete the Pack tab and choose Set up sheet again.');

  var topics = [];
  var topicByName = {};
  var questionCount = 0;
  var skillCount = 0;
  var typeOf = {};
  TYPES.forEach(function (t) { typeOf[t[0].toLowerCase()] = t[1]; typeOf[t[1]] = t[1]; });

  /** Find or add a topic and skill by their names (rows can be in any order). */
  var skillFor = function (topicName, skillName) {
    var topic = topicByName[topicName];
    if (!topic) {
      topic = { topicId: packId + '-' + slug_(topicName), title: topicName, skills: [], byName: {} };
      topicByName[topicName] = topic;
      topics.push(topic);
    }
    var skill = topic.byName[skillName];
    if (!skill) {
      skill = { skillId: topic.topicId + '-' + slug_(skillName), title: skillName, questions: [], steps: [] };
      topic.byName[skillName] = skill;
      topic.skills.push(skill);
      skillCount += 1;
    }
    return skill;
  };

  questionRows.forEach(function (row, i) {
    var cell = function (c) { return String(row[c] === undefined ? '' : row[c]).trim(); };
    if (isBlankRow_(row)) return;
    var topicName = cell(COL.topic);
    var skillName = cell(COL.skill);
    var type = typeOf[cell(COL.type).toLowerCase()];
    var prompt = cell(COL.question);
    var answer = cell(COL.answer);
    var before = (rowProblems[i] || []).length;
    if (!topicName) flag(i, 'Topic is empty.');
    if (!skillName) flag(i, 'Skill is empty.');
    if (topicName.length > LIMITS.title || skillName.length > LIMITS.title) flag(i, 'Topic and skill names can have up to ' + LIMITS.title + ' letters.');
    if (!type) flag(i, 'Choose a type from the list.');
    if (!prompt) flag(i, 'Question is empty.');
    if (prompt.length > LIMITS.text) flag(i, 'Question is longer than ' + LIMITS.text + ' letters.');
    if (!answer) flag(i, 'Answer is empty.');
    var question = { type: type, prompt: prompt, answer: answer };
    if (type === 'numeric' && answer && !isNumber_(answer)) flag(i, 'Answer must be a number, like 65 or 2.5.');
    if (type === 'fraction' && answer && !isFraction_(answer)) flag(i, 'Answer must be a fraction, like 3/4 or 1 1/2.');
    if (type === 'true-false') {
      question.answer = answer.toLowerCase();
      if (answer && question.answer !== 'true' && question.answer !== 'false') flag(i, 'Answer must be True or False.');
    }
    if (type === 'multiple-choice') {
      var wrong = row.slice(COL.wrong1, COL.wrong3 + 1).map(function (v) { return String(v).trim(); }).filter(Boolean);
      var choices = [answer].concat(wrong);
      if (!wrong.length) flag(i, 'Add at least one wrong choice.');
      if (wrong.indexOf(answer) !== -1 || choices.filter(function (c, k) { return choices.indexOf(c) !== k; }).length) flag(i, 'Each choice must be different.');
      if (choices.some(function (c) { return c.length > LIMITS.choice; })) flag(i, 'Choices can have up to ' + LIMITS.choice + ' letters.');
      question.choices = choices;
    }
    var hint = cell(COL.hint);
    var explain = cell(COL.explain);
    if (hint.length > LIMITS.text || explain.length > LIMITS.text) flag(i, 'Hint and explanation can have up to ' + LIMITS.text + ' letters.');
    if (hint) question.hint = hint;
    if (explain) question.explain = explain;
    if ((rowProblems[i] || []).length > before || !topicName || !skillName) return;
    var skill = skillFor(topicName, skillName);
    if (skill.questions.length >= LIMITS.questionsPerSkill) { flag(i, 'Skill "' + skillName + '" has more than ' + LIMITS.questionsPerSkill + ' questions.'); return; }
    skill.questions.push(question);
    questionCount += 1;
  });

  lessonRows.forEach(function (row, i) {
    var topicName = String(row[0] || '').trim();
    var skillName = String(row[1] || '').trim();
    var text = String(row[2] || '').trim();
    if (!topicName && !skillName && !text) return;
    var where = 'Lessons row ' + (i + 2) + ': ';
    var topic = topicByName[topicName];
    var skill = topic && topic.byName[skillName];
    if (!skill) { problems.push(where + 'no questions use the topic "' + topicName + '" and skill "' + skillName + '". Check the spelling.'); return; }
    if (!text) { problems.push(where + 'the lesson step is empty.'); return; }
    if (text.length > LIMITS.text) { problems.push(where + 'the lesson step is longer than ' + LIMITS.text + ' letters.'); return; }
    if (skill.steps.length >= LIMITS.stepsPerLesson) { problems.push(where + 'a lesson can have up to ' + LIMITS.stepsPerLesson + ' steps.'); return; }
    skill.steps.push({ text: text });
  });

  if (!questionCount && !problems.length) problems.push('Questions tab: add at least one question.');
  if (questionCount > LIMITS.questions) problems.push('A pack can have up to ' + LIMITS.questions + ' questions. Split it into two sheets.');
  if (topics.length > LIMITS.topics) problems.push('A pack can have up to ' + LIMITS.topics + ' topics.');
  var topicIds = {};
  var skillIds = {};
  topics.forEach(function (t) {
    if (t.skills.length > LIMITS.skillsPerTopic) problems.push('Topic "' + t.title + '" has more than ' + LIMITS.skillsPerTopic + ' skills.');
    // Names that differ only in spaces or marks ("Money!" and "Money") would get the same ID.
    if (topicIds[t.topicId]) problems.push('The topics "' + topicIds[t.topicId] + '" and "' + t.title + '" are too alike. Rename one.');
    topicIds[t.topicId] = t.title;
    t.skills.forEach(function (s) {
      if (skillIds[s.skillId]) problems.push('The skills "' + skillIds[s.skillId] + '" and "' + s.title + '" in "' + t.title + '" are too alike. Rename one.');
      skillIds[s.skillId] = s.title;
    });
  });

  var pack = {
    format: PACK_FORMAT,
    version: PACK_FORMAT_VERSION,
    packId: packId,
    title: title,
    subjectName: subjectName,
    icon: settings[PACK_LABELS.icon] || '📝',
    level: grade ? grade[1] : '',
    topics: topics.map(function (t) {
      return {
        topicId: t.topicId,
        title: t.title,
        skills: t.skills.map(function (s) {
          var out = { skillId: s.skillId, title: s.title, questions: s.questions };
          if (s.steps.length) out.lesson = { steps: s.steps };
          return out;
        }),
      };
    }),
  };
  return { pack: pack, problems: problems, rowProblems: rowProblems, questionCount: questionCount, skillCount: skillCount };
}
