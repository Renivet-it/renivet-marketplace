CREATE TABLE IF NOT EXISTS "home_new_arrivals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "home_new_arrivals_id_unique" UNIQUE("id")
);
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "is_home_new_Arrivals" boolean DEFAULT false;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "home_new_arrivals" ADD CONSTRAINT "home_new_arrivals_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
