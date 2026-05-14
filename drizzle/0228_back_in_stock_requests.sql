CREATE TABLE IF NOT EXISTS "back_in_stock_requests" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "product_id" uuid NOT NULL,
    "variant_id" uuid,
    "user_id" text,
    "email" text,
    "phone" text,
    "status" text DEFAULT 'active' NOT NULL,
    "source" text DEFAULT 'pdp' NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL,
    CONSTRAINT "back_in_stock_requests_id_unique" UNIQUE("id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "back_in_stock_requests" ADD CONSTRAINT "back_in_stock_requests_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "back_in_stock_requests" ADD CONSTRAINT "back_in_stock_requests_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "back_in_stock_requests_product_idx" ON "back_in_stock_requests" USING btree ("product_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "back_in_stock_requests_variant_idx" ON "back_in_stock_requests" USING btree ("variant_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "back_in_stock_requests_product_variant_contact_unique" ON "back_in_stock_requests" USING btree ("product_id","variant_id","email","phone");
