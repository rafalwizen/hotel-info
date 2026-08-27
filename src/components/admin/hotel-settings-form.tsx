"use client";

import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LocalizedInput } from "@/components/admin/localized";
import { SubmitButton } from "@/components/admin/submit-button";
import { hotelSettingsSchema, type HotelSettingsInput } from "@/lib/validation/hotel";
import { updateHotelSettingsAction } from "@/server/actions/hotel";

/** Hotel data + branding form (slug intentionally not editable: QR stability). */
export function HotelSettingsForm({ defaultValues }: { defaultValues: HotelSettingsInput }) {
  const form = useForm<HotelSettingsInput>({
    resolver: zodResolver(hotelSettingsSchema),
    defaultValues,
  });
  const brandColor = form.watch("brandColor");
  const errors = form.formState.errors;

  const handleSubmit = form.handleSubmit(async (values) => {
    const result = await updateHotelSettingsAction(values);
    if (result?.error) toast.error(result.error);
    else toast.success("Zapisano ustawienia hotelu.");
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit} className="space-y-6">
      <LocalizedInput name="name" label="Nazwa hotelu" required />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Kolor marki</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={/^#[0-9a-fA-F]{6}$/.test(brandColor ?? "") ? brandColor : "#0f766e"}
              onChange={(e) => form.setValue("brandColor", e.target.value)}
              className="size-8 shrink-0 cursor-pointer rounded-md border"
              aria-label="Wybierz kolor"
            />
            <Input {...form.register("brandColor")} />
          </div>
          {errors.brandColor && (
            <p className="text-sm text-destructive">{errors.brandColor.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label>E-mail kontaktowy</Label>
          <Input type="email" placeholder="recepcja@hotel.pl" {...form.register("email")} />
          {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Sieć Wi-Fi (SSID)</Label>
          <Input placeholder="np. Hotel-Gosc" {...form.register("wifiSsid")} />
        </div>
        <div className="space-y-1.5">
          <Label>Hasło Wi-Fi</Label>
          <Input placeholder="hasło dla gości" {...form.register("wifiPassword")} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label>Zameldowanie od</Label>
          <Input type="time" {...form.register("checkinFrom")} />
          {errors.checkinFrom && (
            <p className="text-sm text-destructive">{errors.checkinFrom.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label>Wymeldowanie do</Label>
          <Input type="time" {...form.register("checkoutUntil")} />
          {errors.checkoutUntil && (
            <p className="text-sm text-destructive">{errors.checkoutUntil.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label>Telefon</Label>
          <Input placeholder="+48 ..." {...form.register("phone")} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Adres</Label>
        <Input placeholder="ul. Jeziorna 1, 11-500 Wilkasy" {...form.register("addressLine")} />
      </div>

        <SubmitButton>Zapisz ustawienia</SubmitButton>
      </form>
    </FormProvider>
  );
}
