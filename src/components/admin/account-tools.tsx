"use client";

import { useActionState, useState, useTransition } from "react";
import { Download, Loader2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { deleteAccountAction, exportAccountDataAction } from "@/server/actions/account";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormError } from "@/components/auth/form-parts";

/** RODO art. 15/20: machine-readable copy of everything we store. */
export function ExportAccountButton() {
  const [pending, startTransition] = useTransition();

  const handleExport = () => {
    startTransition(async () => {
      try {
        const json = await exportAccountDataAction();
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "moje-dane-hotel-info.json";
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Dane pobrane.");
      } catch {
        toast.error("Nie udało się wyeksportować danych. Spróbuj ponownie.");
      }
    });
  };

  return (
    <Button type="button" variant="outline" onClick={handleExport} disabled={pending}>
      {pending ? (
        <Loader2 className="size-4 animate-spin" aria-hidden />
      ) : (
        <Download className="size-4" aria-hidden />
      )}
      Pobierz moje dane (JSON)
    </Button>
  );
}

/** RODO art. 17: irreversible account + hotel deletion, e-mail confirmed. */
export function DeleteAccountForm({ email }: { email: string }) {
  const [state, formAction, isPending] = useActionState(deleteAccountAction, undefined);
  const [confirmText, setConfirmText] = useState("");

  return (
    <form action={formAction} className="grid gap-4">
      <div className="flex items-start gap-3 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm leading-relaxed text-destructive">
        <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
        <p>
          Usunięcie konta jest <strong>nieodwracalne</strong> i kasuje wszystkie
          powiązane obiekty: pokoje, sekcje, przewodniki dojazdu i zdjęcia. Strony
          gości oraz wydrukowane kody QR przestaną działać. Przed usunięciem warto
          pobrać kopię danych.
        </p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="confirm">
          Aby potwierdzić, wpisz swój adres e-mail ({email})
        </Label>
        <Input
          id="confirm"
          name="confirm"
          type="email"
          autoComplete="off"
          placeholder={email}
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          required
        />
      </div>
      <FormError message={state?.error} />
      <Button
        type="submit"
        variant="destructive"
        className="w-full sm:w-auto"
        disabled={isPending}
        aria-disabled={isPending}
      >
        {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
        {isPending ? "Usuwanie konta..." : "Trwale usuń konto"}
      </Button>
    </form>
  );
}
