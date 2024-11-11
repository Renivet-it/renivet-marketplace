ALTER TABLE "addresses" ADD COLUMN "alias_slug" text NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_id_type_alias_slug_idx" ON "addresses" USING btree ("user_id","type","alias_slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "alias_slug_idx" ON "addresses" USING btree ("alias_slug");