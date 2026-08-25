import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

/**
 * Single pg Pool per process. Small max: on serverless (Vercel) each function
 * instance gets its own pool, so keep it low to avoid exhausting Neon
 * connection limits. Use the Neon pooler endpoint in production.
 */
const globalForDb = globalThis as unknown as { dbPool?: Pool };

export const pool =
  globalForDb.dbPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
    idleTimeoutMillis: 20_000,
    connectionTimeoutMillis: 10_000,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.dbPool = pool;
}

export const db = drizzle(pool, { schema });

export type Database = typeof db;
