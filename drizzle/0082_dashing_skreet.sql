ALTER TABLE "products" ADD COLUMN "base_price" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "tax_rate" integer DEFAULT 0 NOT NULL;