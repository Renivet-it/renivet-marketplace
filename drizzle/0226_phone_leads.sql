UPDATE "users"
SET "phone" = 'pending:' || "id"
WHERE "phone" IS NULL OR length(trim("phone")) = 0;
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "phone" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "newsletter_subscribers" ALTER COLUMN "name" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "newsletter_subscribers" ALTER COLUMN "email" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "newsletter_subscribers" ADD COLUMN IF NOT EXISTS "phone" text;
--> statement-breakpoint
ALTER TABLE "newsletter_subscribers" ADD COLUMN IF NOT EXISTS "user_id" text;
--> statement-breakpoint
ALTER TABLE "newsletter_subscribers" ADD COLUMN IF NOT EXISTS "source" text DEFAULT 'newsletter' NOT NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "newsletter_subscribers_phone_unique" ON "newsletter_subscribers" ("phone");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "newsletter_subscribers_user_id_unique" ON "newsletter_subscribers" ("user_id");
