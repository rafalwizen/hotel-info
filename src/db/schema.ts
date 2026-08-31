import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  uniqueIndex,
  index,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";

/**
 * Bilingual content stored as a single jsonb column: { pl, en }.
 * Admin forms always edit both locales side by side, so a separate
 * translations table would only add joins without benefits.
 */
export type Localized = { pl: string; en: string };
const localized = (name: string) =>
  jsonb(name).$type<Localized>().notNull().default({ pl: "", en: "" });

export const localeEnum = pgEnum("locale", ["pl", "en"]);
export const memberRoleEnum = pgEnum("member_role", ["OWNER", "EDITOR"]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/** Tenant root. One row = one hotel managed by one (or more, future) owner. */
export const hotels = pgTable("hotels", {
  id: uuid("id").defaultRandom().primaryKey(),
  /** Public URL segment: https://{guest-base}/{slug}/{room-slug} */
  slug: text("slug").notNull().unique(),
  name: localized("name"),
  brandColor: text("brand_color").notNull().default("#0f766e"),
  logoUrl: text("logo_url"),
  defaultLocale: localeEnum("default_locale").notNull().default("pl"),
  // Structured facts (dedicated admin UI fields)
  wifiSsid: text("wifi_ssid").notNull().default(""),
  wifiPassword: text("wifi_password").notNull().default(""),
  checkinFrom: text("checkin_from").notNull().default("15:00"),
  checkoutUntil: text("checkout_until").notNull().default("11:00"),
  phone: text("phone").notNull().default(""),
  email: text("email").notNull().default(""),
  addressLine: text("address_line").notNull().default(""),
  /** Dropped map pin link (Google Maps share URL) shown on the arrival guide. */
  arrivalMapUrl: text("arrival_map_url"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/** User <-> hotel link. MVP always creates OWNER; EDITOR reserved for team access. */
export const memberships = pgTable(
  "memberships",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    hotelId: uuid("hotel_id")
      .notNull()
      .references(() => hotels.id, { onDelete: "cascade" }),
    role: memberRoleEnum("role").notNull().default("OWNER"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [uniqueIndex("memberships_user_hotel_unique").on(t.userId, t.hotelId)],
);

export const rooms = pgTable(
  "rooms",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    hotelId: uuid("hotel_id")
      .notNull()
      .references(() => hotels.id, { onDelete: "cascade" }),
    /** Human-readable identifier printed on the QR sticker, e.g. "204". */
    number: text("number").notNull(),
    /** URL segment, stable across renames thanks to room_redirects. */
    slug: text("slug").notNull(),
    name: localized("name"),
    floor: integer("floor"),
    maxGuests: integer("max_guests").notNull().default(2),
    sortOrder: integer("sort_order").notNull().default(0),
    published: boolean("published").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("rooms_hotel_slug_unique").on(t.hotelId, t.slug),
    uniqueIndex("rooms_hotel_number_unique").on(t.hotelId, t.number),
  ],
);

/** Hotel-level amenity catalog (icon + PL/EN label), assigned to rooms via room_amenities. */
export const amenities = pgTable(
  "amenities",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    hotelId: uuid("hotel_id")
      .notNull()
      .references(() => hotels.id, { onDelete: "cascade" }),
    icon: text("icon").notNull().default("check"),
    label: localized("label"),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("amenities_hotel_idx").on(t.hotelId)],
);

export const roomAmenities = pgTable(
  "room_amenities",
  {
    roomId: uuid("room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    amenityId: uuid("amenity_id")
      .notNull()
      .references(() => amenities.id, { onDelete: "cascade" }),
  },
  (t) => [
    uniqueIndex("room_amenities_unique").on(t.roomId, t.amenityId),
    index("room_amenities_room_idx").on(t.roomId),
  ],
);

/** Narrative sections at hotel level (reception, breakfast, parking, local info). */
export const hotelSections = pgTable(
  "hotel_sections",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    hotelId: uuid("hotel_id")
      .notNull()
      .references(() => hotels.id, { onDelete: "cascade" }),
    title: localized("title"),
    body: localized("body"),
    icon: text("icon").notNull().default("info"),
    sortOrder: integer("sort_order").notNull().default(0),
    enabled: boolean("enabled").notNull().default(true),
  },
  (t) => [index("hotel_sections_hotel_idx").on(t.hotelId)],
);

/**
 * Room content sections with template inheritance:
 * - roomId NULL  => hotel-wide template ("How to use the AC" written once)
 * - roomId + basedOnId => per-room override of that template
 * - roomId + basedOnId NULL => room-only extra section
 * An override with enabled=false hides the template section for that room.
 */
export const roomSections = pgTable(
  "room_sections",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    hotelId: uuid("hotel_id")
      .notNull()
      .references(() => hotels.id, { onDelete: "cascade" }),
    roomId: uuid("room_id").references(() => rooms.id, { onDelete: "cascade" }),
    basedOnId: uuid("based_on_id").references((): AnyPgColumn => roomSections.id, {
      onDelete: "cascade",
    }),
    title: localized("title"),
    body: localized("body"),
    icon: text("icon").notNull().default("info"),
    sortOrder: integer("sort_order").notNull().default(0),
    enabled: boolean("enabled").notNull().default(true),
  },
  (t) => [
    index("room_sections_room_idx").on(t.roomId),
    index("room_sections_hotel_idx").on(t.hotelId),
  ],
);

/**
 * Arrival guide steps ("how to find us": gate code, key box, back entrance).
 * Same inheritance model as room_sections:
 * - roomId NULL  => hotel-wide template step
 * - roomId + basedOnId => per-room override of that template step
 * - roomId + basedOnId NULL => room-only extra step
 * An override with enabled=false hides the template step for that room.
 */
export const arrivalSteps = pgTable(
  "arrival_steps",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    hotelId: uuid("hotel_id")
      .notNull()
      .references(() => hotels.id, { onDelete: "cascade" }),
    roomId: uuid("room_id").references(() => rooms.id, { onDelete: "cascade" }),
    basedOnId: uuid("based_on_id").references((): AnyPgColumn => arrivalSteps.id, {
      onDelete: "cascade",
    }),
    title: localized("title"),
    body: localized("body"),
    photoUrl: text("photo_url"),
    sortOrder: integer("sort_order").notNull().default(0),
    enabled: boolean("enabled").notNull().default(true),
  },
  (t) => [
    index("arrival_steps_room_idx").on(t.roomId),
    index("arrival_steps_hotel_idx").on(t.hotelId),
  ],
);

/** Slug rename insurance: printed QR stickers keep working via 301 redirects. */
export const roomRedirects = pgTable(
  "room_redirects",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    hotelId: uuid("hotel_id")
      .notNull()
      .references(() => hotels.id, { onDelete: "cascade" }),
    roomId: uuid("room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    oldSlug: text("old_slug").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [uniqueIndex("room_redirects_hotel_slug_unique").on(t.hotelId, t.oldSlug)],
);

export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("password_reset_tokens_user_idx").on(t.userId)],
);
