CREATE TABLE IF NOT EXISTS "home_product_Section" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"category" text,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "home_product_Section_id_unique" UNIQUE("id")
);
--> statement-breakpoint
ALTER TABLE "home_bag_section" ALTER COLUMN "title" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "is_home_hero_products" boolean DEFAULT false;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "home_product_Section" ADD CONSTRAINT "home_product_Section_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
