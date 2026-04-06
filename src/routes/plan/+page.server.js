import { db } from '$lib/db/index.js';
import { sessions } from '$lib/db/schema.js';
import { eq, asc } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { Resend } from 'resend';

export async function load({ url }) {
	// Get one row per date for the tab navigation
	const allDays = await db
		.select({ date: sessions.date, label: sessions.label, focus: sessions.focus })
		.from(sessions)
		.groupBy(sessions.date)
		.orderBy(asc(sessions.date));

	// Determine active date from query param (?day=YYYY-MM-DD), today, or most recent past day
	const requestedDate = url.searchParams.get('day');
	let activeDate =
		requestedDate && allDays.find((d) => d.date === requestedDate) ? requestedDate : null;

	if (!activeDate) {
		const today = new Date().toISOString().slice(0, 10);
		const past = allDays.filter((d) => d.date <= today);
		activeDate = past.length > 0 ? past[past.length - 1].date : allDays[0]?.date;
	}

	const activeDay = allDays.find((d) => d.date === activeDate) ?? allDays[0];

	const daySessions = await db
		.select()
		.from(sessions)
		.where(eq(sessions.date, activeDate))
		.orderBy(sessions.sortOrder);

	return { days: allDays, activeDay, sessions: daySessions };
}

export const actions = {
	// Toggle the done checkbox
	toggleDone: async ({ request }) => {
		const data = await request.formData();
		const id = parseInt(/** @type {string} */ (data.get('id')));

		const [session] = await db.select().from(sessions).where(eq(sessions.id, id));
		if (!session) return fail(404, { message: 'Session not found' });

		await db
			.update(sessions)
			.set({ done: session.done ? 0 : 1 })
			.where(eq(sessions.id, id));

		return { success: true };
	},

	// Save notes + time spent
	saveSession: async ({ request }) => {
		const data = await request.formData();
		const id = parseInt(/** @type {string} */ (data.get('id')));
		const notes = /** @type {string} */ (data.get('notes') ?? '');
		const timeSpentRaw = /** @type {string | null} */ (data.get('time_spent'));
		const timeSpent = timeSpentRaw ? parseInt(timeSpentRaw) : null;

		await db.update(sessions).set({ notes, timeSpent }).where(eq(sessions.id, id));

		return { success: true };
	},

	// Save confidence rating (1–5)
	saveConfidence: async ({ request }) => {
		const data = await request.formData();
		const id = parseInt(/** @type {string} */ (data.get('id')));
		const raw = /** @type {string | null} */ (data.get('confidence'));
		const confidence = raw ? parseInt(raw) : null;

		await db.update(sessions).set({ confidence }).where(eq(sessions.id, id));

		return { success: true };
	},

	// Upload image — email it via Resend
	uploadImage: async ({ request }) => {
		const data = await request.formData();
		const id = parseInt(/** @type {string} */ (data.get('id')));
		const file = /** @type {File | null} */ (data.get('image'));

		if (!file || file.size === 0) return fail(400, { message: 'No file provided' });

		const [session] = await db.select().from(sessions).where(eq(sessions.id, id));
		if (!session) return fail(404, { message: 'Session not found' });

		const bytes = await file.arrayBuffer();
		const buffer = Buffer.from(bytes);
		const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
		const subject = session.subject ?? 'Break';
		const taskSnippet = (session.task ?? '').slice(0, 60);

		const resend = new Resend(env.RESEND_API_KEY);
		await resend.emails.send({
			from: 'GCSE Revision <onboarding@resend.dev>',
			to: env.NOTIFY_EMAIL ?? '',
			subject: `#${id} ${session.label} — ${subject} — ${taskSnippet}`,
			text: `Session #${id}\nDay: ${session.label}\nSubject: ${subject}\nTask: ${session.task}`,
			attachments: [{ filename: `session-${id}.${ext}`, content: buffer }]
		});

		await db.update(sessions).set({ imageSent: 1 }).where(eq(sessions.id, id));

		return { success: true };
	}
};
