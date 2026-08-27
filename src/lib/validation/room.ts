import { z } from "zod";
import { localizedField } from "./hotel";

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

/** Minimal fields for the "add room" form on the room list. */
export const createRoomSchema = z.object({
  number: z.string().trim().min(1, "Numer pokoju jest wymagany").max(10, "Maksymalnie 10 znaków"),
  name: localizedField({ max: 120, plRequired: "Nazwa pokoju (PL) jest wymagana" }),
});

export const roomSchema = z.object({
  number: z.string().trim().min(1, "Numer pokoju jest wymagany").max(10, "Maksymalnie 10 znaków"),
  slug: z
    .string()
    .trim()
    .min(1, "Adres pokoju jest wymagany")
    .max(60, "Maksymalnie 60 znaków")
    .regex(SLUG_RE, "Adres: małe litery, cyfry i myślniki"),
  name: localizedField({ max: 120, plRequired: "Nazwa pokoju (PL) jest wymagana" }),
  floor: z
    .number()
    .int()
    .min(-2, "Piętro: -2 do 50")
    .max(50, "Piętro: -2 do 50")
    .nullable(),
  maxGuests: z.number().int().min(1, "Minimum 1 gość").max(20, "Maksymalnie 20 gości"),
  published: z.boolean(),
});

export type CreateRoomInput = z.input<typeof createRoomSchema>;
export type RoomInput = z.input<typeof roomSchema>;
