// Export sessions from Turso to data/sessions.csv
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

// Planning columns: what you need to review and edit the schedule
const planningCols = ['id', 'date', 'label', 'focus', 'sort_order', 'time', 'subject', 'task', 'method', 'is_break'];
// All columns: includes student progress data
const allCols = [...planningCols, 'done', 'notes', 'time_spent', 'image_path', 'image_sent', 'confidence', 'work', 'mark', 'evaluation', 'work_updated'];

const headers = exportAll ? allCols : planningCols;

mkdirSync('data', { recursive: true });

const result = await db.execute(
	`SELECT ${headers.join(', ')} FROM sessions ORDER BY date, sort_order`
);
writeFileSync('data/sessions.csv', '\uFEFF' + toCsv(headers, /** @type {any[]} */ (result.rows)));
console.log(`Exported ${result.rows.length} sessions → data/sessions.csv`);
