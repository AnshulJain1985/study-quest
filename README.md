# Ashray's Study Quest

A one-page web app, styled like a game, that turns the study plan into daily quests, a map of finished and missed days, a flame streak, XP and levels, badges, and the weekly tests as boss battles. There are two logins: the student ticks tasks and takes tests; the parent sees everything, marks the written answers and leaves comments.

## What is in it

| Screen | Student (game names) | Parent |
| --- | --- | --- |
| Today / Overview | The streak in red ink, this week's seven days, and today's tasks by block with a tick box each, plus "five things I learned" and a note for the parent | Streak, days done this week, tests waiting for marks, the last 7 days with his notes, and today's tasks |
| Calendar | Every day coloured by status; tap a day to see its plan | Same, plus a comment on any day and the option to mark days off |
| Tests | Opens on its date with a timer. Section A is marked automatically on submit; Section B is written on paper | Reads his answers next to the model answer and marking scheme, enters marks and a comment |
| Progress | Streak record, sessions done per subject, test results, chapter status (on track or behind) | Same, plus a CSV download that opens in Google Sheets |

The plan runs from 5 October 2026 to the Annual exam (15-27 February 2027) in four phases:

1. Keep pace and repair, to 14 Nov.
2. Periodic Test II sprint, 16-29 Nov.
3. Finish the syllabus and do a second pass, Dec to 9 Jan.
4. Full revision with two sample papers a week, from 11 Jan.

Sundays are off. Dussehra, Diwali and two rest days after Periodic Test II are also off; check the festival dates against the school calendar.

**Streak rules.** A day counts when every task is ticked. A "minimum day" also counts: on a tired day, finishing the Maths block alone keeps the streak. Sundays, holidays and one free pass per month never break it. Today never breaks it while the day is still open. He can tick today and yesterday only, so the record stays honest; the parent can correct any day.

**Tests.**

- Eight tests are written from the new chapters and his mid-term mistakes:
  - triangle proofs
  - motion and work
  - identities and quadrilaterals
  - forces and the atom
  - English Units 5-6 with Biology
  - two Periodic Test II mocks
- One Social Science test uses a Physics Wallah chapter test, because the book was not available.
- From December, Saturday half-syllabus tests and the February sample papers are taken from school or Physics Wallah papers, and he enters the marks.
- German Saturday sessions with Claude (an e-mail or a mock test) have a box for the mark.

## The game layer

Everything is worked out from the ticks and test marks, so nothing extra is stored and the parent can still correct any day.

- **XP:** 10 per task (5 if optional), +25 for a cleared day (+10 for a minimum day), +2 per streak day (up to 20), and 5 per mark scored in a test.
- **Levels and ranks:** level = floor(sqrt(XP / 50)) + 1. Ranks run Rookie, Scout, Ranger, Knight, Paladin, Champion, Legend, Mythic.
- **Badges:** streaks (3, 7, 14, 30 days), First Blood, Comeback Kid, Boss Slayer, S-Rank, Maths Wizard, and levels 5 and 10. See `badgeList` in `app.js`.
- **Test ranks:** S for 90% and up, A for 75%, B for 60%, otherwise C.

Change the numbers in `xpTotal`, `xpOfTask`, `levelOf` and `badgeList` in `app.js`.

## Why Firebase and not Google Sheets

Firebase Authentication gives each person a real login. Firestore security rules then let the student tick tasks but not mark his own tests or change the parent's comments.

A Google Sheet behind Apps Script would need its own login handling, and anyone with the script URL could write to it. Sheets is still easy to use for review: the parent's Progress page downloads everything as a CSV, which opens directly in Google Sheets.

Everything stays on the free Spark plan. Two users and a few hundred small documents are far below its limits.

## Files

```
public/index.html   page shell, fonts
public/config.js    names, exam dates, holidays, Firebase settings  <- the file you edit
public/plan.js      chapters, daily schedule generator, the tests and marking schemes
public/app.js       logins, screens, streaks, tests
public/styles.css   the dark neon game look (colours are tokens at the top)
firestore.rules     who may read and write what
firebase.json       hosting + rules deploy settings
.firebaserc         your Firebase project id
```

Without Firebase settings, the app runs in **demo mode**: data stays in that browser only, and two buttons let you open it as the student or the parent. That is the quickest way to try it.

## Setting it up (about 30 minutes, once)

1. **Create the project.** Go to <https://console.firebase.google.com>, add a project (Google Analytics is not needed), and stay on the free Spark plan.
2. **Register the web app.** In Project settings > Your apps, add a Web app. Copy the `firebaseConfig` values (apiKey, authDomain, projectId, appId) into `firebase:` in `public/config.js`.
3. **Turn on logins.** In Authentication > Sign-in method, enable Email/Password. In Authentication > Users, add two users: one e-mail and password for Ashray, one for you. Copy each user's UID.
4. **Create the database.** In Firestore Database, create a database in production mode. Choose the Delhi (asia-south2) or Mumbai (asia-south1) location. Then create a collection named `roles` with two documents:
   - document ID = Ashray's UID, field `role` (string) = `student`
   - document ID = your UID, field `role` (string) = `parent`
5. **Deploy.** On a computer with Node.js:
   ```
   npm install -g firebase-tools
   firebase login
   cd study-tracker
   ```
   Put your project id in `.firebaserc`, then run:
   ```
   firebase deploy
   ```
   This uploads the site and the security rules together.
6. **Open it.** Go to `https://YOUR-PROJECT-ID.web.app` on his computer and sign him in. Bookmark it on yours and sign in as parent.

To change dates or holidays later, edit `public/config.js` and run `firebase deploy` again. Days off can also be added from the calendar in the parent view without redeploying.

## Changing the plan

- **Exam dates:** `dates` in `config.js`. The phases and the sprint move with them automatically.
- **A day's tasks:** the lists in `plan.js` (`Q.mathsNew`, `Q.physics`, ...). Each list is used in order on its weekday. A missed holiday simply pushes the next session to the following week.
- **A new test:** add an entry to the `T.push({...})` section in `plan.js`, with the date, MCQs (with the index of the correct option) and written questions (with marks, a model answer and a marking scheme).

Ticks are stored by date and slot (for example `2026-10-12:b1`). If you insert a session in the middle of a list, later days show the next session, but what he already ticked stays ticked.

## Limits to know about

- MCQ answers are inside the page code, so a determined student could look them up in the browser's developer tools. The written section, marked by you, is the real check.
- The "today and yesterday only" ticking rule is enforced in the app, not in the security rules.
- Social Science sessions are generic (read a third, write five points, check), because the Social Science books were not available. Add section names to `Q.sstA` and `Q.sstB` when you have them.
- Tasks from December onward name the chapters but are less detailed than October and November, because Units 7-8 are the only new Annual chapters I had.

## Next steps (good jobs for Claude Code)

1. Write chapter-level tests for Phase 3 (English Units 7-8, Lesson 4 Hamburg, and the remaining Maths and Science chapters) once the books are shared.
2. Fill in Social Science sections and tests from the textbook.
3. Let the parent swap or edit a single day's task from the calendar.
4. Photo upload of written answers (Firebase Storage), so marking can happen away from the notebook.
5. A Sunday-evening summary e-mail to the parent (Apps Script on a schedule, or a Cloud Function on the Blaze plan).
6. Enforce the ticking window in the security rules as well.
