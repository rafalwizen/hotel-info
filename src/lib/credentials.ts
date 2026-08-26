import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { verifyPassword } from "@/lib/password";
import { loginSchema } from "@/lib/validation/auth";

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
  if (!user) return null;

  const ok = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!ok) return null;

  return { id: user.id, email: user.email, name: user.name };
}
