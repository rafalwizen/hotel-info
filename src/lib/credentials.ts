import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { verifyPassword } from "@/lib/password";
import { loginSchema } from "@/lib/validation/auth";

/**
 * A cost-12 hash of an unguessable throwaway string. Comparing against it
 * when the email is unknown keeps the response time identical to the
 * user-found path, so login timing cannot enumerate accounts.
 */
const DUMMY_HASH = "$2b$12$6Ts7ypc4kMVIWwYHw6AYqugPkH7HZ/SecSv3w3a2dgZSn77xjS.2W";

/**
 * Shared credential check used by the NextAuth authorize() callback and by
 * server actions that need to know validity BEFORE calling signIn() —
 * signIn() must never sit inside a try/catch because its success path
 * throws NEXT_REDIRECT, which must propagate uncaught (Next.js 16).
 */
export async function verifyCredentials(raw: {
  email: unknown;
  password: unknown;
}): Promise<{ id: string; email: string; name: string } | null> {
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) return null;

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, parsed.data.email))
    .limit(1);
  if (!user) {
    // Same bcrypt work as the found path — equal timing, no enumeration.
    await verifyPassword(parsed.data.password, DUMMY_HASH);
    return null;
  }

  const ok = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!ok) return null;

  return { id: user.id, email: user.email, name: user.name };
}
