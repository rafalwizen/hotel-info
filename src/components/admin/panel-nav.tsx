"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BedDouble,
  LayoutTemplate,
  QrCode,
  Settings,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/panel/pokoje", label: "Pokoje", icon: BedDouble },
  { href: "/panel/szablon-pokoi", label: "Szablon pokoi", icon: LayoutTemplate },
  { href: "/panel/udogodnienia", label: "Udogodnienia", icon: Sparkles },
  { href: "/panel/qr", label: "Kody QR", icon: QrCode },
  { href: "/panel/ustawienia", label: "Ustawienia", icon: Settings },
] as const;

export function PanelNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto md:flex-col">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
