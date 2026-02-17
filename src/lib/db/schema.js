import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

export const days = sqliteTable('days', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	date: text('date').notNull(), // e.g. '2026-02-18'
	label: text('label').notNull(), // e.g. 'Tuesday 18 February'
	focus: text('focus').notNull()
});

export const sessions = sqliteTable('sessions', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	dayId: integer('day_id').notNull(),
	sortOrder: integer('sort_order').notNull(),
	time: text('time'), // e.g. '10:00', 'Evening'
	subject: text('subject'), // e.g. 'History', null for breaks
	task: text('task'),
	method: text('method'), // 'Blurt', 'Past Paper', 'Feynman', 'Active Recall'
	isBreak: integer('is_break').notNull().default(0),
	done: integer('done').notNull().default(0),
	notes: text('notes').default(''),
	timeSpent: integer('time_spent'), // minutes
	imagePath: text('image_path')
});

export const confidenceRatings = sqliteTable('confidence_ratings', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	subject: text('subject').notNull(),
	dayId: integer('day_id').notNull(),
	rating: integer('rating') // 1, 2, or 3 — null = not yet rated
});
