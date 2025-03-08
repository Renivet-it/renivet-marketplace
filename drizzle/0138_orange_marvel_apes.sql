ALTER TABLE "products" ALTER COLUMN "is_published" SET DEFAULT true;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "published_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "verification_status" SET DEFAULT 'approved';