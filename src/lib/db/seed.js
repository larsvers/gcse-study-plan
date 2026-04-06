// Run with: node src/lib/db/seed.js
// Creates the flat sessions table and seeds with the initial half-term revision plan.
// Works with both local file:local.db and remote Turso URLs.

import { createClient } from '@libsql/client';

const db = createClient({
	url: process.env.TURSO_DATABASE_URL ?? 'file:local.db',
	authToken: process.env.TURSO_AUTH_TOKEN
});

// ── 1. Create table ──────────────────────────────────────────────────────────

await db.execute(`
  CREATE TABLE IF NOT EXISTS sessions (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    date         TEXT NOT NULL,
    label        TEXT NOT NULL,
    focus        TEXT NOT NULL,
    sort_order   INTEGER NOT NULL,
    time         TEXT,
    subject      TEXT,
    task         TEXT,
    method       TEXT,
    is_break     INTEGER NOT NULL DEFAULT 0,
    done         INTEGER NOT NULL DEFAULT 0,
    notes        TEXT DEFAULT '',
    time_spent   INTEGER,
    image_path   TEXT,
    image_sent   INTEGER NOT NULL DEFAULT 0,
    confidence   INTEGER,
    work         TEXT,
    mark         TEXT,
    evaluation   TEXT,
    work_updated TEXT
  )
`);

// ── 2. Check if already seeded ───────────────────────────────────────────────

const existing = await db.execute('SELECT COUNT(*) as count FROM sessions');
if (Number(existing.rows[0].count) > 0) {
	console.log('Already seeded — skipping. Delete local.db to reseed.');
	process.exit(0);
}

// ── 3. Insert sessions ───────────────────────────────────────────────────────

const INSERT =
	'INSERT INTO sessions (date, label, focus, sort_order, time, subject, task, method, is_break) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';

// Helper: study session
/** @param {string} date @param {string} lbl @param {string} foc @param {number} order @param {string} time @param {string} subject @param {string} task @param {string} method */
const s = (date, lbl, foc, order, time, subject, task, method) =>
	db.execute({ sql: INSERT, args: [date, lbl, foc, order, time, subject, task, method, 0] });

// Helper: break row
/** @param {string} date @param {string} lbl @param {string} foc @param {number} order @param {string} time @param {string} task */
const b = (date, lbl, foc, order, time, task) =>
	db.execute({ sql: INSERT, args: [date, lbl, foc, order, time, null, task, null, 1] });

// ── Tuesday 18 Feb ──────────────────────────────────────────────────────────
const tue = ['2026-02-18', 'Tuesday 18 Feb', "Start strong. History & Maths (things you're good at) plus your first English Language session."];
await s(...tue, 1, '10:00', 'History', 'Weimar Republic: Watch Mr Allsop video (10 min), then Blurt everything you remember.', 'Blurt');
await b(...tue, 2, '10:25', '5 min break — get up, move around, NO phone');
await s(...tue, 3, '10:30', 'Maths', 'Corbett Maths: 20 algebra questions (grade 7–8 level). Mark as you go.', 'Past Paper');
await b(...tue, 4, '10:55', 'Break — done for the morning! Gym / lunch / free time');
await s(...tue, 5, '14:00', 'Eng. Language', 'AQA Paper 1 Q1 + Q2 only (use savemyexams.com). Q1 = free marks. Q2 = one paragraph on language.', 'Past Paper');
await b(...tue, 6, '14:25', '5 min break');
await s(...tue, 7, '14:30', 'History', 'Interwar Years: League of Nations — read revision guide page, then Blurt. Focus on: aims, membership, successes/failures.', 'Blurt');
await b(...tue, 8, '14:55', 'Done! ✅');
await s(...tue, 9, 'Evening', 'Feynman', 'Explain to Lars — he stays quiet: What was the League of Nations and why did it fail?', 'Feynman');

