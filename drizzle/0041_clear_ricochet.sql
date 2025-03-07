ALTER TABLE "brands" ALTER COLUMN "slug" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "brands" ADD CONSTRAINT "brands_slug_unique" UNIQUE("slug");