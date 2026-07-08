ALTER TABLE "finance_cod_reconciliation"
ALTER COLUMN "order_id" DROP NOT NULL;

ALTER TABLE "finance_cod_reconciliation_runs"
ADD COLUMN IF NOT EXISTS "carrier" text;

ALTER TABLE "finance_cod_reconciliation_runs"
ADD COLUMN IF NOT EXISTS "run_at" timestamp DEFAULT now() NOT NULL;

ALTER TABLE "finance_cod_reconciliation_runs"
ADD COLUMN IF NOT EXISTS "records_synced" integer DEFAULT 0 NOT NULL;

ALTER TABLE "finance_cod_reconciliation_runs"
ADD COLUMN IF NOT EXISTS "matched_count" integer DEFAULT 0 NOT NULL;

ALTER TABLE "finance_cod_reconciliation_runs"
ADD COLUMN IF NOT EXISTS "pending_count" integer DEFAULT 0 NOT NULL;

ALTER TABLE "finance_cod_reconciliation_runs"
ADD COLUMN IF NOT EXISTS "discrepancy_count" integer DEFAULT 0 NOT NULL;

ALTER TABLE "finance_cod_reconciliation_runs"
ADD COLUMN IF NOT EXISTS "errors" jsonb DEFAULT '{}'::jsonb NOT NULL;

ALTER TABLE "finance_cod_reconciliation"
ADD COLUMN IF NOT EXISTS "awb_number" text;

ALTER TABLE "finance_cod_reconciliation"
ADD COLUMN IF NOT EXISTS "cod_amount_paise" integer DEFAULT 0 NOT NULL;

ALTER TABLE "finance_cod_reconciliation"
ADD COLUMN IF NOT EXISTS "cod_fee_rate_bps" integer;

ALTER TABLE "finance_cod_reconciliation"
ADD COLUMN IF NOT EXISTS "cod_fee_flat_paise" integer;

ALTER TABLE "finance_cod_reconciliation"
ADD COLUMN IF NOT EXISTS "expected_remittance_paise" integer DEFAULT 0 NOT NULL;

ALTER TABLE "finance_cod_reconciliation"
ADD COLUMN IF NOT EXISTS "delivery_date" timestamp;

ALTER TABLE "finance_cod_reconciliation"
ADD COLUMN IF NOT EXISTS "remitted_at" timestamp;

ALTER TABLE "finance_cod_reconciliation"
ADD COLUMN IF NOT EXISTS "proof_file_url" text;

UPDATE "finance_cod_reconciliation"
SET
    "cod_amount_paise" = COALESCE("cod_amount_paise", "expected_amount_paise", 0),
    "expected_remittance_paise" = COALESCE("expected_remittance_paise", "expected_amount_paise", 0),
    "remitted_at" = COALESCE("remitted_at", "remittance_date"::timestamp),
    "status" = CASE
        WHEN "status" IN ('short', 'missing', 'delayed', 'excess', 'review') THEN 'discrepancy'
        WHEN "status" = 'matched' THEN 'matched'
        ELSE COALESCE("status", 'pending')
    END;

INSERT INTO "platform_settings" ("key", "value", "description")
VALUES (
    'cod_match_tolerance_paise',
    '{"value":1000}'::jsonb,
    'Tolerance for COD remittance matching in paise'
)
ON CONFLICT ("key") DO NOTHING;

CREATE UNIQUE INDEX IF NOT EXISTS "finance_cod_reconciliation_awb_idx"
ON "finance_cod_reconciliation" ("awb_number");
