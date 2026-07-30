ALTER TABLE "brands" ADD COLUMN IF NOT EXISTS "invoice_code" text;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "brands_invoice_code_idx" ON "brands" ("invoice_code");
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "invoice_number" text;
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "invoice_issued_at" timestamp;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "orders_invoice_number_idx" ON "orders" ("invoice_number");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "brand_invoice_sequences" (
    "brand_id" uuid NOT NULL REFERENCES "brands"("id") ON DELETE CASCADE,
    "financial_year" text NOT NULL,
    "last_sequence" integer NOT NULL DEFAULT 0,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL,
    CONSTRAINT "brand_invoice_sequences_brand_financial_year_idx" UNIQUE("brand_id", "financial_year")
);
