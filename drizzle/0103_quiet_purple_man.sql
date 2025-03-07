ALTER TABLE "products" ALTER COLUMN "meta_keywords" TYPE text[] USING meta_keywords::text[];--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "meta_keywords" SET DEFAULT '{}';