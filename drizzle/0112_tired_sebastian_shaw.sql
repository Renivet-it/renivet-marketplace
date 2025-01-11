DROP INDEX IF EXISTS "cart_user_id_sku_idx";--> statement-breakpoint
ALTER TABLE "carts" ADD COLUMN "product_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "carts" ADD COLUMN "variant_id" uuid;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "carts" ADD CONSTRAINT "carts_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "carts" ADD CONSTRAINT "carts_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cart_user_id_product_id_variant_id_idx" ON "carts" USING btree ("user_id","product_id","variant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cart_product_id_variant_id_idx" ON "carts" USING btree ("product_id","variant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cart_user_id_product_id_idx" ON "carts" USING btree ("user_id","product_id");--> statement-breakpoint
ALTER TABLE "carts" DROP COLUMN IF EXISTS "sku";