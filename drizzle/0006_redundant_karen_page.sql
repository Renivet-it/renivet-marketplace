CREATE INDEX IF NOT EXISTS "order_item_brand_id_idx" ON "order_items" USING btree ("brand_id");