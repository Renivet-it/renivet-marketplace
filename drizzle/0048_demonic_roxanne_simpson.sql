DROP INDEX IF EXISTS "cart_user_id_product_id_idx";--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cart_user_id_product_id_idx" ON "carts" USING btree ("user_id","product_id");