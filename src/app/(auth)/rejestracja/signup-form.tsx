"use client";

import { useActionState } from "react";
import { signupAction } from "@/server/actions/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormError, SubmitButton } from "@/components/auth/form-parts";

export function SignupForm() {
  const [state, formAction] = useActionState(signupAction, undefined);

  return (
    <form action={formAction} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Imię</Label>
        <Input id="name" name="name" autoComplete="name" placeholder="Anna" required />
      </div>
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
          autoComplete="new-password"
          placeholder="Min. 8 znaków"
          required
          minLength={8}
        />
      </div>
      <FormError message={state?.error} />
      <SubmitButton pendingLabel="Tworzenie konta..." className="w-full">
        Utwórz konto
      </SubmitButton>
    </form>
  );
}
