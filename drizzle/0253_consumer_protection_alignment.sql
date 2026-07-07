ALTER TABLE "legal_contacts"
ADD COLUMN IF NOT EXISTS "role" text;

ALTER TABLE "legal_contacts"
ADD COLUMN IF NOT EXISTS "effective_from" date DEFAULT CURRENT_DATE NOT NULL;

ALTER TABLE "legal_contacts"
ADD COLUMN IF NOT EXISTS "updated_by" text;

UPDATE "legal_contacts"
SET "role" = CASE
    WHEN COALESCE("role", '') <> '' THEN "role"
    WHEN "contact_type" IN ('gro', 'dpo', 'nodal_officer', 'compliance_officer') THEN "contact_type"
    WHEN "contact_type" = 'grievance_officer' THEN 'gro'
    ELSE 'compliance_officer'
END
WHERE "role" IS NULL;

UPDATE "legal_contacts"
SET "email" = COALESCE("email", 'support@renivet.com')
WHERE "email" IS NULL;

ALTER TABLE "legal_contacts"
ALTER COLUMN "role" SET NOT NULL;

ALTER TABLE "legal_contacts"
ALTER COLUMN "email" SET NOT NULL;

CREATE INDEX IF NOT EXISTS "legal_contacts_role_idx"
ON "legal_contacts" ("role", "is_active");

CREATE INDEX IF NOT EXISTS "legal_contacts_effective_from_idx"
ON "legal_contacts" ("effective_from");

CREATE INDEX IF NOT EXISTS "legal_contacts_updated_by_idx"
ON "legal_contacts" ("updated_by");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'legal_contacts_updated_by_users_id_fk'
    ) THEN
        ALTER TABLE "legal_contacts"
        ADD CONSTRAINT "legal_contacts_updated_by_users_id_fk"
        FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL;
    END IF;
END $$;
