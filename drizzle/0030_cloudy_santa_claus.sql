ALTER TABLE "products" DROP CONSTRAINT "products_product_type_id_product_types_id_fk";
--> statement-breakpoint
ALTER TABLE "product_categories" DROP COLUMN IF EXISTS "is_primary";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN IF EXISTS "product_type_id";