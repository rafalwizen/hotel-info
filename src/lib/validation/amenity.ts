import { z } from "zod";
import { localizedField } from "./hotel";

export const amenitySchema = z.object({
  label: localizedField({ max: 60, plRequired: "Etykieta (PL) jest wymagana" }),
  icon: z.string().min(1).max(40),
});

export type AmenityInput = z.input<typeof amenitySchema>;
