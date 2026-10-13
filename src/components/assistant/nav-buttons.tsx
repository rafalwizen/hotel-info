"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { NavAction } from "./use-assistant";

/** Whitelisted navigation links the model asked the server to offer. */
export function NavButtons({ actions }: { actions: NavAction[] }) {
  if (actions.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {actions.map((action) => (
        <Button key={action.href} asChild variant="outline" size="sm">
          <Link href={action.href}>
            {action.label}
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </Button>
      ))}
    </div>
  );
}
