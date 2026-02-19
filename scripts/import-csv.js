// Import new rows from CSV files in data/ into Turso.
// Only rows with a BLANK id column are inserted. Existing rows (with an id) are skipped.
// Usage: TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... node scripts/import-csv.js

import { createClient } from '@libsql/client';
import { readFileSync, existsSync } from 'fs';

const db = createClient({
	url: process.env.TURSO_DATABASE_URL ?? 'file:local.db',
	authToken: process.env.TURSO_AUTH_TOKEN
});

/**
 * Parse a CSV string into an array of objects keyed by header names.
 * Handles quoted fields (with commas, newlines, escaped quotes).
 * @param {string} csv
 * @returns {Record<string, string>[]}
 */
function parseCsv(csv) {
	const rows = [];
	let i = 0;
	const chars = csv.replace(/\r\n/g, '\n');

	function parseField() {
		if (chars[i] === '"') {
			i++; // skip opening quote
			let val = '';
			while (i < chars.length) {
				if (chars[i] === '"') {
					if (chars[i + 1] === '"') {
						val += '"';
						i += 2;
					} else {
						i++; // skip closing quote
						break;
					}
				} else {
					val += chars[i];
					i++;
				}
			}
			return val;
		}
		let val = '';
		while (i < chars.length && chars[i] !== ',' && chars[i] !== '\n') {
			val += chars[i];
			i++;
		}
		return val;
	}

	function parseLine() {
		const fields = [];
		while (i < chars.length && chars[i] !== '\n') {
			fields.push(parseField());
			if (chars[i] === ',') i++; // skip comma
		}
		if (chars[i] === '\n') i++; // skip newline
		return fields;
	}

	const headers = parseLine();
	while (i < chars.length) {
		const fields = parseLine();
		if (fields.length === 0 || (fields.length === 1 && fields[0] === '')) continue;
		/** @type {Record<string, string>} */
		const row = {};
		headers.forEach((h, idx) => (row[h] = fields[idx] ?? ''));
		rows.push(row);
	}
	return rows;
}

// ── Import days ───────────────────────────────────────────────────────────────

let newDayCount = 0;
/** @type {Map<string, number | bigint>} Map from CSV row index key to new DB id */
const dayIdMap = new Map();

if (existsSync('data/days.csv')) {
	const rows = parseCsv(readFileSync('data/days.csv', 'utf-8'));
	for (let idx = 0; idx < rows.length; idx++) {
		const row = rows[idx];
		if (row.id && row.id.trim() !== '') continue; // existing row, skip

		const result = await db.execute({
			sql: 'INSERT INTO days (date, label, focus) VALUES (?, ?, ?)',
			args: [row.date, row.label, row.focus]
		});
		dayIdMap.set(`new_${idx}`, result.lastInsertRowid);
		console.log(`  + Day: ${row.label} (id=${result.lastInsertRowid})`);
		newDayCount++;
	}
	console.log(`Days: ${newDayCount} new rows inserted (${rows.length - newDayCount} existing skipped)`);
} else {
	console.log('No data/days.csv found — skipping days');
}

// ── Import sessions ───────────────────────────────────────────────────────────

let newSessionCount = 0;

if (existsSync('data/sessions.csv')) {
	const rows = parseCsv(readFileSync('data/sessions.csv', 'utf-8'));
	for (const row of rows) {
		if (row.id && row.id.trim() !== '') continue; // existing row, skip

		const dayId = parseInt(row.day_id);
		if (isNaN(dayId)) {
			console.warn(`  ⚠ Skipping session with invalid day_id: "${row.day_id}" — task: ${row.task}`);
			continue;
		}

		await db.execute({
			sql: 'INSERT INTO sessions (day_id, sort_order, time, subject, task, method, is_break) VALUES (?, ?, ?, ?, ?, ?, ?)',
			args: [
				dayId,
				parseInt(row.sort_order) || 0,
				row.time || null,
				row.subject || null,
				row.task || null,
				row.method || null,
				parseInt(row.is_break) || 0
			]
		});
		newSessionCount++;
	}
	console.log(
		`Sessions: ${newSessionCount} new rows inserted (${rows.length - newSessionCount} existing skipped)`
	);
} else {
	console.log('No data/sessions.csv found — skipping sessions');
}

if (newDayCount === 0 && newSessionCount === 0) {
	console.log('\nNothing to import. Add new rows with a blank "id" column and run again.');
} else {
	console.log(`\nDone! Inserted ${newDayCount} days + ${newSessionCount} sessions.`);
}
