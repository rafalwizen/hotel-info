import { sql } from "drizzle-orm";
import { db } from "@/db";

/**
 * Liveness + database probe. Also pinged hourly by the Vercel cron
 * (vercel.json) so the Neon compute stays warm between sporadic QR scans.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await db.execute(sql`select 1`);
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 503 });
  }
}
