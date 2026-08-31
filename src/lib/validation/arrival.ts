import { z } from "zod";
import { localizedField } from "./hotel";

/** One arrival guide step ("gate code", "key box by the door"...). */
export const arrivalStepSchema = z.object({
  title: localizedField({ max: 120, plRequired: "Tytuł kroku (PL) jest wymagany" }),
  body: localizedField({ max: 2000 }),
});

/** Hotel-level arrival extras: the map pin link shown on the guide page. */
export const arrivalMapSchema = z.object({
  mapUrl: z
    .string()
    .trim()
    .max(500, "Maksymalnie 500 znaków")
    .refine((v) => v === "" || /^https?:\/\//i.test(v), {
      message: "Link musi zaczynać się od http:// lub https://",
    }),
});

export type ArrivalStepInput = z.input<typeof arrivalStepSchema>;
export type ArrivalMapInput = z.input<typeof arrivalMapSchema>;
