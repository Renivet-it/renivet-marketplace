CREATE TABLE IF NOT EXISTS "new_product_event_page" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "new_product_event_page_id_unique" UNIQUE("id")
);
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "is_added_in_event_product_page" boolean DEFAULT false;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "new_product_event_page" ADD CONSTRAINT "new_product_event_page_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
