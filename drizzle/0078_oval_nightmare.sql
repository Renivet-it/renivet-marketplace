ALTER TABLE "carts" DROP CONSTRAINT "carts_product_id_products_id_fk";
--> statement-breakpoint
DROP INDEX IF EXISTS "cart_user_id_product_id_idx";--> statement-breakpoint
ALTER TABLE "carts" ADD COLUMN "sku" text NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "carts" ADD CONSTRAINT "carts_sku_product_variants_sku_fk" FOREIGN KEY ("sku") REFERENCES "public"."product_variants"("sku") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cart_user_id_sku_idx" ON "carts" USING btree ("user_id","sku");--> statement-breakpoint
ALTER TABLE "carts" DROP COLUMN IF EXISTS "product_id";--> statement-breakpoint
ALTER TABLE "carts" DROP COLUMN IF EXISTS "size";--> statement-breakpoint
ALTER TABLE "carts" DROP COLUMN IF EXISTS "color";