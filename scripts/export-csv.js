// Export days and sessions from Turso to CSV files in data/
// Usage: TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... node scripts/export-csv.js [--all]
// --all  exports every column; default exports only the planning subset

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

const exportAll = process.argv.includes('--all');

mkdirSync('data', { recursive: true });

// Export days
const daysResult = await db.execute('SELECT id, date, label, focus FROM days ORDER BY id');
const daysHeaders = ['id', 'date', 'label', 'focus'];
writeFileSync('data/days.csv', '\uFEFF' + toCsv(daysHeaders, /** @type {any[]} */ (daysResult.rows)));
console.log(`Exported ${daysResult.rows.length} days → data/days.csv`);

// Export sessions
const sessionsHeaders = exportAll
	? ['id', 'day_id', 'sort_order', 'time', 'subject', 'task', 'method', 'is_break', 'done', 'notes', 'time_spent', 'image_path', 'image_sent', 'confidence', 'work', 'mark', 'evaluation']
	: ['id', 'day_id', 'sort_order', 'time', 'subject', 'task', 'method', 'is_break'];
const sessionsResult = await db.execute(
	`SELECT ${sessionsHeaders.join(', ')} FROM sessions ORDER BY day_id, sort_order`
);
writeFileSync('data/sessions.csv', '\uFEFF' + toCsv(sessionsHeaders, /** @type {any[]} */ (sessionsResult.rows)));
console.log(`Exported ${sessionsResult.rows.length} sessions → data/sessions.csv`);
