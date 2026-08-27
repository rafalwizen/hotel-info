import Link from "next/link";
import { eq } from "drizzle-orm";
import { Toaster } from "sonner";
import { db } from "@/db";
import { memberships } from "@/db/schema";
import { requireUser } from "@/server/tenancy";
import { LogoutButton } from "@/components/admin/logout-button";
import { PanelNav } from "@/components/admin/panel-nav";

export const metadata = { title: "Panel — Hotel Info" };

/**
 * Panel shell. Renders the sidebar only when the user already owns a hotel;
 * the onboarding route (/panel/start) renders bare — requireHotel() there
 * would redirect-loop.
 */
export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const [membership] = await db
    .select({ id: memberships.id })
    .from(memberships)
    .where(eq(memberships.userId, user.id))
    .limit(1);

  if (!membership) {
    return (
      <>
        {children}
        <Toaster richColors position="bottom-right" />
      </>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-4 md:flex-row md:gap-10 md:p-8 print:block print:max-w-none print:p-0">
      <aside className="flex shrink-0 flex-col gap-6 md:w-52 print:hidden">
        <Link href="/panel" className="text-lg font-bold tracking-tight">
          Hotel&nbsp;Info
        </Link>
        <PanelNav />
        <div className="mt-auto space-y-1 border-t pt-4">
          <p className="truncate text-xs text-muted-foreground" title={user.email}>
            {user.email}
          </p>
          <LogoutButton />
        </div>
      </aside>
      <main className="min-w-0 flex-1 space-y-6 pb-16 print:pb-0">{children}</main>
      <Toaster richColors position="bottom-right" className="print:hidden" />
    </div>
  );
}
