"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateArrivalMapAction } from "@/server/actions/arrival";

/**
 * Map pin link (Google Maps "share pin" URL) shown as a button on the
 * arrival guide. Saved on the hotel, shared by every room.
 */
export function ArrivalMapForm({ defaultMapUrl }: { defaultMapUrl: string }) {
  const [mapUrl, setMapUrl] = useState(defaultMapUrl);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const result = await updateArrivalMapAction({ mapUrl });
      if (result?.error) toast.error(result.error);
      else toast.success("Zapisano link do mapy.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="arrival-map">Link do pinezki na mapie</Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <MapPin className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="arrival-map"
              placeholder="https://maps.app.goo.gl/…"
              className="pl-8"
              value={mapUrl}
              onChange={(e) => setMapUrl(e.target.value)}
            />
          </div>
          <Button type="button" onClick={save} disabled={saving}>
            {saving ? "Zapisuję…" : "Zapisz"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          W Google Maps stań na właściwym miejscu (np. brama, nie środek budynku),
          kliknij „Udostępnij → Udostępnij pinezkę” i wklej link.
        </p>
      </div>
    </div>
  );
}
