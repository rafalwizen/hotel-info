"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SectionIcon } from "@/components/icon";
import { setRoomAmenitiesAction } from "@/server/actions/rooms";
import { cn } from "@/lib/utils";

export type AmenityOption = { id: string; icon: string; labelPl: string };

/**
 * Toggle chips over the hotel's amenity catalog; save persists the set.
 * The parent remounts this component (key) when the server sends fresh
 * data after revalidation, so no state-sync effect is needed.
 */
export function RoomAmenities({
  roomId,
  options,
  initialIds,
}: {
  roomId: string;
  options: AmenityOption[];
  initialIds: string[];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(initialIds));
  const [dirty, setDirty] = useState(false);
  const [pending, startTransition] = useTransition();

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setDirty(true);
  };

  const save = () =>
    startTransition(async () => {
      const result = await setRoomAmenitiesAction(roomId, [...selected]);
      if (result?.error) toast.error(result.error);
      else {
        toast.success("Zapisano udogodnienia.");
        setDirty(false);
      }
    });

  if (options.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Najpierw dodaj udogodnienia w sekcji „Udogodnienia” — wtedy będziesz mógł
        przypisać je do pokoju.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {options.map((amenity) => {
          const active = selected.has(amenity.id);
          return (
            <button
              key={amenity.id}
              type="button"
              onClick={() => toggle(amenity.id)}
              aria-pressed={active}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
                active
                  ? "border-primary bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              <SectionIcon name={amenity.icon} className="size-3.5" />
              {amenity.labelPl}
            </button>
          );
        })}
      </div>
      <Button type="button" size="sm" disabled={!dirty || pending} onClick={save}>
        {pending ? "Zapisywanie…" : "Zapisz udogodnienia"}
      </Button>
    </div>
  );
}
