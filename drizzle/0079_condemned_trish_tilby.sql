ALTER TABLE "order_items" DROP CONSTRAINT "order_items_product_id_products_id_fk";
--> statement-breakpoint
DROP INDEX IF EXISTS "order_item_product_id_idx";--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "tax_amount" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "delivery_amount" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "discount_amount" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "discount_amount" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "total_amount" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "sku" text NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order_items" ADD CONSTRAINT "order_items_sku_product_variants_sku_fk" FOREIGN KEY ("sku") REFERENCES "public"."product_variants"("sku") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "order_item_sku_idx" ON "order_items" USING btree ("sku");--> statement-breakpoint
ALTER TABLE "order_items" DROP COLUMN IF EXISTS "product_id";--> statement-breakpoint
ALTER TABLE "order_items" DROP COLUMN IF EXISTS "size";--> statement-breakpoint
ALTER TABLE "order_items" DROP COLUMN IF EXISTS "color";