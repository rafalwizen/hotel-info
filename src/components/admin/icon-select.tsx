"use client";

import { useFormContext } from "react-hook-form";
import { SectionIcon } from "@/components/icon";
import { SECTION_ICONS } from "@/lib/icons";

/** Native select over the curated icon catalog, with live preview. */
export function IconSelect({
  name,
  label,
}: {
  name: string;
  label?: string;
}) {
  const { register, watch } = useFormContext();
  const value = watch(name) as string | undefined;

  return (
    <div className="space-y-1.5">
      {label && <label className="text-sm font-medium">{label}</label>}
      <div className="flex items-center gap-2">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-muted">
          <SectionIcon name={value ?? "info"} className="size-4" />
        </span>
        <select
          {...register(name)}
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
        >
          {SECTION_ICONS.map((icon) => (
            <option key={icon.value} value={icon.value}>
              {icon.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
