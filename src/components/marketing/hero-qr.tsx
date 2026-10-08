"use client";

import { useEffect, useState } from "react";
import { qrSvg } from "@/lib/qr";
import { cn } from "@/lib/utils";

/**
 * Live QR encoding the demo hotel's room 101 page (<current-origin>/willa-mazury/101),
 * so scanning it with a phone opens the real guest page — the marketing page
 * demonstrates the product with the product itself. Generated client-side
 * (origin is unknown at build time); a skeleton holds the box until the SVG
 * lands.
 */
export function HeroQr({ className }: { className?: string }) {
  const [svg, setSvg] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    qrSvg(`${window.location.origin}/willa-mazury/101`)
      .then((rendered) => {
        if (alive) setSvg(rendered);
      })
      .catch(() => {
        // Leave the skeleton — the page stays usable without the trick.
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div
      data-hero-qr
      aria-hidden
      className={cn("aspect-square w-full [&>svg]:h-full [&>svg]:w-full", className)}
    >
      {svg === null ? (
        <div className="size-full animate-pulse rounded-sm bg-neutral-100" />
      ) : (
        <div className="size-full [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: svg }} />
      )}
    </div>
  );
}
