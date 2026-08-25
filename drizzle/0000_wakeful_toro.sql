CREATE TYPE "public"."locale" AS ENUM('pl', 'en');--> statement-breakpoint
CREATE TYPE "public"."member_role" AS ENUM('OWNER', 'EDITOR');--> statement-breakpoint
CREATE TABLE "amenities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hotel_id" uuid NOT NULL,
	"icon" text DEFAULT 'check' NOT NULL,
	"label" jsonb DEFAULT '{"pl":"","en":""}'::jsonb NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hotel_sections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hotel_id" uuid NOT NULL,
	"title" jsonb DEFAULT '{"pl":"","en":""}'::jsonb NOT NULL,
	"body" jsonb DEFAULT '{"pl":"","en":""}'::jsonb NOT NULL,
	"icon" text DEFAULT 'info' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hotels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" jsonb DEFAULT '{"pl":"","en":""}'::jsonb NOT NULL,
	"brand_color" text DEFAULT '#0f766e' NOT NULL,
	"logo_url" text,
	"default_locale" "locale" DEFAULT 'pl' NOT NULL,
	"wifi_ssid" text DEFAULT '' NOT NULL,
	"wifi_password" text DEFAULT '' NOT NULL,
	"checkin_from" text DEFAULT '15:00' NOT NULL,
	"checkout_until" text DEFAULT '11:00' NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"email" text DEFAULT '' NOT NULL,
	"address_line" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "hotels_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"hotel_id" uuid NOT NULL,
	"role" "member_role" DEFAULT 'OWNER' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "room_amenities" (
	"room_id" uuid NOT NULL,
	"amenity_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "room_redirects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hotel_id" uuid NOT NULL,
	"room_id" uuid NOT NULL,
	"old_slug" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "room_sections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hotel_id" uuid NOT NULL,
	"room_id" uuid,
	"based_on_id" uuid,
	"title" jsonb DEFAULT '{"pl":"","en":""}'::jsonb NOT NULL,
	"body" jsonb DEFAULT '{"pl":"","en":""}'::jsonb NOT NULL,
	"icon" text DEFAULT 'info' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hotel_id" uuid NOT NULL,
	"number" text NOT NULL,
	"slug" text NOT NULL,
	"name" jsonb DEFAULT '{"pl":"","en":""}'::jsonb NOT NULL,
	"floor" integer,
	"max_guests" integer DEFAULT 2 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"name" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "amenities" ADD CONSTRAINT "amenities_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hotel_sections" ADD CONSTRAINT "hotel_sections_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_amenities" ADD CONSTRAINT "room_amenities_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_amenities" ADD CONSTRAINT "room_amenities_amenity_id_amenities_id_fk" FOREIGN KEY ("amenity_id") REFERENCES "public"."amenities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_redirects" ADD CONSTRAINT "room_redirects_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_redirects" ADD CONSTRAINT "room_redirects_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_sections" ADD CONSTRAINT "room_sections_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_sections" ADD CONSTRAINT "room_sections_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_sections" ADD CONSTRAINT "room_sections_based_on_id_room_sections_id_fk" FOREIGN KEY ("based_on_id") REFERENCES "public"."room_sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "amenities_hotel_idx" ON "amenities" USING btree ("hotel_id");--> statement-breakpoint
CREATE INDEX "hotel_sections_hotel_idx" ON "hotel_sections" USING btree ("hotel_id");--> statement-breakpoint
CREATE UNIQUE INDEX "memberships_user_hotel_unique" ON "memberships" USING btree ("user_id","hotel_id");--> statement-breakpoint
CREATE INDEX "password_reset_tokens_user_idx" ON "password_reset_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "room_amenities_unique" ON "room_amenities" USING btree ("room_id","amenity_id");--> statement-breakpoint
CREATE INDEX "room_amenities_room_idx" ON "room_amenities" USING btree ("room_id");--> statement-breakpoint
CREATE UNIQUE INDEX "room_redirects_hotel_slug_unique" ON "room_redirects" USING btree ("hotel_id","old_slug");--> statement-breakpoint
CREATE INDEX "room_sections_room_idx" ON "room_sections" USING btree ("room_id");--> statement-breakpoint
CREATE INDEX "room_sections_hotel_idx" ON "room_sections" USING btree ("hotel_id");--> statement-breakpoint
CREATE UNIQUE INDEX "rooms_hotel_slug_unique" ON "rooms" USING btree ("hotel_id","slug");--> statement-breakpoint
CREATE UNIQUE INDEX "rooms_hotel_number_unique" ON "rooms" USING btree ("hotel_id","number");