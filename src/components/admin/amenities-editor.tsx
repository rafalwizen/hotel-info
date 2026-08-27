"use client";

import { useState, useTransition } from "react";
import { ChevronDown, ChevronUp, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SectionIcon } from "@/components/icon";
import {
  deleteAmenityAction,
  moveAmenityAction,
  upsertAmenityAction,
} from "@/server/actions/amenities";
import { SECTION_ICONS } from "@/lib/icons";
import { cn } from "@/lib/utils";

export type EditableAmenity = {
  id: string;
  icon: string;
  label: { pl: string; en: string };
};

const inputClass =
  "h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring dark:bg-input/30";

function IconPicker({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (icon: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {SECTION_ICONS.map((icon) => (
        <button
          key={icon.value}
          type="button"
          title={icon.label}
          aria-label={icon.label}
          aria-pressed={value === icon.value}
          disabled={disabled}
          onClick={() => onChange(icon.value)}
          className={cn(
            "flex size-7 items-center justify-center rounded-md border transition-colors",
            value === icon.value
              ? "border-primary bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted",
          )}
        >
          <SectionIcon name={icon.value} className="size-3.5" />
        </button>
      ))}
    </div>
  );
}

function AmenityRow({
  initial,
  first,
  last,
}: {
  initial: EditableAmenity;
  first: boolean;
  last: boolean;
}) {
  const [labelPl, setLabelPl] = useState(initial.label.pl);
  const [labelEn, setLabelEn] = useState(initial.label.en);
  const [icon, setIcon] = useState(initial.icon);
  const [pending, startTransition] = useTransition();

  const save = () =>
    startTransition(async () => {
      const result = await upsertAmenityAction({
        id: initial.id,
        label: { pl: labelPl, en: labelEn },
        icon,
      });
      if (result?.error) toast.error(result.error);
      else toast.success("Zapisano udogodnienie.");
    });

  return (
    <div className="flex flex-wrap items-start gap-3 rounded-lg border p-3">
      <div className="flex flex-col gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          disabled={first || pending}
          aria-label="Przenieś wyżej"
          onClick={() =>
            startTransition(async () => {
              await moveAmenityAction(initial.id, "up");
            })
          }
        >
          <ChevronUp />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          disabled={last || pending}
          aria-label="Przenieś niżej"
          onClick={() =>
            startTransition(async () => {
              await moveAmenityAction(initial.id, "down");
            })
          }
        >
          <ChevronDown />
        </Button>
      </div>
      <div className="grid min-w-0 flex-1 grid-cols-2 gap-2">
        <input
          value={labelPl}
          onChange={(e) => setLabelPl(e.target.value)}
          placeholder="Nazwa PL *"
          className={inputClass}
        />
        <input
          value={labelEn}
          onChange={(e) => setLabelEn(e.target.value)}
          placeholder="Nazwa EN"
          className={inputClass}
        />
        <div className="col-span-2">
          <IconPicker value={icon} onChange={setIcon} disabled={pending} />
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="button" size="sm" disabled={pending} onClick={save}>
          {pending ? "…" : "Zapisz"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="destructive"
          disabled={pending}
          onClick={() => {
            if (!window.confirm("Usunąć udogodnienie? Zniknie ze wszystkich pokoi.")) return;
            startTransition(async () => {
              const result = await deleteAmenityAction(initial.id);
              if (result?.error) toast.error(result.error);
            });
          }}
        >
          Usuń
        </Button>
      </div>
    </div>
  );
}

function NewAmenityRow({ onDone }: { onDone: () => void }) {
  const [labelPl, setLabelPl] = useState("");
  const [labelEn, setLabelEn] = useState("");
  const [icon, setIcon] = useState("check");
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-start gap-3 rounded-lg border border-dashed p-3">
      <div className="grid min-w-0 flex-1 grid-cols-2 gap-2">
        <input
          value={labelPl}
          onChange={(e) => setLabelPl(e.target.value)}
          placeholder="Nazwa PL *"
          autoFocus
          className={inputClass}
        />
        <input
          value={labelEn}
          onChange={(e) => setLabelEn(e.target.value)}
          placeholder="Nazwa EN"
          className={inputClass}
        />
        <div className="col-span-2">
          <IconPicker value={icon} onChange={setIcon} disabled={pending} />
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          disabled={pending || !labelPl.trim()}
          onClick={() =>
            startTransition(async () => {
              const result = await upsertAmenityAction({
                label: { pl: labelPl, en: labelEn },
                icon,
              });
              if (result?.error) toast.error(result.error);
              else {
                toast.success("Dodano udogodnienie.");
                onDone();
              }
            })
          }
        >
          {pending ? "…" : "Dodaj"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onDone}>
          Anuluj
        </Button>
      </div>
    </div>
  );
}

/** Amenity catalog editor: rows with icon picker, PL/EN labels, reorder. */
export function AmenitiesEditor({ items }: { items: EditableAmenity[] }) {
  const [adding, setAdding] = useState(false);

  return (
    <div className="space-y-3">
      {items.length === 0 && !adding && (
        <p className="text-sm text-muted-foreground">
          Brak udogodnień — dodaj np. „Wi-Fi”, „Klimatyzacja”, „Sejf”.
        </p>
      )}
      {items.map((amenity, index) => (
        <AmenityRow
          key={amenity.id}
          initial={amenity}
          first={index === 0}
          last={index === items.length - 1}
        />
      ))}
      {adding ? (
        <NewAmenityRow onDone={() => setAdding(false)} />
      ) : (
        <Button type="button" variant="outline" onClick={() => setAdding(true)}>
          <Plus /> Dodaj udogodnienie
        </Button>
      )}
    </div>
  );
}
