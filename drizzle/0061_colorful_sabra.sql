ALTER TABLE "products" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "status" SET DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "sustainability_certificate_url" text NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "is_deleted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "last_reviewed_at" timestamp;