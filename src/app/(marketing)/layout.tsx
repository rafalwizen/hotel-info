import { Bricolage_Grotesque } from "next/font/google";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin", "latin-ext"],
});

/**
 * Marketing shell (landing, cennik, kontakt). Display face is scoped to
 * this group only — the app itself keeps Geist.
 */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${bricolage.variable} flex min-h-dvh flex-col bg-white text-neutral-900`}>
      <SiteHeader />
      <div className="flex-1">{children}</div>
      <SiteFooter />
    </div>
  );
}
