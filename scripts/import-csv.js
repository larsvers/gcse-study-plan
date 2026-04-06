// Import sessions from data/sessions.csv into the DB.
// Rows WITH an id → UPDATE the existing row (lets you edit times, dates, tasks, etc.)
// Rows WITHOUT an id → INSERT as a new row
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
	const chars = csv.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');

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

if (!existsSync('data/sessions.csv')) {
	console.log('No data/sessions.csv found — nothing to import.');
	process.exit(0);
}

const rows = parseCsv(readFileSync('data/sessions.csv', 'utf-8'));
let inserted = 0;
let updated = 0;

for (const row of rows) {
	if (row.id && row.id.trim() !== '') {
		// UPDATE existing row — only overwrites the planning columns, leaves progress data untouched
		await db.execute({
			sql: `UPDATE sessions SET
				date       = ?,
				label      = ?,
				focus      = ?,
				sort_order = ?,
				time       = ?,
				subject    = ?,
				task       = ?,
				method     = ?,
				is_break   = ?
			WHERE id = ?`,
			args: [
				row.date,
				row.label,
				row.focus,
				parseInt(row.sort_order) || 0,
				row.time || null,
				row.subject || null,
				row.task || null,
				row.method || null,
				parseInt(row.is_break) || 0,
				parseInt(row.id)
			]
		});
		updated++;
		console.log(`  ~ Updated #${row.id}: ${row.date} ${row.time || ''} ${row.subject || '(break)'}`);
	} else {
		// INSERT new row
		await db.execute({
			sql: `INSERT INTO sessions (date, label, focus, sort_order, time, subject, task, method, is_break)
			      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			args: [
				row.date,
				row.label,
				row.focus,
				parseInt(row.sort_order) || 0,
				row.time || null,
				row.subject || null,
				row.task || null,
				row.method || null,
				parseInt(row.is_break) || 0
			]
		});
		inserted++;
		console.log(`  + Inserted: ${row.date} ${row.time || ''} ${row.subject || '(break)'}`);
	}
}

if (inserted === 0 && updated === 0) {
	console.log('Nothing to import — CSV had no rows.');
} else {
	console.log(`\nDone! ${inserted} inserted, ${updated} updated.`);
}
