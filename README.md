# Event Wall

Event Wall is a campus event discovery platform for students, clubs and administrators. It uses Next.js 14, the App Router, TypeScript, Tailwind CSS and Supabase.

## Local development

1. Install dependencies with `npm install`.
2. Copy `.env.local.example` to `.env.local` and fill in the values from your Supabase project:
   - `NEXT_PUBLIC_SUPABASE_URL`: the project URL.
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: the project anon/public key.
   - `SUPABASE_SERVICE_ROLE_KEY`: the service role key. Keep this secret and use it only in trusted server-side code.
3. Apply the database migration (steps below).
4. Run `npm run dev` and visit [http://localhost:3000](http://localhost:3000).

## Run the Supabase migration locally

Install the [Supabase CLI](https://supabase.com/docs/guides/cli), then from the project directory:

```bash
supabase login
supabase init
supabase start
supabase db reset
```

The migration at `supabase/migrations/0001_init.sql` is applied by `supabase db reset` to the local database. To apply it to a hosted project instead, link the project with `supabase link --project-ref <project-ref>` and run `supabase db push`.

The club portal adds `supabase/migrations/0002_club_portal_policies.sql`. Run `supabase db push` for a linked project or execute that migration in the Supabase SQL Editor before club accounts use the portal. It grants club users read access to their own account link and categories, limits profile updates to editable profile columns, restricts event writes by club ownership and status, and creates the `posters` and `logos` buckets with club-folder-scoped write policies.

The admin moderation workflow adds `supabase/migrations/0003_archive_events.sql`. Apply it before using the archive action in production. Archiving changes an approved event to `archived`, removing it from student discovery while retaining the event and its review history for administrators and the club.

The public event wall adds `supabase/migrations/0004_public_category_read.sql`, which permits anonymous visitors to read category labels used on event cards and filters. Apply it before using category filters on the public wall.

## Production launch

Configure `SITE_URL` to the exact canonical HTTPS origin (for local development, use your local origin). `src/app/robots.ts` and the dynamic `src/app/sitemap.ts` use it; the sitemap includes active club pages and approved events for active clubs. Admin and club portals are disallowed in `robots.txt`.

The app-level write/login throttles use an in-memory per-process store (login: 5 attempts per IP/email and 20 per IP in 15 minutes; event submissions: 10 per club and 30 per IP per hour; admin club mutations: 20 per admin/IP per hour). This is best-effort protection for a small launch; serverless instances do not share counters, so configure Supabase Auth rate limits as an additional control.

Before deploying, link the Supabase CLI to the production project and inspect both the migration history and RLS definitions. `supabase/verify_production_policies.sql` is a read-only query for the Supabase SQL Editor. Do not blindly replay these migrations: `0001` creates the schema and `0002` contains non-idempotent policy creation. After comparing the live policies and schema with migrations `0001`–`0004`, use `supabase migration list --linked` and `supabase db push --dry-run`; only push migrations that are missing and whose effects have been reviewed. If migrations were run manually in SQL Editor, record them with `supabase migration repair --status applied <version>` only after verifying their complete effects.

Vercel uses the settings in `vercel.json`: Next.js framework, `npm ci`, and `npm run build`. In Vercel → Project → Settings → Environment Variables, add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `SITE_URL` for Production (and Preview if preview deployments should access the same project). Keep the service-role value server-only. Then import the Git repository in Vercel, deploy, and add your domain under Settings → Domains; configure the DNS records Vercel shows at your registrar. Update `SITE_URL` to the final canonical HTTPS domain and redeploy.

No Vercel project is linked to this checkout, and no deployment URL/domain is configured here. Run Lighthouse against the deployed URL after the first deployment to obtain a production mobile score.

The first administrator must be added to `public.admins` after their Auth user has been created. Use the Supabase SQL editor or a trusted admin-only setup script; never expose the service role key in browser code.

## Supabase Storage

Create `posters` and `logos` Storage buckets for event artwork and club logos. Configure upload and read policies before enabling uploads in the app.
