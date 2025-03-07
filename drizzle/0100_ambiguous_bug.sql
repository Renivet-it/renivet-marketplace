ALTER TABLE "product_categories" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "product_categories" CASCADE;--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "category_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "subcategory_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "product_type_id" uuid NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "products" ADD CONSTRAINT "products_subcategory_id_sub_categories_id_fk" FOREIGN KEY ("subcategory_id") REFERENCES "public"."sub_categories"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "products" ADD CONSTRAINT "products_product_type_id_product_types_id_fk" FOREIGN KEY ("product_type_id") REFERENCES "public"."product_types"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_option_product_id_idx" ON "product_options" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_variant_product_id_idx" ON "product_variants" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "product_variant_sku_idx" ON "product_variants" USING btree ("sku");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_sku_idx" ON "products" USING btree ("sku");