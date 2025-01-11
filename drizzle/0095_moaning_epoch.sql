ALTER TABLE "brand_media_items" DROP CONSTRAINT "brand_media_items_product_id_products_id_fk";
--> statement-breakpoint
ALTER TABLE "brand_media_items" DROP COLUMN IF EXISTS "product_id";--> statement-breakpoint
ALTER TABLE "brand_media_items" DROP COLUMN IF EXISTS "is_used_in_product";