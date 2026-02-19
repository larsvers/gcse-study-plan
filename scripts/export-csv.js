// Export days and sessions from Turso to CSV files in data/
// Usage: TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... node scripts/export-csv.js

import { createClient } from '@libsql/client';
import { writeFileSync, mkdirSync } from 'fs';

const db = createClient({
	url: process.env.TURSO_DATABASE_URL ?? 'file:local.db',
	authToken: process.env.TURSO_AUTH_TOKEN
});

/** @param {string} val */
function csvCell(val) {
	if (val == null) return '';
	const s = String(val);
	if (s.includes(',') || s.includes('"') || s.includes('\n')) {
		return '"' + s.replace(/"/g, '""') + '"';
	}
	return s;
}

/** @param {string[]} headers @param {Record<string, unknown>[]} rows */
function toCsv(headers, rows) {
	const lines = [headers.join(',')];
	for (const row of rows) {
		lines.push(headers.map((h) => csvCell(row[h])).join(','));
	}
	return lines.join('\n') + '\n';
}

mkdirSync('data', { recursive: true });

// Export days
const daysResult = await db.execute('SELECT id, date, label, focus FROM days ORDER BY id');
const daysHeaders = ['id', 'date', 'label', 'focus'];
writeFileSync('data/days.csv', '\uFEFF' + toCsv(daysHeaders, /** @type {any[]} */ (daysResult.rows)));
console.log(`Exported ${daysResult.rows.length} days → data/days.csv`);

// Export sessions (only the columns useful for planning)
const sessionsResult = await db.execute(
	'SELECT id, day_id, sort_order, time, subject, task, method, is_break FROM sessions ORDER BY day_id, sort_order'
);
const sessionsHeaders = ['id', 'day_id', 'sort_order', 'time', 'subject', 'task', 'method', 'is_break'];
writeFileSync('data/sessions.csv', '\uFEFF' + toCsv(sessionsHeaders, /** @type {any[]} */ (sessionsResult.rows)));
console.log(`Exported ${sessionsResult.rows.length} sessions → data/sessions.csv`);
