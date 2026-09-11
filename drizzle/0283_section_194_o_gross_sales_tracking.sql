ALTER TABLE "brand_tds_tracking"
    ADD COLUMN IF NOT EXISTS "annual_sales_ytd_paise" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "brand_tds_tracking"
    ADD COLUMN IF NOT EXISTS "cumulative_sales_paise" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "brand_tds_tracking"
    ALTER COLUMN "threshold_paise" SET DEFAULT 50000000;
