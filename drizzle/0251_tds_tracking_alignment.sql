ALTER TABLE "brand_tds_tracking"
    ADD COLUMN IF NOT EXISTS "annual_commission_ytd_paise" integer DEFAULT 0 NOT NULL,
    ADD COLUMN IF NOT EXISTS "tds_deducted_ytd_paise" integer DEFAULT 0 NOT NULL,
    ADD COLUMN IF NOT EXISTS "threshold_crossed_at" timestamp;

UPDATE "brand_tds_tracking"
SET
    "annual_commission_ytd_paise" = COALESCE("annual_commission_ytd_paise", "cumulative_commission_paise", 0),
    "tds_deducted_ytd_paise" = COALESCE("tds_deducted_ytd_paise", "cumulative_tds_paise", 0)
WHERE
    "annual_commission_ytd_paise" = 0
    AND "tds_deducted_ytd_paise" = 0;

UPDATE "brand_tds_tracking"
SET "financial_year" =
    'FY' ||
    substring("financial_year" from '(\d{4})') ||
    '-' ||
    right((substring("financial_year" from '(\d{4})$')::int)::text, 2)
WHERE "financial_year" NOT LIKE 'FY%';
