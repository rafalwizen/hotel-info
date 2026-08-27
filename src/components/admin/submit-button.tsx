"use client";

import type { ComponentProps, ReactNode } from "react";
import { useFormContext } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Submit button wired to RHF's isSubmitting state (works with handleSubmit,
 * unlike useFormStatus which tracks React form actions only).
 */
export function SubmitButton({
  children,
  pendingLabel,
  ...props
}: ComponentProps<typeof Button> & { children: ReactNode; pendingLabel?: string }) {
  const { formState } = useFormContext();
  const pending = formState.isSubmitting;

  return (
    <Button type="submit" disabled={pending} {...props}>
      {pending && <Loader2 className="animate-spin" />}
      {pending ? (pendingLabel ?? "Zapisywanie…") : children}
    </Button>
  );
}
