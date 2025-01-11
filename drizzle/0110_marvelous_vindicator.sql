ALTER TABLE "wishlists" ADD COLUMN "variant_id" uuid;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "wishlists" ADD CONSTRAINT "wishlists_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "wishlist_product_id_idx" ON "wishlists" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "wishlist_variant_id_idx" ON "wishlists" USING btree ("variant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "wishlist_product_id_variant_id_idx" ON "wishlists" USING btree ("product_id","variant_id");