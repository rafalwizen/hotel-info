"use client";

import { useState, useTransition } from "react";
import { ChevronDown, ChevronUp, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SectionForm, type SectionFormValues } from "@/components/admin/section-form";
import {
  deleteHotelSectionAction,
  deleteTemplateSectionAction,
  moveHotelSectionAction,
  moveTemplateSectionAction,
  upsertHotelSectionAction,
  upsertTemplateSectionAction,
} from "@/server/actions/sections";

export type EditableSection = SectionFormValues & { id: string };
export type SectionScope = "template" | "hotel";

const ACTIONS = {
  template: {
    save: upsertTemplateSectionAction,
    remove: deleteTemplateSectionAction,
    move: moveTemplateSectionAction,
  },
  hotel: {
    save: upsertHotelSectionAction,
    remove: deleteHotelSectionAction,
    move: moveHotelSectionAction,
  },
} as const;

/**
 * Generic editor list for section sets (room templates / hotel sections):
 * existing cards with move/delete + "add new" card. Scope selects the
 * server actions to call.
 */
export function SectionsEditor({
  scope,
  items,
  addLabel = "Dodaj sekcję",
  emptyHint = "Brak sekcji — dodaj pierwszą.",
}: {
  scope: SectionScope;
  items: EditableSection[];
  addLabel?: string;
  emptyHint?: string;
}) {
  const { save, remove, move } = ACTIONS[scope];
  const [adding, setAdding] = useState(false);
  const [, startTransition] = useTransition();

  const moveSection = (id: string, direction: "up" | "down") =>
    startTransition(async () => {
      const result = await move(id, direction);
      if (result?.error) toast.error(result.error);
    });

  return (
    <div className="space-y-4">
      {items.length === 0 && !adding && (
        <p className="text-sm text-muted-foreground">{emptyHint}</p>
      )}

      {items.map((item, index) => (
        <div key={item.id} className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">#{index + 1}</span>
            <div className="flex gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                disabled={index === 0}
                onClick={() => moveSection(item.id, "up")}
                aria-label="Przenieś wyżej"
              >
                <ChevronUp />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                disabled={index === items.length - 1}
                onClick={() => moveSection(item.id, "down")}
                aria-label="Przenieś niżej"
              >
                <ChevronDown />
              </Button>
            </div>
          </div>
          <SectionForm
            defaultValues={item}
            onSubmit={(values) => save({ ...values, id: item.id })}
            onDelete={() => remove(item.id)}
          />
        </div>
      ))}

      {adding && (
        <SectionForm
          title={addLabel}
          defaultValues={{ title: { pl: "", en: "" }, body: { pl: "", en: "" }, icon: "info", enabled: true }}
          onSubmit={async (values) => {
            const result = await save(values);
            if (result?.error) return result;
            setAdding(false);
            toast.success("Dodano sekcję.");
            return result;
          }}
        />
      )}

      {!adding && (
        <Button type="button" variant="outline" onClick={() => setAdding(true)}>
          <Plus /> {addLabel}
        </Button>
      )}
    </div>
  );
}
