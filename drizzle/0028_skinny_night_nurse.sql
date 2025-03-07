ALTER TABLE "products" ALTER COLUMN "colors" SET DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "imageUrls" SET DEFAULT '[]'::jsonb;