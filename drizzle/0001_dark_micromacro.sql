ALTER TABLE "order_items" DROP CONSTRAINT "order_items_brand_id_products_brand_id_fk";
--> statement-breakpoint
DROP INDEX IF EXISTS "order_item_brand_id_idx";--> statement-breakpoint
ALTER TABLE "order_items" DROP COLUMN IF EXISTS "brand_id";