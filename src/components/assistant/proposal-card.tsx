"use client";

/**
 * Confirmation card for a model-drafted mutation. The model never writes:
 * clicking Zapisz calls the SAME server action the regular admin form uses
 * (pattern: src/components/admin/rooms-list.tsx), so zod validation,
 * requireHotel() scoping and revalidatePath all apply unchanged.
 * createRoomAction redirects to the new room's editor — intended UX.
 */

import { useState, useTransition } from "react";
import { Check, Loader2, ShieldAlert, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PROPOSAL_META } from "@/lib/assistant/proposals";
import type { Proposal } from "@/lib/assistant/types";
import type { ActionState } from "@/lib/validation/types";
import { createRoomAction } from "@/server/actions/rooms";
import { upsertArrivalStepAction } from "@/server/actions/arrival";
import { upsertAmenityAction } from "@/server/actions/amenities";
import { updateHotelSettingsAction } from "@/server/actions/hotel";

const NO_TRANSLATION = "(bez tłumaczenia)";

function localizedRows(
  label: string,
  value: { pl: string; en: string },
): { label: string; value: string }[] {
  return [
    { label: `${label} (PL)`, value: value.pl },
    { label: `${label} (EN)`, value: value.en || NO_TRANSLATION },
  ];
}

function rowsFor(proposal: Proposal): { label: string; value: string }[] {
  switch (proposal.action) {
    case "create_room":
      return [
        { label: "Numer", value: proposal.input.number },
        ...localizedRows("Nazwa", proposal.input.name),
      ];
    case "upsert_arrival_step":
      return [
        ...localizedRows("Tytuł", proposal.input.title),
        ...localizedRows("Opis", proposal.input.body),
        { label: "Tryb", value: proposal.input.id ? "edycja istniejącego kroku" : "nowy krok" },
      ];
    case "upsert_amenity":
      return [
        ...localizedRows("Etykieta", proposal.input.label),
        { label: "Ikona", value: proposal.input.icon },
        { label: "Tryb", value: proposal.input.id ? "edycja istniejącego" : "nowe" },
      ];
    case "update_hotel_settings":
      return [
        ...localizedRows("Nazwa", proposal.input.name),
        { label: "Kolor marki", value: proposal.input.brandColor },
        { label: "Wi-Fi (SSID)", value: proposal.input.wifiSsid },
        { label: "Hasło Wi-Fi", value: proposal.input.wifiPassword },
        { label: "Zameldowanie od", value: proposal.input.checkinFrom },
        { label: "Wymeldowanie do", value: proposal.input.checkoutUntil },
        { label: "Telefon", value: proposal.input.phone },
        { label: "E-mail", value: proposal.input.email },
        { label: "Adres", value: proposal.input.addressLine },
      ];
  }
}

async function applyProposal(proposal: Proposal): Promise<ActionState | undefined> {
  switch (proposal.action) {
    case "create_room":
      return createRoomAction(proposal.input);
    case "upsert_arrival_step":
      return upsertArrivalStepAction(proposal.input);
    case "upsert_amenity":
      return upsertAmenityAction(proposal.input);
    case "update_hotel_settings":
      return updateHotelSettingsAction(proposal.input);
  }
}

export function ProposalCard({
  proposal,
  onStatus,
}: {
  proposal: Proposal;
  onStatus: (id: string, status: "saved" | "rejected") => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const meta = PROPOSAL_META[proposal.action];

  if (proposal.status !== "pending") {
    return (
      <p className="text-xs text-muted-foreground">
        {proposal.status === "saved" ? "✓ Zapisano" : "Odrzucono"} — {meta.title.toLowerCase()}
      </p>
    );
  }

  const save = () => {
    setError(null);
    startTransition(async () => {
      const result = await applyProposal(proposal);
      if (result?.error) {
        setError(result.error);
      } else {
        onStatus(proposal.id, "saved");
      }
    });
  };

  return (
    <div className="w-full rounded-lg border bg-card p-3 text-sm shadow-sm">
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] tracking-wide text-muted-foreground uppercase">
          Propozycja zmiany
        </span>
        <span className="text-xs font-semibold">{meta.title}</span>
      </div>

      {meta.risky ? (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-amber-700">
          <ShieldAlert className="size-3.5 shrink-0" aria-hidden />
          Ta zmiana podmienia cały obiekt — sprawdź wszystkie pola przed zapisem.
        </p>
      ) : null}

      <dl className="mt-2 space-y-1">
        {rowsFor(proposal).map((row) => (
          <div key={row.label} className="flex gap-2 text-xs">
            <dt className="w-32 shrink-0 text-muted-foreground">{row.label}</dt>
            <dd className="min-w-0 break-words whitespace-pre-wrap">{row.value || "—"}</dd>
          </div>
        ))}
      </dl>

      {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}

      <div className="mt-3 flex items-center gap-2">
        <Button type="button" size="sm" onClick={save} disabled={pending}>
          {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Check aria-hidden />}
          Zapisz
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => onStatus(proposal.id, "rejected")}
          disabled={pending}
        >
          <X aria-hidden />
          Odrzuć
        </Button>
        {proposal.action === "create_room" ? (
          <span className="text-[11px] text-muted-foreground">Po zapisie otworzę edytor pokoju</span>
        ) : null}
      </div>

      <p className="mt-2 text-[11px] text-muted-foreground">
        Sprawdź dane i kliknij Zapisz, albo Odrzuć — nic nie trafi do bazy bez Twojej decyzji.
      </p>
    </div>
  );
}
