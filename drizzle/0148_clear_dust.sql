CREATE TABLE IF NOT EXISTS "media_exchnage_shipments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"media_id" uuid,
	"exchange_id" uuid
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "media_master" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"file_name" text,
	"file_path" text,
	"file_type" text,
	"file_size" bigint,
	"extension" text,
	"title" varchar(255),
	"description" text,
	"media_type" varchar(255),
	"width" bigint,
	"height" bigint,
	"duration" bigint,
	"is_public" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "media_return_shipments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"media_id" uuid,
	"return_id" uuid
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "media_exchnage_shipments" ADD CONSTRAINT "media_mes_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media_master"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "media_exchnage_shipments" ADD CONSTRAINT "exchange_mes_fk" FOREIGN KEY ("exchange_id") REFERENCES "public"."order_exchange_shipments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "media_return_shipments" ADD CONSTRAINT "media_mrs_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media_master"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "media_return_shipments" ADD CONSTRAINT "return_mrs_fk" FOREIGN KEY ("return_id") REFERENCES "public"."order_return_shipments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "file_path_unique_idx" ON "media_master" USING btree ("file_path");