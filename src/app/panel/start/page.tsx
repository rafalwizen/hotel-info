import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { memberships } from "@/db/schema";
import { requireUser } from "@/server/tenancy";
import { OnboardingForm } from "@/components/admin/onboarding-form";
import { LogoutButton } from "@/components/admin/logout-button";

export const metadata = { title: "Skonfiguruj hotel — Hotel Info" };

/** Onboarding wizard: create the first hotel for this account. */
export default async function StartPage() {
  const user = await requireUser();

  const [membership] = await db
    .select({ id: memberships.id })
    .from(memberships)
    .where(eq(memberships.userId, user.id))
    .limit(1);
  if (membership) redirect("/panel/pokoje");

  const guestBase = process.env.GUEST_BASE_URL ?? "http://localhost:3000";

  return (
    <div className="flex flex-1 flex-col p-4 py-10">
      {/* Bare layout (no sidebar yet) — still needs an escape hatch. */}
      <div className="mb-4 flex justify-end">
        <LogoutButton />
      </div>
      <div className="flex flex-1 items-start justify-center">
        <OnboardingForm guestBase={guestBase} />
      </div>
    </div>
  );
}
