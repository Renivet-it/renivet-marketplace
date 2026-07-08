ALTER TABLE "audit_logs"
ADD COLUMN IF NOT EXISTS "actor_type" text;

ALTER TABLE "audit_logs"
ADD COLUMN IF NOT EXISTS "attachment_url" text;

CREATE INDEX IF NOT EXISTS "audit_log_actor_type_idx"
ON "audit_logs" ("actor_type");

UPDATE "audit_logs"
SET "actor_type" = CASE
    WHEN "user_id" IS NULL OR "user_id" IN ('system', 'cron') OR "user_id" LIKE '%webhook%' THEN 'system'
    WHEN "user_id" LIKE 'brand_%' THEN 'brand'
    WHEN "user_id" LIKE 'cust_%' THEN 'customer'
    ELSE 'admin'
END
WHERE "actor_type" IS NULL;

UPDATE "audit_logs"
SET "attachment_url" = COALESCE(
    NULLIF("metadata" ->> 'attachmentUrl', ''),
    NULLIF("metadata" ->> 'proofFileUrl', ''),
    NULLIF("metadata" ->> 'fileUrl', '')
)
WHERE "attachment_url" IS NULL;

CREATE OR REPLACE FUNCTION prevent_audit_logs_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'audit_logs is append-only and cannot be %', TG_OP;
END;
$$;

DROP TRIGGER IF EXISTS audit_logs_prevent_mutation ON "audit_logs";

CREATE TRIGGER audit_logs_prevent_mutation
BEFORE UPDATE OR DELETE ON "audit_logs"
FOR EACH ROW
EXECUTE FUNCTION prevent_audit_logs_mutation();

REVOKE UPDATE, DELETE ON TABLE "audit_logs" FROM PUBLIC;
