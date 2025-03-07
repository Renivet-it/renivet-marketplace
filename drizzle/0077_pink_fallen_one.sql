CREATE INDEX IF NOT EXISTS "product_variant_product_id_idx" ON "product_variants" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_variant_color_idx" ON "product_variants" USING btree ("color");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_variant_size_color_idx" ON "product_variants" USING btree ("size","color");