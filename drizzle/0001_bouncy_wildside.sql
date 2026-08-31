CREATE TABLE "arrival_steps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hotel_id" uuid NOT NULL,
	"room_id" uuid,
	"based_on_id" uuid,
	"title" jsonb DEFAULT '{"pl":"","en":""}'::jsonb NOT NULL,
	"body" jsonb DEFAULT '{"pl":"","en":""}'::jsonb NOT NULL,
	"photo_url" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
ALTER TABLE "hotels" ADD COLUMN "arrival_map_url" text;--> statement-breakpoint
ALTER TABLE "arrival_steps" ADD CONSTRAINT "arrival_steps_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "arrival_steps" ADD CONSTRAINT "arrival_steps_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "arrival_steps" ADD CONSTRAINT "arrival_steps_based_on_id_arrival_steps_id_fk" FOREIGN KEY ("based_on_id") REFERENCES "public"."arrival_steps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "arrival_steps_room_idx" ON "arrival_steps" USING btree ("room_id");--> statement-breakpoint
CREATE INDEX "arrival_steps_hotel_idx" ON "arrival_steps" USING btree ("hotel_id");