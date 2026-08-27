import { z } from "zod";
import { localizedField } from "./hotel";

/** One content section (hotel section, room template, or room override). */
export const sectionSchema = z.object({
  title: localizedField({ max: 120, plRequired: "Tytuł (PL) jest wymagany" }),
  body: localizedField({ max: 4000 }),
  icon: z.string().min(1).max(40),
  enabled: z.boolean(),
});

export type SectionInput = z.input<typeof sectionSchema>;