// ── Wednesday 19 Feb ────────────────────────────────────────────────────────
const wed = ['2026-02-19', 'Wednesday 19 Feb', 'Citizenship, languages, and a creative writing session.'];
await s(...wed, 1, '10:00', 'Eng. Language', "AQA Paper 1 Q5: creative writing. Set a timer for 20 min and just write. Topic: describe a place at night. Don\u2019t overthink, just get words down.", 'Past Paper');
await b(...wed, 2, '10:25', '5 min break');
await s(...wed, 3, '10:30', 'Italian', 'Edexcel vocab: pick a topic (e.g. family, school). Use Blurt: read vocab list, cover it, write down everything. Check what you missed.', 'Blurt');
await b(...wed, 4, '10:55', 'Break — gym / lunch / free time');
await s(...wed, 5, '14:30', 'Citizenship', "Pick a topic you haven't revised recently. Read revision guide, then write 5 quick-fire answers to practice Qs without looking.", 'Active Recall');
await b(...wed, 6, '14:55', '5 min break');
await s(...wed, 6, '15:00', 'Spanish', 'Edexcel speaking prep: record yourself answering 3 general conversation questions. Listen back. Note mistakes.', 'Active Recall');
await b(...wed, 7, '15:25', 'Done for the day! 🎉');
await s(...wed, 8, 'Evening', 'Feynman', 'Explain to Lars: What is Priestley saying about responsibility in An Inspector Calls?', 'Feynman');

// ── Thursday 20 Feb ─────────────────────────────────────────────────────────
const thu = ['2026-02-20', 'Thursday 20 Feb', 'History (Medicine), Christmas Carol, persuasive writing technique, and Citizenship.'];
await s(...thu, 1, '10:00', 'History', 'Medicine Through Time: pick one period (Medieval or Renaissance). Watch Mr Allsop video, then Blurt key causes, treatments, key figures.', 'Blurt');
await b(...thu, 2, '10:25', '5 min break');
await s(...thu, 3, '10:30', 'English Lit', "A Christmas Carol: Scrooge's transformation. Find 3 quotes (one from each stave). Write one P-E-E-L paragraph on how Dickens presents change.", 'Past Paper');
await b(...thu, 4, '10:55', 'Break — squash? 🎾 lunch / free time');
await s(...thu, 5, '14:30', 'Eng. Language', 'AQA Paper 2 Q5: persuasive writing. 20 min timed write. Topic: "Should mobile phones be banned in schools?" Write to persuade — rhetorical Qs, rule of 3, direct address.', 'Past Paper');
await b(...thu, 6, '14:55', '5 min break');
await s(...thu, 7, '15:00', 'Citizenship', "Pick a topic you haven't revised recently. Read revision guide, then write 5 quick-fire answers to practice Qs without looking.", 'Active Recall');
await b(...thu, 8, '15:25', 'Done! ✅');
await s(...thu, 9, 'Evening', 'Feynman', 'Explain (at Randys): How did people treat illness in Medieval England vs now? + How do you make Korean BBQ chicken?', 'Feynman');

// ── Friday 21 Feb ───────────────────────────────────────────────────────────
const fri = ['2026-02-21', 'Friday 21 Feb', 'Normans, Maths, English Language review, Macbeth, and a first tiny taste of Science.'];
await s(...fri, 1, '10:00', 'History', "Norman England: Why did William win at Hastings? Blurt the key factors (leadership, luck, tactics, Harold's problems). Then check against revision guide.", 'Blurt');
await b(...fri, 2, '10:25', '5 min break');
await s(...fri, 3, '10:30', 'Maths', "Corbett Maths: pick a topic you're less sure about (geometry? ratio?). Do 15–20 questions at grade 7–8.", 'Past Paper');
await b(...fri, 4, '10:55', 'Break — lunch / free time');
await s(...fri, 5, '14:00', 'Eng. Language', "AQA Paper 1 Q3 (structure) OR re-do Tuesday's Q2 with a new extract. Compare with mark scheme — are you hitting the bullet points?", 'Past Paper');
await b(...fri, 6, '14:25', '5 min break');
await s(...fri, 7, '14:30', 'English Lit', 'Macbeth: You just saw it live! Pick one scene you remember well. Find 2–3 key quotes. Write one P-E-E-L paragraph on ambition or guilt.', 'Past Paper');
await b(...fri, 8, '14:55', '5 min break');
await s(...fri, 9, '15:00', 'Science', "Just 20 min: watch ONE FreeScienceLessons video on a topic from your weakest paper. Then Blurt. That's it. Toe in the water.", 'Blurt');
await b(...fri, 10, '15:25', 'Week done! 🎉');
await s(...fri, 11, 'Evening', 'Feynman', "Explain: Tell me about Macbeth — what's his fatal flaw and how does Shakespeare show it?", 'Feynman');

console.log('✅ Database seeded successfully.');
