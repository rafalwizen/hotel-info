// Dev-only sanity check: prints row counts after seeding. Run: npx tsx --env-file-if-exists=.env db/verify-seed.ts
import { pool } from "../src/db";

async function main() {
  const counts: Array<[string, string]> = [
    ["hotels", "SELECT count(*)::int AS count FROM hotels"],
    ["rooms", "SELECT count(*)::int AS count FROM rooms"],
    ["amenities", "SELECT count(*)::int AS count FROM amenities"],
    ["room_amenities", "SELECT count(*)::int AS count FROM room_amenities"],
    ["hotel_sections", "SELECT count(*)::int AS count FROM hotel_sections"],
    ["room_sections", "SELECT count(*)::int AS count FROM room_sections"],
    ["room_redirects", "SELECT count(*)::int AS count FROM room_redirects"],
    ["memberships", "SELECT count(*)::int AS count FROM memberships"],
  ];

  for (const [label, sql] of counts) {
    const r = await pool.query(sql);
    console.log(label.padEnd(16), r.rows[0].count);
  }
  await pool.end();
}

main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});
