"use client";

import type { FieldErrors } from "react-hook-form";
import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/** Dig "a.b.pl" out of RHF errors and return a human message if present. */
function errorAt(errors: FieldErrors, name: string): string | undefined {
  let node: unknown = errors;
  for (const part of name.split(".")) {
    if (node && typeof node === "object" && part in (node as Record<string, unknown>)) {
      node = (node as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  if (node && typeof node === "object" && "message" in node) {
    const message = (node as { message?: string }).message;
    return typeof message === "string" ? message : undefined;
  }
  return undefined;
}

const localeTab = (active: boolean) =>
  cn(
    "shrink-0 self-start rounded-md px-1.5 py-1 text-xs font-semibold uppercase tracking-wide",
    active ? "bg-primary/10 text-primary" : "text-muted-foreground",
  );

/**
 * PL | EN fields side by side. PL is required by validation schemas; EN is
 * always optional (guest pages fall back to PL).
 */
export function LocalizedInput({
  name,
  label,
  placeholderPl,
  placeholderEn,
  required,
  className,
}: {
  name: string;
  label?: string;
  placeholderPl?: string;
  placeholderEn?: string;
  required?: boolean;
  className?: string;
}) {
  const { register, formState } = useFormContext();
  const error = errorAt(formState.errors, `${name}.pl`) ?? errorAt(formState.errors, `${name}.en`);

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <Label>
          {label}
          {required && <span className="text-destructive"> *</span>}
        </Label>
      )}
      <div className="grid grid-cols-[auto_1fr_auto_1fr] items-start gap-1.5">
        <span className={localeTab(true)}>PL</span>
        <Input placeholder={placeholderPl ?? "Polski"} {...register(`${name}.pl`)} />
        <span className={localeTab(false)}>EN</span>
        <Input placeholder={placeholderEn ?? "English"} {...register(`${name}.en`)} />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

export function LocalizedTextarea({
  name,
  label,
  rows = 4,
  required,
  className,
}: {
  name: string;
  label?: string;
  rows?: number;
  required?: boolean;
  className?: string;
}) {
  const { register, formState } = useFormContext();
  const error = errorAt(formState.errors, `${name}.pl`) ?? errorAt(formState.errors, `${name}.en`);

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <Label>
          {label}
          {required && <span className="text-destructive"> *</span>}
        </Label>
      )}
      <div className="space-y-1.5">
        <div className="grid grid-cols-[auto_1fr] items-start gap-1.5">
          <span className={localeTab(true)}>PL</span>
          <Textarea rows={rows} placeholder="Polski" {...register(`${name}.pl`)} />
        </div>
        <div className="grid grid-cols-[auto_1fr] items-start gap-1.5">
          <span className={localeTab(false)}>EN</span>
          <Textarea rows={rows} placeholder="English" {...register(`${name}.en`)} />
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
