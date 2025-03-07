ALTER TABLE "product_options" ADD COLUMN "is_deleted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "product_options" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN "is_deleted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN "deleted_at" timestamp;