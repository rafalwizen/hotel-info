"use server";

import { createHash, randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { and, eq, gt, lt } from "drizzle-orm";
import { db } from "@/db";
import { passwordResetTokens, users } from "@/db/schema";
import { signIn } from "@/lib/auth";
import { verifyCredentials } from "@/lib/credentials";
import { hashPassword } from "@/lib/password";
import { rateLimit, clearRateLimit } from "@/lib/rate-limit";
import { sendEmail, passwordResetEmailHtml } from "@/lib/email";
import {
  loginSchema,
  requestResetSchema,
  resetPasswordSchema,
  signupSchema,
  type AuthActionState,
} from "@/lib/validation/auth";

// Failed attempts only: a success clears the bucket, so staff sharing one
// office IP never lock each other out while brute force stays capped.
const LOGIN_LIMIT = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
}

/** Only allow relative, single-slash paths (open-redirect protection). */
function safeNextPath(value: FormDataEntryValue | null): string {
  const raw = typeof value === "string" ? value : "";
  return raw.startsWith("/") && !raw.startsWith("//") ? raw : "/panel";
}

function firstFieldError(error: unknown): string | undefined {
  if (error && typeof error === "object" && "issues" in error) {
    const issues = (error as { issues: Array<{ message: string }> }).issues;
    return issues[0]?.message;
  }
  return undefined;
}

export async function signupAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: firstFieldError(parsed.error) ?? "Sprawdź poprawność danych" };
  }

  const { name, email, password } = parsed.data;
  const passwordHash = await hashPassword(password);

  try {
    await db.insert(users).values({ email, name, passwordHash });
  } catch (err) {
    if (
      err instanceof Error &&
      "code" in err &&
      (err as { code?: string }).code === "23505"
    ) {
      return { error: "Konto z tym adresem e-mail już istnieje. Zaloguj się." };
    }
    console.error("[signup] insert failed", err);
    return { error: "Nie udało się utworzyć konta. Spróbuj ponownie." };
  }

  // signIn throws NEXT_REDIRECT on success — must stay outside try/catch.
  await signIn("credentials", { email, password, redirectTo: "/panel" });
}

export async function loginAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: firstFieldError(parsed.error) ?? "Sprawdź poprawność danych" };
  }

  const limiterKey = `login:${await clientIp()}`;
  const { allowed, retryAfterSec } = rateLimit(limiterKey, LOGIN_LIMIT, LOGIN_WINDOW_MS);
  if (!allowed) {
    return {
      error: `Zbyt wiele prób logowania. Spróbuj ponownie za ${Math.ceil(retryAfterSec / 60)} min.`,
    };
  }

  // Verify BEFORE signIn: signIn must run outside try/catch because its
  // success path throws NEXT_REDIRECT (Next.js 16 requirement).
  const user = await verifyCredentials(parsed.data);
  if (!user) {
    return { error: "Nieprawidłowy e-mail lub hasło." };
  }

  // Success clears the bucket — only failures count towards the limit.
  clearRateLimit(limiterKey);

  const redirectTo = safeNextPath(formData.get("next"));
  await signIn("credentials", {
    email: parsed.data.email,
    password: parsed.data.password,
    redirectTo,
  });
}

export async function requestPasswordResetAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = requestResetSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: firstFieldError(parsed.error) ?? "Podaj poprawny adres e-mail" };
  }

  const limiter = rateLimit(`reset:${await clientIp()}`, 5, LOGIN_WINDOW_MS);
  if (!limiter.allowed) {
    return { error: "Zbyt wiele prób. Spróbuj ponownie później." };
  }

  const { email } = parsed.data;
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  // Always the same response — no account enumeration.
  if (user) {
    // Opportunistic cleanup of expired tokens
    await db.delete(passwordResetTokens).where(lt(passwordResetTokens.expiresAt, new Date()));

    const token = randomBytes(32).toString("base64url");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    await db.insert(passwordResetTokens).values({
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    });

    const h = await headers();
    const proto = h.get("x-forwarded-proto") ?? "http";
    const host = h.get("host") ?? "localhost:3000";
    const link = `${proto}://${host}/reset-hasla?token=${encodeURIComponent(token)}`;

    try {
      await sendEmail({
        to: email,
        subject: "Reset hasła — Hotel Info",
        html: passwordResetEmailHtml(link),
      });
    } catch (err) {
      console.error("[reset] email send failed", err);
    }
  }

  return {
    success: "Jeśli konto z tym adresem istnieje, wysłaliśmy link do zmiany hasła.",
  };
}

export async function resetPasswordAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: firstFieldError(parsed.error) ?? "Sprawdź poprawność danych" };
  }

  const { token, password } = parsed.data;
  const tokenHash = createHash("sha256").update(token).digest("hex");

  const [row] = await db
    .select({ userId: passwordResetTokens.userId })
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.tokenHash, tokenHash),
        gt(passwordResetTokens.expiresAt, new Date()),
      ),
    )
    .limit(1);

  if (!row) {
    return { error: "Link jest nieprawidłowy lub wygasł. Poproś o nowy." };
  }

  await db
    .update(users)
    .set({ passwordHash: await hashPassword(password) })
    .where(eq(users.id, row.userId));
  // Invalidate all reset tokens for this user (single use)
  await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, row.userId));

  const [user] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, row.userId))
    .limit(1);

  // Auto-login after successful reset; throws NEXT_REDIRECT outside try/catch.
  await signIn("credentials", {
    email: user.email,
    password,
    redirectTo: "/panel",
  });
}
