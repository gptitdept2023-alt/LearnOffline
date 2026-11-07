# LearnOffline

An offline-first learning app for kids, in the style of practice platforms:
short lessons, auto-graded practice, stars and badges, and a parent
dashboard. It installs from the browser and then runs with no internet on a
PC or an Android phone.

Math covers **Kinder 2** (picture-based, read aloud) and **Grades 1 to 4**, taught the Singapore way: Concrete → Pictorial → Abstract
lessons and bar models for word problems. Grade 4 covers whole numbers,
factors, multiplication and division, fractions, decimals, length, mass and
volume, money, time (clock, 24-hour clock, durations), angles, perimeter and
area, symmetry, tables and bar graphs, and word problems. All lessons and questions are
original.

**English for Kinder 2** sits next to Math: a learner switches subject with
the Math / English tabs on their home screen (the grade is set in the parent
area). It covers big and small letters, ABC order, first sounds, short-vowel
words (cat, bed, pig, dog, sun), rhymes, sight words and short sentences, all
read aloud, with "Show me how" phonics steps. The 100-level map is Math only
for now; the parent report shows every subject at the learner's grade.

## Install on a device

1. Publish the app once (see *Deploy* below) and open its link in Chrome.
2. **Android:** menu ⋮ → *Add to Home screen* / *Install app*.
   **PC (Chrome or Edge):** click the install icon in the address bar.
3. Open it once while online. After the "Ready to use offline" message it
   works with Wi-Fi off.

Progress is stored **on each device**. To move a child's progress between
the PC and the phone, use *Parents → Download backup* on one device and
*Restore from file* on the other.

## How a skill is taught

Each skill follows the same path, shown on the topic screen:

1. **Learn (watch and do):** an interactive lesson that moves Concrete → Pictorial → Abstract. Children tap to count, fill ten frames, answer quick checks, and watch animated worked examples of the technique.
2. **Try with help:** a few questions solved step by step with the technique (for example *make ten*: "8 needs ? to make 10", "split 5 into 2 and ?", "10 + 3 = ?"). Mistakes here get a nudge, not a mark.
3. **Practise on my own:** graded practice. **Show me how** plays the technique for that exact question, and a wrong answer shows the worked steps automatically. After the main method, a **⚡ Faster way** button may offer a mental-maths trick for those numbers (round and adjust, make the next ten, same difference, double-double, a friendly number for division). It only appears once the main method is finished, so the fundamentals always come first (`js/engine/shortcuts.js`).

Techniques (`js/engine/techniques.js`): count on, make ten, number bonds, column addition and subtraction with renaming, skip counting, split by place value, long division, equivalent fractions, same-denominator fractions, the bar model (draw → label → choose the operation → calculate), and Kinder touch-and-count.

## Keeping kids engaged

- **Pip**, a friendly companion, cheers right answers, says "let's look together" after a wrong one, and celebrates at the end of a set. Confetti and sound effects are generated in the browser, so there are no audio files to download. Parents can turn sounds off under Parents → Voice and sounds.
- **Daily quest**: three small goals a day. Practice is always one of them. Finishing all three opens a chest of bonus stars.
- **Reward shop**: stars buy colours, hats, pets and places for Pip. Items only change how Pip looks, never the learning. Badges count lifetime stars, so spending stars never takes a badge away.
- **Learning map**: topics are levels on a winding path. Each level has a progress ring and up to 3 stars, and Pip stands on the current level. No level is ever locked.
- **Games**: Speed Round (number pad; 60 s, or 90 s for Kinder) and Pop the Balloon (10 rounds). Kinder gets counting and facts within 10, and Grade 4 gets times and division facts. Stars from games are capped, so practice stays the main way to earn them.
- **100 levels**: generated from each pack's skills, so they need no hand-written content and grow with new grades. There are 10 worlds of 10 levels, all open from the start so a child can play them in any order (Pip suggests the first level without stars). Every 10th level is a boss. A boss is a longer mixed set with no hints, needs 70% to pass, and gives a big star bonus. Later worlds mix in review of earlier skills and use slightly longer sets.
- **Bonus quests and Challenge zone**: opening the daily chest unlocks a harder Bonus quest, then a Champion quest. These ask for Challenge sets: stretch skills one step beyond the grade, in a "Challenge zone" topic in each pack.
- **More games**: Memory Match (sums and answers), Bond Bubbles (number bonds to 5/10 or 100/1,000) and Number Line Jump (find numbers or fractions on a line).
- **Parent goals**: practice sets per day, days per week and an optional reward, set in the parent area. The child sees today's progress and a week tracker on the home screen.

## Voice

