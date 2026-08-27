"use client";

import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LocalizedInput } from "@/components/admin/localized";
import { SubmitButton } from "@/components/admin/submit-button";
import { slugify } from "@/lib/slug";
import { createHotelSchema, type CreateHotelInput } from "@/lib/validation/hotel";
import { createHotelAction } from "@/server/actions/hotel";

/**
 * Onboarding: create the first hotel. The slug drives the public guest URL
 * and is immutable afterwards (printed QR codes), so it gets a live preview.
 */
export function OnboardingForm({ guestBase }: { guestBase: string }) {
  const form = useForm<CreateHotelInput>({
    resolver: zodResolver(createHotelSchema),
    defaultValues: {
      name: { pl: "", en: "" },
      slug: "",
      brandColor: "#0f766e",
      wifiSsid: "",
      wifiPassword: "",
      checkinFrom: "15:00",
      checkoutUntil: "11:00",
      phone: "",
      email: "",
      addressLine: "",
    },
  });

  const namePl = form.watch("name.pl");
  const slug = form.watch("slug");
  const [slugTouched, setSlugTouched] = useState(false);

  // Auto-derive the slug from the PL name until the user edits it manually.
  useEffect(() => {
    if (!slugTouched) {
      form.setValue("slug", slugify(namePl ?? ""));
    }
  }, [namePl, slugTouched, form]);

  const previewUrl = `${guestBase.replace(/\/$/, "")}/${slug || "twoj-hotel"}`;

  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Skonfiguruj swój hotel</CardTitle>
        <CardDescription>
          Te dane zobaczą Twoi goście po zeskanowaniu kodu QR. Wszystko będzie
          można później zmienić w ustawieniach — z wyjątkiem adresu.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FormProvider {...form}>
          <form
            onSubmit={form.handleSubmit(async (values) => {
              const result = await createHotelAction(values);
              if (result?.error) toast.error(result.error);
            })}
            className="space-y-6"
          >
          <LocalizedInput name="name" label="Nazwa hotelu" required placeholderPl="np. Willa Mazury" />

          <div className="space-y-1.5">
            <Label htmlFor="onboarding-slug">
              Adres strony (slug) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="onboarding-slug"
              placeholder="np. willa-mazury"
              {...form.register("slug")}
              onChange={(e) => {
                setSlugTouched(true);
                form.register("slug").onChange(e);
              }}
            />
            {form.formState.errors.slug && (
              <p className="text-sm text-destructive">{form.formState.errors.slug.message}</p>
            )}
            <p className="truncate rounded-md bg-muted px-2 py-1.5 font-mono text-xs text-muted-foreground">
              {previewUrl}
            </p>
            <p className="text-xs text-muted-foreground">
              Uwaga: adres jest stały po utworzeniu hotelu — trafi na wydrukowane kody QR.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="onboarding-wifi-ssid">Sieć Wi-Fi (SSID)</Label>
              <Input id="onboarding-wifi-ssid" placeholder="np. Hotel-Gosc" {...form.register("wifiSsid")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="onboarding-wifi-password">Hasło Wi-Fi</Label>
              <Input id="onboarding-wifi-password" placeholder="hasło dla gości" {...form.register("wifiPassword")} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="onboarding-phone">Telefon</Label>
              <Input id="onboarding-phone" placeholder="+48 ..." {...form.register("phone")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="onboarding-email">E-mail</Label>
              <Input id="onboarding-email" type="email" placeholder="recepcja@hotel.pl" {...form.register("email")} />
            </div>
            <div className="space-y-1.5">
              <Label>Kolor marki</Label>
              <input
                type="color"
                value={/^#[0-9a-fA-F]{6}$/.test(form.watch("brandColor") ?? "") ? form.watch("brandColor") : "#0f766e"}
                onChange={(e) => form.setValue("brandColor", e.target.value)}
                className="h-8 w-full cursor-pointer rounded-md border"
                aria-label="Wybierz kolor marki"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="onboarding-address">Adres</Label>
            <Input id="onboarding-address" placeholder="ul. Jeziorna 1, 11-500 Wilkasy" {...form.register("addressLine")} />
          </div>

            <SubmitButton pendingLabel="Tworzenie hotelu…">Utwórz hotel</SubmitButton>
          </form>
        </FormProvider>
      </CardContent>
    </Card>
  );
}
