# Your own questions from Google Sheets

Write questions in a Google Sheet, turn them into a pack file, and import the
file in the app (**Parents → Your own questions → Import pack**). The questions
show up as a new subject tab for every learner in that grade. They are saved
on the device, so they work offline.

## One-time set-up (on a PC)

1. Make a new Google Sheet.
2. Choose **Extensions → Apps Script**.
3. Delete what is there, paste in all of [`LearnOfflinePacks.gs`](LearnOfflinePacks.gs), and click **Save**.
4. Go back to the sheet and reload the page. A **LearnOffline** menu appears.
5. Choose **LearnOffline → Set up sheet**. The first time, Google asks you to
   allow the script. It only reads this sheet and, if you ask it to, saves the
   pack file to your Drive.

Set up makes three tabs, each with examples you can replace:

| Tab | What goes in it |
| --- | --- |
| **Pack** | The pack name, the name on the subject tab (up to 24 letters), the grade, and an icon. Leave the Pack ID alone. |
| **Questions** | One question per row: Topic, Skill, Type, Question, Answer, up to 3 wrong choices, Hint, Explanation. |
| **Lessons** (optional) | Teaching steps for a skill, one step per row, in order. A skill with steps gets a **Learn** button. |

## Question types

| Type | Answer | Example |
| --- | --- | --- |
| Number | A number. Commas, ₱ and % are fine. | `65`, `1,000`, `2.5` |
| Multiple choice | The right choice. Put 1 to 3 wrong choices in the next columns. The app mixes up the order. | `₱10 and ₱5` |
| Fraction | A fraction or mixed number. Any equal fraction counts as right. | `3/4`, `1 1/2` |
| True or false | `True` or `False` | `True` |

Topics and skills are grouped by their names, so type each name the same way
on every row. A topic can have many skills, and a skill can have up to 300
questions. A pack can have up to 5,000 questions.

## Make the pack file

1. Choose **LearnOffline → Check questions**. The **Check** column shows ✓ OK,
   or what to fix on that row.
2. Choose **LearnOffline → Make pack file**, then **Download**. If the download
   is blocked, choose **Save to Google Drive** instead.
3. In the app, open **Parents → Your own questions → Import pack** and pick the
   file. On the phone, download the file from the Drive app first.

Do step 3 on each device. A backup from **Parents → Backup** also carries your
packs to another device.

## Changing questions later

Edit the sheet, make the pack file again, and import it again. The app asks
before it replaces the old pack. Progress is kept for every skill whose topic
and skill names did not change. Renaming a skill starts its progress again.

Do not copy the Pack tab into a second sheet: two sheets with the same Pack ID
replace each other's pack. For a second pack, start a new sheet and run
**Set up sheet** there.

## Try it without a sheet

[`sample-pack.json`](sample-pack.json) is a small Grade 4 pack made by this
script. Import it to see how your own questions look in the app.

## For developers

- The file format and the app's checks are in `js/data/customPacks.js`. The
  app rebuilds every pack from known fields only, so a file can never add
  pictures, generators or scripts.
- `tests/sheets.test.mjs` runs the script's `buildPack_` in Node and checks
  that the app accepts what it makes.
