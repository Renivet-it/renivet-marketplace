CREATE TABLE IF NOT EXISTS "beauty_new_arrivals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "beauty_new_arrivals_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "beauty_top_picks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "beauty_top_picks_id_unique" UNIQUE("id")
);
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "is_beauty_top_picks" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "is_beauty_new_Arrivals" boolean DEFAULT false;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "beauty_new_arrivals" ADD CONSTRAINT "beauty_new_arrivals_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "beauty_top_picks" ADD CONSTRAINT "beauty_top_picks_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
