"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

async function copyText(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    // Clipboard API needs a secure context — dev over http://localhost is fine.
    return false;
  }
}

/**
 * The whole point of the arrival guide: a link the owner pastes into
 * Booking.com / SMS / WhatsApp instead of typing directions every time.
 */
export function ShareLinkCard({
  url,
  messageTemplate,
}: {
  url: string;
  /** Message with {link} placeholder, ready to paste into a guest chat. */
  messageTemplate: string;
}) {
  const [copied, setCopied] = useState<"link" | "message" | null>(null);

  const copy = async (kind: "link" | "message") => {
    const value = kind === "link" ? url : messageTemplate.replaceAll("{link}", url);
    if (await copyText(value)) {
      setCopied(kind);
      toast.success(kind === "link" ? "Link skopiowany." : "Wiadomość skopiowana.");
      setTimeout(() => setCopied(null), 2000);
    } else {
      toast.error("Nie udało się skopiować — skopiuj link ręcznie.");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Link do wysłania gościom</CardTitle>
        <CardDescription>
          Wklej go w wiadomości na Bookingu, SMS-em lub WhatsAppem — zamiast
          za każdym razem opisywać drogę.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="rounded-md border bg-muted/50 px-3 py-2 font-mono text-sm break-all">
          {url}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => copy("link")}>
            {copied === "link" ? <Check /> : <Copy />}
            Kopiuj link
          </Button>
          <Button type="button" variant="outline" onClick={() => copy("message")}>
            {copied === "message" ? <Check /> : <Copy />}
            Kopiuj wiadomość
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
