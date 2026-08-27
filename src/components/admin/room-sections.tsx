"use client";

import { useState, useTransition } from "react";
import { ChevronDown, ChevronUp, EyeOff, Plus, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionIcon } from "@/components/icon";
import { SectionForm, type SectionFormValues } from "@/components/admin/section-form";
import type { SectionData, TemplateWithState } from "@/lib/sections";
import type { ActionState } from "@/lib/validation/types";
import {
  deleteRoomSectionAction,
  moveExtraSectionAction,
  overrideTemplateSectionAction,
  resetTemplateOverrideAction,
  setTemplateHiddenAction,
  upsertExtraSectionAction,
} from "@/server/actions/rooms";

function plain(section: SectionData): SectionFormValues {
  return {
    title: section.title,
    body: section.body,
    icon: section.icon,
    enabled: section.enabled,
  };
}

const STATE_BADGE: Record<string, { label: string; className: string }> = {
  inherited: { label: "Dziedziczy", className: "bg-muted text-muted-foreground" },
  overridden: { label: "Nadpisane", className: "bg-primary/10 text-primary" },
  hidden: { label: "Ukryta", className: "bg-destructive/10 text-destructive" },
};

/**
 * Room content editor: hotel templates with inheritance states
 * (inherited / overridden / hidden) + room-only extra sections.
 */
export function RoomSections({
  roomId,
  templates,
  extras,
}: {
  roomId: string;
  templates: TemplateWithState[];
  extras: SectionData[];
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
          Sekcje z szablonu hotelu
        </h3>
        {templates.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nie masz jeszcze szablonów sekcji. Dodaj je w „Szablon pokoi” — pojawią
            się tutaj i na stronie każdego pokoju.
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
                  <SectionIcon name={effective.icon} className="size-4 text-muted-foreground" />
                  {effective.title.pl || "(bez tytułu)"}
                </CardTitle>
                <div className="flex items-center gap-2">
                  {!template.enabled && (
                    <Badge className="bg-muted text-muted-foreground">
                      Wyłączona w szablonie
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
                                () => resetTemplateOverrideAction(roomId, template.id),
                                "Sekcja dziedziczy ponownie z szablonu.",
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
                              () => setTemplateHiddenAction(roomId, template.id, true),
                              "Sekcja ukryta w tym pokoju.",
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
                              () => setTemplateHiddenAction(roomId, template.id, false),
                              "Sekcja widoczna ponownie.",
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
                  <SectionForm
                    defaultValues={plain(effective)}
                    submitLabel="Zapisz nadpisanie"
                    onSubmit={async (values) => {
                      const result = await overrideTemplateSectionAction(roomId, template.id, values);
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
          Sekcje tylko w tym pokoju
        </h3>
        {extras.length === 0 && !addingExtra && !editingExtraId && (
          <p className="text-sm text-muted-foreground">
            Brak sekcji dodatkowych — dodaj sekcję specyficzną tylko dla tego pokoju.
          </p>
        )}
        {extras.map((extra, index) =>
          editingExtraId === extra.id ? (
            <SectionForm
              key={extra.id}
              defaultValues={plain(extra)}
              submitLabel="Zapisz sekcję"
              onSubmit={async (values) => {
                const result = await upsertExtraSectionAction(roomId, { ...values, id: extra.id });
                if (!result?.error) setEditingExtraId(null);
                return result;
              }}
            />
          ) : (
            <Card key={extra.id} className={extra.enabled ? undefined : "opacity-60"}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="flex items-center gap-2 text-base">
                  <SectionIcon name={extra.icon} className="size-4 text-muted-foreground" />
                  {extra.title.pl || "(bez tytułu)"}
                  {!extra.enabled && (
                    <Badge className="bg-destructive/10 text-destructive">Ukryta</Badge>
                  )}
                </CardTitle>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    disabled={index === 0 || pending}
                    aria-label="Przenieś wyżej"
                    onClick={() => run(() => moveExtraSectionAction(extra.id, "up"))}
                  >
                    <ChevronUp />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    disabled={index === extras.length - 1 || pending}
                    aria-label="Przenieś niżej"
                    onClick={() => run(() => moveExtraSectionAction(extra.id, "down"))}
                  >
                    <ChevronDown />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm whitespace-pre-line text-muted-foreground">
                  {extra.body.pl || "(brak treści)"}
                </p>
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
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    disabled={pending}
                    onClick={() => {
                      if (!window.confirm("Usunąć tę sekcję?")) return;
                      run(() => deleteRoomSectionAction(extra.id), "Usunięto sekcję.");
                    }}
                  >
                    Usuń
                  </Button>
                </div>
              </CardContent>
            </Card>
          ),
        )}
        {addingExtra && (
          <SectionForm
            title="Nowa sekcja pokoju"
            defaultValues={{ title: { pl: "", en: "" }, body: { pl: "", en: "" }, icon: "info", enabled: true }}
            onSubmit={async (values) => {
              const result = await upsertExtraSectionAction(roomId, values);
              if (result?.error) return result;
              setAddingExtra(false);
              toast.success("Dodano sekcję.");
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
            <Plus /> Dodaj sekcję pokoju
          </Button>
        )}
      </div>
    </div>
  );
}
