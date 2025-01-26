DROP INDEX IF EXISTS "plan_is_deleted_idx";--> statement-breakpoint
ALTER TABLE "plans" DROP COLUMN IF EXISTS "is_deleted";