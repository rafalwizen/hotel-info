"use client";

import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LocalizedInput } from "@/components/admin/localized";
import { SubmitButton } from "@/components/admin/submit-button";
import { roomSchema, type RoomInput } from "@/lib/validation/room";
import { updateRoomAction } from "@/server/actions/rooms";

/** Room identity card: number, slug, name, floor, capacity, publication. */
export function RoomForm({
  roomId,
  defaultValues,
  roomSlugPrefix,
}: {
  roomId: string;
  defaultValues: RoomInput;
  roomSlugPrefix: string;
}) {
  const form = useForm<RoomInput>({
    resolver: zodResolver(roomSchema),
    defaultValues,
  });
  const slug = form.watch("slug");

  const handleSubmit = form.handleSubmit(async (values) => {
    const result = await updateRoomAction(roomId, values);
    if (result?.error) toast.error(result.error);
    else toast.success("Zapisano dane pokoju.");
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="room-form-number">
            Numer pokoju <span className="text-destructive">*</span>
          </Label>
          <Input id="room-form-number" placeholder="np. 101" {...form.register("number")} />
          {form.formState.errors.number && (
            <p className="text-sm text-destructive">{form.formState.errors.number.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="room-form-slug">
            Adres (slug) <span className="text-destructive">*</span>
          </Label>
          <Input id="room-form-slug" placeholder="np. 101" {...form.register("slug")} />
          {form.formState.errors.slug && (
            <p className="text-sm text-destructive">{form.formState.errors.slug.message}</p>
          )}
          <p className="truncate text-xs text-muted-foreground">
            {roomSlugPrefix}/{slug || "…"}
          </p>
        </div>
      </div>

      <LocalizedInput name="name" label="Nazwa pokoju" required />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="room-form-floor">Piętro</Label>
          <Input
            id="room-form-floor"
            type="number"
            placeholder="np. 1"
            {...form.register("floor", {
              setValueAs: (v: string) => (v === "" ? null : Number(v)),
            })}
          />
          {form.formState.errors.floor && (
            <p className="text-sm text-destructive">{form.formState.errors.floor.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="room-form-max-guests">Max gości</Label>
          <Input
            id="room-form-max-guests"
            type="number"
            {...form.register("maxGuests", { valueAsNumber: true })}
          />
          {form.formState.errors.maxGuests && (
            <p className="text-sm text-destructive">{form.formState.errors.maxGuests.message}</p>
          )}
        </div>
        <label className="flex items-center gap-2 self-end pb-1 text-sm font-medium">
          <input
            type="checkbox"
            className="size-4 accent-(--primary)"
            {...form.register("published")}
          />
          Opublikowany
        </label>
      </div>

        <SubmitButton>Zapisz dane pokoju</SubmitButton>
      </form>
    </FormProvider>
  );
}
