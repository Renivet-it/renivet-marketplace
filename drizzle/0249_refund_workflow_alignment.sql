ALTER TABLE "refunds"
ALTER COLUMN "reason_code" TYPE uuid
USING (
    CASE
        WHEN "reason_code" IS NULL THEN NULL
        WHEN "reason_code" ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
            THEN "reason_code"::uuid
        ELSE NULL
    END
);

ALTER TABLE "refunds"
ADD COLUMN IF NOT EXISTS "cost_allocation" text;

ALTER TABLE "refunds"
ADD COLUMN IF NOT EXISTS "notes" text;

ALTER TABLE "refunds"
ADD COLUMN IF NOT EXISTS "return_shipping_paid_by" text;

ALTER TABLE "refunds"
ADD COLUMN IF NOT EXISTS "return_received_at" timestamp;

ALTER TABLE "refunds"
ADD COLUMN IF NOT EXISTS "return_qc_status" text;

UPDATE "refunds"
SET
    "cost_allocation" = COALESCE(
        "cost_allocation",
        CASE
            WHEN "policy_bucket" = 'courier_fault' THEN 'carrier_fault'
            ELSE "policy_bucket"
        END
    ),
    "notes" = COALESCE("notes", "reason_notes"),
    "return_shipping_paid_by" = COALESCE(
        "return_shipping_paid_by",
        CASE
            WHEN COALESCE("cost_allocation", "policy_bucket") = 'customer_fault' THEN 'customer'
            WHEN COALESCE("cost_allocation", "policy_bucket") IN ('carrier_fault', 'courier_fault') THEN 'na'
            WHEN COALESCE("cost_allocation", "policy_bucket") IS NULL THEN NULL
            ELSE 'renivet'
        END
    ),
    "return_qc_status" = COALESCE(
        "return_qc_status",
        CASE
            WHEN COALESCE("cost_allocation", "policy_bucket") IN ('carrier_fault', 'courier_fault') THEN 'na'
            ELSE 'pending'
        END
    ),
    "status" = CASE
        WHEN "approval_status" = 'pending' AND "status" = 'pending' THEN 'awaiting_approval'
        WHEN "approval_status" = 'rejected' THEN 'rejected'
        ELSE "status"
    END,
    "policy_bucket" = CASE
        WHEN "policy_bucket" = 'courier_fault' THEN 'carrier_fault'
        ELSE "policy_bucket"
    END;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'refunds_reason_code_reason_master_id_fkey'
    ) THEN
        ALTER TABLE "refunds"
        ADD CONSTRAINT "refunds_reason_code_reason_master_id_fkey"
        FOREIGN KEY ("reason_code") REFERENCES "reason_master"("id")
        ON DELETE SET NULL;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'refunds_cost_allocation_check'
    ) THEN
        ALTER TABLE "refunds"
        ADD CONSTRAINT "refunds_cost_allocation_check"
        CHECK ("cost_allocation" IN ('brand_fault', 'customer_fault', 'renivet_fault', 'carrier_fault'));
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'refunds_return_shipping_paid_by_check'
    ) THEN
        ALTER TABLE "refunds"
        ADD CONSTRAINT "refunds_return_shipping_paid_by_check"
        CHECK ("return_shipping_paid_by" IN ('renivet', 'customer', 'na'));
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'refunds_return_qc_status_check'
    ) THEN
        ALTER TABLE "refunds"
        ADD CONSTRAINT "refunds_return_qc_status_check"
        CHECK ("return_qc_status" IN ('pending', 'passed', 'failed', 'na'));
    END IF;
END $$;
