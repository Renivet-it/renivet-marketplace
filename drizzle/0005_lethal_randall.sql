ALTER TABLE "order_items" DROP CONSTRAINT "order_items_brand_id_brands_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order_items" ADD CONSTRAINT "order_items_brand_id_products_brand_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."products"("brand_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
