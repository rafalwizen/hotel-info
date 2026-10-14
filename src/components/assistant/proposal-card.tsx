"use client";

/**
 * Confirmation card for a model-drafted mutation. The model never writes:
 * clicking Zapisz (or Usuń for destructive proposals) calls the SAME server
 * action the regular admin form uses (pattern:
 * src/components/admin/rooms-list.tsx), so zod validation, requireHotel()
 * scoping and revalidatePath all apply unchanged. createRoomAction and
 * duplicateRoomAction redirect to the room editor — intended UX.
 *
 * Labels and cascade counts come from `proposal.display`, resolved
 * server-side (src/server/assistant/proposal-display.ts) — never from the
 * model. Save paths only ever pass the id/shape fields the corresponding
 * server action expects.
 */

import { useState, useTransition } from "react";
import { Check, Loader2, ShieldAlert, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PROPOSAL_META } from "@/lib/assistant/proposals";
import type { Proposal } from "@/lib/assistant/types";
import type { ActionState } from "@/lib/validation/types";
import {
  createRoomAction,
  duplicateRoomAction,
  deleteRoomSectionAction,
  overrideTemplateSectionAction,
  resetTemplateOverrideAction,
  setRoomAmenitiesAction,
  setTemplateHiddenAction,
  toggleRoomPublishedAction,
  updateRoomAction,
  upsertExtraSectionAction,
} from "@/server/actions/rooms";
import {
  deleteHotelSectionAction,
  deleteTemplateSectionAction,
  upsertHotelSectionAction,
  upsertTemplateSectionAction,
} from "@/server/actions/sections";
import {
  deleteArrivalStepAction,
  deleteExtraArrivalStepAction,
  overrideTemplateArrivalStepAction,
  resetArrivalOverrideAction,
  setTemplateArrivalHiddenAction,
  updateArrivalMapAction,
  upsertArrivalStepAction,
  upsertExtraArrivalStepAction,
} from "@/server/actions/arrival";
import { deleteAmenityAction, upsertAmenityAction } from "@/server/actions/amenities";
import { updateHotelSettingsAction } from "@/server/actions/hotel";

const NO_TRANSLATION = "(bez tłumaczenia)";
const SAME_AS_SOURCE = "jak w pokoju źródłowym";

