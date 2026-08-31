"use client";

import { useState, useTransition } from "react";
import { ChevronDown, ChevronUp, EyeOff, Plus, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrivalStepForm,
  type ArrivalStepFormValues,
} from "@/components/admin/arrival-step-form";
import type { ArrivalStepData, TemplateWithState } from "@/lib/sections";
import type { ActionState } from "@/lib/validation/types";
import {
  deleteExtraArrivalStepAction,
  moveExtraArrivalStepAction,
  overrideTemplateArrivalStepAction,
  resetArrivalOverrideAction,
  setTemplateArrivalHiddenAction,
  upsertExtraArrivalStepAction,
} from "@/server/actions/arrival";

function plain(step: ArrivalStepData): ArrivalStepFormValues {
  return {
    title: step.title,
    body: step.body,
    photoUrl: step.photoUrl,
  };
}

const STATE_BADGE: Record<string, { label: string; className: string }> = {
  inherited: { label: "Dziedziczy", className: "bg-muted text-muted-foreground" },
  overridden: { label: "Nadpisany", className: "bg-primary/10 text-primary" },
  hidden: { label: "Ukryty", className: "bg-destructive/10 text-destructive" },
};

/**
 * Room arrival editor: hotel guide steps with inheritance states
 * (inherited / overridden / hidden) + room-only steps — mirrors RoomSections,
 * useful when e.g. only this room is reached through the backyard gate.
 */
export function RoomArrival({
  roomId,
  templates,
  extras,
}: {
  roomId: string;
  templates: TemplateWithState<ArrivalStepData>[];
  extras: ArrivalStepData[];
}) {
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [addingExtra, setAddingExtra] = useState(false);
  const [editingExtraId, setEditingExtraId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const run = (fn: () => Promise<ActionState>, success?: string) =>
    startTransition(async () => {
      const result = await fn();
      if (result?.error) toast.error(result.error);
      else if (success) toast.success(success);
    });

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground">
          Kroki z szablonu hotelu
        </h3>
        {templates.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nie masz jeszcze kroków dojazdu. Dodaj je w „Dojazd” — pojawią się
            tutaj, na stronie każdego pokoju i w linku do udostępnienia.
          </p>
        )}
        {templates.map(({ template, override, state }) => {
          const effective = override ?? template;
          const badge = STATE_BADGE[state];
          const editing = editingTemplateId === template.id;

          return (
            <Card key={template.id} className={state === "hidden" ? "opacity-60" : undefined}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="flex items-center gap-2 text-base">
                  {effective.title.pl || "(bez tytułu)"}
                </CardTitle>
                <div className="flex items-center gap-2">
                  {!template.enabled && (
                    <Badge className="bg-muted text-muted-foreground">
                      Wyłączony w szablonie
                    </Badge>
                  )}
                  {template.enabled && <Badge className={badge.className}>{badge.label}</Badge>}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {!editing && (
                  <>
                    <p className="text-sm whitespace-pre-line text-muted-foreground">
                      {(override ?? template).body.pl || "(brak treści)"}
                    </p>
                    {effective.photoUrl && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={effective.photoUrl}
                        alt=""
                        className="h-16 rounded-md border object-cover"
                      />
                    )}
                    <div className="flex flex-wrap gap-2">
                      {state === "inherited" && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={pending}
                          onClick={() => setEditingTemplateId(template.id)}
                        >
                          Nadpisz w tym pokoju
                        </Button>
                      )}
                      {state === "overridden" && (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={pending}
                            onClick={() => setEditingTemplateId(template.id)}
                          >
                            Edytuj nadpisanie
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            disabled={pending}
                            onClick={() =>
                              run(
                                () => resetArrivalOverrideAction(roomId, template.id),
                                "Krok dziedziczy ponownie z szablonu.",
                              )
                            }
                          >
                            <RotateCcw /> Wróć do szablonu
                          </Button>
                        </>
                      )}
                      {state !== "hidden" && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          disabled={pending}
                          onClick={() =>
                            run(
                              () => setTemplateArrivalHiddenAction(roomId, template.id, true),
                              "Krok ukryty w tym pokoju.",
                            )
                          }
                        >
                          <EyeOff /> Ukryj w tym pokoju
                        </Button>
                      )}
                      {state === "hidden" && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={pending}
                          onClick={() =>
                            run(
                              () => setTemplateArrivalHiddenAction(roomId, template.id, false),
                              "Krok widoczny ponownie.",
                            )
                          }
                        >
                          Przywróć widoczność
                        </Button>
                      )}
                    </div>
                  </>
                )}
                {editing && (
                  <ArrivalStepForm
                    defaultValues={plain(effective)}
                    submitLabel="Zapisz nadpisanie"
                    onSubmit={async (values) => {
                      const result = await overrideTemplateArrivalStepAction(
                        roomId,
                        template.id,
                        values,
                      );
                      if (!result?.error) setEditingTemplateId(null);
                      return result;
                    }}
                  />
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground">
          Kroki tylko w tym pokoju
        </h3>
        {extras.length === 0 && !addingExtra && !editingExtraId && (
          <p className="text-sm text-muted-foreground">
            Brak dodatkowych kroków — dodaj krok specyficzny tylko dla tego pokoju.
          </p>
        )}
        {extras.map((extra, index) =>
          editingExtraId === extra.id ? (
            <ArrivalStepForm
              key={extra.id}
              defaultValues={plain(extra)}
              submitLabel="Zapisz krok"
              onDelete={() => deleteExtraArrivalStepAction(extra.id)}
              onSubmit={async (values) => {
                const result = await upsertExtraArrivalStepAction(roomId, {
                  ...values,
                  id: extra.id,
                });
                if (!result?.error) setEditingExtraId(null);
                return result;
              }}
            />
          ) : (
            <Card key={extra.id} className={extra.enabled ? undefined : "opacity-60"}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="flex items-center gap-2 text-base">
                  {extra.title.pl || "(bez tytułu)"}
                  {!extra.enabled && (
                    <Badge className="bg-destructive/10 text-destructive">Ukryty</Badge>
                  )}
                </CardTitle>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    disabled={index === 0 || pending}
                    aria-label="Przenieś wyżej"
                    onClick={() => run(() => moveExtraArrivalStepAction(extra.id, "up"))}
                  >
                    <ChevronUp />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    disabled={index === extras.length - 1 || pending}
                    aria-label="Przenieś niżej"
                    onClick={() => run(() => moveExtraArrivalStepAction(extra.id, "down"))}
                  >
                    <ChevronDown />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm whitespace-pre-line text-muted-foreground">
                  {extra.body.pl || "(brak treści)"}
                </p>
                {extra.photoUrl && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={extra.photoUrl}
                    alt=""
                    className="h-16 rounded-md border object-cover"
                  />
                )}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={pending}
                    onClick={() => setEditingExtraId(extra.id)}
                  >
                    Edytuj
                  </Button>
                </div>
              </CardContent>
            </Card>
          ),
        )}
        {addingExtra && (
          <ArrivalStepForm
            title="Nowy krok pokoju"
            submitLabel="Dodaj krok"
            defaultValues={{ title: { pl: "", en: "" }, body: { pl: "", en: "" }, photoUrl: null }}
            onSubmit={async (values) => {
              const result = await upsertExtraArrivalStepAction(roomId, values);
              if (result?.error) return result;
              setAddingExtra(false);
              toast.success("Dodano krok.");
              return result;
            }}
          />
        )}
        {!addingExtra && (
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => setAddingExtra(true)}
          >
            <Plus /> Dodaj krok pokoju
          </Button>
        )}
      </div>
    </div>
  );
}
