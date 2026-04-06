// One-time migration: collapse the days + sessions tables into a single flat sessions table.
// Run ONCE against each database (local and Turso) — it is NOT idempotent.
// Usage: TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... node scripts/migrate-to-flat.js

import { createClient } from '@libsql/client';

const db = createClient({
	url: process.env.TURSO_DATABASE_URL ?? 'file:local.db',
	authToken: process.env.TURSO_AUTH_TOKEN
});

console.log(`Migrating ${process.env.TURSO_DATABASE_URL ?? 'file:local.db'} …`);

// 1. Rename old sessions table out of the way
await db.execute('ALTER TABLE sessions RENAME TO sessions_old');
console.log('  Renamed sessions → sessions_old');

// 2. Create the new flat sessions table
await db.execute(`
  CREATE TABLE sessions (
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
console.log('  Created new flat sessions table');

// 3. Copy all data across, joining days to get date/label/focus
const result = await db.execute(`
  INSERT INTO sessions (
    id, date, label, focus, sort_order, time, subject, task, method,
    is_break, done, notes, time_spent, image_path, image_sent,
    confidence, work, mark, evaluation, work_updated
  )
  SELECT
    s.id,
    d.date,
    d.label,
    d.focus,
    s.sort_order,
    s.time,
    s.subject,
    s.task,
    s.method,
    s.is_break,
    s.done,
    s.notes,
    s.time_spent,
    s.image_path,
    s.image_sent,
    s.confidence,
    s.work,
    s.mark,
    s.evaluation,
    s.work_updated
  FROM sessions_old s
  JOIN days d ON d.id = s.day_id
  ORDER BY d.date, s.sort_order
`);
console.log(`  Migrated ${result.rowsAffected} sessions`);

// 4. Drop the now-redundant old tables
await db.execute('DROP TABLE sessions_old');
await db.execute('DROP TABLE days');
console.log('  Dropped sessions_old and days');

console.log('\nMigration complete!');
