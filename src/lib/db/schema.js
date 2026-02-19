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
	imagePath: text('image_path'),
	imageSent: integer('image_sent').notNull().default(0),
	confidence: integer('confidence'), // 1–5, null = not yet rated
	work: text('work'), // transcription of student's written work
	mark: text('mark'), // e.g. '6-7', '7+', 'A'
	evaluation: text('evaluation') // LLM feedback text
});
