"use client";

import { useActionState } from "react";
import { requestPasswordResetAction } from "@/server/actions/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormError, FormSuccess, SubmitButton } from "@/components/auth/form-parts";

export function RequestResetForm() {
  const [state, formAction] = useActionState(requestPasswordResetAction, undefined);

  return (
    <form action={formAction} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="twoj@hotel.pl"
          required
        />
      </div>
      <FormError message={state?.error} />
      <FormSuccess message={state?.success} />
      <SubmitButton pendingLabel="Wysyłanie..." className="w-full">
        Wyślij link do resetu
      </SubmitButton>
    </form>
  );
}
