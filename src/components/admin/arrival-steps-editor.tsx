"use client";

import { useState, useTransition } from "react";
import { ChevronDown, ChevronUp, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  ArrivalStepForm,
  type ArrivalStepFormValues,
} from "@/components/admin/arrival-step-form";
import {
  deleteArrivalStepAction,
  moveArrivalStepAction,
  upsertArrivalStepAction,
} from "@/server/actions/arrival";

export type EditableArrivalStep = ArrivalStepFormValues & { id: string };

/**
 * Editor list for the hotel-wide arrival guide steps: ordered cards with
 * move/delete + "add new". Room overrides live in the room editor instead.
 */
export function ArrivalStepsEditor({ items }: { items: EditableArrivalStep[] }) {
  const [adding, setAdding] = useState(false);
  const [, startTransition] = useTransition();

  const moveStep = (id: string, direction: "up" | "down") =>
    startTransition(async () => {
      const result = await moveArrivalStepAction(id, direction);
      if (result?.error) toast.error(result.error);
    });

  return (
    <div className="space-y-4">
      {items.length === 0 && !adding && (
        <p className="text-sm text-muted-foreground">
          Brak kroków — dodaj pierwszy, np. „Wejście od strony podwórza”.
        </p>
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
                onClick={() => moveStep(item.id, "up")}
                aria-label="Przenieś wyżej"
              >
                <ChevronUp />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                disabled={index === items.length - 1}
                onClick={() => moveStep(item.id, "down")}
                aria-label="Przenieś niżej"
              >
                <ChevronDown />
              </Button>
            </div>
          </div>
          <ArrivalStepForm
            defaultValues={item}
            onSubmit={(values) => upsertArrivalStepAction({ ...values, id: item.id })}
            onDelete={() => deleteArrivalStepAction(item.id)}
          />
        </div>
      ))}

      {adding && (
        <ArrivalStepForm
          title="Nowy krok"
          submitLabel="Dodaj krok"
          defaultValues={{ title: { pl: "", en: "" }, body: { pl: "", en: "" }, photoUrl: null }}
          onSubmit={async (values) => {
            const result = await upsertArrivalStepAction(values);
            if (result?.error) return result;
            setAdding(false);
            toast.success("Dodano krok.");
            return result;
          }}
        />
      )}

      {!adding && (
        <Button type="button" variant="outline" onClick={() => setAdding(true)}>
          <Plus /> Dodaj krok
        </Button>
      )}
    </div>
  );
}
