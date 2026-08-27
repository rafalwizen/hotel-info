import { z } from "zod";

/**
 * Bilingual field: two plain strings side by side in admin forms.
 * PL is the source of truth; EN may stay empty (guest pages fall back).
 */
export const localizedField = (opts: { max: number; plRequired?: string }) =>
  z.object({
    pl: opts.plRequired
      ? z
          .string()
          .trim()
          .min(1, opts.plRequired)
          .max(opts.max, `Maksymalnie ${opts.max} znaków`)
      : z.string().trim().max(opts.max, `Maksymalnie ${opts.max} znaków`),
    en: z.string().trim().max(opts.max, `Maksymalnie ${opts.max} znaków`),
  });

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const COLOR_RE = /^#[0-9a-fA-F]{6}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const hotelSettingsSchema = z.object({
  name: localizedField({ max: 120, plRequired: "Nazwa hotelu (PL) jest wymagana" }),
  brandColor: z.string().regex(COLOR_RE, "Kolor musi być w formacie #RRGGBB"),
  wifiSsid: z.string().trim().max(64, "Maksymalnie 64 znaki"),
  wifiPassword: z.string().max(64, "Maksymalnie 64 znaki"),
  checkinFrom: z.string().regex(TIME_RE, "Godzina w formacie HH:MM, np. 15:00"),
  checkoutUntil: z.string().regex(TIME_RE, "Godzina w formacie HH:MM, np. 11:00"),
  phone: z.string().trim().max(32, "Maksymalnie 32 znaki"),
  email: z
    .string()
    .trim()
    .refine((v) => v === "" || EMAIL_RE.test(v), "Podaj poprawny adres e-mail"),
  addressLine: z.string().trim().max(200, "Maksymalnie 200 znaków"),
});

/**
 * Onboarding input: everything except the slug is optional so the wizard
 * can start minimal; DB column defaults cover the rest.
 */
export const createHotelSchema = hotelSettingsSchema.partial().extend({
  slug: z
    .string()
    .trim()
    .min(2, "Adres musi mieć co najmniej 2 znaki")
    .max(60, "Maksymalnie 60 znaków")
    .regex(/^[a-z0-9-]+$/, "Adres: małe litery, cyfry i myślniki"),
});

export type HotelSettingsInput = z.input<typeof hotelSettingsSchema>;
export type CreateHotelInput = z.input<typeof createHotelSchema>;
