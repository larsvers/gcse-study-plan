# Stanley's GCSE Revision App

A SvelteKit web app for tracking Stanley's GCSE revision plan. Deployed on Vercel, backed by a Turso (libSQL) database.

## Tech stack

- **Frontend**: SvelteKit 2 + Svelte 5 (runes: `$props`, `$state`)
- **Database**: Turso (hosted libSQL) via Drizzle ORM + `@libsql/client`
- **Deployment**: Vercel (auto-deploy from `main` via `adapter-auto`)
- **Email**: Resend (image uploads emailed as attachments)
- **Markdown**: `marked` (for rendering LLM evaluation feedback)

## Project structure

```
src/
  app.css                 Global styles + dark-mode CSS variables
  app.html                Shell HTML (favicon, viewport)
  lib/
    db/
      index.js            Drizzle client (uses $env/dynamic/private)
      schema.js           Drizzle schema (days + sessions tables)
      seed.js             Standalone Node script to seed the database
  routes/
    +layout.svelte        Nav bar (Home, Plan)
    +page.svelte          Home page (rules, methods, link to plan)
    plan/
      +page.svelte        Plan page (day tabs, session cards)
      +page.server.js     Server load + form actions
static/
  favicon.png
  robots.txt              Disallow all crawlers
```

## Environment variables

Create a `.env` file in the project root (gitignored):

```sh
# Database
TURSO_DATABASE_URL=libsql://gcse-larsvers.aws-eu-west-1.turso.io
TURSO_AUTH_TOKEN=<turso-auth-token>

# For local-only development (comment out the above):
# TURSO_DATABASE_URL=file:local.db
# TURSO_AUTH_TOKEN=

# Resend (image upload emails)
RESEND_API_KEY=<resend-api-key>
NOTIFY_EMAIL=lars@datamake.io
```

These same variables must be set in **Vercel > Project > Settings > Environment Variables** for production.

**Important**: After changing `.env`, you must restart the dev server (`npm run dev`). SvelteKit reads env vars at server start, not on hot reload.

## Local development

```sh
npm install
npm run dev
```

By default, `db/index.js` uses `$env/dynamic/private` to read `TURSO_DATABASE_URL`. To work against the live Turso DB locally, use the remote URL in `.env`. To use a local SQLite file instead, set `TURSO_DATABASE_URL=file:local.db`.

## Database

### Schema (two tables)

**`days`**: `id`, `date`, `label`, `focus`

**`sessions`**: `id`, `day_id`, `sort_order`, `time`, `subject`, `task`, `method`, `is_break`, `done`, `notes`, `time_spent`, `image_path`, `image_sent`, `confidence`, `work`, `mark`, `evaluation`

The schema is defined in `src/lib/db/schema.js` using Drizzle's `sqliteTable`.

### Seeding

The seed script creates tables and populates the revision plan:

```sh
# Seed local SQLite
node src/lib/db/seed.js

# Seed remote Turso (pass env inline)
TURSO_DATABASE_URL=libsql://gcse-larsvers.aws-eu-west-1.turso.io \
TURSO_AUTH_TOKEN=<token> \
node src/lib/db/seed.js
```

The seed script has an "already seeded" guard -- it skips if `days` already has rows. Delete `local.db` to reseed locally.

**Note**: The seed script doesn't create the newer columns (`image_sent`, `confidence`, `work`, `mark`, `evaluation`). These were added via `ALTER TABLE` on the live Turso DB. If reseeding from scratch on a new DB, you'd need to add them manually or update the seed script's `CREATE TABLE` statement.

### Running migrations manually

There's no migration system. Schema changes are done by running `ALTER TABLE` directly against Turso:

```js
// Example one-off migration script (run with node)
import { createClient } from '@libsql/client';
const client = createClient({
	url: 'libsql://gcse-larsvers.aws-eu-west-1.turso.io',
	authToken: '<token>'
});
await client.execute('ALTER TABLE sessions ADD COLUMN my_new_col TEXT');
```

After adding a column to Turso, also update `src/lib/db/schema.js` to match.

### Updating session data (work, mark, evaluation)

To populate the `work`, `mark`, and `evaluation` columns for a session:

```js
import { createClient } from '@libsql/client';
const client = createClient({
	url: 'libsql://gcse-larsvers.aws-eu-west-1.turso.io',
	authToken: '<token>'
});
await client.execute({
	sql: 'UPDATE sessions SET work = ?, mark = ?, evaluation = ? WHERE id = ?',
	args: ['Student wrote...', '6-7', '## Grade Estimate\n**Grade 6-7**...', 42]
});
```

The `evaluation` field supports markdown (rendered via `marked` in the UI).

## Features per session card

| Feature          | How it works                                                                                   |
| ---------------- | ---------------------------------------------------------------------------------------------- |
| **Done**         | Checkbox toggles `done` (0/1). Shows a blue checkmark badge on the card.                       |
| **Confidence**   | Dropdown (1-5), auto-submits on change, color-coded red-to-green.                              |
| **Notes**        | "What I actually did" textarea + time spent, saved via Save button.                            |
| **Image upload** | Sends image as email attachment via Resend (no filesystem storage). Sets `image_sent=1` in DB. |
| **Work**         | Collapsible section showing transcribed student work (if populated).                           |
| **Evaluation**   | Collapsible section with markdown-rendered LLM feedback + mark badge (if populated).           |

## Form actions (server-side)

Defined in `src/routes/plan/+page.server.js`:

- `toggleDone` -- flips `done` between 0 and 1
- `saveSession` -- saves `notes` and `time_spent`
- `saveConfidence` -- saves confidence rating (1-5 or null)
- `uploadImage` -- emails the uploaded image via Resend, sets `image_sent=1`

## Adding new days and sessions (CSV workflow)

> [!NOTE]
> Note that when planning out new sessions, export what has been done before and feed it to a model to help with planning!

The easiest way to add new revision days/sessions is via CSV:

```sh
# 1. Export current data to data/days.csv and data/sessions.csv
npm run db:export

# 2. Open the CSVs in Numbers/Excel/Google Sheets
#    Add new rows at the bottom — leave the "id" column BLANK for new rows
#    For new sessions, set day_id to the id of the day they belong to
#    (check days.csv for the day ids)

# 3. Import — only rows with a blank id get inserted
npm run db:import
```

The scripts read credentials from your `.env` file automatically (via Node's `--env-file` flag).

**sessions.csv columns**: `id`, `day_id`, `sort_order`, `time`, `subject`, `task`, `method`, `is_break`

- `sort_order`: controls the display order within a day (1, 2, 3...)
- `method`: one of `Blurt`, `Past Paper`, `Feynman`, `Active Recall` (or blank)
- `is_break`: `1` for break rows, `0` for study sessions

Existing rows (with an id) are never modified or deleted by the import script.

## Deployment

Pushes to `main` auto-deploy to Vercel. Make sure these env vars are set in Vercel:

- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`
- `RESEND_API_KEY`
- `NOTIFY_EMAIL`

## Useful commands

```sh
npm run dev          # Start dev server
npm run build        # Production build
npm run preview      # Preview production build locally
npm run lint         # Prettier + ESLint check
npm run format       # Auto-format with Prettier
npm run db:seed      # Seed local database
npm run db:export    # Export days + sessions to data/*.csv
npm run db:exportall # Export days + sessions with ALL columns to data/*.csv
npm run db:import    # Import new CSV rows (blank id) into DB
```
