# Hotel Info

Multi-tenant SaaS for small hotels, guesthouses and farm stays (typical Booking.com
listings). The owner prints a QR sticker for every room; the guest scans it and gets a
mobile page with room-specific info (equipment how-tos) plus hotel info (wi-fi,
breakfast, check-out) — bilingual PL/EN, no app, no login.

## Stack

| Layer    | Choice                                                          |
| -------- | --------------------------------------------------------------- |
| Framework| Next.js 16 (App Router, TypeScript, Turbopack)                   |
| DB       | Neon Postgres (`aws-eu-central-1`) + Drizzle ORM                 |
| Auth     | Auth.js v5 (Credentials, JWT sessions)                           |
| UI       | Tailwind v4; shadcn/ui in the panel, plain Tailwind for guests   |
| QR       | `qrcode` — SVG for print, PNG ≥1024px for download, EC level M   |
| Tests    | Vitest (unit) + Playwright (e2e, fresh dev server per run)       |

## Local development

```bash
cp .env.example .env        # fill DATABASE_URL (Neon branch) + AUTH_SECRET
npm install
npm run db:migrate          # apply drizzle/ migrations
npm run db:seed             # optional: demo hotel (WILLA WIPE — dev only!)
npm run dev
```

Seed gives you `demo@hotelinfo.test` / `demo1234` and hotel `willa-mazury`
(rooms 101, 102, apartament — old slug `201` redirects).

## Scripts

| Script              | Purpose                                    |
| ------------------- | ------------------------------------------ |
| `npm run dev`       | Dev server (Turbopack)                      |
| `npm run build`     | Production build                            |
| `npm run typecheck` | `tsc --noEmit`                              |
| `npm run lint`      | ESLint                                      |
| `npm run test`      | Vitest unit tests (no DB needed)            |
| `npm run test:e2e`  | Playwright; boots a fresh dev server        |
| `npm run db:*`      | drizzle-kit generate / migrate / studio, seed |

## Project rules (see AGENTS.md for the full list)

- Every admin/server query starts with `requireHotel()` and filters by `hotelId`.
- URL ids are never trusted alone — always `and(eq(id), eq(hotelId))`, return 404.
- Every admin mutation ends with `revalidatePath(`/${hotel.slug}`, "layout")`.
- Any new top-level route must be added to `RESERVED_SLUGS` in `src/lib/slug.ts`;
  any new static route under `/(guest)/[hotel]/` — `RESERVED_ROOM_SLUGS`.
- Code comments / identifiers / commits: English. Admin UI: Polish. Guest pages: PL/EN.

## CI (GitHub Actions)

`.github/workflows/ci.yml` runs on every push/PR:

1. **verify** — `npm ci → typecheck → lint → test → build` (no database).
2. **e2e** (origin repo only) — creates a throwaway Neon branch, migrates, runs the
   full Playwright suite against a dev server on that branch, deletes the branch,
   uploads the HTML report on failure.

Required repository secrets for the e2e job:

- `NEON_API_KEY` — Neon console → Account → API keys
- `NEON_PROJECT_ID` — Neon console → project Settings

Until both exist, PRs are gated by `verify` alone.

## Deploy runbook (Vercel)

1. **Import** the repo in Vercel (framework preset: Next.js, build command default).
2. **Environment variables** (Production, same for Preview if you want working previews):
   - `DATABASE_URL` — Neon **pooled** connection string (`-pooler` host)
   - `AUTH_SECRET` — `npx auth secret`
   - `GUEST_BASE_URL` — `https://<short-qr-domain>` (no trailing slash)
   - `RESEND_API_KEY` / `EMAIL_FROM` — optional, password-reset email
   - `BLOB_READ_WRITE_TOKEN` — created by step 3, do not set by hand
3. **Storage**: Vercel console → Storage → Blob → Create database → connect it
   to this project (adds `BLOB_READ_WRITE_TOKEN`) → Redeploy. Required for
   arrival-guide photo uploads in the panel.
4. **Domains**: add both the app domain and the short QR domain to the project.
   Guest URLs are path-based on the same app, so no redirects are needed.
5. **First release migrations** (local terminal, against production DB):

   ```bash
   DATABASE_URL="<prod-pooled-url>" npm run db:migrate
   ```

   ⚠️ `db:seed` wipes all data — never run it against production.
6. **Cron**: none for now — the Hobby plan only allows daily crons and Neon
   auto-wakes on first request (~0.5s cold start). On Pro, re-add an hourly
   `/api/health` ping in `vercel.json` to keep compute warm.
7. **Post-deploy checks**: `/api/health` returns `{"ok":true}`, signup → onboarding
   works, QR previews in the panel show the production QR domain.

## Domain notes

Guest QR codes encode `GUEST_BASE_URL/{hotel-slug}/{room-slug}`. The
short domain (4–7 chars) keeps the QR pattern simple, which matters at a 20mm
sticker size. `src/lib/site.ts` holds marketing placeholder constants
(`CONTACT_EMAIL`, `DEMO_STICKER_DOMAIN`) — update them once the domains are bought.
