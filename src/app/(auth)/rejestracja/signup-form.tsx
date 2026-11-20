"use client";

import { useActionState } from "react";
import Link from "next/link";
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
      <div className="flex items-start gap-2">
        <input
          id="terms"
          name="terms"
          type="checkbox"
          required
          className="mt-1 size-4 accent-amber-700"
        />
        <Label htmlFor="terms" className="text-sm font-normal leading-snug text-neutral-600">
          Akceptuję{" "}
          <Link
            href="/regulamin"
            className="font-medium text-amber-700 underline-offset-4 hover:underline"
          >
            regulamin
          </Link>{" "}
          i{" "}
          <Link
            href="/polityka-prywatnosci"
            className="font-medium text-amber-700 underline-offset-4 hover:underline"
          >
            politykę prywatności
          </Link>
          .
        </Label>
      </div>
      <FormError message={state?.error} />
      <SubmitButton pendingLabel="Tworzenie konta..." className="w-full">
        Utwórz konto
      </SubmitButton>
    </form>
  );
}
