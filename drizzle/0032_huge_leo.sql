ALTER TABLE "products" ADD COLUMN "is_available" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "is_published" boolean DEFAULT false NOT NULL;