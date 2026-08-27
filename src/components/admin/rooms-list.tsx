"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown, ChevronUp, Plus, SquarePen, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LocalizedInput } from "@/components/admin/localized";
import { SubmitButton } from "@/components/admin/submit-button";
import { createRoomSchema, type CreateRoomInput } from "@/lib/validation/room";
import type { ActionState } from "@/lib/validation/types";
import {
  createRoomAction,
  deleteRoomAction,
  moveRoomAction,
  toggleRoomPublishedAction,
} from "@/server/actions/rooms";

export type RoomRow = {
  id: string;
  number: string;
  slug: string;
  namePl: string;
  published: boolean;
};

/** Rooms table with publish toggle, reorder, delete + "add room" form. */
export function RoomsList({ rooms }: { rooms: RoomRow[] }) {
  const [adding, setAdding] = useState(false);
  const [pending, startTransition] = useTransition();

  const run = (fn: () => Promise<ActionState>) =>
    startTransition(async () => {
      const result = await fn();
      if (result?.error) toast.error(result.error);
    });

  return (
    <div className="space-y-4">
      {adding && <AddRoomForm onDone={() => setAdding(false)} />}
      {!adding && (
        <Button type="button" onClick={() => setAdding(true)}>
          <Plus /> Dodaj pokój
        </Button>
      )}

      {rooms.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nie masz jeszcze pokoi. Dodaj pierwszy — dla każdego wygenerujemy kod QR.
        </p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {rooms.map((room, index) => (
            <li key={room.id} className="flex flex-wrap items-center gap-3 p-3">
              <div className="flex flex-col gap-0.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  disabled={index === 0 || pending}
                  aria-label="Przenieś wyżej"
                  onClick={() => run(() => moveRoomAction(room.id, "up"))}
                >
                  <ChevronUp />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  disabled={index === rooms.length - 1 || pending}
                  aria-label="Przenieś niżej"
                  onClick={() => run(() => moveRoomAction(room.id, "down"))}
                >
                  <ChevronDown />
                </Button>
              </div>

              <span className="w-14 shrink-0 text-lg font-semibold">{room.number}</span>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/panel/pokoje/${room.id}`}
                  className="block truncate font-medium hover:underline"
                >
                  {room.namePl || "(bez nazwy)"}
                </Link>
                <span className="text-xs text-muted-foreground">/{room.slug}</span>
              </div>

              {room.published ? (
                <Badge className="bg-emerald-500/10 text-emerald-600">Opublikowany</Badge>
              ) : (
                <Badge className="bg-muted text-muted-foreground">Ukryty</Badge>
              )}

              <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  className="size-4 accent-(--primary)"
                  checked={room.published}
                  disabled={pending}
                  onChange={(e) => run(() => toggleRoomPublishedAction(room.id, e.target.checked))}
                />
                {room.published ? "Ukryj" : "Publikuj"}
              </label>

              <div className="flex gap-1">
                <Button type="button" variant="ghost" size="icon-sm" asChild>
                  <Link href={`/panel/pokoje/${room.id}`} aria-label="Edytuj pokój">
                    <SquarePen />
                  </Link>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Usuń pokój"
                  disabled={pending}
                  onClick={() => {
                    if (
                      !window.confirm(
                        `Usunąć pokój ${room.number}? Usunie też jego kod QR i treści.`,
                      )
                    )
                      return;
                    run(() => deleteRoomAction(room.id));
                  }}
                >
                  <Trash2 className="text-destructive" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AddRoomForm({ onDone }: { onDone: () => void }) {
  const form = useForm<CreateRoomInput>({
    resolver: zodResolver(createRoomSchema),
    defaultValues: { number: "", name: { pl: "", en: "" } },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nowy pokój</CardTitle>
        <CardDescription>
          Numer trafi na naklejkę QR; adres strony wygenerujemy automatycznie.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FormProvider {...form}>
          <form
            onSubmit={form.handleSubmit(async (values) => {
              const result = await createRoomAction(values);
              if (result?.error) toast.error(result.error);
            })}
            className="space-y-4"
          >
          <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
            <div className="space-y-1.5">
              <Label htmlFor="room-number">
                Numer <span className="text-destructive">*</span>
              </Label>
              <Input id="room-number" placeholder="np. 101" {...form.register("number")} />
              {form.formState.errors.number && (
                <p className="text-sm text-destructive">{form.formState.errors.number.message}</p>
              )}
            </div>
            <LocalizedInput name="name" label="Nazwa pokoju" required />
          </div>
          <div className="flex gap-2">
            <SubmitButton pendingLabel="Dodawanie…">Utwórz pokój</SubmitButton>
            <Button type="button" variant="ghost" onClick={onDone}>
              Anuluj
            </Button>
          </div>
          </form>
        </FormProvider>
      </CardContent>
    </Card>
  );
}
