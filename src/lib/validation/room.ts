import { z } from "zod";
import { localizedField } from "./hotel";
import { isReservedRoomSlug } from "@/lib/slug";

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

const floorSchema = z
  .number()
  .int()
  .min(-2, "Piętro: -2 do 50")
  .max(50, "Piętro: -2 do 50");

const maxGuestsSchema = z
  .number()
  .int()
  .min(1, "Minimum 1 gość")
  .max(20, "Maksymalnie 20 gości");

/**
 * Fields for the "add room" form on the room list. Floor and max guests are
 * optional — the manual form keeps sending just number + name, while the
 * assistant (and any richer client) may fill them at creation time.
 */
export const createRoomSchema = z.object({
  number: z.string().trim().min(1, "Numer pokoju jest wymagany").max(10, "Maksymalnie 10 znaków"),
  name: localizedField({ max: 120, plRequired: "Nazwa pokoju (PL) jest wymagana" }),
  floor: floorSchema.nullable().optional(),
  maxGuests: maxGuestsSchema.optional(),
});

export const roomSchema = z.object({
  number: z.string().trim().min(1, "Numer pokoju jest wymagany").max(10, "Maksymalnie 10 znaków"),
  slug: z
    .string()
    .trim()
    .min(1, "Adres pokoju jest wymagany")
    .max(60, "Maksymalnie 60 znaków")
    .regex(SLUG_RE, "Adres: małe litery, cyfry i myślniki")
    .refine((slug) => !isReservedRoomSlug(slug), {
      message: "Ten adres jest zarezerwowany dla systemu — wybierz inny.",
    }),
  name: localizedField({ max: 120, plRequired: "Nazwa pokoju (PL) jest wymagana" }),
  floor: floorSchema.nullable(),
  maxGuests: maxGuestsSchema,
  published: z.boolean(),
});

/**
 * Duplicate a room: number is the one thing that cannot be copied; every
 * other override is optional — absent means "copy from the source room".
 * `floor: null` explicitly clears the floor, `undefined` copies it.
 * Field descriptions feed the dedicated duplicate_room tool schema.
 */
export const duplicateRoomSchema = z.object({
  sourceRoomId: z
    .uuid("Nieprawidłowy identyfikator pokoju")
    .describe("id pokoju źródłowego (z narzędzia list_rooms)"),
  number: createRoomSchema.shape.number.describe("numer nowego pokoju (musi się różnić od źródłowego)"),
  name: localizedField({ max: 120, plRequired: "Nazwa pokoju (PL) jest wymagana" })
    .optional()
    .describe("opcjonalna nowa nazwa {pl,en} — brak oznacza kopię nazwy źródła"),
  floor: floorSchema
    .nullable()
    .optional()
    .describe("opcjonalne piętro — brak oznacza kopię ze źródła"),
  maxGuests: maxGuestsSchema
    .optional()
    .describe("opcjonalna maksymalna liczba gości — brak oznacza kopię"),
});

export type CreateRoomInput = z.input<typeof createRoomSchema>;
export type RoomInput = z.input<typeof roomSchema>;
export type DuplicateRoomInput = z.input<typeof duplicateRoomSchema>;
