/** @type {import('drizzle-kit').Config} */
export default {
	schema: './src/lib/db/schema.js',
	out: './drizzle',
	dialect: 'turso',
	dbCredentials: {
		url: process.env.TURSO_DATABASE_URL ?? 'file:local.db',
		authToken: process.env.TURSO_AUTH_TOKEN
	}
};
