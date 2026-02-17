import { db } from '$lib/db/index.js';
import { days, confidenceRatings } from '$lib/db/schema.js';
import { eq, and } from 'drizzle-orm';

export async function load() {
	const allDays = await db.select().from(days).orderBy(days.id);
	const allRatings = await db.select().from(confidenceRatings);

	// Build a lookup: ratingsMap[subject][dayId] = rating | null
	/** @type {Record<string, Record<number, number | null>>} */
	const ratingsMap = {};
	for (const r of allRatings) {
		if (!ratingsMap[r.subject]) ratingsMap[r.subject] = {};
		ratingsMap[r.subject][r.dayId] = r.rating;
	}

	const SUBJECTS = [
		'English Language',
		'English Literature',
		'History',
		'Maths',
		'Science (Combined)',
		'Spanish',
		'Italian',
		'Citizenship',
		'Drama',
		'PE'
	];

	return { days: allDays, subjects: SUBJECTS, ratingsMap };
}

export const actions = {
	saveRating: async ({ request }) => {
		const data = await request.formData();
		const subject = /** @type {string} */ (data.get('subject'));
		const dayId = parseInt(/** @type {string} */ (data.get('day_id')));
		const ratingRaw = /** @type {string | null} */ (data.get('rating'));
		const rating = ratingRaw ? parseInt(ratingRaw) : null;

		await db
			.update(confidenceRatings)
			.set({ rating })
			.where(and(eq(confidenceRatings.subject, subject), eq(confidenceRatings.dayId, dayId)));

		return { success: true };
	}
};
