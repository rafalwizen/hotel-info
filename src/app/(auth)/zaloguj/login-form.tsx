"use client";

import { useActionState } from "react";
import { loginAction } from "@/server/actions/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormError, SubmitButton } from "@/components/auth/form-parts";

export function LoginForm({
  action,
  nextPath,
}: {
  action: typeof loginAction;
  nextPath: string;
}) {
  const [state, formAction] = useActionState(action, undefined);

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="next" value={nextPath} />
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
      <div className="grid gap-2">
        <Label htmlFor="password">Hasło</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>
      <FormError message={state?.error} />
      <SubmitButton pendingLabel="Logowanie..." className="w-full">
        Zaloguj się
      </SubmitButton>
    </form>
  );
}