The app ships a **recorded voice pack** (`audio/voice/`, about 30 MB, cached for offline use): every lesson sentence, every Kinder question and hint (including the small Challenge sums), game and results lines, praise and nudges were recorded with the open-source [Piper](https://github.com/rhasspy/piper) engine using the *Kathleen* voice (CC0). Sentences that are not recorded (for example a random Grade 4 sum) use the device's best offline voice, read a little slower and higher. Parents can change voice, speed and pitch under **Parents → Voice**.

After changing lesson text or Kinder generators, re-record the new sentences (existing clips are kept):

```bash
pip install piper-tts
node tools/collect-speech.mjs > speech.json
python3 tools/build_voice_pack.py speech.json path/to/en-us-kathleen-low.onnx
```

## Deploy (GitHub Pages, free)

Repository → **Settings → Pages** → *Deploy from a branch* → `main`, folder
`/ (root)`. The app is served at
`https://<user>.github.io/LearnOffline/`. No build step is needed.

When you change any file, bump `CACHE_VERSION` in `sw.js`. Installed copies
download the update in the background and show a *Reload* button.

## Run locally

```bash
python3 -m http.server 8000     # then open http://localhost:8000
npm test                        # unit tests: engine, packs, precache list
```

Service workers need `https://` or `localhost`; opening `index.html` as a
file will not work offline.

## How it is built

| Layer | Files | Notes |
| --- | --- | --- |
| Screens | `js/ui/screens/*.js` | One module per screen; hash routes (`#/home`, `#/practice/<skill>`) |
| Components | `js/ui/components/` | Visuals (ten frames, blocks, bonds, bar models, shapes), shared widgets |
| Engine | `js/engine/` | Pure, DOM-free, unit-tested: question generators, answer checking, mastery, rewards |
| Data | `js/data/` | `db.js` is the only IndexedDB code; `repo.js` exposes app-level reads/writes; `backup.js`, `packs.js` |
| Offline | `sw.js`, `manifest.webmanifest` | Cache-first service worker; precache list checked by tests |
| Content | `packs/*.json` | One JSON pack per subject and grade, listed in `packs/index.json` |

No frameworks or build tools: plain ES modules that run directly in the browser.

**Storage (IndexedDB `learnoffline`):** `profiles`, `attempts` (append-only
answer log), `mastery` (running score per child and skill), `rewards`,
`sessions` (one row per finished set), `settings`. A finished set is saved
in one transaction, and reports read running totals and indexed ranges
instead of scanning the answer log, so the app stays fast with years of data.

**Mastery:** each skill keeps a weighted score (recent answers count more).
80+ with at least 8 answers is *Mastered*. Good sets push the next review
further out (1, 2, 4, 7, 14, 30 days). The *Daily mix* picks due reviews
first, then the weakest skills, then the next new skill.

## Adding content

Add a pack file under `packs/`, list it in `packs/index.json`, and add it to
`PRECACHE` in `sw.js` (the tests fail if you forget). Lesson steps can be
interactive with `"interact"`: `tapCount`, `fillFrame`, `check`, `worked`
(plays a technique) or `tryIt` (guided technique), for example
`{ "kind": "worked", "method": { "kind": "makeTen", "a": 8, "b": 5 } }`. A skill can use a
**generator** for endless questions, fixed **questions**, or both:

```json
{
  "skillId": "g4-equivalent-fractions",
  "title": "Equivalent fractions",
  "lesson": { "steps": [
    { "stage": "concrete", "text": "Fold a strip in half…", "visual": { "kind": "fraction", "numerator": 1, "denominator": 2 } },
    { "stage": "abstract", "text": "1/2 = 2/4 = 4/8." }
  ] },
  "generator": { "type": "equivalentFraction", "maxDen": 12 },
  "questions": [
    { "id": "q1", "type": "numeric", "prompt": "3/4 = ?/8", "answer": 6, "hint": "Multiply top and bottom by 2." }
  ]
}
```

Generators: `count`, `compare`, `placeValue`, `numberBond`, `addition`,
`subtraction`, `multiplication`, `division`, `multiplyLong`, `divideLong`,
`factorsMultiples`, `fractionOfShape`, `equivalentFraction`,
`fractionSameDen`, `decimals`, `wordProblem`, and the Kinder set
`countPictures`, `numberOrder`, `moreOrFewer`, `shapes`, `patterns`,
`addPictures`, `takeAwayPictures`, and English (`js/engine/topics/english.js`)
`letterFind`, `letterMatch`, `letterNext`, `firstLetter`, `sameSound`,
`missingVowel`, `readWord`, `pictureWord`, `rhyme`, `sightWord`,
`readSentence`. Fixed question types: `numeric`,
`multiple-choice`, `true-false`, `fraction`.

Set `"young": true` on a pack in `packs/index.json` for pre-readers: shorter
sets, bigger buttons and read-aloud on by default.

## Roadmap

1. **Phase 1 (this):** app engine, Kinder 2 and Grade 4 math
2. **Phase 2:** English reading/phonics for Kinder 2 (done), then Grade 1–2; Grade 4 English and Science; Google Sheet → pack exporter (Apps Script)
3. **Phase 3:** Math Grades 1–3 (done), 5–6; Science Grades 3–6
4. **Phase 4:** Junior high (Grades 7–10)
5. **Phase 5:** Senior high core subjects, optional sync, printable worksheets
