import { drizzle } from 'drizzle-orm/libsql';
import { env } from '$env/dynamic/private';
import * as schema from './schema.js';

export const db = drizzle({
	connection: {
		url: env.TURSO_DATABASE_URL ?? 'file:local.db',
		authToken: env.TURSO_AUTH_TOKEN
	},
	schema
});
