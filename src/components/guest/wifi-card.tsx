"use client";

import { useEffect, useRef, useState } from "react";
import { Copy, Eye, EyeOff, Wifi } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { gs } from "@/components/guest/strings";

/**
 * Wi-Fi card — the one branded surface on the page and the number-one
 * reason guests scan the sticker. The password ships masked (dots) and is
 * never placed in meta/OG; "Show" reveals it, "Copy" puts it on the
 * clipboard. Hidden entirely when the hotel has no SSID configured.
 */
export function WifiCard({
  ssid,
  password,
  locale,
}: {
  ssid: string;
  password: string;
  locale: Locale;
}) {
  const [revealed, setRevealed] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const resetTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(resetTimer.current), []);

  if (!ssid) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopyState("copied");
    } catch {
      // No clipboard API (insecure context / permission denied) — reveal
      // the value so press-and-hold copy still works.
      setRevealed(true);
      setCopyState("failed");
    }
    window.clearTimeout(resetTimer.current);
    resetTimer.current = window.setTimeout(() => setCopyState("idle"), 2500);
  };

  return (
    <section
      aria-label="Wi-Fi"
      className="rounded-2xl border border-(--hotel-primary)/30 bg-(--hotel-primary)/[0.07] p-5"
    >
      <div className="flex items-center gap-2.5">
        <span className="flex size-8 items-center justify-center rounded-lg bg-(--hotel-primary)/10 text-(--hotel-primary)">
          <Wifi className="size-4" aria-hidden />
        </span>
        <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-(--hotel-primary)">
          Wi-Fi
        </h2>
      </div>

      <dl className="mt-4 space-y-3">
        <div>
          <dt className="text-xs font-medium text-neutral-600">{gs("network", locale)}</dt>
          <dd className="font-mono text-lg font-semibold tracking-wide break-all">{ssid}</dd>
        </div>

        {password && (
          <div>
            <dt className="text-xs font-medium text-neutral-600">{gs("password", locale)}</dt>
            <dd className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <span
                aria-live="polite"
                className="font-mono text-lg font-semibold tracking-[0.12em] break-all select-all"
              >
                {revealed ? password : "•".repeat(Math.min(password.length, 16))}
              </span>
              <span className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setRevealed((v) => !v)}
                  className="flex items-center gap-1.5 rounded-full border border-(--hotel-primary)/40 px-3 py-1 text-xs font-semibold text-(--hotel-primary) transition-colors hover:bg-(--hotel-primary)/10"
                >
                  {revealed ? <EyeOff className="size-3.5" aria-hidden /> : <Eye className="size-3.5" aria-hidden />}
                  {revealed ? gs("hide", locale) : gs("show", locale)}
                </button>
                <button
                  type="button"
                  onClick={copy}
                  className="flex items-center gap-1.5 rounded-full border border-(--hotel-primary)/40 px-3 py-1 text-xs font-semibold text-(--hotel-primary) transition-colors hover:bg-(--hotel-primary)/10"
                >
                  <Copy className="size-3.5" aria-hidden />
                  {gs("copy", locale)}
                </button>
              </span>
            </dd>
            {copyState !== "idle" && (
              <p
                className={
                  copyState === "copied"
                    ? "mt-1.5 text-xs font-medium text-(--hotel-primary)"
                    : "mt-1.5 text-xs font-medium text-neutral-500"
                }
              >
                {copyState === "copied" ? gs("copied", locale) : gs("copyFailed", locale)}
              </p>
            )}
          </div>
        )}
      </dl>
    </section>
  );
}
