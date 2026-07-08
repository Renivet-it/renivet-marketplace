ALTER TABLE "user_consents"
ADD COLUMN IF NOT EXISTS "consent_given" boolean DEFAULT true NOT NULL;

ALTER TABLE "user_consents"
ADD COLUMN IF NOT EXISTS "consent_given_at" timestamp DEFAULT now() NOT NULL;

ALTER TABLE "user_consents"
ADD COLUMN IF NOT EXISTS "consent_version" text;

ALTER TABLE "user_consents"
ADD COLUMN IF NOT EXISTS "ip_address" text;

ALTER TABLE "user_consents"
ADD COLUMN IF NOT EXISTS "user_agent" text;

UPDATE "user_consents"
SET
    "consent_given" = COALESCE("consent_given", "is_granted", true),
    "consent_given_at" = COALESCE("consent_given_at", "granted_at", now()),
    "consent_version" = COALESCE("consent_version", "version", 'privacy-policy-v1')
WHERE
    "consent_version" IS NULL;

ALTER TABLE "user_consents"
ALTER COLUMN "consent_version" SET NOT NULL;

CREATE INDEX IF NOT EXISTS "user_consents_type_idx"
ON "user_consents" ("user_id", "consent_type");

ALTER TABLE "data_deletion_requests"
ADD COLUMN IF NOT EXISTS "user_email" text;

ALTER TABLE "data_deletion_requests"
ADD COLUMN IF NOT EXISTS "requested_at" timestamp DEFAULT now() NOT NULL;

ALTER TABLE "data_deletion_requests"
ADD COLUMN IF NOT EXISTS "identity_verified_at" timestamp;

ALTER TABLE "data_deletion_requests"
ADD COLUMN IF NOT EXISTS "completed_at" timestamp;

ALTER TABLE "data_deletion_requests"
ADD COLUMN IF NOT EXISTS "deletion_scope" jsonb DEFAULT '{}'::jsonb NOT NULL;

ALTER TABLE "data_deletion_requests"
ADD COLUMN IF NOT EXISTS "retention_scope" jsonb DEFAULT '{}'::jsonb NOT NULL;

ALTER TABLE "data_deletion_requests"
ADD COLUMN IF NOT EXISTS "executed_by" text;

ALTER TABLE "data_deletion_requests"
ADD COLUMN IF NOT EXISTS "rejection_reason" text;

ALTER TABLE "data_deletion_requests"
ADD COLUMN IF NOT EXISTS "notes" text;

ALTER TABLE "data_deletion_requests"
ADD COLUMN IF NOT EXISTS "verification_token" text;

ALTER TABLE "data_deletion_requests"
ADD COLUMN IF NOT EXISTS "verification_expires_at" timestamp;

UPDATE "data_deletion_requests"
SET
    "user_email" = COALESCE("user_email", "requested_by_email", ''),
    "requested_at" = COALESCE("requested_at", "created_at", now()),
    "completed_at" = COALESCE("completed_at", "executed_at"),
    "executed_by" = COALESCE("executed_by", "reviewed_by"),
    "notes" = COALESCE("notes", "reason")
WHERE
    "user_email" IS NULL
    OR "user_email" = '';

UPDATE "data_deletion_requests"
SET "status" = CASE
    WHEN "status" = 'requested' THEN 'identity_check'
    WHEN "status" = 'approved' THEN 'pending'
    WHEN "status" = 'processing' THEN 'in_progress'
    WHEN "status" = 'failed' THEN 'rejected'
    ELSE "status"
END;

ALTER TABLE "data_deletion_requests"
ALTER COLUMN "user_email" SET NOT NULL;

CREATE INDEX IF NOT EXISTS "data_deletion_requests_verification_idx"
ON "data_deletion_requests" ("verification_token");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'data_deletion_requests_executed_by_users_id_fk'
    ) THEN
        ALTER TABLE "data_deletion_requests"
        ADD CONSTRAINT "data_deletion_requests_executed_by_users_id_fk"
        FOREIGN KEY ("executed_by") REFERENCES "users"("id") ON DELETE SET NULL;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS "breach_incidents" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "detected_at" timestamp DEFAULT now() NOT NULL,
    "scope" text,
    "users_affected" integer,
    "root_cause" text,
    "notified_at" timestamp,
    "remediation_steps" jsonb DEFAULT '[]'::jsonb NOT NULL,
    "notes" text,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);
