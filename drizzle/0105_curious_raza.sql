ALTER TABLE "product_variants" DROP CONSTRAINT IF EXISTS "product_variants_sku_unique";--> statement-breakpoint
DROP INDEX IF EXISTS "product_variant_sku_idx";--> statement-breakpoint
ALTER TABLE "product_variants" ALTER COLUMN "sku" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN "native_sku" text NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "native_sku" text;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_variant_sku_idx" ON "product_variants" USING btree ("sku");--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_native_sku_unique" UNIQUE("native_sku");