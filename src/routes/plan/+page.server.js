import { db } from '$lib/db/index.js';
import { days, sessions } from '$lib/db/schema.js';
import { eq } from 'drizzle-orm';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { fail } from '@sveltejs/kit';

export async function load({ url }) {
	const allDays = await db.select().from(days).orderBy(days.id);

	const requestedId = parseInt(url.searchParams.get('day') ?? '0');
	const activeDay = allDays.find((d) => d.id === requestedId) ?? allDays[0];

	const daySessions = await db
		.select()
		.from(sessions)
		.where(eq(sessions.dayId, activeDay.id))
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

	// Upload image for a session
	uploadImage: async ({ request }) => {
		const data = await request.formData();
		const id = parseInt(/** @type {string} */ (data.get('id')));
		const file = /** @type {File | null} */ (data.get('image'));

		if (!file || file.size === 0) return fail(400, { message: 'No file provided' });

		const bytes = await file.arrayBuffer();
		const buffer = Buffer.from(bytes);
		const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
		const filename = `session-${id}-${Date.now()}.${ext}`;

		const uploadsDir = join(process.cwd(), 'static', 'uploads');
		mkdirSync(uploadsDir, { recursive: true });
		writeFileSync(join(uploadsDir, filename), buffer);

		const imagePath = `/uploads/${filename}`;
		await db.update(sessions).set({ imagePath }).where(eq(sessions.id, id));

		return { success: true, imagePath };
	}
};
