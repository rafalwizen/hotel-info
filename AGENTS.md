<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project rules — Hotel Info (multi-tenant SaaS)

## Multi-tenancy (CRITICAL)

- Every tenant-scoped database table carries `hotelId`.
- Every admin/server query MUST start with `requireHotel()` from `src/server/tenancy.ts` and include `eq(table.hotelId, hotelId)`.
- IDs coming from URLs (`/panel/pokoje/[id]`) are NEVER trusted alone: always `and(eq(id), eq(hotelId))`. Return **404**, not 403 (no existence leaks).
- Every admin mutation MUST end with `revalidatePath(`/${hotel.slug}`, "layout")` so guest pages refresh immediately.

## Reserved top-level slugs

Guest pages live at `/(guest)/[hotel]/[room]`, i.e. they own EVERY top-level path segment that is not a static route. When adding ANY new top-level route (file or folder directly under `src/app/`), you MUST also add its slug to `RESERVED_SLUGS` in `src/lib/slug.ts`.

## Reserved room slugs

The same collision exists one level down: static routes directly under `src/app/(guest)/[hotel]/` (e.g. `/{hotel}/dojazd`) compete with room slugs. When adding ANY new second-level guest route, you MUST also add its slug to `RESERVED_ROOM_SLUGS` in `src/lib/slug.ts` (enforced by `roomSchema`).

## Language rules

- Code comments, identifiers, commit messages: English.
- Admin panel UI copy: Polish. Guest pages: PL/EN bilingual (Localized jsonb). Marketing: Polish.

## Stack conventions

- Drizzle ORM (`src/db/schema.ts`); migrations in `drizzle/` are checked in. Never edit generated SQL by hand except self-referencing FKs.
- Auth.js v5 (Credentials, JWT sessions). Sessions checked via `auth()`.
- Server Actions for all admin mutations; react-hook-form + zod schemas shared from `src/lib/validation/`.
- Guest pages: noindex (wifi passwords), ISR with `revalidate = 300`.
- QR codes always black-on-white, EC level M, SVG for print / PNG >= 1024px for download.

