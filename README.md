# LearnOffline

An offline-first learning app for kids, in the style of practice platforms:
short lessons, auto-graded practice, stars and badges, and a parent
dashboard. It installs from the browser and then runs with no internet on a
PC or an Android phone.

Phase 1 ships **Math for Kinder 2** (picture-based, read aloud) and **Math
for Grade 4**, taught the Singapore way: Concrete → Pictorial → Abstract
lessons and bar models for word problems. All lessons and questions are
original.

## Install on a device

1. Publish the app once (see *Deploy* below) and open its link in Chrome.
2. **Android:** menu ⋮ → *Add to Home screen* / *Install app*.
   **PC (Chrome or Edge):** click the install icon in the address bar.
3. Open it once while online. After the "Ready to use offline" message it
   works with Wi-Fi off.

Progress is stored **on each device**. To move a child's progress between
the PC and the phone, use *Parents → Download backup* on one device and
*Restore from file* on the other.

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
`PRECACHE` in `sw.js` (the tests fail if you forget). A skill can use a
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
`addPictures`, `takeAwayPictures`. Fixed question types: `numeric`,
`multiple-choice`, `true-false`, `fraction`.

Set `"young": true` on a pack in `packs/index.json` for pre-readers: shorter
sets, bigger buttons and read-aloud on by default.

## Roadmap

1. **Phase 1 (this):** app engine, Kinder 2 and Grade 4 math
2. **Phase 2:** English reading/phonics for Kinder–Grade 2; Grade 4 English and Science; Google Sheet → pack exporter (Apps Script)
3. **Phase 3:** Math Grades 1–6; Science Grades 3–6
4. **Phase 4:** Junior high (Grades 7–10)
5. **Phase 5:** Senior high core subjects, optional sync, printable worksheets
