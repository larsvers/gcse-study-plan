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
      schema.js           Drizzle schema (single flat sessions table)
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

### Schema (single flat table)

**`sessions`**: `id`, `date`, `label`, `focus`, `sort_order`, `time`, `subject`, `task`, `method`, `is_break`, `done`, `notes`, `time_spent`, `image_path`, `image_sent`, `confidence`, `work`, `mark`, `evaluation`, `work_updated`

`date`/`label`/`focus` are the day-level fields — they repeat on every session row for that day. This makes the CSV export self-contained and easy to edit.

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

The seed script has an "already seeded" guard — it skips if `sessions` already has rows. Delete `local.db` to reseed locally.

### One-time migration (days + sessions → flat sessions)

If you're migrating an existing database from the old two-table schema, run:

```sh
npm run db:migrate                                                       # local.db
TURSO_DATABASE_URL=libsql://... TURSO_AUTH_TOKEN=<token> npm run db:migrate  # Turso
```

This renames `sessions` → `sessions_old`, creates the new flat `sessions` table, copies all data across via a JOIN, then drops `sessions_old` and `days`. **Run once only — it is not idempotent.**

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

## Adding and editing sessions (CSV workflow)

> [!NOTE]
> When planning new sessions, export first and feed the data to a model to help with planning!

All schedule editing goes through a single `data/sessions.csv`. The workflow is:

```sh
# 1. Export the current schedule
npm run db:export

# 2. Edit data/sessions.csv — change times, move sessions to different dates,
#    fix tasks, add new rows (leave id blank for new rows)

# 3. Import back
npm run db:import
```

The scripts read credentials from your `.env` file automatically (via Node's `--env-file` flag).

**How import works:**
- Rows **with an id** → UPDATE that session (planning columns only; progress data like `done`, `notes`, `confidence` is left untouched)
- Rows **with a blank id** → INSERT as a new session

**sessions.csv columns** (planning export): `id`, `date`, `label`, `focus`, `sort_order`, `time`, `subject`, `task`, `method`, `is_break`

- `date`: ISO format `YYYY-MM-DD` — this is how sessions are grouped into days
- `label`: human-readable day name shown in the tab, e.g. `Tuesday 18 Feb`
- `focus`: motivational blurb shown at the top of the day view
- `sort_order`: display order within a day (1, 2, 3…)
- `method`: one of `Blurt`, `Past Paper`, `Feynman`, `Active Recall` (or blank)
- `is_break`: `1` for break rows, `0` for study sessions

To move a session to a different day, just change its `date` (and update `label`/`focus` to match if needed).

### ⚠️ Pitfall: Excel and date columns

Excel auto-reformats date-looking values (`2026-02-18` → `18/02/2026`) when you save as CSV. To prevent this: select the `date` column → Format Cells → **Text** _before_ editing. Google Sheets and plain text editors don't have this problem.

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
npm run db:migrate   # One-time migration from old days+sessions schema to flat sessions
npm run db:export    # Export sessions to data/sessions.csv (planning columns)
npm run db:exportall # Export sessions to data/sessions.csv (all columns incl. progress)
npm run db:import    # Upsert from CSV: UPDATE rows with id, INSERT rows without
```
