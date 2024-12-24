ALTER TABLE "brand_requests" ALTER COLUMN "website" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "brands" ALTER COLUMN "website" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "plans" ADD COLUMN "is_deleted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "plan_is_deleted_idx" ON "plans" USING btree ("is_deleted");