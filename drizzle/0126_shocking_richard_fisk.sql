DROP INDEX IF EXISTS "brand_subscription_brand_id_is_active_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "brand_subscription_plan_id_is_active_idx";--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "brand_subscription_brand_id_is_active_idx" ON "brand_subscriptions" USING btree ("brand_id","is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "brand_subscription_plan_id_is_active_idx" ON "brand_subscriptions" USING btree ("plan_id","is_active");