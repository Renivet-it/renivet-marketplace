ALTER TABLE "addresses" DROP CONSTRAINT "addresses_user_id_unique";--> statement-breakpoint
DROP INDEX IF EXISTS "user_id_idx";--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "address_to_user_id_idx" ON "addresses" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_role_id_idx" ON "user_roles" USING btree ("user_id");