/** Cap card display; the saved payload is unaffected. */
function truncate(value: string, max = 500): string {
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

type Row = { label: string; value: string };

function localizedRows(label: string, value: { pl: string; en: string }): Row[] {
  return [
    { label: `${label} (PL)`, value: value.pl },
    { label: `${label} (EN)`, value: value.en || NO_TRANSLATION },
  ];
}

function modeRow(hasId: boolean): Row {
  return { label: "Tryb", value: hasId ? "edycja istniejącej" : "nowa" };
}

function sectionRows(input: {
  title: { pl: string; en: string };
  body: { pl: string; en: string };
  icon: string;
  enabled: boolean;
  id?: string;
}): Row[] {
  return [
    ...localizedRows("Tytuł", input.title),
    ...localizedRows("Treść", input.body),
    { label: "Ikona", value: input.icon },
    { label: "Widoczna", value: input.enabled ? "tak" : "nie" },
    modeRow(Boolean(input.id)),
  ];
}

function arrivalRows(input: {
  title: { pl: string; en: string };
  body: { pl: string; en: string };
  photoUrl?: string | null;
  id?: string;
}): Row[] {
  return [
    ...localizedRows("Tytuł", input.title),
    ...localizedRows("Opis", input.body),
    {
      label: "Zdjęcie",
      value: input.photoUrl ? "bez zmian (istniejące)" : "—",
    },
    modeRow(Boolean(input.id)),
  ];
}

function roomRow(proposal: Proposal & { roomId?: string }): Row {
  return { label: "Pokój", value: proposal.display?.targetLabel ?? proposal.roomId ?? "—" };
}

function rowsFor(proposal: Proposal): Row[] {
  switch (proposal.action) {
    case "create_room":
      return [
        { label: "Numer", value: proposal.input.number },
        ...localizedRows("Nazwa", proposal.input.name),
        {
          label: "Piętro",
          value:
            proposal.input.floor === undefined || proposal.input.floor === null
              ? "—"
              : String(proposal.input.floor),
        },
        {
          label: "Max gości",
          value:
            proposal.input.maxGuests === undefined ? "2 (domyślnie)" : String(proposal.input.maxGuests),
        },
        { label: "Opublikowany", value: "tak (domyślnie)" },
      ];

    case "duplicate_room":
      return [
        { label: "Źródło", value: proposal.display?.targetLabel ?? proposal.sourceRoomId },
        { label: "Numer", value: proposal.number },
        ...(proposal.name
          ? localizedRows("Nazwa", proposal.name)
          : [{ label: "Nazwa (PL)", value: SAME_AS_SOURCE }]),
        {
          label: "Piętro",
          value:
            proposal.floor === undefined
              ? SAME_AS_SOURCE
              : proposal.floor === null
                ? "—"
                : String(proposal.floor),
        },
        {
          label: "Max gości",
          value: proposal.maxGuests === undefined ? SAME_AS_SOURCE : String(proposal.maxGuests),
        },
        { label: "Kopiowane", value: "udogodnienia, nadpisane sekcje i kroki dojazdu" },
        { label: "Opublikowany", value: "nie — opublikujesz w edytorze" },
      ];

    case "update_room":
      return [
        roomRow(proposal),
        { label: "Numer", value: proposal.input.number },
        { label: "Adres (slug)", value: proposal.input.slug },
        ...localizedRows("Nazwa", proposal.input.name),
        {
          label: "Piętro",
          value: proposal.input.floor === null ? "—" : String(proposal.input.floor),
        },
        { label: "Max gości", value: String(proposal.input.maxGuests) },
        { label: "Opublikowany", value: proposal.input.published ? "tak" : "nie" },
      ];

    case "set_room_published":
      return [
        roomRow(proposal),
        { label: "Opublikowany", value: proposal.published ? "tak" : "nie" },
      ];

    case "set_room_amenities":
      return [
        roomRow(proposal),
        {
          label: "Udogodnienia",
          value:
            proposal.display?.amenityLabels?.join(", ") ??
            `${proposal.amenityIds.length} pozycji`,
        },
      ];

    case "upsert_template_section":
      return sectionRows(proposal.input);

    case "delete_template_section":
    case "delete_hotel_section":
    case "delete_room_section":
      return [{ label: "Cel", value: proposal.display?.targetLabel ?? proposal.sectionId }];

    case "upsert_hotel_section":
      return sectionRows(proposal.input);

    case "upsert_room_section":
      return [roomRow(proposal), ...sectionRows(proposal.input)];

    case "override_room_section":
      return [roomRow(proposal), ...sectionRows(proposal.input)];

    case "hide_room_section":
      return [roomRow(proposal), { label: "Widoczność", value: proposal.hidden ? "ukryta" : "przywrócona" }];

    case "reset_room_section":
      return [roomRow(proposal), { label: "Działanie", value: "powrót do treści szablonu" }];

    case "upsert_arrival_step":
      return arrivalRows(proposal.input);

    case "delete_arrival_step":
    case "delete_room_arrival_step":
      return [{ label: "Cel", value: proposal.display?.targetLabel ?? proposal.stepId }];

    case "update_arrival_map":
      return [{ label: "Link do mapy", value: proposal.input.mapUrl || "— (wyczyszczenie)" }];

    case "upsert_room_arrival_step":
      return [roomRow(proposal), ...arrivalRows(proposal.input)];

    case "override_room_arrival_step":
      return [roomRow(proposal), ...arrivalRows(proposal.input)];

    case "hide_room_arrival_step":
      return [roomRow(proposal), { label: "Widoczność", value: proposal.hidden ? "ukryty" : "przywrócony" }];

    case "reset_room_arrival_step":
      return [roomRow(proposal), { label: "Działanie", value: "powrót do kroku szablonu" }];

    case "upsert_amenity":
      return [
        ...localizedRows("Etykieta", proposal.input.label),
        { label: "Ikona", value: proposal.input.icon },
        modeRow(Boolean(proposal.input.id)),
      ];

    case "delete_amenity":
      return [{ label: "Cel", value: proposal.display?.targetLabel ?? proposal.amenityId }];

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
    case "duplicate_room":
      return duplicateRoomAction({
        sourceRoomId: proposal.sourceRoomId,
        number: proposal.number,
        name: proposal.name,
        floor: proposal.floor,
        maxGuests: proposal.maxGuests,
      });
    case "update_room":
      return updateRoomAction(proposal.roomId, proposal.input);
    case "set_room_published":
      return toggleRoomPublishedAction(proposal.roomId, proposal.published);
    case "set_room_amenities":
      return setRoomAmenitiesAction(proposal.roomId, proposal.amenityIds);
    case "upsert_template_section":
      return upsertTemplateSectionAction(proposal.input);
    case "delete_template_section":
      return deleteTemplateSectionAction(proposal.sectionId);
    case "upsert_hotel_section":
      return upsertHotelSectionAction(proposal.input);
    case "delete_hotel_section":
      return deleteHotelSectionAction(proposal.sectionId);
    case "upsert_room_section":
      return upsertExtraSectionAction(proposal.roomId, proposal.input);
    case "override_room_section":
      return overrideTemplateSectionAction(proposal.roomId, proposal.templateId, proposal.input);
    case "hide_room_section":
      return setTemplateHiddenAction(proposal.roomId, proposal.templateId, proposal.hidden);
    case "reset_room_section":
      return resetTemplateOverrideAction(proposal.roomId, proposal.templateId);
    case "delete_room_section":
      return deleteRoomSectionAction(proposal.sectionId);
    case "upsert_arrival_step":
      return upsertArrivalStepAction(proposal.input);
    case "delete_arrival_step":
      return deleteArrivalStepAction(proposal.stepId);
    case "update_arrival_map":
      return updateArrivalMapAction(proposal.input);
    case "upsert_room_arrival_step":
      return upsertExtraArrivalStepAction(proposal.roomId, proposal.input);
    case "override_room_arrival_step":
      return overrideTemplateArrivalStepAction(proposal.roomId, proposal.templateId, proposal.input);
    case "hide_room_arrival_step":
      return setTemplateArrivalHiddenAction(proposal.roomId, proposal.templateId, proposal.hidden);
    case "reset_room_arrival_step":
      return resetArrivalOverrideAction(proposal.roomId, proposal.templateId);
    case "delete_room_arrival_step":
      return deleteExtraArrivalStepAction(proposal.stepId);
    case "upsert_amenity":
      return upsertAmenityAction(proposal.input);
    case "delete_amenity":
      return deleteAmenityAction(proposal.amenityId);
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

  const confirmLabel = meta.destructive ? "Usuń" : "Zapisz";
  const ConfirmIcon = meta.destructive ? Trash2 : Check;

  return (
    <div
      className={`w-full rounded-lg border bg-card p-3 text-sm shadow-sm ${
        meta.destructive ? "border-destructive/40" : ""
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] tracking-wide text-muted-foreground uppercase">
          Propozycja zmiany
        </span>
        <span className="text-xs font-semibold">{meta.title}</span>
      </div>

      {meta.destructive ? (
        <p className="mt-2 flex items-start gap-1.5 text-xs text-destructive">
          <ShieldAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <span>
            Tej operacji nie można cofnąć.
            {proposal.display?.overrideCount
              ? ` Usunie też nadpisania w ${proposal.display.overrideCount} pokojach.`
              : ""}
            {proposal.action === "delete_amenity" ? " Udogodnienie zniknie ze wszystkich pokoi." : ""}
            {proposal.action === "delete_arrival_step" ? " Usunięte zostaną także zdjęcia." : ""}
          </span>
        </p>
      ) : meta.risky ? (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-amber-700">
          <ShieldAlert className="size-3.5 shrink-0" aria-hidden />
          {proposal.action === "set_room_amenities"
            ? "Ta zmiana podmienia CAŁĄ listę udogodnień pokoju."
            : "Ta zmiana podmienia cały obiekt — sprawdź wszystkie pola przed zapisem."}
        </p>
      ) : null}

      <dl className="mt-2 space-y-1">
        {rowsFor(proposal).map((row) => (
          <div key={row.label} className="flex gap-2 text-xs">
            <dt className="w-32 shrink-0 text-muted-foreground">{row.label}</dt>
            <dd className="min-w-0 break-words whitespace-pre-wrap">
              {truncate(row.value) || "—"}
            </dd>
          </div>
        ))}
      </dl>

      {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}

      <div className="mt-3 flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant={meta.destructive ? "destructive" : "default"}
          onClick={save}
          disabled={pending}
        >
          {pending ? <Loader2 className="animate-spin" aria-hidden /> : <ConfirmIcon aria-hidden />}
          {confirmLabel}
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
        {proposal.action === "create_room" || proposal.action === "duplicate_room" ? (
          <span className="text-[11px] text-muted-foreground">Po zapisie otworzę edytor pokoju</span>
        ) : null}
      </div>

      <p className="mt-2 text-[11px] text-muted-foreground">
        Sprawdź dane i kliknij {confirmLabel.toLowerCase()}, albo Odrzuć — nic nie trafi do bazy bez
        Twojej decyzji.
      </p>
    </div>
  );
}
