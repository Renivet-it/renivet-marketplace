DROP INDEX IF EXISTS "cat_sub_cat_type_idx";--> statement-breakpoint
ALTER TABLE "brands" ALTER COLUMN "phone" SET NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cat_sub_cat_type_idx" ON "product_categories" USING btree ("category_id","subcategory_id","product_type_id");